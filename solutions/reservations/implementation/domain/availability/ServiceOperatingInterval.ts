/**
 * R1.6-P3C-1 — one atomic (startMinute, endMinute) pair, Europe/Amsterdam
 * local wall-time minutes-since-midnight — same unit convention as
 * ServicePeriod.ts's own BookingWindow. End is EXCLUSIVE, mirroring
 * Service.ts's own `[12:00,16:00)` lunch-boundary convention exactly.
 * Overnight intervals are unsupported: `endMinute` must be strictly
 * greater than `startMinute` within the same [0,1440) day.
 *
 * Per the R1.6-P3C-A design addendum's accepted decisions: this is
 * planning/display metadata only. It does not affect `deriveServiceCode`
 * classification, booking-window eligibility, capacity, seating, or
 * ServiceSession open/close/cancel transitions. No duration field exists
 * here or anywhere else in this milestone. No cross-Service (lunch vs.
 * dinner) overlap rule exists — each Service's interval is independently
 * valid or invalid on its own terms only.
 *
 * Always represented as ONE atomic value at the domain/API boundary —
 * never as two independent optional numbers — see this file's own
 * `parsePersistedServiceOperatingInterval` for the one place a two-column
 * database representation is reconciled into this single value.
 */
export interface ServiceOperatingInterval {
  readonly startMinute: number;
  readonly endMinute: number;
}

export class InvalidServiceOperatingIntervalError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidServiceOperatingIntervalError";
  }
}

/**
 * The one, pure constructor for this value — every caller builds the
 * shape through this, never by hand. Throws (never silently coerces) on
 * any malformed input.
 *
 * Rule identifiers for this validation are provisional — CAP-D02.01 has
 * no external assignment-defined rule sequence (unlike CAP-D01.01's own
 * R01-R51); see the R1.6-P3C-A addendum's Correction 6. No RuleViolation
 * is raised here in P3C-1 specifically because no user-facing write path
 * accepts this value yet (`PATCH /services/:code` does not accept
 * `defaultOperatingInterval` until P3C-2) — this constructor is consulted
 * only by repository read-mapping and direct domain tests in this
 * milestone, so a thrown error is the correct signal, not a 422 envelope.
 */
export function createServiceOperatingInterval(startMinute: number, endMinute: number): ServiceOperatingInterval {
  if (!Number.isInteger(startMinute) || startMinute < 0 || startMinute > 1439) {
    throw new InvalidServiceOperatingIntervalError(`startMinute must be an integer in [0, 1439]; received ${String(startMinute)}.`);
  }
  if (!Number.isInteger(endMinute) || endMinute < 1 || endMinute > 1440) {
    throw new InvalidServiceOperatingIntervalError(`endMinute must be an integer in [1, 1440]; received ${String(endMinute)}.`);
  }
  if (endMinute <= startMinute) {
    throw new InvalidServiceOperatingIntervalError(
      `endMinute (${endMinute}) must be greater than startMinute (${startMinute}) — overnight intervals are not supported.`
    );
  }
  return { startMinute, endMinute };
}

/**
 * Reconciles a nullable-pair persisted representation (two database
 * columns) into the single atomic domain value. Both columns null ->
 * absence (`null`, meaning "not configured"). Exactly one null is a
 * malformed persisted pair — REJECTED by throwing, never silently
 * coerced to `null` or to a guessed value. The database's own paired-
 * nullability CHECK constraint (prisma/schema.prisma) is the primary
 * defense against this state ever existing; this function is the
 * secondary, defense-in-depth boundary at the application layer.
 */
export function parsePersistedServiceOperatingInterval(
  startMinute: number | null,
  endMinute: number | null
): ServiceOperatingInterval | null {
  if (startMinute === null && endMinute === null) return null;
  if (startMinute === null || endMinute === null) {
    throw new InvalidServiceOperatingIntervalError(
      `persisted operating interval is partially populated (startMinute=${String(startMinute)}, endMinute=${String(endMinute)}) — both columns must be null or both non-null.`
    );
  }
  return createServiceOperatingInterval(startMinute, endMinute);
}
