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
 * P1-B9 — HTTP-level coverage for POST /reservations/:id/seating/pre-assign,
 * which composes the existing, unmodified SeatingOrchestrator.assignSeating()
 * with seatImmediately: false — the exact same physical-resource claim as
 * tests/api/seating-assignment.test.ts (B4-B), only the resulting status
 * differs. Own disjoint fixture table ids (sushi-table-4..7/10,
 * sushi-bar-19/20) so this file's fixtures never collide with the other
 * seating test files sharing the same never-truncated floor inventory.
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
    return `preassign-${idCounter}`;
  }
}
let eventIdCounter = 0;
class SequentialEventIdGenerator {
  generate(): string {
    eventIdCounter += 1;
    return `preassign-evt-${eventIdCounter}`;
  }
}

const prisma = createTestPrismaClient();
const OWNER_USERNAME = "owner-seating-pre-assign-test";
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
async function createReservation(overrides: { partySize?: number; preferredArea?: string | null; reservationDate?: Date; status?: string } = {}): Promise<string> {
  resCounter += 1;
  const id = `preassign-res-${resCounter}`;
  await prisma.reservation.create({
    data: {
      id,
      servicePeriodId: "sp-preassign",
      contactId: "contact-1",
      contactName: "Pre-Assign Test Guest",
      status: overrides.status ?? "Confirmed",
      reservationDate: overrides.reservationDate ?? RESERVATION_TIME,
      partySize: overrides.partySize ?? 2,
      sourceCategory: "Telephone",
      // "preferredArea: null" explicitly (not just omitted) forces NO
      // managed area — omitted defaults to "Sushi" for every other test's
      // convenience.
      preferredArea: overrides.preferredArea === null ? null : (overrides.preferredArea ?? "Sushi"),
      createdBy: "staff-owner-seating-pre-assign-test",
      createdAt: NOW,
      updatedAt: NOW,
      version: 1,
    },
  });
  return id;
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
    id: "staff-owner-seating-pre-assign-test",
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
    data: { id: "contact-1", displayName: "Pre-Assign Test Guest", phoneRaw: "0611112222", phoneNormalized: "+31611112222", createdBy: "staff-owner-seating-pre-assign-test", lastRelevantActivityAt: NOW },
  });
});

function preAssign(reservationId: string, body: { commandId?: string; resources?: unknown; seatImmediately?: boolean }) {
  return post(sharedAgent, `/reservations/${reservationId}/seating/pre-assign`).send(body);
}

describe("POST /reservations/:id/seating/pre-assign — authentication and authorization", () => {
  it("missing authentication → 401", async () => {
    const reservationId = await createReservation();
    const res = await request(sharedApp)
      .post(`/reservations/${reservationId}/seating/pre-assign`)
      .set(CSRF_HEADER_NAME, "1")
      .send({ commandId: "x", resources: [{ tableId: "sushi-table-4" }] });
    expect(res.status).toBe(401);
  });

  it("a role absent from the permission matrix gets 403 — exercises requirePermission(Permission.SeatingAssign) directly, the SAME permission the immediate-assign route uses (no new permission was created for this route, per Chief Engineer decision)", () => {
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

describe("POST /reservations/:id/seating/pre-assign — request validation", () => {
  it("missing commandId → 422", async () => {
    const reservationId = await createReservation();
    const res = await preAssign(reservationId, { resources: [{ tableId: "sushi-table-4" }] });
    expect(res.status).toBe(422);
  });

  it("malformed resources → 422 (parseResourceSelectors' own structural-validation status, same as the immediate-assign route)", async () => {
    const reservationId = await createReservation();
    const res = await preAssign(reservationId, { commandId: "cmd-malformed", resources: "not-an-array" });
    expect(res.status).toBe(422);
  });

  it("unknown reservation id → 404", async () => {
    const res = await preAssign("does-not-exist", { commandId: "cmd-unknown", resources: [{ tableId: "sushi-table-4" }] });
    expect(res.status).toBe(404);
  });
});

describe("POST /reservations/:id/seating/pre-assign — reservation eligibility (identical gate to immediate assign)", () => {
  it("a Cancelled reservation is rejected (409 RESERVATION_NOT_ELIGIBLE)", async () => {
    const reservationId = await createReservation({ status: "Cancelled" });
    const res = await preAssign(reservationId, { commandId: "cmd-cancelled", resources: [{ tableId: "sushi-table-4" }] });
    expect(res.status).toBe(409);
    expect(res.body.type).toBe("RESERVATION_NOT_ELIGIBLE");
  });

  it("a Completed reservation is rejected (409 RESERVATION_NOT_ELIGIBLE)", async () => {
    const reservationId = await createReservation({ status: "Completed" });
    const res = await preAssign(reservationId, { commandId: "cmd-completed", resources: [{ tableId: "sushi-table-4" }] });
    expect(res.status).toBe(409);
    expect(res.body.type).toBe("RESERVATION_NOT_ELIGIBLE");
  });

  it("a Proposed reservation IS eligible — the identical isTerminal gate the immediate-assign route uses, not a new rule", async () => {
    const reservationId = await createReservation({ status: "Proposed", partySize: 1 });
    const res = await preAssign(reservationId, { commandId: "cmd-proposed", resources: [{ tableId: "sushi-bar-19" }] });
    expect(res.status).toBe(201);
    expect(res.body.status).toBe("Assigned");
  });

  it("a reservation with no managed area → 409 NO_MANAGED_AREA", async () => {
    const reservationId = await createReservation({ preferredArea: null });
    const res = await preAssign(reservationId, { commandId: "cmd-no-area", resources: [{ tableId: "sushi-table-4" }] });
    expect(res.status).toBe(409);
    expect(res.body.type).toBe("NO_MANAGED_AREA");
  });
});

describe("POST /reservations/:id/seating/pre-assign — successful creation, server-derived facts", () => {
  it("creates status Assigned, never Seated — the defining difference from the immediate-assign route", async () => {
    const reservationId = await createReservation({ preferredArea: "Sushi", partySize: 2 });
    const res = await preAssign(reservationId, { commandId: "cmd-happy-1", resources: [{ tableId: "sushi-table-4" }] });
    expect(res.status).toBe(201);
    expect(res.body.type).toBe("ASSIGNED");
    expect(res.body.status).toBe("Assigned");
    expect(res.body.seatedAt).toBeNull();

    const stored = await prisma.seatingAssignment.findUniqueOrThrow({ where: { id: res.body.assignmentId } });
    expect(stored.status).toBe("Assigned");
    expect(stored.seatedAt).toBeNull();
    expect(stored.startTime.toISOString()).toBe(RESERVATION_TIME.toISOString());
  });

  it("a client-sent seatImmediately: true is ignored — the route always forces false, server-owned, not client-controlled", async () => {
    const reservationId = await createReservation({ preferredArea: "Sushi" });
    const res = await preAssign(reservationId, { commandId: "cmd-force-immediate", resources: [{ tableId: "sushi-table-5" }], seatImmediately: true });
    expect(res.status).toBe(201);
    expect(res.body.status).toBe("Assigned");
  });

  it("the claimed interval is the reservation's own scheduled window, derived server-side — not an arbitrary 'from now' interval", async () => {
    const future = new Date("2026-08-25T19:00:00Z");
    const reservationId = await createReservation({ preferredArea: "Sushi", reservationDate: future });
    const res = await preAssign(reservationId, { commandId: "cmd-future-1", resources: [{ tableId: "sushi-table-6" }] });
    expect(res.status).toBe(201);
    const stored = await prisma.seatingAssignment.findUniqueOrThrow({ where: { id: res.body.assignmentId } });
    expect(stored.startTime.toISOString()).toBe(future.toISOString());
  });

  it("Reservation and any CapacityCommitment remain completely untouched by pre-assignment", async () => {
    const reservationId = await createReservation({ preferredArea: "Sushi", partySize: 2 });
    const commitmentId = `preassign-commit-${reservationId}`;
    await prisma.capacityCommitment.create({
      data: {
        commitmentId,
        reservationId,
        capacityPoolId: "Sushi",
        startTime: RESERVATION_TIME,
        endTime: new Date(RESERVATION_TIME.getTime() + 90 * 60_000),
        partySize: 2,
        status: "Committed",
        commandId: `preassign-commit-cmd-${reservationId}`,
      },
    });

    const res = await preAssign(reservationId, { commandId: "cmd-untouched-1", resources: [{ tableId: "sushi-table-7" }] });
    expect(res.status).toBe(201);

    const reservation = await prisma.reservation.findUniqueOrThrow({ where: { id: reservationId } });
    expect(reservation.status).toBe("Confirmed");
    expect(reservation.version).toBe(1);
    const commitment = await prisma.capacityCommitment.findUniqueOrThrow({ where: { commitmentId } });
    expect(commitment.status).toBe("Committed");
  });
});

describe("POST /reservations/:id/seating/pre-assign — physical seatability (same evaluator, same rules)", () => {
  it("blocked resource → 409 NOT_SEATABLE / RESOURCE_BLOCKED — pre-assignment cannot bypass an active ResourceBlock", async () => {
    await prisma.resourceBlock.create({
      data: { tableId: "sushi-table-10", startTime: new Date("2026-08-20T17:30:00Z"), endTime: new Date("2026-08-20T20:00:00Z"), reason: "test block", createdBy: "staff-owner-seating-pre-assign-test" },
    });
    const reservationId = await createReservation({ preferredArea: "Sushi" });
    const res = await preAssign(reservationId, { commandId: "cmd-blocked", resources: [{ tableId: "sushi-table-10" }] });
    expect(res.status).toBe(409);
    expect(res.body.type).toBe("NOT_SEATABLE");
    expect(res.body.seatability.type).toBe("RESOURCE_BLOCKED");
  });

  it("a reservation already actively assigned elsewhere → 409 ALREADY_ASSIGNED_ELSEWHERE", async () => {
    // partySize 1: sushi-bar-20 has nominalCapacity 1 (floorSeedData.ts) —
    // must match or the first call would fail on INSUFFICIENT_CAPACITY
    // instead of succeeding, which is not what this test is exercising.
    const reservationId = await createReservation({ preferredArea: "Sushi", partySize: 1 });
    const first = await preAssign(reservationId, { commandId: "cmd-already-1", resources: [{ tableId: "sushi-bar-20" }] });
    expect(first.status).toBe(201);

    const second = await preAssign(reservationId, { commandId: "cmd-already-2", resources: [{ tableId: "sushi-table-4" }] });
    expect(second.status).toBe(409);
    expect(second.body.type).toBe("ALREADY_ASSIGNED_ELSEWHERE");
  });
});

describe("POST /reservations/:id/seating/pre-assign — idempotency", () => {
  it("retrying the same commandId does not create a duplicate SeatingAssignment or resource claim", async () => {
    const reservationId = await createReservation({ preferredArea: "Sushi", partySize: 1 });
    const first = await preAssign(reservationId, { commandId: "cmd-idempotent-1", resources: [{ tableId: "sushi-bar-19" }] });
    expect(first.status).toBe(201);

    const second = await preAssign(reservationId, { commandId: "cmd-idempotent-1", resources: [{ tableId: "sushi-bar-19" }] });
    expect(second.status).toBe(201);
    expect(second.body.assignmentId).toBe(first.body.assignmentId);

    const assignments = await prisma.seatingAssignment.findMany({ where: { reservationId } });
    expect(assignments.length).toBe(1);
  });
});

describe("Existing immediate-assign route (B4-B) — unaffected by this increment", () => {
  it("POST /reservations/:id/seating still seats immediately, unchanged", async () => {
    const reservationId = await createReservation({ preferredArea: "Sushi" });
    const res = await post(sharedAgent, `/reservations/${reservationId}/seating`).send({ commandId: "cmd-unaffected-1", resources: [{ tableId: "sushi-table-5" }] });
    expect(res.status).toBe(201);
    expect(res.body.status).toBe("Seated");
  });
});
