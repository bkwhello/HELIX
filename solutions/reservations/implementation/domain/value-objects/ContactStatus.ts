/**
 * CAP-D05.01 §6 "Contact Lifecycle" — kept deliberately minimal per the
 * R1.3-I1 assignment: no VIP/Merged/Preferred/Inactive/Blocked states
 * without a concrete operational requirement. Merging is not part of
 * this slice (see R1_3_I1_CAP_D05_01_IMPLEMENTATION_REPORT.md).
 *
 * Anonymized, not Deleted: a Reservation may still reference this
 * Contact's id, so the row itself is never removed — see
 * prisma/schema.prisma's comment on Contact.status.
 */
export const ContactStatus = {
  Active: "Active",
  Anonymized: "Anonymized",
} as const;

export type ContactStatus = (typeof ContactStatus)[keyof typeof ContactStatus];
