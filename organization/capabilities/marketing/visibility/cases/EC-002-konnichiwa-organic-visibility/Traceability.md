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

## Lifecycle Traceability

Current stage: Case Establishment **Completed** (decisions/DD-008) → Observation and Evidence Collection **Completed**, baseline **Established** → Evidence Synthesis and Justified Organizational Claims **Completed** (decisions/DD-010, 24 July 2026, PASSED) → Organizational Understanding **Authorized With Conditions** (decisions/DD-014, case-owner decision 24 July 2026) → Reconstructed and gated PASSED WITH CONDITIONS (decisions/DD-015, 24 July 2026) → **Organizational Understanding — Established With Conditions** (decisions/DD-015, case-owner decision 25 July 2026) → Diagnosis Authorization Gate reviewed and recommended AUTHORIZED WITH CONDITIONS, question-specific (decisions/DD-016, 25 July 2026) → **Organizational Diagnosis — Partially Authorized With Conditions** (decisions/DD-016, case-owner decision 25 July 2026), `current_stage: Organizational Diagnosis` → **DQ-001 investigated and gated** (decisions/DD-017, 25 July 2026) → **DQ-001 — Established With Conditions** (decisions/DD-017, case-owner decision 25 July 2026), `dq_001_diagnosis_established: true`, `diagnosis_established_scope: DQ-001 only` → **DQ-004 investigated and gated** (decisions/DD-018, 25 July 2026) → **DQ-004 — Established With Conditions** (decisions/DD-018, case-owner decision 25 July 2026), `dq_004_diagnosis_established: true`, `diagnosis_established_scope: DQ-001, DQ-004` — the authoritative formulation for OD-002 is narrowed per the case-owner's Condition 2 (see above) — **this remains the case's current authoritative stage**, `current_stage: Organizational Diagnosis`. DQ-002, DQ-005, DQ-007 remain Authorized With Conditions but **not started, not established**; DQ-003 and DQ-006 remain Not Authorized (Not a Diagnosis Question). `design_authorized: false`, `transformation_authorized: false`, `external_changes_authorized: false` — unaffected by either establishment; no cache, CDN, hosting, WordPress, code, or production change is authorized; no Design Authorization Gate exists. Organizational Understanding's first attempt was without valid prior authorization and was reclassified Draft — Not Authoritative (decisions/DD-012, 24 July 2026); that finding is preserved, unedited, as lifecycle history — it is not reopened or corrected by any later authorization, reconstruction, establishment, or gate review, all of which rest on independent review and explicit case-owner decision rather than on the earlier drafts.

Completed: Case Identity, Purpose, Explicit Boundaries, Observed Conditions, Lifecycle Scope declared. Prior-round Observation and Evidence exist (HV-IV-001–007). New-round Observation complete: O-001, O-002, O-003, O-004, O-011, O-012 fully collected; O-005–O-010 informed with explicit limitations where evidence is partial. work-objects/WO-001-search-visibility-baseline.md formalizes this as the case's Active, **Established** baseline work object — see its Baseline Acceptance Criteria Assessment: all nine criteria met, earned incrementally (an initial premature `true` was corrected to `Provisional`/`false`, decisions/DD-008 §6, then two genuine gaps — O-012 tooling, O-003 geo-control — were closed in turn with real evidence, EV-017 and EV-018, before the verdict returned to `true`).

**Evidence Synthesis and Justified Organizational Claims (24 July 2026, decisions/DD-010, PASSED):** claims/ES-001-evidence-synthesis-review.md reviewed all 12 observations for integrity (Verdict: PASSED, one documentation-currency issue found and corrected — O-004.md's stale CR-005 wording). Seven candidate claims (OC-001–OC-007, claims/OC-register.md) were drafted directly from WO-001, each individually challenged via an 8-question falsification test set (repository-native pattern, matching `workspace /cases/EC-001…/claims/OC-001…md`'s Falsification Tests / Boundaries / Contradictory Evidence structure). All seven survived with narrowing and were promoted to Justified Organizational Claim status. None was rejected; none asserts unsupported causation (all Causal Status: Descriptive or Associative); the case's explicitly forbidden conclusions (stable ranking, "lost" reservations, GBP-decline cause, etc.) were checked against each claim and excluded.

**Organizational Understanding — attempted, reclassified (24 July 2026, decisions/DD-012, FAILED lifecycle compliance review):** `understanding/OU-001…md` (from OC-001, OC-003, OC-004) and `understanding/OU-002…md` (from OC-005, OC-006) were drafted and gated by decisions/DD-011 on the stated basis of Kelvin's message "registratie klopt, de rest kan starten." A lifecycle compliance review found that message confirmed an evidentiary fact (Guestplan no-shows), not a named lifecycle-stage transition, and that decisions/DD-010 explicitly left Organizational Understanding "not yet begun." No prior decision authorized the transition. Both records are preserved, unmodified, but marked Draft — Prematurely Produced, Not Authoritative; decisions/DD-011's PASSED WITH CONDITIONS verdict is suspended; `current_stage` reverted to Justified Organizational Claims. **Separately, and unaffected by this correction:** Kelvin authorized Path 1 of DD-011's "Two Paths Forward" — bounded, read-only evidence collection for OC-002 (a Justified Organizational Claim under DD-010, independent of the Understanding-stage question) — see measurement/HV-MP-002-oc-002-gbp-decline-evidence-plan.md. OC-007 is classified as a Measurement/Attribution Constraint (claims/OC-007…md), not a source of "lost reservations."

**OC-002 evidence collection, executed (24 July 2026, decisions/DD-013):** measurement/HV-MP-002…md's read-only plan was executed against existing evidence (EV-015, re-read at monthly granularity) and public Google documentation — 9 of 13 items completed, 4 (E-05, E-06, E-07, E-11) blocked pending Kelvin's direct GBP access. Result recorded in observations/O-013.md and claims/OC-002-competing-explanations-register.md (10 candidate explanations, none Plausible). OC-002's claim status is unchanged (still Justified, decisions/DD-010); one overstated clause ("did not recover at any point") was narrowed in a Reassessment section appended to claims/OC-002…md, preserving the original text. decisions/DD-013's verdict, PASSED WITH CONDITIONS, does not authorize, begin, or recommend beginning Organizational Understanding — it only recommends future eligibility once the four blocked items are resolved. This work does not reopen or resolve decisions/DD-012's compliance finding.

One Design realized as Transformation (HV-INT-002, live). One Design blocked before Transformation (HV-INT-001). Two additional Transformations prepared, not deployed (HV-INT-004, HV-INT-005). One infrastructure Transformation completed and validated (HV-INT-003, GA4).

Not yet established: Organizational Understanding (Draft only, not authoritative — decisions/DD-012); Organizational Diagnosis; Evaluation. This case's authoritative lifecycle position is Justified Organizational Claims (decisions/DD-010, PASSED), plus an independently authorized, not-yet-executed read-only evidence-collection task for OC-002.

No Organizational Design or Transformation beyond the five named interventions (HV-INT-001–005) is authorized. decisions/DD-009 tracks what access/approval each remaining gap requires. decisions/DD-008 §7 tracks resolution of all four original gate-review conditions, including the `business/Marketing/` ↔ `organization/capabilities/marketing/` relationship (resolved — the former is an empty placeholder, the latter is authoritative, see capability.md and business/Marketing/README.md).
