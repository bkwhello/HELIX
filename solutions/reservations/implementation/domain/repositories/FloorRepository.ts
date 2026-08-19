import { Table } from "../floor/Table.js";
import { Seat } from "../floor/Seat.js";
import { ResourceBlock } from "../floor/ResourceBlock.js";
import { SeatingAssignment, SeatingAssignmentResource, SeatingAssignmentStatus, ReleaseReason } from "../floor/SeatingAssignment.js";
import { TransactionContext } from "../shared/TransactionContext.js";

/**
 * Port (interface) for CAP-D03.03/CAP-D04.01 persistence — mirrors
 * CapacityRepository's own port/adapter split (domain has no I/O
 * opinions, infrastructure/ provides the Prisma-backed adapter). Every
 * write method requires `tx`, for the same reason CapacityRepository's
 * write methods do: a seating write outside the shared transaction with
 * its paired reservation/capacity write would reopen the exact
 * half-applied-booking defect class R1.1 exists to close.
 */
export interface FloorRepository {
  findTableById(tableId: string, tx?: TransactionContext): Promise<Table | null>;
  findTableByLabel(operationalLabel: string, tx?: TransactionContext): Promise<Table | null>;
  findTablesByArea(areaId: string, tx?: TransactionContext): Promise<readonly Table[]>;
  findSeatById(seatId: string, tx?: TransactionContext): Promise<Seat | null>;
  findSeatsByTableId(tableId: string, tx?: TransactionContext): Promise<readonly Seat[]>;

  /** Active ResourceBlocks whose interval could possibly overlap [rangeStart, rangeEnd) for the given table. */
  findOverlappingResourceBlocks(input: {
    readonly tableId: string;
    readonly rangeStart: Date;
    readonly rangeEnd: Date;
    readonly tx?: TransactionContext;
  }): Promise<readonly ResourceBlock[]>;

  createResourceBlock(input: {
    readonly tableId: string;
    readonly startTime: Date;
    readonly endTime: Date;
    readonly reason: string | null;
    readonly createdBy: string;
    readonly tx: TransactionContext;
  }): Promise<ResourceBlock>;

  /** Non-Released SeatingAssignmentResource rows for a table/seat whose interval could possibly overlap [rangeStart, rangeEnd) — a coarse pre-filter for CanSeat, not itself the structural guarantee (the EXCLUDE constraint is). */
  findOverlappingResourceClaims(input: {
    readonly tableIds: readonly string[];
    readonly seatIds: readonly string[];
    readonly rangeStart: Date;
    readonly rangeEnd: Date;
    readonly tx?: TransactionContext;
  }): Promise<{ readonly tableIds: ReadonlySet<string>; readonly seatIds: ReadonlySet<string> }>;

  findAssignmentByCommandId(commandId: string, tx?: TransactionContext): Promise<SeatingAssignment | null>;

  /** The current non-Released SeatingAssignment for a reservation, if any — at most one by construction (partial unique index). */
  findActiveAssignmentByReservationId(reservationId: string, tx?: TransactionContext): Promise<SeatingAssignment | null>;

  findAssignmentResources(assignmentId: string, tx?: TransactionContext): Promise<readonly SeatingAssignmentResource[]>;

  createAssignment(input: {
    readonly assignment: {
      readonly id: string;
      readonly reservationId: string;
      readonly status: SeatingAssignmentStatus;
      readonly startTime: Date;
      readonly endTime: Date;
      readonly assignedBy: string;
      readonly commandId: string;
    };
    readonly resources: readonly { readonly tableId: string | null; readonly seatId: string | null }[];
    readonly tx: TransactionContext;
  }): Promise<SeatingAssignment>;

  updateAssignmentStatus(input: {
    readonly assignmentId: string;
    readonly status: SeatingAssignmentStatus;
    readonly releaseReason?: ReleaseReason;
    readonly actorId?: string;
    readonly tx: TransactionContext;
  }): Promise<void>;

  /**
   * Acquires a transaction-scoped PostgreSQL advisory lock for one
   * seating resource (a Table or Seat id) — Tier 3 of the global lock
   * order (LockKey.ts). Callers with more than one resource MUST acquire
   * them in `LockKey.sortSeatingResourceIds` order, after Tier 1
   * (reservation lock) and Tier 2 (capacity lock, if relevant).
   */
  acquireSeatingResourceLock(input: { readonly resourceId: string; readonly tx: TransactionContext }): Promise<void>;
}
