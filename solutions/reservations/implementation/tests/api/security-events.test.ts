import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
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
import { PrismaSecurityEventRecorder } from "../../infrastructure/persistence/PrismaSecurityEventRecorder.js";
import { PrismaSecurityEventReader } from "../../infrastructure/persistence/PrismaSecurityEventReader.js";
import { CSRF_HEADER_NAME } from "../../api/authMiddleware.js";
import { ActorRole } from "../../domain/value-objects/Actor.js";

/**
 * R1.7-P1 — HTTP-level coverage for GET /security-events.
 *
 * Isolation strategy: an Owner-role StaffUser is a global, database-
 * enforced singleton (partial unique index on staff_users(role) WHERE
 * role = 'Owner'), so — same precedent as tests/api/floor-view.test.ts's
 * own beforeAll — this file truncates the shared staff/security-event
 * tables exactly ONCE, at the very start of its own beforeAll, before
 * creating anything. Beyond that one call, this suite never truncates
 * again, and:
 *   - every StaffUser this file creates uses a RUN_ID-suffixed username/id,
 *     unique across repeated runs and safe under concurrent files;
 *   - every count/ordering-sensitive SecurityEvent fixture is dated in a
 *     dedicated, never-reused far-future (year 2100+) window, and every
 *     query that depends on an exact count passes `since` pinned to that
 *     same window, so no other file's real ("now"-dated) data can ever
 *     be counted alongside it;
 *   - every projection/degradation test asserts presence of ITS OWN
 *     fixture by id, never a bare array length, so it is immune to
 *     unrelated concurrent rows entirely.
 */
// Username.create() (domain/value-objects/Username.ts) caps usernames at
// 32 characters — RUN_ID is kept short so every "sec-evt-<suffix>-<RUN_ID>"
// username this file builds stays comfortably under that limit.
const RUN_ID = Math.random().toString(36).slice(2, 8);
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
    auth: {
      staffUserRepository: new PrismaStaffUserRepository(prisma),
      sessionRepository: new PrismaSessionRepository(prisma),
      passwordHasher: new ScryptPasswordHasher(),
      sessionTokenGenerator: new RandomSessionTokenGenerator(),
      cookieSecure: false,
      expectedOrigin: null,
      loginAttemptTracker: new PrismaLoginAttemptTracker(prisma),
      securityEventRecorder: new PrismaSecurityEventRecorder(prisma),
      securityEventReader: new PrismaSecurityEventReader(prisma),
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
let reservationAgentAgent: ReturnType<typeof request.agent>;

async function createStaffUser(usernameSuffix: string, role: ActorRole): Promise<{ id: string; username: string }> {
  const username = `sec-evt-${usernameSuffix}-${RUN_ID}`;
  // Username.create() caps this at 32 characters; a username over that
  // limit fails validation and is silently treated as "unknown username"
  // by LoginHandler — a real, confusing failure mode this file hit once
  // already. Fail fast and clearly instead, right at fixture creation.
  if (username.length > 32) {
    throw new Error(`test fixture username "${username}" exceeds Username's 32-character limit (${username.length} chars) — shorten usernameSuffix.`);
  }
  const passwordHasher = new ScryptPasswordHasher();
  const created = await staffUserRepository.create({
    id: `sec-evt-id-${usernameSuffix}-${RUN_ID}`,
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

/** A fresh, dedicated far-future hour-bucket per call — see file header. */
let windowCounter = 0;
function nextIsolationWindow(): Date {
  windowCounter += 1;
  return new Date(Date.UTC(2100, 0, 1, windowCounter, 0, 0, 0));
}

let fixtureIdCounter = 0;
async function createSecurityEvent(input: {
  readonly type: string;
  readonly occurredAt: Date;
  readonly actingStaffUserId?: string | null;
  readonly targetStaffUserId?: string | null;
  readonly metadata?: string | null;
}): Promise<string> {
  fixtureIdCounter += 1;
  const id = `sec-evt-fixture-${RUN_ID}-${fixtureIdCounter}`;
  await prisma.securityEvent.create({
    data: {
      id,
      type: input.type,
      occurredAt: input.occurredAt,
      actingStaffUserId: input.actingStaffUserId ?? null,
      targetStaffUserId: input.targetStaffUserId ?? null,
      metadata: input.metadata ?? null,
    },
  });
  return id;
}

beforeAll(async () => {
  app = buildApp();
  await truncateStaffDomainTables(prisma);
  staffUserRepository = new PrismaStaffUserRepository(prisma);
  const owner = await createStaffUser("owner", ActorRole.Owner);
  const manager = await createStaffUser("manager", ActorRole.Manager);
  const reception = await createStaffUser("reception", ActorRole.Reception);
  const reservationAgentUser = await createStaffUser("agent", ActorRole.ReservationAgent);
  ownerAgent = await loginAgent(owner.username);
  managerAgent = await loginAgent(manager.username);
  receptionAgent = await loginAgent(reception.username);
  reservationAgentAgent = await loginAgent(reservationAgentUser.username);
});

afterAll(async () => {
  await prisma.$disconnect();
});

// Every synthetic fixture this file creates (including via createMany and
// the direct prisma.securityEvent.create calls in the tie-break test)
// shares the "sec-evt-fixture-<RUN_ID>" id prefix — deleted after EVERY
// test so far-future isolation fixtures from one test can never outrank
// (and hide) a real, "now"-dated event a LATER test looks up via `since`.
// A scoped delete by this file's own known id prefix, never a truncate.
afterEach(async () => {
  await prisma.securityEvent.deleteMany({ where: { id: { startsWith: `sec-evt-fixture-${RUN_ID}` } } });
});

describe("GET /security-events — authentication and authorization", () => {
  it("no session → 401", async () => {
    const res = await request(app).get("/security-events");
    expect(res.status).toBe(401);
  });

  it("Reception (no Permission.AuditView) → 403", async () => {
    const res = await receptionAgent.get("/security-events");
    expect(res.status).toBe(403);
  });

  it("ReservationAgent (no Permission.AuditView) → 403", async () => {
    const res = await reservationAgentAgent.get("/security-events");
    expect(res.status).toBe(403);
  });

  it("Owner (has Permission.AuditView) → 200", async () => {
    const res = await ownerAgent.get("/security-events");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.events)).toBe(true);
  });

  it("Manager (has Permission.AuditView) → 200", async () => {
    const res = await managerAgent.get("/security-events");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.events)).toBe(true);
  });
});

describe("GET /security-events — query contract", () => {
  it("default limit is 50", async () => {
    const windowStart = nextIsolationWindow();
    const ids: string[] = [];
    for (let i = 0; i < 60; i++) {
      const occurredAt = new Date(windowStart.getTime() + i * 1000);
      ids.push(await createSecurityEvent({ type: "LoginFailed", occurredAt, metadata: JSON.stringify({ reason: "UNKNOWN_USERNAME" }) }));
    }
    const res = await ownerAgent.get(`/security-events?since=${windowStart.toISOString()}`);
    expect(res.status).toBe(200);
    expect(res.body.events).toHaveLength(50);
    // Most-recent-first: the top 50 are the LAST 50 ids created (highest occurredAt).
    const expectedIds = ids.slice(-50).reverse();
    expect(res.body.events.map((e: { id: string }) => e.id)).toEqual(expectedIds);
  });

  it("an explicit limit is honored", async () => {
    const windowStart = nextIsolationWindow();
    const ids: string[] = [];
    for (let i = 0; i < 10; i++) {
      const occurredAt = new Date(windowStart.getTime() + i * 1000);
      ids.push(await createSecurityEvent({ type: "LoginFailed", occurredAt, metadata: JSON.stringify({ reason: "UNKNOWN_USERNAME" }) }));
    }
    const res = await ownerAgent.get(`/security-events?since=${windowStart.toISOString()}&limit=5`);
    expect(res.status).toBe(200);
    expect(res.body.events).toHaveLength(5);
    expect(res.body.events.map((e: { id: string }) => e.id)).toEqual(ids.slice(-5).reverse());
  });

  it("a limit above the maximum is clamped to 200, never returning more", async () => {
    const windowStart = nextIsolationWindow();
    const rows = Array.from({ length: 210 }, (_, i) => ({
      id: `sec-evt-fixture-${RUN_ID}-max-${i}`,
      type: "LoginFailed",
      occurredAt: new Date(windowStart.getTime() + i * 1000),
      metadata: JSON.stringify({ reason: "UNKNOWN_USERNAME" }),
    }));
    await prisma.securityEvent.createMany({ data: rows });
    const res = await ownerAgent.get(`/security-events?since=${windowStart.toISOString()}&limit=100000`);
    expect(res.status).toBe(200);
    expect(res.body.events).toHaveLength(200);
  });

  it.each(["0", "-5", "abc", "3.5", ""])("limit=%s is invalid → 400", async (limit) => {
    const res = await ownerAgent.get(`/security-events?limit=${encodeURIComponent(limit)}`);
    expect(res.status).toBe(400);
  });

  // Chief Engineer correction — `since` must be a COMPLETE RFC 3339/
  // ISO-8601 timestamp: date + time + an explicit timezone (Z or a
  // numeric offset). Date-only and timezone-less values are rejected,
  // never interpreted as midnight or machine-local time. Impossible
  // calendar/time values (a nonexistent day, an out-of-range hour) are
  // rejected too, not just malformed syntax — `new Date(...)` alone
  // would silently roll "2026-02-30" over to "2026-03-02" rather than
  // reject it, so the server's own validator re-derives and compares the
  // literal date/time fields (see parseStrictSince in api/app.ts).
  it.each([
    "not-a-date",
    "2026/08/20",
    "garbage-Ttime",
    "2026-01-01", // date-only — no time, no timezone
    "2026-09-10T12:30:00", // has a time, but no timezone
    "2026-13-40T12:00:00Z", // syntactically time-shaped but an impossible month/day
    "2026-02-30T12:00:00Z", // February 30th does not exist (would otherwise silently roll over to March 2)
    "2026-04-31T12:00:00Z", // April has only 30 days
    "2026-09-10T25:00:00Z", // hour out of range
    "2026-09-10T12:60:00Z", // minute out of range
  ])("since=%s is invalid → 400", async (since) => {
    const res = await ownerAgent.get(`/security-events?since=${encodeURIComponent(since)}`);
    expect(res.status).toBe(400);
  });

  it("accepts a complete UTC (Z) timestamp", async () => {
    const res = await ownerAgent.get("/security-events?since=2026-01-01T10:00:00.000Z");
    expect(res.status).toBe(200);
  });

  it("accepts a complete timestamp with a numeric offset", async () => {
    const res = await ownerAgent.get(`/security-events?since=${encodeURIComponent("2026-09-10T14:30:00+02:00")}`);
    expect(res.status).toBe(200);
  });

  it("since filters out events strictly before the cutoff", async () => {
    const windowStart = nextIsolationWindow();
    const before = await createSecurityEvent({ type: "LoginFailed", occurredAt: new Date(windowStart.getTime() - 5000), metadata: JSON.stringify({ reason: "UNKNOWN_USERNAME" }) });
    const after = await createSecurityEvent({ type: "LoginFailed", occurredAt: new Date(windowStart.getTime() + 5000), metadata: JSON.stringify({ reason: "UNKNOWN_USERNAME" }) });
    const res = await ownerAgent.get(`/security-events?since=${windowStart.toISOString()}`);
    expect(res.status).toBe(200);
    const ids = res.body.events.map((e: { id: string }) => e.id);
    expect(ids).toContain(after);
    expect(ids).not.toContain(before);
  });

  it("deterministic ordering: occurredAt DESC, then id DESC as a tiebreaker", async () => {
    const windowStart = nextIsolationWindow();
    const idA = `sec-evt-fixture-${RUN_ID}-tie-a`;
    const idB = `sec-evt-fixture-${RUN_ID}-tie-b`;
    // Created out of id order, identical occurredAt — proves ordering is
    // driven by the query, not insertion order.
    await prisma.securityEvent.create({ data: { id: idA, type: "LoginFailed", occurredAt: windowStart, metadata: JSON.stringify({ reason: "UNKNOWN_USERNAME" }) } });
    await prisma.securityEvent.create({ data: { id: idB, type: "LoginFailed", occurredAt: windowStart, metadata: JSON.stringify({ reason: "UNKNOWN_USERNAME" }) } });
    const res = await ownerAgent.get(`/security-events?since=${windowStart.toISOString()}`);
    expect(res.status).toBe(200);
    expect(res.body.events.map((e: { id: string }) => e.id)).toEqual([idB, idA]);
  });
});

describe("GET /security-events — projection and safety", () => {
  it("OwnerBootstrapped projects with reason null and no metadata leak", async () => {
    const windowStart = nextIsolationWindow();
    const id = await createSecurityEvent({ type: "OwnerBootstrapped", occurredAt: windowStart, targetStaffUserId: null, metadata: null });
    const res = await ownerAgent.get(`/security-events?since=${windowStart.toISOString()}`);
    const event = res.body.events.find((e: { id: string }) => e.id === id);
    expect(event).toBeDefined();
    expect(event.type).toBe("OwnerBootstrapped");
    expect(event.reason).toBeNull();
    expect(event).not.toHaveProperty("metadata");
  });

  it("malformed LoginFailed metadata degrades to reason: null without failing the response", async () => {
    const windowStart = nextIsolationWindow();
    const malformedId = await createSecurityEvent({ type: "LoginFailed", occurredAt: windowStart, metadata: "not-json-at-all" });
    const okId = await createSecurityEvent({ type: "LoginFailed", occurredAt: new Date(windowStart.getTime() + 1000), metadata: JSON.stringify({ reason: "INVALID_PASSWORD" }) });
    const res = await ownerAgent.get(`/security-events?since=${windowStart.toISOString()}`);
    expect(res.status).toBe(200);
    const malformed = res.body.events.find((e: { id: string }) => e.id === malformedId);
    const ok = res.body.events.find((e: { id: string }) => e.id === okId);
    expect(malformed.reason).toBeNull();
    expect(ok.reason).toBe("INVALID_PASSWORD");
  });

  it("an unrecognized reason value degrades to null", async () => {
    const windowStart = nextIsolationWindow();
    const id = await createSecurityEvent({ type: "LoginFailed", occurredAt: windowStart, metadata: JSON.stringify({ reason: "SOME_FUTURE_REASON" }) });
    const res = await ownerAgent.get(`/security-events?since=${windowStart.toISOString()}`);
    const event = res.body.events.find((e: { id: string }) => e.id === id);
    expect(event.reason).toBeNull();
  });

  it("an unknown event type still projects safely, with reason: null", async () => {
    const windowStart = nextIsolationWindow();
    const id = await createSecurityEvent({ type: "SomeFutureEventType", occurredAt: windowStart, metadata: JSON.stringify({ anything: "goes" }) });
    const res = await ownerAgent.get(`/security-events?since=${windowStart.toISOString()}`);
    expect(res.status).toBe(200);
    const event = res.body.events.find((e: { id: string }) => e.id === id);
    expect(event).toBeDefined();
    expect(event.type).toBe("SomeFutureEventType");
    expect(event.reason).toBeNull();
    expect(event).not.toHaveProperty("metadata");
  });

  it("never exposes a raw metadata field or non-allowlisted keys on any event", async () => {
    const windowStart = nextIsolationWindow();
    await createSecurityEvent({ type: "LoginFailed", occurredAt: windowStart, metadata: JSON.stringify({ reason: "ACCOUNT_DISABLED", extraSecretKey: "should-never-appear" }) });
    const res = await ownerAgent.get(`/security-events?since=${windowStart.toISOString()}`);
    for (const event of res.body.events) {
      expect(Object.keys(event).sort()).toEqual(
        ["actingStaffUserId", "actingStaffUsername", "id", "occurredAt", "reason", "targetStaffUserId", "targetStaffUsername", "type"].sort()
      );
    }
    expect(JSON.stringify(res.body)).not.toContain("extraSecretKey");
    expect(JSON.stringify(res.body)).not.toContain("should-never-appear");
  });

  it("resolves a persisted StaffUser reference to a username; an unresolvable id stays null and is never guessed", async () => {
    const windowStart = nextIsolationWindow();
    const target = await createStaffUser("projtarget", ActorRole.Reception);
    const resolvableId = await createSecurityEvent({ type: "LoginFailed", occurredAt: windowStart, targetStaffUserId: target.id, metadata: JSON.stringify({ reason: "INVALID_PASSWORD" }) });
    const unresolvableId = await createSecurityEvent({
      type: "LoginFailed",
      occurredAt: new Date(windowStart.getTime() + 1000),
      targetStaffUserId: "sec-evt-nonexistent-staff-id",
      metadata: JSON.stringify({ reason: "INVALID_PASSWORD" }),
    });
    const res = await ownerAgent.get(`/security-events?since=${windowStart.toISOString()}`);
    const resolved = res.body.events.find((e: { id: string }) => e.id === resolvableId);
    const unresolved = res.body.events.find((e: { id: string }) => e.id === unresolvableId);
    expect(resolved.targetStaffUsername).toBe(target.username);
    expect(unresolved.targetStaffUserId).toBe("sec-evt-nonexistent-staff-id");
    expect(unresolved.targetStaffUsername).toBeNull();
  });

  it("an unknown attempted-login username (no StaffUser resolved) leaves both id and username unavailable, never recovered", async () => {
    const windowStart = nextIsolationWindow();
    const id = await createSecurityEvent({ type: "LoginFailed", occurredAt: windowStart, targetStaffUserId: null, metadata: JSON.stringify({ reason: "UNKNOWN_USERNAME" }) });
    const res = await ownerAgent.get(`/security-events?since=${windowStart.toISOString()}`);
    const event = res.body.events.find((e: { id: string }) => e.id === id);
    expect(event.targetStaffUserId).toBeNull();
    expect(event.targetStaffUsername).toBeNull();
    expect(event.reason).toBe("UNKNOWN_USERNAME");
  });
});

describe("GET /security-events — real failed-login recording, then retrieval", () => {
  it("a real wrong-password HTTP login attempt is recorded and retrievable, with no credential leakage", async () => {
    const target = await createStaffUser("realfail", ActorRole.Reception);
    const justBefore = new Date();
    const attemptedPassword = `definitely-wrong-${RUN_ID}`;

    const loginRes = await post(request.agent(app), "/auth/login").send({ username: target.username, password: attemptedPassword });
    expect(loginRes.status).toBe(401);

    const res = await ownerAgent.get(`/security-events?since=${justBefore.toISOString()}&limit=200`);
    expect(res.status).toBe(200);
    const event = res.body.events.find((e: { targetStaffUserId: string | null }) => e.targetStaffUserId === target.id);
    expect(event).toBeDefined();
    expect(event.type).toBe("LoginFailed");
    expect(event.reason).toBe("INVALID_PASSWORD");
    expect(event.actingStaffUserId).toBeNull();
    expect(event.targetStaffUsername).toBe(target.username);

    // The attempted (wrong) password, and the fixed test password shared
    // by every OTHER staff user in this file, never appear anywhere in
    // the response body.
    const raw = JSON.stringify(res.body);
    expect(raw).not.toContain(attemptedPassword);
    expect(raw).not.toContain(PASSWORD);
  });
});
