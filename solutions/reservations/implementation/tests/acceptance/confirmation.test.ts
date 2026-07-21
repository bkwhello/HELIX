import { describe, it, expect } from "vitest";
import { ReservationAggregate } from "../../domain/aggregates/ReservationAggregate.js";
import { ReservationStatus } from "../../domain/value-objects/ReservationStatus.js";
import { validCreateCommand, staffActor, NOW } from "../support/factories.js";

function createProposedReservation(): ReservationAggregate {
  const result = ReservationAggregate.create(validCreateCommand());
  if (!result.ok) throw new Error("test setup failed");
  result.value.pullEvents();
  return result.value;
}

// CAP-D01.01-AC06 — Confirm a Proposed Reservation
describe("AC06 — Confirm a Proposed Reservation", () => {
  it("transitions Proposed to Confirmed and emits ReservationConfirmed", () => {
    const aggregate = createProposedReservation();

    const result = aggregate.confirm({ actor: staffActor }, NOW, true);

    expect(result.ok).toBe(true);
    expect(aggregate.getStatus()).toBe(ReservationStatus.Confirmed);

    const events = aggregate.pullEvents();
    expect(events).toHaveLength(1);
    expect(events[0]!.type).toBe("ReservationConfirmed");
  });

  it("rejects confirmation when required reservation data is invalid (CAP-D01.01-R23)", () => {
    const aggregate = createProposedReservation();
    const result = aggregate.confirm({ actor: staffActor }, NOW, false);

    expect(result.ok).toBe(false);
    expect(aggregate.getStatus()).toBe(ReservationStatus.Proposed);
  });
});

// CAP-D01.01-AC07 — Reject Confirmation from a Terminal State
describe("AC07 — Reject Confirmation from a Terminal State", () => {
  it("rejects confirming a Cancelled reservation and leaves state unchanged", () => {
    const aggregate = createProposedReservation();
    aggregate.cancel({ actor: staffActor }, NOW);
    aggregate.pullEvents();

    const result = aggregate.confirm({ actor: staffActor }, NOW, true);

    expect(result.ok).toBe(false);
    expect(aggregate.getStatus()).toBe(ReservationStatus.Cancelled);
    expect(aggregate.pullEvents()).toHaveLength(0);
  });

  it("rejects confirming a Completed reservation and leaves state unchanged", () => {
    const aggregate = createProposedReservation();
    aggregate.confirm({ actor: staffActor }, NOW, true);
    aggregate.pullEvents();
    aggregate.complete({ actor: staffActor, hasOperationalEvidence: true }, NOW);
    aggregate.pullEvents();

    const result = aggregate.confirm({ actor: staffActor }, NOW, true);

    expect(result.ok).toBe(false);
    expect(aggregate.getStatus()).toBe(ReservationStatus.Completed);
    expect(aggregate.pullEvents()).toHaveLength(0);
  });
});
