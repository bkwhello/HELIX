import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";
import { Express, Request, Response } from "express";
import { createApp } from "../../api/app.js";
import { resetDatabase } from "../integration/support/testHarness.js";
import {
  createTestPrismaClient,
  truncateStaffDomainTables,
  truncateSeatingDomainTables,
  truncateCommunicationDomainTables,
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
import { PrismaCommunicationOutboxRepository } from "../../infrastructure/persistence/PrismaCommunicationOutboxRepository.js";
import { PrismaGuestManagementCredentialRepository } from "../../infrastructure/persistence/PrismaGuestManagementCredentialRepository.js";
import { ServicePeriodService } from "../../application/availability/ServicePeriodService.js";
import { PrismaServicePeriodOverrideStore } from "../../infrastructure/persistence/PrismaServicePeriodOverrideStore.js";
import { CSRF_HEADER_NAME, requirePermission, StaffPrincipal } from "../../api/authMiddleware.js";
import { Permission } from "../../domain/rules/StaffAuthorizationPolicy.js";
import { ActorRole } from "../../domain/value-objects/Actor.js";

/**
 * P1-B2 — HTTP-level coverage for POST /availability/reservations/walk-in
 * (a guest physically present NOW, being registered NOW — never a
 * Walk-in booking for later, which stays the ordinary
 * /availability/reservations route, untouched by this file). Mirrors
 * tests/api/reservations.test.ts's real-auth/real-CSRF/real-PostgreSQL
 * posture, tests/api/seating-runtime-wiring.test.ts's floor wiring, and
 * tests/api/communications.test.ts's communications wiring, combined —
 * this route is the first to require all three at once.
 *
 * Saturday 2026-08-15 (Europe/Amsterdam, CEST/UTC+2) is used throughout:
 * the real Sat 12:00-21:00 ServicePeriod window (domain/availability/
 * ServicePeriod.ts's DEFAULT_WEEKLY_SCHEDULE), confirmed a Saturday by
 * tests/api/reservations.test.ts's own FUTURE_DATE comment.
 */
const SATURDAY_1837_LOCAL = new Date("2026-08-15T16:37:00Z"); // 18:37 Europe/Amsterdam — deliberately NOT 15-minute-grid-aligned.
const MONDAY_1000_LOCAL = new Date("2026-08-17T08:00:00Z"); // 10:00 Europe/Amsterdam — before Monday's 17:00 open (OUTSIDE_SERVICE_PERIOD, not CLOSED).
const GRID_SATURDAY_1900_LOCAL = new Date("2026-08-15T17:00:00Z"); // 19:00 Europe/Amsterdam — an ordinary, grid-aligned advance booking.

class FixedClock {
  constructor(private readonly value: Date) {}
  now(): Date {
    return this.value;
  }
}
/** Proves the CAP-D01.01-R11 race is closed: each call returns a strictly LATER instant, simulating real wall-clock advancement between two independent clock.now() reads. */
class AdvancingClock {
  private calls = 0;
  constructor(private readonly baseMs: number) {}
  now(): Date {
    this.calls += 1;
    return new Date(this.baseMs + this.calls * 1000);
  }
}
let idCounter = 0;
class SequentialIdGenerator {
  generate(): string {
    idCounter += 1;
    return `walkin-${idCounter}`;
  }
}
let eventIdCounter = 0;
class SequentialEventIdGenerator {
  generate(): string {
    eventIdCounter += 1;
    return `walkin-evt-${eventIdCounter}`;
  }
}

const prisma = createTestPrismaClient();
const OWNER_USERNAME = "owner-walkin-test";
const OWNER_PASSWORD = "SuperSecret123!";
let sharedApp: Express;
let sharedAgent: ReturnType<typeof request.agent>;

function buildApp(clock: { now(): Date }) {
  const repository = new PrismaReservationRepository(prisma);
  const closingDayStore = new PrismaClosingDayStore(prisma);
  const app = createApp({
    repository,
    duplicateChecker: new PrismaDuplicateReservationChecker(prisma),
    contactRepository: new PrismaContactRepository(prisma),
    transactionManager: new PrismaTransactionManager(prisma),
    servicePeriodReader: new UnvalidatedServicePeriodReader(),
    closingDayStore,
    idGenerator: new SequentialIdGenerator(),
    eventIdGenerator: new SequentialEventIdGenerator(),
    clock,
    capacity: {
      capacityRepository: new PrismaCapacityRepository(prisma),
      transactionManager: new PrismaTransactionManager(prisma),
      servicePeriodService: new ServicePeriodService(closingDayStore, new PrismaServicePeriodOverrideStore(prisma)),
    },
    // P1-B1 wiring, required for createImmediateWalkIn's own seating half.
    floor: {
      floorRepository: new PrismaFloorRepository(prisma),
      prisma,
    },
    // R1.6-B — wired so "no confirmation enqueued" is a genuine assertion
    // about CommunicationOutboxService's own eligibility gate, not merely
    // "the service was never constructed at all".
    communications: {
      outboxRepository: new PrismaCommunicationOutboxRepository(prisma),
      credentialRepository: new PrismaGuestManagementCredentialRepository(prisma),
      tokenGenerator: new RandomSessionTokenGenerator(),
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

function walkInBody(overrides: Record<string, unknown> = {}) {
  return {
    commandId: "walkin-cmd-1",
    contactSelection: { displayName: "Walk-in Guest" },
    partySize: 2,
    preferredArea: "Sushi",
    ...overrides,
  };
}

beforeAll(async () => {
  await resetDatabase(prisma);
  await truncateStaffDomainTables(prisma);
  await truncateSeatingDomainTables(prisma);
  await truncateCommunicationDomainTables(prisma);
  await seedFloor(process.env["TEST_DATABASE_URL"]!);

  const built = buildApp(new FixedClock(SATURDAY_1837_LOCAL));
  sharedApp = built.app;

  const passwordHasher = new ScryptPasswordHasher();
  const staffUserRepository = new PrismaStaffUserRepository(prisma);
  await staffUserRepository.create({
    id: "staff-owner-walkin-test",
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
  // Seating tables/seats are the seeded, authoritative floor configuration
  // (ops/floor/seedFloor.ts) — deliberately never truncated between tests,
  // same posture as tests/integration/floor-seating.test.ts. Seating
  // ASSIGNMENTS must be truncated before reservations (FK), staff/session
  // tables are deliberately left alone so sharedAgent's session stays valid.
  await truncateSeatingDomainTables(prisma);
  await resetDatabase(prisma);
  await truncateCommunicationDomainTables(prisma);
});

describe("POST /availability/reservations/walk-in — authentication and authorization", () => {
  it("authenticated + authorized immediate Walk-in succeeds (201)", async () => {
    const res = await post(sharedAgent, "/availability/reservations/walk-in").send(walkInBody({ commandId: "authz-ok" }));
    expect(res.status).toBe(201);
    expect(res.body.reservationId).toBeDefined();
  });

  it("missing authentication → 401", async () => {
    const res = await post(request.agent(sharedApp), "/availability/reservations/walk-in").send(walkInBody({ commandId: "authz-401" }));
    expect(res.status).toBe(401);
  });

  it(
    "a role absent from the permission matrix gets 403, not next() — proves the exact enforcement mechanism the route is mounted behind. " +
      "Every currently-defined ActorRole already includes reservation.walkin.create (StaffAuthorizationPolicy.ts's owner-approved matrix), so " +
      "no real staff role can demonstrate a 403 end-to-end today; this calls requirePermission(Permission.ReservationWalkinCreate) — the SAME " +
      "middleware instance api/app.ts mounts on this route — directly, with a role that has no matrix entry at all, exercising hasPermission's " +
      "own `?? false` fallback branch.",
    () => {
      const middleware = requirePermission(Permission.ReservationWalkinCreate);
      const principal: StaffPrincipal = { staffUserId: "x", role: "NoSuchRole" as unknown as ActorRole, displayName: "x" };
      const req = { staffPrincipal: principal } as unknown as Request;
      let statusCode: number | undefined;
      let jsonBody: unknown;
      const res = {
        status(code: number) {
          statusCode = code;
          return this;
        },
        json(payload: unknown) {
          jsonBody = payload;
          return this;
        },
      } as unknown as Response;
      let nextCalled = false;
      middleware(req, res, () => {
        nextCalled = true;
      });
      expect(statusCode).toBe(403);
      expect(nextCalled).toBe(false);
      expect(jsonBody).toEqual({ message: "You do not have permission to perform this action." });
    }
  );
});

describe("POST /availability/reservations/walk-in — narrow contact rule", () => {
  it("name-only immediate Walk-in is accepted (no phone, no email)", async () => {
    const res = await post(sharedAgent, "/availability/reservations/walk-in").send(
      walkInBody({ commandId: "name-only-walkin", contactSelection: { displayName: "Name Only Guest" } })
    );
    expect(res.status).toBe(201);
  });

  it("an ordinary (non-Walk-in) name-only reservation remains rejected — CAP-D05.01-R01, unchanged path", async () => {
    await prisma.contact.deleteMany();
    const res = await post(sharedAgent, "/availability/reservations").send({
      commandId: "ordinary-name-only",
      servicePeriodId: "sp-1",
      contactSelection: { type: "CreateNewContact", displayName: "Name Only Guest" },
      reservationDate: GRID_SATURDAY_1900_LOCAL.toISOString(),
      partySize: 2,
      source: { category: "Telephone" },
      preferredArea: "Sushi",
    });
    expect(res.status).toBe(422);
    expect(res.body.violations.some((v: { ruleId: string }) => v.ruleId === "CAP-D05.01-R01")).toBe(true);
  });
});

describe("POST /availability/reservations/walk-in — the server, not the client, establishes Walk-in semantics", () => {
  it("client cannot supply a future reservationDate — server uses its own captured commandNow instead", async () => {
    const farFuture = new Date("2030-01-01T12:00:00Z");
    const res = await post(sharedAgent, "/availability/reservations/walk-in").send(
      walkInBody({ commandId: "cannot-set-date", reservationDate: farFuture.toISOString() })
    );
    expect(res.status).toBe(201);
    const stored = await prisma.reservation.findUniqueOrThrow({ where: { id: res.body.reservationId } });
    expect(stored.reservationDate.getTime()).toBe(SATURDAY_1837_LOCAL.getTime());
  });

  it("client cannot supply sourceCategory — server always stores Walk-in", async () => {
    const res = await post(sharedAgent, "/availability/reservations/walk-in").send(
      walkInBody({ commandId: "cannot-set-source", source: { category: "Telephone" } })
    );
    expect(res.status).toBe(201);
    const stored = await prisma.reservation.findUniqueOrThrow({ where: { id: res.body.reservationId } });
    expect(stored.sourceCategory).toBe("Walk-in");
  });

  it("client cannot supply an email — the created Contact has none", async () => {
    const res = await post(sharedAgent, "/availability/reservations/walk-in").send(
      walkInBody({ commandId: "cannot-set-email", contactSelection: { displayName: "No Email Guest", email: "guest@example.com" } })
    );
    expect(res.status).toBe(201);
    const stored = await prisma.reservation.findUniqueOrThrow({ where: { id: res.body.reservationId } });
    const contact = await prisma.contact.findUniqueOrThrow({ where: { id: stored.contactId } });
    expect(contact.emailRaw).toBeNull();
  });

  it("Reservation.arrivedAt remains untouched (null) — this operation never writes it", async () => {
    const res = await post(sharedAgent, "/availability/reservations/walk-in").send(walkInBody({ commandId: "arrivedat-untouched" }));
    expect(res.status).toBe(201);
    const stored = await prisma.reservation.findUniqueOrThrow({ where: { id: res.body.reservationId } });
    expect(stored.arrivedAt).toBeNull();
  });
});

describe("POST /availability/reservations/walk-in — ServicePeriod: open-only, no grid", () => {
  it("an arbitrary current minute (18:37) succeeds when inside the open ServicePeriod window", async () => {
    const res = await post(sharedAgent, "/availability/reservations/walk-in").send(walkInBody({ commandId: "grid-1837" }));
    expect(res.status).toBe(201);
    const stored = await prisma.reservation.findUniqueOrThrow({ where: { id: res.body.reservationId } });
    expect(stored.reservationDate.getTime()).toBe(SATURDAY_1837_LOCAL.getTime());
  });

  it("outside the active ServicePeriod window rejects (422 SERVICE_PERIOD_REJECTED)", async () => {
    // Reuses the SAME already-seeded owner credentials via a second app
    // instance pointed at the identical shared PostgreSQL database — only
    // ONE StaffUser may hold the Owner role (a partial-unique-index
    // invariant, see StaffUser's schema comment), so a second Owner row
    // cannot be created here; logging in against a different `app`
    // instance works because staff_users/staff_sessions live in the DB,
    // not in the Express app object.
    const { app } = buildApp(new FixedClock(MONDAY_1000_LOCAL));
    const agent = request.agent(app);
    const login = await post(agent, "/auth/login").send({ username: OWNER_USERNAME, password: OWNER_PASSWORD });
    expect(login.status).toBe(200);

    const res = await post(agent, "/availability/reservations/walk-in").send(walkInBody({ commandId: "outside-sp" }));
    expect(res.status).toBe(422);
    expect(res.body.servicePeriod.type).toBe("OUTSIDE_SERVICE_PERIOD");
  });
});

describe("POST /availability/reservations/walk-in — CAP-D01.01-R11 race", () => {
  it("the same captured commandNow is used for both reservationDate and the R11 check — no false rejection despite an advancing clock", async () => {
    // Same shared-DB reuse as the "outside ServicePeriod" test above — see
    // its comment on why a second Owner StaffUser cannot be created.
    const { app } = buildApp(new AdvancingClock(SATURDAY_1837_LOCAL.getTime()));
    const agent = request.agent(app);
    const login = await post(agent, "/auth/login").send({ username: OWNER_USERNAME, password: OWNER_PASSWORD });
    expect(login.status).toBe(200);

    const res = await post(agent, "/availability/reservations/walk-in").send(walkInBody({ commandId: "race-cmd" }));
    expect(res.status).toBe(201);

    const stored = await prisma.reservation.findUniqueOrThrow({ where: { id: res.body.reservationId } });
    const commitment = await prisma.capacityCommitment.findFirstOrThrow({ where: { reservationId: res.body.reservationId } });
    expect(commitment.startTime.getTime()).toBe(stored.reservationDate.getTime());
  });
});

describe("POST /availability/reservations/walk-in — capacity", () => {
  it("the capacity commitment starts at exactly commandNow", async () => {
    const res = await post(sharedAgent, "/availability/reservations/walk-in").send(walkInBody({ commandId: "commitment-start" }));
    expect(res.status).toBe(201);
    const commitment = await prisma.capacityCommitment.findFirstOrThrow({ where: { reservationId: res.body.reservationId } });
    expect(commitment.startTime.getTime()).toBe(SATURDAY_1837_LOCAL.getTime());
  });

  it("a mixed grid-aligned advance booking + non-grid immediate Walk-in cannot together permit overbooking", async () => {
    const grid = await post(sharedAgent, "/availability/reservations").send({
      commandId: "grid-heavy",
      servicePeriodId: "sp-1",
      contactSelection: { type: "CreateNewContact", displayName: "Grid Guest", phone: "0611111111" },
      reservationDate: GRID_SATURDAY_1900_LOCAL.toISOString(), // 19:00 local, overlaps 18:37+90min (until 20:07)
      partySize: 45,
      source: { category: "Telephone" },
      preferredArea: "Sushi",
    });
    expect(grid.status).toBe(201);

    // Sushi maximumCapacity is 51 (CapacityPool.ts). 45 + 10 = 55 > 51.
    const res = await post(sharedAgent, "/availability/reservations/walk-in").send(walkInBody({ commandId: "walkin-overbook", partySize: 10 }));
    expect(res.status).toBe(409);
    expect(res.body.availability.type).toBe("CAPACITY_EXHAUSTED");
  });
});

describe("POST /availability/reservations/walk-in — seating outcomes", () => {
  it("successful immediate seating produces Seated with a server-generated seatedAt", async () => {
    const table = await prisma.table.findFirstOrThrow({ where: { operationalLabel: "Table 1", areaId: "Sushi" } });
    const res = await post(sharedAgent, "/availability/reservations/walk-in").send(
      walkInBody({ commandId: "seat-success", resources: [{ tableId: table.id }] })
    );
    expect(res.status).toBe(201);
    expect(res.body.seating.status).toBe("Seated");
    expect(res.body.seating.seatedAt).toBeTruthy();

    const assignment = await prisma.seatingAssignment.findFirstOrThrow({ where: { reservationId: res.body.reservationId } });
    expect(assignment.status).toBe("Seated");
    expect(assignment.seatedAt).not.toBeNull();
  });

  it("inability to seat (no resources offered) returns CREATED_UNSEATED, while the Reservation and capacity remain valid — not rollback-worthy", async () => {
    const res = await post(sharedAgent, "/availability/reservations/walk-in").send(walkInBody({ commandId: "seat-fail", resources: [] }));
    expect(res.status).toBe(201);
    expect(res.body.seating.status).toBe("Unseated");

    const stored = await prisma.reservation.findUniqueOrThrow({ where: { id: res.body.reservationId } });
    expect(stored.status).toBe("Proposed");
    const commitment = await prisma.capacityCommitment.findFirst({ where: { reservationId: res.body.reservationId, status: "Committed" } });
    expect(commitment).not.toBeNull();
    const assignment = await prisma.seatingAssignment.findFirst({ where: { reservationId: res.body.reservationId } });
    expect(assignment).toBeNull();
  });
});

describe("POST /availability/reservations/walk-in — idempotency / retry", () => {
  it("a retry with the same commandId after CREATED_UNSEATED does not duplicate the Reservation or CapacityCommitment", async () => {
    const first = await post(sharedAgent, "/availability/reservations/walk-in").send(walkInBody({ commandId: "retry-cmd", resources: [] }));
    expect(first.status).toBe(201);
    expect(first.body.seating.status).toBe("Unseated");

    const second = await post(sharedAgent, "/availability/reservations/walk-in").send(walkInBody({ commandId: "retry-cmd", resources: [] }));
    expect(second.status).toBe(201);
    expect(second.body.reservationId).toBe(first.body.reservationId);

    const reservations = await prisma.reservation.findMany({ where: { id: first.body.reservationId } });
    expect(reservations.length).toBe(1);
    const commitments = await prisma.capacityCommitment.findMany({ where: { reservationId: first.body.reservationId } });
    expect(commitments.length).toBe(1);
  });

  it("a retry with the same commandId that now CAN seat does not duplicate the SeatingAssignment either", async () => {
    const table = await prisma.table.findFirstOrThrow({ where: { operationalLabel: "Table 2", areaId: "Sushi" } });
    const first = await post(sharedAgent, "/availability/reservations/walk-in").send(walkInBody({ commandId: "retry-seat-cmd", resources: [] }));
    expect(first.status).toBe(201);
    expect(first.body.seating.status).toBe("Unseated");

    const second = await post(sharedAgent, "/availability/reservations/walk-in").send(
      walkInBody({ commandId: "retry-seat-cmd", resources: [{ tableId: table.id }] })
    );
    expect(second.status).toBe(201);
    // The commandId already resolved to a reservation on the first call;
    // the retry's own resources are a moot, unused input for the create
    // half (idempotent replay) — seating is re-attempted fresh since
    // nothing was written for it yet, and may legitimately now succeed.
    const assignments = await prisma.seatingAssignment.findMany({ where: { reservationId: first.body.reservationId } });
    expect(assignments.length).toBeLessThanOrEqual(1);
  });
});

describe("POST /availability/reservations/walk-in — communication", () => {
  it("no confirmation communication is enqueued (the endpoint accepts no email; existing eligibility logic short-circuits)", async () => {
    const res = await post(sharedAgent, "/availability/reservations/walk-in").send(walkInBody({ commandId: "no-comm" }));
    expect(res.status).toBe(201);
    const messages = await prisma.communicationMessage.findMany({ where: { reservationId: res.body.reservationId } });
    expect(messages.length).toBe(0);
  });
});
