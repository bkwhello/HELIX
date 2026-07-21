/**
 * Represents whoever is attempting to act on a reservation: a staff
 * member, an approved guest-facing channel, or an approved integration.
 *
 * Used by the Authorization Rules (CAP-D01.01-R32..R35, R40).
 */
export const ActorKind = {
  AuthorizedUser: "AuthorizedUser",
  ApprovedGuestChannel: "ApprovedGuestChannel",
  ApprovedIntegration: "ApprovedIntegration",
  ApprovedAutomatedProcess: "ApprovedAutomatedProcess",
} as const;

export type ActorKind = (typeof ActorKind)[keyof typeof ActorKind];

export const ActorRole = {
  Owner: "Owner",
  Manager: "Manager",
  AssistantManager: "AssistantManager",
  Supervisor: "Supervisor",
  ReservationAgent: "ReservationAgent",
  Reception: "Reception",
} as const;

export type ActorRole = (typeof ActorRole)[keyof typeof ActorRole];

export interface Actor {
  readonly id: string;
  readonly kind: ActorKind;
  readonly role?: ActorRole;
}

/** CAP-D01.01-R40 — Override Requires Authorized Role (initial authorized roles). */
const OVERRIDE_AUTHORIZED_ROLES: readonly ActorRole[] = [ActorRole.Owner, ActorRole.Manager];

export function isAuthorizedToOverride(actor: Actor): boolean {
  return actor.role !== undefined && OVERRIDE_AUTHORIZED_ROLES.includes(actor.role);
}
