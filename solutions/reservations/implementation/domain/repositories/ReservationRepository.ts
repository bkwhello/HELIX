import { ReservationAggregate } from "../aggregates/ReservationAggregate.js";
import { ReservationId } from "../value-objects/ReservationId.js";
import { TransactionContext } from "../shared/TransactionContext.js";
import { CriticalNoteType, CriticalNoteStatus } from "../value-objects/ReservationCriticalNote.js";

/** R1.3-I3 — CAP-D05.02. The full persisted shape of one critical note, as read back. Actor ids are included here (repository-internal) but are NEVER part of the ordinary Reservation API response allowlist — see api/app.ts's own projection. */
export interface ReservationCriticalNoteRecord {
  readonly id: string;
  readonly reservationId: string;
  readonly noteType: CriticalNoteType;
  readonly detail: string;
  readonly status: CriticalNoteStatus;
  readonly createdByStaffUserId: string;
  readonly updatedByStaffUserId: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly resolvedAt: Date | null;
}

/**
 * R1.3-I3 — the already-validated, ready-to-apply instructions for the
 * child-note side of one Modify save() call. The repository performs no
 * validation here (ModifyReservationHandler already validated identity/
 * lifecycle rules against a fresh pre-read — see CriticalNoteRules.ts) —
 * it only executes exactly these three operations, atomically alongside
 * the Reservation row update, the ReservationEvent insert, and the
 * AppliedCommand marker, all gated by the SAME optimistic version check
 * save() already performs on the parent Reservation.
 */
export interface CriticalNoteWrites {
  readonly actingStaffUserId: string;
  readonly now: Date;
  readonly add: ReadonlyArray<{ readonly id: string; readonly noteType: CriticalNoteType; readonly detail: string }>;
  readonly update: ReadonlyArray<{ readonly id: string; readonly noteType: CriticalNoteType; readonly detail: string }>;
  readonly resolve: ReadonlyArray<{ readonly id: string }>;
}

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
   * R1.6-B — supports the reminder scan (application/communications/CommunicationOutboxService.ts):
   * every reservation, in any status, whose reservationDate falls in
   * `[from, to)`. The caller (not this method) filters by status/
   * eligibility — this is a plain range read, mirroring findByDate's own
   * "returns everything in range, caller distinguishes status" contract.
   */
  findStartingBetween(from: Date, to: Date): Promise<ReservationAggregate[]>;

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
    /**
     * R1.3-I3 — CAP-D05.02. Omitted/undefined: no critical-note change
     * (today's unchanged behavior for every existing caller). When
     * supplied, `add`/`update`/`resolve` are executed atomically inside
     * the SAME transaction and gated by the SAME optimistic version
     * check as the Reservation row update — a version mismatch rolls
     * back the note writes too, exactly like the event/AppliedCommand
     * writes already do.
     */
    readonly criticalNoteWrites?: CriticalNoteWrites;
  }): Promise<SaveResult>;

  /**
   * R1.3-I3 — CAP-D05.02. Unlocked, non-authoritative read used by
   * ModifyReservationHandler to validate an `add`/`update`/`resolve`
   * request BEFORE calling aggregate.modify()/save() — the SAME timing
   * convention `servicePeriodId` revalidation already uses in
   * ModifyReservationHandler. Never used to decide what is safe to
   * WRITE; `save()`'s own optimistic version check is what actually
   * guards concurrent writes to the same Reservation (see
   * CriticalNoteWrites's own doc comment).
   */
  findCriticalNotesByReservationId(reservationId: string, tx?: TransactionContext): Promise<readonly ReservationCriticalNoteRecord[]>;

  /**
   * R1.3-I3 — CAP-D05.02. Batched read for GET /reservations (one query
   * for the whole day's list, never N+1) — `activeOnly: true` for the
   * list view, `false` for a single-reservation detail view. Ordered
   * `(reservationId, createdAt ASC, id ASC)` — deterministic, matching
   * every other append-ordered read in this codebase.
   */
  findCriticalNotesByReservationIds(
    reservationIds: readonly string[],
    options: { readonly activeOnly: boolean }
  ): Promise<readonly ReservationCriticalNoteRecord[]>;
}
