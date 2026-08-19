/**
 * R1.4 §14 — post-restore integrity verification. "A successful
 * pg_restore alone is NOT sufficient" — this module is the thing that
 * actually decides PASS/FAIL by inspecting the restored application
 * state itself. Run via `npm run verify-integrity` (reads
 * RESTORE_TARGET_DATABASE_URL) or call `verifyIntegrity(url)` directly.
 */
import { readdirSync } from "node:fs";
import { join } from "node:path";
import { PrismaClient } from "@prisma/client";

export interface IntegrityCheckResult {
  readonly name: string;
  readonly status: "PASS" | "FAIL";
  readonly detail: string;
}

export interface IntegrityReport {
  readonly overall: "PASS" | "FAIL";
  readonly generatedAt: string;
  readonly checks: readonly IntegrityCheckResult[];
}

// CAP-D05.01's migration timestamp — reservations created at/after this
// instant are held to the "must resolve a real Contact" standard;
// earlier rows may legitimately carry the pre-CAP-D05.01 legacy
// unvalidated contactId value (schema.prisma's own Reservation.contactId
// comment) and must not be flagged as broken by this check.
const CAP_D05_01_CUTOVER = new Date("2026-08-19T11:20:06.000Z");

async function check(
  name: string,
  run: () => Promise<{ pass: boolean; detail: string }>
): Promise<IntegrityCheckResult> {
  try {
    const { pass, detail } = await run();
    return { name, status: pass ? "PASS" : "FAIL", detail };
  } catch (err) {
    return { name, status: "FAIL", detail: `threw: ${err instanceof Error ? err.message : String(err)}` };
  }
}

export async function verifyIntegrity(targetUrl: string): Promise<IntegrityReport> {
  const prisma = new PrismaClient({ datasourceUrl: targetUrl });
  const checks: IntegrityCheckResult[] = [];

  try {
    // --- Identity ---
    checks.push(
      await check("staff-user-owner-invariant", async () => {
        const total = await prisma.staffUser.count();
        if (total === 0) return { pass: true, detail: "no StaffUser rows present — nothing to violate the invariant" };
        const owners = await prisma.staffUser.count({ where: { role: "Owner" } });
        return { pass: owners === 1, detail: `${owners} StaffUser row(s) with role='Owner' out of ${total} total (expected exactly 1)` };
      })
    );

    // --- Reservations ---
    checks.push(
      await check("reservations-readable", async () => {
        const count = await prisma.reservation.count();
        return { pass: true, detail: `${count} Reservation row(s) readable` };
      })
    );
    checks.push(
      await check("reservation-events-referential-integrity", async () => {
        const orphans = await prisma.$queryRawUnsafe<{ count: bigint }[]>(
          `SELECT COUNT(*)::bigint AS count FROM "reservation_events" e
           LEFT JOIN "reservations" r ON r."id" = e."reservationId"
           WHERE r."id" IS NULL`
        );
        const orphanCount = Number(orphans[0]?.count ?? 0);
        return { pass: orphanCount === 0, detail: `${orphanCount} orphaned ReservationEvent row(s) (expected 0)` };
      })
    );
    checks.push(
      await check("reservation-events-count-plausible", async () => {
        // A restore that technically "succeeds" (pg_restore exit code 0)
        // but silently drops an entire child table (found during this
        // capability's own recovery drill — a foreign-key ordering bug
        // in an earlier version of ops/restore/restoreBackup.ts left
        // reservation_events completely empty while reservations
        // restored fine) would pass a naive orphan-only check, since an
        // empty table trivially has zero orphans. Every Reservation
        // should have produced at least one ReservationEvent under
        // normal application behavior (CAP-D01.01-R04) — a nonzero
        // Reservation count alongside a zero ReservationEvent count is
        // itself evidence of a broken restore, not a coincidence.
        const reservationCount = await prisma.reservation.count();
        const eventCount = await prisma.reservationEvent.count();
        const pass = reservationCount === 0 || eventCount > 0;
        return { pass, detail: `${eventCount} ReservationEvent row(s) for ${reservationCount} Reservation row(s)` };
      })
    );
    checks.push(
      await check("reservation-created-by-audit-preserved", async () => {
        const missing = await prisma.reservation.count({ where: { createdBy: "" } });
        return { pass: missing === 0, detail: `${missing} Reservation row(s) with an empty createdBy (expected 0)` };
      })
    );

    // --- Contacts (CAP-D05.01) ---
    checks.push(
      await check("post-cap-d05-01-reservations-resolve-valid-contact", async () => {
        const orphans = await prisma.$queryRawUnsafe<{ count: bigint }[]>(
          `SELECT COUNT(*)::bigint AS count FROM "reservations" r
           LEFT JOIN "contacts" c ON c."id" = r."contactId"
           WHERE r."createdAt" >= $1 AND c."id" IS NULL`,
          CAP_D05_01_CUTOVER
        );
        const orphanCount = Number(orphans[0]?.count ?? 0);
        return {
          pass: orphanCount === 0,
          detail: `${orphanCount} post-CAP-D05.01 Reservation row(s) with a contactId not resolving to a real Contact (expected 0; pre-CAP-D05.01 legacy rows are excluded from this check)`,
        };
      })
    );
    checks.push(
      await check("reservation-contact-snapshot-presence", async () => {
        const missing = await prisma.$queryRawUnsafe<{ count: bigint }[]>(
          `SELECT COUNT(*)::bigint AS count FROM "reservations"
           WHERE "createdAt" >= $1
             AND "contactName" IS NULL AND "contactPhoneSnapshot" IS NULL AND "contactEmailSnapshot" IS NULL`,
          CAP_D05_01_CUTOVER
        );
        const missingCount = Number(missing[0]?.count ?? 0);
        return { pass: missingCount === 0, detail: `${missingCount} post-CAP-D05.01 Reservation row(s) with no contact snapshot at all (expected 0)` };
      })
    );

    // --- Capacity ---
    checks.push(
      await check("capacity-commitments-readable", async () => {
        const count = await prisma.capacityCommitment.count();
        return { pass: true, detail: `${count} CapacityCommitment row(s) readable` };
      })
    );
    checks.push(
      await check("one-committed-commitment-per-reservation", async () => {
        const violations = await prisma.$queryRawUnsafe<{ reservation_id: string; count: bigint }[]>(
          `SELECT "reservation_id", COUNT(*)::bigint AS count FROM "capacity_commitments"
           WHERE "status" = 'Committed' AND "reservation_id" IS NOT NULL
           GROUP BY "reservation_id" HAVING COUNT(*) > 1`
        );
        return { pass: violations.length === 0, detail: `${violations.length} reservation(s) with more than one Committed commitment (expected 0)` };
      })
    );
    checks.push(
      await check("capacity-reservation-relationship-credible", async () => {
        const orphans = await prisma.$queryRawUnsafe<{ count: bigint }[]>(
          `SELECT COUNT(*)::bigint AS count FROM "capacity_commitments" cc
           LEFT JOIN "reservations" r ON r."id" = cc."reservation_id"
           WHERE cc."reservation_id" IS NOT NULL AND r."id" IS NULL`
        );
        const orphanCount = Number(orphans[0]?.count ?? 0);
        return { pass: orphanCount === 0, detail: `${orphanCount} CapacityCommitment row(s) referencing a non-existent Reservation (expected 0)` };
      })
    );

    // --- Idempotency ---
    checks.push(
      await check("applied-command-state-preserved", async () => {
        const count = await prisma.appliedCommand.count();
        return { pass: true, detail: `${count} AppliedCommand row(s) readable` };
      })
    );

    // --- Schema ---
    checks.push(
      await check("schema-migration-state", async () => {
        const applied = await prisma.$queryRawUnsafe<{ migration_name: string }[]>(
          `SELECT migration_name FROM "_prisma_migrations" WHERE finished_at IS NOT NULL`
        );
        const appliedSet = new Set(applied.map((r) => r.migration_name));
        const migrationsDir = join(process.cwd(), "prisma", "migrations");
        const expected = readdirSync(migrationsDir, { withFileTypes: true })
          .filter((d) => d.isDirectory())
          .map((d) => d.name);
        const missing = expected.filter((m) => !appliedSet.has(m));
        return {
          pass: missing.length === 0,
          detail: missing.length === 0
            ? `all ${expected.length} repository migrations applied`
            : `missing migration(s): ${missing.join(", ")}`,
        };
      })
    );

    // --- Freshness (RPO/RTO evidence, §16/§17 — always PASS if inspectable; the value itself is the evidence) ---
    checks.push(
      await check("freshness-latest-reservation-timestamp", async () => {
        const latest = await prisma.reservation.findFirst({ orderBy: { createdAt: "desc" }, select: { createdAt: true } });
        return { pass: true, detail: latest ? `latest Reservation.createdAt = ${latest.createdAt.toISOString()}` : "no Reservation rows present" };
      })
    );
    checks.push(
      await check("freshness-latest-event-timestamp", async () => {
        const latest = await prisma.reservationEvent.findFirst({ orderBy: { occurredAt: "desc" }, select: { occurredAt: true } });
        return { pass: true, detail: latest ? `latest ReservationEvent.occurredAt = ${latest.occurredAt.toISOString()}` : "no ReservationEvent rows present" };
      })
    );

    const overall: "PASS" | "FAIL" = checks.every((c) => c.status === "PASS") ? "PASS" : "FAIL";
    return { overall, generatedAt: new Date().toISOString(), checks };
  } finally {
    await prisma.$disconnect();
  }
}

async function main(): Promise<void> {
  const targetUrl = process.env["RESTORE_TARGET_DATABASE_URL"];
  if (!targetUrl) {
    console.error("verifyIntegrity: RESTORE_TARGET_DATABASE_URL is not set.");
    process.exitCode = 1;
    return;
  }
  const report = await verifyIntegrity(targetUrl);
  for (const c of report.checks) {
    console.log(`  [${c.status}] ${c.name} — ${c.detail}`);
  }
  console.log(`verifyIntegrity: OVERALL ${report.overall}`);
  if (report.overall === "FAIL") process.exitCode = 1;
}

const isDirectRun = process.argv[1]?.endsWith("verifyIntegrity.ts") || process.argv[1]?.endsWith("verifyIntegrity.js");
if (isDirectRun) {
  main().catch((err) => {
    console.error("verifyIntegrity: unexpected failure —", err);
    process.exitCode = 1;
  });
}
