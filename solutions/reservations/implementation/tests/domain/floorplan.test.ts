import { describe, it, expect } from "vitest";
import { isValidFloorplanVersionTransition, FloorplanVersionStatus } from "../../domain/floor/Floorplan.js";

/**
 * R1.5-P2B — the two authorized transitions (Draft -> Published,
 * Published -> Archived) and nothing else. Idempotent-repeat handling
 * (from === to) is deliberately NOT this function's concern — see
 * FloorplanService's own transition methods' doc comments, mirroring
 * ServiceSession's identical split.
 */
const ALL_STATUSES: readonly FloorplanVersionStatus[] = ["Draft", "Published", "Archived"];

describe("isValidFloorplanVersionTransition", () => {
  it("Draft -> Published is valid", () => {
    expect(isValidFloorplanVersionTransition("Draft", "Published")).toBe(true);
  });
  it("Published -> Archived is valid", () => {
    expect(isValidFloorplanVersionTransition("Published", "Archived")).toBe(true);
  });

  it("every other (from, to) pair is invalid, including all reverse and cross-state transitions", () => {
    const validPairs = new Set(["Draft->Published", "Published->Archived"]);
    for (const from of ALL_STATUSES) {
      for (const to of ALL_STATUSES) {
        const key = `${from}->${to}`;
        expect(isValidFloorplanVersionTransition(from, to)).toBe(validPairs.has(key));
      }
    }
  });

  it("Archived is terminal — no transition out of it", () => {
    for (const to of ALL_STATUSES) {
      expect(isValidFloorplanVersionTransition("Archived", to)).toBe(false);
    }
  });

  it("reverse transitions are invalid", () => {
    expect(isValidFloorplanVersionTransition("Published", "Draft")).toBe(false);
    expect(isValidFloorplanVersionTransition("Archived", "Published")).toBe(false);
  });

  it("Draft -> Archived is invalid — Archived is reachable only from Published", () => {
    expect(isValidFloorplanVersionTransition("Draft", "Archived")).toBe(false);
  });
});
