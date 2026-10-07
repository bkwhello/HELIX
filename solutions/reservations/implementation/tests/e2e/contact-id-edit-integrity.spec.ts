import { test, expect, Page, BrowserContext } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import fs from "node:fs";
import { deleteE2EReservationAndContact } from "./support/e2eCleanup.js";

/**
 * R1.5-P7-A — P0-1 browser proof. The edit form used to show the internal
 * contactId in the field labelled "Telefoon" and send it back as
 * changes.contactId. Now: the visible, editable Telefoon is the
 * reservation's own phone snapshot; saving changes only that snapshot
 * (never contactId, never the Contact record); and the generic modify API
 * rejects any contactId with 422 and zero mutation.
 *
 * Uses ONE disposable, tagged reservation created through the real API as
 * the synthetic E2E user, removed afterwards via the existing authorized
 * e2eCleanup gate. The adopted read-only R1.4-I2 H01 fixture is opened for
 * the cross-reservation leak check only (never saved).
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
const GUEST_NAME = `R1.5-P7-A edit ${RUN_TAG}`;
const LOCAL_DATE = "2026-12-19";
const ORIGINAL_PHONE = "0611112222";
const CORRECTED_PHONE = "0699990000";
const H01_NAME = "R1.4-I2 pilot H01";
const H01_LOCAL_DATE = "2026-10-05";

async function openEdit(page: Page, localDate: string, guestName: string): Promise<void> {
  await page.fill("#list-date", localDate);
  await page.locator("#list-date").dispatchEvent("change");
  const row = page.locator("#list-body tr", { hasText: guestName });
  await expect(row).toHaveCount(1);
  await row.getByRole("button", { name: "Bewerken" }).click();
  await expect(page.locator("#form-title")).toHaveText("Reservering bewerken");
}

async function reservationState(id: string) {
  const reservation = await prisma.reservation.findUniqueOrThrow({ where: { id } });
  const events = await prisma.reservationEvent.count({ where: { reservationId: id } });
  const commitments = await prisma.capacityCommitment.findMany({ where: { reservationId: id }, orderBy: { commitmentId: "asc" } });
  const seating = await prisma.seatingAssignment.count({ where: { reservationId: id } });
  return JSON.stringify({ reservation, events, commitments, seating });
}

test.describe.serial("R1.5-P7-A — the internal contactId is never edited as a phone number", () => {
  let context: BrowserContext;
  let page: Page;
  const pageErrors: Error[] = [];
  let reservationId: string | undefined;
  let contactId: string | undefined;
  let contactBefore: string | undefined;

  test.beforeAll(async ({ browser }) => {
    context = await browser.newContext();
    page = await context.newPage();
    page.on("pageerror", (err) => pageErrors.push(err));
    await page.goto("/pilot.html");
    test.skip(!RECEPTION_PASSWORD, "HELIX_PILOT_TEST_PASSWORD not set in environment");
    await page.fill("#login-username", RECEPTION_USERNAME);
    await page.fill("#login-password", RECEPTION_PASSWORD!);
    await page.click('#login-form button[type="submit"]');
    await expect(page.locator("#app-shell")).toBeVisible();

    const res = await page.request.post("/availability/reservations", {
      headers: { "x-helix-client": "1" },
      data: {
        commandId: `r15-p7a-${RUN_TAG}`,
        servicePeriodId: "dinner",
        contactSelection: { type: "CreateNewContact", displayName: GUEST_NAME, phone: ORIGINAL_PHONE },
        reservationDate: "2026-12-19T18:00:00.000Z",
        partySize: 2,
        source: { category: "Telephone" },
        preferredArea: "Sushi",
      },
    });
    expect(res.status(), await res.text()).toBe(201);
    reservationId = (await res.json()).reservationId;
    contactId = (await prisma.reservation.findUniqueOrThrow({ where: { id: reservationId! } })).contactId;
    contactBefore = JSON.stringify(await prisma.contact.findUniqueOrThrow({ where: { id: contactId } }));
  });

  test.afterAll(async () => {
    try {
      if (reservationId) await deleteE2EReservationAndContact(prisma, reservationId, contactId);
    } finally {
      await context?.close();
      await prisma.$disconnect();
    }
  });

  test("G + H — edit mode shows the REAL phone snapshot as 'Telefoon'; the contactId is in no input at all", async () => {
    await openEdit(page, LOCAL_DATE, GUEST_NAME);
    const phoneField = page.getByRole("textbox", { name: "Telefoon", exact: true });
    await expect(phoneField).toHaveCount(1); // exactly one visible Telefoon
    await expect(phoneField).toHaveAttribute("id", "contact-phone-snapshot");
    await expect(phoneField).toHaveValue(ORIGINAL_PHONE);
    await expect(page.locator("#guest-phone")).toBeHidden();
    await expect(page.locator("#guest-phone")).toBeDisabled();
    await expect(page.locator("#guest-phone")).toHaveValue("");
    await expect(page.getByText("zoals vastgelegd bij deze reservering")).toHaveCount(0);
    const values = await page.locator("#create-form input, #create-form textarea, #create-form select").evaluateAll((els) => els.map((e) => (e as HTMLInputElement).value));
    expect(values).not.toContain(contactId);
  });

  test("I + J — correcting the phone sends ONLY contactPhoneSnapshot (no contactId); after reload it persists and contactId is unchanged", async () => {
    const requestPromise = page.waitForRequest((r) => r.method() === "PATCH" && new URL(r.url()).pathname === `/availability/reservations/${reservationId}`);
    const responsePromise = page.waitForResponse((r) => r.request().method() === "PATCH" && new URL(r.url()).pathname === `/availability/reservations/${reservationId}`);
    await page.getByRole("textbox", { name: "Telefoon", exact: true }).fill(CORRECTED_PHONE);
    await page.click("#create-submit");
    const body = JSON.parse((await requestPromise).postData() ?? "{}");
    const response = await responsePromise;
    // The edit form always resends date/partySize/area, so the existing contract may answer 200 MODIFIED or 204.
    expect([200, 204], await response.text()).toContain(response.status());
    expect(Object.prototype.hasOwnProperty.call(body.changes, "contactId")).toBe(false);
    expect(body.changes.contactPhoneSnapshot).toBe(CORRECTED_PHONE);

    await page.reload();
    await expect(page.locator("#app-shell")).toBeVisible();
    await openEdit(page, LOCAL_DATE, GUEST_NAME);
    await expect(page.getByRole("textbox", { name: "Telefoon", exact: true })).toHaveValue(CORRECTED_PHONE);

    const stored = await prisma.reservation.findUniqueOrThrow({ where: { id: reservationId! } });
    expect(stored.contactPhoneSnapshot).toBe(CORRECTED_PHONE);
    expect(stored.contactId).toBe(contactId);
    await page.click("#cancel-edit");
  });

  test("Contact integrity — the snapshot correction did NOT change the Contact (phone, identity, status)", async () => {
    const contactAfter = await prisma.contact.findUniqueOrThrow({ where: { id: contactId! } });
    expect(JSON.stringify(contactAfter)).toBe(contactBefore);
    expect(contactAfter.phoneRaw).toBe(ORIGINAL_PHONE);
    expect(contactAfter.status).toBe("Active");
  });

  test("K — opening another reservation shows ITS phone, never the previous one's", async () => {
    const h01 = await prisma.reservation.findFirstOrThrow({ where: { contactName: H01_NAME } });
    await openEdit(page, H01_LOCAL_DATE, H01_NAME);
    await expect(page.getByRole("textbox", { name: "Telefoon", exact: true })).toHaveValue(h01.contactPhoneSnapshot ?? "");
    await expect(page.getByRole("textbox", { name: "Telefoon", exact: true })).not.toHaveValue(CORRECTED_PHONE);
    await page.click("#cancel-edit"); // H01 is read-only here — never saved
    // Back in Create mode the Contact inputs are usable again and empty.
    await expect(page.locator("#guest-phone")).toBeVisible();
    await expect(page.locator("#guest-phone")).toBeEnabled();
    await expect(page.locator("#guest-phone")).toHaveValue("");
  });

  test("API — a forbidden contactId change (another real Contact) is rejected with 422 and changes nothing", async () => {
    const otherContactId = (await prisma.reservation.findFirstOrThrow({ where: { contactName: H01_NAME } })).contactId;
    expect(otherContactId).not.toBe(contactId);
    for (const forbidden of [otherContactId, "0687654321", contactId]) {
      const before = await reservationState(reservationId!);
      const res = await page.request.patch(`/availability/reservations/${reservationId}`, {
        headers: { "x-helix-client": "1" },
        data: { commandId: `r15-p7a-forbidden-${RUN_TAG}-${forbidden}`, changes: { contactId: forbidden, notes: "mag niet doorkomen" } },
      });
      expect(res.status()).toBe(422);
      expect((await res.json()).code).toBe("CONTACT_ID_NOT_MODIFIABLE");
      expect(await reservationState(reservationId!)).toBe(before);
    }
    expect(JSON.stringify(await prisma.contact.findUniqueOrThrow({ where: { id: contactId! } }))).toBe(contactBefore);
    expect(pageErrors, pageErrors.map((e) => e.message).join("; ")).toHaveLength(0);
  });
});
