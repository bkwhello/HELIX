import { beforeAll, describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * R1.5-P7-B — P0-2 regression: text typed into the critical-note detail
 * input but never added (via "Kritieke notitie toevoegen" or Enter) must
 * never be silently dropped by a reservation create/edit submit. Same
 * plain-source-text convention as critical-note-ui.test.ts, plus one
 * live-executed check of the pure guard predicate (extracted from the
 * shipped source via new Function(), the service-session-ui.test.ts
 * precedent — no DOM, no fetch). Browser-level behavior is proved in
 * tests/e2e/critical-note-unadded-guard.spec.ts.
 */
const pilotHtmlPath = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "public", "pilot.html");
let source: string;
let submitHandler: string;
let enterEditModeBlock: string;
let exitEditModeBlock: string;

function between(start: string, end: string, from = 0): string {
  const s = source.indexOf(start, from);
  expect(s, `missing start marker ${start}`).toBeGreaterThan(-1);
  const e = source.indexOf(end, s + start.length);
  expect(e, `missing end marker ${end}`).toBeGreaterThan(s);
  return source.slice(s, e);
}

beforeAll(() => {
  // Normalized: the working copy may be checked out with CRLF (core.autocrlf).
  source = readFileSync(pilotHtmlPath, "utf-8").replace(/\r\n/g, "\n");
  submitHandler = between('createForm.addEventListener("submit"', "// P1-B3 — CAP-D04.01/CAP-D02.03 immediate Walk-in");
  enterEditModeBlock = between("async function enterEditMode(r) {", "function exitEditMode() {");
  exitEditModeBlock = between("function exitEditMode() {", 'cancelEditButton.addEventListener("click", exitEditMode);');
});

describe("R1.5-P7-B — unadded critical-note text can never be silently dropped", () => {
  it("shows the exact Dutch warning text", () => {
    expect(source).toContain(
      'const UNADDED_CRITICAL_NOTE_MESSAGE = "Allergie/kritieke notitie is nog niet toegevoegd. Klik op Toevoegen of maak het veld leeg.";'
    );
  });

  it("the guard predicate treats only non-whitespace text as unadded (live-executed from the shipped source)", () => {
    const fnSource = between("function hasUnaddedCriticalNoteText(value) {", "// R1.5-P7-B — clears the unsent detail text");
    const hasUnaddedCriticalNoteText = new Function(`${fnSource}\nreturn hasUnaddedCriticalNoteText;`)() as (v: unknown) => boolean;
    expect(hasUnaddedCriticalNoteText("")).toBe(false);
    expect(hasUnaddedCriticalNoteText("   \t\n ")).toBe(false);
    expect(hasUnaddedCriticalNoteText(undefined)).toBe(false);
    expect(hasUnaddedCriticalNoteText("notenallergie")).toBe(true);
    expect(hasUnaddedCriticalNoteText("  gluten  ")).toBe(true);
  });

  it("the submit guard runs before any other validation and before ANY request in both create and edit mode", () => {
    const guardIndex = submitHandler.indexOf("if (hasUnaddedCriticalNoteText(criticalNoteDetailInput.value)) {");
    expect(guardIndex).toBeGreaterThan(-1);
    // Before the date/time validation, the edit PATCH, and the create POST.
    expect(guardIndex).toBeLessThan(submitHandler.indexOf("if (!dateInput.value || !timeSelect.value) {"));
    expect(guardIndex).toBeLessThan(submitHandler.indexOf("if (editingReservationId) {"));
    expect(guardIndex).toBeLessThan(submitHandler.indexOf("fetch("));
  });

  it("a blocked submit shows the warning, focuses the unresolved input, and returns without auto-adding", () => {
    const guardStart = submitHandler.indexOf("if (hasUnaddedCriticalNoteText(criticalNoteDetailInput.value)) {");
    const guardBlock = submitHandler.slice(guardStart, submitHandler.indexOf("}", guardStart) + 1);
    expect(guardBlock).toContain("showMessage(createMessage, UNADDED_CRITICAL_NOTE_MESSAGE, \"error\");");
    expect(guardBlock).toContain("criticalNoteDetailInput.focus();");
    expect(guardBlock).toContain("return;");
    expect(guardBlock).not.toContain("pendingCriticalNotes");
    expect(guardBlock).not.toContain("addCriticalNoteFromInput");
    expect(guardBlock).not.toContain("criticalNoteDetailInput.value =");
  });

  it("the button and Enter share ONE add implementation (no duplicated add logic)", () => {
    expect(source).toContain('criticalNoteAddButton.addEventListener("click", addCriticalNoteFromInput);');
    expect(source.match(/pendingCriticalNotes\.push\(/g) ?? []).toHaveLength(1);
    expect(source.match(/submitCriticalNoteChange\(editingReservationId, \{ add:/g) ?? []).toHaveLength(1);
  });

  it("Enter in the detail input prevents the parent form submit and adds the note instead, ignoring key repeat/IME composition", () => {
    const keyBlock = between('criticalNoteDetailInput.addEventListener("keydown", (event) => {', "});");
    const preventIndex = keyBlock.indexOf("event.preventDefault();");
    const repeatIndex = keyBlock.indexOf("if (event.repeat || event.isComposing) return;");
    const addIndex = keyBlock.indexOf("addCriticalNoteFromInput();");
    expect(keyBlock).toContain('if (event.key !== "Enter") return;');
    expect(preventIndex).toBeGreaterThan(-1);
    expect(repeatIndex).toBeGreaterThan(preventIndex);
    expect(addIndex).toBeGreaterThan(repeatIndex);
  });

  it("resets the unsent draft (text + type) after a successful create, on entering edit mode, and on leaving edit mode", () => {
    const resetFn = between("function resetCriticalNoteDraft() {", "}\n");
    expect(resetFn).toContain('criticalNoteDetailInput.value = "";');
    expect(resetFn).toContain("defaultSelected");

    const createSuccess = submitHandler.slice(submitHandler.indexOf('showMessage(createMessage, `Reservering aangemaakt'));
    expect(createSuccess.indexOf("resetCriticalNoteDraft();")).toBeGreaterThan(-1);
    expect(createSuccess.indexOf("pendingCriticalNotes = [];")).toBeGreaterThan(-1);

    expect(enterEditModeBlock).toContain("pendingCriticalNotes = [];");
    expect(enterEditModeBlock).toContain("resetCriticalNoteDraft();");
    // The draft is cleared BEFORE the edited reservation's notes are fetched/rendered.
    expect(enterEditModeBlock.indexOf("resetCriticalNoteDraft();")).toBeLessThan(enterEditModeBlock.indexOf("refreshEditingCriticalNotes();"));

    expect(exitEditModeBlock).toContain("pendingCriticalNotes = [];");
    expect(exitEditModeBlock).toContain("resetCriticalNoteDraft();");
  });
});
