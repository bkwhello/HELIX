# DD-016 — Diagnosis Authorization Gate
---

Date: 25 July 2026. Reviewer: Claude, acting as an **independent HELIX Diagnosis Authorization Gate Reviewer** for EC-002 — assessing readiness only, not authorized to answer any diagnosis question, create an Organizational Diagnosis, recommend a solution, authorize Design or Transformation, change an external system, or infer case-owner authorization. This document is a recommendation to Kelvin Wong as case owner.

---

## Precondition Verdict

**PASSED.** All twelve preconditions verified:

| # | Check | Result |
|---|---|---|
| P-001 | Working tree clean | Clean |
| P-002 | Active branch `feat/ec-002-visibility-baseline` | Confirmed |
| P-003 | HEAD `25122bcee6296cd4209fc9afce17bc13795f0fa6` | Confirmed |
| P-004 | Synchronized with remote | Confirmed — 0 ahead / 0 behind |
| P-005 | DD-015 records ESTABLISHED WITH CONDITIONS | Confirmed |
| P-006 | OU-003, OU-004 Established (Conditional) | Confirmed |
| P-007 | UR-001–UR-003 Established | Confirmed |
| P-008 | UR-004 remains Rejected | Confirmed |
| P-009 | OC-002 remains standalone, unexplained | Confirmed |
| P-010 | OC-007 remains a Measurement/Attribution Constraint | Confirmed |
| P-011 | Diagnosis not authorized | Confirmed — `diagnosis_authorized: false` |
| P-012 | Design, Transformation, external changes not authorized | Confirmed — all `false` |

---

## Phase 1 — Diagnosis Question Inventory and Reconciliation

### Every source location containing diagnosis questions

1. `understanding/OU-003-search-and-entity-presence.md`, section "Diagnosis Questions Enabled" — 3 questions, fullest wording.
2. `understanding/OU-004-technical-foundation.md`, section "Diagnosis Questions Enabled" — 3 questions, fullest wording.
3. `decisions/DD-015-organizational-understanding-establishment-gate.md`, section "Diagnosis Questions Enabled (questions only — no answers)" — restates the same 6 (in abbreviated wording) plus **1 additional** question tied to OC-002's standalone status, not sourced from either OU.
4. `current.md`, "Primary next action" (as of the last update before this gate) — summarized the 6 OU-sourced questions as "six," separately naming the OC-002 question as "plus one outstanding" — this is the origin of the "6" vs. "6+1" framing being reconciled here.
5. `current.md`, "Unresolved unknowns" — checked in full; two entries duplicate questions already captured (the GBP decline question, and the TTFB cause question); the remainder are factual gaps, verification tasks, or measurement/monitoring tasks, not diagnosis questions (see "Additional items considered and excluded" below).
6. `decisions/DD-005-transformation-hypotheses.md` — checked; contains H-001 through H-008, which are **Transformation-stage intervention hypotheses**, not Diagnosis-stage questions. H-003 specifically ("Removal of conflicting metadata and entity markup improves search interpretation") is cited by OU-004 as adjacent context for the OC-005/AI-error question — see the citation-precision note under DQ-005 below.

### Reconciliation: "6" vs. "6+1"

**Both counts are accurate for what they each describe; there is no arithmetic error.** OU-003 and OU-004 each enable 3 diagnosis questions of their own (6 total) — this is the correct count for "questions enabled by the Established Understandings." decisions/DD-015's own summary separately names a 7th question, explicitly labeled "Outstanding, from OC-002's standalone status (not part of any OU...)" — this question is grounded in OC-002 (a Justified Claim) directly, not in OU-003 or OU-004, because OC-002 was deliberately not integrated into either Understanding (its only relationship attempt, UR-004, was Rejected). "6+1" is therefore the complete raw inventory (7 items); "6" is the correct, narrower count of Understanding-sourced questions only. Both are preserved below as DQ-001 through DQ-007.

**However — admissibility review (Phase 1 continued, below) finds that raw source count is not the same as canonical diagnosis-question count.** Two of the seven raw items fail this task's Question Admissibility Rules and are reclassified as **Not a Diagnosis Question**, not merged or deleted. The correct canonical count of genuine, admissible diagnosis questions is **5** (DQ-001, DQ-002, DQ-004, DQ-005, DQ-007), not 6 or 7.

### Additional items considered from current.md's "Unresolved unknowns" and excluded

Checked all fifteen remaining entries: exact closing times, Instagram account ownership, formal indexation status, review recency/response data, ~34 candidate search intents, "takumi" (1,400 searches, unexplained), GTM Container Quality issues, Safari/iOS share, the 162-reservation discrepancy, the Guestplan year-over-year gap, live dashboard staleness, and Lighthouse lab scores. None introduces a new *admissible* diagnosis question:

- The 162-reservation discrepancy and the Guestplan year-over-year gap are **measurement/reconciliation tasks** (comparing two internal reports; obtaining a missing comparison period), not "why does an organizational condition occur" questions — consistent with OC-007's own framing as a Measurement/Attribution Constraint rather than a diagnosable condition.
- "Takumi" is a real, unexplained search term, but **no Justified Claim describes it as a condition** — it is a raw, uninterpreted data point within O-002's evidence, not something OC-001–OC-007 characterizes. Per the admissibility rule requiring "its target condition is supported by a Justified Claim or Established Understanding," it is **not admitted** to the canonical inventory. It remains a legitimate open curiosity, recorded here rather than silently dropped.
- The remainder (closing times, Instagram ownership, indexation status, review recency, search-intent evaluation, GTM issues, Safari share, dashboard staleness, Lighthouse scores) are factual-verification, measurement, or publishing tasks — none asks why an established condition occurs.

### Canonical Diagnosis Question Inventory

| Question ID | Exact Question | Origin | Established Foundation | Authoritative Artifacts | Evidence Available | Evidence Missing | Open Challenges | Diagnosis Domain | Duplicate of | Canonical Status |
|---|---|---|---|---|---|---|---|---|---|---|
| DQ-001 | Why do "japans restaurant utrecht" and "sushi utrecht" underperform relative to teppanyaki and omakase — is it competitive crowding, content relevance, or another factor? | OU-003 | UR-001 (Established, narrowed wording), OC-001 | OU-003, UR-001, OC-001 | EV-014, O-010 (competitor register) | Page-content audit; controlled comparison of ranking factors | None direct | Search | None | **Canonical** |
| DQ-002 | Does Konnichiwa's naming inconsistency measurably affect discovery, conversion, or any other outcome? | OU-003 | UR-001 (Established, narrowed wording), OC-004 | OU-003, UR-001, OC-004 | EV-001, EV-004, EV-014, EV-015 | Monthly/trend breakdown of variant volume (E-03, Blocking); any conversion-level data (blocked entirely by OC-007) | None direct | Entity / search | None | **Canonical** — scope must exclude "conversion" and "any other outcome" per OC-007's constraint; see Phase 2 |
| DQ-003 | Does the favorable single-point local-pack position for omakase hold across other Utrecht locations, times, and devices? | OU-003 | UR-001, OC-003 | OU-003, UR-001, OC-003 | EV-018 (single point) | Multi-point rank grid (not collected) | None direct | Local visibility | None | **Not a Diagnosis Question** — asks whether a condition generalizes, not why/through what mechanism it occurs; this is a monitoring/measurement question (see Required Special Treatment, "Local-Pack Stability") |
| DQ-004 | What is causing TTFB to be poor for roughly a quarter of mobile page loads? | OU-004 | UR-002 (Established), OC-006 | OU-004, UR-002, OC-006 | EV-017 (CrUX field data) | Server/hosting/caching configuration inspection (not previously accessed in this case) | None direct | Technical performance | Same underlying question as current.md's "Unresolved unknowns" TTFB entry — not a separate question, same DQ | **Canonical** |
| DQ-005 | Through what mechanism, if any, do OC-005's three machine-accessibility gaps relate to the AI-representation errors observed in evidence/HV-IV-004.md? *(reframed from OU-004's original phrasing for mechanism-orientation, per admissibility rule 1 — see note below)* | OU-004 | UR-002 (Established), OC-005 | OU-004, UR-002, OC-005 | EV-001, EV-011, EV-013 (structural gaps); evidence/HV-IV-004.md, evidence/HV-TS-001.md (AI test results) | A second, independent AI-test scenario beyond the one CR-003 already flags as the case's only evidence | Challenge Evidence/CR-register.md, CR-003 (Open, mitigated — AI score scoped to 1 of 30 scenarios) | Website machine readability / AI representation | None | **Canonical**, reframed. **Citation-precision note:** OU-004 cites "DD-005, H-003" as adjacent context — DD-005's H-003 is actually a Transformation-stage *intervention* hypothesis ("removal of conflicting metadata... improves search interpretation"), not a Diagnosis-stage causal question about AI errors. This gate corrects the citation: the relevant prior context is evidence/HV-IV-004.md's own AI-representation-error findings, not DD-005 H-003 directly. |
| DQ-006 | Would closing any of OC-005's three gaps produce a measurable change in search or AI-system representation? | OU-004 | UR-002, OC-005 | OU-004, UR-002, OC-005 | Same as DQ-005 | Same as DQ-005, plus the change itself (not yet made) | Same as DQ-005 | Website machine readability | Related to DQ-005 (same underlying mechanism) but not merged — see reasoning | **Not a Diagnosis Question** — "would closing... produce a change" describes and tests the effect of an intervention (closing the gaps), which this task's admissibility rules explicitly exclude ("it does not contain an intervention"). This is Design/Transformation-stage hypothesis-testing, contingent on DQ-005's outcome, not itself a Diagnosis question. |
| DQ-007 | What explains the six-month GBP engagement decline (OC-002)? | decisions/DD-015 ("Outstanding," from OC-002's standalone status) | OC-002 directly (Justified Claim; not part of any Established Understanding) | OC-002, claims/OC-002-competing-explanations-register.md | EV-015, EV-019, EV-020, EV-021, EV-022, EV-023, EV-024 | E-03 (discovery-trend), E-10 (year-over-year); E-05/E-06/E-07's remaining Partial gaps | Challenge Evidence/CR-register.md, CR-006 (Open) | Profile activity / measurement | Same question as current.md's "Unresolved unknowns" GBP-decline entry — not a separate question | **Canonical.** Per this task's explicit instruction, OC-002 is not required to relate to OU-003 or OU-004 to be considered. |

**Duplicate/merged/rejected mapping, summarized:** no two canonical questions are duplicates of each other; DQ-004 and DQ-007 each have one duplicate-in-substance entry in current.md's "Unresolved unknowns" (not separate questions, same DQ, cross-referenced above); DQ-003 and DQ-006 are reclassified Not a Diagnosis Question (not rejected outright — they remain legitimate future work, just not Diagnosis-stage work); no canonical question depends on OU-001, OU-002, or the Rejected UR-004.

---

## Phase 2 — Per-Question Readiness Assessment

| DQ | Readiness | Basis |
|---|---|---|
| DQ-001 | **READY** | Target condition established (UR-001, OC-001, both Established/Justified). Sufficient evidence exists to test at least two competing explanations (competitive crowding via O-010; content relevance via a direct page audit). Does not depend on any blocked evidence group. A falsification method is definable (compare underperforming-theme pages against O-010's named competitors on specific, checkable factors). Investigation is read-only (existing evidence plus, at most, further public competitor observation, already this case's established practice). |
| DQ-002 | **CONDITIONALLY READY** | Target condition established (UR-001, OC-004). Investigation is possible for the *visibility* portion (position/CTR comparison between correct and misspelled variants, using EV-014/EV-015). The *conversion* and *"any other outcome"* portions of the question as originally worded are **not** investigable — OC-007's Measurement/Attribution Constraint (UR-003, Established) makes any channel-to-outcome connection structurally unmeasurable at present. Explicit scope condition required: this question may be authorized only for its visibility-effect portion; its conversion/outcome portion remains blocked by UR-003 until that constraint is independently resolved. |
| DQ-003 | **NOT A DIAGNOSIS QUESTION** | Reclassified per Phase 1 — asks whether a condition generalizes (monitoring/measurement), not why or through what mechanism it occurs. Not authorized as a diagnosis question in its current form; would require reformulation around a mechanism (e.g., "what causes local-pack rank to vary by location/device, if it does") before it could be assessed as a diagnosis question, and even then would need a multi-point rank grid this case does not have. |
| DQ-004 | **CONDITIONALLY READY** | Target condition established (UR-002, OC-006). A falsification method is definable in principle (isolate DNS/connection/server-processing components of response time; check caching headers and hosting tier). However, this requires **new read-only access this case has not previously used** — server response headers, hosting configuration, or CDN/caching settings — none of which exists in the current evidence base. Explicit condition required: investigation must remain strictly read-only (inspection of response headers, public-facing configuration signals, and any information Kelvin can supply from his hosting provider's dashboard); no server, hosting, or caching configuration may be changed, which would be Transformation, not Diagnosis. |
| DQ-005 | **CONDITIONALLY READY** | Target condition established (UR-002, OC-005) and cross-referenced against existing AI-error evidence (evidence/HV-IV-004.md). Testable with evidence already in the case (compare which specific facts AI systems got wrong against which specific facts the missing structured data/unreadable menus would have supplied) — no new external access required. Condition required: any finding must stay scoped to the single tested AI scenario per CR-003 (Open, mitigated) — this diagnosis cannot generalize to "AI understanding" broadly, only to the one opening-hours/pricing scenario already tested. |
| DQ-006 | **NOT A DIAGNOSIS QUESTION** | Reclassified per Phase 1 — contains an intervention ("closing" the gaps) and asks about its hypothetical effect. Not authorized as a diagnosis question; would become relevant only after a separately-authorized Design stage, contingent on DQ-005's outcome. |
| DQ-007 | **CONDITIONALLY READY** | Target condition established (OC-002, Justified — standalone status does not disqualify it, per this task's explicit instruction). Twelve competing explanations already exist (claims/OC-002-competing-explanations-register.md) — a genuine falsification framework, already in progress, none Plausible. Investigation may continue testing these without requiring any relationship to OU-003/OU-004. Conditions required: the diagnosis must be explicitly permitted to conclude **Evidence Insufficient** as a valid, non-failure outcome; E-05/E-06/E-07's Partial status and E-03/E-10's full blocks must be explicitly carried forward and not silently treated as resolved; CR-006 must remain Open and unreconciled, kept separate from any conclusion. |

---

## Phase 3 — Foundation Matrix (READY / CONDITIONALLY READY only)

| DQ | Condition to Explain | OU/OC Foundation | Competing Explanations Available | Falsification Possible | Required Access | Risk | Readiness |
|---|---|---|---|---|---|---|---|
| DQ-001 | Uneven search visibility across four themes | OU-003 (UR-001) ← OC-001 | Competitive crowding (O-010); content relevance (page audit); category breadth (unstated, could be added) | Yes — compare specific, checkable factors per candidate explanation | Read-only (existing evidence + public page/competitor review) | Medium (see Phase 6) | READY |
| DQ-002 (visibility portion only) | Naming inconsistency's effect on visibility | OU-003 (UR-001) ← OC-004 | "No measurable effect" vs. "measurable effect on position/CTR only" — both testable; "effect on conversion" excluded from scope | Yes, for visibility metrics only | Read-only (EV-014/EV-015 re-analysis) | High (see Phase 6) | CONDITIONALLY READY |
| DQ-004 | Cause of the mobile TTFB exception | OU-004 (UR-002) ← OC-006 | Server processing time; hosting-tier limitation; caching absence; network/CDN factor | Yes, if response-time component data is obtained | Read-only technical inspection (new access — hosting/server signals) | High (see Phase 6) | CONDITIONALLY READY |
| DQ-005 | Mechanism (if any) linking OC-005's gaps to observed AI-representation errors | OU-004 (UR-002) ← OC-005, cross-referenced to evidence/HV-IV-004.md | Direct correspondence (missing markup ↔ specific AI errors); coincidental (AI errors unrelated to markup); partial correspondence | Yes, within the one tested AI scenario | Read-only (existing evidence only) | High (see Phase 6) | CONDITIONALLY READY |
| DQ-007 | Six-month GBP engagement decline | OC-002 (standalone, Justified) | Twelve already-registered candidates (claims/OC-002-competing-explanations-register.md) | Partially — several candidates remain Unassessable pending blocked evidence; some (e.g., CE-09) already Contradicted | Read-only; may request further Kelvin-supplied evidence per measurement/HV-ER-001…md | High (see Phase 6) | CONDITIONALLY READY |

---

## Phase 4 — Constraint Mapping

| Constraint | Questions Affected | Effect | Containment |
|---|---|---|---|
| E-03 (query-composition trend unavailable) | DQ-002, DQ-007 | Conditions | DQ-002: cannot test whether naming-variant search volume shifted over time, only current aggregate composition. DQ-007: any candidate explanation invoking discovery-composition change (CE-04) remains Unassessable and must stay so. |
| E-05 (profile history Partial) | DQ-007 | Conditions | The three confirmed-but-undated GBP attribute changes (CE-12) remain Unassessable for timing; DQ-007 may note their existence but may not place them within, before, or after the decline window. |
| E-06 (review history Partial) | DQ-007 | Conditions | The 8-review sample (CE-07) may be cited only within its own stated bounds (approximately dated, not a full export); DQ-007 may not extrapolate a review "trend" beyond that sample. |
| E-07 (photo/post history Partial) | DQ-007 | Conditions | The posting-gap observation (CE-06) may be cited only as "suggestive," per its own recorded status; DQ-007 may not treat it as confirmed. |
| E-10 (year-over-year data unavailable) | DQ-007 | Blocks | No seasonality-based candidate explanation (CE-01) can be tested at all; DQ-007 must treat seasonality as permanently Unassessable within this authorization, not attempt to infer it from proxy data. |
| CR-006 (review-count difference, Open) | DQ-002, DQ-007 | Conditions | Neither question may cite a single, reconciled Konnichiwa review count; both figures (605, 625) must be preserved with their dates wherever referenced. |
| OC-007 (attribution constraint) | DQ-001, DQ-002, DQ-004, DQ-005, DQ-007 | Conditions (all) | None of the five recommended questions may conclude, imply, or be extended toward any reservation or business-outcome consequence — DQ-002 is affected most directly (its "conversion"/"outcome" clause is excluded from scope entirely on this basis). |

No constraint fully **Blocks** DQ-001, DQ-004, or DQ-005 as scoped above; E-10 fully Blocks the seasonality sub-question within DQ-007 specifically, without blocking DQ-007 as a whole.

---

## Phase 5 — Candidate Diagnosis Scope

### DQ-001

#### Authorized Target Condition
The established contrast (UR-001, OU-003): teppanyaki and omakase materially outperform japans restaurant and sushi in non-branded search position, within the stated Search Console window.

#### Investigation Scope
Compare the four themes' pages and competitive context against specific, named factors — content depth/relevance, page structure, and the competitor set already identified in O-010 — without presupposing which factor, if any, explains the pattern.

#### Permitted Evidence Collection
Read-only review of konnichiwa.nl's own pages for the four themes; read-only review of already-identified competitor pages (O-010); no new Search Console export required unless Kelvin chooses to supply one.

#### Competing Explanations to Test
- Competitive crowding (broader categories face more competitors than flagship formats)
- Content relevance/depth differences between flagship and broad-category pages
- Category breadth itself (broad terms inherently harder to rank for than specific ones, independent of competition or content)

#### Required Falsification
Each candidate explanation must be checked against a specific, statable prediction (e.g., competitive crowding predicts more/stronger competitors ranking for the broad terms than the flagship terms — checkable against O-010 and public search results, within this case's existing WebSearch geo-control limitation).

#### Explicit Exclusions
- No intervention (no content or page recommendation);
- no design selection;
- no causal conclusion without surviving falsification;
- no external mutation;
- **no assumption that content is the cause by default** (per this task's explicit special-treatment instruction) — content relevance is one candidate among several, not the presumed answer.

#### Stop Conditions
- If no candidate explanation can be distinguished from the others with available evidence, the diagnosis must report this rather than select one arbitrarily.

#### Maximum Output
Candidate Diagnosis / Evidence Insufficient / Condition Reframed

---

### DQ-002 (visibility-effect portion only)

#### Authorized Target Condition
The established naming inconsistency (UR-001, OC-004) — scoped strictly to whether it measurably affects **search visibility metrics** (position, CTR, impressions). The conversion/business-outcome portion of the original question is **excluded from this authorization** per OC-007's constraint.

#### Investigation Scope
Compare Search Console and GBP metrics for the correctly-spelled entity name against the "konichiwa" misspelling and other variants, using already-collected evidence (EV-014, EV-015).

#### Permitted Evidence Collection
Read-only re-analysis of already-collected EV-014/EV-015 data; no new export required.

#### Competing Explanations to Test
- No measurable visibility difference between variants
- A measurable visibility difference exists but is fully explained by absolute search-volume differences between variants (not the naming inconsistency itself)
- A measurable visibility difference exists and is not explained by volume alone

#### Required Falsification
Compare position/CTR of the correct and misspelled forms at matched volume tiers where possible; state explicitly if the sample is too small to distinguish these.

#### Explicit Exclusions
- No intervention;
- no design selection;
- no causal conclusion without surviving falsification;
- no external mutation;
- **no conversion or business-outcome claim of any kind** — this is the question-specific exclusion required by OC-007's constraint (UR-003);
- no reconciled single review-count figure (CR-006 remains Open and irrelevant to this specific question regardless).

#### Stop Conditions
- If the visibility-effect question cannot be distinguished from noise given the available volume, report Evidence Insufficient rather than assert an effect.

#### Maximum Output
Candidate Diagnosis (visibility-effect only) / Evidence Insufficient / Condition Reframed

---

### DQ-004

#### Authorized Target Condition
The established TTFB exception (UR-002, OC-006) — poor server response time for approximately 26% of mobile page loads within the CrUX field-data window.

#### Investigation Scope
Identify which component(s) of server response time are implicated (server processing, network/CDN, caching absence) using whatever read-only technical signals are available or that Kelvin can supply from his hosting provider.

#### Permitted Evidence Collection
Read-only inspection of response headers and publicly observable technical signals; read-only information Kelvin supplies from his own hosting/CDN dashboard, if he chooses to. No login to, or configuration change within, any hosting or server system.

#### Competing Explanations to Test
- Server-side processing time (application/database layer)
- Hosting-tier or resource-limitation factor
- Absence of caching for a subset of requests
- Network/CDN routing factor

#### Required Falsification
Each candidate explanation must correspond to a distinguishable technical signature (e.g., caching absence would show consistent TTFB regardless of repeat visits; a resource limitation might correlate with traffic volume) — checkable only to the extent read-only signals allow.

#### Explicit Exclusions
- No intervention (no caching, hosting, or server change of any kind — this is the single most important exclusion for this question, since a natural next step would be to simply fix it);
- no design selection;
- no causal conclusion without surviving falsification;
- no external mutation;
- **no login to or configuration inspection within any hosting/server administrative system without Kelvin's separate, explicit access authorization for that specific system.**

#### Stop Conditions
- If no read-only signal can distinguish between candidate explanations, report Evidence Insufficient; do not request or perform any configuration change to test further.

#### Maximum Output
Candidate Diagnosis / Evidence Insufficient / Condition Reframed

---

### DQ-005

#### Authorized Target Condition
Whether OC-005's three confirmed machine-accessibility gaps (no structured data; both menus non-crawlable; one duplicate page) correspond, specifically and checkably, to the AI-representation errors already observed in evidence/HV-IV-004.md, within the single tested scenario (CR-003's scope).

#### Investigation Scope
Direct, fact-by-fact comparison: for each specific error an AI system made (per HV-IV-004.md), determine whether the correct information was (a) present but unreadable due to one of OC-005's three conditions, (b) present and readable but still misreported, or (c) absent from the site entirely for an unrelated reason.

#### Permitted Evidence Collection
Read-only comparison of existing evidence/HV-IV-004.md and evidence/HV-TS-001.md against OC-005's own documented conditions. No new AI-system queries required for this specific comparison (though Kelvin could separately supply more, which would be new evidence collection, not part of this authorization).

#### Competing Explanations to Test
- Direct correspondence (the specific missing/unreadable data explains the specific AI error)
- No correspondence (the AI error concerns information unaffected by any of OC-005's three conditions)
- Partial correspondence (some errors correspond, others do not)

#### Required Falsification
For each of HV-IV-004.md's documented errors, explicitly state which of OC-005's three conditions (if any) would have supplied the correct information, and check whether that specific condition is in fact implicated.

#### Explicit Exclusions
- No intervention;
- no design selection (this explicitly excludes DQ-006 — "would closing the gaps help" — from being answered here);
- no causal conclusion without surviving falsification;
- no external mutation;
- **no generalization beyond the single tested AI scenario** (CR-003's own scope limitation, inherited directly).

#### Stop Conditions
- If the correspondence cannot be established fact-by-fact with existing evidence, report Evidence Insufficient rather than infer a general connection.

#### Maximum Output
Candidate Diagnosis / Evidence Insufficient / Condition Reframed

---

### DQ-007

#### Authorized Target Condition
The six-month, all-metric GBP engagement decline (OC-002), February–July 2026 — a Justified, standalone Claim.

#### Investigation Scope
Continue testing the twelve already-registered candidate explanations (claims/OC-002-competing-explanations-register.md) using any further evidence Kelvin supplies per measurement/HV-ER-001-oc-002-blocked-evidence-request.md, without requiring or presupposing a connection to OU-003 or OU-004.

#### Permitted Evidence Collection
Read-only continuation of the existing evidence-request items (E-05 transition dates, E-06 fuller review export, E-07 Photos tab and list completeness); read-only re-analysis of already-collected evidence. No GBP, website, or analytics configuration change.

#### Competing Explanations to Test
The twelve candidates already in claims/OC-002-competing-explanations-register.md (CE-01 through CE-12) — no new candidate explanation may be added without a separate scope decision, to prevent unbounded scope-creep on this case's largest open question.

#### Required Falsification
Each of the twelve candidates already has a recorded status (Unsupported, Unassessable, Weakly Supported, or Contradicted) and a stated missing-evidence gap; falsification proceeds by attempting to close each specific gap, not by re-litigating already-Contradicted or already-Unsupported candidates without new evidence.

#### Explicit Exclusions
- No intervention (no GBP profile change, no marketing action);
- no design selection;
- no causal conclusion without surviving falsification — **and no single candidate may be promoted to "the" cause merely because it is the least-implausible of a weak set**;
- no external mutation;
- **the 162-reservation discrepancy (O-011) may not be characterized as lost reservations under any circumstance, regardless of this diagnosis's findings** (OC-007's own Classification, inherited directly);
- **CR-006 must remain Open and unreconciled** — no version of "the" review count may be asserted as part of this diagnosis;
- **seasonality (CE-01) and discovery-composition trend (CE-04) remain Unassessable and must not be inferred from proxy data**, per E-10 and E-03's full Blocking status.

#### Stop Conditions
- **Evidence Insufficient is an explicitly acceptable, non-failure final outcome for this question** — given the concentration of Unassessable candidates in access-blocked categories, this diagnosis may conclude that no candidate can currently be distinguished from the others, and that is a legitimate, reportable result, not a deficiency of the investigation.
- If pursuing any remaining evidence gap would require anything beyond read-only access already authorized (per measurement/HV-ER-001…md), stop and request separately-scoped access rather than proceeding.

#### Maximum Output
Candidate Diagnosis / **Evidence Insufficient** / Condition Reframed

---

## Phase 6 — Diagnosis Risk Review

| DQ | Confirmation-Bias | Post-Hoc Causality | Measurement Mismatch | Scope-Creep | Intervention Leakage | Privacy | External-Access | Containment Required |
|---|---|---|---|---|---|---|---|---|
| DQ-001 | Medium | Medium | Low | Medium | Medium | Low | Low | No High risk — Phase 5 exclusions sufficient |
| DQ-002 | Medium | **High** | Medium | Medium | Low | Low | Low | **Required:** conclusions based only on the defined falsification test, not intuitive plausibility; "no measurable effect" is an acceptable finding |
| DQ-004 | Low | Low | Medium | Medium | **High** | Low | Medium | **Required:** strict read-only exclusion (Phase 5); no configuration access without separate authorization |
| DQ-005 | Medium | **High** | Medium | Low | Medium | Low | Low | **Required:** findings scoped strictly to the single tested AI scenario (CR-003); correlation explicitly distinguished from causation |
| DQ-007 | **High** | **High** | Medium | **High** | Medium-High | Low-Medium | Medium | **Required:** Evidence Insufficient as an explicit acceptable outcome; investigation bounded to the 12 already-registered candidates only; no new candidate without separate scope approval; strict prohibition on selecting an intervention |

Every High risk identified above has an explicit containment condition in the corresponding Phase 5 section — none is left uncontained, and none is downgraded to BLOCKED, since in each case a specific, statable containment is sufficient (per this task's own rule: "Every High risk needs a containment condition or the question becomes BLOCKED").

---

## Gate Decision

**Overall recommendation: RECOMMEND AUTHORIZED WITH CONDITIONS.**

This is a question-specific recommendation, not a blanket one. One question (DQ-001) is unconditionally READY. Three (DQ-002, DQ-004, DQ-005) are READY only within an explicitly narrowed scope. One (DQ-007) is READY only under heavy, explicit containment given its concentration of High risks. Two (DQ-003, DQ-006) are not Diagnosis questions at all and are not part of this recommendation in any form.

```yaml
recommended_authorized_questions:
  - DQ-001
recommended_conditionally_authorized_questions:
  - DQ-002  # visibility-effect scope only
  - DQ-004  # strict read-only technical inspection only
  - DQ-005  # scoped to the single tested AI scenario only
  - DQ-007  # Evidence Insufficient must remain an acceptable outcome; bounded to the 12 registered candidates
blocked_questions: []
non_diagnosis_questions:
  - DQ-003  # local-pack generalization — monitoring/measurement, not diagnosis
  - DQ-006  # intervention-loaded ("would closing gaps help") — Design-stage, not Diagnosis
```

No question is currently BLOCKED outright — every canonical question that passed admissibility review reached at least CONDITIONALLY READY, given a sufficiently narrow, explicit scope. This does not mean every question is equally close to resolution: DQ-007 in particular carries the heaviest containment burden and the highest chance of concluding Evidence Insufficient, which this gate treats as a legitimate outcome, not a failure to plan for.

---

## Case-Owner Decision Boundary

Per this task's explicit instruction, this gate does not set `diagnosis_authorized: true` for any question, and does not infer authorization from general permission to "continue."

```yaml
diagnosis_authorized: false
diagnosis_authorization_decision: Pending
```

**Kelvin Wong, as case owner, is asked to issue one explicit response, naming specific questions:**

- **AUTHORIZED FOR: <DQ list>** — e.g., "AUTHORIZED FOR: DQ-001, DQ-005"
- **AUTHORIZED WITH CONDITIONS FOR: <DQ list>** — optionally specifying additional conditions beyond those already recorded in Phase 5
- **NOT AUTHORIZED**

Kelvin may authorize any subset of DQ-001, DQ-002, DQ-004, DQ-005, and DQ-007 — authorization is not required to be all-or-nothing. DQ-003 and DQ-006 are not offered for authorization, since they are not Diagnosis questions; either could be separately reformulated (DQ-003 around a mechanism) or revisited after a later Design stage (DQ-006), but neither is part of this gate.

Only after that explicit response, given as a separate, later instruction, may `diagnosis_authorized` be set to `true` for the named question(s), and may Organizational Diagnosis work begin for those questions specifically.

---

## Case-Owner Decision (recorded 25 July 2026)

**This section records Kelvin Wong's explicit response to the Gate Decision above. It does not replace, edit, or overwrite the Precondition Verdict, the Phase 1–7 analysis, the complete DQ readiness matrix, the Foundation Matrix, the Constraint Map, the per-question Candidate Diagnosis Scope, the per-question Risk Review, the original recommendation, or the "Pending" state that preceded this decision — all remain intact above, unmodified, as the historical record of the independent gate review.**

```yaml
decision: PARTIALLY AUTHORIZED WITH CONDITIONS
authorized_by: Kelvin Wong
authorization_date: 2026-07-25

authorized_questions:
  - DQ-001

conditionally_authorized_questions:
  - DQ-002
  - DQ-004
  - DQ-005
  - DQ-007

not_authorized_questions:
  - DQ-003
  - DQ-006

design_authorized: false
transformation_authorized: false
external_changes_authorized: false
```

Kelvin Wong, as case owner of EC-002 — Konnichiwa Organic Visibility Growth, issues a **question-specific, partial** authorization — not a blanket acceptance of the gate's full recommendation. Literal decision:

> AUTHORIZED FOR: DQ-001
> AUTHORIZED WITH CONDITIONS FOR: DQ-002, DQ-004, DQ-005, DQ-007
> NOT AUTHORIZED FOR: DQ-003, DQ-006

### Question-Specific Rules (binding terms of this authorization)

**DQ-001 — Authorized.**
- Preserve its bounded target condition (the established contrast: teppanyaki/omakase outperform japans restaurant/sushi in non-branded search position) exactly as scoped in Phase 5 above.
- Do not assume content is the cause — content relevance is one candidate explanation among several, not the presumed answer.
- Test the competing explanations already identified (competitive crowding, content relevance, category breadth) — do not substitute new ones without separate scope approval.
- Require falsification per the method already defined in Phase 5; no conclusion may be asserted without it surviving that test.

**DQ-002 — Authorized With Conditions.**
- Visibility scope only, exactly as narrowed in Phase 5 (position/CTR comparison between the correct and misspelled entity-name forms).
- Conversion and business-outcome effects remain excluded, per OC-007's Measurement/Attribution Constraint (UR-003) — this exclusion is not lifted by this authorization.
- Do not presume the naming inconsistency has an effect — "no supported effect" is an explicitly acceptable, non-failure result.
- CR-006 remains Open and unreconciled; this question does not depend on or resolve it.

**DQ-003 — Not Authorized.**
- Classification: Monitoring, not Diagnosis, unchanged from decisions/DD-016's Phase 1/2 finding.
- May not enter the Diagnosis work queue in its current form. Reformulation around a mechanism (per Phase 2's own note) would require a separate, future gate review — not granted by this decision.

**DQ-004 — Authorized With Conditions.**
- Diagnose only the mobile TTFB *mechanism* (which component of response time is implicated) — exactly as scoped in Phase 5.
- Do not infer user impact, ranking impact, or reservation impact without separate, independently-collected evidence — none of those is established or authorized for testing here.
- Preserve the field-data (CrUX, EV-017) vs. lab-data (Lighthouse, unobtained per O-012) distinction — this diagnosis may use only the former.
- Investigation remains strictly read-only, per Phase 5's exclusions; no hosting, server, or caching configuration access beyond what Kelvin voluntarily supplies, and no configuration change under any circumstance.

**DQ-005 — Authorized With Conditions.**
- This diagnosis must first confirm that the AI-representation errors it examines are independently observed (evidence/HV-IV-004.md, evidence/HV-TS-001.md) — it may not presuppose that OC-005's gaps caused them.
- Do not presume OC-005's gaps caused those errors — the fact-by-fact correspondence test defined in Phase 5 must actually be run, not assumed.
- If the target error condition (a specific, checkable AI error tied to a specific missing/unreadable data point) cannot be established from existing evidence, **stop with Evidence Insufficient** rather than proceed on inference.
- Scope remains limited to the single AI scenario CR-003 already flags (Open, mitigated) — no generalization to "AI understanding" broadly.

**DQ-006 — Not Authorized.**
- Classification: intervention-loaded question, unchanged from decisions/DD-016's Phase 1/2 finding.
- Prohibited from Diagnosis entirely under this decision.
- May be reconsidered only in a later Design or Transformation context, contingent on DQ-005's outcome, and only after a separate authorization — not implied or pre-approved by this decision.

**DQ-007 — Authorized With Conditions.**
- OC-002 remains a standalone target condition — this authorization does not require or invent any relationship to OU-003 or OU-004.
- E-05, E-06, and E-07's Partial limitations remain binding exactly as recorded in decisions/DD-013 and observations/O-013.md — this diagnosis may not treat any of them as complete.
- E-03 and E-10 remain fully Blocking for any seasonality- or discovery-composition-trend-based candidate explanation (CE-01, CE-04) — these remain Unassessable and may not be inferred from proxy data.
- CR-006 remains Open and unreconciled — no single review-count figure may be asserted.
- The twelve already-registered competing explanations (claims/OC-002-competing-explanations-register.md) must be tested per Phase 5's falsification method — no new candidate without separate scope approval.
- **"Evidence Insufficient" is an explicitly acceptable outcome** for this question, given the concentration of Unassessable candidates in access-blocked categories — this is not to be treated as investigation failure.
- The 162-reservation discrepancy (O-011) may not be characterized as lost reservations under any circumstance, regardless of this diagnosis's findings.

### Explicitly Not Authorized by This Decision

Design, Transformation, and external changes of any kind (`design_authorized: false`, `transformation_authorized: false`, `external_changes_authorized: false`) — none of the five authorized/conditionally-authorized questions may be answered by proposing or implementing an intervention. DQ-003 and DQ-006 remain outside the Diagnosis work queue entirely. No Organizational Diagnosis has been created, started, or answered by this decision — it authorizes the *opening* of separate, bounded investigations for DQ-001, DQ-002, DQ-004, DQ-005, and DQ-007, each still subject to its own containment conditions above and in the Candidate Diagnosis Scope (Phase 5) sections of this gate.

### Effect on Lifecycle State

`current_stage` transitions to `Organizational Diagnosis`. `diagnosis_authorized` becomes `true`, scoped to the five named questions. `diagnosis_established` remains `false` — no diagnosis has been performed for any question. `design_authorized`, `transformation_authorized`, `transformation_started`, and `external_changes_authorized` all remain `false`. See current.md for the full updated Formal State block.
