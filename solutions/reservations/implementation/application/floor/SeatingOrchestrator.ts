/**
 * CAP-D04.01 — Seating Orchestrator (R1.5).
 *
 * The one place that composes: reservation-scoped lock -> seating-resource
 * lock(s), sorted -> CanSeat evaluation -> SeatingAssignment write, as a
 * single shared PostgreSQL transaction — extending
 * AvailabilityOrchestrator's own proven pattern by exactly one tier
 * (R1_5_FLOOR_SEATING_FINAL_ARCHITECTURE.md §18/§20). Deliberately does
 * NOT change AvailabilityOrchestrator's create/modify paths — most
 * seating-only operations (pre-assignment, move, mark-seated, No-Show
 * release) get their OWN transaction, per the final architecture's own
 * §20 transaction matrix; only cancellation needs seating released in the
 * SAME transaction as the reservation/capacity release, which is why
 * `releaseActiveAssignmentForReservation` exists as a tx-scoped helper
 * AvailabilityOrchestrator.cancelWithCapacity calls directly, reusing the
 * reservation lock that call already holds (see that method).
 *
 * Idempotency: same two-layer pattern as AvailabilityOrchestrator
 * (pre-transaction fast-path findByCommandId, then a second, tx-scoped
 * check after the lock is held) — see that class's own header comment
 * for why both are necessary.
 */
import { FloorRepository } from "../../domain/repositories/FloorRepository.js";
import { TransactionManager } from "../ports/TransactionManager.js";
import { IdGenerator } from "../ports/IdGenerator.js";
import { Clock } from "../ports/Clock.js";
import { SeatingAssignment, ReleaseReason } from "../../domain/floor/SeatingAssignment.js";
import { evaluateSeatability, SeatabilityCandidate, SeatabilityOutcome } from "../../domain/floor/SeatabilityEvaluator.js";
import { deriveReservationLockKey, sortSeatingResourceIds } from "../../domain/availability/LockKey.js";
import { asPrismaTx } from "../../infrastructure/persistence/PrismaTransactionManager.js";
import { TransactionContext } from "../../domain/shared/TransactionContext.js";
import { Actor } from "../../domain/value-objects/Actor.js";

export interface ResourceSelector {
  readonly tableId?: string;
  readonly seatId?: string;
}

export interface AssignSeatingRequest {
  readonly commandId: string;
  readonly reservationId: string;
  readonly requestedAreaId: string;
  readonly requestedPartySize: number;
  readonly resources: readonly ResourceSelector[];
  readonly startTime: Date;
  readonly endTime: Date;
  readonly actor: Actor;
  /** true for a walk-in seated immediately; false/omitted for ordinary pre-assignment (final architecture §12/§13). */
  readonly seatImmediately?: boolean;
}

export type AssignSeatingOutcome =
  | { readonly type: "ASSIGNED"; readonly assignment: SeatingAssignment }
  | { readonly type: "NOT_SEATABLE"; readonly seatability: SeatabilityOutcome }
  | { readonly type: "ALREADY_ASSIGNED_ELSEWHERE" };

export interface MoveSeatingRequest {
  readonly commandId: string;
  readonly reservationId: string;
  readonly requestedAreaId: string;
  readonly requestedPartySize: number;
  readonly resources: readonly ResourceSelector[];
  readonly actor: Actor;
}

export type MoveSeatingOutcome =
  | { readonly type: "MOVED"; readonly assignment: SeatingAssignment }
  | { readonly type: "NOT_SEATABLE"; readonly seatability: SeatabilityOutcome }
  | { readonly type: "NO_ACTIVE_ASSIGNMENT" };

export type MarkSeatedOutcome = { readonly type: "SEATED" } | { readonly type: "NO_ACTIVE_ASSIGNMENT" };
export type ReleaseNoShowOutcome = { readonly type: "RELEASED" } | { readonly type: "NO_ACTIVE_ASSIGNMENT" };

export class SeatingOrchestrator {
  constructor(
    private readonly floorRepository: FloorRepository,
    private readonly transactionManager: TransactionManager,
    private readonly idGenerator: IdGenerator,
    private readonly clock: Clock
  ) {}

  /** Every locked resourceId (Table or Seat) a selector set touches, deduplicated. */
  private resourceIdsOf(resources: readonly ResourceSelector[]): readonly string[] {
    return resources.map((r) => r.tableId ?? r.seatId).filter((id): id is string => !!id);
  }

  private async buildCandidates(
    resources: readonly ResourceSelector[],
    startTime: Date,
    endTime: Date,
    tx: TransactionContext
  ): Promise<readonly SeatabilityCandidate[]> {
    const tableIds = resources.filter((r) => r.tableId).map((r) => r.tableId!);
    const seatIds = resources.filter((r) => r.seatId).map((r) => r.seatId!);
    const overlapping = await this.floorRepository.findOverlappingResourceClaims({ tableIds, seatIds, rangeStart: startTime, rangeEnd: endTime, tx });

    const candidates: SeatabilityCandidate[] = [];
    for (const selector of resources) {
      if (selector.tableId) {
        const table = await this.floorRepository.findTableById(selector.tableId, tx);
        const blocks = table ? await this.floorRepository.findOverlappingResourceBlocks({ tableId: table.id, rangeStart: startTime, rangeEnd: endTime, tx }) : [];
        candidates.push({
          resourceId: selector.tableId,
          resourceLabel: table?.operationalLabel ?? selector.tableId,
          resourceKind: "Table",
          found: !!table,
          active: table?.status === "Active",
          areaId: table?.areaId ?? "",
          capacity: table?.nominalCapacity ?? 0,
          supportsRequestedClaimKind: table ? !table.supportsSharedSeating : false,
          blockedForInterval: blocks.length > 0,
          overlappingActiveAssignment: overlapping.tableIds.has(selector.tableId),
        });
      } else if (selector.seatId) {
        const seat = await this.floorRepository.findSeatById(selector.seatId, tx);
        const table = seat ? await this.floorRepository.findTableById(seat.tableId, tx) : null;
        const blocks = table ? await this.floorRepository.findOverlappingResourceBlocks({ tableId: table.id, rangeStart: startTime, rangeEnd: endTime, tx }) : [];
        candidates.push({
          resourceId: selector.seatId,
          resourceLabel: table && seat ? `${table.operationalLabel}-${seat.operationalLabel.split("-").pop()}` : (seat?.operationalLabel ?? selector.seatId),
          resourceKind: "Seat",
          found: !!seat && !!table,
          active: seat?.status === "Active" && table?.status === "Active",
          areaId: table?.areaId ?? "",
          capacity: 1,
          supportsRequestedClaimKind: table ? table.supportsSharedSeating : false,
          blockedForInterval: blocks.length > 0,
          overlappingActiveAssignment: overlapping.seatIds.has(selector.seatId),
        });
      }
    }
    return candidates;
  }

  async assignSeating(request: AssignSeatingRequest): Promise<AssignSeatingOutcome> {
    const alreadyApplied = await this.floorRepository.findAssignmentByCommandId(request.commandId);
    if (alreadyApplied) return { type: "ASSIGNED", assignment: alreadyApplied };

    return this.transactionManager.runInTransaction(async (tx) => {
      // Tier 1 — always first.
      await this.acquireReservationLock(request.reservationId, tx);

      const existingForCommand = await this.floorRepository.findAssignmentByCommandId(request.commandId, tx);
      if (existingForCommand) return { type: "ASSIGNED", assignment: existingForCommand };

      const activeExisting = await this.floorRepository.findActiveAssignmentByReservationId(request.reservationId, tx);
      if (activeExisting) return { type: "ALREADY_ASSIGNED_ELSEWHERE" };

      // Tier 3 — sorted, deterministic order.
      const sortedResourceIds = sortSeatingResourceIds(this.resourceIdsOf(request.resources));
      for (const resourceId of sortedResourceIds) {
        await this.floorRepository.acquireSeatingResourceLock({ resourceId, tx });
      }

      const candidates = await this.buildCandidates(request.resources, request.startTime, request.endTime, tx);
      const seatability = evaluateSeatability({ requestedAreaId: request.requestedAreaId, requestedPartySize: request.requestedPartySize, candidates });
      if (seatability.type !== "SEATABLE") {
        return { type: "NOT_SEATABLE", seatability };
      }

      const assignment = await this.floorRepository.createAssignment({
        assignment: {
          id: this.idGenerator.generate(),
          reservationId: request.reservationId,
          status: request.seatImmediately ? "Seated" : "Assigned",
          startTime: request.startTime,
          endTime: request.endTime,
          assignedBy: request.actor.id,
          commandId: request.commandId,
        },
        resources: request.resources.map((r) => ({ tableId: r.tableId ?? null, seatId: r.seatId ?? null })),
        tx,
      });
      return { type: "ASSIGNED", assignment };
    });
  }

  /**
   * R1.5's own extension of the R1.1 P0 fix (Concurrent Modify vs Modify):
   * the reservation-scoped lock is acquired FIRST, before any seating-
   * resource lock, so the "current active assignment" re-read below can
   * never race a concurrent move/release on the SAME reservation — same
   * argument as AvailabilityOrchestrator.modifyWithCapacity, one tier
   * further out.
   */
  async moveSeating(request: MoveSeatingRequest): Promise<MoveSeatingOutcome> {
    const alreadyApplied = await this.floorRepository.findAssignmentByCommandId(request.commandId);
    if (alreadyApplied) return { type: "MOVED", assignment: alreadyApplied };

    return this.transactionManager.runInTransaction(async (tx) => {
      await this.acquireReservationLock(request.reservationId, tx);

      const existingForCommand = await this.floorRepository.findAssignmentByCommandId(request.commandId, tx);
      if (existingForCommand) return { type: "MOVED", assignment: existingForCommand };

      const current = await this.floorRepository.findActiveAssignmentByReservationId(request.reservationId, tx);
      if (!current) return { type: "NO_ACTIVE_ASSIGNMENT" };

      const sortedResourceIds = sortSeatingResourceIds(this.resourceIdsOf(request.resources));
      for (const resourceId of sortedResourceIds) {
        await this.floorRepository.acquireSeatingResourceLock({ resourceId, tx });
      }

      const candidates = await this.buildCandidates(request.resources, current.startTime, current.endTime, tx);
      const seatability = evaluateSeatability({ requestedAreaId: request.requestedAreaId, requestedPartySize: request.requestedPartySize, candidates });
      if (seatability.type !== "SEATABLE") {
        return { type: "NOT_SEATABLE", seatability };
      }

      // Release the old claim BEFORE creating the new one, in the same
      // transaction — the EXCLUDE constraints only exempt Released rows,
      // so releasing first is what makes the new claim's own resources
      // (if they overlap the old ones, e.g. moving within the same table)
      // insertable at all.
      await this.floorRepository.updateAssignmentStatus({ assignmentId: current.id, status: "Released", releaseReason: "StaffReassigned", actorId: request.actor.id, tx });

      const assignment = await this.floorRepository.createAssignment({
        assignment: {
          id: this.idGenerator.generate(),
          reservationId: request.reservationId,
          status: current.status === "Seated" ? "Seated" : "Assigned",
          startTime: current.startTime,
          endTime: current.endTime,
          assignedBy: request.actor.id,
          commandId: request.commandId,
        },
        resources: request.resources.map((r) => ({ tableId: r.tableId ?? null, seatId: r.seatId ?? null })),
        tx,
      });
      return { type: "MOVED", assignment };
    });
  }

  async markSeated(input: { readonly reservationId: string; readonly actor: Actor }): Promise<MarkSeatedOutcome> {
    return this.transactionManager.runInTransaction(async (tx) => {
      await this.acquireReservationLock(input.reservationId, tx);
      const current = await this.floorRepository.findActiveAssignmentByReservationId(input.reservationId, tx);
      if (!current) return { type: "NO_ACTIVE_ASSIGNMENT" };
      await this.floorRepository.updateAssignmentStatus({ assignmentId: current.id, status: "Seated", tx });
      return { type: "SEATED" };
    });
  }

  /**
   * Final architecture §15: staff-confirmed only (the +20-minute "at
   * risk" flag is a derived, read-model-only concept — never checked
   * here). Releases ONLY the SeatingAssignment; Reservation.status and
   * CapacityCommitment are deliberately left untouched — see that
   * section's full case analysis in the final architecture / R1.5
   * implementation report.
   */
  async releaseNoShow(input: { readonly reservationId: string; readonly actor: Actor }): Promise<ReleaseNoShowOutcome> {
    return this.transactionManager.runInTransaction(async (tx) => {
      await this.acquireReservationLock(input.reservationId, tx);
      const current = await this.floorRepository.findActiveAssignmentByReservationId(input.reservationId, tx);
      if (!current) return { type: "NO_ACTIVE_ASSIGNMENT" };
      await this.floorRepository.updateAssignmentStatus({ assignmentId: current.id, status: "Released", releaseReason: "NoShow", actorId: input.actor.id, tx });
      return { type: "RELEASED" };
    });
  }

  /**
   * tx-scoped helper — no own transaction, no lock acquisition. Called by
   * AvailabilityOrchestrator.cancelWithCapacity, which has ALREADY
   * acquired the reservation-scoped lock (Tier 1) as its own first step
   * before this is ever invoked — see final architecture §20 ("cancel
   * ... one transaction") and assignment §27 ("reservation cancellation
   * must leave zero active SeatingAssignments").
   */
  async releaseActiveAssignmentForReservation(reservationId: string, actorId: string, tx: TransactionContext): Promise<void> {
    const current = await this.floorRepository.findActiveAssignmentByReservationId(reservationId, tx);
    if (!current) return;
    await this.floorRepository.updateAssignmentStatus({ assignmentId: current.id, status: "Released", releaseReason: "GuestCancelled", actorId, tx });
  }

  private async acquireReservationLock(reservationId: string, tx: TransactionContext): Promise<void> {
    // Reuses the SAME lock family as AvailabilityOrchestrator
    // (RESERVATION_LOCK_NAMESPACE) — deliberately, not a seating-specific
    // reservation lock: this is what makes a seating operation and a
    // concurrent capacity-relevant Modify/Cancel on the SAME reservation
    // serialize against each other too, not just against other seating
    // operations. Issued directly here (not through FloorRepository/
    // CapacityRepository) since it's a raw advisory-lock primitive, not a
    // floor- or capacity-specific concern.
    const client = asPrismaTx(tx);
    const { namespace, key } = deriveReservationLockKey(reservationId);
    await client.$executeRaw`SELECT pg_advisory_xact_lock(${namespace}::int4, ${key}::int4)`;
  }
}
