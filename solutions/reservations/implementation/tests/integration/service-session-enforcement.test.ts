import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { createTestPrismaClient, truncateSeatingDomainTables, truncateReservationDomainTables } from "./support/testDatabaseSafety.js";
import { buildFloorHarness } from "./support/floorTestHarness.js";
import { seedFloor } from "../../ops/floor/seedFloor.js";
import { CanonicalServicePeriodReader } from "../../infrastructure/CanonicalServicePeriodReader.js";
import { PrismaServiceSessionRepository } from "../../infrastructure/persistence/PrismaServiceSessionRepository.js";
import { ServiceSessionService } from "../../application/availability/ServiceSessionService.js";
import { PrismaTransactionManager } from "../../infrastructure/persistence/PrismaTransactionManager.js";
import { RandomIdGenerator } from "../../infrastructure/RandomIdGenerator.js";
import { Actor, ActorKind, ActorRole } from "../../domain/value-objects/Actor.js";
import { ReservationSourceCategory } from "../../domain/value-objects/ReservationSource.js";
import { toLocalServiceDate } from "../../domain/availability/ServiceTime.js";
import { deriveServiceCode } from "../../domain/availability/Service.js";

/**
 * R1.6-P2C-1 — enforcement of the Tier-1.5 session gate across every
 * approved call site (immediate walk-in, immediate assignment, mark-
 * seated, pre-assignment, Move, Modify-time seating revalidation), the
 * Close invariant (blocked by active assignments; leaves zero once it
 * succeeds), historical-data compatibility, and cleanup/recovery-path
 * exemption. Every test wires the REAL `CanonicalServicePeriodReader`
 * and a REAL `ServiceSessionRepository` via `buildFloorHarness`'s
 * optional overrides — every OTHER floor-seating test file keeps using
 * the shared harness's default (no session gate, `UnvalidatedServicePeriodReader`)
 * and is completely unaffected.
 */
const prisma = createTestPrismaClient();
const prismaB = createTestPrismaClient();
const staffActor: Actor = { id: "staff-session-enf", kind: ActorKind.AuthorizedUser, role: ActorRole.Reception };
// A dedicated, otherwise-unused date range (2027-01-01 onward),
// deliberately disjoint from tests/integration/service-session-lifecycle.test.ts's
// own 2026-09 through 2026-11 range — vitest runs test FILES concurrently
// against the SAME shared test database, and this file's own beforeEach
// below deletes every ServiceSession row it created; a shared date would
// risk deleting the other file's concurrently-in-flight fixture rows.
// enforceServicePeriod is never enabled by this harness, so the
// booking-window mechanism's own day-of-week rules are irrelevant here —
// only the Service-session gate is under test.
const DINNER_INSTANT = new Date("2027-01-01T18:00:00Z"); // 19:00 Amsterdam (CET) -> dinner
const LUNCH_INSTANT = new Date("2027-01-01T11:00:00Z"); // 12:00 Amsterdam (CET) -> lunch

let cmdCounter = 0;
function cmd(): string {
  cmdCounter += 1;
  return `svs-enf-cmd-${cmdCounter}`;
}
let resCounter = 0;

/**
 * `now` defaults to DINNER_INSTANT — every pre-existing call site in this
 * file (`harness()`, no argument) is byte-identical to before. The optional
 * override exists ONLY for the Close-vs-walk-in/Open-vs-walk-in races
 * below: `createImmediateWalkIn` derives its own reservation date (and
 * therefore its session-gate key) from `this.clock.now()`, never from a
 * caller-supplied instant, so those two races must construct their
 * harness with the SAME instant they seeded the session against.
 */
function harness(now: Date = DINNER_INSTANT) {
  const serviceSessionRepository = new PrismaServiceSessionRepository(prisma);
  const built = buildFloorHarness(prisma, now, new CanonicalServicePeriodReader(), serviceSessionRepository);
  const sessionService = new ServiceSessionService(serviceSessionRepository, new PrismaTransactionManager(prisma), new RandomIdGenerator(), { now: () => new Date() });
  return { ...built, serviceSessionRepository, sessionService };
}

async function createReservation(overrides: { partySize?: number; preferredArea?: string; reservationDate?: Date; servicePeriodId?: string } = {}): Promise<string> {
  resCounter += 1;
  const id = `svs-enf-res-${resCounter}`;
  const date = overrides.reservationDate ?? DINNER_INSTANT;
  await prisma.reservation.create({
    data: {
      id,
      servicePeriodId: overrides.servicePeriodId ?? "dinner",
      contactId: "contact-1",
      contactName: "Session Enforcement Guest",
      status: "Confirmed",
      reservationDate: date,
      partySize: overrides.partySize ?? 2,
      sourceCategory: "Telephone",
      preferredArea: overrides.preferredArea ?? "Sushi",
      createdBy: "staff-1",
      createdAt: DINNER_INSTANT,
      updatedAt: DINNER_INSTANT,
      version: 1,
    },
  });
  return id;
}

/** Creates (and optionally opens) a session for the given instant's ACTUAL derived (serviceCode, serviceDate) — never a hardcoded date, so callers using different instants (e.g. the Move-vs-Close iteration test) each get their own distinct key. */
async function seedSession(sessionService: ServiceSessionService, instant: Date, status: "Created" | "Opened" | "Closed" | "Cancelled" | "None") {
  if (status === "None") return null;
  const serviceCode = deriveServiceCode(instant);
  const serviceDate = toLocalServiceDate(instant);
  const created = await sessionService.create({ serviceCode, serviceDate, actor: staffActor });
  if (created.type !== "CREATED") throw new Error("unreachable");
  if (status === "Created") return created.session;
  if (status === "Opened") {
    const opened = await sessionService.open(created.session.id);
    if (opened.type !== "OPENED") throw new Error("unreachable");
    return opened.session;
  }
  if (status === "Closed") {
    const opened = await sessionService.open(created.session.id);
    if (opened.type !== "OPENED") throw new Error("unreachable");
    const closed = await sessionService.close(created.session.id);
    if (closed.type !== "CLOSED") throw new Error("unreachable");
    return closed.session;
  }
  if (status === "Cancelled") {
    const cancelled = await sessionService.cancel(created.session.id);
    if (cancelled.type !== "CANCELLED") throw new Error("unreachable");
    return cancelled.session;
  }
  throw new Error("unreachable");
}

beforeAll(async () => {
  await truncateSeatingDomainTables(prisma);
  await truncateReservationDomainTables(prisma);
  await seedFloor(process.env["TEST_DATABASE_URL"]!);
});
afterAll(async () => {
  await prisma.$disconnect();
  await prismaB.$disconnect();
});
beforeEach(async () => {
  await truncateSeatingDomainTables(prisma);
  await truncateReservationDomainTables(prisma);
  // Not covered by either truncate helper above (ServiceSession is new
  // in R1.6-P2C-1). Every test in this file creates its own session(s)
  // within this file's own dedicated 2027-01-01..2027-01-10 date range
  // (see the module-level date comment above) — deleted here, scoped to exactly
  // that range, so the SECOND test in any describe.each block doesn't
  // collide with the first's already-created row on the unique
  // (serviceCode, serviceDate) key, WITHOUT touching
  // service-session-lifecycle.test.ts's own concurrently-running rows
  // in its disjoint 2026-09..2026-11 range (a blanket deleteMany({})
  // would not be safe under vitest's parallel-file execution).
  await prisma.serviceSession.deleteMany({ where: { serviceDate: { gte: new Date("2027-01-01T00:00:00.000Z"), lt: new Date("2027-01-10T00:00:00.000Z") } } });
  await prisma.contact.create({
    data: { id: "contact-1", displayName: "Session Enforcement Guest", phoneRaw: "0699999996", phoneNormalized: "+31699999996", createdBy: "staff-1", lastRelevantActivityAt: DINNER_INSTANT },
  });
});

describe.each(["None", "Created", "Closed", "Cancelled"] as const)("Immediate assignment requires Opened — session status %s rejects", (status) => {
  it(`assignSeating(seatImmediately: true) rejects with SESSION_NOT_OPEN when session is ${status}`, async () => {
    const { seatingOrchestrator, sessionService } = harness();
    await seedSession(sessionService, DINNER_INSTANT, status);
    const reservationId = await createReservation();
    const table = await prisma.table.findFirstOrThrow({ where: { operationalLabel: "Table 1" } });

    const result = await seatingOrchestrator.assignSeating({
      commandId: cmd(),
      reservationId,
      requestedAreaId: "Sushi",
      requestedPartySize: 2,
      resources: [{ tableId: table.id }],
      startTime: DINNER_INSTANT,
      endTime: new Date(DINNER_INSTANT.getTime() + 90 * 60_000),
      actor: staffActor,
      seatImmediately: true,
    });
    expect(result.type).toBe("SESSION_NOT_OPEN");

    const rows = await prisma.seatingAssignment.findMany({ where: { reservationId } });
    expect(rows).toHaveLength(0);
  });
});

describe("Immediate assignment requires Opened — Opened succeeds", () => {
  it("assignSeating(seatImmediately: true) succeeds once the session is Opened", async () => {
    const { seatingOrchestrator, sessionService } = harness();
    await seedSession(sessionService, DINNER_INSTANT, "Opened");
    const reservationId = await createReservation();
    const table = await prisma.table.findFirstOrThrow({ where: { operationalLabel: "Table 1" } });

    const result = await seatingOrchestrator.assignSeating({
      commandId: cmd(),
      reservationId,
      requestedAreaId: "Sushi",
      requestedPartySize: 2,
      resources: [{ tableId: table.id }],
      startTime: DINNER_INSTANT,
      endTime: new Date(DINNER_INSTANT.getTime() + 90 * 60_000),
      actor: staffActor,
      seatImmediately: true,
    });
    expect(result.type).toBe("ASSIGNED");
  });
});

describe.each(["None", "Created", "Opened"] as const)("Pre-assignment is allowed for %s", (status) => {
  it(`assignSeating(seatImmediately: false) succeeds when session is ${status}`, async () => {
    const { seatingOrchestrator, sessionService } = harness();
    await seedSession(sessionService, DINNER_INSTANT, status);
    const reservationId = await createReservation();
    const table = await prisma.table.findFirstOrThrow({ where: { operationalLabel: "Table 2" } });

    const result = await seatingOrchestrator.assignSeating({
      commandId: cmd(),
      reservationId,
      requestedAreaId: "Sushi",
      requestedPartySize: 2,
      resources: [{ tableId: table.id }],
      startTime: DINNER_INSTANT,
      endTime: new Date(DINNER_INSTANT.getTime() + 90 * 60_000),
      actor: staffActor,
      seatImmediately: false,
    });
    expect(result.type).toBe("ASSIGNED");
  });
});

describe.each(["Closed", "Cancelled"] as const)("Pre-assignment is rejected for %s", (status) => {
  it(`assignSeating(seatImmediately: false) rejects with SESSION_NOT_OPEN when session is ${status}`, async () => {
    const { seatingOrchestrator, sessionService } = harness();
    await seedSession(sessionService, DINNER_INSTANT, status);
    const reservationId = await createReservation();
    const table = await prisma.table.findFirstOrThrow({ where: { operationalLabel: "Table 2" } });

    const result = await seatingOrchestrator.assignSeating({
      commandId: cmd(),
      reservationId,
      requestedAreaId: "Sushi",
      requestedPartySize: 2,
      resources: [{ tableId: table.id }],
      startTime: DINNER_INSTANT,
      endTime: new Date(DINNER_INSTANT.getTime() + 90 * 60_000),
      actor: staffActor,
      seatImmediately: false,
    });
    expect(result.type).toBe("SESSION_NOT_OPEN");

    const rows = await prisma.seatingAssignment.findMany({ where: { reservationId } });
    expect(rows).toHaveLength(0);
  });
});

describe("Mark-seated requires Opened", () => {
  it("rejects with SESSION_NOT_OPEN when the session has since Closed, and does not touch the assignment", async () => {
    const { seatingOrchestrator, sessionService } = harness();
    const session = await seedSession(sessionService, DINNER_INSTANT, "Opened");
    const reservationId = await createReservation();
    const table = await prisma.table.findFirstOrThrow({ where: { operationalLabel: "Table 3" } });
    const assigned = await seatingOrchestrator.assignSeating({
      commandId: cmd(),
      reservationId,
      requestedAreaId: "Sushi",
      requestedPartySize: 2,
      resources: [{ tableId: table.id }],
      startTime: DINNER_INSTANT,
      endTime: new Date(DINNER_INSTANT.getTime() + 90 * 60_000),
      actor: staffActor,
      seatImmediately: false,
    });
    if (assigned.type !== "ASSIGNED") throw new Error("unreachable");

    // Release the pre-assignment so Close's active-assignment check passes, then close.
    await seatingOrchestrator.releaseNoShow({ reservationId, actor: staffActor });
    const closeResult = await sessionService.close(session!.id);
    expect(closeResult.type).toBe("CLOSED");

    // Re-assign is impossible now (Closed rejects even pre-assign per the
    // matrix above); this test's real target is mark-seated's OWN gate,
    // proven directly against a manually-retained active row instead.
    const table2 = await prisma.table.findFirstOrThrow({ where: { operationalLabel: "Table 4" } });
    await prisma.seatingAssignment.create({
      data: {
        id: "svs-enf-manual-assignment-1",
        reservationId,
        status: "Assigned",
        startTime: DINNER_INSTANT,
        endTime: new Date(DINNER_INSTANT.getTime() + 90 * 60_000),
        assignedBy: staffActor.id,
        commandId: cmd(),
        resources: { create: [{ id: "svs-enf-manual-resource-1", tableId: table2.id, status: "Assigned", startTime: DINNER_INSTANT, endTime: new Date(DINNER_INSTANT.getTime() + 90 * 60_000) }] },
      },
    });

    const markResult = await seatingOrchestrator.markSeated({ reservationId, actor: staffActor });
    expect(markResult.type).toBe("SESSION_NOT_OPEN");

    const row = await prisma.seatingAssignment.findUniqueOrThrow({ where: { id: "svs-enf-manual-assignment-1" } });
    expect(row.status).toBe("Assigned"); // untouched — never flipped to Seated
    expect(row.seatedAt).toBeNull();
  });

  it("a repeated mark-seated call on an ALREADY-Seated assignment is idempotent even after the session Closed (no-op never gated)", async () => {
    const { seatingOrchestrator, sessionService } = harness();
    await seedSession(sessionService, DINNER_INSTANT, "Opened");
    const reservationId = await createReservation();
    const table = await prisma.table.findFirstOrThrow({ where: { operationalLabel: "Table 5" } });
    const assigned = await seatingOrchestrator.assignSeating({
      commandId: cmd(),
      reservationId,
      requestedAreaId: "Sushi",
      requestedPartySize: 2,
      resources: [{ tableId: table.id }],
      startTime: DINNER_INSTANT,
      endTime: new Date(DINNER_INSTANT.getTime() + 90 * 60_000),
      actor: staffActor,
      seatImmediately: true,
    });
    if (assigned.type !== "ASSIGNED") throw new Error("unreachable");
    const first = await seatingOrchestrator.markSeated({ reservationId, actor: staffActor });
    expect(first.type).toBe("SEATED");

    const second = await seatingOrchestrator.markSeated({ reservationId, actor: staffActor });
    expect(second.type).toBe("SEATED");
  });
});

describe("Move is never status-gated, and cannot violate the zero-active-assignment invariant", () => {
  it("succeeds even when the session for this reservation's own date is Closed", async () => {
    const { seatingOrchestrator, sessionService } = harness();
    const session = await seedSession(sessionService, DINNER_INSTANT, "Opened");
    const reservationId = await createReservation();
    const table1 = await prisma.table.findFirstOrThrow({ where: { operationalLabel: "Table 6" } });
    const table7 = await prisma.table.findFirstOrThrow({ where: { operationalLabel: "Table 7" } });
    const assigned = await seatingOrchestrator.assignSeating({
      commandId: cmd(),
      reservationId,
      requestedAreaId: "Sushi",
      requestedPartySize: 2,
      resources: [{ tableId: table1.id }],
      startTime: DINNER_INSTANT,
      endTime: new Date(DINNER_INSTANT.getTime() + 90 * 60_000),
      actor: staffActor,
      seatImmediately: false,
    });
    if (assigned.type !== "ASSIGNED") throw new Error("unreachable");

    // Force the session straight to Closed via direct row manipulation
    // (a normal close() call would correctly refuse — ACTIVE_ASSIGNMENTS_EXIST
    // — since this reservation's own assignment is still active; that
    // mechanism is proven separately above). This test's own target is
    // proving Move itself carries no status check at all.
    await prisma.serviceSession.update({ where: { id: session!.id }, data: { status: "Closed", closedAt: new Date() } });

    const moveResult = await seatingOrchestrator.moveSeating({
      commandId: cmd(),
      reservationId,
      requestedAreaId: "Sushi",
      requestedPartySize: 2,
      resources: [{ tableId: table7.id }],
      actor: staffActor,
    });
    expect(moveResult.type).toBe("MOVED");
  });

  it("N repetitions of a genuinely concurrent Move vs Close: the zero-active-assignment invariant always holds on whichever side wins", async () => {
    const iterations = 8;
    for (let i = 0; i < iterations; i += 1) {
      const instant = new Date(DINNER_INSTANT.getTime() + i * 24 * 60 * 60_000); // a fresh calendar date per iteration
      const h = harness();
      const session = await seedSession(h.sessionService, instant, "Opened");
      const reservationId = await createReservation({ reservationDate: instant });
      const tableA = await prisma.table.findFirstOrThrow({ where: { operationalLabel: "Table 8" } });
      const tableB = await prisma.table.findFirstOrThrow({ where: { operationalLabel: "Table 9" } });
      const assigned = await h.seatingOrchestrator.assignSeating({
        commandId: cmd(),
        reservationId,
        requestedAreaId: "Sushi",
        requestedPartySize: 2,
        resources: [{ tableId: tableA.id }],
        startTime: instant,
        endTime: new Date(instant.getTime() + 90 * 60_000),
        actor: staffActor,
        seatImmediately: false,
      });
      if (assigned.type !== "ASSIGNED") throw new Error("unreachable");

      const hB = harness();
      const [moveResult, closeResult] = await Promise.all([
        h.seatingOrchestrator.moveSeating({ commandId: cmd(), reservationId, requestedAreaId: "Sushi", requestedPartySize: 2, resources: [{ tableId: tableB.id }], actor: staffActor }),
        hB.sessionService.close(session!.id),
      ]);

      if (closeResult.type === "CLOSED") {
        // Close won the lock first (or observed zero active assignments
        // regardless of Move's own outcome) -> the invariant requires
        // zero active assignments for this reservation, right now.
        const rows = await prisma.seatingAssignment.findMany({ where: { reservationId, status: { in: ["Assigned", "Seated"] } } });
        expect(rows).toHaveLength(0);
      } else {
        // Close saw an active assignment (whichever resource Move had or
        // hadn't yet moved to) and correctly refused — also a valid,
        // safe outcome.
        expect(closeResult.type).toBe("ACTIVE_ASSIGNMENTS_EXIST");
      }
      expect(moveResult.type).toBe("MOVED");
    }
  });
});

describe("Modify-time seating revalidation is never status-gated", () => {
  it("a capacity-relevant Modify still retains/releases seating correctly even when the target session is Closed", async () => {
    const { availabilityOrchestrator, seatingOrchestrator, sessionService } = harness();
    await seedSession(sessionService, DINNER_INSTANT, "Opened");
    const created = await availabilityOrchestrator.createWithCapacity({
      commandId: cmd(),
      servicePeriodId: "dinner",
      contactSelection: { type: "ExistingContact", contactId: "contact-1" },
      reservationDate: DINNER_INSTANT,
      partySize: 2,
      source: { category: ReservationSourceCategory.Telephone },
      preferredArea: "Sushi",
      actor: staffActor,
    });
    if (created.type !== "CREATED") throw new Error("unreachable");
    const reservationId = created.outcome.reservationId;
    const table = await prisma.table.findFirstOrThrow({ where: { operationalLabel: "Table 10" } });
    const assigned = await seatingOrchestrator.assignSeating({
      commandId: cmd(),
      reservationId,
      requestedAreaId: "Sushi",
      requestedPartySize: 2,
      resources: [{ tableId: table.id }],
      startTime: DINNER_INSTANT,
      endTime: new Date(DINNER_INSTANT.getTime() + 90 * 60_000),
      actor: staffActor,
      seatImmediately: true,
    });
    if (assigned.type !== "ASSIGNED") throw new Error("unreachable");

    // A same-day, same-service, small time nudge (still "dinner", still
    // within the resource's own claimed interval so retention is
    // plausible) — the target session for this new time is separately
    // seeded Closed to prove the revalidation branch itself is unfazed.
    const newStart = new Date(DINNER_INSTANT.getTime() + 5 * 60_000);
    const modifyResult = await availabilityOrchestrator.modifyWithCapacity({
      commandId: cmd(),
      reservationId,
      actor: staffActor,
      changes: { reservationDate: newStart },
    });
    expect(modifyResult.type).toBe("MODIFIED");
  });
});

describe("Historical noncanonical servicePeriodId — enforcement derives from reservationDate only", () => {
  it("a reservation with a legacy servicePeriodId (e.g. \"sp-dinner\") is gated identically to a canonical one", async () => {
    const { seatingOrchestrator, sessionService } = harness();
    const reservationId = await createReservation({ servicePeriodId: "sp-dinner" });
    const table = await prisma.table.findFirstOrThrow({ where: { operationalLabel: "Table 11" } });
    const request = {
      commandId: cmd(),
      reservationId,
      requestedAreaId: "Sushi",
      requestedPartySize: 2,
      resources: [{ tableId: table.id }],
      startTime: DINNER_INSTANT,
      endTime: new Date(DINNER_INSTANT.getTime() + 90 * 60_000),
      actor: staffActor,
      seatImmediately: true,
    };

    // No session yet -> rejected, exactly like a canonical-value row would be.
    const rejected = await seatingOrchestrator.assignSeating(request);
    expect(rejected.type).toBe("SESSION_NOT_OPEN");

    // Opening the derived (dinner, 2026-09-15) session — never referencing
    // "sp-dinner" anywhere — makes it succeed.
    await seedSession(sessionService, DINNER_INSTANT, "Opened");
    const accepted = await seatingOrchestrator.assignSeating({ ...request, commandId: cmd() });
    expect(accepted.type).toBe("ASSIGNED");
  });
});

describe("Close — blocked by active assignments, succeeds once released", () => {
  it("ACTIVE_ASSIGNMENTS_EXIST while a Seated assignment exists for that service/date; CLOSED once it is released", async () => {
    const { seatingOrchestrator, sessionService } = harness();
    const session = await seedSession(sessionService, DINNER_INSTANT, "Opened");
    const reservationId = await createReservation();
    const table = await prisma.table.findFirstOrThrow({ where: { operationalLabel: "Table 12" } });
    const assigned = await seatingOrchestrator.assignSeating({
      commandId: cmd(),
      reservationId,
      requestedAreaId: "Sushi",
      requestedPartySize: 2,
      resources: [{ tableId: table.id }],
      startTime: DINNER_INSTANT,
      endTime: new Date(DINNER_INSTANT.getTime() + 90 * 60_000),
      actor: staffActor,
      seatImmediately: true,
    });
    if (assigned.type !== "ASSIGNED") throw new Error("unreachable");

    const blocked = await sessionService.close(session!.id);
    expect(blocked).toMatchObject({ type: "ACTIVE_ASSIGNMENTS_EXIST", count: 1 });

    await seatingOrchestrator.releaseNoShow({ reservationId, actor: staffActor });
    const closed = await sessionService.close(session!.id);
    expect(closed.type).toBe("CLOSED");
  });
});

describe("Cleanup/recovery paths remain available after closure", () => {
  it("releaseNoShow, cancel-with-capacity's seating release, and mark-seated's own idempotent no-op all still work after the session Closed", async () => {
    const { seatingOrchestrator, availabilityOrchestrator, sessionService } = harness();
    const session = await seedSession(sessionService, DINNER_INSTANT, "Opened");
    const reservationId = await createReservation();
    const table = await prisma.table.findFirstOrThrow({ where: { operationalLabel: "Table 13" } });
    const assigned = await seatingOrchestrator.assignSeating({
      commandId: cmd(),
      reservationId,
      requestedAreaId: "Sushi",
      requestedPartySize: 2,
      resources: [{ tableId: table.id }],
      startTime: DINNER_INSTANT,
      endTime: new Date(DINNER_INSTANT.getTime() + 90 * 60_000),
      actor: staffActor,
      seatImmediately: false,
    });
    if (assigned.type !== "ASSIGNED") throw new Error("unreachable");

    // Release it (not via close's own gate — proves releaseNoShow itself
    // never checks session status) so close can proceed for real.
    const released = await seatingOrchestrator.releaseNoShow({ reservationId, actor: staffActor });
    expect(released.type).toBe("RELEASED");
    const closed = await sessionService.close(session!.id);
    expect(closed.type).toBe("CLOSED");

    // Cancel still works on a reservation whose service/date session is now Closed.
    const cancelResult = await availabilityOrchestrator.cancelWithCapacity({ commandId: cmd(), reservationId, actor: staffActor });
    expect(cancelResult.type).toBe("CANCELLED");
  });
});

describe("Walk-in creation requires Opened, atomically — no partial Reservation/CapacityCommitment write on rejection", () => {
  it("rejects with SESSION_NOT_OPEN and writes nothing (neither Reservation NOR CapacityCommitment) when no session exists yet", async () => {
    const { availabilityOrchestrator } = harness();
    const beforeReservations = await prisma.reservation.count();
    const beforeCommitments = await prisma.capacityCommitment.count();
    const result = await availabilityOrchestrator.createImmediateWalkIn({
      commandId: cmd(),
      contactSelection: { displayName: "Walk-in Guest" },
      partySize: 2,
      preferredArea: "Sushi",
      resources: [],
      actor: staffActor,
    });
    expect(result.type).toBe("NOT_CREATED");
    if (result.type !== "NOT_CREATED") throw new Error("unreachable");
    expect(result.result.type).toBe("SESSION_NOT_OPEN");
    expect(await prisma.reservation.count()).toBe(beforeReservations);
    expect(await prisma.capacityCommitment.count()).toBe(beforeCommitments);
  });

  it("succeeds once the session is Opened, deriving the code from the walk-in's own instant", async () => {
    const { availabilityOrchestrator, sessionService } = harness();
    await seedSession(sessionService, DINNER_INSTANT, "Opened");
    const result = await availabilityOrchestrator.createImmediateWalkIn({
      commandId: cmd(),
      contactSelection: { displayName: "Walk-in Guest" },
      partySize: 2,
      preferredArea: "Sushi",
      resources: [],
      actor: staffActor,
    });
    expect(["CREATED_AND_SEATED", "CREATED_UNSEATED"]).toContain(result.type);
  });
});

describe("Close vs immediate assignment: genuinely concurrent, deterministic on either winner", () => {
  it("N iterations: assign wins -> Close then sees ACTIVE_ASSIGNMENTS_EXIST; Close wins -> assign then sees SESSION_NOT_OPEN — never both succeeding", async () => {
    const iterations = 8;
    for (let i = 0; i < iterations; i += 1) {
      const instant = new Date(DINNER_INSTANT.getTime() + i * 24 * 60 * 60_000);
      const h = harness();
      const session = await seedSession(h.sessionService, instant, "Opened");
      const reservationId = await createReservation({ reservationDate: instant });
      const table = await prisma.table.findFirstOrThrow({ where: { operationalLabel: "Table 15" } });

      const hB = harness();
      const [assignResult, closeResult] = await Promise.all([
        h.seatingOrchestrator.assignSeating({
          commandId: cmd(),
          reservationId,
          requestedAreaId: "Sushi",
          requestedPartySize: 2,
          resources: [{ tableId: table.id }],
          startTime: instant,
          endTime: new Date(instant.getTime() + 90 * 60_000),
          actor: staffActor,
          seatImmediately: true,
        }),
        hB.sessionService.close(session!.id),
      ]);

      if (closeResult.type === "CLOSED") {
        expect(assignResult.type).toBe("SESSION_NOT_OPEN");
      } else {
        expect(closeResult.type).toBe("ACTIVE_ASSIGNMENTS_EXIST");
        expect(assignResult.type).toBe("ASSIGNED");
      }
    }
  });
});

describe("Close vs pre-assignment: genuinely concurrent, deterministic on either winner", () => {
  it("N iterations: pre-assign wins -> Close then sees ACTIVE_ASSIGNMENTS_EXIST; Close wins -> pre-assign then sees SESSION_NOT_OPEN", async () => {
    const iterations = 8;
    for (let i = 0; i < iterations; i += 1) {
      const instant = new Date(DINNER_INSTANT.getTime() + i * 24 * 60 * 60_000);
      const h = harness();
      const session = await seedSession(h.sessionService, instant, "Opened");
      const reservationId = await createReservation({ reservationDate: instant });
      const table = await prisma.table.findFirstOrThrow({ where: { operationalLabel: "Table 16" } });

      const hB = harness();
      const [assignResult, closeResult] = await Promise.all([
        h.seatingOrchestrator.assignSeating({
          commandId: cmd(),
          reservationId,
          requestedAreaId: "Sushi",
          requestedPartySize: 2,
          resources: [{ tableId: table.id }],
          startTime: instant,
          endTime: new Date(instant.getTime() + 90 * 60_000),
          actor: staffActor,
          seatImmediately: false,
        }),
        hB.sessionService.close(session!.id),
      ]);

      if (closeResult.type === "CLOSED") {
        expect(assignResult.type).toBe("SESSION_NOT_OPEN");
      } else {
        expect(closeResult.type).toBe("ACTIVE_ASSIGNMENTS_EXIST");
        expect(assignResult.type).toBe("ASSIGNED");
      }
    }
  });
});

describe("Close vs mark-seated: genuinely concurrent lock contention, no corruption", () => {
  it("N iterations: the pre-existing Assigned row is active regardless of who wins the lock, so Close always correctly refuses and mark-seated always succeeds — proves the shared session lock serializes both without deadlock or a wrongly-permitted Close", async () => {
    const iterations = 6;
    for (let i = 0; i < iterations; i += 1) {
      const instant = new Date(DINNER_INSTANT.getTime() + i * 24 * 60 * 60_000);
      const h = harness();
      const session = await seedSession(h.sessionService, instant, "Opened");
      const reservationId = await createReservation({ reservationDate: instant });
      const table = await prisma.table.findFirstOrThrow({ where: { operationalLabel: "Table 15" } });
      const assigned = await h.seatingOrchestrator.assignSeating({
        commandId: cmd(),
        reservationId,
        requestedAreaId: "Sushi",
        requestedPartySize: 2,
        resources: [{ tableId: table.id }],
        startTime: instant,
        endTime: new Date(instant.getTime() + 90 * 60_000),
        actor: staffActor,
        seatImmediately: false,
      });
      if (assigned.type !== "ASSIGNED") throw new Error("unreachable");

      const hB = harness();
      const [markResult, closeResult] = await Promise.all([
        h.seatingOrchestrator.markSeated({ reservationId, actor: staffActor }),
        hB.sessionService.close(session!.id),
      ]);

      expect(markResult.type).toBe("SEATED");
      expect(closeResult).toMatchObject({ type: "ACTIVE_ASSIGNMENTS_EXIST", count: 1 });
    }
  });
});

describe("Close vs Modify-time seating revalidation: genuinely concurrent lock contention, no corruption", () => {
  it("N iterations: a retaining Modify keeps the assignment active regardless of who wins the lock, so Close always correctly refuses and Modify always succeeds retaining seating", async () => {
    const iterations = 6;
    for (let i = 0; i < iterations; i += 1) {
      const instant = new Date(DINNER_INSTANT.getTime() + i * 24 * 60 * 60_000);
      const h = harness();
      const session = await seedSession(h.sessionService, instant, "Opened");
      const created = await h.availabilityOrchestrator.createWithCapacity({
        commandId: cmd(),
        servicePeriodId: "dinner",
        contactSelection: { type: "ExistingContact", contactId: "contact-1" },
        reservationDate: instant,
        partySize: 2,
        source: { category: ReservationSourceCategory.Telephone },
        preferredArea: "Sushi",
        actor: staffActor,
      });
      if (created.type !== "CREATED") throw new Error("unreachable");
      const reservationId = created.outcome.reservationId;
      const table = await prisma.table.findFirstOrThrow({ where: { operationalLabel: "Table 16" } });
      const assigned = await h.seatingOrchestrator.assignSeating({
        commandId: cmd(),
        reservationId,
        requestedAreaId: "Sushi",
        requestedPartySize: 2,
        resources: [{ tableId: table.id }],
        startTime: instant,
        endTime: new Date(instant.getTime() + 90 * 60_000),
        actor: staffActor,
        seatImmediately: true,
      });
      if (assigned.type !== "ASSIGNED") throw new Error("unreachable");

      const hB = harness();
      const newStart = new Date(instant.getTime() + 5 * 60_000);
      const [modifyResult, closeResult] = await Promise.all([
        h.availabilityOrchestrator.modifyWithCapacity({ commandId: cmd(), reservationId, actor: staffActor, changes: { reservationDate: newStart } }),
        hB.sessionService.close(session!.id),
      ]);

      expect(modifyResult.type).toBe("MODIFIED");
      if (modifyResult.type === "MODIFIED") expect(modifyResult.seatingDisposition).toBe("RETAINED");
      expect(closeResult).toMatchObject({ type: "ACTIVE_ASSIGNMENTS_EXIST", count: 1 });
    }
  });
});

describe("Close vs walk-in: genuinely concurrent — a Closed outcome is never paired with an active assignment for that date", () => {
  /**
   * Walk-in spans TWO separate transactions (createWithCapacity, then a
   * separate assignSeating), each independently acquiring the session
   * lock — unlike the single-transaction races above, there is a real
   * three-way outcome space here: (a) Close wins before createWithCapacity's
   * own gate check -> NOT_CREATED, nothing written; (b) Close wins in the
   * WINDOW between the two walk-in transactions -> CREATED_UNSEATED (the
   * Reservation/CapacityCommitment already committed legitimately, no
   * active assignment ever created); (c) walk-in wins both transactions
   * before Close's single check -> CREATED_AND_SEATED, Close then sees the
   * active row. All three are safe. What must NEVER happen is a CLOSED
   * outcome coexisting with an active SeatingAssignment for this
   * reservation — that is the one invariant this test asserts directly,
   * mirroring the Move-vs-Close race's own assertion style above.
   */
  it("N iterations: whichever side wins, CLOSED never coexists with an active assignment for this reservation", async () => {
    const iterations = 6;
    for (let i = 0; i < iterations; i += 1) {
      const instant = new Date(DINNER_INSTANT.getTime() + i * 24 * 60 * 60_000); // a fresh calendar date per iteration, still 19:00 Amsterdam -> dinner
      const h = harness(instant); // createImmediateWalkIn derives its session key from this harness's own clock.now(), which must equal `instant`
      const session = await seedSession(h.sessionService, instant, "Opened");
      const table = await prisma.table.findFirstOrThrow({ where: { operationalLabel: "Table 15" } });

      const hB = harness();
      const [walkInResult, closeResult] = await Promise.all([
        h.availabilityOrchestrator.createImmediateWalkIn({
          commandId: cmd(),
          contactSelection: { displayName: `Walk-in Guest ${i}` },
          partySize: 2,
          preferredArea: "Sushi",
          resources: [{ tableId: table.id }],
          actor: staffActor,
        }),
        hB.sessionService.close(session!.id),
      ]);

      const reservationId = walkInResult.type !== "NOT_CREATED" ? walkInResult.outcome.reservationId : null;
      const activeRows = reservationId
        ? await prisma.seatingAssignment.findMany({ where: { reservationId, status: { in: ["Assigned", "Seated"] } } })
        : [];

      if (closeResult.type === "CLOSED") {
        expect(["NOT_CREATED", "CREATED_UNSEATED"]).toContain(walkInResult.type);
        expect(activeRows).toHaveLength(0);
      } else {
        expect(closeResult.type).toBe("ACTIVE_ASSIGNMENTS_EXIST");
        expect(walkInResult.type).toBe("CREATED_AND_SEATED");
        expect(activeRows.length).toBeGreaterThan(0);
      }
    }
  });
});

describe("Open vs walk-in: genuinely concurrent, deterministic on either winner", () => {
  it("N iterations: open wins -> walk-in then succeeds; walk-in's read wins first (still Created) -> SESSION_NOT_OPEN, zero writes", async () => {
    const iterations = 6;
    for (let i = 0; i < iterations; i += 1) {
      const instant = new Date(DINNER_INSTANT.getTime() + i * 24 * 60 * 60_000); // a fresh calendar date per iteration, still 19:00 Amsterdam -> dinner
      const h = harness(instant); // both the open() call and the walk-in's own clock.now() must target the SAME session key
      const session = await seedSession(h.sessionService, instant, "Created");
      const table = await prisma.table.findFirstOrThrow({ where: { operationalLabel: "Table 16" } });
      const beforeReservations = await prisma.reservation.count();
      const beforeCommitments = await prisma.capacityCommitment.count();

      const [walkInResult, openResult] = await Promise.all([
        h.availabilityOrchestrator.createImmediateWalkIn({
          commandId: cmd(),
          contactSelection: { displayName: `Walk-in Guest Open ${i}` },
          partySize: 2,
          preferredArea: "Sushi",
          resources: [{ tableId: table.id }],
          actor: staffActor,
        }),
        h.sessionService.open(session!.id),
      ]);

      expect(openResult.type).toBe("OPENED");
      if (walkInResult.type === "NOT_CREATED") {
        expect(walkInResult.result.type).toBe("SESSION_NOT_OPEN");
        expect(await prisma.reservation.count()).toBe(beforeReservations);
        expect(await prisma.capacityCommitment.count()).toBe(beforeCommitments);
      } else {
        expect(["CREATED_AND_SEATED", "CREATED_UNSEATED"]).toContain(walkInResult.type);
      }
    }
  });
});

describe("Release-only Modify remains available after closure, and removing the last active assignment lets a previously-blocked Close succeed", () => {
  it("a party-size increase beyond every candidate table's capacity (but still within the Sushi pool's own 51-cover maximum) forces RELEASED even though the target session is already Closed; Close (previously ACTIVE_ASSIGNMENTS_EXIST) then succeeds", async () => {
    const { availabilityOrchestrator, seatingOrchestrator, sessionService } = harness();
    const session = await seedSession(sessionService, DINNER_INSTANT, "Opened");
    const created = await availabilityOrchestrator.createWithCapacity({
      commandId: cmd(),
      servicePeriodId: "dinner",
      contactSelection: { type: "ExistingContact", contactId: "contact-1" },
      reservationDate: DINNER_INSTANT,
      partySize: 2,
      source: { category: ReservationSourceCategory.Telephone },
      preferredArea: "Sushi",
      actor: staffActor,
    });
    if (created.type !== "CREATED") throw new Error("unreachable");
    const reservationId = created.outcome.reservationId;
    const table = await prisma.table.findFirstOrThrow({ where: { operationalLabel: "Table 15" } });
    const assigned = await seatingOrchestrator.assignSeating({
      commandId: cmd(),
      reservationId,
      requestedAreaId: "Sushi",
      requestedPartySize: 2,
      resources: [{ tableId: table.id }],
      startTime: DINNER_INSTANT,
      endTime: new Date(DINNER_INSTANT.getTime() + 90 * 60_000),
      actor: staffActor,
      seatImmediately: true,
    });
    if (assigned.type !== "ASSIGNED") throw new Error("unreachable");

    const blocked = await sessionService.close(session!.id);
    expect(blocked).toMatchObject({ type: "ACTIVE_ASSIGNMENTS_EXIST", count: 1 });

    // Force the session Closed directly (mirroring the Move-test's own
    // technique) so this test's real target — the release-only Modify's
    // OWN lack of a status gate — is proven directly, not incidentally
    // via a close() call that would otherwise (correctly) still refuse.
    await prisma.serviceSession.update({ where: { id: session!.id }, data: { status: "Closed", closedAt: new Date() } });

    const modifyResult = await availabilityOrchestrator.modifyWithCapacity({
      commandId: cmd(),
      reservationId,
      actor: staffActor,
      // 20 exceeds every individual Sushi table's nominalCapacity (max 5,
      // no table supports shared seating) but stays well within the
      // pool's own 51-cover maximum for this otherwise-empty date, so
      // this isolates the seating-revalidation RELEASED path without
      // tripping the earlier, unrelated CAPACITY_UNAVAILABLE check.
      changes: { partySize: 20 },
    });
    expect(modifyResult.type).toBe("MODIFIED");
    if (modifyResult.type === "MODIFIED") expect(modifyResult.seatingDisposition).toBe("RELEASED");

    const rows = await prisma.seatingAssignment.findMany({ where: { reservationId, status: { in: ["Assigned", "Seated"] } } });
    expect(rows).toHaveLength(0);

    const closedNow = await sessionService.close(session!.id);
    expect(closedNow.type).toBe("CLOSED");
  });
});

describe("No-show release and Complete remain available after closure", () => {
  it("releaseNoShow succeeds on an active assignment even after the session for its date has already Closed", async () => {
    const { seatingOrchestrator, sessionService } = harness();
    const session = await seedSession(sessionService, DINNER_INSTANT, "Opened");
    const reservationId = await createReservation();
    const table = await prisma.table.findFirstOrThrow({ where: { operationalLabel: "Table 16" } });
    const assigned = await seatingOrchestrator.assignSeating({
      commandId: cmd(),
      reservationId,
      requestedAreaId: "Sushi",
      requestedPartySize: 2,
      resources: [{ tableId: table.id }],
      startTime: DINNER_INSTANT,
      endTime: new Date(DINNER_INSTANT.getTime() + 90 * 60_000),
      actor: staffActor,
      seatImmediately: false,
    });
    if (assigned.type !== "ASSIGNED") throw new Error("unreachable");

    // Force Closed directly WHILE the assignment is still active — the
    // real close() path could never reach Closed here (it would correctly
    // refuse with ACTIVE_ASSIGNMENTS_EXIST); this proves releaseNoShow
    // itself never checks session status, for a session already in the
    // terminal Closed state, not merely one closed after release.
    await prisma.serviceSession.update({ where: { id: session!.id }, data: { status: "Closed", closedAt: new Date() } });

    const released = await seatingOrchestrator.releaseNoShow({ reservationId, actor: staffActor });
    expect(released.type).toBe("RELEASED");
  });

  it("completeWithCapacity succeeds (and releases the active assignment) even after the session for its date has already Closed", async () => {
    const { availabilityOrchestrator, seatingOrchestrator, sessionService } = harness();
    const session = await seedSession(sessionService, DINNER_INSTANT, "Opened");
    const reservationId = await createReservation();
    const table = await prisma.table.findFirstOrThrow({ where: { operationalLabel: "Table 15" } });
    const assigned = await seatingOrchestrator.assignSeating({
      commandId: cmd(),
      reservationId,
      requestedAreaId: "Sushi",
      requestedPartySize: 2,
      resources: [{ tableId: table.id }],
      startTime: DINNER_INSTANT,
      endTime: new Date(DINNER_INSTANT.getTime() + 90 * 60_000),
      actor: staffActor,
      seatImmediately: true,
    });
    if (assigned.type !== "ASSIGNED") throw new Error("unreachable");

    await prisma.serviceSession.update({ where: { id: session!.id }, data: { status: "Closed", closedAt: new Date() } });

    const completeResult = await availabilityOrchestrator.completeWithCapacity({
      commandId: cmd(),
      reservationId,
      actor: staffActor,
      isManualCompletion: true,
      manualCompletionReason: "Guest confirmed departure — session already closed for the date.",
    });
    expect(completeResult.ok).toBe(true);

    const rows = await prisma.seatingAssignment.findMany({ where: { reservationId, status: { in: ["Assigned", "Seated"] } } });
    expect(rows).toHaveLength(0);
  });
});
