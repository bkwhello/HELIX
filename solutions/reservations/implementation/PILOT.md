# Controlled Pilot — Create Reservation + Daily List + Floor & Seating

Scope: Create Reservation, the daily list (`GET /reservations`), the
Floor & Seating actions (assign, pre-assign, move, mark-seated, no-show
release, floor/late-arrival view, Resource Blocking, walk-in), and a
read-only Security Events view (Owner/Manager only) — all wired into
`public/pilot.html` and covered by the automated suite (see "Floor &
Seating status" and "Security Events status" below for exactly what that
does and does not mean). Confirm/Modify/Cancel/Complete are implemented
and tested at the domain level but have not been through this same
pilot-readiness pass — do not rely on them operationally yet (see README,
Known Limitations).

## What this actually is

A single staff-facing page (`public/pilot.html`, served at `/pilot.html`)
that talks to the real API and real database. This is not a mockup —
reservations entered here are real, persisted rows. Treat it as such.

## Floor & Seating status (P1-B1–P1-B9)

The Floor & Seating implementation sequence (P1-B1 through P1-B9) is
closed: assign, pre-assign, move, mark-seated, no-show release, the
floor/late-arrival view, Resource Blocking, and walk-in creation are all
exposed as HTTP routes, permission-gated, wired into `public/pilot.html`,
and covered by automated tests — including real-PostgreSQL concurrency
tests proving the locking behavior under genuine concurrent load (see
`tests/integration/floor-seating-concurrency.test.ts` and
`tests/api/resource-blocks.test.ts`).

**What "closed" does NOT mean here**: this is automated verification, not
a human pilot run. No staff member has yet walked through these actions
against a real dev deployment, and this capability set has not been
deployed anywhere. Before relying on Floor & Seating operationally, run a
controlled development smoke test (a real staff member exercising
assign → pre-assign → mark-seated → move → block → no-show against the
dev environment) — this has not happened yet as of this document.

**Known, accepted limitations** (deliberate scope decisions, not defects):
- Resource Blocking is deleted (unblocked) as a **hard delete** — no
  audit trail (no record of who removed a block or when), matching the
  existing Closing Days pattern. No schema change is planned for this.
- A block always applies to an entire Table (and every Seat under it, for
  a Teppanyaki grill) — there is no way to block a single individual
  seat.
- The floor/late-arrival view (`GET /floor`) does **not** show which
  tables are currently blocked — Resource Blocking has its own separate
  list in the pilot for that. A blocked table with no reservation on it
  produces no visible signal on the floor view.

**Seating consistency (R1.5-P1A, R1.5-P1B0/P1B)**: completing a
reservation now releases its active seating assignment; a capacity-
relevant Modify now retains or releases seating instead of leaving it
silently stale; the Tier-3 seating-resource lock (assign/move/modify vs.
Resource Block) was normalized to always lock the parent Table, closing
a real race window; `ResourceBlockService.blockTable`'s conflict check
now includes child-Seat claims, not just the Table itself. Same
automated-only posture as above — see `README.md`'s Status section for
the full evidence.

## Security Events status (R1.7-P1)

A read-only "Beveiligingsgebeurtenissen" section, visible to Owner and
Manager only (`Permission.AuditView`), lists recorded `LoginFailed`/
`OwnerBootstrapped` events — timestamp, event type, resolved actor/target
identity where available, and a human-readable login-failure reason.
Nothing in this section can mutate, delete, or acknowledge an event. A
staff member without `Permission.AuditView` never sees the section at
all — it hides itself on a `401`/`403` rather than showing an error, the
server remains the sole authority. Covered by `tests/api/security-events.test.ts`
(35 tests) and `tests/pilot/security-events-ui.test.ts` (9 source-text
tests); no human smoke test has been performed, same as Floor & Seating
above. See `R1_7_SECURITY_EVENT_VISIBILITY_IMPLEMENTATION_REPORT.md` for
the full design.

## Service Session status (R1.6-P2C)

A "Servicesessies" panel shows both canonical slots (`lunch`/`dinner`)
for the Dagoverzicht date, each slot's authoritative state
(`Niet aangemaakt`/`Aangemaakt`/`Geopend`/`Gesloten`/`Geannuleerd`) and
the one valid action for that state (Create / Open + Cancel / Close /
none) — reads via `GET /service-sessions?serviceDate=`, mutations via
the existing four lifecycle routes, gated by the same
`Permission.CapacitySettingsManage` Owner/Manager already have for
`/closing-days`. The daily list gained a matching "Dienst" status
column, joined by the same Amsterdam-derived lunch/dinner classification
the panel uses — never the stored, potentially-stale
`Reservation.servicePeriodId`. Every mutation is confirmed first when it
is not reversible (Close, Cancel), disabled against double submission
while in flight, and re-validated authoritatively server-side regardless
of what the panel predicts; a rejection (including "active table
assignments exist" when closing) is always rendered as a clear,
staff-facing message.

The migration (`20260910153637_add_service_session`) has been applied
to `helix_reservations_dev` — the table exists. **As of this writing,
development contains zero `ServiceSession` rows.** Same
automated-verification-only posture as Floor & Seating and Security
Events above: no staff member has yet opened the pilot and created,
opened, or closed a session against a real dev deployment, and this has
not been deployed anywhere. Covered by `tests/api/service-sessions.test.ts`
(36 tests), `tests/integration/service-session-lifecycle.test.ts` (10
tests), `tests/integration/service-session-enforcement.test.ts` (29
tests, including real-PostgreSQL concurrency proofs for every gated
action), and `tests/pilot/service-session-ui.test.ts` (68 source-text
and live-executed tests). See
`R1_6_P2C_SERVICE_SESSION_IMPLEMENTATION_REPORT.md` for the full design.

## Floorplan Management status (R1.5-P2D / P2E-1 / P2E-2 — `CAP-D03.02`, now `Pilot`)

**Corrected (R1-DOC-7).** This section used to say "there is no Floorplan
administration panel in the pilot" — that is no longer true. A
"Floorplannen" panel exists in `public/pilot.html`, placed near
Servicesessies, date-independent (it never depends on the Dagoverzicht
date). It composes exactly `CAP-D03.02`'s existing ten read/write
contracts (the nine `/floorplans*`/`/floorplan-versions*` management
routes plus the read-only `GET /floorplan-resources/tables` inventory
route) — no new backend surface.

**What the panel provides:**

- **Floorplan list and creation** — lists every Floorplan (name, id,
  default-version indicator) and lets staff create a new one
  (`POST /floorplans`).
- **Draft-version creation** — `POST /floorplans/:id/versions` for the
  selected Floorplan, any number of times.
- **Draft complete-set Table-membership editing** — only a Draft version
  shows an editable membership form; Save always sends the complete
  intended `{ tableIds }` set (`PUT /floorplan-versions/:id/resources`),
  never a delta. Table inventory comes from `GET /floorplan-resources/tables`
  (no hardcoded Table ids anywhere in the panel), grouped Sushi then
  Teppanyaki in the server's own order, one native checkbox + label per
  Table inside a `fieldset`/`legend` per area, with per-area select-
  all/clear (no global one). Inactive Tables remain selectable and are
  shown visibly muted with an explicit badge, never silently excluded.
  An unknown historical member id (present in the stored set but absent
  from current inventory) renders as a safe "Onbekende tafel" row and
  stays in the payload unless a staff member explicitly unchecks it.
- **Publish / set-default / archive lifecycle actions** — exactly the
  registered lifecycle: a Draft can be edited and published; a
  Published, non-default version can be set as default or archived; the
  current default and any Archived version expose no mutation action at
  all, and the current default specifically never exposes Archive.
  Publish, Set default, and Archive each require a native confirmation
  dialog before the request is sent (they are consequential/irreversible);
  Create Floorplan, Create Draft, and Save Membership never prompt.
- **Safety protections** — a single shared in-flight guard prevents
  double submission across every mutation, cleared in `finally`;
  independent monotonic request tokens at the Floorplan/version/detail
  load levels discard stale, superseded responses; unsaved Draft-
  membership edits trigger a native confirm-to-discard dialog when
  switching Floorplan or version; a mutation's own success message and a
  subsequent failed reload's warning use two separate message elements,
  so one can never silently overwrite the other; every dynamic value is
  rendered via `textContent`/safe DOM construction, never raw
  interpolated `innerHTML`.

**Development activation:** the canonical Main Floor (`main-floor`)
revision 1 is present in `helix_reservations_dev` — Published, the
Floorplan's default, 23 Table memberships. It was bootstrapped by
tooling, not authored through the panel. `ServiceSessions = 0` — no
session has been created or opened. Opening a session for the first time
will immutably snapshot whichever FloorplanVersion is the Floorplan's
default at that moment and validate every currently-active seating
assignment for that service/date against it first, atomically — a
violation is rejected (`ACTIVE_ASSIGNMENTS_OUTSIDE_FLOORPLAN`, HTTP 409)
rather than silently snapshotting an inconsistent state. Once a session
is Opened, immediate assign, pre-assign, Move destination, modify-time
revalidation, and walk-in-through-immediate-assign are all checked
against that snapshot's membership — a Table or Teppanyaki Seat (checked
through its parent Table) outside membership is rejected. Mark Seated
and every release-only action (no-show, cancel-release, completion-
release) are unaffected by this check.

- **Automated verification is complete** — domain, integration
  (including genuine PostgreSQL-concurrency proofs for revision
  allocation, replace-vs-publish, default-vs-archive, Open-vs-default-
  change, and pre-assign-vs-Open), API, and pilot source-text tests all
  pass (`tests/pilot/floorplan-admin-ui.test.ts`, 86 tests;
  `tests/api/floorplan-table-inventory.test.ts`, 24 tests; see
  `R1_5_FLOORPLAN_SNAPSHOT_MEMBERSHIP_IMPLEMENTATION_REPORT.md`'s R1-DOC-7
  addendum for full totals).
- **No authenticated human browser workflow has been completed** against
  any of this — no staff member has logged in and authored, published,
  or activated a Floorplan version, edited membership, opened a session
  and observed the resulting snapshot, or triggered a membership
  rejection through the UI.
- **Nothing has been deployed anywhere.**
- `CAP-D03.02`'s capability status is now `Pilot` — not `Active`. Per
  this registry's own established usage (see the capability registry's
  `CAP-D04.05` precedent), `Pilot` means implemented, automated-tested,
  and exposed for a controlled human pilot to begin; the human-workflow
  and deployment facts above are accepted `Pilot -> Active` concerns, not
  something this status claims has already happened.
- **P1-B11 remains incomplete** and untouched by this milestone, per
  standing instruction.

## Service Catalog status (R1.6-P3A/P3B — `CAP-D02.01`, remains `Designed`)

A "Diensten" panel exists in `public/pilot.html`, placed near
Servicesessies and Floorplannen, date-independent (it never depends on
the Dagoverzicht date). It composes exactly two routes: `GET /services`
and `PATCH /services/:code` — no new backend surface beyond those.

**What the panel provides:**

- **Read** — the fixed, deterministically ordered (`lunch` then `dinner`)
  catalog, rendered from the server's own response only; nothing is
  hardcoded client-side.
- **Immutable code** — each row shows its `code` as read-only text; there
  is no input, and no request body this panel builds ever contains a
  `code` field.
- **Editable display name** — a text input per row; Save sends
  `displayName` only when it actually changed.
- **Enable/disable control** — a checkbox per row; Save sends `enabled`
  only when it actually changed. A change to `enabled: false` (and only
  that direction) requires a native confirmation dialog before the
  request is sent — the confirmation occurs before the panel's in-flight
  guard is set and before any network call, so cancelling it issues no
  request at all. The confirmation text tells staff that new reservations
  for that Service will be blocked from that point on, and that existing
  reservations and ServiceSessions are not changed by it. Rename-only and
  enable operations never prompt.
- **Safety protections** — the same conventions every other panel in this
  file already follows: one shared in-flight guard preventing double
  submission, cleared in `finally`; a monotonic request token discarding a
  stale, superseded load response; stale rows cleared before an
  authoritative reload; a mutation's own success message and a subsequent
  reload's own warning kept on two separate message elements; every
  dynamic value rendered via `textContent`/safe DOM construction, never
  raw interpolated `innerHTML`; a 401/403 on either route shown as one
  generic Dutch permission message, never a role or permission name; a
  `SERVICE_NOT_FOUND` response mapped to a safe "refresh the page"
  instruction; no client-side role or permission branching anywhere in
  the panel.

**Development activation:** the migration is applied in
`helix_reservations_dev`; `services` holds exactly the two canonical
rows, `lunch`/`Lunch`/enabled and `dinner`/`Dinner`/enabled.
`ServiceSessions = 0`, unaffected by anything in this panel — disabling a
Service here blocks only *future* canonical Reservation/Walk-in
validation; it never rewrites an existing Reservation, and it never
closes, cancels, disables, or otherwise touches an existing
ServiceSession.

- **Automated verification is complete** — application, real-PostgreSQL
  integration (including a rollback-contained proof of the committed
  migration guard and the ServiceSession→Service foreign key's
  `RESTRICT`/`RESTRICT` behavior), API, and pilot source-text tests all
  pass; see `R1_6_P3_SERVICE_CATALOG_IMPLEMENTATION_REPORT.md` for full
  totals.
- **No authenticated human browser workflow has been completed** — no
  staff member has logged in and read or edited a Service through this
  panel.
- **No development Service row has been changed through the API or UI** —
  every mutation exercised so far was against an isolated fake/in-memory
  repository in tests, or a real-PostgreSQL transaction that always rolls
  back; the two shared canonical rows in `helix_reservations_dev` remain
  exactly as seeded.
- **Nothing has been deployed anywhere.**
- `CAP-D02.01`'s capability status remains `Designed` — this pilot panel
  is **not** claimed as a `Pilot` promotion for `CAP-D02.01`, unlike
  `CAP-D03.02`'s R1-DOC-7 promotion above. This slice covers only a
  bounded read/edit surface over a fixed, two-row catalog; the
  capability's own registered rules — service naming (partially: only
  `displayName`), default operating times, and default reservation
  duration — remain entirely undelivered, and no Create/Delete Service
  operation exists.

## Before starting

1. `npm install && npx prisma migrate deploy && npm run typecheck && npm test` — all green.
2. `npm start` (or `npm run dev`). Confirm `http://localhost:3001/health` returns `{"status":"ok"}`.
3. Open `http://localhost:3001/pilot.html`. Log in (see "Accounts" below), then confirm the daily list loads (empty is fine).
4. Pick 1–2 staff members for the pilot, not the whole team at once — "controlled" means small and watched, not a full rollout.

## Accounts (R1.2 — Identity & Access)

**Corrected during R1.2 implementation** — this section used to say "No
authentication," with attribution coming from a free-text "your name"
field on the page. That is no longer true: every pilot participant now
needs a real `StaffUser` account (username + password) and logs in
before using the page. `x-actor-*` HTTP headers have zero authority —
see `R1_2_IDENTITY_ACCESS_IMPLEMENTATION_REPORT.md`.

The first account (Owner) is created via `npm run bootstrap-owner`
(reads `BOOTSTRAP_OWNER_USERNAME`/`BOOTSTRAP_OWNER_PASSWORD` from the
environment — never a hardcoded password). Additional pilot participants
are created by the Owner via `POST /staff-users` (`users.manage`
permission) — there is no self-service sign-up.

## Known, accepted limitations during the pilot

- **No real contact validation beyond Contact Management's own scope.**
  These become fuller validations once Service Period Management exists
  as a capability — not before.
- **Corrected (R1-DOC-4).** This bullet used to say "any service-period
  selection is accepted" — that is no longer true. Since R1.6-P2B, the
  server validates the pilot's own `servicePeriodId` value (derived
  automatically from the chosen time, never picked manually — see
  "Dienst" in `public/pilot.html`) against a canonical `"lunch"`/`"dinner"`
  code. This is a narrow, code-level Service **classification**
  (`domain/availability/Service.ts`), not the live per-date Service
  Period **session** lifecycle — see the next bullet for what that now
  is. See `R1_6_P2B_CANONICAL_SERVICE_CODE_IMPLEMENTATION_REPORT.md`.
- **Corrected (R1-DOC-5).** The bullet above used to continue "...
  Service Period Management (CAP-D02.02) still lacks — no
  Service/ServiceSession table, no Created/Opened/Closed lifecycle, and
  no reservation-to-session relationship exist." That is no longer
  accurate: R1.6-P2C added a real, persisted `ServiceSession` lifecycle
  (`Created`/`Opened`/`Closed`/`Cancelled`, per `(serviceCode,
  serviceDate)`), enforced across every live seating/walk-in path, and
  exposed in the pilot as the "Servicesessies" panel — see "Service
  Session status" below. What still does **not** exist: a persisted
  reservation-to-session relationship (the join is derivation-only, at
  read time), active-floorplan selection, and CAP-D02.01's own persisted
  Service definition. CAP-D02.02 (and CAP-D02.01) remain `Designed`. See
  `R1_6_P2C_SERVICE_SESSION_IMPLEMENTATION_REPORT.md`.
- **Reconciled (R1-DOC-6).** "Active-floorplan selection" is now only
  half missing — see "Floorplan Management status" above.
  `ServiceSession.open()` snapshots a specific Published FloorplanVersion,
  and that snapshot (or, provisionally, the current default) now governs
  every live resource-selection write. Still missing: a Floorplan
  administration pilot panel, any human workflow, deployment, and
  `CAP-D02.01`'s own persisted Service definition. `CAP-D02.01`,
  `CAP-D02.02`, and `CAP-D03.02` all remain `Designed`. See
  `R1_5_FLOORPLAN_SNAPSHOT_MEMBERSHIP_IMPLEMENTATION_REPORT.md`.
- **Reconciled (R1-DOC-7).** The "still missing" list above is now
  outdated for `CAP-D03.02` specifically: the Floorplan administration
  pilot panel now exists (see "Floorplan Management status" above), and
  `CAP-D03.02` was promoted `Designed` -> `Pilot` on that basis, per this
  registry's own established meaning of `Pilot` (automated-tested and
  UI-exposed, not necessarily human-exercised or deployed — see
  `CAP-D04.05`'s precedent). Still missing, unaffected by this
  promotion: any human workflow, deployment, `CAP-D02.01`'s persisted
  Service definition, and `CAP-D02.02`'s persisted reservation-to-session
  relationship — `CAP-D02.01` and `CAP-D02.02` both remain `Designed`.
  No geometric/adjacency floorplan editor exists or is required — see
  `R1_5_FLOORPLAN_SNAPSHOT_MEMBERSHIP_IMPLEMENTATION_REPORT.md`'s R1-DOC-7
  addendum.
- **Reconciled (R1-DOC-8).** "`CAP-D02.01`'s persisted Service
  definition" is no longer missing, as of R1.6-P3A/P3B: a real, persisted
  `services` table exists, `CanonicalServicePeriodReader` consults it, and
  a "Diensten" pilot panel exposes bounded read/edit access — see "Service
  Catalog status" above. Unlike `CAP-D03.02`'s R1-DOC-7 promotion,
  `CAP-D02.01` is **not** promoted to `Pilot` by this: the capability's
  own registered service-naming/default-operating-time/default-duration
  rules and its Create/Delete events remain entirely undelivered.
  `CAP-D02.01` remains `Designed`. `CAP-D02.02`'s own persisted
  reservation-to-session relationship still does not exist, unaffected by
  this change. See `R1_6_P3_SERVICE_CATALOG_IMPLEMENTATION_REPORT.md`.
- **PostgreSQL, single local instance, single machine.** (Corrected during
  CAP-D02.03 implementation — this used to say SQLite/`prisma/dev.db`;
  the datasource switched to PostgreSQL because CAP-D02.03's concurrency
  guarantees require it, see `README.md`'s Stack section.) The database
  configured in `.env` is the entire record. It is not backed up
  automatically. Do not drop or truncate it during or immediately after
  the pilot — it is the evidence record.
- **Real guest data.** Guest names/phone numbers typed into "contact"
  are real personal data from the moment the pilot starts. Treat the
  database accordingly — don't copy it off the machine, don't share
  database access or backups.

## Duration and rollback

Run for 1–2 weeks of real telephone/walk-in bookings, small volume,
alongside whatever Kelvin already uses today (not as a replacement yet).
To stop: just stop the process. Nothing needs to be undone — Cancelled
or wrong entries stay in the record rather than being deleted
(CAP-D01.01-R04, R28), which is correct pilot behaviour, not a bug.

## Success criteria (from `acceptance.md` §17, scoped to this pilot)

- Every real booking taken during the pilot enters the record correctly
  — right date, time, party size, and it's the one guest meant.
- Staff can reliably find "what's booked today" without asking anyone
  else or falling back to paper.
- No reservation is silently lost, duplicated, or double-counted.
- Errors staff see (if any) are understandable, not raw JSON/stack traces.
- At the end, Kelvin (or whoever owns this) can look at the pilot data
  and say plainly: this is trustworthy enough to extend, or not.

## What to watch / report

- Any reservation that shows up wrong (wrong time, wrong guest, wrong
  count) — note the approximate time it was entered.
- Any error message staff didn't understand — note the exact text.
- Any time the daily list didn't match what staff expected.

These map directly to `acceptance.md`'s Pilot → Active exit criteria:
critical operational scenarios passing in real use, changes staying
traceable, and responsible operational owners approving the capability
before it moves beyond a controlled pilot.
