/**
 * CAP-D01.01-R48 — Preferred Area Is a Preference
 *
 * "A preferred area, such as Teppan or Sushi, shall be treated as a
 * guest preference unless another capability explicitly guarantees it.
 * Reservation Management shall not represent preference as confirmed
 * seating assignment." — rule-model.md
 *
 * That is why this is Warning severity everywhere it's checked, never
 * Blocking: capturing it is operationally useful for Konnichi Wa (guests
 * choose between the sushi counter and teppanyaki), but it is a wish,
 * not a table assignment — Seating Assignment (a different capability)
 * owns the actual guarantee.
 */
export const PreferredArea = {
  Sushi: "Sushi",
  Teppanyaki: "Teppanyaki",
} as const;

export type PreferredArea = (typeof PreferredArea)[keyof typeof PreferredArea];
