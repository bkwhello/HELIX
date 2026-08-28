# DD-036 — IC-OD2-001 CrUX Protocol Readiness Gate

---

**Independent HELIX Protocol Readiness Gate review**, performed by Claude acting as independent reviewer, 14 August 2026, for EC-002 — Konnichiwa Organic Visibility Growth.

**Task boundary:** independently review transformation/IC-OD2-001-crux-mobile-ttfb-remeasurement-protocol.md. This gate does not execute the protocol, access PageSpeed Insights or CrUX, retrieve data, create evidence, or authorize itself — it recommends only.

---

## Precondition Check

| # | Precondition | Result |
|---|---|---|
| 1 | Branch `feat/ec-002-visibility-baseline`; HEAD `750223ecb2cd86ec672b9c8d72f68eea6e2e72ba` | **PASS** |
| 2 | Dirty-tree scope matches exactly: `transformation/IC-OD2-001-crux-mobile-ttfb-remeasurement-protocol.md` untracked; `transformation/OD-002-implementation-candidate-construction-workstream.md`, `transformation/README.md`, `current.md`, `Traceability.md` modified; no other file changed/staged/untracked | **PASS** — `git status --porcelain` verified directly, returned exactly these five entries |
| 3 | Nothing staged | **PASS** |
| 4 | Local and remote branches synchronized (0 ahead / 0 behind) | **PASS** |
| 5 | DD-034's staged candidate selection remains unchanged | **PASS** |
| 6 | IC-OD2-001: Selected — Stage 1, Execution Not Authorized | **PASS** |
| 7 | IC-OD2-002: conditional, pending Stage 1 review | **PASS** |
| 8 | DD-035 Gate Verdict PASSED WITH CONDITIONS | **PASS** |
| 9 | DD-035 Case-Owner Decision authorizes protocol preparation only | **PASS** |
| 10 | All 15 DD-035 Set A conditions remain binding | **PASS** — none edited |
| 11 | All 32 DD-035 Set B boundaries remain binding | **PASS** — none edited |
| 12 | Protocol status: Prepared — Independent Readiness Review Required | **PASS** — verified in the protocol's own top status block prior to this gate's addendum |
| 13 | Protocol execution remains unauthorized | **PASS** |
| 14 | No CrUX/PageSpeed access occurred | **PASS** — verified by full-text scan; no access log, no retrieved data anywhere |
| 15 | No evidence was created | **PASS** |
| 16 | Historical baseline remains locked and unchanged | **PASS** |
| 17 | Stage 1 remains CS-4 — Insufficient Evidence | **PASS** |
| 18 | Host/Varnish remains Unconfirmed/Unconfirmed | **PASS** |
| 19 | Stage 2 Round 1 remains Evidence Insufficient | **PASS** |
| 20 | CE-DQ4-A remains unresolved | **PASS** |
| 21 | CE-DQ4-C/E/F/G remain uninvestigated | **PASS** |
| 22 | OD-001 Candidate D remains separate and unexecuted | **PASS** (`candidate_d_protocol_executed: false`) |
| 23 | Stage 2 preparation remains unauthorized | **PASS** |
| 24 | Feasibility and implementation remain unauthorized | **PASS** |
| 25 | `transformation_authorized` remains `false` | **PASS** |
| 26 | `external_changes_authorized` remains `false` | **PASS** |
| 27 | No Protocol Readiness Gate already exists | **PASS** — no `decisions/DD-036*` or equivalent existed prior to this task |

**All twenty-seven preconditions passed, including the expected dirty-tree state. Proceeding.**

**Actual dirty-tree count confirmed by direct `git status --porcelain` inspection:** 4 modified files + 1 untracked file = 5 total, matching the intended scope exactly, with nothing staged.

---

## Review Sources (read in full for this review)

observations/O-012.md; diagnosis/DQ-004-investigation.md; diagnosis/OD-002-absence-of-html-caching-layer.md; decisions/DD-018-dq-004-diagnosis-establishment-gate.md; decisions/DD-032-od-002-design-establishment-gate.md; decisions/DD-034-od-002-implementation-candidate-readiness-gate.md; decisions/DD-035-ic-od2-001-crux-protocol-authorization-gate.md; transformation/OD-002-implementation-candidate-construction-workstream.md; transformation/IC-OD2-001-crux-mobile-ttfb-remeasurement-protocol.md (read in full); current.md; Traceability.md. This gate does not rely solely on the protocol's own self-validation — every baseline field, the window mathematics, and the calculation/outcome routing were independently re-derived below, not merely re-read.

---

## Part 1 — Authority and Scope Review

| Test | Finding | Verdict |
|---|---|---|
| Protocol preparation was authorized | decisions/DD-035 Case-Owner Decision: `AUTHORIZED WITH CONDITIONS TO PREPARE IC-OD2-001 CRUX REMEASUREMENT PROTOCOL` | **PASS** |
| Execution was not authorized | DD-035 Set A Condition 11: "Preparing the protocol does not authorize executing it"; protocol's own Status block: `Protocol Execution: Not Authorized` | **PASS** |
| Protocol is limited to IC-OD2-001 | Title and Status block name only IC-OD2-001; no other candidate's fields appear anywhere in the document | **PASS** |
| Source and metric remain CrUX/mobile/TTFB | Phase 2 confirms throughout; no alternate metric introduced | **PASS** |
| OD-001 remains separate | Phase 12 explicit; no shared execution decision implied | **PASS** |
| Stage 2 cannot start automatically | Phase 8's table states "Remains conditional" for every one of seven outcomes; DD-034/DD-035 conditions restated | **PASS** |
| No mechanism or business outcome implied | Phase 1's Purpose exclusions list bars cache/Varnish/backend/ranking/conversion/revenue/reservation/intervention conclusions explicitly | **PASS** |

**Part 1 verdict: PASS.** No scope violation found.

---

## Part 2 — Historical Baseline Review

Every field independently re-verified against observations/O-012.md and diagnosis/DQ-004-investigation.md Phase 1 directly, not against the protocol's own restatement.

| Field | Protocol's Claim | Independent Verification | Classification |
|---|---|---|---|
| Canonical origin | `https://konnichiwa.nl/` | DQ-004 Phase 1: "Tested origin: `https://konnichiwa.nl/` (origin-level, not a specific URL...)" | **Confirmed** |
| Origin-level scope | Origin-level | DQ-004 Phase 1: "Aggregation level: Origin-level" | **Confirmed** |
| Mobile device class | Mobile; TTFB/INP not available for desktop | DQ-004 Phase 1: "Mobile vs. desktop: Reported separately; INP and TTFB are not available for desktop" | **Confirmed** |
| TTFB metric | Time to First Byte, marked experimental | O-012, DQ-004 Phase 1 both confirm | **Confirmed** |
| Rolling 28-day window | 28-day rolling CrUX window | O-012, DQ-004 Phase 1 both confirm | **Confirmed** |
| 2026-06-24 through 2026-07-21 | Historical window | O-012: "Date range: 28-day CrUX window, 24 June–21 July 2026" | **Confirmed** |
| 26% poor share | 26% | O-012, DQ-004 Phase 1 both confirm | **Confirmed** |
| Historical, not current | Labeled throughout as historical | Consistently dated in every citation across the protocol | **Confirmed** |
| Core Web Vitals Passed, separate | Passed, kept structurally separate from the TTFB comparison | O-012's own table structure keeps Core Web Vitals separate from the TTFB paragraph; the protocol never merges the two anywhere in Phases 7–8 | **Confirmed** |
| Report capture timestamp | 2026-07-24 06:19:15, Europe/Amsterdam | O-012: "Report generated: 24 July 2026, 06:19:15" — date/time confirmed; **the timezone is not stated in the original source** | **Confirmed With Limitation** — date/time Confirmed; timezone is a protocol-added convenience label, now inline-flagged "(assumed, not sourced — see UMF-004)" per this gate's bounded correction (see Part 3) |
| Source/report type | PageSpeed Insights interactive report | O-012's attempt log confirms the interactive report succeeded where the API failed | **Confirmed** |
| Failed API attempts | Two HTTP 429s, no API key configured | O-012's attempt log confirms exactly two 429 rows | **Confirmed** |
| Limitations | TTFB experimental status; no page-level isolation; two failed automated attempts | O-012/DQ-004 both state these explicitly | **Confirmed** |

**No field is Unconfirmed or Incorrect.** The single Confirmed-With-Limitation field (report timezone) was already disclosed by the protocol's own closing note before this gate began, and is now more precisely flagged inline (Part 3/Part 13 below) rather than only in a trailing footnote.

**Part 2 verdict: PASS.** The baseline is accurately reconstructed and honestly labeled; the one limitation found is a presentation-precision issue, not a factual error, and has been corrected.

---

## Part 3 — UMF-001–007 Review

Each field independently checked against decisions/DD-035 Part 2's original classification (the source these were carried forward from), not merely against the protocol's own restatement.

| ID | Field | Classification Correct? | Blocks Approval? | Blocks Execution? | Resolution Without Inventing Facts | Fallback |
|---|---|---|---|---|---|---|
| UMF-001 | TTFB percentile/distribution basis | **Requires interpretive ruling — see below** | No, per this gate's ruling | Yes | State the assumed p75 convention explicitly at the time it is used for calculation, flagged as inherited convention | Record the displayed percentage without asserting a percentile basis |
| UMF-002 | PageSpeed interface/version | Correct, matches DD-035 verbatim | No | Yes | Record which interface is used at retrieval time | Classify OUT-06 if the interface materially changes the display |
| UMF-003 | CrUX release/freshness cadence | Correct, matches DD-035 verbatim | No | No | May cite Google's public documentation as non-case-evidence context | Proceed unresolved |
| UMF-004 | Timezone basis | Correct, matches DD-035 verbatim | No | No | Apply Europe/Amsterdam consistently, now inline-flagged as assumed (Part 2's correction) | Immaterial to a 28-day comparison if applied consistently |
| UMF-005 | Country segmentation | Correct, matches DD-035 verbatim | No | Yes, if future report is segmented | None — a segmented future report is not like-for-like | Classify OUT-06 |
| UMF-006 | Connection-type segmentation | Correct, matches DD-035 verbatim | No | Yes, same condition | None | Classify OUT-06 |
| UMF-007 | Historical report reproducibility | Correct, matches DD-035 verbatim | No | Yes | Attempt confirmation only at execution time; does not alter the locked Phase 2 baseline either way | Proceed using the locked baseline; note non-reproducibility as a limitation |

**Interpretive ruling on UMF-001 (genuine finding, this gate):** decisions/DD-035 Part 2 originally labeled this field "Condition to Resolve Before Protocol Approval," which read literally could mean this readiness gate should withhold approval until the percentile basis is resolved. The protocol itself instead classifies it as blocking execution only, not readiness. **On independent review, the protocol's operational treatment is the substantively correct one:** a concrete percentile assumption cannot be meaningfully fixed before the future calculation that will use it, and demanding resolution now would require asserting an unverified fact prematurely — precisely what DD-035 Set A Condition 3 (resolving nothing by assumption) prohibits. **Ruling:** "Condition to Resolve Before Protocol Approval" in DD-035 is satisfied here by explicit, disclosed deferral with a stated resolution method — not by premature resolution. This ruling is recorded as a binding interpretive condition (Part 15) rather than left as a silent inconsistency between DD-035's wording and the protocol's practice.

**Part 3 verdict: CONDITIONAL PASS.** Six of seven fields transfer cleanly; one (UMF-001) required this gate's own interpretive ruling to resolve an apparent labeling tension — resolved without inventing any new fact, and without blocking readiness.

---

## Part 4 — Target Window Review

**Mathematics, independently re-derived:**

- 2026-07-22 through 2026-07-31 = 10 days; 2026-08-01 through 2026-08-18 = 18 days; 10 + 18 = **28 days exactly.** Confirmed.
- Historical window ends 2026-07-21; target window begins 2026-07-22 — **zero calendar overlap, immediately following.** Confirmed.

**Operational feasibility assessment:**

CrUX/PageSpeed exposes a rolling period controlled by Google's own reporting cycle, not a user-selectable arbitrary historical range — the protocol correctly does not assume the source will expose exactly 2026-07-22–2026-08-18 at execution time (Phase 4: "not evidence that the CrUX source will expose this exact period"). The protocol correctly requires source-side confirmation before proceeding, and correctly names OUT-05/OUT-06 as the fallback routes if the displayed window differs materially. This gate did not access the source to answer this question, consistent with its own boundary.

**Classification: Ready With Source-Availability Condition.** Not "Ready" outright, because genuine availability cannot be confirmed without future read-only access this gate must not perform; not "Not Operationally Achievable," since nothing in the case record suggests infeasibility; not "Unassessable Before Read-Only Access," since the protocol's own construction already correctly handles the uncertainty through conditional outcomes and stop conditions rather than leaving the question open.

**Part 4 verdict: PASS.** Mathematics independently confirmed exact; feasibility handling appropriately conditional.

---

## Part 5 — Retrieval and Lapse Review

| Requirement | Finding |
|---|---|
| No fixed retrieval date | Confirmed — Phase 4 sets a rule, not a date |
| Complete-window requirement | Confirmed — retrieval only after 2026-08-18 |
| Source-availability requirement | Confirmed — retrieval only when the source confirms an equivalent period exists |
| Absence of invented reporting lag | Confirmed — the single 3-day observation from DD-035 is explicitly not adopted as a rule |
| Proposed lapse date 2026-10-31 | Confirmed present |
| Labelled Operational Choice | Confirmed |
| Procedure after lapse | **Genuine gap found, this gate.** The original protocol stated the lapse date's purpose but did not explicitly state that authorization automatically expires on that date or that execution after lapse requires a new decision — it was implied ("prevents indefinite execution-authorization drift") but not stated as a binding rule. **Corrected:** an explicit expiry rule has been added to Phase 4 (bounded correction, dated and attributed inline), stating authorization automatically expires on the lapse date if unused, and execution after lapse requires a new, separate, explicit case-owner decision. |

**Part 5 verdict: CONDITIONAL PASS, now resolved.** The genuine gap identified has been closed by the smallest available correction — one added sentence, not a rewrite of Phase 4.

---

## Part 6 — Execution Manifest Review

All fourteen original steps (Phase 5) independently reviewed:

| Property | Assessment |
|---|---|
| Read-only | All 14 steps — confirmed, no step writes, mutates, or configures anything |
| Reproducible | Confirmed — steps reference the locked Phase 2 baseline for what to confirm/compare |
| Sufficiently specific | Confirmed — Step 4 names the exact canonical origin; Steps 5–10 name exact fields to confirm and record |
| Free of authenticated access | Confirmed — Step 3 explicitly "approved public read-only" source only |
| Free of API-key dependence | Confirmed — no step references an API key; Phase 5's closing statement is explicit |
| Non-mutating | Confirmed |
| Capable of stopping before invalid evidence is created | Confirmed — Step 14 is an explicit stop gate, and Step 1 (verify authorization) correctly precedes every access-related step, so no step could occur before authorization is checked |

**No step could accidentally constitute data collection before execution authorization** — Step 1's position as the first step, combined with the Status block's own "Protocol Execution: Not Authorized" flag and this gate's own added expiry rule (Part 5), together ensure the sequence cannot begin without a live, unexpired authorization already in place.

**Part 6 verdict: PASS.**

---

## Part 7 — Calculation Review

**Rules independently verified:** delta formula (future % minus historical 26%), historical comparator (26%, locked), displayed-precision rule (no invented decimals), rounding treatment (record, don't normalize), mobile/desktop separation, origin/URL separation, field/lab separation, and explicit prohibitions on statistical-significance, materiality, and causal-inference claims — all present and correctly stated in Phase 7.

**Sample-value test (performed without accessing any external data — applying the protocol's own written rules to hypothetical inputs only):**

| Sample | Delta | Direction | Routes To | Correct? |
|---|---|---|---|---|
| Future poor share 20% | 20% − 26% = −6 pts | Lower | OUT-01 | **Yes** |
| Future poor share 26% | 0 pts | Unchanged at Displayed Precision | OUT-02 | **Yes** |
| Future poor share 31% | +5 pts | Higher | OUT-03 | **Yes** |
| Rounded shares summing to 99% or 101% | Not applicable to the poor-share delta itself | — | Recorded as a rounding-difference note per Phase 7's rounding rule; does not block the poor-share delta calculation, which depends only on the poor % value | **Yes** — the rounding rule and the delta rule are independent and compose correctly |
| Missing poor-share value | Not computable | — | Phase 10's "TTFB distribution is unavailable" stop condition triggers; no classification is made directly; the case is recorded per OUT-05 ("Data Unavailable") | **Yes** — correctly routes via the interaction of Phase 10 and Phase 8, though the document does not contain an explicit one-to-one stop-condition-to-outcome mapping table; this is a usability observation (Part 14, G-21), not a correctness defect |

**Part 7 verdict: PASS.** All five sample values route correctly under the protocol's own written rules.

---

## Part 8 — OUT-01–OUT-07 Review

| Outcome | Exact Trigger | Verified Permitted | Verified Prohibited | Verified: Never Auto-Starts Stage 2 |
|---|---|---|---|---|
| OUT-01 | Future displayed poor share < 26% | "The measured share is lower at this reading" | Mechanism proof; ranking/conversion/reservation improvement | **Yes** — "Remains conditional" |
| OUT-02 | Future displayed poor share = 26% at displayed precision | "The measured share is stable" | That the condition is acceptable/resolved/free of impact | **Yes** |
| OUT-03 | Future displayed poor share > 26% | "The measured share is higher" | Mechanism proof; that intervention is now required | **Yes** |
| OUT-04 | Comparable data, limited interpretation | Data recorded with limits stated | Any directional conclusion stated with unwarranted confidence | **Yes** |
| OUT-05 | Data unavailable | Recorded as legitimate, closed-for-now | Unavailability implying any direction | **Yes** |
| OUT-06 | Not comparable | Mismatch named | Any directional/magnitude conclusion | **Yes** |
| OUT-07 | Unresolved/contradictory | Contradiction recorded | Any single conclusion selected to resolve it | **Yes** |

**Specific confirmations, independently checked against each outcome's own Prohibited Conclusion column:** OUT-01 does not permit an improvement-mechanism claim; OUT-02 does not permit a no-problem claim (explicitly, "unchanged" is a measurement classification only); OUT-03 does not permit a backend-deterioration claim; OUT-04 bars all three directional claims when interpretation is limited; OUT-05 bars reading unavailability as zero in any direction; OUT-06 bars any comparison when not comparable; OUT-07 bars resolving a contradiction by fiat.

**Part 8 verdict: PASS.** All seven outcomes independently confirmed sound.

---

## Part 9 — Confounder Review

CF-001 through CF-012 checked against the task's own required twelve-item list — a direct 1:1 match confirmed (origin-level page mix, mobile network/traffic mix, geographic mix, time/load variability, website deployments, hosting changes, configuration changes, caching changes, Google/CrUX methodology changes, seasonal traffic differences, baseline aging, source/interface differences).

- **All relevant confounders represented:** Confirmed.
- **Missing evidence defaults to Unknown:** Confirmed for all twelve rows. CF-010 and CF-011 use slightly more qualified phrasing ("Weakly Unknown — windows adjacent, but seasonality itself not evidenced"; "Acknowledged, not resolved") rather than a bare "Unknown" — independently reviewed and found substantively compliant, since neither phrasing asserts equivalence or resolves the confounder in either direction; both remain non-committal.
- **No confounder requires unauthorized access:** Confirmed — every row's evidence source is either "Not accessed," "Not observable," or repository-internal.
- **Absence never inferred:** Confirmed.
- **Confounders limit interpretation without invalidating visible facts:** Confirmed — the confounder register bounds how a delta may be interpreted without preventing the delta itself from being recorded (Phase 7 proceeds independent of confounder status).

**Part 9 verdict: PASS.**

---

## Part 10 — Stop-Condition Review

Fourteen original stop conditions checked against the task's own required fourteen-item list — direct 1:1 match confirmed for: no execution authorization, early execution, lapsed authorization, incomplete window, non-comparable source window, URL-level instead of origin-level, desktop without mobile, missing TTFB distribution, lab-only result, credentials/API-key requirement, privacy exposure, methodology change, material protocol deviation, mutation requirement.

**Source-window ambiguity check (per this task's explicit instruction to add a condition if not already covered):** the original fourteen conditions cover an *incomplete* window and a *non-comparable* window, but not the distinct case where a window is displayed in full but its **exact start/end dates cannot be determined** from the source's own display. This is a genuine, real gap — a source could show "last 28 days" without explicit calendar dates, which is neither "incomplete" nor immediately "non-comparable" but still prevents the like-for-like disclosure Phase 4 requires. **Corrected:** a fifteenth stop condition has been added (bounded correction, dated and attributed inline in Phase 10).

**Part 10 verdict: CONDITIONAL PASS, now resolved.** The one genuine gap identified has been closed by the smallest available addition — one new list item, not a restructuring of Phase 10.

---

## Part 11 — Privacy and Access Review

Future execution is confirmed limited to approved public read-only access (Phase 5 Step 3). All ten prohibited-item categories checked:

credentials (Phase 10, Phase 5 Step 13) · authenticated sessions (Phase 5 explicit) · account data (Phase 10) · customer/reservation data (inherited by reference via Set A Condition 13, pulling in the full DD-029/030 checklist; low residual risk given the data source is a public performance report) · server logs (inherited by reference) · raw IP addresses (inherited by reference) · internal server paths (inherited by reference) · API keys (Phase 5, Phase 10, explicit) · production settings (Phase 10) · automation (Phase 5, Phase 1 Set A Condition 12, explicit).

**Observation, not a defect:** several categories (customer data, server logs, raw IPs, internal paths) are covered by reference to DD-029/030's fuller checklist rather than restated inline in this protocol — consistent with the case's own stated practice ("cited by reference... to avoid drift between copies," Phase 1) and low-risk given a public PageSpeed report cannot plausibly expose these categories.

**Part 11 verdict: PASS.**

---

## Part 12 — OD-001 Separation Review

Independently confirmed: OD-001 Candidate D (Search Console, query themes, 61-day window, decisions/DD-023/DD-024) and IC-OD2-001 (CrUX, mobile TTFB, 28-day window, decisions/DD-032/033/034/035) remain fully distinct in metric, source, window, and governing decision chain. Neither substitutes for the other; neither result may classify the other; execution schedules remain separately governed (OD-001's window opens no earlier than 21 September 2026; IC-OD2-001's depends on this protocol's own rules and a future separate authorization). No shared execution decision is implied anywhere in either artifact.

**Part 12 verdict: PASS.**

---

## Part 13 — Independent Challenge

| # | Attack | Verdict | Basis |
|---|---|---|---|
| 1 | 26% treated as current | **Survives** | Part 2 |
| 2 | Target window availability assumed | **Survives** | Part 4 |
| 3 | Rolling window incorrectly treated as selectable | **Survives** | Phase 4 explicitly denies this |
| 4 | Retrieval date implied without source availability | **Survives** | Part 5 |
| 5 | Reporting lag invented | **Survives** | Part 5 |
| 6 | Lapse date treated as evidence-derived | **Survives with Narrowing** | Phase 4 already labels it Operational Choice; **narrowed further by this gate's added expiry rule** (Part 5), closing the related "procedure after lapse" gap |
| 7 | Lab substituted for field | **Survives** | Part 7 |
| 8 | Desktop mixed with mobile | **Survives** | Part 7 |
| 9 | URL mixed with origin | **Survives** | Part 7 |
| 10 | Public timing mixed with CrUX | **Survives** | Part 7 |
| 11 | Lower result treated as cache proof | **Survives** | Part 8, OUT-01 |
| 12 | Higher result treated as backend proof | **Survives** | Part 8, OUT-03 |
| 13 | Unchanged result treated as no problem | **Survives** | Part 8, OUT-02 |
| 14 | Missing result treated as zero | **Survives** | Part 8, OUT-05 |
| 15 | Rounding silently normalized | **Survives** | Part 7 |
| 16 | Statistical significance implied | **Survives** | Part 7 |
| 17 | Confounders assumed absent | **Survives** | Part 9 |
| 18 | Stage 2 automatically triggered | **Survives** | Part 8 |
| 19 | Execution begins during readiness review | **Survives** | This gate itself performed no CrUX/PageSpeed access, retrieval, or evidence creation — confirmed by this task's own conduct |
| 20 | API key or automation normalized | **Survives** | Part 6, Part 11 |
| 21 | OD-001 and OD-002 merged | **Survives** | Part 12 |
| 22 | Ranking or commercial benefit inferred | **Survives** | Part 1, Phase 1 Purpose exclusions |
| 23 | Protocol status overstates readiness | **Survives** | Status block reads "Independent Readiness Review Required" (before this gate) and now "Readiness Reviewed, Execution Decision Pending" (after) — neither overstates as execution-ready |
| 24 | Lifecycle stages collapse | **Survives** | `current_stage` remains Organizational Design throughout; Phase 11's explicit prohibition list |

**Twenty-two Survive outright; one Survives with Narrowing (6), resolved by a bounded correction already applied in Part 5. This gate additionally found and closed two further genuine gaps not named as attacks by the protocol's own original twenty-two-item self-test (Part 3's UMF-001 interpretive tension; Part 10's stop-condition gap) — recorded above as Part 3/Part 5/Part 10 findings, not hidden inside the challenge table.**

---

## Part 14 — Gate Criteria (G-01–G-22)

| Criterion | Verdict | Reasoning |
|---|---|---|
| G-01 Valid authority | **PASS** | Part 1 |
| G-02 Baseline integrity | **PASS** | Part 2 — all fields Confirmed or Confirmed With Limitation, none Incorrect |
| G-03 UMF integrity | **CONDITIONAL PASS** | Part 3 — six of seven transfer cleanly; UMF-001 required this gate's own interpretive ruling |
| G-04 Target-window mathematics | **PASS** | Part 4 — independently re-derived, exact |
| G-05 Target-window operational feasibility | **CONDITIONAL PASS** | Part 4 — Ready With Source-Availability Condition, inherently not fully confirmable without future access |
| G-06 Retrieval-rule integrity | **PASS** | Part 5 |
| G-07 Lapse governance | **CONDITIONAL PASS, now resolved** | Part 5 — expiry-procedure gap found and closed |
| G-08 Execution reproducibility | **PASS** | Part 6 |
| G-09 Calculation correctness | **PASS** | Part 7 — five sample values independently tested |
| G-10 Rounding discipline | **PASS** | Part 7 |
| G-11 Outcome completeness | **PASS** | Part 8 |
| G-12 Confounder containment | **PASS** | Part 9 |
| G-13 Stop-condition completeness | **CONDITIONAL PASS, now resolved** | Part 10 — source-window-ambiguity gap found and closed |
| G-14 Privacy/access safety | **PASS** | Part 11 |
| G-15 Field/lab separation | **PASS** | Part 7 |
| G-16 Mobile/desktop separation | **PASS** | Part 7 |
| G-17 Origin/URL separation | **PASS** | Part 7 |
| G-18 Non-causal interpretation | **PASS** | Part 8 |
| G-19 OD-001 separation | **PASS** | Part 12 |
| G-20 Lifecycle containment | **PASS** | Part 13, Attack 24 |
| G-21 Operational usability | **PASS** | Concrete and actionable; the stop-condition-to-outcome cross-reference gap noted in Part 7 is a usability observation, not a blocking defect |
| G-22 Falsifiability | **PASS** | Part 13's twenty-four-item independent challenge plus the protocol's own twenty-two-item self-test both confirm robustness |

**No FAIL. Eighteen PASS, four CONDITIONAL PASS (G-03, G-05, G-07, G-13) — three of the four (G-07, G-13, and G-03's interpretive resolution) are now resolved by bounded corrections applied in the course of this review; G-05 remains inherently conditional on future source availability, which no repository-only review can confirm.**

---

## Part 15 — Gate Verdict

**Gate Verdict: PASSED WITH CONDITIONS.**

**Recommendation: RECOMMEND APPROVED WITH CONDITIONS FOR READ-ONLY CRUX REMEASUREMENT EXECUTION.**

This recommendation is **not** authorization. Kelvin's explicit response is requested below.

### Binding Conditions (if approved)

1. All fifteen DD-035 Set A conditions and all thirty-two DD-035 Set B boundaries remain independently binding and are not narrowed by this gate.
2. All condition sets inherited by reference (DD-033 Set A/B, DD-032's establishment conditions and additional boundaries, DD-034 Set A/B) remain independently binding.
3. **UMF-001 interpretive ruling (Part 3):** the TTFB percentile/distribution basis is not required to be resolved before execution readiness; it must be stated explicitly, flagged as inherited convention, at the moment it is actually used in a future calculation — deferral with disclosure satisfies DD-035's original condition, premature assertion would violate it.
4. The lapse-expiry rule added to Phase 4 (Part 5) is binding: any execution authorization for this protocol automatically expires on its approved lapse date if unused, and execution after lapse requires a new, separate, explicit case-owner decision.
5. The fifteenth stop condition added to Phase 10 (Part 10) is binding: execution must stop, with no classification made, if the source does not clearly display exact start/end dates for the field-data window.
6. The target window remains classified Ready With Source-Availability Condition, not Ready outright — a future execution must independently confirm the displayed window before proceeding, per Phase 4/Phase 10.
7. No numeric materiality threshold is approved by this gate; the seven qualitative outcomes (OUT-01–07) remain the only pre-registered outcomes.
8. Stage 2 (IC-OD2-002) does not start automatically from any execution result, under any outcome.
9. Preparing and reviewing this protocol does not authorize executing it; a future retrieval requires its own separate, explicit case-owner authorization naming that specific action.
10. OD-001 Candidate D and OD-003 remain entirely unaffected by, and unreferenced within, this gate beyond the Part 12 separation review.
11. `od_002_stage_1_execution_authorized`, `od_002_stage_2_preparation_authorized`, `od_002_feasibility_execution_authorized`, `od_002_implementation_authorized`, `transformation_authorized`, and `external_changes_authorized` all remain `false`, unconditionally, regardless of Kelvin's response to this gate.

```yaml
current_stage: Organizational Design
od_002_stage_1_protocol_created: true
od_002_stage_1_protocol_status: Prepared — Readiness Reviewed, Execution Decision Pending
od_002_stage_1_protocol_readiness_gate: DD-036 — Passed With Conditions
od_002_stage_1_execution_decision: Pending
od_002_stage_1_execution_authorized: false
od_002_stage_1_execution_started: false
od_002_stage_2_preparation_authorized: false
od_002_feasibility_execution_authorized: false
od_002_implementation_authorized: false
transformation_authorized: false
external_changes_authorized: false
```

---

## Requested Case-Owner Response

This gate recommends; it does not authorize. No response is inferred from general permission to "continue," from approval of any prior message, or from anything not naming one of the following explicitly.

```
APPROVED FOR READ-ONLY CRUX REMEASUREMENT EXECUTION

APPROVED WITH CONDITIONS FOR READ-ONLY CRUX REMEASUREMENT EXECUTION

NOT APPROVED FOR EXECUTION
```

No response above may be read as authorizing Stage 2 preparation, feasibility execution, implementation, Transformation, or any external/production change — each remains a separate, later, distinct gate.

---

## Final Intended Change Scope

| File | Change | Reason |
|---|---|---|
| `decisions/DD-036-ic-od2-001-crux-protocol-readiness-gate.md` | Created (this file) | The Protocol Readiness Gate itself |
| `transformation/IC-OD2-001-crux-mobile-ttfb-remeasurement-protocol.md` | Bounded corrections + status addendum | Three genuine gaps closed (timezone-assumption flag, lapse-expiry rule, fifteenth stop condition), each dated and attributed inline; a status-only addendum records the review outcome without altering any other substantive content |
| `transformation/README.md` | Updated | Status reflects independent review completion |
| `transformation/OD-002-implementation-candidate-construction-workstream.md` | Updated | Status/reference-only addendum |
| `current.md` | Updated | Records this gate's existence, verdict, and pending execution decision |
| `Traceability.md` | Updated | Same convention |

**Not modified:** decisions/DD-018 through DD-035; design/OD-002-design-workstream.md; observations/O-012.md; diagnosis files. **Not created:** any evidence record, any execution log. No CrUX, PageSpeed Insights, or Search Console request was made. No credential, password, API key, token, cookie, or FTP/SSH access was requested or accessed. No candidate was selected or re-selected. No commit was created. Nothing was pushed.

---

## Case-Owner Decision (recorded 14 August 2026)

**This section records Kelvin Wong's explicit response to the recommendation above. It does not replace, edit, or overwrite the Precondition Check, Review Sources, Part 1 (Authority and Scope Review), Part 2 (Historical Baseline Review), Part 3 (UMF-001–007 Review), Part 4 (Target Window Review), Part 5 (Retrieval and Lapse Review), Part 6 (Execution Manifest Review), Part 7 (Calculation Review), Part 8 (OUT-01–OUT-07 Review), Part 9 (Confounder Review), Part 10 (Stop-Condition Review), Part 11 (Privacy and Access Review), Part 12 (OD-001 Separation Review), Part 13 (Independent Challenge), Part 14 (Gate Criteria G-01–G-22), Part 15's Gate Verdict (PASSED WITH CONDITIONS) and Recommendation (RECOMMEND APPROVED WITH CONDITIONS FOR READ-ONLY CRUX REMEASUREMENT EXECUTION), the eleven original binding conditions, the Requested Case-Owner Response, or the Final Intended Change Scope's historical "Pending" state that preceded this decision — all remain intact above, unmodified, as the historical record of this independent gate review.**

```yaml
decision: APPROVED WITH CONDITIONS FOR READ-ONLY CRUX REMEASUREMENT EXECUTION
authorized_by: Kelvin Wong
authorization_date: 2026-08-14
gate_reference: DD-036
```

Kelvin Wong, as case owner of EC-002 — Konnichiwa Organic Visibility Growth, issues:

> APPROVED WITH CONDITIONS FOR READ-ONLY CRUX REMEASUREMENT EXECUTION

### Authorized Scope

One bounded, public, read-only execution of transformation/IC-OD2-001-crux-mobile-ttfb-remeasurement-protocol.md is authorized, limited to retrieving and recording comparable origin-level mobile CrUX TTFB field data for konnichiwa.nl.

**This authorization does not include:** classification acceptance; Stage 2 activation; technical investigation; implementation; Transformation execution; external changes.

### Binding Conditions — Set A: DD-036 Gate Conditions (verbatim, from decisions/DD-036 Part 15)

1. All fifteen DD-035 Set A conditions and all thirty-two DD-035 Set B boundaries remain independently binding and are not narrowed by this gate.
2. All condition sets inherited by reference (DD-033 Set A/B, DD-032's establishment conditions and additional boundaries, DD-034 Set A/B) remain independently binding.
3. UMF-001 interpretive ruling (Part 3): the TTFB percentile/distribution basis is not required to be resolved before execution readiness; it must be stated explicitly, flagged as inherited convention, at the moment it is actually used in a future calculation — deferral with disclosure satisfies DD-035's original condition, premature assertion would violate it.
4. The lapse-expiry rule added to Phase 4 (Part 5) is binding: any execution authorization for this protocol automatically expires on its approved lapse date if unused, and execution after lapse requires a new, separate, explicit case-owner decision.
5. The fifteenth stop condition added to Phase 10 (Part 10) is binding: execution must stop, with no classification made, if the source does not clearly display exact start/end dates for the field-data window.
6. The target window remains classified Ready With Source-Availability Condition, not Ready outright — a future execution must independently confirm the displayed window before proceeding, per Phase 4/Phase 10.
7. No numeric materiality threshold is approved by this gate; the seven qualitative outcomes (OUT-01–07) remain the only pre-registered outcomes.
8. Stage 2 (IC-OD2-002) does not start automatically from any execution result, under any outcome.
9. Preparing and reviewing this protocol does not authorize executing it; a future retrieval requires its own separate, explicit case-owner authorization naming that specific action.
10. OD-001 Candidate D and OD-003 remain entirely unaffected by, and unreferenced within, this gate beyond the Part 12 separation review.
11. `od_002_stage_1_execution_authorized`, `od_002_stage_2_preparation_authorized`, `od_002_feasibility_execution_authorized`, `od_002_implementation_authorized`, `transformation_authorized`, and `external_changes_authorized` all remain `false`, unconditionally, regardless of Kelvin's response to this gate.

**Note on Condition 9 and Condition 11, preserved verbatim above without correction:** at the time Part 15 was written, executing the protocol required "its own separate, explicit case-owner authorization" and every listed flag remained `false` "regardless of Kelvin's response to this gate" — that authorization is exactly what this Case-Owner Decision section now provides, as a later, separate act, not a retroactive edit to the gate's own verdict text. `od_002_stage_1_execution_authorized` moves to `true` below, consistent with, not contradicting, Condition 9.

### Binding Conditions — Set B: Case-Owner Execution Conditions (new to this Case-Owner Decision)

1. Execution is prohibited on or before 18 August 2026.
2. Earliest possible execution date is 19 August 2026, but this is not a guaranteed source-availability date.
3. Execution may occur only when the source visibly confirms a complete, comparable field-data period.
4. The intended target window is 22 July–18 August 2026 inclusive.
5. If the source does not visibly provide exact start/end dates, the execution must stop under the protocol's displayed-but-undated-window condition.
6. If the displayed window differs from the target window, it may not be silently treated as equivalent.
7. A different displayed window must be classified as Method Not Comparable, Data Unavailable or routed for a new case-owner decision.
8. The historical comparator remains 26% poor mobile TTFB for 24 June–21 July 2026.
9. The historical 26% value must remain labelled historical.
10. Authorization expires after 31 October 2026.
11. Execution after 31 October 2026 requires a new explicit case-owner decision.
12. Authorization permits one execution attempt only.
13. A stopped attempt caused by unavailable or non-comparable data does not authorize repeated attempts.
14. Any later attempt requires a separate case-owner instruction.
15. Access is limited to a public, read-only PageSpeed/CrUX source.
16. No login, authenticated session, API key or credential may be used.
17. No automation or recurring monitoring may be created.
18. No lab result may substitute for CrUX field data.
19. Mobile and desktop data must remain separate.
20. Origin-level and URL-level data must remain separate.
21. Public request timing must remain separate from CrUX.
22. Displayed percentages must be recorded exactly at displayed precision.
23. Rounding differences must be recorded, not silently normalized.
24. No statistical significance or materiality claim may be made.
25. No lower, equal or higher result establishes a cache, Varnish or backend mechanism.
26. OUT-01–OUT-07 remain the only pre-registered outcome classes.
27. Missing data must never be encoded as zero.
28. All CF-001–CF-012 confounders remain Unknown unless separately evidenced.
29. Execution creates evidence but does not itself classify or accept the outcome.
30. A separate independent classification gate is mandatory after execution.
31. No outcome automatically starts IC-OD2-002.
32. Stage 2 preparation remains unauthorized pending formal Stage 1 classification and case-owner review.
33. OD-001 Candidate D remains separate and unexecuted.
34. No ranking, conversion, revenue or reservation benefit may be inferred.
35. No technical or production setting may be changed.
36. `implementation_authorized` remains `false`.
37. `transformation_authorized` remains `false`.
38. `external_changes_authorized` remains `false`.

Both condition sets — Set A (eleven, Part 15's own numbering) and Set B (thirty-eight, new to this Case-Owner Decision) — are kept **separately titled with their own provenance**; neither is merged, renumbered, paraphrased, or deduplicated into the other.

### Execution Stop Rule

If execution occurs before 19 August 2026, after 31 October 2026, without a complete visibly dated comparable window, or through a source requiring authentication/API credentials, it is **unauthorized and must stop without creating evidence.**

### Effect on Lifecycle State

```yaml
current_stage: Organizational Design
od_002_stage_1_protocol_readiness_gate: DD-036 — Passed With Conditions
od_002_stage_1_execution_decision: Approved With Conditions — One Public Read-Only Attempt
od_002_stage_1_execution_authorized: true
od_002_stage_1_execution_mode: Public Read-Only CrUX/PageSpeed
od_002_stage_1_execution_not_before: 2026-08-19
od_002_stage_1_execution_target_window: 2026-07-22 through 2026-08-18
od_002_stage_1_execution_authorization_expires: 2026-10-31
od_002_stage_1_execution_attempt_limit: 1
od_002_stage_1_execution_started: false
od_002_stage_1_execution_completed: false
od_002_stage_1_evidence_created: false
od_002_stage_1_classification_status: Not Started
od_002_stage_2_preparation_authorized: false
od_002_feasibility_execution_authorized: false
od_002_implementation_authorized: false
transformation_authorized: false
external_changes_authorized: false
```

`od_002_stage_1_execution_authorized` moves from `false` to `true` — **one bounded, public, read-only execution attempt is now authorized, strictly within the window, date, attempt-limit, and condition boundaries above.** `od_002_stage_1_execution_started` and `od_002_stage_1_evidence_created` remain `false` — this decision does not itself execute the protocol. `od_002_stage_2_preparation_authorized`, `od_002_feasibility_execution_authorized`, `od_002_implementation_authorized`, `transformation_authorized`, and `external_changes_authorized` all remain `false`, unconditionally.

### Next Action

Wait until at least 19 August 2026; then perform at most one public read-only execution only if the source visibly confirms a complete comparable field-data window. **Do not execute during this decision-recording task.**

### Final Confirmations (post-decision)

| Confirmation | Status |
|---|---|
| Decision recorded: APPROVED WITH CONDITIONS FOR READ-ONLY CRUX REMEASUREMENT EXECUTION | **Confirmed** |
| Authorized scope: one bounded public read-only execution attempt | **Confirmed** |
| Prior Precondition Check, Review Sources, Parts 1–15, Gate Verdict, and Recommendation preserved unmodified above | **Confirmed** |
| All eleven Set A (DD-036 gate) conditions recorded verbatim | **Confirmed** |
| All thirty-eight Set B (execution) conditions recorded, separately provenanced | **Confirmed** |
| Execution prohibited on or before 18 August 2026 | **Confirmed** |
| Authorization expires 31 October 2026 | **Confirmed** |
| Attempt limit: exactly one | **Confirmed** |
| Source availability not assumed | **Confirmed** |
| No protocol execution occurred | **Confirmed** |
| No CrUX/PageSpeed data accessed | **Confirmed** |
| No evidence or execution artifact created | **Confirmed** |
| Stage 2 preparation remains unauthorized | **Confirmed** |
| OD-001 Candidate D remains separate and unexecuted | **Confirmed** |
| Stage 1 CS-4, Varnish Unconfirmed/Unconfirmed, Stage 2 Evidence Insufficient unchanged | **Confirmed** |
| CE-DQ4-C/E/F/G remain uninvestigated | **Confirmed** |
| Implementation, `transformation_authorized`, `external_changes_authorized` all remain `false` | **Confirmed** |
| Nothing committed or pushed | **Confirmed** — no `git add`, `git commit`, or `git push` was run in the course of this task |
