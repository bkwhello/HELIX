# Controlled Pilot — Create Reservation + Daily List

Scope: **only** Create Reservation and the daily list (`GET /reservations`).
Confirm/Modify/Cancel/Complete are implemented and tested at the domain
level but have not been through this same pilot-readiness pass — do not
rely on them operationally yet (see README, Known Limitations).

## What this actually is

A single staff-facing page (`public/pilot.html`, served at `/pilot.html`)
that talks to the real API and real database. This is not a mockup —
reservations entered here are real, persisted rows. Treat it as such.

## Before starting

1. `npm install && npx prisma migrate deploy && npm run typecheck && npm test` — all green.
2. `npm start` (or `npm run dev`). Confirm `http://localhost:3001/health` returns `{"status":"ok"}`.
3. Open `http://localhost:3001/pilot.html`. Confirm the daily list loads (empty is fine).
4. Pick 1–2 staff members for the pilot, not the whole team at once — "controlled" means small and watched, not a full rollout.

## Known, accepted limitations during the pilot

- **No real contact or service-period validation.** Any text is accepted
  as the guest identifier; any service-period selection is accepted.
  These become real validations once Contact Management and Service
  Period Management exist as capabilities — not before.
- **No authentication.** The "your name" field on the page is
  self-reported, for attribution only (CAP-D01.01-R18), not access
  control. Run this on a device/network only staff can reach.
- **SQLite, single file, single machine.** `prisma/dev.db` is the entire
  database. It is not backed up automatically. Do not delete it during
  or immediately after the pilot — it is the evidence record.
- **Real guest data.** Guest names/phone numbers typed into "contact"
  are real personal data from the moment the pilot starts. Treat
  `dev.db` accordingly — don't copy it off the machine, don't share it.

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
