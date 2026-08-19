# R1_2_LOGIN_ABUSE_PROTECTION_REPORT

**Phase:** R1 — Critical Gap Closure
**Work Package:** R1.2 — Identity & Access
**Task:** Final P1 Closure — Login Abuse Protection
**Baseline commit:** `dab60f5`
**Status:** implemented, tested, awaiting Chief Engineer final R1.2 closure

---

## 1. Executive Summary

`POST /auth/login` is now protected by a PostgreSQL-backed, two-dimension (source address + normalized username) fixed-window failure counter. Exceeding either dimension's threshold returns `429 Too Many Requests` before any password verification is attempted. The limiter creates no new username-enumeration signal — every submitted username, real or not, is throttled identically, verified by a test that asserts byte-identical response bodies for a real account and a fabricated one. A successful login resets only the username dimension, deliberately not the source dimension (documented rationale below). The underlying counter write is a single atomic `INSERT ... ON CONFLICT DO UPDATE`, verified under genuine concurrent load (15 simultaneous failures against one key, zero lost updates) rather than a naive read-then-write that would have under-counted under real concurrent attack traffic. 301/301 tests pass (up from 284), plus a live smoke test against the actually-running server.

## 2. Baseline

Confirmed before any work: branch `feat/ec-002-visibility-baseline`, HEAD `dab60f5` (the R1.2 Identity & Access implementation commit), working tree clean.

## 3. Threat Model

Per the assignment: brute-force password guessing, credential stuffing, automated high-rate attempts, and targeted attacks against a known username. Explicitly out of scope and not built: CAPTCHA, WAF, Redis, permanent account lockout, IP reputation, email alerts, MFA, OAuth, passkeys (§11 of the assignment) — none of these were added. The one hard constraint carried through the whole design: **no mechanism here can lock legitimate restaurant staff out indefinitely** — every throttle is a time-bounded window, never a permanent state change to any account.

## 4. Selected Rate-Limit Model

Two independent dimensions, a request is throttled if **either** is at or past its limit (§4 of the assignment: "at least" two dimensions; this is two independent gates, not a combined score):

- **Source address** (`source:<req.ip>`): 20 failed attempts / 15 minutes (default). Catches broad, high-volume sweeps across many accounts from one origin. Deliberately looser than the username dimension — a shared office/NAT network legitimately produces bursts of unrelated staff logins, and this dimension's job is to catch volume, not precision.
- **Normalized username** (`username:<lowercase-trimmed>`): 5 failed attempts / 15 minutes (default). Catches a targeted attack against one account regardless of how distributed the source addresses are (the classic "credential stuffing from a botnet" case the source dimension alone cannot catch).

Fixed window with reset-on-expiry semantics (not a sliding window): a window's failures are discarded wholesale the moment a request arrives after the window has aged past its configured duration, rather than the count decaying continuously. Simpler to implement correctly and reason about than a sliding window, and sufficient for this threat model — the assignment did not ask for precise rate smoothing.

## 5. Storage Model

**Option B — PostgreSQL-backed — selected**, over in-memory (Option A). Per the assignment's own instruction ("the reservation app may eventually run with more than one process/instance... do not silently claim cluster-safe behavior if using process-local memory"): an in-memory limiter would need an explicit `SINGLE-INSTANCE ONLY` caveat and would silently under-protect the moment this app is ever scaled to more than one process — each instance would see only its own slice of traffic and enforce the configured limit against that slice, not the true total. PostgreSQL is already this codebase's single shared source of truth for every other piece of auth-adjacent state (`StaffSession`, `StaffUser`) — adding one more small table costs little and avoids the caveat entirely rather than documenting around it. New dependency: **none** (no Redis, per §11's explicit exclusion) — implemented as a single `LoginAttemptWindow` table via the existing Prisma/PostgreSQL stack.

**Deployment assumption, stated explicitly**: this is cluster-safe today, for any number of Node.js processes/instances that share the same PostgreSQL database (the only deployment topology this codebase currently supports or assumes — see `.env`'s single `DATABASE_URL`). It would NOT be cluster-safe if a future deployment introduced per-instance/sharded databases without a shared limiter table; no such topology exists or is planned, so this is noted as a boundary condition, not a present gap.

## 6. Username Enumeration Protection

Two independent mechanisms, both already required by this report's own tests:

1. **Uniform key application** (`application/auth/LoginThrottleGuard.ts`): every submitted username string is used as a throttle key, whether or not it resolves to a real `StaffUser`. An attacker probing a fabricated username accumulates failures identically to one probing a real account — verified by test B and test D (`tests/integration/login-abuse-protection.test.ts`), the latter asserting the 429 response body for a real, throttled account is **byte-identical** (`toEqual`) to the body for a fabricated, throttled one.
2. **Pre-existing timing mitigation, inspected and confirmed unchanged** (§9 of the assignment): `LoginHandler.ts`'s `DUMMY_HASH` verify-against-nothing-real path (built during the original R1.2 pass) already keeps "unknown username" and "wrong password" at comparable wall-clock cost. This report did not modify `LoginHandler.ts` at all — the throttle check sits entirely in front of it, and when NOT throttled, both paths reach the identical, already-timing-safe code. The one asymmetry introduced by this change — a *throttled* request returns 429 without ever reaching `LoginHandler` at all — is not a new leak: 429 is an intentional, loudly different signal ("you are being rate-limited"), never conflated with 401 in status code, body, or intended meaning, and it fires identically regardless of whether the throttled username is real.

## 7. Source Identification

`req.ip`, Express's own resolved client address. Not a custom header parse, not a raw `req.socket.remoteAddress` reimplementation — Express's built-in resolution already does the right thing for the configured trust level (§8).

## 8. Proxy Assumptions

`app.set("trust proxy", false)` — Express's own default, now made **explicit** in `api/app.ts` rather than left implicit, with an inline comment explaining why. At this setting, `req.ip` is the raw TCP peer address; `X-Forwarded-For` and similar headers are never consulted, so no caller can spoof their apparent source address. This codebase has no reverse proxy in front of it today (`api/server.ts` runs the Express process directly, serving both the static UI and the API). **Documented, not invented**: if a reverse proxy is introduced in a future deployment, `trust proxy` must be set to the exact number of trusted hops (or a trusted CIDR list) at that time — never blindly flipped to `true`/`1`, which would let any caller forge `X-Forwarded-For` and defeat the per-source dimension entirely. This is a stated production prerequisite for that future change, not a decision made here.

## 9. Counter Reset/Expiry Semantics

- **On failure**: both dimensions' counters increment (or start a fresh window, if the existing one has expired) — `LoginThrottleGuard.recordFailure()`.
- **On success**: **only** the username dimension resets (`LoginThrottleGuard.recordSuccess()`, calls `tracker.reset()` on the username key alone). The source dimension is deliberately left untouched. Rationale, stated in code and here: resetting the source dimension on any success would let one weak-password hit (from a credential-stuffing sweep touching many accounts from one origin) wipe that origin's entire accumulated suspicious-activity count, handing it a fresh budget to keep probing *other* accounts from the same source — precisely backwards for what the source dimension exists to catch. The username's own failure history, by contrast, is legitimately moot the instant its rightful owner authenticates successfully. Verified directly by a dedicated test (`tests/integration/login-abuse-protection.test.ts`, "a successful login resets the USERNAME window but not the SOURCE window").
- **On window expiry**: no explicit action needed — `isThrottled()` treats an aged-out window as not-throttled regardless of its stored count, and the next `recordFailure()` call for that key starts a fresh window rather than continuing the stale one.

## 10. Implementation Files

- `prisma/schema.prisma` / `prisma/migrations/20260819045200_login_attempt_windows/` — new `LoginAttemptWindow` model.
- `application/ports/LoginAttemptTracker.ts` — port.
- `infrastructure/persistence/PrismaLoginAttemptTracker.ts` — adapter; the atomic `$executeRaw` upsert.
- `application/auth/LoginThrottleGuard.ts` — the two-dimension policy (key derivation, combination, success/failure recording).
- `api/app.ts` — `/auth/login` route updated to check/record via `LoginThrottleGuard`; `trust proxy` explicitly set to `false`; `AppDependencies.auth.loginAttemptTracker` (required) and `.loginThrottleConfig` (optional) added.
- `api/server.ts` — wires `PrismaLoginAttemptTracker` for the real deployment.
- Test-file wiring updates (`tests/api/reservations.test.ts`, `tests/integration/identity-access.test.ts`) — added the new required dependency to their existing `AppDependencies` construction and to their table-reset helpers; no test *logic* in those files changed.

No changes to `LoginHandler.ts`, `LogoutHandler.ts`, `CreateStaffUserHandler.ts`, `StaffAuthorizationPolicy.ts`, `authMiddleware.ts`'s session/permission logic, the CSRF guard, the Owner invariant, or the bootstrap script — confirmed by `git diff` scope review before commit. This was a bounded, additive hardening change, per instruction.

## 11. Test Results

- `tests/application/login-throttle-guard.test.ts` (7, pure unit, spy tracker): key derivation/normalization, uniform application to non-existent usernames, dimension combination (either-throttles), both-dimensions-recorded-on-failure, username-only-reset-on-success.
- `tests/integration/login-abuse-protection.test.ts` (10, real PostgreSQL):
  - `PrismaLoginAttemptTracker` window mechanics: increment-within-window, reset-on-expiry, explicit `reset()`, and the concurrency test (15 simultaneous failures against one key, real PostgreSQL, zero lost updates — the atomic-upsert design decision directly validated, not just asserted).
  - HTTP-level scenarios A–E from the assignment, plus the explicit success-reset-asymmetry test: repeated wrong password eventually throttled (A), unknown username throttled identically (B), success works below threshold (C), throttled response is generic and identity-blind (D), access returns after window expiry using a `MutableClock` — no real sleeps (E).

## 12. Full Regression Results

`tsc --noEmit`: clean. Full `vitest run`: **301/301 passing** (up from the 284 baseline — 17 new tests, 0 removed, 0 weakened), 25 test files, run twice consecutively with identical results (0 flakes). Includes the full R1.1 concurrency matrix (20-iteration Modify-vs-Modify race), all CAP-D02.03 Postgres/concurrency/failure-injection/DST tests, and the R1.2 mandatory header-spoofing regression — all passing unmodified.

**Live smoke test** against the actually-running server (`npm start`, real PostgreSQL): bootstrapped a fresh Owner, sent 6 consecutive wrong-password attempts against it under the real production default config (5/15min) — first 5 returned 401, the 6th returned 429; a subsequently-*correct* password while still throttled also returned 429 (proving the block is on the login attempt itself, not merely on wrong passwords); 6 attempts against a fabricated username produced the identical 401×5/429×1 pattern; and the header-spoofing regression was re-confirmed live (spoofed `x-actor-role: Owner` headers, no session → 401).

## 13. Remaining Risks

- **P2** — Default thresholds (5/15min per username, 20/15min per source) are a reasonable starting point, not empirically tuned against this restaurant's real traffic patterns; both are marked as configurable operational policy (`LoginThrottleConfig`), not hard architecture, exactly like session lifetime was in the original R1.2 pass — revisit once real usage data exists.
- **P2** — No security-event logging of throttled/blocked attempts specifically (the pre-existing `SecurityEvent` table exists and is written to by bootstrap, but login failures/blocks are not yet logged there — this gap was already flagged in `R1_2_IDENTITY_ACCESS_IMPLEMENTATION_REPORT.md` §26 and is unchanged by this pass).
- **P3** — The `trust proxy` assumption (§8) is correct for the current, proxy-less deployment but is a real prerequisite to revisit — not a risk today, but a documented trap for whoever adds a reverse proxy later without reading this section.

## 14. R1.2 Final Closure Recommendation

**PASS.** The specific P1 named in this assignment — no abuse/rate-limit protection on `/auth/login` — is closed, tested against real concurrent load, and verified live. Combined with the prior R1.2 work (header-trust elimination, CSRF, Owner protection, the exhaustively-tested role matrix), the Identity & Access MVA's originally-identified P0 and its one P1 condition are both now closed. The remaining items flagged in the original implementation report (disable/reset HTTP endpoints, `/auth/me`, richer security-event logging) remain open, lower-severity follow-up work, not blockers to this specific closure.

## 15. Commit / Working Tree State

Reported after the commit is created — SHA and working-tree status.

---

```
LOGIN BRUTE-FORCE PROTECTION:
PASS

USERNAME ENUMERATION VIA LIMITER:
NOT OBSERVED

DISTRIBUTED/MULTI-INSTANCE SAFE:
YES (for the current single-shared-PostgreSQL-database deployment
assumption this codebase already makes everywhere else)

FULL REGRESSION:
PASS (301/301)

R1.2 FINAL CLOSURE:
PASS

PRODUCTION READY:
NO

GUESTPLAN REPLACEABLE:
NO
```
