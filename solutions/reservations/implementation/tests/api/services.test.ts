import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { Express } from "express";
import { createApp, AppDependencies } from "../../api/app.js";
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
import { CSRF_HEADER_NAME } from "../../api/authMiddleware.js";
import { ActorRole } from "../../domain/value-objects/Actor.js";
import { FakeServiceDefinitionRepository } from "../support/FakePorts.js";

/**
 * R1.6-P3B — HTTP-level coverage for GET /services and PATCH /services/:code.
 * Every mutation-focused test builds its own isolated app instance over a
 * fresh FakeServiceDefinitionRepository (per "Use fake/in-memory Service
 * repositories for mutation-focused API tests to avoid shared canonical-
 * row interference") — never the real Prisma-backed repository, so the
 * shared `lunch`/`dinner` database rows are never touched by anything in
 * this file. Auth (staff users, sessions) is real Postgres, same isolation
 * convention as every other API test file in this suite (RUN_ID-suffixed
 * usernames). A staff session, once established, is valid across every
 * app instance built here (sessions are validated against the same shared
 * `prisma`-backed SessionRepository regardless of which Express app
 * instance handles a given request) — so one login per role is reused
 * against however many isolated app instances a test group needs.
 */
const RUN_ID = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
const PASSWORD = "SuperSecret123!";
const prisma = createTestPrismaClient();

function baseDeps(serviceCatalog?: AppDependencies["serviceCatalog"]): AppDependencies {
  return {
    repository: new PrismaReservationRepository(prisma),
    duplicateChecker: new PrismaDuplicateReservationChecker(prisma),
    contactRepository: new PrismaContactRepository(prisma),
    transactionManager: new PrismaTransactionManager(prisma),
    servicePeriodReader: new UnvalidatedServicePeriodReader(),
    closingDayStore: new PrismaClosingDayStore(prisma),
    idGenerator: new RandomIdGenerator(),
    eventIdGenerator: new RandomIdGenerator(),
    clock: { now: () => new Date() },
    auth: {
      staffUserRepository: new PrismaStaffUserRepository(prisma),
      sessionRepository: new PrismaSessionRepository(prisma),
      passwordHasher: new ScryptPasswordHasher(),
      sessionTokenGenerator: new RandomSessionTokenGenerator(),
      cookieSecure: false,
      expectedOrigin: null,
      loginAttemptTracker: new PrismaLoginAttemptTracker(prisma),
    },
    ...(serviceCatalog ? { serviceCatalog } : {}),
  };
}

function freshCatalog(): FakeServiceDefinitionRepository {
  return new FakeServiceDefinitionRepository();
}

function buildApp(repo?: FakeServiceDefinitionRepository): Express {
  return createApp(baseDeps(repo ? { repository: repo } : undefined));
}

function post(agent: ReturnType<typeof request.agent>, url: string) {
  return agent.post(url).set(CSRF_HEADER_NAME, "1");
}
function patch(agent: ReturnType<typeof request.agent>, url: string) {
  return agent.patch(url).set(CSRF_HEADER_NAME, "1");
}

let staffUserRepository: PrismaStaffUserRepository;
let ownerUsername: string;
let managerUsername: string;
let receptionUsername: string;

async function createStaffUser(usernameSuffix: string, role: ActorRole): Promise<{ id: string; username: string }> {
  const username = `svc-${usernameSuffix}-${RUN_ID}`;
  if (username.length > 32) throw new Error(`test fixture username "${username}" exceeds Username's 32-character limit.`);
  const passwordHasher = new ScryptPasswordHasher();
  const created = await staffUserRepository.create({
    id: `svc-id-${usernameSuffix}-${RUN_ID}`,
    username,
    displayName: username,
    email: null,
    passwordHash: await passwordHasher.hash(PASSWORD),
    role,
  });
  return { id: created.id, username: created.username };
}

async function loginTo(targetApp: Express, username: string): Promise<ReturnType<typeof request.agent>> {
  const agent = request.agent(targetApp);
  const res = await post(agent, "/auth/login").send({ username, password: PASSWORD });
  if (res.status !== 200) throw new Error(`test setup failed to log in as ${username} against this app instance: ${res.status} ${JSON.stringify(res.body)}`);
  return agent;
}

beforeAll(async () => {
  await truncateStaffDomainTables(prisma);
  staffUserRepository = new PrismaStaffUserRepository(prisma);
  ownerUsername = (await createStaffUser("owner", ActorRole.Owner)).username;
  managerUsername = (await createStaffUser("manager", ActorRole.Manager)).username;
  receptionUsername = (await createStaffUser("reception", ActorRole.Reception)).username;
});
afterAll(async () => {
  await prisma.$disconnect();
});

describe("Deployment posture — serviceCatalog omitted", () => {
  it("GET /services and PATCH /services/:code both 404 when the serviceCatalog block is not supplied", async () => {
    const app = buildApp(undefined);
    const agent = await loginTo(app, ownerUsername);
    expect((await agent.get("/services")).status).toBe(404);
    const res = await patch(agent, "/services/lunch").send({ displayName: "X" });
    expect(res.status).toBe(404);
  });
});

describe("GET /services — authentication only, no specific permission", () => {
  it("no session -> 401", async () => {
    const app = buildApp(freshCatalog());
    const res = await request(app).get("/services");
    expect(res.status).toBe(401);
  });

  it("any authenticated real role (including one without CapacitySettingsManage) -> 200", async () => {
    const app = buildApp(freshCatalog());
    const receptionAgent = await loginTo(app, receptionUsername);
    const res = await receptionAgent.get("/services");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.services)).toBe(true);
  });

  it("Owner and Manager can also read", async () => {
    const app = buildApp(freshCatalog());
    const ownerAgent = await loginTo(app, ownerUsername);
    const managerAgent = await loginTo(app, managerUsername);
    expect((await ownerAgent.get("/services")).status).toBe(200);
    expect((await managerAgent.get("/services")).status).toBe(200);
  });

  it("deterministic lunch-then-dinner order, regardless of the underlying repository's own row order", async () => {
    class ReversedOrderRepo extends FakeServiceDefinitionRepository {
      override async list() {
        const rows = await super.list();
        return [...rows].reverse();
      }
    }
    const app = buildApp(new ReversedOrderRepo());
    const agent = await loginTo(app, ownerUsername);
    const res = await agent.get("/services");
    expect(res.body.services.map((s: { code: string }) => s.code)).toEqual(["lunch", "dinner"]);
  });

  it("exact allowlisted keys per row — code, displayName, enabled, createdAt, updatedAt, nothing else", async () => {
    const app = buildApp(freshCatalog());
    const agent = await loginTo(app, ownerUsername);
    const res = await agent.get("/services");
    for (const row of res.body.services) {
      expect(Object.keys(row).sort()).toEqual(["code", "createdAt", "displayName", "enabled", "updatedAt"].sort());
    }
  });

  it("empty repository behavior — services: [], not an error", async () => {
    const repo = freshCatalog();
    repo.remove("lunch");
    repo.remove("dinner");
    const app = buildApp(repo);
    const agent = await loginTo(app, ownerUsername);
    const res = await agent.get("/services");
    expect(res.status).toBe(200);
    expect(res.body.services).toEqual([]);
  });
});

describe("PATCH /services/:code — Permission.CapacitySettingsManage required", () => {
  it("no session -> 401", async () => {
    const app = buildApp(freshCatalog());
    const res = await request(app).patch("/services/lunch").set(CSRF_HEADER_NAME, "1").send({ displayName: "X" });
    expect(res.status).toBe(401);
  });

  it("Reception (no CapacitySettingsManage) -> 403", async () => {
    const app = buildApp(freshCatalog());
    const receptionAgent = await loginTo(app, receptionUsername);
    const res = await patch(receptionAgent, "/services/lunch").send({ displayName: "X" });
    expect(res.status).toBe(403);
  });

  it("Manager (has CapacitySettingsManage) -> 200", async () => {
    const app = buildApp(freshCatalog());
    const managerAgent = await loginTo(app, managerUsername);
    const res = await patch(managerAgent, "/services/lunch").send({ displayName: "Lunchkaart" });
    expect(res.status).toBe(200);
  });

  it("Owner (has CapacitySettingsManage) -> 200", async () => {
    const app = buildApp(freshCatalog());
    const ownerAgent = await loginTo(app, ownerUsername);
    const res = await patch(ownerAgent, "/services/lunch").send({ enabled: false });
    expect(res.status).toBe(200);
  });
});

describe("PATCH /services/:code — unknown code", () => {
  it("a code outside {lunch, dinner} -> 404 SERVICE_NOT_FOUND", async () => {
    const app = buildApp(freshCatalog());
    const ownerAgent = await loginTo(app, ownerUsername);
    const res = await patch(ownerAgent, "/services/brunch").send({ displayName: "X" });
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ type: "SERVICE_NOT_FOUND" });
  });

  it("a canonical code with no row in this repository -> 404 SERVICE_NOT_FOUND", async () => {
    const repo = freshCatalog();
    repo.remove("lunch");
    const app = buildApp(repo);
    const ownerAgent = await loginTo(app, ownerUsername);
    const res = await patch(ownerAgent, "/services/lunch").send({ displayName: "X" });
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ type: "SERVICE_NOT_FOUND" });
  });
});

describe("PATCH /services/:code — structural/domain validation, 422 violations envelope", () => {
  async function ownerAgentFor(repo: FakeServiceDefinitionRepository) {
    const app = buildApp(repo);
    return loginTo(app, ownerUsername);
  }

  it("empty body -> 422", async () => {
    const agent = await ownerAgentFor(freshCatalog());
    const res = await patch(agent, "/services/lunch").send({});
    expect(res.status).toBe(422);
    expect(Array.isArray(res.body.violations)).toBe(true);
    expect(res.body.violations.length).toBeGreaterThan(0);
  });

  it("unknown key -> 422", async () => {
    const agent = await ownerAgentFor(freshCatalog());
    const res = await patch(agent, "/services/lunch").send({ scheduleWindow: "12:00-16:00" });
    expect(res.status).toBe(422);
    expect(res.body.violations.some((v: { ruleId: string }) => v.ruleId === "CAP-D02.01-R03")).toBe(true);
  });

  it("code in body -> 422, rejected even when it matches the path param", async () => {
    const agent = await ownerAgentFor(freshCatalog());
    const res = await patch(agent, "/services/lunch").send({ code: "lunch", displayName: "X" });
    expect(res.status).toBe(422);
    expect(res.body.violations.some((v: { ruleId: string }) => v.ruleId === "CAP-D02.01-R04")).toBe(true);
  });

  it("invalid displayName (empty after trim) -> 422", async () => {
    const agent = await ownerAgentFor(freshCatalog());
    const res = await patch(agent, "/services/lunch").send({ displayName: "   " });
    expect(res.status).toBe(422);
    expect(res.body.violations.some((v: { ruleId: string }) => v.ruleId === "CAP-D02.01-R05")).toBe(true);
  });

  it("invalid displayName (wrong type) -> 422", async () => {
    const agent = await ownerAgentFor(freshCatalog());
    const res = await patch(agent, "/services/lunch").send({ displayName: 123 });
    expect(res.status).toBe(422);
    expect(res.body.violations.some((v: { ruleId: string }) => v.ruleId === "CAP-D02.01-R05")).toBe(true);
  });

  it("invalid enabled (wrong type) -> 422", async () => {
    const agent = await ownerAgentFor(freshCatalog());
    const res = await patch(agent, "/services/lunch").send({ enabled: "yes" });
    expect(res.status).toBe(422);
    expect(res.body.violations.some((v: { ruleId: string }) => v.ruleId === "CAP-D02.01-R06")).toBe(true);
  });

  it("a non-object body -> 422", async () => {
    const agent = await ownerAgentFor(freshCatalog());
    const res = await patch(agent, "/services/lunch").send([1, 2, 3]);
    expect(res.status).toBe(422);
  });

  it("no raw error leakage — a 422 body contains only { violations: [{ ruleId, message }] }, no stack trace or internal detail", async () => {
    const agent = await ownerAgentFor(freshCatalog());
    const res = await patch(agent, "/services/lunch").send({});
    expect(Object.keys(res.body)).toEqual(["violations"]);
    for (const v of res.body.violations) {
      expect(Object.keys(v).sort()).toEqual(["message", "ruleId"]);
      expect(typeof v.ruleId).toBe("string");
      expect(typeof v.message).toBe("string");
    }
  });
});

describe("PATCH /services/:code — successful mutation", () => {
  async function ownerAgentFor(repo: FakeServiceDefinitionRepository) {
    const app = buildApp(repo);
    return loginTo(app, ownerUsername);
  }

  it("rename only", async () => {
    const agent = await ownerAgentFor(freshCatalog());
    const res = await patch(agent, "/services/lunch").send({ displayName: "Middagmenu" });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      type: "UPDATED",
      service: { code: "lunch", displayName: "Middagmenu", enabled: true, createdAt: expect.any(String), updatedAt: expect.any(String) },
    });
  });

  it("toggle only", async () => {
    const agent = await ownerAgentFor(freshCatalog());
    const res = await patch(agent, "/services/dinner").send({ enabled: false });
    expect(res.status).toBe(200);
    expect(res.body.service).toMatchObject({ code: "dinner", displayName: "Dinner", enabled: false });
  });

  it("combined update", async () => {
    const agent = await ownerAgentFor(freshCatalog());
    const res = await patch(agent, "/services/lunch").send({ displayName: "Lunchkaart", enabled: false });
    expect(res.status).toBe(200);
    expect(res.body.service).toMatchObject({ code: "lunch", displayName: "Lunchkaart", enabled: false });
  });

  it("displayName is trimmed before storage", async () => {
    const agent = await ownerAgentFor(freshCatalog());
    const res = await patch(agent, "/services/lunch").send({ displayName: "  Padded Name  " });
    expect(res.status).toBe(200);
    expect(res.body.service.displayName).toBe("Padded Name");
  });

  it("same-value update is idempotent — returns UPDATED and preserves updatedAt exactly", async () => {
    const repo = freshCatalog();
    const app = buildApp(repo);
    const agent = await loginTo(app, ownerUsername);
    const before = await repo.findByCode("lunch");

    const res = await patch(agent, "/services/lunch").send({ displayName: "Lunch", enabled: true });
    expect(res.status).toBe(200);
    expect(res.body.service.updatedAt).toBe(before?.updatedAt.toISOString());
  });
});

describe("Existing Reservation APIs unaffected", () => {
  it("GET /reservations still works normally with serviceCatalog wired", async () => {
    const app = buildApp(freshCatalog());
    const agent = await loginTo(app, ownerUsername);
    const res = await agent.get("/reservations").query({ date: "2028-01-01" });
    expect(res.status).not.toBe(404);
    expect(res.status).toBeLessThan(500);
  });
});
