import { describe, it, expect } from "vitest";
import { ServiceCatalogManagementService } from "../../application/availability/ServiceCatalogManagementService.js";
import { FakeServiceDefinitionRepository, FakeTransactionManager, FakeSecurityEventRecorder } from "../support/FakePorts.js";

/**
 * R1.6-P3B — application-layer coverage for ServiceCatalogManagementService,
 * against the in-memory fake only (never a real database) — real-adapter
 * mutation coverage lives in tests/infrastructure/prisma-service-definition-repository.test.ts,
 * using throwaway non-canonical rows, never the shared lunch/dinner rows.
 *
 * R1.6-P3G — `service()` now wires a FakeTransactionManager and a
 * FakeSecurityEventRecorder underneath, and its returned `update()`
 * supplies a default `actingStaffUserId` so every one of this file's
 * pre-existing two-argument `.update(code, patch)` call sites keeps
 * working unchanged — only the tests that actually care about the audit
 * trail (see the dedicated describe block below) pass an explicit actor
 * id or their own recorder.
 */
const DEFAULT_ACTOR_ID = "staff-test-actor";

function service(repo: FakeServiceDefinitionRepository = new FakeServiceDefinitionRepository(), recorder: FakeSecurityEventRecorder = new FakeSecurityEventRecorder()) {
  const svc = new ServiceCatalogManagementService(repo, new FakeTransactionManager(), recorder);
  return {
    list: () => svc.list(),
    update: (code: string, patch: Parameters<typeof svc.update>[1], actingStaffUserId: string = DEFAULT_ACTOR_ID) => svc.update(code, patch, actingStaffUserId),
  };
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

  it("each row carries exactly code/displayName/enabled/createdAt/updatedAt/defaultOperatingInterval/defaultDurationMinutes — no capacity/floorplan field", async () => {
    const result = await service().list();
    for (const row of result) {
      expect(Object.keys(row).sort()).toEqual(
        ["code", "createdAt", "defaultDurationMinutes", "defaultOperatingInterval", "displayName", "enabled", "updatedAt"].sort()
      );
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

describe("ServiceCatalogManagementService.update — R1.6-P3C-2 defaultOperatingInterval", () => {
  it("object set: an object patch atomically sets the interval", async () => {
    const repo = new FakeServiceDefinitionRepository();
    const result = await service(repo).update("dinner", { defaultOperatingInterval: { startMinute: 1080, endMinute: 1320 } });
    expect(result).toEqual({
      type: "UPDATED",
      service: expect.objectContaining({ code: "dinner", defaultOperatingInterval: { startMinute: 1080, endMinute: 1320 } }),
    });
  });

  it("null clear: a null patch atomically clears an existing interval", async () => {
    const repo = new FakeServiceDefinitionRepository();
    const result = await service(repo).update("lunch", { defaultOperatingInterval: null });
    expect(result).toEqual({ type: "UPDATED", service: expect.objectContaining({ code: "lunch", defaultOperatingInterval: null }) });
  });

  it("omission: no defaultOperatingInterval key leaves the existing interval untouched", async () => {
    const repo = new FakeServiceDefinitionRepository();
    const result = await service(repo).update("lunch", { displayName: "Lunchkaart" });
    expect(result).toEqual({
      type: "UPDATED",
      service: expect.objectContaining({ displayName: "Lunchkaart", defaultOperatingInterval: { startMinute: 720, endMinute: 960 } }),
    });
  });

  it("same-value object patch is a no-op: repository.update is never called, updatedAt is preserved exactly", async () => {
    const repo = new FakeServiceDefinitionRepository();
    const before = await repo.findByCode("lunch");
    let updateCalls = 0;
    const originalUpdate = repo.update.bind(repo);
    repo.update = async (...args) => {
      updateCalls += 1;
      return originalUpdate(...args);
    };

    const result = await service(repo).update("lunch", { defaultOperatingInterval: { startMinute: 720, endMinute: 960 } });
    expect(result).toEqual({ type: "UPDATED", service: before });
    expect(updateCalls).toBe(0);
  });

  it("same-null patch (clearing an already-null interval) is a no-op: repository.update is never called", async () => {
    const repo = new FakeServiceDefinitionRepository();
    const before = await repo.findByCode("dinner");
    let updateCalls = 0;
    const originalUpdate = repo.update.bind(repo);
    repo.update = async (...args) => {
      updateCalls += 1;
      return originalUpdate(...args);
    };

    const result = await service(repo).update("dinner", { defaultOperatingInterval: null });
    expect(result).toEqual({ type: "UPDATED", service: before });
    expect(updateCalls).toBe(0);
  });

  it("combined displayName + enabled + defaultOperatingInterval update applies all three together", async () => {
    const repo = new FakeServiceDefinitionRepository();
    const result = await service(repo).update("lunch", {
      displayName: "Lunchkaart",
      enabled: false,
      defaultOperatingInterval: { startMinute: 660, endMinute: 900 },
    });
    expect(result).toEqual({
      type: "UPDATED",
      service: expect.objectContaining({
        code: "lunch",
        displayName: "Lunchkaart",
        enabled: false,
        defaultOperatingInterval: { startMinute: 660, endMinute: 900 },
      }),
    });
  });

  it("unspecified fields (displayName/enabled) remain unchanged when only the interval is patched", async () => {
    const repo = new FakeServiceDefinitionRepository();
    const result = await service(repo).update("lunch", { defaultOperatingInterval: null });
    expect(result).toEqual({
      type: "UPDATED",
      service: expect.objectContaining({ displayName: "Lunch", enabled: true }),
    });
  });

  it("interval equality is by value, not object identity — a freshly-constructed object with equal minutes is still treated as unchanged", async () => {
    const repo = new FakeServiceDefinitionRepository();
    let updateCalls = 0;
    const originalUpdate = repo.update.bind(repo);
    repo.update = async (...args) => {
      updateCalls += 1;
      return originalUpdate(...args);
    };
    // A brand-new object literal, never the same reference as the stored value.
    const result = await service(repo).update("lunch", { defaultOperatingInterval: { startMinute: 720, endMinute: 960 } });
    expect(result.type).toBe("UPDATED");
    expect(updateCalls).toBe(0);
  });

  it("an unknown Service code returns SERVICE_NOT_FOUND even when a defaultOperatingInterval patch is supplied", async () => {
    const repo = new FakeServiceDefinitionRepository();
    repo.remove("lunch");
    const result = await service(repo).update("lunch", { defaultOperatingInterval: { startMinute: 0, endMinute: 60 } });
    expect(result).toEqual({ type: "SERVICE_NOT_FOUND" });
  });

  it("updatedAt is preserved exactly across a same-value interval no-op, matching the existing displayName/enabled no-op contract", async () => {
    const repo = new FakeServiceDefinitionRepository();
    const before = await repo.findByCode("dinner");
    const result = await service(repo).update("dinner", { defaultOperatingInterval: null });
    expect((result as { service: { updatedAt: Date } }).service.updatedAt).toEqual(before?.updatedAt);
  });
});

describe("ServiceCatalogManagementService.update — R1.6-P3D-2 defaultDurationMinutes", () => {
  it("set from null: both canonical Services start null, a numeric patch atomically sets it", async () => {
    const repo = new FakeServiceDefinitionRepository();
    const result = await service(repo).update("lunch", { defaultDurationMinutes: 90 });
    expect(result).toEqual({ type: "UPDATED", service: expect.objectContaining({ code: "lunch", defaultDurationMinutes: 90 }) });
  });

  it("replace configured value: a different number atomically replaces the existing one", async () => {
    const repo = new FakeServiceDefinitionRepository();
    await service(repo).update("lunch", { defaultDurationMinutes: 90 });
    const result = await service(repo).update("lunch", { defaultDurationMinutes: 480 });
    expect(result).toEqual({ type: "UPDATED", service: expect.objectContaining({ code: "lunch", defaultDurationMinutes: 480 }) });
  });

  it("clear to null: a null patch atomically clears a configured value", async () => {
    const repo = new FakeServiceDefinitionRepository();
    await service(repo).update("lunch", { defaultDurationMinutes: 90 });
    const result = await service(repo).update("lunch", { defaultDurationMinutes: null });
    expect(result).toEqual({ type: "UPDATED", service: expect.objectContaining({ code: "lunch", defaultDurationMinutes: null }) });
  });

  it("same-value patch is a no-op: repository.update is never called, updatedAt is preserved exactly", async () => {
    const repo = new FakeServiceDefinitionRepository();
    const before = await repo.findByCode("dinner");
    let updateCalls = 0;
    const originalUpdate = repo.update.bind(repo);
    repo.update = async (...args) => {
      updateCalls += 1;
      return originalUpdate(...args);
    };

    const result = await service(repo).update("dinner", { defaultDurationMinutes: null });
    expect(result).toEqual({ type: "UPDATED", service: before });
    expect(updateCalls).toBe(0);
  });

  it("same-value patch against a configured (non-null) value is also a no-op", async () => {
    const repo = new FakeServiceDefinitionRepository();
    await service(repo).update("lunch", { defaultDurationMinutes: 90 });
    let updateCalls = 0;
    const originalUpdate = repo.update.bind(repo);
    repo.update = async (...args) => {
      updateCalls += 1;
      return originalUpdate(...args);
    };
    const result = await service(repo).update("lunch", { defaultDurationMinutes: 90 });
    expect(result.type).toBe("UPDATED");
    expect(updateCalls).toBe(0);
  });

  it("mixed-field atomic update: displayName + enabled + defaultOperatingInterval + defaultDurationMinutes together are one repository call", async () => {
    const repo = new FakeServiceDefinitionRepository();
    let updateCalls = 0;
    const originalUpdate = repo.update.bind(repo);
    repo.update = async (...args) => {
      updateCalls += 1;
      return originalUpdate(...args);
    };
    const result = await service(repo).update("lunch", {
      displayName: "Lunchkaart",
      enabled: false,
      defaultOperatingInterval: { startMinute: 660, endMinute: 900 },
      defaultDurationMinutes: 90,
    });
    expect(result).toEqual({
      type: "UPDATED",
      service: expect.objectContaining({
        code: "lunch",
        displayName: "Lunchkaart",
        enabled: false,
        defaultOperatingInterval: { startMinute: 660, endMinute: 900 },
        defaultDurationMinutes: 90,
      }),
    });
    expect(updateCalls).toBe(1);
  });

  it("unspecified fields (displayName/enabled/interval) remain unchanged when only duration is patched", async () => {
    const repo = new FakeServiceDefinitionRepository();
    const result = await service(repo).update("lunch", { defaultDurationMinutes: 90 });
    expect(result).toEqual({
      type: "UPDATED",
      service: expect.objectContaining({ displayName: "Lunch", enabled: true, defaultOperatingInterval: { startMinute: 720, endMinute: 960 } }),
    });
  });

  it("an unknown Service code returns SERVICE_NOT_FOUND even when a defaultDurationMinutes patch is supplied", async () => {
    const repo = new FakeServiceDefinitionRepository();
    repo.remove("lunch");
    const result = await service(repo).update("lunch", { defaultDurationMinutes: 90 });
    expect(result).toEqual({ type: "SERVICE_NOT_FOUND" });
  });

  it("updatedAt is preserved exactly across a same-value duration no-op, matching the existing no-op contract", async () => {
    const repo = new FakeServiceDefinitionRepository();
    const before = await repo.findByCode("dinner");
    const result = await service(repo).update("dinner", { defaultDurationMinutes: null });
    expect((result as { service: { updatedAt: Date } }).service.updatedAt).toEqual(before?.updatedAt);
  });
});

describe("ServiceCatalogManagementService.update — R1.6-P3G audit-event selection", () => {
  it("displayName-only change emits exactly one ServiceModified with only that field", async () => {
    const recorder = new FakeSecurityEventRecorder();
    const repo = new FakeServiceDefinitionRepository();
    await service(repo, recorder).update("lunch", { displayName: "Lunchkaart" }, "staff-a");
    expect(recorder.calls).toHaveLength(1);
    expect(recorder.calls[0]).toMatchObject({
      type: "ServiceModified",
      actingStaffUserId: "staff-a",
      metadata: { serviceCode: "lunch", changes: { displayName: { old: "Lunch", new: "Lunchkaart" } } },
    });
  });

  it("defaultOperatingInterval-only change emits exactly one ServiceModified with only that field, as nested {startMinute,endMinute} old/new", async () => {
    const recorder = new FakeSecurityEventRecorder();
    const repo = new FakeServiceDefinitionRepository();
    await service(repo, recorder).update("lunch", { defaultOperatingInterval: { startMinute: 0, endMinute: 60 } }, "staff-a");
    expect(recorder.calls).toHaveLength(1);
    expect(recorder.calls[0]).toMatchObject({
      type: "ServiceModified",
      metadata: {
        serviceCode: "lunch",
        changes: { defaultOperatingInterval: { old: { startMinute: 720, endMinute: 960 }, new: { startMinute: 0, endMinute: 60 } } },
      },
    });
  });

  it("defaultOperatingInterval clear-to-null emits ServiceModified with new: null, old preserved", async () => {
    const recorder = new FakeSecurityEventRecorder();
    const repo = new FakeServiceDefinitionRepository();
    await service(repo, recorder).update("lunch", { defaultOperatingInterval: null }, "staff-a");
    expect(recorder.calls[0]).toMatchObject({
      metadata: { changes: { defaultOperatingInterval: { old: { startMinute: 720, endMinute: 960 }, new: null } } },
    });
  });

  it("defaultDurationMinutes-only change emits exactly one ServiceModified with only that field", async () => {
    const recorder = new FakeSecurityEventRecorder();
    const repo = new FakeServiceDefinitionRepository();
    await service(repo, recorder).update("lunch", { defaultDurationMinutes: 90 }, "staff-a");
    expect(recorder.calls).toHaveLength(1);
    expect(recorder.calls[0]).toMatchObject({
      type: "ServiceModified",
      metadata: { serviceCode: "lunch", changes: { defaultDurationMinutes: { old: null, new: 90 } } },
    });
  });

  it("a multi-field non-activation update emits ONE ServiceModified containing all and only the changed fields, in deterministic order", async () => {
    const recorder = new FakeSecurityEventRecorder();
    const repo = new FakeServiceDefinitionRepository();
    await service(repo, recorder).update(
      "lunch",
      { displayName: "Lunchkaart", defaultOperatingInterval: { startMinute: 660, endMinute: 900 }, defaultDurationMinutes: 90 },
      "staff-a"
    );
    expect(recorder.calls).toHaveLength(1);
    const call = recorder.calls[0];
    expect(call?.type).toBe("ServiceModified");
    expect(call && "metadata" in call ? Object.keys(call.metadata.changes) : []).toEqual(["displayName", "defaultOperatingInterval", "defaultDurationMinutes"]);
  });

  it("enabled true->false emits exactly one ServiceDeactivated, never ServiceModified", async () => {
    const recorder = new FakeSecurityEventRecorder();
    const repo = new FakeServiceDefinitionRepository();
    await service(repo, recorder).update("lunch", { enabled: false }, "staff-a");
    expect(recorder.calls).toHaveLength(1);
    expect(recorder.calls[0]).toMatchObject({
      type: "ServiceDeactivated",
      metadata: { serviceCode: "lunch", changes: { enabled: { old: true, new: false } } },
    });
  });

  it("enabled false->true emits exactly one ServiceReactivated, never ServiceModified", async () => {
    const recorder = new FakeSecurityEventRecorder();
    const repo = new FakeServiceDefinitionRepository();
    repo.setEnabled("lunch", false);
    await service(repo, recorder).update("lunch", { enabled: true }, "staff-a");
    expect(recorder.calls).toHaveLength(1);
    expect(recorder.calls[0]).toMatchObject({
      type: "ServiceReactivated",
      metadata: { serviceCode: "lunch", changes: { enabled: { old: false, new: true } } },
    });
  });

  it("an activation transition combined with other field changes emits ONE activation-state event containing every changed field, not a separate ServiceModified", async () => {
    const recorder = new FakeSecurityEventRecorder();
    const repo = new FakeServiceDefinitionRepository();
    await service(repo, recorder).update("lunch", { displayName: "Lunchkaart", enabled: false, defaultDurationMinutes: 90 }, "staff-a");
    expect(recorder.calls).toHaveLength(1);
    const call = recorder.calls[0];
    expect(call?.type).toBe("ServiceDeactivated");
    expect(call && "metadata" in call ? Object.keys(call.metadata.changes).sort() : []).toEqual(["defaultDurationMinutes", "displayName", "enabled"].sort());
  });

  it("a same-value update (no real change) emits no event at all", async () => {
    const recorder = new FakeSecurityEventRecorder();
    const repo = new FakeServiceDefinitionRepository();
    await service(repo, recorder).update("lunch", { displayName: "Lunch", enabled: true }, "staff-a");
    expect(recorder.calls).toHaveLength(0);
  });

  it("a same-null defaultOperatingInterval/defaultDurationMinutes patch emits no event", async () => {
    const recorder = new FakeSecurityEventRecorder();
    const repo = new FakeServiceDefinitionRepository();
    await service(repo, recorder).update("dinner", { defaultOperatingInterval: null, defaultDurationMinutes: null }, "staff-a");
    expect(recorder.calls).toHaveLength(0);
  });

  it("SERVICE_NOT_FOUND (unknown code) emits no event", async () => {
    const recorder = new FakeSecurityEventRecorder();
    const repo = new FakeServiceDefinitionRepository();
    repo.remove("lunch");
    const result = await service(repo, recorder).update("lunch", { displayName: "X" }, "staff-a");
    expect(result).toEqual({ type: "SERVICE_NOT_FOUND" });
    expect(recorder.calls).toHaveLength(0);
  });

  it("SERVICE_NOT_FOUND (non-canonical code string) emits no event", async () => {
    const recorder = new FakeSecurityEventRecorder();
    const repo = new FakeServiceDefinitionRepository();
    const result = await service(repo, recorder).update("brunch", { displayName: "X" }, "staff-a");
    expect(result).toEqual({ type: "SERVICE_NOT_FOUND" });
    expect(recorder.calls).toHaveLength(0);
  });

  it("actingStaffUserId flows through unchanged to whichever event type is emitted", async () => {
    const recorder = new FakeSecurityEventRecorder();
    const repo = new FakeServiceDefinitionRepository();
    await service(repo, recorder).update("lunch", { displayName: "X" }, "staff-specific-id");
    expect(recorder.calls[0]).toMatchObject({ actingStaffUserId: "staff-specific-id" });
  });

  it("a forced SecurityEvent insertion failure propagates (rejects) rather than being swallowed — real rollback-under-a-shared-transaction proof lives in the real-Postgres integration suite", async () => {
    const recorder = new FakeSecurityEventRecorder();
    recorder.failNextServiceEventWith = new Error("forced audit failure");
    const repo = new FakeServiceDefinitionRepository();
    await expect(service(repo, recorder).update("lunch", { displayName: "X" }, "staff-a")).rejects.toThrow("forced audit failure");
  });
});
