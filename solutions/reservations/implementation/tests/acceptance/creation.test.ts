import { describe, it, expect } from "vitest";
import { ReservationAggregate } from "../../domain/aggregates/ReservationAggregate.js";
import { ReservationStatus } from "../../domain/value-objects/ReservationStatus.js";
import { ReservationSourceCategory } from "../../domain/value-objects/ReservationSource.js";
import { PreferredArea } from "../../domain/value-objects/PreferredArea.js";
import { validCreateCommand, unauthorizedActor, PAST_DATE } from "../support/factories.js";

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

// CAP-D01.01-AC05 — Detect a Potential Duplicate
describe("AC05 — Detect a Potential Duplicate", () => {
  it("still creates the reservation but marks the event with a duplicate warning (CAP-D01.01-R14)", () => {
    const result = ReservationAggregate.create(validCreateCommand({ potentialDuplicateDetected: true }));

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const events = result.value.pullEvents();
    const created = events[0];
    expect(created?.type).toBe("ReservationCreated");
    if (created?.type === "ReservationCreated") {
      expect(created.potentialDuplicateWarning).toBe(true);
    }
  });

  it("does not mark the event when no duplicate was detected", () => {
    const result = ReservationAggregate.create(validCreateCommand({ potentialDuplicateDetected: false }));
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const created = result.value.pullEvents()[0];
    if (created?.type === "ReservationCreated") {
      expect(created.potentialDuplicateWarning).toBe(false);
    }
  });
});

// CAP-D01.01-R07 / R48 — guest name and preferred area (Sushi/Teppanyaki)
describe("Guest name and preferred area", () => {
  it("carries the guest name and preferred area onto the aggregate and the event", () => {
    const result = ReservationAggregate.create(
      validCreateCommand({ contactName: "Jan Jansen", preferredArea: PreferredArea.Teppanyaki })
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.value.getContactName()).toBe("Jan Jansen");
    expect(result.value.getPreferredArea()).toBe(PreferredArea.Teppanyaki);

    const created = result.value.pullEvents()[0];
    if (created?.type === "ReservationCreated") {
      expect(created.contactName).toBe("Jan Jansen");
      expect(created.preferredArea).toBe(PreferredArea.Teppanyaki);
    }
  });

  it("leaves both undefined when not supplied — CAP-D01.01-R48 is Warning severity, not required", () => {
    const result = ReservationAggregate.create(validCreateCommand());
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.value.getContactName()).toBeUndefined();
    expect(result.value.getPreferredArea()).toBeUndefined();
  });
});

// CAP-D01.01-AC39 — Reject Unauthorized Creation
describe("AC39 — Reject Unauthorized Creation", () => {
  it("rejects creation from an actor without permission and creates nothing (CAP-D01.01-R32)", () => {
    const result = ReservationAggregate.create(validCreateCommand({ actor: unauthorizedActor }));

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.violations.some((v) => v.ruleId === "CAP-D01.01-R32")).toBe(true);
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
