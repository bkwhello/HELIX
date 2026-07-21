/**
 * See state-model.md for the authoritative lifecycle definition.
 *
 * Proposed → Confirmed → Completed
 * Proposed → Cancelled
 * Confirmed → Cancelled
 *
 * Completed and Cancelled are terminal.
 */
export const ReservationStatus = {
  Proposed: "Proposed",
  Confirmed: "Confirmed",
  Cancelled: "Cancelled",
  Completed: "Completed",
} as const;

export type ReservationStatus = (typeof ReservationStatus)[keyof typeof ReservationStatus];

const TERMINAL_STATUSES: readonly ReservationStatus[] = [ReservationStatus.Cancelled, ReservationStatus.Completed];

export function isTerminal(status: ReservationStatus): boolean {
  return TERMINAL_STATUSES.includes(status);
}

/**
 * CAP-D01.01-R22, R25, R29 — allowed lifecycle transitions.
 */
const ALLOWED_TRANSITIONS: Readonly<Record<ReservationStatus, readonly ReservationStatus[]>> = {
  Proposed: [ReservationStatus.Confirmed, ReservationStatus.Cancelled],
  Confirmed: [ReservationStatus.Completed, ReservationStatus.Cancelled],
  Cancelled: [],
  Completed: [],
};

export function canTransition(from: ReservationStatus, to: ReservationStatus): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to);
}
