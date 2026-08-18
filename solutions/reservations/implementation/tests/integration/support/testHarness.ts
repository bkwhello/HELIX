import { PrismaClient } from "@prisma/client";
import { PrismaReservationRepository } from "../../../infrastructure/persistence/PrismaReservationRepository.js";
import { PrismaCapacityRepository } from "../../../infrastructure/persistence/PrismaCapacityRepository.js";
import { PrismaTransactionManager } from "../../../infrastructure/persistence/PrismaTransactionManager.js";
import { PrismaClosingDayStore } from "../../../infrastructure/persistence/PrismaClosingDayStore.js";
import { PrismaDuplicateReservationChecker } from "../../../infrastructure/persistence/PrismaDuplicateReservationChecker.js";
import { UnvalidatedContactReader } from "../../../infrastructure/UnvalidatedContactReader.js";
import { UnvalidatedServicePeriodReader } from "../../../infrastructure/UnvalidatedServicePeriodReader.js";
import { CreateReservationHandler } from "../../../application/command-handlers/CreateReservationHandler.js";
import { ModifyReservationHandler } from "../../../application/command-handlers/ModifyReservationHandler.js";
import { CancelReservationHandler } from "../../../application/command-handlers/CancelReservationHandler.js";
import { AvailabilityOrchestrator } from "../../../application/availability/AvailabilityOrchestrator.js";
import { IdGenerator } from "../../../application/ports/IdGenerator.js";
import { EventIdGenerator } from "../../../application/ports/EventIdGenerator.js";
import { Clock } from "../../../application/ports/Clock.js";
import { ContactReader } from "../../../application/ports/ContactReader.js";

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
  readonly contactReader?: ContactReader;
  readonly eventIdGenerator?: EventIdGenerator;
}

export function buildHarness(prisma: PrismaClient, now: Date, overrides: HarnessOverrides = {}) {
  const repository = new PrismaReservationRepository(prisma);
  const capacityRepository = new PrismaCapacityRepository(prisma);
  const transactionManager = new PrismaTransactionManager(prisma);
  const closingDayStore = new PrismaClosingDayStore(prisma);
  const duplicateChecker = new PrismaDuplicateReservationChecker(prisma);
  const contactReader = overrides.contactReader ?? new UnvalidatedContactReader();
  const servicePeriodReader = new UnvalidatedServicePeriodReader();
  const idGenerator = new SequentialIdGenerator("res");
  const eventIdGenerator = overrides.eventIdGenerator ?? new SequentialIdGenerator("evt");
  const clock = new MutableClock(now);

  const createHandler = new CreateReservationHandler(
    repository,
    duplicateChecker,
    contactReader,
    servicePeriodReader,
    closingDayStore,
    idGenerator,
    eventIdGenerator,
    clock
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

/** Wipes every table this suite touches. Safe only against the dedicated local test database configured in .env — never call against anything else. */
export async function resetDatabase(prisma: PrismaClient): Promise<void> {
  await prisma.$executeRawUnsafe(
    'TRUNCATE TABLE "capacity_commitments", "applied_commands", "reservation_events", "reservations", "closing_days" RESTART IDENTITY CASCADE'
  );
}
