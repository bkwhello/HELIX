import { PrismaClient } from "@prisma/client";
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { buildHarness, resetDatabase } from "./support/testHarness.js";
import { ContactReader } from "../../application/ports/ContactReader.js";
import { Actor, ActorKind, ActorRole } from "../../domain/value-objects/Actor.js";
import { ReservationSourceCategory } from "../../domain/value-objects/ReservationSource.js";

/**
 * CAP-D02.03 §"failure-injection tests" — both mandatory scenarios,
 * proved against real PostgreSQL:
 *  1. fail AFTER the capacity mutation, BEFORE reservation persistence
 *  2. fail AFTER the reservation mutation, BEFORE the idempotency marker
 * Both must prove full rollback — no partial state survives.
 */
const prisma = new PrismaClient();

const staffActor: Actor = { id: "staff-1", kind: ActorKind.AuthorizedUser, role: ActorRole.Reception };
const NOW = new Date("2026-08-10T10:00:00Z");

class AlwaysFailsContactReader implements ContactReader {
  async exists(): Promise<boolean> {
    return false;
  }
}

beforeAll(async () => {
  await resetDatabase(prisma);
});
afterAll(async () => {
  await prisma.$disconnect();
});
beforeEach(async () => {
  await resetDatabase(prisma);
});

describe("Failure injection — fail AFTER capacity mutation, BEFORE reservation persistence", () => {
  it("rolls back the capacity commitment write when the downstream CAP-D01.01 contact validation rejects the request", async () => {
    // AvailabilityOrchestrator.createWithCapacity writes the capacity
    // commitment BEFORE calling CreateReservationHandler.handle() (see
    // that method's ordering) — CreateReservationHandler's own contact
    // check (step 4) runs after that and, forced to fail here, throws
    // OrchestratedValidationFailure from inside the same transaction.
    const failingContactReader = new AlwaysFailsContactReader();
    const { orchestrator } = buildHarness(prisma, NOW, { contactReader: failingContactReader });

    const result = await orchestrator.createWithCapacity({
      commandId: "fail-injection-cmd-1",
      servicePeriodId: "sp-dinner",
      contactId: "nonexistent-contact",
      reservationDate: new Date("2026-08-20T18:00:00Z"),
      partySize: 6,
      source: { category: ReservationSourceCategory.Telephone },
      preferredArea: "Sushi",
      actor: staffActor,
    });

    expect(result.type).toBe("VALIDATION_FAILED");

    const commitments = await prisma.capacityCommitment.findMany();
    expect(commitments).toHaveLength(0); // the tentative capacity write must not survive
    const reservations = await prisma.reservation.findMany();
    expect(reservations).toHaveLength(0);
    const appliedCommands = await prisma.appliedCommand.findMany();
    expect(appliedCommands).toHaveLength(0);
  });
});

describe("Failure injection — fail AFTER reservation mutation, BEFORE the idempotency marker", () => {
  // reservation_events.id is an unpredictable @default(cuid()) — never
  // set explicitly by application code (see PrismaReservationRepository's
  // reservationEvent.create() call) — so it cannot be collided with
  // directly. Instead this temporarily adds a real Postgres constraint
  // that is deliberately NOT part of the production schema (a single
  // reservation legitimately gets more than one event type over its
  // lifetime; this constraint is artificially strict) purely to create a
  // controllable, genuine failure at exactly the point between the
  // reservation write and the AppliedCommand write. Added and dropped
  // within this one test (try/finally) so it cannot affect any other
  // test file sharing this database.
  const POISON_CONSTRAINT = "test_only_one_reservationcreated_event_globally";

  it("rolls back BOTH the capacity commitment and the reservation write when the event insert (which runs after the reservation write but before the AppliedCommand insert) hits a real constraint violation", async () => {
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "reservation_events" ADD CONSTRAINT "${POISON_CONSTRAINT}" UNIQUE ("type")`
    );
    try {
      // A dummy reservation + its own "ReservationCreated" event, so the
      // REAL request's own "ReservationCreated" event insert (which
      // happens only after ITS OWN reservation write already succeeded,
      // inside the same shared transaction) collides against this
      // pre-existing row under the temporary constraint above.
      await prisma.reservation.create({
        data: {
          id: "dummy-poison-reservation",
          servicePeriodId: "sp-dinner",
          contactId: "contact-1",
          status: "Proposed",
          reservationDate: new Date("2026-08-01T18:00:00Z"),
          partySize: 2,
          sourceCategory: "Telephone",
          createdBy: "staff-1",
          createdAt: NOW,
          updatedAt: NOW,
        },
      });
      await prisma.reservationEvent.create({
        data: { reservationId: "dummy-poison-reservation", type: "ReservationCreated", occurredAt: NOW, payload: "{}" },
      });

      const { orchestrator } = buildHarness(prisma, NOW);

      // A genuine, unexpected infrastructure fault (not a recognized
      // domain outcome), so it propagates as a thrown error rather than a
      // Result — proving it is NOT silently reinterpreted as an
      // idempotent replay (this is a "type" collision, a different
      // constraint than AppliedCommand.commandId; see
      // PrismaReservationRepository's isCommandIdConflict check) is
      // itself part of what this test demonstrates, alongside the
      // rollback below.
      await expect(
        orchestrator.createWithCapacity({
          commandId: "fail-injection-cmd-2",
          servicePeriodId: "sp-dinner",
          contactId: "contact-1",
          reservationDate: new Date("2026-08-20T18:00:00Z"),
          partySize: 6,
          source: { category: ReservationSourceCategory.Telephone },
          preferredArea: "Sushi",
          actor: staffActor,
        })
      ).rejects.toThrow();

      const commitments = await prisma.capacityCommitment.findMany();
      expect(commitments).toHaveLength(0); // written earlier in the same transaction, must still roll back
      const realReservations = await prisma.reservation.findMany({ where: { id: { not: "dummy-poison-reservation" } } });
      expect(realReservations).toHaveLength(0); // the reservation write that preceded the colliding event insert must not survive
      const appliedCommands = await prisma.appliedCommand.findMany({ where: { commandId: "fail-injection-cmd-2" } });
      expect(appliedCommands).toHaveLength(0);

      // Sanity: the poison row itself is untouched — this was a real,
      // independent constraint violation, not test cross-contamination.
      const poisonEvents = await prisma.reservationEvent.findMany({ where: { reservationId: "dummy-poison-reservation" } });
      expect(poisonEvents).toHaveLength(1);
    } finally {
      await prisma.$executeRawUnsafe(`ALTER TABLE "reservation_events" DROP CONSTRAINT IF EXISTS "${POISON_CONSTRAINT}"`);
    }
  });
});
