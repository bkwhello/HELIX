import { describe, it, expect, beforeAll } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * R1.5-P1B — "capacity-relevant Modify now returns 200 + seatingDisposition"
 * pilot UI regression coverage. Same posture as the other pilot test
 * files: plain source-text assertion against the shipped file (no
 * DOM/browser runner in this codebase). tests/api/seating-no-show.test.ts
 * already exhaustively proves the server contract; this file's only job
 * is proving pilot.html's edit-save handler actually branches on
 * seatingDisposition and shows the right message for each case.
 */
const pilotHtmlPath = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "public", "pilot.html");
let source: string;
let submitHandlerBlock: string;

beforeAll(() => {
  source = readFileSync(pilotHtmlPath, "utf-8");

  const submitStart = source.indexOf('createForm.addEventListener("submit"');
  const submitEnd = source.indexOf("// CAP-D05.01 §13", submitStart);
  expect(submitStart).toBeGreaterThan(-1);
  expect(submitEnd).toBeGreaterThan(submitStart);
  submitHandlerBlock = source.slice(submitStart, submitEnd);
});

describe("Edit-save handler — R1.5-P1B response-contract branching", () => {
  it("checks res.status === 200 to detect a capacity-relevant response, distinct from the plain 204 branch", () => {
    expect(submitHandlerBlock).toContain("if (res.status === 200) {");
  });

  it("shows an explicit warning when seatingDisposition is RELEASED, stating the reservation was saved but seating must be reassigned", () => {
    expect(submitHandlerBlock).toContain('data.seatingDisposition === "RELEASED"');
    expect(submitHandlerBlock).toMatch(/showMessage\(createMessage,\s*"[^"]*moet opnieuw worden toegewezen[^"]*",\s*"warn"\)/);
  });

  it("shows a concise, distinct success message when seatingDisposition is RETAINED", () => {
    expect(submitHandlerBlock).toContain('data.seatingDisposition === "RETAINED"');
    expect(submitHandlerBlock).toMatch(/showMessage\(createMessage,\s*"[^"]*zitplaats behouden[^"]*",\s*"ok"\)/);
  });

  it("falls back to the same generic success message for UNCHANGED/NO_ACTIVE_ASSIGNMENT as any other successful save", () => {
    // The else-branch inside the 200 handler and the plain-204 branch both
    // reuse the exact same generic string — no new, third message invented.
    const genericCount = (submitHandlerBlock.match(/"Wijzigingen opgeslagen\."/g) ?? []).length;
    expect(genericCount).toBeGreaterThanOrEqual(2);
  });

  it("still refreshes the list (which itself refreshes the floor-view-derived flags) and occupancy after a successful save, regardless of status code", () => {
    const afterMessaging = submitHandlerBlock.slice(submitHandlerBlock.indexOf("exitEditMode();"));
    expect(afterMessaging).toContain("await loadList();");
    expect(afterMessaging).toContain("await loadOccupancy();");
  });

  it("a failed save (res.ok false) is checked BEFORE the status-code branching, unaffected by this milestone", () => {
    const failureCheckIndex = submitHandlerBlock.indexOf("if (!res.ok) {");
    const statusBranchIndex = submitHandlerBlock.indexOf("if (res.status === 200) {");
    expect(failureCheckIndex).toBeGreaterThan(-1);
    expect(statusBranchIndex).toBeGreaterThan(failureCheckIndex);
  });
});
