import { describe, it, expect, beforeAll } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * P1-B9 — "Vooraf toewijzen" (pre-assign) and "Nu zetten" (mark-seated)
 * pilot UI regression coverage. Same posture as the other pilot test
 * files: plain source-text assertion against the shipped file.
 * tests/api/seating-pre-assign.test.ts and tests/api/seating-mark-seated.test.ts
 * already exhaustively prove the server contracts; this file's only job
 * is proving pilot.html wires up to them correctly. Overlapping
 * assertions with tests/pilot/seating-ui.test.ts / seating-move-ui.test.ts
 * on the SHARED picker are deliberately not duplicated here — this file
 * covers only what P1-B9 itself added.
 */
const pilotHtmlPath = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "public", "pilot.html");
let source: string;
let seatingPickerBlock: string;
let actionCellBlock: string;
let markSeatedNowBlock: string;

beforeAll(() => {
  source = readFileSync(pilotHtmlPath, "utf-8");

  const pickerStart = source.indexOf('const seatingPicker = document.getElementById("seating-picker");');
  const pickerEnd = source.indexOf('const listDateInput = document.getElementById("list-date");');
  expect(pickerStart).toBeGreaterThan(-1);
  expect(pickerEnd).toBeGreaterThan(pickerStart);
  seatingPickerBlock = source.slice(pickerStart, pickerEnd);

  const actionStart = source.indexOf('const actionCell = document.createElement("td");');
  const actionEnd = source.indexOf("tr.innerHTML = `", actionStart);
  expect(actionStart).toBeGreaterThan(-1);
  actionCellBlock = source.slice(actionStart, actionEnd);

  const markSeatedStart = source.indexOf("async function markSeatedNow(r) {");
  const markSeatedEnd = source.indexOf("// P1-A — Completion is a terminal");
  expect(markSeatedStart).toBeGreaterThan(-1);
  expect(markSeatedEnd).toBeGreaterThan(markSeatedStart);
  markSeatedNowBlock = source.slice(markSeatedStart, markSeatedEnd);
});

describe("Daily list — Vooraf toewijzen exposure", () => {
  it("offers Vooraf toewijzen for Proposed or Confirmed reservations, same gate as Plaatsen", () => {
    expect(actionCellBlock).toMatch(/if \(r\.status === "Proposed" \|\| r\.status === "Confirmed"\) \{\s*const preAssignButton/);
    expect(actionCellBlock).toContain('preAssignButton.textContent = "Vooraf toewijzen"');
  });

  it("never offers Vooraf toewijzen for Cancelled or Completed — an explicit Proposed/Confirmed allowlist", () => {
    const gate = actionCellBlock.match(/if \(r\.status === "Proposed" \|\| r\.status === "Confirmed"\) \{\s*const preAssignButton[\s\S]*?\n {8}\}/);
    expect(gate).not.toBeNull();
    expect(gate![0]).not.toMatch(/Cancelled|Completed/);
  });

  it("clicking Vooraf toewijzen opens the SAME shared picker as Plaatsen, in pre-assign mode", () => {
    expect(actionCellBlock).toContain('openSeatingPicker(r.id, "pre-assign")');
  });
});

describe("Daily list — Nu zetten exposure", () => {
  it("offers Nu zetten for Proposed or Confirmed reservations, same gate as the other seating actions", () => {
    expect(actionCellBlock).toMatch(/if \(r\.status === "Proposed" \|\| r\.status === "Confirmed"\) \{\s*const markSeatedButton/);
    expect(actionCellBlock).toContain('markSeatedButton.textContent = "Nu zetten"');
  });

  it("never offers Nu zetten for Cancelled or Completed", () => {
    const gate = actionCellBlock.match(/if \(r\.status === "Proposed" \|\| r\.status === "Confirmed"\) \{\s*const markSeatedButton[\s\S]*?\n {8}\}/);
    expect(gate).not.toBeNull();
    expect(gate![0]).not.toMatch(/Cancelled|Completed/);
  });

  it("clicking Nu zetten calls the dedicated markSeatedNow(r), never the shared resource picker — no resource selection for this action", () => {
    expect(actionCellBlock).toContain("markSeatedNow(r)");
  });
});

describe("Seating picker — pre-assign mode wiring", () => {
  it("openSeatingPicker recognizes 'pre-assign' as its own mode, distinct from 'assign' and 'move'", () => {
    expect(seatingPickerBlock).toContain('seatingPickerMode = mode === "move" ? "move" : mode === "pre-assign" ? "pre-assign" : "assign";');
  });

  it("pre-assign uses its own title/confirm-button text, distinct from Plaatsen/Verplaatsen", () => {
    expect(seatingPickerBlock).toContain('"Vooraf toewijzen"');
    expect(seatingPickerBlock).toContain('"Vooraf toewijzen bevestigen"');
  });

  it("pre-assign wants the SAME starting gate as assign — no active assignment yet, not the move gate", () => {
    expect(seatingPickerBlock).toMatch(/\(seatingPickerMode === "assign" \|\| seatingPickerMode === "pre-assign"\) && hasActiveAssignment/);
  });

  it("there is still exactly one openSeatingPicker function and one confirm click handler — pre-assign reuses the component, never a second implementation", () => {
    const defs = (source.match(/async function openSeatingPicker\(/g) || []).length;
    expect(defs).toBe(1);
    const handlers = (seatingPickerBlock.match(/seatingPickerConfirm\.addEventListener\("click"/g) || []).length;
    expect(handlers).toBe(1);
  });
});

describe("markSeatedNow — authoritative refresh before acting (approved contract)", () => {
  it("fetches B4-A's GET /reservations/:id/seating/available-resources FIRST, before any confirmation or POST", () => {
    const getIndex = markSeatedNowBlock.indexOf("fetch(`/reservations/${r.id}/seating/available-resources`");
    const confirmIndex = markSeatedNowBlock.indexOf("confirm(");
    const postIndex = markSeatedNowBlock.indexOf('method: "POST"');
    expect(getIndex).toBeGreaterThan(-1);
    expect(confirmIndex).toBeGreaterThan(getIndex);
    expect(postIndex).toBeGreaterThan(confirmIndex);
  });

  it("Unassigned is refused locally with a clear message and never reaches confirm() or the POST", () => {
    const checkIndex = markSeatedNowBlock.indexOf('availData.assignmentStatus === "Unassigned"');
    const confirmIndex = markSeatedNowBlock.indexOf("confirm(");
    expect(checkIndex).toBeGreaterThan(-1);
    expect(confirmIndex).toBeGreaterThan(checkIndex);
    const between = markSeatedNowBlock.slice(checkIndex, confirmIndex);
    expect(between).toContain("return;");
    expect(between).not.toMatch(/method: "POST"/);
  });

  it("an already-Seated reservation is reported as such and never reaches confirm() or the POST — distinct from the Unassigned message", () => {
    const seatedCheckIndex = markSeatedNowBlock.indexOf('availData.assignmentStatus === "Seated"');
    const confirmIndex = markSeatedNowBlock.indexOf("confirm(");
    expect(seatedCheckIndex).toBeGreaterThan(-1);
    expect(confirmIndex).toBeGreaterThan(seatedCheckIndex);
    const between = markSeatedNowBlock.slice(seatedCheckIndex, confirmIndex);
    expect(between).toContain("return;");
    expect(between).not.toMatch(/method: "POST"/);
    expect(between).toContain("is al gezeten");
  });

  it("a 401/403 on the availability read is shown as a clean permission message", () => {
    expect(markSeatedNowBlock).toMatch(/availRes\.status === 401 \|\| availRes\.status === 403/);
  });

  it("asks for explicit confirmation before marking seated", () => {
    expect(markSeatedNowBlock).toMatch(/if \(!confirm\(`Reservering van \$\{who\} nu als gezeten markeren/);
  });
});

describe("markSeatedNow — POST contract and outcome handling", () => {
  it("submits to POST /reservations/:id/seating/mark-seated with an empty body — no resource selection", () => {
    expect(markSeatedNowBlock).toMatch(/fetch\(`\/reservations\/\$\{r\.id\}\/seating\/mark-seated`,\s*\{\s*method: "POST"/);
    expect(markSeatedNowBlock).toContain("body: JSON.stringify({})");
  });

  it("a successful mark-seated shows a clear Dutch confirmation and refreshes the list and occupancy", () => {
    expect(markSeatedNowBlock).toContain("gemarkeerd als gezeten");
    expect(markSeatedNowBlock).toContain("await loadList();");
    expect(markSeatedNowBlock).toContain("await loadOccupancy();");
  });

  it("NO_ACTIVE_ASSIGNMENT on the POST itself (a race after the initial check) is handled distinctly, not as a generic error", () => {
    expect(markSeatedNowBlock).toMatch(/data\.type === "NO_ACTIVE_ASSIGNMENT"/);
  });

  it("a 401/403 on the POST is shown as a clean permission message", () => {
    expect(markSeatedNowBlock).toMatch(/res\.status === 401 \|\| res\.status === 403/);
  });

  it("exactly one POST call exists in this function — no automatic retry", () => {
    const postCount = (markSeatedNowBlock.match(/method: "POST"/g) || []).length;
    expect(postCount).toBe(1);
  });

  it("never touches the legacy Reservation table-note field", () => {
    expect(markSeatedNowBlock).not.toMatch(/\btableAssignment\b/);
  });
});

describe("Existing placement, move, no-show, late-arrival, and resource-block workflows — unaffected", () => {
  it("Plaatsen and Verplaatsen still call the shared picker in their own unchanged modes", () => {
    expect(actionCellBlock).toContain('openSeatingPicker(r.id, "assign")');
    expect(actionCellBlock).toContain('openSeatingPicker(r.id, "move")');
  });

  it("No-show's own markNoShow function and POST target are untouched", () => {
    expect(source).toContain("async function markNoShow(r) {");
    expect(source).toContain('fetch(`/reservations/${r.id}/seating/no-show`');
  });

  it("the late-arrival 'Laat' badge and its floor fetch are untouched", () => {
    expect(source).toContain('class="late-badge"');
    expect(source).toContain('fetch(`/floor?date=${listDateInput.value}`)');
  });

  it("the resource-block form and list are untouched", () => {
    expect(source).toContain('<form id="resource-block-form">');
    expect(source).toContain('fetch("/resource-blocks")');
  });
});
