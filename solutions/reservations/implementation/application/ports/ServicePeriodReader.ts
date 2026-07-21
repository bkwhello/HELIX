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
}

export interface ServicePeriodReader {
  validateReservation(input: {
    readonly servicePeriodId: string;
    readonly reservationDate: Date;
    readonly partySize: number;
  }): Promise<ServicePeriodValidation>;
}
