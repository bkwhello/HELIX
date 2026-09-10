import { describe, it, expect, beforeAll } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * R1.7-P1 — "Security events" pilot UI regression coverage. Same posture
 * as the other pilot test files (e.g. seating-disposition-edit-ui.test.ts):
 * plain source-text assertion against the shipped file, no DOM/browser
 * runner in this codebase. tests/api/security-events.test.ts already
 * exhaustively proves the server contract; this file's only job is
 * proving pilot.html's own rendering/visibility logic.
 */
const pilotHtmlPath = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "public", "pilot.html");
let source: string;
let htmlBlock: string;
let scriptBlock: string;

beforeAll(() => {
  source = readFileSync(pilotHtmlPath, "utf-8");

  const htmlStart = source.indexOf('<section id="security-events-section"');
  const htmlEnd = source.indexOf("</section>", htmlStart);
  expect(htmlStart).toBeGreaterThan(-1);
  expect(htmlEnd).toBeGreaterThan(htmlStart);
  htmlBlock = source.slice(htmlStart, htmlEnd);

  const scriptStart = source.indexOf('const securityEventsSection = document.getElementById("security-events-section");');
  const scriptEnd = source.indexOf("// --- Teppanyaki bezetting", scriptStart);
  expect(scriptStart).toBeGreaterThan(-1);
  expect(scriptEnd).toBeGreaterThan(scriptStart);
  scriptBlock = source.slice(scriptStart, scriptEnd);
});

describe("Security events section — markup", () => {
  it("has its own heading and is wired into initApp()", () => {
    expect(htmlBlock).toContain("Beveiligingsgebeurtenissen");
    expect(source).toContain("loadSecurityEvents();");
  });

  it("contains no form or button — a purely read-only view, nothing can mutate/delete/acknowledge an event", () => {
    expect(htmlBlock).not.toMatch(/<form/i);
    expect(htmlBlock).not.toMatch(/<button/i);
  });
});

describe("Security events section — authorization handling", () => {
  it("hides the whole section on 401 or 403, without displaying any error detail", () => {
    expect(scriptBlock).toContain('if (res.status === 401 || res.status === 403) {');
    expect(scriptBlock).toMatch(/securityEventsSection\.style\.display = "none";/);
  });

  it("re-shows the section on a subsequent successful load (not permanently hidden after one failed check)", () => {
    const afterAuthCheck = scriptBlock.slice(scriptBlock.indexOf("securityEventsSection.style.display = \"none\";"));
    expect(afterAuthCheck).toMatch(/securityEventsSection\.style\.display = "";/);
  });
});

describe("Security events section — safe rendering", () => {
  it("escapes every dynamic field before inserting it into the DOM", () => {
    expect(scriptBlock).toMatch(/escapeHtml\(typeLabel\)/);
    expect(scriptBlock).toMatch(/escapeHtml\(reasonLabel\)/);
    expect(scriptBlock).toMatch(/escapeHtml\(targetLabel\)/);
    expect(scriptBlock).toMatch(/escapeHtml\(actingLabel\)/);
  });

  it("never renders a raw event.type or event.reason string directly — only through a label lookup", () => {
    expect(scriptBlock).not.toMatch(/\$\{event\.type\}/);
    expect(scriptBlock).not.toMatch(/\$\{event\.reason\}/);
  });
});

describe("Security events section — empty state and read failure", () => {
  it("shows the configured empty-state element when no events are returned", () => {
    expect(htmlBlock).toContain('id="security-events-empty"');
    expect(scriptBlock).toMatch(/securityEventsEmpty\.style\.display = data\.events\.length === 0 \? "block" : "none";/);
  });

  it("shows a visible error message on a non-ok, non-auth response", () => {
    expect(scriptBlock).toMatch(/if \(!res\.ok\) \{[\s\S]*?showMessage\(securityEventsMessage,\s*"[^"]*niet laden[^"]*",\s*"error"\)/);
  });

  it("shows a visible error message on a network failure (fetch throws)", () => {
    const catchBlock = scriptBlock.slice(scriptBlock.indexOf("} catch (err) {"));
    expect(catchBlock).toMatch(/showMessage\(securityEventsMessage,\s*"[^"]*Netwerkfout[^"]*",\s*"error"\)/);
  });
});
