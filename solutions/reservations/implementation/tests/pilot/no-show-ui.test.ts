import { describe, it, expect, beforeAll } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * P1-B5 — "No-show" pilot UI regression coverage. Same posture as
 * tests/pilot/walk-in-ui.test.ts / seating-ui.test.ts: this codebase has
 * no DOM/browser test runner, so this is plain source-text assertion
 * against the shipped file, scoped to the exact new blocks this phase
 * added. tests/api/seating-no-show.test.ts already exhaustively proves
 * the server contract this page calls; this file's only job is proving
 * pilot.html wires up to it correctly.
 */
const pilotHtmlPath = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "public", "pilot.html");
let source: string;
let markNoShowBlock: string;
let actionCellBlock: string;

beforeAll(() => {
  source = readFileSync(pilotHtmlPath, "utf-8");

  const start = source.indexOf("async function markNoShow(r) {");
  const end = source.indexOf("// P1-A — Completion is a terminal");
  expect(start).toBeGreaterThan(-1);
  expect(end).toBeGreaterThan(start);
  markNoShowBlock = source.slice(start, end);

  const actionStart = source.indexOf('const actionCell = document.createElement("td");');
  const actionEnd = source.indexOf("tr.innerHTML = `", actionStart);
  expect(actionStart).toBeGreaterThan(-1);
  actionCellBlock = source.slice(actionStart, actionEnd);
});

describe("Daily list — No-show exposure", () => {
  it("offers No-show for Proposed or Confirmed reservations, gated the same way as Plaatsen/Cancel", () => {
    expect(actionCellBlock).toMatch(/if \(r\.status === "Proposed" \|\| r\.status === "Confirmed"\) \{\s*const noShowButton/);
    expect(actionCellBlock).toContain('noShowButton.textContent = "No-show"');
  });

  it("never offers No-show for Cancelled or Completed — an explicit Proposed/Confirmed allowlist, not a denylist", () => {
    const gate = actionCellBlock.match(/if \(r\.status === "Proposed" \|\| r\.status === "Confirmed"\) \{\s*const noShowButton[\s\S]*?\n {8}\}/);
    expect(gate).not.toBeNull();
    expect(gate![0]).not.toMatch(/Cancelled|Completed/);
  });

  it("clicking No-show calls the shared markNoShow(r), never a second implementation", () => {
    expect(actionCellBlock).toContain("markNoShow(r)");
  });
});

describe("markNoShow — authoritative refresh before acting", () => {
  it("fetches B4-A's GET /reservations/:id/seating/available-resources FIRST, before any confirmation or POST", () => {
    const getIndex = markNoShowBlock.indexOf("fetch(`/reservations/${r.id}/seating/available-resources`");
    const confirmIndex = markNoShowBlock.indexOf("confirm(");
    const postIndex = markNoShowBlock.indexOf('method: "POST"');
    expect(getIndex).toBeGreaterThan(-1);
    expect(confirmIndex).toBeGreaterThan(getIndex);
    expect(postIndex).toBeGreaterThan(confirmIndex);
  });

  it("an Unassigned reservation is refused with a clear message and never reaches the POST call", () => {
    const checkIndex = markNoShowBlock.indexOf('availData.assignmentStatus === "Unassigned"');
    const confirmIndex = markNoShowBlock.indexOf("confirm(");
    expect(checkIndex).toBeGreaterThan(-1);
    expect(confirmIndex).toBeGreaterThan(checkIndex);
    // Everything between the Unassigned check and the confirmation
    // prompt (i.e. the Unassigned branch's own body) contains no POST —
    // matching the earlier "GET, then confirm, then POST" ordering test.
    const between = markNoShowBlock.slice(checkIndex, confirmIndex);
    expect(between).toContain("return;");
    expect(between).not.toMatch(/method: "POST"/);
  });

  it("never reads or writes the legacy Reservation table-note field anywhere in this action", () => {
    expect(markNoShowBlock).not.toMatch(/\btableAssignment\b/);
  });

  it("a 401/403 on the availability read is shown as a clean permission message", () => {
    expect(markNoShowBlock).toMatch(/availRes\.status === 401 \|\| availRes\.status === 403/);
  });

  it("asks for explicit confirmation before releasing", () => {
    expect(markNoShowBlock).toMatch(/if \(!confirm\(`Reservering van \$\{who\} als no-show markeren/);
  });
});

describe("markNoShow — POST contract and outcome handling", () => {
  it("submits to POST /reservations/:id/seating/no-show", () => {
    expect(markNoShowBlock).toMatch(/fetch\(`\/reservations\/\$\{r\.id\}\/seating\/no-show`,\s*\{\s*method: "POST"/);
  });

  it("a successful release shows a clear Dutch confirmation and refreshes the list and occupancy", () => {
    expect(markNoShowBlock).toMatch(/showMessage\(listMessage, `Reservering van \$\{who\} gemarkeerd als no-show; plek vrijgegeven\.`, "ok"\)/);
    expect(markNoShowBlock).toContain("await loadList();");
    expect(markNoShowBlock).toContain("await loadOccupancy();");
  });

  it("NO_ACTIVE_ASSIGNMENT on the POST itself (a race after the initial check) is handled distinctly, not as a generic error", () => {
    expect(markNoShowBlock).toMatch(/data\.type === "NO_ACTIVE_ASSIGNMENT"/);
  });

  it("a 401/403 on the release POST is shown as a clean permission message", () => {
    expect(markNoShowBlock).toMatch(/res\.status === 401 \|\| res\.status === 403/);
  });

  it("exactly one POST call exists in this function — no automatic retry", () => {
    const postCount = (markNoShowBlock.match(/method: "POST"/g) || []).length;
    expect(postCount).toBe(1);
  });
});

describe("Out of scope for P1-B5 — explicitly not touched", () => {
  it("no lateArrivalRiskFlag or getFloorView reference was introduced anywhere in the page", () => {
    expect(source).not.toMatch(/lateArrivalRiskFlag|getFloorView/);
  });
});
