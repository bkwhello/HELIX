/**
 * CAP-D01.01-R06 — Exactly One Service Period.
 *
 * Reservation Management does not decide what counts as a valid Service
 * Period for a given date/time/party size — that belongs to (the future)
 * Service Period Management. This is a cross-capability query, not a
 * domain rule of the Reservation aggregate. See
 * infrastructure/UnvalidatedServicePeriodReader.ts for the current
 * placeholder.
 */
export interface ServicePeriodValidation {
  readonly isValid: boolean;
  readonly reason?: string;
  /**
   * R1.6-P3A — optional. When a rejection has its own capability-owned
   * rule id (distinct from this port's own default `CAP-D01.01-R06`),
   * the reader supplies it here; every caller falls back to
   * `CAP-D01.01-R06` when this is omitted, so `UnvalidatedServicePeriodReader`/
   * `FakeServicePeriodReader` (which never set this field) are
   * byte-identical in behavior to before this field existed.
   */
  readonly ruleId?: string;
}

export interface ServicePeriodReader {
  validateReservation(input: {
    readonly servicePeriodId: string;
    readonly reservationDate: Date;
    readonly partySize: number;
  }): Promise<ServicePeriodValidation>;
}
