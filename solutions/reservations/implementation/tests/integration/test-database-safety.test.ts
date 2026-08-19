import { PrismaClient } from "@prisma/client";
import { describe, it, expect, afterAll, vi } from "vitest";
import {
  assertSafeToReset,
  createTestPrismaClient,
  resolveTestDatabaseUrl,
  truncateStaffDomainTables,
  truncateReservationDomainTables,
  UnsafeTestDatabaseError,
  EXPECTED_TEST_DATABASE_NAME,
} from "./support/testDatabaseSafety.js";

/**
 * R1.4 P0 — proves the destructive-reset safety gate actually fails
 * closed, per the assignment's required test matrix (§5/§23). Every
 * "refused" case below asserts BOTH that the call throws AND (where
 * applicable) that the underlying TRUNCATE statement was never reached —
 * a gate that throws AFTER truncating would be worthless.
 */
describe("R1.4 P0 — test-database safety gate", () => {
  const clientsToClose: PrismaClient[] = [];
  afterAll(async () => {
    await Promise.all(clientsToClose.map((c) => c.$disconnect()));
  });

  it("known, sentinel-provisioned test database → reset allowed", async () => {
    const prisma = createTestPrismaClient();
    clientsToClose.push(prisma);
    await expect(assertSafeToReset(prisma)).resolves.toBeUndefined();
    // The real end-to-end path: a guarded truncate actually executes
    // without throwing, proving "allowed" means "actually works," not
    // just "the check didn't object."
    await expect(truncateReservationDomainTables(prisma)).resolves.toBeUndefined();
  });

  it("production-like database (the pilot's own DATABASE_URL) → reset refused", async () => {
    const applicationUrl = process.env["DATABASE_URL"];
    if (!applicationUrl) throw new Error("DATABASE_URL must be set for this test to be meaningful");
    const prodLikeClient = new PrismaClient({ datasourceUrl: applicationUrl });
    clientsToClose.push(prodLikeClient);

    await expect(assertSafeToReset(prodLikeClient)).rejects.toThrow(UnsafeTestDatabaseError);
  });

  it("DATABASE_URL accidentally pointed to the operational database → the TRUNCATE statement itself is never reached", async () => {
    const applicationUrl = process.env["DATABASE_URL"];
    if (!applicationUrl) throw new Error("DATABASE_URL must be set for this test to be meaningful");
    const prodLikeClient = new PrismaClient({ datasourceUrl: applicationUrl });
    clientsToClose.push(prodLikeClient);

    const executeSpy = vi.spyOn(prodLikeClient, "$executeRawUnsafe");

    await expect(truncateReservationDomainTables(prodLikeClient)).rejects.toThrow(UnsafeTestDatabaseError);
    await expect(truncateStaffDomainTables(prodLikeClient)).rejects.toThrow(UnsafeTestDatabaseError);

    // The actual proof: the destructive statement was never issued, on
    // either the connection-level $executeRawUnsafe (TRUNCATE) call.
    expect(executeSpy).not.toHaveBeenCalled();
  });

  it("missing safety configuration (TEST_DATABASE_URL unset) → reset refused before any connection is made", () => {
    const original = process.env["TEST_DATABASE_URL"];
    delete process.env["TEST_DATABASE_URL"];
    try {
      expect(() => resolveTestDatabaseUrl()).toThrow(UnsafeTestDatabaseError);
      expect(() => createTestPrismaClient()).toThrow(UnsafeTestDatabaseError);
    } finally {
      if (original !== undefined) process.env["TEST_DATABASE_URL"] = original;
    }
  });

  it("ambiguous configuration — TEST_DATABASE_URL is a differently-written string that still resolves to the operational database → reset refused", async () => {
    const applicationUrl = process.env["DATABASE_URL"];
    if (!applicationUrl) throw new Error("DATABASE_URL must be set for this test to be meaningful");

    // Same underlying database as DATABASE_URL, reached via a
    // textually different connection string (localhost vs 127.0.0.1) —
    // a plain string-equality check between TEST_DATABASE_URL and
    // DATABASE_URL would NOT catch this. The live re-verification
    // inside assertSafeToReset (querying current_database() and the
    // sentinel on the connection actually made) is what has to catch
    // it instead — proving the defense-in-depth is real, not just a
    // string comparison in a different variable name.
    const ambiguousUrl = applicationUrl.replace("localhost", "127.0.0.1");
    expect(ambiguousUrl).not.toBe(applicationUrl); // sanity: genuinely a different string
    const ambiguousClient = new PrismaClient({ datasourceUrl: ambiguousUrl });
    clientsToClose.push(ambiguousClient);

    await expect(assertSafeToReset(ambiguousClient)).rejects.toThrow(UnsafeTestDatabaseError);
  });

  it("ambiguous configuration — TEST_DATABASE_URL identical to DATABASE_URL (same variable value, not just same target) → refused at resolution time", () => {
    const applicationUrl = process.env["DATABASE_URL"];
    if (!applicationUrl) throw new Error("DATABASE_URL must be set for this test to be meaningful");
    const originalTestUrl = process.env["TEST_DATABASE_URL"];
    process.env["TEST_DATABASE_URL"] = applicationUrl;
    try {
      expect(() => resolveTestDatabaseUrl()).toThrow(UnsafeTestDatabaseError);
    } finally {
      if (originalTestUrl !== undefined) process.env["TEST_DATABASE_URL"] = originalTestUrl;
    }
  });

  it("sanity: the expected test database name constant matches the actually-provisioned database", async () => {
    const prisma = createTestPrismaClient();
    clientsToClose.push(prisma);
    const rows = await prisma.$queryRawUnsafe<{ current_database: string }[]>(
      "SELECT current_database()"
    );
    expect(rows[0]?.current_database).toBe(EXPECTED_TEST_DATABASE_NAME);
  });
});
