import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createBackup } from "../../ops/backup/createBackup.js";
import {
  restoreBackup,
  loadManifest,
  targetAppearsNonEmpty,
  UnsafeRestoreTargetError,
  REQUIRED_DISASTER_RECOVERY_PHRASE,
} from "../../ops/restore/restoreBackup.js";
import { verifyIntegrity } from "../../ops/integrity/verifyIntegrity.js";
import { runPgTool, parseConnectionString } from "../../ops/shared/pgTools.js";
import type { BackupManifest } from "../../ops/backup/backupManifest.js";
import { createTestPrismaClient, truncateReservationDomainTables, truncateStaffDomainTables } from "../integration/support/testDatabaseSafety.js";

/**
 * R1.4 §23 "Restore" / "Integrity" / "Existing regressions" and §24
 * failure-injection required tests. Real PostgreSQL throughout:
 * TEST_DATABASE_URL as the backup source, RESTORE_TARGET_DATABASE_URL
 * (a dedicated, disposable recovery database — never DATABASE_URL, never
 * TEST_DATABASE_URL) as the restore target.
 */
describe("R1.4 — restore mechanism, integrity verification, and failure injection", () => {
  const sourceUrl = process.env["TEST_DATABASE_URL"];
  const targetUrl = process.env["RESTORE_TARGET_DATABASE_URL"];
  if (!sourceUrl) throw new Error("TEST_DATABASE_URL must be set for this test file");
  if (!targetUrl) throw new Error("RESTORE_TARGET_DATABASE_URL must be set for this test file");

  let backupDir: string;
  let manifest: BackupManifest;
  let reservationId: string;
  let contactId: string;

  async function wipeTarget(): Promise<void> {
    // Deliberately the TARGET's own (non-superuser) credentials, same as
    // ops/recoveryDrill.ts's wipeRecoveryTarget — helix_reservations owns
    // this database and can drop/recreate its own public schema. Using
    // the elevated RESTORE_SUPERUSER_DATABASE_URL here instead would
    // recreate the schema under a different owner than the role
    // `prisma migrate deploy` subsequently connects as, which breaks it.
    const conn = parseConnectionString(targetUrl!);
    const result = await runPgTool(
      "psql",
      ["-h", conn.host, "-p", conn.port, "-U", conn.user, "-d", conn.database, "-c", "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"],
      { password: conn.password, timeoutMs: 60_000 }
    );
    if (result.exitCode !== 0) throw new Error(`wipeTarget failed: ${result.stderr}`);
  }

  beforeAll(async () => {
    // Seed a small, real dataset in the source (test) database.
    const seedClient = createTestPrismaClient();
    await truncateReservationDomainTables(seedClient);
    await truncateStaffDomainTables(seedClient);

    const now = new Date();
    contactId = "ops-test-contact-1";
    await seedClient.contact.create({
      data: { id: contactId, displayName: "Ops Test Guest", phoneRaw: "0611112222", phoneNormalized: "+31611112222", createdBy: "seed", lastRelevantActivityAt: now },
    });
    reservationId = "ops-test-res-1";
    await seedClient.reservation.create({
      data: {
        id: reservationId, servicePeriodId: "sp-ops-test", contactId, contactName: "Ops Test Guest", contactPhoneSnapshot: "+31611112222",
        status: "Confirmed", reservationDate: new Date("2026-09-05T18:00:00Z"), partySize: 3, sourceCategory: "Telephone",
        createdBy: "seed", createdAt: now, updatedAt: now, version: 1,
      },
    });
    await seedClient.reservationEvent.create({ data: { reservationId, type: "Created", occurredAt: now, payload: "{}" } });
    await seedClient.$disconnect();

    backupDir = mkdtempSync(join(tmpdir(), "r14-restore-test-"));
    manifest = await createBackup({ sourceUrl, destinationDir: backupDir });
    expect(manifest.status).toBe("SUCCESS");
  });

  afterAll(async () => {
    delete process.env["BACKUP_DESTINATION_DIR"];
    delete process.env["RESTORE_ALLOW_NON_EMPTY_TARGET"];
    delete process.env["RESTORE_DISASTER_RECOVERY_CONFIRMATION"];
    delete process.env["RESTORE_TARGET_DATABASE_URL"];
    process.env["RESTORE_TARGET_DATABASE_URL"] = targetUrl;
    rmSync(backupDir, { recursive: true, force: true });
    await wipeTarget();
  });

  it("clean target restore → succeeds and post-restore integrity check → PASS", async () => {
    await wipeTarget();
    process.env["BACKUP_DESTINATION_DIR"] = backupDir;
    await restoreBackup(manifest.backupId);

    const report = await verifyIntegrity(targetUrl);
    for (const c of report.checks) if (c.status === "FAIL") console.error(`unexpected FAIL: ${c.name} — ${c.detail}`);
    expect(report.overall).toBe("PASS");

    const nonEmpty = await targetAppearsNonEmpty(targetUrl);
    expect(nonEmpty).toBe(true); // restored data is genuinely present
  }, 30_000);

  it("unsafe/non-clean target refused — restoring again without override is rejected, TRUNCATE/restore never proceeds", async () => {
    // Target still holds the previous test's restored data — non-empty.
    await expect(restoreBackup(manifest.backupId)).rejects.toThrow(UnsafeRestoreTargetError);
  });

  it("explicit disaster-recovery override permits restoring into a non-empty target", async () => {
    process.env["RESTORE_ALLOW_NON_EMPTY_TARGET"] = "true";
    process.env["RESTORE_DISASTER_RECOVERY_CONFIRMATION"] = REQUIRED_DISASTER_RECOVERY_PHRASE;
    try {
      await expect(restoreBackup(manifest.backupId)).resolves.toBeTruthy();
    } finally {
      delete process.env["RESTORE_ALLOW_NON_EMPTY_TARGET"];
      delete process.env["RESTORE_DISASTER_RECOVERY_CONFIRMATION"];
    }
  }, 30_000);

  it("wrong/mismatched confirmation phrase does NOT bypass the safety gate", async () => {
    process.env["RESTORE_ALLOW_NON_EMPTY_TARGET"] = "true";
    process.env["RESTORE_DISASTER_RECOVERY_CONFIRMATION"] = "yes please restore it";
    try {
      await expect(restoreBackup(manifest.backupId)).rejects.toThrow(UnsafeRestoreTargetError);
    } finally {
      delete process.env["RESTORE_ALLOW_NON_EMPTY_TARGET"];
      delete process.env["RESTORE_DISASTER_RECOVERY_CONFIRMATION"];
    }
  });

  it("missing backup → refused", () => {
    expect(() => loadManifest("does-not-exist-anywhere", backupDir)).toThrow();
  });

  it("corrupt/invalid (FAILED-status) backup → refused before any restore is attempted", () => {
    const fakeId = "fake-failed-backup";
    const fakeManifest: BackupManifest = {
      backupId: fakeId, createdAt: new Date().toISOString(), databaseIdentifier: "localhost:5433/fake",
      schemaMigrations: [], applicationCommit: "unknown", filename: `${fakeId}__fake.dump`, sizeBytes: 0,
      checksumSha256: "", status: "FAILED", failureReason: "synthetic test failure", excludedFromDefaultRestore: [],
    };
    writeFileSync(join(backupDir, `${fakeId}__fake.manifest.json`), JSON.stringify(fakeManifest));
    expect(() => loadManifest(fakeId, backupDir)).toThrow(/status is FAILED/);
  });

  it("restore command failure (target connection unreachable) is surfaced, not silently swallowed", async () => {
    const originalTarget = process.env["RESTORE_TARGET_DATABASE_URL"];
    process.env["RESTORE_TARGET_DATABASE_URL"] = "postgresql://helix_reservations:wrong@localhost:59999/does_not_exist?schema=public";
    try {
      await expect(restoreBackup(manifest.backupId)).rejects.toThrow();
    } finally {
      process.env["RESTORE_TARGET_DATABASE_URL"] = originalTarget;
    }
  }, 30_000);

  it("intentionally broken invariant (Contact deleted out from under a restored Reservation) → integrity check FAILs, not PASSes", async () => {
    await wipeTarget();
    await restoreBackup(manifest.backupId);

    // Confirmed valid immediately after restore.
    const before = await verifyIntegrity(targetUrl);
    expect(before.overall).toBe("PASS");

    // Deliberately corrupt: Reservation.contactId is NOT a real foreign
    // key (schema.prisma's own documented design choice), so this
    // delete is not blocked at the database level the way a real FK
    // would block it — exactly the gap this integrity check exists to
    // catch instead.
    const prisma = new PrismaClient({ datasourceUrl: targetUrl });
    await prisma.contact.delete({ where: { id: contactId } });
    await prisma.$disconnect();

    const after = await verifyIntegrity(targetUrl);
    expect(after.overall).toBe("FAIL");
    const contactCheck = after.checks.find((c) => c.name === "post-cap-d05-01-reservations-resolve-valid-contact");
    expect(contactCheck?.status).toBe("FAIL");
    // The core requirement: tooling must not report SUCCESS/PASS when a
    // technically-successful restore leaves the application state
    // broken.
  }, 30_000);
});
