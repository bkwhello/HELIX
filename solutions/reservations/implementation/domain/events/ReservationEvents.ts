/**
 * See event-model.md for the authoritative event definitions and §4
 * "Common Event Structure" for the envelope fields every event carries.
 *
 * CAP-D01.01-EV-01..06 apply to every event here:
 * past tense, immutable, never mutate state themselves, one authoritative
 * meaning, owned by Reservation Management even when consumed elsewhere.
 */

import { ActorKind } from "../value-objects/Actor.js";
import { CompletionEvidence } from "../value-objects/CompletionEvidence.js";
import { ReservationSourceCategory } from "../value-objects/ReservationSource.js";

/**
 * event-model.md §4 common structure, mapped to this implementation:
 * event_id → eventId, event_type → `type` (the discriminant below),
 * version → eventVersion (schema version of the event definition, not
 * the aggregate's), reservation_id → reservationId, actor/correlation_id/
 * causation_id → as named. `aggregateVersion` is implementation-only
 * metadata (event-model.md §4 allows this): the ReservationAggregate
 * version this event resulted in, so a consumer can tell a duplicate or
 * out-of-order delivery apart from a genuinely new state change.
 */
interface BaseEvent {
  readonly eventId: string;
  readonly eventVersion: number;
  readonly reservationId: string;
  readonly aggregateVersion: number;
  readonly occurredAt: Date;
  readonly correlationId: string;
  readonly causationId?: string;
  readonly actor: {
    readonly id: string;
    readonly type: ActorKind;
  };
}

/** CAP-D01.01-E01 — ReservationCreated */
export interface ReservationCreated extends BaseEvent {
  readonly type: "ReservationCreated";
  readonly servicePeriodId: string;
  readonly contactId: string;
  readonly reservationDate: Date;
  readonly partySize: number;
  readonly reservationSource: ReservationSourceCategory;
  /** Present only when reservationSource is External Import. */
  readonly externalReference?: string;
  readonly importedBy?: string;
  /** CAP-D01.01-R14 — true when a potential duplicate was detected at creation time. Warning, not blocking. */
  readonly potentialDuplicateWarning: boolean;
}

/** CAP-D01.01-E02 — ReservationModified */
export interface ReservationModified extends BaseEvent {
  readonly type: "ReservationModified";
  readonly changedFields: readonly string[];
  readonly previousValues: Readonly<Record<string, unknown>>;
  readonly resultingValues: Readonly<Record<string, unknown>>;
  readonly reason?: string;
}

/** CAP-D01.01-E03 — ReservationConfirmed */
export interface ReservationConfirmed extends BaseEvent {
  readonly type: "ReservationConfirmed";
}

/** CAP-D01.01-E04 — ReservationCancelled */
export interface ReservationCancelled extends BaseEvent {
  readonly type: "ReservationCancelled";
  readonly cancelReason?: string;
}

/** CAP-D01.01-E05 — ReservationCompleted */
export interface ReservationCompleted extends BaseEvent {
  readonly type: "ReservationCompleted";
  readonly evidence?: CompletionEvidence;
  readonly manualCompletionReason?: string;
}

export type ReservationDomainEvent =
  | ReservationCreated
  | ReservationModified
  | ReservationConfirmed
  | ReservationCancelled
  | ReservationCompleted;
