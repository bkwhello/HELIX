import { ServicePeriodReader, ServicePeriodValidation } from "../application/ports/ServicePeriodReader.js";
import { deriveServiceCode, isServiceCode } from "../domain/availability/Service.js";

/**
 * R1.6-P2B — the real `ServicePeriodReader`, replacing
 * `UnvalidatedServicePeriodReader` in production wiring (`api/server.ts`).
 * Validates the caller-supplied `servicePeriodId` against the server-
 * derived canonical Service code (`domain/availability/Service.ts`) for
 * the given `reservationDate` — Europe/Amsterdam local time, DST-correct,
 * never the machine's local timezone. `partySize` is accepted (required
 * by this port's existing, unmodified signature) but not used — the
 * canonical Service axis is purely time-based (Chief Engineer R1.6-P2B
 * decision #5).
 *
 * Deliberately does NOT replace `UnvalidatedServicePeriodReader` or
 * `tests/support/FakePorts.ts`'s `FakeServicePeriodReader` anywhere they
 * are already used — dozens of existing tests rely on either as a
 * deliberate simplification for concerns unrelated to Service-code
 * validation, using arbitrary fixture strings (`"sp-dinner"`, `"sp-1"`,
 * etc.) that this real implementation would correctly reject. See the
 * R1.6-P2B STOP-gate report's "Fixture impact" section.
 */
export class CanonicalServicePeriodReader implements ServicePeriodReader {
  async validateReservation(input: {
    readonly servicePeriodId: string;
    readonly reservationDate: Date;
    readonly partySize: number;
  }): Promise<ServicePeriodValidation> {
    if (!isServiceCode(input.servicePeriodId)) {
      return { isValid: false, reason: `servicePeriodId must be "lunch" or "dinner". Received: "${input.servicePeriodId}".` };
    }
    const expected = deriveServiceCode(input.reservationDate);
    if (input.servicePeriodId !== expected) {
      return {
        isValid: false,
        reason: `servicePeriodId "${input.servicePeriodId}" does not match the service derived from the reservation time ("${expected}").`,
      };
    }
    return { isValid: true };
  }
}
