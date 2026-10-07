import { defineConfig, devices } from "@playwright/test";

/**
 * R1.5-P7-D — Playwright config for the ISOLATED Reception UX environment
 * only: the second app instance on 127.0.0.1:3002 backed by
 * helix_reservations_ux (see .env.ux.example / ops/ux/). Deliberately a
 * separate config and test directory, so the default suite
 * (playwright.config.ts → tests/e2e, 127.0.0.1:3001 / helix_reservations_dev)
 * never runs these specs and these specs never target the dev instance.
 * Like the default config, it does not start/stop the server.
 */
export default defineConfig({
  testDir: "./tests/e2e-ux",
  timeout: 60_000,
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:3002",
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
