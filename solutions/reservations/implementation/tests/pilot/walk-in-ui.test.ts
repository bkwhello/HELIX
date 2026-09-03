import { describe, it, expect, beforeAll } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * P1-B3 — "Walk-in nu" pilot UI regression coverage.
 *
 * There is no DOM/browser test runner anywhere in this codebase (no
 * jsdom/happy-dom/playwright dependency, no prior pilot.html test file —
 * confirmed by search before writing this file) — public/pilot.html is a
 * single static file with an inline <script>, exercised only by hand
 * during pilot use. Adding a new DOM-testing dependency is out of scope
 * for this increment ("smallest appropriate... supported by the EXISTING
 * test architecture" — the assignment's own words), so this file takes
 * the smallest approach that architecture actually supports: plain
 * source-text assertions against the real, shipped file, scoped tightly
 * to the exact walk-in submit-handler block this phase added (isolated
 * below by its own known start/end markers) so a match can't accidentally
 * come from an unrelated part of the page. This proves the page's source
 * has the right shape (right endpoint, right fields, right guards, right
 * outcome strings) — it does not execute the code in a browser. That
 * gap is real and is called out explicitly in the P1-B3 report.
 *
 * tests/api/walk-in.test.ts already exhaustively proves the SERVER
 * contract this page calls (permission, narrow body, three outcomes,
 * idempotency, etc.) — this file's only job is proving pilot.html wires
 * up to that already-proven contract correctly, not re-proving the
 * contract itself.
 */
const pilotHtmlPath = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "public", "pilot.html");
let source: string;
let walkinBlock: string;
let walkinFormHtml: string;

beforeAll(() => {
  source = readFileSync(pilotHtmlPath, "utf-8");

  const blockStart = source.indexOf('const walkinForm = document.getElementById("walkin-form");');
  const blockEnd = source.indexOf('const listDateInput = document.getElementById("list-date");');
  expect(blockStart).toBeGreaterThan(-1);
  expect(blockEnd).toBeGreaterThan(blockStart);
  walkinBlock = source.slice(blockStart, blockEnd);

  const formStart = source.indexOf('<form id="walkin-form"');
  const formEnd = source.indexOf("</form>", formStart);
  expect(formStart).toBeGreaterThan(-1);
  walkinFormHtml = source.slice(formStart, formEnd);
});

describe("Walk-in nu — a clearly separate section from the ordinary reservation form", () => {
  it("is its own <form>/<section>, distinct from #create-form", () => {
    expect(source).toContain('<h2>Walk-in nu</h2>');
    expect(source).toContain('<form id="walkin-form"');
    expect(source).not.toContain('id="create-form" id="walkin-form"');
  });
});

describe("Walk-in nu — request contract", () => {
  it("sends the dedicated endpoint, not the ordinary reservation route", () => {
    expect(walkinBlock).toContain('fetch("/availability/reservations/walk-in"');
    expect(walkinBlock).not.toMatch(/fetch\("\/availability\/reservations",/);
  });

  it("requires a name (client-side and server-side guard both present)", () => {
    expect(walkinFormHtml).toMatch(/<input id="walkin-name" type="text" required/);
    expect(walkinBlock).toContain("Naam is verplicht.");
  });

  it("requires a party size", () => {
    expect(walkinFormHtml).toMatch(/<input id="walkin-party-size" type="number" min="1" value="2" required/);
  });

  it("requires an area (Sushi or Teppanyaki)", () => {
    expect(walkinFormHtml).toMatch(/<select id="walkin-area" required>/);
    expect(walkinFormHtml).toContain('<option value="Sushi">Sushi</option>');
    expect(walkinFormHtml).toContain('<option value="Teppanyaki">Teppanyaki</option>');
    expect(walkinBlock).toContain("Kies een ruimte.");
  });

  it("phone is optional — not a required input, and omitted from the body when blank", () => {
    const phoneInputTag = walkinFormHtml.match(/<input id="walkin-phone"[^>]*>/)?.[0] ?? "";
    expect(phoneInputTag).not.toContain("required");
    expect(walkinBlock).toContain("phone: phone || undefined");
  });

  it("never sends a reservation date/time — the server alone establishes it", () => {
    expect(walkinBlock).not.toMatch(/\breservationDate\b/);
    expect(walkinFormHtml).not.toMatch(/type="date"|type="time"/);
  });

  it("never sends a client-supplied source — the server alone establishes source=Walk-in", () => {
    expect(walkinBlock).not.toMatch(/\bsource\b/);
  });

  it("never sends an email — the endpoint accepts none", () => {
    expect(walkinBlock).not.toMatch(/\bemail\b/i);
  });

  it("never sends nowOverride, servicePeriodPolicy, contactMethodRequired, or an arrival timestamp — all server-internal", () => {
    expect(walkinBlock).not.toMatch(/nowOverride|servicePeriodPolicy|contactMethodRequired|arrivedAt|isHistoricalCorrection/);
  });
});

describe("Walk-in nu — double-submit protection", () => {
  it("disables the submit button for the duration of the request and ignores a second submit while pending", () => {
    expect(walkinBlock).toContain("if (walkinSubmit.disabled) return;");
    expect(walkinBlock).toMatch(/walkinSubmit\.disabled = true;[\s\S]*fetch\("\/availability\/reservations\/walk-in"/);
    expect(walkinBlock).toContain("walkinSubmit.disabled = false;");
  });
});

describe("Walk-in nu — the three server outcomes", () => {
  it("Outcome A (CREATED_AND_SEATED) renders the required Dutch success message with 'ok' styling", () => {
    expect(walkinBlock).toMatch(/data\.seating\.status === "Seated"/);
    expect(walkinBlock).toMatch(/showMessage\(walkinMessage, "Walk-in geregistreerd en geplaatst\.", "ok"\)/);
  });

  it("Outcome B (CREATED_UNSEATED) renders as a successful registration awaiting seating, not a failure", () => {
    expect(walkinBlock).toContain("Walk-in geregistreerd, maar nog niet geplaatst.");
    expect(walkinBlock).toMatch(/"Walk-in geregistreerd, maar nog niet geplaatst\.[^"]*"\s*,\s*\n?\s*"warn"/);
    // Never rendered via the error path.
    expect(walkinBlock).not.toMatch(/"Walk-in geregistreerd, maar nog niet geplaatst\.[^"]*"\s*,\s*\n?\s*"error"/);
  });

  it("Outcome C (NOT_CREATED / capacity) renders the required Dutch failure message, with no automatic retry", () => {
    expect(walkinBlock).toContain("Geen capaciteit beschikbaar voor deze walk-in.");
    // Exactly one fetch call in the whole handler — a rejection is
    // reported, never silently retried with another time/slot.
    expect(walkinBlock.match(/fetch\(/g)?.length).toBe(1);
    expect(walkinBlock).not.toMatch(/setTimeout\(/);
  });

  it("reuses the existing generic violation/policy/servicePeriod error rendering rather than duplicating it", () => {
    expect(walkinBlock).toContain("creationErrorMessage(data)");
  });
});

describe("Walk-in nu — refreshes existing state, invents none", () => {
  it("reloads the daily list and occupancy via the existing pilot mechanisms only", () => {
    expect(walkinBlock).toContain("await loadList();");
    expect(walkinBlock).toContain("await loadOccupancy();");
    expect(walkinBlock).not.toMatch(/walkinReservations|walkinState|new\s+Map\(|new\s+Set\(/);
  });
});

describe("Ordinary reservation workflow — unchanged and still functional", () => {
  it("still targets the authoritative capacity-aware create route with date/time/source intact", () => {
    const createBlockStart = source.indexOf('const createForm = document.getElementById("create-form");');
    const createBlockEnd = source.indexOf("const listDateInput", createBlockStart);
    const createBlock = source.slice(createBlockStart, createBlockEnd);
    expect(createBlock).toContain('fetch("/availability/reservations", {');
    expect(createBlock).toContain("reservationDate: new Date(datetimeValue).toISOString()");
    expect(createBlock).toContain('source: { category: document.getElementById("source").value }');
  });

  it("the ordinary form's required fields are untouched", () => {
    expect(source).toMatch(/<input id="guest-name" type="text" required/);
    expect(source).toMatch(/<select id="preferred-area" required>/);
    expect(source).toMatch(/<select id="time" required>/);
  });
});
