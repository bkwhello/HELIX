/**
 * CAP-D04.01 — Seating Assignment (R1.5).
 *
 * One SeatingAssignment belongs to exactly one Reservation; a Reservation
 * has at most one non-Released SeatingAssignment at a time (mirrors
 * CapacityCommitment's own "one Committed per reservation" invariant —
 * enforced structurally by a partial unique index, see the migration).
 *
 * status: Assigned | Seated | Released — the single collapsed operational
 * status the owner confirmed (final architecture §14) — no separate
 * Arrived state. seatedAt is set only on the Assigned -> Seated
 * transition. releaseReason is set only on release.
 */
export type SeatingAssignmentStatus = "Assigned" | "Seated" | "Released";
export type ReleaseReason = "GuestCancelled" | "StaffReassigned" | "NoShow" | "Completed";

export interface SeatingAssignment {
  readonly id: string;
  readonly reservationId: string;
  readonly status: SeatingAssignmentStatus;
  readonly releaseReason: ReleaseReason | null;
  readonly startTime: Date;
  readonly endTime: Date;
  readonly assignedBy: string;
  readonly assignedAt: Date;
  readonly seatedAt: Date | null;
  readonly releasedBy: string | null;
  readonly releasedAt: Date | null;
  readonly commandId: string;
}

/**
 * One row per physical Table or Seat claimed — the mechanism that
 * represents a single Sushi table, multiple combined Sushi tables,
 * individual Sushi bar positions, one or many Teppanyaki seats, and seats
 * spanning multiple grills, all with one shape (final architecture §7/§10).
 * Exactly one of tableId/seatId is set per row (enforced at the database
 * layer by a hand-written CHECK constraint).
 *
 * status/startTime/endTime duplicate the parent SeatingAssignment's own
 * fields — required so the PostgreSQL EXCLUDE constraints (final
 * architecture §19) can operate on this row directly, without a join.
 */
export interface SeatingAssignmentResource {
  readonly id: string;
  readonly assignmentId: string;
  readonly tableId: string | null;
  readonly seatId: string | null;
  readonly status: SeatingAssignmentStatus;
  readonly startTime: Date;
  readonly endTime: Date;
}
