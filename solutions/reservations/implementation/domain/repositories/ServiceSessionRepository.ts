import { ServiceSession, ServiceSessionStatus } from "../availability/ServiceSession.js";
import { TransactionContext } from "../shared/TransactionContext.js";

/**
 * R1.6-P2C-1. Every write method requires `tx` — same posture as
 * `CapacityRepository` (see that port's own doc comment): a
 * ServiceSession status transition standing alone, outside the shared
 * transaction with whatever it is meant to serialize against, would
 * reintroduce exactly the race this feature exists to close.
 */
export interface ServiceSessionRepository {
  findByKey(serviceCode: string, serviceDate: string, tx?: TransactionContext): Promise<ServiceSession | null>;
  findById(id: string, tx?: TransactionContext): Promise<ServiceSession | null>;
  list(tx?: TransactionContext): Promise<readonly ServiceSession[]>;

  /** Rejects (translated by the caller) on the `(serviceCode, serviceDate)` unique-constraint collision — never a pre-check-then-write. */
  create(input: {
    readonly id: string;
    readonly serviceCode: string;
    readonly serviceDate: string;
    readonly createdBy: string;
    readonly createdAt: Date;
    readonly tx: TransactionContext;
  }): Promise<ServiceSession>;

  /**
   * Version-checked compare-and-swap, mirroring
   * `PrismaReservationRepository.save()`'s own `updateMany({where:
   * {id, version: expectedVersion}, ...})` pattern exactly. The caller
   * (`ServiceSessionService`) is responsible for idempotent-repeat
   * detection (calling this only for a REAL transition) and for
   * choosing which timestamp field `timestamp` stamps.
   */
  updateStatus(input: {
    readonly id: string;
    readonly expectedVersion: number;
    readonly newStatus: ServiceSessionStatus;
    readonly timestamp: Date;
    readonly tx: TransactionContext;
  }): Promise<{ readonly type: "UPDATED"; readonly session: ServiceSession } | { readonly type: "VERSION_CONFLICT" }>;

  /**
   * Tier 1.5 of the global lock order (see `domain/availability/LockKey.ts`'s
   * own doc comment) — `pg_advisory_xact_lock`, released automatically at
   * transaction end. Acquired by every path that can create, retain, or
   * recreate an active SeatingAssignment, and by open/close/cancel
   * themselves, so a check-then-write on either side can never race the
   * other.
   */
  acquireSessionLock(input: { readonly serviceCode: string; readonly serviceDate: string; readonly tx: TransactionContext }): Promise<void>;

  /**
   * The Close invariant's own evidence query (Chief Engineer directive):
   * restricted in SQL to a generous UTC range around the Amsterdam local
   * `serviceDate` (a coarse pre-filter — mirrors
   * `CapacityRepository.findOverlappingCommitments`'s own established
   * "coarse SQL pre-filter, exact test in application code" precedent),
   * joined through `Reservation`, counting only `Assigned`/`Seated`
   * `SeatingAssignment` rows. The exact Amsterdam-local-date match (and,
   * for symmetry, the canonical Service-code re-derivation) is applied
   * by the caller against each returned row — see
   * `PrismaServiceSessionRepository`'s own implementation comment for
   * why the SQL range is deliberately wider than exactly one calendar
   * day.
   */
  countActiveAssignmentsForServiceDate(input: { readonly serviceCode: string; readonly serviceDate: string; readonly tx: TransactionContext }): Promise<number>;
}
