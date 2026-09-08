/**
 * P1-B8 — CAP-D02.03 Resource Block management: the smallest application
 * service needed to create/remove a ResourceBlock through the SAME lock
 * discipline SeatingOrchestrator's own writes use (per-Table advisory
 * lock, acquired inside the shared PrismaTransactionManager transaction).
 * A block is always Table-scoped (never Seat-scoped, per
 * domain/floor/ResourceBlock.ts's own doc comment), so exactly one
 * resource lock is ever needed per call — never sortSeatingResourceIds'
 * multi-resource ordering, which exists for SeatingOrchestrator's
 * multi-selector requests only.
 *
 * Conflict checking deliberately reuses findOverlappingResourceClaims and
 * findOverlappingResourceBlocks verbatim — the SAME two FloorRepository
 * methods SeatingOrchestrator.buildCandidates/SeatingAvailabilityService
 * already call, in the opposite direction (does an existing block affect
 * a seating candidate?). This service asks the mirror question (does an
 * existing seating claim or block affect a NEW block?) without adding a
 * second overlap-detection implementation. R1.5-P1B0 — the claims check
 * includes every child Seat of the target Table (via the existing
 * findSeatsByTableId), not just the Table itself, so an active
 * Teppanyaki seat claim correctly blocks a conflicting Table-level block
 * too — see blockTable's own comment for why this was previously missed.
 *
 * Unblock is a hard delete (Chief Engineer P1-B8 directive: no schema
 * migration, no release-audit columns — ResourceBlock has none to set,
 * unlike SeatingAssignment's Released/releaseReason/releasedBy/releasedAt).
 * No idempotency-key mechanism is added for creation either: a duplicate
 * ResourceBlock causes no double-booking (unlike a duplicate
 * SeatingAssignment, which would claim a limited physical resource
 * twice) — and ResourceBlock has no commandId column to key one on
 * without a schema change, which this phase is not authorized to make.
 */
import { FloorRepository } from "../../domain/repositories/FloorRepository.js";
import { TransactionManager } from "../ports/TransactionManager.js";
import { ResourceBlock } from "../../domain/floor/ResourceBlock.js";
import { Actor } from "../../domain/value-objects/Actor.js";

export interface BlockTableRequest {
  readonly operationalLabel: string;
  readonly startTime: Date;
  readonly endTime: Date;
  readonly reason: string | null;
  readonly actor: Actor;
}

export type BlockTableOutcome =
  | { readonly type: "BLOCKED"; readonly block: ResourceBlock; readonly tableOperationalLabel: string }
  | { readonly type: "TABLE_NOT_FOUND" }
  /** An active (Assigned or Seated) SeatingAssignmentResource claim on this Table overlaps the requested interval — Chief Engineer P1-B8 directive: reject, never evict or alter the existing claim. */
  | { readonly type: "ACTIVE_ASSIGNMENT_CONFLICT" }
  /** An existing ResourceBlock on this Table overlaps the requested interval — Chief Engineer P1-B8 directive: overlapping blocks are rejected, not permitted to coexist. */
  | { readonly type: "BLOCK_OVERLAP" };

export type UnblockOutcome = { readonly type: "UNBLOCKED" } | { readonly type: "NOT_FOUND" };

export class ResourceBlockService {
  constructor(
    private readonly floorRepository: FloorRepository,
    private readonly transactionManager: TransactionManager
  ) {}

  async blockTable(request: BlockTableRequest): Promise<BlockTableOutcome> {
    return this.transactionManager.runInTransaction(async (tx) => {
      const table = await this.floorRepository.findTableByLabel(request.operationalLabel, tx);
      if (!table) return { type: "TABLE_NOT_FOUND" };

      // Tier 3 — the same per-Table advisory lock SeatingOrchestrator
      // acquires, so a concurrent assign/move on this exact table and a
      // concurrent block-creation on it always serialize against each
      // other; neither can observe the other's half-applied state.
      await this.floorRepository.acquireSeatingResourceLock({ resourceId: table.id, tx });

      // R1.5-P1B0 correction — a block is Table-scoped, but Teppanyaki
      // seats claim individually: checking only `tableIds` missed every
      // active child-Seat claim, so a block could be created directly
      // underneath a party still seated at that grill. Resolving the
      // Table's own child Seats (existing FloorRepository.findSeatsByTableId,
      // no new repository method needed) and including them in the SAME
      // findOverlappingResourceClaims call closes that gap without adding
      // a second overlap-detection path or any per-Seat blocking — a
      // Sushi Table (no child Seats) sees an empty seatIds list and is
      // unaffected.
      const childSeats = await this.floorRepository.findSeatsByTableId(table.id, tx);
      const overlappingClaims = await this.floorRepository.findOverlappingResourceClaims({
        tableIds: [table.id],
        seatIds: childSeats.map((s) => s.id),
        rangeStart: request.startTime,
        rangeEnd: request.endTime,
        tx,
      });
      const hasSeatConflict = childSeats.some((s) => overlappingClaims.seatIds.has(s.id));
      if (overlappingClaims.tableIds.has(table.id) || hasSeatConflict) {
        return { type: "ACTIVE_ASSIGNMENT_CONFLICT" };
      }

      const overlappingBlocks = await this.floorRepository.findOverlappingResourceBlocks({
        tableId: table.id,
        rangeStart: request.startTime,
        rangeEnd: request.endTime,
        tx,
      });
      if (overlappingBlocks.length > 0) {
        return { type: "BLOCK_OVERLAP" };
      }

      const block = await this.floorRepository.createResourceBlock({
        tableId: table.id,
        startTime: request.startTime,
        endTime: request.endTime,
        reason: request.reason,
        createdBy: request.actor.id,
        tx,
      });
      return { type: "BLOCKED", block, tableOperationalLabel: table.operationalLabel };
    });
  }

  async unblock(id: string): Promise<UnblockOutcome> {
    return this.transactionManager.runInTransaction(async (tx) => {
      const block = await this.floorRepository.findResourceBlockById(id, tx);
      if (!block) return { type: "NOT_FOUND" };

      // Same Tier-3 lock as blockTable — serializes an unblock against a
      // concurrent block-creation or seating write on the same Table.
      await this.floorRepository.acquireSeatingResourceLock({ resourceId: block.tableId, tx });

      await this.floorRepository.deleteResourceBlock(id, tx);
      return { type: "UNBLOCKED" };
    });
  }
}
