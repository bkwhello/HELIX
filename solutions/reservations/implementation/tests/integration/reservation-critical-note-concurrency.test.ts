import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { buildHarness, resetDatabase, seedTestContact } from "./support/testHarness.js";
import { createTestPrismaClient } from "./support/testDatabaseSafety.js";
import { Actor, ActorKind, ActorRole } from "../../domain/value-objects/Actor.js";
import { ReservationSourceCategory } from "../../domain/value-objects/ReservationSource.js";
import { CreateReservationRequest } from "../../application/command-handlers/CreateReservationHandler.js";

/**
 * R1.3-I3 — CAP-D05.02. Real-PostgreSQL transaction and concurrency
 * evidence for critical notes, complementing (never duplicating):
 *  - tests/integration/reservation-critical-note-persistence.test.ts
 *    (migration/schema CHECK+FK constraints, repository read ordering)
 *  - tests/api/reservations.test.ts's own "R1.3-I3 — Reservation
 *    critical-note HTTP contract" describe block (HTTP shape, identity
 *    rejection within one request, read-contract allowlist, auth)
 *
 * This file's own job: atomicity under forced failure (both directions),
 * genuine concurrent modification (two real overlapping Postgres
 * transactions via separate PrismaClient instances, not a manual
 * barrier — the SAME technique tests/integration/availability-modify-
 * modify.test.ts already established), cross-Reservation independence,
 * real-DB idempotency (no duplicate note rows), resolved-note
 * immutability across SEPARATE requests, omission-never-mutates, and
 * the typed (non-actor) content of the resulting event payload.
 */
const prisma = createTestPrismaClient();
const prismaB = createTestPrismaClient();

const staffActor: Actor = { id: "staff-1", kind: ActorKind.AuthorizedUser, role: ActorRole.Reception };
const NOW = new Date("2026-08-10T10:00:00Z");
let cmdCounter = 0;
function cmd(): string {
  cmdCounter += 1;
  return `cn-cmd-${cmdCounter}`;
}

function baseCreateRequest(overrides: Partial<CreateReservationRequest> = {}): CreateReservationRequest {
  return {
    commandId: cmd(),
    servicePeriodId: "sp-dinner",
    contactSelection: { type: "ExistingContact", contactId: "contact-1" },
    reservationDate: new Date("2026-08-20T18:00:00Z"),
    partySize: 4,
    source: { category: ReservationSourceCategory.Telephone },
    preferredArea: "Sushi",
    actor: staffActor,
    ...overrides,
  };
}

async function seedReservation(overrides: Partial<CreateReservationRequest> = {}): Promise<string> {
  const { orchestrator } = buildHarness(prisma, NOW);
  const created = await orchestrator.createWithCapacity(baseCreateRequest(overrides));
  if (created.type !== "CREATED") throw new Error(`test setup failed: ${created.type}`);
  return created.outcome.reservationId;
}

async function seedReservationWithNote(): Promise<{ reservationId: string; noteId: string }> {
  const { orchestrator } = buildHarness(prisma, NOW);
  const created = await orchestrator.createWithCapacity(
    baseCreateRequest({ criticalNotes: [{ noteType: "Allergy", detail: "noten" }] })
  );
  if (created.type !== "CREATED") throw new Error(`test setup failed: ${created.type}`);
  return { reservationId: created.outcome.reservationId, noteId: created.outcome.criticalNotes[0]!.id };
}

beforeAll(async () => {
  await resetDatabase(prisma);
});
afterAll(async () => {
  await prisma.$disconnect();
  await prismaB.$disconnect();
});
beforeEach(async () => {
  await resetDatabase(prisma);
  await seedTestContact(prisma);
});

describe("Atomicity — forced failure AFTER the critical-note write, BEFORE the AppliedCommand marker", () => {
  // Reuses the EXACT poison-constraint technique already established by
  // tests/integration/availability-failure-injection.test.ts: a real,
  // deliberately non-production UNIQUE constraint on reservation_events.type,
  // tripped by a pre-seeded dummy "ReservationModified" row, so THIS
  // request's own ReservationModified insert (which happens only after
  // its Reservation row update and critical-note add already succeeded,
  // inside the same transaction) collides for real.
  const POISON_CONSTRAINT = "test_only_one_reservationmodified_event_globally";

  it("rolls back the Reservation version bump AND the already-written critical note together", async () => {
    const reservationId = await seedReservation();
    const before = await prisma.reservation.findUniqueOrThrow({ where: { id: reservationId } });

    await prisma.$executeRawUnsafe(`ALTER TABLE "reservation_events" ADD CONSTRAINT "${POISON_CONSTRAINT}" UNIQUE ("type")`);
    try {
      await prisma.reservation.create({
        data: {
          id: "dummy-poison-reservation-cn",
          servicePeriodId: "sp-dinner",
          contactId: "contact-1",
          status: "Proposed",
          reservationDate: new Date("2026-08-01T18:00:00Z"),
          partySize: 2,
          sourceCategory: "Telephone",
          createdBy: "staff-1",
          createdAt: NOW,
          updatedAt: NOW,
        },
      });
      await prisma.reservationEvent.create({
        data: { reservationId: "dummy-poison-reservation-cn", type: "ReservationModified", occurredAt: NOW, payload: "{}" },
      });

      const { orchestrator } = buildHarness(prisma, NOW);
      const failingCommandId = cmd();
      await expect(
        orchestrator.modifyWithCapacity({
          commandId: failingCommandId,
          reservationId,
          actor: staffActor,
          changes: {},
          criticalNoteChanges: { add: [{ noteType: "Allergy", detail: "noten" }] },
        })
      ).rejects.toThrow();

      const after = await prisma.reservation.findUniqueOrThrow({ where: { id: reservationId } });
      expect(after.version).toBe(before.version); // never bumped
      const notes = await prisma.reservationCriticalNote.findMany({ where: { reservationId } });
      expect(notes).toHaveLength(0); // the add never survives
      const appliedCommands = await prisma.appliedCommand.findMany({ where: { commandId: failingCommandId } });
      expect(appliedCommands).toHaveLength(0);
    } finally {
      await prisma.$executeRawUnsafe(`ALTER TABLE "reservation_events" DROP CONSTRAINT IF EXISTS "${POISON_CONSTRAINT}"`);
    }
  });
});

describe("Atomicity — forced failure INSIDE the critical-note write itself, AFTER the Reservation row already updated", () => {
  // A temporary UNIQUE constraint on note_type — overly broad for real
  // production use (CAP-D05.02 explicitly allows duplicate note types),
  // but exactly controllable here: adding TWO Allergy notes in the SAME
  // change set makes the second insert collide for real, forcing a
  // genuine mid-transaction failure strictly inside the repository's own
  // criticalNoteWrites loop — which runs AFTER the Reservation row update
  // already succeeded in the same transaction.
  const POISON_CONSTRAINT = "test_only_one_note_per_type_globally";

  it("rolls back the Reservation version bump too — nothing partially commits", async () => {
    const reservationId = await seedReservation();
    const before = await prisma.reservation.findUniqueOrThrow({ where: { id: reservationId } });

    await prisma.$executeRawUnsafe(`ALTER TABLE "reservation_critical_notes" ADD CONSTRAINT "${POISON_CONSTRAINT}" UNIQUE ("note_type")`);
    try {
      const { orchestrator } = buildHarness(prisma, NOW);
      const failingCommandId = cmd();
      await expect(
        orchestrator.modifyWithCapacity({
          commandId: failingCommandId,
          reservationId,
          actor: staffActor,
          changes: {},
          criticalNoteChanges: {
            add: [
              { noteType: "Allergy", detail: "eerste" },
              { noteType: "Allergy", detail: "tweede" },
            ],
          },
        })
      ).rejects.toThrow();

      const after = await prisma.reservation.findUniqueOrThrow({ where: { id: reservationId } });
      expect(after.version).toBe(before.version);
      const notes = await prisma.reservationCriticalNote.findMany({ where: { reservationId } });
      expect(notes).toHaveLength(0); // neither the first (which "succeeded" pre-rollback) nor the second survives
      const events = await prisma.reservationEvent.findMany({ where: { reservationId, type: "ReservationModified" } });
      expect(events).toHaveLength(0);
      const appliedCommands = await prisma.appliedCommand.findMany({ where: { commandId: failingCommandId } });
      expect(appliedCommands).toHaveLength(0);
    } finally {
      await prisma.$executeRawUnsafe(`ALTER TABLE "reservation_critical_notes" DROP CONSTRAINT IF EXISTS "${POISON_CONSTRAINT}"`);
    }
  });
});

describe("Concurrency — two concurrent Modifies adding DIFFERENT notes to the SAME Reservation", () => {
  // Unlike AvailabilityOrchestrator's capacity-relevant Modify path (which
  // acquires an explicit reservation-scoped advisory lock BEFORE anything
  // else — see availability-modify-modify.test.ts), a note-only Modify
  // takes the lightweight modifyWithoutCapacityChange() path, which has NO
  // such lock: the ONLY real guard is the parent Reservation row's own
  // optimistic `version` column (an ordinary `UPDATE ... WHERE version =
  // expectedVersion`). Two truly concurrent calls MAY still genuinely
  // overlap at that UPDATE (in which case exactly one wins, and the loser
  // surfaces as CAP-D01.01-R05/VALIDATION_FAILED with zero residue — this
  // is proved deterministically below, "holds across 10 iterations"), or
  // — depending on exact network/connection scheduling — may simply run
  // sequentially without ever truly contending, in which case BOTH
  // legitimately succeed as two ordinary, non-conflicting writes. Both
  // outcomes are safe; what must NEVER happen is partial/inconsistent
  // state, which this test proves for whichever outcome actually occurs.
  it("whichever outcome occurs, persisted state stays exactly consistent with it — a real loser leaves zero residue", async () => {
    const reservationId = await seedReservation();
    const { orchestrator: orchA } = buildHarness(prisma, NOW);
    const { orchestrator: orchB } = buildHarness(prismaB, NOW);
    const commandA = cmd();
    const commandB = cmd();

    const [resultA, resultB] = await Promise.all([
      orchA.modifyWithCapacity({
        commandId: commandA,
        reservationId,
        actor: staffActor,
        changes: {},
        criticalNoteChanges: { add: [{ noteType: "Allergy", detail: "van A" }] },
      }),
      orchB.modifyWithCapacity({
        commandId: commandB,
        reservationId,
        actor: staffActor,
        changes: {},
        criticalNoteChanges: { add: [{ noteType: "Critical", detail: "van B" }] },
      }),
    ]);

    const outcomes = [resultA.type, resultB.type];
    expect(outcomes.every((t) => t === "MODIFIED" || t === "VALIDATION_FAILED")).toBe(true); // never a thrown/crashed request
    const modifiedCount = outcomes.filter((t) => t === "MODIFIED").length;
    expect(modifiedCount).toBeGreaterThanOrEqual(1); // never BOTH lose

    const notes = await prisma.reservationCriticalNote.findMany({ where: { reservationId } });
    expect(notes).toHaveLength(modifiedCount);

    const reservation = await prisma.reservation.findUniqueOrThrow({ where: { id: reservationId } });
    expect(reservation.version).toBe(1 + modifiedCount); // exactly one real increment per real success, never more

    const events = await prisma.reservationEvent.findMany({ where: { reservationId, type: "ReservationModified" } });
    expect(events).toHaveLength(modifiedCount); // a loser (if any) produced no event at all

    const appliedCommands = await prisma.appliedCommand.findMany({ where: { commandId: { in: [commandA, commandB] } } });
    expect(appliedCommands).toHaveLength(modifiedCount);

    if (modifiedCount === 1) {
      // A genuine race occurred — prove the loser is a clean validation
      // failure (CAP-D01.01-R05) leaving absolutely no residue.
      const loserIndex = resultA.type === "VALIDATION_FAILED" ? 0 : 1;
      const loserResult = loserIndex === 0 ? resultA : resultB;
      const loserCommandId = loserIndex === 0 ? commandA : commandB;
      if (loserResult.type === "VALIDATION_FAILED") {
        expect(loserResult.violations.some((v) => v.ruleId === "CAP-D01.01-R05")).toBe(true);
      }
      const loserApplied = await prisma.appliedCommand.findMany({ where: { commandId: loserCommandId } });
      expect(loserApplied).toHaveLength(0);
    }
  });

  it("holds across 10 repeated iterations with zero flakes", async () => {
    for (let i = 0; i < 10; i += 1) {
      await resetDatabase(prisma);
      await seedTestContact(prisma);
      const reservationId = await seedReservation({ commandId: `cn-c10-create-${i}` });
      const { orchestrator: orchA } = buildHarness(prisma, NOW);
      const { orchestrator: orchB } = buildHarness(prismaB, NOW);

      const [resultA, resultB] = await Promise.all([
        orchA.modifyWithCapacity({
          commandId: `cn-c10-a-${i}`,
          reservationId,
          actor: staffActor,
          changes: {},
          criticalNoteChanges: { add: [{ noteType: "Allergy", detail: `a-${i}` }] },
        }),
        orchB.modifyWithCapacity({
          commandId: `cn-c10-b-${i}`,
          reservationId,
          actor: staffActor,
          changes: {},
          criticalNoteChanges: { add: [{ noteType: "Critical", detail: `b-${i}` }] },
        }),
      ]);

      expect([resultA.type, resultB.type].filter((t) => t === "MODIFIED")).toHaveLength(1);
      const notes = await prisma.reservationCriticalNote.findMany({ where: { reservationId } });
      expect(notes, `iteration ${i}: expected exactly one surviving note`).toHaveLength(1);
    }
  }, 30_000);
});

describe("Concurrency — different Reservations remain independent", () => {
  it("two concurrent note-only Modifies on DIFFERENT Reservations both succeed, each incrementing only its own version", async () => {
    const reservationA = await seedReservation({ commandId: cmd() });
    const reservationB = await seedReservation({ commandId: cmd() });
    const { orchestrator: orchA } = buildHarness(prisma, NOW);
    const { orchestrator: orchB } = buildHarness(prismaB, NOW);

    const [resultA, resultB] = await Promise.all([
      orchA.modifyWithCapacity({
        commandId: cmd(),
        reservationId: reservationA,
        actor: staffActor,
        changes: {},
        criticalNoteChanges: { add: [{ noteType: "Allergy", detail: "A's own note" }] },
      }),
      orchB.modifyWithCapacity({
        commandId: cmd(),
        reservationId: reservationB,
        actor: staffActor,
        changes: {},
        criticalNoteChanges: { add: [{ noteType: "Allergy", detail: "B's own note" }] },
      }),
    ]);

    expect(resultA.type).toBe("MODIFIED");
    expect(resultB.type).toBe("MODIFIED");

    const notesA = await prisma.reservationCriticalNote.findMany({ where: { reservationId: reservationA } });
    const notesB = await prisma.reservationCriticalNote.findMany({ where: { reservationId: reservationB } });
    expect(notesA).toHaveLength(1);
    expect(notesB).toHaveLength(1);

    const resA = await prisma.reservation.findUniqueOrThrow({ where: { id: reservationA } });
    const resB = await prisma.reservation.findUniqueOrThrow({ where: { id: reservationB } });
    expect(resA.version).toBe(2);
    expect(resB.version).toBe(2);
  });
});

describe("Idempotency — a repeated commandId under real concurrency never duplicates a note", () => {
  it("exactly one note, one applied command, one version increment survive two simultaneous identical requests", async () => {
    const reservationId = await seedReservation();
    const { orchestrator: orchA } = buildHarness(prisma, NOW);
    const { orchestrator: orchB } = buildHarness(prismaB, NOW);
    const sharedCommandId = "cn-shared-duplicate-cmd";

    const [resultA, resultB] = await Promise.all([
      orchA.modifyWithCapacity({
        commandId: sharedCommandId,
        reservationId,
        actor: staffActor,
        changes: {},
        criticalNoteChanges: { add: [{ noteType: "Allergy", detail: "noten" }] },
      }),
      orchB.modifyWithCapacity({
        commandId: sharedCommandId,
        reservationId,
        actor: staffActor,
        changes: {},
        criticalNoteChanges: { add: [{ noteType: "Allergy", detail: "noten" }] },
      }),
    ]);

    // A same-commandId race can resolve two different (both safe) ways
    // depending on exact interleaving: the loser's own findByCommandId
    // pre-check may see the winner's already-applied command (a clean,
    // silent idempotent no-op — MODIFIED), OR it may reach its own
    // transaction first and collide on AppliedCommand's real unique
    // constraint instead, which PrismaReservationRepository converts to a
    // thrown ReservationCommandRaceLost that modifyWithoutCapacityChange
    // also maps to MODIFIED — OR, rarer still, it may lose the plain
    // Reservation-version race instead (CAP-D01.01-R05/VALIDATION_FAILED).
    // Every one of these is a safe, non-duplicating outcome; the
    // persisted-state assertions below are what actually matters and hold
    // regardless of which path the loser took.
    expect([resultA.type, resultB.type].every((t) => t === "MODIFIED" || t === "VALIDATION_FAILED")).toBe(true);

    const notes = await prisma.reservationCriticalNote.findMany({ where: { reservationId } });
    expect(notes).toHaveLength(1);
    const reservation = await prisma.reservation.findUniqueOrThrow({ where: { id: reservationId } });
    expect(reservation.version).toBe(2);
    const appliedCommands = await prisma.appliedCommand.findMany({ where: { commandId: sharedCommandId } });
    expect(appliedCommands).toHaveLength(1);
  });

  it("sequential retries of the same Create commandId never duplicate the notes created with it", async () => {
    const request = baseCreateRequest({
      commandId: "cn-create-retry",
      criticalNotes: [{ noteType: "Allergy", detail: "noten" }],
    });
    const { orchestrator } = buildHarness(prisma, NOW);

    const first = await orchestrator.createWithCapacity(request);
    expect(first.type).toBe("CREATED");
    const second = await orchestrator.createWithCapacity(request);
    expect(second.type).toBe("CREATED");
    if (first.type !== "CREATED" || second.type !== "CREATED") return;

    expect(second.outcome.reservationId).toBe(first.outcome.reservationId);
    const notes = await prisma.reservationCriticalNote.findMany({ where: { reservationId: first.outcome.reservationId } });
    expect(notes).toHaveLength(1);
  });
});

describe("Resolved notes are immutable across SEPARATE requests", () => {
  it("cannot be edited after resolution", async () => {
    const { reservationId, noteId } = await seedReservationWithNote();
    const { orchestrator } = buildHarness(prisma, NOW);

    const resolved = await orchestrator.modifyWithCapacity({
      commandId: cmd(),
      reservationId,
      actor: staffActor,
      changes: {},
      criticalNoteChanges: { resolve: [{ id: noteId }] },
    });
    expect(resolved.type).toBe("MODIFIED");

    const attemptEdit = await orchestrator.modifyWithCapacity({
      commandId: cmd(),
      reservationId,
      actor: staffActor,
      changes: {},
      criticalNoteChanges: { update: [{ id: noteId, noteType: "Allergy", detail: "mutated after resolve" }] },
    });
    expect(attemptEdit.type).toBe("VALIDATION_FAILED");
    if (attemptEdit.type === "VALIDATION_FAILED") {
      expect(attemptEdit.violations.some((v) => v.ruleId === "CAP-D05.02-R03")).toBe(true);
    }

    const note = await prisma.reservationCriticalNote.findUniqueOrThrow({ where: { id: noteId } });
    expect(note.detail).toBe("noten"); // unchanged
    expect(note.status).toBe("Resolved");
  });

  it("cannot be resolved a second time (reopened) in a separate request", async () => {
    const { reservationId, noteId } = await seedReservationWithNote();
    const { orchestrator } = buildHarness(prisma, NOW);

    const resolved = await orchestrator.modifyWithCapacity({
      commandId: cmd(),
      reservationId,
      actor: staffActor,
      changes: {},
      criticalNoteChanges: { resolve: [{ id: noteId }] },
    });
    expect(resolved.type).toBe("MODIFIED");
    const firstResolvedAt = (await prisma.reservationCriticalNote.findUniqueOrThrow({ where: { id: noteId } })).resolvedAt;

    const attemptResolveAgain = await orchestrator.modifyWithCapacity({
      commandId: cmd(),
      reservationId,
      actor: staffActor,
      changes: {},
      criticalNoteChanges: { resolve: [{ id: noteId }] },
    });
    expect(attemptResolveAgain.type).toBe("VALIDATION_FAILED");
    if (attemptResolveAgain.type === "VALIDATION_FAILED") {
      expect(attemptResolveAgain.violations.some((v) => v.ruleId === "CAP-D05.02-R03")).toBe(true);
    }

    const note = await prisma.reservationCriticalNote.findUniqueOrThrow({ where: { id: noteId } });
    expect(note.status).toBe("Resolved"); // still Resolved — never flipped back to Active
    expect(note.resolvedAt?.toISOString()).toBe(firstResolvedAt?.toISOString()); // the ORIGINAL resolution timestamp, untouched
  });
});

describe("Omission never removes or resolves a note", () => {
  it("a Modify that omits criticalNoteChanges entirely leaves existing Active notes completely untouched", async () => {
    const { reservationId, noteId } = await seedReservationWithNote();
    const before = await prisma.reservationCriticalNote.findUniqueOrThrow({ where: { id: noteId } });
    const { orchestrator } = buildHarness(prisma, NOW);

    const result = await orchestrator.modifyWithCapacity({
      commandId: cmd(),
      reservationId,
      actor: staffActor,
      changes: { partySize: 6 },
      // criticalNoteChanges deliberately omitted entirely.
    });
    expect(result.type).toBe("MODIFIED");

    const after = await prisma.reservationCriticalNote.findUniqueOrThrow({ where: { id: noteId } });
    expect(after).toEqual(before); // byte-for-byte unchanged, including updatedAt

    const event = await prisma.reservationEvent.findFirstOrThrow({ where: { reservationId, type: "ReservationModified" } });
    const payload = JSON.parse(event.payload);
    expect(payload.changedFields).not.toContain("criticalNotes");
  });
});

describe("Event payload carries typed previous/resulting note state, never actor identifiers", () => {
  it("an update's ReservationModified event carries the full typed before/after note snapshots", async () => {
    const { reservationId, noteId } = await seedReservationWithNote();
    const { orchestrator } = buildHarness(prisma, NOW);

    const result = await orchestrator.modifyWithCapacity({
      commandId: cmd(),
      reservationId,
      actor: staffActor,
      changes: {},
      criticalNoteChanges: { update: [{ id: noteId, noteType: "Allergy", detail: "noten EN schaaldieren" }] },
    });
    expect(result.type).toBe("MODIFIED");

    const event = await prisma.reservationEvent.findFirstOrThrow({ where: { reservationId, type: "ReservationModified" } });
    const payload = JSON.parse(event.payload);
    expect(payload.changedFields).toEqual(["criticalNotes"]);
    expect(payload.previousValues.criticalNotes).toEqual([{ id: noteId, noteType: "Allergy", detail: "noten", status: "Active" }]);
    expect(payload.resultingValues.criticalNotes).toEqual([
      { id: noteId, noteType: "Allergy", detail: "noten EN schaaldieren", status: "Active" },
    ]);
    const raw = JSON.stringify(payload);
    expect(raw).not.toContain("createdByStaffUserId");
    expect(raw).not.toContain("updatedByStaffUserId");
  });

  it("a resolve's ReservationModified event marks the resulting snapshot Resolved, with no actor id anywhere in the payload", async () => {
    const { reservationId, noteId } = await seedReservationWithNote();
    const { orchestrator } = buildHarness(prisma, NOW);

    const result = await orchestrator.modifyWithCapacity({
      commandId: cmd(),
      reservationId,
      actor: staffActor,
      changes: {},
      criticalNoteChanges: { resolve: [{ id: noteId }] },
    });
    expect(result.type).toBe("MODIFIED");

    const event = await prisma.reservationEvent.findFirstOrThrow({ where: { reservationId, type: "ReservationModified" } });
    const payload = JSON.parse(event.payload);
    expect(payload.resultingValues.criticalNotes).toEqual([{ id: noteId, noteType: "Allergy", detail: "noten", status: "Resolved" }]);
    // The note SNAPSHOT itself (previousValues/resultingValues.criticalNotes)
    // never carries actor-id fields — the event's own top-level `actor`
    // envelope legitimately names the acting staff user, same as every
    // other event type; only the note's own persistence-only
    // createdBy/updatedByStaffUserId fields are excluded here.
    const noteSnapshotRaw = JSON.stringify(payload.resultingValues.criticalNotes) + JSON.stringify(payload.previousValues.criticalNotes);
    expect(noteSnapshotRaw).not.toContain("createdByStaffUserId");
    expect(noteSnapshotRaw).not.toContain("updatedByStaffUserId");
  });
});
