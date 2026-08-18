import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // CAP-D02.03 integration tests (tests/integration/**) share ONE real
    // PostgreSQL database and TRUNCATE it in beforeEach — running test
    // files in parallel would let one file's reset wipe rows another
    // file is mid-assertion on. The whole suite is small enough that
    // running files serially costs negligible wall-clock time.
    fileParallelism: false,
  },
});
