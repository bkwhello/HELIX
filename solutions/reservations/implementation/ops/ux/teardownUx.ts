/**
 * R1.5-P7-D — UX-only teardown (`npm run ux:teardown`, loads .env.ux).
 * Clears every application table in helix_reservations_ux so ux:seed can run
 * again, keeping only the migration history, the provisioning sentinel and
 * the migration-seeded `services` catalog (reference data, not dataset).
 *
 * Refuses — before any statement — unless the URL is loopback:5433/
 * helix_reservations_ux AND the live connection reports exactly that database
 * AND the `_ux_dataset_sentinel` exists. It can therefore never reach
 * helix_reservations_dev, _test or _recovery. Never DROPs a database.
 */
import { PrismaClient } from "@prisma/client";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { assertProvisionedUxDatabase, assertUxDatabaseUrl, createPrismaUxIdentityReader, UX_DATABASE_NAME, UX_SENTINEL_TABLE } from "./uxSafety.js";

export const UX_TEARDOWN_KEEP_TABLES: ReadonlySet<string> = new Set(["_prisma_migrations", UX_SENTINEL_TABLE, "services"]);

export async function teardownUx(databaseUrl: string): Promise<{ truncatedTables: readonly string[] }> {
  assertUxDatabaseUrl(databaseUrl);
  const prisma = new PrismaClient({ datasourceUrl: databaseUrl });
  try {
    await assertProvisionedUxDatabase(createPrismaUxIdentityReader(prisma));
    const tables = (await prisma.$queryRawUnsafe<{ tablename: string }[]>("SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename"))
      .map((t) => t.tablename)
      .filter((t) => !UX_TEARDOWN_KEEP_TABLES.has(t));
    await prisma.$transaction(async (tx) => {
      // Re-check inside the same transaction/connection that runs the TRUNCATE.
      const live = await tx.$queryRawUnsafe<{ db: string }[]>("SELECT current_database() AS db");
      if (live[0]?.db !== UX_DATABASE_NAME) throw new Error(`refusing teardown: connected to "${live[0]?.db}"`);
      if (tables.length > 0) await tx.$executeRawUnsafe(`TRUNCATE TABLE ${tables.map((t) => `"${t}"`).join(", ")} RESTART IDENTITY CASCADE`);
      await tx.$executeRawUnsafe(`UPDATE "${UX_SENTINEL_TABLE}" SET seeding_started_at = NULL, seeded_at = NULL, dataset_date = NULL, dataset_version = NULL WHERE id = 1`);
    });
    return { truncatedTables: tables };
  } finally {
    await prisma.$disconnect();
  }
}

async function main(): Promise<void> {
  const result = await teardownUx(process.env["DATABASE_URL"] ?? "");
  console.log(`ux:teardown OK — cleared ${result.truncatedTables.length} tables in ${UX_DATABASE_NAME}; sentinel reset (ready for ux:seed).`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exitCode = 1;
  });
}
