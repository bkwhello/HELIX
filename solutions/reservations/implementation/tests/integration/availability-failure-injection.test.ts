import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import type { PrismaClient } from "@prisma/client";
import { buildHarness, resetDatabase } from "./support/testHarness.js";
import { Actor, ActorKind, ActorRole } from "../../domain/value-objects/Actor.js";
import { ReservationSourceCategory } from "../../domain/value-objects/ReservationSource.js";
import { CreateReservationRequest } from "../../application/command-handlers/CreateReservationHandler.js";
import { createTestPrismaClient } from "./support/testDatabaseSafety.js";

/**
 * CAP-D02.03 §"failure-injection tests" — both mandatory scenarios,
 * proved against real PostgreSQL:
 *  1. fail AFTER the capacity mutation, BEFORE reservation persistence
 *  2. fail AFTER the reservation mutation, BEFORE the idempotency marker
 * Both must prove full rollback — no partial state survives.
 */
const prisma = createTestPrismaClient();

const staffActor: Actor = { id: "staff-1", kind: ActorKind.AuthorizedUser, role: ActorRole.Reception };
const NOW = new Date("2026-08-10T10:00:00Z");

/** A real, valid CAP-D05.01 Contact these tests can reference by id — capacity failure injection is what's under test here, not contact behavior. */
async function seedContact(id: string): Promise<void> {
  await prisma.contact.create({
    data: { id, displayName: "Failure Injection Guest", phoneRaw: "0600000000", phoneNormalized: "+31600000000", createdBy: "staff-1", lastRelevantActivityAt: NOW },
  });
}

beforeAll(async () => {
  await resetDatabase(prisma);
});
afterAll(async () => {
  await prisma.$disconnect();
});
beforeEach(async () => {
  await resetDatabase(prisma);
  await seedContact("contact-1");
});

describe("Failure injection — fail AFTER capacity mutation, BEFORE reservation persistence", () => {
  it("rolls back the capacity commitment write when the downstream CAP-D01.01 contact validation rejects the request", async () => {
    // AvailabilityOrchestrator.createWithCapacity writes the capacity
    // commitment BEFORE calling CreateReservationHandler.handle() (see
    // that method's ordering) — CreateReservationHandler's own contact
    // check (step 4) runs after that and, forced to fail here, throws
    // OrchestratedValidationFailure from inside the same transaction.
    const { orchestrator } = buildHarness(prisma, NOW);

    const result = await orchestrator.createWithCapacity({
      commandId: "fail-injection-cmd-1",
      servicePeriodId: "sp-dinner",
      contactSelection: { type: "ExistingContact", contactId: "nonexistent-contact" },
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
          contactSelection: { type: "ExistingContact", contactId: "contact-1" },
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

/**
 * R1.1 P0 fix — failure injection around the corrected modifyWithCapacity
 * flow (§13 of the fix assignment). Both prove full rollback: the
 * original commitment must still be Committed, exactly as it was before
 * the call, with no orphaned Superseded/duplicate rows.
 */
async function seedModifiableReservation(prismaClient: PrismaClient, now: Date): Promise<string> {
  const { orchestrator } = buildHarness(prismaClient, now);
  const request: CreateReservationRequest = {
    commandId: `mm-fi-seed-${Math.random().toString(36).slice(2)}`,
    servicePeriodId: "sp-dinner",
    contactSelection: { type: "ExistingContact", contactId: "contact-1" },
    reservationDate: new Date("2026-08-20T18:00:00Z"),
    partySize: 4,
    source: { category: ReservationSourceCategory.Telephone },
    preferredArea: "Sushi",
    actor: staffActor,
  };
  const created = await orchestrator.createWithCapacity(request);
  if (created.type !== "CREATED") throw new Error(`seed failed: ${created.type}`);
  return created.outcome.reservationId;
}

describe("Failure injection — Modify: fail AFTER active-commitment re-read, BEFORE supersession", () => {
  // A real (deliberately non-production) temporary CHECK constraint that
  // forbids the "Superseded" status value, so the orchestrator's own
  // updateStatus(...) call — which runs immediately after the
  // in-transaction re-read of the active commitment — hits a genuine
  // Postgres constraint violation at exactly that point.
  const POISON_CONSTRAINT = "test_only_forbid_superseded_status";

  it("rolls back the whole transaction: the original commitment remains Committed, unchanged", async () => {
    const reservationId = await seedModifiableReservation(prisma, NOW);
    const before = await prisma.capacityCommitment.findFirst({ where: { reservationId } });
    if (!before) throw new Error("test setup failed");

    await prisma.$executeRawUnsafe(`ALTER TABLE "capacity_commitments" ADD CONSTRAINT "${POISON_CONSTRAINT}" CHECK ("status" <> 'Superseded')`);
    try {
      const { orchestrator } = buildHarness(prisma, NOW);
      await expect(
        orchestrator.modifyWithCapacity({
          commandId: "mm-fi-supersede-cmd",
          reservationId,
          actor: staffActor,
          changes: { partySize: 5 },
        })
      ).rejects.toThrow();

      const rows = await prisma.capacityCommitment.findMany({ where: { reservationId } });
      expect(rows).toHaveLength(1); // no new row created, nothing else touched
      expect(rows[0]?.commitmentId).toBe(before.commitmentId);
      expect(rows[0]?.status).toBe("Committed"); // never actually transitioned, despite the update being attempted
      expect(rows[0]?.partySize).toBe(before.partySize); // untouched — the party-size change never took effect

      const reservation = await prisma.reservation.findUniqueOrThrow({ where: { id: reservationId } });
      expect(reservation.partySize).toBe(4); // original value, Reservation write also rolled back
    } finally {
      await prisma.$executeRawUnsafe(`ALTER TABLE "capacity_commitments" DROP CONSTRAINT IF EXISTS "${POISON_CONSTRAINT}"`);
    }
  });
});

describe("Failure injection — Modify: fail AFTER new commitment insert, BEFORE Reservation persistence", () => {
  it("rolls back the whole transaction when the Reservation-side domain validation rejects the change after the new commitment was already inserted", async () => {
    const reservationId = await seedModifiableReservation(prisma, NOW);
    const before = await prisma.capacityCommitment.findFirst({ where: { reservationId } });
    if (!before) throw new Error("test setup failed");

    // Directly (outside the orchestrator, already-committed BEFORE this
    // test's actual call) mark the Reservation row Cancelled — a terminal
    // status. This is the test's injection lever: nothing in
    // modifyWithCapacity checks Reservation status before the capacity
    // work (evaluateBookingPolicy, the lock, capacity evaluation, and the
    // new commitment insert all run first, all succeed on valid values),
    // so execution reaches capacityRepository.create() successfully —
    // then ModifyReservationHandler.handle() -> ReservationAggregate.modify()
    // enforces CAP-D01.01-R16 (terminal reservations are not normally
    // modifiable) and rejects it, exactly after the new commitment insert
    // and before any Reservation write for this call.
    await prisma.reservation.update({ where: { id: reservationId }, data: { status: "Cancelled" } });

    const { orchestrator } = buildHarness(prisma, NOW);
    const result = await orchestrator.modifyWithCapacity({
      commandId: "mm-fi-terminal-cmd",
      reservationId,
      actor: staffActor,
      changes: { partySize: 6 },
    });

    expect(result.type).toBe("VALIDATION_FAILED");
    if (result.type === "VALIDATION_FAILED") {
      expect(result.violations.some((v) => v.ruleId === "CAP-D01.01-R16")).toBe(true);
    }

    const rows = await prisma.capacityCommitment.findMany({ where: { reservationId } });
    expect(rows).toHaveLength(1); // the tentative new commitment must not survive
    expect(rows[0]?.commitmentId).toBe(before.commitmentId);
    expect(rows[0]?.status).toBe("Committed"); // never superseded — rolled back alongside the failed insert
    expect(rows[0]?.partySize).toBe(4); // the attempted change (6) never took effect

    const reservation = await prisma.reservation.findUniqueOrThrow({ where: { id: reservationId } });
    expect(reservation.partySize).toBe(4); // unchanged by this call
    expect(reservation.status).toBe("Cancelled"); // the pre-existing condition from test setup, not a rollback artifact
  });
});
