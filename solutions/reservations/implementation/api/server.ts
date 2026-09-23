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
import { CanonicalServicePeriodReader } from "../infrastructure/CanonicalServicePeriodReader.js";
import { PrismaServiceDefinitionRepository } from "../infrastructure/persistence/PrismaServiceDefinitionRepository.js";
import { SystemClock } from "../infrastructure/SystemClock.js";
import { RandomIdGenerator } from "../infrastructure/RandomIdGenerator.js";
import { RandomEventIdGenerator } from "../infrastructure/RandomEventIdGenerator.js";
import { PrismaCommunicationOutboxRepository } from "../infrastructure/persistence/PrismaCommunicationOutboxRepository.js";
import { PrismaGuestManagementCredentialRepository } from "../infrastructure/persistence/PrismaGuestManagementCredentialRepository.js";
import { PrismaServicePeriodOverrideStore } from "../infrastructure/persistence/PrismaServicePeriodOverrideStore.js";
import { ServicePeriodService } from "../application/availability/ServicePeriodService.js";
import { PrismaFloorRepository } from "../infrastructure/persistence/PrismaFloorRepository.js";
import { PrismaServiceSessionRepository } from "../infrastructure/persistence/PrismaServiceSessionRepository.js";
import { PrismaFloorplanRepository } from "../infrastructure/persistence/PrismaFloorplanRepository.js";
import { PrismaSecurityEventRecorder } from "../infrastructure/persistence/PrismaSecurityEventRecorder.js";
import { PrismaSecurityEventReader } from "../infrastructure/persistence/PrismaSecurityEventReader.js";
import { resolveAppHost, startListening } from "./serverConfig.js";

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
  // R1.6-P2B — the real, canonical lunch/dinner Service-code validator,
  // replacing the old always-valid UnvalidatedServicePeriodReader
  // placeholder. See domain/availability/Service.ts — this is a minimum,
  // code-level-only slice of CAP-D02.01, not the full live per-date
  // Service Period lifecycle (CAP-D02.02, still Designed/unimplemented).
  //
  // R1.6-P3A — also now consults the persisted Service catalog
  // (CAP-D02.01's own foundation) via the SAME shared `prisma` client as
  // every other adapter here — no second connection. MIGRATION
  // PREREQUISITE: this deployment requires migration
  // `20260922145528_add_service_catalog` to be applied
  // (`prisma migrate deploy`) before this process starts — it seeds the
  // two canonical rows (`lunch`, `dinner`, both enabled) this reader
  // looks up on every reservation create/modify/walk-in. Without it,
  // every Service-code validation fails closed (CAP-D02.01-R01), not
  // silently passes — see CanonicalServicePeriodReader.ts's own doc
  // comment.
  servicePeriodReader: new CanonicalServicePeriodReader(new PrismaServiceDefinitionRepository(prisma)),
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
    // R1.6-C0 — CAP-D02 ServicePeriod authority, mandatory whenever
    // capacity-aware routes are mounted at all (AppDependencies.capacity's
    // own doc comment).
    servicePeriodService: new ServicePeriodService(new PrismaClosingDayStore(prisma), new PrismaServicePeriodOverrideStore(prisma)),
  },
  // P1-B1 — CAP-D04.01 runtime wiring (dependency composition only, no new
  // routes mounted by this deployment yet). Makes AvailabilityOrchestrator.
  // cancelWithCapacity's existing, previously-always-inert R1.5 seating-
  // release integration point active; has no observable effect until a
  // future increment adds a route that can create a SeatingAssignment,
  // since none exists today for this integration point to ever find.
  floor: {
    floorRepository: new PrismaFloorRepository(prisma),
    prisma,
  },
  // R1.6-P2C-1 — Operational Service Session lifecycle enforcement. Same
  // shared `prisma` client every other adapter above uses (never a second
  // connection), same `PrismaTransactionManager` pattern as `capacity`
  // above. Mounts the five /service-sessions* routes and makes
  // SeatingOrchestrator/AvailabilityOrchestrator enforce the session gate
  // on every live assign/pre-assign/mark-seated/move/modify-revalidation
  // path.
  //
  // DEPLOYMENT PRECONDITION: migration `20260910153637_add_service_session`
  // (adds the `service_sessions` table) MUST be applied to whatever
  // database this process connects to (via `prisma migrate deploy`)
  // BEFORE starting a build that includes this wiring — every session-gate
  // read/write below goes through PrismaServiceSessionRepository, which
  // depends on that table existing. This repository was not applied to
  // `helix_reservations_dev` as of this change (R1.6-P2C-1 STOP-gate
  // report) — do not start this server against that database until a
  // separate, explicit migration-application step has run.
  //
  // R1.5-P2C — `floorplanRepository` (SAME shared `prisma` client, a
  // second stateless PrismaFloorplanRepository instance — no second
  // connection) is now mandatory here too: ServiceSessionService.open()
  // reads MAIN_FLOORPLAN_ID's default version through it, with no
  // production no-op fallback.
  //
  // DEPLOYMENT PRECONDITION (additional): migration
  // `20260917081629_add_service_session_floorplan_snapshot` (adds
  // `service_sessions.floorplan_version_id`, its FK, and the Opened/Closed
  // CHECK constraint) MUST also be applied before starting a build that
  // includes this wiring. As of this change, this migration has been
  // applied to `helix_reservations_test` ONLY — NOT to
  // `helix_reservations_dev` (R1.5-P2C STOP-gate report) — do not start
  // this server against that database until a separate, explicit
  // migration-application step has run, mirroring R1.6-P2C-1/1A's own
  // precedent.
  serviceSessions: {
    serviceSessionRepository: new PrismaServiceSessionRepository(prisma),
    transactionManager: new PrismaTransactionManager(prisma),
    floorplanRepository: new PrismaFloorplanRepository(prisma),
  },
  // R1.5-P2B — CAP-D03.02 Floorplan Management, authoring/default-version
  // foundation only. Same shared `prisma` client every other adapter
  // above uses (never a second connection). Mounts the `/floorplans*`
  // routes; wires nothing into ServiceSession/seatability (R1.5-P2A
  // stages 3/4, unbuilt) — this block has no effect on any existing
  // request path.
  //
  // DEPLOYMENT PRECONDITION: migration `20260914073245_add_floorplan_versioning`
  // must be applied (via `prisma migrate deploy`) to whatever database
  // this process connects to BEFORE starting a build that includes this
  // wiring — every /floorplans* read/write goes through
  // PrismaFloorplanRepository, which depends on the floorplans/
  // floorplan_versions/floorplan_version_resources tables existing. This
  // migration was NOT applied to `helix_reservations_dev` as of this
  // change (R1.5-P2B STOP-gate report) — do not start this server
  // against that database until a separate, explicit migration-
  // application step has run, mirroring R1.6-P2C-1/1A's own precedent.
  floorplans: {
    floorplanRepository: new PrismaFloorplanRepository(prisma),
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
    // R1.2-P2 — the same shared PrismaClient every other adapter above uses, never a second connection.
    securityEventRecorder: new PrismaSecurityEventRecorder(prisma),
    // R1.7-P1 — mounts GET /security-events. Same shared PrismaClient as securityEventRecorder above.
    securityEventReader: new PrismaSecurityEventReader(prisma),
  },
});

const port = Number(process.env["PORT"] ?? 3001);
// P1-B11A — explicit loopback-only bind by default (see api/serverConfig.ts).
// Previously `app.listen(port, ...)` with no host argument, which binds all
// interfaces. A non-loopback value (e.g. "0.0.0.0") requires explicitly
// setting APP_HOST for a future real deployment environment — never the
// default.
const appHost = resolveAppHost();
startListening(app, port, appHost);
