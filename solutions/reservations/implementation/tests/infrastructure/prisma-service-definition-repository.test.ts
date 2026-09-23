import { describe, it, expect, afterAll } from "vitest";
import { createTestPrismaClient } from "../integration/support/testDatabaseSafety.js";
import { PrismaServiceDefinitionRepository } from "../../infrastructure/persistence/PrismaServiceDefinitionRepository.js";
import { TransactionContext } from "../../domain/shared/TransactionContext.js";

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
