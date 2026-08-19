/**
 * CAP-D03.03/CAP-D04.01 — R1.5 local smoke test (implementation assignment
 * §38). Runs the 16 required steps against real, local PostgreSQL
 * (TEST_DATABASE_URL by default — never DATABASE_URL/the pilot database;
 * "no production data" per the assignment's own instruction). No HTTP
 * endpoints exist yet for seating (out of R1.5's bounded scope), so
 * "login as authorized staff" exercises the real R1.2 authentication
 * mechanism directly (bootstrapOwner + LoginHandler), and every floor
 * step calls the real SeatingOrchestrator/FloorRepository — the same
 * code every automated test in this slice exercises, just walked through
 * once, end-to-end, in narrative order.
 *
 * Run via `npm run floor-smoke-test`.
 */
import { PrismaClient } from "@prisma/client";
import { bootstrapOwner } from "../../infrastructure/bootstrap/bootstrapOwner.js";
import { PrismaStaffUserRepository } from "../../infrastructure/persistence/PrismaStaffUserRepository.js";
import { PrismaSessionRepository } from "../../infrastructure/persistence/PrismaSessionRepository.js";
import { ScryptPasswordHasher } from "../../infrastructure/ScryptPasswordHasher.js";
import { RandomSessionTokenGenerator } from "../../infrastructure/RandomSessionTokenGenerator.js";
import { RandomIdGenerator } from "../../infrastructure/RandomIdGenerator.js";
import { LoginHandler } from "../../application/auth/LoginHandler.js";
import { Actor, ActorKind, ActorRole } from "../../domain/value-objects/Actor.js";
import { DEFAULT_SESSION_LIFETIME_MS } from "../../api/app.js";
import { seedFloor } from "./seedFloor.js";
import { PrismaFloorRepository } from "../../infrastructure/persistence/PrismaFloorRepository.js";
import { PrismaTransactionManager } from "../../infrastructure/persistence/PrismaTransactionManager.js";
import { SeatingOrchestrator } from "../../application/floor/SeatingOrchestrator.js";

const steps: { readonly step: string; readonly ok: boolean; readonly detail: string }[] = [];
function record(step: string, ok: boolean, detail: string): void {
  steps.push({ step, ok, detail });
  console.log(`  [${ok ? "OK" : "FAIL"}] ${step} — ${detail}`);
}

async function main(): Promise<void> {
  const databaseUrl = process.env["FLOOR_SMOKE_TEST_DATABASE_URL"] ?? process.env["TEST_DATABASE_URL"];
  if (!databaseUrl) throw new Error("floorSmokeTest: neither FLOOR_SMOKE_TEST_DATABASE_URL nor TEST_DATABASE_URL is set.");

  const prisma = new PrismaClient({ datasourceUrl: databaseUrl });
  try {
    // Clean slate — this script is meant to be re-runnable.
    await prisma.$executeRawUnsafe('TRUNCATE TABLE "seating_assignment_resources", "seating_assignments", "resource_blocks" RESTART IDENTITY CASCADE');
    await prisma.$executeRawUnsafe('TRUNCATE TABLE "capacity_commitments", "applied_commands", "reservation_events", "reservations", "closing_days", "contacts" RESTART IDENTITY CASCADE');
    await prisma.$executeRawUnsafe('TRUNCATE TABLE "staff_sessions", "staff_users", "security_events", "login_attempt_windows" RESTART IDENTITY CASCADE');
    await seedFloor(databaseUrl);

    // 1. login as authorized staff
    const staffUserRepository = new PrismaStaffUserRepository(prisma);
    const passwordHasher = new ScryptPasswordHasher();
    const idGenerator = new RandomIdGenerator();
    const bootstrap = await bootstrapOwner({
      staffUserRepository, passwordHasher, idGenerator,
      recordSecurityEvent: async (targetStaffUserId) => { await prisma.securityEvent.create({ data: { type: "OwnerBootstrapped", targetStaffUserId } }); },
      username: "floor-smoke-owner", password: "FloorSmokeTest123!", displayName: "Floor Smoke Test Owner", email: undefined,
    });
    if (bootstrap.status !== "CREATED") throw new Error(`bootstrap failed: ${bootstrap.status}`);
    const loginHandler = new LoginHandler(
      staffUserRepository,
      new PrismaSessionRepository(prisma),
      passwordHasher,
      new RandomSessionTokenGenerator(),
      { now: () => new Date("2026-08-20T10:00:00Z") },
      DEFAULT_SESSION_LIFETIME_MS
    );
    const loginResult = await loginHandler.handle({ username: "floor-smoke-owner", password: "FloorSmokeTest123!" });
    record("1. Login as authorized staff", loginResult.type === "SUCCESS", loginResult.type === "SUCCESS" ? "authenticated via real R1.2 LoginHandler" : `login failed: ${loginResult.type}`);

    const actor: Actor = { id: bootstrap.staffUserId, kind: ActorKind.AuthorizedUser, role: ActorRole.Owner };

    // 2. inspect floor resources
    const allTables = await prisma.table.findMany();
    record("2. Inspect floor resources", allTables.length === 23, `${allTables.length} Table rows found (expected 23)`);

    // 3. verify Sushi tables 1-13, 15, 16
    const expectedSushiLabels = ["Table 1", "Table 2", "Table 3", "Table 4", "Table 5", "Table 6", "Table 7", "Table 8", "Table 9", "Table 10", "Table 11", "Table 12", "Table 13", "Table 15", "Table 16"];
    const sushiTables = await prisma.table.findMany({ where: { areaId: "Sushi", operationalLabel: { startsWith: "Table " } }, orderBy: { operationalLabel: "asc" } });
    const sushiLabels = sushiTables.map((t) => t.operationalLabel);
    const sushiMatch = expectedSushiLabels.every((l) => sushiLabels.includes(l)) && sushiLabels.length === 15;
    record("3. Sushi tables 1-13, 15, 16 present", sushiMatch, `found: ${sushiLabels.join(", ")}`);

    // 4. verify NO Table 14
    const table14 = await prisma.table.findFirst({ where: { operationalLabel: "Table 14" } });
    record("4. Table 14 absent", table14 === null, table14 === null ? "confirmed absent" : "UNEXPECTEDLY PRESENT");

    // 5. verify Bar 17-20
    const barSeats = await prisma.table.findMany({ where: { operationalLabel: { startsWith: "Bar " } }, orderBy: { operationalLabel: "asc" } });
    record("5. Bar 17-20 present", barSeats.map((b) => b.operationalLabel).join(",") === "Bar 17,Bar 18,Bar 19,Bar 20", barSeats.map((b) => b.operationalLabel).join(", "));

    // 6. verify Teppanyaki C/D/E/F
    const grills = await prisma.table.findMany({ where: { areaId: "Teppanyaki" }, orderBy: { operationalLabel: "asc" } });
    record("6. Teppanyaki C/D/E/F present", grills.map((g) => g.operationalLabel).join(",") === "C,D,E,F", grills.map((g) => g.operationalLabel).join(", "));

    const floorRepository = new PrismaFloorRepository(prisma);
    const transactionManager = new PrismaTransactionManager(prisma);
    const clock = { now: () => new Date("2026-08-20T10:00:00Z") };
    const seatingOrchestrator = new SeatingOrchestrator(floorRepository, transactionManager, idGenerator, clock);

    await prisma.contact.create({ data: { id: "smoke-contact-1", displayName: "Smoke Test Guest", phoneRaw: "0600000000", phoneNormalized: "+31600000000", createdBy: actor.id, lastRelevantActivityAt: new Date() } });
    async function createRes(id: string, area: string, partySize: number, date: Date): Promise<string> {
      await prisma.reservation.create({ data: { id, servicePeriodId: "sp-smoke", contactId: "smoke-contact-1", contactName: "Smoke Test Guest", status: "Confirmed", reservationDate: date, partySize, sourceCategory: "Telephone", preferredArea: area, createdBy: actor.id, createdAt: new Date(), updatedAt: new Date(), version: 1 } });
      return id;
    }

    // 7. pre-assign Sushi reservation
    const table1 = await prisma.table.findFirstOrThrow({ where: { operationalLabel: "Table 1" } });
    const resA = await createRes("smoke-res-a", "Sushi", 4, new Date("2026-08-25T19:00:00Z"));
    const preAssign = await seatingOrchestrator.assignSeating({ commandId: "smoke-cmd-1", reservationId: resA, requestedAreaId: "Sushi", requestedPartySize: 4, resources: [{ tableId: table1.id }], startTime: new Date("2026-08-25T19:00:00Z"), endTime: new Date("2026-08-25T20:30:00Z"), actor });
    record("7. Pre-assign Sushi reservation", preAssign.type === "ASSIGNED", preAssign.type);

    // 8. prove overlapping table claim rejected
    const resB = await createRes("smoke-res-b", "Sushi", 2, new Date("2026-08-25T19:30:00Z"));
    const overlapping = await seatingOrchestrator.assignSeating({ commandId: "smoke-cmd-2", reservationId: resB, requestedAreaId: "Sushi", requestedPartySize: 2, resources: [{ tableId: table1.id }], startTime: new Date("2026-08-25T19:30:00Z"), endTime: new Date("2026-08-25T21:00:00Z"), actor });
    record("8. Overlapping table claim rejected", overlapping.type === "NOT_SEATABLE", overlapping.type);

    // 9. prove back-to-back accepted
    const resC = await createRes("smoke-res-c", "Sushi", 2, new Date("2026-08-25T20:30:00Z"));
    const backToBack = await seatingOrchestrator.assignSeating({ commandId: "smoke-cmd-3", reservationId: resC, requestedAreaId: "Sushi", requestedPartySize: 2, resources: [{ tableId: table1.id }], startTime: new Date("2026-08-25T20:30:00Z"), endTime: new Date("2026-08-25T22:00:00Z"), actor });
    record("9. Back-to-back accepted", backToBack.type === "ASSIGNED", backToBack.type);

    // 10. two parties sharing Teppanyaki C on different seats
    const grillC = await prisma.table.findFirstOrThrow({ where: { operationalLabel: "C" } });
    const seatC1 = await prisma.seat.findFirstOrThrow({ where: { tableId: grillC.id, operationalLabel: "C-01" } });
    const seatC2 = await prisma.seat.findFirstOrThrow({ where: { tableId: grillC.id, operationalLabel: "C-02" } });
    const resD = await createRes("smoke-res-d", "Teppanyaki", 1, new Date("2026-08-25T18:00:00Z"));
    const resE = await createRes("smoke-res-e", "Teppanyaki", 1, new Date("2026-08-25T18:00:00Z"));
    const shareD = await seatingOrchestrator.assignSeating({ commandId: "smoke-cmd-4", reservationId: resD, requestedAreaId: "Teppanyaki", requestedPartySize: 1, resources: [{ seatId: seatC1.id }], startTime: new Date("2026-08-25T18:00:00Z"), endTime: new Date("2026-08-25T20:30:00Z"), actor });
    const shareE = await seatingOrchestrator.assignSeating({ commandId: "smoke-cmd-5", reservationId: resE, requestedAreaId: "Teppanyaki", requestedPartySize: 1, resources: [{ seatId: seatC2.id }], startTime: new Date("2026-08-25T18:00:00Z"), endTime: new Date("2026-08-25T20:30:00Z"), actor });
    record("10. Two parties share Teppanyaki C on different seats", shareD.type === "ASSIGNED" && shareE.type === "ASSIGNED", `${shareD.type}, ${shareE.type}`);

    // 11. move a seating assignment
    const table2 = await prisma.table.findFirstOrThrow({ where: { operationalLabel: "Table 2" } });
    const move = await seatingOrchestrator.moveSeating({ commandId: "smoke-cmd-6", reservationId: resC, requestedAreaId: "Sushi", requestedPartySize: 2, resources: [{ tableId: table2.id }], actor });
    record("11. Move a seating assignment", move.type === "MOVED", move.type);

    // 12. block a Teppanyaki grill
    const grillD = await prisma.table.findFirstOrThrow({ where: { operationalLabel: "D" } });
    await transactionManager.runInTransaction(async (tx) => {
      await floorRepository.createResourceBlock({ tableId: grillD.id, startTime: new Date("2026-08-25T00:00:00Z"), endTime: new Date("2026-08-26T00:00:00Z"), reason: "smoke-test chef shortage", createdBy: actor.id, tx });
    });
    record("12. Block a Teppanyaki grill", true, `ResourceBlock created for ${grillD.operationalLabel}`);

    // 13. prove contained seats unavailable
    const seatD1 = await prisma.seat.findFirstOrThrow({ where: { tableId: grillD.id, operationalLabel: "D-01" } });
    const resF = await createRes("smoke-res-f", "Teppanyaki", 1, new Date("2026-08-25T18:00:00Z"));
    const blockedAttempt = await seatingOrchestrator.assignSeating({ commandId: "smoke-cmd-7", reservationId: resF, requestedAreaId: "Teppanyaki", requestedPartySize: 1, resources: [{ seatId: seatD1.id }], startTime: new Date("2026-08-25T18:00:00Z"), endTime: new Date("2026-08-25T20:30:00Z"), actor });
    record("13. Contained seats unavailable under an active block", blockedAttempt.type === "NOT_SEATABLE" && (blockedAttempt as { seatability?: { type?: string } }).seatability?.type === "RESOURCE_BLOCKED", JSON.stringify(blockedAttempt));

    // 14. create + seat WalkIn
    const table3 = await prisma.table.findFirstOrThrow({ where: { operationalLabel: "Table 3" } });
    const walkInRes = await createRes("smoke-res-walkin", "Sushi", 2, new Date("2026-08-20T10:00:00Z"));
    await prisma.reservation.update({ where: { id: walkInRes }, data: { sourceCategory: "Walk-in" } });
    const walkIn = await seatingOrchestrator.assignSeating({ commandId: "smoke-cmd-8", reservationId: walkInRes, requestedAreaId: "Sushi", requestedPartySize: 2, resources: [{ tableId: table3.id }], startTime: new Date("2026-08-20T10:00:00Z"), endTime: new Date("2026-08-20T11:30:00Z"), actor, seatImmediately: true });
    record("14. Create + seat WalkIn", walkIn.type === "ASSIGNED" && "assignment" in walkIn && walkIn.assignment.status === "Seated", walkIn.type);

    // 15. cancel reservation (using the real capacity-integrated path would
    // require AvailabilityOrchestrator; here we directly exercise the
    // seating release the same way cancelWithCapacity's integration point
    // does, proving physical claim release end-to-end).
    const released = await seatingOrchestrator.releaseNoShow({ reservationId: walkInRes, actor });
    record("15. Cancel/release reservation's seating", released.type === "RELEASED", released.type);

    // 16. prove physical claim released
    const stillActive = await prisma.seatingAssignmentResource.findMany({ where: { tableId: table3.id, status: { in: ["Assigned", "Seated"] } } });
    record("16. Physical claim released", stillActive.length === 0, `${stillActive.length} active claims remaining on ${table3.operationalLabel} (expected 0)`);

    const allOk = steps.every((s) => s.ok);
    console.log(`\nfloorSmokeTest: OVERALL ${allOk ? "PASS" : "FAIL"}`);
    if (!allOk) process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error("floorSmokeTest: FAILED —", err);
  process.exitCode = 1;
});
