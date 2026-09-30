# R1.6-P3 — Persisted Service Catalog and Management (P3A + P3B) Implementation Report

Mode: IMPLEMENTATION REPORT — consolidates work already implemented,
tested, committed, and pushed. No new production code is introduced by
this document. Written as part of R1-DOC-8 (Service Catalog Documentation
Reconciliation), alongside `capability-registry.yaml.md`'s CAP-D02.01
evidence note, `README.md`/`PILOT.md`'s correction of stale
"no persisted Service catalog" claims, and
`R1_6_P2B_CANONICAL_SERVICE_CODE_IMPLEMENTATION_REPORT.md`'s own appended
R1-DOC-8 reconciliation section.

Commits (verified directly from `git log`/`git show` before citing):

| Milestone | Commit | Date | Subject |
|---|---|---|---|
| R1.6-P3A | `5020a9843d1282c68be047a09c92fbe45cbf04c9` | 2026-09-23 | `feat(service): persist canonical service catalog` |
| R1.6-P3B | `a9899edad6f6cdbc4493a9c518e019c2a83c1e96` | 2026-09-23 | `feat(service): expose catalog management` |

Both are pushed to `origin/feat/ec-002-visibility-baseline`.

## Scope and decisions

R1.6-P2B (2026-09-10) shipped a code-level-only `lunch`/`dinner`
classification with no persisted `Service` row — explicitly out of scope
at the time (that report's own "Four distinct concerns" item 3). R1.6-P3
is the Chief-Engineer-authorized minimum slice that built the persisted
model that report identified as missing, split into two gated
milestones:

- **P3A** — the persisted `services` table, its migration, the
  ServiceSession→Service foreign key, and wiring
  `CanonicalServicePeriodReader` to consult it. Standing decisions: the
  catalog is fixed at exactly `lunch`/`dinner` (no Create/Delete Service
  operation); `code` is an immutable natural key; no schedule,
  operating-time, duration, capacity, area, or Floorplan configuration is
  in scope.
- **P3B** — an authenticated management API and pilot panel over that
  same table, limited to `displayName`/`enabled`. Standing decisions:
  last-write-wins is accepted for this small controlled pilot (no
  ETag/version precondition); disabling affects only *future* canonical
  Reservation/Walk-in validation, never existing Reservations or
  ServiceSession lifecycle.

`CAP-D02.01` (Service Management) remains `delivery_status: Designed`
throughout both milestones — see "Capability-status decision" below.

## P3A — persisted model and migration

**Migration:** `prisma/migrations/20260922145528_add_service_catalog/migration.sql`, applied via `prisma migrate deploy`. Contains, in order, and nothing else:

1. `CREATE TABLE "services"` — exact schema:
   ```
   code          TEXT PRIMARY KEY
   display_name  TEXT NOT NULL
   enabled       BOOLEAN NOT NULL
   created_at    TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
   updated_at    TIMESTAMPTZ NOT NULL
   ```
2. `INSERT INTO "services"` — exactly the two canonical seed rows this increment authorizes: `('lunch', 'Lunch', true, ...)`, `('dinner', 'Dinner', true, ...)`. No Create/Delete Service operation exists to add a third.
3. A `DO $$ ... END $$` safety guard, positioned **before** the foreign key statement: aborts the migration outright (`RAISE EXCEPTION`) if any pre-existing `service_sessions` row already carries a `service_code` outside `('lunch', 'dinner')` — verified structurally (guard's text index precedes the FK statement's) and, separately, with a real rollback-contained PostgreSQL proof (see "Test isolation strategy" below).
4. `ALTER TABLE "service_sessions" ADD CONSTRAINT "service_sessions_service_code_fkey" FOREIGN KEY ("service_code") REFERENCES "services"("code") ON DELETE RESTRICT ON UPDATE RESTRICT` — the ServiceSession→Service link.

**Immutable natural code:** `code` is the primary key and is never updated by any application code path — `ServiceDefinitionRepository.update()`'s own signature has no way to change it, and `PATCH /services/:code` (P3B) structurally rejects a body containing `code` before the service layer is ever reached.

**FK behavior, both actions RESTRICT:** `ON DELETE RESTRICT` — the two seeded rows are never deleted by anything in this codebase, so this can never fire in practice; it exists purely so an impossible `service_code` value can never be written at all. `ON UPDATE RESTRICT` (corrected from an initial `ON UPDATE CASCADE` during a Chief-Engineer review pass before this migration was ever applied to development) — `lunch`/`dinner` are the immutable natural key every `ServiceSession` derives its identity from; no application code ever renames a Service's `code`, and this FK ensures the database itself refuses any attempt to, rather than silently cascading a rename into every referencing `ServiceSession` row. Verified directly against PostgreSQL's own catalog (`pg_constraint.confdeltype`/`confupdtype`, both `'r'`), and against a real, rollback-contained rename attempt against a referencing row.

**Migration guard for incompatible existing data:** the `DO $$` block above is not merely documented as running before the FK — a real PostgreSQL proof (one dedicated `$transaction` connection: drop the FK, insert one validly-shaped, non-canonical `service_code` row, execute the *exact* committed guard SQL extracted verbatim from `migration.sql` at test time) confirms it raises, and the whole transaction rolls back automatically on that error — never a manual rollback call. The test fails if the guard is removed, moved after the FK, rewritten to silently rewrite/delete instead of raising, or checks the wrong table/column.

## Canonical Reservation and Walk-in validation behavior

`CanonicalServicePeriodReader` (R1.6-P2B's own validator) gained a
required `ServiceDefinitionRepository` constructor dependency. After its
pre-existing derived-code mismatch check (unchanged, still defaults to
`CAP-D01.01-R06`), it now also looks up the persisted row for the
matching code:

- **Missing or disabled — same outcome, deliberately indistinguishable
  at this boundary:** `{ isValid: false, reason: "The requested Service
  is not currently available.", ruleId: "CAP-D02.01-R01" }`. The message
  never mentions a row/database/persistence detail.
- **Validation precedence unchanged:** the mismatch check still fires
  first — a mismatched-but-canonical `servicePeriodId` is rejected for
  the mismatch even when the *supplied* code's Service is disabled or the
  *matching* code's Service is enabled; the persisted-catalog check is
  never reached until the mismatch check has already passed.
- **Why legacy Reservations have no FK and remain unchanged:** the four
  pre-existing `helix_reservations_dev` Reservations carry the legacy
  `servicePeriodId` value `"sp-dinner"` — not a canonical code the
  `services` table's FK could even reference (the FK constrains
  `service_sessions.service_code`, never `reservations.service_period_id`
  at all; no such constraint exists or was added). R1.6-P2B's own
  "Accepted limitations" already established these rows are not
  backfilled and are never rewritten by an unrelated modification — P3A
  does not change that. Confirmed directly: these four values remain
  byte-identical `["sp-dinner","sp-dinner","sp-dinner","sp-dinner"]`
  across every verification pass in both milestones.
- **Contact/snapshot-only Modify unaffected:** `ModifyReservationHandler`'s
  own decision table has no `else` branch when neither `servicePeriodId`
  nor `reservationDate` changes — the Service catalog (and
  `servicePeriodReader` generally) is never consulted for that class of
  modification, unchanged by P3A/P3B.

## P3B — application service and repository update contract

**Repository** (`domain/repositories/ServiceDefinitionRepository.ts`,
`infrastructure/persistence/PrismaServiceDefinitionRepository.ts`): added
`update(code: ServiceCode, patch: { displayName?: string; enabled?:
boolean }, tx?)`. No create, no delete, no way to change `code`. The
Prisma adapter treats a P2025 ("record to update not found") as `null`,
never thrown — a defensive case only, since every real caller already
validated `code` is canonical and looked the row up first.

**Application service**
(`application/availability/ServiceCatalogManagementService.ts`):

- `list()` returns the fixed catalog in an *enforced* `lunch`-then-`dinner`
  order, never trusting the repository's own row order.
- `update(code, patch)` treats any non-canonical code string and any
  canonical code with no row identically as `SERVICE_NOT_FOUND` — the
  repository is never even queried for a non-canonical string.
- **Same-value idempotency:** the service computes the diff between the
  supplied patch and the *current* row before calling the repository at
  all. If the effective result would be byte-identical to the current
  row, `repository.update()` is never called — the outcome is still
  `UPDATED`, returning the existing row exactly as-is, so `updatedAt` is
  never bumped for a no-op request. (Prisma's own `@updatedAt` directive
  bumps the timestamp on *every* `.update()` call regardless of whether
  values actually changed — this idempotency check exists precisely
  because relying on Prisma to skip the write would not work.)
- **Partial updates preserve unspecified fields:** only the fields that
  actually differ are ever included in the patch handed to the
  repository — updating `enabled` alone never touches `displayName`, and
  vice versa, verified both against the in-memory fake and against a
  real, rollback-contained PostgreSQL update of the canonical `lunch` row.

## GET and PATCH API contracts

**`GET /services`** — `requireStaffSession` only, no specific permission.
Returns `{ services: [{ code, displayName, enabled, createdAt, updatedAt
}] }`, deterministic `lunch`-then-`dinner` order, exactly those five
keys, no internal metadata.

**`PATCH /services/:code`** — `requireStaffSession` +
`Permission.CapacitySettingsManage` (the pre-existing permission already
used by `/service-sessions`, `/floorplans*`, `/closing-days` — no new
permission was added). Structural/domain validation runs in the route
handler before the application service is ever called, using the
established `RuleViolation { ruleId, message }` / `422 { violations }`
envelope (`domain/shared/Result.ts`'s `violation()` helper, the same
convention Reservation command handlers use):

| Condition | `ruleId` |
|---|---|
| Non-object body | `CAP-D02.01-R02` |
| Neither `displayName` nor `enabled` present | `CAP-D02.01-R02` |
| Unknown key in body | `CAP-D02.01-R03` |
| `code` present in body | `CAP-D02.01-R04` |
| `displayName` not a non-empty-after-trim string | `CAP-D02.01-R05` |
| `enabled` not a boolean | `CAP-D02.01-R06` |

Typed failure: `404 { type: "SERVICE_NOT_FOUND" }` — covers both an
outright non-canonical `:code` and a canonical code with no row,
deliberately indistinguishable to the caller. Success: `200 { type:
"UPDATED", service: {...} }` (same five-key shape as the GET row).

## Authentication and permission boundaries

`GET /services` requires only a valid staff session — any real role can
read the catalog, matching `/floorplans`/`/service-sessions`'s own
read-permission posture. `PATCH /services/:code` requires
`Permission.CapacitySettingsManage`, held only by Owner and Manager in
the current role matrix (`domain/rules/StaffAuthorizationPolicy.ts`) —
Reception, AssistantManager, Supervisor, and ReservationAgent all get
`403`. No synthetic unauthorized role was needed for test coverage: the
real role matrix already includes both permitted and unauthorized roles.

## Production reuse of one repository instance

`api/server.ts` constructs exactly one
`PrismaServiceDefinitionRepository(prisma)` instance and shares it,
unconditionally, between `servicePeriodReader:
new CanonicalServicePeriodReader(serviceDefinitionRepository)` and the
new `serviceCatalog: { repository: serviceDefinitionRepository }` block
— never a second instance, never a second `PrismaClient`. Verified
directly against the committed diff: exactly one
`new PrismaServiceDefinitionRepository(` call exists in that file.

## Pilot UI behavior and confirmation ordering

A "Diensten" panel in `public/pilot.html`, placed near Servicesessies and
Floorplannen, never wired to the Dagoverzicht date. Renders server-
returned rows only (no hardcoded display names or enabled state); a
per-row Save button is enabled only when that row's pending edit differs
from the last authoritative load, and sends only the fields that changed.
One panel-wide in-flight guard (cleared in `finally`) prevents duplicate
submission; a monotonic request token discards a stale load response;
stale rows are cleared before an authoritative reload.

**Confirmation ordering, exactly:** a native `confirm()` fires if and
only if the save would set `enabled: false` — never for a rename, and
never for enabling. The call happens strictly before the in-flight guard
is set and before any `fetch()` — Cancel returns immediately, issuing no
request at all. The confirmation text states that future reservations
for that Service will be blocked from that point, and that existing
reservations and ServiceSessions are not changed by it; it makes no claim
about schedule or session-closure behavior, since none exists. A
successful save reloads authoritative data after its own success message
is shown, using a message element separate from the one load failures
use, so one can never silently overwrite the other. 401/403 map to one
generic Dutch permission message; `SERVICE_NOT_FOUND` maps to a refresh
instruction; nothing raw (JSON, a `type` string, a rule id, a role, or a
permission name) is ever rendered. No client-side role/permission
branching exists anywhere in the panel.

## Test isolation strategy

No test in either milestone leaves either shared canonical `lunch`/
`dinner` row mutated, verified by direct post-suite database reads at
every commit/push gate this session. Three distinct techniques were used,
matched to what each test needed to prove:

1. **In-memory fakes** (`FakeServiceDefinitionRepository`,
   `tests/support/FakePorts.ts`) — every application-, API-, and
   canonical-integration-level test that needs *some* Service-definition
   state uses this, never the real database.
2. **Rollback-contained real-PostgreSQL transactions** — where a real
   proof against the actual migration/FK was required (the migration
   guard's own failure behavior; the FK's `RESTRICT` update action; the
   repository's real `update()` path), a single `prisma.$transaction`
   callback performs the mutation, asserts on it, and either throws
   deliberately (guard/FK proofs) or is followed by an unconditional
   throw (a `RollbackSentinel`) so Prisma's automatic rollback discards
   everything — never a manual `ROLLBACK` call, and a `finally` safety net
   guards against a hypothetical future regression leaving residue.
3. **Throwaway non-canonical rows**, created and deleted within a single
   test — used only where the real Prisma adapter's column-mapping needed
   proving independent of the two canonical rows (`enabled`/`disabled`
   mapping in `tests/infrastructure/prisma-service-definition-repository.test.ts`).

## Development activation state

The P3A migration (`20260922145528_add_service_catalog`) was applied to
`helix_reservations_dev` in a separate, explicit, Chief-Engineer-
authorized step after R1.6-P3A's own commit — independently verified via
a live query (`current_database()`, `current_user`, loopback, port) before
running, never by parsing `.env` alone. As of this report:

- 12 of 12 migrations applied, 0 rolled back.
- `services` holds exactly two rows: `lunch`/`Lunch`/enabled,
  `dinner`/`Dinner`/enabled.
- `ServiceSessions = 0`.
- The four legacy Reservations retain `servicePeriodId: "sp-dinner"`,
  byte-identical to before either milestone.
- Main Floor / operational data (Tables=23, Seats=40, 23
  FloorplanVersionResource memberships) unchanged throughout.

**P3B was not exercised through a real development route or an
authenticated browser workflow** — no staff member has logged in and
used the "Diensten" panel or called `GET`/`PATCH /services*` against a
running deployment. **No Service row was changed in development** by
either the API or the UI — every mutation exercised anywhere in this work
was against a fake repository or a transaction that always rolled back.
**No ServiceSession was created or opened.** **Nothing was deployed.**
**P1-B11 was not executed.**

## Automated verification totals

Verified directly by re-running the relevant files immediately before
this report, and cited from the same fresh runs performed at each
milestone's own commit/push gate:

- P3A-authored/-touched files: `tests/integration/canonical-service-period.test.ts`
  (21), `tests/integration/service-catalog-migration.test.ts` (11),
  `tests/infrastructure/canonical-service-period-reader.test.ts` (14).
- P3B-authored files: `tests/application/service-catalog-management-service.test.ts`
  (14), `tests/infrastructure/prisma-service-definition-repository.test.ts`
  (10 — 7 from P3A plus 3 added by P3B's `update()` coverage),
  `tests/application/service-catalog-canonical-integration.test.ts` (7),
  `tests/api/services.test.ts` (27), `tests/pilot/service-catalog-ui.test.ts`
  (33).
- Combined canonical/ServiceSession/Reservation/Walk-in/pilot regression
  set (23 files, run together at the P3B commit gate): 557/557.
- Full isolated suite at P3B's own push gate: **100 files / 1748 tests /
  0 failed / 0 skipped**. Typecheck clean at every gate in both
  milestones.

## Capability-status decision

`CAP-D02.01` (Service Management) remains `delivery_status: Designed`
after both milestones — not promoted to `Pilot`, unlike `CAP-D03.02`'s
R1-DOC-7 promotion. Reasoning, checked directly against the capability's
own registry entry before writing this: its registered `owns.rules` are
*service naming*, *default operating times*, and *default reservation
duration*; its registered `owns.events` are `ServiceCreated`,
`ServiceModified`, and `ServiceDeactivated`. This slice delivers only a
partial `ServiceModified` (`displayName`/`enabled` only, not full
identity/naming authority) — default operating times, default reservation
duration, `ServiceCreated`, and `ServiceDeactivated` do not exist in any
form. No schedule, operating-time, or duration persistence exists
anywhere in this codebase; this report does not claim otherwise.

## Accepted limitations and next engineering gate

- No Create or Delete Service operation — the catalog is permanently
  fixed at `lunch`/`dinner` until a separately authorized milestone adds
  one.
- No schedule, default operating time, or default reservation duration
  management — the capability's own most substantial owned rules remain
  entirely undelivered.
- No ETag/version precondition on `PATCH /services/:code` — last-write-
  wins is an accepted decision for this small, two-row, controlled pilot,
  not an oversight.
- No human/browser smoke test of either the API or the pilot panel has
  been performed against a real running deployment.
- Nothing from either milestone has been deployed anywhere.
- Unchanged from R1.6-P2B's own conclusion: no further Service/
  ServiceSession/Service-catalog implementation should begin before the
  remaining product-owner decisions those earlier reports identified
  (whether/when to build Create/Delete Service, schedule/duration
  management, and any concurrency-precondition mechanism) are resolved.
  This report does not reopen or resolve any of them.

## R1-DOC-9 reconciliation — what R1.6-P3C-1/P3C-2 subsequently added

Everything above this section describes R1.6-P3A/P3B exactly as it stood
at that milestone and is left unchanged — it was accurate then and
remains an accurate historical record. This section records, without
rewriting any of it, what two later, separately authorized milestones
built on top of that foundation.

**R1.6-P3C-1** (commit `be5926fbb61383141e5fbcd780e98e918c422e40`,
2026-09-25, `feat(service): snapshot operating intervals`) added:

- `domain/availability/ServiceOperatingInterval.ts` — the atomic
  `{startMinute,endMinute}` value type this report's own "next
  engineering gate" section above had explicitly left unresolved
  ("default operating time... management" as a still-undelivered owned
  rule).
- Two new nullable-pair columns on `services`
  (`default_start_minute`/`default_end_minute`) and two on
  `service_sessions` (`start_minute`/`end_minute`), migration
  `20260925120000_add_service_operating_interval`, each pair backed by a
  database `CHECK` constraint mirroring the domain constructor's own
  paired-null/bounded-minute/`end > start` rules.
- `ServiceSession` creation copies the owning Service's CURRENT interval
  exactly once, resolved by the `POST /service-sessions` route handler
  itself (not `ServiceSessionService`, which still has no
  `ServiceDefinitionRepository` dependency — a deliberate, tested
  invariant).
- Read-only exposure only at this milestone: `GET /services` and
  `GET /service-sessions` both surface the new fields; `PATCH
  /services/:code` still rejected `defaultOperatingInterval` as an
  unknown field, and the "Diensten" panel had no editor for it yet —
  editing was explicitly deferred to R1.6-P3C-2.

**R1.6-P3C-2** (commit `c93f6576e512bc75b84ab7105ace494e86b20746`,
2026-09-28, `feat(service): manage operating intervals`) added, with NO
further schema or migration change:

- `PATCH /services/:code` now accepts an optional
  `defaultOperatingInterval`: omitted means no change, a complete object
  atomically sets both columns in one write, `null` atomically clears
  both — under one new provisional rule id, `CAP-D02.01-R07`, validated
  exclusively through `createServiceOperatingInterval` (no duplicated
  range/pairing logic in the route).
- `ServiceCatalogManagementService.update()` and
  `PrismaServiceDefinitionRepository.update()` both extended with the
  same same-value/same-null no-op idempotency the pre-existing
  `displayName`/`enabled` fields already had.
- The "Diensten" pilot panel gained quarter-hour start/end selects and an
  explicit clear checkbox, submitted atomically, changed-fields-only, no
  new confirmation prompt.
- A deterministic, barrier-controlled (not timing-only) proof that a
  concurrent Service-interval update and a ServiceSession creation can
  each only ever produce a COMPLETE old or COMPLETE new snapshot pair,
  never a mix, and that an already-created session's snapshot is never
  rewritten by a later Service edit (including a full clear).

**Both milestones together:** `helix_reservations_dev` has the migration
applied; `lunch` holds `[720,960)`; `dinner` holds `null`;
`ServiceSessions = 0`; no development Service row has been edited and no
development ServiceSession has been created since activation; no
authenticated human browser workflow has exercised either panel; nothing
has been deployed anywhere. `CAP-D02.01` remains `Designed` — see this
capability's own registry entry (`R1-DOC-9` note) for the precise,
current boundary of what remains undelivered. Full design, evidence, and
test totals for both milestones are in the dedicated
`R1_6_P3C_SERVICE_OPERATING_INTERVAL_IMPLEMENTATION_REPORT.md`, not
repeated here.

## R1-DOC-11 reconciliation — P3C, P3D, and P3G summarized; why `CAP-D02.01` now meets the registry's `Pilot` threshold

Appended 2026-09-29, as part of R1-DOC-11 (Service Management Capability
Completion and Pilot Promotion). This section is additive only — nothing
above in this report is rewritten. Every hash/date/subject below was
verified directly against `git log`/`git show` before being written here.

**P3C — default operating times** (already detailed in the R1-DOC-9
section immediately above; summarized here only for a single, complete
narrative arc): R1.6-P3C-1 (`be5926fbb61383141e5fbcd780e98e918c422e40`,
2026-09-25) and R1.6-P3C-2 (`c93f6576e512bc75b84ab7105ace494e86b20746`,
2026-09-28) delivered a persisted, optional, atomically-paired
`defaultOperatingInterval` per Service, an immutable `ServiceSession`
snapshot taken once at creation, and `PATCH /services/:code` editing
under rule id `CAP-D02.01-R07`.

**P3D — default reservation duration** (not previously covered in this
report; commits verified directly):

| Milestone | Commit | Date | Subject |
|---|---|---|---|
| R1.6-P3D-1 | `9e9041641ac91929ffcb645dd9e235a2b6176cd2` | 2026-09-29 | `feat(service): snapshot default duration` |
| R1.6-P3D-2 | `376980d76801880fe6f11473a135e9e3187b75c1` | 2026-09-29 | `feat(service): manage default duration` |

R1.6-P3D-1 added an optional `Service.defaultDurationMinutes` (integer
minutes, `[15,480]`, a multiple of 15; `null` = not configured) — a
concept entirely separate from `CapacityPool.durationMinutes` (the live,
area-keyed Sushi/Teppanyaki capacity-duration authority owned by
`CAP-D02.03`) — plus a matching immutable `ServiceSession.durationSnapshotMinutes`,
copied from the owning Service's current duration exactly once at
session creation. R1.6-P3D-2 extended `PATCH /services/:code` to accept
`defaultDurationMinutes` (omitted/set/clear, same no-op idempotency
contract as every other field) under rule id `CAP-D02.01-R08`, and gave
the "Diensten" panel a matching quarter-hour select and clear checkbox.
Both milestones' evidence: a barrier-controlled, non-timing-only
concurrent race proving an already-created session's snapshot is never
rewritten by a later Service edit; `helix_reservations_dev` has the
migration applied, both canonical Services hold
`defaultDurationMinutes = null` (no accepted product value exists for
either), `ServiceSessions = 0`. Full design and evidence:
`R1_6_P3D_DEFAULT_DURATION_IMPLEMENTATION_REPORT.md`.

**P3G — Service audit trail** (commit `221e452955887dc8e96c524fd1a9f0c2413eafd7`,
2026-09-29, `feat(service): audit catalog changes`): delivered this
capability's remaining owned surface — every real (non-no-op)
`PATCH /services/:code` mutation now writes exactly one `SecurityEvent`
(`ServiceModified`, `ServiceDeactivated` on a true→false `enabled`
transition, or `ServiceReactivated` on false→true), atomically with the
Service row write via a real row lock (`SELECT ... FOR UPDATE`) and one
shared transaction — a failure on either write rolls both back. Full
detail, evidence, and test totals:
`R1_6_P3G_SERVICE_CATALOG_AUDIT_IMPLEMENTATION_REPORT.md`.

**Why `CAP-D02.01` now meets the registry's `Pilot` threshold.** This
registry's own established meaning of `Pilot` — set by the `CAP-D03.02`/
R1-DOC-7 precedent and `CAP-D04.05` before it — is "delivered and
automated-tested, exposed through code/UI," not "human-exercised" or
"deployed" (those remain accepted `Pilot → Active` concerns). Measured
against that bar, every rule `CAP-D02.01` actually owns is now delivered:
service naming (within the fixed, migration-seeded `lunch`/`dinner`
catalog — the capability was never meant to support runtime Service
creation, so this is the complete rule, not a partial slice of a larger
one), default operating times (P3C), default reservation duration (P3D),
and the lifecycle-audit surface (P3G) — and the management API and pilot
UI expose all of it. `ServiceCreated` is not counted against this
threshold: it was removed from this capability's registered
`owns.events` (see the registry's own R1-DOC-11 note) because no runtime
Service-creation path exists or is planned — there is no lifecycle
moment for it to represent, the same reasoning `CAP-D03.02`'s own
R1-DOC-7 promotion already established for events representable purely
through reconstructed state. `CAP-D02.01` was promoted `Designed` →
`Pilot` on this basis. `CAP-D02.02` remains `Designed`, unaffected by
this promotion — its own persisted reservation-to-session relationship
still does not exist.
