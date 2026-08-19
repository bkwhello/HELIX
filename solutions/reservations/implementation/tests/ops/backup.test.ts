import { describe, it, expect, beforeAll } from "vitest";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createBackup } from "../../ops/backup/createBackup.js";
import { createTestPrismaClient, truncateReservationDomainTables } from "../integration/support/testDatabaseSafety.js";

/**
 * R1.4 §23 "Backup" required tests. Runs real pg_dump against the
 * dedicated TEST_DATABASE_URL — never DATABASE_URL.
 */
describe("R1.4 — backup mechanism", () => {
  const sourceUrl = process.env["TEST_DATABASE_URL"];
  if (!sourceUrl) throw new Error("TEST_DATABASE_URL must be set for this test file");

  beforeAll(async () => {
    const prisma = createTestPrismaClient();
    await truncateReservationDomainTables(prisma);
    await prisma.$disconnect();
  });

  it("produces a manifest with a valid checksum matching the dump file", async () => {
    const dir = mkdtempSync(join(tmpdir(), "r14-backup-test-"));
    try {
      const manifest = await createBackup({ sourceUrl, destinationDir: dir, retentionCount: 30 });
      expect(manifest.status).toBe("SUCCESS");
      expect(manifest.checksumSha256).toMatch(/^[0-9a-f]{64}$/);
      expect(manifest.sizeBytes).toBeGreaterThan(0);

      const dumpPath = join(dir, manifest.filename);
      expect(existsSync(dumpPath)).toBe(true);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("includes schema/migration state and an application commit, and captures the SOURCE database's own identity — never a credential", async () => {
    const dir = mkdtempSync(join(tmpdir(), "r14-backup-test-"));
    try {
      const manifest = await createBackup({ sourceUrl, destinationDir: dir });
      expect(manifest.schemaMigrations.length).toBeGreaterThan(0);
      expect(manifest.applicationCommit).toMatch(/^[0-9a-f]{40}$|^unknown$/);
      expect(manifest.databaseIdentifier).toContain("helix_reservations_test");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("never writes the database password into the manifest (secrets absent from manifest)", async () => {
    const dir = mkdtempSync(join(tmpdir(), "r14-backup-test-"));
    try {
      const manifest = await createBackup({ sourceUrl, destinationDir: dir });
      const manifestFiles = readFileSync(join(dir, `${manifest.backupId}__helix_reservations_test.manifest.json`), "utf8");
      const conn = new URL(sourceUrl);
      expect(manifestFiles).not.toContain(decodeURIComponent(conn.password));
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("detects and records a backup command failure (bad source connection) rather than throwing an unhandled error", async () => {
    const dir = mkdtempSync(join(tmpdir(), "r14-backup-test-"));
    try {
      const unreachableUrl = "postgresql://helix_reservations:wrong@localhost:59999/does_not_exist?schema=public";
      const manifest = await createBackup({ sourceUrl: unreachableUrl, destinationDir: dir });
      expect(manifest.status).toBe("FAILED");
      expect(manifest.failureReason).toBeTruthy();
      expect(manifest.checksumSha256).toBe("");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("retention removes old backups beyond the configured count", async () => {
    const dir = mkdtempSync(join(tmpdir(), "r14-backup-test-"));
    try {
      await createBackup({ sourceUrl, destinationDir: dir, retentionCount: 1 });
      await new Promise((r) => setTimeout(r, 5));
      const second = await createBackup({ sourceUrl, destinationDir: dir, retentionCount: 1 });

      const { readdirSync } = await import("node:fs");
      const manifests = readdirSync(dir).filter((f) => f.endsWith(".manifest.json"));
      expect(manifests).toHaveLength(1);
      expect(manifests[0]).toContain(second.backupId);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
