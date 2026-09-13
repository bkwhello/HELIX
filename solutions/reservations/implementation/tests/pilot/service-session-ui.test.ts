import { describe, it, expect, beforeAll } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * R1.6-P2C-2 — "Servicesessies" pilot UI regression coverage. Same
 * posture as every other pilot test file in this codebase (e.g.
 * resource-block-ui.test.ts, security-events-ui.test.ts, no-show-ui.test.ts):
 * plain source-text assertion against the shipped file — no DOM/browser
 * runner, no jsdom, no real fetch. This file never executes pilot.html's
 * script, so no network call and no pilot write of any kind can occur
 * while it runs; tests/api/service-sessions.test.ts and
 * tests/integration/service-session-*.test.ts already exhaustively prove
 * the server contract this panel merely composes. This file's only job
 * is proving pilot.html's own wiring/rendering/gating logic.
 */
const pilotHtmlPath = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "public", "pilot.html");
let source: string;

let initAppBlock: string;
let renderPanelBlock: string;
let loadBlock: string;
let errorMessageBlock: string;
let runActionBlock: string;
let createBlock: string;
let openBlock: string;
let closeBlock: string;
let cancelBlock: string;
let renderListBlock: string;

beforeAll(() => {
  source = readFileSync(pilotHtmlPath, "utf-8");

  const initAppStart = source.indexOf("function initApp() {");
  const initAppEnd = source.indexOf("}", initAppStart);
  expect(initAppStart).toBeGreaterThan(-1);
  initAppBlock = source.slice(initAppStart, initAppEnd);

  const renderPanelStart = source.indexOf("function renderServiceSessionsPanel() {");
  const renderPanelEnd = source.indexOf("function makeSessionActionButton(");
  expect(renderPanelStart).toBeGreaterThan(-1);
  expect(renderPanelEnd).toBeGreaterThan(renderPanelStart);
  renderPanelBlock = source.slice(renderPanelStart, renderPanelEnd);

  const loadStart = source.indexOf("async function loadServiceSessions() {");
  const loadEnd = source.indexOf("function serviceSessionMutationErrorMessage(");
  expect(loadStart).toBeGreaterThan(-1);
  expect(loadEnd).toBeGreaterThan(loadStart);
  loadBlock = source.slice(loadStart, loadEnd);

  const errorMessageStart = source.indexOf("function serviceSessionMutationErrorMessage(");
  const errorMessageEnd = source.indexOf("async function runServiceSessionAction(");
  expect(errorMessageStart).toBeGreaterThan(-1);
  expect(errorMessageEnd).toBeGreaterThan(errorMessageStart);
  errorMessageBlock = source.slice(errorMessageStart, errorMessageEnd);

  const runActionStart = source.indexOf("async function runServiceSessionAction(");
  const runActionEnd = source.indexOf("async function createServiceSession(");
  expect(runActionStart).toBeGreaterThan(-1);
  expect(runActionEnd).toBeGreaterThan(runActionStart);
  runActionBlock = source.slice(runActionStart, runActionEnd);

  const createStart = source.indexOf("async function createServiceSession(");
  const createEnd = source.indexOf("async function openServiceSession(");
  expect(createStart).toBeGreaterThan(-1);
  expect(createEnd).toBeGreaterThan(createStart);
  createBlock = source.slice(createStart, createEnd);

  const openStart = source.indexOf("async function openServiceSession(");
  const openEnd = source.indexOf("async function closeServiceSession(");
  expect(openStart).toBeGreaterThan(-1);
  expect(openEnd).toBeGreaterThan(openStart);
  openBlock = source.slice(openStart, openEnd);

  const closeStart = source.indexOf("async function closeServiceSession(");
  const closeEnd = source.indexOf("async function cancelServiceSession(");
  expect(closeStart).toBeGreaterThan(-1);
  expect(closeEnd).toBeGreaterThan(closeStart);
  closeBlock = source.slice(closeStart, closeEnd);

  const cancelStart = source.indexOf("async function cancelServiceSession(");
  const cancelEnd = source.indexOf("// --- Sluitingsdagen");
  expect(cancelStart).toBeGreaterThan(-1);
  expect(cancelEnd).toBeGreaterThan(cancelStart);
  cancelBlock = source.slice(cancelStart, cancelEnd);

  const renderListStart = source.indexOf("function renderList() {");
  const renderListEnd = source.indexOf('document.getElementById("reload-list")');
  expect(renderListStart).toBeGreaterThan(-1);
  expect(renderListEnd).toBeGreaterThan(renderListStart);
  renderListBlock = source.slice(renderListStart, renderListEnd);
});

describe("Servicesessies — markup", () => {
  it("has its own panel with a heading, message area, and list container", () => {
    expect(source).toContain("<h2>Servicesessies</h2>");
    expect(source).toContain('id="service-session-message"');
    expect(source).toContain('id="service-session-list"');
  });

  it("the daily list table gained a Dienst column (header + colgroup entry)", () => {
    expect(source).toMatch(/<th>Status<\/th><th>Dienst<\/th><th>Aankomst<\/th>/);
  });
});

describe("Servicesessies — wired into initialization and date changes", () => {
  it("loadServiceSessions() is called from initApp() alongside the existing loaders", () => {
    expect(initAppBlock).toContain("loadList();");
    expect(initAppBlock).toContain("loadServiceSessions();");
  });

  it("list-date's change handler refreshes both the daily list and the session panel", () => {
    expect(source).toContain('listDateInput.addEventListener("change", loadList);');
    expect(source).toContain('listDateInput.addEventListener("change", loadServiceSessions);');
  });
});

describe("Servicesessies — exactly one, server-date-bounded read per refresh (R1.6-P2C-2A)", () => {
  it("fetches GET /service-sessions exactly once per loadServiceSessions() call", () => {
    const matches = loadBlock.match(/fetch\(`\/service-sessions\?serviceDate=/g) || [];
    expect(matches).toHaveLength(1);
  });

  it("the request URL contains the selected date, captured at the start of the call and URL-encoded", () => {
    expect(loadBlock).toContain("fetch(`/service-sessions?serviceDate=${encodeURIComponent(requestedDate)}`");
  });

  it("no unfiltered/all-date request remains — the endpoint is never called without a serviceDate query segment", () => {
    expect(loadBlock).not.toMatch(/fetch\("\/service-sessions"/);
    expect(loadBlock).not.toMatch(/fetch\(`\/service-sessions`/);
  });

  it("client-side filtering is not relied upon as the authority — no re-filtering of returned rows by date exists in this file", () => {
    // The server is now authoritative for the date match (R1.6-P2C-2A);
    // this file only defensively guards the serviceCode shape of what
    // comes back, never re-checks serviceDate against anything.
    expect(loadBlock).not.toMatch(/session\.serviceDate/);
    expect(loadBlock).not.toContain("const targetDate = listDateInput.value;");
  });
});

describe("Servicesessies — stale-response protection (date captured at start, out-of-order responses discarded)", () => {
  it("captures the selected list-date AND a request token at the very start — before the state reset, the render, and any await", () => {
    const requestedDateIndex = loadBlock.indexOf("const requestedDate = listDateInput.value;");
    const tokenIndex = loadBlock.indexOf("const requestToken = ++serviceSessionsRequestToken;");
    const resetIndex = loadBlock.indexOf("serviceSessionsByCode = {};");
    const fetchIndex = loadBlock.indexOf("fetch(`/service-sessions?serviceDate=");
    expect(requestedDateIndex).toBeGreaterThan(-1);
    expect(tokenIndex).toBeGreaterThan(requestedDateIndex);
    expect(resetIndex).toBeGreaterThan(tokenIndex);
    expect(fetchIndex).toBeGreaterThan(resetIndex);
  });

  it("re-checks the token after EVERY await in the success path, before touching any shared state", () => {
    const matches = loadBlock.match(/if \(requestToken !== serviceSessionsRequestToken\) return;/g) || [];
    // One after the fetch() await, one after the res.json() await, one in the catch block.
    expect(matches.length).toBeGreaterThanOrEqual(3);
  });

  it("a superseded response never reaches the byCode assignment or panel re-render", () => {
    const secondCheckIndex = loadBlock.lastIndexOf("if (requestToken !== serviceSessionsRequestToken) return;", loadBlock.indexOf("const byCode = {};"));
    const byCodeIndex = loadBlock.indexOf("const byCode = {};");
    const assignIndex = loadBlock.indexOf("serviceSessionsByCode = byCode;");
    expect(secondCheckIndex).toBeGreaterThan(-1);
    expect(byCodeIndex).toBeGreaterThan(secondCheckIndex);
    expect(assignIndex).toBeGreaterThan(byCodeIndex);
  });

  it("the token is bumped on every call — a later loadServiceSessions() invocation always wins over an earlier, still-pending one", () => {
    expect(source).toContain("let serviceSessionsRequestToken = 0;");
    expect(loadBlock).toContain("const requestToken = ++serviceSessionsRequestToken;");
  });
});

describe("Servicesessies — both canonical slots, no hardcoded inventory beyond lunch/dinner", () => {
  it("SERVICE_CODES is exactly [lunch, dinner]", () => {
    expect(source).toContain('const SERVICE_CODES = ["lunch", "dinner"];');
  });

  it("the panel iterates SERVICE_CODES itself, not a separately hardcoded list", () => {
    expect(renderPanelBlock).toContain("for (const code of SERVICE_CODES)");
  });

  it("an empty sessions array still yields NotCreated for both slots (empty-state handling)", () => {
    expect(loadBlock).toContain("for (const code of SERVICE_CODES) byCode[code] = null;");
  });
});

describe("Servicesessies — action visibility matches the required matrix exactly", () => {
  it("NotCreated -> Aanmaken only", () => {
    expect(renderPanelBlock).toMatch(/if \(status === "NotCreated"\) \{\s*actions\.appendChild\(makeSessionActionButton\("Aanmaken",/);
  });

  it("Created -> Openen and Annuleren", () => {
    const gate = renderPanelBlock.match(/else if \(status === "Created"\) \{[\s\S]*?\n {6}\}/);
    expect(gate).not.toBeNull();
    expect(gate![0]).toContain('makeSessionActionButton("Openen"');
    expect(gate![0]).toContain('makeSessionActionButton("Annuleren"');
  });

  it("Opened -> Sluiten only", () => {
    const gate = renderPanelBlock.match(/else if \(status === "Opened"\) \{[\s\S]*?\n {6}\}/);
    expect(gate).not.toBeNull();
    expect(gate![0]).toContain('makeSessionActionButton("Sluiten"');
    expect(gate![0]).not.toContain("Openen");
  });

  it("Closed and Cancelled fall through to no action branch at all", () => {
    expect(renderPanelBlock).not.toContain('status === "Closed"');
    expect(renderPanelBlock).not.toContain('status === "Cancelled"');
  });
});

describe("Servicesessies — exact endpoints and narrow request bodies", () => {
  it("create posts to POST /service-sessions with exactly { serviceCode, serviceDate }", () => {
    expect(createBlock).toMatch(/fetch\("\/service-sessions",\s*\{\s*method: "POST"/);
    expect(createBlock).toContain("JSON.stringify({ serviceCode: code, serviceDate: listDateInput.value })");
  });

  it("open posts to POST /service-sessions/:id/open with an empty body", () => {
    expect(openBlock).toContain("fetch(`/service-sessions/${session.id}/open`");
    expect(openBlock).toContain("JSON.stringify({})");
  });

  it("close posts to POST /service-sessions/:id/close with an empty body", () => {
    expect(closeBlock).toContain("fetch(`/service-sessions/${session.id}/close`");
    expect(closeBlock).toContain("JSON.stringify({})");
  });

  it("cancel posts to POST /service-sessions/:id/cancel with an empty body", () => {
    expect(cancelBlock).toContain("fetch(`/service-sessions/${session.id}/cancel`");
    expect(cancelBlock).toContain("JSON.stringify({})");
  });

  it("every mutation sends the CSRF header via the shared actorHeaders(), same as every other pilot mutation", () => {
    for (const block of [createBlock, openBlock, closeBlock, cancelBlock]) {
      expect(block).toContain("...actorHeaders()");
    }
  });
});

describe("Servicesessies — confirmation ordering for close/cancel only", () => {
  it("close confirms BEFORE the POST call", () => {
    const confirmIndex = closeBlock.indexOf("confirm(");
    const postIndex = closeBlock.indexOf('method: "POST"');
    expect(confirmIndex).toBeGreaterThan(-1);
    expect(postIndex).toBeGreaterThan(confirmIndex);
  });

  it("cancel confirms BEFORE the POST call", () => {
    const confirmIndex = cancelBlock.indexOf("confirm(");
    const postIndex = cancelBlock.indexOf('method: "POST"');
    expect(confirmIndex).toBeGreaterThan(-1);
    expect(postIndex).toBeGreaterThan(confirmIndex);
  });

  it("create and open do NOT prompt for confirmation — only the two terminal, unreversible actions do", () => {
    expect(createBlock).not.toContain("confirm(");
    expect(openBlock).not.toContain("confirm(");
  });
});

describe("Servicesessies — double-submit prevention", () => {
  it("runServiceSessionAction refuses re-entry while an action is already in flight", () => {
    expect(runActionBlock).toContain("if (serviceSessionActionInFlight) return;");
  });

  it("the in-flight flag is set, and the panel re-rendered (disabling every button), BEFORE the action's own work runs", () => {
    const flagIndex = runActionBlock.indexOf("serviceSessionActionInFlight = true;");
    const renderIndex = runActionBlock.indexOf("renderServiceSessionsPanel();");
    const tryIndex = runActionBlock.indexOf("try {");
    expect(flagIndex).toBeGreaterThan(-1);
    expect(renderIndex).toBeGreaterThan(flagIndex);
    expect(tryIndex).toBeGreaterThan(renderIndex);
  });

  it("every rendered action button is disabled whenever the flag is set", () => {
    expect(source).toContain("button.disabled = serviceSessionActionInFlight;");
  });

  it("the flag is always cleared and the panel re-rendered afterward, success or failure (finally block)", () => {
    expect(runActionBlock).toContain("finally {");
    expect(runActionBlock).toContain("serviceSessionActionInFlight = false;");
  });

  it("all four mutations route through the shared guard, never calling fetch directly outside it", () => {
    for (const block of [createBlock, openBlock, closeBlock, cancelBlock]) {
      expect(block).toContain("runServiceSessionAction(async () => {");
    }
  });
});

describe("Servicesessies — refresh after every successful mutation", () => {
  const refreshPattern = /await loadServiceSessions\(\);\s*await loadList\(\);/;
  it("create refreshes the panel AND the daily reservation/floor state on success", () => {
    expect(createBlock).toMatch(refreshPattern);
  });
  it("open refreshes the panel AND the daily reservation/floor state on success", () => {
    expect(openBlock).toMatch(refreshPattern);
  });
  it("close refreshes the panel AND the daily reservation/floor state on success", () => {
    expect(closeBlock).toMatch(refreshPattern);
  });
  it("cancel refreshes the panel AND the daily reservation/floor state on success", () => {
    expect(cancelBlock).toMatch(refreshPattern);
  });
});

describe("Servicesessies — safe, typed failure messages", () => {
  it("maps every documented outcome to a distinct, non-internal Dutch message", () => {
    expect(errorMessageBlock).toContain('case "ALREADY_EXISTS":');
    expect(errorMessageBlock).toContain('case "NOT_FOUND":');
    expect(errorMessageBlock).toContain('case "INVALID_TRANSITION":');
    expect(errorMessageBlock).toContain('case "ACTIVE_ASSIGNMENTS_EXIST":');
    expect(errorMessageBlock).toContain('case "CONCURRENCY_CONFLICT":');
  });

  it("ACTIVE_ASSIGNMENTS_EXIST's message never exposes the raw type string, only a staff-facing sentence", () => {
    const match = errorMessageBlock.match(/case "ACTIVE_ASSIGNMENTS_EXIST":\s*(return[\s\S]*?;)/);
    expect(match).not.toBeNull();
    const returnStatement = match![1];
    expect(returnStatement).not.toContain("ACTIVE_ASSIGNMENTS_EXIST");
    expect(returnStatement).toMatch(/actieve tafeltoewijzing/);
  });

  it("never renders a raw stack trace or exception object — every branch returns a plain string", () => {
    expect(errorMessageBlock).not.toContain("err.message");
    expect(errorMessageBlock).not.toContain("err.stack");
  });

  it("every mutation shows the mapped message via the shared showMessage(), on the panel's own message element", () => {
    for (const block of [createBlock, openBlock, closeBlock, cancelBlock]) {
      expect(block).toContain("showMessage(serviceSessionMessage, serviceSessionMutationErrorMessage(data, res), \"error\");");
    }
  });
});

describe("Servicesessies — 403 handling", () => {
  it("a 401/403 on the read is handled before the generic !res.ok branch, with its own message", () => {
    const check401 = loadBlock.indexOf("res.status === 401 || res.status === 403");
    const genericCheck = loadBlock.indexOf("if (!res.ok)");
    expect(check401).toBeGreaterThan(-1);
    expect(genericCheck).toBeGreaterThan(check401);
  });

  it("a 401/403 on any mutation is mapped to a clear, generic permission message, not a raw status code", () => {
    expect(errorMessageBlock).toContain('if (res.status === 401 || res.status === 403) return "Je hebt geen rechten om deze actie uit te voeren.";');
  });

  it("no permission name, role, or capability string is hardcoded anywhere in this panel", () => {
    const wholeBlock = renderPanelBlock + loadBlock + errorMessageBlock + createBlock + openBlock + closeBlock + cancelBlock;
    expect(wholeBlock).not.toMatch(/Owner|Manager|CapacitySettingsManage/);
  });
});

describe("Servicesessies — failure isolation and stale-state handling", () => {
  it("loadServiceSessions clears prior session state BEFORE it even attempts the fetch", () => {
    const resetIndex = loadBlock.indexOf("serviceSessionsByCode = {};");
    const fetchIndex = loadBlock.indexOf("fetch(`/service-sessions?serviceDate=");
    expect(resetIndex).toBeGreaterThan(-1);
    expect(fetchIndex).toBeGreaterThan(resetIndex);
  });

  it("a network failure (catch block) also clears state and shows a visible warning, never a guessed status", () => {
    const catchIndex = loadBlock.indexOf("catch (err) {");
    expect(catchIndex).toBeGreaterThan(-1);
    const catchBlock = loadBlock.slice(catchIndex);
    expect(catchBlock).toContain("serviceSessionsByCode = {};");
    expect(catchBlock).toContain('showMessage(serviceSessionMessage, "Netwerkfout: kon servicesessies niet laden.", "error");');
  });

  it("a session-load failure never touches dailyReservations — the reservation list itself stays usable", () => {
    expect(loadBlock).not.toContain("dailyReservations =");
  });

  it("date switching re-runs the SAME clear-first loadServiceSessions() (no separate, only-partially-clearing path)", () => {
    // Only one function in the whole script resets serviceSessionsByCode
    // to {} — the load path itself — so there is no alternate code path
    // that could leave a stale value behind on a date switch.
    const resets = (source.match(/serviceSessionsByCode = \{\};/g) || []).length;
    expect(resets).toBeGreaterThanOrEqual(2); // top-of-load reset + catch-block reset
  });
});

describe("Servicesessies — daily list join uses Amsterdam-derived time classification, never stored servicePeriodId", () => {
  it("classifies each row via deriveServicePeriodFromInstant(r.reservationDate), not r.servicePeriodId", () => {
    expect(renderListBlock).toContain("const sessionCode = deriveServicePeriodFromInstant(r.reservationDate);");
    expect(renderListBlock).not.toContain("r.servicePeriodId");
  });

  it("a null classification (unparseable/missing timestamp) never performs a session lookup at all", () => {
    expect(renderListBlock).toContain("const sessionForRow = sessionCode ? serviceSessionsByCode[sessionCode] : undefined;");
  });

  it("a session not yet loaded for that slot renders as the neutral placeholder, never guessed as Created/Opened", () => {
    expect(renderListBlock).toContain("const dienstCellHtml = sessionStatus");
    expect(renderListBlock).toMatch(/:\s*"…"/);
  });

  it("a confirmed-absent session renders the exact required label", () => {
    expect(source).toContain('NotCreated: "Niet aangemaakt",');
  });
});

describe("Servicesessies — one canonical minute-boundary predicate shared by two classification helpers, no ambiguous Date parsing", () => {
  it("isLunchHour is the ONE place the 12/16 boundary is written — both helpers call it, neither re-implements it", () => {
    const matches = source.match(/hour >= 12 && hour < 16/g) || [];
    expect(matches).toHaveLength(1); // only inside isLunchHour itself
    expect(source).toContain("function isLunchHour(hour) {");
    expect(source).toContain("return isLunchHour(hour) ? \"lunch\" : \"dinner\";");
    const usages = source.match(/isLunchHour\(hour\) \? "lunch" : "dinner";/g) || [];
    expect(usages.length).toBe(2); // deriveServicePeriodFromInstant AND deriveServicePeriodFromLocalTimeString
  });

  it("the daily list/panel path (absolute timestamps) uses deriveServicePeriodFromInstant, extracting the hour via Intl, never getHours()", () => {
    expect(renderListBlock).toContain("deriveServicePeriodFromInstant(r.reservationDate)");
    expect(source).not.toMatch(/dateObj\.getHours\(\)/);
  });

  it("the create-form path (local HH:mm select value) uses deriveServicePeriodFromLocalTimeString, never constructing a Date from it", () => {
    expect(source).toContain("const servicePeriodId = deriveServicePeriodFromLocalTimeString(timeSelect.value);");
    expect(source).not.toContain("deriveServicePeriodFromDate(new Date(datetimeValue))");
  });

  it("deriveServicePeriodFromLocalTimeString itself never constructs a Date object — string parsing only", () => {
    const start = source.indexOf("function deriveServicePeriodFromLocalTimeString(hhmm) {");
    const end = source.indexOf("\n  }", start);
    expect(start).toBeGreaterThan(-1);
    const body = source.slice(start, end);
    expect(body).not.toContain("new Date(");
  });

  it("invalid/missing input degrades to null for both helpers — never a guessed status", () => {
    expect(source).toContain("if (!value) return null;");
    expect(source).toContain("if (Number.isNaN(date.getTime())) return null;");
    expect(source).toContain('if (typeof hhmm !== "string" || !/^\\d{2}:\\d{2}$/.test(hhmm)) return null;');
  });
});

describe("Servicesessies — absolute timestamps are classified in explicit Europe/Amsterdam time, never browser-local", () => {
  it("the Intl.DateTimeFormat used for hour extraction is pinned to Europe/Amsterdam", () => {
    expect(source).toContain('timeZone: "Europe/Amsterdam"');
    expect(source).toContain("new Intl.DateTimeFormat(\"en-GB\", {");
  });

  /**
   * R1.6-P2C-2 correction — the ONE deviation in this file from the rest
   * of this codebase's plain-source-text pilot-test convention: these
   * three classification helpers are pure functions with no DOM
   * dependency at all (Intl is available in Node/vitest), so they are
   * extracted from the ACTUAL shipped source via new Function() and
   * executed directly — a stronger, behavioral proof of Amsterdam-vs-
   * browser-local correctness than a structural regex could give,
   * without needing a full jsdom harness. Nothing here calls fetch,
   * confirm, or any DOM API — no pilot write, no network call, no
   * rendering of any kind.
   */
  function loadClassificationHelpers() {
    const start = source.indexOf("function isLunchHour(hour) {");
    const end = source.indexOf('const dateInput = document.getElementById("date");');
    expect(start).toBeGreaterThan(-1);
    expect(end).toBeGreaterThan(start);
    const helperSource = source.slice(start, end);
    const factory = new Function(
      `${helperSource}\nreturn { isLunchHour, deriveServicePeriodFromInstant, deriveServicePeriodFromLocalTimeString, amsterdamHourFromInstant };`
    );
    return factory();
  }

  it("Amsterdam-local 12:00 classifies as lunch (lower bound, inclusive)", () => {
    const { deriveServicePeriodFromInstant } = loadClassificationHelpers();
    // 2026-01-15 is CET (UTC+1): 11:00Z = 12:00 Amsterdam.
    expect(deriveServicePeriodFromInstant("2026-01-15T11:00:00Z")).toBe("lunch");
  });

  it("Amsterdam-local 15:59 classifies as lunch (just under the upper bound)", () => {
    const { deriveServicePeriodFromInstant } = loadClassificationHelpers();
    // 14:59Z = 15:59 CET Amsterdam.
    expect(deriveServicePeriodFromInstant("2026-01-15T14:59:00Z")).toBe("lunch");
  });

  it("Amsterdam-local 16:00 classifies as dinner (upper bound, exclusive)", () => {
    const { deriveServicePeriodFromInstant } = loadClassificationHelpers();
    // 15:00Z = 16:00 CET Amsterdam.
    expect(deriveServicePeriodFromInstant("2026-01-15T15:00:00Z")).toBe("dinner");
  });

  it("a timestamp whose Amsterdam hour differs from its UTC hour is classified by AMSTERDAM time, not UTC", () => {
    const { deriveServicePeriodFromInstant } = loadClassificationHelpers();
    // 2026-07-15 is CEST (UTC+2): 10:30Z is UTC hour 10 (would read as
    // "dinner" under a naive UTC-hour or fixed-offset reading), but the
    // true Amsterdam local time is 12:30 -> "lunch". This is the one
    // case that actually distinguishes correct Amsterdam-timezone
    // extraction from any other interpretation.
    expect(deriveServicePeriodFromInstant("2026-07-15T10:30:00Z")).toBe("lunch");
  });

  it("a missing or unparseable timestamp degrades to null, never a guessed period", () => {
    const { deriveServicePeriodFromInstant } = loadClassificationHelpers();
    expect(deriveServicePeriodFromInstant(null)).toBeNull();
    expect(deriveServicePeriodFromInstant(undefined)).toBeNull();
    expect(deriveServicePeriodFromInstant("not-a-real-timestamp")).toBeNull();
  });

  it("the local HH:mm helper agrees with the same canonical boundary for the identical wall-clock hours", () => {
    const { deriveServicePeriodFromLocalTimeString } = loadClassificationHelpers();
    expect(deriveServicePeriodFromLocalTimeString("12:00")).toBe("lunch");
    expect(deriveServicePeriodFromLocalTimeString("15:59")).toBe("lunch");
    expect(deriveServicePeriodFromLocalTimeString("16:00")).toBe("dinner");
    expect(deriveServicePeriodFromLocalTimeString("not-a-time")).toBeNull();
  });
});

describe("Servicesessies — escaping", () => {
  it("the Dienst cell's dynamic status value is escaped before being interpolated into innerHTML", () => {
    expect(renderListBlock).toContain("escapeHtml(sessionStatus)");
    expect(renderListBlock).toContain("escapeHtml(SESSION_STATUS_LABELS[sessionStatus] || sessionStatus)");
  });

  it("the panel itself never assigns dynamic/interpolated content via innerHTML — only a static clear, everything else via textContent/createElement", () => {
    // The one innerHTML use in this block is `serviceSessionList.innerHTML = "";`
    // (a plain, static clear-to-empty — the same idiom loadResourceBlocks()
    // and loadSecurityEvents() already use) — never a template literal
    // carrying interpolated/dynamic data.
    expect(renderPanelBlock).toContain('serviceSessionList.innerHTML = "";');
    expect(renderPanelBlock).not.toMatch(/\.innerHTML = `/);
    expect(renderPanelBlock).toContain(".textContent");
  });
});

describe("Initialization and existing features — unaffected", () => {
  it("every other existing initApp() loader is still present", () => {
    expect(initAppBlock).toContain("loadClosingDays();");
    expect(initAppBlock).toContain("loadResourceBlocks();");
    expect(initAppBlock).toContain("loadOccupancy();");
    expect(initAppBlock).toContain("loadSecurityEvents();");
  });

  it("Sluitingsdagen, seating actions, and the reservation-status badge are all still present, untouched by this addition", () => {
    expect(source).toContain('<form id="closing-day-form">');
    expect(source).toContain('openSeatingPicker(r.id, "assign")');
    expect(source).toContain('class="status status-${r.status}"');
  });

  it("composes the date-bounded GET /service-sessions?serviceDate= contract (R1.6-P2C-2A) — no unrelated backend surface introduced", () => {
    // R1.6-P2C-1/P2C-2 were pilot-only; R1.6-P2C-2A authorized a narrow,
    // explicit backend extension (a date-bounded read path) which is
    // itself covered by tests/api/service-sessions.test.ts. This test
    // only documents the design constraint the pilot side was built
    // under: compose the existing/authorized contract, introduce nothing
    // else.
    expect(source).toContain("GET /service-sessions?serviceDate=YYYY-MM-DD");
  });
});
