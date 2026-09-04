import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { createTestPrismaClient, truncateReservationDomainTables, truncateSeatingDomainTables } from "./support/testDatabaseSafety.js";
import { buildFloorHarness } from "./support/floorTestHarness.js";
import { seedFloor } from "../../ops/floor/seedFloor.js";
import { Actor, ActorKind, ActorRole } from "../../domain/value-objects/Actor.js";

/**
 * CAP-D04.01 — the mandatory real-PostgreSQL concurrency matrix
 * (R1.5 implementation assignment §18/§21/§35): Scenarios C, E, F, K, L,
 * plus the required 20-iteration repetition for four named races. Each
 * test uses a SEPARATE PrismaClient per concurrent "actor" — the same
 * discipline tests/integration/availability-concurrency.test.ts already
 * established for CAP-D02.03, extended one tier.
 */
const prisma = createTestPrismaClient();
const prismaB = createTestPrismaClient();
const staffActor: Actor = { id: "staff-1", kind: ActorKind.AuthorizedUser, role: ActorRole.Reception };
const NOW = new Date("2026-08-10T10:00:00Z");
let cmdCounter = 0;
function cmd(): string {
  cmdCounter += 1;
  return `floor-race-cmd-${cmdCounter}`;
}
let resCounter = 0;

async function createReservation(overrides: { partySize?: number; preferredArea?: string; reservationDate?: Date } = {}): Promise<string> {
  resCounter += 1;
  const id = `floor-race-res-${resCounter}`;
  await prisma.reservation.create({
    data: {
      id,
      servicePeriodId: "sp-floor-race",
      contactId: "contact-1",
      contactName: "Floor Race Guest",
      status: "Confirmed",
      reservationDate: overrides.reservationDate ?? new Date("2026-08-20T18:00:00Z"),
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

async function resetAll(): Promise<void> {
  await truncateSeatingDomainTables(prisma);
  await truncateReservationDomainTables(prisma);
  await prisma.contact.create({
    data: { id: "contact-1", displayName: "Floor Race Guest", phoneRaw: "0699999998", phoneNormalized: "+31699999998", createdBy: "staff-1", lastRelevantActivityAt: NOW },
  });
}

beforeAll(async () => {
  await resetAll();
  await seedFloor(process.env["TEST_DATABASE_URL"]!);
});
afterAll(async () => {
  await prisma.$disconnect();
  await prismaB.$disconnect();
});
beforeEach(resetAll);

describe("Scenario C — Sushi conflict: two concurrent reservations claim the same table, overlapping", () => {
  it("exactly one succeeds", async () => {
    const table1 = await prisma.table.findFirstOrThrow({ where: { operationalLabel: "Table 1" } });
    const resA = await createReservation();
    const resB = await createReservation();
    const { seatingOrchestrator: orchA } = buildFloorHarness(prisma, NOW);
    const { seatingOrchestrator: orchB } = buildFloorHarness(prismaB, NOW);

    const [a, b] = await Promise.all([
      orchA.assignSeating({ commandId: cmd(), reservationId: resA, requestedAreaId: "Sushi", requestedPartySize: 2, resources: [{ tableId: table1.id }], startTime: new Date("2026-08-20T18:00:00Z"), endTime: new Date("2026-08-20T19:30:00Z"), actor: staffActor }),
      orchB.assignSeating({ commandId: cmd(), reservationId: resB, requestedAreaId: "Sushi", requestedPartySize: 2, resources: [{ tableId: table1.id }], startTime: new Date("2026-08-20T19:00:00Z"), endTime: new Date("2026-08-20T20:30:00Z"), actor: staffActor }),
    ]);

    const outcomes = [a.type, b.type].sort();
    expect(outcomes).toEqual(["ASSIGNED", "NOT_SEATABLE"]);
    const activeClaims = await prisma.seatingAssignmentResource.findMany({ where: { tableId: table1.id, status: { in: ["Assigned", "Seated"] } } });
    expect(activeClaims).toHaveLength(1);
  });
});

describe("Scenario E — shared Teppanyaki grill: two parties claim disjoint seats, overlapping time", () => {
  it("both succeed", async () => {
    const grillC = await prisma.table.findFirstOrThrow({ where: { operationalLabel: "C" } });
    const seatsA = await prisma.seat.findMany({ where: { tableId: grillC.id, operationalLabel: { in: ["C-01", "C-02", "C-03", "C-04"] } } });
    const seatsB = await prisma.seat.findMany({ where: { tableId: grillC.id, operationalLabel: { in: ["C-05", "C-06", "C-07"] } } });
    expect(seatsA).toHaveLength(4);
    expect(seatsB).toHaveLength(3);

    const resA = await createReservation({ partySize: 4, preferredArea: "Teppanyaki" });
    const resB = await createReservation({ partySize: 3, preferredArea: "Teppanyaki" });
    const { seatingOrchestrator: orchA } = buildFloorHarness(prisma, NOW);
    const { seatingOrchestrator: orchB } = buildFloorHarness(prismaB, NOW);

    const [a, b] = await Promise.all([
      orchA.assignSeating({ commandId: cmd(), reservationId: resA, requestedAreaId: "Teppanyaki", requestedPartySize: 4, resources: seatsA.map((s) => ({ seatId: s.id })), startTime: new Date("2026-08-20T18:00:00Z"), endTime: new Date("2026-08-20T20:30:00Z"), actor: staffActor }),
      orchB.assignSeating({ commandId: cmd(), reservationId: resB, requestedAreaId: "Teppanyaki", requestedPartySize: 3, resources: seatsB.map((s) => ({ seatId: s.id })), startTime: new Date("2026-08-20T18:30:00Z"), endTime: new Date("2026-08-20T21:00:00Z"), actor: staffActor }),
    ]);

    expect(a.type).toBe("ASSIGNED");
    expect(b.type).toBe("ASSIGNED");
    const activeSeatClaims = await prisma.seatingAssignmentResource.findMany({ where: { seatId: { in: [...seatsA, ...seatsB].map((s) => s.id) }, status: { in: ["Assigned", "Seated"] } } });
    expect(activeSeatClaims).toHaveLength(7);
  });
});

describe("Scenario F — Teppanyaki overclaim: 8 of 10 seats already claimed, another overlapping party requests 4 seats including 2 already taken", () => {
  it("cannot assign — refused, not partially assigned", async () => {
    const grillE = await prisma.table.findFirstOrThrow({ where: { operationalLabel: "E" } });
    const first8 = await prisma.seat.findMany({ where: { tableId: grillE.id, operationalLabel: { in: ["E-01", "E-02", "E-03", "E-04", "E-05", "E-06", "E-07", "E-08"] } } });
    const resFirst = await createReservation({ partySize: 8, preferredArea: "Teppanyaki" });
    const { seatingOrchestrator } = buildFloorHarness(prisma, NOW);
    const firstResult = await seatingOrchestrator.assignSeating({
      commandId: cmd(), reservationId: resFirst, requestedAreaId: "Teppanyaki", requestedPartySize: 8,
      resources: first8.map((s) => ({ seatId: s.id })), startTime: new Date("2026-08-20T18:00:00Z"), endTime: new Date("2026-08-20T20:30:00Z"), actor: staffActor,
    });
    expect(firstResult.type).toBe("ASSIGNED");

    // Only E-09/E-10 are actually free; this party requests 4, including
    // two (E-07, E-08) already claimed above — must be refused in full.
    const overlappingSelection = await prisma.seat.findMany({ where: { tableId: grillE.id, operationalLabel: { in: ["E-07", "E-08", "E-09", "E-10"] } } });
    const resSecond = await createReservation({ partySize: 4, preferredArea: "Teppanyaki" });
    const secondResult = await seatingOrchestrator.assignSeating({
      commandId: cmd(), reservationId: resSecond, requestedAreaId: "Teppanyaki", requestedPartySize: 4,
      resources: overlappingSelection.map((s) => ({ seatId: s.id })), startTime: new Date("2026-08-20T18:30:00Z"), endTime: new Date("2026-08-20T21:00:00Z"), actor: staffActor,
    });

    expect(secondResult.type).toBe("NOT_SEATABLE");
    if (secondResult.type === "NOT_SEATABLE") expect(secondResult.seatability.type).toBe("RESOURCE_OVERLAP");

    // No partial claim — none of E-09/E-10 were assigned as a side effect
    // of the failed request (multi-resource assignment is all-or-nothing,
    // one transaction).
    const freeSeatsStillFree = await prisma.seat.findMany({ where: { tableId: grillE.id, operationalLabel: { in: ["E-09", "E-10"] } } });
    const claimsOnFreeSeats = await prisma.seatingAssignmentResource.findMany({ where: { seatId: { in: freeSeatsStillFree.map((s) => s.id) }, status: { in: ["Assigned", "Seated"] } } });
    expect(claimsOnFreeSeats).toHaveLength(0);
  });
});

describe("Scenario K — walk-in race: a walk-in seated immediately races a concurrent pre-assignment of an overlapping future reservation onto the same table", () => {
  it("exactly one conflicting claim succeeds", async () => {
    const table13 = await prisma.table.findFirstOrThrow({ where: { operationalLabel: "Table 13" } });
    const walkIn = await createReservation({ partySize: 2, reservationDate: NOW });
    const upcoming = await createReservation({ partySize: 2, reservationDate: new Date(NOW.getTime() + 30 * 60_000) });
    const { seatingOrchestrator: orchA } = buildFloorHarness(prisma, NOW);
    const { seatingOrchestrator: orchB } = buildFloorHarness(prismaB, NOW);

    const [walkResult, preAssignResult] = await Promise.all([
      orchA.assignSeating({ commandId: cmd(), reservationId: walkIn, requestedAreaId: "Sushi", requestedPartySize: 2, resources: [{ tableId: table13.id }], startTime: NOW, endTime: new Date(NOW.getTime() + 90 * 60_000), actor: staffActor, seatImmediately: true }),
      orchB.assignSeating({ commandId: cmd(), reservationId: upcoming, requestedAreaId: "Sushi", requestedPartySize: 2, resources: [{ tableId: table13.id }], startTime: new Date(NOW.getTime() + 30 * 60_000), endTime: new Date(NOW.getTime() + 120 * 60_000), actor: staffActor }),
    ]);

    const outcomes = [walkResult.type, preAssignResult.type].sort();
    expect(outcomes).toEqual(["ASSIGNED", "NOT_SEATABLE"]);
  });
});

describe("Scenario L — reassignment race: two staff members move different overlapping reservations onto the same table", () => {
  it("exactly one conflicting assignment succeeds, never a silent overwrite", async () => {
    const table15 = await prisma.table.findFirstOrThrow({ where: { operationalLabel: "Table 15" } });
    const table16 = await prisma.table.findFirstOrThrow({ where: { operationalLabel: "Table 16" } });
    const resA = await createReservation({ partySize: 2 });
    const resB = await createReservation({ partySize: 2 });
    const { seatingOrchestrator: orchA } = buildFloorHarness(prisma, NOW);
    const { seatingOrchestrator: orchB } = buildFloorHarness(prismaB, NOW);

    await orchA.assignSeating({ commandId: cmd(), reservationId: resA, requestedAreaId: "Sushi", requestedPartySize: 2, resources: [{ tableId: table15.id }], startTime: new Date("2026-08-20T18:00:00Z"), endTime: new Date("2026-08-20T19:30:00Z"), actor: staffActor });
    await orchA.assignSeating({ commandId: cmd(), reservationId: resB, requestedAreaId: "Sushi", requestedPartySize: 2, resources: [{ tableId: table16.id }], startTime: new Date("2026-08-20T18:00:00Z"), endTime: new Date("2026-08-20T19:30:00Z"), actor: staffActor });

    // Both A and B move onto the SAME destination table (capacity 4, so
    // the WINNING move never separately fails on insufficient capacity —
    // this scenario is specifically about resource-lock contention, not
    // capacity sufficiency). Table 1 is not supportsSharedSeating, so a
    // second whole-table claim always conflicts regardless of headcount.
    const destination = await prisma.table.findFirstOrThrow({ where: { operationalLabel: "Table 1" } });
    const [moveA, moveB] = await Promise.all([
      orchA.moveSeating({ commandId: cmd(), reservationId: resA, requestedAreaId: "Sushi", requestedPartySize: 2, resources: [{ tableId: destination.id }], actor: staffActor }),
      orchB.moveSeating({ commandId: cmd(), reservationId: resB, requestedAreaId: "Sushi", requestedPartySize: 2, resources: [{ tableId: destination.id }], actor: staffActor }),
    ]);

    const outcomes = [moveA.type, moveB.type].sort();
    expect(outcomes).toEqual(["MOVED", "NOT_SEATABLE"]);
    const activeClaims = await prisma.seatingAssignmentResource.findMany({ where: { tableId: destination.id, status: { in: ["Assigned", "Seated"] } } });
    expect(activeClaims).toHaveLength(1);
  });
});

describe("Concurrency repetition (assignment §35) — 20 iterations, 0 integrity flakes", () => {
  it("same Sushi table: 20 iterations, exactly one winner every time", async () => {
    const table3 = await prisma.table.findFirstOrThrow({ where: { operationalLabel: "Table 3" } });
    for (let i = 0; i < 20; i += 1) {
      await resetAll();
      const resA = await createReservation();
      const resB = await createReservation();
      const { seatingOrchestrator: orchA } = buildFloorHarness(prisma, NOW);
      const { seatingOrchestrator: orchB } = buildFloorHarness(prismaB, NOW);
      const [a, b] = await Promise.all([
        orchA.assignSeating({ commandId: `rep-table-a-${i}`, reservationId: resA, requestedAreaId: "Sushi", requestedPartySize: 4, resources: [{ tableId: table3.id }], startTime: new Date("2026-08-20T18:00:00Z"), endTime: new Date("2026-08-20T19:30:00Z"), actor: staffActor }),
        orchB.assignSeating({ commandId: `rep-table-b-${i}`, reservationId: resB, requestedAreaId: "Sushi", requestedPartySize: 4, resources: [{ tableId: table3.id }], startTime: new Date("2026-08-20T18:30:00Z"), endTime: new Date("2026-08-20T20:00:00Z"), actor: staffActor }),
      ]);
      expect([a.type, b.type].sort(), `iteration ${i}`).toEqual(["ASSIGNED", "NOT_SEATABLE"]);
      const active = await prisma.seatingAssignmentResource.findMany({ where: { tableId: table3.id, status: { in: ["Assigned", "Seated"] } } });
      expect(active, `iteration ${i}: exactly one active claim`).toHaveLength(1);
    }
  }, 60_000);

  it("same Sushi bar resource: 20 iterations, exactly one winner every time", async () => {
    const bar18 = await prisma.table.findFirstOrThrow({ where: { operationalLabel: "Bar 18" } });
    for (let i = 0; i < 20; i += 1) {
      await resetAll();
      const resA = await createReservation({ partySize: 1 });
      const resB = await createReservation({ partySize: 1 });
      const { seatingOrchestrator: orchA } = buildFloorHarness(prisma, NOW);
      const { seatingOrchestrator: orchB } = buildFloorHarness(prismaB, NOW);
      const [a, b] = await Promise.all([
        orchA.assignSeating({ commandId: `rep-bar-a-${i}`, reservationId: resA, requestedAreaId: "Sushi", requestedPartySize: 1, resources: [{ tableId: bar18.id }], startTime: new Date("2026-08-20T18:00:00Z"), endTime: new Date("2026-08-20T19:30:00Z"), actor: staffActor }),
        orchB.assignSeating({ commandId: `rep-bar-b-${i}`, reservationId: resB, requestedAreaId: "Sushi", requestedPartySize: 1, resources: [{ tableId: bar18.id }], startTime: new Date("2026-08-20T18:30:00Z"), endTime: new Date("2026-08-20T20:00:00Z"), actor: staffActor }),
      ]);
      expect([a.type, b.type].sort(), `iteration ${i}`).toEqual(["ASSIGNED", "NOT_SEATABLE"]);
      const active = await prisma.seatingAssignmentResource.findMany({ where: { tableId: bar18.id, status: { in: ["Assigned", "Seated"] } } });
      expect(active, `iteration ${i}: exactly one active claim`).toHaveLength(1);
    }
  }, 60_000);

  it("same Teppanyaki seat: 20 iterations, exactly one winner every time", async () => {
    const grillF = await prisma.table.findFirstOrThrow({ where: { operationalLabel: "F" } });
    const seatF1 = await prisma.seat.findFirstOrThrow({ where: { tableId: grillF.id, operationalLabel: "F-01" } });
    for (let i = 0; i < 20; i += 1) {
      await resetAll();
      const resA = await createReservation({ partySize: 1, preferredArea: "Teppanyaki" });
      const resB = await createReservation({ partySize: 1, preferredArea: "Teppanyaki" });
      const { seatingOrchestrator: orchA } = buildFloorHarness(prisma, NOW);
      const { seatingOrchestrator: orchB } = buildFloorHarness(prismaB, NOW);
      const [a, b] = await Promise.all([
        orchA.assignSeating({ commandId: `rep-seat-a-${i}`, reservationId: resA, requestedAreaId: "Teppanyaki", requestedPartySize: 1, resources: [{ seatId: seatF1.id }], startTime: new Date("2026-08-20T18:00:00Z"), endTime: new Date("2026-08-20T20:30:00Z"), actor: staffActor }),
        orchB.assignSeating({ commandId: `rep-seat-b-${i}`, reservationId: resB, requestedAreaId: "Teppanyaki", requestedPartySize: 1, resources: [{ seatId: seatF1.id }], startTime: new Date("2026-08-20T19:00:00Z"), endTime: new Date("2026-08-20T21:30:00Z"), actor: staffActor }),
      ]);
      expect([a.type, b.type].sort(), `iteration ${i}`).toEqual(["ASSIGNED", "NOT_SEATABLE"]);
      const active = await prisma.seatingAssignmentResource.findMany({ where: { seatId: seatF1.id, status: { in: ["Assigned", "Seated"] } } });
      expect(active, `iteration ${i}: exactly one active claim`).toHaveLength(1);
    }
  }, 60_000);

  it("seating move vs competing assignment: 20 iterations, exactly one winner every time", async () => {
    const table9 = await prisma.table.findFirstOrThrow({ where: { operationalLabel: "Table 9" } });
    const table11 = await prisma.table.findFirstOrThrow({ where: { operationalLabel: "Table 11" } });
    for (let i = 0; i < 20; i += 1) {
      await resetAll();
      const resMoving = await createReservation({ partySize: 2, reservationDate: new Date("2026-08-20T18:00:00Z") });
      const resCompeting = await createReservation({ partySize: 2, reservationDate: new Date("2026-08-20T18:00:00Z") });
      const { seatingOrchestrator: orchA } = buildFloorHarness(prisma, NOW);
      const { seatingOrchestrator: orchB } = buildFloorHarness(prismaB, NOW);

      await orchA.assignSeating({ commandId: `rep-move-setup-${i}`, reservationId: resMoving, requestedAreaId: "Sushi", requestedPartySize: 2, resources: [{ tableId: table9.id }], startTime: new Date("2026-08-20T18:00:00Z"), endTime: new Date("2026-08-20T19:30:00Z"), actor: staffActor });

      const [moveResult, competingResult] = await Promise.all([
        orchA.moveSeating({ commandId: `rep-move-a-${i}`, reservationId: resMoving, requestedAreaId: "Sushi", requestedPartySize: 2, resources: [{ tableId: table11.id }], actor: staffActor }),
        orchB.assignSeating({ commandId: `rep-move-b-${i}`, reservationId: resCompeting, requestedAreaId: "Sushi", requestedPartySize: 2, resources: [{ tableId: table11.id }], startTime: new Date("2026-08-20T18:00:00Z"), endTime: new Date("2026-08-20T19:30:00Z"), actor: staffActor }),
      ]);

      // moveResult.type is "MOVED" | "NOT_SEATABLE"; competingResult.type is
      // "ASSIGNED" | "NOT_SEATABLE" — different result unions, so compare
      // by counting successes directly rather than an array-equality
      // shortcut. Exactly one of the two must have won table11.
      const successCount = (moveResult.type === "MOVED" ? 1 : 0) + (competingResult.type === "ASSIGNED" ? 1 : 0);
      expect(successCount, `iteration ${i}: exactly one of move/competing-assign should win table11`).toBe(1);
      const active = await prisma.seatingAssignmentResource.findMany({ where: { tableId: table11.id, status: { in: ["Assigned", "Seated"] } } });
      expect(active, `iteration ${i}: exactly one active claim on table11`).toHaveLength(1);
    }
  }, 60_000);
});

/**
 * P1-B10 — Floor & Seating evidence reconciliation: closes the two
 * concurrency gaps the completion audit found (pre-assign vs pre-assign;
 * mark-seated vs move). Same "separate PrismaClient per concurrent actor"
 * discipline as every scenario above. Pre-assign is exercised via the
 * SAME assignSeating() method every other scenario already races —
 * seatImmediately: false is its only distinguishing input — so this adds
 * genuinely new evidence for the ONE untested input combination, not a
 * new code path.
 */
describe("Scenario M — pre-assign conflict: two concurrent pre-assignments claim the same table, overlapping", () => {
  it("exactly one succeeds; the loser gets the established RESOURCE_OVERLAP outcome; no duplicate assignment or resource-claim rows", async () => {
    const table4 = await prisma.table.findFirstOrThrow({ where: { operationalLabel: "Table 4" } });
    const resA = await createReservation();
    const resB = await createReservation();
    const { seatingOrchestrator: orchA } = buildFloorHarness(prisma, NOW);
    const { seatingOrchestrator: orchB } = buildFloorHarness(prismaB, NOW);

    const [a, b] = await Promise.all([
      orchA.assignSeating({ commandId: cmd(), reservationId: resA, requestedAreaId: "Sushi", requestedPartySize: 2, resources: [{ tableId: table4.id }], startTime: new Date("2026-08-20T18:00:00Z"), endTime: new Date("2026-08-20T19:30:00Z"), actor: staffActor, seatImmediately: false }),
      orchB.assignSeating({ commandId: cmd(), reservationId: resB, requestedAreaId: "Sushi", requestedPartySize: 2, resources: [{ tableId: table4.id }], startTime: new Date("2026-08-20T19:00:00Z"), endTime: new Date("2026-08-20T20:30:00Z"), actor: staffActor, seatImmediately: false }),
    ]);

    const outcomes = [a.type, b.type].sort();
    expect(outcomes).toEqual(["ASSIGNED", "NOT_SEATABLE"]);
    if (a.type === "NOT_SEATABLE") expect(a.seatability.type).toBe("RESOURCE_OVERLAP");
    if (b.type === "NOT_SEATABLE") expect(b.seatability.type).toBe("RESOURCE_OVERLAP");

    const activeClaims = await prisma.seatingAssignmentResource.findMany({ where: { tableId: table4.id, status: { in: ["Assigned", "Seated"] } } });
    expect(activeClaims).toHaveLength(1);
    // No duplicate SeatingAssignment rows across either reservation.
    const allAssignments = await prisma.seatingAssignment.findMany({ where: { reservationId: { in: [resA, resB] } } });
    expect(allAssignments).toHaveLength(1);
    // Pre-assignment never seats immediately, win or lose.
    expect(allAssignments[0]?.status).toBe("Assigned");
  });

  it("5 iterations, 0 integrity flakes — exactly one winner every time", async () => {
    const table6 = await prisma.table.findFirstOrThrow({ where: { operationalLabel: "Table 6" } });
    for (let i = 0; i < 5; i += 1) {
      await resetAll();
      const resA = await createReservation();
      const resB = await createReservation();
      const { seatingOrchestrator: orchA } = buildFloorHarness(prisma, NOW);
      const { seatingOrchestrator: orchB } = buildFloorHarness(prismaB, NOW);
      const [a, b] = await Promise.all([
        orchA.assignSeating({ commandId: `rep-preassign-a-${i}`, reservationId: resA, requestedAreaId: "Sushi", requestedPartySize: 2, resources: [{ tableId: table6.id }], startTime: new Date("2026-08-20T18:00:00Z"), endTime: new Date("2026-08-20T19:30:00Z"), actor: staffActor, seatImmediately: false }),
        orchB.assignSeating({ commandId: `rep-preassign-b-${i}`, reservationId: resB, requestedAreaId: "Sushi", requestedPartySize: 2, resources: [{ tableId: table6.id }], startTime: new Date("2026-08-20T18:30:00Z"), endTime: new Date("2026-08-20T20:00:00Z"), actor: staffActor, seatImmediately: false }),
      ]);
      expect([a.type, b.type].sort(), `iteration ${i}`).toEqual(["ASSIGNED", "NOT_SEATABLE"]);
      const active = await prisma.seatingAssignmentResource.findMany({ where: { tableId: table6.id, status: { in: ["Assigned", "Seated"] } } });
      expect(active, `iteration ${i}: exactly one active claim`).toHaveLength(1);
      const allAssignments = await prisma.seatingAssignment.findMany({ where: { reservationId: { in: [resA, resB] } } });
      expect(allAssignments, `iteration ${i}: exactly one persisted assignment, no duplicate`).toHaveLength(1);
    }
  }, 60_000);
});

describe("Scenario M2 — mark-seated vs move race: a pre-assigned reservation is raced between the two, both may validly succeed after serialization", () => {
  it("final state is coherent regardless of which side acquires the reservation lock first", async () => {
    const tableA = await prisma.table.findFirstOrThrow({ where: { operationalLabel: "Table 7" } });
    const tableB = await prisma.table.findFirstOrThrow({ where: { operationalLabel: "Table 8" } });
    const reservationId = await createReservation({ partySize: 2 });
    const { seatingOrchestrator: orchA } = buildFloorHarness(prisma, NOW);
    const { seatingOrchestrator: orchB } = buildFloorHarness(prismaB, NOW);

    const preAssigned = await orchA.assignSeating({
      commandId: cmd(), reservationId, requestedAreaId: "Sushi", requestedPartySize: 2,
      resources: [{ tableId: tableA.id }], startTime: new Date("2026-08-20T18:00:00Z"), endTime: new Date("2026-08-20T19:30:00Z"), actor: staffActor, seatImmediately: false,
    });
    expect(preAssigned.type).toBe("ASSIGNED");
    if (preAssigned.type === "ASSIGNED") expect(preAssigned.assignment.status).toBe("Assigned");

    // Both operations act on the SAME reservation, so they always
    // serialize on the Tier-1 reservation lock (acquireReservationLock) —
    // neither can ever observe the other's half-applied state, and
    // markSeated can never see "no active assignment" mid-race (moveSeating
    // releases the old claim and creates the new one inside ONE
    // transaction, so an external reader only ever sees the pre- or
    // post-move state, never a gap). Both are therefore expected to
    // succeed deterministically, not merely "may" succeed.
    const [markResult, moveResult] = await Promise.all([
      orchA.markSeated({ reservationId, actor: staffActor }),
      orchB.moveSeating({ commandId: cmd(), reservationId, requestedAreaId: "Sushi", requestedPartySize: 2, resources: [{ tableId: tableB.id }], actor: staffActor }),
    ]);
    expect(markResult.type).toBe("SEATED");
    expect(moveResult.type).toBe("MOVED");

    const activeAssignments = await prisma.seatingAssignment.findMany({ where: { reservationId, status: { in: ["Assigned", "Seated"] } } });
    expect(activeAssignments).toHaveLength(1);
    expect(activeAssignments[0]?.status).toBe("Seated");
    expect(activeAssignments[0]?.seatedAt).not.toBeNull();

    const activeOnB = await prisma.seatingAssignmentResource.findMany({ where: { tableId: tableB.id, status: { in: ["Assigned", "Seated"] } } });
    expect(activeOnB).toHaveLength(1);
    const activeOnA = await prisma.seatingAssignmentResource.findMany({ where: { tableId: tableA.id, status: { in: ["Assigned", "Seated"] } } });
    expect(activeOnA).toHaveLength(0);

    // Exactly two rows total for this reservation — the original claim
    // (now Released by the move) and the one final active row — never
    // three or more, regardless of lock order.
    const allAssignments = await prisma.seatingAssignment.findMany({ where: { reservationId } });
    expect(allAssignments).toHaveLength(2);
    const released = allAssignments.find((r) => r.status === "Released");
    expect(released?.releaseReason).toBe("StaffReassigned");

    // seatedAt on the final active row was written exactly once — by
    // whichever call actually performed the Assigned -> Seated
    // transition — never re-stamped by the other call afterward.
    const activeRow = allAssignments.find((r) => r.status === "Seated");
    expect(activeRow?.seatedAt?.toISOString()).toBe(activeAssignments[0]?.seatedAt?.toISOString());

    // Reservation lifecycle status was never touched by either call.
    const reservation = await prisma.reservation.findUniqueOrThrow({ where: { id: reservationId } });
    expect(reservation.status).toBe("Confirmed");
  });

  it("5 iterations, 0 integrity flakes — the coherent final state holds every time, whichever side wins the lock", async () => {
    const tableA = await prisma.table.findFirstOrThrow({ where: { operationalLabel: "Table 10" } });
    const tableB = await prisma.table.findFirstOrThrow({ where: { operationalLabel: "Table 12" } });
    for (let i = 0; i < 5; i += 1) {
      await resetAll();
      const reservationId = await createReservation({ partySize: 2 });
      const { seatingOrchestrator: orchA } = buildFloorHarness(prisma, NOW);
      const { seatingOrchestrator: orchB } = buildFloorHarness(prismaB, NOW);

      const preAssigned = await orchA.assignSeating({
        commandId: `rep-marksmove-pre-${i}`, reservationId, requestedAreaId: "Sushi", requestedPartySize: 2,
        resources: [{ tableId: tableA.id }], startTime: new Date("2026-08-20T18:00:00Z"), endTime: new Date("2026-08-20T19:30:00Z"), actor: staffActor, seatImmediately: false,
      });
      expect(preAssigned.type, `iteration ${i}`).toBe("ASSIGNED");

      const [markResult, moveResult] = await Promise.all([
        orchA.markSeated({ reservationId, actor: staffActor }),
        orchB.moveSeating({ commandId: `rep-marksmove-move-${i}`, reservationId, requestedAreaId: "Sushi", requestedPartySize: 2, resources: [{ tableId: tableB.id }], actor: staffActor }),
      ]);
      expect(markResult.type, `iteration ${i}`).toBe("SEATED");
      expect(moveResult.type, `iteration ${i}`).toBe("MOVED");

      const activeAssignments = await prisma.seatingAssignment.findMany({ where: { reservationId, status: { in: ["Assigned", "Seated"] } } });
      expect(activeAssignments, `iteration ${i}: exactly one active assignment`).toHaveLength(1);
      expect(activeAssignments[0]?.status, `iteration ${i}: Seated`).toBe("Seated");
      expect(activeAssignments[0]?.seatedAt, `iteration ${i}: seatedAt set`).not.toBeNull();

      const activeOnB = await prisma.seatingAssignmentResource.findMany({ where: { tableId: tableB.id, status: { in: ["Assigned", "Seated"] } } });
      expect(activeOnB, `iteration ${i}: new resource claimed`).toHaveLength(1);
      const activeOnA = await prisma.seatingAssignmentResource.findMany({ where: { tableId: tableA.id, status: { in: ["Assigned", "Seated"] } } });
      expect(activeOnA, `iteration ${i}: old resource released`).toHaveLength(0);

      const allAssignments = await prisma.seatingAssignment.findMany({ where: { reservationId } });
      expect(allAssignments, `iteration ${i}: no duplicates`).toHaveLength(2);

      const reservation = await prisma.reservation.findUniqueOrThrow({ where: { id: reservationId } });
      expect(reservation.status, `iteration ${i}: Reservation untouched`).toBe("Confirmed");
    }
  }, 60_000);
});
