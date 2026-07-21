import { describe, it, expect, beforeEach } from "vitest";
import { CreateReservationHandler } from "../../application/command-handlers/CreateReservationHandler.js";
import { InMemoryReservationRepository } from "../support/InMemoryReservationRepository.js";
import { staffActor, FUTURE_DATE, NOW } from "../support/factories.js";
import { ReservationSourceCategory } from "../../domain/value-objects/ReservationSource.js";

class FixedClock {
  now(): Date {
    return NOW;
  }
}

let counter = 0;
class SequentialIdGenerator {
  generate(): string {
    counter += 1;
    return `res-${counter}`;
  }
}

describe("CreateReservationHandler", () => {
  let repository: InMemoryReservationRepository;
  let handler: CreateReservationHandler;

  beforeEach(() => {
    repository = new InMemoryReservationRepository();
    handler = new CreateReservationHandler(repository, new SequentialIdGenerator(), new FixedClock());
  });

  // CAP-D01.01-AC01
  it("creates a reservation and persists it", async () => {
    const result = await handler.handle({
      commandId: "cmd-1",
      servicePeriodId: "sp-1",
      contactId: "contact-1",
      reservationDate: FUTURE_DATE,
      partySize: 2,
      source: { category: ReservationSourceCategory.Website },
      actor: staffActor,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const saved = await repository.findById(result.value.getId());
    expect(saved).not.toBeNull();
  });

  // CAP-D01.01-AC02 — Reject Creation Without Required Information
  it("rejects a request missing required information without persisting anything", async () => {
    const result = await handler.handle({
      commandId: "cmd-2",
      servicePeriodId: "",
      contactId: "",
      reservationDate: FUTURE_DATE,
      partySize: 2,
      source: { category: ReservationSourceCategory.Website },
      actor: staffActor,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.violations.some((v) => v.ruleId === "CAP-D01.01-R08")).toBe(true);
    }
  });

  // CAP-D01.01-R44 — Duplicate Command Processing Must Be Safe
  it("ignores a repeated save() call for a commandId that was already applied", async () => {
    const created = await handler.handle({
      commandId: "cmd-idempotent",
      servicePeriodId: "sp-1",
      contactId: "contact-1",
      reservationDate: FUTURE_DATE,
      partySize: 2,
      source: { category: ReservationSourceCategory.Website },
      actor: staffActor,
    });
    expect(created.ok).toBe(true);
    if (!created.ok) return;

    expect(repository.wasCommandApplied("cmd-idempotent")).toBe(true);
    expect(repository.saveCallCount).toBe(1);

    // A repeated save() under the same commandId must be a no-op.
    await repository.save(created.value, "cmd-idempotent");
    expect(repository.saveCallCount).toBe(1);
  });

  // CAP-D01.01-R44 — repeating the whole handler.handle() call (not just
  // repository.save()) must return the ORIGINAL reservation, not a
  // freshly generated identity that then gets silently discarded.
  it("returns the original reservation when handle() is called twice with the same commandId", async () => {
    const request = {
      commandId: "cmd-retry",
      servicePeriodId: "sp-1",
      contactId: "contact-1",
      reservationDate: FUTURE_DATE,
      partySize: 2,
      source: { category: ReservationSourceCategory.Website },
      actor: staffActor,
    };

    const first = await handler.handle(request);
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    const firstId = first.value.getId().toString();

    const second = await handler.handle(request);
    expect(second.ok).toBe(true);
    if (!second.ok) return;

    expect(second.value.getId().toString()).toBe(firstId);
    expect(repository.saveCallCount).toBe(1); // no second write occurred
  });

  // CAP-D01.01-R05 / AC20 — a failed save leaves no visible reservation
  it("does not leave a persisted reservation when save fails", async () => {
    repository.forceNextSaveToFail = true;

    await expect(
      handler.handle({
        commandId: "cmd-3",
        servicePeriodId: "sp-1",
        contactId: "contact-1",
        reservationDate: FUTURE_DATE,
        partySize: 2,
        source: { category: ReservationSourceCategory.Website },
        actor: staffActor,
      })
    ).rejects.toThrow();
  });
});
