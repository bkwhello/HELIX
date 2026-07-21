/**
 * See event-model.md for the authoritative event definitions.
 *
 * CAP-D01.01-EV-01..06 apply to every event here:
 * past tense, immutable, never mutate state themselves, one authoritative
 * meaning, owned by Reservation Management even when consumed elsewhere.
 */

interface BaseEvent {
  readonly reservationId: string;
  readonly occurredAt: Date;
}

/** CAP-D01.01-E01 — ReservationCreated */
export interface ReservationCreated extends BaseEvent {
  readonly type: "ReservationCreated";
  readonly servicePeriodId: string;
  readonly contactId: string;
  readonly reservationDate: Date;
  readonly partySize: number;
  readonly reservationSource: string;
  readonly createdBy: string;
  /** Present only when reservationSource is External Import. */
  readonly externalReference?: string;
  readonly importedBy?: string;
}

/** CAP-D01.01-E02 — ReservationModified */
export interface ReservationModified extends BaseEvent {
  readonly type: "ReservationModified";
  readonly changedFields: readonly string[];
  readonly previousValues: Readonly<Record<string, unknown>>;
  readonly resultingValues: Readonly<Record<string, unknown>>;
  readonly actor: string;
  readonly reason?: string;
}

/** CAP-D01.01-E03 — ReservationConfirmed */
export interface ReservationConfirmed extends BaseEvent {
  readonly type: "ReservationConfirmed";
  readonly actor: string;
}

/** CAP-D01.01-E04 — ReservationCancelled */
export interface ReservationCancelled extends BaseEvent {
  readonly type: "ReservationCancelled";
  readonly cancelReason?: string;
  readonly cancelledBy: string;
}

/** CAP-D01.01-E05 — ReservationCompleted */
export interface ReservationCompleted extends BaseEvent {
  readonly type: "ReservationCompleted";
  readonly actor: string;
  readonly evidence?: string;
}

export type ReservationDomainEvent =
  | ReservationCreated
  | ReservationModified
  | ReservationConfirmed
  | ReservationCancelled
  | ReservationCompleted;
