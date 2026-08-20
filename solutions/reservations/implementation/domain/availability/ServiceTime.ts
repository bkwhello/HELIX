/**
 * CAP-D02.03 — Europe/Amsterdam local-time helpers.
 *
 * Uses `Intl.DateTimeFormat` with an explicit IANA `timeZone`, never a
 * fixed UTC offset (+01:00/+02:00) and never naive UTC-date-slicing.
 * `PrismaClosingDayStore.ts` already documents this exact bug class for
 * date handling in this codebase (see its `startOfDay` comment); the same
 * reasoning applies here with the additional wrinkle that Europe/Amsterdam
 * observes DST, so a fixed offset is wrong for roughly half the year, and
 * naive UTC-date-slicing is wrong near local midnight year-round.
 * `Intl.DateTimeFormat` resolves the IANA tzdata rules (including the
 * exact DST transition instants) internally, so this stays correct
 * without hand-maintained transition dates.
 */
import { RESTAURANT_TIMEZONE } from "./CapacityPool.js";

const localDateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: RESTAURANT_TIMEZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** en-CA formats as YYYY-MM-DD directly, so no manual reassembly of parts is needed. */
export function toLocalServiceDate(instant: Date): string {
  return localDateFormatter.format(instant);
}

const localTimeFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: RESTAURANT_TIMEZONE,
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

export interface LocalHourMinute {
  readonly hour: number;
  readonly minute: number;
}

export function toLocalHourMinute(instant: Date): LocalHourMinute {
  const parts = localTimeFormatter.formatToParts(instant);
  const hourPart = parts.find((p) => p.type === "hour");
  const minutePart = parts.find((p) => p.type === "minute");
  if (!hourPart || !minutePart) {
    throw new Error("toLocalHourMinute: Intl.DateTimeFormat did not return hour/minute parts.");
  }
  // Intl's 24-hour format uses "24" for midnight in some locales/environments;
  // normalize it to 0 so downstream hour comparisons behave as expected.
  const hour = Number(hourPart.value) % 24;
  return { hour, minute: Number(minutePart.value) };
}

/** `hour*60 + minute`, local Europe/Amsterdam minutes-since-midnight — the unit domain/availability/ServicePeriod.ts's BookingWindow operates in. */
export function toLocalMinuteOfDay(instant: Date): number {
  const { hour, minute } = toLocalHourMinute(instant);
  return hour * 60 + minute;
}

/**
 * `Date#getDay()` convention (0 = Sunday .. 6 = Saturday) from an already-
 * correct local "YYYY-MM-DD" string (e.g. `toLocalServiceDate`'s own
 * output). Constructing a UTC-midnight Date from the Y/M/D components of a
 * string that is already the correct local calendar date is timezone-
 * independent — no further conversion is needed once the correct Y-M-D
 * triple is known.
 */
export function dayOfWeekFromLocalDate(localDate: string): number {
  const [year, month, day] = localDate.split("-").map(Number) as [number, number, number];
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

/**
 * `Date#getDay()` convention (0 = Sunday .. 6 = Saturday), derived via
 * `toLocalServiceDate` rather than a second Intl weekday lookup — see
 * `dayOfWeekFromLocalDate`'s own comment on why this cannot reintroduce
 * the naive-UTC-slicing bug class this file's header warns about.
 */
export function toLocalDayOfWeek(instant: Date): number {
  return dayOfWeekFromLocalDate(toLocalServiceDate(instant));
}
