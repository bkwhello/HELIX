import { PrismaClient, Prisma } from "@prisma/client";
import {
  CommunicationOutboxRepository,
  CommunicationMessageRecord,
  CommunicationMessagePayload,
  EnqueueCommunicationMessageInput,
  EnqueueResult,
} from "../../application/ports/CommunicationOutboxRepository.js";
import { CommunicationType, CommunicationStatus } from "../../domain/communications/CommunicationMessage.js";
import { CommunicationLanguage, isCommunicationLanguage } from "../../domain/value-objects/CommunicationLanguage.js";
import { asPrismaTx } from "./PrismaTransactionManager.js";

/** Raw snake_case row shape returned by the hand-written claim query below — Prisma's generated client types don't apply to $queryRaw's return value. */
interface RawCommunicationMessageRow {
  id: string;
  reservation_id: string;
  communication_type: string;
  language: string;
  recipient_email: string;
  payload: string;
  status: string;
  attempt_count: number;
  available_at: Date;
  claimed_at: Date | null;
  provider_message_id: string | null;
  last_error: string | null;
  idempotency_key: string;
  created_at: Date;
  sent_at: Date | null;
}

function toRecord(row: RawCommunicationMessageRow): CommunicationMessageRecord {
  return {
    id: row.id,
    reservationId: row.reservation_id,
    communicationType: row.communication_type as CommunicationType,
    language: isCommunicationLanguage(row.language) ? row.language : ("nl" as CommunicationLanguage),
    recipientEmail: row.recipient_email,
    payload: JSON.parse(row.payload) as CommunicationMessagePayload,
    status: row.status as CommunicationStatus,
    attemptCount: row.attempt_count,
    availableAt: row.available_at,
    claimedAt: row.claimed_at ?? undefined,
    providerMessageId: row.provider_message_id ?? undefined,
    lastError: row.last_error ?? undefined,
    idempotencyKey: row.idempotency_key,
    createdAt: row.created_at,
    sentAt: row.sent_at ?? undefined,
  };
}

/** Prisma's own generated `Prisma.CommunicationMessageGetPayload` shape, for the ordinary (non-raw) queries below. */
type OrdinaryRow = Awaited<ReturnType<PrismaClient["communicationMessage"]["findFirstOrThrow"]>>;
function toRecordFromOrdinary(row: OrdinaryRow): CommunicationMessageRecord {
  return toRecord({
    id: row.id,
    reservation_id: row.reservationId,
    communication_type: row.communicationType,
    language: row.language,
    recipient_email: row.recipientEmail,
    payload: row.payload,
    status: row.status,
    attempt_count: row.attemptCount,
    available_at: row.availableAt,
    claimed_at: row.claimedAt,
    provider_message_id: row.providerMessageId,
    last_error: row.lastError,
    idempotency_key: row.idempotencyKey,
    created_at: row.createdAt,
    sent_at: row.sentAt,
  });
}

export class PrismaCommunicationOutboxRepository implements CommunicationOutboxRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async enqueue(input: EnqueueCommunicationMessageInput): Promise<EnqueueResult> {
    const client = input.tx ? asPrismaTx(input.tx) : this.prisma;
    try {
      const row = await client.communicationMessage.create({
        data: {
          reservationId: input.reservationId,
          communicationType: input.communicationType,
          language: input.language,
          recipientEmail: input.recipientEmail,
          payload: JSON.stringify(input.payload),
          idempotencyKey: input.idempotencyKey,
          availableAt: input.availableAt,
        },
      });
      return { type: "ENQUEUED", record: toRecordFromOrdinary(row) };
    } catch (err) {
      // §21 — the idempotencyKey UNIQUE constraint is the actual
      // guarantee; a collision here means an equivalent logical message
      // already exists, which is a benign, expected outcome, never an
      // error to propagate.
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        return { type: "ALREADY_EXISTS" };
      }
      throw err;
    }
  }

  /**
   * PostgreSQL-safe concurrent claim (assignment §14/§30) —
   * `SELECT ... FOR UPDATE SKIP LOCKED` inside a single atomic
   * `UPDATE ... RETURNING`, so two concurrent callers can never claim the
   * same row (proven against real PostgreSQL,
   * tests/integration/communication-concurrency.test.ts — never an
   * in-memory repository, per instruction). Eligible rows: Pending-and-
   * due, FailedRetryable-and-due, or Processing-and-stale (a worker
   * crashed mid-send past `processingStalenessMs` ago — assignment §20's
   * honest at-least-once reclaim, documented in
   * domain/communications/CommunicationMessage.ts and the implementation
   * report).
   */
  async claimBatch(input: { readonly now: Date; readonly batchSize: number; readonly processingStalenessMs: number }): Promise<readonly CommunicationMessageRecord[]> {
    const staleThreshold = new Date(input.now.getTime() - input.processingStalenessMs);
    const rows = await this.prisma.$queryRaw<RawCommunicationMessageRow[]>`
      UPDATE communication_messages
      SET status = 'Processing', claimed_at = ${input.now}, attempt_count = attempt_count + 1
      WHERE id IN (
        SELECT id FROM communication_messages
        WHERE (
          (status IN ('Pending', 'FailedRetryable') AND available_at <= ${input.now})
          OR (status = 'Processing' AND claimed_at < ${staleThreshold})
        )
        ORDER BY available_at ASC
        LIMIT ${input.batchSize}
        FOR UPDATE SKIP LOCKED
      )
      RETURNING
        id, reservation_id, communication_type, language, recipient_email, payload,
        status, attempt_count, available_at, claimed_at, provider_message_id,
        last_error, idempotency_key, created_at, sent_at
    `;
    return rows.map(toRecord);
  }

  async markSent(input: { readonly id: string; readonly providerMessageId: string; readonly sentAt: Date }): Promise<void> {
    await this.prisma.communicationMessage.update({
      where: { id: input.id },
      data: { status: "Sent", providerMessageId: input.providerMessageId, sentAt: input.sentAt },
    });
  }

  async markFailedRetryable(input: { readonly id: string; readonly lastError: string; readonly nextAvailableAt: Date }): Promise<void> {
    await this.prisma.communicationMessage.update({
      where: { id: input.id },
      data: { status: "FailedRetryable", lastError: input.lastError, availableAt: input.nextAvailableAt },
    });
  }

  async markFailedPermanent(input: { readonly id: string; readonly lastError: string }): Promise<void> {
    await this.prisma.communicationMessage.update({
      where: { id: input.id },
      data: { status: "FailedPermanent", lastError: input.lastError },
    });
  }

  async markCancelled(input: { readonly id: string; readonly reason: string }): Promise<void> {
    await this.prisma.communicationMessage.update({
      where: { id: input.id },
      data: { status: "Cancelled", lastError: input.reason },
    });
  }

  async findById(id: string): Promise<CommunicationMessageRecord | null> {
    const row = await this.prisma.communicationMessage.findUnique({ where: { id } });
    return row ? toRecordFromOrdinary(row) : null;
  }

  async findByReservationId(reservationId: string): Promise<readonly CommunicationMessageRecord[]> {
    const rows = await this.prisma.communicationMessage.findMany({ where: { reservationId }, orderBy: { createdAt: "desc" } });
    return rows.map(toRecordFromOrdinary);
  }

  async findByIdempotencyKey(idempotencyKey: string): Promise<CommunicationMessageRecord | null> {
    const row = await this.prisma.communicationMessage.findUnique({ where: { idempotencyKey } });
    return row ? toRecordFromOrdinary(row) : null;
  }
}
