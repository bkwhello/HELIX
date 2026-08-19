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
 */
const NOW = new Date("2026-08-01T10:00:00Z");
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
    const res = await post(request.agent(sharedApp), "/reservations").send(validBody());
    expect(res.status).toBe(401);
  });

  it("rejects a request whose session was never established, even with a plausible-looking cookie value — 401 (not the ex-header-trust default)", async () => {
    const res = await post(request.agent(sharedApp), "/reservations").set("Cookie", "helix_session=not-a-real-token").send(validBody());
    expect(res.status).toBe(401);
  });

  it("rejects a mutating request missing the CSRF header even WITH a valid session — 403", async () => {
    const res = await sharedAgent.post("/reservations").send(validBody({ commandId: "csrf-missing-header" }));
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

describe("POST /reservations", () => {
  it("creates a reservation and returns the outcome DTO", async () => {
    const res = await post(sharedAgent, "/reservations").send(validBody());

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ status: "Proposed", warnings: [] });
    expect(typeof res.body.reservationId).toBe("string");
  });

  it("rejects a request missing required information with 422", async () => {
    const res = await post(sharedAgent, "/reservations").send(validBody({ servicePeriodId: "" }));

    expect(res.status).toBe(422);
    expect(res.body.violations.some((v: { ruleId: string }) => v.ruleId === "CAP-D01.01-R08")).toBe(true);
  });

  // CAP-D05.01 — contactSelection shape is validated at the API boundary,
  // the same way preferredArea already is (see parsePreferredArea) —
  // a structurally missing/invalid contact selection is a 400, not a 422.
  it("rejects a request with no contactSelection at all with 400", async () => {
    const res = await post(sharedAgent, "/reservations").send(validBody({ contactSelection: undefined }));

    expect(res.status).toBe(400);
  });

  it("rejects a structurally invalid date with 422 (CAP-D01.01-R10)", async () => {
    const res = await post(sharedAgent, "/reservations").send(validBody({ reservationDate: "not-a-date" }));

    expect(res.status).toBe(422);
    expect(res.body.violations.some((v: { ruleId: string }) => v.ruleId === "CAP-D01.01-R10")).toBe(true);
  });

  // CAP-D01.01-R14 (duplicate detection) against the REAL
  // PrismaDuplicateReservationChecker — this used to toggle a fake flag;
  // now it creates a genuine matching prior reservation.
  it("surfaces a duplicate warning in the response instead of only in the persisted event", async () => {
    await post(sharedAgent, "/reservations").send(validBody({ commandId: "http-cmd-dup-original" }));

    const res = await post(sharedAgent, "/reservations").send(validBody({ commandId: "http-cmd-dup" }));

    expect(res.status).toBe(201);
    expect(res.body.warnings.some((w: { ruleId: string }) => w.ruleId === "CAP-D01.01-R14")).toBe(true);
  });

  it("accepts a guest name and a preferred area, returning both in the outcome", async () => {
    const res = await post(sharedAgent, "/reservations").send(
      validBody({
        commandId: "http-cmd-area",
        contactSelection: { type: "CreateNewContact", displayName: "Jan Jansen", phone: "0600000001" },
        preferredArea: "Sushi",
      })
    );

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ contactName: "Jan Jansen", preferredArea: "Sushi" });
  });

  it("rejects an unrecognized preferredArea with a clear 400 (CAP-D01.01-R48)", async () => {
    const res = await post(sharedAgent, "/reservations").send(
      validBody({ commandId: "http-cmd-bad-area", preferredArea: "Steakhouse" })
    );

    expect(res.status).toBe(400);
    expect(res.body.message).toContain("Steakhouse");
    expect(res.body.message).toContain("Sushi");
  });

  it("accepts notes (allergies, special requests) and returns them in the outcome and the list", async () => {
    const res = await post(sharedAgent, "/reservations").send(
      validBody({ commandId: "http-cmd-notes", notes: "Notenallergie, graag een rustige tafel" })
    );

    expect(res.status).toBe(201);
    expect(res.body.notes).toBe("Notenallergie, graag een rustige tafel");

    const list = await sharedAgent.get(`/reservations?date=${FUTURE_DATE.toISOString().slice(0, 10)}`);
    expect(list.body.reservations[0]).toMatchObject({ notes: "Notenallergie, graag een rustige tafel" });
  });

  it("rejects creation for a date marked closed (CAP-D01.01-R51)", async () => {
    await post(sharedAgent, "/closing-days").send({ fromDate: FUTURE_DATE.toISOString().slice(0, 10), reason: "Personeelsuitje" });

    const res = await post(sharedAgent, "/reservations").send(validBody({ commandId: "http-cmd-closed" }));

    expect(res.status).toBe(422);
    expect(res.body.violations.some((v: { ruleId: string }) => v.ruleId === "CAP-D01.01-R51")).toBe(true);
  });

  it("is idempotent under a retried commandId: same reservationId, no duplicate created", async () => {
    const body = validBody({ commandId: "http-cmd-retry" });

    const first = await post(sharedAgent, "/reservations").send(body);
    const second = await post(sharedAgent, "/reservations").send(body);

    expect(first.status).toBe(201);
    expect(second.status).toBe(201);
    expect(second.body.reservationId).toBe(first.body.reservationId);

    const rows = await prisma.reservation.findMany({ where: { id: first.body.reservationId } });
    expect(rows).toHaveLength(1);
  });
});

describe("GET /reservations/:id", () => {
  it("returns the created reservation", async () => {
    const created = await post(sharedAgent, "/reservations").send(validBody({ commandId: "http-cmd-get" }));

    const res = await sharedAgent.get(`/reservations/${created.body.reservationId}`);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id: created.body.reservationId, status: "Proposed", partySize: 2 });
  });

  it("returns 404 for an unknown reservation", async () => {
    const res = await sharedAgent.get("/reservations/does-not-exist");
    expect(res.status).toBe(404);
  });
});

describe("PATCH /reservations/:id — manual table assignment (CAP-D01.01-R48)", () => {
  it("sets and later changes the table assignment, reflected in GET", async () => {
    const created = await post(sharedAgent, "/reservations").send(
      validBody({ commandId: "http-cmd-table", preferredArea: "Teppanyaki" })
    );

    const setTable = await patchReq(sharedAgent, `/reservations/${created.body.reservationId}`).send({
      commandId: "http-cmd-table-1",
      changes: { tableAssignment: "C1" },
    });
    expect(setTable.status).toBe(204);

    const afterSet = await sharedAgent.get(`/reservations/${created.body.reservationId}`);
    expect(afterSet.body.tableAssignment).toBe("C1");

    const changeTable = await patchReq(sharedAgent, `/reservations/${created.body.reservationId}`).send({
      commandId: "http-cmd-table-2",
      changes: { tableAssignment: "D3" },
    });
    expect(changeTable.status).toBe(204);

    const afterChange = await sharedAgent.get(`/reservations/${created.body.reservationId}`);
    expect(afterChange.body.tableAssignment).toBe("D3");
  });
});

describe("PATCH /reservations/:id — marking a reservation as arrived", () => {
  it("has no arrival mark on a freshly created reservation", async () => {
    const created = await post(sharedAgent, "/reservations").send(validBody({ commandId: "http-cmd-arrive-none" }));
    const before = await sharedAgent.get(`/reservations/${created.body.reservationId}`);
    expect(before.body.arrivedAt).toBeUndefined();
  });

  it("marks a reservation as arrived, then clears the mark via an explicit null", async () => {
    const created = await post(sharedAgent, "/reservations").send(validBody({ commandId: "http-cmd-arrive" }));

    const arrivedAt = new Date().toISOString();
    const marked = await patchReq(sharedAgent, `/reservations/${created.body.reservationId}`).send({
      commandId: "http-cmd-arrive-1",
      changes: { arrivedAt },
    });
    expect(marked.status).toBe(204);

    const afterMark = await sharedAgent.get(`/reservations/${created.body.reservationId}`);
    expect(afterMark.body.arrivedAt).toBe(new Date(arrivedAt).toISOString());

    const cleared = await patchReq(sharedAgent, `/reservations/${created.body.reservationId}`).send({
      commandId: "http-cmd-arrive-2",
      changes: { arrivedAt: null },
    });
    expect(cleared.status).toBe(204);

    const afterClear = await sharedAgent.get(`/reservations/${created.body.reservationId}`);
    expect(afterClear.body.arrivedAt).toBeUndefined();
  });
});

describe("PATCH /reservations/:id — editing notes after creation (CAP-D01.01-R36/R37)", () => {
  it("adds a note to a reservation created without one, then corrects it", async () => {
    const created = await post(sharedAgent, "/reservations").send(validBody({ commandId: "http-cmd-notes-edit" }));
    expect(created.body.notes).toBeUndefined();

    const addNote = await patchReq(sharedAgent, `/reservations/${created.body.reservationId}`).send({
      commandId: "http-cmd-notes-edit-1",
      changes: { notes: "Op de rekening zetten" },
    });
    expect(addNote.status).toBe(204);

    const afterAdd = await sharedAgent.get(`/reservations/${created.body.reservationId}`);
    expect(afterAdd.body.notes).toBe("Op de rekening zetten");

    const correctNote = await patchReq(sharedAgent, `/reservations/${created.body.reservationId}`).send({
      commandId: "http-cmd-notes-edit-2",
      changes: { notes: "Op de rekening zetten + glutenvrij" },
    });
    expect(correctNote.status).toBe(204);

    const afterCorrect = await sharedAgent.get(`/reservations/${created.body.reservationId}`);
    expect(afterCorrect.body.notes).toBe("Op de rekening zetten + glutenvrij");
  });
});

describe("PATCH /reservations/:id — changing the preferred area after creation (CAP-D01.01-R48)", () => {
  it("switches Sushi to Teppanyaki", async () => {
    const created = await post(sharedAgent, "/reservations").send(
      validBody({ commandId: "http-cmd-area-edit", preferredArea: "Sushi" })
    );
    expect(created.body.preferredArea).toBe("Sushi");

    const switched = await patchReq(sharedAgent, `/reservations/${created.body.reservationId}`).send({
      commandId: "http-cmd-area-edit-1",
      changes: { preferredArea: "Teppanyaki" },
    });
    expect(switched.status).toBe(204);

    const after = await sharedAgent.get(`/reservations/${created.body.reservationId}`);
    expect(after.body.preferredArea).toBe("Teppanyaki");
  });

  it("rejects an unrecognized preferredArea in changes with a clear 400", async () => {
    const created = await post(sharedAgent, "/reservations").send(validBody({ commandId: "http-cmd-area-bad-edit" }));

    const res = await patchReq(sharedAgent, `/reservations/${created.body.reservationId}`).send({
      commandId: "http-cmd-area-bad-edit-1",
      changes: { preferredArea: "Steakhouse" },
    });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain("Steakhouse");
  });
});

describe("PATCH /reservations/:id — correcting the guest name and source (CAP-D01.01-R07/R12)", () => {
  it("corrects a misspelled guest name", async () => {
    const created = await post(sharedAgent, "/reservations").send(
      validBody({ commandId: "http-cmd-name-edit", contactSelection: { type: "CreateNewContact", displayName: "Jan Jansen", phone: "0600000002" } })
    );

    const patched = await patchReq(sharedAgent, `/reservations/${created.body.reservationId}`).send({
      commandId: "http-cmd-name-edit-1",
      changes: { contactName: "Jan Janssen" },
    });
    expect(patched.status).toBe(204);

    const after = await sharedAgent.get(`/reservations/${created.body.reservationId}`);
    expect(after.body.contactName).toBe("Jan Janssen");
  });

  it("corrects the reservation source", async () => {
    const created = await post(sharedAgent, "/reservations").send(validBody({ commandId: "http-cmd-source-edit" }));
    const before = await sharedAgent.get(`/reservations/${created.body.reservationId}`);
    expect(before.body.sourceCategory).toBe("Telephone");

    const patched = await patchReq(sharedAgent, `/reservations/${created.body.reservationId}`).send({
      commandId: "http-cmd-source-edit-1",
      changes: { source: { category: "Google" } },
    });
    expect(patched.status).toBe(204);

    const after = await sharedAgent.get(`/reservations/${created.body.reservationId}`);
    expect(after.body.sourceCategory).toBe("Google");
  });

  it("rejects an unrecognized source category with a 422 domain violation (CAP-D01.01-R12)", async () => {
    const created = await post(sharedAgent, "/reservations").send(validBody({ commandId: "http-cmd-source-bad-edit" }));

    const res = await patchReq(sharedAgent, `/reservations/${created.body.reservationId}`).send({
      commandId: "http-cmd-source-bad-edit-1",
      changes: { source: { category: "Carrier Pigeon" } },
    });

    expect(res.status).toBe(422);
    expect(res.body.violations.some((v: { ruleId: string }) => v.ruleId === "CAP-D01.01-R12")).toBe(true);
  });
});

describe("GET /reservations — CAP-D01.01-AC34 (Today's Active Reservations Are Operationally Discoverable)", () => {
  it("lists reservations for the requested date, including guest name and preferred area", async () => {
    const created = await post(sharedAgent, "/reservations").send(
      validBody({
        commandId: "http-cmd-list",
        contactSelection: { type: "CreateNewContact", displayName: "Jan Jansen", phone: "0600000003" },
        preferredArea: "Teppanyaki",
      })
    );
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
      const res = await post(sharedAgent, "/reservations").send(
        validBody({ commandId: `range-check-${day}`, reservationDate: `${day}T19:00:00.000Z` })
      );
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
    return post(sharedAgent, "/reservations").send(
      validBody({
        commandId,
        servicePeriodId,
        reservationDate: FUTURE_DATE.toISOString(),
        partySize,
        preferredArea: "Teppanyaki",
      })
    );
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
    await post(sharedAgent, "/reservations").send(
      validBody({ commandId: "occ-sushi", reservationDate: FUTURE_DATE.toISOString(), partySize: 6, preferredArea: "Sushi" })
    );

    const dateKey = FUTURE_DATE.toISOString().slice(0, 10);
    const res = await sharedAgent.get(`/teppanyaki-occupancy?from=${dateKey}&days=1`);
    expect(res.body.days).toHaveLength(0);
  });
});
