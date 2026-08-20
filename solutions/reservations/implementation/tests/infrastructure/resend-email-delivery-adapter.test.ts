import { describe, it, expect, vi } from "vitest";
import { ResendEmailDeliveryAdapter } from "../../infrastructure/communications/ResendEmailDeliveryAdapter.js";
import { EmailDeliverySendInput } from "../../application/ports/EmailDeliveryPort.js";

/**
 * R1.6-C1B assignment §34/§39 (P1-P8) — proves the Resend adapter's
 * request construction and response classification entirely behind a
 * controlled, injected `fetchImpl` boundary. NEVER makes a real network
 * call, uses NO real Resend credential — `fetchImpl`/`baseUrl` are the
 * adapter's own test-only seams (ResendEmailDeliveryAdapter.ts's own doc
 * comment), the same "controlled provider test boundary" pattern the
 * assignment explicitly required in place of real sandbox/live testing.
 */
const baseInput: EmailDeliverySendInput = {
  recipient: "guest@example.com",
  subject: "Konnichiwa — Reservation confirmed",
  html: "<p>Hello</p>",
  text: "Hello",
  idempotencyKey: "res-1:confirmation",
};

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

function buildAdapter(fetchImpl: typeof fetch) {
  return new ResendEmailDeliveryAdapter({
    apiKey: "test-key-not-real",
    from: "Konnichiwa <reservations@konnichiwa.nl>",
    replyTo: "info@konnichiwa.nl",
    baseUrl: "https://api.resend.test", // never resolved — fetchImpl intercepts every call
    fetchImpl,
  });
}

describe("P1 — valid submission", () => {
  it("returns SUBMITTED with the provider's message id, and sends the correctly-shaped request", async () => {
    let capturedUrl: string | undefined;
    let capturedInit: RequestInit | undefined;
    const fetchImpl = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
      capturedUrl = String(url);
      capturedInit = init;
      return jsonResponse(200, { id: "resend-msg-abc123" });
    }) as unknown as typeof fetch;

    const adapter = buildAdapter(fetchImpl);
    const result = await adapter.send(baseInput);

    expect(result).toEqual({ type: "SUBMITTED", providerMessageId: "resend-msg-abc123" });
    expect(capturedUrl).toBe("https://api.resend.test/emails");
    const headers = capturedInit?.headers as Record<string, string>;
    expect(headers["Authorization"]).toBe("Bearer test-key-not-real");
    expect(headers["Idempotency-Key"]).toBe("res-1:confirmation");
    const body = JSON.parse(capturedInit?.body as string);
    expect(body).toEqual({
      from: "Konnichiwa <reservations@konnichiwa.nl>",
      to: ["guest@example.com"],
      subject: baseInput.subject,
      html: baseInput.html,
      text: baseInput.text,
      reply_to: "info@konnichiwa.nl",
    });
  });

  it("omits Idempotency-Key and reply_to entirely when not supplied — never sent as empty", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse(200, { id: "x" })) as unknown as typeof fetch;
    const adapter = new ResendEmailDeliveryAdapter({ apiKey: "k", from: "Konnichiwa <reservations@konnichiwa.nl>", baseUrl: "https://api.resend.test", fetchImpl });
    await adapter.send({ recipient: "a@example.com", subject: "s", html: "h", text: "t" });
    const init = (fetchImpl as ReturnType<typeof vi.fn>).mock.calls[0]![1] as RequestInit;
    expect((init.headers as Record<string, string>)["Idempotency-Key"]).toBeUndefined();
    expect(JSON.parse(init.body as string).reply_to).toBeUndefined();
  });
});

describe("P2 — 401/403 credential failure", () => {
  it("401 invalid_api_key -> FAILED_PERMANENT, classified reason, never the raw message text", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse(401, { name: "invalid_api_key", message: "API key is invalid — contains real-looking secret text" })) as unknown as typeof fetch;
    const result = await buildAdapter(fetchImpl).send(baseInput);
    expect(result.type).toBe("FAILED_PERMANENT");
    if (result.type === "FAILED_PERMANENT") {
      expect(result.reason).toBe("resend_invalid_api_key");
      expect(result.reason).not.toContain("API key is invalid");
    }
  });

  it("403 missing_api_key -> FAILED_PERMANENT", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse(403, { name: "missing_api_key" })) as unknown as typeof fetch;
    const result = await buildAdapter(fetchImpl).send(baseInput);
    expect(result.type).toBe("FAILED_PERMANENT");
  });
});

describe("P3 — 429 rate/quota limits", () => {
  it("rate_limit_exceeded -> FAILED_RETRYABLE", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse(429, { name: "rate_limit_exceeded" })) as unknown as typeof fetch;
    const result = await buildAdapter(fetchImpl).send(baseInput);
    expect(result.type).toBe("FAILED_RETRYABLE");
  });

  it("daily_quota_exceeded -> FAILED_RETRYABLE", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse(429, { name: "daily_quota_exceeded" })) as unknown as typeof fetch;
    const result = await buildAdapter(fetchImpl).send(baseInput);
    expect(result.type).toBe("FAILED_RETRYABLE");
  });

  it("monthly_quota_exceeded -> FAILED_PERMANENT (retrying cannot fix it before plan upgrade)", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse(429, { name: "monthly_quota_exceeded" })) as unknown as typeof fetch;
    const result = await buildAdapter(fetchImpl).send(baseInput);
    expect(result.type).toBe("FAILED_PERMANENT");
  });

  it("unrecognized 429 with no name falls back to FAILED_RETRYABLE by status code", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse(429, {})) as unknown as typeof fetch;
    const result = await buildAdapter(fetchImpl).send(baseInput);
    expect(result.type).toBe("FAILED_RETRYABLE");
  });
});

describe("P4 — 5xx server errors", () => {
  it("internal_server_error -> FAILED_RETRYABLE", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse(500, { name: "internal_server_error" })) as unknown as typeof fetch;
    const result = await buildAdapter(fetchImpl).send(baseInput);
    expect(result.type).toBe("FAILED_RETRYABLE");
  });

  it("unrecognized 503 with no name falls back to FAILED_RETRYABLE by status code", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse(503, null)) as unknown as typeof fetch;
    const result = await buildAdapter(fetchImpl).send(baseInput);
    expect(result.type).toBe("FAILED_RETRYABLE");
  });
});

describe("P5 — timeout/unknown outcome", () => {
  it("a network error propagates as a thrown exception — the adapter never guesses a result", async () => {
    const fetchImpl = vi.fn(async () => {
      throw new Error("simulated network failure");
    }) as unknown as typeof fetch;
    await expect(buildAdapter(fetchImpl).send(baseInput)).rejects.toThrow("simulated network failure");
  });

  it("a request exceeding timeoutMs is aborted and propagates as a thrown (not swallowed) error", async () => {
    const fetchImpl = vi.fn((_url: string | URL | Request, init?: RequestInit) => {
      return new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () => reject(new Error("The operation was aborted.")));
      });
    }) as unknown as typeof fetch;
    const adapter = new ResendEmailDeliveryAdapter({ apiKey: "k", from: "Konnichiwa <reservations@konnichiwa.nl>", baseUrl: "https://api.resend.test", fetchImpl, timeoutMs: 20 });
    await expect(adapter.send(baseInput)).rejects.toThrow();
  });

  it("retrying after an unknown outcome with the SAME idempotencyKey sends the identical header both times (what makes that retry safe)", async () => {
    const seenKeys: (string | undefined)[] = [];
    const fetchImpl = vi.fn(async (_url: string | URL | Request, init?: RequestInit) => {
      seenKeys.push((init?.headers as Record<string, string>)["Idempotency-Key"]);
      return jsonResponse(200, { id: "resend-msg-retry" });
    }) as unknown as typeof fetch;
    const adapter = buildAdapter(fetchImpl);
    await adapter.send(baseInput); // simulated first attempt (in reality this would have thrown/timed out — this test isolates the "same key reused" property)
    await adapter.send(baseInput); // simulated retry, same message, same idempotencyKey (CommunicationWorker never changes it between attempts)
    expect(seenKeys).toEqual(["res-1:confirmation", "res-1:confirmation"]);
  });
});

describe("P6 — invalid recipient (synchronous rejection)", () => {
  it("invalid_from_address -> FAILED_PERMANENT", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse(422, { name: "invalid_from_address" })) as unknown as typeof fetch;
    const result = await buildAdapter(fetchImpl).send(baseInput);
    expect(result.type).toBe("FAILED_PERMANENT");
  });

  it("validation_error -> FAILED_PERMANENT", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse(400, { name: "validation_error" })) as unknown as typeof fetch;
    const result = await buildAdapter(fetchImpl).send(baseInput);
    expect(result.type).toBe("FAILED_PERMANENT");
  });
});

describe("P7 — same internal message retried (provider-level idempotency)", () => {
  it("a repeated call with the identical idempotencyKey and payload returns the SAME provider message id, not an error", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse(200, { id: "resend-msg-dedup-1" })) as unknown as typeof fetch;
    const adapter = buildAdapter(fetchImpl);
    const first = await adapter.send(baseInput);
    const second = await adapter.send(baseInput);
    expect(first).toEqual({ type: "SUBMITTED", providerMessageId: "resend-msg-dedup-1" });
    expect(second).toEqual({ type: "SUBMITTED", providerMessageId: "resend-msg-dedup-1" });
  });

  it("concurrent_idempotent_requests (409) -> FAILED_RETRYABLE (Resend's own documented retryable case)", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse(409, { name: "concurrent_idempotent_requests" })) as unknown as typeof fetch;
    const result = await buildAdapter(fetchImpl).send(baseInput);
    expect(result.type).toBe("FAILED_RETRYABLE");
  });

  it("invalid_idempotent_request (409, same key different payload) -> FAILED_PERMANENT (a real logic error, not a transient one)", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse(409, { name: "invalid_idempotent_request" })) as unknown as typeof fetch;
    const result = await buildAdapter(fetchImpl).send(baseInput);
    expect(result.type).toBe("FAILED_PERMANENT");
  });
});

describe("Fail-closed correctness (not a numbered P-case, but required by the port's own honesty discipline)", () => {
  it("a 2xx response with no message id throws rather than fabricating a providerMessageId", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse(200, {})) as unknown as typeof fetch;
    await expect(buildAdapter(fetchImpl).send(baseInput)).rejects.toThrow(/no message id/);
  });

  it("recipient/subject containing a line break throws before any network call is made", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse(200, { id: "unused" })) as unknown as typeof fetch;
    const adapter = buildAdapter(fetchImpl);
    await expect(adapter.send({ ...baseInput, subject: "line1\nline2" })).rejects.toThrow(/line breaks/);
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});
