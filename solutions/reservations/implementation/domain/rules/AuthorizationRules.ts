import { RuleViolation, violation } from "../shared/Result.js";
import { Actor, ActorKind } from "../value-objects/Actor.js";

const TRUSTED_KINDS: readonly ActorKind[] = [
  ActorKind.AuthorizedUser,
  ActorKind.ApprovedGuestChannel,
  ActorKind.ApprovedIntegration,
  ActorKind.ApprovedAutomatedProcess,
];

function isTrustedActor(actor: Actor): boolean {
  return TRUSTED_KINDS.includes(actor.kind);
}

/** CAP-D01.01-R33 — Reservation Modification Requires Authority */
export function checkModificationAuthorization(actor: Actor): RuleViolation[] {
  if (!isTrustedActor(actor)) {
    return [violation("CAP-D01.01-R33", "Reservation modification requires an authorized user, trusted guest action, or approved integration.")];
  }
  return [];
}

/** CAP-D01.01-R50 — Confirmation Requires Authority */
export function checkConfirmationAuthorization(actor: Actor): RuleViolation[] {
  if (!isTrustedActor(actor)) {
    return [violation("CAP-D01.01-R50", "Reservation confirmation requires an authorized user, trusted guest action, or approved integration.")];
  }
  return [];
}

/** CAP-D01.01-R34 — Cancellation Requires Authority */
export function checkCancellationAuthorization(actor: Actor): RuleViolation[] {
  if (!isTrustedActor(actor)) {
    return [violation("CAP-D01.01-R34", "Cancellation requires an authorized staff member, authenticated guest action, approved external source, or approved automated policy.")];
  }
  return [];
}

/**
 * CAP-D01.01-R35 — Completion Requires Operational Authority
 *
 * External reservation channels shall not independently complete the
 * internal reservation lifecycle.
 */
export function checkCompletionAuthorization(actor: Actor): RuleViolation[] {
  if (actor.kind === ActorKind.ApprovedGuestChannel) {
    return [violation("CAP-D01.01-R35", "External reservation channels shall not independently complete the reservation lifecycle.")];
  }
  if (!isTrustedActor(actor)) {
    return [violation("CAP-D01.01-R35", "Reservation completion requires an authorized operational actor or approved operational capability.")];
  }
  return [];
}
