/**
 * R1.5-P2B — CAP-D03.02 Floorplan Management, authoring/default-version
 * foundation (design gates R1.5-P2/P2A). Deliberately NO "Active" status
 * on FloorplanVersion — R1.5-P2A's own correction: "being the default"
 * (Floorplan.defaultVersionId) is a separate fact from a version's own
 * immutability lifecycle. Table-level membership only — a Teppanyaki
 * grill Table's membership implicitly covers its child Seats; there is
 * no independent Seat membership concept anywhere in this file.
 */
export type FloorplanVersionStatus = "Draft" | "Published" | "Archived";

/**
 * R1.5-P2C — the one canonical Floorplan identity for this pilot (exactly
 * one Floorplan exists — see R1.5-P2B-B's bootstrap tooling, which creates
 * exactly this id). The single definition site: every module that needs
 * to know "which Floorplan" (the bootstrap planner, ServiceSessionService's
 * open-time snapshot) imports this constant rather than repeating the
 * literal string.
 */
export const MAIN_FLOORPLAN_ID = "main-floor";

export interface Floorplan {
  readonly id: string;
  readonly name: string;
  readonly defaultVersionId: string | null;
  readonly createdAt: Date;
}

export interface FloorplanVersion {
  readonly id: string;
  readonly floorplanId: string;
  readonly revision: number;
  readonly status: FloorplanVersionStatus;
  readonly publishedAt: Date | null;
  readonly createdBy: string;
  readonly createdAt: Date;
}

export interface FloorplanVersionResource {
  readonly id: string;
  readonly floorplanVersionId: string;
  readonly tableId: string;
}

/**
 * The only two valid transitions: Draft -> Published, Published ->
 * Archived. No reverse, no Draft -> Archived directly (an abandoned
 * Draft is simply never published — there is no delete/abandon command
 * in this foundation increment), no re-Draft of a Published/Archived
 * version (a correction is always a NEW version/revision).
 */
const VALID_TRANSITIONS: Readonly<Record<FloorplanVersionStatus, ReadonlySet<FloorplanVersionStatus>>> = {
  Draft: new Set(["Published"]),
  Published: new Set(["Archived"]),
  Archived: new Set(),
};

export function isValidFloorplanVersionTransition(from: FloorplanVersionStatus, to: FloorplanVersionStatus): boolean {
  return VALID_TRANSITIONS[from].has(to);
}
