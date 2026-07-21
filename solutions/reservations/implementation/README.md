# CAP-D01.01 Reservation Management — Implementation

Implements the engineering artifacts in
`../capabilities/active/CAP-D01.01-reservation-management/`. This package
never depends on that folder at runtime — it is the target the code was
built to satisfy, verified through the tests in `tests/`.

## Stack

TypeScript / Node, chosen to match the existing `konnichiwa-kitchen`
(Next.js/Prisma) codebase rather than introducing a second language
ecosystem. Vitest for tests. No framework dependency in `domain/`.

## Engineering artifact → implementation mapping

| Engineering artifact | Implementation artifact |
|---|---|
| `capability.md` | `domain/aggregates/ReservationAggregate.ts` + application services |
| `state-model.md` | `domain/value-objects/ReservationStatus.ts` (transition table) |
| `rule-model.md` | `domain/rules/*.ts` |
| `event-model.md` | `domain/events/ReservationEvents.ts` |
| `interaction-model.md` | `domain/repositories/ReservationRepository.ts`, `application/ports/*.ts` |
| `acceptance.md` | `tests/acceptance/*.test.ts` |

This mapping does not vary between capabilities (see CA-001 §54, Phase 2 of the engineering brief for this capability).

## Status

Phase 3 complete: the `ReservationAggregate` enforces CAP-D01.01-R01–R49
(see `domain/rules/ArchitecturalInvariants.ts` for the rules enforced by
construction rather than a runtime check) and emits the five lifecycle
events. Acceptance scenarios AC01, AC03–AC09, AC11–AC19 have automated
coverage; AC02, AC10 partially covered at the handler layer.

Not yet covered by automated tests (require real infrastructure, not just
the in-memory test double in `tests/support/`):

- AC20 (persistence failure) — the in-memory repository can simulate a
  thrown error, but true atomicity needs a real transactional store.
- AC21, R44 idempotency — covered at the repository-port level; a real
  command bus / HTTP layer needs its own idempotency-key handling.
- AC24–AC28 (event integrity, correlation/causation across retries) —
  needs a real event store.
- AC29–AC37 (ownership boundaries, operational and security acceptance) —
  organizational/structural, not runtime-testable against this layer
  alone.

## Run

```bash
npm install
npm run typecheck
npm test
```

## Not built yet (Phase 4, by design)

REST endpoints, persistence adapter, frontend, external integrations.
Per the engineering brief for this capability: only after the domain and
application layers pass their tests does implementation expand outward
into `infrastructure/` and `api/`.
