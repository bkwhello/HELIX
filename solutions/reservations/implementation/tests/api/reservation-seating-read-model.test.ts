import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";
import { Express } from "express";
import { PrismaClient } from "@prisma/client";
import { createApp } from "../../api/app.js";
import { resetDatabase } from "../integration/support/testHarness.js";
import {
  createTestPrismaClient,
  resolveTestDatabaseUrl,
  truncateStaffDomainTables,
  truncateSeatingDomainTables,
} from "../integration/support/testDatabaseSafety.js";
import { seedFloor } from "../../ops/floor/seedFloor.js";
import { PrismaReservationRepository } from "../../infrastructure/persistence/PrismaReservationRepository.js";
import { PrismaDuplicateReservationChecker } from "../../infrastructure/persistence/PrismaDuplicateReservationChecker.js";
import { PrismaClosingDayStore } from "../../infrastructure/persistence/PrismaClosingDayStore.js";
import { PrismaStaffUserRepository } from "../../infrastructure/persistence/PrismaStaffUserRepository.js";
import { PrismaSessionRepository } from "../../infrastructure/persistence/PrismaSessionRepository.js";
import { PrismaLoginAttemptTracker } from "../../infrastructure/persistence/PrismaLoginAttemptTracker.js";
import { ScryptPasswordHasher } from "../../infrastructure/ScryptPasswordHasher.js";
import { RandomSessionTokenGenerator } from "../../infrastructure/RandomSessionTokenGenerator.js";
import { PrismaContactRepository } from "../../infrastructure/persistence/PrismaContactRepository.js";
import { PrismaTransactionManager } from "../../infrastructure/persistence/PrismaTransactionManager.js";
import { UnvalidatedServicePeriodReader } from "../../infrastructure/UnvalidatedServicePeriodReader.js";
import { PrismaCapacityRepository } from "../../infrastructure/persistence/PrismaCapacityRepository.js";
import { PrismaFloorRepository } from "../../infrastructure/persistence/PrismaFloorRepository.js";
import { ServicePeriodService } from "../../application/availability/ServicePeriodService.js";
import { PrismaServicePeriodOverrideStore } from "../../infrastructure/persistence/PrismaServicePeriodOverrideStore.js";
import { CSRF_HEADER_NAME } from "../../api/authMiddleware.js";
import { ActorRole } from "../../domain/value-objects/Actor.js";
import { UX_SATURDAY_PLAN, amsterdamLocalToUtc } from "../../ops/ux/uxSaturdayPlan.js";
import { CAPACITY_POOLS } from "../../domain/availability/CapacityPool.js";

/**
 * R1.5-P7-C — P0-3 read model. GET /reservations (daily list) and
 * GET /reservations/:id now expose `seating` — the authoritative current
 * seating from the reservation's ACTIVE SeatingAssignment and its
 * resources — instead of Reception relying on the legacy free-text
 * Reservation.tableAssignment. Also covers the FloorReadModel
 * hasAllergyNote correction (GET /floor), which must follow ACTIVE Allergy
 * ReservationCriticalNotes, not the free-text `notes`.
 *
 * Real PostgreSQL (helix_reservations_test), real floor seed. Seating rows
 * are written directly: this file tests the READ model for each state; the
 * write paths (assign/move/seat/release) are covered by their own suites
 * and the browser E2E.
 */
const NOW = new Date("2026-08-20T17:30:00Z");
const RESERVATION_TIME = new Date("2026-08-20T18:00:00Z"); // Thursday 20:00 Europe/Amsterdam
const DAY = "2026-08-20";
const END_TIME = new Date("2026-08-20T19:30:00Z");
class FixedClock {
  now(): Date {
    return NOW;
  }
}
let idCounter = 0;
class SequentialIdGenerator {
  generate(): string {
    idCounter += 1;
    return `p7c-${idCounter}`;
  }
}
let eventIdCounter = 0;
class SequentialEventIdGenerator {
  generate(): string {
    eventIdCounter += 1;
    return `p7c-evt-${eventIdCounter}`;
  }
}

const prisma = createTestPrismaClient();
// Same test database, with query logging — used as the app's floor read
// client so the N+1 test (G) can count the actual SQL statements issued.
const countingPrisma = new PrismaClient({ datasourceUrl: resolveTestDatabaseUrl(), log: [{ emit: "event", level: "query" }] });
const executedQueries: string[] = [];
countingPrisma.$on("query", (e) => executedQueries.push(e.query));

const OWNER_USERNAME = "owner-p7c-read-model-test";
const OWNER_PASSWORD = "SuperSecret123!";
let sharedAgent: ReturnType<typeof request.agent>;

function buildApp(): Express {
  const closingDayStore = new PrismaClosingDayStore(prisma);
  return createApp({
    repository: new PrismaReservationRepository(prisma),
    duplicateChecker: new PrismaDuplicateReservationChecker(prisma),
    contactRepository: new PrismaContactRepository(prisma),
    transactionManager: new PrismaTransactionManager(prisma),
    servicePeriodReader: new UnvalidatedServicePeriodReader(),
    closingDayStore,
    idGenerator: new SequentialIdGenerator(),
    eventIdGenerator: new SequentialEventIdGenerator(),
    clock: new FixedClock(),
    capacity: {
      capacityRepository: new PrismaCapacityRepository(prisma),
      transactionManager: new PrismaTransactionManager(prisma),
      servicePeriodService: new ServicePeriodService(closingDayStore, new PrismaServicePeriodOverrideStore(prisma)),
    },
    floor: { floorRepository: new PrismaFloorRepository(prisma), prisma: countingPrisma },
    auth: {
      staffUserRepository: new PrismaStaffUserRepository(prisma),
      sessionRepository: new PrismaSessionRepository(prisma),
      passwordHasher: new ScryptPasswordHasher(),
      sessionTokenGenerator: new RandomSessionTokenGenerator(),
      cookieSecure: false,
      expectedOrigin: null,
      loginAttemptTracker: new PrismaLoginAttemptTracker(prisma),
    },
  });
}

let resCounter = 0;
async function createReservation(overrides: { contactName?: string; notes?: string; tableAssignment?: string } = {}): Promise<string> {
  resCounter += 1;
  const id = `p7c-res-${resCounter}`;
  await prisma.reservation.create({
    data: {
      id,
      servicePeriodId: "sp-p7c",
      contactId: "contact-1",
      contactName: overrides.contactName ?? `P7-C Guest ${resCounter}`,
      status: "Confirmed",
      reservationDate: RESERVATION_TIME,
      partySize: 2,
      sourceCategory: "Telephone",
      preferredArea: "Sushi",
      notes: overrides.notes,
      tableAssignment: overrides.tableAssignment,
      createdBy: "staff-owner-p7c",
      createdAt: NOW,
      updatedAt: NOW,
      version: 1,
    },
  });
  return id;
}

let assignmentCounter = 0;
async function createAssignment(
  reservationId: string,
  status: "Assigned" | "Seated" | "Released",
  resources: readonly ({ tableId: string } | { seatId: string })[]
): Promise<void> {
  assignmentCounter += 1;
  await prisma.seatingAssignment.create({
    data: {
      reservationId,
      status,
      startTime: RESERVATION_TIME,
      endTime: END_TIME,
      assignedBy: "staff-owner-p7c",
      commandId: `p7c-assign-${assignmentCounter}`,
      seatedAt: status === "Seated" ? NOW : null,
      releaseReason: status === "Released" ? "StaffReassigned" : null,
      releasedAt: status === "Released" ? NOW : null,
      resources: {
        create: resources.map((r) => ({
          tableId: "tableId" in r ? r.tableId : null,
          seatId: "seatId" in r ? r.seatId : null,
          status,
          startTime: RESERVATION_TIME,
          endTime: END_TIME,
        })),
      },
    },
  });
}

async function listRow(reservationId: string) {
  const res = await sharedAgent.get(`/reservations?date=${DAY}`);
  expect(res.status).toBe(200);
  const row = res.body.reservations.find((r: { id: string }) => r.id === reservationId);
  expect(row, `reservation ${reservationId} missing from daily list`).toBeDefined();
  return row;
}

beforeAll(async () => {
  await resetDatabase(prisma);
  await truncateStaffDomainTables(prisma);
  await truncateSeatingDomainTables(prisma);
  await seedFloor(resolveTestDatabaseUrl());
  const app = buildApp();
  const passwordHasher = new ScryptPasswordHasher();
  await new PrismaStaffUserRepository(prisma).create({
    id: "staff-owner-p7c",
    username: OWNER_USERNAME,
    displayName: "Test Owner",
    email: null,
    passwordHash: await passwordHasher.hash(OWNER_PASSWORD),
    role: ActorRole.Owner,
  });
  sharedAgent = request.agent(app);
  const login = await sharedAgent.post("/auth/login").set(CSRF_HEADER_NAME, "1").send({ username: OWNER_USERNAME, password: OWNER_PASSWORD });
  if (login.status !== 200) throw new Error(`login failed: ${login.status}`);
});
afterAll(async () => {
  await countingPrisma.$disconnect();
  await prisma.$disconnect();
});
beforeEach(async () => {
  await truncateSeatingDomainTables(prisma);
  await resetDatabase(prisma);
  await prisma.contact.create({
    data: { id: "contact-1", displayName: "P7-C Guest", phoneRaw: "0611111111", phoneNormalized: "+31611111111", createdBy: "staff-owner-p7c", lastRelevantActivityAt: NOW },
  });
});

describe("R1.5-P7-C — authoritative seating in GET /reservations and GET /reservations/:id", () => {
  it("A — no assignment: seating is Unassigned with no resources", async () => {
    const id = await createReservation();
    const row = await listRow(id);
    expect(row.seating).toEqual({ status: "Unassigned", resources: [] });
    expect(row.seatingAssignmentStatus).toBe("Unassigned");
  });

  it("B — Assigned: real status and the actually assigned table label (list and detail agree)", async () => {
    const id = await createReservation();
    await createAssignment(id, "Assigned", [{ tableId: "sushi-table-5" }]);
    const row = await listRow(id);
    expect(row.seating).toEqual({ status: "Assigned", resources: [{ kind: "Table", label: "Table 5", tableLabel: "Table 5" }] });
    expect(row.seatingAssignmentStatus).toBe("Assigned");
    const detail = await sharedAgent.get(`/reservations/${id}`);
    expect(detail.body.seating).toEqual(row.seating);
    expect(detail.body.seatingAssignmentStatus).toBe("Assigned");
  });

  it("C — Seated: real status and resources", async () => {
    const id = await createReservation();
    await createAssignment(id, "Seated", [{ tableId: "sushi-table-6" }]);
    const row = await listRow(id);
    expect(row.seating).toEqual({ status: "Seated", resources: [{ kind: "Table", label: "Table 6", tableLabel: "Table 6" }] });
    expect(row.seatingAssignmentStatus).toBe("Seated");
  });

  it("D — Released: a released assignment is NOT current seating (move = old released + new active: only the new one shows)", async () => {
    const releasedOnly = await createReservation();
    await createAssignment(releasedOnly, "Released", [{ tableId: "sushi-table-7" }]);
    expect((await listRow(releasedOnly)).seating).toEqual({ status: "Unassigned", resources: [] });

    const moved = await createReservation();
    await createAssignment(moved, "Released", [{ tableId: "sushi-table-8" }]);
    await createAssignment(moved, "Assigned", [{ tableId: "sushi-table-9" }]);
    expect((await listRow(moved)).seating).toEqual({ status: "Assigned", resources: [{ kind: "Table", label: "Table 9", tableLabel: "Table 9" }] });
  });

  it("E — multiple resources: every assigned Teppanyaki seat, with its grill, in label order", async () => {
    const id = await createReservation();
    await createAssignment(id, "Assigned", [{ seatId: "teppanyaki-c-seat-04" }, { seatId: "teppanyaki-c-seat-03" }, { seatId: "teppanyaki-c-seat-05" }]);
    const row = await listRow(id);
    expect(row.seating).toEqual({
      status: "Assigned",
      resources: [
        { kind: "Seat", label: "C-03", tableLabel: "C" },
        { kind: "Seat", label: "C-04", tableLabel: "C" },
        { kind: "Seat", label: "C-05", tableLabel: "C" },
      ],
    });
  });

  it("F — legacy conflict: a fake Reservation.tableAssignment never overrides the real SeatingAssignment", async () => {
    const id = await createReservation({ tableAssignment: "Tafel 99" });
    await createAssignment(id, "Seated", [{ tableId: "sushi-table-10" }]);
    const row = await listRow(id);
    expect(row.seating).toEqual({ status: "Seated", resources: [{ kind: "Table", label: "Table 10", tableLabel: "Table 10" }] });
    expect(JSON.stringify(row.seating)).not.toContain("Tafel 99");
    expect(row.tableAssignment).toBe("Tafel 99"); // legacy value still returned as-is, never as `seating`

    const unassigned = await createReservation({ tableAssignment: "Tafel 12" });
    expect((await listRow(unassigned)).seating).toEqual({ status: "Unassigned", resources: [] });
  });

  it("G — no N+1: the daily list issues the same, constant number of seating queries for 1 and for 8 reservations", async () => {
    const countSeatingQueries = () => executedQueries.filter((q) => /"seating_assignments"|"seating_assignment_resources"|"seats"|"tables"/.test(q)).length;
    const one = await createReservation();
    await createAssignment(one, "Assigned", [{ seatId: "teppanyaki-c-seat-02" }]);
    executedQueries.length = 0;
    await listRow(one);
    const queriesForOne = countSeatingQueries();

    for (let i = 0; i < 7; i++) {
      const id = await createReservation();
      await createAssignment(id, i % 2 === 0 ? "Assigned" : "Seated", [{ seatId: `teppanyaki-d-seat-0${i + 1}` }]);
    }
    executedQueries.length = 0;
    const res = await sharedAgent.get(`/reservations?date=${DAY}`);
    expect(res.body.reservations).toHaveLength(8);
    expect(res.body.reservations.every((r: { seating: { status: string } }) => r.seating.status !== "Unassigned")).toBe(true);
    const queriesForEight = countSeatingQueries();

    expect(queriesForOne).toBeGreaterThan(0);
    // assignments, their resources, seats, tables + (R1.5-P8-A) one batched latest-release lookup for the no-show signal
    expect(queriesForOne).toBeLessThanOrEqual(5);
    expect(queriesForEight).toBe(queriesForOne);
  });
});

describe("R1.5-P7-C — FloorReadModel.hasAllergyNote follows ACTIVE Allergy critical notes (GET /floor)", () => {
  async function floorRow(reservationId: string) {
    const res = await sharedAgent.get(`/floor?date=${DAY}`);
    expect(res.status).toBe(200);
    const row = res.body.rows.find((r: { reservationId: string }) => r.reservationId === reservationId);
    expect(row, `reservation ${reservationId} missing from floor view`).toBeDefined();
    return row;
  }
  async function addNote(reservationId: string, noteType: "Allergy" | "Critical", status: "Active" | "Resolved") {
    await prisma.reservationCriticalNote.create({
      data: { reservationId, noteType, detail: `${noteType} ${status}`, status, createdByStaffUserId: "staff-owner-p7c", resolvedAt: status === "Resolved" ? NOW : null },
    });
  }

  it("R — an Active Allergy note → hasAllergyNote = true", async () => {
    const id = await createReservation();
    await addNote(id, "Allergy", "Active");
    expect((await floorRow(id)).hasAllergyNote).toBe(true);
  });

  it("S — no Allergy note (only an Active non-allergy Critical note) → false", async () => {
    const id = await createReservation();
    await addNote(id, "Critical", "Active");
    expect((await floorRow(id)).hasAllergyNote).toBe(false);
  });

  it("T — a Resolved Allergy note does not count as an active allergy", async () => {
    const id = await createReservation();
    await addNote(id, "Allergy", "Resolved");
    expect((await floorRow(id)).hasAllergyNote).toBe(false);
  });

  it("U — free-text notes with allergy-like words do NOT set the authoritative allergy state", async () => {
    const id = await createReservation({ notes: "notenallergie! gluten allergie, geen schaaldieren" });
    expect((await floorRow(id)).hasAllergyNote).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────
// R1.5-P8-A — no-show signal (N1–N6) and Teppanyaki occupancy at time T (T1–T10)
// ─────────────────────────────────────────────────────────────────────────
let p8Counter = 0;
async function createP8Reservation(opts: { at: Date; area: "Sushi" | "Teppanyaki"; partySize: number; status?: string; name?: string }): Promise<string> {
  p8Counter += 1;
  const id = `p8a-res-${p8Counter}`;
  await prisma.reservation.create({
    data: {
      id,
      servicePeriodId: "dinner",
      contactId: "contact-1",
      contactName: opts.name ?? `P8-A Guest ${p8Counter}`,
      status: opts.status ?? "Confirmed",
      reservationDate: opts.at,
      partySize: opts.partySize,
      sourceCategory: "Telephone",
      preferredArea: opts.area,
      createdBy: "staff-owner-p7c",
      createdAt: NOW,
      updatedAt: NOW,
      version: 1,
    },
  });
  return id;
}

async function createP8Assignment(
  reservationId: string,
  status: "Assigned" | "Seated" | "Released",
  resources: readonly ({ tableId: string } | { seatId: string })[],
  start: Date,
  end: Date,
  releaseReason?: "NoShow" | "StaffReassigned" | "GuestCancelled" | "Completed",
  releasedAt?: Date
): Promise<void> {
  p8Counter += 1;
  await prisma.seatingAssignment.create({
    data: {
      reservationId,
      status,
      startTime: start,
      endTime: end,
      assignedBy: "staff-owner-p7c",
      commandId: `p8a-assign-${p8Counter}`,
      seatedAt: status === "Seated" ? NOW : null,
      releaseReason: status === "Released" ? (releaseReason ?? "StaffReassigned") : null,
      releasedAt: status === "Released" ? (releasedAt ?? NOW) : null,
      resources: {
        create: resources.map((r) => ({ tableId: "tableId" in r ? r.tableId : null, seatId: "seatId" in r ? r.seatId : null, status, startTime: start, endTime: end })),
      },
    },
  });
}

const minutesLater = (d: Date, m: number) => new Date(d.getTime() + m * 60_000);

describe("R1.5-P8-A — authoritative No-show signal in GET /reservations (N1–N6)", () => {
  const sushiEnd = minutesLater(RESERVATION_TIME, CAPACITY_POOLS.Sushi.durationMinutes);

  it("N1 — an ordinary expected reservation carries no No-show signal", async () => {
    const id = await createReservation();
    const row = await listRow(id);
    expect(row.noShow).toBe(false);
    expect(row.lastSeatingRelease).toBeNull();
  });

  it("N2 — a reservation released as NoShow is exposed as noShow (list AND detail), with reason and time", async () => {
    const id = await createReservation();
    await createP8Assignment(id, "Released", [{ tableId: "sushi-table-5" }], RESERVATION_TIME, sushiEnd, "NoShow", NOW);
    const row = await listRow(id);
    expect(row.noShow).toBe(true);
    expect(row.lastSeatingRelease).toEqual({ reason: "NoShow", releasedAt: NOW.toISOString() });
    expect(row.status).toBe("Confirmed"); // Reservation.status is never changed by a no-show
    const detail = await sharedAgent.get(`/reservations/${id}`);
    expect(detail.body.noShow).toBe(true);
  });

  it("N3 — other release reasons are never classified as NoShow", async () => {
    for (const reason of ["StaffReassigned", "GuestCancelled", "Completed"] as const) {
      const id = await createReservation();
      await createP8Assignment(id, "Released", [{ tableId: "sushi-table-6" }], RESERVATION_TIME, sushiEnd, reason);
      const row = await listRow(id);
      expect(row.noShow, reason).toBe(false);
      expect(row.lastSeatingRelease.reason).toBe(reason);
    }
  });

  it("N4 — a Cancelled reservation stays distinguishable from a No-show", async () => {
    const id = await createP8Reservation({ at: RESERVATION_TIME, area: "Sushi", partySize: 2, status: "Cancelled" });
    await createP8Assignment(id, "Released", [{ tableId: "sushi-table-7" }], RESERVATION_TIME, sushiEnd, "GuestCancelled");
    const row = await listRow(id);
    expect(row.status).toBe("Cancelled");
    expect(row.noShow).toBe(false);
  });

  it("N5 — historical Released seating never makes an ACTIVE reservation a No-show (incl. a no-show that was re-seated)", async () => {
    const reseated = await createReservation();
    await createP8Assignment(reseated, "Released", [{ tableId: "sushi-table-8" }], RESERVATION_TIME, sushiEnd, "NoShow", new Date(NOW.getTime() - 60_000));
    await createP8Assignment(reseated, "Assigned", [{ tableId: "sushi-table-9" }], RESERVATION_TIME, sushiEnd);
    const moved = await createReservation();
    await createP8Assignment(moved, "Released", [{ tableId: "sushi-table-10" }], RESERVATION_TIME, sushiEnd, "StaffReassigned");
    await createP8Assignment(moved, "Seated", [{ tableId: "sushi-table-11" }], RESERVATION_TIME, sushiEnd);
    expect((await listRow(reseated)).noShow).toBe(false);
    expect((await listRow(moved)).noShow).toBe(false);
    // An unrelated reservation is unaffected by someone else's no-show.
    const unrelated = await createReservation();
    expect((await listRow(unrelated)).noShow).toBe(false);
  });

  it("N6 — no N+1: the release lookup is one batched query for 1 and for 8 reservations", async () => {
    // The release lookup is the only seating query ordered by released_at (status values are bound parameters, not SQL text).
    const releaseQueries = () => executedQueries.filter((q) => /"seating_assignments"/.test(q) && /"released_at" DESC/.test(q)).length;
    const first = await createReservation();
    await createP8Assignment(first, "Released", [{ tableId: "sushi-table-12" }], RESERVATION_TIME, sushiEnd, "NoShow");
    executedQueries.length = 0;
    await listRow(first);
    const forOne = releaseQueries();
    for (let i = 0; i < 7; i++) {
      const id = await createReservation();
      await createP8Assignment(id, "Released", [{ tableId: `sushi-bar-${17 + (i % 4)}` }], RESERVATION_TIME, sushiEnd, i % 2 === 0 ? "NoShow" : "StaffReassigned");
    }
    executedQueries.length = 0;
    const res = await sharedAgent.get(`/reservations?date=${DAY}`);
    expect(res.body.reservations).toHaveLength(8);
    expect(releaseQueries()).toBe(forOne);
    expect(forOne).toBe(1);
  });
});

describe("R1.5-P8-A — authoritative Teppanyaki occupancy at time T: GET /floor/teppanyaki-occupancy (T1–T10)", () => {
  // The UX busy-Saturday Teppanyaki seating, reproduced 1:1 from the UX fixture plan
  // (ops/ux/uxSaturdayPlan.ts) on 2026-10-10, including its move and no-show history.
  const DATE = "2026-10-10";
  const AT_1945 = amsterdamLocalToUtc(DATE, "19:45");
  const durationMs = CAPACITY_POOLS.Teppanyaki.durationMinutes * 60_000;
  const seats = (ids: readonly string[]) => ids.map((seatId) => ({ seatId }));

  async function seedUxTeppanyaki(): Promise<void> {
    for (const r of UX_SATURDAY_PLAN.filter((x) => x.area === "Teppanyaki")) {
      const start = amsterdamLocalToUtc(DATE, r.time);
      const end = new Date(start.getTime() + durationMs);
      const id = await createP8Reservation({ at: start, area: "Teppanyaki", partySize: r.partySize, status: r.status, name: r.ref });
      const s = r.seating;
      if (!s) continue;
      if (s.mode === "noShow") await createP8Assignment(id, "Released", seats(s.resources), start, end, "NoShow");
      else {
        if (s.moveFrom) await createP8Assignment(id, "Released", seats(s.moveFrom), start, end, "StaffReassigned");
        await createP8Assignment(id, s.mode === "seat" ? "Seated" : "Assigned", seats(s.resources), start, end);
      }
    }
  }

  type Grill = { occupiedSeats: number; capacity: number; freeSeats: number; full: boolean; blocked: boolean };
  async function occupancyAt(at: Date): Promise<Record<string, Grill>> {
    const res = await sharedAgent.get(`/floor/teppanyaki-occupancy?at=${encodeURIComponent(at.toISOString())}`);
    expect(res.status).toBe(200);
    expect(res.body.at).toBe(at.toISOString());
    return Object.fromEntries((res.body.grills as (Grill & { label: string })[]).map((g) => [g.label, g]));
  }

  it("T1–T4 — UX Saturday 19:45: C 5/10, D 8/10, E 10/10 FULL, F 2/10", async () => {
    await seedUxTeppanyaki();
    const g = await occupancyAt(AT_1945);
    expect(g["C"]).toMatchObject({ occupiedSeats: 5, capacity: 10, freeSeats: 5, full: false, blocked: false });
    expect(g["D"]).toMatchObject({ occupiedSeats: 8, capacity: 10, freeSeats: 2, full: false });
    expect(g["E"]).toMatchObject({ occupiedSeats: 10, capacity: 10, freeSeats: 0, full: true });
    expect(g["F"]).toMatchObject({ occupiedSeats: 2, capacity: 10, freeSeats: 8, full: false });
  });

  it("T5 — a cancelled reservation (released seating) never counts", async () => {
    await seedUxTeppanyaki();
    const start = amsterdamLocalToUtc(DATE, "19:30");
    const cancelled = await createP8Reservation({ at: start, area: "Teppanyaki", partySize: 2, status: "Cancelled" });
    await createP8Assignment(cancelled, "Released", [{ seatId: "teppanyaki-f-seat-07" }, { seatId: "teppanyaki-f-seat-08" }], start, new Date(start.getTime() + durationMs), "GuestCancelled");
    expect((await occupancyAt(AT_1945))["F"]!.occupiedSeats).toBe(2);
  });

  it("T6 — earlier (ended) and later (not yet started) seatings do not count simultaneously", async () => {
    await seedUxTeppanyaki();
    const g1945 = await occupancyAt(AT_1945);
    expect(g1945["C"]!.occupiedSeats).toBe(5); // the 17:00 wave (C-01..10, until 19:30) has ended
    expect(g1945["F"]!.occupiedSeats).toBe(2); // UX-SAT-012 (F-01..04) only starts at 20:00
    expect((await occupancyAt(amsterdamLocalToUtc(DATE, "17:15")))["C"]).toMatchObject({ occupiedSeats: 10, full: true });
    expect((await occupancyAt(amsterdamLocalToUtc(DATE, "20:15")))["F"]!.occupiedSeats).toBe(6); // 017 F-05..06 + 012 F-01..04
    // Boundary: a seating ending exactly at T no longer occupies at T (end-exclusive, like the seating overlap rule).
    expect((await occupancyAt(amsterdamLocalToUtc(DATE, "19:30")))["C"]!.occupiedSeats).toBe(0);
  });

  it("T7 + T10 — concurrent active seatings of several reservations on one grill aggregate (E = 3 + 2 + 5)", async () => {
    await seedUxTeppanyaki();
    expect((await occupancyAt(AT_1945))["E"]).toMatchObject({ occupiedSeats: 10, full: true });
    expect((await occupancyAt(amsterdamLocalToUtc(DATE, "19:05")))["E"]!.occupiedSeats).toBe(5); // 006 + 007 only (008 starts 19:15)
  });

  it("T8 — released resources (moved-from seats, no-show seats) never count as current occupancy", async () => {
    await seedUxTeppanyaki();
    const g = await occupancyAt(AT_1945);
    expect(g["C"]!.occupiedSeats).toBe(5); // not 10: UX-SAT-010 moved away from C-06..10
    expect(g["F"]!.occupiedSeats).toBe(2); // not 4: UX-SAT-016 F-09..10 released as NoShow
  });

  it("T9 — capacity/free/full are internally consistent; a blocked grill has no free seats", async () => {
    await seedUxTeppanyaki();
    await prisma.resourceBlock.create({ data: { tableId: "teppanyaki-f", startTime: amsterdamLocalToUtc(DATE, "19:00"), endTime: amsterdamLocalToUtc(DATE, "21:00"), reason: "P8-A test", createdBy: "staff-owner-p7c" } });
    const g = await occupancyAt(AT_1945);
    for (const grill of Object.values(g)) {
      expect(grill.occupiedSeats).toBeGreaterThanOrEqual(0);
      expect(grill.occupiedSeats).toBeLessThanOrEqual(grill.capacity);
      if (!grill.blocked) expect(grill.freeSeats).toBe(grill.capacity - grill.occupiedSeats);
      expect(grill.full).toBe(!grill.blocked && grill.freeSeats === 0);
    }
    expect(g["F"]).toMatchObject({ blocked: true, freeSeats: 0, full: false, occupiedSeats: 2 });
  });

  it("rejects an invalid `at`", async () => {
    expect((await sharedAgent.get("/floor/teppanyaki-occupancy?at=not-a-date")).status).toBe(400);
  });
});
