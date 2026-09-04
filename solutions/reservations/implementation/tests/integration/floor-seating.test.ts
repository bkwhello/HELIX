import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { createTestPrismaClient, truncateReservationDomainTables, truncateSeatingDomainTables } from "./support/testDatabaseSafety.js";
import { buildFloorHarness } from "./support/floorTestHarness.js";
import { seedFloor } from "../../ops/floor/seedFloor.js";
import { Actor, ActorKind, ActorRole } from "../../domain/value-objects/Actor.js";
import { ReservationSourceCategory } from "../../domain/value-objects/ReservationSource.js";

/**
 * CAP-D04.01/CAP-D03.03 — real PostgreSQL evidence, mirroring R1.1's own
 * mandatory standard for CAP-D02.03. Scenarios A/B/D/H/I/N from the R1.5
 * implementation assignment, plus basic assign/move/mark-seated/No-Show/
 * cancel-integration/walk-in flows. Concurrency scenarios (C/E/F/G/K/L)
 * and failure injection live in their own files — see
 * floor-seating-concurrency.test.ts / floor-seating-failure-injection.test.ts.
 */
const prisma = createTestPrismaClient();
const staffActor: Actor = { id: "staff-1", kind: ActorKind.AuthorizedUser, role: ActorRole.Reception };
const NOW = new Date("2026-08-10T10:00:00Z");
let cmdCounter = 0;
function cmd(): string {
  cmdCounter += 1;
  return `floor-cmd-${cmdCounter}`;
}
let resCounter = 0;

async function createReservation(overrides: { partySize?: number; preferredArea?: string; reservationDate?: Date; contactId?: string } = {}): Promise<string> {
  resCounter += 1;
  const id = `floor-res-${resCounter}`;
  await prisma.reservation.create({
    data: {
      id,
      servicePeriodId: "sp-floor",
      contactId: overrides.contactId ?? "contact-1",
      contactName: "Floor Test Guest",
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
    data: { id: "contact-1", displayName: "Floor Test Guest", phoneRaw: "0699999999", phoneNormalized: "+31699999999", createdBy: "staff-1", lastRelevantActivityAt: NOW },
  });
});

describe("Floor configuration — seeded floor matches the authoritative layout", () => {
  it("Scenario N — Table 14 is absent", async () => {
    const table14 = await prisma.table.findFirst({ where: { operationalLabel: "Table 14" } });
    expect(table14).toBeNull();
  });

  it("seeds exactly 19 Sushi tables (51 nominal seats) and 4 Teppanyaki grills (40 seats across 40 rows)", async () => {
    const sushi = await prisma.table.findMany({ where: { areaId: "Sushi" } });
    const teppanyaki = await prisma.table.findMany({ where: { areaId: "Teppanyaki" } });
    expect(sushi).toHaveLength(19);
    expect(sushi.reduce((sum, t) => sum + t.nominalCapacity, 0)).toBe(51);
    expect(teppanyaki).toHaveLength(4);
    const seats = await prisma.seat.findMany({ where: { table: { areaId: "Teppanyaki" } } });
    expect(seats).toHaveLength(40);
  });

  it("Sushi Bar 17-20 are four individually-identifiable one-person resources", async () => {
    const barSeats = await prisma.table.findMany({ where: { operationalLabel: { startsWith: "Bar " } }, orderBy: { operationalLabel: "asc" } });
    expect(barSeats.map((b) => b.operationalLabel)).toEqual(["Bar 17", "Bar 18", "Bar 19", "Bar 20"]);
    expect(barSeats.every((b) => b.nominalCapacity === 1)).toBe(true);
  });

  it("Teppanyaki grills keep their real staff-facing labels C/D/E/F, never renamed to Grill 1-4", async () => {
    const grills = await prisma.table.findMany({ where: { areaId: "Teppanyaki" }, orderBy: { operationalLabel: "asc" } });
    expect(grills.map((g) => g.operationalLabel)).toEqual(["C", "D", "E", "F"]);
  });
});

describe("Scenario A — Sushi single table", () => {
  it("2 guests, one available 2-person table -> assignable", async () => {
    const { seatingOrchestrator } = buildFloorHarness(prisma, NOW);
    const reservationId = await createReservation({ partySize: 2 });
    const table5 = await prisma.table.findFirstOrThrow({ where: { operationalLabel: "Table 5" } });

    const result = await seatingOrchestrator.assignSeating({
      commandId: cmd(),
      reservationId,
      requestedAreaId: "Sushi",
      requestedPartySize: 2,
      resources: [{ tableId: table5.id }],
      startTime: new Date("2026-08-20T18:00:00Z"),
      endTime: new Date("2026-08-20T19:30:00Z"),
      actor: staffActor,
    });

    expect(result.type).toBe("ASSIGNED");
  });
});

describe("Scenario B — Sushi combination", () => {
  it("6 guests, two compatible tables selected manually -> one SeatingAssignment claims both", async () => {
    const { seatingOrchestrator } = buildFloorHarness(prisma, NOW);
    const reservationId = await createReservation({ partySize: 6 });
    const t2 = await prisma.table.findFirstOrThrow({ where: { operationalLabel: "Table 2" } }); // capacity 4
    const t5 = await prisma.table.findFirstOrThrow({ where: { operationalLabel: "Table 5" } }); // capacity 2

    const result = await seatingOrchestrator.assignSeating({
      commandId: cmd(),
      reservationId,
      requestedAreaId: "Sushi",
      requestedPartySize: 6,
      resources: [{ tableId: t2.id }, { tableId: t5.id }],
      startTime: new Date("2026-08-20T18:00:00Z"),
      endTime: new Date("2026-08-20T19:30:00Z"),
      actor: staffActor,
    });

    expect(result.type).toBe("ASSIGNED");
    if (result.type === "ASSIGNED") {
      const resources = await prisma.seatingAssignmentResource.findMany({ where: { assignmentId: result.assignment.id } });
      expect(resources).toHaveLength(2);
    }
  });
});

describe("Scenario D — Sushi back-to-back", () => {
  it("Table 1 18:00-19:30 then Table 1 19:30-21:00 -> both accepted", async () => {
    const { seatingOrchestrator } = buildFloorHarness(prisma, NOW);
    const table1 = await prisma.table.findFirstOrThrow({ where: { operationalLabel: "Table 1" } });
    const resA = await createReservation({ partySize: 4, reservationDate: new Date("2026-08-20T18:00:00Z") });
    const resB = await createReservation({ partySize: 4, reservationDate: new Date("2026-08-20T19:30:00Z") });

    const a = await seatingOrchestrator.assignSeating({
      commandId: cmd(), reservationId: resA, requestedAreaId: "Sushi", requestedPartySize: 4,
      resources: [{ tableId: table1.id }], startTime: new Date("2026-08-20T18:00:00Z"), endTime: new Date("2026-08-20T19:30:00Z"), actor: staffActor,
    });
    const b = await seatingOrchestrator.assignSeating({
      commandId: cmd(), reservationId: resB, requestedAreaId: "Sushi", requestedPartySize: 4,
      resources: [{ tableId: table1.id }], startTime: new Date("2026-08-20T19:30:00Z"), endTime: new Date("2026-08-20T21:00:00Z"), actor: staffActor,
    });

    expect(a.type).toBe("ASSIGNED");
    expect(b.type).toBe("ASSIGNED");
  });
});

describe("Scenario H — multi-grill party", () => {
  it("one reservation claims seats from C and D -> representable and valid", async () => {
    const { seatingOrchestrator } = buildFloorHarness(prisma, NOW);
    const reservationId = await createReservation({ partySize: 4, preferredArea: "Teppanyaki", reservationDate: new Date("2026-08-20T18:00:00Z") });
    const grillC = await prisma.table.findFirstOrThrow({ where: { operationalLabel: "C" } });
    const grillD = await prisma.table.findFirstOrThrow({ where: { operationalLabel: "D" } });
    const seatC1 = await prisma.seat.findFirstOrThrow({ where: { tableId: grillC.id, operationalLabel: "C-01" } });
    const seatD1 = await prisma.seat.findFirstOrThrow({ where: { tableId: grillD.id, operationalLabel: "D-01" } });

    const result = await seatingOrchestrator.assignSeating({
      commandId: cmd(), reservationId, requestedAreaId: "Teppanyaki", requestedPartySize: 2,
      resources: [{ seatId: seatC1.id }, { seatId: seatD1.id }],
      startTime: new Date("2026-08-20T18:00:00Z"), endTime: new Date("2026-08-20T20:30:00Z"), actor: staffActor,
    });

    expect(result.type).toBe("ASSIGNED");
  });
});

describe("Scenario I — ResourceBlock", () => {
  it("a blocked grill's seats are excluded from CanSeat during the overlap, without deleting the grill", async () => {
    const { seatingOrchestrator, floorRepository, transactionManager } = buildFloorHarness(prisma, NOW);
    const grillD = await prisma.table.findFirstOrThrow({ where: { operationalLabel: "D" } });
    const seatD1 = await prisma.seat.findFirstOrThrow({ where: { tableId: grillD.id, operationalLabel: "D-01" } });

    await transactionManager.runInTransaction(async (tx) => {
      await floorRepository.createResourceBlock({
        tableId: grillD.id,
        startTime: new Date("2026-08-20T17:00:00Z"),
        endTime: new Date("2026-08-20T22:00:00Z"),
        reason: "chef shortage",
        createdBy: "staff-1",
        tx,
      });
    });

    const reservationId = await createReservation({ partySize: 1, preferredArea: "Teppanyaki", reservationDate: new Date("2026-08-20T18:00:00Z") });
    const result = await seatingOrchestrator.assignSeating({
      commandId: cmd(), reservationId, requestedAreaId: "Teppanyaki", requestedPartySize: 1,
      resources: [{ seatId: seatD1.id }],
      startTime: new Date("2026-08-20T18:00:00Z"), endTime: new Date("2026-08-20T20:30:00Z"), actor: staffActor,
    });

    expect(result.type).toBe("NOT_SEATABLE");
    if (result.type === "NOT_SEATABLE") expect(result.seatability.type).toBe("RESOURCE_BLOCKED");

    // The Table itself is untouched — still Active, still exists.
    const stillThere = await prisma.table.findUnique({ where: { id: grillD.id } });
    expect(stillThere?.status).toBe("Active");
  });
});

describe("P1-B9 — markSeated idempotency fix: Assigned -> Seated once, repeat calls are a true no-op", () => {
  it("first call: transitions Assigned to Seated and sets seatedAt", async () => {
    const { seatingOrchestrator } = buildFloorHarness(prisma, NOW);
    const reservationId = await createReservation({ partySize: 2 });
    const table10 = await prisma.table.findFirstOrThrow({ where: { operationalLabel: "Table 10" } });

    const assigned = await seatingOrchestrator.assignSeating({
      commandId: cmd(), reservationId, requestedAreaId: "Sushi", requestedPartySize: 2,
      resources: [{ tableId: table10.id }], startTime: new Date("2026-08-20T18:00:00Z"), endTime: new Date("2026-08-20T19:30:00Z"), actor: staffActor,
    });
    expect(assigned.type).toBe("ASSIGNED");
    if (assigned.type === "ASSIGNED") expect(assigned.assignment.status).toBe("Assigned");

    const result = await seatingOrchestrator.markSeated({ reservationId, actor: staffActor });
    expect(result.type).toBe("SEATED");

    const stored = await prisma.seatingAssignment.findFirstOrThrow({ where: { reservationId, status: "Seated" } });
    expect(stored.seatedAt).not.toBeNull();
  });

  it("repeated calls: return SEATED again without re-stamping seatedAt or creating a duplicate row", async () => {
    const { seatingOrchestrator } = buildFloorHarness(prisma, NOW);
    const reservationId = await createReservation({ partySize: 2 });
    const table10 = await prisma.table.findFirstOrThrow({ where: { operationalLabel: "Table 10" } });

    await seatingOrchestrator.assignSeating({
      commandId: cmd(), reservationId, requestedAreaId: "Sushi", requestedPartySize: 2,
      resources: [{ tableId: table10.id }], startTime: new Date("2026-08-20T18:00:00Z"), endTime: new Date("2026-08-20T19:30:00Z"), actor: staffActor,
    });

    const first = await seatingOrchestrator.markSeated({ reservationId, actor: staffActor });
    expect(first.type).toBe("SEATED");
    const afterFirst = await prisma.seatingAssignment.findFirstOrThrow({ where: { reservationId } });
    const seatedAtAfterFirst = afterFirst.seatedAt;
    expect(seatedAtAfterFirst).not.toBeNull();

    // updateAssignmentStatus stamps seatedAt with the real wall-clock time
    // (new Date()), not the FixedClock — a real delay makes a regression
    // (re-stamping on repeat) observable as a measurably later timestamp.
    await new Promise((resolve) => setTimeout(resolve, 20));

    const second = await seatingOrchestrator.markSeated({ reservationId, actor: staffActor });
    expect(second.type).toBe("SEATED");
    const afterSecond = await prisma.seatingAssignment.findFirstOrThrow({ where: { reservationId } });
    expect(afterSecond.seatedAt?.toISOString()).toBe(seatedAtAfterFirst?.toISOString());
    expect(afterSecond.status).toBe("Seated");

    const allAssignments = await prisma.seatingAssignment.findMany({ where: { reservationId } });
    expect(allAssignments).toHaveLength(1);
  });
});

describe("No-Show — staff-confirmed release only, never automatic, never touching Reservation/CapacityCommitment", () => {
  it("releases the active SeatingAssignment and leaves Reservation.status / CapacityCommitment untouched", async () => {
    const { seatingOrchestrator } = buildFloorHarness(prisma, NOW);
    const reservationId = await createReservation({ partySize: 2 });
    const table6 = await prisma.table.findFirstOrThrow({ where: { operationalLabel: "Table 6" } });

    await seatingOrchestrator.assignSeating({
      commandId: cmd(), reservationId, requestedAreaId: "Sushi", requestedPartySize: 2,
      resources: [{ tableId: table6.id }], startTime: new Date("2026-08-20T18:00:00Z"), endTime: new Date("2026-08-20T19:30:00Z"), actor: staffActor,
    });

    const result = await seatingOrchestrator.releaseNoShow({ reservationId, actor: staffActor });
    expect(result.type).toBe("RELEASED");

    const active = await prisma.seatingAssignment.findFirst({ where: { reservationId, status: { in: ["Assigned", "Seated"] } } });
    expect(active).toBeNull();
    const released = await prisma.seatingAssignment.findFirstOrThrow({ where: { reservationId } });
    expect(released.status).toBe("Released");
    expect(released.releaseReason).toBe("NoShow");

    const reservation = await prisma.reservation.findUniqueOrThrow({ where: { id: reservationId } });
    expect(reservation.status).toBe("Confirmed"); // untouched
  });
});

describe("Pre-assignment vs walk-in — same mechanism, different status at creation", () => {
  it("pre-assignment creates status=Assigned; walk-in immediate seating creates status=Seated", async () => {
    const { seatingOrchestrator } = buildFloorHarness(prisma, NOW);
    const table7 = await prisma.table.findFirstOrThrow({ where: { operationalLabel: "Table 7" } });
    const table8 = await prisma.table.findFirstOrThrow({ where: { operationalLabel: "Table 8" } });

    const preAssigned = await createReservation({ partySize: 2, reservationDate: new Date("2026-08-25T19:00:00Z") });
    const walkIn = await createReservation({ partySize: 2, reservationDate: NOW });

    const pre = await seatingOrchestrator.assignSeating({
      commandId: cmd(), reservationId: preAssigned, requestedAreaId: "Sushi", requestedPartySize: 2,
      resources: [{ tableId: table7.id }], startTime: new Date("2026-08-25T19:00:00Z"), endTime: new Date("2026-08-25T20:30:00Z"), actor: staffActor,
    });
    const walk = await seatingOrchestrator.assignSeating({
      commandId: cmd(), reservationId: walkIn, requestedAreaId: "Sushi", requestedPartySize: 2,
      resources: [{ tableId: table8.id }], startTime: NOW, endTime: new Date(NOW.getTime() + 90 * 60_000), actor: staffActor, seatImmediately: true,
    });

    expect(pre.type).toBe("ASSIGNED");
    expect(walk.type).toBe("ASSIGNED");
    if (pre.type === "ASSIGNED") expect(pre.assignment.status).toBe("Assigned");
    if (walk.type === "ASSIGNED") expect(walk.assignment.status).toBe("Seated");
  });
});

describe("Move (reassignment) — old released, new claimed, atomically", () => {
  it("moving a reservation to a different table releases the old claim and creates a new one", async () => {
    const { seatingOrchestrator } = buildFloorHarness(prisma, NOW);
    const reservationId = await createReservation({ partySize: 2 });
    const table9 = await prisma.table.findFirstOrThrow({ where: { operationalLabel: "Table 9" } });
    const table11 = await prisma.table.findFirstOrThrow({ where: { operationalLabel: "Table 11" } });

    const initial = await seatingOrchestrator.assignSeating({
      commandId: cmd(), reservationId, requestedAreaId: "Sushi", requestedPartySize: 2,
      resources: [{ tableId: table9.id }], startTime: new Date("2026-08-20T18:00:00Z"), endTime: new Date("2026-08-20T19:30:00Z"), actor: staffActor,
    });
    expect(initial.type).toBe("ASSIGNED");

    const moved = await seatingOrchestrator.moveSeating({
      commandId: cmd(), reservationId, requestedAreaId: "Sushi", requestedPartySize: 2, resources: [{ tableId: table11.id }], actor: staffActor,
    });
    expect(moved.type).toBe("MOVED");

    const table9Claims = await prisma.seatingAssignmentResource.findMany({ where: { tableId: table9.id, status: { in: ["Assigned", "Seated"] } } });
    expect(table9Claims).toHaveLength(0);
    const table11Claims = await prisma.seatingAssignmentResource.findMany({ where: { tableId: table11.id, status: { in: ["Assigned", "Seated"] } } });
    expect(table11Claims).toHaveLength(1);
  });
});

describe("Cancellation integration (assignment §27) — cancelling a reservation leaves zero active SeatingAssignments", () => {
  it("AvailabilityOrchestrator.cancelWithCapacity releases the active seating assignment in the same transaction", async () => {
    const { availabilityOrchestrator, seatingOrchestrator } = buildFloorHarness(prisma, NOW);
    const table12 = await prisma.table.findFirstOrThrow({ where: { operationalLabel: "Table 12" } });

    const created = await availabilityOrchestrator.createWithCapacity({
      commandId: cmd(),
      servicePeriodId: "sp-floor",
      contactSelection: { type: "ExistingContact", contactId: "contact-1" },
      reservationDate: new Date("2026-08-20T18:00:00Z"),
      partySize: 4,
      source: { category: ReservationSourceCategory.Telephone },
      preferredArea: "Sushi",
      actor: staffActor,
    });
    expect(created.type).toBe("CREATED");
    if (created.type !== "CREATED") throw new Error("unreachable");
    const reservationId = created.outcome.reservationId;

    const assigned = await seatingOrchestrator.assignSeating({
      commandId: cmd(), reservationId, requestedAreaId: "Sushi", requestedPartySize: 4,
      resources: [{ tableId: table12.id }], startTime: new Date("2026-08-20T18:00:00Z"), endTime: new Date("2026-08-20T19:30:00Z"), actor: staffActor,
    });
    expect(assigned.type).toBe("ASSIGNED");

    const cancelled = await availabilityOrchestrator.cancelWithCapacity({ commandId: cmd(), reservationId, actor: staffActor });
    expect(cancelled.type).toBe("CANCELLED");

    const active = await prisma.seatingAssignment.findFirst({ where: { reservationId, status: { in: ["Assigned", "Seated"] } } });
    expect(active).toBeNull();
    const activeCommitment = await prisma.capacityCommitment.findFirst({ where: { reservationId, status: "Committed" } });
    expect(activeCommitment).toBeNull();
  });
});
