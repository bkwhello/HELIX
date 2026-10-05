import { defineConfig, devices } from "@playwright/test";

/**
 * R1.4-I3 — smallest maintainable browser/E2E capability for the HELIX
 * Reservations pilot UI. Chromium only (no Firefox/WebKit — not needed
 * for this capability). Assumes the real dev server
 * (`npm start`/`npm run dev`, DATABASE_URL = helix_reservations_dev) is
 * already running at `baseURL` — this config deliberately does not
 * start/stop it, so a test run never has an unintended side effect on
 * which process owns the dev database connection.
 */
export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30_000,
  fullyParallel: false,
  // R1.4-I7 — all spec files share ONE real dev server + ONE real
  // database (helix_reservations_dev), not a disposable per-worker
  // database. Running different spec files concurrently (Playwright's
  // default across >1 worker) let reception-functional.spec.ts's T8 and
  // critical-notes.spec.ts's fixed-date row locators collide on the same
  // calendar date at the same time, producing a real strict-mode
  // violation that has nothing to do with either suite's own logic.
  // Forcing one worker makes the whole E2E run strictly sequential,
  // matching how this capability has always actually been exercised.
  workers: 1,
  retries: 0,
  reporter: "list",
  use: {
    baseURL: "http://localhost:3001",
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
