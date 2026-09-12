import { ServiceSessionRepository } from "../../domain/repositories/ServiceSessionRepository.js";
import { ServiceSession, ServiceSessionStatus, isValidServiceSessionTransition } from "../../domain/availability/ServiceSession.js";
import { isServiceCode } from "../../domain/availability/Service.js";
import { TransactionManager } from "../ports/TransactionManager.js";
import { IdGenerator } from "../ports/IdGenerator.js";
import { Clock } from "../ports/Clock.js";
import { Actor } from "../../domain/value-objects/Actor.js";

export type ServiceSessionCreateOutcome =
  | { readonly type: "CREATED"; readonly session: ServiceSession }
  | { readonly type: "ALREADY_EXISTS"; readonly session: ServiceSession }
  | { readonly type: "INVALID_SERVICE_CODE" }
  | { readonly type: "INVALID_SERVICE_DATE" };

export type ServiceSessionTransitionOutcome =
  | { readonly type: "OPENED"; readonly session: ServiceSession }
  | { readonly type: "CLOSED"; readonly session: ServiceSession }
  | { readonly type: "CANCELLED"; readonly session: ServiceSession }
  | { readonly type: "NOT_FOUND" }
  | { readonly type: "INVALID_TRANSITION"; readonly currentStatus: ServiceSessionStatus }
  | { readonly type: "ACTIVE_ASSIGNMENTS_EXIST"; readonly count: number }
  /** Defensive-only — structurally unreachable while the session lock is held for the full transition; see handle()'s own comment. */
  | { readonly type: "CONCURRENCY_CONFLICT" };

const SERVICE_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function isValidServiceDate(value: string): boolean {
  if (!SERVICE_DATE_PATTERN.test(value)) return false;
  return !Number.isNaN(new Date(`${value}T00:00:00.000Z`).getTime());
}

const OUTCOME_TYPE_BY_STATUS: Readonly<Record<"Opened" | "Closed" | "Cancelled", "OPENED" | "CLOSED" | "CANCELLED">> = {
  Opened: "OPENED",
  Closed: "CLOSED",
  Cancelled: "CANCELLED",
};

/**
 * R1.6-P2C-1 — the four lifecycle operations (create/open/close/cancel),
 * each its own transaction, each acquiring the Tier-1.5 session lock
 * before reading or writing the row — see `domain/availability/LockKey.ts`.
 * `list`/`findByKey`/`findById` are pure reads, delegated straight to the
 * repository (no lock needed for a read-only query).
 */
export class ServiceSessionService {
  constructor(
    private readonly repository: ServiceSessionRepository,
    private readonly transactionManager: TransactionManager,
    private readonly idGenerator: IdGenerator,
    private readonly clock: Clock
  ) {}

  async list(): Promise<readonly ServiceSession[]> {
    return this.repository.list();
  }

  async findById(id: string): Promise<ServiceSession | null> {
    return this.repository.findById(id);
  }

  /**
   * Duplicate creation (Chief Engineer race proof #1): the session lock
   * is acquired BEFORE the existence check, so two concurrent creates for
   * the identical `(serviceCode, serviceDate)` serialize — the second
   * always observes the first's already-committed row and returns
   * `ALREADY_EXISTS`, never a duplicate-key exception surfacing
   * unhandled. The `@@unique` constraint remains the authoritative,
   * database-level backstop regardless (same "lock is the fast path,
   * the constraint is what actually guarantees it" posture as every
   * other idempotency mechanism in this codebase).
   */
  async create(input: { readonly serviceCode: string; readonly serviceDate: string; readonly actor: Actor }): Promise<ServiceSessionCreateOutcome> {
    if (!isServiceCode(input.serviceCode)) return { type: "INVALID_SERVICE_CODE" };
    if (!isValidServiceDate(input.serviceDate)) return { type: "INVALID_SERVICE_DATE" };

    return this.transactionManager.runInTransaction(async (tx) => {
      await this.repository.acquireSessionLock({ serviceCode: input.serviceCode, serviceDate: input.serviceDate, tx });
      const existing = await this.repository.findByKey(input.serviceCode, input.serviceDate, tx);
      if (existing) return { type: "ALREADY_EXISTS", session: existing };
      const session = await this.repository.create({
        id: this.idGenerator.generate(),
        serviceCode: input.serviceCode,
        serviceDate: input.serviceDate,
        createdBy: input.actor.id,
        createdAt: this.clock.now(),
        tx,
      });
      return { type: "CREATED", session };
    });
  }

  async open(id: string): Promise<ServiceSessionTransitionOutcome> {
    return this.transition(id, "Opened", new Set<ServiceSessionStatus>(["Created"]));
  }

  /** Chief Engineer decision #12 — blocked ONLY by active Assigned/Seated SeatingAssignments for the derived service/date; Reservation/CapacityCommitment state never blocks. */
  async close(id: string): Promise<ServiceSessionTransitionOutcome> {
    return this.transition(id, "Closed", new Set<ServiceSessionStatus>(["Opened"]));
  }

  async cancel(id: string): Promise<ServiceSessionTransitionOutcome> {
    return this.transition(id, "Cancelled", new Set<ServiceSessionStatus>(["Created"]));
  }

  private async transition(
    id: string,
    targetStatus: "Opened" | "Closed" | "Cancelled",
    allowedFrom: ReadonlySet<ServiceSessionStatus>
  ): Promise<ServiceSessionTransitionOutcome> {
    // Pre-transaction lookup ONLY to discover which (serviceCode,
    // serviceDate) to lock — never authoritative; the SAME re-read
    // pattern this codebase already uses everywhere else (e.g.
    // AvailabilityOrchestrator.modifyWithCapacity's own
    // `existingCommitment` re-read after its locks are held).
    const preLookup = await this.repository.findById(id);
    if (!preLookup) return { type: "NOT_FOUND" };

    return this.transactionManager.runInTransaction(async (tx) => {
      await this.repository.acquireSessionLock({ serviceCode: preLookup.serviceCode, serviceDate: preLookup.serviceDate, tx });
      const current = await this.repository.findById(id, tx);
      if (!current) return { type: "NOT_FOUND" };

      // Chief Engineer decision #5 — repeating an already-achieved
      // transition is idempotent: no write, no restamp, no version bump.
      if (current.status === targetStatus) {
        return { type: OUTCOME_TYPE_BY_STATUS[targetStatus], session: current };
      }
      if (!allowedFrom.has(current.status) || !isValidServiceSessionTransition(current.status, targetStatus)) {
        return { type: "INVALID_TRANSITION", currentStatus: current.status };
      }

      if (targetStatus === "Closed") {
        const activeCount = await this.repository.countActiveAssignmentsForServiceDate({
          serviceCode: current.serviceCode,
          serviceDate: current.serviceDate,
          tx,
        });
        if (activeCount > 0) return { type: "ACTIVE_ASSIGNMENTS_EXIST", count: activeCount };
      }

      const result = await this.repository.updateStatus({
        id: current.id,
        expectedVersion: current.version,
        newStatus: targetStatus,
        timestamp: this.clock.now(),
        tx,
      });
      // Structurally unreachable: the session lock, held continuously
      // since before this transaction's own `current` re-read, excludes
      // every other writer of this exact row for the lock's whole
      // lifetime — nothing else could have changed `current.version` out
      // from under this transition. Handled as a typed outcome anyway,
      // never assumed away with a non-null assertion.
      if (result.type === "VERSION_CONFLICT") return { type: "CONCURRENCY_CONFLICT" };
      return { type: OUTCOME_TYPE_BY_STATUS[targetStatus], session: result.session };
    });
  }
}
