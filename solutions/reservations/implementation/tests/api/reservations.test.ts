import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { createApp } from "../../api/app.js";
import { InMemoryReservationRepository } from "../support/InMemoryReservationRepository.js";
import { FakeContactReader, FakeServicePeriodReader, FakeDuplicateReservationChecker } from "../support/FakePorts.js";
import { NOW, FUTURE_DATE } from "../support/factories.js";

/**
 * HTTP-level coverage for Create Reservation — the actual surface staff
 * or a POS integration will call during a pilot. Everything below this
 * layer already has unit coverage; this exists because that alone never
 * proved the wiring (body parsing, status codes, error shapes) works.
 */
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

function buildApp() {
  const repository = new InMemoryReservationRepository();
  const contactReader = new FakeContactReader();
  const servicePeriodReader = new FakeServicePeriodReader();
  const duplicateChecker = new FakeDuplicateReservationChecker();
  const app = createApp({
    repository,
    duplicateChecker,
    contactReader,
    servicePeriodReader,
    idGenerator: new SequentialIdGenerator(),
    eventIdGenerator: new SequentialEventIdGenerator(),
    clock: new FixedClock(),
  });
  return { app, repository, contactReader, servicePeriodReader, duplicateChecker };
}

function validBody(overrides: Record<string, unknown> = {}) {
  return {
    commandId: "http-cmd-1",
    servicePeriodId: "sp-1",
    contactId: "contact-1",
    reservationDate: FUTURE_DATE.toISOString(),
    partySize: 2,
    source: { category: "Telephone" },
    ...overrides,
  };
}

const staffHeaders = { "x-actor-id": "staff-1", "x-actor-kind": "AuthorizedUser" };

describe("GET /health", () => {
  it("responds 200 so a pilot deployment can be monitored", async () => {
    const { app } = buildApp();
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok" });
  });
});

describe("POST /reservations", () => {
  it("creates a reservation and returns the outcome DTO", async () => {
    const { app } = buildApp();
    const res = await request(app).post("/reservations").set(staffHeaders).send(validBody());

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ status: "Proposed", warnings: [] });
    expect(typeof res.body.reservationId).toBe("string");
  });

  it("rejects a request missing required information with 422", async () => {
    const { app } = buildApp();
    const res = await request(app).post("/reservations").set(staffHeaders).send(validBody({ contactId: "" }));

    expect(res.status).toBe(422);
    expect(res.body.violations.some((v: { ruleId: string }) => v.ruleId === "CAP-D01.01-R08")).toBe(true);
  });

  // Every real ActorKind is currently trusted for creation (CAP-D01.01-R32
  // only rejects an *unrecognized* kind), so an unauthorized-creation
  // rejection can only ever originate from a malformed x-actor-kind header.
  // resolveActor() catches that at the boundary with a clear 400 instead
  // of letting it fall through to a confusing domain-level 422 — this test
  // used to send "Unknown" as x-actor-kind and expect a 422/R32 response;
  // that exact request now (correctly) gets a 400 here instead. R32 itself
  // is still covered at the domain level — see tests/acceptance/creation.test.ts, AC39.
  it("rejects an unrecognized x-actor-kind with a clear 400, not a domain violation", async () => {
    const { app } = buildApp();
    const res = await request(app)
      .post("/reservations")
      .set({ "x-actor-id": "nobody", "x-actor-kind": "Human" })
      .send(validBody());

    expect(res.status).toBe(400);
    expect(res.body.message).toContain("Human");
    expect(res.body.message).toContain("AuthorizedUser");
  });

  it("rejects a structurally invalid date with 422 (CAP-D01.01-R10)", async () => {
    const { app } = buildApp();
    const res = await request(app).post("/reservations").set(staffHeaders).send(validBody({ reservationDate: "not-a-date" }));

    expect(res.status).toBe(422);
    expect(res.body.violations.some((v: { ruleId: string }) => v.ruleId === "CAP-D01.01-R10")).toBe(true);
  });

  it("surfaces a duplicate warning in the response instead of only in the persisted event", async () => {
    const { app, duplicateChecker } = buildApp();
    duplicateChecker.duplicateDetected = true;

    const res = await request(app).post("/reservations").set(staffHeaders).send(validBody({ commandId: "http-cmd-dup" }));

    expect(res.status).toBe(201);
    expect(res.body.warnings.some((w: { ruleId: string }) => w.ruleId === "CAP-D01.01-R14")).toBe(true);
  });

  it("is idempotent under a retried commandId: same reservationId, no duplicate created", async () => {
    const { app, repository } = buildApp();
    const body = validBody({ commandId: "http-cmd-retry" });

    const first = await request(app).post("/reservations").set(staffHeaders).send(body);
    const second = await request(app).post("/reservations").set(staffHeaders).send(body);

    expect(first.status).toBe(201);
    expect(second.status).toBe(201);
    expect(second.body.reservationId).toBe(first.body.reservationId);
    expect(repository.saveCallCount).toBe(1);
  });
});

describe("GET /reservations/:id", () => {
  it("returns the created reservation", async () => {
    const { app } = buildApp();
    const created = await request(app).post("/reservations").set(staffHeaders).send(validBody({ commandId: "http-cmd-get" }));

    const res = await request(app).get(`/reservations/${created.body.reservationId}`);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id: created.body.reservationId, status: "Proposed", partySize: 2 });
  });

  it("returns 404 for an unknown reservation", async () => {
    const { app } = buildApp();
    const res = await request(app).get("/reservations/does-not-exist");
    expect(res.status).toBe(404);
  });
});

describe("GET /reservations — CAP-D01.01-AC34 (Today's Active Reservations Are Operationally Discoverable)", () => {
  it("lists reservations for the requested date", async () => {
    const { app } = buildApp();
    const created = await request(app).post("/reservations").set(staffHeaders).send(validBody({ commandId: "http-cmd-list" }));
    expect(created.status).toBe(201);

    const dateParam = FUTURE_DATE.toISOString().slice(0, 10);
    const res = await request(app).get(`/reservations?date=${dateParam}`);

    expect(res.status).toBe(200);
    expect(res.body.date).toBe(dateParam);
    expect(res.body.reservations).toHaveLength(1);
    expect(res.body.reservations[0]).toMatchObject({ id: created.body.reservationId, status: "Proposed" });
  });

  it("returns an empty list for a date with no reservations", async () => {
    const { app } = buildApp();
    const res = await request(app).get("/reservations?date=2030-01-01");
    expect(res.status).toBe(200);
    expect(res.body.reservations).toHaveLength(0);
  });

  it("rejects a malformed date query parameter with 400", async () => {
    const { app } = buildApp();
    const res = await request(app).get("/reservations?date=not-a-date");
    expect(res.status).toBe(400);
  });
});
