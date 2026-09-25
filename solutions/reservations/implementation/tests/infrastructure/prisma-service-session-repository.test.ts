import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { createTestPrismaClient } from "../integration/support/testDatabaseSafety.js";
import { PrismaServiceSessionRepository } from "../../infrastructure/persistence/PrismaServiceSessionRepository.js";
import { TransactionContext } from "../../domain/shared/TransactionContext.js";
import { InvalidServiceOperatingIntervalError } from "../../domain/availability/ServiceOperatingInterval.js";

/**
 * R1.6-P3C-1 — real-PostgreSQL coverage for
 * `PrismaServiceSessionRepository`'s own `operatingIntervalSnapshot`
 * mapping and creation, plus a deterministic (not timing-only) proof
 * that the snapshot pair is never observed torn by a concurrent reader.
 *
 * `ServiceSession` rows are throwaway test data (never a "canonical"
 * row the way `services.lunch`/`services.dinner` are) — this file
 * follows the established per-file "narrow, disjoint date range,
 * deleted before every test" convention (see
 * service-catalog-migration.test.ts's own identical comment), using
 * 2029-02-* — a range no other test file in this suite uses — so a
 * re-run of this file alone is idempotent regardless of what any other
 * file's own date-range cleanup does or doesn't touch. No test here
 * ever touches the real `lunch`/`dinner` `services` rows.
 */
const prisma = createTestPrismaClient();
const repository = new PrismaServiceSessionRepository(prisma);
const P3C1_SESSION_DATES = ["2029-02-01", "2029-02-02", "2029-02-03"].map((d) => new Date(`${d}T00:00:00.000Z`));

beforeEach(async () => {
  await prisma.serviceSession.deleteMany({ where: { serviceDate: { in: P3C1_SESSION_DATES } } });
});
afterAll(async () => {
  await prisma.$disconnect();
});

describe("PrismaServiceSessionRepository — operatingIntervalSnapshot mapping and persistence", () => {
  it("create() persists a supplied pair, and findById() maps it back to the atomic domain value", async () => {
    await prisma.$transaction(async (tx) => {
      const ctx = tx as TransactionContext;
      const session = await repository.create({
        id: "p3c1-repo-valid-pair",
        serviceCode: "lunch",
        serviceDate: "2029-02-01",
        createdBy: "staff-catalog",
        createdAt: new Date(),
        operatingIntervalSnapshot: { startMinute: 720, endMinute: 960 },
        tx: ctx,
      });
      expect(session.operatingIntervalSnapshot).toEqual({ startMinute: 720, endMinute: 960 });

      const reread = await repository.findById("p3c1-repo-valid-pair", ctx);
      expect(reread?.operatingIntervalSnapshot).toEqual({ startMinute: 720, endMinute: 960 });
    });
  });

  it("create() with no snapshot (or an explicit null) persists and round-trips null", async () => {
    await prisma.$transaction(async (tx) => {
      const ctx = tx as TransactionContext;
      const session = await repository.create({
        id: "p3c1-repo-null-pair",
        serviceCode: "dinner",
        serviceDate: "2029-02-01",
        createdBy: "staff-catalog",
        createdAt: new Date(),
        tx: ctx,
      });
      expect(session.operatingIntervalSnapshot).toBeNull();

      const reread = await repository.findById("p3c1-repo-null-pair", ctx);
      expect(reread?.operatingIntervalSnapshot).toBeNull();
    });
  });

  it("a malformed (partially populated) persisted snapshot causes the repository to throw explicitly — never silently coerced to null (rollback-contained: the CHECK constraint is dropped only inside this transaction, which always rolls back)", async () => {
    class RollbackSentinel extends Error {}

    await prisma
      .$transaction(async (tx) => {
        await tx.$executeRawUnsafe(`ALTER TABLE "service_sessions" DROP CONSTRAINT "service_sessions_operating_interval_snapshot_check"`);
        await tx.$executeRawUnsafe(
          `INSERT INTO "service_sessions" (id, service_code, service_date, status, created_by, start_minute)
           VALUES ('p3c1-repo-malformed', 'lunch', '2029-02-03', 'Created', 'staff-catalog', 500)`
        );

        const ctx = tx as TransactionContext;
        await expect(repository.findById("p3c1-repo-malformed", ctx)).rejects.toThrow(InvalidServiceOperatingIntervalError);

        throw new RollbackSentinel();
      })
      .catch((err) => {
        if (!(err instanceof RollbackSentinel)) throw err;
      });

    const constraintRows = await prisma.$queryRawUnsafe<{ conname: string }[]>(
      `SELECT conname FROM pg_constraint WHERE conname = 'service_sessions_operating_interval_snapshot_check'`
    );
    expect(constraintRows).toHaveLength(1);
    const row = await prisma.serviceSession.findUnique({ where: { id: "p3c1-repo-malformed" } });
    expect(row).toBeNull();
  });
});

describe("PrismaServiceSessionRepository — the snapshot pair is never observed torn (deterministic, repository-controlled barrier)", () => {
  it("the database itself refuses a single-column write that would create an invalid intermediate pair — a naive two-step update is impossible by construction, not merely discouraged", async () => {
    const id = "p3c1-concurrency-two-step-rejected";
    await prisma.serviceSession.create({
      data: { id, serviceCode: "lunch", serviceDate: new Date("2029-02-02T00:00:00.000Z"), status: "Created", createdBy: "staff-catalog", startMinute: 600, endMinute: 700 },
    });
    try {
      // Setting start_minute alone to 800 would momentarily make the
      // pair (800, 700) — end <= start — which the CHECK constraint
      // rejects immediately (PostgreSQL evaluates CHECK per-statement,
      // not deferred to commit, since this constraint is not declared
      // DEFERRABLE). The second statement is never even reached.
      await expect(prisma.$executeRawUnsafe(`UPDATE "service_sessions" SET "start_minute" = 800 WHERE id = $1`, id)).rejects.toThrow();
      const row = await prisma.serviceSession.findUniqueOrThrow({ where: { id } });
      expect({ start: row.startMinute, end: row.endMinute }).toEqual({ start: 600, end: 700 });
    } finally {
      await prisma.serviceSession.deleteMany({ where: { id } });
    }
  });

  it("a concurrent reader sees either the complete OLD pair or the complete NEW pair around a compliant single-statement update, never a mix — proven with explicit signaling, not timing-only Promise.all()", async () => {
    const reader = createTestPrismaClient();
    const id = "p3c1-concurrency-torn-pair";
    try {
      await prisma.serviceSession.create({
        data: {
          id,
          serviceCode: "lunch",
          serviceDate: new Date("2029-02-02T00:00:00.000Z"),
          status: "Created",
          createdBy: "staff-catalog",
          startMinute: 600,
          endMinute: 700,
        },
      });

      // Deterministic ordering primitive: the writer's transaction is
      // held open (uncommitted) until the reader has explicitly signaled
      // that it has already taken its "before" snapshot — this is NOT a
      // timing race resolved by whichever of two Promise.all() branches
      // happens to run first; the writer literally cannot proceed to
      // COMMIT until the signal arrives.
      let signalReaderHasChecked: () => void;
      const readerHasCheckedBeforeCommit = new Promise<void>((resolve) => {
        signalReaderHasChecked = resolve;
      });

      const writerTask = prisma.$transaction(async (tx) => {
        // ONE atomic statement, both columns together — the only shape
        // the database's own CHECK constraint allows for a multi-value
        // change (proven by the sibling test above) — still held open,
        // uncommitted, until the reader signals.
        await tx.$executeRawUnsafe(`UPDATE "service_sessions" SET "start_minute" = 800, "end_minute" = 900 WHERE id = $1`, id);
        await readerHasCheckedBeforeCommit;
      });

      // Runs concurrently with the writer's still-open transaction above.
      const beforeCommit = await reader.serviceSession.findUniqueOrThrow({ where: { id } });
      signalReaderHasChecked!();
      await writerTask;
      const afterCommit = await reader.serviceSession.findUniqueOrThrow({ where: { id } });

      // Never torn: the pre-commit read is the COMPLETE old pair — never
      // e.g. {start: 800, end: 700} (a mix of new-start/old-end).
      expect({ start: beforeCommit.startMinute, end: beforeCommit.endMinute }).toEqual({ start: 600, end: 700 });
      // Never torn: the post-commit read is the COMPLETE new pair.
      expect({ start: afterCommit.startMinute, end: afterCommit.endMinute }).toEqual({ start: 800, end: 900 });
    } finally {
      await prisma.serviceSession.deleteMany({ where: { id } });
      await reader.$disconnect();
    }
  });
});
