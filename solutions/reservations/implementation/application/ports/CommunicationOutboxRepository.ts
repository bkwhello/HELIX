/**
 * R1.6-B — persistence port for the transactional communication outbox
 * (architecture report §7/§37; "CommunicationMessage / OutboxMessage or
 * equivalent", assignment §8).
 */
import { CommunicationType, CommunicationStatus } from "../../domain/communications/CommunicationMessage.js";
import { CommunicationLanguage } from "../../domain/value-objects/CommunicationLanguage.js";
import { TransactionContext } from "../../domain/shared/TransactionContext.js";

export interface CommunicationMessagePayload {
  readonly guestName: string;
  readonly reservationReference: string;
  readonly reservationStart: string; // ISO instant — plain data, not a Date, since this is a durable snapshot payload
  readonly partySize: number;
  readonly area: string;
}

export interface CommunicationMessageRecord {
  readonly id: string;
  readonly reservationId: string;
  readonly communicationType: CommunicationType;
  readonly language: CommunicationLanguage;
  readonly recipientEmail: string;
  readonly payload: CommunicationMessagePayload;
  readonly status: CommunicationStatus;
  readonly attemptCount: number;
  readonly availableAt: Date;
  readonly claimedAt?: Date;
  readonly providerMessageId?: string;
  readonly lastError?: string;
  readonly idempotencyKey: string;
  readonly createdAt: Date;
  readonly sentAt?: Date;
}

export interface EnqueueCommunicationMessageInput {
  readonly reservationId: string;
  readonly communicationType: CommunicationType;
  readonly language: CommunicationLanguage;
  readonly recipientEmail: string;
  readonly payload: CommunicationMessagePayload;
  readonly idempotencyKey: string;
  readonly availableAt: Date;
  /** CAP-D02.03 — when supplied, this write joins the caller's already-open transaction instead of opening its own (see CreateReservationHandler.tx's own doc comment for the identical pattern). */
  readonly tx?: TransactionContext;
}

export type EnqueueResult = { readonly type: "ENQUEUED"; readonly record: CommunicationMessageRecord } | { readonly type: "ALREADY_EXISTS" };

export interface CommunicationOutboxRepository {
  /**
   * Idempotent by `idempotencyKey` (assignment §21 — a database constraint
   * backstops this, not merely "code shouldn't call it twice"): a second
   * enqueue with the same key returns ALREADY_EXISTS rather than a second
   * row or an error.
   */
  enqueue(input: EnqueueCommunicationMessageInput): Promise<EnqueueResult>;

  /**
   * PostgreSQL-safe concurrent claim (assignment §14/§30/§43) —
   * `SELECT ... FOR UPDATE SKIP LOCKED`, proven against real PostgreSQL
   * (tests/integration/communication-concurrency.test.ts). Claims up to
   * `batchSize` eligible rows (Pending-and-due, FailedRetryable-and-due,
   * or Processing-and-stale — see the implementation report §12) in one
   * atomic UPDATE, marking them Processing and incrementing attemptCount,
   * so a second concurrent caller can never claim the same row.
   */
  claimBatch(input: { readonly now: Date; readonly batchSize: number; readonly processingStalenessMs: number }): Promise<readonly CommunicationMessageRecord[]>;

  markSent(input: { readonly id: string; readonly providerMessageId: string; readonly sentAt: Date }): Promise<void>;
  markFailedRetryable(input: { readonly id: string; readonly lastError: string; readonly nextAvailableAt: Date }): Promise<void>;
  markFailedPermanent(input: { readonly id: string; readonly lastError: string }): Promise<void>;
  markCancelled(input: { readonly id: string; readonly reason: string }): Promise<void>;

  findById(id: string): Promise<CommunicationMessageRecord | null>;
  /** Observability query (assignment §34) — every message ever created for a reservation, newest first. */
  findByReservationId(reservationId: string): Promise<readonly CommunicationMessageRecord[]>;
  findByIdempotencyKey(idempotencyKey: string): Promise<CommunicationMessageRecord | null>;
}
