import { Actor, ActorKind, ActorRole } from "../../domain/value-objects/Actor.js";
import { CreateReservationCommand } from "../../domain/commands/ReservationCommands.js";
import { ReservationSourceCategory } from "../../domain/value-objects/ReservationSource.js";

export const NOW = new Date("2026-08-01T10:00:00Z");
export const FUTURE_DATE = new Date("2026-08-15T19:00:00Z");
export const PAST_DATE = new Date("2026-01-01T19:00:00Z");

export const staffActor: Actor = { id: "staff-1", kind: ActorKind.AuthorizedUser, role: ActorRole.Reception };
export const managerActor: Actor = { id: "manager-1", kind: ActorKind.AuthorizedUser, role: ActorRole.Manager };
export const guestChannelActor: Actor = { id: "guest-channel-1", kind: ActorKind.ApprovedGuestChannel };
export const unauthorizedActor: Actor = { id: "nobody", kind: "Unknown" as ActorKind };

export function validCreateCommand(overrides: Partial<CreateReservationCommand> = {}): CreateReservationCommand {
  return {
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
