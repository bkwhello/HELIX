import { CapacityCommitment, CapacityCommitmentStatus, CommitmentInterval } from "../availability/CapacityCommitment.js";
import { TransactionContext } from "../shared/TransactionContext.js";

/**
 * Port (interface). No implementation lives in domain/ — infrastructure/
 * provides the Prisma-backed adapter. Mirrors the shape of
 * ReservationRepository (domain/repositories/ReservationRepository.ts):
 * same file location, same "port has no I/O opinions, adapter does"
 * split.
 *
 * Every write method requires `tx` (not optional) — a capacity write
 * outside the shared transaction with its paired reservation write would
 * reintroduce exactly the "release old -> fail new -> guest loses
 * booking" class of defect this architecture exists to close. Reads are
 * also transaction-scoped (`tx` optional but should be supplied by any
 * caller that just acquired the advisory lock, so the read observes a
 * consistent snapshot under that lock).
 */
export interface CapacityRepository {
  /**
   * Committed commitments for a pool whose interval could possibly
   * overlap `[rangeStart, rangeEnd)`. This is a coarse pre-filter, not
   * itself the availability decision — callers pass the result to
   * AvailabilityEvaluator.evaluateSimultaneousOccupancy, which performs
   * the exact per-slice overlap test. Passing a range at least as wide as
   * the requested interval is the caller's responsibility.
   */
  findOverlappingCommitments(input: {
    readonly capacityPoolId: string;
    readonly rangeStart: Date;
    readonly rangeEnd: Date;
    readonly tx?: TransactionContext;
  }): Promise<readonly CommitmentInterval[]>;

  findById(commitmentId: string, tx?: TransactionContext): Promise<CapacityCommitment | null>;

  findByCommandId(commandId: string, tx?: TransactionContext): Promise<CapacityCommitment | null>;

  /** The currently-Committed commitment for a reservation, if any — used by Modify (to supersede it) and Cancel (to release it). A reservation has at most one Committed commitment at a time by construction (Modify always supersedes the prior one in the same transaction that creates the new one). */
  findActiveByReservationId(reservationId: string, tx?: TransactionContext): Promise<CapacityCommitment | null>;

  /**
   * Acquires a transaction-scoped PostgreSQL advisory lock
   * (`pg_advisory_xact_lock`) for `(capacityPoolId, localServiceDate)`.
   * Must be called inside `tx`, before any occupancy read for that
   * resource. For an operation touching more than one (pool, date)
   * resource, the caller MUST acquire all of them in the order produced
   * by `LockKey.sortLockResources` — see that module for why. The lock is
   * released automatically at transaction end (commit or rollback); there
   * is no explicit unlock method.
   */
  acquireCapacityLock(input: { readonly capacityPoolId: string; readonly localServiceDate: string; readonly tx: TransactionContext }): Promise<void>;

  /** Inserts a new commitment (default status Committed). Must run inside `tx`. */
  create(input: {
    readonly commitment: {
      readonly commitmentId: string;
      readonly reservationId: string | null;
      readonly capacityPoolId: string;
      readonly startTime: Date;
      readonly endTime: Date;
      readonly partySize: number;
      readonly commandId: string;
      readonly status?: CapacityCommitmentStatus;
    };
    readonly tx: TransactionContext;
  }): Promise<CapacityCommitment>;

  /** Marks a commitment Released (Cancel) or Superseded (Modify's old interval). Must run inside `tx`. */
  updateStatus(input: { readonly commitmentId: string; readonly status: CapacityCommitmentStatus; readonly tx: TransactionContext }): Promise<void>;
}
