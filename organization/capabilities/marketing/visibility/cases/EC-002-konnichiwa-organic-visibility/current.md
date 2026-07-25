# Current State — EC-002
---

Last updated: 25 July 2026 (Case-owner diagnosis decision recorded, decisions/DD-016: Kelvin Wong issued **PARTIALLY AUTHORIZED WITH CONDITIONS** — DQ-001 Authorized; DQ-002, DQ-004, DQ-005, DQ-007 Authorized With Conditions (each with binding, question-specific containment); DQ-003, DQ-006 Not Authorized. `current_stage` transitions to Organizational Diagnosis; `diagnosis_authorized` becomes `true`, scoped to the five named questions. `diagnosis_established` remains `false` — no investigation has begun for any question. Design, Transformation, and external changes remain unauthorized.).

## Formal State (per decisions/DD-012 lifecycle compliance review; evidence-collection fields per decisions/DD-013; authorization fields per decisions/DD-014; establishment fields per decisions/DD-015; diagnosis fields per decisions/DD-016)

```yaml
status: Open
current_stage: Organizational Diagnosis
case_establishment: Completed
baseline_state: Established
baseline_established: true
evidence_synthesis: Completed
claims_gate: Passed
justified_claims_established: true
organizational_understanding_authorized: true
organizational_understanding_established: true
organizational_understanding_gate: Authorized With Conditions (decisions/DD-014, case-owner decision recorded 24 July 2026)
organizational_understanding_note: OU-001 and OU-002 remain Draft — Prematurely Produced / Not Authoritative (decisions/DD-012), Historical Draft — Superseded (decisions/DD-015) — unmodified, not promoted. OC-002 remains a Standalone Condition; OC-007 remains a Measurement/Attribution Constraint.
understanding_reconstruction: Completed (decisions/DD-015, 24 July 2026)
understanding_establishment_gate: Passed With Conditions (decisions/DD-015)
understanding_establishment_decision: Established With Conditions (Kelvin Wong, 25 July 2026, decisions/DD-015 Case-Owner Decision section)
established_understandings:
  - OU-003 — Search and Entity Presence Pattern
  - OU-004 — Technical Foundation Duality
oc002_evidence_collection: Partially Completed (decisions/DD-013, 24 July 2026, updated) — 10 of 13 HV-MP-002 items at Completed or Partial; 2 (E-03, E-10) structurally unavailable
oc_002_blocked_evidence:
  e_05: Partial
  e_06: Partial
  e_07: Partial
  e_11: Completed
oc002_evidence_sufficiency_gate: Passed With Conditions (decisions/DD-013, reassessed 24 July 2026 — verdict unchanged)
understanding_authorization_gate:
  review_completed: true
  recommendation: AUTHORIZED WITH CONDITIONS (decisions/DD-014, 24 July 2026)
  case_owner_decision: AUTHORIZED WITH CONDITIONS (Kelvin Wong, 24 July 2026, decisions/DD-014 Case-Owner Decision section)
diagnosis_authorization_gate:
  review_completed: true
  recommendation: AUTHORIZED WITH CONDITIONS, question-specific (decisions/DD-016, 25 July 2026)
  recommended_authorized: [DQ-001]
  recommended_conditionally_authorized: [DQ-002, DQ-004, DQ-005, DQ-007]
  non_diagnosis_questions: [DQ-003, DQ-006]
  case_owner_decision: Partially Authorized With Conditions (Kelvin Wong, 25 July 2026, decisions/DD-016 Case-Owner Decision section)
diagnosis_authorization_decision: Partially Authorized With Conditions
authorized_diagnosis_questions:
  - DQ-001
conditionally_authorized_diagnosis_questions:
  - DQ-002
  - DQ-004
  - DQ-005
  - DQ-007
not_authorized_diagnosis_questions:
  - DQ-003
  - DQ-006
diagnosis_authorized: true
diagnosis_established: false
design_authorized: false
transformation_started: false
transformation_authorized: false
external_changes_authorized: false
next_action: Establish separate bounded diagnosis investigations for the five authorized questions (DQ-001, DQ-002, DQ-004, DQ-005, DQ-007), each under its own containment conditions per decisions/DD-016
```

**Correction, 24 July 2026 (decisions/DD-012):** the previous version of this record set `current_stage: Organizational Understanding` and `organizational_understanding_established: true` on the basis of Kelvin's message "registratie klopt, de rest kan starten," interpreted as authorization to begin that stage. A lifecycle compliance review found this insufficient: that message confirmed an evidentiary fact (Guestplan no-shows), not a named lifecycle-stage transition, and decisions/DD-010 explicitly states Organizational Understanding was "not yet begun" after the Claims gate passed. No prior decision authorized the transition. OU-001 and OU-002 are preserved, unmodified, but reclassified **Draft — Prematurely Produced, Not Authoritative**. `current_stage` is reverted to `Justified Organizational Claims`, the last validly-gated stage (decisions/DD-010, PASSED).

**Separately, and unaffected by the above:** Kelvin authorized Path 1 of decisions/DD-011's "Two Paths Forward" for OC-002 (a Justified Organizational Claim under DD-010, independent of the Understanding-stage question) — gather additional evidence on the GBP decline before any diagnosis; the decline itself is not to be treated as a diagnosis, and no intervention is to be selected yet. See measurement/HV-MP-002-oc-002-gbp-decline-evidence-plan.md.

**Prior corrections preserved:**

**Correction accepted, 24 July 2026:** an earlier version of this record set `baseline_established: true` on the reasoning that the underlying HV-BL-001 data was real and complete. That reasoning was insufficiently rigorous — completeness of *data collection* is not the same as satisfying the case's *baseline acceptance criteria*. `baseline_state` was corrected to `Provisional` / `baseline_established: false` until the criteria were actually, verifiably met.

**Remediation, same day:** O-012 was attempted twice by Claude (PageSpeed Insights API, then a fresh interactive-tool analysis) and genuinely blocked by tooling (HTTP 429 without an API key; async-loading page). Kelvin then supplied a completed PSI report URL directly — that succeeded, yielding real Chrome UX Report field data (EV-017): Core Web Vitals Passed on both mobile and desktop, with one flagged soft spot (TTFB 26% poor). That closed 8 of 9 criteria. O-003 was first given a documented, explicitly-limited WebSearch method with no Utrecht geographic control (Konnichiwa position 3 of 5, not conclusive). **Kelvin then performed the genuine Utrecht-located check this had been waiting for**: mobile, Chrome Incognito, logged out, Google-confirmed Utrecht region, 24 July 2026 06:41 — Konnichiwa at local-pack position 2 of 3 (EV-018). This resolved CR-005 for the initial baseline and closed the ninth and final criterion. See work-objects/WO-001-search-visibility-baseline.md's Baseline Acceptance Criteria Assessment for the full table and history.

## Current lifecycle stage

Case Establishment: **Completed** (decisions/DD-008). Observation and Evidence Collection: **Completed**, baseline Established. Evidence Synthesis and Justified Organizational Claims: **Completed** (decisions/DD-010, PASSED, 24 July 2026) — 7 of 7 candidate claims promoted. Organizational Understanding: **first attempt was without valid authorization, reclassified Draft — Not Authoritative** (decisions/DD-012, 24 July 2026) — OU-001 and OU-002 remain in that state, unmodified, now additionally Historical Draft — Superseded. **Authorization Gate reviewed** (decisions/DD-014, 24 July 2026), then Kelvin authorized. **Reconstructed** (decisions/DD-015, 24 July 2026) directly from OC-001–OC-007: four candidate relationships constructed and independently challenged (three survive — UR-001, UR-002, UR-003; one Rejected and preserved — UR-004); two new candidate Understanding records survive challenge (OU-003, OU-004). **Established** (decisions/DD-015 Case-Owner Decision, Kelvin Wong, 25 July 2026) — **ESTABLISHED WITH CONDITIONS.** OU-003 and OU-004 are now **Established Organizational Understanding** (Conditional); UR-001 (narrowed wording only), UR-002, UR-003 are **Established Relationships**; UR-004 remains **Rejected**, authoritative use prohibited. OC-002 remains a Standalone Condition; OC-007 remains a Measurement/Attribution Constraint. **This is now the case's current authoritative stage** — `current_stage: Organizational Understanding`, `organizational_understanding_authorized: true`, `organizational_understanding_established: true`. Organizational Diagnosis: **Not started, not authorized** — `diagnosis_authorized: false`. **Diagnosis Authorization Gate reviewed** (decisions/DD-016, 25 July 2026) — canonical inventory reconciled to 5 admissible diagnosis questions (DQ-001, DQ-002, DQ-004, DQ-005, DQ-007) plus 2 reclassified Not a Diagnosis Question (DQ-003, DQ-006); recommendation **AUTHORIZED WITH CONDITIONS**, question-specific — DQ-001 READY, DQ-002/DQ-004/DQ-005/DQ-007 CONDITIONALLY READY under explicit scope. Kelvin then issued **PARTIALLY AUTHORIZED WITH CONDITIONS** (decisions/DD-016, Case-Owner Decision, 25 July 2026): DQ-001 **Authorized**; DQ-002, DQ-004, DQ-005, DQ-007 **Authorized With Conditions**, each bound by its own question-specific rules recorded in full in that section; DQ-003 and DQ-006 remain **Not Authorized** (Not a Diagnosis Question). `current_stage` is now **Organizational Diagnosis**, `diagnosis_authorized: true`. **Organizational Diagnosis itself remains not started and not established** — `diagnosis_established: false` — this authorization opens the possibility of separate, bounded investigations for the five named questions; none has begun. OC-002 evidence collection (Path 1, decisions/DD-011 amendment): **Executed, Partially Completed** (observations/O-013.md, decisions/DD-013, 24 July 2026) — Evidence Sufficiency Gate **PASSED WITH CONDITIONS**.

## Completed artifacts

- Case Identity, Purpose, Explicit Boundaries, Observed Conditions, Lifecycle Scope, Traceability, References — all written 23 July 2026.
- evidence/HV-IV-001 through HV-IV-007 — prior-round investigations, 22 July 2026, all evidence-backed.
- design/HV-VCM-001.md — first Visibility Coverage Map, Draft v0.1.
- design/structured-data-website.md — JSON-LD Restaurant schema, prepared, not published.
- design/omakase-pagina-brief.md — omakase page design, complete, realized.
- transformation/HV-IR-001.md — HV-INT-002 (omakase + teppanyaki menu pages) confirmed live 22 July 2026; HV-INT-001 (structured data + corrected hours) partially live (text fix only); **HV-INT-003 (GA4 Google-tag publicatie) live 23 July 2026** — a 2-month-old unpublished GA4 tag was found and published during O-011/GA4 troubleshooting.
- measurement/HV-MP-001.md, HV-BL-001.md, HV-DB-001.md (v1–v4), TC-register.md, 30-day-baseline-metrics.md.
- work-objects/WO-active-register.md, WO-legacy-register.md, HV-AR-001.md (not active).
- claims/EC-002-CL-candidate-register.md, understanding/EC-002-VD-taxonomy.md.
- decisions/DD-001 through DD-007.
- Challenge Evidence/CR-register.md — 5 open challenges (CR-001 through CR-005).
- **observations/O-001.md — Collected (23 July 2026).** Real Search Console data (EV-014, `evidence/raw/search-console-2026-07-23/`), 90-day window (data through 21 June 2026 due to reporting lag). Updated O-004.md and O-008.md with real figures. Updated measurement/HV-BL-001.md website baseline from "TE LEVEREN" to complete.
- **observations/O-002.md — Collected (23 July 2026).** Real Google Business Profile data (EV-015, `evidence/raw/gbp-performance-2026-07-23/`), 6-month window (Feb–Jul 2026). Updated measurement/HV-BL-001.md local baseline from "TE LEVEREN" to complete.
- **observations/O-011.md — Business volume collected (24 July 2026).** Real Guestplan data (EV-016), 90-day window (23 Apr–23 Jul 2026, exact match to the required period). Updated measurement/HV-BL-001.md business baseline — **all four baseline sections are now complete.** Channel-specific conversion attribution (which reservations came from organic/GBP) remains open, pending the three known tracking gaps.
- **transformation/HV-IR-001.md — HV-INT-004 (popup fix) and HV-INT-005 (mobile page-title overflow fix) prepared, 24 July 2026.** Both fixed in the local theme copy (`Local Sites/konnichiwa/.../themes/konnichiwa/`), not yet deployed via FTP.
- **decisions/DD-008 — EC-002 Case Establishment Gate Review, 24 July 2026.** Verdict: PASSED WITH CONDITIONS. Verified all AD-014 mandatory invariants present; verified all 5 migrated HV artifacts preserved ID/history/epistemic-status/traceability. Four conditions raised (HV-DB-001 dashboard stale; business/Marketing duplication remains open; WO-001 needed formalizing — done same task; O-012 has no legitimate blocker).
- **work-objects/WO-001-search-visibility-baseline.md — promoted from Candidate to Active, 24 July 2026.** Structured register of all 12 baseline observations with collection question/source/method/date range/access/evidence artifact/limitations/confidence/owner/blocker status per observation.
- **decisions/DD-009 — Access and Approval Register, 24 July 2026.** Separates read-only requests, data-export requests, configuration-change requests, and external-change approvals. No external system changed while producing it.
- **observations/O-012.md — Collected, 24 July 2026.** Real Chrome UX Report field data (EV-017), obtained after Kelvin supplied a completed PageSpeed Insights report URL. Core Web Vitals Passed on mobile and desktop. Two prior automated attempts (API, fresh interactive analysis) had failed with no numbers fabricated at any point.
- **observations/O-003.md — Collected, 24 July 2026 (EV-018).** Genuinely Utrecht-controlled Google local-pack observation performed by Kelvin (mobile, Chrome Incognito, logged out, Utrecht region confirmed): Konnichiwa at position 2 of 3 for "omakase utrecht." Satisfies O-003's original requirement for an initial baseline. A prior WebSearch-based proxy attempt (no geo-control, position 3 of 5) is retained in the record but superseded.
- **Challenge Evidence/CR-register.md, CR-005 — Resolved for Initial Baseline, 24 July 2026.** EV-018 corroborates Search Console's optimistic reading over the earlier non-geo-controlled checks. Limitation preserved: single point/time/device, not a multi-point grid.
- **measurement/HV-DB-001.md — regenerated as v5, 24 July 2026.** Per-source status matrix (Measured/Pending/Unavailable/Not Configured) with last-measured dates; no missing data shown as zero. The *published, live* dashboard page has not itself been republished — separate follow-up.
- **business/Marketing/README.md — created, 24 July 2026.** Points to `organization/capabilities/marketing/` as authoritative for capability engineering; clarifies `business/Marketing/` is an empty structural placeholder, not a competing authority. `capability.md`'s relationship section rewritten to match.
- **decisions/DD-008 §6–7 — correction and condition resolution recorded, 24 July 2026.**
- **claims/ES-001-evidence-synthesis-review.md — created, 24 July 2026.** Observation-to-evidence readiness matrix for all 12 O-###; Evidence Integrity Verdict: PASSED. Flagged and separately corrected one documentation-currency issue (O-004.md's stale CR-005 wording).
- **claims/OC-001 through OC-007 — created, 24 July 2026.** Seven candidate Organizational Claims, each with embedded falsification testing (repository-native pattern from `workspace /cases/EC-001…/claims/OC-001…md`). All seven: Challenge Outcome "Survives with Narrowing," promoted to Justified Organizational Claim. Full list, confidence, and evidence in claims/OC-register.md.
- **claims/OC-register.md — created, 24 July 2026.** Index of all seven claims; explicit record of why O-009/O-010 were not drafted as standalone claims; confirms zero claims rejected, zero left at "Requires More Evidence" this round.
- **decisions/DD-010 — Justified Organizational Claims Gate Review, 24 July 2026.** Verdict: PASSED. All seven gate criteria met (evidence synthesis complete, traceability, challenge survival, explicit scope/limitations, no unsupported causal language, rejected/conditional claims preserved, current.md brought into agreement).
- **observations/O-004.md — corrected, 24 July 2026.** Stale "CR-005 not resolved" / "not yet promoted" wording updated to reflect the actual, already-resolved state and OC-001's promotion.
- **observations/O-011.md, claims/OC-007…md — no-shows figure confirmed, 24 July 2026.** Kelvin confirmed Guestplan's 0% no-shows over 90 days is an accurate registration, not a tracking gap. OC-007's Limitations/Alternative Interpretations/Boundaries updated accordingly; the 162-reservation discrepancy remains separately open (not addressed by this confirmation).
- **understanding/OU-001 – Konnichiwa's Search and Entity Presence for Flagship Dining Formats — created, 24 July 2026.** Synthesizes OC-001, OC-003, OC-004: strong, cross-corroborated presence for teppanyaki/omakase; weaker, unexplained presence for broader categories; naming inconsistency coexists with, does not explain, the pattern.
- **understanding/OU-002 – Sound Technical Foundation With Targeted Content-Accessibility Gaps — created, 24 July 2026.** Synthesizes OC-005, OC-006: page performance is good; content machine-accessibility has three specific, separate gaps.
- **understanding/README.md — created, 24 July 2026.** Explicitly documents that OC-002 and OC-007 are not integrated into any Understanding, and why — not a silent omission.
- **decisions/DD-011 — Organizational Understanding Gate Review, 24 July 2026.** Original verdict PASSED WITH CONDITIONS, now **suspended** (see decisions/DD-012). Amended same day with Kelvin's Path 1 authorization for OC-002 evidence collection, which stands independently.
- **decisions/DD-012 — Lifecycle Compliance Review, 24 July 2026.** Verdict: FAILED. Found that Organizational Understanding was entered without a prior authorizing decision. OU-001/OU-002 reclassified Draft — Not Authoritative; `current_stage` reverted to Justified Organizational Claims; explicit case-owner authorization required before re-entry.
- **measurement/HV-MP-002-oc-002-gbp-decline-evidence-plan.md — created, 24 July 2026.** Bounded, 13-item read-only evidence-collection plan for the GBP decline, authorized under Path 1.
- **claims/OC-007…md — Classification added, 24 July 2026.** Classified as a Measurement/Attribution Constraint limiting evaluation of visibility-to-reservation performance; the unexplained reservation difference is explicitly not represented as lost reservations.
- **observations/O-013.md — created, 24 July 2026.** OC-002 evidence-collection execution: 9 of 13 HV-MP-002 items completed using existing raw evidence (EV-015 re-read at monthly granularity) and public Google documentation (E-12); 4 items (E-05, E-06, E-07, E-11) blocked, requiring Kelvin's direct GBP access. Key finding: the GBP decline is not strictly monotonic — a brief plateau/partial recovery appears around April–May in all six metrics before the decline resumes and steepens in June–July.
- **claims/OC-002-competing-explanations-register.md — created, 24 July 2026.** 10 candidate explanations for the GBP decline assessed; none reaches "Plausible"; two "Weakly Supported" (narrow scope only); one "Contradicted"; seven "Unassessable," concentrated in the blocked evidence categories.
- **claims/OC-002…md — Reassessment section added, 24 July 2026.** Claim status unchanged (Justified Organizational Claim); wording "did not recover at any point" narrowed as overstated; original claim text preserved unmodified above the new section.
- **decisions/DD-013 — OC-002 Evidence Sufficiency Gate, 24 July 2026.** Verdict: PASSED WITH CONDITIONS. Decline now well-characterized; not yet sufficient to support Organizational Understanding for OC-002. Recommends "Eligible for a future Understanding Authorization decision" once conditions are met — does not itself authorize Understanding.
- **measurement/HV-ER-001-oc-002-blocked-evidence-request.md — created, 24 July 2026.** Evidence Request Package for E-05/E-06/E-07/E-11: a follow-up attempt to complete these four items found no authenticated GBP access available and no new data supplied, so — per this task's own rule — no new observation was fabricated; instead this package specifies exactly what Kelvin would need to supply, including the Operational Context Declaration questionnaire. Waiting on Kelvin.
- **Challenge Evidence/CR-register.md, CR-006 — created, 24 July 2026.** Konnichiwa's Google review count is not a single figure: 605 (evidence/HV-IV-001.md, 22 July 2026, general search results) and 625 (observations/O-003.md addendum, 24 July 2026, local-pack surface, Owner Declaration) are both now supported, at different dates. **Open — both preserved, no cause inferred.** Any future reference to "the" review count must cite which figure and date.
- **observations/O-013.md, EV-020 — E-11 Operational Context Declaration completed, 24 July 2026.** Kelvin answered all 13 questions No (no closure, hour change, capacity reduction, menu/pricing change, renovation, staffing constraint, or known promotional cause for the April–May movement). Recorded as an Owner Declaration, Medium confidence, scoped narrowly to the thirteen examined categories — not treated as proof no operational cause of any kind existed. claims/OC-002-competing-explanations-register.md updated with a new row, CE-11, status Unsupported.
- **decisions/DD-013 — Reassessment section added, 24 July 2026.** Evidence Sufficiency **Remains PASSED WITH CONDITIONS** (unchanged) — no new evidence arrived to advance or fail the verdict; the four Conditions stand.
- **observations/O-013.md, EV-021/EV-022/EV-023 — E-05/E-06/E-07 screenshot intake, 24 July 2026.** Kelvin supplied 14 GBP screenshots (Bedrijfsgegevens panel, review list, Posts panel). All three items move **Blocked → Partial**: current profile configuration fully documented plus 3 confirmed (but undated) Google-attributed attribute changes (E-05); an 8-review sample, avg 4.75★, 0/8 visible owner responses (E-06, no new total — CR-006 unaffected); 5 Google Posts, all labeled "vorig jaar" (E-07, Photos tab not supplied). **Capture date Unknown for all 14 images** — the limiting factor throughout.
- **claims/OC-002-competing-explanations-register.md — updated, 24 July 2026.** CE-06 and CE-07 upgraded to Weakly Supported; new row CE-12 (GBP-side attribute change) added, Unassessable. No explanation reaches Plausible.
- **decisions/DD-013 — Third Reassessment added, 24 July 2026.** Evidence Sufficiency **Remains PASSED WITH CONDITIONS**; Recommendation upgraded to "Eligible for case-owner consideration of an Understanding Authorization Gate" (does not itself authorize Understanding).
- **observations/O-013.md, EV-024 — screenshot capture date confirmed, 24 July 2026.** Kelvin's Owner Declaration confirms all 14 E-05/E-06/E-07 screenshots were captured 2026-07-24. Content vs. metadata classification preserved throughout (screenshots remain Direct System Screenshot evidence; the date itself is Owner Declaration). E-06 review sample now approximately dated within the investigation window (derived, week-level); E-07 posts now readable as likely pre-dating it. Per explicit instruction, **no status was promoted merely because the date is known** — E-05, E-06, E-07 remain **Partial**. CR-006 unaffected.
- **decisions/DD-013 — Fourth Reassessment added, 24 July 2026.** Evidence Sufficiency **Remains PASSED WITH CONDITIONS**; same Recommendation retained. Remaining Conditions narrowed to item-specific gaps (E-05 transition dates, E-06 sample size, E-07 Photos tab/list completeness).
- **decisions/DD-014 — Organizational Understanding Authorization Gate, 24 July 2026.** Independent gate review (all 8 criteria G-01–G-08 evaluated separately, all PASS). Verdict: **RECOMMEND AUTHORIZED WITH CONDITIONS.** Partial-evidence decision table classifies E-03/E-05/E-06/E-07/E-10/CR-006 as Conditioning or narrowly Blocking specific relationship types only — none blocks the phase. OU-001 and OU-002 reviewed as candidate drafts only (Reusability: Reconstruct for both); banners and DD-012 untouched. 10 Mandatory Conditions specified if authorized.
- **decisions/DD-014, Case-Owner Decision section — added, 24 July 2026.** Kelvin Wong issued **AUTHORIZED WITH CONDITIONS**, accepting all 10 Mandatory Conditions verbatim. `organizational_understanding_authorized` set to `true`; `current_stage` transitions to `Organizational Understanding`; `organizational_understanding_established` remains `false`. Diagnosis, Design, Transformation, and external changes explicitly not authorized by this decision. OU-001 and OU-002 not modified, not promoted — still Draft, Not Authoritative.
- **understanding/UR-001-search-and-entity-presence-pattern.md — created, 24 July 2026.** Candidate relationship (Contrast) among OC-001, OC-003, OC-004. Independently challenged (Role B): **Survives with Narrowing** — Organizational Meaning wording narrowed to remove implied relevance between the naming inconsistency and the visibility contrast.
- **understanding/UR-002-technical-foundation-duality.md — created, 24 July 2026.** Candidate relationship (Contrast) between OC-005, OC-006. Independently challenged: **Survives**, no narrowing required.
- **understanding/UR-003-attribution-constraint-on-business-outcomes.md — created, 24 July 2026.** Candidate relationship (Constraint): OC-007 constrains business-outcome evaluation of OC-001, OC-002, OC-003, OC-004, OC-005, OC-006. Independently challenged: **Survives**.
- **understanding/UR-004-oc002-oc004-shared-source-candidate.md — created, 24 July 2026.** Candidate relationship testing whether OC-002 relates to any other claim without relying on Partial E-05/E-06/E-07. Independently challenged: **Rejected** — fails "organizational meaning beyond repeating claims." Preserved, not deleted. Confirms OC-002 has no surviving relationship among the seven claims.
- **understanding/OU-003-search-and-entity-presence.md — created, 24 July 2026.** New candidate Organizational Understanding, independently reconstructed from OC-001/OC-003/OC-004 via UR-001. Whole-Understanding challenge: **Survives**.
- **understanding/OU-004-technical-foundation.md — created, 24 July 2026.** New candidate Organizational Understanding, independently reconstructed from OC-005/OC-006 via UR-002. Whole-Understanding challenge: **Survives**.
- **decisions/DD-015 — Organizational Understanding Establishment Gate, 24 July 2026.** Clean-room claim inventory (Phase 1), 4 candidate relationships constructed and challenged (Phase 2/4), standalone/constraint classification (Phase 3: OC-002 Standalone, OC-007 Constraint), OU-001/OU-002 contamination comparison (Phase 5: both Historical Draft — Superseded, independent re-derivation confirmed, unmodified), 2 new candidate Understanding records constructed and challenged (Phase 6/7). **Gate Verdict: PASSED WITH CONDITIONS.** `organizational_understanding_established` remains `false` — Kelvin's explicit response requested and pending.
- **understanding/README.md — updated, 24 July 2026.** Indexes the new reconstruction; OU-001/OU-002 section relabeled "Historical Drafts (superseded, preserved unmodified)."
- **decisions/DD-015, Case-Owner Decision section — added, 25 July 2026.** Kelvin Wong issued **ESTABLISHED WITH CONDITIONS**, accepting all 10 conditions verbatim. OU-003 and OU-004 become Established Organizational Understanding (Conditional); UR-001 (narrowed wording only), UR-002, UR-003 become Established Relationships; UR-004 remains Rejected, authoritative use prohibited. `organizational_understanding_established` set to `true`. Diagnosis, Design, Transformation, and external changes explicitly not authorized by this decision.
- **understanding/OU-003…md, OU-004…md — Status/Authority updated, 25 July 2026.** Minimal edit: Status changed to "Established Organizational Understanding (Conditional)"; new "Authority" section added citing decisions/DD-015's Case-Owner Decision. No other content changed.
- **understanding/UR-001…md, UR-002…md, UR-003…md — Status updated, 25 July 2026.** Minimal edit: Status changed to "Established Relationship," citing decisions/DD-015. No other content changed.
- **understanding/UR-004…md — Status confirmation added, 25 July 2026.** Minimal edit: added a line confirming decisions/DD-015's Case-Owner Decision keeps this relationship Rejected, authoritative use prohibited, preservation required. No other content changed.
- **decisions/DD-016 — Diagnosis Authorization Gate, 25 July 2026.** Reconciled the reported "6" vs. "6+1" diagnosis-question counts (both accurate for what each describes: 6 = OU-003/OU-004's own questions; 6+1=7 = DD-015's full listing including the OC-002-standalone question). Built a canonical inventory of 7 raw items, admissibility-tested each: **5 admissible** (DQ-001, DQ-002, DQ-004, DQ-005, DQ-007), **2 reclassified Not a Diagnosis Question** (DQ-003 — local-pack generalization, a monitoring question; DQ-006 — "would closing OC-005's gaps help," an intervention-loaded question). Readiness: DQ-001 **READY**; DQ-002 (visibility-effect scope only), DQ-004 (strict read-only technical inspection only), DQ-005 (scoped to the single tested AI scenario), DQ-007 (Evidence Insufficient explicitly acceptable, bounded to the 12 already-registered candidate explanations) all **CONDITIONALLY READY**. Every High risk identified (Phase 6) has an explicit containment condition. **Recommendation: RECOMMEND AUTHORIZED WITH CONDITIONS**, question-specific. `diagnosis_authorized` remains `false` — Kelvin's explicit, per-question response requested and pending.

## Active work

- **Evidence Synthesis and Justified Organizational Claims: Completed, 24 July 2026 (decisions/DD-010, PASSED).** 7 candidate claims (OC-001–OC-007) drafted directly from work-objects/WO-001-search-visibility-baseline.md, each individually challenged against an 8-question falsification test set, all promoted with narrowing applied. None asserts unsupported causation; none generalizes a single observation into a stable trend; the 162-reservation gap, 0% no-shows, and GBP-decline cause are all explicitly preserved as unresolved rather than quietly resolved. The pre-existing legacy candidate register (claims/EC-002-CL-candidate-register.md, CL-001–009, migrated from the original case) was left untouched and has not been re-evaluated against this round's evidence.
- New O-001–O-012 SEO/local observation round: **6 fully collected (O-001, O-002, O-003, O-004, O-011, O-012)**, 5 informed with explicit limitations (O-005, O-006, O-007, O-008, O-010), 1 partially informed (O-009).
- **All nine baseline acceptance criteria are now met — `baseline_state: Established`, `baseline_established: true`.** See work-objects/WO-001-search-visibility-baseline.md's Baseline Acceptance Criteria Assessment for the full, criterion-by-criterion basis and the corrected history (an initial premature `true` → `Provisional`/`false` → `Established`, earned incrementally with real evidence at each step, nothing fabricated).
- **Unresolved item (O-011):** 162-reservation gap between "Reserveringen per bron" (576) and "Service-reserveringen" (414) in Guestplan remains open — plausibly workshop/private-dining/catering/lunch bookings not covered by the two-category service breakdown, not confirmed. **0% no-shows — confirmed accurate by Kelvin, 24 July 2026** (registration is correct, not a tracking gap); no longer an open question. 12.3% cancellation rate still flagged with no benchmark to judge it against.
- **Two website UX fixes prepared, not yet deployed (HV-INT-004, HV-INT-005):** holiday popup now only shows once per visitor (was showing on every homepage load); the shared page-title component (`pageBanner()`) had no responsive font-size, causing long single-word titles like "Arrangements" to overflow off-screen on mobile — now fixed site-wide. Both sit in the local theme copy at `Local Sites/konnichiwa/app/public/wp-content/themes/konnichiwa/`, awaiting FTP deployment by Kelvin.
- Weekly Monday 10:00 operating loop (decisions/DD-003) — not yet run once.
- **HV-INT-003 — GA4 tag published and confirmed working, 23 July 2026 (Provisionally Earned).** Root cause: the GA4 Google-tag (G-C29ZMF288W) was added to the GTM container 2 months ago but never published — sat unpublished in "Wijzigingen in behandeling." Published, then Realtime testing in Safari still showed 0 (Safari's cross-site tracking prevention blocked it) — retested in Chrome, confirmed active users appearing in Realtime. Fix confirmed working. See transformation/HV-IR-001.md, HV-INT-003. Container quality also flagged "3 issues" needing attention — not yet reviewed.
- **CR-005 — Resolved for Initial Baseline, 24 July 2026.** Kelvin's genuinely Utrecht-located, incognito, logged-out mobile search for "omakase utrecht" (06:41) showed Konnichiwa at local-pack position 2 of 3 (Kong Izakaya #1, Konnichiwa #2, Japanese Don Dining KOUNOSUKE #3) — EV-018. This corroborates Search Console's optimistic "position 4.7" reading over the earlier non-geo-controlled checks (evidence/HV-IV-003.md and the 24 July WebSearch proxy), which likely understated Konnichiwa's real local prominence for lack of geographic control. Preserved limitation: one point, one time, one device — not a multi-point grid; says nothing about organic (non-local-pack) ranking, which remains O-004's domain; no claim of city-wide or time-stable ranking.
- **New finding to follow up:** `/nl/home-nederlands/` is a real, better-ranking page (position 5.05 vs. homepage 8.93) that was not catalogued in evidence/HV-IV-007.md's page inventory. Needs reconciling.
- **Major finding, still highest priority, now more precisely characterized:** every Google Business Profile metric (interactions, website clicks, route requests, calls, menu views, appointments) has declined substantially across 6 months (Feb→Jul 2026), with a brief plateau/partial recovery around April–May before steepening again in June–July. Predates EC-002 and HV-INT-002 entirely — cause still unknown; ten candidate explanations assessed, none Plausible. See observations/O-002.md, O-013.md, claims/OC-002-competing-explanations-register.md.

## Blockers

- GA4 data — **resolved and confirmed working, 23 July 2026** (HV-INT-003), but no usable history exists before this date, and Safari visitors are structurally under-measured (browser-level tracking prevention, not fixable from our side) — see transformation/HV-IR-001.md, HV-INT-003 for the data-quality caveat. Channel-specific conversion attribution still needs GA4 events to mature and, ideally, a GA4-Guestplan link that doesn't exist yet.
- GTM Container Quality "3 issues" — flagged during HV-INT-003 troubleshooting, not yet reviewed.
- Structured-data implementation — needed to unblock HV-INT-001 (design is ready, not yet placed on the live site).
- Three conversion-tracking gaps unresolved: no directions link, no Private Dining CTA, broken catering form (see observations/O-011.md).
- Formal Search Console indexation/coverage report — not included in the 23 July export, still needed for O-005.
- HV-INT-004 and HV-INT-005 (popup + mobile title fix) — prepared locally, awaiting FTP deployment by Kelvin before they can be validated.
- Lighthouse lab scores (Performance/Accessibility/Best-Practices/SEO 0–100) for O-012 — CrUX field data was obtained, but the lab-score portion of the PSI report was not present in the fetched content. Minor, non-blocking.
- Multi-point Utrecht rank grid for O-003 — the single 24 July observation is accepted as sufficient for the initial baseline, but broader coverage (multiple points/times/devices) remains a future measurement-maturity improvement, not currently blocking anything.
- **OC-002 evidence-collection status (observations/O-013.md), updated 24 July 2026:** E-05, E-06, and E-07 are **Partial** (EV-021/022/023, dated via EV-024 to 2026-07-24) — real, now-dated evidence exists for all three, but each retains its own item-specific limitation (E-05: transition dates unknown; E-06: bounded sample, not full export; E-07: Photos tab not supplied, list completeness unconfirmed). **E-11 is Completed** (EV-020, Owner Declaration). Only E-03 and E-10 remain structurally unavailable (no monthly search-term breakdown; no prior-year comparison data exists anywhere).

## Next authorized action

**Primary next action:** Kelvin has issued **PARTIALLY AUTHORIZED WITH CONDITIONS** (decisions/DD-016, Case-Owner Decision, 25 July 2026). `diagnosis_authorized` is now `true`, scoped to five questions; `diagnosis_established` remains `false` — no investigation has begun for any of them. The next authorized action is to **establish separate, bounded Diagnosis investigations**, one at a time, for:
- **DQ-001** (Authorized) — why the broader search categories underperform versus the flagship dining formats, per its Candidate Diagnosis Scope and Question-Specific Rules in decisions/DD-016.
- **DQ-002** (Authorized With Conditions) — naming inconsistency's visibility effect only; conversion/reservation effects explicitly excluded.
- **DQ-004** (Authorized With Conditions) — mobile TTFB mechanism only; read-only investigation, no code or config change.
- **DQ-005** (Authorized With Conditions) — OC-005/AI-representation-error correspondence, scoped to the single tested AI scenario; must first independently confirm the target error condition or stop with Evidence Insufficient.
- **DQ-007** (Authorized With Conditions) — the six-month GBP engagement decline; OC-002 remains standalone, E-05/E-06/E-07 Partial limitations and E-03/E-10/CR-006 constraints are binding, Evidence Insufficient is an acceptable outcome, no invented relation to OU-003/OU-004, the 162-reservation discrepancy is never characterized as "lost reservations."

Each investigation must open under its own containment conditions as recorded in decisions/DD-016 (Phase 5 Candidate Diagnosis Scope and the Case-Owner Decision's Question-Specific Rules) and must be separately authorized to proceed to conclusions.

**DQ-003** (local-pack generalization) and **DQ-006** ("would closing OC-005's gaps help") remain **Not Authorized** — reclassified Not a Diagnosis Question (monitoring and intervention-loaded, respectively).

**Secondary, independent next action:** OC-002 evidence collection (Path 1) remains **Partial across E-05/E-06/E-07, Completed for E-11 — 10 of 13 items done.** E-05 would benefit from a GBP edit-history log or Kelvin's recollection of when the 3 confirmed attribute changes occurred; E-06 would benefit from a fuller review export beyond the current 8-review sample; E-07 would benefit from the Photos tab and confirmation the visible post list is complete. E-03 and E-10 remain structurally unavailable regardless. This work would directly support DQ-007.

**Not authorized by this decision:** Organizational Diagnosis *conclusions* or findings for any question (only investigation *scope* is authorized), Design, Transformation, any SEO or marketing intervention, or any external system change — all remain separately gated and `false`.

No Design or Transformation is authorized for any part of the case.

## Unresolved unknowns

- Exact venue/bar closing time after kitchen close (evidence/HV-IV-002.md).
- Exact teppanyaki closing time (evidence/HV-IV-002.md).
- Whether "@konnichiwagroup" Instagram account belongs to Konnichiwa (evidence/HV-IV-001.md).
- Formal indexation status of priority pages (requires O-001).
- Review recency and response-time data (requires O-009 completion).
- Which of the remaining ~34 candidate search intents (legacy EC-002 §12) have business value — none evaluated beyond the 4 in evidence/HV-IV-005.md.
- **What is causing the 6-month decline in every GBP metric (observations/O-002.md)?** 10 candidate explanations assessed 24 July 2026 (claims/OC-002-competing-explanations-register.md); none Plausible, none ruled in. Still open — see decisions/DD-013.
- What is "takumi" (1,400 GBP profile-discovery searches, observations/O-002.md) — still unexplained; O-013 (24 July 2026) confirmed it is a distinct search term, not a Konnichiwa spelling variant, but its cause remains unknown.
- What are the 3 flagged GTM "Container Quality" issues? Not yet reviewed.
- How large is the Safari/iOS share of Konnichiwa's real visitors — needed to size how much GA4 will structurally undercount going forward (observations/O-002.md showed 85% of GBP discovery is mobile, device OS split unknown).
- What explains the 162-reservation gap between Guestplan's two reservation reports (observations/O-011.md)? Still open — Kelvin's 24 July confirmation covered no-show tracking specifically, not this discrepancy.
- ~~Is Guestplan's 0% no-shows figure accurate, or is no-show tracking incomplete?~~ **Resolved, 24 July 2026** — Kelvin confirmed the registration is accurate.
- No same-period-last-year comparison exists for the Guestplan baseline — is 576 reservations/90 days typical, growing, or declining?
- Whether Konnichiwa's #2 local-pack position (EV-018) holds across other Utrecht points, times, and devices — only one point-in-time observation exists so far.
- The published, live HV-DB-001 dashboard page (and the Command Center artifact) still show the older v4 state — not republished against v5 in this task.
- What is causing TTFB to be "poor" for 26% of mobile page loads (observations/O-012.md)? Server response time, hosting, or caching — not investigated.
- Lighthouse lab scores (0–100) for konnichiwa.nl remain unobtained (O-012) — field data (CrUX) was collected instead, which answers the real-user question but not the synthetic-lab-score question.

## Migration note

This file, and the case folder it belongs to, were created by migrating and restructuring the original case from `solutions/visibility/` into `/organization/capabilities/marketing/visibility/cases/EC-002-konnichiwa-organic-visibility/`, per decisions/DD-007-ec002-migration-decision.md. The original source files have been deleted from `solutions/visibility/` after this migration completed (recoverable via git history).
