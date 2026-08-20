/**
 * CAP-D02.03 — Availability Management
 *
 * Frozen business rules (owner-confirmed, HELIX ENGINEERING ASSIGNMENT
 * "R1.1-I1", §2). Deliberately a small static configuration, not a
 * database-backed entity — there are exactly two pools today and their
 * capacity/duration are fixed by the owner, not staff-configurable yet.
 * Promote to a real, persisted CapacityPool only when a concrete need to
 * change these values without a code change actually exists (see
 * `product-principles.md` PRP-014, PRP-020).
 *
 * Sushi maximumCapacity is 51 — the FINAL, reconciled figure ("Chief
 * Engineer Correction — R1.5 Final Sushi Capacity Reconciliation").
 * Three values were live in this file at different points and are ALL
 * superseded: 60 (the original R1.1 owner-confirmed commercial ceiling,
 * predating any physical-inventory data), 47 (an R1.5
 * architecture-investigation calculation from an incomplete inventory —
 * missing the four one-person bar positions), and 49 (a subsequent
 * reconciliation that itself turned out to be an incorrect arithmetic
 * read of the owner's own itemized table list). The authoritative
 * physical-seat proof — 15 numbered tables (Table 14 deliberately
 * absent) summing to 47, plus Bar 17-20 summing to 4, = 51 — is
 * cross-checked automatically against the seeded floor inventory by
 * `tests/integration/sushi-capacity-reconciliation.test.ts` (T5),
 * specifically to prevent this exact 47/49/51 drift from silently
 * recurring — see infrastructure/floor/floorSeedData.ts and
 * R1_5_FLOOR_SEATING_IMPLEMENTATION_REPORT.md's dated correction
 * addenda for the full, unedited history of each prior value.
 */
export type CapacityPoolId = "Sushi" | "Teppanyaki";

export interface CapacityPoolConfig {
  readonly capacityPoolId: CapacityPoolId;
  readonly maximumCapacity: number;
  readonly durationMinutes: number;
}

export const CAPACITY_POOLS: Readonly<Record<CapacityPoolId, CapacityPoolConfig>> = {
  Sushi: { capacityPoolId: "Sushi", maximumCapacity: 51, durationMinutes: 90 },
  Teppanyaki: { capacityPoolId: "Teppanyaki", maximumCapacity: 40, durationMinutes: 150 },
};

export function isCapacityPoolId(value: string): value is CapacityPoolId {
  return value === "Sushi" || value === "Teppanyaki";
}

export const BOOKING_GRID_MINUTES = 15;

/** CAP-D02.03 §2 — public/self-service party-size bounds. Staff channel has no upper bound in MVA (UNKNOWN — OWNER INPUT REQUIRED). */
export const SELF_SERVICE_MIN_PARTY_SIZE = 1;
export const SELF_SERVICE_MAX_PARTY_SIZE = 8;

/** CAP-D02.03 §2 — same-day self-service cutoff, Europe/Amsterdam local time. */
export const SAME_DAY_SELF_SERVICE_CUTOFF_HOUR = 17;

export const RESTAURANT_TIMEZONE = "Europe/Amsterdam";
