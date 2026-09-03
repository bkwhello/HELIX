import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";
import { Express, Request, Response } from "express";
import { createApp } from "../../api/app.js";
import { resetDatabase } from "../integration/support/testHarness.js";
import {
  createTestPrismaClient,
  truncateStaffDomainTables,
  truncateSeatingDomainTables,
} from "../integration/support/testDatabaseSafety.js";
import { seedFloor } from "../../ops/floor/seedFloor.js";
import { PrismaReservationRepository } from "../../infrastructure/persistence/PrismaReservationRepository.js";
import { PrismaDuplicateReservationChecker } from "../../infrastructure/persistence/PrismaDuplicateReservationChecker.js";
import { PrismaClosingDayStore } from "../../infrastructure/persistence/PrismaClosingDayStore.js";
import { PrismaStaffUserRepository } from "../../infrastructure/persistence/PrismaStaffUserRepository.js";
import { PrismaSessionRepository } from "../../infrastructure/persistence/PrismaSessionRepository.js";
import { PrismaLoginAttemptTracker } from "../../infrastructure/persistence/PrismaLoginAttemptTracker.js";
import { ScryptPasswordHasher } from "../../infrastructure/ScryptPasswordHasher.js";
import { RandomSessionTokenGenerator } from "../../infrastructure/RandomSessionTokenGenerator.js";
import { PrismaContactRepository } from "../../infrastructure/persistence/PrismaContactRepository.js";
import { PrismaTransactionManager } from "../../infrastructure/persistence/PrismaTransactionManager.js";
import { UnvalidatedServicePeriodReader } from "../../infrastructure/UnvalidatedServicePeriodReader.js";
import { PrismaCapacityRepository } from "../../infrastructure/persistence/PrismaCapacityRepository.js";
import { PrismaFloorRepository } from "../../infrastructure/persistence/PrismaFloorRepository.js";
import { ServicePeriodService } from "../../application/availability/ServicePeriodService.js";
import { PrismaServicePeriodOverrideStore } from "../../infrastructure/persistence/PrismaServicePeriodOverrideStore.js";
import { CSRF_HEADER_NAME, requirePermission, StaffPrincipal } from "../../api/authMiddleware.js";
import { Permission } from "../../domain/rules/StaffAuthorizationPolicy.js";
import { ActorRole } from "../../domain/value-objects/Actor.js";

/**
 * P1-B6 — HTTP-level coverage for POST /reservations/:id/seating/move,
 * which composes the existing, unmodified SeatingOrchestrator.moveSeating()
 * directly. Same real-PostgreSQL, real-floor-seed posture as
 * tests/api/seating-assignment.test.ts (B4-B) / seating-no-show.test.ts
 * (B5); own disjoint fixture table ids so this file never collides with
 * those, even though Table/Seat rows are shared, never-truncated fixture
 * state across the whole run. Deliberately does NOT re-prove every
 * SeatabilityEvaluator NOT_SEATABLE reason (area mismatch, inactive,
 * blocked, insufficient capacity, overlap) — those are already
 * exhaustively covered in tests/api/seating-assignment.test.ts and
 * tests/domain/seatability-evaluator.test.ts against the SAME evaluator
 * moveSeating also calls; this file covers the material outcomes for
 * MOVE specifically (overlap with a third party, and the move-only
 * NO_ACTIVE_ASSIGNMENT case) without duplicating that whole matrix.
 */
const NOW = new Date("2026-08-20T17:30:00Z"); // 19:30 Europe/Amsterdam — inside Thursday's 17:00-21:00 window.
const RESERVATION_TIME = new Date("2026-08-20T18:00:00Z");
class FixedClock {
  now(): Date {
    return NOW;
  }
}
let idCounter = 0;
class SequentialIdGenerator {
  generate(): string {
    idCounter += 1;
    return `move-${idCounter}`;
  }
}
let eventIdCounter = 0;
class SequentialEventIdGenerator {
  generate(): string {
    eventIdCounter += 1;
    return `move-evt-${eventIdCounter}`;
  }
}

const prisma = createTestPrismaClient();
const OWNER_USERNAME = "owner-seating-move-test";
const OWNER_PASSWORD = "SuperSecret123!";
let sharedApp: Express;
let sharedAgent: ReturnType<typeof request.agent>;

function buildApp() {
  const closingDayStore = new PrismaClosingDayStore(prisma);
  const app = createApp({
    repository: new PrismaReservationRepository(prisma),
    duplicateChecker: new PrismaDuplicateReservationChecker(prisma),
    contactRepository: new PrismaContactRepository(prisma),
    transactionManager: new PrismaTransactionManager(prisma),
    servicePeriodReader: new UnvalidatedServicePeriodReader(),
    closingDayStore,
    idGenerator: new SequentialIdGenerator(),
    eventIdGenerator: new SequentialEventIdGenerator(),
    clock: new FixedClock(),
    capacity: {
      capacityRepository: new PrismaCapacityRepository(prisma),
      transactionManager: new PrismaTransactionManager(prisma),
      servicePeriodService: new ServicePeriodService(closingDayStore, new PrismaServicePeriodOverrideStore(prisma)),
    },
    floor: {
      floorRepository: new PrismaFloorRepository(prisma),
    },
    auth: {
      staffUserRepository: new PrismaStaffUserRepository(prisma),
      sessionRepository: new PrismaSessionRepository(prisma),
      passwordHasher: new ScryptPasswordHasher(),
      sessionTokenGenerator: new RandomSessionTokenGenerator(),
      cookieSecure: false,
      expectedOrigin: null,
      loginAttemptTracker: new PrismaLoginAttemptTracker(prisma),
    },
  });
  return { app };
}

function post(agent: ReturnType<typeof request.agent>, url: string) {
  return agent.post(url).set(CSRF_HEADER_NAME, "1");
}

let resCounter = 0;
async function createReservation(overrides: { partySize?: number; preferredArea?: string; reservationDate?: Date; status?: string } = {}): Promise<string> {
  resCounter += 1;
  const id = `move-res-${resCounter}`;
  await prisma.reservation.create({
    data: {
      id,
      servicePeriodId: "sp-move",
      contactId: "contact-1",
      contactName: "Move Test Guest",
      status: overrides.status ?? "Confirmed",
      reservationDate: overrides.reservationDate ?? RESERVATION_TIME,
      partySize: overrides.partySize ?? 2,
      sourceCategory: "Telephone",
      preferredArea: overrides.preferredArea ?? "Sushi",
      createdBy: "staff-owner-seating-move-test",
      createdAt: NOW,
      updatedAt: NOW,
      version: 1,
    },
  });
  return id;
}

async function createCapacityCommitment(reservationId: string, overrides: { partySize?: number; reservationDate?: Date } = {}) {
  const commitmentId = `move-commit-${reservationId}`;
  const start = overrides.reservationDate ?? RESERVATION_TIME;
  await prisma.capacityCommitment.create({
    data: {
      commitmentId,
      reservationId,
      capacityPoolId: "Sushi",
      startTime: start,
      endTime: new Date(start.getTime() + 90 * 60_000),
      partySize: overrides.partySize ?? 2,
      status: "Committed",
      commandId: `move-commit-cmd-${reservationId}`,
    },
  });
  return commitmentId;
}

beforeAll(async () => {
  await resetDatabase(prisma);
  await truncateStaffDomainTables(prisma);
  await truncateSeatingDomainTables(prisma);
  await seedFloor(process.env["TEST_DATABASE_URL"]!);

  const built = buildApp();
  sharedApp = built.app;

  const passwordHasher = new ScryptPasswordHasher();
  const staffUserRepository = new PrismaStaffUserRepository(prisma);
  await staffUserRepository.create({
    id: "staff-owner-seating-move-test",
    username: OWNER_USERNAME,
    displayName: "Test Owner",
    email: null,
    passwordHash: await passwordHasher.hash(OWNER_PASSWORD),
    role: ActorRole.Owner,
  });

  sharedAgent = request.agent(sharedApp);
  const loginRes = await post(sharedAgent, "/auth/login").send({ username: OWNER_USERNAME, password: OWNER_PASSWORD });
  if (loginRes.status !== 200) throw new Error(`test setup failed to log in: ${loginRes.status} ${JSON.stringify(loginRes.body)}`);
});
afterAll(async () => {
  await prisma.$disconnect();
});
beforeEach(async () => {
  await truncateSeatingDomainTables(prisma);
  await resetDatabase(prisma);
  await prisma.contact.create({
    data: { id: "contact-1", displayName: "Move Test Guest", phoneRaw: "0611111111", phoneNormalized: "+31611111111", createdBy: "staff-owner-seating-move-test", lastRelevantActivityAt: NOW },
  });
});

function move(reservationId: string, body: Record<string, unknown>) {
  return post(sharedAgent, `/reservations/${reservationId}/seating/move`).send(body);
}

async function assignViaB4B(reservationId: string, tableId: string, commandId: string) {
  const res = await post(sharedAgent, `/reservations/${reservationId}/seating`).send({ commandId, resources: [{ tableId }] });
  expect(res.status).toBe(201);
  return res.body.assignmentId as string;
}

describe("POST /reservations/:id/seating/move — authentication and authorization", () => {
  it("missing authentication → 401", async () => {
    const reservationId = await createReservation();
    const res = await request(sharedApp).post(`/reservations/${reservationId}/seating/move`).set(CSRF_HEADER_NAME, "1").send({ commandId: "cmd-1", resources: [{ tableId: "sushi-table-4" }] });
    expect(res.status).toBe(401);
  });

  it(
    "a role absent from the permission matrix gets 403 — same established precedent as the other seating test files: every currently-defined " +
      "ActorRole already includes seating.move, so this exercises requirePermission(Permission.SeatingMove) directly.",
    () => {
      const middleware = requirePermission(Permission.SeatingMove);
      const principal: StaffPrincipal = { staffUserId: "x", role: "NoSuchRole" as unknown as ActorRole, displayName: "x" };
      const req = { staffPrincipal: principal } as unknown as Request;
      let statusCode: number | undefined;
      const res = {
        status(code: number) {
          statusCode = code;
          return this;
        },
        json() {
          return this;
        },
      } as unknown as Response;
      let nextCalled = false;
      middleware(req, res, () => {
        nextCalled = true;
      });
      expect(statusCode).toBe(403);
      expect(nextCalled).toBe(false);
    }
  );
});

describe("POST /reservations/:id/seating/move — malformed/invalid request (same conventions as B4-B assign)", () => {
  it("unknown reservation → 404", async () => {
    const res = await move("does-not-exist", { commandId: "cmd-1", resources: [{ tableId: "sushi-table-4" }] });
    expect(res.status).toBe(404);
  });

  it("missing commandId → 422", async () => {
    const reservationId = await createReservation();
    const res = await move(reservationId, { resources: [{ tableId: "sushi-table-4" }] });
    expect(res.status).toBe(422);
  });

  it("empty resource selection → 422", async () => {
    const reservationId = await createReservation();
    const res = await move(reservationId, { commandId: "cmd-2", resources: [] });
    expect(res.status).toBe(422);
  });

  it("malformed resource selector (both tableId and seatId) → 422", async () => {
    const reservationId = await createReservation();
    const res = await move(reservationId, { commandId: "cmd-3", resources: [{ tableId: "sushi-table-4", seatId: "x" }] });
    expect(res.status).toBe(422);
  });
});

describe("POST /reservations/:id/seating/move — no active assignment", () => {
  it("a reservation with no assignment at all → 409 NO_ACTIVE_ASSIGNMENT", async () => {
    const reservationId = await createReservation({ preferredArea: "Sushi" });
    const res = await move(reservationId, { commandId: "cmd-4", resources: [{ tableId: "sushi-table-5" }] });
    expect(res.status).toBe(409);
    expect(res.body).toEqual({ type: "NO_ACTIVE_ASSIGNMENT" });
  });
});

describe("POST /reservations/:id/seating/move — successful move", () => {
  it("releases the old resource and claims the new one, preserving status and interval; Reservation/CapacityCommitment untouched", async () => {
    const reservationId = await createReservation({ preferredArea: "Sushi", partySize: 2, status: "Confirmed" });
    const commitmentId = await createCapacityCommitment(reservationId, { partySize: 2 });

    const assignmentId = await assignViaB4B(reservationId, "sushi-table-6", "move-assign-cmd-1");
    const before = await prisma.seatingAssignment.findUniqueOrThrow({ where: { id: assignmentId } });
    expect(before.status).toBe("Seated");

    const res = await move(reservationId, { commandId: "move-cmd-1", resources: [{ tableId: "sushi-table-7" }] });
    expect(res.status).toBe(200);
    expect(res.body.type).toBe("MOVED");
    expect(res.body.status).toBe("Seated");

    // Old assignment row is released; a NEW assignment row exists for the new resource.
    const oldAssignment = await prisma.seatingAssignment.findUniqueOrThrow({ where: { id: assignmentId } });
    expect(oldAssignment.status).toBe("Released");
    expect(oldAssignment.releaseReason).toBe("StaffReassigned");

    const newAssignment = await prisma.seatingAssignment.findUniqueOrThrow({ where: { id: res.body.assignmentId } });
    expect(newAssignment.status).toBe("Seated");
    expect(newAssignment.startTime.getTime()).toBe(before.startTime.getTime());
    expect(newAssignment.endTime.getTime()).toBe(before.endTime.getTime());

    const newResource = await prisma.seatingAssignmentResource.findFirstOrThrow({ where: { assignmentId: newAssignment.id } });
    expect(newResource.tableId).toBe("sushi-table-7");
    const oldResourceStillClaimed = await prisma.seatingAssignmentResource.findFirst({ where: { tableId: "sushi-table-6", status: { in: ["Assigned", "Seated"] } } });
    expect(oldResourceStillClaimed).toBeNull();

    // Reservation and CapacityCommitment must remain completely untouched.
    const reservation = await prisma.reservation.findUniqueOrThrow({ where: { id: reservationId } });
    expect(reservation.status).toBe("Confirmed");
    expect(reservation.version).toBe(1);
    const commitment = await prisma.capacityCommitment.findUniqueOrThrow({ where: { commitmentId } });
    expect(commitment.status).toBe("Committed");
  });

  it("moving to a resource with an overlapping claim from a different reservation → 409 NOT_SEATABLE / RESOURCE_OVERLAP", async () => {
    const otherReservationId = await createReservation({ preferredArea: "Sushi" });
    await assignViaB4B(otherReservationId, "sushi-table-8", "move-overlap-setup");

    const reservationId = await createReservation({ preferredArea: "Sushi" });
    await assignViaB4B(reservationId, "sushi-table-9", "move-overlap-own");

    const res = await move(reservationId, { commandId: "move-overlap-attempt", resources: [{ tableId: "sushi-table-8" }] });
    expect(res.status).toBe(409);
    expect(res.body.type).toBe("NOT_SEATABLE");
    expect(res.body.seatability.type).toBe("RESOURCE_OVERLAP");

    // The original assignment must remain untouched — a failed move never releases the old claim.
    const stillOwn = await prisma.seatingAssignmentResource.findFirst({ where: { tableId: "sushi-table-9", status: { in: ["Assigned", "Seated"] } } });
    expect(stillOwn).not.toBeNull();
  });
});

describe("POST /reservations/:id/seating/move — idempotency", () => {
  it("retrying the same commandId does not create a duplicate assignment or resource claim", async () => {
    const reservationId = await createReservation({ preferredArea: "Sushi" });
    await assignViaB4B(reservationId, "sushi-table-10", "move-idem-assign");

    const first = await move(reservationId, { commandId: "move-idem-cmd-1", resources: [{ tableId: "sushi-table-11" }] });
    expect(first.status).toBe(200);

    const second = await move(reservationId, { commandId: "move-idem-cmd-1", resources: [{ tableId: "sushi-table-11" }] });
    expect(second.status).toBe(200);
    expect(second.body.assignmentId).toBe(first.body.assignmentId);

    const assignments = await prisma.seatingAssignment.findMany({ where: { reservationId } });
    // Original (now Released) + the one moved-to assignment — never duplicated by the repeat call.
    expect(assignments.length).toBe(2);
    const resourceRows = await prisma.seatingAssignmentResource.findMany({ where: { assignmentId: first.body.assignmentId } });
    expect(resourceRows.length).toBe(1);
  });
});

describe("Existing Plaatsen and No-show flows — unaffected by this increment", () => {
  it("POST /reservations/:id/seating (assign) still succeeds exactly as before", async () => {
    const reservationId = await createReservation({ preferredArea: "Sushi" });
    const res = await post(sharedAgent, `/reservations/${reservationId}/seating`).send({ commandId: "move-regression-assign", resources: [{ tableId: "sushi-table-12" }] });
    expect(res.status).toBe(201);
    expect(res.body.type).toBe("ASSIGNED");
  });

  it("POST /reservations/:id/seating/no-show still succeeds exactly as before", async () => {
    const reservationId = await createReservation({ preferredArea: "Sushi" });
    await assignViaB4B(reservationId, "sushi-table-13", "move-regression-noshow-assign");
    const res = await post(sharedAgent, `/reservations/${reservationId}/seating/no-show`).send({});
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ type: "RELEASED" });
  });
});
