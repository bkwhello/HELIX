/**
 * CAP-D02.03 — booking-policy guard.
 *
 * Deliberately separate from AvailabilityEvaluator: party-size routing and
 * the same-day cutoff are business/channel policy, not physical-capacity
 * facts. A party of 9 is not "capacity exhausted" — the pool may be
 * empty — it is routed to staff because self-service booking is not
 * offered above 8 guests. Conflating the two would make AvailabilityResult
 * ambiguous about *why* a request cannot proceed, which matters for how
 * the caller responds to the guest.
 *
 * Owner-confirmed rules (Architecture Revision report): self-service party
 * size 1–8 (9+ routes to staff); same-day self-service cutoff at 17:00
 * Europe/Amsterdam; staff are exempt from both restrictions.
 */
import {
  SELF_SERVICE_MIN_PARTY_SIZE,
  SELF_SERVICE_MAX_PARTY_SIZE,
  SAME_DAY_SELF_SERVICE_CUTOFF_HOUR,
} from "./CapacityPool.js";
import { toLocalServiceDate, toLocalHourMinute } from "./ServiceTime.js";

export type BookingPolicyOutcome =
  | { readonly type: "ALLOWED" }
  | { readonly type: "ROUTE_TO_STAFF"; readonly reason: string }
  | { readonly type: "REJECTED_CUTOFF"; readonly reason: string };

export function evaluateBookingPolicy(input: {
  readonly partySize: number;
  readonly requestedStart: Date;
  readonly now: Date;
  readonly isStaffActor: boolean;
}): BookingPolicyOutcome {
  const { partySize, requestedStart, now, isStaffActor } = input;

  // Staff are exempt from both the party-size routing rule and the
  // same-day cutoff — they ARE the "route to staff" destination, and the
  // cutoff exists to protect kitchen lead time for guest self-service,
  // not to stop staff from booking a table themselves.
  if (isStaffActor) {
    return { type: "ALLOWED" };
  }

  if (partySize < SELF_SERVICE_MIN_PARTY_SIZE || partySize > SELF_SERVICE_MAX_PARTY_SIZE) {
    return {
      type: "ROUTE_TO_STAFF",
      reason: `Party size ${partySize} is outside the self-service range (${SELF_SERVICE_MIN_PARTY_SIZE}-${SELF_SERVICE_MAX_PARTY_SIZE}); staff assistance is required.`,
    };
  }

  const requestedLocalDate = toLocalServiceDate(requestedStart);
  const nowLocalDate = toLocalServiceDate(now);
  if (requestedLocalDate === nowLocalDate) {
    // Interpretation choice, made explicit because the source rule ("cutoff
    // at 17:00") does not itself say whether 17:00 is the last allowed
    // minute or the first blocked one: from local hour 17 onward (17:00:00
    // inclusive) self-service is closed. This is the stricter of the two
    // readings — consistent with this MVA's fail-closed posture on
    // ambiguous boundaries — and should be revisited if the owner states a
    // different intent.
    const { hour } = toLocalHourMinute(now);
    if (hour >= SAME_DAY_SELF_SERVICE_CUTOFF_HOUR) {
      return {
        type: "REJECTED_CUTOFF",
        reason: `Same-day self-service bookings close at ${SAME_DAY_SELF_SERVICE_CUTOFF_HOUR}:00 Europe/Amsterdam.`,
      };
    }
  }

  return { type: "ALLOWED" };
}
