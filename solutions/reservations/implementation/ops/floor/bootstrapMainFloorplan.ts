import { PrismaClient } from "@prisma/client";
import { PrismaTransactionManager, asPrismaTx } from "../../infrastructure/persistence/PrismaTransactionManager.js";
import { PrismaFloorplanRepository } from "../../infrastructure/persistence/PrismaFloorplanRepository.js";
import { RandomIdGenerator } from "../../infrastructure/RandomIdGenerator.js";
import {
  planMainFloorplanBootstrap,
  MAIN_FLOOR_ID,
  MAIN_FLOOR_NAME,
  MAIN_FLOOR_VERSION_ID,
  MAIN_FLOOR_REVISION,
  BOOTSTRAP_SYSTEM_ACTOR_ID,
  EXPECTED_TABLE_IDS,
} from "./mainFloorplanBootstrapPlan.js";
import { resolveSeedFloorplanDatabaseUrl, assertSafeSeedFloorplanTarget, createPrismaIdentityReader } from "./seedFloorplanSafety.js";

/**
 * R1.5-P2B-B — Main Floor Bootstrap Tooling.
 *
 * Bootstraps exactly one Floorplan ("main-floor" / "Main Floor"), its
 * first Published version ("main-floor-v1", revision 1) with membership
 * set to all 23 canonical Tables, and sets it as the Floorplan's default —
 * all inside ONE transaction (requirement 8/10: verify inventory, create
 * Floorplan, create version, insert memberships, publish, set default; any
 * failure rolls back everything). Never uses the HTTP API and never
 * requires a staff login (requirement 15) — it talks directly to
 * PrismaFloorplanRepository, the same tested, lock-protected adapter the
 * API routes use, just without an Express/session layer in front of it.
 *
 * Idempotent rerun: if the exact accepted bootstrap already exists, this
 * is a no-op (createdAt/publishedAt untouched, no duplicate rows). Drift
 * in any material field (name, revision, status, membership set, default
 * selection) is rejected with zero writes, never repaired automatically.
 * See mainFloorplanBootstrapPlan.ts for the full, pure decision logic.
 *
 * Membership-row ids use RandomIdGenerator (not a deterministic scheme) —
 * requirement 9's "otherwise" branch: this schema exposes no safe
 * deterministic derivation for FloorplanVersionResource.id, so rerun
 * identity is proven instead via the composite unique key
 * (floorplanVersionId, tableId), which is exactly what the drift check
 * above compares.
 */
export type BootstrapMainFloorplanResult =
  | { readonly outcome: "CREATED"; readonly floorplanId: string; readonly versionId: string; readonly tableIds: readonly string[] }
  | { readonly outcome: "ALREADY_BOOTSTRAPPED"; readonly floorplanId: string; readonly versionId: string; readonly tableIds: readonly string[] };

export class FloorplanBootstrapInventoryError extends Error {
  constructor(message: string) {
    super(`Refusing Main Floor bootstrap — Table/Seat inventory mismatch: ${message}`);
    this.name = "FloorplanBootstrapInventoryError";
  }
}

export class FloorplanBootstrapDriftError extends Error {
  constructor(message: string) {
    super(`Refusing Main Floor bootstrap — an existing row differs from the expected bootstrap shape: ${message}`);
    this.name = "FloorplanBootstrapDriftError";
  }
}

export async function bootstrapMainFloorplan(databaseUrl: string): Promise<BootstrapMainFloorplanResult> {
  const prisma = new PrismaClient({ datasourceUrl: databaseUrl });
  try {
    const transactionManager = new PrismaTransactionManager(prisma);
    const floorplanRepository = new PrismaFloorplanRepository(prisma);
    const idGenerator = new RandomIdGenerator();

    return await transactionManager.runInTransaction(async (tx) => {
      const client = asPrismaTx(tx);

      // All-or-nothing from the very first read: the lock is acquired
      // before anything else, so no concurrent bootstrap/edit of this
      // same Floorplan can interleave with this transaction.
      await floorplanRepository.acquireFloorplanLock({ floorplanId: MAIN_FLOOR_ID, tx });

      const tables = await client.table.findMany({ select: { id: true, status: true } });
      const seats = await client.seat.findMany({ select: { id: true, tableId: true } });

      const existingFloorplan = await floorplanRepository.findFloorplanById(MAIN_FLOOR_ID, tx);
      const existingVersion = existingFloorplan ? await floorplanRepository.findVersionById(MAIN_FLOOR_VERSION_ID, tx) : null;
      const existingMembers = existingVersion ? await floorplanRepository.listMembers(MAIN_FLOOR_VERSION_ID, tx) : null;

      const plan = planMainFloorplanBootstrap({
        tables,
        seats,
        existingFloorplan: existingFloorplan
          ? { name: existingFloorplan.name, defaultVersionId: existingFloorplan.defaultVersionId }
          : null,
        existingVersion: existingVersion
          ? { floorplanId: existingVersion.floorplanId, revision: existingVersion.revision, status: existingVersion.status }
          : null,
        existingMemberTableIds: existingMembers ? existingMembers.map((m) => m.tableId) : null,
      });

      if (plan.action === "REJECT_INVENTORY") {
        throw new FloorplanBootstrapInventoryError(plan.reason);
      }
      if (plan.action === "REJECT_DRIFT") {
        throw new FloorplanBootstrapDriftError(plan.reason);
      }
      if (plan.action === "NOOP") {
        return { outcome: "ALREADY_BOOTSTRAPPED", floorplanId: MAIN_FLOOR_ID, versionId: MAIN_FLOOR_VERSION_ID, tableIds: EXPECTED_TABLE_IDS };
      }

      // plan.action === "CREATE"
      const now = new Date();
      await floorplanRepository.createFloorplan({ id: MAIN_FLOOR_ID, name: MAIN_FLOOR_NAME, createdAt: now, tx });
      await floorplanRepository.createVersion({
        id: MAIN_FLOOR_VERSION_ID,
        floorplanId: MAIN_FLOOR_ID,
        revision: MAIN_FLOOR_REVISION,
        createdBy: BOOTSTRAP_SYSTEM_ACTOR_ID,
        createdAt: now,
        tx,
      });
      const newRowIds = EXPECTED_TABLE_IDS.map(() => idGenerator.generate());
      await floorplanRepository.replaceMembers({ floorplanVersionId: MAIN_FLOOR_VERSION_ID, tableIds: EXPECTED_TABLE_IDS, newRowIds, tx });
      await floorplanRepository.updateVersionStatus({ id: MAIN_FLOOR_VERSION_ID, newStatus: "Published", publishedAt: now, tx });
      await floorplanRepository.setDefaultVersion({ floorplanId: MAIN_FLOOR_ID, versionId: MAIN_FLOOR_VERSION_ID, tx });

      return { outcome: "CREATED", floorplanId: MAIN_FLOOR_ID, versionId: MAIN_FLOOR_VERSION_ID, tableIds: EXPECTED_TABLE_IDS };
    });
  } finally {
    await prisma.$disconnect();
  }
}

/** CLI entry point — mirrors seedFloor.ts's own main()/isDirectRun structure exactly. Never prints a password, connection string, or secret-derived value. */
export async function main(): Promise<void> {
  const databaseUrl = resolveSeedFloorplanDatabaseUrl();
  await assertSafeSeedFloorplanTarget(createPrismaIdentityReader(databaseUrl));
  const result = await bootstrapMainFloorplan(databaseUrl);
  console.log(`Main Floor bootstrap: ${result.outcome} (floorplanId=${result.floorplanId}, versionId=${result.versionId}, tables=${result.tableIds.length})`);
}

const isDirectRun = process.argv[1]?.endsWith("bootstrapMainFloorplan.ts") || process.argv[1]?.endsWith("bootstrapMainFloorplan.js");
if (isDirectRun) {
  main().catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exitCode = 1;
  });
}
