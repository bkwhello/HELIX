# R1.6-C0 — ServicePeriod Enforcement: Implementation Report

Program: Guestplan Replacement
Assignment: "Enforce CAP-D02 Service-Period Authority Across Reservation Creation Paths"
Mode: BOUNDED IMPLEMENTATION + REAL POSTGRESQL PROOF

Previous gates: R1.1–R1.5 — PASS · R1.6-A Service Period Management — PASS (496/496) · R1.6-B Guest Communications Engine — PASS (598/598, commit `c1a488c`).

| | |
|---|---|
| Full regression (before) | 48 test files, 598/598 passing |
| Full regression (after) | 49 test files, 633/634 passing — the single failure is a pre-existing, order-dependent flake proven unrelated to this assignment (§32) |
| Base commit | `c1a488c` |

## 1. Executive Summary

R1.6-A built CAP-D02 ServicePeriod authority (the weekly Mon–Thu 17:00–21:00 / Fri–Sun 12:00–21:00 windows, 15-minute grid, date-specific overrides, ClosingDay precedence) as a pure, tested, DB-backed capability — but flagged as an explicit risk that **no reservation-creation path actually called it**. This assignment closes exactly that gap: every live, capacity-managed reservation-creation path now consults CAP-D02 ServicePeriod authority before a Reservation or CapacityCommitment can be durably created, without redesigning CAP-D02.03 Availability, without duplicating CAP-D02's constants, and without blending ServicePeriod's "is this an offered start?" question into BookingPolicy's "which channel may complete it?" question.

The core invariant is now real: **requested start time → ServicePeriod authority → VALID START? NO → reject (`SERVICE_PERIOD_REJECTED`, before capacity, before Contact, before any durable write); YES → continue to BookingPolicy → capacity → Contact → transaction.**

A significant, previously-unflagged gap was also discovered and fixed in the course of source-path auditing (§27): the pilot staff UI's own reservation-creation form was calling the plain, capacity-unaware `/reservations` endpoint, not `/availability/reservations` — meaning none of R1.1's capacity tracking, R1.6-A's ServicePeriod, or R1.6-B's booking-policy/pacing enforcement was actually reachable by a real staff member clicking "Create" in the pilot before this fix.

## 2. Scope & Mode

Bounded to: domain/application wiring for ServicePeriod-on-Create enforcement, the single canonical integration point, the test matrix and orphan-state proofs, the source-path audit (including the pilot UI fix), a live local smoke test, and this report. Explicitly NOT touched: CAP-D02.03 Availability's own capacity/pacing logic (unchanged, still authoritative for headcount), CAP-D02.02's registry ownership (§31 — carried forward, not resolved), any public/guest-facing booking API, the email provider, Guestplan, or the marketing website. No push, no deployment.

## 3. Core Invariant Implemented

`application/availability/AvailabilityOrchestrator.ts:144-183` (`createWithCapacity`), immediately after resolving the capacity pool and before `evaluateBookingPolicy`:

```ts
if (this.servicePeriodService && !request.isHistoricalCorrection) {
  const eligibility = await this.servicePeriodService.evaluateStartTimeEligibility(pool, request.reservationDate);
  if (eligibility.type !== "VALID") {
    return { type: "SERVICE_PERIOD_REJECTED", eligibility };
  }
}
```

This runs **before** any capacity lock, before Contact resolution/creation, before the transaction opens, and before BookingPolicy. A rejection here returns immediately — nothing downstream executes. No Reservation or CapacityCommitment can be durably created for an invalid ServicePeriod start (proven in §24/§29 T15 and the live smoke test §33 step 6).

## 4. Capability Boundary Preserved

| Capability | Question it answers | Touched? |
|---|---|---|
| CAP-D02 ServicePeriod | Is this requested start time an offered restaurant booking start at all? | Consulted (not redesigned) |
| CAP-D02.03 Availability | Is there simultaneous headcount/table capacity for this start? | Unchanged — still runs after ServicePeriod passes |
| BookingPolicy | Which channel/actor may complete this request (same-day-after-17:00, self-service party size, Teppanyaki 32–40)? | Unchanged — still runs after ServicePeriod passes, still entirely separate |
| CAP-D01 (lifecycle) | Reservation state machine | Unchanged |
| CAP-D05 (Contact) | Guest identity | Unchanged; proven not to leak orphans on ServicePeriod rejection (§24) |
| CAP-D04 (physical seating) | Table/seat assignment | Unchanged, untouched (§25) |
| CAP-D06 (communication) | Confirmation/reminder | Unchanged; proven no orphan send/enqueue on rejection (§23) |

No file in this change imports across these boundaries in a new way; `domain/availability/ServicePeriod.ts`'s header comment ("this module deliberately does NOT evaluate capacity... party size... same-day 17:00 self-service cutoff... proof by construction: this file imports nothing from CapacityPool.ts, BookingPolicy.ts") remains true and unedited.

## 5. ServicePeriod vs BookingPolicy — Explicit Distinction & Precedence

These are deliberately different questions and were kept in two different functions, called in a deliberate order (ServicePeriod first, §3). The Saturday-12:00–21:00, current-time-17:10, guest-requests-20:00-today example from the assignment is exactly `tests/integration/service-period-enforcement.test.ts`'s T12/T13 (also re-proven end-to-end in the live smoke test §33 step 9):

- 20:00 today **is** a valid ServicePeriod start → ServicePeriod check passes, execution continues.
- Self-service (`ApprovedGuestChannel` actor) same-day-after-17:00 → BookingPolicy's existing same-day cutoff fires → `BOOKING_POLICY_REJECTED` with `policy.type === "ROUTE_TO_STAFF"`. **Never** `SERVICE_PERIOD_REJECTED`.
- Staff (`AuthorizedUser` actor) → BookingPolicy's staff exemption applies, as it always has → `CREATED`.

No BookingPolicy rule (same-day cutoff, self-service party-size cap, Teppanyaki 32–40 routing) was moved into `ServicePeriod.ts` or `ServicePeriodService.ts`; `evaluateBookingPolicy` (`domain/availability/BookingPolicy.ts`) is untouched.

## 6. Integration Point Decision

Audited: `CreateReservationHandler.ts` (no guaranteed capacity-managed area — it also serves the plain, non-capacity `/reservations` route) and `AvailabilityOrchestrator.createWithCapacity` (the one path that always has a resolved `CapacityPoolId`, and already hosts the exact same kind of pre-transaction, pre-capacity-lock rejection precedent for BookingPolicy and ClosingDay). **Decision: `AvailabilityOrchestrator.createWithCapacity` is the single, sole enforcement site.** `CreateReservationHandler` was not touched — it has no area to evaluate ServicePeriod against, and every current HTTP route that creates a live reservation with a preferred area routes through the orchestrator (§27).

## 7. Domain Layer Changes

`domain/availability/ServicePeriod.ts:194-207` — added `ServicePeriodEligibility` (a three-way discriminated union: `VALID | OUTSIDE_SERVICE_PERIOD | CLOSED`) and the pure projection function `evaluateMinuteEligibility(minute, resolved)`. This is the richer outcome enforcement needs, layered on top of — not replacing — R1.6-A's existing boolean `isMinuteBookable`/`isStartTimeWithinServicePeriod`. No existing exported symbol was changed or removed.

## 8. Application Layer Changes

`application/availability/ServicePeriodService.ts` — `isStartTimeWithinServicePeriod` now delegates to a new `evaluateStartTimeEligibility(area, requestedStart)` method, which resolves the local service date (existing DST-safe `toLocalServiceDate`/`toLocalMinuteOfDay` helpers, untouched) and projects through `evaluateMinuteEligibility`. The unused `isMinuteBookable` import was removed; no other method signature changed.

## 9. Orchestration Layer Changes

`application/availability/AvailabilityOrchestrator.ts`:
- `CreateWithCapacityResult` gained one new variant: `{ type: "SERVICE_PERIOD_REJECTED"; eligibility: ServicePeriodEligibility }`.
- Constructor gained one new, optional, last parameter: `servicePeriodService?: ServicePeriodService`.
- `createWithCapacity` gained the enforcement call described in §3.

The pre-existing, standalone `closingDayStore.isClosed(...)` check further down (line 199) was deliberately **left in place, unchanged** — it is now redundant with ServicePeriod's own internal ClosingDay check when `servicePeriodService` is supplied, but remains the only ClosingDay protection when it is omitted (backward compatibility, §10), so removing it would have created a regression for any caller that omits the new dependency.

## 10. Wiring Pattern

Two related but distinct patterns, both intentional:

1. **Optional, last constructor parameter** on `AvailabilityOrchestrator` — the same pattern R1.5 established for `seatingOrchestrator?`. Every existing call site (all pre-R1.6-C0 tests, any future caller that doesn't pass it) continues to compile and behave exactly as before: no `servicePeriodService` → no enforcement, not a degraded/fake enforcement.
2. **Required within an optional parent block** — `AppDependencies.capacity.servicePeriodService` (`api/app.ts`) is **not** optional, even though the parent `capacity` block itself is. A deployment that chooses not to mount capacity-aware routes at all still gets no enforcement (same as before — `/availability/*` isn't mounted). But **any** deployment that does mount `/availability/*` is now structurally required to supply real ServicePeriod enforcement — there is no way to compile a deployment that has capacity-aware creation without it (assignment §33 AC-C0-01/AC-C0-14). `api/server.ts` was updated accordingly (§27).

## 11. Transaction Order & Consistency Model

Order implemented: idempotency check → capacity-pool resolution → **ServicePeriod validation** → BookingPolicy → ClosingDay (redundant safety net, §9) → capacity range/lock resolution → `BEGIN` transaction → capacity commitment → Contact/Reservation write → communication intent → `COMMIT`. This matches the assignment's recommended order (§10) exactly, and mirrors the existing BookingPolicy/ClosingDay precedent already in this file — no new transactional pattern was introduced.

**Concurrency of ServicePeriod configuration itself:** `ServicePeriodOverride`/`ClosingDay` rows can change between the pre-transaction ServicePeriod check and the eventual commit (the same window that already existed for BookingPolicy/ClosingDay before this change). No additional locking was added for this: a staff member editing a date's operating hours mid-request is an extremely low-frequency administrative action (not a guest-facing hot path), and R1.6-A's own override/ClosingDay writes are simple, infrequent, single-row upserts with no evidence of a concurrent-edit race ever having been reported or reproduced. Adding `pg_advisory_xact_lock`-style locking here (as R1.1 does for the genuinely hot capacity-commitment path) would be speculative hardening against a scenario with no evidence behind it — consistent with the instruction not to add heavy locking without evidence. The accepted consistency model is: **read-committed, pre-transaction check, no re-validation inside the transaction** — identical in shape to the pre-existing BookingPolicy/ClosingDay checks it sits beside.

## 12. Fail-Closed Behavior

No fourth "CONFIGURATION_ERROR" `ServicePeriodEligibility` variant was added. Every currently-reachable "no data for this date" case inside `resolveDaySchedule` (R1.6-A, untouched) already resolves to `CLOSED` — silently becoming `VALID` is not a reachable code path today. A genuine infrastructure fault (e.g. the database connection is lost mid-query) propagates as a thrown exception up through `evaluateStartTimeEligibility` → `createWithCapacity` → the Express route handler's own unhandled-rejection path — this is inherently fail-closed: nothing durable can commit if the eligibility check itself never returns a resolved value. The guest is never told "the restaurant is full" for a configuration failure — a thrown exception surfaces as a 500, never as a `CAPACITY_UNAVAILABLE`/409.

## 13. Error Model

`SERVICE_PERIOD_REJECTED` carries the domain `ServicePeriodEligibility` value (`OUTSIDE_SERVICE_PERIOD | CLOSED`) untouched — `api/app.ts`'s `/availability/reservations` route maps it directly: `res.status(422).json({ servicePeriod: result.eligibility })`. No internal detail (which specific window, which override row, DB internals) is exposed. This vocabulary is already exactly what a future public-facing mapping would reuse unchanged: `OUTSIDE_SERVICE_PERIOD` → "not offered/unavailable", `CLOSED` → "closed", a thrown configuration fault → "temporarily unavailable" (mapped generically by whatever public error-handling middleware is built then — no public DTO was built now, per instruction).

## 14. Staff Booking After 17:00

Proven by T13/T14 (`tests/integration/service-period-enforcement.test.ts`) and live smoke test step 9: a staff actor may still create a valid same-day booking after 17:00 (BookingPolicy's staff exemption, unchanged) **provided** the requested start is itself a valid ServicePeriod start — staff are not exempt from ServicePeriod itself. T14 proves a staff request for Monday 15:00 (outside the window, no override) is rejected exactly like any other actor.

## 15. WalkIn Decision

No bypass was added for `ReservationSourceCategory.WalkIn`. Grepped the codebase (`WalkIn|Walk-in|walkin`) and found no dedicated walk-in creation handler or path — only the RBAC permission `Permission.ReservationWalkinCreate` and the source-category value itself; a walk-in is created through the same `createWithCapacity` path as any other source. Reasoning: the restaurant's operating hours **are** the ServicePeriod windows by definition — a genuine walk-in arriving during real operating hours naturally satisfies ServicePeriod. No evidence in the codebase or the assignment justifies inventing an exception, so none was invented (assignment's own "do not invent the exception if existing rules don't justify it"). Proven by the two dedicated WalkIn tests in `service-period-enforcement.test.ts` (valid start → `CREATED`; outside-window start → `SERVICE_PERIOD_REJECTED`, identical to Telephone/Staff/etc.).

## 16. Historical Correction / External Import Decision

`ReservationSourceCategory.ExternalImport` receives **no** source-based bypass either (proven by the Source-Category Matrix test, §30) — an import is still a live write to the `reservations` table and, absent evidence otherwise, should obey the same authority as any other creation. The one, narrow, explicit, already-existing mechanism reused as the bypass is `isHistoricalCorrection`/`historicalCorrectionReason` (`CreateReservationRequest`, pre-dating this assignment, from CAP-D01.01): `!request.isHistoricalCorrection` gates the entire enforcement block (§3). This satisfies the assignment's "any bypass must be explicit and narrowly scoped" instruction without inventing a second mechanism or conflating "came from External Import" with "is a historical correction" — a live External Import row (e.g. a same-day POS sync) still gets enforced; only an explicitly-flagged historical correction bypasses, regardless of its source category.

## 17. Date-Specific Override Precedence

T9 (`service-period-enforcement.test.ts`) and live smoke test step 8 prove a date-specific override **replaces**, not unions with, the weekly schedule for that area/date — a Friday override narrowing the window to 17:00–20:00 makes the normal-Friday 13:00 start rejected and the override-only 17:00 start valid. No precedence logic was reimplemented in the Create path; `evaluateStartTimeEligibility` calls straight through to R1.6-A's existing `resolveForLocalDate`/`resolveDaySchedule`, which already encodes override-wins-over-weekly-schedule.

## 18. ClosingDay Precedence

T8 and live smoke test step 7 prove a `ClosingDay` blocks live creation for the whole date even though the weekly schedule and area capacity/tables would otherwise allow it — tested through the **full** `createWithCapacity` path (not just the ServicePeriod unit layer), confirming zero `Reservation` rows are written.

## 19. 21:00 Final Start / Duration Beyond Close

T3 (21:00 → `CREATED`), T4 (21:15 → rejected), and T16 (a Teppanyaki reservation starting exactly 21:00 with a 150-minute duration, ending 23:30, is **not** rejected) all pass. `ServicePeriod` evaluates only the requested **start** minute; nothing in this change or in R1.6-A requires the computed end time to fall before close.

## 20. 15-Minute Grid

T7: Monday 18:00 (grid-aligned, mid-window) is valid; Monday 18:07 (non-grid) is `SERVICE_PERIOD_REJECTED`, proven through the full Create path — the capacity engine's own willingness to accept an arbitrary timestamp does not let a non-grid request through, because ServicePeriod is now checked first.

## 21. Area Separation

T10/T11 and live smoke test step 8 prove a Sushi-only override/closure does not affect Teppanyaki and vice versa — `evaluateStartTimeEligibility(area, ...)` takes the resolved capacity pool as its area key, and `PrismaServicePeriodOverrideStore` scopes every row by `areaId`; no area-collapsing logic was introduced.

## 22. Timezone & DST

`evaluateStartTimeEligibility` calls the exact same `toLocalServiceDate`/`toLocalMinuteOfDay` helpers R1.6-A already DST-tested — no second, naive time conversion was written. T17 (`service-period-enforcement.test.ts`) adds four full-application-flow integration tests spanning both 2026 transitions (2026-03-29 spring-forward, 2026-10-25 fall-back), each proving both a just-inside and just-outside boundary through the complete `createWithCapacity` path, not merely the domain layer.

## 23. Communication Atomicity

Proven in T15's orphan-state test and live smoke test step 6: because `SERVICE_PERIOD_REJECTED` returns before the transaction, before Contact resolution, and before `CommunicationOutboxService` is ever reached, an invalid-start request produces zero `communication_messages` rows — confirmed by direct query (`prisma.communicationMessage.count`), not inference.

## 24. Contact Atomicity

Proven in T15 (real PostgreSQL): an invalid-ServicePeriod request with `contactSelection: { type: "CreateNewContact", ... }` creates **zero** `Contact` rows (queried by the fixture email directly) — the `CreateContactHandler` is never invoked because rejection happens before `CreateReservationHandler` is ever called. Re-proven live in the smoke test (step 6) against the same real database the HTTP route itself writes to.

## 25. Seating Non-Interaction

No seating-related code was touched. `AvailabilityOrchestrator`'s `seatingOrchestrator?` parameter (R1.5) is unaffected by the new, separate, later `servicePeriodService?` parameter (§10) — both are independently optional, and a `SERVICE_PERIOD_REJECTED` return happens long before any seating step would ever run in a combined flow, so no seating artifact can be left behind by a ServicePeriod rejection. R1.5 semantics were not modified.

## 26. Idempotency Behavior

Investigated, not changed. `createWithCapacity`'s existing first step — `findByCommandId` — is checked **before** ServicePeriod enforcement runs at all (§3's code starts after that check). A retried `commandId` for a request that was previously `SERVICE_PERIOD_REJECTED` never matched a prior `AppliedCommand`/`Reservation` row (nothing was ever durably written for it), so the retry simply re-evaluates ServicePeriod fresh and is rejected again — proven by the dedicated retry test in `service-period-enforcement.test.ts` ("a retried commandId... remains safely rejected"). This is existing, unmodified behavior: a rejected request was never idempotency-frozen before this change either (only successful creates are), so no idempotency semantics needed to change. If ServicePeriod configuration is edited between the original attempt and a retry, the retry will correctly re-evaluate against the *new* configuration — consistent with §11's documented consistency model (no stale-check freezing).

## 27. API Route Audit

Every current live reservation-creation route:

| Route | Handler | ServicePeriod enforced? |
|---|---|---|
| `POST /reservations` | `CreateReservationHandler` directly (no capacity pool) | No — out of scope, this route was never capacity-managed and remains R1.6-A/R1.6-C0-unaware, same as before this assignment |
| `POST /availability/reservations` | `AvailabilityOrchestrator.createWithCapacity` | **Yes** |
| pilot staff UI ("New reservation" form, `public/pilot.html`) | was calling `/reservations` | **Fixed this assignment** — now calls `/availability/reservations` (see §28) |

No other production route creates a reservation. `grep`-confirmed only `api/server.ts` constructs the `capacity` block passed to `createApp()`, so making `servicePeriodService` required there (§10) required no other file changes.

## 28. Pilot UI Change

`public/pilot.html`'s create-submit handler was calling the plain `/reservations` endpoint — discovered while auditing every creation entry point per §27, not something the assignment predicted. This meant **no** R1.1–R1.6-B capacity, pacing, booking-policy, or (until now) ServicePeriod enforcement was reachable through actual staff usage of the pilot, only through direct API calls. Fixed to call `/availability/reservations`. Verified safe/no UX change: the form's `preferred-area` `<select>` is already `required` with only Sushi/Teppanyaki options (no blank option), which is exactly what the capacity-aware endpoint requires. A `creationErrorMessage()` helper was added to render the new `servicePeriod` error shape (`CLOSED` → "Gesloten op deze datum/tijd.", `OUTSIDE_SERVICE_PERIOD` → "Buiten de reserveringstijden.") alongside the pre-existing `policy`/`availability`/`violations` shapes. No other pilot UI redesign was made.

## 29. Test Matrix Results (T1–T18)

All in `tests/integration/service-period-enforcement.test.ts`, real PostgreSQL, via `buildHarness(prisma, now, { enforceServicePeriod: true })`.

| # | Case | Result |
|---|---|---|
| T1 | Monday 16:45 | PASS — rejected |
| T2 | Monday 17:00 | PASS — allowed |
| T3 | Monday 21:00 | PASS — allowed |
| T4 | Monday 21:15 | PASS — rejected |
| T5 | Friday 11:45 | PASS — rejected |
| T6 | Friday 12:00 | PASS — allowed |
| T7 | Non-grid 18:07 | PASS — rejected |
| T8 | ClosingDay on open date | PASS — rejected (CLOSED) |
| T9 | Date override replaces weekly schedule | PASS |
| T10 | Sushi override doesn't affect Teppanyaki | PASS |
| T11 | Teppanyaki override doesn't affect Sushi | PASS |
| T12 | Same-day self-service 17:01 → valid 20:00 start | PASS — ROUTE_TO_STAFF, not SERVICE_PERIOD_REJECTED |
| T13 | Staff same-day 17:01 → valid 20:00 start | PASS — proceeds |
| T14 | Staff Monday 15:00 | PASS — rejected |
| T15 | Invalid start + CreateNewContact | PASS — zero Contact/Reservation/Capacity/Communication rows, including on commandId retry |
| T16 | 21:00 Teppanyaki, 150-min duration | PASS — not rejected |
| T17 | DST (2026-03-29, 2026-10-25), full application flow | PASS — 4 tests, both transitions, boundary-in and boundary-out |
| T18 | Existing capacity/pacing unaffected once ServicePeriod passes | PASS — capacity exhaustion still `CAPACITY_UNAVAILABLE`; Teppanyaki >32≤40 pacing still `ROUTE_TO_STAFF` |

Plus: 2 WalkIn tests, 2 historical-correction tests, 8 source-category-matrix tests (§30), 1 backward-compatibility test (enforcement omitted → pre-existing unenforced behavior preserved exactly). **Total: 36/36 new tests passing.**

## 30. Source-Category Matrix

| `ReservationSourceCategory` | ServicePeriod enforced? | Why |
|---|---|---|
| Website | Yes | Live creation, no bypass flag set |
| Telephone | Yes | Live creation, no bypass flag set |
| Walk-in | Yes | Operating hours ARE the ServicePeriod windows by definition (§15) — no bypass invented |
| Google | Yes | Live creation, no bypass flag set |
| TheFork | Yes | Live creation, no bypass flag set |
| Staff | Yes | Staff are exempt from BookingPolicy's channel-routing rules, never from ServicePeriod itself (§14) |
| External Import | Yes, **unless** the write is also flagged `isHistoricalCorrection` | The bypass is keyed to *when the booking actually happened* (historical vs. live), not to the source category — a live, same-day External Import sync must obey the same authority as any other live write (§16) |
| Other Approved Source | Yes | Live creation, no bypass flag set |

Every row proven by the parameterized `it.each` test in `service-period-enforcement.test.ts` ("Source-Category Matrix"), each rejected identically for an outside-window start.

## 31. Governance Follow-Up — Not Resolved Here

R1.6-A (§2 of its own report) identified a capability-registry divergence: no registered capability cleanly owns the "date-specific exception to default operating times" concept, and flagged (its own §21, risk #2) that ServicePeriod was "not yet wired into reservation creation." **This assignment resolves that specific risk** (the wiring gap) but does **not** touch or resolve the underlying registry-ownership divergence itself — per R1.6-A's own instruction, the registry was not edited then and is not edited now. **GOVERNANCE FOLLOW-UP REQUIRED**, unchanged from R1.6-A: the capability registry's CAP-D02.01/CAP-D02.02 boundary still does not cleanly describe what `ServicePeriod.ts`/`ServicePeriodService.ts` actually implement. This does not block the correctness of the enforcement built here.

## 32. Full Regression Results

`npm run typecheck` — clean, zero errors, both before and after all changes in this assignment.

`npx vitest run` (full suite): **633/634 passing, 48/49 files passing.**

The single failure — `tests/integration/communication-worker.test.ts` §20 ("ambiguous/unknown outcome... leaves the row in Processing") — was investigated and is a **pre-existing, order-dependent flake, proven unrelated to this assignment**:

- Root cause: `PrismaCommunicationOutboxRepository.claimBatch` (`infrastructure/persistence/PrismaCommunicationOutboxRepository.ts:119-136`) claims rows via `ORDER BY available_at ASC` with no secondary tie-break column. The affected test seeds two messages whose `available_at` is computed from the same fixed test clock, so they tie; Postgres does not guarantee a stable order for tied rows without an explicit secondary sort key, so which of the two rows is treated as "first" (and therefore receives the mocked `THROW` result) depends on incidental physical row/plan state left behind by whichever tests ran earlier in the same process.
- Verified pre-existing, not introduced by this change: reproduced the identical failure by running only pre-existing, unmodified files (`floor-seating-concurrency.test.ts`, `service-period.test.ts`, `communication-worker.test.ts`) in sequence. Then `git stash`-ed every file this assignment modified (restoring the exact `c1a488c` baseline for all touched files) and reproduced the **identical** failure again, on the unmodified baseline, before restoring this assignment's changes. The test passes reliably in isolation.
- Out of scope: this is an R1.6-B communication-worker test-design defect (a missing tie-break, e.g. `ORDER BY available_at ASC, id ASC`), not a CAP-D02 ServicePeriod defect. Per this assignment's own instruction ("no pre-existing test may be weakened or deleted just to pass") and its bounded scope (no changes to R1.6-B communications code authorized here), it was **not modified**. Flagged here for Chief Engineer visibility/triage, not silently absorbed into a false 634/634 claim.

All ServicePeriod-relevant suites are green: `tests/domain/service-period.test.ts` (32/32), `tests/integration/service-period.test.ts` (25/25, R1.6-A's own, untouched), `tests/integration/service-period-enforcement.test.ts` (36/36, new), plus every other previously-passing suite (BookingPolicy, CAP-D01.01, CAP-D02.03, R1.1 concurrency/failure/DST, R1.2 security, R1.3 Contact, R1.4 operational resilience, R1.5 floor/seating, Teppanyaki pacing, R1.6-B communications minus the one flake above).

## 33. Live Local Smoke Test

`npm run service-period-smoke-test` (`ops/reservations/servicePeriodSmokeTest.ts`), real local PostgreSQL (`helix_reservations_test`, never the pilot/dev database), through the actual HTTP surface (`createApp()`, real `POST /auth/login` session cookie, real `POST /availability/reservations`, real `POST /closing-days`) — no production data.

| Step | Result |
|---|---|
| 1. Login as authorized staff | OK — `POST /auth/login` → 200 |
| 2. Monday 16:45 → rejected | OK — 422 `{"servicePeriod":{"type":"OUTSIDE_SERVICE_PERIOD"}}` |
| 3. Create Monday 17:00 → succeeds | OK — 201 |
| 4. Create Monday 21:00 → succeeds | OK — 201 |
| 5. Monday 21:15 → rejected | OK — 422 `OUTSIDE_SERVICE_PERIOD` |
| 6. No orphan Contact/CapacityCommitment/CommunicationMessage after rejected create | OK — 0 orphan Contact rows, 0 orphan Communication rows |
| 7. ClosingDay test | OK — `POST /closing-days` → 201; create on closed date → 422 `CLOSED` |
| 8. One special-date override | OK — override-only start → 201; still-outside start → 422 `OUTSIDE_SERVICE_PERIOD` |
| 9. Same-day after 17:00 | OK — staff → `CREATED`; self-service (internal orchestrator call, no public guest API exists) → `BOOKING_POLICY_REJECTED` / `ROUTE_TO_STAFF`, never `SERVICE_PERIOD_REJECTED` |

**OVERALL: PASS** (all 9 steps).

## 34. Acceptance Gates

| Gate | Status | Evidence |
|---|---|---|
| AC-C0-01 | PASS | §3, §10 — no capacity-aware deployment can omit enforcement |
| AC-C0-02 | PASS | §18, T8, smoke step 7 |
| AC-C0-03 | PASS | §17, T9, smoke step 8 |
| AC-C0-04 | PASS | §20, T7 |
| AC-C0-05 | PASS | §19, T2/T3/T4/T5/T6 |
| AC-C0-06 | PASS | §19, T16 |
| AC-C0-07 | PASS | §5, T12, smoke step 9 |
| AC-C0-08 | PASS | §14, T13, smoke step 9 |
| AC-C0-09 | PASS | §24, T15, smoke step 6 |
| AC-C0-10 | PASS | §23, T15, smoke step 6 |
| AC-C0-11 | PASS | §23, T15, smoke step 6 |
| AC-C0-12 | PASS | §21, T10/T11, smoke step 8 |
| AC-C0-13 | PASS | §22, T17 |
| AC-C0-14 | PASS | §27 — one canonical route audited; pilot UI gap found and fixed |
| AC-C0-15 | **PASS with one documented, pre-existing, unrelated exception** | §32 — 633/634; the one failure is proven pre-existing on baseline `c1a488c` and out of this assignment's authorized scope |

## 35. Evidence Appendix

- `domain/availability/ServicePeriod.ts` (read in full before and after; `ServicePeriodEligibility`/`evaluateMinuteEligibility` added at lines 194-207)
- `application/availability/ServicePeriodService.ts` (read in full before and after)
- `application/availability/AvailabilityOrchestrator.ts` (read in full before and after; enforcement site at lines 144-183)
- `application/command-handlers/CreateReservationHandler.ts` (read in full — confirmed no capacity pool available here, ruling it out as the enforcement site, §6)
- `domain/value-objects/ReservationSource.ts` (read in full — exact `ReservationSourceCategory` values for §30)
- `domain/commands/ReservationCommands.ts`, `application/command-handlers/CreateReservationHandler.ts`'s `CreateReservationRequest` (read in full — confirmed `isHistoricalCorrection`/`historicalCorrectionReason` pre-existed, §16)
- `tests/integration/support/testHarness.ts` (read in full before and after; `HarnessOverrides.enforceServicePeriod` added)
- `public/pilot.html` (read in full; create-submit routing fix, §28)
- `api/app.ts`, `api/server.ts` (read in full before and after)
- `infrastructure/persistence/PrismaServicePeriodOverrideStore.ts`, `infrastructure/persistence/PrismaClosingDayStore.ts` (read in full — exact `upsert`/`add` signatures used by new tests and the smoke script)
- `infrastructure/persistence/PrismaCommunicationOutboxRepository.ts` (read in full while root-causing the pre-existing flake, §32)
- `R1_6_A_SERVICE_PERIOD_IMPLEMENTATION_REPORT.md` (read for the CAP-D02.02 registry-divergence finding carried forward in §31, and the "not yet wired into reservation creation" risk this assignment resolves)
- Grep audits: `WalkIn|Walk-in|walkin` (no dedicated handler, §15); `capacity:\s*\{` across `*.ts` (only `api/server.ts` constructs it, §10/§27); `app\.(post|get)\(` in `api/app.ts` (full route inventory, §27)
- `tests/integration/service-period-enforcement.test.ts` — new, 36 tests, all passing (§29/§30)
- `ops/reservations/servicePeriodSmokeTest.ts` — new, live local smoke test script (§33)
- Regression: `npx vitest run` full output, both before this assignment's changes (`git stash` verification) and after (§32)
