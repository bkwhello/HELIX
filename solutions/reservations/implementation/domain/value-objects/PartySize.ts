import { Result, ok, fail, violation } from "../shared/Result.js";

/**
 * CAP-D01.01-R09 — Party Size Must Be Positive
 *
 * Party size shall be a whole number greater than zero.
 * Zero, negative, fractional, or non-numeric party sizes are invalid.
 */
export class PartySize {
  private constructor(private readonly value: number) {}

  static create(value: number): Result<PartySize> {
    if (!Number.isFinite(value)) {
      return fail([violation("CAP-D01.01-R09", "Party size must be a number.")]);
    }
    if (!Number.isInteger(value)) {
      return fail([violation("CAP-D01.01-R09", "Party size must be a whole number.")]);
    }
    if (value <= 0) {
      return fail([violation("CAP-D01.01-R09", "Party size must be greater than zero.")]);
    }
    return ok(new PartySize(value));
  }

  toNumber(): number {
    return this.value;
  }
}
