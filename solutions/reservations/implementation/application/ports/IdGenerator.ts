/** Generates a new unique Reservation Identity. Kept outside the domain so the aggregate stays deterministic and easy to test. */
export interface IdGenerator {
  generate(): string;
}
