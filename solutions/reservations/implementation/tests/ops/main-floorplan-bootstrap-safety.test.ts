import { describe, it, expect, afterEach } from "vitest";
import {
  resolveSeedFloorplanDatabaseUrl,
  assertSeedFloorplanConfirmation,
  assertSafeSeedFloorplanTarget,
  UnsafeSeedFloorplanTargetError,
  APPROVED_SEED_FLOORPLAN_DATABASE_NAME,
  type DatabaseIdentityReader,
} from "../../ops/floor/seedFloorplanSafety.js";
import { main as bootstrapMain } from "../../ops/floor/bootstrapMainFloorplan.js";
import { createTestPrismaClient, resolveTestDatabaseUrl } from "../integration/support/testDatabaseSafety.js";

/**
 * R1.5-P2B-B — the Main Floor bootstrap's own target safety guard.
 * Mirrors tests/ops/seed-floor-safety.test.ts's own structure: almost
 * everything here is a pure unit test against fake env objects / a fake
 * DatabaseIdentityReader (no real connection at all), plus a small number
 * of tests proving the guard blocks the real, exported main() entry point
 * before any write — run only against TEST_DATABASE_URL, never dev.
 */

function poisonedIdentityReader(): DatabaseIdentityReader {
  return {
    currentDatabaseName() {
      throw new Error("currentDatabaseName() must not be called — an earlier guard should have already thrown.");
    },
    serverAddress() {
      throw new Error("serverAddress() must not be called — an earlier guard should have already thrown.");
    },
  };
}

function fakeIdentityReader(name: string | undefined, addr: string | undefined = "127.0.0.1"): DatabaseIdentityReader {
  return {
    async currentDatabaseName() {
      return name;
    },
    async serverAddress() {
      return addr;
    },
  };
}

/** A reader whose currentDatabaseName() resolves, but whose serverAddress() must never be reached because it throws — proves ordering when we only care about the pre-address checks. */
function readerThatMustNotReachAddress(name: string): DatabaseIdentityReader {
  return {
    async currentDatabaseName() {
      return name;
    },
    serverAddress() {
      throw new Error("serverAddress() must not be called — an earlier check should have already thrown.");
    },
  };
}

describe("seedFloorplanSafety — resolveSeedFloorplanDatabaseUrl (no DATABASE_URL fallback)", () => {
  it("missing SEED_FLOORPLAN_DATABASE_URL entirely → rejects", () => {
    expect(() => resolveSeedFloorplanDatabaseUrl({})).toThrow(UnsafeSeedFloorplanTargetError);
  });

  it("only DATABASE_URL present (no SEED_FLOORPLAN_DATABASE_URL) → rejects, proving there is no fallback", () => {
    expect(() =>
      resolveSeedFloorplanDatabaseUrl({ DATABASE_URL: "postgresql://user:pass@localhost:5433/helix_reservations_dev?schema=public" })
    ).toThrow(UnsafeSeedFloorplanTargetError);
  });

  it("SEED_FLOORPLAN_DATABASE_URL present → resolves to exactly that value, ignoring DATABASE_URL entirely", () => {
    const url = resolveSeedFloorplanDatabaseUrl({
      DATABASE_URL: "postgresql://user:pass@localhost:5433/some_other_db?schema=public",
      SEED_FLOORPLAN_DATABASE_URL: "postgresql://user:pass@localhost:5433/helix_reservations_dev?schema=public",
    });
    expect(url).toBe("postgresql://user:pass@localhost:5433/helix_reservations_dev?schema=public");
  });
});

describe("seedFloorplanSafety — assertSeedFloorplanConfirmation", () => {
  it("missing confirmation → rejects", () => {
    expect(() => assertSeedFloorplanConfirmation({})).toThrow(UnsafeSeedFloorplanTargetError);
  });

  it("wrong confirmation value → rejects", () => {
    expect(() => assertSeedFloorplanConfirmation({ SEED_FLOORPLAN_CONFIRM_DATABASE: "helix_reservations_test" })).toThrow(UnsafeSeedFloorplanTargetError);
    expect(() => assertSeedFloorplanConfirmation({ SEED_FLOORPLAN_CONFIRM_DATABASE: "yes" })).toThrow(UnsafeSeedFloorplanTargetError);
  });

  it("exact confirmation value → does not throw", () => {
    expect(() => assertSeedFloorplanConfirmation({ SEED_FLOORPLAN_CONFIRM_DATABASE: APPROVED_SEED_FLOORPLAN_DATABASE_NAME })).not.toThrow();
  });
});

describe("seedFloorplanSafety — assertSafeSeedFloorplanTarget (the full guard)", () => {
  it("missing confirmation → rejects BEFORE ever consulting the identity reader", async () => {
    await expect(assertSafeSeedFloorplanTarget(poisonedIdentityReader(), {})).rejects.toThrow(UnsafeSeedFloorplanTargetError);
  });

  it("wrong confirmation → rejects BEFORE ever consulting the identity reader", async () => {
    await expect(
      assertSafeSeedFloorplanTarget(poisonedIdentityReader(), { SEED_FLOORPLAN_CONFIRM_DATABASE: "not-the-approved-name" })
    ).rejects.toThrow(UnsafeSeedFloorplanTargetError);
  });

  it("confirmation says dev, but the live-connected database actually reports something else → rejects", async () => {
    await expect(
      assertSafeSeedFloorplanTarget(fakeIdentityReader("helix_reservations_test"), { SEED_FLOORPLAN_CONFIRM_DATABASE: APPROVED_SEED_FLOORPLAN_DATABASE_NAME })
    ).rejects.toThrow(UnsafeSeedFloorplanTargetError);
  });

  it("an undefined/unreadable database-name result → rejects (fails closed)", async () => {
    await expect(
      assertSafeSeedFloorplanTarget(readerThatMustNotReachAddress(undefined as unknown as string), { SEED_FLOORPLAN_CONFIRM_DATABASE: APPROVED_SEED_FLOORPLAN_DATABASE_NAME })
    ).rejects.toThrow(UnsafeSeedFloorplanTargetError);
  });

  it("correct database name but a non-loopback server address → rejects", async () => {
    await expect(
      assertSafeSeedFloorplanTarget(fakeIdentityReader(APPROVED_SEED_FLOORPLAN_DATABASE_NAME, "203.0.113.5"), {
        SEED_FLOORPLAN_CONFIRM_DATABASE: APPROVED_SEED_FLOORPLAN_DATABASE_NAME,
      })
    ).rejects.toThrow(UnsafeSeedFloorplanTargetError);
  });

  it("IPv6 loopback reported with a CIDR suffix (::1/128, as Postgres actually returns it) → passes", async () => {
    await expect(
      assertSafeSeedFloorplanTarget(fakeIdentityReader(APPROVED_SEED_FLOORPLAN_DATABASE_NAME, "::1/128"), {
        SEED_FLOORPLAN_CONFIRM_DATABASE: APPROVED_SEED_FLOORPLAN_DATABASE_NAME,
      })
    ).resolves.toBeUndefined();
  });

  it("IPv4 loopback (127.0.0.1) → passes", async () => {
    await expect(
      assertSafeSeedFloorplanTarget(fakeIdentityReader(APPROVED_SEED_FLOORPLAN_DATABASE_NAME, "127.0.0.1"), {
        SEED_FLOORPLAN_CONFIRM_DATABASE: APPROVED_SEED_FLOORPLAN_DATABASE_NAME,
      })
    ).resolves.toBeUndefined();
  });

  it("a Unix-domain-socket connection (inet_server_addr() is NULL, surfaced as undefined) is accepted as inherently local", async () => {
    await expect(
      assertSafeSeedFloorplanTarget(fakeIdentityReader(APPROVED_SEED_FLOORPLAN_DATABASE_NAME, undefined), {
        SEED_FLOORPLAN_CONFIRM_DATABASE: APPROVED_SEED_FLOORPLAN_DATABASE_NAME,
      })
    ).resolves.toBeUndefined();
  });

  it("approved explicit confirmation + actual dev identity + loopback address → the safety gate passes", async () => {
    await expect(
      assertSafeSeedFloorplanTarget(fakeIdentityReader(APPROVED_SEED_FLOORPLAN_DATABASE_NAME, "127.0.0.1"), {
        SEED_FLOORPLAN_CONFIRM_DATABASE: APPROVED_SEED_FLOORPLAN_DATABASE_NAME,
      })
    ).resolves.toBeUndefined();
  });
});

describe("bootstrapMainFloorplan CLI (main()) — the guard actually blocks the real entry point, before any write", () => {
  const ORIGINAL_ENV = { ...process.env };
  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  it("main() with no SEED_FLOORPLAN_DATABASE_URL set (even with a real DATABASE_URL present) refuses — no connection is even attempted", async () => {
    delete process.env["SEED_FLOORPLAN_DATABASE_URL"];
    delete process.env["SEED_FLOORPLAN_CONFIRM_DATABASE"];
    process.env["DATABASE_URL"] = "postgresql://user:pass@localhost:5433/helix_reservations_dev?schema=public";
    await expect(bootstrapMain()).rejects.toThrow(UnsafeSeedFloorplanTargetError);
  });

  it(
    "main() pointed at the REAL (safe, non-dev) test database, with a confirmation that claims dev, is refused before any Floorplan write",
    async () => {
      const prisma = createTestPrismaClient();
      try {
        const before = { floorplans: await prisma.floorplan.count(), versions: await prisma.floorplanVersion.count() };

        process.env["SEED_FLOORPLAN_DATABASE_URL"] = resolveTestDatabaseUrl();
        process.env["SEED_FLOORPLAN_CONFIRM_DATABASE"] = APPROVED_SEED_FLOORPLAN_DATABASE_NAME; // claims dev — the live database is actually helix_reservations_test

        await expect(bootstrapMain()).rejects.toThrow(UnsafeSeedFloorplanTargetError);

        const after = { floorplans: await prisma.floorplan.count(), versions: await prisma.floorplanVersion.count() };
        expect(after).toEqual(before);
      } finally {
        await prisma.$disconnect();
      }
    }
  );
});
