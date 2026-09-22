# R1.5 — Floorplan Versioning, ServiceSession Snapshot, and Membership Enforcement Implementation Report

Mode: IMPLEMENTATION REPORT — consolidates work already implemented,
tested, committed, and pushed across four increments on
`feat/ec-002-visibility-baseline`. Written as R1-DOC-6 (Floorplan Snapshot
and Membership Documentation Reconciliation), alongside
`capability-registry.yaml.md`'s `CAP-D03.02`/`CAP-D02.02`/`CAP-D03.03`
evidence notes, `README.md`/`PILOT.md`'s correction of the now-stale
"active-floorplan selection does not exist" claim, and a dated
reconciliation section appended to
`R1_6_P2C_SERVICE_SESSION_IMPLEMENTATION_REPORT.md`. No production code,
tests, schema, migrations, configuration, or capability `delivery_status`
is changed by this document.

## Scope and milestone timeline

| Commit | Date | Subject | What it delivered |
|---|---|---|---|
| `d7f57ad2fff110e35a51ca2d68edf93bf26d21eb` | 2026-09-14 | feat(floor): add versioned floorplan foundation | Persisted `Floorplan`/`FloorplanVersion`/Table-membership model, `Draft`→`Published`→`Archived` lifecycle, nine management HTTP endpoints |
| `2647c700dcd0218afab07f29029c80200268d78f` | 2026-09-15 | chore(floor): add main floorplan bootstrap | Canonical Main Floor (`main-floor`) revision 1 bootstrapped in `helix_reservations_dev` |
| `24aaef7d8086ab75bb86abb7994cd09e53fe7c9b` | 2026-09-17 | feat(service): snapshot floorplan on session open | `ServiceSessionService.open()` immutably snapshots a specific Published `FloorplanVersion` id |
| `fe7372732ded1439eccc57adbdef200cc9f9267a` | 2026-09-20 | feat(seating): enforce session floorplan membership | Floorplan-membership enforcement (R1.5-P2D) across every live resource-selection write, plus Open-time active-assignment revalidation |

All four hashes, dates, and subjects were re-verified directly from `git
show -s --format=...` immediately before this report was written, not
transcribed from memory or an earlier document. Internal milestone labels
used in code comments (`R1.5-P2B` for the first, `R1.5-P2C` for the
second, `R1.5-P2D` for the fourth) are the codebase's own terminology —
distinct from the unrelated `R1.6-P2C` label used for the separate
ServiceSession-lifecycle milestone documented in
`R1_6_P2C_SERVICE_SESSION_IMPLEMENTATION_REPORT.md`.

Also relevant, database-only, no Git hash (per Chief Engineer instruction,
no hash is invented for these — they are activation facts, not commits):

- The Floorplan-versioning migration (`20260914073245_add_floorplan_versioning`)
  and the ServiceSession-floorplan-snapshot migration
  (`20260917081629_add_service_session_floorplan_snapshot`) are both
  applied to `helix_reservations_dev`.
- The canonical Main Floor, revision 1, is bootstrapped in
  `helix_reservations_dev` (Published, default, 23 Table memberships).
- No `ServiceSession` has been created or opened in
  `helix_reservations_dev`.
- No real authenticated browser workflow or deployment of any of this has
  occurred.

## Persisted model and lifecycle

`domain/floor/Floorplan.ts` (`d7f57ad`): `Floorplan { id, name,
defaultVersionId, createdAt }`, `FloorplanVersion { id, floorplanId,
revision, status, publishedAt, createdBy, createdAt }`,
`FloorplanVersionResource { id, floorplanVersionId, tableId }` — Table-level
membership only; a Teppanyaki grill Table's membership implicitly covers
its child Seats, and there is no independent Seat-membership concept
anywhere in the schema or domain model. `FloorplanVersionStatus = "Draft"
| "Published" | "Archived"`, with exactly two valid transitions
(`isValidFloorplanVersionTransition`): `Draft → Published`, `Published →
Archived`. No reverse transition, no direct `Draft → Archived`, and no
re-`Draft` of a Published/Archived version — a correction is always a new
version/revision, never a mutation of an already-Published row (the same
discipline `ServiceSession`'s own idempotent-repeat rule already follows).
`MAIN_FLOORPLAN_ID = "main-floor"` is the single definition site for "the
one canonical Floorplan this pilot uses" — every module that needs to know
which Floorplan imports this constant rather than repeating the literal.

## Default/version semantics

`Floorplan.defaultVersionId` is a separate fact from a version's own
immutability lifecycle (R1.5-P2A correction, preserved in the file header
comment: "being the default is a separate fact from a version's own
status"). Setting a default enforces, at the database level, that the
chosen version belongs to the same Floorplan
(`VERSION_BELONGS_TO_DIFFERENT_FLOORPLAN`, `api/app.ts`'s `POST
/floorplans/:id/default-version`) and that it is `Published`
(`VERSION_NOT_PUBLISHED` otherwise). Archiving the current default is
rejected (`CANNOT_ARCHIVE_DEFAULT_VERSION`). Membership replacement
(`PUT /floorplan-versions/:id/resources`) is atomic and restricted to
`Draft` versions only (`VERSION_NOT_DRAFT` otherwise) — a full,
replace-the-whole-set operation, not an incremental add/remove. Publishing
a version with no members is rejected (`NO_MEMBERS`).

## ServiceSession snapshot semantics (`24aaef7`)

`ServiceSessionService.open()` reads the Floorplan's current default at
the moment of a successful `Created → Opened` transition, verifies it is
`Published` and belongs to this Floorplan (`NO_DEFAULT_FLOORPLAN_VERSION`
otherwise), and stores its id as `ServiceSession.floorplanVersionId` in
the same transaction as the status write. This snapshot is **immutable**
once taken: it is never re-read or re-resolved afterward, even if the
Floorplan's default subsequently changes. A repeated `open()` call on an
already-`Opened` session is idempotent — it returns the original session
unchanged, preserving the original snapshot, timestamp, and version; it
never re-stamps a new snapshot from a now-different default.

## Membership rules for Tables and Seats (`fe73727`, R1.5-P2D)

`application/availability/FloorplanMembershipGate.ts` is the shared
primitive: `resolveEffectiveFloorplanVersionId` says a non-null
`ServiceSession` snapshot always wins over the Floorplan's current,
mutable default — never the reverse. When no snapshot exists yet (the
session is absent or still `Created`), the current eligible Published
default is used **provisionally**. `resolveMembership` reads that
effective version's member Table ids; if no eligible version can be
resolved at all (no default, non-Published default, or a `Cancelled`
session with no prior snapshot), the result is the typed
`NO_ELIGIBLE_FLOORPLAN_VERSION` — never a silently-empty or
silently-permissive membership set.

In `SeatingOrchestrator.buildCandidates`, a Table selector's own id, and a
Seat selector's **parent Table id** (never the raw Seat id — this mirrors
`resolveLockTableIds`'s own canonical resource-lock resolution), are
checked against the effective membership set to produce each candidate's
`withinFloorplanMembership` boolean. `SeatabilityEvaluator.evaluateSeatability`
checks every candidate in one pass, in order, and returns the first
failing reason — including the new `RESOURCE_OUTSIDE_FLOORPLAN_MEMBERSHIP`
— before any write occurs. Because no assignment row is written until the
full candidate list is `SEATABLE`, a mixed member/non-member multi-resource
selection fails atomically: no partial write for the in-membership member(s)
of a rejected mixed selection.

`membershipTableIds === null` (no `FloorplanRepository` wired) makes every
candidate `withinFloorplanMembership: true`, byte-identical to pre-R1.5-P2D
behavior — enforcement is opt-in by dependency wiring, not a hardcoded
assumption.

## Provisional pre-assignment and Open-time validation invariant

A pre-assignment made while a session is absent or `Created` is checked
against the Floorplan's *current* default (there is no snapshot yet to
check against). This is provisional by construction — the default can
change before the session is ever opened. `ServiceSessionService.open()`
closes that gap: before writing the `Opened` transition, it lists every
currently-active (`Assigned`/`Seated`) assignment's resource rows for the
session's exact `(serviceCode, serviceDate)`, resolves the Floorplan's
current default's own membership (the version about to be snapshotted),
and rejects the whole Open if any active assignment's Table falls outside
it — `{ type: "ACTIVE_ASSIGNMENTS_OUTSIDE_FLOORPLAN", activeAssignmentCount
}`, HTTP 409. No new resource lock is required for this check: every path
capable of creating, retaining, or recreating an active `SeatingAssignment`
for this session key already acquires the same session advisory lock
before doing so, so none can interleave with Open's own hold of it.

`activeAssignmentCount` counts **distinct assignments** (a `Set` keyed by
assignment id, not resource rows — a multi-resource assignment spanning
several Tables/Seats counts once), and the response exposes only `type`
and `activeAssignmentCount` — no internal identifiers
(`api/app.ts`: `res.status(409).json({ type: "ACTIVE_ASSIGNMENTS_OUTSIDE_FLOORPLAN",
activeAssignmentCount: result.activeAssignmentCount })`). A repeated Open
on an already-`Opened` session skips this revalidation entirely (returns
the original snapshot, per the idempotent-repeat rule above) — it is
checked exactly once, at the moment of the real `Created → Opened`
transition.

## Operation-by-session-state enforcement matrix

| Operation | Session-status gate | Membership check |
|---|---|---|
| Immediate assign | Requires `Opened` | Snapshot, enforced |
| Immediate walk-in (through assign) | Requires `Opened` | Snapshot, enforced |
| Mark Seated | Requires `Opened` | Not revalidated |
| Pre-assign | Allowed absent/`Created`/`Opened`; rejected `Closed`/`Cancelled` | Snapshot once taken, else current default (provisional); enforced |
| Move (destination) | Not status-gated (lock-only participation) | Snapshot or provisional default; enforced |
| Modify-time seating revalidation | Not status-gated | Snapshot or provisional default; enforced |
| No-show release | Available regardless of status, incl. after `Closed` | Not revalidated |
| Cancel-release | Available regardless of status | Not revalidated |
| Completion-release | Available regardless of status | Not revalidated |
| Open (`Created` → `Opened`) | N/A — this is the transition | Validates **all** currently-active assignments atomically against the version about to be snapshotted; rejects on any violation |

## Lock order

`Reservation → Floorplan → ServiceSession → Capacity/date → Seating
parent-Table` — Tier 1 (Reservation) → Tier 1.4 (`FLOORPLAN_LOCK_NAMESPACE`,
`domain/availability/LockKey.ts`) → Tier 1.5
(`SERVICE_SESSION_LOCK_NAMESPACE`) → Tier 2 (capacity pool/date) → Tier 3
(seating resource, always the parent Table). Verified directly in code:

- `AvailabilityOrchestrator.modifyWithCapacity` resolves Floorplan
  membership and locks the ServiceSession (Tier 1.4 then Tier 1.5) before
  taking any Tier 2 capacity/date lock — after the Tier 1 reservation
  lock, which is always first.
- `revalidateOrReleaseForModify` receives pre-resolved membership as a
  plain value and acquires neither the Floorplan nor the ServiceSession
  lock itself — by its own doc comment, precisely so this ordering can
  never be violated regardless of call site.
- `SeatingOrchestrator.assignSeating`/`moveSeating` acquire the Floorplan
  lock (Tier 1.4) unconditionally before the ServiceSession lock (Tier
  1.5), even when the session is already `Opened` and the provisional
  default read is not strictly needed — by Chief Engineer directive,
  peeking at session status before deciding whether to take the lock
  would break the fixed ordering this lock exists to preserve.
- `ServiceSessionService.open()` acquires the Floorplan lock, then the
  session lock, then validates assignments and writes the snapshot — all
  in the same transaction.

## Typed outcomes

- `NO_ELIGIBLE_FLOORPLAN_VERSION` — no ServiceSession snapshot and no
  eligible (Published, same-Floorplan) default could be resolved at all.
  Surfaced by `SeatabilityOutcome` before any candidate is even built, and
  by `MembershipResolution` from `resolveMembership`.
- `RESOURCE_OUTSIDE_FLOORPLAN_MEMBERSHIP` — a specific candidate resource
  (identified by `resourceLabel`) failed the membership check during
  `evaluateSeatability`, after passing every earlier check (found, active,
  area match, type match, not blocked, not overlapping).
- `ACTIVE_ASSIGNMENTS_OUTSIDE_FLOORPLAN` — returned only by
  `ServiceSessionService.open()`, carrying `activeAssignmentCount` (a
  distinct-assignment count, no identifiers), mapped to HTTP 409.

## API/pilot boundary

Floorplan management's nine endpoints (`api/app.ts`, all
`requireStaffSession`; mutations additionally gated by
`Permission.CapacitySettingsManage`) are HTTP-only:

1. `GET /floorplans`
2. `GET /floorplans/:id/versions`
3. `GET /floorplan-versions/:id`
4. `POST /floorplans`
5. `POST /floorplans/:id/versions`
6. `PUT /floorplan-versions/:id/resources`
7. `POST /floorplan-versions/:id/publish`
8. `POST /floorplans/:id/default-version`
9. `POST /floorplan-versions/:id/archive`

None of these nine have any `public/pilot.html` panel — Floorplan/version
administration is not part of this pilot's UI surface, and this report
makes no claim otherwise. Membership enforcement itself has no dedicated
UI surface either; it is a silent constraint on the existing Floor &
Seating and Servicesessies actions already documented in `PILOT.md`.

## Automated verification totals

Full isolated suite at final state (re-run for this report,
`helix_reservations_dev` unmodified): **91 test files / 1512 tests / 0
failed / 0 skipped**. Typecheck: clean (`tsc --noEmit`, zero errors).

Directly relevant files, counts re-verified by an isolated run immediately
before this report was written:

- `tests/integration/floor-seating-floorplan-membership.test.ts` — 32
  tests (new), including five genuine-concurrency proofs: pre-assign vs.
  Open serializing on the shared Floorplan-then-ServiceSession lock pair;
  a default change racing a provisional pre-assignment never producing a
  torn membership decision; assign-after-Open always using the stored
  snapshot regardless of a concurrent default change on the same
  Floorplan lock; a concurrent release-only operation during Open's
  validation window never letting an out-of-membership assignment survive
  an Opened session; Mark-Seated vs. Move retaining pre-existing
  serialization/row-count invariants with membership enforcement wired.
- `tests/api/service-sessions.test.ts` — 39 tests, including the new
  `ACTIVE_ASSIGNMENTS_OUTSIDE_FLOORPLAN`/409 response-shape assertions.
- `tests/api/server-wiring.test.ts` — 28 tests, production composition
  proof extended to the Floorplan dependency block.
- `tests/domain/seatability-evaluator.test.ts` — 17 tests, covering the
  two new outcome types and per-candidate ordering.
- `tests/integration/floor-seating-failure-injection.test.ts` — 7 tests,
  unaffected behavior reconfirmed with membership wired.
- `tests/integration/support/floorTestHarness.ts` — shared test harness,
  extended with Floorplan/membership fixture helpers (`freshFloorplanId`,
  `createPublishedFloorplanFixture`), used by isolated per-test Floorplan
  fixtures rather than the literal `main-floor` row.

## Development activation state

- Migrations applied to `helix_reservations_dev`: 11 total (11 applied /
  0 rolled back), including
  `20260914073245_add_floorplan_versioning` and
  `20260917081629_add_service_session_floorplan_snapshot`.
- Canonical Main Floor: `id = "main-floor"`, default version
  `main-floor-v1`, revision 1, status `Published`, exactly 23
  `FloorplanVersionResource` (Table-membership) rows.
- `ServiceSessions = 0` — no session has been created or opened.
- All other operational counts (Reservations, Contacts, Tables, Seats)
  unchanged by this milestone or by this documentation pass.
- No real authenticated browser workflow has been exercised against any
  of this. Nothing here has been deployed anywhere.

## Accepted limitations

- **No Floorplan administration pilot UI.** All nine management endpoints
  are API-only.
- **No persisted reservation-to-session relationship** — unaffected by
  this milestone; still derivation-only, at read time (unchanged from
  `R1_6_P2C_SERVICE_SESSION_IMPLEMENTATION_REPORT.md`).
- **No persisted `Service` definition** (`CAP-D02.01`) — unaffected;
  `serviceCode` remains the same closed, code-level two-value set.
- **No human/browser smoke test has been performed** of Floorplan
  authoring, publishing, default-version selection, session Open
  snapshotting, or any membership rejection.
- **Nothing in this milestone has been deployed anywhere.**
- **`helix_reservations_dev` contains zero `ServiceSession` rows** despite
  both relevant migrations being applied — the schema and canonical data
  are activated, the workflow is not yet exercised.
- **P1-B11 remains incomplete and untouched**, per standing instruction.

## Automated versus human-tested — explicit distinction

| | Status |
|---|---|
| Domain/application/API automated tests | Exhaustive — see totals above |
| Real-PostgreSQL concurrency/lock-order proofs | Present (five new races, plus pre-existing ones reconfirmed) |
| Development schema activation | Complete (11/11 migrations applied) |
| Development canonical data activation | Complete (Main Floor revision 1: Published, default, 23 memberships) |
| Development workflow data | None (`ServiceSessions = 0`) |
| Human/browser smoke test | None performed |
| Deployment | None |

Automated-test-green and typecheck-clean are necessary but explicitly
**not sufficient** claims of operational readiness — this report does not
conflate the two, matching the same posture already established for Floor
& Seating, Security Events, and Service Session in `README.md`/`PILOT.md`.

## Capability-status rationale

**`CAP-D03.02` (Floorplan Management) stays `Designed`.** Delivered:
persisted model, `Draft`→`Published`→`Archived` lifecycle, atomic
membership replacement for Draft versions, default-version selection with
same-Floorplan database enforcement, nine authenticated management
endpoints, the canonical Main Floor bootstrap, and the fact that
ServiceSession now snapshots a specific Published version of it. Missing:
a pilot UI for Floorplan/version administration, human workflow
verification, deployment, and any additional registry-defined
requirements not actually evidenced by code or tests examined for this
report.

**`CAP-D02.02` (Service Period Management) stays `Designed`.** Delivered
(this milestone, on top of R1.6-P2C's own persisted lifecycle): an
immutable FloorplanVersion snapshot on Open, Open-time validation of
active pre-assignments, and membership enforcement in availability and
resource-selection writes, all under proven lock-order and concurrency
guarantees. Still incomplete: no persisted Service definition
(`CAP-D02.01`), the reservation-to-session relation remains derived, not
persisted, no ServiceSession exists in development, no human authenticated
workflow, no deployment.

**`CAP-D03.03` (Table and Seat Management) status is unchanged (`Pilot`)** —
no status change is warranted by, or claimed for, this milestone; its
existing resource-activation evidence is strengthened, not superseded:
Table/Seat assignment now additionally respects the ServiceSession's
immutable FloorplanVersion membership, Teppanyaki Seat membership derives
through its parent Table, pre-Open provisional assignments are revalidated
atomically at Open, and release-only operations remain available and
unrevalidated.

No `delivery_status` value is changed by this report or by any file it is
part of (R1-DOC-6).
