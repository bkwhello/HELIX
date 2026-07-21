# CAP-D01.01 Reservation Management — Implementation

Implements the engineering artifacts in
`../capabilities/active/CAP-D01.01-reservation-management/`. This package
never depends on that folder at runtime — it is the target the code was
built to satisfy, verified through the tests in `tests/`.

## Stack

TypeScript / Node, chosen to match the existing `konnichiwa-kitchen`
(Next.js/Prisma) codebase rather than introducing a second language
ecosystem. Prisma (SQLite locally, PostgreSQL is the production target —
see `prisma/schema.prisma`). Express for the HTTP API. Vitest for tests.
No framework dependency in `domain/`.

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
- Failure and retry behaviour is tested against real SQLite, not just the
  in-memory double: a repeated `commandId` is idempotent, a concurrent
  create race resolves to exactly one winner (verified with `Promise.all`
  against Prisma directly), and a failed write never drains pending
  domain events.
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
- `actorFromHeader()` in `api/app.ts` trusts request headers for actor
  identity — acceptable for a controlled pilot on a trusted device/network,
  not for a public-facing deployment. Needs real authentication before
  wider rollout.
- SQLite is fine for a single-location controlled pilot; switch
  `prisma/schema.prisma`'s `provider` (and `DATABASE_URL`) to PostgreSQL
  before scaling beyond one site or one process.
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
