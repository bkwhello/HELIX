import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { resetDatabase } from "./support/testHarness.js";
import { createTestPrismaClient, truncateCommunicationDomainTables } from "./support/testDatabaseSafety.js";
import { PrismaCommunicationOutboxRepository } from "../../infrastructure/persistence/PrismaCommunicationOutboxRepository.js";
import { CommunicationType, CommunicationStatus } from "../../domain/communications/CommunicationMessage.js";

/**
 * Chief Engineer "R1.6-B1 Communication Worker Determinism Fix" assignment
 * §6 (T1-T5) — real PostgreSQL evidence that
 * PrismaCommunicationOutboxRepository.claimBatch now produces a fully
 * deterministic total order over eligible messages, even when many rows
 * tie on `available_at` and/or `created_at`. Every test here seeds rows
 * DIRECTLY via `prisma.communicationMessage.create` (never through the
 * repository's own `enqueue`, which cannot express an explicit
 * `createdAt` — see CommunicationOutboxRepository.ts's own port
 * signature) so ties can be constructed exactly, not hoped for.
 *
 * `communication_messages.reservation_id` carries no foreign key
 * (deliberate — see prisma/schema.prisma's own comment), so synthetic,
 * non-existent reservation ids are used freely below.
 */
const prisma = createTestPrismaClient();
const prismaB = createTestPrismaClient();
const outboxRepository = new PrismaCommunicationOutboxRepository(prisma);
let seedCounter = 0;

beforeAll(async () => {
  await resetDatabase(prisma);
  await truncateCommunicationDomainTables(prisma);
});
afterAll(async () => {
  await prisma.$disconnect();
  await prismaB.$disconnect();
});
beforeEach(async () => {
  await truncateCommunicationDomainTables(prisma);
});

function payload() {
  return JSON.stringify({
    guestName: "Determinism Test Guest",
    reservationReference: "DET-REF",
    reservationStart: new Date("2026-08-20T18:00:00Z").toISOString(),
    partySize: 2,
    area: "Sushi",
  });
}

async function seedMessage(input: { readonly availableAt: Date; readonly createdAt: Date; readonly status?: string; readonly recipientTag: string }): Promise<string> {
  seedCounter += 1;
  const row = await prisma.communicationMessage.create({
    data: {
      reservationId: `det-res-${seedCounter}`,
      communicationType: CommunicationType.ReservationConfirmation,
      language: "nl",
      recipientEmail: `${input.recipientTag}@example.com`,
      payload: payload(),
      status: input.status ?? CommunicationStatus.Pending,
      availableAt: input.availableAt,
      createdAt: input.createdAt,
      idempotencyKey: `det-idem-${seedCounter}`,
    },
  });
  return row.id;
}

/** Resets a set of previously-claimed rows back to Pending/attemptCount 0 so the SAME candidate set can be re-claimed repeatedly, without reseeding (id/createdAt/availableAt must stay identical across repeat-claim assertions). */
async function resetToPending(ids: readonly string[]): Promise<void> {
  await prisma.communicationMessage.updateMany({ where: { id: { in: [...ids] } }, data: { status: CommunicationStatus.Pending, attemptCount: 0, claimedAt: null } });
}

function isNonDecreasing(values: readonly string[]): boolean {
  for (let i = 1; i < values.length; i += 1) {
    if (values[i]! < values[i - 1]!) return false;
  }
  return true;
}

const NOW = new Date("2026-08-10T10:00:00Z");

describe("T1 — equal available_at, distinct created_at", () => {
  it("claims in created_at order, deterministically, regardless of insertion order", async () => {
    // Insert deliberately OUT of createdAt order (c, a, b) so a passing
    // result cannot be explained by "insertion order happened to match".
    const idC = await seedMessage({ availableAt: NOW, createdAt: new Date(NOW.getTime() + 20_000), recipientTag: "t1-c" });
    const idA = await seedMessage({ availableAt: NOW, createdAt: new Date(NOW.getTime() + 0), recipientTag: "t1-a" });
    const idB = await seedMessage({ availableAt: NOW, createdAt: new Date(NOW.getTime() + 10_000), recipientTag: "t1-b" });
    void idC;

    const claimed = await outboxRepository.claimBatch({ now: NOW, batchSize: 20, processingStalenessMs: 5 * 60_000 });
    expect(claimed.map((m) => m.id)).toEqual([idA, idB, idC]);
  });
});

describe("T2 — equal available_at AND equal created_at (full tie, id is the only remaining key)", () => {
  it("claims in a stable order derivable from id alone, identically across repeated claims", async () => {
    const ids: string[] = [];
    for (let i = 0; i < 6; i += 1) {
      ids.push(await seedMessage({ availableAt: NOW, createdAt: NOW, recipientTag: `t2-${i}` }));
    }

    const first = await outboxRepository.claimBatch({ now: NOW, batchSize: 20, processingStalenessMs: 5 * 60_000 });
    const firstOrder = first.map((m) => m.id);
    // Independently verifiable, not tautological: the returned ids must
    // themselves be in non-decreasing lexicographic order — a plain
    // string comparison, not a re-application of the repository's own
    // sort function.
    expect(isNonDecreasing(firstOrder)).toBe(true);
    expect(new Set(firstOrder)).toEqual(new Set(ids));

    // Determinism proof: reset and re-claim the identical candidate set
    // 20 times — every single run must reproduce the exact same order.
    for (let i = 0; i < 20; i += 1) {
      await resetToPending(ids);
      const claimed = await outboxRepository.claimBatch({ now: NOW, batchSize: 20, processingStalenessMs: 5 * 60_000 });
      expect(claimed.map((m) => m.id)).toEqual(firstOrder);
    }
  });
});

describe("T3 — batch boundary: more tied-eligible rows than batchSize", () => {
  it("successive small batches partition the full deterministic order with no gaps, overlaps, or reordering", async () => {
    const ids: string[] = [];
    for (let i = 0; i < 10; i += 1) {
      ids.push(await seedMessage({ availableAt: NOW, createdAt: NOW, recipientTag: `t3-${i}` }));
    }
    const expectedFullOrder = [...ids].sort();

    const claimedOrder: string[] = [];
    for (let i = 0; i < 4; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      const batch = await outboxRepository.claimBatch({ now: NOW, batchSize: 3, processingStalenessMs: 5 * 60_000 });
      claimedOrder.push(...batch.map((m) => m.id));
    }
    expect(claimedOrder).toEqual(expectedFullOrder);

    // Re-running the exact same batching plan against the identical
    // (reset) candidate set reproduces the identical partition — "logical
    // ordering" is stable across repeated claim-batch runs, not just
    // within a single run.
    await resetToPending(ids);
    const secondRunOrder: string[] = [];
    for (let i = 0; i < 4; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      const batch = await outboxRepository.claimBatch({ now: NOW, batchSize: 3, processingStalenessMs: 5 * 60_000 });
      secondRunOrder.push(...batch.map((m) => m.id));
    }
    expect(secondRunOrder).toEqual(expectedFullOrder);
  });
});

describe("T4 — two concurrent workers claiming from the same tied candidate set", () => {
  it("no message double-claimed, no message lost, each worker's own batch internally deterministic", async () => {
    const ids: string[] = [];
    for (let i = 0; i < 10; i += 1) {
      ids.push(await seedMessage({ availableAt: NOW, createdAt: NOW, recipientTag: `t4-${i}` }));
    }

    const outboxA = outboxRepository;
    const outboxB = new PrismaCommunicationOutboxRepository(prismaB);
    const [resultA, resultB] = await Promise.all([
      outboxA.claimBatch({ now: NOW, batchSize: 6, processingStalenessMs: 5 * 60_000 }),
      outboxB.claimBatch({ now: NOW, batchSize: 6, processingStalenessMs: 5 * 60_000 }),
    ]);
    const idsA = resultA.map((m) => m.id);
    const idsB = resultB.map((m) => m.id);

    // No double claim.
    expect(idsA.filter((id) => idsB.includes(id))).toHaveLength(0);
    // No lost message: every seeded id was claimed by exactly one worker (FOR UPDATE SKIP LOCKED lets both workers race for up to 6 each against 10 total, so together they must exhaust all 10).
    expect(new Set([...idsA, ...idsB])).toEqual(new Set(ids));
    expect(idsA.length + idsB.length).toBe(10);
    // Each worker's own claimed batch is internally in deterministic (sorted) order — SKIP LOCKED decides WHICH rows a worker wins, not what order it returns them in.
    expect(isNonDecreasing(idsA)).toBe(true);
    expect(isNonDecreasing(idsB)).toBe(true);
  });
});

describe("T5 — tied retry-eligible (FailedRetryable) messages", () => {
  it("preserve the identical deterministic ordering rule as fresh Pending rows", async () => {
    const ids: string[] = [];
    for (let i = 0; i < 5; i += 1) {
      ids.push(await seedMessage({ availableAt: NOW, createdAt: NOW, status: CommunicationStatus.FailedRetryable, recipientTag: `t5-${i}` }));
    }

    const first = await outboxRepository.claimBatch({ now: NOW, batchSize: 20, processingStalenessMs: 5 * 60_000 });
    const firstOrder = first.map((m) => m.id);
    expect(isNonDecreasing(firstOrder)).toBe(true);
    expect(new Set(firstOrder)).toEqual(new Set(ids));

    for (let i = 0; i < 10; i += 1) {
      await resetToPending(ids); // resets status too — fine, only re-asserting ordering determinism, not retry-specific status semantics (unchanged by this fix, see report §5)
      await prisma.communicationMessage.updateMany({ where: { id: { in: ids } }, data: { status: CommunicationStatus.FailedRetryable } });
      // eslint-disable-next-line no-await-in-loop
      const claimed = await outboxRepository.claimBatch({ now: NOW, batchSize: 20, processingStalenessMs: 5 * 60_000 });
      expect(claimed.map((m) => m.id)).toEqual(firstOrder);
    }
  });
});
