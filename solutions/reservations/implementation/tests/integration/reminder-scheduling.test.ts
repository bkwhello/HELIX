import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { buildHarness, resetDatabase, seedTestContact, MutableClock } from "./support/testHarness.js";
import { createTestPrismaClient, truncateCommunicationDomainTables } from "./support/testDatabaseSafety.js";
import { CommunicationOutboxService } from "../../application/communications/CommunicationOutboxService.js";
import { CommunicationWorker } from "../../application/communications/CommunicationWorker.js";
import { FakeEmailDeliveryPort } from "../../infrastructure/communications/FakeEmailDeliveryPort.js";
import { Actor, ActorKind, ActorRole } from "../../domain/value-objects/Actor.js";
import { ReservationSourceCategory } from "../../domain/value-objects/ReservationSource.js";
import { CommunicationMessageRecord } from "../../application/ports/CommunicationOutboxRepository.js";

/** Every test reservation here has a usable email, so findByReservationId also returns the CONFIRMATION row created at booking time — filter to the reminder specifically. */
function reminders(messages: readonly CommunicationMessageRecord[]): CommunicationMessageRecord[] {
  return messages.filter((m) => m.communicationType === "RESERVATION_REMINDER_24H");
}

/**
 * Chief Engineer "R1.6-B Guest Communications Engine" assignment §9-§13/
 * §32/§33/§41 (R1-R8) — real PostgreSQL evidence for reminder scheduling,
 * staff-modification safety, cancellation safety, and worker-downtime
 * recovery, using the "Model B, refined" design (architecture report §9):
 * no reminder row is pre-created at booking time; the scan creates one
 * only once the reservation's CURRENT date genuinely enters the 24-hour
 * window, and the worker re-verifies eligibility against CURRENT state
 * immediately before sending.
 */
const prisma = createTestPrismaClient();
const staffActor: Actor = { id: "staff-1", kind: ActorKind.AuthorizedUser, role: ActorRole.Reception };
let cmdCounter = 0;
function cmd(): string {
  cmdCounter += 1;
  return `reminder-cmd-${cmdCounter}`;
}

beforeAll(async () => {
  await resetDatabase(prisma);
  await truncateCommunicationDomainTables(prisma);
});
afterAll(async () => {
  await prisma.$disconnect();
});
beforeEach(async () => {
  await resetDatabase(prisma);
  await truncateCommunicationDomainTables(prisma);
  await seedTestContact(prisma);
});

async function createReservation(clock: MutableClock, reservationDate: Date, language?: "nl" | "en", email = `reminder-${cmdCounter + 1}@example.com`): Promise<string> {
  const { orchestrator } = buildHarness(prisma, clock.now());
  const result = await orchestrator.createWithCapacity({
    commandId: cmd(),
    servicePeriodId: "sp-dinner",
    contactSelection: { type: "CreateNewContact", displayName: "Reminder Test Guest", email },
    reservationDate,
    partySize: 2,
    source: { category: ReservationSourceCategory.Telephone },
    preferredArea: "Sushi",
    actor: staffActor,
    communicationLanguage: language,
  });
  if (result.type !== "CREATED") throw new Error(`seed failed: ${result.type}`);
  return result.outcome.reservationId;
}

describe("R1/R2 — due exactly T-24h, never before", () => {
  it("no reminder is scheduled more than 24h before the reservation start", async () => {
    const clock = new MutableClock(new Date("2026-08-19T10:00:00Z"));
    const start = new Date("2026-08-21T19:00:00Z");
    const reservationId = await createReservation(clock, start);
    const { outboxRepository, repository } = buildHarness(prisma, clock.now());
    const outboxService = new CommunicationOutboxService(outboxRepository, repository, clock);

    // Now is 2026-08-19T10:00Z — the 24h-before instant is 2026-08-20T19:00Z, still in the future.
    const scanResult = await outboxService.scanAndScheduleReminders(clock.now());
    expect(scanResult.scheduled).toBe(0);
    expect(reminders(await outboxRepository.findByReservationId(reservationId))).toHaveLength(0);
  });

  it("scheduled exactly once the current instant reaches the 24h-before instant", async () => {
    const clock = new MutableClock(new Date("2026-08-19T10:00:00Z"));
    const start = new Date("2026-08-21T19:00:00Z");
    const reservationId = await createReservation(clock, start);
    const { outboxRepository, repository } = buildHarness(prisma, clock.now());
    const outboxService = new CommunicationOutboxService(outboxRepository, repository, clock);

    clock.set(new Date("2026-08-20T19:00:00Z")); // exactly T-24h
    const scanResult = await outboxService.scanAndScheduleReminders(clock.now());
    expect(scanResult.scheduled).toBe(1);

    const messages = reminders(await outboxRepository.findByReservationId(reservationId));
    expect(messages).toHaveLength(1);
    expect(messages[0]?.communicationType).toBe("RESERVATION_REMINDER_24H");
    expect(messages[0]?.idempotencyKey).toBe(`${reservationId}:reminder-24h`);
  });

  it("is idempotent — scanning again does not create a second reminder row", async () => {
    const clock = new MutableClock(new Date("2026-08-20T19:00:00Z"));
    const start = new Date("2026-08-21T19:00:00Z");
    const reservationId = await createReservation(clock, start);
    const { outboxRepository, repository } = buildHarness(prisma, clock.now());
    const outboxService = new CommunicationOutboxService(outboxRepository, repository, clock);

    await outboxService.scanAndScheduleReminders(clock.now());
    const second = await outboxService.scanAndScheduleReminders(clock.now());
    expect(second.scheduled).toBe(0);
    expect(reminders(await outboxRepository.findByReservationId(reservationId))).toHaveLength(1);
  });
});

describe("R3 — cancelled Reservation -> no reminder", () => {
  it("a reservation cancelled before the reminder becomes due is never scheduled", async () => {
    const clock = new MutableClock(new Date("2026-08-19T10:00:00Z"));
    const start = new Date("2026-08-21T19:00:00Z");
    const reservationId = await createReservation(clock, start);
    const { outboxRepository, repository, orchestrator } = buildHarness(prisma, clock.now());
    await orchestrator.cancelWithCapacity({ commandId: cmd(), reservationId, actor: staffActor });

    clock.set(new Date("2026-08-20T19:00:00Z"));
    const outboxService = new CommunicationOutboxService(outboxRepository, repository, clock);
    const scanResult = await outboxService.scanAndScheduleReminders(clock.now());
    expect(scanResult.scheduled).toBe(0);
    expect(reminders(await outboxRepository.findByReservationId(reservationId))).toHaveLength(0);
  });

  it("a reservation cancelled AFTER the reminder row already exists is caught by the send-time re-check, never sent", async () => {
    const clock = new MutableClock(new Date("2026-08-20T19:00:00Z"));
    const start = new Date("2026-08-21T19:00:00Z");
    const reservationId = await createReservation(clock, start);
    const { outboxRepository, repository, orchestrator } = buildHarness(prisma, clock.now());
    const outboxService = new CommunicationOutboxService(outboxRepository, repository, clock);
    await outboxService.scanAndScheduleReminders(clock.now());
    expect(reminders(await outboxRepository.findByReservationId(reservationId))).toHaveLength(1);

    await orchestrator.cancelWithCapacity({ commandId: cmd(), reservationId, actor: staffActor });

    const emailPort = new FakeEmailDeliveryPort();
    const worker = new CommunicationWorker(outboxRepository, repository, emailPort, clock);
    const result = await worker.processBatch();
    // Both the still-Pending confirmation AND the reminder are claimed and cancelled — cancellation-safety applies to every not-yet-sent message for this reservation, not just reminders.
    expect(result.processed).toBe(2);
    expect(result.cancelled).toBe(2);
    expect(emailPort.getSentMessages()).toHaveLength(0);
    const messages = await outboxRepository.findByReservationId(reservationId);
    expect(messages.every((m) => m.status === "Cancelled")).toBe(true);
  });
});

describe("R4/R5 — staff modification: obsolete reminder never sends; a new, correctly-dated one is scheduled for the new start", () => {
  it("modifying BEFORE the reservation ever entered its 24h window means nothing stale is ever created — the scan correctly targets only the NEW date", async () => {
    const clock = new MutableClock(new Date("2026-08-15T10:00:00Z"));
    const originalStart = new Date("2026-08-21T19:00:00Z"); // Friday 19:00
    const reservationId = await createReservation(clock, originalStart);
    const { outboxRepository, repository, orchestrator } = buildHarness(prisma, clock.now());
    const outboxService = new CommunicationOutboxService(outboxRepository, repository, clock);

    // Staff moves it to Saturday 20:00, well before Friday 19:00 (the original due instant) ever arrives.
    const newStart = new Date("2026-08-22T20:00:00Z");
    const modifyResult = await orchestrator.modifyWithCapacity({
      commandId: cmd(),
      reservationId,
      actor: staffActor,
      changes: { reservationDate: newStart },
      isServicePeriodStillValid: true,
    });
    expect(modifyResult.type).toBe("MODIFIED");

    // Advance to the ORIGINAL (now-obsolete) due instant — nothing should be scheduled, because the reservation is no longer for that date.
    clock.set(new Date("2026-08-20T19:00:00Z"));
    let scanResult = await outboxService.scanAndScheduleReminders(clock.now());
    expect(scanResult.scheduled).toBe(0);
    expect(reminders(await outboxRepository.findByReservationId(reservationId))).toHaveLength(0);

    // Advance to the NEW due instant (Saturday 20:00 minus 24h = Friday 20:00) — now it is correctly scheduled, for the NEW start.
    clock.set(new Date("2026-08-21T20:00:00Z"));
    scanResult = await outboxService.scanAndScheduleReminders(clock.now());
    expect(scanResult.scheduled).toBe(1);
    const messages = reminders(await outboxRepository.findByReservationId(reservationId));
    expect(messages).toHaveLength(1);
    expect(new Date(messages[0]!.payload.reservationStart).toISOString()).toBe(newStart.toISOString());
  });

  it("modifying AFTER the reminder row already exists cancels the stale row at send time; a fresh, correctly-dated reminder is scheduled once the new date is due", async () => {
    const clock = new MutableClock(new Date("2026-08-20T19:00:00Z"));
    const originalStart = new Date("2026-08-21T19:00:00Z");
    const reservationId = await createReservation(clock, originalStart);
    const { outboxRepository, repository, orchestrator } = buildHarness(prisma, clock.now());
    const outboxService = new CommunicationOutboxService(outboxRepository, repository, clock);

    await outboxService.scanAndScheduleReminders(clock.now());
    const originalMessages = reminders(await outboxRepository.findByReservationId(reservationId));
    expect(originalMessages).toHaveLength(1);
    const originalMessageId = originalMessages[0]!.id;

    // Staff reschedules to well beyond the staleness tolerance from "now".
    const newStart = new Date("2026-08-25T20:00:00Z");
    await orchestrator.modifyWithCapacity({
      commandId: cmd(),
      reservationId,
      actor: staffActor,
      changes: { reservationDate: newStart },
      isServicePeriodStillValid: true,
    });

    // The worker, running against the STALE reminder row (still "now" = the original due instant), must NOT send IT — the
    // still-Pending confirmation is a separate, unaffected message (confirmation eligibility never depends on date staleness)
    // and IS sent normally in the same batch.
    const emailPort = new FakeEmailDeliveryPort();
    const worker = new CommunicationWorker(outboxRepository, repository, emailPort, clock);
    const result = await worker.processBatch();
    expect(result.processed).toBe(2);
    expect(result.sent).toBe(1); // the confirmation
    expect(result.cancelled).toBe(1); // the stale reminder
    expect(emailPort.getSentMessages()).toHaveLength(1);
    const staleMessage = await outboxRepository.findById(originalMessageId);
    expect(staleMessage?.status).toBe("Cancelled");

    // Once the NEW due instant arrives, a fresh reminder — for the new start — is scheduled and can be sent correctly.
    clock.set(new Date("2026-08-24T20:00:00Z"));
    const rescan = await outboxService.scanAndScheduleReminders(clock.now());
    expect(rescan.scheduled).toBe(1);
    const freshMessages = reminders(await outboxRepository.findByReservationId(reservationId));
    const freshPending = freshMessages.find((m) => m.status === "Pending");
    expect(freshPending).toBeDefined();
    expect(new Date(freshPending!.payload.reservationStart).toISOString()).toBe(newStart.toISOString());
  });
});

describe("R6 — worker/scan downtime and restart", () => {
  it("a reminder that became due during a gap is still correctly scheduled once the scan resumes, as long as the reservation has not started", async () => {
    const clock = new MutableClock(new Date("2026-08-19T10:00:00Z"));
    const start = new Date("2026-08-21T19:00:00Z");
    const reservationId = await createReservation(clock, start);
    const { outboxRepository, repository } = buildHarness(prisma, clock.now());
    const outboxService = new CommunicationOutboxService(outboxRepository, repository, clock);

    // Simulate a long gap — the scan simply never ran between T-24h and now, well past it but still before the reservation start.
    clock.set(new Date("2026-08-21T15:00:00Z")); // 4 hours before start, well past the T-24h instant
    const scanResult = await outboxService.scanAndScheduleReminders(clock.now());
    expect(scanResult.scheduled).toBe(1);
    expect(reminders(await outboxRepository.findByReservationId(reservationId))).toHaveLength(1);
  });
});

describe("R7 — Reservation already started -> no late reminder", () => {
  it("the scan never schedules a reminder for a reservation whose start has already passed", async () => {
    const clock = new MutableClock(new Date("2026-08-19T10:00:00Z"));
    const start = new Date("2026-08-21T19:00:00Z");
    const reservationId = await createReservation(clock, start);
    const { outboxRepository, repository } = buildHarness(prisma, clock.now());
    const outboxService = new CommunicationOutboxService(outboxRepository, repository, clock);

    clock.set(new Date("2026-08-21T19:30:00Z")); // 30 minutes AFTER the reservation started
    const scanResult = await outboxService.scanAndScheduleReminders(clock.now());
    expect(scanResult.scheduled).toBe(0);
    expect(reminders(await outboxRepository.findByReservationId(reservationId))).toHaveLength(0);
  });

  it("a reminder row that somehow exists for an already-started reservation is cancelled at send time, never sent", async () => {
    const clock = new MutableClock(new Date("2026-08-20T19:00:00Z"));
    const start = new Date("2026-08-21T19:00:00Z");
    const reservationId = await createReservation(clock, start);
    const { outboxRepository, repository } = buildHarness(prisma, clock.now());
    const outboxService = new CommunicationOutboxService(outboxRepository, repository, clock);
    await outboxService.scanAndScheduleReminders(clock.now());
    expect(reminders(await outboxRepository.findByReservationId(reservationId))).toHaveLength(1);

    clock.set(new Date("2026-08-21T20:00:00Z")); // an hour after the reservation started — worker was down the whole time
    const emailPort = new FakeEmailDeliveryPort();
    const worker = new CommunicationWorker(outboxRepository, repository, emailPort, clock);
    const result = await worker.processBatch();
    // The still-Pending confirmation (unaffected by "already started") is sent normally in the same batch; only the reminder is cancelled.
    expect(result.processed).toBe(2);
    expect(result.sent).toBe(1);
    expect(result.cancelled).toBe(1);
    const reminderMessage = reminders(await outboxRepository.findByReservationId(reservationId))[0];
    expect(reminderMessage?.status).toBe("Cancelled");
  });
});

describe("R8 — NL/EN preserved end-to-end", () => {
  it("a Dutch-language reservation produces a Dutch reminder", async () => {
    const clock = new MutableClock(new Date("2026-08-20T19:00:00Z"));
    const start = new Date("2026-08-21T19:00:00Z");
    const reservationId = await createReservation(clock, start, "nl");
    const { outboxRepository, repository } = buildHarness(prisma, clock.now());
    const outboxService = new CommunicationOutboxService(outboxRepository, repository, clock);
    await outboxService.scanAndScheduleReminders(clock.now());

    const messages = await outboxRepository.findByReservationId(reservationId);
    const reminder = messages.find((m) => m.communicationType === "RESERVATION_REMINDER_24H");
    expect(reminder?.language).toBe("nl");
  });

  it("an English-language reservation produces an English reminder", async () => {
    const clock = new MutableClock(new Date("2026-08-20T19:00:00Z"));
    const start = new Date("2026-08-21T19:00:00Z");
    const reservationId = await createReservation(clock, start, "en");
    const { outboxRepository, repository } = buildHarness(prisma, clock.now());
    const outboxService = new CommunicationOutboxService(outboxRepository, repository, clock);
    await outboxService.scanAndScheduleReminders(clock.now());

    const messages = await outboxRepository.findByReservationId(reservationId);
    const reminder = messages.find((m) => m.communicationType === "RESERVATION_REMINDER_24H");
    expect(reminder?.language).toBe("en");
  });

  it("the confirmation and reminder for the same reservation always share the same language", async () => {
    const clock = new MutableClock(new Date("2026-08-20T19:00:00Z"));
    const start = new Date("2026-08-21T19:00:00Z");
    const reservationId = await createReservation(clock, start, "en");
    const { outboxRepository, repository } = buildHarness(prisma, clock.now());
    const outboxService = new CommunicationOutboxService(outboxRepository, repository, clock);
    await outboxService.scanAndScheduleReminders(clock.now());

    const messages = await outboxRepository.findByReservationId(reservationId);
    expect(messages.every((m) => m.language === "en")).toBe(true);
    expect(messages).toHaveLength(2); // confirmation + reminder
  });
});
