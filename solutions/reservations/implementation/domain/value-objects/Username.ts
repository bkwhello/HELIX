import { Result, ok, fail, violation } from "../shared/Result.js";

/**
 * R1.2 — Identity & Access.
 *
 * Stored normalized (lowercased) so uniqueness is effectively
 * case-insensitive without a separate display-casing column — "Kelvin"
 * and "kelvin" are the same account, not a collision waiting to happen.
 * displayName (StaffUser) carries whatever casing/spelling a human wants
 * to see; username is purely a stable login handle.
 */
const USERNAME_PATTERN = /^[a-z0-9._-]{3,32}$/;

export class Username {
  private constructor(private readonly value: string) {}

  static create(raw: string): Result<Username> {
    if (typeof raw !== "string" || raw.trim().length === 0) {
      return fail([violation("R1.2-IA-01", "Username is required.")]);
    }
    const normalized = raw.trim().toLowerCase();
    if (!USERNAME_PATTERN.test(normalized)) {
      return fail([
        violation(
          "R1.2-IA-01",
          "Username must be 3-32 characters, lowercase letters/digits/dots/underscores/hyphens only."
        ),
      ]);
    }
    return ok(new Username(normalized));
  }

  toString(): string {
    return this.value;
  }
}
