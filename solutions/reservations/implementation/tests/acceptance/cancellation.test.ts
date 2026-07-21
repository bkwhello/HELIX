import { describe, it, expect } from "vitest";
import { ReservationAggregate } from "../../domain/aggregates/ReservationAggregate.js";
import { ReservationStatus } from "../../domain/value-objects/ReservationStatus.js";
import { validCreateCommand, validCompletionEvidence, testEnvelope, staffActor, NOW } from "../support/factories.js";

function createProposedReservation(): ReservationAggregate {
  const result = ReservationAggregate.create(validCreateCommand());
  if (!result.ok) throw new Error("test setup failed");
  result.value.pullEvents();
  return result.value;
}

// CAP-D01.01-AC12 — Cancel a Proposed Reservation
describe("AC12 — Cancel a Proposed Reservation", () => {
  it("transitions Proposed to Cancelled, preserves identity, and emits ReservationCancelled", () => {
    const aggregate = createProposedReservation();
    const originalId = aggregate.getId().toString();

    const result = aggregate.cancel({ ...testEnvelope(), actor: staffActor, reason: "Guest called to cancel" }, NOW);

    expect(result.ok).toBe(true);
    expect(aggregate.getStatus()).toBe(ReservationStatus.Cancelled);
    expect(aggregate.getId().toString()).toBe(originalId);
    expect(aggregate.pullEvents()[0]!.type).toBe("ReservationCancelled");
  });
});

// CAP-D01.01-AC13 — Cancel a Confirmed Reservation
describe("AC13 — Cancel a Confirmed Reservation", () => {
  it("transitions Confirmed to Cancelled", () => {
    const aggregate = createProposedReservation();
    aggregate.confirm({ ...testEnvelope(), actor: staffActor }, NOW, true);
    aggregate.pullEvents();

    const result = aggregate.cancel({ ...testEnvelope(), actor: staffActor }, NOW);

    expect(result.ok).toBe(true);
    expect(aggregate.getStatus()).toBe(ReservationStatus.Cancelled);
  });
});

// CAP-D01.01-AC14 — Reject Cancellation of a Completed Reservation
describe("AC14 — Reject Cancellation of a Completed Reservation", () => {
  it("rejects cancellation and leaves the reservation Completed", () => {
    const aggregate = createProposedReservation();
    aggregate.confirm({ ...testEnvelope(), actor: staffActor }, NOW, true);
    aggregate.pullEvents();
    aggregate.complete({ ...testEnvelope(), actor: staffActor, evidence: validCompletionEvidence() }, NOW);
    aggregate.pullEvents();

    const result = aggregate.cancel({ ...testEnvelope(), actor: staffActor }, NOW);

    expect(result.ok).toBe(false);
    expect(aggregate.getStatus()).toBe(ReservationStatus.Completed);
    expect(aggregate.pullEvents()).toHaveLength(0);
  });
});
