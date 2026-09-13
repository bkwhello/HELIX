# R1.6-P2C — Operational Service Session Lifecycle Implementation Report

Mode: IMPLEMENTATION REPORT — consolidates work already implemented,
tested, committed, and pushed across two increments:

- **R1.6-P2C-1** (backend lifecycle and atomic enforcement) — commit
  `bea39228d706df7a9a89d1631a10899b14833817`, 2026-09-12.
- **R1.6-P2C-2 / P2C-2A** (pilot exposure and the date-bounded read
  contract) — commit `1c7b7192e0929153c9f8951e3ebf8f9fc1ed5973`,
  2026-09-13.

No new production code is introduced by this document. Written as part
of R1-DOC-5 (Service Session Lifecycle Documentation Reconciliation),
alongside `capability-registry.yaml.md`'s `CAP-D02.02` evidence note and
`README.md`/`PILOT.md`'s correction of the now-stale "no Service or
ServiceSession table exists" claim left over from R1-DOC-4.

## Scope

R1.6-P2B (see `R1_6_P2B_CANONICAL_SERVICE_CODE_IMPLEMENTATION_REPORT.md`)
deliberately stopped short of the persisted `Service`/`ServiceSession`
model, leaving CAP-D02.01 and CAP-D02.02 both `Designed`. R1.6-P2C is the
Chief Engineer-authorized slice that followed: a real, persisted,
concurrency-safe operational session lifecycle — deliberately NOT the
full CAP-D02.02 definition (no reservation-to-session relationship, no
active-floorplan selection) and NOT CAP-D02.01 (no persisted Service
definition, no admin surface). That larger work remains unauthorized and
unbuilt.

## What shipped

| Layer | Artifact |
|---|---|
| Domain model | `domain/availability/ServiceSession.ts` — `ServiceSessionStatus = "Created"\|"Opened"\|"Closed"\|"Cancelled"`; `isValidServiceSessionTransition` |
| Persistence | `prisma/schema.prisma` `ServiceSession` model + migration `20260910153637_add_service_session`; `infrastructure/persistence/PrismaServiceSessionRepository.ts` |
| Lock ordering | `domain/availability/LockKey.ts` — new Tier 1.5 `SERVICE_SESSION_LOCK_NAMESPACE`, positioned reservation → **service session** → capacity/date → seating resource |
| Application service | `application/availability/ServiceSessionService.ts` — create/open/close/cancel, each its own transaction, each acquiring the session lock before reading or writing |
| Session gate | `application/availability/ServiceSessionGate.ts` — `lockAndReadServiceSession`, `requiresOpenedSession`, `rejectsPreAssignment` |
| Enforcement wiring | `application/floor/SeatingOrchestrator.ts`, `application/availability/AvailabilityOrchestrator.ts` — optional trailing `serviceSessionRepository?` parameter, byte-identical behavior when omitted |
| HTTP API | `api/app.ts` — five `/service-sessions*` routes; `api/server.ts` — real production wiring (same shared `PrismaClient`) |
| Pilot UI | `public/pilot.html` — "Servicesessies" panel + daily-list "Dienst" column |

## Persisted lifecycle, exactly

**Identity**: `@@unique([serviceCode, serviceDate])` — `serviceCode` is
the same closed two-value set (`"lunch"` / `"dinner"`) R1.6-P2B
established; `serviceDate` is a plain `YYYY-MM-DD` string, no time
component. Both are always *derived* from a reservation's own instant
(`deriveServiceCode` + `toLocalServiceDate`, Amsterdam-local) — the
enforcement paths never read or trust the stored `Reservation.servicePeriodId`
column, so a historical/noncanonical value (e.g. `"sp-dinner"`) is gated
identically to a canonical one (proven directly:
`tests/integration/service-session-enforcement.test.ts`, "Historical
noncanonical servicePeriodId").

**States**: `Created` → `Opened` → `Closed` (terminal); `Created` →
`Cancelled` (terminal). No other transition is valid — every cross-state
and reverse combination is rejected (`tests/domain/service-session.test.ts`'s
exhaustive 4×4 matrix check). Repeating an already-achieved transition
(`open()` on an already-`Opened` session, etc.) is idempotent: the same
outcome is returned, with the **same** timestamp and **same** version —
no restamp, no second increment (`tests/integration/service-session-lifecycle.test.ts`).

**Lock ordering and the close invariant**: the session advisory lock
(`pg_advisory_xact_lock`, Tier 1.5) is acquired by every path that can
create, retain, or recreate an active `SeatingAssignment`, and by
open/close/cancel themselves — before any Tier 2 (capacity) or Tier 3
(seating-resource) lock. Closing is blocked **only** by an active
(`Assigned`/`Seated`) `SeatingAssignment` for the session's own derived
service/date (never by `Reservation` or `CapacityCommitment` state); a
successful close is proven, by direct post-close query, to leave zero
active assignments for that service/date, every time, under genuine
concurrent contention with every gated action (duplicate-create,
open-vs-cancel, and six distinct close-vs-{immediate-assign,
pre-assign, mark-seated, move, modify-revalidation, walk-in} races, plus
open-vs-walk-in) — see `tests/integration/service-session-lifecycle.test.ts`
and `tests/integration/service-session-enforcement.test.ts`'s own
concurrency-proof sections.

## Enforcement, exactly

- **Immediate walk-in, immediate assignment, and mark-seated** all
  require the derived session to be `Opened`; any other state (absent,
  `Created`, `Closed`, `Cancelled`) is rejected with a typed
  `SESSION_NOT_OPEN` outcome, with zero partial writes on rejection
  (proven for both `Reservation` and `CapacityCommitment` on the walk-in
  path specifically).
- **Pre-assignment** is allowed when the session is absent, `Created`,
  or `Opened`, and rejected only for `Closed`/`Cancelled`.
- **Move** and **modify-time seating revalidation** both participate in
  the session lock (so they serialize correctly against a concurrent
  close) but are **not** session-status gated — they succeed regardless
  of the target session's state, including when it has already `Closed`.
- **Cleanup/release paths** — `releaseNoShow`, `cancelWithCapacity`'s
  seating release, `completeWithCapacity`, and mark-seated's own
  idempotent already-`Seated` no-op — all remain available after the
  session has `Closed`, proven by forcing a session directly to `Closed`
  (bypassing the normal gate) while an assignment is still active, then
  confirming each cleanup path still succeeds and correctly clears it.

## API and pilot, exactly

**Five lifecycle routes**: `GET /service-sessions?serviceDate=YYYY-MM-DD`
(bounded read, added in P2C-2A — see below), `POST /service-sessions`,
`POST /service-sessions/:id/open`, `.../close`, `.../cancel`.
`requireStaffSession` for the read; the existing, already-registered
`Permission.CapacitySettingsManage` (Owner + Manager, the established
`/closing-days` precedent) for every mutation — no new permission was
introduced.

**The date-bounded read contract (P2C-2A)**: `serviceDate` is mandatory,
strict `YYYY-MM-DD`, and calendar-valid (a reconstruct-and-compare check
— mirroring this codebase's own `parseStrictSince`, used for
`GET /security-events`'s `since` parameter — rejects a syntactically-shaped
but impossible date like `2026-02-30` rather than letting `Date` silently
roll it over). Missing, repeated (array-valued), malformed, or impossible
values all return `400`. A valid read is bounded server-side to exactly
the requested `serviceDate` (`WHERE serviceDate = ...`), ordered
deterministically (`serviceCode` ASC, then `id` ASC). The previous
unbounded `list()` method (repository, service, and its one caller) was
removed entirely rather than left dormant.

**Pilot**: a "Servicesessies" panel shows both canonical slots
(`lunch`/`dinner`) for the Dagoverzicht date, their authoritative state,
and the one valid action per state (Create / Open+Cancel / Close / none)
— every mutation re-validated server-side regardless of what the panel
predicts. The daily reservation list gained a "Dienst" column joining
each row to its session status via the same Amsterdam-derived
classification, never the stored `servicePeriodId`. Absolute reservation
timestamps are classified via `Intl.DateTimeFormat` pinned to
`Europe/Amsterdam` (never browser-local `getHours()`); the create-form's
own local `HH:mm` select value is classified by parsing the string
directly (never constructed into a `Date`, avoiding both the
browser-local-timezone ambiguity and a wrong-offset misread); both share
one `isLunchHour([12:00,16:00))` predicate. A monotonic request token
discards a stale response for a date the user has since navigated away
from, and the requested date is captured before the fetch, never
re-read after it.

## Development activation

Migration `20260910153637_add_service_session` **is applied** to
`helix_reservations_dev` (R1.6-P2C-1A, 2026-09-11) — the table exists
with the committed schema. As of this writing, `helix_reservations_dev`
contains **zero** `ServiceSession` rows. **No real staff workflow has
been exercised against it** — no session has been created through the
pilot or the API in the development environment, no human has logged in
and clicked through the Servicesessies panel, and this milestone has not
been deployed anywhere.

## Four distinct concerns — kept separate, not conflated

1. **Canonical reservation Service classification** (R1.6-P2B) — a
   two-value, code-level, time-derived label used to validate
   `Reservation.servicePeriodId`. Unaffected by this milestone.
2. **Booking-window eligibility** (`ServicePeriod.ts` +
   `ServicePeriodService.ts`, R1.6-A/R1.6-C0) — "which start times are
   bookable," keyed by `CapacityPoolId` + local date. Unaffected by this
   milestone; confirmed unchanged by the full regression run.
3. **The persisted operational `ServiceSession` lifecycle** (this
   milestone) — a real, dated, per-`(serviceCode, serviceDate)` row with
   an enforced `Created`/`Opened`/`Closed`/`Cancelled` state machine,
   now wired into live enforcement and exposed in the pilot. Real,
   enforced, tested, pushed.
4. **The persisted `Service`-definition capability (CAP-D02.01)** and
   **future active-floorplan selection** (part of CAP-D02.02's own
   fuller definition) — **neither exists**. No reusable, staff-manageable
   `Service` entity; no reservation-to-session foreign key or persisted
   linkage; no mechanism to select or apply a floorplan version per
   session. `CAP-D03.02` (Floorplan Management) — itself still
   `Designed` — remains a prerequisite for that last piece.

**Therefore: the complete CAP-D02.02 capability, as registered, is not
yet delivered.** This milestone is a real, substantial, but partial
slice of it — the operational session lifecycle and its enforcement —
not the whole capability. `CAP-D02.01` and `CAP-D02.02` both remain
`Designed` in the capability registry; neither capability's
`delivery_status` is changed by this report.

## Accepted limitations (preserved, not resolved by this report)

- **No reservation-to-session relationship is persisted.** A
  `ServiceSession` row and a `Reservation` row are joined only at read
  time, by derivation (`deriveServiceCode` + `toLocalServiceDate`) — there
  is no foreign key, and none is planned by this milestone.
- **No active-floorplan selection exists.** `CAP-D03.02` (Floorplan
  Management) remains `Designed`; a `ServiceSession` carries no floorplan
  version reference.
- **No persisted `Service` definition exists.** `CAP-D02.01` remains
  `Designed`; `serviceCode` stays the same closed, code-level two-value
  set R1.6-P2B introduced.
- **No human/browser smoke test has been performed.** No staff member
  has opened the pilot and exercised session creation/open/close/cancel
  against a real running dev deployment.
- **Nothing in this milestone has been deployed anywhere.**
- **Development contains zero `ServiceSession` rows** despite the
  migration being applied — the schema is activated, the workflow is
  not yet exercised.

## Automated verification — what this report can and cannot claim

**Confirmed by automated evidence, at final state (both commits
applied):**
- Domain: `tests/domain/service-session.test.ts` (7 tests) — the
  exhaustive valid/invalid transition matrix.
- Lifecycle/concurrency: `tests/integration/service-session-lifecycle.test.ts`
  (10 tests) — uniqueness, idempotent-repeat stability, invalid
  transitions, and two genuine-concurrency races (duplicate creation;
  open-vs-cancel).
- Enforcement/concurrency: `tests/integration/service-session-enforcement.test.ts`
  (29 tests) — the full status-gating matrix for every call site, six
  further genuine-concurrency races (close vs. immediate-assign,
  pre-assign, mark-seated, modify-revalidation, walk-in; open vs.
  walk-in), the historical-noncanonical proof, release-only-modify and
  no-show/complete-after-closure proofs, and zero-partial-write
  assertions.
- Timezone: `tests/domain/service-time.test.ts` (15 tests, 4 new) —
  `localDateToPaddedUtcRange` containment at Amsterdam local midnight on
  both 2026 DST transition dates.
- API: `tests/api/service-sessions.test.ts` (36 tests) — the full
  permission/authentication matrix, strict validation, the typed
  outcome-to-status-code mapping, and the bounded-read contract
  (missing/repeated/malformed/impossible `serviceDate`, cross-date
  isolation, both-codes-returned, deterministic ordering).
- Wiring: `tests/api/server-wiring.test.ts` (16 tests) — production
  composition proof (shared `PrismaClient`, real repository/service
  wired into both orchestrators, deployment-precondition documented).
- Pilot: `tests/pilot/service-session-ui.test.ts` (68 tests) — panel
  wiring, action-visibility matrix, exact endpoints/bodies, confirmation
  ordering, double-submit prevention, refresh-on-success, safe typed
  messages, 403 handling, stale-response protection, and the
  live-executed Amsterdam-classification proofs.
- Full isolated suite at final state: **84 test files / 1330 tests / 0
  failed / 0 skipped.**
- Typecheck: clean.

**NOT confirmed — explicitly out of scope for this report:**
- No human/browser smoke test of any Servicesessies action.
- Nothing deployed anywhere; no production activation beyond the
  wiring itself being present in `api/server.ts`.
- CAP-D02.01/CAP-D02.02's remaining owned rules (persisted Service
  definition, active-floorplan selection, reservation-to-session
  relationship) remain unimplemented — this report does not claim
  otherwise.
- P1-B11 is untouched and remains blocked, per standing instruction.

## Documentation reconciled alongside this report (R1-DOC-5)

- `capability-registry.yaml.md`: an evidence note added under
  `CAP-D02.02` describing this delivered slice; `delivery_status` left
  unchanged (`Designed`) for both `CAP-D02.01` and `CAP-D02.02`.
- `README.md`: the stale "no Service or ServiceSession table exists; no
  lifecycle states... exist" claim (from R1-DOC-2) corrected to reflect
  what R1.6-P2C actually delivered, while preserving the still-accurate
  remaining gaps.
- `PILOT.md`: the equivalent stale limitation corrected; a new "Service
  Session status" section added, matching the existing "Security Events
  status" section's automated-only, no-human-smoke-test posture.
- This report itself — the fourth of the four files authorized for
  R1-DOC-5.
