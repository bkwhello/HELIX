import { RuleViolation, violation } from "../shared/Result.js";
import { ReservationStatus, isTerminal } from "../value-objects/ReservationStatus.js";

export interface ModificationRuleContext {
  readonly currentStatus: ReservationStatus;
  /** True when the change is an authorized correction to a terminal reservation (CAP-D01.01-R16). */
  readonly isAuthorizedCorrection?: boolean;
  readonly correctionReason?: string;
  /** Fields the caller is attempting to change. */
  readonly changedFields: readonly string[];
}

const IMMUTABLE_FIELDS = new Set(["reservationId", "createdAt", "createdBy", "originalSourceReference"]);

/**
 * CAP-D01.01-R15 (existing reservation required) is enforced by the
 * repository / command handler before the aggregate is loaded at all —
 * there is nothing to modify without an existing aggregate instance.
 *
 * CAP-D01.01-R19 (resulting validity) is enforced because every changed
 * field is re-validated through its value object on the way in.
 */
export function checkModificationRules(ctx: ModificationRuleContext): RuleViolation[] {
  const violations: RuleViolation[] = [];

  // CAP-D01.01-R16 — Terminal Reservations Are Not Normally Modifiable
  if (isTerminal(ctx.currentStatus) && !ctx.isAuthorizedCorrection) {
    violations.push(
      violation(
        "CAP-D01.01-R16",
        `A ${ctx.currentStatus} reservation shall not be modified as part of normal operation.`
      )
    );
  }
  if (isTerminal(ctx.currentStatus) && ctx.isAuthorizedCorrection) {
    if (!ctx.correctionReason || ctx.correctionReason.trim().length === 0) {
      violations.push(violation("CAP-D01.01-R16", "An authorized correction requires a recorded reason."));
    }
  }

  // CAP-D01.01-R17 — Immutable Fields Cannot Be Modified
  const attemptedImmutableChange = ctx.changedFields.find((f) => IMMUTABLE_FIELDS.has(f));
  if (attemptedImmutableChange) {
    violations.push(violation("CAP-D01.01-R17", `Field "${attemptedImmutableChange}" is immutable and cannot be modified.`));
  }

  return violations;
}

/** CAP-D01.01-R20 — Date or Time Change Requires Service-Period Revalidation */
export function requiresServicePeriodRevalidation(changedFields: readonly string[]): boolean {
  return changedFields.includes("reservationDate") || changedFields.includes("reservationTime");
}

/** CAP-D01.01-R21 — Party-Size Change Requires Downstream Revalidation (owned by other capabilities). */
export function requiresDownstreamRevalidation(changedFields: readonly string[]): boolean {
  return changedFields.includes("partySize");
}
