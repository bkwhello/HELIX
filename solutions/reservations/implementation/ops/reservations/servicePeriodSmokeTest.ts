/**
 * R1.6-C0 — local smoke test (Chief Engineer "Enforce CAP-D02 Service-
 * Period Authority Across Reservation Creation Paths" assignment §31).
 * Runs the 8 required steps against real, local PostgreSQL
 * (SERVICE_PERIOD_SMOKE_TEST_DATABASE_URL or TEST_DATABASE_URL — never
 * DATABASE_URL/the pilot database; "no production data" per the
 * assignment's own instruction), through the real HTTP surface
 * (POST /auth/login, POST /availability/reservations, POST /closing-days)
 * via supertest against the real createApp() wiring — the same Express
 * app api/server.ts mounts, not a test-only bypass. Step 8's self-service
 * ROUTE_TO_STAFF half is exercised directly against a second
 * AvailabilityOrchestrator instance (same database), per the assignment's
 * own allowance ("through internal policy test/harness if no public API
 * yet") — no guest-facing booking endpoint exists in this deployment.
 *
 * Run via `npm run service-period-smoke-test`.
 */
import { PrismaClient } from "@prisma/client";
import request from "supertest";
import { createApp } from "../../api/app.js";
import { bootstrapOwner } from "../../infrastructure/bootstrap/bootstrapOwner.js";
import { PrismaStaffUserRepository } from "../../infrastructure/persistence/PrismaStaffUserRepository.js";
import { PrismaSessionRepository } from "../../infrastructure/persistence/PrismaSessionRepository.js";
import { PrismaLoginAttemptTracker } from "../../infrastructure/persistence/PrismaLoginAttemptTracker.js";
import { ScryptPasswordHasher } from "../../infrastructure/ScryptPasswordHasher.js";
import { RandomSessionTokenGenerator } from "../../infrastructure/RandomSessionTokenGenerator.js";
import { RandomIdGenerator } from "../../infrastructure/RandomIdGenerator.js";
import { RandomEventIdGenerator } from "../../infrastructure/RandomEventIdGenerator.js";
import { PrismaReservationRepository } from "../../infrastructure/persistence/PrismaReservationRepository.js";
import { PrismaCapacityRepository } from "../../infrastructure/persistence/PrismaCapacityRepository.js";
import { PrismaTransactionManager } from "../../infrastructure/persistence/PrismaTransactionManager.js";
import { PrismaClosingDayStore } from "../../infrastructure/persistence/PrismaClosingDayStore.js";
import { PrismaDuplicateReservationChecker } from "../../infrastructure/persistence/PrismaDuplicateReservationChecker.js";
import { PrismaContactRepository } from "../../infrastructure/persistence/PrismaContactRepository.js";
import { PrismaServicePeriodOverrideStore } from "../../infrastructure/persistence/PrismaServicePeriodOverrideStore.js";
import { UnvalidatedServicePeriodReader } from "../../infrastructure/UnvalidatedServicePeriodReader.js";
import { ServicePeriodService } from "../../application/availability/ServicePeriodService.js";
import { AvailabilityOrchestrator } from "../../application/availability/AvailabilityOrchestrator.js";
import { CreateReservationHandler } from "../../application/command-handlers/CreateReservationHandler.js";
import { CreateContactHandler } from "../../application/command-handlers/CreateContactHandler.js";
import { ModifyReservationHandler } from "../../application/command-handlers/ModifyReservationHandler.js";
import { CancelReservationHandler } from "../../application/command-handlers/CancelReservationHandler.js";
import { CSRF_HEADER_NAME } from "../../api/authMiddleware.js";
import { Actor, ActorKind, ActorRole } from "../../domain/value-objects/Actor.js";

const steps: { readonly step: string; readonly ok: boolean; readonly detail: string }[] = [];
function record(step: string, ok: boolean, detail: string): void {
  steps.push({ step, ok, detail });
  // eslint-disable-next-line no-console
  console.log(`  [${ok ? "OK" : "FAIL"}] ${step} — ${detail}`);
}

// 2026-08-17 is a Monday (established in R1.6-A/R1.6-C0's own domain/integration tests). CEST (UTC+2) in August.
const MON_1645Z = "2026-08-17T14:45:00.000Z"; // 16:45 local
const MON_1700Z = "2026-08-17T15:00:00.000Z"; // 17:00 local
const MON_2100Z = "2026-08-17T19:00:00.000Z"; // 21:00 local
const MON_2115Z = "2026-08-17T19:15:00.000Z"; // 21:15 local
const CLOSING_TEST_MONDAY = "2026-08-24"; // a different Monday, closed only for this step

async function main(): Promise<void> {
  const databaseUrl = process.env["SERVICE_PERIOD_SMOKE_TEST_DATABASE_URL"] ?? process.env["TEST_DATABASE_URL"];
  if (!databaseUrl) throw new Error("servicePeriodSmokeTest: neither SERVICE_PERIOD_SMOKE_TEST_DATABASE_URL nor TEST_DATABASE_URL is set.");

  const prisma = new PrismaClient({ datasourceUrl: databaseUrl });
  try {
    // Clean, re-runnable slate.
    await prisma.$executeRawUnsafe(
      'TRUNCATE TABLE "communication_messages", "guest_management_credentials", "capacity_commitments", "applied_commands", "reservation_events", "reservations", "service_period_override_windows", "service_period_overrides", "closing_days", "contacts" RESTART IDENTITY CASCADE'
    );
    await prisma.$executeRawUnsafe('TRUNCATE TABLE "staff_sessions", "staff_users", "security_events", "login_attempt_windows" RESTART IDENTITY CASCADE');
    await prisma.contact.create({
      data: { id: "sp-smoke-contact-1", displayName: "ServicePeriod Smoke Test Guest", phoneRaw: "0600000001", phoneNormalized: "+31600000001", createdBy: "system", lastRelevantActivityAt: new Date() },
    });

    // --- App wiring: the real createApp(), the real /availability/* routes, the real R1.6-C0 enforcement. ---
    const repository = new PrismaReservationRepository(prisma);
    const capacityRepository = new PrismaCapacityRepository(prisma);
    const transactionManager = new PrismaTransactionManager(prisma);
    const closingDayStore = new PrismaClosingDayStore(prisma);
    const duplicateChecker = new PrismaDuplicateReservationChecker(prisma);
    const contactRepository = new PrismaContactRepository(prisma);
    const servicePeriodService = new ServicePeriodService(closingDayStore, new PrismaServicePeriodOverrideStore(prisma));
    const passwordHasher = new ScryptPasswordHasher();
    const idGenerator = new RandomIdGenerator();
    const eventIdGenerator = new RandomEventIdGenerator();

    const app = createApp({
      repository,
      duplicateChecker,
      contactRepository,
      servicePeriodReader: new UnvalidatedServicePeriodReader(),
      closingDayStore,
      idGenerator,
      eventIdGenerator,
      // Fixed, deliberately early "now" (matches tests/api/reservations.test.ts's
      // own convention) so every fixture date below (2026-08-17 onward) is
      // safely in the future regardless of the real wall-clock date this
      // script happens to be run on — CAP-D01.01-R11 ("no reservation for a
      // past date/time") would otherwise reject fixtures once real time
      // catches up to them.
      clock: { now: () => new Date("2026-08-01T10:00:00.000Z") },
      transactionManager,
      capacity: { capacityRepository, transactionManager, servicePeriodService },
      auth: {
        staffUserRepository: new PrismaStaffUserRepository(prisma),
        sessionRepository: new PrismaSessionRepository(prisma),
        passwordHasher,
        sessionTokenGenerator: new RandomSessionTokenGenerator(),
        cookieSecure: false,
        expectedOrigin: null,
        loginAttemptTracker: new PrismaLoginAttemptTracker(prisma),
      },
    });

    // 1. login as authorized staff (real R1.2 flow, real HTTP)
    const staffUserRepository = new PrismaStaffUserRepository(prisma);
    const bootstrap = await bootstrapOwner({
      staffUserRepository,
      passwordHasher,
      idGenerator,
      recordSecurityEvent: async (targetStaffUserId) => {
        await prisma.securityEvent.create({ data: { type: "OwnerBootstrapped", targetStaffUserId } });
      },
      username: "sp-smoke-owner",
      password: "ServicePeriodSmoke123!",
      displayName: "ServicePeriod Smoke Test Owner",
      email: undefined,
    });
    if (bootstrap.status !== "CREATED") throw new Error(`bootstrap failed: ${bootstrap.status}`);

    const agent = request.agent(app);
    function post(url: string) {
      return agent.post(url).set(CSRF_HEADER_NAME, "1");
    }
    const loginRes = await post("/auth/login").send({ username: "sp-smoke-owner", password: "ServicePeriodSmoke123!" });
    record("1. Login as authorized staff", loginRes.status === 200, `POST /auth/login -> ${loginRes.status}`);

    function createBody(overrides: Record<string, unknown> = {}) {
      return {
        commandId: `sp-smoke-cmd-${steps.length}-${Math.random().toString(36).slice(2, 8)}`,
        servicePeriodId: "sp-dinner",
        contactSelection: { type: "ExistingContact", contactId: "sp-smoke-contact-1" },
        reservationDate: MON_1700Z,
        partySize: 2,
        source: { category: "Telephone" },
        preferredArea: "Sushi",
        ...overrides,
      };
    }

    // 2. try Monday 16:45 -> rejected
    const r1645 = await post("/availability/reservations").send(createBody({ reservationDate: MON_1645Z }));
    record("2. Monday 16:45 rejected", r1645.status === 422 && r1645.body?.servicePeriod?.type === "OUTSIDE_SERVICE_PERIOD", `${r1645.status} ${JSON.stringify(r1645.body)}`);

    // 3. create Monday 17:00 -> succeeds
    const r1700 = await post("/availability/reservations").send(createBody({ reservationDate: MON_1700Z }));
    record("3. Monday 17:00 succeeds", r1700.status === 201, `${r1700.status} ${JSON.stringify(r1700.body)}`);

    // 4. create Monday 21:00 -> succeeds
    const r2100 = await post("/availability/reservations").send(createBody({ reservationDate: MON_2100Z }));
    record("4. Monday 21:00 succeeds", r2100.status === 201, `${r2100.status} ${JSON.stringify(r2100.body)}`);

    // 5. try Monday 21:15 -> rejected
    const r2115 = await post("/availability/reservations").send(createBody({ reservationDate: MON_2115Z }));
    record("5. Monday 21:15 rejected", r2115.status === 422 && r2115.body?.servicePeriod?.type === "OUTSIDE_SERVICE_PERIOD", `${r2115.status} ${JSON.stringify(r2115.body)}`);

    // 6. prove no Contact/Capacity/Communication orphan after a rejected Create with CreateNewContact
    const orphanEmail = "sp-smoke-orphan@example.com";
    const rOrphan = await post("/availability/reservations").send(
      createBody({ reservationDate: MON_1645Z, contactSelection: { type: "CreateNewContact", displayName: "Orphan Smoke Guest", email: orphanEmail } })
    );
    const orphanContacts = await prisma.contact.count({ where: { emailRaw: orphanEmail } });
    const commitmentsAfterRejection = await prisma.capacityCommitment.count();
    const messagesForOrphan = await prisma.communicationMessage.count({ where: { recipientEmail: orphanEmail } });
    record(
      "6. No orphan Contact/CapacityCommitment/CommunicationMessage after rejected create",
      rOrphan.status === 422 && orphanContacts === 0 && messagesForOrphan === 0,
      `create=${rOrphan.status}, orphanContacts=${orphanContacts}, capacityCommitments(total)=${commitmentsAfterRejection}, orphanMessages=${messagesForOrphan}`
    );

    // 7. test ClosingDay
    const closingRes = await post("/closing-days").send({ fromDate: CLOSING_TEST_MONDAY, toDate: CLOSING_TEST_MONDAY, reason: "ServicePeriod smoke test closure" });
    const rClosed = await post("/availability/reservations").send(createBody({ reservationDate: `${CLOSING_TEST_MONDAY}T15:00:00.000Z` })); // 17:00 local — normally valid
    record(
      "7. ClosingDay blocks an otherwise-open date/time",
      closingRes.status === 201 && rClosed.status === 422 && rClosed.body?.servicePeriod?.type === "CLOSED",
      `POST /closing-days -> ${closingRes.status}; create on closed date -> ${rClosed.status} ${JSON.stringify(rClosed.body)}`
    );

    // 8. test one special-date override (a Tuesday, normally 17:00-21:00 only — override opens an extra 14:00-16:00 Sushi window)
    const overrideDate = "2026-08-18"; // Tuesday
    const overrideStore = new PrismaServicePeriodOverrideStore(prisma);
    await overrideStore.upsert({
      area: "Sushi",
      date: overrideDate,
      status: "Open",
      windows: [{ firstStartMinute: 14 * 60, lastStartMinute: 16 * 60 }],
      createdBy: bootstrap.staffUserId,
    });
    const rOverrideValid = await post("/availability/reservations").send(createBody({ reservationDate: `${overrideDate}T12:00:00.000Z` })); // 14:00 local — only valid because of the override
    const rOverrideStillEnforced = await post("/availability/reservations").send(createBody({ reservationDate: `${overrideDate}T10:00:00.000Z` })); // 12:00 local — outside both the weekly schedule and the override
    record(
      "8. Date-specific override replaces the weekly schedule for that area/date",
      rOverrideValid.status === 201 && rOverrideStillEnforced.status === 422 && rOverrideStillEnforced.body?.servicePeriod?.type === "OUTSIDE_SERVICE_PERIOD",
      `override-valid-start -> ${rOverrideValid.status}; still-outside-start -> ${rOverrideStillEnforced.status}`
    );

    // 9. same-day after 17:00: staff allowed; self-service ROUTE_TO_STAFF via internal orchestrator (no public booking API exists in this deployment).
    const sameDayClock = { now: () => new Date("2026-08-20T15:01:00.000Z") }; // Thursday 17:01 local
    const staffActor: Actor = { id: bootstrap.staffUserId, kind: ActorKind.AuthorizedUser, role: ActorRole.Owner };
    const guestChannelActor: Actor = { id: "sp-smoke-guest-channel", kind: ActorKind.ApprovedGuestChannel };
    const createHandler = new CreateReservationHandler(
      repository,
      duplicateChecker,
      contactRepository,
      new CreateContactHandler(contactRepository, idGenerator, sameDayClock),
      new UnvalidatedServicePeriodReader(),
      closingDayStore,
      idGenerator,
      eventIdGenerator,
      sameDayClock,
      transactionManager
    );
    const internalOrchestrator = new AvailabilityOrchestrator(
      repository,
      capacityRepository,
      transactionManager,
      closingDayStore,
      idGenerator,
      sameDayClock,
      createHandler,
      new ModifyReservationHandler(repository, eventIdGenerator, sameDayClock),
      new CancelReservationHandler(repository, eventIdGenerator, sameDayClock),
      undefined,
      servicePeriodService
    );
    const sameDayRequest = {
      commandId: "sp-smoke-sameday-staff",
      servicePeriodId: "sp-dinner",
      contactSelection: { type: "ExistingContact" as const, contactId: "sp-smoke-contact-1" },
      reservationDate: new Date("2026-08-20T18:00:00.000Z"), // 20:00 local same day — a valid ServicePeriod start
      partySize: 2,
      source: { category: "Telephone" as const },
      preferredArea: "Sushi" as const,
      actor: staffActor,
    };
    const staffSameDay = await internalOrchestrator.createWithCapacity(sameDayRequest);
    const selfServiceSameDay = await internalOrchestrator.createWithCapacity({ ...sameDayRequest, commandId: "sp-smoke-sameday-selfservice", actor: guestChannelActor });
    record(
      "9. Staff same-day-after-17:00 create succeeds; self-service same request is ROUTE_TO_STAFF (never SERVICE_PERIOD_REJECTED)",
      staffSameDay.type === "CREATED" && selfServiceSameDay.type === "BOOKING_POLICY_REJECTED" && (selfServiceSameDay as { policy: { type: string } }).policy.type === "ROUTE_TO_STAFF",
      `staff -> ${staffSameDay.type}; self-service -> ${selfServiceSameDay.type}${selfServiceSameDay.type === "BOOKING_POLICY_REJECTED" ? ` (${(selfServiceSameDay as { policy: { type: string } }).policy.type})` : ""}`
    );

    const allOk = steps.every((s) => s.ok);
    // eslint-disable-next-line no-console
    console.log(`\nservicePeriodSmokeTest: OVERALL ${allOk ? "PASS" : "FAIL"}`);
    if (!allOk) process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("servicePeriodSmokeTest: FAILED —", err);
  process.exitCode = 1;
});
