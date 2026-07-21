import { RuleViolation, violation } from "../shared/Result.js";
import { ReservationStatus, canTransition } from "../value-objects/ReservationStatus.js";

export interface ConfirmationRuleContext {
  readonly currentStatus: ReservationStatus;
  /** CAP-D01.01-R23: whether all required reservation information currently holds. */
  readonly isReservationDataValid: boolean;
}

/**
 * CAP-D01.01-R24 — Confirmation Does Not Guarantee Seating
 *
 * Enforced by omission: confirming a reservation never touches seating,
 * table, or synchronization state, because the aggregate has no such
 * fields to touch. Those outcomes belong to other capabilities.
 */
export function checkConfirmationRules(ctx: ConfirmationRuleContext): RuleViolation[] {
  const violations: RuleViolation[] = [];

  // CAP-D01.01-R22 — Only Proposed Reservations May Be Confirmed
  if (!canTransition(ctx.currentStatus, ReservationStatus.Confirmed)) {
    violations.push(
      violation("CAP-D01.01-R22", `A reservation may transition to Confirmed only from Proposed (current: ${ctx.currentStatus}).`)
    );
  }

  // CAP-D01.01-R23 — Confirmation Requires Valid Reservation Data
  if (!ctx.isReservationDataValid) {
    violations.push(violation("CAP-D01.01-R23", "A reservation shall not be confirmed unless all required information is valid."));
  }

  return violations;
}
