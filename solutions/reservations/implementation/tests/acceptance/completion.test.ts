import { describe, it, expect } from "vitest";
import { ReservationAggregate } from "../../domain/aggregates/ReservationAggregate.js";
import { ReservationStatus } from "../../domain/value-objects/ReservationStatus.js";
import { validCreateCommand, staffActor, NOW } from "../support/factories.js";

function createConfirmedReservation(): ReservationAggregate {
  const result = ReservationAggregate.create(validCreateCommand());
  if (!result.ok) throw new Error("test setup failed");
  const aggregate = result.value;
  aggregate.pullEvents();
  aggregate.confirm({ actor: staffActor }, NOW, true);
  aggregate.pullEvents();
  return aggregate;
}

// CAP-D01.01-AC15 — Complete a Confirmed Reservation
describe("AC15 — Complete a Confirmed Reservation", () => {
  it("transitions Confirmed to Completed and emits ReservationCompleted", () => {
    const aggregate = createConfirmedReservation();

    const result = aggregate.complete({ actor: staffActor, hasOperationalEvidence: true }, NOW);

    expect(result.ok).toBe(true);
    expect(aggregate.getStatus()).toBe(ReservationStatus.Completed);
    expect(aggregate.pullEvents()[0]!.type).toBe("ReservationCompleted");
  });
});

// CAP-D01.01-AC16 — Reject Completion Without Operational Evidence
describe("AC16 — Reject Completion Without Operational Evidence", () => {
  it("rejects completion and leaves the reservation Confirmed", () => {
    const aggregate = createConfirmedReservation();

    const result = aggregate.complete({ actor: staffActor, hasOperationalEvidence: false }, NOW);

    expect(result.ok).toBe(false);
    expect(aggregate.getStatus()).toBe(ReservationStatus.Confirmed);
    expect(aggregate.pullEvents()).toHaveLength(0);
  });
});
