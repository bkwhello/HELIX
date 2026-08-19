/**
 * R1.4 P0 — one-time provisioning of the dedicated integration-test
 * database's safety sentinel. Run via `npm run setup-test-db`.
 *
 * This is the ONLY place `_test_database_sentinel` is ever created or
 * marked true — tests/integration/support/testDatabaseSafety.ts's
 * `assertSafeToReset` only ever READS it. A gate that could bless its
 * own target on the fly would not be a gate; provisioning is
 * deliberately a separate, explicit, human-invoked step.
 *
 * Reads ONLY TEST_DATABASE_URL, never DATABASE_URL — same rule the
 * safety gate itself enforces, so a developer cannot accidentally stamp
 * the pilot/application database as a "safe to reset" test database by
 * running this script against the wrong connection string.
 */
import { PrismaClient } from "@prisma/client";
import { EXPECTED_TEST_DATABASE_NAME } from "../tests/integration/support/testDatabaseSafety.js";

async function main(): Promise<void> {
  const url = process.env["TEST_DATABASE_URL"];
  if (!url) {
    console.error("setup-test-db: TEST_DATABASE_URL is not set. Refusing to provision anything.");
    process.exitCode = 1;
    return;
  }
  const applicationUrl = process.env["DATABASE_URL"];
  if (applicationUrl && applicationUrl.trim() === url.trim()) {
    console.error(
      "setup-test-db: TEST_DATABASE_URL is identical to DATABASE_URL. Refusing to provision " +
        "the application/pilot database as a test sentinel."
    );
    process.exitCode = 1;
    return;
  }

  const prisma = new PrismaClient({ datasourceUrl: url });
  try {
    const rows = await prisma.$queryRawUnsafe<{ current_database: string }[]>(
      "SELECT current_database()"
    );
    const actualName = rows[0]?.current_database;
    if (actualName !== EXPECTED_TEST_DATABASE_NAME) {
      console.error(
        `setup-test-db: connected database "${String(actualName)}" does not match the ` +
          `expected test database name "${EXPECTED_TEST_DATABASE_NAME}". Refusing to ` +
          "provision the sentinel — this script only ever stamps the one, deliberately " +
          "named test database this project uses."
      );
      process.exitCode = 1;
      return;
    }

    await prisma.$executeRawUnsafe(
      `CREATE TABLE IF NOT EXISTS "_test_database_sentinel" (
         "id" TEXT PRIMARY KEY,
         "is_test_database" BOOLEAN NOT NULL,
         "label" TEXT NOT NULL,
         "provisioned_at" TIMESTAMPTZ NOT NULL DEFAULT now()
       )`
    );
    await prisma.$executeRawUnsafe(
      `INSERT INTO "_test_database_sentinel" ("id", "is_test_database", "label")
       VALUES ('sentinel', true, 'R1.4 P0 safety sentinel — provisioned by ops/testDatabaseSetup.ts')
       ON CONFLICT ("id") DO UPDATE SET "is_test_database" = true`
    );

    console.log(
      `setup-test-db: sentinel provisioned in "${actualName}". ` +
        "Destructive integration-test resets will now be permitted against this database."
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error("setup-test-db: failed —", err);
  process.exitCode = 1;
});
