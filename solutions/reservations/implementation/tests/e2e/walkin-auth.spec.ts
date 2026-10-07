import { test, expect } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import fs from "node:fs";
import { deleteE2EReservationAndContact } from "./support/e2eCleanup.js";
import { classifyWalkInMessage } from "./support/walkInOutcome.js";

/**
 * R1.5-P5 — P5-A: Walk-in 401/403 error-handling coverage (H1).
 *
 * The 401/403 scenarios use Playwright's own response interception
 * (page.route) rather than a real expired session or a real permission
 * gap — no role currently lacks reservation.walkin.create (every defined
 * role holds it), and the directive explicitly forbids deliberately
 * invalidating the shared pilot account's real session merely to test
 * this. Interception exercises the exact client-side branch this
 * increment changed (what the UI does with a given 401/403 response),
 * in total isolation from the real session/database. The normal-success
 * scenario is real and unmocked, proving the fix didn't change ordinary
 * behavior, with its one synthetic record cleaned up afterward.
 */
function loadDatabaseUrl(): string {
  const content = fs.readFileSync(".env", "utf8");
  const line = content.split("\n").find((l) => l.trim().startsWith("DATABASE_URL"))!;
  return line.slice(line.indexOf("=") + 1).trim().replace(/^"(.*)"$/, "$1");
}
const prisma = new PrismaClient({ datasourceUrl: loadDatabaseUrl() });
const RECEPTION_USERNAME = "resetcheck";
const RECEPTION_PASSWORD = process.env["HELIX_PILOT_TEST_PASSWORD"];
const WALKIN_ENDPOINT = "**/availability/reservations/walk-in";

test.describe("R1.5-P5 — P5-A: Walk-in 401/403 error handling", () => {
  test("401 shows a clear Dutch re-login message, never the raw backend string, and transitions to the login gate", async ({ page }) => {
    test.skip(!RECEPTION_PASSWORD, "HELIX_PILOT_TEST_PASSWORD not set in environment");
    await page.route(WALKIN_ENDPOINT, (route) =>
      route.fulfill({ status: 401, contentType: "application/json", body: JSON.stringify({ message: "Authentication required." }) })
    );

    await page.goto("/pilot.html");
    await page.fill("#login-username", RECEPTION_USERNAME);
    await page.fill("#login-password", RECEPTION_PASSWORD!);
    await page.click('#login-form button[type="submit"]');
    await expect(page.locator("#app-shell")).toBeVisible();

    await page.fill("#walkin-name", "R1.5-P5 walkin-401-probe");
    await page.fill("#walkin-party-size", "2");
    await page.selectOption("#walkin-area", "Sushi");
    await page.click("#walkin-submit");

    await expect(page.locator("#login-gate")).toBeVisible();
    await expect(page.locator("#login-message")).toContainText("Je sessie is niet meer geldig");
    const bodyText = await page.locator("body").innerText();
    expect(bodyText).not.toContain("Authentication required.");
  });

  test("403 shows a clear Dutch permission message, distinct from session expiry, and stays on the authenticated view", async ({ page }) => {
    test.skip(!RECEPTION_PASSWORD, "HELIX_PILOT_TEST_PASSWORD not set in environment");
    await page.route(WALKIN_ENDPOINT, (route) =>
      route.fulfill({ status: 403, contentType: "application/json", body: JSON.stringify({ message: "You do not have permission to perform this action." }) })
    );

    await page.goto("/pilot.html");
    await page.fill("#login-username", RECEPTION_USERNAME);
    await page.fill("#login-password", RECEPTION_PASSWORD!);
    await page.click('#login-form button[type="submit"]');
    await expect(page.locator("#app-shell")).toBeVisible();

    await page.fill("#walkin-name", "R1.5-P5 walkin-403-probe");
    await page.fill("#walkin-party-size", "2");
    await page.selectOption("#walkin-area", "Sushi");
    await page.click("#walkin-submit");

    // Distinct from the 401 case: stays authenticated, no login-gate transition.
    await expect(page.locator("#app-shell")).toBeVisible();
    await expect(page.locator("#login-gate")).toBeHidden();
    await expect(page.locator("#walkin-message")).toContainText("Je hebt geen rechten");
    const bodyText = await page.locator("body").innerText();
    expect(bodyText).not.toContain("You do not have permission to perform this action.");
  });

  test("normal Walk-in success path is unchanged (real, unmocked)", async ({ page }) => {
    test.skip(!RECEPTION_PASSWORD, "HELIX_PILOT_TEST_PASSWORD not set in environment");
    const uniqueName = `R1.5-P5 walkin-success ${Date.now()}`;
    let reservationId: string | undefined;
    let contactId: string | undefined;
    try {
      await page.goto("/pilot.html");
      await page.fill("#login-username", RECEPTION_USERNAME);
      await page.fill("#login-password", RECEPTION_PASSWORD!);
      await page.click('#login-form button[type="submit"]');
      await expect(page.locator("#app-shell")).toBeVisible();

      await page.fill("#walkin-name", uniqueName);
      await page.fill("#walkin-party-size", "2");
      await page.selectOption("#walkin-area", "Sushi");
      // R1.5-P7-C1 — wait for the real response (no fixed sleep), then for the UI to render its outcome.
      const walkInResponse = page.waitForResponse((r) => r.request().method() === "POST" && new URL(r.url()).pathname === "/availability/reservations/walk-in");
      await page.click("#walkin-submit");
      const response = await walkInResponse;
      await expect(page.locator("#walkin-message")).not.toBeEmpty();

      // textContent (exactly what showMessage() set), not innerText, so CSS white-space never changes the compared text.
      const messageText = (await page.locator("#walkin-message").textContent()) ?? "";
      const messageClass = (await page.locator("#walkin-message").getAttribute("class")) ?? "";
      const outcome = classifyWalkInMessage(messageText, messageClass);
      // Walk-in has no date/time field at all — the server always uses
      // the REAL current instant (api/app.ts's own doc comment: "the
      // server alone establishes reservationDate/source/commandNow").
      // Two real, unchanged, correct server rejections are environment
      // prerequisites, not defects, and are the ONLY skips:
      //  - outside every ServicePeriod's real booking window (CAP-D02.01;
      //    e.g. a run at 22:17 on a weekday) — 422 servicePeriod;
      //  - R1.5-P7-C1: inside the window but no Opened ServiceSession for
      //    it (R1.6-P2C-1; the dev environment has none) — 409
      //    SESSION_NOT_OPEN. Nothing is written in either case.
      // Each skip is cross-checked against the actual HTTP status, so a
      // different error can never masquerade as an environment skip.
      if (outcome === "SKIP_OUTSIDE_BOOKING_WINDOW") {
        expect(response.status()).toBe(422);
        test.skip(true, `Real clock is currently outside every ServicePeriod's booking window — Walk-in correctly rejected (${messageText}). Re-run during real service hours to exercise the success path.`);
        return;
      }
      if (outcome === "SKIP_NO_OPENED_SESSION") {
        expect(response.status()).toBe(409);
        expect((await response.json()).type).toBe("SESSION_NOT_OPEN");
        test.skip(true, `No Opened ServiceSession in dev — Walk-in correctly rejected (${messageText}). Open the current service session to exercise the success path.`);
        return;
      }

      // Exact success only: "Walk-in niet geregistreerd: …" can never pass here.
      expect(outcome, `unexpected walk-in result (HTTP ${response.status()}): ${messageText} [${messageClass}]`).toBe("SUCCESS");
      expect(response.status()).toBe(201);
      const created = await prisma.reservation.findFirst({ where: { contactName: uniqueName } });
      expect(created).not.toBeNull();
      reservationId = created!.id;
      contactId = created!.contactId;
      expect(created!.sourceCategory).toBe("Walk-in");
    } finally {
      if (reservationId) await deleteE2EReservationAndContact(prisma, reservationId, contactId);
      await prisma.$disconnect();
    }
  });
});
