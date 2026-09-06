import { StaffUserRepository } from "../../domain/repositories/StaffUserRepository.js";
import { SessionRepository } from "../../domain/repositories/SessionRepository.js";
import { StaffUserStatus } from "../../domain/value-objects/StaffUserStatus.js";
import { Username } from "../../domain/value-objects/Username.js";
import { ActorRole } from "../../domain/value-objects/Actor.js";
import { hashSessionToken } from "../../domain/shared/hashSessionToken.js";
import { PasswordHasher } from "../ports/PasswordHasher.js";
import { SessionTokenGenerator } from "../ports/SessionTokenGenerator.js";
import { Clock } from "../ports/Clock.js";
import { SecurityEventRecorder } from "../ports/SecurityEventRecorder.js";

export type LoginResult =
  | {
      readonly type: "SUCCESS";
      readonly sessionToken: string;
      readonly expiresAt: Date;
      readonly staffUser: { readonly id: string; readonly username: string; readonly displayName: string; readonly role: ActorRole };
    }
  /**
   * Deliberately ONE outcome for "username doesn't exist," "password is
   * wrong," and "account is Disabled" — R1_2_IDENTITY_ACCESS_FINAL_ARCHITECTURE.md
   * §8: a caller must not be able to distinguish these. The real reason
   * is still recorded server-side (R1.2-P2 — SecurityEventRecorder,
   * type "LoginFailed") for the Owner's own later visibility — it just
   * never crosses the response boundary (see `handle()`'s own
   * `recordLoginFailure` calls, whose input never includes this
   * `reason` string verbatim in anything returned to the caller).
   */
  | { readonly type: "INVALID_CREDENTIALS"; readonly reason: "unknown-username" | "bad-password" | "disabled" };

// A syntactically valid scrypt-format hash that decrypts to nothing real —
// used only to keep verify() timing consistent when no user row exists to
// compare against, so "unknown username" and "wrong password" take
// approximately the same wall-clock time (timing-based account
// enumeration is a real, not just message-content, concern).
const DUMMY_HASH = `scrypt$16384$8$1$${"00".repeat(16)}$${"00".repeat(64)}`;

export class LoginHandler {
  constructor(
    private readonly staffUserRepository: StaffUserRepository,
    private readonly sessionRepository: SessionRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly sessionTokenGenerator: SessionTokenGenerator,
    private readonly clock: Clock,
    private readonly sessionLifetimeMs: number,
    private readonly securityEventRecorder: SecurityEventRecorder
  ) {}

  /**
   * R1.2-P2 — awaited but best-effort: a recording failure must never
   * change, block, or replace the login outcome. Caught here, at the
   * application boundary, with a FIXED, non-interpolated diagnostic — no
   * exception message/stack/cause, no reason code, no target id, and no
   * other event payload is ever passed to the logger (Chief Engineer
   * logging-safety correction: even the caught exception's own message
   * could echo back attacker-influenced input in some future recorder
   * implementation, so nothing from `err` is logged, not even
   * conditionally).
   */
  private async recordLoginFailure(
    reason: "unknown-username" | "bad-password" | "disabled",
    targetStaffUserId: string | null
  ): Promise<void> {
    const mapped = reason === "unknown-username" ? "UNKNOWN_USERNAME" : reason === "bad-password" ? "INVALID_PASSWORD" : "ACCOUNT_DISABLED";
    try {
      await this.securityEventRecorder.recordLoginFailure({ reason: mapped, targetStaffUserId });
    } catch {
      console.error("LoginHandler: security event recording failed");
    }
  }

  async handle(input: { readonly username: string; readonly password: string }): Promise<LoginResult> {
    const usernameResult = Username.create(input.username);
    if (!usernameResult.ok) {
      await this.passwordHasher.verify(input.password, DUMMY_HASH);
      await this.recordLoginFailure("unknown-username", null);
      return { type: "INVALID_CREDENTIALS", reason: "unknown-username" };
    }

    const user = await this.staffUserRepository.findByUsername(usernameResult.value.toString());
    if (!user) {
      await this.passwordHasher.verify(input.password, DUMMY_HASH);
      await this.recordLoginFailure("unknown-username", null);
      return { type: "INVALID_CREDENTIALS", reason: "unknown-username" };
    }

    const passwordOk = await this.passwordHasher.verify(input.password, user.passwordHash);
    if (!passwordOk) {
      await this.recordLoginFailure("bad-password", user.id);
      return { type: "INVALID_CREDENTIALS", reason: "bad-password" };
    }

    // Checked AFTER verifying the password (not before): checking status
    // first would let a caller learn "this username exists and is
    // disabled" without ever supplying a correct password, via response
    // TIMING alone (skipping the scrypt verify entirely) — checking after
    // keeps the cost, and therefore the timing, uniform for every
    // wrong-password-shaped rejection.
    if (user.status !== StaffUserStatus.Active) {
      await this.recordLoginFailure("disabled", user.id);
      return { type: "INVALID_CREDENTIALS", reason: "disabled" };
    }

    const rawToken = this.sessionTokenGenerator.generate();
    const expiresAt = new Date(this.clock.now().getTime() + this.sessionLifetimeMs);
    await this.sessionRepository.create({ hashedToken: hashSessionToken(rawToken), staffUserId: user.id, expiresAt });

    return {
      type: "SUCCESS",
      sessionToken: rawToken,
      expiresAt,
      staffUser: { id: user.id, username: user.username, displayName: user.displayName, role: user.role },
    };
  }
}
