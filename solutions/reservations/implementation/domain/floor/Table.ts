/**
 * CAP-D03.03 — Table and Seat Management (R1.5).
 *
 * One physical, claimable floor resource. Deliberately ONE entity type for
 * both Sushi tables/bar positions AND Teppanyaki grills —
 * R1_5_FLOOR_SEATING_FINAL_ARCHITECTURE.md §4: "one entity type, two usage
 * patterns, driven entirely by the supportsSharedSeating flag." `areaId`
 * reuses CapacityPoolId's exact string values ("Sushi" | "Teppanyaki",
 * domain/availability/CapacityPool.ts) — deliberately NOT a new Area
 * table (product-principles.md PRP-014/PRP-020).
 *
 * Plain data shape, not a rich aggregate — mirrors CapacityCommitment.ts's
 * own "persistence-layer constraints plus orchestrator discipline carry
 * the real invariants" posture.
 */
export type TableStatus = "Active" | "Inactive";

export interface Table {
  readonly id: string;
  readonly areaId: string;
  readonly operationalLabel: string;
  readonly nominalCapacity: number;
  readonly supportsSharedSeating: boolean;
  readonly status: TableStatus;
  readonly createdAt: Date;
}
