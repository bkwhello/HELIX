import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";
import { Express, Request, Response } from "express";
import { createApp } from "../../api/app.js";
import { resetDatabase } from "../integration/support/testHarness.js";
import {
  createTestPrismaClient,
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
import { CSRF_HEADER_NAME, requirePermission, StaffPrincipal } from "../../api/authMiddleware.js";
import { Permission } from "../../domain/rules/StaffAuthorizationPolicy.js";
import { ActorRole } from "../../domain/value-objects/Actor.js";

/**
 * P1-B5 — HTTP-level coverage for POST /reservations/:id/seating/no-show,
 * which composes the existing, unmodified SeatingOrchestrator.releaseNoShow()
 * directly. Same real-PostgreSQL, real-floor-seed posture as
 * tests/api/seating-assignment.test.ts (B4-B); own disjoint fixture table
 * ids so this file never collides with that one, even though Table/Seat
 * rows are shared, never-truncated fixture state across the whole run.
 */
const NOW = new Date("2026-08-20T17:30:00Z"); // 19:30 Europe/Amsterdam — inside Thursday's 17:00-21:00 window.
const RESERVATION_TIME = new Date("2026-08-20T18:00:00Z");
class FixedClock {
  now(): Date {
    return NOW;
  }
}
let idCounter = 0;
class SequentialIdGenerator {
  generate(): string {
    idCounter += 1;
    return `noshow-${idCounter}`;
  }
}
let eventIdCounter = 0;
class SequentialEventIdGenerator {
  generate(): string {
    eventIdCounter += 1;
    return `noshow-evt-${eventIdCounter}`;
  }
}

const prisma = createTestPrismaClient();
const OWNER_USERNAME = "owner-seating-no-show-test";
const OWNER_PASSWORD = "SuperSecret123!";
let sharedApp: Express;
let sharedAgent: ReturnType<typeof request.agent>;

function buildApp() {
  const closingDayStore = new PrismaClosingDayStore(prisma);
  const app = createApp({
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
    floor: {
      floorRepository: new PrismaFloorRepository(prisma),
      prisma,
    },
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
  return { app };
}

function post(agent: ReturnType<typeof request.agent>, url: string) {
  return agent.post(url).set(CSRF_HEADER_NAME, "1");
}

function patchReq(agent: ReturnType<typeof request.agent>, url: string) {
  return agent.patch(url).set(CSRF_HEADER_NAME, "1");
}

let resCounter = 0;
async function createReservation(overrides: { partySize?: number; preferredArea?: string; reservationDate?: Date; status?: string } = {}): Promise<string> {
  resCounter += 1;
  const id = `noshow-res-${resCounter}`;
  await prisma.reservation.create({
    data: {
      id,
      servicePeriodId: "sp-noshow",
      contactId: "contact-1",
      contactName: "No-Show Test Guest",
      status: overrides.status ?? "Confirmed",
      reservationDate: overrides.reservationDate ?? RESERVATION_TIME,
      partySize: overrides.partySize ?? 2,
      sourceCategory: "Telephone",
      preferredArea: overrides.preferredArea ?? "Sushi",
      createdBy: "staff-owner-seating-no-show-test",
      createdAt: NOW,
      updatedAt: NOW,
      version: 1,
    },
  });
  return id;
}

async function createCapacityCommitment(reservationId: string, overrides: { partySize?: number; reservationDate?: Date } = {}) {
  const commitmentId = `noshow-commit-${reservationId}`;
  const start = overrides.reservationDate ?? RESERVATION_TIME;
  await prisma.capacityCommitment.create({
    data: {
      commitmentId,
      reservationId,
      capacityPoolId: "Sushi",
      startTime: start,
      endTime: new Date(start.getTime() + 90 * 60_000),
      partySize: overrides.partySize ?? 2,
      status: "Committed",
      commandId: `noshow-commit-cmd-${reservationId}`,
    },
  });
  return commitmentId;
}

beforeAll(async () => {
  await resetDatabase(prisma);
  await truncateStaffDomainTables(prisma);
  await truncateSeatingDomainTables(prisma);
  await seedFloor(process.env["TEST_DATABASE_URL"]!);

  const built = buildApp();
  sharedApp = built.app;

  const passwordHasher = new ScryptPasswordHasher();
  const staffUserRepository = new PrismaStaffUserRepository(prisma);
  await staffUserRepository.create({
    id: "staff-owner-seating-no-show-test",
    username: OWNER_USERNAME,
    displayName: "Test Owner",
    email: null,
    passwordHash: await passwordHasher.hash(OWNER_PASSWORD),
    role: ActorRole.Owner,
  });

  sharedAgent = request.agent(sharedApp);
  const loginRes = await post(sharedAgent, "/auth/login").send({ username: OWNER_USERNAME, password: OWNER_PASSWORD });
  if (loginRes.status !== 200) throw new Error(`test setup failed to log in: ${loginRes.status} ${JSON.stringify(loginRes.body)}`);
});
afterAll(async () => {
  await prisma.$disconnect();
});
beforeEach(async () => {
  await truncateSeatingDomainTables(prisma);
  await resetDatabase(prisma);
  await prisma.contact.create({
    data: { id: "contact-1", displayName: "No-Show Test Guest", phoneRaw: "0611111111", phoneNormalized: "+31611111111", createdBy: "staff-owner-seating-no-show-test", lastRelevantActivityAt: NOW },
  });
});

function noShow(reservationId: string) {
  return post(sharedAgent, `/reservations/${reservationId}/seating/no-show`).send({});
}

describe("POST /reservations/:id/seating/no-show — authentication and authorization", () => {
  it("missing authentication → 401", async () => {
    const reservationId = await createReservation();
    const res = await request(sharedApp).post(`/reservations/${reservationId}/seating/no-show`).set(CSRF_HEADER_NAME, "1").send({});
    expect(res.status).toBe(401);
  });

  it(
    "a role absent from the permission matrix gets 403 — same established precedent as the other seating test files: every currently-defined " +
      "ActorRole already includes seating.release, so this exercises requirePermission(Permission.SeatingRelease) directly.",
    () => {
      const middleware = requirePermission(Permission.SeatingRelease);
      const principal: StaffPrincipal = { staffUserId: "x", role: "NoSuchRole" as unknown as ActorRole, displayName: "x" };
      const req = { staffPrincipal: principal } as unknown as Request;
      let statusCode: number | undefined;
      const res = {
        status(code: number) {
          statusCode = code;
          return this;
        },
        json() {
          return this;
        },
      } as unknown as Response;
      let nextCalled = false;
      middleware(req, res, () => {
        nextCalled = true;
      });
      expect(statusCode).toBe(403);
      expect(nextCalled).toBe(false);
    }
  );
});

describe("POST /reservations/:id/seating/no-show — successful release", () => {
  it("releases an existing active (Seated) assignment — end to end through the real B4-B assign endpoint first", async () => {
    const reservationId = await createReservation({ preferredArea: "Sushi", partySize: 2, status: "Confirmed" });
    const commitmentId = await createCapacityCommitment(reservationId, { partySize: 2 });

    const assignRes = await post(sharedAgent, `/reservations/${reservationId}/seating`).send({
      commandId: "noshow-assign-cmd-1",
      resources: [{ tableId: "sushi-table-1" }],
    });
    expect(assignRes.status).toBe(201);
    expect(assignRes.body.status).toBe("Seated");

    const res = await noShow(reservationId);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ type: "RELEASED" });

    const assignment = await prisma.seatingAssignment.findUniqueOrThrow({ where: { id: assignRes.body.assignmentId } });
    expect(assignment.status).toBe("Released");
    expect(assignment.releaseReason).toBe("NoShow");
    expect(assignment.releasedBy).toBe("staff-owner-seating-no-show-test");
    expect(assignment.releasedAt).not.toBeNull();

    // Reservation and CapacityCommitment must remain completely untouched.
    const reservation = await prisma.reservation.findUniqueOrThrow({ where: { id: reservationId } });
    expect(reservation.status).toBe("Confirmed");
    expect(reservation.version).toBe(1);
    const commitment = await prisma.capacityCommitment.findUniqueOrThrow({ where: { commitmentId } });
    expect(commitment.status).toBe("Committed");
  });

  it("releases an Assigned (not yet Seated) assignment the same way", async () => {
    const reservationId = await createReservation({ preferredArea: "Sushi" });
    const assignment = await prisma.seatingAssignment.create({
      data: {
        reservationId,
        status: "Assigned",
        startTime: RESERVATION_TIME,
        endTime: new Date(RESERVATION_TIME.getTime() + 90 * 60_000),
        assignedBy: "staff-owner-seating-no-show-test",
        commandId: "noshow-fixture-assigned-1",
      },
    });
    await prisma.seatingAssignmentResource.create({
      data: { assignmentId: assignment.id, tableId: "sushi-table-2", status: "Assigned", startTime: RESERVATION_TIME, endTime: new Date(RESERVATION_TIME.getTime() + 90 * 60_000) },
    });

    const res = await noShow(reservationId);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ type: "RELEASED" });

    const stored = await prisma.seatingAssignment.findUniqueOrThrow({ where: { id: assignment.id } });
    expect(stored.status).toBe("Released");
    expect(stored.releaseReason).toBe("NoShow");
  });
});

describe("POST /reservations/:id/seating/no-show — no active assignment", () => {
  it("a reservation with no assignment at all → 409 NO_ACTIVE_ASSIGNMENT", async () => {
    const reservationId = await createReservation({ preferredArea: "Sushi" });
    const res = await noShow(reservationId);
    expect(res.status).toBe(409);
    expect(res.body).toEqual({ type: "NO_ACTIVE_ASSIGNMENT" });
  });

  it("a reservation whose only assignment is already Released → 409 NO_ACTIVE_ASSIGNMENT", async () => {
    const reservationId = await createReservation({ preferredArea: "Sushi" });
    await prisma.seatingAssignment.create({
      data: {
        reservationId,
        status: "Released",
        releaseReason: "GuestCancelled",
        releasedBy: "staff-owner-seating-no-show-test",
        releasedAt: NOW,
        startTime: RESERVATION_TIME,
        endTime: new Date(RESERVATION_TIME.getTime() + 90 * 60_000),
        assignedBy: "staff-owner-seating-no-show-test",
        commandId: "noshow-fixture-already-released",
      },
    });
    const res = await noShow(reservationId);
    expect(res.status).toBe(409);
    expect(res.body).toEqual({ type: "NO_ACTIVE_ASSIGNMENT" });
  });
});

describe("POST /reservations/:id/seating/no-show — repeat-call behavior", () => {
  it("a second call after a successful release returns 409 NO_ACTIVE_ASSIGNMENT, not a duplicate release or an error", async () => {
    const reservationId = await createReservation({ preferredArea: "Sushi" });
    const assignment = await prisma.seatingAssignment.create({
      data: {
        reservationId,
        status: "Seated",
        seatedAt: NOW,
        startTime: RESERVATION_TIME,
        endTime: new Date(RESERVATION_TIME.getTime() + 90 * 60_000),
        assignedBy: "staff-owner-seating-no-show-test",
        commandId: "noshow-fixture-repeat-1",
      },
    });
    await prisma.seatingAssignmentResource.create({
      data: { assignmentId: assignment.id, tableId: "sushi-table-3", status: "Seated", startTime: RESERVATION_TIME, endTime: new Date(RESERVATION_TIME.getTime() + 90 * 60_000) },
    });

    const first = await noShow(reservationId);
    expect(first.status).toBe(200);

    const second = await noShow(reservationId);
    expect(second.status).toBe(409);
    expect(second.body).toEqual({ type: "NO_ACTIVE_ASSIGNMENT" });

    // Still exactly one assignment row, still Released — the repeat call
    // did not create a duplicate or mutate it further.
    const assignments = await prisma.seatingAssignment.findMany({ where: { reservationId } });
    expect(assignments.length).toBe(1);
    expect(assignments[0]?.status).toBe("Released");
  });
});

describe("POST /reservations/:id/seating/no-show — unknown reservation", () => {
  it("unknown reservation id → NO_ACTIVE_ASSIGNMENT (releaseNoShow finds nothing to release; not a 404 — this route never separately validates reservation existence)", async () => {
    const res = await noShow("does-not-exist");
    expect(res.status).toBe(409);
    expect(res.body).toEqual({ type: "NO_ACTIVE_ASSIGNMENT" });
  });
});

describe("Ordinary reservation acceptance — unaffected by this increment", () => {
  it("POST /availability/reservations still succeeds exactly as before", async () => {
    const res = await post(sharedAgent, "/availability/reservations").send({
      commandId: "noshow-ordinary-create-1",
      servicePeriodId: "sp-1",
      contactSelection: { type: "ExistingContact", contactId: "contact-1" },
      reservationDate: new Date("2026-08-22T18:00:00Z").toISOString(),
      partySize: 2,
      preferredArea: "Sushi",
      source: { category: "Telephone" },
    });
    expect(res.status).toBe(201);
  });
});

describe("POST /reservations/:id/complete — R1.5-P1A: releases the active seating assignment, HTTP response/contract unchanged", () => {
  it("completing a seated reservation returns 204 exactly as before, and now also frees the table", async () => {
    const reservationId = await createReservation({ preferredArea: "Sushi", partySize: 2, status: "Confirmed" });
    await createCapacityCommitment(reservationId, { partySize: 2 });

    const assignRes = await post(sharedAgent, `/reservations/${reservationId}/seating`).send({
      commandId: "complete-http-assign-cmd-1",
      resources: [{ tableId: "sushi-table-3" }],
    });
    expect(assignRes.status).toBe(201);
    expect(assignRes.body.status).toBe("Seated");

    const completeRes = await post(sharedAgent, `/reservations/${reservationId}/complete`).send({
      commandId: "complete-http-cmd-1",
      isManualCompletion: true,
      manualCompletionReason: "guest departed",
    });
    // Same response contract as before this milestone: 204, no body.
    expect(completeRes.status).toBe(204);

    const assignment = await prisma.seatingAssignment.findUniqueOrThrow({ where: { id: assignRes.body.assignmentId } });
    expect(assignment.status).toBe("Released");
    expect(assignment.releaseReason).toBe("Completed");
    expect(assignment.releasedBy).toBe("staff-owner-seating-no-show-test");
    expect(assignment.releasedAt).not.toBeNull();

    const resourceLink = await prisma.seatingAssignmentResource.findFirstOrThrow({ where: { assignmentId: assignRes.body.assignmentId } });
    expect(resourceLink.status).toBe("Released");

    const reservation = await prisma.reservation.findUniqueOrThrow({ where: { id: reservationId } });
    expect(reservation.status).toBe("Completed");

    // The now-freed table is claimable again by a brand-new reservation at
    // the same time/table, proving the resource is genuinely available
    // again, not just marked Released in isolation.
    const nextReservationId = await createReservation({ preferredArea: "Sushi", partySize: 2, status: "Confirmed" });
    const nextAssignRes = await post(sharedAgent, `/reservations/${nextReservationId}/seating`).send({
      commandId: "complete-http-assign-cmd-2",
      resources: [{ tableId: "sushi-table-3" }],
    });
    expect(nextAssignRes.status).toBe(201);
  });

  it("completing a reservation with no active assignment returns 204 exactly as before (unaffected deployment/behavior)", async () => {
    const reservationId = await createReservation({ preferredArea: "Sushi", partySize: 2, status: "Confirmed" });

    const completeRes = await post(sharedAgent, `/reservations/${reservationId}/complete`).send({
      commandId: "complete-http-cmd-2",
      isManualCompletion: true,
      manualCompletionReason: "guest departed",
    });
    expect(completeRes.status).toBe(204);

    const reservation = await prisma.reservation.findUniqueOrThrow({ where: { id: reservationId } });
    expect(reservation.status).toBe("Completed");
  });

  it("an invalid completion (missing evidence) still returns 422 exactly as before, and does not release seating", async () => {
    const reservationId = await createReservation({ preferredArea: "Sushi", partySize: 2, status: "Confirmed" });

    const assignRes = await post(sharedAgent, `/reservations/${reservationId}/seating`).send({
      commandId: "complete-http-assign-cmd-3",
      resources: [{ tableId: "sushi-table-4" }],
    });
    expect(assignRes.status).toBe(201);

    const completeRes = await post(sharedAgent, `/reservations/${reservationId}/complete`).send({ commandId: "complete-http-cmd-3" });
    expect(completeRes.status).toBe(422);

    const assignment = await prisma.seatingAssignment.findUniqueOrThrow({ where: { id: assignRes.body.assignmentId } });
    expect(assignment.status).toBe("Seated");
    expect(assignment.releaseReason).toBeNull();
  });
});

describe("PATCH /availability/reservations/:id — R1.5-P1B: capacity-relevant modifications return 200 + seatingDisposition", () => {
  async function createAndAssignViaHttp(tableId: string, reservationDate = "2026-08-25T18:00:00.000Z") {
    const createRes = await post(sharedAgent, "/availability/reservations").send({
      commandId: `p1b-http-create-${tableId}-${Date.now()}`,
      servicePeriodId: "sp-1",
      contactSelection: { type: "ExistingContact", contactId: "contact-1" },
      reservationDate,
      partySize: 2,
      preferredArea: "Sushi",
      source: { category: "Telephone" },
    });
    expect(createRes.status).toBe(201);
    const reservationId = createRes.body.reservationId;

    const assignRes = await post(sharedAgent, `/reservations/${reservationId}/seating`).send({
      commandId: `p1b-http-assign-${tableId}-${Date.now()}`,
      resources: [{ tableId }],
    });
    expect(assignRes.status).toBe(201);
    return { reservationId, assignmentId: assignRes.body.assignmentId };
  }

  it("date/time change retaining the same table -> 200, seatingDisposition RETAINED", async () => {
    const { reservationId, assignmentId } = await createAndAssignViaHttp("sushi-table-5");

    const patched = await patchReq(sharedAgent, `/availability/reservations/${reservationId}`).send({
      commandId: "p1b-http-modify-retained-1",
      changes: { reservationDate: "2026-08-25T20:00:00.000Z" },
      isServicePeriodStillValid: true,
    });
    expect(patched.status).toBe(200);
    expect(patched.body).toEqual({ type: "MODIFIED", seatingDisposition: "RETAINED" });

    const oldRow = await prisma.seatingAssignment.findUniqueOrThrow({ where: { id: assignmentId } });
    expect(oldRow.status).toBe("Released");
    expect(oldRow.releaseReason).toBe("StaffReassigned");
    const active = await prisma.seatingAssignment.findFirstOrThrow({ where: { reservationId, status: { in: ["Assigned", "Seated"] } } });
    expect(active.id).not.toBe(assignmentId);
  });

  it("preferred-area change -> 200, seatingDisposition RELEASED", async () => {
    const { reservationId } = await createAndAssignViaHttp("sushi-table-6");

    const patched = await patchReq(sharedAgent, `/availability/reservations/${reservationId}`).send({
      commandId: "p1b-http-modify-released-1",
      changes: { preferredArea: "Teppanyaki" },
    });
    expect(patched.status).toBe(200);
    expect(patched.body).toEqual({ type: "MODIFIED", seatingDisposition: "RELEASED" });

    const active = await prisma.seatingAssignment.findFirst({ where: { reservationId, status: { in: ["Assigned", "Seated"] } } });
    expect(active).toBeNull();
  });

  it("party-size change within held capacity, interval/area unchanged -> 200, seatingDisposition UNCHANGED", async () => {
    const { reservationId, assignmentId } = await createAndAssignViaHttp("sushi-table-8");

    const patched = await patchReq(sharedAgent, `/availability/reservations/${reservationId}`).send({
      commandId: "p1b-http-modify-unchanged-1",
      changes: { partySize: 3 },
    });
    expect(patched.status).toBe(200);
    expect(patched.body).toEqual({ type: "MODIFIED", seatingDisposition: "UNCHANGED" });

    const stillActive = await prisma.seatingAssignment.findUniqueOrThrow({ where: { id: assignmentId } });
    expect(stillActive.status).toBe("Seated"); // POST /reservations/:id/seating in this file seats immediately
    expect(stillActive.releaseReason).toBeNull();
  });

  it("a non-capacity-relevant edit on the SAME reservation keeps the exact prior 204-no-body contract", async () => {
    const { reservationId } = await createAndAssignViaHttp("sushi-table-9");

    const patched = await patchReq(sharedAgent, `/availability/reservations/${reservationId}`).send({
      commandId: "p1b-http-modify-noncapacity-1",
      changes: { notes: "unaffected by R1.5-P1B" },
    });
    expect(patched.status).toBe(204);
    expect(patched.body).toEqual({});
  });
});
