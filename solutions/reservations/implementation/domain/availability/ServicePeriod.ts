/**
 * "Service Period" booking-window eligibility (Chief Engineer R1.6-A
 * assignment). Answers exactly one question: on a given local
 * Europe/Amsterdam date, for a given reservation area, which reservation
 * START TIMES may be offered? Pure, DB-free, no I/O — mirrors
 * AvailabilityEvaluator.ts / BookingPolicy.ts's own pure-function shape,
 * composed with real I/O (ClosingDayStore, ServicePeriodOverrideStore) by
 * application/availability/ServicePeriodService.ts.
 *
 * This module deliberately does NOT evaluate capacity, Teppanyaki 32-person
 * pacing, party size, the same-day 17:00 self-service cutoff, seating,
 * Contact, authentication, or public rate limits (INV-SP08/SP09/SP10) —
 * proof by construction: this file imports nothing from CapacityPool.ts,
 * BookingPolicy.ts, or TeppanyakiSelfServicePacing.ts.
 *
 * NOT the same mechanism as application/ports/ServicePeriodReader.ts /
 * infrastructure/UnvalidatedServicePeriodReader.ts. That existing port is
 * keyed by an opaque, caller-supplied `servicePeriodId` string and is
 * consumed by CreateReservationHandler; it is untouched by this file. This
 * module is keyed by CapacityPoolId (area) + local date/instant instead,
 * and is not yet wired into reservation creation — see
 * R1_6_A_SERVICE_PERIOD_IMPLEMENTATION_REPORT.md §"BookingPolicy
 * Divergence" / §"Known Limitations" for why, and for the separate,
 * substantive divergence this file's own naming has from the capability
 * registry's actual CAP-D02.02 definition (a live per-date service-session
 * lifecycle, not a booking-window calendar).
 */
import { CapacityPoolId } from "./CapacityPool.js";

/** Local minutes-since-midnight, 15-minute-grid aligned relative to firstStartMinute. */
export const SERVICE_PERIOD_GRID_MINUTES = 15;

/**
 * One contiguous booking window. Both bounds are valid reservation START
 * minutes (local, Europe/Amsterdam) — `lastStartMinute` is the LAST valid
 * start, not a close time (INV-SP02/SP03): a reservation's duration may
 * run past it. This type structurally cannot express "must finish by
 * closing time" — there is no end-of-service field anywhere in this
 * module, by design.
 */
export interface BookingWindow {
  readonly firstStartMinute: number;
  readonly lastStartMinute: number;
}

/** Zero or more windows for one local day. Empty = closed that day. */
export type DaySchedule = readonly BookingWindow[];

/**
 * Owner-confirmed normal weekly booking windows (Chief Engineer R1.6-A
 * assignment §2/§28), Europe/Amsterdam local time. Keyed by JS
 * `Date#getDay()` convention (0 = Sunday .. 6 = Saturday) — see
 * ServiceTime.ts's `toLocalDayOfWeek`, which produces this same
 * convention from a real instant via proper IANA timezone conversion.
 *
 * A small, static configuration, not a database-backed entity — same
 * "promote only when a concrete need to change it without a code change
 * actually exists" precedent as CapacityPool.ts's own weekly-stable
 * business constants (product-principles.md PRP-014/PRP-020). Only the
 * date-specific EXCEPTION layer (ServicePeriodOverride, §"Date Overrides")
 * needs real persistence — the weekly recurrence itself does not.
 */
export const DEFAULT_WEEKLY_SCHEDULE: Readonly<Record<number, DaySchedule>> = {
  0: [{ firstStartMinute: 12 * 60, lastStartMinute: 21 * 60 }], // Sunday    12:00-21:00
  1: [{ firstStartMinute: 17 * 60, lastStartMinute: 21 * 60 }], // Monday    17:00-21:00
  2: [{ firstStartMinute: 17 * 60, lastStartMinute: 21 * 60 }], // Tuesday   17:00-21:00
  3: [{ firstStartMinute: 17 * 60, lastStartMinute: 21 * 60 }], // Wednesday 17:00-21:00
  4: [{ firstStartMinute: 17 * 60, lastStartMinute: 21 * 60 }], // Thursday  17:00-21:00
  5: [{ firstStartMinute: 12 * 60, lastStartMinute: 21 * 60 }], // Friday    12:00-21:00
  6: [{ firstStartMinute: 12 * 60, lastStartMinute: 21 * 60 }], // Saturday  12:00-21:00
};

/**
 * Area-specific escape hatch (assignment §8 — "do NOT therefore collapse
 * area out of the model... preserve the ability for area-specific
 * authority"). Empty today: the owner confirmed Sushi and Teppanyaki
 * currently share identical weekly windows, so no area duplicates
 * DEFAULT_WEEKLY_SCHEDULE unless and until a real area-specific weekly
 * divergence is owner-confirmed — `getWeeklySchedule` falls back to the
 * shared default for any area with no entry here.
 */
export const AREA_WEEKLY_SCHEDULE_OVERRIDES: Readonly<Partial<Record<CapacityPoolId, Readonly<Record<number, DaySchedule>>>>> = {};

export function getWeeklySchedule(area: CapacityPoolId): Readonly<Record<number, DaySchedule>> {
  return AREA_WEEKLY_SCHEDULE_OVERRIDES[area] ?? DEFAULT_WEEKLY_SCHEDULE;
}

/** Every 15-minute-grid-aligned start minute across all windows of a day, ascending, deduplicated. */
export function enumerateGridStarts(schedule: DaySchedule): readonly number[] {
  const starts = new Set<number>();
  for (const window of schedule) {
    for (let minute = window.firstStartMinute; minute <= window.lastStartMinute; minute += SERVICE_PERIOD_GRID_MINUTES) {
      starts.add(minute);
    }
  }
  return Array.from(starts).sort((a, b) => a - b);
}

/**
 * Whether `minute` is both inside some window of `schedule` AND
 * grid-aligned relative to that window's own start (not merely aligned to
 * clock :00/:15/:30/:45 globally — every window in this module's current
 * data starts on the hour, so the two happen to coincide today, but a
 * future window starting at a non-hour boundary must still only offer
 * grid-aligned starts relative to ITS OWN start, per INV-SP07).
 */
export function isMinuteWithinDaySchedule(minute: number, schedule: DaySchedule): boolean {
  return schedule.some(
    (window) => minute >= window.firstStartMinute && minute <= window.lastStartMinute && (minute - window.firstStartMinute) % SERVICE_PERIOD_GRID_MINUTES === 0
  );
}

/** "17:00", "21:15", etc. — zero-padded 24-hour local clock time. */
export function formatMinuteOfDay(minute: number): string {
  const hour = Math.floor(minute / 60);
  const min = minute % 60;
  return `${String(hour).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
}

/** A date-specific exception to the weekly schedule (see ServicePeriodOverrideStore) — undefined windows only when status is "Closed". */
export interface DateOverride {
  readonly status: "Open" | "Closed";
  readonly windows: DaySchedule;
}

export type ResolvedDaySchedule = { readonly status: "Open"; readonly windows: DaySchedule } | { readonly status: "Closed" };

/**
 * The single authority for §6's required precedence — the ONLY place this
 * ordering is encoded:
 *
 *   1. explicit full closure (ClosingDay)        -> NO BOOKING STARTS
 *   2. date-specific Service Period override      -> use override
 *   3. weekly Service Period                       -> use weekly schedule
 *
 * `closingDayClosed` and `override` are supplied by the caller
 * (application/availability/ServicePeriodService.ts) after the real,
 * async ClosingDayStore/ServicePeriodOverrideStore lookups — this function
 * itself does no I/O, so every branch of the precedence rule is a single,
 * pure, exhaustively-testable decision table (assignment §16).
 */
export function resolveDaySchedule(input: {
  readonly area: CapacityPoolId;
  readonly dayOfWeek: number;
  readonly closingDayClosed: boolean;
  readonly override?: DateOverride;
}): ResolvedDaySchedule {
  if (input.closingDayClosed) {
    return { status: "Closed" };
  }
  if (input.override) {
    return input.override.status === "Closed" ? { status: "Closed" } : { status: "Open", windows: input.override.windows };
  }
  const weekly = getWeeklySchedule(input.area)[input.dayOfWeek] ?? [];
  return weekly.length === 0 ? { status: "Closed" } : { status: "Open", windows: weekly };
}

export type BookableStartTimesResult = { readonly type: "BOOKABLE"; readonly localStartTimes: readonly string[] } | { readonly type: "CLOSED" };

/** Pure projection from a resolved day schedule to the assignment §9 result shape. */
export function toBookableStartTimesResult(resolved: ResolvedDaySchedule): BookableStartTimesResult {
  if (resolved.status === "Closed") {
    return { type: "CLOSED" };
  }
  return { type: "BOOKABLE", localStartTimes: enumerateGridStarts(resolved.windows).map(formatMinuteOfDay) };
}

/** Pure projection from a resolved day schedule + a specific local minute to the assignment §10 YES/NO result. */
export function isMinuteBookable(minute: number, resolved: ResolvedDaySchedule): boolean {
  return resolved.status === "Open" && isMinuteWithinDaySchedule(minute, resolved.windows);
}

/**
 * R1.6-C0 — the richer, three-way outcome Reservation creation enforcement
 * needs (assignment §12), distinguishing WHY a start is rejected rather
 * than collapsing everything into a single boolean:
 *
 *   CLOSED               — the date itself is not open at all (ClosingDay,
 *                           a Closed override, or an empty weekly day).
 *   OUTSIDE_SERVICE_PERIOD — the date IS open, but this exact minute is
 *                           not within any offered window (or is not
 *                           grid-aligned).
 *   VALID                — an authoritative, offered booking start.
 *
 * No fourth "CONFIGURATION_ERROR" branch is modeled here (see the
 * implementation report's Fail-Closed Behavior section): every
 * currently-reachable "no data" case in resolveDaySchedule already
 * resolves to CLOSED (fail-closed, never silently VALID); a genuine
 * infrastructure fault (e.g. the database is unreachable) propagates as
 * a thrown exception through the async caller chain, which is itself
 * fail-closed by construction — nothing durable can be created if the
 * eligibility check itself never returns.
 */
export type ServicePeriodEligibility = { readonly type: "VALID" } | { readonly type: "OUTSIDE_SERVICE_PERIOD" } | { readonly type: "CLOSED" };

/** Pure projection from a resolved day schedule + a specific local minute to the three-way R1.6-C0 outcome. */
export function evaluateMinuteEligibility(minute: number, resolved: ResolvedDaySchedule): ServicePeriodEligibility {
  if (resolved.status === "Closed") return { type: "CLOSED" };
  return isMinuteWithinDaySchedule(minute, resolved.windows) ? { type: "VALID" } : { type: "OUTSIDE_SERVICE_PERIOD" };
}

/**
 * P1-B2 — the immediate-Walk-in variant of isMinuteWithinDaySchedule:
 * range-only, deliberately WITHOUT the `% SERVICE_PERIOD_GRID_MINUTES`
 * clause. A Walk-in guest is physically present now, at whatever real
 * minute that is (e.g. 18:37) — the 15-minute grid exists to keep the
 * OFFERED advance-booking calendar enumerable (enumerateGridStarts), a
 * concern that does not apply to an instant that has already happened.
 * "Restaurant/service period is currently open for the requested area"
 * is still fully enforced — only grid-alignment is not.
 */
export function isMinuteWithinOpenHours(minute: number, schedule: DaySchedule): boolean {
  return schedule.some((window) => minute >= window.firstStartMinute && minute <= window.lastStartMinute);
}

/** P1-B2 — the immediate-Walk-in counterpart to evaluateMinuteEligibility: same CLOSED/OUTSIDE_SERVICE_PERIOD/VALID vocabulary, range-only (see isMinuteWithinOpenHours). Consumed only by ServicePeriodService.evaluateImmediateEligibility / AvailabilityOrchestrator.createImmediateWalkIn — never by the ordinary advance-booking path. */
export function evaluateOpenHoursEligibility(minute: number, resolved: ResolvedDaySchedule): ServicePeriodEligibility {
  if (resolved.status === "Closed") return { type: "CLOSED" };
  return isMinuteWithinOpenHours(minute, resolved.windows) ? { type: "VALID" } : { type: "OUTSIDE_SERVICE_PERIOD" };
}
