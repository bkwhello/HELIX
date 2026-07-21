import { RuleViolation, violation } from "../shared/Result.js";
import { Actor, isAuthorizedToOverride } from "../value-objects/Actor.js";

export interface OverrideRequest {
  readonly ruleId: string;
  readonly actor: Actor;
  readonly reason: string;
  readonly previousValue: unknown;
  readonly newValue: unknown;
}

const OVERRIDABLE_RULES = new Set([
  "CAP-D01.01-R11", // Past reservation creation
  "CAP-D01.01-R14", // Duplicate detection (warning)
  "CAP-D01.01-R16", // Terminal reservation correction
  "CAP-D01.01-R26", // Cancellation reason policy
  "CAP-D01.01-R30", // Manual completion evidence
]);

/**
 * CAP-D01.01-R39 — Override Must Be Explicit
 * CAP-D01.01-R40 — Override Requires Authorized Role
 * CAP-D01.01-R41 — Override Requires Reason
 * CAP-D01.01-R42 — Override Generates an Event (enforced by the command
 *   handler: a successful override always emits a correction/override
 *   event, never an ordinary lifecycle event).
 */
export function checkOverrideRules(request: OverrideRequest): RuleViolation[] {
  const violations: RuleViolation[] = [];

  if (!OVERRIDABLE_RULES.has(request.ruleId)) {
    violations.push(violation("CAP-D01.01-R39", `Rule ${request.ruleId} does not permit override.`));
  }

  if (!isAuthorizedToOverride(request.actor)) {
    violations.push(violation("CAP-D01.01-R40", "Override requires an explicitly authorized role (Owner or Manager)."));
  }

  if (!request.reason || request.reason.trim().length === 0) {
    violations.push(violation("CAP-D01.01-R41", "Every override shall record a reason."));
  }

  return violations;
}
