/**
 * CAP-D06.01/CAP-D06.02-adjacent — "Communication Message" (R1.6-B).
 * Pure, DB-free types and functions: idempotency-key construction,
 * confirmation/reminder eligibility, the 24-hour reminder due-instant
 * calculation, and the bounded retry backoff schedule. Mirrors the
 * existing domain/availability/*.ts pure-function shape — I/O (claiming,
 * sending, persisting) lives in application/infrastructure, never here.
 *
 * See R1_6_B_GUEST_COMMUNICATIONS_ARCHITECTURE_INVESTIGATION.md for the
 * full architecture this implements, and
 * R1_6_B_GUEST_COMMUNICATIONS_IMPLEMENTATION_REPORT.md for what changed.
 */
import { ReservationStatus, isTerminal } from "../value-objects/ReservationStatus.js";

/**
 * Only two real values today (assignment §9). A third,
 * `RESERVATION_CANCELLATION_CONFIRMATION`, is architecturally anticipated
 * (R1.6-B architecture report §22) but deliberately NOT added to this
 * union — nothing produces it yet, and guest self-service cancellation is
 * not implemented in this phase (assignment §9: "do not implement guest
 * cancellation merely to populate the enum"). The underlying database
 * column is a plain string (matching every other enum-like column in this
 * schema, e.g. Reservation.status) — adding the third value later is a
 * pure addition, not a migration.
 */
export const CommunicationType = {
  ReservationConfirmation: "RESERVATION_CONFIRMATION",
  ReservationReminder24h: "RESERVATION_REMINDER_24H",
} as const;
export type CommunicationType = (typeof CommunicationType)[keyof typeof CommunicationType];

/**
 * The assignment's own candidate list (§13 of the architecture
 * investigation), adopted as-is — no unnecessary state added.
 * `Sent` means "the provider accepted the request", never confirmed
 * inbox delivery — see Templates.ts / CommunicationWorker.ts for where
 * this distinction is enforced in practice (assignment §18).
 */
export const CommunicationStatus = {
  Pending: "Pending",
  Processing: "Processing",
  Sent: "Sent",
  FailedRetryable: "FailedRetryable",
  FailedPermanent: "FailedPermanent",
  Cancelled: "Cancelled",
} as const;
export type CommunicationStatus = (typeof CommunicationStatus)[keyof typeof CommunicationStatus];

/**
 * Deterministic logical keys (assignment §21/architecture report §16).
 * Unversioned by design for the automatic, one-shot messages — exactly
 * one confirmation and exactly one reminder should ever exist per
 * reservation's lifetime, enforced by a database UNIQUE constraint on
 * this value, not merely by "code shouldn't call it twice."
 */
export function confirmationIdempotencyKey(reservationId: string): string {
  return `${reservationId}:confirmation`;
}
/**
 * `generation` defaults to 0 (the common case: the first-ever reminder for
 * this reservation) and is omitted from the key entirely, so the vast
 * majority of reservations get the exact, simple, one-shot key described
 * above. A non-zero generation is used ONLY when a prior reminder for
 * this reservation was cancelled as stale (assignment §12/R4-R5 — staff
 * rescheduled the reservation after the reminder row already existed):
 * the ORIGINAL key stays permanently associated with that now-Cancelled
 * row (never reused — a Cancelled row is not "sent", but it did happen,
 * and its key must never collide with a fresh attempt), and the
 * replacement reminder gets the next generation's key. This preserves
 * "one reminder EVER SENT" (still enforced — nothing here lets two
 * generations both reach Sent for a normal, non-rescheduled reservation)
 * while allowing a legitimate reschedule to produce a new, correctly-
 * dated reminder rather than being permanently blocked by the stale key.
 */
export function reminderIdempotencyKey(reservationId: string, generation = 0): string {
  return generation === 0 ? `${reservationId}:reminder-24h` : `${reservationId}:reminder-24h:v${generation}`;
}
/** A staff-requested resend is deliberately NOT one-shot — `uniqueSuffix` (e.g. a freshly generated id) makes each resend attempt its own logical message, never suppressed by the original confirmation's key. */
export function resendIdempotencyKey(reservationId: string, uniqueSuffix: string): string {
  return `${reservationId}:confirmation:resend:${uniqueSuffix}`;
}

/** Confirmation/reminder eligibility gate (assignment §7/§2's staff-created-phone-only rule) — a blank/whitespace-only value never counts as usable. */
export function hasUsableEmail(email: string | undefined | null): email is string {
  return typeof email === "string" && email.trim().length > 0;
}

/** Literal 24 elapsed hours (assignment §32) — instant arithmetic, never calendar-date subtraction, so this is DST-correct by construction with no special-casing needed. */
export const REMINDER_LEAD_MS = 24 * 60 * 60 * 1000;

/** The exact instant a reservation's reminder becomes due. */
export function computeReminderDueInstant(reservationStart: Date): Date {
  return new Date(reservationStart.getTime() - REMINDER_LEAD_MS);
}

/**
 * Scan-time eligibility (assignment §11's "reminder scan" — architecture
 * report §9): true exactly when `now` has reached the due instant but the
 * reservation has not yet started. A reservation created less than 24h
 * before its own start (e.g. a same-day staff booking) is due
 * IMMEDIATELY per this same check — there is no separate "too late to
 * ever schedule" rule; see `isReminderStillEligible` for the send-time
 * gate that prevents an actually-late reminder from being sent regardless
 * of when its row was created.
 */
export function isReminderDue(reservationStart: Date, now: Date): boolean {
  return now.getTime() >= computeReminderDueInstant(reservationStart).getTime() && now.getTime() < reservationStart.getTime();
}

/**
 * Bounded tolerance (assignment §33's "grace policy") for how far a
 * reminder row's implied timing may drift from the literal 24-hour rule
 * before it is considered stale rather than merely "worker was a bit
 * slow". A staff modification that pushes the reservation meaningfully
 * further into the future than 24h+tolerance away makes any existing
 * Pending reminder row stale — see `isReminderStillEligible`.
 */
export const REMINDER_STALENESS_TOLERANCE_MS = 6 * 60 * 60 * 1000; // 6 hours

export type ReminderIneligibleReason = "TERMINAL_STATUS" | "ALREADY_STARTED" | "RESCHEDULED_OUT_OF_WINDOW";
export type ReminderEligibility = { readonly eligible: true } | { readonly eligible: false; readonly reason: ReminderIneligibleReason };

/**
 * The MANDATORY send-time re-check (assignment §13/§33; architecture
 * report §9/§11) — "do not rely solely on a reminder row created days
 * earlier." Always reads the CURRENT, authoritative `reservationStatus`/
 * `reservationStart` (never the outbox row's own stale snapshot) for this
 * decision. This single check is what makes cancellation-safety (R3) and
 * staff-modification-safety (R4/R5) both hold without any proactive
 * invalidation hook in ModifyReservationHandler/CancelReservationHandler
 * — see the implementation report §9/§10 for why this was chosen over
 * reactive rescheduling.
 */
export function isReminderStillEligible(input: {
  readonly reservationStatus: ReservationStatus;
  readonly reservationStart: Date;
  readonly now: Date;
}): ReminderEligibility {
  if (isTerminal(input.reservationStatus)) {
    return { eligible: false, reason: "TERMINAL_STATUS" };
  }
  if (input.now.getTime() >= input.reservationStart.getTime()) {
    return { eligible: false, reason: "ALREADY_STARTED" };
  }
  const dueInstant = computeReminderDueInstant(input.reservationStart).getTime();
  if (input.now.getTime() < dueInstant - REMINDER_STALENESS_TOLERANCE_MS) {
    return { eligible: false, reason: "RESCHEDULED_OUT_OF_WINDOW" };
  }
  return { eligible: true };
}

/**
 * Bounded retry schedule (architecture report §15) — ~1m, 5m, 30m, 2h, 8h.
 * Chosen to ride out a short provider outage without letting a single
 * stuck message occupy the queue indefinitely; explicitly a tunable
 * default, not an invariant. Index 0 is the delay before the SECOND
 * attempt (the first attempt is always made as soon as the message is
 * eligible — there is no delay before attempt 1).
 */
export const RETRY_BACKOFF_MS: readonly number[] = [60_000, 5 * 60_000, 30 * 60_000, 2 * 60 * 60_000, 8 * 60 * 60_000];
export const MAX_ATTEMPTS = RETRY_BACKOFF_MS.length + 1; // +1 for the initial attempt itself

/** `attemptCount` is the number of attempts already made (>=1 after the first failure). Returns the instant the NEXT attempt becomes eligible, or null if attempts are exhausted (caller should mark FailedPermanent). */
export function computeNextRetryAvailableAt(attemptCount: number, now: Date): Date | null {
  const backoffIndex = attemptCount - 1;
  const delay = RETRY_BACKOFF_MS[backoffIndex];
  if (delay === undefined) return null;
  return new Date(now.getTime() + delay);
}
