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
