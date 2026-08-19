/**
 * CAP-D03.03 — idempotent floor seeding, from the authoritative
 * infrastructure/floor/floorSeedData.ts. Run via `npm run seed-floor`
 * (reads DATABASE_URL) or `SEED_FLOOR_DATABASE_URL=... tsx ops/floor/seedFloor.ts`
 * for a specific target (e.g. a test/recovery database).
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

async function main(): Promise<void> {
  const databaseUrl = process.env["SEED_FLOOR_DATABASE_URL"] ?? process.env["DATABASE_URL"];
  if (!databaseUrl) {
    console.error("seedFloor: neither SEED_FLOOR_DATABASE_URL nor DATABASE_URL is set.");
    process.exitCode = 1;
    return;
  }
  const result = await seedFloor(databaseUrl);
  console.log(`seedFloor: upserted ${result.tablesUpserted} tables, ${result.seatsUpserted} seats.`);
}

const isDirectRun = process.argv[1]?.endsWith("seedFloor.ts") || process.argv[1]?.endsWith("seedFloor.js");
if (isDirectRun) {
  main().catch((err) => {
    console.error("seedFloor: failed —", err);
    process.exitCode = 1;
  });
}
