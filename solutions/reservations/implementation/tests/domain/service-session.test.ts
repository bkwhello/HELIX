import { describe, it, expect } from "vitest";
import { isValidServiceSessionTransition, ServiceSessionStatus } from "../../domain/availability/ServiceSession.js";

/**
 * R1.6-P2C-1 — the four authorized transitions, and nothing else. Every
 * OTHER (from, to) pair, including every reverse and cross-state
 * combination, must be invalid. Idempotent-repeat handling (from === to)
 * is deliberately NOT this function's concern — see
 * ServiceSessionService.transition's own doc comment.
 */
const ALL_STATUSES: readonly ServiceSessionStatus[] = ["Created", "Opened", "Closed", "Cancelled"];

describe("isValidServiceSessionTransition", () => {
  it("Created -> Opened is valid", () => {
    expect(isValidServiceSessionTransition("Created", "Opened")).toBe(true);
  });
  it("Opened -> Closed is valid", () => {
    expect(isValidServiceSessionTransition("Opened", "Closed")).toBe(true);
  });
  it("Created -> Cancelled is valid", () => {
    expect(isValidServiceSessionTransition("Created", "Cancelled")).toBe(true);
  });

  it("every other (from, to) pair is invalid, including all reverse and cross-state transitions", () => {
    const validPairs = new Set(["Created->Opened", "Opened->Closed", "Created->Cancelled"]);
    for (const from of ALL_STATUSES) {
      for (const to of ALL_STATUSES) {
        const key = `${from}->${to}`;
        const expected = validPairs.has(key);
        expect(isValidServiceSessionTransition(from, to)).toBe(expected);
      }
    }
  });

  it("Closed and Cancelled are both terminal — no transition out of either", () => {
    for (const to of ALL_STATUSES) {
      expect(isValidServiceSessionTransition("Closed", to)).toBe(false);
      expect(isValidServiceSessionTransition("Cancelled", to)).toBe(false);
    }
  });

  it("reverse transitions are all invalid", () => {
    expect(isValidServiceSessionTransition("Opened", "Created")).toBe(false);
    expect(isValidServiceSessionTransition("Closed", "Opened")).toBe(false);
    expect(isValidServiceSessionTransition("Cancelled", "Created")).toBe(false);
  });

  it("Opened -> Cancelled is invalid — Cancelled is reachable only from Created", () => {
    expect(isValidServiceSessionTransition("Opened", "Cancelled")).toBe(false);
  });
});
