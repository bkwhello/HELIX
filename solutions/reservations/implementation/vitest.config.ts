import { defineConfig, configDefaults } from "vitest/config";

export default defineConfig({
  test: {
    // CAP-D02.03 integration tests (tests/integration/**) share ONE real
    // PostgreSQL database and TRUNCATE it in beforeEach — running test
    // files in parallel would let one file's reset wipe rows another
    // file is mid-assertion on. The whole suite is small enough that
    // running files serially costs negligible wall-clock time.
    fileParallelism: false,
    // R1.4-I3 — tests/e2e/** runs under Playwright's own test runner
    // (playwright.config.ts), a real browser, not vitest's. Without this
    // exclude, vitest's own default glob would also try to collect those
    // files and fail on @playwright/test's incompatible test()/expect().
    exclude: [...configDefaults.exclude, "tests/e2e/**", "tests/e2e-ux/**"],
  },
});
