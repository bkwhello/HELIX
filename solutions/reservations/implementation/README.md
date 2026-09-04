# CAP-D01.01 Reservation Management — Implementation

Implements the engineering artifacts in
`../capabilities/active/CAP-D01.01-reservation-management/`. This package
never depends on that folder at runtime — it is the target the code was
built to satisfy, verified through the tests in `tests/`.

## Stack

TypeScript / Node, chosen to match the existing `konnichiwa-kitchen`
(Next.js/Prisma) codebase rather than introducing a second language
ecosystem. Prisma against PostgreSQL (see `prisma/schema.prisma`) —
switched from local SQLite during CAP-D02.03 implementation, because that
capability's concurrency guarantees (`pg_advisory_xact_lock`, shared
interactive transactions) are PostgreSQL-specific. Express for the HTTP
API. Vitest for tests. No framework dependency in `domain/`.

## Engineering artifact → implementation mapping

| Engineering artifact | Implementation artifact |
|---|---|
| `capability.md` | `domain/aggregates/ReservationAggregate.ts` + application services |
| `state-model.md` | `domain/value-objects/ReservationStatus.ts` (transition table) |
| `rule-model.md` | `domain/rules/*.ts` |
| `event-model.md` | `domain/events/ReservationEvents.ts` |
| `interaction-model.md` | `domain/repositories/ReservationRepository.ts`, `application/ports/*.ts` |
| `acceptance.md` | `tests/acceptance/*.test.ts`, `tests/api/*.test.ts` |

This mapping does not vary between capabilities (see CA-001 §54, Phase 2 of the engineering brief for this capability).

## Status: Create Reservation and Floor & Seating are pilot-ready; the rest of the lifecycle is not yet

**Create Reservation** (domain rules, application orchestration, Prisma
persistence, and the `POST /reservations` / `GET /reservations` HTTP
endpoints) has been reviewed against `acceptance.md` §17's Pilot exit
criteria and hardened accordingly:

- All Critical acceptance scenarios for creation (AC01–AC04, AC39) are
  automated, at both the domain and HTTP layers (`tests/acceptance/creation.test.ts`,
  `tests/api/reservations.test.ts`).
- Failure and retry behaviour is covered by `tests/application/reservation-repository-contract.test.ts`
  and `tests/application/create-reservation-handler.test.ts`: a repeated
  `commandId` is idempotent, and a failed write never drains pending
  domain events. **Correction (added during CAP-D02.03 implementation,
  see `CAP_D02_03_IMPLEMENTATION_REPORT`):** this bullet previously
  claimed the concurrent-create race was "verified with `Promise.all`
  against Prisma directly" — that was inaccurate. The actual test
  (`reservation-repository-contract.test.ts`, "optimistic concurrency")
  simulates two sessions *sequentially* (session A saves, then session B
  saves with a now-stale version) against `InMemoryReservationRepository`,
  not a real, simultaneously-executing race against Prisma/PostgreSQL.
  That is legitimate coverage of the optimistic-concurrency *logic*, but
  it is not concurrency proof, and should never have been described as
  one. Genuine `Promise.all`-driven concurrent-transaction evidence
  against real PostgreSQL now exists in this codebase for the first
  time, for CAP-D02.03 — see `tests/integration/availability-concurrency.test.ts`.
  CAP-D01.01's own create-race path has not been given the same
  real-PostgreSQL treatment; that remains open work, not something to
  assume from this bullet.
- Authorization is tested (CAP-D01.01-R32 / AC39).
- Staff can discover what was created — `GET /reservations?date=` — a
  requirement of AC34 that had no implementation before this review.
- Unhandled errors return JSON (`api/app.ts`'s error middleware), not
  Express's default HTML error page.

**Confirm / Modify / Cancel / Complete** have the same domain-level rule
and authorization coverage as Create, but have *not* been through the
same HTTP-level and pilot-readiness pass — see "Known limitations" below.

**Floor & Seating** (CAP-D03.03/CAP-D04.01, implementation phases
P1-B1–P1-B9) closed its HTTP-exposure sequence at commit `582e655`: assign
(immediate), pre-assign, move, mark-seated, no-show release, the
floor/late-arrival view, Resource Blocking, and walk-in creation are all
live HTTP routes, permission-gated, wired into `public/pilot.html`, and
covered by the automated suite — including real-PostgreSQL concurrency
tests for every claim-contention combination identified during the
closure audit (`tests/integration/floor-seating-concurrency.test.ts`,
`tests/api/resource-blocks.test.ts`). **This is automated verification
only** — no human has yet run a smoke test of these actions against a
real dev deployment, and none of it has been deployed anywhere; see
`PILOT.md`'s "Floor & Seating status" section for the accepted
limitations (Resource Block hard-delete has no audit trail, blocking is
Table-scoped only, and the floor view does not surface blocked-table
state) and for what a smoke test would need to cover before this is
relied on operationally.

## Known limitations (before wider rollout, not blocking a controlled pilot)

- `ContactReader` and `ServicePeriodReader` are placeholder adapters
  (`infrastructure/Unvalidated*.ts`) that always report valid — Contact
  Management and Service Period Management don't exist as capabilities
  yet. Real validation is deferred until they do; this is a known,
  intentional gap, not an oversight.
- **Resolved (R1.2 — Identity & Access).** This bullet used to say the API
  trusted `x-actor-*` request headers for identity — that is no longer
  true. Real `StaffUser` accounts, password authentication, server-side
  sessions, and centralized role-based authorization replace it entirely;
  those headers now have zero authority (a permanent regression test
  proves this — see `tests/integration/identity-access.test.ts`). See
  `R1_2_IDENTITY_ACCESS_IMPLEMENTATION_REPORT.md`.
- **Resolved (CAP-D02.03).** This bullet used to recommend switching from
  SQLite to PostgreSQL before scaling — that switch already happened (see
  the Stack section above); this codebase has been PostgreSQL-only since
  CAP-D02.03.
- **Partially resolved (R1.6-B).** This bullet used to say there was no
  transactional outbox at all. A transactional outbox now exists, but
  only for guest communication emails (see "Guest communication emails"
  below) — `Reservation` domain events themselves are still persisted
  atomically with state (`PrismaReservationRepository.save()`) without a
  general-purpose outbox or external consumer beyond that one case.
- Confirm/Modify/Cancel/Complete lack HTTP-level tests and the
  `GET /reservations` discoverability pass that Create just got.
- The scheduler/cron hosting needed to actually run
  `npm run process-communications` on a recurring basis does not exist
  yet (same still-open prerequisite `ops/backup/createBackup.ts` already
  has for backups) — until it's wired up, enqueued emails sit in the
  outbox until someone runs that command manually.

## Guest communication emails (Resend)

Implements the "Communication" event consumer described in the
CAP-D01.01 `event-model.md` (R1.6-B): a reservation confirmation email,
plus a 24-hour reminder, sent to the guest when a usable email address is
known. See `R1_6_B_GUEST_COMMUNICATIONS_ARCHITECTURE_INVESTIGATION.md`
and `R1_6_B_GUEST_COMMUNICATIONS_IMPLEMENTATION_REPORT.md` for the full
design.

- **Trigger:** the confirmation email is enqueued immediately on
  successful reservation creation — `CreateReservationHandler.finalize()`
  calls `CommunicationOutboxService.enqueueConfirmationIfEligible()`
  inside the same transaction as the reservation write itself (never a
  separate, unprotected post-commit step). It is not tied to the later
  `Confirmed` status transition. A reservation with no usable email
  (e.g. a staff-entered, phone-only booking) enqueues nothing, by
  construction. The 24-hour reminder is scheduled separately, by a scan
  (`CommunicationOutboxService.scanAndScheduleReminders()`) that always
  reads the reservation's *current* date/time, so a staff modification
  is picked up automatically.
- **Outbox pattern:** enqueued rows (`CommunicationMessage`, via
  `application/ports/CommunicationOutboxRepository.ts`) are processed
  separately by `CommunicationWorker`
  (`application/communications/CommunicationWorker.ts`), invoked by
  `ops/communications/processOutbox.ts` (`npm run process-communications`).
  The worker re-checks reservation eligibility against current state at
  send time (never trusting the row's own snapshot for that decision),
  and retries `FailedRetryable` failures on a bounded backoff
  (`domain/communications/CommunicationMessage.ts`'s `RETRY_BACKOFF_MS`)
  before giving up as `FailedPermanent`. A stuck `Processing` row
  (worker crashed mid-send) becomes reclaimable after a staleness window
  rather than being lost.
- **Provider boundary:** `application/ports/EmailDeliveryPort.ts` is the
  provider-independent interface everything above depends on — no
  Reservation/outbox/provider-SDK knowledge crosses it in either
  direction. `infrastructure/communications/FakeEmailDeliveryPort.ts` is
  the deterministic default (`EMAIL_PROVIDER` unset, no external call
  ever made); `infrastructure/communications/ResendEmailDeliveryAdapter.ts`
  is the real adapter (`EMAIL_PROVIDER=resend`), calling Resend's HTTPS
  API directly via `fetch` (no `resend` npm package dependency). See
  `.env.example` for `EMAIL_PROVIDER` / `EMAIL_PROVIDER_API_KEY` /
  `EMAIL_FROM_ADDRESS` / `EMAIL_REPLY_TO`. **Never** commit a real API
  key — only empty placeholders belong in `.env.example`; the real key
  goes in a local, gitignored `.env`.
- **Sender address:** owner-confirmed as `reservations@konnichiwa.nl`
  (from) with `info@konnichiwa.nl` as reply-to. As of this writing,
  `reservations@konnichiwa.nl` itself still needs to be created
  (mailbox + Resend domain verification) — an operational prerequisite,
  not a code gap; until then, a real send fails safely as
  `FAILED_PERMANENT` rather than silently succeeding or corrupting the
  reservation transaction.
- **Staff resend:** `POST /reservations/:id/communications/confirmation/resend`
  (`ResendConfirmationHandler`) lets staff re-trigger a confirmation
  email on demand. It always creates a new, independent outbox row —
  never mutates or resends the original message, never touches the
  Reservation's own business state or version.
- **Tests never send real email:** every test that exercises
  `ResendEmailDeliveryAdapter` injects a fake `fetchImpl`
  (`tests/infrastructure/resend-email-delivery-adapter.test.ts`) — no
  test in this repository makes a real network call to Resend under any
  circumstance.

## Run

```bash
npm install
npx prisma migrate deploy   # or `prisma migrate dev` locally
npm run typecheck
npm test
npm run dev                 # http://127.0.0.1:3001, see api/server.ts
```

By default the server binds only to the loopback interface (`127.0.0.1`),
not all interfaces — set `APP_HOST` to override (e.g. `0.0.0.0` for a
future real deployment environment that genuinely needs to accept
connections from other hosts). A missing, blank, or whitespace-only
`APP_HOST` falls back to the loopback default, never all-interfaces. See
`.env.example` and `api/serverConfig.ts`.

## CI

`.github/workflows/reservations-ci.yml` runs `prisma generate`, `prisma
migrate deploy` (against a throwaway SQLite file), typecheck, and the
full test suite on every push/PR touching this directory.

## Controlled pilot

`public/pilot.html` (served at `/pilot.html` once the server is running)
is a staff-facing page covering Create Reservation, the daily list, and
Floor & Seating (assign/pre-assign/move/mark-seated/no-show, floor and
late-arrival view, Resource Blocking, walk-in) — the operations covered
by the pilot-readiness work above. See `PILOT.md` for scope, known
limitations, and success criteria before using it with real bookings.
