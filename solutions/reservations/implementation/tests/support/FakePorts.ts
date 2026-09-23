import { ServicePeriodReader, ServicePeriodValidation } from "../../application/ports/ServicePeriodReader.js";
import { DuplicateCandidate, DuplicateReservationChecker } from "../../application/ports/DuplicateReservationChecker.js";
import { ClosingDayRange, ClosingDayStore } from "../../application/ports/ClosingDayStore.js";
import { ContactRepository, ContactRecord, CreateContactRecordInput, PossibleMatchCriteria } from "../../application/ports/ContactRepository.js";
import { ContactStatus } from "../../domain/value-objects/ContactStatus.js";
import { TransactionManager } from "../../application/ports/TransactionManager.js";
import { TransactionContext } from "../../domain/shared/TransactionContext.js";
import { ServiceDefinitionRepository } from "../../domain/repositories/ServiceDefinitionRepository.js";
import { ServiceDefinition } from "../../domain/availability/ServiceDefinition.js";
import { ServiceCode } from "../../domain/availability/Service.js";

/** No real database in unit-level tests — the "transaction" is just the callback invoked with no tx, consistent with how InMemoryReservationRepository ignores `tx` entirely. */
export class FakeTransactionManager implements TransactionManager {
  async runInTransaction<T>(work: (tx: TransactionContext) => Promise<T>): Promise<T> {
    return work(undefined);
  }
}

/**
 * In-memory CAP-D05.01 Contact store for unit-level tests. `seed()` lets
 * a test pre-populate an "existing Contact" without going through
 * CreateContactHandler; `forceMissing` mirrors the old
 * FakeContactReader.contactExists=false toggle for tests that just need
 * "the referenced contact does not exist".
 */
export class FakeContactRepository implements ContactRepository {
  private readonly contacts = new Map<string, ContactRecord>();
  forceMissing = false;
  private idCounter = 0;

  seed(contact: Partial<ContactRecord> & { readonly id: string }): ContactRecord {
    const record: ContactRecord = {
      displayName: "Seeded Contact",
      status: ContactStatus.Active,
      createdBy: "staff-1",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastRelevantActivityAt: new Date(),
      ...contact,
    };
    this.contacts.set(record.id, record);
    return record;
  }

  async findById(id: string): Promise<ContactRecord | null> {
    if (this.forceMissing) return null;
    return this.contacts.get(id) ?? null;
  }

  async create(input: CreateContactRecordInput): Promise<ContactRecord> {
    this.idCounter += 1;
    const record: ContactRecord = {
      id: input.id,
      displayName: input.displayName,
      phoneRaw: input.phoneRaw,
      phoneNormalized: input.phoneNormalized,
      emailRaw: input.emailRaw,
      emailNormalized: input.emailNormalized,
      status: ContactStatus.Active,
      createdBy: input.createdBy,
      createdAt: input.now,
      updatedAt: input.now,
      lastRelevantActivityAt: input.now,
    };
    this.contacts.set(record.id, record);
    return record;
  }

  async findPossibleMatches(criteria: PossibleMatchCriteria): Promise<readonly ContactRecord[]> {
    return [...this.contacts.values()].filter(
      (c) =>
        c.status === ContactStatus.Active &&
        ((criteria.phoneNormalized && c.phoneNormalized === criteria.phoneNormalized) ||
          (criteria.emailNormalized && c.emailNormalized === criteria.emailNormalized))
    );
  }

  async touchActivity(id: string, now: Date): Promise<void> {
    const existing = this.contacts.get(id);
    if (existing) this.contacts.set(id, { ...existing, lastRelevantActivityAt: now });
  }
}

export class FakeServicePeriodReader implements ServicePeriodReader {
  result: ServicePeriodValidation = { isValid: true };
  async validateReservation(): Promise<ServicePeriodValidation> {
    return this.result;
  }
}

/**
 * R1.6-P3A — in-memory ServiceDefinitionRepository fake, seeded with both
 * canonical rows enabled by default (matching the real migration seed),
 * so any test that doesn't care about this dimension gets the same
 * "everything works" behavior as the real repository without touching
 * Postgres. Tests that DO care call `setEnabled`/`remove` on a specific
 * code — never mutates the real, shared seeded `services` table any
 * integration test's own database connection might see.
 */
export class FakeServiceDefinitionRepository implements ServiceDefinitionRepository {
  private readonly rows = new Map<ServiceCode, ServiceDefinition>([
    ["lunch", { code: "lunch", displayName: "Lunch", enabled: true, createdAt: new Date(0), updatedAt: new Date(0) }],
    ["dinner", { code: "dinner", displayName: "Dinner", enabled: true, createdAt: new Date(0), updatedAt: new Date(0) }],
  ]);

  setEnabled(code: ServiceCode, enabled: boolean): void {
    const existing = this.rows.get(code);
    if (existing) this.rows.set(code, { ...existing, enabled });
  }

  /** Simulates a missing/never-seeded row — the fail-closed branch, distinct from an explicitly disabled one. */
  remove(code: ServiceCode): void {
    this.rows.delete(code);
  }

  async findByCode(code: ServiceCode): Promise<ServiceDefinition | null> {
    return this.rows.get(code) ?? null;
  }

  async list(): Promise<readonly ServiceDefinition[]> {
    return [...this.rows.values()].sort((a, b) => a.code.localeCompare(b.code));
  }

  /** R1.6-P3B — mirrors PrismaServiceDefinitionRepository.update()'s own contract: partial patch, `updatedAt` bumped only on an actual call, `null` for an unknown code. */
  async update(code: ServiceCode, patch: { readonly displayName?: string; readonly enabled?: boolean }): Promise<ServiceDefinition | null> {
    const existing = this.rows.get(code);
    if (!existing) return null;
    const updated: ServiceDefinition = {
      ...existing,
      ...(patch.displayName !== undefined ? { displayName: patch.displayName } : {}),
      ...(patch.enabled !== undefined ? { enabled: patch.enabled } : {}),
      updatedAt: new Date(),
    };
    this.rows.set(code, updated);
    return updated;
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
