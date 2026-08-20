# R1.6-A — Service Period Management: Implementation Report

Program: Guestplan Replacement
Capability: CAP-D02.02 — Service Period Management (see §2 for a required registry-divergence finding)
Mode: BOUNDED IMPLEMENTATION

Previous gates: R1.1–R1.5 — PASS · R1.6 Architecture Investigation — COMPLETE.

---

## 1. Baseline

Verified directly, read-only, before implementation began:

| Check | Result |
|---|---|
| Branch | `feat/ec-002-visibility-baseline` |
| HEAD (before this work) | `f2375a982b165b2b6f0c378fa44dbe4eaceaae92` — matches the assignment's expected `f2375a9` |
| Working tree | Clean except two pre-existing untracked files, neither created by this assignment: `R1_3_GUEST_CONTACT_ARCHITECTURE_INVESTIGATION.md` and `R1_6_GUEST_BOOKING_COMMUNICATIONS_ARCHITECTURE_INVESTIGATION.md` (the prior R1.6 investigation report — that assignment's own instruction was `COMMIT: NONE`, so it remains untracked and is left untouched by this commit too) |
| Full regression (before) | 37 test files, 434/434 passing |

## 2. Capability Registry Evidence

Read `solutions/reservations/capabilities/capability-registry.yaml.md` directly (lines 335–415) before writing any code, per the assignment's own §23 instruction ("Inspect authoritative CAP-D02.02 definition. Implement within its actual registered ownership... If the registry differs from the architecture required here: report divergence.").

**Finding — a genuine, substantive divergence, not silently resolved:**

- **CAP-D02.02 "Service Period Management"**, as registered (lines 372–415), owns concepts `Service Period` / `Service Period Status`; rules `service period creation`, `service period opening`, `service period closing`, `active floorplan selection`; events `ServicePeriodCreated`, `ServicePeriodOpened`, `ServicePeriodClosed`, `FloorplanVersionApplied`; depends on CAP-D02.01 and CAP-D03.02. **This describes a live, per-date operational SESSION lifecycle** — a manager opening today's dinner service, selecting an active floorplan version for it, and later closing it — not a weekly booking-hours calendar.
- **CAP-D02.01 "Service Management"** (lines 335–370) is the registry entry that actually owns `"default operating times"` and `"default reservation duration"` as rules — the closest registered fit for the *weekly recurring schedule* half of what this assignment requires.
- **Neither registered capability owns a "date-specific exception to the default operating times" concept.** The assignment's §4/§5 (weekly schedule vs. date override, special days) has no clean single registered owner today.

**What this means for this implementation**: the code below is named "ServicePeriod" throughout (`domain/availability/ServicePeriod.ts`, `ServicePeriodService`, `ServicePeriodOverrideStore`) because the assignment's own vocabulary insists on it (§9's `GetBookableStartTimes`, §10's `IsStartTimeWithinServicePeriod`, §2's "Service Period" framing throughout) — but **this implementation does NOT build CAP-D02.02 as the registry actually defines it.** No `ServicePeriodCreated`/`-Opened`/`-Closed` event, no session lifecycle, no floorplan-version selection exists anywhere in this change. What was actually built is closer, in spirit, to CAP-D02.01's "default operating times" rule, plus a new, currently-unregistered "date-specific override" concept layered on top.

Per the assignment's own explicit instruction, **the capability registry was NOT edited** to reconcile this. This divergence is reported here for Chief Engineer/architecture-registry judgment — it is not this implementation's place to decide whether the registry should be split, renamed, or left as-is.

This is entirely separate from — and does not touch or resolve — the pre-existing R1.6-investigation-flagged overlap between CAP-D05.04/CAP-D07.03 (external guest reference), which remains untouched.

## 3. Existing ClosingDay Analysis

`application/ports/ClosingDayStore.ts` / `infrastructure/persistence/PrismaClosingDayStore.ts` were read in full before writing any new code (assignment §6: "do not create a competing second concept for a full closure without reviewing the existing capability"). Findings:

- `ClosingDayStore` is real, DB-backed (not a placeholder — its own doc comment says so explicitly), and already the sole authority for "is this date fully closed," used today by `AvailabilityOrchestrator.createWithCapacity` and `CreateReservationHandler`.
- It represents a date **range** (`fromDate`..`toDate` inclusive), with no time-of-day component — a whole-day (or multi-day) concept only. It has no notion of *which hours* a day is open; it only ever says "fully closed" or (by absence) "not fully closed."
- Its own `isClosed(date: Date)` implementation zeroes the UTC hours of whatever `Date` it is given (`startOfDay`). This is documented as correct for its own callers, which pass a bare calendar-date-shaped value. **Observation, not a defect fixed here**: `AvailabilityOrchestrator.createWithCapacity` passes the raw `reservationDate` instant (a real timestamptz), not a pre-derived local calendar date — near local midnight, this could in principle check the wrong UTC-vs-local calendar day. This is a pre-existing characteristic of code this assignment does not authorize touching (`AvailabilityOrchestrator.ts` is unmodified by this change) and is noted here only as a known, out-of-scope observation — see §19 Known Limitations.

**Ownership boundary implemented** (documented in `prisma/schema.prisma`'s new model comments and enforced in `domain/availability/ServicePeriod.ts`'s `resolveDaySchedule`):

- `ClosingDay` owns: **"is this date open at all."** Untouched, unmodified, called via its existing public interface only.
- `ServicePeriodOverride` (new) owns: **"given that the date IS open, which hours."** It never duplicates ClosingDay's own "fully closed" semantics — a `ServicePeriodOverride` can itself express `status: "Closed"` for a single area/date (e.g., "Sushi is closed for a private event, but Teppanyaki isn't" — a per-area exception ClosingDay cannot express, since ClosingDay has no area concept at all), but a *whole-restaurant* closure remains ClosingDay's job, and this implementation never reads or writes the `closing_days` table for any purpose other than the existing `ClosingDayStore.isClosed()` call.

No second closure concept was created. `ServicePeriodService` calls the existing `ClosingDayStore.isClosed()` unmodified and gives it absolute precedence over everything else (§9 Precedence).

## 4. ServicePeriod Domain Model

New file: `domain/availability/ServicePeriod.ts` — pure, DB-free (no imports of `CapacityPool.ts` values, `BookingPolicy.ts`, or `TeppanyakiSelfServicePacing.ts` — proof by construction for INV-SP08/SP09/SP10).

- `BookingWindow { firstStartMinute, lastStartMinute }` — both bounds are valid START minutes; there is no end-of-service field anywhere in this module (INV-SP02/SP03 by construction).
- `DaySchedule = readonly BookingWindow[]` — zero or more windows per day (assignment §7: multiple windows supported now, not assumed to be one continuous window forever).
- `DEFAULT_WEEKLY_SCHEDULE` — the owner-confirmed weekly windows (§2/§28), keyed by `Date#getDay()` convention (0=Sunday..6=Saturday).
- `AREA_WEEKLY_SCHEDULE_OVERRIDES` — an empty, area-keyed escape hatch (assignment §8: area is not collapsed out of the model, even though both areas currently share the default).
- `enumerateGridStarts`, `isMinuteWithinDaySchedule`, `formatMinuteOfDay` — pure grid mechanics (15-minute, per `SERVICE_PERIOD_GRID_MINUTES`, matching the existing authoritative `BOOKING_GRID_MINUTES` value in `CapacityPool.ts`).
- `resolveDaySchedule` — **the single authority for the §6 precedence rule** (ClosingDay > date override > weekly), a pure function taking pre-resolved booleans/records so every branch is directly, exhaustively unit-testable with no I/O.
- `toBookableStartTimesResult` / `isMinuteBookable` — pure projections implementing the assignment §9/§10 result shapes.

## 5. Persistence / Configuration Model

Per assignment §20 ("smallest persistence/configuration model... do not build a general-purpose calendar engine"):

- **The weekly recurring schedule is static TypeScript configuration**, not a database table — same "small, static, promote only when a concrete need to change it without a code change exists" precedent `CapacityPool.ts` already established for Sushi/Teppanyaki capacity (product-principles.md PRP-014/PRP-020). It rarely changes and every value is owner-confirmed today.
- **Only the date-specific override layer is persisted** — two new Prisma models, `ServicePeriodOverride` (one row per area+date, `status: "Open" | "Closed"`) and `ServicePeriodOverrideWindow` (child rows, only when Open; cascade-deleted with their parent). This is the smallest relational shape that supports §7's multiple-windows-per-date requirement without a JSON blob (this schema has no existing JSON-column precedent; a proper child table matches the codebase's existing relational conventions, e.g. `SeatingAssignmentResource`).
- Real Prisma migration `20260820150000_add_service_period_management` (additive only — see its own header comment for why three unrelated, pre-existing foreign-key statements that `prisma migrate diff` also proposed were deliberately excluded from it), applied to both `DATABASE_URL` and `TEST_DATABASE_URL`.
- `application/ports/ServicePeriodOverrideStore.ts` (port) + `infrastructure/persistence/PrismaServicePeriodOverrideStore.ts` (real implementation) — `findForDate`, `upsert` (idempotent create-or-full-replace of the window set), `remove`, `list`.

## 6. Weekly Schedule

Owner-confirmed (§2/§28), implemented exactly:

| Days | Window |
|---|---|
| Monday–Thursday | 17:00–21:00 |
| Friday–Sunday | 12:00–21:00 |

21:00 is the inclusive last valid START minute (§11 below / INV-SP02). Applies today to both Sushi and Teppanyaki via the shared-default fallback (§7 Area Model).

## 7. Area Model

`CapacityPoolId` ("Sushi" | "Teppanyaki") is a first-class parameter of every ServicePeriod operation — never collapsed out, per assignment §8. `getWeeklySchedule(area)` checks `AREA_WEEKLY_SCHEDULE_OVERRIDES[area]` first and falls back to the shared `DEFAULT_WEEKLY_SCHEDULE` — today this map is empty, so both areas resolve identically, with zero duplicated configuration, while the mechanism to diverge them later (a code change, consistent with the weekly schedule's own static-config precedent) already exists and is proven by a dedicated test (`tests/domain/service-period.test.ts`, INV-SP06). Date-specific overrides are *always* area-scoped at the persistence layer (`ServicePeriodOverride.areaId` is required, never nullable) — proven not to leak between areas by both a pure domain test and a real-PostgreSQL integration test (§16 below).

## 8. Date Overrides

`ServicePeriodOverrideStore` (§5) + `resolveDaySchedule`'s override branch implement assignment §4/§5 exactly: a date-specific override, when present, **replaces** the weekly schedule for that area/date — it is never unioned with it (proven directly: `tests/domain/service-period.test.ts`, "an Open override REPLACES the weekly schedule... not a union of the two"). No holiday hours were hardcoded anywhere (assignment §5's explicit instruction) — no Christmas/New Year's Eve/1 January data was seeded; those dates appear in this report and in tests only as the assignment's own illustrative examples, using synthetic hours chosen for the test, never claimed as real owner-confirmed values.

## 9. ClosingDay Precedence

Implemented exactly as specified in `resolveDaySchedule` (§4): `closingDayClosed` (from the existing, unmodified `ClosingDayStore.isClosed()`) is checked **first** and unconditionally wins — proven directly by a real-PostgreSQL integration test seeding both a `ClosingDay` row AND an `Open` `ServicePeriodOverride` for the same date, confirming the result is still `CLOSED` (`tests/integration/service-period.test.ts`, "ClosingDay wins even when a date-specific Open override also exists"). INV-SP04 holds.

## 10. Grid Semantics

`SERVICE_PERIOD_GRID_MINUTES = 15`, matching `CapacityPool.ts`'s existing `BOOKING_GRID_MINUTES`. `enumerateGridStarts` walks each window from `firstStartMinute` to `lastStartMinute` inclusive, step 15; `isMinuteWithinDaySchedule` checks both window membership AND grid alignment RELATIVE TO the window's own start (not a global :00/:15/:30/:45 check) — future-proof against a hypothetical window that doesn't start on the hour, per INV-SP07. Boundary-exact per §17: Monday 16:45 → false, 17:00 → true, 21:00 → true, 21:15 → false; Friday 11:45 → false, 12:00 → true, 21:00 → true, 21:15 → false — proven at both the pure-domain and real-PostgreSQL integration layers.

## 11. Inclusive Final Start Semantics

INV-SP02/SP03 are enforced structurally, not just by a passing test: `BookingWindow` has exactly two fields, both START minutes; no function in `ServicePeriod.ts` accepts or reasons about a reservation's duration or an end-of-service time. A Teppanyaki reservation starting at 21:00 with a 150-minute duration (ending 23:30) is judged *solely* on its 21:00 start minute — there is nothing in this module capable of rejecting it for finishing "too late," exactly as the assignment specifies (§2 example, §24 INV-SP02/SP03). A dedicated test documents this explicitly (`tests/domain/service-period.test.ts`, "this module has no notion of a reservation's duration...").

## 12. Timezone / DST

Reused, not reimplemented: `domain/availability/ServiceTime.ts`'s existing `Intl.DateTimeFormat`-based, IANA-timezone-correct `toLocalServiceDate`/`toLocalHourMinute` (R1.1). Two additions, both built the same way (no fixed-offset arithmetic, no naive UTC-date-slicing):

- `toLocalMinuteOfDay(instant)` — `hour*60+minute`, the unit `BookingWindow` operates in.
- `dayOfWeekFromLocalDate(localDate: string)` + `toLocalDayOfWeek(instant)` — `Date#getDay()` convention, derived by constructing a UTC-midnight `Date` from an *already-correct* local `YYYY-MM-DD` string's Y/M/D components (timezone-independent once the correct triple is known — no further conversion, no re-introduction of the naive-UTC-slicing bug class `ServiceTime.ts`'s own header warns about).

`GetBookableStartTimes(area, localDate)` takes an already-local date string directly (matching the assignment's own signature — no instant/DST sensitivity at that boundary). `IsStartTimeWithinServicePeriod(area, requestedStart)` converts a real instant via `toLocalServiceDate`/`toLocalMinuteOfDay` before ever touching weekly-schedule or override data — DST-correct by construction, not by a special case.

## 13. BookingPolicy Divergence

Confirmed exactly as the R1.6 investigation reported: `domain/availability/BookingPolicy.ts`'s same-day cutoff branch returned a distinct `REJECTED_CUTOFF` outcome (hard rejection), not `ROUTE_TO_STAFF`, before this change. A full repository grep before editing confirmed `REJECTED_CUTOFF` was referenced only by `BookingPolicy.ts` itself and by test assertions checking for it — nothing else branched on it as a distinct type, so removing it entirely (rather than deprecating/aliasing it) was safe.

## 14. BookingPolicy Correction

Per the assignment's §11/§28 authoritative owner decision, `evaluateBookingPolicy`'s same-day-cutoff branch (`domain/availability/BookingPolicy.ts`) now returns `ROUTE_TO_STAFF` with a guest-appropriate reason string ("...please contact Konnichiwa directly for availability"), never a hard rejection. `BookingPolicyOutcome`'s type union no longer includes `REJECTED_CUTOFF` — it has exactly two members, `ALLOWED` and `ROUTE_TO_STAFF`, unifying the same-day-cutoff reason with the existing party-size-9+ reason under one outcome type (distinguished only by `reason` text, exactly like the precedent `TeppanyakiSelfServicePacing.ts` already established for its own `ROUTE_TO_STAFF` reason).

**The boundary condition itself is unchanged**: `hour >= SAME_DAY_SELF_SERVICE_CUTOFF_HOUR` (17) still means 17:00:00 local exactly is at-or-after the cutoff — this was true before this correction and remains true now; only the outcome *type* changed, per the assignment's explicit BP2 instruction to "define/test boundary according to existing cutoff semantics and document it precisely" rather than silently also renegotiating the boundary itself. No other branch of `evaluateBookingPolicy` (party-size routing, the staff exemption, the local-date derivation) was touched. This is a single-file domain change plus test updates — no second, parallel "public-only" policy implementation was created, per the assignment's explicit instruction (§11).

Six call sites referencing the removed literal `"REJECTED_CUTOFF"` were found and updated: `BookingPolicy.ts` itself (2), `tests/domain/booking-policy.test.ts` (2, now BP1–BP5), `tests/integration/availability-create.test.ts` (1), `tests/integration/availability-timezone.test.ts` (2). `AvailabilityOrchestrator.ts` and `api/app.ts` needed no changes — both already forward `BookingPolicyOutcome` opaquely (`{ policy: result.policy }`) without branching on its `type` value.

## 15. Transaction / Persistence Boundary

`ServicePeriodService` performs no writes and opens no transaction of its own — it is a pure read composition (`ClosingDayStore.isClosed` + `ServicePeriodOverrideStore.findForDate`, both independent reads, no ordering/locking dependency between them since neither can race the other into an inconsistent joint state — a `ServicePeriodOverride` upsert and a `ClosingDay` add are independent, unrelated writes with no shared invariant to protect atomically). `PrismaServicePeriodOverrideStore.upsert` uses a single `$transaction` internally only to make its own "delete old windows, write new ones" pair atomic against a concurrent reader never seeing a transiently-empty window set — the same "replace atomically" pattern used elsewhere in this codebase (e.g. `AvailabilityOrchestrator`'s commitment supersede-then-create pairing), scaled down to this table's much smaller concurrency needs (an infrequently-edited configuration row, not a hot path).

## 16. Tests

**Pure domain** (`tests/domain/service-period.test.ts`, 32 tests; `tests/domain/service-time.test.ts`, +5 tests for `toLocalDayOfWeek`/`dayOfWeekFromLocalDate`; `tests/domain/booking-policy.test.ts`, BP1–BP5 regression): weekly schedule structure, INV-SP06 area sharing, §17 grid boundaries (Monday/Friday, both directions), INV-SP07 grid-alignment/dedup/ordering, INV-SP02/SP03 inclusive-final-start-and-no-duration proof, full `resolveDaySchedule` precedence matrix (ClosingDay > override > weekly, including a Closed override, an Open-with-custom-windows override, no-override fallback, and a defensive out-of-range-day case), §18 area independence, §9/§10 result-shape projections, `formatMinuteOfDay`, and DST day-of-week correctness at both 2026 transition instants including the near-midnight no-UTC-shift case.

**Real PostgreSQL integration** (`tests/integration/service-period.test.ts`, 25 tests): §16 normal weekday/weekend, date-specific special hours overriding the weekly schedule, an explicit closed date, a multi-window special date, the day immediately before/after an override reverting to normal; §19 ClosingDay regression including the ClosingDay-vs-Open-override precedence race; §18 area testing including an override not leaking cross-area; §17 grid boundaries via `IsStartTimeWithinServicePeriod` against real stored data; §15 DST composition-level confirmation for both 2026 transition Sundays; and a direct `ServicePeriodOverrideStore` CRUD contract suite (idempotent-replace upsert, cascade-on-remove, area-filtered list).

Test totals: 434 → **496** (+62: 32 new domain `service-period` tests + 25 new integration `service-period` tests + 5 new domain `service-time` day-of-week tests; the BookingPolicy REJECTED_CUTOFF→ROUTE_TO_STAFF test updates were in-place renames, not additions).

## 17. PostgreSQL Evidence

All §16 integration tests run against the real, dedicated `TEST_DATABASE_URL` PostgreSQL instance (never SQLite, never mocked) via the existing `createTestPrismaClient`/`assertSafeToReset` safety gate (R1.4 P0) — the same discipline every prior capability's real-DB evidence has used. A new `truncateServicePeriodDomainTables` helper was added to `tests/integration/support/testDatabaseSafety.ts`, following the exact existing pattern (gated by `assertSafeToReset`, one `TRUNCATE ... RESTART IDENTITY CASCADE` statement, child table listed before parent) rather than ad hoc deletes scattered in the new test file.

## 18. Regression

```
npm run typecheck   -> clean
npm test             -> 39 test files, 496 tests, ALL PASSING
```

Up from 434 (pre-R1.6-A baseline). **No previous invariant regressed** — every R1.1–R1.5 test passes unchanged; the only pre-existing tests touched at all were the six `REJECTED_CUTOFF` call sites (§14), each a deliberate, in-place, owner-directed correction, not a loosening.

## 19. Known Limitations

- **Not wired into reservation creation.** `ServicePeriodService` is not called by `CreateReservationHandler` or `AvailabilityOrchestrator` — a public/internal reservation Create today still does not check whether the requested start time actually falls within an operating window (this gap predates R1.6-A and is unchanged by it; R1.1's own `UnvalidatedServicePeriodReader` stub, a separate, un-touched mechanism, already documented this exact gap). This is a deliberate, bounded scope decision: the assignment's §29 excludes the public booking surface this capability is a prerequisite for, and does not itself instruct wiring it into existing internal Create/Modify flows. Building the capability, real and fully tested, without yet wiring it anywhere, mirrors this same program's own precedent (`ClosingDayStore` existed and was real before `AvailabilityOrchestrator` consumed it; `ApprovedGuestChannel` has existed, real and tested, with zero HTTP-reachable path, since R1.2).
- **No administration surface.** Per explicit instruction (§21/§22), no HTTP route and no admin UI exist for managing `ServicePeriodOverride` rows. Today, entering a real override requires direct repository use (e.g., a short one-off script or a future authenticated route) — the store's `upsert`/`remove`/`list` methods are the "engineering-controlled mechanism" the assignment permits for now. The natural later surface is a staff-authenticated HTTP CRUD API mirroring the existing `/closing-days` routes exactly (`requireStaffSession` + a `Permission.CapacitySettingsManage`-equivalent gate) — classified as a later operational requirement, not built here.
- **`ClosingDayStore.isClosed`'s own UTC-slicing behavior near local midnight** (§3) is a pre-existing characteristic of code this assignment does not authorize modifying — `ServicePeriodService` calls it via its existing public interface unchanged. `ServicePeriodService`'s own new code always derives the correct Europe/Amsterdam local date first (never slicing a raw instant), so this observation applies only to the pre-existing `ClosingDayStore`/`AvailabilityOrchestrator` call site, not to any new code in this change.
- **No real special-date data exists.** Per explicit instruction (§5), no holiday/exceptional hours were hardcoded or seeded — Christmas/New Year's Eve/1 January appear only as illustrative test data with synthetic hours, never as claimed real values.
- **CAP-D02.02 registry divergence** (§2) is reported, not resolved — the registry was not edited.

## 20. Operational Administration Gap

Per assignment §21: staff will eventually need to manage special opening times and closed days. `ServicePeriodOverride`'s management surface today is code-only (direct repository calls). The lowest-friction later addition, consistent with this codebase's existing precedent, is a small staff-authenticated HTTP CRUD surface mirroring `/closing-days` (`POST/GET/DELETE /service-period-overrides`), gated by `requireStaffSession` + an appropriate `Permission` — explicitly classified as a later requirement, not authorized or built by this assignment.

## 21. Risks

| # | Risk | Class |
|---|---|---|
| 1 | CAP-D02.02 registry divergence (§2) — this implementation does not build the registry's actual live-session-lifecycle capability, despite sharing its name | **P1** |
| 2 | New capability is not yet wired into reservation creation (§19) — a reservation can still be created for a time outside any operating window until a future change wires this in | **P1** |
| 3 | No administration surface exists yet (§20) — a real special date requires direct code/repository access to enter today | **P2** |
| 4 | `ClosingDayStore.isClosed`'s pre-existing UTC-slicing characteristic near local midnight (§3), unrelated to this change but composed with by it via the existing interface | **P3** |

## 22. Final Verdict

Implementation complete. All required tests pass. Full regression passes (496/496). No unresolved P0 integrity defect. One bounded local commit follows this report.

## 23. Evidence Appendix

- `solutions/reservations/capabilities/capability-registry.yaml.md` lines 335–415 (CAP-D02.01, CAP-D02.02, read directly, in full, before implementation)
- `application/ports/ClosingDayStore.ts`, `infrastructure/persistence/PrismaClosingDayStore.ts` (read in full)
- `domain/availability/ServiceTime.ts`, `domain/availability/CapacityPool.ts`, `domain/availability/BookingPolicy.ts` (read in full before and after modification)
- `prisma/schema.prisma` (read in full; two new models added)
- `tests/domain/booking-policy.test.ts`, `tests/integration/availability-create.test.ts`, `tests/integration/availability-timezone.test.ts`, `tests/domain/service-time.test.ts` (read in full before modification)
- `ops/floor/seedFloor.ts`, `prisma/migrations/20260819112006_cap_d05_01_contact_management/migration.sql` (consulted for existing migration/seeding conventions)
- Full test suite re-run twice (once to establish the pre-change 434/434 baseline confirmation, once post-change at 496/496)
- Direct `git status`/`git log` output for baseline and final-state verification
