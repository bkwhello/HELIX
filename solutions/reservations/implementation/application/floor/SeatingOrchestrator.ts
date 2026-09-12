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
import { ServiceSessionRepository } from "../../domain/repositories/ServiceSessionRepository.js";
import { ServiceSessionSnapshotStatus, lockAndReadServiceSession, requiresOpenedSession, rejectsPreAssignment } from "../availability/ServiceSessionGate.js";

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
  | { readonly type: "ALREADY_ASSIGNED_ELSEWHERE" }
  /** R1.6-P2C-1 — immediate assignment requires an Opened session; pre-assignment rejects only Closed/Cancelled. Only ever returned when a ServiceSessionRepository is wired in. */
  | { readonly type: "SESSION_NOT_OPEN"; readonly sessionStatus: ServiceSessionSnapshotStatus };

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

export type MarkSeatedOutcome =
  | { readonly type: "SEATED" }
  | { readonly type: "NO_ACTIVE_ASSIGNMENT" }
  /** R1.6-P2C-1 — requires an Opened session. Only ever returned when a ServiceSessionRepository is wired in. */
  | { readonly type: "SESSION_NOT_OPEN"; readonly sessionStatus: ServiceSessionSnapshotStatus };
export type ReleaseNoShowOutcome = { readonly type: "RELEASED" } | { readonly type: "NO_ACTIVE_ASSIGNMENT" };

/**
 * R1.5-P1B — the four dispositions a capacity-relevant reservation Modify
 * can leave an active SeatingAssignment in. "UNCHANGED" and "RELEASED"
 * both leave the ORIGINAL assignment row's identity untouched (no write
 * at all, or a release with no replacement); only "RETAINED" produces a
 * new row (release-and-recreate on the SAME resources — see
 * revalidateOrReleaseForModify's own doc comment for why this is never a
 * literal in-place interval update).
 */
export type ModifySeatingRevalidationResult =
  | { readonly type: "NO_ACTIVE_ASSIGNMENT" }
  | { readonly type: "UNCHANGED" }
  | { readonly type: "RETAINED"; readonly assignment: SeatingAssignment }
  | { readonly type: "RELEASED"; readonly seatability: SeatabilityOutcome };

export class SeatingOrchestrator {
  constructor(
    private readonly floorRepository: FloorRepository,
    private readonly transactionManager: TransactionManager,
    private readonly idGenerator: IdGenerator,
    private readonly clock: Clock,
    /**
     * R1.6-P2C-1 — optional, same "not available in this deployment"
     * posture as every other optional-last dependency in this codebase
     * (e.g. AvailabilityOrchestrator's own `seatingOrchestrator?`): every
     * existing test/caller that constructs a SeatingOrchestrator without
     * this stays completely unaffected — no session gate is enforced,
     * exactly today's behavior. A real deployment (api/server.ts)
     * supplies a real ServiceSessionRepository so the gate is genuinely
     * live in production.
     */
    private readonly serviceSessionRepository?: ServiceSessionRepository
  ) {}

  /**
   * R1.5-P1B0 — canonical Tier-3 lock-key derivation: ALWAYS the parent
   * Table id, never a raw Seat id. `ResourceBlockService.blockTable`/
   * `unblock` have always locked the parent Table id (a block has no
   * seat granularity to begin with); before this fix, a Teppanyaki
   * seat-level claim locked the raw seat id instead, so the two never
   * shared a lock and could never serialize against each other. No
   * database constraint spans `seating_assignment_resources` and
   * `resource_blocks` (verified against every migration during the
   * P1B0 design gate) — this advisory lock is the ONLY thing that makes
   * the "no overlapping block" check in buildCandidates/blockTable
   * trustworthy under concurrency. Resolved and locked BEFORE any
   * candidate-building/overlap read, in the SAME transaction as that
   * read, so the resolution itself is transactionally consistent with
   * everything that follows it — never a separate, racy pre-check.
   *
   * Two Seat selectors on the SAME grill correctly dedupe to one lock
   * (sortSeatingResourceIds); a multi-grill claim (final architecture
   * Scenario H) correctly sorts across grills in the same fixed global
   * order every other Tier-3 caller already uses — no new deadlock class,
   * only the identifiers being sorted change (Table ids, always, instead
   * of a mix of Table/Seat ids).
   */
  private async resolveLockTableIds(resources: readonly ResourceSelector[], tx: TransactionContext): Promise<readonly string[]> {
    const tableIds: string[] = [];
    for (const r of resources) {
      if (r.tableId) {
        tableIds.push(r.tableId);
      } else if (r.seatId) {
        const seat = await this.floorRepository.findSeatById(r.seatId, tx);
        if (seat) tableIds.push(seat.tableId);
      }
    }
    return sortSeatingResourceIds(tableIds);
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

      // R1.6-P2C-1 — Tier 1.5, before any Tier 3 seating-resource lock.
      // Immediate assignment (seatImmediately: true — walk-in or ordinary
      // immediate assign) requires an Opened session; pre-assignment
      // (seatImmediately falsy) rejects only Closed/Cancelled. Derived
      // from request.startTime — the same instant the created
      // SeatingAssignment itself is stamped with — never a stored
      // servicePeriodId.
      if (this.serviceSessionRepository) {
        const sessionSnapshot = await lockAndReadServiceSession({
          serviceSessionRepository: this.serviceSessionRepository,
          reservationDateTime: request.startTime,
          tx,
        });
        const rejected = request.seatImmediately ? requiresOpenedSession(sessionSnapshot) : rejectsPreAssignment(sessionSnapshot);
        if (rejected) return { type: "SESSION_NOT_OPEN", sessionStatus: sessionSnapshot.status };
      }

      // Tier 3 — canonical parent-Table lock-key derivation (R1.5-P1B0),
      // sorted, deterministic order.
      const lockTableIds = await this.resolveLockTableIds(request.resources, tx);
      for (const resourceId of lockTableIds) {
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

      // R1.6-P2C-1 — Chief Engineer decision #9: Move is NOT status-gated
      // (no rejection based on session status), but MUST participate in
      // the session lock so it serializes with a concurrent Close — the
      // returned snapshot is deliberately ignored. Derived from the
      // EXISTING assignment's own startTime (the interval Move preserves
      // unchanged — see the createAssignment call below).
      if (this.serviceSessionRepository) {
        await lockAndReadServiceSession({ serviceSessionRepository: this.serviceSessionRepository, reservationDateTime: current.startTime, tx });
      }

      // Tier 3 — canonical parent-Table lock-key derivation (R1.5-P1B0).
      const lockTableIds = await this.resolveLockTableIds(request.resources, tx);
      for (const resourceId of lockTableIds) {
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

      // P1-B9 idempotency fix: a repeated call after the party is already
      // Seated must be a true no-op, not a second write — updateAssignmentStatus
      // unconditionally re-stamps seatedAt to "now" whenever status is
      // "Seated" (see PrismaFloorRepository.updateAssignmentStatus), which
      // would otherwise silently overwrite the original seating time on a
      // double-click or client retry. Only the Assigned -> Seated
      // transition itself performs the write; already-Seated short-circuits
      // before it, still under the same reservation lock. Checked BEFORE
      // the R1.6-P2C-1 session gate below, deliberately — a true no-op
      // repeat (nothing left to mutate) must never newly fail just
      // because the session has since closed.
      if (current.status === "Seated") return { type: "SEATED" };

      // R1.6-P2C-1 — Tier 1.5: mark-seated requires an Opened session,
      // derived from the existing assignment's own startTime.
      if (this.serviceSessionRepository) {
        const sessionSnapshot = await lockAndReadServiceSession({
          serviceSessionRepository: this.serviceSessionRepository,
          reservationDateTime: current.startTime,
          tx,
        });
        if (requiresOpenedSession(sessionSnapshot)) return { type: "SESSION_NOT_OPEN", sessionStatus: sessionSnapshot.status };
      }

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
   * AvailabilityOrchestrator.cancelWithCapacity and .completeWithCapacity
   * (R1.5-P1A), both of which have ALREADY acquired the reservation-scoped
   * lock (Tier 1) as their own first step before this is ever invoked —
   * see final architecture §20 ("cancel ... one transaction") and
   * assignment §27 ("reservation cancellation must leave zero active
   * SeatingAssignments"). `reason` is caller-supplied (R1.5-P1A
   * generalization) rather than hardcoded, so each caller states its own
   * intent explicitly — cancellation passes "GuestCancelled", completion
   * passes "Completed"; this method itself picks no default.
   */
  async releaseActiveAssignmentForReservation(reservationId: string, actorId: string, reason: ReleaseReason, tx: TransactionContext): Promise<void> {
    const current = await this.floorRepository.findActiveAssignmentByReservationId(reservationId, tx);
    if (!current) return;
    await this.floorRepository.updateAssignmentStatus({ assignmentId: current.id, status: "Released", releaseReason: reason, actorId, tx });
  }

  /**
   * R1.5-P1B — tx-scoped helper, no own transaction, no Tier-1 lock of its
   * own: called by AvailabilityOrchestrator.modifyWithCapacity, which has
   * ALREADY acquired the reservation lock (Tier 1) and the capacity
   * pool/date lock(s) (Tier 2) as its own first steps before this is ever
   * invoked — this method's only job is Tier 3 (seating-resource locks)
   * and the seating write(s) themselves, in that order.
   *
   * Policy 3 (Chief Engineer decision): retain the currently-held
   * resources when they remain valid under the COMPLETE new reservation
   * facts (interval, area, party size, active claims, ResourceBlocks);
   * otherwise release with no replacement. Never a literal in-place
   * interval update — buildCandidates/FloorRepository.findOverlappingResourceClaims
   * has no "exclude this assignment's own resource rows" parameter, so a
   * not-yet-released row would spuriously appear to overlap ITSELF
   * whenever the new interval intersects the old one. Release-then-
   * recheck-then-conditionally-recreate sidesteps that entirely, reusing
   * the exact same primitives moveSeating already relies on, with the
   * step order corrected for this method's different self-overlap risk
   * (moveSeating's check-then-release order is safe only because it is,
   * in practice, always invoked against a DIFFERENT resource than
   * currently held).
   *
   * Tier-3 lock target: the canonical parent-Table id (R1.5-P1B0's
   * resolveLockTableIds — see that method's own doc comment), the SAME
   * convention assignSeating/moveSeating now use, so this method's races
   * against a concurrent assignSeating/moveSeating/blockTable/unblock on
   * the SAME grill all correctly serialize.
   */
  async revalidateOrReleaseForModify(input: {
    readonly reservationId: string;
    readonly actor: Actor;
    readonly commandId: string;
    readonly oldAreaId: string;
    readonly newAreaId: string;
    readonly newPartySize: number;
    readonly newStart: Date;
    readonly newEnd: Date;
    readonly tx: TransactionContext;
  }): Promise<ModifySeatingRevalidationResult> {
    const { reservationId, actor, commandId, oldAreaId, newAreaId, newPartySize, newStart, newEnd, tx } = input;

    const current = await this.floorRepository.findActiveAssignmentByReservationId(reservationId, tx);
    if (!current) return { type: "NO_ACTIVE_ASSIGNMENT" };

    const currentResourceRows = await this.floorRepository.findAssignmentResources(current.id, tx);
    const selectors: ResourceSelector[] = currentResourceRows.map((r) => ({ tableId: r.tableId ?? undefined, seatId: r.seatId ?? undefined }));

    const intervalUnchanged = newStart.getTime() === current.startTime.getTime() && newEnd.getTime() === current.endTime.getTime();
    const areaUnchanged = newAreaId === oldAreaId;

    if (intervalUnchanged && areaUnchanged) {
      // Capacity-only check — deliberately NOT via buildCandidates/
      // findOverlappingResourceClaims: the interval is unchanged, so this
      // row's own overlap/block status is unaffected by this Modify, and
      // re-running the overlap check would spuriously find the row
      // overlapping ITSELF at the identical interval. A plain capacity
      // lookup is the only thing that could possibly have changed.
      let heldCapacity = 0;
      for (const r of currentResourceRows) {
        if (r.tableId) {
          const table = await this.floorRepository.findTableById(r.tableId, tx);
          heldCapacity += table?.nominalCapacity ?? 0;
        } else if (r.seatId) {
          heldCapacity += 1;
        }
      }
      if (heldCapacity >= newPartySize) {
        return { type: "UNCHANGED" };
      }
      // Falls through: capacity no longer sufficient even though nothing
      // else changed — release-and-recheck below is the only way to know
      // whether ANY resource can still satisfy the grown party.
    }

    // Tier 3 — canonical parent-Table lock-key derivation (R1.5-P1B0),
    // same convention assignSeating/moveSeating use.
    const lockTableIds = await this.resolveLockTableIds(selectors, tx);
    for (const resourceId of lockTableIds) {
      await this.floorRepository.acquireSeatingResourceLock({ resourceId, tx });
    }

    // Release BEFORE checking the new facts — see this method's own doc
    // comment for why (self-overlap false positive otherwise).
    await this.floorRepository.updateAssignmentStatus({ assignmentId: current.id, status: "Released", releaseReason: "StaffReassigned", actorId: actor.id, tx });

    const candidates = await this.buildCandidates(selectors, newStart, newEnd, tx);
    const seatability = evaluateSeatability({ requestedAreaId: newAreaId, requestedPartySize: newPartySize, candidates });
    if (seatability.type !== "SEATABLE") {
      return { type: "RELEASED", seatability };
    }

    const assignment = await this.floorRepository.createAssignment({
      assignment: {
        id: this.idGenerator.generate(),
        reservationId,
        status: current.status,
        startTime: newStart,
        endTime: newEnd,
        assignedBy: actor.id,
        commandId,
        // R1.5-P1B preservation requirement: the ORIGINAL seatedAt,
        // verbatim — never re-stamped to this Modify's own timestamp,
        // never lost. `current.seatedAt` is already `null` for an
        // `Assigned` row, so this is correct for both statuses uniformly.
        seatedAt: current.seatedAt,
      },
      resources: currentResourceRows.map((r) => ({ tableId: r.tableId, seatId: r.seatId })),
      tx,
    });
    return { type: "RETAINED", assignment };
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
