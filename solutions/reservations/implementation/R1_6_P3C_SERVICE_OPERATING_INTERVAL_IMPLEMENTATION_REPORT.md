# R1.6-P3C — Service Operating-Interval Implementation Report

**Capability:** `CAP-D02.01` (Service Management) — remains `delivery_status: Designed`.

**Commits:**
- `be5926fbb61383141e5fbcd780e98e918c422e40` — 2026-09-25 —
  `feat(service): snapshot operating intervals` (R1.6-P3C-1)
- `c93f6576e512bc75b84ab7105ace494e86b20746` — 2026-09-28 —
  `feat(service): manage operating intervals` (R1.6-P3C-2)

This report covers both milestones together — R1.6-P3C-1 built the
persisted foundation and a one-time snapshot; R1.6-P3C-2 built the
management API/pilot editing on top of it, with no further schema
change. See `R1_6_P3_SERVICE_CATALOG_IMPLEMENTATION_REPORT.md`'s own
R1-DOC-9 reconciliation section for the historical relationship to
R1.6-P3A/P3B.

## Scope and accepted decisions

A read-only architecture investigation (R1.6-P3C) proposed an advisory-
only, uninert configuration; the Chief Engineer rejected that as "inert
configuration" (no named production consumer) and required a corrected
addendum (R1.6-P3C-A) resolving, as accepted decisions later implemented
verbatim:

1. Persisted operating intervals are **planning defaults** for dated
   `ServiceSession`s, not a live scheduling authority.
2. A Service's CURRENT default interval is copied into a `ServiceSession`
   exactly **once**, at creation — never re-read or re-applied afterward.
3. Editing or clearing an interval never rewrites an existing session's
   own already-taken snapshot.
4. `ServiceSessionService` keeps its existing, tested decoupling from any
   `ServiceDefinitionRepository` — the interval is resolved by the
   `POST /service-sessions` **route handler**, which already has both
   dependencies in scope, and passed in as a plain parameter.
5. The value is represented as ONE atomic pair at every boundary
   (domain, database, API, pilot) — never as two independent optional
   numbers.
6. Editing (R1.6-P3C-2) reuses the existing `PATCH /services/:code`
   route and `Permission.CapacitySettingsManage` permission — no new
   route, no new permission.
7. `deriveServiceCode` (the existing `lunch`/`dinner` classifier) is left
   entirely untouched and unconsulted — it remains the single highest-
   blast-radius component in this capability (called live, synchronously,
   on every seating/walk-in/modify-revalidation action), and this
   milestone does not touch it.
8. Rule identifiers here are provisional, per this capability's own
   established convention (`CAP-D02.01` has no external assignment-
   defined rule sequence, unlike `CAP-D01.01`'s `R01`–`R51`).

## Domain value and validation rules

`domain/availability/ServiceOperatingInterval.ts`:

```ts
export interface ServiceOperatingInterval {
  readonly startMinute: number;
  readonly endMinute: number;
}
```

- Europe/Amsterdam local wall-time, minutes-since-midnight — the same
  unit convention `ServicePeriod.ts`'s own `BookingWindow` already uses.
- End is **exclusive** — mirrors `Service.ts`'s own `[12:00,16:00)`
  lunch-boundary convention exactly.
- `createServiceOperatingInterval(startMinute, endMinute)` — the ONE
  pure constructor every caller builds through — enforces, throwing
  `InvalidServiceOperatingIntervalError` otherwise:
  - `startMinute` an integer in `[0, 1439]`;
  - `endMinute` an integer in `[1, 1440]`;
  - `endMinute > startMinute` (overnight intervals unsupported).
- `parsePersistedServiceOperatingInterval(startMinute, endMinute)` —
  reconciles the two-column persisted representation: both `null` →
  `null` (unconfigured); exactly one `null` → **throws** (a malformed
  persisted pair is rejected, never silently coerced); otherwise
  delegates to the constructor above.
- No cross-Service (lunch vs. dinner) overlap rule exists — each
  Service's interval is independently valid or invalid on its own terms.
- No duration field exists here or anywhere else in this milestone.

## Schema and migration

Migration `20260925120000_add_service_operating_interval` (applied only
to `helix_reservations_test` during development, and — under a separate,
explicit R1.6-P3C-1-A authorization — to `helix_reservations_dev`):

- `services` gains `default_start_minute INTEGER NULL`,
  `default_end_minute INTEGER NULL`, and constraint
  `services_default_operating_interval_check` (paired-null, `[0,1439]`/
  `[1,1440]` range, `end > start`).
- `service_sessions` gains `start_minute INTEGER NULL`,
  `end_minute INTEGER NULL`, and the identically-shaped constraint
  `service_sessions_operating_interval_snapshot_check`.
- One data statement: `UPDATE services SET default_start_minute = 720,
  default_end_minute = 960 WHERE code = 'lunch'` — the same `[12:00,16:00)`
  boundary already canonical for `deriveServiceCode` (R1.6-P2B decision
  #4), not a new guess. `dinner` is deliberately left `NULL` — no
  accepted product value for a dinner end time exists anywhere in this
  codebase or the capability registry.
- No FK, trigger, index, drop, rename, or unrelated statement.

## Development activation

Authorized separately (R1.6-P3C-1-A) and executed via `npx prisma
migrate deploy` against `helix_reservations_dev` only, after
independently verifying the live target's `current_database()`,
`current_user`, loopback server address, and port. Before/after
row-count-and-SHA-256-fingerprint proof across every operational table
(Reservations, CapacityCommitments, ServiceSessions, Floorplans,
FloorplanVersions, FloorplanVersionResources, Tables, Seats,
ResourceBlocks, SeatingAssignments, SeatingAssignmentResources,
StaffUsers, Contacts, SecurityEvents, and a pre-existing-field projection
of Services) showed every set byte-identical except the two intentional
lunch columns. Result: 13/13 migrations applied, 0 rolled back;
`lunch` = `[720,960)`; `dinner` = `null`; `ServiceSessions = 0`;
Reservations = 4 (all pre-existing); Tables = 23; Seats = 40.

## ServiceSession copy-on-create semantics

`POST /service-sessions`'s route handler:

```ts
const operatingIntervalSnapshot = deps.serviceCatalog
  ? (await deps.serviceCatalog.repository.findByCode(body.serviceCode))?.defaultOperatingInterval ?? null
  : null;
```

— resolved once, passed into `ServiceSessionService.create()` as a plain
optional field, which forwards it verbatim to the repository. No
resolution happens anywhere else; `open()`/`close()`/`cancel()` never
touch it.

## Immutable snapshot behavior

Proven directly (not merely asserted):

- An idempotent repeated `create()` (`ALREADY_EXISTS`) preserves the
  **original** snapshot even when the repeat call supplies a different
  one.
- `open()`, `close()`, and `cancel()` each preserve the snapshot taken at
  creation, unchanged.
- Changing — or fully clearing — a Service's own default AFTER a session
  is created never rewrites that session's already-taken snapshot
  (rollback-contained real-catalog proof, and a second, non-rollback
  proof using real committed writes restored via `finally`).
- A deterministic, **barrier-controlled** (explicit `Promise`-based
  signaling, never `Promise.all()` timing) race: a session's interval
  READ is held behind a signal until a concurrent `Service.update()`
  has already committed — the session still receives the COMPLETE OLD
  pair, never a mix (e.g. never `{start: new, end: old}`); a session
  created strictly AFTER the update receives the COMPLETE NEW pair.
  Both operations are shown independently valid: the catalog update's
  own effect is visible, and the session's own snapshot is unaffected by
  it.

## Repository and management-service update semantics

`ServiceDefinitionRepository.update()`'s patch gained
`defaultOperatingInterval?: ServiceOperatingInterval | null`:

- Omitted → touches neither persisted column.
- A complete object → `PrismaServiceDefinitionRepository` assigns both
  `default_start_minute`/`default_end_minute` in the SAME Prisma `data`
  object, so exactly one `UPDATE` statement sets both — no partial-pair
  write is possible by construction.
- `null` → the same single statement clears both to `NULL`.

`ServiceCatalogManagementService.update()` compares the supplied interval
against the current one **by value** (`intervalsEqual`, comparing
`startMinute`/`endMinute`, never object identity) — a same-value object
or a null-clear-of-an-already-null interval is added to neither the
`changes` set nor a repository call, so `updatedAt` is preserved exactly,
identical to the pre-existing `displayName`/`enabled` no-op contract.

## PATCH request contract

`PATCH /services/:code` accepts an optional `defaultOperatingInterval`
alongside the pre-existing `displayName`/`enabled` — at least one of the
three is still required:

- **Omitted** — no interval change.
- **A complete object** `{startMinute, endMinute}` — atomically sets it;
  validated exclusively through `createServiceOperatingInterval` (no
  duplicated range/pairing logic in the route itself).
- **Literal `null`** — atomically clears it.
- Independent `startMinute`-only or `endMinute`-only top-level fields are
  never accepted.
- Unknown top-level keys (`CAP-D02.01-R03`) and `code` in the body
  (`CAP-D02.01-R04`) are rejected exactly as before.
- Every way `defaultOperatingInterval` itself can be invalid — wrong
  top-level type (array/string/boolean/number), an extra/missing/wrong
  nested key, a non-integer value, an out-of-range value, or
  `endMinute <= startMinute` — shares **one** provisional rule id,
  `CAP-D02.01-R07`, returned in the established `422 { violations }`
  envelope.
- The successful-response shape is unchanged and exact:
  `{code, displayName, enabled, createdAt, updatedAt,
  defaultOperatingInterval}` — no raw database column name is ever
  exposed.

## Same-value no-op behavior

A same-value `defaultOperatingInterval` object, or a `null` clear against
an already-`null` interval, performs **no repository write** and
preserves `updatedAt` exactly — proven at the application-service layer
(repository-call-count assertion) and at the HTTP layer
(`updatedAt` equality assertion).

## Pilot controls and confirmation behavior

The "Diensten" panel (same two routes, no new backend surface) gained,
per row: a start select (`00:00`–`23:45`, quarter-hour steps), an end
select (`00:15`–`24:00`, quarter-hour steps), and an explicit clear
checkbox. The pair is compared against the authoritative value BY VALUE
and submitted as one atomic `defaultOperatingInterval` — object or
`null` — only when it differs; a no-op save (nothing changed at all)
sends no request. Setting, changing, or clearing the interval never
prompts for confirmation; the pre-existing confirmation for disabling a
Service (`enabled: false`) is entirely unchanged, still occurring before
the panel's single in-flight guard and before any request, with Cancel
issuing none. Every other established safety convention (in-flight
guard cleared in `finally`, monotonic request token, authoritative
reload, separate success/refresh messages, safe 401/403/422 handling, no
client-side role branching, `textContent`-only dynamic rendering) is
unchanged and applies equally to the new controls. The "Servicesessies"
lifecycle action matrix (Aanmaken/Openen/Annuleren/Sluiten) is untouched.

## Test-isolation approach

Every real-PostgreSQL proof against the canonical `lunch`/`dinner` rows
is either **rollback-contained** (a `$transaction` that always throws a
sentinel to force rollback) or, where a genuine cross-operation
concurrency proof requires a real commit, restored to the exact
original value in a `finally` block before the next test runs — the same
established convention as R1.6-P3A/P3B, never a blanket reset of shared
seeded/reference tables. `ServiceSession` fixtures use disjoint,
per-file date ranges, deleted only within that file's own range.

## Automated verification totals

Verified directly by re-running these files immediately before this
report:

| File | Tests |
|---|---|
| `tests/domain/service-operating-interval.test.ts` | 17 |
| `tests/infrastructure/prisma-service-session-repository.test.ts` | 5 |
| `tests/infrastructure/prisma-service-definition-repository.test.ts` | 18 |
| `tests/integration/service-catalog-migration.test.ts` | 23 |
| `tests/integration/service-session-lifecycle.test.ts` | 36 |
| `tests/api/services.test.ts` | 48 |
| `tests/api/service-sessions.test.ts` | 45 |
| `tests/application/service-catalog-canonical-integration.test.ts` | 8 |
| `tests/application/service-catalog-management-service.test.ts` | 24 |
| `tests/pilot/service-session-ui.test.ts` | 75 |
| `tests/pilot/service-catalog-ui.test.ts` | 42 |
| `tests/api/server-wiring.test.ts` | 33 |

Combined regression set (these 12 files, run together): **374/374**.
Full isolated suite: **102 files / 1860 tests / 0 failed / 0 skipped**.
Typecheck clean at every gate across both milestones.

## Capability-status reasoning

`CAP-D02.01` remains `delivery_status: Designed`. Checked directly
against the registry entry before writing this: its registered
`owns.rules` are *service naming*, *default operating times*, and
*default reservation duration*; its registered `owns.events` are
`ServiceCreated`, `ServiceModified`, and `ServiceDeactivated`. This pair
of milestones delivers a real but still minimal slice of *default
operating times* — exactly one optional daily interval, planning-default/
snapshot semantics only, no recurring or per-day-of-week schedule — and
extends the same partial `ServiceModified` R1.6-P3B already delivered
(still not full naming/identity authority). *Default reservation
duration* remains entirely absent, as do `ServiceCreated` and
`ServiceDeactivated` — the catalog is still fixed at exactly two rows by
migration seed data, never created or deactivated through any code path.
This does not warrant a `Pilot` promotion.

## Accepted limitations and explicitly unchanged behavior

- No richer operating schedule (recurring, per-day-of-week, multiple
  intervals per Service) — one optional daily interval only.
- No default reservation duration field or concept exists anywhere.
- No cross-Service (lunch vs. dinner) overlap validation.
- No ETag/version precondition on `PATCH /services/:code` — last-write-
  wins remains an accepted decision, unchanged from R1.6-P3B.
- No Create/Delete Service operation; `code` remains immutable.
- **Unchanged by this milestone:** `lunch`/`dinner` classification
  (`deriveServiceCode`), booking-window eligibility (`ServicePeriod`/
  `BookingWindow`), capacity behavior, ServiceSession lifecycle
  transitions (Created/Opened/Closed/Cancelled and their guards),
  Floorplan selection/membership, and every existing Reservation's
  `servicePeriodId` value.
- **No authenticated human browser workflow has been completed** against
  either the API or the pilot panel for this milestone.
- **No development route was called, no development Service row was
  edited, and no development ServiceSession was created** — the one
  authorized development action was the read-only-verified schema
  migration itself (R1.6-P3C-1-A); every functional proof of the new
  behavior ran against the isolated test database or a fake/in-memory
  repository.
- **Nothing from either milestone has been deployed anywhere.**
- **P1-B11 remains untouched**, per standing instruction.

## R1-DOC-10 reconciliation — what R1.6-P3D-1/P3D-2 subsequently added

Everything above this section describes R1.6-P3C-1/P3C-2's own operating-
interval work exactly as it stood at that milestone and is left
unchanged — it was accurate then and remains an accurate historical
record. **Duration did not exist in any form at the P3C milestone** — do
not read anything above as claiming otherwise. This section records,
without rewriting any of it, what two later, separately authorized
milestones built as a genuinely SEPARATE concept alongside it.

**R1.6-P3D-1** (commit `9e9041641ac91929ffcb645dd9e235a2b6176cd2`,
2026-09-29, `feat(service): snapshot default duration`) added
`domain/availability/ServiceDefaultDuration.ts` (the atomic
`defaultDurationMinutes` scalar this report's own "next engineering
gate" and capability-status sections above had explicitly left
unresolved), two new nullable columns (migration
`20260928140000_add_service_default_duration`), and the same
copy-once-at-creation snapshot mechanism this report describes for the
operating interval — applied to `ServiceSession.durationSnapshotMinutes`
independently, with no pairing or cross-validation against
`operatingIntervalSnapshot`.

**R1.6-P3D-2** (commit `376980d76801880fe6f11473a135e9e3187b75c1`,
2026-09-29, `feat(service): manage default duration`) added, with no
further schema change: `PATCH /services/:code` acceptance of
`defaultDurationMinutes` (omitted/object/`null`, same contract shape as
`defaultOperatingInterval`) under provisional rule id `CAP-D02.01-R08`;
the "Diensten" panel's quarter-hour duration select and clear checkbox;
read-only `durationSnapshotMinutes` display in "Servicesessies"; and a
deterministic race proof using the REAL management write path.

`CAP-D02.01` remains `Designed` after all four milestones together; see
this capability's own registry entry (`R1-DOC-10` note) for the current
boundary of what remains undelivered. Full design, evidence, and test
totals for the duration work are in the dedicated
`R1_6_P3D_DEFAULT_DURATION_IMPLEMENTATION_REPORT.md`, not repeated here.
