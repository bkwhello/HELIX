# OD2-CAND-2 — Stage 2 Evidence Intake Request Package (BE-01–BE-08)

---

Date: 13 August 2026. Author: Claude, acting as an **independent HELIX Organizational Design Engineer** for EC-002, scoped exclusively to preparing this intake package under decisions/DD-030's Case-Owner Decision (Kelvin Wong, 13 August 2026, APPROVED WITH CONDITIONS FOR BOUNDED STAGE 2 EVIDENCE COLLECTION). **This task creates the intake package only.** No evidence is collected, inspected, or classified; no evidence ID, observation, claim, or classification gate is created; no hosting, WordPress, DirectAdmin, database, or CDN system is accessed.

## Document Status

```yaml
Status: Prepared — No Evidence Supplied or Collected
Authority: DD-030 Case-Owner Decision
Collection Mode: Owner-Supplied Redacted Evidence Only
Collection Started: false
Evidence IDs Assigned: none
Classification Performed: false
```

## Precondition Check

| # | Check | Result |
|---|---|---|
| 1 | Branch `feat/ec-002-visibility-baseline`, local HEAD = origin HEAD = `79c8bbac310ee59cdc1f68ffb8f8808eebb78125` | **PASS** |
| 2 | Working tree clean at start | **PASS** |
| 3 | Local/remote branch synchronized | **PASS** |
| 4 | `current_stage: Organizational Design` | **PASS** |
| 5 | decisions/DD-030 Gate Verdict: PASSED WITH CONDITIONS | **PASS** |
| 6 | decisions/DD-030 Case-Owner Decision: APPROVED WITH CONDITIONS FOR BOUNDED STAGE 2 EVIDENCE COLLECTION | **PASS** |
| 7 | Condition sets binding: DD-029 Set A (9), DD-030 Set B (7), DD-030 additional (17) | **PASS** |
| 8 | Approved scope exactly BE-01–BE-08 | **PASS** |
| 9 | No BE item Essential | **PASS** |
| 10 | Collection mode: Owner-Supplied Redacted Evidence Only | **PASS** |
| 11 | Direct authenticated access unauthorized | **PASS** |
| 12 | `od_002_stage_2_collection_started: false` | **PASS** |
| 13 | `od_002_stage_2_authorized: false` | **PASS** |
| 14 | OD-002 Design unestablished | **PASS** |
| 15 | Stage 1: `CS-4 — Insufficient Evidence` | **PASS** |
| 16 | Host/Varnish for konnichiwa.nl: Unconfirmed/Unconfirmed | **PASS** |
| 17 | Transformation and external changes unauthorized | **PASS** |
| 18 | No prior Stage 2 Evidence Intake Request Package exists | **PASS** |

All eighteen preconditions pass. Proceeding.

---

## Section 1 — Instructies voor Kelvin

Dit is geen verplichte lijst — het is een menu. Je hoeft niet alles aan te leveren, en "niet beschikbaar" is voor elk punt een prima, geldig antwoord.

**Wat je wel kunt aanleveren:**
- Alleen bewijs dat al bestaat en dat je kunt bekijken zonder ergens een instelling te wijzigen.
- Maak zelf een screenshot of exporteer een bestand — ik log nergens zelf op in, dat mag ook niet.
- Snijd of blur gevoelige informatie eruit vóórdat je iets uploadt.
- Deel nooit wachtwoorden, inlogcodes of klantgegevens — ook niet per ongeluk zichtbaar in een screenshot.

**"Niet beschikbaar" is een geldig antwoord.** Als iets niet bestaat, niet te vinden is, of je weet het niet — zeg dat gewoon. Dat wordt niet uitgelegd als "dus is er niets aan de hand" — het blijft gewoon onbekend.

**Wat je NIET moet doen, ook niet om iets beschikbaar te maken:**
- Geen logging, profiling, debugging of monitoring aanzetten.
- Geen plugins installeren.
- Geen SQL of PHP-code uitvoeren.
- Geen supportverzoek indienen bij je hostingpartij om nieuw bewijs te krijgen — deze toestemming dekt dat niet.
- Geen nieuwe publieke tests of metingen uitvoeren op de site.
- Het aanleveren van bewijs betekent niet dat er al iets gewijzigd of geïmplementeerd mag worden — dat blijft apart besloten.

**Stop-waarschuwing:** stop meteen en lever het niet aan als een scherm per ongeluk wachtwoorden, tokens, klantgegevens, reserveringsgegevens, IP-adressen, interne serverpaden, gegevens van een ander domein, of andere accountgegevens laat zien die niet van jou/Konnichiwa zijn. Maak in dat geval een nieuwe screenshot waarin dat wél is weggehaald, of sla dat item over.

---

## Section 2 — BE-01–BE-08 Request Cards

Every card below uses the exact identifiers, definitions, and classifications from design/OD2-CAND-2-origin-backend-evidence-observability-specification.md (as readiness-reviewed and corrected by decisions/DD-030) — none renamed, merged, broadened, or reclassified.

### BE-01 — Hosting response-time overview

| Field | Value |
|---|---|
| Readiness classification (decisions/DD-030) | **Ready** |
| Purpose | Establish whether the origin server, in aggregate, is under load or slow to respond |
| Why it may be useful | Corroborating context for backend/origin timing |
| Optional or conditional | **Optional** |
| Permitted source/screen | An existing, already-visible hosting dashboard (e.g., "Resource Usage" in DirectAdmin) |
| Screenshot/export requested | One screenshot of that existing dashboard screen, as currently displayed |
| Minimum visible fields | Resource-usage summary values, capture date |
| Must not be visible | Account credentials, unredacted server IP, unrelated domains on the same account |
| Required cropping/redaction | Crop personal name, unrelated account totals, unrelated domain names |
| Acceptable response | Supplied / Partially Supplied / Not Available / Unknown / Declined |
| Owner Declaration acceptable? | No — this item is a system screenshot only; a declaration does not substitute for it |
| Evidence class | Restricted origin/backend observability evidence |
| Configured/delivered relevance | Not applicable |
| Account-level or domain-level limitation | Account-wide, not request-specific |
| CE-DQ4-A/B discrimination value | None alone — corroborating only |
| Known limitation | Does not distinguish PHP vs. DB vs. queuing specifically |
| Explicitly prohibited actions | Generating a new report; changing any dashboard setting |
| New authorization required? | No |

### BE-02 — PHP execution information

| Field | Value |
|---|---|
| Readiness classification (decisions/DD-030) | **Ready With Conditions** |
| Purpose | Establish whether PHP/application execution time itself is elevated |
| Why it may be useful | **Most directly discriminates CE-DQ4-A (backend/origin processing)** |
| Optional or conditional | **Conditional** — only if an existing, non-invasive report exists |
| Permitted source/screen | An existing PHP timing report already exposed by the hosting provider, if any |
| Screenshot/export requested | One screenshot or export of that existing report only |
| Minimum visible fields | Reported execution-time values, capture date, scope (account-wide vs. domain-specific, if stated) |
| Must not be visible | Raw request parameters, customer data, credentials |
| Required cropping/redaction | Same discipline as BE-01 |
| Acceptable response | Supplied / Partially Supplied / Not Available / Unknown / Declined |
| Owner Declaration acceptable? | No — direct report only |
| Evidence class | Restricted origin/backend observability evidence |
| Configured/delivered relevance | Not applicable |
| Account-level or domain-level limitation | Scope must be checked; account-wide figures do not by themselves establish konnichiwa.nl specifically |
| CE-DQ4-A/B discrimination value | **Highest of all BE items — directly discriminates CE-DQ4-A** |
| Known limitation | No such report was observed in this account's DirectAdmin menu during Stage 1 — likely resolves to Not Available |
| Explicitly prohibited actions | **Do not enable profiling. Do not enable debug mode.** No such request is made or implied by this card. |
| New authorization required? | Yes, and out of scope entirely, for any profiling/debug activation — not requested here |

### BE-03 — Database/query information

| Field | Value |
|---|---|
| Readiness classification (decisions/DD-030) | **Ready With Conditions** |
| Purpose | Establish whether database query time itself is elevated |
| Why it may be useful | Discriminates a sub-component of CE-DQ4-A |
| Optional or conditional | **Conditional** — only if an existing, aggregated report exists |
| Permitted source/screen | An existing, aggregated slow-query summary, if the provider offers one |
| Screenshot/export requested | One screenshot or export of that existing, aggregated report only |
| Minimum visible fields | Aggregated timing figures (e.g., average/percentile query time), capture date, scope |
| Must not be visible | Raw SQL, table names, customer records, database credentials, database names |
| Required cropping/redaction | Any query text, table/schema name, or row-level content must be excluded entirely, not merely blurred |
| Acceptable response | Supplied / Partially Supplied / Not Available / Unknown / Declined |
| Owner Declaration acceptable? | No — aggregated report only |
| Evidence class | Restricted origin/backend observability evidence |
| Configured/delivered relevance | Not applicable |
| Account-level or domain-level limitation | Scope must be checked, same as BE-02 |
| CE-DQ4-A/B discrimination value | Partial — a sub-component of CE-DQ4-A |
| Known limitation | No slow-query dashboard was observed in this account's menu during Stage 1 — likely resolves to Not Available |
| Explicitly prohibited actions | See phpMyAdmin notice below |
| New authorization required? | Yes, for anything beyond an already-existing aggregated summary |

> **phpMyAdmin: Unsafe Without New Authorization.** This card does **not** provide instructions for opening phpMyAdmin, does **not** request a database screenshot from it, and does **not** include any SQL, table name, query, schema inspection, or record-level access. If your hosting panel's only route to query timing is phpMyAdmin, the correct response for BE-03 is **Not Available** — not a phpMyAdmin screenshot.

### BE-04 — Resource-utilization history

| Field | Value |
|---|---|
| Readiness classification (decisions/DD-030) | **Ready** |
| Purpose | Establish whether the hosting account is under CPU/memory/I/O saturation |
| Why it may be useful | Corroborating context for queuing/contention |
| Optional or conditional | **Optional** |
| Permitted source/screen | The same "Resource Usage" dashboard as BE-01 |
| Screenshot/export requested | One screenshot of that existing dashboard screen |
| Minimum visible fields | Resource-usage history values, capture date/period |
| Must not be visible | Same as BE-01 |
| Required cropping/redaction | Same as BE-01 |
| Acceptable response | Supplied / Partially Supplied / Not Available / Unknown / Declined |
| Owner Declaration acceptable? | No |
| Evidence class | Restricted origin/backend observability evidence |
| Configured/delivered relevance | Not applicable |
| Account-level or domain-level limitation | Account-wide, not request-specific |
| CE-DQ4-A/B discrimination value | None alone |
| Known limitation | Account-wide only |
| Explicitly prohibited actions | Generating a new report; changing any dashboard setting |
| New authorization required? | No |

### BE-05 — Error/timeout summary

| Field | Value |
|---|---|
| Readiness classification (decisions/DD-030) | **Ready With Conditions** |
| Purpose | Establish whether timeouts or 5xx errors correlate with the poor-TTFB tail |
| Why it may be useful | Reactive/descriptive signal alongside timing evidence |
| Optional or conditional | **Optional** |
| Permitted source/screen | "PHP error log" ("Show log" option in the same DirectAdmin menu) |
| Screenshot/export requested | One screenshot or export of **aggregated counts only** |
| Minimum visible fields | Error/timeout counts by type and date range |
| Must not be visible | Raw log lines containing personal information, tokens, or full request parameters |
| Required cropping/redaction | **Aggregation-verification condition (preserved):** if only raw log lines are available (no aggregated view), do **not** submit them — record BE-05 as Not Available in aggregated form instead |
| Acceptable response | Supplied / Partially Supplied / Not Available / Unknown / Declined |
| Owner Declaration acceptable? | No |
| Evidence class | Restricted origin/backend observability evidence |
| Configured/delivered relevance | Not applicable |
| Account-level or domain-level limitation | Depends on log scope; must be stated if known |
| CE-DQ4-A/B discrimination value | None alone — corroborating only |
| Known limitation | Not a direct timing measurement |
| Explicitly prohibited actions | Enabling debug-level logging to produce this; submitting raw, unaggregated log lines |
| New authorization required? | No, for an aggregated view; raw logs are out of scope regardless |

### BE-06 — Deployment/configuration history

| Field | Value |
|---|---|
| Readiness classification (decisions/DD-030) | **Ready With Conditions** |
| Purpose | Establish whether a caching or PHP-version change was made around when the TTFB tail was measured |
| Why it may be useful | Potentially explanatory context, if a dated change aligns with the measurement window |
| Optional or conditional | **Optional** |
| Permitted source/screen | A dated change record, if the provider retains one, or Kelvin's own recollection |
| Screenshot/export requested | One screenshot/export of an existing record, or a dated statement |
| Minimum visible fields | Change type, date, scope |
| Must not be visible | Credentials, unrelated account history |
| Required cropping/redaction | Same general discipline as other items |
| Acceptable response | Supplied / Partially Supplied / Not Available / Unknown / Declined |
| Owner Declaration acceptable? | **Yes** — if no system record exists, a dated recollection is acceptable, recorded as lower-confidence |
| Evidence class | Restricted origin/backend observability evidence, or Owner Declaration if no system record exists |
| Configured/delivered relevance | Not applicable |
| Account-level or domain-level limitation | Depends on the record's own scope |
| CE-DQ4-A/B discrimination value | None alone — contextual only |
| Known limitation | **Low-yield/overlap condition (preserved):** likely thin, and overlaps with BE-08 if no system record exists |
| Explicitly prohibited actions | Making a new change to produce this record |
| New authorization required? | No |

### BE-07 — Provider diagnostics

| Field | Value |
|---|---|
| Readiness classification (decisions/DD-030) | **Ready With Conditions** |
| Purpose | Establish whether Vimexx/DirectAdmin publishes any generic diagnostics for this account beyond what has already been seen |
| Why it may be useful | Corroborating, provider-sourced context |
| Optional or conditional | **Optional** |
| Permitted source/screen | Existing provider-generated diagnostics only |
| Screenshot/export requested | One screenshot of an already-existing diagnostics screen |
| Minimum visible fields | Whatever the diagnostics screen displays, capture date |
| Must not be visible | Credentials, unrelated account/customer data |
| Required cropping/redaction | Same general discipline as other items |
| Acceptable response | Supplied / Partially Supplied / Not Available / Unknown / Declined |
| Owner Declaration acceptable? | No |
| Evidence class | Provider-attested evidence |
| Configured/delivered relevance | Not applicable |
| Account-level or domain-level limitation | Likely account-wide |
| CE-DQ4-A/B discrimination value | None alone |
| Known limitation | Realistically low-yield — nothing beyond AWStats/Resource Usage/PHP error log was observed in this account during Stage 1 |
| Explicitly prohibited actions | **Do not contact provider support to request new diagnostics.** This card requests only what already exists and is already visible. |
| New authorization required? | Yes, for contacting support — not requested here |

### BE-08 — Owner operational declaration

| Field | Value |
|---|---|
| Readiness classification (decisions/DD-030) | **Ready** |
| Purpose | Fill gaps where no system evidence exists (e.g., "has the site felt slow at a particular time of day?") |
| Why it may be useful | A bounded fallback when nothing else is available |
| Optional or conditional | **Optional** |
| Permitted source/screen | Not applicable — a direct, dated statement from Kelvin |
| Screenshot/export requested | None — a written statement only |
| Minimum visible fields | Statement text, date given, explicit scope of what is/is not being attested |
| Must not be visible | Not applicable |
| Required cropping/redaction | Not applicable |
| Acceptable response | Supplied / Partially Supplied / Not Available / Unknown / Declined |
| Owner Declaration acceptable? | **Yes — this item is itself an Owner Declaration** |
| Evidence class | Owner Declaration |
| Configured/delivered relevance | Not applicable |
| Account-level or domain-level limitation | Not applicable |
| CE-DQ4-A/B discrimination value | None — supporting context only, explicitly lower-confidence, never upgraded to system-observation confidence |
| Known limitation | Not system-verified |
| Explicitly prohibited actions | None |
| New authorization required? | No |

---

## Section 3 — Evidence Priority (non-mandatory)

**Priority 1 — Safe, existing and potentially discriminating**
- BE-02 (PHP execution information)
- BE-03 (Database/query information — aggregated report only, never phpMyAdmin)

**Priority 2 — Useful only if already available**
- BE-01 (Hosting response-time overview)
- BE-04 (Resource-utilization history)
- BE-05 (Error/timeout summary, aggregated only)
- BE-06 (Deployment/configuration history)
- BE-07 (Provider diagnostics)
- BE-08 (Owner operational declaration)

**Do Not Collect Under Current Authorization**
- phpMyAdmin access of any kind (referenced only within BE-03)
- Any credential, password, API key, token, cookie, or session identifier
- Any profiling or debug-mode activation (referenced only within BE-02)
- Any raw, unaggregated log export
- Any customer or reservation data
- Any configuration change of any kind
- Any new provider-support request (referenced only within BE-07)

No item above is marked Essential — this priority order reflects safety and likely usefulness only, not a requirement.

---

## Section 4 — Redaction Checklist

Before any file is supplied, confirm each of the following has been removed or is not present:

- [ ] Usernames, where not essential to identify the source
- [ ] Account/customer numbers
- [ ] Email addresses
- [ ] Phone numbers
- [ ] Passwords
- [ ] API keys
- [ ] Tokens
- [ ] Cookies
- [ ] Session identifiers
- [ ] Database credentials
- [ ] Visitor IP addresses
- [ ] Customer or reservation data
- [ ] Payment/billing data
- [ ] Internal server file paths
- [ ] Neighbouring/unrelated domains
- [ ] Unrelated account or hosting data

**Evidence that fails this review must not be stored in this repository** — it is returned for re-redaction or recorded as Not Available, never ingested as-is and redacted afterward.

---

## Section 5 — Submission Manifest Template (blank)

| Input ID | Supplied filename | Owner | Owner-provided capture date/time | Timezone | Mapped BE item | Source system/screen | Domain/account scope | Evidence class | Configured/delivered relevance | Redaction completed | Privacy review status | Limitations | Initial intake status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| | | | | | | | | | | | | | |
| | | | | | | | | | | | | | |
| | | | | | | | | | | | | | |

No Input ID is assigned by this task — the manifest is blank, for future use only. No EV, O, OC, OD, or new CSE identifier is created here.

---

## Section 6 — Owner Response Template

```
BE-01: <Supplied / Partial / Not Available / Unknown / Declined>
BE-02: <Supplied / Partial / Not Available / Unknown / Declined>
BE-03: <Supplied / Partial / Not Available / Unknown / Declined>
BE-04: <Supplied / Partial / Not Available / Unknown / Declined>
BE-05: <Supplied / Partial / Not Available / Unknown / Declined>
BE-06: <Supplied / Partial / Not Available / Unknown / Declined>
BE-07: <Supplied / Partial / Not Available / Unknown / Declined>
BE-08: <Supplied / Partial / Not Available / Unknown / Declined>
```

For every item marked Supplied or Partial, include:

- filename;
- capture date;
- timezone;
- system/screen;
- domain or account scope;
- whether redaction is complete;
- short owner note.

**Required declaration, to accompany any submission:**

> "I confirm that the supplied files were captured by me through read-only use, were redacted before submission, and required no configuration change, debugging, profiling, new monitoring, SQL/PHP execution or credential sharing."

This declaration is an Owner Declaration — it is not itself system evidence, and does not substitute for any BE item's own required evidence class.

---

## Section 7 — Future Intake and Classification Process (described, not executed)

1. Precondition verification.
2. Privacy review before repository intake.
3. Input manifest creation.
4. BE mapping.
5. Visible-fact extraction only.
6. Evidence-class assignment.
7. Configured/delivered and account/domain separation.
8. Missing-evidence recording.
9. Independent challenge.
10. Separate classification gate.
11. Case-owner acceptance.

**Stated explicitly, in advance:**

- No submitted file automatically proves backend delay.
- No missing file proves a healthy or absent mechanism.
- No result automatically starts unrestricted Stage 2.
- No result establishes OD-002 Design.
- No result authorizes a technical intervention or Transformation.

---

## Section 8 — Approval and Execution Boundary

decisions/DD-030 already authorizes bounded intake preparation and later owner-supplied evidence collection within BE-01–BE-08, under Condition Sets A and B and the seventeen additional conditions recorded there. **This task itself does not start collection.**

```
Evidence package prepared.
Awaiting owner-supplied, redacted files or explicit Not Available responses.
No evidence has been collected or classified.
```
