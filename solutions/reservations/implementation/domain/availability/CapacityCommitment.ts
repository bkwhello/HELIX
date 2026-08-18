/**
 * CAP-D02.03 — Capacity Commitment.
 *
 * Deliberately a plain data shape, not a rich aggregate with its own
 * class/invariant-guarding methods — its lifecycle (Committed / Released
 * / Superseded) is simple enough that persistence-layer constraints
 * (§22: partySize > 0, startTime < endTime) plus the transaction/lock
 * discipline in the orchestrator carry the real invariants. "Completed"
 * was evaluated and NOT added — CAP_D02_03 Availability §19: capacity
 * consumption is time-driven (interval expiry) and status-driven only
 * for early release (cancellation); an administrative Completion action
 * has no distinct effect on future availability, so a fourth status
 * would not be materially useful, per the explicit instruction not to
 * create unnecessary workflow states.
 */
export type CapacityCommitmentStatus = "Committed" | "Released" | "Superseded";

export interface CapacityCommitment {
  readonly commitmentId: string;
  readonly reservationId: string | null;
  readonly capacityPoolId: string;
  readonly startTime: Date;
  readonly endTime: Date;
  readonly partySize: number;
  readonly status: CapacityCommitmentStatus;
  readonly commandId: string;
  readonly createdAt: Date;
}

/** The minimal shape the pure evaluator (AvailabilityEvaluator.ts) actually needs — decoupled from persistence so the algorithm stays independently unit-testable without Prisma/PostgreSQL. */
export interface CommitmentInterval {
  readonly commitmentId: string;
  readonly startTime: Date;
  readonly endTime: Date;
  readonly partySize: number;
}
