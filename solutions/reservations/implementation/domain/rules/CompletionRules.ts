import { RuleViolation, violation } from "../shared/Result.js";
import { ReservationStatus, canTransition } from "../value-objects/ReservationStatus.js";

export interface CompletionRuleContext {
  readonly currentStatus: ReservationStatus;
  /** CAP-D01.01-R30: evidence the visit has concluded (Live Service, Guest Arrival, Table Turn, or manual). */
  readonly hasOperationalEvidence: boolean;
  readonly manualCompletionReason?: string;
  readonly isManualCompletion?: boolean;
}

/**
 * CAP-D01.01-R31 — Completed State Is Terminal — is enforced by the
 * ReservationStatus transition table: nothing transitions out of Completed.
 */
export function checkCompletionRules(ctx: CompletionRuleContext): RuleViolation[] {
  const violations: RuleViolation[] = [];

  // CAP-D01.01-R29 — Only Confirmed Reservations May Be Completed
  if (!canTransition(ctx.currentStatus, ReservationStatus.Completed)) {
    violations.push(
      violation("CAP-D01.01-R29", `A reservation may transition to Completed only from Confirmed (current: ${ctx.currentStatus}).`)
    );
  }

  // CAP-D01.01-R30 — Completion Requires Operational Evidence
  if (!ctx.hasOperationalEvidence) {
    violations.push(violation("CAP-D01.01-R30", "Completion requires evidence that the reservation visit has concluded."));
  }
  if (ctx.isManualCompletion && (!ctx.manualCompletionReason || ctx.manualCompletionReason.trim().length === 0)) {
    violations.push(violation("CAP-D01.01-R30", "Manual completion requires a recorded actor and reason."));
  }

  return violations;
}
