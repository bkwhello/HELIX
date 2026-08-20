import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";
import { Express } from "express";
import { createApp } from "../../api/app.js";
import { resetDatabase } from "../integration/support/testHarness.js";
import { createTestPrismaClient, truncateStaffDomainTables, truncateCommunicationDomainTables } from "../integration/support/testDatabaseSafety.js";
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
import { PrismaCommunicationOutboxRepository } from "../../infrastructure/persistence/PrismaCommunicationOutboxRepository.js";
import { PrismaGuestManagementCredentialRepository } from "../../infrastructure/persistence/PrismaGuestManagementCredentialRepository.js";
import { CSRF_HEADER_NAME } from "../../api/authMiddleware.js";
import { ActorRole } from "../../domain/value-objects/Actor.js";

/**
 * Chief Engineer "R1.6-B Guest Communications Engine" assignment §22/§23/
 * §42 (S1-S7) — HTTP-level coverage for the staff confirmation-resend
 * endpoint: real authentication/authorization (R1.2, unmodified), real
 * CSRF (unmodified), real PostgreSQL. Mirrors tests/api/reservations.test.ts's
 * own established pattern exactly.
 */
const NOW = new Date("2026-08-10T10:00:00Z");
class FixedClock {
  now(): Date {
    return NOW;
  }
}
let idCounter = 0;
class SequentialIdGenerator {
  generate(): string {
    idCounter += 1;
    return `resend-res-${idCounter}`;
  }
}
let eventIdCounter = 0;
class SequentialEventIdGenerator {
  generate(): string {
    eventIdCounter += 1;
    return `resend-evt-${eventIdCounter}`;
  }
}

const prisma = createTestPrismaClient();
const OWNER_USERNAME = "owner-resend-test";
const OWNER_PASSWORD = "SuperSecret123!";
let sharedApp: Express;
let sharedAgent: ReturnType<typeof request.agent>;

function buildApp() {
  const repository = new PrismaReservationRepository(prisma);
  const app = createApp({
    repository,
    duplicateChecker: new PrismaDuplicateReservationChecker(prisma),
    contactRepository: new PrismaContactRepository(prisma),
    transactionManager: new PrismaTransactionManager(prisma),
    servicePeriodReader: new UnvalidatedServicePeriodReader(),
    closingDayStore: new PrismaClosingDayStore(prisma),
    idGenerator: new SequentialIdGenerator(),
    eventIdGenerator: new SequentialEventIdGenerator(),
    clock: new FixedClock(),
    // R1.6-B — mounts the resend route (AppDependencies.communications' own doc comment).
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

async function createReservationViaApi(contactSelection: Record<string, unknown>): Promise<{ id: string; status: number; body: Record<string, unknown> }> {
  idCounter += 1;
  const res = await post(sharedAgent, "/reservations").send({
    commandId: `resend-create-cmd-${idCounter}`,
    servicePeriodId: "sp-1",
    contactSelection,
    reservationDate: new Date("2026-08-20T18:00:00Z").toISOString(),
    partySize: 2,
    source: { category: "Telephone" },
  });
  return { id: res.body.reservationId as string, status: res.status, body: res.body };
}

beforeAll(async () => {
  await resetDatabase(prisma);
  await truncateStaffDomainTables(prisma);
  await truncateCommunicationDomainTables(prisma);
  const built = buildApp();
  sharedApp = built.app;

  const passwordHasher = new ScryptPasswordHasher();
  const staffUserRepository = new PrismaStaffUserRepository(prisma);
  await staffUserRepository.create({
    id: "staff-owner-resend-test",
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
  await truncateCommunicationDomainTables(prisma);
});

describe("S1 — authorized staff + usable email -> resend intent created", () => {
  it("returns 202 with a messageId and durably queues a new CommunicationMessage row", async () => {
    const created = await createReservationViaApi({ type: "CreateNewContact", displayName: "Resend Guest", email: "resend-s1@example.com" });
    expect(created.status).toBe(201);

    const res = await post(sharedAgent, `/reservations/${created.id}/communications/confirmation/resend`).send({});
    expect(res.status).toBe(202);
    expect(res.body.status).toBe("queued");
    expect(res.body.messageId).toBeTruthy();

    const messages = await prisma.communicationMessage.findMany({ where: { reservationId: created.id } });
    // One from creation itself + one from this explicit resend.
    expect(messages.filter((m) => m.communicationType === "RESERVATION_CONFIRMATION")).toHaveLength(2);
    const resendMessage = messages.find((m) => m.id === res.body.messageId);
    expect(resendMessage?.idempotencyKey).not.toBe(`${created.id}:confirmation`); // distinct from the original one-shot key
  });
});

describe("S2 — phone-only Reservation -> safe validation outcome, Reservation unchanged", () => {
  it("returns 422 without touching the Reservation", async () => {
    const created = await createReservationViaApi({ type: "CreateNewContact", displayName: "Phone Only Guest", phone: "0699999999" });
    expect(created.status).toBe(201);

    const before = await prisma.reservation.findUniqueOrThrow({ where: { id: created.id } });
    const res = await post(sharedAgent, `/reservations/${created.id}/communications/confirmation/resend`).send({});
    expect(res.status).toBe(422);

    const after = await prisma.reservation.findUniqueOrThrow({ where: { id: created.id } });
    expect(after.version).toBe(before.version);
    expect(after.status).toBe(before.status);
    const messages = await prisma.communicationMessage.findMany({ where: { reservationId: created.id } });
    expect(messages).toHaveLength(0); // no confirmation was ever eligible, resend attempted none either
  });
});

describe("S3 — unauthenticated -> rejected", () => {
  it("401 with no session at all", async () => {
    const res = await post(request.agent(sharedApp), "/reservations/some-id/communications/confirmation/resend").send({});
    expect(res.status).toBe(401);
  });
});

describe("S5 — spoofed x-actor headers carry no authority", () => {
  it("a request with plausible-looking x-actor-* headers but no real session is still 401", async () => {
    const res = await post(request.agent(sharedApp), "/reservations/some-id/communications/confirmation/resend")
      .set("x-actor-id", "owner-1")
      .set("x-actor-role", "Owner")
      .set("x-actor-kind", "AuthorizedUser")
      .send({});
    expect(res.status).toBe(401);
  });
});

describe("S6 — CSRF regression", () => {
  it("rejects a resend request missing the CSRF header even with a valid session — 403", async () => {
    const created = await createReservationViaApi({ type: "CreateNewContact", displayName: "CSRF Guest", email: "csrf@example.com" });
    const res = await sharedAgent.post(`/reservations/${created.id}/communications/confirmation/resend`).send({});
    expect(res.status).toBe(403);
  });
});

describe("S7 — resend does not alter Reservation business state", () => {
  it("version and status are unchanged, and no new ReservationEvent is recorded", async () => {
    const created = await createReservationViaApi({ type: "CreateNewContact", displayName: "State Guest", email: "state@example.com" });
    const before = await prisma.reservation.findUniqueOrThrow({ where: { id: created.id } });
    const eventsBefore = await prisma.reservationEvent.count({ where: { reservationId: created.id } });

    await post(sharedAgent, `/reservations/${created.id}/communications/confirmation/resend`).send({});

    const after = await prisma.reservation.findUniqueOrThrow({ where: { id: created.id } });
    expect(after.version).toBe(before.version);
    expect(after.status).toBe(before.status);
    const eventsAfter = await prisma.reservationEvent.count({ where: { reservationId: created.id } });
    expect(eventsAfter).toBe(eventsBefore); // resend is not a Reservation-domain event
  });
});

describe("Unknown reservation", () => {
  it("returns 404 rather than a generic 500 or a misleading 422", async () => {
    const res = await post(sharedAgent, "/reservations/does-not-exist/communications/confirmation/resend").send({});
    expect(res.status).toBe(404);
  });
});
