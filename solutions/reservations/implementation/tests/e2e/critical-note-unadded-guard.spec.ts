import { test, expect, Page, BrowserContext, Route } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import fs from "node:fs";
import { deleteE2ECriticalNotes, deleteE2EReservationAndContact } from "./support/e2eCleanup.js";

/**
 * R1.5-P7-B — P0-2 browser regression: critical-note text typed but never
 * added must never be silently dropped by a reservation create/edit.
 *
 * Scenarios A-J run behind a client-side WRITE GUARD: every POST/PATCH/
 * PUT/DELETE the page sends is recorded and then either aborted or
 * answered with a canned response — none of them ever reaches the server,
 * so they create/modify no Reservation, Contact, or Critical Note and need
 * no cleanup. Reads (GET) go to the real dev server unchanged.
 *
 * The one PERSISTED scenario (end-to-end create with an Enter-added note)
 * really writes, then removes exactly its own rows through the existing
 * e2eCleanup gate — which only accepts rows created by the synthetic E2E
 * staff user (su-resetcheck). It therefore runs only when logged in as
 * that user, and skips (never writes) under any other account.
 *
 * Login: HELIX_PILOT_TEST_USERNAME (default "resetcheck", the suite-wide
 * convention) + HELIX_PILOT_TEST_PASSWORD, set at invocation time — never
 * hardcoded, never logged.
 */
function loadDatabaseUrl(): string {
  const content = fs.readFileSync(".env", "utf8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed.startsWith("DATABASE_URL")) continue;
    const idx = trimmed.indexOf("=");
    return trimmed.slice(idx + 1).trim().replace(/^"(.*)"$/, "$1");
  }
  throw new Error("DATABASE_URL not found in .env");
}

const prisma = new PrismaClient({ datasourceUrl: loadDatabaseUrl() });
const E2E_SYNTHETIC_USERNAME = "resetcheck";
const RECEPTION_USERNAME = process.env["HELIX_PILOT_TEST_USERNAME"] || E2E_SYNTHETIC_USERNAME;
const RECEPTION_PASSWORD = process.env["HELIX_PILOT_TEST_PASSWORD"];

const UNADDED_MESSAGE = "Allergie/kritieke notitie is nog niet toegevoegd. Klik op Toevoegen of maak het veld leeg.";
const RUN_TAG = Date.now();
const CREATE_DATE = "2026-12-19";
const CREATE_TIME = "19:00";
// Existing adopted E2E target reservation (Proposed, R1.4-I4 synthetic) — opened
// for edit only; every save against it in this file is intercepted.
const EDIT_TARGET_DATE = "2026-12-15";
const EDIT_TARGET_CONTACT_NAME = "R1.4-I4 Browser T08";

type Captured = { method: string; path: string; body: any };

/** Records every mutating request; answers it with `respond` (or aborts) so it never reaches the server. */
async function installWriteGuard(page: Page, respond?: (c: Captured, route: Route) => Promise<boolean>): Promise<Captured[]> {
  const captured: Captured[] = [];
  await page.route("**/*", async (route) => {
    const req = route.request();
    if (!["POST", "PATCH", "PUT", "DELETE"].includes(req.method())) return route.continue();
    const raw = req.postData();
    const c: Captured = { method: req.method(), path: new URL(req.url()).pathname, body: raw ? JSON.parse(raw) : null };
    captured.push(c);
    if (respond && (await respond(c, route))) return;
    return route.abort("blockedbyclient");
  });
  return captured;
}

async function removeWriteGuard(page: Page): Promise<void> {
  await page.unroute("**/*");
}

async function fillNewReservation(page: Page, guestName: string): Promise<void> {
  await page.fill("#guest-name", guestName);
  await page.fill("#guest-phone", "0611110000");
  await page.fill("#date", CREATE_DATE);
  await page.locator("#date").dispatchEvent("change");
  await expect(page.locator(`#time option[value="${CREATE_TIME}"]`)).toHaveCount(1);
  await page.selectOption("#time", CREATE_TIME);
  await page.selectOption("#preferred-area", "Sushi");
}

const reservationCreates = (c: Captured[]) => c.filter((x) => x.method === "POST" && x.path === "/availability/reservations");
const reservationPatches = (c: Captured[]) => c.filter((x) => x.method === "PATCH" && x.path.startsWith("/availability/reservations/"));

test.describe.serial("R1.5-P7-B — unadded critical-note text is never silently dropped", () => {
  let context: BrowserContext;
  let page: Page;
  const pageErrors: Error[] = [];

  test.beforeAll(async ({ browser }) => {
    context = await browser.newContext();
    page = await context.newPage();
    page.on("pageerror", (err) => pageErrors.push(err));
    page.on("dialog", (dialog) => dialog.dismiss().catch(() => {}));
    await page.goto("/pilot.html");
    test.skip(!RECEPTION_PASSWORD, "HELIX_PILOT_TEST_PASSWORD not set in environment");
    await page.fill("#login-username", RECEPTION_USERNAME);
    await page.fill("#login-password", RECEPTION_PASSWORD!);
    await page.click('#login-form button[type="submit"]');
    await expect(page.locator("#app-shell")).toBeVisible();
  });

  test.afterEach(async () => {
    await removeWriteGuard(page);
    // Leave the form in a clean create state for the next scenario.
    if (await page.locator("#cancel-edit").isVisible()) await page.locator("#cancel-edit").click();
    await page.fill("#critical-note-detail", "");
  });

  test.afterAll(async () => {
    await context?.close();
    await prisma.$disconnect();
  });

  test("A — empty allergy field: the reservation request is sent normally", async () => {
    const captured = await installWriteGuard(page);
    await fillNewReservation(page, `R1.5-P7-B A ${RUN_TAG}`);
    await page.click("#create-submit");
    await expect.poll(() => reservationCreates(captured).length).toBe(1);
    expect(reservationCreates(captured)[0]!.body.criticalNotes).toBeUndefined();
    await expect(page.locator("#create-message")).not.toContainText(UNADDED_MESSAGE);
  });

  test("B — text typed but NOT added: submit blocked, no request, warning shown, input focused, text kept", async () => {
    const captured = await installWriteGuard(page);
    await fillNewReservation(page, `R1.5-P7-B B ${RUN_TAG}`);
    await page.selectOption("#critical-note-type", "Allergy");
    await page.fill("#critical-note-detail", "NOTENALLERGIE ernstig");
    await page.click("#create-submit");
    await expect(page.locator("#create-message")).toContainText(UNADDED_MESSAGE);
    await expect(page.locator("#critical-note-detail")).toBeFocused();
    await expect(page.locator("#critical-note-detail")).toHaveValue("NOTENALLERGIE ernstig");
    await page.waitForTimeout(300);
    expect(captured, JSON.stringify(captured)).toHaveLength(0);
    await expect(page.locator("#critical-notes-list")).toContainText("Geen kritieke notities.");
  });

  test("C + J — Enter in the allergy input does NOT submit the form and adds exactly one pending note (type preserved)", async () => {
    const captured = await installWriteGuard(page);
    await fillNewReservation(page, `R1.5-P7-B C ${RUN_TAG}`);
    await page.selectOption("#critical-note-type", "Critical");
    await page.fill("#critical-note-detail", "rolstoel - vaste plek");
    await page.locator("#critical-note-detail").press("Enter");
    // A second Enter on the now-empty input must not add anything either.
    await page.locator("#critical-note-detail").press("Enter");
    await page.waitForTimeout(300);
    expect(captured, JSON.stringify(captured)).toHaveLength(0);
    const items = page.locator("#critical-notes-list .critical-note-item");
    await expect(items).toHaveCount(1);
    await expect(items.first()).toContainText("Kritiek");
    await expect(items.first()).toContainText("rolstoel - vaste plek");
    await expect(page.locator("#critical-note-detail")).toHaveValue("");
    await expect(page.locator("#critical-note-detail")).toBeFocused();
    await expect(page.locator("#form-title")).toHaveText("Nieuwe reservering");
  });

  test("D — Add button adds exactly one pending note", async () => {
    const captured = await installWriteGuard(page);
    await page.selectOption("#critical-note-type", "Allergy");
    await page.fill("#critical-note-detail", "gluten");
    await page.click("#critical-note-add-button");
    await page.waitForTimeout(200);
    expect(captured).toHaveLength(0);
    // C's note plus this one.
    await expect(page.locator("#critical-notes-list .critical-note-item")).toHaveCount(2);
    await expect(page.locator("#critical-notes-list .critical-note-item", { hasText: "gluten" })).toHaveCount(1);
  });

  test("E + F — added notes are sent exactly once each; a successful create resets text, type, and pending notes", async () => {
    const captured = await installWriteGuard(page, async (c, route) => {
      if (c.method === "POST" && c.path === "/availability/reservations") {
        await route.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify({ reservationId: "00000000-p7b-fake-0000-000000000000", warnings: [] }) });
        return true;
      }
      return false;
    });
    await page.click("#create-submit");
    await expect.poll(() => reservationCreates(captured).length).toBe(1);
    const sent = reservationCreates(captured)[0]!.body.criticalNotes;
    expect(sent).toEqual([
      { noteType: "Critical", detail: "rolstoel - vaste plek" },
      { noteType: "Allergy", detail: "gluten" },
    ]);
    await expect(page.locator("#create-message")).toContainText("Reservering aangemaakt");
    await expect(page.locator("#critical-note-detail")).toHaveValue("");
    await expect(page.locator("#critical-note-type")).toHaveValue("Allergy");
    await expect(page.locator("#critical-notes-list .critical-note-item")).toHaveCount(0);
    await expect(page.locator("#critical-notes-list")).toContainText("Geen kritieke notities.");
  });

  async function openEditTarget(): Promise<void> {
    await page.fill("#list-date", EDIT_TARGET_DATE);
    await page.locator("#list-date").dispatchEvent("change");
    const row = page.locator("#list-body tr", { hasText: EDIT_TARGET_CONTACT_NAME }).filter({ hasText: "Voorgesteld" });
    await expect(row).toHaveCount(1);
    await row.getByRole("button", { name: "Bewerken" }).click();
    await expect(page.locator("#form-title")).toHaveText("Reservering bewerken");
  }

  test("G — edit mode: unadded note text blocks Save; no PATCH is sent", async () => {
    const captured = await installWriteGuard(page);
    await openEditTarget();
    await page.fill("#critical-note-detail", "sesam");
    await page.click("#create-submit");
    await expect(page.locator("#create-message")).toContainText(UNADDED_MESSAGE);
    await expect(page.locator("#critical-note-detail")).toBeFocused();
    await page.waitForTimeout(300);
    expect(captured, JSON.stringify(captured)).toHaveLength(0);
    await expect(page.locator("#form-title")).toHaveText("Reservering bewerken");
  });

  test("H + J — edit mode: Enter adds the note (not a form save); after that, Save proceeds with the ordinary edit request", async () => {
    const captured = await installWriteGuard(page, async (c, route) => {
      // Canned success for both the note-add PATCH and the later save PATCH.
      if (c.method === "PATCH") {
        await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({}) });
        return true;
      }
      return false;
    });
    await openEditTarget();
    await page.selectOption("#critical-note-type", "Allergy");
    await page.fill("#critical-note-detail", "lactose");
    await page.locator("#critical-note-detail").press("Enter");
    await expect.poll(() => reservationPatches(captured).length).toBe(1);
    const addPatch = reservationPatches(captured)[0]!;
    expect(addPatch.body.criticalNoteChanges).toEqual({ add: [{ noteType: "Allergy", detail: "lactose" }] });
    expect(addPatch.body.changes).toEqual({});
    await expect(page.locator("#critical-note-detail")).toHaveValue("");
    await expect(page.locator("#form-title")).toHaveText("Reservering bewerken"); // Enter did not save the form

    await page.click("#create-submit");
    await expect.poll(() => reservationPatches(captured).length).toBe(2);
    const savePatch = reservationPatches(captured)[1]!;
    expect(savePatch.body.changes.contactName).toBe(EDIT_TARGET_CONTACT_NAME);
    expect(savePatch.body.criticalNoteChanges).toBeUndefined();
    await expect(page.locator("#create-message")).not.toContainText(UNADDED_MESSAGE);
  });

  test("I — leaving/switching edit mode never carries a draft note to another reservation", async () => {
    const captured = await installWriteGuard(page);
    // Edit -> cancel: draft text and type reset.
    await openEditTarget();
    await page.selectOption("#critical-note-type", "Critical");
    await page.fill("#critical-note-detail", "draft voor gast A");
    await page.click("#cancel-edit");
    await expect(page.locator("#critical-note-detail")).toHaveValue("");
    await expect(page.locator("#critical-note-type")).toHaveValue("Allergy");
    await expect(page.locator("#critical-notes-list .critical-note-item")).toHaveCount(0);

    // Create draft (text + one pending note) -> open an existing reservation: nothing leaks into it.
    await page.fill("#critical-note-detail", "pending voor nieuwe gast");
    await page.locator("#critical-note-detail").press("Enter");
    await page.fill("#critical-note-detail", "nog niet toegevoegd");
    await expect(page.locator("#critical-notes-list .critical-note-item")).toHaveCount(1);
    await openEditTarget();
    await expect(page.locator("#critical-note-detail")).toHaveValue("");
    await expect(page.locator("#critical-note-type")).toHaveValue("Allergy");
    await expect(page.locator("#critical-notes-list")).not.toContainText("pending voor nieuwe gast");
    await page.click("#cancel-edit");
    await expect(page.locator("#critical-notes-list .critical-note-item")).toHaveCount(0);
    expect(captured, JSON.stringify(captured)).toHaveLength(0);
    expect(pageErrors, pageErrors.map((e) => e.message).join("; ")).toHaveLength(0);
  });

  test("PERSISTED — Enter-added allergy is stored exactly once on a real create (then removed by the E2E cleanup gate)", async () => {
    test.skip(RECEPTION_USERNAME !== E2E_SYNTHETIC_USERNAME, `persisted scenario requires the synthetic E2E user "${E2E_SYNTHETIC_USERNAME}" (cleanup gate); logged in as "${RECEPTION_USERNAME}" — skipped, nothing written`);
    const guestName = `R1.5-P7-B persisted ${RUN_TAG}`;
    const detail = `R1.5-P7-B allergy ${RUN_TAG}`;
    let reservationId: string | undefined;
    let contactId: string | undefined;
    try {
      await fillNewReservation(page, guestName);
      await page.selectOption("#critical-note-type", "Allergy");
      await page.fill("#critical-note-detail", detail);
      await page.locator("#critical-note-detail").press("Enter");
      const responsePromise = page.waitForResponse((r) => r.request().method() === "POST" && new URL(r.url()).pathname === "/availability/reservations");
      await page.click("#create-submit");
      const response = await responsePromise;
      expect(response.status(), await response.text()).toBe(201);
      reservationId = (await response.json()).reservationId;
      const created = await prisma.reservation.findUnique({ where: { id: reservationId! } });
      contactId = created?.contactId;
      const notes = await prisma.reservationCriticalNote.findMany({ where: { reservationId: reservationId! } });
      expect(notes).toHaveLength(1);
      expect(notes[0]!.noteType).toBe("Allergy");
      expect(notes[0]!.detail).toBe(detail);
      expect(notes[0]!.status).toBe("Active");
      await expect(page.locator("#critical-note-detail")).toHaveValue("");
    } finally {
      if (reservationId) {
        const noteIds = (await prisma.reservationCriticalNote.findMany({ where: { reservationId }, select: { id: true } })).map((n) => n.id);
        await deleteE2ECriticalNotes(prisma, noteIds);
        await deleteE2EReservationAndContact(prisma, reservationId, contactId);
      }
    }
  });
});
