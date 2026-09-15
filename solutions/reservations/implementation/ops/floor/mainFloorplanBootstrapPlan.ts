import { ALL_TABLES, seatId } from "../../infrastructure/floor/floorSeedData.js";

/**
 * R1.5-P2B-B — Main Floor Bootstrap Tooling.
 *
 * Pure, DB-free planning logic for `bootstrapMainFloorplan.ts`. Deliberately
 * separated from that file's I/O shell so every inventory-mismatch and
 * drift scenario (missing Table, inactive Table, unexpected active Table,
 * drift in any material field) can be unit-tested against fabricated
 * in-memory data — never against the real, shared `tables`/`seats` rows
 * that other concurrently-running test files also depend on (the
 * established test-isolation discipline in this codebase: never mutate
 * shared floor-seed fixtures from a new test file). The I/O shell's own
 * job is reduced to: read real state, call this function, act on its
 * verdict — nothing decision-relevant lives there.
 */

export const MAIN_FLOOR_ID = "main-floor";
export const MAIN_FLOOR_NAME = "Main Floor";
export const MAIN_FLOOR_VERSION_ID = "main-floor-v1";
export const MAIN_FLOOR_REVISION = 1;

/**
 * Non-user system-actor identifier for this bootstrap's own `createdBy`
 * column. `FloorplanVersion.createdBy` is a plain, unconstrained String
 * column (no FK to StaffUser) — this script never authenticates as staff
 * (see requirement 15: no HTTP API, no staff credentials), so a bare
 * system-identifier string is the correct and sufficient shape. The one
 * existing repository precedent for exactly this purpose is
 * ops/reservations/servicePeriodSmokeTest.ts:72's `createdBy: "system"`
 * fixture (a non-StaffUser createdBy value for an unattended script) —
 * reused verbatim here rather than inventing a second convention.
 */
export const BOOTSTRAP_SYSTEM_ACTOR_ID = "system";

export const EXPECTED_TABLE_IDS: readonly string[] = [...ALL_TABLES.map((t) => t.id)].sort();

export interface TableSnapshot {
  readonly id: string;
  readonly status: string;
}

export interface SeatSnapshot {
  readonly id: string;
  readonly tableId: string;
}

export interface ExistingFloorplanSnapshot {
  readonly name: string;
  readonly defaultVersionId: string | null;
}

export interface ExistingVersionSnapshot {
  readonly floorplanId: string;
  readonly revision: number;
  readonly status: string;
}

export interface MainFloorplanBootstrapInput {
  readonly tables: readonly TableSnapshot[];
  readonly seats: readonly SeatSnapshot[];
  /** null when no Floorplan "main-floor" exists yet. */
  readonly existingFloorplan: ExistingFloorplanSnapshot | null;
  /** null when no FloorplanVersion "main-floor-v1" exists yet. */
  readonly existingVersion: ExistingVersionSnapshot | null;
  /** null when existingVersion is null; otherwise the version's current member Table ids. */
  readonly existingMemberTableIds: readonly string[] | null;
}

export type MainFloorplanBootstrapPlan =
  | { readonly action: "CREATE" }
  | { readonly action: "NOOP" }
  | { readonly action: "REJECT_INVENTORY"; readonly reason: string }
  | { readonly action: "REJECT_DRIFT"; readonly reason: string };

export function planMainFloorplanBootstrap(input: MainFloorplanBootstrapInput): MainFloorplanBootstrapPlan {
  const inventoryRejection = checkTableAndSeatInventory(input.tables, input.seats);
  if (inventoryRejection) return { action: "REJECT_INVENTORY", reason: inventoryRejection };

  if (!input.existingFloorplan) {
    return { action: "CREATE" };
  }

  const driftRejection = checkExistingBootstrapForDrift(input.existingFloorplan, input.existingVersion, input.existingMemberTableIds);
  if (driftRejection) return { action: "REJECT_DRIFT", reason: driftRejection };

  return { action: "NOOP" };
}

function checkTableAndSeatInventory(tables: readonly TableSnapshot[], seats: readonly SeatSnapshot[]): string | null {
  const missing = EXPECTED_TABLE_IDS.filter((id) => !tables.some((t) => t.id === id));
  if (missing.length > 0) {
    return `missing expected Table id(s): ${missing.join(", ")}.`;
  }

  const inactiveExpected = EXPECTED_TABLE_IDS.filter((id) => tables.find((t) => t.id === id)?.status !== "Active");
  if (inactiveExpected.length > 0) {
    return `expected Table id(s) are not Active: ${inactiveExpected.join(", ")}.`;
  }

  const activeIds = [...tables.filter((t) => t.status === "Active").map((t) => t.id)].sort();
  const unexpectedActive = activeIds.filter((id) => !EXPECTED_TABLE_IDS.includes(id));
  if (unexpectedActive.length > 0) {
    return `unexpected active Table id(s) not in the canonical 23: ${unexpectedActive.join(", ")}.`;
  }

  let expectedSeatCount = 0;
  for (const table of ALL_TABLES) {
    for (const suffix of table.seats ?? []) {
      expectedSeatCount += 1;
      const id = seatId(table.id, suffix);
      const seat = seats.find((s) => s.id === id);
      if (!seat || seat.tableId !== table.id) {
        return `expected Seat "${id}" with parent Table "${table.id}" was not found as expected.`;
      }
    }
  }
  if (seats.length !== expectedSeatCount) {
    return `expected exactly ${expectedSeatCount} Seats, found ${seats.length}.`;
  }

  return null;
}

function checkExistingBootstrapForDrift(
  floorplan: ExistingFloorplanSnapshot,
  version: ExistingVersionSnapshot | null,
  memberTableIds: readonly string[] | null
): string | null {
  if (floorplan.name !== MAIN_FLOOR_NAME) {
    return `Floorplan "${MAIN_FLOOR_ID}" has name "${floorplan.name}", expected "${MAIN_FLOOR_NAME}".`;
  }
  if (!version || version.floorplanId !== MAIN_FLOOR_ID) {
    return `Version "${MAIN_FLOOR_VERSION_ID}" does not exist or does not belong to Floorplan "${MAIN_FLOOR_ID}".`;
  }
  if (version.revision !== MAIN_FLOOR_REVISION) {
    return `Version "${MAIN_FLOOR_VERSION_ID}" has revision ${version.revision}, expected ${MAIN_FLOOR_REVISION}.`;
  }
  if (version.status !== "Published") {
    return `Version "${MAIN_FLOOR_VERSION_ID}" has status "${version.status}", expected "Published".`;
  }
  const existingMembers = [...(memberTableIds ?? [])].sort();
  const sameLength = existingMembers.length === EXPECTED_TABLE_IDS.length;
  const sameMembers = sameLength && existingMembers.every((id, i) => id === EXPECTED_TABLE_IDS[i]);
  if (!sameMembers) {
    return `Version "${MAIN_FLOOR_VERSION_ID}" membership set does not match the canonical ${EXPECTED_TABLE_IDS.length} Table ids exactly.`;
  }
  if (floorplan.defaultVersionId !== MAIN_FLOOR_VERSION_ID) {
    return `Floorplan "${MAIN_FLOOR_ID}" defaultVersionId is "${String(floorplan.defaultVersionId)}", expected "${MAIN_FLOOR_VERSION_ID}".`;
  }
  return null;
}
