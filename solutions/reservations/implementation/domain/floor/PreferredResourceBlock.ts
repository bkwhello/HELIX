/**
 * R1.5 §11 (Chief Engineer implementation instruction) — originally the
 * owner's preferred large-party Teppanyaki E+F block.
 *
 * WITHDRAWN — "OWNER DECISION — TEPPANYAKI SELF-SERVICE PACING POLICY"
 * §1/§9: "The previously specified E+F 24-person preferred block is
 * withdrawn. E + F together have 20 physical seats." The 24-person entry
 * has been removed from PREFERRED_RESOURCE_BLOCKS below. This is a code
 * change, not a rewrite of history — R1_5_FLOOR_SEATING_IMPLEMENTATION_REPORT.md
 * and R1_5_FLOOR_SEATING_FINAL_ARCHITECTURE.md are NOT edited to pretend
 * the 24-person figure was never proposed; both are preserved unmodified,
 * with a new, separately dated "Teppanyaki Self-Service Pacing Correction"
 * addendum appended to the end of R1_5_FLOOR_SEATING_IMPLEMENTATION_REPORT.md
 * recording the withdrawal.
 *
 * E and F remain ordinary Table rows, nominalCapacity 10 each
 * (infrastructure/floor/floorSeedData.ts, unchanged) — 20 physical seats
 * together, claimable via the same multi-grill SeatingAssignmentResource
 * mechanism as any other multi-grill party (Scenario G/H), with no
 * special-casing and no preferred-pairing metadata.
 *
 * This module (and PREFERRED_RESOURCE_BLOCKS as an empty array) is kept,
 * not deleted, as the mechanism a FUTURE, correctly-specified preferred
 * block could use without reintroducing the rejected generic-resource
 * abstraction — see the original design reasoning below, still accurate
 * for any future entry.
 *
 * PURELY DESCRIPTIVE / SUGGESTIVE, by design, even when non-empty. This
 * constant was never read by, and must never be read by, any capacity or
 * seatability validation code path — a party of any size claiming seats
 * across any grills is validated by ordinary seat-availability counting
 * (SeatabilityEvaluator) alone. Nothing here may ever increase, cap, or
 * otherwise alter CAP-D02.03's 40-person Teppanyaki capacity ceiling.
 *
 * operationalLabels reference Table.operationalLabel values ("C", "D",
 * "E", "F") — not table ids, since this module has no database access and
 * ids are assigned at seed time; a floor read model resolving a future
 * entry against real Table rows is expected to look up by
 * operationalLabel.
 */
export interface PreferredResourceBlockConfig {
  readonly label: string;
  readonly operationalLabels: readonly string[];
  readonly preferredMaxPartySize: number;
}

export const PREFERRED_RESOURCE_BLOCKS: readonly PreferredResourceBlockConfig[] = [];
