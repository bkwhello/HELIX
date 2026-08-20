import { describe, it, expect } from "vitest";
import { ReservationStatus } from "../../domain/value-objects/ReservationStatus.js";
import {
  CommunicationType,
  confirmationIdempotencyKey,
  reminderIdempotencyKey,
  resendIdempotencyKey,
  hasUsableEmail,
  REMINDER_LEAD_MS,
  computeReminderDueInstant,
  isReminderDue,
  isReminderStillEligible,
  REMINDER_STALENESS_TOLERANCE_MS,
  RETRY_BACKOFF_MS,
  MAX_ATTEMPTS,
  computeNextRetryAvailableAt,
} from "../../domain/communications/CommunicationMessage.js";

describe("CommunicationType — assignment §9", () => {
  it("has exactly two implemented values (a third, cancellation-confirmation, is deliberately not populated yet)", () => {
    expect(Object.values(CommunicationType).sort()).toEqual(["RESERVATION_CONFIRMATION", "RESERVATION_REMINDER_24H"]);
  });
});

describe("idempotency keys — assignment §21/§31", () => {
  it("confirmation and reminder keys are unversioned by default — one-shot forever per reservation", () => {
    expect(confirmationIdempotencyKey("res-1")).toBe("res-1:confirmation");
    expect(reminderIdempotencyKey("res-1")).toBe("res-1:reminder-24h");
    // Calling again with the same reservationId produces the IDENTICAL key — this is what the database UNIQUE constraint relies on.
    expect(confirmationIdempotencyKey("res-1")).toBe(confirmationIdempotencyKey("res-1"));
  });

  it("a non-zero reminder generation produces a distinct key, reserved for a fresh reminder after a prior one was cancelled as stale (assignment §12)", () => {
    expect(reminderIdempotencyKey("res-1", 0)).toBe("res-1:reminder-24h");
    expect(reminderIdempotencyKey("res-1", 1)).toBe("res-1:reminder-24h:v1");
    expect(reminderIdempotencyKey("res-1", 2)).toBe("res-1:reminder-24h:v2");
    expect(reminderIdempotencyKey("res-1", 1)).not.toBe(reminderIdempotencyKey("res-1", 0));
  });

  it("resend keys are deliberately distinct per call — never suppressed by, and never suppressing, the original confirmation", () => {
    const a = resendIdempotencyKey("res-1", "attempt-a");
    const b = resendIdempotencyKey("res-1", "attempt-b");
    expect(a).not.toBe(b);
    expect(a).not.toBe(confirmationIdempotencyKey("res-1"));
  });
});

describe("hasUsableEmail — assignment §7/§25", () => {
  it.each([undefined, null, "", "   "])("%j is not usable", (value) => {
    expect(hasUsableEmail(value as string | undefined | null)).toBe(false);
  });
  it("a real address is usable", () => {
    expect(hasUsableEmail("guest@example.com")).toBe(true);
  });
});

describe("reminder due-instant — assignment §32 (instant arithmetic, never calendar-date subtraction)", () => {
  it("REMINDER_LEAD_MS is exactly 24 hours", () => {
    expect(REMINDER_LEAD_MS).toBe(24 * 60 * 60 * 1000);
  });

  it("computeReminderDueInstant subtracts exactly 24 elapsed hours from the reservation start instant", () => {
    const start = new Date("2026-08-21T19:00:00Z");
    expect(computeReminderDueInstant(start).toISOString()).toBe("2026-08-20T19:00:00.000Z");
  });

  it("is DST-correct by construction: reservation just after the 2026-03-29 spring-forward transition", () => {
    // Reservation starts 2026-03-30T10:00:00Z. Literally 24 elapsed hours before = 2026-03-29T10:00:00Z,
    // regardless of the DST transition occurring at 2026-03-29T01:00:00Z in between (a naive local-date
    // subtraction could be off by an hour here — instant arithmetic cannot be).
    const start = new Date("2026-03-30T10:00:00Z");
    expect(computeReminderDueInstant(start).toISOString()).toBe("2026-03-29T10:00:00.000Z");
  });

  it("is DST-correct by construction: reservation just after the 2026-10-25 fall-back transition", () => {
    const start = new Date("2026-10-26T10:00:00Z");
    expect(computeReminderDueInstant(start).toISOString()).toBe("2026-10-25T10:00:00.000Z");
  });
});

describe("isReminderDue — scan-time eligibility (assignment §11)", () => {
  const start = new Date("2026-08-21T19:00:00Z");

  it("not due more than 24h before start", () => {
    expect(isReminderDue(start, new Date("2026-08-20T18:59:59Z"))).toBe(false);
  });
  it("due exactly at the 24h-before instant", () => {
    expect(isReminderDue(start, new Date("2026-08-20T19:00:00Z"))).toBe(true);
  });
  it("still due right up to (but not including) the reservation start", () => {
    expect(isReminderDue(start, new Date("2026-08-21T18:59:59Z"))).toBe(true);
  });
  it("no longer due once the reservation has started (§28 — never a late reminder)", () => {
    expect(isReminderDue(start, start)).toBe(false);
    expect(isReminderDue(start, new Date("2026-08-21T19:00:01Z"))).toBe(false);
  });
  it("a same-day booking made less than 24h before start is due IMMEDIATELY, not blocked", () => {
    // Booked at 2026-08-21T10:00Z for a 2026-08-21T19:00Z start — the due instant (2026-08-20T19:00Z) is already in the past.
    expect(isReminderDue(start, new Date("2026-08-21T10:00:00Z"))).toBe(true);
  });
});

describe("isReminderStillEligible — the mandatory send-time re-check (assignment §11/§13/§33)", () => {
  const start = new Date("2026-08-21T19:00:00Z");
  const dueInstant = new Date("2026-08-20T19:00:00Z");

  it("eligible at the normal due instant for an active reservation", () => {
    expect(isReminderStillEligible({ reservationStatus: ReservationStatus.Confirmed, reservationStart: start, now: dueInstant })).toEqual({ eligible: true });
  });

  it("ineligible — cancelled (R3)", () => {
    expect(isReminderStillEligible({ reservationStatus: ReservationStatus.Cancelled, reservationStart: start, now: dueInstant })).toEqual({
      eligible: false,
      reason: "TERMINAL_STATUS",
    });
  });

  it("ineligible — completed (also terminal)", () => {
    expect(isReminderStillEligible({ reservationStatus: ReservationStatus.Completed, reservationStart: start, now: dueInstant })).toEqual({
      eligible: false,
      reason: "TERMINAL_STATUS",
    });
  });

  it("ineligible — the reservation has already started (§28)", () => {
    expect(isReminderStillEligible({ reservationStatus: ReservationStatus.Confirmed, reservationStart: start, now: start })).toEqual({
      eligible: false,
      reason: "ALREADY_STARTED",
    });
  });

  it("ineligible — rescheduled far enough into the future that this row is stale (R4/R5)", () => {
    // Reservation moved from 2026-08-21T19:00Z to e.g. 2026-08-25T19:00Z — "now" (the original due instant) is now
    // more than REMINDER_STALENESS_TOLERANCE_MS earlier than the NEW due instant (2026-08-24T19:00Z).
    const newStart = new Date("2026-08-25T19:00:00Z");
    expect(isReminderStillEligible({ reservationStatus: ReservationStatus.Confirmed, reservationStart: newStart, now: dueInstant })).toEqual({
      eligible: false,
      reason: "RESCHEDULED_OUT_OF_WINDOW",
    });
  });

  it("still eligible within the staleness tolerance — a slow worker is not treated as staleness", () => {
    const slightlyLate = new Date(dueInstant.getTime() + REMINDER_STALENESS_TOLERANCE_MS - 1);
    expect(isReminderStillEligible({ reservationStatus: ReservationStatus.Confirmed, reservationStart: start, now: slightlyLate }).eligible).toBe(true);
  });
});

describe("retry backoff — assignment §19", () => {
  it("RETRY_BACKOFF_MS is a small, positive, monotonically increasing schedule", () => {
    expect(RETRY_BACKOFF_MS.length).toBeGreaterThan(0);
    for (let i = 1; i < RETRY_BACKOFF_MS.length; i += 1) {
      expect(RETRY_BACKOFF_MS[i]).toBeGreaterThan(RETRY_BACKOFF_MS[i - 1]!);
    }
  });

  it("MAX_ATTEMPTS accounts for the initial attempt plus every backoff step", () => {
    expect(MAX_ATTEMPTS).toBe(RETRY_BACKOFF_MS.length + 1);
  });

  it("computeNextRetryAvailableAt returns an increasing instant for each successive attempt", () => {
    const now = new Date("2026-08-20T10:00:00Z");
    const first = computeNextRetryAvailableAt(1, now);
    const second = computeNextRetryAvailableAt(2, now);
    expect(first).not.toBeNull();
    expect(second).not.toBeNull();
    expect(second!.getTime()).toBeGreaterThan(first!.getTime());
  });

  it("returns null once attempts are exhausted — the caller must mark FailedPermanent, never retry forever", () => {
    const now = new Date("2026-08-20T10:00:00Z");
    expect(computeNextRetryAvailableAt(RETRY_BACKOFF_MS.length + 1, now)).toBeNull();
  });
});
