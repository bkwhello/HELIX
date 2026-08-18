# CAP_D02_03_IMPLEMENTATION_REPORT

**Work package:** R1.1-I1 — CAP-D02.03 Availability Management, MVA implementation
**Capability:** CAP-D02.03 (domain CAP-D02 Service Planning), per `capability-registry.yaml.md`
**Architecture gate:** PASSED (prior reports: `AVAILABILITY_CAPACITY_ENGINEERING_REPORT`, `AVAILABILITY_CAPACITY_ARCHITECTURE_REVISION_REPORT`, `FINAL_CAPACITY_ALGORITHM_DECISION`)
**Author:** implementation agent, this session
**Status:** implementation + test evidence complete; awaiting Chief Engineer R1.1 Implementation Gate review

---

## 1. What this report proves, and what it explicitly does not

This report proves that the CAP-D02.03 Minimum Viable Architecture (MVA) — a
corrected simultaneous-occupancy capacity algorithm, a shared PostgreSQL
transaction spanning capacity + reservation + idempotency writes, and
`pg_advisory_xact_lock`-based serialization — is implemented and behaves
correctly under the test evidence described below.

**It does not prove, and this report makes no claim of:**

- **PRODUCTION READY** — not claimed anywhere in this report.
- **GUESTPLAN REPLACEABLE** — not claimed anywhere in this report. CAP-D02.03
  is one capability; the R0 audit's other findings (Identity & Access P0,
  19% overall maturity) are untouched by this work and remain open.
- Any statement about Konnichiwa website behavior, the Guestplan plugin, or
  the hardcoded Guestplan API key — none of that was touched, per the
  assignment's prohibited-actions list.

Successful completion proves CAP-D02.03 MVA only.

## 2. Scope actually implemented

- `domain/availability/`: `CapacityPool.ts` (static Sushi/Teppanyaki
  config), `AvailabilityResult.ts`, `CapacityCommitment.ts`,
  `AvailabilityEvaluator.ts` (the corrected algorithm), `LockKey.ts`
  (deterministic advisory-lock key derivation + multi-resource lock
  ordering), `ServiceTime.ts` (IANA-timezone-correct Europe/Amsterdam
  conversion), `BookingPolicy.ts` (party-size routing + same-day cutoff).
- `domain/repositories/CapacityRepository.ts`: the capacity persistence
  port.
- `domain/shared/TransactionContext.ts`: opaque shared-transaction handle
  type, so the shared-transaction requirement doesn't leak Prisma types
  into domain/application code.
- `application/ports/TransactionManager.ts` + `infrastructure/persistence/PrismaTransactionManager.ts`:
  runs a unit of work in one PostgreSQL transaction.
- `infrastructure/persistence/PrismaCapacityRepository.ts`: the
  PostgreSQL-backed adapter, including the raw `pg_advisory_xact_lock`
  call.
- `application/availability/AvailabilityOrchestrator.ts`: Create/Modify/Cancel
  orchestration — booking policy → capacity lock → capacity evaluation →
  capacity write → CAP-D01.01 reservation write, as one shared transaction.
- Minimal, additive changes to `CreateReservationHandler.ts`,
  `ModifyReservationHandler.ts`, `CancelReservationHandler.ts`,
  `ReservationRepository.ts` (port), `PrismaReservationRepository.ts`
  (adapter): each gained an **optional** `tx` parameter so the
  orchestrator can make them participate in its shared transaction. No
  existing CAP-D01.01 behavior changed when `tx` is omitted — verified by
  the full pre-existing test suite still passing unmodified (§9).
- New `/availability/reservations` (POST/PATCH) and
  `/availability/reservations/:id/cancel` (POST) HTTP routes in
  `api/app.ts`, mounted only when the deployment supplies capacity
  infrastructure. The original `/reservations` routes are untouched and
  remain capacity-unaware, on purpose (see §12).
- `prisma/schema.prisma`: datasource switched from SQLite to PostgreSQL;
  new `CapacityCommitment` model; all `DateTime` columns explicitly mapped
  to `@db.Timestamptz` (not Prisma's PostgreSQL default of tz-naive
  `timestamp`); hand-written `CHECK` constraints (`partySize > 0`,
  `start_time < end_time`) in the generated migration SQL, since Prisma
  5.22 has no declarative CHECK-constraint syntax.
- `vitest.config.ts` (new): disables cross-file parallelism, because the
  integration tests share one real PostgreSQL database and `TRUNCATE` it
  in `beforeEach` — see §8.

**Explicitly NOT implemented (see §13, Known Limitations):**

- No real Service Period / operating-hours capability. See §7.
- No support for capacity-aware Modify on a reservation that has no
  active CAP-D02.03 commitment (`NO_ACTIVE_COMMITMENT` outcome).
- No TheFork/Heerlijk/DiningCity/Social Deal(s) integration (out of scope
  for this work package; named in the architecture revision as future
  work only).

## 3. The corrected algorithm (§ mandatory regression)

`domain/availability/AvailabilityEvaluator.evaluateSimultaneousOccupancy`
implements the approved 15-minute-slice, general-overlap-test algorithm —
**not** the rejected naive `SUM(partySize)` over any-overlap. Full
rationale and the rejected-algorithm comparison is in that file's header
comment.

**PASS** — `tests/domain/availability-evaluator.test.ts`, "mandatory
false-sold-out regression": A(18:00–18:30, 40), B(19:00–19:30, 40),
requested C(18:15–19:15, 20), capacity 60 → `maxExistingOccupancy` is 40
(not the naive 100), C is AVAILABLE. Explicitly asserts the naive sum is
NOT what the function returns.

**PASS** — the same regression proved a second time against real
PostgreSQL, with A/B persisted as real rows and C created through the full
`AvailabilityOrchestrator` (`tests/integration/availability-create.test.ts`).

**PASS** — exact-capacity boundary (52+8=60 accepted, 53+8=61 rejected),
back-to-back non-overlap, partial-overlap slice attribution, self-exclusion
by `commitmentId` — all in `availability-evaluator.test.ts` (10 tests, all
passing).

## 4. Shared transaction (hard architectural invariant)

`AvailabilityOrchestrator` opens exactly one `TransactionManager.runInTransaction`
per Create/Modify/Cancel call. Inside it: advisory lock → capacity read →
capacity write → CAP-D01.01 handler call (itself writing reservation +
events + idempotency marker via the SAME `tx`). There is no separately-
committed two-step sequence anywhere in this code path, and no
compensation logic — a failure after the capacity write throws
`OrchestratedValidationFailure`, which Prisma turns into a real rollback
of everything written so far in that transaction.

**PASS** — proved directly by both failure-injection tests (§8): a
downstream CAP-D01.01 validation failure, and a genuine PostgreSQL
constraint violation on the event insert, both roll back the capacity
write and the reservation write together. Zero partial state in either
case, verified by querying the database after the failed call, not by
inspecting return values alone.

## 5. Locking strategy

`LockKey.deriveLockKey` — FNV-1a 32-bit hash of
`"${capacityPoolId}|${localServiceDate}"`, combined with a fixed namespace
constant, used as `pg_advisory_xact_lock(int4, int4)`. Deterministic
(no `Math.random`, no per-process salt) — required so two different
application instances contending for the same (pool, date) compute the
identical key.

**PASS** — `tests/domain/lock-key.test.ts` (10 tests): determinism,
distinct keys for distinct pools/dates, signed-32-bit range, and the
`sortLockResources` deterministic global lock-acquisition order (proven
order-independent for the same resource set, which is the actual
deadlock-prevention property).

**PASS** — real advisory-lock serialization proved by the concurrency
matrix (§6): two concurrent transactions targeting the same (pool, date)
resource never both succeed when their combined party sizes exceed
capacity, and never both fail when there's room for both.

**Implementation correction found and fixed during testing:** the first
version of `acquireCapacityLock` used `$queryRaw` and untyped numeric
parameters, which failed against real PostgreSQL twice — once because
`pg_advisory_xact_lock(bigint, bigint)` doesn't exist as an overload
(needed explicit `::int4` casts), and once because `pg_advisory_xact_lock`
returns `void`, which `$queryRaw` cannot deserialize (needed `$executeRaw`
instead). Both were caught by the real-PostgreSQL integration tests, not
by code review or the pure unit tests — direct evidence for why the
assignment made real-PostgreSQL testing mandatory rather than optional.

## 6. Concurrency test matrix (real PostgreSQL, separate connections per actor)

All in `tests/integration/availability-concurrency.test.ts`, using two
independent `PrismaClient` instances so the two "actors" in each test are
genuinely simultaneous PostgreSQL transactions, not sequential calls on
one connection.

| Scenario | Result | Evidence |
|---|---|---|
| Final-capacity race (general) | **PASS** | Exactly one of two concurrent over-capacity requests succeeds; total committed occupancy ≤ capacity. |
| Exact-final-capacity race (boundary) | **PASS** | Winner lands at exactly 60/60, never over; exactly one winner. |
| Two non-conflicting concurrent creates | **PASS** | Both succeed — proves the lock serializes rather than falsely rejecting. |
| Duplicate `commandId` (concurrent) | **PASS** | Both calls return the same `reservationId`; exactly one `Reservation`, one Committed `CapacityCommitment`, one `AppliedCommand` row persist. |
| Modify vs Create (same pool/date) | **PASS** | Exactly one of the two operations is rejected on capacity, regardless of which wins the race; total occupancy never exceeds capacity. |
| Modify vs Cancel (same reservation) | **PASS** | Cancel always succeeds; Modify either succeeds or is rejected as `VALIDATION_FAILED` (CAP-D01.01-R16, terminal reservation) — never silently ignored, never miscategorized as a capacity failure. No active commitment survives once cancellation has taken effect. |

Stability: the full matrix was run 5 additional times after first passing
(§9) with zero flakes.

**Bug found and fixed via this matrix, not by inspection:**
`cancelWithCapacity` originally captured the reservation's active
commitment via a read taken *before* opening its transaction, then used
that possibly-stale `commitmentId` to release it *inside* the transaction.
Under a genuine Modify-vs-Cancel race where Modify wins first (supersedes
the old commitment with a new one) while Cancel is still waiting on the
lock, Cancel would then release the *already-superseded* row and leave
the *actually active* new commitment permanently `Committed` — a capacity
leak on a cancelled reservation. Fixed by re-reading the active commitment
*inside* the transaction, after the lock is held, before releasing it.
This is exactly the class of bug real concurrent-transaction testing is
for; it would not have been caught by sequential/mocked tests.

## 7. ServicePeriod handling — FAIL CLOSED, TEMPORARY, OWNER POLICY NOT YET FINALIZED

No real Service Period Management capability exists in this codebase
(`UnvalidatedServicePeriodReader` always reports valid — a pre-existing
CAP-D01.01 placeholder, unchanged by this work). No real operating-hours
or closing-time data source exists anywhere, so there is no concrete
closing time to check the "must the reservation's full interval end
before closing time?" question against.

**Decision made for this MVA slice:** rather than fabricate a closing-time
rule the owner has not confirmed, CAP-D02.03 evaluates **only** the two
owner-confirmed rules that have concrete data behind them:
1. Physical simultaneous-occupancy capacity (the algorithm, §3).
2. CAP-D01.01-R51 whole-day closures (`ClosingDayStore` — this already
   exists, is already real and tested, and is checked before any capacity
   work in `createWithCapacity`, so a closed-day request never reaches the
   lock/capacity path at all).

The narrower "does the reservation's interval fit before closing time
within an open day" question is **not implemented** — there is nothing to
implement it against yet. This is the FAIL CLOSED, TEMPORARY, OWNER
POLICY NOT YET FINALIZED assumption flagged in the architecture revision,
carried forward here explicitly rather than silently dropped: **this MVA
does not reject a booking for running "too close to closing"**, because no
real closing-time data exists to evaluate that against. It is `NOT TESTED`
because there is nothing to test — not because a test was skipped.

**NOT TESTED / NOT APPLICABLE** — pending a real Service Period Management
capability and confirmed owner policy on this exact question.

## 8. Failure-injection tests (real PostgreSQL)

`tests/integration/availability-failure-injection.test.ts`:

1. **Fail after capacity mutation, before reservation persistence** —
   **PASS**. A `ContactReader` forced to always report "not found" makes
   `CreateReservationHandler`'s own validation reject the request *after*
   the orchestrator has already written the capacity commitment in the
   same transaction. Verified: zero `capacity_commitments`, zero
   `reservations`, zero `applied_commands` rows after the call.
2. **Fail after reservation mutation, before the idempotency marker** —
   **PASS**. `ReservationEvent.id` is an unpredictable `@default(cuid())`,
   never set explicitly by application code, so it cannot be collided
   with directly. Instead, a real (deliberately non-production) Postgres
   `UNIQUE` constraint on `reservation_events."type"` is added for the
   duration of this one test only (added and dropped in a `try/finally`,
   confirmed not to affect any other test file), and a dummy
   "ReservationCreated" event is pre-seeded so the *real* request's own
   event insert — which only happens after its own reservation row is
   already written, inside the same transaction — collides against a
   genuine constraint. Verified: zero `capacity_commitments`, zero real
   `reservations` (excluding the unrelated dummy row), zero matching
   `applied_commands` rows after the call; the call itself throws (an
   unexpected infrastructure fault, correctly *not* reinterpreted as a
   benign idempotent replay — see §10's `isCommandIdConflict` narrowing).

## 9. Timezone / DST tests (real PostgreSQL, both 2026 transitions)

`tests/domain/service-time.test.ts` (pure, 6 tests) and
`tests/integration/availability-timezone.test.ts` (real DB, 7 tests).
2026 transition dates (2026-03-29 spring-forward, 2026-10-25 fall-back)
derived independently via day-of-week arithmetic from the fact that
2026-01-01 is a Thursday (2026 is not a leap year) — documented in the
pure test file's header, not hand-picked.

**PASS** — `timestamptz` round-trip preserves the exact instant across
both transition boundaries, including the ambiguous fall-back local hour
(02:00–02:59 occurs twice in local time; storage is UTC and therefore
never ambiguous).

**PASS** — same-day cutoff evaluated through the *full* orchestrator +
Postgres path is discriminating on both dates: a request timed at 17:05
local is correctly rejected using the *correct* DST offset for that exact
date (CEST=+2 in spring, CET=+1 in fall) — the tests are constructed so
that using the *wrong* (stale) offset would flip the result, which is what
actually proves `Intl`-based conversion is doing the work, not a
coincidence of the specific instants chosen.

**PASS** — a booking whose Amsterdam local calendar date differs from its
UTC calendar date (near local midnight) is created and persisted without
error.

## 10. Idempotency / duplicate-command correctness (implementation detail worth flagging)

While building the concurrency tests, a real defect was found in the
naive design: `PrismaReservationRepository.save()`'s existing P2002-catch
converted *any* unique-constraint violation into `IDEMPOTENT_REPLAY`
(inherited from the pre-existing CAP-D01.01 code, which only ever hit this
via `AppliedCommand.commandId`). Once `save()` could be called inside a
*shared, externally-owned* transaction, this became unsafe: PostgreSQL
aborts an entire transaction on any statement error, so catching the JS
exception and returning a value as if nothing happened would leave the
caller trying to issue further queries against an already-poisoned
transaction. Fixed two ways:
- `isCommandIdConflict` now inspects Prisma's `meta.target` to confirm the
  violation is actually on `applied_commands`/`commandId` before treating
  it as a benign replay; anything else propagates as a genuine error
  (exercised directly by §8's second failure-injection test).
- When a *genuine* commandId conflict occurs inside a shared transaction,
  `save()` throws `ReservationCommandRaceLost` instead of returning a
  value, so the failure propagates all the way out and Prisma performs a
  real rollback; `AvailabilityOrchestrator` catches it afterward and
  resolves the actual winner via a fresh, non-transactional read.

**PASS** — proved by the duplicate-`commandId` concurrency test (§6) and
the failure-injection tests (§8).

## 11. Database-level invariants

`partySize > 0` and `start_time < end_time` are enforced as real
PostgreSQL `CHECK` constraints (hand-added to the generated migration
SQL — Prisma 5.22 has no declarative syntax for these), not only at the
application layer.

**PASS** — `tests/integration/availability-create.test.ts`: both
constraints verified by attempting direct inserts that violate them and
asserting the database itself rejects them.

## 12. Boundary preservation (CAP-D01.01-R47)

`ReservationAggregate` was not modified. No capacity field, no pool
reference, no availability-awareness was added to it or to its rule files.
Capacity awareness lives entirely in `domain/availability/`,
`application/availability/`, and the new Prisma models — a separate
vertical, composed by the orchestrator, not merged into the reservation
aggregate. The plain `/reservations` HTTP routes are untouched and remain
capacity-unaware by design, so existing CAP-D01.01 callers see no
behavior change.

**PASS** — verified structurally (no edits to `domain/aggregates/`,
`domain/rules/*.ts` in this change set — confirmed via the file change
list in §2) and behaviorally (full pre-existing CAP-D01.01 test suite,
90 tests, passes unmodified — see §14).

## 13. Known limitations

- **No real ServicePeriod / operating-hours capability** — §7.
- **`NO_ACTIVE_COMMITMENT`**: `modifyWithCapacity` only handles a
  reservation that already has an active CAP-D02.03 commitment (i.e., it
  was created through the capacity-aware flow). A reservation created
  through the plain, pre-existing `/reservations` endpoint has no
  commitment to move; a capacity-relevant modify against it returns
  `NO_ACTIVE_COMMITMENT` rather than attempting to retrofit one. Not
  tested against real concurrency because there is no meaningful race to
  test — it is a synchronous, single-read rejection.
- **Cross-pool Modify + Cancel residual race**: `cancelWithCapacity`'s
  fix (§6) closes the stale-commitment window for the common case where a
  concurrent Modify keeps the reservation in the same (pool, date)
  resource. A Modify that *also* moves the reservation to a different
  pool or date, racing a concurrent Cancel that locked the *original*
  resource, is a narrower residual case not covered by the fix or by a
  dedicated test in this pass — noted here rather than silently left
  undocumented.
- **CAP-D01.01's own (non-capacity) create-race path has not been given
  real-PostgreSQL `Promise.all` treatment** — see the README correction
  (§15). Only the CAP-D02.03 paths have this evidence.
- **No TheFork/Heerlijk/DiningCity/Social Deal(s) integration** — out of
  scope for this work package.
- **`isStaffActor` exemption is by `ActorKind` only** (`ApprovedGuestChannel`
  is the only non-exempt kind) — this mirrors the existing `Actor` model's
  own documented semantics and was not re-litigated here.

## 14. Regression: existing CAP-D01.01 behavior unchanged

Full pre-existing suite (`tests/domain/value-objects.test.ts`,
`tests/acceptance/*.test.ts`, `tests/application/*.test.ts`,
`tests/api/reservations.test.ts` — 90 tests across creation, modification,
cancellation, confirmation, completion, override, the repository
contract, the HTTP layer, and value objects) — **PASS**, unmodified, run
after every structural change in this work package.

## 15. Documentation corrections made

- `README.md`: corrected the R0-audit-flagged inaccurate claim that the
  concurrent-create race was "verified with `Promise.all` against Prisma
  directly." It was not — the actual test simulates two sessions
  *sequentially* against the in-memory repository. Corrected in place,
  with a pointer to the genuine real-PostgreSQL concurrent evidence this
  work package adds for CAP-D02.03, and an explicit note that CAP-D01.01's
  own create-race path still lacks that evidence (§13).
- `README.md`: updated the Stack section (SQLite → PostgreSQL,
  with the reason).
- `PILOT.md`: corrected the "SQLite, single file" operational note, which
  became stale the moment the datasource switched — now describes
  PostgreSQL and points at `.env` instead of `prisma/dev.db`.
- `.env.example`: updated from a SQLite `file:` URL to a PostgreSQL
  connection-string template with no real credentials.

## 16. Migration history note

The pre-existing SQLite-rooted `prisma/migrations/` history (8 migrations,
CAP-D01.01's evolution) was deleted and replaced with a single fresh
PostgreSQL-rooted migration (`20260817090958_init_postgres_with_capacity`),
per Prisma's own required path for a datasource provider switch (P3019).
This is a git-tracked, fully reversible change (prior commits retain the
old files) against a pilot-stage codebase that has never run against real
production data — no data was destroyed. Flagged here explicitly rather
than left implicit in the diff.

## 17. Prohibited actions — none taken

No production deployment. No Guestplan modification or removal. No
Konnichiwa website change. No real Guestplan reservation migrated. No
guest messages sent. No public API exposure beyond this local
implementation. No claim of production readiness anywhere in this report.
No push to any remote — see §18.

## 18. Local commit

A single local commit was created for this work (see repository log for
the SHA — reported at the end of this session's summary). Working tree
was clean of unrelated changes before staging. **Not pushed** — pushing
requires separate, explicit authorization not given in this assignment.

## 19. Recommendation

CAP-D02.03 MVA is implemented and its correctness claims are backed by
real-PostgreSQL evidence, including two genuine bugs (the advisory-lock
raw-SQL type issues in §5, and the stale-commitment race in §6) that were
found and fixed *because* the testing was against a real database rather
than mocks. This is ready for Chief Engineer review at the R1.1
Implementation Gate. It is not a basis for any Guestplan-replacement
decision — that remains gated on the still-open R0 findings (Identity &
Access P0, and the rest of the reservation lifecycle's own maturity).
