import { describe, it, expect, beforeAll } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * R1.6-P3B — "Diensten" pilot UI regression coverage. Same posture as
 * every other pilot test file in this codebase (e.g.
 * floorplan-admin-ui.test.ts, service-session-ui.test.ts): plain
 * source-text assertion against the shipped file — no DOM/browser runner,
 * no jsdom, no real fetch. This file never executes pilot.html's script,
 * so no network call and no pilot write of any kind can occur while it
 * runs; tests/api/services.test.ts already exhaustively proves the two
 * server contracts this panel composes. This file's only job is proving
 * pilot.html's own wiring/rendering/gating logic.
 */
const pilotHtmlPath = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "public", "pilot.html");
let source: string;

let sectionMarkup: string;
let initAppBlock: string;
let loadBlock: string;
let errorMessageBlock: string;
let runActionBlock: string;
let saveRowBlock: string;
let renderBlock: string;
let wholeServiceCatalogScript: string;

function slice(startMarker: string, endMarker: string): string {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start);
  expect(start).toBeGreaterThan(-1);
  expect(end).toBeGreaterThan(start);
  return source.slice(start, end);
}

beforeAll(() => {
  source = readFileSync(pilotHtmlPath, "utf-8");

  const sectionStart = source.indexOf("<h2>Diensten</h2>");
  const sectionEnd = source.indexOf("</section>", sectionStart);
  expect(sectionStart).toBeGreaterThan(-1);
  expect(sectionEnd).toBeGreaterThan(sectionStart);
  sectionMarkup = source.slice(sectionStart - 200, sectionEnd);

  const initAppStart = source.indexOf("function initApp() {");
  const initAppEnd = source.indexOf("}", initAppStart);
  initAppBlock = source.slice(initAppStart, initAppEnd);

  loadBlock = slice("async function loadServiceCatalog() {", "function serviceCatalogMutationErrorMessage(data, res) {");
  errorMessageBlock = slice("function serviceCatalogMutationErrorMessage(data, res) {", "async function runServiceCatalogAction(action) {");
  runActionBlock = slice("async function runServiceCatalogAction(action) {", "async function saveServiceCatalogRow(code) {");
  saveRowBlock = slice("async function saveServiceCatalogRow(code) {", "function renderServiceCatalog() {");
  renderBlock = slice("function renderServiceCatalog() {", "// --- Sluitingsdagen");

  wholeServiceCatalogScript = slice("// --- Diensten (R1.6-P3B)", "// --- Sluitingsdagen");
});

describe("Diensten — markup", () => {
  it("the section exists with heading 'Diensten' and the three expected containers", () => {
    expect(sectionMarkup).toMatch(/<h2>Diensten<\/h2>/);
    expect(sectionMarkup).toContain('id="service-catalog-message"');
    expect(sectionMarkup).toContain('id="service-catalog-refresh-message"');
    expect(sectionMarkup).toContain('id="service-catalog-list"');
    expect(sectionMarkup).toContain('id="service-catalog-empty"');
  });

  it("is date-independent — never wired to listDateInput's change handler or read from it", () => {
    expect(wholeServiceCatalogScript).not.toMatch(/listDateInput\.addEventListener/);
    expect(wholeServiceCatalogScript).not.toMatch(/listDateInput\.value/);
  });

  it("initApp() calls loadServiceCatalog(), so the panel initializes on login like every other panel", () => {
    expect(initAppBlock).toMatch(/loadServiceCatalog\(\)/);
  });
});

describe("Diensten — exact routes, no Create/Delete, code immutable", () => {
  it("reads via GET /services", () => {
    expect(loadBlock).toContain('fetch("/services")');
  });

  it("mutates via PATCH /services/:code only — no POST/PUT/DELETE to /services anywhere in this panel's script", () => {
    expect(wholeServiceCatalogScript).toMatch(/method:\s*"PATCH"/);
    expect(wholeServiceCatalogScript).not.toMatch(/method:\s*"POST"/);
    expect(wholeServiceCatalogScript).not.toMatch(/method:\s*"PUT"/);
    expect(wholeServiceCatalogScript).not.toMatch(/method:\s*"DELETE"/);
    expect(wholeServiceCatalogScript).toMatch(/fetch\(`\/services\/\$\{encodeURIComponent\(code\)\}`/);
  });

  it("no create/delete affordance — no 'create'/'aanmaken'/'verwijderen' control in this panel's markup or script", () => {
    expect(sectionMarkup).not.toMatch(/aanmaken|verwijderen|create-form|delete-button/i);
    expect(wholeServiceCatalogScript).not.toMatch(/aanmaken|verwijderen|createService|deleteService/i);
  });

  it("code is rendered read-only text (codeSpan.textContent), never inside an editable input", () => {
    expect(renderBlock).toMatch(/codeSpan\.textContent\s*=\s*row\.code/);
    expect(renderBlock).not.toMatch(/code.*\.value\s*=/);
  });

  it("the PATCH body builder never includes a 'code' field", () => {
    expect(saveRowBlock).not.toMatch(/body\.code|body\[.code.\]|code:\s*(code|row\.code)/);
  });
});

describe("Diensten — server-returned content rendered safely", () => {
  it("displayName and code are assigned via .value/.textContent, never via innerHTML string interpolation", () => {
    expect(renderBlock).toMatch(/nameInput\.value\s*=\s*pending\.displayName/);
    expect(renderBlock).not.toMatch(/innerHTML\s*=\s*`[^`]*\$\{/);
  });

  it("row rebuilding uses list.innerHTML = \"\" (a clear, not an interpolated write) before appending real elements", () => {
    expect(renderBlock).toMatch(/serviceCatalogList\.innerHTML\s*=\s*""/);
  });
});

describe("Diensten — dirty tracking and narrow PATCH body", () => {
  it("has a dirty-check function comparing pending edits against the authoritative row", () => {
    expect(wholeServiceCatalogScript).toMatch(/function isServiceCatalogRowDirty\(code\)/);
    expect(wholeServiceCatalogScript).toMatch(/pending\.displayName !== original\.displayName \|\| pending\.enabled !== original\.enabled/);
  });

  it("Save is disabled when the row is not dirty", () => {
    expect(renderBlock).toMatch(/saveButton\.disabled\s*=\s*serviceCatalogActionInFlight\s*\|\|\s*!isServiceCatalogRowDirty\(row\.code\)/);
  });

  it("the PATCH body includes only fields that actually changed, never re-sending an unchanged field", () => {
    expect(saveRowBlock).toMatch(/if \(pending\.displayName\.trim\(\) !== original\.displayName\) body\.displayName = pending\.displayName\.trim\(\);/);
    expect(saveRowBlock).toMatch(/if \(pending\.enabled !== original\.enabled\) body\.enabled = pending\.enabled;/);
  });

  it("a no-op save (nothing changed) returns early without calling the mutation guard", () => {
    expect(saveRowBlock).toMatch(/if \(Object\.keys\(body\)\.length === 0\) return;/);
  });
});

describe("Diensten — disable confirmation, before the guard and before any request", () => {
  it("confirm() is called only when body.enabled === false", () => {
    const confirmIndex = saveRowBlock.indexOf("confirm(");
    const conditionIndex = saveRowBlock.indexOf("body.enabled === false");
    expect(confirmIndex).toBeGreaterThan(-1);
    expect(conditionIndex).toBeGreaterThan(-1);
    expect(conditionIndex).toBeLessThan(confirmIndex);
  });

  it("confirm() occurs before runServiceCatalogAction (the in-flight guard) is ever called", () => {
    const confirmIndex = saveRowBlock.indexOf("confirm(");
    const runActionCallIndex = saveRowBlock.indexOf("runServiceCatalogAction(async () => {");
    expect(confirmIndex).toBeGreaterThan(-1);
    expect(runActionCallIndex).toBeGreaterThan(confirmIndex);
  });

  it("Cancel (confirmed === false) returns before runServiceCatalogAction — no request is issued", () => {
    expect(saveRowBlock).toMatch(/if \(!confirmed\) return;/);
    const returnIndex = saveRowBlock.indexOf("if (!confirmed) return;");
    const runActionCallIndex = saveRowBlock.indexOf("runServiceCatalogAction(async () => {");
    expect(returnIndex).toBeLessThan(runActionCallIndex);
  });

  it("a rename-only or enable-only save never reaches the confirm() call — it is gated strictly on body.enabled === false", () => {
    // Structural proof: the confirm() call is the ONLY conditional branch
    // gated on `body.enabled === false` in this block; nothing gates it
    // on `body.displayName` or `body.enabled === true`.
    expect(saveRowBlock).not.toMatch(/body\.displayName[\s\S]{0,80}confirm\(/);
    expect(saveRowBlock).not.toMatch(/body\.enabled === true[\s\S]{0,80}confirm\(/);
  });

  it("the confirmation text explains future-reservation blocking and explicitly states existing reservations/ServiceSessions are unchanged, without claiming schedule/session-closure behavior", () => {
    expect(saveRowBlock).toMatch(/geblokkeerd/);
    expect(saveRowBlock).toMatch(/niet gewijzigd/);
    expect(saveRowBlock).not.toMatch(/gesloten|sluit|afgesloten/i);
  });
});

describe("Diensten — duplicate-submission prevention and request-token stale-response protection", () => {
  it("runServiceCatalogAction is a single-flag guard: re-entrant calls while in flight are a no-op, cleared in finally", () => {
    expect(runActionBlock).toMatch(/if \(serviceCatalogActionInFlight\) return;/);
    expect(runActionBlock).toMatch(/serviceCatalogActionInFlight = true;/);
    expect(runActionBlock).toMatch(/finally\s*\{[\s\S]*serviceCatalogActionInFlight = false;/);
  });

  it("loadServiceCatalog uses a monotonic request token, discarding a superseded response at every await boundary", () => {
    expect(loadBlock).toMatch(/const requestToken = \+\+serviceCatalogRequestToken;/);
    const guardCount = (loadBlock.match(/if \(requestToken !== serviceCatalogRequestToken\) return;/g) || []).length;
    expect(guardCount).toBeGreaterThanOrEqual(2);
  });

  it("stale state is cleared before the authoritative reload — rows are reset to [] before the fetch", () => {
    const clearIndex = loadBlock.indexOf("serviceCatalogRows = [];");
    const fetchIndex = loadBlock.indexOf('fetch("/services")');
    expect(clearIndex).toBeGreaterThan(-1);
    expect(clearIndex).toBeLessThan(fetchIndex);
  });
});

describe("Diensten — separate success/refresh messages", () => {
  it("uses two distinct message elements — serviceCatalogMessage for mutation outcome, serviceCatalogRefreshMessage for load outcome", () => {
    expect(wholeServiceCatalogScript).toContain('document.getElementById("service-catalog-message")');
    expect(wholeServiceCatalogScript).toContain('document.getElementById("service-catalog-refresh-message")');
    expect(saveRowBlock).toMatch(/showMessage\(serviceCatalogMessage,/);
    expect(loadBlock).toMatch(/showMessage\(serviceCatalogRefreshMessage,/);
    expect(saveRowBlock).not.toMatch(/serviceCatalogRefreshMessage/);
  });

  it("a successful save reloads authoritative data after showing its own success message", () => {
    const successIndex = saveRowBlock.indexOf('"Dienst opgeslagen."');
    const reloadIndex = saveRowBlock.indexOf("await loadServiceCatalog();");
    expect(successIndex).toBeGreaterThan(-1);
    expect(reloadIndex).toBeGreaterThan(successIndex);
  });
});

describe("Diensten — authorization and typed safe messages", () => {
  it("401/403 map to one generic Dutch permission message, never a role or permission name", () => {
    expect(errorMessageBlock).toMatch(/res\.status === 401 \|\| res\.status === 403/);
    expect(errorMessageBlock).toMatch(/Je hebt geen rechten/);
  });

  it("SERVICE_NOT_FOUND maps to a safe refresh instruction", () => {
    expect(errorMessageBlock).toMatch(/SERVICE_NOT_FOUND/);
    expect(errorMessageBlock).toMatch(/ververs de pagina/);
  });

  it("never renders raw server JSON, a raw type string, a rule id, a role, or a permission name in any message text", () => {
    expect(wholeServiceCatalogScript).not.toMatch(/JSON\.stringify\(data\)/);
    expect(wholeServiceCatalogScript).not.toMatch(/data\.type\}/); // never interpolated into a message string
    expect(wholeServiceCatalogScript).not.toMatch(/CAP-D02\.01/);
    expect(wholeServiceCatalogScript).not.toMatch(/Owner|Manager|AssistantManager|Supervisor|ReservationAgent|CapacitySettingsManage/);
  });

  it("no client-side role/permission branching anywhere in this panel's script", () => {
    expect(wholeServiceCatalogScript).not.toMatch(/role\s*===|permission\s*===|hasPermission/i);
  });
});

describe("Diensten — no schedule/duration/session/floorplan control", () => {
  it("this panel's markup has no schedule/duration/capacity/area/Floorplan input or control element", () => {
    expect(sectionMarkup).not.toMatch(/<input[^>]*(schedule|duration|capacity|area)/i);
    expect(sectionMarkup).not.toMatch(/floorplan-/i);
  });

  it("never fetches a schedule/duration/capacity/floorplan-related endpoint or reads such a field off a row", () => {
    expect(wholeServiceCatalogScript).not.toMatch(/fetch\([^)]*(schedule|duration|capacity|floorplan)/i);
    expect(wholeServiceCatalogScript).not.toMatch(/row\.(schedule|duration|capacity|floorplanId|floorplanVersion|area)/i);
  });

  it("never fetches or references the /service-sessions endpoint", () => {
    expect(wholeServiceCatalogScript).not.toMatch(/fetch\([^)]*service-sessions/);
    expect(wholeServiceCatalogScript).not.toMatch(/new ServiceSessionService/);
  });
});

describe("Diensten — existing panels unaffected", () => {
  it("Servicesessies and Floorplannen sections still exist, unchanged in position relative to Diensten", () => {
    const serviceSessionsIndex = source.indexOf("<h2>Servicesessies</h2>");
    const floorplansIndex = source.indexOf("<h2>Floorplannen</h2>");
    const dienstenIndex = source.indexOf("<h2>Diensten</h2>");
    expect(serviceSessionsIndex).toBeGreaterThan(-1);
    expect(floorplansIndex).toBeGreaterThan(serviceSessionsIndex);
    expect(dienstenIndex).toBeGreaterThan(floorplansIndex);
  });

  it("initApp() still calls every pre-existing load function, none removed", () => {
    expect(initAppBlock).toMatch(/loadList\(\)/);
    expect(initAppBlock).toMatch(/loadServiceSessions\(\)/);
    expect(initAppBlock).toMatch(/loadFloorplanPanel\(\)/);
    expect(initAppBlock).toMatch(/loadClosingDays\(\)/);
    expect(initAppBlock).toMatch(/loadResourceBlocks\(\)/);
    expect(initAppBlock).toMatch(/loadOccupancy\(\)/);
    expect(initAppBlock).toMatch(/loadSecurityEvents\(\)/);
  });
});
