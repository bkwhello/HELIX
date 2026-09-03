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
 * P1-B8 — HTTP-level coverage for POST/GET/DELETE /resource-blocks, which
 * compose the new, minimal ResourceBlockService directly. Own disjoint
 * fixture table ids ("sushi-table-9", "sushi-table-16", "teppanyaki-c")
 * so this file never collides with the other seating test files sharing
 * the same never-truncated floor inventory; ResourceBlock rows themselves
 * ARE truncated between tests (truncateSeatingDomainTables), so no
 * disjointness is needed there.
 */
const NOW = new Date("2026-08-20T17:30:00Z");
class FixedClock {
  now(): Date {
    return NOW;
  }
}
let idCounter = 0;
class SequentialIdGenerator {
  generate(): string {
    idCounter += 1;
    return `resblock-${idCounter}`;
  }
}
let eventIdCounter = 0;
class SequentialEventIdGenerator {
  generate(): string {
    eventIdCounter += 1;
    return `resblock-evt-${eventIdCounter}`;
  }
}

const prisma = createTestPrismaClient();
const OWNER_USERNAME = "owner-resource-block-test";
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
function del(agent: ReturnType<typeof request.agent>, url: string) {
  return agent.delete(url).set(CSRF_HEADER_NAME, "1");
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
    id: "staff-owner-resource-block-test",
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
});

const START = "2026-08-20T18:00:00.000Z";
const END = "2026-08-20T20:00:00.000Z";

/** SeatingAssignment.reservationId has a real FK to Reservation — a fixture assignment needs a real Reservation (and its Contact) row to exist first, same as tests/api/seating-no-show.test.ts's own createReservation() helper. */
async function createFixtureReservation(id: string): Promise<void> {
  await prisma.contact.upsert({
    where: { id: `${id}-contact` },
    create: { id: `${id}-contact`, displayName: "Resource Block Fixture Guest", phoneRaw: "0611110000", phoneNormalized: "+31611110000", createdBy: "staff-owner-resource-block-test", lastRelevantActivityAt: NOW },
    update: {},
  });
  await prisma.reservation.create({
    data: {
      id,
      servicePeriodId: "sp-resblock-fixture",
      contactId: `${id}-contact`,
      contactName: "Resource Block Fixture Guest",
      status: "Confirmed",
      reservationDate: new Date("2026-08-20T18:30:00.000Z"),
      partySize: 2,
      sourceCategory: "Telephone",
      preferredArea: "Sushi",
      createdBy: "staff-owner-resource-block-test",
      createdAt: NOW,
      updatedAt: NOW,
      version: 1,
    },
  });
}

describe("POST /resource-blocks — authentication and authorization", () => {
  it("missing authentication → 401", async () => {
    const res = await request(sharedApp)
      .post("/resource-blocks")
      .set(CSRF_HEADER_NAME, "1")
      .send({ operationalLabel: "Table 9", startTime: START, endTime: END });
    expect(res.status).toBe(401);
  });

  it("a role absent from the permission matrix gets 403 — exercises requirePermission(Permission.ResourceBlock) directly, since every currently-defined ActorRole with resource.block also has every other seating permission, matching this file family's established precedent", () => {
    const middleware = requirePermission(Permission.ResourceBlock);
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

  it("a role that DOES have SeatingAssign/SeatingMove but NOT ResourceBlock (e.g. Reception) gets 403 — proves ResourceBlock's own narrower Owner+Manager distribution is actually enforced by this route, not just defined in the policy matrix", () => {
    const middleware = requirePermission(Permission.ResourceBlock);
    const principal: StaffPrincipal = { staffUserId: "x", role: ActorRole.Reception, displayName: "x" };
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

describe("POST /resource-blocks — request validation", () => {
  it("missing operationalLabel → 400", async () => {
    const res = await post(sharedAgent, "/resource-blocks").send({ startTime: START, endTime: END });
    expect(res.status).toBe(400);
  });

  it("missing startTime/endTime → 400", async () => {
    const res = await post(sharedAgent, "/resource-blocks").send({ operationalLabel: "Table 9" });
    expect(res.status).toBe(400);
  });

  it("malformed startTime → 400", async () => {
    const res = await post(sharedAgent, "/resource-blocks").send({ operationalLabel: "Table 9", startTime: "not-a-date", endTime: END });
    expect(res.status).toBe(400);
  });

  it("startTime >= endTime → 400", async () => {
    const res = await post(sharedAgent, "/resource-blocks").send({ operationalLabel: "Table 9", startTime: END, endTime: START });
    expect(res.status).toBe(400);
  });

  it("unknown table label → 404 TABLE_NOT_FOUND", async () => {
    const res = await post(sharedAgent, "/resource-blocks").send({ operationalLabel: "Table 999", startTime: START, endTime: END });
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ type: "TABLE_NOT_FOUND" });
  });
});

describe("POST /resource-blocks — successful creation", () => {
  it("blocks a Sushi table by its operational label, storing createdBy from the authenticated actor", async () => {
    const res = await post(sharedAgent, "/resource-blocks").send({ operationalLabel: "Table 9", startTime: START, endTime: END, reason: "privé-evenement" });
    expect(res.status).toBe(201);
    expect(res.body.type).toBe("BLOCKED");
    expect(res.body.tableId).toBe("sushi-table-9");
    expect(res.body.tableOperationalLabel).toBe("Table 9");
    expect(res.body.reason).toBe("privé-evenement");

    const stored = await prisma.resourceBlock.findUniqueOrThrow({ where: { id: res.body.id } });
    expect(stored.tableId).toBe("sushi-table-9");
    expect(stored.createdBy).toBe("staff-owner-resource-block-test");
    expect(stored.startTime.toISOString()).toBe(START);
    expect(stored.endTime.toISOString()).toBe(END);
  });

  it("blocks a Teppanyaki grill Table the same way — blocks apply uniformly across areas", async () => {
    const res = await post(sharedAgent, "/resource-blocks").send({ operationalLabel: "C", startTime: START, endTime: END });
    expect(res.status).toBe(201);
    expect(res.body.tableId).toBe("teppanyaki-c");
  });

  it("an omitted/blank reason is stored as null, not an empty string", async () => {
    const res = await post(sharedAgent, "/resource-blocks").send({ operationalLabel: "Table 9", startTime: START, endTime: END, reason: "   " });
    expect(res.status).toBe(201);
    expect(res.body.reason).toBeNull();
  });
});

describe("POST /resource-blocks — active assignment conflict", () => {
  it("a table with an overlapping Assigned SeatingAssignmentResource → 409 ACTIVE_ASSIGNMENT_CONFLICT, and no block is created", async () => {
    await createFixtureReservation("resblock-fixture-res-1");
    const assignment = await prisma.seatingAssignment.create({
      data: {
        reservationId: "resblock-fixture-res-1",
        status: "Assigned",
        startTime: new Date("2026-08-20T18:30:00.000Z"),
        endTime: new Date("2026-08-20T20:30:00.000Z"),
        assignedBy: "staff-owner-resource-block-test",
        commandId: "resblock-fixture-cmd-1",
      },
    });
    await prisma.seatingAssignmentResource.create({
      data: {
        assignmentId: assignment.id,
        tableId: "sushi-table-9",
        status: "Assigned",
        startTime: new Date("2026-08-20T18:30:00.000Z"),
        endTime: new Date("2026-08-20T20:30:00.000Z"),
      },
    });

    const res = await post(sharedAgent, "/resource-blocks").send({ operationalLabel: "Table 9", startTime: START, endTime: END });
    expect(res.status).toBe(409);
    expect(res.body).toEqual({ type: "ACTIVE_ASSIGNMENT_CONFLICT" });

    const count = await prisma.resourceBlock.count({ where: { tableId: "sushi-table-9" } });
    expect(count).toBe(0);
  });

  it("a table with only a Released SeatingAssignmentResource in that interval → allowed (Released rows are not active claims)", async () => {
    await createFixtureReservation("resblock-fixture-res-2");
    const assignment = await prisma.seatingAssignment.create({
      data: {
        reservationId: "resblock-fixture-res-2",
        status: "Released",
        releaseReason: "GuestCancelled",
        releasedBy: "staff-owner-resource-block-test",
        releasedAt: NOW,
        startTime: new Date("2026-08-20T18:30:00.000Z"),
        endTime: new Date("2026-08-20T20:30:00.000Z"),
        assignedBy: "staff-owner-resource-block-test",
        commandId: "resblock-fixture-cmd-2",
      },
    });
    await prisma.seatingAssignmentResource.create({
      data: {
        assignmentId: assignment.id,
        tableId: "sushi-table-9",
        status: "Released",
        startTime: new Date("2026-08-20T18:30:00.000Z"),
        endTime: new Date("2026-08-20T20:30:00.000Z"),
      },
    });

    const res = await post(sharedAgent, "/resource-blocks").send({ operationalLabel: "Table 9", startTime: START, endTime: END });
    expect(res.status).toBe(201);
  });
});

describe("POST /resource-blocks — block-vs-block overlap conflict", () => {
  it("an overlapping existing ResourceBlock on the same table → 409 BLOCK_OVERLAP", async () => {
    const first = await post(sharedAgent, "/resource-blocks").send({ operationalLabel: "Table 9", startTime: START, endTime: END });
    expect(first.status).toBe(201);

    const second = await post(sharedAgent, "/resource-blocks").send({
      operationalLabel: "Table 9",
      startTime: "2026-08-20T19:00:00.000Z",
      endTime: "2026-08-20T21:00:00.000Z",
    });
    expect(second.status).toBe(409);
    expect(second.body).toEqual({ type: "BLOCK_OVERLAP" });

    const count = await prisma.resourceBlock.count({ where: { tableId: "sushi-table-9" } });
    expect(count).toBe(1);
  });

  it("a non-overlapping (adjacent) interval on the same table → allowed", async () => {
    const first = await post(sharedAgent, "/resource-blocks").send({ operationalLabel: "Table 9", startTime: START, endTime: END });
    expect(first.status).toBe(201);

    const second = await post(sharedAgent, "/resource-blocks").send({
      operationalLabel: "Table 9",
      startTime: END,
      endTime: "2026-08-20T22:00:00.000Z",
    });
    expect(second.status).toBe(201);

    const count = await prisma.resourceBlock.count({ where: { tableId: "sushi-table-9" } });
    expect(count).toBe(2);
  });
});

describe("GET /resource-blocks — authentication and authorization", () => {
  it("missing authentication → 401", async () => {
    const res = await request(sharedApp).get("/resource-blocks");
    expect(res.status).toBe(401);
  });

  it("a role absent from the permission matrix gets 403 — exercises requirePermission(Permission.SeatingView) directly", () => {
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
  });
});

describe("GET /resource-blocks — listing", () => {
  it("no blocks → 200 with an empty array", async () => {
    const res = await sharedAgent.get("/resource-blocks");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ blocks: [] });
  });

  it("lists a created block, enriched with the table's own operationalLabel and areaId", async () => {
    const created = await post(sharedAgent, "/resource-blocks").send({ operationalLabel: "Table 9", startTime: START, endTime: END, reason: "test" });
    expect(created.status).toBe(201);

    const res = await sharedAgent.get("/resource-blocks");
    expect(res.status).toBe(200);
    expect(res.body.blocks).toHaveLength(1);
    expect(res.body.blocks[0]).toMatchObject({
      id: created.body.id,
      tableId: "sushi-table-9",
      tableOperationalLabel: "Table 9",
      areaId: "Sushi",
      reason: "test",
    });
  });

  it("the area filter excludes blocks on tables in a different area", async () => {
    await post(sharedAgent, "/resource-blocks").send({ operationalLabel: "Table 9", startTime: START, endTime: END });
    await post(sharedAgent, "/resource-blocks").send({ operationalLabel: "C", startTime: START, endTime: END });

    const res = await sharedAgent.get("/resource-blocks?area=Sushi");
    expect(res.status).toBe(200);
    expect(res.body.blocks).toHaveLength(1);
    expect(res.body.blocks[0].tableId).toBe("sushi-table-9");
  });
});

describe("DELETE /resource-blocks/:id — authentication and authorization", () => {
  it("missing authentication → 401", async () => {
    const res = await request(sharedApp).delete("/resource-blocks/does-not-exist").set(CSRF_HEADER_NAME, "1");
    expect(res.status).toBe(401);
  });

  it("a role absent from the permission matrix gets 403 — exercises requirePermission(Permission.ResourceBlock) directly", () => {
    const middleware = requirePermission(Permission.ResourceBlock);
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

describe("DELETE /resource-blocks/:id — unblock", () => {
  it("deletes an existing block → 204, and it no longer appears in GET /resource-blocks", async () => {
    const created = await post(sharedAgent, "/resource-blocks").send({ operationalLabel: "Table 9", startTime: START, endTime: END });
    expect(created.status).toBe(201);

    const res = await del(sharedAgent, `/resource-blocks/${created.body.id}`);
    expect(res.status).toBe(204);

    const stored = await prisma.resourceBlock.findUnique({ where: { id: created.body.id } });
    expect(stored).toBeNull();

    const list = await sharedAgent.get("/resource-blocks");
    expect(list.body.blocks).toHaveLength(0);
  });

  it("an unknown or already-deleted id → 204, not 404 — idempotent, matching DELETE /closing-days/:id's own convention", async () => {
    const res = await del(sharedAgent, "/resource-blocks/does-not-exist");
    expect(res.status).toBe(204);
  });

  it("deleting a block frees the table for a new, overlapping block", async () => {
    const created = await post(sharedAgent, "/resource-blocks").send({ operationalLabel: "Table 16", startTime: START, endTime: END });
    expect(created.status).toBe(201);
    await del(sharedAgent, `/resource-blocks/${created.body.id}`);

    const second = await post(sharedAgent, "/resource-blocks").send({ operationalLabel: "Table 16", startTime: START, endTime: END });
    expect(second.status).toBe(201);
  });
});

describe("Ordinary seating and reservation flows — unaffected by this increment", () => {
  it("POST /reservations/:id/seating still succeeds against a table with no block", async () => {
    await prisma.contact.create({
      data: { id: "resblock-contact-1", displayName: "Resource Block Test Guest", phoneRaw: "0611111111", phoneNormalized: "+31611111111", createdBy: "staff-owner-resource-block-test", lastRelevantActivityAt: NOW },
    });
    await prisma.reservation.create({
      data: {
        id: "resblock-res-unaffected-1",
        servicePeriodId: "sp-resblock",
        contactId: "resblock-contact-1",
        contactName: "Resource Block Test Guest",
        status: "Confirmed",
        reservationDate: new Date("2026-08-20T18:00:00.000Z"),
        partySize: 2,
        sourceCategory: "Telephone",
        preferredArea: "Sushi",
        createdBy: "staff-owner-resource-block-test",
        createdAt: NOW,
        updatedAt: NOW,
        version: 1,
      },
    });

    const res = await post(sharedAgent, "/reservations/resblock-res-unaffected-1/seating").send({
      commandId: "resblock-assign-cmd-1",
      resources: [{ tableId: "sushi-table-11" }],
    });
    expect(res.status).toBe(201);
  });

  it("a block on a DIFFERENT table does not affect assigning this one", async () => {
    await post(sharedAgent, "/resource-blocks").send({ operationalLabel: "Table 12", startTime: START, endTime: END });

    await prisma.contact.create({
      data: { id: "resblock-contact-2", displayName: "Resource Block Test Guest 2", phoneRaw: "0611111112", phoneNormalized: "+31611111112", createdBy: "staff-owner-resource-block-test", lastRelevantActivityAt: NOW },
    });
    await prisma.reservation.create({
      data: {
        id: "resblock-res-unaffected-2",
        servicePeriodId: "sp-resblock",
        contactId: "resblock-contact-2",
        contactName: "Resource Block Test Guest 2",
        status: "Confirmed",
        reservationDate: new Date("2026-08-20T18:00:00.000Z"),
        partySize: 2,
        sourceCategory: "Telephone",
        preferredArea: "Sushi",
        createdBy: "staff-owner-resource-block-test",
        createdAt: NOW,
        updatedAt: NOW,
        version: 1,
      },
    });

    const res = await post(sharedAgent, "/reservations/resblock-res-unaffected-2/seating").send({
      commandId: "resblock-assign-cmd-2",
      resources: [{ tableId: "sushi-table-13" }],
    });
    expect(res.status).toBe(201);
  });
});

/**
 * P1-B8 verification-gap closure (Chief Engineer review after the initial
 * STOP-gate report). Same established idiom as
 * tests/api/seating-assignment.test.ts's own "POST /reservations/:id/seating
 * — concurrency" block: two concurrent HTTP requests through the SAME
 * shared Express app/agent, awaited via Promise.all. This IS genuine
 * concurrency, not simulated — each request handler opens its own
 * prisma.$transaction() (its own physical PostgreSQL connection/session
 * from the pool), and Node's event loop interleaves the two handlers
 * across their awaited I/O, exactly as it would for two real concurrent
 * staff actions. pg_advisory_xact_lock is scoped per session, not per
 * PrismaClient instance, so it correctly serializes these two sessions
 * regardless of both originating from the same shared `prisma` object —
 * a second, separate PrismaClient (the pattern
 * tests/integration/floor-seating-concurrency.test.ts uses to simulate two
 * separate application processes) is not needed to prove this at the HTTP
 * layer.
 */
describe("Concurrency — two simultaneous overlapping block creations on the same table", () => {
  it("exactly one persists; the other returns 409 BLOCK_OVERLAP", async () => {
    const [a, b] = await Promise.all([
      post(sharedAgent, "/resource-blocks").send({ operationalLabel: "Table 15", startTime: START, endTime: END }),
      post(sharedAgent, "/resource-blocks").send({ operationalLabel: "Table 15", startTime: "2026-08-20T19:00:00.000Z", endTime: "2026-08-20T21:00:00.000Z" }),
    ]);

    const statuses = [a.status, b.status].sort();
    expect(statuses).toEqual([201, 409]);
    const types = [a.body.type, b.body.type].sort();
    expect(types).toEqual(["BLOCKED", "BLOCK_OVERLAP"]);

    // Final persisted state, not just the response outcomes.
    const rows = await prisma.resourceBlock.findMany({ where: { tableId: "sushi-table-15" } });
    expect(rows).toHaveLength(1);
  });

  it("5 iterations, 0 integrity flakes — exactly one persisted block every time", async () => {
    for (let i = 0; i < 5; i += 1) {
      await truncateSeatingDomainTables(prisma);
      await resetDatabase(prisma);

      const [a, b] = await Promise.all([
        post(sharedAgent, "/resource-blocks").send({ operationalLabel: "Table 16", startTime: START, endTime: END }),
        post(sharedAgent, "/resource-blocks").send({ operationalLabel: "Table 16", startTime: "2026-08-20T19:00:00.000Z", endTime: "2026-08-20T21:00:00.000Z" }),
      ]);
      const statuses = [a.status, b.status].sort();
      expect(statuses, `iteration ${i}`).toEqual([201, 409]);

      const count = await prisma.resourceBlock.count({ where: { tableId: "sushi-table-16" } });
      expect(count, `iteration ${i}: exactly one persisted block`).toBe(1);
    }
  });
});

describe("Concurrency — block creation racing a seating assignment on the same table", () => {
  async function createRaceReservation(id: string): Promise<void> {
    await prisma.contact.upsert({
      where: { id: `${id}-contact` },
      create: { id: `${id}-contact`, displayName: "Resource Block Race Guest", phoneRaw: "0611117777", phoneNormalized: "+31611117777", createdBy: "staff-owner-resource-block-test", lastRelevantActivityAt: NOW },
      update: {},
    });
    await prisma.reservation.create({
      data: {
        id,
        servicePeriodId: "sp-resblock-race",
        contactId: `${id}-contact`,
        contactName: "Resource Block Race Guest",
        status: "Confirmed",
        reservationDate: new Date(START),
        partySize: 2,
        sourceCategory: "Telephone",
        preferredArea: "Sushi",
        createdBy: "staff-owner-resource-block-test",
        createdAt: NOW,
        updatedAt: NOW,
        version: 1,
      },
    });
  }

  it("the shared per-Table advisory lock preserves the invariant: an active claim and an overlapping block never both exist after completion", async () => {
    await createRaceReservation("resblock-race-res-1");

    const [blockRes, assignRes] = await Promise.all([
      post(sharedAgent, "/resource-blocks").send({ operationalLabel: "Table 15", startTime: START, endTime: END }),
      post(sharedAgent, "/reservations/resblock-race-res-1/seating").send({ commandId: "resblock-race-cmd-1", resources: [{ tableId: "sushi-table-15" }] }),
    ]);

    const blockCount = await prisma.resourceBlock.count({ where: { tableId: "sushi-table-15" } });
    const activeClaimCount = await prisma.seatingAssignmentResource.count({ where: { tableId: "sushi-table-15", status: { in: ["Assigned", "Seated"] } } });

    // Exactly one of the two persists after completion — never both, never neither.
    expect(blockCount + activeClaimCount).toBe(1);

    if (blockRes.status === 201) {
      expect(blockRes.body.type).toBe("BLOCKED");
      expect(blockCount).toBe(1);
      expect(activeClaimCount).toBe(0);
      expect(assignRes.status).toBe(409);
      expect(assignRes.body.type).toBe("NOT_SEATABLE");
      expect(assignRes.body.seatability.type).toBe("RESOURCE_BLOCKED");
    } else {
      expect(blockRes.status).toBe(409);
      expect(blockRes.body.type).toBe("ACTIVE_ASSIGNMENT_CONFLICT");
      expect(assignRes.status).toBe(201);
      expect(assignRes.body.type).toBe("ASSIGNED");
      expect(activeClaimCount).toBe(1);
      expect(blockCount).toBe(0);
    }
  });

  it("5 iterations, 0 integrity flakes — the invariant holds every time, whichever side wins", async () => {
    for (let i = 0; i < 5; i += 1) {
      await truncateSeatingDomainTables(prisma);
      await resetDatabase(prisma);
      const reservationId = `resblock-race-rep-res-${i}`;
      await createRaceReservation(reservationId);

      const [blockRes, assignRes] = await Promise.all([
        post(sharedAgent, "/resource-blocks").send({ operationalLabel: "Table 15", startTime: START, endTime: END }),
        post(sharedAgent, `/reservations/${reservationId}/seating`).send({ commandId: `resblock-race-rep-cmd-${i}`, resources: [{ tableId: "sushi-table-15" }] }),
      ]);

      const blockCount = await prisma.resourceBlock.count({ where: { tableId: "sushi-table-15" } });
      const activeClaimCount = await prisma.seatingAssignmentResource.count({ where: { tableId: "sushi-table-15", status: { in: ["Assigned", "Seated"] } } });
      expect(blockCount + activeClaimCount, `iteration ${i}: exactly one of block/active-claim persists`).toBe(1);

      const oneSucceeded = blockRes.status === 201 || assignRes.status === 201;
      const oneFailed = blockRes.status === 409 || assignRes.status === 409;
      expect(oneSucceeded, `iteration ${i}: one side must succeed`).toBe(true);
      expect(oneFailed, `iteration ${i}: the other side must be refused`).toBe(true);
    }
  });
});

/**
 * B4-A/B7 propagation proof — a P1-B8 block, created and removed only
 * through this phase's own application/API path (ResourceBlockService via
 * POST/DELETE /resource-blocks), must be reflected by the ALREADY-EXISTING,
 * unmodified B4-A availability read (SeatingAvailabilityService, via
 * GET /reservations/:id/seating/available-resources) — proving the two
 * capabilities are correctly wired together end to end, not merely that
 * each independently calls the same FloorRepository methods.
 */
describe("B4-A availability propagation — Teppanyaki", () => {
  it("a P1-B8 block on grill C excludes every C-xx seat from B4-A availability; deleting it restores all 10", async () => {
    await prisma.contact.create({
      data: { id: "resblock-teppanyaki-contact", displayName: "Resource Block Teppanyaki Guest", phoneRaw: "0611116666", phoneNormalized: "+31611116666", createdBy: "staff-owner-resource-block-test", lastRelevantActivityAt: NOW },
    });
    await prisma.reservation.create({
      data: {
        id: "resblock-teppanyaki-res-1",
        servicePeriodId: "sp-resblock-teppanyaki",
        contactId: "resblock-teppanyaki-contact",
        contactName: "Resource Block Teppanyaki Guest",
        status: "Confirmed",
        reservationDate: new Date(START),
        partySize: 2,
        sourceCategory: "Telephone",
        preferredArea: "Teppanyaki",
        createdBy: "staff-owner-resource-block-test",
        createdAt: NOW,
        updatedAt: NOW,
        version: 1,
      },
    });

    const before = await sharedAgent.get("/reservations/resblock-teppanyaki-res-1/seating/available-resources");
    expect(before.status).toBe(200);
    expect(before.body.availableResources.filter((r: { parentTable?: { id: string } }) => r.parentTable?.id === "teppanyaki-c")).toHaveLength(10);

    const blockRes = await post(sharedAgent, "/resource-blocks").send({ operationalLabel: "C", startTime: START, endTime: END });
    expect(blockRes.status).toBe(201);

    const during = await sharedAgent.get("/reservations/resblock-teppanyaki-res-1/seating/available-resources");
    expect(during.status).toBe(200);
    expect(during.body.availableResources.filter((r: { parentTable?: { id: string } }) => r.parentTable?.id === "teppanyaki-c")).toHaveLength(0);
    // Grills D/E/F are untouched by C's block.
    expect(during.body.availableResources.filter((r: { parentTable?: { id: string } }) => r.parentTable?.id === "teppanyaki-d")).toHaveLength(10);

    const del1 = await del(sharedAgent, `/resource-blocks/${blockRes.body.id}`);
    expect(del1.status).toBe(204);

    const after = await sharedAgent.get("/reservations/resblock-teppanyaki-res-1/seating/available-resources");
    expect(after.status).toBe(200);
    expect(after.body.availableResources.filter((r: { parentTable?: { id: string } }) => r.parentTable?.id === "teppanyaki-c")).toHaveLength(10);
  });
});

describe("B4-A availability propagation — Sushi", () => {
  it("a P1-B8 block on a Sushi table excludes it from B4-A availability; deleting it restores it", async () => {
    await prisma.contact.create({
      data: { id: "resblock-sushi-contact", displayName: "Resource Block Sushi Guest", phoneRaw: "0611115555", phoneNormalized: "+31611115555", createdBy: "staff-owner-resource-block-test", lastRelevantActivityAt: NOW },
    });
    await prisma.reservation.create({
      data: {
        id: "resblock-sushi-res-1",
        servicePeriodId: "sp-resblock-sushi",
        contactId: "resblock-sushi-contact",
        contactName: "Resource Block Sushi Guest",
        status: "Confirmed",
        reservationDate: new Date(START),
        partySize: 2,
        sourceCategory: "Telephone",
        preferredArea: "Sushi",
        createdBy: "staff-owner-resource-block-test",
        createdAt: NOW,
        updatedAt: NOW,
        version: 1,
      },
    });

    const before = await sharedAgent.get("/reservations/resblock-sushi-res-1/seating/available-resources");
    expect(before.status).toBe(200);
    expect(before.body.availableResources.some((r: { resourceId: string }) => r.resourceId === "sushi-table-8")).toBe(true);

    const blockRes = await post(sharedAgent, "/resource-blocks").send({ operationalLabel: "Table 8", startTime: START, endTime: END });
    expect(blockRes.status).toBe(201);

    const during = await sharedAgent.get("/reservations/resblock-sushi-res-1/seating/available-resources");
    expect(during.status).toBe(200);
    expect(during.body.availableResources.some((r: { resourceId: string }) => r.resourceId === "sushi-table-8")).toBe(false);
    // A different, unblocked table is unaffected.
    expect(during.body.availableResources.some((r: { resourceId: string }) => r.resourceId === "sushi-table-9")).toBe(true);

    const del1 = await del(sharedAgent, `/resource-blocks/${blockRes.body.id}`);
    expect(del1.status).toBe(204);

    const after = await sharedAgent.get("/reservations/resblock-sushi-res-1/seating/available-resources");
    expect(after.status).toBe(200);
    expect(after.body.availableResources.some((r: { resourceId: string }) => r.resourceId === "sushi-table-8")).toBe(true);
  });
});
