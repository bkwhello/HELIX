# Controlled Pilot — Create Reservation + Daily List + Floor & Seating

Scope: Create Reservation, the daily list (`GET /reservations`), and the
Floor & Seating actions (assign, pre-assign, move, mark-seated, no-show
release, floor/late-arrival view, Resource Blocking, walk-in) — all wired
into `public/pilot.html` and covered by the automated suite (see "Floor &
Seating status" below for exactly what that does and does not mean).
Confirm/Modify/Cancel/Complete are implemented and tested at the domain
level but have not been through this same pilot-readiness pass — do not
rely on them operationally yet (see README, Known Limitations).

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

- **No real contact or service-period validation.** Any text is accepted
  as the guest identifier; any service-period selection is accepted.
  These become real validations once Contact Management and Service
  Period Management exist as capabilities — not before.
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
