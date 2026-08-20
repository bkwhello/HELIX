import { PrismaClient } from "@prisma/client";
import { createApp } from "./app.js";
import { PrismaReservationRepository } from "../infrastructure/persistence/PrismaReservationRepository.js";
import { PrismaCapacityRepository } from "../infrastructure/persistence/PrismaCapacityRepository.js";
import { PrismaTransactionManager } from "../infrastructure/persistence/PrismaTransactionManager.js";
import { PrismaDuplicateReservationChecker } from "../infrastructure/persistence/PrismaDuplicateReservationChecker.js";
import { PrismaClosingDayStore } from "../infrastructure/persistence/PrismaClosingDayStore.js";
import { PrismaStaffUserRepository } from "../infrastructure/persistence/PrismaStaffUserRepository.js";
import { PrismaSessionRepository } from "../infrastructure/persistence/PrismaSessionRepository.js";
import { PrismaLoginAttemptTracker } from "../infrastructure/persistence/PrismaLoginAttemptTracker.js";
import { ScryptPasswordHasher } from "../infrastructure/ScryptPasswordHasher.js";
import { RandomSessionTokenGenerator } from "../infrastructure/RandomSessionTokenGenerator.js";
import { PrismaContactRepository } from "../infrastructure/persistence/PrismaContactRepository.js";
import { UnvalidatedServicePeriodReader } from "../infrastructure/UnvalidatedServicePeriodReader.js";
import { SystemClock } from "../infrastructure/SystemClock.js";
import { RandomIdGenerator } from "../infrastructure/RandomIdGenerator.js";
import { RandomEventIdGenerator } from "../infrastructure/RandomEventIdGenerator.js";
import { PrismaCommunicationOutboxRepository } from "../infrastructure/persistence/PrismaCommunicationOutboxRepository.js";
import { PrismaGuestManagementCredentialRepository } from "../infrastructure/persistence/PrismaGuestManagementCredentialRepository.js";

const prisma = new PrismaClient();
// R1_2_IDENTITY_ACCESS_FINAL_ARCHITECTURE.md §21 — same-origin deployment
// (this Express process serves both the API and the static pilot UI, see
// api/app.ts's express.static(publicDir)). Set APP_ORIGIN in production
// to also enable the CSRF guard's Origin check; unset (null) in local
// dev, where only the custom-header check applies.
const appOrigin = process.env["APP_ORIGIN"] ?? null;
const app = createApp({
  repository: new PrismaReservationRepository(prisma),
  duplicateChecker: new PrismaDuplicateReservationChecker(prisma),
  // CAP-D05.01 — real, PostgreSQL-backed Contact Management (R1.3-I1),
  // replacing the old UnvalidatedContactReader placeholder.
  contactRepository: new PrismaContactRepository(prisma),
  // PLACEHOLDER adapter — see infrastructure/Unvalidated*.ts. Replace once
  // Service Period Management exists as a capability.
  servicePeriodReader: new UnvalidatedServicePeriodReader(),
  closingDayStore: new PrismaClosingDayStore(prisma),
  idGenerator: new RandomIdGenerator(),
  eventIdGenerator: new RandomEventIdGenerator(),
  clock: new SystemClock(),
  transactionManager: new PrismaTransactionManager(prisma),
  // CAP-D02.03 — mounts the /availability/* routes. Requires PostgreSQL
  // (pg_advisory_xact_lock, shared interactive transactions) — see
  // prisma/schema.prisma's header comment.
  capacity: {
    capacityRepository: new PrismaCapacityRepository(prisma),
    transactionManager: new PrismaTransactionManager(prisma),
  },
  // R1.6-B — mounts confirmation/reminder enqueue and the staff resend
  // route. Real EmailDeliveryPort/provider selection remains a separate,
  // later gate (assignment §46) — this deployment wires only the durable
  // outbox/token persistence, never a real send; nothing here calls out
  // to a mail provider. `tokenGenerator` reuses the exact same
  // `RandomSessionTokenGenerator` mechanism as staff sessions (a
  // different instance — guest tokens are never staff sessions).
  communications: {
    outboxRepository: new PrismaCommunicationOutboxRepository(prisma),
    credentialRepository: new PrismaGuestManagementCredentialRepository(prisma),
    tokenGenerator: new RandomSessionTokenGenerator(),
  },
  // R1.2 — Identity & Access. NODE_ENV=production is when the session
  // cookie's Secure flag is actually enforced (plain http://localhost in
  // dev would otherwise silently drop the cookie).
  auth: {
    staffUserRepository: new PrismaStaffUserRepository(prisma),
    sessionRepository: new PrismaSessionRepository(prisma),
    passwordHasher: new ScryptPasswordHasher(),
    sessionTokenGenerator: new RandomSessionTokenGenerator(),
    cookieSecure: process.env["NODE_ENV"] === "production",
    expectedOrigin: appOrigin,
    // R1.2 final P1 closure — login abuse protection.
    loginAttemptTracker: new PrismaLoginAttemptTracker(prisma),
  },
});

const port = Number(process.env["PORT"] ?? 3001);
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`CAP-D01.01 Reservation Management API listening on http://localhost:${port}`);
});
