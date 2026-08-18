import { describe, it, expect } from "vitest";
import { toLocalServiceDate, toLocalHourMinute } from "../../domain/availability/ServiceTime.js";

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
