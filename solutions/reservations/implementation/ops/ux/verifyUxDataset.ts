/**
 * R1.5-P7-D — read-only verification of the seeded UX dataset
 * (`npm run ux:verify`, loads .env.ux). Compares the database, row by row,
 * with ops/ux/uxSaturdayPlan.ts (status, area, party size, final seating
 * state and resources, active/resolved critical notes, arrivals) and checks
 * seating/capacity integrity (no overlapping ACTIVE resource claims; committed
 * covers within each pool's maximum at every 15 minutes). Prints a JSON
 * report; exits non-zero on any mismatch. Refuses any database other than
 * helix_reservations_ux. Never writes.
 */
import { PrismaClient } from "@prisma/client";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { CAPACITY_POOLS } from "../../domain/availability/CapacityPool.js";
import { assertProvisionedUxDatabase, assertUxDatabaseUrl, createPrismaUxIdentityReader } from "./uxSafety.js";
import { amsterdamLocalToUtc, guestName, UX_SATURDAY_PLAN, UX_TARGET_LOCAL_TIME } from "./uxSaturdayPlan.js";

export interface UxVerificationReport {
  readonly datasetDate: string | null;
  readonly problems: readonly string[];
  readonly counts: Record<string, number>;
  readonly distribution: Record<string, Record<string, number>>;
  readonly teppanyakiAt1945: Record<string, string>;
  readonly serviceSessions: readonly { serviceCode: string; serviceDate: string; status: string }[];
}

const tally = (items: readonly string[]): Record<string, number> => items.reduce<Record<string, number>>((a, k) => ((a[k] = (a[k] ?? 0) + 1), a), {});

export async function verifyUxDataset(databaseUrl: string): Promise<UxVerificationReport> {
  assertUxDatabaseUrl(databaseUrl);
  const prisma = new PrismaClient({ datasourceUrl: databaseUrl });
  try {
    const sentinel = await assertProvisionedUxDatabase(createPrismaUxIdentityReader(prisma));
    const problems: string[] = [];
    if (!sentinel.seededAt) problems.push("sentinel: dataset not marked as seeded");

    const reservations = await prisma.reservation.findMany({ include: { criticalNotes: true } });
    const assignments = await prisma.seatingAssignment.findMany({ include: { resources: true } });
    const byName = new Map(reservations.map((r) => [r.contactName, r]));
    const tables = new Map((await prisma.table.findMany()).map((t) => [t.id, t]));
    const seats = new Map((await prisma.seat.findMany()).map((s) => [s.id, s]));
    const resourceIdOf = (x: { tableId: string | null; seatId: string | null }) => x.tableId ?? x.seatId ?? "?";

    for (const plan of UX_SATURDAY_PLAN) {
      const r = byName.get(guestName(plan));
      if (!r) {
        problems.push(`${plan.ref}: missing`);
        continue;
      }
      if (r.status !== plan.status) problems.push(`${plan.ref}: status ${r.status} ≠ ${plan.status}`);
      if (r.preferredArea !== plan.area) problems.push(`${plan.ref}: area ${r.preferredArea} ≠ ${plan.area}`);
      if (r.partySize !== plan.partySize) problems.push(`${plan.ref}: party ${r.partySize} ≠ ${plan.partySize}`);
      if (r.contactPhoneSnapshot !== plan.phone) problems.push(`${plan.ref}: phone snapshot mismatch`);
      if (Boolean(r.arrivedAt) !== Boolean(plan.arrived)) problems.push(`${plan.ref}: arrived ${Boolean(r.arrivedAt)} ≠ ${Boolean(plan.arrived)}`);

      const mine = assignments.filter((a) => a.reservationId === r.id);
      const active = mine.filter((a) => a.status === "Assigned" || a.status === "Seated");
      const expectActive = plan.seating && plan.seating.mode !== "noShow" ? plan.seating : undefined;
      if (active.length > 1) problems.push(`${plan.ref}: ${active.length} active assignments`);
      if (!expectActive && active.length > 0) problems.push(`${plan.ref}: unexpected active assignment`);
      if (expectActive) {
        const a = active[0];
        const expectedStatus = expectActive.mode === "seat" ? "Seated" : "Assigned";
        if (!a) problems.push(`${plan.ref}: no active assignment`);
        else {
          if (a.status !== expectedStatus) problems.push(`${plan.ref}: seating ${a.status} ≠ ${expectedStatus}`);
          const got = a.resources.map(resourceIdOf).sort().join(",");
          if (got !== [...expectActive.resources].sort().join(",")) problems.push(`${plan.ref}: resources ${got} ≠ plan`);
        }
      }
      const released = mine.filter((a) => a.status === "Released");
      if (plan.seating?.mode === "noShow" && !released.some((a) => a.releaseReason === "NoShow")) problems.push(`${plan.ref}: no NoShow release`);
      if (plan.seating?.moveFrom && !released.some((a) => a.releaseReason === "StaffReassigned")) problems.push(`${plan.ref}: no StaffReassigned (move) history`);

      const activeNotes = r.criticalNotes.filter((n) => n.status === "Active").map((n) => `${n.noteType}:${n.detail}`).sort();
      const resolvedNotes = r.criticalNotes.filter((n) => n.status === "Resolved").map((n) => `${n.noteType}:${n.detail}`).sort();
      const planActive = (plan.critical ?? []).filter((n) => !n.resolved).map((n) => `${n.type}:${n.detail}`).sort();
      const planResolved = (plan.critical ?? []).filter((n) => n.resolved).map((n) => `${n.type}:${n.detail}`).sort();
      if (activeNotes.join("|") !== planActive.join("|")) problems.push(`${plan.ref}: active critical notes mismatch`);
      if (resolvedNotes.join("|") !== planResolved.join("|")) problems.push(`${plan.ref}: resolved critical notes mismatch`);
    }
    const planNames = new Set(UX_SATURDAY_PLAN.map(guestName));
    for (const r of reservations) if (!planNames.has(r.contactName ?? "")) problems.push(`unexpected reservation ${r.contactName}`);

    // Integrity — no two ACTIVE claims on one resource overlap in time.
    const claims = assignments.filter((a) => a.status !== "Released").flatMap((a) => a.resources.map((x) => ({ id: resourceIdOf(x), start: x.startTime.getTime(), end: x.endTime.getTime(), a: a.id })));
    for (let i = 0; i < claims.length; i++)
      for (let j = i + 1; j < claims.length; j++) {
        const p = claims[i]!;
        const q = claims[j]!;
        if (p.id === q.id && p.a !== q.a && p.start < q.end && q.start < p.end) problems.push(`overlapping active claims on ${p.id}`);
      }
    // Integrity — committed covers within pool capacity at every 15 minutes.
    const commitments = (await prisma.capacityCommitment.findMany({ where: { status: "Committed" } })).filter((c): c is typeof c & { reservationId: string } => c.reservationId !== null);
    const resById = new Map(reservations.map((r) => [r.id, r]));
    for (const pool of ["Sushi", "Teppanyaki"] as const) {
      const mineC = commitments.filter((c) => c.capacityPoolId === pool);
      const starts = mineC.map((c) => resById.get(c.reservationId)!.reservationDate.getTime());
      for (const t of new Set(starts)) {
        const covers = mineC
          .filter((c) => {
            const s = resById.get(c.reservationId)!.reservationDate.getTime();
            return s <= t && t < s + CAPACITY_POOLS[pool].durationMinutes * 60_000;
          })
          .reduce((sum, c) => sum + resById.get(c.reservationId)!.partySize, 0);
        if (covers > CAPACITY_POOLS[pool].maximumCapacity) problems.push(`${pool}: ${covers} committed covers exceed ${CAPACITY_POOLS[pool].maximumCapacity}`);
      }
    }

    // Teppanyaki grill occupancy at 19:45 local (active claims covering that instant).
    const at1945 = sentinel.datasetDate ? amsterdamLocalToUtc(sentinel.datasetDate, UX_TARGET_LOCAL_TIME).getTime() : undefined;
    const teppanyakiAt1945: Record<string, string> = {};
    for (const grill of ["teppanyaki-c", "teppanyaki-d", "teppanyaki-e", "teppanyaki-f"]) {
      const busy = at1945 === undefined ? 0 : claims.filter((c) => seats.get(c.id)?.tableId === grill && c.start <= at1945 && at1945 < c.end).length;
      teppanyakiAt1945[tables.get(grill)?.operationalLabel ?? grill] = `${busy}/10`;
    }

    const localTime = (d: Date) => new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Amsterdam", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(d);
    const band = (d: Date) => {
      const t = localTime(d);
      return t < "18:00" ? "17:00–17:45" : t < "19:00" ? "18:00–18:45" : t < "20:00" ? "19:00–19:45 (peak)" : t < "20:45" ? "20:00–20:30" : "20:45–21:00";
    };
    const activeStatusByRes = new Map(assignments.filter((a) => a.status !== "Released").map((a) => [a.reservationId, a.status]));
    const notes = reservations.flatMap((r) => r.criticalNotes);
    const sessions = await prisma.serviceSession.findMany({ select: { serviceCode: true, serviceDate: true, status: true } });
    const count = async (t: string) => (await prisma.$queryRawUnsafe<{ n: number }[]>(`SELECT count(*)::int AS n FROM "${t}"`))[0]?.n ?? 0;

    return {
      datasetDate: sentinel.datasetDate,
      problems,
      counts: {
        reservations: reservations.length,
        contacts: await count("contacts"),
        criticalNotes: notes.length,
        activeAllergy: notes.filter((n) => n.noteType === "Allergy" && n.status === "Active").length,
        activeCritical: notes.filter((n) => n.noteType === "Critical" && n.status === "Active").length,
        resolvedNotes: notes.filter((n) => n.status === "Resolved").length,
        seatingAssignments: assignments.length,
        seatingAssignmentResources: assignments.reduce((s, a) => s + a.resources.length, 0),
        capacityCommitments: await count("capacity_commitments"),
        committedCommitments: commitments.length,
        guestManagementCredentials: await count("guest_management_credentials"),
        staffUsers: await count("staff_users"),
        serviceSessions: sessions.length,
        tables: tables.size,
        seats: seats.size,
        covers: reservations.filter((r) => r.status !== "Cancelled").reduce((s, r) => s + r.partySize, 0),
      },
      distribution: {
        status: tally(reservations.map((r) => r.status)),
        area: tally(reservations.map((r) => r.preferredArea ?? "none")),
        seating: tally(reservations.map((r) => activeStatusByRes.get(r.id) ?? "Unassigned")),
        releasedAssignments: tally(assignments.filter((a) => a.status === "Released").map((a) => a.releaseReason ?? "?")),
        timeBand: tally(reservations.map((r) => band(r.reservationDate))),
        source: tally(reservations.map((r) => (r.sourceCategory === "Walk-in" ? "Walk-in" : "Advance reservation"))),
        arrived: tally(reservations.map((r) => (r.arrivedAt ? "arrived" : "not arrived"))),
      },
      teppanyakiAt1945,
      serviceSessions: sessions.map((s) => ({ serviceCode: s.serviceCode, serviceDate: s.serviceDate.toISOString().slice(0, 10), status: s.status })),
    };
  } finally {
    await prisma.$disconnect();
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  verifyUxDataset(process.env["DATABASE_URL"] ?? "")
    .then((report) => {
      console.log(JSON.stringify(report, null, 1));
      if (report.problems.length > 0) process.exitCode = 1;
    })
    .catch((err) => {
      console.error(err instanceof Error ? err.message : err);
      process.exitCode = 1;
    });
}
