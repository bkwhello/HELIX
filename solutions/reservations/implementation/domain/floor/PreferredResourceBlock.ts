/**
 * R1.5 §11 (Chief Engineer implementation instruction) — the owner's
 * preferred large-party Teppanyaki E+F block. Deliberately a small static
 * configuration, not a database-backed entity — mirrors
 * domain/availability/CapacityPool.ts's own "promote only when a concrete
 * need exists" precedent (product-principles.md PRP-014/PRP-020).
 *
 * PURELY DESCRIPTIVE / SUGGESTIVE. This constant is never read by any
 * capacity or seatability validation code path — a party of any size
 * claiming seats across E and F (or any other grills) is validated by
 * ordinary seat-availability counting (SeatabilityEvaluator), exactly the
 * same as any other multi-grill claim. Nothing here increases, caps, or
 * otherwise alters CAP-D02.03's 40-person Teppanyaki capacity ceiling —
 * see R1_5_FLOOR_SEATING_FINAL_ARCHITECTURE.md §8 for the full reasoning,
 * including the flagged, unresolved 24-vs-20-physical-seats arithmetic
 * question this constant deliberately does NOT attempt to paper over.
 *
 * operationalLabels reference Table.operationalLabel values ("C", "D",
 * "E", "F") — not table ids, since this module has no database access and
 * ids are assigned at seed time; a floor read model resolving this
 * constant against real Table rows is expected to look up by
 * operationalLabel.
 */
export interface PreferredResourceBlockConfig {
  readonly label: string;
  readonly operationalLabels: readonly string[];
  readonly preferredMaxPartySize: number;
}

export const PREFERRED_RESOURCE_BLOCKS: readonly PreferredResourceBlockConfig[] = [
  {
    label: "Teppanyaki E+F",
    operationalLabels: ["E", "F"],
    preferredMaxPartySize: 24,
  },
];
