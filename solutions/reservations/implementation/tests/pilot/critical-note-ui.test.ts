import { beforeAll, describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const pilotHtmlPath = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "public", "pilot.html");
let source: string;
let criticalNoteBlock: string;
let walkInBlock: string;

beforeAll(() => {
  source = readFileSync(pilotHtmlPath, "utf-8");
  const criticalStart = source.indexOf("async function submitCriticalNoteChange");
  const criticalEnd = source.indexOf("function walkInErrorMessage");
  expect(criticalStart).toBeGreaterThan(-1);
  expect(criticalEnd).toBeGreaterThan(criticalStart);
  criticalNoteBlock = source.slice(criticalStart, criticalEnd);

  const walkInStart = source.indexOf("function walkInErrorMessage");
  const walkInEnd = source.indexOf("// P1-B4-C — CAP-D04.01", walkInStart);
  expect(walkInEnd).toBeGreaterThan(walkInStart);
  walkInBlock = source.slice(walkInStart, walkInEnd);
});

describe("R1.3-I3 pilot critical-note presentation", () => {
  it("keeps general comments separate and removes allergy wording from their placeholder", () => {
    expect(source).toContain('placeholder="speciale wensen, voorkeuren…"');
    expect(source).not.toContain('placeholder="allergieën');
  });

  it("renders a distinct critical-note section with the closed Allergy/Critical type inventory", () => {
    expect(source).toContain('class="critical-notes-section"');
    expect(source).toContain('<option value="Allergy">Allergie</option>');
    expect(source).toContain('<option value="Critical">Kritiek</option>');
  });

  it("queues create-flow notes in criticalNotes and submits them on the ordinary reservation create request", () => {
    // Corrected against the shipped implementation: the Create-mode queue
    // is named `pendingCriticalNotes` (there is only one queue — it is
    // reused as the Modify-mode add/update/resolve source of truth is
    // `editingCriticalNotes` instead, never a second "Create" variant).
    expect(source).toContain("pendingCriticalNotes");
    expect(source).toContain("criticalNotes:");
  });

  it("uses the explicit criticalNoteChanges PATCH contract for edit operations", () => {
    expect(criticalNoteBlock).toContain("criticalNoteChanges,");
    expect(criticalNoteBlock).toContain("add:");
    expect(criticalNoteBlock).toContain("update:");
    expect(criticalNoteBlock).toContain("resolve:");
  });

  it("confirms only the one-way resolve action", () => {
    expect(criticalNoteBlock).toContain("confirm(");
    expect(criticalNoteBlock).toContain("Oplossen");
    expect(criticalNoteBlock).toContain("Opslaan");
  });

  it("Resolve confirms BEFORE engaging the shared guard, which runs BEFORE submitCriticalNoteChange — proved against the bounded resolve-button handler only, not a global index comparison", () => {
    const resolveStart = criticalNoteBlock.indexOf('resolveButton.addEventListener("click"');
    expect(resolveStart).toBeGreaterThan(-1);
    const resolveEnd = criticalNoteBlock.indexOf("actions.appendChild(resolveButton)", resolveStart);
    expect(resolveEnd).toBeGreaterThan(resolveStart);
    const resolveHandlerBlock = criticalNoteBlock.slice(resolveStart, resolveEnd);

    const confirmIndex = resolveHandlerBlock.indexOf("confirm(");
    const guardIndex = resolveHandlerBlock.indexOf("runCriticalNoteMutation(");
    const submitIndex = resolveHandlerBlock.indexOf("submitCriticalNoteChange(editingReservationId, { resolve:");

    expect(confirmIndex).toBeGreaterThan(-1);
    expect(guardIndex).toBeGreaterThan(confirmIndex);
    expect(submitIndex).toBeGreaterThan(guardIndex);
  });

  it("loads the detail route so resolved notes can be shown read-only", () => {
    // Corrected against the shipped implementation: refreshEditingCriticalNotes()
    // deliberately has no reservationId parameter — it operates on the
    // SAME module-level editingReservationId the rest of the edit-mode
    // flow already uses, not a locally-scoped variable.
    expect(criticalNoteBlock).toContain("`/reservations/${editingReservationId}`");
    expect(criticalNoteBlock).toContain('resolvedLabel.textContent = "Opgelost"');
  });

  it("uses textContent or input values for note detail instead of interpolating it into HTML", () => {
    expect(criticalNoteBlock).toContain("detailSpan.textContent = note.detail;");
    expect(criticalNoteBlock).toContain("detailInput.value = note.detail;");
    expect(criticalNoteBlock).not.toContain("innerHTML = note.detail");
  });

  it("disables critical-note controls while a mutation is in flight and clears the guard in finally", () => {
    expect(criticalNoteBlock).toContain("criticalNoteActionInFlight");
    expect(criticalNoteBlock).toContain("finally");
  });

  it("shows the daily-list badge only from active notes returned by the list endpoint", () => {
    expect(source).toContain('r.criticalNotes && r.criticalNotes.length > 0');
    expect(source).toContain('class="critical-note-badge">⚠ Kritiek</span>');
  });
});

describe("R1.3-I3 immediate-walk-in isolation", () => {
  it("does not add criticalNotes or criticalNoteChanges to the walk-in request body", () => {
    expect(walkInBlock).not.toContain("criticalNotes");
    expect(walkInBlock).not.toContain("criticalNoteChanges");
  });

  it("keeps the existing walk-in endpoint unchanged", () => {
    expect(walkInBlock).toContain('fetch("/availability/reservations/walk-in"');
  });
});
