/**
 * CAP-D03.03 — an individually-claimable seat at a supportsSharedSeating
 * Table (today: the four Teppanyaki grills only — R1_5_FLOOR_SEATING_FINAL_ARCHITECTURE.md
 * §6). id is the stable identity a SeatingAssignmentResource references;
 * operationalLabel ("C-01") is the staff-facing name.
 */
export type SeatStatus = "Active" | "Inactive";

export interface Seat {
  readonly id: string;
  readonly tableId: string;
  readonly operationalLabel: string;
  readonly status: SeatStatus;
  readonly createdAt: Date;
}
