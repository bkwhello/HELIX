# R1_1_CONCURRENT_MODIFY_FIX_REPORT

**Phase:** R1 — Critical Gap Closure
**Work Package:** R1.1 — Availability & Capacity
**Task:** P0 Integrity Fix — Concurrent Modify vs Modify
**Capability:** CAP-D02.03 Availability Management
**Baseline commit:** `6f0c5cb`
**Status:** fix implemented, tests passing, awaiting Chief Engineer R1.1 Final Closure Gate

---

## 1. Executive Summary

The residual cross-pool Modify-vs-Cancel race (previously classified `SAFE CONCURRENCY CONFLICT`) is confirmed still safe — and is now safe *by construction* rather than by the coincidental lock-contention argument used before. The investigation that classified it also surfaced a genuine, different P0: **two concurrent Modify calls on the same reservation could both act on the same stale pre-transaction snapshot of "the active commitment," each superseding it and each creating their own new `Committed` row — leaving two active commitments for one reservation.** This has been fixed with a reservation-scoped advisory lock acquired before any capacity work, an in-transaction re-read of both the reservation and its active commitment, and a database-level partial unique index as defense in depth. All required scenarios (A–G), 20 repeated iterations of the targeted race, both new failure-injection points, and the full existing regression suite pass.

## 2. Baseline

Confirmed before any work: branch `feat/ec-002-visibility-baseline`, HEAD `6f0c5cb`, working tree clean — matched the expected baseline exactly.

## 3. P0 Root Cause

`application/availability/AvailabilityOrchestrator.ts`, `modifyWithCapacity` (as of `6f0c5cb`): captured `existingCommitment = await this.capacityRepository.findActiveByReservationId(request.reservationId)` **once, before opening the transaction**, and never re-read it afterward. It was then used, unchanged, as the authoritative target for `excludeCommitmentId` and `updateStatus(..., "Superseded")` after the capacity locks were acquired.

Two concurrent Modify calls (different `commandId`s, same `reservationId`) could both capture this same snapshot before either committed. Whichever acquired its locks first would supersede the original commitment and create a new one; the second, still holding the stale snapshot, would then supersede the *already-superseded* row (a harmless no-op status overwrite) and create its *own* new `Committed` row — never touching the first mover's new commitment at all. Its own `ModifyReservationHandler.handle()` call reads the reservation fresh immediately before writing, so it would find no version conflict there (each Modify call, sequentially, always sees the latest committed reservation state) and would succeed. Result: two `Committed` `CapacityCommitment` rows for one reservation, consuming capacity in one or two pools simultaneously, while the `Reservation.preferredArea` field reflected only whichever write landed last.

This was not caught earlier because the existing concurrency test matrix had no Modify-vs-Modify scenario — only Modify-vs-Create and Modify-vs-Cancel, neither of which exercises this path (Create never touches an existing commitment; the specific Modify-vs-Cancel interleaving happens to be protected by the CAP-D01.01-R16 terminal-status check as an incidental side effect, not by design).

## 4. Fix Design

**Strategy A** (of the three offered) was adopted: acquire a reservation-scoped advisory lock *first*, then re-read authoritative state inside the transaction, rather than optimistic retry (Strategy B). Reasoning: once the reservation lock is held, no concurrent Modify or Cancel on the *same* reservation can possibly be mid-flight, so there is no drift window between the re-read and any subsequent lock/write — the race is removed structurally, not detected-and-retried-around. This is also simpler to reason about and test than a retry loop.

Corrected sequence for a capacity-relevant Modify (implemented in `modifyWithCapacity`):

1. Pre-transaction idempotency fast-path (`findByCommandId`) and existence check (unchanged, existence only — its field values are no longer used for anything authoritative).
2. Open transaction. Acquire the **reservation-scoped lock** (`acquireReservationLock`) — first, always.
3. Idempotency layer 2: `capacityRepository.findByCommandId(tx)`.
4. **Authoritative in-transaction re-read**: fresh `reservationRepository.findById` (the reservation) and fresh `capacityRepository.findActiveByReservationId(tx)` (the commitment). Neither concurrent Modify nor Cancel on this reservation can be interleaved with this read, because both must acquire the same reservation lock first.
5. Compute the destination pool/party size/start time from the fresh values (change-if-specified, else authoritative current value — never the pre-transaction snapshot).
6. Booking-policy check (moved inside the transaction, since it now depends on the fresh values).
7. Compute old/new capacity-lock resources from the **freshly re-read** commitment and destination, `sortLockResources`, acquire both (deterministic order, deduplicated if identical).
8. Evaluate destination availability, excluding the **freshly re-read** `commitmentId`.
9. Supersede exactly that commitment; create exactly one replacement `Committed` commitment.
10. `ModifyReservationHandler.handle(..., tx)` — Reservation write + event + idempotency marker, same transaction.
11. Commit. Any failure at any step throws and rolls back everything written so far in the transaction.

`cancelWithCapacity` received the same reservation-scoped lock as its first step, ahead of its existing (unchanged) capacity-lock-and-re-read logic. This is not required for correctness (the Modify-vs-Cancel pairing was already proven safe by the prior investigation) but makes that safety structural rather than incidental, and keeps the locking discipline uniform across every operation that touches a reservation's commitment.

`createWithCapacity` was **not modified** — it never reads or mutates an *existing* reservation's commitment, so this class of bug does not apply to it.

## 5. Locking Strategy

**Key derivation:** `domain/availability/LockKey.ts` gained `deriveReservationLockKey(reservationId)` — same FNV-1a construction as the existing `deriveLockKey`, but under a **distinct** namespace constant (`RESERVATION_LOCK_NAMESPACE`, `"HALR"`) so a reservation-scoped key can never collide with a (pool, date) key on the same `(namespace, key)` pair. Deterministic, no runtime randomness — verified in `tests/domain/lock-key.test.ts`.

**Global lock order:** reservation-scoped lock (if the operation takes one — Modify, Cancel) **always first**, then capacity `(pool, date)` locks in the existing `sortLockResources` order. Every operation that acquires both follows this same order without exception.

**Deadlock-freedom argument:** two lock families are involved — reservation locks (keyed per-`reservationId`) and capacity locks (keyed per-`(pool, date)`, globally sorted). (a) Two operations on *different* reservations never contend on the same reservation lock (different keys), so no cycle can form through that lock. (b) Two operations that both acquire capacity locks always request them in the same globally-sorted order regardless of which reservation triggered them (`sortLockResources` sorts purely on `(capacityPoolId, localServiceDate)`, with no reservation-specific context), so no cycle can form purely among capacity locks either — this was already true before this fix and is unchanged. (c) No cycle can form *between* the two families: every operation that takes a reservation lock takes it strictly before any capacity lock, and nothing ever acquires a capacity lock without first acquiring its own reservation lock (when one is required) — so it is never possible for operation A to hold a capacity lock while waiting on a reservation lock that operation B holds while B waits on that same capacity lock, because B, by the same fixed order, would already hold the reservation lock before ever attempting the capacity lock. A consistent global partial order across both lock families rules out cycles by construction.

## 6. Active Commitment Re-read

Both the reservation (`reservationRepository.findById`) and the commitment (`capacityRepository.findActiveByReservationId(tx)`) are re-read *inside* the transaction, *after* the reservation lock is acquired, and *before* any capacity lock or write. This is what closes the drift window described in §4: by the time these reads happen, the reservation-scoped lock guarantees no other Modify/Cancel on this same reservation can be concurrently observing or mutating it. The freshly-read `commitmentId` — never the pre-transaction one — is used for `excludeCommitmentId` and the `updateStatus(..., "Superseded")` call.

## 7. Database Invariant / Unique Constraint Decision

Added as defense in depth, alongside (not instead of) the orchestrator fix:

```sql
CREATE UNIQUE INDEX "capacity_commitments_one_committed_per_reservation"
ON "capacity_commitments" ("reservation_id")
WHERE "status" = 'Committed';
```

Prisma 5.22 has no declarative partial/filtered-unique-index syntax, so — consistent with the existing hand-written `CHECK` constraints in this codebase — this was added directly to a generated (otherwise empty) migration's SQL rather than expressed in `schema.prisma`. No `WHERE reservation_id IS NOT NULL` guard was needed: PostgreSQL never treats two `NULL`s as equal under a `UNIQUE` index, so rows with a `NULL reservation_id` (a hypothetical future non-reservation capacity hold) are already unconstrained by this index without an explicit guard. Verified directly: a second `Committed` insert for a `reservation_id` that already has one is rejected by PostgreSQL itself (`ERROR: duplicate key value violates unique constraint`), independent of any application code.

This is feasible and was added. If the orchestrator-level fix ever regressed, this index would cause the offending transaction to abort rather than silently persist a phantom-occupancy state.

## 8. Modified Files

- `application/availability/AvailabilityOrchestrator.ts` — `modifyWithCapacity` rewritten per §4; `cancelWithCapacity` gained the reservation-lock first step.
- `domain/availability/LockKey.ts` — `deriveReservationLockKey`, `RESERVATION_LOCK_NAMESPACE`.
- `domain/repositories/CapacityRepository.ts` — `acquireReservationLock` port method.
- `infrastructure/persistence/PrismaCapacityRepository.ts` — `acquireReservationLock` implementation (same `$executeRaw` + `::int4` pattern as the existing capacity lock).
- `prisma/schema.prisma` — doc comment updated to reference the new partial unique index migration.
- `prisma/migrations/20260818073300_one_committed_commitment_per_reservation/migration.sql` — new.
- `tests/domain/lock-key.test.ts` — `deriveReservationLockKey` unit tests.
- `tests/integration/availability-modify-modify.test.ts` — new, scenarios A–G.
- `tests/integration/availability-failure-injection.test.ts` — two new Modify-specific failure-injection tests.

No changes to `CreateReservationHandler.ts`, `ModifyReservationHandler.ts`, `CancelReservationHandler.ts`, `ReservationAggregate.ts`, or any `domain/rules/*.ts` — the fix is entirely contained within the CAP-D02.03 orchestration and locking layer, per the assignment's scope restriction.

## 9. Schema Changes

One new migration (§7). No changes to existing tables' columns; no changes to the `CapacityCommitment` model's fields, only its doc comment.

## 10. PostgreSQL Concurrency Test Design

`tests/integration/availability-modify-modify.test.ts` uses up to three independent `PrismaClient` instances (genuinely simultaneous transactions, not sequential calls on one connection) and a shared `resetDatabase` (`TRUNCATE ... RESTART IDENTITY CASCADE`) between iterations. `vitest.config.ts`'s `fileParallelism: false` (already in place from the prior work package) ensures no other test file's database reset can interleave with this one.

## 11. Modify-vs-Modify Results

| Scenario | Result |
|---|---|
| A — same pool, time change vs time change | **PASS** |
| B — same pool, party-size change vs party-size change | **PASS** |
| C — cross-pool Modify vs cross-pool Modify (exact originally-reported shape) | **PASS** |
| C, repeated — 20 iterations of the targeted race | **PASS**, 0 flakes (also reran the whole file 4 additional times end-to-end: 0 flakes across 32 total executions) |
| D — cross-date Modify vs Modify | **PASS** |
| F — three concurrent Modify commands | **PASS** — at most one `Committed` commitment survives |
| G — duplicate `commandId` (concurrent) | **PASS** — idempotent: one `Committed` commitment, one `AppliedCommand` row |

All assert, per §14 of the assignment: `COUNT(Committed commitments for R) <= 1` (in fact `=== 1` in every scenario where the reservation remains active), the surviving commitment's pool/party-size/time matches the final `Reservation` row, and no orphaned/duplicate `Committed` rows exist.

## 12. Modify-vs-Cancel Regression Results

Scenario E (both the pre-existing test in `availability-concurrency.test.ts` and a dedicated re-check in the new file): **PASS**. Cancel always succeeds; Modify either succeeds or is rejected `VALIDATION_FAILED` under CAP-D01.01-R16 (never miscategorized as a capacity failure); zero `Committed` commitments remain for the reservation once cancellation has taken effect. The classification from the investigation phase (`SAFE`) is confirmed unchanged, now backed by the reservation lock rather than incidental lock-contention.

## 13. Failure-Injection Results

| Injection point | Result |
|---|---|
| After active-commitment re-read, before supersession (temporary `CHECK` constraint forbidding `status = 'Superseded'`, dropped in `finally`) | **PASS** — full rollback; original commitment remains `Committed`, unchanged; `Reservation.partySize` unchanged |
| After new commitment insert, before Reservation persistence (reservation pre-set to `Cancelled` outside the transaction; CAP-D01.01-R16 rejects the in-flight Modify after its new commitment insert succeeds) | **PASS** — full rollback; the tentative new commitment does not survive; the original commitment remains `Committed` and untouched; `Reservation.partySize` unchanged |

Both existing CAP-D02.03 Create failure-injection tests (capacity-before-reservation, reservation-before-idempotency-marker) still pass unmodified.

## 14. Full Regression Results

- `tsc --noEmit`: clean.
- Full `vitest run`: **178/178 passing**, 19 test files, run twice consecutively with identical results (0 flakes).
- This includes: all pre-existing CAP-D01.01 tests (90), all CAP-D02.03 pure-domain tests, the original create/capacity/concurrency/failure-injection/timezone integration suites from the prior work package, and every new test added in this fix.

## 15. Invariant Matrix

| Invariant | Status | Evidence |
|---|---|---|
| INV-01 — exactly one active `Committed` commitment per active reservation requiring capacity | **PROVEN** | §11 (all scenarios), §7 (DB-level) |
| INV-02 — Cancelled reservation has zero active `Committed` commitments | **PROVEN** | §12, and the original Modify-vs-Cancel test in `availability-concurrency.test.ts` |
| INV-03 — concurrent Modify never produces two active commitments | **PROVEN** | §11, scenarios A/B/C/D/F, 20-iteration repeat |
| INV-04 — failed Modify leaves original Reservation + commitment intact | **PROVEN** | §13, both failure-injection tests |
| INV-05 — successful Modify leaves old→Superseded, new→Committed, Reservation→new state | **PROVEN** | §11, scenarios A/B/C/D |
| INV-06 — capacity consumption corresponds to the final Reservation state | **PROVEN** | §11, scenario F explicitly asserts the surviving commitment's pool/partySize matches the final Reservation row |
| INV-07 — no stale pre-transaction commitment used for an authoritative mutation | **PROVEN** | §4/§6 (structural — the pre-transaction read is existence-only; the authoritative values are always the in-transaction re-read) |

## 16. Remaining Risks

- **Vestigial idempotency check in `cancelWithCapacity`**: `capacityRepository.findByCommandId(request.commandId, tx)` inside Cancel can never find a match, because `updateStatus` (Cancel's only capacity write) does not stamp a `commandId` onto the row it releases — that field always retains whatever commandId originally created/superseded-into that commitment. This is pre-existing (not introduced by this fix) and not a correctness bug (the outer pre-transaction `reservationRepository.findByCommandId` check, plus `cancelHandler.handle()`'s own internal idempotency check, are what actually guard against double-processing; at worst a genuine race produces one redundant, idempotent `Released`-on-`Released` write). Flagged here for visibility, not fixed, per the narrow scope of this assignment.
- **`NO_ACTIVE_COMMITMENT` path unchanged**: a reservation with no CAP-D02.03 commitment (predates capacity tracking) still cannot be capacity-modified through this orchestrator — unchanged limitation from the prior work package, out of scope here.
- **Create vs Modify / Create vs Cancel**: unaffected by this fix (Create never touches an existing reservation's commitment) and were already covered by the prior concurrency matrix; not re-litigated here beyond the full regression run in §14.

## 17. R1.1 Closure Recommendation

**PASS WITH CONDITION.** The P0 is fixed and proven against real PostgreSQL, including the exact originally-reported interleaving repeated 20 times with zero flakes, both new failure-injection points, and full regression. The condition is the same one carried from the prior implementation report and unchanged by this fix: CAP-D02.03's ServicePeriod/closing-time question remains fail-closed/owner-policy-pending (not this task's scope), and CAP-D01.01's own non-capacity create-race path still lacks real-PostgreSQL evidence (also not this task's scope). Neither blocks this specific P0's closure. No claim of production readiness is made.

## 18. Commit / Working Tree State

Reported after the commit is created (§ below) — SHA and working-tree status.

---

```
P0 FIX:
PASS

MULTIPLE ACTIVE COMMITMENTS POSSIBLE:
NO

MODIFY VS CANCEL:
SAFE

MODIFY VS MODIFY:
SAFE

R1.1 CLOSURE RECOMMENDATION:
PASS WITH CONDITION

COMMIT:
<reported after commit — see final summary>

PUSHED:
NO
```
