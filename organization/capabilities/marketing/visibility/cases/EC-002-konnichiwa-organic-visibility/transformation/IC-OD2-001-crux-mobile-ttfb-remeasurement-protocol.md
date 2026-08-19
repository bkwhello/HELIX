# IC-OD2-001 — Like-for-Like CrUX Mobile TTFB Remeasurement Protocol

---

**Prepared under decisions/DD-035's Case-Owner Decision (AUTHORIZED WITH CONDITIONS TO PREPARE IC-OD2-001 CRUX REMEASUREMENT PROTOCOL, 14 August 2026).** This is a repository-only protocol definition. It does not execute anything, access PageSpeed Insights or CrUX, retrieve data, create evidence, or automate monitoring.

```yaml
Status: Prepared — Independent Readiness Review Required
Authority: DD-035 Case-Owner Decision
Candidate: IC-OD2-001 — No-Change / Measurement Continuation
Protocol Execution: Not Authorized
CrUX/PageSpeed Access: Not Performed
Evidence Created: None
Stage 2 Effect: None
Transformation Execution: Not Authorized
External Changes: Not Authorized
```

---

## Status Update — Independently Reviewed (14 August 2026)

*Status-only addendum. It does not alter any substantive Phase 1–14 content beyond the three bounded corrections dated and attributed inline above (Phase 2's timezone-assumption flag, Phase 4's lapse-expiry rule, Phase 10's fifteenth stop condition) — every other word of Phases 1–14 remains exactly as originally prepared. Authority: decisions/DD-036, Independent Protocol Readiness Gate, 14 August 2026.*

```yaml
Status: Prepared — Readiness Reviewed, Execution Decision Pending
Readiness Gate: DD-036 — Passed With Conditions
Recommendation: Recommend Approved With Conditions For Read-Only CrUX Remeasurement Execution
Execution Decision: Pending
```

decisions/DD-036 independently reviewed this protocol in full — re-verifying the historical baseline against observations/O-012.md and diagnosis/DQ-004-investigation.md directly, re-deriving the target-window mathematics, testing the calculation and outcome-routing rules against five sample values, and independently attacking the protocol across twenty-four dimensions. **Gate Verdict: PASSED WITH CONDITIONS. Recommendation: RECOMMEND APPROVED WITH CONDITIONS FOR READ-ONLY CRUX REMEASUREMENT EXECUTION.** This recommendation is **not** execution authorization — Kelvin's explicit response is requested in decisions/DD-036, not recorded by this addendum.

---

## Status Update — Execution Authorized With Conditions (14 August 2026)

*Status-only addendum. It does not alter any substantive Phase 1–14 content — no field, rule, outcome, confounder, or stop condition above is changed by this addendum. Authority: decisions/DD-036, Case-Owner Decision, Kelvin Wong, 14 August 2026.*

```yaml
Status: Execution Authorized — One Public Read-Only Attempt, Not Before 2026-08-19
Execution Decision: Approved With Conditions — One Public Read-Only Attempt
Execution Not Before: 2026-08-19
Execution Target Window: 2026-07-22 through 2026-08-18
Execution Authorization Expires: 2026-10-31
Execution Attempt Limit: 1
Execution Started: false
```

Kelvin Wong issued **APPROVED WITH CONDITIONS FOR READ-ONLY CRUX REMEASUREMENT EXECUTION** (decisions/DD-036, Case-Owner Decision). One bounded, public, read-only execution attempt of this protocol is now authorized — not before 2026-08-19, expiring 2026-10-31 if unused, limited to one attempt, subject to all eleven DD-036 Set A conditions and all thirty-eight new Set B execution conditions recorded verbatim in decisions/DD-036. **This authorization does not itself execute the protocol, create evidence, or start Stage 2.** `od_002_stage_1_execution_started` and `od_002_stage_1_evidence_created` remain `false`.

---

## Status Update — Attempt 1 Blocked (19 August 2026)

*Status-only addendum. It does not alter any substantive Phase 1–14 content. Authority: Attempt Record, transformation/IC-OD2-001-crux-remeasurement-execution-attempt-1.md, 19 August 2026.*

```yaml
Status: Execution Authorized — Attempt 1 Blocked (HTTP 429 / No CrUX Data Returned)
Attempt 1 Date: 2026-08-19
Attempt 1 Result: Blocked — see transformation/IC-OD2-001-crux-remeasurement-execution-attempt-1.md
Attempts Remaining (Provisional): 0
Method-Compliance Review: Pending Independent Review
Independent Attempt-Consumption Determination: Pending (DD-037, not yet created)
```

One public, read-only, unauthenticated request was made to the PageSpeed Insights API v5 endpoint (`strategy=mobile`) for `https://konnichiwa.nl/` and received HTTP 429 with no usable body — no CrUX data, no window dates, no TTFB distribution, no Core Web Vitals. No evidence was created; no `O-014`/`EV-025` was used. Full detail: transformation/IC-OD2-001-crux-remeasurement-execution-attempt-1.md. Whether this specific method (unauthenticated API v5, as distinct from the interactive report interface that succeeded for the historical baseline, EV-017/O-012) satisfies this protocol's Phase 5 Step 3 ("approved public read-only CrUX/PageSpeed source") is an open question for a future, independent DD-037 review — not resolved by this addendum.

---

## Status Update — Replacement Attempt 1 Blocked (19 August 2026)

*Status-only addendum. It does not alter any substantive Phase 1–14 content. Authority: decisions/DD-038 Case-Owner Decision; Attempt Record, transformation/IC-OD2-001-crux-remeasurement-replacement-attempt-1.md, 19 August 2026.*

```yaml
Status: Replacement Attempt Authorized (DD-038) — Attempt 1 Blocked (Exact 28-Day Window Not Visibly Confirmed)
Replacement Attempt 1 Date: 2026-08-19
Replacement Attempt 1 Method: Interactive PageSpeed Insights Interface (API v5 not used)
Replacement Attempt 1 Result: Blocked — see transformation/IC-OD2-001-crux-remeasurement-replacement-attempt-1.md
Replacement Attempts Remaining Under DD-038: 0
Independent Follow-Up Gate: Required, not yet created
```

Under decisions/DD-038's authorization, one interactive PageSpeed Insights analysis was submitted for `https://konnichiwa.nl/` (Mobile, field data). Usable on-screen data was returned — unlike Attempt 1's HTTP 429 — but the source displayed only "Latest 28-day period," with no exact window start or end date visible, and could not be independently confirmed to be scoped to "Origin" rather than "This URL." Per decisions/DD-036 Part 10's fifteenth stop condition and decisions/DD-038's own binding conditions, this is a blocking condition: the attempt is used, no evidence is created, and no second attempt occurs. TTFB figures were visible (75th percentile 1.7 s; Good 27% / Needs Improvement 52% / Poor 22%, summing to 101% due to source rounding) but are recorded only as unclassified source data, never compared to the historical 26% baseline. Full detail: transformation/IC-OD2-001-crux-remeasurement-replacement-attempt-1.md. A separate, independent follow-up gate is required before any further action.

---

## Precondition Check

| # | Precondition | Result |
|---|---|---|
| 1 | Branch `feat/ec-002-visibility-baseline`; local and remote HEAD `750223ecb2cd86ec672b9c8d72f68eea6e2e72ba` | **PASS** |
| 2 | Working tree clean | **PASS** |
| 3 | Local and remote branches synchronized (0 ahead / 0 behind) | **PASS** |
| 4 | `current_stage: Organizational Design` | **PASS** |
| 5 | DD-034 selected Stage 1 — IC-OD2-001 | **PASS** |
| 6 | IC-OD2-001: Selected — Stage 1, Execution Not Authorized | **PASS** (current.md) |
| 7 | IC-OD2-002 conditionally selected, pending Stage 1 review | **PASS** |
| 8 | DD-035 Gate Verdict PASSED WITH CONDITIONS | **PASS** |
| 9 | DD-035 Case-Owner Decision: AUTHORIZED WITH CONDITIONS TO PREPARE IC-OD2-001 CRUX REMEASUREMENT PROTOCOL | **PASS** |
| 10 | All 15 DD-035 Set A conditions remain binding | **PASS** — none edited |
| 11 | All 32 DD-035 Set B boundaries remain binding | **PASS** — none edited |
| 12 | Protocol preparation is authorized | **PASS** (`od_002_stage_1_protocol_preparation_authorized: true`) |
| 13 | Protocol execution is unauthorized | **PASS** (`od_002_stage_1_execution_authorized: false`) |
| 14 | No protocol already exists | **PASS** |
| 15 | Historical baseline: origin-level, mobile, TTFB, rolling 28-day, 24 Jun–21 Jul 2026, 26% poor historical, Core Web Vitals Passed, report 24 Jul 2026 06:19:15, interactive report, API 429 failures | **PASS** — verified against observations/O-012.md, diagnosis/DQ-004-investigation.md |
| 16 | 26% is not current-state evidence | **PASS** |
| 17 | Stage 1 remains CS-4 — Insufficient Evidence | **PASS** |
| 18 | Host/Varnish remains Unconfirmed/Unconfirmed | **PASS** |
| 19 | Stage 2 Round 1 remains Evidence Insufficient | **PASS** |
| 20 | CE-DQ4-A remains unresolved | **PASS** |
| 21 | CE-DQ4-C/E/F/G remain uninvestigated | **PASS** |
| 22 | Stage 2 preparation remains unauthorized | **PASS** |
| 23 | Feasibility execution remains unauthorized | **PASS** |
| 24 | Implementation remains unauthorized | **PASS** |
| 25 | `transformation_authorized` remains `false` | **PASS** |
| 26 | `external_changes_authorized` remains `false` | **PASS** |
| 27 | OD-001 Candidate D remains separate and unexecuted | **PASS** (`candidate_d_protocol_executed: false`) |
| 28 | OD-003 remains outside scope | **PASS** (`od_003_design_authorized: false`) |

**All twenty-eight preconditions passed. Proceeding.**

---

## Phase 1 — Authority and Purpose

| Element | Value |
|---|---|
| Design authority | decisions/DD-032 — Established Organizational Design (Conditional) |
| Candidate-construction authority | decisions/DD-033 — Level 1 Candidate Construction Only |
| Candidate selection | decisions/DD-034 — IC-OD2-001 Selected — Stage 1, Execution Not Authorized |
| Protocol-preparation authority | decisions/DD-035 — Authorized With Conditions To Prepare |
| Active confidence | **Medium-Low** (inherited cap; this protocol does not exceed it) |

**Purpose:** create a reproducible, like-for-like protocol for determining whether the displayed CrUX poor-mobile-TTFB share is lower, unchanged at displayed precision, or higher than the historical 26% baseline.

**Explicitly excluded from this protocol's purpose:**

- cache-mechanism diagnosis;
- Varnish-state determination;
- backend-mechanism diagnosis;
- page-specific performance conclusions;
- ranking conclusions;
- conversion, revenue, or reservation conclusions;
- technical intervention selection.

**Carried forward without weakening, kept separately provenanced (not merged or deduplicated):**

- **DD-035 Set A** (fifteen gate conditions, Part 11) — binding on this entire protocol.
- **DD-035 Set B** (thirty-two case-owner protocol-preparation boundaries) — binding on this entire protocol.
- All prior DD-032/DD-033/DD-034 condition sets, cited by reference in decisions/DD-035 Set A Condition 13, remain independently binding and are not restated in full here to avoid drift between copies.

### Binding Conditions — Set A: DD-035 Gate Conditions (verbatim, from decisions/DD-035 Part 11)

1. Preparation is repository-only — no CrUX, PageSpeed Insights, or Search Console access; no data retrieval of any kind.
2. All twenty Part 3 like-for-like requirements must be satisfied in the prepared protocol.
3. The protocol must explicitly carry forward the Part 2 unresolved-method-field register, resolving nothing by assumption — each field's classification (Confirmed / Condition to Resolve Before Protocol Approval / Condition to Resolve Before Execution / Non-Blocking Limitation / Structurally Unavailable) must be stated in the protocol itself.
4. No final measurement window may be selected in the protocol-preparation step; only the rules from Part 4 may be fixed. The actual future window's exact dates, and confirmation of real data availability, are execution-time decisions.
5. The single 3-day reporting-lag observation (Part 4) may inform, but must not be adopted as, a guaranteed data-availability rule.
6. No numeric threshold may be defined in the protocol without Kelvin's separate, explicit approval; the seven qualitative outcome categories (Part 5) are the only pre-registered outcomes this gate authorizes preparing.
7. The "broadly stable" outcome category must be labeled a measurement classification only, never a claim of no user-experience or business impact.
8. The confounder register (Part 6) must be included in full, with absence of evidence recorded as Unknown, never as "no change" or "ruled out."
9. The protocol must not merge with, substitute for, or be classified by OD-001 Candidate D's protocol, or vice versa (Part 8).
10. Stage 2 (IC-OD2-002) does not start automatically from any Stage 1 classification result — it requires its own separate case-owner review, per decisions/DD-034.
11. Preparing the protocol does not authorize executing it; a future retrieval requires its own separate, explicit case-owner authorization.
12. No automation or scheduled retrieval may be created or proposed.
13. All fifteen DD-033 Set A conditions, twenty-two DD-033 Set B boundaries, ten DD-032 establishment conditions, sixteen DD-032 additional boundaries, ten DD-034 Set A conditions, and twenty-two DD-034 Set B boundaries remain independently binding and are not narrowed by this gate.
14. `od_002_stage_1_execution_authorized`, `od_002_stage_2_preparation_authorized`, `od_002_feasibility_execution_authorized`, `od_002_implementation_authorized`, `transformation_authorized`, and `external_changes_authorized` all remain `false`, unconditionally, regardless of Kelvin's response to this gate.
15. OD-001 Candidate D and OD-003 remain entirely unaffected by, and unreferenced within, this gate beyond the Part 8 separation review.

### Binding Conditions — Set B: Case-Owner Protocol-Preparation Boundaries (verbatim, from decisions/DD-035 Case-Owner Decision)

1. The protocol must remain repository-only until a later execution gate.
2. The historical baseline remains origin-level, mobile, TTFB, rolling 28-day CrUX field data for 24 June–21 July 2026.
3. The historical 26% poor share must never be represented as current.
4. Core Web Vitals Passed remains separate from the TTFB distribution issue.
5. Lab data may not substitute for CrUX field data.
6. Public HTTP timing may not substitute for CrUX field data.
7. Desktop data must remain separate from mobile data.
8. Origin-level data may not be presented as page-specific data.
9. The future protocol must preserve all twenty like-for-like requirements assessed by DD-035.
10. The TTFB percentile basis remains unresolved until verified.
11. The PageSpeed interface/version remains unresolved until verified.
12. CrUX release cadence remains a Non-Blocking Limitation unless separately verified.
13. Timezone basis remains a Non-Blocking Limitation unless separately verified.
14. Country and connection-type segmentation remain Structurally Unavailable unless the future source actually provides them.
15. Historical report reproducibility must be resolved before execution.
16. The future target window must not be selected in this decision-recording task.
17. The protocol must disclose any overlap with the historical baseline.
18. The protocol must not invent or generalize a reporting lag from EV-017's single observed delay.
19. Any earliest retrieval date must be justified by actual source availability, not assumption.
20. A lapse date must be included and labelled as an operational choice.
21. No numerical threshold may become binding without Kelvin's separate approval.
22. "Broadly stable" may only be a measurement classification, never proof that no problem exists.
23. "No measurable change" remains a valid outcome.
24. Missing or unavailable data must never be encoded as zero.
25. A better or worse TTFB distribution does not establish a cache, Varnish or backend mechanism.
26. The confounder register is mandatory; missing confounder evidence remains Unknown.
27. Stage 2 does not start automatically from any Stage 1 result.
28. The protocol must end with a separate execution-authorization request.
29. OD-001 Candidate D remains separate and unexecuted.
30. No ranking, conversion, revenue or reservation benefit may be inferred.
31. `transformation_authorized` remains `false`.
32. `external_changes_authorized` remains `false`.

Both sets are kept **separately titled with their own provenance**; neither is merged, renumbered, paraphrased, or deduplicated into the other.

---

## Phase 2 — Historical Baseline Specification (Locked)

| Field | Value |
|---|---|
| Evidence source | EV-017 (within observations/O-012.md) |
| Origin | `https://konnichiwa.nl/` — the exact historical canonical origin as documented; no other origin, subdomain, or URL |
| Data source | Chrome UX Report (CrUX) field data, presented via Google PageSpeed Insights |
| Surface | **Origin-level** (not URL/page-specific) |
| Device | **Mobile** (TTFB/INP not available for desktop in the historical report) |
| Metric | **Time to First Byte (TTFB)**, marked **experimental** by Google in the source report |
| Window type | Rolling 28 days |
| Historical window | **2026-06-24 through 2026-07-21, inclusive** |
| Poor share | **26%** |
| TTFB reported value | 1.8 s, alongside the 26%-poor classification |
| Core Web Vitals result | **Passed** (mobile and desktop) — kept structurally separate from the TTFB poor-share comparison throughout this protocol |
| Report generation/capture | **2026-07-24 06:19:15, Europe/Amsterdam (assumed, not sourced — see UMF-004)** — the date/time are directly sourced from O-012; the timezone label is added now for protocol usability only, since the original source record does not state one |
| Retrieval method | Completed PageSpeed **interactive report** (`pagespeed.web.dev/analysis/...`) |
| Failed methods | PageSpeed Insights **API v5** — HTTP 429 (no API key configured), twice; a freshly-started **interactive analysis** — async loading, not resolvable via a single static fetch |
| Confidence | Hoog/High for the CrUX field metrics (Google's own aggregated real-user data); N/A for Lighthouse lab scores (not obtained) |
| Limitations | TTFB experimental status; no page-level isolation in the source; two failed automated attempts preceded the successful fetch (tooling failures, not evidence of poor performance) |

**No undocumented historical setting is added above.** Every field is either directly sourced from observations/O-012.md and diagnosis/DQ-004-investigation.md Phase 1, or explicitly marked as protocol-added convenience labeling (the Europe/Amsterdam timezone attachment) rather than a case-confirmed historical fact.

---

## Phase 3 — Unresolved Method-Field Register

*Carried forward from decisions/DD-035 Part 2, resolved nowhere in this task.*

| ID | Field | DD-035 Classification | Why Unresolved | Blocks Protocol Readiness? | Blocks Execution? | Permitted Resolution Method | Fallback If Unresolved | Prohibited Inference |
|---|---|---|---|---|---|---|---|---|
| UMF-001 | TTFB percentile/distribution basis (whether "1.8 s" / the poor-share % represents p75) | Condition to Resolve Before Protocol Approval | Not explicitly labeled anywhere in O-012 or DQ-004-investigation.md | No — protocol may state its assumption explicitly | Yes, for calculation interpretation | State the assumption (standard CrUX p75 convention) explicitly as inherited convention at execution time, flagged as such | Record the displayed percentage without asserting a percentile basis | Do not present the assumed percentile basis as case-confirmed fact |
| UMF-002 | PageSpeed interface/version used | Condition to Resolve Before Execution | Interactive tool confirmed used, not API v5; exact tool version/UI not pinned; O-012 shows the two differ in behavior | No | Yes | Record which interface is used at retrieval time (Phase 6 metadata) | If only the API is reachable and returns a different display format, classify OUT-06 (Method Not Comparable) rather than force a comparison | Do not treat API-sourced and interactive-tool-sourced displays as automatically equivalent |
| UMF-003 | CrUX release/freshness cadence for this report | Non-Blocking Limitation | Not documented in-repo | No | No | May cite Google's public documentation as methodological reference (not case evidence) if needed | Proceed without resolving; does not block preparation or execution | Do not assume a specific update cadence not evidenced in this case |
| UMF-004 | Timezone basis (historical window dates, 06:19:15 generation time) | Non-Blocking Limitation | Not stated in the original source | No | No | Apply Europe/Amsterdam consistently for both historical labeling and future retrieval (Phase 2, Phase 6) | Immaterial to a 28-day rolling comparison as long as applied consistently | Do not treat timezone precision as affecting the poor-share comparison itself |
| UMF-005 | Country segmentation | Structurally Unavailable | The historical report is not segmented by country | No | Yes, if a future report is differently segmented | None — a future report showing country segmentation not present historically would not be like-for-like | Classify OUT-06 (Method Not Comparable) if segmentation differs materially | Do not selectively filter a future segmented report to approximate the unsegmented historical one |
| UMF-006 | Connection-type segmentation | Structurally Unavailable | Same as UMF-005 | No | Yes, same condition | None | Same as UMF-005 | Same as UMF-005 |
| UMF-007 | Historical report reproducibility (whether the original report URL remains re-fetchable/verifiable) | Condition to Resolve Before Execution | Untested — no external access has been performed by any task in this case to date | No | Yes | Attempt to confirm at execution time only, as part of the execution manifest (Phase 5, Step 3–4); if not reproducible, this does not invalidate the locked Phase 2 baseline (which is drawn from the already-committed O-012.md record), only affects whether independent re-verification of the historical figure is possible | Proceed using the locked Phase 2 baseline regardless; note non-reproducibility as a limitation, not a blocker | Do not treat an inability to re-fetch the historical report as grounds to alter the locked historical baseline |

**No field above is resolved by this task.** Every classification, blocking status, and prohibited inference is carried forward or newly stated as a rule for the future protocol to follow — not as a completed resolution.

---

## Phase 4 — Target Window

```yaml
Target Window: Proposed — Subject to Readiness Gate and Source Availability Confirmation
```

| Field | Value |
|---|---|
| Proposed target field-data window | **2026-07-22 through 2026-08-18, inclusive** |
| Length | Exactly 28 calendar days |
| Relationship to historical window | Immediately follows 2026-06-24–2026-07-21; **zero calendar overlap** |
| Basis | **Method-derived** from the locked Phase 2 baseline (same window length, non-overlapping) — **not evidence that the CrUX source will expose this exact period** at execution time |

**Earliest retrieval rule (binding):** retrieval may occur only after the complete target window (2026-08-18) has ended, **and only when the source itself confirms that an equivalent complete field-data period is available**. No fixed retrieval date is set by this protocol.

**If the source does not expose or confirm an equivalent window:**

- do not approximate silently;
- classify **OUT-06 — Method Not Comparable** or **OUT-05 — Data Unavailable**, as appropriate (Phase 8);
- stop before evidence classification (Phase 10).

**No reporting lag was invented.** decisions/DD-035 Part 4 found a single 3-day observation (EV-017's own window-end-to-generation gap) that is explicitly not adopted as a guaranteed rule here — the earliest-retrieval rule above depends on the source's own confirmation, not an assumed number of days.

### Proposed Authorization Lapse Date

```yaml
Lapse Date: Proposed 2026-10-31 — Operational Choice — Requires Case-Owner Approval
```

This lapse date prevents indefinite execution-authorization drift. It is **not evidence-derived** — it is an operational choice, proposed here for Kelvin's approval at the future readiness/execution gate, directly analogous to decisions/DD-024's own treatment of OD-001 Candidate D's lapse date.

**Expiry rule (added by decisions/DD-036's independent review, 14 August 2026 — bounded correction, not present in the original 14 August 2026 preparation):** any future execution authorization for this protocol automatically expires on the approved lapse date if execution has not occurred by then. Execution after the lapse date requires a new, separate, explicit case-owner decision — it is never inferred from the original authorization continuing to exist.

---

## Phase 5 — Like-for-Like Execution Manifest (Future Steps, Not Performed)

1. Verify execution authorization and date window.
2. Record execution date/time and Europe/Amsterdam timezone.
3. Open only an approved public read-only CrUX/PageSpeed source.
4. Enter or open the exact canonical origin.
5. Confirm origin-level data.
6. Confirm mobile field data.
7. Confirm TTFB distribution.
8. Record the displayed 28-day field window.
9. Record Good / Needs Improvement / Poor shares exactly as displayed.
10. Record Core Web Vitals result separately.
11. Record desktop data separately, if visible, as contextual only.
12. Record interface/source labels and visible methodology notes.
13. Capture a screenshot with no credentials or personal data.
14. Stop without classification if the source/window/metric is not comparable.

**No automation is prescribed.** **No API key is prescribed.** **No authenticated access is included.** Every step above is public, read-only, and manual — matching the exact pattern already used to obtain EV-017 itself (O-012's own successful retrieval was Kelvin's own manual, interactive-report action, not an automated pipeline).

---

## Phase 6 — Required Execution Metadata

Every future execution record must include:

protocol version · executor · retrieval date · retrieval time · timezone · exact source URL/type · canonical origin entered · origin-level or URL-level label · mobile/desktop label · metric · displayed window start/end · displayed distribution percentages · displayed CrUX methodology label · interface/version if visible · data availability notices · screenshots · limitations · deviations from protocol · stop-condition result.

No field above may be omitted from a future execution record without being explicitly marked "Not Available," per the missing-data discipline in Phase 7.

---

## Phase 7 — Calculation Rules (Pre-Registered)

| Calculation | Rule |
|---|---|
| Poor-share delta | Future displayed poor % **minus** historical 26% |
| Good-share and Needs-Improvement-share deltas | **Only if** corresponding historical percentages are authoritatively available (the historical record documents 26% poor for TTFB; Good/Needs-Improvement percentages for TTFB specifically were not recorded in observations/O-012.md — see Phase 2) |
| Direction | **Lower / Unchanged at Displayed Precision / Higher** |

**Binding rules:**

- use displayed percentages only;
- preserve displayed precision — do not invent extra decimals;
- do not claim statistical significance;
- do not claim materiality;
- do not infer causality;
- do not mix mobile and desktop;
- do not mix origin and URL level;
- do not mix lab and field data.

**Rounding rule:** if percentages do not sum to 100 because of display rounding, record the rounding difference explicitly and **do not normalize silently.**

---

## Phase 8 — Pre-Registered Outcomes

| Outcome | Definition | Permitted Conclusion | Prohibited Conclusion | Effect on IC-OD2-001 | Effect on IC-OD2-002 | Case-Owner Review Required? | Renewed Diagnosis Possible? |
|---|---|---|---|---|---|---|---|
| **OUT-01** — Displayed Poor Share Lower | Future displayed mobile poor share is below 26% | The measured share is lower at this reading | That a mechanism (cache, backend, or otherwise) caused the change; that ranking, conversion, or reservation outcomes improved | Falsification criterion partially engaged — divergence recorded, routed to case-owner review | Remains conditional; this result alone does not authorize Stage 2 | **Yes** | Only if the divergence is materially unexplained after confounder review |
| **OUT-02** — Unchanged at Displayed Precision | Future displayed mobile poor share equals 26% at the precision exposed by the source | The measured share is stable at displayed precision | That the underlying condition is acceptable, resolved, or free of user/business impact — "unchanged" is a measurement classification only (DD-035 Set B Condition 22) | No-change candidate outcome confirmed as legitimate | Remains conditional | **Yes** | No, unless confounder review surfaces something new |
| **OUT-03** — Displayed Poor Share Higher | Future displayed mobile poor share is above 26% | The measured share is higher at this reading | That a mechanism caused the change; that any specific intervention is now required | Divergence recorded, routed to case-owner review | Remains conditional; this result alone does not authorize Stage 2 | **Yes** | Only if the divergence is materially unexplained after confounder review |
| **OUT-04** — Distribution Changed, Interpretation Limited | Comparable data exists but rounding, methodology, or distribution limitations prevent a stronger interpretation | The data is recorded, with its interpretive limits stated explicitly | Any of the three directional conclusions above stated with unwarranted confidence | Recorded as inconclusive at this precision | Remains conditional | **Yes** | Possible, case-by-case |
| **OUT-05** — Data Unavailable | The required source data is unavailable | The attempt is recorded as legitimate, closed-for-now | That unavailability implies "no change," "improved," or "worsened" | No classification made | Remains conditional | **Yes** | No |
| **OUT-06** — Method Not Comparable | The source, level, device, metric, or window is not sufficiently comparable | The comparability failure is recorded, with the specific mismatch named | Any directional or magnitude conclusion | No classification made | Remains conditional | **Yes** | No |
| **OUT-07** — Result Unresolved | Evidence exists but produces an unresolved or contradictory interpretation | The contradiction is recorded explicitly | Any single directional conclusion selected to resolve the contradiction | No classification made | Remains conditional | **Yes** | Possible, case-by-case |

**No outcome above may automatically start IC-OD2-002.** Stage 2 requires its own separate case-owner review under every outcome, per decisions/DD-034 and DD-035 Set A Condition 10 / Set B Condition 27.

**Terminology restriction:** this protocol does not use "materially lower," "materially higher," or "broadly stable" anywhere above — only "Lower," "Higher," and "Unchanged at Displayed Precision," none of which carries an implied magnitude threshold. Any future use of a materiality-graded term requires a separately approved numeric threshold, per decisions/DD-035 Set A Condition 6 / Set B Condition 21, not introduced here.

---

## Phase 9 — Confounder Register

*Default missing status: **Unknown**. Never "No Change" without evidence.*

| ID | Confounder | Collection Question | Evidence Source | Current Status | Treatment If Unavailable | Interpretation Boundary |
|---|---|---|---|---|---|---|
| CF-001 | Origin-level page mix | Has the site's page composition changed materially since the historical window? | Repository record (e.g., new page launches noted elsewhere in the case) | **Unknown** | Record as Unknown; do not assume stable | A shift in poor-share may reflect page-mix change, not a delivery-mechanism change |
| CF-002 | Mobile network/traffic mix | Has the real-visitor mobile network/carrier mix changed? | Not observable from CrUX display alone | **Unknown** | Record as Unknown | Cannot be isolated from the aggregate CrUX figure |
| CF-003 | Geographic mix | Has the visitor geographic distribution changed? | O-001's aggregate ("94% Netherlands") is a prior snapshot, not a current re-measurement | **Unknown** | Record as Unknown | A geographic shift could shift TTFB without any site-side change |
| CF-004 | Time/load variability | Does traffic volume or time-of-day pattern differ between the two windows? | Not accessed (Restricted layer, per design/OD-002-design-workstream.md) | **Unknown** | Record as Unknown | Cannot be ruled in or out without traffic/load history |
| CF-005 | Website deployments | Has any code, theme, or plugin deployment occurred since the historical window? | Not tracked in this repository | **Unknown** | Record as Unknown | A deployment could shift TTFB independent of any cache/backend mechanism this case has investigated |
| CF-006 | Hosting changes | Has the hosting plan or provider changed? | Not accessed | **Unknown** | Record as Unknown | Same as CF-005 |
| CF-007 | Configuration changes | Has any server, PHP, or application configuration changed? | Not accessed | **Unknown** | Record as Unknown | Same as CF-005 |
| CF-008 | Caching changes | Has any caching layer been added, removed, or reconfigured? | Not accessed; Host/Varnish remains Unconfirmed/Unconfirmed (decisions/DD-028) | **Unknown** | Record as Unknown | This is precisely the mechanism uncertainty this protocol must not resolve by inference from a TTFB delta alone |
| CF-009 | Google/CrUX methodology changes | Has Google altered CrUX's collection, aggregation, or display methodology? | Not tracked in this repository; would require external verification not performed here | **Unknown** | Record as Unknown | A display change could alter the reported percentages without any site-side change |
| CF-010 | Seasonal traffic differences | Do the two windows fall in different seasonal traffic periods? | The historical window (24 Jun–21 Jul) and proposed window (22 Jul–18 Aug) are both mid-summer, closely adjacent | **Weakly Unknown — windows adjacent, but seasonality itself not evidenced** | Record as Unknown; adjacency does not confirm equivalence | Do not assume seasonal equivalence merely because the windows are close in time |
| CF-011 | Baseline aging | Has enough time passed that the 26% baseline itself may no longer be representative even absent any specific confounder? | decisions/DD-032 Binding Condition 4 (OD2-AS-008) already flags this as increasingly pressing | **Acknowledged, not resolved** | This protocol's own execution is the mechanism intended to address this — recorded here as the motivating confounder, not as evidence of a specific direction | The purpose of this protocol is precisely to test this, not to assume an answer in advance |
| CF-012 | Source/interface differences | Does the future retrieval use the same PageSpeed interface as the historical one (interactive tool vs. API)? | See UMF-002 | **Unknown until execution-time confirmation** | Record interface used; if it differs materially in display, classify OUT-06 | Do not treat interactive-tool and API displays as automatically equivalent |

---

## Phase 10 — Stop Conditions

Execution must stop, with no classification made, if any of the following occurs:

- execution authorization is missing;
- execution occurs outside the approved date range;
- authorization has lapsed;
- source window is incomplete;
- window comparability cannot be established;
- URL-level data is shown instead of origin-level data;
- desktop is shown without mobile;
- TTFB distribution is unavailable;
- only lab data is available;
- source requires credentials or an API key;
- personal or account data becomes visible;
- source methodology changes materially;
- protocol deviation affects comparability;
- a production or configuration change would be required;
- **the source does not clearly display exact start/end dates for the field-data window** (added by decisions/DD-036's independent review, 14 August 2026 — bounded correction: the original fourteen conditions did not separately cover the case where a window is displayed but its exact boundary dates cannot be determined, as distinct from an incomplete or non-comparable window).

---

## Phase 11 — Evidence and Classification Boundary

**Future execution must produce**, not skip:

- a new input manifest;
- privacy review;
- visible-fact extraction;
- a new evidence record;
- independent classification gate;
- explicit case-owner acceptance.

**Protocol execution does not itself classify the outcome.** Classification is a separate, later, independently-gated step — matching this case's own established pattern (e.g., decisions/DD-027/DD-028/DD-031's separation of evidence intake from classification).

**No result from a future execution may automatically:**

- establish a cache/backend mechanism;
- reopen Diagnosis;
- start IC-OD2-002;
- select an intervention;
- authorize implementation;
- authorize Transformation;
- authorize external changes.

---

## Phase 12 — OD-001 Separation

- **OD-001 Candidate D** concerns search visibility/query performance (Google Search Console, four query themes, 61-day comparison window, decisions/DD-023/DD-024).
- **IC-OD2-001** concerns CrUX mobile TTFB field distribution (Google PageSpeed Insights/CrUX, 28-day rolling window, decisions/DD-032/DD-033/DD-034/DD-035).
- Their sources, metrics, windows, and decision consequences differ entirely.
- **Neither substitutes for the other.**
- **Neither result may classify the other.**
- Their execution schedules must remain separately governed — OD-001 Candidate D's window opens no earlier than 21 September 2026 (decisions/DD-024); IC-OD2-001's earliest retrieval depends on this protocol's own Phase 4 rule and a future, separate execution authorization. They may coexist in time but must not be merged into a single artifact, a single authorization, or a single classification.

---

## Phase 13 — Protocol Falsification

| # | Attack | Verdict | Reasoning |
|---|---|---|---|
| 1 | Historical 26% treated as current | **Survives** | Phase 2 labels it historical throughout; Set B Condition 3 |
| 2 | Target window overlaps baseline | **Survives** | Phase 4 confirms zero calendar overlap by construction |
| 3 | Target window assumed available | **Survives** | Phase 4's earliest-retrieval rule requires source confirmation, not assumption |
| 4 | Reporting lag invented | **Survives** | Phase 4 explicitly declines to adopt the single 3-day observation as a rule |
| 5 | Lab data substituted for field data | **Survives** | Phase 7 rule; Phase 2 records lab data as never obtained |
| 6 | Desktop mixed with mobile | **Survives** | Phase 6/7 explicit separation; Phase 5 Step 11 keeps desktop contextual only |
| 7 | URL-level mixed with origin-level | **Survives** | Phase 2/5/7 all require origin-level confirmation |
| 8 | Public timing mixed with CrUX | **Survives** | Phase 7 rule — no public HTTP timing appears anywhere in this protocol's calculation rules |
| 9 | Lower share treated as mechanism proof | **Survives** | OUT-01's Prohibited Conclusion column explicitly bars this |
| 10 | Higher share treated as backend proof | **Survives** | OUT-03's Prohibited Conclusion column explicitly bars this; Set B Condition 25 |
| 11 | Unchanged share treated as no problem | **Survives** | OUT-02's Prohibited Conclusion column explicitly labels "unchanged" a measurement classification only |
| 12 | Missing data treated as zero | **Survives** | Phase 6 metadata requires explicit "Not Available" marking; Set B Condition 24 |
| 13 | Display rounding ignored | **Survives** | Phase 7's rounding rule requires explicit recording, no silent normalization |
| 14 | Statistical significance claimed | **Survives** | Phase 7 explicit prohibition |
| 15 | Confounders assumed absent | **Survives** | Phase 9's default-Unknown discipline, twelve items registered |
| 16 | Stage 2 starts automatically | **Survives** | Phase 8's table states this for every one of seven outcomes |
| 17 | OD-001 and OD-002 protocols merge | **Survives** | Phase 12 |
| 18 | Execution occurs without authorization | **Survives** | Status block, Phase 10, Phase 14 all require separate authorization |
| 19 | Automation or API access is smuggled in | **Survives** | Phase 5 explicit: no automation, no API key, no authenticated access |
| 20 | Ranking or commercial benefit is inferred | **Survives** | Phase 1 Purpose exclusions; Set B Condition 30 |
| 21 | Lapse date treated as evidence-derived | **Survives** | Phase 4 explicitly labels it Operational Choice |
| 22 | Protocol preparation becomes execution | **Survives with Narrowing** | This document itself performs no retrieval or access — narrowed by the Status block's explicit "CrUX/PageSpeed Access: Not Performed" and "Protocol Execution: Not Authorized" fields, restated at the top of the document rather than left only to Phase 14's closing statement |

**Twenty-one Survive outright; one Survives with Narrowing (22), resolved by restating the execution/access boundary at the document's own top-level status block, not only at its close — no defect required a correction to any substantive phase.**

---

## Phase 14 — Approval Boundary

This document requests, and requires, an **Independent Protocol Readiness Gate** before any execution.

After that gate, exactly one explicit response is required:

```
APPROVED FOR READ-ONLY CRUX REMEASUREMENT EXECUTION

APPROVED WITH CONDITIONS FOR READ-ONLY CRUX REMEASUREMENT EXECUTION

NOT APPROVED FOR EXECUTION
```

**Preparation is not execution authorization.** Nothing in this document, on its own, permits any CrUX/PageSpeed access, data retrieval, or evidence creation. `od_002_stage_1_execution_authorized` remains `false` until a separate, later, explicit case-owner decision names that authorization directly.

---

## Final Intended Change Scope

| File | Change | Reason |
|---|---|---|
| `transformation/IC-OD2-001-crux-mobile-ttfb-remeasurement-protocol.md` | Created (this file) | The protocol itself |
| `transformation/README.md` | Updated | Index entry for the new protocol |
| `transformation/OD-002-implementation-candidate-construction-workstream.md` | Updated | Status/reference-only addendum — no Phase 1–10 content altered |
| `current.md` | Updated | Records this protocol's creation and status |
| `Traceability.md` | Updated | Same convention |

**Not modified:** decisions/DD-018 through DD-035; design/OD-002-design-workstream.md; observations/O-012.md; diagnosis files. **Not created:** any `decisions/` gate file, any evidence record, any Round or intake package. No CrUX, PageSpeed Insights, or Search Console request was made. No automation or API key was introduced. No commit was created. Nothing was pushed.
