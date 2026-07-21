import { ContactReader } from "../../application/ports/ContactReader.js";
import { ServicePeriodReader, ServicePeriodValidation } from "../../application/ports/ServicePeriodReader.js";
import { DuplicateCandidate, DuplicateReservationChecker } from "../../application/ports/DuplicateReservationChecker.js";
import { ClosingDay, ClosingDayStore } from "../../application/ports/ClosingDayStore.js";

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

function toDateKey(date: Date): string {
  return new Date(date).toISOString().slice(0, 10);
}

export class FakeClosingDayStore implements ClosingDayStore {
  private readonly closed = new Map<string, string | undefined>();

  async isClosed(date: Date): Promise<boolean> {
    return this.closed.has(toDateKey(date));
  }
  async add(input: { readonly date: Date; readonly reason?: string }): Promise<void> {
    this.closed.set(toDateKey(input.date), input.reason);
  }
  async remove(date: Date): Promise<void> {
    this.closed.delete(toDateKey(date));
  }
  async list(): Promise<readonly ClosingDay[]> {
    return [...this.closed.entries()].map(([date, reason]) => ({ date, reason }));
  }
}
