import { describe, it, expect } from "vitest";
import { LoginThrottleGuard, LoginThrottleConfig } from "../../application/auth/LoginThrottleGuard.js";
import { LoginAttemptTracker } from "../../application/ports/LoginAttemptTracker.js";

const NOW = new Date("2026-08-01T10:00:00Z");
class FixedClock {
  now(): Date {
    return NOW;
  }
}

const TEST_CONFIG: LoginThrottleConfig = {
  sourceWindowMs: 1000,
  sourceMaxAttempts: 3,
  usernameWindowMs: 1000,
  usernameMaxAttempts: 3,
};

/** Records every call for assertion, and lets each test control per-key return values — the window/expiry MECHANICS themselves belong to PrismaLoginAttemptTracker's own tests (real Postgres); this is purely about LoginThrottleGuard's key-derivation and dimension-combination logic. */
class SpyLoginAttemptTracker implements LoginAttemptTracker {
  readonly isThrottledCalls: string[] = [];
  readonly recordFailureCalls: string[] = [];
  readonly resetCalls: string[] = [];
  throttledKeys = new Set<string>();

  async isThrottled(key: string): Promise<boolean> {
    this.isThrottledCalls.push(key);
    return this.throttledKeys.has(key);
  }
  async recordFailure(key: string): Promise<void> {
    this.recordFailureCalls.push(key);
  }
  async reset(key: string): Promise<void> {
    this.resetCalls.push(key);
  }
}

describe("LoginThrottleGuard — key derivation", () => {
  it("normalizes the username (lowercase, trimmed) into the username key, distinct from the source key", async () => {
    const tracker = new SpyLoginAttemptTracker();
    const guard = new LoginThrottleGuard(tracker, new FixedClock(), TEST_CONFIG);

    await guard.isThrottled({ username: "  Kelvin  ", sourceAddress: "203.0.113.5" });

    expect(tracker.isThrottledCalls).toContain("username:kelvin");
    expect(tracker.isThrottledCalls).toContain("source:203.0.113.5");
  });

  it("applies the throttle key uniformly to a username that does not correspond to any real account (no enumeration signal from key shape)", async () => {
    const tracker = new SpyLoginAttemptTracker();
    const guard = new LoginThrottleGuard(tracker, new FixedClock(), TEST_CONFIG);

    await guard.recordFailure({ username: "totally-made-up-user", sourceAddress: "203.0.113.5" });

    expect(tracker.recordFailureCalls).toContain("username:totally-made-up-user");
  });
});

describe("LoginThrottleGuard — isThrottled combines both dimensions", () => {
  it("is throttled if the SOURCE dimension alone is over its limit", async () => {
    const tracker = new SpyLoginAttemptTracker();
    tracker.throttledKeys.add("source:1.2.3.4");
    const guard = new LoginThrottleGuard(tracker, new FixedClock(), TEST_CONFIG);

    expect(await guard.isThrottled({ username: "someone", sourceAddress: "1.2.3.4" })).toBe(true);
  });

  it("is throttled if the USERNAME dimension alone is over its limit", async () => {
    const tracker = new SpyLoginAttemptTracker();
    tracker.throttledKeys.add("username:someone");
    const guard = new LoginThrottleGuard(tracker, new FixedClock(), TEST_CONFIG);

    expect(await guard.isThrottled({ username: "someone", sourceAddress: "1.2.3.4" })).toBe(true);
  });

  it("is NOT throttled when neither dimension is over its limit", async () => {
    const tracker = new SpyLoginAttemptTracker();
    const guard = new LoginThrottleGuard(tracker, new FixedClock(), TEST_CONFIG);

    expect(await guard.isThrottled({ username: "someone", sourceAddress: "1.2.3.4" })).toBe(false);
  });
});

describe("LoginThrottleGuard — recordFailure records BOTH dimensions", () => {
  it("calls recordFailure for both the source key and the username key on every failure", async () => {
    const tracker = new SpyLoginAttemptTracker();
    const guard = new LoginThrottleGuard(tracker, new FixedClock(), TEST_CONFIG);

    await guard.recordFailure({ username: "someone", sourceAddress: "1.2.3.4" });

    expect(tracker.recordFailureCalls.sort()).toEqual(["source:1.2.3.4", "username:someone"]);
  });
});

describe("LoginThrottleGuard — recordSuccess resets ONLY the username dimension", () => {
  it("does not touch the source dimension on success — see the file header for why", async () => {
    const tracker = new SpyLoginAttemptTracker();
    const guard = new LoginThrottleGuard(tracker, new FixedClock(), TEST_CONFIG);

    await guard.recordSuccess({ username: "someone" });

    expect(tracker.resetCalls).toEqual(["username:someone"]);
  });
});
