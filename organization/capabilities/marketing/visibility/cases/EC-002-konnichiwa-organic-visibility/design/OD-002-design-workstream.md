# OD-002 Design Workstream — Measurement-First Response-Time Design

---

Date: 2 August 2026. Author: Claude, acting as an **independent HELIX Design Constructor** for EC-002, scoped exclusively to OD-002 under decisions/DD-022's Case-Owner Decision (Kelvin Wong, 26 July 2026, AUTHORIZED WITH CONDITIONS FOR OD-002) and decisions/DD-018's Case-Owner Decision (Kelvin Wong, 25 July 2026, ESTABLISHED WITH CONDITIONS for OD-002). This is a Design artifact: it derives requirements, registers assumptions, specifies a measurement/observability framework, and constructs and compares candidate future organizational states. **It does not implement, publish, deploy, or authorize any change, does not access any restricted system, and does not select a preferred candidate.** OD-001 remains untouched by this document — its artifacts (design/OD-001-design-workstream.md, design/OD-001-candidate-d-measurement-protocol.md) were consulted only as a structural precedent for how this case writes a Design workstream, never as a content basis for OD-002. OD-003 remains **not authorized** for Design and is not addressed anywhere below. Transformation and all external/production changes remain unauthorized regardless of anything in this document.

---

## Status — Case-Owner Staged Selection

*Status-only addendum, recorded 2 August 2026. It does not alter any requirement, candidate formulation, attack, comparison, or future-evaluation-design content in Phases 1 through 8 below — all remain exactly as originally constructed. Authority: decisions/DD-025, Case-Owner Selection section, Kelvin Wong, 2 August 2026.*

| Field | Value |
|---|---|
| Authority | decisions/DD-025 — Case-Owner Selection |
| Selection | `SELECT: OD2-CAND-3 + OD2-CAND-2` |
| OD2-CAND-3 — Cache-State Verification-First | **Selected — Stage 1** |
| OD2-CAND-2 — Origin/Backend-Processing Observability | **Selected Conditionally — Stage 2 Pending Stage 1 Review** |
| OD2-CAND-1 — No-Change/Measurement-Continuation | Retained — Unselected Alternative |
| OD2-CAND-4 — Expanded Multi-Mechanism Measurement Program | Retained — Unselected Alternative |
| Stage 1 specification | design/OD2-CAND-3-cache-state-evidence-specification.md — **Prepared, 3 August 2026, not executed** |
| Stage 1 specification readiness gate | decisions/DD-026 — **Passed With Conditions, 3 August 2026**, corrected twice (Bounded Correction 1: two-dimensional Configured/Delivered-State model, CSE-5A/5B split; Bounded Correction 2: narrow same-layer/scope/time contradiction definition, layer-first aggregation) — 8 conditions total folded directly into the specification |
| Stage 1 evidence-collection decision | decisions/DD-026, Case-Owner Decision — **APPROVED WITH CONDITIONS FOR BOUNDED EVIDENCE COLLECTION**, 3 August 2026, 27 binding conditions — collection not yet started |

```yaml
od_002_design_established: false
od_002_stage_2_authorized: false
od_002_cand3_specification_status: Prepared — Evidence Collection Approved With Conditions
od_002_cand3_specification_readiness_gate: Passed With Conditions (decisions/DD-026, 3 August 2026)
od_002_cand3_evidence_collection_approved: true
od_002_cand3_evidence_collection_decision: Approved With Conditions (decisions/DD-026, Case-Owner Decision, 3 August 2026)
od_002_cand3_collection_mode: Owner-Supplied Redacted Evidence Only
od_002_cand3_direct_authenticated_access_authorized: false
od_002_cand3_collection_started: false
```

The Stage 1 specification (design/OD2-CAND-3-cache-state-evidence-specification.md) has been prepared, independently gate-reviewed (decisions/DD-026, Passed With Conditions, corrected twice), and **APPROVED WITH CONDITIONS FOR BOUNDED EVIDENCE COLLECTION** (decisions/DD-026, Case-Owner Decision, Kelvin Wong, 3 August 2026) — subject to twenty-seven binding conditions. This approval does not itself constitute evidence collection: no CSE item has been collected, no account or system has been accessed, and `od_002_cand3_collection_started` remains `false`. Collection begins only when Kelvin personally accesses the applicable accounts and supplies evidence — Claude is not authorized for direct authenticated access (`od_002_cand3_direct_authenticated_access_authorized: false`). Stage 2 has not started and requires its own new, separate case-owner authorization regardless of Stage 1's eventual outcome (CS-1, CS-3, "Configured Cache Confirmed — Delivered Miss Observed for Bounded Request(s)," "Configured Cache Confirmed — Delivery Unconfirmed," CS-2, or CS-4). Transformation and external changes remain unauthorized. All DD-018, DD-022, DD-025, and DD-026 conditions remain binding. See decisions/DD-025's Case-Owner Selection section and decisions/DD-026's Gate Verdict and Case-Owner Decision for the complete decision record.

### Status Update — Stage 1 Closed, Stage 2 Specification Prepared (13 August 2026)

*Second status-only addendum. It does not alter any requirement, candidate formulation, attack, comparison, or future-evaluation-design content in Phases 1 through 8 above — all remain exactly as originally constructed.*

Stage 1 (OD2-CAND-3) closed **Completed — Evidence Insufficient / Approved Evidence Exhausted** across three evidence-intake rounds (design/EC-002-OD2-CAND-3-Evidence-Intake.md; decisions/DD-027, DD-028) — bounded overall outcome **CS-4 — Insufficient Evidence**, `Accepted With Conditions` (decisions/DD-028). The authoritative layer matrix: WordPress = Not Present Within Inspected Plugin List / Unconfirmed; host/reverse-proxy (Varnish, konnichiwa.nl) = Unconfirmed / Unconfirmed; CDN/edge = Confirmed Disabled within the inspected DirectAdmin account scope / Unconfirmed. The domain-specific Varnish state remains the case's primary open unknown.

decisions/DD-029 (OD2-CAND-2 Stage 2 Authorization Gate) independently assessed readiness to begin Stage 2 — twelve-item G-01–G-12 matrix, no failures; eight candidate backend/origin evidence classes (BE-01–BE-08) assessed, none Essential; ten-item independent challenge, seven Survive, three Survive with Narrowing. **Recommendation: RECOMMEND AUTHORIZED WITH CONDITIONS, specification preparation only.** Kelvin Wong then issued **AUTHORIZED WITH CONDITIONS TO PREPARE STAGE 2 SPECIFICATION** (decisions/DD-029, Case-Owner Decision, 13 August 2026), nine binding conditions.

**design/OD2-CAND-2-origin-backend-evidence-observability-specification.md has now been prepared** (13 August 2026) under that authorization — a specification only, carrying forward all nine decisions/DD-029 conditions and all BE-01–BE-08 classifications unmodified. It does not authorize evidence collection, authenticated access, Diagnosis reopening, implementation, Transformation, or external changes.

```yaml
od_002_cand3_stage_1_status: Completed — Evidence Insufficient / Approved Evidence Exhausted
od_002_stage_2_authorization_gate: Authorized With Conditions — Specification Preparation Only (decisions/DD-029)
od_002_stage_2_specification_created: true
od_002_stage_2_specification_status: Prepared — Evidence Collection Not Authorized
od_002_stage_2_evidence_collection_authorized: false
od_002_stage_2_authorized: false
od_002_design_established: false
transformation_authorized: false
external_changes_authorized: false
```

Next action: an independent readiness review of the Stage 2 specification — not created by this task.

### Status Update — Stage 2 Specification Independently Reviewed (13 August 2026)

*Third status-only addendum. It does not alter any requirement, candidate formulation, attack, comparison, or future-evaluation-design content in Phases 1 through 8 above.*

decisions/DD-030 (OD2-CAND-2 Specification Readiness Gate) independently reviewed design/OD2-CAND-2-origin-backend-evidence-observability-specification.md across authority/scope, the BE-01–BE-08 manifest, evidence-class separation, privacy/security, outcome routing, mechanism-discrimination usefulness, a fifteen-attack independent challenge, and a twelve-item G-01–G-12 matrix. **Three genuine, bounded defects were found and corrected directly in the specification**, each preserved inline with dated attribution: a BE-07 Class 4/Class 6 cross-reference contradiction; a scope-precision gap where Phase 2's question named six mechanisms but the BE manifest addresses only two (CE-DQ4-A/B), now explicitly disclaimed for CE-DQ4-C/E/F/G; and a missing server-file-path redaction category (already named as a risk in decisions/DD-029's own G-08 table but absent from the specification's Phase 5 list). No BE item was found Essential — Evidence Insufficient remains a fully legitimate outcome. **Gate Verdict: PASSED WITH CONDITIONS.**

```yaml
od_002_stage_2_specification_status: Prepared — Readiness Reviewed, Decision Pending
od_002_stage_2_specification_readiness_gate: DD-030 — Passed With Conditions
od_002_stage_2_evidence_collection_authorized: false
od_002_stage_2_authorized: false
od_002_design_established: false
transformation_authorized: false
external_changes_authorized: false
```

Next action: Kelvin's explicit response to decisions/DD-030's requested case-owner response (APPROVED FOR BOUNDED STAGE 2 EVIDENCE COLLECTION / WITH CONDITIONS / NOT APPROVED) — not recorded by this task.

### Status Update — OD-002 Design Establishment Gate Reviewed (13 August 2026)

*Sixth status-only addendum. It does not alter any requirement, candidate formulation, attack, comparison, or future-evaluation-design content in Phases 1 through 8 above.*

decisions/DD-032 independently reviewed whether OD-002's Organizational Design may be established, given OD2-CAND-3 Stage 1 (complete, accepted CS-4) and OD2-CAND-2 Stage 2 Round 1 (complete, accepted Evidence Insufficient). All twenty preconditions passed. All seventeen OD2-REQ items and all nine OD2-AS items were independently reviewed — no requirement failed (five Conditional Pass, future-facing and untested rather than violated); no assumption was promoted from Needs More Evidence/Unassessed/Unassessable/Aging to fact. A twenty-item G-01–G-20 matrix found no failures (three Pass With Conditions: Stage 1/Stage 2 completion integrity, measurement/observability completeness). An eighteen-item independent challenge found **all eighteen Survive, none Rejected, none requiring narrowing**.

**Gate Verdict: PASSED WITH CONDITIONS. Recommendation: RECOMMEND ESTABLISHED WITH CONDITIONS**, with one sole authoritative Design statement (Confidence: Medium-Low) — a bounded measurement-and-observability Design that explicitly does not establish caching absence, Varnish activity, backend slowness, the TTFB tail's cause, any required intervention, or any ranking/conversion/revenue/reservation benefit. Ten binding conditions recorded if established. **This recommendation is not the case-owner decision.**

```yaml
od_002_design_establishment_gate: DD-032 — Passed With Conditions
od_002_design_establishment_recommendation: Recommend Established With Conditions
od_002_design_establishment_decision: Pending
od_002_design_established: false
transformation_authorized: false
external_changes_authorized: false
```

Next action: Kelvin's explicit response to decisions/DD-032 (ESTABLISHED / ESTABLISHED WITH CONDITIONS / NOT ESTABLISHED) — not recorded by this task.

### Status Update — OD-002 Design Established With Conditions (13 August 2026)

*Seventh and final status-only addendum for this milestone. It does not alter any requirement, candidate formulation, attack, comparison, or future-evaluation-design content in Phases 1 through 8 above.*

decisions/DD-032's Case-Owner Decision: Kelvin Wong issued **ESTABLISHED WITH CONDITIONS**. **OD-002 now has an Established Organizational Design (Conditional), Authority: decisions/DD-032 Case-Owner Decision, Confidence: Medium-Low** — the sole authoritative Design statement is decisions/DD-032's own (preserved verbatim there): a bounded measurement-and-observability Design targeting the 26% CrUX poor-mobile-TTFB share, which does not establish caching absence, Varnish activity, backend slowness, the TTFB tail's cause, any required intervention, or any ranking/conversion/revenue/reservation benefit. **CE-DQ4-C/E/F/G remain uninvestigated** (canonical phrasing, decisions/DD-032). Ten original plus sixteen additional binding conditions apply, verbatim, separately provenanced.

```yaml
od_002_design_establishment_decision: Established With Conditions
od_002_design_established: true
od_002_design_establishment: Conditional
od_002_design_authority: DD-032 Case-Owner Decision
od_002_design_confidence: Medium-Low
transformation_authorized: false
external_changes_authorized: false
```

**This establishment does not authorize Transformation, external changes, or any technical intervention.** Next action: prepare an independent Transformation Authorization Readiness Gate for the established OD-002 Design **only if explicitly instructed by the case owner** — not created by this task.

### Status Update — Bounded Stage 2 Evidence Collection Authorized (13 August 2026)

*Fourth status-only addendum. It does not alter any requirement, candidate formulation, attack, comparison, or future-evaluation-design content in Phases 1 through 8 above.*

decisions/DD-030's Case-Owner Decision: Kelvin Wong issued **APPROVED WITH CONDITIONS FOR BOUNDED STAGE 2 EVIDENCE COLLECTION** — BE-01–BE-08 only, Owner-Supplied Redacted Evidence Only, not unrestricted Stage 2 execution. Condition Set A (nine, decisions/DD-029) and Set B (seven, decisions/DD-030) recorded verbatim, separately provenanced, plus seventeen new additional binding conditions (collection scope, missing-evidence discipline, phpMyAdmin exclusion, access/mutation prohibitions, privacy exclusions, evidence-class separation, CE-DQ4-A/B-only scope, stop rules).

```yaml
od_002_stage_2_specification_status: Approved With Conditions — Bounded Evidence Collection Authorized
od_002_stage_2_evidence_collection_authorized: true
od_002_stage_2_evidence_collection_decision: Approved With Conditions
od_002_stage_2_collection_mode: Owner-Supplied Redacted Evidence Only
od_002_stage_2_collection_started: false
od_002_stage_2_authorized: false
od_002_design_established: false
transformation_authorized: false
external_changes_authorized: false
```

Next action: prepare a bounded BE-01–BE-08 Evidence Intake request/package under decisions/DD-030 — not created by this task; evidence collection does not begin until that intake task is separately started.

### Status Update — Evidence Intake Request Package Prepared (13 August 2026)

*Fifth status-only addendum. It does not alter any requirement, candidate formulation, attack, comparison, or future-evaluation-design content in Phases 1 through 8 above.*

design/OD2-CAND-2-stage-2-evidence-intake-request.md has been prepared under decisions/DD-030's Case-Owner Decision — a checklist/request package only, offering Kelvin a safe, concrete way to supply any already-available, redacted BE-01–BE-08 evidence, or record Not Available/Unknown/Declined for any item. No BE item is marked Essential. phpMyAdmin remains excluded, with no navigation instructions or SQL content anywhere in the package. No evidence has been collected, no evidence ID assigned, and no classification performed.

```yaml
od_002_stage_2_evidence_intake_package_created: true
od_002_stage_2_evidence_intake_package_status: Prepared — Awaiting Owner-Supplied Evidence
od_002_stage_2_collection_started: false
od_002_stage_2_evidence_received: false
od_002_stage_2_evidence_classified: false
od_002_stage_2_authorized: false
od_002_design_established: false
transformation_authorized: false
external_changes_authorized: false
```

Next action: Kelvin supplies any available, redacted BE-01–BE-08 evidence or records Not Available/Unknown; no direct agent access.

---

## Precondition Verdict

| # | Precondition | Result |
|---|---|---|
| 1 | Branch `feat/ec-002-visibility-baseline` | **PASS** |
| 2 | Working tree clean at start | **PASS** |
| 3 | Local HEAD = `405d06b7da48625613e3430166c9217d6ba61084` | **PASS** |
| 4 | `origin/feat/ec-002-visibility-baseline` = `405d06b7da48625613e3430166c9217d6ba61084` | **PASS** |
| 5 | Ahead/behind = 0/0 | **PASS** |
| 6 | `current_stage: Organizational Design` | **PASS** |
| 7 | `design_authorized: true`, scope OD-001, OD-002 | **PASS** |
| 8 | `od_002_design_authorized: true`, `od_002_design_started: false` | **PASS** |
| 9 | OD-001 Candidate D remains Selected for Further Design; protocol Approved With Conditions — Awaiting Execution Window; not executed | **PASS** |
| 10 | `od_003_design_authorized: false` | **PASS** |
| 11 | `transformation_authorized: false`, `external_changes_authorized: false` | **PASS** |
| 12 | No prior OD-002 Design workstream or candidate exists in the repository | **PASS** — confirmed by `git ls-tree` inspection of `design/`; only `OD-001-design-workstream.md` and `OD-001-candidate-d-measurement-protocol.md` existed prior to this task |

The local/remote checkpoint synchronized cleanly (0/0 ahead-behind against the specified commit); the "commit not yet pushed" stop condition does not apply. All twelve preconditions pass. Proceeding.

---

## Authority and Sources

- decisions/DD-018 — DQ-004 Diagnosis Establishment Gate, and its Case-Owner Decision (11 binding conditions on OD-002).
- decisions/DD-022 — Design Authorization Gate, and its Case-Owner Decision (10 Common Conditions, 10 Additional OD-002 Conditions).
- diagnosis/DQ-004-investigation.md — the CE-DQ4-A through G Candidate Mechanism Register and its falsification testing (Phase 3), and the public timing/header observations (Phase 2B) this workstream's measurement specification builds on.
- diagnosis/OD-002-absence-of-html-caching-layer.md — the Established Organizational Diagnosis (Conditional) this workstream is constrained by.
- observations/O-012.md and EV-017 — the Chrome UX Report field data underlying the 26%-poor mobile TTFB figure.
- claims/OC-006…md — "Passing Core Web Vitals With an Isolated Mobile Latency Exception," the Justified Organizational Claim the target condition is independently grounded in.
- understanding/UR-002-technical-foundation-duality.md and understanding/OU-004-technical-foundation.md — the Established Relationship and Established Organizational Understanding keeping performance and machine-legibility (OC-005) explicitly separate.
- current.md, Traceability.md — case lifecycle state and history.
- Explicit Boundaries.md — case-wide scope and the rule that "no intervention may be described as required until it is supported by a diagnosis."

design/OD-001-candidate-d-measurement-protocol.md and diagnosis/OD-001-flagship-format-competitive-breadth.md were read only in prior sessions to confirm their state (Selected for Further Design; Established, unmodified); neither is reused as content here.

---

## Binding Boundaries Carried Forward (verbatim, restated)

Every applicable condition from decisions/DD-018 and decisions/DD-022 is carried forward. At minimum, and without narrowing any of them:

1. No observable public evidence of HTML cache delivery is not proof that caching is absent (DD-018 Condition 3; DD-022 Additional OD-002 Condition 2).
2. Repeated request timing is not proof of cache misses — it is supporting context only (DD-018 Condition 4).
3. Backend processing and cache behaviour remain entangled (DD-018 Conditions 2/5; DD-022 Additional OD-002 Condition 3).
4. The mechanism behind the CrUX poor tail remains unresolved (DD-018 Condition 6; DD-022 Additional OD-002 Condition 4).
5. CrUX field data and lab data remain separate; a lab improvement may never substitute for a field improvement (DD-016 binding condition, inherited; DD-022 Additional OD-002 Condition 9).
6. The authorized target is the measured mobile TTFB condition — the 26% poor-field-data share — not a predetermined cache solution (DD-022 Additional OD-002 Condition 1).
7. The first Design work is limited to measurement, observability, mechanism-dependent constraints, alternative future-state models, falsification, and reversibility (DD-022 Additional OD-002 Condition 5).
8. No technical direction may be preferred until distinguished by evidence (DD-022 Additional OD-002 Condition 6).
9. No ranking, visibility, conversion, revenue, or reservation benefit may be inferred (DD-018 Condition 9; DD-022 Additional OD-002 Condition 10; UR-003/OC-007 Attribution Constraint, inherited via OU-004).
10. No production, hosting, cache, CDN, DNS, WordPress, PHP, database, or code change is authorized (DD-018 Condition 10; DD-022 Additional OD-002 Condition 6 and Common Condition 8).
11. OD-001 Candidate D remains untouched and unexecuted; OD-003 and Transformation remain unauthorized (case-wide state, current.md).
12. If mechanism discrimination requires a new Organizational Diagnosis "why" question rather than a Design-stage comparison of already-established alternatives, this workstream pauses and requests an explicit lifecycle decision rather than silently reopening Diagnosis (DD-022 Additional OD-002 Condition 7).

None of these is lifted, narrowed, or reinterpreted anywhere below.

---

## Phase 1 — Design Workstream Charter

| Field | Content |
|---|---|
| **Authority** | decisions/DD-018 (Established Organizational Diagnosis, Conditional), decisions/DD-022 (Design Authorization, AUTHORIZED WITH CONDITIONS FOR OD-002) |
| **Authoritative diagnosis** | "No observable public evidence of HTML cache delivery was found in the bounded measurements. This condition is associatively consistent with the elevated response-time baseline, but does not establish the mechanism behind the 26% poor mobile TTFB tail." (diagnosis/OD-002…md, authoritative formulation, DD-018 Condition 2) |
| **Problem boundary** | Konnichiwa's website (konnichiwa.nl), origin-level, mobile Time to First Byte, as measured by Chrome UX Report field data over a 28-day rolling window. Excludes desktop TTFB (not reported), all non-TTFB Core Web Vitals (already passing, OC-006), and any query/theme/local-pack dimension (governed by OD-001, out of scope here). |
| **Design question** | What future state of Konnichiwa's website response-time delivery, if any, is justified by the established condition — while first distinguishing the relevant mechanisms and without assuming that caching is absent? |
| **Target metric and evidence class** | Primary: CrUX field-data "poor" TTFB share, mobile, origin-level, 28-day rolling window (currently 26%, EV-017/O-012). Secondary, non-substitutable: read-only public timing/header observations of the kind performed in diagnosis/DQ-004-investigation.md Phase 2B. Tertiary, not yet obtained: Lighthouse lab scores. Restricted, not accessed: hosting/origin logs, cache hit/miss logs, PHP/DB query timing, CDN analytics, deployment/traffic history. |
| **Assumptions and unknowns** | See Phase 3 (Assumption and Uncertainty Register) below — nine registered, none treated as settled fact. |
| **Included systems** | konnichiwa.nl's publicly served HTML response path, to the extent observable via public, read-only HTTPS requests; Chrome UX Report / PageSpeed Insights field data already obtained by Kelvin. |
| **Excluded systems** | The reservation-handling backend governed by EC-001; GBP and local-pack systems (OC-003, separate context); any hosting-provider control panel, CDN dashboard, WordPress admin, database, or code repository for konnichiwa.nl itself — none of these is accessed by this workstream. |
| **Permitted artifact classes** | Requirements register; assumption/uncertainty register; measurement/observability specification (design only); candidate future-state designs (compared, not implemented); candidate attacks; comparative evaluation; future evaluation design; readiness-gate decision record. |
| **Prohibited artifact classes** | Any Transformation artifact; any implementation, publication, or deployment action; any cache, CDN, hosting, WordPress, PHP, database, or code change or specification thereof as an authorized action; any claimed ranking, visibility, conversion, revenue, or reservation benefit; any OD-001- or OD-003-derived content. |
| **Stop conditions** | (a) If distinguishing CE-DQ4-A from CE-DQ4-B is found to require a new Organizational Diagnosis question rather than Design-stage comparison — pause, request lifecycle decision (Binding Boundary 12). (b) If any candidate cannot be constructed without presupposing caching absence or presence as settled fact — that candidate is rejected at construction, not carried into comparison. (c) If evidence review reveals the 26% baseline itself requires correction — pause and report, do not silently adjust downstream artifacts. |
| **Decision authority** | Kelvin Wong, case owner. This workstream recommends; it does not select. |

```yaml
od_002_design_started: true
od_001_design_started: true   # unchanged
od_002_design_established: false
```

---

## Phase 2 — Requirements (Derived Before Candidates)

Derived directly from the Binding Boundaries above and from the task's own mandatory-requirements list, before any candidate below was drafted. No requirement was added or adjusted after Phase 5 candidate construction began.

| ID | Class | Statement | Rationale | Verification Method | Confidence | Status |
|---|---|---|---|---|---|---|
| OD2-REQ-001 | Outcome | The authorized target condition is the measured mobile TTFB outcome — the CrUX-reported 26% poor-share (EV-017/O-012, 24 Jun–21 Jul 2026 window) — not "absence of caching" or any other presumed mechanism. | DD-022 Additional OD-002 Condition 1; prevents silent substitution of a mechanism-shaped goal for the diagnosis-grounded outcome. | Manual review: every candidate's stated target references the CrUX poor-TTFB share, not a technology. | High | Active |
| OD2-REQ-002 | Outcome | No candidate may promise, target, or imply a specific numeric TTFB value, percentile, or "good"-rate as a committed deliverable; any future numeric target is provisional and requires later case-owner approval. | Avoids false numeric precision ahead of mechanism discrimination (task §12). | Manual review of candidate and evaluation-design language. | High | Active |
| OD2-REQ-003 | Outcome / Boundary | "No measurable improvement" is a legitimate, non-failure outcome of any future evaluation. | Preserves genuine falsifiability; case precedent (DD-016, DD-019, DD-020 treat Evidence Insufficient as legitimate). | Explicit statement present in Phase 8 (Future Evaluation Design). | High | Active |
| OD2-REQ-004 | Field-Measurement | Any future evaluation must reuse the existing CrUX aggregation boundary — origin-level, mobile, TTFB, 28-day rolling window — as the primary comparison unit; a different aggregation level may not be substituted without explicitly flagging the boundary change. | Preserves comparability with the 26% baseline (DD-018 Condition 8; task §11 like-for-like requirement). | Comparison design cites origin-level/mobile/TTFB/28-day window explicitly. | High | Active |
| OD2-REQ-005 | Field-Measurement | The 26%-poor-share figure is recorded as a single dated observation (24 Jun–21 Jul 2026), not a stable universal rate. | Task §6 mandatory requirement; CrUX field data drifts window-to-window. | Any citation of "26%" is accompanied by its window and date. | High | Active |
| OD2-REQ-006 | Lab-Measurement | Any lab-derived measurement obtained under this workstream is recorded and reported separately from field data and may never be substituted for, averaged with, or presented as equivalent to a CrUX field-data result. | Task §6; DD-016/DD-018 field/lab separation condition; lab tests use synthetic, fixed conditions that can diverge from real-user experience. | Structural separation (distinct section/table) in any measurement artifact. | High | Active |
| OD2-REQ-007 | Lab-Measurement | Where lab measurement is used, it records test location/device/network profile, run count, and run-to-run variability; a single lab run is not sufficient evidence. | Task §8 Lab layer specification. | Lab-layer template includes these fields as mandatory. | High | Active |
| OD2-REQ-008 | Observability | Any future public read-only measurement records, at minimum: DNS/connect/TLS/time-to-first-byte/total-time breakdown, redirect chain, protocol, and full response headers per tested request. | Matches diagnosis/DQ-004-investigation.md Phase 2B's method so future measurements are directly comparable to the existing baseline. | Template match against DQ-004-investigation.md Phase 2B's table structure. | High | Active |
| OD2-REQ-009 | Observability | Recording a response header (or its absence) is an observation of what is publicly exposed, not proof of underlying server/cache/backend configuration; this distinction is restated adjacent to any header-based observation. | The case's single most heavily emphasized constraint (DD-018 Condition 3); restating it structurally reduces drift in later, less-careful writing. | Presence of the disclaimer sentence adjacent to any header table. | High | Active |
| OD2-REQ-010 | Mechanism-Discrimination | Any future technical measurement plan is designed so its results could, in principle, discriminate between at least: backend/application processing, HTML cache absence/presence, geographic/network distance, CrUX aggregation/page-mix effect, mobile network/radio mix, and load/time-of-day variability. | CE-DQ4-A through G register (DQ-004-investigation.md Phase 3); a plan only one candidate mechanism could pass is not discriminating. | Measurement/observability specification (Phase 4) is checked against all six candidate mechanisms. | High | Active |
| OD2-REQ-011 | Mechanism-Discrimination | No requirement or candidate presupposes which of CE-DQ4-A (backend) or CE-DQ4-B (caching absence) is dominant; both remain live and entangled until restricted evidence resolves them. | DD-018 Conditions 2/5; DD-022 Additional OD-002 Conditions 2–4. | Manual review: no candidate's Intended Future State assumes one over the other. | High | Active |
| OD2-REQ-012 | Reversibility | Any future technical change eligible only after Transformation authorization is describable, at Design time, in terms of what would need to be reverted and how, before it is eligible for selection. | Task §12; DD-022 Common Condition 8. | Each candidate's Reversibility field is non-empty and specific. | High | Active |
| OD2-REQ-013 | Governance | No candidate, requirement, or measurement design is executed, implemented, or accessed outside this workstream's read-only, non-configuration-changing boundary without a separate, later Transformation Authorization Gate or equivalent. | Task §1; DD-022 Common Conditions 5, 8, 9. | Every candidate's Dependencies/Risks fields name the required future authorization explicitly. | High | Active |
| OD2-REQ-014 | Governance | If discriminating candidate mechanisms requires a new Organizational Diagnosis question rather than a Design-stage comparison, this workstream pauses and requests an explicit lifecycle decision rather than silently reopening Diagnosis. | Task §4; DD-022 Additional OD-002 Condition 7. | Stop condition (Phase 1) and Phase 9 gate both test for this explicitly. | High | Active |
| OD2-REQ-015 | Falsification | Every candidate carries at least one falsification criterion — a checkable prediction distinguishable from the no-change/measurement-only candidate's own expected pattern. | Task §5; OD-001-design-workstream.md precedent (its R-8). | Each candidate's Falsification Criteria field is present and checkable. | High | Active |
| OD2-REQ-016 | Boundary | No requirement or candidate claims, or is evaluated against, any ranking, visibility, conversion, revenue, or reservation benefit. | DD-018 Condition 9; DD-022 Common Condition 7, Additional OD-002 Condition 10; UR-003/OC-007. | Manual review of all candidate and evaluation-design language. | High | Active |
| OD2-REQ-017 | Boundary | No requirement or candidate specifies, implies, or requires a cache, CDN, hosting, WordPress, PHP, database, or other production/code change; where a technology category must be named to describe an evidence-access requirement, it is named only as a category, never a selected vendor or product. | Task §1 explicit prohibition; DD-022 Additional OD-002 Condition 6. | Manual review; no vendor/product name appears anywhere in this document except as already-observed fact (e.g., "server: Apache" header, already recorded in DQ-004-investigation.md). | High | Active |

No requirement above encodes a cache, CDN, host, plugin, or code change as a requirement (task §6, final instruction). All seventeen requirements were fixed before Phase 5 and are not adjusted to fit any candidate.

---

## Phase 3 — Assumption and Uncertainty Register

Nine assumptions registered, at minimum, per the task's own list. Each carries evidence, counter-evidence, status, risk if false, a discriminating test, and whether that test belongs to this Design workstream (read-only, no new authorization needed), to a Restricted-evidence request (needs Kelvin to supply access), or to a new lifecycle decision (would reopen Diagnosis). None below is converted from "Unassessable" or "Needs More Evidence" into a stated fact.

| ID | Assumption | Evidence | Counter-Evidence | Status | Risk If False | Discriminating Test | Test Belongs To |
|---|---|---|---|---|---|---|---|
| OD2-AS-001 | Public HTTP response headers accurately and completely expose whether a cache/CDN layer is active. | No cache/CDN header found across 4 tested pages, consistent across repeats (DQ-004-investigation.md Phase 2B). | None in this case's own evidence; general engineering knowledge (not case evidence) that some caching layers do not always emit identifying headers — DD-018 Condition 3 itself already flags this as unresolved. | Needs More Evidence | A design response predicated on "no cache exists" would misfire if a header-suppressing cache is actually present. | Hosting-provider dashboard confirmation of active caching, if any. | Restricted-evidence access (Kelvin-supplied) |
| OD2-AS-002 | Repeated public requests from one test vantage represent ordinary mobile user experience. | None supports generalizing one vantage's timing to real mobile users; DQ-004-investigation.md states this as a limitation explicitly. | O-001's 94%-Netherlands aggregate geography is the only proxy; the test vantage's own network path relative to real visitors was never determined. | Unassessed | A future repeat-request test could be over-read as user-representative when it is not. | None available without a distributed real-user or multi-vantage synthetic setup. | Design (bounding how the test is described; not resolvable with certainty) |
| OD2-AS-003 | Origin/backend (PHP/application) processing contributes materially to the elevated response time. | CE-DQ4-A — consistently elevated ~0.72–1.07 s post-TLS wait across 4 pages and 2 User-Agent classes. | None directly contradicting; entanglement with CE-DQ4-B means the same pattern is equally consistent with "every request simply lacks a cache" without backend processing itself being unusually slow. | Survives with Narrowing (entangled, not independently resolved) | A design response targeting "speed up the backend" could misallocate effort if the real driver is cache absence alone. | PHP/application-level execution-time profiling. | Restricted-evidence access (Kelvin-supplied) |
| OD2-AS-004 | Mobile network/traffic mix (real carrier/radio conditions) explains part of the field-measured tail. | None — untestable via server-side signals; User-Agent comparison (CE-DQ4-F) found no material difference, a weak indirect proxy only. | None. | Unassessable | A design response ignoring network-mix entirely might over-attribute the tail to the website. | CrUX's own per-connection-type breakdown, if obtainable; otherwise not resolvable read-only. | Field-measurement evidence expansion (Design-authorized if obtainable read-only; otherwise open) |
| OD2-AS-005 | Origin-level CrUX data represents the tested pages (homepage + 3 comparison pages) sufficiently. | CE-DQ4-E — 4 tested pages show comparable timing to each other. | Only 4 of the site's many pages were tested; new omakase/teppanyaki pages and InDesign-hosted menu content untested. | Needs More Evidence (unchanged from OD-002 diagnosis) | A design response scoped only to the 4 tested pages could miss a page-mix driver in untested pages. | Expanded read-only timing tests across a larger, structured page sample. | Design (expanded measurement/observability specification, read-only) |
| OD2-AS-006 | Time-of-day or load-based variability is material to the observed tail. | None — all DQ-004 supplementary measurements were taken in a single ~10-minute window, one day. | None. | Unassessable (CE-DQ4-G, unchanged) | A design response based on a single-session snapshot could misjudge a time/load-dependent condition. | Repeated read-only measurement across multiple times of day and days of week. | Design (measurement/observability specification, read-only) |
| OD2-AS-007 | A future organizational-design state for response-time delivery can be meaningfully evaluated without server-side logs. | DQ-004-investigation.md's own method cleanly falsified CE-DQ4-D without server logs. | CE-DQ4-A/B's entanglement is explicitly not resolvable with read-only signals alone (DD-018 Conditions 2/5). | Partially confirmed / partially open | Over-relying on read-only methods alone could leave the central mechanism question permanently, silently unresolved. | Compare what read-only methods can vs. cannot resolve (already documented; the gap itself is the finding). | This workstream's own Phase 4 (scoping what read-only evidence can and cannot close) |
| OD2-AS-008 | The 24 June–21 July 2026 CrUX baseline remains representative of Konnichiwa's current mobile-visitor experience. | None newer than EV-017; no re-measurement has occurred. | CrUX is a rolling window that shifts over time (Google's own documented behavior, not case-specific evidence); approximately one week has elapsed since decisions/DD-018 established this diagnosis, and further site changes (e.g., newly-launched pages) may have occurred since. | Aging / Needs Refresh | A design or evaluation built on a stale baseline could compare against a condition that has already shifted for unrelated reasons. | Pull a fresh CrUX field-data report (public, read-only, no configuration access) before finalizing any future evaluation's baseline. | Design/Measurement specification (read-only; within this workstream's authority) |
| OD2-AS-009 | A no-change (or measurement-only) response is an organizationally acceptable outcome, not merely a procedural placeholder. | Case precedent — DD-016/DD-019/DD-020 treat Evidence Insufficient/no-finding as legitimate, closed outcomes; DD-022 Common Condition 3 requires a legitimate no-change alternative. | None — a governance stance, not an empirical claim; the case's own history directly supports it. | Confirmed by precedent | If the case owner in fact wants a technical fix regardless of evidence, treating no-change as legitimate could create friction — nothing in the record suggests this; flagged for completeness. | Not applicable (governance stance) — confirm directly with Kelvin if ever in doubt. | Governance / explicit in this charter |

---

## Phase 4 — Measurement and Observability Specification (Design Only — Not Executed)

This section specifies, but does **not** execute, a measurement framework. No field pull, public request, lab test, or restricted-evidence access is performed by this document.

### Field Layer

| Field | Specification |
|---|---|
| Source | Chrome UX Report (CrUX), via PageSpeed Insights, matching O-012/EV-017's method exactly |
| Scope | Mobile vs. desktop, reported separately (TTFB/INP not available for desktop in the existing report format) |
| Aggregation | Origin (`konnichiwa.nl`), not URL-specific — matches EV-017 |
| Observation window | 28-day rolling; each future pull's exact window dates recorded |
| Metrics recorded | TTFB distribution (poor/needs-improvement/good %), LCP, INP, CLS — all four recorded even though only TTFB is the target condition, so any future correlated shift in the other vitals is visible, not silently dropped |
| Limitation carried forward | TTFB is marked experimental by Google in the source report; this is recorded verbatim on every future field pull, not only the first |

### Public Request Layer

| Field | Specification |
|---|---|
| Method | Timestamped, read-only HTTPS requests (e.g., `curl`), matching diagnosis/DQ-004-investigation.md Phase 2B exactly, for comparability |
| Recorded per request | Timestamp, `time_namelookup`, `time_connect`, `time_appconnect` (TLS), `time_starttransfer`, `time_total`, protocol, redirect count |
| Page set | At minimum the four pages already tested (homepage, `/sushi-utrecht/`, `/about-us/`, `/nl/home-nederlands/`); OD2-AS-005 motivates expanding this set in any future execution, not narrowing it |
| User-Agent classes | At minimum mobile and desktop strings, matching the existing method |
| Repeat structure | At minimum 5 repeats per page/UA combination at one sitting (matching the existing homepage series), plus repeats spread across multiple times of day and multiple days, to address OD2-AS-006 (time/load variability) — a gap the existing single-session data cannot close |
| Headers recorded | Full response header set, with explicit note that header presence/absence is an observation of public exposure, not proof of underlying configuration (OD2-REQ-009) |
| Explicit limitation | Any future public-request data remains a single-vantage-point sample unless multiple, geographically distinct vantage points are used; single-vantage data is not a substitute for, or override of, CrUX field data (OD2-AS-002) |

### Lab Layer

| Field | Specification |
|---|---|
| Source | Lighthouse (via PageSpeed Insights), the same tool O-012 attempted and could not retrieve the lab-score portion of |
| Test location / device profile | Recorded explicitly for any future attempt (Google's lab tests run from a fixed, documented emulated profile — this must be recorded, not assumed) |
| Run count and variability | Minimum 3 runs per test target; run-to-run variance reported, not just a single score |
| Strict separation | Lab scores are reported in their own table, never merged into, averaged with, or cited as equivalent to the Field Layer's CrUX figures (OD2-REQ-006) |
| Status | Not yet obtained (O-012); obtaining it would be a legitimate, read-only Design-stage measurement action, not a restricted one |

### Restricted Layer (Identified, Not Accessed)

| Category | What it would resolve | Access status |
|---|---|---|
| Origin/hosting response-time logs | Would distinguish application-processing time from queueing/resource-contention time (bears on OD2-AS-003) | Not accessed; would require Kelvin's hosting-provider dashboard or log export |
| Cache hit/miss logs (server-side or CDN) | Would confirm or refute whether a non-header-exposing cache exists (bears on OD2-AS-001) | Not accessed |
| PHP/database query timing | Would distinguish backend-processing time from a hosting-tier resource limit | Not accessed |
| Deployment/configuration history | Would show whether a caching mechanism was ever installed, active, or recently disabled | Not accessed |
| Traffic and load history | Would test whether elevated TTFB correlates with traffic volume (bears on OD2-AS-006) | Not accessed |

Every row in this layer is a precise **access/evidence requirement**, not an assumed result (task §8, final instruction). No restricted evidence is accessed by this workstream; if Kelvin later supplies any of it, it feeds into a future measurement round under this same specification, not a silent revision of already-recorded conclusions.

---

## Phase 5 — Candidate Future-State Designs

Four materially distinct candidates, constructed without presupposing which (if any) is preferred, and without presupposing whether caching is present or absent. Candidate OD2-CAND-1 is the credible no-change/measurement-only baseline required by Binding Boundary and OD2-REQ-003. Candidate OD2-CAND-3 remains valid whether caching is already present (but not publicly observable) or genuinely absent. Candidate OD2-CAND-2 addresses backend/origin processing directly.

### OD2-CAND-1 — No-Change / Measurement-Continuation Baseline

| Field | Content |
|---|---|
| Intended future state | No technical or organizational change to konnichiwa.nl's response-time delivery. The only future action is a repeat, read-only measurement round (Phase 4's Field and Public Request layers) after a comparable future window, to test whether the 26%-poor tail is stable, worsening, or improving absent any intervention. |
| Mechanism assumption | None. This candidate makes no claim about which of CE-DQ4-A through G is responsible. |
| Evidence required before eligibility | None beyond what already exists (EV-017, DQ-004-investigation.md) — this candidate is eligible by default, as the comparison baseline every other candidate is measured against. |
| Measurement/observability model | Phase 4's Field Layer (fresh CrUX pull) and Public Request Layer (repeat of the existing method), performed after a comparable future window. |
| Dependencies | None beyond authorization to perform a read-only measurement round, which is already within this workstream's own authority. |
| Risks | The tail could worsen without any organizational response, since none is taken; this is stated explicitly as the accepted cost of measurement-first discipline, not concealed. |
| Reversibility | Fully reversible by construction — no change is made, so there is nothing to revert. |
| Expected field signature | If nothing about the site or its environment changes, the poor-TTFB share should remain statistically similar to 26% (OD2-REQ-005's dated-baseline framing applies: "similar" is evaluated against the same window length and metric, not assumed identical to the decimal). |
| Expected lab signature | Not applicable — no lab data currently exists to compare against; obtaining a first lab reading under this candidate would itself be new information, not a comparison. |
| Falsification criteria | If a repeat measurement shows the poor-TTFB share moving materially (in either direction) without any known site or hosting change having occurred, that is evidence the underlying condition is not stable on its own, which would argue against continuing indefinitely with no-change. |
| Stop conditions | If two consecutive comparable measurement rounds show a worsening trend, this candidate's own internal logic argues for revisiting the case owner's selection among the other candidates, not for silently continuing. |
| Explicitly excluded claims | Does not claim the current state is acceptable or unacceptable; does not claim caching is present or absent; does not claim any ranking, conversion, or reservation effect. |

### OD2-CAND-2 — Origin/Backend-Processing Observability (Mechanism-Focused, Backend Track)

| Field | Content |
|---|---|
| Intended future state | The organization obtains authorized, read-only, Kelvin-supplied insight into origin/backend (PHP/application) processing time — e.g., a hosting-provider performance/timing dashboard, or an application-level profiling report, if the hosting provider offers one — sufficient to determine whether backend processing time (CE-DQ4-A), independent of caching, is itself elevated. |
| Mechanism assumption | That backend/application processing time is a material, independently measurable contributor to the elevated response time, separable in principle from caching absence if the right evidence is obtained. |
| Evidence required before eligibility | Kelvin's willingness and ability to supply Restricted-layer evidence (origin/hosting response-time logs, or PHP/DB query timing) — this candidate is not eligible for any further step until at least one such source is confirmed obtainable. |
| Measurement/observability model | Phase 4's Restricted Layer, specifically the "Origin/hosting response-time logs" and "PHP/database query timing" rows; supplemented by the existing Public Request Layer data as corroborating (not substitute) context. |
| Dependencies | Requires Kelvin to access his own hosting-provider dashboard or equivalent and share read-only output; requires no code, configuration, or production change to obtain. |
| Risks | If backend timing data shows processing is in fact fast, this candidate would have spent evidence-gathering effort without resolving the tail — an acceptable, informative negative result, not a failure of the candidate's design. Risk of over-interpreting a single dashboard snapshot as representative (mirrors OD2-AS-006/AS-008's time-variability caution). |
| Reversibility | Fully reversible — obtaining and reviewing a read-only report changes nothing about the live site; no rollback is needed because no forward change occurs. |
| Expected field and lab signatures | If backend processing is confirmed slow and dominant, this candidate expects no independent field-signature of its own (it is an evidence-gathering step, not a technical change) — any future field improvement would depend on a later, separately authorized Transformation candidate, not on this candidate itself. |
| Falsification criteria | If the obtained backend-timing evidence shows processing time is fast and unremarkable, this specifically falsifies CE-DQ4-A as a material, independent contributor (leaving CE-DQ4-B, caching absence, as the more load-bearing remaining candidate mechanism). |
| Stop conditions | If Kelvin reports no such dashboard/log access exists or is obtainable from his hosting provider, this candidate is not viable and should be recorded as blocked, not silently abandoned. |
| Explicitly excluded claims | Does not claim or imply that any backend/application change should be made; does not claim caching is present or absent; obtaining evidence is not itself a remedy. |

### OD2-CAND-3 — Cache-State Verification-First (Valid Whether Caching Is Present or Absent)

| Field | Content |
|---|---|
| Intended future state | The organization first **verifies**, rather than assumes, konnichiwa.nl's actual caching configuration — via Kelvin's hosting-provider dashboard, control panel, or direct provider inquiry — before any caching-related structural response is even considered eligible. This candidate is explicitly constructed to remain valid under **either** verification outcome: if verification confirms no cache/page-cache layer exists, a caching-type response becomes eligible for a later, separately authorized Transformation round; if verification instead confirms a cache layer **is** active (e.g., one that does not emit standard headers, or is misconfigured/excluded for the tested pages), the design question shifts to why an existing cache is not producing an observable effect — a different, but equally legitimate, future-state question this candidate is built to surface either way. |
| Mechanism assumption | None fixed — this is precisely the candidate that treats CE-DQ4-B's status as unresolved and constructs a future state around resolving it, rather than around one presumed answer. |
| Evidence required before eligibility | Kelvin's access to, or inquiry with, the hosting provider regarding active caching configuration (Restricted Layer, "Cache hit/miss logs" row, or an equivalent direct provider statement). |
| Measurement/observability model | Phase 4's Restricted Layer ("Cache hit/miss logs" row); the existing Public Request Layer evidence (no cache/CDN header observed) is retained as the reason verification is needed, not as the answer itself. |
| Dependencies | Requires Kelvin's own hosting-provider access; requires no code, configuration, or production change to verify. |
| Risks | A provider's self-reported caching status could itself be imprecise or use non-standard terminology; this candidate's own output should be recorded as a dated statement with its source, not silently upgraded to certainty. |
| Reversibility | Fully reversible — verification is an inquiry, not a change. |
| Expected field and lab signatures | None directly from verification alone; verification's output determines which of two divergent future design paths (add a cache layer vs. investigate an underperforming existing one) would even become eligible for later Transformation-stage work — neither path is entered by this candidate itself. |
| Falsification criteria | If verification confirms an active, correctly-functioning cache layer, this directly falsifies CE-DQ4-B (caching absence) as the diagnosed structural condition's continuing description, and would require diagnosis/OD-002…md's own established formulation to be flagged for case-owner review, since new evidence would then materially bear on an Established Diagnosis (per Binding Boundary — this is treated as new evidence potentially contradicting the diagnosis, triggering DD-022 Common Condition 10's withdrawal-review path, not a silent update). |
| Stop conditions | If no hosting-provider verification is obtainable at all (e.g., Kelvin has no access or the provider will not confirm), this candidate remains open/blocked rather than defaulting to either assumption. |
| Explicitly excluded claims | Does not claim, before verification, that caching is absent or present; does not claim any ranking, conversion, or reservation effect; does not authorize adding, removing, or reconfiguring any cache. |

### OD2-CAND-4 — Expanded Multi-Mechanism Measurement Program (Field/Lab/Geographic Breadth)

| Field | Content |
|---|---|
| Intended future state | Before any structural response is considered, the organization closes the measurement gaps that currently leave CE-DQ4-C (geographic distance), CE-DQ4-E (page-mix), CE-DQ4-F (mobile network mix), and CE-DQ4-G (time/load variability) at "Needs More Evidence" or "Unassessable" — via an expanded, still read-only, program: a larger and more representative page sample; multi-vantage-point timing (if obtainable via legitimate, publicly available testing services rather than a named commercial vendor); repeated measurement across multiple times of day and days of week; and, separately, a first Lighthouse lab reading (Phase 4 Lab Layer). |
| Mechanism assumption | None — this candidate is explicitly about closing evidence gaps across the four currently-unresolved mechanisms simultaneously, not about confirming any one of them. |
| Evidence required before eligibility | None beyond this workstream's own read-only authority — every action in this candidate is publicly-accessible measurement, matching the method already used in DQ-004-investigation.md, extended in scope and repetition. |
| Measurement/observability model | Phase 4's Public Request Layer (expanded page set and repeat schedule) and Lab Layer (first Lighthouse attempt), in full. |
| Dependencies | None beyond time/effort to execute an expanded read-only measurement round; no Kelvin-supplied access is required, unlike OD2-CAND-2 and OD2-CAND-3. |
| Risks | A larger measurement program could still leave CE-DQ4-A/B's entanglement unresolved, since none of CE-DQ4-C/E/F/G bears directly on that specific pair — this candidate should not be mistaken for a substitute for OD2-CAND-2/OD2-CAND-3's restricted-evidence approach; it is complementary, not a replacement. |
| Reversibility | Fully reversible — read-only measurement changes nothing about the live site. |
| Expected field and lab signatures | Expanded public-request data may narrow (not eliminate) CE-DQ4-E, CE-DQ4-F, and CE-DQ4-G's "Needs More Evidence"/"Unassessable" status; a first Lighthouse reading would newly populate the Lab Layer, to be compared internally to itself over time, never substituted for the CrUX field figure (OD2-REQ-006). |
| Falsification criteria | If expanded page-sample timing shows one or more pages materially slower than the four already tested, this would positively support CE-DQ4-E (page-mix effect) as a material contributor, distinguishable from the current "comparable across 4 pages" finding. |
| Stop conditions | If expanded measurement produces no material new discrimination after a defined, bounded round (e.g., no new page-level outliers, no material day/time variation), this is recorded as a legitimate negative result, not repeated indefinitely without new justification. |
| Explicitly excluded claims | Does not claim, or require, that caching or backend processing is or is not responsible; does not claim any ranking, conversion, or reservation effect; a Lighthouse lab score improvement or decline is never cited as a field-data outcome. |

---

## Phase 6 — Candidate Attacks

Each candidate attacked independently against the twelve dimensions specified. Outcomes: Survives / Survives with Conditions / Requires Revision / Rejected.

### OD2-CAND-1 (No-Change / Measurement-Continuation)

| Dimension | Finding |
|---|---|
| Assumes caching absent | No — makes no caching claim at all |
| Confuses headers with infrastructure state | Not applicable — no header claim made |
| Backend/cache entanglement | Not applicable — no mechanism claim made |
| Explains the 26% tail | Does not attempt to; explicitly does not claim to |
| Lab/field substitution | Not applicable — no lab data used |
| Origin/URL aggregation mismatch | None — reuses existing origin-level boundary exactly |
| Mobile traffic-mix confounding | Not applicable |
| Lack of server-side observability | Not a defect here — this candidate does not seek server-side observability |
| Hidden production change | None — explicitly no change |
| Irreversibility | None — nothing is done |
| Business-outcome overreach | None found |
| Lifecycle leakage into Diagnosis/Transformation | None — stays within measurement |

**Outcome: Survives.** No conditions required beyond those already stated in Phase 5.

### OD2-CAND-2 (Origin/Backend-Processing Observability)

| Dimension | Finding |
|---|---|
| Assumes caching absent | No — explicitly silent on caching status |
| Confuses headers with infrastructure state | No — relies on Restricted-layer evidence, not headers |
| Backend/cache entanglement | **Risk identified:** if backend timing is found slow, there is a residual risk of over-crediting backend processing alone without re-checking whether caching absence is what exposes that processing in the first place | Contained by requiring the falsification criteria to be read alongside OD2-CAND-3's verification, not in isolation |
| Explains the 26% tail | Only partially, and only if evidence is obtained — this is stated explicitly in the candidate's own Risks field |
| Lab/field substitution | Not applicable — no lab data used |
| Origin/URL aggregation mismatch | None |
| Mobile traffic-mix confounding | Not directly addressed by this candidate; acknowledged, not claimed resolved |
| Lack of server-side observability | This candidate exists specifically to close this gap — not a defect |
| Hidden production change | None — read-only evidence gathering only |
| Irreversibility | None |
| Business-outcome overreach | None found |
| Lifecycle leakage into Diagnosis/Transformation | **Risk identified:** if the obtained evidence is dispositive enough to change the diagnosed mechanism materially, this could function as new Diagnosis-relevant evidence, not merely Design-stage comparison | Contained by Binding Boundary 12 / OD2-REQ-014's explicit stop-and-request-lifecycle-decision rule |

**Outcome: Survives with Conditions.** Conditions: (1) must be read jointly with OD2-CAND-3, not as an independent resolution of the CE-DQ4-A/B entanglement; (2) any dispositive finding triggers the lifecycle-decision stop condition rather than a silent diagnosis update.

### OD2-CAND-3 (Cache-State Verification-First)

| Dimension | Finding |
|---|---|
| Assumes caching absent | No — this is the candidate's defining feature; explicitly neutral pending verification |
| Confuses headers with infrastructure state | No — explicitly treats the existing header evidence as the *reason* verification is needed, not as the answer |
| Backend/cache entanglement | Acknowledged directly; verification output narrows but does not by itself fully resolve the entanglement with CE-DQ4-A |
| Explains the 26% tail | Only the caching half of the entanglement; does not address backend processing independently |
| Lab/field substitution | Not applicable |
| Origin/URL aggregation mismatch | None |
| Mobile traffic-mix confounding | Not addressed; acknowledged as out of this candidate's scope |
| Lack of server-side observability | This candidate exists specifically to close this gap for caching status — not a defect |
| Hidden production change | None — verification is an inquiry, not a change |
| Irreversibility | None |
| Business-outcome overreach | None found |
| Lifecycle leakage into Diagnosis/Transformation | **Risk identified and directly addressed** in the candidate's own Falsification Criteria field: a confirmed-active-cache finding is treated as new evidence potentially contradicting the Established Diagnosis, explicitly routed to case-owner review (DD-022 Common Condition 10), not silently absorbed |

**Outcome: Survives.** The candidate's own construction already contains the required containment for its one identified risk; no additional condition is needed beyond what Phase 5 already states.

### OD2-CAND-4 (Expanded Multi-Mechanism Measurement Program)

| Dimension | Finding |
|---|---|
| Assumes caching absent | No — makes no caching claim |
| Confuses headers with infrastructure state | No — does not rely on headers for its target mechanisms (CE-DQ4-C/E/F/G) |
| Backend/cache entanglement | **Risk identified:** could be mistaken for progress on the CE-DQ4-A/B question when it does not directly bear on it | Contained by the candidate's own Risks field, stated explicitly as complementary, not substitutive |
| Explains the 26% tail | Only partially — narrows four secondary mechanisms, does not address the primary entangled pair |
| Lab/field substitution | **Risk identified:** obtaining a first Lighthouse score creates exactly the temptation this case's own binding conditions warn against | Contained by OD2-REQ-006 (structural separation, explicit in the candidate's own Expected signatures field) |
| Origin/URL aggregation mismatch | None — expanded page sample stays at the same origin |
| Mobile traffic-mix confounding | Directly targeted (CE-DQ4-F); addressed, not confounded |
| Lack of server-side observability | Not resolved by this candidate — explicitly out of its scope (it is public-measurement only) |
| Hidden production change | None |
| Irreversibility | None |
| Business-outcome overreach | None found |
| Lifecycle leakage into Diagnosis/Transformation | None — stays within measurement/observability |

**Outcome: Survives with Conditions.** Conditions: (1) any Lighthouse lab result must be structurally separated per OD2-REQ-006, never merged with CrUX figures in any report; (2) this candidate's results must not be cited as resolving CE-DQ4-A/B, only the four secondary mechanisms it targets.

All four candidates survive attack; none is rejected. Two required explicit conditions (OD2-CAND-2, OD2-CAND-4); two required none beyond their own Phase 5 construction (OD2-CAND-1, OD2-CAND-3). Rejected material: none — no candidate was dropped at this stage, so there is nothing to preserve under a Rejected heading.

---

## Phase 7 — Comparative Evaluation (No Selection)

| Dimension | OD2-CAND-1 No-Change/Measurement-Continuation | OD2-CAND-2 Backend-Processing Observability | OD2-CAND-3 Cache-State Verification-First | OD2-CAND-4 Expanded Multi-Mechanism Program |
|---|---|---|---|---|
| Diagnosis fit | Direct — requires no mechanism claim | Direct — targets CE-DQ4-A specifically | Direct — targets CE-DQ4-B specifically | Indirect — targets CE-DQ4-C/E/F/G, not the primary entangled pair |
| Mechanism neutrality | Full (no mechanism claim at all) | Partial (targets one side of the entangled pair; contained by joint-reading condition) | Full (explicitly neutral pending verification) | Full for its own targets; does not touch the entangled pair |
| Requirement coverage (OD2-REQ-001–017) | Full | Full, with OD2-REQ-011/014 as active containments | Full, with OD2-REQ-011/014 as active containments | Full, with OD2-REQ-006 as an active containment |
| Evidence burden | None beyond existing evidence | High — requires Kelvin-supplied Restricted evidence | Medium — requires a single provider verification | Low — entirely within this workstream's own read-only authority |
| Observability improvement | None (status quo) | High, if obtained | Medium — resolves one binary question | Medium-High across four secondary mechanisms |
| Falsifiability | Yes — trend-based | Yes — direct evidentiary falsification of CE-DQ4-A | Yes — direct evidentiary falsification of CE-DQ4-B | Yes — per-mechanism, incremental |
| Implementation risk (of the candidate itself, not a future fix) | None | None (read-only) | None (read-only) | None (read-only) |
| Reversibility | Trivial (nothing done) | Trivial (nothing done) | Trivial (nothing done) | Trivial (nothing done) |
| Lifecycle compliance | Clean | Requires the lifecycle-decision stop condition to be honored if evidence is dispositive | Requires the same stop condition if verification is dispositive | Clean |
| No-change comparator relationship | Is the comparator | Complements the comparator; does not replace it | Complements the comparator; does not replace it | Complements the comparator; does not replace it |

**Eligible for later case-owner selection (no ranking implied by list order):** OD2-CAND-1, OD2-CAND-2, OD2-CAND-3, OD2-CAND-4 — all four survived attack and satisfy all seventeen requirements.

**Candidates needing further evidence before their own next step could proceed:** OD2-CAND-2 and OD2-CAND-3 both depend on Kelvin's willingness/ability to supply Restricted-layer access; neither is blocked at the Design-comparison level presented here, only at their own subsequent execution step, which this document does not perform.

**Unresolved trade-offs, explicitly not adjudicated here:**
- Whether to pursue OD2-CAND-2 (backend) or OD2-CAND-3 (caching) first, or both together, given both require the same category of Kelvin-supplied access and both bear on the same entangled pair.
- Whether OD2-CAND-4's broader measurement program is worth its own effort given it does not touch the entangled pair directly — this depends on how much weight the case owner places on the four currently-open secondary mechanisms versus the primary entangled one.
- Whether OD2-CAND-1's pure-wait approach is an acceptable use of the time between now and any future measurement round, versus combining it with one or more of the other three candidates concurrently (nothing above precludes running multiple candidates in parallel; this document does not recommend a combination).

No weights or numeric scores are assigned to any dimension above — this is a qualitative comparison table, not a scored ranking, consistent with the task's own instruction against false numeric precision. No winner is selected.

---

## Phase 8 — Future Evaluation Design

Defines how any later case-owner-selected candidate would be evaluated, without executing that evaluation now.

| Element | Specification |
|---|---|
| Primary comparator | Like-for-like CrUX field comparison: origin-level (`konnichiwa.nl`), mobile scope, TTFB metric, same window length (28 days), reported against the existing 24 Jun–21 Jul 2026 baseline (EV-017) |
| Observation-window comparability | Any future window is reported with its exact start/end dates, exactly as EV-017's window is stated here — no "approximately" substitution |
| Lab/public-request separation | Lab (Lighthouse) and public-request (curl/timing) evidence are reported in their own sections, never merged into the field-data comparison table |
| Confounder register | Any future evaluation explicitly re-checks OD2-AS-004 (mobile network mix), OD2-AS-005 (page-mix), OD2-AS-006 (time/load variability), and OD2-AS-008 (baseline staleness) before attributing any observed change to a selected candidate's own effect |
| No-change comparator | OD2-CAND-1's own expected pattern (statistically similar 26%-range share, absent known changes) is the explicit null hypothesis any other candidate's result is compared against |
| Legitimate null outcome | "No measurable improvement" remains an explicitly acceptable outcome (OD2-REQ-003) — it is not treated as a failed evaluation, and does not obligate escalation to a different candidate |
| Excluded claims | No top-three, ranking, conversion, revenue, or reservation promise appears in any future evaluation report, regardless of its result |
| Provisional targets | Any specific numeric TTFB target that a future Design iteration proposes is explicitly labeled **provisional**, with a stated evidence-backed rationale, and requires Kelvin's separate approval before being cited as a commitment (OD2-REQ-002) |

This specification does not itself set a target threshold, does not schedule a future measurement date, and does not select which candidate's evaluation it will eventually apply to.

---

## What This Workstream Does Not Establish, Select, or Authorize

- Does not select a preferred candidate among OD2-CAND-1 through OD2-CAND-4 — that choice belongs to the case owner.
- Does not authorize Transformation for any candidate — `transformation_authorized` remains `false` regardless of any future selection.
- Does not imply, request, or perform any implementation, publication, deployment, cache, CDN, hosting, WordPress, PHP, database, or code change.
- Does not access any Restricted-layer evidence — every Restricted-layer row remains an identified requirement, not a result.
- Does not establish whether caching is present or absent, nor whether backend processing is the dominant driver — both remain explicitly open per Binding Boundaries 1–4.
- Does not touch, reuse, or alter OD-001 or OD-003 in any respect.
- Does not claim, or provide grounds for, any ranking, visibility, conversion, revenue, or reservation benefit.
- Does not set any final, binding numeric performance target.

## Design Boundary

No design or intervention constructed in this document is authorized for implementation. This workstream derives requirements, registers assumptions, specifies measurement, and compares four candidate future states; it selects none of them, publishes nothing, and changes no external or production system. Any future Transformation response to a candidate selected from this workstream requires a separate, later Transformation Authorization Gate, not implied or pre-approved here. Any future technical-diagnosis step needed to resolve the CE-DQ4-A/B entanglement beyond what read-only evidence allows requires its own, separate lifecycle decision, per Binding Boundary 12 — not silently performed as part of this Design workstream.
