import { describe, it, expect } from "vitest";
import { evaluateBookingPolicy } from "../../domain/availability/BookingPolicy.js";

const GUEST = false;
const STAFF = true;

describe("evaluateBookingPolicy — party size routing (self-service, non-staff)", () => {
  it.each([1, 4, 8])("allows self-service party size %i", (partySize) => {
    const result = evaluateBookingPolicy({
      partySize,
      requestedStart: new Date("2026-08-25T18:00:00Z"),
      now: new Date("2026-08-20T10:00:00Z"),
      isStaffActor: GUEST,
    });
    expect(result.type).toBe("ALLOWED");
  });

  it.each([0, -1, 9, 20])("routes party size %i to staff", (partySize) => {
    const result = evaluateBookingPolicy({
      partySize,
      requestedStart: new Date("2026-08-25T18:00:00Z"),
      now: new Date("2026-08-20T10:00:00Z"),
      isStaffActor: GUEST,
    });
    expect(result.type).toBe("ROUTE_TO_STAFF");
  });

  it("does not route staff actors regardless of party size", () => {
    const result = evaluateBookingPolicy({
      partySize: 20,
      requestedStart: new Date("2026-08-25T18:00:00Z"),
      now: new Date("2026-08-20T10:00:00Z"),
      isStaffActor: STAFF,
    });
    expect(result.type).toBe("ALLOWED");
  });
});

describe("evaluateBookingPolicy — same-day self-service cutoff (17:00 Europe/Amsterdam)", () => {
  it("allows a same-day booking requested before 17:00 local", () => {
    // now = 2026-08-20T14:30:00Z = 16:30 CEST, requested later same local day
    const result = evaluateBookingPolicy({
      partySize: 2,
      requestedStart: new Date("2026-08-20T18:00:00Z"),
      now: new Date("2026-08-20T14:30:00Z"),
      isStaffActor: GUEST,
    });
    expect(result.type).toBe("ALLOWED");
  });

  it("rejects a same-day booking requested at exactly 17:00 local", () => {
    // now = 2026-08-20T15:00:00Z = 17:00 CEST exactly
    const result = evaluateBookingPolicy({
      partySize: 2,
      requestedStart: new Date("2026-08-20T19:00:00Z"),
      now: new Date("2026-08-20T15:00:00Z"),
      isStaffActor: GUEST,
    });
    expect(result.type).toBe("REJECTED_CUTOFF");
  });

  it("rejects a same-day booking requested after 17:00 local", () => {
    // now = 2026-08-20T20:00:00Z = 22:00 CEST
    const result = evaluateBookingPolicy({
      partySize: 2,
      requestedStart: new Date("2026-08-20T20:30:00Z"),
      now: new Date("2026-08-20T20:00:00Z"),
      isStaffActor: GUEST,
    });
    expect(result.type).toBe("REJECTED_CUTOFF");
  });

  it("does not apply the cutoff to a future-day booking made after 17:00 local today", () => {
    // now = 2026-08-20T20:00:00Z = 22:00 CEST, but requested date is tomorrow.
    const result = evaluateBookingPolicy({
      partySize: 2,
      requestedStart: new Date("2026-08-21T18:00:00Z"),
      now: new Date("2026-08-20T20:00:00Z"),
      isStaffActor: GUEST,
    });
    expect(result.type).toBe("ALLOWED");
  });

  it("exempts staff from the same-day cutoff", () => {
    const result = evaluateBookingPolicy({
      partySize: 2,
      requestedStart: new Date("2026-08-20T20:30:00Z"),
      now: new Date("2026-08-20T20:00:00Z"),
      isStaffActor: STAFF,
    });
    expect(result.type).toBe("ALLOWED");
  });

  it("evaluates the cutoff using the LOCAL calendar date, not the UTC calendar date (near-midnight CEST boundary)", () => {
    // 2026-08-20T23:30:00Z = 2026-08-21T01:30 CEST — local date is already
    // the 21st even though UTC is still the 20th. A same-day request for
    // local 2026-08-21 at a late local hour must NOT be cutoff-rejected
    // just because the UTC calendar date still reads the 20th.
    const now = new Date("2026-08-20T23:30:00Z"); // local: 2026-08-21 01:30
    const requestedStart = new Date("2026-08-21T10:00:00Z"); // local: 2026-08-21 12:00
    const result = evaluateBookingPolicy({ partySize: 2, requestedStart, now, isStaffActor: GUEST });
    expect(result.type).toBe("ALLOWED");
  });
});
