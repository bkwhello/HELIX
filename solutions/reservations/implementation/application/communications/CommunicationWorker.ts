/**
 * R1.6-B — the communication processor (assignment §14). Claims a batch
 * via the PostgreSQL-safe port method, re-verifies eligibility against
 * CURRENT authoritative Reservation state (never trusting a stale
 * snapshot for that decision — assignment §11/§13/§33), renders, sends
 * via the replaceable EmailDeliveryPort, and records the outcome.
 * Callable/testable independently of HTTP traffic (assignment §14) — see
 * ops/communications/processOutbox.ts for the cron-invoked entry point.
 */
import { CommunicationOutboxRepository, CommunicationMessageRecord } from "../ports/CommunicationOutboxRepository.js";
import { EmailDeliveryPort } from "../ports/EmailDeliveryPort.js";
import { ReservationRepository } from "../../domain/repositories/ReservationRepository.js";
import { Clock } from "../ports/Clock.js";
import { renderConfirmation, renderReminder } from "../../domain/communications/Templates.js";
import { CommunicationType, isReminderStillEligible, computeNextRetryAvailableAt } from "../../domain/communications/CommunicationMessage.js";
import { ReservationStatus } from "../../domain/value-objects/ReservationStatus.js";
import { ReservationId } from "../../domain/value-objects/ReservationId.js";

const DEFAULT_BATCH_SIZE = 20;
/** A claimed-but-never-finished row (worker crashed mid-send, assignment §20) becomes reclaimable after this long — bounds the "stuck forever" risk (architecture report §34 scenario C's own honest caveat: reclaiming risks an at-least-once duplicate, never exactly-once, without provider-side idempotency support). */
const DEFAULT_PROCESSING_STALENESS_MS = 5 * 60 * 1000;

export interface ProcessBatchResult {
  readonly processed: number;
  readonly sent: number;
  readonly retried: number;
  readonly permanentlyFailed: number;
  readonly cancelled: number;
  /** Assignment §20 — an ambiguous outcome (the delivery adapter threw rather than returning a classified result, e.g. a timeout where "did the provider receive it?" is genuinely unknown). The row is deliberately left in `Processing` — never guessed at — and becomes reclaimable once `processingStalenessMs` elapses (domain/communications/CommunicationMessage.ts). This is the same honest, at-least-once semantics as a real crash mid-send; see the implementation report for why exactly-once cannot be claimed here. */
  readonly unknown: number;
}

export class CommunicationWorker {
  constructor(
    private readonly outboxRepository: CommunicationOutboxRepository,
    private readonly reservationRepository: ReservationRepository,
    private readonly emailPort: EmailDeliveryPort,
    private readonly clock: Clock,
    private readonly batchSize: number = DEFAULT_BATCH_SIZE,
    private readonly processingStalenessMs: number = DEFAULT_PROCESSING_STALENESS_MS
  ) {}

  async processBatch(): Promise<ProcessBatchResult> {
    const now = this.clock.now();
    const claimed = await this.outboxRepository.claimBatch({ now, batchSize: this.batchSize, processingStalenessMs: this.processingStalenessMs });

    let sent = 0;
    let retried = 0;
    let permanentlyFailed = 0;
    let cancelled = 0;
    let unknown = 0;
    for (const message of claimed) {
      // Assignment §20 — a message that throws (an ambiguous/timeout
      // outcome) must never abort processing of the REST of the batch;
      // it is left exactly where the claim put it (Processing) and
      // simply skipped, not guessed at.
      try {
        const outcome = await this.processOne(message, now);
        if (outcome === "SENT") sent += 1;
        else if (outcome === "RETRIED") retried += 1;
        else if (outcome === "PERMANENTLY_FAILED") permanentlyFailed += 1;
        else cancelled += 1;
      } catch {
        unknown += 1;
      }
    }
    return { processed: claimed.length, sent, retried, permanentlyFailed, cancelled, unknown };
  }

  private async processOne(message: CommunicationMessageRecord, now: Date): Promise<"SENT" | "RETRIED" | "PERMANENTLY_FAILED" | "CANCELLED"> {
    const idResult = ReservationId.create(message.reservationId);
    const reservation = idResult.ok ? await this.reservationRepository.findById(idResult.value) : null;
    if (!reservation) {
      await this.outboxRepository.markCancelled({ id: message.id, reason: "Reservation no longer exists." });
      return "CANCELLED";
    }

    // Mandatory send-time re-check (assignment §11/§13/§33) — always
    // against CURRENT authoritative state, never the message's own
    // snapshot (which is used for CONTENT only — assignment §31).
    if (message.communicationType === CommunicationType.ReservationReminder24h) {
      const eligibility = isReminderStillEligible({ reservationStatus: reservation.getStatus(), reservationStart: reservation.getReservationDateTime(), now });
      if (!eligibility.eligible) {
        await this.outboxRepository.markCancelled({ id: message.id, reason: `Reminder no longer eligible: ${eligibility.reason}.` });
        return "CANCELLED";
      }
    } else if (reservation.getStatus() === ReservationStatus.Cancelled) {
      await this.outboxRepository.markCancelled({ id: message.id, reason: "Reservation was cancelled before confirmation could be sent." });
      return "CANCELLED";
    }

    const rendered =
      message.communicationType === CommunicationType.ReservationConfirmation
        ? renderConfirmation(message.language, {
            guestName: message.payload.guestName,
            reservationReference: message.payload.reservationReference,
            reservationStart: new Date(message.payload.reservationStart),
            partySize: message.payload.partySize,
            area: message.payload.area,
          })
        : renderReminder(message.language, {
            guestName: message.payload.guestName,
            reservationReference: message.payload.reservationReference,
            reservationStart: new Date(message.payload.reservationStart),
            partySize: message.payload.partySize,
            area: message.payload.area,
          });

    const deliveryResult = await this.emailPort.send({
      recipient: message.recipientEmail,
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
      idempotencyKey: message.idempotencyKey,
    });

    if (deliveryResult.type === "SUBMITTED") {
      await this.outboxRepository.markSent({ id: message.id, providerMessageId: deliveryResult.providerMessageId, sentAt: now });
      return "SENT";
    }
    if (deliveryResult.type === "FAILED_PERMANENT") {
      await this.outboxRepository.markFailedPermanent({ id: message.id, lastError: deliveryResult.reason });
      return "PERMANENTLY_FAILED";
    }

    // FAILED_RETRYABLE — bounded backoff (assignment §19; domain/communications/CommunicationMessage.ts's RETRY_BACKOFF_MS).
    const nextAvailableAt = computeNextRetryAvailableAt(message.attemptCount, now);
    if (nextAvailableAt === null) {
      await this.outboxRepository.markFailedPermanent({
        id: message.id,
        lastError: `${deliveryResult.reason} (retries exhausted after ${message.attemptCount} attempts)`,
      });
      return "PERMANENTLY_FAILED";
    }
    await this.outboxRepository.markFailedRetryable({ id: message.id, lastError: deliveryResult.reason, nextAvailableAt });
    return "RETRIED";
  }
}
