import { PrismaClient } from "@prisma/client";

/**
 * R1.5-P2B-B — the Main Floor bootstrap's own target safety guard.
 * Deliberately a SEPARATE module from ops/floor/seedFloorSafety.ts, not an
 * extension of it — that module's own header comment explicitly documents
 * "Port is deliberately NOT enforced" and has no host/loopback check at
 * all, a decision this bootstrap does not disturb. This bootstrap is a
 * stricter operation (an idempotent, drift-sensitive, one-transaction
 * write of production-shaped ids) and adds one guard seed-floor does not
 * have: a live loopback-host check. Everything else mirrors
 * seedFloorSafety.ts's own structure and reasoning exactly (dedicated env
 * var, no DATABASE_URL fallback, live-identity re-verification, no
 * secret-derived value ever printed).
 */

export class UnsafeSeedFloorplanTargetError extends Error {
  constructor(message: string) {
    super(`Refusing Main Floor bootstrap target: ${message}`);
    this.name = "UnsafeSeedFloorplanTargetError";
  }
}

export const APPROVED_SEED_FLOORPLAN_DATABASE_NAME = "helix_reservations_dev";

export interface DatabaseIdentityReader {
  currentDatabaseName(): Promise<string | undefined>;
  /**
   * The live `inet_server_addr()` the connection actually reached — NULL
   * (surfaced here as undefined) for a Unix-domain-socket connection,
   * which is inherently local and therefore also accepted. A real,
   * non-loopback TCP address is refused. Never derived from the URL
   * string — a hostname of "localhost" in the connection string proves
   * nothing about where the server actually is.
   */
  serverAddress(): Promise<string | undefined>;
}

/**
 * Resolves the connection string this bootstrap must use. Reads ONLY
 * `SEED_FLOORPLAN_DATABASE_URL` — `DATABASE_URL` (the application/pilot
 * connection string) is never consulted here, structurally, so this
 * script can never silently fall back to it.
 */
export function resolveSeedFloorplanDatabaseUrl(env: NodeJS.ProcessEnv = process.env): string {
  const url = env["SEED_FLOORPLAN_DATABASE_URL"];
  if (!url || url.trim().length === 0) {
    throw new UnsafeSeedFloorplanTargetError(
      "SEED_FLOORPLAN_DATABASE_URL is not set. This operation never falls back to DATABASE_URL — " +
        `set SEED_FLOORPLAN_DATABASE_URL explicitly to the ${APPROVED_SEED_FLOORPLAN_DATABASE_NAME} connection string.`
    );
  }
  return url;
}

export function assertSeedFloorplanConfirmation(env: NodeJS.ProcessEnv = process.env): void {
  const confirmation = env["SEED_FLOORPLAN_CONFIRM_DATABASE"];
  if (confirmation !== APPROVED_SEED_FLOORPLAN_DATABASE_NAME) {
    throw new UnsafeSeedFloorplanTargetError(
      `SEED_FLOORPLAN_CONFIRM_DATABASE must be set to exactly "${APPROVED_SEED_FLOORPLAN_DATABASE_NAME}" ` +
        `(got: ${confirmation === undefined ? "unset" : JSON.stringify(confirmation)}).`
    );
  }
}

const LOOPBACK_PREFIXES = ["127.", "::1"];

function isLoopbackAddress(addr: string): boolean {
  const normalized = addr.split("/")[0] ?? addr; // inet_server_addr()::text can carry a "/128"-style CIDR suffix
  return LOOPBACK_PREFIXES.some((prefix) => normalized.startsWith(prefix));
}

/**
 * The full guard, in fail-closed order: confirmation string first (never
 * even opens a connection on a bad confirmation), then the live database
 * name, then the live server address. Every check must resolve before the
 * bootstrap's own write function is ever called.
 */
export async function assertSafeSeedFloorplanTarget(identity: DatabaseIdentityReader, env: NodeJS.ProcessEnv = process.env): Promise<void> {
  assertSeedFloorplanConfirmation(env);

  const actualDb = await identity.currentDatabaseName();
  if (actualDb !== APPROVED_SEED_FLOORPLAN_DATABASE_NAME) {
    throw new UnsafeSeedFloorplanTargetError(
      `the connected database reports "${String(actualDb)}", not the approved target "${APPROVED_SEED_FLOORPLAN_DATABASE_NAME}".`
    );
  }

  const addr = await identity.serverAddress();
  if (addr !== undefined && !isLoopbackAddress(addr)) {
    throw new UnsafeSeedFloorplanTargetError(
      `the connected server address "${addr}" is not loopback. This operation refuses non-loopback targets ` +
        "unless a future explicit authorization changes that rule."
    );
  }
}

export function createPrismaIdentityReader(databaseUrl: string): DatabaseIdentityReader {
  return {
    async currentDatabaseName() {
      const prisma = new PrismaClient({ datasourceUrl: databaseUrl });
      try {
        const rows = await prisma.$queryRawUnsafe<{ current_database: string }[]>("SELECT current_database()");
        return rows[0]?.current_database;
      } finally {
        await prisma.$disconnect();
      }
    },
    async serverAddress() {
      const prisma = new PrismaClient({ datasourceUrl: databaseUrl });
      try {
        const rows = await prisma.$queryRawUnsafe<{ addr: string | null }[]>("SELECT inet_server_addr()::text AS addr");
        return rows[0]?.addr ?? undefined;
      } finally {
        await prisma.$disconnect();
      }
    },
  };
}
