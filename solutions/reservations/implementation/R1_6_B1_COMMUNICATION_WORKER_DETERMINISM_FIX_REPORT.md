# R1.6-B1 — Communication Worker Determinism Fix: Implementation Report

Program: Guestplan Replacement
Assignment: "Communication Worker Determinism Fix"
Mode: BOUNDED DEFECT FIX ONLY

Previous gates: R1.1–R1.5 — PASS · R1.6-A Service Period — PASS · R1.6-B Guest Communications Engine — PASS · R1.6-C0 ServicePeriod Enforcement — PASS (commit `519431f`, 633/634).

## 1. Baseline

Verified before any change:

- Branch: `feat/ec-002-visibility-baseline`
- HEAD: `519431f7d3ae6a95c52e94a28a4406e34a725c3d` (matches the assignment's stated known HEAD)
- Working tree: clean except three pre-existing untracked files (`R1_3_GUEST_CONTACT_ARCHITECTURE_INVESTIGATION.md`, `R1_6_B_GUEST_COMMUNICATIONS_ARCHITECTURE_INVESTIGATION.md`, `R1_6_GUEST_BOOKING_COMMUNICATIONS_ARCHITECTURE_INVESTIGATION.md`) that predate this assignment and were not touched or staged
- Staged files: none
- Failing test reproduced on baseline, unmodified: `tests/integration/communication-worker.test.ts` §20, run together with `floor-seating-concurrency.test.ts` and `service-period.test.ts` (the same file sequence that originally surfaced it in R1.6-C0's regression) — **5 failures out of 8 runs (62.5%)** before any change.

No pull, merge, rebase, branch switch, or push was performed.

## 2. Original Failure

`tests/integration/communication-worker.test.ts` §20 ("ambiguous/unknown outcome (delivery adapter throws) is handled honestly ... leaves the row in Processing"): seeds two Pending confirmation messages (`a`, `b`) with identical `availableAt` (both derived from the same fixed test clock), queues exactly one `THROW` outcome on the fake delivery port, and asserts `a`'s message ends up `Processing` (never guessed at) while `b`'s ends up `Sent`. This assumes `a` is claimed and processed strictly before `b`. When PostgreSQL happened to return the tied rows in the other order, `b` received the `THROW` and `a` received the default success, flipping both assertions.

## 3. Root Cause

`infrastructure/persistence/PrismaCommunicationOutboxRepository.ts`'s `claimBatch` had two independent, compounding determinism gaps:

1. The claiming subquery ordered eligible rows by `available_at ASC` only. Rows enqueued with identical `available_at` (routine — any two confirmations queued from the same fixed/test clock, or simply two reservations created in the same request-handling instant) tie, and PostgreSQL does not guarantee a stable order for tied rows without an explicit secondary sort key. This affects **which rows the `LIMIT` selects** when eligible ties outnumber `batchSize`.
2. Separately — and this was not fully appreciated until re-verifying PostgreSQL's own documented behavior while writing this fix — even a perfectly-ordered inner subquery does not guarantee the outer `UPDATE ... RETURNING`'s result rows come back in that order. PostgreSQL's `RETURNING` clause ordering is documented as unspecified; that guarantee applies only to a plain `SELECT`. This affects **what order the caller (the worker's `for` loop) actually sees**, independent of which rows were selected.

Both had to be fixed for the invariant ("every set of eligible communication messages has a deterministic total ordering") to hold end-to-end.

## 4. Query/Order Before

```sql
UPDATE communication_messages
SET status = 'Processing', claimed_at = $now, attempt_count = attempt_count + 1
WHERE id IN (
  SELECT id FROM communication_messages
  WHERE (...)
  ORDER BY available_at ASC
  LIMIT $batchSize
  FOR UPDATE SKIP LOCKED
)
RETURNING ...
```
```ts
return rows.map(toRecord); // raw RETURNING order, unmodified
```

## 5. Query/Order After

`infrastructure/persistence/PrismaCommunicationOutboxRepository.ts:117-171`. SQL change (one line):

```sql
ORDER BY available_at ASC, created_at ASC, id ASC
LIMIT $batchSize
FOR UPDATE SKIP LOCKED
```

Application-layer change (new, after the query, before `return`):

```ts
const ordered = [...rows].sort((a, b) => {
  const byAvailableAt = a.available_at.getTime() - b.available_at.getTime();
  if (byAvailableAt !== 0) return byAvailableAt;
  const byCreatedAt = a.created_at.getTime() - b.created_at.getTime();
  if (byCreatedAt !== 0) return byCreatedAt;
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
});
return ordered.map(toRecord);
```

Nothing else in the method changed: eligibility `WHERE` clause, `FOR UPDATE SKIP LOCKED`, batch size parameter, the `UPDATE`'s `SET` clause, and the transaction/statement boundary are all byte-for-byte unchanged.

## 6. Why the Tie-Break Is Deterministic

`(available_at, created_at, id)` is a true total order over the eligible set:

- `available_at` — the primary business ordering (oldest-due-first), unchanged in meaning.
- `created_at` — a real `now()` timestamp, narrows almost all remaining ties (two rows inserted in genuinely separate transactions get genuinely different values); included because it's the more business-meaningful secondary key ("of two equally-due messages, the one enqueued first") before falling back to an arbitrary key.
- `id` — a `cuid()` primary key (`prisma/schema.prisma:587`, `@id @default(cuid())`). Primary keys are unique by constraint, so this key alone is always sufficient to break any remaining tie, no matter how `available_at` and `created_at` collide (including the same-transaction `now()` collision case, §3).

Because the triple is applied identically both in the SQL `ORDER BY` (governing selection) and in the JS-side `.sort()` (governing presentation order, §3 point 2), the method's observable output is deterministic regardless of what PostgreSQL's internal plan does with `RETURNING` order.

## 7. PostgreSQL Evidence

All tests below run against real local PostgreSQL (`createTestPrismaClient()` / `TEST_DATABASE_URL`, never SQLite/in-memory), new file `tests/integration/communication-worker-determinism.test.ts`:

| Test | Proves | Result |
|---|---|---|
| T1 — equal `available_at`, distinct `created_at` | Claims in `created_at` order regardless of insertion order (rows seeded out-of-order on purpose: c, a, b) | PASS |
| T2 — equal `available_at` AND equal `created_at` (full tie) | Claimed order is independently verifiable as lexicographically sorted by `id` (a plain string comparison, not a re-application of the repository's own sort function — not tautological); identical across 20 repeated reset-and-reclaim cycles | PASS |
| T3 — batch boundary (10 tied rows, batch size 3) | Four successive small batches exactly partition the full sorted order, with no gaps/overlaps/reordering; reproduced identically on a second full run | PASS |
| T4 — two concurrent workers (two independent `PrismaClient` connections, `Promise.all`) racing the same 10 tied rows | Zero double-claims, zero lost messages, each worker's own claimed batch internally sorted — "deterministic partition consistent with locking behavior" without asserting a specific split (which worker wins which row is `FOR UPDATE SKIP LOCKED`'s legitimate concurrency-timing concern, not this fix's) | PASS |
| T5 — tied `FailedRetryable` (retry-eligible) rows | Identical ordering rule applies to retry-eligible rows, not only fresh `Pending` ones; stable across 10 repeated reclaim cycles | PASS |

5/5 tests passing, first attempt.

## 8. Repetition/Flakiness Evidence

**Before fix**: reproduced on baseline (`git stash` of nothing needed — this run was on unmodified `519431f`) — 5 failures / 8 runs (62.5%) of the exact file sequence (`floor-seating-concurrency.test.ts`, `service-period.test.ts`, `communication-worker.test.ts`) that originally surfaced the flake.

**After fix — first attempt**: 50 repeated runs of the same sequence, executed as a background job running *concurrently* with a second diagnostic background job. Result: 49/50 passing, 1 failure (run 17). Investigated before accepting this number: captured full output of the failure and found it was **not** an assertion failure at all — it was `PrismaClientInitializationError: Can't reach database server at localhost:5433`. The local, user-owned PostgreSQL dev instance (see `helix-postgres-local-setup` — a `pg_ctl`-managed process, not a production-grade server) had been crash-interrupted (`database system was interrupted; last known up at 15:25:54`, confirmed in `pgdata-helix/server.log`) by the combined load of running two heavy stress loops concurrently. This was self-inflicted test-harness contention, not a property of the fix.

**After fix — clean rerun**: restarted PostgreSQL, waited for full WAL crash-recovery (`database system is ready to accept connections`, confirmed via `pg_isready`), then reran the identical 50-repetition loop **alone, with nothing else running concurrently**.

**Result: 50/50 passing, 0 flakes.**

An additional 10 repeated runs of the new `communication-worker-determinism.test.ts` file (5 tests each) were also run standalone: **10/10 clean**.

## 9. Concurrency Evidence

`tests/integration/communication-concurrency.test.ts` (pre-existing, unmodified — already contains the required ≥20-iteration matrix: "20 iterations, 0 double-claims, 0 lost messages" for two workers racing a single message, plus an 8-message/two-worker no-overlap test) was run 3 additional times after the fix: **3/3 clean, 2/2 tests passing each run** — zero double claims, zero lost messages, zero ordering-related failures, both before and after this fix (this file's own assertions were never about ordering — only about claim exclusivity/completeness, which the fix does not touch, §5).

`communication-worker-determinism.test.ts`'s own T4 (§7) additionally proves the ordering fix specifically survives genuine two-connection concurrency (not just sequential repetition).

## 10. Full Regression

`npm run typecheck` — clean, zero errors.

`npx vitest run` (full suite, single run, nothing concurrent): **639/639 passing, 50/50 test files** (up from the pre-fix 633/634, 49 files — the one new file is `communication-worker-determinism.test.ts`, 5 tests, and the previously-failing `communication-worker.test.ts` §20 is now consistently green).

**No other unrelated failure appeared.** (The pre-existing flake this assignment targets was the only known outstanding regression-suite issue carried in from R1.6-C0's own report; no new one was introduced or discovered.)

## 11. Files Changed

- `infrastructure/persistence/PrismaCommunicationOutboxRepository.ts` — `claimBatch`'s `ORDER BY` and a new post-query sort (§5).
- `tests/integration/communication-worker-determinism.test.ts` — new, T1–T5 (§7).
- `solutions/reservations/implementation/R1_6_B1_COMMUNICATION_WORKER_DETERMINISM_FIX_REPORT.md` — this report.

No claiming semantics, locking (`FOR UPDATE SKIP LOCKED`), batch size, eligibility rules, retry scheduling, message state transitions, or transaction boundary were altered — verified by inspection (§4 vs §5 diff is exactly the `ORDER BY` clause and the added `.sort()`) and by the untouched R1.6-B communication suite and concurrency matrix staying green (§9, §10).

## 12. Remaining Risks

| # | Risk | Class |
|---|---|---|
| 1 | The local, user-owned PostgreSQL dev instance (port 5433, `pg_ctl`-managed, no admin/SCM rights available in this environment) is not resilient to heavy concurrent test load and can itself crash under enough simultaneous connection pressure — as happened mid-way through this assignment's own repetition testing. This is an environment/tooling limitation, not a product defect, but it did contaminate one intermediate measurement (§8) before being identified and corrected. Future stress runs in this environment should avoid running multiple heavy test loops concurrently. | P3 (environment only) |
| 2 | `id` (`cuid()`) is "roughly insertion-ordered" but that property is not relied upon for correctness here — only its uniqueness is — so this is not a risk to the fix itself, noted only for completeness. | Informational |
| 3 | This fix does not add a covering index for `(available_at, created_at, id)` — the existing `@@index([status, availableAt])` still serves the `WHERE` clause; the additional sort keys are resolved by a small in-memory/plan-level sort bounded by `batchSize` (≤ tens of rows in practice), which is not a measurable performance concern for a background outbox worker. | P3 |

## 13. Final Verdict

Defect fixed. Root cause (missing deterministic tie-break, in both SQL selection and RETURNING presentation order) addressed with the smallest sufficient change. Formerly-flaky test green on 50/50 clean repeated runs. New T1–T5 real-PostgreSQL determinism/concurrency tests all pass, including genuine two-connection concurrency. Full regression 639/639, zero new regressions, zero remaining unexplained failures. Claiming semantics, locking, batch size, eligibility, retry scheduling, and transaction boundaries are all unchanged and proven so by the untouched suites staying green.

## 14. Commit State

One bounded local commit created (see final response for hash). Not pushed.
