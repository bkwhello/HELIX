import { test, expect } from "@playwright/test";

/**
 * R1.4-I3 — the one authorized smoke test for this milestone: prove
 * Playwright can launch a real Chromium browser and execute the actual
 * pilot page, and that initialization completes with no uncaught
 * JavaScript error (in particular, no recurrence of the
 * `editingReservationId` temporal-dead-zone `ReferenceError` the
 * approved `pilot.html` fix addresses). Deliberately does not log in,
 * does not create a reservation, and does not touch business data —
 * that is explicitly out of scope for this capability-validation
 * milestone (see R1.4-I4).
 */
test("pilot.html loads in a real browser with no uncaught JavaScript error, and the login UI is present", async ({ page }) => {
  const pageErrors: Error[] = [];
  page.on("pageerror", (err) => pageErrors.push(err));

  const response = await page.goto("/pilot.html");
  expect(response?.status()).toBe(200);

  // Login UI exists and is the thing actually visible (app-shell stays
  // hidden until an authenticated session is established).
  await expect(page.locator("#login-gate")).toBeVisible();
  await expect(page.locator("#login-username")).toBeVisible();
  await expect(page.locator("#login-password")).toBeVisible();
  await expect(page.locator('#login-form button[type="submit"]')).toBeVisible();

  // The specific regression this capability exists to catch.
  const tdzError = pageErrors.find((err) => err.message.includes("Cannot access 'editingReservationId' before initialization"));
  expect(tdzError, `TDZ ReferenceError detected: ${tdzError?.message}`).toBeUndefined();

  // No uncaught JavaScript error of any kind during initialization.
  expect(pageErrors, `Uncaught page error(s): ${pageErrors.map((e) => e.message).join("; ")}`).toHaveLength(0);
});
