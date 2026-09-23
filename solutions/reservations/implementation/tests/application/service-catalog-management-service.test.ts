import { describe, it, expect } from "vitest";
import { ServiceCatalogManagementService } from "../../application/availability/ServiceCatalogManagementService.js";
import { FakeServiceDefinitionRepository } from "../support/FakePorts.js";

/**
 * R1.6-P3B — application-layer coverage for ServiceCatalogManagementService,
 * against the in-memory fake only (never a real database) — real-adapter
 * mutation coverage lives in tests/infrastructure/prisma-service-definition-repository.test.ts,
 * using throwaway non-canonical rows, never the shared lunch/dinner rows.
 */
function service(repo: FakeServiceDefinitionRepository = new FakeServiceDefinitionRepository()) {
  return new ServiceCatalogManagementService(repo);
}

describe("ServiceCatalogManagementService.list — deterministic lunch-then-dinner order", () => {
  it("returns exactly [lunch, dinner], never trusting repository row order", async () => {
    const repo = new FakeServiceDefinitionRepository();
    const result = await service(repo).list();
    expect(result.map((s) => s.code)).toEqual(["lunch", "dinner"]);
  });

  it("still returns lunch-then-dinner even if the repository's own list() would return dinner-then-lunch", async () => {
    class ReversedOrderRepo extends FakeServiceDefinitionRepository {
      override async list() {
        const rows = await super.list();
        return [...rows].reverse();
      }
    }
    const repo = new ReversedOrderRepo();
    const result = await service(repo).list();
    expect(result.map((s) => s.code)).toEqual(["lunch", "dinner"]);
  });

  it("each row carries exactly code/displayName/enabled/createdAt/updatedAt — no schedule/duration/capacity/floorplan field", async () => {
    const result = await service().list();
    for (const row of result) {
      expect(Object.keys(row).sort()).toEqual(["code", "createdAt", "displayName", "enabled", "updatedAt"].sort());
    }
  });
});

describe("ServiceCatalogManagementService.update — partial update by immutable code", () => {
  it("rename only: displayName changes, enabled untouched", async () => {
    const repo = new FakeServiceDefinitionRepository();
    const before = await repo.findByCode("lunch");
    const result = await service(repo).update("lunch", { displayName: "Middagmenu" });
    expect(result).toEqual({ type: "UPDATED", service: expect.objectContaining({ code: "lunch", displayName: "Middagmenu", enabled: true }) });
    expect(before?.enabled).toBe(true);
  });

  it("enable/disable only: enabled changes, displayName untouched", async () => {
    const repo = new FakeServiceDefinitionRepository();
    const result = await service(repo).update("dinner", { enabled: false });
    expect(result).toEqual({ type: "UPDATED", service: expect.objectContaining({ code: "dinner", displayName: "Dinner", enabled: false }) });
  });

  it("combined update: both displayName and enabled change together", async () => {
    const repo = new FakeServiceDefinitionRepository();
    const result = await service(repo).update("lunch", { displayName: "Lunchkaart", enabled: false });
    expect(result).toEqual({ type: "UPDATED", service: expect.objectContaining({ code: "lunch", displayName: "Lunchkaart", enabled: false }) });
  });

  it("partial update does not clobber the unspecified field — updating only enabled leaves displayName byte-identical, and vice versa", async () => {
    const repo = new FakeServiceDefinitionRepository();
    await service(repo).update("lunch", { enabled: false });
    const afterEnabledOnly = await repo.findByCode("lunch");
    expect(afterEnabledOnly?.displayName).toBe("Lunch");

    await service(repo).update("dinner", { displayName: "Avondmenu" });
    const afterNameOnly = await repo.findByCode("dinner");
    expect(afterNameOnly?.enabled).toBe(true);
  });

  it("a real (non-empty-after-trim) displayName is stored exactly as supplied — the service trusts its caller's own shape validation, same division of responsibility as ServiceSessionService.create()", async () => {
    const repo = new FakeServiceDefinitionRepository();
    const result = await service(repo).update("lunch", { displayName: "Lunch Special" });
    expect(result).toMatchObject({ type: "UPDATED", service: { displayName: "Lunch Special" } });
  });

  it("same-value update is idempotent: returns UPDATED, does not call the repository's update, and preserves updatedAt exactly", async () => {
    const repo = new FakeServiceDefinitionRepository();
    const before = await repo.findByCode("lunch");
    let updateCalls = 0;
    const originalUpdate = repo.update.bind(repo);
    repo.update = async (...args) => {
      updateCalls += 1;
      return originalUpdate(...args);
    };

    const result = await service(repo).update("lunch", { displayName: "Lunch", enabled: true });
    expect(result).toEqual({ type: "UPDATED", service: before });
    expect(updateCalls).toBe(0);
  });

  it("same-value update is idempotent even for a partial patch matching only one field's current value", async () => {
    const repo = new FakeServiceDefinitionRepository();
    const before = await repo.findByCode("dinner");
    const result = await service(repo).update("dinner", { enabled: true });
    expect(result).toEqual({ type: "UPDATED", service: before });
  });

  it("last-write-wins: two sequential updates each apply unconditionally, no optimistic-concurrency rejection", async () => {
    const repo = new FakeServiceDefinitionRepository();
    const first = await service(repo).update("lunch", { displayName: "First" });
    const second = await service(repo).update("lunch", { displayName: "Second" });
    expect(first).toMatchObject({ type: "UPDATED", service: { displayName: "First" } });
    expect(second).toMatchObject({ type: "UPDATED", service: { displayName: "Second" } });
    expect((await repo.findByCode("lunch"))?.displayName).toBe("Second");
  });

  it("an unknown code (never seeded, e.g. a removed fixture) returns SERVICE_NOT_FOUND", async () => {
    const repo = new FakeServiceDefinitionRepository();
    repo.remove("lunch");
    const result = await service(repo).update("lunch", { displayName: "X" });
    expect(result).toEqual({ type: "SERVICE_NOT_FOUND" });
  });

  it("a non-canonical code string returns SERVICE_NOT_FOUND, never throws and never reaches the repository", async () => {
    const repo = new FakeServiceDefinitionRepository();
    let repositoryTouched = false;
    const originalFindByCode = repo.findByCode.bind(repo);
    repo.findByCode = async (...args) => {
      repositoryTouched = true;
      return originalFindByCode(...args);
    };
    const result = await service(repo).update("brunch", { displayName: "X" });
    expect(result).toEqual({ type: "SERVICE_NOT_FOUND" });
    expect(repositoryTouched).toBe(false);
  });

  it("code is structurally immutable — update()'s patch parameter type has no code field, so no caller can ever pass one through this service", () => {
    const repo = new FakeServiceDefinitionRepository();
    const svc = service(repo);
    // @ts-expect-error — code is not an assignable key of the patch parameter.
    void svc.update("lunch", { code: "dinner" });
  });
});
