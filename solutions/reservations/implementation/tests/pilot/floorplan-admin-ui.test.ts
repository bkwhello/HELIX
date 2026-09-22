import { describe, it, expect, beforeAll } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * R1.5-P2E-2 — "Floorplannen" pilot UI regression coverage. Same posture
 * as every other pilot test file in this codebase (e.g.
 * service-session-ui.test.ts, resource-block-ui.test.ts,
 * security-events-ui.test.ts): plain source-text assertion against the
 * shipped file — no DOM/browser runner, no jsdom, no real fetch. This
 * file never executes pilot.html's script, so no network call and no
 * pilot write of any kind can occur while it runs; tests/api/floorplans.test.ts
 * and tests/api/floorplan-table-inventory.test.ts already exhaustively
 * prove the ten server contracts this panel merely composes. This file's
 * only job is proving pilot.html's own wiring/rendering/gating logic.
 */
const pilotHtmlPath = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "public", "pilot.html");
let source: string;

let initAppBlock: string;
let loadPanelBlock: string;
let loadVersionsBlock: string;
let loadDetailBlock: string;
let selectFloorplanBlock: string;
let selectVersionBlock: string;
let errorMessageBlock: string;
let runActionBlock: string;
let createFloorplanBlock: string;
let createDraftBlock: string;
let saveMembershipBlock: string;
let publishBlock: string;
let setDefaultBlock: string;
let archiveBlock: string;
let renderFloorplanListBlock: string;
let renderVersionListBlock: string;
let buildCheckboxRowBlock: string;
let renderMembershipEditorBlock: string;
let renderPanelBlock: string;
let wholeFloorplanScript: string;

function slice(startMarker: string, endMarker: string): string {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start);
  expect(start).toBeGreaterThan(-1);
  expect(end).toBeGreaterThan(start);
  return source.slice(start, end);
}

beforeAll(() => {
  source = readFileSync(pilotHtmlPath, "utf-8");

  const initAppStart = source.indexOf("function initApp() {");
  const initAppEnd = source.indexOf("}", initAppStart);
  expect(initAppStart).toBeGreaterThan(-1);
  initAppBlock = source.slice(initAppStart, initAppEnd);

  loadPanelBlock = slice("async function loadFloorplanPanel() {", "async function loadFloorplanVersions() {");
  loadVersionsBlock = slice("async function loadFloorplanVersions() {", "async function loadSelectedVersionDetail() {");
  loadDetailBlock = slice("async function loadSelectedVersionDetail() {", "async function selectFloorplan(floorplanId) {");
  selectFloorplanBlock = slice("async function selectFloorplan(floorplanId) {", "async function selectVersionForMembershipEditing(versionId) {");
  selectVersionBlock = slice("async function selectVersionForMembershipEditing(versionId) {", "function floorplanMutationErrorMessage(data, res) {");
  errorMessageBlock = slice("function floorplanMutationErrorMessage(data, res) {", "async function runFloorplanAction(action) {");
  runActionBlock = slice("async function runFloorplanAction(action) {", 'floorplanCreateForm.addEventListener("submit"');
  createFloorplanBlock = slice('floorplanCreateForm.addEventListener("submit"', 'floorplanCreateDraftButton.addEventListener("click"');
  createDraftBlock = slice('floorplanCreateDraftButton.addEventListener("click"', 'floorplanMembershipSaveButton.addEventListener("click"');
  saveMembershipBlock = slice('floorplanMembershipSaveButton.addEventListener("click"', "async function publishVersion(version) {");
  publishBlock = slice("async function publishVersion(version) {", "async function setVersionAsDefault(version) {");
  setDefaultBlock = slice("async function setVersionAsDefault(version) {", "async function archiveVersion(version) {");
  archiveBlock = slice("async function archiveVersion(version) {", "function renderFloorplanList() {");
  renderFloorplanListBlock = slice("function renderFloorplanList() {", "function renderVersionList() {");
  renderVersionListBlock = slice("function renderVersionList() {", "function buildTableCheckboxRow(");
  buildCheckboxRowBlock = slice("function buildTableCheckboxRow(", "function renderMembershipEditor() {");
  renderMembershipEditorBlock = slice("function renderMembershipEditor() {", "function renderFloorplanPanel() {");
  renderPanelBlock = slice("function renderFloorplanPanel() {", "// --- Sluitingsdagen");

  wholeFloorplanScript = slice("// --- Floorplannen (R1.5-P2E-2)", "// --- Sluitingsdagen");
});

describe("Floorplannen — markup and wiring", () => {
  it("has its own panel with a heading, message area, create form, and list containers", () => {
    expect(source).toContain("<h2>Floorplannen</h2>");
    expect(source).toContain('id="floorplan-message"');
    expect(source).toContain('id="floorplan-create-form"');
    expect(source).toContain('id="floorplan-list"');
    expect(source).toContain('id="floorplan-version-list"');
    expect(source).toContain('id="floorplan-membership-editor"');
  });

  it("loadFloorplanPanel() is called from initApp() alongside the existing loaders", () => {
    expect(initAppBlock).toContain("loadList();");
    expect(initAppBlock).toContain("loadServiceSessions();");
    expect(initAppBlock).toContain("loadFloorplanPanel();");
  });

  it("is date-independent — never wired to listDateInput's change handler, unlike Servicesessies", () => {
    expect(source).not.toContain('listDateInput.addEventListener("change", loadFloorplanPanel);');
    expect(wholeFloorplanScript).not.toMatch(/listDateInput\.addEventListener/);
    expect(wholeFloorplanScript).not.toMatch(/listDateInput\.value/);
  });
});

describe("Floorplannen — exact four GET contracts, no B4-A/reservation endpoint, no hardcoded inventory", () => {
  it("loadFloorplanPanel fetches exactly GET /floorplans and GET /floorplan-resources/tables", () => {
    expect(loadPanelBlock).toContain('fetch("/floorplans")');
    expect(loadPanelBlock).toContain('fetch("/floorplan-resources/tables")');
  });

  it("loadFloorplanVersions fetches GET /floorplans/:id/versions", () => {
    expect(loadVersionsBlock).toContain("fetch(`/floorplans/${encodeURIComponent(selectedFloorplanId)}/versions`)");
  });

  it("loadSelectedVersionDetail fetches GET /floorplan-versions/:id", () => {
    expect(loadDetailBlock).toContain("fetch(`/floorplan-versions/${encodeURIComponent(selectedVersionId)}`)");
  });

  it("no B4-A, reservation, or availability endpoint is ever used for inventory or membership", () => {
    expect(wholeFloorplanScript).not.toMatch(/\/reservations\//);
    expect(wholeFloorplanScript).not.toContain("/availability");
  });

  it("no canonical seeded Table id is hardcoded anywhere in this panel", () => {
    for (const forbidden of ["sushi-table-", "sushi-bar-", "teppanyaki-c", "teppanyaki-d", "teppanyaki-e", "teppanyaki-f"]) {
      expect(wholeFloorplanScript.toLowerCase()).not.toContain(forbidden);
    }
  });

  it("Seats are never fetched or expanded as inventory members — only GET /floorplan-resources/tables (Table rows) is used", () => {
    expect(wholeFloorplanScript).not.toMatch(/\/seats?\b/i);
    expect(wholeFloorplanScript).not.toContain("seatId");
  });
});

describe("Floorplannen — stale-response protection at Floorplan/version/detail levels", () => {
  it("three independent monotonic tokens exist, one per load level", () => {
    expect(source).toContain("let floorplanPanelRequestToken = 0;");
    expect(source).toContain("let floorplanVersionsRequestToken = 0;");
    expect(source).toContain("let floorplanVersionDetailRequestToken = 0;");
  });

  it("loadFloorplanPanel captures its own token and discards a superseded response before touching floorplans/tableInventory", () => {
    const tokenIndex = loadPanelBlock.indexOf("const requestToken = ++floorplanPanelRequestToken;");
    const checkIndex = loadPanelBlock.indexOf("if (requestToken !== floorplanPanelRequestToken) return;");
    const assignIndex = loadPanelBlock.indexOf("floorplans = floorplansData.floorplans");
    expect(tokenIndex).toBeGreaterThan(-1);
    expect(checkIndex).toBeGreaterThan(tokenIndex);
    expect(assignIndex).toBeGreaterThan(checkIndex);
  });

  it("loadFloorplanVersions captures its own token and discards a superseded response before assigning versionsForSelectedFloorplan", () => {
    const tokenIndex = loadVersionsBlock.indexOf("const requestToken = ++floorplanVersionsRequestToken;");
    const checkIndex = loadVersionsBlock.indexOf("if (requestToken !== floorplanVersionsRequestToken) return;");
    const assignIndex = loadVersionsBlock.indexOf("versionsForSelectedFloorplan = data.versions");
    expect(tokenIndex).toBeGreaterThan(-1);
    expect(checkIndex).toBeGreaterThan(tokenIndex);
    expect(assignIndex).toBeGreaterThan(checkIndex);
  });

  it("loadSelectedVersionDetail captures its own token and discards a superseded response before assigning selectedVersionDetail", () => {
    const tokenIndex = loadDetailBlock.indexOf("const requestToken = ++floorplanVersionDetailRequestToken;");
    const checkIndex = loadDetailBlock.indexOf("if (requestToken !== floorplanVersionDetailRequestToken) return;");
    const assignIndex = loadDetailBlock.indexOf("selectedVersionDetail = data;");
    expect(tokenIndex).toBeGreaterThan(-1);
    expect(checkIndex).toBeGreaterThan(tokenIndex);
    expect(assignIndex).toBeGreaterThan(checkIndex);
  });

  it("each token is re-checked after every await in its own success path (fetch + json)", () => {
    const panelChecks = (loadPanelBlock.match(/if \(requestToken !== floorplanPanelRequestToken\) return;/g) || []).length;
    const versionChecks = (loadVersionsBlock.match(/if \(requestToken !== floorplanVersionsRequestToken\) return;/g) || []).length;
    const detailChecks = (loadDetailBlock.match(/if \(requestToken !== floorplanVersionDetailRequestToken\) return;/g) || []).length;
    expect(panelChecks).toBeGreaterThanOrEqual(2);
    expect(versionChecks).toBeGreaterThanOrEqual(2);
    expect(detailChecks).toBeGreaterThanOrEqual(2);
  });
});

describe("Floorplannen — failed reads clear stale state", () => {
  it("loadFloorplanPanel clears floorplans/tableInventory BEFORE the fetch, and again on network failure", () => {
    const resetIndex = loadPanelBlock.indexOf("floorplans = [];");
    const fetchIndex = loadPanelBlock.indexOf("Promise.all");
    expect(resetIndex).toBeGreaterThan(-1);
    expect(fetchIndex).toBeGreaterThan(resetIndex);
    const catchIndex = loadPanelBlock.indexOf("catch (err) {");
    const catchBlock = loadPanelBlock.slice(catchIndex);
    expect(catchBlock).toContain("floorplans = [];");
    expect(catchBlock).toContain("tableInventory = [];");
    expect(catchBlock).toContain('showMessage(floorplanRefreshMessage, "Netwerkfout: kon floorplannen niet laden.", "error");');
  });

  it("loadFloorplanVersions clears versionsForSelectedFloorplan BEFORE the fetch, and shows a network message on failure", () => {
    const resetIndex = loadVersionsBlock.indexOf("versionsForSelectedFloorplan = [];");
    const fetchIndex = loadVersionsBlock.indexOf("fetch(`/floorplans/");
    expect(resetIndex).toBeGreaterThan(-1);
    expect(fetchIndex).toBeGreaterThan(resetIndex);
    expect(loadVersionsBlock).toContain('showMessage(floorplanRefreshMessage, "Netwerkfout: kon versies niet laden.", "error");');
  });

  it("loadSelectedVersionDetail clears the membership baseline BEFORE the fetch, and on network failure", () => {
    const resetIndex = loadDetailBlock.indexOf("selectedVersionDetail = null;");
    const fetchIndex = loadDetailBlock.indexOf("fetch(`/floorplan-versions/");
    expect(resetIndex).toBeGreaterThan(-1);
    expect(fetchIndex).toBeGreaterThan(resetIndex);
    expect(loadDetailBlock).toContain("authoritativeMembershipTableIds = new Set();");
    expect(loadDetailBlock).toContain("pendingMembershipTableIds = new Set();");
    const catchIndex = loadDetailBlock.lastIndexOf("catch (err) {");
    expect(loadDetailBlock.slice(catchIndex)).toContain('showMessage(floorplanRefreshMessage, "Netwerkfout: kon versiedetails niet laden.", "error");');
  });
});

describe("Floorplannen — deliberate empty states", () => {
  it("an empty Floorplan list renders the deliberate empty state", () => {
    expect(source).toContain('id="floorplan-empty"');
    expect(renderFloorplanListBlock).toContain('floorplanEmpty.style.display = floorplans.length === 0 ? "block" : "none";');
  });

  it("a Floorplan with no versions renders the deliberate empty state", () => {
    expect(source).toContain('id="floorplan-version-empty"');
    expect(renderVersionListBlock).toContain('floorplanVersionEmpty.style.display = versionsForSelectedFloorplan.length === 0 ? "block" : "none";');
  });
});

describe("Floorplannen — rendering safety: textContent only, no raw payload injection", () => {
  it("dynamic Floorplan/version/table values are assigned via textContent, never interpolated into innerHTML", () => {
    for (const block of [renderFloorplanListBlock, renderVersionListBlock, buildCheckboxRowBlock]) {
      expect(block).not.toMatch(/\.innerHTML = `/);
      expect(block).toContain(".textContent");
    }
  });

  it("list containers are cleared via a static, non-interpolated innerHTML assignment only", () => {
    expect(renderFloorplanListBlock).toContain('floorplanList.innerHTML = "";');
    expect(renderVersionListBlock).toContain('floorplanVersionList.innerHTML = "";');
    expect(renderMembershipEditorBlock).toContain('floorplanMembershipAreas.innerHTML = "";');
  });

  it("no raw server response body (data/res) is ever assigned directly into a message or DOM text", () => {
    expect(wholeFloorplanScript).not.toMatch(/showMessage\([^,]+,\s*data\.message/);
    expect(wholeFloorplanScript).not.toMatch(/showMessage\([^,]+,\s*JSON\.stringify/);
    expect(wholeFloorplanScript).not.toMatch(/\.textContent = data;/);
  });
});

describe("Floorplannen — inventory grouping and ordering", () => {
  it("groups strictly Sushi then Teppanyaki, via the closed FLOORPLAN_AREAS list", () => {
    expect(source).toContain('const FLOORPLAN_AREAS = ["Sushi", "Teppanyaki"];');
    expect(renderMembershipEditorBlock).toContain("for (const areaId of FLOORPLAN_AREAS)");
  });

  it("within an area, the server-provided order is preserved — filtered, never re-sorted", () => {
    expect(renderMembershipEditorBlock).toContain("tableInventory.filter((t) => t.areaId === areaId)");
    // The area loop itself (Table membership rows) is never re-sorted —
    // the ONLY .sort() in this function is the SEPARATE, deliberately
    // deterministic ordering of unrelated unknown-historical-id rows below.
    const areaLoopStart = renderMembershipEditorBlock.indexOf("for (const areaId of FLOORPLAN_AREAS)");
    const areaLoopEnd = renderMembershipEditorBlock.indexOf("floorplanMembershipAreas.appendChild(fieldset);", areaLoopStart) + 1;
    const areaLoopBody = renderMembershipEditorBlock.slice(areaLoopStart, areaLoopEnd);
    expect(areaLoopBody).not.toMatch(/\.sort\(/);
    expect(renderMembershipEditorBlock).toContain("unknownIds = [...pendingMembershipTableIds].filter((id) => !inventoryById.has(id)).sort();");
  });
});

describe("Floorplannen — Inactive Tables remain selectable and visibly marked", () => {
  it("an Inactive table gets a muted row class, never a disabled/removed checkbox", () => {
    expect(buildCheckboxRowBlock).toContain('table && table.status === "Inactive"');
    expect(buildCheckboxRowBlock).toContain("floorplan-table-inactive");
    expect(buildCheckboxRowBlock).not.toContain('checkbox.disabled = table.status === "Inactive"');
  });

  it("an Inactive table gets an explicit visible badge", () => {
    expect(buildCheckboxRowBlock).toContain('inactiveBadge.textContent = "Inactief";');
  });

  it("inactive Tables are never silently excluded from the rendered area list", () => {
    expect(renderMembershipEditorBlock).not.toMatch(/filter\([^)]*status[^)]*Active/);
  });
});

describe("Floorplannen — unknown historical member ids", () => {
  it("an id present in the membership set but absent from inventory renders a safe 'Onbekende tafel' row using the id as plain text", () => {
    expect(buildCheckboxRowBlock).toContain('label.textContent = "Onbekende tafel (" + tableId + ")";');
  });

  it("unknown ids are computed from the pending set minus the known inventory, never fabricating area/label/capacity/status", () => {
    expect(renderMembershipEditorBlock).toContain("const unknownIds = [...pendingMembershipTableIds].filter((id) => !inventoryById.has(id))");
    expect(buildCheckboxRowBlock).not.toMatch(/table\.areaId \|\|/);
  });

  it("an unknown id's checkbox uses the SAME pendingMembershipTableIds add/delete wiring as a known Table — unchecking removes it, nothing else does", () => {
    expect(buildCheckboxRowBlock).toContain("pendingMembershipTableIds.add(tableId);");
    expect(buildCheckboxRowBlock).toContain("pendingMembershipTableIds.delete(tableId);");
  });
});

describe("Floorplannen — native accessible controls", () => {
  it("every Table row is a real checkbox with an associated <label for=...>", () => {
    expect(buildCheckboxRowBlock).toContain('checkbox.type = "checkbox";');
    expect(buildCheckboxRowBlock).toContain('label.setAttribute("for", checkboxId);');
    expect(buildCheckboxRowBlock).toContain("checkbox.id = checkboxId;");
  });

  it("each area is grouped in a real <fieldset>/<legend>, not a styled div", () => {
    expect(renderMembershipEditorBlock).toContain('document.createElement("fieldset")');
    expect(renderMembershipEditorBlock).toContain('document.createElement("legend")');
  });
});

describe("Floorplannen — membership editor: complete-set body, per-area controls, no global select-all", () => {
  it("Save sends PUT /floorplan-versions/:id/resources with a body containing only { tableIds }", () => {
    expect(saveMembershipBlock).toContain('method: "PUT"');
    expect(saveMembershipBlock).toContain("fetch(`/floorplan-versions/${encodeURIComponent(selectedVersionId)}/resources`");
    expect(saveMembershipBlock).toContain("JSON.stringify({ tableIds })");
  });

  it("the payload is built from the complete pendingMembershipTableIds set, not a delta", () => {
    expect(saveMembershipBlock).toContain("const tableIds = [...pendingMembershipTableIds];");
  });

  it("select-all/clear controls exist per area (inside the per-area fieldset loop), operating only on that area's own Tables", () => {
    const areaLoopStart = renderMembershipEditorBlock.indexOf("for (const areaId of FLOORPLAN_AREAS)");
    const areaLoopBody = renderMembershipEditorBlock.slice(areaLoopStart);
    expect(areaLoopBody).toContain('selectAllButton.textContent = "Alles selecteren";');
    expect(areaLoopBody).toContain('clearAreaButton.textContent = "Wissen";');
    expect(areaLoopBody).toContain("for (const t of areaTables) pendingMembershipTableIds.add(t.id);");
    expect(areaLoopBody).toContain("for (const t of areaTables) pendingMembershipTableIds.delete(t.id);");
  });

  it("no global select-all/clear-all exists outside the per-area loop", () => {
    const areaLoopStart = renderMembershipEditorBlock.indexOf("for (const areaId of FLOORPLAN_AREAS)");
    const beforeLoop = renderMembershipEditorBlock.slice(0, areaLoopStart);
    expect(beforeLoop).not.toMatch(/Alles selecteren|select.?all/i);
    expect(source).not.toMatch(/id="floorplan-select-all"/);
  });
});

describe("Floorplannen — dirty tracking against the authoritative baseline", () => {
  it("isMembershipDirty compares pendingMembershipTableIds against authoritativeMembershipTableIds, only for a selected Draft", () => {
    expect(source).toContain('if (!selectedVersionDetail || selectedVersionDetail.version.status !== "Draft") return false;');
    expect(source).toContain("if (pendingMembershipTableIds.size !== authoritativeMembershipTableIds.size) return true;");
  });

  it("Save is disabled whenever the membership is not dirty (or an action is in flight)", () => {
    expect(renderMembershipEditorBlock).toContain("floorplanMembershipSaveButton.disabled = floorplanActionInFlight || !isMembershipDirty();");
  });

  it("switching Floorplan prompts only when dirty — via the shared confirmDiscardDirtyMembership guard", () => {
    expect(selectFloorplanBlock).toContain("if (!confirmDiscardDirtyMembership()) return;");
  });

  it("switching version (opening a different Draft's editor) prompts only when dirty", () => {
    expect(selectVersionBlock).toContain("if (!confirmDiscardDirtyMembership()) return;");
  });

  it("the discard-confirmation short-circuits to true (no prompt) when nothing is dirty", () => {
    expect(source).toContain("if (!isMembershipDirty()) return true;");
  });

  it("Cancel on the discard dialog is a plain early return — the caller's state (selectedFloorplanId/selectedVersionId) is untouched before that check", () => {
    const confirmIndex = selectFloorplanBlock.indexOf("if (!confirmDiscardDirtyMembership()) return;");
    const mutateIndex = selectFloorplanBlock.indexOf("selectedFloorplanId = floorplanId;");
    expect(confirmIndex).toBeGreaterThan(-1);
    expect(mutateIndex).toBeGreaterThan(confirmIndex);
  });
});

describe("Floorplannen — empty membership remains editable", () => {
  it("the membership editor's visibility depends only on the selected version's status being Draft, never on membership size", () => {
    expect(renderMembershipEditorBlock).toContain('selectedVersionDetail.version.status === "Draft"');
    expect(renderMembershipEditorBlock).not.toMatch(/tableIds\.length (>|<|===) 0/);
  });

  it("publishing an empty Draft is never blocked client-side — no NO_MEMBERS pre-check before the POST", () => {
    expect(publishBlock).not.toContain("pendingMembershipTableIds.size");
    expect(publishBlock).not.toContain("authoritativeMembershipTableIds.size");
  });
});

describe("Floorplannen — double-submit prevention", () => {
  it("runFloorplanAction refuses re-entry while an action is already in flight", () => {
    expect(runActionBlock).toContain("if (floorplanActionInFlight) return;");
  });

  it("the in-flight flag is set, and the panel re-rendered (disabling every button), BEFORE the action's own work runs", () => {
    const flagIndex = runActionBlock.indexOf("floorplanActionInFlight = true;");
    const renderIndex = runActionBlock.indexOf("renderFloorplanPanel();");
    const tryIndex = runActionBlock.indexOf("try {");
    expect(flagIndex).toBeGreaterThan(-1);
    expect(renderIndex).toBeGreaterThan(flagIndex);
    expect(tryIndex).toBeGreaterThan(renderIndex);
  });

  it("the flag is always cleared, and the panel always re-rendered, in a finally block", () => {
    expect(runActionBlock).toContain("finally {");
    expect(runActionBlock).toContain("floorplanActionInFlight = false;");
  });

  it("every conflicting control is disabled whenever the flag is set", () => {
    expect(renderFloorplanListBlock).toContain("selectButton.disabled = floorplanActionInFlight");
    expect(renderVersionListBlock).toContain("editButton.disabled = floorplanActionInFlight");
    expect(renderVersionListBlock).toContain("publishButton.disabled = floorplanActionInFlight;");
    expect(buildCheckboxRowBlock).toContain("checkbox.disabled = floorplanActionInFlight;");
    expect(renderPanelBlock).toContain("floorplanCreateDraftButton.disabled = floorplanActionInFlight;");
  });

  it("Create Floorplan, Create Draft, and Save Membership all route through the shared guard", () => {
    expect(createFloorplanBlock).toContain("runFloorplanAction(async () => {");
    expect(createDraftBlock).toContain("runFloorplanAction(async () => {");
    expect(saveMembershipBlock).toContain("runFloorplanAction(async () => {");
  });

  it("Publish, Set default, and Archive all route through the shared guard too", () => {
    expect(publishBlock).toContain("runFloorplanAction(async () => {");
    expect(setDefaultBlock).toContain("runFloorplanAction(async () => {");
    expect(archiveBlock).toContain("runFloorplanAction(async () => {");
  });
});

describe("Floorplannen — exact lifecycle endpoints and request bodies", () => {
  it("Create Floorplan posts to POST /floorplans with exactly { name }", () => {
    expect(createFloorplanBlock).toMatch(/fetch\("\/floorplans",\s*\{\s*method: "POST"/);
    expect(createFloorplanBlock).toContain("JSON.stringify({ name })");
  });

  it("Create Draft posts to POST /floorplans/:id/versions with the project's established empty-object body", () => {
    expect(createDraftBlock).toContain("fetch(`/floorplans/${encodeURIComponent(selectedFloorplanId)}/versions`");
    expect(createDraftBlock).toContain("JSON.stringify({})");
  });

  it("Publish posts to POST /floorplan-versions/:id/publish with an empty body", () => {
    expect(publishBlock).toContain("fetch(`/floorplan-versions/${encodeURIComponent(version.id)}/publish`");
    expect(publishBlock).toContain("JSON.stringify({})");
  });

  it("Set default posts to POST /floorplans/:id/default-version with exactly { versionId }", () => {
    expect(setDefaultBlock).toContain("fetch(`/floorplans/${encodeURIComponent(selectedFloorplanId)}/default-version`");
    expect(setDefaultBlock).toContain("JSON.stringify({ versionId: version.id })");
  });

  it("Archive posts to POST /floorplan-versions/:id/archive with an empty body", () => {
    expect(archiveBlock).toContain("fetch(`/floorplan-versions/${encodeURIComponent(version.id)}/archive`");
    expect(archiveBlock).toContain("JSON.stringify({})");
  });

  it("every mutation sends the CSRF header via the shared actorHeaders(), same as every other pilot mutation", () => {
    for (const block of [createFloorplanBlock, createDraftBlock, saveMembershipBlock, publishBlock, setDefaultBlock, archiveBlock]) {
      expect(block).toContain("...actorHeaders()");
    }
  });
});

describe("Floorplannen — exact Draft/Published/default/Archived action matrix", () => {
  it("Draft shows Leden bewerken and Publiceren", () => {
    const gate = renderVersionListBlock.match(/if \(v\.status === "Draft"\) \{[\s\S]*?\n {6}\} else if/);
    expect(gate).not.toBeNull();
    expect(gate![0]).toContain('"Leden bewerken"');
    expect(gate![0]).toMatch(/publishButton\.textContent = "Publiceren";/);
    expect(gate![0]).not.toContain("Als standaard instellen");
    expect(gate![0]).not.toContain('"Archiveren"');
  });

  it("Published non-default shows Als standaard instellen and Archiveren", () => {
    const gate = renderVersionListBlock.match(/else if \(v\.status === "Published" && !isDefault\) \{[\s\S]*?\n {6}\}/);
    expect(gate).not.toBeNull();
    expect(gate![0]).toContain('"Als standaard instellen"');
    expect(gate![0]).toContain('"Archiveren"');
    expect(gate![0]).not.toContain("Leden bewerken");
    expect(gate![0]).not.toContain("Publiceren");
  });

  it("Published default and Archived fall through to no action branch at all (isDefault excludes the Published branch; Archived matches neither)", () => {
    expect(renderVersionListBlock).not.toContain('v.status === "Archived"');
    expect(renderVersionListBlock).toContain('v.status === "Published" && !isDefault');
  });

  it("the current default version never renders an Archive button — isDefault is excluded from the Published branch that offers it", () => {
    const archiveOffered = renderVersionListBlock.indexOf('archiveButton.textContent = "Archiveren";');
    const branchStart = renderVersionListBlock.lastIndexOf('else if (v.status === "Published" && !isDefault)', archiveOffered);
    expect(branchStart).toBeGreaterThan(-1);
  });
});

describe("Floorplannen — confirmation ordering: Publish/Default/Archive only", () => {
  it("Publish confirms BEFORE the POST call", () => {
    const confirmIndex = publishBlock.indexOf("confirm(");
    const postIndex = publishBlock.indexOf('method: "POST"');
    expect(confirmIndex).toBeGreaterThan(-1);
    expect(postIndex).toBeGreaterThan(confirmIndex);
  });

  it("Set default confirms BEFORE the POST call", () => {
    const confirmIndex = setDefaultBlock.indexOf("confirm(");
    const postIndex = setDefaultBlock.indexOf('method: "POST"');
    expect(confirmIndex).toBeGreaterThan(-1);
    expect(postIndex).toBeGreaterThan(confirmIndex);
  });

  it("Archive confirms BEFORE the POST call", () => {
    const confirmIndex = archiveBlock.indexOf("confirm(");
    const postIndex = archiveBlock.indexOf('method: "POST"');
    expect(confirmIndex).toBeGreaterThan(-1);
    expect(postIndex).toBeGreaterThan(confirmIndex);
  });

  it("confirmation happens BEFORE the mutation-in-flight guard is engaged (confirm is outside runFloorplanAction)", () => {
    for (const block of [publishBlock, setDefaultBlock, archiveBlock]) {
      const confirmIndex = block.indexOf("confirm(");
      const guardIndex = block.indexOf("runFloorplanAction(async () => {");
      expect(confirmIndex).toBeGreaterThan(-1);
      expect(guardIndex).toBeGreaterThan(confirmIndex);
    }
  });

  it("Create Floorplan, Create Draft, and Save Membership never prompt for confirmation", () => {
    expect(createFloorplanBlock).not.toContain("confirm(");
    expect(createDraftBlock).not.toContain("confirm(");
    expect(saveMembershipBlock).not.toContain("confirm(");
  });
});

describe("Floorplannen — safe, typed outcome messages", () => {
  it("maps every documented failure outcome to a distinct, non-internal Dutch message", () => {
    for (const outcome of [
      "FLOORPLAN_NOT_FOUND",
      "VERSION_NOT_FOUND",
      "VERSION_NOT_DRAFT",
      "UNKNOWN_TABLE_IDS",
      "INVALID_TRANSITION",
      "NO_MEMBERS",
      "VERSION_NOT_PUBLISHED",
      "VERSION_BELONGS_TO_DIFFERENT_FLOORPLAN",
      "CANNOT_ARCHIVE_DEFAULT_VERSION",
    ]) {
      expect(errorMessageBlock).toContain(`case "${outcome}":`);
    }
  });

  it("every documented success outcome produces its own safe, distinct Dutch message inline at its call site", () => {
    expect(createFloorplanBlock).toContain('"Floorplan aangemaakt."');
    expect(createDraftBlock).toMatch(/Conceptversie aangemaakt \(revisie \$\{data\.version\.revision\}\)\./);
    expect(saveMembershipBlock).toMatch(/Tafeltoewijzing opgeslagen \(\$\{\(data\.tableIds \|\| \[\]\)\.length\} tafels\)\./);
    expect(publishBlock).toContain('"Versie gepubliceerd."');
    expect(setDefaultBlock).toContain('"Ingesteld als standaard floorplan."');
    expect(archiveBlock).toContain('"Versie gearchiveerd."');
  });

  it("UNKNOWN_TABLE_IDS never echoes the returned ids — only a refresh instruction", () => {
    const match = errorMessageBlock.match(/case "UNKNOWN_TABLE_IDS":\s*(return[\s\S]*?;)/);
    expect(match).not.toBeNull();
    expect(match![1]).not.toContain("data.tableIds");
    expect(match![1]).toMatch(/ververs/);
  });

  it("INVALID_TRANSITION never echoes an unvalidated raw status string", () => {
    const match = errorMessageBlock.match(/case "INVALID_TRANSITION":\s*(return[\s\S]*?;)/);
    expect(match).not.toBeNull();
    expect(match![1]).not.toContain("data.currentStatus");
    expect(match![1]).not.toContain("${data");
  });

  it("never renders a raw stack trace or exception object — every branch returns a plain string", () => {
    expect(errorMessageBlock).not.toContain("err.message");
    expect(errorMessageBlock).not.toContain("err.stack");
  });

  it("every mutation shows the mapped message via the shared showMessage(), on the panel's own message element", () => {
    for (const block of [createFloorplanBlock, createDraftBlock, saveMembershipBlock, publishBlock, setDefaultBlock, archiveBlock]) {
      expect(block).toContain("showMessage(floorplanMessage, floorplanMutationErrorMessage(data, res), \"error\");");
    }
  });
});

describe("Floorplannen — 401/403 handling", () => {
  it("a 401/403 on any read is handled before the generic !res.ok branch, with its own message, and keeps the section visible", () => {
    for (const block of [loadPanelBlock, loadVersionsBlock, loadDetailBlock]) {
      const check401 = block.indexOf("status === 401 || ");
      const genericCheck = block.indexOf("if (!");
      expect(check401).toBeGreaterThan(-1);
      expect(genericCheck).toBeGreaterThan(check401);
    }
    expect(source).not.toContain("floorplanVersionSection.style.display = \"none\";\n  }\n\n  describe");
  });

  it("a 401/403 on any mutation is mapped to a clear, generic permission message, not a raw status code", () => {
    expect(errorMessageBlock).toContain('if (res.status === 401 || res.status === 403) return "Je hebt geen rechten om deze actie uit te voeren.";');
  });

  it("no permission name, role, or capability string is hardcoded anywhere in this panel", () => {
    expect(wholeFloorplanScript).not.toMatch(/Owner|Manager|AssistantManager|Supervisor|ReservationAgent|CapacitySettingsManage|CAP-D03\.02/);
  });

  it("the panel is never hidden wholesale based on a guessed client-side permission — only its message area changes", () => {
    expect(wholeFloorplanScript).not.toMatch(/floorplanVersionSection\.style\.display = "none";\s*\n\s*(showMessage|return);?\s*\n\s*\}\s*\n\s*if \(res\.status/);
    // The panel's own <section> is never toggled at all by this script.
    expect(wholeFloorplanScript).not.toContain('document.getElementById("floorplan-message").closest');
  });
});

describe("Floorplannen — refresh after every successful mutation", () => {
  it("Create Floorplan reloads the whole panel (Floorplans + inventory) on success", () => {
    expect(createFloorplanBlock).toContain("await loadFloorplanPanel();");
  });

  it("Create Draft reloads the version list for the affected Floorplan on success", () => {
    expect(createDraftBlock).toContain("await loadFloorplanVersions();");
  });

  it("Save Membership reloads versions (resetting the authoritative baseline via loadSelectedVersionDetail) on success", () => {
    expect(saveMembershipBlock).toContain("await loadFloorplanVersions();");
  });

  it("Publish and Archive reload the version list on success", () => {
    expect(publishBlock).toContain("await loadFloorplanVersions();");
    expect(archiveBlock).toContain("await loadFloorplanVersions();");
  });

  it("Set default reloads the whole panel (the Floorplan's defaultVersionId changed) on success", () => {
    expect(setDefaultBlock).toContain("await loadFloorplanPanel();");
  });

  it("a successful Save's refresh resets the authoritative membership baseline via loadSelectedVersionDetail, called from loadFloorplanVersions", () => {
    expect(loadVersionsBlock).toContain("await loadSelectedVersionDetail();");
    expect(loadDetailBlock).toContain("authoritativeMembershipTableIds = new Set(data.tableIds || []);");
    expect(loadDetailBlock).toContain("pendingMembershipTableIds = new Set(authoritativeMembershipTableIds);");
  });

  it("a refresh failure after a successful mutation still shows a separate warning rather than silently leaving stale data", () => {
    // floorplanRefreshMessage is a SEPARATE element from floorplanMessage
    // (which mutation success/failure is shown on) — every load function
    // reads/writes ONLY floorplanRefreshMessage for its own outcome, so a
    // reload failure can never overwrite a just-shown mutation success.
    expect(source).toContain('id="floorplan-refresh-message"');
    expect(source).toContain('const floorplanRefreshMessage = document.getElementById("floorplan-refresh-message");');
    for (const block of [loadPanelBlock, loadVersionsBlock, loadDetailBlock]) {
      expect(block).not.toContain("floorplanMessage,");
      expect(block).toMatch(/showMessage\(floorplanRefreshMessage,.*"error"\)/);
      expect(block).toContain("clearMessage(floorplanRefreshMessage)");
    }
  });

  it("mutation success/failure messages are shown on floorplanMessage, never on floorplanRefreshMessage", () => {
    for (const block of [createFloorplanBlock, createDraftBlock, saveMembershipBlock, publishBlock, setDefaultBlock, archiveBlock]) {
      expect(block).not.toContain("floorplanRefreshMessage");
    }
  });
});

describe("Initialization and existing features — unaffected", () => {
  it("every other existing initApp() loader is still present", () => {
    expect(initAppBlock).toContain("loadClosingDays();");
    expect(initAppBlock).toContain("loadResourceBlocks();");
    expect(initAppBlock).toContain("loadOccupancy();");
    expect(initAppBlock).toContain("loadSecurityEvents();");
  });

  it("Servicesessies, Sluitingsdagen, and the reservation-status badge are all still present, untouched by this addition", () => {
    expect(source).toContain("<h2>Servicesessies</h2>");
    expect(source).toContain('<form id="closing-day-form">');
    expect(source).toContain('class="status status-${r.status}"');
  });

  it("composes only the ten already-authorized Floorplan/inventory contracts — no new backend surface is referenced", () => {
    const fetchTargets = wholeFloorplanScript.match(/fetch\(`?\/(floorplans|floorplan-versions|floorplan-resources)[^`)]*`?/g) || [];
    expect(fetchTargets.length).toBeGreaterThan(0);
    for (const target of fetchTargets) {
      expect(target).toMatch(/^fetch\(`?\/(floorplans|floorplan-versions|floorplan-resources)/);
    }
  });
});
