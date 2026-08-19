import { PrismaClient } from "@prisma/client";
import { PrismaReservationRepository } from "../../../infrastructure/persistence/PrismaReservationRepository.js";
import { PrismaCapacityRepository } from "../../../infrastructure/persistence/PrismaCapacityRepository.js";
import { PrismaTransactionManager } from "../../../infrastructure/persistence/PrismaTransactionManager.js";
import { PrismaClosingDayStore } from "../../../infrastructure/persistence/PrismaClosingDayStore.js";
import { PrismaDuplicateReservationChecker } from "../../../infrastructure/persistence/PrismaDuplicateReservationChecker.js";
import { PrismaContactRepository } from "../../../infrastructure/persistence/PrismaContactRepository.js";
import { UnvalidatedServicePeriodReader } from "../../../infrastructure/UnvalidatedServicePeriodReader.js";
import { CreateReservationHandler } from "../../../application/command-handlers/CreateReservationHandler.js";
import { CreateContactHandler } from "../../../application/command-handlers/CreateContactHandler.js";
import { ModifyReservationHandler } from "../../../application/command-handlers/ModifyReservationHandler.js";
import { CancelReservationHandler } from "../../../application/command-handlers/CancelReservationHandler.js";
import { AvailabilityOrchestrator } from "../../../application/availability/AvailabilityOrchestrator.js";
import { IdGenerator } from "../../../application/ports/IdGenerator.js";
import { EventIdGenerator } from "../../../application/ports/EventIdGenerator.js";
import { Clock } from "../../../application/ports/Clock.js";
import { ContactRepository } from "../../../application/ports/ContactRepository.js";
import { truncateReservationDomainTables } from "./testDatabaseSafety.js";

let counter = 0;
/** Distinct, human-inspectable IDs per test run — not cryptographically random, which is irrelevant for tests and would make failures harder to read. */
export class SequentialIdGenerator implements IdGenerator, EventIdGenerator {
  private readonly prefix: string;
  constructor(prefix: string) {
    this.prefix = prefix;
  }
  generate(): string {
    counter += 1;
    return `${this.prefix}-${counter}`;
  }
}

export class MutableClock implements Clock {
  constructor(private current: Date) {}
  now(): Date {
    return this.current;
  }
  set(date: Date): void {
    this.current = date;
  }
}

export interface HarnessOverrides {
  readonly contactRepository?: ContactRepository;
  readonly eventIdGenerator?: EventIdGenerator;
}

export function buildHarness(prisma: PrismaClient, now: Date, overrides: HarnessOverrides = {}) {
  const repository = new PrismaReservationRepository(prisma);
  const capacityRepository = new PrismaCapacityRepository(prisma);
  const transactionManager = new PrismaTransactionManager(prisma);
  const closingDayStore = new PrismaClosingDayStore(prisma);
  const duplicateChecker = new PrismaDuplicateReservationChecker(prisma);
  const contactRepository = overrides.contactRepository ?? new PrismaContactRepository(prisma);
  const servicePeriodReader = new UnvalidatedServicePeriodReader();
  const idGenerator = new SequentialIdGenerator("res");
  const eventIdGenerator = overrides.eventIdGenerator ?? new SequentialIdGenerator("evt");
  const clock = new MutableClock(now);
  const createContactHandler = new CreateContactHandler(contactRepository, idGenerator, clock);

  const createHandler = new CreateReservationHandler(
    repository,
    duplicateChecker,
    contactRepository,
    createContactHandler,
    servicePeriodReader,
    closingDayStore,
    idGenerator,
    eventIdGenerator,
    clock,
    transactionManager
  );
  const modifyHandler = new ModifyReservationHandler(repository, eventIdGenerator, clock);
  const cancelHandler = new CancelReservationHandler(repository, eventIdGenerator, clock);

  const orchestrator = new AvailabilityOrchestrator(
    repository,
    capacityRepository,
    transactionManager,
    closingDayStore,
    idGenerator,
    clock,
    createHandler,
    modifyHandler,
    cancelHandler
  );

  return { repository, capacityRepository, transactionManager, closingDayStore, orchestrator, clock, idGenerator, createHandler, cancelHandler };
}

/**
 * Wipes every reservation-domain table this suite touches.
 *
 * R1.4 P0: this used to run TRUNCATE directly, relying on a code comment
 * ("safe only against the dedicated local test database... never call
 * against anything else") to keep it from ever hitting the pilot's live
 * database — a comment enforces nothing. It now delegates to
 * testDatabaseSafety.ts's assertSafeToReset() first, which independently
 * re-verifies the connected database's name and a provisioned sentinel
 * row before this function's TRUNCATE is ever reached. See that module
 * for the full reasoning.
 */
export async function resetDatabase(prisma: PrismaClient): Promise<void> {
  await truncateReservationDomainTables(prisma);
}

/**
 * CAP-D05.01 — a real, valid Contact many integration tests reference by
 * the literal id "contact-1" (pre-dating this capability, when contactId
 * was an unvalidated string). Call after resetDatabase() in any suite
 * that still uses that literal id in a request.
 */
export async function seedTestContact(prisma: PrismaClient, id = "contact-1"): Promise<void> {
  await prisma.contact.create({
    data: {
      id,
      displayName: "Integration Test Guest",
      phoneRaw: "0699999999",
      phoneNormalized: "+31699999999",
      createdBy: "staff-1",
      lastRelevantActivityAt: new Date(),
    },
  });
}
