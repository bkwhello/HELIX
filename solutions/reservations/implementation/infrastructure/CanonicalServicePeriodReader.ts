import { ServicePeriodReader, ServicePeriodValidation } from "../application/ports/ServicePeriodReader.js";
import { deriveServiceCode, isServiceCode } from "../domain/availability/Service.js";
import { ServiceDefinitionRepository } from "../domain/repositories/ServiceDefinitionRepository.js";

/** R1.6-P3A — the one, capability-owned (CAP-D02.01) rule id for "the persisted Service configuration is unavailable," covering both a missing row and an explicitly disabled one identically at this external boundary — see this file's own validateReservation doc comment for why the two are not distinguished here. */
const SERVICE_UNAVAILABLE_RULE_ID = "CAP-D02.01-R01";
const SERVICE_UNAVAILABLE_MESSAGE = "The requested Service is not currently available.";

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
 * R1.6-P3A — after the existing derived-code equality check passes
 * (unchanged, still `CAP-D01.01-R06` on mismatch), this reader now also
 * consults the persisted Service catalog (CAP-D02.01) and fails closed —
 * same rule id, same generic message, no persistence detail ever
 * surfaced — when the matching row is either absent or `enabled: false`.
 * A repository failure (e.g. the database is unreachable) propagates as
 * a thrown exception, exactly like every other async failure in this
 * call chain — it is never caught here and silently treated as valid.
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
  constructor(private readonly serviceDefinitionRepository: ServiceDefinitionRepository) {}

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
    const definition = await this.serviceDefinitionRepository.findByCode(input.servicePeriodId);
    if (!definition || !definition.enabled) {
      return { isValid: false, reason: SERVICE_UNAVAILABLE_MESSAGE, ruleId: SERVICE_UNAVAILABLE_RULE_ID };
    }
    return { isValid: true };
  }
}
