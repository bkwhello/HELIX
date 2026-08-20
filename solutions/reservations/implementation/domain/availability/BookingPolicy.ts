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
 *
 * R1.6-A CORRECTION (Chief Engineer "R1.6-A Service Period Management"
 * assignment §11): the R1.6 architecture investigation found this file's
 * same-day cutoff branch returned a distinct, hard-rejecting
 * `REJECTED_CUTOFF` outcome, diverging from the owner's actual confirmed
 * intent. Owner decision, now authoritative: same-day self-service after
 * 17:00 is ROUTE_TO_STAFF ("please call Konnichiwa"), never a hard
 * rejection — semantically identical to every other self-service routing
 * reason this file already produces (party-size 9+), just a different
 * `reason` string. `REJECTED_CUTOFF` has been removed from
 * BookingPolicyOutcome entirely — nothing else in the codebase ever
 * produced or depended on it as a distinct type (confirmed by a full
 * repository grep before this change). The boundary CONDITION itself
 * (`hour >= SAME_DAY_SELF_SERVICE_CUTOFF_HOUR`, i.e. exactly 17:00:00
 * local is already at-or-after the cutoff) is unchanged — only the
 * outcome type changed. This is the ONLY change this correction makes;
 * party-size routing, the staff exemption, and the local-date boundary
 * logic below are all untouched.
 */
import {
  SELF_SERVICE_MIN_PARTY_SIZE,
  SELF_SERVICE_MAX_PARTY_SIZE,
  SAME_DAY_SELF_SERVICE_CUTOFF_HOUR,
} from "./CapacityPool.js";
import { toLocalServiceDate, toLocalHourMinute } from "./ServiceTime.js";

export type BookingPolicyOutcome = { readonly type: "ALLOWED" } | { readonly type: "ROUTE_TO_STAFF"; readonly reason: string };

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
        type: "ROUTE_TO_STAFF",
        reason: `Same-day self-service bookings close at ${SAME_DAY_SELF_SERVICE_CUTOFF_HOUR}:00 Europe/Amsterdam; please contact Konnichiwa directly for availability.`,
      };
    }
  }

  return { type: "ALLOWED" };
}
