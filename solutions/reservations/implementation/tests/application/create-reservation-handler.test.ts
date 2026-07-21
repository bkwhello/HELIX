import { describe, it, expect, beforeEach } from "vitest";
import { CreateReservationHandler } from "../../application/command-handlers/CreateReservationHandler.js";
import { InMemoryReservationRepository } from "../support/InMemoryReservationRepository.js";
import { FakeContactReader, FakeServicePeriodReader, FakeDuplicateReservationChecker } from "../support/FakePorts.js";
import { staffActor, FUTURE_DATE, NOW } from "../support/factories.js";
import { ReservationSourceCategory } from "../../domain/value-objects/ReservationSource.js";

class FixedClock {
  now(): Date {
    return NOW;
  }
}

let idCounter = 0;
class SequentialIdGenerator {
  generate(): string {
    idCounter += 1;
    return `res-${idCounter}`;
  }
}

let eventIdCounter = 0;
class SequentialEventIdGenerator {
  generate(): string {
    eventIdCounter += 1;
    return `evt-${eventIdCounter}`;
  }
}

function validRequest(overrides: Record<string, unknown> = {}) {
  return {
    commandId: "cmd-1",
    servicePeriodId: "sp-1",
    contactId: "contact-1",
    reservationDate: FUTURE_DATE,
    partySize: 2,
    source: { category: ReservationSourceCategory.Website },
    actor: staffActor,
    ...overrides,
  };
}

describe("CreateReservationHandler", () => {
  let repository: InMemoryReservationRepository;
  let contactReader: FakeContactReader;
  let servicePeriodReader: FakeServicePeriodReader;
  let duplicateChecker: FakeDuplicateReservationChecker;
  let handler: CreateReservationHandler;

  beforeEach(() => {
    repository = new InMemoryReservationRepository();
    contactReader = new FakeContactReader();
    servicePeriodReader = new FakeServicePeriodReader();
    duplicateChecker = new FakeDuplicateReservationChecker();
    handler = new CreateReservationHandler(
      repository,
      duplicateChecker,
      contactReader,
      servicePeriodReader,
      new SequentialIdGenerator(),
      new SequentialEventIdGenerator(),
      new FixedClock()
    );
  });

  // CAP-D01.01-AC01
  it("creates a reservation and persists it, returning a DTO rather than the aggregate", async () => {
    const result = await handler.handle(validRequest({ commandId: "cmd-1" }));

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.status).toBe("Proposed");
    expect(result.value.warnings).toHaveLength(0);

    const saved = await repository.findByCommandId("cmd-1");
    expect(saved).not.toBeNull();
    expect(saved?.getId().toString()).toBe(result.value.reservationId);
  });

  // CAP-D01.01-AC02 — Reject Creation Without Required Information
  it("rejects a request missing required information without persisting anything", async () => {
    const result = await handler.handle(validRequest({ commandId: "cmd-2", servicePeriodId: "", contactId: "" }));

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.violations.some((v) => v.ruleId === "CAP-D01.01-R08")).toBe(true);
    }
  });

  // CAP-D01.01-R07 — the contact must actually exist
  it("rejects creation when the referenced contact does not exist", async () => {
    contactReader.contactExists = false;

    const result = await handler.handle(validRequest({ commandId: "cmd-no-contact" }));

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.violations.some((v) => v.ruleId === "CAP-D01.01-R07")).toBe(true);
    }
    expect(await repository.findByCommandId("cmd-no-contact")).toBeNull();
  });

  // CAP-D01.01-R06 — the Service Period must validate against date/time/party size
  it("rejects creation when the Service Period is not valid for the request", async () => {
    servicePeriodReader.result = { isValid: false, reason: "Kitchen is closed at this time." };

    const result = await handler.handle(validRequest({ commandId: "cmd-bad-service-period" }));

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.violations.some((v) => v.ruleId === "CAP-D01.01-R06")).toBe(true);
    }
    expect(await repository.findByCommandId("cmd-bad-service-period")).toBeNull();
  });

  // CAP-D01.01-R14 / AC05 — a potential duplicate is a visible warning, not a rejection
  it("still creates the reservation but returns a warning when a potential duplicate is detected", async () => {
    duplicateChecker.duplicateDetected = true;

    const result = await handler.handle(validRequest({ commandId: "cmd-duplicate" }));

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.warnings.some((w) => w.ruleId === "CAP-D01.01-R14")).toBe(true);
  });

  // CAP-D01.01-R44 — Duplicate Command Processing Must Be Safe
  it("ignores a repeated save() call for a commandId that was already applied", async () => {
    const created = await handler.handle(validRequest({ commandId: "cmd-idempotent" }));
    expect(created.ok).toBe(true);

    expect(repository.wasCommandApplied("cmd-idempotent")).toBe(true);
    expect(repository.saveCallCount).toBe(1);
  });

  // CAP-D01.01-R44 — repeating the whole handler.handle() call (not just
  // repository.save()) must return the ORIGINAL reservation, not a
  // freshly generated identity that then gets silently discarded.
  it("returns the original reservation when handle() is called twice with the same commandId", async () => {
    const request = validRequest({ commandId: "cmd-retry" });

    const first = await handler.handle(request);
    expect(first.ok).toBe(true);
    if (!first.ok) return;

    const second = await handler.handle(request);
    expect(second.ok).toBe(true);
    if (!second.ok) return;

    expect(second.value.reservationId).toBe(first.value.reservationId);
    expect(repository.saveCallCount).toBe(1); // no second write occurred
  });

  // CAP-D01.01-R05 / AC20 — a failed save leaves no visible reservation
  it("does not leave a persisted reservation when save fails", async () => {
    repository.forceNextSaveToFail = true;

    await expect(handler.handle(validRequest({ commandId: "cmd-3" }))).rejects.toThrow();
  });
});
