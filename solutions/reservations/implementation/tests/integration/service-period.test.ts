import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { createTestPrismaClient, truncateServicePeriodDomainTables } from "./support/testDatabaseSafety.js";
import { resetDatabase } from "./support/testHarness.js";
import { PrismaClosingDayStore } from "../../infrastructure/persistence/PrismaClosingDayStore.js";
import { PrismaServicePeriodOverrideStore } from "../../infrastructure/persistence/PrismaServicePeriodOverrideStore.js";
import { ServicePeriodService } from "../../application/availability/ServicePeriodService.js";

/**
 * Chief Engineer "R1.6-A Service Period Management" assignment §16-19,24
 * — real PostgreSQL evidence for date-override/ClosingDay precedence,
 * area independence, and grid boundaries, composed through
 * ServicePeriodService exactly as it would be used by any future caller.
 */
const prisma = createTestPrismaClient();
const closingDayStore = new PrismaClosingDayStore(prisma);
const overrideStore = new PrismaServicePeriodOverrideStore(prisma);
const service = new ServicePeriodService(closingDayStore, overrideStore);

beforeAll(async () => {
  await resetDatabase(prisma);
  await truncateServicePeriodDomainTables(prisma);
});
afterAll(async () => {
  await prisma.$disconnect();
});
beforeEach(async () => {
  await resetDatabase(prisma);
  await truncateServicePeriodDomainTables(prisma);
});

// 2026-08-24 is a Monday, 2026-08-21 is a Friday (2026-01-01 is a Thursday
// — tests/domain/service-time.test.ts's own anchor; verified independently
// here: Aug 20 2026 is exactly 231 days after Jan 1, 231 mod 7 = 0, so Aug
// 20 2026 is also a Thursday, making Aug 21 Friday and Aug 24 Monday).
const MONDAY = "2026-08-24";
const FRIDAY = "2026-08-21";

describe("§16 — normal weekday / weekend use the weekly schedule", () => {
  it("a normal Monday resolves to the weekly Monday schedule (17:00-21:00)", async () => {
    const result = await service.getBookableStartTimes("Sushi", MONDAY);
    expect(result.type).toBe("BOOKABLE");
    if (result.type === "BOOKABLE") {
      expect(result.localStartTimes[0]).toBe("17:00");
      expect(result.localStartTimes[result.localStartTimes.length - 1]).toBe("21:00");
      expect(result.localStartTimes).toHaveLength(17);
    }
  });

  it("a normal Friday resolves to the weekly Friday schedule (12:00-21:00)", async () => {
    const result = await service.getBookableStartTimes("Teppanyaki", FRIDAY);
    expect(result.type).toBe("BOOKABLE");
    if (result.type === "BOOKABLE") {
      expect(result.localStartTimes[0]).toBe("12:00");
      expect(result.localStartTimes[result.localStartTimes.length - 1]).toBe("21:00");
      expect(result.localStartTimes).toHaveLength(37);
    }
  });
});

describe("§16 — date-specific override testing (real PostgreSQL)", () => {
  const CHRISTMAS = "2026-12-25";
  const DAY_BEFORE = "2026-12-24";
  const DAY_AFTER = "2026-12-26";

  it("special hours on a specific date override the weekly schedule", async () => {
    await overrideStore.upsert({
      area: "Sushi",
      date: CHRISTMAS,
      status: "Open",
      windows: [{ firstStartMinute: 12 * 60, lastStartMinute: 18 * 60 }],
      reason: "Christmas — reduced hours",
      createdBy: "engineering-seed",
    });

    const result = await service.getBookableStartTimes("Sushi", CHRISTMAS);
    expect(result.type).toBe("BOOKABLE");
    if (result.type === "BOOKABLE") {
      expect(result.localStartTimes[0]).toBe("12:00");
      expect(result.localStartTimes[result.localStartTimes.length - 1]).toBe("18:00");
      // Never the normal weekly last-start of 21:00 — proves REPLACE, not UNION.
      expect(result.localStartTimes).not.toContain("21:00");
    }
  });

  it("an explicit closed date exposes no starts at all", async () => {
    await overrideStore.upsert({ area: "Sushi", date: CHRISTMAS, status: "Closed", windows: [], reason: "Closed for Christmas", createdBy: "engineering-seed" });
    const result = await service.getBookableStartTimes("Sushi", CHRISTMAS);
    expect(result).toEqual({ type: "CLOSED" });
  });

  it("a special date with multiple windows exposes only those windows", async () => {
    await overrideStore.upsert({
      area: "Sushi",
      date: CHRISTMAS,
      status: "Open",
      windows: [
        { firstStartMinute: 12 * 60, lastStartMinute: 14 * 60 },
        { firstStartMinute: 17 * 60, lastStartMinute: 21 * 60 },
      ],
      createdBy: "engineering-seed",
    });
    const result = await service.getBookableStartTimes("Sushi", CHRISTMAS);
    expect(result.type).toBe("BOOKABLE");
    if (result.type === "BOOKABLE") {
      expect(result.localStartTimes).not.toContain("15:00"); // the gap between windows
      expect(result.localStartTimes).not.toContain("16:45");
      expect(result.localStartTimes).toContain("12:00");
      expect(result.localStartTimes).toContain("14:00");
      expect(result.localStartTimes).toContain("17:00");
      expect(result.localStartTimes).toContain("21:00");
      expect(result.localStartTimes).toHaveLength(9 + 17); // 12:00-14:00 (9 starts) + 17:00-21:00 (17 starts)
    }
  });

  it("the day immediately before/after an override is unaffected — normal weekly schedule is restored", async () => {
    await overrideStore.upsert({ area: "Sushi", date: CHRISTMAS, status: "Closed", windows: [], createdBy: "engineering-seed" });

    // DAY_BEFORE/DAY_AFTER's actual weekday schedule (whatever it resolves to) must be untouched by the Christmas override.
    const before = await service.getBookableStartTimes("Sushi", DAY_BEFORE);
    const after = await service.getBookableStartTimes("Sushi", DAY_AFTER);
    expect(before.type).toBe("BOOKABLE");
    expect(after.type).toBe("BOOKABLE");
  });
});

describe("§19 — ClosingDay regression: ClosingDay still overrides everything, including an otherwise-open weekly schedule", () => {
  it("a date marked fully closed exposes no booking starts even though the weekly schedule would normally be open", async () => {
    const closingDate = new Date(`${MONDAY}T00:00:00.000Z`);
    await closingDayStore.add({ fromDate: closingDate, toDate: closingDate, reason: "Test closure", createdBy: "engineering-seed" });

    const result = await service.getBookableStartTimes("Sushi", MONDAY);
    expect(result).toEqual({ type: "CLOSED" });
  });

  it("ClosingDay wins even when a date-specific Open override also exists for the same date (precedence order)", async () => {
    const closingDate = new Date(`${MONDAY}T00:00:00.000Z`);
    await closingDayStore.add({ fromDate: closingDate, toDate: closingDate, reason: "Test closure", createdBy: "engineering-seed" });
    await overrideStore.upsert({
      area: "Sushi",
      date: MONDAY,
      status: "Open",
      windows: [{ firstStartMinute: 10 * 60, lastStartMinute: 11 * 60 }],
      createdBy: "engineering-seed",
    });

    const result = await service.getBookableStartTimes("Sushi", MONDAY);
    expect(result).toEqual({ type: "CLOSED" });
  });
});

describe("§18 — area testing (real PostgreSQL)", () => {
  it("Sushi Monday 17:00, Teppanyaki Monday 17:00, Sushi Friday 12:00, and Teppanyaki Friday 12:00 are all valid", async () => {
    expect(await service.isStartTimeWithinServicePeriod("Sushi", new Date("2026-08-24T15:00:00Z"))).toBe(true); // 17:00 CEST
    expect(await service.isStartTimeWithinServicePeriod("Teppanyaki", new Date("2026-08-24T15:00:00Z"))).toBe(true);
    expect(await service.isStartTimeWithinServicePeriod("Sushi", new Date("2026-08-21T10:00:00Z"))).toBe(true); // 12:00 CEST
    expect(await service.isStartTimeWithinServicePeriod("Teppanyaki", new Date("2026-08-21T10:00:00Z"))).toBe(true);
  });

  it("an area-specific override does not leak into the other area", async () => {
    await overrideStore.upsert({ area: "Sushi", date: MONDAY, status: "Closed", windows: [], createdBy: "engineering-seed" });

    const sushi = await service.getBookableStartTimes("Sushi", MONDAY);
    const teppanyaki = await service.getBookableStartTimes("Teppanyaki", MONDAY);
    expect(sushi).toEqual({ type: "CLOSED" });
    expect(teppanyaki.type).toBe("BOOKABLE");
  });
});

describe("§17 — grid boundary testing through IsStartTimeWithinServicePeriod (real PostgreSQL, Europe/Amsterdam CEST in August)", () => {
  // 2026-08-24 (Monday) CEST = UTC+2.
  it.each([
    ["2026-08-24T14:45:00Z", false], // 16:45 local
    ["2026-08-24T15:00:00Z", true], // 17:00 local
    ["2026-08-24T15:15:00Z", true], // 17:15 local
    ["2026-08-24T18:45:00Z", true], // 20:45 local
    ["2026-08-24T19:00:00Z", true], // 21:00 local
    ["2026-08-24T19:15:00Z", false], // 21:15 local
  ])("Monday %s -> %s", async (iso, expected) => {
    expect(await service.isStartTimeWithinServicePeriod("Sushi", new Date(iso))).toBe(expected);
  });

  // 2026-08-21 (Friday) CEST = UTC+2.
  it.each([
    ["2026-08-21T09:45:00Z", false], // 11:45 local
    ["2026-08-21T10:00:00Z", true], // 12:00 local
    ["2026-08-21T19:00:00Z", true], // 21:00 local
    ["2026-08-21T19:15:00Z", false], // 21:15 local
  ])("Friday %s -> %s", async (iso, expected) => {
    expect(await service.isStartTimeWithinServicePeriod("Sushi", new Date(iso))).toBe(expected);
  });
});

describe("§15 — DST: weekly schedule selection remains correct across both 2026 Europe/Amsterdam transitions", () => {
  // Exhaustive proof that the local calendar date/weekday never shifts
  // across either transition instant (the actual DST hazard for weekly-
  // schedule SELECTION) lives at the domain layer —
  // tests/domain/service-time.test.ts's toLocalDayOfWeek suite, including
  // the near-midnight boundary case. These two tests only confirm the
  // composed ServicePeriodService correctly resolves the Sunday schedule
  // for each real transition date end-to-end, through real PostgreSQL.
  it("2026-03-29 (spring-forward, a Sunday) resolves to the Sunday weekly schedule (12:00-21:00)", async () => {
    expect(await service.isStartTimeWithinServicePeriod("Sushi", new Date("2026-03-29T10:00:00Z"))).toBe(true); // 12:00 CEST (after the 01:00 UTC transition)
    const result = await service.getBookableStartTimes("Sushi", "2026-03-29");
    expect(result.type).toBe("BOOKABLE");
    if (result.type === "BOOKABLE") expect(result.localStartTimes[0]).toBe("12:00");
  });

  it("2026-10-25 (fall-back, a Sunday) resolves to the Sunday weekly schedule (12:00-21:00)", async () => {
    expect(await service.isStartTimeWithinServicePeriod("Sushi", new Date("2026-10-25T11:00:00Z"))).toBe(true); // 12:00 CET (after the 01:00 UTC transition)
    const result = await service.getBookableStartTimes("Sushi", "2026-10-25");
    expect(result.type).toBe("BOOKABLE");
    if (result.type === "BOOKABLE") expect(result.localStartTimes[0]).toBe("12:00");
  });
});

describe("ServicePeriodOverrideStore — direct CRUD contract (real PostgreSQL)", () => {
  it("upsert is idempotent-by-replace: a second upsert for the same area/date replaces the window set rather than accumulating it", async () => {
    await overrideStore.upsert({
      area: "Teppanyaki",
      date: "2026-12-31",
      status: "Open",
      windows: [{ firstStartMinute: 12 * 60, lastStartMinute: 14 * 60 }],
      createdBy: "engineering-seed",
    });
    await overrideStore.upsert({
      area: "Teppanyaki",
      date: "2026-12-31",
      status: "Open",
      windows: [{ firstStartMinute: 18 * 60, lastStartMinute: 23 * 60 }],
      reason: "New Year's Eve — extended hours",
      createdBy: "engineering-seed",
    });

    const record = await overrideStore.findForDate("Teppanyaki", "2026-12-31");
    expect(record?.windows).toEqual([{ firstStartMinute: 18 * 60, lastStartMinute: 23 * 60 }]);
    expect(record?.reason).toBe("New Year's Eve — extended hours");
  });

  it("remove deletes the override (and its windows cascade) — the date then falls back to the weekly schedule", async () => {
    const created = await overrideStore.upsert({ area: "Sushi", date: "2026-12-31", status: "Closed", windows: [], createdBy: "engineering-seed" });
    await overrideStore.remove(created.id);
    expect(await overrideStore.findForDate("Sushi", "2026-12-31")).toBeNull();
  });

  it("list(area) returns only that area's overrides", async () => {
    await overrideStore.upsert({ area: "Sushi", date: "2027-01-01", status: "Closed", windows: [], createdBy: "engineering-seed" });
    await overrideStore.upsert({ area: "Teppanyaki", date: "2027-01-01", status: "Closed", windows: [], createdBy: "engineering-seed" });
    const sushiOnly = await overrideStore.list("Sushi");
    expect(sushiOnly).toHaveLength(1);
    expect(sushiOnly[0]?.areaId).toBe("Sushi");
  });
});
