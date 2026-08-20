# R1.6-C1B — Resend EmailDeliveryPort Adapter: Implementation Report

Program: Guestplan Replacement
Assignment: "R1.6-C1B — Resend EmailDeliveryPort Adapter Implementation"
Mode: BOUNDED IMPLEMENTATION, behind `EmailDeliveryPort`, entirely via controlled/injected test boundaries — no real Resend credential, no real email, no DNS changes, no ZXCS/Vimexx changes, no deployment, no push.

Previous gates: R1.1–R1.5 — PASS · R1.6-A — PASS · R1.6-B — PASS · R1.6-B1 — PASS (commit `7d4aadf`, 639/639) · R1.6-C0 — PASS (commit `519431f`) · R1.6-C1A Provider Selection — PASS (Resend selected, investigation-only, no commit).

## 1. Baseline Verification

- HEAD before this work: `7d4aadf26af81392f3e339d174a311c9d4ead5e5`
- `git log --oneline` confirmed both required commits present in history: `519431f` (R1.6-C0, "fix(reservations): enforce service periods on creation") and `7d4aadf` (R1.6-B1, "fix(reservations): make communication outbox claiming deterministic")
- Branch: `feat/ec-002-visibility-baseline`
- Working tree: clean except the four pre-existing untracked investigation docs (`R1_3_...`, `R1_6_B_...`, `R1_6_C1A_...`, `R1_6_GUEST_BOOKING_...`) — all preserved untouched, none deleted or overwritten
- Full regression at baseline: 639/639 (carried from R1.6-B1's own final state)

No pull, rebase, merge, or branch switch was performed.

## 2. Owner-Confirmed Inputs Used

Per this assignment's correction message: provider **Resend**; sender `Konnichiwa <reservations@konnichiwa.nl>`; Reply-To `info@konnichiwa.nl`; optional future operational mailbox `reservation@konnichiwa.nl` (not used by this implementation — no code references it); website hosting Vimexx and current email infrastructure ZXCS (noted, not touched — no DNS/hosting change was made or needed, §4); DNS location and existing SPF/DKIM/DMARC records explicitly UNKNOWN and **not assumed or queried** anywhere in this implementation.

## 3. What Was Implemented

Three new files, one modified file — nothing else touched:

1. `infrastructure/communications/ResendEmailDeliveryAdapter.ts` (new) — the real `EmailDeliveryPort` implementation.
2. `tests/infrastructure/resend-email-delivery-adapter.test.ts` (new) — 20 tests, P1–P8 plus two fail-closed-correctness cases, all against a controlled/injected `fetchImpl` boundary.
3. `tests/infrastructure/process-outbox-provider-selection.test.ts` (new) — 8 tests proving the production-composition fail-closed behavior (P8, in depth).
4. `ops/communications/processOutbox.ts` (modified) — the one production composition root that constructs an `EmailDeliveryPort`, now choosing between `FakeEmailDeliveryPort` and `ResendEmailDeliveryAdapter` via a new, pure, directly-testable `buildEmailPort()` function.

No other file was touched. In particular: `EmailDeliveryPort.ts` itself, `CommunicationWorker.ts`, `CommunicationOutboxService.ts`, `Templates.ts`, the outbox schema, and `api/app.ts`/`api/server.ts` (which never construct an `EmailDeliveryPort` at all — only `processOutbox.ts` does, confirmed by inspection before writing any code) are all unchanged.

## 4. Confirmed: C1B Did Not Require DNS

The adapter, its 28 new tests, and the production-composition wiring were all built and fully proven **without any DNS record, without any real Resend account, and without any real network call** — exactly as instructed. `ResendEmailDeliveryAdapter`'s `fetchImpl`/`baseUrl` constructor fields are the test-only seam that made this possible (§6); production code never overrides them (it always uses the real global `fetch` and `https://api.resend.com`), but no test in this change ever reaches that real endpoint. DNS/SPF/DKIM/DMARC, Vimexx, and ZXCS remain exactly as they were — genuinely `UNKNOWN`, and this implementation neither queried nor assumed anything about them.

## 5. No SDK Installed

`package.json` was **not modified** — zero new dependencies. The adapter calls Resend's plain HTTPS JSON API (`POST https://api.resend.com/emails`) via the platform's native `fetch` (Node's built-in, already relied on implicitly elsewhere in this stack; `@types/node` 26.1.1, confirmed present transitively via `@types/express`, ships the necessary `fetch`/`Response`/`AbortController` global types). This was a deliberate interpretation of the assignment's own prohibited-actions list: the R1.6-C1A phase before this one explicitly listed "Provider SDK installation: NOT AUTHORIZED" as a separate line item from "Implementation: NOT AUTHORIZED" — this phase authorizes implementation but never explicitly authorizes adding the `resend` npm package. Since Resend's own API is a simple, flat JSON POST (confirmed directly in the C1A research), no SDK is required for a correct adapter, so the safer, narrower reading was followed: implement against the raw HTTP API, add no new dependency.

## 6. Adapter Design

`ResendEmailDeliveryAdapter implements EmailDeliveryPort` (`application/ports/EmailDeliveryPort.ts`, unchanged):

- **Constructor**: `{ apiKey, from, replyTo?, timeoutMs?, fetchImpl?, baseUrl? }`. Only `apiKey`/`from` are required — `replyTo` matches the owner-confirmed `info@konnichiwa.nl` when supplied by the composition root, `timeoutMs` defaults to 10s, `fetchImpl`/`baseUrl` are test-only seams defaulting to the real `fetch`/`https://api.resend.com`.
- **`send(input)`**: builds the exact Resend request (`from`, `to: [recipient]`, `subject`, `html`, `text`, `reply_to` when present), sets `Authorization: Bearer <apiKey>` and, when `input.idempotencyKey` is present, an `Idempotency-Key` header carrying it through unchanged — reusing the outbox row's own existing idempotency key (e.g. `${reservationId}:confirmation`), not a new key-generation scheme.
- **Success (2xx)**: requires a `{ id }` body to return `SUBMITTED` — a 2xx with no `id` throws rather than fabricating a `providerMessageId` (fail-closed, matching R1.6-C0's own established precedent for this codebase).
- **Failure (non-2xx)**: `classifyError(status, body)` maps Resend's documented error `name` values to `FAILED_RETRYABLE`/`FAILED_PERMANENT` exactly per R1.6-C1A's own §19 mapping table, with a conservative status-code fallback (429/5xx → retryable, everything else → permanent) when `name` is absent or unrecognized. The returned `reason` is always a short classification string (`resend_<name-or-status>`) — **never the raw provider `message` text**, matching the exact "short, classified string, never a raw provider payload" discipline `lastError` already follows elsewhere in this codebase (R1.6-B architecture investigation §14/§35; verified by a dedicated test asserting the raw message text does NOT appear in the returned reason).
- **Network error / timeout**: not caught inside the adapter — propagates as a thrown exception, exactly matching `CommunicationWorker.processBatch`'s own existing `try/catch` (leaves the row `Processing`, never guesses, R1.6-B1-proven deterministic). A bounded `AbortController` timeout (default 10s) ensures a hung request cannot block indefinitely.
- **Input validation**: recipient/subject are rejected (thrown, before any network call) if they contain a raw line break — defense-in-depth noted as not a real injection vector for a JSON-bodied HTTP API, but cheap and honest to guard anyway.

**Non-responsibilities, confirmed unchanged**: no Reservation/reminder/Contact logic, no template rendering (templates remain application-owned, `domain/communications/Templates.ts`, untouched), no retry scheduling (`CommunicationWorker`'s job, untouched), no outbox claiming (`PrismaCommunicationOutboxRepository`'s job, untouched).

## 7. Production Composition (Fail-Closed)

`ops/communications/processOutbox.ts` gained one new, pure, exported function:

```ts
export function buildEmailPort(env: Readonly<Record<string, string | undefined>>): EmailDeliveryPort {
  const provider = env["EMAIL_PROVIDER"];
  if (!provider || provider === "fake") return new FakeEmailDeliveryPort();
  if (provider === "resend") {
    const apiKey = env["EMAIL_PROVIDER_API_KEY"];
    const from = env["EMAIL_FROM_ADDRESS"];
    if (!apiKey || !from) throw new Error(/* ... */);
    return new ResendEmailDeliveryAdapter({ apiKey, from, replyTo: env["EMAIL_REPLY_TO"] });
  }
  throw new Error(`processOutbox: unknown EMAIL_PROVIDER "${provider}".`);
}
```

`runCommunicationsCycle` now calls `buildEmailPort(process.env)` instead of unconditionally constructing `FakeEmailDeliveryPort`. Behavior:

- **`EMAIL_PROVIDER` unset (today's exact state, and every existing test/deployment)** → `FakeEmailDeliveryPort`, byte-for-byte the same behavior as before this change. No `.env` file in this repository defines `EMAIL_PROVIDER` (confirmed by inspection) — nothing changes for any current environment until someone deliberately sets it.
- **`EMAIL_PROVIDER=resend` with both `EMAIL_PROVIDER_API_KEY` and `EMAIL_FROM_ADDRESS` set** → real `ResendEmailDeliveryAdapter`, `EMAIL_REPLY_TO` passed through when present.
- **`EMAIL_PROVIDER=resend` with either credential missing** → **throws immediately**, refusing to start, rather than silently falling back to `FakeEmailDeliveryPort`. This is the fail-closed behavior R1_6_C1A §31 specified: a configured-real environment must never look like it's sending email when it silently isn't.
- **Any other `EMAIL_PROVIDER` value** → throws.

This is deliberately the smallest possible change to close R1.6-B's own long-standing "Uses FakeEmailDeliveryPort — a real email provider is NOT authorized this phase" gap (`processOutbox.ts`'s own prior doc comment, now updated) without touching anything about how the cycle itself runs.

## 8. Failure-Test Plan Results (P1–P8)

All in `tests/infrastructure/resend-email-delivery-adapter.test.ts` (adapter-level, P1–P7) and `tests/infrastructure/process-outbox-provider-selection.test.ts` (composition-level, P8) — real Vitest, zero network calls, zero Postgres dependency (pure unit tests):

| # | Case | Result |
|---|---|---|
| P1 | Valid submission | PASS — `SUBMITTED` + provider id; request shape (headers, body, `Idempotency-Key`, omitted-when-absent fields) independently verified |
| P2 | 401/403 credential failure | PASS — `FAILED_PERMANENT`; raw message text confirmed absent from the returned `reason` |
| P3 | 429 (rate/daily/monthly quota) | PASS — rate-limit and daily-quota retryable; monthly-quota permanent; unrecognized 429 falls back to retryable |
| P4 | 5xx | PASS — named `internal_server_error` and an unrecognized/bodyless 503 both retryable |
| P5 | Timeout/unknown outcome | PASS — a thrown network error propagates unmodified; an `AbortController` timeout propagates as a rejection; a same-`idempotencyKey` retry is proven to send the identical header both times |
| P6 | Invalid recipient (synchronous) | PASS — `invalid_from_address` and `validation_error` both `FAILED_PERMANENT` |
| P7 | Same internal message retried | PASS — an identical repeated call returns the same `providerMessageId`; `concurrent_idempotent_requests` (409) retryable; `invalid_idempotent_request` (409, mismatched payload) permanent |
| P8 | Adapter cannot initialize | PASS — missing API key, missing from-address, and both-missing all throw at composition time; an unknown provider value throws; the unset/`"fake"` cases correctly still construct `FakeEmailDeliveryPort` |

**Total: 28/28 new tests passing** (20 adapter + 8 composition), first attempt, no fixes required.

## 9. Security/Privacy Review

- **API key handling**: read only from injected config at construction (never `process.env` read inside the adapter itself — that happens once, in `buildEmailPort`); never logged, never included in any thrown error message or classified `reason` string.
- **No raw provider payload ever surfaces**: `classifyError`'s `reason` is always a short label (`resend_invalid_api_key`, `resend_http_500`, etc.), verified by a dedicated test that the actual Resend `message` text (which could echo back the recipient address, per the R1.6-B architecture report's own established concern) never appears in the returned value.
- **Header/content injection**: recipient/subject are rejected outright (thrown) if they contain a raw line break, before any request is constructed — defense-in-depth for a JSON-bodied API where this isn't a real injection vector today, but cheap to guard.
- **No credential in this codebase**: no real API key was ever requested, generated, or handled at any point in this implementation — every test uses an obviously-fake placeholder string (`"test-key-not-real"`), and the real `fetch`/`https://api.resend.com` path was never exercised.
- **Guest-management token**: unaffected — `Templates.ts`'s `managementLink` field remains unpopulated by any caller today (R1.6-C1A §24's finding stands unchanged); this adapter has no knowledge of tokens at all, it only transmits whatever `html`/`text` the caller already rendered.

## 10. Full Regression

`npm run typecheck` — clean, zero errors, after every change in this assignment.

`npx vitest run` (full suite): **667/667 passing, 52/52 test files** — up from the R1.6-B1 baseline of 639/639, 50 files. The delta is exactly the 28 new tests in the two new test files (2 new files × 20 + 8 = 28; 639 + 28 = 667). **Zero failures, zero new regressions**, and the previously-identified-and-fixed R1.6-B1 flake remains fixed (no recurrence observed in this run).

## 11. What This Does Not Do (Explicitly Out of Scope, Per Instruction)

No real Resend account was created. No real API key was requested, generated, or stored anywhere (including `.env`, which was not modified — `EMAIL_PROVIDER`/`EMAIL_PROVIDER_API_KEY`/`EMAIL_FROM_ADDRESS`/`EMAIL_REPLY_TO` are recognized by `buildEmailPort` but not yet set anywhere in this repository). No real email was sent — every test exercises the adapter through a fully synthetic, injected `fetchImpl`. No DNS record was queried, assumed, or modified for `konnichiwa.nl`, ZXCS, or Vimexx. No deployment or push was performed.

## 12. Remaining Risks

| # | Risk | Class |
|---|---|---|
| 1 | The adapter's error-classification table (§6) is built entirely from R1.6-C1A's documented research of Resend's error `name` values — it has never been exercised against Resend's real API, so an undocumented or newly-introduced error `name` would fall through to the conservative status-code fallback (still safe — 429/5xx retryable, else permanent — but unverified against reality). Resolvable only by a future, separately-authorized real-credential smoke test (R1_6_C1A §33/§38, not this phase). | P2 |
| 2 | `EMAIL_PROVIDER`/`EMAIL_PROVIDER_API_KEY`/`EMAIL_FROM_ADDRESS`/`EMAIL_REPLY_TO` are not yet set anywhere — `processOutbox.ts` in every current environment still uses `FakeEmailDeliveryPort` today, exactly as before this change. This is intentional (§7) — genuinely enabling Resend requires the still-open DNS/credential work this phase was explicitly told not to do. | Informational, not a defect |
| 3 | No webhook endpoint exists (unchanged from R1.6-C1A's own explicit deferral, §20/§27 of that report) — bounce/complaint feedback remains entirely unimplemented; `SUBMITTED` still means only "Resend accepted the request," never confirmed delivery. | P3, already documented, unchanged by this phase |

## 13. Final Verdict

Resend adapter implemented, thin, behind the existing `EmailDeliveryPort` with zero changes to that interface or to any Reservation/Communication business logic. 28/28 new tests pass against a fully controlled, injected test boundary — no real credential, no real email, no DNS work. Production composition now supports real Resend delivery when explicitly configured, and fails closed (throws, never silently substitutes the fake adapter) when misconfigured. Full regression 667/667, zero regressions. No SDK dependency added.

## 14. Commit State

One bounded local commit created (hash in final response). Not pushed.

## Evidence Appendix

- `application/ports/EmailDeliveryPort.ts` (re-confirmed unchanged, no redesign needed)
- `application/communications/CommunicationWorker.ts` (re-confirmed unchanged; its existing `try/catch` around `send()` is what this adapter's propagate-don't-guess design relies on)
- `ops/communications/processOutbox.ts` (read in full before and after modification)
- `.env` (confirmed no `EMAIL_*` variable exists — no production credential was added or touched)
- `package.json` (confirmed unchanged — no new dependency)
- `node_modules/@types/node/package.json` (confirmed version 26.1.1, providing the global `fetch`/`Response`/`AbortController` types this adapter relies on, transitively installed via `@types/express`)
- `R1_6_C1A_EMAIL_PROVIDER_SELECTION_ARCHITECTURE.md` §19/§27/§29/§31/§34 (the design this implementation follows)
- `git log --oneline` (confirmed `519431f` and `7d4aadf` both present before starting)
- `tests/infrastructure/resend-email-delivery-adapter.test.ts` — new, 20 tests, all passing
- `tests/infrastructure/process-outbox-provider-selection.test.ts` — new, 8 tests, all passing
