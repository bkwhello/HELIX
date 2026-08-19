import { Result, ok, fail, violation } from "../shared/Result.js";

/**
 * CAP-D05.01-R05 — Phone Normalization Is Bounded, Not a General Parser.
 *
 * A bounded, NL-first normalizer, deliberately not a maintained
 * third-party phone-parsing library (e.g. libphonenumber). The R1.3
 * architecture investigation (§13) found no evidence in this repository
 * of a guest base broad enough to justify that dependency yet — this
 * covers the documented cases (Dutch mobile/landline written as 06...,
 * 0..., 0031..., or already-international +...) and passes through
 * anything else unchanged rather than guessing. Revisit if real
 * international volume is observed.
 *
 * Not a validating parser: this never rejects a number for being
 * "invalid" in some dialing-plan sense — it only removes formatting
 * noise (spaces, hyphens, parentheses, dots) and normalizes the leading
 * country-code representation, so two different-looking but equivalent
 * written forms compare equal for possible-match discovery
 * (CAP-D05.01-R03).
 */
export function normalizePhone(raw: string): string {
  const stripped = raw.trim().replace(/[\s\-().]/g, "");
  if (stripped.startsWith("+")) {
    return "+" + stripped.slice(1).replace(/\D/g, "");
  }
  if (stripped.startsWith("0031")) {
    return "+31" + stripped.slice(4).replace(/\D/g, "");
  }
  if (stripped.startsWith("0")) {
    // NL trunk prefix (e.g. 06..., 020...) — drop the leading 0, prefix +31.
    return "+31" + stripped.slice(1).replace(/\D/g, "");
  }
  return stripped.replace(/\D/g, "");
}

/**
 * CAP-D05.01 — a Reservation Contact's phone number. Preserves both the
 * raw, as-typed value (reservation-time snapshots and display must show
 * what the guest/staff actually entered) and a normalized comparison
 * value (used only for possible-match discovery, never for identity —
 * see CAP-D05.01-R03).
 */
export class PhoneNumber {
  private constructor(
    private readonly raw: string,
    private readonly normalized: string
  ) {}

  static create(raw: string): Result<PhoneNumber> {
    const trimmed = raw.trim();
    if (trimmed.length === 0) {
      return fail([violation("CAP-D05.01-R01", "A phone number, if supplied, must not be blank.")]);
    }
    return ok(new PhoneNumber(trimmed, normalizePhone(trimmed)));
  }

  getRaw(): string {
    return this.raw;
  }

  getNormalized(): string {
    return this.normalized;
  }
}
