import { describe, it, expect, afterAll } from "vitest";
import { createTestPrismaClient } from "../integration/support/testDatabaseSafety.js";
import { PrismaServiceDefinitionRepository } from "../../infrastructure/persistence/PrismaServiceDefinitionRepository.js";

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
