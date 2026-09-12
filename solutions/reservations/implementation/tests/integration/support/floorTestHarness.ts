import { PrismaClient } from "@prisma/client";
import { PrismaFloorRepository } from "../../../infrastructure/persistence/PrismaFloorRepository.js";
import { PrismaTransactionManager } from "../../../infrastructure/persistence/PrismaTransactionManager.js";
import { PrismaReservationRepository } from "../../../infrastructure/persistence/PrismaReservationRepository.js";
import { PrismaCapacityRepository } from "../../../infrastructure/persistence/PrismaCapacityRepository.js";
import { PrismaClosingDayStore } from "../../../infrastructure/persistence/PrismaClosingDayStore.js";
import { PrismaDuplicateReservationChecker } from "../../../infrastructure/persistence/PrismaDuplicateReservationChecker.js";
import { PrismaContactRepository } from "../../../infrastructure/persistence/PrismaContactRepository.js";
import { UnvalidatedServicePeriodReader } from "../../../infrastructure/UnvalidatedServicePeriodReader.js";
import { ServicePeriodReader } from "../../../application/ports/ServicePeriodReader.js";
import { ServiceSessionRepository } from "../../../domain/repositories/ServiceSessionRepository.js";
import { CreateReservationHandler } from "../../../application/command-handlers/CreateReservationHandler.js";
import { CreateContactHandler } from "../../../application/command-handlers/CreateContactHandler.js";
import { ConfirmReservationHandler } from "../../../application/command-handlers/ConfirmReservationHandler.js";
import { ModifyReservationHandler } from "../../../application/command-handlers/ModifyReservationHandler.js";
import { CancelReservationHandler } from "../../../application/command-handlers/CancelReservationHandler.js";
import { CompleteReservationHandler } from "../../../application/command-handlers/CompleteReservationHandler.js";
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
/**
 * R1.6-P2B — `servicePeriodReader` is optional, defaulting to
 * `UnvalidatedServicePeriodReader` exactly as before, so every existing
 * caller (dozens, across the floor-seating test files, all using
 * arbitrary "sp-*" fixture values) is completely unaffected. Pass
 * `CanonicalServicePeriodReader` explicitly only from a test that
 * specifically needs the real lunch/dinner validation boundary.
 */
export function buildFloorHarness(
  prisma: PrismaClient,
  now: Date,
  servicePeriodReaderOverride?: ServicePeriodReader,
  /**
   * R1.6-P2C-1 — optional, defaulting to `undefined` (no session gate
   * enforced), so every existing caller of `buildFloorHarness` (dozens,
   * across the floor-seating test files) is completely unaffected. Pass
   * a real `ServiceSessionRepository` only from a test that specifically
   * exercises session enforcement.
   */
  serviceSessionRepositoryOverride?: ServiceSessionRepository
) {
  const floorRepository = new PrismaFloorRepository(prisma);
  const transactionManager = new PrismaTransactionManager(prisma);
  const idGenerator = new RandomIdGenerator();
  const eventIdGenerator = new RandomEventIdGenerator();
  const clock = new FixedClock(now);

  const seatingOrchestrator = new SeatingOrchestrator(floorRepository, transactionManager, idGenerator, clock, serviceSessionRepositoryOverride);

  const reservationRepository = new PrismaReservationRepository(prisma);
  const capacityRepository = new PrismaCapacityRepository(prisma);
  const closingDayStore = new PrismaClosingDayStore(prisma);
  const duplicateChecker = new PrismaDuplicateReservationChecker(prisma);
  const contactRepository = new PrismaContactRepository(prisma);
  const servicePeriodReader = servicePeriodReaderOverride ?? new UnvalidatedServicePeriodReader();
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
  const modifyHandler = new ModifyReservationHandler(reservationRepository, eventIdGenerator, clock, servicePeriodReader);
  const cancelHandler = new CancelReservationHandler(reservationRepository, eventIdGenerator, clock);
  const completeHandler = new CompleteReservationHandler(reservationRepository, eventIdGenerator, clock);
  // R1.5-P1B — needed by tests that must reach a real "Confirmed" status
  // (e.g. before Complete, which CAP-D01.01-R29 only allows from
  // Confirmed) when exercising the authoritative createWithCapacity path,
  // which leaves a reservation "Proposed" until explicitly confirmed.
  const confirmHandler = new ConfirmReservationHandler(reservationRepository, eventIdGenerator, clock);

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
    seatingOrchestrator,
    // servicePeriodService — not exercised by this harness.
    undefined,
    // R1.5-P1A — lets completeWithCapacity be exercised end-to-end
    // against real PostgreSQL, mirroring cancel-with-seating-release above.
    completeHandler,
    serviceSessionRepositoryOverride
  );

  return { floorRepository, seatingOrchestrator, availabilityOrchestrator, reservationRepository, capacityRepository, closingDayStore, idGenerator, transactionManager, completeHandler, confirmHandler };
}
