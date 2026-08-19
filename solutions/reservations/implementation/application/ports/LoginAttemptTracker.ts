/**
 * R1.2 final P1 closure — login abuse protection. A generic, fixed-window
 * failure counter keyed by an opaque string — the caller
 * (application/auth/LoginThrottleGuard.ts) decides what a key means
 * (source address vs normalized username); this port has no opinion.
 */
export interface LoginAttemptTracker {
  /** True iff `key` currently has `count >= maxAttempts` within a window that has not yet expired (`now - windowStart < windowMs`). A window that HAS expired is treated as not-throttled, regardless of its stale count. */
  isThrottled(key: string, now: Date, windowMs: number, maxAttempts: number): Promise<boolean>;

  /**
   * Records one failure for `key`. If no window exists, or the existing
   * one is older than `windowMs`, starts a fresh window (count = 1);
   * otherwise increments the existing window's count. Must be atomic
   * against concurrent callers for the same key — see
   * infrastructure/persistence/PrismaLoginAttemptTracker.ts for why a
   * naive read-then-write would under-count under real concurrent
   * attempts (the exact scenario this exists to defend against).
   */
  recordFailure(key: string, now: Date, windowMs: number): Promise<void>;

  /** Clears any window for `key` entirely (used on successful login — see LoginThrottleGuard for which key(s) this is called on and why). */
  reset(key: string): Promise<void>;
}
