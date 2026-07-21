import { RuleViolation, violation } from "../shared/Result.js";
import { ReservationStatus, canTransition } from "../value-objects/ReservationStatus.js";

export interface CancellationRuleContext {
  readonly currentStatus: ReservationStatus;
  readonly cancelReason?: string;
  /** CAP-D01.01-R26: reason becomes mandatory past an operational threshold defined by policy. */
  readonly reasonRequiredByPolicy?: boolean;
}

/**
 * CAP-D01.01-R27 (releases operational expectation) and R28 (preserves
 * historical identity) are enforced by construction: cancelling produces
 * a state transition and an event, never a deletion, and the reservation
 * remains queryable in Cancelled state afterward.
 */
export function checkCancellationRules(ctx: CancellationRuleContext): RuleViolation[] {
  const violations: RuleViolation[] = [];

  // CAP-D01.01-R25 — Proposed or Confirmed Reservations May Be Cancelled
  if (!canTransition(ctx.currentStatus, ReservationStatus.Cancelled)) {
    violations.push(
      violation(
        "CAP-D01.01-R25",
        `A reservation may transition to Cancelled only from Proposed or Confirmed (current: ${ctx.currentStatus}).`
      )
    );
  }

  // CAP-D01.01-R26 — Cancellation Reason Policy
  if (ctx.reasonRequiredByPolicy && (!ctx.cancelReason || ctx.cancelReason.trim().length === 0)) {
    violations.push(violation("CAP-D01.01-R26", "A cancellation reason is required by current policy."));
  }

  return violations;
}
