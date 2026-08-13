# OD2-CAND-2 — Origin/Backend Evidence Request and Observability Specification

---

Date: 13 August 2026. Author: Claude, acting as an **independent HELIX Organizational Design Engineer** for EC-002, scoped exclusively to OD2-CAND-2 under decisions/DD-029's Case-Owner Decision (Kelvin Wong, 13 August 2026, AUTHORIZED WITH CONDITIONS TO PREPARE STAGE 2 SPECIFICATION). **This is a specification only — it defines what evidence would inform whether origin/backend processing is associatively consistent with the observed mobile TTFB condition, and how Kelvin could supply it. It does not execute anything.** No hosting, WordPress, DirectAdmin, database, or CDN system is accessed by this document; no BE item is collected; no configuration is accessed or changed; Stage 2 evidence collection is not authorized by this document; OD-002 Design is not established; Transformation is not entered.

## Explicit Non-Assumptions

This specification does not assume, anywhere below:

- that Varnish is active for konnichiwa.nl;
- that Konnichiwa has no HTML caching;
- that backend processing causes the 26% poor mobile TTFB tail;
- that cache absence has been established;
- that a technical intervention is required;
- that better TTFB will improve rankings, conversions, revenue, or reservations.

---

## Status

**Not executed.** Specification only, per decisions/DD-029's Case-Owner Decision (Authorization limited to preparing this document). Bounded evidence collection under this specification does not begin until Kelvin issues a separate, explicit approval — see Phase 10.

## Precondition Check

| # | Check | Result |
|---|---|---|
| 1 | Branch `feat/ec-002-visibility-baseline` | **PASS** |
| 2 | Local HEAD = origin HEAD = `e423df6adbc66251080479de5fc95860689ed5f3` | **PASS** |
| 3 | Working tree clean at start | **PASS** |
| 4 | `current_stage: Organizational Design` | **PASS** |
| 5 | decisions/DD-029 Case-Owner Decision: `AUTHORIZED WITH CONDITIONS TO PREPARE STAGE 2 SPECIFICATION` | **PASS** |
| 6 | All nine decisions/DD-029 binding conditions remain binding | **PASS** |
| 7 | OD2-CAND-2: `Selected Conditionally — Stage 2 Pending Stage 1 Review` | **PASS** |
| 8 | Stage 1: `Completed — Evidence Insufficient / Approved Evidence Exhausted` | **PASS** |
| 9 | Stage 1 classification: `CS-4 — Insufficient Evidence` | **PASS** |
| 10 | `od_002_stage_2_specification_preparation_authorized: true` | **PASS** |
| 11 | `od_002_stage_2_specification_created: false` (prior to this task) | **PASS** |
| 12 | `od_002_stage_2_evidence_collection_authorized: false` | **PASS** |
| 13 | `od_002_stage_2_authorized: false` | **PASS** |
| 14 | `transformation_authorized: false`, `external_changes_authorized: false` | **PASS** |
| 15 | No prior OD2-CAND-2 Stage 2 specification exists | **PASS** |

---

## Phase 1 — Authority and Boundaries

| Field | Value |
|---|---|
| Authority | decisions/DD-029, Case-Owner Decision (Kelvin Wong, 13 August 2026) |
| Design foundation | OD-002 — diagnosis/OD-002-absence-of-html-caching-layer.md (Established Organizational Diagnosis, Conditional, decisions/DD-018) |
| Selected candidate | OD2-CAND-2 — Origin/Backend-Processing Observability (design/OD-002-design-workstream.md, Phase 5) |
| Activity class | **Specification Preparation Only** |
| Evidence collection | **Not Authorized** |
| Authenticated access | **Not Authorized** |
| Implementation and mutation | **Not Authorized** |

### DD-029 Binding Conditions (carried forward verbatim, all nine, unweakened)

1. The specification must ground its own justification in the CE-DQ4-A/CE-DQ4-B entanglement (open since decisions/DD-018), never in "Stage 1 is closed" as a standalone reason.
2. The specification must pre-register "Not Available" as a legitimate, non-blocking outcome for BE-02 and BE-03 specifically, and must not route toward credentialed or phpMyAdmin-style access to obtain them.
3. The specification must pre-register "Insufficient Evidence" as a legitimate, closed-for-now Stage 2 outcome, mirroring OD2-REQ-003 and Stage 1's own CS-4 precedent — Stage 2 is not guaranteed to resolve the CE-DQ4-A/B entanglement, and must not imply otherwise.
4. Every BE-01–BE-08 item's classification carries forward into the specification unmodified; phpMyAdmin remains explicitly Unsafe Without New Authorization.
5. G-01's three-way routing table governs any future evidence outcome — non-registered mechanisms return to Diagnosis; dispositive entanglement-resolving evidence triggers a lifecycle-decision pause, per Binding Boundary 12/OD2-REQ-014 and decisions/DD-022 Common Condition 10.
6. G-05 through G-09's access, privacy, reversibility, and stop rules apply in full to the specification and to any future collection under it.
7. Gates 2 through 5 (collection, classification acceptance, Design establishment, Transformation) each require their own, later, separate, explicit case-owner decision — none is authorized now, and none may be inferred from acceptance of decisions/DD-029.
8. No credential, password, API key, token, cookie, or FTP/SSH/database access may be requested or stored, at any stage.
9. All conditions from decisions/DD-018 (eleven), DD-022 (twenty), DD-025 (twenty-one), DD-026 (eight gate + twenty-seven acceptance), DD-027 (twenty-one), and DD-028 (nine gate + twenty-nine acceptance) remain independently binding and are not narrowed by this specification.

### Prior Decisions Referenced, Not Weakened or Replaced

decisions/DD-018 (DQ-004 Diagnosis Establishment); DD-022 (Design Authorization); DD-025 (OD-002 Design Readiness, Candidate Selection); DD-026 (OD2-CAND-3 Specification Readiness and Collection Approval); DD-027 (Cache-State Classification, Round 1–2); DD-028 (Cache-State Round 3 Classification, Stage 1 Closure); DD-029 (Stage 2 Specification-Preparation Authorization). None of these is lifted, narrowed, or reinterpreted below.

---

## Phase 2 — Question to Be Tested

> **What observable evidence, if any, distinguishes origin/backend processing from cache-layer delivery, network conditions, CrUX aggregation effects, page mix, and time/load variability as a contributor to the elevated mobile TTFB baseline?**

- This is **mechanism discrimination within Organizational Design** — comparing already-registered candidate mechanisms (CE-DQ4-A through G, diagnosis/DQ-004-investigation.md Phase 3), not a new causal diagnosis.
- It is **not** a new causal diagnosis question, and does not ask "what causes the 26% poor TTFB tail?" as an unrestricted question.
- **Evidence Insufficient is a valid, legitimate outcome** — Stage 1's own CS-4 closure (decisions/DD-028) is the direct precedent.
- This specification is **valid whether backend processing turns out to be fast, slow, variable, or unobservable** — no branch of Phase 7's outcome routing presupposes any of these.
- **Scope boundary, added by decisions/DD-030's independent review (13 August 2026):** the question above names six factors, but this specification's own BE-01–BE-08 evidence manifest (Phase 3) addresses **only** origin/backend processing (CE-DQ4-A) and cache-layer delivery (CE-DQ4-B) context. **CE-DQ4-C (geographic/network distance), CE-DQ4-E (CrUX aggregation/page-mix), CE-DQ4-F (mobile network/radio conditions), and CE-DQ4-G (time/load variability) remain entirely outside this specification's evidence manifest** — they are OD2-CAND-4's separate, unselected remit (design/OD-002-design-workstream.md, Phase 5), not addressed by any BE item here. Any reading of this specification as capable of resolving all six named factors is a misreading; it can speak only to the CE-DQ4-A/CE-DQ4-B pair.

---

## Phase 3 — Evidence Manifest (BE-01 Through BE-08)

Each item below carries forward decisions/DD-029's own BE-01–BE-08 identifiers and classifications **unmodified, unrenamed, unmerged, unbroadened** — this phase adds the collection-level fields DD-029 (an authorization gate) did not itself need to specify.

### BE-01 — Hosting response-time overview

| Field | Value |
|---|---|
| Exact question | Is the origin server, in aggregate, under load or slow to respond? |
| Evidence source/screen | A generic hosting dashboard (e.g., "Resource Usage," present in the same DirectAdmin panel explored during Stage 1 Round 1–3) |
| Evidence class | Restricted origin/backend observability evidence |
| Collection method | Owner-supplied screenshot of an already-existing dashboard screen |
| Minimum visible fields | Resource-usage summary values as displayed (e.g., CPU/memory/I/O totals), capture date |
| Prohibited fields | Account credentials, server IP (unless already redacted per prior-round precedent), unrelated domains on the same account |
| Redaction requirements | Same discipline as design/EC-002-OD2-CAND-3-Evidence-Intake.md Round 1–3: crop personal name, unrelated account totals not needed, unrelated domain names |
| Owner | Kelvin |
| Access requirement | Existing dashboard screenshot only — no new report generation, no configuration access |
| Existing evidence sufficient? | Unknown — not yet supplied |
| Sufficiency rule | Corroborating only; never sufficient alone to answer the Phase 2 question |
| Limitation | Does not distinguish PHP vs. DB vs. queuing specifically; account-wide, not request-specific |
| Missing-evidence classification | Not Available (if no such dashboard exists or Kelvin cannot access it) — never encoded as "server not under load" |
| Distinguishes CE-DQ4-A from CE-DQ4-B? | No, on its own — corroborating context only |
| Separate approval required before collection? | No — within the already-approved, existing-dashboard-only scope of decisions/DD-029 |
| **Classification (from decisions/DD-029, unchanged)** | **Useful but Non-Blocking** |

### BE-02 — PHP execution information

| Field | Value |
|---|---|
| Exact question | Is PHP/application execution time itself elevated? |
| Evidence source/screen | An existing, non-invasive PHP timing report, if the hosting provider offers one |
| Evidence class | Restricted origin/backend observability evidence |
| Collection method | Owner-supplied screenshot or export of an already-existing report only |
| Minimum visible fields | Reported execution-time values, capture date, scope (account-wide vs. domain-specific, if stated) |
| Prohibited fields | Raw request parameters, customer data, credentials |
| Redaction requirements | Same discipline as BE-01 |
| Owner | Kelvin |
| Access requirement | Existing report only — **profiling or debug logging must not be enabled to produce this item; that is explicitly excluded from this item's own definition** |
| Existing evidence sufficient? | Unknown; no such report was observed in this account's DirectAdmin menu during Stage 1 Round 1–3 (Cronjobs, PHP version selector, PHP error log — no timing report seen) |
| Sufficiency rule | Would directly discriminate CE-DQ4-A if an aggregated, non-invasive execution-time figure exists; a single unverified number without a stated scope/period is insufficient |
| Limitation | Likely resolves to Not Available, per what has already been observed of this account's diagnostic surface |
| Missing-evidence classification | **Not Available is a legitimate, non-blocking outcome (Phase 7)** — never encoded as "PHP execution is fast" or "PHP execution is not a factor" |
| Distinguishes CE-DQ4-A from CE-DQ4-B? | **Yes, directly, if obtained** — this is the item most load-bearing for CE-DQ4-A specifically |
| Separate approval required before collection? | No, for an existing report; **Yes, and out of scope entirely**, for enabling any profiling/debug mechanism to produce one |
| **Classification (from decisions/DD-029, unchanged)** | **Conditional** — essential *if* it exists; existence unconfirmed |

### BE-03 — Database/query information

| Field | Value |
|---|---|
| Exact question | Is database query time itself elevated? |
| Evidence source/screen | An aggregated slow-query summary, fully redacted, if the provider offers one |
| Evidence class | Restricted origin/backend observability evidence |
| Collection method | Owner-supplied export/screenshot of an already-existing, aggregated report only |
| Minimum visible fields | Aggregated timing figures (e.g., average/percentile query time), capture date, scope |
| Prohibited fields | **Raw SQL queries, table names, customer records, database credentials, database names** — none of these may appear in any collected item or anywhere in this repository |
| Redaction requirements | Any query text, table/schema name, or row-level content is rejected outright, not redacted-and-kept |
| Owner | Kelvin |
| Access requirement | Existing, aggregated report only |
| Existing evidence sufficient? | Unknown; no slow-query dashboard was observed in this account's DirectAdmin menu during Stage 1 Round 1–3 |
| Sufficiency rule | Would discriminate a sub-component of CE-DQ4-A if an aggregated figure exists; raw query logs are never accepted regardless of aggregation claims made about them |
| Limitation | Likely resolves to Not Available |
| Missing-evidence classification | Not Available — never encoded as "database is fast" or "database is not a factor" |
| Distinguishes CE-DQ4-A from CE-DQ4-B? | Yes, partially, if obtained — a sub-component of backend processing |
| Separate approval required before collection? | No, for an existing aggregated report |
| **phpMyAdmin (same DirectAdmin menu)** | **Explicitly not an approved route under this item — remains `Unsafe Without New Authorization`** (see Phase 6). Logging into phpMyAdmin, browsing tables, or running any query is out of scope entirely; no SQL statement, table name, or database-browsing instruction appears anywhere in this specification. |
| **Classification (from decisions/DD-029, unchanged)** | **Conditional**, with phpMyAdmin itself flagged **Unsafe Without New Authorization** |

### BE-04 — Resource-utilization history

| Field | Value |
|---|---|
| Exact question | Is the hosting account under CPU/memory/I/O saturation? |
| Evidence source/screen | The same "Resource Usage" dashboard as BE-01 |
| Evidence class | Restricted origin/backend observability evidence |
| Collection method | Owner-supplied screenshot of an already-existing dashboard screen |
| Minimum visible fields | Resource-usage history values as displayed, capture date/period |
| Prohibited fields | Same as BE-01 |
| Redaction requirements | Same as BE-01 |
| Owner | Kelvin |
| Access requirement | Existing dashboard screenshot only |
| Existing evidence sufficient? | Unknown — not yet supplied |
| Sufficiency rule | Corroborating context for queuing/contention only; not sufficient alone |
| Limitation | Account-wide, not request-specific |
| Missing-evidence classification | Not Available |
| Distinguishes CE-DQ4-A from CE-DQ4-B? | No, on its own |
| Separate approval required before collection? | No |
| **Classification (from decisions/DD-029, unchanged)** | **Useful but Non-Blocking** |

### BE-05 — Error/timeout summary

| Field | Value |
|---|---|
| Exact question | Do timeouts or 5xx errors correlate with the poor-TTFB tail? |
| Evidence source/screen | "PHP error log" ("Show log" option, seen in the same DirectAdmin menu explored during Stage 1) |
| Evidence class | Restricted origin/backend observability evidence |
| Collection method | Owner-supplied screenshot or export of **aggregated counts only** |
| Minimum visible fields | Error/timeout counts by type and date range |
| Prohibited fields | **Raw log lines containing personal information, tokens, or full request parameters — these are rejected outright, not redacted-and-kept** |
| Redaction requirements | If only raw log lines are available (no aggregated view), this item is not collected in that form — it is recorded as Not Available in aggregated form, not substituted with raw logs |
| Owner | Kelvin |
| Access requirement | Existing log/report only; no debug-level logging is enabled to produce this |
| Existing evidence sufficient? | Unknown — not yet supplied |
| Sufficiency rule | Reactive signal only; correlation with the TTFB tail, if any, is descriptive, not a timing measurement |
| Limitation | Not a direct timing measurement |
| Missing-evidence classification | Not Available |
| Distinguishes CE-DQ4-A from CE-DQ4-B? | No, on its own — corroborating only |
| Separate approval required before collection? | No, for an aggregated view; raw logs are out of scope regardless |
| **Classification (from decisions/DD-029, unchanged)** | **Useful but Non-Blocking** |

### BE-06 — Deployment/configuration history

| Field | Value |
|---|---|
| Exact question | Was a caching or PHP-version change made around when the TTFB tail was measured? |
| Evidence source/screen | A dated change record, if the provider retains one, or Kelvin's own recollection |
| Evidence class | Restricted origin/backend observability evidence, or Owner Declaration if no system record exists |
| Collection method | Owner-supplied export/screenshot of an existing record, or a dated Owner Declaration |
| Minimum visible fields | Change type, date, scope |
| Prohibited fields | Credentials, unrelated account history |
| Redaction requirements | Same general discipline as other items |
| Owner | Kelvin |
| Access requirement | Existing record or Owner Declaration only — no new change is made to produce this |
| Existing evidence sufficient? | Unknown; no such log was observed in the explored panel during Stage 1 |
| Sufficiency rule | Potentially explanatory if a dated change aligns with the measurement window; a vague or undated recollection is Owner Declaration only, lower confidence |
| Limitation | Likely thin |
| Missing-evidence classification | Not Available |
| Distinguishes CE-DQ4-A from CE-DQ4-B? | No, on its own — contextual only |
| Separate approval required before collection? | No |
| **Classification (from decisions/DD-029, unchanged)** | **Conditional**, overlapping with BE-08 if no system record exists |

### BE-07 — Provider diagnostics

| Field | Value |
|---|---|
| Exact question | Does Vimexx/DirectAdmin publish any generic diagnostics for this account beyond what has already been seen? |
| Evidence source/screen | Existing provider-generated diagnostics only |
| Evidence class | Provider-attested evidence |
| Collection method | Owner-supplied screenshot of an already-existing diagnostics screen |
| Minimum visible fields | Whatever the diagnostics screen displays, capture date |
| Prohibited fields | Credentials, unrelated account/customer data |
| Redaction requirements | Same general discipline as other items |
| Owner | Kelvin |
| Access requirement | Existing diagnostics only — **no new support ticket is authorized by this specification** |
| Existing evidence sufficient? | Unknown; nothing beyond AWStats/Resource Usage/PHP error log was observed in Stage 1 Round 1–3's exploration of this exact panel |
| Sufficiency rule | Corroborating only |
| Limitation | Realistically low-yield given what Round 1–3 already surfaced |
| Missing-evidence classification | Not Available |
| Distinguishes CE-DQ4-A from CE-DQ4-B? | No, on its own |
| Separate approval required before collection? | No, for existing diagnostics; **Yes**, and out of scope entirely, for contacting provider support to request new diagnostics |
| **Classification (from decisions/DD-029, unchanged)** | **Conditional**, realistically low-yield |

### BE-08 — Owner operational declaration

| Field | Value |
|---|---|
| Exact question | Fills gaps where no system evidence exists (e.g., "has the site felt slow at a particular time of day?") |
| Evidence source/screen | Kelvin's own bounded, dated statement — not a system screenshot |
| Evidence class | Owner Declaration |
| Collection method | A direct, dated statement from Kelvin, scoped to what he can personally attest to |
| Minimum visible fields | Statement text, date given, explicit scope of what is/is not being attested |
| Prohibited fields | Not applicable — no system data involved |
| Redaction requirements | Not applicable |
| Owner | Kelvin |
| Access requirement | None — a declaration, not a system access |
| Existing evidence sufficient? | Always available in principle, as a fallback |
| Sufficiency rule | **Never sufficient alone to establish a discriminating finding; must never be upgraded to the same confidence as a direct system observation** |
| Limitation | Not system-verified |
| Missing-evidence classification | Not applicable — this item cannot itself be "Not Available," only unoffered |
| Distinguishes CE-DQ4-A from CE-DQ4-B? | No — supporting context only, explicitly lower-confidence |
| Separate approval required before collection? | No |
| **Classification (from decisions/DD-029, unchanged)** | **Useful but Non-Blocking**, always available |

---

## Phase 4 — Evidence Classes (structurally separate, never substituting)

| # | Class | Governs |
|---|---|---|
| 1 | CrUX field evidence | The 26% poor-mobile-TTFB figure itself (EV-017/O-012) — the outcome-layer measurement, unchanged by this specification |
| 2 | Lighthouse or other lab evidence | Any future synthetic lab test — not yet obtained (O-012) |
| 3 | Public-request timing evidence | diagnosis/DQ-004-investigation.md Phase 2B's existing curl-based timing/header observations, and any future like-for-like repeat |
| 4 | Restricted origin/backend observability evidence | BE-01 through BE-06 above |
| 5 | Owner Declaration | BE-08, and any Owner-Declared capture metadata for other items |
| 6 | Provider-attested evidence | BE-07 specifically, and any CSE-6-style written confirmation |

**Correction (decisions/DD-030's independent review, 13 August 2026):** this table originally listed BE-07 under both Class 4 ("BE-01 through BE-07") and Class 6 ("BE-07 specifically"), contradicting BE-07's own Phase 3 definition, which states its Evidence class as "Provider-attested evidence" (Class 6) only. Corrected above to "BE-01 through BE-06" for Class 4; BE-07 remains Class 6 exclusively. No other row was changed by this correction.

**Binding structural rules:**

- Lab data (Class 2) cannot substitute for CrUX field data (Class 1) — matches OD2-REQ-006, unchanged.
- Public-request timings (Class 3) cannot establish internal PHP/database mechanisms (Class 4) — a fast or slow `curl` response time is an external, post-hoc measurement, not a substitute for BE-02/BE-03's internal timing question.
- Configured state (e.g., the Varnish/CDN Configured-State axis from decisions/DD-027/DD-028) cannot substitute for Delivered state (whether a request actually was served from cache) — the same axis discipline as design/OD2-CAND-3-cache-state-evidence-specification.md §6.0, extended here.
- Account-level evidence (e.g., decisions/DD-028's account-wide "Varnish: ON"/"CDN: OFF" finding) cannot automatically establish domain-specific state for konnichiwa.nl — the same discipline decisions/DD-028/DD-029 already applied to the host/reverse-proxy layer, extended to any Stage 2 evidence class.
- **Missing evidence is never encoded as zero, disabled, absent, or healthy** — a Not Available BE item is recorded as exactly that, never silently converted into a negative or positive finding (Phase 3, per item; matches decisions/DD-026 Condition 11).

---

## Phase 5 — Privacy and Security Rules

**Prohibited from collection or storage, without exception:**

passwords; API keys; tokens; cookies; session identifiers; FTP or SSH credentials; database credentials; customer names; customer email addresses; customer phone numbers; reservation content; raw visitor IP addresses; payment or billing data; neighbouring-domain or unrelated customer data; **internal server file paths and directory structure (added by decisions/DD-030's independent review, 13 August 2026 — this category was named as a risk in decisions/DD-029's own G-08 table but was missing from this list; error logs (BE-05) and execution/query reports (BE-02, BE-03) commonly reveal server file paths, which are not needed to answer any Phase 2 question and must be redacted before intake, same as any other item on this list)**.

**Cropping or redaction is required before repository intake** for any item that would otherwise incidentally include the above — matching the exact discipline already applied throughout design/EC-002-OD2-CAND-3-Evidence-Intake.md Round 1–3 (server IP, account email, unrelated jatosushi.nl domain all excluded there).

**Raw logs** may only be accepted if already available, owner-supplied, and redacted or aggregated **before** being supplied. This specification does not request that logging, profiling, or debugging be enabled to produce a raw log or any other item — see Phase 6.

---

## Phase 6 — Access and Collection Boundary

**Allowed future collection mode, subject to a separate gate:** `Owner-Supplied Redacted Evidence Only` — identical in kind to decisions/DD-026's collection mode for Stage 1.

**Claude, or any other agent, may not, under this specification:**

- log into hosting, WordPress, DirectAdmin, a database, or a CDN;
- request or store credentials;
- activate debug mode;
- activate profiling;
- install a plugin;
- execute PHP or SQL;
- change caching;
- purge caches;
- change server settings;
- contact provider support;
- run new public HTTP probes;
- access production logs directly.

**If any required evidence needs one of the above actions, that evidence item is classified `Blocked` and routed to case-owner review** — not pursued, not substituted, not silently declared unnecessary. Per Phase 3: BE-02's profiling/debug route, BE-03's phpMyAdmin route, and BE-07's new-support-ticket route are each explicitly named as out-of-scope routes to their respective items, not paths to be taken.

---

## Phase 7 — Sufficiency and Outcome Routing

Six pre-registered outcomes, none decided here, none self-authorizing further action:

| Outcome | Minimum Evidence Threshold | May Conclude | May Not Conclude | OD-002 Unchanged? | Diagnosis Review Required? | Lifecycle Pause Required? | Further Gate Required? |
|---|---|---|---|---|---|---|---|
| **Backend Processing Signal Confirmed Within Inspected Evidence** | At least one of BE-02/BE-03 supplies an aggregated, dated, scoped figure showing materially elevated execution/query time | Backend/application processing is, within the inspected evidence, associatively consistent with elevated response time | That backend processing is the sole or dominant cause; that caching is irrelevant; any ranking/conversion/revenue/reservation benefit | **Yes** — this is Design-stage comparison, not a Diagnosis revision by itself | Only if this finding is dispositive enough to resolve the CE-DQ4-A/B entanglement in a way that materially changes OD-002's own established wording (per G-01, Section 1) | **Yes, if dispositive** — routes to decisions/DD-022 Common Condition 10 review | Yes — Gate 3 (classification acceptance) at minimum |
| **Backend Processing Signal Not Found Within Inspected Evidence** | BE-02/BE-03 are obtained and show no material elevation, or resolve cleanly to a low/normal figure | Within the inspected evidence, backend processing does not appear to be a material, independent contributor | That caching absence alone explains the tail; that no backend factor could ever exist outside what was inspected | **Yes** | Same conditional rule as above | Same conditional rule as above | Yes — Gate 3 at minimum |
| **Cache/Backend Mechanisms Remain Entangled** | Evidence is obtained but does not cleanly separate CE-DQ4-A from CE-DQ4-B (e.g., only corroborating BE items, no BE-02/BE-03) | The entanglement identified in decisions/DD-018 persists | Either mechanism is dominant | **Yes** | No — this is the expected, unresolved status quo, not new evidence | No | Yes — Gate 3 at minimum, to record the outcome |
| **Contradictory Evidence** | Two or more BE items, for the same scope and a materially comparable time window, disagree | Nothing beyond "unresolved, flagged" | Either mechanism is confirmed or excluded | **Yes** | Flagged for case-owner review on whether further clarification is worth requesting | Recommended | Yes — Gate 3 at minimum |
| **Evidence Insufficient** | No BE item beyond BE-08 (Owner Declaration) is obtained, or all attempted items resolve to Not Available/Blocked | Stage 2's own bounded question remains unanswered at this time | Nothing about the underlying mechanism | **Yes** | No | No | Yes — Gate 3, to record closure (mirrors Stage 1's own CS-4 closure precedent, decisions/DD-028) |
| **Unsafe or Unauthorized Evidence Requirement** | Any point where obtaining further evidence would require an action listed in Phase 6 | That the remaining gap cannot be closed within this specification's authorized scope | Nothing about the underlying mechanism | **Yes** | No | No | Yes — a specification amendment and fresh case-owner decision, per the same escalation discipline as design/OD2-CAND-3-cache-state-evidence-specification.md §3.2 |

**No outcome above may automatically:** establish OD-002 Design; authorize a technical solution; authorize Stage 2 evidence collection beyond its approved scope; authorize Transformation; authorize an external change. Every outcome requires its own, later, explicit case-owner decision before any further step (mirroring exactly how CS-1 through CS-4 were pre-registered under design/OD2-CAND-3-cache-state-evidence-specification.md §6.7).

---

## Phase 8 — Stop and Escalation Rules

**Immediately stop and route to case-owner review if:**

- credentials or secrets become visible in any supplied material;
- customer or reservation data is present in any supplied material;
- evidence requires a mutation (a Save/Apply/Purge/Enable/Disable click or equivalent);
- profiler or debug-mode activation would be required to proceed;
- database inspection (beyond an already-existing aggregated report) becomes necessary;
- a new mechanism materially challenges OD-002 (routes per Phase 1's G-01-derived routing table);
- cache/backend evidence creates a material contradiction (routes to the Contradictory Evidence outcome, Phase 7);
- evidence scope exceeds BE-01–BE-08 (routes to a specification amendment, per Phase 7's Unsafe/Unauthorized outcome);
- the distinction between Design-stage comparison and renewed Organizational Diagnosis becomes unclear at any point.

None of these conditions is resolved silently or by this specification's own authority — each requires Kelvin's explicit, separate decision.

---

## Phase 9 — Falsification Test

Twelve attacks, each independently assessed against this specification as drafted:

| # | Attack | Result | Basis |
|---|---|---|---|
| 1 | Hidden assumption that Varnish is active | **Survives** | Phase 1's Explicit Non-Assumptions list forbids this; nowhere below assumes it |
| 2 | Hidden assumption that no caching exists | **Survives** | Same list; decisions/DD-027/DD-028's Unconfirmed Configured-State is never rewritten |
| 3 | Hidden assumption that backend delay causes the CrUX tail | **Survives** | Phase 2 explicitly frames this as a question to be tested, not a premise; Phase 7's outcome table permits "not found" as an equally valid result |
| 4 | Lab-for-field substitution | **Survives** | Phase 4's structural-separation rule, restated explicitly |
| 5 | Public-timing-for-internal-mechanism substitution | **Survives** | Phase 4's explicit rule that Class 3 cannot establish Class 4 |
| 6 | Account-level/domain-level conflation | **Survives** | Phase 4's explicit rule, directly extending decisions/DD-028's own Varnish-layer finding |
| 7 | Missing-evidence-as-negative-evidence | **Survives** | Phase 3 (every item) and Phase 4's closing rule both state this explicitly, per item |
| 8 | Hidden technical-solution selection | **Survives** | Phase 7's closing rule; no outcome authorizes a technical solution |
| 9 | Credential or privacy leakage | **Survives, with a correction applied during drafting** | Original BE-03 draft risked implying phpMyAdmin as a possible aggregated-query source; **corrected** to explicitly name phpMyAdmin as `Unsafe Without New Authorization` and exclude any SQL/table/database-browsing content, per Phase 3's BE-03 row and Phase 6 — this correction is preserved here as the record of what the attack found and how it was addressed, not silently folded in without trace |
| 10 | Accidental Stage 2 execution | **Survives** | Phase 1's Activity Class field, Phase 10's Approval Boundary, and the repository-update lifecycle fields (below) all state evidence collection is not authorized |
| 11 | Accidental Diagnosis reopening | **Survives** | Phase 1's G-01-derived routing table (via decisions/DD-029) governs this explicitly |
| 12 | Accidental Transformation authorization | **Survives** | Phase 7's closing rule and Phase 1's Prior Decisions Referenced section both keep Transformation a wholly separate, unauthorized act |

**Result: 12 of 12 Survive. One (Attack 9) required a drafting-time correction, recorded above rather than silently absorbed — the concern (phpMyAdmin as an implicit query-access route) and the correction (explicit exclusion, Phase 3/6) are both preserved.** No attack found a defect requiring rejection or a broader rewrite.

---

## Phase 10 — Approval Boundary

**Preparation of this specification is not approval to collect evidence.** No BE item has been collected; no account or system has been accessed; no support request has been sent.

### Requested Case-Owner Response (for a future, separate decision — not requested now)

```
APPROVED FOR BOUNDED STAGE 2 EVIDENCE COLLECTION
APPROVED WITH CONDITIONS FOR BOUNDED STAGE 2 EVIDENCE COLLECTION
NOT APPROVED FOR STAGE 2 EVIDENCE COLLECTION
```

This response is **not** requested by the current task — per decisions/DD-029's own five-gate division (Gate 1: prepare specification, this document; Gate 2: authorize collection, separate and future). This specification instead awaits an **independent readiness review** before any case-owner response to the above is even solicited (see repository lifecycle fields below).

```yaml
od_002_stage_2_specification_status: Prepared — Evidence Collection Not Authorized
od_002_stage_2_evidence_collection_authorized: false
od_002_stage_2_authorized: false
od_002_design_established: false
transformation_authorized: false
external_changes_authorized: false
```

## Design Boundary

No evidence collection, system inspection, or configuration action is authorized by this specification. This document defines what would be needed and how it could be supplied; it does not perform any of it. An independent readiness gate for this specification — not this document itself — is the next step (see current.md `next_action`). Any future bounded evidence collection under this specification requires Kelvin's separate, explicit approval; any dispositive finding requires a separate lifecycle/case-owner review before Design proceeds further; establishing OD-002 Design requires a separate, later act; any eventual Transformation requires its own, later Transformation Authorization Gate, not implied or pre-approved here.
