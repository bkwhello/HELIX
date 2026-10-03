import { describe, it, expect, beforeEach } from "vitest";
import { ModifyReservationHandler } from "../../application/command-handlers/ModifyReservationHandler.js";
import { InMemoryReservationRepository } from "../support/InMemoryReservationRepository.js";
import { FakeServicePeriodReader } from "../support/FakePorts.js";
import { ReservationAggregate } from "../../domain/aggregates/ReservationAggregate.js";
import { ReservationId } from "../../domain/value-objects/ReservationId.js";
import { validCreateCommand, staffActor, NOW } from "../support/factories.js";

/**
 * R1.3-I3 — CAP-D05.02. Application-layer coverage for
 * ModifyReservationHandler's own critical-note add/update/resolve
 * handling — identity/lifecycle validation (CAP-D05.02-R03/R04),
 * atomicity with the surrounding Modify, and idempotency. Pure
 * aggregate-level behavior (changedFields/previousValues/resultingValues
 * shape, the terminal-state rejection) is covered in
 * tests/acceptance/modification.test.ts; this file is the handler's own
 * pre-write validation and repository wiring.
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
    return `note-id-${idCounter}`;
  }
}

let eventIdCounter = 0;
class SequentialEventIdGenerator {
  generate(): string {
    eventIdCounter += 1;
    return `evt-${eventIdCounter}`;
  }
}

async function seedReservation(repository: InMemoryReservationRepository, reservationId: string): Promise<string> {
  const created = ReservationAggregate.create(validCreateCommand({ reservationId }));
  if (!created.ok) throw new Error("test setup failed: " + JSON.stringify(created.violations));
  const saveResult = await repository.save({
    aggregate: created.value,
    expectedVersion: created.value.getVersion(),
    commandId: `seed-${reservationId}`,
  });
  if (saveResult.type !== "SAVED") throw new Error("test setup failed to save seed reservation");
  return reservationId;
}

async function currentVersion(repository: InMemoryReservationRepository, reservationId: string): Promise<number> {
  const idResult = ReservationId.create(reservationId);
  if (!idResult.ok) throw new Error("bad id");
  const aggregate = await repository.findById(idResult.value);
  if (!aggregate) throw new Error("reservation not found");
  return aggregate.getVersion();
}

describe("ModifyReservationHandler — critical notes (CAP-D05.02)", () => {
  let repository: InMemoryReservationRepository;
  let handler: ModifyReservationHandler;
  let reservationId: string;

  beforeEach(async () => {
    repository = new InMemoryReservationRepository();
    handler = new ModifyReservationHandler(
      repository,
      new SequentialEventIdGenerator(),
      new FixedClock(),
      new FakeServicePeriodReader(),
      new SequentialIdGenerator()
    );
    reservationId = await seedReservation(repository, "res-modify-1");
  });

  it("adds a new Active critical note via an empty `changes` + criticalNoteChanges.add, bumping the Reservation version", async () => {
    const versionBefore = await currentVersion(repository, reservationId);

    const result = await handler.handle({
      commandId: "cmd-add-1",
      reservationId,
      actor: staffActor,
      changes: {},
      criticalNoteChanges: { add: [{ noteType: "Allergy", detail: "noten" }] },
    });

    expect(result.ok).toBe(true);
    expect(await currentVersion(repository, reservationId)).toBe(versionBefore + 1);

    const notes = await repository.findCriticalNotesByReservationId(reservationId);
    expect(notes).toHaveLength(1);
    expect(notes[0]?.noteType).toBe("Allergy");
    expect(notes[0]?.detail).toBe("noten");
    expect(notes[0]?.status).toBe("Active");
  });

  it("adds multiple notes of mixed type in one change set", async () => {
    const result = await handler.handle({
      commandId: "cmd-add-multi",
      reservationId,
      actor: staffActor,
      changes: {},
      criticalNoteChanges: {
        add: [
          { noteType: "Allergy", detail: "noten" },
          { noteType: "Critical", detail: "rolstoeltoegang nodig" },
        ],
      },
    });
    expect(result.ok).toBe(true);
    const notes = await repository.findCriticalNotesByReservationId(reservationId);
    expect(notes).toHaveLength(2);
  });

  it("rejects an invalid noteType on add BEFORE any write — nothing is persisted, version unchanged", async () => {
    const versionBefore = await currentVersion(repository, reservationId);

    const result = await handler.handle({
      commandId: "cmd-add-bad-type",
      reservationId,
      actor: staffActor,
      changes: {},
      criticalNoteChanges: { add: [{ noteType: "Bogus", detail: "x" }] },
    });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.violations.some((v) => v.ruleId === "CAP-D05.02-R02")).toBe(true);
    expect(await repository.findCriticalNotesByReservationId(reservationId)).toHaveLength(0);
    expect(await currentVersion(repository, reservationId)).toBe(versionBefore);
  });

  it("rejects an empty detail on add BEFORE any write", async () => {
    const result = await handler.handle({
      commandId: "cmd-add-bad-detail",
      reservationId,
      actor: staffActor,
      changes: {},
      criticalNoteChanges: { add: [{ noteType: "Allergy", detail: "   " }] },
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.violations.some((v) => v.ruleId === "CAP-D05.02-R01")).toBe(true);
    expect(await repository.findCriticalNotesByReservationId(reservationId)).toHaveLength(0);
  });

  it("updates an existing Active note's type/detail", async () => {
    await handler.handle({
      commandId: "cmd-seed-note-1",
      reservationId,
      actor: staffActor,
      changes: {},
      criticalNoteChanges: { add: [{ noteType: "Allergy", detail: "noten" }] },
    });
    const [note] = await repository.findCriticalNotesByReservationId(reservationId);

    const result = await handler.handle({
      commandId: "cmd-update-1",
      reservationId,
      actor: staffActor,
      changes: {},
      criticalNoteChanges: { update: [{ id: note!.id, noteType: "Allergy", detail: "noten EN schaaldieren" }] },
    });

    expect(result.ok).toBe(true);
    const [updated] = await repository.findCriticalNotesByReservationId(reservationId);
    expect(updated?.detail).toBe("noten EN schaaldieren");
    expect(updated?.status).toBe("Active");
  });

  it("rejects updating an unknown id — CAP-D05.02-R03 (missing and invalid share one outcome)", async () => {
    const result = await handler.handle({
      commandId: "cmd-update-unknown",
      reservationId,
      actor: staffActor,
      changes: {},
      criticalNoteChanges: { update: [{ id: "does-not-exist", noteType: "Allergy", detail: "x" }] },
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.violations.some((v) => v.ruleId === "CAP-D05.02-R03")).toBe(true);
  });

  it("rejects updating/resolving a note that belongs to a DIFFERENT reservation — CAP-D05.02-R03", async () => {
    const otherReservationId = await seedReservation(repository, "res-modify-2");
    await handler.handle({
      commandId: "cmd-seed-other",
      reservationId: otherReservationId,
      actor: staffActor,
      changes: {},
      criticalNoteChanges: { add: [{ noteType: "Allergy", detail: "noten" }] },
    });
    const [otherNote] = await repository.findCriticalNotesByReservationId(otherReservationId);

    // Attempting to resolve the OTHER reservation's note through THIS reservation's Modify.
    const result = await handler.handle({
      commandId: "cmd-cross-reservation",
      reservationId,
      actor: staffActor,
      changes: {},
      criticalNoteChanges: { resolve: [{ id: otherNote!.id }] },
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.violations.some((v) => v.ruleId === "CAP-D05.02-R03")).toBe(true);
    // The other reservation's note is untouched.
    const [stillActive] = await repository.findCriticalNotesByReservationId(otherReservationId);
    expect(stillActive?.status).toBe("Active");
  });

  it("resolves an Active note, setting status/resolvedAt — one-way, cannot be resolved again", async () => {
    await handler.handle({
      commandId: "cmd-seed-note-2",
      reservationId,
      actor: staffActor,
      changes: {},
      criticalNoteChanges: { add: [{ noteType: "Critical", detail: "rolstoel" }] },
    });
    const [note] = await repository.findCriticalNotesByReservationId(reservationId);

    const result = await handler.handle({
      commandId: "cmd-resolve-1",
      reservationId,
      actor: staffActor,
      changes: {},
      criticalNoteChanges: { resolve: [{ id: note!.id }] },
    });
    expect(result.ok).toBe(true);
    const [resolved] = await repository.findCriticalNotesByReservationId(reservationId);
    expect(resolved?.status).toBe("Resolved");
    expect(resolved?.resolvedAt).not.toBeNull();

    const second = await handler.handle({
      commandId: "cmd-resolve-again",
      reservationId,
      actor: staffActor,
      changes: {},
      criticalNoteChanges: { resolve: [{ id: note!.id }] },
    });
    expect(second.ok).toBe(false);
    if (!second.ok) expect(second.violations.some((v) => v.ruleId === "CAP-D05.02-R03")).toBe(true);
  });

  it("rejects a duplicate id used in BOTH update and resolve in the same change set — CAP-D05.02-R04 — and applies NEITHER", async () => {
    await handler.handle({
      commandId: "cmd-seed-note-3",
      reservationId,
      actor: staffActor,
      changes: {},
      criticalNoteChanges: { add: [{ noteType: "Allergy", detail: "noten" }] },
    });
    const [note] = await repository.findCriticalNotesByReservationId(reservationId);

    const result = await handler.handle({
      commandId: "cmd-dup-change",
      reservationId,
      actor: staffActor,
      changes: {},
      criticalNoteChanges: {
        update: [{ id: note!.id, noteType: "Allergy", detail: "changed" }],
        resolve: [{ id: note!.id }],
      },
    });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.violations.some((v) => v.ruleId === "CAP-D05.02-R04")).toBe(true);
    const [unchanged] = await repository.findCriticalNotesByReservationId(reservationId);
    expect(unchanged?.detail).toBe("noten");
    expect(unchanged?.status).toBe("Active");
  });

  it("a valid add alongside an invalid update in the SAME change set fails the whole request — the valid add is not partially applied", async () => {
    const result = await handler.handle({
      commandId: "cmd-mixed-validity",
      reservationId,
      actor: staffActor,
      changes: {},
      criticalNoteChanges: {
        add: [{ noteType: "Allergy", detail: "noten" }],
        update: [{ id: "does-not-exist", noteType: "Allergy", detail: "x" }],
      },
    });
    expect(result.ok).toBe(false);
    expect(await repository.findCriticalNotesByReservationId(reservationId)).toHaveLength(0);
  });

  it("a repeated commandId (idempotent replay) does not duplicate or re-apply the note change", async () => {
    const request = {
      commandId: "cmd-add-replay",
      reservationId,
      actor: staffActor,
      changes: {},
      criticalNoteChanges: { add: [{ noteType: "Allergy", detail: "noten" }] },
    };

    const first = await handler.handle(request);
    expect(first.ok).toBe(true);
    const second = await handler.handle(request);
    expect(second.ok).toBe(true);

    expect(await repository.findCriticalNotesByReservationId(reservationId)).toHaveLength(1);
  });

  it("omitting criticalNoteChanges entirely leaves existing notes untouched on an ordinary field Modify", async () => {
    await handler.handle({
      commandId: "cmd-seed-note-4",
      reservationId,
      actor: staffActor,
      changes: {},
      criticalNoteChanges: { add: [{ noteType: "Allergy", detail: "noten" }] },
    });

    const result = await handler.handle({
      commandId: "cmd-plain-field-change",
      reservationId,
      actor: staffActor,
      changes: { partySize: 6 },
    });
    expect(result.ok).toBe(true);
    const notes = await repository.findCriticalNotesByReservationId(reservationId);
    expect(notes).toHaveLength(1);
    expect(notes[0]?.status).toBe("Active");
  });
});
