import { describe, it, expect } from "vitest";
import { evaluateSimultaneousOccupancy, intervalsOverlap } from "../../domain/availability/AvailabilityEvaluator.js";
import { CommitmentInterval } from "../../domain/availability/CapacityCommitment.js";
import { CAPACITY_POOLS } from "../../domain/availability/CapacityPool.js";

function iv(id: string, startIso: string, endIso: string, partySize: number): CommitmentInterval {
  return { commitmentId: id, startTime: new Date(startIso), endTime: new Date(endIso), partySize };
}

/**
 * CAP-D02.03 — Pure algorithm test suite (HELIX ENGINEERING IMPLEMENTATION
 * ASSIGNMENT §23). Runs with no database — this is the suite that would
 * have caught the original P0 defect (naive overlap-sum) before it ever
 * reached a concurrency test.
 */
describe("AvailabilityEvaluator — mandatory false-sold-out regression (§9)", () => {
  it("does NOT sum A(29) + B(29) + C(20) = 78; correctly finds max simultaneous occupancy = 29, so C is AVAILABLE at the reconciled Sushi capacity (51, R1.5 — was 60 at R1.1 time, briefly 47 then 49 during R1.5's own reconciliation passes)", () => {
    const candidates = [iv("A", "2026-08-20T18:00:00Z", "2026-08-20T18:30:00Z", 29), iv("B", "2026-08-20T19:00:00Z", "2026-08-20T19:30:00Z", 29)];

    const result = evaluateSimultaneousOccupancy({
      requestedStart: new Date("2026-08-20T18:15:00Z"),
      requestedDurationMinutes: 60, // 18:15–19:15
      candidates,
    });

    expect(result.maxExistingOccupancy).toBe(29);
    expect(result.maxExistingOccupancy + 20).toBeLessThanOrEqual(CAPACITY_POOLS.Sushi.maximumCapacity);

    // Explicitly assert the naive, rejected algorithm's answer is NOT what this returns.
    const naiveSum = 29 + 29 + 20;
    expect(result.maxExistingOccupancy + 20).not.toBe(naiveSum);
  });

  it("matches the exact per-slice occupancy trace from the architecture decision", () => {
    const candidates = [iv("A", "2026-08-20T18:00:00Z", "2026-08-20T18:30:00Z", 29), iv("B", "2026-08-20T19:00:00Z", "2026-08-20T19:30:00Z", 29)];

    const { slices } = evaluateSimultaneousOccupancy({
      requestedStart: new Date("2026-08-20T18:15:00Z"),
      requestedDurationMinutes: 60,
      candidates,
    });

    expect(slices).toHaveLength(4);
    expect(slices[0]!.occupancy).toBe(29); // 18:15–18:30 → A
    expect(slices[1]!.occupancy).toBe(0); // 18:30–18:45 → neither
    expect(slices[2]!.occupancy).toBe(0); // 18:45–19:00 → neither
    expect(slices[3]!.occupancy).toBe(29); // 19:00–19:15 → B
  });
});

describe("AvailabilityEvaluator — Scenario B: actual overcapacity", () => {
  it("rejects when true simultaneous occupancy exceeds capacity", () => {
    const candidates = [iv("A", "2026-08-20T18:00:00Z", "2026-08-20T19:30:00Z", 40)];

    const result = evaluateSimultaneousOccupancy({
      requestedStart: new Date("2026-08-20T18:30:00Z"),
      requestedDurationMinutes: 90, // 18:30–20:00
      candidates,
    });

    expect(result.maxExistingOccupancy).toBe(40);
    expect(result.maxExistingOccupancy + 21).toBeGreaterThan(CAPACITY_POOLS.Sushi.maximumCapacity);
  });
});

describe("AvailabilityEvaluator — Scenario C/D: exact capacity boundary", () => {
  it("accepts at exactly capacity (43 existing + 8 requested = 51, the reconciled Sushi capacity — R1.5, was 60 at R1.1 time, briefly 47 then 49 during R1.5's own reconciliation passes)", () => {
    const candidates = [iv("X", "2026-08-20T18:00:00Z", "2026-08-20T19:30:00Z", 43)];
    const result = evaluateSimultaneousOccupancy({
      requestedStart: new Date("2026-08-20T18:00:00Z"),
      requestedDurationMinutes: 90,
      candidates,
    });
    expect(result.maxExistingOccupancy + 8).toBe(CAPACITY_POOLS.Sushi.maximumCapacity);
    expect(result.maxExistingOccupancy + 8).toBeLessThanOrEqual(CAPACITY_POOLS.Sushi.maximumCapacity);
  });

  it("rejects at capacity + 1 (44 existing + 8 requested = 52)", () => {
    const candidates = [iv("X", "2026-08-20T18:00:00Z", "2026-08-20T19:30:00Z", 44)];
    const result = evaluateSimultaneousOccupancy({
      requestedStart: new Date("2026-08-20T18:00:00Z"),
      requestedDurationMinutes: 90,
      candidates,
    });
    expect(result.maxExistingOccupancy + 8).toBe(52);
    expect(result.maxExistingOccupancy + 8).toBeGreaterThan(CAPACITY_POOLS.Sushi.maximumCapacity);
  });
});

describe("AvailabilityEvaluator — Scenario E: back-to-back reservations do not overlap", () => {
  it("[18:00,19:30) and [19:30,21:00) never contribute to each other's occupancy", () => {
    expect(intervalsOverlap(new Date("2026-08-20T18:00:00Z"), new Date("2026-08-20T19:30:00Z"), new Date("2026-08-20T19:30:00Z"), new Date("2026-08-20T21:00:00Z"))).toBe(
      false
    );

    const candidates = [iv("A", "2026-08-20T18:00:00Z", "2026-08-20T19:30:00Z", CAPACITY_POOLS.Sushi.maximumCapacity)]; // full capacity
    const result = evaluateSimultaneousOccupancy({
      requestedStart: new Date("2026-08-20T19:30:00Z"),
      requestedDurationMinutes: 90, // Sushi duration
      candidates,
    });
    // A occupies capacity fully in its own interval, but B starting exactly at A's end sees zero occupancy from A.
    expect(result.maxExistingOccupancy).toBe(0);
  });
});

describe("AvailabilityEvaluator — Scenario F: partial overlap (constructed)", () => {
  it("counts a commitment only in the slices it actually overlaps, not the whole requested interval", () => {
    // D: 18:45–19:15, 15 guests. Requested E: 18:00–19:00 (4 slices). D overlaps only the last slice.
    const candidates = [iv("D", "2026-08-20T18:45:00Z", "2026-08-20T19:15:00Z", 15)];

    const { slices, maxExistingOccupancy } = evaluateSimultaneousOccupancy({
      requestedStart: new Date("2026-08-20T18:00:00Z"),
      requestedDurationMinutes: 60,
      candidates,
    });

    expect(slices).toHaveLength(4);
    expect(slices[0]!.occupancy).toBe(0); // 18:00–18:15
    expect(slices[1]!.occupancy).toBe(0); // 18:15–18:30
    expect(slices[2]!.occupancy).toBe(0); // 18:30–18:45
    expect(slices[3]!.occupancy).toBe(15); // 18:45–19:00 — D overlaps only here
    expect(maxExistingOccupancy).toBe(15);
  });

  it("uses a general overlap test, not 'fully contains' — a slice-straddling commitment still contributes its full partySize to any slice it touches", () => {
    // A commitment that starts mid-slice (not grid-aligned) — defensive/safety test for AC-26:
    // must NOT be silently excluded (which would risk under-counting and permitting overbooking).
    const candidates = [iv("X", "2026-08-20T18:05:00Z", "2026-08-20T18:50:00Z", 30)];
    const { slices } = evaluateSimultaneousOccupancy({
      requestedStart: new Date("2026-08-20T18:00:00Z"),
      requestedDurationMinutes: 60,
      candidates,
    });
    // X = [18:05,18:50) overlaps every one of the four 15-minute slices in
    // [18:00,19:00) — including the last, [18:45,19:00), since X ends at
    // 18:50, strictly after that slice's start. A "fully contains" test
    // would have excluded slices 0 and 3; the general overlap test counts
    // X in all four, which is the conservative (never permissive) result.
    expect(slices[0]!.occupancy).toBe(30);
    expect(slices[1]!.occupancy).toBe(30);
    expect(slices[2]!.occupancy).toBe(30);
    expect(slices[3]!.occupancy).toBe(30);
  });
});

describe("AvailabilityEvaluator — self-exclusion (Modify, §7)", () => {
  it("excludes only the commitment matching excludeCommitmentId, by commitmentId not reservationId", () => {
    const candidates = [iv("commitment-old", "2026-08-20T18:00:00Z", "2026-08-20T19:30:00Z", 8), iv("commitment-other", "2026-08-20T18:00:00Z", "2026-08-20T19:30:00Z", 10)];

    const result = evaluateSimultaneousOccupancy({
      requestedStart: new Date("2026-08-20T18:00:00Z"),
      requestedDurationMinutes: 90,
      candidates,
      excludeCommitmentId: "commitment-old",
    });

    // Only "commitment-other" (10) should count; "commitment-old" (8) is excluded.
    expect(result.maxExistingOccupancy).toBe(10);
  });
});

describe("AvailabilityEvaluator — input validation", () => {
  it("rejects a non-multiple-of-15 duration defensively", () => {
    expect(() =>
      evaluateSimultaneousOccupancy({
        requestedStart: new Date("2026-08-20T18:00:00Z"),
        requestedDurationMinutes: 47,
        candidates: [],
      })
    ).toThrow();
  });
});
