import { PrismaClient } from "@prisma/client";
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { buildHarness, resetDatabase } from "./support/testHarness.js";
import { Actor, ActorKind, ActorRole } from "../../domain/value-objects/Actor.js";
import { ReservationSourceCategory } from "../../domain/value-objects/ReservationSource.js";
import { CreateReservationRequest } from "../../application/command-handlers/CreateReservationHandler.js";

/**
 * CAP-D02.03 — the mandatory real-PostgreSQL concurrency matrix
 * (assignment §24). Each test uses a SEPARATE PrismaClient per concurrent
 * "actor" (a real, independent connection — this is the only way to get
 * two genuinely simultaneous PostgreSQL transactions contending on the
 * same pg_advisory_xact_lock; a single client's $transaction calls cannot
 * overlap on one connection).
 */
const prisma = new PrismaClient();
const prismaB = new PrismaClient();

const staffActor: Actor = { id: "staff-1", kind: ActorKind.AuthorizedUser, role: ActorRole.Reception };
const NOW = new Date("2026-08-10T10:00:00Z");
let cmdCounter = 0;
function cmd(): string {
  cmdCounter += 1;
  return `race-cmd-${cmdCounter}`;
}

function baseRequest(overrides: Partial<CreateReservationRequest> = {}): CreateReservationRequest {
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

async function seedCommitment(input: { commitmentId: string; partySize: number; commandId: string }): Promise<void> {
  await prisma.capacityCommitment.create({
    data: {
      commitmentId: input.commitmentId,
      capacityPoolId: "Sushi",
      startTime: new Date("2026-08-20T18:00:00Z"),
      endTime: new Date("2026-08-20T19:30:00Z"),
      partySize: input.partySize,
      status: "Committed",
      commandId: input.commandId,
    },
  });
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
});

describe("Concurrency — final-capacity race (general)", () => {
  it("of two concurrent requests that together exceed remaining capacity, exactly one succeeds", async () => {
    await seedCommitment({ commitmentId: "seed", partySize: 45, commandId: "seed-cmd" });
    const { orchestrator: orchA } = buildHarness(prisma, NOW);
    const { orchestrator: orchB } = buildHarness(prismaB, NOW);

    const [resultA, resultB] = await Promise.all([
      orchA.createWithCapacity(baseRequest({ partySize: 10 })),
      orchB.createWithCapacity(baseRequest({ partySize: 10 })),
    ]);

    const outcomes = [resultA.type, resultB.type].sort();
    expect(outcomes).toEqual(["CAPACITY_UNAVAILABLE", "CREATED"]);

    const committed = await prisma.capacityCommitment.findMany({ where: { status: "Committed" } });
    expect(committed).toHaveLength(2); // seed + exactly one winner
    const totalOccupancy = committed.reduce((sum, r) => sum + r.partySize, 0);
    expect(totalOccupancy).toBeLessThanOrEqual(60);
  });
});

describe("Concurrency — exact-final-capacity race (boundary)", () => {
  it("of two concurrent requests where only one can land exactly at capacity, exactly one succeeds and lands at exactly 60", async () => {
    await seedCommitment({ commitmentId: "seed", partySize: 52, commandId: "seed-cmd" });
    const { orchestrator: orchA } = buildHarness(prisma, NOW);
    const { orchestrator: orchB } = buildHarness(prismaB, NOW);

    const [resultA, resultB] = await Promise.all([
      orchA.createWithCapacity(baseRequest({ partySize: 8 })),
      orchB.createWithCapacity(baseRequest({ partySize: 8 })),
    ]);

    const outcomes = [resultA.type, resultB.type].sort();
    expect(outcomes).toEqual(["CAPACITY_UNAVAILABLE", "CREATED"]);

    const committed = await prisma.capacityCommitment.findMany({ where: { status: "Committed" } });
    const totalOccupancy = committed.reduce((sum, r) => sum + r.partySize, 0);
    expect(totalOccupancy).toBe(60); // the winner lands EXACTLY at capacity, never over
  });
});

describe("Concurrency — two non-conflicting concurrent creates", () => {
  it("both succeed when there is room for both, proving the advisory lock only serializes rather than falsely rejecting", async () => {
    const { orchestrator: orchA } = buildHarness(prisma, NOW);
    const { orchestrator: orchB } = buildHarness(prismaB, NOW);

    const [resultA, resultB] = await Promise.all([
      orchA.createWithCapacity(baseRequest({ partySize: 10 })),
      orchB.createWithCapacity(baseRequest({ partySize: 10 })),
    ]);

    expect(resultA.type).toBe("CREATED");
    expect(resultB.type).toBe("CREATED");

    const committed = await prisma.capacityCommitment.findMany({ where: { status: "Committed" } });
    expect(committed).toHaveLength(2);
    expect(committed.reduce((sum, r) => sum + r.partySize, 0)).toBe(20);
  });
});

describe("Concurrency — duplicate commandId", () => {
  it("of two concurrent creates sharing the same commandId, only one reservation and one capacity commitment are ever persisted", async () => {
    const { orchestrator: orchA } = buildHarness(prisma, NOW);
    const { orchestrator: orchB } = buildHarness(prismaB, NOW);
    const sharedCommandId = "shared-duplicate-cmd";

    const [resultA, resultB] = await Promise.all([
      orchA.createWithCapacity(baseRequest({ commandId: sharedCommandId, partySize: 6 })),
      orchB.createWithCapacity(baseRequest({ commandId: sharedCommandId, partySize: 6 })),
    ]);

    expect(resultA.type).toBe("CREATED");
    expect(resultB.type).toBe("CREATED");
    if (resultA.type === "CREATED" && resultB.type === "CREATED") {
      expect(resultA.outcome.reservationId).toBe(resultB.outcome.reservationId);
    }

    const reservations = await prisma.reservation.findMany();
    expect(reservations).toHaveLength(1);
    const committed = await prisma.capacityCommitment.findMany({ where: { status: "Committed" } });
    expect(committed).toHaveLength(1);
    expect(committed[0]?.partySize).toBe(6);
    const appliedCommands = await prisma.appliedCommand.findMany({ where: { commandId: sharedCommandId } });
    expect(appliedCommands).toHaveLength(1);
  });
});

describe("Concurrency — Modify vs Create", () => {
  it("of a concurrent Modify (party size increase) and a new Create for the same pool/date, exactly one exceeds capacity and is rejected", async () => {
    const { orchestrator: setupOrch } = buildHarness(prisma, NOW);
    const created = await setupOrch.createWithCapacity(baseRequest({ partySize: 40 }));
    expect(created.type).toBe("CREATED");
    if (created.type !== "CREATED") throw new Error("unreachable");
    const reservationId = created.outcome.reservationId;

    const { orchestrator: orchA } = buildHarness(prisma, NOW);
    const { orchestrator: orchB } = buildHarness(prismaB, NOW);

    const [modifyResult, createResult] = await Promise.all([
      orchA.modifyWithCapacity({
        commandId: cmd(),
        reservationId,
        actor: staffActor,
        changes: { partySize: 50 },
      }),
      orchB.createWithCapacity(baseRequest({ partySize: 15 })),
    ]);

    // 60 capacity; the reservation starts at 40. Whichever operation runs
    // first can succeed (50 alone, or 40+15=55 alone); whichever runs
    // second sees the other's result already committed and must exceed
    // capacity (15+50=65, or 40+15+50=... either ordering exceeds 60 for
    // the second mover) — so exactly one of the two must fail on capacity.
    const outcomes = [modifyResult.type, createResult.type];
    const rejectedCount = outcomes.filter((t) => t === "CAPACITY_UNAVAILABLE").length;
    expect(rejectedCount).toBe(1);

    const committed = await prisma.capacityCommitment.findMany({ where: { status: "Committed" } });
    const totalOccupancy = committed.reduce((sum, r) => sum + r.partySize, 0);
    expect(totalOccupancy).toBeLessThanOrEqual(60);
  });
});

describe("Concurrency — Modify vs Cancel", () => {
  it("of a concurrent Modify and Cancel on the SAME reservation, the final state is consistent: no active commitment survives once cancellation has taken effect", async () => {
    const { orchestrator: setupOrch } = buildHarness(prisma, NOW);
    const created = await setupOrch.createWithCapacity(baseRequest({ partySize: 10 }));
    expect(created.type).toBe("CREATED");
    if (created.type !== "CREATED") throw new Error("unreachable");
    const reservationId = created.outcome.reservationId;

    const { orchestrator: orchA } = buildHarness(prisma, NOW);
    const { orchestrator: orchB } = buildHarness(prismaB, NOW);

    const [modifyResult, cancelResult] = await Promise.all([
      orchA.modifyWithCapacity({ commandId: cmd(), reservationId, actor: staffActor, changes: { partySize: 20 } }),
      orchB.cancelWithCapacity({ commandId: cmd(), reservationId, actor: staffActor }),
    ]);

    // Cancel must always eventually succeed. Modify either wins the race
    // (succeeds, and Cancel then cancels the modified reservation) or
    // loses it (CAP-D01.01-R16: a Cancelled/terminal reservation is not
    // normally modifiable, so Modify is rejected as VALIDATION_FAILED —
    // never silently ignored, never CAPACITY_UNAVAILABLE, since capacity
    // was never the reason).
    expect(cancelResult.type).toBe("CANCELLED");
    expect(["MODIFIED", "VALIDATION_FAILED"]).toContain(modifyResult.type);

    // The critical invariant this test exists to prove: regardless of
    // ordering, no Committed commitment is left behind for this
    // reservation once Cancel has taken effect — see the
    // findActiveByReservationId re-read fix in
    // AvailabilityOrchestrator.cancelWithCapacity for the bug this guards
    // against (releasing a stale, already-superseded commitmentId would
    // leave the true active one permanently Committed).
    const activeCommitments = await prisma.capacityCommitment.findMany({
      where: { reservationId, status: "Committed" },
    });
    expect(activeCommitments).toHaveLength(0);

    const reservation = await prisma.reservation.findUniqueOrThrow({ where: { id: reservationId } });
    expect(reservation.status).toBe("Cancelled");
  });
});
