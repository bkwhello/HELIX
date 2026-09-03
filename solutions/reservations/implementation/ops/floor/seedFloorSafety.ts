/**
 * P1-B4-D1 — Floor Seed Target Safety Guard.
 *
 * seedFloor.ts's own upsert loop is unconditionally trusting: given ANY
 * connection string, it writes the authoritative floor inventory into it.
 * Before this guard, the CLI entry point (`npm run seed-floor`) resolved
 * its target as `SEED_FLOOR_DATABASE_URL ?? DATABASE_URL` — silently
 * falling back to the general application/pilot connection string with
 * zero confirmation. That is exactly the class of risk
 * tests/integration/support/testDatabaseSafety.ts's own header comment
 * describes for the pre-R1.4 test-reset gap it was built to close: "every
 * destructive [operation] ran against whatever [connection string]
 * happened to be active, with no structural check that it was actually
 * the intended database." This module closes the equivalent gap for the
 * floor seed, reusing that module's SAME three principles — fail closed,
 * independently corroborate the actual connected database via a live
 * query (never trust the URL string alone), never trust one environment
 * variable in isolation — as fresh, purpose-built code. It deliberately
 * does NOT import testDatabaseSafety.ts itself: that module is test-only
 * infrastructure (gated to `helix_reservations_test` specifically), and
 * this is a production/operator-facing ops script with a different
 * approved target (`helix_reservations_dev`) — importing test code into
 * an ops path to save a few lines would be the wrong kind of reuse.
 *
 * Also mirrors this codebase's own existing, closest analogous
 * precedent for a risky ops script: ops/restore/restoreBackup.ts's
 * RESTORE_TARGET_DATABASE_URL (mandatory, no DATABASE_URL fallback) +
 * RESTORE_DISASTER_RECOVERY_CONFIRMATION (a separate, explicit
 * confirmation variable) pattern — SEED_FLOOR_DATABASE_URL /
 * SEED_FLOOR_CONFIRM_DATABASE follow the identical shape.
 *
 * Port is deliberately NOT enforced. `current_database()` already
 * identifies WHICH database a connection actually reaches, independent
 * of network topology — a stronger, more direct signal than a port
 * number, which only says which server process was reached, not which
 * database. testDatabaseSafety.ts's own analogous guard does not check a
 * port either. Hardcoding port 5433 as a requirement would also encode a
 * purely local-development networking detail (this environment's
 * Postgres happens to run on 5433 instead of the default 5432, because
 * no admin rights allow using the default Windows service — see the
 * project's own operational history) into a safety check that must keep
 * working if the approved dev database is ever reached a different way
 * (a different local port, a container remap, a future managed
 * instance) — that would make the guard environment-fragile for no
 * corresponding safety gain over the database-name check already
 * doing the real work.
 */
import { PrismaClient } from "@prisma/client";

export class UnsafeSeedFloorTargetError extends Error {
  constructor(message: string) {
    super(`Refusing floor-seed operation: ${message}`);
    this.name = "UnsafeSeedFloorTargetError";
  }
}

/** The one, approved development target for this operation. An allowlist of exactly one name — not a production/staging blacklist. */
export const APPROVED_SEED_FLOOR_DATABASE_NAME = "helix_reservations_dev";

/** Supplies the actual connected database's own name, independent of whatever the connection string's text says. */
export interface DatabaseIdentityReader {
  currentDatabaseName(): Promise<string | undefined>;
}

/**
 * Resolves the mandatory, dedicated connection string for this operation.
 * Deliberately NEVER falls back to DATABASE_URL (the general application/
 * pilot connection string) — the old `SEED_FLOOR_DATABASE_URL ??
 * DATABASE_URL` fallback is gone; a caller with only DATABASE_URL set
 * gets the same fail-closed error as a caller with nothing set at all.
 */
export function resolveSeedFloorDatabaseUrl(env: NodeJS.ProcessEnv = process.env): string {
  const url = env["SEED_FLOOR_DATABASE_URL"];
  if (!url || url.trim().length === 0) {
    throw new UnsafeSeedFloorTargetError(
      "SEED_FLOOR_DATABASE_URL is not set. This operation never falls back to DATABASE_URL " +
        `(the general application connection string) — set SEED_FLOOR_DATABASE_URL explicitly to the ${APPROVED_SEED_FLOOR_DATABASE_NAME} connection string.`
    );
  }
  return url;
}

/** Explicit operator confirmation — a separate variable from the URL itself, so a merely-correct URL is not by itself sufficient (mirrors RESTORE_DISASTER_RECOVERY_CONFIRMATION's own precedent). Not an interactive prompt. */
export function assertSeedFloorConfirmation(env: NodeJS.ProcessEnv = process.env): void {
  const confirmation = env["SEED_FLOOR_CONFIRM_DATABASE"];
  if (confirmation !== APPROVED_SEED_FLOOR_DATABASE_NAME) {
    throw new UnsafeSeedFloorTargetError(
      `SEED_FLOOR_CONFIRM_DATABASE must be set to exactly "${APPROVED_SEED_FLOOR_DATABASE_NAME}" to run this operation ` +
        `(got: ${confirmation === undefined ? "unset" : JSON.stringify(confirmation)}).`
    );
  }
}

/**
 * The full guard, in the required order: (1) explicit confirmation
 * variable present and exactly correct — cheap, no I/O — then (2) a
 * live, read-only re-verification that the ACTUAL connected database
 * reports the approved name, via `identity` (never by parsing the URL
 * string — see this module's own header comment). Throws
 * UnsafeSeedFloorTargetError on any mismatch; resolves only when every
 * check passes. Callers MUST await this before performing any floor-data
 * write — see seedFloor.ts's own main(), the only production call site.
 */
export async function assertSafeSeedFloorTarget(identity: DatabaseIdentityReader, env: NodeJS.ProcessEnv = process.env): Promise<void> {
  assertSeedFloorConfirmation(env);
  const actual = await identity.currentDatabaseName();
  if (actual !== APPROVED_SEED_FLOOR_DATABASE_NAME) {
    throw new UnsafeSeedFloorTargetError(
      `the connected database reports "${String(actual)}", not the approved target "${APPROVED_SEED_FLOOR_DATABASE_NAME}". ` +
        "This check queries the live connection directly (SELECT current_database()) and never trusts the SEED_FLOOR_DATABASE_URL text alone."
    );
  }
}

/**
 * The real, Prisma-backed DatabaseIdentityReader used by seedFloor.ts's
 * main(). A short-lived connection opened ONLY for this read-only check
 * and closed immediately after — a separate connection from the one
 * seedFloor() itself opens for the actual upserts, so this module has no
 * dependency on that function's internals and vice versa.
 */
export function createPrismaIdentityReader(databaseUrl: string): DatabaseIdentityReader {
  return {
    async currentDatabaseName(): Promise<string | undefined> {
      const prisma = new PrismaClient({ datasourceUrl: databaseUrl });
      try {
        const rows = await prisma.$queryRawUnsafe<{ current_database: string }[]>("SELECT current_database()");
        return rows[0]?.current_database;
      } finally {
        await prisma.$disconnect();
      }
    },
  };
}
