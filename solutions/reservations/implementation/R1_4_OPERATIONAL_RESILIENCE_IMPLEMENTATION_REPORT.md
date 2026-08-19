# R1.4 — Operational Resilience: Implementation Report

Mode: BOUNDED IMPLEMENTATION + VERIFICATION. Authority: the R1.4 Chief Engineer Implementation Instruction (owner-confirmed business rules BR-R14-01–04) and `R1_4_OPERATIONAL_RESILIENCE_ARCHITECTURE.md` (Investigation + Architecture Proposal, COMPLETE).

No production deployment. No Guestplan changes. No Konnichiwa website changes. Nothing pushed.

---

## 1. Repository Baseline

| Item | Value |
|---|---|
| Repository | `HELIX` (`C:\Users\kelvin\HELIX`) |
| Branch | `feat/ec-002-visibility-baseline` |
| HEAD before this work | `b71e4879acadf554b8fb892566f5ef6ed4e78906` — `fix(reservations): harden contact phone normalization` |
| Pre-existing untracked file | `solutions/reservations/implementation/R1_3_GUEST_CONTACT_ARCHITECTURE_INVESTIGATION.md` (unchanged by this work) |
| R1.4 architecture report | `R1_4_OPERATIONAL_RESILIENCE_ARCHITECTURE.md`, produced in the immediately preceding task, COMPLETE |

---

## 2. P0 Test-Database Finding (recap)

The architecture investigation found `tests/integration/support/testHarness.ts`'s `resetDatabase()` running `TRUNCATE ... CASCADE` against whatever `DATABASE_URL` was active, gated only by a code comment ("safe only against the dedicated local test database... never call against anything else") — no structural enforcement. Grep during this implementation phase additionally found **three more, previously-undiscovered inline `TRUNCATE` call sites** with the identical problem, in `tests/api/reservations.test.ts`, `tests/integration/identity-access.test.ts`, and `tests/integration/login-abuse-protection.test.ts` — the real destructive-reset surface was four separate, independently-written statements, not one.

## 3. P0 Fix

**Structural, not advisory.** A new, dedicated PostgreSQL database, `helix_reservations_test`, was provisioned locally (separate from `helix_reservations_dev`, the pilot's own database) and is now the only database the integration/API test suite is permitted to connect to.

- **`tests/integration/support/testDatabaseSafety.ts`** (new) — the single gate. `resolveTestDatabaseUrl()` reads `TEST_DATABASE_URL` only, never falls back to `DATABASE_URL`, and refuses if the two are textually identical. `createTestPrismaClient()` is the only sanctioned way a test file may construct a Prisma client. `assertSafeToReset(prisma)` re-verifies, against the live connection actually held (not environment variables), that (a) `SELECT current_database()` returns exactly `helix_reservations_test`, and (b) a provisioned sentinel row (`_test_database_sentinel`) exists and reads `is_test_database = true`. `truncateReservationDomainTables()`/`truncateStaffDomainTables()` are the only two functions in the test codebase allowed to execute `TRUNCATE`, and both call `assertSafeToReset()` first — a failing check throws before the destructive statement is ever reached.
- **`ops/testDatabaseSetup.ts`** (new) — the *only* place the sentinel is ever created (`npm run setup-test-db`). The gate only ever reads it. Provisioning itself independently re-verifies the target database name before writing anything, so this script cannot be pointed at the pilot database by mistake either.
- All four original destructive-reset sites were refactored to delegate to the shared gate: `testHarness.ts`'s `resetDatabase()`, and the three previously-undiscovered inline `resetAll()`/`resetStaffTables()` functions.
- All **14** `new PrismaClient()` construction sites across **8** test files were switched to `createTestPrismaClient()` (2 legitimate application-side constructions — `api/server.ts`, `infrastructure/bootstrap/bootstrapOwner.ts` — were deliberately left untouched; they must keep reading `DATABASE_URL`).
- `tsconfig.json`'s `include` list was extended with `ops` (the new operational-tooling directory) so it is actually typechecked.

**Defense in depth, per the assignment's instruction**: three independent signals must all agree (exact database name, sentinel row, non-identical env vars) — no single check is trusted alone.

---

## 4. Backup Architecture Implemented

**Model A (scheduled logical backup, `pg_dump`)**, per the architecture report's recommendation, implemented as `ops/backup/createBackup.ts` (`npm run backup`):

- `pg_dump -Fc` (custom format) against `BACKUP_SOURCE_DATABASE_URL` (falls back to `DATABASE_URL` — the primary database, since that is what production backup exists to protect).
- Excludes `_test_database_sentinel` (test-tooling metadata, not application schema) via `--exclude-table`.
- Writes a timestamped `.dump` file plus a JSON manifest (§6) to `BACKUP_DESTINATION_DIR` (default `./backups`, gitignored).
- **Retention**: keeps the `BACKUP_RETENTION_COUNT` (default 30) most recent successful backups, deleting older dump+manifest pairs.
- **Failure detection**: a non-zero `pg_dump` exit code produces a `"status": "FAILED"` manifest with `failureReason` populated, rather than throwing an unhandled error or silently producing nothing.

## 5. RPO Mechanism

The owner-confirmed target is **15 minutes maximum (BR-R14-01)**. §6 of the architecture report already anticipated this could not be satisfied by a daily/hourly `pg_dump` alone, and directed an explicit resolution rather than a pretended one. That resolution:

- **RPO MECHANISM READY**: `npm run backup` can be invoked on any schedule, including every ≤15 minutes — nothing in its design imposes a slower floor; each run is a self-contained, idempotent, independently-checksummed artifact.
- **PRODUCTION RPO ≤15 MIN: NOT PROVEN.** No scheduler/cron infrastructure exists in this repository or its (nonexistent) hosting environment — see §19, Hosting-Dependent Requirements. A mechanism *capable of* meeting the RPO is not the same claim as a *production system currently meeting it*, and this report does not conflate the two.
- WAL/PITR (Model C) and managed-provider PITR (Model B) were re-evaluated against the 15-minute requirement per the assignment's explicit instruction; both remain correctly rejected as MVA-stage infrastructure per the architecture report's own reasoning (§9) — a ≤15-minute `pg_dump` cadence is the smallest architecture capable of meeting the requirement given the current single-machine, pre-hosting-decision reality, and is what this report recommends operationally scheduling once a host exists to schedule it on.

## 6. Restore Architecture

`ops/restore/restoreBackup.ts` (`npm run restore -- <backupId>`):

- **Schema from the repository, data from the backup** — the architecture report §12's explicit resolution, implemented exactly: `prisma migrate deploy` is run against `RESTORE_TARGET_DATABASE_URL` first (bringing the target to the exact current migration state, hand-written `CHECK` constraints and partial unique indexes included), then `pg_restore --data-only` loads rows on top of that schema. A dump's own embedded schema section is never trusted.
- **Fail-closed default**: `targetAppearsNonEmpty()` queries `reservations`/`staff_users`/`contacts` row counts on the target; if any is non-zero, the restore refuses unless **both** `RESTORE_ALLOW_NON_EMPTY_TARGET=true` **and** `RESTORE_DISASTER_RECOVERY_CONFIRMATION` exactly equal `"I UNDERSTAND THIS WILL OVERWRITE THE TARGET DATABASE"` are set — two independent, deliberately-typed signals, matching this project's existing pattern for high-blast-radius actions (Owner-only recovery, R1.2).
- **§8 ephemeral-data decision, implemented**: `staff_sessions` and `login_attempt_windows` are present in every dump (captured for forensic completeness) but are explicitly `TRUNCATE`d immediately after a normal restore (`clearEphemeralTables()`), forcing fresh login and a clean rate-limit slate rather than resurrecting pre-incident session/throttle state. `RESTORE_INCLUDE_EPHEMERAL_TABLES=true` opts out for a forensic drill.
- **A real bug this design surfaced and fixed** (kept here rather than only in the evidence appendix, because it materially shaped the final implementation): the first working version used `pg_restore --disable-triggers` against the target's own least-privilege application role. PostgreSQL refuses `ALTER TABLE ... DISABLE TRIGGER ALL` against internally-generated foreign-key constraint triggers for **any** non-superuser role, regardless of table ownership — the restore silently continued past that permission error and then loaded child tables (`reservation_events`) out of dependency order, producing real foreign-key violations and a **restored database missing all of its `ReservationEvent` rows while reporting no fatal error**. The fix: `RESTORE_SUPERUSER_DATABASE_URL`, an optional, separately-scoped elevated credential used **only** for this one `pg_restore` invocation — standard real-world PostgreSQL restore practice, not a workaround.

## 7. Backup Manifest

`ops/backup/backupManifest.ts` defines the shape; every field is populated by `createBackup.ts`:

`backupId`, `createdAt`, `databaseIdentifier` (host:port/dbname — **never** a credential), `schemaMigrations` (queried live from `_prisma_migrations`), `applicationCommit` (`git rev-parse HEAD`, `"unknown"` if unavailable), `filename`, `sizeBytes`, `checksumSha256`, `status` (`SUCCESS`/`FAILED`), `failureReason`, `excludedFromDefaultRestore`. No secret is ever written to a manifest — verified directly by `tests/ops/backup.test.ts`'s dedicated test (§16).

## 8. Integrity Verification

`ops/integrity/verifyIntegrity.ts` (`npm run verify-integrity`) — **13 checks**, each independently PASS/FAIL, rolled up into one `overall: "PASS" | "FAIL"`:

Identity (`staff-user-owner-invariant`), Reservations (`reservations-readable`, `reservation-events-referential-integrity`, `reservation-events-count-plausible`, `reservation-created-by-audit-preserved`), Contacts (`post-cap-d05-01-reservations-resolve-valid-contact`, `reservation-contact-snapshot-presence`), Capacity (`capacity-commitments-readable`, `one-committed-commitment-per-reservation`, `capacity-reservation-relationship-credible`), Idempotency (`applied-command-state-preserved`), Schema (`schema-migration-state`), Freshness (`freshness-latest-reservation-timestamp`, `freshness-latest-event-timestamp`).

**`reservation-events-count-plausible` exists because of a real failure this capability's own drill produced** (§6): an orphan-only referential-integrity check trivially passes against an entirely *empty* child table, since zero rows can never be orphaned. This check additionally requires that a nonzero `Reservation` count come with a nonzero `ReservationEvent` count — the exact condition the FK-ordering bug violated, and the exact condition a naive integrity checker would have missed. **"A successful `pg_restore` alone is NOT sufficient" is not a slogan in this report — it is the literal lesson this integrity checker's own second version was written to fix.**

## 9. Recovery Drill

`ops/recoveryDrill.ts` (`npm run recovery-drill`) — a real, automated, end-to-end drill against real PostgreSQL, executed twice during this implementation (not merely designed):

```
SEED SOURCE DATABASE (TEST_DATABASE_URL — synthetic, clearly-labeled drill data; never DATABASE_URL)
  → CREATE BACKUP → PROVISION CLEAN RECOVERY DATABASE (RESTORE_TARGET_DATABASE_URL, a third, dedicated,
    disposable database — schema dropped/recreated, never the pilot's own database)
  → RESTORE → RUN INTEGRITY CHECK → START APPLICATION AGAINST RESTORED DATABASE
  → AUTHENTICATE → READ RESERVATIONS → VERIFY CONTACT → VERIFY CAPACITY → CONTROLLED SMOKE TEST
```

Per the assignment's explicit instruction, the original (seeded, synthetic) source database was never physically destroyed to "prove" the drill — restoring into a genuinely separate third database already proves the mechanism without that needless risk, even to test data.

**Both drill runs: OVERALL PASS**, all 11 steps OK, all 13 integrity checks PASS. Full JSON evidence: `recovery-drill-results/2026-08-19T16-20-43-946Z.json` and `...T16-20-58-859Z.json` (gitignored — not committed, available locally).

## 10. Measured Local Recovery Time

From the second drill run (`recovery-drill-results/2026-08-19T16-20-58-859Z.json`):

| Phase | Duration |
|---|---|
| Backup | 544 ms |
| Restore (schema migrate + data restore + ephemeral clear) | 1,940 ms |
| Integrity check (13 checks) | 103 ms |
| **Total measured recovery time** (backup-complete → smoke-test-complete) | **2,350 ms (≈2.35 s)** |

The first run measured 2,274 ms — consistent, repeatable, well under a second's variance between runs.

**This is LOCAL MECHANISM evidence, not a production RTO claim** — see §16.

## 11. Operational Fallback

`DISASTER_RECOVERY_RUNBOOK.md` (new) defines the bounded manual fallback (BR-R14-03): a Manager may activate it without waiting for Owner sign-off; staff record guest name, phone/email, date/time, party size, area, allergies/critical notes where operationally necessary, change type, time recorded, and who recorded it. Explicitly: **no automated capacity authority while the system is offline** — every acceptance decision during an outage is a manual staff judgment call, same as no reservation system existing at all. No second reservation application was built.

## 12. Service Snapshot

`ops/snapshot/createServiceSnapshot.ts` (`npm run service-snapshot`) — the smallest mechanism evaluated: queries the source database for Proposed/Confirmed reservations in the next `SNAPSHOT_WINDOW_HOURS` (default 48), resolves each reservation's Contact **only for reservations actually in that window** (never a dump of the whole Contacts table), and writes a self-contained, dependency-free `snapshots/latest.html` (viewable offline in any browser) plus `latest.json`. Deliberately excludes: `StaffUser` entirely (so, structurally, no password hash can ever appear), `SecurityEvent`, `LoginAttemptWindow`, any Contact outside the window, and any reservation outside the window. Always overwrites the same fixed path with a prominent generation timestamp, so staff have one well-known place to look regardless of staleness. **This is explicitly not a database backup** — the file's own embedded banner states this. Refresh cadence: intended to run at least as often as the owner-confirmed 15-minute RPO posture; the actual scheduler is HOSTING-DEPENDENT (§19).

## 13. Reconciliation

`DISASTER_RECOVERY_RUNBOOK.md` §4 defines the sequence: Owner authorizes the restored system as authoritative → Manager gathers manual outage-period records → staff individually enter/reconcile them → conflicts are reviewed manually, never auto-resolved → `AppliedCommand`-based duplicate detection is advisory only during reconciliation entry (a human re-entering the same paper record twice is indistinguishable from two genuine bookings without a person looking) → normal capacity rules resume with no special bypass → reconciliation is verified before the manual fallback formally closes. Handwritten records are never bulk-replayed automatically.

## 14. Recovery Authority

`DISASTER_RECOVERY_RUNBOOK.md`'s header states it directly and the whole document is structured around it: **Owner only** may authorize a production restore, declare disaster-recovery active for database purposes, or declare a restored database authoritative (BR-R14-04). Managers may activate/run the manual fallback and coordinate reconciliation — never the database-level actions. No new application role was created; the runbook reuses R1.2's existing `StaffUser.role` terminology (Owner/Manager) exactly as instructed.

## 15. Migration Safety

`DISASTER_RECOVERY_RUNBOOK.md` §5 documents the sequence: verified recent backup → record current commit/migration state (already automatic — every backup manifest captures both) → `prisma migrate deploy` → `npm run verify-integrity` → start/verify application → on failure, restore or forward-fix, **never** a destructive down-migration (this project's migrations contain hand-written `CHECK` constraints and partial unique indexes Prisma cannot regenerate declaratively — schema.prisma's own documented reasoning). Exact production scheduling remains HOSTING-DEPENDENT.

## 16. Test Evidence

**Full regression: 30 test files, 344 tests, all passing** (`npm test`, real PostgreSQL throughout, `fileParallelism: false`):

- All pre-existing 324 tests (R1.1 capacity/concurrency, R1.2 identity/security, R1.3 Contact management, acceptance/domain/application suites) — **unchanged behavior, all green**.
- `tests/integration/test-database-safety.test.ts` — **7 new tests**: known test DB → reset allowed; production-like DB (real `DATABASE_URL`) → refused; the `TRUNCATE` statement itself proven never reached (spy on `$executeRawUnsafe`, zero calls); missing `TEST_DATABASE_URL` → refused before any connection; two distinct "ambiguous configuration" cases (identical env values; and a textually-different URL that still resolves to the same live database, defeating a naive string-equality check but caught by the live re-verification) → refused; sentinel sanity check.
- `tests/ops/backup.test.ts` — **5 new tests**: valid checksum matching the actual file; manifest fields (migrations, commit, database identity) populated correctly; **no secret in the manifest** (asserted directly against the real decoded password); a bad source connection produces a recorded `FAILED` manifest rather than an unhandled crash; retention removes old backups beyond the configured count.
- `tests/ops/restore-and-integrity.test.ts` — **8 new tests**: clean-target restore succeeds and integrity → PASS; a second restore into the now-non-empty target is refused; the explicit two-signal disaster-recovery override permits it; a wrong/mismatched confirmation phrase does **not** bypass the gate; missing backup → refused; a `FAILED`-status manifest → refused before any restore is attempted; an unreachable target connection surfaces as a real error, never a silent success; and — directly reproducing the bug found in §6/§8 — deliberately deleting a Contact out from under a restored Reservation (not DB-enforced by design) makes `verifyIntegrity` report **FAIL**, proving the tooling does not overclaim.

## 17. Failure-Injection Evidence

Per §24's specific list: **missing backup** (loadManifest on a nonexistent ID throws), **corrupt/invalid backup** (a synthetic `FAILED`-status manifest is refused before any restore command runs), **wrong/unsafe target database** (non-empty target refused by default; unreachable target connection surfaces as an error), **restore command failure** (unreachable `RESTORE_TARGET_DATABASE_URL` — the restore call rejects, nothing is silently swallowed), **integrity failure after a technically-successful restore** (the Contact-deletion test above: `pg_restore` exits cleanly, `verifyIntegrity` still reports FAIL). All five are covered by `tests/ops/restore-and-integrity.test.ts`, not left as manual-only exercises.

## 18. Security/PII Considerations

- `.gitignore` updated (scoped, not a blanket `*.sql`/`*.dump` pattern — that would have accidentally caught legitimate, tracked `prisma/migrations/**/*.sql` files, caught and corrected during this work): `/backups/`, `/snapshots/`, `/recovery-drill-results/`.
- No backup, dump, or snapshot artifact was committed — confirmed directly (§20).
- No credential was committed — `.env` remains gitignored; the new `TEST_DATABASE_URL`/`RESTORE_TARGET_DATABASE_URL`/`RESTORE_SUPERUSER_DATABASE_URL` variables live only there and in `.env.example` (template placeholders only).
- Backup manifests contain a database identifier (host:port/dbname) and never a credential — asserted directly by an automated test, not just claimed (§16).
- The service snapshot structurally excludes `StaffUser` (no password hash can appear), `SecurityEvent`, `LoginAttemptWindow`, and any Contact/reservation outside its narrow operational window.
- Ephemeral security state (`staff_sessions`, `login_attempt_windows`) is deliberately excluded from a normal restore's live data, forcing fresh authentication after any disaster-recovery event — a considered security decision, not an oversight (§6/§8).
- 5-year Contact/PII retention (R1.3): backup retention (`BACKUP_RETENTION_COUNT`, default 30 backups) is a **separate** knob from that data-retention anchor, per the architecture report §11's own instruction not to conflate them — no automated GDPR subsystem was built, consistent with "do not implement a complete GDPR subsystem."
- No production encryption-at-rest/in-transit was implemented — correctly out of reach without real hosting; documented as HOSTING-DEPENDENT (§19), not silently skipped.

## 19. Hosting-Dependent Requirements

Explicitly unresolved because no production hosting decision exists yet (consistent with the architecture report's own finding — a single local machine, pre-hosting-decision):

- A scheduler to actually run `npm run backup` on a ≤15-minute cadence in production (§5).
- A scheduler to actually refresh the service snapshot at the same cadence (§12).
- An independent-failure-domain destination to move backup artifacts to (`backups/` today is local, primary-database-adjacent storage only — architecture report §10's own finding, unchanged by this implementation).
- Backup encryption at rest/in transit to that destination.
- A real elevated-credential management story for `RESTORE_SUPERUSER_DATABASE_URL` in a production setting (today it is a local superuser password in a gitignored `.env`, appropriate for a single-developer local environment only).
- Production process supervision for `npm start` (F1's own gap, noted in the architecture report, not addressed by this implementation slice — out of R1.4's bounded scope).

## 20. Remaining Risks

| # | Risk | Class |
|---|---|---|
| 1 | Production RPO/RTO remain unproven — only the local mechanism is proven (§5/§16 vs §19) | **P1** |
| 2 | No scheduler exists to actually run backups/snapshots on any cadence in production | **P1** |
| 3 | Backup storage remains local/primary-adjacent — no independent failure domain yet exists to move artifacts to | **P1** |
| 4 | `RESTORE_SUPERUSER_DATABASE_URL` is a real elevated local credential in `.env` — appropriate for this single-developer local setup only, not a production credential-management design | **P2** |
| 5 | `/health` still does not check database connectivity (architecture report finding, unresolved by this implementation slice — was not in R1.4's Phase A–F scope) | **P2** |
| 6 | No automated scheduled restore-drill cadence exists yet — the two drills in this report were manually triggered, not yet a recurring practice | **P2** |
| 7 | CI still runs against a throwaway SQLite database, not real PostgreSQL (pre-existing, architecture report P3, unchanged) | **P3** |

## 21. Production Readiness Assessment

**NOT READY.** All local, bounded gates pass (§16/§17), but §19's hosting-dependent gaps are real and unclosed — there is no production scheduler, no independent backup destination, and no production credential story. Claiming production readiness here would be exactly the "inflated claim" §16/§28 of the assignment forbid.

## 22. Guestplan Replacement Assessment

**NOT REPLACEABLE.** R1.4 closes one major, previously-open replacement blocker (Konnichiwa Reservations now has a real backup/restore/integrity/recovery mechanism where none existed before). It does not close: guest-facing booking replacement, floor/seating management, external reservation channels, production hosting/deployment, or the remaining Confirm/Modify/Cancel/Complete HTTP-level pilot-readiness pass (README's own "Known limitations").

---

## Evidence Appendix

- Baseline commands and their output: `git status --porcelain=v1`, `git log --oneline -8` (§1).
- `npm run typecheck` — clean after every phase.
- `npm test` — 30 files / 344 tests passing (final run, this report's own evidence for §16).
- Two full `npm run recovery-drill` runs, both `OVERALL PASS` — `recovery-drill-results/2026-08-19T16-20-43-946Z.json`, `...T16-20-58-859Z.json` (gitignored, available locally, not committed).
- The FK-ordering restore bug (§6/§8/§16): first drill attempt failed with `ERROR: insert or update on table "reservation_events" violates foreign key constraint` after a "successful" `--disable-triggers` restore against a non-superuser role; root-caused to PostgreSQL's superuser-only restriction on disabling internally-generated FK constraint triggers; fixed via a separately-scoped `RESTORE_SUPERUSER_DATABASE_URL`, used only for that one step.
- The integrity-checker gap this same bug exposed (§8/§16): an orphan-only `reservation_events` check passed against a silently-empty table; `reservation-events-count-plausible` was added specifically to catch this class of failure, and its own dedicated test (`tests/ops/restore-and-integrity.test.ts`, "intentionally broken invariant") proves the checker now correctly reports FAIL rather than a false PASS.

---

**STOP CONDITION REACHED.** P0 database-safety correction, bounded backup/restore implementation, integrity verification, a real local recovery drill (run twice), the operational fallback/runbook, required tests, and this documentation are complete. No push. No deployment. No production infrastructure changes. No Guestplan changes. No Konnichiwa website changes. One local commit follows this report, per §29 of the assignment, only after the architecture report's own owner-decision sections are updated (§26) and final scope verification (§29) passes. Awaiting the Chief Engineer's R1.4 Final Implementation Gate.
