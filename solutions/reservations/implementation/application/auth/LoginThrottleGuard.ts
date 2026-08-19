import { LoginAttemptTracker } from "../ports/LoginAttemptTracker.js";
import { Clock } from "../ports/Clock.js";

/**
 * R1.2 final P1 closure — login abuse protection
 * (R1_2_LOGIN_ABUSE_PROTECTION_REPORT.md). Two independent dimensions,
 * both required (§4 of the assignment):
 *
 *   - per SOURCE address: catches credential stuffing / broad automated
 *     sweeps (many usernames from one origin). Deliberately more
 *     permissive than the per-username limit — a shared NAT/office
 *     network legitimately produces bursts of unrelated staff logins.
 *   - per NORMALIZED USERNAME: catches a targeted attack against one
 *     known-or-guessed account, regardless of which source(s) it comes
 *     from (distributed brute force).
 *
 * A request is throttled if EITHER dimension's window is at or past its
 * limit — the stricter of the two always wins, per §4's "at least"
 * wording (this is not a weighted/combined score, just two independent
 * gates).
 *
 * Applied to EVERY submitted username string, not just ones that
 * resolve to a real StaffUser — an unknown username accumulates
 * failures identically to a real one, so the throttling behavior itself
 * creates no username-enumeration signal (§5). The window keys are
 * intentionally never logged or exposed in any response.
 */
export interface LoginThrottleConfig {
  readonly sourceWindowMs: number;
  readonly sourceMaxAttempts: number;
  readonly usernameWindowMs: number;
  readonly usernameMaxAttempts: number;
}

/**
 * Defaults, not hard architecture — operational tuning, same category as
 * DEFAULT_SESSION_LIFETIME_MS (api/app.ts). 5 failed attempts per
 * username / 15 minutes is tight enough to make online password
 * guessing impractical without being likely to catch a real staff
 * member mistyping their own password a few times; 20 per source / 15
 * minutes is deliberately looser, since the username dimension is the
 * primary defense for a targeted account and the source dimension only
 * needs to catch broad, high-volume sweeps.
 */
export const DEFAULT_LOGIN_THROTTLE_CONFIG: LoginThrottleConfig = {
  sourceWindowMs: 15 * 60 * 1000,
  sourceMaxAttempts: 20,
  usernameWindowMs: 15 * 60 * 1000,
  usernameMaxAttempts: 5,
};

export class LoginThrottleGuard {
  constructor(
    private readonly tracker: LoginAttemptTracker,
    private readonly clock: Clock,
    private readonly config: LoginThrottleConfig = DEFAULT_LOGIN_THROTTLE_CONFIG
  ) {}

  private sourceKey(sourceAddress: string): string {
    return `source:${sourceAddress}`;
  }

  private usernameKey(username: string): string {
    return `username:${username.trim().toLowerCase()}`;
  }

  async isThrottled(input: { readonly username: string; readonly sourceAddress: string }): Promise<boolean> {
    const now = this.clock.now();
    const [sourceThrottled, usernameThrottled] = await Promise.all([
      this.tracker.isThrottled(this.sourceKey(input.sourceAddress), now, this.config.sourceWindowMs, this.config.sourceMaxAttempts),
      this.tracker.isThrottled(this.usernameKey(input.username), now, this.config.usernameWindowMs, this.config.usernameMaxAttempts),
    ]);
    return sourceThrottled || usernameThrottled;
  }

  async recordFailure(input: { readonly username: string; readonly sourceAddress: string }): Promise<void> {
    const now = this.clock.now();
    await Promise.all([
      this.tracker.recordFailure(this.sourceKey(input.sourceAddress), now, this.config.sourceWindowMs),
      this.tracker.recordFailure(this.usernameKey(input.username), now, this.config.usernameWindowMs),
    ]);
  }

  /**
   * §6 — only the USERNAME dimension resets on success, deliberately not
   * the source dimension too. Resetting source-on-success would let one
   * lucky/weak-password hit from a credential-stuffing source wipe that
   * source's entire suspicious-activity history, handing it a fresh
   * budget to keep probing OTHER accounts from the same origin — exactly
   * backwards for what the source dimension exists to catch. The
   * username's own history, by contrast, is legitimately moot the moment
   * its rightful owner proves themselves.
   */
  async recordSuccess(input: { readonly username: string }): Promise<void> {
    await this.tracker.reset(this.usernameKey(input.username));
  }
}
