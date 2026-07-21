import { RuleViolation, violation } from "../shared/Result.js";
import { Actor, ActorKind } from "../value-objects/Actor.js";
import { ReservationDateTime } from "../value-objects/ReservationDateTime.js";

export interface CreationRuleContext {
  readonly dateTime: ReservationDateTime;
  readonly now: Date;
  readonly actor: Actor;
  /** CAP-D01.01-R11 override: an authorized correction creating a historical record. */
  readonly isHistoricalCorrection?: boolean;
  readonly historicalCorrectionReason?: string;
  /** CAP-D01.01-R14: supplied by the caller after checking the repository. Domain does not query storage itself. */
  readonly potentialDuplicateDetected?: boolean;
}

/**
 * CAP-D01.01-R08 (required fields) is enforced by TypeScript's type system —
 * a CreateReservationRequest cannot be constructed without these fields.
 *
 * CAP-D01.01-R09 (party size) and R10 (valid date/time) are enforced by the
 * PartySize and ReservationDateTime value objects at construction time.
 */
export function checkCreationRules(ctx: CreationRuleContext): RuleViolation[] {
  const violations: RuleViolation[] = [];

  // CAP-D01.01-R11 — Past Reservation Creation Requires Explicit Policy
  if (ctx.dateTime.isBefore(ctx.now)) {
    if (!ctx.isHistoricalCorrection) {
      violations.push(
        violation(
          "CAP-D01.01-R11",
          "A reservation shall not normally be created for a date and time that has already passed."
        )
      );
    } else if (!ctx.historicalCorrectionReason || ctx.historicalCorrectionReason.trim().length === 0) {
      violations.push(
        violation("CAP-D01.01-R11", "A historical correction reservation requires a recorded reason.")
      );
    }
  }

  // CAP-D01.01-R32 — Reservation Creation Requires Authorized Actor or Trusted Source
  if (
    ctx.actor.kind !== ActorKind.AuthorizedUser &&
    ctx.actor.kind !== ActorKind.ApprovedGuestChannel &&
    ctx.actor.kind !== ActorKind.ApprovedIntegration &&
    ctx.actor.kind !== ActorKind.ApprovedAutomatedProcess
  ) {
    violations.push(
      violation("CAP-D01.01-R32", "Reservation creation requires an authorized actor or an approved trusted source.")
    );
  }

  return violations;
}

/**
 * CAP-D01.01-R14 — Duplicate Creation Must Be Detectable
 *
 * A Warning-severity, overridable rule: it produces a warning, not a
 * blocking violation. Duplicate detection itself happens outside the
 * domain (the aggregate does not query storage); the caller supplies
 * whether a potential duplicate was found.
 */
export function checkDuplicateWarning(ctx: CreationRuleContext): RuleViolation | null {
  if (ctx.potentialDuplicateDetected) {
    return violation("CAP-D01.01-R14", "A potentially duplicate reservation already exists.");
  }
  return null;
}
