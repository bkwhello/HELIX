import { describe, it, expect } from "vitest";
import { CanonicalServicePeriodReader } from "../../infrastructure/CanonicalServicePeriodReader.js";
import { FakeServiceDefinitionRepository } from "../support/FakePorts.js";
import { ServiceDefinitionRepository } from "../../domain/repositories/ServiceDefinitionRepository.js";
import { ServiceDefinition } from "../../domain/availability/ServiceDefinition.js";
import { ServiceCode } from "../../domain/availability/Service.js";

/**
 * R1.6-P3A — pure, fast unit coverage for CanonicalServicePeriodReader's
 * own branching logic, using FakeServiceDefinitionRepository (no real
 * database) so the enabled/disabled/missing/repository-failure branches
 * can be tested deterministically and instantly. Real-Postgres end-to-end
 * proof (the reader wired into the actual orchestrator/transaction) lives
 * in tests/integration/canonical-service-period.test.ts.
 */
const DINNER_INSTANT = new Date("2026-08-20T18:00:00Z"); // 20:00 Europe/Amsterdam (CEST) -> dinner
const LUNCH_INSTANT = new Date("2026-08-21T11:00:00Z"); // 13:00 Europe/Amsterdam (CEST) -> lunch

function reader(repo: ServiceDefinitionRepository = new FakeServiceDefinitionRepository()) {
  return new CanonicalServicePeriodReader(repo);
}

describe("CanonicalServicePeriodReader — enabled matching code succeeds", () => {
  it("dinner at a real dinner instant, Service enabled -> valid", async () => {
    const result = await reader().validateReservation({ servicePeriodId: "dinner", reservationDate: DINNER_INSTANT, partySize: 2 });
    expect(result.isValid).toBe(true);
  });

  it("lunch at a real lunch instant, Service enabled -> valid", async () => {
    const result = await reader().validateReservation({ servicePeriodId: "lunch", reservationDate: LUNCH_INSTANT, partySize: 2 });
    expect(result.isValid).toBe(true);
  });
});

describe("CanonicalServicePeriodReader — disabled matching code fails, with the new capability-owned rule id", () => {
  it("rejects when the matching Service is disabled", async () => {
    const fake = new FakeServiceDefinitionRepository();
    fake.setEnabled("dinner", false);
    const result = await reader(fake).validateReservation({ servicePeriodId: "dinner", reservationDate: DINNER_INSTANT, partySize: 2 });
    expect(result.isValid).toBe(false);
    expect(result.ruleId).toBe("CAP-D02.01-R01");
  });

  it("the disabled-rejection message never mentions a row/database/persistence detail", async () => {
    const fake = new FakeServiceDefinitionRepository();
    fake.setEnabled("dinner", false);
    const result = await reader(fake).validateReservation({ servicePeriodId: "dinner", reservationDate: DINNER_INSTANT, partySize: 2 });
    expect(result.reason).not.toMatch(/row|database|sql|prisma|table/i);
  });

  it("disabling lunch does not affect dinner", async () => {
    const fake = new FakeServiceDefinitionRepository();
    fake.setEnabled("lunch", false);
    const result = await reader(fake).validateReservation({ servicePeriodId: "dinner", reservationDate: DINNER_INSTANT, partySize: 2 });
    expect(result.isValid).toBe(true);
  });
});

describe("CanonicalServicePeriodReader — missing matching code fails closed, same rule id as disabled", () => {
  it("rejects when no Service row exists for the matching code at all", async () => {
    const fake = new FakeServiceDefinitionRepository();
    fake.remove("dinner");
    const result = await reader(fake).validateReservation({ servicePeriodId: "dinner", reservationDate: DINNER_INSTANT, partySize: 2 });
    expect(result.isValid).toBe(false);
    expect(result.ruleId).toBe("CAP-D02.01-R01");
  });

  it("a missing row is never silently treated as enabled", async () => {
    const fake = new FakeServiceDefinitionRepository();
    fake.remove("lunch");
    const result = await reader(fake).validateReservation({ servicePeriodId: "lunch", reservationDate: LUNCH_INSTANT, partySize: 2 });
    expect(result.isValid).toBe(false);
  });
});

describe("CanonicalServicePeriodReader — existing mismatched-code behavior retains precedence over the new check", () => {
  it("an unknown servicePeriodId string is rejected before any repository lookup, with no ruleId (defaults to CAP-D01.01-R06 at the caller)", async () => {
    const fake = new FakeServiceDefinitionRepository();
    fake.remove("dinner");
    fake.remove("lunch");
    // Even though NEITHER canonical Service exists in this fake, an
    // outright unknown code ("brunch") must still be rejected for being
    // unknown, not for the Service catalog being empty.
    const result = await reader(fake).validateReservation({ servicePeriodId: "brunch", reservationDate: DINNER_INSTANT, partySize: 2 });
    expect(result.isValid).toBe(false);
    expect(result.ruleId).toBeUndefined();
    expect(result.reason).toMatch(/must be "lunch" or "dinner"/);
  });

  it("a mismatched-but-canonical code is rejected for the mismatch, even when the matching (correct) Service is enabled", async () => {
    // "lunch" supplied for a real dinner instant — the mismatch check
    // must fire before any Service-catalog lookup for "lunch" happens.
    const result = await reader().validateReservation({ servicePeriodId: "lunch", reservationDate: DINNER_INSTANT, partySize: 2 });
    expect(result.isValid).toBe(false);
    expect(result.ruleId).toBeUndefined();
    expect(result.reason).toMatch(/does not match the service derived/);
  });

  it("a mismatched code is still rejected for the mismatch even if the SUPPLIED code's Service is disabled — mismatch precedence, not catalog state, decides", async () => {
    const fake = new FakeServiceDefinitionRepository();
    fake.setEnabled("lunch", false);
    const result = await reader(fake).validateReservation({ servicePeriodId: "lunch", reservationDate: DINNER_INSTANT, partySize: 2 });
    expect(result.isValid).toBe(false);
    expect(result.reason).toMatch(/does not match the service derived/);
  });
});

describe("CanonicalServicePeriodReader — Europe/Amsterdam classification unchanged", () => {
  it("a timestamp whose Amsterdam hour differs from its UTC hour is still classified by Amsterdam time", async () => {
    // 2026-07-15 is CEST (UTC+2): 10:30Z is Amsterdam 12:30 -> lunch.
    const result = await reader().validateReservation({ servicePeriodId: "lunch", reservationDate: new Date("2026-07-15T10:30:00Z"), partySize: 2 });
    expect(result.isValid).toBe(true);
  });

  it("the [12:00,16:00) lunch boundary is unchanged — 15:59 local is still lunch, 16:00 local is still dinner", async () => {
    // 2026-08-20 is CEST (UTC+2): 13:59Z = 15:59 local; 14:00Z = 16:00 local.
    const stillLunch = await reader().validateReservation({ servicePeriodId: "lunch", reservationDate: new Date("2026-08-20T13:59:00Z"), partySize: 2 });
    expect(stillLunch.isValid).toBe(true);
    const nowDinner = await reader().validateReservation({ servicePeriodId: "dinner", reservationDate: new Date("2026-08-20T14:00:00Z"), partySize: 2 });
    expect(nowDinner.isValid).toBe(true);
  });
});

describe("CanonicalServicePeriodReader — a repository failure does not silently validate", () => {
  it("propagates a thrown repository error rather than returning isValid: true", async () => {
    class ThrowingServiceDefinitionRepository implements ServiceDefinitionRepository {
      async findByCode(): Promise<ServiceDefinition | null> {
        throw new Error("simulated repository failure");
      }
      async list(): Promise<readonly ServiceDefinition[]> {
        throw new Error("simulated repository failure");
      }
    }
    await expect(
      reader(new ThrowingServiceDefinitionRepository()).validateReservation({ servicePeriodId: "dinner", reservationDate: DINNER_INSTANT, partySize: 2 })
    ).rejects.toThrow("simulated repository failure");
  });
});

describe("CanonicalServicePeriodReader — constructor requires a ServiceDefinitionRepository (no no-op default)", () => {
  it("has exactly one required constructor parameter", () => {
    expect(CanonicalServicePeriodReader.length).toBe(1);
  });
});
