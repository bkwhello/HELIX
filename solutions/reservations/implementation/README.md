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

## Status: Create Reservation is pilot-ready; the rest of the lifecycle is not yet

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
- No transactional outbox — events are persisted atomically with state
  (see `PrismaReservationRepository.save()`), but nothing publishes them
  to an external consumer yet, because none exists.
- Confirm/Modify/Cancel/Complete lack HTTP-level tests and the
  `GET /reservations` discoverability pass that Create just got.

## Run

```bash
npm install
npx prisma migrate deploy   # or `prisma migrate dev` locally
npm run typecheck
npm test
npm run dev                 # http://localhost:3001, see api/server.ts
```

## CI

`.github/workflows/reservations-ci.yml` runs `prisma generate`, `prisma
migrate deploy` (against a throwaway SQLite file), typecheck, and the
full test suite on every push/PR touching this directory.

## Controlled pilot

`public/pilot.html` (served at `/pilot.html` once the server is running)
is a minimal staff-facing page for Create Reservation + the daily list —
the only two operations covered by the pilot-readiness work above. See
`PILOT.md` for scope, known limitations, and success criteria before
using it with real bookings.
