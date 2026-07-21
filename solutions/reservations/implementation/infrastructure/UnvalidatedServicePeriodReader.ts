import { ServicePeriodReader, ServicePeriodValidation } from "../application/ports/ServicePeriodReader.js";

/**
 * PLACEHOLDER — Service Period Management does not exist as a capability
 * yet. Always reports the Service Period as valid so the CreateReservation
 * vertical slice can be wired and tested end-to-end today. This is not
 * validation and must not be mistaken for it: replace with a real
 * adapter once that capability is built. Do not add speculative
 * service-period logic (lunch/dinner windows, Teppanyaki seatings, etc.)
 * here in the meantime — that business logic belongs to the real
 * capability, not to a stand-in for it.
 */
export class UnvalidatedServicePeriodReader implements ServicePeriodReader {
  async validateReservation(): Promise<ServicePeriodValidation> {
    return { isValid: true };
  }
}
