import { ReservationAggregate } from "../aggregates/ReservationAggregate.js";
import { ReservationId } from "../value-objects/ReservationId.js";

/**
 * Port (interface). No implementation lives in domain/ — infrastructure/
 * provides the adapter (e.g. a Postgres-backed implementation).
 *
 * CAP-D01.01-R44 — Duplicate Command Processing Must Be Safe — is a
 * responsibility of the concrete implementation of this port: it must
 * make save() idempotent for a repeated commandId.
 */
export interface ReservationRepository {
  findById(id: ReservationId): Promise<ReservationAggregate | null>;

  /**
   * CAP-D01.01-R44 — supports safe retry of a creation command: if
   * commandId was already applied, the caller should return this
   * reservation instead of generating and discarding a new identity.
   */
  findByCommandId(commandId: string): Promise<ReservationAggregate | null>;

  /**
   * Finds reservations that could be duplicates of the given candidate,
   * per CAP-D01.01-R14. Returns true if a plausible duplicate exists.
   * Matching strategy (contact, date, time, party size, source, external
   * reference) is an infrastructure concern, not a domain one.
   */
  hasPotentialDuplicate(candidate: {
    contactId: string;
    reservationDate: Date;
    partySize: number;
  }): Promise<boolean>;

  /**
   * Persists the aggregate. Implementations must be idempotent for a
   * repeated commandId (CAP-D01.01-R44) and atomic (CAP-D01.01-R05):
   * either the whole state change and its events are committed, or
   * neither is.
   */
  save(aggregate: ReservationAggregate, commandId: string): Promise<void>;
}
