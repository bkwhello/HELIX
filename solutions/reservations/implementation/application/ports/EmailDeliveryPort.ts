/**
 * R1.6-B — provider-independent email delivery boundary (assignment §16;
 * architecture report §17). No provider SDK type, no Reservation/Contact
 * knowledge, no outbox knowledge — a pure "send this exact, already-
 * rendered email" contract. The only place a real provider's SDK will
 * ever be touched (INV-C13) is a future implementation of this interface;
 * this phase ships only the deterministic FakeEmailDeliveryPort
 * (assignment §17 — "real provider selection is NOT authorized").
 */
export interface EmailDeliverySendInput {
  readonly recipient: string;
  readonly subject: string;
  readonly html: string;
  readonly text: string;
  /** Passed through to the provider if it supports one — reduces (never eliminates, see architecture report §34's honest at-least-once caveat) duplicate-send risk under retry. */
  readonly idempotencyKey?: string;
}

/**
 * §18 — never claims `DELIVERED`. `SUBMITTED` means only "the provider
 * accepted the request", the most this port can honestly know without
 * provider webhooks (not built in this phase, architecture report §28).
 */
export type EmailDeliveryResult =
  | { readonly type: "SUBMITTED"; readonly providerMessageId: string }
  | { readonly type: "FAILED_RETRYABLE"; readonly reason: string }
  | { readonly type: "FAILED_PERMANENT"; readonly reason: string };

export interface EmailDeliveryPort {
  send(input: EmailDeliverySendInput): Promise<EmailDeliveryResult>;
}
