import { ContactReader } from "../../application/ports/ContactReader.js";
import { ServicePeriodReader, ServicePeriodValidation } from "../../application/ports/ServicePeriodReader.js";
import { DuplicateCandidate, DuplicateReservationChecker } from "../../application/ports/DuplicateReservationChecker.js";

export class FakeContactReader implements ContactReader {
  contactExists = true;
  async exists(): Promise<boolean> {
    return this.contactExists;
  }
}

export class FakeServicePeriodReader implements ServicePeriodReader {
  result: ServicePeriodValidation = { isValid: true };
  async validateReservation(): Promise<ServicePeriodValidation> {
    return this.result;
  }
}

export class FakeDuplicateReservationChecker implements DuplicateReservationChecker {
  duplicateDetected = false;
  async check(_candidate: DuplicateCandidate): Promise<boolean> {
    return this.duplicateDetected;
  }
}
