# R1_2_IDENTITY_ACCESS_FINAL_ARCHITECTURE

**Phase:** R1 — Critical Gap Closure
**Work Package:** R1.2 — Identity & Access
**Task:** Final Architecture Revision after Owner Input
**Mode:** Architecture only. No implementation in this pass.
**Baseline commit:** `d8cbf88`
**Status:** architecture proposal, awaiting Chief Engineer R1.2 Final Architecture Gate

---

## 1. Executive Summary

The current trust model (`x-actor-id` / `x-actor-kind` / `x-actor-role` HTTP headers, self-reported, unverified) is confirmed unsafe and must provide **zero production authority** in the target architecture. This document specifies a complete replacement: individual `StaffUser` accounts (username + password, email optional), server-side opaque sessions with **live per-request re-validation** of role/status (no cached authority in the session), a centralized static role→permission policy, an explicit and previously-incorrect-in-the-prior-proposal separation between authenticated staff and anonymous public callers, a legacy-safe audit evolution that never rewrites history, and a header-trust removal plan that ends with a permanent spoofing regression test. No new *business* capability (override, capacity administration, etc.) is introduced — this is security infrastructure for existing operations only, per the assignment's explicit restriction. No code, schema, or dependency changes were made in this pass.

## 2. Repository Baseline

Branch `feat/ec-002-visibility-baseline`, HEAD `d8cbf88` (the R1.1 Modify-vs-Modify P0 fix — matches "Previous Gate: R1.1 — PASS" from the prior work package), working tree clean before this document was written. No pull/rebase/merge/branch-switch/push performed. This document is written to disk but **not committed** — commit was not requested or authorized for this architecture-only pass (contrast with R1.1's assignments, which explicitly authorized a commit conditional on passing tests; this one does not).

## 3. Owner-Confirmed Operating Inputs

Treated as authoritative for this design, verbatim from the assignment: individual accounts required (no shared devices, no shared Manager login); email optional and never mandatory or sole-identifier; six named roles (Owner, Manager, Assistant Manager, Supervisor, Reservation Agent, Reception) with the capability lists given in the assignment's §2. No fabricated rules were added beyond what was stated or resolvable from it (see §18 for exactly which matrix cells are evidence-resolved versus genuinely open).

## 4. Current P0 Trust Model (reconfirmed evidence)

From the prior investigation (`api/app.ts:135-148`, `resolveActor()`), reconfirmed unchanged at this baseline:

- `x-actor-kind` absent entirely → defaults to `ActorKind.AuthorizedUser` (the *most* trusted kind, not least-privilege).
- `x-actor-role` has **no validation at all** against known `ActorRole` values — cast straight through. `curl ... -H "x-actor-role: Owner"` on any route sets `actor.role = "Owner"` with no check.
- `actor.id` is a free-text string with no referential integrity to any identity record (none exists).
- Every authorization check in the domain layer except one (`isAuthorizedToOverride`) reads `actor.kind` only, never `actor.role` — confirmed by exhaustive grep across `domain/rules/*.ts` and `application/availability/AvailabilityOrchestrator.ts`.
- `checkOverrideRules` (the one role-based check) has no caller anywhere outside its own test — dormant, not reachable via any route.
- No route in `api/app.ts` distinguishes a "staff" caller from a "public/guest" caller today — everything (`/reservations`, `/availability/reservations`, `/closing-days`) goes through the same unauthenticated `resolveActor()`. There is currently no public-facing booking surface at all; `ApprovedGuestChannel` is a modeled-but-never-actually-reachable kind in production, the same category as the dormant override logic.
- `public/pilot.html:443-446` confirms the actual UI sends `x-actor-id` from a free-text browser field and hardcodes `x-actor-kind: AuthorizedUser`; it never sends `x-actor-role` at all.
- `package.json` has zero authentication-related dependencies. `.env.example` has only `DATABASE_URL`. No user table, no credential storage, anywhere.

This is the complete, evidence-based P0 this architecture exists to close.

## 5. StaffUser Model

```
StaffUser
  id              stable identity anchor (see §6) — never reused, never reassigned
  username        unique (case-insensitive, stored normalized), MAY change
  displayName     MAY change
  email           OPTIONAL, unique when present, MAY change — never required, never sole identifier
  passwordHash    see §8/§29
  mustChangePassword  boolean — true after onboarding/reset until the user sets their own password
  role            single enum value (see below) — NOT a join table
  status          Active | Disabled
  createdAt
  updatedAt
```

**Role is a single column, not many-to-many.** Owner input is explicit: each staff member holds one operational role at a time, and no multi-role requirement was stated or evidenced. A join table would be unjustified complexity — rejected per the assignment's own instruction.

**No `Invited`/`Pending` status.** The chosen onboarding flow (§27) makes a `StaffUser` immediately usable the moment it is created (temporary credential, `mustChangePassword = true`) — there is no intermediate "not yet activated" state that a third status would need to represent. `Active` / `Disabled` is sufficient.

**Owner is a role value, not a separate concept — but structurally protected two ways** (resolving §19's requirement that Manager can never touch the Owner account):
1. **Database invariant**: a partial unique index — `UNIQUE(role) WHERE role = 'Owner'` — guarantees at most one `StaffUser` ever holds the Owner role at a time. This directly reuses the exact pattern already established in this codebase for `CapacityCommitment` (`R1_1_CONCURRENT_MODIFY_FIX_REPORT.md` §7, "at most one Committed commitment per reservation") — the same structural technique, applied to a different invariant.
2. **Authorization invariant** (not a database constraint — a rule in the centralized policy, §16): no principal may modify, disable, or reset the credential of a `StaffUser` whose *current* role is Owner, except the Owner acting on their own account. Reassigning the Owner role at all is explicitly **excluded from `users.manage`** in this MVA — it is not a self-service admin action for anyone, Owner included, via the normal API (see §19).

## 6. Stable Identity

`StaffUser.id` is the sole identity anchor for audit attribution — immutable, never derived from or dependent on `username`/`email`/`displayName`, all three of which the owner confirmed may change. Generated the same way every other entity id in this codebase already is (Prisma `@default(cuid())`), for consistency, not because anything about identity specifically requires it.

## 7. Login Identifier Model

Evaluated against the owner's explicit constraints (works without email, works well on personal phones, supports recovery, no shared credentials, no unnecessary external dependency):

- **Option B (email OR username)** rejected: adds a branching login path for a convenience the owner didn't require, and does not remove the need for username support anyway (some staff have none) — pure added complexity.
- **Option C (passkey hybrid)** rejected: WebAuthn/passkey infrastructure is exactly the kind of external/device-management dependency §36 explicitly excludes absent evidence of need. Excessive for six roles and a small staff count.
- **Option A (username + password), uniformly for every staff member** — **selected.** One login mechanism, no branching, no external dependency, works identically for staff with or without email. Email, when present, is captured as optional profile metadata only (not load-bearing for login or recovery in this MVA — see §28 for why self-service email recovery was deliberately *not* built either, keeping the model genuinely uniform).

Username uniqueness is enforced on a normalized (lowercased) value to avoid `Kelvin`/`kelvin` collisions/confusion.

## 8. Authentication Model

Password-based, confirmed plausible per the assignment, re-evaluated and retained. Requirements (architectural, not implementation-library-specific per §29):
- Modern, adaptive, memory-hard one-way hashing (category-level: the Argon2/bcrypt family is the current ecosystem norm — specific library selection deferred to implementation planning, per instruction).
- One hash per user, unique per-password salting (inherent to the hash format itself for both named families).
- Secure reset/recovery — §28.
- Login rate limiting — §30.
- **Account enumeration protection**: login failure returns the identical response (status code, body shape, and — as far as practical — timing) whether the username does not exist or the password is wrong. The two failure modes must be indistinguishable to the caller.
- Disabled-account login attempts are rejected unconditionally, before or regardless of password correctness, and logged (§25).

## 9. Session Model

Server-side opaque session, per the assignment's preferred target:

```
StaffSession
  sessionId    opaque, cryptographically random — NOT a JWT or any self-contained/signed token
  staffUserId  FK → StaffUser.id
  createdAt
  expiresAt
  revokedAt?   nullable
```

Cookie: `HttpOnly`, `Secure`, **`SameSite=Lax`** (a deliberate choice, not the assignment's only example — `Strict` would drop the cookie on a top-level navigation arriving from outside the app, e.g. a staff member opening a shared link from WhatsApp/Slack into the app, forcing an unnecessary re-login; `Lax` still withholds the cookie from cross-site POST/PUT/PATCH/DELETE, which is what actually matters for the mutating endpoints this system has — see §20 for why this is not relied on alone).

**Deliberately no role or status copied into the session record.** The opaque-session design already requires a server-side lookup on every request (that is the whole point of choosing opaque over self-contained tokens) — so the natural, zero-extra-mechanism answer to "how does a role change or disable take effect immediately" (§9's own requirement, and §34) is: **every request re-reads the current `StaffUser.status` and `.role` live, via the same lookup that resolves the session.** No session-version-number or cache-invalidation scheme is needed, because nothing is ever cached in the first place — the cost of a live read is already being paid by the opaque-session choice. This is the simplest correct answer, not the addition of a second mechanism on top of a first.

## 10. Session Revocation

- **Logout**: `revokedAt` set immediately on that session; cookie cleared client-side. Immediate effect (the row is gone from the "valid" set on the very next lookup).
- **Disable `StaffUser`**: the live per-request status re-read (§9) rejects the session on its next use regardless of `revokedAt` — this is the primary, structural guarantee, not a cleanup step. As a secondary, explicit action (audit clarity, not security-load-bearing), all of that user's active sessions are also marked `revokedAt` at disable time.
- **Credential reset**: **always** revokes all existing sessions for that user, unconditionally (not "optionally," diverging slightly from the assignment's own softer wording — a reset is frequently a response to suspected compromise, so leaving prior sessions alive defeats the purpose; there is no legitimate case for keeping an old session alive across a password change).
- **Self-service "log out my other sessions"** (proposed addition, not in the original list but a natural, cheap fit for T4 in §35): a StaffUser can revoke all of *their own* sessions except the current one — the smallest possible answer to "lost phone" that requires no device-management UI at all, just an extra button next to logout.

## 11. Disabled User Semantics

Required invariant, restated precisely: `status = Disabled` means (a) login is rejected unconditionally, (b) any existing session for that user fails its live status check on the very next request (§9 — no waiting for expiry or a separate revoke pass), (c) historical audit rows referencing that user's id remain exactly as they were — disabling never touches or hides history (see §24/§25).

## 12. Role Change Semantics

Required invariant: a role change (e.g. Manager → Reception) affects the *next* authorization decision, not the next login. Guaranteed by the same mechanism as §9/§11: role is read live from `StaffUser` on every request, never cached in the session. There is no token to wait out.

## 13. ActorKind / Principal Model

Preserved exactly as the assignment specifies, and it requires **no change to the existing `ActorKind` enum** (`domain/value-objects/Actor.ts`) — all four values already exist and already mean the right thing; only *who is allowed to assert them* changes:

```
StaffPrincipal          → ActorKind.AuthorizedUser        (server-constructed from a valid session)
PublicBookingPrincipal  → ActorKind.ApprovedGuestChannel   (server-constructed by the endpoint itself — §14)
IntegrationPrincipal    → ActorKind.ApprovedIntegration    (server-constructed from a machine credential — §15)
AutomatedPrincipal      → ActorKind.ApprovedAutomatedProcess
```

`ActorKind` is never read from `x-actor-kind` in production after header-trust removal (§23). The browser never asserts a kind; the server derives one from whatever it actually verified.

## 14. Public Guest Trust Boundary (correction from the prior proposal)

The prior architecture pass's phrasing risked implying an anonymous caller *is* an `ApprovedGuestChannel`. Corrected here: **an anonymous browser is not itself trusted with anything.** The flow is:

```
anonymous browser
  → a specific, server-defined public booking ROUTE
    → that route's own handler constructs a PublicBookingPrincipal,
      scoped ONLY to what that route needs (e.g. create-only, subject
      to CAP-D02.03's booking-policy restrictions — party size 1-8,
      same-day cutoff — which the client cannot opt out of by claiming
      to be staff)
    → the client never supplies, and the server never reads, any
      client-asserted kind for this path
```

The endpoint's own code is the trust boundary, not a header. As noted in §4, no such route exists yet in this codebase — `ApprovedGuestChannel` and CAP-D02.03's booking-policy guest restrictions are currently unreachable in production the same way `OverrideRules` is. Building the actual public route is out of scope for R1.2 (it is a *different* capability — public booking — not identity infrastructure); this section defines the boundary so that whenever that route is built, it is built correctly from the start rather than inheriting the header-trust pattern.

## 15. Machine Principal Boundary

Not implemented now, per the assignment. Architecturally reserved: `IntegrationPrincipal`/`AutomatedPrincipal` will authenticate via a credential type **structurally distinct from `StaffUser` passwords** — an API credential, a signed request, or an OAuth client-credentials grant (mechanism choice deferred to when a real integration, e.g. TheFork, is actually being built). The one hard rule fixed now, because it constrains today's design: **no machine caller is ever issued a `StaffSession` or a `StaffUser` row.** Machine and human authentication are separate systems from the start, not a shared one later split apart.

## 16. Authorization Model

**Model B — centralized static permission policy — selected.** Model A (scattered `if (user.role === "Manager")` checks) is explicitly rejected: this codebase's own existing style (`domain/rules/*.ts` — pure, centralized, testable rule functions, one file per concern) already demonstrates the alternative works well here, and scattering role checks across route handlers would be a step backward from that pattern, not forward. Model C (DB-configurable permissions) and Model D (ABAC/policy engine) are both excessive for six fixed, owner-named roles with no evidence of needing runtime reconfiguration — rejected as premature.

Shape (architecture only — no code in this pass):
```
Permission (enum/string union — see §17)
ROLE_PERMISSIONS: Record<StaffRole, ReadonlySet<Permission>>   -- one static map, centrally defined
authorize(principal: StaffPrincipal, permission: Permission): boolean   -- pure function
```
Plus the one cross-cutting invariant that is *not* expressible as a simple permission grant/deny (§5, §19): the Owner-protection rule, checked independently of the permission map for any operation that targets another `StaffUser`.

This mirrors the existing `domain/rules/AuthorizationRules.ts` / `OverrideRules.ts` pattern closely enough that it should live alongside them (e.g. a new `domain/rules/StaffAuthorizationPolicy.ts` or an `application/authorization/` module — exact placement is an implementation-planning decision, not an architectural one).

## 17. Permission Vocabulary

Operation-based, not page-based, per instruction:

```
reservation.view
reservation.create
reservation.modify
reservation.cancel
reservation.confirm
reservation.complete

capacity.settings.manage     -- maps to the EXISTING closing-days endpoints
                                 (POST/DELETE /closing-days) — the only
                                 currently-live "capacity/settings"-shaped
                                 admin capability. CAP-D02.03's pool
                                 capacities/durations are hardcoded
                                 application config today, not a runtime
                                 capability — nothing else exists yet for
                                 this permission to gate.
system.settings.manage       -- no live endpoint exists for this AT ALL
                                 today. Named because the owner's own
                                 role description names it as an Owner
                                 capability; reserved for when such a
                                 feature is built, gating nothing yet.
users.manage                 -- new, but this is Identity & Access's OWN
                                 necessary self-management (StaffUser
                                 CRUD), not a reservation business
                                 capability — explicitly not the kind of
                                 expansion §3 forbids.
audit.view                   -- no live endpoint exists for this today
                                 either (no route currently exposes event
                                 history) — same "named, not yet live"
                                 status as system.settings.manage.
```

**`reservation.walkin.create` is deliberately NOT a separate permission.** Evidence: `ReservationSourceCategory.WalkIn` (`domain/value-objects/ReservationSource.ts`) is a source-category *value* on the same, single `POST /reservations` (and `POST /availability/reservations`) create operation — there is no separate walk-in endpoint or code path in this codebase. Every role in the owner's matrix that can create reservations at all is also described as able to create walk-ins (Reservation Agent's line is hedged — see §18 — but not withheld). Introducing a second permission for what is, in the current implementation, the same operation with a different field value would violate §17's own instruction not to create permissions for capabilities that don't exist as distinct operations. If a future need arises to let someone create phone reservations but not walk-ins (or vice versa), that would justify splitting this then, with real evidence — not now.

No permission was created for `override.*` — per §3, dormant override logic stays dormant; it is not part of this vocabulary.

## 18. Owner-Approved Role Matrix

| Permission | Owner | Manager | Assistant Manager | Supervisor | Reservation Agent | Reception |
|---|---|---|---|---|---|---|
| reservation.view | YES | YES | YES | YES | YES | YES |
| reservation.create | YES | YES | YES | YES | YES | YES |
| reservation.modify | YES | YES | YES | YES | YES | YES |
| reservation.cancel | YES | YES | YES | YES | YES | YES |
| reservation.confirm | YES | YES | YES | YES | YES | YES |
| reservation.complete | YES | YES | YES | YES | **NO** | **NO** |
| (walk-in creation — not a separate permission, see §17) | YES | YES | YES | YES | YES (owner-conditional*) | YES |
| capacity.settings.manage | YES | YES | NO | NO | NO | NO |
| system.settings.manage | YES | NO | NO | NO | NO | NO |
| users.manage | YES | **NO** | NO | NO | NO | NO |
| audit.view | YES | YES | `OWNER INPUT REQUIRED` | `OWNER INPUT REQUIRED` | NO | NO |

**`reservation.complete` = NO for Reservation Agent and Reception — evidence, not assumption.** The owner's descriptions for these two roles are itemized lists (not "all reservation operations," which is the phrasing used for Manager/Assistant Manager), and both lists stop at confirm/cancel — "complete" is conspicuously absent from both, while it is explicitly present for Supervisor's equally itemized list. Two independent omissions in itemized (not summary) lists is treated as a real signal, not a gap.

**`users.manage` = NO for Manager — resolved via the assignment's own tie-breaker.** The owner's Manager description omits "manage users" entirely (Owner's description is the only one that states it), and §19 explicitly instructs "prefer least privilege unless owner evidence says otherwise." No evidence says otherwise here.

*Reservation Agent walk-in creation: the owner's own text is "if consistent with the existing operational flow" — a conditional the owner stated, not one this document invented. No evidence of an operational inconsistency was found; recommended default is YES, with the condition preserved verbatim for the Chief Engineer's awareness rather than silently resolved away.

**Two cells are marked `OWNER INPUT REQUIRED` and left that way deliberately**: neither Assistant Manager's nor Supervisor's owner description mentions audit visibility in either direction, and — unlike the Manager/users.manage case — there is no explicit Owner-side statement to contrast against that makes silence meaningful here. Per this program's standing rule, these are marked open rather than resolved by assumption. Recommended interim default until answered: **NO** (least privilege), consistent with §19.

## 19. User-Management Authority

`users.manage` for MVA is: create `StaffUser`, disable/enable `StaffUser`, change `StaffUser.role`, reset `StaffUser.passwordHash` (issuing a new temporary credential, §27/§28). Per §18's matrix (owner-evidence-resolved): **Owner only** in this MVA. This is the smallest, least-privilege answer consistent with the owner's own description, and it structurally satisfies the explicit prohibition on Manager touching the Owner account almost by itself — since Manager has no `users.manage` grant at all, there is no path through the permission system for a Manager to reach *any* user-management action, Owner-targeted or otherwise.

**Owner protection, made explicit and independent of the permission grant** (§5, §16): even for the one principal who *does* hold `users.manage` (Owner), and even if `users.manage` were ever extended to another role in the future, the following are hard-coded invariants in the authorization layer, not permission-grid entries that could be misconfigured away:
- No principal other than the Owner themselves may modify, disable, or reset the credential of the `StaffUser` currently holding the Owner role.
- No `users.manage` action may *set* a user's role to Owner. Owner reassignment is not a self-service admin action in this MVA at all (there is exactly one Owner, enforced by the database invariant in §5; changing who holds it is rare and sensitive enough to be deliberately excluded from the ordinary API surface, not merely gated behind a permission).

## 20. CSRF Model

**Not relying on `SameSite=Lax` alone**, per the assignment's explicit requirement for analysis. Selected: **Option C, refined — `SameSite=Lax` cookie + a mandatory custom request header + explicit `Origin` validation**, for a same-origin deployment (§21).

Reasoning: `SameSite=Lax` already withholds the cookie from cross-site `POST`/`PUT`/`PATCH`/`DELETE` (the methods this API actually mutates with), which handles the majority case. The residual concern the assignment flags — not relying on that alone — is addressed by requiring every mutating request to carry a custom header (e.g. `X-Helix-Client`) and validating the `Origin` header matches the expected same-origin value server-side. A cross-site request cannot set an arbitrary custom header without triggering a CORS preflight, which the server (correctly configured per §21 to not grant cross-origin credentialed access) will refuse — so the browser never even sends the real mutating request. This is chosen over Option A/B (synchronizer or double-submit tokens) because those require issuing, storing, and comparing a token value — real additional state and failure modes — for a same-origin deployment where the header+Origin approach is simpler and equally effective. **If the deployment ever splits into separate frontend/API origins, this decision should be revisited toward a token-based approach**, since the header+Origin defense leans on CORS being configured correctly, which is a stronger assumption across separate origins than within one.

Public/anonymous booking flow (§14, not yet built) has a different abuse model (bot/spam prevention, rate limiting) — explicitly not conflated with authenticated-staff CSRF here, per instruction.

## 21. CORS / Origin Model

Current and recommended deployment assumption: **same-origin.** `api/app.ts` already serves the static pilot UI (`express.static(publicDir)`) from the same Express process/origin as the API — this is the existing pattern, not a proposed change. Recommendation: **no CORS grant for credentialed requests from any other origin.** No `Access-Control-Allow-Origin: *` anywhere on authenticated routes (the assignment's own explicit prohibition, and it would also defeat §20's CSRF model). If a separate frontend origin is ever introduced, add a narrow, explicit allowlist for that exact origin with `Access-Control-Allow-Credentials: true` at that time — no evidence of that need exists now.

## 22. Header-Trust Removal Plan

Staged, per the assignment's own outline, refined with one concrete simplification this codebase's existing shape makes possible:

- **Stage A**: Build `StaffUser` schema, login endpoint, session middleware. Coexists with `resolveActor()`; nothing production-facing changes yet.
- **Stage B**: Application command handlers/orchestrators start receiving a server-constructed `Actor`. **No interface change is needed here** — `CreateReservationHandler`, `ModifyReservationHandler`, `CancelReservationHandler`, `AvailabilityOrchestrator`, etc. already just take an `Actor` object (`domain/value-objects/Actor.ts`); only *who constructs it* changes, not its shape. This is a genuinely low-risk migration property worth relying on.
- **Stage C**: All staff-facing routes (`/reservations`, `/availability/reservations`, `/closing-days`, and any future `users.manage`/`audit.view` routes) require a valid authenticated session; `resolveActor()`'s header path is bypassed for them.
- **Stage D**: Delete `resolveActor()`'s header-trust code from the production route file entirely — not left dormant, removed.
- **Stage E**: Test-only actor construction stays **outside** the production `createApp()` path. Most of this already exists in spirit — `tests/support/factories.ts`'s `staffActor`/`guestChannelActor` already construct `Actor` objects directly in-process, never through HTTP, for domain/application-level tests. The one file that will need real rework is `tests/api/reservations.test.ts`, which currently drives the HTTP layer via `x-actor-*` headers through `supertest` — after Stage D it must instead authenticate through the real session flow (or a test-environment-only bootstrap/bypass wired at test setup, never present in the production route file). Flagged as implementation-planning detail, not decided here.
- **Stage F**: The permanent regression test — §23.

## 23. Required Header-Spoofing Regression

Permanent test, to be added when this is implemented: a request carrying
```
x-actor-id: owner
x-actor-kind: AuthorizedUser
x-actor-role: Owner
```
against every staff-facing mutating route, **with no valid session cookie present**, must be rejected (401, no `Actor` constructed, no command reaches the domain layer) regardless of header content. This asserts the *absence* of the current defect, not merely the presence of the new mechanism — it should fail loudly if header-trust is ever accidentally reintroduced (e.g., a future route added without going through the shared session middleware).

## 24. Audit Attribution Model (new, authenticated)

For new, post-migration authenticated actions, the event envelope's `actor` sub-object (`domain/events/ReservationEvents.ts`, `BaseEvent.actor: { id, type }`) gains additional fields:
```
actor: {
  id: string,                    -- unchanged: StaffUser.id (or integration/automated id)
  type: ActorKind,                -- unchanged
  role?: ActorRole,               -- NEW — snapshotted at the moment of the action
  authenticationLevel?: "authenticated" | "unauthenticated-legacy"
}
```
**Role must be snapshotted, never derived from the user's current role at query time** — the assignment's own example is exactly right: a 2026 action taken while Kelvin was Manager must still read `roleAtTimeOfAction = Manager` even after Kelvin becomes Reception in 2027. Because these events are stored as serialized JSON in a `payload: String` column (`PrismaReservationRepository`), not normalized per-field DB columns, **this extension requires no database migration** — it is purely an additive change to the TypeScript event shape and what gets written into the JSON at event-construction time. This is a materially simpler evolution than it would be if events were stored as rigid, per-field columns, and is worth relying on rather than over-engineering.

## 25. Legacy Audit Migration

**Existing events are never rewritten.** They already contain exactly `{ id, type }` in the `actor` sub-object and nothing else — that is the honest, permanent record of what was actually known at the time (a self-reported, unauthenticated claim). Because new events simply have additional optional fields in the same JSON shape (§24), old and new events coexist in the same column, readable by the same type (with the new fields absent on old rows, which is exactly what "unauthenticated-legacy" would mean if inferred implicitly — no explicit backfill needed). Any future reader (e.g. an audit-view UI, §17) must treat the absence of `role`/`authenticationLevel` on an event as "this was recorded under the old, self-reported trust model," not as a data-quality defect to fix.

## 26. Security Event Log

A **separate** table, not `ReservationDomainEvent` — these are account-lifecycle events, not reservation-domain events, and conflating them would violate the existing `domain/events/` model's own stated ownership boundary ("owned by Reservation Management even when consumed elsewhere").

```
SecurityEvent
  id
  type            LoginSuccess | LoginFailure | Logout | SessionRevoked
                   | AccountDisabled | AccountEnabled | RoleChanged
                   | CredentialReset
  occurredAt
  actingStaffUserId?    -- who performed it (null for a failed login against a nonexistent username)
  targetStaffUserId?    -- whose account was affected (same as actingStaffUserId for self-actions)
  metadata              -- minimal (e.g. a failure-reason category) — NEVER a password or password guess
  ipAddress?            -- coarse, evaluate against data-retention policy before building — not
                            required for correctness, useful for detecting credential-stuffing patterns
```

`ipAddress`/device metadata is marked evaluate-not-mandatory, per the explicit "do not over-collect" instruction and consistent with how this program has already treated guest personal data (PILOT.md's existing "treat the database accordingly" stance).

## 27. Staff Onboarding (all staff, uniform — no email branch)

```
Owner (only — users.manage, §19) creates StaffUser: username, displayName, role.
System generates a random, single-use temporary password.
mustChangePassword = true.
```
**Delivery**: the temporary credential is shown once, on-screen, to the Owner at creation time — never logged, never persisted in plaintext, never emailed automatically. The Owner relays it to the staff member through whatever channel the restaurant already trusts for in-person/small-team communication (verbally, SMS, WhatsApp) — the system does not need to know or manage that channel, because this is a small, already-trusted team, not an anonymous self-signup flow. For staff who do have email, optionally also emailing it is a convenience, never a requirement — keeping the model genuinely uniform for everyone. First login forces a password change via `mustChangePassword`.

No shared/generic usernames (`reception`, `staff1`) — every username maps to exactly one real person, per the assignment's explicit prohibition, which also follows directly from the "individual attribution" owner requirement.

## 28. Account Recovery

**Non-Owner staff, with or without email — one uniform mechanism, deliberately not two:** all recovery goes through Owner-initiated reset, reusing the exact onboarding temporary-credential mechanism (§27). Self-service email-based reset ("controlled reset link") was evaluated and **deliberately not included in MVA**: given the Owner already holds `users.manage` and can reset any non-Owner credential directly, building a second, email-dependent recovery path would duplicate what Owner-reset already provides while introducing a transactional-email sending dependency this MVA otherwise has zero need for. Explicitly deferred as a future convenience, not a requirement — revisit if staff volume grows past what Owner-mediated reset can handle promptly.

**Owner recovery is structurally different, not just "stronger."** No one *inside* the role hierarchy is authorized above Owner (§19), so Owner recovery cannot be a `users.manage` action at all — it reuses the same operator/deployment-level, environment-gated mechanism as bootstrap (§29 below), which by construction is unreachable from any in-app Manager or staff role.

## 29. Owner Bootstrap

Recommended: **environment-gated, one-time seed**, reusing the §5 database invariant as its own "has this already happened" gate:

- A deploy-time-only mechanism (e.g. a bootstrap script, or a route active only while a specific environment variable is set) creates the first Owner `StaffUser`, with a password supplied at bootstrap time — **never a hardcoded default**.
- The gate condition is exactly "no `StaffUser` with `role = 'Owner'` exists yet" — the same partial unique index from §5 that prevents a *second* Owner also naturally prevents bootstrap from ever running twice, without a separate flag to track. Once the first Owner exists, the mechanism is permanently inert regardless of whether the environment variable is still set — self-disabling, not merely "supposed to be removed after setup" (though removing/rotating the variable post-setup remains good operational hygiene, and is called out as such, not relied on as the sole safeguard).
- The bootstrap action is written to `SecurityEvent` (§26) the moment it succeeds.
- **This same mechanism is the answer to Owner-account recovery** (§28) — an operator with deployment access, not an in-app role, is what can reset it, structurally guaranteeing no Manager path exists.

## 30. Login Abuse Protection

**Per-account and per-source throttling, never a global lockout** — the assignment's own explicit warning (a global lockout would let one attacker deny the whole restaurant staff access mid-service) is treated as a hard constraint, not a suggestion. Recommended shape: exponential backoff / temporary lockout on a *specific account* after a small number of consecutive failures (exact count is operational tuning, not architecture — left configurable, not invented here), combined with per-source-IP throttling to slow distributed guessing without blocking other accounts from that same source. Reset attempts (Owner-initiated, §28) are throttled per-target-account for the same reason. The bootstrap mechanism (§29) gets its own, stricter limit, given it is a single sensitive one-time operation rather than routine traffic. All failures feed `SecurityEvent` (§26).

## 31. Threat Model Revision

| # | Threat | Mechanism that holds it | Evidence in this design |
|---|---|---|---|
| T1 | Anonymous caller claims Owner | No session middleware match → request rejected before any `Actor` is constructed | §22 Stage C/D; contrast with today's F1 (absent header defaults to *trusted*) |
| T2 | Reception calls system-configuration endpoint | `authorize(principal, Permission.SystemSettingsManage)` against the centralized role→permission map — Reception's set doesn't include it | §16, §18 |
| T3 | Disabled employee reuses session | Live per-request `StaffUser.status` re-read, no cached authority | §9, §11 |
| T4 | Stolen phone / session | Logout, self-service "revoke my other sessions," full revoke on credential reset | §10 |
| T5 | Role changed while session exists | Same live re-read as T3 — no token to wait out | §9, §12 |
| T6 | Spoofed `x-actor-*` headers | Production routes never read them after Stage D — headers are inert, not merely unauthoritative | §22, §23 |
| T7 | CSRF against a logged-in staff phone browser | `SameSite=Lax` + mandatory custom header + `Origin` validation, backed by strict same-origin CORS | §20, §21 |
| T8 | Machine caller impersonates staff | Structurally separate credential type; a machine credential can never produce a `StaffSession` or `AuthorizedUser` kind | §15 |
| T9 | Manager attempts Owner takeover | `users.manage` withheld from Manager entirely (§18 evidence) *and* an independent Owner-protection invariant in the authorization layer that doesn't depend on the permission grid being configured correctly | §5, §19 |

## 32. Test Strategy (for the implementation pass, not run now)

- Exhaustive unit tests of `ROLE_PERMISSIONS`/`authorize()` — every role × every permission, a natural fit for this codebase's existing pure-function rule-testing style (`domain/rules/*.test.ts` pattern already established).
- Session middleware: valid, expired, revoked, disabled-user-mid-session, role-changed-mid-session (each asserting the *next* request reflects the change immediately, not eventually).
- The permanent header-spoofing regression (§23).
- CSRF: missing custom header rejected; wrong/absent `Origin` rejected; correct same-origin request succeeds.
- Rate limiting: per-account lockout triggers and later clears; per-source throttling does not block unrelated accounts (directly testing the "no global lockout" constraint from §30).
- Owner-protection: a Manager (or any non-Owner) attempting any `users.manage` action against the Owner account is denied, independent of the general `users.manage` permission check.
- Bootstrap: succeeds exactly once; a second attempt after an Owner exists is rejected (reusing the same DB invariant test style already established for `CapacityCommitment` in `R1_1_CONCURRENT_MODIFY_FIX_REPORT.md`).

## 33. Migration Stages

Identical to §22 — Stages A through F are the full migration; no additional stages needed beyond header-trust removal, since schema/session/authorization all land together in Stage A/B before any production route depends on them (Stage C is the actual cutover).

## 34. MVA Boundary

Confirmed against the assignment's own candidate list — every item is addressed by a design decision above (`StaffUser` §5, individual credentials §7, password authentication §8, server-side sessions + secure cookie §9, session revocation §10, `Disabled` status §5/§11, central permission policy §16, owner-approved role matrix §18, trusted server-created `Actor` §13/§22, header-trust removal §22/§23, CSRF §20, login throttling §30, new authenticated audit attribution §24, legacy audit preservation §25, Owner bootstrap §29, security regression tests §23/§32). Nothing beyond this list was introduced. Explicitly excluded, per instruction and with no evidence found to override it: OAuth, SSO, passkeys, external-partner authentication, guest accounts, advanced device management.

## 35. Replacement Boundary

Before Guestplan removal can be considered (a separate, later gate — not this one), Identity & Access must additionally cover, beyond this MVA: onboarding every real production staff member (not just pilot participants), the full account lifecycle in practice (not just the mechanism), production-grade secure deployment of session/cookie infrastructure (real TLS termination, secret management for whatever signs/protects session storage), and eventually the machine-principal mechanism for TheFork/Heerlijk/DiningCity/Social Deal(s) integrations (§15 — explicitly a later, separate capability, not R1.2's concern).

## 36. P0/P1/P2/P3 Risks

- **P0 (pre-existing, the reason this document exists)**: the current header-trust model remains fully live and exploitable **until Stages A-F are actually implemented** — this document does not itself reduce production risk; it is the plan to do so.
- **P1**: Bootstrap mechanism misconfiguration — e.g. the gating environment variable left set in production after initial setup. Primary defense is the self-disabling DB-invariant gate (§29), not operator discipline alone, but removing/rotating the variable post-setup is still recommended hygiene.
- **P1**: The CSRF header+Origin approach (§20) depends on CORS being configured correctly (§21) — a misconfigured, overly permissive CORS policy would silently weaken it. Needs its own regression test (§32), not just a one-time review.
- **P2**: Session-cookie theft via XSS. `HttpOnly` prevents script-readable theft but does not prevent an XSS payload from *using* an active session in-page. Standard output-encoding/CSP hygiene is an adjacent concern this document flags but does not fully design — it is not unique to Identity & Access and shouldn't be treated as solved by this document alone.
- **P2**: Rate-limiting threshold tuning (§30) is genuinely an operational balance (too strict locks out staff during service; too loose permits guessing) — deliberately left configurable rather than architecturally fixed, per instruction not to invent exact values.
- **P3**: Email-optional-by-design means non-Owner recovery depends entirely on Owner availability (§28). Accepted tradeoff given the small, trusted team size the owner described — but stated explicitly here rather than left as a silent implication.

## 37. Final Architecture Recommendation

```
IDENTITY MODEL:
StaffUser — id (stable anchor), username (unique, normalized), displayName,
email (optional, never sole/mandatory), role (single value, no join table),
status (Active|Disabled), mustChangePassword flag in place of a
separate Invited/Pending status.

LOGIN MODEL:
Username + password, uniform for every staff member regardless of
email availability. No email-based login path.

AUTHENTICATION MODEL:
Password-based (adaptive/memory-hard one-way hashing; specific library
deferred to implementation planning), account-enumeration-safe failure
responses, unconditional rejection of Disabled accounts.

SESSION MODEL:
Server-side opaque session (StaffSession: sessionId, staffUserId,
createdAt, expiresAt, revokedAt), HttpOnly+Secure+SameSite=Lax cookie.
No role/status cached in the session — always re-read live from
StaffUser per request, which is what makes disable/role-change take
effect immediately without any extra invalidation mechanism.

CSRF MODEL:
SameSite=Lax + mandatory custom request header + explicit Origin
validation, for the current same-origin deployment. Revisit toward a
token-based model only if a separate frontend origin is ever introduced.

AUTHORIZATION MODEL:
Centralized static role→permission policy (Model B) plus one
independent, hard-coded Owner-protection invariant that does not rely
on the permission grid alone.

AUDIT MODEL:
Existing per-event actor{id,type} JSON shape extended additively with
optional role (snapshotted at time of action, never re-derived) and
authenticationLevel — no database migration required, since events are
stored as JSON payload text, not normalized columns.

LEGACY AUDIT MIGRATION:
None performed on existing rows — old events keep their exact original
{id,type} shape permanently; new fields are simply absent on them,
which is itself the honest signal that they predate authentication.

BOOTSTRAP MODEL:
Environment-gated one-time seed, self-disabling via the same
"at most one Owner" database invariant used for Owner protection —
also doubles as the Owner-recovery mechanism, structurally unreachable
from any in-app role.

HEADER TRUST REMOVAL:
Six-stage plan (§22): build alongside existing header-trust (A),
thread server-constructed Actor through unchanged handler interfaces
(B), require auth on all staff routes (C), delete the header-trust
code path entirely (D), keep test-only actor construction out of the
production route file (E), permanent spoofing regression test (F).
```

---

```
R1.2 ARCHITECTURE:
READY

CURRENT HEADER TRUST:
UNSAFE

INDIVIDUAL STAFF ACCOUNTS:
REQUIRED

SHARED STAFF ACCOUNTS:
PROHIBITED

RECOMMENDED LOGIN MODEL:
Username + password (uniform, no email branch)

RECOMMENDED SESSION MODEL:
Server-side opaque session, secure cookie, live per-request
role/status re-read (no cached authority)

RECOMMENDED AUTHORIZATION MODEL:
Centralized static role-to-permission policy + independent
Owner-protection invariant

CSRF PROTECTION:
SameSite=Lax + custom header + Origin validation (same-origin deployment)

LEGACY AUDIT HISTORY:
PRESERVED

IMPLEMENTATION AUTHORIZATION:
NOT REQUESTED

CONFIDENCE:
HIGH (core mechanisms are standard, evidence-based, and consistent with
this codebase's existing patterns; two role-matrix cells — Assistant
Manager and Supervisor audit.view — remain OWNER INPUT REQUIRED and
default to NO under least-privilege until answered; numeric tuning for
session lifetime and rate-limit thresholds is deliberately left
configurable, not architectural, per instruction)
```
