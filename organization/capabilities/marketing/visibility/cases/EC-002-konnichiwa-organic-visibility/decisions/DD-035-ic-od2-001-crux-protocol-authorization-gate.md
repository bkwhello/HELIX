# DD-035 — IC-OD2-001 CrUX Remeasurement Protocol Authorization Gate

---

**Independent HELIX authorization-gate review**, performed by Claude acting as independent reviewer, 14 August 2026, for EC-002 — Konnichiwa Organic Visibility Growth.

**Task boundary:** assess whether preparation of an IC-OD2-001 Like-for-Like CrUX Remeasurement Protocol is authorized and methodologically ready. This gate may recommend, at most, authorization to prepare a repository-only remeasurement protocol. It does not create the protocol, access PageSpeed Insights/CrUX/Search Console or any other external system, retrieve current performance data, execute Stage 1, or collect evidence.

---

## Precondition Check

| # | Precondition | Result |
|---|---|---|
| 1 | Branch `feat/ec-002-visibility-baseline`; local and remote HEAD `dae979843d144ba5dece7b761cec0bd35dd66b2c` | **PASS** |
| 2 | Working tree clean | **PASS** |
| 3 | Local and remote branches synchronized (0 ahead / 0 behind) | **PASS** |
| 4 | `current_stage: Organizational Design` | **PASS** (current.md:10) |
| 5 | DD-034 Gate Verdict remains PASSED WITH CONDITIONS | **PASS** (decisions/DD-034 Part 12, unmodified) |
| 6 | DD-034 Case-Owner Selection: Stage 1 IC-OD2-001 (No-Change / Measurement Continuation), Stage 2 IC-OD2-002 (Observability-Only Preparation, conditional on Stage 1 review) | **PASS** (decisions/DD-034 Case-Owner Selection section) |
| 7 | IC-OD2-001 status: Selected — Stage 1, Execution Not Authorized | **PASS** |
| 8 | IC-OD2-002 status: Selected Conditionally — Stage 2 Pending Stage 1 Review | **PASS** |
| 9 | IC-OD2-003/004/005 remain Retained — Unselected Alternative | **PASS** |
| 10 | All ten DD-034 Set A conditions remain binding | **PASS** — none edited |
| 11 | All twenty-two DD-034 Set B boundaries remain binding | **PASS** — none edited |
| 12 | OD-002 Design remains Established — Conditional | **PASS** (decisions/DD-032 Case-Owner Decision, unmodified) |
| 13 | OD-002 Design confidence remains Medium-Low | **PASS** |
| 14 | Historical CrUX evidence remains EV-017/O-012 | **PASS** (observations/O-012.md, unmodified) |
| 15 | Historical field-data boundary: origin-level, mobile, TTFB, rolling 28-day window, 24 Jun–21 Jul 2026, 26% poor, Core Web Vitals Passed | **PASS** — verified directly against observations/O-012.md and diagnosis/DQ-004-investigation.md Phase 1 (see Part 2 below) |
| 16 | 26% is historical baseline evidence, not current-state | **PASS** — consistently dated throughout every source reviewed |
| 17 | Stage 1 remains CS-4 — Insufficient Evidence | **PASS** (decisions/DD-028) |
| 18 | Host/Varnish remains Unconfirmed/Unconfirmed | **PASS** (decisions/DD-028) |
| 19 | Stage 2 Round 1 remains Evidence Insufficient | **PASS** (decisions/DD-031) |
| 20 | CE-DQ4-A remains unresolved | **PASS** |
| 21 | CE-DQ4-C/E/F/G remain uninvestigated | **PASS** |
| 22 | `od_002_stage_1_execution_authorized` remains `false` | **PASS** (current.md) |
| 23 | `od_002_stage_2_preparation_authorized` remains `false` | **PASS** |
| 24 | Feasibility execution remains unauthorized | **PASS** |
| 25 | Implementation remains unauthorized | **PASS** |
| 26 | `transformation_authorized` remains `false` | **PASS** |
| 27 | `external_changes_authorized` remains `false` | **PASS** |
| 28 | No IC-OD2-001 CrUX protocol or related gate already exists | **PASS** — no such file in `design/` or `decisions/` |
| 29 | OD-001 Candidate D remains separate and unexecuted | **PASS** — execution window 21 Sep–31 Dec 2026, not yet reached; `candidate_d_protocol_executed: false` |
| 30 | OD-003 remains outside scope | **PASS** (`od_003_design_authorized: false`) |

**All thirty preconditions passed. Proceeding.**

---

## Part 1 — Authority Chain

| Artifact | Authority | Contribution | Limitation |
|---|---|---|---|
| observations/O-012.md | Kelvin-supplied, captured 24 Jul 2026 | Sole source of EV-017 — the raw CrUX field-data report, including the 26%-poor-mobile-TTFB figure, Core Web Vitals Passed finding, and the collection-method log (two failed API attempts, one successful interactive-report fetch) | Report content only; does not itself diagnose a mechanism or authorize anything |
| EV-017 (within O-012.md) | Same | The specific dated evidence item cited throughout OD-002 and every downstream gate | Single dated snapshot; no re-measurement performed since 24 Jul 2026 |
| diagnosis/DQ-004-investigation.md | decisions/DD-016 Case-Owner Decision, 25 Jul 2026 | Re-verified the target condition directly against O-012/EV-017 (Phase 1); tested seven candidate mechanisms (Phase 3) | CE-DQ4-A/B entangled, not independently resolved; CE-DQ4-C/E/F/G left open |
| diagnosis/OD-002-absence-of-html-caching-layer.md | decisions/DD-018 Case-Owner Decision, 25 Jul 2026 | Established Organizational Diagnosis (Conditional) — sole authoritative sentence on caching-absence, narrowly scoped | Does not establish mechanism; confidence capped at Medium |
| decisions/DD-018 | Kelvin Wong, 25 Jul 2026 | Eleven binding conditions, including the narrowed authoritative formulation | Confidence Medium at most; scope limited to tested URLs/period |
| design/OD-002-design-workstream.md | decisions/DD-022/DD-025, 2–13 Aug 2026 | OD2-REQ-001–017 (incl. REQ-004 aggregation-boundary reuse, REQ-005 dated-observation discipline, REQ-008 field-measurement template); OD2-AS-008 (CrUX baseline aging, flagged as increasingly pressing) | OD2-CAND-1's own future-evaluation design is the direct methodological ancestor of IC-OD2-001, not yet executed |
| decisions/DD-032 | Kelvin Wong, 13 Aug 2026 | Established OD-002 Design (Conditional), Confidence Medium-Low; sole authoritative Design statement | Does not establish caching absence, Varnish activity, backend slowness, or TTFB cause |
| decisions/DD-033 | Kelvin Wong, 13 Aug 2026 | Authorized Level 1 candidate construction; Part 6's twenty mandatory candidate requirements (ICR-001–020's source) | Level 1 only — construction, not feasibility or execution |
| transformation/OD-002-implementation-candidate-construction-workstream.md | decisions/DD-033, 13 Aug 2026 | Constructed IC-OD2-001 in full (Fields 1–20), including its falsification criterion, measurement plan, and explicit "later-gate requirement" (Field 20: "Even the CrUX refresh step requires a separate future Independent Candidate Readiness Gate and explicit case-owner authorization") | Construction only — names the future CrUX pull as a Blocked dependency, does not perform it |
| decisions/DD-034 | Kelvin Wong, 14 Aug 2026 | Independently reviewed the candidate set (PASSED WITH CONDITIONS); recorded Kelvin's staged selection — IC-OD2-001 Selected — Stage 1, Execution Not Authorized | The ICR-013 rollback-specificity condition remains binding on IC-OD2-003/004/005, not IC-OD2-001 (which has no rollback obligation — nothing changes) |
| current.md / Traceability.md | Case ledger | Authoritative lifecycle-state snapshot, confirmed in Precondition Check above | Narrative/YAML ledger, not itself a gate |

**This gate's own authority to exist:** IC-OD2-001's own Field 20 and DD-034's next_action both explicitly call for exactly this task — "prepare an IC-OD2-001 Like-for-Like CrUX Remeasurement Protocol Readiness Gate." This is that gate's own authorization-readiness predecessor: it assesses whether *preparing* the protocol may be authorized, not whether the protocol itself (once prepared) may be executed.

---

## Part 2 — Baseline Reconstruction

Reconstructed directly from observations/O-012.md and diagnosis/DQ-004-investigation.md Phase 1 — no inference beyond what these two sources state.

| Field | Value | Basis |
|---|---|---|
| Origin/property | `https://konnichiwa.nl/` — origin-level, not a specific URL | O-012 ("Channel: konnichiwa.nl"); DQ-004 Phase 1 ("origin-level, not a specific URL") |
| Device class | Mobile and desktop reported separately; **TTFB and INP not available for desktop** | O-012 Desktop table; DQ-004 Phase 1 |
| Metric | Time to First Byte (TTFB), marked **experimental** by Google in the source report | O-012, DQ-004 Phase 1 |
| Historical field-data window | 28-day rolling CrUX window, **24 June–21 July 2026** | O-012, DQ-004 Phase 1 |
| Aggregation type | Origin-level (CrUX aggregates real visits across the whole site, not one page) | O-012, DQ-004 Phase 1 |
| Historical poor share | **26%** of mobile page loads | O-012, DQ-004 Phase 1 |
| TTFB reported value | 1.8 s, alongside the 26%-poor classification | O-012, DQ-004 Phase 1 |
| Core Web Vitals outcome | **Passed**, mobile and desktop | O-012, DQ-004 Phase 1 |
| Mobile/desktop separation | Confirmed — LCP/CLS reported for both; INP/TTFB mobile-only | O-012 |
| Lab/field separation | Lab (Lighthouse) data **not obtained** in either attempt; field data (CrUX) is the sole source used | O-012, DQ-004 Phase 1 |
| Report capture date | Report generated **24 July 2026, 06:19:15** | O-012, DQ-004 Phase 1 |
| Source/report type | Google PageSpeed Insights, **interactive web-tool report** (`pagespeed.web.dev/analysis/...`), not the API — two prior API v5 attempts returned HTTP 429 (no API key configured) before the interactive report was fetched | O-012 |
| Known limitations already attached | TTFB experimental status; no page-level isolation; two failed automated attempts preceded success (tooling failures, not evidence of poor performance) | O-012, DQ-004 Phase 1 |

### Unresolved-Method-Field Register

| Field | Status | Classification |
|---|---|---|
| TTFB percentile basis (whether "1.8 s" represents p75, per CrUX's general convention) | Not explicitly labeled "p75" anywhere in O-012 or DQ-004-investigation.md | **Condition to Resolve Before Protocol Approval** — the future protocol must state its percentile assumption explicitly and flag it as inherited convention, not case-confirmed fact |
| CrUX release/freshness cadence for this specific report | Not documented in-repo | **Non-Blocking Limitation** — Google's public documentation may inform this, but it is not case evidence; does not block protocol preparation |
| Timezone basis (window dates, 06:19:15 generation time) | Not stated | **Non-Blocking Limitation** — immaterial to a 28-day rolling comparison as long as the future protocol applies the same convention consistently |
| Whether origin- or URL-level data was displayed | **Confirmed origin-level** | **Confirmed** |
| Percentile/distribution-bucket interpretation ("poor/needs-improvement/good") | Strongly implied by the "% good" column pattern and standard CrUX convention, but not verbatim documented for TTFB specifically | **Non-Blocking Limitation** |
| PageSpeed interface/version used | Confirmed as the **interactive web tool**, not API v5 (API attempts failed); exact tool version/UI not pinned | **Condition to Resolve Before Execution** — the future protocol must record which interface is used at retrieval time, since O-012 already demonstrates the interactive tool and the API behave differently |
| Country or connection-type segmentation | Not used; the obtained report is not segmented this way | **Structurally Unavailable** — a differently-segmented future report would not be like-for-like with EV-017 |
| Whether the historical report (specific URL) remains reproducible/re-fetchable today | Untested — this gate performed no external access | **Condition to Resolve Before Execution** — must be confirmed at the time a future protocol is executed, not assumed now |

**No undocumented setting was inferred to fill a gap.** Every "Condition to Resolve" and "Non-Blocking Limitation" row above is carried forward as an open item for the future protocol, not silently resolved here.

---

## Part 3 — Like-for-Like Requirements

All twenty assessed; a future protocol must preserve each.

| # | Requirement | Readiness |
|---|---|---|
| 1 | Same origin (`konnichiwa.nl`) | **Ready** — directly reusable |
| 2 | Same field-data source class (CrUX via PageSpeed Insights) | **Ready**, contingent on the interface-pinning condition above |
| 3 | Same mobile device class | **Ready** |
| 4 | Same TTFB metric | **Ready** |
| 5 | Same rolling 28-day window length | **Ready** |
| 6 | Same distribution categories (poor/needs-improvement/good) | **Ready**, contingent on the percentile-basis condition above |
| 7 | Mobile and desktop reported separately | **Ready** — structurally enforced (desktop TTFB/INP already "not available" in the source itself) |
| 8 | Lab results excluded from field comparison | **Ready** |
| 9 | Public-request timing excluded from CrUX comparison | **Ready** |
| 10 | No local-pack, ranking, conversion, revenue, or reservation data | **Ready** |
| 11 | No cache/backend mechanism inference from a TTFB change alone | **Ready** — directly required by every carried-forward DD-032/033/034 condition |
| 12 | Historical and future capture dates recorded | **Ready** |
| 13 | Data availability and reporting lag explicitly recorded | **Ready With Conditions** — see Part 4's reporting-lag finding |
| 14 | Missing data not encoded as zero | **Ready** |
| 15 | "No measurable change" accepted as a valid result | **Ready** |
| 16 | No numerical improvement promise | **Ready** |
| 17 | Confounder register maintained | **Ready** — see Part 6 |
| 18 | Mechanism uncertainty preserved | **Ready** |
| 19 | No automatic Stage 2 escalation | **Ready** — reinforced by DD-034's own conditional framing of IC-OD2-002 |
| 20 | Separate case-owner review after classification | **Ready** |

---

## Part 4 — Window and Schedule Readiness

This gate does **not** select a final measurement window. It assesses only the rules a future protocol must follow.

| Rule | Assessment |
|---|---|
| Future window must be a complete rolling 28-day period | **Method-derived** — CrUX's own reporting convention |
| Comparison must minimize or explicitly disclose overlap with the historical 24 Jun–21 Jul 2026 window | **Method-derived** — required for genuine like-for-like comparison; a future protocol choosing an overlapping window must disclose it, not conceal it |
| Earliest safe retrieval must account for actual source-data availability | **Evidence-derived, single observation only** — EV-017's own record shows a ~3-day gap between its window-end (21 Jul 2026) and its report-generation date (24 Jul 2026). **This is one data point, not a documented CrUX publication SLA**, and must not be treated as a reliable general lag figure — flagged as a genuine risk (see Part 9, Attack 3) |
| Retrieval must not occur before a complete target window exists | **Method-derived** |
| A lapse date must prevent indefinite authorization drift | **Operational choice**, required of the future protocol but not fixed by this gate — directly analogous to decisions/DD-024's own treatment of OD-001 Candidate D's lapse date ("conservative operational choice, not evidence-derived, explicitly labeled as such") |
| Every schedule choice must be labelled evidence-derived / method-derived / operational choice | **Required** of the future protocol, as demonstrated in the column above |

**Fields that may be fixed during protocol preparation:** window length (28 days), aggregation level (origin), device class (mobile), metric (TTFB), overlap-disclosure rule, missing-data discipline, labelling discipline. **Fields requiring confirmation immediately before execution:** the actual future window's exact start/end dates, actual data availability at retrieval time (not assumed from the single 3-day observation), and which PageSpeed interface is used.

**No reporting lag was invented.** The single 3-day observation above is recorded as exactly that — one data point — not adopted as a rule.

---

## Part 5 — Outcome Pre-Registration Readiness

The seven listed outcome categories (poor-share materially lower / broadly stable / materially higher / distribution changed but interpretation limited / data unavailable / method not comparable / result unresolved) are all qualitative, non-numeric, and directly modeled on patterns this case has already validated repeatedly (decisions/DD-030's six pre-registered Stage 2 outcomes; decisions/DD-024's "Stable / No Measurable Change" descriptive-only classification). **Readiness: Ready.**

No numeric threshold is defined by this gate, consistent with the Review Boundary. Any future threshold must be:
- explicit and justified at the time it is proposed;
- approved by Kelvin before execution, not adopted silently;
- insensitive to rounding where possible;
- structurally unable to select Stage 2 automatically — Stage 2 (IC-OD2-002) remains conditional on a **separate** case-owner review, per decisions/DD-034's own framing, not on any single classification result triggering it.

**New requirement, this gate:** the "broadly stable" outcome category must be explicitly labeled a *measurement classification only* — it must not be read, cited, or presented as a claim that no user-experience or business impact exists. This closes a genuine gap (Part 9, Attack 9) rather than assuming the case's general Attribution Constraint (UR-003/OC-007) makes this self-evident within the protocol's own outcome table.

---

## Part 6 — Confounder Register Requirements

The future protocol must maintain a register covering, at minimum: CrUX origin-level page mix; mobile network/traffic mix; geographic mix; time/load variability; website deployments; hosting/configuration changes; caching changes; Google/CrUX methodology changes; baseline aging; seasonal traffic differences.

**Governing discipline:** absence of confounder evidence must be recorded as **Unknown**, never as "no change" or "ruled out." This mirrors the classification scale already used throughout transformation/OD-002-implementation-candidate-construction-workstream.md's Phase 6 (Established / Supported / Weakly Supported / Needs More Evidence / Unassessed / Unassessable / Contradicted) and must not be weakened for this protocol specifically.

**Readiness: Ready.**

---

## Part 7 — Privacy, Access and Execution Boundary

This gate itself performed **no external or authenticated access** — no CrUX, PageSpeed Insights, or Search Console request was made in the course of this review; every fact in Part 2 was reconstructed from already-committed repository files.

The future protocol must prohibit: credentials; authenticated agent access; customer or reservation data; raw IP addresses; server logs; phpMyAdmin/database access; SQL/PHP execution; profiling/debugging; plugin installation; configuration changes; cache purge; production mutation — this list is identical in substance to decisions/DD-029/DD-030's checklist, extended unchanged.

**Public read-only CrUX/PageSpeed retrieval, if later authorized, must remain a separate, later, explicit authorization** from protocol preparation and classification — preparing the protocol document does not authorize running it, and running it does not authorize classifying its result without the pre-registered rules from Part 5 already being in place.

**Readiness: Ready.**

---

## Part 8 — OD-001 Separation Review

| Dimension | OD-001 Candidate D | IC-OD2-001 |
|---|---|---|
| Metric | Search Console organic query position/clicks, four query themes | CrUX mobile TTFB field distribution |
| Source | Google Search Console | Google PageSpeed Insights / Chrome UX Report |
| Window | 61-day comparison window (22 Jun–21 Aug 2026), matching EV-014's baseline | 28-day rolling CrUX window |
| Historical baseline | EV-014 (Search Console export) | EV-017/O-012 (CrUX field data) |
| Governing decision | decisions/DD-023, DD-024 | decisions/DD-032, DD-033, DD-034 |
| Execution status | Approved With Conditions — Awaiting Execution Window (21 Sep–31 Dec 2026), unexecuted | Not yet authorized to prepare |

**Confirmed:** these are two entirely distinct measurement systems with different metrics, sources, windows, and governing decision chains. Neither protocol may substitute for the other. Their execution schedules may coexist (OD-001's window opens 21 Sep 2026; IC-OD2-001's is not yet scheduled) but must not be merged into a single artifact or a single case-owner authorization. No result from one may be cited to classify, corroborate, or contradict the other — this case has never conflated organic search-position data with page-performance field data, and this gate finds no basis to begin doing so now.

**Readiness: Ready.**

---

## Part 9 — Independent Challenge

| # | Attack | Verdict | Basis |
|---|---|---|---|
| 1 | Historical 26% treated as current | **Survives** | Part 2/Precondition 16 — labeled historical throughout |
| 2 | Rolling-window overlap concealed | **Survives** | Part 4 — explicit disclosure rule required |
| 3 | Reporting lag invented | **Survives with Narrowing** | Part 4 identifies the single 3-day observation and explicitly refuses to adopt it as a rule — narrowed by stating this is one data point, not an SLA, and requiring confirmation at execution time |
| 4 | PageSpeed lab data substituted for CrUX field data | **Survives** | Part 3 Req. 8 |
| 5 | Desktop mixed into mobile | **Survives** | Part 3 Req. 7; structurally enforced by the source data itself |
| 6 | Public HTTP timing mixed into CrUX | **Survives** | Part 3 Req. 9 |
| 7 | Origin-level data treated as page-specific | **Survives** | Part 2 confirms origin-level; Part 3 Req. 1 |
| 8 | Improved TTFB treated as cache/backend proof | **Survives** | Part 3 Req. 11; all carried-forward DD-032/033/034 boundaries |
| 9 | Stable TTFB treated as no problem | **Survives with Narrowing** | Part 5's new requirement explicitly labels "broadly stable" a measurement classification only, not a no-impact claim |
| 10 | Missing data treated as zero | **Survives** | Part 3 Req. 14 |
| 11 | Qualitative thresholds allow arbitrary classification | **Survives** | Part 5 requires explicit, justified, pre-approved thresholds |
| 12 | Numeric threshold introduced without approval | **Survives** | Part 5 — none defined here; future ones require explicit approval |
| 13 | Confounders asserted absent without evidence | **Survives** | Part 6 — absence must remain Unknown |
| 14 | Stage 2 starts automatically | **Survives** | Part 3 Req. 19; DD-034's own conditional framing of IC-OD2-002 |
| 15 | OD-001 and OD-002 protocols are merged | **Survives** | Part 8 |
| 16 | Ranking or commercial benefits are inferred | **Survives** | Part 3 Req. 10 |
| 17 | Protocol preparation becomes execution | **Survives** | This gate's own Review Boundary and recommendation are scoped to preparation only, never execution |
| 18 | Public retrieval becomes external-change authorization | **Survives** | Part 7 — retrieval remains its own separate, later authorization |
| 19 | Automation is created without authority | **Survives** | No automation proposed anywhere in this gate; explicit prohibition carried into the binding conditions |
| 20 | Lifecycle boundaries collapse | **Survives** | `current_stage` remains Organizational Design throughout; Part 1/Part 7 |

**Eighteen Survive outright; two Survive with Narrowing (3, 9), each resolved by an explicit requirement already built into Part 4/Part 5 above, not added as an afterthought.**

---

## Part 10 — Gate Criteria (G-01–G-20)

| Criterion | Verdict | Reasoning |
|---|---|---|
| G-01 Valid authority | **PASS** | Full chain verified (Part 1) |
| G-02 Valid selected candidate | **PASS** | IC-OD2-001 correctly Selected — Stage 1 (decisions/DD-034) |
| G-03 Baseline reconstructability | **CONDITIONAL PASS** | Core fields Confirmed; four genuine unresolved-method fields identified (Part 2), none blocking preparation, some blocking execution |
| G-04 Like-for-like comparability | **PASS** | All twenty requirements Ready or Ready With Conditions (Part 3) |
| G-05 Window readiness | **CONDITIONAL PASS** | Rules defined; final window correctly not selected; reporting-lag risk narrowed, not eliminated, since it depends on data not yet confirmed |
| G-06 Schedule integrity | **CONDITIONAL PASS** | Fixable-now vs. confirm-before-execution fields correctly separated (Part 4); lapse date required but appropriately deferred |
| G-07 Outcome pre-registration readiness | **PASS** | Qualitative categories directly modeled on validated case precedent (Part 5) |
| G-08 Threshold governance | **PASS** | No threshold approved here; future governance rules explicit |
| G-09 Confounder containment | **PASS** | Register requirement and Unknown-not-absent discipline defined (Part 6) |
| G-10 Field/lab separation | **PASS** | Part 3 Req. 8 |
| G-11 Mobile/desktop separation | **PASS** | Structurally enforced by the source data (Part 2, Part 3 Req. 7) |
| G-12 Origin/page boundary | **PASS** | Part 2, Part 3 Req. 1 |
| G-13 Privacy and access safety | **PASS** | No access performed by this gate; future prohibitions carried forward unchanged (Part 7) |
| G-14 OD-001 separation | **PASS** | Part 8 |
| G-15 Non-causal interpretation | **PASS** | Part 3 Req. 11; DD-032/033/034 boundaries all carried forward |
| G-16 No-change legitimacy | **PASS** | "No measurable change"/broadly stable explicitly valid, with the new non-claim narrowing (Part 5) |
| G-17 Stage 2 containment | **PASS** | Explicit no-automatic-escalation (Part 3 Req. 19) |
| G-18 Lifecycle separation | **PASS** | `current_stage` unchanged; Part 7 |
| G-19 Operational usability | **PASS** | Concrete, actionable next steps named |
| G-20 Falsifiability | **PASS** | IC-OD2-001's own falsification criterion (workstream Field 7 — material divergence in a refreshed reading) remains valid and directly reusable |

**No FAIL. Seventeen PASS, three CONDITIONAL PASS (G-03, G-05, G-06), all tied to the same underlying finding: genuine, disclosed data gaps that block execution-time confirmation, not protocol preparation itself.**

---

## Part 11 — Gate Verdict

**Gate Verdict: PASSED WITH CONDITIONS.**

**Recommendation: RECOMMEND AUTHORIZED WITH CONDITIONS TO PREPARE CRUX REMEASUREMENT PROTOCOL.**

This recommendation is **not** authorization. Kelvin's explicit response is requested below.

### Binding Conditions (if authorized)

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

```yaml
current_stage: Organizational Design
od_002_stage_1_protocol_authorization_gate: DD-035 — Passed With Conditions
od_002_stage_1_protocol_preparation_recommendation: Recommend Authorized With Conditions To Prepare CrUX Remeasurement Protocol
od_002_stage_1_protocol_preparation_decision: Pending
od_002_stage_1_protocol_created: false
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

This gate recommends; it does not authorize. No response is inferred from general permission to "continue," from approval of any prior message, or from anything not naming this response explicitly.

```
AUTHORIZED TO PREPARE IC-OD2-001 CRUX REMEASUREMENT PROTOCOL

AUTHORIZED WITH CONDITIONS TO PREPARE IC-OD2-001 CRUX REMEASUREMENT PROTOCOL

NOT AUTHORIZED TO PREPARE PROTOCOL
```

No response above may be read as authorizing execution, CrUX/PageSpeed retrieval, Stage 2 preparation, feasibility execution, implementation, or any external/production change — each remains a separate, later, distinct gate.

---

## Final Intended Change Scope

| File | Change | Reason |
|---|---|---|
| `decisions/DD-035-ic-od2-001-crux-protocol-authorization-gate.md` | Created (this file) | The authorization/readiness gate itself |
| `current.md` | Updated | Records this gate's existence, verdict, and pending case-owner decision |
| `Traceability.md` | Updated | Same convention, following the DD-034 section-naming pattern |

**Not modified:** decisions/DD-018 through DD-034; transformation/OD-002-implementation-candidate-construction-workstream.md; design/OD-002-design-workstream.md; observations/O-012.md; diagnosis/DQ-004-investigation.md; diagnosis/OD-002-absence-of-html-caching-layer.md. **Not created:** any protocol document, any new evidence file, any Round or intake record. No CrUX, PageSpeed Insights, or Search Console request was made. No credential, password, API key, token, cookie, or FTP/SSH access was requested or accessed. No commit was created. Nothing was pushed.

---

## Case-Owner Decision (recorded 14 August 2026)

**This section records Kelvin Wong's explicit response to the recommendation above. It does not replace, edit, or overwrite the Precondition Check, Part 1 (Authority Chain), Part 2 (Baseline Reconstruction), the Unresolved-Method-Field Register, Part 3 (Like-for-Like Requirements), Part 4 (Window and Schedule Readiness), Part 5 (Outcome Pre-Registration Readiness), Part 6 (Confounder Register Requirements), Part 7 (Privacy, Access and Execution Boundary), Part 8 (OD-001 Separation Review), Part 9 (Independent Challenge), Part 10 (Gate Criteria G-01–G-20), Part 11's Gate Verdict (PASSED WITH CONDITIONS) and Recommendation (RECOMMEND AUTHORIZED WITH CONDITIONS TO PREPARE CRUX REMEASUREMENT PROTOCOL), the fifteen original binding conditions, the Requested Case-Owner Response, or the Final Intended Change Scope's historical "Pending" decision state that preceded this decision — all remain intact above, unmodified, as the historical record of this independent gate review.**

```yaml
decision: AUTHORIZED WITH CONDITIONS TO PREPARE IC-OD2-001 CRUX REMEASUREMENT PROTOCOL
authorized_by: Kelvin Wong
authorization_date: 2026-08-14
gate_reference: DD-035
```

Kelvin Wong, as case owner of EC-002 — Konnichiwa Organic Visibility Growth, issues:

> AUTHORIZED WITH CONDITIONS TO PREPARE IC-OD2-001 CRUX REMEASUREMENT PROTOCOL

### Authorized Scope

Authorization is limited to repository-only preparation of a like-for-like CrUX mobile TTFB remeasurement protocol for IC-OD2-001.

**This decision does not authorize:**

- PageSpeed or CrUX access;
- data retrieval;
- protocol execution;
- evidence creation;
- automated monitoring;
- Stage 2 preparation;
- feasibility execution;
- implementation;
- Transformation execution;
- external changes.

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

### Binding Conditions — Set B: Case-Owner Protocol-Preparation Boundaries (new to this Case-Owner Decision)

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

Both condition sets — Set A (fifteen, Part 11's own numbering) and Set B (thirty-two, new to this Case-Owner Decision) — are kept **separately titled with their own provenance**; neither is merged, renumbered, paraphrased, or deduplicated into the other, consistent with this case's established discipline (decisions/DD-032/DD-033/DD-034).

### Effect on Lifecycle State

```yaml
current_stage: Organizational Design
od_002_stage_1_protocol_authorization_gate: DD-035 — Passed With Conditions
od_002_stage_1_protocol_preparation_recommendation: Recommend Authorized With Conditions To Prepare CrUX Remeasurement Protocol
od_002_stage_1_protocol_preparation_decision: Authorized With Conditions — Protocol Preparation Only
od_002_stage_1_protocol_preparation_authorized: true
od_002_stage_1_protocol_created: false
od_002_stage_1_execution_authorized: false
od_002_stage_1_execution_started: false
od_002_stage_2_preparation_authorized: false
od_002_feasibility_execution_authorized: false
od_002_implementation_authorized: false
transformation_authorized: false
external_changes_authorized: false
```

`od_002_stage_1_protocol_preparation_authorized` moves from unset to `true` — **repository-only preparation of the protocol document is now authorized, strictly within the scope and conditions above.** `od_002_stage_1_protocol_created` remains `false` — this decision does not itself create the protocol. `od_002_stage_1_execution_authorized`, `od_002_stage_1_execution_started`, `od_002_stage_2_preparation_authorized`, `od_002_feasibility_execution_authorized`, `od_002_implementation_authorized`, `transformation_authorized`, and `external_changes_authorized` all remain `false`, unconditionally.

### Next Action

Prepare the IC-OD2-001 Like-for-Like CrUX Remeasurement Protocol in a separate task; **do not create or execute it while recording this decision.**

### Final Confirmations (post-decision)

| Confirmation | Status |
|---|---|
| Decision recorded: AUTHORIZED WITH CONDITIONS TO PREPARE IC-OD2-001 CRUX REMEASUREMENT PROTOCOL | **Confirmed** |
| Authorization limited to repository-only protocol preparation | **Confirmed** |
| Prior Precondition Check, Parts 1–11, Gate Verdict, and Recommendation preserved unmodified above | **Confirmed** |
| All fifteen Set A (DD-035 gate) conditions recorded verbatim | **Confirmed** |
| All thirty-two Set B (protocol-preparation) boundaries recorded, separately provenanced | **Confirmed** |
| No protocol created | **Confirmed** |
| No future measurement window selected | **Confirmed** |
| No numerical threshold approved | **Confirmed** |
| No reporting lag invented or adopted | **Confirmed** |
| No CrUX or PageSpeed data accessed | **Confirmed** |
| No evidence collected | **Confirmed** |
| No external or authenticated system accessed | **Confirmed** |
| Stage 1 execution remains unauthorized and unstarted | **Confirmed** |
| Stage 2 preparation remains unauthorized | **Confirmed** |
| OD-001 Candidate D remains separate and unexecuted | **Confirmed** |
| Stage 1 CS-4, Varnish Unconfirmed/Unconfirmed, Stage 2 Evidence Insufficient unchanged | **Confirmed** |
| CE-DQ4-C/E/F/G remain uninvestigated | **Confirmed** |
| Implementation, `transformation_authorized`, `external_changes_authorized` all remain `false` | **Confirmed** |
| Nothing committed or pushed | **Confirmed** — no `git add`, `git commit`, or `git push` was run in the course of this task |
