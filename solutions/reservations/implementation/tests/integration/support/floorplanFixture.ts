import { randomUUID } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { PrismaFloorplanRepository } from "../../../infrastructure/persistence/PrismaFloorplanRepository.js";
import { PrismaTransactionManager } from "../../../infrastructure/persistence/PrismaTransactionManager.js";

/**
 * R1.5-P2C — creates a fresh, uniquely-identified Floorplan with exactly
 * one Published version (revision 1, given membership) and sets it as the
 * default. For ServiceSession snapshot tests that need a real, eligible
 * default WITHOUT touching the shared "main-floor" identity
 * (domain/floor/Floorplan.ts's MAIN_FLOORPLAN_ID) that
 * tests/ops/main-floorplan-bootstrap.test.ts owns exclusively — every
 * caller here supplies its own distinct `floorplanId`, so this never
 * collides with that file's own literal "main-floor" mutations regardless
 * of vitest's file execution order.
 */
export async function createPublishedFloorplanFixture(
  prisma: PrismaClient,
  input: { readonly floorplanId: string; readonly tableIds: readonly string[] }
): Promise<{ readonly floorplanId: string; readonly versionId: string }> {
  const repo = new PrismaFloorplanRepository(prisma);
  const transactionManager = new PrismaTransactionManager(prisma);
  return transactionManager.runInTransaction(async (tx) => {
    await repo.createFloorplan({ id: input.floorplanId, name: `Fixture ${input.floorplanId}`, createdAt: new Date(), tx });
    const versionId = `${input.floorplanId}-v1`;
    await repo.createVersion({ id: versionId, floorplanId: input.floorplanId, revision: 1, createdBy: "test-fixture", createdAt: new Date(), tx });
    await repo.replaceMembers({
      floorplanVersionId: versionId,
      tableIds: input.tableIds,
      newRowIds: input.tableIds.map(() => randomUUID()),
      tx,
    });
    await repo.updateVersionStatus({ id: versionId, newStatus: "Published", publishedAt: new Date(), tx });
    await repo.setDefaultVersion({ floorplanId: input.floorplanId, versionId, tx });
    return { floorplanId: input.floorplanId, versionId };
  });
}

/**
 * Publishes a NEW revision under an existing fixture Floorplan and sets it
 * as the new default — for "the global default changed" scenarios.
 * Acquires the SAME Tier-1.4 floorplan advisory lock FloorplanService's
 * own mutating methods acquire, so a race between this and
 * ServiceSessionService.open() (which acquires the identical lock first)
 * is a genuine, real-lock-serialized race, not merely two independent
 * transactions that happen not to conflict.
 */
export async function publishNewDefaultVersion(
  prisma: PrismaClient,
  input: { readonly floorplanId: string; readonly revision: number; readonly tableIds: readonly string[] }
): Promise<{ readonly versionId: string }> {
  const repo = new PrismaFloorplanRepository(prisma);
  const transactionManager = new PrismaTransactionManager(prisma);
  return transactionManager.runInTransaction(async (tx) => {
    await repo.acquireFloorplanLock({ floorplanId: input.floorplanId, tx });
    const versionId = `${input.floorplanId}-v${input.revision}`;
    await repo.createVersion({ id: versionId, floorplanId: input.floorplanId, revision: input.revision, createdBy: "test-fixture", createdAt: new Date(), tx });
    await repo.replaceMembers({
      floorplanVersionId: versionId,
      tableIds: input.tableIds,
      newRowIds: input.tableIds.map(() => randomUUID()),
      tx,
    });
    await repo.updateVersionStatus({ id: versionId, newStatus: "Published", publishedAt: new Date(), tx });
    await repo.setDefaultVersion({ floorplanId: input.floorplanId, versionId, tx });
    return { versionId };
  });
}
