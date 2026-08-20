/**
 * R1.6-C1B — the real `EmailDeliveryPort` implementation for Resend
 * (selected in R1_6_C1A_EMAIL_PROVIDER_SELECTION_ARCHITECTURE.md §27).
 * A thin translation layer only, per that report's own §29 adapter
 * design: no Reservation/reminder/Contact/template/retry-scheduling/
 * outbox-claiming knowledge lives here — `CommunicationWorker` already
 * owns all of that and calls this class through the provider-agnostic
 * `EmailDeliveryPort` interface it already depended on.
 *
 * Deliberately uses Resend's plain HTTPS JSON API via the platform's
 * native `fetch` rather than the `resend` npm package — Resend's own API
 * is a simple flat JSON POST (confirmed in the C1A research), so no SDK
 * dependency is required for correctness, and adding one was never
 * explicitly authorized by the R1.6-C1B assignment (only the adapter
 * IMPLEMENTATION was authorized, not "provider SDK installation" — the
 * exact phrase C1A's own prohibited-actions list used for the phase
 * before this one). This keeps the change to a single new file with zero
 * new package.json dependencies.
 */
import { EmailDeliveryPort, EmailDeliverySendInput, EmailDeliveryResult } from "../../application/ports/EmailDeliveryPort.js";

export interface ResendEmailDeliveryAdapterConfig {
  readonly apiKey: string;
  /** e.g. "Konnichiwa <reservations@konnichiwa.nl>" — owner-confirmed format (R1.6-C1B assignment). */
  readonly from: string;
  /** e.g. "info@konnichiwa.nl" — owner-confirmed (R1.6-C1B assignment). Omitted entirely from the request when absent, never sent as an empty string. */
  readonly replyTo?: string;
  /** Bounded so a hung request can never leave a claimed outbox row stuck past CommunicationWorker's own staleness-reclaim window indefinitely for no reason. Default chosen well under that window (5 min default), not tuned to any measured Resend latency (none available — no real call has ever been made). */
  readonly timeoutMs?: number;
  /** Test-only seam — defaults to the platform's real global `fetch`. Never overridden in production composition (ops/communications/processOutbox.ts). */
  readonly fetchImpl?: typeof fetch;
  /** Test-only seam — defaults to Resend's real API origin. Never overridden in production composition. */
  readonly baseUrl?: string;
}

const DEFAULT_BASE_URL = "https://api.resend.com";
const DEFAULT_TIMEOUT_MS = 10_000;

/** The subset of Resend's documented error-response shape this adapter reads. Every other field (if any) is intentionally ignored — never logged, never surfaced (see classifyError's own doc comment on why the raw body itself is never propagated as `reason`). */
interface ResendErrorBody {
  readonly name?: string;
  readonly message?: string;
}

interface ResendSuccessBody {
  readonly id?: string;
}

/**
 * Maps a non-2xx Resend response to the port's two-way failure
 * classification (assignment §19's mapping table, carried over verbatim
 * from R1_6_C1A's own §19). `name` is used when Resend supplies one
 * (documented values: validation_error, missing_api_key, invalid_api_key,
 * invalid_from_address, missing_required_field -> permanent;
 * concurrent_idempotent_requests, rate_limit_exceeded,
 * daily_quota_exceeded, application_error, internal_server_error ->
 * retryable; monthly_quota_exceeded, invalid_idempotent_request,
 * security_error -> permanent). An unrecognized/absent `name` falls back
 * to a conservative status-code rule: 429 and 5xx are retryable (a
 * transient-looking response), everything else is permanent (retrying an
 * unchanged bad request wastes attempts and delays the operator-visible
 * signal that manual follow-up is needed — the same reasoning
 * domain/communications/CommunicationMessage.ts already documents for
 * the 4xx/5xx split in general).
 */
function classifyError(status: number, body: ResendErrorBody | null): { readonly type: "FAILED_RETRYABLE" | "FAILED_PERMANENT"; readonly reason: string } {
  const name = body?.name;
  // Never the raw `message` text (R1.6-B's own established discipline,
  // reused here — application/communications/CommunicationOutboxService.ts
  // and the R1.6-B architecture report both establish that `lastError`
  // is a short, classified string, never a raw provider payload, which
  // could itself echo back the recipient address or other guest data).
  const reason = `resend_${name ?? `http_${status}`}`;

  const retryableNames = new Set(["concurrent_idempotent_requests", "rate_limit_exceeded", "daily_quota_exceeded", "application_error", "internal_server_error"]);
  const permanentNames = new Set(["validation_error", "missing_api_key", "invalid_api_key", "invalid_from_address", "missing_required_field", "monthly_quota_exceeded", "invalid_idempotent_request", "security_error"]);

  if (name && retryableNames.has(name)) return { type: "FAILED_RETRYABLE", reason };
  if (name && permanentNames.has(name)) return { type: "FAILED_PERMANENT", reason };
  if (status === 429 || status >= 500) return { type: "FAILED_RETRYABLE", reason };
  return { type: "FAILED_PERMANENT", reason };
}

export class ResendEmailDeliveryAdapter implements EmailDeliveryPort {
  constructor(private readonly config: ResendEmailDeliveryAdapterConfig) {}

  async send(input: EmailDeliverySendInput): Promise<EmailDeliveryResult> {
    // Defense-in-depth only (R1_6_C1A §35): these values reach this
    // adapter as a JSON body field, never as a raw SMTP header line, so
    // there is no real injection vector today — but a control character
    // here would still indicate a caller bug (a template or recipient
    // resolution defect) worth failing loudly on rather than silently
    // forwarding to the provider.
    if (/[\r\n]/.test(input.recipient) || /[\r\n]/.test(input.subject)) {
      throw new Error("ResendEmailDeliveryAdapter: recipient/subject must not contain line breaks.");
    }

    const fetchFn = this.config.fetchImpl ?? fetch;
    const baseUrl = this.config.baseUrl ?? DEFAULT_BASE_URL;
    const timeoutMs = this.config.timeoutMs ?? DEFAULT_TIMEOUT_MS;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    let response: Response;
    try {
      // A thrown network error or an aborted-by-timeout request is
      // deliberately NOT caught here — it propagates to
      // CommunicationWorker.processBatch's own try/catch (application/
      // communications/CommunicationWorker.ts), which leaves the row
      // Processing rather than guessing at an outcome this adapter
      // cannot honestly know (R1_6_C1A §3/§19's "ambiguous/unknown
      // outcome" handling, proven deterministic in R1.6-B1). The retry
      // that follows reuses the SAME idempotencyKey (CommunicationWorker
      // never changes it between attempts), which is exactly what makes
      // that retry safe against Resend specifically (§18) — this
      // adapter needs no retry logic of its own for that to hold.
      response = await fetchFn(`${baseUrl}/emails`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.config.apiKey}`,
          ...(input.idempotencyKey ? { "Idempotency-Key": input.idempotencyKey } : {}),
        },
        body: JSON.stringify({
          from: this.config.from,
          to: [input.recipient],
          subject: input.subject,
          html: input.html,
          text: input.text,
          ...(this.config.replyTo ? { reply_to: this.config.replyTo } : {}),
        }),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }

    if (response.ok) {
      const body = (await response.json().catch(() => null)) as ResendSuccessBody | null;
      if (!body?.id) {
        // Fail-closed, not fail-silent: a 2xx with no message id is an
        // outcome this adapter cannot honestly classify as SUBMITTED
        // (R1_6_C0's own fail-closed precedent, applied to this new
        // boundary) — never fabricate a providerMessageId.
        throw new Error("ResendEmailDeliveryAdapter: provider returned a successful status with no message id.");
      }
      return { type: "SUBMITTED", providerMessageId: body.id };
    }

    const errorBody = (await response.json().catch(() => null)) as ResendErrorBody | null;
    return classifyError(response.status, errorBody);
  }
}
