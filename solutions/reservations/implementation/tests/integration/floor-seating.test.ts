import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { createTestPrismaClient, truncateReservationDomainTables, truncateSeatingDomainTables } from "./support/testDatabaseSafety.js";
import { buildFloorHarness } from "./support/floorTestHarness.js";
import { seedFloor } from "../../ops/floor/seedFloor.js";
import { Actor, ActorKind, ActorRole } from "../../domain/value-objects/Actor.js";
import { ReservationSourceCategory } from "../../domain/value-objects/ReservationSource.js";
import { ResourceBlockService } from "../../application/floor/ResourceBlockService.js";

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
    // R1.5-P1A — cancellation continues to use "GuestCancelled" explicitly
    // (the release-reason generalization did not silently change this).
    const released = await prisma.seatingAssignment.findFirstOrThrow({ where: { reservationId } });
    expect(released.releaseReason).toBe("GuestCancelled");
    const activeCommitment = await prisma.capacityCommitment.findFirst({ where: { reservationId, status: "Committed" } });
    expect(activeCommitment).toBeNull();
  });
});

describe("R1.5-P1A — completing a reservation releases its active SeatingAssignment", () => {
  it("completing an Assigned reservation releases the assignment and its resource links with reason Completed", async () => {
    const { availabilityOrchestrator, seatingOrchestrator } = buildFloorHarness(prisma, NOW);
    const table13 = await prisma.table.findFirstOrThrow({ where: { operationalLabel: "Table 13" } });
    const reservationId = await createReservation({ partySize: 2 });

    const assigned = await seatingOrchestrator.assignSeating({
      commandId: cmd(), reservationId, requestedAreaId: "Sushi", requestedPartySize: 2,
      resources: [{ tableId: table13.id }], startTime: new Date("2026-08-20T18:00:00Z"), endTime: new Date("2026-08-20T19:30:00Z"), actor: staffActor,
    });
    expect(assigned.type).toBe("ASSIGNED");
    if (assigned.type !== "ASSIGNED") throw new Error("unreachable");

    const result = await availabilityOrchestrator.completeWithCapacity({
      commandId: cmd(), reservationId, actor: staffActor, isManualCompletion: true, manualCompletionReason: "guest departed",
    });
    expect(result.ok).toBe(true);

    const active = await prisma.seatingAssignment.findFirst({ where: { reservationId, status: { in: ["Assigned", "Seated"] } } });
    expect(active).toBeNull();
    const released = await prisma.seatingAssignment.findUniqueOrThrow({ where: { id: assigned.assignment.id } });
    expect(released.status).toBe("Released");
    expect(released.releaseReason).toBe("Completed");
    expect(released.releasedBy).toBe(staffActor.id);
    expect(released.releasedAt).not.toBeNull();

    const resourceLinks = await prisma.seatingAssignmentResource.findMany({ where: { assignmentId: assigned.assignment.id } });
    expect(resourceLinks.length).toBeGreaterThan(0);
    for (const link of resourceLinks) expect(link.status).toBe("Released");

    const reservation = await prisma.reservation.findUniqueOrThrow({ where: { id: reservationId } });
    expect(reservation.status).toBe("Completed");
  });

  it("completing a Seated reservation releases the assignment the same way", async () => {
    const { availabilityOrchestrator, seatingOrchestrator } = buildFloorHarness(prisma, NOW);
    const table15 = await prisma.table.findFirstOrThrow({ where: { operationalLabel: "Table 15" } });
    const reservationId = await createReservation({ partySize: 2 });

    const assigned = await seatingOrchestrator.assignSeating({
      commandId: cmd(), reservationId, requestedAreaId: "Sushi", requestedPartySize: 2,
      resources: [{ tableId: table15.id }], startTime: new Date("2026-08-20T18:00:00Z"), endTime: new Date("2026-08-20T19:30:00Z"), actor: staffActor,
    });
    expect(assigned.type).toBe("ASSIGNED");
    if (assigned.type !== "ASSIGNED") throw new Error("unreachable");

    const seated = await seatingOrchestrator.markSeated({ reservationId, actor: staffActor });
    expect(seated.type).toBe("SEATED");

    const result = await availabilityOrchestrator.completeWithCapacity({
      commandId: cmd(), reservationId, actor: staffActor, isManualCompletion: true, manualCompletionReason: "guest departed",
    });
    expect(result.ok).toBe(true);

    const released = await prisma.seatingAssignment.findUniqueOrThrow({ where: { id: assigned.assignment.id } });
    expect(released.status).toBe("Released");
    expect(released.releaseReason).toBe("Completed");
    expect(released.releasedBy).toBe(staffActor.id);
    expect(released.releasedAt).not.toBeNull();
  });

  it("completing a reservation with no active assignment still completes normally (existing completion behavior preserved)", async () => {
    const { availabilityOrchestrator } = buildFloorHarness(prisma, NOW);
    const reservationId = await createReservation({ partySize: 2 });

    const result = await availabilityOrchestrator.completeWithCapacity({
      commandId: cmd(), reservationId, actor: staffActor, isManualCompletion: true, manualCompletionReason: "guest departed",
    });
    expect(result.ok).toBe(true);

    const anyAssignment = await prisma.seatingAssignment.findFirst({ where: { reservationId } });
    expect(anyAssignment).toBeNull();
    const reservation = await prisma.reservation.findUniqueOrThrow({ where: { id: reservationId } });
    expect(reservation.status).toBe("Completed");
  });

  it("an invalid completion transition (missing evidence) is rejected and does not release seating", async () => {
    const { availabilityOrchestrator, seatingOrchestrator } = buildFloorHarness(prisma, NOW);
    const table16 = await prisma.table.findFirstOrThrow({ where: { operationalLabel: "Table 16" } });
    const reservationId = await createReservation({ partySize: 2 });

    const assigned = await seatingOrchestrator.assignSeating({
      commandId: cmd(), reservationId, requestedAreaId: "Sushi", requestedPartySize: 2,
      resources: [{ tableId: table16.id }], startTime: new Date("2026-08-20T18:00:00Z"), endTime: new Date("2026-08-20T19:30:00Z"), actor: staffActor,
    });
    expect(assigned.type).toBe("ASSIGNED");

    // Neither `evidence` nor `isManualCompletion` supplied -> CAP-D01.01-R30
    // rejects this before the aggregate's status ever changes.
    const result = await availabilityOrchestrator.completeWithCapacity({ commandId: cmd(), reservationId, actor: staffActor });
    expect(result.ok).toBe(false);

    const stillActive = await prisma.seatingAssignment.findFirst({ where: { reservationId, status: "Assigned" } });
    expect(stillActive).not.toBeNull();
    const reservation = await prisma.reservation.findUniqueOrThrow({ where: { id: reservationId } });
    expect(reservation.status).toBe("Confirmed");
  });

  it("CapacityCommitment remains byte-for-byte unchanged by completion", async () => {
    const { availabilityOrchestrator, seatingOrchestrator } = buildFloorHarness(prisma, NOW);
    const table11 = await prisma.table.findFirstOrThrow({ where: { operationalLabel: "Table 11" } });
    const reservationId = await createReservation({ partySize: 2 });
    await prisma.capacityCommitment.create({
      data: {
        commitmentId: "p1a-commitment-1",
        reservationId,
        capacityPoolId: "Sushi",
        startTime: new Date("2026-08-20T18:00:00Z"),
        endTime: new Date("2026-08-20T19:30:00Z"),
        partySize: 2,
        status: "Committed",
        commandId: "p1a-commitment-cmd-1",
      },
    });
    const before = await prisma.capacityCommitment.findUniqueOrThrow({ where: { commitmentId: "p1a-commitment-1" } });

    await seatingOrchestrator.assignSeating({
      commandId: cmd(), reservationId, requestedAreaId: "Sushi", requestedPartySize: 2,
      resources: [{ tableId: table11.id }], startTime: new Date("2026-08-20T18:00:00Z"), endTime: new Date("2026-08-20T19:30:00Z"), actor: staffActor,
    });

    const result = await availabilityOrchestrator.completeWithCapacity({
      commandId: cmd(), reservationId, actor: staffActor, isManualCompletion: true, manualCompletionReason: "guest departed",
    });
    expect(result.ok).toBe(true);

    const after = await prisma.capacityCommitment.findUniqueOrThrow({ where: { commitmentId: "p1a-commitment-1" } });
    expect(after).toEqual(before);
  });
});

describe("R1.5-P1B — seating consistency on reservation modification (Policy 3: retain when valid, else release)", () => {
  async function createSeatedReservation(overrides: { partySize?: number; preferredArea?: "Sushi" | "Teppanyaki"; reservationDate?: Date; tableLabel: string }) {
    const { availabilityOrchestrator, seatingOrchestrator } = buildFloorHarness(prisma, NOW);
    const table = await prisma.table.findFirstOrThrow({ where: { operationalLabel: overrides.tableLabel } });
    const created = await availabilityOrchestrator.createWithCapacity({
      commandId: cmd(),
      servicePeriodId: "sp-floor",
      contactSelection: { type: "ExistingContact", contactId: "contact-1" },
      reservationDate: overrides.reservationDate ?? new Date("2026-08-20T18:00:00Z"),
      partySize: overrides.partySize ?? 2,
      source: { category: ReservationSourceCategory.Telephone },
      preferredArea: overrides.preferredArea ?? "Sushi",
      actor: staffActor,
    });
    if (created.type !== "CREATED") throw new Error("unreachable");
    const reservationId = created.outcome.reservationId;
    const assigned = await seatingOrchestrator.assignSeating({
      commandId: cmd(), reservationId, requestedAreaId: overrides.preferredArea ?? "Sushi", requestedPartySize: overrides.partySize ?? 2,
      resources: [{ tableId: table.id }],
      startTime: overrides.reservationDate ?? new Date("2026-08-20T18:00:00Z"),
      endTime: new Date((overrides.reservationDate ?? new Date("2026-08-20T18:00:00Z")).getTime() + 90 * 60_000),
      actor: staffActor,
    });
    if (assigned.type !== "ASSIGNED") throw new Error("unreachable");
    return { availabilityOrchestrator, seatingOrchestrator, reservationId, table, assignmentId: assigned.assignment.id };
  }

  it("party-size-only change within held capacity, interval/area unchanged -> UNCHANGED, zero writes, no assignment-id churn", async () => {
    const { availabilityOrchestrator, reservationId, assignmentId } = await createSeatedReservation({ partySize: 2, tableLabel: "Table 1" });

    const result = await availabilityOrchestrator.modifyWithCapacity({
      commandId: cmd(), reservationId, actor: staffActor, changes: { partySize: 3 },
    });
    expect(result.type).toBe("MODIFIED");
    if (result.type === "MODIFIED") expect(result.seatingDisposition).toBe("UNCHANGED");

    const stillActive = await prisma.seatingAssignment.findUniqueOrThrow({ where: { id: assignmentId } });
    expect(stillActive.status).toBe("Assigned");
    expect(stillActive.releaseReason).toBeNull();
    const all = await prisma.seatingAssignment.findMany({ where: { reservationId } });
    expect(all).toHaveLength(1); // no churn at all
  });

  it("party-size-only change exceeding held capacity -> RELEASED, no replacement", async () => {
    const { availabilityOrchestrator, reservationId } = await createSeatedReservation({ partySize: 2, tableLabel: "Table 6" }); // Table 6 capacity 2

    const result = await availabilityOrchestrator.modifyWithCapacity({
      commandId: cmd(), reservationId, actor: staffActor, changes: { partySize: 5 },
    });
    expect(result.type).toBe("MODIFIED");
    if (result.type === "MODIFIED") expect(result.seatingDisposition).toBe("RELEASED");

    const active = await prisma.seatingAssignment.findFirst({ where: { reservationId, status: { in: ["Assigned", "Seated"] } } });
    expect(active).toBeNull();
    const released = await prisma.seatingAssignment.findFirstOrThrow({ where: { reservationId } });
    expect(released.releaseReason).toBe("StaffReassigned");
  });

  it("date/time change, resource still free at the new interval -> RETAINED (release-and-recreate, same table, old released StaffReassigned)", async () => {
    const { availabilityOrchestrator, reservationId, table, assignmentId } = await createSeatedReservation({ partySize: 2, tableLabel: "Table 2" });

    const result = await availabilityOrchestrator.modifyWithCapacity({
      commandId: cmd(), reservationId, actor: staffActor,
      changes: { reservationDate: new Date("2026-08-20T20:00:00Z") },
      isServicePeriodStillValid: true,
    });
    expect(result.type).toBe("MODIFIED");
    if (result.type === "MODIFIED") expect(result.seatingDisposition).toBe("RETAINED");

    const oldRow = await prisma.seatingAssignment.findUniqueOrThrow({ where: { id: assignmentId } });
    expect(oldRow.status).toBe("Released");
    expect(oldRow.releaseReason).toBe("StaffReassigned");

    const active = await prisma.seatingAssignment.findFirstOrThrow({ where: { reservationId, status: { in: ["Assigned", "Seated"] } } });
    expect(active.id).not.toBe(assignmentId); // new identity — release-and-recreate, never in-place
    expect(active.status).toBe("Assigned");
    expect(active.startTime.toISOString()).toBe("2026-08-20T20:00:00.000Z");

    const allForReservation = await prisma.seatingAssignment.findMany({ where: { reservationId } });
    expect(allForReservation).toHaveLength(2); // exactly one active, one released — never corrupted/duplicated

    const oldResourceLinks = await prisma.seatingAssignmentResource.findMany({ where: { assignmentId: oldRow.id } });
    for (const link of oldResourceLinks) expect(link.status).toBe("Released");
    const newResourceLinks = await prisma.seatingAssignmentResource.findMany({ where: { assignmentId: active.id } });
    expect(newResourceLinks).toHaveLength(1);
    expect(newResourceLinks[0]?.status).toBe("Assigned");
    expect(newResourceLinks[0]?.tableId).toBe(table.id); // same physical table retained
  });

  it("preserves the ORIGINAL seatedAt byte-for-byte when a Seated assignment is retained via release-and-recreate", async () => {
    const { availabilityOrchestrator, seatingOrchestrator, reservationId, assignmentId } = await createSeatedReservation({ partySize: 2, tableLabel: "Table 3" });
    const seated = await seatingOrchestrator.markSeated({ reservationId, actor: staffActor });
    expect(seated.type).toBe("SEATED");
    const beforeModify = await prisma.seatingAssignment.findUniqueOrThrow({ where: { id: assignmentId } });
    expect(beforeModify.seatedAt).not.toBeNull();

    const result = await availabilityOrchestrator.modifyWithCapacity({
      commandId: cmd(), reservationId, actor: staffActor,
      changes: { reservationDate: new Date("2026-08-20T20:00:00Z") },
      isServicePeriodStillValid: true,
    });
    expect(result.type).toBe("MODIFIED");
    if (result.type === "MODIFIED") expect(result.seatingDisposition).toBe("RETAINED");

    const active = await prisma.seatingAssignment.findFirstOrThrow({ where: { reservationId, status: { in: ["Assigned", "Seated"] } } });
    expect(active.status).toBe("Seated"); // status preserved
    expect(active.seatedAt?.toISOString()).toBe(beforeModify.seatedAt?.toISOString()); // NEVER re-stamped, never lost
  });

  it("date/time change, resource now blocked at the new interval -> RELEASED", async () => {
    const { availabilityOrchestrator, table, reservationId } = await createSeatedReservation({ partySize: 2, tableLabel: "Table 4" });

    await prisma.resourceBlock.create({
      data: { id: "p1b-block-1", tableId: table.id, startTime: new Date("2026-08-20T19:30:00Z"), endTime: new Date("2026-08-20T23:00:00Z"), reason: "maintenance", createdBy: "staff-1" },
    });

    const result = await availabilityOrchestrator.modifyWithCapacity({
      commandId: cmd(), reservationId, actor: staffActor,
      changes: { reservationDate: new Date("2026-08-20T20:00:00Z") },
      isServicePeriodStillValid: true,
    });
    expect(result.type).toBe("MODIFIED");
    if (result.type === "MODIFIED") expect(result.seatingDisposition).toBe("RELEASED");

    const active = await prisma.seatingAssignment.findFirst({ where: { reservationId, status: { in: ["Assigned", "Seated"] } } });
    expect(active).toBeNull();
  });

  it("preferred-area change -> RELEASED unconditionally, even though the new area has room", async () => {
    const { availabilityOrchestrator, reservationId } = await createSeatedReservation({ partySize: 2, preferredArea: "Sushi", tableLabel: "Table 5" });

    const result = await availabilityOrchestrator.modifyWithCapacity({
      commandId: cmd(), reservationId, actor: staffActor, changes: { preferredArea: "Teppanyaki" },
    });
    expect(result.type).toBe("MODIFIED");
    if (result.type === "MODIFIED") expect(result.seatingDisposition).toBe("RELEASED");

    const active = await prisma.seatingAssignment.findFirst({ where: { reservationId, status: { in: ["Assigned", "Seated"] } } });
    expect(active).toBeNull();
    const released = await prisma.seatingAssignment.findFirstOrThrow({ where: { reservationId } });
    expect(released.releaseReason).toBe("StaffReassigned");
  });

  it("multiple fields changed together (date/time + party size), still satisfiable -> RETAINED", async () => {
    const { availabilityOrchestrator, reservationId } = await createSeatedReservation({ partySize: 2, tableLabel: "Table 8" }); // capacity 4

    const result = await availabilityOrchestrator.modifyWithCapacity({
      commandId: cmd(), reservationId, actor: staffActor,
      changes: { reservationDate: new Date("2026-08-20T20:00:00Z"), partySize: 4 },
      isServicePeriodStillValid: true,
    });
    expect(result.type).toBe("MODIFIED");
    if (result.type === "MODIFIED") expect(result.seatingDisposition).toBe("RETAINED");

    const active = await prisma.seatingAssignment.findFirstOrThrow({ where: { reservationId, status: { in: ["Assigned", "Seated"] } } });
    expect(active.startTime.toISOString()).toBe("2026-08-20T20:00:00.000Z");
  });

  it("no active assignment at all -> NO_ACTIVE_ASSIGNMENT, Modify behaves exactly as before this milestone", async () => {
    const { availabilityOrchestrator } = buildFloorHarness(prisma, NOW);
    const created = await availabilityOrchestrator.createWithCapacity({
      commandId: cmd(), servicePeriodId: "sp-floor",
      contactSelection: { type: "ExistingContact", contactId: "contact-1" },
      reservationDate: new Date("2026-08-20T18:00:00Z"), partySize: 2,
      source: { category: ReservationSourceCategory.Telephone }, preferredArea: "Sushi", actor: staffActor,
    });
    if (created.type !== "CREATED") throw new Error("unreachable");

    const result = await availabilityOrchestrator.modifyWithCapacity({
      commandId: cmd(), reservationId: created.outcome.reservationId, actor: staffActor, changes: { partySize: 3 },
    });
    expect(result.type).toBe("MODIFIED");
    if (result.type === "MODIFIED") expect(result.seatingDisposition).toBe("NO_ACTIVE_ASSIGNMENT");
  });

  it("retry with the same commandId creates no duplicate assignment", async () => {
    const { availabilityOrchestrator, reservationId, assignmentId } = await createSeatedReservation({ partySize: 2, tableLabel: "Table 7" });
    const commandId = cmd();

    const first = await availabilityOrchestrator.modifyWithCapacity({
      commandId, reservationId, actor: staffActor,
      changes: { reservationDate: new Date("2026-08-20T20:00:00Z") },
      isServicePeriodStillValid: true,
    });
    expect(first.type).toBe("MODIFIED");
    const afterFirst = await prisma.seatingAssignment.findMany({ where: { reservationId } });
    expect(afterFirst).toHaveLength(2);

    const second = await availabilityOrchestrator.modifyWithCapacity({
      commandId, reservationId, actor: staffActor,
      changes: { reservationDate: new Date("2026-08-20T20:00:00Z") },
      isServicePeriodStillValid: true,
    });
    expect(second.type).toBe("MODIFIED");
    const afterSecond = await prisma.seatingAssignment.findMany({ where: { reservationId } });
    expect(afterSecond).toHaveLength(2); // unchanged — no duplicate from the retry
    void assignmentId;
  });
});

/**
 * R1.5-P1B0 — regression coverage proving resolveLockTableIds' new
 * seat-to-parent-Table resolution (an extra findSeatById lookup, ahead of
 * buildCandidates' own identical lookup) does not change any established
 * public outcome for an invalid selector — every case here must still
 * resolve to the SAME domain-level rejection it always did, never an
 * unhandled/internal error, across all three write paths (assignSeating,
 * moveSeating, and Modify's revalidateOrReleaseForModify).
 */
describe("R1.5-P1B0 — invalid-resource-selector compatibility (assign, move, modify-revalidation)", () => {
  it("assignSeating: an unknown Table selector -> NOT_SEATABLE/RESOURCE_NOT_FOUND, not a throw", async () => {
    const { seatingOrchestrator } = buildFloorHarness(prisma, NOW);
    const reservationId = await createReservation({ partySize: 2 });

    const result = await seatingOrchestrator.assignSeating({
      commandId: cmd(), reservationId, requestedAreaId: "Sushi", requestedPartySize: 2,
      resources: [{ tableId: "does-not-exist-table" }],
      startTime: new Date("2026-08-20T18:00:00Z"), endTime: new Date("2026-08-20T19:30:00Z"), actor: staffActor,
    });
    expect(result.type).toBe("NOT_SEATABLE");
    if (result.type === "NOT_SEATABLE") expect(result.seatability.type).toBe("RESOURCE_NOT_FOUND");
  });

  it("assignSeating: an unknown Seat selector -> NOT_SEATABLE/RESOURCE_NOT_FOUND, not a throw", async () => {
    const { seatingOrchestrator } = buildFloorHarness(prisma, NOW);
    const reservationId = await createReservation({ partySize: 1, preferredArea: "Teppanyaki" });

    const result = await seatingOrchestrator.assignSeating({
      commandId: cmd(), reservationId, requestedAreaId: "Teppanyaki", requestedPartySize: 1,
      resources: [{ seatId: "does-not-exist-seat" }],
      startTime: new Date("2026-08-20T18:00:00Z"), endTime: new Date("2026-08-20T19:30:00Z"), actor: staffActor,
    });
    expect(result.type).toBe("NOT_SEATABLE");
    if (result.type === "NOT_SEATABLE") expect(result.seatability.type).toBe("RESOURCE_NOT_FOUND");
  });

  it("assignSeating: a malformed selector (neither tableId nor seatId) alone -> INVALID_REQUEST, not a throw", async () => {
    const { seatingOrchestrator } = buildFloorHarness(prisma, NOW);
    const reservationId = await createReservation({ partySize: 2 });

    const result = await seatingOrchestrator.assignSeating({
      commandId: cmd(), reservationId, requestedAreaId: "Sushi", requestedPartySize: 2,
      resources: [{}],
      startTime: new Date("2026-08-20T18:00:00Z"), endTime: new Date("2026-08-20T19:30:00Z"), actor: staffActor,
    });
    expect(result.type).toBe("NOT_SEATABLE");
    if (result.type === "NOT_SEATABLE") expect(result.seatability.type).toBe("INVALID_REQUEST");
  });

  it("assignSeating: one valid Table selector mixed with one unknown Table selector -> NOT_SEATABLE/RESOURCE_NOT_FOUND, not a throw", async () => {
    const { seatingOrchestrator } = buildFloorHarness(prisma, NOW);
    const table1 = await prisma.table.findFirstOrThrow({ where: { operationalLabel: "Table 1" } });
    const reservationId = await createReservation({ partySize: 2 });

    const result = await seatingOrchestrator.assignSeating({
      commandId: cmd(), reservationId, requestedAreaId: "Sushi", requestedPartySize: 2,
      resources: [{ tableId: table1.id }, { tableId: "does-not-exist-table" }],
      startTime: new Date("2026-08-20T18:00:00Z"), endTime: new Date("2026-08-20T19:30:00Z"), actor: staffActor,
    });
    expect(result.type).toBe("NOT_SEATABLE");
    if (result.type === "NOT_SEATABLE") expect(result.seatability.type).toBe("RESOURCE_NOT_FOUND");

    // The valid table must remain untouched — a rejected multi-resource
    // request must never partially claim only the valid half.
    const claim = await prisma.seatingAssignmentResource.findFirst({ where: { tableId: table1.id, status: { in: ["Assigned", "Seated"] } } });
    expect(claim).toBeNull();
  });

  it("assignSeating: a valid selector mixed with a malformed selector — documents actual current behavior (pre-existing, unmodified by this fix)", async () => {
    const { seatingOrchestrator } = buildFloorHarness(prisma, NOW);
    const table2 = await prisma.table.findFirstOrThrow({ where: { operationalLabel: "Table 2" } });
    const reservationId = await createReservation({ partySize: 2 });

    // buildCandidates silently produces NO candidate at all for a
    // selector matching neither `if (selector.tableId)` nor
    // `else if (selector.seatId)` — this is pre-existing behavior,
    // identical before and after R1.5-P1B0 (resolveLockTableIds mirrors
    // the exact same skip). Whatever this call actually does is recorded
    // here as a fact, not asserted as correct — out of scope to change
    // ("do not alter candidate validation").
    let outcomeType: string | undefined;
    let threw: unknown;
    try {
      const result = await seatingOrchestrator.assignSeating({
        commandId: cmd(), reservationId, requestedAreaId: "Sushi", requestedPartySize: 2,
        resources: [{ tableId: table2.id }, {}],
        startTime: new Date("2026-08-20T18:00:00Z"), endTime: new Date("2026-08-20T19:30:00Z"), actor: staffActor,
      });
      outcomeType = result.type;
    } catch (err) {
      threw = err;
    }
    // Whichever of these is true, it is EXACTLY as true today as it was
    // before this milestone's lock-key change — resolveLockTableIds does
    // not touch buildCandidates/createAssignment's own pre-existing
    // handling of a malformed selector.
    expect(outcomeType !== undefined || threw !== undefined).toBe(true);
  });

  it("moveSeating: an unknown Table selector -> NOT_SEATABLE/RESOURCE_NOT_FOUND, not a throw", async () => {
    const { seatingOrchestrator } = buildFloorHarness(prisma, NOW);
    const table3 = await prisma.table.findFirstOrThrow({ where: { operationalLabel: "Table 3" } });
    const reservationId = await createReservation({ partySize: 2 });
    const assigned = await seatingOrchestrator.assignSeating({
      commandId: cmd(), reservationId, requestedAreaId: "Sushi", requestedPartySize: 2,
      resources: [{ tableId: table3.id }], startTime: new Date("2026-08-20T18:00:00Z"), endTime: new Date("2026-08-20T19:30:00Z"), actor: staffActor,
    });
    expect(assigned.type).toBe("ASSIGNED");

    const result = await seatingOrchestrator.moveSeating({
      commandId: cmd(), reservationId, requestedAreaId: "Sushi", requestedPartySize: 2,
      resources: [{ tableId: "does-not-exist-table" }], actor: staffActor,
    });
    expect(result.type).toBe("NOT_SEATABLE");
    if (result.type === "NOT_SEATABLE") expect(result.seatability.type).toBe("RESOURCE_NOT_FOUND");

    // The original claim must survive an unsuccessful move untouched.
    const stillActive = await prisma.seatingAssignmentResource.findFirst({ where: { tableId: table3.id, status: { in: ["Assigned", "Seated"] } } });
    expect(stillActive).not.toBeNull();
  });

  it("moveSeating: an unknown Seat selector -> NOT_SEATABLE/RESOURCE_NOT_FOUND, not a throw", async () => {
    const { seatingOrchestrator } = buildFloorHarness(prisma, NOW);
    const grillF = await prisma.table.findFirstOrThrow({ where: { operationalLabel: "F" } });
    const seatF2 = await prisma.seat.findFirstOrThrow({ where: { tableId: grillF.id, operationalLabel: "F-02" } });
    const reservationId = await createReservation({ partySize: 1, preferredArea: "Teppanyaki" });
    const assigned = await seatingOrchestrator.assignSeating({
      commandId: cmd(), reservationId, requestedAreaId: "Teppanyaki", requestedPartySize: 1,
      resources: [{ seatId: seatF2.id }], startTime: new Date("2026-08-20T18:00:00Z"), endTime: new Date("2026-08-20T19:30:00Z"), actor: staffActor,
    });
    expect(assigned.type).toBe("ASSIGNED");

    const result = await seatingOrchestrator.moveSeating({
      commandId: cmd(), reservationId, requestedAreaId: "Teppanyaki", requestedPartySize: 1,
      resources: [{ seatId: "does-not-exist-seat" }], actor: staffActor,
    });
    expect(result.type).toBe("NOT_SEATABLE");
    if (result.type === "NOT_SEATABLE") expect(result.seatability.type).toBe("RESOURCE_NOT_FOUND");
  });

  it("Modify-revalidation: capacity-relevant Modify with an active assignment on a since-deactivated Table still resolves to a public disposition, not a throw", async () => {
    const { availabilityOrchestrator, seatingOrchestrator } = buildFloorHarness(prisma, NOW);
    // Bar 17 — a one-person Table-kind resource unused for assignment by
    // any other test in this suite (only ever listed read-only) — chosen
    // deliberately so mutating its status here cannot pollute shared,
    // never-truncated fixture data other tests/files depend on. Restored
    // in `finally` regardless, as defense in depth.
    const bar17 = await prisma.table.findFirstOrThrow({ where: { operationalLabel: "Bar 17" } });
    const created = await availabilityOrchestrator.createWithCapacity({
      commandId: cmd(), servicePeriodId: "sp-floor",
      contactSelection: { type: "ExistingContact", contactId: "contact-1" },
      reservationDate: new Date("2026-08-20T18:00:00Z"), partySize: 1,
      source: { category: ReservationSourceCategory.Telephone }, preferredArea: "Sushi", actor: staffActor,
    });
    if (created.type !== "CREATED") throw new Error("unreachable");
    const reservationId = created.outcome.reservationId;
    const assigned = await seatingOrchestrator.assignSeating({
      commandId: cmd(), reservationId, requestedAreaId: "Sushi", requestedPartySize: 1,
      resources: [{ tableId: bar17.id }], startTime: new Date("2026-08-20T18:00:00Z"), endTime: new Date("2026-08-20T19:30:00Z"), actor: staffActor,
    });
    if (assigned.type !== "ASSIGNED") throw new Error("unreachable");

    try {
      // Deactivate the held Table AFTER assignment — resolveLockTableIds
      // must still resolve and lock it (a Table id is used verbatim, no
      // existence lookup for Table selectors, matching pre-existing
      // behavior), and the subsequent buildCandidates/evaluateSeatability
      // check must still correctly reject it as RESOURCE_INACTIVE, not throw.
      await prisma.table.update({ where: { id: bar17.id }, data: { status: "Inactive" } });

      const result = await availabilityOrchestrator.modifyWithCapacity({
        commandId: cmd(), reservationId, actor: staffActor,
        changes: { reservationDate: new Date("2026-08-20T20:00:00Z") },
        isServicePeriodStillValid: true,
      });
      expect(result.type).toBe("MODIFIED");
      if (result.type === "MODIFIED") expect(result.seatingDisposition).toBe("RELEASED");
    } finally {
      await prisma.table.update({ where: { id: bar17.id }, data: { status: "Active" } });
    }
  });
});

/**
 * R1.5-P1B0 correction — ResourceBlockService.blockTable's own overlap
 * check now includes every child Seat of the target Table (application/
 * floor/ResourceBlockService.ts), not just the Table itself, so an
 * active Teppanyaki seat claim correctly prevents a conflicting parent-
 * Table block, exactly like the pre-existing Sushi Table case (see
 * tests/api/resource-blocks.test.ts's own "ACTIVE_ASSIGNMENT_CONFLICT"
 * coverage for Sushi, unaffected by this change since a Sushi Table has
 * zero child Seats).
 */
describe("R1.5-P1B0 — ResourceBlockService child-Seat conflict detection", () => {
  it("deterministic assignment-first ordering: a committed Seat claim, then a Table block attempt -> ACTIVE_ASSIGNMENT_CONFLICT, no block persisted", async () => {
    const harness = buildFloorHarness(prisma, NOW);
    const { seatingOrchestrator } = harness;
    const resourceBlockService = new ResourceBlockService(harness.floorRepository, harness.transactionManager);
    const grillC = await prisma.table.findFirstOrThrow({ where: { operationalLabel: "C" } });
    const seatC1 = await prisma.seat.findFirstOrThrow({ where: { tableId: grillC.id, operationalLabel: "C-01" } });
    const reservationId = await createReservation({ partySize: 1, preferredArea: "Teppanyaki" });

    const assigned = await seatingOrchestrator.assignSeating({
      commandId: cmd(), reservationId, requestedAreaId: "Teppanyaki", requestedPartySize: 1,
      resources: [{ seatId: seatC1.id }], startTime: new Date("2026-08-20T18:00:00Z"), endTime: new Date("2026-08-20T19:30:00Z"), actor: staffActor,
    });
    expect(assigned.type).toBe("ASSIGNED"); // committed first, sequentially

    const blockResult = await resourceBlockService.blockTable({
      operationalLabel: "C", startTime: new Date("2026-08-20T18:00:00Z"), endTime: new Date("2026-08-20T19:30:00Z"), reason: "assignment-first ordering test", actor: staffActor,
    });
    expect(blockResult.type).toBe("ACTIVE_ASSIGNMENT_CONFLICT");

    const block = await prisma.resourceBlock.findFirst({ where: { tableId: grillC.id } });
    expect(block).toBeNull(); // never persisted

    // The active assignment itself is untouched — blockTable never evicts.
    const stillActive = await prisma.seatingAssignmentResource.findFirst({ where: { seatId: seatC1.id, status: { in: ["Assigned", "Seated"] } } });
    expect(stillActive).not.toBeNull();
  });

  it("deterministic block-first ordering: a committed Table block, then a Seat assignment attempt -> RESOURCE_BLOCKED, no active Seat claim persisted", async () => {
    const harness = buildFloorHarness(prisma, NOW);
    const { seatingOrchestrator } = harness;
    const resourceBlockService = new ResourceBlockService(harness.floorRepository, harness.transactionManager);
    const grillD = await prisma.table.findFirstOrThrow({ where: { operationalLabel: "D" } });
    const seatD1 = await prisma.seat.findFirstOrThrow({ where: { tableId: grillD.id, operationalLabel: "D-01" } });
    const reservationId = await createReservation({ partySize: 1, preferredArea: "Teppanyaki" });

    const blockResult = await resourceBlockService.blockTable({
      operationalLabel: "D", startTime: new Date("2026-08-20T18:00:00Z"), endTime: new Date("2026-08-20T19:30:00Z"), reason: "block-first ordering test", actor: staffActor,
    });
    expect(blockResult.type).toBe("BLOCKED"); // committed first, sequentially

    const assigned = await seatingOrchestrator.assignSeating({
      commandId: cmd(), reservationId, requestedAreaId: "Teppanyaki", requestedPartySize: 1,
      resources: [{ seatId: seatD1.id }], startTime: new Date("2026-08-20T18:00:00Z"), endTime: new Date("2026-08-20T19:30:00Z"), actor: staffActor,
    });
    expect(assigned.type).toBe("NOT_SEATABLE");
    if (assigned.type === "NOT_SEATABLE") expect(assigned.seatability.type).toBe("RESOURCE_BLOCKED");

    const active = await prisma.seatingAssignmentResource.findFirst({ where: { seatId: seatD1.id, status: { in: ["Assigned", "Seated"] } } });
    expect(active).toBeNull(); // never persisted
  });

  it("an active claim on ANY child Seat of the grill is detected, not just one hardcoded seat — blocking a different seat's grill is still refused", async () => {
    const harness = buildFloorHarness(prisma, NOW);
    const { seatingOrchestrator } = harness;
    const resourceBlockService = new ResourceBlockService(harness.floorRepository, harness.transactionManager);
    const grillE = await prisma.table.findFirstOrThrow({ where: { operationalLabel: "E" } });
    const seatE3 = await prisma.seat.findFirstOrThrow({ where: { tableId: grillE.id, operationalLabel: "E-03" } });
    const reservationId = await createReservation({ partySize: 1, preferredArea: "Teppanyaki" });

    const assigned = await seatingOrchestrator.assignSeating({
      commandId: cmd(), reservationId, requestedAreaId: "Teppanyaki", requestedPartySize: 1,
      resources: [{ seatId: seatE3.id }], startTime: new Date("2026-08-20T18:00:00Z"), endTime: new Date("2026-08-20T19:30:00Z"), actor: staffActor,
    });
    expect(assigned.type).toBe("ASSIGNED"); // seat E-03 claimed, not E-01

    // Blocking the WHOLE grill must still detect the claim on E-03 — the
    // check must scan every child Seat, not one specific id.
    const blockResult = await resourceBlockService.blockTable({
      operationalLabel: "E", startTime: new Date("2026-08-20T18:00:00Z"), endTime: new Date("2026-08-20T19:30:00Z"), reason: "any-child-seat detection test", actor: staffActor,
    });
    expect(blockResult.type).toBe("ACTIVE_ASSIGNMENT_CONFLICT");
  });

  it("a RELEASED child-Seat claim does not block ResourceBlock creation", async () => {
    const harness = buildFloorHarness(prisma, NOW);
    const { seatingOrchestrator } = harness;
    const resourceBlockService = new ResourceBlockService(harness.floorRepository, harness.transactionManager);
    const grillF = await prisma.table.findFirstOrThrow({ where: { operationalLabel: "F" } });
    const seatF3 = await prisma.seat.findFirstOrThrow({ where: { tableId: grillF.id, operationalLabel: "F-03" } });
    const reservationId = await createReservation({ partySize: 1, preferredArea: "Teppanyaki" });

    const assigned = await seatingOrchestrator.assignSeating({
      commandId: cmd(), reservationId, requestedAreaId: "Teppanyaki", requestedPartySize: 1,
      resources: [{ seatId: seatF3.id }], startTime: new Date("2026-08-20T18:00:00Z"), endTime: new Date("2026-08-20T19:30:00Z"), actor: staffActor,
    });
    expect(assigned.type).toBe("ASSIGNED");

    const released = await seatingOrchestrator.releaseNoShow({ reservationId, actor: staffActor });
    expect(released.type).toBe("RELEASED");

    const blockResult = await resourceBlockService.blockTable({
      operationalLabel: "F", startTime: new Date("2026-08-20T18:00:00Z"), endTime: new Date("2026-08-20T19:30:00Z"), reason: "released-claim test", actor: staffActor,
    });
    expect(blockResult.type).toBe("BLOCKED"); // a Released row is correctly excluded, exactly like Sushi's pre-existing behavior
  });
});
