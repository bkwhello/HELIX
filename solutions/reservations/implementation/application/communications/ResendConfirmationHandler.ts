/**
 * R1.6-B — staff "resend confirmation" operation (assignment §22).
 * Authentication/authorization (R1.2) is enforced by the API layer
 * (requireStaffSession + requirePermission) BEFORE this handler is ever
 * reached — mirrors every other command handler in this codebase, none
 * of which re-checks permissions itself.
 *
 * Creates a NEW, independent CommunicationMessage row — never mutates the
 * original confirmation row, never touches Reservation business state or
 * version, never creates another Reservation (assignment §22/§42 S7).
 */
import { ReservationRepository } from "../../domain/repositories/ReservationRepository.js";
import { CommunicationOutboxRepository, CommunicationMessagePayload } from "../ports/CommunicationOutboxRepository.js";
import { IdGenerator } from "../ports/IdGenerator.js";
import { Clock } from "../ports/Clock.js";
import { ReservationId } from "../../domain/value-objects/ReservationId.js";
import { CommunicationType, hasUsableEmail, resendIdempotencyKey } from "../../domain/communications/CommunicationMessage.js";

export type ResendConfirmationResult =
  | { readonly type: "RESENT"; readonly messageId: string }
  | { readonly type: "NO_USABLE_EMAIL" }
  | { readonly type: "RESERVATION_NOT_FOUND" };

export class ResendConfirmationHandler {
  constructor(
    private readonly reservationRepository: ReservationRepository,
    private readonly outboxRepository: CommunicationOutboxRepository,
    private readonly idGenerator: IdGenerator,
    private readonly clock: Clock
  ) {}

  async handle(input: { readonly reservationId: string }): Promise<ResendConfirmationResult> {
    const idResult = ReservationId.create(input.reservationId);
    if (!idResult.ok) return { type: "RESERVATION_NOT_FOUND" };

    const reservation = await this.reservationRepository.findById(idResult.value);
    if (!reservation) return { type: "RESERVATION_NOT_FOUND" };

    const email = reservation.getContactEmailSnapshot();
    // §42 S2 — a phone-only reservation is a safe, non-error validation outcome; the Reservation itself is never touched either way.
    if (!hasUsableEmail(email)) return { type: "NO_USABLE_EMAIL" };

    const payload: CommunicationMessagePayload = {
      guestName: reservation.getContactName() ?? "Guest",
      reservationReference: reservation.getId().toString(),
      reservationStart: reservation.getReservationDateTime().toISOString(),
      partySize: reservation.getPartySize(),
      area: reservation.getPreferredArea() ?? "N/A",
    };

    const now = this.clock.now();
    const result = await this.outboxRepository.enqueue({
      reservationId: reservation.getId().toString(),
      communicationType: CommunicationType.ReservationConfirmation,
      language: reservation.getCommunicationLanguage(),
      recipientEmail: email,
      payload,
      // Deliberately NOT the one-shot confirmationIdempotencyKey — a resend
      // is intentionally a distinct logical message each time it is
      // requested (assignment §21: "Do not accidentally suppress a
      // required new confirmation"), never suppressed by, and never
      // suppressing, the original.
      idempotencyKey: resendIdempotencyKey(reservation.getId().toString(), this.idGenerator.generate()),
      availableAt: now,
    });

    // ENQUEUED is the only reachable outcome here in practice (the key is
    // freshly generated each call), but handled explicitly rather than assumed.
    if (result.type === "ALREADY_EXISTS") {
      return { type: "RESENT", messageId: "" };
    }
    return { type: "RESENT", messageId: result.record.id };
  }
}
