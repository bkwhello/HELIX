import { describe, it, expect } from "vitest";
import { toLocalServiceDate, toLocalHourMinute, toLocalDayOfWeek, dayOfWeekFromLocalDate, localDateToPaddedUtcRange } from "../../domain/availability/ServiceTime.js";

/**
 * CAP-D02.03 §timezone — Europe/Amsterdam correctness, both 2026 DST
 * transitions. Verified independently: Jan 1 2026 is a Thursday (2026 is
 * not a leap year), so by day-of-year arithmetic March 29 2026 and
 * October 25 2026 are both Sundays — the last Sunday of their respective
 * months, which is the EU DST transition rule (clocks change at 01:00
 * UTC). These dates are not hand-picked constants baked into the
 * production code (Intl resolves them from IANA tzdata) — they exist
 * only here, to pin the expected wall-clock results for the test.
 */
describe("toLocalServiceDate / toLocalHourMinute — ordinary (non-transition) instants", () => {
  it("converts a UTC winter instant (CET, UTC+1) to the correct Amsterdam local date and time", () => {
    // 2026-01-15T23:30:00Z -> 2026-01-16T00:30 CET (past local midnight)
    const instant = new Date("2026-01-15T23:30:00Z");
    expect(toLocalServiceDate(instant)).toBe("2026-01-16");
    expect(toLocalHourMinute(instant)).toEqual({ hour: 0, minute: 30 });
  });

  it("converts a UTC summer instant (CEST, UTC+2) to the correct Amsterdam local date and time", () => {
    // 2026-07-15T16:00:00Z -> 2026-07-15T18:00 CEST
    const instant = new Date("2026-07-15T16:00:00Z");
    expect(toLocalServiceDate(instant)).toBe("2026-07-15");
    expect(toLocalHourMinute(instant)).toEqual({ hour: 18, minute: 0 });
  });
});

describe("toLocalServiceDate / toLocalHourMinute — 2026-03-29 spring-forward transition (CET -> CEST)", () => {
  it("resolves the correct local wall-clock time on both sides of the 01:00 UTC transition instant", () => {
    // 00:59 UTC = 01:59 CET (last minute of standard time)
    const beforeTransition = new Date("2026-03-29T00:59:00Z");
    expect(toLocalHourMinute(beforeTransition)).toEqual({ hour: 1, minute: 59 });

    // 01:00 UTC = 03:00 CEST (clocks jump 02:00 -> 03:00; 02:00-02:59 local never occurs)
    const atTransition = new Date("2026-03-29T01:00:00Z");
    expect(toLocalHourMinute(atTransition)).toEqual({ hour: 3, minute: 0 });

    expect(toLocalServiceDate(beforeTransition)).toBe("2026-03-29");
    expect(toLocalServiceDate(atTransition)).toBe("2026-03-29");
  });

  it("does not use a fixed UTC offset — the same clock-hour UTC maps to different local hours before/after the transition week", () => {
    const dayBefore = new Date("2026-03-28T12:00:00Z"); // still CET (UTC+1) -> 13:00
    const dayAfter = new Date("2026-03-30T12:00:00Z"); // now CEST (UTC+2) -> 14:00
    expect(toLocalHourMinute(dayBefore)).toEqual({ hour: 13, minute: 0 });
    expect(toLocalHourMinute(dayAfter)).toEqual({ hour: 14, minute: 0 });
  });
});

describe("toLocalServiceDate / toLocalHourMinute — 2026-10-25 fall-back transition (CEST -> CET)", () => {
  it("resolves the correct local wall-clock time on both sides of the 01:00 UTC transition instant", () => {
    // 00:59 UTC = 02:59 CEST (last minute of summer time)
    const beforeTransition = new Date("2026-10-25T00:59:00Z");
    expect(toLocalHourMinute(beforeTransition)).toEqual({ hour: 2, minute: 59 });

    // 01:00 UTC = 02:00 CET (clocks fall back; 02:00-02:59 local occurs twice, but each UTC instant still maps to exactly one unambiguous local reading)
    const atTransition = new Date("2026-10-25T01:00:00Z");
    expect(toLocalHourMinute(atTransition)).toEqual({ hour: 2, minute: 0 });

    // 30 minutes later in UTC is the SECOND occurrence of 02:xx local time.
    const secondOccurrence = new Date("2026-10-25T01:30:00Z");
    expect(toLocalHourMinute(secondOccurrence)).toEqual({ hour: 2, minute: 30 });
  });

  it("does not use a fixed UTC offset — the same clock-hour UTC maps to different local hours before/after the transition week", () => {
    const dayBefore = new Date("2026-10-24T12:00:00Z"); // still CEST (UTC+2) -> 14:00
    const dayAfter = new Date("2026-10-26T12:00:00Z"); // now CET (UTC+1) -> 13:00
    expect(toLocalHourMinute(dayBefore)).toEqual({ hour: 14, minute: 0 });
    expect(toLocalHourMinute(dayAfter)).toEqual({ hour: 13, minute: 0 });
  });
});

/**
 * R1.6-A §15 DST testing — toLocalDayOfWeek/dayOfWeekFromLocalDate, added
 * for domain/availability/ServicePeriod.ts's weekly-schedule selection.
 * Both 2026 transition dates (March 29, October 25) are Sundays (this
 * file's own header comment) — the EU DST rule transitions at 01:00 UTC
 * on the last Sunday of March/October, so the transition instant itself
 * always falls on a Sunday by construction; the discriminating case is
 * the near-midnight boundary just before it, where the UTC calendar date
 * and the Amsterdam local calendar date (and therefore weekday) disagree.
 */
describe("toLocalDayOfWeek / dayOfWeekFromLocalDate — ordinary instants", () => {
  it("resolves an ordinary Thursday correctly (2026-01-15, per this file's own Jan-1-is-Thursday anchor)", () => {
    const instant = new Date("2026-01-15T10:00:00Z"); // well inside local Jan 15
    expect(toLocalDayOfWeek(instant)).toBe(4); // Thursday
    expect(dayOfWeekFromLocalDate("2026-01-15")).toBe(4);
  });
});

describe("toLocalDayOfWeek — 2026-03-29 spring-forward transition (CET -> CEST), both Sundays", () => {
  it("correct local weekday and service date at the transition instant itself", () => {
    const atTransition = new Date("2026-03-29T01:00:00Z"); // local 03:00 CEST, still March 29
    expect(toLocalServiceDate(atTransition)).toBe("2026-03-29");
    expect(toLocalDayOfWeek(atTransition)).toBe(0); // Sunday
  });

  it("no UTC-date shift near local midnight: local date/weekday is already Sunday the 29th while the UTC calendar date still reads Saturday the 28th", () => {
    // 2026-03-28T23:15:00Z is CET (+1, transition hasn't happened yet) -> local 2026-03-29T00:15.
    const instant = new Date("2026-03-28T23:15:00Z");
    expect(toLocalServiceDate(instant)).toBe("2026-03-29");
    expect(toLocalDayOfWeek(instant)).toBe(0); // Sunday, NOT Saturday (6) — a naive UTC-date read would wrongly report Saturday
  });
});

describe("toLocalDayOfWeek — 2026-10-25 fall-back transition (CEST -> CET), both Sundays", () => {
  it("correct local weekday and service date at the transition instant itself", () => {
    const atTransition = new Date("2026-10-25T01:00:00Z"); // local 02:00 CET, still October 25
    expect(toLocalServiceDate(atTransition)).toBe("2026-10-25");
    expect(toLocalDayOfWeek(atTransition)).toBe(0); // Sunday
  });

  it("no UTC-date shift near local midnight: local date/weekday is already Sunday the 25th while the UTC calendar date still reads Saturday the 24th", () => {
    // 2026-10-24T23:15:00Z is CEST (+2, still summer time) -> local 2026-10-25T01:15.
    const instant = new Date("2026-10-24T23:15:00Z");
    expect(toLocalServiceDate(instant)).toBe("2026-10-25");
    expect(toLocalDayOfWeek(instant)).toBe(0); // Sunday, NOT Saturday (6)
  });
});

/**
 * R1.6-P2C-1 — localDateToPaddedUtcRange's own correctness claim ("fully
 * contains every instant whose Amsterdam-local calendar date is
 * `localDate`") is proven directly at Amsterdam local midnight on both
 * 2026 DST transition dates, the two cases where a naive UTC-midnight
 * guess drifts furthest from the true local-midnight boundary. Each
 * boundary instant below is a hand-computed literal (not derived from the
 * function under test), cross-checked against toLocalServiceDate (already
 * proven correct above) purely as a sanity assertion, mirroring this
 * file's own established style of pinning expectations to independently
 * derived constants rather than the production code's own arithmetic.
 */
describe("localDateToPaddedUtcRange — Amsterdam local-midnight containment, including both DST transitions", () => {
  it("ordinary date (2026-01-16, CET, UTC+1): the actual first and last local instants of the day both fall inside the padded range", () => {
    const { rangeStart, rangeEnd } = localDateToPaddedUtcRange("2026-01-16");
    const firstInstant = new Date("2026-01-15T23:00:00Z"); // local 2026-01-16T00:00 CET
    const lastInstant = new Date("2026-01-16T22:59:59Z"); // local 2026-01-16T23:59:59 CET
    expect(toLocalServiceDate(firstInstant)).toBe("2026-01-16");
    expect(toLocalServiceDate(lastInstant)).toBe("2026-01-16");
    expect(firstInstant.getTime()).toBeGreaterThanOrEqual(rangeStart.getTime());
    expect(lastInstant.getTime()).toBeLessThan(rangeEnd.getTime());
  });

  it("2026-03-29 spring-forward day (local midnight starts CET, ends CEST): both boundary instants fall inside the padded range", () => {
    const { rangeStart, rangeEnd } = localDateToPaddedUtcRange("2026-03-29");
    const firstInstant = new Date("2026-03-28T23:00:00Z"); // local 2026-03-29T00:00 CET (still +1, before the 01:00 UTC transition)
    const lastInstant = new Date("2026-03-29T21:59:59Z"); // local 2026-03-29T23:59:59 CEST (already +2)
    expect(toLocalServiceDate(firstInstant)).toBe("2026-03-29");
    expect(toLocalServiceDate(lastInstant)).toBe("2026-03-29");
    expect(firstInstant.getTime()).toBeGreaterThanOrEqual(rangeStart.getTime());
    expect(lastInstant.getTime()).toBeLessThan(rangeEnd.getTime());
  });

  it("2026-10-25 fall-back day (local midnight starts CEST, ends CET): both boundary instants fall inside the padded range", () => {
    const { rangeStart, rangeEnd } = localDateToPaddedUtcRange("2026-10-25");
    const firstInstant = new Date("2026-10-24T22:00:00Z"); // local 2026-10-25T00:00 CEST (still +2, before the 01:00 UTC transition)
    const lastInstant = new Date("2026-10-25T22:59:59Z"); // local 2026-10-25T23:59:59 CET (already +1)
    expect(toLocalServiceDate(firstInstant)).toBe("2026-10-25");
    expect(toLocalServiceDate(lastInstant)).toBe("2026-10-25");
    expect(firstInstant.getTime()).toBeGreaterThanOrEqual(rangeStart.getTime());
    expect(lastInstant.getTime()).toBeLessThan(rangeEnd.getTime());
  });

  it("rejects a malformed date string rather than silently producing a wrong range", () => {
    expect(() => localDateToPaddedUtcRange("not-a-date")).toThrow();
  });
});
