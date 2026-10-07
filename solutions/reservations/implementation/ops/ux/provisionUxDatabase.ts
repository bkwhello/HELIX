/**
 * R1.5-P7-D — one-time provisioning of the isolated Reception UX database.
 * Run via `npm run ux:provision` (loads .env.ux; never .env's DATABASE_URL).
 *
 *  1. Static gate: DATABASE_URL must be loopback, port 5433, database name
 *     exactly `helix_reservations_ux` (anything else — notably
 *     helix_reservations_dev — is refused before any connection is made).
 *  2. Creates that database on the EXISTING cluster if it does not exist
 *     (via the `postgres` maintenance database; never DROP, never another
 *     database name).
 *  3. Live gate: the new connection must report current_database() =
 *     helix_reservations_ux.
 *  4. Applies the application's real Prisma migrations (`prisma migrate
 *     deploy`) to it — the schema is never recreated by hand.
 *  5. Creates the `_ux_dataset_sentinel` marker. This is the ONLY place the
 *     sentinel is ever created, so seed/teardown can never bless their own
 *     target (same rule as ops/testDatabaseSetup.ts).
 * Idempotent: re-running on an already-provisioned UX database changes
 * nothing except applying any newer migrations.
 */
import { PrismaClient } from "@prisma/client";
import { spawnSync } from "node:child_process";
import { readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { assertConnectedToUxDatabase, assertUxDatabaseUrl, createPrismaUxIdentityReader, UX_DATABASE_NAME, UX_SENTINEL_TABLE } from "./uxSafety.js";

const IMPLEMENTATION_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

export async function provisionUxDatabase(databaseUrl: string): Promise<{ created: boolean; migrationsApplied: number; migrationsOnDisk: number }> {
  assertUxDatabaseUrl(databaseUrl);

  const maintenanceUrl = new URL(databaseUrl);
  maintenanceUrl.pathname = "/postgres";
  const maintenance = new PrismaClient({ datasourceUrl: maintenanceUrl.toString() });
  let created = false;
  try {
    const existing = await maintenance.$queryRawUnsafe<{ n: number }[]>("SELECT count(*)::int AS n FROM pg_database WHERE datname = $1", UX_DATABASE_NAME);
    if ((existing[0]?.n ?? 0) === 0) {
      // Identifier is the compile-time constant above, never caller input.
      await maintenance.$executeRawUnsafe(`CREATE DATABASE "${UX_DATABASE_NAME}"`);
      created = true;
    }
  } finally {
    await maintenance.$disconnect();
  }

  const ux = new PrismaClient({ datasourceUrl: databaseUrl });
  try {
    await assertConnectedToUxDatabase(createPrismaUxIdentityReader(ux));
  } finally {
    await ux.$disconnect();
  }

  const migrate = spawnSync("npx", ["prisma", "migrate", "deploy"], {
    cwd: IMPLEMENTATION_ROOT,
    env: { ...process.env, DATABASE_URL: databaseUrl },
    encoding: "utf8",
    shell: true,
  });
  if (migrate.status !== 0) throw new Error(`prisma migrate deploy failed against ${UX_DATABASE_NAME}:\n${migrate.stdout}\n${migrate.stderr}`);

  const verify = new PrismaClient({ datasourceUrl: databaseUrl });
  try {
    await assertConnectedToUxDatabase(createPrismaUxIdentityReader(verify));
    await verify.$executeRawUnsafe(
      `CREATE TABLE IF NOT EXISTS "${UX_SENTINEL_TABLE}" (
         id integer PRIMARY KEY CHECK (id = 1),
         provisioned_at timestamptz NOT NULL DEFAULT now(),
         seeding_started_at timestamptz,
         seeded_at timestamptz,
         dataset_date text,
         dataset_version text
       )`
    );
    await verify.$executeRawUnsafe(`INSERT INTO "${UX_SENTINEL_TABLE}" (id) VALUES (1) ON CONFLICT (id) DO NOTHING`);
    const applied = await verify.$queryRawUnsafe<{ n: number }[]>(`SELECT count(*)::int AS n FROM "_prisma_migrations" WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL`);
    const onDisk = readdirSync(path.join(IMPLEMENTATION_ROOT, "prisma", "migrations"), { withFileTypes: true }).filter((d) => d.isDirectory()).length;
    return { created, migrationsApplied: applied[0]?.n ?? 0, migrationsOnDisk: onDisk };
  } finally {
    await verify.$disconnect();
  }
}

async function main(): Promise<void> {
  const result = await provisionUxDatabase(assertUxDatabaseUrl(process.env["DATABASE_URL"]));
  console.log(
    `ux:provision OK — ${UX_DATABASE_NAME} ${result.created ? "created" : "already existed"}; migrations applied ${result.migrationsApplied}/${result.migrationsOnDisk} on disk; sentinel ${UX_SENTINEL_TABLE} present.`
  );
  if (result.migrationsApplied !== result.migrationsOnDisk) process.exitCode = 1;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exitCode = 1;
  });
}
