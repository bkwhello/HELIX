import { describe, it, expect, afterEach, afterAll } from "vitest";
import { createTestPrismaClient } from "./support/testDatabaseSafety.js";
import { ServiceCatalogManagementService } from "../../application/availability/ServiceCatalogManagementService.js";
import { PrismaServiceDefinitionRepository } from "../../infrastructure/persistence/PrismaServiceDefinitionRepository.js";
import { PrismaSecurityEventRecorder } from "../../infrastructure/persistence/PrismaSecurityEventRecorder.js";
import { PrismaTransactionManager } from "../../infrastructure/persistence/PrismaTransactionManager.js";
import { TransactionContext } from "../../domain/shared/TransactionContext.js";

/**
 * R1.6-P3G — real-PostgreSQL evidence for the transaction/concurrency
 * contract: the Service mutation and its one SecurityEvent commit or roll
 * back together (both directions), and concurrent PATCH-equivalent calls
 * for the SAME Service genuinely serialize at a real database row lock
 * (never an in-memory/timing-based proxy for that), while calls for
 * DIFFERENT Services remain fully independent. Every test either never
 * commits (poison-constraint tests always roll back, since the forced
 * write fails) or explicitly restores the two canonical `lunch`/`dinner`
 * rows and deletes its own fixture SecurityEvent rows afterward — the
 * shared canonical catalog is never left mutated for another test file.
 */
const prisma = createTestPrismaClient();
const prismaB = createTestPrismaClient();
const prismaC = createTestPrismaClient();

const repository = new PrismaServiceDefinitionRepository(prisma);
const recorder = new PrismaSecurityEventRecorder(prisma);
const transactionManager = new PrismaTransactionManager(prisma);
const service = new ServiceCatalogManagementService(repository, transactionManager, recorder);

const actingStaffUserIdsToClean = new Set<string>();
function actor(label: string): string {
  const id = `svc-audit-tx-${label}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  actingStaffUserIdsToClean.add(id);
  return id;
}

async function restoreCanonicalRows(): Promise<void> {
  await prisma.service.update({
    where: { code: "lunch" },
    data: { displayName: "Lunch", enabled: true, defaultStartMinute: 720, defaultEndMinute: 960, defaultDurationMinutes: null },
  });
  await prisma.service.update({
    where: { code: "dinner" },
    data: { displayName: "Dinner", enabled: true, defaultStartMinute: null, defaultEndMinute: null, defaultDurationMinutes: null },
  });
}

afterEach(async () => {
  await restoreCanonicalRows();
  if (actingStaffUserIdsToClean.size > 0) {
    await prisma.securityEvent.deleteMany({ where: { actingStaffUserId: { in: [...actingStaffUserIdsToClean] } } });
    actingStaffUserIdsToClean.clear();
  }
});

afterAll(async () => {
  await prisma.$disconnect();
  await prismaB.$disconnect();
  await prismaC.$disconnect();
});

describe("R1.6-P3G — fail-closed atomicity between the Service mutation and its SecurityEvent", () => {
  it("a forced SecurityEvent insertion failure rolls back the Service mutation — no partial commit", async () => {
    const POISON = "test_only_forbid_poison_actor";
    const poisonActorId = "poison-actor-id";
    await prisma.$executeRawUnsafe(`ALTER TABLE "security_events" ADD CONSTRAINT "${POISON}" CHECK ("acting_staff_user_id" <> '${poisonActorId}')`);
    try {
      const before = await repository.findByCode("lunch");
      await expect(service.update("lunch", { displayName: "Should Not Persist" }, poisonActorId)).rejects.toThrow();

      const after = await repository.findByCode("lunch");
      expect(after?.displayName).toBe(before?.displayName);
      expect(after?.updatedAt).toEqual(before?.updatedAt);

      const events = await prisma.securityEvent.findMany({ where: { actingStaffUserId: poisonActorId } });
      expect(events).toHaveLength(0);
    } finally {
      await prisma.$executeRawUnsafe(`ALTER TABLE "security_events" DROP CONSTRAINT IF EXISTS "${POISON}"`);
    }
  });

  it("a forced Service update failure inserts no SecurityEvent at all", async () => {
    const POISON = "test_only_forbid_poison_display_name";
    const poisonName = "POISON_DISPLAY_NAME_TEST_ONLY";
    await prisma.$executeRawUnsafe(`ALTER TABLE "services" ADD CONSTRAINT "${POISON}" CHECK ("display_name" <> '${poisonName}')`);
    try {
      const beforeEventCount = await prisma.securityEvent.count();
      const actingStaffUserId = actor("service-write-fails");
      await expect(service.update("dinner", { displayName: poisonName }, actingStaffUserId)).rejects.toThrow();

      const afterEventCount = await prisma.securityEvent.count();
      expect(afterEventCount).toBe(beforeEventCount);
      const dinner = await repository.findByCode("dinner");
      expect(dinner?.displayName).toBe("Dinner");
    } finally {
      await prisma.$executeRawUnsafe(`ALTER TABLE "services" DROP CONSTRAINT IF EXISTS "${POISON}"`);
    }
  });
});

/**
 * Database-state-based proof, not a timeout-based one (established
 * R1.5-P1B0 convention) — read from a THIRD connection uninvolved in
 * either transaction. A `SELECT ... FOR UPDATE` row lock in real
 * PostgreSQL is enforced via the tuple's own xmax, not a persistent
 * `pg_locks` "tuple" row for its holder; a SECOND transaction blocked on
 * that already-locked row instead waits on the holder's transaction id —
 * visible as a `locktype = 'transactionid'` row that is granted for the
 * holder's own xid and, for the very same xid, ungranted for the waiter.
 * This is the standard, documented PostgreSQL row-lock-contention
 * signature (see the "transactionid" case in the pg_locks documentation),
 * and is what this poll waits to observe.
 */
async function waitForContendedServicesRowLock(maxAttempts = 150, intervalMs = 20): Promise<{ readonly granted: boolean }[]> {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const rows = await prismaC.$queryRaw<{ transactionid: string; granted: boolean }[]>`
      SELECT transactionid::text AS transactionid, granted FROM pg_locks WHERE locktype = 'transactionid'
    `;
    const byXid = new Map<string, { granted: boolean }[]>();
    for (const row of rows) {
      const list = byXid.get(row.transactionid) ?? [];
      list.push({ granted: row.granted });
      byXid.set(row.transactionid, list);
    }
    for (const group of byXid.values()) {
      if (group.some((r) => r.granted) && group.some((r) => !r.granted)) return group;
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
  throw new Error('Expected pg_locks to show a contended transactionid (a granted holder and an ungranted waiter on the SAME xid) within the bounded poll — never observed it.');
}

describe("R1.6-P3G — concurrent updates to the SAME Service serialize at the row lock", () => {
  it("pg_locks shows real contention on the 'lunch' row, and the second (queued) call's recorded old value reflects the first call's COMMITTED write, never a stale pre-lock read", async () => {
    const repoB = new PrismaServiceDefinitionRepository(prismaB);
    const recorderB = new PrismaSecurityEventRecorder(prismaB);
    const transactionManagerB = new PrismaTransactionManager(prismaB);
    const serviceB = new ServiceCatalogManagementService(repoB, transactionManagerB, recorderB);

    const actorA = actor("same-service-a");
    const actorB = actor("same-service-b");

    let releaseA: () => void;
    const gate = new Promise<void>((resolve) => {
      releaseA = resolve;
    });

    // Transaction A: locks the row via the real repository method, then
    // deterministically pauses (holding the lock open) before writing its
    // own change and its own audit event — mirrors the exact
    // lock-then-read-then-write sequence ServiceCatalogManagementService
    // itself performs, just with an explicit test-controlled pause point
    // production code has no reason to have.
    const txA = prisma.$transaction(async (tx) => {
      const ctx = tx as TransactionContext;
      await repository.lockAndFindByCode("lunch", ctx);
      await gate;
      await repository.update("lunch", { displayName: "A-FIRST" }, ctx);
      await recorder.recordServiceModified(
        { actingStaffUserId: actorA, metadata: { serviceCode: "lunch", changes: { displayName: { old: "Lunch", new: "A-FIRST" } } } },
        ctx
      );
    });

    // Transaction B: a REAL, unmodified production call — proving the
    // actual application service, not a hand-rolled mirror, genuinely
    // queues behind A's real row lock. Started BEFORE polling for
    // contention, so there is something for B's own lock request to
    // contend with in the first place.
    const txB = serviceB.update("lunch", { displayName: "B-SECOND" }, actorB);

    const contended = await waitForContendedServicesRowLock();
    expect(contended.some((r) => r.granted)).toBe(true);
    expect(contended.some((r) => !r.granted)).toBe(true);

    releaseA!();
    await txA;
    const resultB = await txB;

    expect(resultB).toMatchObject({ type: "UPDATED", service: { code: "lunch", displayName: "B-SECOND" } });

    const finalRow = await repository.findByCode("lunch");
    expect(finalRow?.displayName).toBe("B-SECOND");

    const events = await prisma.securityEvent.findMany({
      where: { actingStaffUserId: { in: [actorA, actorB] } },
      orderBy: { occurredAt: "asc" },
    });
    expect(events).toHaveLength(2);
    const metaA = JSON.parse(events[0]!.metadata!);
    const metaB = JSON.parse(events[1]!.metadata!);
    expect(metaA.changes.displayName).toEqual({ old: "Lunch", new: "A-FIRST" });
    // The decisive proof: B's own recorded "old" value is "A-FIRST" (A's
    // committed write), never "Lunch" (a stale read taken before A's
    // lock). This is only possible if B's lockAndFindByCode call
    // genuinely blocked until AFTER A committed.
    expect(metaB.changes.displayName).toEqual({ old: "A-FIRST", new: "B-SECOND" });
  }, 20_000);
});

describe("R1.6-P3G — concurrent updates to different Services remain fully independent", () => {
  it("simultaneous updates to 'lunch' and 'dinner' never share state or metadata", async () => {
    const repoB = new PrismaServiceDefinitionRepository(prismaB);
    const recorderB = new PrismaSecurityEventRecorder(prismaB);
    const transactionManagerB = new PrismaTransactionManager(prismaB);
    const serviceB = new ServiceCatalogManagementService(repoB, transactionManagerB, recorderB);

    const actorLunch = actor("diff-service-lunch");
    const actorDinner = actor("diff-service-dinner");

    const [resultLunch, resultDinner] = await Promise.all([
      service.update("lunch", { displayName: "Concurrent Lunch" }, actorLunch),
      serviceB.update("dinner", { displayName: "Concurrent Dinner" }, actorDinner),
    ]);

    expect(resultLunch).toMatchObject({ type: "UPDATED", service: { code: "lunch", displayName: "Concurrent Lunch" } });
    expect(resultDinner).toMatchObject({ type: "UPDATED", service: { code: "dinner", displayName: "Concurrent Dinner" } });

    const events = await prisma.securityEvent.findMany({ where: { actingStaffUserId: { in: [actorLunch, actorDinner] } } });
    expect(events).toHaveLength(2);
    const lunchEvent = events.find((e) => e.actingStaffUserId === actorLunch);
    const dinnerEvent = events.find((e) => e.actingStaffUserId === actorDinner);
    expect(JSON.parse(lunchEvent!.metadata!).serviceCode).toBe("lunch");
    expect(JSON.parse(dinnerEvent!.metadata!).serviceCode).toBe("dinner");
    expect(JSON.parse(lunchEvent!.metadata!).changes).not.toHaveProperty("dinner");
    expect(JSON.parse(dinnerEvent!.metadata!).changes).not.toHaveProperty("lunch");
  });
});
