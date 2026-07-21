import { describe, it, expect } from "vitest";
import { ReservationAggregate } from "../../domain/aggregates/ReservationAggregate.js";
import { ReservationStatus } from "../../domain/value-objects/ReservationStatus.js";
import { InMemoryReservationRepository } from "../support/InMemoryReservationRepository.js";
import { validCreateCommand, testEnvelope, staffActor, NOW } from "../support/factories.js";

/**
 * These scenarios describe the ReservationRepository.save() contract
 * itself (CAP-D01.01-R05), independent of any single command handler.
 * The in-memory test double is written to honour the same contract as
 * PrismaReservationRepository (see both save() implementations).
 */
describe("ReservationRepository contract — optimistic concurrency", () => {
  it("rejects a save based on a stale expectedVersion once another write has advanced it", async () => {
    const repository = new InMemoryReservationRepository();
    const created = ReservationAggregate.create(validCreateCommand());
    if (!created.ok) throw new Error("test setup failed");
    await repository.save({ aggregate: created.value, expectedVersion: created.value.getVersion(), commandId: "cmd-create" });

    // Two independent "sessions" load the same reservation...
    const sessionA = await repository.findById(created.value.getId());
    const sessionB = await repository.findById(created.value.getId());
    if (!sessionA || !sessionB) throw new Error("test setup failed");

    // ...session A confirms and saves first...
    sessionA.confirm({ ...testEnvelope(), actor: staffActor }, NOW, true);
    const saveA = await repository.save({ aggregate: sessionA, expectedVersion: sessionA.getVersion(), commandId: "cmd-confirm-a" });
    expect(saveA.type).toBe("SAVED");

    // ...session B is now stale and must not silently overwrite it.
    sessionB.cancel({ ...testEnvelope(), actor: staffActor }, NOW);
    const saveB = await repository.save({ aggregate: sessionB, expectedVersion: sessionB.getVersion(), commandId: "cmd-cancel-b" });
    expect(saveB.type).toBe("CONCURRENCY_CONFLICT");

    const current = await repository.findById(created.value.getId());
    expect(current?.getStatus()).toBe(ReservationStatus.Confirmed);
  });
});

describe("ReservationRepository contract — safe event persistence", () => {
  it("keeps pending events on the aggregate when a write fails, so a retry does not lose them", async () => {
    const repository = new InMemoryReservationRepository();
    const created = ReservationAggregate.create(validCreateCommand());
    if (!created.ok) throw new Error("test setup failed");

    repository.forceNextSaveToFail = true;
    await expect(
      repository.save({ aggregate: created.value, expectedVersion: created.value.getVersion(), commandId: "cmd-create" })
    ).rejects.toThrow();

    // The failed write must not have drained the events.
    expect(created.value.peekEvents()).toHaveLength(1);

    // A retry with the same aggregate instance and the same commandId
    // (the realistic case — a client resending its idempotency key) must
    // still persist them.
    const retry = await repository.save({
      aggregate: created.value,
      expectedVersion: created.value.getVersion(),
      commandId: "cmd-create",
    });
    expect(retry.type).toBe("SAVED");
    const saved = await repository.findById(created.value.getId());
    expect(saved).not.toBeNull();
    expect(created.value.peekEvents()).toHaveLength(0);
  });
});

describe("ReservationRepository contract — idempotent replay", () => {
  it("reports IDEMPOTENT_REPLAY without writing anything when commandId was already applied", async () => {
    const repository = new InMemoryReservationRepository();
    const created = ReservationAggregate.create(validCreateCommand());
    if (!created.ok) throw new Error("test setup failed");

    await repository.save({ aggregate: created.value, expectedVersion: created.value.getVersion(), commandId: "cmd-create" });
    const replay = await repository.save({ aggregate: created.value, expectedVersion: created.value.getVersion(), commandId: "cmd-create" });

    expect(replay.type).toBe("IDEMPOTENT_REPLAY");
    expect(repository.saveCallCount).toBe(1);
  });
});
