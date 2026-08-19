import { Result, ok, fail, violation } from "../shared/Result.js";

/**
 * CAP-D05.01 — trim + lowercase. The local part of an email address is
 * technically case-sensitive per RFC 5321, but case-insensitive
 * treatment is the overwhelming real-world convention (see the R1.3
 * architecture investigation §14) and matches how Username is already
 * normalized in this codebase (domain/value-objects/Username.ts).
 */
export function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * CAP-D05.01 — a Reservation Contact's email address. Email is never
 * treated as identity (CAP-D05.01-R03 / R1.3 architecture investigation
 * §14: a shared inbox may belong to more than one guest), so this value
 * object exists only to normalize for possible-match discovery and
 * preserve the raw, as-typed value for display/snapshots.
 */
export class EmailAddress {
  private constructor(
    private readonly raw: string,
    private readonly normalized: string
  ) {}

  static create(raw: string): Result<EmailAddress> {
    const trimmed = raw.trim();
    if (trimmed.length === 0 || !EMAIL_SHAPE.test(trimmed)) {
      return fail([violation("CAP-D05.01-R01", "An email address, if supplied, must be a plausible email address.")]);
    }
    return ok(new EmailAddress(trimmed, normalizeEmail(trimmed)));
  }

  getRaw(): string {
    return this.raw;
  }

  getNormalized(): string {
    return this.normalized;
  }
}
