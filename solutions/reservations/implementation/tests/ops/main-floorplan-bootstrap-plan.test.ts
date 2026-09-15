import { describe, it, expect } from "vitest";
import { ALL_TABLES, seatId } from "../../infrastructure/floor/floorSeedData.js";
import {
  planMainFloorplanBootstrap,
  EXPECTED_TABLE_IDS,
  MAIN_FLOOR_ID,
  MAIN_FLOOR_NAME,
  MAIN_FLOOR_VERSION_ID,
  MAIN_FLOOR_REVISION,
  type TableSnapshot,
  type SeatSnapshot,
} from "../../ops/floor/mainFloorplanBootstrapPlan.js";

/**
 * R1.5-P2B-B — pure decision-logic tests for the Main Floor bootstrap.
 * Deliberately no database connection anywhere in this file: every
 * scenario (missing Table, inactive Table, unexpected active Table, every
 * material drift field) is proven against fabricated in-memory data, never
 * by mutating the real, shared `tables`/`seats` rows other concurrently-
 * running test files also depend on.
 */

function validTables(): TableSnapshot[] {
  return ALL_TABLES.map((t) => ({ id: t.id, status: "Active" }));
}

function validSeats(): SeatSnapshot[] {
  const seats: SeatSnapshot[] = [];
  for (const table of ALL_TABLES) {
    for (const suffix of table.seats ?? []) {
      seats.push({ id: seatId(table.id, suffix), tableId: table.id });
    }
  }
  return seats;
}

const validExistingFloorplan = { name: MAIN_FLOOR_NAME, defaultVersionId: MAIN_FLOOR_VERSION_ID };
const validExistingVersion = { floorplanId: MAIN_FLOOR_ID, revision: MAIN_FLOOR_REVISION, status: "Published" };

describe("planMainFloorplanBootstrap — inventory verification", () => {
  it("exactly the canonical 23 Active Tables and 40 correctly-parented Seats, no existing bootstrap → CREATE", () => {
    const plan = planMainFloorplanBootstrap({
      tables: validTables(),
      seats: validSeats(),
      existingFloorplan: null,
      existingVersion: null,
      existingMemberTableIds: null,
    });
    expect(plan).toEqual({ action: "CREATE" });
  });

  it("EXPECTED_TABLE_IDS is exactly the 23 canonical Table ids, sorted", () => {
    expect(EXPECTED_TABLE_IDS).toHaveLength(23);
    expect([...EXPECTED_TABLE_IDS]).toEqual([...EXPECTED_TABLE_IDS].sort());
    expect(new Set(EXPECTED_TABLE_IDS).size).toBe(23);
  });

  it("a missing canonical Table rejects with REJECT_INVENTORY, zero writes possible", () => {
    const tables = validTables().filter((t) => t.id !== "sushi-table-7");
    const plan = planMainFloorplanBootstrap({ tables, seats: validSeats(), existingFloorplan: null, existingVersion: null, existingMemberTableIds: null });
    expect(plan.action).toBe("REJECT_INVENTORY");
    if (plan.action !== "REJECT_INVENTORY") throw new Error("unreachable");
    expect(plan.reason).toContain("sushi-table-7");
  });

  it("an inactive canonical Table rejects with REJECT_INVENTORY", () => {
    const tables = validTables().map((t) => (t.id === "teppanyaki-c" ? { ...t, status: "Inactive" } : t));
    const plan = planMainFloorplanBootstrap({ tables, seats: validSeats(), existingFloorplan: null, existingVersion: null, existingMemberTableIds: null });
    expect(plan.action).toBe("REJECT_INVENTORY");
    if (plan.action !== "REJECT_INVENTORY") throw new Error("unreachable");
    expect(plan.reason).toContain("teppanyaki-c");
    expect(plan.reason).toContain("not Active");
  });

  it("an unexpected extra active Table (not in the canonical 23) rejects with REJECT_INVENTORY", () => {
    const tables = [...validTables(), { id: "future-extra-table", status: "Active" }];
    const plan = planMainFloorplanBootstrap({ tables, seats: validSeats(), existingFloorplan: null, existingVersion: null, existingMemberTableIds: null });
    expect(plan.action).toBe("REJECT_INVENTORY");
    if (plan.action !== "REJECT_INVENTORY") throw new Error("unreachable");
    expect(plan.reason).toContain("future-extra-table");
  });

  it("an unexpected INACTIVE extra Table does NOT reject (only active extras make the snapshot incomplete)", () => {
    const tables = [...validTables(), { id: "future-extra-table", status: "Inactive" }];
    const plan = planMainFloorplanBootstrap({ tables, seats: validSeats(), existingFloorplan: null, existingVersion: null, existingMemberTableIds: null });
    expect(plan.action).toBe("CREATE");
  });

  it("a missing/mismatched Seat rejects with REJECT_INVENTORY", () => {
    const seats = validSeats().filter((s) => s.id !== "teppanyaki-d-seat-03");
    const plan = planMainFloorplanBootstrap({ tables: validTables(), seats, existingFloorplan: null, existingVersion: null, existingMemberTableIds: null });
    expect(plan.action).toBe("REJECT_INVENTORY");
    if (plan.action !== "REJECT_INVENTORY") throw new Error("unreachable");
    expect(plan.reason).toContain("teppanyaki-d-seat-03");
  });

  it("a Seat whose parent Table does not match rejects with REJECT_INVENTORY", () => {
    const seats = validSeats().map((s) => (s.id === "teppanyaki-e-seat-01" ? { ...s, tableId: "teppanyaki-f" } : s));
    const plan = planMainFloorplanBootstrap({ tables: validTables(), seats, existingFloorplan: null, existingVersion: null, existingMemberTableIds: null });
    expect(plan.action).toBe("REJECT_INVENTORY");
  });
});

describe("planMainFloorplanBootstrap — rerun / drift detection", () => {
  it("an existing bootstrap matching every material field exactly → NOOP", () => {
    const plan = planMainFloorplanBootstrap({
      tables: validTables(),
      seats: validSeats(),
      existingFloorplan: validExistingFloorplan,
      existingVersion: validExistingVersion,
      existingMemberTableIds: [...EXPECTED_TABLE_IDS],
    });
    expect(plan).toEqual({ action: "NOOP" });
  });

  it("existing membership set order does not matter for NOOP (compared as a set)", () => {
    const plan = planMainFloorplanBootstrap({
      tables: validTables(),
      seats: validSeats(),
      existingFloorplan: validExistingFloorplan,
      existingVersion: validExistingVersion,
      existingMemberTableIds: [...EXPECTED_TABLE_IDS].reverse(),
    });
    expect(plan).toEqual({ action: "NOOP" });
  });

  it("existing Floorplan name differs → REJECT_DRIFT", () => {
    const plan = planMainFloorplanBootstrap({
      tables: validTables(),
      seats: validSeats(),
      existingFloorplan: { ...validExistingFloorplan, name: "Main Floor (renamed)" },
      existingVersion: validExistingVersion,
      existingMemberTableIds: [...EXPECTED_TABLE_IDS],
    });
    expect(plan.action).toBe("REJECT_DRIFT");
  });

  it("expected version missing entirely (Floorplan exists, version does not) → REJECT_DRIFT", () => {
    const plan = planMainFloorplanBootstrap({
      tables: validTables(),
      seats: validSeats(),
      existingFloorplan: validExistingFloorplan,
      existingVersion: null,
      existingMemberTableIds: null,
    });
    expect(plan.action).toBe("REJECT_DRIFT");
  });

  it("existing version belongs to a different floorplanId → REJECT_DRIFT", () => {
    const plan = planMainFloorplanBootstrap({
      tables: validTables(),
      seats: validSeats(),
      existingFloorplan: validExistingFloorplan,
      existingVersion: { ...validExistingVersion, floorplanId: "some-other-floorplan" },
      existingMemberTableIds: [...EXPECTED_TABLE_IDS],
    });
    expect(plan.action).toBe("REJECT_DRIFT");
  });

  it("existing version revision differs → REJECT_DRIFT", () => {
    const plan = planMainFloorplanBootstrap({
      tables: validTables(),
      seats: validSeats(),
      existingFloorplan: validExistingFloorplan,
      existingVersion: { ...validExistingVersion, revision: 2 },
      existingMemberTableIds: [...EXPECTED_TABLE_IDS],
    });
    expect(plan.action).toBe("REJECT_DRIFT");
  });

  it("existing version status is not Published (e.g. still Draft) → REJECT_DRIFT", () => {
    const plan = planMainFloorplanBootstrap({
      tables: validTables(),
      seats: validSeats(),
      existingFloorplan: validExistingFloorplan,
      existingVersion: { ...validExistingVersion, status: "Draft" },
      existingMemberTableIds: [...EXPECTED_TABLE_IDS],
    });
    expect(plan.action).toBe("REJECT_DRIFT");
  });

  it("existing membership set is missing a canonical Table id → REJECT_DRIFT", () => {
    const plan = planMainFloorplanBootstrap({
      tables: validTables(),
      seats: validSeats(),
      existingFloorplan: validExistingFloorplan,
      existingVersion: validExistingVersion,
      existingMemberTableIds: EXPECTED_TABLE_IDS.filter((id) => id !== "sushi-table-1"),
    });
    expect(plan.action).toBe("REJECT_DRIFT");
  });

  it("existing membership set has an extra, non-canonical Table id → REJECT_DRIFT", () => {
    const plan = planMainFloorplanBootstrap({
      tables: validTables(),
      seats: validSeats(),
      existingFloorplan: validExistingFloorplan,
      existingVersion: validExistingVersion,
      existingMemberTableIds: [...EXPECTED_TABLE_IDS, "sushi-table-7"],
    });
    expect(plan.action).toBe("REJECT_DRIFT");
  });

  it("existing Floorplan.defaultVersionId does not point at main-floor-v1 → REJECT_DRIFT", () => {
    const plan = planMainFloorplanBootstrap({
      tables: validTables(),
      seats: validSeats(),
      existingFloorplan: { ...validExistingFloorplan, defaultVersionId: null },
      existingVersion: validExistingVersion,
      existingMemberTableIds: [...EXPECTED_TABLE_IDS],
    });
    expect(plan.action).toBe("REJECT_DRIFT");
  });

  it("inventory mismatch is checked and rejected even when an existing bootstrap is already present", () => {
    const tables = validTables().filter((t) => t.id !== "sushi-table-1");
    const plan = planMainFloorplanBootstrap({
      tables,
      seats: validSeats(),
      existingFloorplan: validExistingFloorplan,
      existingVersion: validExistingVersion,
      existingMemberTableIds: [...EXPECTED_TABLE_IDS],
    });
    expect(plan.action).toBe("REJECT_INVENTORY");
  });
});
