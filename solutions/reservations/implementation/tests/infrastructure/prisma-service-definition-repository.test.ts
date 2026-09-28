import { describe, it, expect, afterAll } from "vitest";
import { createTestPrismaClient } from "../integration/support/testDatabaseSafety.js";
import { PrismaServiceDefinitionRepository } from "../../infrastructure/persistence/PrismaServiceDefinitionRepository.js";
import { TransactionContext } from "../../domain/shared/TransactionContext.js";
import { InvalidServiceOperatingIntervalError } from "../../domain/availability/ServiceOperatingInterval.js";

/**
 * R1.6-P3A — CAP-D02.01 persisted-catalog foundation. Real-PostgreSQL,
 * read-only coverage against the two rows the `add_service_catalog`
 * migration itself seeds (never truncated by any test reset — see
 * testDatabaseSafety.ts's own "tables/seats are seeded, authoritative
 * config" precedent, which `services` now follows identically). No test
 * here ever mutates the real `lunch`/`dinner` rows — "enabled/disabled
 * mapping" is proven by inserting and removing a throwaway third row
 * with a non-canonical code, never by touching the two canonical ones
 * every other integration test in this suite also depends on.
 */
const prisma = createTestPrismaClient();
const repository = new PrismaServiceDefinitionRepository(prisma);

afterAll(async () => {
  await prisma.$disconnect();
});

describe("PrismaServiceDefinitionRepository — seeded rows map correctly", () => {
  it("findByCode('lunch') returns the seeded Lunch row, enabled", async () => {
    const result = await repository.findByCode("lunch");
    expect(result).not.toBeNull();
    expect(result?.code).toBe("lunch");
    expect(result?.displayName).toBe("Lunch");
    expect(result?.enabled).toBe(true);
    expect(result?.createdAt).toBeInstanceOf(Date);
    expect(result?.updatedAt).toBeInstanceOf(Date);
  });

  it("findByCode('dinner') returns the seeded Dinner row, enabled", async () => {
    const result = await repository.findByCode("dinner");
    expect(result).not.toBeNull();
    expect(result?.code).toBe("dinner");
    expect(result?.displayName).toBe("Dinner");
    expect(result?.enabled).toBe(true);
  });

  it("list() returns exactly the two seeded rows, deterministically ordered by code", async () => {
    const rows = await repository.list();
    // Other tests in this file insert/remove a throwaway "test-fixture-*"
    // row — filter to the two canonical codes this assertion cares about.
    const canonical = rows.filter((r) => r.code === "lunch" || r.code === "dinner");
    expect(canonical.map((r) => r.code)).toEqual(["dinner", "lunch"]);
  });

  it("repeated list() calls return the same order", async () => {
    const first = await repository.list();
    const second = await repository.list();
    expect(second.map((r) => r.code)).toEqual(first.map((r) => r.code));
  });
});

describe("PrismaServiceDefinitionRepository — unknown code", () => {
  it("findByCode for a code that was never seeded returns null, not an error", async () => {
    const result = await repository.findByCode("brunch" as never);
    expect(result).toBeNull();
  });
});

describe("PrismaServiceDefinitionRepository — enabled/disabled mapping, via a throwaway non-canonical row", () => {
  it("maps enabled: true and enabled: false correctly, without ever touching the real lunch/dinner rows", async () => {
    const fixtureCode = `test-fixture-${Date.now().toString(36)}`;
    await prisma.service.create({
      data: { code: fixtureCode, displayName: "Fixture", enabled: true, updatedAt: new Date() },
    });
    try {
      // The domain repository only recognizes the closed ServiceCode
      // union ("lunch"/"dinner") — a non-canonical code like this fixture
      // is correctly treated as absent by findByCode/list (see
      // PrismaServiceDefinitionRepository's own toDomainServiceDefinition
      // doc comment), so this test reads the row directly via Prisma to
      // prove the enabled/disabled COLUMN mapping in isolation, without
      // needing a canonical code to do it.
      const enabledRow = await prisma.service.findUniqueOrThrow({ where: { code: fixtureCode } });
      expect(enabledRow.enabled).toBe(true);

      await prisma.service.update({ where: { code: fixtureCode }, data: { enabled: false } });
      const disabledRow = await prisma.service.findUniqueOrThrow({ where: { code: fixtureCode } });
      expect(disabledRow.enabled).toBe(false);
    } finally {
      await prisma.service.delete({ where: { code: fixtureCode } });
    }
  });

  it("a row with a non-canonical code is treated as absent by findByCode/list, never surfaced as a malformed ServiceDefinition", async () => {
    const fixtureCode = `test-fixture-${Date.now().toString(36)}-b`;
    await prisma.service.create({
      data: { code: fixtureCode, displayName: "Fixture", enabled: true, updatedAt: new Date() },
    });
    try {
      const result = await repository.findByCode(fixtureCode as never);
      expect(result).toBeNull();
      const rows = await repository.list();
      expect(rows.some((r) => r.code === fixtureCode)).toBe(false);
    } finally {
      await prisma.service.delete({ where: { code: fixtureCode } });
    }
  });
});

/**
 * R1.6-P3B — real-adapter `update()` coverage. `update()`'s own signature
 * only accepts the closed `ServiceCode` union ("lunch"/"dinner"), so a
 * throwaway non-canonical row (as used everywhere else in this file)
 * cannot exercise it through the typed interface at all — a throwaway row
 * proves `update()` handles an unknown code safely (cast around the type
 * system, same `as never` convention already used above for
 * findByCode/list), but proving the real, successful write path requires
 * a canonical code. That proof runs inside a transaction that ALWAYS
 * rolls back (never commits) — the exact rollback-contained convention
 * already established in tests/integration/service-catalog-migration.test.ts
 * — so the real, shared `lunch`/`dinner` rows are never left mutated for
 * any concurrently running test file to observe.
 */
describe("PrismaServiceDefinitionRepository — update()", () => {
  it("an unknown/non-canonical code returns null, not an error (throwaway row, never committed against a canonical code)", async () => {
    const fixtureCode = `test-fixture-${Date.now().toString(36)}-c`;
    const result = await repository.update(fixtureCode as never, { displayName: "Should not apply" });
    expect(result).toBeNull();
    // Never created — update() must not create a row that doesn't exist.
    const row = await prisma.service.findUnique({ where: { code: fixtureCode } });
    expect(row).toBeNull();
  });

  it("rollback-contained: a real update against the canonical 'lunch' row succeeds (rename, toggle, and combined), fully rolled back, no persistent state changed", async () => {
    class RollbackSentinel extends Error {}

    await prisma
      .$transaction(async (tx) => {
        const ctx = tx as TransactionContext;

        const renamed = await repository.update("lunch", { displayName: "ROLLBACK-ONLY-RENAME" }, ctx);
        expect(renamed?.displayName).toBe("ROLLBACK-ONLY-RENAME");
        expect(renamed?.enabled).toBe(true);

        const toggled = await repository.update("lunch", { enabled: false }, ctx);
        expect(toggled?.enabled).toBe(false);
        // Partial update — the rename above is untouched by this toggle-only call.
        expect(toggled?.displayName).toBe("ROLLBACK-ONLY-RENAME");

        const combined = await repository.update("lunch", { displayName: "ROLLBACK-ONLY-COMBINED", enabled: true }, ctx);
        expect(combined?.displayName).toBe("ROLLBACK-ONLY-COMBINED");
        expect(combined?.enabled).toBe(true);

        throw new RollbackSentinel();
      })
      .catch((err) => {
        if (!(err instanceof RollbackSentinel)) throw err;
      });

    const afterRollback = await repository.findByCode("lunch");
    expect(afterRollback?.displayName).toBe("Lunch");
    expect(afterRollback?.enabled).toBe(true);
  });

  it("a displayName is stored exactly as supplied, without silent trimming at the repository/database layer — trimming is the caller's own responsibility (rollback-contained)", async () => {
    class RollbackSentinel extends Error {}

    await prisma
      .$transaction(async (tx) => {
        const ctx = tx as TransactionContext;
        const updated = await repository.update("dinner", { displayName: "  Untrimmed  " }, ctx);
        expect(updated?.displayName).toBe("  Untrimmed  ");
        throw new RollbackSentinel();
      })
      .catch((err) => {
        if (!(err instanceof RollbackSentinel)) throw err;
      });

    const afterRollback = await repository.findByCode("dinner");
    expect(afterRollback?.displayName).toBe("Dinner");
  });
});

describe("PrismaServiceDefinitionRepository — defaultOperatingInterval mapping (R1.6-P3C-1)", () => {
  it("maps a valid persisted pair (lunch, seeded [720,960)) to the atomic domain value", async () => {
    const lunch = await repository.findByCode("lunch");
    expect(lunch?.defaultOperatingInterval).toEqual({ startMinute: 720, endMinute: 960 });
  });

  it("maps a both-null persisted pair (dinner, unconfigured) to null", async () => {
    const dinner = await repository.findByCode("dinner");
    expect(dinner?.defaultOperatingInterval).toBeNull();
  });

  it("a malformed (partially populated) persisted pair causes the repository to throw explicitly — never silently coerced to null (rollback-contained: the CHECK constraint is dropped only inside this transaction, which always rolls back)", async () => {
    class RollbackSentinel extends Error {}

    await prisma
      .$transaction(async (tx) => {
        await tx.$executeRawUnsafe(`ALTER TABLE "services" DROP CONSTRAINT "services_default_operating_interval_check"`);
        await tx.$executeRawUnsafe(`UPDATE "services" SET "default_start_minute" = 500 WHERE "code" = 'dinner'`);

        const ctx = tx as TransactionContext;
        await expect(repository.findByCode("dinner", ctx)).rejects.toThrow(InvalidServiceOperatingIntervalError);

        throw new RollbackSentinel();
      })
      .catch((err) => {
        if (!(err instanceof RollbackSentinel)) throw err;
      });

    // Verify afterward: the CHECK constraint is back (rolled back with
    // everything else), and dinner's pair is unchanged.
    const constraintRows = await prisma.$queryRawUnsafe<{ conname: string }[]>(
      `SELECT conname FROM pg_constraint WHERE conname = 'services_default_operating_interval_check'`
    );
    expect(constraintRows).toHaveLength(1);
    const dinner = await repository.findByCode("dinner");
    expect(dinner?.defaultOperatingInterval).toBeNull();
  });
});

/**
 * R1.6-P3C-2 — real-adapter `update()` coverage for
 * `defaultOperatingInterval`. Same rollback-contained convention as the
 * P3B `update()` describe block above: every real write against the
 * canonical `lunch`/`dinner` rows happens inside a transaction that always
 * rolls back, so no persistent mutation of shared canonical rows is ever
 * left behind for another test file to observe.
 */
describe("PrismaServiceDefinitionRepository — update() defaultOperatingInterval (R1.6-P3C-2)", () => {
  class RollbackSentinel extends Error {}

  // `fn` receives BOTH the opaque `TransactionContext` (for the repository
  // call under test) and the real Prisma transaction client `tx` (for this
  // test file's own raw verification queries) — verification must read
  // through the SAME uncommitted transaction the write happened in; a raw
  // query through the outer `prisma` client is a separate connection that
  // cannot see uncommitted state at all, and would silently "pass" by
  // reading the pre-existing committed row instead of proving anything.
  async function rollbackContained(fn: (ctx: TransactionContext, tx: typeof prisma) => Promise<void>): Promise<void> {
    await prisma
      .$transaction(async (tx) => {
        await fn(tx as TransactionContext, tx as unknown as typeof prisma);
        throw new RollbackSentinel();
      })
      .catch((err) => {
        if (!(err instanceof RollbackSentinel)) throw err;
      });
  }

  it("rollback-contained: an object patch atomically sets both columns in one write", async () => {
    await rollbackContained(async (ctx, tx) => {
      const updated = await repository.update("dinner", { defaultOperatingInterval: { startMinute: 1080, endMinute: 1320 } }, ctx);
      expect(updated?.defaultOperatingInterval).toEqual({ startMinute: 1080, endMinute: 1320 });

      const raw = await tx.$queryRawUnsafe<{ s: number | null; e: number | null }[]>(
        `SELECT default_start_minute AS s, default_end_minute AS e FROM services WHERE code = 'dinner'`
      );
      expect(raw[0]).toEqual({ s: 1080, e: 1320 });
    });

    const afterRollback = await repository.findByCode("dinner");
    expect(afterRollback?.defaultOperatingInterval).toBeNull();
  });

  it("rollback-contained: a null patch atomically clears both columns in one write", async () => {
    await rollbackContained(async (ctx, tx) => {
      const updated = await repository.update("lunch", { defaultOperatingInterval: null }, ctx);
      expect(updated?.defaultOperatingInterval).toBeNull();

      const raw = await tx.$queryRawUnsafe<{ s: number | null; e: number | null }[]>(
        `SELECT default_start_minute AS s, default_end_minute AS e FROM services WHERE code = 'lunch'`
      );
      expect(raw[0]).toEqual({ s: null, e: null });
    });

    const afterRollback = await repository.findByCode("lunch");
    expect(afterRollback?.defaultOperatingInterval).toEqual({ startMinute: 720, endMinute: 960 });
  });

  it("rollback-contained: omitting defaultOperatingInterval touches neither column — combined with a displayName change", async () => {
    await rollbackContained(async (ctx) => {
      const updated = await repository.update("lunch", { displayName: "Lunchkaart" }, ctx);
      expect(updated?.displayName).toBe("Lunchkaart");
      expect(updated?.defaultOperatingInterval).toEqual({ startMinute: 720, endMinute: 960 });
    });

    const afterRollback = await repository.findByCode("lunch");
    expect(afterRollback?.displayName).toBe("Lunch");
    expect(afterRollback?.defaultOperatingInterval).toEqual({ startMinute: 720, endMinute: 960 });
  });

  it("an invalid direct persistence attempt (bypassing the repository) is rejected by the database CHECK constraint, not silently accepted", async () => {
    await expect(
      prisma.$executeRawUnsafe(`UPDATE "services" SET "default_start_minute" = 100, "default_end_minute" = 50 WHERE "code" = 'dinner'`)
    ).rejects.toThrow(/services_default_operating_interval_check/);

    // Never applied — the statement-level CHECK violation prevents the write entirely.
    const dinner = await repository.findByCode("dinner");
    expect(dinner?.defaultOperatingInterval).toBeNull();
  });

  it("P2025 (unknown/non-canonical code) returns null, not an error, when a defaultOperatingInterval patch is supplied", async () => {
    const fixtureCode = `test-fixture-${Date.now().toString(36)}-interval`;
    const result = await repository.update(fixtureCode as never, { defaultOperatingInterval: { startMinute: 0, endMinute: 60 } });
    expect(result).toBeNull();
    const row = await prisma.service.findUnique({ where: { code: fixtureCode } });
    expect(row).toBeNull();
  });
});
