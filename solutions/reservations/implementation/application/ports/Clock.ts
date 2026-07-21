/** Supplies "now". Kept outside the domain so rules like CAP-D01.01-R11 stay testable with a fixed time. */
export interface Clock {
  now(): Date;
}
