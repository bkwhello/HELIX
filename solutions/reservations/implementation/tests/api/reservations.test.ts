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
import { ServicePeriodService } from "../../application/availability/ServicePeriodService.js";
import { PrismaServicePeriodOverrideStore } from "../../infrastructure/persistence/PrismaServicePeriodOverrideStore.js";
import { CSRF_HEADER_NAME } from "../../api/authMiddleware.js";
import { ActorRole } from "../../domain/value-objects/Actor.js";

/**
 * HTTP-level coverage for the reservation endpoints — the actual surface
 * staff or a POS integration will call during a pilot. Everything below
 * this layer already has unit coverage; this exists because that alone
 * never proved the wiring (body parsing, status codes, error shapes,
 * and — since R1.2 — real authentication/authorization) works.
 *
 * R1.2 migration note: this file previously drove the app via
 * x-actor-* headers against an in-memory repository. Per
 * R1_2_IDENTITY_ACCESS_FINAL_ARCHITECTURE.md §22 Stage E, it now
 * authenticates through the real login flow (a seeded StaffUser, a real
 * POST /auth/login, a real session cookie via a supertest agent)
 * against real PostgreSQL — there is no test-only bypass in the
 * production route path.
 *
 * P0 retirement migration note (EC-002 reservations audit): this file
 * previously drove reservation creation/modification exclusively through
 * POST/PATCH /reservations, which never enforced capacity or real
 * ServicePeriod rules. Those routes are now retired (410 Gone — see the
 * dedicated "retired mutation routes" describe block below); every test
 * that exercises real reservation/application behavior has been migrated
 * to the authoritative /availability/reservations* endpoints instead,
 * which compose the exact same CreateReservationHandler/
 * ModifyReservationHandler this file always tested — domain-rule
 * assertions (violation ids, idempotency, closing-day rejection, etc.)
 * are expected to behave identically, since nothing in those handlers
 * changed. The one place behavior legitimately differs is `preferredArea`:
 * the authoritative create route requires it (a capacity-aware create
 * must know which pool to commit against) and validates it inline
 * (422, not the old route's 400) — see the dedicated tests below.
 */
const NOW = new Date("2026-08-01T10:00:00Z");
// Saturday 21:00 Europe/Amsterdam — the LAST valid, 15-minute-grid-aligned
// start time in the real Saturday 12:00-21:00 ServicePeriod window
// (domain/availability/ServicePeriod.ts's DEFAULT_WEEKLY_SCHEDULE; the
// eligibility check is `minute <= window.lastStartMinute`, confirmed
// inclusive by direct reading, not assumed) — deliberately exercised at
// this exact boundary rather than moved to a safer mid-window time,
// since this file's whole purpose is proving the real wiring works.
const FUTURE_DATE = new Date("2026-08-15T19:00:00Z");

class FixedClock {
  now(): Date {
    return NOW;
  }
}
let idCounter = 0;
class SequentialIdGenerator {
  generate(): string {
    idCounter += 1;
    return `res-${idCounter}`;
  }
}
let eventIdCounter = 0;
class SequentialEventIdGenerator {
  generate(): string {
    eventIdCounter += 1;
    return `evt-${eventIdCounter}`;
  }
}

const prisma = createTestPrismaClient();
const OWNER_USERNAME = "owner-test";
const OWNER_PASSWORD = "SuperSecret123!";
let sharedApp: Express;
let sharedAgent: ReturnType<typeof request.agent>;

// R1.4 P0: delegates to the centralized, fail-closed gate — see
// tests/integration/support/testDatabaseSafety.ts.
async function resetStaffTables(): Promise<void> {
  await truncateStaffDomainTables(prisma);
}

function buildApp() {
  const repository = new PrismaReservationRepository(prisma);
  const duplicateChecker = new PrismaDuplicateReservationChecker(prisma);
  const closingDayStore = new PrismaClosingDayStore(prisma);
  const app = createApp({
    repository,
    duplicateChecker,
    contactRepository: new PrismaContactRepository(prisma),
    transactionManager: new PrismaTransactionManager(prisma),
    servicePeriodReader: new UnvalidatedServicePeriodReader(),
    closingDayStore,
    idGenerator: new SequentialIdGenerator(),
    eventIdGenerator: new SequentialEventIdGenerator(),
    clock: new FixedClock(),
    // P0 retirement (EC-002 reservations audit) — required to mount
    // /availability/*, the sole authoritative mutation path this file
    // now exercises for real reservation/application behavior.
    capacity: {
      capacityRepository: new PrismaCapacityRepository(prisma),
      transactionManager: new PrismaTransactionManager(prisma),
      servicePeriodService: new ServicePeriodService(closingDayStore, new PrismaServicePeriodOverrideStore(prisma)),
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
  return { app, repository, duplicateChecker, closingDayStore };
}

function validBody(overrides: Record<string, unknown> = {}) {
  return {
    commandId: "http-cmd-1",
    servicePeriodId: "sp-1",
    contactSelection: { type: "ExistingContact", contactId: "contact-1" },
    reservationDate: FUTURE_DATE.toISOString(),
    partySize: 2,
    source: { category: "Telephone" },
    // P0 retirement — required by the authoritative create endpoint.
    // Individual tests override this where the scenario needs a
    // specific area or is deliberately testing preferredArea itself.
    preferredArea: "Sushi",
    ...overrides,
  };
}

// Thin wrappers so every mutating call automatically carries the CSRF
// header (api/authMiddleware.ts's createCsrfGuard requires it globally,
// including on unauthenticated calls) without repeating `.set(...)` at
// every call site.
function post(agent: ReturnType<typeof request.agent>, url: string) {
  return agent.post(url).set(CSRF_HEADER_NAME, "1");
}
function patchReq(agent: ReturnType<typeof request.agent>, url: string) {
  return agent.patch(url).set(CSRF_HEADER_NAME, "1");
}
function del(agent: ReturnType<typeof request.agent>, url: string) {
  return agent.delete(url).set(CSRF_HEADER_NAME, "1");
}

// P0 retirement — the one, shared way every test below creates its
// starting reservation, via the authoritative endpoint.
function create(agent: ReturnType<typeof request.agent>, overrides: Record<string, unknown> = {}) {
  return post(agent, "/availability/reservations").send(validBody(overrides));
}

beforeAll(async () => {
  await resetDatabase(prisma);
  await resetStaffTables();
  const built = buildApp();
  sharedApp = built.app;

  // Seed once — real scrypt hashing is deliberately slow; reusing one
  // logged-in session across this whole file (sessions persist for
  // hours by default, §9) is both realistic and keeps this suite fast.
  const passwordHasher = new ScryptPasswordHasher();
  const staffUserRepository = new PrismaStaffUserRepository(prisma);
  await staffUserRepository.create({
    id: "staff-owner-test",
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
  // Reservation-domain tables only — staff_users/staff_sessions are
  // deliberately NOT reset per-test, so sharedAgent's session stays valid.
  await resetDatabase(prisma);
  // CAP-D05.01 — validBody() references this Contact by id; resetDatabase
  // truncates the contacts table too, so it must be re-seeded every test.
  await prisma.contact.create({
    data: { id: "contact-1", displayName: "HTTP Test Guest", phoneRaw: "0611111111", phoneNormalized: "+31611111111", createdBy: "staff-owner-test", lastRelevantActivityAt: NOW },
  });
});

describe("GET /health", () => {
  it("responds 200 so a pilot deployment can be monitored (no auth required)", async () => {
    const res = await request(sharedApp).get("/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok" });
  });
});

describe("Authentication and authorization boundary", () => {
  it("rejects a mutating request with no session at all — 401", async () => {
    const res = await post(request.agent(sharedApp), "/availability/reservations").send(validBody());
    expect(res.status).toBe(401);
  });

  it("rejects a request whose session was never established, even with a plausible-looking cookie value — 401 (not the ex-header-trust default)", async () => {
    const res = await post(request.agent(sharedApp), "/availability/reservations").set("Cookie", "helix_session=not-a-real-token").send(validBody());
    expect(res.status).toBe(401);
  });

  it("rejects a mutating request missing the CSRF header even WITH a valid session — 403", async () => {
    const res = await sharedAgent.post("/availability/reservations").send(validBody({ commandId: "csrf-missing-header" }));
    expect(res.status).toBe(403);
  });

  it("rejects login itself when the CSRF header is missing — 403 (login CSRF is still CSRF)", async () => {
    const freshAgent = request.agent(sharedApp);
    const res = await freshAgent.post("/auth/login").send({ username: OWNER_USERNAME, password: OWNER_PASSWORD });
    expect(res.status).toBe(403);
  });

  it("gives an authenticated Reception-role session a 403, not a 401, when it lacks a permission (capacity.settings.manage)", async () => {
    const passwordHasher = new ScryptPasswordHasher();
    const staffUserRepository = new PrismaStaffUserRepository(prisma);
    await staffUserRepository.create({
      id: "staff-reception-test",
      username: "reception-test",
      displayName: "Test Reception",
      email: null,
      passwordHash: await passwordHasher.hash("ReceptionPass123!"),
      role: ActorRole.Reception,
    });
    const receptionAgent = request.agent(sharedApp);
    const login = await post(receptionAgent, "/auth/login").send({ username: "reception-test", password: "ReceptionPass123!" });
    expect(login.status).toBe(200);

    const res = await post(receptionAgent, "/closing-days").send({ fromDate: "2026-09-01" });
    expect(res.status).toBe(403);
  });
});

/**
 * P0 retirement (EC-002 reservations audit) — the three former plain
 * mutation routes. Auth/permission middleware stays attached (see
 * api/app.ts's retiredMutationRoute doc comment) so these prove the
 * intentional 410 contract specifically, not merely "some error".
 */
describe("Retired mutation routes — 410 Gone, no mutation possible", () => {
  it("POST /reservations returns 410 with the replacement endpoint, and creates nothing", async () => {
    const before = await prisma.reservation.count();

    const res = await post(sharedAgent, "/reservations").send(validBody({ commandId: "retired-create-1" }));

    expect(res.status).toBe(410);
    expect(res.body).toMatchObject({ replacement: { method: "POST", path: "/availability/reservations" } });
    expect(typeof res.body.message).toBe("string");

    const after = await prisma.reservation.count();
    expect(after).toBe(before);
  });

  it("PATCH /reservations/:id returns 410 and does not alter the reservation", async () => {
    const created = await create(sharedAgent, { commandId: "retired-modify-setup" });
    expect(created.status).toBe(201);
    const before = await prisma.reservation.findUniqueOrThrow({ where: { id: created.body.reservationId } });

    const res = await patchReq(sharedAgent, `/reservations/${created.body.reservationId}`).send({
      commandId: "retired-modify-1",
      changes: { notes: "should never be written" },
    });

    expect(res.status).toBe(410);
    expect(res.body).toMatchObject({ replacement: { method: "PATCH", path: "/availability/reservations/:id" } });

    const after = await prisma.reservation.findUniqueOrThrow({ where: { id: created.body.reservationId } });
    expect(after.version).toBe(before.version);
    expect(after.notes).toBe(before.notes);
  });

  it("POST /reservations/:id/cancel returns 410, does not cancel, and does not touch capacity accounting", async () => {
    const created = await create(sharedAgent, { commandId: "retired-cancel-setup" });
    expect(created.status).toBe(201);
    const commitmentBefore = await prisma.capacityCommitment.findFirst({ where: { reservationId: created.body.reservationId, status: "Committed" } });
    expect(commitmentBefore).not.toBeNull();

    const res = await post(sharedAgent, `/reservations/${created.body.reservationId}/cancel`).send({ commandId: "retired-cancel-1" });

    expect(res.status).toBe(410);
    expect(res.body).toMatchObject({ replacement: { method: "POST", path: "/availability/reservations/:id/cancel" } });

    const after = await prisma.reservation.findUniqueOrThrow({ where: { id: created.body.reservationId } });
    expect(after.status).not.toBe("Cancelled");
    const commitmentAfter = await prisma.capacityCommitment.findFirst({ where: { reservationId: created.body.reservationId, status: "Committed" } });
    expect(commitmentAfter).not.toBeNull();
  });
});

describe("POST /availability/reservations (authoritative create)", () => {
  it("creates a reservation and returns the outcome DTO", async () => {
    const res = await create(sharedAgent);

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ status: "Proposed", preferredArea: "Sushi" });
    expect(typeof res.body.reservationId).toBe("string");
  });

  it("rejects a request missing required information with 422", async () => {
    const res = await create(sharedAgent, { servicePeriodId: "" });

    expect(res.status).toBe(422);
    expect(res.body.violations.some((v: { ruleId: string }) => v.ruleId === "CAP-D01.01-R08")).toBe(true);
  });

  // CAP-D05.01 — contactSelection shape is validated at the API boundary
  // (parseContactSelection), identically on both the retired and
  // authoritative routes — a structurally missing/invalid contact
  // selection is a 400, not a 422.
  it("rejects a request with no contactSelection at all with 400", async () => {
    const res = await create(sharedAgent, { contactSelection: undefined });

    expect(res.status).toBe(400);
  });

  it("rejects a structurally invalid date with 422 (CAP-D01.01-R10)", async () => {
    const res = await create(sharedAgent, { reservationDate: "not-a-date" });

    expect(res.status).toBe(422);
    expect(res.body.violations.some((v: { ruleId: string }) => v.ruleId === "CAP-D01.01-R10")).toBe(true);
  });

  // CAP-D01.01-R14 (duplicate detection) against the REAL
  // PrismaDuplicateReservationChecker.
  it("surfaces a duplicate warning in the response instead of only in the persisted event", async () => {
    await create(sharedAgent, { commandId: "http-cmd-dup-original" });

    const res = await create(sharedAgent, { commandId: "http-cmd-dup" });

    expect(res.status).toBe(201);
    expect(res.body.warnings.some((w: { ruleId: string }) => w.ruleId === "CAP-D01.01-R14")).toBe(true);
  });

  it("accepts a guest name and a preferred area, returning both in the outcome", async () => {
    const res = await create(sharedAgent, {
      commandId: "http-cmd-area",
      contactSelection: { type: "CreateNewContact", displayName: "Jan Jansen", phone: "0600000001" },
      preferredArea: "Sushi",
    });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ contactName: "Jan Jansen", preferredArea: "Sushi" });
  });

  // P0 retirement — the authoritative create route legitimately differs
  // here: preferredArea is REQUIRED (a capacity-aware create must know
  // which pool to commit against) and validated inline, not via the
  // shared parsePreferredArea helper the retired route used — so this
  // is 422 with a distinct message shape, not the old route's 400.
  it("rejects an unrecognized preferredArea with 422 (capacity-aware create requires a real pool)", async () => {
    const res = await create(sharedAgent, { commandId: "http-cmd-bad-area", preferredArea: "Steakhouse" });

    expect(res.status).toBe(422);
    expect(res.body.message).toContain("Steakhouse");
  });

  it("rejects a missing preferredArea with 422 (required by the capacity-aware create, unlike the retired route)", async () => {
    const res = await create(sharedAgent, { commandId: "http-cmd-missing-area", preferredArea: undefined });

    expect(res.status).toBe(422);
    expect(res.body.message).toContain("preferredArea");
  });

  it("accepts notes (allergies, special requests) and returns them in the outcome and the list", async () => {
    const res = await create(sharedAgent, { commandId: "http-cmd-notes", notes: "Notenallergie, graag een rustige tafel" });

    expect(res.status).toBe(201);
    expect(res.body.notes).toBe("Notenallergie, graag een rustige tafel");

    const list = await sharedAgent.get(`/reservations?date=${FUTURE_DATE.toISOString().slice(0, 10)}`);
    expect(list.body.reservations[0]).toMatchObject({ notes: "Notenallergie, graag een rustige tafel" });
  });

  // P0 retirement — genuinely different (and legitimate) outcome shape on
  // the authoritative path: closing-day enforcement is no longer
  // CreateReservationHandler's own bespoke CAP-D01.01-R51 check (that
  // code path still exists but is no longer reachable from any live
  // route) — it's unified into ServicePeriodService's own three-way
  // eligibility outcome (VALID | OUTSIDE_SERVICE_PERIOD | CLOSED), which
  // itself composes ClosingDayStore internally (see ServicePeriodService's
  // own doc comment). Same real-world guarantee (a closed day cannot be
  // booked), different response shape — {servicePeriod: {type: "CLOSED"}},
  // not {violations: [...]}.
  it("rejects creation for a date marked closed, via the unified ServicePeriod authority", async () => {
    await post(sharedAgent, "/closing-days").send({ fromDate: FUTURE_DATE.toISOString().slice(0, 10), reason: "Personeelsuitje" });

    const res = await create(sharedAgent, { commandId: "http-cmd-closed" });

    expect(res.status).toBe(422);
    expect(res.body.servicePeriod).toEqual({ type: "CLOSED" });
  });

  it("is idempotent under a retried commandId: same reservationId, no duplicate created", async () => {
    const first = await create(sharedAgent, { commandId: "http-cmd-retry" });
    const second = await create(sharedAgent, { commandId: "http-cmd-retry" });

    expect(first.status).toBe(201);
    expect(second.status).toBe(201);
    expect(second.body.reservationId).toBe(first.body.reservationId);

    const rows = await prisma.reservation.findMany({ where: { id: first.body.reservationId } });
    expect(rows).toHaveLength(1);
  });

  it("commits real capacity for the created reservation (CAP-D02.03)", async () => {
    const res = await create(sharedAgent, { commandId: "http-cmd-capacity-commit" });
    expect(res.status).toBe(201);

    const commitment = await prisma.capacityCommitment.findFirst({ where: { reservationId: res.body.reservationId, status: "Committed" } });
    expect(commitment).not.toBeNull();
    expect(commitment?.capacityPoolId).toBe("Sushi");
  });

  // P0 retirement — the central claim of this whole increment, proven at
  // the actual HTTP boundary a real client hits, not only at the
  // orchestrator/domain layer (already covered by
  // tests/integration/availability-create.test.ts and others): a full
  // pool genuinely rejects the next overlapping request with 409, rather
  // than silently overbooking the way the now-retired plain route always
  // would have. Sushi's real capacity (CapacityPool.ts) is 51 — filled
  // exactly here with one party, then one more seat is requested for the
  // same exact start time.
  it("rejects a request that would exceed the real Sushi capacity (409 CAPACITY_UNAVAILABLE)", async () => {
    const fill = await create(sharedAgent, { commandId: "http-cmd-capacity-fill", partySize: 51, preferredArea: "Sushi" });
    expect(fill.status).toBe(201);

    const overflow = await create(sharedAgent, { commandId: "http-cmd-capacity-overflow", partySize: 1, preferredArea: "Sushi" });

    expect(overflow.status).toBe(409);
    expect(overflow.body.availability).toBeDefined();

    const rows = await prisma.reservation.findMany({ where: { partySize: 1, preferredArea: "Sushi" } });
    expect(rows).toHaveLength(0);
  });
});

describe("GET /reservations/:id", () => {
  it("returns the created reservation", async () => {
    const created = await create(sharedAgent, { commandId: "http-cmd-get" });

    const res = await sharedAgent.get(`/reservations/${created.body.reservationId}`);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id: created.body.reservationId, status: "Proposed", partySize: 2 });
  });

  it("returns 404 for an unknown reservation", async () => {
    const res = await sharedAgent.get("/reservations/does-not-exist");
    expect(res.status).toBe(404);
  });
});

/**
 * P1-A (staff lifecycle completion) — real HTTP/PostgreSQL proof for an
 * existing, already-correct implementation. Confirm has no capacity or
 * ServicePeriod effect (CAP-D01.01-R24: "enforced by omission" — the
 * aggregate has no seating/capacity fields to touch), so it correctly
 * stays a direct route through ConfirmReservationHandler, not
 * AvailabilityOrchestrator — nothing found during this work suggests
 * otherwise.
 */
describe("POST /reservations/:id/confirm", () => {
  it("confirms a Proposed reservation, persists the status, and records a ReservationConfirmed event with full audit metadata", async () => {
    const created = await create(sharedAgent, { commandId: "http-cmd-confirm" });
    expect(created.status).toBe(201);

    const res = await post(sharedAgent, `/reservations/${created.body.reservationId}/confirm`).send({ commandId: "http-cmd-confirm-1" });
    expect(res.status).toBe(204);

    const persisted = await prisma.reservation.findUniqueOrThrow({ where: { id: created.body.reservationId } });
    expect(persisted.status).toBe("Confirmed");

    const events = await prisma.reservationEvent.findMany({ where: { reservationId: created.body.reservationId, type: "ReservationConfirmed" } });
    expect(events).toHaveLength(1);
    const payload = JSON.parse(events[0]!.payload);
    expect(payload).toMatchObject({ type: "ReservationConfirmed", reservationId: created.body.reservationId, actor: { type: "AuthorizedUser" } });
    expect(typeof payload.eventId).toBe("string");
    expect(typeof payload.occurredAt).toBe("string");
    expect(typeof payload.correlationId).toBe("string");
  });

  it("rejects confirming a reservation that is not Proposed (CAP-D01.01-R22)", async () => {
    const created = await create(sharedAgent, { commandId: "http-cmd-confirm-invalid" });
    await post(sharedAgent, `/reservations/${created.body.reservationId}/confirm`).send({ commandId: "http-cmd-confirm-invalid-1" });

    // Already Confirmed — a genuinely new confirm attempt (distinct
    // commandId, not a retry) must be rejected, not silently re-applied.
    const res = await post(sharedAgent, `/reservations/${created.body.reservationId}/confirm`).send({ commandId: "http-cmd-confirm-invalid-2" });

    expect(res.status).toBe(422);
    expect(res.body.violations.some((v: { ruleId: string }) => v.ruleId === "CAP-D01.01-R22")).toBe(true);
  });

  it("is idempotent under a retried commandId: 204 both times, event recorded only once", async () => {
    const created = await create(sharedAgent, { commandId: "http-cmd-confirm-retry" });

    const first = await post(sharedAgent, `/reservations/${created.body.reservationId}/confirm`).send({ commandId: "http-cmd-confirm-retry-1" });
    const second = await post(sharedAgent, `/reservations/${created.body.reservationId}/confirm`).send({ commandId: "http-cmd-confirm-retry-1" });

    expect(first.status).toBe(204);
    expect(second.status).toBe(204);

    const events = await prisma.reservationEvent.findMany({ where: { reservationId: created.body.reservationId, type: "ReservationConfirmed" } });
    expect(events).toHaveLength(1);
  });

  it("rejects an unauthenticated request — 401", async () => {
    const created = await create(sharedAgent, { commandId: "http-cmd-confirm-auth" });
    const res = await post(request.agent(sharedApp), `/reservations/${created.body.reservationId}/confirm`).send({ commandId: "http-cmd-confirm-auth-1" });
    expect(res.status).toBe(401);
  });
});

/**
 * P1-A — same posture as Confirm: real HTTP/PostgreSQL proof for the
 * existing implementation, not a redesign. Completion touches no
 * capacity/ServicePeriod state either (CompletionRules.ts has no such
 * dependency), so it correctly stays direct through
 * CompleteReservationHandler.
 */
describe("POST /reservations/:id/complete", () => {
  async function confirmedReservation(commandId: string) {
    const created = await create(sharedAgent, { commandId });
    await post(sharedAgent, `/reservations/${created.body.reservationId}/confirm`).send({ commandId: `${commandId}-confirm` });
    return created.body.reservationId as string;
  }

  it("completes a Confirmed reservation via manual completion, persists the status, and records a ReservationCompleted event with full audit metadata", async () => {
    const reservationId = await confirmedReservation("http-cmd-complete");

    const res = await post(sharedAgent, `/reservations/${reservationId}/complete`).send({
      commandId: "http-cmd-complete-1",
      isManualCompletion: true,
      manualCompletionReason: "Gasten hebben afgerekend en zijn vertrokken.",
    });
    expect(res.status).toBe(204);

    const persisted = await prisma.reservation.findUniqueOrThrow({ where: { id: reservationId } });
    expect(persisted.status).toBe("Completed");

    const events = await prisma.reservationEvent.findMany({ where: { reservationId, type: "ReservationCompleted" } });
    expect(events).toHaveLength(1);
    const payload = JSON.parse(events[0]!.payload);
    expect(payload).toMatchObject({ type: "ReservationCompleted", reservationId, actor: { type: "AuthorizedUser" } });
    expect(typeof payload.eventId).toBe("string");
    expect(typeof payload.occurredAt).toBe("string");
    expect(typeof payload.correlationId).toBe("string");
  });

  // CAP-D01.01-R30 — Completion Requires Operational Evidence. The pilot
  // has no POS/service-close integration, so this proves the existing
  // rule rather than adding a new one: manual completion is accepted
  // only with an explicit reason; omitting both structured evidence and
  // isManualCompletion is rejected, not defaulted.
  it("rejects completion with no evidence and no manual-completion flag (CAP-D01.01-R30)", async () => {
    const reservationId = await confirmedReservation("http-cmd-complete-no-evidence");

    const res = await post(sharedAgent, `/reservations/${reservationId}/complete`).send({ commandId: "http-cmd-complete-no-evidence-1" });

    expect(res.status).toBe(422);
    expect(res.body.violations.some((v: { ruleId: string }) => v.ruleId === "CAP-D01.01-R30")).toBe(true);

    const persisted = await prisma.reservation.findUniqueOrThrow({ where: { id: reservationId } });
    expect(persisted.status).toBe("Confirmed");
  });

  it("rejects manual completion with an empty reason (CAP-D01.01-R30)", async () => {
    const reservationId = await confirmedReservation("http-cmd-complete-empty-reason");

    const res = await post(sharedAgent, `/reservations/${reservationId}/complete`).send({
      commandId: "http-cmd-complete-empty-reason-1",
      isManualCompletion: true,
      manualCompletionReason: "",
    });

    expect(res.status).toBe(422);
    expect(res.body.violations.some((v: { ruleId: string }) => v.ruleId === "CAP-D01.01-R30")).toBe(true);
  });

  it("rejects completing a Proposed reservation (CAP-D01.01-R29)", async () => {
    const created = await create(sharedAgent, { commandId: "http-cmd-complete-proposed" });

    const res = await post(sharedAgent, `/reservations/${created.body.reservationId}/complete`).send({
      commandId: "http-cmd-complete-proposed-1",
      isManualCompletion: true,
      manualCompletionReason: "Should be rejected — never confirmed.",
    });

    expect(res.status).toBe(422);
    expect(res.body.violations.some((v: { ruleId: string }) => v.ruleId === "CAP-D01.01-R29")).toBe(true);

    const persisted = await prisma.reservation.findUniqueOrThrow({ where: { id: created.body.reservationId } });
    expect(persisted.status).toBe("Proposed");
  });

  it("is idempotent under a retried commandId: 204 both times, event recorded only once", async () => {
    const reservationId = await confirmedReservation("http-cmd-complete-retry");

    const body = { commandId: "http-cmd-complete-retry-1", isManualCompletion: true, manualCompletionReason: "Afgerond, gasten vertrokken." };
    const first = await post(sharedAgent, `/reservations/${reservationId}/complete`).send(body);
    const second = await post(sharedAgent, `/reservations/${reservationId}/complete`).send(body);

    expect(first.status).toBe(204);
    expect(second.status).toBe(204);

    const events = await prisma.reservationEvent.findMany({ where: { reservationId, type: "ReservationCompleted" } });
    expect(events).toHaveLength(1);
  });

  it("rejects an unauthenticated request — 401", async () => {
    const reservationId = await confirmedReservation("http-cmd-complete-auth");
    const res = await post(request.agent(sharedApp), `/reservations/${reservationId}/complete`).send({ commandId: "http-cmd-complete-auth-1" });
    expect(res.status).toBe(401);
  });

  // Permission boundary specific to Complete: ReservationAgent and
  // Reception both intentionally lack reservation.complete
  // (StaffAuthorizationPolicy.ts's own ROLE_PERMISSIONS, citing
  // R1_2_IDENTITY_ACCESS_FINAL_ARCHITECTURE.md §18) — unlike Confirm,
  // which every role holds, so this is the one lifecycle-transition
  // route where a real role-based 403 (not just a no-session 401) is
  // meaningful to prove.
  it("gives a Reception-role session 403, not 401, on complete (role lacks reservation.complete)", async () => {
    const passwordHasher = new ScryptPasswordHasher();
    const staffUserRepository = new PrismaStaffUserRepository(prisma);
    await staffUserRepository.create({
      id: "staff-reception-complete-test",
      username: "reception-complete-test",
      displayName: "Test Reception Complete",
      email: null,
      passwordHash: await passwordHasher.hash("ReceptionPass123!"),
      role: ActorRole.Reception,
    });
    const receptionAgent = request.agent(sharedApp);
    const login = await post(receptionAgent, "/auth/login").send({ username: "reception-complete-test", password: "ReceptionPass123!" });
    expect(login.status).toBe(200);

    const reservationId = await confirmedReservation("http-cmd-complete-reception");
    const res = await post(receptionAgent, `/reservations/${reservationId}/complete`).send({
      commandId: "http-cmd-complete-reception-1",
      isManualCompletion: true,
      manualCompletionReason: "Should be forbidden regardless of a valid reason.",
    });
    expect(res.status).toBe(403);
  });
});

describe("PATCH /availability/reservations/:id — manual table assignment (CAP-D01.01-R48)", () => {
  it("sets and later changes the table assignment, reflected in GET", async () => {
    const created = await create(sharedAgent, { commandId: "http-cmd-table", preferredArea: "Teppanyaki" });
    expect(created.status).toBe(201);

    const setTable = await patchReq(sharedAgent, `/availability/reservations/${created.body.reservationId}`).send({
      commandId: "http-cmd-table-1",
      changes: { tableAssignment: "C1" },
    });
    expect(setTable.status).toBe(204);

    const afterSet = await sharedAgent.get(`/reservations/${created.body.reservationId}`);
    expect(afterSet.body.tableAssignment).toBe("C1");

    const changeTable = await patchReq(sharedAgent, `/availability/reservations/${created.body.reservationId}`).send({
      commandId: "http-cmd-table-2",
      changes: { tableAssignment: "D3" },
    });
    expect(changeTable.status).toBe(204);

    const afterChange = await sharedAgent.get(`/reservations/${created.body.reservationId}`);
    expect(afterChange.body.tableAssignment).toBe("D3");
  });
});

describe("PATCH /availability/reservations/:id — marking a reservation as arrived", () => {
  it("has no arrival mark on a freshly created reservation", async () => {
    const created = await create(sharedAgent, { commandId: "http-cmd-arrive-none" });
    const before = await sharedAgent.get(`/reservations/${created.body.reservationId}`);
    expect(before.body.arrivedAt).toBeUndefined();
  });

  it("marks a reservation as arrived, then clears the mark via an explicit null", async () => {
    const created = await create(sharedAgent, { commandId: "http-cmd-arrive" });

    const arrivedAt = new Date().toISOString();
    const marked = await patchReq(sharedAgent, `/availability/reservations/${created.body.reservationId}`).send({
      commandId: "http-cmd-arrive-1",
      changes: { arrivedAt },
    });
    expect(marked.status).toBe(204);

    const afterMark = await sharedAgent.get(`/reservations/${created.body.reservationId}`);
    expect(afterMark.body.arrivedAt).toBe(new Date(arrivedAt).toISOString());

    const cleared = await patchReq(sharedAgent, `/availability/reservations/${created.body.reservationId}`).send({
      commandId: "http-cmd-arrive-2",
      changes: { arrivedAt: null },
    });
    expect(cleared.status).toBe(204);

    const afterClear = await sharedAgent.get(`/reservations/${created.body.reservationId}`);
    expect(afterClear.body.arrivedAt).toBeUndefined();
  });
});

describe("PATCH /availability/reservations/:id — editing notes after creation (CAP-D01.01-R36/R37)", () => {
  it("adds a note to a reservation created without one, then corrects it", async () => {
    const created = await create(sharedAgent, { commandId: "http-cmd-notes-edit" });
    expect(created.body.notes).toBeUndefined();

    const addNote = await patchReq(sharedAgent, `/availability/reservations/${created.body.reservationId}`).send({
      commandId: "http-cmd-notes-edit-1",
      changes: { notes: "Op de rekening zetten" },
    });
    expect(addNote.status).toBe(204);

    const afterAdd = await sharedAgent.get(`/reservations/${created.body.reservationId}`);
    expect(afterAdd.body.notes).toBe("Op de rekening zetten");

    const correctNote = await patchReq(sharedAgent, `/availability/reservations/${created.body.reservationId}`).send({
      commandId: "http-cmd-notes-edit-2",
      changes: { notes: "Op de rekening zetten + glutenvrij" },
    });
    expect(correctNote.status).toBe(204);

    const afterCorrect = await sharedAgent.get(`/reservations/${created.body.reservationId}`);
    expect(afterCorrect.body.notes).toBe("Op de rekening zetten + glutenvrij");
  });
});

describe("PATCH /availability/reservations/:id — changing the preferred area after creation (CAP-D01.01-R48)", () => {
  it("switches Sushi to Teppanyaki, moving the real capacity commitment between pools", async () => {
    const created = await create(sharedAgent, { commandId: "http-cmd-area-edit", preferredArea: "Sushi" });
    expect(created.body.preferredArea).toBe("Sushi");

    const switched = await patchReq(sharedAgent, `/availability/reservations/${created.body.reservationId}`).send({
      commandId: "http-cmd-area-edit-1",
      changes: { preferredArea: "Teppanyaki" },
    });
    expect(switched.status).toBe(204);

    const after = await sharedAgent.get(`/reservations/${created.body.reservationId}`);
    expect(after.body.preferredArea).toBe("Teppanyaki");

    // P0 retirement addition — proving persisted capacity state, not just
    // the HTTP response: the commitment itself must have actually moved
    // pools, since preferredArea is capacity-relevant
    // (AvailabilityOrchestrator.modifyWithCapacity's own capacityRelevant
    // check routes this through full capacity re-checking, not the
    // lightweight non-capacity path).
    const commitment = await prisma.capacityCommitment.findFirst({ where: { reservationId: created.body.reservationId, status: "Committed" } });
    expect(commitment?.capacityPoolId).toBe("Teppanyaki");
  });

  // P0 retirement — the rejection-side counterpart to the switch test
  // above: a capacity-affecting modify must be refused, not silently
  // applied, when the destination pool has no room. Fills Teppanyaki
  // (real capacity 40) with one party at FUTURE_DATE, then attempts to
  // move a separate Sushi reservation into Teppanyaki at the exact same
  // time.
  it("refuses to switch preferredArea into a pool with no remaining capacity (409 CAPACITY_UNAVAILABLE)", async () => {
    await create(sharedAgent, { commandId: "http-cmd-area-edit-fill", partySize: 40, preferredArea: "Teppanyaki" });
    const created = await create(sharedAgent, { commandId: "http-cmd-area-edit-overflow", partySize: 1, preferredArea: "Sushi" });
    expect(created.status).toBe(201);

    const switched = await patchReq(sharedAgent, `/availability/reservations/${created.body.reservationId}`).send({
      commandId: "http-cmd-area-edit-overflow-1",
      changes: { preferredArea: "Teppanyaki" },
    });

    expect(switched.status).toBe(409);
    expect(switched.body.availability).toBeDefined();

    const after = await sharedAgent.get(`/reservations/${created.body.reservationId}`);
    expect(after.body.preferredArea).toBe("Sushi");
  });

  // Same status/message shape as the retired route here — unlike create,
  // PATCH /availability/reservations/:id reuses the shared
  // parsePreferredArea helper (400), not a bespoke required-field check.
  it("rejects an unrecognized preferredArea in changes with a clear 400", async () => {
    const created = await create(sharedAgent, { commandId: "http-cmd-area-bad-edit" });

    const res = await patchReq(sharedAgent, `/availability/reservations/${created.body.reservationId}`).send({
      commandId: "http-cmd-area-bad-edit-1",
      changes: { preferredArea: "Steakhouse" },
    });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain("Steakhouse");
  });
});

describe("PATCH /availability/reservations/:id — correcting the guest name and source (CAP-D01.01-R07/R12)", () => {
  it("corrects a misspelled guest name", async () => {
    const created = await create(sharedAgent, {
      commandId: "http-cmd-name-edit",
      contactSelection: { type: "CreateNewContact", displayName: "Jan Jansen", phone: "0600000002" },
    });

    const patched = await patchReq(sharedAgent, `/availability/reservations/${created.body.reservationId}`).send({
      commandId: "http-cmd-name-edit-1",
      changes: { contactName: "Jan Janssen" },
    });
    expect(patched.status).toBe(204);

    const after = await sharedAgent.get(`/reservations/${created.body.reservationId}`);
    expect(after.body.contactName).toBe("Jan Janssen");
  });

  it("corrects the reservation source", async () => {
    const created = await create(sharedAgent, { commandId: "http-cmd-source-edit" });
    const before = await sharedAgent.get(`/reservations/${created.body.reservationId}`);
    expect(before.body.sourceCategory).toBe("Telephone");

    const patched = await patchReq(sharedAgent, `/availability/reservations/${created.body.reservationId}`).send({
      commandId: "http-cmd-source-edit-1",
      changes: { source: { category: "Google" } },
    });
    expect(patched.status).toBe(204);

    const after = await sharedAgent.get(`/reservations/${created.body.reservationId}`);
    expect(after.body.sourceCategory).toBe("Google");
  });

  it("rejects an unrecognized source category with a 422 domain violation (CAP-D01.01-R12)", async () => {
    const created = await create(sharedAgent, { commandId: "http-cmd-source-bad-edit" });

    const res = await patchReq(sharedAgent, `/availability/reservations/${created.body.reservationId}`).send({
      commandId: "http-cmd-source-bad-edit-1",
      changes: { source: { category: "Carrier Pigeon" } },
    });

    expect(res.status).toBe(422);
    expect(res.body.violations.some((v: { ruleId: string }) => v.ruleId === "CAP-D01.01-R12")).toBe(true);
  });
});

describe("POST /availability/reservations/:id/cancel (authoritative cancel)", () => {
  it("cancels the reservation and releases its committed capacity", async () => {
    const created = await create(sharedAgent, { commandId: "http-cmd-cancel" });
    expect(created.status).toBe(201);
    const commitmentBefore = await prisma.capacityCommitment.findFirst({ where: { reservationId: created.body.reservationId, status: "Committed" } });
    expect(commitmentBefore).not.toBeNull();

    const res = await post(sharedAgent, `/availability/reservations/${created.body.reservationId}/cancel`).send({ commandId: "http-cmd-cancel-1" });
    expect(res.status).toBe(204);

    const after = await sharedAgent.get(`/reservations/${created.body.reservationId}`);
    expect(after.body.status).toBe("Cancelled");

    const commitmentAfter = await prisma.capacityCommitment.findFirst({ where: { reservationId: created.body.reservationId, status: "Committed" } });
    expect(commitmentAfter).toBeNull();
  });
});

describe("GET /reservations — CAP-D01.01-AC34 (Today's Active Reservations Are Operationally Discoverable)", () => {
  it("lists reservations for the requested date, including guest name and preferred area", async () => {
    const created = await create(sharedAgent, {
      commandId: "http-cmd-list",
      contactSelection: { type: "CreateNewContact", displayName: "Jan Jansen", phone: "0600000003" },
      preferredArea: "Teppanyaki",
    });
    expect(created.status).toBe(201);

    const dateParam = FUTURE_DATE.toISOString().slice(0, 10);
    const res = await sharedAgent.get(`/reservations?date=${dateParam}`);

    expect(res.status).toBe(200);
    expect(res.body.date).toBe(dateParam);
    expect(res.body.reservations).toHaveLength(1);
    expect(res.body.reservations[0]).toMatchObject({
      id: created.body.reservationId,
      status: "Proposed",
      contactName: "Jan Jansen",
      preferredArea: "Teppanyaki",
    });
  });

  it("returns an empty list for a date with no reservations", async () => {
    const res = await sharedAgent.get("/reservations?date=2030-01-01");
    expect(res.status).toBe(200);
    expect(res.body.reservations).toHaveLength(0);
  });

  it("rejects a malformed date query parameter with 400", async () => {
    const res = await sharedAgent.get("/reservations?date=not-a-date");
    expect(res.status).toBe(400);
  });
});

describe("Sluitingsdagen (closing days, van/tot)", () => {
  it("adds a single closed day when toDate is omitted — same day means 1 day", async () => {
    const dateKey = FUTURE_DATE.toISOString().slice(0, 10);

    const add = await post(sharedAgent, "/closing-days").send({ fromDate: dateKey, reason: "Personeelsuitje" });
    expect(add.status).toBe(201);
    expect(add.body).toMatchObject({ fromDate: dateKey, toDate: dateKey, reason: "Personeelsuitje" });

    const list = await sharedAgent.get("/closing-days");
    expect(list.status).toBe(200);
    expect(list.body.closingDays).toContainEqual(expect.objectContaining({ fromDate: dateKey, toDate: dateKey }));
  });

  it("adds, lists, and removes a multi-day range, blocking every day within it", async () => {
    const from = "2026-08-10";
    const to = "2026-08-12";

    const add = await post(sharedAgent, "/closing-days").send({ fromDate: from, toDate: to, reason: "Verbouwing" });
    expect(add.status).toBe(201);
    expect(add.body).toMatchObject({ fromDate: from, toDate: to });

    const list = await sharedAgent.get("/closing-days");
    const range = list.body.closingDays.find((r: { fromDate: string }) => r.fromDate === from);
    expect(range).toMatchObject({ fromDate: from, toDate: to, reason: "Verbouwing" });

    for (const day of ["2026-08-10", "2026-08-11", "2026-08-12"]) {
      const res = await create(sharedAgent, { commandId: `range-check-${day}`, reservationDate: `${day}T19:00:00.000Z` });
      expect(res.status).toBe(422);
    }

    const remove = await del(sharedAgent, `/closing-days/${range.id}`);
    expect(remove.status).toBe(204);

    const listAfter = await sharedAgent.get("/closing-days");
    expect(listAfter.body.closingDays).toEqual([]);
  });

  it("swaps a reversed range instead of rejecting it", async () => {
    const add = await post(sharedAgent, "/closing-days").send({ fromDate: "2026-08-12", toDate: "2026-08-10" });
    expect(add.status).toBe(201);
    expect(add.body).toMatchObject({ fromDate: "2026-08-10", toDate: "2026-08-12" });
  });

  it("rejects an invalid date with 400", async () => {
    const res = await post(sharedAgent, "/closing-days").send({ fromDate: "not-a-date" });
    expect(res.status).toBe(400);
  });
});

describe("GET /teppanyaki-occupancy", () => {
  async function createTeppanyaki(commandId: string, partySize: number, servicePeriodId: string) {
    return create(sharedAgent, {
      commandId,
      servicePeriodId,
      reservationDate: FUTURE_DATE.toISOString(),
      partySize,
      preferredArea: "Teppanyaki",
    });
  }

  it("colors a date+service orange at 70% and red at 90% of the 40-seat capacity", async () => {
    await createTeppanyaki("occ-orange", 28, "dinner"); // 28/40 = 70%

    const dateKey = FUTURE_DATE.toISOString().slice(0, 10);
    const orangeRes = await sharedAgent.get(`/teppanyaki-occupancy?from=${dateKey}&days=1`);
    expect(orangeRes.status).toBe(200);
    expect(orangeRes.body.capacity).toBe(40);
    expect(orangeRes.body.days).toContainEqual({
      date: dateKey,
      servicePeriodId: "dinner",
      bookedSeats: 28,
      capacity: 40,
      percentage: 70,
      level: "orange",
    });

    await createTeppanyaki("occ-red", 8, "dinner"); // 28 + 8 = 36/40 = 90%
    const redRes = await sharedAgent.get(`/teppanyaki-occupancy?from=${dateKey}&days=1`);
    expect(redRes.body.days[0]).toMatchObject({ bookedSeats: 36, percentage: 90, level: "red" });
  });

  it("tracks lunch and dinner separately rather than summing them (same physical seats, different services)", async () => {
    await createTeppanyaki("occ-lunch", 20, "lunch");
    await createTeppanyaki("occ-dinner", 20, "dinner");

    const dateKey = FUTURE_DATE.toISOString().slice(0, 10);
    const res = await sharedAgent.get(`/teppanyaki-occupancy?from=${dateKey}&days=1`);

    expect(res.body.days).toHaveLength(2);
    for (const row of res.body.days) {
      expect(row.bookedSeats).toBe(20);
      expect(row.percentage).toBe(50);
      expect(row.level).toBe("green");
    }
  });

  it("ignores non-Teppanyaki reservations", async () => {
    await create(sharedAgent, { commandId: "occ-sushi", reservationDate: FUTURE_DATE.toISOString(), partySize: 6, preferredArea: "Sushi" });

    const dateKey = FUTURE_DATE.toISOString().slice(0, 10);
    const res = await sharedAgent.get(`/teppanyaki-occupancy?from=${dateKey}&days=1`);
    expect(res.body.days).toHaveLength(0);
  });
});
