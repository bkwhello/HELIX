import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { Express } from "express";
import { createApp } from "../../api/app.js";
import { createTestPrismaClient, truncateStaffDomainTables } from "../integration/support/testDatabaseSafety.js";
import { PrismaReservationRepository } from "../../infrastructure/persistence/PrismaReservationRepository.js";
import { PrismaDuplicateReservationChecker } from "../../infrastructure/persistence/PrismaDuplicateReservationChecker.js";
import { PrismaClosingDayStore } from "../../infrastructure/persistence/PrismaClosingDayStore.js";
import { PrismaStaffUserRepository } from "../../infrastructure/persistence/PrismaStaffUserRepository.js";
import { PrismaSessionRepository } from "../../infrastructure/persistence/PrismaSessionRepository.js";
import { PrismaLoginAttemptTracker } from "../../infrastructure/persistence/PrismaLoginAttemptTracker.js";
import { ScryptPasswordHasher } from "../../infrastructure/ScryptPasswordHasher.js";
import { RandomSessionTokenGenerator } from "../../infrastructure/RandomSessionTokenGenerator.js";
import { RandomIdGenerator } from "../../infrastructure/RandomIdGenerator.js";
import { PrismaContactRepository } from "../../infrastructure/persistence/PrismaContactRepository.js";
import { PrismaTransactionManager } from "../../infrastructure/persistence/PrismaTransactionManager.js";
import { UnvalidatedServicePeriodReader } from "../../infrastructure/UnvalidatedServicePeriodReader.js";
import { PrismaFloorplanRepository } from "../../infrastructure/persistence/PrismaFloorplanRepository.js";
import { PrismaFloorRepository } from "../../infrastructure/persistence/PrismaFloorRepository.js";
import { CSRF_HEADER_NAME } from "../../api/authMiddleware.js";
import { ActorRole } from "../../domain/value-objects/Actor.js";

/**
 * R1.5-P2B (corrected) — HTTP-level coverage for the exact nine
 * `/floorplans*` / `/floorplan-versions*` routes. Mirrors
 * tests/api/service-sessions.test.ts's own isolation conventions
 * (RUN_ID-suffixed usernames, every fixture a uniquely-named Floorplan,
 * no shared/truncated state). The provisional nested paths this
 * increment originally shipped with are gone, not aliased — asserted
 * directly (404, not just "not the route I meant to test").
 */
const RUN_ID = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
const PASSWORD = "SuperSecret123!";
const prisma = createTestPrismaClient();

function buildApp(): Express {
  return createApp({
    repository: new PrismaReservationRepository(prisma),
    duplicateChecker: new PrismaDuplicateReservationChecker(prisma),
    contactRepository: new PrismaContactRepository(prisma),
    transactionManager: new PrismaTransactionManager(prisma),
    servicePeriodReader: new UnvalidatedServicePeriodReader(),
    closingDayStore: new PrismaClosingDayStore(prisma),
    idGenerator: new RandomIdGenerator(),
    eventIdGenerator: new RandomIdGenerator(),
    clock: { now: () => new Date() },
    floor: {
      floorRepository: new PrismaFloorRepository(prisma),
      prisma,
    },
    floorplans: {
      floorplanRepository: new PrismaFloorplanRepository(prisma),
      transactionManager: new PrismaTransactionManager(prisma),
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
}

function post(agent: ReturnType<typeof request.agent>, url: string) {
  return agent.post(url).set(CSRF_HEADER_NAME, "1");
}
function put(agent: ReturnType<typeof request.agent>, url: string) {
  return agent.put(url).set(CSRF_HEADER_NAME, "1");
}

let app: Express;
let staffUserRepository: PrismaStaffUserRepository;
let ownerAgent: ReturnType<typeof request.agent>;
let managerAgent: ReturnType<typeof request.agent>;
let receptionAgent: ReturnType<typeof request.agent>;

async function createStaffUser(usernameSuffix: string, role: ActorRole): Promise<{ id: string; username: string }> {
  const username = `fp-${usernameSuffix}-${RUN_ID}`;
  if (username.length > 32) throw new Error(`test fixture username "${username}" exceeds Username's 32-character limit.`);
  const passwordHasher = new ScryptPasswordHasher();
  const created = await staffUserRepository.create({
    id: `fp-id-${usernameSuffix}-${RUN_ID}`,
    username,
    displayName: username,
    email: null,
    passwordHash: await passwordHasher.hash(PASSWORD),
    role,
  });
  return { id: created.id, username: created.username };
}

async function loginAgent(username: string): Promise<ReturnType<typeof request.agent>> {
  const agent = request.agent(app);
  const res = await post(agent, "/auth/login").send({ username, password: PASSWORD });
  if (res.status !== 200) throw new Error(`test setup failed to log in as ${username}: ${res.status} ${JSON.stringify(res.body)}`);
  return agent;
}

let floorplanCounter = 0;
function nextFloorplanName(): string {
  floorplanCounter += 1;
  return `Test Floor ${RUN_ID}-${floorplanCounter}`;
}

async function createFloorplan(): Promise<string> {
  const res = await post(ownerAgent, "/floorplans").send({ name: nextFloorplanName() });
  return res.body.floorplan.id as string;
}
async function createDraftVersion(floorplanId: string): Promise<string> {
  const res = await post(ownerAgent, `/floorplans/${floorplanId}/versions`).send({});
  return res.body.version.id as string;
}

beforeAll(async () => {
  app = buildApp();
  await truncateStaffDomainTables(prisma);
  staffUserRepository = new PrismaStaffUserRepository(prisma);
  const owner = await createStaffUser("owner", ActorRole.Owner);
  const manager = await createStaffUser("manager", ActorRole.Manager);
  const reception = await createStaffUser("reception", ActorRole.Reception);
  ownerAgent = await loginAgent(owner.username);
  managerAgent = await loginAgent(manager.username);
  receptionAgent = await loginAgent(reception.username);
});
afterAll(async () => {
  await prisma.$disconnect();
});

describe("Removed provisional routes — no longer discoverable", () => {
  it("the old nested single-floorplan/single-version/member/publish/set-default/archive paths all 404", async () => {
    const floorplanId = await createFloorplan();
    const versionId = await createDraftVersion(floorplanId);
    expect((await ownerAgent.get(`/floorplans/${floorplanId}`)).status).toBe(404);
    expect((await ownerAgent.get(`/floorplans/${floorplanId}/versions/${versionId}`)).status).toBe(404);
    expect((await post(ownerAgent, `/floorplans/${floorplanId}/versions/${versionId}/members`)).status).toBe(404);
    expect((await post(ownerAgent, `/floorplans/${floorplanId}/versions/${versionId}/publish`)).status).toBe(404);
    expect((await post(ownerAgent, `/floorplans/${floorplanId}/versions/${versionId}/set-default`)).status).toBe(404);
    expect((await post(ownerAgent, `/floorplans/${floorplanId}/versions/${versionId}/archive`)).status).toBe(404);
  });
});

describe("1. GET /floorplans — authentication only, no specific permission", () => {
  it("no session -> 401", async () => {
    const res = await request(app).get("/floorplans");
    expect(res.status).toBe(401);
  });

  it("any authenticated role (including one without CapacitySettingsManage) -> 200", async () => {
    const res = await receptionAgent.get("/floorplans");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.floorplans)).toBe(true);
  });
});

describe("2. GET /floorplans/:id/versions", () => {
  it("no session -> 401", async () => {
    const res = await request(app).get("/floorplans/does-not-exist/versions");
    expect(res.status).toBe(401);
  });

  it("an unknown floorplan id -> 404", async () => {
    const res = await receptionAgent.get("/floorplans/does-not-exist/versions");
    expect(res.status).toBe(404);
  });

  it("lists versions for a real floorplan", async () => {
    const floorplanId = await createFloorplan();
    await createDraftVersion(floorplanId);
    const res = await receptionAgent.get(`/floorplans/${floorplanId}/versions`);
    expect(res.status).toBe(200);
    expect(res.body.versions).toHaveLength(1);
    expect(res.body.versions[0].revision).toBe(1);
  });
});

describe("3. GET /floorplan-versions/:id", () => {
  it("no session -> 401", async () => {
    const res = await request(app).get("/floorplan-versions/does-not-exist");
    expect(res.status).toBe(401);
  });

  it("an unknown version id -> 404", async () => {
    const res = await receptionAgent.get("/floorplan-versions/does-not-exist");
    expect(res.status).toBe(404);
  });

  it("returns the version and its membership tableIds in deterministic order", async () => {
    const floorplanId = await createFloorplan();
    const versionId = await createDraftVersion(floorplanId);
    await put(ownerAgent, `/floorplan-versions/${versionId}/resources`).send({ tableIds: ["sushi-table-2", "sushi-table-1"] });
    const res = await receptionAgent.get(`/floorplan-versions/${versionId}`);
    expect(res.status).toBe(200);
    expect(res.body.tableIds).toEqual(["sushi-table-1", "sushi-table-2"]);
  });
});

describe("4. POST /floorplans — Permission.CapacitySettingsManage required", () => {
  it("no session -> 401", async () => {
    const res = await request(app).post("/floorplans").set(CSRF_HEADER_NAME, "1").send({ name: nextFloorplanName() });
    expect(res.status).toBe(401);
  });

  it("Reception (no CapacitySettingsManage) -> 403", async () => {
    const res = await post(receptionAgent, "/floorplans").send({ name: nextFloorplanName() });
    expect(res.status).toBe(403);
  });

  it("Manager (has CapacitySettingsManage) -> 201 CREATED", async () => {
    const res = await post(managerAgent, "/floorplans").send({ name: nextFloorplanName() });
    expect(res.status).toBe(201);
    expect(res.body.type).toBe("CREATED");
    expect(res.body.floorplan.defaultVersionId).toBeNull();
  });

  it("Owner (has CapacitySettingsManage) -> 201 CREATED", async () => {
    const res = await post(ownerAgent, "/floorplans").send({ name: nextFloorplanName() });
    expect(res.status).toBe(201);
  });

  it.each(["", "   "])("a blank name (%j) -> 400", async (name) => {
    const res = await post(ownerAgent, "/floorplans").send({ name });
    expect(res.status).toBe(400);
  });
});

describe("5. POST /floorplans/:id/versions — Permission.CapacitySettingsManage required", () => {
  it("Reception (no CapacitySettingsManage) -> 403", async () => {
    const floorplanId = await createFloorplan();
    const res = await post(receptionAgent, `/floorplans/${floorplanId}/versions`);
    expect(res.status).toBe(403);
  });

  it("Owner -> 201 CREATED at revision 1", async () => {
    const floorplanId = await createFloorplan();
    const res = await post(ownerAgent, `/floorplans/${floorplanId}/versions`).send({});
    expect(res.status).toBe(201);
    expect(res.body.version.status).toBe("Draft");
    expect(res.body.version.revision).toBe(1);
  });

  it("an unknown floorplan id -> 404", async () => {
    const res = await post(ownerAgent, "/floorplans/does-not-exist/versions");
    expect(res.status).toBe(404);
  });
});

describe("6. PUT /floorplan-versions/:id/resources — full membership replace, Permission.CapacitySettingsManage required", () => {
  it("Reception (no CapacitySettingsManage) -> 403", async () => {
    const floorplanId = await createFloorplan();
    const versionId = await createDraftVersion(floorplanId);
    const res = await put(receptionAgent, `/floorplan-versions/${versionId}/resources`).send({ tableIds: ["sushi-table-1"] });
    expect(res.status).toBe(403);
  });

  it("a non-array tableIds -> 422", async () => {
    const floorplanId = await createFloorplan();
    const versionId = await createDraftVersion(floorplanId);
    const res = await put(ownerAgent, `/floorplan-versions/${versionId}/resources`).send({ tableIds: "sushi-table-1" });
    expect(res.status).toBe(422);
  });

  it("an array containing a non-string element -> 422", async () => {
    const floorplanId = await createFloorplan();
    const versionId = await createDraftVersion(floorplanId);
    const res = await put(ownerAgent, `/floorplan-versions/${versionId}/resources`).send({ tableIds: ["sushi-table-1", 42] });
    expect(res.status).toBe(422);
  });

  it("a missing tableIds field -> 422", async () => {
    const floorplanId = await createFloorplan();
    const versionId = await createDraftVersion(floorplanId);
    const res = await put(ownerAgent, `/floorplan-versions/${versionId}/resources`).send({});
    expect(res.status).toBe(422);
  });

  it("an unknown version id -> 404", async () => {
    const res = await put(ownerAgent, "/floorplan-versions/does-not-exist/resources").send({ tableIds: [] });
    expect(res.status).toBe(404);
  });

  it("an unknown Table id -> 422 UNKNOWN_TABLE_IDS, zero membership change", async () => {
    const floorplanId = await createFloorplan();
    const versionId = await createDraftVersion(floorplanId);
    await put(ownerAgent, `/floorplan-versions/${versionId}/resources`).send({ tableIds: ["sushi-table-1"] });
    const res = await put(ownerAgent, `/floorplan-versions/${versionId}/resources`).send({ tableIds: ["does-not-exist"] });
    expect(res.status).toBe(422);
    expect(res.body.type).toBe("UNKNOWN_TABLE_IDS");
    const readBack = await ownerAgent.get(`/floorplan-versions/${versionId}`);
    expect(readBack.body.tableIds).toEqual(["sushi-table-1"]);
  });

  it("duplicate ids normalize to one row, returned in deterministic order", async () => {
    const floorplanId = await createFloorplan();
    const versionId = await createDraftVersion(floorplanId);
    const res = await put(ownerAgent, `/floorplan-versions/${versionId}/resources`).send({ tableIds: ["sushi-table-3", "sushi-table-2", "sushi-table-3"] });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ type: "REPLACED", tableIds: ["sushi-table-2", "sushi-table-3"] });
  });

  it("replacing on a Published version -> 409 VERSION_NOT_DRAFT", async () => {
    const floorplanId = await createFloorplan();
    const versionId = await createDraftVersion(floorplanId);
    await put(ownerAgent, `/floorplan-versions/${versionId}/resources`).send({ tableIds: ["sushi-table-4"] });
    await post(ownerAgent, `/floorplan-versions/${versionId}/publish`);
    const res = await put(ownerAgent, `/floorplan-versions/${versionId}/resources`).send({ tableIds: ["sushi-table-5"] });
    expect(res.status).toBe(409);
    expect(res.body).toEqual({ type: "VERSION_NOT_DRAFT", currentStatus: "Published" });
  });

  it("an empty array is accepted for a Draft and clears membership", async () => {
    const floorplanId = await createFloorplan();
    const versionId = await createDraftVersion(floorplanId);
    await put(ownerAgent, `/floorplan-versions/${versionId}/resources`).send({ tableIds: ["sushi-table-6"] });
    const res = await put(ownerAgent, `/floorplan-versions/${versionId}/resources`).send({ tableIds: [] });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ type: "REPLACED", tableIds: [] });
  });
});

describe("7. POST /floorplan-versions/:id/publish — Permission.CapacitySettingsManage required", () => {
  it("Reception (no CapacitySettingsManage) -> 403", async () => {
    const floorplanId = await createFloorplan();
    const versionId = await createDraftVersion(floorplanId);
    const res = await post(receptionAgent, `/floorplan-versions/${versionId}/publish`);
    expect(res.status).toBe(403);
  });

  it("publishing a Draft with no members -> 409 NO_MEMBERS", async () => {
    const floorplanId = await createFloorplan();
    const versionId = await createDraftVersion(floorplanId);
    const res = await post(ownerAgent, `/floorplan-versions/${versionId}/publish`);
    expect(res.status).toBe(409);
    expect(res.body).toEqual({ type: "NO_MEMBERS" });
  });

  it("publishing a Draft with at least one member -> 200 PUBLISHED", async () => {
    const floorplanId = await createFloorplan();
    const versionId = await createDraftVersion(floorplanId);
    await put(ownerAgent, `/floorplan-versions/${versionId}/resources`).send({ tableIds: ["sushi-table-7"] });
    const res = await post(ownerAgent, `/floorplan-versions/${versionId}/publish`);
    expect(res.status).toBe(200);
    expect(res.body.type).toBe("PUBLISHED");
  });

  it("an unknown version id -> 404", async () => {
    const res = await post(ownerAgent, "/floorplan-versions/does-not-exist/publish");
    expect(res.status).toBe(404);
  });
});

describe("8. POST /floorplans/:id/default-version — Permission.CapacitySettingsManage required, body { versionId }", () => {
  it("Reception (no CapacitySettingsManage) -> 403", async () => {
    const floorplanId = await createFloorplan();
    const res = await post(receptionAgent, `/floorplans/${floorplanId}/default-version`).send({ versionId: "x" });
    expect(res.status).toBe(403);
  });

  it("a missing versionId body field -> 400", async () => {
    const floorplanId = await createFloorplan();
    const res = await post(ownerAgent, `/floorplans/${floorplanId}/default-version`).send({});
    expect(res.status).toBe(400);
  });

  it("a Draft (not yet Published) version -> 409 VERSION_NOT_PUBLISHED", async () => {
    const floorplanId = await createFloorplan();
    const versionId = await createDraftVersion(floorplanId);
    const res = await post(ownerAgent, `/floorplans/${floorplanId}/default-version`).send({ versionId });
    expect(res.status).toBe(409);
    expect(res.body).toEqual({ type: "VERSION_NOT_PUBLISHED", currentStatus: "Draft" });
  });

  it("full happy path: create -> replace resources -> publish -> set default -> GET reflects it", async () => {
    const floorplanId = await createFloorplan();
    const versionId = await createDraftVersion(floorplanId);
    await put(ownerAgent, `/floorplan-versions/${versionId}/resources`).send({ tableIds: ["sushi-table-8"] });
    await post(ownerAgent, `/floorplan-versions/${versionId}/publish`);

    const defaulted = await post(ownerAgent, `/floorplans/${floorplanId}/default-version`).send({ versionId });
    expect(defaulted.status).toBe(200);
    expect(defaulted.body.floorplan.defaultVersionId).toBe(versionId);

    const listed = await ownerAgent.get("/floorplans");
    const entry = listed.body.floorplans.find((f: { id: string }) => f.id === floorplanId);
    expect(entry.defaultVersionId).toBe(versionId);
  });

  it("an unknown floorplan id -> 404", async () => {
    const res = await post(ownerAgent, "/floorplans/does-not-exist/default-version").send({ versionId: "x" });
    expect(res.status).toBe(404);
  });
});

describe("9. POST /floorplan-versions/:id/archive — Permission.CapacitySettingsManage required", () => {
  it("Reception (no CapacitySettingsManage) -> 403", async () => {
    const floorplanId = await createFloorplan();
    const versionId = await createDraftVersion(floorplanId);
    const res = await post(receptionAgent, `/floorplan-versions/${versionId}/archive`);
    expect(res.status).toBe(403);
  });

  it("archiving the current default -> 409 CANNOT_ARCHIVE_DEFAULT_VERSION", async () => {
    const floorplanId = await createFloorplan();
    const versionId = await createDraftVersion(floorplanId);
    await put(ownerAgent, `/floorplan-versions/${versionId}/resources`).send({ tableIds: ["sushi-table-9"] });
    await post(ownerAgent, `/floorplan-versions/${versionId}/publish`);
    await post(ownerAgent, `/floorplans/${floorplanId}/default-version`).send({ versionId });

    const res = await post(ownerAgent, `/floorplan-versions/${versionId}/archive`);
    expect(res.status).toBe(409);
    expect(res.body).toEqual({ type: "CANNOT_ARCHIVE_DEFAULT_VERSION" });
  });

  it("an unknown version id -> 404", async () => {
    const res = await post(ownerAgent, "/floorplan-versions/does-not-exist/archive");
    expect(res.status).toBe(404);
  });
});
