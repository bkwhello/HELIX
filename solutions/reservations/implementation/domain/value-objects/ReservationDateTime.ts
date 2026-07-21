import { Result, ok, fail, violation } from "../shared/Result.js";

/**
 * CAP-D01.01-R10 — Reservation Date and Time Must Be Valid
 *
 * Structural validity only. Whether the date/time is in the past
 * (CAP-D01.01-R11) is a contextual rule evaluated at creation time,
 * not a structural property of the value itself — it depends on "now",
 * which this value object deliberately does not know about.
 */
export class ReservationDateTime {
  private constructor(private readonly value: Date) {}

  static create(value: Date): Result<ReservationDateTime> {
    if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
      return fail([violation("CAP-D01.01-R10", "Reservation date and time must form a valid date-time value.")]);
    }
    return ok(new ReservationDateTime(value));
  }

  isBefore(reference: Date): boolean {
    return this.value.getTime() < reference.getTime();
  }

  toDate(): Date {
    return new Date(this.value.getTime());
  }
}
