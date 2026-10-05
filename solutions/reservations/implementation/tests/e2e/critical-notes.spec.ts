import { test, expect, Page, BrowserContext } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import fs from "node:fs";
import { deleteE2ECriticalNotes } from "./support/e2eCleanup.js";

/**
 * R1.4-I5 — CAP-D05.02 Critical Notes browser validation (H13-H22, as
 * originally proposed in the R1.4-I1 report — these scenario IDs are
 * NOT a repository artifact; they exist only in that earlier
 * conversational deliverable, used here as the agreed test plan).
 *
 * Reuses the already-adopted synthetic reservation `b650f9d5-...`
 * (status Proposed, non-terminal, safe to Modify) rather than creating
 * a new reservation/contact — the critical-note model is
 * Reservation-scoped, not Contact-scoped, so no new Contact is needed
 * either. The existing R1.3-I6 fixture reservation (`49ffbe81-...`,
 * already carrying one Active and one Resolved note) is used read-only
 * for H14's "existing note rendering" check.
 */
function loadDatabaseUrl(): string {
  const content = fs.readFileSync(".env", "utf8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed.startsWith("DATABASE_URL")) continue;
    const idx = trimmed.indexOf("=");
    let value = trimmed.slice(idx + 1).trim();
    value = value.replace(/^"(.*)"$/, "$1");
    return value;
  }
  throw new Error("DATABASE_URL not found in .env");
}

const prisma = new PrismaClient({ datasourceUrl: loadDatabaseUrl() });
const RECEPTION_USERNAME = "resetcheck";
const RECEPTION_PASSWORD = process.env["HELIX_PILOT_TEST_PASSWORD"];

const EXISTING_FIXTURE_RESERVATION_ID = "49ffbe81-4181-4a2e-bba4-94154129727f"; // R1.3-I6 fixture: 1 Active + 1 Resolved note
const EXISTING_FIXTURE_LOCAL_DATE = "2026-11-20";
const TARGET_RESERVATION_ID = "b650f9d5-7969-45c9-9de2-0751b3a8bc5f"; // adopted, Proposed, non-terminal
const TARGET_LOCAL_DATE = "2026-12-15";
const TARGET_CONTACT_NAME = "R1.4-I4 Browser T08"; // b650f9d5's own contactName, for row lookup
// Tagged per-run (not a fixed string) because a resolved leftover note
// from an earlier interrupted iteration may still carry the untagged
// text — without the tag, H17's locator would match both rows.
const RUN_TAG = Date.now();
const H15_DETAIL = `R1.4-I5 H15 synthetic critical note ${RUN_TAG}`;
const H17_DETAIL = `R1.4-I5 H17 edited synthetic critical note ${RUN_TAG}`;
const I6_RECOVERY_DETAIL = `R1.4-I6 controls-recovery proof ${RUN_TAG}`;
const CANCELLED_RESERVATION_ID = "cf6b1fc8-3947-4e36-ab6c-a02a86713037"; // existing leftover, Cancelled (terminal) — used only to exercise the safe CAP-D01.01-R16 rejection path

test.describe.serial("R1.4-I5 — Critical Notes browser validation", () => {
  let context: BrowserContext;
  let page: Page;
  const pageErrors: Error[] = [];
  const failedRequests: { url: string; method: string; status: number; body: string }[] = [];
  let i5NoteId: string | undefined;
  // R1.4-I7 — every ReservationCriticalNote row THIS run creates, so
  // afterAll can delete exactly them (critical notes have no delete
  // path via the application itself — see e2eCleanup.ts) and the suite
  // leaves criticalNotes row counts unchanged run over run.
  const createdNoteIdsThisRun: string[] = [];

  test.beforeAll(async ({ browser }) => {
    context = await browser.newContext();
    page = await context.newPage();
    page.on("pageerror", (err) => pageErrors.push(err));
    page.on("response", (res) => {
      if (res.status() >= 400) {
        res
          .text()
          .then((body) => failedRequests.push({ url: res.url(), method: res.request().method(), status: res.status(), body: body.slice(0, 300) }))
          .catch(() => {});
      }
    });
    page.on("dialog", (dialog) => {
      dialog.accept("R1.4-I5 test").catch(() => {});
    });

    await page.goto("/pilot.html");
    test.skip(!RECEPTION_PASSWORD, "HELIX_PILOT_TEST_PASSWORD not set in environment");
    await page.fill("#login-username", RECEPTION_USERNAME);
    await page.fill("#login-password", RECEPTION_PASSWORD!);
    await page.click('#login-form button[type="submit"]');
    await expect(page.locator("#app-shell")).toBeVisible();
  });

  test.afterAll(async () => {
    // R1.4-I7 — runs even if an earlier test in this file failed
    // (Playwright always runs afterAll for a describe block once its
    // tests have started), so a mid-run failure still leaves criticalNotes
    // row counts unchanged. A cleanup failure throws (not swallowed) so
    // it surfaces as an explicit, separate hook error alongside — never
    // instead of — any earlier test failure.
    await deleteE2ECriticalNotes(prisma, createdNoteIdsThisRun);
    await context.close();
    await prisma.$disconnect();
  });

  test("H13 — Critical Notes panel visibility", async () => {
    await expect(page.locator(".critical-notes-section").first()).toBeVisible();
    await expect(page.locator("#critical-notes-list")).toBeVisible();
    await expect(page.locator("#critical-note-type")).toBeVisible();
    await expect(page.locator("#critical-note-detail")).toBeVisible();
    await expect(page.locator("#critical-note-add-button")).toBeVisible();
    // No admin-only control inside this section.
    await expect(page.locator(".critical-notes-section button:has-text(\"verwijderen\")")).toHaveCount(0);
    expect(pageErrors, pageErrors.map((e) => e.message).join("; ")).toHaveLength(0);
  });

  test("H14 — existing development note renders correctly (read-only fixture)", async () => {
    await page.fill("#list-date", EXISTING_FIXTURE_LOCAL_DATE);
    await page.waitForTimeout(400);
    const row = page.locator("#list-body tr", { hasText: "R1.3-I6 Functional Validation Guest" });
    await expect(row).toHaveCount(1);
    // The Active note's badge is visible in the daily list (Active-only read).
    await expect(row).toContainText("Kritiek");

    await row.getByRole("button", { name: "Bewerken" }).click();
    await page.waitForTimeout(500); // refreshEditingCriticalNotes() round trip (Active+Resolved detail read)

    const items = page.locator(".critical-note-item");
    await expect(items).toHaveCount(2);
    const resolvedItem = page.locator(".critical-note-item.resolved");
    await expect(resolvedItem).toHaveCount(1);
    await expect(resolvedItem).toContainText("Opgelost");
    await expect(resolvedItem).toContainText("Allergie");
    // Resolved note has no Opslaan/Oplossen controls — read-only.
    await expect(resolvedItem.locator("button")).toHaveCount(0);

    const activeItem = page.locator(".critical-note-item:not(.resolved)");
    await expect(activeItem).toHaveCount(1);
    await expect(activeItem).toContainText("Kritiek");
    await expect(activeItem.getByRole("button", { name: "Opslaan" })).toBeVisible();
    await expect(activeItem.getByRole("button", { name: "Oplossen" })).toBeVisible();

    // Backend corroboration.
    const dbNotes = await prisma.reservationCriticalNote.findMany({ where: { reservationId: EXISTING_FIXTURE_RESERVATION_ID } });
    expect(dbNotes).toHaveLength(2);
    expect(dbNotes.some((n) => n.status === "Resolved" && n.noteType === "Allergy")).toBe(true);
    expect(dbNotes.some((n) => n.status === "Active" && n.noteType === "Critical")).toBe(true);

    await page.locator("#cancel-edit").click(); // leave the fixture untouched
  });

  // H16 is deliberately executed BEFORE H15 in this file: a real defect
  // (recorded below, after H15) leaves the static "add" controls
  // permanently disabled after the first successful add/update/resolve
  // for the remainder of the session — H16 specifically needs those
  // controls still enabled, which is only true before H15 has ever run.
  // The scenario IDs/titles are unchanged; only execution order moved.
  test("H16 — required-field validation (blank detail is rejected client-side, no row created)", async () => {
    await page.fill("#list-date", TARGET_LOCAL_DATE);
    await page.waitForTimeout(400);
    const row = page.locator("#list-body tr", { hasText: TARGET_CONTACT_NAME }).filter({ hasText: "Voorgesteld" }); // status-disambiguated: other same-named rows from earlier runs are Cancelled
    await row.getByRole("button", { name: "Bewerken" }).click();
    await page.waitForTimeout(500);

    const beforeCount = await prisma.reservationCriticalNote.count({ where: { reservationId: TARGET_RESERVATION_ID } });
    await page.fill("#critical-note-detail", "   ");
    await page.selectOption("#critical-note-type", "Allergy");
    await page.click("#critical-note-add-button");
    await expect(page.locator("#critical-note-message")).toContainText("Vul een omschrijving in");
    const afterCount = await prisma.reservationCriticalNote.count({ where: { reservationId: TARGET_RESERVATION_ID } });
    expect(afterCount).toBe(beforeCount); // unchanged — no invalid row created
  });

  test("TEST-ENV CLEANUP — resolve a leftover Active note from an earlier interrupted iteration (not a scenario ID; disclosed in the report)", async () => {
    // An earlier iteration of this same R1.4-I5 work ran H15 successfully
    // (creating one real note via the genuine UI) before H16 then failed
    // on the now-understood controls-disabled defect, leaving that note
    // behind as Active. It is test debris from this same bounded,
    // authorized activity — not a business record — and is removed here
    // through the real in-app "Oplossen" action (no raw SQL), so the
    // remaining scenarios (H15/H17/H20/H22) observe a clean starting
    // state. This mutation is deliberately sequenced AFTER H16 (which
    // needed the static add-row controls fresh/untouched for its own
    // check). As of R1.4-I6, the controls-disabled-forever defect is
    // fixed (see the CONTROLS RE-ENABLE VERIFICATION test below), so no
    // page reload is needed here anymore to make H15 possible — this
    // very fact (performing this resolve, then H15's add, in the same
    // page session with no reload in between) is itself part of the I6
    // fix proof.
    const leftovers = page.locator(".critical-note-item:not(.resolved)");
    const leftoverCount = await leftovers.count();
    for (let i = 0; i < leftoverCount; i++) {
      await page.locator(".critical-note-item:not(.resolved)").first().getByRole("button", { name: "Oplossen" }).click();
      await page.waitForTimeout(500);
    }
    const stillActive = await prisma.reservationCriticalNote.count({ where: { reservationId: TARGET_RESERVATION_ID, status: "Active" } });
    expect(stillActive).toBe(0);

    await page.locator("#cancel-edit").click(); // close the edit panel; H15 re-opens it fresh (no reload — see comment above)
  });

  test("H15 — create one synthetic Critical Note (Reception is authorized)", async () => {
    await page.fill("#list-date", TARGET_LOCAL_DATE);
    await page.waitForTimeout(400);
    const row = page.locator("#list-body tr", { hasText: TARGET_CONTACT_NAME }).filter({ hasText: "Voorgesteld" }); // status-disambiguated: other same-named rows from earlier runs are Cancelled
    await row.getByRole("button", { name: "Bewerken" }).click();
    await page.waitForTimeout(500);

    // Any leftover from the prior iteration was resolved (not deleted) in
    // the cleanup step above, so no Active note should remain — but the
    // resolved row itself still exists, so this checks Active count only.
    const beforeActiveCount = await prisma.reservationCriticalNote.count({ where: { reservationId: TARGET_RESERVATION_ID, status: "Active" } });
    expect(beforeActiveCount).toBe(0);

    await page.selectOption("#critical-note-type", "Critical");
    await page.fill("#critical-note-detail", H15_DETAIL);
    await page.click("#critical-note-add-button");
    await page.waitForTimeout(500);

    const activeAfter = await prisma.reservationCriticalNote.findMany({ where: { reservationId: TARGET_RESERVATION_ID, status: "Active" } });
    expect(activeAfter).toHaveLength(1);
    i5NoteId = activeAfter[0]!.id;
    createdNoteIdsThisRun.push(i5NoteId);
    expect(activeAfter[0]!.noteType).toBe("Critical");
    expect(activeAfter[0]!.detail).toBe(H15_DETAIL);
    expect(activeAfter[0]!.status).toBe("Active");
    expect(activeAfter[0]!.createdByStaffUserId).toBe("su-resetcheck");

    const events = await prisma.reservationEvent.findMany({ where: { reservationId: TARGET_RESERVATION_ID }, orderBy: { occurredAt: "asc" } });
    const noteEvent = events.find((e) => JSON.parse(e.payload).changedFields?.includes?.("criticalNotes"));
    expect(noteEvent).toBeTruthy();
  });

  test("R1.4-I6 — CONTROLS RE-ENABLE VERIFICATION (P1 fix): static add controls are enabled again immediately after a successful mutation", async () => {
    // Previously (R1.4-I5): runCriticalNoteMutation()'s `finally` called
    // renderCriticalNotes() only, which rebuilds the per-note list items
    // but never touches the static #critical-note-type/-detail/-add-button
    // controls it disabled before the mutation — they stayed disabled for
    // the rest of the page session. Fixed in pilot.html by also calling
    // setCriticalNoteControlsDisabled(false) in that same `finally` block.
    // This test now asserts the OPPOSITE of the old DEFECT CONFIRMATION
    // test: the controls must be enabled, not disabled, right after H15's
    // successful add — with no reload since H15 ran.
    await expect(page.locator("#critical-note-add-button")).toBeEnabled();
    await expect(page.locator("#critical-note-detail")).toBeEnabled();
    await expect(page.locator("#critical-note-type")).toBeEnabled();
  });

  test("R1.4-I6 — SAME-SESSION RECOVERY PROOF: a second real mutation via the static add controls, no reload", async () => {
    // The core R1.4-I6 acceptance criterion: Reception can perform one
    // Critical Note mutation (H15's add, just above) and then immediately
    // use the static add-note controls again for a second mutation, in
    // the same authenticated page session, with no reload/logout/DOM
    // manipulation/API bypass. The resulting note is tagged R1.4-I6 and
    // is itself resolved at the end of this test (via its own per-item
    // Oplossen button, a third real mutation) so it does not persist as
    // an extra Active row and does not disturb H17's expectation that
    // exactly one non-resolved item (the H15 note) remains afterward.
    await page.selectOption("#critical-note-type", "Allergy");
    await page.fill("#critical-note-detail", I6_RECOVERY_DETAIL);
    await page.click("#critical-note-add-button");
    await page.waitForTimeout(500);

    const created = await prisma.reservationCriticalNote.findFirst({ where: { reservationId: TARGET_RESERVATION_ID, detail: I6_RECOVERY_DETAIL } });
    expect(created).toBeTruthy();
    expect(created!.status).toBe("Active");
    expect(created!.createdByStaffUserId).toBe("su-resetcheck");
    createdNoteIdsThisRun.push(created!.id);

    // Controls must still/again be usable after THIS mutation too.
    await expect(page.locator("#critical-note-add-button")).toBeEnabled();
    await expect(page.locator("#critical-note-detail")).toBeEnabled();
    await expect(page.locator("#critical-note-type")).toBeEnabled();

    // Self-cleanup: resolve the I6 proof note via its own per-item button.
    const recoveryItem = page.locator(".critical-note-item:not(.resolved)", { hasText: "Allergie" });
    await expect(recoveryItem).toHaveCount(1);
    await recoveryItem.getByRole("button", { name: "Oplossen" }).click();
    await page.waitForTimeout(500);

    const resolvedRecovery = await prisma.reservationCriticalNote.findUniqueOrThrow({ where: { id: created!.id } });
    expect(resolvedRecovery.status).toBe("Resolved");
  });

  test("R1.4-I6 — FAILURE PATH RECOVERY: a server-rejected mutation (CAP-D01.01-R16, terminal reservation) also leaves controls usable", async () => {
    // Safe, pre-existing, server-enforced rejection path — no artificial
    // bypass and no server change: ModificationRules.ts rejects any
    // modification (including a critical-note add, which flows through
    // the same ModifyReservation command) against a terminal (Cancelled/
    // Completed) reservation unless isAuthorizedCorrection is set, which
    // the pilot UI's critical-note add never sets. Reuses the existing
    // Cancelled leftover reservation from R1.4-I4 (cf6b1fc8-...) rather
    // than creating new data.
    await page.locator("#cancel-edit").click(); // close the edit view left open by the previous test
    await page.fill("#list-date", TARGET_LOCAL_DATE);
    await page.waitForTimeout(400);
    // Two Cancelled rows exist for this contact name on this date: the
    // plain "R1.4-I4 Browser T08" (cf6b1fc8-..., our intended target) and
    // a longer, 13-digit-tagged "R1.4-I4 Browser T08 <epoch-ms>" row
    // (c8d1ca16-..., a different R1.4-I4 debris row) whose name also
    // substring-matches TARGET_CONTACT_NAME. Excluding any row containing
    // a 13+ digit run disambiguates them without hardcoding either tag.
    const cancelledRow = page
      .locator("#list-body tr", { hasText: TARGET_CONTACT_NAME })
      .filter({ hasText: "Geannuleerd" })
      .filter({ hasNotText: /\d{13,}/ });
    await expect(cancelledRow).toHaveCount(1);
    await cancelledRow.getByRole("button", { name: "Bewerken" }).click();
    await page.waitForTimeout(500);

    const beforeCount = await prisma.reservationCriticalNote.count({ where: { reservationId: CANCELLED_RESERVATION_ID } });

    await page.selectOption("#critical-note-type", "Critical");
    await page.fill("#critical-note-detail", "R1.4-I6 failure-path probe (expected to be rejected)");
    await page.click("#critical-note-add-button");
    await page.waitForTimeout(500);

    // Rejected: an error message is shown and no row is created.
    await expect(page.locator("#critical-note-message")).not.toBeEmpty();
    const afterCount = await prisma.reservationCriticalNote.count({ where: { reservationId: CANCELLED_RESERVATION_ID } });
    expect(afterCount).toBe(beforeCount);

    // The failure path also goes through runCriticalNoteMutation()'s
    // `finally`, so controls must recover here too, not just on success.
    await expect(page.locator("#critical-note-add-button")).toBeEnabled();
    await expect(page.locator("#critical-note-detail")).toBeEnabled();
    await expect(page.locator("#critical-note-type")).toBeEnabled();

    // Return to the TARGET reservation's edit view for the remaining scenarios.
    await page.locator("#cancel-edit").click();
    const row = page.locator("#list-body tr", { hasText: TARGET_CONTACT_NAME }).filter({ hasText: "Voorgesteld" });
    await row.getByRole("button", { name: "Bewerken" }).click();
    await page.waitForTimeout(500);
  });

  test("H17 — edit the I5 note (Reception is authorized)", async () => {
    // An Active (non-resolved) note's detail is rendered inside a
    // <textarea> whose content is set via the `.value` property, not as
    // DOM text content — Playwright's `hasText` cannot match it. Since
    // the TEST-ENV CLEANUP step above resolved every pre-existing Active
    // note, exactly one non-resolved item is guaranteed to exist here
    // (ours, from H15), so `:not(.resolved)` alone is an unambiguous
    // locator; `inputValue()` cross-checks the actual content.
    const item = page.locator(".critical-note-item:not(.resolved)");
    await expect(item).toHaveCount(1);
    const textarea = item.locator("textarea.critical-note-detail-input");
    await expect(textarea).toHaveValue(H15_DETAIL);
    await textarea.fill(H17_DETAIL);
    await item.getByRole("button", { name: "Opslaan" }).click();
    await page.waitForTimeout(500);

    const updated = await prisma.reservationCriticalNote.findUniqueOrThrow({ where: { id: i5NoteId! } });
    expect(updated.detail).toBe(H17_DETAIL);
    expect(updated.updatedByStaffUserId).toBe("su-resetcheck");

    // Reload the edit form fresh and confirm the edit is retained, not just cached client-side.
    await page.locator("#cancel-edit").click();
    const row = page.locator("#list-body tr", { hasText: TARGET_CONTACT_NAME }).filter({ hasText: "Voorgesteld" }); // status-disambiguated: other same-named rows from earlier runs are Cancelled
    await row.getByRole("button", { name: "Bewerken" }).click();
    await page.waitForTimeout(500);
    await expect(page.locator(".critical-note-item:not(.resolved) textarea.critical-note-detail-input")).toHaveValue(H17_DETAIL);
  });

  test("H18 — acknowledge behavior is not implemented (by design, not a defect)", async () => {
    // No "Acknowledge" concept exists anywhere in the implementation —
    // only Add/Update/Resolve. Confirmed directly: no such control exists.
    await expect(page.getByText("Bevestig kennisname")).toHaveCount(0);
    await expect(page.locator('button:has-text("Acknowledge")')).toHaveCount(0);
  });

  test("H19 — resolve the I5 note (Reception is authorized)", async () => {
    const item = page.locator(".critical-note-item:not(.resolved)"); // see H17 comment re: textarea content
    await expect(item).toHaveCount(1);
    await expect(item.locator("textarea.critical-note-detail-input")).toHaveValue(H17_DETAIL);
    await item.getByRole("button", { name: "Oplossen" }).click(); // confirm() auto-accepted
    await page.waitForTimeout(500);

    const resolved = await prisma.reservationCriticalNote.findUniqueOrThrow({ where: { id: i5NoteId! } });
    expect(resolved.status).toBe("Resolved");
    expect(resolved.resolvedAt).not.toBeNull();
    expect(resolved.updatedByStaffUserId).toBe("su-resetcheck");
  });

  test("H20 — resolved note remains visible, read-only, in the detail/edit view", async () => {
    const item = page.locator(".critical-note-item", { hasText: H17_DETAIL });
    await expect(item).toHaveClass(/resolved/);
    await expect(item).toContainText("Opgelost");
    await expect(item.locator("button")).toHaveCount(0); // no Opslaan/Oplossen on a Resolved note

    // It is excluded from the Active-only daily-list badge for this
    // reservation — but the badge is set once per loadList() fetch, not
    // live-updated, so the list must be force-refreshed here (clear then
    // refill the same date to guarantee a real "change" event even though
    // the date string itself is unchanged) to observe current state
    // rather than whatever was cached from an earlier reload in this run
    // (e.g. the one in the R1.4-I6 FAILURE PATH RECOVERY test, taken
    // while this note was still Active).
    await page.locator("#cancel-edit").click();
    await page.fill("#list-date", "");
    await page.fill("#list-date", TARGET_LOCAL_DATE);
    await page.waitForTimeout(400);
    const row = page.locator("#list-body tr", { hasText: TARGET_CONTACT_NAME }).filter({ hasText: "Voorgesteld" }); // status-disambiguated: other same-named rows from earlier runs are Cancelled
    await expect(row).not.toContainText("⚠ Kritiek");

    const dbNote = await prisma.reservationCriticalNote.findUniqueOrThrow({ where: { id: i5NoteId! } });
    expect(dbNote.status).toBe("Resolved");
  });

  test("H21 — authorization boundary: no restricted critical-note action exists for Reception to probe", async () => {
    // Critical notes reuse exactly Reservation.Create/Modify/View —
    // Reception already holds all three (confirmed in the authorization
    // implementation, StaffAuthorizationPolicy.ts). There is therefore
    // no distinct, more-privileged critical-note permission for this
    // role to be denied — unlike I4's Complete-button finding, there is
    // no equivalent control to test here. Confirmed concretely: no
    // delete control exists for any critical note, for any role, by
    // design (never hard-deleted).
    await expect(page.locator(".critical-note-item button:has-text(\"Verwijderen\")")).toHaveCount(0);
  });

  test("H22 — persistence after reload: exactly one resolved note, no duplicate, session intact", async () => {
    await page.reload();
    await expect(page.locator("#app-shell")).toBeVisible(); // session persisted
    await page.fill("#list-date", TARGET_LOCAL_DATE);
    await page.waitForTimeout(400);
    const row = page.locator("#list-body tr", { hasText: TARGET_CONTACT_NAME }).filter({ hasText: "Voorgesteld" }); // status-disambiguated: other same-named rows from earlier runs are Cancelled
    await row.getByRole("button", { name: "Bewerken" }).click();
    await page.waitForTimeout(500);

    // Exactly one item for OUR tagged note, not duplicated by the reload.
    // (A resolved leftover note from an earlier interrupted iteration may
    // also be present in the Active+Resolved detail view — see the
    // TEST-ENV CLEANUP test above — so the total item count is not
    // asserted here, only our own tagged note's uniqueness.)
    const ourItem = page.locator(".critical-note-item", { hasText: H17_DETAIL });
    await expect(ourItem).toHaveCount(1);
    await expect(ourItem).toContainText("Opgelost");

    const ourNotes = await prisma.reservationCriticalNote.findMany({ where: { reservationId: TARGET_RESERVATION_ID, detail: H17_DETAIL } });
    expect(ourNotes).toHaveLength(1);
    expect(ourNotes[0]!.status).toBe("Resolved");
    await page.locator("#cancel-edit").click();
  });

  test("Z — browser/runtime error summary for this run", async () => {
    console.log("PAGE_ERRORS", JSON.stringify(pageErrors.map((e) => e.message)));
    console.log("FAILED_REQUESTS", JSON.stringify(failedRequests));
    console.log("I5_TEST_CRITICAL_NOTE_ID", i5NoteId);
  });
});
