# CAP-D01.01 Reservation Management — Implementation

Implements the engineering artifacts in
`../capabilities/active/CAP-D01.01-reservation-management/`. This package
never depends on that folder at runtime — it is the target the code was
built to satisfy, verified through the tests in `tests/`.

## Stack

TypeScript / Node, chosen to match the existing `konnichiwa-kitchen`
(Next.js/Prisma) codebase rather than introducing a second language
ecosystem. Prisma against PostgreSQL (see `prisma/schema.prisma`) —
switched from local SQLite during CAP-D02.03 implementation, because that
capability's concurrency guarantees (`pg_advisory_xact_lock`, shared
interactive transactions) are PostgreSQL-specific. Express for the HTTP
API. Vitest for tests. No framework dependency in `domain/`.

## Engineering artifact → implementation mapping

| Engineering artifact | Implementation artifact |
|---|---|
| `capability.md` | `domain/aggregates/ReservationAggregate.ts` + application services |
| `state-model.md` | `domain/value-objects/ReservationStatus.ts` (transition table) |
| `rule-model.md` | `domain/rules/*.ts` |
| `event-model.md` | `domain/events/ReservationEvents.ts` |
| `interaction-model.md` | `domain/repositories/ReservationRepository.ts`, `application/ports/*.ts` |
| `acceptance.md` | `tests/acceptance/*.test.ts`, `tests/api/*.test.ts` |

This mapping does not vary between capabilities (see CA-001 §54, Phase 2 of the engineering brief for this capability).

## Status: Create Reservation and Floor & Seating are pilot-ready; the rest of the lifecycle is not yet

**Create Reservation** (domain rules, application orchestration, Prisma
persistence, and the `POST /reservations` / `GET /reservations` HTTP
endpoints) has been reviewed against `acceptance.md` §17's Pilot exit
criteria and hardened accordingly:

- All Critical acceptance scenarios for creation (AC01–AC04, AC39) are
  automated, at both the domain and HTTP layers (`tests/acceptance/creation.test.ts`,
  `tests/api/reservations.test.ts`).
- Failure and retry behaviour is covered by `tests/application/reservation-repository-contract.test.ts`
  and `tests/application/create-reservation-handler.test.ts`: a repeated
  `commandId` is idempotent, and a failed write never drains pending
  domain events. **Correction (added during CAP-D02.03 implementation,
  see `CAP_D02_03_IMPLEMENTATION_REPORT`):** this bullet previously
  claimed the concurrent-create race was "verified with `Promise.all`
  against Prisma directly" — that was inaccurate. The actual test
  (`reservation-repository-contract.test.ts`, "optimistic concurrency")
  simulates two sessions *sequentially* (session A saves, then session B
  saves with a now-stale version) against `InMemoryReservationRepository`,
  not a real, simultaneously-executing race against Prisma/PostgreSQL.
  That is legitimate coverage of the optimistic-concurrency *logic*, but
  it is not concurrency proof, and should never have been described as
  one. Genuine `Promise.all`-driven concurrent-transaction evidence
  against real PostgreSQL now exists in this codebase for the first
  time, for CAP-D02.03 — see `tests/integration/availability-concurrency.test.ts`.
  CAP-D01.01's own create-race path has not been given the same
  real-PostgreSQL treatment; that remains open work, not something to
  assume from this bullet.
- Authorization is tested (CAP-D01.01-R32 / AC39).
- Staff can discover what was created — `GET /reservations?date=` — a
  requirement of AC34 that had no implementation before this review.
- Unhandled errors return JSON (`api/app.ts`'s error middleware), not
  Express's default HTML error page.

**Confirm / Modify / Cancel / Complete** have the same domain-level rule
and authorization coverage as Create, and — as of R1.3-I2 — are also
covered at the HTTP layer (`tests/api/reservations.test.ts`, including the
capacity-aware `PATCH /availability/reservations/:id` and
`POST /availability/reservations/:id/cancel` paths) and wired into the
pilot UI (`public/pilot.html`'s confirm/edit/cancel/complete actions).
They have not, however, been through the same formal, written
acceptance.md §17 Pilot-exit-criteria review Create received above — see
"Known limitations" below.

**Floor & Seating** (CAP-D03.03/CAP-D04.01, implementation phases
P1-B1–P1-B9) closed its HTTP-exposure sequence at commit `582e655`: assign
(immediate), pre-assign, move, mark-seated, no-show release, the
floor/late-arrival view, Resource Blocking, and walk-in creation are all
live HTTP routes, permission-gated, wired into `public/pilot.html`, and
covered by the automated suite — including real-PostgreSQL concurrency
tests for every claim-contention combination identified during the
closure audit (`tests/integration/floor-seating-concurrency.test.ts`,
`tests/api/resource-blocks.test.ts`). **This is automated verification
only** — no human has yet run a smoke test of these actions against a
real dev deployment, and none of it has been deployed anywhere; see
`PILOT.md`'s "Floor & Seating status" section for the accepted
limitations (Resource Block hard-delete has no audit trail, blocking is
Table-scoped only, and the floor view does not surface blocked-table
state) and for what a smoke test would need to cover before this is
relied on operationally.

**Seating consistency on Modify/Complete, and a Resource Block conflict
fix** (R1.5-P1A, R1.5-P1B0/P1B, commits `daea3483`, `9947b7f`) closed
three further gaps in the Floor & Seating sequence above:

- **Early/normal completion now releases seating.** A capacity-aware
  `POST /reservations/:id/complete` (`AvailabilityOrchestrator.completeWithCapacity`)
  releases the reservation's active `SeatingAssignment`, if any, in the
  same transaction as completion — previously the table stayed
  permanently occupied with no expiry mechanism. CAP-D04.05's owned
  rules (reservation completion, assignment completion, resource
  release, subsequent availability) are now fully implemented; see the
  capability registry.
- **A capacity-relevant Modify now revalidates or releases seating.**
  `SeatingOrchestrator.revalidateOrReleaseForModify`, wired into
  `AvailabilityOrchestrator.modifyWithCapacity`, retains a still-valid
  active seating assignment or releases it — a Modify that changed party
  size/area/time could previously leave a stale assignment in place
  silently. `PATCH /availability/reservations/:id` now returns
  `200 {type:"MODIFIED", seatingDisposition}` (`"UNCHANGED"|"RETAINED"|"RELEASED"|"NO_ACTIVE_ASSIGNMENT"`)
  instead of a plain `204` whenever seating is relevant; `public/pilot.html`'s
  edit-save flow surfaces `RELEASED` as an explicit warning.
- **Tier-3 seating-resource locks were normalized to the parent Table.**
  Assign/move/modify-revalidation previously locked a raw Seat id for a
  Teppanyaki selector while `ResourceBlockService` locked the parent
  Table — two different lock keys for the same physical resource, a real
  race window. `SeatingOrchestrator.resolveLockTableIds` now always
  resolves to the parent Table id. Proven with database-state
  (`pg_locks`) evidence, not timing, in
  `tests/integration/floor-seating-concurrency.test.ts`.
- **`ResourceBlockService.blockTable`'s conflict check now includes
  child Seat claims.** It previously checked only Table-level claims
  (`seatIds: []` hardcoded), so an active Teppanyaki seat claim could
  not block a conflicting Table-level block request. It now resolves the
  Table's child Seats (`FloorRepository.findSeatsByTableId`) and includes
  them in the same overlap check.

Same automated-verification-only posture as the rest of Floor & Seating
above — no human smoke test, not deployed anywhere.

**Floorplan versioning, ServiceSession snapshotting, and floorplan-membership
enforcement** (commits `d7f57ad`/`2647c70`/`24aaef7`/`fe73727`, most
recently R1.5-P2D) added a fourth layer of resource-activation checking on
top of the three above:

- **Floorplan versioning foundation** (CAP-D03.02, `d7f57ad`): a persisted
  `Floorplan`/`FloorplanVersion`/Table-membership model with an enforced
  `Draft` → `Published` → `Archived` lifecycle, atomic membership replace
  for Draft versions, and default-version selection with same-Floorplan
  database enforcement — nine authenticated HTTP endpoints
  (`requireStaffSession` reads, `Permission.CapacitySettingsManage`
  mutations), no new pilot UI.
- **Main Floor bootstrap** (`2647c70`): the canonical Floorplan
  (`main-floor`) revision 1 is bootstrapped in `helix_reservations_dev` —
  Published, the Floorplan's default, 23 Table memberships.
- **ServiceSession floorplan snapshot** (CAP-D02.02, `24aaef7`):
  `ServiceSessionService.open()` immutably snapshots the specific
  Published `FloorplanVersion` id in effect at Open time — never re-read
  afterward; a repeated Open stays idempotent and never re-stamps it.
- **Floorplan-membership enforcement** (CAP-D03.03/CAP-D02.02, `fe73727`,
  R1.5-P2D): the session's snapshot (once taken) always overrides the
  Floorplan's current, mutable default; absent/`Created` sessions use the
  current eligible Published default provisionally. Table selectors and
  Teppanyaki Seat selectors (checked through their parent Table — a Seat's
  own id is never checked or stored for membership) are now validated
  against the effective version for immediate assign, pre-assign, Move
  destination, modify-time revalidation, and walk-in-through-immediate-
  assign; a mixed member/non-member multi-resource selection fails
  atomically (`SeatabilityEvaluator`'s per-candidate loop, no partial
  writes). Mark Seated and every release-only operation (no-show,
  cancel-release, completion-release) remain free of membership
  revalidation. `SeatabilityOutcome` gained
  `NO_ELIGIBLE_FLOORPLAN_VERSION` and
  `RESOURCE_OUTSIDE_FLOORPLAN_MEMBERSHIP`. Opening a ServiceSession now
  validates every currently-active assignment against the version about
  to be snapshotted, atomically, in the same transaction — a violation
  returns typed `ACTIVE_ASSIGNMENTS_OUTSIDE_FLOORPLAN` with an
  `activeAssignmentCount` (distinct assignments, never resource rows) and
  no internal identifiers, HTTP 409. B4-A availability filtering
  (`SeatingAvailabilityService`) also filters through snapshot/default
  membership, preserving its existing response contract (an unfiltered
  list never collapses to an error; it collapses to an empty
  `availableResources`). Global lock order:
  Reservation → Floorplan → ServiceSession → Capacity/date → Seating
  parent-Table.
- **Table-inventory read API and Floorplan administration pilot UI**
  (`72ab91d`, `ffbb68b`, R1.5-P2E-1/P2E-2): a tenth, read-only
  `GET /floorplan-resources/tables` route (no hardcoded Table ids;
  Sushi-then-Teppanyaki, server-ordered) plus a "Floorplannen" panel in
  `public/pilot.html` compose the existing nine management routes into a
  real staff-facing Floorplan/version/membership administration surface
  — list/create Floorplans, create Draft versions, a complete-set
  membership editor (Draft-only, inactive Tables shown muted and
  selectable, unknown historical ids preserved unless unchecked),
  publish/set-default/archive with confirmation before each irreversible
  action, and the same double-submit/stale-response/dirty-state/safe-
  rendering discipline every other pilot panel already follows. **As a
  result, `CAP-D03.02` (Floorplan Management) was promoted
  `Designed` → `Pilot`** — see the capability registry's own R1-DOC-7
  note for the full rationale, and the "Distinguishing what is and isn't
  true yet" list immediately below for what that promotion does and does
  not claim. No graphical/geometric floor-layout designer exists or is
  required by the registered capability — see
  `R1_5_FLOORPLAN_SNAPSHOT_MEMBERSHIP_IMPLEMENTATION_REPORT.md`'s R1-DOC-7
  addendum.

**Distinguishing what is and isn't true yet, precisely:**
- **Automated verification**: exhaustive — domain, application, API, and
  real-PostgreSQL concurrency/lock-order tests. See
  `R1_5_FLOORPLAN_SNAPSHOT_MEMBERSHIP_IMPLEMENTATION_REPORT.md` for full
  totals.
- **Development schema/data activation**: all four migrations are applied
  in `helix_reservations_dev`; the canonical Main Floor revision 1 exists,
  Published and default, with 23 Table memberships. `ServiceSessions = 0`
  — no session has been created or opened there.
- **Human smoke testing**: none. No staff member has authored, published,
  or activated a Floorplan version through any UI, nor exercised
  membership enforcement through the pilot. This remains outstanding —
  it is an accepted `Pilot → Active` concern (see the capability
  registry's `CAP-D04.05` precedent for this registry's own established
  distinction), not something `CAP-D03.02`'s `Pilot` status claims has
  already happened.
- **Deployment**: none. Nothing here has been deployed anywhere. Also
  outstanding, also a `Pilot → Active` concern.
- **Corrected (R1-DOC-7).** This bullet used to say "Floorplan management
  has no pilot UI" — that is no longer true. A "Floorplannen"
  administration panel exists in `public/pilot.html` — see `PILOT.md`'s
  "Floorplan Management status" section for the full scope.

## Known limitations (before wider rollout, not blocking a controlled pilot)

- **Corrected (R1-DOC-2).** This bullet used to say `ContactReader` and
  `ServicePeriodReader` were both placeholder adapters because Contact
  Management and Service Period Management didn't exist as capabilities
  yet — that is no longer accurate for Contact Management and needs a
  precise split:
  - **Contact Management (CAP-D05.01)** is real: `PrismaContactRepository`
    (replacing the old `UnvalidatedContactReader` placeholder), contact
    creation/correction with dedicated value-object validation, and both
    HTTP and pilot-UI exposure — see `tests/integration/contact-management.test.ts`
    and `tests/pilot/contact-snapshot-edit-ui.test.ts`.
  - **Corrected (R1-DOC-5).** This bullet used to say **Service Period
    Management (CAP-D02.02)** remained entirely unimplemented — "No
    `Service` or `ServiceSession` table exists; no lifecycle states,
    active floorplan selection, or reservation-to-session relationship
    exists." That is no longer accurate. R1.6-P2C (commits `bea3922`,
    2026-09-12, and `1c7b719`, 2026-09-13) delivered a real, persisted
    `ServiceSession` row (`(serviceCode, serviceDate)` identity, a
    `lunch`/`dinner` code set, and an enforced
    `Created`/`Opened`/`Closed`/`Cancelled` lifecycle with idempotent
    repeats), atomic enforcement across every live seating/walk-in path
    (a Tier-1.5 advisory lock ahead of capacity/seating locks; immediate
    walk-in, immediate assignment, and mark-seated require `Opened`;
    pre-assignment allowed for absent/`Created`/`Opened`, rejected for
    `Closed`/`Cancelled`; Move and modify-time seating revalidation
    participate in the lock without being status-gated; a successful
    close is proven, under genuine concurrency, to leave zero active
    seating assignments for its service/date), a date-bounded HTTP API
    (`GET /service-sessions?serviceDate=YYYY-MM-DD` plus the four
    lifecycle mutation routes, gated by the existing
    `Permission.CapacitySettingsManage` — no new permission), and a
    "Servicesessies" pilot panel with daily-list status visibility. The
    migration (`20260910153637_add_service_session`) is applied in
    `helix_reservations_dev`, which currently holds **zero**
    `ServiceSession` rows — no real staff workflow has been exercised
    against it, and nothing here has been deployed. This is still a
    **partial** slice of CAP-D02.02, not the complete registered
    capability: no reservation-to-session relationship is persisted (the
    join is derivation-only, at read time), and active-floorplan
    selection does not exist (`CAP-D03.02`, itself still `Designed`,
    remains a prerequisite). CAP-D02.01's own persisted Service
    definition also still does not exist. Both `CAP-D02.01` and
    `CAP-D02.02` remain `Designed` in the capability registry — see
    `R1_6_P2C_SERVICE_SESSION_IMPLEMENTATION_REPORT.md` for the full
    design, evidence, and explicit boundary of what remains undelivered.
    **Reconciled (R1-DOC-6).** "Active-floorplan selection does not
    exist" is now only half true: `CAP-D03.02`'s own foundation (Floorplan/
    version/Table-membership, Draft→Published→Archived, nine management
    endpoints) and the canonical Main Floor bootstrap were delivered by
    `d7f57ad`/`2647c70`; `24aaef7` then gave `ServiceSession.open()` an
    immutable snapshot of a specific Published version, and `fe73727`
    (R1.5-P2D) enforced that snapshot's (or, provisionally, the current
    default's) membership across every live resource-selection write. See
    "Floorplan versioning, ServiceSession snapshotting, and
    floorplan-membership enforcement" above and
    `R1_5_FLOORPLAN_SNAPSHOT_MEMBERSHIP_IMPLEMENTATION_REPORT.md`. This is
    still not the complete `CAP-D03.02`/`CAP-D02.02` capabilities — no
    Floorplan pilot UI, no human workflow, no deployment, and
    `CAP-D02.01`'s own persisted Service definition still does not exist.
    `CAP-D02.01`, `CAP-D02.02`, and `CAP-D03.02` all remain `Designed`.
    **Reconciled (R1-DOC-7).** The "no Floorplan pilot UI" clause above is
    no longer accurate: `72ab91d` (Table-inventory read API) and
    `ffbb68b` (Floorplan administration pilot UI) closed that gap, and
    `CAP-D03.02` was promoted `Designed` → `Pilot` on that basis — see
    the capability registry's own R1-DOC-7 note. Still missing,
    unaffected by this promotion: any human workflow, deployment,
    `CAP-D02.01`'s persisted Service definition, and `CAP-D02.02`'s
    persisted reservation-to-session relationship. `CAP-D02.01` and
    `CAP-D02.02` both remain `Designed`.
  - The real, separate `domain/availability/ServicePeriod.ts` +
    `application/availability/ServicePeriodService.ts` "booking-window
    eligibility" behavior (R1.6-A/R1.6-C0) is genuinely implemented and
    wired into live reservation creation via `AvailabilityOrchestrator.createWithCapacity` —
    but it is adjacent, differently-scoped behavior (answers "which start
    times are bookable," not "is there a live service session"), and does
    not satisfy CAP-D02.02's full service-session-lifecycle definition. See
    `ServicePeriod.ts`'s own header comment and
    `R1_6_A_SERVICE_PERIOD_IMPLEMENTATION_REPORT.md` §"BookingPolicy
    Divergence" for the accepted divergence.
  - **Corrected (R1-DOC-4).** This bullet used to say
    `infrastructure/UnvalidatedServicePeriodReader.ts` was still wired
    into `CreateReservationHandler` in production and always reported
    every value valid — that is no longer true. R1.6-P2B
    (`R1_6_P2B_CANONICAL_SERVICE_CODE_IMPLEMENTATION_REPORT.md`, commit
    `e7f079fc2fccc2f2a8117678413930cc3f5b99b0`) replaced it in production
    wiring (`api/server.ts`) with `infrastructure/CanonicalServicePeriodReader.ts`,
    which validates the supplied `servicePeriodId` against a server-
    derived canonical Service **code** — a THIRD, distinct concern from
    both bullets above: not the booking-window eligibility calculator,
    and not CAP-D02.02's live session lifecycle. `servicePeriodId` must
    now be exactly `"lunch"` (Europe/Amsterdam local time in
    `[12:00, 16:00)`) or `"dinner"` (every other eligible time) on
    creation, is derived automatically when a date/time-changing
    modification omits it, is validated when explicitly supplied, and an
    unrelated modification never rewrites a historical/legacy stored
    value. This is a minimum, code-level-only slice of CAP-D02.01
    (`domain/availability/Service.ts` — no persisted `Service` table, no
    administration UI) — CAP-D02.01 and CAP-D02.02 both stay `Designed`;
    neither capability is claimed as implemented by this change.
    `UnvalidatedServicePeriodReader` still exists and remains legitimately
    used across most of the test suite and by
    `ops/reservations/servicePeriodSmokeTest.ts`, wherever the specific
    concern under test is unrelated to Service-code validation — a
    deliberate test double, not a forgotten production leftover. See
    `R1_6_P2B_CANONICAL_SERVICE_CODE_IMPLEMENTATION_REPORT.md` for the
    full design and evidence.
- **Resolved (R1.2 — Identity & Access).** This bullet used to say the API
  trusted `x-actor-*` request headers for identity — that is no longer
  true. Real `StaffUser` accounts, password authentication, server-side
  sessions, and centralized role-based authorization replace it entirely;
  those headers now have zero authority (a permanent regression test
  proves this — see `tests/integration/identity-access.test.ts`). See
  `R1_2_IDENTITY_ACCESS_IMPLEMENTATION_REPORT.md`.
- **Resolved (CAP-D02.03).** This bullet used to recommend switching from
  SQLite to PostgreSQL before scaling — that switch already happened (see
  the Stack section above); this codebase has been PostgreSQL-only since
  CAP-D02.03.
- **Partially resolved (R1.6-B).** This bullet used to say there was no
  transactional outbox at all. A transactional outbox now exists, but
  only for guest communication emails (see "Guest communication emails"
  below) — `Reservation` domain events themselves are still persisted
  atomically with state (`PrismaReservationRepository.save()`) without a
  general-purpose outbox or external consumer beyond that one case.
- **Corrected (R1-DOC-2).** This bullet used to say Confirm/Modify/Cancel/Complete
  lacked HTTP-level tests — that is no longer true (see the Status section
  above; `tests/api/reservations.test.ts` covers all four). They have not,
  however, been given their own `GET /reservations`-style discoverability
  pass the way Create was for AC34 — that remains open, narrower work.
- **Added (R1.3-I2).** Staff can now correct a reservation's contact phone
  and/or email via `PATCH /availability/reservations/:id`, reusing
  `PhoneNumber.create()`/`EmailAddress.create()` verbatim (no new
  validation format); blank/whitespace input is treated as "omitted," never
  persisted as empty or rejected merely for being blank.
- **Added (R1.2-P2).** A failed login now records exactly one
  `SecurityEvent` (`type: "LoginFailed"`, a typed reason code, no attempted
  credentials or other request data) via `SecurityEventRecorder`,
  best-effort and never affecting the login outcome; anti-enumeration
  behavior at the HTTP boundary is unchanged.
- **Added (R1.7-P1) — Security Event Visibility.** R1.2-P2's recorded
  `SecurityEvent` rows (`LoginFailed`, `OwnerBootstrapped`) were written
  but never read back anywhere. `GET /security-events`
  (`Permission.AuditView` — already defined in
  `StaffAuthorizationPolicy.ts` and already granted to Owner + Manager,
  no new permission introduced) now exposes them through an explicit
  8-field allowlist projection (`application/security/SecurityEventProjection.ts`)
  that never returns raw `metadata`, an attempted username/password, or
  any other non-allowlisted data; `since`/`limit` query filtering
  (`since` requires a complete RFC 3339 timestamp with an explicit
  timezone — a date-only or timezone-less value is rejected, as is a
  syntactically-shaped but impossible calendar/time value); a read-only
  "Beveiligingsgebeurtenissen" section in `public/pilot.html` that hides
  itself entirely on 401/403 rather than showing an error. See
  `R1_7_SECURITY_EVENT_VISIBILITY_IMPLEMENTATION_REPORT.md` for the full
  design and evidence, including this feature's explicit relationship to
  `CAP-D08.02` (Operational Audit) — it is a narrow, delivered slice
  adjacent to that capability's broader scope, not a claim that CAP-D08.02
  itself is now satisfied.
- The scheduler/cron hosting needed to actually run
  `npm run process-communications` on a recurring basis does not exist
  yet (same still-open prerequisite `ops/backup/createBackup.ts` already
  has for backups) — until it's wired up, enqueued emails sit in the
  outbox until someone runs that command manually.

## Guest communication emails (Resend)

Implements the "Communication" event consumer described in the
CAP-D01.01 `event-model.md` (R1.6-B): a reservation confirmation email,
plus a 24-hour reminder, sent to the guest when a usable email address is
known. See `R1_6_B_GUEST_COMMUNICATIONS_ARCHITECTURE_INVESTIGATION.md`
and `R1_6_B_GUEST_COMMUNICATIONS_IMPLEMENTATION_REPORT.md` for the full
design.

- **Trigger:** the confirmation email is enqueued immediately on
  successful reservation creation — `CreateReservationHandler.finalize()`
  calls `CommunicationOutboxService.enqueueConfirmationIfEligible()`
  inside the same transaction as the reservation write itself (never a
  separate, unprotected post-commit step). It is not tied to the later
  `Confirmed` status transition. A reservation with no usable email
  (e.g. a staff-entered, phone-only booking) enqueues nothing, by
  construction. The 24-hour reminder is scheduled separately, by a scan
  (`CommunicationOutboxService.scanAndScheduleReminders()`) that always
  reads the reservation's *current* date/time, so a staff modification
  is picked up automatically.
- **Outbox pattern:** enqueued rows (`CommunicationMessage`, via
  `application/ports/CommunicationOutboxRepository.ts`) are processed
  separately by `CommunicationWorker`
  (`application/communications/CommunicationWorker.ts`), invoked by
  `ops/communications/processOutbox.ts` (`npm run process-communications`).
  The worker re-checks reservation eligibility against current state at
  send time (never trusting the row's own snapshot for that decision),
  and retries `FailedRetryable` failures on a bounded backoff
  (`domain/communications/CommunicationMessage.ts`'s `RETRY_BACKOFF_MS`)
  before giving up as `FailedPermanent`. A stuck `Processing` row
  (worker crashed mid-send) becomes reclaimable after a staleness window
  rather than being lost.
- **Provider boundary:** `application/ports/EmailDeliveryPort.ts` is the
  provider-independent interface everything above depends on — no
  Reservation/outbox/provider-SDK knowledge crosses it in either
  direction. `infrastructure/communications/FakeEmailDeliveryPort.ts` is
  the deterministic default (`EMAIL_PROVIDER` unset, no external call
  ever made); `infrastructure/communications/ResendEmailDeliveryAdapter.ts`
  is the real adapter (`EMAIL_PROVIDER=resend`), calling Resend's HTTPS
  API directly via `fetch` (no `resend` npm package dependency). See
  `.env.example` for `EMAIL_PROVIDER` / `EMAIL_PROVIDER_API_KEY` /
  `EMAIL_FROM_ADDRESS` / `EMAIL_REPLY_TO`. **Never** commit a real API
  key — only empty placeholders belong in `.env.example`; the real key
  goes in a local, gitignored `.env`.
- **Sender address:** owner-confirmed as `reservations@konnichiwa.nl`
  (from) with `info@konnichiwa.nl` as reply-to. As of this writing,
  `reservations@konnichiwa.nl` itself still needs to be created
  (mailbox + Resend domain verification) — an operational prerequisite,
  not a code gap; until then, a real send fails safely as
  `FAILED_PERMANENT` rather than silently succeeding or corrupting the
  reservation transaction.
- **Staff resend:** `POST /reservations/:id/communications/confirmation/resend`
  (`ResendConfirmationHandler`) lets staff re-trigger a confirmation
  email on demand. It always creates a new, independent outbox row —
  never mutates or resends the original message, never touches the
  Reservation's own business state or version.
- **Tests never send real email:** every test that exercises
  `ResendEmailDeliveryAdapter` injects a fake `fetchImpl`
  (`tests/infrastructure/resend-email-delivery-adapter.test.ts`) — no
  test in this repository makes a real network call to Resend under any
  circumstance.

## Run

```bash
npm install
npx prisma migrate deploy   # or `prisma migrate dev` locally
npm run typecheck
npm test
npm run dev                 # http://127.0.0.1:3001, see api/server.ts
```

By default the server binds only to the loopback interface (`127.0.0.1`),
not all interfaces — set `APP_HOST` to override (e.g. `0.0.0.0` for a
future real deployment environment that genuinely needs to accept
connections from other hosts). A missing, blank, or whitespace-only
`APP_HOST` falls back to the loopback default, never all-interfaces. See
`.env.example` and `api/serverConfig.ts`.

## CI

`.github/workflows/reservations-ci.yml` runs `prisma generate`, `prisma
migrate deploy` (against a throwaway SQLite file), typecheck, and the
full test suite on every push/PR touching this directory.

## Controlled pilot

`public/pilot.html` (served at `/pilot.html` once the server is running)
is a staff-facing page covering Create Reservation, the daily list, and
Floor & Seating (assign/pre-assign/move/mark-seated/no-show, floor and
late-arrival view, Resource Blocking, walk-in) — the operations covered
by the pilot-readiness work above — plus a read-only Security Events
view (R1.7-P1, Owner/Manager only), a "Servicesessies" panel (R1.6-P2C,
`Permission.CapacitySettingsManage` for mutations) exposing the
per-date `lunch`/`dinner` operational session lifecycle, with a matching
status column on the daily list, and a "Floorplannen" panel (R1.5-P2E-2,
same permission for mutations) exposing Floorplan/version administration
and Draft Table-membership editing. See `PILOT.md` for scope, known
limitations, and success criteria before using it with real bookings.
