import { ContactReader } from "../../application/ports/ContactReader.js";
import { ServicePeriodReader, ServicePeriodValidation } from "../../application/ports/ServicePeriodReader.js";
import { DuplicateCandidate, DuplicateReservationChecker } from "../../application/ports/DuplicateReservationChecker.js";
import { ClosingDayRange, ClosingDayStore } from "../../application/ports/ClosingDayStore.js";

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

let closingDayIdCounter = 0;

export class FakeClosingDayStore implements ClosingDayStore {
  private readonly ranges = new Map<string, { fromDate: string; toDate: string; reason?: string }>();

  async isClosed(date: Date): Promise<boolean> {
    const key = toDateKey(date);
    return [...this.ranges.values()].some((r) => r.fromDate <= key && key <= r.toDate);
  }
  async add(input: { readonly fromDate: Date; readonly toDate: Date; readonly reason?: string }): Promise<ClosingDayRange> {
    closingDayIdCounter += 1;
    const id = `closing-${closingDayIdCounter}`;
    let fromDate = toDateKey(input.fromDate);
    let toDate = toDateKey(input.toDate);
    if (toDate < fromDate) [fromDate, toDate] = [toDate, fromDate];
    this.ranges.set(id, { fromDate, toDate, reason: input.reason });
    return { id, fromDate, toDate, reason: input.reason };
  }
  async remove(id: string): Promise<void> {
    this.ranges.delete(id);
  }
  async list(): Promise<readonly ClosingDayRange[]> {
    return [...this.ranges.entries()]
      .map(([id, r]) => ({ id, ...r }))
      .sort((a, b) => a.fromDate.localeCompare(b.fromDate));
  }
}
