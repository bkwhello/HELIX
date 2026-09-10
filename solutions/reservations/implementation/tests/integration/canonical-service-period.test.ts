import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { buildHarness, resetDatabase, seedTestContact } from "./support/testHarness.js";
import { createTestPrismaClient } from "./support/testDatabaseSafety.js";
import { CanonicalServicePeriodReader } from "../../infrastructure/CanonicalServicePeriodReader.js";
import { Actor, ActorKind, ActorRole } from "../../domain/value-objects/Actor.js";
import { ReservationSourceCategory } from "../../domain/value-objects/ReservationSource.js";
import { CreateReservationRequest } from "../../application/command-handlers/CreateReservationHandler.js";

/**
 * R1.6-P2B — Canonical Service Code Boundary. HTTP-adjacent (application-
 * layer, real PostgreSQL) coverage for the real CanonicalServicePeriodReader,
 * wired via buildHarness's servicePeriodReader override — every OTHER
 * integration test in this suite keeps using the always-valid
 * UnvalidatedServicePeriodReader default and is unaffected (see this
 * file's own STOP-gate report, "Fixture impact").
 *
 * 2026-08-20T18:00:00Z / 2026-08-21T11:00:00Z are chosen because they are
 * unambiguous, real dinner/lunch instants in Europe/Amsterdam (August,
 * CEST, UTC+2) — 18:00Z -> 20:00 local (dinner), 11:00Z -> 13:00 local
 * (lunch). enforceServicePeriod is left at its default (false), so the
 * separate R1.6-C0 booking-window mechanism never interferes with what
 * this file is actually testing.
 */
const prisma = createTestPrismaClient();
const staffActor: Actor = { id: "staff-1", kind: ActorKind.AuthorizedUser, role: ActorRole.Reception };
const DINNER_INSTANT = new Date("2026-08-20T18:00:00Z");
const LUNCH_INSTANT = new Date("2026-08-21T11:00:00Z");
const NOW = new Date("2026-08-10T10:00:00Z");

let cmdCounter = 0;
function cmd(): string {
  cmdCounter += 1;
  return `canon-sp-cmd-${cmdCounter}`;
}

function baseCreateRequest(overrides: Partial<CreateReservationRequest> = {}): CreateReservationRequest {
  return {
    commandId: cmd(),
    servicePeriodId: "dinner",
    contactSelection: { type: "ExistingContact", contactId: "contact-1" },
    reservationDate: DINNER_INSTANT,
    partySize: 2,
    source: { category: ReservationSourceCategory.Telephone },
    preferredArea: "Sushi",
    actor: staffActor,
    ...overrides,
  };
}

function harness() {
  return buildHarness(prisma, NOW, { servicePeriodReader: new CanonicalServicePeriodReader() });
}

beforeAll(async () => {
  await resetDatabase(prisma);
});
afterAll(async () => {
  await prisma.$disconnect();
});
beforeEach(async () => {
  await resetDatabase(prisma);
  await seedTestContact(prisma);
});

describe("Create — canonical Service-code validation", () => {
  it("succeeds when servicePeriodId is the matching canonical code — dinner", async () => {
    const { orchestrator } = harness();
    const result = await orchestrator.createWithCapacity(baseCreateRequest({ servicePeriodId: "dinner", reservationDate: DINNER_INSTANT }));
    expect(result.type).toBe("CREATED");
  });

  it("succeeds when servicePeriodId is the matching canonical code — lunch", async () => {
    const { orchestrator } = harness();
    const result = await orchestrator.createWithCapacity(baseCreateRequest({ servicePeriodId: "lunch", reservationDate: LUNCH_INSTANT }));
    expect(result.type).toBe("CREATED");
  });

  it("rejects an unknown code, not just a mismatched one", async () => {
    const { orchestrator } = harness();
    const result = await orchestrator.createWithCapacity(baseCreateRequest({ servicePeriodId: "brunch", reservationDate: DINNER_INSTANT }));
    expect(result.type).toBe("VALIDATION_FAILED");
    if (result.type !== "VALIDATION_FAILED") throw new Error("unreachable");
    expect(result.violations.some((v) => v.ruleId === "CAP-D01.01-R06")).toBe(true);
  });

  it("rejects a mismatched canonical code — lunch supplied for a dinner-time reservation", async () => {
    const { orchestrator } = harness();
    const result = await orchestrator.createWithCapacity(baseCreateRequest({ servicePeriodId: "lunch", reservationDate: DINNER_INSTANT }));
    expect(result.type).toBe("VALIDATION_FAILED");
  });

  it("never silently normalizes client input — a rejected create writes no Reservation row", async () => {
    const { orchestrator } = harness();
    const before = await prisma.reservation.count();
    await orchestrator.createWithCapacity(baseCreateRequest({ servicePeriodId: "brunch", reservationDate: DINNER_INSTANT }));
    expect(await prisma.reservation.count()).toBe(before);
  });
});

describe("Modify — canonical Service-code derivation and validation", () => {
  it("a changed reservationDate with servicePeriodId omitted derives and persists the new canonical code", async () => {
    const { orchestrator } = harness();
    const created = await orchestrator.createWithCapacity(baseCreateRequest());
    if (created.type !== "CREATED") throw new Error("unreachable");

    const result = await orchestrator.modifyWithCapacity({
      commandId: cmd(),
      reservationId: created.outcome.reservationId,
      actor: staffActor,
      changes: { reservationDate: LUNCH_INSTANT },
    });
    expect(result.type).toBe("MODIFIED");

    const row = await prisma.reservation.findUniqueOrThrow({ where: { id: created.outcome.reservationId } });
    expect(row.servicePeriodId).toBe("lunch");
    expect(row.reservationDate.toISOString()).toBe(LUNCH_INSTANT.toISOString());
  });

  it("an explicit mismatched servicePeriodId on a date change rejects atomically — no Reservation or CapacityCommitment mutation", async () => {
    const { orchestrator } = harness();
    const created = await orchestrator.createWithCapacity(baseCreateRequest());
    if (created.type !== "CREATED") throw new Error("unreachable");
    const reservationId = created.outcome.reservationId;

    const before = await prisma.reservation.findUniqueOrThrow({ where: { id: reservationId } });
    const commitmentsBefore = await prisma.capacityCommitment.findMany({ where: { reservationId } });

    const result = await orchestrator.modifyWithCapacity({
      commandId: cmd(),
      reservationId,
      actor: staffActor,
      // LUNCH_INSTANT is a real lunch-time instant; "dinner" is a
      // deliberate mismatch against it.
      changes: { reservationDate: LUNCH_INSTANT, servicePeriodId: "dinner" },
    });
    expect(result.type).toBe("VALIDATION_FAILED");

    const after = await prisma.reservation.findUniqueOrThrow({ where: { id: reservationId } });
    expect(after.reservationDate.toISOString()).toBe(before.reservationDate.toISOString());
    expect(after.servicePeriodId).toBe(before.servicePeriodId);
    expect(after.version).toBe(before.version);
    const commitmentsAfter = await prisma.capacityCommitment.findMany({ where: { reservationId } });
    expect(commitmentsAfter).toEqual(commitmentsBefore);
  });

  it("a snapshot-only/unrelated modification preserves an existing legacy (noncanonical) servicePeriodId untouched", async () => {
    const { orchestrator } = harness();
    const created = await orchestrator.createWithCapacity(baseCreateRequest());
    if (created.type !== "CREATED") throw new Error("unreachable");
    const reservationId = created.outcome.reservationId;

    // Simulate a pre-R1.6-P2B legacy row: a stored value that was never
    // canonical to begin with (matches real historical values found in
    // this repository's own dev database and test fixtures — see the
    // R1.6-P2B STOP-gate report's evidence section).
    await prisma.reservation.update({ where: { id: reservationId }, data: { servicePeriodId: "sp-legacy-value" } });

    const result = await orchestrator.modifyWithCapacity({
      commandId: cmd(),
      reservationId,
      actor: staffActor,
      changes: { notes: "Allergic to shellfish" },
    });
    expect(result.type).toBe("MODIFIED");

    const row = await prisma.reservation.findUniqueOrThrow({ where: { id: reservationId } });
    expect(row.servicePeriodId).toBe("sp-legacy-value");
    expect(row.notes).toBe("Allergic to shellfish");
  });

  it("an explicit servicePeriodId supplied without a date change is still validated against the current effective date", async () => {
    const { orchestrator } = harness();
    const created = await orchestrator.createWithCapacity(baseCreateRequest({ servicePeriodId: "dinner", reservationDate: DINNER_INSTANT }));
    if (created.type !== "CREATED") throw new Error("unreachable");
    const reservationId = created.outcome.reservationId;

    const result = await orchestrator.modifyWithCapacity({
      commandId: cmd(),
      reservationId,
      actor: staffActor,
      // No reservationDate change — the CURRENT date (dinner) stays in
      // effect, so an explicit "lunch" here is still a real mismatch.
      changes: { servicePeriodId: "lunch" },
    });
    expect(result.type).toBe("VALIDATION_FAILED");

    const row = await prisma.reservation.findUniqueOrThrow({ where: { id: reservationId } });
    expect(row.servicePeriodId).toBe("dinner");
  });
});

describe("Walk-ins — canonical Service code, never the old inert sentinel", () => {
  it("persists lunch or dinner, matching the walk-in's own instant, never the literal \"walk-in\"", async () => {
    const { orchestrator, clock } = harness();
    clock.set(LUNCH_INSTANT);

    const result = await orchestrator.createImmediateWalkIn({
      commandId: cmd(),
      contactSelection: { displayName: "Walk-in Guest" },
      partySize: 2,
      preferredArea: "Sushi",
      resources: [],
      actor: staffActor,
    });
    expect(result.type === "CREATED_AND_SEATED" || result.type === "CREATED_UNSEATED").toBe(true);
    if (result.type !== "CREATED_AND_SEATED" && result.type !== "CREATED_UNSEATED") throw new Error("unreachable");

    const row = await prisma.reservation.findUniqueOrThrow({ where: { id: result.outcome.reservationId } });
    expect(row.servicePeriodId).toBe("lunch");
    expect(row.servicePeriodId).not.toBe("walk-in");
  });

  it("derives dinner for a dinner-time walk-in", async () => {
    const { orchestrator, clock } = harness();
    clock.set(DINNER_INSTANT);

    const result = await orchestrator.createImmediateWalkIn({
      commandId: cmd(),
      contactSelection: { displayName: "Walk-in Guest" },
      partySize: 2,
      preferredArea: "Sushi",
      resources: [],
      actor: staffActor,
    });
    if (result.type !== "CREATED_AND_SEATED" && result.type !== "CREATED_UNSEATED") throw new Error("unreachable");

    const row = await prisma.reservation.findUniqueOrThrow({ where: { id: result.outcome.reservationId } });
    expect(row.servicePeriodId).toBe("dinner");
  });
});
