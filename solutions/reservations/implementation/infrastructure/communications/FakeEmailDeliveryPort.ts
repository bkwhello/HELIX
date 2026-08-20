/**
 * R1.6-B — deterministic test/fake delivery adapter (assignment §17).
 * Real provider selection is NOT authorized this phase (assignment §46);
 * this is the sanctioned placeholder that proves EmailDeliveryPort's
 * contract end-to-end without ever sending a real email. Simulates
 * success, retryable failure, permanent failure, and an ambiguous/timeout
 * outcome (thrown error — the worker's caller must survive this without
 * crashing the whole batch, exercised directly by
 * tests/integration/communication-worker.test.ts).
 */
import { EmailDeliveryPort, EmailDeliverySendInput, EmailDeliveryResult } from "../../application/ports/EmailDeliveryPort.js";

export type QueuedOutcome = EmailDeliveryResult | { readonly type: "THROW"; readonly error: Error };

export class FakeEmailDeliveryPort implements EmailDeliveryPort {
  private readonly queue: QueuedOutcome[] = [];
  private readonly sentLog: EmailDeliverySendInput[] = [];
  private nextProviderMessageSeq = 1;

  /** Queues the outcome for the NEXT send() call (FIFO). If the queue is empty, send() defaults to SUBMITTED (a deterministic success). */
  enqueueResult(outcome: QueuedOutcome): void {
    this.queue.push(outcome);
  }

  async send(input: EmailDeliverySendInput): Promise<EmailDeliveryResult> {
    this.sentLog.push(input);
    const next = this.queue.shift();
    if (!next) {
      return { type: "SUBMITTED", providerMessageId: `fake-${this.nextProviderMessageSeq++}` };
    }
    if (next.type === "THROW") {
      throw next.error;
    }
    return next;
  }

  getSentMessages(): readonly EmailDeliverySendInput[] {
    return this.sentLog;
  }

  reset(): void {
    this.queue.length = 0;
    this.sentLog.length = 0;
  }
}
