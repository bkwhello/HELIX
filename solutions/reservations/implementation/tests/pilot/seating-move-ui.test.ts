import { describe, it, expect, beforeAll } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * P1-B6 — "Verplaatsen" pilot UI regression coverage. Same posture as the
 * other pilot test files: plain source-text assertion against the
 * shipped file (no DOM runner in this codebase), scoped to the exact
 * blocks this phase touched. tests/api/seating-move.test.ts already
 * exhaustively proves the server contract; this file's only job is
 * proving pilot.html wires up to it correctly, AND that it reuses
 * (rather than duplicates) the existing seating-picker component from
 * B4-C/B5.
 */
const pilotHtmlPath = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "public", "pilot.html");
let source: string;
let seatingPickerBlock: string;
let actionCellBlock: string;

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
});

describe("Daily list — Verplaatsen exposure", () => {
  it("offers Verplaatsen for Proposed or Confirmed reservations, gated the same way as Plaatsen/No-show", () => {
    expect(actionCellBlock).toMatch(/if \(r\.status === "Proposed" \|\| r\.status === "Confirmed"\) \{\s*const moveButton/);
    expect(actionCellBlock).toContain('moveButton.textContent = "Verplaatsen"');
  });

  it("never offers Verplaatsen for Cancelled or Completed — an explicit Proposed/Confirmed allowlist", () => {
    const gate = actionCellBlock.match(/if \(r\.status === "Proposed" \|\| r\.status === "Confirmed"\) \{\s*const moveButton[\s\S]*?\n {8}\}/);
    expect(gate).not.toBeNull();
    expect(gate![0]).not.toMatch(/Cancelled|Completed/);
  });

  it("clicking Verplaatsen opens the SAME shared picker used by Plaatsen, in move mode — never a second implementation", () => {
    expect(actionCellBlock).toContain('openSeatingPicker(r.id, "move")');
    // The existing Plaatsen call site must still request assign mode explicitly.
    expect(actionCellBlock).toContain('openSeatingPicker(r.id, "assign")');
  });
});

describe("Seating picker — one shared component, parameterized by mode, not duplicated", () => {
  it("there is exactly one openSeatingPicker function definition", () => {
    const defs = (source.match(/async function openSeatingPicker\(/g) || []).length;
    expect(defs).toBe(1);
  });

  it("there is exactly one seating-picker confirm click handler (one POST call site, branched by mode)", () => {
    const handlers = (seatingPickerBlock.match(/seatingPickerConfirm\.addEventListener\("click"/g) || []).length;
    expect(handlers).toBe(1);
    const postCount = (seatingPickerBlock.match(/method: "POST"/g) || []).length;
    expect(postCount).toBe(1);
  });

  it("mode selects the endpoint suffix: assign -> /seating, move -> /seating/move, pre-assign -> /seating/pre-assign", () => {
    expect(seatingPickerBlock).toContain('const urlSuffix = isMove ? "/move" : isPreAssign ? "/pre-assign" : "";');
    expect(seatingPickerBlock).toMatch(/fetch\(`\/reservations\/\$\{seatingPickerReservationId\}\/seating\$\{urlSuffix\}`/);
  });

  it("performs the B4-A availability GET before the confirm click handler can ever POST (open happens on click, POST only after a later, separate confirm click)", () => {
    const openIndex = seatingPickerBlock.indexOf("async function openSeatingPicker(reservationId, mode) {");
    const getIndex = seatingPickerBlock.indexOf("fetch(`/reservations/${reservationId}/seating/available-resources`", openIndex);
    const confirmHandlerIndex = seatingPickerBlock.indexOf('seatingPickerConfirm.addEventListener("click"');
    expect(getIndex).toBeGreaterThan(openIndex);
    expect(confirmHandlerIndex).toBeGreaterThan(getIndex);
  });

  it("move mode requires an ALREADY active assignment (opposite gate from assign/pre-assign mode)", () => {
    expect(seatingPickerBlock).toMatch(/seatingPickerMode === "move" && !hasActiveAssignment/);
    expect(seatingPickerBlock).toMatch(/\(seatingPickerMode === "assign" \|\| seatingPickerMode === "pre-assign"\) && hasActiveAssignment/);
  });

  it("the POST body contains only commandId and resources for all modes — no area, partySize, seatImmediately, or reservationDate", () => {
    const postBodyRegion = seatingPickerBlock.slice(
      seatingPickerBlock.indexOf('fetch(`/reservations/${seatingPickerReservationId}/seating${urlSuffix}`'),
      seatingPickerBlock.indexOf("});", seatingPickerBlock.indexOf('fetch(`/reservations/${seatingPickerReservationId}/seating${urlSuffix}`'))
    );
    expect(postBodyRegion).toContain("commandId:");
    expect(postBodyRegion).toContain("resources: selected");
    expect(postBodyRegion).not.toMatch(/\bpartySize\b|\bseatImmediately\b|\breservationDate\b|\barea\b/);
  });

  it("a successful move shows a distinct Dutch confirmation and refreshes list/occupancy, same as assign", () => {
    expect(seatingPickerBlock).toContain(
      'showMessage(listMessage, isMove ? "Gast verplaatst." : isPreAssign ? "Gast vooraf toegewezen (nog niet gezeten)." : "Gast geplaatst.", "ok");'
    );
    expect(seatingPickerBlock).toContain("await loadList();");
    expect(seatingPickerBlock).toContain("await loadOccupancy();");
  });

  it("NO_ACTIVE_ASSIGNMENT (a move-only outcome) is handled distinctly from the assign-only ALREADY_ASSIGNED_ELSEWHERE", () => {
    expect(seatingPickerBlock).toMatch(/data\.type === "NO_ACTIVE_ASSIGNMENT"/);
    expect(seatingPickerBlock).toMatch(/data\.type === "ALREADY_ASSIGNED_ELSEWHERE"/);
  });

  it("stale RESOURCE_OVERLAP still refreshes via the same picker, preserving the current mode", () => {
    expect(seatingPickerBlock).toContain("await openSeatingPicker(seatingPickerReservationId, seatingPickerMode);");
  });

  it("double-submit protection is unchanged: still disables the confirm button for the duration", () => {
    expect(seatingPickerBlock).toContain("if (seatingPickerConfirm.disabled) return;");
    expect(seatingPickerBlock).toContain("seatingPickerConfirm.disabled = false;");
  });
});

describe("Existing Plaatsen and No-show flows — unaffected by this increment", () => {
  it("the Walk-in CREATED_UNSEATED recovery still opens the picker in assign mode", () => {
    expect(source).toContain("await openSeatingPicker(data.reservationId, \"assign\");");
  });

  it("No-show's own markNoShow function and POST target are untouched", () => {
    expect(source).toContain("async function markNoShow(r) {");
    expect(source).toContain('fetch(`/reservations/${r.id}/seating/no-show`');
  });
});
