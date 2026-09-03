import { describe, it, expect, beforeAll } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * P1-B7 — "Laat" (late-arrival) pilot UI regression coverage. Same
 * posture as the other pilot test files: plain source-text assertion
 * against the shipped file. tests/api/floor-view.test.ts already
 * exhaustively proves the server contract; this file's only job is
 * proving pilot.html wires up to it correctly, as a purely presentational,
 * non-interactive signal.
 */
const pilotHtmlPath = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "public", "pilot.html");
let source: string;
let loadListBlock: string;
let renderListBlock: string;

beforeAll(() => {
  source = readFileSync(pilotHtmlPath, "utf-8");

  const loadListStart = source.indexOf("async function loadList() {");
  const loadListEnd = source.indexOf("async function confirmReservation(r) {");
  expect(loadListStart).toBeGreaterThan(-1);
  expect(loadListEnd).toBeGreaterThan(loadListStart);
  loadListBlock = source.slice(loadListStart, loadListEnd);

  const renderListStart = source.indexOf("function renderList() {");
  const renderListEnd = source.indexOf('document.getElementById("reload-list")');
  expect(renderListStart).toBeGreaterThan(-1);
  expect(renderListEnd).toBeGreaterThan(renderListStart);
  renderListBlock = source.slice(renderListStart, renderListEnd);
});

describe("loadList — requests the floor view for the selected date, in parallel", () => {
  it("fetches GET /floor?date=<the same selected date> alongside the reservation list", () => {
    expect(loadListBlock).toContain("fetch(`/floor?date=${listDateInput.value}`)");
    expect(loadListBlock).toContain("fetch(`/reservations?date=${listDateInput.value}`)");
  });

  it("both fetches are issued together (Promise.all), not sequentially one-after-the-other", () => {
    expect(loadListBlock).toMatch(/Promise\.all\(\[\s*fetch\(`\/reservations\?date=\$\{listDateInput\.value\}`\),\s*fetch\(`\/floor\?date=\$\{listDateInput\.value\}`\),\s*\]\)/);
  });

  it("exactly one request to each endpoint per loadList() call — no duplicate fetching", () => {
    const reservationsFetchCount = (loadListBlock.match(/fetch\(`\/reservations\?date=/g) || []).length;
    const floorFetchCount = (loadListBlock.match(/fetch\(`\/floor\?date=/g) || []).length;
    expect(reservationsFetchCount).toBe(1);
    expect(floorFetchCount).toBe(1);
  });

  it("a floor-view failure never produces a silent or guessed late-state: flags are cleared and a visible message is shown, list still renders", () => {
    expect(loadListBlock).toContain("lateArrivalReservationIds = new Set();");
    expect(loadListBlock).toMatch(/if \(floorRes\.ok\) \{[\s\S]*?\} else \{\s*showMessage\(listMessage,/);
  });

  it("joins floor rows to reservation rows by the authoritative reservationId, not by index or any other heuristic", () => {
    expect(loadListBlock).toContain("lateArrivalReservationIds.add(row.reservationId)");
  });

  it("existing reservation-list error handling is unchanged", () => {
    expect(loadListBlock).toContain('showMessage(listMessage, data.message || "Kon dagoverzicht niet laden.", "error")');
  });
});

describe("renderList — badge rendering", () => {
  it("renders the 'Laat' badge only for reservations present in lateArrivalReservationIds", () => {
    expect(renderListBlock).toContain('lateArrivalReservationIds.has(r.id) ? \'<span class="late-badge">Laat</span>\' : ""');
  });

  it("the badge is appended inline to the existing Gast cell, not a new column — existing column structure/labels are unchanged", () => {
    expect(renderListBlock).toContain('<td data-label="Gast">${guest}${lateBadge}</td>');
  });

  it("the badge markup has no onclick/addEventListener wiring and no data-* attribute anywhere near it — purely presentational", () => {
    const badgeDefinitionLine = renderListBlock.split("\n").find((line) => line.includes("late-badge"));
    expect(badgeDefinitionLine).toBeTruthy();
    expect(badgeDefinitionLine).not.toMatch(/onclick|addEventListener|data-/);
  });

  it("no click handler anywhere in the file is attached to a '.late-badge' element", () => {
    expect(source).not.toMatch(/late-badge[^"']*"\)\.addEventListener/);
    expect(source).not.toMatch(/querySelector\(['"]\.late-badge/);
  });
});

describe("Existing list rendering and seating actions — unaffected", () => {
  it("Plaatsen, Verplaatsen, No-show, and edit actions are all still present and wired to their existing handlers", () => {
    expect(source).toContain('openSeatingPicker(r.id, "assign")');
    expect(source).toContain('openSeatingPicker(r.id, "move")');
    expect(source).toContain("markNoShow(r)");
    expect(source).toContain("enterEditMode(r)");
  });

  it("the search/area-filter re-render path is untouched — renderList() is still called directly by those handlers, not loadList()", () => {
    expect(source).toContain("searchInput.addEventListener(\"input\", renderList)");
  });
});
