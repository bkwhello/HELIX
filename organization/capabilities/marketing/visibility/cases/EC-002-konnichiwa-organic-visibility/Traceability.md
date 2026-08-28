# Traceability
---

## Migration Manifest (final — executed 23 July 2026)

| Source | Destination | Artifact ID | Classification | Kept/Transformed | Reason |
|---|---|---|---|---|---|
| `/EC-002-konnichiwa-organic-visibility.md` | Case Identity.md, Purpose.md, Explicit Boundaries.md, Lifecycle Scope.md, measurement/TC-register.md, measurement/30-day-baseline-metrics.md, work-objects/WO-active-register.md, decisions/DD-001..006 | EC-002 | case definition, target condition, candidate work object, hypothesis, authorized decision | Transformed — split by section into the destinations above | New authoritative case-establishment source |
| `solutions/visibility/EC-002-Engineering Organizationnal Visibility of Konnichiwa.md` §1–10, 14, 16, 21–23, 27–29, 33–36 | *(not migrated)* | EC-002 (legacy framing) | case definition (superseded) | Discarded per DD-007 decision 2 ("geen historie") | Superseded by new scope; not evidence |
| same file, §11 (EC-002-O-001–006) | observations/EC-002-O-001-006-legacy.md | EC-002-O-001…006 | observation | Kept, ID preserved | Evidentiary, not scope-framing |
| same file, §12 | claims/EC-002-CL-candidate-register.md (context only) | — | unverified input | Absorbed into claims register context | Candidate intents, not scope |
| same file, §13 (WO-001–008) | work-objects/WO-legacy-register.md | WO-101…108 | candidate work object | Kept, renumbered | DD-007 decision 1 |
| same file, §17 (VD-001–010) | understanding/EC-002-VD-taxonomy.md | EC-002-VD-001…010 | understanding (taxonomy) | Kept, ID preserved | Actively cited by HV-IR-001, HV-VCM-001 |
| same file, §19 (CL-001–009) | claims/EC-002-CL-candidate-register.md | EC-002-CL-001…009 | candidate claim | Kept, ID preserved | Evidentiary, not scope-framing |
| same file, §20 | evidence/README.md | — | case definition (evidence policy) | Merged with new source §10 | Compatible, no conflict |
| same file, §25 (HV-IV-001–010) | evidence/HV-IV-001.md…007.md | HV-IV-001…007 | evidence | Kept, ID preserved, unchanged | Primary evidentiary basis of the case |
| same file, §26 (VS-001–008) | *(not migrated)* | — | superseded | Discarded | Replaced by evidence/HV-TS-001.md |
| same file, §30 | current.md, transformation/HV-IR-001.md (status), measurement/HV-DB-001.md (status) | — | mixed (evidence + decisions) | Absorbed into current.md as factual status, not as "history" | Real operational status, not scope-definition |
| same file, §32–34 | Traceability.md (this section), Challenge Evidence/CR-register.md | — | mixed | Old traceability discarded (referenced discarded IDs); 2 open challenge questions carried into CR-002 as live methodological challenges | New traceability model built fresh; genuinely open challenges preserved |
| `solutions/visibility/HV-BL-001-initial-baseline.md` | measurement/HV-BL-001.md | HV-BL-001 | evidence (partial) | Kept, ID and content preserved | Named register |
| `solutions/visibility/HV-DB-001-visibility-dashboard.md` | measurement/HV-DB-001.md | HV-DB-001 | evidence/reporting | Kept, ID and full v1–v4 history preserved | Named register |
| `solutions/visibility/HV-IR-001-intervention-register.md` | transformation/HV-IR-001.md | HV-IR-001 | transformation record | Kept, ID and full history preserved | Named register |
| `solutions/visibility/HV-TS-001-test-scenario-register.md` | evidence/HV-TS-001.md | HV-TS-001 | evidence | Kept, ID preserved | Named register |
| `solutions/visibility/HV-AR-001-attribution-register.md` | work-objects/HV-AR-001.md | HV-AR-001 | candidate work object | Kept, ID preserved | Named register |
| `solutions/visibility/HV-IV-001-huidige-zichtbaarheid.md` | evidence/HV-IV-001.md | HV-IV-001 | evidence | Kept, ID and content preserved | Approved for inclusion (DD-007 decision 3) |
| `solutions/visibility/HV-IV-002-organisatorische-realiteit.md` | evidence/HV-IV-002.md | HV-IV-002 | evidence (authoritative reality register) | Kept, ID and content preserved | Approved for inclusion |
| `solutions/visibility/HV-IV-003-zoekmachine-representatie.md` | evidence/HV-IV-003.md | HV-IV-003 | evidence | Kept, ID and content preserved | Approved for inclusion |
| `solutions/visibility/HV-IV-004-ai-representatie.md` | evidence/HV-IV-004.md | HV-IV-004 | evidence | Kept, ID and content preserved | Approved for inclusion |
| `solutions/visibility/HV-IV-005-intent-landschap.md` | evidence/HV-IV-005.md | HV-IV-005 | evidence (evaluation of prior evidence) | Kept, ID and content preserved | Approved for inclusion |
| `solutions/visibility/HV-IV-006-concurrentie.md` | evidence/HV-IV-006.md | HV-IV-006 | evidence | Kept, ID and content preserved | Approved for inclusion |
| `solutions/visibility/HV-IV-007-bestaande-content.md` | evidence/HV-IV-007.md | HV-IV-007 | evidence | Kept, ID and content preserved | Approved for inclusion |
| `solutions/visibility/HV-VCM-001-konnichiwa-coverage-map.md` | design/HV-VCM-001.md | HV-VCM-001 | design | Kept, ID and content preserved | Approved for inclusion; realizes WO-103 |
| `solutions/visibility/HV-MP-001 – HELIX Visibility Measurement Plan.md` | measurement/HV-MP-001.md | HV-MP-001 | case definition (measurement framework) | Kept, ID and content preserved | Approved for inclusion; primary measurement authority |
| `solutions/visibility/structured-data-website.md` | design/structured-data-website.md | — | design (prepared, partially implemented) | Kept, content preserved | Approved for inclusion; underlies HV-INT-001 |
| `solutions/visibility/omakase-pagina-brief.md` | design/omakase-pagina-brief.md | — | design (realized) | Kept, content preserved | Approved for inclusion; underlies HV-INT-002 |
| `solutions/visibility/product.md` | `../../product.md` (capability level, not case level) | PRD-002 | case definition (product/capability scope) | Kept, moved one level up | Product-level vision, broader than this case (mentions future staff/Bussum scope) |

## Observation → Evidence Traceability

| Observation | Status | Linked Evidence |
|---|---|---|
| O-001 (Search Console) | **Collected** (23 July 2026) | EV-014, evidence/raw/search-console-2026-07-23/ |
| O-002 (GBP performance) | **Collected** (23 July 2026) — major unexplained 6-month decline found | EV-015, evidence/raw/gbp-performance-2026-07-23/ |
| O-003 (local rankings) | **Collected** (24 July 2026) — Utrecht-controlled local-pack observation, position 2 of 3 | EV-018, observations/O-003.md; superseded proxy attempts: evidence/HV-IV-003.md, EV-014 (WebSearch, no geo-control) |
| O-004 (organic rankings) | Collected; CR-005 **Resolved for Initial Baseline** (24 July 2026) via O-003's EV-018 | evidence/HV-IV-003.md, EV-014, EV-018 |
| O-005 (indexation/sitemap) | Informed | evidence/HV-IV-007.md, EV-014 (pages, not formal coverage) |
| O-006 (metadata/schema) | Informed | evidence/HV-IV-001.md, evidence/HV-IV-007.md |
| O-007 (landing pages) | Informed, new finding pending follow-up | evidence/HV-IV-007.md, design/omakase-pagina-brief.md, EV-014 (`/nl/home-nederlands/`) |
| O-008 (NAP consistency) | Informed, quantified | evidence/HV-IV-001.md, evidence/HV-IV-002.md, evidence/HV-IV-003.md, EV-014, EV-015 |
| O-009 (reviews) | Partially informed | evidence/HV-IV-001.md, evidence/HV-IV-006.md |
| O-010 (competitors) | Informed | evidence/HV-IV-006.md |
| O-011 (reservation conversion) | **Business volume collected** (24 July 2026); channel attribution still open | EV-016, measurement/HV-MP-001.md §7 |
| O-012 (mobile performance) | **Collected** (24 July 2026 — real CrUX field data via Kelvin-supplied report URL, after 2 automated attempts failed) | EV-017, observations/O-012.md |
| O-013 (OC-002 evidence collection) | **Partially Observed** (24 July 2026, updated) — 10 of 13 HV-MP-002 items at Completed or Partial; E-05/E-06/E-07 Partial (capture date confirmed via EV-024), E-11 Completed; E-03/E-10 structurally unavailable | EV-015 (re-read), EV-019, EV-020, EV-021, EV-022, EV-023, EV-024, EV-014, EV-016 (cross-reference) |
| EC-002-O-001…006 (legacy) | Partially validated | evidence/HV-IV-001.md, HV-IV-002.md, HV-IV-004.md, HV-IV-007.md |

## Evidence → Claim Traceability (24 July 2026, decisions/DD-010)

| Claim | Status | Source Observations | Source Evidence | Challenge Outcome |
|---|---|---|---|---|
| OC-001 — Uneven Non-Branded Search Visibility Across Target Themes | Justified Organizational Claim | O-001, O-004 | EV-014, EV-018 | Survives with Narrowing |
| OC-002 — Sustained Multi-Metric Decline in Google Business Profile Engagement | Justified Organizational Claim | O-002 | EV-015 | Survives with Narrowing |
| OC-003 — Favorable Utrecht Local-Pack Position for Omakase at a Single Verified Point | Justified Organizational Claim | O-003 | EV-018 | Survives with Narrowing |
| OC-004 — Inconsistent Entity Naming With Measurable Real Search Volume | Justified Organizational Claim | O-001, O-002, O-008 | EV-001, EV-004, EV-014, EV-015 | Survives with Narrowing |
| OC-005 — Machine-Accessibility Gaps in Core Website Technical Structure | Justified Organizational Claim | O-005, O-006, O-007 | EV-001, EV-011, EV-013 | Survives with Narrowing |
| OC-006 — Passing Core Web Vitals With an Isolated Mobile Latency Exception | Justified Organizational Claim | O-012 | EV-017 | Survives with Narrowing |
| OC-007 — Reservation Volume Is Measured but Not Attributable to Visibility Channels | Justified Organizational Claim | O-011 | EV-016 | Survives with Narrowing |

Full detail (Scope, Limitations, Boundaries, Alternative Interpretations, Falsification Tests) per claim: `claims/OC-001…md` through `claims/OC-007…md`. Index: `claims/OC-register.md`. Synthesis review: `claims/ES-001-evidence-synthesis-review.md`.

## OC-002 Evidence Collection (24 July 2026, decisions/DD-013)

O-013 → EV-019 (derived chart-position reading of EV-015) → claims/OC-002-competing-explanations-register.md (10 candidate explanations, none Plausible) → claims/OC-002…md Reassessment section (claim status unchanged; "did not recover at any point" wording narrowed) → decisions/DD-013 (Evidence Sufficiency Gate, PASSED WITH CONDITIONS — not sufficient for Organizational Understanding). This chain does not touch or alter the Organizational Understanding compliance question in decisions/DD-012.

## OC-002 Blocked Evidence Follow-Up (24 July 2026, decisions/DD-013 Reassessment)

A dedicated attempt to complete E-05, E-06, E-07, and E-11 (observations/O-013.md's four blockers) found no authenticated GBP access available and no new data supplied. Per this task's own rule ("when no evidence is supplied: update blocker status only; do not create a positive or negative observation"), no new EV-### or O-### record was created — O-013.md's four blocked sections were annotated with a status-only update, and measurement/HV-ER-001-oc-002-blocked-evidence-request.md was created specifying exactly what Kelvin would need to supply. decisions/DD-013 was reassessed and **Remains PASSED WITH CONDITIONS** — no new evidence means no basis to advance to PASSED or fall to FAILED. OC-002's Justified Organizational Claim status (decisions/DD-010) and the case's authoritative lifecycle stage (Justified Organizational Claims, decisions/DD-012) are both unaffected.

## E-11 Operational Context — Completed (24 July 2026, EV-020)

Kelvin completed the Operational Context Declaration (measurement/HV-ER-001…md, Item 5) — 13 of 13 questions answered No, recorded as EV-020 (Owner Declaration) in observations/O-013.md. Narrow conclusion recorded: no known owner-controlled operational change in the thirteen examined categories was reported for February–July 2026 — not treated as proof that no operational cause of any kind existed. claims/OC-002-competing-explanations-register.md was updated with a new row, CE-11, status Unsupported (scoped to the thirteen categories). decisions/DD-013 was reassessed for this effect only — verdict unchanged, PASSED WITH CONDITIONS, with E-11 removed from the outstanding-evidence list.

## E-05/E-06/E-07 Screenshot Intake — Partial (24 July 2026, EV-021/EV-022/EV-023)

Kelvin supplied 14 GBP screenshots (Bedrijfsgegevens panel, review list sorted Nieuwste, "Alle posts" panel), processed per this task's Input Manifest / Privacy Review / Screenshot Inspection rules (observations/O-013.md). All three items move from Blocked to **Partial**, not Completed: **E-05** — full current profile configuration documented, plus 3 confirmed Google-attributed attribute changes (undated); **E-06** — an 8-review sample (avg 4.75★, 0/8 visible owner responses), no aggregate total visible (CR-006 unaffected, remains Open); **E-07** — 5 Google Posts, all labeled "vorig jaar," Photos tab not supplied. **Capture date was initially Unknown for all 14 images** (not inferred from message time, per this task's explicit rule). Reviewer identity from Inputs 10–13 was deliberately excluded from every repository record per the Privacy Handling rules. claims/OC-002-competing-explanations-register.md: CE-06 and CE-07 upgraded to Weakly Supported; new row CE-12 added (GBP-side attribute change), Unassessable. decisions/DD-013 reassessed a third time — verdict unchanged, PASSED WITH CONDITIONS; Recommendation upgraded to "Eligible for case-owner consideration of an Understanding Authorization Gate" (not an authorization of Understanding itself). OC-002's wording and claim status are unaffected by this update.

## Screenshot Capture Date Confirmed — EV-024 (24 July 2026, DD-013 Fourth Reassessment)

Kelvin submitted an Owner Declaration (EV-024) confirming all 14 screenshots above were captured 2026-07-24. Classification distinction preserved: screenshot **content** remains Direct System Screenshot evidence; the **capture date** is separately classified as Owner Declaration metadata. Effect: E-06's 8-review sample can now be approximately (week-level, derived) placed within the Feb–Jul 2026 investigation window; E-07's 5 Google Posts, read against the confirmed date, likely predate that window (no exact date assigned, per this task's explicit instruction). E-05's three confirmed attribute changes gain a dated current snapshot, but their transition dates remain unknown. **Per explicit instruction, no status was promoted merely because the date is now known — E-05, E-06, E-07 remain Partial.** CR-006 is unaffected (this Owner Declaration concerns capture date, not a review count). decisions/DD-013 reassessed a fourth time: verdict unchanged, PASSED WITH CONDITIONS; Recommendation unchanged; Conditions narrowed from "capture date unknown" to item-specific remaining gaps (E-05 transition dates, E-06 sample size, E-07 Photos tab/list completeness).

## Evidence Conflict — Review Count (24 July 2026, Challenge Evidence/CR-register.md, CR-006)

Confirming this checkpoint's own review-count reference (605, evidence/HV-IV-001.md, 22 July 2026) against a case-owner query surfaced a second, previously untranscribed figure: 625 reviews, visible on the same screen as EV-018's local-pack observation (24 July 2026, 06:41), now recorded as an Owner Declaration addendum in observations/O-003.md. Investigated before any file was corrected: EV-018's original structured record contained no review-count field at all, so this is not a transcription error in an existing record — it is a new, separately-dated data point. **CR-006 preserves both values, records their dates and surfaces, and does not infer why they differ.** observations/O-013.md's E-06 reference was updated to cite both figures with dates rather than either alone.

## Defect → Coverage → Transformation Traceability

```text
VD-002 (Contradictory Representation, opening hours)
    ↓ evidence/HV-IV-003.md, HV-IV-004.md
    ↓ design/HV-VCM-001.md (intent: Konnichiwa opening hours, priority 1)
    ↓ design/structured-data-website.md
    ↓ transformation/HV-IR-001.md, HV-INT-001 — Blocked

VD-005 (Intent Coverage Gap) + VD-008 (Machine Accessibility Failure)
    ↓ evidence/HV-IV-003.md, HV-IV-004.md, HV-IV-007.md
    ↓ design/HV-VCM-001.md (intent: Omakase Utrecht, priority 2)
    ↓ design/omakase-pagina-brief.md
    ↓ transformation/HV-IR-001.md, HV-INT-002 — Live, Awaiting First Validation (29 July 2026)
```

## Organizational Understanding Authorization Gate — DD-014 (24 July 2026)

An independent gate review (decisions/DD-014) evaluated whether the seven Justified Claims and their evidence are sufficiently coherent, bounded, and challenged for Kelvin to authorize Organizational Understanding construction. All 8 gate criteria (G-01 Valid Claims Foundation through G-08 Actionability Without Intervention) were evaluated separately and passed. A Partial Evidence Decision Table classified E-03, E-05, E-06, E-07, E-10, and CR-006 as Conditioning or narrowly Blocking (specific relationship types only) — none blocks Organizational Understanding as a phase, since none of OC-001/OC-003/OC-004/OC-005/OC-006 depends on those conditions. OU-001 and OU-002 were reviewed strictly as non-authoritative candidate material (Reusability: **Reconstruct** for both) — this review's own conclusions were derived independently from the claims, not from the drafts, per its own Draft Contamination Control criterion (G-06); the drafts' banners and decisions/DD-012 remain untouched. **Recommendation: RECOMMEND AUTHORIZED WITH CONDITIONS**, with 10 Mandatory Conditions specified (relationship types explicit, default status Candidate, every relationship challenged, OC-002 may remain standalone, OC-007 stays a Measurement/Attribution Constraint, CE-06/CE-07 stay Weakly Supported, CE-12 stays Unassessable, CR-006 stays visible, no Understanding artifact may authorize Diagnosis).

**Case-owner decision, 24 July 2026 (decisions/DD-014, Case-Owner Decision section):** Kelvin Wong issued **AUTHORIZED WITH CONDITIONS**, accepting all 10 Mandatory Conditions verbatim as the binding terms. `organizational_understanding_authorized` is now `true`; `organizational_understanding_established` remains `false` — no relationship has yet been constructed or challenged. OU-001 and OU-002 remain Draft, Not Authoritative, unmodified by this decision; the authorization permits their content to inform a *reconstructed* Understanding, not their direct promotion. Diagnosis, Design, Transformation, and external changes remain unauthorized.

## Organizational Understanding Reconstruction — DD-015 (24 July 2026)

Under decisions/DD-014's authorization, Organizational Understanding was reconstructed directly from OC-001 through OC-007 in three explicitly separated reasoning passes: Role A (Understanding Constructor) proposed candidate relationships; Role B (Relationship Challenger) independently tested each one before Role A's output could be cited as more than Candidate; Role C (Lifecycle Gate Reviewer, decisions/DD-015) evaluated the surviving set as a whole. A clean-room claim inventory (Phase 1) and candidate relationship construction (Phase 2) preceded any substantive comparison with understanding/OU-001…md or OU-002…md, per this task's required ordering.

### Claim → Relationship → Understanding Traceability

| Claim | Relationship | Challenge Outcome | Understanding |
|---|---|---|---|
| OC-001 | UR-001 (Contrast) | Survives with Narrowing | OU-003 |
| OC-003 | UR-001 (Contrast) | Survives with Narrowing | OU-003 |
| OC-004 | UR-001 (Contrast); UR-004 (Coexisting Condition, with OC-002) | UR-001: Survives with Narrowing; UR-004: Rejected | OU-003 |
| OC-002 | UR-004 (Coexisting Condition, with OC-004) — its only attempted relationship | Rejected | **None — Standalone Condition** |
| OC-005 | UR-002 (Contrast) | Survives | OU-004 |
| OC-006 | UR-002 (Contrast) | Survives | OU-004 |
| OC-007 | UR-003 (Constraint, applied to OC-001–OC-006) | Survives | Constrains OU-003 and OU-004; not itself integrated as a coexistence-type finding |

Four candidate relationships were constructed (within the 2–5 target range): three survive (UR-001 with narrowing, UR-002 and UR-003 unmodified) and one is Rejected (UR-004) and preserved, not deleted, per this task's explicit instruction. Two new candidate Organizational Understanding records (understanding/OU-003…md, understanding/OU-004…md) were constructed from the surviving relationships and independently whole-Understanding-challenged: both **Survive**.

**Draft contamination comparison (Phase 5, performed only after Phases 1–4):** understanding/OU-001…md and understanding/OU-002…md were read only after the clean-room construction above was complete. Both are classified **Historical Draft — Superseded**: OU-003/OU-004 cover the same claim clusters, independently re-derived from the claims' own Scope/Evidential Basis/Boundaries sections rather than copied from the drafts' prose, with no unsupported material found in either draft and no contradiction from newer evidence. Both drafts remain unmodified, retain their "Draft — Prematurely Produced. Not Authoritative." banners, and decisions/DD-012's lifecycle-compliance finding is not reopened.

**Gate verdict (decisions/DD-015): PASSED WITH CONDITIONS.** `organizational_understanding_established` remains `false` — per this task's Establishment Authority Boundary, the gate reviewer does not self-authorize this state; Kelvin's explicit case-owner response (ESTABLISHED / ESTABLISHED WITH CONDITIONS / NOT ESTABLISHED) is requested and pending. OC-002 remains a Standalone Condition and OC-007 remains a Measurement/Attribution Constraint, both explicit, bounded outcomes rather than gaps.

## Organizational Understanding Established — DD-015 Case-Owner Decision (25 July 2026)

Kelvin Wong, case owner, issued **ESTABLISHED WITH CONDITIONS** for OU-003 and OU-004 (decisions/DD-015, Case-Owner Decision section), accepting all 10 conditions from the gate verdict verbatim as binding terms. `organizational_understanding_established` is now `true`.

| Relationship | Type | Authoritative Status |
|---|---|---|
| UR-001 | Contrast | **Established Relationship** — only the narrowed, post-challenge wording is authoritative |
| UR-002 | Contrast | **Established Relationship** |
| UR-003 | Constraint | **Established Relationship** |
| UR-004 | Coexisting Condition (proposed) | **Rejected** — authoritative use prohibited, preserved in full |

| Understanding | Status | Establishment |
|---|---|---|
| OU-003 — Search and Entity Presence Pattern | **Established Organizational Understanding** | Conditional, decisions/DD-015 Case-Owner Decision |
| OU-004 — Technical Foundation Duality | **Established Organizational Understanding** | Conditional, decisions/DD-015 Case-Owner Decision |

understanding/OU-001…md and understanding/OU-002…md remain unmodified — Draft, Not Authoritative, Historical Draft — Superseded. This establishment does not promote, delete, or rewrite either file. OC-002 remains a standalone, unexplained condition; OC-007 remains a Measurement/Attribution Constraint; CR-006 remains Open; E-03 and E-10 continue to block discovery-trend and seasonal relationships; E-05, E-06, and E-07 remain Partial; CE-06 and CE-07 remain Weakly Supported; CE-12 remains Unassessable. No Understanding artifact authorizes Diagnosis or an intervention — `diagnosis_authorized: false`.

## Diagnosis Authorization Gate — DD-016 (25 July 2026)

An independent gate review (decisions/DD-016) inventoried every diagnosis question recorded across the case, reconciling the "6" (OU-003/OU-004's own questions) vs. "6+1" (DD-015's full listing, including the OC-002-standalone question) framing: both counts are accurate for what each describes — 6 Understanding-sourced questions, plus 1 additional question grounded directly in OC-002 (not part of either Understanding, since OC-002 remains standalone). Admissibility review of all 7 raw items found **5 canonical, admissible diagnosis questions** and **2 reclassified Not a Diagnosis Question**:

| DQ | Question (short) | Origin | Readiness |
|---|---|---|---|
| DQ-001 | Why do broader search categories underperform vs. flagship formats | OU-003 (UR-001) | **READY** |
| DQ-002 | Does naming inconsistency affect visibility (conversion/outcome excluded — OC-007 constraint) | OU-003 (UR-001) | CONDITIONALLY READY |
| DQ-003 | Does the local-pack position generalize across locations/times/devices | OU-003 (UR-001) | **Not a Diagnosis Question** — monitoring/measurement |
| DQ-004 | What causes the mobile TTFB exception | OU-004 (UR-002) | CONDITIONALLY READY |
| DQ-005 | Does OC-005's machine-accessibility gaps relate to observed AI-representation errors (scoped to CR-003's single tested scenario) | OU-004 (UR-002) | CONDITIONALLY READY |
| DQ-006 | Would closing OC-005's gaps change AI/search representation | OU-004 (UR-002) | **Not a Diagnosis Question** — intervention-loaded |
| DQ-007 | What explains the six-month GBP engagement decline | OC-002 (standalone) | CONDITIONALLY READY |

Every CONDITIONALLY READY question carries an explicit, question-specific scope exclusion (DQ-002: conversion/outcome excluded; DQ-004: strict read-only technical inspection only; DQ-005: scoped to the single tested AI scenario; DQ-007: Evidence Insufficient is an explicit acceptable outcome, bounded to the 12 already-registered candidate explanations in claims/OC-002-competing-explanations-register.md). Every High risk identified in the Phase 6 risk review (DQ-002, DQ-004, DQ-005, DQ-007 each carry at least one High risk) has a corresponding containment condition — none is left uncontained or escalated to BLOCKED.

**Gate recommendation: RECOMMEND AUTHORIZED WITH CONDITIONS**, question-specific — not a blanket recommendation. `diagnosis_authorized` remains `false` for every question; Kelvin's explicit, per-question case-owner response (AUTHORIZED FOR / AUTHORIZED WITH CONDITIONS FOR / NOT AUTHORIZED) is requested and pending.

## Diagnosis Authorized — DD-016 Case-Owner Decision (25 July 2026)

Kelvin Wong, case owner, issued **PARTIALLY AUTHORIZED WITH CONDITIONS** (decisions/DD-016, Case-Owner Decision section), a question-specific response naming an exact three-way split of the 7 canonical items reviewed by the gate. `diagnosis_authorized` is now `true`, scoped to the five questions below; `diagnosis_established` remains `false` — this authorization opens the *possibility* of bounded investigation, it does not itself constitute or begin Organizational Diagnosis.

| DQ | Case-Owner Status | Binding Scope (Question-Specific Rules, decisions/DD-016) |
|---|---|---|
| DQ-001 | **Authorized** | Bounded target condition preserved; content is not assumed to be the cause; competing explanations must be tested; falsification required |
| DQ-002 | **Authorized With Conditions** | Visibility effect only — conversion/reservation effects excluded (OC-007 constraint) |
| DQ-003 | Not Authorized | Not a Diagnosis Question — monitoring/generalization, not causal |
| DQ-004 | **Authorized With Conditions** | Mobile TTFB mechanism only — strict read-only investigation, no code/config change |
| DQ-005 | **Authorized With Conditions** | Must first independently confirm the AI-representation-error target condition; OC-005 gaps not presumed as cause; stop with Evidence Insufficient if the target condition cannot be established |
| DQ-006 | Not Authorized | Not a Diagnosis Question — intervention-loaded ("would closing gaps help") |
| DQ-007 | **Authorized With Conditions** | OC-002 remains standalone; E-05/E-06/E-07 Partial limitations and E-03/E-10/CR-006 constraints binding; Evidence Insufficient acceptable; no invented relation to OU-003/OU-004; the 162-reservation discrepancy is never characterized as "lost reservations" |

decisions/DD-016's original gate recommendation and its full Pending case-owner-decision history remain preserved, unedited, above this section. Design, Transformation, and external system changes remain unauthorized (`design_authorized: false`, `transformation_authorized: false`, `external_changes_authorized: false`). No investigation has begun for any of the five authorized/conditionally-authorized questions.

## DQ-001 Diagnosis Investigation — DD-017 (25 July 2026)

Under decisions/DD-016's Authorized (unconditional) status for DQ-001, a bounded, role-separated investigation was executed in diagnosis/DQ-001-investigation.md: Role A (Evidence Investigator) re-verified the target condition directly against EV-014 and reviewed evidence sufficiency; Role B (Competing Explanation Constructor) built six independent candidate mechanisms (CE-DQ1-A through F) without presupposing a favorite; Role C (Falsification Challenger) ran a named attack against each; Role D (Diagnosis Gate Reviewer, decisions/DD-017) evaluated the surviving mechanism as a Candidate Organizational Diagnosis. No role used a later role's conclusion as evidence for an earlier role.

### Claim/Understanding → Investigation → Diagnosis Traceability

| Source | Candidate Mechanism | Falsification Result | Outcome |
|---|---|---|---|
| OU-003, UR-001, OC-001 | CE-DQ1-A — Search-Intent Alignment (via dedicated pages) | Falsified — no dedicated page existed for either best-performing theme | Rejected |
| O-010/HV-IV-006 | CE-DQ1-B — Competitive Breadth | Supported — competitor count/strength ordinally matches the position pattern in both directions | **Survives with Narrowing** |
| HV-IV-007, O-001 top-pages | CE-DQ1-C — Query-to-Page Ownership | Falsified — the one substantive dedicated page (`/sushi-utrecht/`) ranks worst of the four themes | Rejected |
| O-013 (EV-021, GBP categories) | CE-DQ1-D — Local Entity Relevance | Categories present for both strong and weak themes; surface mismatch (Maps signal vs. organic target condition) | Weakly Supported |
| O-003/O-009 review count, CR-006 | CE-DQ1-E — Authority and Prominence | Falsified — only a uniform, business-wide signal exists; cannot produce a per-theme differential | Rejected |
| O-001 impression volumes | CE-DQ1-F — Measurement Artifact | Target condition confirmed real within one shared surface/period/scope; device/day-level disaggregation unavailable | **Survives with Narrowing** |

**Candidate Organizational Diagnosis (diagnosis/OD-001-flagship-format-competitive-breadth.md):** flagship-theme strength (teppanyaki, omakase) corresponds, associatively, to lower named-competitor density than the weaker broad-category themes (japans restaurant, sushi) — grounded in O-010/HV-IV-006's per-category competitor register. Independently challenged (Phase 8): **Survives with Narrowing** — the sole narrowing required was making the causal-status language explicitly associative, not proven-causal.

**Gate verdict (decisions/DD-017): PASSED WITH CONDITIONS.** Seven binding conditions recorded in full there (associative framing only; competitor register not a confirmed-SERP-position claim; category-breadth/named-competitor entanglement stated, not resolved; no query-to-page causal claim; Confidence capped at Medium; conversion/revenue/reservation effects excluded per UR-003; no content/page/schema/GBP/review action implied). `dq_001_diagnosis_established` remains `false` — per this task's Case-Owner Decision Boundary, the gate reviewer does not self-authorize this state; Kelvin's explicit response (ESTABLISHED / ESTABLISHED WITH CONDITIONS / NOT ESTABLISHED) is requested and pending. DQ-002, DQ-004, DQ-005, and DQ-007 remain not started; DQ-003 and DQ-006 remain Not Authorized; Design, Transformation, and external changes remain unauthorized.

## DQ-001 Established — DD-017 Case-Owner Decision (25 July 2026)

Kelvin Wong, case owner, issued **ESTABLISHED WITH CONDITIONS** for DQ-001's Candidate Organizational Diagnosis, OD-001 (decisions/DD-017, Case-Owner Decision section), accepting all seven conditions from the gate verdict verbatim as binding terms. `dq_001_diagnosis_established` is now `true`; `dq_001_establishment_decision`: Established With Conditions.

| Artifact | Status | Establishment |
|---|---|---|
| OD-001 — Flagship-Format Strength Corresponds to Lower Competitive Density | **Established Organizational Diagnosis** | Conditional, decisions/DD-017 Case-Owner Decision |

**Scope of establishment:** DQ-001 only; the four named query themes (teppanyaki, omakase, japans restaurant, sushi) only; the 21 Apr–21 Jun 2026 Search Console window only; the organic-search surface only — OC-003's single local-pack point remains adjacent corroboration, not pooled into the established mechanism. OD-001's narrowed, associative wording is unchanged and remains the sole authoritative version; it does not claim causation, verified competitor SERP positions, generalization beyond the measured themes/period/surface/devices/locations, organic/local-pack equivalence, any conversion/reservation/revenue effect, or that any intervention will improve performance.

diagnosis/DQ-001-investigation.md remains unmodified as the historical investigation record underlying this establishment. `diagnosis_established` (case-wide) is now `true`, explicitly scoped — `diagnosis_established_scope: DQ-001 only`. DQ-002, DQ-004, DQ-005, and DQ-007 remain not established and not started; DQ-003 and DQ-006 remain Not Authorized. `design_authorized: false`, `transformation_authorized: false`, `external_changes_authorized: false` — this establishment does not authorize Design, Transformation, or any external system change; any future Design response to OD-001 requires a separate, later Design Authorization Gate.

## DQ-004 Diagnosis Investigation — DD-018 (25 July 2026)

Under decisions/DD-016's Authorized With Conditions status for DQ-004, a bounded, role-separated investigation was executed in diagnosis/DQ-004-investigation.md: Role A (Evidence Investigator) re-verified the target condition directly against EV-017/O-012 and built a read-only evidence collection plan, including new, dated, public HTTPS timing observations of konnichiwa.nl (no authentication, no configuration access, no state change); Role B (Competing Explanation Constructor) built seven candidate mechanisms (CE-DQ4-A through G); Role C (Falsification Challenger) ran a named test against each using directly measured technical signals; Role D (Diagnosis Gate Reviewer, decisions/DD-018) evaluated the surviving mechanisms as a Candidate Organizational Diagnosis. No role used a later role's conclusion as evidence for an earlier role.

### Claim/Understanding → Investigation → Diagnosis Traceability

| Source | Candidate Mechanism | Falsification Result | Outcome |
|---|---|---|---|
| OC-006, EV-017/O-012 | CE-DQ4-A — Backend/application processing | Consistently elevated post-TLS wait across 4 pages and 2 User-Agent classes, not explained by connection overhead | **Survives with Narrowing**, entangled with CE-DQ4-B |
| Response headers (direct inspection) | CE-DQ4-B — Cache misses / inconsistent HTML caching | No cache/CDN header on any tested page; repeat requests show no "warm cache" speed-up — the exact pattern DD-016 anticipated for this candidate | **Survives** |
| O-001 (94% NL geography, aggregate only) | CE-DQ4-C — Geographic/network distance or hosting latency | Not testable — hosting location and real-visitor distribution not determinable from read-only signals | Needs More Evidence |
| Direct DNS/connect/TLS/redirect timing | CE-DQ4-D — Redirect, DNS, connection, or TLS overhead | DNS/connect/TLS combined under ~55 ms; 0 redirects on the canonical URL | **Rejected** |
| 4-page comparison (homepage + 3 pages) | CE-DQ4-E — CrUX aggregation / page-mix effect | Comparable timing across 4 tested pages, but only 4 of many site pages tested | Needs More Evidence |
| Mobile vs. desktop User-Agent comparison | CE-DQ4-F — Mobile traffic/network mix rather than site mechanism | No material server-side difference by User-Agent; real mobile-network/radio conditions untestable here | Needs More Evidence |
| Single-session limitation | CE-DQ4-G — Load or time-of-day variability | Only one ~10-minute session, one time of day, available | Unassessable |

**Candidate Organizational Diagnosis (diagnosis/OD-002-absence-of-html-caching-layer.md):** absence of any HTML/page-level caching layer in front of konnichiwa.nl's origin is directly observed and is associatively consistent with — though this investigation's own supplementary tests never fully reproduced the specific magnitude of — the origin's elevated baseline response time. Independently challenged: **Survives with Narrowing** — the entanglement between CE-DQ4-A and CE-DQ4-B, and the gap between this investigation's own sub-"poor" test measurements and CrUX's reported tail, are both stated explicitly rather than resolved.

**Gate verdict (decisions/DD-018): PASSED WITH CONDITIONS.** Seven binding conditions recorded in full there (associative/structural framing only; CE-DQ4-A/CE-DQ4-B entanglement not resolved; CE-DQ4-C/E/F/G remain open, not excluded; supplementary testing not representative of real-user CrUX data; no ranking/conversion/reservation/revenue claim per UR-003; no hosting/caching/CDN/configuration action implied; restricted evidence not accessed, not pre-empted). `dq_004_diagnosis_established` remains `false` — per this task's Case-Owner Decision Boundary, the gate reviewer does not self-authorize this state; Kelvin's explicit response (ESTABLISHED / ESTABLISHED WITH CONDITIONS / NOT ESTABLISHED) is requested and pending. DQ-001/OD-001 remain Established With Conditions, unaffected. DQ-002, DQ-005, and DQ-007 remain not started; DQ-003 and DQ-006 remain Not Authorized; Design, Transformation, and external changes remain unauthorized. No production or external system was changed — all evidence collection was public, read-only HTTPS retrieval of the already-published site.

## DQ-004 Established — DD-018 Case-Owner Decision (25 July 2026)

Kelvin Wong, case owner, issued **ESTABLISHED WITH CONDITIONS** for DQ-004's Candidate Organizational Diagnosis, OD-002 (decisions/DD-018, Case-Owner Decision section), accepting eleven conditions verbatim as binding terms — **narrower than the gate's own seven conditions**: the case-owner decision does not accept "no caching layer exists" as an established infrastructure fact and instead prescribes a specific, narrowed authoritative sentence. `dq_004_diagnosis_established` is now `true`; `dq_004_establishment_decision`: Established With Conditions.

| Artifact | Status | Establishment |
|---|---|---|
| OD-002 — Absence of an HTML/Page Caching Layer Is Consistent With Elevated Baseline Response Time | **Established Organizational Diagnosis** | Conditional, decisions/DD-018 Case-Owner Decision — authoritative formulation narrowed per Condition 2 |

**Authoritative formulation (supersedes any stronger phrasing in OD-002's own body text):** "No observable public evidence of HTML cache delivery was found in the bounded measurements. This condition is associatively consistent with the elevated response-time baseline, but does not establish the mechanism behind the 26% poor mobile TTFB tail."

**Scope of establishment:** DQ-004 only; the specific URLs, measurements, and observation period documented in diagnosis/DQ-004-investigation.md only. Missing cache/CDN headers are not proof caching is absent; consistent repeat-request timing is supporting context only, not proof of cache misses; backend processing and cache behaviour remain entangled; the CrUX distribution tail's mechanism remains unresolved; Confidence remains Medium at most; no ranking/conversion/reservation/revenue effect may be inferred; no cache, CDN, hosting, WordPress, code, or production change is authorized.

diagnosis/DQ-004-investigation.md remains unmodified as the historical investigation record underlying this establishment. `diagnosis_established_scope` is now **`DQ-001, DQ-004`**. DQ-002, DQ-005, and DQ-007 remain not established and not started; DQ-003 and DQ-006 remain Not Authorized. `design_authorized: false`, `transformation_authorized: false`, `external_changes_authorized: false` — this establishment does not authorize Design, Transformation, or any external system change; no Design Authorization Gate has been created.

## DQ-005 Diagnosis Investigation — DD-019 (25 July 2026)

Under decisions/DD-016's Authorized With Conditions status for DQ-005, a bounded, role-separated investigation was executed in diagnosis/DQ-005-investigation.md: Role A (Evidence Investigator) registered ground-truth facts first, directly from evidence/HV-IV-002.md, before evaluating any AI output, then re-confirmed OC-005's three specific conditions directly from claims/OC-005…md; Role B (Competing Explanation Constructor) built three candidate correspondence explanations per decisions/DD-016's own framing (Direct, No, Partial correspondence); Role C (Falsification Challenger) ran decisions/DD-016's own required fact-by-fact test against every independently-observed AI discrepancy in evidence/HV-IV-004.md and evidence/HV-TS-001.md; Role D (Diagnosis Gate Reviewer, decisions/DD-019) confirmed the investigation's rigor. No role used a later role's conclusion as evidence for an earlier role. No new AI-system queries were run — only existing evidence was compared, per decisions/DD-016's Permitted Evidence Collection for DQ-005.

### Claim/Understanding → Investigation → Diagnosis Traceability

| AI-observed discrepancy | Which OC-005 condition tested | Result |
|---|---|---|
| DeepSeek's hours error | Condition 1 (no structured data) | **Falsified** — cited source was an external reservation site, not konnichiwa.nl |
| ChatGPT's partial-correct score | Condition 1 | **Falsified** — successfully read the correct hours from plain text; the "partial" score stems from 2 conflicting external sources shown alongside, not from an inability to read the site |
| Gemini's hours error (30 min) | Condition 1 | **Evidence Insufficient** — source recorded only as "implicit," not confirmed |
| Perplexity's hours error / Teppanyaki closing time | Condition 1 | **Evidence Insufficient** — source "not explicit"; the Teppanyaki closing-time claim is not even checkable, since the owner has not yet established that ground-truth value |
| Closure-notice missing year | None (content-completeness gap) | Not applicable — also not an AI error (correctly flagged by ChatGPT) |
| Omakase price/course/booking incompleteness | Condition 2 (non-crawlable menus) | **Falsified** — the missing information was never part of the InDesign menu content; it is absent for an unrelated reason (no dedicated omakase page/asset) |
| Chef-name discrepancy (Gemini/Perplexity) | N/A | **Confirmed not an error** — two correct, non-conflicting facts about different roles |
| — (no observed error) | Condition 3 (duplicate page) | **Untested** — no AI-observed error in existing evidence concerns page-identity/duplication confusion |

**Diagnosis Outcome: Evidence Insufficient.** No mechanism connecting OC-005's three conditions to any documented AI error survives fact-by-fact testing with a positive, distinguishing result. No Candidate Organizational Diagnosis (OD) was created; no OD-### identifier was consumed. This does not reopen claims/OC-005…md (already narrowed to exclude causal language toward AI errors) or decisions/DD-005 hypothesis H-003 (a distinct, Transformation-stage hypothesis, not this question). CR-003's single-scenario scope (Open, mitigated) is preserved unchanged.

**Gate verdict (decisions/DD-019): PASSED** (unconditional). The investigation's rigor, independent ground-truth registration, and honest negative/insufficient finding require no binding conditions, since there is no diagnosis to bound. `dq_005_diagnosis_established` remains `false` — per this task's Case-Owner Decision Boundary, the gate reviewer does not self-authorize final case-owner acceptance of this finding; Kelvin's explicit response (ACCEPTED / ACCEPTED WITH CONDITIONS / NOT ACCEPTED) is requested and pending. DQ-001/OD-001 and DQ-004/OD-002 remain Established With Conditions, unaffected. DQ-002 and DQ-007 remain not started; DQ-003 and DQ-006 remain Not Authorized; Design, Transformation, and external changes remain unauthorized.

## DQ-005 Accepted — DD-019 Case-Owner Decision (25 July 2026)

Kelvin Wong, case owner, issued **ACCEPTED** for DQ-005's Evidence Insufficient outcome (decisions/DD-019, Case-Owner Decision section). This confirms, not overturns, the gate's own unconditional PASSED verdict and every preserved rejected/untested/evidence-insufficient result in diagnosis/DQ-005-investigation.md.

| Field | Value |
|---|---|
| `dq_005_diagnosis_established` | `false` (unchanged — there was never an OD to establish) |
| `dq_005_acceptance_decision` | `Pending` → **`Accepted`** |
| `dq_005_status` | **`Completed — Evidence Insufficient`** |
| OD identifier consumed | **None** — no OD was created, and none may be created or consumed to close this question |

**Meaning, recorded in full:** the Evidence Insufficient outcome is DQ-005's authoritative, closed result; no supported relationship exists between OC-005 and the tested AI-representation errors; the observed AI errors remain preserved as bounded observations only (not deleted, not reinterpreted, not elevated); **absence of evidence is not evidence that OC-005 has no AI effect** — this acceptance closes the investigation as conducted, not the underlying question in the abstract; reopening DQ-005 requires materially new evidence and a new explicit case-owner decision, not merely a request to revisit the existing record.

`diagnosis_established_scope` remains **`DQ-001, DQ-004`** — DQ-005's acceptance does not add to this list. DQ-001/OD-001 and DQ-004/OD-002 remain Established With Conditions, unaffected. DQ-002 remains not started, not established; DQ-003 and DQ-006 remain Not Authorized. `design_authorized: false`, `transformation_authorized: false`, `external_changes_authorized: false` — this decision authorizes no Design, Transformation, or external change; no Design Authorization Gate has been created.

## DQ-007 Diagnosis Investigation — DD-020 (25 July 2026)

Under decisions/DD-016's Authorized With Conditions status for DQ-007, a bounded, role-separated investigation was executed in diagnosis/DQ-007-investigation.md: Role A (Evidence Investigator) re-verified the six-metric, six-month decline directly against O-013's EV-019, explicitly preserving the established non-monotonicity correction (Feb–Apr decline, Apr–May plateau/partial recovery, Jun–Jul resumed and steepened decline), and classified evidence sufficiency across twelve required domains; Role B (Competing Explanation Constructor) built a twelve-candidate register (CE-DQ7-A through L), cross-referenced to every prior CE-01–12 classification in claims/OC-002-competing-explanations-register.md without discarding any; Role C (Falsification Challenger) ran the full required test set, including new, bounded, public, read-only research (three sources, each with title/publisher/date/access-date/URL/proposition/limitations preserved) that directly falsified one specific mechanism and left one dated-but-unconfirmed lead open; Role D (Diagnosis Gate Reviewer, decisions/DD-020) confirmed the investigation's rigor. No role used a later role's conclusion as evidence for an earlier role.

### Candidate Explanation → Result Traceability

| CE-DQ7 | Cross-ref | Result |
|---|---|---|
| A — GBP profile/category/attribute changes | CE-12 | Unassessable (transition dates unknown) |
| B — Reduced/stale Google Posts activity | CE-06 | Weakly Supported, narrow scope only |
| C — Review recency/volume/owner-response pattern | CE-07 | Weakly Supported, narrow scope only |
| D — Reduced photo activity/engagement | — (new) | Unassessable — Not Collected (Photos tab never supplied) |
| E — Konnichiwa-side operational restriction | CE-11 | Unsupported within declared scope (13 categories only) |
| F — Genuine decline in underlying demand | CE-10 | Unassessable, weakly challenged |
| G — Seasonal demand pattern | CE-01 | Unassessable (not inferred from proxy data, per binding condition) |
| H — Competitor visibility/activity increase | CE-05 | Unassessable |
| I — Query/device/surface mix change | CE-04 | Unassessable |
| J — Google algorithm/product/reporting change | CE-02 | Weakly Supported (direction-request counting, narrow) / **Rejected** (GA4-integration mechanism, new research) / Unassessable (13 June community report) |
| K — Website/technical change during window | CE-08 | Unassessable as trigger; Unsupported as mid-window-decline explanation |
| L — Measurement/aggregation/export artifact | CE-03 | Weakly Supported, narrow scope only (July partial-month); Needs More Evidence (13 June community report) |

**New external research (Phase 4):** a dated GA4/Business-Profile metrics integration (~8–10 June 2026, digitalapplied.com, citing Google's own Help documentation for the metric list but not the date) was confirmed **not** to alter the native GBP performance dashboard Konnichiwa's own screenshots are drawn from — directly falsifying that specific candidate mechanism within CE-DQ7-J. A vendor industry benchmark (birdeye.com, 29 April 2026, 53.8% "impressions" decline) was explicitly **not adopted** as Google-official evidence — it measures a different metric category than OC-002 tracks, and its own reported ~5% industry-wide decline in the *action*-category metrics OC-002 does track is far smaller than Konnichiwa's own ~57–87%, weakening rather than supporting a generic industry-pattern explanation. An unconfirmed Google Business Profile Community forum thread (title dated 13 June 2026) reporting a "performance data not updating" issue was recorded as a genuine, dated, but unverified and unofficial lead — neither adopted nor dismissed.

**Diagnosis Outcome: Evidence Insufficient.** No mechanism achieves distinguishing positive support across the full six-metric, six-month, three-phase pattern — CE-DQ7-B, C, J, and L each explain at best one narrow slice. No Candidate Organizational Diagnosis (OD) was created; no OD-### identifier was consumed. This does not reopen claims/OC-002…md or claims/OC-002-competing-explanations-register.md — every prior CE-01–12 classification is preserved and cross-referenced, not overwritten. CR-006 remains Open and unreconciled throughout; the 162-reservation discrepancy (O-011) is not referenced or characterized as lost reservations anywhere; no GBP interaction is characterized as a completed reservation.

**Gate verdict (decisions/DD-020): PASSED WITH CONDITIONS.** Seven binding conditions recorded in full there — bounding how the new Phase 4 research (GA4 integration finding, birdeye.com benchmark, 13 June community report) may be cited; preserving E-05/E-06/E-07's Partial status and the five named minimum-evidence gaps as the primary reason no candidate is distinguishable; preserving CE-DQ7-E's scope limitation; excluding any ranking/conversion/reservation/revenue inference; excluding any Design implication. `dq_007_diagnosis_established` remains `false` — per this task's Case-Owner Decision Boundary, the gate reviewer does not self-authorize final case-owner acceptance; Kelvin's explicit response (ACCEPTED / ACCEPTED WITH CONDITIONS / NOT ACCEPTED) is requested and pending. DQ-001/OD-001, DQ-004/OD-002, and DQ-005 (Completed — Evidence Insufficient / Accepted) all remain unaffected. DQ-002 remains not started; DQ-003 and DQ-006 remain Not Authorized; Design, Transformation, and external changes remain unauthorized. No GBP configuration or other authenticated/production system was accessed or changed — all Phase 4 research was public and read-only.

## DQ-007 Accepted With Conditions — DD-020 Case-Owner Decision (25 July 2026)

Kelvin Wong, case owner, issued **ACCEPTED WITH CONDITIONS** for DQ-007's Evidence Insufficient outcome (decisions/DD-020, Case-Owner Decision section). This confirms, not overturns, the gate's own PASSED WITH CONDITIONS verdict and every preserved candidate result in diagnosis/DQ-007-investigation.md, and layers six additional case-owner conditions on top of the gate's original seven (thirteen total).

| Field | Value |
|---|---|
| `dq_007_diagnosis_established` | `false` (unchanged — there was never an OD to establish) |
| `dq_007_acceptance_decision` | `Pending` → **`Accepted With Conditions`** |
| `dq_007_status` | **`Completed — Evidence Insufficient`** |
| OD identifier consumed | **None** — no OD was created, and none may be created or consumed to close this question |

**All thirteen binding conditions, recorded in full:** (1) the decline remains classified only as a verified GBP profile-engagement decline, not a confirmed demand, revenue, or reservation decline; (2) the non-monotonic pattern (decline, Apr–May plateau/limited recovery, renewed decline Jun–Jul) is preserved; (3) CE-DQ7-B, CE-DQ7-C, CE-DQ7-J, and CE-DQ7-L remain Weakly Supported only within their documented narrow scopes; (4) no candidate may be presented as Associatively Consistent or causal; (5) the Birdeye benchmark remains non-official contextual material; (6) the June data-incident forum report remains unverified and must not be presented as a confirmed Google incident; (7) the GA4 integration finding excludes only that documented integration as a mechanism, not other Google reporting changes; (8) E-05, E-06, and E-07 remain Partial; (9) E-03 and E-10 remain Structurally Unavailable; (10) CR-006 remains Open, 605/625 separately dated and unreconciled; (11) CE-11 remains Unsupported only within the thirteen owner-declared operational categories; (12) current profile, review, and post snapshots remain unsuitable as complete historical trend evidence; (13) no Design, Transformation, or external change is authorized.

**Meaning, recorded in full:** the Evidence Insufficient outcome is DQ-007's authoritative, closed result; no explanation for the GBP engagement decline is established; the observed candidate results (all of CE-DQ7-A through L) remain preserved as bounded findings only — none deleted, none promoted; reopening DQ-007 requires materially new evidence and a new explicit case-owner decision, not merely a request to revisit the existing record. The five minimum-evidence items named in diagnosis/DQ-007-investigation.md's Phase 6 remain the recorded requirements for reopening.

`diagnosis_established_scope` remains **`DQ-001, DQ-004`** — DQ-007's acceptance does not add to this list. DQ-001/OD-001 and DQ-004/OD-002 remain Established With Conditions, unaffected. DQ-005 remains Completed — Evidence Insufficient / Accepted, unaffected. DQ-003 and DQ-006 remain Not Authorized. `design_authorized: false`, `transformation_authorized: false`, `external_changes_authorized: false` — this decision authorizes no Design, Transformation, or external change; no Design Authorization Gate has been created.

## DQ-002 Diagnosis Investigation — DD-021 (25 July 2026)

Under decisions/DD-016's Authorized With Conditions status for DQ-002 (visibility metrics only — position, CTR, impressions; conversion/business-outcome effects excluded per UR-003), a bounded, role-separated investigation was executed in diagnosis/DQ-002-investigation.md: Role A (Evidence Investigator) built a name-variant inventory keeping first-party, third-party, and search-snippet evidence classes explicitly separate, established a canonical entity baseline directly from first-party evidence (including a direct HTML fetch of konnichiwa.nl confirming site-wide consistent correct spelling), ran two bounded and explicitly non-geo-controlled search checks, and performed a direct, permitted re-analysis of EV-014's raw Search Console export (`evidence/raw/search-console-2026-07-23/Zoekopdrachten.csv`) — not a new export; Role B (Competing Explanation Constructor) built eight candidate explanations (A through H) per this task's own framing; Role C (Falsification Challenger) tested each against real, converging data; Role D (Diagnosis Gate Reviewer, decisions/DD-021) confirmed the resulting diagnosis. No role used a later role's conclusion as evidence for an earlier role.

### Query-Level Evidence (direct re-analysis of EV-014's raw export)

| Query | Clicks | Impressions | CTR | Avg. Position |
|---|---:|---:|---:|---:|
| "konnichiwa utrecht" (correct) | 183 | 991 | 18.47% | 2.68 |
| "konichiwa utrecht" (misspelled) | 22 | 88 | 25.00% | **1.74** |
| "konnichiwa" (correct) | 129 | 4,147 | 3.11% | 5.46 |
| "konichiwa" (misspelled) | 62 | 3,710 | 1.67% | **3.99** |
| Correct-spelling family (75 queries) | 351 | 5,936 | — | — |
| Misspelled family (79 queries) | 96 | 4,890 | — | — |

### Candidate Explanation → Result Traceability

| Candidate | Result |
|---|---|
| A — Google reliably resolves both spellings to one entity | **Survives** |
| B — Entity ambiguity or fragmented signals | **Rejected** |
| C — Affects only branded-query retrieval | Unassessable within this investigation's scope |
| D — Contributes to broader non-branded visibility differences | **Rejected** (inherited from UR-001's own established exclusion, not re-tested) |
| E — Third-party listings introduce or reinforce the variant | **Survives** |
| F — Search suggestions/autocorrection neutralize the difference | Needs More Evidence |
| G — Location/device/personalization/timing effects | Needs More Evidence |
| H — Inconsistency exists but no measurable visibility effect | **Survives with Narrowing** (position/CTR only — the real impression/click volume difference is not disputed) |

**Candidate Organizational Diagnosis (diagnosis/OD-003-name-variant-entity-resolution.md):** name-variant search traffic functionally resolves to Konnichiwa's own site (structurally evidenced by Search Console's property-scoping — every misspelled-family query row represents real impressions/clicks on konnichiwa.nl itself), with no measured position/CTR penalty for the misspelled form in either directly-tested pair — an associatively consistent, non-causal finding. Independently challenged against every guardrail this task names (entity resolution, autocorrection, third-party effects, location/device/time variation, branded/non-branded conflation, sample sufficiency, hidden intervention): **Survives**.

**Gate verdict (decisions/DD-021): PASSED WITH CONDITIONS.** Seven binding conditions recorded in full there (position/CTR-only scope; no mechanism claim; non-geo-controlled search checks never cited as Utrecht-specific; Candidate D's rejection cited as inherited, not new; Candidates C/F/G remain open; no conversion/revenue/reservation/confusion/brand-damage claim; no Design/listing/GBP implication). `dq_002_diagnosis_established` remains `false` at gate time — per this task's Case-Owner Decision Boundary, the gate reviewer does not self-authorize this state; Kelvin's explicit response (ESTABLISHED / ESTABLISHED WITH CONDITIONS / NOT ESTABLISHED) was requested. This Pending state, and the full gate analysis above, are preserved unmodified as the historical record — see the following section for Kelvin's explicit response. DQ-001/OD-001, DQ-004/OD-002 remain Established With Conditions; DQ-005 and DQ-007 remain Completed — Evidence Insufficient (with conditions for DQ-007) / Accepted — all unaffected. DQ-003 and DQ-006 remain Not Authorized; Design, Transformation, and external changes remain unauthorized. No listing, GBP, website, schema, or metadata change occurred — all evidence collection was public read-only search snippets or already-collected first-party data re-analyzed in place.

## DQ-002 Established — DD-021 Case-Owner Decision (25 July 2026)

Kelvin Wong, case owner, issued **ESTABLISHED WITH CONDITIONS** for DQ-002's Candidate Organizational Diagnosis, OD-003 (decisions/DD-021, Case-Owner Decision section), accepting twelve conditions verbatim as binding terms — **narrower than the gate's own seven conditions**: the case-owner decision does not accept the gate-reviewed "functional resolution... structurally evidenced" framing as OD-003's citable statement and instead prescribes a specific, narrowed authoritative sentence, plus five further conditions beyond the gate's own seven. `dq_002_diagnosis_established` is now `true`; `dq_002_establishment_decision`: Established With Conditions.

| Artifact | Status | Establishment |
|---|---|---|
| OD-003 — Name-Variant Search Traffic Resolves to Konnichiwa's Own Site Without a Measured Ranking Penalty | **Established Organizational Diagnosis** | Conditional, decisions/DD-021 Case-Owner Decision — authoritative formulation narrowed; authoritative confidence **Medium** |

**Authoritative formulation (supersedes any other phrasing in OD-003's own body text):** "Within the EV-014 Search Console dataset and its documented query pairs, both 'Konnichiwa' and 'Konichiwa' generated impressions and clicks for Konnichiwa's own website. In those observations, the misspelled variant did not show a worse average position or CTR than the corresponding correctly spelled variant. This does not establish universal entity resolution or the absence of visibility effects outside the measured queries, period, device, country and search surface."

**All twelve binding conditions, restated in full:**

1. OD-003 applies only to the EV-014 dataset, its date window and documented query pairs.
2. Do not generalize the result to all branded searches, users, locations, devices, countries or time periods.
3. "Functional resolution" may describe only the observed routing of both variants to Konnichiwa's website; it must not be presented as proof that Google universally merges both names into one entity.
4. The non-geographically-controlled public searches remain supporting context, not ranking evidence for Utrecht.
5. Higher impressions and clicks for the correct spelling remain an observed volume difference. Do not label its cause as search demand without separate evidence.
6. No measured position/CTR penalty is not equivalent to proof of no visibility effect.
7. Third-party and first-party-adjacent variants remain documented inconsistencies; OD-003 does not declare them harmless.
8. Non-branded visibility remains governed by UR-001 and OD-001 and must not be attributed to the spelling variant.
9. No conclusions may be made about conversion, revenue, reservations, customer confusion or brand damage.
10. No name, listing, metadata, social profile or website correction is authorized.
11. Confidence must remain bounded by sample size and EV-014 limitations.
12. Design, Transformation and external changes remain unauthorized.

**Bounded confidence correction (decisions/DD-021 Confidence Decision, 25 July 2026):** Kelvin separately set OD-003's authoritative established confidence to **Medium**, narrower than the gate's original **Medium-High** assessment (diagnosis/OD-003-name-variant-entity-resolution.md's original Confidence section), which remains preserved unchanged there as historical, gate-reviewed analysis. Reasons: only the documented EV-014 query pairs were tested; the evidence comes from one bounded Search Console dataset; device/country/time segmentation is incomplete; the public searches were not geographically controlled; universal entity resolution was not established. This correction does not alter the twelve binding conditions above or the narrowed authoritative formulation.

**Scope of establishment:** DQ-002 only; the EV-014 Search Console dataset, its documented date window, and the specific query pairs recorded in diagnosis/DQ-002-investigation.md only; the two non-geo-controlled search checks retained only as supporting context.

diagnosis/DQ-002-investigation.md remains unmodified as the historical investigation record underlying this establishment. `diagnosis_established_scope` is now **`DQ-001, DQ-002, DQ-004`**. DQ-005 and DQ-007 remain Completed — Evidence Insufficient, not established; DQ-003 and DQ-006 remain Not Authorized. `design_authorized: false`, `transformation_authorized: false`, `external_changes_authorized: false` — this establishment does not authorize Design, Transformation, or any external system change, and does not authorize any name, listing, metadata, social-profile, or website correction; no Design Authorization Gate has been created. **Every diagnosis question authorized or conditionally authorized under decisions/DD-016 (DQ-001, DQ-002, DQ-004, DQ-005, DQ-007) has now been investigated, and every question capable of producing an Organizational Diagnosis (DQ-001, DQ-002, DQ-004) is now established.**

## Design Authorization Gate — DD-022 (26 July 2026)

An independent gate review (decisions/DD-022) assessed OD-001, OD-002, and OD-003 — the only three established diagnoses in this case — separately, against this task's own explicit instruction that established diagnosis does not automatically authorize Design.

**Per-OD recommendation:** OD-001 and OD-002 — **AUTHORIZED WITH CONDITIONS** (bounded design questions defined for each; all conditions from decisions/DD-017 and decisions/DD-018 carried forward in full). OD-003 — **NOT AUTHORIZED** (the diagnosis found no measured visibility harm from the naming inconsistency; no condition exists at the layer OD-003 tested for a Design phase to target without exceeding the diagnosis). DQ-005 and DQ-007 remain excluded from Design consideration entirely — no OD-### was ever created for either.

`case_owner_decision: Pending`. **Design remains unauthorized** — `design_authorized: false` for all three OD, `current_stage` remains `Organizational Diagnosis`. No solution, intervention, requirement, or implementation plan was created by this gate.

## Design Authorized — DD-022 Case-Owner Decision (26 July 2026)

Kelvin Wong, case owner, issued **AUTHORIZED WITH CONDITIONS FOR: OD-001, OD-002; NOT AUTHORIZED FOR: OD-003** (decisions/DD-022, Case-Owner Decision section), accepting all binding conditions from decisions/DD-017 (seven) and decisions/DD-018 (eleven) verbatim, plus ten additional common conditions and OD-specific conditions layered on top (full text in decisions/DD-022). OD-003 remains Not Authorized, with four non-authorization conditions recorded.

| Field | Value |
|---|---|
| `current_stage` | `Organizational Diagnosis` → **`Organizational Design`** (scoped to OD-001, OD-002 only) |
| `design_authorized` | `false` → **`true`**, `design_authorized_scope: OD-001, OD-002` |
| `od_001_design_authorized` | **`true`** |
| `od_002_design_authorized` | **`true`** |
| `od_003_design_authorized` | **`false`** |
| `design_started` | **`false`** — authorization permits Design artifacts only; none has been constructed |
| `transformation_authorized` | **`false`**, unconditionally |
| `external_changes_authorized` | **`false`**, unconditionally |

**Meaning, recorded in full:** OD-001 and OD-002 may enter bounded Organizational Design under their diagnosis conditions plus the additional conditions in decisions/DD-022; OD-003 is not a valid Design foundation because its established result contains no measured visibility harm within its authoritative scope. This decision does not authorize Transformation, implementation, publication, deployment, or external changes of any kind. No Design artifact, Transformation artifact, or external/production change was created by this decision. diagnosis/OD-001…md, OD-002…md, and OD-003…md were not modified. Next action: prepare separate, bounded Design workstreams for OD-001 and OD-002 (not created by this decision); OD-003 requires materially new evidence and, where needed, a new diagnosis decision before any future reconsideration.

## OD-001 Design Workstream and Readiness Gate — DD-023 (26 July 2026)

Under decisions/DD-022's Case-Owner Decision (AUTHORIZED WITH CONDITIONS for OD-001), design/OD-001-design-workstream.md was executed as a bounded Design artifact, scoped exclusively to OD-001: nine requirements were derived first, before any candidate (Phase 1); four materially distinct candidates were constructed (Phase 2) — Candidate A (No-Change/Current-State Baseline), Candidate B (Flagship-Weighted Reallocation), Candidate C (Broad-Category-Weighted Reallocation), Candidate D (Structured Re-Diagnosis Before Reallocation); each was independently attacked against an identical nine-test set (Phase 3), performed only after all four were fully drafted.

### Candidate → Attack Outcome Traceability

| Candidate | Core Assumption | Attack Outcome |
|---|---|---|
| A — No-Change | None (status quo) | **Survives**, no narrowing |
| B — Flagship-Weighted Reallocation | Organizational effort/emphasis is a lever on search position | **Survives with Narrowing** — this assumption is untested by OD-001 and must be labeled as such, not cited as diagnosis-supported |
| C — Broad-Category-Weighted Reallocation | Same lever assumption, applied to the higher-competition themes | **Survives with Narrowing**, on identical grounds to Candidate B |
| D — Structured Re-Diagnosis Before Reallocation | Current evidence (single window, Medium confidence) is not yet sufficient to reallocate on | **Survives**, no narrowing |

Candidates were then compared without ranking or selection (Phase 4): Candidates A and D require no unproven mechanism; Candidates B and C both introduce the same class of untested effort-to-ranking assumption. A measurement design (Phase 5) was defined against the existing EV-014 Search Console baseline (same four themes, organic surface only, like-for-like future window), explicitly making no top-3 or specific-rank promise and preserving "no measurable change" as an acceptable, non-failure outcome — consistent with this case's standing treatment of Evidence Insufficient (decisions/DD-016, DD-019, DD-020).

**Gate review (decisions/DD-023):** independently re-verified the Phase 3 finding that Candidates B and C rest on an assumption OD-001 does not test (diagnosis/DQ-001-investigation.md's six tested mechanisms concern content, pages, entity signals, and authority — none concerns organizational effort as a variable) and confirmed the workstream's narrowing of both as correct. Every binding condition from decisions/DD-022 (ten common, seven OD-001-specific) and every one of this task's explicit boundaries were checked directly against the workstream and found **Met**, with no gap or omission. **Gate Verdict: PASSED WITH CONDITIONS** — two conditions carried forward: (1) Candidates B/C may never be cited as "supported by OD-001" beyond its own competitive-density finding; (2) any future Transformation-stage measurement plan must preserve Phase 5's non-promise language unchanged.

`od_001_design_started` is now `true`. `od_002_design_started` remains `false` — OD-002's Design workstream is untouched by this task, still authorized but not begun. OD-003 remains not authorized for Design, untouched. No candidate was selected; `od_001_design_selection_decision: Pending` — Kelvin's explicit selection (among Candidates A–D, further iteration, or declining all) is requested and has not yet been recorded. No implementation, publication, production, or external/production system change occurred anywhere in this workstream or gate. `transformation_authorized` and `external_changes_authorized` remain `false`, unconditionally — no future candidate selection changes this by itself; Transformation requires its own, separate authorization regardless.

## OD-001 Design Candidate Selected — DD-023 Case-Owner Selection (26 July 2026)

Kelvin Wong, case owner, issued **SELECT: Candidate D** (decisions/DD-023, Case-Owner Selection section).

| Candidate | Status |
|---|---|
| D — Structured Re-Diagnosis Before Reallocation | **Selected for Further Design** |
| A — No-Change | Retained — Unselected Alternative |
| B — Flagship-Weighted Reallocation | Retained — Unselected Alternative |
| C — Broad-Category-Weighted Reallocation | Retained — Unselected Alternative |

"Retained — Unselected Alternative" is distinct from "Not Authorized" or "Rejected" — none of A, B, or C was found unsound; each remains exactly as constructed (Phase 2) and independently attacked (Phase 3) in design/OD-001-design-workstream.md, available for reconsideration once Candidate D's re-measurement produces new data. Both of decisions/DD-023's Gate Verdict conditions remain fully binding: Candidates B and C may never be cited as "supported by OD-001" beyond its own competitive-density finding; the Phase 5 measurement design's non-promise language must be preserved unchanged into any later measurement plan, including Candidate D's own.

`od_001_design_selection_decision` is no longer `Pending`. `od_001_design_established` remains **`false`** — this selection chooses which candidate proceeds to further specification; it does not itself constitute an established Organizational Design. `od_002_design_started` remains `false`, unaffected. OD-003 remains not authorized for Design, unaffected. `transformation_authorized` and `external_changes_authorized` remain `false`, unconditionally — this selection authorizes neither. **Next action:** prepare Candidate D's Re-Measurement Schedule/Protocol (exact future re-measurement date(s), the same Search Console export method as O-001/EV-014, pre-registered criteria for sufficient new evidence to reopen the choice among A/B/C) — **not yet created or executed**.

### Condition-record correction (26 July 2026)

decisions/DD-023's Case-Owner Selection conditions were corrected into four distinct, separately-provenanced sets, replacing an earlier draft that improperly calculated "eighteen" as 10 (inherited common) + 7 (inherited OD-001-specific) + 1 (a Gate Verdict condition). The corrected record keeps four sets separate, none merged, renumbered, or substituted: **Set A** (10 inherited decisions/DD-022 common conditions), **Set B** (7 inherited decisions/DD-022 OD-001-specific conditions), **Set C** (2 original decisions/DD-023 Gate Verdict conditions — Gate Condition 1, restricting how Candidates B/C may be cited, remains explicitly binding), and **Set D** (18 Binding Candidate D Selection Conditions, supplied verbatim by Kelvin Wong — provenance: "Case-Owner Selection Conditions supplied by Kelvin Wong for the SELECT: Candidate D decision, 26 July 2026" — beginning "Candidate D remains a measurement-first Organizational Design state, not a reopening of DQ-001" and ending "Transformation and external changes remain unauthorized"). Substance overlaps across sets (e.g., Set D condition 16 and Set C condition 1) are preserved as duplication with distinct provenance, not collapsed. No lifecycle field, candidate status, section order, or the verbatim historical "Pending" text was altered by this correction.

## Candidate D Re-Measurement Schedule/Protocol Prepared (26 July 2026)

design/OD-001-candidate-d-measurement-protocol.md was prepared under decisions/DD-023's Case-Owner Selection (SELECT: Candidate D). **Status: Prepared, Not Executed.**

**Phase 1 (method reconstruction, performed first):** EV-014's exact method reconstructed directly from observations/O-001.md and diagnosis/DQ-001-investigation.md — property (konnichiwa.nl), report ("Prestaties op zoeken"), file set, the 61-day window (21 Apr–21 Jun 2026), all-devices/all-countries aggregation scope for the four theme rows, and the four themes' exact literal query strings ("teppanyaki utrecht"; "omakase utrecht"; "japans restaurant utrecht"/"japanese restaurant utrecht," pooled; "sushi utrecht"). Five settings were found **undocumented anywhere in this case's evidence** and marked as blockers rather than invented: the Search Console search-type filter, the timezone basis for date boundaries, the account/permission context used for the export, locale/date-format settings, and whether any additional near-duplicate query variant was considered and excluded.

**Phase 2 (future window, fixed in advance):** 22 June–21 August 2026 (61 days, zero overlap with the baseline); earliest export date 21 September 2026 (honoring the same ~30-day reporting lag O-001.md documents); lapse date 31 December 2026 if unexecuted, preventing indefinite deferral.

**Phases 3–4 (export method and calculations, fixed in advance):** identical report, file set, aggregation scope, and four literal query strings; per-theme delta calculation only, no cross-theme aggregation; explicit exclusion of local-pack, conversion, revenue, and reservation data from every calculation.

**Phase 5 (evidence-sufficiency criteria, pre-registered):** reporting-lag completeness check; 999-row query-cap effect check; low-volume-theme uncertainty preserved (not newly resolved); any unconfirmed Phase 1 blocker must be labeled in the resulting comparison.

**Phase 6 (outcome rules, pre-registered):** four outcomes defined — Retain Candidate A; Justifies reconsidering Candidate B; Justifies reconsidering Candidate C; Unresolved (explicitly acceptable, non-failure, per decisions/DD-022 Common Condition 6). **Explicit, load-bearing limitation stated directly:** this re-measurement cannot test whether organizational effort is a lever on search position — the assumption decisions/DD-023 already found untested for Candidates B and C — it can only re-confirm or update the originally diagnosed four-theme contrast. No outcome automatically selects a candidate (decisions/DD-023, Set D, Condition 14).

**Phase 7 (boundary confirmations):** DQ-001 is not reopened; no Search Console access or export occurred in preparing this document; no automation was created; OD-002 Design remains not started; Transformation is not entered; no external/production system was changed.

**Phase 8 (approval request):** Kelvin's explicit approval is requested before any later read-only execution, covering the window, export method, outcome thresholds, and an explicit acknowledgment that this protocol cannot test the B/C effort-lever assumption. `od_001_candidate_d_protocol_approval: Pending` — nothing in the protocol is self-executing. `od_001_design_established` remains `false`; `transformation_authorized` and `external_changes_authorized` remain `false`, unconditionally.

## Candidate D Protocol Readiness Gate — DD-024 (26 July 2026)

An independent gate review (decisions/DD-024) assessed design/OD-001-candidate-d-measurement-protocol.md across eight required dimensions — baseline reproducibility, future-window comparability, extraction-lock completeness, calculation reproducibility, evidence-sufficiency criteria, outcome-rule neutrality, stop/deviation rules, lifecycle compliance — each independently found **Sound**.

**Raw-evidence verification (performed for this gate, not a new Search Console access):** direct inspection of every file in `evidence/raw/search-console-2026-07-23/` — not merely O-001.md's narrative summary — found:

- `Filters.csv` states `Zoektype,Web` directly — the original export's search type is **Confirmed** as "Web," not assumed as a platform default, per this task's explicit instruction to treat search type as material absent repository evidence.
- `Zoekopdrachten.csv` (the full 1,000-row Queries export) confirms Search Console's native report lists exact, distinct query strings with no built-in aggregation — resolving the near-duplicate-query classification question: the original theme figures are exact-string reads, and the protocol already locks future execution to the identical strings.
- `Diagram.csv`'s ISO 8601 date format resolves the locale/date-format question for parsing purposes.

### Five-Field Classification

| Field | Classification | Basis |
|---|---|---|
| Search Console search type | **Confirmed (Non-Blocking)** | `Filters.csv`, direct first-party evidence |
| Timezone basis | **Condition to Resolve Before Execution** | Unconfirmed in any raw file; low materiality since baseline and future export share the same property |
| Account/permission context | **Condition to Resolve Before Execution** | Unconfirmed in any raw file; same low-materiality reasoning |
| Locale/date-format settings | **Non-Blocking Limitation** | `Diagram.csv`'s ISO dates resolve parsing ambiguity |
| Near-duplicate-query inclusion/exclusion | **Non-Blocking Limitation** | `Zoekopdrachten.csv` confirms exact-string, non-aggregated report behavior |

**No field is classified Blocking Before Approval.** design/OD-001-candidate-d-measurement-protocol.md's Phase 1 was corrected accordingly (Bounded correction, 26 July 2026), preserving its original five-item blocker list as historical record while superseding three items with confirmed findings and carrying two forward as execution-time conditions.

**Schedule rationale, independently verified and categorized:** future window (22 Jun–21 Aug 2026) = **methodological comparability** (61-day match to EV-014, day-count independently confirmed, zero overlap with baseline); earliest export date (21 Sep 2026) = **data-finalization buffer** (consistent with O-001.md's own documented ~32-day reporting lag); lapse date (31 Dec 2026) = **conservative operational choice** (not evidence-derived, correctly labeled as a policy buffer against indefinite deferral, per decisions/DD-023 Set D Condition 8).

**Threshold justification:** Phase 6's classification rule for "Stable / No Measurable Change" was found to be qualitative, not yet a fixed numeric band. Per this task's explicit instruction, this is recorded as a **provisional threshold requiring Kelvin's explicit approval** before it can classify any result automatically — the protocol was updated to state this directly, and it is carried forward as a binding Gate Verdict condition rather than resolved unilaterally.

**Gate Verdict: PASSED WITH CONDITIONS** — (1) Kelvin must fix or approve the Phase 6 classification threshold before any result is classified; (2) the actual timezone and account/permission context used must be recorded at execution time. **This verdict is not execution approval.** `od_001_candidate_d_protocol_gate: Passed With Conditions`; `od_001_candidate_d_protocol_execution_decision: Pending` — Kelvin's explicit response (APPROVED FOR READ-ONLY EXECUTION / APPROVED WITH CONDITIONS FOR READ-ONLY EXECUTION / NOT APPROVED FOR EXECUTION) is requested and pending. No Search Console access occurred; no automation was created; OD-002 Design remains not started, unaffected; OD-003 remains not authorized for Design, unaffected. `current_stage` remains Organizational Design; Candidate D remains Selected for Further Design; Candidates A, B, and C remain Retained — Unselected Alternative, unchanged. `od_001_design_established`, `transformation_authorized`, and `external_changes_authorized` all remain `false`.

## Candidate D Protocol Execution Approved — DD-024 Case-Owner Decision (26 July 2026)

Kelvin Wong, case owner, issued **APPROVED WITH CONDITIONS FOR READ-ONLY EXECUTION** (decisions/DD-024, Case-Owner Decision section), subject to twenty-one binding conditions recorded verbatim there — superseding, in more complete form, the Gate Verdict's own two conditions (preserved unedited above as historical record, not contradicted): execution windowed to **not before 21 September 2026**, **expiring 31 December 2026** if unexecuted; search type locked to Web (Filters.csv-confirmed); the 22 Jun–21 Aug 2026 window and 61-day EV-014 baseline fixed exactly; property/filters/query strings/metrics/aggregation locked to the protocol; timezone and account/permission context to be recorded immediately before execution, with a stop-and-return rule if either materially compromises comparability; export strictly read-only; complete raw export preserved before calculation; missing/suppressed data never encoded as zero; the qualitative "Stable / No Measurable Change" rule approved for descriptive classification only, not an automatic numeric rule; no result may auto-select Candidate A/B/C, every outcome requiring a fresh case-owner selection decision; Candidates B/C's untested effort-to-ranking assumption preserved; local-pack/conversion/revenue/reservation data excluded; no top-three promise; no automation authorized; OD-002 Design remains not started; Transformation and external changes remain unauthorized.

| Field | Value |
|---|---|
| `od_001_candidate_d_protocol_execution_decision` | `Pending` → **Approved With Conditions For Read-Only Execution** |
| design/OD-001-candidate-d-measurement-protocol.md status | **Approved With Conditions — Awaiting Execution Window** |
| `candidate_d_protocol_execution_authorized` | **`true`** |
| `candidate_d_protocol_execution_mode` | **Read-Only** |
| `candidate_d_protocol_not_before` | **2026-09-21** |
| `candidate_d_protocol_authorization_expires` | **2026-12-31** |
| `candidate_d_protocol_executed` | **`false`** |
| `candidate_d_timezone_basis` | Pending Pre-Execution Confirmation |
| `candidate_d_account_context` | Pending Pre-Execution Confirmation |
| `od_001_design_established` | **`false`**, unaffected |
| `od_002_design_started` | **`false`**, unaffected |
| `transformation_authorized` | **`false`**, unconditionally |
| `external_changes_authorized` | **`false`**, unconditionally |

**This approval is not execution.** No Search Console access has occurred; no automation or scheduled task was created; no future evidence, observation, or export exists. Candidate D remains Selected for Further Design; Candidates A, B, and C remain Retained — Unselected Alternative, unchanged. OD-002 Design remains not started; OD-003 remains not authorized for Design. **Next action:** wait for the authorized execution window (21 Sep–31 Dec 2026); execution within that window requires recording timezone and account/permission context immediately beforehand and stopping for a new case-owner decision if either materially compromises comparability.

## OD-002 Design Workstream — DD-025 (2 August 2026)

Under decisions/DD-022's Case-Owner Decision (Kelvin Wong, 26 July 2026, AUTHORIZED WITH CONDITIONS FOR OD-002) and decisions/DD-018's Case-Owner Decision (Kelvin Wong, 25 July 2026, ESTABLISHED WITH CONDITIONS for OD-002), the OD-002 Design workstream was constructed in design/OD-002-design-workstream.md: seventeen requirements (OD2-REQ-001–017) derived across all nine required classes before any candidate was drafted; nine assumptions (OD2-AS-001–009) registered, matching the task's required list exactly; a Field/Public-Request/Lab/Restricted measurement-and-observability specification written but not executed; four materially distinct candidates constructed — OD2-CAND-1 (No-Change/Measurement-Continuation), OD2-CAND-2 (Origin/Backend-Processing Observability), OD2-CAND-3 (Cache-State Verification-First, explicitly valid whether caching is confirmed present or absent), OD2-CAND-4 (Expanded Multi-Mechanism Measurement Program) — each independently attacked across twelve dimensions; none Rejected — two Survive (OD2-CAND-1, OD2-CAND-3), two Survive with Conditions (OD2-CAND-2, OD2-CAND-4). A qualitative comparison (no scores, no winner) and a Future Evaluation Design followed.

### Diagnosis → Design Traceability

| Source | Design Element | Outcome |
|---|---|---|
| diagnosis/OD-002…md (authoritative formulation, DD-018 Condition 2) | OD2-REQ-001, the workstream's Design Question | Target fixed to the measured 26% mobile-TTFB-poor share, not "absence of caching" |
| CE-DQ4-A (backend processing, Survives with Narrowing) | OD2-CAND-2 | Addresses backend/origin processing directly, without asserting it is dominant |
| CE-DQ4-B (caching absence, Survives) | OD2-CAND-3 | Constructed to remain valid whether verification later confirms caching present or absent |
| CE-DQ4-C/E/F/G (Needs More Evidence / Unassessable) | OD2-CAND-4 | Targets these four secondary mechanisms via expanded read-only measurement |
| DD-022 Common Condition 3 (legitimate no-change alternative required) | OD2-CAND-1 | The required credible no-change/measurement-only baseline |
| DD-022 Additional OD-002 Condition 7 (pause if mechanism discrimination needs new Diagnosis) | OD2-REQ-014, and a binding condition in decisions/DD-025's Gate Verdict | Carried forward as an explicit stop condition, not resolved by this workstream |

**Gate verdict (decisions/DD-025): PASSED WITH CONDITIONS.** Five binding conditions recorded in full there (pause for a lifecycle decision if CE-DQ4-A/B discrimination becomes dispositive; route any confirmed-active-cache finding to case-owner review as potential new evidence against the Established Diagnosis; keep any Lighthouse lab result structurally separate from CrUX field data; no candidate's own next evidence-gathering step begins before case-owner selection; all DD-018/DD-022 conditions remain independently binding). `od_002_design_established` remains `false` — the gate reviewer does not self-authorize this state; Kelvin's explicit response (SELECT: <candidate(s)> / REQUEST FURTHER DESIGN ITERATION / DECLINE ALL CANDIDATES) is requested and pending. OD-001 and OD-003 are unaffected; OD-001 Candidate D remains Selected for Further Design, its protocol Approved With Conditions — Awaiting Execution Window, unexecuted. Design, Transformation, and external changes remain unauthorized beyond what OD-001/OD-002's existing authorizations already cover — no cache, CDN, hosting, WordPress, PHP, database, or code change was made or authorized; no ranking, conversion, revenue, or reservation claim appears anywhere in either document.

## OD-002 Candidate Selection — DD-025 Case-Owner Selection (2 August 2026)

Kelvin Wong, case owner, issued a **staged, partial selection** in response to decisions/DD-025's Requested Case-Owner Response: `SELECT: OD2-CAND-3 + OD2-CAND-2`, sequenced Stage 1 (OD2-CAND-3 — Cache-State Verification-First) before Stage 2 (OD2-CAND-2 — Origin/Backend-Processing Observability, conditional on Stage 1's result). Twenty-one binding conditions apply, verbatim, recorded in full in decisions/DD-025's Case-Owner Selection section — layering on top of, not replacing, DD-018's eleven and DD-022's twenty conditions.

| Candidate | Status |
|---|---|
| OD2-CAND-3 — Cache-State Verification-First | **Selected — Stage 1** |
| OD2-CAND-2 — Origin/Backend-Processing Observability | **Selected Conditionally — Stage 2, Pending Stage 1 Review** |
| OD2-CAND-1 — No-Change/Measurement-Continuation | Retained — Unselected Alternative |
| OD2-CAND-4 — Expanded Multi-Mechanism Measurement Program | Retained — Unselected Alternative |

**This is selection for further Design only** — it does not authorize evidence collection, authenticated access, configuration inspection, implementation, Transformation, or external changes. `od_002_stage_2_authorized: false` — naming Stage 2 in the same decision as Stage 1 does not authorize it; Condition 8 requires a new, later, explicit case-owner authorization after Stage 1's result is reviewed. `od_002_design_established` remains `false`. No credential, password, API key, or unrestricted account access was requested or stored; no hosting, WordPress, cache, or CDN system was inspected; the OD2-CAND-3 Cache-State Evidence Request/Verification Specification was **not** created by this decision — that remains the next, separately-performed action. OD-001 Candidate D and decisions/DD-024 remain untouched and unexecuted; OD-003 remains unauthorized for Design; Transformation and external changes remain unauthorized.

## OD2-CAND-3 Stage 1 Specification (3 August 2026)

Under decisions/DD-025's Case-Owner Selection (OD2-CAND-3 Selected — Stage 1), design/OD2-CAND-3-cache-state-evidence-specification.md was prepared, not executed. HTML page-cache delivery is defined narrowly and split into three separate in-scope categories (CDN/edge cache, host/reverse-proxy page cache, WordPress full-page cache), with browser cache, static-asset cache, object cache, and PHP OPcache explicitly excluded from being conflated with any of them. Configured cache state and delivered cache state are kept as two distinct, separately-evidenced dimensions — the latter already partially informed by diagnosis/DQ-004-investigation.md Phase 2B's existing read-only header/timing observations.

### Evidence Request → Outcome Routing

| Evidence Item (CSE) | Category | Collected? |
|---|---|---|
| CSE-1 — WordPress Plugins page screenshot | WordPress full-page cache (screening) | Not collected |
| CSE-2 — Caching plugin settings screenshot | WordPress full-page cache | Not collected |
| CSE-3 — Hosting control panel performance/cache tab screenshot | Host/reverse-proxy page cache | Not collected |
| CSE-4 — CDN dashboard screenshot | CDN/edge cache | Not collected |
| CSE-5 — Cache-purge/hit-ratio log export (redacted) | Delivered-state, cross-cutting | Not collected |
| CSE-6 — Provider written confirmation | Configured-state, provider-attested | Not collected |

| Outcome | Routing |
|---|---|
| CS-1 — Active Cache Confirmed | Pauses the OD-002 workstream for lifecycle/case-owner review (decisions/DD-025 Condition 6); does not auto-start Stage 2 |
| CS-2 — No Cache Found Within Inspected Scope | Bounded, scope-limited negative finding only; does not auto-start Stage 2 |
| CS-3 — Conflicting Evidence | Recorded unresolved, flagged for case-owner review; does not auto-start Stage 2 |
| CS-4 — Insufficient Evidence | Legitimate closed-for-now outcome, consistent with DQ-005/DQ-007 precedent; does not auto-start Stage 2 |

No credential, password, API key, token, cookie, or FTP/SSH credential was requested or is requested by this specification. No hosting, WordPress, CDN, or cache system was inspected; no evidence item was collected; no configuration was changed. `od_002_cand3_specification_status: Prepared — Evidence Collection Not Approved`; `od_002_cand3_evidence_collection_approved: false`; `od_002_stage_2_authorized: false`; `od_002_design_established: false`. OD2-CAND-2 (Stage 2) remains unstarted regardless of any future Stage 1 outcome, per decisions/DD-025 Condition 8 — a new, separate case-owner authorization is required. Transformation and external changes remain unauthorized.

## OD2-CAND-3 Specification Readiness Gate — DD-026 (3 August 2026)

An independent gate review (decisions/DD-026) assessed design/OD2-CAND-3-cache-state-evidence-specification.md across twelve dimensions. Seven passed cleanly (authorization compliance, target precision, HTML cache-layer separation, configured/delivered-state separation, CSE-1–6 request specificity, conflicting-evidence handling, lifecycle containment). Five required a correction, each applied directly to the specification rather than left as an outstanding gap:

| Dimension | Correction Applied |
|---|---|
| Evidence-source hierarchy | Three-tier hierarchy added (Tier 1 delivered-state/CSE-5; Tier 2 direct configuration screenshots/CSE-2,3,4; Tier 3 CSE-1 plugin-list-only; CSE-6 corroborating only) |
| CS-1/CS-2 sufficiency asymmetry | Exact minimum criteria added — CS-1: one sufficient Tier-1 or uncontradicted Tier-2 item; CS-2: demonstrated negative coverage across all three categories, any uninspected category routes to CS-4 |
| Privacy/secret-redaction controls | Shared-hosting sibling-domain/unrelated-client identifiers added to redaction discipline, same care as a credential field |
| Public-verification limits | Explicit statement added: no additional public HTTP probing authorized beyond diagnosis/DQ-004-investigation.md's existing record |
| Stop/escalation rules | Scope-creep escalation rule added: any evidence need outside CSE-1–6 routes to a specification amendment and fresh case-owner approval |

**Gate Verdict: PASSED WITH CONDITIONS.** Six binding conditions recorded in full in decisions/DD-026 (the five corrections above as ongoing governing rules, plus reaffirmation that all DD-018/DD-022/DD-025 conditions remain independently binding). No credential, password, API key, token, cookie, or FTP/SSH access was requested or accessed; no hosting, WordPress, CDN, or cache system was inspected; no CSE item was collected. `od_002_cand3_specification_readiness_gate: Passed With Conditions`; `od_002_cand3_evidence_collection_approved` remains `false`; `od_002_cand3_evidence_collection_decision: Pending` — Kelvin's explicit response (APPROVED FOR BOUNDED EVIDENCE COLLECTION / APPROVED WITH CONDITIONS FOR BOUNDED EVIDENCE COLLECTION / NOT APPROVED FOR EVIDENCE COLLECTION) is requested and pending. `od_002_stage_2_authorized`, `od_002_design_established`, `transformation_authorized`, and `external_changes_authorized` all remain `false`.

## DD-026 Bounded Correction — Two-Dimensional Cache-State Model (3 August 2026)

The Stage 1 outcome model in design/OD2-CAND-3-cache-state-evidence-specification.md was corrected from a single flattened cache-state test to a genuine two-dimensional model, per Kelvin's explicit instruction that configured state and delivered state must never be conflated.

### Configured-State Axis (five values) × Delivered-State Axis (four values)

| Configured-State | Delivered-State | Per-Category Result |
|---|---|---|
| Confirmed Enabled | Confirmed HTML Cache Hit | CS-1 contribution |
| Confirmed Enabled | Confirmed HTML Cache Miss for Bounded Requests | Contradiction → CS-3 |
| Confirmed Enabled | Unconfirmed | "Configured Cache Confirmed — Delivery Unconfirmed" |
| Confirmed Enabled | Conflicting | Contradiction → CS-3 |
| Confirmed Disabled | Confirmed HTML Cache Hit | Contradiction → CS-3 |
| Confirmed Disabled | Miss / Unconfirmed | CS-2 contribution |
| Confirmed Disabled | Conflicting | Contradiction → CS-3 |
| Not Present Within Inspected Layer | Confirmed HTML Cache Hit | Contradiction → CS-3 |
| Not Present Within Inspected Layer | Miss / Unconfirmed | CS-2 contribution |
| Not Present Within Inspected Layer | Conflicting | Contradiction → CS-3 |
| Unconfirmed | Confirmed HTML Cache Hit | CS-1 contribution (Tier-1 evidence dispositive) |
| Unconfirmed | anything else | CS-4 contribution |
| Conflicting | anything | Contradiction → CS-3 |

**Case-level aggregation, priority order:** any Contradiction → CS-3; else any CS-1 contribution → CS-1; else any "Configured Cache Confirmed — Delivery Unconfirmed" → that named state (pause for review, not CS-1); else all three categories reach CS-2 contribution → CS-2; else → CS-4.

### CSE-5 Split

- **CSE-5A** — HTML-specific cache hit/miss evidence; must identify konnichiwa.nl, the eligible HTML document(s), the evidence period, and an explicit hit/miss state or HTML-specific hit ratio. The only item able to set Delivered-State. A generic hit ratio blending HTML with assets, other domains, or unidentified traffic does not satisfy CSE-5A and is classified Unconfirmed.
- **CSE-5B** — a purge log; configured-state-adjacent evidence only, never delivered-cache-hit evidence.

### Renamed / New Outcomes

- CS-1 renamed **"Active HTML Cache Delivery Confirmed"** — reachable only via a Confirmed HTML Cache Hit; a Configured-Enabled reading alone no longer reaches it.
- New named intermediate state: **"Configured Cache Confirmed — Delivery Unconfirmed"** — distinct from, never merged with, CS-1; pauses for case-owner review.
- CS-2 renamed **"No Configured HTML Cache Found Within Inspected Scope"** — explicit that it describes the configured-state finding only; the specification states directly this must never become "Konnichiwa has no caching."
- CS-3 renamed **"Contradictory Evidence"**, now explicitly covering any per-category configured/delivered contradiction, not only same-tier disagreement.

**Gate Verdict remains PASSED WITH CONDITIONS** (decisions/DD-026), with a seventh binding condition added verbatim: "Configured cache state and delivered cache state must be reported independently; neither may substitute for the other." No CSE item was collected; no hosting, WordPress, CDN, or cache system was accessed; no configuration was changed. `od_002_cand3_evidence_collection_approved` remains `false`; `od_002_cand3_evidence_collection_decision: Pending`, unchanged by this correction. `od_002_stage_2_authorized`, `od_002_design_established`, `transformation_authorized`, and `external_changes_authorized` all remain `false`.

## DD-026 Bounded Correction 2 — Layer-First Aggregation (3 August 2026)

Bounded Correction 1's aggregation logic was itself corrected, per Kelvin's explicit instruction that different cache layers legitimately differing from each other must never be treated as a contradiction, and that a configured-enabled cache genuinely missing a specific bounded/tested request is ordinary cache behavior, not a conflict requiring escalation.

### Corrected Matrix Row

| Configured-State | Delivered-State | Old Result (Bounded Correction 1) | Corrected Result (Bounded Correction 2) |
|---|---|---|---|
| Confirmed Enabled | Confirmed HTML Cache Miss for Bounded Requests | Contradiction → CS-3 | **"Configured Cache Confirmed — Delivered Miss Observed for Bounded Request(s)"** — not CS-3, not CS-1; exact URL/request/time evidence preserved verbatim; pauses for case-owner review |

### Narrow Contradiction Definition (new Section 6.4)

**CS-3 (now "Contradictory Evidence") applies only when evidence conflicts for the same cache layer, the same relevant configuration scope, and a materially comparable time period.** Explicitly **not** a contradiction: different layers differing from each other (CDN active while WordPress page cache disabled; host cache active while no cache plugin exists; WordPress cache active while CDN caches static assets only) — these are layered configurations, normal and expected in a multi-layer delivery path.

### Layer-First Aggregation (new Section 6.6)

1. Evaluate each of the three in-scope categories (WordPress full-page cache, host/reverse-proxy page cache, CDN/edge cache) **independently first**.
2. Preserve and report **all three** layer-level results — none discarded.
3. Derive the single bounded overall outcome only afterward, in priority order:
   - Any layer reaches a CS-1 contribution (Confirmed HTML Cache Hit, no same-layer contradiction) → **CS-1**, regardless of other layers' states.
   - Else any layer reaches a Layer Contradiction (narrow definition) → **CS-3**, naming the specific layer(s).
   - Else any layer reaches "Configured Enabled + Confirmed Miss" → **"Configured Cache Confirmed — Delivered Miss Observed for Bounded Request(s)"**, pause for review.
   - Else any layer reaches "Configured Enabled + Delivered Unconfirmed" → **"Configured Cache Confirmed — Delivery Unconfirmed"**, pause for review.
   - Else all three layers reach a CS-2 contribution (Confirmed Disabled/Not Present) → **CS-2 — No Configured HTML Cache Found Within Inspected Scope**.
   - Otherwise → **CS-4 — Insufficient Evidence**.

**A confirmed hit at one layer is never canceled by a different layer's negative or disabled result** (Section 6.6, rule 1) — this is the specific fix: one confirmed HTML cache hit is sufficient for CS-1 regardless of what the other two layers show.

**Gate Verdict remains PASSED WITH CONDITIONS** (decisions/DD-026), with an eighth binding condition added verbatim: "Evidence from different cache layers must not be treated as contradictory merely because their configured or delivered states differ." All seven prior conditions (including Bounded Correction 1's) remain independently binding, unchanged. No CSE item was collected; no hosting, WordPress, CDN, or cache system was accessed; no configuration was changed. `od_002_cand3_evidence_collection_approved` remains `false`; `od_002_cand3_evidence_collection_decision: Pending`, unchanged. `od_002_stage_2_authorized`, `od_002_design_established`, `transformation_authorized`, and `external_changes_authorized` all remain `false`.

## OD2-CAND-3 Evidence Collection Approved — DD-026 Case-Owner Decision (3 August 2026)

Kelvin Wong, case owner, issued **APPROVED WITH CONDITIONS FOR BOUNDED EVIDENCE COLLECTION** (decisions/DD-026, Case-Owner Decision section), subject to twenty-seven binding conditions recorded verbatim there — layering on top of, not replacing, this gate's own eight conditions (Gate Verdict plus Bounded Corrections 1–2) and DD-018's eleven, DD-022's twenty, and DD-025's twenty-one conditions, all independently binding.

### Approved Collection Scope

| Item | Approved Scope |
|---|---|
| CSE-1 | WordPress cache/performance plugin screening |
| CSE-2 | Relevant plugin settings, only when CSE-1 identifies an applicable active plugin |
| CSE-3 | Hosting page-cache/performance status |
| CSE-4 | CDN/edge-cache status and HTML/static scope |
| CSE-5A | Existing HTML-specific hit/miss evidence, only when already available through bounded read-only access |
| CSE-5B | Existing purge history, as configured-state context only |
| CSE-6 | Existing provider-support confirmation, only when already available |

### Key Binding Conditions (of twenty-seven, full text in decisions/DD-026)

Kelvin personally accesses accounts and supplies evidence; Claude is not authorized for direct authenticated access; no credential of any kind (username, password, API key, token, cookie, recovery code, SSH/SFTP/FTP, database) may be supplied; screenshots/exports reviewed and redacted before ingestion (unrelated domains/customers/account IDs/billing/personal/private-IP data removed when not essential); capture date/timezone/source/domain recorded where safely possible; no plugin install/activate/deactivate/configure; no cache enable/disable/purge/clear/bypass/warm/test; no mutation-control clicks; no hosting/CDN/DNS/WordPress/server setting change; unavailable evidence recorded as Unavailable, never disabled/absent; CSE-5A limited to HTML-specific evidence, generic ratios insufficient; CSE-5B never proves delivered hits; CSE-6 does not authorize a new support ticket; no additional public probing; evidence outside CSE-1–6 requires a specification amendment and new decision; configured/delivered state classified separately; different-layer differences never treated as contradictory; contradiction requires same layer/scope/materially comparable time; missing evidence never proves absence; CS-1 requires a confirmed eligible anonymous HTML cache hit; CS-2 requires negative configured-state coverage across all three categories; any CS-1/intermediate-state/CS-3/CS-4 result returns to case-owner review; no result auto-authorizes Stage 2; Transformation and external changes remain unauthorized.

**This approval does not constitute evidence collection.** No CSE item has been collected; no account or system has been accessed; no support request has been sent. `od_002_cand3_evidence_collection_approved` is now `true`; `od_002_cand3_evidence_collection_decision: Approved With Conditions`; `od_002_cand3_collection_mode: Owner-Supplied Redacted Evidence Only`; `od_002_cand3_direct_authenticated_access_authorized: false`; `od_002_cand3_collection_started: false`. `od_002_stage_2_authorized`, `od_002_design_established`, `transformation_authorized`, and `external_changes_authorized` all remain `false`. Next action: Kelvin supplies any available, safely redacted CSE evidence within the approved scope — not yet supplied.

## OD2-CAND-3 Evidence Intake — Round 1 and Round 2 (13 August 2026)

Under decisions/DD-026's approved bounded collection scope, Kelvin supplied evidence directly, in two rounds, recorded in design/EC-002-OD2-CAND-3-Evidence-Intake.md.

**Round 1:** a WordPress admin Plugins-page screenshot (CSE-1) showing the complete active-plugin list (9 items) — no recognizable cache/performance plugin present — and a Vimexx account-dashboard screenshot offered as CSE-3 supporting context only (general account overview, not the performance/caching tab). Full privacy review, input manifest, visible-fact extraction, CSE mapping, layer-by-layer matrix, independent challenge, and remaining-evidence request performed. Bounded outcome: **CS-4 — Insufficient Evidence** (WordPress layer = CS-2 contribution; host and CDN layers = CS-4 contribution, uninspected).

**Round 2:** Kelvin navigated Vimexx's DirectAdmin control panel directly. Supplied, in order: a package-specifications screenshot (informative only, lists Varnish as an included feature); a Varnish setup screenshot for **nieuw.konnichiwa.nl**; a clarification that this domain was created to build the new site "but it's the same"; a DirectAdmin Domain Setup screenshot showing **konnichiwa.nl** and **nieuw.konnichiwa.nl** as two separate domain entries — resolving that the first Varnish screenshot could not be attributed to konnichiwa.nl; a domain-correct Varnish setup screenshot for **konnichiwa.nl** itself; a mislabeled "CDN" screenshot (a duplicate of the Varnish screen, not used); and the actual CDN screen, which returned "This plugin is temporarily disabled" (CSE-4, Attempted — Unavailable). A typed claim ("varnish is niet geactiveerd") was explicitly not accepted as evidence, screenshot-only discipline enforced. The wrong-domain screenshot was preserved for traceability but excluded from classification. Bounded outcome remained **CS-4 — Insufficient Evidence**, narrower than Round 1 (WordPress and host layers both now carry bounded evidence; only CDN remains unresolved).

No hosting, WordPress, CDN, or cache system was accessed by Claude directly at any point — every screenshot was captured and supplied by Kelvin personally, per decisions/DD-026 Condition 2. No plugin was installed, activated, deactivated, or configured; no cache was enabled, disabled, purged, or tested; no mutation-control click was reported or evidenced. `od_002_cand3_collection_started: true`. `od_002_stage_2_authorized`, `od_002_design_established`, `transformation_authorized`, and `external_changes_authorized` all remain `false`.

## Cache-State Evidence Classification Gate — DD-027 (13 August 2026)

An independent gate (decisions/DD-027) classified Evidence-Intake.md's Round 1 and Round 2 evidence against design/OD2-CAND-3-cache-state-evidence-specification.md's pre-registered rules. Privacy and provenance were verified; the wrong-domain Varnish screenshot was confirmed retained-but-excluded; the domain-correct Varnish screenshot was confirmed authoritative only for the host/reverse-proxy layer's Configured-State; Delivered-State was confirmed Unconfirmed on every layer (no CSE-5A ever supplied); CDN unavailability was confirmed to produce a CS-4 contribution, never CS-2.

**One narrowing correction was applied:** Evidence-Intake.md Round 2 classified the domain-correct Varnish screenshot's Configured-State as "Confirmed Disabled," inferring inactive state from DirectAdmin's single-action-button UI convention. decisions/DD-027 does not carry this forward — the screen shows no explicit enabled/disabled status label, only an "Activeer" (Activate) button and instructional text, and design/OD2-CAND-3-cache-state-evidence-specification.md §6.1 requires an explicit label for "Confirmed Disabled." The gate reclassifies this layer's Configured-State as **Unconfirmed**, the narrowest state the visible UI actually supports. Evidence-Intake.md Round 2 is preserved unmodified as the historical record of that round's own analysis; this gate's classification is independently recorded, not an edit to it.

### Final Layer Matrix (DD-027, authoritative)

| Layer | Configured-State | Delivered-State | Layer Result |
|---|---|---|---|
| WordPress full-page cache (plugin) | Not Present Within Inspected Plugin List | Unconfirmed | CS-2 contribution |
| Host/reverse-proxy page cache (Varnish, konnichiwa.nl) | Unconfirmed | Unconfirmed | CS-4 contribution |
| CDN/edge cache | Unconfirmed | Unconfirmed | CS-4 contribution |

CS-1, CS-2, and CS-3 were each independently challenged and ruled out: CS-1 requires a Confirmed HTML Cache Hit (CSE-5A), never supplied; CS-2 requires all three layers to independently reach a CS-2 contribution, only one does; CS-3 requires a same-layer/same-scope Configured/Delivered mismatch or disagreement, none exists (the two Varnish screenshots concern different DirectAdmin domain entries, not a within-layer conflict).

**Gate Verdict / Classification (first pass): CS-4 — Insufficient Evidence.** `od_002_cand3_classification_status: Pending Case-Owner Acceptance` — Kelvin's explicit response (ACCEPT CLASSIFICATION / ACCEPT CLASSIFICATION WITH CONDITIONS / REJECT CLASSIFICATION) is requested and pending. **No verdict or future acceptance under this gate may authorize Stage 2 automatically** — a new, separate, explicit case-owner authorization remains required regardless (decisions/DD-025 Condition 8). `od_002_cand3_stage_1_complete: false` — not marked complete solely because the CDN route was unavailable. `od_002_stage_2_authorized`, `od_002_design_established`, `transformation_authorized`, and `external_changes_authorized` all remain `false`. No hosting, WordPress, CDN, or cache system was inspected by this gate; no CSE item was collected by it; no commit was created; nothing was pushed. **Corrected below** (Bounded Correction, same date) — this paragraph and the layer matrix above remain unedited as the historical basis for that correction.

## DD-027 Bounded Correction — Gate Verdict / Evidence Classification Separation (13 August 2026)

Kelvin flagged that the first-pass classification above conflated two distinct facts under one field, "CS-4 — Insufficient Evidence": whether the evidence-intake process itself was sound, and what the evidence actually establishes about cache state. decisions/DD-027 was corrected — without reopening the Precondition Check, Verification, Layer Wording Correction, Final Layer Matrix, CSE-1–6 statuses, or Independent Challenge above, all preserved exactly as first recorded — into two separately-recorded fields:

- **Gate Review Verdict: PASSED WITH CONDITIONS** — the intake process (privacy review, provenance, domain-scoping, layer separation, configured/delivered-state discipline, independent CS-1/CS-2/CS-3 challenge) was carried out safely and correctly. **Does not mean the cache state is established.**
- **Evidence Classification: CS-4 — Insufficient Evidence** — the evidence, correctly processed, does not meet the threshold for CS-1, CS-2, or CS-3. **Does not mean the intake process failed** — it is Spec §6.7's pre-registered, legitimate closed-for-now outcome for exactly this evidentiary state.

**Fifteen binding conditions were recorded** (superseding the original seven in enumeration, not substance): DD-027 is authoritative for both rounds; the Evidence-Intake document remains the historical collection record; its "Confirmed Disabled" Varnish wording is superseded by DD-027's `Unconfirmed`; the visible "Activeer" control alone does not prove disabled state at capture time; the WordPress finding stays bounded to "Not Present Within Inspected Plugin List," never generalized to WordPress, host, or CDN absence; the wrong-domain nieuw.konnichiwa.nl screenshot stays preserved but excluded; CDN unavailability stays Unconfirmed, never disabled/absent; configured and delivered states stay separately reported; no evidence establishes an eligible HTML cache hit; CS-2 requires negative configured-state coverage across all three layers, unmet; Stage 1 remains incomplete; Stage 2 remains unauthorized; further collection stays within the already-approved CSE scope; Transformation and external changes remain unauthorized.

design/EC-002-OD2-CAND-3-Evidence-Intake.md was updated with a prominent Status / Authoritative Classification / Correction Notice block placed before Round 1 and Round 2 — pointing to decisions/DD-027 as authoritative and flagging Round 2's own "Confirmed Disabled" Varnish wording as historical, superseded analysis. **Neither round's own observations, analysis, or wording was altered, reworded, or deleted.**

```yaml
od_002_cand3_gate_review_verdict: Passed With Conditions
od_002_cand3_classification_outcome: CS-4 — Insufficient Evidence
od_002_cand3_classification_status: Pending Case-Owner Acceptance
od_002_cand3_stage_1_complete: false
od_002_stage_2_authorized: false
od_002_design_established: false
transformation_authorized: false
external_changes_authorized: false
```

**No case-owner acceptance is recorded by this correction.** Kelvin's requested response (ACCEPT CLASSIFICATION / ACCEPT CLASSIFICATION WITH CONDITIONS / REJECT CLASSIFICATION) remains pending and concerns acceptance of the CS-4 Evidence Classification only — it is not, and may not be read as, authorization of Stage 2, which requires its own new, separate, explicit case-owner decision regardless (decisions/DD-025 Condition 8; decisions/DD-026 Condition 24). No new evidence was collected to produce this correction; the Vimexx panel was not revisited; no system was accessed; nothing was committed or pushed.

## Cache-State Evidence Classification Accepted — DD-027 Case-Owner Decision (13 August 2026)

Kelvin Wong, case owner, issued **ACCEPT CLASSIFICATION WITH CONDITIONS** (decisions/DD-027, Case-Owner Decision section), subject to twenty-one binding acceptance conditions recorded verbatim there — layering on top of, not replacing, this gate's own fifteen Bounded Correction conditions, its original seven, and all prior DD-018/DD-022/DD-025/DD-026 conditions, all independently binding.

**Meaning, as recorded:** CS-4 — Insufficient Evidence is accepted as the authoritative classification of the currently supplied Round 1 and Round 2 evidence; the intake and classification process passed with conditions; **no cache-state conclusion has been established**; Stage 1 remains incomplete; Stage 2 remains unauthorized; this decision does not authorize configuration changes, Transformation, or external changes.

### Key Binding Acceptance Conditions (of twenty-one, full text in decisions/DD-027)

DD-027 remains authoritative for both rounds; the Evidence-Intake document remains a historical collection record, unedited; WordPress stays bounded to "Not Present Within Inspected Plugin List," never generalized; host/Varnish configured and delivered state both stay Unconfirmed — the visible "Activeer" control alone remains insufficient to prove Disabled; CDN/edge configured and delivered state both stay Unconfirmed, never read as absence; the nieuw.konnichiwa.nl screenshot stays excluded from konnichiwa.nl's classification; missing/unavailable evidence is never interpreted as absence; CS-2 stays unavailable until all three layers show negative configured-state coverage; further collection stays limited to the existing CSE-1–CSE-6 scope — no additional public probing, no new support ticket, no credential or direct authenticated agent access; Stage 1 may only reopen for further owner-supplied, safely redacted evidence within that same scope, processed as a new round, with Round 1 and Round 2 left unchanged; the most useful remaining evidence is named explicitly (a domain-correct, explicitly-labeled Varnish screen; bounded CDN configured-state evidence; existing HTML-specific hit/miss evidence, if already available); unavailable remaining evidence is an accepted, valid blocker, never to be forced; no result auto-authorizes Stage 2; Transformation and external changes remain unauthorized.

**This acceptance does not establish any cache-state conclusion, does not close Stage 1, and does not authorize Stage 2, configuration changes, Transformation, or external changes.** `od_002_cand3_classification_status` moves from `Pending Case-Owner Acceptance` to `Accepted With Conditions`; `od_002_cand3_additional_evidence_status: Authorized Within Existing CSE Scope — Not Started` (new field). `od_002_cand3_stage_1_complete`, `od_002_stage_2_authorized`, `od_002_design_established`, `transformation_authorized`, and `external_changes_authorized` all remain `false`. **Next action left open between two options, neither selected by this decision:** Kelvin supplies further owner-supplied evidence within the existing CSE scope as a new intake round (Round 1/Round 2 unchanged), or Stage 1 remains explicitly left blocked on the CDN layer's unavailable evidence, with CS-4 standing as its accepted, closed-for-now result. No new evidence was collected; no WordPress, Vimexx, CDN, or other system was accessed; nothing was committed or pushed.

## OD2-CAND-3 Evidence Intake — Round 3 and DD-028 (13 August 2026)

Per decisions/DD-027 Condition 16 (Stage 1 may reopen only for further owner-supplied, safely redacted evidence within the existing CSE scope) and Condition 17 (new evidence is processed as a new round, Round 1 and Round 2 left unchanged), Kelvin supplied a third round of evidence in response to the step-by-step collection instructions given after decisions/DD-027's acceptance: an account-wide DirectAdmin "Details for user u190930p323210" settings-table screenshot showing explicit feature toggles **Varnish: ON** and **CDN: OFF**; a repeat CDN-screen check (still "This plugin is temporarily disabled," now explained by the OFF toggle rather than merely unavailable); and confirmation, after searching, that no HTML-specific hit/miss evidence (CSE-5A) exists anywhere in the dashboard. Round 3 was appended to design/EC-002-OD2-CAND-3-Evidence-Intake.md; Round 1 and Round 2 remain completely unedited. Server IP, name servers, account email, resource totals, and the unrelated jatosushi.nl domain were excluded from the extracted record.

decisions/DD-028 independently classified this round. **The CDN/edge layer is upgraded** from Round 2's "Unavailable" to **Confirmed Disabled** — an explicit, hosting-panel-sourced "OFF" field, not an inference from UI convention (unlike the Varnish reasoning decisions/DD-027 already rejected). **The host/reverse-proxy (Varnish) layer is deliberately not upgraded** — "Varnish: ON" is an account-wide statement, true across all four domains on the account without distinguishing them, and does not establish an explicit, domain-specific state for konnichiwa.nl per the specification's own "for konnichiwa.nl specifically" framing; it remains Unconfirmed, recorded only as corroborating context.

### Updated Layer Matrix (DD-028, authoritative for the CDN row; DD-027 remains authoritative for WordPress and host/reverse-proxy)

| Layer | Configured-State | Delivered-State | Layer Result |
|---|---|---|---|
| WordPress full-page cache (plugin) | Not Present Within Inspected Plugin List | Unconfirmed | CS-2 contribution |
| Host/reverse-proxy page cache (Varnish, konnichiwa.nl) | Unconfirmed | Unconfirmed | CS-4 contribution |
| CDN/edge cache | **Confirmed Disabled** | Unconfirmed | **CS-2 contribution** |

Per Spec §6.6 Rule 5, CS-2 still requires **all three** layers to independently reach a CS-2 contribution — now two of three do; the host/reverse-proxy layer alone remains open. CS-1, CS-2, and CS-3 were each independently re-challenged and ruled out again: CS-1 still requires a Confirmed HTML Cache Hit (never supplied, now confirmed searched-for); CS-2 still requires all three layers, one incomplete layer bars it; CS-3 requires a same-layer conflict, and "CDN: OFF" corroborates rather than contradicts the earlier "temporarily disabled" screen.

**Gate Review Verdict (first pass): PASSED WITH CONDITIONS. Evidence Classification: CS-4 — Insufficient Evidence** — narrower than decisions/DD-027's own CS-4, not a different outcome. **Accepted below** (Case-Owner Decision, same date) — this paragraph and the layer matrix above remain unedited as the historical basis for that decision.

## Stage 1 Closed — DD-028 Case-Owner Decision (13 August 2026)

Kelvin Wong, case owner, issued **ACCEPT CLASSIFICATION WITH CONDITIONS** (decisions/DD-028, Case-Owner Decision section), subject to twenty-nine binding acceptance conditions recorded verbatim there — layering on top of, not replacing, this gate's own nine conditions, decisions/DD-027's twenty-one acceptance conditions, its own fifteen and seven prior conditions, and all DD-018/DD-022/DD-025/DD-026 conditions, all independently binding.

**Meaning, as recorded:** the Round 3 classification is accepted; the authoritative overall outcome remains CS-4 — Insufficient Evidence; the evidence gap is now limited primarily to the domain-specific Varnish state and delivered-state evidence; **Stage 1 closes as Completed — Evidence Insufficient / Approved Evidence Exhausted**; this is not a finding that konnichiwa.nl has no caching; OD2-CAND-2 Stage 2 remains unauthorized until a separate authorization gate and explicit case-owner decision.

### Key Binding Acceptance Conditions (of twenty-nine, full text in decisions/DD-028)

DD-028 authoritative for Round 3, DD-027 remains authoritative for Round 1/Round 2, all three rounds preserved unchanged; the DirectAdmin settings table is account-level evidence across multiple domains; "CDN: OFF" establishes only Confirmed Disabled within the inspected DirectAdmin account scope at capture time, never generalized to every possible external CDN/proxy/future configuration; CDN delivered state stays Unconfirmed; "Varnish: ON" establishes only account-level enablement, never that eligible HTML responses for konnichiwa.nl were actually served through it; host/Varnish configured and delivered state for konnichiwa.nl both stay Unconfirmed; missing hit/miss evidence is recorded as "Not Available," never rewritten as zero hits, all misses, or caching absent; WordPress stays bounded to "Not Present Within Inspected Plugin List"; two CS-2 contributions remain insufficient while the Varnish layer is unresolved; CS-1 and CS-3 both stay unavailable; the final Round 3 outcome remains CS-4; Stage 1 closes because approved, presently available evidence is exhausted, not because the cache state was conclusively determined; materially new evidence may reopen Stage 1 only through a new explicit decision; closure must not alter OD-002's bounded wording; Stage 2 must inherit no assumption either that Varnish is active or that no HTML caching exists; Stage 2 requires its own separate authorization gate, not created by this decision; no public probing, no credentials/direct access, no setting changes; Transformation and external changes remain unauthorized.

**This closure does not establish any cache-state conclusion, does not authorize Stage 2, configuration changes, Transformation, or external changes.** `od_002_cand3_stage_1_complete` moves from `false` to `true`; `od_002_cand3_stage_1_status: Completed — Evidence Insufficient / Approved Evidence Exhausted`; `od_002_cand3_remaining_primary_unknown: Domain-Specific Varnish Configured and Delivered State`. `od_002_stage_2_authorized`, `od_002_stage_2_authorization_gate: Not Yet Prepared`, `od_002_design_established`, `transformation_authorized`, and `external_changes_authorized` all remain `false`. **Next authorized artifact:** prepare an OD2-CAND-2 Stage 2 Authorization Gate from the accepted CS-4 Stage 1 result — not created by this decision, must not assume Varnish is active for konnichiwa.nl or that no HTML caching exists. No further evidence was collected; no external system was accessed; nothing was committed or pushed.

## OD2-CAND-2 Stage 2 Authorization Gate — DD-029 (13 August 2026)

An independent readiness gate (decisions/DD-029) assessed whether OD2-CAND-2 (Origin/Backend-Processing Observability) may begin, after OD2-CAND-3 Stage 1 closed with CS-4 (decisions/DD-028). All sixteen preconditions passed. Fourteen mandatory sources were read in full, including EM-001's EP-005 (Diagnosis Before Design), EP-006 (Design Before Transformation), and AD-010's Organizational Design definition. The cache-state result and OD-002's sole authoritative sentence were preserved verbatim.

### G-01–G-12 Matrix Summary

No gate item failed. G-01 (lifecycle legitimacy) establishes a three-way routing rule: evidence discriminating the already-registered CE-DQ4-A/CE-DQ4-B pair stays within Design; evidence pointing to an unregistered mechanism returns to Organizational Diagnosis; evidence dispositive enough to resolve the entanglement triggers a lifecycle-decision pause (existing Binding Boundary 12/OD2-REQ-014, decisions/DD-022 Common Condition 10). G-02 (Stage 1 dependency) establishes that CS-4/Stage 1's closure must never itself be cited as proof Stage 2 is necessary — only the entanglement, open since decisions/DD-018, may ground that recommendation. G-03 through G-12 (question precision, evidence necessity, access containment, evidence-layer separation, measurement sufficiency, privacy/redaction, reversibility/stop rules, outcome routing, business-boundary integrity, Transformation containment) all pass, each extending controls this case already proved through Stage 1's own three intake rounds.

### BE-01–BE-08 Assessment (assessed, not collected)

Eight candidate backend/origin evidence classes were classified: none Essential; most Conditional or Useful-but-Non-Blocking; phpMyAdmin (surfaced in the same DirectAdmin menu during Stage 1) explicitly flagged **Unsafe Without New Authorization**. Given what Round 1–3's own direct exploration of this exact panel already surfaced — a generic feature-toggle table, AWStats bandwidth/disk statistics, a PHP error log, a Resource Usage panel, nothing resembling PHP/DB timing — **BE-02 (PHP execution) and BE-03 (database timing), the two most directly discriminating items, realistically may resolve to Not Available.**

### Independent Challenge

Ten challenges tested: seven **Survive** cleanly (silent Diagnosis reopening; backend-slowness assumption; Varnish-active assumption; caching-absence assumption; lab/field substitution; implied technical solution; Transformation leakage); three **Survive with Narrowing** — Stage-1-exhaustion cited as sole justification, credential-free evidence-gathering feasibility, and dashboard discriminating power — each narrowing condition folded directly into the recommendation, none left optional. **None Rejected.**

### Recommendation

**RECOMMEND AUTHORIZED WITH CONDITIONS** — limited strictly to preparing the **OD2-CAND-2 Origin/Backend Evidence Request and Observability Specification** (Gate 1 of a five-gate division: 1—prepare specification; 2—authorize collection; 3—accept classification; 4—establish Design; 5—authorize Transformation). Nine binding conditions apply if authorized, none collapsing the five gates into each other. **This gate does not itself authorize anything.**

```yaml
od_002_stage_2_authorization_gate: Prepared — Decision Pending
od_002_stage_2_authorization_gate_reference: decisions/DD-029
od_002_stage_2_specification_created: false
od_002_stage_2_evidence_collection_authorized: false
od_002_stage_2_authorized: false
od_002_design_established: false
transformation_authorized: false
external_changes_authorized: false
```

Requested response (first pass): `AUTHORIZED TO PREPARE STAGE 2 SPECIFICATION` / `AUTHORIZED WITH CONDITIONS TO PREPARE STAGE 2 SPECIFICATION` / `NOT AUTHORIZED TO PREPARE STAGE 2 SPECIFICATION`. OD2-CAND-3 Stage 1 remains, unaffected, Completed — Evidence Insufficient / Approved Evidence Exhausted. **Answered below** (Case-Owner Decision, same date) — this paragraph and the matrices above remain unedited as the historical basis for that decision.

## Stage 2 Specification Preparation Authorized — DD-029 Case-Owner Decision (13 August 2026)

Kelvin Wong, case owner, issued **AUTHORIZED WITH CONDITIONS TO PREPARE STAGE 2 SPECIFICATION** (decisions/DD-029, Case-Owner Decision section), subject to nine binding conditions recorded verbatim there — layering on top of, not replacing, all prior DD-018/DD-022/DD-025/DD-026/DD-027/DD-028 conditions, all independently binding.

**Authorization is limited strictly to preparing the OD2-CAND-2 Origin/Backend Evidence Request and Observability Specification.** This decision explicitly does **not** authorize: evidence collection; authenticated system access; credentials or customer-data intake; profiler or debug-mode activation; configuration or production changes; Stage 2 execution; establishment of OD-002 Design; or Transformation/external changes.

**Preserved without reinterpretation:** the Stage 1 CS-4 classification (decisions/DD-028) and the domain-specific host/Varnish state (Unconfirmed Configured-State, Unconfirmed Delivered-State) — restated, not altered, by this decision.

**Nine binding conditions, in summary:** ground the specification's justification in the CE-DQ4-A/CE-DQ4-B entanglement, never in Stage 1's closure alone; pre-register "Not Available" as legitimate for BE-02/BE-03, never pursued via credentials or phpMyAdmin-style access; pre-register "Insufficient Evidence" as a legitimate Stage 2 outcome; carry forward every BE-01–BE-08 classification unmodified; apply G-01's three-way routing table to any future evidence outcome; apply G-05–G-09's access/privacy/reversibility/stop rules in full; treat Gates 2 through 5 (collection, classification acceptance, Design establishment, Transformation) as each requiring their own future decision; no credential of any kind; all prior DD-018/DD-022/DD-025/DD-026/DD-027/DD-028 conditions remain independently binding.

```yaml
od_002_stage_2_authorization_gate: Authorized With Conditions — Specification Preparation Only
od_002_stage_2_specification_preparation_authorized: true
od_002_stage_2_specification_created: false
od_002_stage_2_evidence_collection_authorized: false
od_002_stage_2_authorized: false
od_002_design_established: false
transformation_authorized: false
external_changes_authorized: false
```

**Next action:** prepare the OD2-CAND-2 Origin/Backend Evidence Request and Observability Specification — not created by this decision, remains a distinct, later, separately-performed task. No evidence was collected; no system was accessed; nothing was committed or pushed.

## OD2-CAND-2 Origin/Backend Evidence Request and Observability Specification — Prepared (13 August 2026)

Under decisions/DD-029's Case-Owner Decision (Authorized With Conditions to Prepare Stage 2 Specification), design/OD2-CAND-2-origin-backend-evidence-observability-specification.md was prepared, not executed. All fifteen preconditions passed; all nine decisions/DD-029 binding conditions carried forward verbatim.

**Question tested:** what observable evidence, if any, distinguishes origin/backend processing from cache-layer delivery, network conditions, CrUX aggregation effects, page mix, and time/load variability — framed explicitly as mechanism discrimination within Design, not new Diagnosis, with Evidence Insufficient pre-registered as legitimate.

**Evidence manifest:** BE-01 through BE-08 individually specified (question, source, evidence class, collection method, minimum/prohibited fields, redaction requirements, owner, access requirement, sufficiency rule, limitation, missing-evidence classification, CE-DQ4-A/B discriminating power, separate-approval requirement) — every decisions/DD-029 classification carried forward unmodified: none Essential; most Conditional or Useful-but-Non-Blocking; **phpMyAdmin explicitly `Unsafe Without New Authorization`**, with no SQL, table name, or database-browsing content anywhere in the document.

**Evidence classes kept structurally separate:** CrUX field; lab; public-request timing; restricted origin/backend; Owner Declaration; provider-attested — lab never substitutes for field, public timing never establishes internal mechanisms, configured state never substitutes for delivered state, account-level evidence never automatically establishes domain-specific state, missing evidence never becomes zero/disabled/absent/healthy.

**Privacy and access:** prohibits collecting/storing passwords, API keys, tokens, cookies, session identifiers, FTP/SSH/database credentials, customer names/emails/phones, reservation content, raw visitor IPs, payment/billing data, and neighbouring-domain data. Collection mode fixed to Owner-Supplied Redacted Evidence Only; twelve agent-prohibited actions listed (login to any system, credential handling, debug/profiling activation, plugin installation, PHP/SQL execution, cache/server changes, provider support contact, new public probes, direct log access) — any evidence needing one of these is classified Blocked and routed to case-owner review.

**Outcome routing:** six pre-registered outcomes (Backend Signal Confirmed / Not Found / Mechanisms Remain Entangled / Contradictory Evidence / Evidence Insufficient / Unsafe or Unauthorized Evidence Requirement), each with its own minimum threshold and permitted/forbidden conclusions — no outcome auto-establishes OD-002 Design, auto-authorizes a technical solution, auto-extends collection scope, or auto-authorizes Transformation/external changes.

**Independent falsification (twelve attacks):** all twelve **Survive**. One (credential/privacy leakage, via an implicit phpMyAdmin route considered during BE-03's drafting) required a correction — phpMyAdmin explicitly excluded and flagged Unsafe Without New Authorization — preserved in the specification's own record rather than silently absorbed.

design/OD-002-design-workstream.md and design/README.md were updated with status-only addenda; no requirement, candidate, attack, or comparison content in either file's own original phases was altered.

```yaml
od_002_stage_2_specification_created: true
od_002_stage_2_specification_status: Prepared — Evidence Collection Not Authorized
od_002_stage_2_specification_readiness_gate: Not Yet Created
od_002_stage_2_evidence_collection_authorized: false
od_002_stage_2_authorized: false
od_002_design_established: false
transformation_authorized: false
external_changes_authorized: false
```

**Preparation of this specification is not approval to collect evidence.** Next action: an independent readiness review of this specification — not created by this task. No evidence was collected; no hosting, WordPress, DirectAdmin, database, or CDN system was accessed; no HTTP probing performed; nothing was committed or pushed.

## OD2-CAND-2 Specification Readiness Gate — DD-030 (13 August 2026)

An independent gate (decisions/DD-030) reviewed design/OD2-CAND-2-origin-backend-evidence-observability-specification.md across authority/scope (Part A), the BE-01–BE-08 manifest (Part B), evidence-class separation (Part C), privacy/security (Part D), outcome routing (Part E), mechanism-discrimination usefulness (Part F), a fifteen-attack independent challenge (Part G), and a twelve-item G-01–G-12 matrix (Part H). All thirteen preconditions passed; all nine decisions/DD-029 conditions were verified word-for-word against the specification's own Phase 1 restatement.

### BE-01–BE-08 Readiness

Six items **Ready**; the remainder **Ready With Conditions** (profiling/debug exclusion for BE-02; phpMyAdmin exclusion for BE-03; aggregation-verification for BE-05; low-expected-yield/BE-08-overlap for BE-06; no-new-ticket for BE-07). **No BE item found Essential** — independently confirmed, not merely repeated from decisions/DD-029. phpMyAdmin remains `Unsafe Without New Authorization`.

### Three Bounded Corrections (applied directly to the specification, preserved inline with dated attribution)

1. **BE-07 Class 4/6 cross-reference** — Phase 4 originally listed BE-07 under both Class 4 (Restricted origin/backend) and Class 6 (Provider-attested), contradicting BE-07's own Phase 3 definition. Corrected to Class 6 only.
2. **Mechanism-discrimination scope boundary** — Phase 2's question named six mechanisms (backend, cache, network, CrUX aggregation, page mix, time/load); the BE-01–BE-08 manifest addresses only two (CE-DQ4-A/CE-DQ4-B). An explicit disclaimer was added: CE-DQ4-C, CE-DQ4-E, CE-DQ4-F, and CE-DQ4-G remain entirely outside this specification's manifest — OD2-CAND-4's separate, unselected remit.
3. **Server-file-path redaction gap** — Phase 5's privacy list was missing "internal server file paths," already named as a risk in decisions/DD-029's own G-08 table. Added.

### Independent Challenge and Gate Matrix

Fifteen attacks tested (distinct from the specification's own internal twelve-attack pass): **fourteen Survive cleanly; one (raw-log privacy leakage) Survives with Narrowing**, corrected as above. The G-01–G-12 matrix found **no failures** — five criteria (G-03 BE manifest completeness, G-04 evidence-class integrity, G-05 privacy/security safety, G-07 mechanism-discrimination usefulness, G-11 falsifiability) carry **Pass With Conditions**, each tied directly to the corrections above.

### Gate Verdict

**PASSED WITH CONDITIONS** — kept explicitly separate from any future case-owner decision. Seven binding conditions recorded (the three corrections; no-BE-item-Essential confirmation; phpMyAdmin's continued Unsafe status; all prior DD-018/DD-022/DD-025/DD-026/DD-027/DD-028/DD-029 conditions independently binding; no authorization of Stage 2 execution, Design establishment, Transformation, or external changes regardless of case-owner response).

```yaml
od_002_stage_2_specification_created: true
od_002_stage_2_specification_status: Prepared — Readiness Reviewed, Decision Pending
od_002_stage_2_specification_readiness_gate: DD-030 — Passed With Conditions
od_002_stage_2_evidence_collection_authorized: false
od_002_stage_2_authorized: false
od_002_design_established: false
transformation_authorized: false
external_changes_authorized: false
```

Requested response (first pass): `APPROVED FOR BOUNDED STAGE 2 EVIDENCE COLLECTION` / `APPROVED WITH CONDITIONS FOR BOUNDED STAGE 2 EVIDENCE COLLECTION` / `NOT APPROVED FOR STAGE 2 EVIDENCE COLLECTION`. Stage 1's CS-4 classification and the domain-specific Varnish Unconfirmed/Unconfirmed state are unchanged. **Answered below** (Case-Owner Decision, same date) — this paragraph and the matrices above remain unedited as the historical basis for that decision.

## Bounded Stage 2 Evidence Collection Authorized — DD-030 Case-Owner Decision (13 August 2026)

Kelvin Wong, case owner, issued **APPROVED WITH CONDITIONS FOR BOUNDED STAGE 2 EVIDENCE COLLECTION** (decisions/DD-030, Case-Owner Decision section). **Authorizes preparation and intake of owner-supplied, redacted evidence for BE-01–BE-08 only**, exactly as defined in the readiness-reviewed specification — **not** unrestricted Stage 2 execution; the intake and its classification must remain a bounded round followed by an independent classification gate, mirroring Stage 1's own decisions/DD-026→DD-027/DD-028 pattern.

**Two condition sets recorded verbatim, separately provenanced, neither merged nor renumbered:**

- **Set A** — all nine decisions/DD-029 binding conditions (CE-DQ4-A/B entanglement justification; Not Available for BE-02/BE-03; Insufficient Evidence pre-registered; BE classifications unmodified; G-01 routing table; G-05–G-09 rules; Gates 2–5 each separate; no credentials; all prior DD conditions binding).
- **Set B** — all seven decisions/DD-030 binding conditions (BE-07 Class 4/6 correction; CE-DQ4-C/E/F/G scope-boundary disclaimer; server-file-path redaction; no BE item Essential; phpMyAdmin Unsafe; all prior conditions binding; no auto-authorization of Stage 2/Design/Transformation/external changes).

**Seventeen additional binding conditions, new to this decision:** collection restricted to BE-01–BE-08 exactly as specified; collection mode remains Owner-Supplied Redacted Evidence Only; no BE item Essential; missing/unavailable evidence never encoded as zero/absent/disabled/healthy/disproven; phpMyAdmin remains Unsafe Without New Authorization; no SQL/database-browsing/profiler/debug-mode/plugin-installation/configuration-change/server-mutation; no direct authenticated access by any agent; no passwords/keys/tokens/cookies/sessions/customer information/reservation content/raw IPs/internal server paths/unrelated domain-account data may enter the repository; evidence must arrive already cropped/redacted/aggregated; CrUX/lab/public-timing/restricted-backend/Owner-Declaration/provider-attested evidence stay separately classified; configured state stays separate from delivered state; account-level evidence must not be applied to konnichiwa.nl without domain-specific support; collection may assess CE-DQ4-A/B only, never CE-DQ4-C/E/F/G; no new public HTTP probing; no new provider-support request; no outcome may auto-establish a diagnosis/Design/technical intervention/Transformation/external change; material contradiction or scope expansion requires an immediate stop and a new case-owner decision.

```yaml
od_002_stage_2_specification_status: Approved With Conditions — Bounded Evidence Collection Authorized
od_002_stage_2_evidence_collection_authorized: true
od_002_stage_2_evidence_collection_decision: Approved With Conditions
od_002_stage_2_collection_mode: Owner-Supplied Redacted Evidence Only
od_002_stage_2_direct_authenticated_access_authorized: false
od_002_stage_2_collection_started: false
od_002_stage_2_authorized: false
od_002_design_established: false
transformation_authorized: false
external_changes_authorized: false
```

**Next action:** prepare a bounded BE-01–BE-08 Evidence Intake request/package under this decision — not created by this decision; evidence collection does not begin until that intake task is separately started. Stage 1's CS-4 classification and the domain-specific Varnish Unconfirmed/Unconfirmed state remain preserved without reinterpretation. No evidence was collected; no hosting, WordPress, DirectAdmin, database, or CDN system was accessed; nothing was committed or pushed.

## Stage 2 Evidence Intake Request Package Prepared (13 August 2026)

Under decisions/DD-030's Case-Owner Decision, design/OD2-CAND-2-stage-2-evidence-intake-request.md was prepared — a checklist/request package only, not a collection task. All eighteen preconditions passed.

**Owner instructions (Section 1, plain Dutch):** supply only already-existing, accessible evidence; take screenshots/exports personally; crop/redact before uploading; "niet beschikbaar" is always a valid answer; never enable logging/profiling/debugging/monitoring, install plugins, run SQL/PHP, contact support for new evidence, or run new public probes; supplying evidence does not authorize implementation. An explicit stop-warning covers any screen exposing credentials, tokens, customer/reservation data, raw IPs, server paths, or unrelated account data.

**BE-01–BE-08 request cards (Section 2):** one independently-usable card per item, each carrying forward its exact identifier, definition, and decisions/DD-030 readiness classification unmodified — BE-01/BE-04/BE-08 **Ready**; BE-02/BE-03/BE-05/BE-06/BE-07 **Ready With Conditions**. BE-03's card states "phpMyAdmin: Unsafe Without New Authorization" prominently, with no navigation instructions, database screenshot request, or SQL/table/schema content anywhere. BE-02 excludes any profiler/debug-mode request. BE-05 preserves its aggregation-verification condition; BE-06 its low-yield/BE-08-overlap limitation; BE-07 explicitly excludes a new support-ticket request.

**Priority bands (Section 3, non-mandatory):** Priority 1 (BE-02, BE-03 — safe and potentially discriminating); Priority 2 (BE-01, BE-04, BE-05, BE-06, BE-07, BE-08 — useful only if already available); Do Not Collect Under Current Authorization (phpMyAdmin, credentials, profiling/debugging, raw logs, customer data, configuration changes, new support requests). **No item marked Essential.**

**Sections 4–8:** a sixteen-item redaction checklist; a blank submission-manifest template (no EV/O/OC/OD/CSE identifier created); an owner-response template with a required, explicitly-non-system-evidence declaration; an eleven-step future intake/classification process described but not executed, stating that no submitted file proves backend delay, no missing file proves health or absence, and no result auto-starts Stage 2/establishes Design/authorizes Transformation; and a restatement that decisions/DD-030 already authorizes bounded intake preparation and later collection, but that this task itself does not start collection.

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

**Next action:** Kelvin supplies any available, redacted BE-01–BE-08 evidence or records Not Available/Unknown; no direct agent access. Stage 1's CS-4 classification and the domain-specific Varnish Unconfirmed/Unconfirmed state remain unchanged. No evidence file was created or copied; no evidence ID was assigned; no observation, claim, diagnosis, or classification gate was created; no hosting, WordPress, DirectAdmin, database, or CDN system was accessed; nothing was committed or pushed.

## OD2-CAND-2 Evidence Round 1 (13 August 2026)

Under decisions/DD-030's approved bounded collection scope, Kelvin supplied five owner-captured DirectAdmin screenshots — Resource Usage (Dashboard, Current Usage, Snapshot, Options tabs) and Select PHP Version — recorded in design/EC-002-OD2-CAND-2-Evidence-Intake.md, Round 1. Full privacy review, input manifest, visible-fact extraction, BE mapping, evidence-class/scope summary, and independent challenge performed. **Result: BE-01, BE-02, and BE-04 = Not Available (no usable performance figure on any inspected screen); BE-03, BE-05, BE-06, BE-07, BE-08 = Not Supplied.** Explicitly preserved throughout: "no issues"/"NO RESULT FOUND"/"no snapshots" never encoded as zero or negative findings; PHP version/extension state and Xdebug-unchecked treated as configuration context only, never as performance or backend-health evidence; BE-01/BE-04 kept account-wide, never applied to konnichiwa.nl by assumption. No system was accessed by Claude directly — Kelvin captured and supplied every screenshot personally.

## OD2-CAND-2 Evidence Round 1 Classification Gate — DD-031 (13 August 2026)

An independent gate (decisions/DD-031) reviewed Round 1 against design/OD2-CAND-2-origin-backend-evidence-observability-specification.md's pre-registered thresholds. All thirteen preconditions passed. The nine-criterion process review found **no factual error** — every conclusion in Round 1 is independently re-verified as correct; one precision note was added (BE-01/BE-04's account-wide framing rests on the specification's own tool definition, not on anything newly confirmed by these five images). All five inputs were reviewed individually against the task's own six preserved narrow interpretations, each re-confirmed intact.

**BE-01, BE-02, and BE-04 were independently reclassified from the intake's own "Not Available" to the gate's richer `Attempted — Data Not Available`** — the permitted sources were genuinely navigated, and nothing usable exists there at this account tier, rather than simply "not looked for." BE-03/05/06/07/08 remain Not Supplied. No BE item is Essential; phpMyAdmin remains unaffected, Unsafe Without New Authorization.

**Mechanism discrimination: Weak Context Only** — no distinguishing evidence for CE-DQ4-A (backend/application processing) was obtained; CE-DQ4-B (cache-layer delivery) was not addressed this round at all. **Stage 1's own cache classification (decisions/DD-028) is unaffected.**

**Round classification, applying the specification's exact Phase 7 thresholds:** none of Backend Signal Confirmed, Backend Signal Not Found, Cache/Backend Entangled, or Contradictory Evidence is met — **Evidence Insufficient** is precisely met (all attempted BE items resolve to Not Available; nothing else was obtained).

**Fourteen-item independent challenge:** thirteen Survive cleanly; one (account-level evidence treated as domain-specific) Survives with Narrowing, addressed by precision rather than correction. No attack Rejected; no bounded correction to Round 1's own content was required — only a status notice was added pointing to this gate.

**Gate Review Verdict: PASSED WITH CONDITIONS. Evidence Classification: Evidence Insufficient** — recorded separately, per this gate's own explicit discipline; this gate does not self-authorize the result. Eight binding conditions recorded.

```yaml
od_002_stage_2_collection_started: true
od_002_stage_2_evidence_received: true
od_002_stage_2_evidence_round: 1
od_002_stage_2_evidence_classified: true
od_002_stage_2_round_1_gate: DD-031 — Passed With Conditions
od_002_stage_2_round_1_classification: Evidence Insufficient
od_002_stage_2_round_1_acceptance_decision: Pending
od_002_stage_2_authorized: false
od_002_design_established: false
transformation_authorized: false
external_changes_authorized: false
```

Requested response (first pass): `ACCEPT CLASSIFICATION` / `ACCEPT CLASSIFICATION WITH CONDITIONS` / `REJECT CLASSIFICATION`. No evidence was collected by this gate; no hosting, WordPress, DirectAdmin, database, or CDN system was accessed. **Answered below** (Case-Owner Decision, same date) — this section remains unedited as the historical basis for that decision.

## OD2-CAND-2 Round 1 Evidence Insufficient Accepted — DD-031 Case-Owner Decision (13 August 2026)

Kelvin Wong, case owner, issued **ACCEPT CLASSIFICATION WITH CONDITIONS** (decisions/DD-031, Case-Owner Decision section), subject to twenty binding conditions recorded verbatim there — layering on top of, not replacing, this gate's own eight conditions and all prior DD-018/DD-022/DD-025/DD-026/DD-027/DD-028/DD-029/DD-030 conditions, all independently binding.

**Key conditions:** process verdict stays PASSED WITH CONDITIONS; Round 1's classification stays Evidence Insufficient; each of the six narrow interpretations (no-issues banner, "NO RESULT FOUND," no-snapshots, PHP configuration context, Xdebug-unchecked) stays exactly as recorded; BE-01/BE-02/BE-04 stay Attempted — Data Not Available; BE-03/05/06/07/08 stay Not Supplied; no BE item Essential; phpMyAdmin stays Unsafe Without New Authorization; no finding establishes backend health, delay, or the TTFB cause; unavailable evidence may not support or reject OD-002; account-level evidence must never be presented as domain-specific for konnichiwa.nl; Stage 1 CS-4 and Host/Varnish Unconfirmed/Unconfirmed stay unchanged; further collection stays limited to the existing BE-01–BE-08 scope, requiring a new explicit case-owner instruction; no direct access/profiling/debugging/SQL/PHP execution/plugin installation/configuration change/support request/public probe is authorized; no diagnosis/Design/technical intervention/business benefit follows; Stage 2 execution/Transformation/external changes remain unauthorized.

```yaml
od_002_stage_2_round_1_acceptance_decision: Accepted With Conditions
od_002_stage_2_round_1_status: Completed — Evidence Insufficient
od_002_stage_2_additional_evidence_status: Not Started — Requires Explicit Case-Owner Instruction
od_002_stage_2_authorized: false
od_002_design_established: false
transformation_authorized: false
external_changes_authorized: false
```

**This acceptance closes Round 1 only** — Stage 2 as a whole is not closed, and a future Round 2 remains possible under separate, later authorization. **Next action:** case owner decides later whether to supply additional existing evidence within BE-01–BE-08 or proceed to an OD-002 Design establishment review with the evidence limitations preserved — neither path is selected by this decision. No new evidence was collected; no hosting, WordPress, DirectAdmin, database, or CDN system was accessed; no Round 2 was created; nothing was committed or pushed.

## OD-002 Design Establishment Gate — DD-032 (13 August 2026)

An independent gate (decisions/DD-032) assessed whether OD-002's Organizational Design may be established, given OD2-CAND-3 Stage 1's completed CS-4 (decisions/DD-028) and OD2-CAND-2 Stage 2 Round 1's completed Evidence Insufficient (decisions/DD-031). All twenty preconditions passed.

**Foundation inventory (Part 1):** eleven authoritative artifacts reviewed, explicitly excluding superseded wording — OD-002's own pre-narrowing body text, design/EC-002-OD2-CAND-3-Evidence-Intake.md Round 2's "Confirmed Disabled" Varnish reading (superseded by decisions/DD-027/DD-028), and design/EC-002-OD2-CAND-2-Evidence-Intake.md's own simpler "Not Available" labels (superseded by decisions/DD-031's "Attempted — Data Not Available").

**Candidate Design statement (Part 2):** a bounded, non-prescriptive measurement-and-observability Design targeting the 26% CrUX poor-mobile-TTFB share, explicitly **not** establishing caching absence, Varnish activity, backend slowness, the TTFB tail's cause, any required intervention, any hosting/WordPress/PHP/database/code change, or any ranking/conversion/revenue/reservation benefit.

**Candidate completion review (Part 3):** both OD2-CAND-3 and OD2-CAND-2's Design-stage functions are complete — each made a genuine, case-owner-accepted evidence attempt reaching a legitimate Insufficient-Evidence terminus; neither requires further evidence for establishment; remaining unknowns (domain-specific Varnish state; CE-DQ4-A's own status) belong to a future Transformation-feasibility check or renewed Diagnosis, not to blocking establishment now.

**Requirement and assumption review (Parts 4–5):** all seventeen OD2-REQ items reviewed, no failures (five Conditional Pass, each future-facing and untested rather than violated — notably REQ-010, since CE-DQ4-C/E/F/G were never addressed by either executed candidate). All nine OD2-AS items reviewed, none promoted from Needs More Evidence/Unassessed/Unassessable/Aging to fact — OD2-AS-008 (CrUX baseline staleness) flagged as materially more pressing after three further weeks elapsed; OD2-AS-007 refined (read-only methods resolve some questions, not backend timing) without promotion.

**Establishment criteria (Part 6):** a twenty-item G-01–G-20 matrix found no failures — three Pass With Conditions (Stage 1/Stage 2 completion integrity; measurement/observability completeness, since only the Restricted evidence layer was ever actually exercised).

**Transformation boundary (Part 7):** Design establishment, Transformation authorization, implementation-candidate construction, technical feasibility investigation, and production/external authorization kept strictly separate — none follows automatically from another.

**Independent challenge (Part 8):** eighteen attacks tested — **all eighteen Survive, none Rejected, none requiring narrowing** — the precision needed to withstand each was already built into Parts 2, 3, and 7, not added as a correction afterward.

### Gate Verdict and Recommendation

**Gate Verdict: PASSED WITH CONDITIONS. Recommendation: RECOMMEND ESTABLISHED WITH CONDITIONS.** This recommendation is explicitly **not** the case-owner decision. One sole authoritative Design statement is provided, Confidence: **Medium-Low** (inherits OD-002's own Medium cap, narrowed further by two independently-accepted Insufficient-Evidence stages and four never-addressed mechanisms). Ten binding conditions recorded, including: the domain-specific Varnish state and CE-DQ4-A's own status remain exactly as recorded; CE-DQ4-C/E/F/G remain entirely untested; the CrUX baseline must be refreshed before any future evaluation; further BE-01–BE-08 collection requires a new explicit case-owner instruction; any future technical direction requires a new implementation candidate with its own feasibility/rollback plan; Transformation and external changes remain unauthorized regardless of Kelvin's response; no business-outcome benefit may ever be inferred; all prior DD-018 through DD-031 conditions remain independently binding; OD-001 Candidate D and OD-003 remain unaffected.

```yaml
current_stage: Organizational Design
od_002_design_establishment_gate: DD-032 — Passed With Conditions
od_002_design_establishment_recommendation: Recommend Established With Conditions
od_002_design_establishment_decision: Pending
od_002_design_established: false
od_002_stage_2_round_1_status: Completed — Evidence Insufficient
od_002_stage_2_additional_evidence_status: Not Started — Requires Explicit Case-Owner Instruction
transformation_authorized: false
external_changes_authorized: false
```

Requested response: `ESTABLISHED` / `ESTABLISHED WITH CONDITIONS` / `NOT ESTABLISHED` — pending; no response may be read as authorizing Transformation, external changes, or any technical intervention. decisions/DD-028, DD-030, and DD-031 were not modified. No further evidence was collected; no Round 2, implementation candidate, or Transformation gate was created; no hosting, WordPress, DirectAdmin, database, or CDN system was accessed; nothing was committed or pushed.

## OD-002 Design Established — DD-032 Case-Owner Decision (13 August 2026)

Kelvin Wong, case owner, issued **ESTABLISHED WITH CONDITIONS** (decisions/DD-032, Case-Owner Decision section, recorded 13 August 2026). **OD-002 now has an Established Organizational Design (Conditional)** — Status: Established Organizational Design; Establishment: Conditional; Authority: decisions/DD-032 Case-Owner Decision; Confidence: Medium-Low. The sole authoritative Design statement is decisions/DD-032's own (Part 9), preserved verbatim there: a bounded, non-prescriptive measurement-and-observability Design targeting the 26% CrUX poor-mobile-TTFB share, explicitly not establishing caching absence, Varnish activity, backend slowness, the TTFB tail's cause, any required intervention, or any ranking/conversion/revenue/reservation benefit. No stronger alternative formulation is, or may become, authoritative.

A **Pre-Decision Consistency Check** preceded the decision: DD-032's existing wording ("not addressed" / "never addressed" / "never exercised" / "never tested" for CE-DQ4-C/E/F/G) was found already semantically consistent with "uninvestigated" — DD-032 never states these mechanisms "remain investigated." **No bounded correction to DD-032's preserved history was necessary.** The phrase **"CE-DQ4-C/E/F/G remain uninvestigated"** is adopted as the canonical active wording going forward.

**Ten original binding conditions** (copied verbatim from decisions/DD-032 Part 9) apply unchanged, including: the domain-specific Varnish state and CE-DQ4-A's own status remain exactly as recorded; CE-DQ4-C/E/F/G remain entirely untested; the CrUX baseline must be refreshed before any future evaluation; further BE-01–BE-08 collection requires a new explicit case-owner instruction; any future technical direction requires a new implementation candidate with its own feasibility/rollback plan; Transformation and external changes remain unauthorized regardless of this decision; no business-outcome benefit may ever be inferred; all prior DD-018 through DD-031 conditions remain independently binding; OD-001 Candidate D and OD-003 remain unaffected.

**Sixteen additional confirmed boundaries**, new to this Case-Owner Decision and recorded separately from — not merged with — the ten original conditions, confirm: Stage 1 closed at CS-4; Host/Varnish layer stays Unconfirmed/Unconfirmed; Stage 2 Round 1 stays Evidence Insufficient; all BE-01–BE-08 classifications stay exactly as recorded; CE-DQ4-C/E/F/G remain uninvestigated (canonical wording, above); no OD2-AS assumption is promoted to fact; the CrUX baseline refresh requirement stands; "no measurable change" remains a valid future outcome; this establishment proves neither caching absence, Varnish activity, backend slowness, nor the TTFB cause; no cache, CDN, hosting, PHP, database, WordPress, or code intervention is selected; any future technical direction requires a new implementation candidate; any further evidence collection requires a new explicit case-owner instruction; no ranking, conversion, revenue, or reservation benefit is claimed; Transformation and external/production changes remain unauthorized.

```yaml
current_stage: Organizational Design
od_002_design_establishment_gate: DD-032 — Passed With Conditions
od_002_design_establishment_recommendation: Recommend Established With Conditions
od_002_design_establishment_decision: Established With Conditions
od_002_design_established: true
od_002_design_establishment: Conditional
od_002_design_authority: DD-032 Case-Owner Decision
od_002_design_confidence: Medium-Low
od_002_stage_2_round_1_status: Completed — Evidence Insufficient
od_002_stage_2_additional_evidence_status: Not Started — Requires Explicit Case-Owner Instruction
transformation_authorized: false
external_changes_authorized: false
```

**Next action:** prepare an independent Transformation Authorization Readiness Gate for the established OD-002 Design only if explicitly instructed by the case owner; do not create an implementation candidate or Transformation gate in this task. decisions/DD-028, DD-030, and DD-031 were not modified by this decision; no other file besides decisions/DD-032, design/OD-002-design-workstream.md, design/README.md, current.md, and this file was modified. No new evidence was collected; no external or authenticated system was accessed; nothing was committed or pushed by this decision.

## OD-002 Transformation Authorization Readiness Gate — DD-033 (13 August 2026)

An independent gate (decisions/DD-033) assessed whether the established OD-002 Design (decisions/DD-032, ESTABLISHED WITH CONDITIONS) is ready to enter a bounded Transformation preparation phase. All twenty-four preconditions passed.

**Foundation inventory (Part 1):** fourteen artifacts reviewed — the diagnosis, DD-018, DD-022, the design workstream, DD-025 through DD-032, current.md, and this file — each recorded with authority, status, contribution, active limitation, condition carried forward, and whether it supports or restricts future candidate construction. Superseded wording (OD-002's pre-narrowing text; the two evidence-intake files' superseded labels) excluded, matching DD-032's own exclusion list.

**Transformation entry definition (Part 2):** the only potentially authorizable activity is bounded construction, falsification, and comparison of implementation candidates — explicitly not authorization to implement one. Seven states (preparation authorized → candidate construction started → candidate selected → feasibility authorized → production change authorized → implementation executed → outcome evaluated) kept strictly separate; only the first two are reachable from this gate's most expansive recommendation.

**Transformation question (Part 3):** what reversible implementation approaches, including a credible no-change option, could operationalize the established Design without assuming a cache, backend, hosting, PHP, database, WordPress, or code mechanism the case has not established — preserving no-change, Evidence Insufficient, mechanism uncertainty, Medium-Low confidence, and the absence of any business-outcome promise.

**Readiness dimensions (Part 4):** twenty dimensions (T-01–T-20) reviewed — zero failures, eighteen PASS, two CONDITIONAL PASS (T-09, feasibility evaluable without production mutation only at a descriptive level; T-20, operational usefulness — a genuine, disclosed judgment call given two Insufficient-Evidence stages, not a defect).

**Candidate classes (Part 5):** six classes identified — no-change/measurement-continuation, observability-only, cache-delivery verification/feasibility, backend/origin observability/feasibility, hosting/platform alternative, combined staged approach — each with its addressed uncertainty, forbidden assumption, access dependency, reversibility concern, and renewed-diagnosis/feasibility-authorization flags recorded. None constructed, selected, or recommended.

**Mandatory future candidate requirements (Part 6):** twenty minimum conditions set (identifier, problem boundary, linked requirement, assumptions, evidence, mechanism claimed, falsification criteria, measurement plan, privacy/security assessment, required access classified per Part 7, external-change classification, reversibility, rollback plan defined at construction time, failure/stop conditions, feasibility dependencies named not executed, expected outcome without numerical guarantee, excluded business claims, no-change comparison, independent attack, no implementation before a later gate).

**Evidence and access boundary (Part 7):** repository-only work (naming candidates, assumptions, falsification criteria, measurement/observability/privacy/rollback/stop-condition drafting, no-change comparison, independent-attack table) requires no new authorization; direct authenticated access, credentials, customer/reservation data, raw IPs, internal server paths, phpMyAdmin/database inspection, SQL/PHP execution, profiling/debugging, plugin installation, any configuration change, cache purge, provider-support contact, additional public probing, and any production mutation all remain unauthorized without a separate future gate.

**Transformation risk review (Part 8):** fifteen risks assessed (premature caching-absence/Varnish-active/backend-slow conclusions, intuitive cache selection, hosting migration without evidence, PHP-version-as-performance-finding, "no issues" as backend-health evidence, Evidence-Insufficient-as-license-to-experiment, production-change smuggling, privacy weakening, feasibility/implementation conflation, numerical performance promises, SEO/commercial claims, diagnosis-bypass, OD-001/OD-003 contamination) — none blocks authorization; each contained by a carried-forward or newly added condition.

**Independent challenge (Part 9):** twenty attacks tested — eighteen Survive outright; two Survive with Narrowing (Attack 7: CE-DQ4-C/E/F/G must not be silently foreclosed forever, resolved by new Condition 12; Attack 15: candidate construction must pause for a lifecycle decision if it surfaces a need for new Diagnosis, resolved by new Condition 13, mirroring decisions/DD-025 Condition 6). No rejection; no correction to any preserved prior text was required.

**Authorization granularity (Part 10):** Level 0 (Not Ready) through Level 5 (Production Change) assessed separately; Level 3–5 explicitly not available from this gate. **Recommended level: 1 — Candidate Construction Only** (repository-only construction, falsification, and comparison; no external access, feasibility execution, selection, implementation, or change).

### Gate Verdict and Recommendation

**Gate Verdict: PASSED WITH CONDITIONS. Recommendation: RECOMMEND AUTHORIZED WITH CONDITIONS FOR CANDIDATE CONSTRUCTION ONLY.** This recommendation is explicitly **not** the case-owner decision. Fifteen binding conditions recorded, including: authorization is strictly Level 1; every future candidate must satisfy all twenty Part 6 requirements; no candidate class is preferred or selected by this gate; the no-change candidate must be constructed with equal rigor; the sole OD-002 Design statement and Medium-Low confidence remain unchanged; Stage 1 CS-4, Host/Varnish Unconfirmed/Unconfirmed, and Stage 2 Round 1 Evidence Insufficient remain exactly as recorded; CE-DQ4-A remains unresolved; no ranking/conversion/revenue/reservation claim; `transformation_authorized`/`external_changes_authorized` remain `false` regardless of Kelvin's response; OD-001 Candidate D and OD-003 remain unaffected; CE-DQ4-C/E/F/G remain eligible for future work, not foreclosed; a new-diagnosis pause rule applies; all prior DD-018 through DD-032 conditions remain independently binding; any move beyond Level 1 requires a new, separate, explicit gate and decision.

```yaml
current_stage: Organizational Design
od_002_transformation_readiness_gate: DD-033 — Passed With Conditions
od_002_transformation_readiness_recommendation: Recommend Authorized With Conditions For Candidate Construction Only
od_002_transformation_preparation_decision: Pending
od_002_implementation_candidate_construction_authorized: false
od_002_implementation_candidate_construction_started: false
transformation_authorized: false
external_changes_authorized: false
```

Requested response: `AUTHORIZED FOR IMPLEMENTATION-CANDIDATE CONSTRUCTION ONLY` / `AUTHORIZED WITH CONDITIONS FOR IMPLEMENTATION-CANDIDATE CONSTRUCTION ONLY` / `NOT AUTHORIZED FOR TRANSFORMATION PREPARATION` — pending; no response may be read as authorizing implementation, feasibility execution, production changes, or any technical intervention. No design artifact and no decisions/DD-018 through DD-032 file was modified. No implementation candidate, Transformation workstream, or new evidence file was created; no hosting, WordPress, DirectAdmin, database, or CDN system was accessed; nothing was committed or pushed.

## Candidate Construction Authorized — DD-033 Case-Owner Decision (13 August 2026)

Kelvin Wong, case owner, issued **AUTHORIZED WITH CONDITIONS FOR IMPLEMENTATION-CANDIDATE CONSTRUCTION ONLY** (decisions/DD-033, Case-Owner Decision section). **Authorized Level: Level 1 — Candidate Construction Only** — repository-only construction, falsification, and comparison of multiple implementation candidates derived exclusively from the established OD-002 Design. Explicitly not authorized: candidate selection, feasibility execution, authenticated access, evidence collection, implementation, deployment, production changes, Transformation execution, external changes.

**Condition sets:** Set A — the fifteen DD-033 Transformation Readiness Gate conditions (Part 11), copied verbatim. Set B — twenty-two new decision-specific boundaries, kept separately provenanced: authorization limited to Level 1; every candidate must satisfy all twenty DD-033 Part 6 requirements; at least three materially different candidates required, including a credible no-change candidate held to equal rigor; DD-033's candidate classes remain possibilities only, none selected or preferred; no candidate may assume caching absent, Varnish active, or backend slowness/the TTFB cause; Stage 1 CS-4, Host/Varnish Unconfirmed/Unconfirmed, Stage 2 Round 1 Evidence Insufficient, CE-DQ4-A unresolved, and CE-DQ4-C/E/F/G uninvestigated all preserved unchanged; the OD-002 Design statement and Medium-Low confidence remain unchanged; any candidate dependency on external access, credentials, evidence collection, profiling, debugging, SQL/PHP execution, plugin installation, provider contact, or configuration change must be recorded as blocked — identifying it does not authorize satisfying it; a new-diagnosis pause rule applies if construction exposes materially new diagnosis-relevant evidence or contradicts OD-002; no numerical performance guarantee; no ranking/conversion/revenue/reservation claim; no candidate may be implemented, tested in production, or selected without a separate gate and explicit case-owner decision; OD-001 Candidate D and OD-003 remain outside this authorization; `transformation_authorized` and `external_changes_authorized` remain `false`.

```yaml
current_stage: Organizational Design
od_002_transformation_readiness_gate: DD-033 — Passed With Conditions
od_002_transformation_readiness_recommendation: Recommend Authorized With Conditions For Candidate Construction Only
od_002_transformation_preparation_decision: Authorized With Conditions — Candidate Construction Only
od_002_transformation_authorized_level: Level 1 — Candidate Construction Only
od_002_implementation_candidate_construction_authorized: true
od_002_implementation_candidate_construction_started: false
od_002_candidate_selection_authorized: false
od_002_feasibility_execution_authorized: false
od_002_implementation_authorized: false
transformation_authorized: false
external_changes_authorized: false
```

**This decision authorizes Transformation preparation only — it does not authorize Organizational Transformation execution**, under any circumstance. **Next action:** create a bounded OD-002 Implementation Candidate Construction Workstream containing at least three materially different candidates, including a credible no-change candidate — **not constructed by this decision-recording task.** No candidate or workstream was created; no evidence was collected; no hosting, WordPress, DirectAdmin, database, or CDN system was accessed; nothing was committed or pushed.

## OD-002 Implementation Candidate Construction Workstream (13 August 2026)

Under decisions/DD-033's Level 1 authorization, transformation/OD-002-implementation-candidate-construction-workstream.md was constructed — bounded, repository-only construction, falsification, and comparison of implementation candidates. No candidate selected; no readiness gate created; no feasibility work performed; no evidence collected; no external or authenticated system accessed.

**Phase 1 (Authority and Boundaries):** all four condition/boundary sets carried forward without merging or weakening — DD-033 Set A (fifteen), DD-033 Set B (twenty-two), DD-032's ten establishment conditions, DD-032's sixteen additional boundaries.

**Phase 2 (Problem Boundary):** eight non-assumptions recorded — no candidate may assume caching absent, Varnish active, backend slow, backend caused the tail, PHP 8.4 as a performance result, "no issues" as backend health, a technical intervention required, or performance implying SEO/business benefit.

**Phase 3 (ICR-001–ICR-020):** twenty mandatory construction requirements registered, mapped directly to decisions/DD-033 Part 6, before any candidate was constructed.

**Phase 4/5 (Candidate Set):** five materially different candidates constructed, each satisfying all twenty ICR requirements in full — **IC-OD2-001** (No-Change/Measurement Continuation — the no-change comparator itself, refreshing the aging CrUX baseline only); **IC-OD2-002** (Observability-Only Preparation — mechanism-neutral instrumentation, log/monitoring access named Blocked); **IC-OD2-003** (Cache-Delivery Verification/Feasibility Preparation — reuses decisions/DD-026's Configured/Delivered-State model, does not assume Varnish active or caching absent); **IC-OD2-004** (Backend/Origin Feasibility Preparation — excludes phpMyAdmin/SQL/PHP/profiling/logs entirely, does not assume backend delay); **IC-OD2-005** (Combined Staged Verification — sequences the other candidates with explicit per-stage gating and "no automatic escalation"). No hosting migration, CDN activation, cache-plugin installation, or code-optimization candidate was constructed as an assumed solution.

**Phase 6 (Assumption Registers):** nineteen candidate-specific assumptions across the five candidates, each classified Established/Supported/Weakly Supported/Needs More Evidence/Unassessed/Unassessable/Contradicted — none promoted beyond what its evidence supports; one (Stage 2 Round 1 read as backend-health evidence) explicitly marked **Contradicted** per decisions/DD-031. All nine topics required by this task (Varnish status, delivered cache state, backend contribution, CrUX freshness, page-mix, network effects, time/load variability, safe-observability availability, no-change acceptability) covered across the set.

**Phase 7 (Falsification and Attack):** twenty dimensions applied independently to all five candidates (100 attacks total) — 96 Survive outright, 4 Survive with Narrowing (each resolved directly within the affected candidate's own fields, no deletion), **zero Rejected**.

**Phase 8 (Comparative Evaluation):** qualitative matrix across twelve dimensions for all five candidates — **no winner chosen, no candidate recommended, no ranking**. Unresolved trade-offs stated explicitly, including that CE-DQ4-C/E/F/G remain outside every candidate's scope — a disclosed gap, not an oversight, consistent with decisions/DD-032 Additional Boundary 7 and decisions/DD-033 Set A Condition 12.

**Phase 9 (Whole-Workstream Challenge):** twelve items tested — eleven Survive outright, one Survives with Narrowing (CE-DQ4-C/E/F/G's absence from every candidate, resolved by the explicit Phase 8 disclosure), **zero Rejected**.

**Phase 10 (Conclusion):** all five candidates remain **Candidate — Unselected**. Candidate construction completed. Independent Candidate Readiness Gate required. Candidate selection remains unauthorized. No feasibility work, implementation, Transformation execution, or external change has been authorized or performed.

```yaml
current_stage: Organizational Design
od_002_implementation_candidate_construction_authorized: true
od_002_implementation_candidate_construction_started: true
od_002_implementation_candidate_construction_status: Completed — Independent Review Pending
od_002_implementation_candidate_set_created: true
od_002_implementation_candidate_selection_authorized: false
od_002_implementation_candidate_selection_decision: Not Requested
od_002_feasibility_execution_authorized: false
od_002_implementation_authorized: false
transformation_authorized: false
external_changes_authorized: false
```

**Next action:** perform an independent Candidate Readiness Gate for the OD-002 implementation candidate set; do not select a candidate in the construction task — none is created by this task. No commit or push occurred.

## OD-002 Implementation Candidate Readiness Gate (14 August 2026)

decisions/DD-034 independently reviewed the already-existing, uncommitted transformation/OD-002-implementation-candidate-construction-workstream.md — the workstream was not reconstructed or replaced. All twenty-two preconditions passed, including the expected dirty-tree state.

**Part 1 (Authority/Scope):** confirmed Level 1 boundary maintained, Design-derivation correct, Medium-Low confidence preserved, all four DD-032/DD-033 condition sets carried correctly.

**Part 2 (ICR-001–ICR-020):** nineteen requirements PASS; ICR-013 (rollback plan, defined at construction time) CONDITIONAL PASS — IC-OD2-003 (feasibility-test sub-class), IC-OD2-004, and IC-OD2-005 (Stage 3) each state their rollback plan is "explicitly deferred as a precondition," which literally matches ICR-013's own failure condition for those sub-paths. The register itself was independently judged to genuinely precede candidate construction (generic, non-candidate-specific wording).

**Part 3 (Candidate Inventory):** IC-OD2-001 and IC-OD2-002 assessed **Ready for Case-Owner Consideration**; IC-OD2-003, IC-OD2-004, and IC-OD2-005 assessed **Ready With Conditions**, tied to the ICR-013 finding. None Rejected — a more differentiated result than the workstream's own uniform "Candidate — Unselected" status.

**Part 4 (Material Diversity):** all five candidates independently confirmed materially distinct, each with its own future decision consequence; IC-OD2-005's distinction from IC-OD2-003 is the narrowest of the five, consistent with — not contradicting — the workstream's own Phase 8 disclosure.

**Part 5 (Assumption Register):** all nineteen candidate-specific assumptions independently reviewed; the one Contradicted assumption (Stage 2 Round 1 as backend-health evidence, decisions/DD-031) confirmed correctly isolated and never reintroduced.

**Part 6 (Falsification):** all 100 reported attacks independently re-derived (not sampled) — 96 Survive/4 Survive with Narrowing/0 Rejected confirmed accurate; all four reported narrowings verified present in the active candidate text. One additional narrowing found independently (Attack 16, rollback specificity for IC-OD2-003/004/005), tied to the same ICR-013 finding.

**Part 7 (No-Change Review):** IC-OD2-001 independently confirmed genuinely non-symbolic under heightened scrutiny.

**Part 8 (Comparative Neutrality):** no preference-leakage found in Phase 8's qualitative comparison.

**Part 9 (Lifecycle/Safety):** confirmed by direct text search — no candidate selection, feasibility execution, authenticated access, evidence collection, profiling/debugging, SQL/PHP/database inspection, plugin installation, configuration change, or production/implementation language anywhere in the workstream.

**Part 10 (Independent Challenge):** twenty-four items tested — twenty Survive outright, four Survive with Narrowing, zero Rejected. Attack 14 (rollback impossible before mechanism is known) is the one genuinely new defect this gate surfaces, resolved by a new binding condition.

**Part 11 (G-01–G-20):** eighteen PASS, two CONDITIONAL PASS (G-04, G-14, both tied to the single ICR-013 finding), zero FAIL.

**Part 12 (Gate Verdict):** **PASSED WITH CONDITIONS. Recommendation: RECOMMEND ELIGIBLE WITH CONDITIONS FOR CASE-OWNER SELECTION** — ten binding conditions, including a new condition requiring any future proposal naming a specific technical mechanism under IC-OD2-003's feasibility-test sub-class, IC-OD2-004, or IC-OD2-005's Stage 3 to define a concrete, mechanism-specific rollback plan at that proposal's own construction time before it could pass a future feasibility-readiness gate.

```yaml
current_stage: Organizational Design
od_002_implementation_candidate_readiness_gate: DD-034 — Passed With Conditions
od_002_implementation_candidate_readiness_recommendation: Recommend Eligible With Conditions For Case-Owner Selection
od_002_implementation_candidate_construction_status: Completed — Independently Reviewed, Selection Decision Pending
od_002_implementation_candidate_selection_authorized: false
od_002_implementation_candidate_selection_decision: Pending
od_002_feasibility_execution_authorized: false
od_002_implementation_authorized: false
transformation_authorized: false
external_changes_authorized: false
```

**No candidate was selected or ranked. The workstream's candidate content was not modified — the ICR-013 finding is contained by a binding condition, not a rewrite.** No evidence was collected; no external or authenticated system was accessed; no technical or production change occurred. **Next action:** Kelvin's explicit selection response (SELECT FOR FURTHER FEASIBILITY PREPARATION / SELECT STAGED COMBINATION FOR FURTHER FEASIBILITY PREPARATION / REQUEST FURTHER CANDIDATE ITERATION / DECLINE ALL CANDIDATES) — not recorded by this task. No commit or push occurred.

## OD-002 Implementation Candidate Case-Owner Selection (14 August 2026)

decisions/DD-034's Case-Owner Selection section: Kelvin Wong issued **SELECT STAGED COMBINATION FOR FURTHER FEASIBILITY PREPARATION** — Stage 1: IC-OD2-001 (No-Change / Measurement Continuation), **Selected — Stage 1, Execution Not Authorized**; Stage 2: IC-OD2-002 (Observability-Only Preparation), **Selected Conditionally — Stage 2 Pending Stage 1 Review**, eligible only after Stage 1 review confirms the measured mobile poor-TTFB condition remains materially present. IC-OD2-003, IC-OD2-004, and IC-OD2-005 remain **Retained — Unselected Alternative**; none is marked Established, Implemented, or Rejected.

**Rationale:** the 26% poor-mobile-TTFB baseline is aging; cache absence, domain-specific Varnish delivery, and backend delay all remain unestablished; Stage 1 (OD2-CAND-3) and Stage 2 (OD2-CAND-2) evidence attempts both ended in insufficient evidence (decisions/DD-028, DD-031); renewed like-for-like measurement therefore precedes additional mechanism preparation; observability preparation becomes relevant only if the condition remains materially present. This selection does not imply IC-OD2-001 or IC-OD2-002 is technically superior, and does not reject IC-OD2-003, IC-OD2-004, or IC-OD2-005.

All ten decisions/DD-034 gate conditions (Set A) were copied verbatim with their original provenance; twenty-two new selection-specific boundaries (Set B) were recorded separately — notably: Stage 1 is measurement continuation only and does not reopen OD-002 Diagnosis; the future protocol must be a separately prepared, like-for-like CrUX remeasurement preserving origin-level/mobile/TTFB/28-day aggregation; the existing 26% value stays historical baseline evidence; no invented numerical improvement threshold; "no measurable change" stays a valid Stage 1 outcome; a shifted share does not establish a cache or backend mechanism; Stage 1 execution and Stage 2 preparation each require their own separate readiness gate and explicit case-owner authorization; Stage 2 may prepare observability only — no monitoring/logging/profiling/debugging activation, no credentials/customer/reservation/IP/server-path data; IC-OD2-003/004/005 stay preserved as alternatives; the DD-034 ICR-013 rollback condition stays binding for any future use of them; no selection authorizes feasibility execution, implementation, or production testing; OD-002's Design statement and Medium-Low confidence stay unchanged; no ranking/conversion/revenue/reservation benefit permitted; OD-001 Candidate D stays separate from this TTFB-measurement protocol; `transformation_authorized`/`external_changes_authorized` stay `false`.

transformation/OD-002-implementation-candidate-construction-workstream.md received a status-only addendum ("Status Update — Case-Owner Staged Selection"), mirroring design/OD-002-design-workstream.md's own Case-Owner Staged Selection precedent — no precondition, requirement, candidate formulation, assumption register, attack, comparison, or challenge content in the workstream's own Phases 1–10 was altered. transformation/README.md updated with the same status.

```yaml
current_stage: Organizational Design
od_002_implementation_candidate_readiness_gate: DD-034 — Passed With Conditions
od_002_implementation_candidate_selection_decision: Staged Selection — IC-OD2-001 then Conditional IC-OD2-002
od_002_selected_stage_1_candidate: IC-OD2-001
od_002_stage_1_candidate_status: Selected — Execution Not Authorized
od_002_selected_stage_2_candidate: IC-OD2-002
od_002_stage_2_candidate_status: Selected Conditionally — Pending Stage 1 Review
od_002_candidate_selection_completed: true
od_002_stage_1_execution_authorized: false
od_002_stage_2_preparation_authorized: false
od_002_feasibility_execution_authorized: false
od_002_implementation_authorized: false
transformation_authorized: false
external_changes_authorized: false
```

**This selection names which candidates will be prepared further — it does not authorize preparing, executing, or accessing anything.** No protocol was created or executed; no CrUX data was retrieved; no feasibility work was performed; no evidence was collected; no external or authenticated system was accessed; no technical or production change occurred. **Next action:** prepare an IC-OD2-001 Like-for-Like CrUX Remeasurement Protocol Readiness Gate — not created by this task. No commit or push occurred.

## IC-OD2-001 CrUX Remeasurement Protocol Authorization Gate (14 August 2026)

decisions/DD-035 independently assessed whether preparation of an IC-OD2-001 Like-for-Like CrUX Remeasurement Protocol is authorized and methodologically ready — the protocol itself was not created; no CrUX/PageSpeed/Search Console system was accessed. All thirty preconditions passed.

**Part 1 (Authority Chain):** chained through observations/O-012.md, diagnosis/DQ-004-investigation.md, diagnosis/OD-002-absence-of-html-caching-layer.md, decisions/DD-018, design/OD-002-design-workstream.md, decisions/DD-032/DD-033/DD-034, and the candidate workstream, recording each artifact's exact authority, contribution, and limitation.

**Part 2 (Baseline Reconstruction):** the historical baseline reconstructed directly from O-012/EV-017 — origin-level, mobile, TTFB, 28-day rolling window, 24 Jun–21 Jul 2026, 26% poor, Core Web Vitals Passed, report generated 24 Jul 2026 06:19:15 via the PageSpeed interactive tool (two prior API attempts failed with HTTP 429). Eight unresolved-method fields registered without inferring any undocumented setting — TTFB percentile basis and PSI interface version classified Condition to Resolve; CrUX release cadence and timezone basis Non-Blocking Limitation; country/connection segmentation Structurally Unavailable; report reproducibility Condition to Resolve Before Execution.

**Part 3 (Like-for-Like Requirements):** all twenty requirements independently assessed Ready or Ready With Conditions.

**Part 4 (Window/Schedule):** no final measurement window selected. The only available reporting-lag data point (EV-017's own ~3-day window-end-to-generation gap) explicitly identified as a single observation, not a documented SLA, and not adopted as a rule — closing a genuine risk (Part 9 Attack 3) rather than silently assuming a lag.

**Part 5 (Outcome Pre-Registration):** the seven qualitative outcome categories found Ready; a new requirement added that "broadly stable" be labeled a measurement classification only, never a no-impact claim (Part 9 Attack 9); no numeric threshold approved.

**Part 6 (Confounder Register):** required in full, with absence of evidence recorded as Unknown, never "no change."

**Part 7 (Privacy/Access):** confirmed this gate itself performed no external or authenticated access.

**Part 8 (OD-001 Separation):** confirmed OD-001 Candidate D (Search Console, query themes, 61-day window, decisions/DD-023/DD-024) and IC-OD2-001 (CrUX, mobile TTFB, 28-day window) remain fully distinct in metric, source, window, and governing decision chain — neither may substitute for or classify the other.

**Part 9 (Independent Challenge):** twenty items tested — eighteen Survive outright, two Survive with Narrowing (reporting-lag single-data-point risk; stable-TTFB-as-no-problem risk), zero Rejected.

**Part 10 (G-01–G-20):** no failures — seventeen PASS, three CONDITIONAL PASS (G-03, G-05, G-06), all tied to the same disclosed baseline-reconstruction gaps.

**Part 11 (Gate Verdict):** **PASSED WITH CONDITIONS. Recommendation: RECOMMEND AUTHORIZED WITH CONDITIONS TO PREPARE CRUX REMEASUREMENT PROTOCOL** — fifteen binding conditions, including that no final window or numeric threshold may be set during preparation, that the unresolved-method-field register must be carried into the protocol unresolved, and that preparing the protocol never authorizes executing it.

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

**This recommendation is not authorization.** decisions/DD-034 and transformation/OD-002-implementation-candidate-construction-workstream.md were **not** modified. No protocol was created; no evidence was collected; no external or authenticated system was accessed; no technical or production change occurred. **Next action:** Kelvin's explicit response (AUTHORIZED TO PREPARE IC-OD2-001 CRUX REMEASUREMENT PROTOCOL / AUTHORIZED WITH CONDITIONS TO PREPARE IC-OD2-001 CRUX REMEASUREMENT PROTOCOL / NOT AUTHORIZED TO PREPARE PROTOCOL) — not recorded by this task. No commit or push occurred.

## IC-OD2-001 CrUX Remeasurement Protocol — Case-Owner Decision (14 August 2026)

decisions/DD-035's Case-Owner Decision section: Kelvin Wong issued **AUTHORIZED WITH CONDITIONS TO PREPARE IC-OD2-001 CRUX REMEASUREMENT PROTOCOL** — authorization limited to repository-only preparation of a like-for-like CrUX mobile TTFB remeasurement protocol; explicitly does not authorize PageSpeed/CrUX access, data retrieval, protocol execution, evidence creation, automated monitoring, Stage 2 preparation, feasibility execution, implementation, Transformation execution, or external changes.

All fifteen decisions/DD-035 gate conditions (Set A) were copied verbatim with their original provenance; thirty-two new protocol-preparation boundaries (Set B) were recorded separately — notably: the historical baseline stays origin-level/mobile/TTFB/rolling 28-day/24 Jun–21 Jul 2026/26%-poor, never represented as current; Core Web Vitals Passed stays separate from the TTFB issue; lab data and public HTTP timing may not substitute for CrUX field data; desktop stays separate from mobile, origin-level from page-specific; all twenty like-for-like requirements must be preserved; TTFB percentile basis and PageSpeed interface/version stay unresolved until verified; CrUX release cadence and timezone basis stay Non-Blocking Limitations unless separately verified; country/connection segmentation stays Structurally Unavailable; historical report reproducibility must be resolved before execution; no future window selected by this decision; any overlap with the historical baseline must be disclosed; no reporting lag invented or generalized from EV-017's single observed delay; any earliest retrieval date must be justified by actual source availability; a lapse date is required, labelled an operational choice; no numerical threshold becomes binding without Kelvin's separate approval; "broadly stable" stays a measurement classification only, never proof of no problem; "no measurable change" stays a valid outcome; missing data never encoded as zero; a shifted TTFB distribution does not establish a cache, Varnish, or backend mechanism; the confounder register is mandatory, absence stays Unknown; Stage 2 does not start automatically; the protocol must end with its own separate execution-authorization request; OD-001 Candidate D stays separate and unexecuted; no ranking/conversion/revenue/reservation benefit; `transformation_authorized`/`external_changes_authorized` stay `false`.

```yaml
current_stage: Organizational Design
od_002_stage_1_protocol_authorization_gate: DD-035 — Passed With Conditions
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

**This decision authorizes repository-only protocol preparation only — it does not create the protocol, retrieve data, or authorize execution.** decisions/DD-034 and transformation/OD-002-implementation-candidate-construction-workstream.md were **not** modified. No protocol was created; no CrUX or PageSpeed data was accessed; no evidence was collected; no future measurement window or numerical threshold was set. **Next action:** prepare the IC-OD2-001 Like-for-Like CrUX Remeasurement Protocol in a separate task — not created by this task. No commit or push occurred.

## IC-OD2-001 CrUX Mobile TTFB Remeasurement Protocol Prepared (14 August 2026)

transformation/IC-OD2-001-crux-mobile-ttfb-remeasurement-protocol.md was prepared under decisions/DD-035's authorization (AUTHORIZED WITH CONDITIONS TO PREPARE IC-OD2-001 CRUX REMEASUREMENT PROTOCOL) — a repository-only, like-for-like CrUX mobile TTFB remeasurement protocol for IC-OD2-001. No CrUX/PageSpeed access occurred; no data was retrieved; no evidence was created.

**Phase 1 (Authority/Purpose):** all fifteen DD-035 Set A conditions and all thirty-two DD-035 Set B boundaries carried forward verbatim, separately provenanced; purpose scoped to a poor-share direction (lower/unchanged/higher), explicitly excluding cache/Varnish/backend mechanism diagnosis, page-specific conclusions, and ranking/conversion/revenue/reservation conclusions.

**Phase 2 (Baseline, Locked):** origin-level, mobile, TTFB, rolling 28-day window, 2026-06-24 through 2026-07-21, 26% poor (historical, not current), Core Web Vitals Passed (kept structurally separate), report generated 2026-07-24 06:19:15, PageSpeed interactive report after two API HTTP-429 failures — reconstructed with no undocumented setting added.

**Phase 3 (Unresolved-Method Register):** UMF-001 through UMF-007 carried forward from decisions/DD-035, none resolved by this task — percentile basis and PageSpeed interface/version conditions to resolve; release cadence and timezone Non-Blocking; country/connection segmentation Structurally Unavailable; report reproducibility a condition to resolve before execution.

**Phase 4 (Target Window):** proposed 2026-07-22 through 2026-08-18 — exactly 28 days, zero overlap with the historical window, labelled Proposed — Subject to Readiness Gate and Source Availability Confirmation; earliest retrieval requires source-side confirmation, not an assumed lag; proposed lapse date 2026-10-31, labelled Operational Choice.

**Phase 5/6 (Execution Manifest/Metadata):** fourteen future read-only steps defined, no automation/API key/authenticated access; eighteen required metadata fields specified for any future execution record.

**Phase 7 (Calculation Rules):** displayed percentages only, no invented decimals, no significance/materiality/causality claims, no mobile/desktop or origin/URL or lab/field mixing, explicit rounding-difference recording without silent normalization.

**Phase 8 (Pre-Registered Outcomes):** OUT-01 through OUT-07 defined, each with permitted/prohibited conclusions — no outcome may automatically start IC-OD2-002; "materially lower/higher" and "broadly stable" excluded as terms absent a separately approved threshold.

**Phase 9 (Confounder Register):** CF-001 through CF-012 registered, default status Unknown, never "No Change" without evidence.

**Phase 10 (Stop Conditions):** fourteen conditions requiring execution to halt with no classification made.

**Phase 11 (Evidence/Classification Boundary):** future execution must produce a new input manifest, privacy review, evidence record, and independent classification gate before any case-owner acceptance — execution alone never classifies an outcome, reopens Diagnosis, starts Stage 2, or authorizes implementation/Transformation/external changes.

**Phase 12 (OD-001 Separation):** confirmed full separation from OD-001 Candidate D — different metric, source, window, and decision chain; neither substitutes for or classifies the other.

**Phase 13 (Falsification):** twenty-two attacks tested — twenty-one Survive outright, one Survives with Narrowing (protocol preparation vs. execution), resolved by restating the access/execution boundary in the document's own top-level status block rather than only at its close.

**Phase 14 (Approval Boundary):** requests an Independent Protocol Readiness Gate before any execution; **preparation is not execution authorization.**

```yaml
current_stage: Organizational Design
od_002_stage_1_protocol_preparation_authorized: true
od_002_stage_1_protocol_created: true
od_002_stage_1_protocol_status: Prepared — Independent Readiness Review Required
od_002_stage_1_protocol_target_window: Proposed 2026-07-22 through 2026-08-18
od_002_stage_1_protocol_lapse_date: Proposed 2026-10-31 — Operational Choice
od_002_stage_1_execution_authorized: false
od_002_stage_1_execution_started: false
od_002_stage_2_preparation_authorized: false
od_002_feasibility_execution_authorized: false
od_002_implementation_authorized: false
transformation_authorized: false
external_changes_authorized: false
```

transformation/README.md updated with a new index row; transformation/OD-002-implementation-candidate-construction-workstream.md received a status/reference-only addendum — no Phase 1–10 content in the workstream was altered. decisions/DD-035 was **not** modified. **Next action:** perform an independent readiness review of the IC-OD2-001 CrUX protocol; do not execute it — not performed by this task. No commit or push occurred.

## IC-OD2-001 CrUX Protocol Readiness Gate (14 August 2026)

decisions/DD-036 independently reviewed transformation/IC-OD2-001-crux-mobile-ttfb-remeasurement-protocol.md — the protocol was not executed; no CrUX/PageSpeed/Search Console system was accessed. All twenty-seven preconditions passed, including the expected dirty-tree state, verified directly (4 modified + 1 untracked, nothing staged).

**Part 1 (Authority/Scope):** confirmed preparation-only authority, execution non-authorization, CrUX/mobile/TTFB scope, OD-001 separation, no automatic Stage 2 start, no mechanism/business-outcome implication.

**Part 2 (Baseline Review):** every historical field independently re-verified against observations/O-012.md and diagnosis/DQ-004-investigation.md Phase 1 directly — all Confirmed except the report timezone (Confirmed With Limitation; the original source states no timezone). No field found Incorrect.

**Part 3 (UMF-001–007 Review):** six of seven transferred cleanly from decisions/DD-035; UMF-001 (TTFB percentile basis) required an interpretive ruling — disclosed deferral to execution time satisfies DD-035's original "resolve before approval" condition, since premature assertion would itself violate the resolve-nothing-by-assumption rule.

**Part 4 (Target Window):** mathematics independently re-derived — 2026-07-22 through 2026-08-18 is exactly 28 days with zero overlap against the historical 2026-06-24–2026-07-21 window, confirmed by direct calculation. Operational feasibility classified **Ready With Source-Availability Condition**.

**Part 5 (Retrieval/Lapse):** confirmed no fixed retrieval date, no invented reporting lag, and correct source-availability gating. **Genuine gap found:** the lapse date lacked an explicit expiry/renewal rule — closed by a bounded correction to Phase 4 (execution after lapse requires a new, separate case-owner decision).

**Part 6 (Execution Manifest):** all fourteen steps independently confirmed read-only, reproducible, authentication-free, and correctly authorization-gated (Step 1 precedes all access steps).

**Part 7 (Calculation Review):** five sample values (20%, 26%, 31%, rounding-anomaly sums, missing data) independently tested against the protocol's own written rules — all routed correctly to OUT-01/02/03/05 respectively.

**Part 8 (Outcome Review):** all seven pre-registered outcomes independently confirmed to bar mechanism-proof, no-problem, and automatic-Stage-2 conclusions.

**Part 9 (Confounder Review):** all twelve confounders (CF-001–012) confirmed present and matched 1:1 against the required list; default-Unknown discipline upheld.

**Part 10 (Stop-Condition Review):** fourteen original conditions matched 1:1 against the required list. **Second genuine gap found:** no condition covered a source window displayed without determinable exact dates — closed by adding a fifteenth stop condition.

**Part 11 (Privacy/Access):** confirmed public-read-only-only future access; all ten prohibited categories covered, several by reference to the DD-029/030 checklist.

**Part 12 (OD-001 Separation):** confirmed full separation — distinct metric, source, window, and governing decision chain.

**Part 13 (Independent Challenge):** twenty-four items tested — twenty-two Survive outright, one Survives with Narrowing (lapse-date governance, resolved by the Part 5 correction); the two additional gaps found in Parts 3 and 10 are recorded as this gate's own original findings, not hidden inside the challenge table.

**Part 14 (G-01–G-22):** no failures — eighteen PASS, four Conditional Pass (G-03, G-05, G-07, G-13), three resolved by bounded correction and one (G-05, target-window availability) inherently conditional on future source confirmation.

**Part 15 (Gate Verdict):** **PASSED WITH CONDITIONS. Recommendation: RECOMMEND APPROVED WITH CONDITIONS FOR READ-ONLY CRUX REMEASUREMENT EXECUTION** — eleven binding conditions, including the UMF-001 interpretive ruling, the new lapse-expiry rule, and the new fifteenth stop condition, all now binding on the protocol.

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

**This recommendation is not authorization.** Three bounded corrections were applied directly to the protocol document (timezone-assumption flag, lapse-expiry rule, fifteenth stop condition), each dated and attributed inline within the protocol itself — no other Phase 1–14 content was altered. transformation/README.md and transformation/OD-002-implementation-candidate-construction-workstream.md updated with reference/status-only content. decisions/DD-018 through DD-035 were **not** modified. No CrUX/PageSpeed system was accessed; no data was retrieved; no evidence was created; this gate did not authorize itself. **Next action:** Kelvin's explicit response (APPROVED FOR READ-ONLY CRUX REMEASUREMENT EXECUTION / APPROVED WITH CONDITIONS FOR READ-ONLY CRUX REMEASUREMENT EXECUTION / NOT APPROVED FOR EXECUTION) — not recorded by this task. No commit or push occurred.

## IC-OD2-001 CrUX Remeasurement Execution — Case-Owner Decision (14 August 2026)

decisions/DD-036's Case-Owner Decision section: Kelvin Wong issued **APPROVED WITH CONDITIONS FOR READ-ONLY CRUX REMEASUREMENT EXECUTION** — one bounded, public, read-only execution attempt of transformation/IC-OD2-001-crux-mobile-ttfb-remeasurement-protocol.md authorized, limited to retrieving and recording comparable origin-level mobile CrUX TTFB field data for konnichiwa.nl. Explicitly excludes classification acceptance, Stage 2 activation, technical investigation, implementation, Transformation execution, and external changes.

All eleven decisions/DD-036 gate conditions (Set A) were copied verbatim with their original provenance; thirty-eight new execution conditions (Set B) were recorded separately — notably: execution prohibited on or before 18 August 2026, earliest possible 19 August 2026 (not a guaranteed availability date); execution only when the source visibly confirms a complete, comparable field-data period matching the intended 22 Jul–18 Aug 2026 target window; a differently-dated or undated displayed window must route to Method Not Comparable/Data Unavailable or a new case-owner decision, never silent equivalence; the 26% historical comparator (24 Jun–21 Jul 2026) stays historical; authorization expires 31 October 2026, execution after that requires a new decision; exactly one attempt permitted, a stopped attempt does not authorize retries; access limited to public read-only PageSpeed/CrUX, no credentials/automation; lab/field, mobile/desktop, origin/URL, and public-timing/CrUX all stay separate; displayed precision preserved, rounding differences recorded not normalized; no statistical-significance/materiality claim; no result establishes a cache/Varnish/backend mechanism; OUT-01–OUT-07 remain the only pre-registered outcomes; missing data never zero; all twelve confounders remain Unknown unless separately evidenced; execution creates evidence but does not itself classify or accept the outcome — a separate independent classification gate is mandatory; no outcome auto-starts IC-OD2-002; Stage 2 preparation stays unauthorized; OD-001 Candidate D stays separate and unexecuted; no ranking/conversion/revenue/reservation benefit; no technical/production change; implementation/`transformation_authorized`/`external_changes_authorized` stay `false`.

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

**This decision authorizes one bounded execution attempt — it does not itself execute the protocol, create evidence, or start Stage 2.** transformation/IC-OD2-001-crux-mobile-ttfb-remeasurement-protocol.md and the candidate workstream received status-only addenda; decisions/DD-018 through DD-035 were **not** modified. No CrUX/PageSpeed system was accessed; no evidence was created. **Next action:** wait until at least 2026-08-19, then perform at most one public read-only execution only if the source visibly confirms a complete comparable field-data window — not performed by this task. No commit or push occurred.

## IC-OD2-001 CrUX Remeasurement Execution Attempt 1 — Blocked (19 August 2026)

Authority: transformation/IC-OD2-001-crux-remeasurement-execution-attempt-1.md. **Record type: Execution Attempt Record — Not Evidence**, not a classification, not a Case-Owner Decision.

One public, read-only, unauthenticated request to the PageSpeed Insights API v5 endpoint (`strategy=mobile`, `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=https://konnichiwa.nl/`) returned **HTTP 429 Too Many Requests** with no usable response body: no CrUX data, no window-start/window-end dates, no mobile origin-level TTFB distribution, no Core Web Vitals. No evidence artifact was created; `O-014` and `EV-025` (the next free observation/evidence IDs) were determined but not used or reserved. The same route and parameters are documented as a historical failure mode in observations/O-012.md's own Attempt Log (24 July 2026, two 429s before the interactive report interface succeeded) — cited here as historical context only, not as justification for this attempt's outcome or method choice.

**Two determinations are explicitly deferred, not made by this record:** (1) whether an unauthenticated PageSpeed Insights API v5 call satisfies the protocol's Phase 5 Step 3 requirement of an "approved public read-only CrUX/PageSpeed source" — UMF-002 already anticipated more than one possible interface and required recording, not pre-selecting, one; (2) whether this blocked attempt definitively consumes decisions/DD-036's single authorized attempt, or whether decisions/DD-036 Set B Condition 13's "a stopped attempt... does not authorize repeated attempts" should be read as a provisional safety default pending review. Both are routed to a future, independent **DD-037 — Execution Blocker and Attempt-Consumption Gate**, not yet created.

```yaml
od_002_stage_1_attempt_1_occurred: true
od_002_stage_1_request_count: 1
od_002_stage_1_attempts_remaining_provisional: 0
od_002_stage_1_execution_status: Blocked — HTTP 429 / No CrUX Data Returned
od_002_stage_1_execution_completed: false
od_002_stage_1_evidence_created: false
od_002_stage_1_classification_status: Pending Independent Blocker Review
od_002_stage_1_replacement_attempt_authorized: false
od_002_stage_1_method_compliance_review: Pending Independent Review
od_002_stage_2_preparation_authorized: false
od_002_feasibility_execution_authorized: false
od_002_implementation_authorized: false
transformation_authorized: false
external_changes_authorized: false
```

`od_002_stage_1_execution_started` is deliberately left at its existing value (`false`) — DD-036 does not explicitly define whether "execution started" means a request was sent, regardless of outcome, or that comparable data began to be evaluated; resolving this is left to DD-037, not asserted here. decisions/DD-035 and decisions/DD-036 were **not** modified — both remain exactly as gate-reviewed and case-owner-decided. No second request occurred. No commit or push occurred.

## IC-OD2-001 Execution Blocker and Attempt-Consumption Gate — DD-037 (19 August 2026)

Authority: decisions/DD-037-ic-od2-001-execution-blocker-attempt-gate.md. Independent review of transformation/IC-OD2-001-crux-remeasurement-execution-attempt-1.md's registration.

**Gate Verdict: PASSED WITH CONDITIONS.** Held separately: Process outcome **Blocked Execution — Source Rate Limited / No Data**; Method-compliance classification **Unresolvable From Existing Authority** (the API v5 route is neither named nor excluded by decisions/DD-035/DD-036 or the protocol; UMF-002 defers interface selection to execution time); Attempt-consumption classification **Attempt Consumed — 0 Remaining** under the current authorization (DD-036 Set B Condition 13 directly names a stopped-attempt-by-unavailable-data scenario as non-repeat-authorizing; Condition 14 requires a wholly new case-owner instruction for any future attempt). Lifecycle-semantics recommendation: `execution_started` should mean data became available (not merely that a request was sent); `od_002_stage_1_execution_started` left unedited at `false`, not retroactively corrected by this gate. Three next-routes assessed, none executed: A (close without replacement), B (a possible future replacement-attempt authorization gate, not authorized here), C (return to Design/Diagnosis, found unwarranted — HTTP 429 is not evidence about Konnichiwa's own TTFB mechanism). Fifteen-attack independent challenge: thirteen Rejected, two addressed with narrowing/explicit-text resolution, none Survives outright unqualified. G-01–G-12: ten PASS, two PASS WITH CONDITIONS (G-02, G-05), no FAIL.

```yaml
od_002_stage_1_blocker_gate: DD-037 — Passed With Conditions
od_002_stage_1_blocker_outcome: Blocked Execution — Source Rate Limited / No Data
od_002_stage_1_method_compliance: Unresolvable From Existing Authority
od_002_stage_1_attempt_consumption: Attempt Consumed — 0 Remaining
od_002_stage_1_blocker_acceptance_decision: Pending
od_002_stage_1_replacement_gate_preparation_authorized: false
od_002_stage_1_replacement_attempt_authorized: false
od_002_stage_2_preparation_authorized: false
od_002_feasibility_execution_authorized: false
od_002_implementation_authorized: false
transformation_authorized: false
external_changes_authorized: false
```

## IC-OD2-001 Replacement-Attempt Gate Preparation Authorized — DD-037 Case-Owner Decision (19 August 2026)

Kelvin Wong issued **ACCEPT BLOCKED EXECUTION AND AUTHORIZE PREPARATION OF A REPLACEMENT-ATTEMPT GATE** (decisions/DD-037, Case-Owner Decision). DD-037's own findings (Blocked Execution / Source Rate Limited, Method-Compliance Unresolvable From Existing Authority, Attempt Consumed — 0 Remaining) are accepted unmodified as the closing record of Attempt 1. Repository-only **preparation** of a new, separate replacement-attempt authorization gate is now authorized — not its execution — subject to seven inherited DD-037 Set A gate conditions and twelve new Set B case-owner conditions recorded verbatim in decisions/DD-037, including: one replacement attempt only; prescribe the interactive PageSpeed Insights interface where justified by O-012/Attempt 1's own evidence, or explicitly justify otherwise; exclude the failed API v5 route unless re-justified; no API key/login; address the elapsed 22 July–18 August 2026 window explicitly; no assumed availability; a labeled expiry; no auto-Stage-2; preparation and execution remain separate, sequential gates.

```yaml
od_002_stage_1_blocker_acceptance_decision: Accepted — Authorize Replacement-Attempt Gate Preparation
od_002_stage_1_replacement_gate_preparation_authorized: true
od_002_stage_1_replacement_attempt_authorized: false
od_002_stage_2_preparation_authorized: false
od_002_feasibility_execution_authorized: false
od_002_implementation_authorized: false
transformation_authorized: false
external_changes_authorized: false
```

**This decision does not authorize any new PageSpeed/CrUX request.** decisions/DD-035, decisions/DD-036, DD-037's own Precondition Check/Parts 1–9/Gate Verdict, the protocol's Phases 1–14, and the Attempt 1 record all remain unmodified, preserved as historical record. No CrUX/PageSpeed access occurred. No evidence ID used. No Stage 2 activity. No commit or push occurred.

## IC-OD2-001 Replacement-Attempt Authorization Gate — DD-038 (19 August 2026)

Authority: decisions/DD-038-ic-od2-001-replacement-attempt-authorization-gate.md. Independent assessment of whether one new, strictly bounded, public, read-only replacement CrUX/PageSpeed attempt is justified and safely authorizable after Attempt 1's HTTP 429 blockage.

**Gate Verdict: PASSED WITH CONDITIONS. Recommendation: RECOMMEND AUTHORIZED WITH CONDITIONS FOR ONE INTERACTIVE PAGESPEED REPLACEMENT ATTEMPT.** Replacement justification **Justified With Conditions** (HTTP 429 carries no CrUX/TTFB evidence; the interactive interface is a proven-successful, distinct route for this origin per O-012, versus the now-thrice-failed API v5 route). Mandatory boundary: interactive interface only, API v5 excluded, no key/login/automation, attempt begins at submission regardless of outcome, never auto-resubmitted. New window rule: exact 28-day period, start on/after 2026-07-22, no overlap with the 24 Jun–21 Jul 2026 baseline, confirmed origin/mobile/field/TTFB — found methodologically sufficient like-for-like given the original window's elapse; undated results stop with no evidence and no repeat. Expiry recommended 2026-10-31, operational choice. Output limited to retrieval metadata/scope/window/TTFB/CWV — no causal/significance/materiality/ranking/conversion/reservation claim, no automatic OUT-classification; separate Independent Classification Gate remains mandatory. Three alternatives compared (RA-1/RA-2/RA-3), RA-2 recommended, none selected on Kelvin's behalf. Seventeen-item risk review: zero Blocking, five Controlled With Conditions. G-01–G-20: sixteen PASS, two PASS WITH CONDITIONS (G-04, G-07), no FAIL. Seventeen-attack challenge: fifteen Rejected, two Survives With Narrowing.

```yaml
od_002_stage_1_replacement_gate: DD-038 — Passed With Conditions
od_002_stage_1_replacement_gate_recommendation: Recommend Authorized With Conditions For One Interactive PageSpeed Replacement Attempt
od_002_stage_1_replacement_attempt_decision: Pending
od_002_stage_1_replacement_attempt_authorized: false
od_002_stage_1_attempts_remaining: 0
od_002_stage_2_preparation_authorized: false
od_002_feasibility_execution_authorized: false
od_002_implementation_authorized: false
transformation_authorized: false
external_changes_authorized: false
```

## IC-OD2-001 Replacement Attempt Authorized — DD-038 Case-Owner Decision (19 August 2026)

Kelvin Wong issued **AUTHORIZED WITH CONDITIONS FOR ONE INTERACTIVE PAGESPEED REPLACEMENT ATTEMPT** (decisions/DD-038, Case-Owner Decision). One bounded, public, read-only replacement CrUX/PageSpeed attempt for IC-OD2-001 is now authorized — interactive PageSpeed Insights interface only, API v5 excluded, no key/login/automation — subject to twelve inherited Set A gate conditions and fourteen new Set B execution conditions recorded verbatim in decisions/DD-038, including: the attempt begins at analysis submission and counts regardless of outcome; a result is usable only with a visibly displayed exact 28-day window starting on/after 2026-07-22, no overlap with the 24 Jun–21 Jul 2026 baseline, confirmed origin-level/mobile/field/TTFB; a separate Independent Classification Gate remains mandatory before any classification; no outcome auto-triggers Stage 2. Expires 2026-10-31 if unused. **Attempt 1's historical record (Blocked/Unresolvable/Consumed) is left entirely unmodified** — this is a new, separately-authorized attempt under its own `od_002_stage_1_replacement_attempt_*` field set.

```yaml
od_002_stage_1_replacement_attempt_decision: Approved With Conditions — One Public Interactive Read-Only Attempt
od_002_stage_1_replacement_attempt_authorized: true
od_002_stage_1_replacement_attempt_method: Interactive PageSpeed Insights Interface Only — API v5 Excluded
od_002_stage_1_replacement_attempt_not_before: 2026-08-19
od_002_stage_1_replacement_attempt_window_rule: Exact 28-day period, start on/after 2026-07-22, no overlap with 2026-07-21 baseline end
od_002_stage_1_replacement_attempt_expires: 2026-10-31
od_002_stage_1_replacement_attempt_limit: 1
od_002_stage_1_replacement_attempt_started: false
od_002_stage_1_replacement_attempt_completed: false
od_002_stage_1_replacement_evidence_created: false
od_002_stage_2_preparation_authorized: false
od_002_feasibility_execution_authorized: false
od_002_implementation_authorized: false
transformation_authorized: false
external_changes_authorized: false
```

decisions/DD-035, DD-036, DD-037, the protocol's Phases 1–14, and the Attempt 1 record all remain unmodified. No CrUX/PageSpeed/browser access occurred in the course of recording this decision. No commit or push occurred.

## IC-OD2-001 Replacement Attempt 1 Blocked (19 August 2026)

Authority: transformation/IC-OD2-001-crux-remeasurement-replacement-attempt-1.md. **Record type: Execution Attempt Record — Not Evidence**, not a classification, not a Case-Owner Decision.

Under decisions/DD-038's authorization, one interactive PageSpeed Insights analysis was submitted for `https://konnichiwa.nl/` (Mobile). Independently verified directly from two supplied screenshots (`Screenshot (2).png`, `Screenshot (12).png`): report timestamp "Aug 19, 2026, 4:48:41 PM" (no timezone stated); Core Web Vitals Assessment "Passed"; TTFB 75th percentile 1.7 s, Good 27% / Needs Improvement 52% / Poor 22% (summing to 101%, a visible rounding artifact); labeled "Latest 28-day period," confirmed Chrome UX Report field data. **Determinative blocker**: no exact window start or end date is visible in either screenshot, so comparability against the 24 Jun–21 Jul 2026 baseline (28-day length, start on/after 22 Jul, no overlap) cannot be established — no date was inferred or calculated. **Additional independent finding**: the "This URL"/"Origin" scope toggle's active state could not be independently confirmed from the supplied images — recorded as a genuinely open point, not asserted either way. Process outcome: **Blocked Execution — Exact 28-Day Window Not Visibly Confirmed**. The one attempt authorized by decisions/DD-038 is used; zero replacement attempts remain. TTFB figures recorded only as `Visible Source Data — Not Accepted as Like-for-Like Remeasurement Evidence` — no comparison to the historical 26%, no OUT-classification, no mechanism/causal claim, no Stage 2 trigger.

```yaml
od_002_stage_1_replacement_attempt_occurred: true
od_002_stage_1_replacement_attempt_started: true
od_002_stage_1_replacement_attempt_consumed: true
od_002_stage_1_replacement_attempts_remaining: 0
od_002_stage_1_replacement_execution_status: Blocked — Exact 28-Day Window Not Visibly Confirmed
od_002_stage_1_replacement_attempt_completed: false
od_002_stage_1_replacement_evidence_created: false
od_002_stage_1_classification_status: Pending Independent Blocker Review
od_002_stage_2_preparation_authorized: false
od_002_feasibility_execution_authorized: false
od_002_implementation_authorized: false
transformation_authorized: false
external_changes_authorized: false
```

Whether `od_002_stage_1_replacement_attempt_completed` should read `true` (usable data was returned) or remain `false` (no comparable outcome was produced), and how the Origin/URL-scope ambiguity should be treated, are left as explicit open questions for a future, independent follow-up gate — not resolved by this record. decisions/DD-035, DD-036, DD-037, DD-038, the protocol's Phases 1–14, and Attempt 1's own record all remain unmodified. No PageSpeed/CrUX/API request was made in producing this record. No evidence ID or O-identifier used. No commit or push occurred.

## IC-OD2-001 Independent Replacement-Attempt Blocker Gate — DD-039 (19 August 2026)

Authority: decisions/DD-039-ic-od2-001-replacement-attempt-blocker-gate.md. Independent review of Replacement Attempt 1's registration against decisions/DD-038's binding terms.

**Gate Verdict: PASSED WITH CONDITIONS.** Method compliance **Compliant** (decisions/DD-038 explicitly named the interactive interface; the record confirms it was used, no API v5/key/login/automation — more definitive than Attempt 1's Unresolvable finding, since DD-038 closed the authority gap DD-037 identified). Attempt consumption **Attempt Consumed — 0 Remaining** (decisions/DD-038 Binding Condition 5/Set B Condition 6 directly and self-executingly names this exact scenario). `completed: false` **confirmed correct** (this case's convention reserves "completed" for usable, protocol-conformant results, not mere data presence, per decisions/DD-026's Configured/Delivered-State precedent); a forward-looking `replacement_data_returned` field is recommended, not applied retroactively. Kelvin's own observation that Origin/URL-scope ambiguity is a second, independent blocker **independently confirmed** — classification refined to **Blocked Execution — Exact 28-Day Window Not Visibly Confirmed AND Origin Scope Not Independently Confirmed** (documentation-completeness refinement; no procedural consequence changes). On closure: a **new material observation** — an unopened "(history)" link beside "Latest 28-day period" (Screenshot 12) was correctly not explored under this attempt's bounded scope, meaning the blocker is untested via that affordance, not proven unfixable. Recommendation **leans toward closing Stage 1 (RA-1)**, with **RA-2** (a narrowly-targeted third-attempt authorization exploring that link) identified as a genuinely viable alternative; RA-3 assessed disproportionate. No route selected on Kelvin's behalf. Twelve-attack challenge: ten Rejected, two Rejected-but-coinciding. G-01–G-10 all PASS, no FAIL.

```yaml
od_002_stage_1_blocker_gate_2: DD-039 — Passed With Conditions
od_002_stage_1_replacement_method_compliance: Compliant
od_002_stage_1_replacement_attempt_consumption: Attempt Consumed — 0 Remaining
od_002_stage_1_replacement_blocked_reason: Exact 28-Day Window Not Visibly Confirmed AND Origin Scope Not Independently Confirmed
od_002_stage_1_replacement_completed_determination: Confirmed Correct At False — Refinement Recommended, Not Applied
od_002_stage_1_close_recommendation: Recommend Close (RA-1), RA-2 Identified As Viable Alternative
od_002_stage_1_blocker_2_acceptance_decision: Pending
od_002_stage_2_preparation_authorized: false
od_002_feasibility_execution_authorized: false
od_002_implementation_authorized: false
transformation_authorized: false
external_changes_authorized: false
```

**No Case-Owner Decision recorded.** Three explicit response options requested: `ACCEPT DD-039 AND CLOSE STAGE 1 WITHOUT FURTHER ATTEMPT`; `ACCEPT DD-039 AND AUTHORIZE PREPARATION OF A THIRD, NARROWLY-TARGETED ATTEMPT GATE`; `REJECT DD-039 DETERMINATION`. decisions/DD-035 through DD-038, the protocol, and both attempt records verified unmodified; the six file changes already present before this task began remain exactly as they were. No CrUX/PageSpeed/browser access occurred — the screenshots were not re-opened; this gate assessed the Replacement Attempt 1 record's own account. No evidence created. No Stage 2 activity. No commit or push occurred.

## IC-OD2-001 Stage 1 Closed — DD-039 Case-Owner Decision (19 August 2026)

Authority: decisions/DD-039-ic-od2-001-replacement-attempt-blocker-gate.md, Case-Owner Decision section. Kelvin Wong issued **ACCEPT DD-039 AND CLOSE STAGE 1 WITHOUT FURTHER ATTEMPT**.

Decisions/DD-039's findings (Method Compliance: **Compliant**; Attempt Consumption: **Attempt Consumed — 0 Remaining**; `completed: false` **confirmed correct**; compound-blocker classification **Blocked Execution — Exact 28-Day Window Not Visibly Confirmed AND Origin Scope Not Independently Confirmed**) are accepted unmodified as the closing record of Replacement Attempt 1. **IC-OD2-001 Stage 1 is closed via Route RA-1.** RA-2 (a narrowly-targeted third attempt exploring the unopened "(history)" link in Screenshot 12, which decisions/DD-039 identified as a genuinely viable alternative) is explicitly **declined**, not deferred — decisions/DD-039's own Set A Condition 6 confirms RA-2 remains available only under a wholly new, future, separate authorization.

Seven Set A conditions carried forward verbatim from decisions/DD-039's Gate Verdict, plus seven new Set B conditions recorded verbatim in Kelvin's own words: final status is blocked execution, no valid remeasurement; no comparison to the historical 26% baseline; no OUT-01–OUT-07 classification; **Stage 2 is not activated, because Stage 1 did not confirm the diagnosed condition remains materially present** — consistent with decisions/DD-034's own Case-Owner Selection, under which IC-OD2-002 (Stage 2) was only ever Selected Conditionally, pending Stage 1 review; the history link stays unopened; no further PageSpeed/CrUX attempt without an entirely new case-owner decision; feasibility, implementation, Transformation, and external changes remain unauthorized.

```yaml
od_002_stage_1_blocker_2_acceptance_decision: Accepted — Close Stage 1 Without Further Attempt
od_002_stage_1_candidate_status: Closed — Blocked / Both Attempts Exhausted / No Valid Remeasurement
od_002_stage_1_final_status: Blocked Execution, No Valid Remeasurement
od_002_stage_1_comparison_to_baseline_performed: false
od_002_stage_1_out_classification_applied: false
od_002_stage_1_history_link_explored: false
od_002_stage_1_further_attempt_authorized: false
od_002_stage_1_ra2_declined: true
od_002_stage_2_preparation_authorized: false
od_002_feasibility_execution_authorized: false
od_002_implementation_authorized: false
transformation_authorized: false
external_changes_authorized: false
```

decisions/DD-039's Precondition Check through Gate Verdict, decisions/DD-035 through DD-038, the protocol, and both attempt records all verified unmodified above this entry. No CrUX/PageSpeed/browser access occurred in recording this decision; the history link was not opened. No evidence created. No commit or push occurred in the course of recording this decision — per Kelvin's own sequencing instruction, the seven touched files (five modified before decisions/DD-039 began, plus decisions/DD-039 and the Replacement Attempt 1 record) may be committed and pushed together as a separate, subsequent task, not performed here.

## Lifecycle Traceability

Current stage: Case Establishment **Completed** (decisions/DD-008) → Observation and Evidence Collection **Completed**, baseline **Established** → Evidence Synthesis and Justified Organizational Claims **Completed** (decisions/DD-010, 24 July 2026, PASSED) → Organizational Understanding **Authorized With Conditions** (decisions/DD-014, case-owner decision 24 July 2026) → Reconstructed and gated PASSED WITH CONDITIONS (decisions/DD-015, 24 July 2026) → **Organizational Understanding — Established With Conditions** (decisions/DD-015, case-owner decision 25 July 2026) → Diagnosis Authorization Gate reviewed and recommended AUTHORIZED WITH CONDITIONS, question-specific (decisions/DD-016, 25 July 2026) → **Organizational Diagnosis — Partially Authorized With Conditions** (decisions/DD-016, case-owner decision 25 July 2026), `current_stage: Organizational Diagnosis` → **DQ-001 investigated and gated** (decisions/DD-017, 25 July 2026) → **DQ-001 — Established With Conditions** (decisions/DD-017, case-owner decision 25 July 2026), `dq_001_diagnosis_established: true`, `diagnosis_established_scope: DQ-001 only` → **DQ-004 investigated and gated** (decisions/DD-018, 25 July 2026) → **DQ-004 — Established With Conditions** (decisions/DD-018, case-owner decision 25 July 2026), `dq_004_diagnosis_established: true`, `diagnosis_established_scope: DQ-001, DQ-004` — the authoritative formulation for OD-002 is narrowed per the case-owner's Condition 2 (see above) → **DQ-005 investigated and gated** (decisions/DD-019, 25 July 2026): ground-truth facts registered first, fact-by-fact correspondence test run against OC-005's three conditions and every AI-observed discrepancy, **Diagnosis Outcome: Evidence Insufficient**, no OD created, Gate Verdict **PASSED** (unconditional) → **DQ-005 — Completed, Evidence Insufficient, ACCEPTED** (decisions/DD-019, case-owner decision 25 July 2026), `dq_005_acceptance_decision: Accepted`, `dq_005_diagnosis_established: false` (no Organizational Diagnosis exists or was ever created for DQ-005) → **DQ-007 investigated and gated** (decisions/DD-020, 25 July 2026): twelve candidate explanations tested against a twelve-domain evidence-sufficiency matrix, new bounded public research directly falsified a GA4-integration mechanism and left one 13-June community-report lead unconfirmed, **Diagnosis Outcome: Evidence Insufficient**, no OD created, Gate Verdict **PASSED WITH CONDITIONS** → **DQ-007 — Completed, Evidence Insufficient, ACCEPTED WITH CONDITIONS** (decisions/DD-020, case-owner decision 25 July 2026), `dq_007_acceptance_decision: Accepted With Conditions`, `dq_007_diagnosis_established: false` (no Organizational Diagnosis exists or was ever created for DQ-007) → **DQ-002 investigated and gated** (decisions/DD-021, 25 July 2026): name-variant inventory and canonical entity baseline established, direct re-analysis of EV-014's raw Search Console export found the misspelled query family shows equal-to-better average position than the correct spelling in both directly-tested pairs, eight candidate explanations tested, Candidate Organizational Diagnosis diagnosis/OD-003-name-variant-entity-resolution.md produced and independently challenged (Survives), Gate Verdict **PASSED WITH CONDITIONS** → **DQ-002 — Established With Conditions** (decisions/DD-021, case-owner decision 25 July 2026): the authoritative formulation is narrowed to a single sentence and twelve binding conditions apply verbatim, `dq_002_diagnosis_established: true`, `diagnosis_established_scope: DQ-001, DQ-002, DQ-004` → **DQ-002 confidence corrected** (decisions/DD-021 Confidence Decision, case-owner decision 25 July 2026): OD-003's authoritative confidence set to **Medium**, narrower than the gate's original Medium-High assessment, which remains preserved unchanged as historical analysis — **this remains the case's current authoritative stage**, `current_stage: Organizational Diagnosis`. **All five of DD-016's authorized/conditionally-authorized diagnosis questions (DQ-001, DQ-002, DQ-004, DQ-005, DQ-007) have now been investigated, and every question capable of producing an Organizational Diagnosis (DQ-001, DQ-002, DQ-004) is now established.** DQ-003 and DQ-006 remain Not Authorized (Not a Diagnosis Question). `design_authorized: false`, `transformation_authorized: false`, `external_changes_authorized: false` — unaffected by any diagnosis gate to date; no cache, CDN, hosting, WordPress, code, GBP, listing, or production change is authorized; no Design Authorization Gate exists. DQ-005 and DQ-007 may only be reopened with materially new evidence and a new explicit case-owner decision. Organizational Understanding's first attempt was without valid prior authorization and was reclassified Draft — Not Authoritative (decisions/DD-012, 24 July 2026); that finding is preserved, unedited, as lifecycle history — it is not reopened or corrected by any later authorization, reconstruction, establishment, or gate review, all of which rest on independent review and explicit case-owner decision rather than on the earlier drafts.

Completed: Case Identity, Purpose, Explicit Boundaries, Observed Conditions, Lifecycle Scope declared. Prior-round Observation and Evidence exist (HV-IV-001–007). New-round Observation complete: O-001, O-002, O-003, O-004, O-011, O-012 fully collected; O-005–O-010 informed with explicit limitations where evidence is partial. work-objects/WO-001-search-visibility-baseline.md formalizes this as the case's Active, **Established** baseline work object — see its Baseline Acceptance Criteria Assessment: all nine criteria met, earned incrementally (an initial premature `true` was corrected to `Provisional`/`false`, decisions/DD-008 §6, then two genuine gaps — O-012 tooling, O-003 geo-control — were closed in turn with real evidence, EV-017 and EV-018, before the verdict returned to `true`).

**Evidence Synthesis and Justified Organizational Claims (24 July 2026, decisions/DD-010, PASSED):** claims/ES-001-evidence-synthesis-review.md reviewed all 12 observations for integrity (Verdict: PASSED, one documentation-currency issue found and corrected — O-004.md's stale CR-005 wording). Seven candidate claims (OC-001–OC-007, claims/OC-register.md) were drafted directly from WO-001, each individually challenged via an 8-question falsification test set (repository-native pattern, matching `workspace /cases/EC-001…/claims/OC-001…md`'s Falsification Tests / Boundaries / Contradictory Evidence structure). All seven survived with narrowing and were promoted to Justified Organizational Claim status. None was rejected; none asserts unsupported causation (all Causal Status: Descriptive or Associative); the case's explicitly forbidden conclusions (stable ranking, "lost" reservations, GBP-decline cause, etc.) were checked against each claim and excluded.

**Organizational Understanding — attempted, reclassified (24 July 2026, decisions/DD-012, FAILED lifecycle compliance review):** `understanding/OU-001…md` (from OC-001, OC-003, OC-004) and `understanding/OU-002…md` (from OC-005, OC-006) were drafted and gated by decisions/DD-011 on the stated basis of Kelvin's message "registratie klopt, de rest kan starten." A lifecycle compliance review found that message confirmed an evidentiary fact (Guestplan no-shows), not a named lifecycle-stage transition, and that decisions/DD-010 explicitly left Organizational Understanding "not yet begun." No prior decision authorized the transition. Both records are preserved, unmodified, but marked Draft — Prematurely Produced, Not Authoritative; decisions/DD-011's PASSED WITH CONDITIONS verdict is suspended; `current_stage` reverted to Justified Organizational Claims. **Separately, and unaffected by this correction:** Kelvin authorized Path 1 of DD-011's "Two Paths Forward" — bounded, read-only evidence collection for OC-002 (a Justified Organizational Claim under DD-010, independent of the Understanding-stage question) — see measurement/HV-MP-002-oc-002-gbp-decline-evidence-plan.md. OC-007 is classified as a Measurement/Attribution Constraint (claims/OC-007…md), not a source of "lost reservations."

**OC-002 evidence collection, executed (24 July 2026, decisions/DD-013):** measurement/HV-MP-002…md's read-only plan was executed against existing evidence (EV-015, re-read at monthly granularity) and public Google documentation — 9 of 13 items completed, 4 (E-05, E-06, E-07, E-11) blocked pending Kelvin's direct GBP access. Result recorded in observations/O-013.md and claims/OC-002-competing-explanations-register.md (10 candidate explanations, none Plausible). OC-002's claim status is unchanged (still Justified, decisions/DD-010); one overstated clause ("did not recover at any point") was narrowed in a Reassessment section appended to claims/OC-002…md, preserving the original text. decisions/DD-013's verdict, PASSED WITH CONDITIONS, does not authorize, begin, or recommend beginning Organizational Understanding — it only recommends future eligibility once the four blocked items are resolved. This work does not reopen or resolve decisions/DD-012's compliance finding.

One Design realized as Transformation (HV-INT-002, live). One Design blocked before Transformation (HV-INT-001). Two additional Transformations prepared, not deployed (HV-INT-004, HV-INT-005). One infrastructure Transformation completed and validated (HV-INT-003, GA4).

Not yet established: Organizational Understanding (Draft only, not authoritative — decisions/DD-012); Organizational Diagnosis; Evaluation. This case's authoritative lifecycle position is Justified Organizational Claims (decisions/DD-010, PASSED), plus an independently authorized, not-yet-executed read-only evidence-collection task for OC-002.

No Organizational Design or Transformation beyond the five named interventions (HV-INT-001–005) is authorized. decisions/DD-009 tracks what access/approval each remaining gap requires. decisions/DD-008 §7 tracks resolution of all four original gate-review conditions, including the `business/Marketing/` ↔ `organization/capabilities/marketing/` relationship (resolved — the former is an empty placeholder, the latter is authoritative, see capability.md and business/Marketing/README.md).
