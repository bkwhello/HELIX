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
 * R1.6-C1B — `buildEmailPort` (below) is the one place this script
 * chooses between the real Resend adapter and the deterministic
 * FakeEmailDeliveryPort, per R1_6_C1A_EMAIL_PROVIDER_SELECTION_ARCHITECTURE.md
 * §31's own fail-closed design: `EMAIL_PROVIDER` unset/absent keeps
 * today's exact behavior (Fake, no external call ever made) so every
 * existing deployment/test keeps working unchanged; `EMAIL_PROVIDER=resend`
 * signals real intent and REQUIRES real credentials/from-address to be
 * present, or this throws rather than silently falling back to Fake —
 * a misconfigured "real" environment must never look like it's sending
 * email when it silently isn't.
 */
import { PrismaClient } from "@prisma/client";
import { PrismaCommunicationOutboxRepository } from "../../infrastructure/persistence/PrismaCommunicationOutboxRepository.js";
import { PrismaReservationRepository } from "../../infrastructure/persistence/PrismaReservationRepository.js";
import { CommunicationOutboxService } from "../../application/communications/CommunicationOutboxService.js";
import { CommunicationWorker, ProcessBatchResult } from "../../application/communications/CommunicationWorker.js";
import { EmailDeliveryPort } from "../../application/ports/EmailDeliveryPort.js";
import { FakeEmailDeliveryPort } from "../../infrastructure/communications/FakeEmailDeliveryPort.js";
import { ResendEmailDeliveryAdapter } from "../../infrastructure/communications/ResendEmailDeliveryAdapter.js";
import { SystemClock } from "../../infrastructure/SystemClock.js";

export interface CommunicationsCycleResult extends ProcessBatchResult {
  readonly scanned: number;
  readonly scheduled: number;
}

/**
 * Pure (no I/O) so it is directly unit-testable against a plain object —
 * never reads `process.env` itself. Exported for that reason; `main()`
 * below is the only real caller in production.
 */
export function buildEmailPort(env: Readonly<Record<string, string | undefined>>): EmailDeliveryPort {
  const provider = env["EMAIL_PROVIDER"];
  if (!provider || provider === "fake") return new FakeEmailDeliveryPort();

  if (provider === "resend") {
    const apiKey = env["EMAIL_PROVIDER_API_KEY"];
    const from = env["EMAIL_FROM_ADDRESS"];
    if (!apiKey || !from) {
      throw new Error(
        'processOutbox: EMAIL_PROVIDER=resend but EMAIL_PROVIDER_API_KEY and/or EMAIL_FROM_ADDRESS is not set — refusing to start. ' +
          "A configured-real environment must fail closed, never silently fall back to the fake adapter."
      );
    }
    return new ResendEmailDeliveryAdapter({ apiKey, from, replyTo: env["EMAIL_REPLY_TO"] });
  }

  throw new Error(`processOutbox: unknown EMAIL_PROVIDER "${provider}".`);
}

export async function runCommunicationsCycle(databaseUrl: string): Promise<CommunicationsCycleResult> {
  const prisma = new PrismaClient({ datasourceUrl: databaseUrl });
  try {
    const clock = new SystemClock();
    const reservationRepository = new PrismaReservationRepository(prisma);
    const outboxRepository = new PrismaCommunicationOutboxRepository(prisma);
    const outboxService = new CommunicationOutboxService(outboxRepository, reservationRepository, clock);
    const emailPort = buildEmailPort(process.env);
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
