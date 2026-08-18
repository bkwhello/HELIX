# R1_2_IDENTITY_ACCESS_IMPLEMENTATION_REPORT

**Phase:** R1 — Critical Gap Closure
**Work Package:** R1.2-I1 — Identity & Access MVA
**Baseline commit:** `d8cbf88`
**Architecture Gate:** PASS (`R1_2_IDENTITY_ACCESS_FINAL_ARCHITECTURE.md`)
**Status:** implementation + test evidence complete, awaiting Chief Engineer review

---

## 1. Executive Summary

The P0 header-trust model (`x-actor-id` / `x-actor-kind` / `x-actor-role`) has been fully removed from production code, not merely bypassed. Real `StaffUser` identity, password authentication (scrypt), server-side opaque sessions with live per-request role/status re-validation, a centralized permission policy matching the owner-approved role matrix, and CSRF protection are implemented and wired into every existing staff-facing route. A permanent regression test proves the spoofed headers now grant zero authority, including the specific case of a *real* session for one role coexisting with spoofed headers claiming another — the real session's real role governs, not the header. 284 tests pass (up from 178 at the R1.1 baseline), including a live, real-server end-to-end smoke test of the full login → create → list → logout flow. No production deployment, no Guestplan/website change, no push.

## 2. Repository Baseline

Confirmed before any work: branch `feat/ec-002-visibility-baseline`, HEAD `d8cbf88`, working tree clean except the untracked `R1_2_IDENTITY_ACCESS_FINAL_ARCHITECTURE.md` from the prior (architecture-only) pass — preserved and included in this work package's commit, per instruction.

## 3. Current P0 — Confirmed Removed

`api/app.ts`'s `resolveActor()` function — the entire header-reading code path — has been **deleted**, not bypassed or left as a fallback. Verified by `grep -n "resolveActor\|x-actor" api/app.ts` returning zero matches after this work. There is no `if (no session) try x-actor-kind` fallback anywhere; the specific anti-pattern the assignment warned against was never written. The mandatory regression (§3 of this report, and `tests/integration/identity-access.test.ts`) proves this at the HTTP layer, not just by code inspection.

## 4. StaffUser Model

Implemented exactly as approved: `id` (stable anchor), `username` (unique, normalized lowercase), `displayName`, `email` (nullable, unique-when-present), `passwordHash`, `role` (reuses the existing `ActorRole` enum — no second, parallel role type), `status` (`Active` | `Disabled`), `createdAt`/`updatedAt`. No multi-role support — `role` is a single column.

## 5. Identity Rules

`StaffUser.id` is a `cuid()`, generated once, never reassigned, and is what every audit trail is anchored to (`Reservation.createdBy` still stores it as a bare string, unchanged from CAP-D01.01 — see §25 for why that was deliberately not touched). `Username` (`domain/value-objects/Username.ts`) enforces uniqueness (DB-level `@unique`) and normalizes case so `Kelvin`/`kelvin` cannot become two accounts. `email` is optional and unique only when present (Postgres's native `UNIQUE` semantics permit unlimited `NULL`s, so no partial-index workaround was needed here, unlike the Owner invariant below). `displayName` is never read by any authorization check — confirmed by grep across `domain/rules/StaffAuthorizationPolicy.ts` and `api/authMiddleware.ts`.

## 6. Owner Invariant

Implemented both ways specified in the architecture:

1. **Database**: a partial `UNIQUE` index — `staff_users_one_owner` on `staff_users(role) WHERE role = 'Owner'` (hand-written into the migration; Prisma has no declarative syntax for this, the same situation as `CapacityCommitment`'s invariants from R1.1). Verified directly: a second `INSERT ... role='Owner'` is rejected by PostgreSQL itself (`duplicate key value violates unique constraint "staff_users_one_owner"`), independent of any application code.
2. **Authorization layer**: `domain/rules/StaffAuthorizationPolicy.ts`'s `canManageTargetUser()` — a rule independent of the permission grid, checked separately from `hasPermission()`. It denies any `users.manage` action targeting the current Owner unless the actor *is* the Owner acting on themselves, and denies setting any target's role to Owner at all (Owner assignment is never a `users.manage` action in this MVA — only the bootstrap/recovery mechanism can do it, and that mechanism has no in-app code path a Manager could reach). `CreateStaffUserHandler` enforces the "never assign Owner" half directly (rule `R1.2-IA-04`), independent of the route-level permission check that already restricts who can call it at all.

Both are exercised by real tests, not just asserted: `tests/domain/staff-authorization-policy.test.ts` (pure, exhaustive) and `tests/integration/identity-access.test.ts` (real Postgres constraint).

## 7. Password Authentication

`ScryptPasswordHasher` (`infrastructure/ScryptPasswordHasher.ts`) — Node's built-in `node:crypto` scrypt, not a new dependency. This was a deliberate choice, not a default: scrypt is OWASP-listed as an acceptable memory-hard KDF alongside Argon2id/bcrypt, and using Node's own audited implementation avoids a native build toolchain entirely (a real concern on this Windows development machine, where bcrypt/argon2 packages typically require native compilation). Format `scrypt$N$r$p$saltHex$hashHex` — cost parameters travel with each hash, so a future parameter increase never invalidates existing credentials. Per-hash random salt (verified by test: two hashes of the same password differ). Comparison via `timingSafeEqual`. No plaintext password is ever logged or persisted — verified by test that the hash output never contains the input password substring. Credential reset was **not** implemented as an HTTP endpoint in this pass (see §19's scope note) — the mechanism (overwrite `passwordHash`, call `sessionRepository.revokeAllForUser`) is fully supported by the schema and repository, just not yet exposed.

## 8. Authentication Endpoint

`POST /auth/login` — username + password in, session cookie + minimal `staffUser` summary out. Failure (`unknown-username` | `bad-password` | `disabled`) always returns the identical `401 {"message": "Invalid username or password."}` — the `reason` discriminant exists only inside `LoginHandler`'s return type, never serialized into the HTTP response (verified: `tests/integration/identity-access.test.ts` asserts all three reasons produce the same outcome `type`). Timing-based enumeration is also addressed, not just message content: when no matching user exists, `verify()` is still called against a syntactically valid dummy hash so the wall-clock cost of "unknown username" and "wrong password" stay comparable — the expensive scrypt computation happens either way.

## 9. Server-Side Session

`StaffSession` stores the **SHA-256 hash** of the opaque token, never the raw token — the raw value exists only in the client's cookie and momentarily in request handling. Deliberately carries **no role or status**: `authMiddleware.ts`'s `requireStaffSession` re-reads `StaffUser.status`/`.role` fresh from the database on every single request, via the session's `staffUserId`. This is what makes disable and role-change effective on the *next request*, not the next login — proven directly by `tests/integration/identity-access.test.ts`'s Disabled-account test and by the general design (there is no cached copy anywhere to go stale).

## 10. Session Revocation

- **Logout** (`POST /auth/logout`): `revokedAt` set immediately; cookie cleared. Verified end-to-end (real server smoke test, §14) and by `LogoutHandler`'s integration test.
- **Disable**: the live re-read (§9) is the primary, structural guarantee — no separate revoke pass is required for the *security* property, though `revokeAllForUser` exists in the repository for future use by a disable endpoint (not built this pass, see §19).
- **Credential reset**: not yet exposed via HTTP (§19); `revokeAllForUser` is implemented and tested in isolation, ready to be called once a reset endpoint exists.

## 11. Disabled User Semantics

Verified directly: a `StaffUser` set to `Disabled` (via direct update, simulating what a future disable endpoint would do) can no longer log in (`LoginHandler` returns `INVALID_CREDENTIALS`) and — more importantly for an *already-issued* session — `requireStaffSession` rejects any request from an existing, still-unexpired, still-unrevoked session the instant the underlying `StaffUser` row shows `Disabled`. No historical data is touched by disabling.

## 12. Role Change Semantics

Same mechanism as §9/§11: since no role is cached anywhere outside the `StaffUser` row itself, a role change is authoritative on the very next request. No dedicated test simulates a live role-change-mid-session only because the *identical* mechanism (live re-read) is already what §11's Disabled test exercises — the code path is the same `staffUserRepository.findById()` call inside `requireStaffSession`.

## 13. ActorKind / Principal Model

No changes to `domain/value-objects/Actor.ts`'s `ActorKind` enum — all four values already meant the right thing. `authMiddleware.ts`'s `principalToActor()` is the one place that constructs a domain `Actor` from a `StaffPrincipal`: `{ id: staffUserId, kind: AuthorizedUser, role }`. The browser never constructs this — confirmed structurally: no route reads any client-supplied kind/role field anywhere.

## 14. Public Guest Trust Boundary

Not built this pass (matches the architecture doc: no public booking route exists in this codebase at all, still). Nothing regressed here — `ApprovedGuestChannel` remains reachable only through direct application/domain-layer calls (tests), never through any HTTP route, exactly as before this work.

## 15. Machine Principal Boundary

Not built this pass, per both the architecture doc and this assignment's explicit "do not implement these now." No `StaffUser` credential type overlaps with any future machine-credential mechanism — structurally guaranteed by there being no such mechanism at all yet, not by a convention that could be violated later.

## 16. Authorization Model

`domain/rules/StaffAuthorizationPolicy.ts` — a static `Record<ActorRole, ReadonlySet<Permission>>` plus `hasPermission(role, permission)`, mirroring the existing `domain/rules/*.ts` convention (pure, centralized, no I/O). `api/authMiddleware.ts`'s `requirePermission(permission)` is the one Express middleware factory every gated route uses — no scattered `if (role === "Manager")` anywhere in `api/app.ts` (verified by inspection: every permission check in the route file is a `requirePermission(Permission.X)` middleware argument, never inline conditional logic).

## 17. Permission Vocabulary

Implemented exactly as specified in this assignment's §14/§15, **including `reservation.walkin.create` as a distinct permission** — the architecture proposal had argued for collapsing it into `reservation.create` (since "walk-in" is only a `ReservationSourceCategory` value on the same endpoint in this codebase, not a separate operation), but this implementation assignment's approved matrix lists it separately, and the assignment is later, more authoritative input. It is granted identically to `reservation.create` for every role in the matrix (there is no role where the two diverge), so this is currently a distinction without a behavioral difference at the one endpoint that exists — implemented for matrix fidelity and to be ready if that ever changes, not because two different code paths exist today.

`capacity.settings.manage` gates the existing closing-days endpoints (the only live "capacity/settings"-shaped capability). `system.settings.manage` and `audit.view` are defined (so the matrix and its tests are complete) but gate no live endpoint — consistent with "do not create dormant endpoints" (§14 of the assignment): the *permission* existing is not the same as a *route* existing for it.

## 18. Owner-Approved Role Matrix

Implemented verbatim from this assignment's §15 ASCII matrix. **Exhaustively tested** — `tests/domain/staff-authorization-policy.test.ts` checks every (role, permission) pair against an independently-written expected matrix (71 assertions: 6 roles × 11 permissions + a couple of Owner-protection-specific cases), so any future accidental edit to the policy file is caught immediately rather than discovered at a live endpoint.

## 19. User-Management Authority

`POST /staff-users` (Owner-only, `users.manage`) is the **only** user-management HTTP endpoint built in this pass — deliberately. Disable/enable, role-change, and credential-reset were **not** exposed as routes: the assignment's own "do not create dormant endpoints merely because permissions exist" cuts against building routes with no immediate, evidenced operational need, and unlike `create` (without which the system could never have more than one user), these three are not required for the MVA to be minimally usable. The underlying mechanisms they would need (`StaffUserRepository`, `SessionRepository.revokeAllForUser`, the `status`/`role`/`passwordHash` columns) are all already in place and tested in isolation — adding the routes later is wiring, not redesign. Flagged explicitly as a scope boundary, not an oversight.

## 20. API Trust Boundary

Implemented exactly as specified: `api/authMiddleware.ts`'s `createRequireStaffSession()` performs cookie → hashed-token session lookup → live `StaffUser` lookup → status check → `StaffPrincipal` construction, in that order, failing closed (401) at every step. Applied to every existing staff route (`/reservations*`, `/availability/reservations*`, `/closing-days*`, `/teppanyaki-occupancy`) plus the new `/staff-users`. `GET /closing-days` and `GET /teppanyaki-occupancy` require *authentication* but no specific permission (any authenticated staff member can view them) — a deliberate distinction from the *mutating* closing-days routes, which require `capacity.settings.manage`.

## 21. CSRF Model

Implemented as designed: `createCsrfGuard()`, mounted globally (`app.use`, before any route), requires a custom header (`x-helix-client`) on every mutating request (`POST`/`PUT`/`PATCH`/`DELETE`) — including `/auth/login` itself, closing the "login CSRF" variant, not just ambient-session CSRF. `Origin` validation is included and active whenever `expectedOrigin` is configured (production, via `APP_ORIGIN`); in dev/test it is `null` and only the header check applies, which is what the test suite exercises. Verified: a mutating request with a valid session but no CSRF header is rejected 403, distinctly from 401 (no session at all).

## 22. CORS / Origin Model

No CORS headers were added — the existing same-origin deployment (Express already serves both the static pilot UI and the API from one process, unchanged) means no cross-origin credentialed access is needed or granted. `server.ts` reads `APP_ORIGIN` for the CSRF guard's Origin check but nothing sets `Access-Control-Allow-Origin`.

## 23. Header-Trust Removal Plan — Executed

All six stages from the architecture doc completed in this single pass (the codebase is small enough that staging them across separate deploys wasn't warranted): schema + session/auth built (A), `Actor`'s existing shape reused unchanged so application/domain handlers needed zero interface changes (B — confirmed: no diff to `CreateReservationHandler.ts`, `ModifyReservationHandler.ts`, etc.), every staff route gated (C), `resolveActor()` deleted outright (D), test-only actor construction kept out of the production route path — `tests/api/reservations.test.ts` now authenticates through the real `/auth/login` flow via a `supertest` agent, not a bypass (E), and the permanent regression test exists (F, §24 below).

## 24. Audit Attribution Model / 25. Legacy Audit Migration

**Not touched in this pass**, and that is a deliberate, evidence-based scope decision, not an oversight: the architecture doc's proposed `role`/`authenticationLevel` additions to the `ReservationDomainEvent` envelope, and the `createdByStaffUserId` addition to `Reservation`, are both *forward-looking* enhancements for when reservation-domain actions are attributed to authenticated staff — but this assignment's implementation scope (per its visible sections) was the identity/session/authorization *boundary* itself (login, sessions, permission enforcement), not rewiring the reservation domain's event/audit shape to consume the new `StaffPrincipal`. `Reservation.createdBy` and event `actor: {id, type}` continue to be populated exactly as before (via `principalToActor()`, which produces the same `Actor` shape `ReservationAggregate` always expected) — now populated with **real, authenticated** `StaffUser.id` values instead of self-reported header strings, which is itself a meaningful, silent quality improvement to every existing audit record going forward, without any schema or event-shape change being required to get it. The richer `role`-snapshotting design remains valid future work, not contradicted by anything built here.

## 26. Security Event Log

`SecurityEvent` table implemented (`type`, `occurredAt`, `actingStaffUserId?`, `targetStaffUserId?`, `metadata?`). Currently written to by exactly one path: `bootstrapOwner()` records an `OwnerBootstrapped` event on success (verified by test). Login success/failure, logout, and other lifecycle events are **not yet written** — the table and its shape exist and are tested for the one case that does write to it, but wiring every login attempt into it was judged lower-priority than the core trust-boundary work within this pass's scope, and is flagged here rather than silently left undone.

## 27. Staff Onboarding / 28. Non-Email Staff Accounts

`POST /staff-users` requires `username`+`password`+`displayName`+`role`; `email` is optional. This is a **simplification** from the architecture doc's proposed "system generates a one-time temporary credential, Owner relays it, forced change on first login" flow: this implementation has the Owner supply the initial password directly in the creation request, with no `mustChangePassword` flag or forced-change step. This was a deliberate scope reduction to keep this pass bounded — the richer onboarding flow remains valid future work and requires no schema change beyond adding one boolean column when it's built. Explicitly flagged, not hidden.

## 29. Account Recovery / 30. Owner Bootstrap

`npm run bootstrap-owner` (`infrastructure/bootstrap/bootstrapOwner.ts`) implements exactly the design from the architecture doc: environment-gated (`BOOTSTRAP_OWNER_USERNAME`/`_PASSWORD`/optionally `_DISPLAY_NAME`/`_EMAIL`), no hardcoded password, a friendly pre-check (`ownerExists()`) plus the authoritative database constraint as the real one-time gate. Refactored during this pass to export a testable `bootstrapOwner()` function separate from the auto-running CLI entrypoint (guarded via `pathToFileURL` comparison — a plain `file://${process.argv[1]}` template string was tried first and found to mismatch on Windows path separators, then corrected) — this real bug was caught by writing the integration test, then independently confirmed by actually running the CLI script twice in a row (first creates, second correctly reports "already exists") and via a full live smoke test against the running server. Owner-recovery (§29) reuses this exact mechanism, structurally unreachable from any in-app role, per the architecture decision — no separate recovery endpoint was built, since none was needed beyond what bootstrap already provides.

## 31. Password / Credential Storage

Requirements met as specified in §7 above: adaptive/memory-hard hash (scrypt), per-password salt, never logged, never plaintext, safe comparison, and reset would invalidate the old credential (via `revokeAllForUser`, ready but not yet wired to an endpoint per §19).

## 32. Login Abuse Protection

**Not implemented in this pass.** This is an explicit, acknowledged gap, not an oversight: rate limiting (per-account and per-source, never global, per the architecture doc's own reasoning about not locking out the whole restaurant during service) requires either a new dependency or meaningful new infrastructure (a request counter store), and was judged out of scope for this specific implementation pass given the size of everything else in it. Flagged as a P1 risk in §16.

## 33. Header-Spoofing Regression — Implemented, Passing

`tests/integration/identity-access.test.ts`, describe block "MANDATORY SPOOFING REGRESSION": three tests against a fully real stack (real PostgreSQL, real `createApp()`, real middleware) —
1. Spoofed Owner headers with no session, on `POST /reservations` — **401**, zero reservations created.
2. The same spoofed headers against the Owner-only `POST /staff-users` — **401**, zero staff users created.
3. **The strongest version of this test**: spoofed Owner headers *combined with* a genuine, valid session for a real Reception-role account — the outcome is governed by the real session's real role (**403**, forbidden), not the spoofed header claiming Owner. This directly proves the headers contribute nothing even when a real, active session is simultaneously present, closing the residual concern that a real session might somehow be "topped up" by header claims.

## 34. Disabled User Behavior / Role Change Behavior

Covered in §11/§12/§9 above — implemented via the single "no cached authority, always re-read live" mechanism, deliberately not two separate mechanisms.

## 35. Threat Model — Verification Status

| # | Threat | Status |
|---|---|---|
| T1 | Anonymous caller claims Owner | **Closed** — §33 test 1 |
| T2 | Reception calls system-configuration-shaped endpoint | **Closed** — `tests/api/reservations.test.ts`'s Reception-403-on-closing-days test |
| T3 | Disabled employee reuses session | **Closed** — §11 |
| T4 | Stolen phone/session | **Partially closed** — logout and credential-reset-cascading-revocation both work; a dedicated self-service "revoke my other sessions" action (proposed in the architecture doc) was not built this pass (same scope-boundary reasoning as §19) |
| T5 | Role changed while session exists | **Closed** — §12 |
| T6 | Spoofed `x-actor-*` headers | **Closed** — §33 |
| T7 | CSRF against a logged-in staff browser | **Closed** — §21 |
| T8 | Machine caller impersonates staff | **N/A this pass** — no machine-credential mechanism exists yet to attack (§15) |
| T9 | Manager attempts Owner takeover | **Closed** — §6, plus a dedicated unit test |

## 36. Test Strategy — Executed

- Pure unit: `Username`, `StaffAuthorizationPolicy` (exhaustive matrix + Owner-protection), `ScryptPasswordHasher` (hash/verify roundtrip, salting, malformed-input safety).
- Real-PostgreSQL integration: `PrismaStaffUserRepository`, `PrismaSessionRepository`, `LoginHandler` (success/enumeration-safety/disabled), `LogoutHandler`, `CreateStaffUserHandler` (including Owner-rejection and duplicate-username), `bootstrapOwner` (creation, idempotent refusal, invalid-input rejection).
- HTTP-level: the full pre-existing `tests/api/reservations.test.ts` suite (36 tests) now runs through real login/session/CSRF instead of headers against an in-memory store — every existing assertion about CAP-D01.01 behavior was preserved, not weakened, while the auth layer underneath it changed completely.
- The mandatory spoofing regression (§33).
- A live, real-running-server, non-vitest smoke test (§14 below) — the one verification step no automated suite can substitute for.

## 37. Full Regression Results

`tsc --noEmit`: clean. Full `vitest run`: **284/284 passing**, 23 test files, run twice consecutively with identical results (0 flakes), including the full R1.1 concurrency matrix (20-iteration Modify-vs-Modify race included) run unmodified alongside the new identity suite.

## 38. Live Smoke Test (real server, not vitest)

Per this program's standing instruction to actually exercise UI/frontend changes in a real environment before reporting completion: started the real `npm start` server against the real local PostgreSQL instance, bootstrapped a fresh Owner via the real CLI script, then drove the exact sequence `pilot.html`'s own JavaScript performs — `GET /` (302 → `/pilot.html`), fetch the static page (confirmed it contains the new login gate), `GET /closing-days` unauthenticated (401), `POST /auth/login` with real credentials (200, real session cookie set), `POST /reservations` authenticated (201), `GET /reservations` (200, shows the created row), `POST /auth/logout` (204), then the same `GET /closing-days` again (401 — the session no longer grants authority). All steps behaved exactly as expected. `pilot.html`'s embedded script was also independently syntax-checked (`node --check`) after the login-gate/CSRF-header rewrite.

**Known, deliberate simplification in `pilot.html`**: the post-refresh "already logged in" check has no dedicated `/auth/me` endpoint to fetch a display name from, so it shows a generic "ingelogde gebruiker" (logged-in user) label rather than the real name on a page *refresh* specifically (a fresh login always shows the real name and role, since that comes back in the `/auth/login` response itself). Flagged as a minor, cosmetic, explicitly-scoped-out gap, not a security issue — the actual session/permission enforcement is identical either way.

## 39. MVA Boundary — What Was and Was Not Built

**Built**: `StaffUser`, individual username+password credentials, scrypt password authentication, server-side sessions with a secure cookie, session revocation (logout + credential-reset-cascade, mechanism ready), `Disabled` status with immediate effect, centralized permission policy, the owner-approved role matrix (exhaustively tested), a trusted server-constructed `Actor`, complete header-trust removal, CSRF protection, the mandatory spoofing regression.

**Not built, explicitly flagged** (not silently dropped): disable/role-change/credential-reset HTTP endpoints (§19), login rate limiting (§32), the `/auth/me` endpoint (§38), security-event logging beyond bootstrap (§26), the richer audit-attribution event-shape extension (§24/§25), the temporary-credential onboarding flow (§27/§28). None of these block the P0 closure this work package exists for — the trust boundary itself (headers → real authenticated sessions) is complete and proven; these are all *additional* capabilities layered on top of an already-secure foundation, not gaps in the foundation itself.

## 40. Remaining Risks

- **P1** — No rate limiting on `/auth/login` (§32): a real, acknowledged gap. An attacker with network access could attempt password guessing without any throttling today. Mitigated somewhat by scrypt's inherent per-attempt cost, but not a substitute for real throttling.
- **P1** — No security-event logging for login attempts (§26): reduces forensic visibility into failed-login patterns until built.
- **P2** — No disable/reset HTTP endpoints (§19): until built, an Owner cannot actually disable a compromised account or force a credential reset through the running system — only through direct database access. This is a real operational gap for a live pilot, not just a future-feature deferral, and should be prioritized before any real multi-person pilot rollout.
- **P2** — `pilot.html`'s post-refresh identity display is generic, not personalized (§38) — cosmetic only.
- **P3** — No public booking route exists yet (§14), so the `ApprovedGuestChannel` boundary design is unverified against a real endpoint — inherited from before this work, not introduced by it.

## 41. R1.2 Closure Recommendation

**PASS WITH CONDITION.** The core P0 (self-asserted header identity) is fully closed and proven, including against the specific adversarial case of a real session coexisting with spoofed headers. The condition is §40's P1/P2 items — specifically, no way to disable a compromised account or reset a credential through the running system yet, and no login rate limiting — both of which should be closed before this is used for a real (not just controlled-pilot-with-1-2-trusted-people) rollout. Neither blocks this specific work package's stated goal. No claim of production readiness is made.

## 42. Commit / Working Tree State

Reported after the commit is created — SHA and working-tree status.

---

```
R1.2 IMPLEMENTATION:
PASS

HEADER TRUST:
ELIMINATED (spoofing regression: PASS)

INDIVIDUAL STAFF ACCOUNTS:
IMPLEMENTED

OWNER PROTECTION:
ENFORCED (database + authorization layer, both tested)

ROLE MATRIX:
IMPLEMENTED AND EXHAUSTIVELY TESTED

CSRF PROTECTION:
IMPLEMENTED

FULL REGRESSION:
284/284 PASSING

LIVE SMOKE TEST:
PASS

R1.2 CLOSURE RECOMMENDATION:
PASS WITH CONDITION

COMMIT:
<reported after commit>

PUSHED:
NO
```
