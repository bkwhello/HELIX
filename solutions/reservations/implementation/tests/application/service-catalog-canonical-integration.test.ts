import { describe, it, expect } from "vitest";
import { ServiceCatalogManagementService } from "../../application/availability/ServiceCatalogManagementService.js";
import { CanonicalServicePeriodReader } from "../../infrastructure/CanonicalServicePeriodReader.js";
import { ServiceSessionService } from "../../application/availability/ServiceSessionService.js";
import { FakeServiceDefinitionRepository } from "../support/FakePorts.js";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * R1.6-P3B — proves the management service and CanonicalServicePeriodReader
 * genuinely interact correctly when they share ONE ServiceDefinitionRepository
 * instance, the way api/server.ts's production wiring does — entirely
 * in-memory (FakeServiceDefinitionRepository), never touching the real,
 * shared `lunch`/`dinner` database rows. ServiceSession-lifecycle
 * independence is proven structurally here too (no fake wiring exists for
 * it to consult in the first place — see the source-inspection tests
 * below and tests/integration/service-catalog-migration.test.ts's own
 * real-FK-backed proof).
 */
const DINNER_INSTANT = new Date("2026-08-20T18:00:00Z"); // 20:00 Europe/Amsterdam (CEST) -> dinner

function sharedRepo() {
  return new FakeServiceDefinitionRepository();
}

describe("Management update and canonical validation share one repository instance", () => {
  it("disabling 'dinner' through the management service causes a subsequent canonical validation to fail closed with CAP-D02.01-R01", async () => {
    const repo = sharedRepo();
    const management = new ServiceCatalogManagementService(repo);
    const reader = new CanonicalServicePeriodReader(repo);

    const before = await reader.validateReservation({ servicePeriodId: "dinner", reservationDate: DINNER_INSTANT, partySize: 2 });
    expect(before.isValid).toBe(true);

    const update = await management.update("dinner", { enabled: false });
    expect(update.type).toBe("UPDATED");

    const after = await reader.validateReservation({ servicePeriodId: "dinner", reservationDate: DINNER_INSTANT, partySize: 2 });
    expect(after.isValid).toBe(false);
    expect(after.ruleId).toBe("CAP-D02.01-R01");
  });

  it("re-enabling through the management service restores canonical validation", async () => {
    const repo = sharedRepo();
    const management = new ServiceCatalogManagementService(repo);
    const reader = new CanonicalServicePeriodReader(repo);

    await management.update("dinner", { enabled: false });
    expect((await reader.validateReservation({ servicePeriodId: "dinner", reservationDate: DINNER_INSTANT, partySize: 2 })).isValid).toBe(false);

    const reEnabled = await management.update("dinner", { enabled: true });
    expect(reEnabled).toMatchObject({ type: "UPDATED", service: { enabled: true } });

    const after = await reader.validateReservation({ servicePeriodId: "dinner", reservationDate: DINNER_INSTANT, partySize: 2 });
    expect(after.isValid).toBe(true);
  });

  it("renaming displayName through the management service does not affect code classification or validation outcome", async () => {
    const repo = sharedRepo();
    const management = new ServiceCatalogManagementService(repo);
    const reader = new CanonicalServicePeriodReader(repo);

    const before = await reader.validateReservation({ servicePeriodId: "dinner", reservationDate: DINNER_INSTANT, partySize: 2 });
    expect(before.isValid).toBe(true);

    await management.update("dinner", { displayName: "Avondmenu" });

    // deriveServiceCode's own time-based classification is untouched — a
    // dinner-time instant is still classified "dinner", and validation
    // still passes, purely on the strength of the rename having no effect.
    const after = await reader.validateReservation({ servicePeriodId: "dinner", reservationDate: DINNER_INSTANT, partySize: 2 });
    expect(after.isValid).toBe(true);

    // The mismatch check (unrelated to this rename) still fires exactly
    // as before — "lunch" supplied for a real dinner instant is still
    // rejected for the mismatch, not for anything to do with the rename.
    const mismatch = await reader.validateReservation({ servicePeriodId: "lunch", reservationDate: DINNER_INSTANT, partySize: 2 });
    expect(mismatch.isValid).toBe(false);
    expect(mismatch.reason).toMatch(/does not match the service derived/);
  });

  it("disabling 'lunch' does not affect 'dinner' validation, even through the same shared repository instance", async () => {
    const repo = sharedRepo();
    const management = new ServiceCatalogManagementService(repo);
    const reader = new CanonicalServicePeriodReader(repo);

    await management.update("lunch", { enabled: false });
    const result = await reader.validateReservation({ servicePeriodId: "dinner", reservationDate: DINNER_INSTANT, partySize: 2 });
    expect(result.isValid).toBe(true);
  });
});

describe("ServiceSession lifecycle remains independent of the management service and the Service catalog it mutates", () => {
  it("ServiceSessionService has no constructor parameter capable of receiving a ServiceDefinitionRepository or ServiceCatalogManagementService", () => {
    // repository, transactionManager, idGenerator, clock, floorplanRepository(+optional floorplanId) — unchanged by P3B.
    expect(ServiceSessionService.length).toBe(5);
  });

  it("neither ServiceSessionService.ts nor its Prisma repository references ServiceDefinitionRepository, ServiceCatalogManagementService, or .enabled", () => {
    const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
    const serviceSource = readFileSync(path.join(root, "application", "availability", "ServiceSessionService.ts"), "utf-8");
    expect(serviceSource).not.toMatch(/ServiceDefinitionRepository/);
    expect(serviceSource).not.toMatch(/ServiceCatalogManagementService/);
    expect(serviceSource).not.toMatch(/\.enabled\b/);

    const repositorySource = readFileSync(path.join(root, "infrastructure", "persistence", "PrismaServiceSessionRepository.ts"), "utf-8");
    expect(repositorySource).not.toMatch(/ServiceDefinitionRepository/);
    expect(repositorySource).not.toMatch(/ServiceCatalogManagementService/);
    expect(repositorySource).not.toMatch(/\.enabled\b/);
  });

  it("the production construction path (api/app.ts) never gives ServiceSessionService a ServiceDefinitionRepository or ServiceCatalogManagementService", () => {
    const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
    const appSource = readFileSync(path.join(root, "api", "app.ts"), "utf-8");
    const construction = appSource.match(/new ServiceSessionService\(([\s\S]*?)\);/);
    expect(construction).not.toBeNull();
    expect(construction![1]).not.toMatch(/ServiceDefinitionRepository|serviceCatalog/);
  });
});
