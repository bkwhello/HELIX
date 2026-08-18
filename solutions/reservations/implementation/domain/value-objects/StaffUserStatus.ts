/**
 * R1.2 — Identity & Access. No Invited/Pending: a StaffUser is usable
 * (can log in) the moment it is created — see
 * R1_2_IDENTITY_ACCESS_FINAL_ARCHITECTURE.md §5 for why a third status
 * was evaluated and rejected for this MVA.
 */
export const StaffUserStatus = {
  Active: "Active",
  Disabled: "Disabled",
} as const;

export type StaffUserStatus = (typeof StaffUserStatus)[keyof typeof StaffUserStatus];
