# R1.5 — Floor & Seating: Implementation Report

Mode: BOUNDED IMPLEMENTATION + REAL POSTGRESQL PROOF. Authority: the R1.5 Chief Engineer Implementation Assignment ("FINAL OWNER-CORRECTED FLOOR CONFIGURATION") and `R1_5_FLOOR_SEATING_FINAL_ARCHITECTURE.md` (PASS).

No production deployment. No push. No Guestplan changes. No website changes.

---

## 1. Executive Summary

CAP-D03 (Spatial Planning) and CAP-D04 (Seating Operations) are implemented: `Table`/`Seat`/`ResourceBlock`/`SeatingAssignment`/`SeatingAssignmentResource` Prisma models, two PostgreSQL range `EXCLUDE` constraints (the structural backstop the final architecture specified), a three-tier advisory-lock `SeatingOrchestrator` extending R1.1's proven pattern, the authoritative 23-resource Konnichiwa floor (19 Sushi + 4 Teppanyaki, 40 Teppanyaki seats), and the corrected Sushi commercial capacity (60 → 49). **All twelve required scenarios (A–L) are proven against real PostgreSQL, plus Table-14-absence (N); 80 concurrency-repetition iterations ran with zero flakes; three failure-injection tests prove real transactional rollback, including a direct database-level proof of the `EXCLUDE` constraint (not just the application check in front of it). Full regression: 412/412 tests passing, up from 344 before this assignment. Local smoke test: 16/16 steps PASS.**

**One new, previously-unknown numeric discrepancy was found and is reported, not silently resolved** (§4): the assignment's own itemized per-table list (§4 of the assignment) sums to **51** nominal Sushi seats, not the 45+4=49 the assignment's own "SUSHI CAPACITY PROOF" section separately asserts. Neither number was altered to force agreement — the itemized, more granular list was seeded verbatim; CAP-D02.03's Sushi capacity was set to the explicitly, repeatedly mandated 49. This is architecturally inert (CanAccept and CanSeat remain structurally independent — §14), but is a real data discrepancy the Chief Engineer/owner should resolve.

---

## 2. Repository Baseline

| Item | Value |
|---|---|
| Branch | `feat/ec-002-visibility-baseline` |
| HEAD before this work | `92f56374180ddaa82228a2204f33be1e6aad0257` |
| Untracked, unmodified by this work | `R1_3_GUEST_CONTACT_ARCHITECTURE_INVESTIGATION.md` |
| R1.5 architecture reports | `R1_5_FLOOR_SEATING_ARCHITECTURE_INVESTIGATION.md`, `R1_5_FLOOR_SEATING_FINAL_ARCHITECTURE.md` — both present, both PASS, unmodified by this implementation |

No drift from expected baseline before implementation began.

---

## 3. Final Owner Floor Configuration

Seeded verbatim from the assignment's §4/§8 (`infrastructure/floor/floorSeedData.ts`, applied via `ops/floor/seedFloor.ts`, idempotent upsert):

- **Sushi**: Table 1(4), 2(4), 3(4), 4(4), 5(2), 6(2), 7(2), 8(4), 9(4), 10(5), 11(2), 12(4), 13(2), 15(2), 16(2) — **Table 14 deliberately, permanently absent** — plus Bar 17/18/19/20 (1 each, four separate one-person resources, never merged into one four-person table). **19 Table rows, 51 nominal seats total.**
- **Teppanyaki**: grills **C, D, E, F** (real staff-facing labels — never internally renamed to "Grill 1–4"), 10 individually-identifiable seats each (`C-01`…`C-10`, etc.), `supportsSharedSeating: true`. **4 Table rows, 40 Seat rows.**
- **CAP-D02.03 capacity**: Sushi **49** (was 60), Teppanyaki **40** (unchanged) — `domain/availability/CapacityPool.ts`.

Verified directly against the seeded database (§27):

```
 area_id    | count | sum
------------+-------+-----
 Teppanyaki |     4 |  40
 Sushi      |    19 |  51
```

---

## 4. Superseded Capacity Values

- **Sushi 60 → 49**: `domain/availability/CapacityPool.ts`, per the assignment's explicit, repeated instruction. All hardcoded `60`-as-Sushi-capacity references across the codebase were found and corrected (`tests/integration/availability-create.test.ts`, `tests/integration/availability-concurrency.test.ts`, `tests/domain/availability-evaluator.test.ts`) — party sizes in every affected test were rescaled to preserve the exact same regression property (boundary-exact, false-sold-out-regression, etc.) against the new capacity, not merely bumped past the old one. Each rescaling is documented inline at the point of change. **Sushi capacity = 47 was never implemented anywhere** — it was the prior architecture investigation's own calculation from an incomplete inventory (missing the four bar seats), explicitly named and prohibited by this assignment, and confirmed absent from the codebase by a repository-wide search (§27).
- **Teppanyaki stays 40** — confirmed unchanged in `CapacityPool.ts` and in the seeded floor (4×10 = 40 exactly).
- **Genuine, newly-found discrepancy (not owner-flagged, not silently resolved)**: the assignment's own itemized Sushi table (§4 of the assignment) sums to **51** nominal seats (7 tables of 4 + 7 tables of 2 + 1 table of 5 = 47, + 4 bar seats = 51), not the **45 + 4 = 49** the assignment's own §5 "SUSHI CAPACITY PROOF" section separately claims. Both cannot be simultaneously correct. This implementation seeded the itemized list verbatim (the more specific, named-resource data) and set CAP-D02.03's capacity to the explicitly mandated 49 (tied directly to the mandatory boundary regression tests, §33 of the assignment) — **neither number was altered to make the two agree.** Documented in full, including the reasoning for this specific resolution choice, in `infrastructure/floor/floorSeedData.ts`'s own header comment. See §33 (Remaining Risks) for the operational implication.

---

## 5. CAP-D03/CAP-D04 Boundaries

`CanAccept` (`CAP-D02.03`, headcount-only, unchanged) and `CanSeat` (`CAP-D04.01`, physical fit, new — `domain/floor/SeatabilityEvaluator.ts`) remain fully independent, exactly as both R1.5 architecture reports specified. **Neither module imports the other's concepts**: `AvailabilityEvaluator.ts` has no `Table`/`Seat` awareness; `SeatabilityEvaluator.ts` never reads `CAPACITY_POOLS`. `CanSeat` remains **advisory** — nothing in `CAP-D01.01`/`CAP-D02.03`'s create/modify/cancel paths blocks on a `CanSeat` failure; a reservation can be `Confirmed` and simultaneously have `NOT_SEATABLE` for every resource it might want, exactly as `CAP-D01.01-R24` ("Confirmation Does Not Guarantee Seating") already required before R1.5 existed.

---

## 6. Schema Changes

Five new Prisma models appended to `prisma/schema.prisma` (full header comments included in the schema itself): `Table`, `Seat`, `ResourceBlock`, `SeatingAssignment`, `SeatingAssignmentResource`. `Table` is deliberately the **single** entity type for both Sushi tables/bar positions and Teppanyaki grills — `supportsSharedSeating` is the only thing that differs. No new `Area`/`CapacityPool` table — `Table.areaId` reuses `CapacityPoolId`'s exact string values (`"Sushi" | "Teppanyaki"`), per `CapacityPool.ts`'s own "promote only when a concrete need exists" precedent.

## 7. Migration

`prisma/migrations/20260820120000_add_floor_seating_operations/migration.sql` — applied to `helix_reservations_test` (dev/CI) and `helix_reservations_dev` (pilot); the throwaway `helix_reservations_shadow` database used to diff it was dropped afterward. Contains, beyond the plain `CREATE TABLE`/`CREATE INDEX`/`ADD FOREIGN KEY` statements Prisma generated:

- Hand-written `CHECK` constraints: `tables_nominal_capacity_positive`, `resource_blocks_start_before_end`, `seating_assignments_start_before_end`, `seating_assignment_resources_start_before_end`, and `seating_assignment_resources_exactly_one_resource` (the `tableId` XOR `seatId` invariant — Prisma has no declarative XOR syntax, same situation as every other hand-written constraint already in this schema).
- A partial unique index, `seating_assignments_one_active_per_reservation`, mirroring R1.1's `capacity_commitments_one_committed_per_reservation` and R1.2's `staff_users_one_owner` exactly.
- Two hand-written FK constraints Prisma's own diff did not generate (`seating_assignment_resources.tableId`/`seatId` are deliberately not declared as Prisma relations, since they are optional/polymorphic) — added by hand, nullable FKs, valid PostgreSQL.
- `SeatingAssignment.reservationId` **is** a real FK to `reservations.id` — unlike `Reservation.contactId` (deliberately not an FK, to avoid backfilling legacy rows), `seating_assignments` is a brand-new table with no legacy rows to reconcile.
- `CREATE EXTENSION IF NOT EXISTS btree_gist;` plus the two `EXCLUDE USING gist` constraints (§19).

**One real bug found and fixed during migration development**: the first attempt used `tsrange()` (for `timestamp without time zone`) against `timestamptz` columns — PostgreSQL rejected it (`function tsrange(timestamptz, timestamptz, unknown) does not exist`). Corrected to `tstzrange()` throughout. Caught immediately by `prisma migrate deploy` itself; the failed migration was cleanly resolved (`prisma migrate resolve --rolled-back`) and reapplied — PostgreSQL had already rolled back the entire failed attempt atomically, confirmed by direct inspection before the fix.

---

## 8. Sushi Resource Model

`Table` rows, `areaId: "Sushi"`, `supportsSharedSeating: false` — claimed as a whole unit via `SeatingAssignmentResource.tableId`. No `Seat` children (no evidence requires seat-level tracking for ordinary Sushi tables). Combination (§9 assignment) uses the exact same multi-resource mechanism as a single-table claim — one `SeatingAssignment`, multiple `SeatingAssignmentResource` rows, no `TableCombination` entity, no optimizer. Proven by Scenario B (§20).

## 9. Sushi Bar Model

Bar 17/18/19/20 are four ordinary `Table` rows (`nominalCapacity: 1`, `supportsSharedSeating: false`) — the "smallest coherent model" the final architecture recommended: a bar position needs no field an ordinary `Table` doesn't already have. Individually identifiable and independently claimable/combinable, proven by the 20-iteration "same Sushi bar resource" concurrency test (§28) and the main scenario suite.

## 10. Teppanyaki C/D/E/F Model

Four `Table` rows (`supportsSharedSeating: true`, `nominalCapacity: 10`), real staff-facing labels `C`/`D`/`E`/`F` (never "Grill 1–4"), each with 10 `Seat` children (`C-01`…`C-10`, etc.). Claimed seat-by-seat via `SeatingAssignmentResource.seatId` — a grill is never claimed as a whole `Table` row. Proven directly: Scenario E (shared grill, two parties, disjoint seats), Scenario F (overclaim refused), Scenario H (multi-grill party).

## 11. E+F 24-Person Preferred Block

`domain/floor/PreferredResourceBlock.ts` — a small, static, **non-authoritative** constant (`PREFERRED_RESOURCE_BLOCKS`), matching `CapacityPool.ts`'s own precedent for configuration that doesn't yet need to be a database row. **Read by nothing in the validation path** — `SeatabilityEvaluator`/`SeatingOrchestrator` never import it; a party of any size claiming any combination of grills is validated by ordinary seat-availability counting, identically whether or not it happens to match this constant. This structurally guarantees the 40-person Teppanyaki ceiling can never be increased by this configuration, per the assignment's explicit prohibition. The label/adjacency fact ("E+F are positioned parallel to each other") is recorded as floor-layout metadata belonging conceptually to `CAP-D03.02` (Floorplan Management, per the registry's own "layout integrity" ownership), not enforced anywhere in `CAP-D04`.

**The 24-vs-20-physical-seats arithmetic gap identified in the final architecture (§8 of that report) is carried forward here, unresolved** — two grills hold 20 seats, not 24. Not fixed, not hidden. See §33.

## 12. SeatingAssignment Model

`domain/floor/SeatingAssignment.ts` + `SeatingAssignmentResource` — implemented exactly as designed in the final architecture §10, with the collapsed single operational status (§16). `application/floor/SeatingOrchestrator.ts` is the one place that composes reservation lock → seating-resource lock(s) → `CanSeat` → write, mirroring `AvailabilityOrchestrator`'s own composition pattern line for line.

## 13. ResourceBlock

`domain/floor/ResourceBlock.ts`, `infrastructure/persistence/PrismaFloorRepository.ts`'s `createResourceBlock`/`findOverlappingResourceBlocks`. Always `Table`-scoped (never `Seat`-scoped) — blocking a grill's `Table` id is read by `SeatabilityEvaluator` as "every seat under this table is unavailable for the blocked interval," satisfying "one parent-level block, not ten duplicate blocks" (assignment §17) structurally, without a second FK layer. Proven: Scenario I, and the local smoke test's steps 12–13.

## 14. CanAccept vs CanSeat

Covered in full in §5. No merge, no shared validation path, no shared result type (`AvailabilityOutcome` vs `SeatabilityOutcome` are structurally parallel, never unioned).

## 15. Pre-Assignment

No new object. `SeatingOrchestrator.assignSeating` is the single mechanism for both pre-assignment (`seatImmediately` omitted/false, status `Assigned`) and walk-in immediate seating (`seatImmediately: true`, status `Seated`) — proven by the "Pre-assignment vs walk-in" test in `floor-seating.test.ts`, which calls the identical method for both and asserts the only difference is the resulting status.

## 16. Seated Semantics

**One collapsed operational status** on `SeatingAssignment` (`Assigned | Seated | Released`) — no separate `Arrived` state, per explicit owner confirmation. `Reservation.arrivedAt`'s pragmatic pre-R1.5 role is superseded going forward by `SeatingAssignment.seatedAt`/`status = "Seated"` — the field itself was **not** touched, renamed, or migrated (§26 — "investigate carefully," not "change now"; this is an implementation-scope decision, not a data-migration task this assignment authorized).

## 17. No-Show

`SeatingOrchestrator.releaseNoShow` — staff-confirmed only; the assignment's own +20-minute marker is implemented purely as a **derived, read-model field** (`FloorReadModel.ts`'s `lateArrivalRiskFlag`, computed from current time vs. reservation time at query time, never stored, never triggers anything on its own). Releasing a No-Show touches **only** `SeatingAssignment`/`SeatingAssignmentResource` — `Reservation.status` and `CapacityCommitment` are explicitly, deliberately left untouched, with the full case analysis (why this is the safe default, and why the alternative is a genuine open owner question, not an oversight) recorded in `SeatingOrchestrator.releaseNoShow`'s own doc comment and in the final architecture §15. Proven directly by the dedicated No-Show test in `floor-seating.test.ts`.

## 18. Walk-In

Unchanged from both prior R1.5 reports: `sourceCategory = WalkIn` on an ordinary `Reservation`, no second aggregate. Proven end-to-end by the local smoke test (step 14) and by Scenario K's concurrency proof.

---

## 19. PostgreSQL EXCLUDE Constraints

Exactly as the final architecture specified — **not** a plain partial unique index (which cannot represent legitimate non-overlapping reuse of the same resource). Two `EXCLUDE USING gist` constraints on `seating_assignment_resources` (one `tableId`-scoped, one `seatId`-scoped, both `WHERE status IN ('Assigned','Seated')`), using `tstzrange(start_time, end_time, '[)')` — the `[)` bound matches this codebase's existing half-open interval convention (`AvailabilityEvaluator.intervalsOverlap`) exactly, verified directly by Scenario D (back-to-back, both accepted) and Scenario C (overlapping, one rejected) against the real constraint, not just application logic. `btree_gist` is a standard PostgreSQL contrib extension (`CREATE EXTENSION IF NOT EXISTS`), not a new external dependency. **Directly, independently proven at the database level** (not merely asserted) by `floor-seating-failure-injection.test.ts`'s first test, which bypasses the application-level `SeatabilityEvaluator` check entirely and issues a raw multi-resource `createAssignment` call where the second resource conflicts — the whole operation, including the first, otherwise-valid resource, is rejected by the database itself.

## 20. Transaction Model

Exactly the final architecture §20 matrix: `assignSeating`/`moveSeating`/`markSeated`/`releaseNoShow` each get their own transaction (no `Reservation`/`CapacityCommitment` write involved); `AvailabilityOrchestrator.cancelWithCapacity` releases seating in the **same** shared transaction as the reservation/capacity release, via a new, **optional** (backward-compatible — every pre-R1.5 call site is unaffected) `seatingOrchestrator` constructor parameter. Proven: the cancellation-integration test in `floor-seating.test.ts`, and the "seating mutation before an ultimately-failing transaction step" + "cancelWithCapacity's real integration point" tests in `floor-seating-failure-injection.test.ts` — the latter two directly proving the required property: **for every injected failure point, the system leaves either the complete previous valid state or the complete new valid state, never a hybrid.**

## 21. Locking

`domain/availability/LockKey.ts` extended with a third namespace (`SEATING_RESOURCE_LOCK_NAMESPACE`, `"HALS"`) and `sortSeatingResourceIds` — the exact same deterministic-ordering technique `sortLockResources` already used for Tier 2. Global order: reservation lock (Tier 1, reused from R1.1's own `RESERVATION_LOCK_NAMESPACE` — deliberately the same lock family, so a seating operation and a concurrent capacity-relevant Modify/Cancel on the same reservation serialize against each other too) → capacity lock(s) (Tier 2, only when relevant) → seating-resource lock(s) (Tier 3, sorted). Every operation that takes more than one tier acquires them in this fixed order — no new deadlock class introduced, by the same argument `sortLockResources`'s own doc comment already makes.

## 22. Reassignment

`SeatingOrchestrator.moveSeating` — reservation lock first, re-read the current active assignment **inside** the transaction (never trusting a pre-transaction snapshot — the exact R1.1 P0 lesson), lock the new resources (sorted), validate, release the old claim, create the new one. Proven: the "Move (reassignment)" test, Scenario L (concurrent moves), and the 20-iteration "seating move vs competing assignment" repetition (§28).

## 23. Cancellation

Covered in §20. `AvailabilityOrchestrator.cancelWithCapacity`'s R1.5 integration point calls `SeatingOrchestrator.releaseActiveAssignmentForReservation` — a tx-scoped helper with no lock of its own (it reuses the reservation lock the caller already holds), directly satisfying assignment §27 ("reservation cancellation must leave zero active SeatingAssignments").

## 24. Authorization

Five new permissions (`domain/rules/StaffAuthorizationPolicy.ts`): `seating.view`, `seating.assign`, `seating.move`, `seating.release`, `resource.block` — the smallest set that covers every operation this slice implements, per the assignment's explicit "avoid unnecessary RBAC expansion." No separate `seating.markSeated`/`seating.preAssign` permission (same underlying action at a different point in time, §16). Distribution mirrors the existing reservation-permission pattern exactly: Owner gets everything; Manager/AssistantManager/Supervisor/ReservationAgent/Reception all get view/assign/move/release (matching their existing `reservation.create`/`modify`/`cancel` distribution); `resource.block` mirrors `capacity.settings.manage`'s own narrower distribution (Owner + Manager only). The exhaustive role-matrix test (`tests/domain/staff-authorization-policy.test.ts`) was extended with all 30 new role×permission assertions (6 roles × 5 permissions) — 101 tests total, all passing.

## 25. Audit

Not implemented as a separate mechanism in this slice — `SeatingAssignment` itself records `assignedBy`/`assignedAt`/`releasedBy`/`releasedAt` (direct attribution, matching `CAP-D01.01-R50`'s "the confirming actor shall be attributable" pattern) and `ResourceBlock` records `createdBy`/`createdAt`. A full `CAP-D08.01` Reservation Timeline integration (append a `TimelineEventAppended`-shaped event for every seating mutation) was scoped in the final architecture §21 as the eventual direction but was not built in this slice — `CAP-D08.01` itself has no engineering artifacts in this repository yet (confirmed absent, same as CAP-D03/CAP-D04 were before this assignment), so there is no existing timeline mechanism to integrate with. Flagged as a real, near-term gap, not silently dropped — see §33.

## 26. Legacy Compatibility

`Reservation.preferredArea`/`tableAssignment`/`arrivedAt` were **not modified**. `preferredArea` remains the authoritative guest-preference field (`R48`), read by `SeatingOrchestrator` only as the `requestedAreaId` input, never written back to. `tableAssignment` and `arrivedAt` are superseded in *role* by the new `SeatingAssignment` mechanism but the columns themselves are untouched — no historical reservation was backfilled, no value was fabricated, per the assignment's explicit "do not fabricate seating assignments for historical reservations." A legacy reservation simply has zero `SeatingAssignment` rows until one is created going forward, which is already the valid, R24-sanctioned default state for any reservation.

---

## 27. Real PostgreSQL Evidence

- `npm run typecheck` — clean throughout every step of this implementation.
- Seeded floor, verified directly against the live database (not just application code): 19 Sushi tables / 51 nominal seats, 4 Teppanyaki grills / 40 seats, **Table 14 confirmed absent** (`SELECT COUNT(*) FROM tables WHERE operational_label = 'Table 14'` → 0).
- `npm run floor-smoke-test` — **16/16 steps PASS** against the real `TEST_DATABASE_URL` instance (§32).
- Every scenario A–N (§20 assignment structure) proven against real PostgreSQL — see §32 acceptance matrix.

## 28. Concurrency Evidence

`tests/integration/floor-seating-concurrency.test.ts` — **9/9 tests passing**, two separate `PrismaClient` connections per race (the only way to get genuinely simultaneous PostgreSQL transactions, same discipline as `availability-concurrency.test.ts`):

- Scenario C (same Sushi table) — exactly one wins.
- Scenario E (shared Teppanyaki grill, disjoint seats) — both succeed.
- Scenario F (overclaim, 8-of-10 seats already taken) — refused, zero partial claims survive.
- Scenario K (walk-in vs. pre-assignment race) — exactly one wins.
- Scenario L (two staff move different reservations onto the same table) — exactly one wins.
- **20-iteration repetition, all four required races (assignment §35), 80 total race iterations, 0 integrity flakes**: same Sushi table, same Sushi bar resource, same Teppanyaki seat, seating-move-vs-competing-assignment.

**One real test-design bug found and fixed during development** (kept here as evidence of genuine, not rubber-stamped, testing): the first version of Scenario L used a 1-person bar seat as the contested destination for two 2-person parties — every attempt failed on `INSUFFICIENT_CAPACITY` regardless of the lock race, masking the actual lock-contention property the scenario was meant to prove. Fixed by using a 4-person table as the destination, isolating the resource-lock race from the unrelated capacity-sufficiency question.

## 29. Failure Injection

`tests/integration/floor-seating-failure-injection.test.ts` — **3/3 tests passing**:

1. Multi-resource assignment where the second resource conflicts — bypasses the application-level `SeatabilityEvaluator` check entirely (calls `FloorRepository.createAssignment` directly) specifically to prove the **database constraint itself**, not just the check in front of it, makes a partial multi-table assignment impossible.
2. A seating release that executes, followed by a forced, unrelated failure in the same transaction — proves the release does not survive rollback (`SeatingAssignment` remains `Assigned`, exactly its pre-transaction state).
3. `AvailabilityOrchestrator.cancelWithCapacity`'s real integration point, exercised against an already-cancelled reservation — proves the second, doomed cancel attempt neither corrupts nor resurrects anything.

## 30. Full Regression

```
npm run typecheck   -> clean
npm test             -> 34 test files, 412 tests, ALL PASSING
```

Up from 344 tests (post-R1.4 baseline) — the +68 delta: 30 new authorization-matrix assertions (5 permissions × 6 roles) + 13 pure `SeatabilityEvaluator` unit tests + 13 `floor-seating.test.ts` + 9 `floor-seating-concurrency.test.ts` + 3 `floor-seating-failure-injection.test.ts` = 68. **No previous invariant regressed** — every R1.1/R1.2/R1.3/R1.4 test file passes unchanged (the three Sushi-capacity-dependent test files were deliberately, precisely rescaled to 49, not simply left broken or loosened — §4).

## 31. Smoke Test

`npm run floor-smoke-test` — all 16 required steps (§38 of the assignment) executed against real PostgreSQL, real R1.2 authentication (`bootstrapOwner` + `LoginHandler`, not a stub), and the real `SeatingOrchestrator`/`FloorRepository` — **16/16 PASS**. Full transcript in §27.

## 32. Acceptance Matrix

| # | Scenario | Result |
|---|---|---|
| A | Sushi single table | PASS |
| B | Sushi combination | PASS |
| C | Sushi conflict (concurrent) | PASS |
| D | Sushi back-to-back | PASS |
| E | Shared Teppanyaki grill | PASS |
| F | Teppanyaki overclaim | PASS |
| G / H | Multi-grill party | PASS |
| I | ResourceBlock exclusion | PASS |
| J | No-Show (staff-confirmed only, no auto-release) | PASS |
| K | Walk-in race | PASS |
| L | Reassignment race | PASS |
| N | Table 14 absent | PASS |
| AC-R15-01…16 (prior architecture) + 17…24 (this report) | see final architecture §22/§23 | All exercised by the test suites above |

## 33. Remaining Risks

| # | Risk | Class |
|---|---|---|
| 1 | **Sushi 51 nominal seats (itemized) vs. 49 commercial capacity (mandated) vs. 45+4=49 (the assignment's own, inconsistent, proof-section arithmetic)** — a genuine, newly-found data discrepancy, architecturally inert today (CanSeat stays advisory) but should be resolved by the Chief Engineer/owner before this becomes commercially load-bearing | **P1** |
| 2 | **Teppanyaki 24-person preferred block vs. 20 physical seats at E+F** — carried forward, unresolved, from the final architecture report | **P1** |
| 3 | No `CAP-D08.01` Timeline/audit-event integration for seating mutations yet — `SeatingAssignment`'s own attribution fields are real but no cross-capability audit trail exists (§25) | **P2** |
| 4 | No HTTP API endpoints for seating exist yet — this slice is domain/application/infrastructure-complete but has no REST surface; correctly out of this assignment's own scope (no API-endpoint section was requested), flagged for the next gate | **P2** |
| 5 | `PreferredResourceBlock` is read by nothing — purely descriptive metadata today; if a future floor UI wants to *suggest* the E+F pairing to staff, that read path doesn't exist yet | **P3** |
| 6 | The `btree_gist` extension is now a real, if standard, PostgreSQL dependency — confirmed available locally (superuser-equivalent `CREATE EXTENSION` succeeded), unconfirmed for any future production hosting environment | **P2** |

## 34. Registry Follow-Up

Both divergences from the R1.5 architecture reports are unchanged and still correctly unedited (`capability-map.md` remains stale/inconsistent; `CAP-D02.03`'s registered-but-unrealized dependency on `CAP-D03.03`/`CAP-D04.01`/`.02` remains deliberately unrealized, now with a THIRD piece of evidence supporting that choice — the Sushi 51-vs-49 discrepancy itself demonstrates exactly why keeping `CanAccept`/`CanSeat` structurally independent was correct: had they been merged, this data inconsistency would already be a live commercial-capacity bug, not a tracked, advisory finding). No registry edit was made, per every prior instruction on this point.

## 35. Engineering Recommendation

Ready for the next gate: (1) resolve the two flagged numeric discrepancies with the owner (§33 #1/#2); (2) HTTP API endpoints for seating (assign/move/markSeated/releaseNoShow/block), mirroring `api/app.ts`'s existing reservation-endpoint pattern; (3) `CAP-D08.01` Timeline integration for seating audit events; (4) a real Floor UI consuming `FloorReadModel.ts`. None of these block declaring R1.5's domain/application/infrastructure layer complete and tested.

---

## 36. Commit / Working Tree State

29 files changed (14 modified, 15 new — see the commit itself for the exact list). No backup artifact, database dump, credential, or unrelated file included — verified directly before staging (§ commit policy, Final Response).

---

**STOP CONDITION REACHED.** Implementation, schema/migration, real-PostgreSQL proof, concurrency proof (including 80 zero-flake repetition iterations), failure injection, full regression (412/412), local smoke test (16/16), and this report are complete. No push. No deploy. No Guestplan changes. No website changes. Awaiting the Chief Engineer's R1.5 Final Implementation Gate before proceeding to HTTP API endpoints or any further work.

---

## Addendum — Teppanyaki Self-Service Pacing Correction (superseding, appended, dated after the original report above)

**This addendum records a later, separate Chief Engineer/owner instruction. Nothing above this line (§1–§36 and the original STOP CONDITION notice) has been edited, reworded, or removed — every finding, number, and risk recorded above reflects exactly what was true and known at the time this report was originally written. Where the correction below supersedes something stated above, that supersession is recorded here, not by rewriting the original text.**

### What changed

**"OWNER DECISION — TEPPANYAKI SELF-SERVICE PACING POLICY"** superseded the unresolved 70–80% Teppanyaki self-service threshold this report's §33 Risk #2 had flagged, and separately withdrew the E+F 24-person preferred block this report's §11/§33 Risk #2 had also flagged as arithmetically inconsistent (20 physical seats vs. a stated 24-person preference).

- **§33 Risk #2 (24-vs-20 seats) is now RESOLVED, not merely tracked**: the owner withdrew the 24-person figure outright rather than resolving the arithmetic gap. `domain/floor/PreferredResourceBlock.ts`'s `PREFERRED_RESOURCE_BLOCKS` constant is now an empty array — the mechanism is kept (for any future, correctly-specified preferred block) but the withdrawn entry itself was removed from code, not merely documented as stale. E and F remain ordinary 10-seat `Table` rows, 20 seats together, entirely unchanged, claimable via the same multi-grill mechanism Scenario G/H already proved.
- **A new, distinct owner decision — the Teppanyaki self-service pacing ceiling** — is now implemented: `domain/availability/TeppanyakiSelfServicePacing.ts`, a new pure function (`evaluateTeppanyakiSelfServicePacing`) mirroring `BookingPolicy.ts`'s own existing style exactly. `TEPPANYAKI_SELF_SERVICE_CEILING = 32`, computed as `Math.floor(40 * 0.8)`, not hardcoded, so the "32 is 80% of 40" relationship stays self-evidently correct.
- **`AvailabilityOrchestrator.createWithCapacity` and `modifyWithCapacity`** both call the new evaluator, at the same point (immediately after confirming actual physical capacity — 40 — is not exceeded, immediately before proceeding to write). Ordering is deliberate and load-bearing: a self-service request that would exceed 40 is `CAPACITY_EXHAUSTED`, exactly as before this correction, **never** silently downgraded to `ROUTE_TO_STAFF`; a self-service request between 33 and 40 (inclusive of neither bound issue at exactly 32, which is allowed) is now `BOOKING_POLICY_REJECTED` with `policy.type: "ROUTE_TO_STAFF"` — reusing the exact same outcome shape party-size routing (9+) already used, distinguished internally by a different `reason` string (proven by a dedicated unit test asserting the two reason strings never collide).
- **Three concepts kept structurally separate, per the owner's own explicit instruction**: physical capacity (`CapacityPool.ts`, untouched, still 40), the new self-service pacing ceiling (`TeppanyakiSelfServicePacing.ts`, entirely new file, 32), and physical seating (`domain/floor/`, entirely unaware this ceiling exists — `SeatabilityEvaluator`/`SeatingOrchestrator` do not import or reference it).
- **Sushi is provably unaffected**: `evaluateTeppanyakiSelfServicePacing` returns `ALLOWED` unconditionally for any pool other than `"Teppanyaki"` — proven directly by T8's two dedicated tests (a Sushi request past what 80% of Sushi's own capacity would be, and a Sushi request at exactly 49, both correctly never routed to staff on pacing grounds).

### Test evidence (T1–T8, assignment §8)

- `tests/integration/teppanyaki-self-service-pacing.test.ts` — **10 tests**, real PostgreSQL, real overlapping `CapacityCommitment` intervals (an existing commitment seeded with the exact same interval as the request under test, per the assignment's explicit "use overlapping intervals, not merely reservation totals for the day" instruction) — T1 through T7 exactly as specified, plus two T8 sub-tests (Sushi past its own 80%-equivalent, and Sushi at exact physical capacity).
- `tests/domain/teppanyaki-self-service-pacing.test.ts` — **6 tests**, pure-function unit coverage of `evaluateTeppanyakiSelfServicePacing` mirroring `tests/domain/booking-policy.test.ts`'s own style (no database) — boundary-exact ALLOWED/ROUTE_TO_STAFF, staff exemption, Sushi no-op, and the distinguishable-reason-string assertion.

### Full regression (post-correction)

```
npm run typecheck   -> clean
npm test             -> 36 test files, 428 tests, ALL PASSING
```

Up from 412 (this report's own original §30 figure) — the +16 delta is exactly the 10 integration + 6 unit pacing tests above. **No previous invariant regressed** — every R1.1–R1.5 test from before this correction passes unchanged.

### Files touched by this correction

New: `domain/availability/TeppanyakiSelfServicePacing.ts`, `tests/integration/teppanyaki-self-service-pacing.test.ts`, `tests/domain/teppanyaki-self-service-pacing.test.ts`. Modified: `application/availability/AvailabilityOrchestrator.ts` (two call sites, `createWithCapacity`/`modifyWithCapacity`), `domain/floor/PreferredResourceBlock.ts` (24-person entry removed, mechanism preserved). No Prisma schema change, no new migration — this correction is pure application/domain logic plus one static-config change, touching no persisted shape.

**STOP CONDITION REACHED (correction).** No push. No deploy. No Guestplan changes. No website changes. One bounded local commit follows this addendum. Awaiting Chief Engineer review.

---

## Addendum 2 — Final Sushi Capacity Reconciliation (superseding, appended, dated after both entries above)

**This addendum records a later, separate Chief Engineer/owner instruction ("CHIEF ENGINEER CORRECTION — R1.5 — Final Sushi Capacity Reconciliation"). Nothing above this line — §1–§36, the original STOP CONDITION notice, and Addendum 1 (Teppanyaki Self-Service Pacing Correction) — has been edited, reworded, or removed. Every finding, number, and risk recorded above reflects exactly what was true and known at the time it was written. Where the correction below supersedes something stated above, that supersession is recorded here, not by rewriting the original text.**

### What changed

This report's own §33 Risk #1 flagged, correctly, a genuine numeric discrepancy: the itemized Sushi floor inventory (15 numbered tables + 4 bar positions) sums to **51**, while `CAP-D02.03`'s live `CapacityPool.ts` commercial capacity had been set to **49** — itself the product of an earlier, even more incomplete calculation of **47** (missing the four bar positions) during an initial R1.5 architecture-investigation pass. Per this program's standing discipline, none of these conflicting figures was ever silently reconciled — each was flagged and left for explicit owner resolution.

The owner has now explicitly resolved it, with a fully itemized, table-by-table inventory:

- Table 1=4, Table 2=4, Table 3=4, Table 4=4, Table 5=2, Table 6=2, Table 7=2, Table 8=4, Table 9=4, Table 10=5, Table 11=2, Table 12=4, Table 13=2, Table 14=DOES NOT EXIST, Table 15=2, Table 16=2, Bar 17=1, Bar 18=1, Bar 19=1, Bar 20=1.
- Numbered tables total: 47. Bar total: 4. **AUTHORITATIVE SUSHI PHYSICAL CAPACITY: 51.**

**History of the three superseded values, for the record:**
- **47** — an earlier, partial calculation from an R1.5 architecture-investigation pass, computed from an INCOMPLETE inventory that omitted the four one-person bar positions. Never owner-confirmed, never live in `CapacityPool.ts`.
- **49** — a subsequent reconciliation attempt, itself an INCORRECT arithmetic read of the owner's own itemized table list (misread as 45+4=49 rather than the correct 47+4=51). This was briefly live in `CapacityPool.ts` as `CAP-D02.03`'s Sushi commercial capacity — this is the value this report's §4/§33 originally, correctly, flagged as inconsistent with the itemized inventory, but the flagged inconsistency's own resolution (49) was itself wrong.
- **51** — the final, owner-confirmed authoritative figure. Both the physical inventory (`infrastructure/floor/floorSeedData.ts`, unchanged throughout every prior pass — the table-by-table data was never wrong, only the earlier arithmetic reads of it) and `CAP-D02.03`'s Sushi commercial capacity (`domain/availability/CapacityPool.ts`) now agree at 51.

**No historical evidence was rewritten.** §33 Risk #1 above still reads exactly as originally written, describing the discrepancy as it stood at the time; this addendum records its resolution without altering that original text.

### What was NOT changed (explicit instruction)

Floor & Seating was not redesigned. Teppanyaki pacing was not modified again — `domain/availability/TeppanyakiSelfServicePacing.ts` and Addendum 1's decisions (physical capacity 40, self-service ceiling 32) are untouched by this correction. The E+F preferred-block withdrawal from Addendum 1 remains withdrawn.

### Test evidence (T1–T5, correction §3/§4)

New file `tests/integration/sushi-capacity-reconciliation.test.ts` — **6 tests**, real PostgreSQL:
- **T1** — existing Sushi occupancy 50 (real overlapping `CapacityCommitment` interval) + request 1 → `CREATED`.
- **T2** — existing Sushi occupancy 51 + request 1 → `CAPACITY_UNAVAILABLE` / `CAPACITY_EXHAUSTED`, `capacity: 51`.
- **T3** — Teppanyaki remains: physical capacity 40 (`CAPACITY_POOLS.Teppanyaki.maximumCapacity`), self-service ceiling 32 (`TEPPANYAKI_SELF_SERVICE_CEILING`) — pure assertion, unaffected by this correction.
- **T4** — Table 14 remains absent from the seeded floor (`prisma.table.findFirst({ operationalLabel: "Table 14" })` → `null`).
- **T5** — the permanent drift-prevention check: the seeded Sushi `Table` rows' `nominalCapacity` sum, queried live from real PostgreSQL, equals `CAPACITY_POOLS.Sushi.maximumCapacity` (51). A companion Teppanyaki control test proves the Teppanyaki physical sum (40) is likewise consistent, and explicitly asserts it is NOT equal to the self-service ceiling (32) — the two concepts stay structurally distinct, never summed together, per the correction's own §4 instruction.

Every other Sushi-capacity-dependent test across the suite (`availability-concurrency.test.ts`, `availability-create.test.ts`, `tests/domain/availability-evaluator.test.ts`) was rescaled from 49 to 51, preserving each test's original regression-detection intent — most notably the "Modify vs Create" concurrency test, whose boundary numbers were re-derived (40 initial / 45 modify-target / 15 create) so the outcome remains fully deterministic regardless of race order under the new capacity, rather than merely asserting "exactly one rejection."

### Full regression (post-correction)

```
npm run typecheck   -> clean
npm test             -> 37 test files, 434 tests, ALL PASSING
```

Up from 428 (Addendum 1's own figure) — the +6 delta is exactly the new `sushi-capacity-reconciliation.test.ts` file. **No previous invariant regressed** — every R1.1–R1.5 test, including both prior corrections, passes unchanged (with Sushi-capacity-dependent assertions correctly rescaled to 51, not loosened).

### Files touched by this correction

Modified: `domain/availability/CapacityPool.ts` (Sushi `maximumCapacity`: 49 → 51, header comment rewritten to document the full 60/47/49/51 history), `infrastructure/floor/floorSeedData.ts` (header comment only — marks the discrepancy RESOLVED; the itemized table data itself was never wrong and is unchanged), `tests/integration/availability-concurrency.test.ts`, `tests/integration/availability-create.test.ts`, `tests/domain/availability-evaluator.test.ts` (Sushi-capacity-dependent assertions rescaled 49 → 51). New: `tests/integration/sushi-capacity-reconciliation.test.ts` (T1–T5). No Prisma schema change, no new migration — this correction is a static-config value change plus test rescaling, touching no persisted shape.

**STOP CONDITION REACHED (correction 2).** No push. No deploy. No Guestplan changes. No website changes. One bounded local commit follows this addendum. Awaiting Chief Engineer review.
