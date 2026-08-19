/**
 * CAP-D04.01 — Seatability Evaluator ("CanSeat?").
 *
 * R1_5_FLOOR_SEATING_FINAL_ARCHITECTURE.md §11: CanAccept (CAP-D02.03,
 * headcount-only) and CanSeat (CAP-D04.01, physical fit) are deliberately
 * two separate questions, answered by two separate, non-duplicated
 * mechanisms — this file never reads CAPACITY_POOLS, and
 * AvailabilityEvaluator.ts never reads a Table/Seat.
 *
 * Pure function. No I/O, no database — every candidate resource's current
 * state (active/blocked/overlapping) is supplied by the caller, already
 * fetched, exactly mirroring AvailabilityEvaluator.evaluateSimultaneousOccupancy's
 * own "keep the correctness-critical algorithm independently
 * unit-testable" split (CAP-D02.03 §10 precedent).
 */

export type SeatabilityOutcome =
  | { readonly type: "SEATABLE" }
  | { readonly type: "RESOURCE_NOT_FOUND"; readonly resourceLabel: string }
  | { readonly type: "RESOURCE_INACTIVE"; readonly resourceLabel: string }
  | { readonly type: "RESOURCE_AREA_MISMATCH"; readonly resourceLabel: string }
  | { readonly type: "RESOURCE_BLOCKED"; readonly resourceLabel: string }
  | { readonly type: "RESOURCE_OVERLAP"; readonly resourceLabel: string }
  | { readonly type: "RESOURCE_TYPE_MISMATCH"; readonly resourceLabel: string; readonly reason: string }
  | { readonly type: "INSUFFICIENT_CAPACITY"; readonly requested: number; readonly selectedCapacity: number }
  | { readonly type: "INVALID_REQUEST"; readonly reason: string };

/** The minimal, already-fetched shape the evaluator needs for one candidate resource — either a Table-level claim or a Seat-level claim. */
export interface SeatabilityCandidate {
  /** Either a Table id (supportsSharedSeating = false — an ordinary Sushi table, bar position, etc.) or a Seat id (an individual Teppanyaki seat). */
  readonly resourceId: string;
  readonly resourceLabel: string;
  readonly resourceKind: "Table" | "Seat";
  readonly found: boolean;
  readonly active: boolean;
  /** Only meaningful for resourceKind "Table" — the area of the Table itself, or of the Seat's parent Table for a "Seat" candidate. */
  readonly areaId: string;
  /** Capacity contributed by this one resource: a Table's own nominalCapacity, or 1 for a single Seat. */
  readonly capacity: number;
  /** Whether the party's requested resourceKind matches what this Table actually supports — a Table-level claim against a supportsSharedSeating Table, or a Seat-level claim against a non-shared Table, are both compatibility failures. */
  readonly supportsRequestedClaimKind: boolean;
  readonly blockedForInterval: boolean;
  readonly overlappingActiveAssignment: boolean;
}

export function evaluateSeatability(input: {
  readonly requestedAreaId: string;
  readonly requestedPartySize: number;
  readonly candidates: readonly SeatabilityCandidate[];
}): SeatabilityOutcome {
  const { requestedAreaId, requestedPartySize, candidates } = input;

  if (requestedPartySize <= 0) {
    return { type: "INVALID_REQUEST", reason: `requestedPartySize (${requestedPartySize}) must be positive.` };
  }
  if (candidates.length === 0) {
    return { type: "INVALID_REQUEST", reason: "At least one candidate resource must be selected." };
  }

  for (const candidate of candidates) {
    if (!candidate.found) {
      return { type: "RESOURCE_NOT_FOUND", resourceLabel: candidate.resourceLabel };
    }
    if (!candidate.active) {
      return { type: "RESOURCE_INACTIVE", resourceLabel: candidate.resourceLabel };
    }
    if (candidate.areaId !== requestedAreaId) {
      return { type: "RESOURCE_AREA_MISMATCH", resourceLabel: candidate.resourceLabel };
    }
    if (!candidate.supportsRequestedClaimKind) {
      return {
        type: "RESOURCE_TYPE_MISMATCH",
        resourceLabel: candidate.resourceLabel,
        reason:
          candidate.resourceKind === "Table"
            ? "A whole-table claim was requested against a shared-seating table — claim individual seats instead."
            : "A seat-level claim was requested against a table that does not support shared seating — claim the whole table instead.",
      };
    }
    if (candidate.blockedForInterval) {
      return { type: "RESOURCE_BLOCKED", resourceLabel: candidate.resourceLabel };
    }
    if (candidate.overlappingActiveAssignment) {
      return { type: "RESOURCE_OVERLAP", resourceLabel: candidate.resourceLabel };
    }
  }

  const selectedCapacity = candidates.reduce((sum, c) => sum + c.capacity, 0);
  if (selectedCapacity < requestedPartySize) {
    return { type: "INSUFFICIENT_CAPACITY", requested: requestedPartySize, selectedCapacity };
  }

  return { type: "SEATABLE" };
}

export function isSeatable(outcome: SeatabilityOutcome): outcome is { readonly type: "SEATABLE" } {
  return outcome.type === "SEATABLE";
}
