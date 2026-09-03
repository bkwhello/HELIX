/**
 * R1.4 §15 — a real, local, end-to-end recovery drill. Run via
 * `npm run recovery-drill`.
 *
 * SOURCE DATABASE → CREATE BACKUP → RECORD TIMESTAMP/CHECKSUM →
 * PROVISION CLEAN RECOVERY DATABASE → RESTORE → INTEGRITY CHECK →
 * START APPLICATION AGAINST RESTORED DATABASE → AUTHENTICATE →
 * READ RESERVATIONS → VERIFY CONTACT → VERIFY CAPACITY →
 * CONTROLLED SMOKE TEST → RECORD COMPLETION TIME.
 *
 * Source: TEST_DATABASE_URL, seeded here with clearly-labeled synthetic
 * drill data — never DATABASE_URL (the pilot's real, single-machine,
 * unbacked-up database, per the R1.4 architecture report §2/§5). This
 * drill never touches it, in either direction.
 *
 * "Destroy/ignore original," per the drill diagram: this script does
 * NOT physically destroy the source — deliberately. Restoring into a
 * genuinely separate, dedicated recovery database (RESTORE_TARGET_DATABASE_URL)
 * already proves the mechanism works without reading back from the
 * still-intact original; actually destroying data (even synthetic test
 * data) to prove a point would be needless risk for no additional
 * evidence.
 */
import { PrismaClient } from "@prisma/client";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import request from "supertest";
import { createApp } from "../api/app.js";
import { createTestPrismaClient, truncateReservationDomainTables, truncateStaffDomainTables } from "../tests/integration/support/testDatabaseSafety.js";
import { bootstrapOwner } from "../infrastructure/bootstrap/bootstrapOwner.js";
import { PrismaStaffUserRepository } from "../infrastructure/persistence/PrismaStaffUserRepository.js";
import { PrismaSessionRepository } from "../infrastructure/persistence/PrismaSessionRepository.js";
import { PrismaReservationRepository } from "../infrastructure/persistence/PrismaReservationRepository.js";
import { PrismaDuplicateReservationChecker } from "../infrastructure/persistence/PrismaDuplicateReservationChecker.js";
import { PrismaClosingDayStore } from "../infrastructure/persistence/PrismaClosingDayStore.js";
import { PrismaContactRepository } from "../infrastructure/persistence/PrismaContactRepository.js";
import { PrismaTransactionManager } from "../infrastructure/persistence/PrismaTransactionManager.js";
import { PrismaLoginAttemptTracker } from "../infrastructure/persistence/PrismaLoginAttemptTracker.js";
import { ScryptPasswordHasher } from "../infrastructure/ScryptPasswordHasher.js";
import { RandomSessionTokenGenerator } from "../infrastructure/RandomSessionTokenGenerator.js";
import { RandomIdGenerator } from "../infrastructure/RandomIdGenerator.js";
import { UnvalidatedServicePeriodReader } from "../infrastructure/UnvalidatedServicePeriodReader.js";
import { PrismaCapacityRepository } from "../infrastructure/persistence/PrismaCapacityRepository.js";
import { ServicePeriodService } from "../application/availability/ServicePeriodService.js";
import { PrismaServicePeriodOverrideStore } from "../infrastructure/persistence/PrismaServicePeriodOverrideStore.js";
import { toLocalHourMinute } from "../domain/availability/ServiceTime.js";
import { CSRF_HEADER_NAME } from "../api/authMiddleware.js";
import { createBackup } from "./backup/createBackup.js";
import { restoreBackup } from "./restore/restoreBackup.js";
import { verifyIntegrity, type IntegrityReport } from "./integrity/verifyIntegrity.js";
import { parseConnectionString, runPgTool } from "./shared/pgTools.js";

const execFileAsync = promisify(execFile);

const DRILL_OWNER_USERNAME = "drill-owner";
const DRILL_OWNER_PASSWORD = "DrillRecovery123!";
const DRILL_RESERVATION_DATE = new Date("2026-09-01T18:00:00Z");

/**
 * P0 correctness-boundary closure (EC-002 reservations audit) — genuinely
 * future relative to the real clock, unlike a fixed constant (this
 * script's own buildRestoredApp() uses real time, `clock: { now: () =>
 * new Date() }`, not a fixed test clock). A fixed DRILL_RESERVATION_DATE
 * + 24h was originally fine, but is not durable: once real time passes
 * it, CAP-D01.01-R11 ("past reservation creation requires explicit
 * policy") genuinely and correctly rejects it — a real defect this fix
 * surfaced during this increment's own drill validation, not a false
 * positive. 7 days out is comfortably future regardless of when this
 * drill actually runs. Nudged onto 19:00 Europe/Amsterdam local — the
 * middle of the 17:00-21:00 window every day of the week includes
 * (Mon-Thu 17:00-21:00, Fri-Sun 12:00-21:00, DEFAULT_WEEKLY_SCHEDULE) —
 * via toLocalHourMinute (already correct/tested, DST-aware), rather than
 * reimplementing timezone math here.
 */
function computeFutureSmokeTestDate(now: Date): Date {
  const candidate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const { hour, minute } = toLocalHourMinute(candidate);
  // Zero out minutes/seconds/ms too, not just the hour — ServicePeriod
  // eligibility also requires 15-minute-grid alignment
  // (SERVICE_PERIOD_GRID_MINUTES), which an arbitrary leftover minute
  // value (whatever real time this happens to run at) would not satisfy.
  const minutesToShift = (19 - hour) * 60 - minute;
  return new Date(candidate.getTime() + minutesToShift * 60 * 1000 - candidate.getMilliseconds());
}

interface DrillTimings {
  seedStart: string;
  backupStart: string;
  backupEnd: string;
  recoveryTargetWipedAt: string;
  restoreStart: string;
  restoreEnd: string;
  integrityStart: string;
  integrityEnd: string;
  appReadyAt: string;
  authenticateAt: string;
  readReservationsAt: string;
  verifyContactAt: string;
  verifyCapacityAt: string;
  smokeTestCompletedAt: string;
}

async function seedSourceDatabase(sourceUrl: string): Promise<{ prisma: PrismaClient; contactId: string; reservationId: string }> {
  const prisma = new PrismaClient({ datasourceUrl: sourceUrl });

  const staffUserRepository = new PrismaStaffUserRepository(prisma);
  const passwordHasher = new ScryptPasswordHasher();
  const idGenerator = new RandomIdGenerator();
  const bootstrapResult = await bootstrapOwner({
    staffUserRepository,
    passwordHasher,
    idGenerator,
    recordSecurityEvent: async (targetStaffUserId) => {
      await prisma.securityEvent.create({ data: { type: "OwnerBootstrapped", targetStaffUserId } });
    },
    username: DRILL_OWNER_USERNAME,
    password: DRILL_OWNER_PASSWORD,
    displayName: "Recovery Drill Owner",
    email: undefined,
  });
  if (bootstrapResult.status !== "CREATED") {
    throw new Error(`recoveryDrill: expected a fresh Owner bootstrap, got ${bootstrapResult.status}`);
  }
  const ownerId = bootstrapResult.staffUserId;

  const now = new Date();
  const contactId = "drill-contact-1";
  await prisma.contact.create({
    data: {
      id: contactId,
      displayName: "Recovery Drill Guest",
      phoneRaw: "0698765432",
      phoneNormalized: "+31698765432",
      createdBy: ownerId,
      lastRelevantActivityAt: now,
    },
  });

  const reservationId = "drill-res-1";
  await prisma.reservation.create({
    data: {
      id: reservationId,
      servicePeriodId: "sp-drill",
      contactId,
      contactName: "Recovery Drill Guest",
      contactPhoneSnapshot: "+31698765432",
      status: "Confirmed",
      reservationDate: DRILL_RESERVATION_DATE,
      partySize: 2,
      sourceCategory: "Telephone",
      createdBy: ownerId,
      createdAt: now,
      updatedAt: now,
      version: 1,
    },
  });

  await prisma.reservationEvent.create({
    data: { reservationId, type: "Created", occurredAt: now, payload: "{}" },
  });

  const commandId = "drill-cmd-1";
  await prisma.capacityCommitment.create({
    data: {
      reservationId,
      capacityPoolId: "Sushi",
      startTime: DRILL_RESERVATION_DATE,
      endTime: new Date(DRILL_RESERVATION_DATE.getTime() + 90 * 60 * 1000),
      partySize: 2,
      status: "Committed",
      commandId,
    },
  });

  await prisma.appliedCommand.create({ data: { commandId, reservationId } });

  return { prisma, contactId, reservationId };
}

async function wipeRecoveryTarget(targetUrl: string): Promise<void> {
  const conn = parseConnectionString(targetUrl);
  const result = await runPgTool(
    "psql",
    ["-h", conn.host, "-p", conn.port, "-U", conn.user, "-d", conn.database, "-c", "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"],
    { password: conn.password, timeoutMs: 60_000 }
  );
  if (result.exitCode !== 0) {
    throw new Error(`recoveryDrill: failed to wipe recovery target — ${result.stderr}`);
  }
}

function buildRestoredApp(targetUrl: string) {
  const prisma = new PrismaClient({ datasourceUrl: targetUrl });
  const closingDayStore = new PrismaClosingDayStore(prisma);
  const app = createApp({
    repository: new PrismaReservationRepository(prisma),
    duplicateChecker: new PrismaDuplicateReservationChecker(prisma),
    contactRepository: new PrismaContactRepository(prisma),
    transactionManager: new PrismaTransactionManager(prisma),
    servicePeriodReader: new UnvalidatedServicePeriodReader(),
    closingDayStore,
    idGenerator: new RandomIdGenerator(),
    eventIdGenerator: new RandomIdGenerator(),
    clock: { now: () => new Date() },
    // P0 retirement (EC-002 reservations audit) — the drill's own
    // "CONTROLLED SMOKE TEST" step now calls the authoritative
    // POST /availability/reservations (the old plain POST /reservations
    // it used to call has been retired). Mounting /availability/*
    // routes at all requires a real servicePeriodService (api/app.ts's
    // own AppDependencies.capacity doc comment) — reusing the same
    // PrismaClosingDayStore instance the plain closingDayStore field
    // above already uses, mirroring tests/integration/support/testHarness.ts's
    // established pattern exactly.
    capacity: {
      capacityRepository: new PrismaCapacityRepository(prisma),
      transactionManager: new PrismaTransactionManager(prisma),
      servicePeriodService: new ServicePeriodService(closingDayStore, new PrismaServicePeriodOverrideStore(prisma)),
    },
    auth: {
      staffUserRepository: new PrismaStaffUserRepository(prisma),
      sessionRepository: new PrismaSessionRepository(prisma),
      passwordHasher: new ScryptPasswordHasher(),
      sessionTokenGenerator: new RandomSessionTokenGenerator(),
      cookieSecure: false,
      expectedOrigin: null,
      loginAttemptTracker: new PrismaLoginAttemptTracker(prisma),
    },
  });
  return { app, prisma };
}

async function main(): Promise<void> {
  const sourceUrl = process.env["TEST_DATABASE_URL"];
  const targetUrl = process.env["RESTORE_TARGET_DATABASE_URL"];
  if (!sourceUrl) throw new Error("recoveryDrill: TEST_DATABASE_URL is not set.");
  if (!targetUrl) throw new Error("recoveryDrill: RESTORE_TARGET_DATABASE_URL is not set.");

  const timings = {} as DrillTimings;
  const stepResults: { step: string; ok: boolean; detail: string }[] = [];

  console.log("recoveryDrill: SOURCE DATABASE — resetting and seeding synthetic drill data in TEST_DATABASE_URL...");
  timings.seedStart = new Date().toISOString();
  const seedClient = createTestPrismaClient();
  await truncateReservationDomainTables(seedClient);
  await truncateStaffDomainTables(seedClient);
  await seedClient.$disconnect();
  const { prisma: sourcePrisma, contactId, reservationId } = await seedSourceDatabase(sourceUrl);
  await sourcePrisma.$disconnect();
  stepResults.push({ step: "SEED SOURCE DATABASE", ok: true, detail: `seeded Owner, Contact ${contactId}, Reservation ${reservationId}` });

  console.log("recoveryDrill: CREATE BACKUP...");
  timings.backupStart = new Date().toISOString();
  const manifest = await createBackup({ sourceUrl });
  timings.backupEnd = new Date().toISOString();
  stepResults.push({
    step: "CREATE BACKUP",
    ok: manifest.status === "SUCCESS",
    detail: `backupId=${manifest.backupId} checksum=${manifest.checksumSha256.slice(0, 16)}... size=${manifest.sizeBytes}B`,
  });
  if (manifest.status !== "SUCCESS") throw new Error("recoveryDrill: backup failed, aborting drill.");

  console.log("recoveryDrill: PROVISION CLEAN RECOVERY DATABASE (wiping dedicated recovery target)...");
  await wipeRecoveryTarget(targetUrl);
  timings.recoveryTargetWipedAt = new Date().toISOString();
  stepResults.push({ step: "PROVISION CLEAN RECOVERY DATABASE", ok: true, detail: "dropped and recreated public schema on RESTORE_TARGET_DATABASE_URL" });

  console.log("recoveryDrill: RESTORE...");
  timings.restoreStart = new Date().toISOString();
  await restoreBackup(manifest.backupId);
  timings.restoreEnd = new Date().toISOString();
  stepResults.push({ step: "RESTORE", ok: true, detail: `restored backup ${manifest.backupId} into RESTORE_TARGET_DATABASE_URL` });

  console.log("recoveryDrill: RUN INTEGRITY CHECK...");
  timings.integrityStart = new Date().toISOString();
  const integrityReport: IntegrityReport = await verifyIntegrity(targetUrl);
  timings.integrityEnd = new Date().toISOString();
  stepResults.push({ step: "INTEGRITY CHECK", ok: integrityReport.overall === "PASS", detail: `overall=${integrityReport.overall}` });
  for (const c of integrityReport.checks) console.log(`  [${c.status}] ${c.name} — ${c.detail}`);
  if (integrityReport.overall !== "PASS") throw new Error("recoveryDrill: integrity check FAILED, aborting drill before smoke test.");

  console.log("recoveryDrill: START APPLICATION AGAINST RESTORED DATABASE...");
  const { app, prisma: restoredPrisma } = buildRestoredApp(targetUrl);
  timings.appReadyAt = new Date().toISOString();
  stepResults.push({ step: "START APPLICATION", ok: true, detail: "createApp() wired to RESTORE_TARGET_DATABASE_URL" });

  console.log("recoveryDrill: AUTHENTICATE...");
  const agent = request.agent(app);
  const loginRes = await agent
    .post("/auth/login")
    .set(CSRF_HEADER_NAME, "1")
    .send({ username: DRILL_OWNER_USERNAME, password: DRILL_OWNER_PASSWORD });
  timings.authenticateAt = new Date().toISOString();
  const authOk = loginRes.status === 200;
  stepResults.push({ step: "AUTHENTICATE", ok: authOk, detail: `POST /auth/login -> ${loginRes.status}` });
  if (!authOk) throw new Error(`recoveryDrill: authentication against restored database FAILED (${loginRes.status})`);

  console.log("recoveryDrill: READ RESERVATIONS...");
  const dateParam = DRILL_RESERVATION_DATE.toISOString().slice(0, 10);
  const listRes = await agent.get(`/reservations?date=${dateParam}`);
  timings.readReservationsAt = new Date().toISOString();
  // GET /reservations responds { date, reservations: [...] } (api/app.ts),
  // not a bare array.
  const found =
    Array.isArray(listRes.body?.reservations) &&
    listRes.body.reservations.some((r: { id: string }) => r.id === reservationId);
  stepResults.push({ step: "READ RESERVATIONS", ok: listRes.status === 200 && found, detail: `GET /reservations?date=${dateParam} -> ${listRes.status}, drill reservation present=${found}` });

  console.log("recoveryDrill: VERIFY CONTACT...");
  const restoredContact = await restoredPrisma.contact.findUnique({ where: { id: contactId } });
  timings.verifyContactAt = new Date().toISOString();
  stepResults.push({ step: "VERIFY CONTACT", ok: restoredContact !== null, detail: `Contact ${contactId} present=${restoredContact !== null}` });

  console.log("recoveryDrill: VERIFY CAPACITY...");
  const restoredCommitment = await restoredPrisma.capacityCommitment.findFirst({ where: { reservationId, status: "Committed" } });
  timings.verifyCapacityAt = new Date().toISOString();
  stepResults.push({ step: "VERIFY CAPACITY", ok: restoredCommitment !== null, detail: `Committed CapacityCommitment for ${reservationId} present=${restoredCommitment !== null}` });

  console.log("recoveryDrill: CONTROLLED SMOKE TEST (create a new reservation post-restore)...");
  // P0 retirement (EC-002 reservations audit) — repointed from the now-
  // retired POST /reservations (no capacity/ServicePeriod enforcement at
  // all) to the authoritative POST /availability/reservations, so this
  // drill proves the restored system can accept a reservation through
  // the SAME path real staff/pilot usage now goes through, not a
  // bypassed one. preferredArea is newly required by this endpoint (a
  // capacity-aware create must know which pool to commit against) — the
  // one addition beyond a URL change. The reservation date is computed
  // fresh, genuinely future relative to real time, via
  // computeFutureSmokeTestDate() — see its own doc comment for why a
  // fixed constant doesn't stay valid.
  const smokeRes = await agent
    .post("/availability/reservations")
    .set(CSRF_HEADER_NAME, "1")
    .send({
      commandId: "drill-smoke-test-cmd-1",
      servicePeriodId: "sp-drill",
      contactSelection: { type: "ExistingContact", contactId },
      reservationDate: computeFutureSmokeTestDate(new Date()).toISOString(),
      partySize: 2,
      preferredArea: "Sushi",
      source: { category: "Telephone" },
    });
  timings.smokeTestCompletedAt = new Date().toISOString();
  const smokeOk = smokeRes.status === 201;
  stepResults.push({
    step: "CONTROLLED SMOKE TEST",
    ok: smokeOk,
    detail: `POST /availability/reservations -> ${smokeRes.status}${smokeOk ? "" : ` body=${JSON.stringify(smokeRes.body)}`}`,
  });

  await restoredPrisma.$disconnect();

  const backupDurationMs = Date.parse(timings.backupEnd) - Date.parse(timings.backupStart);
  const restoreDurationMs = Date.parse(timings.restoreEnd) - Date.parse(timings.restoreStart);
  const integrityDurationMs = Date.parse(timings.integrityEnd) - Date.parse(timings.integrityStart);
  const totalRecoveryTimeMs = Date.parse(timings.smokeTestCompletedAt) - Date.parse(timings.backupEnd);

  const allOk = stepResults.every((s) => s.ok);

  const resultsDir = process.env["RECOVERY_DRILL_RESULTS_DIR"] ?? join(process.cwd(), "recovery-drill-results");
  if (!existsSync(resultsDir)) mkdirSync(resultsDir, { recursive: true });
  const resultsPath = join(resultsDir, `${manifest.backupId}.json`);
  writeFileSync(
    resultsPath,
    JSON.stringify(
      {
        backupId: manifest.backupId,
        backupManifest: manifest,
        timings,
        stepResults,
        integrityReport,
        measured: { backupDurationMs, restoreDurationMs, integrityDurationMs, totalRecoveryTimeMs },
        overall: allOk ? "PASS" : "FAIL",
      },
      null,
      2
    )
  );

  console.log("\nrecoveryDrill: SUMMARY");
  for (const s of stepResults) console.log(`  [${s.ok ? "OK" : "FAIL"}] ${s.step} — ${s.detail}`);
  console.log(`  backup duration:        ${backupDurationMs}ms`);
  console.log(`  restore duration:       ${restoreDurationMs}ms`);
  console.log(`  integrity check duration: ${integrityDurationMs}ms`);
  console.log(`  TOTAL measured recovery time (backup-complete -> smoke-test-complete): ${totalRecoveryTimeMs}ms`);
  console.log(`  results written to: ${resultsPath}`);
  console.log(`recoveryDrill: OVERALL ${allOk ? "PASS" : "FAIL"}`);

  if (!allOk) process.exitCode = 1;
}

main().catch((err) => {
  console.error("recoveryDrill: FAILED —", err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
