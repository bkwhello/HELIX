import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { buildHarness, resetDatabase, seedTestContact, MutableClock } from "./support/testHarness.js";
import { createTestPrismaClient, truncateCommunicationDomainTables } from "./support/testDatabaseSafety.js";
import { PrismaCommunicationOutboxRepository } from "../../infrastructure/persistence/PrismaCommunicationOutboxRepository.js";
import { PrismaReservationRepository } from "../../infrastructure/persistence/PrismaReservationRepository.js";
import { CommunicationWorker } from "../../application/communications/CommunicationWorker.js";
import { FakeEmailDeliveryPort } from "../../infrastructure/communications/FakeEmailDeliveryPort.js";
import { Actor, ActorKind, ActorRole } from "../../domain/value-objects/Actor.js";
import { ReservationSourceCategory } from "../../domain/value-objects/ReservationSource.js";

/**
 * Chief Engineer "R1.6-B Guest Communications Engine" assignment §15/§30/
 * §43 — permanent real-PostgreSQL proof that `SELECT ... FOR UPDATE SKIP
 * LOCKED` genuinely prevents two concurrent workers from claiming (and
 * therefore sending) the same logical message at once. Two independent
 * PrismaClient connections (never a single client's overlapping
 * `$transaction` calls, which cannot represent genuine concurrency — same
 * discipline as every other CAP-D02.03/CAP-D04.01 concurrency proof in
 * this codebase) — never an in-memory repository, per instruction.
 */
const prisma = createTestPrismaClient();
const prismaB = createTestPrismaClient();
const staffActor: Actor = { id: "staff-1", kind: ActorKind.AuthorizedUser, role: ActorRole.Reception };
const NOW = new Date("2026-08-10T10:00:00Z");
let cmdCounter = 0;
function cmd(): string {
  cmdCounter += 1;
  return `concurrency-cmd-${cmdCounter}`;
}

beforeAll(async () => {
  await resetDatabase(prisma);
  await truncateCommunicationDomainTables(prisma);
});
afterAll(async () => {
  await prisma.$disconnect();
  await prismaB.$disconnect();
});
beforeEach(async () => {
  await resetDatabase(prisma);
  await truncateCommunicationDomainTables(prisma);
  await seedTestContact(prisma);
});

async function seedPendingMessage(): Promise<string> {
  const { orchestrator } = buildHarness(prisma, NOW);
  const result = await orchestrator.createWithCapacity({
    commandId: cmd(),
    servicePeriodId: "sp-dinner",
    contactSelection: { type: "CreateNewContact", displayName: "Concurrency Guest", email: `concurrency-${cmdCounter}@example.com` },
    reservationDate: new Date("2026-08-20T18:00:00Z"),
    partySize: 2,
    source: { category: ReservationSourceCategory.Telephone },
    preferredArea: "Sushi",
    actor: staffActor,
  });
  if (result.type !== "CREATED") throw new Error(`seed failed: ${result.type}`);
  return result.outcome.reservationId;
}

describe("Concurrency repetition — two workers racing to claim the SAME single pending message", () => {
  it("20 iterations, 0 double-claims, 0 lost messages: exactly one worker claims and sends each message every time", async () => {
    for (let i = 0; i < 20; i += 1) {
      const reservationId = await seedPendingMessage();

      const outboxA = new PrismaCommunicationOutboxRepository(prisma);
      const reservationA = new PrismaReservationRepository(prisma);
      const emailA = new FakeEmailDeliveryPort();
      const workerA = new CommunicationWorker(outboxA, reservationA, emailA, new MutableClock(NOW), 20, 5 * 60_000);

      const outboxB = new PrismaCommunicationOutboxRepository(prismaB);
      const reservationB = new PrismaReservationRepository(prismaB);
      const emailB = new FakeEmailDeliveryPort();
      const workerB = new CommunicationWorker(outboxB, reservationB, emailB, new MutableClock(NOW), 20, 5 * 60_000);

      const [resultA, resultB] = await Promise.all([workerA.processBatch(), workerB.processBatch()]);

      // Exactly one worker claimed (and therefore processed) the single available message — the other claimed nothing, never both, never neither.
      const claimedCounts = [resultA.processed, resultB.processed].sort();
      expect(claimedCounts).toEqual([0, 1]);

      const totalSent = resultA.sent + resultB.sent;
      expect(totalSent).toBe(1); // exactly one send, never zero (lost) and never two (double-sent)
      const totalEmailsActuallySent = emailA.getSentMessages().length + emailB.getSentMessages().length;
      expect(totalEmailsActuallySent).toBe(1);

      // Final durable state: exactly one message row, Sent, attemptCount 1.
      const finalMessages = await outboxA.findByReservationId(reservationId);
      expect(finalMessages).toHaveLength(1);
      expect(finalMessages[0]?.status).toBe("Sent");
      expect(finalMessages[0]?.attemptCount).toBe(1);
    }
  });
});

describe("Concurrency — two workers processing a larger batch of independent messages concurrently", () => {
  it("both workers together process every message exactly once, with no overlap", async () => {
    const reservationIds: string[] = [];
    for (let i = 0; i < 8; i += 1) {
      reservationIds.push(await seedPendingMessage());
    }

    const outboxA = new PrismaCommunicationOutboxRepository(prisma);
    const reservationA = new PrismaReservationRepository(prisma);
    const workerA = new CommunicationWorker(outboxA, reservationA, new FakeEmailDeliveryPort(), new MutableClock(NOW), 4, 5 * 60_000);

    const outboxB = new PrismaCommunicationOutboxRepository(prismaB);
    const reservationB = new PrismaReservationRepository(prismaB);
    const workerB = new CommunicationWorker(outboxB, reservationB, new FakeEmailDeliveryPort(), new MutableClock(NOW), 4, 5 * 60_000);

    const [resultA, resultB] = await Promise.all([workerA.processBatch(), workerB.processBatch()]);
    expect(resultA.processed + resultB.processed).toBe(8);

    for (const reservationId of reservationIds) {
      const messages = await outboxA.findByReservationId(reservationId);
      expect(messages).toHaveLength(1);
      expect(messages[0]?.status).toBe("Sent");
      expect(messages[0]?.attemptCount).toBe(1); // never claimed/attempted twice
    }
  });
});
