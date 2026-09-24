# R1.6-P2B — Canonical Service Code Boundary Implementation Report

Mode: IMPLEMENTATION REPORT — consolidates work already implemented,
tested, committed (`e7f079fc2fccc2f2a8117678413930cc3f5b99b0`, 2026-09-10),
and pushed. No new production code is introduced by this document.
Written as part of R1-DOC-4 (Canonical Service Code Documentation
Reconciliation), alongside `capability-registry.yaml.md`'s CAP-D02.01/
CAP-D02.02 evidence notes and `README.md`/`PILOT.md`'s correction of the
now-stale "`UnvalidatedServicePeriodReader` is still production-wired"
claim.

## Scope

R1.6-P2A's design addendum established that a capacity pool/area is not
a Service, that the real Service axis is meal-based (`lunch`/`dinner`,
matching what `public/pilot.html` already derived client-side), and that
no implementation should begin before four identified product-owner
decisions were resolved. R1.6-P2B is the Chief Engineer-authorized
minimum slice that followed: a server-authoritative canonical Service
**code** boundary — deliberately NOT the persisted `Service`/
`ServiceSession` model either addendum discussed. That larger work
remains unauthorized and unbuilt.

## What shipped

| Layer | Artifact |
|---|---|
| Canonical code + derivation | `domain/availability/Service.ts` — `ServiceCode = "lunch" \| "dinner"`; `deriveServiceCode(instant)` |
| Real validator | `infrastructure/CanonicalServicePeriodReader.ts` — replaces `UnvalidatedServicePeriodReader` in production wiring only |
| Production wiring | `api/server.ts` — `servicePeriodReader: new CanonicalServicePeriodReader()` |
| Create-time enforcement | `CreateReservationHandler`'s existing step 5 — unchanged code, real validator behind it |
| Modify-time enforcement | `ModifyReservationHandler.ts` — new required `ServicePeriodReader` dependency, resolved before any write |
| Walk-in fix | `AvailabilityOrchestrator.ts:434` — `deriveServiceCode(commandNow)` replaces the old inert `"walk-in"` literal |

**Derivation**: `ServiceTime.ts`'s existing `Intl`-based, fixed-`Europe/Amsterdam`-IANA-zone conversion (`toLocalMinuteOfDay`) — DST-correct by construction, never the machine's local timezone, never a fixed UTC offset. Boundary: local `[12:00, 16:00)` → `"lunch"`; every other time within an otherwise-eligible service → `"dinner"`.

**Behavioral contract, exactly:**
- **Creation** validates the supplied `servicePeriodId` against the code derived from `reservationDate`; a garbage or mismatched value is rejected (`CAP-D01.01-R06`, the pre-existing violation code — no new outcome type introduced).
- **Modification**: an explicitly supplied `servicePeriodId` is validated against the effective (possibly new) date, rejecting atomically with zero mutation on mismatch. When `reservationDate` changes and `servicePeriodId` is omitted, the correct canonical code is derived and persisted automatically. An unrelated modification (no date change, no explicit `servicePeriodId`) never rewrites an existing — including a historical, noncanonical — stored value.
- **Walk-ins** now persist a real `"lunch"`/`"dinner"` value, derived from the exact same instant used as `reservationDate`, never the old `"walk-in"` sentinel.
- **The pilot UI is unchanged** — `public/pilot.html` already computed and sent this exact value on both create and modify before this milestone; only the server-side enforcement behind it is new.

## Correcting the stale "still production-wired" claim

Before this milestone, `README.md` stated `infrastructure/UnvalidatedServicePeriodReader.ts` was *"still wired into `CreateReservationHandler`, and still always reports valid"* in production. **That is no longer true and has been corrected in this reconciliation.** Production (`api/server.ts`) now wires `CanonicalServicePeriodReader`. `UnvalidatedServicePeriodReader` itself was not deleted and remains legitimately in use — as a deliberate test double — across most of the integration/API test suite and in `ops/reservations/servicePeriodSmokeTest.ts`, everywhere the concern under test is unrelated to Service-code validation (see that milestone's own STOP-gate report, "Fixture impact"). Continued use there is not a gap; it is the same kind of intentional simplification `FakeServicePeriodReader` (`tests/support/FakePorts.ts`) already represented before this change.

## Four distinct concerns — kept separate, not conflated

1. **Canonical reservation Service classification** (this milestone) — a two-value, code-level, time-derived label. Real, enforced, tested.
2. **Booking-window eligibility** (`domain/availability/ServicePeriod.ts` + `ServicePeriodService.ts`, R1.6-A/R1.6-C0) — answers "which start times are offered/bookable," keyed by `CapacityPoolId` + local date, not by `servicePeriodId` at all. Unaffected by this milestone; confirmed unchanged by the full regression run below.
3. **The persisted `Service` definition capability (CAP-D02.01)** — reusable, staff-manageable service configurations (naming, default operating times/duration). Still does not exist as a database entity or admin surface. This milestone's `Service.ts` is a minimum, code-level stand-in for exactly two values, mirroring `CapacityPool.ts`'s own "static until a concrete need to change it exists" precedent — not an implementation of CAP-D02.01's owned rules.
4. **The dated `ServiceSession` lifecycle capability (CAP-D02.02)** — `Created`/`Opened`/`Closed` per-date operational sessions, active floorplan selection. Still entirely unimplemented: no table, no lifecycle states, no reservation-to-session relationship. `CAP-D02.01` and `CAP-D02.02` both remain `Designed` in the capability registry — this milestone does not claim either capability as implemented, delivered, or advanced in maturity.

## Accepted limitations (preserved, not resolved by this report)

- **Historical noncanonical rows are not backfilled.** The 4 pre-existing dev-database reservations (`servicePeriodId: "sp-dinner"`) and any other legacy value already stored were not rewritten and are not touched by ordinary use — an unrelated modification to such a row leaves its noncanonical value exactly as-is (proven directly: `tests/integration/canonical-service-period.test.ts`, "a snapshot-only/unrelated modification preserves an existing legacy... servicePeriodId untouched").
- **No `Service` or `ServiceSession` table exists.**
- **No lifecycle states, active floorplan selection, or reservation-to-session relationship exists.**
- These remain exactly the gaps R1.6-P2A's design addendum identified and left for a future, separately authorized, product-owner-gated milestone.

## Automated verification — what this report can and cannot claim

**Confirmed by automated evidence:**
- `tests/domain/service.test.ts` (14 tests): exact `12:00`/`15:59`/`16:00` boundary values, a winter (CET, UTC+1) and summer (CEST, UTC+2) pair, and the identical-UTC-instant-either-side-of-both-2026-DST-transitions proof (a naive fixed-offset or machine-local-time implementation would fail these).
- `tests/integration/canonical-service-period.test.ts` (11 tests, real PostgreSQL): matching-code creation (lunch and dinner), unknown-code rejection, mismatched-code rejection, no-mutation-on-rejected-create, omitted-code-with-date-change derivation, explicit-mismatch-on-date-change atomic rejection (Reservation/CapacityCommitment both verified unchanged), legacy-value preservation on an unrelated modification, explicit-value-checked-even-without-a-date-change, and walk-in derivation for both lunch and dinner instants.
- Full isolated suite at closure: **79 test files / 1169 tests / 0 failed / 0 skipped** (the commit's own pre-push gate; one transient full-suite-only timing flake in an unrelated, untouched concurrency test file was observed and confirmed non-reproducible in isolation before the clean confirming run that gated the actual push).
- Typecheck: clean.

**NOT confirmed — explicitly out of scope for this report:**
- **No human/browser smoke test has been performed.** No staff member has opened the pilot and visually confirmed the lunch/dinner boundary against a real running dev deployment.
- **Nothing in this milestone has been deployed anywhere.**
- **CAP-D02.01/CAP-D02.02's own owned rules remain unimplemented** — this report does not claim otherwise (see "Four distinct concerns" above).

## Documentation reconciled alongside this report (R1-DOC-4)

- `capability-registry.yaml.md`: evidence comments added under `CAP-D02.01` and `CAP-D02.02`, both `delivery_status` values left unchanged at `Designed`.
- `README.md`: the stale "`UnvalidatedServicePeriodReader`... still wired into `CreateReservationHandler`... always reports valid" claim corrected; the real canonical-classification behavior documented as a third, distinct concern alongside the pre-existing booking-window-eligibility and live-session-lifecycle explanations.
- `PILOT.md`: the stale "any service-period selection is accepted" limitation corrected; the contact-validation half of that bullet preserved unchanged (out of this milestone's scope).
- This report itself — the fourth of the four files authorized for R1-DOC-4.

## Next gate

Unchanged from R1.6-P2A's own conclusion: no further Service/ServiceSession implementation should begin before the four product-owner decisions that addendum identified (the meal-only-vs-area-flavored Service axis; code-level-vs-persisted `Service` now; whether identity ultimately needs an area dimension; whether a `ServiceSession` lifecycle is worth building in isolation given it would otherwise produce operationally inert records) are resolved. This report does not reopen or resolve any of them.

---

## R1-DOC-8 reconciliation (added 2026-09-24 — does not alter anything above)

Everything above this line is preserved exactly as written on 2026-09-10
and describes what was true about R1.6-P2B at that time — including,
correctly, that no persisted `Service` definition existed ("Four distinct
concerns" item 3, and "Accepted limitations"). Do not read the sections
above as describing the current state; this section records what changed
after them.

Later, Chief-Engineer-authorized work built the persisted model that
R1.6-P2B's own "Four distinct concerns" item 3 explicitly identified as
not yet existing:

- **R1.6-P3A** (commit `5020a9843d1282c68be047a09c92fbe45cbf04c9`,
  2026-09-23, `feat(service): persist canonical service catalog`) added a
  real `services` table (migration
  `20260922145528_add_service_catalog`), seeded with exactly the two
  canonical rows this report's own boundary already established
  (`lunch`, `dinner`), a `service_sessions.service_code` foreign key to
  it, and wired `CanonicalServicePeriodReader` (this report's own "Real
  validator" row above) to also consult that persisted catalog — a
  missing or disabled row now fails canonical validation closed
  (`CAP-D02.01-R01`), on top of, not instead of, the code-derivation
  behavior this report describes.
- **Development schema activation**: the migration above was applied to
  `helix_reservations_dev` in a separate, explicit step after R1.6-P3A's
  commit — `services` now holds exactly the two canonical, enabled rows
  in development.
- **R1.6-P3B** (commit `a9899edad6f6cdbc4493a9c518e019c2a83c1e96`,
  2026-09-23, `feat(service): expose catalog management`) added an
  authenticated management surface over that same persisted table —
  `GET /services`, `PATCH /services/:code` limited to `displayName`/
  `enabled`, `code` immutable — and a "Diensten" pilot panel exposing it.

**What this does NOT change, and what remains true today exactly as this
report's own "Four distinct concerns" and "Accepted limitations" sections
described them:**

- The time-derived classification behavior this report documents
  (`deriveServiceCode`, the `[12:00,16:00)` Amsterdam-local boundary, the
  create/modify/walk-in enforcement contract) is unchanged by either
  later milestone.
- Booking-window eligibility (`ServicePeriod.ts`/`ServicePeriodService.ts`,
  this report's concern 2) and the dated `ServiceSession` lifecycle
  capability CAP-D02.02 (this report's concern 4) are unaffected by
  R1.6-P3A/P3B — proven structurally: neither `ServiceSessionService.ts`
  nor its Prisma repository references the new Service-definition
  repository or `.enabled` anywhere, and the production construction path
  never gives `ServiceSessionService` one.
- `CAP-D02.01` remains `Designed` — R1.6-P3A/P3B did not promote it. This
  capability's own registered rules (service naming beyond a display
  name, default operating times, default reservation duration) and two of
  its three registered events (`ServiceCreated`, `ServiceDeactivated`)
  remain entirely undelivered; no Create or Delete Service operation
  exists anywhere in this codebase.
- The four historical, legacy `sp-dinner` Reservation `servicePeriodId`
  values this report's own "Accepted limitations" section describes as
  "not backfilled" remain exactly that — unbackfilled, unchanged, and
  outside the new persisted catalog's foreign key (which constrains
  `service_sessions`, never `reservations`).
- No authenticated human browser workflow has exercised either the new
  API or the "Diensten" panel, and no development `services` row has been
  changed through them — `helix_reservations_dev` holds only the two
  rows the migration itself seeded. Nothing from either milestone has
  been deployed anywhere.

See `R1_6_P3_SERVICE_CATALOG_IMPLEMENTATION_REPORT.md` for the complete
design, evidence, and accepted-limitations record for this later work.
