import { PrismaClient } from "@prisma/client";
import { createApp } from "./app.js";
import { PrismaReservationRepository } from "../infrastructure/persistence/PrismaReservationRepository.js";
import { PrismaCapacityRepository } from "../infrastructure/persistence/PrismaCapacityRepository.js";
import { PrismaTransactionManager } from "../infrastructure/persistence/PrismaTransactionManager.js";
import { PrismaDuplicateReservationChecker } from "../infrastructure/persistence/PrismaDuplicateReservationChecker.js";
import { PrismaClosingDayStore } from "../infrastructure/persistence/PrismaClosingDayStore.js";
import { UnvalidatedContactReader } from "../infrastructure/UnvalidatedContactReader.js";
import { UnvalidatedServicePeriodReader } from "../infrastructure/UnvalidatedServicePeriodReader.js";
import { SystemClock } from "../infrastructure/SystemClock.js";
import { RandomIdGenerator } from "../infrastructure/RandomIdGenerator.js";
import { RandomEventIdGenerator } from "../infrastructure/RandomEventIdGenerator.js";

const prisma = new PrismaClient();
const app = createApp({
  repository: new PrismaReservationRepository(prisma),
  duplicateChecker: new PrismaDuplicateReservationChecker(prisma),
  // PLACEHOLDER adapters — see infrastructure/Unvalidated*.ts. Replace once
  // Contact Management and Service Period Management exist as capabilities.
  contactReader: new UnvalidatedContactReader(),
  servicePeriodReader: new UnvalidatedServicePeriodReader(),
  closingDayStore: new PrismaClosingDayStore(prisma),
  idGenerator: new RandomIdGenerator(),
  eventIdGenerator: new RandomEventIdGenerator(),
  clock: new SystemClock(),
  // CAP-D02.03 — mounts the /availability/* routes. Requires PostgreSQL
  // (pg_advisory_xact_lock, shared interactive transactions) — see
  // prisma/schema.prisma's header comment.
  capacity: {
    capacityRepository: new PrismaCapacityRepository(prisma),
    transactionManager: new PrismaTransactionManager(prisma),
  },
});

const port = Number(process.env["PORT"] ?? 3001);
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`CAP-D01.01 Reservation Management API listening on http://localhost:${port}`);
});
