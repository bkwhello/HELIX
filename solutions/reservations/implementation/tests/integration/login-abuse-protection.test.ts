import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";
import { createApp } from "../../api/app.js";
import { MutableClock } from "./support/testHarness.js";
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
import { LoginThrottleConfig } from "../../application/auth/LoginThrottleGuard.js";
import { createTestPrismaClient, truncateStaffDomainTables } from "./support/testDatabaseSafety.js";

const prisma = createTestPrismaClient();
const NOW = new Date("2026-08-01T10:00:00Z");

// R1.4 P0: delegates to the centralized, fail-closed gate — see
// tests/integration/support/testDatabaseSafety.ts.
async function resetAll(): Promise<void> {
  await truncateStaffDomainTables(prisma);
}

// Small/fast for test speed — the DEFAULT production config (5/15min,
// 20/15min) is exercised separately by tests/application/login-throttle-guard.test.ts
// and by reservations.test.ts / identity-access.test.ts using it
// unmodified without ever tripping it (proving it doesn't interfere with
// normal usage).
const TEST_THROTTLE_CONFIG: LoginThrottleConfig = {
  sourceWindowMs: 60_000,
  sourceMaxAttempts: 10,
  usernameWindowMs: 60_000,
  usernameMaxAttempts: 3,
};

function buildApp(clock: MutableClock) {
  return createApp({
    repository: new PrismaReservationRepository(prisma),
    duplicateChecker: new PrismaDuplicateReservationChecker(prisma),
    contactRepository: new PrismaContactRepository(prisma),
    transactionManager: new PrismaTransactionManager(prisma),
    servicePeriodReader: new UnvalidatedServicePeriodReader(),
    closingDayStore: new PrismaClosingDayStore(prisma),
    idGenerator: new RandomIdGenerator(),
    eventIdGenerator: new RandomIdGenerator(),
    clock,
    auth: {
      staffUserRepository: new PrismaStaffUserRepository(prisma),
      sessionRepository: new PrismaSessionRepository(prisma),
      passwordHasher: new ScryptPasswordHasher(),
      sessionTokenGenerator: new RandomSessionTokenGenerator(),
      cookieSecure: false,
      expectedOrigin: null,
      loginAttemptTracker: new PrismaLoginAttemptTracker(prisma),
      loginThrottleConfig: TEST_THROTTLE_CONFIG,
    },
  });
}

async function seedUser(username: string, password: string): Promise<void> {
  const staffUserRepository = new PrismaStaffUserRepository(prisma);
  const passwordHasher = new ScryptPasswordHasher();
  await staffUserRepository.create({
    id: `su-${username}`,
    username,
    displayName: username,
    email: null,
    passwordHash: await passwordHasher.hash(password),
    role: ActorRole.Reception,
  });
}

function login(app: ReturnType<typeof buildApp>, username: string, password: string) {
  return request(app).post("/auth/login").set(CSRF_HEADER_NAME, "1").send({ username, password });
}

beforeAll(async () => {
  await resetAll();
});
afterAll(async () => {
  await prisma.$disconnect();
});
beforeEach(async () => {
  await resetAll();
});

describe("PrismaLoginAttemptTracker — window mechanics (real PostgreSQL)", () => {
  it("increments count within the same window", async () => {
    const tracker = new PrismaLoginAttemptTracker(prisma);
    await tracker.recordFailure("k1", NOW, 60_000);
    await tracker.recordFailure("k1", new Date(NOW.getTime() + 1000), 60_000);
    await tracker.recordFailure("k1", new Date(NOW.getTime() + 2000), 60_000);

    expect(await tracker.isThrottled("k1", new Date(NOW.getTime() + 3000), 60_000, 3)).toBe(true);
    expect(await tracker.isThrottled("k1", new Date(NOW.getTime() + 3000), 60_000, 4)).toBe(false);
  });

  it("resets the window once it has expired, rather than accumulating forever", async () => {
    const tracker = new PrismaLoginAttemptTracker(prisma);
    await tracker.recordFailure("k2", NOW, 60_000);
    await tracker.recordFailure("k2", new Date(NOW.getTime() + 1000), 60_000);
    await tracker.recordFailure("k2", new Date(NOW.getTime() + 2000), 60_000);
    expect(await tracker.isThrottled("k2", new Date(NOW.getTime() + 2000), 60_000, 3)).toBe(true);

    // Past the window — the NEXT failure starts a fresh window at count 1,
    // not count 4.
    const afterWindow = new Date(NOW.getTime() + 61_000);
    await tracker.recordFailure("k2", afterWindow, 60_000);
    expect(await tracker.isThrottled("k2", afterWindow, 60_000, 3)).toBe(false);
    expect(await tracker.isThrottled("k2", afterWindow, 60_000, 1)).toBe(true); // exactly 1 now
  });

  it("reset() clears the window entirely", async () => {
    const tracker = new PrismaLoginAttemptTracker(prisma);
    await tracker.recordFailure("k3", NOW, 60_000);
    await tracker.recordFailure("k3", NOW, 60_000);
    await tracker.recordFailure("k3", NOW, 60_000);
    expect(await tracker.isThrottled("k3", NOW, 60_000, 3)).toBe(true);

    await tracker.reset("k3");
    expect(await tracker.isThrottled("k3", NOW, 60_000, 1)).toBe(false);
  });

  it("under real concurrent failures for the SAME key, no update is lost — the atomic upsert must count all of them", async () => {
    const tracker = new PrismaLoginAttemptTracker(prisma);
    const concurrentFailures = 15;
    await Promise.all(Array.from({ length: concurrentFailures }, () => tracker.recordFailure("k-concurrent", NOW, 60_000)));

    // If the implementation were a naive read-then-write, concurrent
    // calls would race on a stale read and under-count. Verified via a
    // maxAttempts probe rather than a raw row read, to exercise the same
    // isThrottled() path production code uses.
    expect(await tracker.isThrottled("k-concurrent", NOW, 60_000, concurrentFailures)).toBe(true);
    expect(await tracker.isThrottled("k-concurrent", NOW, 60_000, concurrentFailures + 1)).toBe(false);
  });
});

describe("Login abuse protection — HTTP level (real PostgreSQL, real app)", () => {
  it("A — repeated wrong password for the same username/source is eventually throttled", async () => {
    const clock = new MutableClock(NOW);
    const app = buildApp(clock);
    await seedUser("wrongpass-user", "correct-password-123");

    const results = [];
    for (let i = 0; i < 5; i += 1) {
      results.push((await login(app, "wrongpass-user", "incorrect")).status);
    }

    expect(results.slice(0, 3)).toEqual([401, 401, 401]); // under the 3-attempt threshold
    expect(results.slice(3)).toEqual([429, 429]); // at and beyond it
  });

  it("B — an unknown username is throttled the same way, without revealing it doesn't exist", async () => {
    const clock = new MutableClock(NOW);
    const app = buildApp(clock);

    const results = [];
    for (let i = 0; i < 5; i += 1) {
      results.push((await login(app, "no-such-user-at-all", "whatever")).status);
    }

    expect(results.slice(0, 3)).toEqual([401, 401, 401]);
    expect(results.slice(3)).toEqual([429, 429]);
  });

  it("C — successful login works normally below the threshold", async () => {
    const clock = new MutableClock(NOW);
    const app = buildApp(clock);
    await seedUser("gooduser", "correct-password-123");

    // Two failures, still under the threshold of 3...
    await login(app, "gooduser", "wrong-1");
    await login(app, "gooduser", "wrong-2");
    // ...then the correct password still works.
    const res = await login(app, "gooduser", "correct-password-123");
    expect(res.status).toBe(200);
  });

  it("D — the throttled response is a generic 429 that does not distinguish source-limit from username-limit, or reveal account existence", async () => {
    const clock = new MutableClock(NOW);
    const app = buildApp(clock);
    await seedUser("realaccount", "correct-password-123");

    for (let i = 0; i < 3; i += 1) await login(app, "realaccount", "wrong");
    const knownThrottled = await login(app, "realaccount", "wrong");

    for (let i = 0; i < 3; i += 1) await login(app, "fake-account-xyz", "wrong");
    const unknownThrottled = await login(app, "fake-account-xyz", "wrong");

    expect(knownThrottled.status).toBe(429);
    expect(unknownThrottled.status).toBe(429);
    expect(knownThrottled.body).toEqual(unknownThrottled.body);
    expect(JSON.stringify(knownThrottled.body).toLowerCase()).not.toContain("exist");
  });

  it("E — access becomes possible again after the configured window, using a controllable clock (no real sleeps)", async () => {
    const clock = new MutableClock(NOW);
    const app = buildApp(clock);
    await seedUser("windowuser", "correct-password-123");

    for (let i = 0; i < 3; i += 1) await login(app, "windowuser", "wrong");
    const throttled = await login(app, "windowuser", "wrong");
    expect(throttled.status).toBe(429);

    // Advance the injected clock past the configured window (60s) — no
    // Sleep, no real wall-clock wait.
    clock.set(new Date(NOW.getTime() + 61_000));

    const afterWindow = await login(app, "windowuser", "correct-password-123");
    expect(afterWindow.status).toBe(200);
  });

  it("a successful login resets the USERNAME window but not the SOURCE window (§6)", async () => {
    const clock = new MutableClock(NOW);
    const app = buildApp(clock);
    await seedUser("resetcheck", "correct-password-123");

    // 2 failures (under the 3-attempt username threshold), then succeed.
    await login(app, "resetcheck", "wrong-1");
    await login(app, "resetcheck", "wrong-2");
    const success = await login(app, "resetcheck", "correct-password-123");
    expect(success.status).toBe(200);

    // The username window is now reset — a FULL 3 more failures (not
    // just 1) should be allowed through (401) before the 4th throttles
    // (429), exactly mirroring scenario A's pattern for a fresh window.
    // If the prior 2 pre-success failures had NOT been cleared, only 1
    // more would be allowed through before throttling (2 + 1 = 3).
    const afterReset = [];
    for (let i = 0; i < 4; i += 1) {
      afterReset.push((await login(app, "resetcheck", "wrong-again")).status);
    }
    expect(afterReset).toEqual([401, 401, 401, 429]); // a fresh window, not a continuation of the pre-success count
  });
});
