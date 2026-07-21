/**
 * CAP-D01.01-R14 — Duplicate Creation Must Be Detectable.
 *
 * A query/search concern, not aggregate persistence — kept out of
 * ReservationRepository so it can grow into something more than a simple
 * SQL lookup (fuzzy matching, external-reference matching, etc.) without
 * widening the repository's responsibility.
 */
export interface DuplicateCandidate {
  readonly contactId: string;
  readonly reservationDate: Date;
  readonly partySize: number;
}

export interface DuplicateReservationChecker {
  check(candidate: DuplicateCandidate): Promise<boolean>;
}
