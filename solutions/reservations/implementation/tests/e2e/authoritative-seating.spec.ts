import { test, expect, Page, BrowserContext, Locator } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import fs from "node:fs";
import { deleteE2ECriticalNotes, deleteE2EReservationAndContact } from "./support/e2eCleanup.js";

/**
 * R1.5-P7-C — P0-3 browser proof. The daily list's "Tafel" column now shows
 * the authoritative active SeatingAssignment (read-only) instead of an
 * editable free-text Reservation.tableAssignment, and changes only through
 * the real seating workflow. Also proves GET /floor's hasAllergyNote follows
 * ACTIVE Allergy critical notes.
 *
 * Two disposable, tagged reservations are created through the real API as
 * the synthetic E2E user and removed afterwards via the authorized
 * e2eCleanup gate (critical notes first, then reservation + its seating,
 * events, commitments, guest credential and contact). The legacy
 * tableAssignment conflict is written directly ONLY onto these disposable
 * rows (no route can write it any more).
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
const RECEPTION_USERNAME = "resetcheck";
const RECEPTION_PASSWORD = process.env["HELIX_PILOT_TEST_PASSWORD"];
const RUN_TAG = Date.now();
const LOCAL_DATE = "2026-12-19";
const RESERVATION_ISO = "2026-12-19T18:00:00.000Z"; // 19:00 Europe/Amsterdam, Saturday dinner
const MAIN_NAME = `R1.5-P7-C seating ${RUN_TAG}`;
const CONFLICT_NAME = `R1.5-P7-C legacy ${RUN_TAG}`;
const FIRST_TABLE = { id: "sushi-table-11", label: "Table 11" };
const SECOND_TABLE = { id: "sushi-table-13", label: "Table 13" };

async function createDisposable(page: Page, name: string): Promise<{ reservationId: string; contactId: string }> {
  const res = await page.request.post("/availability/reservations", {
    headers: { "x-helix-client": "1" },
    data: {
      commandId: `r15-p7c-${RUN_TAG}-${name === MAIN_NAME ? "main" : "conflict"}`,
      servicePeriodId: "dinner",
      contactSelection: { type: "CreateNewContact", displayName: name, phone: "0611113333" },
      reservationDate: RESERVATION_ISO,
      partySize: 2,
      source: { category: "Telephone" },
      preferredArea: "Sushi",
    },
  });
  expect(res.status(), await res.text()).toBe(201);
  const reservationId = (await res.json()).reservationId as string;
  const contactId = (await prisma.reservation.findUniqueOrThrow({ where: { id: reservationId } })).contactId;
  return { reservationId, contactId };
}

async function showDay(page: Page): Promise<void> {
  await page.fill("#list-date", LOCAL_DATE);
  await page.locator("#list-date").dispatchEvent("change");
  await expect(page.locator("#list-body tr", { hasText: MAIN_NAME })).toHaveCount(1);
}

function tafelCell(page: Page, name: string): Locator {
  return page.locator("#list-body tr", { hasText: name }).locator('td[data-label="Tafel"]');
}

async function activeAssignment(reservationId: string) {
  return prisma.seatingAssignment.findFirst({ where: { reservationId, status: { in: ["Assigned", "Seated"] } }, include: { resources: true } });
}

test.describe.serial("R1.5-P7-C — Tafel shows the authoritative seating, changed only via the seating workflow", () => {
  let context: BrowserContext;
  let page: Page;
  const pageErrors: Error[] = [];
  const created: { reservationId: string; contactId: string }[] = [];
  let main: { reservationId: string; contactId: string };
  let conflict: { reservationId: string; contactId: string };

  test.beforeAll(async ({ browser }) => {
    context = await browser.newContext();
    page = await context.newPage();
    page.on("pageerror", (err) => pageErrors.push(err));
    page.on("dialog", (dialog) => dialog.accept().catch(() => {}));
    await page.goto("/pilot.html");
    test.skip(!RECEPTION_PASSWORD, "HELIX_PILOT_TEST_PASSWORD not set in environment");
    await page.fill("#login-username", RECEPTION_USERNAME);
    await page.fill("#login-password", RECEPTION_PASSWORD!);
    await page.click('#login-form button[type="submit"]');
    await expect(page.locator("#app-shell")).toBeVisible();
    main = await createDisposable(page, MAIN_NAME);
    created.push(main);
    conflict = await createDisposable(page, CONFLICT_NAME);
    created.push(conflict);
    // Controlled legacy conflict, on disposable rows only.
    await prisma.reservation.update({ where: { id: conflict.reservationId }, data: { tableAssignment: "Tafel 99" } });
  });

  test.afterAll(async () => {
    try {
      for (const r of created) {
        const noteIds = (await prisma.reservationCriticalNote.findMany({ where: { reservationId: r.reservationId }, select: { id: true } })).map((n) => n.id);
        await deleteE2ECriticalNotes(prisma, noteIds);
        await deleteE2EReservationAndContact(prisma, r.reservationId, r.contactId);
      }
    } finally {
      await context?.close();
      await prisma.$disconnect();
    }
  });

  test("Scenario 1 + 5a — unassigned shows 'Niet toegewezen'; a conflicting legacy value is never shown; no editable table field", async () => {
    await showDay(page);
    await expect(tafelCell(page, MAIN_NAME)).toHaveText("Niet toegewezen");
    await expect(tafelCell(page, CONFLICT_NAME)).toHaveText("Niet toegewezen");
    await expect(tafelCell(page, CONFLICT_NAME)).not.toContainText("Tafel 99");
    await expect(page.locator('#list-body td[data-label="Tafel"] input')).toHaveCount(0);
  });

  test("Scenario 2 — pre-assign through the real picker: list shows the actual table, survives reload, matches the DB", async () => {
    await page.locator("#list-body tr", { hasText: MAIN_NAME }).getByRole("button", { name: "Tafel toewijzen" }).click();
    await expect(page.locator("#seating-picker")).toBeVisible();
    await page.locator("#seating-picker-seat-immediately").uncheck(); // pre-assign (allowed without an Opened session)
    await page.locator(`#seating-picker-resources input[data-resource-id="${FIRST_TABLE.id}"]`).check();
    await page.click("#seating-picker-confirm");
    await expect(tafelCell(page, MAIN_NAME)).toContainText(FIRST_TABLE.label);
    await expect(tafelCell(page, MAIN_NAME)).toContainText("Toegewezen");

    await page.reload();
    await expect(page.locator("#app-shell")).toBeVisible();
    await showDay(page);
    await expect(tafelCell(page, MAIN_NAME)).toContainText(FIRST_TABLE.label);
    await expect(tafelCell(page, MAIN_NAME)).toContainText("Toegewezen");

    const active = await activeAssignment(main.reservationId);
    expect(active?.status).toBe("Assigned");
    expect(active?.resources.map((r) => r.tableId)).toEqual([FIRST_TABLE.id]);
  });

  test("Scenario 3 — move to another table: the old table is no longer current, the new one is shown, DB matches", async () => {
    await page.locator("#list-body tr", { hasText: MAIN_NAME }).getByRole("button", { name: "Verplaatsen" }).click();
    await expect(page.locator("#seating-picker")).toBeVisible();
    await page.locator(`#seating-picker-resources input[data-resource-id="${SECOND_TABLE.id}"]`).check();
    await page.click("#seating-picker-confirm");
    await expect(tafelCell(page, MAIN_NAME)).toContainText(SECOND_TABLE.label);
    await expect(tafelCell(page, MAIN_NAME)).not.toContainText(FIRST_TABLE.label);

    const active = await activeAssignment(main.reservationId);
    expect(active?.resources.map((r) => r.tableId)).toEqual([SECOND_TABLE.id]);
    const released = await prisma.seatingAssignment.findMany({ where: { reservationId: main.reservationId, status: "Released" }, include: { resources: true } });
    expect(released).toHaveLength(1);
    expect(released[0]!.resources.map((r) => r.tableId)).toEqual([FIRST_TABLE.id]);
  });

  test("Scenario 5b — a conflicting legacy value on an ASSIGNED reservation never replaces the real table", async () => {
    await prisma.reservation.update({ where: { id: main.reservationId }, data: { tableAssignment: "Tafel 77" } });
    await page.reload();
    await expect(page.locator("#app-shell")).toBeVisible();
    await showDay(page);
    await expect(tafelCell(page, MAIN_NAME)).toContainText(SECOND_TABLE.label);
    await expect(tafelCell(page, MAIN_NAME)).not.toContainText("Tafel 77");
  });

  test("Scenario 4 — Assigned → Seated through 'Nu plaatsen' (only when a real Opened service session exists)", async () => {
    const opened = await prisma.serviceSession.count({ where: { serviceCode: "dinner", serviceDate: new Date(`${LOCAL_DATE}T00:00:00.000Z`), status: "Opened" } });
    test.skip(
      opened === 0,
      "No Opened ServiceSession exists for this date in the dev environment (service_sessions = 0); marking Seated requires one (SeatingOrchestrator.markSeated -> SESSION_NOT_OPEN). Not fabricated — Seated read-model coverage is in tests/api/reservation-seating-read-model.test.ts (C)."
    );
    await page.locator("#list-body tr", { hasText: MAIN_NAME }).getByRole("button", { name: "Nu plaatsen" }).click();
    await expect(tafelCell(page, MAIN_NAME)).toContainText("Gezeten");
    expect((await activeAssignment(main.reservationId))?.status).toBe("Seated");
  });

  test("Allergy — GET /floor hasAllergyNote follows an ACTIVE Allergy note, and turns off once it is resolved", async () => {
    const floorRow = async () => {
      const res = await page.request.get(`/floor?date=${LOCAL_DATE}`);
      expect(res.status()).toBe(200);
      return (await res.json()).rows.find((r: { reservationId: string }) => r.reservationId === main.reservationId);
    };
    // Free-text notes alone never count.
    await prisma.reservation.update({ where: { id: main.reservationId }, data: { notes: "notenallergie (vrije tekst)" } });
    expect((await floorRow()).hasAllergyNote).toBe(false);

    const add = await page.request.patch(`/availability/reservations/${main.reservationId}`, {
      headers: { "x-helix-client": "1" },
      data: { commandId: `r15-p7c-note-add-${RUN_TAG}`, changes: {}, criticalNoteChanges: { add: [{ noteType: "Allergy", detail: `R1.5-P7-C allergy ${RUN_TAG}` }] } },
    });
    expect([200, 204], await add.text()).toContain(add.status());
    expect((await floorRow()).hasAllergyNote).toBe(true);

    const note = await prisma.reservationCriticalNote.findFirstOrThrow({ where: { reservationId: main.reservationId, noteType: "Allergy", status: "Active" } });
    const resolve = await page.request.patch(`/availability/reservations/${main.reservationId}`, {
      headers: { "x-helix-client": "1" },
      data: { commandId: `r15-p7c-note-resolve-${RUN_TAG}`, changes: {}, criticalNoteChanges: { resolve: [{ id: note.id }] } },
    });
    expect([200, 204], await resolve.text()).toContain(resolve.status());
    expect((await floorRow()).hasAllergyNote).toBe(false);
    expect(pageErrors, pageErrors.map((e) => e.message).join("; ")).toHaveLength(0);
  });
});
