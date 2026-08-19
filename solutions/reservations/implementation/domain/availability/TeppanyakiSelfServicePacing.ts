/**
 * CAP-D02.03 — Teppanyaki self-service pacing policy.
 *
 * Owner decision ("OWNER DECISION — TEPPANYAKI SELF-SERVICE PACING
 * POLICY"), superseding the previously unresolved 70-80% Teppanyaki
 * self-service threshold. Deliberately a SEPARATE file/rule from
 * BookingPolicy.ts's two original owner-confirmed rules (party-size
 * routing, same-day cutoff) — this is its own, later, distinct owner
 * decision, not a revision of those.
 *
 * Three concepts this file MUST NOT merge (owner's own explicit
 * instruction):
 *   1. PHYSICAL CAPACITY — Teppanyaki = 40 (CapacityPool.ts, unchanged).
 *   2. SELF-SERVICE PACING CEILING — Teppanyaki = 32 (this file only).
 *   3. PHYSICAL SEATING — CAP-D04 CanSeat against C/D/E/F (domain/floor/,
 *      entirely separate, unaware of this ceiling).
 *
 * This is a booking-CHANNEL/pacing policy, not a capacity fact — exactly
 * the same category distinction BookingPolicy.ts's own header comment
 * already draws between party-size routing and physical capacity
 * ("a party of 9 is not 'capacity exhausted'... it is routed to staff").
 * A self-service request projected between 33 and 40 is NOT physically
 * over capacity — it is intentionally routed to staff so a human can
 * apply judgment (walk-in reserve, pacing, kitchen load) the automated
 * self-service channel does not have visibility into.
 *
 * Staff are exempt, exactly as they already are for BookingPolicy.ts's
 * two original rules, for the same reason: staff ARE the "route to
 * staff" destination.
 */
import { CapacityPoolId, CAPACITY_POOLS } from "./CapacityPool.js";
import { BookingPolicyOutcome } from "./BookingPolicy.js";

/** Owner-confirmed: self-service Teppanyaki booking may consume at most 80% of physical capacity. */
export const TEPPANYAKI_SELF_SERVICE_PACING_RATIO = 0.8;

/**
 * 40 * 80% = 32, computed (not hardcoded) from CAPACITY_POOLS.Teppanyaki's
 * own physical capacity, so the "32 is 80% of 40" relationship stays
 * self-evidently correct rather than two numbers that could silently
 * drift apart. Math.floor is defensive (never round up past the intended
 * ceiling) — moot at today's exact values (40 * 0.8 = 32 precisely) but
 * correct if physical capacity or the ratio ever changes.
 */
export const TEPPANYAKI_SELF_SERVICE_CEILING = Math.floor(CAPACITY_POOLS.Teppanyaki.maximumCapacity * TEPPANYAKI_SELF_SERVICE_PACING_RATIO);

/**
 * Evaluates ONLY the self-service pacing ceiling — never physical
 * capacity (that remains CAP-D02.03's existing, unmodified
 * maxExistingOccupancy + partySize > CAPACITY_POOLS[pool].maximumCapacity
 * check in AvailabilityOrchestrator, checked separately and first: a
 * projected occupancy that would exceed actual physical capacity (40) is
 * CAPACITY_EXHAUSTED regardless of this ceiling, never silently
 * downgraded to ROUTE_TO_STAFF — see AvailabilityOrchestrator's call site
 * for the exact ordering).
 *
 * Reuses BookingPolicyOutcome's existing ROUTE_TO_STAFF variant (already
 * used for party-size routing) rather than inventing a new outcome type —
 * the assignment's own instruction ("distinct outcome equivalent to
 * ROUTE_TO_STAFF") is satisfied by the SAME shape, with a distinguishing
 * `reason` string (that field already exists on ROUTE_TO_STAFF) so the
 * two triggers remain distinguishable internally without a new type.
 */
export function evaluateTeppanyakiSelfServicePacing(input: {
  readonly capacityPoolId: CapacityPoolId;
  readonly isStaffActor: boolean;
  readonly projectedOccupancy: number;
}): BookingPolicyOutcome {
  if (input.isStaffActor) return { type: "ALLOWED" };
  if (input.capacityPoolId !== "Teppanyaki") return { type: "ALLOWED" };

  if (input.projectedOccupancy > TEPPANYAKI_SELF_SERVICE_CEILING) {
    return {
      type: "ROUTE_TO_STAFF",
      reason: `Projected Teppanyaki occupancy ${input.projectedOccupancy} exceeds the self-service pacing ceiling of ${TEPPANYAKI_SELF_SERVICE_CEILING} (${TEPPANYAKI_SELF_SERVICE_PACING_RATIO * 100}% of physical capacity ${CAPACITY_POOLS.Teppanyaki.maximumCapacity}); staff assistance is required.`,
    };
  }
  return { type: "ALLOWED" };
}
