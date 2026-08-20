import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { buildHarness, resetDatabase, seedTestContact } from "./support/testHarness.js";
import { createTestPrismaClient, truncateCommunicationDomainTables } from "./support/testDatabaseSafety.js";
import { Actor, ActorKind, ActorRole } from "../../domain/value-objects/Actor.js";
import { ReservationSourceCategory } from "../../domain/value-objects/ReservationSource.js";
import { CommunicationWorker } from "../../application/communications/CommunicationWorker.js";
import { FakeEmailDeliveryPort } from "../../infrastructure/communications/FakeEmailDeliveryPort.js";
import { MutableClock } from "./support/testHarness.js";

/**
 * Chief Engineer "R1.6-B Guest Communications Engine" assignment §14/§19/
 * §20/§39 (P1-P4) — real PostgreSQL evidence for the worker's claim ->
 * send -> record-outcome cycle, the bounded retry model, delivery-status
 * semantics, and the honest "ambiguous outcome" handling.
 */
const prisma = createTestPrismaClient();
const staffActor: Actor = { id: "staff-1", kind: ActorKind.AuthorizedUser, role: ActorRole.Reception };
const NOW = new Date("2026-08-10T10:00:00Z");
let cmdCounter = 0;
function cmd(): string {
  cmdCounter += 1;
  return `worker-cmd-${cmdCounter}`;
}

beforeAll(async () => {
  await resetDatabase(prisma);
  await truncateCommunicationDomainTables(prisma);
});
afterAll(async () => {
  await prisma.$disconnect();
});
beforeEach(async () => {
  await resetDatabase(prisma);
  await truncateCommunicationDomainTables(prisma);
  await seedTestContact(prisma);
});

async function seedConfirmationEligibleReservation(overrides: { partySize?: number; email?: string } = {}): Promise<{ reservationId: string; email: string }> {
  const { orchestrator } = buildHarness(prisma, NOW);
  const email = overrides.email ?? `guest-${cmdCounter}@example.com`;
  const result = await orchestrator.createWithCapacity({
    commandId: cmd(),
    servicePeriodId: "sp-dinner",
    contactSelection: { type: "CreateNewContact", displayName: "Worker Test Guest", email },
    reservationDate: new Date("2026-08-20T18:00:00Z"),
    partySize: overrides.partySize ?? 2,
    source: { category: ReservationSourceCategory.Telephone },
    preferredArea: "Sushi",
    actor: staffActor,
  });
  if (result.type !== "CREATED") throw new Error(`seed failed: ${result.type}`);
  return { reservationId: result.outcome.reservationId, email };
}

describe("P3 — successful submission", () => {
  it("marks the message Sent with an accurate, honest status (SUBMITTED-to-provider, never claiming inbox delivery — assignment §18)", async () => {
    const { reservationId } = await seedConfirmationEligibleReservation();
    const { repository, outboxRepository } = buildHarness(prisma, NOW);
    const emailPort = new FakeEmailDeliveryPort();
    const worker = new CommunicationWorker(outboxRepository, repository, emailPort, new MutableClock(NOW));

    const result = await worker.processBatch();
    expect(result).toMatchObject({ processed: 1, sent: 1, retried: 0, permanentlyFailed: 0, cancelled: 0, unknown: 0 });

    const messages = await outboxRepository.findByReservationId(reservationId);
    expect(messages[0]?.status).toBe("Sent");
    expect(messages[0]?.providerMessageId).toBeTruthy();
    expect(messages[0]?.sentAt).toBeTruthy();
    expect(emailPort.getSentMessages()).toHaveLength(1);
  });
});

describe("P1 — provider unavailable (retryable) -> Reservation unchanged, message retryable", () => {
  it("marks FailedRetryable, pushes availableAt forward, increments attemptCount — never touches the Reservation", async () => {
    const { reservationId } = await seedConfirmationEligibleReservation();
    const { repository, outboxRepository } = buildHarness(prisma, NOW);
    const emailPort = new FakeEmailDeliveryPort();
    emailPort.enqueueResult({ type: "FAILED_RETRYABLE", reason: "provider_timeout" });
    const worker = new CommunicationWorker(outboxRepository, repository, emailPort, new MutableClock(NOW));

    const result = await worker.processBatch();
    expect(result).toMatchObject({ sent: 0, retried: 1, permanentlyFailed: 0 });

    const messages = await outboxRepository.findByReservationId(reservationId);
    expect(messages[0]?.status).toBe("FailedRetryable");
    expect(messages[0]?.lastError).toBe("provider_timeout");
    expect(messages[0]?.attemptCount).toBe(1);
    expect(messages[0]?.availableAt.getTime()).toBeGreaterThan(NOW.getTime());

    const reservation = await prisma.reservation.findUniqueOrThrow({ where: { id: reservationId } });
    expect(reservation.status).toBe("Proposed"); // fully unaffected by the delivery failure
  });

  it("is not re-claimed before its new availableAt — a second immediate batch run does nothing", async () => {
    await seedConfirmationEligibleReservation();
    const { repository, outboxRepository } = buildHarness(prisma, NOW);
    const emailPort = new FakeEmailDeliveryPort();
    emailPort.enqueueResult({ type: "FAILED_RETRYABLE", reason: "provider_timeout" });
    const clock = new MutableClock(NOW);
    const worker = new CommunicationWorker(outboxRepository, repository, emailPort, clock);

    await worker.processBatch(); // -> FailedRetryable
    const second = await worker.processBatch(); // still before the backoff delay elapses
    expect(second.processed).toBe(0);
  });
});

describe("P2 — permanent invalid-recipient failure -> Reservation unchanged, message terminal and operationally visible", () => {
  it("marks FailedPermanent immediately, never retries", async () => {
    const { reservationId } = await seedConfirmationEligibleReservation();
    const { repository, outboxRepository } = buildHarness(prisma, NOW);
    const emailPort = new FakeEmailDeliveryPort();
    emailPort.enqueueResult({ type: "FAILED_PERMANENT", reason: "invalid_recipient" });
    const worker = new CommunicationWorker(outboxRepository, repository, emailPort, new MutableClock(NOW));

    const result = await worker.processBatch();
    expect(result).toMatchObject({ sent: 0, retried: 0, permanentlyFailed: 1 });

    const messages = await outboxRepository.findByReservationId(reservationId);
    expect(messages[0]?.status).toBe("FailedPermanent");
    expect(messages[0]?.lastError).toBe("invalid_recipient");

    const reservation = await prisma.reservation.findUniqueOrThrow({ where: { id: reservationId } });
    expect(reservation.status).toBe("Proposed");

    // A second batch run must not re-claim a FailedPermanent row (only Pending/FailedRetryable-and-due/stale-Processing are eligible).
    const second = await worker.processBatch();
    expect(second.processed).toBe(0);
  });
});

describe("P4 — retry does not create a new Reservation or a new logical message", () => {
  it("a retried, eventually-successful message stays the SAME row throughout — one Reservation, one CommunicationMessage row, one idempotencyKey", async () => {
    const { reservationId } = await seedConfirmationEligibleReservation();
    const { repository, outboxRepository } = buildHarness(prisma, NOW);
    const emailPort = new FakeEmailDeliveryPort();
    emailPort.enqueueResult({ type: "FAILED_RETRYABLE", reason: "provider_timeout" });
    const clock = new MutableClock(NOW);
    const worker = new CommunicationWorker(outboxRepository, repository, emailPort, clock);

    const before = await outboxRepository.findByReservationId(reservationId);
    const originalId = before[0]!.id;

    await worker.processBatch(); // FailedRetryable, attempt 1
    clock.set(new Date(NOW.getTime() + 2 * 60_000)); // past the first backoff step
    await worker.processBatch(); // SUBMITTED (fake defaults to success once its queue is empty)

    const after = await outboxRepository.findByReservationId(reservationId);
    expect(after).toHaveLength(1); // never a second row
    expect(after[0]?.id).toBe(originalId);
    expect(after[0]?.status).toBe("Sent");
    expect(after[0]?.attemptCount).toBe(2);

    const reservations = await prisma.reservation.findMany({ where: { id: reservationId } });
    expect(reservations).toHaveLength(1); // never a second Reservation
  });
});

describe("§20 — ambiguous/unknown outcome (delivery adapter throws) is handled honestly", () => {
  it("leaves the row in Processing (never guessed at), continues processing the rest of the batch, and does not crash", async () => {
    const a = await seedConfirmationEligibleReservation();
    const b = await seedConfirmationEligibleReservation();
    const { repository, outboxRepository } = buildHarness(prisma, NOW);
    const emailPort = new FakeEmailDeliveryPort();
    emailPort.enqueueResult({ type: "THROW", error: new Error("simulated network timeout — outcome unknown") });
    // second message (b) succeeds normally (queue empty by then).
    const worker = new CommunicationWorker(outboxRepository, repository, emailPort, new MutableClock(NOW));

    const result = await worker.processBatch();
    expect(result.processed).toBe(2);
    expect(result.unknown).toBe(1);
    expect(result.sent).toBe(1);

    const aMessages = await outboxRepository.findByReservationId(a.reservationId);
    expect(aMessages[0]?.status).toBe("Processing"); // never guessed — not Sent, not FailedRetryable, not Cancelled
    const bMessages = await outboxRepository.findByReservationId(b.reservationId);
    expect(bMessages[0]?.status).toBe("Sent");
  });

  it("a stale Processing row (past the staleness threshold) becomes reclaimable on a later run", async () => {
    const { reservationId } = await seedConfirmationEligibleReservation();
    const { repository, outboxRepository } = buildHarness(prisma, NOW);
    const throwingPort = new FakeEmailDeliveryPort();
    throwingPort.enqueueResult({ type: "THROW", error: new Error("timeout") });
    const clock = new MutableClock(NOW);
    const throwingWorker = new CommunicationWorker(outboxRepository, repository, throwingPort, clock, 20, 5 * 60_000);
    await throwingWorker.processBatch();

    let messages = await outboxRepository.findByReservationId(reservationId);
    expect(messages[0]?.status).toBe("Processing");

    clock.set(new Date(NOW.getTime() + 6 * 60_000)); // past the 5-minute staleness threshold
    const successPort = new FakeEmailDeliveryPort();
    const laterWorker = new CommunicationWorker(outboxRepository, repository, successPort, clock, 20, 5 * 60_000);
    const result = await laterWorker.processBatch();
    expect(result.processed).toBe(1);
    expect(result.sent).toBe(1);

    messages = await outboxRepository.findByReservationId(reservationId);
    expect(messages[0]?.status).toBe("Sent");
  });
});

describe("Cancellation during send — mandatory eligibility re-check for Confirmation too", () => {
  it("a reservation cancelled between enqueue and send is marked Cancelled, never sent", async () => {
    const { reservationId } = await seedConfirmationEligibleReservation();
    const { repository, outboxRepository, orchestrator } = buildHarness(prisma, NOW);
    await orchestrator.cancelWithCapacity({ commandId: cmd(), reservationId, actor: staffActor });

    const emailPort = new FakeEmailDeliveryPort();
    const worker = new CommunicationWorker(outboxRepository, repository, emailPort, new MutableClock(NOW));
    const result = await worker.processBatch();
    expect(result).toMatchObject({ sent: 0, cancelled: 1 });
    expect(emailPort.getSentMessages()).toHaveLength(0);

    const messages = await outboxRepository.findByReservationId(reservationId);
    expect(messages[0]?.status).toBe("Cancelled");
  });
});

describe("Observability — assignment §34", () => {
  it("findByReservationId answers 'did the confirmation actually send?' without any direct database inspection", async () => {
    const { reservationId } = await seedConfirmationEligibleReservation();
    const { repository, outboxRepository } = buildHarness(prisma, NOW);
    const worker = new CommunicationWorker(outboxRepository, repository, new FakeEmailDeliveryPort(), new MutableClock(NOW));

    let messages = await outboxRepository.findByReservationId(reservationId);
    expect(messages[0]?.status).toBe("Pending");

    await worker.processBatch();
    messages = await outboxRepository.findByReservationId(reservationId);
    expect(messages[0]?.status).toBe("Sent");
  });
});
