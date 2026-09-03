import { describe, it, expect, beforeAll } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * P1-B8 — "Tafel blokkeren" pilot UI regression coverage. Same posture as
 * the other pilot test files: plain source-text assertion against the
 * shipped file. tests/api/resource-blocks.test.ts already exhaustively
 * proves the server contract; this file's only job is proving pilot.html
 * wires up to it correctly.
 */
const pilotHtmlPath = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "public", "pilot.html");
let source: string;
let formBlock: string;
let loadBlock: string;

beforeAll(() => {
  source = readFileSync(pilotHtmlPath, "utf-8");

  const formStart = source.indexOf('resourceBlockForm.addEventListener("submit"');
  const formEnd = source.indexOf("// --- Teppanyaki bezetting");
  expect(formStart).toBeGreaterThan(-1);
  expect(formEnd).toBeGreaterThan(formStart);
  formBlock = source.slice(formStart, formEnd);

  const loadStart = source.indexOf("async function loadResourceBlocks() {");
  const loadEnd = source.indexOf('resourceBlockForm.addEventListener("submit"');
  expect(loadStart).toBeGreaterThan(-1);
  expect(loadEnd).toBeGreaterThan(loadStart);
  loadBlock = source.slice(loadStart, loadEnd);
});

describe("Tafel blokkeren — form fields", () => {
  it("has a table-label, start, end, and reason field, plus a submit button", () => {
    expect(source).toContain('id="block-table-label"');
    expect(source).toContain('id="block-start"');
    expect(source).toContain('id="block-end"');
    expect(source).toContain('id="block-reason"');
    expect(source).toContain('<form id="resource-block-form">');
  });

  it("start and end use datetime-local, not date — blocks are interval-precise, not whole-day like Sluitingsdagen", () => {
    expect(source).toMatch(/id="block-start" type="datetime-local"/);
    expect(source).toMatch(/id="block-end" type="datetime-local"/);
  });
});

describe("Tafel blokkeren — submit handler", () => {
  it("requires operationalLabel, start, and end before submitting — no silent default", () => {
    expect(formBlock).toContain("if (!operationalLabel || !startRaw || !endRaw)");
    expect(formBlock).toContain("return;");
  });

  it("converts the datetime-local value to a full UTC ISO string before sending, never the raw local-time string", () => {
    expect(formBlock).toContain("new Date(startRaw).toISOString()");
    expect(formBlock).toContain("new Date(endRaw).toISOString()");
  });

  it("posts to POST /resource-blocks with operationalLabel/startTime/endTime/reason", () => {
    expect(formBlock).toMatch(/fetch\("\/resource-blocks",\s*\{\s*method: "POST"/);
    expect(formBlock).toContain("JSON.stringify({ operationalLabel, startTime, endTime, reason })");
  });

  it("maps each known error type to a distinct Dutch message, not one generic failure string", () => {
    expect(formBlock).toContain('data.type === "TABLE_NOT_FOUND"');
    expect(formBlock).toContain('data.type === "ACTIVE_ASSIGNMENT_CONFLICT"');
    expect(formBlock).toContain('data.type === "BLOCK_OVERLAP"');
  });

  it("a successful submit clears the form and refreshes the block list", () => {
    expect(formBlock).toContain('document.getElementById("block-table-label").value = "";');
    expect(formBlock).toContain("await loadResourceBlocks();");
  });

  it("exactly one POST call exists in the submit handler — no automatic retry", () => {
    const postCount = (formBlock.match(/method: "POST"/g) || []).length;
    expect(postCount).toBe(1);
  });
});

describe("Tafel blokkeren — list rendering and unblock", () => {
  it("fetches GET /resource-blocks", () => {
    expect(loadBlock).toContain('fetch("/resource-blocks")');
  });

  it("renders the table's own operationalLabel, interval, and reason — never a raw resource id", () => {
    expect(loadBlock).toContain("escapeHtml(block.tableOperationalLabel)");
    expect(loadBlock).toContain("formatDateTimeNL(block.startTime)");
    expect(loadBlock).toContain("formatDateTimeNL(block.endTime)");
  });

  it("each row has a Deblokkeren button carrying the block id", () => {
    expect(loadBlock).toMatch(/class="remove" data-id="\$\{block\.id\}"/);
    expect(loadBlock).toContain("Deblokkeren");
  });

  it("the remove button calls DELETE /resource-blocks/:id and then reloads the list", () => {
    expect(loadBlock).toMatch(/fetch\(`\/resource-blocks\/\$\{btn\.dataset\.id\}`, \{ method: "DELETE", headers: actorHeaders\(\) \}\)/);
    expect(loadBlock).toContain("await loadResourceBlocks();");
  });

  it("shows the empty state only when the list is empty", () => {
    expect(loadBlock).toContain('resourceBlockEmpty.style.display = data.blocks.length === 0 ? "block" : "none";');
  });

  it("a failed load shows a visible error message, not a silent failure", () => {
    expect(loadBlock).toMatch(/if \(!res\.ok\) \{\s*showMessage\(resourceBlockMessage,/);
  });
});

describe("Initialization and existing features — unaffected", () => {
  it("loadResourceBlocks() is called from initApp() alongside the existing loaders", () => {
    const initAppStart = source.indexOf("function initApp() {");
    const initAppEnd = source.indexOf("}", initAppStart);
    const initAppBlock = source.slice(initAppStart, initAppEnd);
    expect(initAppBlock).toContain("loadList();");
    expect(initAppBlock).toContain("loadClosingDays();");
    expect(initAppBlock).toContain("loadResourceBlocks();");
    expect(initAppBlock).toContain("loadOccupancy();");
  });

  it("Sluitingsdagen, seating actions (Plaatsen/Verplaatsen/No-show), and the 'Laat' badge are all still present, untouched by this addition", () => {
    expect(source).toContain('<form id="closing-day-form">');
    expect(source).toContain('openSeatingPicker(r.id, "assign")');
    expect(source).toContain("markNoShow(r)");
    expect(source).toContain('class="late-badge"');
  });
});
