import { describe, it, expect } from "vitest";
import {
  CriticalNoteDetail,
  validateCriticalNoteType,
  validateCriticalNoteInputs,
  CriticalNoteType,
  CriticalNoteStatus,
} from "../../domain/value-objects/ReservationCriticalNote.js";
import { validateCriticalNoteChangeIdentities, ExistingCriticalNote } from "../../domain/rules/CriticalNoteRules.js";

/**
 * R1.3-I3 — CAP-D05.02 foundation. Pure domain-layer coverage: no I/O, no
 * repository, no handler — exactly the value object / rule-module
 * boundary, mirroring ServiceDefaultDuration's own test posture.
 */
describe("CriticalNoteDetail.create — CAP-D05.02-R01", () => {
  it("accepts a plain, trimmed detail", () => {
    const result = CriticalNoteDetail.create("Pindanootallergie");
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.toString()).toBe("Pindanootallergie");
  });

  it("stores the TRIMMED form, not the raw padded input", () => {
    const result = CriticalNoteDetail.create("   notenallergie   ");
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.toString()).toBe("notenallergie");
  });

  it("rejects an empty string", () => {
    const result = CriticalNoteDetail.create("");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.violations.map((v) => v.ruleId)).toEqual(["CAP-D05.02-R01"]);
  });

  it("rejects a string that is only whitespace", () => {
    const result = CriticalNoteDetail.create("    ");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.violations[0]?.ruleId).toBe("CAP-D05.02-R01");
  });

  it("rejects a non-string value", () => {
    const result = CriticalNoteDetail.create(42 as unknown as string);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.violations[0]?.ruleId).toBe("CAP-D05.02-R01");
  });

  it("accepts exactly 500 characters (the boundary)", () => {
    const result = CriticalNoteDetail.create("a".repeat(500));
    expect(result.ok).toBe(true);
  });

  it("rejects 501 characters (one over the boundary)", () => {
    const result = CriticalNoteDetail.create("a".repeat(501));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.violations[0]?.ruleId).toBe("CAP-D05.02-R01");
  });

  it("the 500-character boundary is measured AFTER trimming, not before", () => {
    // 500 real characters plus surrounding whitespace that trims away —
    // must be accepted, since the stored (trimmed) value is exactly 500.
    const result = CriticalNoteDetail.create("  " + "a".repeat(500) + "  ");
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.toString()).toHaveLength(500);
  });
});

describe("validateCriticalNoteType — CAP-D05.02-R02", () => {
  it("accepts Allergy", () => {
    const result = validateCriticalNoteType("Allergy");
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toBe(CriticalNoteType.Allergy);
  });

  it("accepts Critical", () => {
    const result = validateCriticalNoteType("Critical");
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toBe(CriticalNoteType.Critical);
  });

  it.each([["allergy"], ["CRITICAL"], ["Severity3"], [""], [undefined], [null], [42], [{}]])(
    "rejects %j — a closed, two-member type, never an open string",
    (value) => {
      const result = validateCriticalNoteType(value);
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.violations[0]?.ruleId).toBe("CAP-D05.02-R02");
    }
  );
});

describe("validateCriticalNoteInputs — collects every violation, never short-circuits", () => {
  it("omitted/empty input validates to an empty array", () => {
    const result = validateCriticalNoteInputs([]);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toEqual([]);
  });

  it("validates multiple valid entries, trimming each detail", () => {
    const result = validateCriticalNoteInputs([
      { noteType: "Allergy", detail: "  schaaldieren  " },
      { noteType: "Critical", detail: "rolstoeltoegang nodig" },
    ]);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual([
        { noteType: "Allergy", detail: "schaaldieren" },
        { noteType: "Critical", detail: "rolstoeltoegang nodig" },
      ]);
    }
  });

  it("collects violations from EVERY bad entry, not just the first", () => {
    const result = validateCriticalNoteInputs([
      { noteType: "NotAType", detail: "" },
      { noteType: "Allergy", detail: "fine" },
      { noteType: "AlsoBad", detail: "   " },
    ]);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      // Entry 1 contributes both R02 (bad type) and R01 (empty detail);
      // entry 3 contributes R02 (bad type) and R01 (whitespace-only) —
      // entry 2 (valid) contributes nothing. Four violations total.
      expect(result.violations).toHaveLength(4);
      expect(result.violations.filter((v) => v.ruleId === "CAP-D05.02-R01")).toHaveLength(2);
      expect(result.violations.filter((v) => v.ruleId === "CAP-D05.02-R02")).toHaveLength(2);
    }
  });

  it("a single bad entry among valid ones still fails the WHOLE batch — no partial acceptance", () => {
    const result = validateCriticalNoteInputs([
      { noteType: "Allergy", detail: "fine" },
      { noteType: "Critical", detail: "" },
    ]);
    expect(result.ok).toBe(false);
  });
});

function existing(id: string, status: CriticalNoteStatus = CriticalNoteStatus.Active): ExistingCriticalNote {
  return { id, status };
}

describe("validateCriticalNoteChangeIdentities — CAP-D05.02-R03/R04", () => {
  it("accepts update/resolve against distinct, Active, existing notes with no violations", () => {
    const violations = validateCriticalNoteChangeIdentities(
      { update: [{ id: "note-1", noteType: "Allergy", detail: "x" }], resolve: [{ id: "note-2" }] },
      [existing("note-1"), existing("note-2"), existing("note-3")]
    );
    expect(violations).toEqual([]);
  });

  it("R03 — an unknown id (never persisted at all) is rejected", () => {
    const violations = validateCriticalNoteChangeIdentities({ update: [], resolve: [{ id: "does-not-exist" }] }, [existing("note-1")]);
    expect(violations).toHaveLength(1);
    expect(violations[0]?.ruleId).toBe("CAP-D05.02-R03");
  });

  it("R03 — a cross-reservation id is rejected the SAME way as an unknown id (the caller only loads notes scoped to one reservation, so it is simply absent from existingNotes)", () => {
    const violations = validateCriticalNoteChangeIdentities(
      { update: [], resolve: [{ id: "note-on-a-different-reservation" }] },
      [existing("note-1"), existing("note-2")]
    );
    expect(violations).toHaveLength(1);
    expect(violations[0]?.ruleId).toBe("CAP-D05.02-R03");
  });

  it("R03 — an already-Resolved id cannot be updated or resolved again (one-way resolution)", () => {
    const violations = validateCriticalNoteChangeIdentities(
      { update: [{ id: "note-1", noteType: "Allergy", detail: "x" }], resolve: [] },
      [existing("note-1", CriticalNoteStatus.Resolved)]
    );
    expect(violations).toHaveLength(1);
    expect(violations[0]?.ruleId).toBe("CAP-D05.02-R03");
  });

  it("R04 — the same id may not appear twice within update", () => {
    const violations = validateCriticalNoteChangeIdentities(
      { update: [{ id: "note-1", noteType: "Allergy", detail: "x" }, { id: "note-1", noteType: "Critical", detail: "y" }], resolve: [] },
      [existing("note-1")]
    );
    expect(violations.some((v) => v.ruleId === "CAP-D05.02-R04")).toBe(true);
  });

  it("R04 — the same id may not appear twice within resolve", () => {
    const violations = validateCriticalNoteChangeIdentities({ update: [], resolve: [{ id: "note-1" }, { id: "note-1" }] }, [existing("note-1")]);
    expect(violations.some((v) => v.ruleId === "CAP-D05.02-R04")).toBe(true);
  });

  it("R04 — the same id may not be BOTH updated and resolved in one change set", () => {
    const violations = validateCriticalNoteChangeIdentities(
      { update: [{ id: "note-1", noteType: "Allergy", detail: "x" }], resolve: [{ id: "note-1" }] },
      [existing("note-1")]
    );
    expect(violations.some((v) => v.ruleId === "CAP-D05.02-R04")).toBe(true);
  });

  it("collects BOTH an R03 and an R04 violation in the same call — never short-circuits on the first", () => {
    const violations = validateCriticalNoteChangeIdentities(
      { update: [{ id: "unknown-note", noteType: "Allergy", detail: "x" }], resolve: [{ id: "note-1" }, { id: "note-1" }] },
      [existing("note-1")]
    );
    const ruleIds = violations.map((v) => v.ruleId).sort();
    expect(ruleIds).toContain("CAP-D05.02-R03");
    expect(ruleIds).toContain("CAP-D05.02-R04");
  });
});
