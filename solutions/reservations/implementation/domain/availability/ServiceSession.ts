/**
 * R1.6-P2C-1 — Operational Service Session. A dated instance of a
 * meal-based Service (`"lunch"` | `"dinner"`, R1.6-P2B) being run for
 * real, live restaurant service — NOT the full CAP-D02.02 capability
 * (still `Designed`): no floorplan-version selection, no
 * Reservation/SeatingAssignment foreign key, no persisted Service
 * definition table. This is the minimum lifecycle (`Created` ->
 * `Opened` -> `Closed`, `Created` -> `Cancelled`) the Chief Engineer
 * authorized for P2C-1, gating a small, explicit set of live operational
 * actions — see `application/availability/ServiceSessionGate.ts` and
 * `application/availability/ServiceSessionService.ts`.
 */
import { ServiceCode } from "./Service.js";

export type ServiceSessionStatus = "Created" | "Opened" | "Closed" | "Cancelled";

export interface ServiceSession {
  readonly id: string;
  readonly serviceCode: ServiceCode;
  /** Amsterdam-local calendar date, "YYYY-MM-DD" — matches ServiceTime.ts's toLocalServiceDate output exactly. */
  readonly serviceDate: string;
  readonly status: ServiceSessionStatus;
  readonly openedAt: Date | null;
  readonly closedAt: Date | null;
  readonly cancelledAt: Date | null;
  readonly createdBy: string;
  readonly createdAt: Date;
  readonly version: number;
}

/**
 * The only four valid transitions (Chief Engineer decision #5) — no
 * cross-state or reverse transition, ever. Repeating an already-achieved
 * transition (e.g. Opened -> Opened) is idempotent at the SERVICE layer
 * (ServiceSessionService), not here — this function only answers "is a
 * REAL state change from `from` to `to` valid," so it deliberately does
 * NOT include from === to pairs; callers check for the idempotent-repeat
 * case first and never reach this function for that case.
 */
const VALID_TRANSITIONS: ReadonlyMap<ServiceSessionStatus, ReadonlySet<ServiceSessionStatus>> = new Map([
  ["Created", new Set<ServiceSessionStatus>(["Opened", "Cancelled"])],
  ["Opened", new Set<ServiceSessionStatus>(["Closed"])],
  ["Closed", new Set<ServiceSessionStatus>()],
  ["Cancelled", new Set<ServiceSessionStatus>()],
]);

export function isValidServiceSessionTransition(from: ServiceSessionStatus, to: ServiceSessionStatus): boolean {
  return VALID_TRANSITIONS.get(from)?.has(to) ?? false;
}
