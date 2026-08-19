# R1_3_I1_CAP_D05_01_IMPLEMENTATION_REPORT

**Phase:** R1 — Critical Gap Closure
**Work Package:** R1.3-I1 — CAP-D05.01 Reservation Contact Management
**Baseline:** `ce69e04`, branch `feat/ec-002-visibility-baseline`
**Implementation Authorization:** GRANTED (this assignment)
**Production Deployment / Push:** NOT AUTHORIZED — neither was performed.

---

## 1. Summary

CAP-D05.01 — Reservation Contact Management is implemented. `UnvalidatedContactReader` (`exists(anyString) = true`) is gone; every new reservation now references a real, validated `Contact` record, and `Reservation` carries an immutable-at-creation snapshot of that Contact's name/phone/email so a later Contact edit can never rewrite history. Verified against real PostgreSQL: full test suite (304 tests, 25 files) passes, and a manual end-to-end smoke test against a running server confirmed contact creation, normalized possible-match discovery, existing-contact reuse, and rejection of a nonexistent contact all work as designed.

## 2. Owner-Confirmed Business Rules — Implemented As Specified

- **Contact reuse**: no automatic reuse or merge on a phone/email match. `findPossibleMatches` returns exact normalized matches as a non-blocking signal; the caller (staff, via the pilot's inline hint, or any API client) must explicitly submit `ExistingContact(contactId)` or `CreateNewContact(...)`. Nothing in the persistence layer decides this itself.
- **Minimum contact requirement**: `CAP-D05.01-R01` — name required, phone-or-email required, neither mandatory alone, both never required together. Enforced in `domain/rules/ContactRules.ts`, exercised by both unit tests and the live smoke test.
- **Retention**: `Contact.lastRelevantActivityAt` is the retention anchor, set at creation and touched on every reuse (`ContactRepository.touchActivity`). **AUTOMATED RETENTION EXECUTION IS DEFERRED** — no purge job exists. This is sufficient to determine retention eligibility later, per the assignment's own stated acceptance condition for this slice.
- **Anonymization**: `ContactStatus` is `Active | Anonymized` only. No anonymization *operation* was built in this slice (not requested), but the model is compatible with one: `status` plus nulling the PII columns is a direct, additive future change, and nothing in this implementation assumes a Contact's PII fields are always present. Reservation-time snapshots are explicitly NOT touched by any future anonymization of the Contact — unchanged from today.
- **Guest Profile / CRM**: not built. No VIP, cross-visit preferences, spend, favorite table, marketing profile, or automatic merge exists anywhere in this change.
- **Allergies**: untouched. `notes` remains exactly as it was; CAP-D05.02 is not implemented here.
- **External-reference registry overlap**: not resolved, as instructed. Recorded below (§9) as `ENGINEERING FOLLOW-UP REQUIRED`.

## 3. Existing Foundations — Preserved

R1.1's shared-transaction model, reservation-scoped and capacity advisory locks, the corrected simultaneous-occupancy algorithm, and CAP-D01.01's aggregate boundary are all unchanged in behavior — CreateReservationHandler's contract changed (see §5), but every existing test covering these (availability-concurrency, availability-modify-modify, availability-timezone, availability-failure-injection, availability-create) passes unmodified in behavior, only updated at the call sites where `contactId` became `contactSelection`. R1.2's StaffUser authentication, sessions, RBAC, CSRF, the Owner invariant, and login throttling are all untouched — no file under `application/auth/`, `domain/rules/StaffAuthorizationPolicy.ts`, or the session/CSRF middleware was modified.

## 4. What Was Built

**Domain** (`domain/`):
- `value-objects/ContactStatus.ts` — `Active | Anonymized`.
- `value-objects/PhoneNumber.ts` — raw/normalized pair; bounded NL-first normalizer (`06.../0.../0031.../+...` → `+31...`), not a third-party library (see §7).
- `value-objects/EmailAddress.ts` — raw/normalized (trim+lowercase) pair.
- `rules/ContactRules.ts` — `CAP-D05.01-R01`.
- `aggregates/ReservationAggregate.ts` — new `contactPhoneSnapshot`/`contactEmailSnapshot` fields, mutable via `modify()` for the same staff-correction reason `contactName` already was; new getters.
- `commands/ReservationCommands.ts`, `events/ReservationEvents.ts` — carry the two new snapshot fields through creation and the change-tracking bag on modification.

**Application** (`application/`):
- `ports/ContactRepository.ts` — replaces `ContactReader`. `findById`, `create`, `findPossibleMatches`, `touchActivity`.
- `command-handlers/CreateContactHandler.ts` — the bounded creation operation (assignment §11): validate, normalize, persist. No matching logic inside it — matching is a separate, prior step the caller runs.
- `command-handlers/CreateReservationHandler.ts` — rewritten. `contactId: string` is gone from the request; replaced by `contactSelection: ContactSelection` (`ExistingContact(contactId) | CreateNewContact(displayName, phone?, email?)`). Resolves an existing Contact via a read (no transaction needed); for a new Contact, opens a transaction — the caller's (`AvailabilityOrchestrator`'s) if already inside one, otherwise a new one via `TransactionManager` — spanning the Contact write and the reservation write together, so a downstream validation failure rolls back the Contact write too (mirrors `AvailabilityOrchestrator`'s existing `OrchestratedValidationFailure` pattern with an equivalent `ReservationFailureAfterContactWrite`, and handles `ReservationCommandRaceLost` the same way `AvailabilityOrchestrator` already does, since passing `tx` into `repository.save()` changes a commandId race's failure shape from a returned `IDEMPOTENT_REPLAY` to a thrown error).

**Infrastructure** (`infrastructure/`):
- `persistence/PrismaContactRepository.ts` — the real adapter.
- Deleted: `application/ports/ContactReader.ts`, `infrastructure/UnvalidatedContactReader.ts` (and the now-redundant `FakeContactReader` test double). Nothing referenced them after the `CreateReservationHandler`/`AppDependencies` change; left as dead code would have contradicted this codebase's own conventions.

**Schema** (`prisma/schema.prisma`, migration `20260819112006_cap_d05_01_contact_management`):
- New `Contact` table — no FK from `Reservation.contactId` (see §6), no uniqueness constraint on `phoneNormalized`/`emailNormalized` (owner-confirmed: a shared phone/email is not proof of one identity).
- `Reservation.contactPhoneSnapshot`, `Reservation.contactEmailSnapshot` — new, nullable, inline columns (not a separate snapshot table — see §8). `contactName` unchanged, its existing (already-snapshot) semantics simply now documented against this capability too.

**API / composition root** (`api/`):
- `AppDependencies.contactReader` → `contactRepository`; new required `transactionManager` field (previously only present inside the optional `capacity` block — CreateReservationHandler now needs one unconditionally, since a plain, non-capacity-aware create can still need to open a transaction for a new Contact).
- `POST /reservations` and `POST /availability/reservations` now take `contactSelection` in the body (parsed by a shared `parseContactSelection`, 400 on a structurally invalid shape — the same boundary-validation posture already used for `preferredArea`).
- New `GET /contacts/possible-matches?phone=&email=` — read-only, staff-authenticated, non-blocking.
- `serializeReservation` and `GET /reservations`/`GET /reservations/:id` now include the two new snapshot fields.

**Pilot UI** (`public/pilot.html`): added an optional email field; on phone/email blur, queries the new possible-match route and shows a non-blocking inline hint ("possibly the same guest — reuse?") that, only if clicked, sets the explicit `ExistingContact` selection for the next submit — otherwise the form always submits `CreateNewContact`. The edit (PATCH/Modify) flow is unchanged.

**Capability documentation**: `solutions/reservations/capabilities/active/CAP-D05.01-reservation-contact-management/rule-model.md` — `CAP-D05.01-R01` through `R05`, scoped to what this slice actually enforces (not a full capability documentation suite — see §10, Known Limitations).

## 5. Contact Model — As Implemented

```
Contact
  id                  -- internal, cuid, never derived from phone/email/name
  displayName
  phoneRaw?, phoneNormalized?
  emailRaw?, emailNormalized?
  status              -- Active | Anonymized
  createdBy
  createdAt, updatedAt, lastRelevantActivityAt

Reservation (extended, not replaced)
  contactId           -- for new reservations, a real Contact.id; legacy rows unchanged (§6)
  contactName          -- unchanged column, already had snapshot semantics
  contactPhoneSnapshot  -- new
  contactEmailSnapshot  -- new
```

## 6. Legacy `contactId` Compatibility

No FK constraint was added, and no migration touched existing `Reservation` rows. A pre-existing reservation whose `contactId` is a raw phone number (or any other placeholder-era value) remains exactly as stored and exactly as readable as before. No synthetic Contact record was created to "satisfy" a foreign key that does not exist. Every new reservation created under this implementation, by contrast, has a `contactId` that provably resolves to a real, Active `Contact` — proven by the smoke test's negative case (§11).

## 7. Deviation From The Assignment, Made Under Truncation — Phone Normalization

Section 14 of the assignment ("Phone Normalization") cut off mid-sentence at "Use a maintained standard parsing/" — the intended continuation (a specific library, or "library vs. bounded implementation") was never received, and the Chief Engineer's follow-up message directed proceeding with the assignment as sent. I implemented a **bounded internal normalizer** (`domain/value-objects/PhoneNumber.ts`), not a third-party library — consistent with the R1.3 architecture investigation's own recommendation (§13 of that report) and with "smallest correct model." If a maintained library was actually intended, this is a one-file, contained change to adopt later (`normalizePhone` is the only call site). Flagged explicitly here rather than silently assumed.

## 8. Design Choices Worth Recording

- **Inline snapshot columns, not a separate table**: the assignment's own illustrative shape suggested a `ReservationContactSnapshot`-style table; I extended the existing inline `contactName` pattern instead (`contactPhoneSnapshot`/`contactEmailSnapshot` as plain nullable `Reservation` columns) — smaller, and consistent with how the one snapshot field that already existed was modeled.
- **Transaction boundary**: Option C from the R1.3 architecture investigation (§21) — an existing Contact needs no write and therefore never forces a transaction; a new Contact's write always shares a transaction with the reservation write, either the caller's (capacity path) or one opened here (plain path). This is the same shape R1.1/CAP-D02.03 already proved correct for capacity commitments, applied to Contacts.
- **`touchActivity` is non-transactional**: an existing Contact's retention-anchor update is best-effort, not part of the atomic reservation write — it is metadata, not a safety invariant, and extending the transaction for it would not be justified by what it protects.
- **`CreateContactHandler` is composed into `CreateReservationHandler`**, not duplicated logic — the same pattern `AvailabilityOrchestrator` already uses to compose `CreateReservationHandler`/`ModifyReservationHandler`/`CancelReservationHandler`.

## 9. Open Item Not Resolved Here — Registry Overlap

The R1.3 architecture investigation flagged that `CAP-D05.04` (Guest Profile Reference) and `CAP-D07.03` (External Identity Mapping) both appear to claim ownership of "external guest reference." Per this assignment's explicit instruction, this was **not** resolved by adding an external identifier to CAP-D05.01, and no external-reference model was invented here.

```
ENGINEERING FOLLOW-UP REQUIRED
BEFORE GUESTPLAN MIGRATION / EXTERNAL CHANNEL IMPLEMENTATION
```

Recommended resolution point: whichever gate first authorizes CAP-D05.04 or CAP-D07.03 (both currently Deferred) should reconcile the overlap before either is implemented — not this one, since neither is in this slice's scope.

## 10. Known Limitations (Explicit, Not Silent)

- No standalone `POST /contacts` administrative endpoint exists — contact creation is reachable only inline via reservation creation, or read-only via possible-match discovery. Deliberate, per "do not create a broad CRM administration module"; a dedicated endpoint is a small, additive follow-up if a real need emerges.
- `CAP-D05.01-R02`/`R04` are documented in the new rule-model.md and enforced structurally (by what the code does and does not do — e.g. no code path ever re-derives a Contact's id from phone/email/name, no code path ever writes a Contact's current values back onto an existing Reservation snapshot) rather than by a single dedicated runtime check with that exact rule id — consistent with how CAP-D01.01-R08's field-presence rule is described as "enforced by TypeScript's type system" in `CreationRules.ts` rather than a discrete runtime function.
- The capability documentation created here is a rule-model only, not a full capability folder (no `capability.md`, `event-model.md` contribution, etc.) — scoped to keep this implementation slice traceable without building documentation beyond what the code needs.
- `PATCH /availability/reservations/:id` (the capacity-aware modify route) was not extended to accept `contactPhoneSnapshot`/`contactEmailSnapshot` corrections the way the plain `PATCH /reservations/:id` route was — an oversight-free but incomplete parity gap, since Modify's contact-editing behavior was explicitly out of this assignment's scope. Noted for a future pass if staff need to correct a phone/email snapshot on a capacity-managed reservation via that route specifically (today they can via the plain route regardless of whether the reservation is capacity-managed).

## 11. Verification

- **TypeScript**: `tsc --noEmit` — clean, zero errors.
- **Migration**: `prisma migrate dev --name cap_d05_01_contact_management` — applied cleanly against the local PostgreSQL instance (port 5433).
- **Automated tests**: `vitest run` — **304 passed, 0 failed, 25 files** (real PostgreSQL for every integration/API-level test, per this codebase's existing convention — no SQLite, no mocked persistence for the capability-boundary tests).
- **Manual smoke test**, against a live `tsx api/server.ts` instance:
  1. Logged in as a bootstrapped Owner.
  2. `POST /reservations` with `contactSelection: CreateNewContact` (`"Smoke Test Guest"`, phone `"06 11 22 33 44"`, email `"smoke@example.com"`) → `201`, reservation created; `GET /reservations/:id` showed `contactPhoneSnapshot`/`contactEmailSnapshot` populated exactly as submitted.
  3. `GET /contacts/possible-matches?phone=0611223344` (deliberately different formatting than what was stored) → found the same Contact — confirms normalized matching works.
  4. `POST /reservations` with `contactSelection: { type: "ExistingContact", contactId: <found id> }` → `201`, second reservation created against the same Contact.
  5. `POST /reservations` with `contactSelection: { type: "ExistingContact", contactId: "does-not-exist" }` → `422`, `CAP-D05.01-R01` — confirms the placeholder's `exists(anyString) = true` behavior is gone.
- Server process stopped and scratch log files removed after the smoke test; the local dev database now contains smoke-test rows only (no cleanup was requested and none was performed beyond removing temp files — the dev database is not production data).

## 12. Test Coverage Added

- `tests/application/create-reservation-handler.test.ts` — CreateNewContact success path with snapshot verification, missing-contact-method rejection, existing-contact-not-found rejection (rule id updated to `CAP-D05.01-R01`).
- `tests/api/reservations.test.ts` — new 400-vs-422 boundary test for a structurally missing `contactSelection`.
- All pre-existing capacity/concurrency/timezone/failure-injection integration suites continue to run against a real, now-validated Contact (seeded via a shared `seedTestContact` helper in `testHarness.ts`) rather than an unvalidated placeholder — a strictly stronger form of the same tests, not a weakened one.

---

```
R1.3-I1 STATUS:
COMPLETE

TESTS:
304/304 PASSING (25 files, real PostgreSQL)

TYPECHECK:
CLEAN

MANUAL SMOKE TEST:
PASSED (create-new, possible-match, reuse-existing, reject-nonexistent)

DEVIATION FLAGGED:
Phone normalization implemented as bounded internal logic, not a
maintained library — assignment §14 was truncated before specifying
which was intended (§7 above)

UNRESOLVED, EXPLICITLY DEFERRED PER INSTRUCTION:
CAP-D05.04 / CAP-D07.03 external-reference registry overlap (§9)

PRODUCTION DEPLOYMENT:
NOT PERFORMED

PUSH:
NOT PERFORMED

NEXT STEP:
awaiting Chief Engineer review; local commit follows this report
per instruction ("stop after the required report and local commit")
```
