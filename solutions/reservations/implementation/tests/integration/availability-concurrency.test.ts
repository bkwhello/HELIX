import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { buildHarness, resetDatabase, seedTestContact } from "./support/testHarness.js";
import { createTestPrismaClient } from "./support/testDatabaseSafety.js";
import { Actor, ActorKind, ActorRole } from "../../domain/value-objects/Actor.js";
import { ReservationSourceCategory } from "../../domain/value-objects/ReservationSource.js";
import { CreateReservationRequest } from "../../application/command-handlers/CreateReservationHandler.js";
import { CAPACITY_POOLS } from "../../domain/availability/CapacityPool.js";

/**
 * CAP-D02.03 — the mandatory real-PostgreSQL concurrency matrix
 * (assignment §24). Each test uses a SEPARATE PrismaClient per concurrent
 * "actor" (a real, independent connection — this is the only way to get
 * two genuinely simultaneous PostgreSQL transactions contending on the
 * same pg_advisory_xact_lock; a single client's $transaction calls cannot
 * overlap on one connection).
 */
const prisma = createTestPrismaClient();
const prismaB = createTestPrismaClient();

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
    contactSelection: { type: "ExistingContact", contactId: "contact-1" },
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
  await seedTestContact(prisma);
});

describe("Concurrency — final-capacity race (general)", () => {
  it("of two concurrent requests that together exceed remaining capacity, exactly one succeeds", async () => {
    // R1.5: rescaled to the reconciled Sushi capacity of 51 (Chief
    // Engineer Correction — R1.5 Final Sushi Capacity Reconciliation).
    // Seed (35) + one winning request (10) = 45 <= 51; seed + BOTH would
    // be 55 > 51 — same "exactly one fits" shape as before, just against
    // the corrected capacity.
    await seedCommitment({ commitmentId: "seed", partySize: 35, commandId: "seed-cmd" });
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
    expect(totalOccupancy).toBeLessThanOrEqual(CAPACITY_POOLS.Sushi.maximumCapacity);
  });
});

describe("Concurrency — exact-final-capacity race (boundary)", () => {
  it("of two concurrent requests where only one can land exactly at capacity, exactly one succeeds and lands at exactly 51", async () => {
    // R1.5: rescaled to the reconciled Sushi capacity of 51. Seed (43) +
    // one winning request (8) = 51 exactly.
    await seedCommitment({ commitmentId: "seed", partySize: 43, commandId: "seed-cmd" });
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
    expect(totalOccupancy).toBe(CAPACITY_POOLS.Sushi.maximumCapacity); // the winner lands EXACTLY at capacity, never over
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
    // R1.5: rescaled to the reconciled 51 Sushi capacity (Chief Engineer
    // Correction — R1.5 Final Sushi Capacity Reconciliation). Numbers
    // chosen (40 initial / 45 modify-target / 15 create) so the outcome
    // is FULLY deterministic regardless of race order — not merely
    // "exactly one fails" but "modify always wins, create always loses":
    // modify-alone (0 other + 45 = 45) fits under 51; create-alone against
    // the pre-existing 40 (40+15=55) already exceeds 51, and still
    // exceeds it against the post-modify 45 (45+15=60) — so create fails
    // whichever order the race resolves in, and the surviving committed
    // total is deterministically 45.
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
        changes: { partySize: 45 },
      }),
      orchB.createWithCapacity(baseRequest({ partySize: 15 })),
    ]);

    // Deterministic regardless of ordering — see the comment above.
    expect(modifyResult.type).toBe("MODIFIED");
    expect(createResult.type).toBe("CAPACITY_UNAVAILABLE");

    const committed = await prisma.capacityCommitment.findMany({ where: { status: "Committed" } });
    const totalOccupancy = committed.reduce((sum, r) => sum + r.partySize, 0);
    expect(totalOccupancy).toBe(45);
    expect(totalOccupancy).toBeLessThanOrEqual(CAPACITY_POOLS.Sushi.maximumCapacity);
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
