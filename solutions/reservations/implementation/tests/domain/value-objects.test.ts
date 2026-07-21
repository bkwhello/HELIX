import { describe, it, expect } from "vitest";
import { PartySize } from "../../domain/value-objects/PartySize.js";
import { ReservationDateTime } from "../../domain/value-objects/ReservationDateTime.js";
import { ReservationId } from "../../domain/value-objects/ReservationId.js";

// CAP-D01.01-AC03 — Reject Invalid Party Size
describe("PartySize (CAP-D01.01-R09, AC03)", () => {
  it.each([0, -1, 1.5, NaN])("rejects %s", (value) => {
    const result = PartySize.create(value as number);
    expect(result.ok).toBe(false);
  });

  it("rejects non-numeric input", () => {
    const result = PartySize.create(Number("not-a-number"));
    expect(result.ok).toBe(false);
  });

  it("accepts a positive whole number", () => {
    const result = PartySize.create(4);
    expect(result.ok).toBe(true);
  });
});

describe("ReservationDateTime (CAP-D01.01-R10)", () => {
  it("rejects an invalid date", () => {
    const result = ReservationDateTime.create(new Date("not-a-date"));
    expect(result.ok).toBe(false);
  });

  it("accepts a valid date", () => {
    const result = ReservationDateTime.create(new Date("2026-08-01T19:00:00Z"));
    expect(result.ok).toBe(true);
  });
});

// CAP-D01.01-R01 — Reservation Identity Is Required
describe("ReservationId (CAP-D01.01-R01)", () => {
  it("rejects an empty identity", () => {
    expect(ReservationId.create("").ok).toBe(false);
    expect(ReservationId.create("   ").ok).toBe(false);
  });

  it("accepts a non-empty identity", () => {
    expect(ReservationId.create("res-123").ok).toBe(true);
  });
});
