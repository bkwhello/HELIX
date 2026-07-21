import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { createApp } from "../../api/app.js";
import { InMemoryReservationRepository } from "../support/InMemoryReservationRepository.js";
import { FakeContactReader, FakeServicePeriodReader, FakeDuplicateReservationChecker, FakeClosingDayStore } from "../support/FakePorts.js";
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
  const closingDayStore = new FakeClosingDayStore();
  const app = createApp({
    repository,
    duplicateChecker,
    contactReader,
    servicePeriodReader,
    closingDayStore,
    idGenerator: new SequentialIdGenerator(),
    eventIdGenerator: new SequentialEventIdGenerator(),
    clock: new FixedClock(),
  });
  return { app, repository, contactReader, servicePeriodReader, duplicateChecker, closingDayStore };
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

  it("accepts a guest name and a preferred area, returning both in the outcome", async () => {
    const { app } = buildApp();
    const res = await request(app)
      .post("/reservations")
      .set(staffHeaders)
      .send(validBody({ commandId: "http-cmd-area", contactName: "Jan Jansen", preferredArea: "Sushi" }));

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ contactName: "Jan Jansen", preferredArea: "Sushi" });
  });

  it("rejects an unrecognized preferredArea with a clear 400 (CAP-D01.01-R48)", async () => {
    const { app } = buildApp();
    const res = await request(app)
      .post("/reservations")
      .set(staffHeaders)
      .send(validBody({ commandId: "http-cmd-bad-area", preferredArea: "Steakhouse" }));

    expect(res.status).toBe(400);
    expect(res.body.message).toContain("Steakhouse");
    expect(res.body.message).toContain("Sushi");
  });

  it("accepts notes (allergies, special requests) and returns them in the outcome and the list", async () => {
    const { app } = buildApp();
    const res = await request(app)
      .post("/reservations")
      .set(staffHeaders)
      .send(validBody({ commandId: "http-cmd-notes", notes: "Notenallergie, graag een rustige tafel" }));

    expect(res.status).toBe(201);
    expect(res.body.notes).toBe("Notenallergie, graag een rustige tafel");

    const list = await request(app).get(`/reservations?date=${FUTURE_DATE.toISOString().slice(0, 10)}`);
    expect(list.body.reservations[0]).toMatchObject({ notes: "Notenallergie, graag een rustige tafel" });
  });

  it("rejects creation for a date marked closed (CAP-D01.01-R51)", async () => {
    const { app, closingDayStore } = buildApp();
    await closingDayStore.add({ fromDate: FUTURE_DATE, toDate: FUTURE_DATE, reason: "Personeelsuitje" });

    const res = await request(app).post("/reservations").set(staffHeaders).send(validBody({ commandId: "http-cmd-closed" }));

    expect(res.status).toBe(422);
    expect(res.body.violations.some((v: { ruleId: string }) => v.ruleId === "CAP-D01.01-R51")).toBe(true);
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

describe("PATCH /reservations/:id — manual table assignment (CAP-D01.01-R48)", () => {
  it("sets and later changes the table assignment, reflected in GET", async () => {
    const { app } = buildApp();
    const created = await request(app)
      .post("/reservations")
      .set(staffHeaders)
      .send(validBody({ commandId: "http-cmd-table", preferredArea: "Teppanyaki" }));

    const setTable = await request(app)
      .patch(`/reservations/${created.body.reservationId}`)
      .set(staffHeaders)
      .send({ commandId: "http-cmd-table-1", changes: { tableAssignment: "C1" } });
    expect(setTable.status).toBe(204);

    const afterSet = await request(app).get(`/reservations/${created.body.reservationId}`);
    expect(afterSet.body.tableAssignment).toBe("C1");

    const changeTable = await request(app)
      .patch(`/reservations/${created.body.reservationId}`)
      .set(staffHeaders)
      .send({ commandId: "http-cmd-table-2", changes: { tableAssignment: "D3" } });
    expect(changeTable.status).toBe(204);

    const afterChange = await request(app).get(`/reservations/${created.body.reservationId}`);
    expect(afterChange.body.tableAssignment).toBe("D3");
  });
});

describe("PATCH /reservations/:id — editing notes after creation (CAP-D01.01-R36/R37)", () => {
  it("adds a note to a reservation created without one, then corrects it", async () => {
    const { app } = buildApp();
    const created = await request(app).post("/reservations").set(staffHeaders).send(validBody({ commandId: "http-cmd-notes-edit" }));
    expect(created.body.notes).toBeUndefined();

    const addNote = await request(app)
      .patch(`/reservations/${created.body.reservationId}`)
      .set(staffHeaders)
      .send({ commandId: "http-cmd-notes-edit-1", changes: { notes: "Op de rekening zetten" } });
    expect(addNote.status).toBe(204);

    const afterAdd = await request(app).get(`/reservations/${created.body.reservationId}`);
    expect(afterAdd.body.notes).toBe("Op de rekening zetten");

    const correctNote = await request(app)
      .patch(`/reservations/${created.body.reservationId}`)
      .set(staffHeaders)
      .send({ commandId: "http-cmd-notes-edit-2", changes: { notes: "Op de rekening zetten + glutenvrij" } });
    expect(correctNote.status).toBe(204);

    const afterCorrect = await request(app).get(`/reservations/${created.body.reservationId}`);
    expect(afterCorrect.body.notes).toBe("Op de rekening zetten + glutenvrij");
  });
});

describe("GET /reservations — CAP-D01.01-AC34 (Today's Active Reservations Are Operationally Discoverable)", () => {
  it("lists reservations for the requested date, including guest name and preferred area", async () => {
    const { app } = buildApp();
    const created = await request(app)
      .post("/reservations")
      .set(staffHeaders)
      .send(validBody({ commandId: "http-cmd-list", contactName: "Jan Jansen", preferredArea: "Teppanyaki" }));
    expect(created.status).toBe(201);

    const dateParam = FUTURE_DATE.toISOString().slice(0, 10);
    const res = await request(app).get(`/reservations?date=${dateParam}`);

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

describe("Sluitingsdagen (closing days, van/tot)", () => {
  it("adds a single closed day when toDate is omitted — same day means 1 day", async () => {
    const { app } = buildApp();
    const dateKey = FUTURE_DATE.toISOString().slice(0, 10);

    const add = await request(app).post("/closing-days").set(staffHeaders).send({ fromDate: dateKey, reason: "Personeelsuitje" });
    expect(add.status).toBe(201);
    expect(add.body).toMatchObject({ fromDate: dateKey, toDate: dateKey, reason: "Personeelsuitje" });

    const list = await request(app).get("/closing-days");
    expect(list.status).toBe(200);
    expect(list.body.closingDays).toContainEqual(expect.objectContaining({ fromDate: dateKey, toDate: dateKey }));
  });

  it("adds, lists, and removes a multi-day range, blocking every day within it", async () => {
    const { app } = buildApp();
    const from = "2026-08-10";
    const to = "2026-08-12";

    const add = await request(app).post("/closing-days").set(staffHeaders).send({ fromDate: from, toDate: to, reason: "Verbouwing" });
    expect(add.status).toBe(201);
    expect(add.body).toMatchObject({ fromDate: from, toDate: to });

    const list = await request(app).get("/closing-days");
    const range = list.body.closingDays.find((r: { fromDate: string }) => r.fromDate === from);
    expect(range).toMatchObject({ fromDate: from, toDate: to, reason: "Verbouwing" });

    for (const day of ["2026-08-10", "2026-08-11", "2026-08-12"]) {
      const res = await request(app)
        .post("/reservations")
        .set(staffHeaders)
        .send(validBody({ commandId: `range-check-${day}`, reservationDate: `${day}T19:00:00.000Z` }));
      expect(res.status).toBe(422);
    }

    const remove = await request(app).delete(`/closing-days/${range.id}`);
    expect(remove.status).toBe(204);

    const listAfter = await request(app).get("/closing-days");
    expect(listAfter.body.closingDays).toEqual([]);
  });

  it("swaps a reversed range instead of rejecting it", async () => {
    const { app } = buildApp();
    const add = await request(app).post("/closing-days").set(staffHeaders).send({ fromDate: "2026-08-12", toDate: "2026-08-10" });
    expect(add.status).toBe(201);
    expect(add.body).toMatchObject({ fromDate: "2026-08-10", toDate: "2026-08-12" });
  });

  it("rejects an invalid date with 400", async () => {
    const { app } = buildApp();
    const res = await request(app).post("/closing-days").set(staffHeaders).send({ fromDate: "not-a-date" });
    expect(res.status).toBe(400);
  });
});

describe("GET /teppanyaki-occupancy", () => {
  async function createTeppanyaki(app: import("express").Express, commandId: string, partySize: number, servicePeriodId: string) {
    return request(app)
      .post("/reservations")
      .set(staffHeaders)
      .send(
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
    const { app } = buildApp();
    await createTeppanyaki(app, "occ-orange", 28, "dinner"); // 28/40 = 70%

    const dateKey = FUTURE_DATE.toISOString().slice(0, 10);
    const orangeRes = await request(app).get(`/teppanyaki-occupancy?from=${dateKey}&days=1`);
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

    await createTeppanyaki(app, "occ-red", 8, "dinner"); // 28 + 8 = 36/40 = 90%
    const redRes = await request(app).get(`/teppanyaki-occupancy?from=${dateKey}&days=1`);
    expect(redRes.body.days[0]).toMatchObject({ bookedSeats: 36, percentage: 90, level: "red" });
  });

  it("tracks lunch and dinner separately rather than summing them (same physical seats, different services)", async () => {
    const { app } = buildApp();
    await createTeppanyaki(app, "occ-lunch", 20, "lunch");
    await createTeppanyaki(app, "occ-dinner", 20, "dinner");

    const dateKey = FUTURE_DATE.toISOString().slice(0, 10);
    const res = await request(app).get(`/teppanyaki-occupancy?from=${dateKey}&days=1`);

    expect(res.body.days).toHaveLength(2);
    for (const row of res.body.days) {
      expect(row.bookedSeats).toBe(20);
      expect(row.percentage).toBe(50);
      expect(row.level).toBe("green");
    }
  });

  it("ignores non-Teppanyaki reservations", async () => {
    const { app } = buildApp();
    await request(app)
      .post("/reservations")
      .set(staffHeaders)
      .send(validBody({ commandId: "occ-sushi", reservationDate: FUTURE_DATE.toISOString(), partySize: 6, preferredArea: "Sushi" }));

    const dateKey = FUTURE_DATE.toISOString().slice(0, 10);
    const res = await request(app).get(`/teppanyaki-occupancy?from=${dateKey}&days=1`);
    expect(res.body.days).toHaveLength(0);
  });
});
