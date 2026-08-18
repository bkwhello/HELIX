/**
 * CAP-D02.03 — Availability Evaluator.
 *
 * Implements the approved simultaneous-occupancy algorithm (HELIX
 * ENGINEERING ASSIGNMENT "Final Capacity Algorithm Correction", §4/§5).
 *
 * Explicitly REJECTED: SUM(partySize) of every commitment that overlaps
 * any portion of the requested interval. That algorithm double-counts
 * commitments which overlap different, non-overlapping portions of the
 * requested interval and produces false "sold out" rejections — see the
 * mandatory regression scenario in AvailabilityEvaluator.test.ts.
 *
 * Precondition this algorithm's EXACTNESS depends on: every commitment's
 * startTime is 15-minute-grid-aligned and every commitment's duration is
 * a whole multiple of 15 minutes (true today — CAPACITY_POOLS durations
 * are 90/150 minutes, and start times are validated against the grid at
 * the orchestration boundary, see BookingPolicy.ts). Slice coverage
 * below uses a GENERAL overlap test (not "fully contains"), so if this
 * precondition is ever violated the algorithm degrades SAFELY —
 * over-counts occupancy for a partially-overlapped slice rather than
 * under-counting it — never permitting overbooking, only ever causing an
 * unnecessarily conservative rejection. See CapacityRepository.ts for
 * the write-time defensive check (AC-27) that keeps the precondition
 * true in the first place.
 */
import { BOOKING_GRID_MINUTES } from "./CapacityPool.js";
import { CommitmentInterval } from "./CapacityCommitment.js";

const MINUTE_MS = 60_000;

export interface OccupancySlice {
  readonly sliceStart: Date;
  readonly sliceEnd: Date;
  readonly occupancy: number;
}

/**
 * Pure function. No I/O, no database, no clock access — every input is
 * supplied by the caller, so this is exhaustively unit-testable without
 * PostgreSQL (CAP-D02.03 §10 of the architecture report: "keep the
 * correctness-critical algorithm independently unit-testable").
 */
export function evaluateSimultaneousOccupancy(input: {
  readonly requestedStart: Date;
  readonly requestedDurationMinutes: number;
  readonly candidates: readonly CommitmentInterval[];
  /** CAP-D02.03 §7 (Modify Self-Exclusion) — excludes the reservation's own currently-active commitment from the occupancy sum, by commitmentId, never by reservationId. */
  readonly excludeCommitmentId?: string;
}): { readonly maxExistingOccupancy: number; readonly slices: readonly OccupancySlice[] } {
  const { requestedStart, requestedDurationMinutes, candidates, excludeCommitmentId } = input;

  if (requestedDurationMinutes <= 0 || requestedDurationMinutes % BOOKING_GRID_MINUTES !== 0) {
    throw new Error(
      `evaluateSimultaneousOccupancy: requestedDurationMinutes (${requestedDurationMinutes}) must be a positive multiple of ${BOOKING_GRID_MINUTES}.`
    );
  }

  const relevantCandidates = excludeCommitmentId
    ? candidates.filter((c) => c.commitmentId !== excludeCommitmentId)
    : candidates;

  const sliceCount = requestedDurationMinutes / BOOKING_GRID_MINUTES;
  const slices: OccupancySlice[] = [];
  let maxExistingOccupancy = 0;

  for (let i = 0; i < sliceCount; i += 1) {
    const sliceStart = new Date(requestedStart.getTime() + i * BOOKING_GRID_MINUTES * MINUTE_MS);
    const sliceEnd = new Date(sliceStart.getTime() + BOOKING_GRID_MINUTES * MINUTE_MS);

    // General overlap test (not "fully contains") — see file header.
    let occupancy = 0;
    for (const c of relevantCandidates) {
      if (c.startTime.getTime() < sliceEnd.getTime() && sliceStart.getTime() < c.endTime.getTime()) {
        occupancy += c.partySize;
      }
    }

    slices.push({ sliceStart, sliceEnd, occupancy });
    if (occupancy > maxExistingOccupancy) maxExistingOccupancy = occupancy;
  }

  return { maxExistingOccupancy, slices };
}

/**
 * Two intervals `[s1,e1)` and `[s2,e2)` overlap iff `s1 < e2 AND s2 < e1`
 * — strict inequalities, half-open intervals, so back-to-back
 * reservations (A ends exactly when B starts) never overlap.
 */
export function intervalsOverlap(s1: Date, e1: Date, s2: Date, e2: Date): boolean {
  return s1.getTime() < e2.getTime() && s2.getTime() < e1.getTime();
}
