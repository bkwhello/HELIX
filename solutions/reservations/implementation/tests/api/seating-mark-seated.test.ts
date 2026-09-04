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
 * P1-B9 — HTTP-level coverage for POST /reservations/:id/seating/mark-seated,
 * which composes the existing SeatingOrchestrator.markSeated() directly —
 * idempotency-fixed this same phase (see that method's own doc comment in
 * SeatingOrchestrator.ts). Own disjoint fixture table ids
 * (sushi-table-1/2/3/8/9, sushi-table-12) so this file's fixtures never
 * collide with the other seating test files sharing the same
 * never-truncated floor inventory.
 */
const NOW = new Date("2026-08-20T17:30:00Z");
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
    return `markseated-${idCounter}`;
  }
}
let eventIdCounter = 0;
class SequentialEventIdGenerator {
  generate(): string {
    eventIdCounter += 1;
    return `markseated-evt-${eventIdCounter}`;
  }
}

const prisma = createTestPrismaClient();
const OWNER_USERNAME = "owner-seating-mark-seated-test";
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
      prisma,
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
  const id = `markseated-res-${resCounter}`;
  await prisma.reservation.create({
    data: {
      id,
      servicePeriodId: "sp-markseated",
      contactId: "contact-1",
      contactName: "Mark Seated Test Guest",
      status: overrides.status ?? "Confirmed",
      reservationDate: overrides.reservationDate ?? RESERVATION_TIME,
      partySize: overrides.partySize ?? 2,
      sourceCategory: "Telephone",
      preferredArea: overrides.preferredArea ?? "Sushi",
      createdBy: "staff-owner-seating-mark-seated-test",
      createdAt: NOW,
      updatedAt: NOW,
      version: 1,
    },
  });
  return id;
}

async function createAssignedFixture(reservationId: string, tableId: string): Promise<string> {
  const assignment = await prisma.seatingAssignment.create({
    data: {
      reservationId,
      status: "Assigned",
      startTime: RESERVATION_TIME,
      endTime: new Date(RESERVATION_TIME.getTime() + 90 * 60_000),
      assignedBy: "staff-owner-seating-mark-seated-test",
      commandId: `markseated-fixture-${reservationId}`,
    },
  });
  await prisma.seatingAssignmentResource.create({
    data: { assignmentId: assignment.id, tableId, status: "Assigned", startTime: RESERVATION_TIME, endTime: new Date(RESERVATION_TIME.getTime() + 90 * 60_000) },
  });
  return assignment.id;
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
    id: "staff-owner-seating-mark-seated-test",
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
    data: { id: "contact-1", displayName: "Mark Seated Test Guest", phoneRaw: "0611113333", phoneNormalized: "+31611113333", createdBy: "staff-owner-seating-mark-seated-test", lastRelevantActivityAt: NOW },
  });
});

function markSeated(reservationId: string) {
  return post(sharedAgent, `/reservations/${reservationId}/seating/mark-seated`).send({});
}

describe("POST /reservations/:id/seating/mark-seated — authentication and authorization", () => {
  it("missing authentication → 401", async () => {
    const reservationId = await createReservation();
    const res = await request(sharedApp).post(`/reservations/${reservationId}/seating/mark-seated`).set(CSRF_HEADER_NAME, "1").send({});
    expect(res.status).toBe(401);
  });

  it("a role absent from the permission matrix gets 403 — exercises requirePermission(Permission.SeatingAssign) directly, the SAME permission the assign/pre-assign routes use (no new permission was created for this route, per Chief Engineer decision)", () => {
    const middleware = requirePermission(Permission.SeatingAssign);
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
  });
});

describe("POST /reservations/:id/seating/mark-seated — Assigned -> Seated transition", () => {
  it("transitions an Assigned assignment to Seated and sets seatedAt (was null)", async () => {
    const reservationId = await createReservation();
    const assignmentId = await createAssignedFixture(reservationId, "sushi-table-1");
    const before = await prisma.seatingAssignment.findUniqueOrThrow({ where: { id: assignmentId } });
    expect(before.status).toBe("Assigned");
    expect(before.seatedAt).toBeNull();

    const res = await markSeated(reservationId);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ type: "SEATED" });

    const after = await prisma.seatingAssignment.findUniqueOrThrow({ where: { id: assignmentId } });
    expect(after.status).toBe("Seated");
    expect(after.seatedAt).not.toBeNull();

    // Reservation and any CapacityCommitment are untouched.
    const reservation = await prisma.reservation.findUniqueOrThrow({ where: { id: reservationId } });
    expect(reservation.status).toBe("Confirmed");
    expect(reservation.version).toBe(1);
  });
});

describe("POST /reservations/:id/seating/mark-seated — idempotency (P1-B9 fix)", () => {
  it("a repeated call after the party is already Seated returns 200 SEATED again, WITHOUT changing seatedAt", async () => {
    const reservationId = await createReservation();
    const assignmentId = await createAssignedFixture(reservationId, "sushi-table-2");

    const first = await markSeated(reservationId);
    expect(first.status).toBe(200);
    const afterFirst = await prisma.seatingAssignment.findUniqueOrThrow({ where: { id: assignmentId } });
    expect(afterFirst.status).toBe("Seated");
    const seatedAtAfterFirst = afterFirst.seatedAt;
    expect(seatedAtAfterFirst).not.toBeNull();

    // updateAssignmentStatus stamps seatedAt with the real wall-clock time
    // (new Date()), not the injected FixedClock — so without the P1-B9
    // guard, a second call several milliseconds later would produce a
    // measurably later seatedAt. A short real delay makes that failure
    // mode observable if the guard regresses.
    await new Promise((resolve) => setTimeout(resolve, 20));

    const second = await markSeated(reservationId);
    expect(second.status).toBe(200);
    expect(second.body).toEqual({ type: "SEATED" });

    const afterSecond = await prisma.seatingAssignment.findUniqueOrThrow({ where: { id: assignmentId } });
    expect(afterSecond.status).toBe("Seated");
    expect(afterSecond.seatedAt?.toISOString()).toBe(seatedAtAfterFirst?.toISOString());

    // Still exactly one assignment row — no duplicate created.
    const assignments = await prisma.seatingAssignment.findMany({ where: { reservationId } });
    expect(assignments.length).toBe(1);
  });

  it("three repeated calls all return 200 SEATED with seatedAt stable across every call", async () => {
    const reservationId = await createReservation();
    const assignmentId = await createAssignedFixture(reservationId, "sushi-table-3");

    const results = [];
    for (let i = 0; i < 3; i += 1) {
      await new Promise((resolve) => setTimeout(resolve, 10));
      const res = await markSeated(reservationId);
      expect(res.status).toBe(200);
      const row = await prisma.seatingAssignment.findUniqueOrThrow({ where: { id: assignmentId } });
      results.push(row.seatedAt?.toISOString());
    }
    expect(new Set(results).size).toBe(1);
  });
});

describe("POST /reservations/:id/seating/mark-seated — no active assignment", () => {
  it("an Unassigned reservation → 409 NO_ACTIVE_ASSIGNMENT", async () => {
    const reservationId = await createReservation();
    const res = await markSeated(reservationId);
    expect(res.status).toBe(409);
    expect(res.body).toEqual({ type: "NO_ACTIVE_ASSIGNMENT" });
  });

  it("a reservation whose only assignment is Released → 409 NO_ACTIVE_ASSIGNMENT", async () => {
    const reservationId = await createReservation();
    await prisma.seatingAssignment.create({
      data: {
        reservationId,
        status: "Released",
        releaseReason: "GuestCancelled",
        releasedBy: "staff-owner-seating-mark-seated-test",
        releasedAt: NOW,
        startTime: RESERVATION_TIME,
        endTime: new Date(RESERVATION_TIME.getTime() + 90 * 60_000),
        assignedBy: "staff-owner-seating-mark-seated-test",
        commandId: "markseated-fixture-released",
      },
    });
    const res = await markSeated(reservationId);
    expect(res.status).toBe(409);
    expect(res.body).toEqual({ type: "NO_ACTIVE_ASSIGNMENT" });
  });

  it("unknown reservation id → 409 NO_ACTIVE_ASSIGNMENT (same precedent as No-Show: not a 404, this route never separately validates reservation existence)", async () => {
    const res = await markSeated("does-not-exist");
    expect(res.status).toBe(409);
    expect(res.body).toEqual({ type: "NO_ACTIVE_ASSIGNMENT" });
  });
});

describe("Workflow coherence — pre-assign -> mark-seated -> move / no-show remain coherent", () => {
  it("a full chain through the real routes: pre-assign, mark-seated, move, no-show", async () => {
    const reservationId = await createReservation({ preferredArea: "Sushi", partySize: 2 });

    const preAssignRes = await post(sharedAgent, `/reservations/${reservationId}/seating/pre-assign`).send({
      commandId: "chain-preassign-1",
      resources: [{ tableId: "sushi-table-8" }],
    });
    expect(preAssignRes.status).toBe(201);
    expect(preAssignRes.body.status).toBe("Assigned");

    const markSeatedRes = await markSeated(reservationId);
    expect(markSeatedRes.status).toBe(200);
    const seated = await prisma.seatingAssignment.findUniqueOrThrow({ where: { id: preAssignRes.body.assignmentId } });
    expect(seated.status).toBe("Seated");

    const moveRes = await post(sharedAgent, `/reservations/${reservationId}/seating/move`).send({
      commandId: "chain-move-1",
      resources: [{ tableId: "sushi-table-9" }],
    });
    expect(moveRes.status).toBe(200);
    expect(moveRes.body.type).toBe("MOVED");
    // moveSeating preserves the current status (Seated) on the new claim —
    // proving Assigned-then-marked-Seated is treated identically to an
    // immediately-Seated walk-in by the pre-existing, unmodified move logic.
    expect(moveRes.body.status).toBe("Seated");

    const noShowRes = await post(sharedAgent, `/reservations/${reservationId}/seating/no-show`).send({});
    expect(noShowRes.status).toBe(200);
    expect(noShowRes.body).toEqual({ type: "RELEASED" });

    // Two Released rows exist by now — the move's own old-claim release
    // (StaffReassigned) and the no-show's (NoShow) — so this must filter
    // by releaseReason directly rather than an unordered findFirst.
    const released = await prisma.seatingAssignment.findFirstOrThrow({ where: { reservationId, releaseReason: "NoShow" } });
    expect(released.status).toBe("Released");

    // Reservation lifecycle status was never touched anywhere in the chain.
    const reservation = await prisma.reservation.findUniqueOrThrow({ where: { id: reservationId } });
    expect(reservation.status).toBe("Confirmed");
  });

  it("resource-block conflicts still apply after pre-assign/mark-seated: a move onto a blocked table is refused", async () => {
    const reservationId = await createReservation({ preferredArea: "Sushi" });
    const preAssignRes = await post(sharedAgent, `/reservations/${reservationId}/seating/pre-assign`).send({
      commandId: "chain-block-preassign-1",
      resources: [{ tableId: "sushi-table-12" }],
    });
    expect(preAssignRes.status).toBe(201);
    await markSeated(reservationId);

    await prisma.resourceBlock.create({
      data: { tableId: "sushi-table-8", startTime: new Date("2026-08-20T17:30:00Z"), endTime: new Date("2026-08-20T20:00:00Z"), reason: "test block", createdBy: "staff-owner-seating-mark-seated-test" },
    });

    const moveRes = await post(sharedAgent, `/reservations/${reservationId}/seating/move`).send({
      commandId: "chain-block-move-1",
      resources: [{ tableId: "sushi-table-8" }],
    });
    expect(moveRes.status).toBe(409);
    expect(moveRes.body.type).toBe("NOT_SEATABLE");
    expect(moveRes.body.seatability.type).toBe("RESOURCE_BLOCKED");
  });
});
