import { describe, it, expect } from "vitest";
import { deriveServiceCode, isServiceCode } from "../../domain/availability/Service.js";

/**
 * R1.6-P2B — the canonical, server-authoritative Service-code boundary:
 * [12:00, 16:00) Europe/Amsterdam local -> "lunch", otherwise -> "dinner".
 * Mirrors public/pilot.html's own already-shipped client-side boundary
 * exactly. Derivation must use the established Intl-based
 * Europe/Amsterdam conversion (ServiceTime.ts), never the machine's
 * local timezone — every instant below is chosen so a naive
 * machine-local-time or fixed-UTC-offset implementation would disagree
 * with at least one assertion.
 */
describe("isServiceCode", () => {
  it("accepts exactly the two canonical lowercase codes", () => {
    expect(isServiceCode("lunch")).toBe(true);
    expect(isServiceCode("dinner")).toBe(true);
  });

  it("rejects anything else, including wrong casing and legacy/arbitrary values", () => {
    expect(isServiceCode("Lunch")).toBe(false);
    expect(isServiceCode("DINNER")).toBe(false);
    expect(isServiceCode("brunch")).toBe(false);
    expect(isServiceCode("sp-dinner")).toBe(false);
    expect(isServiceCode("walk-in")).toBe(false);
    expect(isServiceCode("")).toBe(false);
  });
});

describe("deriveServiceCode — Europe/Amsterdam local-time boundary", () => {
  describe("winter (CET, UTC+1) — 2026-01-15", () => {
    it("11:00 UTC == 12:00 local -> lunch (inclusive start)", () => {
      expect(deriveServiceCode(new Date("2026-01-15T11:00:00Z"))).toBe("lunch");
    });
    it("14:59 UTC == 15:59 local -> lunch (just before the boundary)", () => {
      expect(deriveServiceCode(new Date("2026-01-15T14:59:00Z"))).toBe("lunch");
    });
    it("15:00 UTC == 16:00 local -> dinner (exclusive boundary)", () => {
      expect(deriveServiceCode(new Date("2026-01-15T15:00:00Z"))).toBe("dinner");
    });
    it("10:59 UTC == 11:59 local -> dinner (just before lunch starts)", () => {
      expect(deriveServiceCode(new Date("2026-01-15T10:59:00Z"))).toBe("dinner");
    });
  });

  describe("summer (CEST, UTC+2) — 2026-07-15", () => {
    it("10:00 UTC == 12:00 local -> lunch (inclusive start)", () => {
      expect(deriveServiceCode(new Date("2026-07-15T10:00:00Z"))).toBe("lunch");
    });
    it("13:59 UTC == 15:59 local -> lunch (just before the boundary)", () => {
      expect(deriveServiceCode(new Date("2026-07-15T13:59:00Z"))).toBe("lunch");
    });
    it("14:00 UTC == 16:00 local -> dinner (exclusive boundary)", () => {
      expect(deriveServiceCode(new Date("2026-07-15T14:00:00Z"))).toBe("dinner");
    });
    it("09:59 UTC == 11:59 local -> dinner (just before lunch starts)", () => {
      expect(deriveServiceCode(new Date("2026-07-15T09:59:00Z"))).toBe("dinner");
    });
  });

  describe("DST transition — the identical UTC clock time on either side of the 2026 spring-forward instant (2026-03-29T01:00:00Z)", () => {
    it("2026-03-28T14:00:00Z (still CET, UTC+1) == 15:00 local -> lunch", () => {
      expect(deriveServiceCode(new Date("2026-03-28T14:00:00Z"))).toBe("lunch");
    });
    it("2026-03-29T14:00:00Z (now CEST, UTC+2, after the transition) == 16:00 local -> dinner", () => {
      // A naive fixed +01:00 offset would wrongly say 15:00 local -> "lunch" here.
      expect(deriveServiceCode(new Date("2026-03-29T14:00:00Z"))).toBe("dinner");
    });
  });

  describe("DST transition — the identical UTC clock time on either side of the 2026 fall-back instant (2026-10-25T01:00:00Z)", () => {
    it("2026-10-24T14:00:00Z (still CEST, UTC+2) == 16:00 local -> dinner", () => {
      expect(deriveServiceCode(new Date("2026-10-24T14:00:00Z"))).toBe("dinner");
    });
    it("2026-10-25T14:00:00Z (now CET, UTC+1, after the transition) == 15:00 local -> lunch", () => {
      // A naive fixed +02:00 offset would wrongly say 16:00 local -> "dinner" here.
      expect(deriveServiceCode(new Date("2026-10-25T14:00:00Z"))).toBe("lunch");
    });
  });
});
