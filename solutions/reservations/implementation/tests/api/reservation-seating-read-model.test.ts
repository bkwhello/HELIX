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
    expect(queriesForOne).toBeLessThanOrEqual(4); // assignments, their resources, seats, tables
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
