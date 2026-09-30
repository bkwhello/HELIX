# R1.6-P2E — Service Period Management Completion Audit and Pilot Promotion Report

Mode: READ-ONLY COMPLETION AUDIT / DOCUMENTATION-ONLY PROMOTION — no
production code, test, schema, or migration file was created, edited, or
executed with mutation in the course of this audit. Written as part of
R1-DOC-12 (Service Period Management Documentation Reconciliation),
alongside `capability-registry.yaml.md`'s `CAP-D02.02` evidence note (the
`Designed` → `Pilot` promotion this audit's findings make possible) and
`README.md`/`PILOT.md`'s correction of stale "remains `Designed`"/"active
floorplan selection does not exist"/"reservation-to-session relationship
is missing" claims.

## Audit scope and authoritative registry contract

Per the capability registry (`capability-registry.yaml.md`), `CAP-D02.02`'s
full contract is:

| Field | Value |
|---|---|
| id | `CAP-D02.02` |
| name | Service Period Management |
| type | Core |
| purpose | "Represent a dated operational service period in which reservations, seating resources, and live service activity occur." |
| owns.concepts | Service Period; Service Period Status |
| owns.rules | service period creation; service period opening; service period closing; active floorplan selection |
| owns.events | ServicePeriodCreated; ServicePeriodOpened; ServicePeriodClosed; FloorplanVersionApplied |
| depends_on | `CAP-D02.01`; `CAP-D03.02` |
| provides_to | `CAP-D01.01`; `CAP-D02.03`; `CAP-D04.01`; `CAP-D04.04`; `CAP-D08.03` |
| operational_maturity | M1 |

No other repository artifact extends this contract: no dedicated
engineering folder exists for `CAP-D02.02` under
`solutions/reservations/capabilities/active/` (only `CAP-D01.01` and
`CAP-D05.01` have one), and `CAP-D01.01`'s own formal `acceptance.md`,
`capability.md`, `event-model.md`, `interaction-model.md`, and
`rule-model.md` make zero mention of `ServiceSession` (confirmed by direct
inspection, not assumed).

## Historical delivery sequence (every hash/date/subject verified directly via `git log`)

| Milestone | Commit | Date | Subject |
|---|---|---|---|
| R1.6-P2A | *(no standalone commit/file — a design-only gate recorded inline in `R1_6_P2B_...md`)* | — | — |
| R1.6-P2B | `e7f079fc2fccc2f2a8117678413930cc3f5b99b0` | 2026-09-10 | `feat(service): canonical service code boundary` (code-level `lunch`/`dinner` classification only) |
| R1.6-P2C-1 | `bea39228d706df7a9a89d1631a10899b14833817` | 2026-09-12 | `feat(service): add operational session enforcement` |
| R1.6-P2C-2/2A | `1c7b7192e0929153c9f8951e3ebf8f9fc1ed5973` | 2026-09-13 | `feat(service): expose session operations in pilot` |
| Floorplan foundation | `d7f57ad2fff110e35a51ca2d68edf93bf26d21eb` | 2026-09-14 | `feat(floor): add versioned floorplan foundation` |
| Main Floor bootstrap | `2647c700dcd0218afab07f29029c80200268d78f` | 2026-09-15 | `chore(floor): add main floorplan bootstrap` |
| ServiceSession floorplan snapshot | `24aaef7d8086ab75bb86abb7994cd09e53fe7c9b` | 2026-09-17 | `feat(service): snapshot floorplan on session open` |
| Floorplan-membership enforcement | `fe7372732ded1439eccc57adbdef200cc9f9267a` | 2026-09-20 | `feat(seating): enforce session floorplan membership` |
| Table-inventory read API | `72ab91d122f3fef72dabc4a9fde4ec9f273642df` | 2026-09-22 | `feat(floor): expose table inventory` |
| Floorplan admin pilot UI | `ffbb68b10f2a49462d3726acc70a0a193e70ef4e` | 2026-09-22 | `feat(floor): expose floorplan administration in pilot` — `CAP-D03.02` promoted `Designed` → `Pilot` (R1-DOC-7) |
| R1.6-P3A–P3G | (see `R1_6_P3_...md`/`R1_6_P3G_...md`) | 2026-09-23 through 2026-09-29 | Persisted Service catalog, operating intervals, default durations, audit trail — `CAP-D02.01` promoted `Designed` → `Pilot` (R1-DOC-11) |

**What P2A left undecided:** whether the Service axis is meal-based or
area-flavored; whether `Service` should be code-level-only or persisted
now; whether identity needs an area dimension; whether a `ServiceSession`
lifecycle was worth building in isolation.

**What P2B established:** the code-level `lunch`/`dinner` classification
only — explicitly not `CAP-D02.02`, not a persisted `Service`.

**What P2C delivered:** the real, persisted `ServiceSession` table,
`Created→Opened→Closed/Cancelled` lifecycle, Tier-1.5 advisory lock, and
the five-route HTTP API — a substantial slice of three of `CAP-D02.02`'s
four registered rules (creation, opening, closing), explicitly NOT active
floorplan selection or the reservation-to-session relationship at that
time.

**What the floorplan snapshot/membership work subsequently delivered:**
`ServiceSession.open()` gained an immutable Published-FloorplanVersion
snapshot and atomic active-assignment-vs-membership validation — this
directly implements the fourth registered rule, "active floorplan
selection," inside the same `open()` method P2C already built.

**Later work superseding earlier assumptions:** P2C's own registry
comments (R1-DOC-5, R1-DOC-6) both cited "`CAP-D03.02`, itself still
`Designed`" and "`CAP-D02.01`'s own persisted Service definition still
does not exist" as reasons the capability remained incomplete — both
premises are now false (`CAP-D03.02` → `Pilot` 2026-09-22; `CAP-D02.01` →
`Pilot` 2026-09-29/30). Neither registry comment had been updated to
reflect this until the present audit.

**The four P2A decisions, resolved:** all four are closed — Service
identity is meal-based with no area dimension (Sushi/Teppanyaki remain
`CAP-D02.03` `CapacityPool` concepts, confirmed structurally, never
folded into `ServiceCode`); Service definitions are persisted
(`CAP-D02.01`, `Pilot`); the `ServiceSession` lifecycle has real,
demonstrated operational value (see "Seating enforcement" below) and is
fully delivered.

## Rule-by-rule implementation evidence

**service period creation** — `ServiceSessionService.create()`
(`application/availability/ServiceSessionService.ts`): validates
`serviceCode`/`serviceDate` shape, runs inside one transaction, acquires
the Tier-1.5 session lock BEFORE the existence check (so two concurrent
creates for the identical key serialize — the second always observes the
first's committed row and returns `ALREADY_EXISTS`, never an unhandled
duplicate-key exception), backed by a real `@@unique(serviceCode,
serviceDate)` database constraint regardless.

**service period opening** — `ServiceSessionService.open()`: dedicated
method (not folded into the shared `transition()` helper, because it
needs a second lock and a Floorplan read). Lock order: Floorplan (Tier
1.4) then session (Tier 1.5) — the fixed global order this codebase
always uses, so it can never form a wait-cycle with `FloorplanService`'s
own mutations or with `close()`/`cancel()`. Idempotent repeat preserves
the ORIGINAL snapshot exactly, never re-reading the current default.

**service period closing** — `ServiceSessionService.close()`/`cancel()`
via the shared private `transition()` method: session lock, idempotent
repeat (no write, no restamp, no version bump), `close()` specifically
blocked only by active `Assigned`/`Seated` seating assignments for the
derived service/date (Reservation/`CapacityCommitment` state never
blocks — an explicit, cited "Chief Engineer decision #12").

**active floorplan selection** — this is not a separate code path from
"opening" above: inside `open()`, before any write, the method resolves
the Floorplan's current default version, requires
`defaultVersion.status === "Published"` and that it belongs to the same
Floorplan (`NO_DEFAULT_FLOORPLAN_VERSION` otherwise), reads every
currently-active seating-assignment resource row for that exact
`(serviceCode, serviceDate)`, and rejects atomically
(`ACTIVE_ASSIGNMENTS_OUTSIDE_FLOORPLAN`, with a distinct-assignment count
only, no internal identifiers) if any claims a Table outside that
version's membership — only then does it write
`status: "Opened"`/`floorplanVersionId`/`openedAt` in one
version-checked `updateStatus` call.

## Lifecycle and lock ordering

Global lock order across this codebase (confirmed via `domain/availability/LockKey.ts`
and the code above): Reservation → Floorplan → ServiceSession →
Capacity/date → Seating parent-Table. Every one of the four
`ServiceSessionService` mutation methods runs inside its own
`transactionManager.runInTransaction()` call and acquires the session
lock (and, for `open()`, the Floorplan lock first) before any read or
write of the row it will mutate — never a bare unlocked read followed by
a separate write.

## Floorplan selection and immutable snapshot behavior

Once `open()` writes `floorplanVersionId`, that value is never re-read or
rewritten by anything — not a repeated `open()` call, not a later
Floorplan default change, not a full Floorplan archive. Seating enforcement
(`SeatabilityEvaluator`, `SeatingAvailabilityService`) honors that
snapshot — or, for a session still absent/`Created`, the Floorplan's
current eligible Published default, provisionally — for every live
resource-selection write: immediate assign, pre-assign, Move destination,
modify-time revalidation, and walk-in-through-immediate-assign. A Table
or Teppanyaki Seat (checked through its parent Table, never its own id)
outside that membership is rejected.

## Seating enforcement and close invariant

`close()` is blocked (`ACTIVE_ASSIGNMENTS_EXIST`) whenever at least one
active `Assigned`/`Seated` seating assignment exists for the session's
exact service/date — proven under GENUINE concurrency (not
`Promise.all()` timing alone) in
`tests/integration/service-session-enforcement.test.ts`: repeated,
deterministic races of Close-vs-Move, Close-vs-immediate-assignment,
Close-vs-pre-assignment, Close-vs-mark-seated, Close-vs-modify-revalidation,
and Close-vs-walk-in, each proven to resolve to exactly one of two valid
outcomes on whichever side wins the shared session lock, never both
succeeding and never corrupting the invariant. Mark Seated and every
release-only operation (no-show, cancel-release, completion-release)
remain available after closure, by design — release-only operations can
only shrink the active set the close-invariant checks, never grow it.

## HTTP API and pilot behavior

Five routes, confirmed directly in `api/app.ts`: `GET /service-sessions`
(`requireStaffSession` only — any authenticated staff member may read),
`POST /service-sessions` (create), `POST /service-sessions/:id/open`,
`POST /service-sessions/:id/close`, `POST /service-sessions/:id/cancel`
(all four mutations gated by the pre-existing `Permission.CapacitySettingsManage`
— no new permission). The "Servicesessies" pilot panel exposes both
canonical slots per Dagoverzicht date, each slot's authoritative state,
and the one valid action for that state, with the existing
confirm/in-flight-guard/stale-response-discard/safe-rendering protections
every other pilot panel already follows.

## Reservation relationship analysis

`Reservation.servicePeriodId` is a plain `String` (`prisma/schema.prisma:27`
— the P2B code classification); no `serviceSessionId` column or foreign
key exists anywhere in the schema (confirmed by direct inspection — zero
matches). The operational relationship used today (e.g., the daily list's
"Dienst" status column) is DERIVED: a Reservation's own service code and
date matched against the unique `ServiceSession` identity `(serviceCode,
serviceDate)` at read time — never ambiguous, because that pair carries a
real `@@unique` database constraint.

Every prior reference to this relationship was traced:
- `R1_6_P2B_...md`'s "Four distinct concerns" #4 (2026-09-10) — accurate
  statement that it did not exist yet.
- Registry `CAP-D02.02` R1-DOC-5/R1-DOC-6 comments (2026-09-12/13,
  2026-09-17/20) — repeatedly listed as "still missing," never as an
  explicit blocking requirement of any named rule or consumer.
- `README.md`/`PILOT.md` correction chains (through R1-DOC-8) — repeat
  the same observation, never separately resolved.
- `CAP-D01.01`'s formal engineering artifacts — zero mentions of
  `ServiceSession` anywhere.

No document, at any point, states this relationship as an explicit
`CAP-D02.02` owned rule, a requirement of any of the four registered
rules (each independently delivered without it — see above), or an
acceptance criterion of any consumer.

## The accepted Option 1 decision

**Chief-Engineer-accepted, final for this milestone:** a persisted
`Reservation.serviceSessionId` relationship is NOT required for
`CAP-D02.02` at Pilot maturity. The derived relationship through
`(serviceCode, serviceDate)` is sufficient for all four registered rules
and every current formal consumer contract. Immutable historical
provenance between a Reservation and the specific `ServiceSession` row it
was created against is a possible FUTURE requirement, not a current
capability rule — no capability is assigned ownership of that
hypothetical relationship now; the registry's own `ownership_rule`
applies once (if) it becomes an accepted business concept or requirement.

## Why a persisted FK is deferred

No registered rule needs it (§"Rule-by-rule implementation evidence" —
all four are delivered without it). No current formal consumer contract
needs it (`CAP-D01.01`'s own artifacts never mention `ServiceSession`).
The derivation is total and unambiguous by construction (the unique
constraint guarantees at most one match). Adding a stored FK now would
introduce schema surface, a migration, and a backfill/legacy-row decision
(the four pre-existing dev reservations) for a use case that has never
been concretely specified. This decision does not forbid a future FK —
it only declines to build one speculatively.

## Lifecycle-event reconstruction

No literal `ServicePeriodCreated`/`ServicePeriodOpened`/
`ServicePeriodClosed`/`FloorplanVersionApplied` domain-event objects are
emitted anywhere. `domain/availability/ServiceSession.ts` defines only a
`ServiceSessionStatus` enum (`Created`/`Opened`/`Closed`/`Cancelled`) and
a transition table (confirmed by direct inspection — no event class
exists in that file or anywhere else in `domain/availability/`). The
underlying business facts are fully reconstructable from persisted state
(`status`, `openedAt`, `closedAt`, `cancelledAt`, `floorplanVersionId`)
instead. This is the identical posture this registry's own `CAP-D03.02`
promotion already accepted (no literal Floorplan events either, per its
own R1-DOC-7 note).

## Dependency satisfaction

`CAP-D02.02.depends_on = [CAP-D02.01, CAP-D03.02]` — both confirmed
`Pilot` directly from the registry (`CAP-D02.01` line ~635; `CAP-D03.02`
its own block, `delivery_status: Pilot`) before this promotion.

## Automated test evidence

Directly re-run in this session, non-mutating, confirmed passing:

| File | Tests |
|---|---|
| `tests/integration/service-session-lifecycle.test.ts` | 47 |
| `tests/integration/service-session-enforcement.test.ts` | 29 |
| `tests/integration/floor-seating-floorplan-membership.test.ts` | 32 |
| `tests/api/service-sessions.test.ts` | 48 |
| `tests/pilot/service-session-ui.test.ts` | 83 |
| **Total (these five files)** | **239** |

Full isolated suite, run fresh as this audit's own baseline gate: **104
files / 2013 passed / 0 failed / 0 skipped**. Typecheck clean.

## Development state

`helix_reservations_dev`: 14/14 migrations applied, 0 pending;
`ServiceSessions = 0` (unchanged); Main Floor (`main-floor`) Published,
default, 23 Table memberships (unchanged); both canonical Services
unchanged; `SecurityEvents` count and non-sensitive fingerprint unchanged
from the prior milestone's own captured baseline. No development
`ServiceSession` was created, no development route was called, no
migration was applied, and no service was started in the course of this
audit or its documentation.

## Promotion rationale

Measured against this registry's own established meaning of `Pilot` (the
`CAP-D04.05`/`CAP-D03.02`/`CAP-D02.01` precedents — delivered and
automated-tested, code/UI-exposed, not necessarily human-exercised or
deployed): all four of `CAP-D02.02`'s registered owned rules are
delivered and automated-tested (§"Rule-by-rule implementation
evidence"); both registered dependencies are satisfied at `Pilot`; the
one previously-open scope question (the reservation-linkage
relationship) has been explicitly decided as outside the current Pilot
contract, not left ambiguous. `CAP-D02.02` is promoted `Designed` →
`Pilot`.

## Accepted Pilot-to-Active limitations

No authenticated human browser workflow has exercised the "Servicesessies"
panel or any `/service-sessions*` route against a running server; nothing
here has been deployed anywhere. These are accepted `Pilot → Active`
concerns, not blockers to reaching `Pilot` itself, consistent with every
prior promotion in this registry.

## Explicit exclusions

This report does NOT claim: a persisted `Reservation`↔`ServiceSession`
foreign key (none exists, none was added); literal emitted
`ServicePeriodCreated`/`ServicePeriodOpened`/`ServicePeriodClosed`/
`FloorplanVersionApplied` domain-event objects (none exist; state is
reconstructed); a development `ServiceSession` (development holds zero);
a human pilot run; a browser smoke test; deployment; a closed future
decision forbidding a persisted FK forever (the door remains open if a
concrete provenance use case is later approved).
