# R1.6-P3D — Default Reservation Duration Implementation Report

**Capability:** `CAP-D02.01` (Service Management) — remains `delivery_status: Designed`.

**Commits:**
- `9e9041641ac91929ffcb645dd9e235a2b6176cd2` — 2026-09-29 —
  `feat(service): snapshot default duration` (R1.6-P3D-1)
- `376980d76801880fe6f11473a135e9e3187b75c1` — 2026-09-29 —
  `feat(service): manage default duration` (R1.6-P3D-2)

This report covers both milestones together — P3D-1 built the
persisted foundation and a one-time snapshot; P3D-2 built the
management API/pilot editing on top of it, with no further schema
change. It follows the same read-only design gate that preceded R1.6-
P3C's own interval work; see `R1_6_P3C_SERVICE_OPERATING_INTERVAL_IMPLEMENTATION_REPORT.md`'s
own R1-DOC-10 reconciliation section for the historical relationship
between the two capabilities' worth of work.

## Design-gate findings

A dedicated read-only investigation (R1.6-P3D) traced every existing
source of duration/end-time behavior in this codebase before any
implementation began. The central finding: **duration was already
owned entirely by `CapacityPool`, keyed by *area* (`Sushi`/`Teppanyaki`),
never by `Service` (`lunch`/`dinner`)** —
`domain/availability/CapacityPool.ts`'s `CAPACITY_POOLS` constant
(`Sushi: 90min`, `Teppanyaki: 150min`), an owner-confirmed, fixed,
non-staff-configurable value consumed throughout
`AvailabilityOrchestrator`, `SeatingAvailabilityService`, and
`FloorReadModel`. `Reservation` itself has no duration or end-time
field anywhere — only a single point-in-time `reservationDate`. The
only persisted interval lives on `CapacityCommitment`
(`startTime`/`endTime`), keyed by area, never by Service. A pre-existing,
unrelated inconsistency was also found and is recorded, not corrected,
by this milestone (see "Deferred" below).

## Distinction between Service duration and CapacityPool duration

These are two structurally independent concepts that happen to share
the word "duration":

| | `Service.defaultDurationMinutes` (this milestone) | `CapacityPool.durationMinutes` (pre-existing, untouched) |
|---|---|---|
| Keyed by | `lunch`/`dinner` (meal/time axis) | `Sushi`/`Teppanyaki` (area axis) |
| Owning capability | `CAP-D02.01` | `CAP-D02.03` |
| Staff-configurable | Yes, via `PATCH /services/:code` | No — fixed, owner-confirmed constant |
| Affects capacity/seating/Reservation timing | No | Yes — the sole live authority |
| Persisted where | `services.default_duration_minutes`, `service_sessions.duration_snapshot_minutes` | Not persisted — a static in-code constant |

No cross-validation, pairing, or consultation exists between the two in
either direction.

## Accepted ownership model

**Canonical model (accepted):** store `Service.defaultDurationMinutes`
and copy it once to `ServiceSession.durationSnapshotMinutes` when the
session is created — the identical mechanism already proven for
`defaultOperatingInterval` in R1.6-P3C-1/P3C-2.

## Rejected models

- **Direct to `Reservation`** — rejected: would require a new
  `Reservation` column, a legacy-row backfill/NULL decision, and a new
  creation-time race against the high-traffic Reservation-creation path;
  breaks the standing principle that `Reservation` carries no
  copied/derived Service-catalog field.
- **`Service` → `ServiceSession` → `Reservation` (double copy)** —
  rejected: inherits every problem of the direct-to-Reservation model,
  adds an ordering dependency between Reservation and Session creation
  that does not exist today, and reopens the R1.6-P3C-A-accepted
  decision that `ServiceSessionService` has no `ServiceDefinitionRepository`
  dependency.
- **Capacity-integrated (a new Service-keyed capacity pool)** — rejected
  as out of scope: would require a `CAP-D02.03`-scoped architecture
  change (a third `CapacityPoolId` value or a `CapacityCommitment`
  redesign), not something this capability owns or this milestone was
  authorized to touch.

## Domain validation

`domain/availability/ServiceDefaultDuration.ts`:

```ts
export function createServiceDefaultDuration(minutes: number): number
```

- Integer only (`Number.isInteger`).
- Range `[15, 480]` inclusive.
- Must be a multiple of 15.
- Throws `InvalidServiceDefaultDurationError` otherwise — no I/O, no
  Service/session/capacity/Reservation lookup of any kind.
- `null` (absence) is handled entirely outside this constructor, by
  every caller — the constructor only ever validates a supplied number.

## Schema and migration

Migration `20260928140000_add_service_default_duration` (P3D-1) —
additive only:

- `services.default_duration_minutes INTEGER NULL`
- `service_sessions.duration_snapshot_minutes INTEGER NULL`
- One CHECK constraint per column:
  `NULL`, or integer `[15,480]` divisible by `15`.
- No seed/update statement, no default, no FK, no index, no trigger, no
  Reservation column, no destructive or unrelated statement.

P3D-2 added no further migration — the management API and pilot
editing were built entirely on top of the P3D-1 schema.

## Development activation

Authorized separately (R1.6-P3D-1-A) and executed via `npx prisma
migrate deploy` against `helix_reservations_dev` only, after
independently verifying the live target's `current_database()`,
`current_user`, loopback server address, and port. Before/after
row-count-and-SHA-256-fingerprint proof across every operational table
(Services, ServiceSessions, Reservations, CapacityCommitments,
Floorplans, FloorplanVersions, FloorplanVersionResources, Tables, Seats,
ResourceBlocks, SeatingAssignments, SeatingAssignmentResources,
StaffUsers, Contacts, SecurityEvents, and a pre-existing-field
projection of Services including the operating interval) showed every
set byte-identical except the two new, both-`NULL` columns. Result:
14/14 migrations applied, 0 rolled back; `lunch`/`dinner` both
`defaultDurationMinutes = null`; `ServiceSessions = 0`; all other
operational data unchanged. **No development duration value has ever
been configured, before or after this pair of milestones.**

## ServiceSession snapshot semantics

`POST /service-sessions`'s route handler resolves both
`defaultOperatingInterval` and `defaultDurationMinutes` from the SAME
single `findByCode` call (no second catalog read), passing
`durationSnapshotMinutes` into `ServiceSessionService.create()` as a
plain optional field — no new repository dependency inside that
service, preserving its P3C-A-accepted decoupling from the Service
catalog. Proven immutable: idempotent repeated `create()` preserves the
original value even when the repeat supplies a different one;
`open()`/`close()`/`cancel()` each preserve the creation-time value
unchanged; a later Service edit or full clear (through the real
management write path) never rewrites an already-created session's own
snapshot (rollback-free — see the deterministic race proof below).

## API request and response contract

`PATCH /services/:code` (same existing route and
`Permission.CapacitySettingsManage` permission — no new route, no new
permission) accepts an optional `defaultDurationMinutes` alongside the
pre-existing `displayName`/`enabled`/`defaultOperatingInterval` — at
least one of the four is still required:

- **Omitted** — no duration change.
- **An integer** — atomically sets/replaces it; validated exclusively
  through `createServiceDefaultDuration` (no duplicated numeric rules
  in the route).
- **Literal `null`** — atomically clears it.

`GET /services` and successful `PATCH` responses expose
`defaultDurationMinutes: number | null`; `GET`/`POST` `/service-sessions`
responses expose `durationSnapshotMinutes: number | null`. No raw
database column name is ever exposed. The `ServiceSession` request
contract is entirely unchanged.

## R08 and HTTP 422 decision

Every way `defaultDurationMinutes` can be invalid — wrong top-level type
(string/boolean/array/object), non-integer, out-of-range, or not a
multiple of 15 — shares **one** provisional rule id, `CAP-D02.01-R08`,
returned through the established `422 { violations }` envelope,
identical in shape and status code to the existing `R02`–`R07` rules.
This keeps the route's single-envelope, single-status-code response
architecture intact rather than introducing a second status code for
one field's violations.

## Repository atomicity

`ServiceDefinitionRepository.update()` (and its Prisma implementation)
assigns every supplied field — `displayName`, `enabled`,
`defaultOperatingInterval`, `defaultDurationMinutes` — into the SAME
single Prisma `data` object, so any combination is always exactly ONE
`UPDATE` statement, never a read-modify-write split and never a
partial-field write.

## No-op and `updatedAt` behavior

`ServiceCatalogManagementService.update()` compares the supplied
duration against the current value by plain scalar equality (`===`): a
same-value request or a null-clear-of-an-already-null value is added to
neither the `changes` set nor a repository call, so `updatedAt` is
preserved exactly — identical to the pre-existing
`displayName`/`enabled`/`defaultOperatingInterval` no-op contract.

## Pilot controls

The "Diensten" panel gained one quarter-hour duration `<select>`
(15…480, step 15) and an explicit clear checkbox per row. The value is
compared against the authoritative one and submitted as one atomic
`defaultDurationMinutes` — integer or `null` — only when it differs; a
no-op save sends no request. Setting, replacing, or clearing duration
never prompts for confirmation; the pre-existing disable-a-Service
confirmation is entirely unchanged. Panel copy explicitly states the
value is planning information only, never a capacity rule or table-
occupancy guarantee. Every other established safety convention
(in-flight guard, monotonic request token, authoritative reload,
separate success/refresh messages, safe error handling, `textContent`-
only rendering) is unchanged and applies equally to the new control.

## Read-only session display

"Servicesessies" displays each session's own `durationSnapshotMinutes`
as plain text (minutes, or an explicit "Geen standaardduur vastgelegd"
for `null`) alongside the existing operating-interval display — no
editor, no input, no mutation path, and no fallback to the live Service
value if the snapshot is absent. The lifecycle action matrix
(Aanmaken/Openen/Annuleren/Sluiten) is untouched.

## Deterministic race proof

Barrier-controlled (explicit `Promise`-based signaling, never
`Promise.all()` timing), and — unlike P3C-1's own pre-management-API
race proof — exercised through the REAL management write path
(`PrismaServiceDefinitionRepository.update()`, the same method `PATCH
/services/:code` calls in production) now that it exists:

- A session's duration READ held behind a signal until a concurrent
  `Service.update()` has already committed still receives the COMPLETE
  OLD value, never a mix.
- A session created strictly AFTER the update receives the COMPLETE NEW
  value.
- Clearing a Service's duration never clears an already-created
  session's own snapshot.
- Both operations shown independently valid: the catalog change's own
  effect is visible, and the session's own snapshot is unaffected by
  it.
- The canonical `lunch` row is restored to `null` in `finally` after
  every test — no persistent mutation of shared canonical rows survives
  any test run.

## Structural non-effect evidence

Plain source-text assertions (no execution) prove
`defaultDurationMinutes`/`durationSnapshotMinutes` appear nowhere in:
`domain/aggregates/ReservationAggregate.ts`, `CapacityPool.ts`,
`AvailabilityOrchestrator.ts`, `AvailabilityEvaluator.ts`,
`SeatingAvailabilityService.ts`, `SeatingOrchestrator.ts`,
`FloorReadModel.ts`, `ServicePeriod.ts` (booking-window logic), or the
`POST /availability/reservations` route handler. No capacity or
Reservation test was modified to make the field "appear used."

## Automated test totals

Verified directly by re-running these files immediately before this
report:

| File | Tests |
|---|---|
| `tests/domain/service-default-duration.test.ts` | 15 |
| `tests/domain/service-operating-interval.test.ts` | 17 |
| `tests/infrastructure/prisma-service-definition-repository.test.ts` | 28 |
| `tests/infrastructure/prisma-service-session-repository.test.ts` | 9 |
| `tests/integration/service-catalog-migration.test.ts` | 34 |
| `tests/integration/service-session-lifecycle.test.ts` | 47 |
| `tests/api/services.test.ts` | 69 |
| `tests/api/service-sessions.test.ts` | 48 |
| `tests/api/server-wiring.test.ts` | 38 |
| `tests/application/service-catalog-canonical-integration.test.ts` | 17 |
| `tests/application/service-catalog-management-service.test.ts` | 33 |
| `tests/pilot/service-catalog-ui.test.ts` | 54 |
| `tests/pilot/service-session-ui.test.ts` | 83 |

Combined changed/new test set (these 13 files, run together): **492/492**.
Full isolated suite: **103 files / 1978 tests / 0 failed / 0 skipped**,
run twice for stability with identical results. Typecheck clean at
every gate across both milestones.

## Capability-status reasoning

`CAP-D02.01` remains `delivery_status: Designed`. This pair of
milestones delivers a real but still minimal slice of *default
reservation duration* — one optional scalar value with planning-default/
snapshot semantics only, no richer schedule concept, and critically, **no
actual configured value for either canonical Service in development** —
both `lunch` and `dinner` remain `NULL` by design; no value was invented.
Service naming remains only partially delivered (still just
`displayName`), and `ServiceCreated`/`ServiceDeactivated` remain entirely
absent. This does not warrant a `Pilot` promotion.

## Accepted limitations

- No richer duration schedule (per-day-of-week, multiple durations per
  Service).
- No cross-validation with `defaultOperatingInterval` — a configured
  duration may conceptually extend beyond the operating interval or
  cross midnight; no rule prevents either.
- No ETag/version precondition on `PATCH /services/:code` — last-write-
  wins remains an accepted decision, unchanged from R1.6-P3B/P3C-2.
- No Create/Delete Service operation; `code` remains immutable.
- **Unchanged by either milestone:** any `Reservation` field or end
  time, `CapacityPool.durationMinutes`, `CapacityCommitment` behavior,
  availability/simultaneous-occupancy evaluation, seating timing,
  `FloorReadModel`'s own end-time derivation, booking-window
  eligibility, ServiceSession lifecycle transitions, and
  `defaultOperatingInterval` validation.
- **No authenticated human browser workflow has been completed** against
  either the API or the pilot panel for either milestone.
- **No development route was called, no development Service row was
  edited, and no development ServiceSession was created** — the one
  authorized development action was the read-only-verified schema
  migration itself (R1.6-P3D-1-A); every functional proof ran against
  the isolated test database or a fake/in-memory repository.
- **Nothing from either milestone has been deployed anywhere.**
- **P1-B11 remains untouched**, per standing instruction.

## Deferred: `FloorReadModel.ts` duplicate literal

The P3D design gate discovered a pre-existing, unrelated inconsistency:
`application/floor/FloorReadModel.ts`'s own `expectedEndTime` derivation
hardcodes `reservation.preferredArea === "Teppanyaki" ? 150 : 90` as a
literal, duplicated copy of `CapacityPool.CAPACITY_POOLS`'s own duration
values, rather than importing that constant — contradicting that same
file's own header comment ("never a second duration authority"). This
was discovered, not corrected, in P3D-1/P3D-2, per explicit Chief
Engineer authorization deferring it to a separately scoped, narrow
correction. It has no relationship to `Service.defaultDurationMinutes`
and is not affected by, and does not affect, anything in this report.
