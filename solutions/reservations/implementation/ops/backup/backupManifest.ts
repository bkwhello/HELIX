/**
 * R1.4 §11 — Backup Manifest shape. Deliberately excludes any credential
 * or connection secret — `databaseIdentifier` is host:port/dbname only
 * (see ops/shared/pgTools.ts's safeDatabaseIdentifier).
 */
export interface BackupManifest {
  readonly backupId: string;
  readonly createdAt: string; // ISO 8601
  readonly databaseIdentifier: string; // host:port/dbname — never a credential
  readonly schemaMigrations: readonly string[]; // applied Prisma migration names, from _prisma_migrations
  readonly applicationCommit: string; // `git rev-parse HEAD`, or "unknown" if unavailable
  readonly filename: string;
  readonly sizeBytes: number;
  readonly checksumSha256: string;
  readonly status: "SUCCESS" | "FAILED";
  readonly failureReason?: string;
  /**
   * R1.4 §8 — documented, deliberate decision: these tables are captured
   * in the dump for forensic completeness but are NOT restored into an
   * operational database by ops/restore/restoreBackup.ts's default path,
   * because doing so would resurrect pre-incident session/rate-limit
   * state rather than starting the recovered system from a clean,
   * forced-reauthentication posture. See restoreBackup.ts's header
   * comment for the full reasoning.
   */
  readonly excludedFromDefaultRestore: readonly string[];
}

export const EPHEMERAL_TABLES_EXCLUDED_FROM_DEFAULT_RESTORE = [
  "staff_sessions",
  "login_attempt_windows",
] as const;
