import { describe, it, expect } from "vitest";
import { ReservationAggregate } from "../../domain/aggregates/ReservationAggregate.js";
import { ReservationStatus } from "../../domain/value-objects/ReservationStatus.js";
import { ReservationSourceCategory } from "../../domain/value-objects/ReservationSource.js";
import { validCreateCommand, PAST_DATE } from "../support/factories.js";

// CAP-D01.01-AC01 — Create a Valid Reservation
describe("AC01 — Create a Valid Reservation", () => {
  it("creates exactly one reservation in Proposed and emits ReservationCreated", () => {
    const result = ReservationAggregate.create(validCreateCommand());

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.value.getStatus()).toBe(ReservationStatus.Proposed);

    const events = result.value.pullEvents();
    expect(events).toHaveLength(1);
    expect(events[0]!.type).toBe("ReservationCreated");
  });
});

// CAP-D01.01-AC03 — Reject Invalid Party Size (aggregate-level)
describe("AC03 — Reject Invalid Party Size", () => {
  it.each([0, -1, 1.5])("rejects party size %s and leaves no reservation created", (partySize) => {
    const result = ReservationAggregate.create(validCreateCommand({ partySize }));
    expect(result.ok).toBe(false);
  });
});

// CAP-D01.01-AC04 — Preserve Internal Identity for External Reservations
describe("AC04 — Preserve Internal Identity for External Reservations", () => {
  it("stores the external reference without it becoming the internal identity", () => {
    const result = ReservationAggregate.create(
      validCreateCommand({
        source: {
          category: ReservationSourceCategory.ExternalImport,
          externalReference: "thefork-999",
          importedBy: "integration-service",
        },
      })
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.value.getId().toString()).toBe("res-1");

    const events = result.value.pullEvents();
    const created = events[0];
    expect(created?.type).toBe("ReservationCreated");
    if (created?.type === "ReservationCreated") {
      expect(created.externalReference).toBe("thefork-999");
      expect(created.reservationSource).toBe(ReservationSourceCategory.ExternalImport);
    }
  });
});

// CAP-D01.01-R11 — Past Reservation Creation Requires Explicit Policy
describe("CAP-D01.01-R11 — Past reservation creation", () => {
  it("rejects a past reservation without an explicit historical-correction policy", () => {
    const result = ReservationAggregate.create(validCreateCommand({ reservationDate: PAST_DATE }));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.violations.some((v) => v.ruleId === "CAP-D01.01-R11")).toBe(true);
    }
  });

  it("accepts a past reservation when marked as an authorized historical correction with a reason", () => {
    const result = ReservationAggregate.create(
      validCreateCommand({
        reservationDate: PAST_DATE,
        isHistoricalCorrection: true,
        historicalCorrectionReason: "Reconstructing lost paper record",
      })
    );
    expect(result.ok).toBe(true);
  });
});
