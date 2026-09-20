import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { createTestPrismaClient, truncateSeatingDomainTables, truncateReservationDomainTables } from "./support/testDatabaseSafety.js";
import { buildFloorHarness } from "./support/floorTestHarness.js";
import { seedFloor } from "../../ops/floor/seedFloor.js";
import { createPublishedFloorplanFixture, publishNewDefaultVersion } from "./support/floorplanFixture.js";
import { PrismaServiceSessionRepository } from "../../infrastructure/persistence/PrismaServiceSessionRepository.js";
import { PrismaFloorplanRepository } from "../../infrastructure/persistence/PrismaFloorplanRepository.js";
import { PrismaTransactionManager } from "../../infrastructure/persistence/PrismaTransactionManager.js";
import { ServiceSessionService } from "../../application/availability/ServiceSessionService.js";
import { RandomIdGenerator } from "../../infrastructure/RandomIdGenerator.js";
import { Actor, ActorKind, ActorRole } from "../../domain/value-objects/Actor.js";
import { ReservationSourceCategory } from "../../domain/value-objects/ReservationSource.js";
import { deriveServiceCode } from "../../domain/availability/Service.js";
import { toLocalServiceDate } from "../../domain/availability/ServiceTime.js";
import { SeatingAvailabilityService } from "../../application/floor/SeatingAvailabilityService.js";
import { PrismaFloorRepository } from "../../infrastructure/persistence/PrismaFloorRepository.js";
import { PrismaReservationRepository } from "../../infrastructure/persistence/PrismaReservationRepository.js";
import { ReservationId } from "../../domain/value-objects/ReservationId.js";

/**
 * R1.5-P2D — ServiceSession Floorplan-Membership Enforcement. Every test
 * uses its OWN dedicated, uniquely-named Floorplan fixture (never
 * "main-floor", tests/ops/main-floorplan-bootstrap.test.ts's own
 * exclusive fixture) via the floorplanId override each write-path
 * component now accepts — see SeatingOrchestrator/AvailabilityOrchestrator/
 * SeatingAvailabilityService's own doc comments on that constructor param.
 */
const prisma = createTestPrismaClient();
const prismaB = createTestPrismaClient();
const staffActor: Actor = { id: "staff-fp-membership", kind: ActorKind.AuthorizedUser, role: ActorRole.Reception };

let fpCounter = 0;
function freshFloorplanId(): string {
  fpCounter += 1;
  return `fp-membership-${Date.now().toString(36)}-${fpCounter}`;
}
let dayCounter = 0;
/** A fresh 2029-03-DD instant per call, 19:00 Amsterdam (CET, no DST in March) -> dinner. Dedicated year/month, disjoint from every other test file's own date range. */
function freshInstant(): Date {
  dayCounter += 1;
  const day = String(((dayCounter - 1) % 27) + 1).padStart(2, "0");
  return new Date(`2029-03-${day}T18:00:00Z`);
}

function harness(now: Date, floorplanId: string, client: typeof prisma = prisma) {
  return buildFloorHarness(client, now, undefined, new PrismaServiceSessionRepository(client), new PrismaFloorplanRepository(client), floorplanId);
}
/** B4-A goes through api/app.ts with no floorplanId override (always the real MAIN_FLOORPLAN_ID in production) — exercised directly here, at the service layer, with an isolated fixture, to avoid touching the literal "main-floor" row. HTTP wiring itself is covered separately by tests/api/server-wiring.test.ts. */
function availabilityService(floorplanId: string, client: typeof prisma = prisma) {
  return new SeatingAvailabilityService(
    new PrismaReservationRepository(client),
    new PrismaFloorRepository(client),
    new PrismaServiceSessionRepository(client),
    new PrismaFloorplanRepository(client),
    floorplanId
  );
}
function sessionService(floorplanId: string, client: typeof prisma = prisma) {
  return new ServiceSessionService(
    new PrismaServiceSessionRepository(client),
    new PrismaTransactionManager(client),
    new RandomIdGenerator(),
    { now: () => new Date() },
    new PrismaFloorplanRepository(client),
    floorplanId
  );
}

let resCounter = 0;
async function createReservation(instant: Date, overrides: { partySize?: number; preferredArea?: string } = {}): Promise<string> {
  resCounter += 1;
  const id = `fp-membership-res-${resCounter}`;
  await prisma.reservation.create({
    data: {
      id,
      servicePeriodId: "dinner",
      contactId: "contact-fp-membership",
      contactName: "Membership Test Guest",
      status: "Confirmed",
      reservationDate: instant,
      partySize: overrides.partySize ?? 2,
      sourceCategory: "Telephone",
      preferredArea: overrides.preferredArea ?? "Sushi",
      createdBy: "staff-1",
      createdAt: instant,
      updatedAt: instant,
      version: 1,
    },
  });
  return id;
}

let cmdCounter = 0;
function cmd(): string {
  cmdCounter += 1;
  return `fp-membership-cmd-${cmdCounter}`;
}

beforeAll(async () => {
  await truncateSeatingDomainTables(prisma);
  await truncateReservationDomainTables(prisma);
  await seedFloor(process.env["TEST_DATABASE_URL"]!);
  await prisma.contact.create({
    data: { id: "contact-fp-membership", displayName: "Membership Test Guest", phoneRaw: "0699999997", phoneNormalized: "+31699999997", createdBy: "staff-1", lastRelevantActivityAt: new Date("2029-03-01T00:00:00Z") },
  });
});
afterAll(async () => {
  await prisma.$disconnect();
  await prismaB.$disconnect();
});
beforeEach(async () => {
  await truncateSeatingDomainTables(prisma);
  await prisma.serviceSession.deleteMany({ where: { serviceDate: { gte: new Date("2029-03-01T00:00:00.000Z"), lt: new Date("2029-04-01T00:00:00.000Z") } } });
});

describe("A. Domain and ordinary behavior", () => {
  it("a Table that IS a member is accepted (pre-assign)", async () => {
    const floorplanId = freshFloorplanId();
    await createPublishedFloorplanFixture(prisma, { floorplanId, tableIds: ["sushi-table-1"] });
    const instant = freshInstant();
    const h = harness(instant, floorplanId);
    const reservationId = await createReservation(instant);
    const result = await h.seatingOrchestrator.assignSeating({
      commandId: cmd(), reservationId, requestedAreaId: "Sushi", requestedPartySize: 2,
      resources: [{ tableId: "sushi-table-1" }], startTime: instant, endTime: new Date(instant.getTime() + 90 * 60_000),
      actor: staffActor, seatImmediately: false,
    });
    expect(result.type).toBe("ASSIGNED");
  });

  it("a Table that is NOT a member is rejected, zero writes", async () => {
    const floorplanId = freshFloorplanId();
    await createPublishedFloorplanFixture(prisma, { floorplanId, tableIds: ["sushi-table-1"] });
    const instant = freshInstant();
    const h = harness(instant, floorplanId);
    const reservationId = await createReservation(instant);
    const result = await h.seatingOrchestrator.assignSeating({
      commandId: cmd(), reservationId, requestedAreaId: "Sushi", requestedPartySize: 2,
      resources: [{ tableId: "sushi-table-2" }], startTime: instant, endTime: new Date(instant.getTime() + 90 * 60_000),
      actor: staffActor, seatImmediately: false,
    });
    expect(result).toEqual({ type: "NOT_SEATABLE", seatability: { type: "RESOURCE_OUTSIDE_FLOORPLAN_MEMBERSHIP", resourceLabel: "Table 2" } });
    expect(await prisma.seatingAssignment.count({ where: { reservationId } })).toBe(0);
  });

  it("a Teppanyaki Seat inherits its parent Table's membership — accepted when the parent is a member", async () => {
    const floorplanId = freshFloorplanId();
    await createPublishedFloorplanFixture(prisma, { floorplanId, tableIds: ["teppanyaki-c"] });
    const instant = freshInstant();
    const h = harness(instant, floorplanId);
    const reservationId = await createReservation(instant, { preferredArea: "Teppanyaki" });
    const result = await h.seatingOrchestrator.assignSeating({
      commandId: cmd(), reservationId, requestedAreaId: "Teppanyaki", requestedPartySize: 1,
      resources: [{ seatId: "teppanyaki-c-seat-01" }], startTime: instant, endTime: new Date(instant.getTime() + 150 * 60_000),
      actor: staffActor, seatImmediately: false,
    });
    expect(result.type).toBe("ASSIGNED");
  });

  it("a Teppanyaki Seat is rejected when its parent Table is NOT a member — no Seat-level membership concept exists", async () => {
    const floorplanId = freshFloorplanId();
    await createPublishedFloorplanFixture(prisma, { floorplanId, tableIds: ["teppanyaki-d"] }); // teppanyaki-c is NOT a member
    const instant = freshInstant();
    const h = harness(instant, floorplanId);
    const reservationId = await createReservation(instant, { preferredArea: "Teppanyaki" });
    const result = await h.seatingOrchestrator.assignSeating({
      commandId: cmd(), reservationId, requestedAreaId: "Teppanyaki", requestedPartySize: 1,
      resources: [{ seatId: "teppanyaki-c-seat-01" }], startTime: instant, endTime: new Date(instant.getTime() + 150 * 60_000),
      actor: staffActor, seatImmediately: false,
    });
    expect(result.type).toBe("NOT_SEATABLE");
    if (result.type === "NOT_SEATABLE") expect(result.seatability.type).toBe("RESOURCE_OUTSIDE_FLOORPLAN_MEMBERSHIP");
  });

  it("mixed member/non-member selection fails atomically — zero writes, even though the first candidate is a member", async () => {
    const floorplanId = freshFloorplanId();
    await createPublishedFloorplanFixture(prisma, { floorplanId, tableIds: ["sushi-table-1"] }); // sushi-table-3 is NOT a member
    const instant = freshInstant();
    const h = harness(instant, floorplanId);
    const reservationId = await createReservation(instant, { partySize: 8 });
    const result = await h.seatingOrchestrator.assignSeating({
      commandId: cmd(), reservationId, requestedAreaId: "Sushi", requestedPartySize: 8,
      resources: [{ tableId: "sushi-table-1" }, { tableId: "sushi-table-3" }], startTime: instant, endTime: new Date(instant.getTime() + 90 * 60_000),
      actor: staffActor, seatImmediately: false,
    });
    expect(result.type).toBe("NOT_SEATABLE");
    if (result.type === "NOT_SEATABLE") expect(result.seatability.type).toBe("RESOURCE_OUTSIDE_FLOORPLAN_MEMBERSHIP");
    expect(await prisma.seatingAssignment.count({ where: { reservationId } })).toBe(0);
  });

  it("no eligible Published default at all -> NO_ELIGIBLE_FLOORPLAN_VERSION via NOT_SEATABLE, zero writes", async () => {
    const floorplanId = freshFloorplanId(); // never created — no Floorplan row exists for this id at all
    const instant = freshInstant();
    const h = harness(instant, floorplanId);
    const reservationId = await createReservation(instant);
    const result = await h.seatingOrchestrator.assignSeating({
      commandId: cmd(), reservationId, requestedAreaId: "Sushi", requestedPartySize: 2,
      resources: [{ tableId: "sushi-table-1" }], startTime: instant, endTime: new Date(instant.getTime() + 90 * 60_000),
      actor: staffActor, seatImmediately: false,
    });
    expect(result).toEqual({ type: "NOT_SEATABLE", seatability: { type: "NO_ELIGIBLE_FLOORPLAN_VERSION" } });
    expect(await prisma.seatingAssignment.count({ where: { reservationId } })).toBe(0);
  });

  it("an Opened session uses its OWN snapshot even after the mutable default later changes", async () => {
    const floorplanId = freshFloorplanId();
    const fixtureA = await createPublishedFloorplanFixture(prisma, { floorplanId, tableIds: ["sushi-table-1"] });
    const instant = freshInstant();
    const svc = sessionService(floorplanId);
    const created = await svc.create({ serviceCode: deriveServiceCode(instant), serviceDate: toLocalServiceDate(instant), actor: staffActor });
    if (created.type !== "CREATED") throw new Error("unreachable");
    const opened = await svc.open(created.session.id);
    if (opened.type !== "OPENED") throw new Error("unreachable");
    expect(opened.session.floorplanVersionId).toBe(fixtureA.versionId);

    // Publish a NEW default that no longer includes sushi-table-1.
    await publishNewDefaultVersion(prisma, { floorplanId, revision: 2, tableIds: ["sushi-table-9"] });

    const h = harness(instant, floorplanId);
    const reservationId = await createReservation(instant);
    const result = await h.seatingOrchestrator.assignSeating({
      commandId: cmd(), reservationId, requestedAreaId: "Sushi", requestedPartySize: 2,
      resources: [{ tableId: "sushi-table-1" }], startTime: instant, endTime: new Date(instant.getTime() + 90 * 60_000),
      actor: staffActor, seatImmediately: true, // requires Opened — proves the snapshot, not the mutable default, governs
    });
    expect(result.type).toBe("ASSIGNED"); // still valid under the OLD, immutable snapshot
  });

  it("Move checks the DESTINATION only — the abandoned current resource's membership is never re-validated", async () => {
    const floorplanId = freshFloorplanId();
    // Only sushi-table-5 is a member; the party is currently seated at sushi-table-1 (NOT a member) via a raw pre-existing assignment.
    await createPublishedFloorplanFixture(prisma, { floorplanId, tableIds: ["sushi-table-5"] });
    const instant = freshInstant();
    const reservationId = await createReservation(instant);
    await prisma.seatingAssignment.create({
      data: {
        id: `${reservationId}-legacy`, reservationId, status: "Assigned", startTime: instant, endTime: new Date(instant.getTime() + 90 * 60_000),
        assignedBy: "staff-1", commandId: cmd(),
        resources: { create: [{ id: `${reservationId}-legacy-res`, tableId: "sushi-table-1", status: "Assigned", startTime: instant, endTime: new Date(instant.getTime() + 90 * 60_000) }] },
      },
    });
    const h = harness(instant, floorplanId);
    const result = await h.seatingOrchestrator.moveSeating({
      commandId: cmd(), reservationId, requestedAreaId: "Sushi", requestedPartySize: 2,
      resources: [{ tableId: "sushi-table-5" }], actor: staffActor,
    });
    expect(result.type).toBe("MOVED"); // never rejected for the OLD (non-member) resource — only the destination is checked
  });

  it("Modify membership failure releases seating (RELEASED) while the reservation/capacity change is still accepted", async () => {
    const floorplanId = freshFloorplanId();
    await createPublishedFloorplanFixture(prisma, { floorplanId, tableIds: ["sushi-table-6"] });
    const dayA = freshInstant();
    const dayB = freshInstant(); // a DIFFERENT (serviceCode, serviceDate) — its own, never-opened session
    const svc = sessionService(floorplanId);
    const createdSession = await svc.create({ serviceCode: deriveServiceCode(dayA), serviceDate: toLocalServiceDate(dayA), actor: staffActor });
    if (createdSession.type !== "CREATED") throw new Error("unreachable");
    const openedSession = await svc.open(createdSession.session.id);
    if (openedSession.type !== "OPENED") throw new Error("unreachable");

    const h = harness(dayA, floorplanId);
    const created = await h.availabilityOrchestrator.createWithCapacity({
      commandId: cmd(), servicePeriodId: "dinner", contactSelection: { type: "ExistingContact", contactId: "contact-fp-membership" },
      reservationDate: dayA, partySize: 2, source: { category: ReservationSourceCategory.Telephone }, preferredArea: "Sushi", actor: staffActor,
    });
    if (created.type !== "CREATED") throw new Error("unreachable");
    const reservationId = created.outcome.reservationId;
    const assigned = await h.seatingOrchestrator.assignSeating({
      commandId: cmd(), reservationId, requestedAreaId: "Sushi", requestedPartySize: 2,
      resources: [{ tableId: "sushi-table-6" }], startTime: dayA, endTime: new Date(dayA.getTime() + 90 * 60_000),
      actor: staffActor, seatImmediately: true,
    });
    if (assigned.type !== "ASSIGNED") throw new Error("unreachable");

    // Move the reservation onto Day B — a DIFFERENT, never-opened session,
    // whose PROVISIONAL default (read live at Modify time) no longer
    // includes sushi-table-6. Day A's own snapshot (still sushi-table-6)
    // is now irrelevant — the reservation is leaving that session entirely.
    await publishNewDefaultVersion(prisma, { floorplanId, revision: 2, tableIds: ["sushi-table-9"] });
    const modifyResult = await h.availabilityOrchestrator.modifyWithCapacity({ commandId: cmd(), reservationId, actor: staffActor, changes: { reservationDate: dayB } });
    expect(modifyResult.type).toBe("MODIFIED"); // the reservation/capacity change itself is still accepted
    if (modifyResult.type === "MODIFIED") expect(modifyResult.seatingDisposition).toBe("RELEASED");
    expect(await prisma.seatingAssignment.count({ where: { reservationId, status: { in: ["Assigned", "Seated"] } } })).toBe(0);
  });

  it("Mark Seated succeeds with no duplicate membership validation after a valid Open", async () => {
    const floorplanId = freshFloorplanId();
    await createPublishedFloorplanFixture(prisma, { floorplanId, tableIds: ["sushi-table-7"] });
    const instant = freshInstant();
    const svc = sessionService(floorplanId);
    const created = await svc.create({ serviceCode: deriveServiceCode(instant), serviceDate: toLocalServiceDate(instant), actor: staffActor });
    if (created.type !== "CREATED") throw new Error("unreachable");
    const opened = await svc.open(created.session.id);
    expect(opened.type).toBe("OPENED");

    const h = harness(instant, floorplanId);
    const reservationId = await createReservation(instant);
    const assigned = await h.seatingOrchestrator.assignSeating({
      commandId: cmd(), reservationId, requestedAreaId: "Sushi", requestedPartySize: 2,
      resources: [{ tableId: "sushi-table-7" }], startTime: instant, endTime: new Date(instant.getTime() + 90 * 60_000),
      actor: staffActor, seatImmediately: false,
    });
    if (assigned.type !== "ASSIGNED") throw new Error("unreachable");
    const markResult = await h.seatingOrchestrator.markSeated({ reservationId, actor: staffActor });
    expect(markResult.type).toBe("SEATED");
  });

  it("release-only paths (releaseNoShow) remain available regardless of membership state", async () => {
    const floorplanId = freshFloorplanId();
    await createPublishedFloorplanFixture(prisma, { floorplanId, tableIds: ["sushi-table-8"] });
    const instant = freshInstant();
    const h = harness(instant, floorplanId);
    const reservationId = await createReservation(instant);
    const assigned = await h.seatingOrchestrator.assignSeating({
      commandId: cmd(), reservationId, requestedAreaId: "Sushi", requestedPartySize: 2,
      resources: [{ tableId: "sushi-table-8" }], startTime: instant, endTime: new Date(instant.getTime() + 90 * 60_000),
      actor: staffActor, seatImmediately: false,
    });
    if (assigned.type !== "ASSIGNED") throw new Error("unreachable");
    // Even after the table stops being a member, releaseNoShow still works — never gated on membership.
    await publishNewDefaultVersion(prisma, { floorplanId, revision: 2, tableIds: ["sushi-table-9"] });
    const released = await h.seatingOrchestrator.releaseNoShow({ reservationId, actor: staffActor });
    expect(released.type).toBe("RELEASED");
  });
});

describe("B. Open-time invariant", () => {
  it("pre-assign wins first, member resource -> Open succeeds", async () => {
    const floorplanId = freshFloorplanId();
    await createPublishedFloorplanFixture(prisma, { floorplanId, tableIds: ["sushi-table-1"] });
    const instant = freshInstant();
    const h = harness(instant, floorplanId);
    const reservationId = await createReservation(instant);
    const assigned = await h.seatingOrchestrator.assignSeating({
      commandId: cmd(), reservationId, requestedAreaId: "Sushi", requestedPartySize: 2,
      resources: [{ tableId: "sushi-table-1" }], startTime: instant, endTime: new Date(instant.getTime() + 90 * 60_000),
      actor: staffActor, seatImmediately: false,
    });
    expect(assigned.type).toBe("ASSIGNED");

    const svc = sessionService(floorplanId);
    const created = await svc.create({ serviceCode: deriveServiceCode(instant), serviceDate: toLocalServiceDate(instant), actor: staffActor });
    if (created.type !== "CREATED") throw new Error("unreachable");
    const opened = await svc.open(created.session.id);
    expect(opened.type).toBe("OPENED");
  });

  it("pre-assign wins first, non-member resource -> Open returns 409 and leaves the session Created with no snapshot/timestamp/version mutation", async () => {
    const floorplanId = freshFloorplanId();
    await createPublishedFloorplanFixture(prisma, { floorplanId, tableIds: ["sushi-table-1"] });
    const instant = freshInstant();

    // Pre-assign sushi-table-2 directly (bypassing the provisional-default check — simulates a legacy/pre-existing assignment already outside membership, proving Open's OWN backstop, independent of the write-path check).
    const reservationId = await createReservation(instant);
    await prisma.seatingAssignment.create({
      data: {
        id: `${reservationId}-outside`, reservationId, status: "Assigned", startTime: instant, endTime: new Date(instant.getTime() + 90 * 60_000),
        assignedBy: "staff-1", commandId: cmd(),
        resources: { create: [{ id: `${reservationId}-outside-res`, tableId: "sushi-table-2", status: "Assigned", startTime: instant, endTime: new Date(instant.getTime() + 90 * 60_000) }] },
      },
    });

    const svc = sessionService(floorplanId);
    const created = await svc.create({ serviceCode: deriveServiceCode(instant), serviceDate: toLocalServiceDate(instant), actor: staffActor });
    if (created.type !== "CREATED") throw new Error("unreachable");
    const result = await svc.open(created.session.id);
    expect(result).toEqual({ type: "ACTIVE_ASSIGNMENTS_OUTSIDE_FLOORPLAN", activeAssignmentCount: 1 });

    const row = await prisma.serviceSession.findUniqueOrThrow({ where: { id: created.session.id } });
    expect(row.status).toBe("Created");
    expect(row.floorplanVersionId).toBeNull();
    expect(row.openedAt).toBeNull();
    expect(row.version).toBe(1);
  });

  it("Open wins first -> a subsequent pre-assign evaluates against the stored snapshot, not a fresh provisional read", async () => {
    const floorplanId = freshFloorplanId();
    const fixture = await createPublishedFloorplanFixture(prisma, { floorplanId, tableIds: ["sushi-table-1"] });
    const instant = freshInstant();
    const svc = sessionService(floorplanId);
    const created = await svc.create({ serviceCode: deriveServiceCode(instant), serviceDate: toLocalServiceDate(instant), actor: staffActor });
    if (created.type !== "CREATED") throw new Error("unreachable");
    const opened = await svc.open(created.session.id);
    if (opened.type !== "OPENED") throw new Error("unreachable");
    expect(opened.session.floorplanVersionId).toBe(fixture.versionId);

    // Change the default AFTER Open — a pre-assign now must still use the frozen snapshot, not this new default.
    await publishNewDefaultVersion(prisma, { floorplanId, revision: 2, tableIds: ["sushi-table-9"] });

    const h = harness(instant, floorplanId);
    const reservationId = await createReservation(instant);
    const result = await h.seatingOrchestrator.assignSeating({
      commandId: cmd(), reservationId, requestedAreaId: "Sushi", requestedPartySize: 2,
      resources: [{ tableId: "sushi-table-1" }], startTime: instant, endTime: new Date(instant.getTime() + 90 * 60_000),
      actor: staffActor, seatImmediately: false,
    });
    expect(result.type).toBe("ASSIGNED"); // sushi-table-1, still valid under the OLD snapshot
  });

  it("a compatible default change between provisional pre-assignment and Open still lets Open succeed", async () => {
    const floorplanId = freshFloorplanId();
    await createPublishedFloorplanFixture(prisma, { floorplanId, tableIds: ["sushi-table-1"] });
    const instant = freshInstant();
    const h = harness(instant, floorplanId);
    const reservationId = await createReservation(instant);
    const assigned = await h.seatingOrchestrator.assignSeating({
      commandId: cmd(), reservationId, requestedAreaId: "Sushi", requestedPartySize: 2,
      resources: [{ tableId: "sushi-table-1" }], startTime: instant, endTime: new Date(instant.getTime() + 90 * 60_000),
      actor: staffActor, seatImmediately: false,
    });
    if (assigned.type !== "ASSIGNED") throw new Error("unreachable");

    // New default STILL includes sushi-table-1 (compatible change).
    await publishNewDefaultVersion(prisma, { floorplanId, revision: 2, tableIds: ["sushi-table-1", "sushi-table-9"] });

    const svc = sessionService(floorplanId);
    const created = await svc.create({ serviceCode: deriveServiceCode(instant), serviceDate: toLocalServiceDate(instant), actor: staffActor });
    if (created.type !== "CREATED") throw new Error("unreachable");
    const opened = await svc.open(created.session.id);
    expect(opened.type).toBe("OPENED");
  });

  it("an incompatible default change between provisional pre-assignment and Open causes Open to reject without altering either the assignment or the session", async () => {
    const floorplanId = freshFloorplanId();
    await createPublishedFloorplanFixture(prisma, { floorplanId, tableIds: ["sushi-table-1"] });
    const instant = freshInstant();
    const h = harness(instant, floorplanId);
    const reservationId = await createReservation(instant);
    const assigned = await h.seatingOrchestrator.assignSeating({
      commandId: cmd(), reservationId, requestedAreaId: "Sushi", requestedPartySize: 2,
      resources: [{ tableId: "sushi-table-1" }], startTime: instant, endTime: new Date(instant.getTime() + 90 * 60_000),
      actor: staffActor, seatImmediately: false,
    });
    if (assigned.type !== "ASSIGNED") throw new Error("unreachable");

    // New default EXCLUDES sushi-table-1 (incompatible change).
    await publishNewDefaultVersion(prisma, { floorplanId, revision: 2, tableIds: ["sushi-table-9"] });

    const svc = sessionService(floorplanId);
    const created = await svc.create({ serviceCode: deriveServiceCode(instant), serviceDate: toLocalServiceDate(instant), actor: staffActor });
    if (created.type !== "CREATED") throw new Error("unreachable");
    const result = await svc.open(created.session.id);
    expect(result).toEqual({ type: "ACTIVE_ASSIGNMENTS_OUTSIDE_FLOORPLAN", activeAssignmentCount: 1 });

    const assignmentRow = await prisma.seatingAssignment.findUniqueOrThrow({ where: { id: assigned.assignment.id } });
    expect(assignmentRow.status).toBe("Assigned"); // untouched — never released or rewritten
    const sessionRow = await prisma.serviceSession.findUniqueOrThrow({ where: { id: created.session.id } });
    expect(sessionRow.status).toBe("Created");
  });

  it("multiple active assignments, only one outside membership -> activeAssignmentCount === 1", async () => {
    const floorplanId = freshFloorplanId();
    await createPublishedFloorplanFixture(prisma, { floorplanId, tableIds: ["sushi-table-1", "sushi-table-2"] });
    const instant = freshInstant();
    const h = harness(instant, floorplanId);
    const res1 = await createReservation(instant);
    const res2 = await createReservation(instant);
    const a1 = await h.seatingOrchestrator.assignSeating({
      commandId: cmd(), reservationId: res1, requestedAreaId: "Sushi", requestedPartySize: 2,
      resources: [{ tableId: "sushi-table-1" }], startTime: instant, endTime: new Date(instant.getTime() + 90 * 60_000), actor: staffActor, seatImmediately: false,
    });
    if (a1.type !== "ASSIGNED") throw new Error("unreachable");
    const a2 = await h.seatingOrchestrator.assignSeating({
      commandId: cmd(), reservationId: res2, requestedAreaId: "Sushi", requestedPartySize: 2,
      resources: [{ tableId: "sushi-table-2" }], startTime: instant, endTime: new Date(instant.getTime() + 90 * 60_000), actor: staffActor, seatImmediately: false,
    });
    if (a2.type !== "ASSIGNED") throw new Error("unreachable");

    // Shrink the default to exclude sushi-table-2 only.
    await publishNewDefaultVersion(prisma, { floorplanId, revision: 2, tableIds: ["sushi-table-1"] });

    const svc = sessionService(floorplanId);
    const created = await svc.create({ serviceCode: deriveServiceCode(instant), serviceDate: toLocalServiceDate(instant), actor: staffActor });
    if (created.type !== "CREATED") throw new Error("unreachable");
    const result = await svc.open(created.session.id);
    expect(result).toEqual({ type: "ACTIVE_ASSIGNMENTS_OUTSIDE_FLOORPLAN", activeAssignmentCount: 1 });
  });

  it("multiple violating resources on ONE assignment still counts as exactly one violating assignment", async () => {
    const floorplanId = freshFloorplanId();
    await createPublishedFloorplanFixture(prisma, { floorplanId, tableIds: ["sushi-table-9"] }); // neither table-1 nor table-3 is a member
    const instant = freshInstant();
    const reservationId = await createReservation(instant, { partySize: 8 });
    // A combined two-table claim, both outside membership, on ONE assignment.
    await prisma.seatingAssignment.create({
      data: {
        id: `${reservationId}-combo`, reservationId, status: "Assigned", startTime: instant, endTime: new Date(instant.getTime() + 90 * 60_000),
        assignedBy: "staff-1", commandId: cmd(),
        resources: {
          create: [
            { id: `${reservationId}-combo-1`, tableId: "sushi-table-1", status: "Assigned", startTime: instant, endTime: new Date(instant.getTime() + 90 * 60_000) },
            { id: `${reservationId}-combo-2`, tableId: "sushi-table-3", status: "Assigned", startTime: instant, endTime: new Date(instant.getTime() + 90 * 60_000) },
          ],
        },
      },
    });
    const svc = sessionService(floorplanId);
    const created = await svc.create({ serviceCode: deriveServiceCode(instant), serviceDate: toLocalServiceDate(instant), actor: staffActor });
    if (created.type !== "CREATED") throw new Error("unreachable");
    const result = await svc.open(created.session.id);
    expect(result).toEqual({ type: "ACTIVE_ASSIGNMENTS_OUTSIDE_FLOORPLAN", activeAssignmentCount: 1 });
  });

  it("repeated Open remains idempotent and skips revalidation entirely (a later out-of-membership assignment never causes the second call to fail)", async () => {
    const floorplanId = freshFloorplanId();
    const fixture = await createPublishedFloorplanFixture(prisma, { floorplanId, tableIds: ["sushi-table-1"] });
    const instant = freshInstant();
    const svc = sessionService(floorplanId);
    const created = await svc.create({ serviceCode: deriveServiceCode(instant), serviceDate: toLocalServiceDate(instant), actor: staffActor });
    if (created.type !== "CREATED") throw new Error("unreachable");
    const first = await svc.open(created.session.id);
    if (first.type !== "OPENED") throw new Error("unreachable");
    expect(first.session.floorplanVersionId).toBe(fixture.versionId);

    // Introduce a NEW, non-member active assignment for this exact session AFTER Open already succeeded.
    const reservationId = await createReservation(instant);
    await prisma.seatingAssignment.create({
      data: {
        id: `${reservationId}-after-open`, reservationId, status: "Assigned", startTime: instant, endTime: new Date(instant.getTime() + 90 * 60_000),
        assignedBy: "staff-1", commandId: cmd(),
        resources: { create: [{ id: `${reservationId}-after-open-res`, tableId: "sushi-table-9", status: "Assigned", startTime: instant, endTime: new Date(instant.getTime() + 90 * 60_000) }] },
      },
    });

    const second = await svc.open(created.session.id);
    expect(second).toEqual({ type: "OPENED", session: first.session }); // identical — no re-validation, no re-snapshot, no restamp
  });

  it("a forced failure after validation passes but before the transaction commits rolls back completely — the snapshot write never survives", async () => {
    // updateStatus's own CAS is structurally protected by the ServiceSession
    // lock open() holds for its entire duration (see that method's own
    // "structurally unreachable" comment) — a real VERSION_CONFLICT cannot
    // be manufactured against open() itself without breaking that lock
    // discipline. Instead, mirroring tests/integration/floor-seating-failure-injection.test.ts's
    // own established technique, this test replicates open()'s REAL
    // sequence (real repository calls, real locks, real validation, real
    // updateStatus write) inside its own manually-wrapped transaction, and
    // forces a genuine failure AFTER the write — proving the underlying
    // Prisma/Postgres rollback mechanism open() itself depends on.
    const floorplanId = freshFloorplanId();
    const fixture = await createPublishedFloorplanFixture(prisma, { floorplanId, tableIds: ["sushi-table-1"] });
    const instant = freshInstant();
    const svc = sessionService(floorplanId);
    const created = await svc.create({ serviceCode: deriveServiceCode(instant), serviceDate: toLocalServiceDate(instant), actor: staffActor });
    if (created.type !== "CREATED") throw new Error("unreachable");

    const sessionRepository = new PrismaServiceSessionRepository(prisma);
    const transactionManager = new PrismaTransactionManager(prisma);
    await expect(
      transactionManager.runInTransaction(async (tx) => {
        const result = await sessionRepository.updateStatus({
          id: created.session.id, expectedVersion: created.session.version, newStatus: "Opened", timestamp: new Date(), floorplanVersionId: fixture.versionId, tx,
        });
        expect(result.type).toBe("UPDATED"); // the write itself genuinely ran
        throw new Error("simulated failure after the snapshot write, before commit");
      })
    ).rejects.toThrow("simulated failure");

    const row = await prisma.serviceSession.findUniqueOrThrow({ where: { id: created.session.id } });
    expect(row.status).toBe("Created"); // NOT Opened — the write rolled back completely
    expect(row.floorplanVersionId).toBeNull();
    expect(row.openedAt).toBeNull();
    expect(row.version).toBe(1);
  });
});

describe("C. Deterministic concurrency", () => {
  it("pre-assign versus Open genuinely serializes on the shared Floorplan-then-ServiceSession lock pair — N iterations, always coherent", async () => {
    const iterations = 8;
    for (let i = 0; i < iterations; i += 1) {
      const floorplanId = freshFloorplanId();
      await createPublishedFloorplanFixture(prisma, { floorplanId, tableIds: ["sushi-table-1"] });
      const instant = freshInstant();
      const hA = harness(instant, floorplanId, prisma);
      const svcA = sessionService(floorplanId, prisma);
      const svcB = sessionService(floorplanId, prismaB);
      const reservationId = await createReservation(instant);
      const created = await svcA.create({ serviceCode: deriveServiceCode(instant), serviceDate: toLocalServiceDate(instant), actor: staffActor });
      if (created.type !== "CREATED") throw new Error("unreachable");

      const [assignResult, openResult] = await Promise.all([
        hA.seatingOrchestrator.assignSeating({
          commandId: cmd(), reservationId, requestedAreaId: "Sushi", requestedPartySize: 2,
          resources: [{ tableId: "sushi-table-1" }], startTime: instant, endTime: new Date(instant.getTime() + 90 * 60_000), actor: staffActor, seatImmediately: false,
        }),
        svcB.open(created.session.id),
      ]);

      // sushi-table-1 is a member under every possible ordering (the
      // Floorplan/default never changes mid-race here) — both operations
      // must ALWAYS succeed, proving genuine lock contention (not a
      // deadlock, not a spurious rejection) resolves cleanly regardless
      // of which side wins.
      expect(assignResult.type).toBe("ASSIGNED");
      expect(openResult.type).toBe("OPENED");
    }
  });

  it("a default change racing a provisional pre-assignment never produces a torn membership decision — N iterations", async () => {
    const iterations = 8;
    for (let i = 0; i < iterations; i += 1) {
      const floorplanId = freshFloorplanId();
      await createPublishedFloorplanFixture(prisma, { floorplanId, tableIds: ["sushi-table-1"] }); // sushi-table-2 NOT yet a member
      const instant = freshInstant();
      const hA = harness(instant, floorplanId, prisma);
      const reservationId = await createReservation(instant);

      const [assignResult] = await Promise.all([
        hA.seatingOrchestrator.assignSeating({
          commandId: cmd(), reservationId, requestedAreaId: "Sushi", requestedPartySize: 2,
          resources: [{ tableId: "sushi-table-2" }], startTime: instant, endTime: new Date(instant.getTime() + 90 * 60_000), actor: staffActor, seatImmediately: false,
        }),
        // Both this write and assignSeating's own provisional resolution
        // acquire the SAME Tier-1.4 lock first — whichever wins completes
        // entirely before the other's own read of the default.
        publishNewDefaultVersion(prismaB, { floorplanId, revision: 2, tableIds: ["sushi-table-1", "sushi-table-2"] }),
      ]);

      // Deterministic, never torn: either pre-assign read the OLD default
      // (table-2 not yet a member) -> rejected, or it read the NEW one
      // (table-2 now a member) -> accepted. Never a partial/undefined
      // membership answer, never a throw.
      expect(["ASSIGNED", "NOT_SEATABLE"]).toContain(assignResult.type);
      if (assignResult.type === "NOT_SEATABLE") {
        expect(assignResult.seatability).toEqual({ type: "RESOURCE_OUTSIDE_FLOORPLAN_MEMBERSHIP", resourceLabel: "Table 2" });
      }
    }
  });

  it("assign after Open always uses the stored snapshot, never influenced by a concurrent default change racing the SAME Floorplan lock — N iterations", async () => {
    const iterations = 8;
    for (let i = 0; i < iterations; i += 1) {
      const floorplanId = freshFloorplanId();
      const fixture = await createPublishedFloorplanFixture(prisma, { floorplanId, tableIds: ["sushi-table-1"] });
      const instant = freshInstant();
      const svc = sessionService(floorplanId);
      const created = await svc.create({ serviceCode: deriveServiceCode(instant), serviceDate: toLocalServiceDate(instant), actor: staffActor });
      if (created.type !== "CREATED") throw new Error("unreachable");
      const opened = await svc.open(created.session.id);
      if (opened.type !== "OPENED") throw new Error("unreachable");
      expect(opened.session.floorplanVersionId).toBe(fixture.versionId);

      const hA = harness(instant, floorplanId, prisma);
      const reservationId = await createReservation(instant);

      const [assignResult] = await Promise.all([
        hA.seatingOrchestrator.assignSeating({
          commandId: cmd(), reservationId, requestedAreaId: "Sushi", requestedPartySize: 2,
          resources: [{ tableId: "sushi-table-1" }], startTime: instant, endTime: new Date(instant.getTime() + 90 * 60_000), actor: staffActor, seatImmediately: true,
        }),
        publishNewDefaultVersion(prismaB, { floorplanId, revision: 2, tableIds: ["sushi-table-9"] }), // excludes sushi-table-1 entirely
      ]);

      // Always ASSIGNED, regardless of who wins the Floorplan lock — the
      // ALREADY-Opened session's snapshot is the only thing consulted.
      expect(assignResult.type).toBe("ASSIGNED");
    }
  });

  it("a concurrent release-only operation during Open's validation window never lets an out-of-membership assignment survive an Opened session — N iterations", async () => {
    const iterations = 8;
    for (let i = 0; i < iterations; i += 1) {
      const floorplanId = freshFloorplanId();
      await createPublishedFloorplanFixture(prisma, { floorplanId, tableIds: ["sushi-table-1"] }); // sushi-table-2 is NOT a member
      const instant = freshInstant();
      const reservationId = await createReservation(instant);
      await prisma.seatingAssignment.create({
        data: {
          id: `${reservationId}-race-${i}`, reservationId, status: "Assigned", startTime: instant, endTime: new Date(instant.getTime() + 90 * 60_000),
          assignedBy: "staff-1", commandId: cmd(),
          resources: { create: [{ id: `${reservationId}-race-${i}-res`, tableId: "sushi-table-2", status: "Assigned", startTime: instant, endTime: new Date(instant.getTime() + 90 * 60_000) }] },
        },
      });

      const svcA = sessionService(floorplanId, prisma);
      const hB = harness(instant, floorplanId, prismaB);
      const created = await svcA.create({ serviceCode: deriveServiceCode(instant), serviceDate: toLocalServiceDate(instant), actor: staffActor });
      if (created.type !== "CREATED") throw new Error("unreachable");

      const [openResult, releaseResult] = await Promise.all([svcA.open(created.session.id), hB.seatingOrchestrator.releaseNoShow({ reservationId, actor: staffActor })]);

      expect(releaseResult.type).toBe("RELEASED");
      if (openResult.type === "OPENED") {
        // The release must have been visible to Open's own validation —
        // re-confirm the resource is genuinely Released, never Active.
        const row = await prisma.seatingAssignment.findUniqueOrThrow({ where: { id: `${reservationId}-race-${i}` } });
        expect(row.status).toBe("Released");
      } else {
        expect(openResult).toEqual({ type: "ACTIVE_ASSIGNMENTS_OUTSIDE_FLOORPLAN", activeAssignmentCount: 1 });
      }
    }
  });

  it("Mark-Seated versus Move retains the pre-existing serialization/row-count invariants with floorplan enforcement wired — N iterations", async () => {
    const iterations = 6;
    for (let i = 0; i < iterations; i += 1) {
      const floorplanId = freshFloorplanId();
      await createPublishedFloorplanFixture(prisma, { floorplanId, tableIds: ["sushi-table-1", "sushi-table-2"] });
      const instant = freshInstant();
      const svc = sessionService(floorplanId);
      const createdSession = await svc.create({ serviceCode: deriveServiceCode(instant), serviceDate: toLocalServiceDate(instant), actor: staffActor });
      if (createdSession.type !== "CREATED") throw new Error("unreachable");
      const openedSession = await svc.open(createdSession.session.id);
      if (openedSession.type !== "OPENED") throw new Error("unreachable");

      const hA = harness(instant, floorplanId, prisma);
      const hB = harness(instant, floorplanId, prismaB);
      const reservationId = await createReservation(instant);
      const assigned = await hA.seatingOrchestrator.assignSeating({
        commandId: cmd(), reservationId, requestedAreaId: "Sushi", requestedPartySize: 2,
        resources: [{ tableId: "sushi-table-1" }], startTime: instant, endTime: new Date(instant.getTime() + 90 * 60_000), actor: staffActor, seatImmediately: false,
      });
      if (assigned.type !== "ASSIGNED") throw new Error("unreachable");

      const [markResult, moveResult] = await Promise.all([
        hA.seatingOrchestrator.markSeated({ reservationId, actor: staffActor }),
        hB.seatingOrchestrator.moveSeating({ commandId: cmd(), reservationId, requestedAreaId: "Sushi", requestedPartySize: 2, resources: [{ tableId: "sushi-table-2" }], actor: staffActor }),
      ]);

      expect(markResult.type).toBe("SEATED");
      expect(moveResult.type).toBe("MOVED");
      const activeRows = await prisma.seatingAssignment.findMany({ where: { reservationId, status: { in: ["Assigned", "Seated"] } } });
      expect(activeRows).toHaveLength(1); // exactly one active row survives, whichever order won
    }
  });
});

describe("D. Availability (B4-A) reflects membership — advisory only, never a lock", () => {
  it("absent/Created session -> filters using the current eligible Published default (Table and Seat resources both)", async () => {
    const floorplanId = freshFloorplanId();
    await createPublishedFloorplanFixture(prisma, { floorplanId, tableIds: ["sushi-table-1", "teppanyaki-c"] }); // sushi-table-2 and teppanyaki-d are NOT members
    const instant = freshInstant();
    const reservationId = await createReservation(instant);
    const idResult = ReservationId.create(reservationId);
    if (!idResult.ok) throw new Error("unreachable");
    const svc = availabilityService(floorplanId);
    const result = await svc.getAvailableResourcesForReservation(idResult.value);
    expect(result.type).toBe("FOUND");
    if (result.type !== "FOUND") throw new Error("unreachable");
    const ids = result.availableResources.map((r) => r.resourceId);
    expect(ids).toContain("sushi-table-1");
    expect(ids).not.toContain("sushi-table-2");
  });

  it("a Seat resource is filtered by its parent Table's membership, not any Seat-level concept", async () => {
    const floorplanId = freshFloorplanId();
    await createPublishedFloorplanFixture(prisma, { floorplanId, tableIds: ["teppanyaki-c"] }); // teppanyaki-d is NOT a member
    const instant = freshInstant();
    const reservationId = await createReservation(instant, { preferredArea: "Teppanyaki" });
    const idResult = ReservationId.create(reservationId);
    if (!idResult.ok) throw new Error("unreachable");
    const svc = availabilityService(floorplanId);
    const result = await svc.getAvailableResourcesForReservation(idResult.value);
    if (result.type !== "FOUND") throw new Error("unreachable");
    const ids = result.availableResources.map((r) => r.resourceId);
    expect(ids).toContain("teppanyaki-c-seat-01");
    expect(ids).not.toContain("teppanyaki-d-seat-01");
  });

  it("an Opened session -> filters using the STORED snapshot, ignoring a later default change", async () => {
    const floorplanId = freshFloorplanId();
    const fixture = await createPublishedFloorplanFixture(prisma, { floorplanId, tableIds: ["sushi-table-1"] });
    const instant = freshInstant();
    const svc = sessionService(floorplanId);
    const created = await svc.create({ serviceCode: deriveServiceCode(instant), serviceDate: toLocalServiceDate(instant), actor: staffActor });
    if (created.type !== "CREATED") throw new Error("unreachable");
    const opened = await svc.open(created.session.id);
    if (opened.type !== "OPENED") throw new Error("unreachable");
    expect(opened.session.floorplanVersionId).toBe(fixture.versionId);

    await publishNewDefaultVersion(prisma, { floorplanId, revision: 2, tableIds: ["sushi-table-9"] }); // excludes sushi-table-1 now

    const reservationId = await createReservation(instant);
    const idResult = ReservationId.create(reservationId);
    if (!idResult.ok) throw new Error("unreachable");
    const availSvc = availabilityService(floorplanId);
    const result = await availSvc.getAvailableResourcesForReservation(idResult.value);
    if (result.type !== "FOUND") throw new Error("unreachable");
    const ids = result.availableResources.map((r) => r.resourceId);
    expect(ids).toContain("sushi-table-1"); // still shown — the SNAPSHOT, not the new default, governs
    expect(ids).not.toContain("sushi-table-9");
  });

  it("a Cancelled session exposes no apparently-usable inventory — an empty availableResources under the existing FOUND shape, never a new result variant", async () => {
    const floorplanId = freshFloorplanId();
    await createPublishedFloorplanFixture(prisma, { floorplanId, tableIds: ["sushi-table-1"] });
    const instant = freshInstant();
    const svc = sessionService(floorplanId);
    const created = await svc.create({ serviceCode: deriveServiceCode(instant), serviceDate: toLocalServiceDate(instant), actor: staffActor });
    if (created.type !== "CREATED") throw new Error("unreachable");
    const cancelled = await svc.cancel(created.session.id);
    if (cancelled.type !== "CANCELLED") throw new Error("unreachable");

    const reservationId = await createReservation(instant);
    const idResult = ReservationId.create(reservationId);
    if (!idResult.ok) throw new Error("unreachable");
    const availSvc = availabilityService(floorplanId);
    const result = await availSvc.getAvailableResourcesForReservation(idResult.value);
    expect(result.type).toBe("FOUND"); // the existing response contract, not a new variant
    if (result.type !== "FOUND") throw new Error("unreachable");
    expect(result.availableResources).toEqual([]);
  });

  it("no eligible Published default at all -> also an empty availableResources (never an apparently-usable unfiltered list)", async () => {
    const floorplanId = freshFloorplanId(); // never created — no Floorplan row at all
    const instant = freshInstant();
    const reservationId = await createReservation(instant);
    const idResult = ReservationId.create(reservationId);
    if (!idResult.ok) throw new Error("unreachable");
    const availSvc = availabilityService(floorplanId);
    const result = await availSvc.getAvailableResourcesForReservation(idResult.value);
    expect(result.type).toBe("FOUND");
    if (result.type !== "FOUND") throw new Error("unreachable");
    expect(result.availableResources).toEqual([]);
  });

  it("when neither serviceSessionRepository nor floorplanRepository is wired, availableResources is completely unfiltered (byte-identical to pre-P2D behavior)", async () => {
    const instant = freshInstant();
    const reservationId = await createReservation(instant);
    const idResult = ReservationId.create(reservationId);
    if (!idResult.ok) throw new Error("unreachable");
    const unfilteredSvc = new SeatingAvailabilityService(new PrismaReservationRepository(prisma), new PrismaFloorRepository(prisma));
    const result = await unfilteredSvc.getAvailableResourcesForReservation(idResult.value);
    expect(result.type).toBe("FOUND");
    if (result.type !== "FOUND") throw new Error("unreachable");
    expect(result.availableResources.length).toBeGreaterThan(0); // real inventory, not filtered to empty
  });

  it("performs zero writes — still advisory-only, no transaction, no lock, even with membership enforcement wired", async () => {
    const floorplanId = freshFloorplanId();
    await createPublishedFloorplanFixture(prisma, { floorplanId, tableIds: ["sushi-table-1"] });
    const instant = freshInstant();
    const reservationId = await createReservation(instant);
    const idResult = ReservationId.create(reservationId);
    if (!idResult.ok) throw new Error("unreachable");
    const before = { assignments: await prisma.seatingAssignment.count(), sessions: await prisma.serviceSession.count() };
    const svc = availabilityService(floorplanId);
    await svc.getAvailableResourcesForReservation(idResult.value);
    const after = { assignments: await prisma.seatingAssignment.count(), sessions: await prisma.serviceSession.count() };
    expect(after).toEqual(before);
  });
});
