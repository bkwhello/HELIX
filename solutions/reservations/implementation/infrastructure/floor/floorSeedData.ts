/**
 * CAP-D03.03 — the authoritative Konnichiwa floor configuration (R1.5,
 * "FINAL OWNER-CORRECTED FLOOR CONFIGURATION"). Pure static data — no I/O
 * — consumed by ops/floor/seedFloor.ts and by tests that need real,
 * known floor resources.
 *
 * IMPORTANT — a genuine, unresolved arithmetic discrepancy in the
 * owner-confirmed source data, deliberately NOT silently corrected here
 * (same discipline already applied throughout R1.5 to the Sushi-47-vs-60
 * and Teppanyaki-24-vs-20 findings — see
 * R1_5_FLOOR_SEATING_IMPLEMENTATION_REPORT.md §4 "Superseded Capacity
 * Values" / §33 "Remaining Risks" for the full account):
 *
 *   The itemized per-table list below (verbatim from the Chief Engineer's
 *   own §4 table) sums to 51 nominal physical seats (15 numbered tables
 *   summing to 47, per the assignment's own numbers, + 4 bar seats = 51),
 *   NOT the 45+4=49 the assignment's own §5 "SUSHI CAPACITY PROOF"
 *   section separately asserts. Both cannot be simultaneously correct.
 *
 *   This module seeds the itemized per-table list EXACTLY as given
 *   (the more granular, specific, named-resource data), producing 51
 *   physical seats. CAP-D02.03's Sushi commercial capacity
 *   (domain/availability/CapacityPool.ts) is set to the explicitly,
 *   repeatedly, separately mandated value of 49, tied directly to
 *   mandatory regression tests (assignment §33) — unaffected by this
 *   discrepancy, because CanAccept (CAP-D02.03) and CanSeat (CAP-D04) are
 *   architecturally independent by design (final architecture §11/§17) —
 *   no test in this codebase computes Sushi capacity FROM the seeded
 *   Table rows, so this discrepancy cannot silently propagate into a
 *   wrong commercial-capacity number.
 *
 *   Neither number was altered to make them agree. Flagged for the
 *   Chief Engineer / owner to resolve.
 */
export interface SeedTableConfig {
  readonly id: string;
  readonly areaId: string;
  readonly operationalLabel: string;
  readonly nominalCapacity: number;
  readonly supportsSharedSeating: boolean;
  readonly seats?: readonly string[]; // seat operational-label suffixes, e.g. "01".."10"
}

// Sushi — 15 numbered tables (1-13, 15, 16 — Table 14 is deliberately,
// permanently absent; see the assignment's §4 "There is deliberately NO
// Table 14" and AC/tests proving this) + 4 individually-identifiable bar
// positions (17-20), modeled as ordinary Tables with nominalCapacity 1 and
// supportsSharedSeating false — final architecture's own "smallest
// coherent model": a bar position needs no field beyond what an ordinary
// Table already has.
export const SUSHI_TABLES: readonly SeedTableConfig[] = [
  { id: "sushi-table-1", areaId: "Sushi", operationalLabel: "Table 1", nominalCapacity: 4, supportsSharedSeating: false },
  { id: "sushi-table-2", areaId: "Sushi", operationalLabel: "Table 2", nominalCapacity: 4, supportsSharedSeating: false },
  { id: "sushi-table-3", areaId: "Sushi", operationalLabel: "Table 3", nominalCapacity: 4, supportsSharedSeating: false },
  { id: "sushi-table-4", areaId: "Sushi", operationalLabel: "Table 4", nominalCapacity: 4, supportsSharedSeating: false },
  { id: "sushi-table-5", areaId: "Sushi", operationalLabel: "Table 5", nominalCapacity: 2, supportsSharedSeating: false },
  { id: "sushi-table-6", areaId: "Sushi", operationalLabel: "Table 6", nominalCapacity: 2, supportsSharedSeating: false },
  { id: "sushi-table-7", areaId: "Sushi", operationalLabel: "Table 7", nominalCapacity: 2, supportsSharedSeating: false },
  { id: "sushi-table-8", areaId: "Sushi", operationalLabel: "Table 8", nominalCapacity: 4, supportsSharedSeating: false },
  { id: "sushi-table-9", areaId: "Sushi", operationalLabel: "Table 9", nominalCapacity: 4, supportsSharedSeating: false },
  { id: "sushi-table-10", areaId: "Sushi", operationalLabel: "Table 10", nominalCapacity: 5, supportsSharedSeating: false },
  { id: "sushi-table-11", areaId: "Sushi", operationalLabel: "Table 11", nominalCapacity: 2, supportsSharedSeating: false },
  { id: "sushi-table-12", areaId: "Sushi", operationalLabel: "Table 12", nominalCapacity: 4, supportsSharedSeating: false },
  { id: "sushi-table-13", areaId: "Sushi", operationalLabel: "Table 13", nominalCapacity: 2, supportsSharedSeating: false },
  // Table 14 deliberately absent — do NOT add it here.
  { id: "sushi-table-15", areaId: "Sushi", operationalLabel: "Table 15", nominalCapacity: 2, supportsSharedSeating: false },
  { id: "sushi-table-16", areaId: "Sushi", operationalLabel: "Table 16", nominalCapacity: 2, supportsSharedSeating: false },
  { id: "sushi-bar-17", areaId: "Sushi", operationalLabel: "Bar 17", nominalCapacity: 1, supportsSharedSeating: false },
  { id: "sushi-bar-18", areaId: "Sushi", operationalLabel: "Bar 18", nominalCapacity: 1, supportsSharedSeating: false },
  { id: "sushi-bar-19", areaId: "Sushi", operationalLabel: "Bar 19", nominalCapacity: 1, supportsSharedSeating: false },
  { id: "sushi-bar-20", areaId: "Sushi", operationalLabel: "Bar 20", nominalCapacity: 1, supportsSharedSeating: false },
];

const TEPPANYAKI_SEAT_LABELS = Array.from({ length: 10 }, (_, i) => String(i + 1).padStart(2, "0"));

// Teppanyaki — exactly four grills (C, D, E, F — the owner's own staff-
// facing labels, never internally renamed to "Grill 1..4" per the
// assignment's explicit instruction), each supportsSharedSeating with 10
// individually-identifiable seats. 4 x 10 = 40, matching CAP-D02.03's
// Teppanyaki capacity exactly.
export const TEPPANYAKI_TABLES: readonly SeedTableConfig[] = ["C", "D", "E", "F"].map((label) => ({
  id: `teppanyaki-${label.toLowerCase()}`,
  areaId: "Teppanyaki",
  operationalLabel: label,
  nominalCapacity: 10,
  supportsSharedSeating: true,
  seats: TEPPANYAKI_SEAT_LABELS,
}));

export const ALL_TABLES: readonly SeedTableConfig[] = [...SUSHI_TABLES, ...TEPPANYAKI_TABLES];

export function seatId(tableId: string, seatLabelSuffix: string): string {
  return `${tableId}-seat-${seatLabelSuffix}`;
}

export function seatOperationalLabel(table: SeedTableConfig, seatLabelSuffix: string): string {
  return `${table.operationalLabel}-${seatLabelSuffix}`;
}

/** Sum of every seeded Table's nominalCapacity — see this module's header comment on why this is 51, not 49. */
export const TOTAL_SUSHI_NOMINAL_CAPACITY = SUSHI_TABLES.reduce((sum, t) => sum + t.nominalCapacity, 0);
export const TOTAL_TEPPANYAKI_NOMINAL_CAPACITY = TEPPANYAKI_TABLES.reduce((sum, t) => sum + t.nominalCapacity, 0);
