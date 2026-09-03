/**
 * CAP-D03.03 — idempotent floor seeding, from the authoritative
 * infrastructure/floor/floorSeedData.ts.
 *
 * Invocation contract (P1-B4-D1 — see seedFloorSafety.ts for the full
 * reasoning): `npm run seed-floor` requires BOTH, set explicitly —
 *
 *   SEED_FLOOR_DATABASE_URL=postgresql://.../helix_reservations_dev?schema=public
 *   SEED_FLOOR_CONFIRM_DATABASE=helix_reservations_dev
 *
 * There is no DATABASE_URL fallback — a shell with only DATABASE_URL set
 * (the general application/pilot connection string) fails closed with a
 * clear error, exactly the same as a shell with nothing set. The
 * confirmation variable must name the approved target exactly; the
 * connected database is then independently re-verified via a live
 * `SELECT current_database()` before any Table/Seat upsert runs. Any
 * mismatch at any step refuses the operation before a single write.
 *
 * The exported seedFloor() function itself carries none of this guard —
 * it is unconditionally called with an already-decided, caller-supplied
 * databaseUrl, exactly as before this change (existing test call sites
 * against TEST_DATABASE_URL are unaffected; the guard applies only to
 * the `npm run seed-floor` CLI entry point below).
 *
 * Idempotent by design (upsert on the deterministic ids in
 * floorSeedData.ts) — safe to run more than once against the same
 * database; never creates duplicates, never deletes/renames a resource
 * that already exists with a different current state (this script only
 * ever upserts the fixed, authoritative shape — it is not a general
 * floor-editing tool).
 */
import { PrismaClient } from "@prisma/client";
import { ALL_TABLES, seatId, seatOperationalLabel } from "../../infrastructure/floor/floorSeedData.js";
import { resolveSeedFloorDatabaseUrl, assertSafeSeedFloorTarget, createPrismaIdentityReader } from "./seedFloorSafety.js";

export async function seedFloor(databaseUrl: string): Promise<{ tablesUpserted: number; seatsUpserted: number }> {
  const prisma = new PrismaClient({ datasourceUrl: databaseUrl });
  let tablesUpserted = 0;
  let seatsUpserted = 0;
  try {
    for (const table of ALL_TABLES) {
      await prisma.table.upsert({
        where: { id: table.id },
        create: {
          id: table.id,
          areaId: table.areaId,
          operationalLabel: table.operationalLabel,
          nominalCapacity: table.nominalCapacity,
          supportsSharedSeating: table.supportsSharedSeating,
        },
        update: {
          areaId: table.areaId,
          operationalLabel: table.operationalLabel,
          nominalCapacity: table.nominalCapacity,
          supportsSharedSeating: table.supportsSharedSeating,
        },
      });
      tablesUpserted += 1;

      for (const suffix of table.seats ?? []) {
        const id = seatId(table.id, suffix);
        await prisma.seat.upsert({
          where: { id },
          create: { id, tableId: table.id, operationalLabel: seatOperationalLabel(table, suffix) },
          update: { operationalLabel: seatOperationalLabel(table, suffix) },
        });
        seatsUpserted += 1;
      }
    }
    return { tablesUpserted, seatsUpserted };
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Exported (not merely invoked at the bottom of this file) so tests can
 * call it directly against a safe, real, non-dev database to prove the
 * guard actually refuses before any write — mirrors
 * ops/restore/restoreBackup.ts's own exported main entry point
 * (`restoreBackup`), which tests/ops/restore-and-integrity.test.ts
 * already calls the same way. Reads process.env directly, same
 * convention as that precedent.
 */
export async function main(): Promise<void> {
  // Ordering is the safety property (P1-B4-D1): every guard below must
  // resolve without throwing BEFORE seedFloor() — the actual Table/Seat
  // upsert loop — is ever called. resolveSeedFloorDatabaseUrl() and
  // assertSafeSeedFloorTarget() perform only reads (env lookups, and one
  // read-only `SELECT current_database()`) — no floor-data write is
  // reachable until both have already succeeded.
  const databaseUrl = resolveSeedFloorDatabaseUrl();
  await assertSafeSeedFloorTarget(createPrismaIdentityReader(databaseUrl));

  const result = await seedFloor(databaseUrl);
  console.log(`seedFloor: upserted ${result.tablesUpserted} tables, ${result.seatsUpserted} seats.`);
}

const isDirectRun = process.argv[1]?.endsWith("seedFloor.ts") || process.argv[1]?.endsWith("seedFloor.js");
if (isDirectRun) {
  main().catch((err) => {
    console.error("seedFloor: refused or failed —", err instanceof Error ? err.message : err);
    process.exitCode = 1;
  });
}
