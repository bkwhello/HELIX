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
 * P1-B4-B — HTTP-level coverage for POST /reservations/:id/seating, the
 * authoritative physical-resource claim that composes
 * SeatingOrchestrator.assignSeating() directly. Real PostgreSQL, real
 * floor seed — same posture as tests/api/seating-availability.test.ts
 * (B4-A). Uses its own, disjoint set of seeded table/seat ids
 * (sushi-table-6.. onward, teppanyaki-d) so this file's fixtures never
 * collide with B4-A's own, even though Table/Seat rows are shared,
 * never-truncated fixture state across the whole test run.
 */
// 19:30 Europe/Amsterdam — inside Thursday's real 17:00-21:00 ServicePeriod
// window (needed because the P1-B3 Walk-in recovery test below calls the
// real POST /availability/reservations/walk-in, which uses this FixedClock
// as its own commandNow and enforces the open-hours-only ServicePeriod check).
const NOW = new Date("2026-08-20T17:30:00Z");
const RESERVATION_TIME = new Date("2026-08-20T18:00:00Z"); // Thursday 20:00 Europe/Amsterdam — inside the 17:00-21:00 window.
class FixedClock {
  now(): Date {
    return NOW;
  }
}
let idCounter = 0;
class SequentialIdGenerator {
  generate(): string {
    idCounter += 1;
    return `seatassign-${idCounter}`;
  }
}
let eventIdCounter = 0;
class SequentialEventIdGenerator {
  generate(): string {
    eventIdCounter += 1;
    return `seatassign-evt-${eventIdCounter}`;
  }
}

const prisma = createTestPrismaClient();
const OWNER_USERNAME = "owner-seating-assignment-test";
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
  const id = `seatassign-res-${resCounter}`;
  await prisma.reservation.create({
    data: {
      id,
      servicePeriodId: "sp-seatassign",
      contactId: "contact-1",
      contactName: "Seating Assignment Test Guest",
      status: overrides.status ?? "Confirmed",
      reservationDate: overrides.reservationDate ?? RESERVATION_TIME,
      partySize: overrides.partySize ?? 2,
      sourceCategory: "Telephone",
      preferredArea: overrides.preferredArea,
      createdBy: "staff-owner-seating-assignment-test",
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
    id: "staff-owner-seating-assignment-test",
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
    data: { id: "contact-1", displayName: "Seating Assignment Test Guest", phoneRaw: "0611111111", phoneNormalized: "+31611111111", createdBy: "staff-owner-seating-assignment-test", lastRelevantActivityAt: NOW },
  });
});

function seat(reservationId: string, body: Record<string, unknown>) {
  return post(sharedAgent, `/reservations/${reservationId}/seating`).send(body);
}

describe("POST /reservations/:id/seating — authentication and authorization", () => {
  it("missing authentication → 401", async () => {
    const reservationId = await createReservation({ preferredArea: "Sushi" });
    const res = await request(sharedApp)
      .post(`/reservations/${reservationId}/seating`)
      .set(CSRF_HEADER_NAME, "1")
      .send({ commandId: "no-auth", resources: [{ tableId: "sushi-table-6" }] });
    expect(res.status).toBe(401);
  });

  it(
    "a role absent from the permission matrix gets 403 — same established precedent as tests/api/walk-in.test.ts and tests/api/seating-availability.test.ts: " +
      "every currently-defined ActorRole already includes seating.assign, so this exercises requirePermission(Permission.SeatingAssign) directly.",
    () => {
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
    }
  );
});

describe("POST /reservations/:id/seating — reservation lookup and request shape", () => {
  it("unknown reservation → 404", async () => {
    const res = await seat("does-not-exist", { commandId: "cmd-1", resources: [{ tableId: "sushi-table-6" }] });
    expect(res.status).toBe(404);
  });

  it("malformed resource request (not an array) → 422", async () => {
    const reservationId = await createReservation({ preferredArea: "Sushi" });
    const res = await seat(reservationId, { commandId: "cmd-2", resources: "sushi-table-6" });
    expect(res.status).toBe(422);
  });

  it("malformed resource selector (both tableId and seatId, or neither) → 422", async () => {
    const reservationId = await createReservation({ preferredArea: "Sushi" });
    const res = await seat(reservationId, { commandId: "cmd-3", resources: [{ tableId: "sushi-table-6", seatId: "x" }] });
    expect(res.status).toBe(422);
    const res2 = await seat(reservationId, { commandId: "cmd-3b", resources: [{}] });
    expect(res2.status).toBe(422);
  });

  it("empty resource selection → 422", async () => {
    const reservationId = await createReservation({ preferredArea: "Sushi" });
    const res = await seat(reservationId, { commandId: "cmd-4", resources: [] });
    expect(res.status).toBe(422);
  });

  it("missing commandId → 422", async () => {
    const reservationId = await createReservation({ preferredArea: "Sushi" });
    const res = await seat(reservationId, { resources: [{ tableId: "sushi-table-6" }] });
    expect(res.status).toBe(422);
  });
});

describe("POST /reservations/:id/seating — Sushi and Teppanyaki success", () => {
  it("assigns a Sushi Table and the successful response status is Seated", async () => {
    const reservationId = await createReservation({ preferredArea: "Sushi", partySize: 2 });
    const res = await seat(reservationId, { commandId: "cmd-sushi-1", resources: [{ tableId: "sushi-table-6" }] });
    expect(res.status).toBe(201);
    expect(res.body.type).toBe("ASSIGNED");
    expect(res.body.status).toBe("Seated");
    expect(res.body.seatedAt).toBeTruthy();

    const row = await prisma.seatingAssignment.findUniqueOrThrow({ where: { id: res.body.assignmentId } });
    expect(row.status).toBe("Seated");
    expect(row.reservationId).toBe(reservationId);
  });

  it("assigns a Teppanyaki Seat and the successful response status is Seated", async () => {
    const reservationId = await createReservation({ preferredArea: "Teppanyaki", partySize: 2 });
    const res = await seat(reservationId, { commandId: "cmd-teppan-1", resources: [{ seatId: "teppanyaki-d-seat-01" }, { seatId: "teppanyaki-d-seat-02" }] });
    expect(res.status).toBe(201);
    expect(res.body.status).toBe("Seated");
    const resourceRows = await prisma.seatingAssignmentResource.findMany({ where: { assignmentId: res.body.assignmentId } });
    expect(resourceRows.map((r) => r.seatId).sort()).toEqual(["teppanyaki-d-seat-01", "teppanyaki-d-seat-02"]);
    expect(resourceRows.every((r) => r.tableId === null)).toBe(true);
  });
});

describe("POST /reservations/:id/seating — NOT_SEATABLE reasons, all delegated to the existing evaluator", () => {
  it("wrong-area resource → RESOURCE_AREA_MISMATCH (also proves the server derives area, never the client)", async () => {
    const reservationId = await createReservation({ preferredArea: "Teppanyaki", partySize: 2 });
    const res = await seat(reservationId, { commandId: "cmd-wrongarea", resources: [{ tableId: "sushi-table-7" }] });
    expect(res.status).toBe(409);
    expect(res.body.type).toBe("NOT_SEATABLE");
    expect(res.body.seatability.type).toBe("RESOURCE_AREA_MISMATCH");
  });

  it("inactive resource → RESOURCE_INACTIVE", async () => {
    await prisma.table.update({ where: { id: "sushi-table-8" }, data: { status: "Inactive" } });
    try {
      const reservationId = await createReservation({ preferredArea: "Sushi" });
      const res = await seat(reservationId, { commandId: "cmd-inactive", resources: [{ tableId: "sushi-table-8" }] });
      expect(res.status).toBe(409);
      expect(res.body.seatability.type).toBe("RESOURCE_INACTIVE");
    } finally {
      await prisma.table.update({ where: { id: "sushi-table-8" }, data: { status: "Active" } });
    }
  });

  it("blocked resource → RESOURCE_BLOCKED", async () => {
    await prisma.resourceBlock.create({
      data: { tableId: "sushi-table-9", startTime: new Date("2026-08-20T17:30:00Z"), endTime: new Date("2026-08-20T20:00:00Z"), reason: "test block", createdBy: "staff-owner-seating-assignment-test" },
    });
    const reservationId = await createReservation({ preferredArea: "Sushi" });
    const res = await seat(reservationId, { commandId: "cmd-blocked", resources: [{ tableId: "sushi-table-9" }] });
    expect(res.status).toBe(409);
    expect(res.body.seatability.type).toBe("RESOURCE_BLOCKED");
  });

  it("insufficient selected physical capacity → INSUFFICIENT_CAPACITY (also proves the server derives the reservation's real party size)", async () => {
    // sushi-table-11 nominalCapacity is 2 (floorSeedData.ts) — a party of 6 cannot fit.
    const reservationId = await createReservation({ preferredArea: "Sushi", partySize: 6 });
    const res = await seat(reservationId, { commandId: "cmd-insufficient", resources: [{ tableId: "sushi-table-11" }] });
    expect(res.status).toBe(409);
    expect(res.body.seatability.type).toBe("INSUFFICIENT_CAPACITY");
    expect(res.body.seatability.requested).toBe(6);
  });

  it("overlapping active claim on the same resource → RESOURCE_OVERLAP (also proves the server derives the reservation's real interval)", async () => {
    const otherReservationId = await createReservation({ preferredArea: "Sushi", reservationDate: RESERVATION_TIME });
    const other = await seat(otherReservationId, { commandId: "cmd-overlap-setup", resources: [{ tableId: "sushi-table-12" }] });
    expect(other.status).toBe(201);

    const reservationId = await createReservation({ preferredArea: "Sushi", reservationDate: RESERVATION_TIME });
    const res = await seat(reservationId, { commandId: "cmd-overlap-attempt", resources: [{ tableId: "sushi-table-12" }] });
    expect(res.status).toBe(409);
    expect(res.body.seatability.type).toBe("RESOURCE_OVERLAP");
  });
});

describe("POST /reservations/:id/seating — client cannot control server-owned values", () => {
  it("seatImmediately is always server-owned true — a client-sent false is ignored", async () => {
    const reservationId = await createReservation({ preferredArea: "Sushi" });
    const res = await seat(reservationId, { commandId: "cmd-force-seat", resources: [{ tableId: "sushi-table-13" }], seatImmediately: false });
    expect(res.status).toBe(201);
    expect(res.body.status).toBe("Seated");
  });
});

describe("POST /reservations/:id/seating — reservation eligibility", () => {
  it("a Cancelled reservation is rejected (409 RESERVATION_NOT_ELIGIBLE), not silently seated", async () => {
    const reservationId = await createReservation({ preferredArea: "Sushi", status: "Cancelled" });
    const res = await seat(reservationId, { commandId: "cmd-cancelled", resources: [{ tableId: "sushi-table-15" }] });
    expect(res.status).toBe(409);
    expect(res.body.type).toBe("RESERVATION_NOT_ELIGIBLE");
    expect(res.body.status).toBe("Cancelled");
  });

  it("a Completed reservation is rejected (409 RESERVATION_NOT_ELIGIBLE)", async () => {
    const reservationId = await createReservation({ preferredArea: "Sushi", status: "Completed" });
    const res = await seat(reservationId, { commandId: "cmd-completed", resources: [{ tableId: "sushi-table-16" }] });
    expect(res.status).toBe(409);
    expect(res.body.type).toBe("RESERVATION_NOT_ELIGIBLE");
  });

  it("a Proposed reservation IS eligible (required for the Walk-in CREATED_UNSEATED recovery path)", async () => {
    const reservationId = await createReservation({ preferredArea: "Sushi", status: "Proposed", partySize: 1 });
    const res = await seat(reservationId, { commandId: "cmd-proposed", resources: [{ tableId: "sushi-bar-17" }] });
    expect(res.status).toBe(201);
    expect(res.body.status).toBe("Seated");
  });

  it("seating failure does not mutate the Reservation's lifecycle/status", async () => {
    const reservationId = await createReservation({ preferredArea: "Sushi", status: "Confirmed" });
    await prisma.table.update({ where: { id: "sushi-table-1" }, data: { status: "Inactive" } });
    try {
      const res = await seat(reservationId, { commandId: "cmd-failure-no-mutate", resources: [{ tableId: "sushi-table-1" }] });
      expect(res.status).toBe(409);
      const stored = await prisma.reservation.findUniqueOrThrow({ where: { id: reservationId } });
      expect(stored.status).toBe("Confirmed");
    } finally {
      await prisma.table.update({ where: { id: "sushi-table-1" }, data: { status: "Active" } });
    }
  });
});

describe("POST /reservations/:id/seating — idempotency", () => {
  it("retrying the same commandId does not create a duplicate SeatingAssignment or resource claim", async () => {
    const reservationId = await createReservation({ preferredArea: "Sushi", partySize: 1 });
    const first = await seat(reservationId, { commandId: "cmd-idempotent-1", resources: [{ tableId: "sushi-bar-18" }] });
    expect(first.status).toBe(201);

    const second = await seat(reservationId, { commandId: "cmd-idempotent-1", resources: [{ tableId: "sushi-bar-18" }] });
    expect(second.status).toBe(201);
    expect(second.body.assignmentId).toBe(first.body.assignmentId);

    const assignments = await prisma.seatingAssignment.findMany({ where: { reservationId } });
    expect(assignments.length).toBe(1);
    const resourceRows = await prisma.seatingAssignmentResource.findMany({ where: { assignmentId: first.body.assignmentId } });
    expect(resourceRows.length).toBe(1);
  });
});

describe("POST /reservations/:id/seating — existing assignment is not silently replaced (assign, not move)", () => {
  it("a reservation with an existing active assignment gets ALREADY_ASSIGNED_ELSEWHERE, and the original assignment/resource claim is untouched", async () => {
    const reservationId = await createReservation({ preferredArea: "Sushi", partySize: 1 });
    const first = await seat(reservationId, { commandId: "cmd-existing-1", resources: [{ tableId: "sushi-bar-19" }] });
    expect(first.status).toBe(201);

    const second = await seat(reservationId, { commandId: "cmd-existing-2", resources: [{ tableId: "sushi-bar-20" }] });
    expect(second.status).toBe(409);
    expect(second.body.type).toBe("ALREADY_ASSIGNED_ELSEWHERE");

    const originalAssignment = await prisma.seatingAssignment.findUniqueOrThrow({ where: { id: first.body.assignmentId } });
    expect(originalAssignment.status).toBe("Seated");
    const originalResource = await prisma.seatingAssignmentResource.findFirstOrThrow({ where: { assignmentId: first.body.assignmentId } });
    expect(originalResource.tableId).toBe("sushi-bar-19");

    const barTwentyClaim = await prisma.seatingAssignmentResource.findFirst({ where: { tableId: "sushi-bar-20" } });
    expect(barTwentyClaim).toBeNull();
  });
});

describe("POST /reservations/:id/seating — concurrency", () => {
  it("two overlapping reservations racing for the SAME table: only one physical claim succeeds, never two overlapping active claims", async () => {
    const reservationA = await createReservation({ preferredArea: "Sushi", reservationDate: RESERVATION_TIME });
    const reservationB = await createReservation({ preferredArea: "Sushi", reservationDate: RESERVATION_TIME });

    const [resA, resB] = await Promise.all([
      seat(reservationA, { commandId: "cmd-race-a", resources: [{ tableId: "sushi-table-2" }] }),
      seat(reservationB, { commandId: "cmd-race-b", resources: [{ tableId: "sushi-table-2" }] }),
    ]);

    const statuses = [resA.status, resB.status].sort();
    expect(statuses).toEqual([201, 409]);
    const winner = resA.status === 201 ? resA : resB;
    const loser = resA.status === 201 ? resB : resA;
    expect(winner.body.type).toBe("ASSIGNED");
    expect(loser.body.type).toBe("NOT_SEATABLE");
    expect(loser.body.seatability.type).toBe("RESOURCE_OVERLAP");

    const activeClaims = await prisma.seatingAssignmentResource.findMany({
      where: { tableId: "sushi-table-2", status: { in: ["Assigned", "Seated"] } },
    });
    expect(activeClaims.length).toBe(1);
  });
});

describe("POST /reservations/:id/seating — P1-B3 Walk-in CREATED_UNSEATED recovery", () => {
  it("a Walk-in that was created unseated can subsequently be seated through this endpoint", async () => {
    const walkin = await post(sharedAgent, "/availability/reservations/walk-in").send({
      commandId: "cmd-walkin-recovery",
      contactSelection: { displayName: "Walk-in Recovery Guest" },
      partySize: 2,
      preferredArea: "Sushi",
    });
    expect(walkin.status).toBe(201);
    expect(walkin.body.seating.status).toBe("Unseated");

    const seatRes = await seat(walkin.body.reservationId, { commandId: "cmd-walkin-recovery-seat", resources: [{ tableId: "sushi-table-3" }] });
    expect(seatRes.status).toBe(201);
    expect(seatRes.body.status).toBe("Seated");

    const stored = await prisma.reservation.findUniqueOrThrow({ where: { id: walkin.body.reservationId } });
    // Legacy tableAssignment is untouched by this endpoint.
    expect(stored.tableAssignment).toBeNull();
  });
});

describe("Ordinary reservation acceptance — unaffected by this increment", () => {
  it("POST /availability/reservations still succeeds exactly as before", async () => {
    const res = await post(sharedAgent, "/availability/reservations").send({
      commandId: "seatassign-ordinary-create-1",
      servicePeriodId: "sp-1",
      contactSelection: { type: "ExistingContact", contactId: "contact-1" },
      reservationDate: new Date("2026-08-22T18:00:00Z").toISOString(),
      partySize: 2,
      preferredArea: "Sushi",
      source: { category: "Telephone" },
    });
    expect(res.status).toBe(201);
  });
});
