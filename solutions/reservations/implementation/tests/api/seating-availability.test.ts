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
 * P1-B4-A — HTTP-level coverage for
 * GET /reservations/:id/seating/available-resources.
 *
 * Real PostgreSQL, real floor seed (ops/floor/seedFloor.ts, same
 * mechanism tests/integration/floor-seating.test.ts already uses) — Table/
 * Seat rows are deliberately never truncated between tests (see
 * testDatabaseSafety.ts's own doc comment), so every test below shares
 * one seeded floor inventory; each test that needs a specific
 * block/overlap/inactive-resource scenario sets it up (and, for a
 * Table.status mutation specifically, restores it) itself rather than
 * relying on ordering. "Empty inventory" is deliberately NOT tested here
 * — see tests/application/seating-availability-service.test.ts's own doc
 * comment for why a real, shared, never-truncated floor database cannot
 * reliably demonstrate that case, and how it's covered instead.
 */
const NOW = new Date("2026-08-20T10:00:00Z");
class FixedClock {
  now(): Date {
    return NOW;
  }
}
let idCounter = 0;
class SequentialIdGenerator {
  generate(): string {
    idCounter += 1;
    return `avail-${idCounter}`;
  }
}
let eventIdCounter = 0;
class SequentialEventIdGenerator {
  generate(): string {
    eventIdCounter += 1;
    return `avail-evt-${eventIdCounter}`;
  }
}

const prisma = createTestPrismaClient();
const OWNER_USERNAME = "owner-seating-availability-test";
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
async function createReservation(overrides: { partySize?: number; preferredArea?: string; reservationDate?: Date } = {}): Promise<string> {
  resCounter += 1;
  const id = `avail-res-${resCounter}`;
  await prisma.reservation.create({
    data: {
      id,
      servicePeriodId: "sp-avail",
      contactId: "contact-1",
      contactName: "Availability Test Guest",
      status: "Confirmed",
      reservationDate: overrides.reservationDate ?? new Date("2026-08-20T18:00:00Z"),
      partySize: overrides.partySize ?? 2,
      sourceCategory: "Telephone",
      preferredArea: overrides.preferredArea,
      createdBy: "staff-owner-seating-availability-test",
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
    id: "staff-owner-seating-availability-test",
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
  // Seating assignments/blocks reset every test (also removes any
  // Assigned/Seated fixtures a prior test inserted); Table/Seat rows are
  // deliberately left alone (see this file's own header comment).
  await truncateSeatingDomainTables(prisma);
  await resetDatabase(prisma);
  await prisma.contact.create({
    data: { id: "contact-1", displayName: "Availability Test Guest", phoneRaw: "0611111111", phoneNormalized: "+31611111111", createdBy: "staff-owner-seating-availability-test", lastRelevantActivityAt: NOW },
  });
});

function get(url: string) {
  return sharedAgent.get(url);
}

describe("GET /reservations/:id/seating/available-resources — authentication and authorization", () => {
  it("missing authentication → 401", async () => {
    const reservationId = await createReservation({ preferredArea: "Sushi" });
    const res = await request(sharedApp).get(`/reservations/${reservationId}/seating/available-resources`);
    expect(res.status).toBe(401);
  });

  it(
    "a role absent from the permission matrix gets 403 — same established precedent as tests/api/walk-in.test.ts: every currently-defined " +
      "ActorRole already includes seating.view, so this exercises requirePermission(Permission.SeatingView) — the identical middleware " +
      "instance the route is mounted behind — directly, with a role that has no matrix entry.",
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

describe("GET /reservations/:id/seating/available-resources — reservation lookup", () => {
  it("unknown reservation → 404", async () => {
    const res = await get("/reservations/does-not-exist/seating/available-resources");
    expect(res.status).toBe(404);
  });
});

describe("GET /reservations/:id/seating/available-resources — Sushi", () => {
  it("returns Table resources with operational label and nominal capacity", async () => {
    const reservationId = await createReservation({ preferredArea: "Sushi", partySize: 2, reservationDate: new Date("2026-08-20T18:00:00Z") });
    const res = await get(`/reservations/${reservationId}/seating/available-resources`);
    expect(res.status).toBe(200);
    expect(res.body.type).toBe("FOUND");
    expect(res.body.area).toBe("Sushi");
    const table1 = res.body.availableResources.find((r: { resourceId: string }) => r.resourceId === "sushi-table-1");
    expect(table1).toMatchObject({ kind: "Table", operationalLabel: "Table 1", capacity: 4 });
    expect(table1.parentTable).toBeUndefined();
  });

  it("never includes Teppanyaki resources (wrong-area exclusion)", async () => {
    const reservationId = await createReservation({ preferredArea: "Sushi" });
    const res = await get(`/reservations/${reservationId}/seating/available-resources`);
    const teppanyakiIds = res.body.availableResources.filter((r: { resourceId: string }) => r.resourceId.startsWith("teppanyaki-"));
    expect(teppanyakiIds).toEqual([]);
  });
});

describe("GET /reservations/:id/seating/available-resources — Teppanyaki", () => {
  it("returns Seat resources with parent grill context (e.g. C-01 under grill C)", async () => {
    const reservationId = await createReservation({ preferredArea: "Teppanyaki", partySize: 2, reservationDate: new Date("2026-08-20T18:00:00Z") });
    const res = await get(`/reservations/${reservationId}/seating/available-resources`);
    expect(res.status).toBe(200);
    expect(res.body.area).toBe("Teppanyaki");
    const seatC1 = res.body.availableResources.find((r: { resourceId: string }) => r.resourceId === "teppanyaki-c-seat-01");
    expect(seatC1).toMatchObject({
      kind: "Seat",
      operationalLabel: "C-01",
      capacity: 1,
      parentTable: { id: "teppanyaki-c", operationalLabel: "C" },
    });
    // No whole-Table Teppanyaki entries — grills are shared-seating, only individual seats are claimable.
    const wholeGrillEntries = res.body.availableResources.filter((r: { resourceId: string }) => r.resourceId === "teppanyaki-c");
    expect(wholeGrillEntries).toEqual([]);
  });
});

describe("GET /reservations/:id/seating/available-resources — exclusions", () => {
  it("excludes an inactive Table", async () => {
    await prisma.table.update({ where: { id: "sushi-table-2" }, data: { status: "Inactive" } });
    try {
      const reservationId = await createReservation({ preferredArea: "Sushi", reservationDate: new Date("2026-08-20T18:00:00Z") });
      const res = await get(`/reservations/${reservationId}/seating/available-resources`);
      expect(res.body.availableResources.some((r: { resourceId: string }) => r.resourceId === "sushi-table-2")).toBe(false);
    } finally {
      // Table rows are shared, never-truncated fixture state (see this
      // file's header comment) — must not leak Inactive into later tests.
      await prisma.table.update({ where: { id: "sushi-table-2" }, data: { status: "Active" } });
    }
  });

  it("excludes a Table with an overlapping ResourceBlock", async () => {
    const reservationDate = new Date("2026-08-20T18:00:00Z");
    await prisma.resourceBlock.create({
      data: { tableId: "sushi-table-3", startTime: new Date("2026-08-20T17:30:00Z"), endTime: new Date("2026-08-20T20:00:00Z"), reason: "test block", createdBy: "staff-owner-seating-availability-test" },
    });
    const reservationId = await createReservation({ preferredArea: "Sushi", reservationDate });
    const res = await get(`/reservations/${reservationId}/seating/available-resources`);
    expect(res.body.availableResources.some((r: { resourceId: string }) => r.resourceId === "sushi-table-3")).toBe(false);
  });

  it("excludes a Table with an overlapping ACTIVE seating claim (a different reservation)", async () => {
    const reservationDate = new Date("2026-08-20T18:00:00Z");
    const otherReservationId = await createReservation({ preferredArea: "Sushi", reservationDate: new Date("2026-08-20T18:30:00Z") });
    const assignment = await prisma.seatingAssignment.create({
      data: {
        reservationId: otherReservationId,
        status: "Assigned",
        startTime: new Date("2026-08-20T18:30:00Z"),
        endTime: new Date("2026-08-20T20:00:00Z"),
        assignedBy: "staff-owner-seating-availability-test",
        commandId: "avail-fixture-overlap-1",
      },
    });
    await prisma.seatingAssignmentResource.create({
      data: { assignmentId: assignment.id, tableId: "sushi-table-4", status: "Assigned", startTime: new Date("2026-08-20T18:30:00Z"), endTime: new Date("2026-08-20T20:00:00Z") },
    });

    const reservationId = await createReservation({ preferredArea: "Sushi", reservationDate });
    const res = await get(`/reservations/${reservationId}/seating/available-resources`);
    expect(res.body.availableResources.some((r: { resourceId: string }) => r.resourceId === "sushi-table-4")).toBe(false);
  });

  it("does NOT exclude a Table whose only claim does not overlap the requested interval", async () => {
    // Sushi duration is 90 minutes; a claim starting well after this
    // reservation's own interval ends (18:00-19:30) does not overlap it.
    const laterReservationId = await createReservation({ preferredArea: "Sushi", reservationDate: new Date("2026-08-20T21:00:00Z") });
    const assignment = await prisma.seatingAssignment.create({
      data: {
        reservationId: laterReservationId,
        status: "Assigned",
        startTime: new Date("2026-08-20T21:00:00Z"),
        endTime: new Date("2026-08-20T22:30:00Z"),
        assignedBy: "staff-owner-seating-availability-test",
        commandId: "avail-fixture-nonoverlap-1",
      },
    });
    await prisma.seatingAssignmentResource.create({
      data: { assignmentId: assignment.id, tableId: "sushi-table-5", status: "Assigned", startTime: new Date("2026-08-20T21:00:00Z"), endTime: new Date("2026-08-20T22:30:00Z") },
    });

    const reservationId = await createReservation({ preferredArea: "Sushi", reservationDate: new Date("2026-08-20T18:00:00Z") });
    const res = await get(`/reservations/${reservationId}/seating/available-resources`);
    expect(res.body.availableResources.some((r: { resourceId: string }) => r.resourceId === "sushi-table-5")).toBe(true);
  });
});

describe("GET /reservations/:id/seating/available-resources — authoritative values, never client-supplied", () => {
  it("uses the reservation's own area/party size/time, ignoring conflicting query-string values", async () => {
    const reservationId = await createReservation({ preferredArea: "Sushi", partySize: 3, reservationDate: new Date("2026-08-20T18:00:00Z") });
    const res = await get(`/reservations/${reservationId}/seating/available-resources?area=Teppanyaki&partySize=999&reservationDate=2030-01-01T00:00:00Z`);
    expect(res.status).toBe(200);
    expect(res.body.area).toBe("Sushi");
    expect(res.body.partySize).toBe(3);
    expect(new Date(res.body.intervalStart).toISOString()).toBe(new Date("2026-08-20T18:00:00Z").toISOString());
  });
});

describe("GET /reservations/:id/seating/available-resources — assignment state", () => {
  it("Unassigned when no active SeatingAssignment exists", async () => {
    const reservationId = await createReservation({ preferredArea: "Sushi" });
    const res = await get(`/reservations/${reservationId}/seating/available-resources`);
    expect(res.body.assignmentStatus).toBe("Unassigned");
  });

  it("Assigned when an Assigned SeatingAssignment exists for this reservation", async () => {
    const reservationId = await createReservation({ preferredArea: "Sushi", reservationDate: new Date("2026-08-20T18:00:00Z") });
    await prisma.seatingAssignment.create({
      data: { reservationId, status: "Assigned", startTime: new Date("2026-08-20T18:00:00Z"), endTime: new Date("2026-08-20T19:30:00Z"), assignedBy: "staff-owner-seating-availability-test", commandId: "avail-fixture-state-assigned" },
    });
    const res = await get(`/reservations/${reservationId}/seating/available-resources`);
    expect(res.body.assignmentStatus).toBe("Assigned");
  });

  it("Seated when a Seated SeatingAssignment exists for this reservation", async () => {
    const reservationId = await createReservation({ preferredArea: "Sushi", reservationDate: new Date("2026-08-20T18:00:00Z") });
    await prisma.seatingAssignment.create({
      data: { reservationId, status: "Seated", startTime: new Date("2026-08-20T18:00:00Z"), endTime: new Date("2026-08-20T19:30:00Z"), assignedBy: "staff-owner-seating-availability-test", seatedAt: NOW, commandId: "avail-fixture-state-seated" },
    });
    const res = await get(`/reservations/${reservationId}/seating/available-resources`);
    expect(res.body.assignmentStatus).toBe("Seated");
  });
});

describe("GET /reservations/:id/seating/available-resources — no writes, no side effects", () => {
  it("performs zero writes to any table (row counts unchanged before/after)", async () => {
    const reservationId = await createReservation({ preferredArea: "Sushi" });
    const before = {
      tables: await prisma.table.count(),
      seats: await prisma.seat.count(),
      assignments: await prisma.seatingAssignment.count(),
      blocks: await prisma.resourceBlock.count(),
      reservations: await prisma.reservation.count(),
    };
    const res = await get(`/reservations/${reservationId}/seating/available-resources`);
    expect(res.status).toBe(200);
    const after = {
      tables: await prisma.table.count(),
      seats: await prisma.seat.count(),
      assignments: await prisma.seatingAssignment.count(),
      blocks: await prisma.resourceBlock.count(),
      reservations: await prisma.reservation.count(),
    };
    expect(after).toEqual(before);
  });
});

describe("Ordinary reservation acceptance — unaffected by this increment", () => {
  it("POST /availability/reservations still succeeds exactly as before", async () => {
    const res = await post(sharedAgent, "/availability/reservations").send({
      commandId: "avail-ordinary-create-1",
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
