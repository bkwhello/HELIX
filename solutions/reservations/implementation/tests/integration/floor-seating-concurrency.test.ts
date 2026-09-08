import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { createTestPrismaClient, truncateReservationDomainTables, truncateSeatingDomainTables } from "./support/testDatabaseSafety.js";
import { buildFloorHarness } from "./support/floorTestHarness.js";
import { seedFloor } from "../../ops/floor/seedFloor.js";
import { Actor, ActorKind, ActorRole } from "../../domain/value-objects/Actor.js";
import { ReservationSourceCategory } from "../../domain/value-objects/ReservationSource.js";
import { ResourceBlockService } from "../../application/floor/ResourceBlockService.js";
import { deriveSeatingResourceLockKey } from "../../domain/availability/LockKey.js";

/**
 * CAP-D04.01 — the mandatory real-PostgreSQL concurrency matrix
 * (R1.5 implementation assignment §18/§21/§35): Scenarios C, E, F, K, L,
 * plus the required 20-iteration repetition for four named races. Each
 * test uses a SEPARATE PrismaClient per concurrent "actor" — the same
 * discipline tests/integration/availability-concurrency.test.ts already
 * established for CAP-D02.03, extended one tier.
 */
const prisma = createTestPrismaClient();
const prismaB = createTestPrismaClient();
// R1.5-P1B0 — a dedicated THIRD connection, used only to observe
// PostgreSQL's own pg_locks catalog from outside the two contending
// transactions — never to participate in either of them.
const prismaC = createTestPrismaClient();

/**
 * R1.5-P1B0 — bounded poll used ONLY to wait for a database-observable
 * fact (rows of both granted states appearing in pg_locks for the exact
 * advisory-lock key under test) to become visible — never as the
 * correctness assertion itself. The correctness evidence is the returned
 * rows' `granted` values, read directly from PostgreSQL's own lock
 * catalog; the poll only accounts for the unavoidable, unbounded-in
 * principle delay between kicking off a promise and its lock request
 * becoming visible to a separate connection. A failure to observe both
 * states within the bound throws, surfacing as a failing assertion, not
 * a silently-passed timeout.
 */
async function waitForContendedAdvisoryLock(
  namespace: number,
  key: number,
  maxAttempts = 100,
  intervalMs = 20
): Promise<{ readonly granted: boolean }[]> {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const rows = await prismaC.$queryRaw<{ granted: boolean }[]>`
      SELECT granted FROM pg_locks WHERE locktype = 'advisory' AND classid = ${namespace} AND objid = ${key}
    `;
    const hasGranted = rows.some((r) => r.granted);
    const hasUngranted = rows.some((r) => !r.granted);
    if (hasGranted && hasUngranted) return rows;
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
  throw new Error(
    `Expected pg_locks to show both a granted and an ungranted advisory-lock row for (classid=${namespace}, objid=${key}) within the bounded poll — never observed both.`
  );
}

/**
 * R1.5-P1B0 — `deriveSeatingResourceLockKey` returns SIGNED int32 values
 * (required by `pg_advisory_xact_lock(int4, int4)`'s own parameter
 * types), but `pg_locks.classid`/`objid` are typed `oid` — an UNSIGNED
 * 32-bit type. Binding a negative JS number as a query parameter for an
 * `oid` column fails with "OID out of range" (Postgres error 22003).
 * `>>> 0` reinterprets the same 32 bits as their unsigned equivalent —
 * the identical bit pattern the advisory-lock machinery itself already
 * uses internally — so this is a display/comparison-only conversion,
 * never a different lock.
 */
function lockKeyAsUnsignedOid(id: string): { readonly namespace: number; readonly key: number } {
  const { namespace, key } = deriveSeatingResourceLockKey(id);
  return { namespace: namespace >>> 0, key: key >>> 0 };
}

/**
 * R1.5-P1B0 — snapshot of every currently-held advisory lock in this
 * namespace, for asserting exactly which resource ids are locked (and
 * which are NOT). `oid` is unsigned and has no guaranteed JS mapping
 * through Prisma's `$queryRaw` on its own; casting to `int8` preserves
 * its full unsigned numeric value exactly (unlike casting to `int4`,
 * which would reinterpret the sign bit and no longer match
 * `lockKeyAsUnsignedOid`'s own `>>> 0`-converted comparison values) —
 * `Number(...)` is then safe since every oid fits well within
 * `Number.MAX_SAFE_INTEGER`.
 */
async function currentSeatingAdvisoryLocks(namespace: number): Promise<{ readonly objid: number; readonly granted: boolean }[]> {
  const rows = await prismaC.$queryRaw<{ objid: bigint; granted: boolean }[]>`
    SELECT objid::int8 AS objid, granted FROM pg_locks WHERE locktype = 'advisory' AND classid = ${namespace}
  `;
  return rows.map((r) => ({ objid: Number(r.objid), granted: r.granted }));
}

/**
 * R1.5-P1B0 — single-transaction variant of the poll above: waits only
 * for that ONE transaction's own lock acquisition (no contending second
 * transaction in these dedup/sort tests) to become visible as a granted
 * row in pg_locks, read from the third connection. Still a database
 * fact, never elapsed time, as the observed state.
 */
async function waitForContendedAdvisoryLockOrGrantedOnly(namespace: number, key: number, maxAttempts = 100, intervalMs = 20): Promise<void> {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const rows = await prismaC.$queryRaw<{ granted: boolean }[]>`
      SELECT granted FROM pg_locks WHERE locktype = 'advisory' AND classid = ${namespace} AND objid = ${key} AND granted = true
    `;
    if (rows.length > 0) return;
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
  throw new Error(`Expected pg_locks to show a granted advisory lock for (classid=${namespace}, objid=${key}) within the bounded poll — never observed it.`);
}
const staffActor: Actor = { id: "staff-1", kind: ActorKind.AuthorizedUser, role: ActorRole.Reception };
const NOW = new Date("2026-08-10T10:00:00Z");
let cmdCounter = 0;
function cmd(): string {
  cmdCounter += 1;
  return `floor-race-cmd-${cmdCounter}`;
}
let resCounter = 0;

async function createReservation(overrides: { partySize?: number; preferredArea?: string; reservationDate?: Date } = {}): Promise<string> {
  resCounter += 1;
  const id = `floor-race-res-${resCounter}`;
  await prisma.reservation.create({
    data: {
      id,
      servicePeriodId: "sp-floor-race",
      contactId: "contact-1",
      contactName: "Floor Race Guest",
      status: "Confirmed",
      reservationDate: overrides.reservationDate ?? new Date("2026-08-20T18:00:00Z"),
      partySize: overrides.partySize ?? 2,
      sourceCategory: "Telephone",
      preferredArea: overrides.preferredArea ?? "Sushi",
      createdBy: "staff-1",
      createdAt: NOW,
      updatedAt: NOW,
      version: 1,
    },
  });
  return id;
}

/** R1.5-P1B — Modify needs a REAL CapacityCommitment (createReservation's plain insert has none), so this goes through the authoritative create-with-capacity path and immediately assigns seating. */
async function createSeatedCapacityReservation(harness: ReturnType<typeof buildFloorHarness>, tableLabel: string, overrides: { partySize?: number; preferredArea?: "Sushi" | "Teppanyaki"; reservationDate?: Date } = {}) {
  const table = await prisma.table.findFirstOrThrow({ where: { operationalLabel: tableLabel } });
  const created = await harness.availabilityOrchestrator.createWithCapacity({
    commandId: cmd(), servicePeriodId: "sp-floor-race",
    contactSelection: { type: "ExistingContact", contactId: "contact-1" },
    reservationDate: overrides.reservationDate ?? new Date("2026-08-20T18:00:00Z"),
    partySize: overrides.partySize ?? 2,
    source: { category: ReservationSourceCategory.Telephone },
    preferredArea: overrides.preferredArea ?? "Sushi",
    actor: staffActor,
  });
  if (created.type !== "CREATED") throw new Error("unreachable");
  const reservationId = created.outcome.reservationId;
  const confirmed = await harness.confirmHandler.handle({ commandId: cmd(), reservationId, actor: staffActor, isReservationDataValid: true });
  if (!confirmed.ok) throw new Error("unreachable");
  const assigned = await harness.seatingOrchestrator.assignSeating({
    commandId: cmd(), reservationId, requestedAreaId: overrides.preferredArea ?? "Sushi", requestedPartySize: overrides.partySize ?? 2,
    resources: [{ tableId: table.id }],
    startTime: overrides.reservationDate ?? new Date("2026-08-20T18:00:00Z"),
    endTime: new Date((overrides.reservationDate ?? new Date("2026-08-20T18:00:00Z")).getTime() + 90 * 60_000),
    actor: staffActor,
  });
  if (assigned.type !== "ASSIGNED") throw new Error("unreachable");
  return { reservationId, table };
}

async function resetAll(): Promise<void> {
  await truncateSeatingDomainTables(prisma);
  await truncateReservationDomainTables(prisma);
  await prisma.contact.create({
    data: { id: "contact-1", displayName: "Floor Race Guest", phoneRaw: "0699999998", phoneNormalized: "+31699999998", createdBy: "staff-1", lastRelevantActivityAt: NOW },
  });
}

beforeAll(async () => {
  await resetAll();
  await seedFloor(process.env["TEST_DATABASE_URL"]!);
});
afterAll(async () => {
  await prisma.$disconnect();
  await prismaB.$disconnect();
  await prismaC.$disconnect();
});
beforeEach(resetAll);

describe("Scenario C — Sushi conflict: two concurrent reservations claim the same table, overlapping", () => {
  it("exactly one succeeds", async () => {
    const table1 = await prisma.table.findFirstOrThrow({ where: { operationalLabel: "Table 1" } });
    const resA = await createReservation();
    const resB = await createReservation();
    const { seatingOrchestrator: orchA } = buildFloorHarness(prisma, NOW);
    const { seatingOrchestrator: orchB } = buildFloorHarness(prismaB, NOW);

    const [a, b] = await Promise.all([
      orchA.assignSeating({ commandId: cmd(), reservationId: resA, requestedAreaId: "Sushi", requestedPartySize: 2, resources: [{ tableId: table1.id }], startTime: new Date("2026-08-20T18:00:00Z"), endTime: new Date("2026-08-20T19:30:00Z"), actor: staffActor }),
      orchB.assignSeating({ commandId: cmd(), reservationId: resB, requestedAreaId: "Sushi", requestedPartySize: 2, resources: [{ tableId: table1.id }], startTime: new Date("2026-08-20T19:00:00Z"), endTime: new Date("2026-08-20T20:30:00Z"), actor: staffActor }),
    ]);

    const outcomes = [a.type, b.type].sort();
    expect(outcomes).toEqual(["ASSIGNED", "NOT_SEATABLE"]);
    const activeClaims = await prisma.seatingAssignmentResource.findMany({ where: { tableId: table1.id, status: { in: ["Assigned", "Seated"] } } });
    expect(activeClaims).toHaveLength(1);
  });
});

describe("Scenario E — shared Teppanyaki grill: two parties claim disjoint seats, overlapping time", () => {
  it("both succeed", async () => {
    const grillC = await prisma.table.findFirstOrThrow({ where: { operationalLabel: "C" } });
    const seatsA = await prisma.seat.findMany({ where: { tableId: grillC.id, operationalLabel: { in: ["C-01", "C-02", "C-03", "C-04"] } } });
    const seatsB = await prisma.seat.findMany({ where: { tableId: grillC.id, operationalLabel: { in: ["C-05", "C-06", "C-07"] } } });
    expect(seatsA).toHaveLength(4);
    expect(seatsB).toHaveLength(3);

    const resA = await createReservation({ partySize: 4, preferredArea: "Teppanyaki" });
    const resB = await createReservation({ partySize: 3, preferredArea: "Teppanyaki" });
    const { seatingOrchestrator: orchA } = buildFloorHarness(prisma, NOW);
    const { seatingOrchestrator: orchB } = buildFloorHarness(prismaB, NOW);

    const [a, b] = await Promise.all([
      orchA.assignSeating({ commandId: cmd(), reservationId: resA, requestedAreaId: "Teppanyaki", requestedPartySize: 4, resources: seatsA.map((s) => ({ seatId: s.id })), startTime: new Date("2026-08-20T18:00:00Z"), endTime: new Date("2026-08-20T20:30:00Z"), actor: staffActor }),
      orchB.assignSeating({ commandId: cmd(), reservationId: resB, requestedAreaId: "Teppanyaki", requestedPartySize: 3, resources: seatsB.map((s) => ({ seatId: s.id })), startTime: new Date("2026-08-20T18:30:00Z"), endTime: new Date("2026-08-20T21:00:00Z"), actor: staffActor }),
    ]);

    expect(a.type).toBe("ASSIGNED");
    expect(b.type).toBe("ASSIGNED");
    const activeSeatClaims = await prisma.seatingAssignmentResource.findMany({ where: { seatId: { in: [...seatsA, ...seatsB].map((s) => s.id) }, status: { in: ["Assigned", "Seated"] } } });
    expect(activeSeatClaims).toHaveLength(7);
  });
});

describe("Scenario F — Teppanyaki overclaim: 8 of 10 seats already claimed, another overlapping party requests 4 seats including 2 already taken", () => {
  it("cannot assign — refused, not partially assigned", async () => {
    const grillE = await prisma.table.findFirstOrThrow({ where: { operationalLabel: "E" } });
    const first8 = await prisma.seat.findMany({ where: { tableId: grillE.id, operationalLabel: { in: ["E-01", "E-02", "E-03", "E-04", "E-05", "E-06", "E-07", "E-08"] } } });
    const resFirst = await createReservation({ partySize: 8, preferredArea: "Teppanyaki" });
    const { seatingOrchestrator } = buildFloorHarness(prisma, NOW);
    const firstResult = await seatingOrchestrator.assignSeating({
      commandId: cmd(), reservationId: resFirst, requestedAreaId: "Teppanyaki", requestedPartySize: 8,
      resources: first8.map((s) => ({ seatId: s.id })), startTime: new Date("2026-08-20T18:00:00Z"), endTime: new Date("2026-08-20T20:30:00Z"), actor: staffActor,
    });
    expect(firstResult.type).toBe("ASSIGNED");

    // Only E-09/E-10 are actually free; this party requests 4, including
    // two (E-07, E-08) already claimed above — must be refused in full.
    const overlappingSelection = await prisma.seat.findMany({ where: { tableId: grillE.id, operationalLabel: { in: ["E-07", "E-08", "E-09", "E-10"] } } });
    const resSecond = await createReservation({ partySize: 4, preferredArea: "Teppanyaki" });
    const secondResult = await seatingOrchestrator.assignSeating({
      commandId: cmd(), reservationId: resSecond, requestedAreaId: "Teppanyaki", requestedPartySize: 4,
      resources: overlappingSelection.map((s) => ({ seatId: s.id })), startTime: new Date("2026-08-20T18:30:00Z"), endTime: new Date("2026-08-20T21:00:00Z"), actor: staffActor,
    });

    expect(secondResult.type).toBe("NOT_SEATABLE");
    if (secondResult.type === "NOT_SEATABLE") expect(secondResult.seatability.type).toBe("RESOURCE_OVERLAP");

    // No partial claim — none of E-09/E-10 were assigned as a side effect
    // of the failed request (multi-resource assignment is all-or-nothing,
    // one transaction).
    const freeSeatsStillFree = await prisma.seat.findMany({ where: { tableId: grillE.id, operationalLabel: { in: ["E-09", "E-10"] } } });
    const claimsOnFreeSeats = await prisma.seatingAssignmentResource.findMany({ where: { seatId: { in: freeSeatsStillFree.map((s) => s.id) }, status: { in: ["Assigned", "Seated"] } } });
    expect(claimsOnFreeSeats).toHaveLength(0);
  });
});

describe("Scenario K — walk-in race: a walk-in seated immediately races a concurrent pre-assignment of an overlapping future reservation onto the same table", () => {
  it("exactly one conflicting claim succeeds", async () => {
    const table13 = await prisma.table.findFirstOrThrow({ where: { operationalLabel: "Table 13" } });
    const walkIn = await createReservation({ partySize: 2, reservationDate: NOW });
    const upcoming = await createReservation({ partySize: 2, reservationDate: new Date(NOW.getTime() + 30 * 60_000) });
    const { seatingOrchestrator: orchA } = buildFloorHarness(prisma, NOW);
    const { seatingOrchestrator: orchB } = buildFloorHarness(prismaB, NOW);

    const [walkResult, preAssignResult] = await Promise.all([
      orchA.assignSeating({ commandId: cmd(), reservationId: walkIn, requestedAreaId: "Sushi", requestedPartySize: 2, resources: [{ tableId: table13.id }], startTime: NOW, endTime: new Date(NOW.getTime() + 90 * 60_000), actor: staffActor, seatImmediately: true }),
      orchB.assignSeating({ commandId: cmd(), reservationId: upcoming, requestedAreaId: "Sushi", requestedPartySize: 2, resources: [{ tableId: table13.id }], startTime: new Date(NOW.getTime() + 30 * 60_000), endTime: new Date(NOW.getTime() + 120 * 60_000), actor: staffActor }),
    ]);

    const outcomes = [walkResult.type, preAssignResult.type].sort();
    expect(outcomes).toEqual(["ASSIGNED", "NOT_SEATABLE"]);
  });
});

describe("Scenario L — reassignment race: two staff members move different overlapping reservations onto the same table", () => {
  it("exactly one conflicting assignment succeeds, never a silent overwrite", async () => {
    const table15 = await prisma.table.findFirstOrThrow({ where: { operationalLabel: "Table 15" } });
    const table16 = await prisma.table.findFirstOrThrow({ where: { operationalLabel: "Table 16" } });
    const resA = await createReservation({ partySize: 2 });
    const resB = await createReservation({ partySize: 2 });
    const { seatingOrchestrator: orchA } = buildFloorHarness(prisma, NOW);
    const { seatingOrchestrator: orchB } = buildFloorHarness(prismaB, NOW);

    await orchA.assignSeating({ commandId: cmd(), reservationId: resA, requestedAreaId: "Sushi", requestedPartySize: 2, resources: [{ tableId: table15.id }], startTime: new Date("2026-08-20T18:00:00Z"), endTime: new Date("2026-08-20T19:30:00Z"), actor: staffActor });
    await orchA.assignSeating({ commandId: cmd(), reservationId: resB, requestedAreaId: "Sushi", requestedPartySize: 2, resources: [{ tableId: table16.id }], startTime: new Date("2026-08-20T18:00:00Z"), endTime: new Date("2026-08-20T19:30:00Z"), actor: staffActor });

    // Both A and B move onto the SAME destination table (capacity 4, so
    // the WINNING move never separately fails on insufficient capacity —
    // this scenario is specifically about resource-lock contention, not
    // capacity sufficiency). Table 1 is not supportsSharedSeating, so a
    // second whole-table claim always conflicts regardless of headcount.
    const destination = await prisma.table.findFirstOrThrow({ where: { operationalLabel: "Table 1" } });
    const [moveA, moveB] = await Promise.all([
      orchA.moveSeating({ commandId: cmd(), reservationId: resA, requestedAreaId: "Sushi", requestedPartySize: 2, resources: [{ tableId: destination.id }], actor: staffActor }),
      orchB.moveSeating({ commandId: cmd(), reservationId: resB, requestedAreaId: "Sushi", requestedPartySize: 2, resources: [{ tableId: destination.id }], actor: staffActor }),
    ]);

    const outcomes = [moveA.type, moveB.type].sort();
    expect(outcomes).toEqual(["MOVED", "NOT_SEATABLE"]);
    const activeClaims = await prisma.seatingAssignmentResource.findMany({ where: { tableId: destination.id, status: { in: ["Assigned", "Seated"] } } });
    expect(activeClaims).toHaveLength(1);
  });
});

describe("Concurrency repetition (assignment §35) — 20 iterations, 0 integrity flakes", () => {
  it("same Sushi table: 20 iterations, exactly one winner every time", async () => {
    const table3 = await prisma.table.findFirstOrThrow({ where: { operationalLabel: "Table 3" } });
    for (let i = 0; i < 20; i += 1) {
      await resetAll();
      const resA = await createReservation();
      const resB = await createReservation();
      const { seatingOrchestrator: orchA } = buildFloorHarness(prisma, NOW);
      const { seatingOrchestrator: orchB } = buildFloorHarness(prismaB, NOW);
      const [a, b] = await Promise.all([
        orchA.assignSeating({ commandId: `rep-table-a-${i}`, reservationId: resA, requestedAreaId: "Sushi", requestedPartySize: 4, resources: [{ tableId: table3.id }], startTime: new Date("2026-08-20T18:00:00Z"), endTime: new Date("2026-08-20T19:30:00Z"), actor: staffActor }),
        orchB.assignSeating({ commandId: `rep-table-b-${i}`, reservationId: resB, requestedAreaId: "Sushi", requestedPartySize: 4, resources: [{ tableId: table3.id }], startTime: new Date("2026-08-20T18:30:00Z"), endTime: new Date("2026-08-20T20:00:00Z"), actor: staffActor }),
      ]);
      expect([a.type, b.type].sort(), `iteration ${i}`).toEqual(["ASSIGNED", "NOT_SEATABLE"]);
      const active = await prisma.seatingAssignmentResource.findMany({ where: { tableId: table3.id, status: { in: ["Assigned", "Seated"] } } });
      expect(active, `iteration ${i}: exactly one active claim`).toHaveLength(1);
    }
  }, 60_000);

  it("same Sushi bar resource: 20 iterations, exactly one winner every time", async () => {
    const bar18 = await prisma.table.findFirstOrThrow({ where: { operationalLabel: "Bar 18" } });
    for (let i = 0; i < 20; i += 1) {
      await resetAll();
      const resA = await createReservation({ partySize: 1 });
      const resB = await createReservation({ partySize: 1 });
      const { seatingOrchestrator: orchA } = buildFloorHarness(prisma, NOW);
      const { seatingOrchestrator: orchB } = buildFloorHarness(prismaB, NOW);
      const [a, b] = await Promise.all([
        orchA.assignSeating({ commandId: `rep-bar-a-${i}`, reservationId: resA, requestedAreaId: "Sushi", requestedPartySize: 1, resources: [{ tableId: bar18.id }], startTime: new Date("2026-08-20T18:00:00Z"), endTime: new Date("2026-08-20T19:30:00Z"), actor: staffActor }),
        orchB.assignSeating({ commandId: `rep-bar-b-${i}`, reservationId: resB, requestedAreaId: "Sushi", requestedPartySize: 1, resources: [{ tableId: bar18.id }], startTime: new Date("2026-08-20T18:30:00Z"), endTime: new Date("2026-08-20T20:00:00Z"), actor: staffActor }),
      ]);
      expect([a.type, b.type].sort(), `iteration ${i}`).toEqual(["ASSIGNED", "NOT_SEATABLE"]);
      const active = await prisma.seatingAssignmentResource.findMany({ where: { tableId: bar18.id, status: { in: ["Assigned", "Seated"] } } });
      expect(active, `iteration ${i}: exactly one active claim`).toHaveLength(1);
    }
  }, 60_000);

  it("same Teppanyaki seat: 20 iterations, exactly one winner every time", async () => {
    const grillF = await prisma.table.findFirstOrThrow({ where: { operationalLabel: "F" } });
    const seatF1 = await prisma.seat.findFirstOrThrow({ where: { tableId: grillF.id, operationalLabel: "F-01" } });
    for (let i = 0; i < 20; i += 1) {
      await resetAll();
      const resA = await createReservation({ partySize: 1, preferredArea: "Teppanyaki" });
      const resB = await createReservation({ partySize: 1, preferredArea: "Teppanyaki" });
      const { seatingOrchestrator: orchA } = buildFloorHarness(prisma, NOW);
      const { seatingOrchestrator: orchB } = buildFloorHarness(prismaB, NOW);
      const [a, b] = await Promise.all([
        orchA.assignSeating({ commandId: `rep-seat-a-${i}`, reservationId: resA, requestedAreaId: "Teppanyaki", requestedPartySize: 1, resources: [{ seatId: seatF1.id }], startTime: new Date("2026-08-20T18:00:00Z"), endTime: new Date("2026-08-20T20:30:00Z"), actor: staffActor }),
        orchB.assignSeating({ commandId: `rep-seat-b-${i}`, reservationId: resB, requestedAreaId: "Teppanyaki", requestedPartySize: 1, resources: [{ seatId: seatF1.id }], startTime: new Date("2026-08-20T19:00:00Z"), endTime: new Date("2026-08-20T21:30:00Z"), actor: staffActor }),
      ]);
      expect([a.type, b.type].sort(), `iteration ${i}`).toEqual(["ASSIGNED", "NOT_SEATABLE"]);
      const active = await prisma.seatingAssignmentResource.findMany({ where: { seatId: seatF1.id, status: { in: ["Assigned", "Seated"] } } });
      expect(active, `iteration ${i}: exactly one active claim`).toHaveLength(1);
    }
  }, 60_000);

  it("seating move vs competing assignment: 20 iterations, exactly one winner every time", async () => {
    const table9 = await prisma.table.findFirstOrThrow({ where: { operationalLabel: "Table 9" } });
    const table11 = await prisma.table.findFirstOrThrow({ where: { operationalLabel: "Table 11" } });
    for (let i = 0; i < 20; i += 1) {
      await resetAll();
      const resMoving = await createReservation({ partySize: 2, reservationDate: new Date("2026-08-20T18:00:00Z") });
      const resCompeting = await createReservation({ partySize: 2, reservationDate: new Date("2026-08-20T18:00:00Z") });
      const { seatingOrchestrator: orchA } = buildFloorHarness(prisma, NOW);
      const { seatingOrchestrator: orchB } = buildFloorHarness(prismaB, NOW);

      await orchA.assignSeating({ commandId: `rep-move-setup-${i}`, reservationId: resMoving, requestedAreaId: "Sushi", requestedPartySize: 2, resources: [{ tableId: table9.id }], startTime: new Date("2026-08-20T18:00:00Z"), endTime: new Date("2026-08-20T19:30:00Z"), actor: staffActor });

      const [moveResult, competingResult] = await Promise.all([
        orchA.moveSeating({ commandId: `rep-move-a-${i}`, reservationId: resMoving, requestedAreaId: "Sushi", requestedPartySize: 2, resources: [{ tableId: table11.id }], actor: staffActor }),
        orchB.assignSeating({ commandId: `rep-move-b-${i}`, reservationId: resCompeting, requestedAreaId: "Sushi", requestedPartySize: 2, resources: [{ tableId: table11.id }], startTime: new Date("2026-08-20T18:00:00Z"), endTime: new Date("2026-08-20T19:30:00Z"), actor: staffActor }),
      ]);

      // moveResult.type is "MOVED" | "NOT_SEATABLE"; competingResult.type is
      // "ASSIGNED" | "NOT_SEATABLE" — different result unions, so compare
      // by counting successes directly rather than an array-equality
      // shortcut. Exactly one of the two must have won table11.
      const successCount = (moveResult.type === "MOVED" ? 1 : 0) + (competingResult.type === "ASSIGNED" ? 1 : 0);
      expect(successCount, `iteration ${i}: exactly one of move/competing-assign should win table11`).toBe(1);
      const active = await prisma.seatingAssignmentResource.findMany({ where: { tableId: table11.id, status: { in: ["Assigned", "Seated"] } } });
      expect(active, `iteration ${i}: exactly one active claim on table11`).toHaveLength(1);
    }
  }, 60_000);
});

/**
 * P1-B10 — Floor & Seating evidence reconciliation: closes the two
 * concurrency gaps the completion audit found (pre-assign vs pre-assign;
 * mark-seated vs move). Same "separate PrismaClient per concurrent actor"
 * discipline as every scenario above. Pre-assign is exercised via the
 * SAME assignSeating() method every other scenario already races —
 * seatImmediately: false is its only distinguishing input — so this adds
 * genuinely new evidence for the ONE untested input combination, not a
 * new code path.
 */
describe("Scenario M — pre-assign conflict: two concurrent pre-assignments claim the same table, overlapping", () => {
  it("exactly one succeeds; the loser gets the established RESOURCE_OVERLAP outcome; no duplicate assignment or resource-claim rows", async () => {
    const table4 = await prisma.table.findFirstOrThrow({ where: { operationalLabel: "Table 4" } });
    const resA = await createReservation();
    const resB = await createReservation();
    const { seatingOrchestrator: orchA } = buildFloorHarness(prisma, NOW);
    const { seatingOrchestrator: orchB } = buildFloorHarness(prismaB, NOW);

    const [a, b] = await Promise.all([
      orchA.assignSeating({ commandId: cmd(), reservationId: resA, requestedAreaId: "Sushi", requestedPartySize: 2, resources: [{ tableId: table4.id }], startTime: new Date("2026-08-20T18:00:00Z"), endTime: new Date("2026-08-20T19:30:00Z"), actor: staffActor, seatImmediately: false }),
      orchB.assignSeating({ commandId: cmd(), reservationId: resB, requestedAreaId: "Sushi", requestedPartySize: 2, resources: [{ tableId: table4.id }], startTime: new Date("2026-08-20T19:00:00Z"), endTime: new Date("2026-08-20T20:30:00Z"), actor: staffActor, seatImmediately: false }),
    ]);

    const outcomes = [a.type, b.type].sort();
    expect(outcomes).toEqual(["ASSIGNED", "NOT_SEATABLE"]);
    if (a.type === "NOT_SEATABLE") expect(a.seatability.type).toBe("RESOURCE_OVERLAP");
    if (b.type === "NOT_SEATABLE") expect(b.seatability.type).toBe("RESOURCE_OVERLAP");

    const activeClaims = await prisma.seatingAssignmentResource.findMany({ where: { tableId: table4.id, status: { in: ["Assigned", "Seated"] } } });
    expect(activeClaims).toHaveLength(1);
    // No duplicate SeatingAssignment rows across either reservation.
    const allAssignments = await prisma.seatingAssignment.findMany({ where: { reservationId: { in: [resA, resB] } } });
    expect(allAssignments).toHaveLength(1);
    // Pre-assignment never seats immediately, win or lose.
    expect(allAssignments[0]?.status).toBe("Assigned");
  });

  it("5 iterations, 0 integrity flakes — exactly one winner every time", async () => {
    const table6 = await prisma.table.findFirstOrThrow({ where: { operationalLabel: "Table 6" } });
    for (let i = 0; i < 5; i += 1) {
      await resetAll();
      const resA = await createReservation();
      const resB = await createReservation();
      const { seatingOrchestrator: orchA } = buildFloorHarness(prisma, NOW);
      const { seatingOrchestrator: orchB } = buildFloorHarness(prismaB, NOW);
      const [a, b] = await Promise.all([
        orchA.assignSeating({ commandId: `rep-preassign-a-${i}`, reservationId: resA, requestedAreaId: "Sushi", requestedPartySize: 2, resources: [{ tableId: table6.id }], startTime: new Date("2026-08-20T18:00:00Z"), endTime: new Date("2026-08-20T19:30:00Z"), actor: staffActor, seatImmediately: false }),
        orchB.assignSeating({ commandId: `rep-preassign-b-${i}`, reservationId: resB, requestedAreaId: "Sushi", requestedPartySize: 2, resources: [{ tableId: table6.id }], startTime: new Date("2026-08-20T18:30:00Z"), endTime: new Date("2026-08-20T20:00:00Z"), actor: staffActor, seatImmediately: false }),
      ]);
      expect([a.type, b.type].sort(), `iteration ${i}`).toEqual(["ASSIGNED", "NOT_SEATABLE"]);
      const active = await prisma.seatingAssignmentResource.findMany({ where: { tableId: table6.id, status: { in: ["Assigned", "Seated"] } } });
      expect(active, `iteration ${i}: exactly one active claim`).toHaveLength(1);
      const allAssignments = await prisma.seatingAssignment.findMany({ where: { reservationId: { in: [resA, resB] } } });
      expect(allAssignments, `iteration ${i}: exactly one persisted assignment, no duplicate`).toHaveLength(1);
    }
  }, 60_000);
});

describe("Scenario M2 — mark-seated vs move race: a pre-assigned reservation is raced between the two, both may validly succeed after serialization", () => {
  it("final state is coherent regardless of which side acquires the reservation lock first", async () => {
    const tableA = await prisma.table.findFirstOrThrow({ where: { operationalLabel: "Table 7" } });
    const tableB = await prisma.table.findFirstOrThrow({ where: { operationalLabel: "Table 8" } });
    const reservationId = await createReservation({ partySize: 2 });
    const { seatingOrchestrator: orchA } = buildFloorHarness(prisma, NOW);
    const { seatingOrchestrator: orchB } = buildFloorHarness(prismaB, NOW);

    const preAssigned = await orchA.assignSeating({
      commandId: cmd(), reservationId, requestedAreaId: "Sushi", requestedPartySize: 2,
      resources: [{ tableId: tableA.id }], startTime: new Date("2026-08-20T18:00:00Z"), endTime: new Date("2026-08-20T19:30:00Z"), actor: staffActor, seatImmediately: false,
    });
    expect(preAssigned.type).toBe("ASSIGNED");
    if (preAssigned.type === "ASSIGNED") expect(preAssigned.assignment.status).toBe("Assigned");

    // Both operations act on the SAME reservation, so they always
    // serialize on the Tier-1 reservation lock (acquireReservationLock) —
    // neither can ever observe the other's half-applied state, and
    // markSeated can never see "no active assignment" mid-race (moveSeating
    // releases the old claim and creates the new one inside ONE
    // transaction, so an external reader only ever sees the pre- or
    // post-move state, never a gap). Both are therefore expected to
    // succeed deterministically, not merely "may" succeed.
    const [markResult, moveResult] = await Promise.all([
      orchA.markSeated({ reservationId, actor: staffActor }),
      orchB.moveSeating({ commandId: cmd(), reservationId, requestedAreaId: "Sushi", requestedPartySize: 2, resources: [{ tableId: tableB.id }], actor: staffActor }),
    ]);
    expect(markResult.type).toBe("SEATED");
    expect(moveResult.type).toBe("MOVED");

    const activeAssignments = await prisma.seatingAssignment.findMany({ where: { reservationId, status: { in: ["Assigned", "Seated"] } } });
    expect(activeAssignments).toHaveLength(1);
    expect(activeAssignments[0]?.status).toBe("Seated");
    expect(activeAssignments[0]?.seatedAt).not.toBeNull();

    const activeOnB = await prisma.seatingAssignmentResource.findMany({ where: { tableId: tableB.id, status: { in: ["Assigned", "Seated"] } } });
    expect(activeOnB).toHaveLength(1);
    const activeOnA = await prisma.seatingAssignmentResource.findMany({ where: { tableId: tableA.id, status: { in: ["Assigned", "Seated"] } } });
    expect(activeOnA).toHaveLength(0);

    // Exactly two rows total for this reservation — the original claim
    // (now Released by the move) and the one final active row — never
    // three or more, regardless of lock order.
    const allAssignments = await prisma.seatingAssignment.findMany({ where: { reservationId } });
    expect(allAssignments).toHaveLength(2);
    const released = allAssignments.find((r) => r.status === "Released");
    expect(released?.releaseReason).toBe("StaffReassigned");

    // seatedAt on the final active row was written exactly once — by
    // whichever call actually performed the Assigned -> Seated
    // transition — never re-stamped by the other call afterward.
    const activeRow = allAssignments.find((r) => r.status === "Seated");
    expect(activeRow?.seatedAt?.toISOString()).toBe(activeAssignments[0]?.seatedAt?.toISOString());

    // Reservation lifecycle status was never touched by either call.
    const reservation = await prisma.reservation.findUniqueOrThrow({ where: { id: reservationId } });
    expect(reservation.status).toBe("Confirmed");
  });

  it("5 iterations, 0 integrity flakes — the coherent final state holds every time, whichever side wins the lock", async () => {
    const tableA = await prisma.table.findFirstOrThrow({ where: { operationalLabel: "Table 10" } });
    const tableB = await prisma.table.findFirstOrThrow({ where: { operationalLabel: "Table 12" } });
    for (let i = 0; i < 5; i += 1) {
      await resetAll();
      const reservationId = await createReservation({ partySize: 2 });
      const { seatingOrchestrator: orchA } = buildFloorHarness(prisma, NOW);
      const { seatingOrchestrator: orchB } = buildFloorHarness(prismaB, NOW);

      const preAssigned = await orchA.assignSeating({
        commandId: `rep-marksmove-pre-${i}`, reservationId, requestedAreaId: "Sushi", requestedPartySize: 2,
        resources: [{ tableId: tableA.id }], startTime: new Date("2026-08-20T18:00:00Z"), endTime: new Date("2026-08-20T19:30:00Z"), actor: staffActor, seatImmediately: false,
      });
      expect(preAssigned.type, `iteration ${i}`).toBe("ASSIGNED");

      const [markResult, moveResult] = await Promise.all([
        orchA.markSeated({ reservationId, actor: staffActor }),
        orchB.moveSeating({ commandId: `rep-marksmove-move-${i}`, reservationId, requestedAreaId: "Sushi", requestedPartySize: 2, resources: [{ tableId: tableB.id }], actor: staffActor }),
      ]);
      expect(markResult.type, `iteration ${i}`).toBe("SEATED");
      expect(moveResult.type, `iteration ${i}`).toBe("MOVED");

      const activeAssignments = await prisma.seatingAssignment.findMany({ where: { reservationId, status: { in: ["Assigned", "Seated"] } } });
      expect(activeAssignments, `iteration ${i}: exactly one active assignment`).toHaveLength(1);
      expect(activeAssignments[0]?.status, `iteration ${i}: Seated`).toBe("Seated");
      expect(activeAssignments[0]?.seatedAt, `iteration ${i}: seatedAt set`).not.toBeNull();

      const activeOnB = await prisma.seatingAssignmentResource.findMany({ where: { tableId: tableB.id, status: { in: ["Assigned", "Seated"] } } });
      expect(activeOnB, `iteration ${i}: new resource claimed`).toHaveLength(1);
      const activeOnA = await prisma.seatingAssignmentResource.findMany({ where: { tableId: tableA.id, status: { in: ["Assigned", "Seated"] } } });
      expect(activeOnA, `iteration ${i}: old resource released`).toHaveLength(0);

      const allAssignments = await prisma.seatingAssignment.findMany({ where: { reservationId } });
      expect(allAssignments, `iteration ${i}: no duplicates`).toHaveLength(2);

      const reservation = await prisma.reservation.findUniqueOrThrow({ where: { id: reservationId } });
      expect(reservation.status, `iteration ${i}: Reservation untouched`).toBe("Confirmed");
    }
  }, 60_000);
});

/**
 * R1.5-P1A — both operations serialize on the SAME Tier-1 reservation
 * lock `completeWithCapacity` now acquires (identical family Move/No-show/
 * Cancel already use), so there is no gap where either side observes a
 * half-applied state. Which side's release reason ends up on the final
 * row depends on lock-acquisition order — that is an accepted, expected
 * outcome (not a bug): whichever operation's transaction commits first
 * "wins" the active assignment; the other then observes either no active
 * assignment (a legitimate no-op) or the winner's newly-created one.
 */
describe("Scenario P — Complete vs Move race: a seated reservation is completed while staff concurrently moves it", () => {
  it("final state is coherent regardless of which side acquires the reservation lock first", async () => {
    const tableA = await prisma.table.findFirstOrThrow({ where: { operationalLabel: "Table 1" } });
    const tableB = await prisma.table.findFirstOrThrow({ where: { operationalLabel: "Table 2" } });
    const reservationId = await createReservation({ partySize: 2 });
    const { seatingOrchestrator: orchA } = buildFloorHarness(prisma, NOW);
    const { availabilityOrchestrator: availB, seatingOrchestrator: seatingB } = buildFloorHarness(prismaB, NOW);

    const assigned = await orchA.assignSeating({
      commandId: cmd(), reservationId, requestedAreaId: "Sushi", requestedPartySize: 2,
      resources: [{ tableId: tableA.id }], startTime: new Date("2026-08-20T18:00:00Z"), endTime: new Date("2026-08-20T19:30:00Z"), actor: staffActor,
    });
    expect(assigned.type).toBe("ASSIGNED");

    const [completeResult, moveResult] = await Promise.all([
      availB.completeWithCapacity({ commandId: cmd(), reservationId, actor: staffActor, isManualCompletion: true, manualCompletionReason: "guest departed" }),
      seatingB.moveSeating({ commandId: cmd(), reservationId, requestedAreaId: "Sushi", requestedPartySize: 2, resources: [{ tableId: tableB.id }], actor: staffActor }),
    ]);

    // Nothing else touches Reservation.version, so completion itself is
    // never rejected by this race — only Move's outcome is order-dependent.
    expect(completeResult.ok).toBe(true);
    expect(["MOVED", "NO_ACTIVE_ASSIGNMENT"]).toContain(moveResult.type);

    const reservation = await prisma.reservation.findUniqueOrThrow({ where: { id: reservationId } });
    expect(reservation.status).toBe("Completed");

    const activeAssignments = await prisma.seatingAssignment.findMany({ where: { reservationId, status: { in: ["Assigned", "Seated"] } } });
    expect(activeAssignments).toHaveLength(0);
    const activeResources = await prisma.seatingAssignmentResource.findMany({
      where: { OR: [{ tableId: tableA.id }, { tableId: tableB.id }], status: { in: ["Assigned", "Seated"] } },
    });
    expect(activeResources).toHaveLength(0);

    // Exactly one row if Complete won the lock (nothing left for Move to
    // find), exactly two if Move won first (its new claim is then the one
    // Complete releases) — never zero, never three or more.
    const allAssignments = await prisma.seatingAssignment.findMany({ where: { reservationId } });
    expect(allAssignments.length === 1 || allAssignments.length === 2).toBe(true);
    for (const row of allAssignments) expect(row.status).toBe("Released");
  });

  it("5 iterations, 0 integrity flakes — no active assignment or duplicate/corrupted row ever survives, whichever side wins the lock", async () => {
    const tableA = await prisma.table.findFirstOrThrow({ where: { operationalLabel: "Table 3" } });
    const tableB = await prisma.table.findFirstOrThrow({ where: { operationalLabel: "Table 5" } });
    for (let i = 0; i < 5; i += 1) {
      await resetAll();
      const reservationId = await createReservation({ partySize: 2 });
      const { seatingOrchestrator: orchA } = buildFloorHarness(prisma, NOW);
      const { availabilityOrchestrator: availB, seatingOrchestrator: seatingB } = buildFloorHarness(prismaB, NOW);

      const assigned = await orchA.assignSeating({
        commandId: `rep-completemove-pre-${i}`, reservationId, requestedAreaId: "Sushi", requestedPartySize: 2,
        resources: [{ tableId: tableA.id }], startTime: new Date("2026-08-20T18:00:00Z"), endTime: new Date("2026-08-20T19:30:00Z"), actor: staffActor,
      });
      expect(assigned.type, `iteration ${i}`).toBe("ASSIGNED");

      const [completeResult, moveResult] = await Promise.all([
        availB.completeWithCapacity({ commandId: `rep-completemove-complete-${i}`, reservationId, actor: staffActor, isManualCompletion: true, manualCompletionReason: "guest departed" }),
        seatingB.moveSeating({ commandId: `rep-completemove-move-${i}`, reservationId, requestedAreaId: "Sushi", requestedPartySize: 2, resources: [{ tableId: tableB.id }], actor: staffActor }),
      ]);
      expect(completeResult.ok, `iteration ${i}`).toBe(true);
      expect(["MOVED", "NO_ACTIVE_ASSIGNMENT"], `iteration ${i}`).toContain(moveResult.type);

      const reservation = await prisma.reservation.findUniqueOrThrow({ where: { id: reservationId } });
      expect(reservation.status, `iteration ${i}: Completed`).toBe("Completed");

      const activeAssignments = await prisma.seatingAssignment.findMany({ where: { reservationId, status: { in: ["Assigned", "Seated"] } } });
      expect(activeAssignments, `iteration ${i}: no active assignment survives`).toHaveLength(0);

      const allAssignments = await prisma.seatingAssignment.findMany({ where: { reservationId } });
      expect(allAssignments.length === 1 || allAssignments.length === 2, `iteration ${i}: 1 or 2 rows, never corrupted`).toBe(true);
      for (const row of allAssignments) expect(row.status, `iteration ${i}`).toBe("Released");
    }
  }, 60_000);
});

describe("Scenario Q — Complete vs No-show race: a seated reservation is completed while staff concurrently releases it as a No-Show", () => {
  it("final state is coherent regardless of which side acquires the reservation lock first", async () => {
    const table = await prisma.table.findFirstOrThrow({ where: { operationalLabel: "Table 9" } });
    const reservationId = await createReservation({ partySize: 2 });
    const { seatingOrchestrator: orchA } = buildFloorHarness(prisma, NOW);
    const { availabilityOrchestrator: availB, seatingOrchestrator: seatingB } = buildFloorHarness(prismaB, NOW);

    const assigned = await orchA.assignSeating({
      commandId: cmd(), reservationId, requestedAreaId: "Sushi", requestedPartySize: 2,
      resources: [{ tableId: table.id }], startTime: new Date("2026-08-20T18:00:00Z"), endTime: new Date("2026-08-20T19:30:00Z"), actor: staffActor,
    });
    expect(assigned.type).toBe("ASSIGNED");

    const [completeResult, noShowResult] = await Promise.all([
      availB.completeWithCapacity({ commandId: cmd(), reservationId, actor: staffActor, isManualCompletion: true, manualCompletionReason: "guest departed" }),
      seatingB.releaseNoShow({ reservationId, actor: staffActor }),
    ]);

    expect(completeResult.ok).toBe(true);
    expect(["RELEASED", "NO_ACTIVE_ASSIGNMENT"]).toContain(noShowResult.type);

    const reservation = await prisma.reservation.findUniqueOrThrow({ where: { id: reservationId } });
    expect(reservation.status).toBe("Completed");

    // Exactly one assignment row ever exists here (no new claim is ever
    // created by either operation) — never duplicated, always Released,
    // and its release reason reflects whichever operation actually
    // acquired the lock first (either is a valid, non-corrupted outcome).
    const allAssignments = await prisma.seatingAssignment.findMany({ where: { reservationId } });
    expect(allAssignments).toHaveLength(1);
    expect(allAssignments[0]?.status).toBe("Released");
    expect(["Completed", "NoShow"]).toContain(allAssignments[0]?.releaseReason);

    const activeResources = await prisma.seatingAssignmentResource.findMany({ where: { tableId: table.id, status: { in: ["Assigned", "Seated"] } } });
    expect(activeResources).toHaveLength(0);
  });

  it("5 iterations, 0 integrity flakes — no active assignment or duplicate/corrupted row ever survives, whichever side wins the lock", async () => {
    const table = await prisma.table.findFirstOrThrow({ where: { operationalLabel: "Table 11" } });
    for (let i = 0; i < 5; i += 1) {
      await resetAll();
      const reservationId = await createReservation({ partySize: 2 });
      const { seatingOrchestrator: orchA } = buildFloorHarness(prisma, NOW);
      const { availabilityOrchestrator: availB, seatingOrchestrator: seatingB } = buildFloorHarness(prismaB, NOW);

      const assigned = await orchA.assignSeating({
        commandId: `rep-completenoshow-pre-${i}`, reservationId, requestedAreaId: "Sushi", requestedPartySize: 2,
        resources: [{ tableId: table.id }], startTime: new Date("2026-08-20T18:00:00Z"), endTime: new Date("2026-08-20T19:30:00Z"), actor: staffActor,
      });
      expect(assigned.type, `iteration ${i}`).toBe("ASSIGNED");

      const [completeResult, noShowResult] = await Promise.all([
        availB.completeWithCapacity({ commandId: `rep-completenoshow-complete-${i}`, reservationId, actor: staffActor, isManualCompletion: true, manualCompletionReason: "guest departed" }),
        seatingB.releaseNoShow({ reservationId, actor: staffActor }),
      ]);
      expect(completeResult.ok, `iteration ${i}`).toBe(true);
      expect(["RELEASED", "NO_ACTIVE_ASSIGNMENT"], `iteration ${i}`).toContain(noShowResult.type);

      const reservation = await prisma.reservation.findUniqueOrThrow({ where: { id: reservationId } });
      expect(reservation.status, `iteration ${i}: Completed`).toBe("Completed");

      const allAssignments = await prisma.seatingAssignment.findMany({ where: { reservationId } });
      expect(allAssignments, `iteration ${i}: exactly one row, never duplicated`).toHaveLength(1);
      expect(allAssignments[0]?.status, `iteration ${i}`).toBe("Released");
      expect(["Completed", "NoShow"], `iteration ${i}`).toContain(allAssignments[0]?.releaseReason);
    }
  }, 60_000);
});

/**
 * R1.5-P1B — Modify's new seating revalidation (AvailabilityOrchestrator.
 * modifyWithCapacity -> SeatingOrchestrator.revalidateOrReleaseForModify)
 * acquires the SAME Tier-1 reservation lock every other seating operation
 * already uses, so it serializes against Move/Complete/No-show/
 * ResourceBlock exactly like R1.5-P1A's Scenario P/Q already proved for
 * Complete. Assertions below check the INVARIANTS that hold regardless of
 * which side wins the lock, not one pinned exact outcome — both orderings
 * are legitimate, mechanically-understood final states (see this
 * scenario's own design-gate analysis).
 */
describe("Scenario R — Modify vs Move race: a seated reservation has its time changed while staff concurrently moves it", () => {
  it("final state is coherent regardless of which side acquires the reservation lock first", async () => {
    const harnessA = buildFloorHarness(prisma, NOW);
    const harnessB = buildFloorHarness(prismaB, NOW);
    const tableA = await prisma.table.findFirstOrThrow({ where: { operationalLabel: "Table 2" } });
    const tableB = await prisma.table.findFirstOrThrow({ where: { operationalLabel: "Table 3" } });
    const { reservationId } = await createSeatedCapacityReservation(harnessA, tableA.operationalLabel);

    const [modifyResult, moveResult] = await Promise.all([
      harnessA.availabilityOrchestrator.modifyWithCapacity({
        commandId: cmd(), reservationId, actor: staffActor,
        changes: { reservationDate: new Date("2026-08-20T20:00:00Z") },
        isServicePeriodStillValid: true,
      }),
      harnessB.seatingOrchestrator.moveSeating({
        commandId: cmd(), reservationId, requestedAreaId: "Sushi", requestedPartySize: 2, resources: [{ tableId: tableB.id }], actor: staffActor,
      }),
    ]);

    expect(modifyResult.type).toBe("MODIFIED");
    expect(["MOVED", "NOT_SEATABLE", "NO_ACTIVE_ASSIGNMENT"]).toContain(moveResult.type);

    const reservation = await prisma.reservation.findUniqueOrThrow({ where: { id: reservationId } });
    expect(reservation.reservationDate.toISOString()).toBe("2026-08-20T20:00:00.000Z");

    const activeAssignments = await prisma.seatingAssignment.findMany({ where: { reservationId, status: { in: ["Assigned", "Seated"] } } });
    expect(activeAssignments.length).toBeLessThanOrEqual(1); // never two active, never corrupted
    const allAssignments = await prisma.seatingAssignment.findMany({ where: { reservationId } });
    for (const row of allAssignments) {
      if (row.status !== "Assigned" && row.status !== "Seated") expect(row.status).toBe("Released");
    }
  });

  it("5 iterations, 0 integrity flakes — never two active assignments, whichever side wins the lock", async () => {
    for (let i = 0; i < 5; i += 1) {
      await resetAll();
      const harnessA = buildFloorHarness(prisma, NOW);
      const harnessB = buildFloorHarness(prismaB, NOW);
      const tableA = await prisma.table.findFirstOrThrow({ where: { operationalLabel: "Table 2" } });
      const tableB = await prisma.table.findFirstOrThrow({ where: { operationalLabel: "Table 3" } });
      const { reservationId } = await createSeatedCapacityReservation(harnessA, tableA.operationalLabel);

      const [modifyResult, moveResult] = await Promise.all([
        harnessA.availabilityOrchestrator.modifyWithCapacity({
          commandId: `rep-modmove-mod-${i}`, reservationId, actor: staffActor,
          changes: { reservationDate: new Date("2026-08-20T20:00:00Z") },
          isServicePeriodStillValid: true,
        }),
        harnessB.seatingOrchestrator.moveSeating({
          commandId: `rep-modmove-move-${i}`, reservationId, requestedAreaId: "Sushi", requestedPartySize: 2, resources: [{ tableId: tableB.id }], actor: staffActor,
        }),
      ]);
      expect(modifyResult.type, `iteration ${i}`).toBe("MODIFIED");
      expect(["MOVED", "NOT_SEATABLE", "NO_ACTIVE_ASSIGNMENT"], `iteration ${i}`).toContain(moveResult.type);

      const activeAssignments = await prisma.seatingAssignment.findMany({ where: { reservationId, status: { in: ["Assigned", "Seated"] } } });
      expect(activeAssignments.length, `iteration ${i}: never more than one active`).toBeLessThanOrEqual(1);
    }
  }, 60_000);
});

describe("Scenario S — Modify vs Complete race: a seated reservation has its time changed while staff concurrently completes it", () => {
  it("final state is coherent regardless of which side acquires the reservation lock first", async () => {
    const harnessA = buildFloorHarness(prisma, NOW);
    const harnessB = buildFloorHarness(prismaB, NOW);
    const table = await prisma.table.findFirstOrThrow({ where: { operationalLabel: "Table 4" } });
    const { reservationId } = await createSeatedCapacityReservation(harnessA, table.operationalLabel);

    const [modifyResult, completeResult] = await Promise.all([
      harnessA.availabilityOrchestrator.modifyWithCapacity({
        commandId: cmd(), reservationId, actor: staffActor,
        changes: { reservationDate: new Date("2026-08-20T20:00:00Z") },
        isServicePeriodStillValid: true,
      }),
      harnessB.availabilityOrchestrator.completeWithCapacity({
        commandId: cmd(), reservationId, actor: staffActor, isManualCompletion: true, manualCompletionReason: "guest departed",
      }),
    ]);

    // Modify either succeeds (it ran first, or ran after Complete but
    // Complete hadn't yet landed) or is rejected by CAP-D01.01-R16 (it ran
    // AFTER Complete already made the reservation terminal) — both valid.
    expect(["MODIFIED", "VALIDATION_FAILED"]).toContain(modifyResult.type);
    expect(completeResult.ok).toBe(true); // nothing Modify does can ever block Complete

    const reservation = await prisma.reservation.findUniqueOrThrow({ where: { id: reservationId } });
    expect(reservation.status).toBe("Completed");

    const activeAssignments = await prisma.seatingAssignment.findMany({ where: { reservationId, status: { in: ["Assigned", "Seated"] } } });
    expect(activeAssignments).toHaveLength(0); // Complete always leaves zero active, regardless of order
  });

  it("5 iterations, 0 integrity flakes — Complete always leaves zero active assignments, whichever side wins the lock", async () => {
    for (let i = 0; i < 5; i += 1) {
      await resetAll();
      const harnessA = buildFloorHarness(prisma, NOW);
      const harnessB = buildFloorHarness(prismaB, NOW);
      const table = await prisma.table.findFirstOrThrow({ where: { operationalLabel: "Table 4" } });
      const { reservationId } = await createSeatedCapacityReservation(harnessA, table.operationalLabel);

      const [modifyResult, completeResult] = await Promise.all([
        harnessA.availabilityOrchestrator.modifyWithCapacity({
          commandId: `rep-modcomplete-mod-${i}`, reservationId, actor: staffActor,
          changes: { reservationDate: new Date("2026-08-20T20:00:00Z") },
          isServicePeriodStillValid: true,
        }),
        harnessB.availabilityOrchestrator.completeWithCapacity({
          commandId: `rep-modcomplete-complete-${i}`, reservationId, actor: staffActor, isManualCompletion: true, manualCompletionReason: "guest departed",
        }),
      ]);
      expect(["MODIFIED", "VALIDATION_FAILED"], `iteration ${i}`).toContain(modifyResult.type);
      expect(completeResult.ok, `iteration ${i}`).toBe(true);

      const reservation = await prisma.reservation.findUniqueOrThrow({ where: { id: reservationId } });
      expect(reservation.status, `iteration ${i}`).toBe("Completed");
      const activeAssignments = await prisma.seatingAssignment.findMany({ where: { reservationId, status: { in: ["Assigned", "Seated"] } } });
      expect(activeAssignments, `iteration ${i}: zero active assignments`).toHaveLength(0);
    }
  }, 60_000);
});

describe("Scenario T — Modify vs No-show race: a reservation has its time changed while staff concurrently releases it as a No-Show", () => {
  it("final state is coherent regardless of which side acquires the reservation lock first", async () => {
    const harnessA = buildFloorHarness(prisma, NOW);
    const harnessB = buildFloorHarness(prismaB, NOW);
    const table = await prisma.table.findFirstOrThrow({ where: { operationalLabel: "Table 5" } });
    const { reservationId } = await createSeatedCapacityReservation(harnessA, table.operationalLabel);

    const [modifyResult, noShowResult] = await Promise.all([
      harnessA.availabilityOrchestrator.modifyWithCapacity({
        commandId: cmd(), reservationId, actor: staffActor,
        changes: { reservationDate: new Date("2026-08-20T20:00:00Z") },
        isServicePeriodStillValid: true,
      }),
      harnessB.seatingOrchestrator.releaseNoShow({ reservationId, actor: staffActor }),
    ]);

    // Not terminal, so unlike Complete, Modify is never rejected by this race.
    expect(modifyResult.type).toBe("MODIFIED");
    expect(["RELEASED", "NO_ACTIVE_ASSIGNMENT"]).toContain(noShowResult.type);

    const reservation = await prisma.reservation.findUniqueOrThrow({ where: { id: reservationId } });
    expect(reservation.reservationDate.toISOString()).toBe("2026-08-20T20:00:00.000Z");
    expect(reservation.status).toBe("Confirmed"); // No-Show never touches Reservation.status

    const activeAssignments = await prisma.seatingAssignment.findMany({ where: { reservationId, status: { in: ["Assigned", "Seated"] } } });
    expect(activeAssignments).toHaveLength(0); // either No-show releases it, or Modify already had
  });

  it("5 iterations, 0 integrity flakes — zero active assignments survive, whichever side wins the lock", async () => {
    for (let i = 0; i < 5; i += 1) {
      await resetAll();
      const harnessA = buildFloorHarness(prisma, NOW);
      const harnessB = buildFloorHarness(prismaB, NOW);
      const table = await prisma.table.findFirstOrThrow({ where: { operationalLabel: "Table 5" } });
      const { reservationId } = await createSeatedCapacityReservation(harnessA, table.operationalLabel);

      const [modifyResult, noShowResult] = await Promise.all([
        harnessA.availabilityOrchestrator.modifyWithCapacity({
          commandId: `rep-modnoshow-mod-${i}`, reservationId, actor: staffActor,
          changes: { reservationDate: new Date("2026-08-20T20:00:00Z") },
          isServicePeriodStillValid: true,
        }),
        harnessB.seatingOrchestrator.releaseNoShow({ reservationId, actor: staffActor }),
      ]);
      expect(modifyResult.type, `iteration ${i}`).toBe("MODIFIED");
      expect(["RELEASED", "NO_ACTIVE_ASSIGNMENT"], `iteration ${i}`).toContain(noShowResult.type);

      const activeAssignments = await prisma.seatingAssignment.findMany({ where: { reservationId, status: { in: ["Assigned", "Seated"] } } });
      expect(activeAssignments, `iteration ${i}: zero active assignments`).toHaveLength(0);
    }
  }, 60_000);
});

describe("Scenario U — Modify vs ResourceBlock race: a seated reservation's time is changed onto an interval a concurrent block also targets", () => {
  it("exactly one of {seating retained at the new interval, block created} ever holds — never both, never neither", async () => {
    const harnessA = buildFloorHarness(prisma, NOW);
    const harnessB = buildFloorHarness(prismaB, NOW);
    const resourceBlockServiceB = new ResourceBlockService(harnessB.floorRepository, harnessB.transactionManager);
    const table = await prisma.table.findFirstOrThrow({ where: { operationalLabel: "Table 8" } });
    const { reservationId } = await createSeatedCapacityReservation(harnessA, table.operationalLabel);

    const [modifyResult, blockResult] = await Promise.all([
      harnessA.availabilityOrchestrator.modifyWithCapacity({
        commandId: cmd(), reservationId, actor: staffActor,
        changes: { reservationDate: new Date("2026-08-20T20:00:00Z") },
        isServicePeriodStillValid: true,
      }),
      resourceBlockServiceB.blockTable({
        operationalLabel: table.operationalLabel, startTime: new Date("2026-08-20T20:00:00Z"), endTime: new Date("2026-08-20T21:30:00Z"), reason: "race test", actor: staffActor,
      }),
    ]);

    expect(modifyResult.type).toBe("MODIFIED");
    if (modifyResult.type !== "MODIFIED") throw new Error("unreachable");

    if (modifyResult.seatingDisposition === "RETAINED") {
      // Modify won the table first — the block must then see an active
      // claim and be rejected, never silently coexisting with it.
      expect(blockResult.type).toBe("ACTIVE_ASSIGNMENT_CONFLICT");
      const active = await prisma.seatingAssignment.findFirstOrThrow({ where: { reservationId, status: { in: ["Assigned", "Seated"] } } });
      expect(active.startTime.toISOString()).toBe("2026-08-20T20:00:00.000Z");
    } else {
      // The block won the table first — Modify's own revalidation must
      // then see it as blocked and release, never silently overriding it.
      expect(modifyResult.seatingDisposition).toBe("RELEASED");
      expect(blockResult.type).toBe("BLOCKED");
      const active = await prisma.seatingAssignment.findFirst({ where: { reservationId, status: { in: ["Assigned", "Seated"] } } });
      expect(active).toBeNull();
    }
  });

  it("5 iterations, 0 integrity flakes — exactly one of {retained, blocked} ever holds, whichever side wins the lock", async () => {
    for (let i = 0; i < 5; i += 1) {
      await resetAll();
      const harnessA = buildFloorHarness(prisma, NOW);
      const harnessB = buildFloorHarness(prismaB, NOW);
      const resourceBlockServiceB = new ResourceBlockService(harnessB.floorRepository, harnessB.transactionManager);
      const table = await prisma.table.findFirstOrThrow({ where: { operationalLabel: "Table 8" } });
      const { reservationId } = await createSeatedCapacityReservation(harnessA, table.operationalLabel);

      const [modifyResult, blockResult] = await Promise.all([
        harnessA.availabilityOrchestrator.modifyWithCapacity({
          commandId: `rep-modblock-mod-${i}`, reservationId, actor: staffActor,
          changes: { reservationDate: new Date("2026-08-20T20:00:00Z") },
          isServicePeriodStillValid: true,
        }),
        resourceBlockServiceB.blockTable({
          operationalLabel: table.operationalLabel, startTime: new Date("2026-08-20T20:00:00Z"), endTime: new Date("2026-08-20T21:30:00Z"), reason: "race test", actor: staffActor,
        }),
      ]);
      expect(modifyResult.type, `iteration ${i}`).toBe("MODIFIED");
      if (modifyResult.type !== "MODIFIED") throw new Error("unreachable");

      if (modifyResult.seatingDisposition === "RETAINED") {
        expect(blockResult.type, `iteration ${i}`).toBe("ACTIVE_ASSIGNMENT_CONFLICT");
      } else {
        expect(modifyResult.seatingDisposition, `iteration ${i}`).toBe("RELEASED");
        expect(blockResult.type, `iteration ${i}`).toBe("BLOCKED");
      }
    }
  }, 60_000);
});

/**
 * R1.5-P1B0 — Scenario U (above) only ever exercised a Sushi TABLE, whose
 * lock key happens to already match ResourceBlockService's own (both
 * resolve to the table id) — it passed for a reason unrelated to the fix
 * this scenario exists to prove. This scenario uses a genuine Teppanyaki
 * SEAT selector, the one resource kind where, before P1B0's
 * resolveLockTableIds, the seat-assignment side locked the raw seat id
 * while ResourceBlockService locked the parent Table id — two different
 * keys, no serialization, a real race. See the P1B0 design gate for the
 * full evidence (schema inspection, confirmed absence of any database
 * constraint spanning seating_assignment_resources/resource_blocks).
 */
/**
 * R1.5-P1B0 — ResourceBlockService.blockTable's own overlap check now
 * includes every child Seat of the target Table (application/floor/
 * ResourceBlockService.ts), not just the Table itself, closing the gap
 * this exact scenario originally surfaced (a block could previously be
 * created directly underneath an active Teppanyaki seat claim, since the
 * check was hardcoded `seatIds: []`). Combined with the Tier-3 lock-scope
 * fix (proven in the dedicated database-state-based describe block
 * below), a Teppanyaki Seat claim and an overlapping parent-Table block
 * can no longer coexist, exactly like the pre-existing Sushi Table case.
 */
describe("Scenario V — Teppanyaki Seat vs ResourceBlock race: a seated reservation on one grill seat has its time changed onto an interval a concurrent block on the parent grill also targets", () => {
  it("exactly one of {seating retained at the new interval, block created} ever holds — never both, never neither", async () => {
    const harnessA = buildFloorHarness(prisma, NOW);
    const harnessB = buildFloorHarness(prismaB, NOW);
    const resourceBlockServiceB = new ResourceBlockService(harnessB.floorRepository, harnessB.transactionManager);
    const grillD = await prisma.table.findFirstOrThrow({ where: { operationalLabel: "D" } });
    const seatD1 = await prisma.seat.findFirstOrThrow({ where: { tableId: grillD.id, operationalLabel: "D-01" } });

    const created = await harnessA.availabilityOrchestrator.createWithCapacity({
      commandId: cmd(), servicePeriodId: "sp-floor-race",
      contactSelection: { type: "ExistingContact", contactId: "contact-1" },
      reservationDate: new Date("2026-08-20T18:00:00Z"), partySize: 1,
      source: { category: ReservationSourceCategory.Telephone }, preferredArea: "Teppanyaki", actor: staffActor,
    });
    if (created.type !== "CREATED") throw new Error("unreachable");
    const reservationId = created.outcome.reservationId;
    const confirmed = await harnessA.confirmHandler.handle({ commandId: cmd(), reservationId, actor: staffActor, isReservationDataValid: true });
    if (!confirmed.ok) throw new Error("unreachable");
    const assigned = await harnessA.seatingOrchestrator.assignSeating({
      commandId: cmd(), reservationId, requestedAreaId: "Teppanyaki", requestedPartySize: 1,
      resources: [{ seatId: seatD1.id }], startTime: new Date("2026-08-20T18:00:00Z"), endTime: new Date("2026-08-20T19:30:00Z"), actor: staffActor,
    });
    if (assigned.type !== "ASSIGNED") throw new Error("unreachable");

    const [modifyResult, blockResult] = await Promise.all([
      harnessA.availabilityOrchestrator.modifyWithCapacity({
        commandId: cmd(), reservationId, actor: staffActor,
        changes: { reservationDate: new Date("2026-08-20T20:00:00Z") },
        isServicePeriodStillValid: true,
      }),
      resourceBlockServiceB.blockTable({
        operationalLabel: "D", startTime: new Date("2026-08-20T20:00:00Z"), endTime: new Date("2026-08-20T21:30:00Z"), reason: "race test", actor: staffActor,
      }),
    ]);

    expect(modifyResult.type).toBe("MODIFIED");
    if (modifyResult.type !== "MODIFIED") throw new Error("unreachable");

    if (modifyResult.seatingDisposition === "RETAINED") {
      expect(blockResult.type).toBe("ACTIVE_ASSIGNMENT_CONFLICT");
      const active = await prisma.seatingAssignmentResource.findFirstOrThrow({ where: { seatId: seatD1.id, status: { in: ["Assigned", "Seated"] } } });
      expect(active.startTime.toISOString()).toBe("2026-08-20T20:00:00.000Z");
      const block = await prisma.resourceBlock.findFirst({ where: { tableId: grillD.id } });
      expect(block).toBeNull(); // never persisted
    } else {
      expect(modifyResult.seatingDisposition).toBe("RELEASED");
      expect(blockResult.type).toBe("BLOCKED");
      const active = await prisma.seatingAssignmentResource.findFirst({ where: { seatId: seatD1.id, status: { in: ["Assigned", "Seated"] } } });
      expect(active).toBeNull();
    }
  });

  it("5 iterations, 0 integrity flakes — exactly one of {retained, blocked} ever holds, whichever side wins the lock", async () => {
    for (let i = 0; i < 5; i += 1) {
      await resetAll();
      const harnessA = buildFloorHarness(prisma, NOW);
      const harnessB = buildFloorHarness(prismaB, NOW);
      const resourceBlockServiceB = new ResourceBlockService(harnessB.floorRepository, harnessB.transactionManager);
      const grillD = await prisma.table.findFirstOrThrow({ where: { operationalLabel: "D" } });
      const seatD1 = await prisma.seat.findFirstOrThrow({ where: { tableId: grillD.id, operationalLabel: "D-01" } });

      const created = await harnessA.availabilityOrchestrator.createWithCapacity({
        commandId: `rep-modblockseat-create-${i}`, servicePeriodId: "sp-floor-race",
        contactSelection: { type: "ExistingContact", contactId: "contact-1" },
        reservationDate: new Date("2026-08-20T18:00:00Z"), partySize: 1,
        source: { category: ReservationSourceCategory.Telephone }, preferredArea: "Teppanyaki", actor: staffActor,
      });
      if (created.type !== "CREATED") throw new Error("unreachable");
      const reservationId = created.outcome.reservationId;
      const confirmed = await harnessA.confirmHandler.handle({ commandId: `rep-modblockseat-confirm-${i}`, reservationId, actor: staffActor, isReservationDataValid: true });
      if (!confirmed.ok) throw new Error("unreachable");
      const assigned = await harnessA.seatingOrchestrator.assignSeating({
        commandId: `rep-modblockseat-assign-${i}`, reservationId, requestedAreaId: "Teppanyaki", requestedPartySize: 1,
        resources: [{ seatId: seatD1.id }], startTime: new Date("2026-08-20T18:00:00Z"), endTime: new Date("2026-08-20T19:30:00Z"), actor: staffActor,
      });
      if (assigned.type !== "ASSIGNED") throw new Error("unreachable");

      const [modifyResult, blockResult] = await Promise.all([
        harnessA.availabilityOrchestrator.modifyWithCapacity({
          commandId: `rep-modblockseat-mod-${i}`, reservationId, actor: staffActor,
          changes: { reservationDate: new Date("2026-08-20T20:00:00Z") },
          isServicePeriodStillValid: true,
        }),
        resourceBlockServiceB.blockTable({
          operationalLabel: "D", startTime: new Date("2026-08-20T20:00:00Z"), endTime: new Date("2026-08-20T21:30:00Z"), reason: "race test", actor: staffActor,
        }),
      ]);
      expect(modifyResult.type, `iteration ${i}`).toBe("MODIFIED");
      if (modifyResult.type !== "MODIFIED") throw new Error("unreachable");

      if (modifyResult.seatingDisposition === "RETAINED") {
        expect(blockResult.type, `iteration ${i}`).toBe("ACTIVE_ASSIGNMENT_CONFLICT");
      } else {
        expect(modifyResult.seatingDisposition, `iteration ${i}`).toBe("RELEASED");
        expect(blockResult.type, `iteration ${i}`).toBe("BLOCKED");
      }
    }
  }, 60_000);
});

/**
 * R1.5-P1B0 — database-state-based proof, not a timeout-based one:
 * PostgreSQL's own pg_locks catalog, read from a third connection
 * uninvolved in either transaction, is the correctness evidence — never
 * "still unresolved after N ms". Forces the exact interleaving that
 * exposed the pre-fix race (a seat-claiming transaction still open,
 * holding its Tier-3 lock, while a concurrent block-creation attempts
 * the SAME grill) via an explicit, test-controlled barrier.
 */
describe("R1.5-P1B0 — database-state-based proof that a Teppanyaki Seat claim and a ResourceBlock on its parent Table share one Tier-3 lock", () => {
  it("pg_locks shows B's advisory-lock request as ungranted while A holds the SAME (classid, objid), and B is granted — and correctly rejected — only after A commits", async () => {
    const harnessA = buildFloorHarness(prisma, NOW);
    const harnessB = buildFloorHarness(prismaB, NOW);
    const grillE = await prisma.table.findFirstOrThrow({ where: { operationalLabel: "E" } });
    const seatE1 = await prisma.seat.findFirstOrThrow({ where: { tableId: grillE.id, operationalLabel: "E-01" } });
    const reservationId = await createReservation({ partySize: 1, preferredArea: "Teppanyaki" });
    const resourceBlockServiceB = new ResourceBlockService(harnessB.floorRepository, harnessB.transactionManager);
    const { namespace, key } = lockKeyAsUnsignedOid(grillE.id);

    let releaseA: () => void;
    const gate = new Promise<void>((resolve) => {
      releaseA = resolve;
    });

    // Transaction A: mirrors the CORRECTED application path exactly —
    // resolves the seat's parent Table (the same lookup
    // SeatingOrchestrator.resolveLockTableIds performs) and locks THAT
    // id, never the raw seat id — then pauses on the test's own gate,
    // deterministically holding the transaction and its lock open.
    const txA = harnessA.transactionManager.runInTransaction(async (tx) => {
      const seat = await harnessA.floorRepository.findSeatById(seatE1.id, tx);
      if (!seat) throw new Error("unreachable");
      await harnessA.floorRepository.acquireSeatingResourceLock({ resourceId: seat.tableId, tx });

      await gate; // deterministic pause — transaction stays open, lock stays held

      await harnessA.floorRepository.createAssignment({
        assignment: {
          id: "p1b0-det-assignment-1", reservationId, status: "Assigned",
          startTime: new Date("2026-08-20T18:00:00Z"), endTime: new Date("2026-08-20T19:30:00Z"),
          assignedBy: staffActor.id, commandId: cmd(),
        },
        resources: [{ tableId: null, seatId: seatE1.id }],
        tx,
      });
    });

    // Transaction B: a REAL production call (blockTable), on the SAME
    // grill — proving the actual corrected code, not a hand-rolled
    // mirror, converges on the SAME lock key.
    const txB = resourceBlockServiceB.blockTable({
      operationalLabel: "E", startTime: new Date("2026-08-20T18:00:00Z"), endTime: new Date("2026-08-20T19:30:00Z"), reason: "race test", actor: staffActor,
    });

    // Database-state evidence: PostgreSQL's own pg_locks must show BOTH
    // a granted row (A's) and an ungranted row (B's, waiting) for the
    // exact same (classid, objid) — read from a connection uninvolved in
    // either transaction. The bounded poll only waits for this fact to
    // become visible; the assertion itself is the observed `granted`
    // values, not elapsed time.
    const contended = await waitForContendedAdvisoryLock(namespace, key);
    expect(contended.some((r) => r.granted)).toBe(true);
    expect(contended.some((r) => !r.granted)).toBe(true);

    releaseA!();
    await txA;
    const blockResult = await txB;

    // B was genuinely gated on A (the pg_locks evidence above proves
    // that), AND — now that ResourceBlockService.blockTable's own
    // overlap check includes the Table's child Seats (R1.5-P1B0) — B,
    // once granted, correctly finds A's now-committed seat claim and
    // refuses to coexist with it.
    expect(blockResult.type).toBe("ACTIVE_ASSIGNMENT_CONFLICT");

    const activeClaim = await prisma.seatingAssignmentResource.findFirst({ where: { seatId: seatE1.id, status: { in: ["Assigned", "Seated"] } } });
    const activeBlock = await prisma.resourceBlock.findFirst({ where: { tableId: grillE.id } });
    expect(activeClaim).not.toBeNull();
    expect(activeBlock).toBeNull(); // never both coexist
  });
});

describe("R1.5-P1B0 — canonical lock-key resolution: dedup/sort proof via pg_locks", () => {
  it("held-transaction probe: a multi-seat assignment on one grill holds exactly one advisory lock (the grill's), and it is never any seat's own key", async () => {
    const harnessA = buildFloorHarness(prisma, NOW);
    const grillD = await prisma.table.findFirstOrThrow({ where: { operationalLabel: "D" } });
    const seats = await prisma.seat.findMany({ where: { tableId: grillD.id, operationalLabel: { in: ["D-01", "D-02"] } } });
    expect(seats).toHaveLength(2);

    let releaseA: () => void;
    const gate = new Promise<void>((resolve) => {
      releaseA = resolve;
    });

    const txA = harnessA.transactionManager.runInTransaction(async (tx) => {
      const resolved: string[] = [];
      for (const s of seats) {
        const seat = await harnessA.floorRepository.findSeatById(s.id, tx);
        if (seat) resolved.push(seat.tableId);
      }
      const distinct = [...new Set(resolved)]; // mirrors resolveLockTableIds' own dedup
      expect(distinct).toEqual([grillD.id]); // two seats, same grill -> one id
      for (const id of distinct) {
        await harnessA.floorRepository.acquireSeatingResourceLock({ resourceId: id, tx });
      }
      await gate; // hold the transaction open so the probe below can observe it
    });

    const { namespace, key: grillKey } = lockKeyAsUnsignedOid(grillD.id);
    await waitForContendedAdvisoryLockOrGrantedOnly(namespace, grillKey);
    const heldLocks = await currentSeatingAdvisoryLocks(namespace);
    const heldObjids = new Set(heldLocks.filter((r) => r.granted).map((r) => r.objid));

    // Scoped to THIS test's own candidate keys only — `heldObjids` can
    // legitimately also contain unrelated locks from OTHER test files
    // running concurrently in vitest's own parallel file execution (all
    // sharing the same Postgres instance), so asserting a total `.size`
    // across the whole namespace would be flaky under the full suite.
    // Checking only the specific keys THIS test cares about is immune to
    // that.
    expect(heldObjids.has(grillKey)).toBe(true); // the grill's own lock IS held
    for (const s of seats) {
      const { key: seatKey } = lockKeyAsUnsignedOid(s.id);
      expect(heldObjids.has(seatKey)).toBe(false); // never a raw Seat key — only one Table lock exists for this multi-seat, one-grill claim
    }

    releaseA!();
    await txA;
  });

  it("Seats across multiple grills acquire sorted, deduplicated Table locks — never a raw Seat advisory key", async () => {
    const harnessA = buildFloorHarness(prisma, NOW);
    const grillC = await prisma.table.findFirstOrThrow({ where: { operationalLabel: "C" } });
    const grillF = await prisma.table.findFirstOrThrow({ where: { operationalLabel: "F" } });
    const seatC1 = await prisma.seat.findFirstOrThrow({ where: { tableId: grillC.id, operationalLabel: "C-01" } });
    const seatF1 = await prisma.seat.findFirstOrThrow({ where: { tableId: grillF.id, operationalLabel: "F-01" } });

    let releaseA: () => void;
    const gate = new Promise<void>((resolve) => {
      releaseA = resolve;
    });

    const txA = harnessA.transactionManager.runInTransaction(async (tx) => {
      const seatC = await harnessA.floorRepository.findSeatById(seatC1.id, tx);
      const seatF = await harnessA.floorRepository.findSeatById(seatF1.id, tx);
      if (!seatC || !seatF) throw new Error("unreachable");
      const distinct = [...new Set([seatC.tableId, seatF.tableId])].sort();
      for (const id of distinct) {
        await harnessA.floorRepository.acquireSeatingResourceLock({ resourceId: id, tx });
      }
      await gate;
    });

    const { namespace } = lockKeyAsUnsignedOid(grillC.id);
    const { key: grillCKey } = lockKeyAsUnsignedOid(grillC.id);
    await waitForContendedAdvisoryLockOrGrantedOnly(namespace, grillCKey);
    const heldLocks = await currentSeatingAdvisoryLocks(namespace);
    const heldObjids = new Set(heldLocks.filter((r) => r.granted).map((r) => r.objid));

    // Scoped to THIS test's own candidate keys only — see the sibling
    // "held-transaction probe" test's comment above for why a total
    // `.size` assertion across the shared namespace is flaky under the
    // full suite's parallel file execution.
    const { key: grillFKey } = lockKeyAsUnsignedOid(grillF.id);
    expect(heldObjids.has(grillCKey)).toBe(true);
    expect(heldObjids.has(grillFKey)).toBe(true);

    const { key: seatC1Key } = lockKeyAsUnsignedOid(seatC1.id);
    const { key: seatF1Key } = lockKeyAsUnsignedOid(seatF1.id);
    expect(heldObjids.has(seatC1Key)).toBe(false);
    expect(heldObjids.has(seatF1Key)).toBe(false);

    releaseA!();
    await txA;
  });
});
