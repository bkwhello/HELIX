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
 * P1-B7 — HTTP-level coverage for GET /floor, which composes the
 * existing, unmodified FloorReadModel.getFloorView() directly. Pure
 * read: no writes, no orchestrator involved. Own disjoint fixture
 * reservation ids so this file never collides with the other seating
 * test files sharing the same never-truncated floor inventory.
 */
const NOW = new Date("2026-08-20T18:30:00Z");
class FixedClock {
  now(): Date {
    return NOW;
  }
}
let idCounter = 0;
class SequentialIdGenerator {
  generate(): string {
    idCounter += 1;
    return `floorview-${idCounter}`;
  }
}
let eventIdCounter = 0;
class SequentialEventIdGenerator {
  generate(): string {
    eventIdCounter += 1;
    return `floorview-evt-${eventIdCounter}`;
  }
}

const prisma = createTestPrismaClient();
const OWNER_USERNAME = "owner-floor-view-test";
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
  const id = `floorview-res-${resCounter}`;
  await prisma.reservation.create({
    data: {
      id,
      servicePeriodId: "sp-floorview",
      contactId: "contact-1",
      contactName: "Floor View Test Guest",
      status: overrides.status ?? "Confirmed",
      reservationDate: overrides.reservationDate ?? NOW,
      partySize: overrides.partySize ?? 2,
      sourceCategory: "Telephone",
      preferredArea: overrides.preferredArea ?? "Sushi",
      createdBy: "staff-owner-floor-view-test",
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
    id: "staff-owner-floor-view-test",
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
    data: { id: "contact-1", displayName: "Floor View Test Guest", phoneRaw: "0611111111", phoneNormalized: "+31611111111", createdBy: "staff-owner-floor-view-test", lastRelevantActivityAt: NOW },
  });
});

function getFloor(query: string) {
  return sharedAgent.get(`/floor${query}`);
}

describe("GET /floor — authentication and authorization", () => {
  it("missing authentication → 401", async () => {
    const res = await request(sharedApp).get("/floor?date=2026-08-20");
    expect(res.status).toBe(401);
  });

  it(
    "a role absent from the permission matrix gets 403 — same established precedent as the other seating test files: every currently-defined " +
      "ActorRole already includes seating.view, so this exercises requirePermission(Permission.SeatingView) directly.",
    () => {
      const middleware = requirePermission(Permission.SeatingView);
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

describe("GET /floor — date handling", () => {
  it("missing date → 400 (deliberately stricter than GET /reservations' default-to-today)", async () => {
    const res = await getFloor("");
    expect(res.status).toBe(400);
  });

  it("malformed date → 400", async () => {
    const res = await getFloor("?date=not-a-date");
    expect(res.status).toBe(400);
  });

  it("a valid date with no reservations → 200 with an empty array", async () => {
    const res = await getFloor("?date=2026-01-01");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ rows: [] });
  });

  it("correct local-day range derivation — a reservation on an adjacent day is excluded", async () => {
    await createReservation({ reservationDate: new Date("2026-08-19T18:00:00Z") });
    await createReservation({ reservationDate: new Date("2026-08-21T18:00:00Z") });
    const onTarget = await createReservation({ reservationDate: new Date("2026-08-20T12:00:00Z") });

    const res = await getFloor("?date=2026-08-20");
    expect(res.status).toBe(200);
    expect(res.body.rows.map((r: { reservationId: string }) => r.reservationId)).toEqual([onTarget]);
  });
});

describe("GET /floor — optional area filter", () => {
  it("forwards the area filter to getFloorView, excluding the other area", async () => {
    const sushiId = await createReservation({ preferredArea: "Sushi", reservationDate: new Date("2026-08-20T12:00:00Z") });
    await createReservation({ preferredArea: "Teppanyaki", reservationDate: new Date("2026-08-20T12:00:00Z") });

    const res = await getFloor("?date=2026-08-20&area=Sushi");
    expect(res.status).toBe(200);
    expect(res.body.rows.map((r: { reservationId: string }) => r.reservationId)).toEqual([sushiId]);
  });
});

describe("GET /floor — lateArrivalRiskFlag (unmodified getFloorView logic)", () => {
  it("a reservation 25 minutes past its time with no active assignment → flag true", async () => {
    const reservationId = await createReservation({ reservationDate: new Date(NOW.getTime() - 25 * 60_000) });
    const res = await getFloor("?date=2026-08-20");
    expect(res.status).toBe(200);
    const row = res.body.rows.find((r: { reservationId: string }) => r.reservationId === reservationId);
    expect(row.lateArrivalRiskFlag).toBe(true);
    expect(row.assignmentStatus).toBe("Unassigned");
  });

  it("a reservation only 5 minutes past its time (within the 20-minute threshold) → flag false", async () => {
    const reservationId = await createReservation({ reservationDate: new Date(NOW.getTime() - 5 * 60_000) });
    const res = await getFloor("?date=2026-08-20");
    const row = res.body.rows.find((r: { reservationId: string }) => r.reservationId === reservationId);
    expect(row.lateArrivalRiskFlag).toBe(false);
  });

  it("a reservation 25 minutes past its time but already Seated → flag false", async () => {
    const reservationDate = new Date(NOW.getTime() - 25 * 60_000);
    const reservationId = await createReservation({ reservationDate });
    await prisma.seatingAssignment.create({
      data: {
        reservationId,
        status: "Seated",
        seatedAt: NOW,
        startTime: reservationDate,
        endTime: new Date(reservationDate.getTime() + 90 * 60_000),
        assignedBy: "staff-owner-floor-view-test",
        commandId: `floorview-seated-${reservationId}`,
      },
    });

    const res = await getFloor("?date=2026-08-20");
    const row = res.body.rows.find((r: { reservationId: string }) => r.reservationId === reservationId);
    expect(row.lateArrivalRiskFlag).toBe(false);
    expect(row.assignmentStatus).toBe("Seated");
  });
});
