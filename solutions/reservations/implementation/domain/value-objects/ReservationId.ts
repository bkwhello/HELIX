import { Result, ok, fail, violation } from "../shared/Result.js";

/**
 * CAP-D01.01-R01 — Reservation Identity Is Required
 * CAP-D01.01-R02 — Reservation Identity Is Immutable
 *
 * The value itself is generated outside the domain (application layer,
 * via an IdGenerator port) so this value object stays pure and deterministic.
 * Once constructed, a ReservationId never changes.
 */
export class ReservationId {
  private constructor(private readonly value: string) {}

  static create(value: string): Result<ReservationId> {
    if (!value || value.trim().length === 0) {
      return fail([violation("CAP-D01.01-R01", "Reservation Identity is required and cannot be empty.")]);
    }
    return ok(new ReservationId(value));
  }

  equals(other: ReservationId): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
