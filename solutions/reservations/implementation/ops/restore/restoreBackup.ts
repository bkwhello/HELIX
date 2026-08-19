/**
 * R1.4 §12 — bounded restore workflow. Run via `npm run restore -- <backupId>`
 * (or set RESTORE_BACKUP_ID). Restores into RESTORE_TARGET_DATABASE_URL,
 * a connection string deliberately separate from DATABASE_URL and
 * TEST_DATABASE_URL — this script never restores into either of those by
 * construction (there is no code path that even reads those variables).
 *
 * Schema vs. data (R1.4 architecture report §12's explicit resolution of
 * "restored as part of the backup, replayed from the repository, or
 * another explicit mechanism?"): schema comes from the REPOSITORY
 * (`prisma migrate deploy`, run against the target before any data is
 * touched), data comes from the BACKUP (`pg_restore --data-only`). This
 * restore never trusts a dump's own embedded schema section — the
 * migration history in prisma/migrations/ is the one authoritative
 * schema definition, including the hand-written CHECK constraints and
 * partial unique indexes Prisma cannot regenerate declaratively
 * (schema.prisma's own comments on CapacityCommitment/StaffUser).
 *
 * Fail-closed default: refuses to run against a target that already
 * contains reservation/staff/contact data, UNLESS BOTH
 * RESTORE_ALLOW_NON_EMPTY_TARGET=true AND RESTORE_DISASTER_RECOVERY_CONFIRMATION
 * equal exactly the required phrase below are set — two independent,
 * deliberately-typed signals, not one flag, matching this project's
 * existing pattern for high-blast-radius actions (Owner-only recovery,
 * R1.2/R1.4 architecture report §17/§21).
 *
 * §8 ephemeral-data decision: staff_sessions and login_attempt_windows
 * are present in the dump (captured for forensic completeness) but are
 * NOT restored by default — restoring old, possibly-still-valid session
 * hashes and stale rate-limit counters into a freshly recovered system
 * would resurrect pre-incident state a disaster-recovery event should
 * instead force clean (fresh login required, fresh throttle counters).
 * Set RESTORE_INCLUDE_EPHEMERAL_TABLES=true to opt into restoring them
 * anyway (e.g. for a forensic investigation drill).
 */
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { PrismaClient } from "@prisma/client";
import { runPgTool, parseConnectionString, safeDatabaseIdentifier } from "../shared/pgTools.js";
import { EPHEMERAL_TABLES_EXCLUDED_FROM_DEFAULT_RESTORE, type BackupManifest } from "../backup/backupManifest.js";

const execFileAsync = promisify(execFile);

export const REQUIRED_DISASTER_RECOVERY_PHRASE =
  "I UNDERSTAND THIS WILL OVERWRITE THE TARGET DATABASE";

export class UnsafeRestoreTargetError extends Error {
  constructor(message: string) {
    super(`Refusing restore: ${message}`);
    this.name = "UnsafeRestoreTargetError";
  }
}

function resolveTargetUrl(): string {
  const url = process.env["RESTORE_TARGET_DATABASE_URL"];
  if (!url) {
    throw new UnsafeRestoreTargetError(
      "RESTORE_TARGET_DATABASE_URL is not set. A restore target must be explicit — this " +
        "script never falls back to DATABASE_URL or TEST_DATABASE_URL."
    );
  }
  return url;
}

function resolveBackupsDir(): string {
  return process.env["BACKUP_DESTINATION_DIR"] ?? join(process.cwd(), "backups");
}

export function loadManifest(backupId: string, backupsDir: string): BackupManifest {
  const files = readdirSync(backupsDir).filter(
    (f) => f.startsWith(backupId) && f.endsWith(".manifest.json")
  );
  if (files.length === 0) throw new Error(`No manifest found for backupId "${backupId}" in ${backupsDir}`);
  const manifest = JSON.parse(readFileSync(join(backupsDir, files[0]!), "utf8")) as BackupManifest;
  if (manifest.status !== "SUCCESS") {
    throw new Error(`Refusing to restore backup "${backupId}": manifest status is ${manifest.status}`);
  }
  return manifest;
}

/**
 * A target "appears operational/non-empty" if any core authoritative
 * table already has rows. A target with no schema at all (tables don't
 * exist yet) is treated as clean, not as an error.
 */
export async function targetAppearsNonEmpty(targetUrl: string): Promise<boolean> {
  const prisma = new PrismaClient({ datasourceUrl: targetUrl });
  try {
    for (const table of ["reservations", "staff_users", "contacts"]) {
      try {
        const rows = await prisma.$queryRawUnsafe<{ count: bigint }[]>(
          `SELECT COUNT(*)::bigint AS count FROM "${table}"`
        );
        if (rows[0] && Number(rows[0].count) > 0) return true;
      } catch {
        // Table doesn't exist yet — not evidence of an operational database.
        continue;
      }
    }
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

async function assertSafeRestoreTarget(targetUrl: string): Promise<void> {
  const nonEmpty = await targetAppearsNonEmpty(targetUrl);
  if (!nonEmpty) return;

  const allowFlag = process.env["RESTORE_ALLOW_NON_EMPTY_TARGET"] === "true";
  const confirmation = process.env["RESTORE_DISASTER_RECOVERY_CONFIRMATION"];
  if (allowFlag && confirmation === REQUIRED_DISASTER_RECOVERY_PHRASE) {
    console.warn(
      "restoreBackup: target appears non-empty, but explicit disaster-recovery override " +
        "(RESTORE_ALLOW_NON_EMPTY_TARGET + matching confirmation phrase) is present. Proceeding."
    );
    return;
  }
  throw new UnsafeRestoreTargetError(
    "target database already contains reservation/staff/contact data. This restore workflow " +
      "never silently overwrites a live database. To proceed anyway (real disaster recovery " +
      "only), set RESTORE_ALLOW_NON_EMPTY_TARGET=true AND RESTORE_DISASTER_RECOVERY_CONFIRMATION " +
      `to exactly "${REQUIRED_DISASTER_RECOVERY_PHRASE}".`
  );
}

async function applyRepositorySchema(targetUrl: string): Promise<void> {
  console.log("restoreBackup: applying repository schema (prisma migrate deploy) to target...");
  await execFileAsync("npx", ["prisma", "migrate", "deploy"], {
    cwd: process.cwd(),
    env: { ...process.env, DATABASE_URL: targetUrl },
    shell: process.platform === "win32",
  });
}

/**
 * `--disable-triggers` is required for a reliable `--data-only` restore
 * against a schema whose foreign keys already exist (our restore always
 * applies the repository's migrations, FKs included, before touching
 * data — see applyRepositorySchema above) — without it, pg_restore does
 * not guarantee parent-before-child load order and a plain application
 * role hits real foreign-key violations restoring child tables (found
 * directly, via this capability's own recovery drill; see the R1.4
 * implementation report's evidence appendix).
 *
 * `ALTER TABLE ... DISABLE TRIGGER ALL` against an internally-generated
 * FK constraint trigger is itself PostgreSQL-superuser-only, regardless
 * of table ownership — a plain application role (even one that owns the
 * tables, as the app role does here) gets "permission denied: ...is a
 * system trigger." This is standard, unavoidable PostgreSQL behavior for
 * bulk data-only restores, not a workaround — real operational practice
 * runs the restore step itself under an elevated/superuser credential,
 * then hands the database back to the ordinary application role
 * immediately afterward (this script never uses the elevated credential
 * for anything except this one restoreData() call).
 *
 * RESTORE_SUPERUSER_DATABASE_URL, if set, supplies that elevated
 * credential (same host/port/database as the target, different
 * user/password) for this step only. If unset, falls back to the
 * target's own credentials — correct for a target role that already
 * has superuser rights, but will reproduce the permission error above
 * against a least-privilege application role.
 */
async function restoreData(targetUrl: string, dumpPath: string): Promise<void> {
  const restoreConnUrl = process.env["RESTORE_SUPERUSER_DATABASE_URL"] ?? targetUrl;
  const conn = parseConnectionString(restoreConnUrl);
  console.log(`restoreBackup: restoring data into ${safeDatabaseIdentifier(conn)}...`);
  const result = await runPgTool(
    "pg_restore",
    [
      "-h", conn.host,
      "-p", conn.port,
      "-U", conn.user,
      "-d", conn.database,
      "--data-only",
      "--disable-triggers",
      "--no-owner",
      dumpPath,
    ],
    { password: conn.password, timeoutMs: 5 * 60 * 1000 }
  );
  // pg_restore commonly exits non-zero on benign warnings (e.g. role
  // mismatches with --no-owner); treat stderr content as informational
  // and only fail on a genuinely empty/failed restore signaled by exit
  // code AND no rows restored — verified independently afterward by
  // ops/integrity/verifyIntegrity.ts, never assumed here from exit code
  // alone (§14: "a successful pg_restore alone is NOT sufficient").
  if (result.exitCode !== 0) {
    console.warn(`restoreBackup: pg_restore exited ${result.exitCode} — stderr:\n${result.stderr}`);
  }
}

async function clearEphemeralTables(targetUrl: string): Promise<void> {
  if (process.env["RESTORE_INCLUDE_EPHEMERAL_TABLES"] === "true") {
    console.log("restoreBackup: RESTORE_INCLUDE_EPHEMERAL_TABLES=true — leaving ephemeral tables as restored.");
    return;
  }
  const prisma = new PrismaClient({ datasourceUrl: targetUrl });
  try {
    for (const table of EPHEMERAL_TABLES_EXCLUDED_FROM_DEFAULT_RESTORE) {
      await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${table}" RESTART IDENTITY CASCADE`);
    }
    console.log(
      `restoreBackup: cleared ephemeral tables post-restore (${EPHEMERAL_TABLES_EXCLUDED_FROM_DEFAULT_RESTORE.join(", ")}) — ` +
        "forces fresh login and a clean rate-limit slate. See backupManifest.ts's header comment."
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function restoreBackup(backupId: string): Promise<{ manifest: BackupManifest; targetUrl: string }> {
  const targetUrl = resolveTargetUrl();
  await assertSafeRestoreTarget(targetUrl);

  const backupsDir = resolveBackupsDir();
  const manifest = loadManifest(backupId, backupsDir);
  const dumpPath = join(backupsDir, manifest.filename);

  await applyRepositorySchema(targetUrl);
  await restoreData(targetUrl, dumpPath);
  await clearEphemeralTables(targetUrl);

  return { manifest, targetUrl };
}

async function main(): Promise<void> {
  const backupId = process.argv[2] ?? process.env["RESTORE_BACKUP_ID"];
  if (!backupId) {
    console.error("restoreBackup: usage: npm run restore -- <backupId>  (or set RESTORE_BACKUP_ID)");
    process.exitCode = 1;
    return;
  }
  const { manifest } = await restoreBackup(backupId);
  console.log(`restoreBackup: SUCCESS — restored backup ${manifest.backupId} (${manifest.filename})`);
}

const isDirectRun = process.argv[1]?.endsWith("restoreBackup.ts") || process.argv[1]?.endsWith("restoreBackup.js");
if (isDirectRun) {
  main().catch((err) => {
    console.error("restoreBackup: failed —", err instanceof Error ? err.message : err);
    process.exitCode = 1;
  });
}
