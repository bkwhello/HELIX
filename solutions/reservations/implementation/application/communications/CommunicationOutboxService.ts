/**
 * R1.6-B — composes the confirmation-enqueue write (§8/§6) and the
 * reminder scan (§9/§11) — the two places new CommunicationMessage rows
 * are ever created. Mirrors AvailabilityOrchestrator's "one place
 * composes I/O + pure domain logic" shape (CAP-D02.03), applied to a
 * narrower, capacity-free concern.
 */
import { CommunicationOutboxRepository, CommunicationMessagePayload } from "../ports/CommunicationOutboxRepository.js";
import { ReservationRepository } from "../../domain/repositories/ReservationRepository.js";
import { Clock } from "../ports/Clock.js";
import { TransactionContext } from "../../domain/shared/TransactionContext.js";
import { CommunicationLanguage } from "../../domain/value-objects/CommunicationLanguage.js";
import { isTerminal } from "../../domain/value-objects/ReservationStatus.js";
import {
  CommunicationType,
  confirmationIdempotencyKey,
  reminderIdempotencyKey,
  hasUsableEmail,
  isReminderDue,
  REMINDER_STALENESS_TOLERANCE_MS,
} from "../../domain/communications/CommunicationMessage.js";

export interface EnqueueConfirmationInput {
  readonly reservationId: string;
  readonly guestName: string | undefined;
  readonly contactEmailSnapshot: string | undefined;
  readonly reservationStart: Date;
  readonly partySize: number;
  readonly area: string | undefined;
  readonly language: CommunicationLanguage;
  readonly tx?: TransactionContext;
}

export class CommunicationOutboxService {
  constructor(
    private readonly outboxRepository: CommunicationOutboxRepository,
    private readonly reservationRepository: ReservationRepository,
    private readonly clock: Clock
  ) {}

  /**
   * Assignment §6/§8 — called from CreateReservationHandler.finalize(),
   * inside the SAME transaction as the reservation write. No-op (INV-C12,
   * assignment §7) when there is no usable email — a staff-created
   * phone-only reservation produces zero rows here, by construction, not
   * by a special-cased branch.
   */
  async enqueueConfirmationIfEligible(input: EnqueueConfirmationInput): Promise<void> {
    if (!hasUsableEmail(input.contactEmailSnapshot)) return;

    const payload: CommunicationMessagePayload = {
      guestName: input.guestName ?? "Guest",
      reservationReference: input.reservationId,
      reservationStart: input.reservationStart.toISOString(),
      partySize: input.partySize,
      area: input.area ?? "N/A",
    };

    await this.outboxRepository.enqueue({
      reservationId: input.reservationId,
      communicationType: CommunicationType.ReservationConfirmation,
      language: input.language,
      recipientEmail: input.contactEmailSnapshot,
      payload,
      idempotencyKey: confirmationIdempotencyKey(input.reservationId),
      availableAt: this.clock.now(),
      tx: input.tx,
    });
  }

  /**
   * Assignment §9/§11; architecture report §9's "Model B, refined" — no
   * row is pre-created at booking time. This scan is the ONLY place a
   * Reminder row is ever created, and it always reads the reservation's
   * CURRENT `reservationDate` — never a value frozen at booking time —
   * which is what makes a staff modification "just work" without any
   * proactive rescheduling hook elsewhere (see the implementation
   * report's §9/§10 for the full reasoning). Safe to call repeatedly
   * (idempotent via the `idempotencyKey` unique constraint, assignment
   * §21) and safe to call after downtime (assignment §33 — scans forward
   * from `now`, never assumes it ran continuously).
   */
  async scanAndScheduleReminders(now: Date): Promise<{ readonly scheduled: number; readonly scanned: number }> {
    // Window: reservations starting between now and now + 24h + staleness
    // tolerance are candidates — isReminderDue (below) narrows further to
    // the exact due condition per reservation.
    const windowEnd = new Date(now.getTime() + 24 * 60 * 60 * 1000 + REMINDER_STALENESS_TOLERANCE_MS);
    const candidates = await this.reservationRepository.findStartingBetween(now, windowEnd);

    let scheduled = 0;
    for (const reservation of candidates) {
      if (isTerminal(reservation.getStatus())) continue;
      const email = reservation.getContactEmailSnapshot();
      if (!hasUsableEmail(email)) continue;
      const start = reservation.getReservationDateTime();
      if (!isReminderDue(start, now)) continue;

      const payload: CommunicationMessagePayload = {
        guestName: reservation.getContactName() ?? "Guest",
        reservationReference: reservation.getId().toString(),
        reservationStart: start.toISOString(),
        partySize: reservation.getPartySize(),
        area: reservation.getPreferredArea() ?? "N/A",
      };

      // Generation 0 (the plain, unsuffixed key) covers the overwhelming
      // common case. If a NON-cancelled reminder already exists (Pending/
      // Processing/FailedRetryable/Sent), this reservation is already
      // correctly handled — skip it entirely (this is the idempotent-scan
      // guard, assignment §21). Only a prior CANCELLED reminder (a staff
      // reschedule made an earlier row stale, assignment §12 — see
      // domain/communications/CommunicationMessage.ts's
      // reminderIdempotencyKey doc comment) justifies creating a fresh
      // one, using the next generation so its key never collides with the
      // cancelled row's own, permanently-occupied key.
      const existingReminders = (await this.outboxRepository.findByReservationId(reservation.getId().toString())).filter(
        (m) => m.communicationType === CommunicationType.ReservationReminder24h
      );
      if (existingReminders.some((m) => m.status !== "Cancelled")) continue;
      const generation = existingReminders.filter((m) => m.status === "Cancelled").length;

      const result = await this.outboxRepository.enqueue({
        reservationId: reservation.getId().toString(),
        communicationType: CommunicationType.ReservationReminder24h,
        language: reservation.getCommunicationLanguage(),
        recipientEmail: email,
        payload,
        idempotencyKey: reminderIdempotencyKey(reservation.getId().toString(), generation),
        availableAt: now,
      });
      if (result.type === "ENQUEUED") scheduled += 1;
    }

    return { scheduled, scanned: candidates.length };
  }
}
