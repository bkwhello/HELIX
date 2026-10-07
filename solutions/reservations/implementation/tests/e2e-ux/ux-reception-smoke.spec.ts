import { test, expect, Page, BrowserContext, Request } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import fs from "node:fs";
import { amsterdamLocalToUtc, guestName, UX_RECEPTION_USERNAME, UX_SATURDAY_PLAN, UX_TARGET_LOCAL_TIME } from "../../ops/ux/uxSaturdayPlan.js";
import { deleteUxDisposableReservation, UX_DISPOSABLE_PREFIX } from "../../ops/ux/uxDisposable.js";
import { UX_DATABASE_NAME } from "../../ops/ux/uxSafety.js";

/**
 * R1.5-P7-D — ENVIRONMENT validation of the isolated Reception UX instance
 * (127.0.0.1:3002 → helix_reservations_ux). Not a redesign evaluation: it
 * proves the seeded busy-Saturday dataset is reachable and rendered by the
 * CURRENT Reception UI, and that the UX instance is isolated from dev.
 *
 * Run with: npm run test:e2e:ux (playwright.ux.config.ts), with
 * HELIX_UX_RECEPTION_PASSWORD supplied in the environment. Dev
 * (helix_reservations_dev) is only ever READ here, to prove it is unchanged.
 */
function envUrl(file: string): string {
  const line = fs.readFileSync(file, "utf8").split("\n").find((l) => l.trim().startsWith("DATABASE_URL"));
  if (!line) throw new Error(`DATABASE_URL not found in ${file}`);
  return line.slice(line.indexOf("=") + 1).trim().replace(/^"(.*)"$/, "$1");
}
const UX_DB_URL = envUrl(".env.ux");
const DEV_DB_URL = envUrl(".env");
const ux = new PrismaClient({ datasourceUrl: UX_DB_URL });
const dev = new PrismaClient({ datasourceUrl: DEV_DB_URL });
const PASSWORD = process.env["HELIX_UX_RECEPTION_PASSWORD"];

const plan = (ref: string) => UX_SATURDAY_PLAN.find((r) => r.ref === ref)!;
const rowFor = (page: Page, ref: string) => page.locator("#list-body tr", { hasText: guestName(plan(ref)) });
const tafel = (page: Page, ref: string) => rowFor(page, ref).locator('td[data-label="Tafel"]');

async function devCounts() {
  const devDb = await dev.$queryRawUnsafe<{ db: string }[]>("SELECT current_database() AS db");
  expect(devDb[0]?.db).toBe("helix_reservations_dev");
  const rows = await dev.$queryRawUnsafe<Record<string, number>[]>(
    `SELECT (SELECT count(*)::int FROM reservations) r, (SELECT count(*)::int FROM contacts) c, (SELECT count(*)::int FROM reservation_critical_notes) n,
            (SELECT count(*)::int FROM seating_assignments) s, (SELECT count(*)::int FROM capacity_commitments) k, (SELECT count(*)::int FROM guest_management_credentials) g,
            (SELECT count(*)::int FROM service_sessions) ss, (SELECT count(*)::int FROM reservation_events) e`
  );
  return rows[0]!;
}

test.describe.serial("R1.5-P7-D — isolated Reception UX environment (127.0.0.1:3002)", () => {
  let context: BrowserContext;
  let page: Page;
  let datasetDate: string;
  const requests: string[] = [];
  const pageErrors: Error[] = [];

  test.beforeAll(async ({ browser }) => {
    test.skip(!PASSWORD, "HELIX_UX_RECEPTION_PASSWORD not set in environment");
    const uxDb = await ux.$queryRawUnsafe<{ db: string }[]>("SELECT current_database() AS db");
    expect(uxDb[0]?.db).toBe(UX_DATABASE_NAME);
    const sentinel = await ux.$queryRawUnsafe<{ dataset_date: string; seeded_at: Date | null }[]>(`SELECT dataset_date, seeded_at FROM "_ux_dataset_sentinel" WHERE id = 1`);
    expect(sentinel[0]?.seeded_at).not.toBeNull();
    datasetDate = sentinel[0]!.dataset_date;

    context = await browser.newContext();
    page = await context.newPage();
    page.on("request", (r: Request) => requests.push(r.url()));
    page.on("pageerror", (e) => pageErrors.push(e));
    // Deterministic browser clock: Saturday 19:45 Europe/Amsterdam (host clock untouched).
    await page.clock.setFixedTime(amsterdamLocalToUtc(datasetDate, UX_TARGET_LOCAL_TIME));
    await page.goto("/pilot.html");
    await page.fill("#login-username", UX_RECEPTION_USERNAME);
    await page.fill("#login-password", PASSWORD!);
    await page.click('#login-form button[type="submit"]');
    await expect(page.locator("#app-shell")).toBeVisible();
    await expect(page.locator("#session-indicator")).toContainText("UX Reception (Reception)");
  });

  test.afterAll(async () => {
    await context?.close();
    await ux.$disconnect();
    await dev.$disconnect();
  });

  async function showSaturday(): Promise<void> {
    await page.fill("#list-date", datasetDate);
    await page.locator("#list-date").dispatchEvent("change");
    await expect(page.locator("#list-body tr")).toHaveCount(UX_SATURDAY_PLAN.length);
  }

  test("daily list shows all 60 Saturday reservations, with no page errors", async () => {
    await showSaturday();
    for (const r of UX_SATURDAY_PLAN) await expect(rowFor(page, r.ref)).toHaveCount(1);
    await expect(rowFor(page, "UX-SAT-015")).toContainText("Geannuleerd");
    expect(pageErrors.map((e) => e.message)).toEqual([]);
  });

  test("authoritative table/grill information is displayed (Assigned, Seated, moved, no-show, unassigned)", async () => {
    await expect(tafel(page, "UX-SAT-008")).toContainText("Grill E · E-06, E-07, E-08, E-09, E-10");
    await expect(tafel(page, "UX-SAT-008")).toContainText("Toegewezen");
    await expect(tafel(page, "UX-SAT-030")).toContainText("Table 4");
    await expect(tafel(page, "UX-SAT-030")).toContainText("Gezeten");
    await expect(tafel(page, "UX-SAT-024")).toContainText("Bar 17");
    await expect(tafel(page, "UX-SAT-010")).toContainText("Grill C · C-01, C-02, C-03, C-04, C-05"); // after the move
    await expect(tafel(page, "UX-SAT-010")).not.toContainText("C-06");
    await expect(tafel(page, "UX-SAT-016")).toHaveText("Niet toegewezen"); // no-show released
    await expect(tafel(page, "UX-SAT-029")).toHaveText("Niet toegewezen");
  });

  test("active critical notes are flagged; resolved-only reservations are not", async () => {
    for (const ref of ["UX-SAT-002", "UX-SAT-021", "UX-SAT-004", "UX-SAT-027"]) await expect(rowFor(page, ref).locator(".critical-note-badge")).toHaveCount(1);
    for (const ref of ["UX-SAT-022", "UX-SAT-055", "UX-SAT-048", "UX-SAT-001"]) await expect(rowFor(page, ref).locator(".critical-note-badge")).toHaveCount(0);
  });

  test("at the browser clock of 19:45, a 19:00 guest who has not arrived is shown as late", async () => {
    await expect(rowFor(page, "UX-SAT-029").locator(".arrival-button")).toHaveText("Te laat");
    await expect(rowFor(page, "UX-SAT-030").locator(".arrival-button")).toHaveText("✓ Aangekomen");
  });

  test("search finds deterministic fixtures by name and by reservation reference", async () => {
    await page.fill("#list-search", "Jansen");
    await expect(page.locator("#list-body tr")).toHaveCount(2); // UX-SAT-029 + UX-SAT-046 ("Janssen" is a different name)
    await page.fill("#list-search", "UX-SAT-041");
    await expect(page.locator("#list-body tr")).toHaveCount(1);
    await page.fill("#list-search", "");
    await expect(page.locator("#list-body tr")).toHaveCount(UX_SATURDAY_PLAN.length);
    // The real phone snapshot is present in the API for future phone search (current UI search does not match phones — known audit P1).
    const res = await page.request.get(`/reservations?date=${datasetDate}`);
    const r029 = (await res.json()).reservations.find((r: { contactName: string }) => r.contactName === guestName(plan("UX-SAT-029")));
    expect(r029.contactPhoneSnapshot).toBe(plan("UX-SAT-029").phone);
  });

  test("real seating survives a reload", async () => {
    await page.reload();
    await expect(page.locator("#app-shell")).toBeVisible();
    await showSaturday();
    await expect(tafel(page, "UX-SAT-006")).toContainText("Grill E · E-01, E-02, E-03");
    await expect(tafel(page, "UX-SAT-006")).toContainText("Gezeten");
    await expect(tafel(page, "UX-SAT-042")).toContainText("Table 2");
  });

  test("isolation: a disposable UX write never changes dev; it is cleaned up afterwards", async () => {
    const devBefore = await devCounts();
    const uxBefore = await ux.reservation.count();
    const res = await page.request.post("/availability/reservations", {
      headers: { "x-helix-client": "1" },
      data: {
        commandId: `ux-disposable-${Date.now()}`,
        servicePeriodId: "dinner",
        contactSelection: { type: "CreateNewContact", displayName: `${UX_DISPOSABLE_PREFIX}${Date.now()}`, phone: "0600099999" },
        // 17:00 has Sushi capacity headroom (21:00 is deliberately at 51/51).
        reservationDate: amsterdamLocalToUtc(datasetDate, "17:00").toISOString(),
        partySize: 1,
        source: { category: "Telephone" },
        preferredArea: "Sushi",
      },
    });
    expect(res.status(), await res.text()).toBe(201);
    const reservationId = (await res.json()).reservationId as string;
    try {
      expect(await ux.reservation.count()).toBe(uxBefore + 1);
      expect(await devCounts()).toEqual(devBefore);
      expect(await dev.reservation.count({ where: { id: reservationId } })).toBe(0);
    } finally {
      await deleteUxDisposableReservation(UX_DB_URL, reservationId);
    }
    expect(await ux.reservation.count()).toBe(uxBefore);
    expect(await ux.contact.count({ where: { displayName: { startsWith: UX_DISPOSABLE_PREFIX } } })).toBe(0);
    expect(await devCounts()).toEqual(devBefore);
  });

  test("no browser request ever left the UX instance (nothing sent to the dev server on 3001)", async () => {
    expect(requests.length).toBeGreaterThan(0);
    const offTarget = requests.filter((u) => {
      const url = new URL(u);
      return !(["127.0.0.1", "localhost"].includes(url.hostname) && url.port === "3002");
    });
    expect(offTarget).toEqual([]);
    expect(requests.some((u) => new URL(u).port === "3001")).toBe(false);
  });
});
