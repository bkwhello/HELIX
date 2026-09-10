# R1.7-P1 — Security Event Visibility Implementation Report

Mode: IMPLEMENTATION REPORT — consolidates work already implemented,
tested, committed (`d623365577c157073f9fd79678a2deade03ef800`), and
pushed. No new production code is introduced by this document. Written
as part of R1-DOC-3 (Post-Seating and Security Visibility Documentation
Reconciliation), alongside `capability-registry.yaml.md`'s CAP-D04.05
status update and `README.md`/`PILOT.md`'s R1.5-P1A/P1B0/P1B/R1.7-P1
reconciliation.

## Scope

R1.2-P2 introduced `SecurityEventRecorder` and began writing a real
`SecurityEvent` row (`type: "LoginFailed"`) on every failed login, plus
one `type: "OwnerBootstrapped"` row from `infrastructure/bootstrap/bootstrapOwner.ts`.
Nothing ever read either back — an operational blind spot: the Owner had
no way to see failed-login activity short of a direct database query.
R1.7-P1 closed that gap with a single read-only HTTP endpoint and pilot
UI section, authorized and delivered across four Chief Engineer gates
(portfolio assessment → implementation → a `since`-timezone correction →
commit → push), all within one milestone (no sub-phase sequence, unlike
R1.5).

## What shipped

| Layer | Artifact |
|---|---|
| Read port | `application/ports/SecurityEventReader.ts` — `listRecent({since?, limit})`, mirrors `SecurityEventRecorder`'s own narrowness |
| Adapter | `infrastructure/persistence/PrismaSecurityEventReader.ts` — shared `PrismaClient`, never a second connection |
| Projection | `application/security/SecurityEventProjection.ts` — pure, no-I/O; explicit 8-field allowlist; `reason` parsed only for `LoginFailed`, from a fixed 3-value union, degrading to `null` on malformed JSON, an unrecognized reason, or any other event type |
| Route | `GET /security-events` (`api/app.ts`) — `requireStaffSession` + `requirePermission(Permission.AuditView)` |
| Pilot UI | "Beveiligingsgebeurtenissen" read-only section, `public/pilot.html` — no form, no button, nothing can mutate an event |
| Wiring | `api/server.ts` — `PrismaSecurityEventReader` over the same shared `prisma` instance the recorder already uses |

**Permission**: `Permission.AuditView` (`audit.view`) — no new permission
was introduced. It already existed in `domain/rules/StaffAuthorizationPolicy.ts`,
already granted to Owner and Manager, with its own header comment
explicitly anticipating this: *"no route exists for either yet."* R1.7-P1
is the first route to check it.

**Response contract**: `{ events: [...] }`, each row exactly
`{id, type, occurredAt, actingStaffUserId, actingStaffUsername, targetStaffUserId, targetStaffUsername, reason}`
— never `metadata`, never any other key, enforced by
`SecurityEventProjection.ts`'s explicit type (not a spread of the
underlying record).

**Query contract**: `since` (optional) must be a complete RFC 3339/
ISO-8601 timestamp with an explicit timezone (`Z` or a numeric offset) —
a date-only value, a timezone-less value, or a syntactically-shaped but
impossible calendar/time value (e.g. `2026-02-30T12:00:00Z`) are all
rejected with `400`. `limit` (optional, positive integer, default 50,
clamped to a maximum of 200) — an invalid value is `400`, an over-maximum
value is silently clamped, not rejected. Ordering is `occurredAt DESC,
id DESC` (deterministic even when two events share a timestamp). No
unbounded read.

## Relationship to the capability registry — explicit, deliberate non-mapping

**Decision (Chief Engineer, R1-DOC-3): Security Event Visibility does
NOT receive a new capability identifier in this milestone, and
`CAP-D08.02` (Operational Audit) is left at its current `delivery_status`
(`Designed`) and otherwise unchanged.**

`CAP-D08.02`'s registered purpose is broad: *"Provide accountable
inspection of meaningful changes, overrides, integration actions, and
user decisions"* — owning `Audit Record`, `Actor Attribution`, `Override
Record` concepts and `AuditRecordCreated`/`OverrideAudited` events. What
R1.7-P1 actually delivered is narrower and different in kind: visibility
into login-security telemetry (`LoginFailed`, `OwnerBootstrapped`), not a
general business-audit trail of reservation changes, overrides, or
integration actions. Reservation-domain changes are NOT recorded as
`SecurityEvent` rows anywhere in this codebase, and `CAP-D08.02`'s
`Override Record`/`OverrideAudited` concepts have no implementation at
all. Marking `CAP-D08.02` `Pilot` on the strength of R1.7-P1 alone would
overstate what exists; the registry's own `change_control` rule reserves
capability-identity/ownership changes for architectural review, which
this documentation-only milestone is not.

R1.7-P1 is therefore documented here, in `README.md`, and in `PILOT.md`
as a **narrow delivered slice adjacent to, but explicitly not
satisfying, `CAP-D08.02`** — real, shipped, tested capability with no
registry entry of its own, rather than a capability wrongly folded into
one it doesn't fully match. Whether it eventually warrants its own
identifier (e.g. a future `CAP-D08.06`) is left as an open architectural
question for whoever authorizes that review — not resolved here.

## Automated verification — what this report can and cannot claim

**Confirmed by automated evidence:**
- Full HTTP-level test coverage: `tests/api/security-events.test.ts`, 35
  tests — 401/403/200 across Owner/Manager/Reception/ReservationAgent;
  default/explicit/maximum-clamped `limit`; the full `since` contract
  (valid UTC, valid offset, date-only rejection, timezone-less rejection,
  impossible-calendar/time rejection, correct filtering); deterministic
  tie-break ordering; `OwnerBootstrapped` projection; malformed metadata,
  an unrecognized reason, and an unknown event type all degrading safely;
  no raw `metadata` or non-allowlisted key ever present; username
  resolution for a persisted reference vs. an unresolvable id; a real
  HTTP wrong-password login recorded and retrieved, with neither the
  attempted nor any fixture password ever appearing in the response.
- Pilot UI wiring proven by source-text regression tests:
  `tests/pilot/security-events-ui.test.ts`, 9 tests — no form/button
  anywhere in the section, wired into `initApp()`, hides/re-shows on
  401/403, every dynamic field passed through `escapeHtml`, empty-state
  and both HTTP-failure and network-failure messaging present.
- Full isolated suite at closure: 77 files / 1144 tests / 0 failed / 0
  skipped, confirmed twice (pre-commit and pre-push gates) plus once more
  at R1-DOC-3 closure (see this report's own STOP-gate report).
- No credential value — the real rotated `helix_reservations` password,
  any test fixture password, or any attempted login credential — appears
  in the response contract, the diff, or this report; verified by direct
  string-search of both.

**NOT confirmed — explicitly out of scope for this report:**
- **No human smoke test has been performed.** No staff member has opened
  the pilot, logged in as Owner or Manager, and visually confirmed the
  Security Events section renders correctly against real data.
- **Nothing in this milestone has been deployed anywhere.**
- **`CAP-D08.02`'s broader scope remains unimplemented** — this report
  does not claim otherwise (see "Relationship to the capability
  registry" above).

## Documentation reconciled alongside this report (R1-DOC-3)

- `capability-registry.yaml.md`: `CAP-D04.05` `delivery_status` updated
  `Designed` → `Pilot` (R1.5-P1A now satisfies all four of its owned
  rules); a closure note added under `CAP-D01.03`'s `assignment
  revalidation` rule (no status change — already `Pilot`); `CAP-D08.02`
  deliberately left unchanged, per the decision above.
- `README.md`: Status section extended with R1.5-P1A/P1B0/P1B and
  R1.7-P1; Controlled Pilot section extended to mention the Security
  Events view.
- `PILOT.md`: top Scope line and Floor & Seating status section extended
  for R1.5-P1A/P1B0/P1B; new "Security Events status" section added.
- This report itself — the fourth of the four files authorized for
  R1-DOC-3.

## Next gate

Same as Floor & Seating's own next gate: a controlled development smoke
test is the recommended step before either capability set is relied on
operationally. `CAP-D02.02`'s live Service Period lifecycle remains the
one large, accurately-documented, product-owner-gated capability gap
this and the prior portfolio assessment both surfaced — not addressed by
this report.
