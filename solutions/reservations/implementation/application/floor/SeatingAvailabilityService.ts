/**
 * P1-B4-A — CAP-D03.03/CAP-D04.01 read-only availability discovery.
 *
 * Answers exactly one question: "which physical floor resources are
 * currently suitable and available for THIS Reservation?" — reservation-
 * driven, never client-driven: area, party size, and the evaluated
 * interval are all derived from the authoritative Reservation itself
 * (ReservationRepository), never accepted as input, so a caller cannot
 * manipulate them to make resources appear available.
 *
 * Deliberately reuses the existing FloorRepository port and the SAME
 * signals SeatingOrchestrator.buildCandidates already gathers (active
 * status, ResourceBlock overlap, SeatingAssignmentResource overlap) —
 * this is NOT a second physical-seatability model. It does not (and must
 * not) reuse SeatabilityEvaluator.evaluateSeatability itself, because
 * that function answers a different question (is THIS SPECIFIC selected
 * set of resources enough for this party — an all-or-nothing check on a
 * caller-chosen combination); this service instead enumerates every
 * INDIVIDUALLY available resource, one row per Table or Seat, so staff
 * can choose. The actual write path (a future increment) still goes
 * through SeatingOrchestrator.assignSeating() unchanged, which
 * revalidates everything itself under its own resource locks and the
 * database's EXCLUDE constraints — this service's result is advisory
 * only, a point-in-time snapshot, never a reservation or lock of any
 * kind (no transaction is opened here).
 *
 * Duration is derived from CAPACITY_POOLS (domain/availability/CapacityPool.ts)
 * — the SAME duration authority AvailabilityOrchestrator/createImmediateWalkIn
 * already use — never a second, independently-maintained duration figure.
 */
import { FloorRepository } from "../../domain/repositories/FloorRepository.js";
import { ReservationRepository } from "../../domain/repositories/ReservationRepository.js";
import { ReservationId } from "../../domain/value-objects/ReservationId.js";
import { CAPACITY_POOLS, CapacityPoolId, isCapacityPoolId } from "../../domain/availability/CapacityPool.js";

export interface AvailableResourceRow {
  readonly resourceId: string;
  readonly kind: "Table" | "Seat";
  readonly operationalLabel: string;
  /** A Table's own nominalCapacity, or 1 for an individual Seat — same convention as SeatabilityCandidate.capacity. */
  readonly capacity: number;
  /** Present only for a Seat — the Teppanyaki grill it belongs to, so staff can read "C-01" in context. */
  readonly parentTable?: { readonly id: string; readonly operationalLabel: string };
}

export type SeatingAvailabilityResult =
  | {
      readonly type: "FOUND";
      readonly reservationId: string;
      readonly area: CapacityPoolId;
      readonly partySize: number;
      readonly intervalStart: Date;
      readonly intervalEnd: Date;
      /** The Reservation's existing SeatingAssignment state, if the read architecture already tracks one — never mutated here. */
      readonly assignmentStatus: "Unassigned" | "Assigned" | "Seated";
      readonly availableResources: readonly AvailableResourceRow[];
    }
  | { readonly type: "RESERVATION_NOT_FOUND" }
  /** The Reservation has no preferredArea (CAP-D01.01-R48: a Warning-severity preference, never required) — there is no managed floor pool to query resources from at all. Not an error; a well-defined "nothing to show" case. */
  | { readonly type: "NO_MANAGED_AREA" };

export class SeatingAvailabilityService {
  constructor(
    private readonly reservationRepository: ReservationRepository,
    private readonly floorRepository: FloorRepository
  ) {}

  async getAvailableResourcesForReservation(reservationId: ReservationId): Promise<SeatingAvailabilityResult> {
    const reservation = await this.reservationRepository.findById(reservationId);
    if (!reservation) return { type: "RESERVATION_NOT_FOUND" };

    const preferredArea = reservation.getPreferredArea();
    if (!preferredArea || !isCapacityPoolId(preferredArea)) {
      return { type: "NO_MANAGED_AREA" };
    }
    const area: CapacityPoolId = preferredArea;

    const idString = reservation.getId().toString();
    const intervalStart = reservation.getReservationDateTime();
    const durationMinutes = CAPACITY_POOLS[area].durationMinutes;
    const intervalEnd = new Date(intervalStart.getTime() + durationMinutes * 60_000);

    const [tables, activeAssignment] = await Promise.all([
      this.floorRepository.findTablesByArea(area),
      this.floorRepository.findActiveAssignmentByReservationId(idString),
    ]);

    // Claimable candidates: an individual Seat under a supportsSharedSeating
    // Table (Teppanyaki grills today), or the Table itself otherwise
    // (ordinary Sushi tables/bar positions) — driven entirely by each
    // Table row's own flag, the same resource-driven distinction
    // SeatingOrchestrator.buildCandidates already uses, never a hardcoded
    // "Sushi means Table, Teppanyaki means Seat" area rule.
    interface Candidate {
      readonly resourceId: string;
      readonly kind: "Table" | "Seat";
      readonly operationalLabel: string;
      readonly capacity: number;
      readonly blockCheckTableId: string;
      readonly parentTable?: { readonly id: string; readonly operationalLabel: string };
    }
    const candidates: Candidate[] = [];
    for (const table of tables) {
      if (table.status !== "Active") continue;
      if (table.supportsSharedSeating) {
        const seats = await this.floorRepository.findSeatsByTableId(table.id);
        for (const seat of seats) {
          if (seat.status !== "Active") continue;
          candidates.push({
            resourceId: seat.id,
            kind: "Seat",
            operationalLabel: seat.operationalLabel,
            capacity: 1,
            blockCheckTableId: table.id,
            parentTable: { id: table.id, operationalLabel: table.operationalLabel },
          });
        }
      } else {
        candidates.push({
          resourceId: table.id,
          kind: "Table",
          operationalLabel: table.operationalLabel,
          capacity: table.nominalCapacity,
          blockCheckTableId: table.id,
        });
      }
    }

    // ResourceBlock is always Table-scoped (never Seat-scoped, per its own
    // doc comment) — one lookup per distinct parent Table also covers
    // every Seat candidate claimed under it.
    const distinctTableIds = Array.from(new Set(candidates.map((c) => c.blockCheckTableId)));
    const blockedTableIds = new Set<string>();
    for (const tableId of distinctTableIds) {
      const blocks = await this.floorRepository.findOverlappingResourceBlocks({ tableId, rangeStart: intervalStart, rangeEnd: intervalEnd });
      if (blocks.length > 0) blockedTableIds.add(tableId);
    }

    const overlapping = await this.floorRepository.findOverlappingResourceClaims({
      tableIds: candidates.filter((c) => c.kind === "Table").map((c) => c.resourceId),
      seatIds: candidates.filter((c) => c.kind === "Seat").map((c) => c.resourceId),
      rangeStart: intervalStart,
      rangeEnd: intervalEnd,
    });

    const availableResources: AvailableResourceRow[] = candidates
      .filter((c) => !blockedTableIds.has(c.blockCheckTableId))
      .filter((c) => (c.kind === "Table" ? !overlapping.tableIds.has(c.resourceId) : !overlapping.seatIds.has(c.resourceId)))
      .map((c) => ({
        resourceId: c.resourceId,
        kind: c.kind,
        operationalLabel: c.operationalLabel,
        capacity: c.capacity,
        ...(c.parentTable ? { parentTable: c.parentTable } : {}),
      }));

    return {
      type: "FOUND",
      reservationId: idString,
      area,
      partySize: reservation.getPartySize(),
      intervalStart,
      intervalEnd,
      assignmentStatus: activeAssignment ? (activeAssignment.status as "Assigned" | "Seated") : "Unassigned",
      availableResources,
    };
  }
}
