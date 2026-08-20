# R1.6-B — Guest Communications Engine: Implementation Report

Program: Guestplan Replacement
Mode: BOUNDED IMPLEMENTATION

Previous gates: R1.1–R1.5 — PASS · R1.6 Architecture Investigation — COMPLETE · R1.6-A Service Period — PASS WITH FOLLOW-UP · R1.6-B Communications Architecture — PASS.

---

## 1. Baseline

| Check | Result |
|---|---|
| Branch | `feat/ec-002-visibility-baseline` |
| HEAD (before this work) | `9b93c904a53acb6a1b57306f9aead869281b9532` — matches the assignment's expected `9b93c90` |
| Full regression (before) | 39 test files, 496/496 passing |

## 2. Architecture Implemented

The exact model the R1.6-B architecture investigation recommended (its own §37 "Model D"), with zero deviation on the core shape:

```
Reservation transaction commits (CreateReservationHandler.finalize(), existing tx)
  → CommunicationMessage row inserted atomically (Confirmation, if hasUsableEmail)
  → GuestManagementCredential row issued (best-effort, non-transactional)
        ↓
cron-triggered "process-communications" command (ops/communications/processOutbox.ts)
  → SELECT ... FOR UPDATE SKIP LOCKED (claim a batch)
  → mark Processing
  → re-verify live eligibility (mandatory send-time re-check)
  → render template (domain/communications/Templates.ts) + call EmailDeliveryPort.send()
  → mark Sent / FailedRetryable (reschedule) / FailedPermanent / Cancelled

same cadence also runs the reminder scan (CommunicationOutboxService.scanAndScheduleReminders):
  → find reservations newly inside the 24h window with no active Reminder row
  → insert one Reminder-type CommunicationMessage row per match
```

No real email provider is connected — `FakeEmailDeliveryPort` is the only `EmailDeliveryPort` implementation shipped (assignment §46).

## 3. Owner Decisions (restated for traceability, not re-decided)

Email-only; confirmation queued (not sent) immediately at commit; exactly one 24h reminder; staff-created reservations with a usable email get the same automatic confirmation+reminder as future online bookings; phone-only staff reservations remain fully valid with zero communication intent; NL/EN explicit, staff-specifiable, defaulting to `nl` (never inferred) when omitted; staff resend operation required.

## 4. Capability Mapping

Reused, not reinvented, per the architecture report's own finding: CAP-D06.01 (Reservation Confirmation)'s registered event names `ConfirmationRequested`/`ConfirmationSent`/`ConfirmationDeliveryFailed` and CAP-D06.02 (Reminder Management)'s `ReminderScheduled`/`ReminderSent`/`ReminderCancelled`/`ReminderDeliveryFailed` map directly onto this implementation's `CommunicationMessage.status` transitions (`Pending`→`Processing`→`Sent`/`FailedRetryable`/`FailedPermanent`/`Cancelled`) — no new capability IDs were invented. The CAP-D06 registry-divergence finding (§28 below) stands as reported by the architecture gate, unresolved by this implementation, per instruction.

## 5. Schema

Two new models (`prisma/schema.prisma`), one new column, migration `20260820160000_add_guest_communications` (additive only — see its own header comment for the same class of unrelated, pre-existing `DropForeignKey` statements `prisma migrate diff` also proposed and were deliberately excluded, exactly as R1.6-A's own migration did), applied to both `DATABASE_URL` and `TEST_DATABASE_URL`:

- `Reservation.communicationLanguage String @default("nl")` — frozen at creation, mirrors `contactEmailSnapshot`'s own "reservation-time snapshot, never re-derived" discipline.
- `CommunicationMessage` — the transactional outbox row (`domain/communications/CommunicationMessage.ts`'s types are its exact in-application shape). `payload` is a bounded JSON snapshot (guest name, reference, start instant, party size, area) — never a full Contact/Reservation copy. `idempotencyKey` carries a UNIQUE constraint — the actual duplicate-prevention guarantee, not application discipline alone.
- `GuestManagementCredential` — `tokenHash` UNIQUE, never the raw token. Structurally separate from `StaffSession`, no foreign key to `staff_users`/`staff_sessions` anywhere.
- Neither new table has a foreign key to `reservations` (deliberate — see the schema's own comments): this keeps every existing test file that predates R1.6-B entirely unaffected by these tables' existence, and keeps the write path free of an extra constraint check on the hottest path in the codebase.

## 6. Transactional Outbox

Confirmed exactly as the architecture report predicted: the insertion point is `CreateReservationHandler.finalize()` (`application/command-handlers/CreateReservationHandler.ts`), not `PrismaReservationRepository.save()` — preserving the existing single-capability-per-adapter layering discipline. The call happens only in the branch reached after a genuinely new `"SAVED"` result (never on `"IDEMPOTENT_REPLAY"`), inside the same `tx` the reservation write itself used — either this handler's own self-opened transaction (plain CAP-D01.01 path) or the caller's (`AvailabilityOrchestrator`'s capacity-aware path). Zero new transaction-management code was needed.

`CommunicationOutboxService`/`GuestManagementTokenService` are threaded into `CreateReservationHandler` as two new, **optional, trailing** constructor parameters — mirroring `AvailabilityOrchestrator`'s own proven `seatingOrchestrator?` precedent (R1.5). Every pre-existing direct-construction call site (`tests/application/create-reservation-handler.test.ts`, `tests/integration/support/floorTestHarness.ts`) required zero changes and remained valid unchanged, confirmed by the clean typecheck.

## 7. Confirmation Atomicity

Proven with real PostgreSQL failure injection (`tests/integration/communication-confirmation-atomicity.test.ts`, F1–F4, assignment §39):

- **F1** (Reservation write fails — domain validation) → zero `CommunicationMessage` rows, zero `Reservation` rows.
- **F2** (Contact write fails) → zero rows of any kind.
- **F3** (Capacity write fails, via a temporary real Postgres CHECK constraint) → proven **bidirectionally**: the confirmation intent, already inserted earlier in the same transaction, is rolled back by a *later* failure (the capacity write, which runs after `createHandler.handle()` in `AvailabilityOrchestrator`).
- **F4** (the `CommunicationMessage` insert itself fails, via a temporary real Postgres CHECK constraint on `communication_messages`) → the entire transaction — Reservation, Contact, CapacityCommitment — rolls back. This is the single most direct proof of the assignment's core distinction: **failure to durably queue** required communication aborts the transaction; **failure to deliver** after commit (proven separately, §14 below) never does.

A positive-path test confirms the normal case: exactly one `Pending` `RESERVATION_CONFIRMATION` row, `idempotencyKey` = `${reservationId}:confirmation`, committed together with the reservation. A dedicated phone-only test (assignment §7) confirms zero rows and a fully valid `Proposed` reservation — INV-C12 by construction, not a special-cased branch.

## 8. Reminder Scheduling

Implemented exactly as the architecture report's "Model B, refined" (§9 there): `CommunicationOutboxService.scanAndScheduleReminders(now)` never pre-creates a row at booking time; it queries reservations whose **current** `reservationDate` (via the new `ReservationRepository.findStartingBetween` port method) has just entered the 24-hour window and inserts exactly one `Reminder` row per newly-eligible reservation, snapshotting data as of the scan, not as of booking time.

One refinement discovered and fixed during implementation, beyond what the architecture report anticipated: the reminder `idempotencyKey` needed a **generation** concept (`domain/communications/CommunicationMessage.ts`'s `reminderIdempotencyKey(reservationId, generation = 0)`). Without it, a reminder row cancelled as stale (§9 below) would permanently occupy its own key, silently blocking any future, legitimately-rescheduled reminder for that same reservation from ever being created — the UNIQUE constraint would reject it as `ALREADY_EXISTS` forever. The fix: `scanAndScheduleReminders` first checks whether a **non-cancelled** reminder already exists for the reservation (the idempotent-scan guard — if so, skip, nothing to do); only when every existing reminder row for that reservation is `Cancelled` does it compute the next generation and create a fresh one. This was caught by `tests/integration/reminder-scheduling.test.ts`'s R4/R5 cases failing on first implementation, not assumed correct — see §25.

## 9. Modification/Rescheduling

**No proactive hook was added to `ModifyReservationHandler`, `CancelReservationHandler`, or `AvailabilityOrchestrator`** — confirmed zero changes to any of these files. Staff-modification-safety (R4/R5) and cancellation-safety (R3) are both satisfied entirely by (a) the scan always reading the reservation's *current* state, and (b) the mandatory send-time re-check (§10 below), which the assignment independently requires anyway for cancellation-safety. This is a single mechanism satisfying two owner-stated requirements, exactly as the architecture report predicted, now proven with real PostgreSQL rather than merely designed.

## 10. Cancellation Suppression

`CommunicationWorker.processOne()` (`application/communications/CommunicationWorker.ts`) always re-reads the authoritative `Reservation` fresh (via `ReservationRepository.findById`) immediately before acting on any claimed message — never trusting the message's own stored snapshot for the *eligibility* decision (only for *content*, per §36 there / assignment §10). For `RESERVATION_REMINDER_24H`, `isReminderStillEligible` (domain, pure) checks terminal status, already-started, and reschedule-staleness in one call. For `RESERVATION_CONFIRMATION`, a simpler check (`status !== Cancelled`) applies, since confirmation content is not date-sensitive the way a reminder's "24 hours before" framing is. Proven permanently by `tests/integration/communication-worker.test.ts`'s "Cancellation during send" test and `reminder-scheduling.test.ts`'s R3/R7.

## 11. Worker

`ops/communications/processOutbox.ts` — a bounded, cron-triggered command (`npm run process-communications`), mirroring `ops/backup/createBackup.ts`'s exact existing pattern, not an in-process loop (rejected in the architecture report §12 for conflating HTTP-serving and background-work failure domains, and for implicitly assuming single-instance deployment). `runCommunicationsCycle()` is exported and directly callable/testable independently of HTTP traffic — every integration test in this change calls `CommunicationOutboxService`/`CommunicationWorker` directly, never through the CLI wrapper. This restates, rather than duplicates, R1.4's own still-open finding that no scheduler/cron infrastructure exists in any current or planned hosting environment (§28/Risk #1).

## 12. PostgreSQL Claiming

`PrismaCommunicationOutboxRepository.claimBatch()` — a single atomic `UPDATE communication_messages SET status='Processing', claimed_at=..., attempt_count=attempt_count+1 WHERE id IN (SELECT ... FOR UPDATE SKIP LOCKED) RETURNING ...`, via Prisma's parameterized `$queryRaw` tagged template (never raw string concatenation). Eligible rows: `Pending`-or-`FailedRetryable`-and-due, or `Processing`-and-stale (past `processingStalenessMs`, default 5 minutes — the honest, documented reclaim mechanism for a worker that crashed mid-send, assignment §20).

## 13. Concurrency Evidence

`tests/integration/communication-concurrency.test.ts` — two independent `PrismaClient` connections (never a single client's overlapping `$transaction` calls, which cannot represent genuine concurrency), each backing its own `CommunicationWorker`, calling `processBatch()` via `Promise.all`:

- **20 repeated iterations**, each seeding exactly one pending message and racing two workers for it — **0 double-claims, 0 lost messages** every time; exactly one worker claims and sends, the other claims nothing.
- A second test proves a larger 8-message batch splits correctly across two concurrently-running workers with no message claimed or sent twice.

Real PostgreSQL throughout, per instruction — never an in-memory repository.

## 14. Delivery Status Model

Implemented exactly as the architecture report's candidate list (its own §13/§14): `Pending → Processing → Sent | FailedRetryable | FailedPermanent | Cancelled`. `Sent` is documented, in code and in this report, to mean only "the provider accepted the request" (assignment §18) — no webhook-based `Delivered` state exists or is claimed.

## 15. Retry Model

`domain/communications/CommunicationMessage.ts`: `RETRY_BACKOFF_MS = [1m, 5m, 30m, 2h, 8h]`, `MAX_ATTEMPTS = 6` (5 backoff steps + the initial attempt). `FAILED_RETRYABLE` reschedules `availableAt` forward per the schedule and increments `attemptCount`; `FAILED_PERMANENT` (either a provider's own permanent classification, or backoff exhaustion) is terminal and never retried again — proven by `communication-worker.test.ts`'s P1/P2, which also confirm the Reservation itself is untouched in both cases. These numbers are explicitly flagged (in code comments and here) as tunable defaults, not invariants.

## 16. Idempotency

`confirmationIdempotencyKey`/`reminderIdempotencyKey`/`resendIdempotencyKey` (domain, pure) each produce a deterministic string backed by a real database UNIQUE constraint on `CommunicationMessage.idempotencyKey` — the actual guarantee, confirmed directly: `PrismaCommunicationOutboxRepository.enqueue()` catches the Postgres `P2002` unique-violation and converts it to a benign `ALREADY_EXISTS` result rather than propagating an error. Confirmation and the default (generation-0) reminder key are unversioned — exactly one of each, ever, per reservation, matching the owner's "ONE email reminder" rule at the database level, not merely by application discipline. Resend keys are deliberately per-call-distinct (assignment §21's own explicit "do not accidentally suppress a required new confirmation" instruction).

## 17. Provider Boundary

`application/ports/EmailDeliveryPort.ts` — `send()` takes only `{ recipient, subject, html, text, idempotencyKey? }` and returns `SUBMITTED | FAILED_RETRYABLE | FAILED_PERMANENT`. No provider-specific type appears anywhere in `domain/` or `application/` — confirmed by the fact `CommunicationWorker.ts` imports nothing provider-shaped at all.

## 18. Provider Requirements

Unchanged from the architecture report §18 — no provider evaluation was repeated in this implementation pass; that section remains the authoritative shortlist for the later, separate procurement decision.

## 19. Template Architecture

`domain/communications/Templates.ts` — code-based, pure, deterministic `renderConfirmation`/`renderReminder` functions, NL and EN, each producing `{ subject, html, text }`. Marked **DRAFT — OWNER BRANDING SIGN-OFF REQUIRED** in the file's own header comment (assignment §27) — engineering placeholder copy proving the data contract and escaping discipline, not final wording. `escapeHtml()` is applied to every guest-authored value (`guestName`) before HTML interpolation; `text` bodies need no escaping. Date/time formatting reuses `domain/availability/ServiceTime.ts`'s existing, DST-correct `toLocalServiceDate`/`toLocalHourMinute` — never reimplemented.

## 20. Language

`domain/value-objects/CommunicationLanguage.ts` — an explicit `{ nl, en }` const-object value object, mirroring `PreferredArea.ts`'s exact existing convention (assignment §3's own instruction). `DEFAULT_COMMUNICATION_LANGUAGE = "nl"`, applied only when the field is omitted entirely (never inferred from any signal) inside `ReservationAggregate.create()`. `Reservation.communicationLanguage` is frozen at creation (mirrors the existing contact-snapshot discipline) and flows through to every `CommunicationMessage.language` value created for that reservation — proven end-to-end (default and explicit `en`) in `communication-confirmation-atomicity.test.ts`, and confirmation/reminder-share-language in `reminder-scheduling.test.ts`'s R8.

## 21. Confirmation Data Contract

`CommunicationMessagePayload` (`application/ports/CommunicationOutboxRepository.ts`) — `guestName`, `reservationReference` (the reservation's own `crypto.randomUUID()` id — already proven safe to expose, R1.6 investigation §13), `reservationStart` (ISO string), `partySize`, `area`. No internal `Contact.id`, `CapacityCommitment.id`, `SeatingAssignment` internals, or `StaffUser` id appears anywhere in the payload or the rendered templates — confirmed directly by `communication-templates.test.ts`'s explicit non-exposure assertion.

## 22. Staff Resend

`application/communications/ResendConfirmationHandler.ts` — authentication/authorization enforced entirely at the API layer (`requireStaffSession` + a new, dedicated `Permission.CommunicationResend`), never re-checked inside the handler, matching every other command handler's existing convention. Creates a **new** `CommunicationMessage` row with a fresh, call-specific idempotency key (`resendIdempotencyKey`); never touches `ReservationAggregate`, never writes a `ReservationEvent`, never changes `Reservation.version` — proven directly by `tests/api/communications.test.ts`'s S7. A phone-only reservation resolves to `NO_USABLE_EMAIL` (422) with the Reservation fully untouched (S2) — not an error, the same non-fabrication discipline as the automatic-confirmation path.

## 23. Pilot UI Button

`public/pilot.html` — a "Bevestiging opnieuw versturen" button, shown for any non-Cancelled reservation row, calling the new resend endpoint via `fetch`, reporting success/failure through the page's existing `showMessage`/`.message.ok`/`.message.error` convention. No Reservation edit, no new page, no guest-facing UI — exactly per instruction.

## 24. Security

- **Template/header injection**: `escapeHtml()` on every guest-authored HTML interpolation; recipient/subject are never built from raw guest free text (recipient is the validated `EmailAddress`-normalized snapshot; subject is static copy + the safe reservation reference).
- **`notes` excluded**: confirmed — `CommunicationContentData` has no `notes` field at all; the confirmation/reminder templates cannot reference it even by mistake.
- **Token security**: raw guest-management tokens are never persisted, never logged, never part of any DTO returned to a staff HTTP caller — confirmed directly (`guest-management-token.test.ts`'s "never appears in the outward-facing outcome" test asserts the exact, closed field set of `CreateReservationOutcome`).
- **CSRF**: the existing global `createCsrfGuard` (R1.2, unmodified) covers the new resend route automatically — proven by `communications.test.ts`'s S6.
- **Spoofed actor headers**: proven to carry zero authority against the new route (S5), consistent with R1.2's own untouched discipline.
- **Worker exposure**: `ops/communications/processOutbox.ts` is a local CLI command, never an HTTP endpoint — nothing here is remotely reachable.

## 25. Privacy

`CommunicationMessage.payload` is the bounded, explicit snapshot described in §21 — never a full `Contact`/`Reservation` copy. `lastError` is populated only from the `EmailDeliveryPort`'s own short, classified `reason` string (`FakeEmailDeliveryPort`'s test-controlled values, e.g. `"provider_timeout"`, `"invalid_recipient"`) — never a raw exception object or provider response body. No new, separate retention policy was invented; this data is left implicitly under the same discipline R1.3 already established for `Contact`, consistent with the architecture report's own recommendation (not separately re-decided here).

## 26. DST

`REMINDER_LEAD_MS`/`computeReminderDueInstant` use pure instant arithmetic (`Date#getTime()` subtraction) — never calendar-date subtraction — confirmed both by direct domain tests spanning both 2026 transition instants (`tests/domain/communication-message.test.ts`) and is structurally incapable of the naive-local-date bug class by construction (no `Intl`/local-time conversion is ever used in the due-instant calculation itself, only in template *display* formatting, which is a separate, already-correct concern reused from `ServiceTime.ts`).

## 27. Failure Injection

F1–F4 (§7 above) plus P1–P4 (§14/§15 above) are the assignment's own required sets, all implemented and passing against real PostgreSQL. The distinction the assignment itself emphasizes — "failure to durably queue may abort the transaction" (F4) vs. "failure to deliver after commit must NEVER roll back the Reservation" (P1/P2) — is proven as two structurally separate test suites exercising two genuinely different code paths (the shared reservation transaction vs. the independent post-commit worker), not merely asserted.

## 28. Concurrency Evidence

See §13 above (consolidated — the assignment's §26/§43 headings both point at the same evidence).

## 29. Full Regression

```
npm run typecheck   -> clean
npm test             -> 48 test files, 598 tests, ALL PASSING
```

Up from 496 (pre-R1.6-B baseline). The +102 delta: 11 (`communication-language`) + 28 (`communication-message`, incl. the generation-key addition) + 9 (`communication-templates`) + 8 (`communication-confirmation-atomicity`) + 9 (`communication-worker`) + 2 (`communication-concurrency`, 20-iteration repetition) + 13 (`reminder-scheduling`) + 7 (`tests/api/communications`) + 9 (`guest-management-token`) = 96 new test-file tests, plus +6 dynamically-generated cases in `tests/domain/staff-authorization-policy.test.ts` from the new `CommunicationResend` permission entry (exhaustively re-verified against the updated `EXPECTED_MATRIX`, not merely added and left unchecked). **No previous invariant regressed** — every R1.1–R1.6-A test passes unchanged; no existing test file's assertions were loosened.

## 30. Known Limitations

- **No public guest-facing surface exists or was built.** The token foundation (§22 of the architecture report) is issued and verifiable, but no public HTTP route consumes it yet — `GuestManagementTokenService.verify()` exists, tested, and unreachable from outside the process, exactly like `ApprovedGuestChannel` before it. This is the correct, bounded scope per assignment §25's own explicit "Do NOT implement public cancellation endpoint yet."
- **Guest-management token issuance is not transactionally atomic with the reservation write** (§6/architecture report §23's own accepted trade-off) — a crash between the reservation commit and the token issuance would leave a reservation with no credential yet. Low-severity and self-healing (a future reissue/resend operation can always mint a new one); not fixed here per the architecture report's own explicit scoping decision.
- **No real `EmailDeliveryPort` implementation exists** — `FakeEmailDeliveryPort` is the only one shipped, per instruction. Nothing in this codebase can send a real email today.
- **No scheduler/cron infrastructure is provisioned in any real hosting environment** — `ops/communications/processOutbox.ts` is ready to be invoked, but nothing invokes it outside of tests today; this is the same, already-tracked R1.4 gap, not a new one.
- **Exactly-once delivery is not achievable** without provider-side idempotency-key support (honestly documented in `EmailDeliveryPort`'s own doc comment and this report) — a crash between a successful provider `SUBMITTED` response and the `markSent` write is a genuine, if narrow, duplicate-send risk once the stale-`Processing` reclaim kicks in.
- **R1.6-A's own follow-up remains open, untouched, and not broadened here**: `ServicePeriod` is still not enforced by `CreateReservationHandler`/`AvailabilityOrchestrator` — confirmed no such integration was added in this pass either (assignment §36's explicit instruction not to fix it here).
- **CAP-D05.02 (allergy/critical notes) remains unimplemented** — `CommunicationContentData` deliberately has no field for it; communication is not, and must not become, the authoritative allergy record (assignment §37).
- **The R1.5 Modify↔Seating gap remains untouched** (assignment §38) — irrelevant to this phase since no guest self-modification exists.

## 31. Risks

| # | Risk | Class |
|---|---|---|
| 1 | No scheduler/cron hosting infrastructure exists anywhere — blocks `process-communications` from ever actually running outside a test/manual invocation, exactly as it already blocks backups (R1.4, carried forward) | **P0** |
| 2 | No real email provider is connected — the entire pipeline is proven correct against `FakeEmailDeliveryPort` only; provider-specific failure-classification behavior (which real errors map to retryable vs. permanent) is unverified until a provider is actually selected and integrated | **P1** |
| 3 | Guest-management token issuance is non-transactional (§30) — a narrow, self-healing gap, not yet mitigated by a reissue operation | **P2** |
| 4 | Exactly-once delivery is not achievable without provider-side idempotency support (§30) — a documented, bounded, at-least-once duplicate-send risk under the crash-after-submit scenario | **P2** |
| 5 | CAP-D06 governance divergence (registry `Deferred`/`mvp:false` vs. this owner-confirmed implementation) — reported, not resolved (§4/§32) | **P2** (carried from the architecture gate) |
| 6 | R1.6-A's ServicePeriod-enforcement follow-up remains open (§30) — unrelated to, and not fixed by, this phase, but still a hard R1.6-C prerequisite | **P2** (carried, not new) |

## 32. CAP-D06 Governance Divergence

Per assignment §35: the registry (`capability-registry.yaml.md` lines 1096–1259, re-confirmed this session) still marks CAP-D06.01 (Reservation Confirmation) and CAP-D06.02 (Reminder Management) `delivery_status: Deferred`, `mvp: false`. This owner-confirmed implementation assignment makes both MVA-required in practice. Per the assignment's own explicit instruction ("If governance process does not authorize that automatically: leave registry unchanged and record: GOVERNANCE FOLLOW-UP REQUIRED"), **the registry was NOT edited** — no automatic, self-authorized governance-status correction mechanism exists in this repository's process today.

**GOVERNANCE FOLLOW-UP REQUIRED**: `capability-registry.yaml.md`'s `delivery_status`/`mvp` fields for CAP-D06.01 and CAP-D06.02 should be reviewed and, if the Chief Engineer/architecture-governance process concurs, updated to reflect that both are now implemented and owner-confirmed as required — a decision for that process, not this implementation pass.

## 33. R1.6-C Entry Conditions

- R1.6-A's own follow-up (`ServicePeriod` not yet enforced by `CreateReservationHandler`/`AvailabilityOrchestrator`) — **OPEN**, unchanged by this phase, still a hard prerequisite for honest public availability.
- A real `EmailDeliveryPort` implementation and provider selection — **NOT STARTED**, a separate, later gate (assignment §46).
- The shared scheduler/cron hosting prerequisite (R1.4's own still-open finding, now also blocking `process-communications`) — **OPEN**.
- CAP-D05.02 (allergy/critical notes) — **OPEN**, tracked separately, not solved by or required for this phase.
- R1.5 Modify↔Seating gap — **OPEN**, tracked separately, irrelevant until guest self-modification is in scope.
- CAP-D06 governance follow-up (§32) — **OPEN**, a registry-accuracy question for the Chief Engineer, not an engineering blocker.

## 34. Final Verdict

Implementation complete. All required tests pass (F1–F4, P1–P4, R1–R8, S1–S7, 20-iteration real-PostgreSQL concurrency proof). Full regression passes (598/598). No unresolved P0 integrity defect. One bounded local commit follows this report.

## 35. Evidence Appendix

- `R1_6_B_GUEST_COMMUNICATIONS_ARCHITECTURE_INVESTIGATION.md` (the approved architecture this implementation follows)
- `application/command-handlers/CreateReservationHandler.ts`, `application/availability/AvailabilityOrchestrator.ts` (re-confirmed unmodified beyond the two new optional constructor parameters and the one new `finalize()` insertion point)
- `domain/aggregates/ReservationAggregate.ts`, `domain/commands/ReservationCommands.ts`, `domain/events/ReservationEvents.ts` (communicationLanguage threading)
- `prisma/schema.prisma`, migration `20260820160000_add_guest_communications`
- `domain/communications/CommunicationMessage.ts`, `domain/communications/Templates.ts`, `domain/value-objects/CommunicationLanguage.ts`
- `application/communications/CommunicationOutboxService.ts`, `CommunicationWorker.ts`, `ResendConfirmationHandler.ts`, `GuestManagementTokenService.ts`
- `application/ports/CommunicationOutboxRepository.ts`, `EmailDeliveryPort.ts`, `GuestManagementCredentialRepository.ts`
- `infrastructure/persistence/PrismaCommunicationOutboxRepository.ts`, `PrismaGuestManagementCredentialRepository.ts`, `infrastructure/communications/FakeEmailDeliveryPort.ts`
- `api/app.ts`, `api/server.ts`, `domain/rules/StaffAuthorizationPolicy.ts` (new `CommunicationResend` permission), `public/pilot.html`
- `ops/communications/processOutbox.ts`, `package.json`
- Full new test suite: `tests/domain/communication-language.test.ts`, `communication-message.test.ts`, `communication-templates.test.ts`, `tests/integration/communication-confirmation-atomicity.test.ts`, `communication-worker.test.ts`, `communication-concurrency.test.ts`, `reminder-scheduling.test.ts`, `guest-management-token.test.ts`, `tests/api/communications.test.ts`
- Full regression run: 48 test files, 598/598 passing (re-run independently for this report)
- `capability-registry.yaml.md` lines 1096–1259 (CAP-D06, re-read this session for §32)
- Direct `git status`/`git log` output for baseline and final-state verification
