import { PrismaClient } from "@prisma/client";
import { PrismaFloorRepository } from "../../../infrastructure/persistence/PrismaFloorRepository.js";
import { PrismaTransactionManager } from "../../../infrastructure/persistence/PrismaTransactionManager.js";
import { PrismaReservationRepository } from "../../../infrastructure/persistence/PrismaReservationRepository.js";
import { PrismaCapacityRepository } from "../../../infrastructure/persistence/PrismaCapacityRepository.js";
import { PrismaClosingDayStore } from "../../../infrastructure/persistence/PrismaClosingDayStore.js";
import { PrismaDuplicateReservationChecker } from "../../../infrastructure/persistence/PrismaDuplicateReservationChecker.js";
import { PrismaContactRepository } from "../../../infrastructure/persistence/PrismaContactRepository.js";
import { UnvalidatedServicePeriodReader } from "../../../infrastructure/UnvalidatedServicePeriodReader.js";
import { CreateReservationHandler } from "../../../application/command-handlers/CreateReservationHandler.js";
import { CreateContactHandler } from "../../../application/command-handlers/CreateContactHandler.js";
import { ModifyReservationHandler } from "../../../application/command-handlers/ModifyReservationHandler.js";
import { CancelReservationHandler } from "../../../application/command-handlers/CancelReservationHandler.js";
import { AvailabilityOrchestrator } from "../../../application/availability/AvailabilityOrchestrator.js";
import { SeatingOrchestrator } from "../../../application/floor/SeatingOrchestrator.js";
import { RandomIdGenerator } from "../../../infrastructure/RandomIdGenerator.js";
import { RandomEventIdGenerator } from "../../../infrastructure/RandomEventIdGenerator.js";
import { Clock } from "../../../application/ports/Clock.js";

class FixedClock implements Clock {
  constructor(private current: Date) {}
  now(): Date {
    return this.current;
  }
}

/**
 * R1.5 — mirrors tests/integration/support/testHarness.ts's own
 * buildHarness() shape, extended with the FloorRepository/
 * SeatingOrchestrator and an AvailabilityOrchestrator wired WITH the
 * seatingOrchestrator dependency, so cancel-with-seating-release
 * (AvailabilityOrchestrator.cancelWithCapacity's R1.5 integration point)
 * is exercisable end-to-end against real PostgreSQL.
 */
export function buildFloorHarness(prisma: PrismaClient, now: Date) {
  const floorRepository = new PrismaFloorRepository(prisma);
  const transactionManager = new PrismaTransactionManager(prisma);
  const idGenerator = new RandomIdGenerator();
  const eventIdGenerator = new RandomEventIdGenerator();
  const clock = new FixedClock(now);

  const seatingOrchestrator = new SeatingOrchestrator(floorRepository, transactionManager, idGenerator, clock);

  const reservationRepository = new PrismaReservationRepository(prisma);
  const capacityRepository = new PrismaCapacityRepository(prisma);
  const closingDayStore = new PrismaClosingDayStore(prisma);
  const duplicateChecker = new PrismaDuplicateReservationChecker(prisma);
  const contactRepository = new PrismaContactRepository(prisma);
  const servicePeriodReader = new UnvalidatedServicePeriodReader();
  const createContactHandler = new CreateContactHandler(contactRepository, idGenerator, clock);

  const createHandler = new CreateReservationHandler(
    reservationRepository,
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
  const modifyHandler = new ModifyReservationHandler(reservationRepository, eventIdGenerator, clock);
  const cancelHandler = new CancelReservationHandler(reservationRepository, eventIdGenerator, clock);

  const availabilityOrchestrator = new AvailabilityOrchestrator(
    reservationRepository,
    capacityRepository,
    transactionManager,
    closingDayStore,
    idGenerator,
    clock,
    createHandler,
    modifyHandler,
    cancelHandler,
    seatingOrchestrator
  );

  return { floorRepository, seatingOrchestrator, availabilityOrchestrator, reservationRepository, capacityRepository, closingDayStore, idGenerator, transactionManager };
}
