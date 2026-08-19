# R1.4 — Operational Resilience: Backup, Restore & Disaster Recovery

**Mode:** Investigation + Architecture Proposal Only. No backup tooling, infrastructure, or code was implemented, installed, or configured in the course of this assignment.

**Program:** Guestplan Replacement
**Previous gates:** R1.1 Availability & Capacity — PASS · R1.2 Identity & Access — PASS · R1.3-I1 CAP-D05.01 Reservation Contact Management — PASS
**Current status:** Guestplan is NOT replaceable. Production readiness is NOT claimed by this document.

---

## 1. Executive Summary

Konnichiwa Reservations currently has **no backup of any kind**. This is not an inference — it is stated directly, by this codebase's own operational documentation (`PILOT.md`, §5 of this report), and confirmed by the complete absence of any backup tooling, script, scheduler, or provider configuration anywhere in the repository (§4/§5).

The system runs as a single PostgreSQL instance on a single local machine (`localhost:5433`, per `.env`). Today, the application server and the database are **the same machine** — meaning failure modes that a typical architecture would treat as separate scenarios (F2 "app server disappears" vs. F4 "database is completely lost") are currently **the same event**. If that machine is lost, damaged, or its disk fails, every reservation, every guest Contact record, every StaffUser account, and the entire event history is lost with no recovery path. `PILOT.md` already says this in plain language: *"The database configured in `.env` is the entire record. It is not backed up automatically."*

A second, independently-discovered risk (§6, F6/F8; §23) is that the integration test suite's `resetDatabase()` helper issues an unqualified `TRUNCATE ... CASCADE` against whatever `DATABASE_URL` is active, and there is currently no separate test-database configuration — `npm test` and `npm start`/`npm run dev` read the same `.env`. The helper's own comment acknowledges the danger ("never call against anything else") but nothing in the code enforces that boundary.

This report does not recommend implementing backup tooling now — that is explicitly out of scope for R1.4 (Investigation + Architecture Proposal Only). It recommends **AC-R01–AC-R12** (§22) as the acceptance bar for a future implementation slice, identifies **Model A (scheduled `pg_dump`) as the right-sized MVA backup architecture** given the current single-machine, pre-hosting-decision reality (§9–§10), and flags four questions that only Kelvin, as owner, can answer (§20) because they are business risk-tolerance decisions, not engineering ones.

**Guestplan is not affected by, and was not touched during, this investigation.** No PageSpeed/CrUX, hosting, or website changes occurred (unrelated systems; noted only because this program's STOP conditions require it be stated).

---

## 2. Repository Baseline

Collected before any investigation, per the assignment's own requirement, using read-only git commands only (no pull/merge/rebase/switch/push).

| Item | Value |
|---|---|
| Repository | `HELIX` (local path `C:\Users\kelvin\HELIX`) |
| Branch | `feat/ec-002-visibility-baseline` |
| HEAD | `b71e4879acadf554b8fb892566f5ef6ed4e78906` — `fix(reservations): harden contact phone normalization` |
| Working-tree status | Clean except one pre-existing untracked file (below) |
| Staged files | None |
| Untracked files | `solutions/reservations/implementation/R1_3_GUEST_CONTACT_ARCHITECTURE_INVESTIGATION.md` |
| Recent relevant commits | `b71e487` fix(reservations): harden contact phone normalization → `b003fd0` R1.3-I1: implement CAP-D05.01 Reservation Contact Management → `ce69e04` fix(reservations): add login abuse protection → `dab60f5` feat(reservations): add StaffUser identity, authentication, and authorization (R1.2) → `d8cbf88` fix(reservations): serialize concurrent capacity modifications → `6f0c5cb` feat(reservations): add atomic availability capacity MVA |
| Previous R1.3 gate artifacts present? | Yes — `R1_3_I1_CAP_D05_01_IMPLEMENTATION_REPORT.md`, `R1_3_I1_FINAL_GATE_ADDENDUM.md`, `R1_3_GUEST_CONTACT_ARCHITECTURE_INVESTIGATION.md` (untracked, by design — see below) all present and readable. |
| Drift from expected post-R1.3 baseline? | **None.** The single untracked file is the same architecture-investigation document already known to have been intentionally left uncommitted after R1.3 (established practice for this program's investigation-only deliverables — see R1.3's own untracked artifact and this report's own §26/§27 disposition). No other modification, staged change, or unexpected file exists. |

No pull, merge, rebase, branch switch, or push was performed to produce this table. Repository state does not materially conflict with the expected baseline — investigation proceeds without a STOP.

---

## 3. Persistence Inventory

Every authoritative or operationally relevant persisted data store, located by reading `prisma/schema.prisma` (348 lines, 10 models), all five migrations under `prisma/migrations/`, `.env`/`.env.example`, `package.json`, `.gitignore`, and the application code that reads/writes each store directly (cited inline).

| Data / Store | Authoritative? | Reconstructable? | Backup Required? | Restore Order | Loss Impact |
|---|---|---|---|---|---|
| `Reservation` | Yes | No | **Yes** | 1 | Severe — the core business record; guests double-booked, forgotten, or unreachable |
| `ReservationEvent` (append-only history, FK → Reservation) | Yes | No | **Yes** | With `Reservation` (FK-dependent) | High — loses the "what happened and when" audit trail (CAP-D01.01-R04) |
| `AppliedCommand` (idempotency ledger) | Yes, but forward-looking | Partially — losing it doesn't corrupt past data, but reopens a duplicate-command window | **Yes** | With `Reservation` | Medium — a repeated command (e.g. a retried create) could be reapplied instead of being recognized as already-handled |
| `ClosingDay` (operational calendar, CAP-D01.01-R51) | Yes | No — owner-entered, no other source | **Yes** | Before/with `Reservation` (read at availability-check time) | Medium — restaurant could accept bookings on a day it explicitly closed |
| `CapacityCommitment` (CAP-D02.03 occupancy ledger) | Yes | Partially, and only for currently-Committed rows — Released/Superseded history and exact commit timing are not re-derivable from `Reservation` alone | **Yes** | Same transaction scope as `Reservation`/`AppliedCommand` (see §12) | Severe — false "sold out" or silent double-booking until manually reconciled against `Reservation` |
| `Contact` (CAP-D05.01 guest PII) | Yes | No — guest-entered name/phone/email | **Yes** | Before/with `Reservation` (referenced by `contactId`, not FK-enforced — see schema comment) | Severe — PII loss, and every `Reservation.contactId` referencing a lost `Contact` becomes a dangling, unresolvable reference |
| `StaffUser` (R1.2 identity) | Yes | Partially — the Owner role can be recreated via `bootstrap-owner` (§17), but any Manager/Reception accounts created afterward cannot be reconstructed without the Owner re-adding them | **Yes** | Before `StaffSession` | High — nobody can log in until Owner is recovered; non-Owner staff must be manually re-added |
| `StaffSession` (server-side session state) | No | Yes — trivially, by logging in again | No (optional/low priority) | After `StaffUser` | Low — staff simply log in again; the raw token is never even stored (only its SHA-256 hash), so sessions are not independently valuable |
| `SecurityEvent` (R1.2 account-lifecycle audit log) | Yes (audit record) | No | Yes, lower priority | Any time after `StaffUser` | Low–Medium — an audit/compliance record is lost, but nothing operational halts |
| `LoginAttemptWindow` (rate-limit state) | No | Yes — trivially, starts empty | No | Any time | None — resets throttling counters only |
| `CapacityPool` configuration (Sushi/Teppanyaki caps, durations) | Yes (business rule) | Yes — it is TypeScript source in Git (`domain/availability/CapacityPool.ts`), **not a database table** | N/A — protected by source control, not DB backup | N/A | None, provided Git history survives |
| `ServicePeriod` / service-period configuration | N/A | N/A | N/A | N/A | **Not currently persisted at all** — `UnvalidatedServicePeriodReader` is a placeholder that always reports valid; Service Period Management does not yet exist as a capability |
| Prisma schema + migrations (`prisma/schema.prisma`, `prisma/migrations/**`) | Yes (schema history) | Yes — version-controlled in Git | Yes, via Git (already redundant), not DB backup | Must be applied (`prisma migrate deploy`) before any data restore | Severe only if lost from **both** Git and the database simultaneously — Git already provides a second copy today |
| `.env` (`DATABASE_URL`, future `BOOTSTRAP_OWNER_*`) | Yes (operational secret) | No — known only to whoever configured it | Yes, **separately from and never alongside** DB backups (§11) | Needed before any restore can even connect | High — without it, nothing can start, independent of whether the data itself survived |
| SQLite remnants | — | — | — | — | **None found.** `prisma/dev.db` / `dev.db-journal` are listed in `.gitignore` as a leftover pattern from the pre-CAP-D02.03 SQLite era, but no such file exists on disk today (confirmed by direct search). The datasource has been PostgreSQL-only since CAP-D02.03 (`README.md` §"Known limitations", `schema.prisma` header comment). |
| External/third-party state | — | — | — | — | **None found.** `package.json` dependencies are exactly `@prisma/client`, `express`, `libphonenumber-js`, `prisma` (+ dev dependencies). No email, SMS, cloud-storage, or payment SDK of any kind. The local PostgreSQL instance is the application's entire persisted world. |

Not every store deserves identical treatment, per the assignment's own instruction: `StaffSession` and `LoginAttemptWindow` are deliberately excluded from "backup required" — losing them costs a re-login or a reset rate-limit counter, nothing more.

---

## 4. Data Criticality Classification

**A — Authoritative and irreplaceable:** `Reservation`, `ReservationEvent`, `Contact`, `ClosingDay`.
Evidence: none of these have any other source of truth in this system or outside it. `ReservationEvent` rows are explicitly append-only by convention (schema comment, CAP-D01.01-R04); `Contact` and `Reservation` are guest- and staff-entered with no upstream system to re-derive them from (`ContactReader`/`ServicePeriodReader` are placeholders that validate nothing, confirming no external registry exists to reconcile against).

**A/B border, treated as A — Authoritative, only partially reconstructable:** `CapacityCommitment`, `StaffUser`, `AppliedCommand`.
Evidence: `CapacityCommitment`'s schema comment states Released/Superseded rows are "kept (never deleted) as history" — this history is not re-derivable from `Reservation` rows alone. `StaffUser`'s Owner row can be regenerated via `bootstrap-owner` (§17), but that script only ever creates the *first* Owner (gated by the DB's own partial unique index, `staff_users_one_owner`) — it cannot recreate Manager/Reception accounts an Owner had added. `AppliedCommand` loss doesn't retroactively corrupt anything, but it removes the idempotency guarantee for any command whose original `commandId` gets replayed after restore.

**C — Operationally useful, disposable:** `SecurityEvent`.
Evidence: R1.2's own doc comment describes it as "a separate log from ReservationDomainEvent" for account-lifecycle events — valuable for audit, but its loss doesn't stop the restaurant from taking reservations or staff from logging in.

**D — Ephemeral:** `StaffSession`, `LoginAttemptWindow`.
Evidence: `StaffSession.id` is a SHA-256 hash of an opaque token that is "never persisted anywhere" in raw form (schema comment) — the session store is a lookup cache for something the server never durably owns anyway. `LoginAttemptWindow`'s own schema comment explains it exists only so multi-process rate-limiting stays consistent; restarting from zero has zero business consequence.

**Not classified because not persisted:** `ServicePeriod`/service-period configuration (placeholder only) and `CapacityPool` configuration (TypeScript source, not a table).

---

## 5. Current Backup State

Searched: `package.json` (scripts and dependencies), the entire repository tree for `pg_dump`, `pg_basebackup`, `WAL`, `wal_level`, `point-in-time`, `PITR`, `backup`/`Backup`/`BACKUP`, `disaster recovery`, `runbook`; `.github/workflows/`; any `docker-compose*`; any `Procfile`; `.env`/`.env.example`.

| Capability | Status | Evidence |
|---|---|---|
| Automated PostgreSQL backup (any form) | **NOT FOUND** | No script, npm task, or scheduled job anywhere in the repository performs a backup of any kind. |
| `pg_dump` / logical backup | **NOT FOUND** | Zero references in application code, scripts, or CI. |
| Physical backup / WAL archiving / PITR | **NOT FOUND** | No `postgresql.conf`/`wal_level` configuration is tracked in this repository (consistent with a local, unmanaged Postgres instance — see [[helix_postgres_local_setup]] memory: user-owned Postgres on port 5433, no admin rights on the Windows service). |
| Managed-provider backup | **NOT FOUND / NOT APPLICABLE** | No hosting provider is configured or referenced anywhere (no Dockerfile, no `docker-compose.yml`, no `Procfile`, no cloud SDK dependency, no deployment workflow). `DATABASE_URL` in `.env` points at `localhost:5433`. There is currently no infrastructure for a provider to be backing up. |
| Retention policy | **NOT FOUND** | Not defined anywhere for the database itself. (A *data*-retention concept exists for `Contact` PII — `lastRelevantActivityAt`, §11 — but that is a GDPR-retention anchor, not a backup-retention policy, and its own execution is explicitly deferred per `R1_3_I1_CAP_D05_01_IMPLEMENTATION_REPORT.md`.) |
| Backup encryption | **NOT FOUND / NOT APPLICABLE** | No backups exist to encrypt. |
| Off-site / independent storage | **NOT FOUND** | Everything — application and database — currently lives on one machine. |
| Backup verification | **NOT FOUND / NOT APPLICABLE** | No backups exist to verify. |
| Restore script / documentation | **NOT FOUND** | No restore procedure of any kind is documented. `README.md`'s "Run" section documents *schema* setup (`prisma migrate deploy`) only — never data restore. |
| Disaster-recovery runbook | **NOT FOUND** | No file matching this description exists. |
| Recovery drills | **NOT FOUND** | No evidence any restore has ever been executed against this system. |

**Direct, first-party confirmation** (not an inference): `PILOT.md`, "Known, accepted limitations during the pilot" —

> *"PostgreSQL, single local instance, single machine. … The database configured in `.env` is the entire record. **It is not backed up automatically.** Do not drop or truncate it during or immediately after the pilot — it is the evidence record."*

and, in the same section:

> *"Real guest data. … don't copy it off the machine, don't share database access **or backups**."*

The second sentence is worth flagging precisely: it cautions against sharing backups that do not, in fact, exist yet. This reads as forward-looking hygiene guidance rather than a claim that backups exist — consistent with every other piece of evidence in this section — but it is the one place in the repository that even mentions "backups" in a context other than "there are none," so it is reported here verbatim rather than silently resolved either way.

**Overall current backup protection: NOT FOUND.**

---

## 6. Failure-Mode Analysis

### F1 — Application process crashes, database remains healthy

The application holds no authoritative in-memory state — even rate-limiting (`LoginAttemptWindow`) and sessions (`StaffSession`) are deliberately PostgreSQL-backed specifically so a restart or a second process instance doesn't lose or fragment that state (schema comment: *"this app may run as more than one process/instance, and an in-memory counter would silently stop being effective"*). Recovery is: restart the process (`npm start`), reconnect to the existing, undamaged database. **RPO: 0. RTO: however long it takes to notice the crash and restart it manually.**

**Gap found:** no process supervisor, restart policy, or health-triggered auto-restart exists anywhere in the repository (no `Procfile`, no `pm2`/`systemd`/`docker` restart policy, no monitoring). Today, "restart" means a human notices the app is down and runs `npm start` again.

### F2 — Application server disappears, database remains healthy

**This scenario, as stated, does not currently describe Konnichiwa Reservations' actual architecture.** Per `PILOT.md`, the application and the database are explicitly "single local instance, single machine" — they are the same machine. If "the application server disappears," the database disappears with it. F2 and F4 are, today, the same event. This is reported as a finding, not assumed away: **any resilience architecture built for F2 as a separate scenario from F4 would be solving a problem this system doesn't yet have, while missing the problem it does have** (§10 addresses this directly).

If/when application and database are ever split onto separate hosts, rebuilding the application side alone requires: a fresh machine, `npm install`, Prisma client generation (`prisma generate`), and a re-created `.env` pointing at the still-healthy database — no data loss, since no authoritative state lives on the application host.

### F3 — PostgreSQL becomes unavailable temporarily

Every DB-dependent request (reservation creation, availability checks, login, contact lookups) would fail. **A specific, evidenced gap:** `GET /health` (`api/app.ts`) is a pure liveness check — `res.status(200).json({ status: "ok" })` — it does not touch the database at all. A monitoring system polling `/health` would report "ok" even while PostgreSQL is completely unreachable. There is currently no way to distinguish "the app is up" from "the app is up and the database is up" from outside the process.

### F4 — PostgreSQL database is completely lost

Given §5's findings, this is total, unrecoverable loss of every `Reservation`, `Contact`, `StaffUser`, `CapacityCommitment`, and event today. There is no backup to restore from. This is the scenario the rest of this report (§7–§19) is designed to close.

### F5 — Database is logically corrupted (bad migration, accidental UPDATE/DELETE, application defect)

An ordinary "restore the latest backup" is sufficient **only if** the corrupting write happened after the last backup and the backup itself predates it — otherwise the corruption is baked into that backup too. Because `ReservationEvent` and `CapacityCommitment` (Released/Superseded rows) are append-only by convention, a bad `UPDATE`/`DELETE` against those tables specifically would be unusual (most application code paths only insert into them), narrowing — but not eliminating — this risk to the mutable tables (`Reservation`, `Contact`, `StaffUser`, `ClosingDay`). A bad migration is the more likely real-world trigger, since `prisma migrate deploy` runs raw SQL directly (§18). **Point-in-time recovery would matter here specifically because a logical corruption's exact moment is often discovered well after the fact** — a fixed daily/hourly backup schedule may already have overwritten the last clean copy by the time anyone notices. This is one of the strongest arguments for eventually moving toward Model C/D (§9), once volume justifies the operational cost.

### F6 — Staff accidentally deletes or changes operational data

Two distinct mechanisms exist today:
1. **Through the application** — no bulk-delete UI/endpoint was found in the reviewed code; damage would be limited to whatever a single staff action can do (e.g., an incorrect cancel/modify), which `ReservationEvent`'s append-only history already partially mitigates (the prior state is still visible in the event log even if the current row is wrong).
2. **Directly against the database** — a genuinely new, independently-discovered finding from this investigation: `tests/integration/support/testHarness.ts`'s `resetDatabase()` runs `TRUNCATE TABLE "capacity_commitments", "applied_commands", "reservation_events", "reservations", "closing_days", "contacts" RESTART IDENTITY CASCADE`. Its own comment reads: *"Safe only against the dedicated local test database configured in .env — never call against anything else."* But every integration test file instantiates `new PrismaClient()` with **no override** — meaning it reads whatever `DATABASE_URL` is currently in `.env`, the exact same variable `npm start`/`npm run dev` use for the pilot. There is no separate `TEST_DATABASE_URL` anywhere in this repository. **If `npm test` is ever run while `.env` points at the pilot's live database, this single line destroys `Reservation`, `Contact`, `CapacityCommitment`, `AppliedCommand`, and `ClosingDay` data in one statement** (note: `StaffUser`/`StaffSession`/`SecurityEvent`/`LoginAttemptWindow` are not in the TRUNCATE list, so login would still work afterward — against an otherwise-empty operational database). This is flagged as a **P0 risk in §23**, independent of backup architecture, because a backup only limits *how much* is lost, not whether this can happen.

### F7 — Deployment introduces incompatible schema/application behavior

`prisma migrate deploy` applies migrations sequentially and does not support automatic rollback (Prisma has no "down migration" tooling generated for these hand-augmented migrations — see §18's discussion of the hand-written `CHECK`/partial-unique-index SQL that would need to be reverse-engineered by hand for any down migration). Recovery today would mean either a forward-fix migration or a full restore to the pre-deployment backup — which, per §5, does not exist.

### F8 — Backup exists but is corrupt

Not currently testable — no backup exists to be corrupt. Once one does, §13/§15 define exactly this detection: file-level checks (non-zero size, checksum) catch a truncated/failed dump; application-level integrity checks (§13) catch a dump that is structurally valid but semantically wrong (e.g., truncated mid-write, missing a table). The core principle carried into §14: **a backup that has never been restored is not evidence it works.**

### F9 — Backup credentials/storage are compromised

Not currently applicable (no backups exist), but directly relevant to future design: `Contact` and `Reservation` (via `contactPhoneSnapshot`/`contactEmailSnapshot`) contain real guest PII (confirmed by `PILOT.md`'s own "Real guest data" section and the schema's CAP-D05.01 comments). A compromised backup is a compromised copy of that PII, independent of whether the live database itself was ever touched — this is why §11 treats backup storage as its own security boundary, not an extension of database access control.

### F10 — System unavailable during dinner service

This is explicitly an operational, not purely technical, problem (§16). Today: there is no read-only export, no daily service snapshot, and no defined manual fallback procedure documented anywhere in this repository. `PILOT.md` describes the pilot running "alongside whatever Kelvin already uses today (not as a replacement yet)" — which is itself the closest thing to a manual fallback right now, but it is not a designed contingency for *this* system's outage; it's simply the pre-existing parallel process that hasn't been retired yet.

---

## 7. RPO Analysis

| Candidate RPO | Restaurant consequence if DB fails at 20:00, last recoverable state is... |
|---|---|
| 24 hours | Last recoverable state: yesterday 20:00 or earlier. **Every reservation, modification, and cancellation made today is gone.** Guests who cancelled would reappear as active bookings; guests who booked today would vanish. For a live dinner-service reservation system, this is operationally severe — service that same evening would be working from a stale, actively wrong list. |
| 6 hours | Last recoverable state: ~14:00. Everything booked/changed/cancelled between 14:00–20:00 — typically a meaningful fraction of a day's lunch/early booking activity — is lost. Still likely to cause visible, guest-facing errors during that evening's service. |
| 1 hour | Last recoverable state: ~19:00. At most one hour of bookings/changes lost — a handful of reservations on a typical night, but exactly the kind of last-minute change (a party size increase, a late walk-in-turned-booking, a cancellation freeing a slot someone else then took) that is disproportionately likely to matter *because* it's recent. |
| 15 minutes | Last recoverable state: ~19:45. Loss is bounded to whatever happened in the last quarter-hour — realistically at most one or two reservation events. Meaningfully better than 1 hour, but still non-zero and still requires *some* mechanism (WAL/PITR or very frequent logical dumps) beyond a simple nightly script. |
| Near-zero / point-in-time recovery | Recoverable up to (or within seconds/minutes of) the moment of failure. No guest-facing gap under normal operation, at the cost of real operational complexity (§9, Model C) that is disproportionate to this system's current single-machine, pre-launch, MVA-stage reality. |

**This investigation does not choose a value.** The right RPO depends on how much re-entering a lost hour of bookings by phone/memory actually costs the restaurant in practice versus how much backup infrastructure complexity is justified at this stage — that is a business risk-tolerance judgment, not a technical one.

**OWNER INPUT REQUIRED — see Q1, §20.**

---

## 8. RTO Analysis

| Candidate RTO | Restaurant-operations translation |
|---|---|
| 24 hours | The reservation system is unusable for up to a full day. Given `PILOT.md`'s own framing — the pilot runs "alongside whatever Kelvin already uses today" — this may be tolerable *only* during the pilot phase, precisely because that parallel fallback still exists. It would not be tolerable once Guestplan is actually retired and this system is the sole record. |
| 4 hours | Unusable for a large fraction of, or an entire, service period. The assignment's own example is apt: "technically acceptable for some systems but operationally unacceptable for a reservation system" during active dinner service. |
| 1 hour | Survivable if it happens outside service hours; disruptive but probably manageable with a manual fallback (§16) if it happens during service. |
| 30 minutes | The most demanding option evaluated. Achievable only with practiced restore automation and a pre-provisioned recovery target (§12) — not realistic today, since no restore procedure has ever been executed even once (§14). |

**This investigation recommends against committing to any RTO faster than what has actually been drilled (§14).** A number nobody has proven achievable is not a real RTO. Recommend starting from whatever the first real restore drill measures, then tightening deliberately — not the reverse.

**OWNER INPUT REQUIRED for the target — see Q2, §20.**

---

## 9. Backup Models Evaluated

### Model A — Scheduled logical backup (`pg_dump`)

- **Simplicity:** High. A single command, runnable via cron/Task Scheduler, no new infrastructure.
- **Restore reliability:** High and well-understood — `pg_dump`/`pg_restore` is the most battle-tested Postgres backup path, and the schema uses no exotic types that would complicate a logical dump.
- **RPO:** Bounded by schedule interval (e.g., daily = up to 24h; hourly = up to 1h) — cannot reach near-zero without very frequent runs.
- **Storage:** Small at current data volumes (single-restaurant reservation data); grows slowly.
- **Encryption:** Must be added explicitly (§11) — `pg_dump` output is plaintext SQL/custom-format by default.
- **Automation:** Straightforward; the gap today is that none exists (§5).
- **Portability:** Excellent — a `pg_dump` file restores to any Postgres instance, independent of the original host.
- **Cost:** Minimal (local disk / cheap object storage).

### Model B — Managed PostgreSQL automated backups

- **Operational simplicity:** Would be very high — but **no such provider currently exists** in this repository's evidence (§5). Evaluating this model concretely is not possible without a hosting decision that hasn't been made.
- **Provider dependency:** Total — restore capability lives entirely outside this codebase's control.
- **Restore control:** Typically coarser-grained (point-in-time within a retention window, provider-defined) than a self-managed dump/restore.
- **Retention / portability / evidence:** Varies by provider; cannot be evaluated against a provider that doesn't exist yet.

**Do not assume such a provider currently exists** — per the assignment's own instruction, and confirmed by §5's search.

### Model C — WAL + Point-In-Time Recovery

- **RPO:** Can approach near-zero.
- **Complexity:** Substantial — continuous WAL archiving, a place to ship WAL segments to, and restore tooling that correctly replays them to an exact target time.
- **Storage:** Continuous, not a single periodic snapshot — larger and ongoing.
- **Operational burden:** Requires monitoring the archiving pipeline itself (an unmonitored WAL archive that silently stops shipping is a worse false-confidence trap than no backup at all, because it *looks* like protection).
- **Correctness:** High, when correctly operated.
- **Suitability for Konnichiwa's current scale:** **Disproportionate today.** A single-restaurant reservation system on one local machine, pre-hosting-decision, does not yet justify this operational overhead. This becomes the right conversation once real, continuous production hosting exists and the RPO analysis (§7) genuinely demands sub-hour recovery.

### Model D — Hybrid (managed/PITR primary + independent periodic logical backup)

- Evaluated as: **the right eventual target, not the right starting point.**
- Defense provided:
  - **Provider failure** — yes, if the logical copy lives outside the managed provider's own infrastructure.
  - **Logical corruption** — yes, if PITR granularity is fine enough to select a point before the corrupting write; the independent logical backup is a second, structurally-different fallback if PITR itself is unavailable or misconfigured.
  - **Operator error** — yes, same reasoning as logical corruption (F5/F6 are close variants of each other).
  - **Backup corruption** — yes, specifically *because* it's two structurally different mechanisms (WAL-based and dump-based) rather than two copies of the same fragile process; a bug or bad configuration affecting one is unlikely to affect both identically.
- **Not automatically selected** here, per the assignment's explicit instruction not to pick "the most sophisticated model." Model A is the right starting point (below); Model D is where this should evolve toward once a real hosting decision and real production traffic exist.

### Recommendation

**Model A (scheduled `pg_dump`) now, with an explicit path to Model D once a hosting decision is made and volume/RPO requirements (§7, owner-confirmed) justify it.** This directly applies "HELIX/product simplicity principles" — the current architecture is one local machine with modest data volume; a scheduled logical backup closes the single largest gap identified in this entire report (§5: NOT FOUND, total) without introducing infrastructure this stage of the product doesn't yet need.

---

## 10. Backup Independence

**Direct question asked by the assignment: what happens if the entire host/storage account disappears?**

Today: **everything is lost.** The application, the database, and (once one exists) any backup stored on that same machine would all disappear together. This is not hypothetical caution — it is the literal current architecture, confirmed in §2/§6 (F2/F4 collapse into one event) and §5 (no off-site storage of any kind exists).

**Recommendation: at least one backup copy MUST exist in a failure domain separate from the primary database**, specifically because the primary database's own failure domain today is "one local machine with no redundancy of any kind" — the weakest possible starting point. This does not require enterprise-scale multi-region design (explicitly out of scope per the assignment):

- **Provider separation:** not yet meaningful — there is no provider today.
- **Account separation:** not yet meaningful, same reason.
- **Region separation:** unnecessary at this scale; a single restaurant's reservation data does not need multi-region redundancy.
- **Practical minimum today:** a backup copy stored somewhere that does not share a power supply, disk, or physical machine with the current local Postgres instance — this could be as simple as an external drive or a low-cost cloud object-storage bucket, evaluated at implementation time, not this investigation.
- **Credentials:** whatever holds the off-site copy must have its own, separate access credentials from `DATABASE_URL` (§11) — otherwise a single compromised credential set defeats both the primary and the backup.
- **Encryption:** required regardless of where the copy lives, because it contains guest PII (§11).

---

## 11. Backup Security

`Contact` (`phoneRaw`, `phoneNormalized`, `emailRaw`, `emailNormalized`, `displayName`) and `Reservation` (`contactName`, `contactPhoneSnapshot`, `contactEmailSnapshot`) both carry real personal data — confirmed directly by `PILOT.md`'s "Real guest data" section and by the CAP-D05.01 schema comments. Any backup containing these tables is a second, independently-securable copy of that PII.

- **Encryption in transit:** required whenever a backup is moved off the originating machine (§10).
- **Encryption at rest:** required for any stored backup file, wherever it lives.
- **Backup access control:** must be **narrower than, or at most equal to, live database access** — never broader. A backup being easier to obtain than the live database would make it the attacker's preferred target.
- **Credentials/secrets:** backup storage credentials must be distinct from `DATABASE_URL` (§10) — `.env` currently holds only the live connection string; a future backup credential must not be added to the same file/scope without a deliberate access-control decision.
- **Least privilege:** whoever/whatever runs the backup job needs read access to the database and write access to backup storage — nothing more (no need for the backup principal to hold, e.g., migration or schema-alteration rights).
- **Retention:** backup retention is a **separate** decision from `Contact.lastRelevantActivityAt` (the GDPR retention anchor, §4) — the two must not be conflated. A backup retention window that outlives the intended data-retention window creates exactly the next bullet's problem.
- **Deletion/anonymization implications:** if a `Contact` is ever anonymized in the live database (the `ContactStatus.Anonymized` state already exists in the schema, though **no anonymization operation has been built yet** — `R1_3_I1_CAP_D05_01_IMPLEMENTATION_REPORT.md` confirms this is deferred), older backups taken before that anonymization would still contain the original PII. This is not a live risk today (nothing has ever been anonymized, so no backup can yet contain a contradiction between "anonymized in the live DB" and "still identifiable in a backup") — but it is a forward-looking design requirement: backup retention windows should be chosen with this in mind once anonymization is actually built, not discovered as a surprise afterward.

This section deliberately stops at backup-specific requirements and does not attempt a general GDPR program, per the assignment's own instruction.

---

## 12. Restore Architecture

A bounded, thirteen-step process, in dependency order:

1. **Provision clean PostgreSQL** — a fresh instance, no assumptions about prior state.
2. **Restore selected backup** — apply the chosen `pg_dump` output (or future PITR target) to the clean instance.
3. **Apply/verify schema state** — see the migrations-vs-restored-data question below; this step must reconcile them, not assume they already match.
4. **Start application against restored database** — point `.env`'s `DATABASE_URL` at the restored instance.
5. **Run integrity checks** (§13).
6. **Verify authentication** — confirm at least one working `StaffUser` login (exercises `StaffUser` + password hash + session issuance together).
7. **Verify Reservations** — spot-check recent rows against whatever independent record exists for that period (e.g., staff's own memory of "today's list," if the outage was short).
8. **Verify Contacts** — confirm `Contact` rows are present and `Reservation.contactId` references resolve (§13's orphan check formalizes this).
9. **Verify capacity commitments** — confirm `CapacityCommitment` rows are internally consistent with `Reservation` status (§13's one-active-commitment-per-reservation check).
10. **Verify event/audit history** — confirm `ReservationEvent` rows exist for restored reservations and are not truncated mid-history.
11. **Verify idempotency state** — confirm `AppliedCommand` is present (its *absence* is not catastrophic per §4, but its presence should be verified since it's part of the same backup).
12. **Perform a controlled smoke test** — a real create-reservation-and-read-it-back cycle against the restored instance, not just a passive count check.
13. **Declare recovery successful or failed** — explicitly, by a named recovery authority (§17), not implicitly by "nothing complained."

**Migrations: restored as part of the database state, replayed from the repository, or another explicit mechanism?**

**Recommendation: migrations are replayed from the repository (`prisma migrate deploy`), and the backup restore must be evaluated against the resulting schema — not the other way around.** Reasoning: the migration history in `prisma/migrations/` is the authoritative schema definition (it is version-controlled, reviewed, and includes hand-written invariants — the `CHECK` constraints and partial unique indexes documented in §3/§18 — that a raw data-only dump might not reliably reproduce if the dump format or restore tooling ever diverges from a full schema+data dump). Concretely: provision the clean database (step 1), run `prisma migrate deploy` to bring it to the exact current schema version, **then** restore data into that schema — rather than restoring a full pre-migrated dump and hoping it matches whatever `schema.prisma` says today. This also directly answers §18's migration-recovery question in a consistent way: schema state always comes from the repository, data always comes from the backup, and the restore procedure is the one place those two independent sources are reconciled.

---

## 13. Post-Restore Integrity Checks

Automated checks capable of detecting an invalid restore — "the restore command exited 0" is explicitly not sufficient evidence, per the assignment:

| Check | What it catches |
|---|---|
| `Reservation` count vs. expected/last-known count | Gross data loss (a dump that silently skipped rows, a partial restore) |
| `Contact` count vs. expected/last-known count | Same, for guest PII |
| `StaffUser` count, and **exactly one row with `role = 'Owner'`** | Confirms the Owner invariant (`staff_users_one_owner`, §3/§17) survived the restore intact — zero or more-than-one Owner both indicate a broken restore, not just a data-loss one |
| `ReservationEvent` referential integrity | Every `reservationId` resolves to an existing `Reservation` (the FK constraint should enforce this at restore time; explicitly checking confirms the FK itself was restored, not just the rows) |
| Active `CapacityCommitment` count vs. active `Reservation` count | Detects a restore where one table came back and a related one didn't |
| **One-active-commitment-per-reservation invariant** | Re-verifies `capacity_commitments_one_committed_per_reservation` (the partial unique index, §3) actually holds post-restore — not just that the index exists, but that no row violates it |
| `Reservation` ↔ `Contact` validity for CAP-D05.01-era reservations | `Reservation.contactId` resolves to a real `Contact.id` for every reservation created after CAP-D05.01 went live (2026-08-19, per the migration timestamp) — pre-CAP-D05.01 rows are explicitly allowed to hold a legacy unvalidated value (schema comment) and must not be flagged as broken by this check |
| Orphaned records | Any `ReservationEvent`, `CapacityCommitment`, or `StaffSession` row whose parent no longer exists |
| Schema migration/version state | `_prisma_migrations` table (Prisma's own tracking table) shows every migration in `prisma/migrations/` as applied, in order, with no gaps |
| **Owner invariant from R1.2** | Same check as the `StaffUser` row above, called out separately because it is a named, tested invariant in R1.2's own architecture, not incidental |
| Authentication/login functionality | An actual login attempt against a known-restored `StaffUser` succeeds (not just a row-count check — proves the password hash and session-issuance path both work) |
| Latest `Reservation` timestamp | Confirms how close to the failure moment the restore actually reaches — this **is** the measured RPO for that specific incident (§7, §14) |
| Latest `ReservationEvent` timestamp | Same, for the event stream specifically — the two timestamps should be consistent with each other |

---

## 14. Restore Drill

Proposed structure, using a clean database — **never** the current development/pilot database:

```
BACKUP  →  DESTROY/IGNORE ORIGINAL (a separate clean target, not the real DB)  →  RESTORE INTO CLEAN DATABASE  →  START APPLICATION  →  VERIFY DATA (§13)  →  RUN SMOKE TEST
```

**Measurable evidence to capture on every drill run:**

- Backup timestamp
- Backup file size
- Backup checksum
- Restore start time
- Restore completion time
- **Measured RTO** (completion − start, plus however long detection/decision took in a real incident — a drill should measure the mechanical restore time honestly, separate from human response time)
- **Maximum observed data gap / RPO** — the delta between the backup's timestamp and the moment "failure" is simulated to have occurred
- §13's integrity-check results (pass/fail per row, not just an overall pass/fail)
- Application smoke-test result (the actual create-and-read-back cycle from §12 step 12)

This drill has never been run (§5, §6/F8) — its first execution, whenever authorized, is itself the first real evidence this system's backup/restore story works at all, not merely that it's been designed on paper.

---

## 15. Backup Verification

Recommended, layered per the assignment's own structure:

- **File-level:** backup file exists; non-zero size; checksum recorded and compared against the previous run (a checksum that never changes across "successful" runs is itself a red flag — it usually means the dump silently stopped capturing new data).
- **PostgreSQL-level:** the dump can actually be parsed/loaded by `pg_restore`/`psql` against a scratch database — catches a structurally corrupt file that file-level checks (non-zero size) would miss.
- **Application-level:** a restored application instance passes §13's integrity checks — catches a file that is valid SQL/dump format but semantically incomplete (e.g., a table silently excluded from the dump command's scope).

**Recommended cadence:** file-level and PostgreSQL-level checks on every backup run (cheap, automatable); a full application-level restore drill (§14) on a slower, deliberate cadence — exact frequency is an implementation-time decision, not fixed here, but it should not be less often than the chosen RPO window's own period (i.e., if backups run daily, verify at least as often as the data actually changes meaningfully).

---

## 16. Operational Outage Mode

Explicitly kept separate from database recovery, per the assignment's own instruction — these are related but not identical problems.

- **How does staff know today's reservations if the system is down?** No mechanism currently exists. `GET /reservations?date=` is the only way to see the daily list (README §"Status"), and it requires the system to be up.
- **Is there a recent read-only export?** **NOT FOUND.** No export/snapshot mechanism exists anywhere in this codebase today.
- **Should a daily service snapshot exist?** This is a reasonable, low-cost addition (e.g., a lightweight daily export of "today's + tomorrow's reservations" to a place staff can read even if the main system is down) — flagged as a candidate for the MVA boundary (§20/§21), not decided here.
- **Can staff temporarily record walk-ins/new reservations manually?** Not a designed capability of this system — but `PILOT.md`'s own framing (the pilot running "alongside whatever Kelvin already uses today") means a parallel manual process already exists *during the pilot specifically because Guestplan hasn't been retired yet*. Once Guestplan is actually replaced, this fallback disappears unless deliberately re-designed as a permanent contingency, not just a pilot-era coincidence.
- **How are outage-period changes reconciled after recovery?** No procedure defined. This is directly downstream of §12's restore architecture — reconciliation is the human process of comparing whatever was recorded manually during the outage against the restored/current database state and entering the gap.
- **Who decides when normal operation resumes?** Not defined today. §17 proposes reusing the R1.2 role model for exactly this kind of decision.

---

## 17. Recovery Authority

Reusing the R1.2 identity/role architecture (`StaffUser.role`, `ActorRole` — Owner / Manager / Reception, per the domain model already established) rather than inventing a new permission hierarchy, per the assignment's explicit instruction:

| Authority | Recommended role | Reasoning |
|---|---|---|
| Initiate backup | Automated (scheduled job), with manual trigger available to **Owner** | A routine backup should not require human judgment; an ad hoc pre-deployment backup (§18) should be triggerable by whoever has deployment access, which today is effectively "Owner" since that's the only role with environment/deployment access modeled anywhere in this system (`bootstrapOwner.ts`'s own doc comment: reachable "only by someone with deployment/environment access, never through any in-app role"). |
| Access backup files | **Owner** only, until a dedicated operational role is justified by real need | Backups contain full PII (§11) — access should start narrow. |
| Restore a database | **Owner**, or an explicitly Owner-delegated technical operator for a specific incident | This is the highest-blast-radius action in this entire document; it should never be routine-permission-gated the way, say, creating a reservation is. |
| Declare disaster recovery (i.e., "we are now in an incident") | **Owner** | Matches who already holds ultimate account-recovery authority in R1.2 (the Owner-bootstrap/recovery mechanism, §17 body). |
| Declare restored system authoritative | **Owner**, informed by §13's integrity-check results | This should be an explicit, recorded decision (§19 step 11), not an implicit "the app is running again so we're done." |
| Destroy obsolete backup copies | **Owner**, governed by whatever retention policy is set (§11) | Deletion is itself a risk (a backup destroyed too early is indistinguishable from one that never existed) — keep this gated the same as restore. |

**A concrete, already-built mechanism directly relevant here:** `bootstrapOwner.ts` (§3's `StaffUser` row) is *already* the designated Owner-recovery path — its own doc comment states this explicitly. If a restore ever comes back with zero `StaffUser` rows (a total-loss scenario with no backup, or a backup that predates any Owner account), this script — gated by `BOOTSTRAP_OWNER_USERNAME`/`BOOTSTRAP_OWNER_PASSWORD` environment variables and the database's own `staff_users_one_owner` partial unique index — is how the Owner account is re-established, without needing a new mechanism invented for this report. If the restore succeeds and an Owner row already exists, this script is not needed (and `bootstrapOwner()` itself will correctly report `ALREADY_EXISTS` rather than doing anything destructive).

**OWNER INPUT REQUIRED** on whether this single-role concentration (everything routes through Owner) is acceptable long-term, or whether a narrower "Recovery Operator" designation should eventually exist — see Q4, §20.

---

## 18. Migration/Deployment Recovery

Current mechanism: `prisma migrate deploy` applies each file in `prisma/migrations/` sequentially, tracked via Prisma's own `_prisma_migrations` table. Two of the five existing migrations contain **hand-written SQL that Prisma cannot regenerate declaratively** (§3's schema comments call this out explicitly): the `party_size`/`start_time < end_time` `CHECK` constraints and the two partial unique indexes (`capacity_commitments_one_committed_per_reservation`, `staff_users_one_owner`). This matters for recovery specifically because a naive "just run `prisma migrate dev` to regenerate migrations from `schema.prisma`" workflow would **silently drop these hand-written invariants** unless someone remembers to reapply them by hand — the schema file's own comment already warns about exactly this.

**Recommended safe sequence for a future production schema migration:**

```
BEFORE MIGRATION
  → create/verify a recovery point (a fresh backup, or confirmation the last scheduled one is recent enough — tied directly to whatever RPO is chosen, §7)
APPLY MIGRATION
  → prisma migrate deploy
VERIFY APPLICATION
  → run §13's integrity checks against the post-migration database
  → run the application's own test suite against a real Postgres instance (not the SQLite-backed CI job — see the Evidence Appendix note on this)
IF FAILURE
  → determine rollback strategy (below)
```

**Rollback strategy: restore/forward-fix, not down-migrations.** Prisma does not generate down-migrations for this project, and — per the point above — a hand-rolled down-migration would need to correctly reverse hand-written `CHECK` constraints and partial unique indexes that Prisma itself doesn't know about. **Do not casually recommend down-migrations** here, per the assignment's own instruction; this codebase's migration framework does not safely support them today. The two realistic recovery paths after a failed migration are: (1) restore the pre-migration backup point created in the "BEFORE MIGRATION" step above, or (2) write and apply a new, forward-only migration that corrects the problem — never a generated "undo" of the failed one.

---

## 19. Disaster-Recovery Runbook Proposal

Proposed **structure only** — this document does not write operational commands that depend on infrastructure not yet confirmed (no hosting decision exists yet, per §5/§9), consistent with the assignment's instruction.

`DISASTER_RECOVERY_RUNBOOK.md` (future file, not created by this investigation):

1. **Incident declaration** — who, and based on what evidence (ties to §17's "declare disaster recovery" authority).
2. **Stop writes if necessary** — relevant mainly for F5/F6 (active corruption/deletion in progress); not always necessary for F4 (total loss, nothing left to stop writing to).
3. **Determine failure type** — map the observed symptom to §6's F1–F10 taxonomy; the correct response differs materially between "temporarily unreachable" (F3) and "completely lost" (F4).
4. **Select recovery point** — which backup, and why (ties directly to the RPO analysis, §7).
5. **Provision recovery database** — §12 step 1.
6. **Restore** — §12 steps 2–3.
7. **Run integrity verification** — §13, in full.
8. **Start application** — §12 step 4.
9. **Smoke test** — §12 step 12.
10. **Reconcile outage-period reservations** — §16's manual-fallback reconciliation, if a manual process was in use during the outage.
11. **Declare authoritative state** — §17's explicit Owner sign-off, not an implicit assumption.
12. **Record incident** — what happened, when, what was lost (measured RPO/RTO, §14), and why.
13. **Preserve evidence** — the failed system's own logs/state, where feasible, before it's discarded — relevant especially for F5/F9 (corruption, compromise) where understanding root cause matters as much as recovering.
14. **Post-incident review** — what would have made this faster/safer; feed directly back into this report's own recommendations (§21–§22).

---

## 20. Owner Input Questionnaire

Only questions this repository's evidence cannot answer — deliberately not technical questions the engineering team should resolve itself.

### Q1 — Maximum acceptable reservation data loss (RPO)

If the database failed right now, how much lost booking/change/cancellation history would be a real operational problem versus a minor annoyance staff could work around by asking a few guests to reconfirm?

- **Essentially none** — implies near-real-time replication/PITR (Model C/D) eventually; disproportionate infrastructure for today's single-machine reality.
- **15 minutes** — a handful of the most recent changes at most; still requires more than a simple nightly/hourly dump.
- **1 hour** — realistically the most recent hour's bookings/changes; achievable with a modest scheduled-backup cadence.
- **Several hours** — a meaningful chunk of a service period could be lost; simplest to implement, weakest protection.
- **One day** — an entire day's activity at risk; only realistic if this system is never the sole record (i.e., a manual fallback always exists in parallel).

### Q2 — Maximum acceptable outage during active service

If the system goes down at 20:00 on a busy night, how long can it realistically stay down before it becomes a genuine operational problem rather than a manageable inconvenience?

- **15–30 minutes** — demands a rehearsed, fast restore path and a real recovery drill history (§14) before it's a credible commitment.
- **1 hour** — more realistic given nothing has been drilled yet (§8).
- **Several hours** — only tolerable if a real manual fallback (§16) is in active, practiced use — not just theoretically available.

### Q3 — Manual fallback

Do staff currently have, or would they accept, a temporary manual reservation workflow (pen-and-paper, or the existing pre-Guestplan-replacement system) for use specifically during a system outage — separate from whatever parallel process exists today only because the pilot hasn't fully replaced Guestplan yet?

### Q4 — Recovery authority

Should database restore/disaster-declaration authority stay concentrated entirely in the Owner role (§17's recommendation, matching R1.2's existing Owner-recovery precedent), or should a narrower "Recovery Operator" designation eventually exist for a technical staff member/contractor who isn't the Owner? This has real consequences if the Owner is ever unreachable during an actual incident.

---

## 21. MVA vs. Replacement Boundary

**MVA REQUIRED** (needed before meaningful resilience testing can even begin):
- Model A scheduled backup (§9) — closes the current NOT FOUND state.
- At least one independent-failure-domain copy (§10).
- Basic backup verification (§15, file/PostgreSQL-level at minimum).
- A first restore drill (§14) — proves the above actually works.
- Fixing the test/pilot database separation risk (§6 F6, §23 P0) — this is arguably more urgent than the backup work itself, since it's a currently-live footgun, not a gap in disaster protection.

**GUESTPLAN REPLACEMENT REQUIRED** (needed before Guestplan can safely be removed):
- A documented, owner-approved RPO/RTO (§7/§8) — cannot respons­ibly retire the existing system without knowing how bad "this new system's database dies" would actually be.
- A defined operational outage/manual-fallback procedure (§16) that survives Guestplan's retirement, not one that only exists today because Guestplan happens to still be there.
- Backup encryption and access control (§11) in place, not just planned — real guest PII, no parallel system left to fall back on.
- At least one successfully measured restore drill with results meeting the owner-approved RTO/RPO (§14, AC-R06/R07/R08).
- Recovery authority (§17) explicitly assigned, not merely proposed.

**POST-REPLACEMENT** (useful, can safely wait):
- Model C/D (WAL/PITR, hybrid) — only once real production volume and an actual hosting decision justify the operational cost (§9).
- A dedicated, narrower "Recovery Operator" role, if Q4 (§20) resolves toward wanting one.
- Automated backup-corruption detection beyond the basic checks in §15 (e.g., scheduled restore drills on a fixed cadence rather than ad hoc).
- A daily read-only service snapshot for staff (§16) as a designed, permanent feature rather than an MVA stopgap.

---

## 22. Acceptance Criteria Proposal

AC-R01 through AC-R12 as given by the assignment, none altered, plus one addition this investigation's evidence directly justifies:

- **AC-R01** — Automated backup of all authoritative PostgreSQL data exists.
- **AC-R02** — At least one recoverable backup copy survives loss of the primary database host/failure domain.
- **AC-R03** — Backup confidentiality is protected.
- **AC-R04** — A clean PostgreSQL instance can be restored from backup.
- **AC-R05** — Restored application passes defined integrity checks (§13).
- **AC-R06** — Restore procedure has been executed, not merely documented (§14).
- **AC-R07** — Measured RPO satisfies owner-approved requirement (§7, Q1).
- **AC-R08** — Measured RTO satisfies owner-approved requirement (§8, Q2).
- **AC-R09** — Backup corruption/unrestorability can be detected through scheduled verification (§15).
- **AC-R10** — A failed deployment/database migration has a documented recovery path (§18).
- **AC-R11** — Staff have a documented operating procedure while the reservation system is unavailable (§16).
- **AC-R12** — Recovery authority is explicit and auditable (§17).
- **AC-R13 (new, evidence-driven)** — The automated test suite cannot write to, or truncate, any database also used by a running pilot or production instance — enforced structurally (e.g., a distinct, separately-configured test database), not by comment alone. Directly closes the §6 F6 / §23 P0 finding (`testHarness.ts`'s `resetDatabase()`).

---

## 23. Risks

| # | Risk | Class |
|---|---|---|
| 1 | No backup exists at all — total, unrecoverable loss on host failure | **P0** |
| 2 | Integration test suite can `TRUNCATE` live pilot data — no environment separation between test and pilot `DATABASE_URL` (§6 F6) | **P0** |
| 3 | Application and database are on the same single machine — F2 and F4 are the same event; no independent failure domain exists (§10) | **P0** |
| 4 | Backup, once built, stored on the same machine/account as the primary — would satisfy AC-R01 but not AC-R02, and would create false confidence | **P1** (forward-looking — do not build this way) |
| 5 | Restore is entirely untested — "we have a backup" would currently be an unverified claim, not evidence (§14) | **P1** |
| 6 | `/health` does not check database connectivity — an outage (F3/F4) can look identical to "all fine" from outside the process (§6 F3) | **P1** |
| 7 | Backup would contain PII with no encryption/access-control design yet in place (§11) | **P1** |
| 8 | Schema/application mismatch after restore if migrations and data restore are reconciled inconsistently (§12/§18) | **P1** |
| 9 | Loss of most-recent reservations under any backup schedule slower than the owner's actual RPO tolerance (§7) — currently unknown/undefined, since Q1 is unanswered | **P1** |
| 10 | Capacity/reservation inconsistency after restore if `CapacityCommitment` and `Reservation` are restored from points that don't correspond exactly (§13's dedicated invariant check exists specifically for this) | **P1** |
| 11 | Migration failure with no drilled rollback/forward-fix procedure (§18) | **P2** |
| 12 | Credentials (`.env`) unavailable during a disaster if they only ever existed on the lost machine, with no separate secure record of them | **P2** |
| 13 | False confidence from an eventual provider's backup claims, adopted without verification, once/if a hosting decision is made (§5's explicit warning against assuming provider backup) | **P2** |
| 14 | CI (`reservations-ci.yml`) runs migrations against a throwaway SQLite file, not real PostgreSQL — CI passing provides no evidence about restore/migration behavior against the actual production database engine (Evidence Appendix) | **P3** |

---

## 24. Final Architecture Recommendation

```
BACKUP MODEL:
Model A — Scheduled logical backup (pg_dump), with an explicit, planned
path toward Model D (hybrid managed/PITR + independent logical backup)
once a real hosting decision exists and owner-confirmed RPO/RTO justify
the added complexity.

RESTORE MODEL:
Repository-authoritative schema (prisma migrate deploy) applied first to
a clean instance, then data restored from the pg_dump backup into that
schema — never a raw pre-migrated dump assumed to already match
schema.prisma.

RPO:
OWNER INPUT REQUIRED (§7, Q1).

RTO:
OWNER INPUT REQUIRED (§8, Q2) — and should initially be set from what a
real restore drill (§14) actually measures, not a number chosen first
and hoped for afterward.

OFF-SITE / INDEPENDENT COPY:
REQUIRED — today's architecture (single machine, application and
database co-located) has zero independent failure domain (§10); this is
the single highest-leverage structural fix available.

RESTORE DRILL:
At least one full drill (§14) before AC-R06 can be considered met; cadence
thereafter tied to how often the schema/data actually changes materially
— not fixed by this report.

OPERATIONAL FALLBACK:
Not currently defined beyond the pilot-era coincidence of Guestplan still
running in parallel (§16). Must be deliberately designed, not assumed to
persist, before Guestplan is actually retired.

MVA:
Scheduled Model A backup + independent-domain copy + basic verification +
one real restore drill + closing the test/pilot database-separation risk
(§21, §23 risk #2) — this last item arguably more urgent than backup
infrastructure itself, since it is a live, self-inflicted risk today, not
a hypothetical disaster.

GUESTPLAN REPLACEMENT REQUIREMENT:
Owner-approved RPO/RTO, a durable (non-pilot-dependent) operational
fallback, backup encryption/access control actually in place, at least
one restore drill meeting the approved targets, and explicit recovery
authority (§21).

IMPLEMENTATION READINESS:
NOT READY — this is an investigation and architecture proposal only;
no backup tooling exists yet (§5), and two owner decisions (RPO, RTO)
are prerequisites for implementing correctly rather than by guess.

CONFIDENCE:
MEDIUM-HIGH — the current-state findings (§2–§6) are drawn directly from
this repository's own code, migrations, configuration, and explicit
first-party documentation (PILOT.md), not inferred or assumed. The
forward-looking architecture recommendation (Model A → Model D path) is
a standard, low-risk pattern for a system at this exact stage (single
machine, pre-hosting-decision, modest data volume) — confidence is not
HIGH only because the two owner-decision inputs (RPO/RTO) that would
let this become a fully specified, implementable plan are still open.
```

---

## 25. Evidence Appendix

Direct citations for every load-bearing claim in this report:

- **No backup exists:** `PILOT.md`, "Known, accepted limitations during the pilot" — *"PostgreSQL, single local instance, single machine. … The database configured in `.env` is the entire record. It is not backed up automatically."*
- **Real guest PII:** `PILOT.md`, same section — *"Real guest data. Guest names/phone numbers typed into 'contact' are real personal data from the moment the pilot starts."*
- **Persistence model:** `solutions/reservations/implementation/prisma/schema.prisma` (10 models, read in full).
- **Hand-written DB invariants:** `prisma/migrations/20260817090958_init_postgres_with_capacity/migration.sql` (party_size/start<end CHECK constraints); `prisma/migrations/20260818073300_one_committed_commitment_per_reservation/migration.sql`; `prisma/migrations/20260818105411_staff_identity_and_access/migration.sql` (`staff_users_one_owner` partial unique index).
- **Local, single-machine database:** `.env` — `DATABASE_URL="postgresql://…@localhost:5433/helix_reservations_dev?schema=public"` (port 5433 matches this program's own recorded local Postgres setup — see [[helix_postgres_local_setup]]); `.env.example` shows only a generic template, no provider-specific hints.
- **No SQLite remnants:** `.gitignore` still lists `prisma/dev.db`/`dev.db-journal` as a pattern, but direct filesystem search confirms neither file exists; `README.md` "Known limitations" confirms the SQLite→PostgreSQL switch happened during CAP-D02.03 and is complete.
- **No external dependencies:** `package.json` — dependencies are exactly `@prisma/client`, `express`, `libphonenumber-js`, `prisma`.
- **`/health` does not check the database:** `api/app.ts` — `app.get("/health", (_req, res) => { res.status(200).json({ status: "ok" }); });`.
- **Test/pilot database-separation risk:** `tests/integration/support/testHarness.ts` — `resetDatabase()`'s `TRUNCATE TABLE … RESTART IDENTITY CASCADE` plus its own comment ("Safe only against the dedicated local test database configured in .env — never call against anything else"); cross-checked against every integration test file's `const prisma = new PrismaClient();` (no override), and confirmed no `TEST_DATABASE_URL` or equivalent exists anywhere in the repository.
- **Owner-recovery mechanism:** `infrastructure/bootstrap/bootstrapOwner.ts`, full file read — env-var-gated, gated authoritatively by the `staff_users_one_owner` constraint, explicitly documented as doubling as the Owner-recovery path.
- **CapacityPool is code, not a table:** `domain/availability/CapacityPool.ts` — *"Deliberately a small static configuration, not a database-backed entity."*
- **ServicePeriod not persisted:** `infrastructure/UnvalidatedServicePeriodReader.ts` — placeholder, always returns `{ isValid: true }`.
- **Retention/anonymization deferred:** `R1_3_I1_CAP_D05_01_IMPLEMENTATION_REPORT.md` — *"AUTOMATED RETENTION EXECUTION IS DEFERRED — no purge job exists"*; *"No anonymization operation was built in this slice."*
- **Shared-transaction write pattern:** `R1_3_I1_FINAL_GATE_ADDENDUM.md` and schema comments on `Reservation`/`Contact`/`CapacityCommitment` — confirms atomic multi-table writes, relevant to §12's restore-consistency reasoning.
- **CI does not exercise real PostgreSQL:** `.github/workflows/reservations-ci.yml` — `DATABASE_URL: "file:./dev.db"`, explicitly commented *"SQLite, same as local dev — no external service needed for CI"*; cross-checked against `README.md`'s own CI section, which independently confirms *"prisma migrate deploy (against a throwaway SQLite file)"*. This is documented, intentional behavior on the repository's own account — not silent drift — but it means CI provides no evidence about migration or restore behavior against the actual production database engine (Postgres), which is directly relevant to §18's migration-recovery discussion. Reported as a P3 risk (§23), not a blocking finding.
- **No infra/hosting/CI-CD beyond the one workflow above:** confirmed by repository-wide search for `docker-compose*`, `Procfile`, and `.github/workflows/*` — only `reservations-ci.yml` exists.

---

**STOP CONDITION REACHED (original investigation, unmodified above).** Repository investigation, architecture analysis, report creation, and the owner questionnaire are complete. No backup tooling was implemented. No code, schema, or migration was modified. No package was installed. No infrastructure was configured. No commit was made. No push occurred. No Guestplan or Konnichiwa website change occurred. Awaiting Chief Engineer review and owner answers to Q1–Q4 (§20).

---

## 26. Owner Decision and Implementation Record (BR-R14-01–04)

**This section is a later addendum, appended after a separate Chief Engineer Implementation Instruction. Nothing above this line (§1–§25, including the original STOP CONDITION notice) has been edited, reworded, or removed — every finding, classification, and NOT FOUND/OWNER INPUT REQUIRED marker above reflects exactly what this document said before implementation began.** Where the owner's decisions below resolve a question this document originally left open, that resolution is recorded here, not by rewriting the original section.

### Owner-confirmed business rules (received after this investigation, authorizing R1.4 implementation)

- **BR-R14-01 — RPO: MAXIMUM 15 MINUTES.** Resolves §7's open recommendation. §7 evaluated candidate values from 24 hours down to near-zero/PITR without choosing one, explicitly deferring to the owner (*"OWNER INPUT REQUIRED — see Q1, §20"*). The owner selected 15 minutes — the second-most demanding option §7 evaluated, one step short of near-zero/PITR.
- **BR-R14-02 — RTO: 15–30 MINUTES MAXIMUM TARGET** during active service. Resolves §8's open recommendation (*"OWNER INPUT REQUIRED for the target — see Q2, §20"*) — the owner selected the most demanding band §8 evaluated.
- **BR-R14-03 — Manual Operational Fallback: YES**, with a defined minimum field set (guest name, phone/email, date/time, party size, area, allergies/critical note if operationally necessary, change type, time recorded, staff member recording it) and an explicit instruction not to build a second reservation application. Directly answers Q3 (§20) — the owner confirmed staff would use a temporary manual workflow, and specified its bounded shape.
- **BR-R14-04 — Recovery Authority: OWNER ONLY** for production restore, disaster-recovery activation, and declaring a restored database authoritative; Managers may activate/use the manual fallback and coordinate reconciliation, but may not independently authorize a restore, and no new "Recovery Operator" role is to be created. Directly answers Q4 (§20) — §17's own recommendation (concentrate authority in Owner, matching the existing R1.2 Owner-recovery precedent) is the option the owner chose; the narrower "Recovery Operator" alternative §17 also raised was explicitly declined.

### Model selection, re-confirmed against the 15-minute RPO

§9 recommended Model A (scheduled `pg_dump`) as the MVA-appropriate starting point without yet knowing the owner's numeric RPO target. Once BR-R14-01 set that target at 15 minutes, Model A **on a daily/hourly schedule** (the default cadence §9 illustratively discussed) would no longer satisfy it — a gap the implementation phase was explicitly instructed to resolve honestly rather than paper over. It was resolved by distinguishing the backup **mechanism's** capability from a **production-scheduled** claim: `pg_dump` itself imposes no cadence floor and can run every ≤15 minutes; no scheduler infrastructure exists yet to actually run it that often in production. See the implementation report §5 for the full resolution and its `RPO MECHANISM READY` vs. `PRODUCTION RPO ≤15 MIN: NOT PROVEN` distinction — that distinction is implementation evidence, not a correction to this document's own §7/§9, which remain accurate as of when they were written.

### Where to find what was actually built and measured

This document is the **architecture investigation** — evidence of current-state findings and a recommended design, produced before any implementation existed. It is not updated further with implementation details. What was actually built, tested, and measured against the owner decisions above — the P0 test-database fix, the backup/restore/integrity mechanisms, two full recovery-drill runs with real measured timings, the disaster-recovery runbook, and 344 passing automated tests — is recorded separately in **`R1_4_OPERATIONAL_RESILIENCE_IMPLEMENTATION_REPORT.md`**, which should be read alongside this document, not as a replacement for it.
