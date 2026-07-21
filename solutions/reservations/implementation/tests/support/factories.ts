import { Actor, ActorKind, ActorRole } from "../../domain/value-objects/Actor.js";
import { CreateReservationCommand } from "../../domain/commands/ReservationCommands.js";
import { ReservationSourceCategory } from "../../domain/value-objects/ReservationSource.js";
import { CompletionEvidence, CompletionEvidenceType } from "../../domain/value-objects/CompletionEvidence.js";

export const NOW = new Date("2026-08-01T10:00:00Z");
export const FUTURE_DATE = new Date("2026-08-15T19:00:00Z");
export const PAST_DATE = new Date("2026-01-01T19:00:00Z");

export const staffActor: Actor = { id: "staff-1", kind: ActorKind.AuthorizedUser, role: ActorRole.Reception };
export const managerActor: Actor = { id: "manager-1", kind: ActorKind.AuthorizedUser, role: ActorRole.Manager };
export const guestChannelActor: Actor = { id: "guest-channel-1", kind: ActorKind.ApprovedGuestChannel };
export const unauthorizedActor: Actor = { id: "nobody", kind: "Unknown" as ActorKind };

let envelopeCounter = 0;
/** A fresh eventId/correlationId pair for a domain command under test. */
export function testEnvelope(): { eventId: string; correlationId: string } {
  envelopeCounter += 1;
  return { eventId: `evt-${envelopeCounter}`, correlationId: `corr-${envelopeCounter}` };
}

export function validCompletionEvidence(overrides: Partial<CompletionEvidence> = {}): CompletionEvidence {
  return {
    type: CompletionEvidenceType.StaffObservation,
    recordedBy: staffActor.id,
    recordedAt: NOW,
    ...overrides,
  };
}

export function validCreateCommand(overrides: Partial<CreateReservationCommand> = {}): CreateReservationCommand {
  return {
    ...testEnvelope(),
    reservationId: "res-1",
    servicePeriodId: "sp-1",
    contactId: "contact-1",
    reservationDate: FUTURE_DATE,
    partySize: 4,
    source: { category: ReservationSourceCategory.Telephone },
    actor: staffActor,
    now: NOW,
    ...overrides,
  };
}
