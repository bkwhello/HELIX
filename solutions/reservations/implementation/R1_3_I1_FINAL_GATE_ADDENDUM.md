# R1_3_I1_FINAL_GATE_ADDENDUM

**Gate:** R1.3-I1 Final Implementation Gate — CAP-D05.01 Reservation Contact Management
**Mode:** Final implementation review + bounded correction if required
**Reviewed commit (baseline for this gate):** `b003fd0`
**Addendum to:** `R1_3_I1_CAP_D05_01_IMPLEMENTATION_REPORT.md` (that report is unchanged — read together with this addendum, which records what the gate found and corrected)

---

## 1. Baseline Verification

- Repository: `HELIX` (`origin` = `https://github.com/bkwhello/HELIX.git`)
- Branch: `feat/ec-002-visibility-baseline`
- HEAD at gate start: `b003fd0` — matches the expected commit exactly.
- Working tree: clean except the pre-existing untracked `R1_3_GUEST_CONTACT_ARCHITECTURE_INVESTIGATION.md` (unchanged from before, correctly still not committed per its own separate instruction).
- Push state: 5 commits ahead of `origin/feat/ec-002-visibility-baseline`, nothing pushed.
- No repository drift found. No STOP condition triggered — proceeded with the gate.

## 2. Audit — Contact Authority and Minimum Contact Information

Grepped the full implementation tree for `UnvalidatedContactReader`/`ContactReader`: zero remaining references outside historical doc comments (six matches, all prose explaining what was replaced — e.g. `PrismaContactRepository.ts`'s own header comment). `CreateReservationHandler` is the only reservation-creation code path (both `POST /reservations` and `POST /availability/reservations` route through it, the latter via `AvailabilityOrchestrator`), and it unconditionally resolves `contactSelection` against the real `ContactRepository` before an aggregate is ever built — confirmed no alternate path bypasses this. **PASS.**

Minimum contact information (`CAP-D05.01-R01`, `domain/rules/ContactRules.ts`) — audited and exercised by both new and pre-existing tests: name+phone valid, name+email valid, name+phone+email valid, name-only rejected, phone/email without name rejected (name check runs independently of the phone-or-email check). **PASS.**

## 3. Audit — Contact Reuse Policy (No Auto-Merge)

Confirmed structurally: `ContactRepository.findPossibleMatches` is a pure read with no side effects, called only from the new `GET /contacts/possible-matches` route — nothing in `CreateReservationHandler` or `CreateContactHandler` ever calls it or uses its result to redirect a `CreateNewContact` selection into an `ExistingContact` one. A new regression test proves this behaviorally, not just structurally: submitting `CreateNewContact` twice with the same phone number produces two distinct Contact ids, and a subsequent `findPossibleMatches` call returns both. **PASS.**

## 4. Phone Normalization — Correction Applied

**Finding confirmed**: the original R1.3-I1 implementation used a bounded, hand-written NL-first normalizer (`domain/value-objects/PhoneNumber.ts`, prior version), built because the assignment's phone-normalization section was truncated mid-instruction and the fallback default (per this program's established pattern for truncated messages, and per the R1.3 architecture investigation's own recommendation) was the smaller, dependency-free option. The Chief Engineer's actual intent — a maintained library — was recorded as a flagged deviation in the original implementation report, not hidden.

**Correction made this gate**: replaced the bounded normalizer with `libphonenumber-js`.

### Library evaluation (§6)

| Criterion | `libphonenumber-js` | `google-libphonenumber` |
|---|---|---|
| Maintenance | Actively maintained; latest release the day before this gate (2026-08-14) | Maintained, less frequent releases |
| TypeScript support | Ships its own `.d.ts`, no `@types` package needed | Requires a separate `@types/google-libphonenumber` package |
| Dependency footprint | **Zero runtime dependencies** (confirmed via `npm ls`) | Zero runtime dependencies, but a heavier port of the full Java Closure-library API surface |
| E.164 normalization | Direct (`.number` on a parsed result) | Direct, via a formatter call |
| Region-aware parsing | Direct (`parsePhoneNumberFromString(input, defaultCountry)`) | Direct, slightly more verbose API |
| Server-side suitability | Designed for both browser and Node; no bundler required | Node-suitable, same |

`libphonenumber-js` was selected: same correctness guarantees (it is a port of the same underlying Google metadata `google-libphonenumber` uses), a smaller and more idiomatic TypeScript-first API for this codebase's style, and no additional `@types` package. No compelling technical reason was found to retain the internal normalizer — the library was adopted.

### What changed

`domain/value-objects/PhoneNumber.ts` — `normalizePhone(raw, defaultCountry = "NL")` now calls `parsePhoneNumberFromString` and returns the parsed result's E.164 `.number` **only when the library considers the input a valid number**; otherwise it returns `undefined` (not a guess, not a partial transformation — satisfying requirement 3 exactly: "invalid or ambiguous input must not be silently transformed into a different telephone number"). `PhoneNumber.getNormalized()`'s return type is now `string | undefined` (previously always `string`); every call site already handled optionality correctly (`findPossibleMatches` and `CreateContactRecordInput.phoneNormalized` were already optional), confirmed by a clean `tsc --noEmit`.

**A phone number that fails to parse is still accepted as raw Contact data** — `PhoneNumber.create()` only rejects a blank value (`CAP-D05.01-R01`'s actual requirement), never an unparseable-but-non-blank one. This is a deliberate, conservative choice: CAP-D05.01-R01 was owner-confirmed as "non-blank," not "valid E.164," and rejecting on validity would be a new, non-owner-confirmed blocking rule. An unparseable phone simply cannot participate in normalized possible-match discovery — a safe degradation (no match found), not a data-integrity risk.

### Dutch and international coverage — proven, not asserted

`tests/domain/phone-number.test.ts` (new, 10 tests):
- `"06 12345678"`, `"+31 6 12345678"`, `"0031 6 12345678"`, `"0612345678"` all normalize to the identical `"+31612345678"`.
- A Dutch landline (`"020 1234567"`) normalizes correctly under the NL default region.
- A US number (`"+1 202-555-0143"`) and a UK number (`"+44 20 7946 0958"`) both parse correctly to their own E.164 forms — proving the NL default region does not leak into explicitly-country-coded international numbers.
- Non-phone text, a too-short number, and an empty string all return `undefined` from `normalizePhone` (no guess), while `PhoneNumber.create()` still succeeds for the non-blank cases (raw preserved) and still rejects blank input under `CAP-D05.01-R01`.

## 5. Email Normalization — Reviewed, Unchanged

Re-inspected `domain/value-objects/EmailAddress.ts`: normalization is exactly trim + lowercase, nothing else. No Gmail dot-removal, no `+tag` stripping, no provider-specific rewriting exists anywhere in this codebase. **PASS, no change required.**

## 6. Reservation Snapshot Invariant — Proven With a New Regression Test

`tests/integration/contact-management.test.ts` — creates a reservation via `CreateNewContact`, then directly updates the underlying Contact row's `displayName`/`phoneRaw`/`emailRaw` (simulating a future Contact edit — no `UpdateContact` operation exists yet, correctly out of this gate's scope), then re-reads the reservation and asserts `contactName`/`contactPhoneSnapshot`/`contactEmailSnapshot` are all unchanged from what was captured at creation, while independently confirming the Contact record itself really did change (proving the test is exercising a real edit, not a no-op). **PASS.**

## 7. Transaction Integrity — Gate Found and Fixed a Real Defect

Writing the required failure-injection coverage for "Contact created, then Reservation creation fails, nothing may survive" (§9) surfaced a genuine bug that the original R1.3-I1 test suite had not covered: when `CreateReservationHandler` is invoked with an **externally-supplied** transaction (the `AvailabilityOrchestrator`/capacity-aware path) and a new Contact write is followed by a reservation-validation failure, the handler threw its own private `ReservationFailureAfterContactWrite` — but that exception is only caught by the handler's *own* try/catch around its *self-opened* transaction (the plain, non-capacity path). On the capacity path, nothing catches it: the exception propagated uncaught out of `AvailabilityOrchestrator.createWithCapacity`, which would have surfaced as an unhandled rejection / 500 in production instead of a clean `VALIDATION_FAILED` result.

**Root cause**: the throw-vs-return decision incorrectly keyed off "is a transaction present" rather than "did THIS handler open the transaction." An externally-supplied transaction's owner (`AvailabilityOrchestrator`) already has its own established mechanism (`OrchestratedValidationFailure`) for converting a failed Result from `createHandler.handle()` into a rollback — `CreateReservationHandler` must return the failed Result normally on that path, not throw its own exception into a transaction it does not own.

**Fix**: the throw now additionally requires `!request.tx` (i.e., only throws when this handler opened the transaction itself via `TransactionManager.runInTransaction`; always returns normally when operating inside a caller-supplied `tx`). See `application/command-handlers/CreateReservationHandler.ts`'s updated comment at the fix site for the full reasoning.

**Proof, both paths, real PostgreSQL** (`tests/integration/contact-management.test.ts`):
- Plain path: a `CreateNewContact` reservation for a past date (rejected under `CAP-D01.01-R11` without a historical-correction override) leaves zero Contact rows, zero Reservation rows, zero AppliedCommand rows.
- Capacity-aware path (the path that was broken): the same failure shape via `AvailabilityOrchestrator.createWithCapacity` — now correctly returns `VALIDATION_FAILED` and leaves zero Contact, CapacityCommitment, and Reservation rows, instead of throwing uncaught.

R1.1's transaction/locking guarantees were not touched — the fix is entirely within `CreateReservationHandler`'s own control flow; `AvailabilityOrchestrator`'s lock ordering, `TransactionManager`, and `PrismaCapacityRepository` are unmodified. **PASS (after correction).**

## 8. Idempotency — Proven for the New CreateNewContact Path

Pre-existing idempotency coverage used `ExistingContact` exclusively; this gate adds direct proof for `CreateNewContact`, real PostgreSQL: the same `commandId` submitted twice (both the plain and capacity-aware paths) results in exactly one Contact row, one Reservation row, and (capacity path) exactly one `Committed` CapacityCommitment — never two. **PASS.**

## 9. Legacy Data — Unaffected

No change to schema, migrations, or historical rows was made or needed by this gate's correction (phone normalization is a computed value, not a stored transformation of existing data — `Contact.phoneNormalized` for any Contact created before this gate is recomputed only if that Contact is ever re-created, which never happens; no backfill was run or considered). Legacy `Reservation.contactId` values remain exactly as before. **PASS.**

## 10. Retention

No change. `Contact.lastRelevantActivityAt` remains the retention anchor; automated purge/anonymization remains explicitly out of scope and was not added.

## 11. Out of Scope — Confirmed Untouched

CAP-D05.02/03/04, CRM, loyalty, marketing consent, external partner identity, CAP-D07 integrations, Guestplan migration, historical Contact backfill, automated PII purge, the Konnichiwa website, and deployment were not touched. The `CAP-D05.04` / `CAP-D07.03` external-reference overlap remains `ENGINEERING FOLLOW-UP REQUIRED`, unresolved, exactly as the previous report left it.

## 12. Regression Test Additions

- `tests/domain/phone-number.test.ts` — **new, 10 tests** (§4 above).
- `tests/integration/contact-management.test.ts` — **new, 7 tests**: two possible-match-discovery tests (phone, email — real Postgres), two transaction-integrity tests (plain and capacity-aware paths), two idempotency tests (plain and capacity-aware paths), one snapshot-integrity test.
- `tests/application/create-reservation-handler.test.ts` — **+3 tests**: name+email-only acceptance, name+phone+email acceptance, and the no-auto-merge proof (two `CreateNewContact` submissions with the same phone yield two distinct Contacts).
- One correctness fix to `application/command-handlers/CreateReservationHandler.ts` (§7).
- One dependency added: `libphonenumber-js` (§4).

## 13. Full Regression — Exact Counts

- **TypeScript**: `tsc --noEmit` — clean, zero errors (verified after the library swap and after the transaction-boundary fix).
- **Full automated suite** (`vitest run`, real PostgreSQL for every integration/API test, no weakened or deleted pre-existing tests): **324 passed, 0 failed, 27 files** (up from the previous gate's 304/25 — +20 tests, +2 files, all additive).
- R1.1 capacity/concurrency regression (`availability-create`, `availability-concurrency`, `availability-modify-modify`, `availability-timezone`, `availability-failure-injection`): all passing, unmodified in behavior.
- R1.2 authentication/security regression (`identity-access`, `login-abuse-protection`, the mandatory x-actor-* spoofing regression inside `identity-access.test.ts`): all passing, unmodified.
- R1.3 Contact tests: all passing, including the two new suites above.

## 14. Live Local Smoke Test — All 7 Steps, Local Server Only

Against `tsx api/server.ts` on `localhost:3001`, a freshly bootstrapped Owner (`gate-owner`):

1. **Authenticated** as staff — session cookie established.
2. **Created a reservation + new Contact** (`CreateNewContact`, name/phone/email) — `201`.
3. **Discovered the possible match** via `GET /contacts/possible-matches?phone=0633445566` — a phone formatted *differently* from what was stored (`"06 33 44 55 66"`) still found the same Contact, proving normalized (not literal-string) matching.
4. **Explicitly reused** the found Contact (`ExistingContact`) for a second reservation — `201`.
5. **Explicitly created a new Contact despite the possible match** (submitted `CreateNewContact` again with the same phone) — `201`; a follow-up possible-match query then returned **2** Contacts sharing that phone, proving no silent reuse/merge occurred.
6. **Rejected a nonexistent `ExistingContact`** — `422`, `CAP-D05.01-R01`.
7. **Retrieved the reservation from step 2** and confirmed `contactPhoneSnapshot`/`contactEmailSnapshot` exactly match what was submitted at creation.

No production systems were touched. Server process stopped after the test.

## 15. Repository State After This Gate

- Files changed this gate: `domain/value-objects/PhoneNumber.ts` (rewritten), `application/command-handlers/CreateReservationHandler.ts` (transaction-boundary fix), `package.json`/`package-lock.json` (new dependency), `tests/application/create-reservation-handler.test.ts` (+3 tests), plus two new test files.
- No schema/migration changes this gate.
- One bounded local commit follows this addendum (§18 of the gate instruction) — see the final response for its hash.
- Not pushed. Not deployed. Guestplan and the Konnichiwa website untouched.

## 16. Remaining Limitations (Unchanged From The Original Report)

No standalone `POST /contacts` administrative endpoint; `PATCH /availability/reservations/:id` was not extended to accept `contactPhoneSnapshot`/`contactEmailSnapshot` corrections (staff can still correct these via the plain `PATCH /reservations/:id` route regardless of capacity management); the new capability's rule-model documentation remains scoped to what this implementation enforces, not a full capability documentation suite. None of these were introduced or worsened by this gate.
