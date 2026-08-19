/**
 * CAP-D02.03 — Availability Management
 *
 * Frozen business rules (owner-confirmed, HELIX ENGINEERING ASSIGNMENT
 * "R1.1-I1", §2; Sushi capacity corrected under R1.5's "FINAL
 * OWNER-CORRECTED FLOOR CONFIGURATION" instruction, §3/§5 — see
 * R1_5_FLOOR_SEATING_IMPLEMENTATION_REPORT.md §4 "Superseded Capacity
 * Values"). Deliberately a small static configuration, not a
 * database-backed entity — there are exactly two pools today and their
 * capacity/duration are fixed by the owner, not staff-configurable yet.
 * Promote to a real, persisted CapacityPool only when a concrete need to
 * change these values without a code change actually exists (see
 * `product-principles.md` PRP-014, PRP-020).
 *
 * Sushi maximumCapacity is 49, NOT 60 and NOT 47 — 60 was the original
 * R1.1 owner-confirmed commercial ceiling, since superseded; 47 was an
 * R1.5 architecture-investigation calculation from an incomplete table
 * inventory (missing the four one-person bar positions), never an
 * owner-confirmed capacity value and never live in this file. The
 * authoritative physical-seat proof (18 numbered tables, Table 14
 * deliberately absent, + Bar 17-20) is in the R1.5 implementation report
 * and independently re-derives to exactly 49 — see
 * infrastructure/floor/floorSeedData.ts.
 */
export type CapacityPoolId = "Sushi" | "Teppanyaki";

export interface CapacityPoolConfig {
  readonly capacityPoolId: CapacityPoolId;
  readonly maximumCapacity: number;
  readonly durationMinutes: number;
}

export const CAPACITY_POOLS: Readonly<Record<CapacityPoolId, CapacityPoolConfig>> = {
  Sushi: { capacityPoolId: "Sushi", maximumCapacity: 49, durationMinutes: 90 },
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
