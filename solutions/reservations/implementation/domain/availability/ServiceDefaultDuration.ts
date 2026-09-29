/**
 * R1.6-P3D-1 — a Service's optional default reservation duration, in
 * whole minutes. Deliberately a SEPARATE concept from
 * `ServiceOperatingInterval.ts` (a planning start/end pair) and from
 * `CapacityPool.ts`'s own `durationMinutes` (the live, area-keyed
 * capacity/seating duration authority, unaffected by anything here — see
 * the P3D design gate report). This value never influences capacity,
 * availability, seating timing, or Floor-view timing; it is a planning
 * default only, read the same way `defaultOperatingInterval` already is.
 *
 * `null` (absence of a configured value) is handled entirely OUTSIDE this
 * file, by every caller — the constructor below only ever validates a
 * real, supplied number.
 */

export class InvalidServiceDefaultDurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidServiceDefaultDurationError";
  }
}

export const SERVICE_DEFAULT_DURATION_MIN_MINUTES = 15;
export const SERVICE_DEFAULT_DURATION_MAX_MINUTES = 480;
export const SERVICE_DEFAULT_DURATION_STEP_MINUTES = 15;

/**
 * The one, pure constructor this value is built through — every caller
 * validates via this, never by hand. Throws (never silently coerces or
 * clamps) on any malformed input. No I/O, and no Service, ServiceSession,
 * capacity, or Reservation lookup of any kind.
 */
export function createServiceDefaultDuration(minutes: number): number {
  if (!Number.isInteger(minutes)) {
    throw new InvalidServiceDefaultDurationError(`Service default duration must be an integer number of minutes; received ${String(minutes)}.`);
  }
  if (minutes < SERVICE_DEFAULT_DURATION_MIN_MINUTES || minutes > SERVICE_DEFAULT_DURATION_MAX_MINUTES) {
    throw new InvalidServiceDefaultDurationError(
      `Service default duration must be between ${SERVICE_DEFAULT_DURATION_MIN_MINUTES} and ${SERVICE_DEFAULT_DURATION_MAX_MINUTES} minutes inclusive; received ${minutes}.`
    );
  }
  if (minutes % SERVICE_DEFAULT_DURATION_STEP_MINUTES !== 0) {
    throw new InvalidServiceDefaultDurationError(`Service default duration must be a multiple of ${SERVICE_DEFAULT_DURATION_STEP_MINUTES} minutes; received ${minutes}.`);
  }
  return minutes;
}
