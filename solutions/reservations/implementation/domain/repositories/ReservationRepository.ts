import { ReservationAggregate } from "../aggregates/ReservationAggregate.js";
import { ReservationId } from "../value-objects/ReservationId.js";
import { TransactionContext } from "../shared/TransactionContext.js";

/**
 * Outcome of a save() attempt. Concurrency conflicts and a lost
 * idempotency race are expected, first-class outcomes here — not thrown
 * exceptions — so the application layer handles them explicitly instead
 * of relying on an infrastructure-level try/catch.
 */
export type SaveResult =
  | { readonly type: "SAVED"; readonly newVersion: number }
  /** Nothing was written: `commandId` was already applied — by this call arriving twice, or by a concurrent call that won the race. The caller should look the result up via findByCommandId(). */
  | { readonly type: "IDEMPOTENT_REPLAY" }
  /** Nothing was written: `expectedVersion` no longer matches what is persisted. The caller should reload and retry. */
  | { readonly type: "CONCURRENCY_CONFLICT" };

/**
 * Port (interface). No implementation lives in domain/ — infrastructure/
 * provides the adapter (e.g. a Postgres-backed implementation).
 *
 * Aggregate persistence only. Duplicate detection, contact resolution, and
 * Service Period validation are separate ports (DuplicateReservationChecker,
 * ContactRepository, ServicePeriodReader) — they are cross-capability queries,
 * not concerns of the Reservation aggregate's own repository.
 */
export interface ReservationRepository {
  findById(id: ReservationId): Promise<ReservationAggregate | null>;

  /**
   * CAP-D01.01-AC34 — Today's Active Reservations Are Operationally
   * Discoverable. Returns every reservation whose date falls on the
   * given calendar day, in any status — the caller distinguishes
   * Proposed/Confirmed/Cancelled, this does not filter them out.
   * Service-Period-scoped discovery is not available: Service Period
   * Management does not exist as a capability yet (see
   * ServicePeriodReader), so "current service period" narrows to "this
   * calendar day" for now.
   */
  findByDate(date: Date): Promise<ReservationAggregate[]>;

  /**
   * CAP-D01.01-R44 — supports safe retry of a creation command: if
   * commandId was already applied, the caller should return this
   * reservation instead of generating and discarding a new identity.
   */
  findByCommandId(commandId: string): Promise<ReservationAggregate | null>;

  /**
   * Persists the aggregate. Must be atomic (CAP-D01.01-R05): the state
   * write, its events, and the applied-command marker either all commit
   * or none does.
   *
   * `expectedVersion` is the version the caller believes is currently
   * persisted (normally `aggregate.getVersion()`) — passed explicitly
   * rather than read off the aggregate internally, so the contract is
   * self-documenting. A mismatch against what is actually persisted
   * yields CONCURRENCY_CONFLICT rather than a blind overwrite.
   *
   * On IDEMPOTENT_REPLAY or CONCURRENCY_CONFLICT, nothing is written —
   * in particular, the aggregate's pending events are left untouched
   * (use `peekEvents()`, not `pullEvents()`, until SAVED is returned) so
   * a caller can safely inspect or retry.
   *
   * `tx` (CAP-D02.03) — when supplied, this write participates in the
   * caller's already-open transaction instead of opening its own, so it
   * can commit or roll back atomically alongside a capacity commitment
   * write (see AvailabilityOrchestrator). Omitted, behavior is unchanged
   * from CAP-D01.01: save() opens and commits its own transaction.
   */
  save(input: {
    readonly aggregate: ReservationAggregate;
    readonly expectedVersion: number;
    readonly commandId: string;
    readonly tx?: TransactionContext;
  }): Promise<SaveResult>;
}
