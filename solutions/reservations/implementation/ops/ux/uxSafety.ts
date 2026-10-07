/**
 * R1.5-P7-D — hard safety gates for the isolated Reception UX environment.
 *
 * The UX environment is a SEPARATE database (`helix_reservations_ux`) on the
 * same local PostgreSQL cluster (port 5433) as `helix_reservations_dev`, served
 * by a second app instance on 127.0.0.1:3002. Every UX tool (provision, seed,
 * teardown, disposable cleanup) must prove — against the LIVE connection, not
 * just a connection string — that it is talking to exactly that database, and
 * (for anything that writes business data) that the database was explicitly
 * provisioned as a UX dataset target via the `_ux_dataset_sentinel` table.
 *
 * Same fail-closed posture as tests/integration/support/testDatabaseSafety.ts
 * and ops/floor/seedFloorSafety.ts: a gate that could bless its own target on
 * the fly would not be a gate, so the sentinel is created ONLY by
 * provisionUxDatabase.ts, after the exact-name check.
 */
export const UX_DATABASE_NAME = "helix_reservations_ux";
export const UX_CLUSTER_PORT = 5433;
export const UX_APP_PORT = 3002;
export const DEV_APP_PORT = 3001;
export const UX_SENTINEL_TABLE = "_ux_dataset_sentinel";
const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

export class UxSafetyError extends Error {
  constructor(message: string) {
    super(`UX safety gate refused: ${message}`);
    this.name = "UxSafetyError";
  }
}

export interface UxSentinelRow {
  readonly provisionedAt: Date;
  readonly seedingStartedAt: Date | null;
  readonly seededAt: Date | null;
  readonly datasetDate: string | null;
  readonly datasetVersion: string | null;
}

/** The two live facts every gate decides on. */
export interface UxIdentityReader {
  currentDatabase(): Promise<string>;
  /** null when the sentinel table does not exist or has no row. */
  readSentinel(): Promise<UxSentinelRow | null>;
}

type RawQueryClient = { $queryRawUnsafe<T = unknown>(query: string, ...values: unknown[]): Promise<T> };

export function createPrismaUxIdentityReader(prisma: RawQueryClient): UxIdentityReader {
  return {
    async currentDatabase() {
      const rows = await prisma.$queryRawUnsafe<{ db: string }[]>("SELECT current_database() AS db");
      return String(rows[0]?.db);
    },
    async readSentinel() {
      const exists = await prisma.$queryRawUnsafe<{ exists: boolean }[]>(
        `SELECT to_regclass('public.${UX_SENTINEL_TABLE}') IS NOT NULL AS exists`
      );
      if (!exists[0]?.exists) return null;
      const rows = await prisma.$queryRawUnsafe<
        { provisioned_at: Date; seeding_started_at: Date | null; seeded_at: Date | null; dataset_date: string | null; dataset_version: string | null }[]
      >(`SELECT provisioned_at, seeding_started_at, seeded_at, dataset_date, dataset_version FROM "${UX_SENTINEL_TABLE}" WHERE id = 1`);
      const r = rows[0];
      if (!r) return null;
      return { provisionedAt: r.provisioned_at, seedingStartedAt: r.seeding_started_at, seededAt: r.seeded_at, datasetDate: r.dataset_date, datasetVersion: r.dataset_version };
    },
  };
}

/** Static check of a connection string: loopback host, cluster port 5433, database name exactly helix_reservations_ux. */
export function assertUxDatabaseUrl(databaseUrl: string | undefined): string {
  if (!databaseUrl) throw new UxSafetyError("no UX database URL configured (expected DATABASE_URL from .env.ux).");
  let url: URL;
  try {
    url = new URL(databaseUrl);
  } catch {
    throw new UxSafetyError("the UX database URL is not a valid URL.");
  }
  if (!LOOPBACK_HOSTS.has(url.hostname)) throw new UxSafetyError(`database host "${url.hostname}" is not loopback.`);
  if (Number(url.port) !== UX_CLUSTER_PORT) throw new UxSafetyError(`database port "${url.port}" is not the HELIX cluster port ${UX_CLUSTER_PORT}.`);
  const name = url.pathname.replace(/^\//, "");
  if (name !== UX_DATABASE_NAME) throw new UxSafetyError(`database name "${name}" is not exactly "${UX_DATABASE_NAME}".`);
  return databaseUrl;
}

/** Live identity only (used by provisioning BEFORE the sentinel exists). */
export async function assertConnectedToUxDatabase(reader: UxIdentityReader): Promise<void> {
  const live = await reader.currentDatabase();
  if (live !== UX_DATABASE_NAME) throw new UxSafetyError(`the live connection reports current_database() = "${live}", not "${UX_DATABASE_NAME}".`);
}

/** Live identity AND the provisioned sentinel — required before ANY destructive or business-data operation. */
export async function assertProvisionedUxDatabase(reader: UxIdentityReader): Promise<UxSentinelRow> {
  await assertConnectedToUxDatabase(reader);
  const sentinel = await reader.readSentinel();
  if (!sentinel) throw new UxSafetyError(`the "${UX_SENTINEL_TABLE}" sentinel is missing — this database was never provisioned as a UX dataset target (run ux:provision).`);
  return sentinel;
}

/** Identity + sentinel + not already seeded (or partially seeded) — the seed's own gate. */
export async function assertUxSeedable(reader: UxIdentityReader): Promise<UxSentinelRow> {
  const sentinel = await assertProvisionedUxDatabase(reader);
  if (sentinel.seededAt) throw new UxSafetyError(`the UX dataset was already seeded at ${sentinel.seededAt.toISOString()} (dataset ${sentinel.datasetDate}); run ux:teardown first to reseed.`);
  if (sentinel.seedingStartedAt) throw new UxSafetyError(`a previous seed started at ${sentinel.seedingStartedAt.toISOString()} and did not complete; run ux:teardown first.`);
  return sentinel;
}

/** The UX app instance is only ever reached on loopback port 3002 — never the dev instance on 3001. */
export function assertUxBaseUrl(baseUrl: string | undefined): string {
  if (!baseUrl) throw new UxSafetyError("no UX base URL configured.");
  const url = new URL(baseUrl);
  if (!LOOPBACK_HOSTS.has(url.hostname)) throw new UxSafetyError(`UX base URL host "${url.hostname}" is not loopback.`);
  if (Number(url.port) === DEV_APP_PORT) throw new UxSafetyError(`UX base URL points at the DEV app port ${DEV_APP_PORT}.`);
  if (Number(url.port) !== UX_APP_PORT) throw new UxSafetyError(`UX base URL port "${url.port}" is not ${UX_APP_PORT}.`);
  return baseUrl.replace(/\/$/, "");
}
