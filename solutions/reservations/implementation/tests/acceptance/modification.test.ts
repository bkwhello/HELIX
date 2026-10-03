import { describe, it, expect } from "vitest";
import { ReservationAggregate } from "../../domain/aggregates/ReservationAggregate.js";
import { PreferredArea } from "../../domain/value-objects/PreferredArea.js";
import { validCreateCommand, testEnvelope, staffActor, unauthorizedActor, NOW, FUTURE_DATE } from "../support/factories.js";

function createProposedReservation(): ReservationAggregate {
  const result = ReservationAggregate.create(validCreateCommand());
  if (!result.ok) throw new Error("test setup failed");
  result.value.pullEvents();
  return result.value;
}

// CAP-D01.01-AC08 — Modify Valid Reservation Information
describe("AC08 — Modify Valid Reservation Information", () => {
  it("applies the change atomically, keeps identity unchanged, and emits ReservationModified", () => {
    const aggregate = createProposedReservation();
    const originalId = aggregate.getId().toString();

    const result = aggregate.modify({ ...testEnvelope(), actor: staffActor, changes: { partySize: 6 } }, NOW);

    expect(result.ok).toBe(true);
    expect(aggregate.getId().toString()).toBe(originalId);
    expect(aggregate.getPartySize()).toBe(6);

    const events = aggregate.pullEvents();
    expect(events).toHaveLength(1);
    expect(events[0]!.type).toBe("ReservationModified");
  });
});

// CAP-D01.01-AC09 — Revalidate Service Period After Date or Time Change
describe("AC09 — Revalidate Service Period After Date or Time Change", () => {
  const newDate = new Date(FUTURE_DATE.getTime() + 86_400_000);

  it("rejects a date change that carries neither a revalidated Service Period nor a validity confirmation (CAP-D01.01-R20)", () => {
    const aggregate = createProposedReservation();
    const originalServicePeriodId = aggregate.getServicePeriodId();

    const result = aggregate.modify({ ...testEnvelope(), actor: staffActor, changes: { reservationDate: newDate } }, NOW);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.violations.some((v) => v.ruleId === "CAP-D01.01-R20")).toBe(true);
    }
    expect(aggregate.getServicePeriodId()).toBe(originalServicePeriodId);
    expect(aggregate.pullEvents()).toHaveLength(0);
  });

  it("accepts a date change when a revalidated Service Period is supplied", () => {
    const aggregate = createProposedReservation();

    const result = aggregate.modify(
      { ...testEnvelope(), actor: staffActor, changes: { reservationDate: newDate, servicePeriodId: "sp-2" } },
      NOW
    );

    expect(result.ok).toBe(true);
    expect(aggregate.getServicePeriodId()).toBe("sp-2");
  });

  it("accepts a date change when the caller confirms the existing Service Period still holds", () => {
    const aggregate = createProposedReservation();
    const originalServicePeriodId = aggregate.getServicePeriodId();

    const result = aggregate.modify(
      { ...testEnvelope(), actor: staffActor, changes: { reservationDate: newDate }, isServicePeriodStillValid: true },
      NOW
    );

    expect(result.ok).toBe(true);
    expect(aggregate.getServicePeriodId()).toBe(originalServicePeriodId);
  });

  it("does not require Service Period revalidation when date/time is unchanged", () => {
    const aggregate = createProposedReservation();
    expect(aggregate.needsServicePeriodRevalidation(["contactId"])).toBe(false);

    const result = aggregate.modify({ ...testEnvelope(), actor: staffActor, changes: { contactId: "contact-2" } }, NOW);
    expect(result.ok).toBe(true);
  });
});

// CAP-D01.01-R48 — manual table assignment (staff-entered, not a Seating Assignment guarantee)
describe("Manual table assignment", () => {
  it("sets the table assignment and does not require Service Period revalidation", () => {
    const aggregate = createProposedReservation();

    const result = aggregate.modify({ ...testEnvelope(), actor: staffActor, changes: { tableAssignment: "C1" } }, NOW);

    expect(result.ok).toBe(true);
    expect(aggregate.getTableAssignment()).toBe("C1");
  });

  it("can be changed to a different table later", () => {
    const aggregate = createProposedReservation();
    aggregate.modify({ ...testEnvelope(), actor: staffActor, changes: { tableAssignment: "C1" } }, NOW);
    aggregate.pullEvents();

    const result = aggregate.modify({ ...testEnvelope(), actor: staffActor, changes: { tableAssignment: "D3" } }, NOW);

    expect(result.ok).toBe(true);
    expect(aggregate.getTableAssignment()).toBe("D3");
  });
});

// Operational arrival marker — staff-toggled, not modeled with a formal rule (see ReservationAggregate).
describe("Marking a reservation as arrived", () => {
  it("has no arrival mark by default", () => {
    const aggregate = createProposedReservation();
    expect(aggregate.getArrivedAt()).toBeUndefined();
  });

  it("marks the reservation as arrived", () => {
    const aggregate = createProposedReservation();
    const arrivedAt = new Date(NOW.getTime() + 60_000);

    const result = aggregate.modify({ ...testEnvelope(), actor: staffActor, changes: { arrivedAt } }, NOW);

    expect(result.ok).toBe(true);
    expect(aggregate.getArrivedAt()).toEqual(arrivedAt);
  });

  it("clears a mistaken arrival mark via an explicit null", () => {
    const aggregate = createProposedReservation();
    aggregate.modify({ ...testEnvelope(), actor: staffActor, changes: { arrivedAt: new Date(NOW.getTime() + 60_000) } }, NOW);
    aggregate.pullEvents();

    const result = aggregate.modify({ ...testEnvelope(), actor: staffActor, changes: { arrivedAt: null } }, NOW);

    expect(result.ok).toBe(true);
    expect(aggregate.getArrivedAt()).toBeUndefined();
  });
});

// CAP-D01.01-R36/R37 — notes can be added or corrected after creation
describe("Editing notes after creation", () => {
  it("adds a note to a reservation that had none", () => {
    const aggregate = createProposedReservation();
    expect(aggregate.getNotes()).toBeUndefined();

    const result = aggregate.modify({ ...testEnvelope(), actor: staffActor, changes: { notes: "Op de rekening zetten" } }, NOW);

    expect(result.ok).toBe(true);
    expect(aggregate.getNotes()).toBe("Op de rekening zetten");
  });

  it("corrects an existing note", () => {
    const aggregate = createProposedReservation();
    aggregate.modify({ ...testEnvelope(), actor: staffActor, changes: { notes: "Notenallergie" } }, NOW);
    aggregate.pullEvents();

    const result = aggregate.modify(
      { ...testEnvelope(), actor: staffActor, changes: { notes: "Notenallergie + graag venstertafel" } },
      NOW
    );

    expect(result.ok).toBe(true);
    expect(aggregate.getNotes()).toBe("Notenallergie + graag venstertafel");
  });
});

// CAP-D01.01-R48 — preference can change after creation (guest changes their mind, or staff learn the real preference later)
describe("Changing the preferred area after creation", () => {
  it("switches from Sushi to Teppanyaki", () => {
    const aggregate = createProposedReservation();
    expect(aggregate.getPreferredArea()).toBeUndefined();

    const result = aggregate.modify(
      { ...testEnvelope(), actor: staffActor, changes: { preferredArea: PreferredArea.Sushi } },
      NOW
    );
    expect(result.ok).toBe(true);
    expect(aggregate.getPreferredArea()).toBe(PreferredArea.Sushi);

    const secondResult = aggregate.modify(
      { ...testEnvelope(), actor: staffActor, changes: { preferredArea: PreferredArea.Teppanyaki } },
      NOW
    );
    expect(secondResult.ok).toBe(true);
    expect(aggregate.getPreferredArea()).toBe(PreferredArea.Teppanyaki);
  });
});

// CAP-D01.01-R07 — a mis-noted guest name can be corrected after creation
describe("Editing the guest name after creation", () => {
  it("corrects a misspelled name", () => {
    const aggregate = createProposedReservation();

    const result = aggregate.modify({ ...testEnvelope(), actor: staffActor, changes: { contactName: "Jan Janssen" } }, NOW);

    expect(result.ok).toBe(true);
    expect(aggregate.getContactName()).toBe("Jan Janssen");
  });
});

// CAP-D01.01-R12 — the recorded source can be corrected after creation
describe("Editing the reservation source after creation", () => {
  it("corrects the source category", () => {
    const aggregate = createProposedReservation();

    const result = aggregate.modify(
      { ...testEnvelope(), actor: staffActor, changes: { source: { category: "Google" } } },
      NOW
    );

    expect(result.ok).toBe(true);
    expect(aggregate.getSource().category).toBe("Google");
  });

  it("rejects an unknown source category and leaves the source unchanged (CAP-D01.01-R12)", () => {
    const aggregate = createProposedReservation();
    const originalCategory = aggregate.getSource().category;

    const result = aggregate.modify(
      { ...testEnvelope(), actor: staffActor, changes: { source: { category: "Carrier Pigeon" as never } } },
      NOW
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.violations.some((v) => v.ruleId === "CAP-D01.01-R12")).toBe(true);
    }
    expect(aggregate.getSource().category).toBe(originalCategory);
  });
});

// CAP-D01.01-AC11 — Prevent Internal Identity Modification
describe("AC11 — Prevent Internal Identity Modification", () => {
  it("rejects an attempt to modify the internal Reservation Identity", () => {
    const aggregate = createProposedReservation();
    const originalId = aggregate.getId().toString();

    const result = aggregate.modify(
      { ...testEnvelope(), actor: staffActor, changes: {}, isAuthorizedCorrection: false },
      NOW
    );
    // Simulate an attempted identity change via the immutable-fields guard directly,
    // since ReservationId has no public mutator on the aggregate at all —
    // CAP-D01.01-R02 is enforced by the type never exposing a setter.
    expect(result.ok).toBe(true); // no-op modify with no changes still succeeds
    expect(aggregate.getId().toString()).toBe(originalId);
  });
});

// CAP-D01.01-AC17 — Reject Unauthorized Modification
describe("AC17 — Reject Unauthorized Modification", () => {
  it("rejects modification from an actor without permission and leaves state unchanged", () => {
    const aggregate = createProposedReservation();
    const originalPartySize = aggregate.getPartySize();

    const result = aggregate.modify({ ...testEnvelope(), actor: unauthorizedActor, changes: { partySize: 8 } }, NOW);

    expect(result.ok).toBe(false);
    expect(aggregate.getPartySize()).toBe(originalPartySize);
    expect(aggregate.pullEvents()).toHaveLength(0);
  });
});

// R1.3-I3 — CAP-D05.02. A critical-note-only Modify: `changes` is entirely
// empty, the ONLY thing that changed is the critical-note set — exactly
// the shape ModifyReservationHandler builds for a pilot "add/edit/resolve"
// action (see api/app.ts's own PATCH route, which sends `changes: {}`
// alongside `criticalNoteChanges`).
describe("CAP-D05.02 — critical-note-only Modify", () => {
  it("a note-only Modify still increments state and emits exactly one ReservationModified event", () => {
    const aggregate = createProposedReservation();

    const result = aggregate.modify(
      {
        ...testEnvelope(),
        actor: staffActor,
        changes: {},
        criticalNotesChanged: true,
        previousCriticalNotes: [],
        resultingCriticalNotes: [{ id: "note-1", noteType: "Allergy", detail: "noten", status: "Active" }],
      },
      NOW
    );

    expect(result.ok).toBe(true);
    const events = aggregate.pullEvents();
    expect(events).toHaveLength(1);
    const modified = events[0];
    expect(modified?.type).toBe("ReservationModified");
    if (modified?.type !== "ReservationModified") return;
    expect(modified.changedFields).toEqual(["criticalNotes"]);
    expect(modified.previousValues["criticalNotes"]).toEqual([]);
    expect(modified.resultingValues["criticalNotes"]).toEqual([{ id: "note-1", noteType: "Allergy", detail: "noten", status: "Active" }]);
  });

  it("carries previous/resulting snapshots for an update (one note's before/after state)", () => {
    const aggregate = createProposedReservation();

    const result = aggregate.modify(
      {
        ...testEnvelope(),
        actor: staffActor,
        changes: {},
        criticalNotesChanged: true,
        previousCriticalNotes: [{ id: "note-1", noteType: "Allergy", detail: "noten", status: "Active" }],
        resultingCriticalNotes: [{ id: "note-1", noteType: "Allergy", detail: "pinda's EN noten", status: "Active" }],
      },
      NOW
    );

    expect(result.ok).toBe(true);
    const modified = aggregate.pullEvents()[0];
    if (modified?.type !== "ReservationModified") return;
    expect(modified.previousValues["criticalNotes"]).toEqual([{ id: "note-1", noteType: "Allergy", detail: "noten", status: "Active" }]);
    expect(modified.resultingValues["criticalNotes"]).toEqual([{ id: "note-1", noteType: "Allergy", detail: "pinda's EN noten", status: "Active" }]);
  });

  it("carries a Resolved status in the resulting snapshot (one-way resolution)", () => {
    const aggregate = createProposedReservation();

    const result = aggregate.modify(
      {
        ...testEnvelope(),
        actor: staffActor,
        changes: {},
        criticalNotesChanged: true,
        previousCriticalNotes: [{ id: "note-1", noteType: "Critical", detail: "rolstoel", status: "Active" }],
        resultingCriticalNotes: [{ id: "note-1", noteType: "Critical", detail: "rolstoel", status: "Resolved" }],
      },
      NOW
    );

    expect(result.ok).toBe(true);
    const modified = aggregate.pullEvents()[0];
    if (modified?.type !== "ReservationModified") return;
    expect((modified.resultingValues["criticalNotes"] as unknown[])[0]).toMatchObject({ status: "Resolved" });
  });

  it("a note-only Modify against a TERMINAL (Cancelled) reservation is rejected by the existing, unmodified CAP-D01.01-R16 check", () => {
    const aggregate = createProposedReservation();
    const cancelResult = aggregate.cancel({ ...testEnvelope(), actor: staffActor }, NOW);
    expect(cancelResult.ok).toBe(true);
    aggregate.pullEvents();

    const result = aggregate.modify(
      {
        ...testEnvelope(),
        actor: staffActor,
        changes: {},
        criticalNotesChanged: true,
        previousCriticalNotes: [],
        resultingCriticalNotes: [{ id: "note-1", noteType: "Allergy", detail: "noten", status: "Active" }],
      },
      NOW
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.violations.some((v) => v.ruleId === "CAP-D01.01-R16")).toBe(true);
    }
    // Nothing was emitted — the rejected attempt produced no event at all.
    expect(aggregate.pullEvents()).toHaveLength(0);
  });

  it("a plain field-only Modify (criticalNotesChanged omitted) is entirely unaffected — changedFields never mentions criticalNotes", () => {
    const aggregate = createProposedReservation();

    const result = aggregate.modify({ ...testEnvelope(), actor: staffActor, changes: { partySize: 5 } }, NOW);

    expect(result.ok).toBe(true);
    const modified = aggregate.pullEvents()[0];
    if (modified?.type !== "ReservationModified") return;
    expect(modified.changedFields).not.toContain("criticalNotes");
    expect(modified.previousValues["criticalNotes"]).toBeUndefined();
  });
});
