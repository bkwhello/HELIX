/**
 * CAP-D02.03 — Availability outcomes.
 *
 * Distinguishes "we determined the answer is no" from "we cannot
 * determine an answer" (CONFIGURATION_ERROR / NO_SERVICE_PERIOD), per
 * the approved architecture. Never collapsed into one generic rejection.
 */
export type AvailabilityOutcome =
  | { readonly type: "AVAILABLE" }
  | { readonly type: "CAPACITY_EXHAUSTED"; readonly maxExistingOccupancy: number; readonly capacity: number }
  | { readonly type: "CLOSED" }
  | { readonly type: "NO_SERVICE_PERIOD" }
  | { readonly type: "AREA_UNAVAILABLE" }
  | { readonly type: "INVALID_REQUEST"; readonly reason: string }
  | { readonly type: "CONFIGURATION_ERROR"; readonly reason: string }
  /** CAP-D02.03 §21 — reservation's occupied interval would run past the ServicePeriod's closing time. TEMPORARY SAFE DEFAULT, fail closed — see AvailabilityEvaluator.ts. */
  | { readonly type: "OUTSIDE_OPERATING_WINDOW" };

export function isAvailable(outcome: AvailabilityOutcome): outcome is { readonly type: "AVAILABLE" } {
  return outcome.type === "AVAILABLE";
}
