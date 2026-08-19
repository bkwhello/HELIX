/**
 * R1.4 P0 — Test-Database Safety Gate.
 *
 * The R1.4 architecture investigation found that every destructive
 * integration-test reset (`TRUNCATE ... CASCADE`) ran against whatever
 * `DATABASE_URL` happened to be active, with no structural check that it
 * was actually a disposable test database rather than the pilot's live
 * one — `.env` provides exactly one connection string, shared by
 * `npm start`/`npm run dev` and `npm test` alike.
 *
 * This module is now the ONLY place in the test suite permitted to
 * construct a Prisma client for integration tests (`createTestPrismaClient`)
 * or to authorize a destructive reset (`assertSafeToReset`). It never
 * falls back to `DATABASE_URL`, never infers safety from a database name
 * alone, and never trusts a developer to have configured things
 * correctly — every check re-verifies against whatever database the
 * given Prisma client is ACTUALLY connected to at call time, not against
 * environment variables alone, and every one of the three independent
 * checks below must pass or the destructive operation is refused before
 * a single statement reaches the database.
 *
 * Provisioning a real database with the sentinel this module checks for
 * is a separate, one-time, explicit step — see `ops/testDatabaseSetup.ts`.
 * This module deliberately never creates that sentinel itself: a gate
 * that can bless its own target is not a gate.
 */
import { PrismaClient } from "@prisma/client";

export const EXPECTED_TEST_DATABASE_NAME = "helix_reservations_test";
const SENTINEL_TABLE = "_test_database_sentinel";

export class UnsafeTestDatabaseError extends Error {
  constructor(message: string) {
    super(`Refusing destructive test-database operation: ${message}`);
    this.name = "UnsafeTestDatabaseError";
  }
}

/**
 * Resolves the connection string integration tests must use. Reads
 * ONLY `TEST_DATABASE_URL` — `DATABASE_URL` (the application/pilot
 * connection string) is never consulted here, structurally, so a test
 * process can never silently fall back to it.
 */
export function resolveTestDatabaseUrl(): string {
  const url = process.env["TEST_DATABASE_URL"];
  if (!url || url.trim().length === 0) {
    throw new UnsafeTestDatabaseError(
      "TEST_DATABASE_URL is not set. Integration tests never fall back to DATABASE_URL " +
        "(that is the pilot/application connection string) — see .env.example and " +
        "ops/testDatabaseSetup.ts."
    );
  }
  // Independent check: TEST_DATABASE_URL must not simply be a copy of
  // DATABASE_URL. Two independently-named variables that resolve to the
  // identical connection string give the illusion of separation while
  // providing none — this is exactly the "explicit but ambiguous"
  // configuration the P0 assignment requires this gate to refuse.
  const applicationUrl = process.env["DATABASE_URL"];
  if (applicationUrl && applicationUrl.trim() === url.trim()) {
    throw new UnsafeTestDatabaseError(
      "TEST_DATABASE_URL is identical to DATABASE_URL. A test database must be a " +
        "structurally distinct database, not an alias for the application/pilot one."
    );
  }
  return url;
}

/** The one place integration tests may construct a Prisma client. */
export function createTestPrismaClient(): PrismaClient {
  return new PrismaClient({ datasourceUrl: resolveTestDatabaseUrl() });
}

/**
 * Fail-closed gate. Must be called, and must resolve without throwing,
 * immediately before ANY destructive statement (TRUNCATE, DROP, DELETE
 * without a WHERE clause) in the integration test suite. Every check
 * queries the live connection the given client actually holds — not
 * environment variables, not naming assumptions — so this remains
 * correct even if a caller somehow obtained a Prisma client through a
 * path this module didn't construct.
 */
export async function assertSafeToReset(prisma: PrismaClient): Promise<void> {
  // Check 1 — exact database-name convention. A loose "contains 'test'"
  // check would accept something like a mistakenly-renamed production
  // database; an exact match against the one real, provisioned test
  // database name does not.
  const nameRows = await prisma.$queryRawUnsafe<{ current_database: string }[]>(
    "SELECT current_database()"
  );
  const currentDatabase = nameRows[0]?.current_database;
  if (currentDatabase !== EXPECTED_TEST_DATABASE_NAME) {
    throw new UnsafeTestDatabaseError(
      `connected database "${String(currentDatabase)}" does not match the expected test ` +
        `database name "${EXPECTED_TEST_DATABASE_NAME}".`
    );
  }

  // Check 2 — sentinel table/row. Provisioned exactly once, out of band,
  // by ops/testDatabaseSetup.ts — never by this gate. A database with
  // the right name but no sentinel (e.g. a same-named database an
  // operator created some other way) still fails closed.
  let sentinelRows: { is_test_database: boolean }[];
  try {
    sentinelRows = await prisma.$queryRawUnsafe<{ is_test_database: boolean }[]>(
      `SELECT is_test_database FROM "${SENTINEL_TABLE}" WHERE id = 'sentinel'`
    );
  } catch {
    throw new UnsafeTestDatabaseError(
      `sentinel table "${SENTINEL_TABLE}" is missing or unreadable. Run ` +
        "`npm run setup-test-db` (ops/testDatabaseSetup.ts) against TEST_DATABASE_URL first."
    );
  }
  if (sentinelRows.length === 0 || sentinelRows[0]?.is_test_database !== true) {
    throw new UnsafeTestDatabaseError(
      `sentinel row in "${SENTINEL_TABLE}" is missing or not marked as a test database.`
    );
  }

  // Check 3 — environment corroboration, re-verified here (not just at
  // client-construction time in resolveTestDatabaseUrl) so this gate is
  // self-contained and correct even if called with a client built some
  // other way.
  resolveTestDatabaseUrl();
}

/**
 * Reservation-domain tables — the same set `resetDatabase()` has always
 * truncated, now gated. Table names, order, and RESTART IDENTITY CASCADE
 * behavior are unchanged from the pre-R1.4 implementation.
 */
export async function truncateReservationDomainTables(prisma: PrismaClient): Promise<void> {
  await assertSafeToReset(prisma);
  await prisma.$executeRawUnsafe(
    'TRUNCATE TABLE "capacity_commitments", "applied_commands", "reservation_events", "reservations", "closing_days", "contacts" RESTART IDENTITY CASCADE'
  );
}

/**
 * Staff/identity-domain tables — previously duplicated as inline SQL in
 * three separate test files (reservations.test.ts, identity-access.test.ts,
 * login-abuse-protection.test.ts). Centralized here so there is exactly
 * one place this statement is written, and exactly one gate it can run
 * behind.
 */
export async function truncateStaffDomainTables(prisma: PrismaClient): Promise<void> {
  await assertSafeToReset(prisma);
  await prisma.$executeRawUnsafe(
    'TRUNCATE TABLE "staff_sessions", "staff_users", "security_events", "login_attempt_windows" RESTART IDENTITY CASCADE'
  );
}
