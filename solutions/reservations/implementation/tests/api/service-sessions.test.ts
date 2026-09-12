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
import { PrismaServiceSessionRepository } from "../../infrastructure/persistence/PrismaServiceSessionRepository.js";
import { CSRF_HEADER_NAME } from "../../api/authMiddleware.js";
import { ActorRole } from "../../domain/value-objects/Actor.js";

/**
 * R1.6-P2C-1 — HTTP-level coverage for the five `/service-sessions*`
 * routes: permission/authentication matrix, strict serviceCode/serviceDate
 * validation, and the typed outcome-to-status-code mapping. Mirrors
 * `tests/api/security-events.test.ts`'s own isolation conventions
 * (RUN_ID-suffixed usernames, a dedicated far-future date window, no
 * blanket table truncation).
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
    serviceSessions: {
      serviceSessionRepository: new PrismaServiceSessionRepository(prisma),
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

let app: Express;
let staffUserRepository: PrismaStaffUserRepository;
let ownerAgent: ReturnType<typeof request.agent>;
let managerAgent: ReturnType<typeof request.agent>;
let receptionAgent: ReturnType<typeof request.agent>;

async function createStaffUser(usernameSuffix: string, role: ActorRole): Promise<{ id: string; username: string }> {
  const username = `svs-${usernameSuffix}-${RUN_ID}`;
  if (username.length > 32) throw new Error(`test fixture username "${username}" exceeds Username's 32-character limit.`);
  const passwordHasher = new ScryptPasswordHasher();
  const created = await staffUserRepository.create({
    id: `svs-id-${usernameSuffix}-${RUN_ID}`,
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

let dateCounter = 0;
/** A fresh, never-reused service date per call — avoids cross-test unique-key collisions without needing any table truncation. */
function nextServiceDate(): string {
  dateCounter += 1;
  const day = String((dateCounter % 27) + 1).padStart(2, "0");
  const month = String(Math.floor(dateCounter / 27) + 1).padStart(2, "0");
  return `2028-${month}-${day}`;
}

beforeAll(async () => {
  app = buildApp();
  // Owner is a global, database-enforced singleton (partial unique index
  // on staff_users(role) WHERE role = 'Owner') — same precedent as
  // tests/api/security-events.test.ts and tests/api/seating-mark-seated.test.ts's
  // own beforeAll: truncate the shared staff domain tables exactly ONCE,
  // before creating anything, never again after.
  await truncateStaffDomainTables(prisma);
  // This file's own dedicated 2028-* date window (see nextServiceDate)
  // is never truncated by any shared helper — clear only that scoped
  // range so a prior run's leftover rows never collide with fresh ones.
  await prisma.serviceSession.deleteMany({
    where: { serviceDate: { gte: new Date("2028-01-01T00:00:00.000Z"), lt: new Date("2029-01-01T00:00:00.000Z") } },
  });
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

describe("GET /service-sessions — authentication only, no specific permission", () => {
  it("no session -> 401", async () => {
    const res = await request(app).get("/service-sessions");
    expect(res.status).toBe(401);
  });

  it("any authenticated role (including one without CapacitySettingsManage) -> 200", async () => {
    const res = await receptionAgent.get("/service-sessions");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.sessions)).toBe(true);
  });
});

describe("POST /service-sessions — Permission.CapacitySettingsManage required", () => {
  it("no session -> 401", async () => {
    const res = await request(app)
      .post("/service-sessions")
      .set(CSRF_HEADER_NAME, "1")
      .send({ serviceCode: "lunch", serviceDate: nextServiceDate() });
    expect(res.status).toBe(401);
  });

  it("Reception (no CapacitySettingsManage) -> 403", async () => {
    const res = await post(receptionAgent, "/service-sessions").send({ serviceCode: "lunch", serviceDate: nextServiceDate() });
    expect(res.status).toBe(403);
  });

  it("Manager (has CapacitySettingsManage) -> 201 CREATED", async () => {
    const res = await post(managerAgent, "/service-sessions").send({ serviceCode: "dinner", serviceDate: nextServiceDate() });
    expect(res.status).toBe(201);
    expect(res.body.type).toBe("CREATED");
    expect(res.body.session.status).toBe("Created");
  });

  it("Owner (has CapacitySettingsManage) -> 201 CREATED", async () => {
    const res = await post(ownerAgent, "/service-sessions").send({ serviceCode: "lunch", serviceDate: nextServiceDate() });
    expect(res.status).toBe(201);
  });

  it("a duplicate (serviceCode, serviceDate) -> 409 ALREADY_EXISTS", async () => {
    const serviceDate = nextServiceDate();
    const first = await post(ownerAgent, "/service-sessions").send({ serviceCode: "dinner", serviceDate });
    expect(first.status).toBe(201);
    const second = await post(ownerAgent, "/service-sessions").send({ serviceCode: "dinner", serviceDate });
    expect(second.status).toBe(409);
    expect(second.body.type).toBe("ALREADY_EXISTS");
  });

  it.each(["brunch", "LUNCH", "", "sp-dinner"])("an unknown serviceCode (%s) -> 400", async (serviceCode) => {
    const res = await post(ownerAgent, "/service-sessions").send({ serviceCode, serviceDate: nextServiceDate() });
    expect(res.status).toBe(400);
  });

  it.each(["2028-1-1", "not-a-date", "2028-13-40", ""])("an invalid serviceDate (%s) -> 400", async (serviceDate) => {
    const res = await post(ownerAgent, "/service-sessions").send({ serviceCode: "lunch", serviceDate });
    expect(res.status).toBe(400);
  });
});

describe("POST /service-sessions/:id/open, /close, /cancel — Permission.CapacitySettingsManage required", () => {
  it("Reception (no CapacitySettingsManage) -> 403 for open/close/cancel", async () => {
    const created = await post(ownerAgent, "/service-sessions").send({ serviceCode: "lunch", serviceDate: nextServiceDate() });
    const id = created.body.session.id;
    expect((await post(receptionAgent, `/service-sessions/${id}/open`)).status).toBe(403);
    expect((await post(receptionAgent, `/service-sessions/${id}/close`)).status).toBe(403);
    expect((await post(receptionAgent, `/service-sessions/${id}/cancel`)).status).toBe(403);
  });

  it("Owner: open -> 200 OPENED, then close -> 200 CLOSED", async () => {
    const created = await post(ownerAgent, "/service-sessions").send({ serviceCode: "dinner", serviceDate: nextServiceDate() });
    const id = created.body.session.id;
    const opened = await post(ownerAgent, `/service-sessions/${id}/open`);
    expect(opened.status).toBe(200);
    expect(opened.body).toEqual({ type: "OPENED", session: expect.objectContaining({ id, status: "Opened" }) });
    const closed = await post(ownerAgent, `/service-sessions/${id}/close`);
    expect(closed.status).toBe(200);
    expect(closed.body.type).toBe("CLOSED");
  });

  it("Manager: create then cancel -> 200 CANCELLED", async () => {
    const created = await post(managerAgent, "/service-sessions").send({ serviceCode: "lunch", serviceDate: nextServiceDate() });
    const id = created.body.session.id;
    const cancelled = await post(managerAgent, `/service-sessions/${id}/cancel`);
    expect(cancelled.status).toBe(200);
    expect(cancelled.body.type).toBe("CANCELLED");
  });

  it("close on a Created (not yet Opened) session -> 409 INVALID_TRANSITION", async () => {
    const created = await post(ownerAgent, "/service-sessions").send({ serviceCode: "dinner", serviceDate: nextServiceDate() });
    const id = created.body.session.id;
    const res = await post(ownerAgent, `/service-sessions/${id}/close`);
    expect(res.status).toBe(409);
    expect(res.body).toEqual({ type: "INVALID_TRANSITION", currentStatus: "Created" });
  });

  it("open/close/cancel on an unknown id -> 404", async () => {
    expect((await post(ownerAgent, "/service-sessions/does-not-exist/open")).status).toBe(404);
    expect((await post(ownerAgent, "/service-sessions/does-not-exist/close")).status).toBe(404);
    expect((await post(ownerAgent, "/service-sessions/does-not-exist/cancel")).status).toBe(404);
  });

  it("open twice is idempotent — second call also returns 200 OPENED with the same session state", async () => {
    const created = await post(ownerAgent, "/service-sessions").send({ serviceCode: "lunch", serviceDate: nextServiceDate() });
    const id = created.body.session.id;
    const first = await post(ownerAgent, `/service-sessions/${id}/open`);
    const second = await post(ownerAgent, `/service-sessions/${id}/open`);
    expect(second.status).toBe(200);
    expect(second.body.session.openedAt).toBe(first.body.session.openedAt);
    expect(second.body.session.version).toBe(first.body.session.version);
  });
});
