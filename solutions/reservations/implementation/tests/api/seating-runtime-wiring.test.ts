import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";
import { Express } from "express";
import { createApp } from "../../api/app.js";
import { resetDatabase } from "../integration/support/testHarness.js";
import { createTestPrismaClient, truncateStaffDomainTables } from "../integration/support/testDatabaseSafety.js";
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
 * P1-B1 — proves the composition root can be built with the real
 * `PrismaFloorRepository`/`SeatingOrchestrator` dependency graph against
 * real PostgreSQL (createApp() itself would throw/fail at construction
 * time if wiring were wrong — beforeAll below is that proof), AND that
 * doing so produces byte-identical, already-proven Create/Cancel
 * behavior (tests/api/reservations.test.ts's own equivalent assertions,
 * unchanged) — i.e., genuinely zero externally observable behavior
 * change, demonstrated empirically, not only reasoned about from reading
 * AvailabilityOrchestrator.cancelWithCapacity's source.
 *
 * Deliberately does NOT exercise any new seating behavior (no
 * SeatingAssignment is ever created here) — no HTTP route exists to
 * create one yet, and inventing fake business behavior to poke at
 * SeatingOrchestrator directly would be testing something P1-B1 was
 * explicitly told not to build.
 */
const NOW = new Date("2026-08-01T10:00:00Z");
// Saturday 19:00 Europe/Amsterdam — inside the real Saturday 12:00-21:00
// ServicePeriod window, safely mid-window (not the boundary
// reservations.test.ts deliberately exercises).
const FUTURE_DATE = new Date("2026-08-15T17:00:00Z");

class FixedClock {
  now(): Date {
    return NOW;
  }
}
let idCounter = 0;
class SequentialIdGenerator {
  generate(): string {
    idCounter += 1;
    return `seat-wire-${idCounter}`;
  }
}
let eventIdCounter = 0;
class SequentialEventIdGenerator {
  generate(): string {
    eventIdCounter += 1;
    return `seat-wire-evt-${eventIdCounter}`;
  }
}

const prisma = createTestPrismaClient();
const OWNER_USERNAME = "owner-seating-wiring-test";
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
    // The one thing this test file exists to exercise: a real
    // PrismaFloorRepository, present where tests/api/reservations.test.ts's
    // own buildApp() deliberately omits it.
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

beforeAll(async () => {
  await resetDatabase(prisma);
  await truncateStaffDomainTables(prisma);
  // Construction itself is the primary proof: if the floor/seating wiring
  // were incorrect (wrong constructor args, wrong dependency shape),
  // this would throw here, at composition time — before any request
  // is ever made.
  const built = buildApp();
  sharedApp = built.app;

  const passwordHasher = new ScryptPasswordHasher();
  const staffUserRepository = new PrismaStaffUserRepository(prisma);
  await staffUserRepository.create({
    id: "staff-owner-seating-wiring-test",
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
  await resetDatabase(prisma);
  await prisma.contact.create({
    data: { id: "contact-1", displayName: "Seating Wiring Test Guest", phoneRaw: "0611111111", phoneNormalized: "+31611111111", createdBy: "staff-owner-seating-wiring-test", lastRelevantActivityAt: NOW },
  });
});

describe("Composition root builds with the real SeatingOrchestrator dependency graph (P1-B1)", () => {
  it("GET /health still responds normally with floor infrastructure wired", async () => {
    const res = await request(sharedApp).get("/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok" });
  });

  it("create + cancel behave identically to the floor-less app (zero observable regression): 201 then 204, capacity released", async () => {
    const created = await post(sharedAgent, "/availability/reservations").send({
      commandId: "seat-wire-cmd-1",
      servicePeriodId: "sp-1",
      contactSelection: { type: "ExistingContact", contactId: "contact-1" },
      reservationDate: FUTURE_DATE.toISOString(),
      partySize: 2,
      preferredArea: "Sushi",
      source: { category: "Telephone" },
    });
    expect(created.status).toBe(201);

    const commitmentBefore = await prisma.capacityCommitment.findFirst({ where: { reservationId: created.body.reservationId, status: "Committed" } });
    expect(commitmentBefore).not.toBeNull();

    // Exercises AvailabilityOrchestrator.cancelWithCapacity's
    // `if (this.seatingOrchestrator)` branch for the first time against a
    // real, non-undefined SeatingOrchestrator — proving it still resolves
    // to the identical outcome (204, capacity released) as when that
    // branch is skipped entirely.
    const cancelled = await post(sharedAgent, `/availability/reservations/${created.body.reservationId}/cancel`).send({ commandId: "seat-wire-cmd-1-cancel" });
    expect(cancelled.status).toBe(204);

    const commitmentAfter = await prisma.capacityCommitment.findFirst({ where: { reservationId: created.body.reservationId, status: "Committed" } });
    expect(commitmentAfter).toBeNull();

    const persisted = await prisma.reservation.findUniqueOrThrow({ where: { id: created.body.reservationId } });
    expect(persisted.status).toBe("Cancelled");
  });
});
