import { describe, it, expect, beforeAll } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * P1-B4-C — "Plaatsen" pilot UI regression coverage: the shared
 * authoritative-seating panel used by both the daily list (entry point A)
 * and the Walk-in CREATED_UNSEATED recovery (entry point B).
 *
 * Same posture as tests/pilot/walk-in-ui.test.ts (P1-B3): this codebase has
 * no DOM/browser test runner (no jsdom/playwright), so this is plain
 * source-text assertion against the real, shipped file, scoped tightly to
 * the exact new blocks this phase added. It proves the page's SHAPE is
 * correct (right endpoints, right fields, right guards, right outcome
 * strings) — it does not execute the code in a browser. See that file's
 * own header comment for the full reasoning; not repeated here.
 *
 * tests/api/seating-availability.test.ts (B4-A) and
 * tests/api/seating-assignment.test.ts (B4-B) already exhaustively prove
 * the SERVER contract this page calls — this file's only job is proving
 * pilot.html wires up to that already-proven contract correctly.
 */
const pilotHtmlPath = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "public", "pilot.html");
let source: string;
let seatingPickerBlock: string;
let actionCellBlock: string;
let walkinBlock: string;
let pickerPanelHtml: string;

beforeAll(() => {
  source = readFileSync(pilotHtmlPath, "utf-8");

  const pickerStart = source.indexOf('const seatingPicker = document.getElementById("seating-picker");');
  const pickerEnd = source.indexOf('const listDateInput = document.getElementById("list-date");');
  expect(pickerStart).toBeGreaterThan(-1);
  expect(pickerEnd).toBeGreaterThan(pickerStart);
  seatingPickerBlock = source.slice(pickerStart, pickerEnd);

  const actionStart = source.indexOf("const actionCell = document.createElement(\"td\");");
  const actionEnd = source.indexOf("tr.innerHTML = `", actionStart);
  expect(actionStart).toBeGreaterThan(-1);
  expect(actionEnd).toBeGreaterThan(actionStart);
  actionCellBlock = source.slice(actionStart, actionEnd);

  const walkinStart = source.indexOf('walkinForm.addEventListener("submit"');
  const walkinEnd = pickerStart;
  expect(walkinStart).toBeGreaterThan(-1);
  walkinBlock = source.slice(walkinStart, walkinEnd);

  const panelStart = source.indexOf('<section id="seating-picker"');
  const panelEnd = source.indexOf("</section>", panelStart);
  expect(panelStart).toBeGreaterThan(-1);
  pickerPanelHtml = source.slice(panelStart, panelEnd);
});

describe("Daily list — Plaatsen exposure", () => {
  it("offers Plaatsen for Proposed or Confirmed reservations", () => {
    expect(actionCellBlock).toMatch(/if \(r\.status === "Proposed" \|\| r\.status === "Confirmed"\) \{\s*const seatButton/);
    expect(actionCellBlock).toContain('seatButton.textContent = "Plaatsen"');
  });

  it("never offers Plaatsen for Cancelled or Completed — the gate is an explicit Proposed/Confirmed allowlist, not a Cancelled/Completed denylist", () => {
    const seatButtonGate = actionCellBlock.match(/if \(r\.status === "Proposed" \|\| r\.status === "Confirmed"\) \{\s*const seatButton[\s\S]*?\n {8}\}/);
    expect(seatButtonGate).not.toBeNull();
    expect(seatButtonGate![0]).not.toMatch(/Cancelled|Completed/);
  });

  it("clicking Plaatsen calls the shared openSeatingPicker(reservationId, mode), never a second implementation", () => {
    // P1-B6 — openSeatingPicker now takes an explicit mode; Plaatsen requests "assign".
    expect(actionCellBlock).toContain('openSeatingPicker(r.id, "assign")');
  });
});

describe("Seating picker — authoritative availability read (B4-A)", () => {
  it("fetches GET /reservations/:id/seating/available-resources", () => {
    expect(seatingPickerBlock).toContain("fetch(`/reservations/${reservationId}/seating/available-resources`");
  });

  it("an already Assigned/Seated reservation is NOT offered the resource picker — uses B4-A's own authoritative assignmentStatus, never Reservation.tableAssignment", () => {
    expect(seatingPickerBlock).toMatch(/data\.assignmentStatus && data\.assignmentStatus !== "Unassigned"/);
    expect(seatingPickerBlock).toContain("al toegewezen of geplaatst");
  });

  it("never reads or writes the legacy Reservation.tableAssignment field anywhere in this panel", () => {
    expect(seatingPickerBlock).not.toMatch(/\btableAssignment\b/);
  });

  it("empty inventory is displayed honestly, never fabricated from floorSeedData.ts", () => {
    expect(seatingPickerBlock).toMatch(/resources\.length === 0/);
    expect(seatingPickerBlock).toContain("Geen beschikbare tafel of zitplaats gevonden.");
  });

  it("a 401/403 on the availability read is shown as a clean permission message, not duplicated permission logic", () => {
    expect(seatingPickerBlock).toMatch(/res\.status === 401 \|\| res\.status === 403/);
  });
});

describe("Seating picker — resource rendering", () => {
  it("renders Sushi Tables as 'Tafel <label> — <capacity> personen'", () => {
    expect(seatingPickerBlock).toContain('`Tafel ${resource.operationalLabel} — ${resource.capacity} personen`');
    expect(seatingPickerBlock).toMatch(/resource\.kind === "Table"\s*\?\s*`Tafel/);
  });

  it("renders Teppanyaki Seats with parent grill context: '<label> — Grill <grill>'", () => {
    expect(seatingPickerBlock).toContain("Grill ${resource.parentTable");
  });

  it("supports selecting multiple resources (a collected array, not a single-select)", () => {
    expect(seatingPickerBlock).toMatch(/querySelectorAll\('input\[type="checkbox"\]:checked'\)\)\s*\.map/);
  });
});

describe("Seating picker — POST (B4-B assign / B6 move) narrow contract", () => {
  it("submits to POST /reservations/:id/seating, or /seating/move when in move mode", () => {
    expect(seatingPickerBlock).toMatch(/fetch\(`\/reservations\/\$\{seatingPickerReservationId\}\/seating\$\{isMove \? "\/move" : ""\}`,\s*\{\s*method: "POST"/);
  });

  it("the POST body contains only commandId and resources — no area, partySize, seatImmediately, or reservationDate", () => {
    const postBodyRegion = seatingPickerBlock.slice(
      seatingPickerBlock.indexOf('fetch(`/reservations/${seatingPickerReservationId}/seating${isMove'),
      seatingPickerBlock.indexOf("});", seatingPickerBlock.indexOf('fetch(`/reservations/${seatingPickerReservationId}/seating${isMove'))
    );
    expect(postBodyRegion).toContain("commandId:");
    expect(postBodyRegion).toContain("resources:");
    expect(postBodyRegion).not.toMatch(/\bpartySize\b|\bseatImmediately\b|\breservationDate\b|\barea\b/);
  });

  it("double-submit protection: disables the confirm button for the duration and ignores a second click while pending", () => {
    expect(seatingPickerBlock).toContain("if (seatingPickerConfirm.disabled) return;");
    expect(seatingPickerBlock).toMatch(/seatingPickerConfirm\.disabled = true;[\s\S]*fetch\(`\/reservations\/\$\{seatingPickerReservationId\}\/seating\$\{isMove/);
    expect(seatingPickerBlock).toContain("seatingPickerConfirm.disabled = false;");
  });
});

describe("Seating picker — outcome handling", () => {
  it("a successful ASSIGNED/MOVED (200/201) renders a Dutch confirmation and does not touch Reservation lifecycle status", () => {
    expect(seatingPickerBlock).toMatch(/showMessage\(listMessage, isMove \? "Gast verplaatst\." : "Gast geplaatst\."/);
  });

  it("stale RESOURCE_OVERLAP is treated as advisory, not a system failure: refreshes availability via the SAME openSeatingPicker (preserving mode), never retries the POST or auto-picks another resource", () => {
    const overlapBranch = seatingPickerBlock.match(/if \(data\.type === "NOT_SEATABLE" && data\.seatability[\s\S]*?\n {6}\}/);
    expect(overlapBranch).not.toBeNull();
    expect(overlapBranch![0]).toContain('seatability.type === "RESOURCE_OVERLAP"');
    expect(overlapBranch![0]).toContain("await openSeatingPicker(seatingPickerReservationId, seatingPickerMode);");
    expect(overlapBranch![0]).not.toMatch(/method: "POST"/);
  });

  it("other NOT_SEATABLE reasons display a meaningful failure message distinct from the overlap case", () => {
    expect(seatingPickerBlock).toMatch(/data\.type === "NOT_SEATABLE"\s*\)\s*\{\s*showMessage\(seatingPickerMessage, \(isMove/);
  });

  it("ALREADY_ASSIGNED_ELSEWHERE is handled with its own distinct message", () => {
    expect(seatingPickerBlock).toMatch(/data\.type === "ALREADY_ASSIGNED_ELSEWHERE"/);
    expect(seatingPickerBlock).toContain("al een actieve toewijzing");
  });

  it("exactly one POST fetch call exists in the confirm handler — no automatic retry loop", () => {
    const confirmHandlerStart = seatingPickerBlock.indexOf("seatingPickerConfirm.addEventListener");
    const confirmHandlerBody = seatingPickerBlock.slice(confirmHandlerStart);
    const postFetchCount = (confirmHandlerBody.match(/method: "POST"/g) || []).length;
    expect(postFetchCount).toBe(1);
  });
});

describe("Walk-in nu — CREATED_UNSEATED continues into the same Plaatsen flow", () => {
  it("opens the shared seating picker (in assign mode) using the reservationId already present in the Walk-in response", () => {
    expect(walkinBlock).toContain('await openSeatingPicker(data.reservationId, "assign");');
  });

  it("does not create the Walk-in again — exactly one POST to the walk-in endpoint per submit", () => {
    const postCount = (walkinBlock.match(/fetch\("\/availability\/reservations\/walk-in"/g) || []).length;
    expect(postCount).toBe(1);
  });

  it("still sends only the dedicated Walk-in request contract — no new fields introduced by this increment", () => {
    expect(walkinBlock).not.toMatch(/\breservationDate\b/);
    expect(walkinBlock).not.toMatch(/\bsource\b/);
    expect(walkinBlock).not.toMatch(/\bemail\b/i);
  });
});

describe("Seating picker panel — markup", () => {
  it("is its own hidden-by-default section, not a graphical floor plan (no canvas/svg)", () => {
    expect(pickerPanelHtml).toContain('style="display:none;"');
    expect(source).not.toMatch(/<canvas|<svg/);
  });
});
