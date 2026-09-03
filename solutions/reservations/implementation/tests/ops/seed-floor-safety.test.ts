import { describe, it, expect, afterEach } from "vitest";
import {
  resolveSeedFloorDatabaseUrl,
  assertSeedFloorConfirmation,
  assertSafeSeedFloorTarget,
  UnsafeSeedFloorTargetError,
  APPROVED_SEED_FLOOR_DATABASE_NAME,
  type DatabaseIdentityReader,
} from "../../ops/floor/seedFloorSafety.js";
import { main as seedFloorMain, seedFloor } from "../../ops/floor/seedFloor.js";
import { createTestPrismaClient, resolveTestDatabaseUrl } from "../integration/support/testDatabaseSafety.js";

/**
 * P1-B4-D1 — the floor-seed target safety guard. Most scenarios are pure
 * unit tests against fake env objects / a fake DatabaseIdentityReader —
 * NO real database connection at all, so they can never touch any real
 * database, dev included. A small number of tests prove the guard's
 * effect on the real, exported CLI entry point (main()) against
 * TEST_DATABASE_URL specifically — the one database this whole suite is
 * already safe and expected to write to (never helix_reservations_dev).
 */

/** A DatabaseIdentityReader that throws if ever invoked — proves an earlier check short-circuited before any connection/read was attempted. */
function poisonedIdentityReader(): DatabaseIdentityReader {
  return {
    currentDatabaseName() {
      throw new Error("currentDatabaseName() must not be called — an earlier guard should have already thrown.");
    },
  };
}

function fakeIdentityReader(name: string | undefined): DatabaseIdentityReader {
  return { async currentDatabaseName() { return name; } };
}

describe("seedFloorSafety — resolveSeedFloorDatabaseUrl (no DATABASE_URL fallback)", () => {
  it("missing SEED_FLOOR_DATABASE_URL entirely → rejects", () => {
    expect(() => resolveSeedFloorDatabaseUrl({})).toThrow(UnsafeSeedFloorTargetError);
  });

  it("only DATABASE_URL present (no SEED_FLOOR_DATABASE_URL) → rejects, proving the old fallback is gone", () => {
    expect(() =>
      resolveSeedFloorDatabaseUrl({ DATABASE_URL: "postgresql://user:pass@localhost:5433/helix_reservations_dev?schema=public" })
    ).toThrow(UnsafeSeedFloorTargetError);
  });

  it("SEED_FLOOR_DATABASE_URL present → resolves to exactly that value, ignoring DATABASE_URL entirely", () => {
    const url = resolveSeedFloorDatabaseUrl({
      DATABASE_URL: "postgresql://user:pass@localhost:5433/some_other_db?schema=public",
      SEED_FLOOR_DATABASE_URL: "postgresql://user:pass@localhost:5433/helix_reservations_dev?schema=public",
    });
    expect(url).toBe("postgresql://user:pass@localhost:5433/helix_reservations_dev?schema=public");
  });
});

describe("seedFloorSafety — assertSeedFloorConfirmation", () => {
  it("missing confirmation → rejects", () => {
    expect(() => assertSeedFloorConfirmation({})).toThrow(UnsafeSeedFloorTargetError);
  });

  it("wrong confirmation value → rejects", () => {
    expect(() => assertSeedFloorConfirmation({ SEED_FLOOR_CONFIRM_DATABASE: "helix_reservations_test" })).toThrow(UnsafeSeedFloorTargetError);
    expect(() => assertSeedFloorConfirmation({ SEED_FLOOR_CONFIRM_DATABASE: "yes" })).toThrow(UnsafeSeedFloorTargetError);
  });

  it("exact confirmation value → does not throw", () => {
    expect(() => assertSeedFloorConfirmation({ SEED_FLOOR_CONFIRM_DATABASE: APPROVED_SEED_FLOOR_DATABASE_NAME })).not.toThrow();
  });
});

describe("seedFloorSafety — assertSafeSeedFloorTarget (the full guard)", () => {
  it("missing confirmation → rejects BEFORE ever consulting the identity reader", async () => {
    await expect(assertSafeSeedFloorTarget(poisonedIdentityReader(), {})).rejects.toThrow(UnsafeSeedFloorTargetError);
  });

  it("wrong confirmation → rejects BEFORE ever consulting the identity reader (actual DB is genuinely dev, but that must never be reached)", async () => {
    await expect(
      assertSafeSeedFloorTarget(poisonedIdentityReader(), { SEED_FLOOR_CONFIRM_DATABASE: "not-the-approved-name" })
    ).rejects.toThrow(UnsafeSeedFloorTargetError);
  });

  it("confirmation says dev, but the live-connected database actually reports test → rejects", async () => {
    await expect(
      assertSafeSeedFloorTarget(fakeIdentityReader("helix_reservations_test"), { SEED_FLOOR_CONFIRM_DATABASE: APPROVED_SEED_FLOOR_DATABASE_NAME })
    ).rejects.toThrow(UnsafeSeedFloorTargetError);
  });

  it("the URL/connection may LOOK like dev, but only the live identity reader's own answer is trusted — a reader returning anything else is rejected regardless", async () => {
    // No URL parsing happens anywhere in this function at all — the
    // fake reader below simulates a connection whose identity query
    // genuinely returns something unexpected, independent of whatever
    // the (irrelevant, never-consulted-here) connection string said.
    await expect(
      assertSafeSeedFloorTarget(fakeIdentityReader("some_unexpected_database"), { SEED_FLOOR_CONFIRM_DATABASE: APPROVED_SEED_FLOOR_DATABASE_NAME })
    ).rejects.toThrow(UnsafeSeedFloorTargetError);
  });

  it("an undefined/unreadable identity result → rejects (fails closed, never treated as a pass)", async () => {
    await expect(
      assertSafeSeedFloorTarget(fakeIdentityReader(undefined), { SEED_FLOOR_CONFIRM_DATABASE: APPROVED_SEED_FLOOR_DATABASE_NAME })
    ).rejects.toThrow(UnsafeSeedFloorTargetError);
  });

  it("approved explicit confirmation + actual dev identity → the safety gate passes", async () => {
    await expect(
      assertSafeSeedFloorTarget(fakeIdentityReader(APPROVED_SEED_FLOOR_DATABASE_NAME), { SEED_FLOOR_CONFIRM_DATABASE: APPROVED_SEED_FLOOR_DATABASE_NAME })
    ).resolves.toBeUndefined();
  });
});

describe("seed-floor CLI (main()) — the guard actually blocks the real entry point, before any write", () => {
  const ORIGINAL_ENV = { ...process.env };
  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  it("main() with no SEED_FLOOR_DATABASE_URL set (even with a real DATABASE_URL present) refuses — no connection is even attempted", async () => {
    delete process.env["SEED_FLOOR_DATABASE_URL"];
    delete process.env["SEED_FLOOR_CONFIRM_DATABASE"];
    process.env["DATABASE_URL"] = "postgresql://user:pass@localhost:5433/helix_reservations_dev?schema=public";
    await expect(seedFloorMain()).rejects.toThrow(UnsafeSeedFloorTargetError);
  });

  it(
    "main() pointed at the REAL (safe, non-dev) test database, with a confirmation that claims dev, is refused before any Table/Seat write — " +
      "proves both the 'confirmation says dev but actual DB is test' case AND that ordering genuinely prevents a write, against a real connection",
    async () => {
      const prisma = createTestPrismaClient();
      try {
        const before = { tables: await prisma.table.count(), seats: await prisma.seat.count() };

        process.env["SEED_FLOOR_DATABASE_URL"] = resolveTestDatabaseUrl();
        process.env["SEED_FLOOR_CONFIRM_DATABASE"] = APPROVED_SEED_FLOOR_DATABASE_NAME; // claims dev — the live database is actually helix_reservations_test

        await expect(seedFloorMain()).rejects.toThrow(UnsafeSeedFloorTargetError);

        const after = { tables: await prisma.table.count(), seats: await prisma.seat.count() };
        expect(after).toEqual(before);
      } finally {
        await prisma.$disconnect();
      }
    }
  );
});

describe("seedFloor() itself — unchanged idempotency behavior (proves the guard did not alter the seed's own semantics)", () => {
  it("running seedFloor() twice against the same (real, safe test) database is idempotent — same upsert counts, no duplicate rows", async () => {
    const testUrl = resolveTestDatabaseUrl();
    const first = await seedFloor(testUrl);
    const second = await seedFloor(testUrl);
    expect(second).toEqual(first);

    const prisma = createTestPrismaClient();
    try {
      expect(await prisma.table.count()).toBe(first.tablesUpserted);
      expect(await prisma.seat.count()).toBe(first.seatsUpserted);
    } finally {
      await prisma.$disconnect();
    }
  });
});
