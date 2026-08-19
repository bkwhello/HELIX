/**
 * R1.4 §7 — bounded PostgreSQL logical-backup mechanism. `pg_dump`
 * (custom format, `-Fc`) rather than an application-level table export,
 * per the assignment's explicit instruction. Run via `npm run backup`.
 *
 * Source database: BACKUP_SOURCE_DATABASE_URL if set, otherwise
 * DATABASE_URL (the primary/pilot database — the thing this whole
 * capability exists to protect). The override exists so a recovery
 * drill (ops/recoveryDrill.ts) can target a different, disposable
 * database without ever touching the real one.
 *
 * Destination: BACKUP_DESTINATION_DIR if set, otherwise ./backups
 * (gitignored — see .gitignore and §10/AC-R10). This directory is
 * PRIMARY-DATABASE-ADJACENT LOCAL STORAGE ONLY — it is explicitly NOT
 * an independent failure domain (R1.4 architecture report §10). Moving
 * the artifact this script produces to a genuinely independent
 * destination (a different host/account/region) is a separate,
 * hosting-dependent step this script deliberately does not perform —
 * see this file's own manifest output and the implementation report's
 * "Hosting-Dependent Requirements" section.
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, unlinkSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { PrismaClient } from "@prisma/client";
import { runPgTool, parseConnectionString, safeDatabaseIdentifier } from "../shared/pgTools.js";
import { EPHEMERAL_TABLES_EXCLUDED_FROM_DEFAULT_RESTORE, type BackupManifest } from "./backupManifest.js";

const execFileAsync = promisify(execFile);

function resolveSourceUrl(): string {
  const url = process.env["BACKUP_SOURCE_DATABASE_URL"] ?? process.env["DATABASE_URL"];
  if (!url) throw new Error("createBackup: neither BACKUP_SOURCE_DATABASE_URL nor DATABASE_URL is set.");
  return url;
}

function resolveDestinationDir(): string {
  const dir = process.env["BACKUP_DESTINATION_DIR"] ?? join(process.cwd(), "backups");
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  return dir;
}

function backupId(now: Date): string {
  return now.toISOString().replace(/[:.]/g, "-");
}

async function currentGitCommit(): Promise<string> {
  try {
    const { stdout } = await execFileAsync("git", ["rev-parse", "HEAD"], { cwd: process.cwd() });
    return stdout.trim();
  } catch {
    return "unknown";
  }
}

async function appliedMigrations(sourceUrl: string): Promise<string[]> {
  const prisma = new PrismaClient({ datasourceUrl: sourceUrl });
  try {
    const rows = await prisma.$queryRawUnsafe<{ migration_name: string }[]>(
      'SELECT migration_name FROM "_prisma_migrations" WHERE finished_at IS NOT NULL ORDER BY finished_at ASC'
    );
    return rows.map((r) => r.migration_name);
  } catch {
    return []; // e.g. a database with no _prisma_migrations table at all — reported empty, not fatal
  } finally {
    await prisma.$disconnect();
  }
}

function sha256Of(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = createHash("sha256");
    readFile(filePath)
      .then((buf) => {
        hash.update(buf);
        resolve(hash.digest("hex"));
      })
      .catch(reject);
  });
}

/** §7 retention handling — keep only the N most recent successful backups. */
function applyRetention(destinationDir: string, keep: number): void {
  const manifestFiles = readdirSync(destinationDir).filter((f) => f.endsWith(".manifest.json"));
  const manifests = manifestFiles
    .map((f) => {
      const raw = JSON.parse(readFileSync(join(destinationDir, f), "utf8")) as BackupManifest;
      return { file: f, manifest: raw };
    })
    .filter((m) => m.manifest.status === "SUCCESS")
    .sort((a, b) => b.manifest.createdAt.localeCompare(a.manifest.createdAt));

  for (const stale of manifests.slice(keep)) {
    const dumpPath = join(destinationDir, stale.manifest.filename);
    const manifestPath = join(destinationDir, stale.file);
    if (existsSync(dumpPath)) unlinkSync(dumpPath);
    if (existsSync(manifestPath)) unlinkSync(manifestPath);
    console.log(`createBackup: retention removed old backup ${stale.manifest.backupId}`);
  }
}

export interface CreateBackupOptions {
  readonly sourceUrl?: string;
  readonly destinationDir?: string;
  readonly retentionCount?: number;
}

export async function createBackup(options: CreateBackupOptions = {}): Promise<BackupManifest> {
  const sourceUrl = options.sourceUrl ?? resolveSourceUrl();
  const conn = parseConnectionString(sourceUrl);
  const destinationDir = options.destinationDir ?? resolveDestinationDir();
  const now = new Date();
  const id = backupId(now);
  const filename = `${id}__${conn.database}.dump`;
  const filePath = join(destinationDir, filename);
  const retentionCount = options.retentionCount ?? Number(process.env["BACKUP_RETENTION_COUNT"] ?? "30");

  console.log(`createBackup: dumping ${safeDatabaseIdentifier(conn)} -> ${filePath}`);

  const result = await runPgTool(
    "pg_dump",
    [
      "-h", conn.host,
      "-p", conn.port,
      "-U", conn.user,
      "-d", conn.database,
      "-Fc",
      // Test-tooling metadata (tests/integration/support/testDatabaseSafety.ts),
      // not application schema — never part of a real backup's data set.
      // Harmless no-op against a database where this table doesn't exist
      // (e.g. the pilot database).
      "--exclude-table=_test_database_sentinel",
      "-f", filePath,
    ],
    { password: conn.password, timeoutMs: 5 * 60 * 1000 }
  );

  const manifestPath = join(destinationDir, `${id}__${conn.database}.manifest.json`);

  if (result.exitCode !== 0) {
    const failedManifest: BackupManifest = {
      backupId: id,
      createdAt: now.toISOString(),
      databaseIdentifier: safeDatabaseIdentifier(conn),
      schemaMigrations: [],
      applicationCommit: await currentGitCommit(),
      filename,
      sizeBytes: 0,
      checksumSha256: "",
      status: "FAILED",
      failureReason: result.stderr.slice(0, 2000) || `pg_dump exited with code ${result.exitCode}`,
      excludedFromDefaultRestore: [...EPHEMERAL_TABLES_EXCLUDED_FROM_DEFAULT_RESTORE],
    };
    writeFileSync(manifestPath, JSON.stringify(failedManifest, null, 2));
    console.error(`createBackup: FAILED — ${failedManifest.failureReason}`);
    return failedManifest;
  }

  const stats = statSync(filePath);
  const checksum = await sha256Of(filePath);
  const migrations = await appliedMigrations(sourceUrl);
  const commit = await currentGitCommit();

  const manifest: BackupManifest = {
    backupId: id,
    createdAt: now.toISOString(),
    databaseIdentifier: safeDatabaseIdentifier(conn),
    schemaMigrations: migrations,
    applicationCommit: commit,
    filename,
    sizeBytes: stats.size,
    checksumSha256: checksum,
    status: "SUCCESS",
    excludedFromDefaultRestore: [...EPHEMERAL_TABLES_EXCLUDED_FROM_DEFAULT_RESTORE],
  };
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

  console.log(
    `createBackup: SUCCESS — ${filename} (${stats.size} bytes, sha256 ${checksum.slice(0, 12)}...)`
  );

  applyRetention(destinationDir, retentionCount);
  return manifest;
}

async function main(): Promise<void> {
  const manifest = await createBackup();
  if (manifest.status === "FAILED") process.exitCode = 1;
}

const isDirectRun = process.argv[1]?.endsWith("createBackup.ts") || process.argv[1]?.endsWith("createBackup.js");
if (isDirectRun) {
  main().catch((err) => {
    console.error("createBackup: unexpected failure —", err);
    process.exitCode = 1;
  });
}
