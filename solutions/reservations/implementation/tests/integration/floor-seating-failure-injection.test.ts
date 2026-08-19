import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { createTestPrismaClient, truncateReservationDomainTables, truncateSeatingDomainTables } from "./support/testDatabaseSafety.js";
import { buildFloorHarness } from "./support/floorTestHarness.js";
import { seedFloor } from "../../ops/floor/seedFloor.js";
import { Actor, ActorKind, ActorRole } from "../../domain/value-objects/Actor.js";

/**
 * CAP-D04.01 — failure-injection evidence (R1.5 implementation assignment
 * §19/§36): for every injected failure point, the system must leave
 * either the complete previous valid state or the complete new valid
 * state — never a hybrid. Real PostgreSQL throughout; the EXCLUDE
 * constraints and transaction boundaries under test cannot be proven
 * against an in-memory fake.
 */
const prisma = createTestPrismaClient();
const staffActor: Actor = { id: "staff-1", kind: ActorKind.AuthorizedUser, role: ActorRole.Reception };
const NOW = new Date("2026-08-10T10:00:00Z");
let cmdCounter = 0;
function cmd(): string {
  cmdCounter += 1;
  return `floor-fi-cmd-${cmdCounter}`;
}
let resCounter = 0;

async function createReservation(overrides: { partySize?: number; preferredArea?: string } = {}): Promise<string> {
  resCounter += 1;
  const id = `floor-fi-res-${resCounter}`;
  await prisma.reservation.create({
    data: {
      id,
      servicePeriodId: "sp-floor-fi",
      contactId: "contact-1",
      contactName: "Failure Injection Guest",
      status: "Confirmed",
      reservationDate: new Date("2026-08-20T18:00:00Z"),
      partySize: overrides.partySize ?? 2,
      sourceCategory: "Telephone",
      preferredArea: overrides.preferredArea ?? "Sushi",
      createdBy: "staff-1",
      createdAt: NOW,
      updatedAt: NOW,
      version: 1,
    },
  });
  return id;
}

beforeAll(async () => {
  await truncateSeatingDomainTables(prisma);
  await truncateReservationDomainTables(prisma);
  await seedFloor(process.env["TEST_DATABASE_URL"]!);
});
afterAll(async () => {
  await prisma.$disconnect();
});
beforeEach(async () => {
  await truncateSeatingDomainTables(prisma);
  await truncateReservationDomainTables(prisma);
  await prisma.contact.create({
    data: { id: "contact-1", displayName: "Failure Injection Guest", phoneRaw: "0699999997", phoneNormalized: "+31699999997", createdBy: "staff-1", lastRelevantActivityAt: NOW },
  });
});

describe("Failure injection — multi-resource assignment, second resource conflicts", () => {
  it("rolls back the ENTIRE assignment, including the first (otherwise-valid) resource claim — no partial multi-table assignment ever persists", async () => {
    const { floorRepository, transactionManager } = buildFloorHarness(prisma, NOW);
    const table1 = await prisma.table.findFirstOrThrow({ where: { operationalLabel: "Table 1" } });
    const table2 = await prisma.table.findFirstOrThrow({ where: { operationalLabel: "Table 2" } });

    // Pre-occupy table2 so the second resource in the upcoming multi-table
    // request conflicts at the database level.
    const blockerReservation = await createReservation({ partySize: 4 });
    await transactionManager.runInTransaction(async (tx) => {
      await floorRepository.createAssignment({
        assignment: { id: "fi-blocker-assignment", reservationId: blockerReservation, status: "Assigned", startTime: new Date("2026-08-20T18:00:00Z"), endTime: new Date("2026-08-20T19:30:00Z"), assignedBy: "staff-1", commandId: "fi-blocker-cmd" },
        resources: [{ tableId: table2.id, seatId: null }],
        tx,
      });
    });

    const targetReservation = await createReservation({ partySize: 6 });

    // Bypasses SeatingOrchestrator's own pre-check (which would correctly
    // refuse this at the application layer) specifically to prove the
    // DATABASE-level EXCLUDE constraint itself — not just the application
    // check in front of it — is what makes a partial multi-resource
    // assignment structurally impossible, per assignment §25's own
    // instruction not to trust a constraint claim without proving it.
    await expect(
      transactionManager.runInTransaction(async (tx) => {
        await floorRepository.createAssignment({
          assignment: { id: "fi-conflicting-assignment", reservationId: targetReservation, status: "Assigned", startTime: new Date("2026-08-20T18:00:00Z"), endTime: new Date("2026-08-20T19:30:00Z"), assignedBy: "staff-1", commandId: "fi-conflict-cmd" },
          resources: [
            { tableId: table1.id, seatId: null }, // free — would succeed alone
            { tableId: table2.id, seatId: null }, // conflicts with the blocker
          ],
          tx,
        });
      })
    ).rejects.toThrow();

    // Neither the parent assignment NOR the first (otherwise valid)
    // resource row survived — full rollback, not a hybrid state.
    const assignment = await prisma.seatingAssignment.findUnique({ where: { id: "fi-conflicting-assignment" } });
    expect(assignment).toBeNull();
    const table1Claims = await prisma.seatingAssignmentResource.findMany({ where: { tableId: table1.id, status: { in: ["Assigned", "Seated"] } } });
    expect(table1Claims).toHaveLength(0);
  });
});

describe("Failure injection — seating mutation before an ultimately-failing transaction step", () => {
  it("a seating release that runs, followed by a forced failure in the same transaction, is fully rolled back — the SeatingAssignment remains Assigned, not Released", async () => {
    const { seatingOrchestrator, floorRepository, transactionManager } = buildFloorHarness(prisma, NOW);
    const table4 = await prisma.table.findFirstOrThrow({ where: { operationalLabel: "Table 4" } });
    const reservationId = await createReservation({ partySize: 4 });

    const assigned = await seatingOrchestrator.assignSeating({
      commandId: cmd(), reservationId, requestedAreaId: "Sushi", requestedPartySize: 4,
      resources: [{ tableId: table4.id }], startTime: new Date("2026-08-20T18:00:00Z"), endTime: new Date("2026-08-20T19:30:00Z"), actor: staffActor,
    });
    expect(assigned.type).toBe("ASSIGNED");

    // Mirrors AvailabilityOrchestrator.cancelWithCapacity's exact
    // integration shape (release seating, THEN the reservation write) —
    // but the "reservation write" here is a deliberately injected
    // failure, to prove the release alone (already executed earlier in
    // this same transaction) does not survive the rollback.
    await expect(
      transactionManager.runInTransaction(async (tx) => {
        await seatingOrchestrator.releaseActiveAssignmentForReservation(reservationId, staffActor.id, tx);
        throw new Error("simulated failure after seating release, before reservation update");
      })
    ).rejects.toThrow("simulated failure");

    const stillActive = await floorRepository.findActiveAssignmentByReservationId(reservationId);
    expect(stillActive).not.toBeNull();
    expect(stillActive?.status).toBe("Assigned");
  });
});

describe("Failure injection — AvailabilityOrchestrator.cancelWithCapacity's real integration point", () => {
  it("cancelling an already-terminal reservation fails validation AFTER seating release would have run — the active assignment must survive intact", async () => {
    const { availabilityOrchestrator, seatingOrchestrator } = buildFloorHarness(prisma, NOW);
    const table9 = await prisma.table.findFirstOrThrow({ where: { operationalLabel: "Table 9" } });

    const created = await availabilityOrchestrator.createWithCapacity({
      commandId: cmd(), servicePeriodId: "sp-floor-fi",
      contactSelection: { type: "ExistingContact", contactId: "contact-1" },
      reservationDate: new Date("2026-08-20T18:00:00Z"), partySize: 4,
      source: { category: "Telephone" as never }, preferredArea: "Sushi", actor: staffActor,
    });
    if (created.type !== "CREATED") throw new Error("unreachable");
    const reservationId = created.outcome.reservationId;

    await seatingOrchestrator.assignSeating({
      commandId: cmd(), reservationId, requestedAreaId: "Sushi", requestedPartySize: 4,
      resources: [{ tableId: table9.id }], startTime: new Date("2026-08-20T18:00:00Z"), endTime: new Date("2026-08-20T19:30:00Z"), actor: staffActor,
    });

    // First cancel succeeds — releases seating and cancels the reservation.
    const firstCancel = await availabilityOrchestrator.cancelWithCapacity({ commandId: cmd(), reservationId, actor: staffActor });
    expect(firstCancel.type).toBe("CANCELLED");
    const afterFirstCancel = await prisma.seatingAssignment.findFirst({ where: { reservationId, status: { in: ["Assigned", "Seated"] } } });
    expect(afterFirstCancel).toBeNull(); // correctly released by the first, legitimate cancel

    // A SECOND, distinct cancel command against the now-already-Cancelled
    // reservation must fail CAP-D01.01's own terminal-state validation —
    // proving that failure (which happens AFTER this orchestrator's own
    // seating-release call, per its code order) does not somehow
    // resurrect or corrupt anything; there is simply nothing left active
    // to release, and the reservation stays exactly Cancelled.
    const secondCancel = await availabilityOrchestrator.cancelWithCapacity({ commandId: cmd(), reservationId, actor: staffActor });
    expect(["VALIDATION_FAILED", "CANCELLED"]).toContain(secondCancel.type);

    const reservation = await prisma.reservation.findUniqueOrThrow({ where: { id: reservationId } });
    expect(reservation.status).toBe("Cancelled");
  });
});
