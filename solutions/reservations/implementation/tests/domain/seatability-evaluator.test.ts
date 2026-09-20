import { describe, it, expect } from "vitest";
import { evaluateSeatability, SeatabilityCandidate } from "../../domain/floor/SeatabilityEvaluator.js";

function candidate(overrides: Partial<SeatabilityCandidate> = {}): SeatabilityCandidate {
  return {
    resourceId: "res-1",
    resourceLabel: "Table 1",
    resourceKind: "Table",
    found: true,
    active: true,
    areaId: "Sushi",
    capacity: 4,
    supportsRequestedClaimKind: true,
    blockedForInterval: false,
    overlappingActiveAssignment: false,
    withinFloorplanMembership: true,
    ...overrides,
  };
}

/**
 * CAP-D04.01 — pure algorithm test suite, mirroring
 * AvailabilityEvaluator.test.ts's own "no database" posture (final
 * architecture §11: CanSeat is a separate, independently-testable
 * mechanism from CanAccept).
 */
describe("SeatabilityEvaluator — happy path", () => {
  it("SEATABLE when a single candidate is found, active, matching area/kind, unblocked, non-overlapping, and sufficient capacity", () => {
    const result = evaluateSeatability({ requestedAreaId: "Sushi", requestedPartySize: 4, candidates: [candidate()] });
    expect(result.type).toBe("SEATABLE");
  });

  it("SEATABLE when multiple candidates' capacities sum to at least the requested party size (combined tables / multi-seat)", () => {
    const result = evaluateSeatability({
      requestedAreaId: "Sushi",
      requestedPartySize: 6,
      candidates: [candidate({ resourceId: "t2", capacity: 4 }), candidate({ resourceId: "t5", capacity: 2 })],
    });
    expect(result.type).toBe("SEATABLE");
  });
});

describe("SeatabilityEvaluator — validation", () => {
  it("INVALID_REQUEST for a non-positive party size", () => {
    const result = evaluateSeatability({ requestedAreaId: "Sushi", requestedPartySize: 0, candidates: [candidate()] });
    expect(result.type).toBe("INVALID_REQUEST");
  });

  it("INVALID_REQUEST when no candidates are selected", () => {
    const result = evaluateSeatability({ requestedAreaId: "Sushi", requestedPartySize: 2, candidates: [] });
    expect(result.type).toBe("INVALID_REQUEST");
  });
});

describe("SeatabilityEvaluator — failure classification", () => {
  it("RESOURCE_NOT_FOUND", () => {
    const result = evaluateSeatability({ requestedAreaId: "Sushi", requestedPartySize: 2, candidates: [candidate({ found: false })] });
    expect(result.type).toBe("RESOURCE_NOT_FOUND");
  });

  it("RESOURCE_INACTIVE", () => {
    const result = evaluateSeatability({ requestedAreaId: "Sushi", requestedPartySize: 2, candidates: [candidate({ active: false })] });
    expect(result.type).toBe("RESOURCE_INACTIVE");
  });

  it("RESOURCE_AREA_MISMATCH when the candidate's area differs from the requested area", () => {
    const result = evaluateSeatability({ requestedAreaId: "Teppanyaki", requestedPartySize: 2, candidates: [candidate({ areaId: "Sushi" })] });
    expect(result.type).toBe("RESOURCE_AREA_MISMATCH");
  });

  it("RESOURCE_TYPE_MISMATCH — a whole-table claim against a shared-seating table", () => {
    const result = evaluateSeatability({
      requestedAreaId: "Teppanyaki",
      requestedPartySize: 2,
      candidates: [candidate({ resourceKind: "Table", areaId: "Teppanyaki", supportsRequestedClaimKind: false })],
    });
    expect(result.type).toBe("RESOURCE_TYPE_MISMATCH");
  });

  it("RESOURCE_TYPE_MISMATCH — a seat-level claim against a non-shared-seating table", () => {
    const result = evaluateSeatability({
      requestedAreaId: "Sushi",
      requestedPartySize: 1,
      candidates: [candidate({ resourceKind: "Seat", areaId: "Sushi", supportsRequestedClaimKind: false })],
    });
    expect(result.type).toBe("RESOURCE_TYPE_MISMATCH");
  });

  it("RESOURCE_BLOCKED", () => {
    const result = evaluateSeatability({ requestedAreaId: "Sushi", requestedPartySize: 2, candidates: [candidate({ blockedForInterval: true })] });
    expect(result.type).toBe("RESOURCE_BLOCKED");
  });

  it("RESOURCE_OVERLAP", () => {
    const result = evaluateSeatability({ requestedAreaId: "Sushi", requestedPartySize: 2, candidates: [candidate({ overlappingActiveAssignment: true })] });
    expect(result.type).toBe("RESOURCE_OVERLAP");
  });

  it("INSUFFICIENT_CAPACITY when the selected resources' total capacity is below the requested party size", () => {
    const result = evaluateSeatability({ requestedAreaId: "Sushi", requestedPartySize: 8, candidates: [candidate({ capacity: 4 })] });
    expect(result.type).toBe("INSUFFICIENT_CAPACITY");
    if (result.type === "INSUFFICIENT_CAPACITY") {
      expect(result.requested).toBe(8);
      expect(result.selectedCapacity).toBe(4);
    }
  });

  it("checks each candidate in order and returns the FIRST failure, not a summary of all failures", () => {
    const result = evaluateSeatability({
      requestedAreaId: "Sushi",
      requestedPartySize: 2,
      candidates: [candidate({ resourceId: "bad-1", found: false }), candidate({ resourceId: "bad-2", active: false })],
    });
    expect(result.type).toBe("RESOURCE_NOT_FOUND");
    if (result.type === "RESOURCE_NOT_FOUND") expect(result.resourceLabel).toBe("Table 1");
  });

  it("RESOURCE_OUTSIDE_FLOORPLAN_MEMBERSHIP — checked after block/overlap, before capacity", () => {
    const result = evaluateSeatability({
      requestedAreaId: "Sushi",
      requestedPartySize: 2,
      candidates: [candidate({ withinFloorplanMembership: false })],
    });
    expect(result.type).toBe("RESOURCE_OUTSIDE_FLOORPLAN_MEMBERSHIP");
  });

  it("a Seat candidate carries its OWN withinFloorplanMembership flag (the caller resolves it via the parent Table, not this function)", () => {
    const result = evaluateSeatability({
      requestedAreaId: "Teppanyaki",
      requestedPartySize: 1,
      candidates: [candidate({ resourceKind: "Seat", areaId: "Teppanyaki", capacity: 1, withinFloorplanMembership: false })],
    });
    expect(result.type).toBe("RESOURCE_OUTSIDE_FLOORPLAN_MEMBERSHIP");
  });

  it("mixed selection: one member, one non-member — fails atomically on the first non-member candidate encountered", () => {
    const result = evaluateSeatability({
      requestedAreaId: "Sushi",
      requestedPartySize: 4,
      candidates: [
        candidate({ resourceId: "t1", withinFloorplanMembership: true }),
        candidate({ resourceId: "t2", withinFloorplanMembership: false }),
      ],
    });
    expect(result.type).toBe("RESOURCE_OUTSIDE_FLOORPLAN_MEMBERSHIP");
    if (result.type === "RESOURCE_OUTSIDE_FLOORPLAN_MEMBERSHIP") expect(result.resourceLabel).toBe("Table 1");
  });

  it("withinFloorplanMembership: true for every candidate (membership not enforced) never triggers the new outcome", () => {
    const result = evaluateSeatability({ requestedAreaId: "Sushi", requestedPartySize: 4, candidates: [candidate()] });
    expect(result.type).toBe("SEATABLE");
  });
});
