# R1.6-P3G — Service Modification and Activation-State Audit Events Implementation Report

Mode: IMPLEMENTATION REPORT — consolidates work already implemented,
tested, committed, and pushed. No new production code is introduced by
this document. Written as part of R1-DOC-11 (Service Management
Capability Completion and Pilot Promotion), alongside
`capability-registry.yaml.md`'s `CAP-D02.01` evidence note (which also
records the `Designed` → `Pilot` promotion this milestone's delivery
makes possible), and `README.md`/`PILOT.md`'s correction of stale
"remains `Designed`"/"`ServiceCreated`/`ServiceDeactivated` remain
entirely undelivered" claims.

Commit (verified directly from `git log`/`git show` before citing):

| Milestone | Commit | Date | Subject |
|---|---|---|---|
| R1.6-P3G | `221e452955887dc8e96c524fd1a9f0c2413eafd7` | 2026-09-29 | `feat(service): audit catalog changes` |

Sole parent: `03a24236b35342874890ce56aea63cea199280e6`. Pushed to
`origin/feat/ec-002-visibility-baseline`.

## Scope and accepted decisions

Accepted, final for this milestone (Chief Engineer directive):

1. `CAP-D02.01` owns the fixed canonical `lunch`/`dinner` Service catalog.
2. `displayName` editing satisfies the capability's Service-naming rule
   within that fixed catalog.
3. No runtime Service creation, deletion, or code renaming is supported.
4. Sushi and Teppanyaki remain `CapacityPool` concepts owned by
   `CAP-D02.03`, outside this capability.
5. Runtime Service audit events are exactly `ServiceModified`,
   `ServiceDeactivated`, `ServiceReactivated`.
6. `ServiceCreated` is not a runtime event: canonical Services are
   migration-seeded and no runtime creation path exists.
7. Audit events are `SecurityEvent` records, written atomically with the
   real Service mutation they describe.
8. A same-value update produces neither a Service write nor an event.

## Transaction and row-lock sequence

`ServiceCatalogManagementService.update()` (`application/availability/ServiceCatalogManagementService.ts`)
runs its entire read-compare-write-audit sequence inside one
`transactionManager.runInTransaction()` call:

1. `ServiceDefinitionRepository.lockAndFindByCode(code, tx)` — a real
   `SELECT ... FOR UPDATE` (`PrismaServiceDefinitionRepository.ts`,
   issued through the transaction client via `asPrismaTx(tx)`) — locks
   the target row and returns its authoritative, post-lock state. `tx`
   is a required parameter on this method (not optional, unlike every
   other repository method here): a row lock taken outside an open
   transaction releases the instant the single `SELECT` statement
   completes, which would serialize nothing.
2. If no row exists for `code`, returns `SERVICE_NOT_FOUND` — no write,
   no event.
3. The requested patch is compared against the LOCKED read (never a
   pre-transaction/unlocked one). If nothing actually differs, returns
   `UPDATED` with the existing row unchanged — no repository call, no
   event, `updatedAt` untouched.
4. Otherwise, `repository.update(code, changes, tx)` performs the one
   atomic Service `UPDATE`, and exactly one `securityEventRecorder`
   method is called with the same `tx` (see "Event-selection precedence"
   below).
5. Both writes commit together at the end of `runInTransaction()`; any
   thrown error anywhere in the callback causes Prisma to roll back both
   (see "Fail-closed rollback behavior" below).

## Event-selection precedence

Exactly one branch fires per real (non-no-op) update:

- `enabled` transitions `true → false` → `ServiceDeactivated`.
- `enabled` transitions `false → true` → `ServiceReactivated`.
- Any other real change (including an activation transition combined
  with other field changes) → the activation-state event fires and its
  metadata carries every changed field in that request; there is never a
  separate `ServiceModified` alongside it. A real change with no
  `enabled` transition at all → `ServiceModified`.

Verified directly in `application/availability/ServiceCatalogManagementService.ts`:
the `if (changes.enabled === true) ... else if (changes.enabled === false) ... else ...`
branch is evaluated once per call, after the full `changes` object
(every changed field) has already been built, and the SAME `changes`
object is what `buildServiceChangeMetadata()` reads from regardless of
which branch fires.

## Metadata allowlist

One stable JSON shape, `{ serviceCode, changes }` (`ServiceChangeMetadata`,
`application/ports/SecurityEventRecorder.ts`):

- `serviceCode` — the Service `code` ("lunch" or "dinner").
- `changes` — only the public domain field names that actually changed
  (`displayName`, `enabled`, `defaultOperatingInterval`,
  `defaultDurationMinutes`, in that fixed order — never a database
  column name), each as an explicit `{ old, new }` pair, with `null`
  preserved rather than omitted.

Never included: the raw request body, session data, credentials,
headers, exception messages, or permission names — the metadata object
is built entirely from the already-validated `changes`/`existing` values
inside `ServiceCatalogManagementService`, never from anything the caller
passed through unvalidated.

## Actor attribution

`api/app.ts`'s `PATCH /services/:code` handler reads
`req.staffPrincipal.staffUserId` (set by `requireStaffSession`, the
authenticated session) and passes it as `update()`'s `actingStaffUserId`
argument — the route never reads or trusts any actor field from
`req.body`. `PrismaSecurityEventRecorder` writes it into
`SecurityEvent.actingStaffUserId`; `targetStaffUserId` is hardcoded
`null` for all three Service event types (a Service is not a
`StaffUser`).

## Projection and AuditView behavior

`GET /security-events` and its permission (`Permission.AuditView`) are
unchanged — no new route, no new permission. `SecurityEventProjection.ts`
adds a `serviceChange: ServiceChangeMetadata | null` field to
`SecurityEventProjectionRow`, populated only for the three new event
types (`null` for `LoginFailed`/`OwnerBootstrapped`/any other type,
mirroring the existing `reason` field's own "always present, null when
not applicable" convention) and never exposing the raw `metadata` string.

## Fail-closed rollback behavior

Both directions proven against real PostgreSQL
(`tests/integration/service-catalog-audit-transaction.test.ts`):

- A temporary `CHECK` constraint on `security_events.acting_staff_user_id`
  forces the audit insert to fail — the Service mutation rolls back
  (`displayName`/`updatedAt` verified unchanged afterward).
- A temporary `CHECK` constraint on `services.display_name` forces the
  Service write to fail — zero `SecurityEvent` rows are inserted
  (verified via a table-wide count comparison before/after).

No new public failure contract was introduced: an unhandled rejection
from inside the transaction reaches Express 5's existing catch-all error
middleware (`api/app.ts`, mounted once for the whole app), the same
generic 500 JSON response every other unexpected infrastructure fault
already produces.

## Same-Service and different-Service concurrency evidence

Also in `tests/integration/service-catalog-audit-transaction.test.ts`,
against real PostgreSQL, using a genuine second/third connection
(`prismaB`/`prismaC`), never `Promise.all()` timing alone:

- **Same Service**: transaction A locks `lunch` (via
  `lockAndFindByCode`) and pauses on an explicit test-controlled gate
  (`Promise`-based, not a timeout); a REAL, unmodified
  `ServiceCatalogManagementService.update()` call (transaction B) is
  started against the same row; the test polls `pg_locks` for
  `locktype = 'transactionid'` rows sharing one xid, one `granted` and
  one not — the documented PostgreSQL signature for a blocked
  `SELECT ... FOR UPDATE` (a row lock is enforced via the tuple's own
  `xmax`, not a persistent `tuple`-type `pg_locks` row for its holder,
  so contention shows up as a wait on the holder's transaction id, not
  as a `tuple` lock). Once contention is observed, A is released and
  commits; B's own recorded metadata `old` value for `displayName` is
  then asserted to equal A's COMMITTED value (`"A-FIRST"`), never the
  stale pre-lock value (`"Lunch"`) — the decisive proof that B's locked
  read genuinely blocked until after A committed, not merely that some
  lock existed.
- **Different Services**: `service.update("lunch", ...)` and a second
  instance's `serviceB.update("dinner", ...)` are run via a real
  `Promise.all`; both complete independently, each with its own correct
  `serviceCode` in its own recorded metadata, with no cross-contamination
  asserted.

## Malformed-metadata handling

`SecurityEventProjection.ts`'s `parseServiceChange()` is attempted only
for the three Service event types; it validates the full shape
(`serviceCode` a string, `changes` a plain object whose every value is
itself a plain `{old,new}` pair) before trusting any of it, and collapses
the WHOLE result to `null` on any deviation — unparsable JSON, a
non-object, a missing/extra key, a malformed nested value — never
throwing and never leaking the raw `metadata` string. Covered in
`tests/api/security-events.test.ts` with dedicated malformed/legacy-shape
fixtures (not-JSON, wrong top-level shape, missing `old`/`new` keys) each
asserted to project `serviceChange: null` without affecting the response
status or any other row in the same response.

## Pilot label change

`public/pilot.html`'s `SECURITY_EVENT_TYPE_LABELS` dictionary (used by
the existing "Beveiligingsgebeurtenissen" panel's already-generic,
already-safe rendering — unknown types already fell back to the raw type
string) gained exactly three entries: `ServiceModified` →
"Dienst gewijzigd", `ServiceDeactivated` → "Dienst gedeactiveerd",
`ServiceReactivated` → "Dienst gereactiveerd". No other pilot markup,
script, or panel was touched.

## Test totals

Verified directly from this session's own fresh `vitest run` output:

- `tests/support/FakePorts.ts` — extended with `FakeSecurityEventRecorder`
  and `FakeServiceDefinitionRepository.lockAndFindByCode` (not itself a
  test file).
- `tests/application/service-catalog-management-service.test.ts` — 47
  tests (includes a new "R1.6-P3G audit-event selection" block).
- `tests/application/service-catalog-canonical-integration.test.ts` — 17
  tests.
- `tests/api/services.test.ts` — 77 tests (includes a new "R1.6-P3G
  Service audit events" block).
- `tests/api/security-events.test.ts` — 41 tests (includes new
  "R1.6-P3G Service audit event projection" and real end-to-end blocks).
- `tests/api/service-sessions.test.ts` — 48 tests (compatibility fix
  only: `serviceCatalog.transactionManager` added).
- `tests/api/server-wiring.test.ts` — 38 tests (compatibility fix only:
  the `serviceCatalog` block's exact-shape assertions updated for the new
  `transactionManager` field).
- `tests/infrastructure/prisma-service-definition-repository.test.ts` —
  31 tests (includes a new `lockAndFindByCode()` block, including a real
  `FOR UPDATE NOWAIT` proof against a second connection).
- `tests/infrastructure/canonical-service-period-reader.test.ts` — 14
  tests (compatibility fix only: its hand-written test double implements
  the new `lockAndFindByCode` method).
- `tests/integration/identity-access.test.ts` — 25 tests (compatibility
  fix only: its inline test double implements the port's three new
  methods).
- `tests/integration/service-catalog-audit-transaction.test.ts` — 4
  tests, new file (fail-closed rollback both directions, same-Service and
  different-Service concurrency).

Full isolated suite, run twice for stability in this session:
**104 files / 2013 passed / 0 failed / 0 skipped**, both runs. Typecheck
clean before and after.

## Development state

`helix_reservations_dev` was not written to by this milestone's
implementation or verification: every test above ran against
`helix_reservations_test` only. Verified directly, before and after
implementation: 14/14 migrations applied, 0 pending; both canonical
Services' `defaultDurationMinutes` remain `NULL`; `ServiceSessions = 0`;
no development Service row was mutated, no development ServiceSession
was created, and no development `SecurityEvent` was written by this
milestone. No real HELIX service was started at any point during this
milestone's implementation, verification, commit, or push.

## Capability-promotion rationale

See `capability-registry.yaml.md`'s own R1-DOC-11 note under
`CAP-D02.01` for the full rationale; summarized here: this registry's
established meaning of `Pilot` (the `CAP-D03.02`/R1-DOC-7 and
`CAP-D04.05` precedents — automated-tested and code/UI-exposed, not
necessarily human-exercised or deployed) is now met, because every rule
this capability actually owns — service naming within the fixed catalog,
default operating times, default reservation duration, and the
lifecycle-audit surface delivered here — is delivered and
automated-tested, and the management API/pilot UI expose all of it.
`ServiceCreated` was removed from this capability's registered
`owns.events` rather than counted as an outstanding gap, because no
runtime Service-creation path exists or is planned — there is no
lifecycle moment for it to represent. `CAP-D02.01` was promoted
`Designed` → `Pilot`. `CAP-D02.02` remains `Designed`, unaffected.

## Explicit exclusions and accepted limitations

This milestone does NOT claim, and none of the above should be read as
claiming:

- A runtime `ServiceCreated` event — none was added; the capability's
  registered event list no longer includes it.
- Runtime Service creation or deletion — no such route or method exists;
  the catalog remains fixed by migration seed data.
- A human pilot run — no staff member has logged in and exercised this
  behavior through a running server.
- A browser smoke test — none was performed.
- Deployment — nothing was deployed anywhere.
- A development Service mutation — no development Service row was
  changed by this milestone.
- A development ServiceSession — none was created by this milestone.
- Dynamic Sushi or Teppanyaki Services — those remain `CapacityPool`
  concepts owned by `CAP-D02.03`, entirely outside this capability's
  fixed `lunch`/`dinner` catalog; this milestone does not introduce, and
  does not imply, any dynamic or staff-creatable Service identity.

Accepted `Pilot → Active` limitations, not blockers to `Pilot` itself:
no authenticated human browser workflow or smoke test has been
performed, and nothing has been deployed anywhere — the same posture
`CAP-D03.02`'s own R1-DOC-7 promotion already established as acceptable
at this registry's `Pilot` threshold.
