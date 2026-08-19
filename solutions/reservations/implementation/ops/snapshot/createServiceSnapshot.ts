/**
 * R1.4 §19 — smallest safe operational service-snapshot mechanism.
 * Produces a read-only, offline-viewable file staff can consult if the
 * reservation system itself is unavailable (§16 Operational Outage
 * Mode). This is deliberately NOT a database backup (§19: "keep these
 * concepts separate") — it carries only what a staff member needs to
 * run service without the app, in a bounded near-term window, and
 * nothing else:
 *
 * INCLUDED: reservation date/time, party size, guest name/phone/email
 * (operationally necessary — staff must be able to call a guest during
 * an outage, per the runbook's own manual-fallback field list), area
 * preference, operational notes, table assignment, status.
 *
 * DELIBERATELY EXCLUDED: StaffUser rows (so, structurally, no password
 * hashes), SecurityEvent rows, LoginAttemptWindow rows, any Contact not
 * referenced by an in-window Reservation (never a dump of the whole
 * Contacts table — "unrelated Contacts"), and any reservation outside
 * the snapshot window ("historical PII").
 *
 * Refresh: run via `npm run service-snapshot`. Always overwrites the
 * same fixed path (snapshots/latest.html / latest.json) so staff have
 * one well-known place to look regardless of when it last ran, and the
 * generation timestamp is embedded prominently in the output so staff
 * can see how stale it might be. Consistent with the owner-confirmed
 * 15-minute RPO posture (BR-R14-01), this should be scheduled to run at
 * least every 15 minutes in production — the actual scheduler is
 * HOSTING-DEPENDENT (no scheduler/cron infrastructure exists yet; see
 * the R1.4 implementation report's "Hosting-Dependent Requirements").
 */
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { PrismaClient } from "@prisma/client";

interface SnapshotRow {
  readonly reservationId: string;
  readonly reservationDate: string;
  readonly partySize: number;
  readonly guestName: string | null;
  readonly guestPhone: string | null;
  readonly guestEmail: string | null;
  readonly preferredArea: string | null;
  readonly notes: string | null;
  readonly tableAssignment: string | null;
  readonly status: string;
}

function resolveSourceUrl(): string {
  const url = process.env["SNAPSHOT_SOURCE_DATABASE_URL"] ?? process.env["DATABASE_URL"];
  if (!url) throw new Error("createServiceSnapshot: neither SNAPSHOT_SOURCE_DATABASE_URL nor DATABASE_URL is set.");
  return url;
}

function resolveOutputDir(): string {
  const dir = process.env["SNAPSHOT_OUTPUT_DIR"] ?? join(process.cwd(), "snapshots");
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  return dir;
}

export async function buildServiceSnapshot(sourceUrl: string, windowHours: number): Promise<SnapshotRow[]> {
  const prisma = new PrismaClient({ datasourceUrl: sourceUrl });
  try {
    const now = new Date();
    const windowEnd = new Date(now.getTime() + windowHours * 60 * 60 * 1000);
    const reservations = await prisma.reservation.findMany({
      where: {
        reservationDate: { gte: now, lte: windowEnd },
        status: { in: ["Proposed", "Confirmed"] }, // only reservations still operationally relevant
      },
      orderBy: { reservationDate: "asc" },
    });

    // Resolve each reservation's Contact ONLY for the reservations
    // actually in the snapshot — never the whole Contacts table.
    const contactIds = [...new Set(reservations.map((r) => r.contactId))];
    const contacts = await prisma.contact.findMany({ where: { id: { in: contactIds } } });
    const contactById = new Map(contacts.map((c) => [c.id, c]));

    return reservations.map((r) => {
      const contact = contactById.get(r.contactId);
      return {
        reservationId: r.id,
        reservationDate: r.reservationDate.toISOString(),
        partySize: r.partySize,
        guestName: r.contactName ?? contact?.displayName ?? null,
        guestPhone: r.contactPhoneSnapshot ?? contact?.phoneNormalized ?? contact?.phoneRaw ?? null,
        guestEmail: r.contactEmailSnapshot ?? contact?.emailNormalized ?? contact?.emailRaw ?? null,
        preferredArea: r.preferredArea,
        notes: r.notes,
        tableAssignment: r.tableAssignment,
        status: r.status,
      };
    });
  } finally {
    await prisma.$disconnect();
  }
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] ?? c));
}

function renderHtml(rows: SnapshotRow[], generatedAt: Date, windowHours: number): string {
  const rowsHtml = rows
    .map(
      (r) => `<tr>
        <td>${escapeHtml(new Date(r.reservationDate).toISOString().replace("T", " ").slice(0, 16))}</td>
        <td>${r.partySize}</td>
        <td>${escapeHtml(r.guestName ?? "—")}</td>
        <td>${escapeHtml(r.guestPhone ?? "—")}</td>
        <td>${escapeHtml(r.guestEmail ?? "—")}</td>
        <td>${escapeHtml(r.preferredArea ?? "—")}</td>
        <td>${escapeHtml(r.tableAssignment ?? "—")}</td>
        <td>${escapeHtml(r.notes ?? "")}</td>
        <td>${escapeHtml(r.status)}</td>
      </tr>`
    )
    .join("\n");

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Konnichiwa — Service Snapshot</title>
<style>
  body { font-family: system-ui, sans-serif; margin: 2rem; }
  h1 { margin-bottom: 0.2rem; }
  .meta { color: #555; margin-bottom: 1.5rem; }
  .warning { background: #fff3cd; border: 1px solid #ffe69c; padding: 0.75rem 1rem; margin-bottom: 1.5rem; }
  table { border-collapse: collapse; width: 100%; }
  th, td { border: 1px solid #ccc; padding: 0.4rem 0.6rem; text-align: left; font-size: 0.95rem; }
  th { background: #f2f2f2; }
</style>
</head>
<body>
<h1>Konnichiwa — Service Snapshot (Read-Only)</h1>
<p class="meta">Generated: ${generatedAt.toISOString()} &middot; Window: next ${windowHours} hours &middot; ${rows.length} reservation(s)</p>
<div class="warning">
  Operational contingency artifact only — NOT the live system. Do not treat as authoritative once
  the reservation system is available again. Any change recorded here during an outage must be
  reconciled per the Disaster Recovery Runbook before this snapshot is discarded.
</div>
<table>
<thead><tr><th>Date/Time</th><th>Party</th><th>Guest</th><th>Phone</th><th>Email</th><th>Area</th><th>Table</th><th>Notes</th><th>Status</th></tr></thead>
<tbody>
${rowsHtml || '<tr><td colspan="9">No reservations in this window.</td></tr>'}
</tbody>
</table>
</body>
</html>
`;
}

export async function createServiceSnapshot(): Promise<{ htmlPath: string; jsonPath: string; count: number }> {
  const sourceUrl = resolveSourceUrl();
  const windowHours = Number(process.env["SNAPSHOT_WINDOW_HOURS"] ?? "48");
  const outputDir = resolveOutputDir();
  const generatedAt = new Date();

  const rows = await buildServiceSnapshot(sourceUrl, windowHours);

  const htmlPath = join(outputDir, "latest.html");
  const jsonPath = join(outputDir, "latest.json");
  writeFileSync(htmlPath, renderHtml(rows, generatedAt, windowHours));
  writeFileSync(jsonPath, JSON.stringify({ generatedAt: generatedAt.toISOString(), windowHours, count: rows.length, reservations: rows }, null, 2));

  console.log(`createServiceSnapshot: wrote ${rows.length} reservation(s) to ${htmlPath} and ${jsonPath}`);
  return { htmlPath, jsonPath, count: rows.length };
}

const isDirectRun = process.argv[1]?.endsWith("createServiceSnapshot.ts") || process.argv[1]?.endsWith("createServiceSnapshot.js");
if (isDirectRun) {
  createServiceSnapshot().catch((err) => {
    console.error("createServiceSnapshot: failed —", err);
    process.exitCode = 1;
  });
}
