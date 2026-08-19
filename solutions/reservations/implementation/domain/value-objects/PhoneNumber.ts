import { parsePhoneNumberFromString } from "libphonenumber-js";
import { Result, ok, fail, violation } from "../shared/Result.js";

/**
 * CAP-D05.01-R05 — Phone Normalization Uses A Maintained Library.
 *
 * R1.3-I1 final gate correction: the original implementation used a
 * bounded, hand-written NL-first normalizer (see git history). The
 * Chief Engineer's actual intent — lost to a truncated instruction in
 * the original assignment — was a maintained international
 * parsing/normalization library, so HELIX does not build or maintain
 * its own numbering-plan database. Corrected here.
 *
 * `libphonenumber-js` was selected: a widely-used, actively maintained
 * (weekly releases), zero-dependency, TypeScript-typed port of Google's
 * libphonenumber metadata, small enough for server-side use without a
 * bundler (unlike `google-libphonenumber`, which ships the full
 * Java-derived API surface and a heavier metadata format for the same
 * data). See R1_3_I1_CAP_D05_01_IMPLEMENTATION_REPORT.md's final-gate
 * addendum for the full evaluation.
 *
 * `defaultCountry` ("NL") only affects how a NATIONAL-format number
 * (e.g. "06 12345678", no country code) is interpreted — it does not
 * override an explicit country code (a "+1 ..." or "+44 ..." number is
 * parsed as-is regardless of this default). This is what lets
 * "06 12345678", "+31 6 12345678", and "0031 6 12345678" all resolve to
 * the same E.164 value while still correctly handling a non-Dutch
 * guest's international number.
 *
 * Returns `undefined`, not a guess, when the input cannot be parsed
 * into a valid number — CAP-D05.01-R05's "must not be silently
 * transformed into a different telephone number." An unparseable
 * number is still accepted as raw Contact data (this codebase does not
 * reject a phone number for failing E.164 validity — CAP-D05.01-R01's
 * only requirement is non-blank); it simply cannot participate in
 * normalized possible-match discovery, which is a safe degradation
 * (no match found), not a data-integrity risk.
 */
export function normalizePhone(raw: string, defaultCountry: "NL" = "NL"): string | undefined {
  const trimmed = raw.trim();
  if (trimmed.length === 0) return undefined;
  const parsed = parsePhoneNumberFromString(trimmed, defaultCountry);
  if (!parsed || !parsed.isValid()) return undefined;
  return parsed.number; // E.164, e.g. "+31612345678"
}

/**
 * CAP-D05.01 — a Reservation Contact's phone number. Preserves both the
 * raw, as-typed value (reservation-time snapshots and display must show
 * what the guest/staff actually entered) and, when the input parses to
 * a valid number, a canonical E.164 comparison value (used only for
 * possible-match discovery, never for identity — see CAP-D05.01-R03).
 */
export class PhoneNumber {
  private constructor(
    private readonly raw: string,
    private readonly normalized: string | undefined
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

  /** Undefined when the raw value could not be parsed into a valid number — never a guessed/wrong value. */
  getNormalized(): string | undefined {
    return this.normalized;
  }
}
