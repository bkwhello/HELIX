/**
 * R1.6-B — the cron-triggered communications processor (assignment §14/
 * §29; architecture report §12's "Model C: cron-triggered command").
 * Mirrors ops/backup/createBackup.ts's own pattern exactly: a bounded,
 * externally-scheduled, one-shot script — not an always-running
 * in-process loop (rejected, see the implementation report §11) — sharing
 * the same still-open scheduler/cron hosting prerequisite R1.4 already
 * flagged for backups.
 *
 * Run via `npm run process-communications` (reads DATABASE_URL) or
 * `tsx ops/communications/processOutbox.ts` directly. Callable/testable
 * independently of HTTP traffic (assignment §14) — `runCommunicationsCycle`
 * is the function tests call directly against TEST_DATABASE_URL.
 *
 * Uses FakeEmailDeliveryPort — a real email provider is NOT authorized
 * this phase (assignment §46). No external mail API is ever called by
 * this script.
 */
import { PrismaClient } from "@prisma/client";
import { PrismaCommunicationOutboxRepository } from "../../infrastructure/persistence/PrismaCommunicationOutboxRepository.js";
import { PrismaReservationRepository } from "../../infrastructure/persistence/PrismaReservationRepository.js";
import { CommunicationOutboxService } from "../../application/communications/CommunicationOutboxService.js";
import { CommunicationWorker, ProcessBatchResult } from "../../application/communications/CommunicationWorker.js";
import { FakeEmailDeliveryPort } from "../../infrastructure/communications/FakeEmailDeliveryPort.js";
import { SystemClock } from "../../infrastructure/SystemClock.js";

export interface CommunicationsCycleResult extends ProcessBatchResult {
  readonly scanned: number;
  readonly scheduled: number;
}

export async function runCommunicationsCycle(databaseUrl: string): Promise<CommunicationsCycleResult> {
  const prisma = new PrismaClient({ datasourceUrl: databaseUrl });
  try {
    const clock = new SystemClock();
    const reservationRepository = new PrismaReservationRepository(prisma);
    const outboxRepository = new PrismaCommunicationOutboxRepository(prisma);
    const outboxService = new CommunicationOutboxService(outboxRepository, reservationRepository, clock);
    const emailPort = new FakeEmailDeliveryPort();
    const worker = new CommunicationWorker(outboxRepository, reservationRepository, emailPort, clock);

    const scanResult = await outboxService.scanAndScheduleReminders(clock.now());
    const batchResult = await worker.processBatch();

    return { ...scanResult, ...batchResult };
  } finally {
    await prisma.$disconnect();
  }
}

async function main(): Promise<void> {
  const databaseUrl = process.env["DATABASE_URL"];
  if (!databaseUrl) {
    console.error("processOutbox: DATABASE_URL is not set.");
    process.exitCode = 1;
    return;
  }
  const result = await runCommunicationsCycle(databaseUrl);
  console.log(
    `processOutbox: scanned ${result.scanned} reservations, scheduled ${result.scheduled} reminders; ` +
      `processed ${result.processed} messages -> sent ${result.sent}, retried ${result.retried}, ` +
      `permanentlyFailed ${result.permanentlyFailed}, cancelled ${result.cancelled}, unknown ${result.unknown}.`
  );
}

const isDirectRun = process.argv[1]?.endsWith("processOutbox.ts") || process.argv[1]?.endsWith("processOutbox.js");
if (isDirectRun) {
  main().catch((err) => {
    console.error("processOutbox: failed —", err);
    process.exitCode = 1;
  });
}
