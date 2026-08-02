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

## Lifecycle Traceability

Current stage: Case Establishment **Completed** (decisions/DD-008) → Observation and Evidence Collection **Completed**, baseline **Established** → Evidence Synthesis and Justified Organizational Claims **Completed** (decisions/DD-010, 24 July 2026, PASSED) → Organizational Understanding **Authorized With Conditions** (decisions/DD-014, case-owner decision 24 July 2026) → Reconstructed and gated PASSED WITH CONDITIONS (decisions/DD-015, 24 July 2026) → **Organizational Understanding — Established With Conditions** (decisions/DD-015, case-owner decision 25 July 2026) → Diagnosis Authorization Gate reviewed and recommended AUTHORIZED WITH CONDITIONS, question-specific (decisions/DD-016, 25 July 2026) → **Organizational Diagnosis — Partially Authorized With Conditions** (decisions/DD-016, case-owner decision 25 July 2026), `current_stage: Organizational Diagnosis` → **DQ-001 investigated and gated** (decisions/DD-017, 25 July 2026) → **DQ-001 — Established With Conditions** (decisions/DD-017, case-owner decision 25 July 2026), `dq_001_diagnosis_established: true`, `diagnosis_established_scope: DQ-001 only` → **DQ-004 investigated and gated** (decisions/DD-018, 25 July 2026) → **DQ-004 — Established With Conditions** (decisions/DD-018, case-owner decision 25 July 2026), `dq_004_diagnosis_established: true`, `diagnosis_established_scope: DQ-001, DQ-004` — the authoritative formulation for OD-002 is narrowed per the case-owner's Condition 2 (see above) → **DQ-005 investigated and gated** (decisions/DD-019, 25 July 2026): ground-truth facts registered first, fact-by-fact correspondence test run against OC-005's three conditions and every AI-observed discrepancy, **Diagnosis Outcome: Evidence Insufficient**, no OD created, Gate Verdict **PASSED** (unconditional) → **DQ-005 — Completed, Evidence Insufficient, ACCEPTED** (decisions/DD-019, case-owner decision 25 July 2026), `dq_005_acceptance_decision: Accepted`, `dq_005_diagnosis_established: false` (no Organizational Diagnosis exists or was ever created for DQ-005) → **DQ-007 investigated and gated** (decisions/DD-020, 25 July 2026): twelve candidate explanations tested against a twelve-domain evidence-sufficiency matrix, new bounded public research directly falsified a GA4-integration mechanism and left one 13-June community-report lead unconfirmed, **Diagnosis Outcome: Evidence Insufficient**, no OD created, Gate Verdict **PASSED WITH CONDITIONS** → **DQ-007 — Completed, Evidence Insufficient, ACCEPTED WITH CONDITIONS** (decisions/DD-020, case-owner decision 25 July 2026), `dq_007_acceptance_decision: Accepted With Conditions`, `dq_007_diagnosis_established: false` (no Organizational Diagnosis exists or was ever created for DQ-007) → **DQ-002 investigated and gated** (decisions/DD-021, 25 July 2026): name-variant inventory and canonical entity baseline established, direct re-analysis of EV-014's raw Search Console export found the misspelled query family shows equal-to-better average position than the correct spelling in both directly-tested pairs, eight candidate explanations tested, Candidate Organizational Diagnosis diagnosis/OD-003-name-variant-entity-resolution.md produced and independently challenged (Survives), Gate Verdict **PASSED WITH CONDITIONS** → **DQ-002 — Established With Conditions** (decisions/DD-021, case-owner decision 25 July 2026): the authoritative formulation is narrowed to a single sentence and twelve binding conditions apply verbatim, `dq_002_diagnosis_established: true`, `diagnosis_established_scope: DQ-001, DQ-002, DQ-004` → **DQ-002 confidence corrected** (decisions/DD-021 Confidence Decision, case-owner decision 25 July 2026): OD-003's authoritative confidence set to **Medium**, narrower than the gate's original Medium-High assessment, which remains preserved unchanged as historical analysis — **this remains the case's current authoritative stage**, `current_stage: Organizational Diagnosis`. **All five of DD-016's authorized/conditionally-authorized diagnosis questions (DQ-001, DQ-002, DQ-004, DQ-005, DQ-007) have now been investigated, and every question capable of producing an Organizational Diagnosis (DQ-001, DQ-002, DQ-004) is now established.** DQ-003 and DQ-006 remain Not Authorized (Not a Diagnosis Question). `design_authorized: false`, `transformation_authorized: false`, `external_changes_authorized: false` — unaffected by any diagnosis gate to date; no cache, CDN, hosting, WordPress, code, GBP, listing, or production change is authorized; no Design Authorization Gate exists. DQ-005 and DQ-007 may only be reopened with materially new evidence and a new explicit case-owner decision. Organizational Understanding's first attempt was without valid prior authorization and was reclassified Draft — Not Authoritative (decisions/DD-012, 24 July 2026); that finding is preserved, unedited, as lifecycle history — it is not reopened or corrected by any later authorization, reconstruction, establishment, or gate review, all of which rest on independent review and explicit case-owner decision rather than on the earlier drafts.

Completed: Case Identity, Purpose, Explicit Boundaries, Observed Conditions, Lifecycle Scope declared. Prior-round Observation and Evidence exist (HV-IV-001–007). New-round Observation complete: O-001, O-002, O-003, O-004, O-011, O-012 fully collected; O-005–O-010 informed with explicit limitations where evidence is partial. work-objects/WO-001-search-visibility-baseline.md formalizes this as the case's Active, **Established** baseline work object — see its Baseline Acceptance Criteria Assessment: all nine criteria met, earned incrementally (an initial premature `true` was corrected to `Provisional`/`false`, decisions/DD-008 §6, then two genuine gaps — O-012 tooling, O-003 geo-control — were closed in turn with real evidence, EV-017 and EV-018, before the verdict returned to `true`).

**Evidence Synthesis and Justified Organizational Claims (24 July 2026, decisions/DD-010, PASSED):** claims/ES-001-evidence-synthesis-review.md reviewed all 12 observations for integrity (Verdict: PASSED, one documentation-currency issue found and corrected — O-004.md's stale CR-005 wording). Seven candidate claims (OC-001–OC-007, claims/OC-register.md) were drafted directly from WO-001, each individually challenged via an 8-question falsification test set (repository-native pattern, matching `workspace /cases/EC-001…/claims/OC-001…md`'s Falsification Tests / Boundaries / Contradictory Evidence structure). All seven survived with narrowing and were promoted to Justified Organizational Claim status. None was rejected; none asserts unsupported causation (all Causal Status: Descriptive or Associative); the case's explicitly forbidden conclusions (stable ranking, "lost" reservations, GBP-decline cause, etc.) were checked against each claim and excluded.

**Organizational Understanding — attempted, reclassified (24 July 2026, decisions/DD-012, FAILED lifecycle compliance review):** `understanding/OU-001…md` (from OC-001, OC-003, OC-004) and `understanding/OU-002…md` (from OC-005, OC-006) were drafted and gated by decisions/DD-011 on the stated basis of Kelvin's message "registratie klopt, de rest kan starten." A lifecycle compliance review found that message confirmed an evidentiary fact (Guestplan no-shows), not a named lifecycle-stage transition, and that decisions/DD-010 explicitly left Organizational Understanding "not yet begun." No prior decision authorized the transition. Both records are preserved, unmodified, but marked Draft — Prematurely Produced, Not Authoritative; decisions/DD-011's PASSED WITH CONDITIONS verdict is suspended; `current_stage` reverted to Justified Organizational Claims. **Separately, and unaffected by this correction:** Kelvin authorized Path 1 of DD-011's "Two Paths Forward" — bounded, read-only evidence collection for OC-002 (a Justified Organizational Claim under DD-010, independent of the Understanding-stage question) — see measurement/HV-MP-002-oc-002-gbp-decline-evidence-plan.md. OC-007 is classified as a Measurement/Attribution Constraint (claims/OC-007…md), not a source of "lost reservations."

**OC-002 evidence collection, executed (24 July 2026, decisions/DD-013):** measurement/HV-MP-002…md's read-only plan was executed against existing evidence (EV-015, re-read at monthly granularity) and public Google documentation — 9 of 13 items completed, 4 (E-05, E-06, E-07, E-11) blocked pending Kelvin's direct GBP access. Result recorded in observations/O-013.md and claims/OC-002-competing-explanations-register.md (10 candidate explanations, none Plausible). OC-002's claim status is unchanged (still Justified, decisions/DD-010); one overstated clause ("did not recover at any point") was narrowed in a Reassessment section appended to claims/OC-002…md, preserving the original text. decisions/DD-013's verdict, PASSED WITH CONDITIONS, does not authorize, begin, or recommend beginning Organizational Understanding — it only recommends future eligibility once the four blocked items are resolved. This work does not reopen or resolve decisions/DD-012's compliance finding.

One Design realized as Transformation (HV-INT-002, live). One Design blocked before Transformation (HV-INT-001). Two additional Transformations prepared, not deployed (HV-INT-004, HV-INT-005). One infrastructure Transformation completed and validated (HV-INT-003, GA4).

Not yet established: Organizational Understanding (Draft only, not authoritative — decisions/DD-012); Organizational Diagnosis; Evaluation. This case's authoritative lifecycle position is Justified Organizational Claims (decisions/DD-010, PASSED), plus an independently authorized, not-yet-executed read-only evidence-collection task for OC-002.

No Organizational Design or Transformation beyond the five named interventions (HV-INT-001–005) is authorized. decisions/DD-009 tracks what access/approval each remaining gap requires. decisions/DD-008 §7 tracks resolution of all four original gate-review conditions, including the `business/Marketing/` ↔ `organization/capabilities/marketing/` relationship (resolved — the former is an empty placeholder, the latter is authoritative, see capability.md and business/Marketing/README.md).
