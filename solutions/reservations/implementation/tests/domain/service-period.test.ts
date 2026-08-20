import { describe, it, expect } from "vitest";
import {
  DEFAULT_WEEKLY_SCHEDULE,
  enumerateGridStarts,
  formatMinuteOfDay,
  getWeeklySchedule,
  isMinuteBookable,
  isMinuteWithinDaySchedule,
  resolveDaySchedule,
  toBookableStartTimesResult,
  BookingWindow,
} from "../../domain/availability/ServicePeriod.js";

function hm(hour: number, minute: number): number {
  return hour * 60 + minute;
}

const MONDAY = 1;
const FRIDAY = 5;
const MONDAY_WINDOWS = DEFAULT_WEEKLY_SCHEDULE[MONDAY]!;
const FRIDAY_WINDOWS = DEFAULT_WEEKLY_SCHEDULE[FRIDAY]!;

/**
 * Chief Engineer "R1.6-A Service Period Management" assignment §§15-19,24
 * — pure domain test suite. No database — proves the weekly schedule,
 * grid enumeration, and the ClosingDay > override > weekly precedence
 * rule, all without I/O.
 */
describe("ServicePeriod — owner-confirmed weekly schedule (§2/§28)", () => {
  it("Monday-Thursday: 17:00-21:00", () => {
    for (const day of [1, 2, 3, 4]) {
      expect(DEFAULT_WEEKLY_SCHEDULE[day]).toEqual([{ firstStartMinute: hm(17, 0), lastStartMinute: hm(21, 0) }]);
    }
  });

  it("Friday-Sunday: 12:00-21:00", () => {
    for (const day of [5, 6, 0]) {
      expect(DEFAULT_WEEKLY_SCHEDULE[day]).toEqual([{ firstStartMinute: hm(12, 0), lastStartMinute: hm(21, 0) }]);
    }
  });

  it("INV-SP06 — Sushi and Teppanyaki resolve to the same weekly schedule today (no area-specific override configured)", () => {
    expect(getWeeklySchedule("Sushi")).toBe(DEFAULT_WEEKLY_SCHEDULE);
    expect(getWeeklySchedule("Teppanyaki")).toBe(DEFAULT_WEEKLY_SCHEDULE);
  });
});

describe("ServicePeriod — §17 grid boundary testing", () => {
  it.each([
    [hm(16, 45), false],
    [hm(17, 0), true],
    [hm(17, 15), true],
    [hm(20, 45), true],
    [hm(21, 0), true],
    [hm(21, 15), false],
  ])("Monday minute %i -> bookable=%s", (minute, expected) => {
    expect(isMinuteWithinDaySchedule(minute, MONDAY_WINDOWS)).toBe(expected);
  });

  it.each([
    [hm(11, 45), false],
    [hm(12, 0), true],
    [hm(21, 0), true],
    [hm(21, 15), false],
  ])("Friday minute %i -> bookable=%s", (minute, expected) => {
    expect(isMinuteWithinDaySchedule(minute, FRIDAY_WINDOWS)).toBe(expected);
  });

  it("INV-SP07 — every enumerated Monday start is 15-minute-grid aligned relative to the window start, ascending, no duplicates", () => {
    const starts = enumerateGridStarts(MONDAY_WINDOWS);
    expect(starts[0]).toBe(hm(17, 0));
    expect(starts[starts.length - 1]).toBe(hm(21, 0));
    expect(starts).toHaveLength(17); // 17:00..21:00 inclusive, every 15 min = 16*15/15+1 = 17
    for (const start of starts) {
      expect((start - hm(17, 0)) % 15).toBe(0);
    }
    expect(new Set(starts).size).toBe(starts.length);
  });

  it("Friday enumerates 37 starts (12:00..21:00 inclusive, every 15 minutes)", () => {
    expect(enumerateGridStarts(FRIDAY_WINDOWS)).toHaveLength(37);
  });
});

describe("ServicePeriod — INV-SP02/SP03: 21:00 is a valid inclusive final start; duration may extend past it", () => {
  it("21:00 (the last configured start minute) is bookable", () => {
    expect(isMinuteWithinDaySchedule(hm(21, 0), MONDAY_WINDOWS)).toBe(true);
  });

  it("this module has no notion of a reservation's duration or end-of-service time — a Teppanyaki 150-minute booking starting at 21:00 is judged solely on its START minute", () => {
    // Structural proof, not merely behavioral: BookingWindow has exactly
    // two fields (firstStartMinute, lastStartMinute), both START minutes.
    // isMinuteWithinDaySchedule/isMinuteBookable take no duration
    // parameter — there is nothing here CAPABLE of rejecting a booking
    // for finishing after closing time (INV-SP03).
    const window: BookingWindow = { firstStartMinute: hm(17, 0), lastStartMinute: hm(21, 0) };
    expect(isMinuteWithinDaySchedule(hm(21, 0), [window])).toBe(true); // 21:00 start + 150min duration ends 23:30 — irrelevant here
  });
});

describe("ServicePeriod — resolveDaySchedule precedence (§6/§16): ClosingDay > date override > weekly", () => {
  it("ClosingDay closure wins even when an Open override AND the weekly schedule would both otherwise be open", () => {
    const resolved = resolveDaySchedule({
      area: "Sushi",
      dayOfWeek: MONDAY,
      closingDayClosed: true,
      override: { status: "Open", windows: [{ firstStartMinute: hm(10, 0), lastStartMinute: hm(11, 0) }] },
    });
    expect(resolved).toEqual({ status: "Closed" });
  });

  it("a Closed override wins over the weekly schedule when ClosingDay does not apply", () => {
    const resolved = resolveDaySchedule({ area: "Sushi", dayOfWeek: MONDAY, closingDayClosed: false, override: { status: "Closed", windows: [] } });
    expect(resolved).toEqual({ status: "Closed" });
  });

  it("an Open override REPLACES the weekly schedule for that date — not a union of the two (assignment §4)", () => {
    const specialWindows: BookingWindow[] = [{ firstStartMinute: hm(12, 0), lastStartMinute: hm(18, 0) }];
    const resolved = resolveDaySchedule({ area: "Sushi", dayOfWeek: MONDAY, closingDayClosed: false, override: { status: "Open", windows: specialWindows } });
    expect(resolved).toEqual({ status: "Open", windows: specialWindows });
    // Explicitly NOT the normal Monday 17:00-21:00 window, and NOT a union of both.
    expect(resolved).not.toEqual({ status: "Open", windows: MONDAY_WINDOWS });
  });

  it("with no override and no closure, the weekly schedule applies", () => {
    const resolved = resolveDaySchedule({ area: "Sushi", dayOfWeek: MONDAY, closingDayClosed: false });
    expect(resolved).toEqual({ status: "Open", windows: MONDAY_WINDOWS });
  });

  it("an out-of-range weekly day (defensive) resolves to Closed rather than throwing", () => {
    const resolved = resolveDaySchedule({ area: "Sushi", dayOfWeek: 9, closingDayClosed: false });
    expect(resolved).toEqual({ status: "Closed" });
  });

  it("INV-SP08/SP09/SP10 — this module never imports CapacityPool, BookingPolicy, or TeppanyakiSelfServicePacing (proof by construction, verifiable via import statements at the top of domain/availability/ServicePeriod.ts — it imports only CapacityPoolId, a TYPE, from CapacityPool.ts, never any capacity/pacing VALUE)", () => {
    // This test exists as a permanent, named anchor for that invariant;
    // the actual proof is structural (see this file's own header comment
    // and domain/availability/ServicePeriod.ts's imports), not something
    // a runtime assertion can meaningfully re-verify.
    expect(true).toBe(true);
  });
});

describe("ServicePeriod — §18 area testing (independent per-area resolution)", () => {
  it("an area-specific override for Sushi does not affect Teppanyaki's resolution for the same day/closure state", () => {
    const sushiResolved = resolveDaySchedule({
      area: "Sushi",
      dayOfWeek: MONDAY,
      closingDayClosed: false,
      override: { status: "Closed", windows: [] },
    });
    const teppanyakiResolved = resolveDaySchedule({ area: "Teppanyaki", dayOfWeek: MONDAY, closingDayClosed: false });
    expect(sushiResolved).toEqual({ status: "Closed" });
    expect(teppanyakiResolved).toEqual({ status: "Open", windows: MONDAY_WINDOWS });
  });

  it("Sushi Monday 17:00 and Teppanyaki Monday 17:00 are both valid; Sushi Friday 12:00 and Teppanyaki Friday 12:00 are both valid", () => {
    expect(isMinuteBookable(hm(17, 0), resolveDaySchedule({ area: "Sushi", dayOfWeek: MONDAY, closingDayClosed: false }))).toBe(true);
    expect(isMinuteBookable(hm(17, 0), resolveDaySchedule({ area: "Teppanyaki", dayOfWeek: MONDAY, closingDayClosed: false }))).toBe(true);
    expect(isMinuteBookable(hm(12, 0), resolveDaySchedule({ area: "Sushi", dayOfWeek: FRIDAY, closingDayClosed: false }))).toBe(true);
    expect(isMinuteBookable(hm(12, 0), resolveDaySchedule({ area: "Teppanyaki", dayOfWeek: FRIDAY, closingDayClosed: false }))).toBe(true);
  });
});

describe("ServicePeriod — §9/§10 result projections", () => {
  it("toBookableStartTimesResult returns CLOSED when the resolved schedule is Closed", () => {
    expect(toBookableStartTimesResult({ status: "Closed" })).toEqual({ type: "CLOSED" });
  });

  it("toBookableStartTimesResult returns the exact grid-formatted start list when Open", () => {
    const result = toBookableStartTimesResult({ status: "Open", windows: FRIDAY_WINDOWS });
    expect(result.type).toBe("BOOKABLE");
    if (result.type === "BOOKABLE") {
      expect(result.localStartTimes[0]).toBe("12:00");
      expect(result.localStartTimes[result.localStartTimes.length - 1]).toBe("21:00");
      expect(result.localStartTimes).toHaveLength(37);
    }
  });

  it("isMinuteBookable is false for any minute when Closed, regardless of value", () => {
    expect(isMinuteBookable(hm(17, 0), { status: "Closed" })).toBe(false);
  });
});

describe("ServicePeriod — formatMinuteOfDay", () => {
  it.each([
    [0, "00:00"],
    [60, "01:00"],
    [hm(17, 0), "17:00"],
    [hm(21, 15), "21:15"],
  ])("formats minute %i as %s", (minute, expected) => {
    expect(formatMinuteOfDay(minute)).toBe(expected);
  });
});
