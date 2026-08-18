import { PrismaClient } from "@prisma/client";
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { buildHarness, resetDatabase } from "./support/testHarness.js";
import { Actor, ActorKind, ActorRole } from "../../domain/value-objects/Actor.js";
import { ReservationSourceCategory } from "../../domain/value-objects/ReservationSource.js";
import { CreateReservationRequest } from "../../application/command-handlers/CreateReservationHandler.js";

/**
 * R1.1 P0 fix — Concurrent Modify vs Modify (see
 * R1_1_CONCURRENT_MODIFY_FIX_REPORT.md). Before the fix, two concurrent
 * Modify calls on the same reservation could both act on the SAME stale
 * pre-transaction snapshot of "the active commitment," each superseding
 * it and creating their own new Committed row — leaving TWO Committed
 * commitments for one reservation (INV-01/INV-03 violated). The fix adds
 * a reservation-scoped advisory lock, acquired first, and moves the
 * active-commitment re-read inside the transaction.
 *
 * All scenarios use separate PrismaClient instances per concurrent actor
 * — genuinely simultaneous PostgreSQL transactions, not sequential calls.
 */
const prisma = new PrismaClient();
const prismaB = new PrismaClient();
const prismaC = new PrismaClient();

const staffActor: Actor = { id: "staff-1", kind: ActorKind.AuthorizedUser, role: ActorRole.Reception };
const NOW = new Date("2026-08-10T10:00:00Z");
let cmdCounter = 0;
function cmd(): string {
  cmdCounter += 1;
  return `mm-cmd-${cmdCounter}`;
}

function baseCreateRequest(overrides: Partial<CreateReservationRequest> = {}): CreateReservationRequest {
  return {
    commandId: cmd(),
    servicePeriodId: "sp-dinner",
    contactId: "contact-1",
    reservationDate: new Date("2026-08-20T18:00:00Z"),
    partySize: 4,
    source: { category: ReservationSourceCategory.Telephone },
    preferredArea: "Sushi",
    actor: staffActor,
    ...overrides,
  };
}

/** Every scenario needs an existing capacity-managed reservation to modify concurrently. */
async function seedReservation(overrides: Partial<CreateReservationRequest> = {}): Promise<string> {
  const { orchestrator } = buildHarness(prisma, NOW);
  const created = await orchestrator.createWithCapacity(baseCreateRequest(overrides));
  if (created.type !== "CREATED") throw new Error(`test setup failed: ${created.type}`);
  return created.outcome.reservationId;
}

async function committedCommitments(reservationId: string) {
  return prisma.capacityCommitment.findMany({ where: { reservationId, status: "Committed" } });
}

beforeAll(async () => {
  await resetDatabase(prisma);
});
afterAll(async () => {
  await prisma.$disconnect();
  await prismaB.$disconnect();
  await prismaC.$disconnect();
});
beforeEach(async () => {
  await resetDatabase(prisma);
});

describe("Modify vs Modify — Scenario A: same pool, time change vs time change", () => {
  it("leaves exactly one Committed commitment, matching the winning reservation state", async () => {
    const reservationId = await seedReservation();
    const { orchestrator: orchA } = buildHarness(prisma, NOW);
    const { orchestrator: orchB } = buildHarness(prismaB, NOW);

    const [resultA, resultB] = await Promise.all([
      orchA.modifyWithCapacity({
        commandId: cmd(),
        reservationId,
        actor: staffActor,
        changes: { reservationDate: new Date("2026-08-20T19:00:00Z") },
        isServicePeriodStillValid: true,
      }),
      orchB.modifyWithCapacity({
        commandId: cmd(),
        reservationId,
        actor: staffActor,
        changes: { reservationDate: new Date("2026-08-20T20:00:00Z") },
        isServicePeriodStillValid: true,
      }),
    ]);

    expect([resultA.type, resultB.type].every((t) => t === "MODIFIED")).toBe(true);

    const committed = await committedCommitments(reservationId);
    expect(committed).toHaveLength(1);

    const reservation = await prisma.reservation.findUniqueOrThrow({ where: { id: reservationId } });
    expect(committed[0]?.startTime.toISOString()).toBe(reservation.reservationDate.toISOString());
  });
});

describe("Modify vs Modify — Scenario B: same pool, party-size change vs party-size change", () => {
  it("leaves exactly one Committed commitment, matching the winning party size", async () => {
    const reservationId = await seedReservation();
    const { orchestrator: orchA } = buildHarness(prisma, NOW);
    const { orchestrator: orchB } = buildHarness(prismaB, NOW);

    const [resultA, resultB] = await Promise.all([
      orchA.modifyWithCapacity({ commandId: cmd(), reservationId, actor: staffActor, changes: { partySize: 5 } }),
      orchB.modifyWithCapacity({ commandId: cmd(), reservationId, actor: staffActor, changes: { partySize: 6 } }),
    ]);

    expect([resultA.type, resultB.type].every((t) => t === "MODIFIED")).toBe(true);

    const committed = await committedCommitments(reservationId);
    expect(committed).toHaveLength(1);

    const reservation = await prisma.reservation.findUniqueOrThrow({ where: { id: reservationId } });
    expect(committed[0]?.partySize).toBe(reservation.partySize);
  });
});

describe("Modify vs Modify — Scenario C: cross-pool Modify vs cross-pool Modify (the exact originally-reported P0 shape)", () => {
  it("never leaves two Committed commitments for one reservation", async () => {
    const reservationId = await seedReservation(); // Sushi
    const { orchestrator: orchA } = buildHarness(prisma, NOW);
    const { orchestrator: orchB } = buildHarness(prismaB, NOW);

    const [resultA, resultB] = await Promise.all([
      orchA.modifyWithCapacity({ commandId: cmd(), reservationId, actor: staffActor, changes: { preferredArea: "Teppanyaki" } }),
      orchB.modifyWithCapacity({ commandId: cmd(), reservationId, actor: staffActor, changes: { preferredArea: "Teppanyaki" } }),
    ]);

    expect([resultA.type, resultB.type].every((t) => t === "MODIFIED")).toBe(true);

    const committed = await committedCommitments(reservationId);
    expect(committed).toHaveLength(1);
    expect(committed[0]?.capacityPoolId).toBe("Teppanyaki");

    const allForReservation = await prisma.capacityCommitment.findMany({ where: { reservationId } });
    // Original commitment plus however many the two Modifies produced —
    // all but the one Committed row must be Superseded, never Committed.
    expect(allForReservation.filter((r) => r.status === "Committed")).toHaveLength(1);
    expect(allForReservation.every((r) => r.status === "Committed" || r.status === "Superseded")).toBe(true);
  });

  it("holds across 20 repeated iterations with zero flakes", async () => {
    for (let i = 0; i < 20; i += 1) {
      await resetDatabase(prisma);
      const reservationId = await seedReservation({ commandId: `mm-c20-create-${i}` });
      const { orchestrator: orchA } = buildHarness(prisma, NOW);
      const { orchestrator: orchB } = buildHarness(prismaB, NOW);

      const [resultA, resultB] = await Promise.all([
        orchA.modifyWithCapacity({ commandId: `mm-c20-a-${i}`, reservationId, actor: staffActor, changes: { preferredArea: "Teppanyaki" } }),
        orchB.modifyWithCapacity({ commandId: `mm-c20-b-${i}`, reservationId, actor: staffActor, changes: { preferredArea: "Teppanyaki" } }),
      ]);

      expect([resultA.type, resultB.type].every((t) => t === "MODIFIED")).toBe(true);

      const committed = await committedCommitments(reservationId);
      expect(committed, `iteration ${i}: expected exactly one Committed commitment`).toHaveLength(1);
    }
  }, 30_000);
});

describe("Modify vs Modify — Scenario D: cross-date Modify vs Modify", () => {
  it("never leaves two Committed commitments when both target different dates", async () => {
    const reservationId = await seedReservation();
    const { orchestrator: orchA } = buildHarness(prisma, NOW);
    const { orchestrator: orchB } = buildHarness(prismaB, NOW);

    const [resultA, resultB] = await Promise.all([
      orchA.modifyWithCapacity({
        commandId: cmd(),
        reservationId,
        actor: staffActor,
        changes: { reservationDate: new Date("2026-08-21T18:00:00Z") },
        isServicePeriodStillValid: true,
      }),
      orchB.modifyWithCapacity({
        commandId: cmd(),
        reservationId,
        actor: staffActor,
        changes: { reservationDate: new Date("2026-08-22T18:00:00Z") },
        isServicePeriodStillValid: true,
      }),
    ]);

    expect([resultA.type, resultB.type].every((t) => t === "MODIFIED")).toBe(true);

    const committed = await committedCommitments(reservationId);
    expect(committed).toHaveLength(1);
  });
});

describe("Modify vs Modify — Scenario E: Modify vs Cancel regression (previously classified SAFE)", () => {
  it("confirms the classification still holds with the reservation lock in place", async () => {
    const reservationId = await seedReservation();
    const { orchestrator: orchA } = buildHarness(prisma, NOW);
    const { orchestrator: orchB } = buildHarness(prismaB, NOW);

    const [modifyResult, cancelResult] = await Promise.all([
      orchA.modifyWithCapacity({ commandId: cmd(), reservationId, actor: staffActor, changes: { preferredArea: "Teppanyaki" } }),
      orchB.cancelWithCapacity({ commandId: cmd(), reservationId, actor: staffActor }),
    ]);

    expect(cancelResult.type).toBe("CANCELLED");
    expect(["MODIFIED", "VALIDATION_FAILED"]).toContain(modifyResult.type);

    const committed = await committedCommitments(reservationId);
    expect(committed).toHaveLength(0);

    const reservation = await prisma.reservation.findUniqueOrThrow({ where: { id: reservationId } });
    expect(reservation.status).toBe("Cancelled");
  });
});

describe("Modify vs Modify — Scenario F: three concurrent Modify commands", () => {
  it("leaves at most one active commitment after three-way contention", async () => {
    const reservationId = await seedReservation();
    const { orchestrator: orchA } = buildHarness(prisma, NOW);
    const { orchestrator: orchB } = buildHarness(prismaB, NOW);
    const { orchestrator: orchC } = buildHarness(prismaC, NOW);

    const results = await Promise.all([
      orchA.modifyWithCapacity({ commandId: cmd(), reservationId, actor: staffActor, changes: { partySize: 5 } }),
      orchB.modifyWithCapacity({ commandId: cmd(), reservationId, actor: staffActor, changes: { partySize: 6 } }),
      orchC.modifyWithCapacity({ commandId: cmd(), reservationId, actor: staffActor, changes: { preferredArea: "Teppanyaki", partySize: 7 } }),
    ]);

    expect(results.every((r) => r.type === "MODIFIED")).toBe(true);

    const committed = await committedCommitments(reservationId);
    expect(committed.length).toBeLessThanOrEqual(1);
    expect(committed).toHaveLength(1);

    const reservation = await prisma.reservation.findUniqueOrThrow({ where: { id: reservationId } });
    expect(committed[0]?.partySize).toBe(reservation.partySize);
    expect(committed[0]?.capacityPoolId).toBe(reservation.preferredArea);
  });
});

describe("Modify vs Modify — Scenario G: duplicate commandId", () => {
  it("is idempotent under real concurrency: exactly one Committed commitment, one applied command", async () => {
    const reservationId = await seedReservation();
    const { orchestrator: orchA } = buildHarness(prisma, NOW);
    const { orchestrator: orchB } = buildHarness(prismaB, NOW);
    const sharedCommandId = "mm-shared-duplicate-cmd";

    const [resultA, resultB] = await Promise.all([
      orchA.modifyWithCapacity({ commandId: sharedCommandId, reservationId, actor: staffActor, changes: { partySize: 6 } }),
      orchB.modifyWithCapacity({ commandId: sharedCommandId, reservationId, actor: staffActor, changes: { partySize: 6 } }),
    ]);

    expect([resultA.type, resultB.type].every((t) => t === "MODIFIED")).toBe(true);

    const committed = await committedCommitments(reservationId);
    expect(committed).toHaveLength(1);
    expect(committed[0]?.partySize).toBe(6);

    const appliedCommands = await prisma.appliedCommand.findMany({ where: { commandId: sharedCommandId } });
    expect(appliedCommands).toHaveLength(1);
  });
});
