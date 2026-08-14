# OD-002 Implementation Candidate Construction Workstream

**Constructed under decisions/DD-033's Case-Owner Decision (AUTHORIZED WITH CONDITIONS FOR IMPLEMENTATION-CANDIDATE CONSTRUCTION ONLY, 13 August 2026), Level 1 — Candidate Construction Only.** This is bounded, repository-only construction, falsification, and comparison of implementation candidates. It selects no winner, requests no case-owner selection, creates no readiness gate, performs no feasibility work, collects no evidence, accesses no external or authenticated system, and implements or deploys nothing.

```yaml
Status: Candidate Construction Completed — Independent Review Pending
Authority: DD-033 Case-Owner Decision
Authorized Level: Level 1 — Candidate Construction Only
Candidate Selection: Not Authorized
Feasibility Execution: Not Authorized
Implementation: Not Authorized
Transformation Execution: Not Authorized
External Changes: Not Authorized
```

---

## Status Update — Case-Owner Staged Selection (14 August 2026)

*Status-only addendum. It does not alter any precondition, requirement, candidate formulation, assumption register, attack, comparison, or challenge content in the Precondition Check or Phases 1 through 10 below — all remain exactly as originally constructed. Authority: decisions/DD-034, Case-Owner Selection section, Kelvin Wong, 14 August 2026.*

| Field | Value |
|---|---|
| Authority | decisions/DD-034 — Case-Owner Selection |
| Selection | `SELECT STAGED COMBINATION FOR FURTHER FEASIBILITY PREPARATION: IC-OD2-001 (Stage 1) + IC-OD2-002 (Stage 2, conditional)` |
| IC-OD2-001 — No-Change / Measurement Continuation | **Selected — Stage 1, Execution Not Authorized** |
| IC-OD2-002 — Observability-Only Preparation | **Selected Conditionally — Stage 2 Pending Stage 1 Review** |
| IC-OD2-003 — Cache-Delivery Verification/Feasibility Preparation | Retained — Unselected Alternative |
| IC-OD2-004 — Backend/Origin Feasibility Preparation | Retained — Unselected Alternative |
| IC-OD2-005 — Combined Staged Verification | Retained — Unselected Alternative |
| Independent Candidate Readiness Gate | decisions/DD-034 — Passed With Conditions; Recommend Eligible With Conditions For Case-Owner Selection |

Kelvin Wong's rationale, recorded in full in decisions/DD-034's Case-Owner Selection section: the 26% poor-mobile-TTFB baseline is aging; cache absence, domain-specific Varnish delivery, and backend delay all remain unestablished; Stage 1 (OD2-CAND-3) and Stage 2 (OD2-CAND-2) evidence attempts both ended in insufficient evidence; renewed like-for-like measurement therefore precedes additional mechanism preparation. This selection does not imply IC-OD2-001 or IC-OD2-002 is technically superior, and does not reject IC-OD2-003, IC-OD2-004, or IC-OD2-005.

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

No candidate above is marked Established, Implemented, or Rejected. Stage 1 execution and Stage 2 preparation both remain unauthorized — this addendum records *which* candidates were selected for further feasibility preparation, not authorization to prepare, execute, or access anything. All twenty-two DD-033 Set B boundaries, all fifteen DD-033 Set A conditions, all ten DD-032 establishment conditions, and all sixteen DD-032 additional boundaries remain independently binding, unaffected by this addendum. Next action: prepare an IC-OD2-001 Like-for-Like CrUX Remeasurement Protocol Readiness Gate — **not created by this task.**

---

## Status Update — IC-OD2-001 Protocol Prepared (14 August 2026)

*Status/reference-only addendum. It does not alter any precondition, requirement, candidate formulation, assumption register, attack, comparison, or challenge content in the Precondition Check or Phases 1 through 10 above — all remain exactly as originally constructed. Authority: decisions/DD-035, Case-Owner Decision, Kelvin Wong, 14 August 2026.*

Under decisions/DD-035's authorization (AUTHORIZED WITH CONDITIONS TO PREPARE IC-OD2-001 CRUX REMEASUREMENT PROTOCOL), `transformation/IC-OD2-001-crux-mobile-ttfb-remeasurement-protocol.md` has been prepared — a repository-only, like-for-like CrUX mobile TTFB remeasurement protocol for IC-OD2-001, satisfying its Field 8 (Measurement/Observability Plan) and Field 20 (Later-Gate Requirement) as originally constructed above. IC-OD2-001's own Metadata line and Phase 4/5 fields are unchanged — this addendum adds a pointer, not a rewrite.

```yaml
current_stage: Organizational Design
od_002_stage_1_protocol_authorization_gate: DD-035 — Passed With Conditions
od_002_stage_1_protocol_created: true
od_002_stage_1_protocol_status: Prepared — Independent Readiness Review Required
od_002_stage_1_execution_authorized: false
od_002_stage_1_execution_started: false
od_002_stage_2_preparation_authorized: false
od_002_feasibility_execution_authorized: false
od_002_implementation_authorized: false
transformation_authorized: false
external_changes_authorized: false
```

No CrUX/PageSpeed access occurred; no data was retrieved; no evidence was created. Next action: an independent readiness review of the IC-OD2-001 CrUX protocol — **not performed by this task.**

---

## Status Update — IC-OD2-001 Protocol Independently Reviewed (14 August 2026)

*Status/reference-only addendum. It does not alter any precondition, requirement, candidate formulation, assumption register, attack, comparison, or challenge content in the Precondition Check or Phases 1 through 10 above — all remain exactly as originally constructed. Authority: decisions/DD-036, Independent Protocol Readiness Gate, 14 August 2026.*

decisions/DD-036 independently reviewed `transformation/IC-OD2-001-crux-mobile-ttfb-remeasurement-protocol.md` in full — re-verifying the historical baseline, re-deriving the target-window mathematics, testing calculation/outcome routing against five sample values, and independently attacking the protocol across twenty-four dimensions. Three bounded corrections were applied directly to the protocol (a timezone-assumption flag, a lapse-expiry rule, and a fifteenth stop condition for source-window-date ambiguity), each dated and attributed inline, with no other Phase 1–14 content altered. **Gate Verdict: PASSED WITH CONDITIONS. Recommendation: RECOMMEND APPROVED WITH CONDITIONS FOR READ-ONLY CRUX REMEASUREMENT EXECUTION.** This recommendation is not execution authorization.

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

No CrUX/PageSpeed access occurred; no data was retrieved; no evidence was created. Next action: Kelvin's explicit execution-decision response to decisions/DD-036 — **not recorded by this task.**

---

## Status Update — IC-OD2-001 Execution Authorized With Conditions (14 August 2026)

*Status/reference-only addendum. It does not alter any precondition, requirement, candidate formulation, assumption register, attack, comparison, or challenge content in the Precondition Check or Phases 1 through 10 above — all remain exactly as originally constructed. Authority: decisions/DD-036, Case-Owner Decision, Kelvin Wong, 14 August 2026.*

Kelvin Wong issued **APPROVED WITH CONDITIONS FOR READ-ONLY CRUX REMEASUREMENT EXECUTION** (decisions/DD-036, Case-Owner Decision). One bounded, public, read-only execution attempt of `transformation/IC-OD2-001-crux-mobile-ttfb-remeasurement-protocol.md` is now authorized — not before 2026-08-19, expiring 2026-10-31 if unused, limited to one attempt, subject to eleven DD-036 Set A conditions and thirty-eight new Set B execution conditions recorded verbatim in decisions/DD-036.

```yaml
current_stage: Organizational Design
od_002_stage_1_protocol_readiness_gate: DD-036 — Passed With Conditions
od_002_stage_1_execution_decision: Approved With Conditions — One Public Read-Only Attempt
od_002_stage_1_execution_authorized: true
od_002_stage_1_execution_not_before: 2026-08-19
od_002_stage_1_execution_authorization_expires: 2026-10-31
od_002_stage_1_execution_attempt_limit: 1
od_002_stage_1_execution_started: false
od_002_stage_1_evidence_created: false
od_002_stage_2_preparation_authorized: false
od_002_feasibility_execution_authorized: false
od_002_implementation_authorized: false
transformation_authorized: false
external_changes_authorized: false
```

**This decision does not itself execute the protocol.** No CrUX/PageSpeed access occurred; no data was retrieved; no evidence was created. Next action: wait until at least 2026-08-19, then perform at most one public read-only execution only if the source visibly confirms a complete comparable field-data window — **not performed by this task.**

---

## Precondition Check

| # | Precondition | Result |
|---|---|---|
| 1 | Branch `feat/ec-002-visibility-baseline`; local and remote HEAD `0d7cdfdf5aa8b8107a7eec44b867e234942dd81e` | **PASS** |
| 2 | Working tree clean | **PASS** |
| 3 | Local and remote branches synchronized (0 ahead / 0 behind) | **PASS** |
| 4 | `current_stage: Organizational Design` | **PASS** (current.md:10) |
| 5 | OD-002 Design: Established / Conditional / Authority DD-032 Case-Owner Decision / Confidence Medium-Low | **PASS** (current.md:163–166) |
| 6 | DD-033 Gate Verdict remains PASSED WITH CONDITIONS | **PASS** (decisions/DD-033 Part 11, unmodified) |
| 7 | DD-033 records AUTHORIZED WITH CONDITIONS FOR IMPLEMENTATION-CANDIDATE CONSTRUCTION ONLY | **PASS** (decisions/DD-033 Case-Owner Decision) |
| 8 | Authorized level is Level 1 — Candidate Construction Only | **PASS** (current.md:170) |
| 9 | All fifteen DD-033 Set A conditions remain binding | **PASS** — none edited |
| 10 | All twenty-two DD-033 Set B boundaries remain binding | **PASS** — none edited |
| 11 | Candidate construction authorized but not started | **PASS** (current.md:171–172, before this task) |
| 12 | Candidate selection unauthorized | **PASS** (current.md:173) |
| 13 | Feasibility execution unauthorized | **PASS** (current.md:174) |
| 14 | Implementation unauthorized | **PASS** (current.md:175) |
| 15 | `transformation_authorized` remains `false` | **PASS** (current.md:187) |
| 16 | `external_changes_authorized` remains `false` | **PASS** (current.md:188) |
| 17 | No OD-002 implementation candidate or workstream exists | **PASS** — no such artifact prior to this task |
| 18 | Stage 1 remains CS-4 — Insufficient Evidence | **PASS** (decisions/DD-028) |
| 19 | Host/Varnish for konnichiwa.nl remains Unconfirmed/Unconfirmed | **PASS** (decisions/DD-028; DD-032 Additional Boundary 2) |
| 20 | Stage 2 Round 1 remains Evidence Insufficient | **PASS** (decisions/DD-031; current.md:157) |
| 21 | CE-DQ4-A remains unresolved | **PASS** (DD-032 Additional Boundary 6) |
| 22 | CE-DQ4-C/E/F/G remain uninvestigated | **PASS** (DD-032 Pre-Decision Consistency Check; Additional Boundary 7) |
| 23 | OD-001 Candidate D remains unexecuted | **PASS** — protocol "Approved With Conditions — Awaiting Execution Window" (21 Sep–31 Dec 2026), not yet reached |
| 24 | OD-003 remains outside scope | **PASS** (`od_003_design_authorized: false`, current.md:102) |

**All twenty-four preconditions passed. Proceeding.**

**Directory convention:** `transformation/` already exists (HV-IR-001.md, README.md), predating this case's current lifecycle discipline. This workstream is added as `transformation/OD-002-implementation-candidate-construction-workstream.md`; no `implementation/`, `deployment/`, or `production/` directory is created.

---

## Phase 1 — Authority and Boundaries

| Element | Value |
|---|---|
| Established Design foundation | decisions/DD-032 — ESTABLISHED WITH CONDITIONS, 13 Aug 2026 |
| Candidate-construction authority | decisions/DD-033 — AUTHORIZED WITH CONDITIONS FOR IMPLEMENTATION-CANDIDATE CONSTRUCTION ONLY, Level 1, 13 Aug 2026 |
| Active confidence | **Medium-Low** (inherited cap; no candidate below may exceed it) |
| Activity class | Repository-only construction, falsification, and comparison |
| Evidence collection | None performed by this workstream |
| Authenticated access | None performed by this workstream |
| Feasibility execution | None performed by this workstream |
| Candidate selection | Not performed, not requested |
| Implementation | Not performed |

**Carried forward without weakening, kept separately provenanced (not merged or deduplicated):**

- **DD-033 Set A** (fifteen Transformation Readiness Gate conditions, Part 11) — binding on this entire workstream and on every candidate within it.
- **DD-033 Set B** (twenty-two Case-Owner candidate-construction boundaries) — binding on this entire workstream and on every candidate within it.
- **DD-032's ten establishment conditions** (Part 9) — binding on the Design foundation this workstream is derived from.
- **DD-032's sixteen additional confirmed boundaries** (Case-Owner Decision) — binding on the Design foundation this workstream is derived from.

All four sets remain independently binding, quoted by reference to their source document rather than restated in full here, to avoid drift between copies. Every candidate below is checked against all four.

---

## Phase 2 — Authoritative Problem Boundary

**Established Design basis (sole authority, unchanged, quoted from decisions/DD-032):**

> A bounded measurement-and-observability Design for konnichiwa.nl's mobile response-time delivery, targeting the measured 26% CrUX poor-mobile-TTFB share (EV-017/O-012, 24 Jun–21 Jul 2026 window), which has verified — via two complete, case-owner-accepted evidence rounds — that currently obtainable public/read-only/owner-supplied evidence cannot discriminate between cache-layer absence and backend/application processing as the responsible mechanism, has not addressed geographic, page-mix, network, or time/load factors, and requires mechanism verification via a future, separately-authorized step before any specific technical direction may be selected. "No measurable change" and "Evidence Insufficient" remain fully legitimate outcomes throughout.

**No candidate constructed in this workstream may assume:**

1. Caching is absent.
2. Varnish is active for konnichiwa.nl.
3. Backend processing is slow.
4. Backend processing caused the 26% poor mobile TTFB tail.
5. PHP 8.4 (DirectAdmin evidence, decisions/DD-031) is a performance result.
6. "No issues" (DD-031's narrow interpretations) means a healthy backend.
7. A technical intervention is required at all.
8. A performance improvement would improve SEO or business outcomes.

Every candidate below is checked against this list in its own falsification/attack section (Phase 7).

---

## Phase 3 — Construction Requirements (ICR-001–ICR-020)

*Compiled and completed before any candidate below was constructed, per DD-033 Part 6.*

| ID | DD-033 Part 6 requirement | Interpretation for this workstream | Mandatory evidence inside every candidate | Failure condition |
|---|---|---|---|---|
| ICR-001 | 1. Unique candidate identifier | Every candidate is named `IC-OD2-0NN` | A distinct ID field | Missing or duplicate ID |
| ICR-002 | 2. Explicit problem boundary | States exactly what the candidate does and does not attempt to resolve | A "Problem Boundary" field | Boundary implied rather than stated |
| ICR-003 | 3. Linked authoritative Design requirement | Cites specific OD2-REQ-001–017 item(s) and/or the DD-032 Design statement | Named OD2-REQ citation(s) | Candidate unlinked to any requirement |
| ICR-004 | 4. Explicit assumptions | Every candidate-specific assumption gets a stable `AS-ICn-0NN` ID (Phase 6) | At least one assumption ID | Unlabeled or implicit assumption |
| ICR-005 | 5. Evidence supporting and limiting assumptions | Each assumption cites its supporting evidence and its limits, per Phase 6's classification scale | Evidence column populated per assumption | Assumption asserted without evidence citation |
| ICR-006 | 6. Mechanism claimed, if any, and which CE-DQ4 items addressed/not addressed | Explicit "Mechanism Claimed" field naming CE-DQ4-A through G status | Explicit mechanism statement, even if "none" | Mechanism implied without being named |
| ICR-007 | 7. Falsification criteria | At least one checkable prediction distinguishable from no-change (OD2-REQ-015) | "Falsification Criteria" field | Non-checkable or missing criterion |
| ICR-008 | 8. Measurement and observability plan | Reuses OD2-REQ-004/008 field-measurement discipline where applicable | "Measurement/Observability Plan" field | Plan absent or inconsistent with OD2-REQ-004/008 |
| ICR-009 | 9. Privacy and security assessment | Extends DD-029/DD-030's checklist unchanged | "Privacy/Security" field naming any risk or "None" | Risk category omitted |
| ICR-010 | 10. Required access, repository-only vs. new-authorization-required | Splits access explicitly per DD-033 Part 7 | "Required Access" field with two sub-lists | Access unclassified |
| ICR-011 | 11. External-change classification | States whether any step is an external/production change | "External-Change Classification" field | Classification omitted |
| ICR-012 | 12. Reversibility | States whether/how the candidate's eventual actions would be reversible | "Reversibility" field | Reversibility unaddressed |
| ICR-013 | 13. Rollback plan, defined at construction time | Rollback described now, not deferred | "Rollback Plan" field | Rollback deferred to a later stage |
| ICR-014 | 14. Failure and stop conditions | Explicit conditions that halt the candidate's future path | "Failure/Stop Conditions" field | Stop conditions absent |
| ICR-015 | 15. Feasibility dependencies, named but not executed | Every dependency requiring new access is named, not performed | "Feasibility Dependencies" field, each marked Blocked | Dependency silently assumed satisfiable |
| ICR-016 | 16. Expected outcome without numerical guarantee | No percentage, ms figure, or rank promised | "Expected Outcome" field, qualitative only | Any numeric guarantee present |
| ICR-017 | 17. Explicitly excluded business claims | States no ranking/conversion/revenue/reservation benefit | "Excluded Business Claims" field | Business claim present or field omitted |
| ICR-018 | 18. Comparison with no-change | Every candidate (including no-change itself) states its relationship to IC-OD2-001 | "Comparison With No-Change" field | Comparison omitted |
| ICR-019 | 19. Independent attack | Twenty-dimension attack table (Phase 7) | Twenty rows present | Attack table incomplete |
| ICR-020 | 20. No implementation before a later gate and case-owner decision | Explicit statement that implementation requires a separate future gate | "Later-Gate Requirement" field | Statement omitted or weakened |

**Register complete. Candidates constructed below satisfy ICR-001–ICR-020 in full.**

---

## Phase 4/5 — Candidate Set

*At least four materially different candidates required; five constructed. No hosting migration, CDN activation, cache-plugin installation, or code-optimization candidate is constructed as an assumed solution — none of the five below selects or assumes a technical mechanism.*

### IC-OD2-001 — No-Change / Measurement Continuation

| Field (ICR) | Content |
|---|---|
| 1. Identifier | IC-OD2-001 |
| 2. Problem boundary | Preserves the current technical state unchanged. Refreshes the aging CrUX baseline (OD2-AS-008) via a future, separately-authorized public read-only field-data pull. Does not attempt to resolve CE-DQ4-A/B/C/E/F/G. |
| 3. Linked Design requirement | OD2-REQ-003 ("no measurable improvement" is legitimate); OD2-REQ-005 (26% is a dated observation, not a stable rate); OD2-AS-008 (refresh requirement); DD-032 Binding Condition 4 (CrUX baseline must be refreshed before future evaluation) |
| 4. Explicit assumptions | AS-IC1-001, AS-IC1-002, AS-IC1-003 (Phase 6) |
| 5. Evidence supporting/limiting | Supporting: EV-017/O-012 (original baseline); DD-016/DD-019/DD-020 precedent for legitimate no-finding outcomes; DD-022 Common Condition 3 (no-change alternative required). Limiting: no evidence yet exists on whether the baseline has already shifted since 21 Jul 2026 |
| 6. Mechanism claimed | **None.** Explicitly declines to distinguish CE-DQ4-A from CE-DQ4-B; leaves CE-DQ4-C/E/F/G entirely untouched, consistent with DD-032 Additional Boundary 7 |
| 7. Falsification criteria | If a future refreshed CrUX pull shows the poor-mobile-TTFB share has already materially changed (better or worse) absent any technical change, the assumption that "the current state is stable enough to warrant no-change" is falsified for that reading and must trigger case-owner review, not silent continuation |
| 8. Measurement/observability plan | A future, single, public, read-only CrUX field-data pull — origin-level, mobile, TTFB, 28-day rolling window (OD2-REQ-004) — dated and windowed per OD2-REQ-005. No lab measurement substituted (OD2-REQ-006) |
| 9. Privacy/security | None — CrUX is public aggregate data; no PII, credential, or customer data involved |
| 10. Required access | Repository-only now (this definition). Future: a public, read-only, non-authenticated CrUX field-data query — the same class already used for EV-017/O-012 — **named as a blocked dependency requiring its own new, explicit case-owner authorization before execution** (Part 7); Level 1 construction does not itself authorize even this public pull |
| 11. External-change classification | Not an external/production change — a public read-only data query, distinct from any system access to konnichiwa.nl's own infrastructure |
| 12. Reversibility | Full — nothing about konnichiwa.nl's technical state is touched |
| 13. Rollback plan | Not applicable — no state change occurs; "rollback" is simply not proceeding to any other candidate |
| 14. Failure/stop conditions | If the refreshed CrUX reading shows material worsening, or shows a pattern newly consistent with one mechanism over another, work stops for case-owner review before any other candidate is advanced |
| 15. Feasibility dependencies | The future CrUX refresh pull (Blocked — requires separate authorization) |
| 16. Expected outcome | The tail may remain materially unchanged, may have already shifted for unrelated reasons, or may show natural drift. No percentage or improvement is promised |
| 17. Excluded business claims | No ranking, conversion, revenue, or reservation benefit is claimed or implied by refreshing the baseline |
| 18. Comparison with no-change | **This candidate is the no-change comparator itself** — the reference point every other candidate is compared against in Phase 8 |
| 19. Independent attack | Phase 7 below |
| 20. Later-gate requirement | Even the CrUX refresh step requires a separate future Independent Candidate Readiness Gate and explicit case-owner authorization; nothing in this workstream authorizes it |

**Metadata:** Status: Candidate — Unselected · Authority: DD-032/DD-033 · Confidence: Medium-Low (inherited cap; governance stance itself Supported by direct case precedent, OD2-AS-009) · Unresolved dependencies: CrUX refresh authorization · Evidence class needed later: public CrUX field-data pull (external, read-only) · Renewed Diagnosis required?: Possibly, only if refreshed data diverges materially · Later feasibility gate required?: No — an evidence-refresh authorization, not a feasibility gate · External-change gate required for implementation?: No — no production change exists in this candidate

---

### IC-OD2-002 — Observability-Only Preparation

| Field (ICR) | Content |
|---|---|
| 1. Identifier | IC-OD2-002 |
| 2. Problem boundary | Defines a future, reversible observability state capable of helping discriminate mechanisms (CE-DQ4-A vs. B, and potentially C/E/F/G) without itself changing delivery behavior. Does not enable profiling, install monitoring, access logs, request credentials, or perform feasibility execution — any of these are named as blocked dependencies for a later gate |
| 3. Linked Design requirement | OD2-REQ-008 (public read-only measurement fields: DNS/connect/TLS/TTFB/total-time, redirect chain, protocol, headers); OD2-REQ-010 (discriminate among ≥6 named mechanisms); OD2-REQ-013 (no execution outside read-only boundary without separate gate) |
| 4. Explicit assumptions | AS-IC2-001 through AS-IC2-005 (Phase 6) |
| 5. Evidence supporting/limiting | Supporting: diagnosis/DQ-004-investigation.md Phase 2B's existing method already models the field set. Limiting: OD2-AS-007 — read-only methods alone were already found not to resolve CE-DQ4-A/B entanglement; this candidate can only narrow, not close, that gap |
| 6. Mechanism claimed | **None.** Purely diagnostic instrumentation, mechanism-neutral by design; explicitly does not presuppose CE-DQ4-A or CE-DQ4-B dominance (OD2-REQ-011) |
| 7. Falsification criteria | If the observability plan, once defined in full, cannot be shown to discriminate at least two of CE-DQ4-A/B/C/E/F/G, it fails the REQ-010-style discrimination test and must be revised or abandoned before any later gate |
| 8. Measurement/observability plan | A future specification (not executed here) of an expanded, still read-only measurement set — multi-vantage timing, repeated-sample variance, and/or safely-scoped response-time breakdowns — built on OD2-REQ-008's existing field set |
| 9. Privacy/security | Any tooling beyond public read-only requests (e.g., real-user monitoring, server-side logging) is flagged as a privacy-relevant dependency requiring DD-029/DD-030-equivalent redaction review before any future authorization |
| 10. Required access | Repository-only now (this definition). Future, **blocked**: any log access, monitoring installation, or credentialed tooling |
| 11. External-change classification | Defining the plan is not a change; installing any tooling would be an external/production change requiring separate authorization |
| 12. Reversibility | High by design — purely additive instrumentation, no delivery-path change; actual installation remains blocked pending its own gate |
| 13. Rollback plan | Any future observability addition must specify, at the time of its own authorization request, how it would be fully removed; this candidate requires that as a condition, not a later afterthought |
| 14. Failure/stop conditions | If defining the plan reveals it would require production configuration changes to implement, the candidate halts and routes to a separate feasibility/authorization gate rather than proceeding |
| 15. Feasibility dependencies | Log access, monitoring installation, or credentialed tooling — all named, **Blocked** |
| 16. Expected outcome | A defined, reversible measurement plan that may or may not, once executed, discriminate mechanisms; no numeric improvement or discrimination guarantee |
| 17. Excluded business claims | No ranking, conversion, revenue, or reservation benefit implied by improved observability |
| 18. Comparison with no-change | Adds definitional work beyond IC-OD2-001 but no technical delivery change — lower operational burden than IC-OD2-003/004, higher than IC-OD2-001 |
| 19. Independent attack | Phase 7 below |
| 20. Later-gate requirement | Any tooling defined here requires a separate future Independent Candidate Readiness Gate, a feasibility-execution authorization, and (if any configuration is ever needed) an external-change gate |

**Metadata:** Status: Candidate — Unselected · Authority: DD-032/DD-033 · Confidence: Medium-Low (inherited cap; candidate's own discriminating power Weakly Supported, untested) · Unresolved dependencies: log/monitoring access authorization · Evidence class needed later: read-only observability expansion (repository-definable now, execution blocked) · Renewed Diagnosis required?: Possibly, if findings implicate an untested mechanism · Later feasibility gate required?: Yes, before any tooling is installed · External-change gate required for implementation?: Yes, if any configuration step is ever needed

---

### IC-OD2-003 — Cache-Delivery Verification/Feasibility Preparation

| Field (ICR) | Content |
|---|---|
| 1. Identifier | IC-OD2-003 |
| 2. Problem boundary | Defines a future feasibility pathway for determining konnichiwa.nl's domain-specific configured and delivered HTML-cache state, before any cache direction is selected. Does not itself determine cache state, activate, or deactivate anything |
| 3. Linked Design requirement | OD2-REQ-011 (no presupposition of CE-DQ4-A/B dominance); OD2-REQ-017 (no cache/CDN/hosting technology selected or implied); decisions/DD-026's Configured-State/Delivered-State two-dimensional model |
| 4. Explicit assumptions | AS-IC3-001 through AS-IC3-004 (Phase 6) |
| 5. Evidence supporting/limiting | Supporting: decisions/DD-026's model, already validated across Stage 1 Rounds 1–3 (DD-027, DD-028). Limiting: Host/Varnish remains Unconfirmed/Unconfirmed (decisions/DD-028) — the primary open unknown this candidate's future execution would address, not resolve now |
| 6. Mechanism claimed | **None.** Must remain valid whether future evidence eventually confirms active cache delivery, configured-but-unconfirmed delivery, no configured cache within inspected scope, contradiction, or continued insufficient evidence — it does not assume Varnish is active or that caching is absent |
| 7. Falsification criteria | If a future authorized round under this pathway reaches the same CS-4 — Insufficient Evidence outcome as Stage 1 with no new information, the pathway itself (not the mechanism) is falsified as a productive next step and must be reported as such, not silently repeated |
| 8. Measurement/observability plan | Reuses decisions/DD-026's Configured/Delivered-State model and CSE-5A/5B split as the template for any future round; no new evidence collected by this candidate's construction |
| 9. Privacy/security | Extends decisions/DD-029/DD-030's checklist unchanged, including phpMyAdmin excluded and internal server file paths redacted |
| 10. Required access | Repository-only now (this definition). Future, **blocked**: any authenticated hosting/Varnish/CDN panel access beyond what Stage 1 already used |
| 11. External-change classification | Verification-only sub-path: not a change. A hypothetical future feasibility-*test* sub-path (e.g., toggling a setting to observe effect) would be an external/production change and is explicitly out of scope for this candidate as constructed |
| 12. Reversibility | Verification sub-class: fully reversible (read-only). Any feasibility-test sub-class, if ever proposed later, would need its own reversibility assessment at that time — not assumed reversible by default |
| 13. Rollback plan | Not applicable to verification (nothing changes); explicitly deferred to, and required of, any future feasibility-test proposal before that proposal could be authorized |
| 14. Failure/stop conditions | If a future round again reaches Insufficient Evidence, or if any authenticated access reveals a materially new mechanism, work stops for lifecycle review (Phase 1 pause rule) rather than escalating automatically |
| 15. Feasibility dependencies | Authenticated hosting/Varnish/CDN panel access — named, **Blocked** |
| 16. Expected outcome | A defined pathway that may, once separately authorized and executed, resolve, narrow, or fail to resolve the Host/Varnish Unconfirmed/Unconfirmed state; no cache-activation outcome or TTFB improvement is promised |
| 17. Excluded business claims | No ranking, conversion, revenue, or reservation benefit implied by cache-state verification |
| 18. Comparison with no-change | Materially distinct from IC-OD2-001: targets CE-DQ4-B specifically rather than declining to distinguish mechanisms; higher access dependency, still fully reversible at the verification stage |
| 19. Independent attack | Phase 7 below |
| 20. Later-gate requirement | Any future round under this pathway requires a separate future Independent Candidate Readiness Gate, its own evidence-request specification (mirroring OD2-CAND-3's pattern), and explicit case-owner authorization — none of which is created here |

**Metadata:** Status: Candidate — Unselected · Authority: DD-032/DD-033 · Confidence: Medium-Low (inherited cap; pathway itself Supported by DD-026 precedent, target mechanism state Unassessable) · Unresolved dependencies: authenticated hosting/CDN panel access authorization · Evidence class needed later: domain-specific Varnish/CDN configured+delivered state · Renewed Diagnosis required?: Possibly, if the model itself proves inapplicable to whatever access is eventually authorized · Later feasibility gate required?: Yes · External-change gate required for implementation?: Yes, for any feasibility-test sub-class

---

### IC-OD2-004 — Backend/Origin Feasibility Preparation

| Field (ICR) | Content |
|---|---|
| 1. Identifier | IC-OD2-004 |
| 2. Problem boundary | Defines a future feasibility pathway for distinguishing application/backend processing (CE-DQ4-A) from cache-layer delivery (CE-DQ4-B) as the responsible mechanism. Does not use phpMyAdmin, execute SQL/PHP, activate profiling/debugging, inspect production logs, assume backend delay, or treat Stage 2 Round 1's already-exhausted evidence as if it produced timing data |
| 3. Linked Design requirement | OD2-REQ-011 (no presupposition of CE-DQ4-A/B dominance); OD2-REQ-013 (no execution outside read-only boundary without separate gate); OD2-REQ-017 (no PHP/database/code change selected or implied) |
| 4. Explicit assumptions | AS-IC4-001 through AS-IC4-003 (Phase 6) |
| 5. Evidence supporting/limiting | Supporting: CE-DQ4-A's consistently elevated ~0.72–1.07s post-TLS wait (OD2-AS-003), entangled not independently resolved. Limiting: decisions/DD-031 — BE-01/02/04 Attempted—Data Not Available, BE-03/05/06/07/08 Not Supplied; no distinguishing timing evidence exists; DD-031's six narrow interpretations (no-issues banner, "NO RESULT FOUND," no-snapshots, PHP-configuration context, Xdebug-unchecked) explicitly forbid reading absence-of-finding as backend health |
| 6. Mechanism claimed | **None as established fact.** CE-DQ4-A is named as the mechanism this pathway *could* address, explicitly without claiming it is confirmed, active, or dominant over CE-DQ4-B |
| 7. Falsification criteria | If a future authorized profiling/timing exercise shows backend processing time indistinguishable from a cache-absent baseline, the "backend is a material contributor" hypothesis is falsified for that reading and must be reported, not discarded silently |
| 8. Measurement/observability plan | A future specification (not executed here) of a bounded, explicitly-scoped timing/profiling exercise, distinguished structurally from Stage 2 Round 1's owner-supplied-screenshot evidence class |
| 9. Privacy/security | Any profiling/debugging access is flagged as high privacy/security risk (server-side execution) — extends DD-029/DD-030's checklist; phpMyAdmin and SQL/PHP execution remain permanently excluded absent new authorization |
| 10. Required access | Repository-only now (this definition). Future, **blocked**: profiler/debug activation, SQL/PHP execution, production log inspection, phpMyAdmin |
| 11. External-change classification | A hypothetical future profiling run, even if read-only in effect, still requires enabling a debug/profiling mode — classified as a configuration change and therefore an external/production change, out of scope for this candidate as constructed |
| 12. Reversibility | Not assessable at this stage — depends entirely on what specific profiling mechanism is eventually proposed; this candidate does not assume it would be reversible |
| 13. Rollback plan | Required in full, at construction time, of any future profiling proposal before it could be authorized — explicitly deferred as a precondition, not performed now |
| 14. Failure/stop conditions | If any future step would require production debug-mode activation without a clear, pre-defined disable/rollback path, work stops and does not proceed to authorization request |
| 15. Feasibility dependencies | Profiler/debug activation, SQL/PHP execution, log access — all named, **Blocked** |
| 16. Expected outcome | A defined pathway that may, once separately authorized and executed, narrow or fail to narrow CE-DQ4-A's contribution; no ms figure or improvement is promised |
| 17. Excluded business claims | No ranking, conversion, revenue, or reservation benefit implied by backend feasibility work |
| 18. Comparison with no-change | Materially distinct from IC-OD2-001 and IC-OD2-003: targets CE-DQ4-A specifically; highest privacy/access sensitivity of the five candidates; not reversible-by-default |
| 19. Independent attack | Phase 7 below |
| 20. Later-gate requirement | Any future profiling exercise requires a separate future Independent Candidate Readiness Gate, an explicit privacy/security review, and an external-change gate before any debug/profiling activation |

**Metadata:** Status: Candidate — Unselected · Authority: DD-032/DD-033 · Confidence: Medium-Low (inherited cap; CE-DQ4-A contribution itself Weakly Supported, entangled) · Unresolved dependencies: profiling/debug access authorization, privacy/security review · Evidence class needed later: backend/application processing timing · Renewed Diagnosis required?: Possibly, if profiling reveals a mechanism outside CE-DQ4-A/B · Later feasibility gate required?: Yes · External-change gate required for implementation?: Yes

---

### IC-OD2-005 — Combined Staged Verification

| Field (ICR) | Content |
|---|---|
| 1. Identifier | IC-OD2-005 |
| 2. Problem boundary | Defines a staged future pathway sequencing measurement refresh (IC-OD2-001-style), cache-state verification (IC-OD2-003-style), and backend feasibility (IC-OD2-004-style), each separately gated, with explicit stop decisions between stages. Does not itself execute any stage |
| 3. Linked Design requirement | DD-025 Condition 6 (cache-confirmation pause-for-review precedent, extended by analogy); OD2-REQ-014 (renewed-Diagnosis pause rule); OD2-REQ-013 (no execution outside read-only boundary without separate gate) |
| 4. Explicit assumptions | AS-IC5-001 through AS-IC5-004 (Phase 6) |
| 5. Evidence supporting/limiting | Supporting: the case's own Stage 1/Stage 2 staged precedent (decisions/DD-025) directly validates staging as a discipline. Limiting: staging itself does not resolve any mechanism uncertainty — it only sequences how future work, if authorized, would be ordered |
| 6. Mechanism claimed | **None.** Sequences other candidates' pathways without adopting any of their claims as its own; each stage inherits that stage's own mechanism-neutrality |
| 7. Falsification criteria | If any stage, once executed under separate future authorization, produces a result inconsistent with continuing to the next stage as originally sequenced, the staging plan itself is falsified for that path and must route to case-owner review, not proceed automatically |
| 8. Measurement/observability plan | Stage 1: CrUX refresh (IC-OD2-001's plan). Stage 2: cache-state verification (IC-OD2-003's plan). Stage 3: backend feasibility (IC-OD2-004's plan). Each stage's own plan is unchanged from its source candidate, not weakened by combination |
| 9. Privacy/security | Inherits the highest privacy/security sensitivity of its component stages (Stage 3's profiling-related risk) |
| 10. Required access | Repository-only now (this definition — a sequencing plan only). Future, **blocked**: every access dependency named by IC-OD2-001/003/004, unchanged |
| 11. External-change classification | The sequencing plan itself is not a change; each stage's own external-change classification is inherited unchanged |
| 12. Reversibility | Stage 1: full. Stage 2 (verification): full. Stage 3 (feasibility): not assessable at this stage, per IC-OD2-004 |
| 13. Rollback plan | Each stage's own rollback requirement (or explicit deferral, for Stage 3) is inherited unchanged; staging adds no new rollback obligation beyond the sum of its parts |
| 14. Failure/stop conditions | Explicit stage boundaries: **a no-change exit exists after every stage** — completing Stage 1 does not obligate proceeding to Stage 2, nor Stage 2 to Stage 3. **No automatic escalation.** If any stage's result surfaces a materially new mechanism, the plan routes to renewed-Diagnosis lifecycle review before any further stage proceeds |
| 15. Feasibility dependencies | Union of IC-OD2-001/003/004's dependencies, all named, **Blocked** |
| 16. Expected outcome | A defined, gated sequence that may resolve some, all, or none of the open mechanism questions across its stages; no cumulative numeric improvement is promised |
| 17. Excluded business claims | No ranking, conversion, revenue, or reservation benefit implied at any stage |
| 18. Comparison with no-change | Encompasses IC-OD2-001 as its own Stage 1 and explicit exit point at every subsequent stage — the only candidate that formally nests the no-change comparator inside itself |
| 19. Independent attack | Phase 7 below |
| 20. Later-gate requirement | Each stage requires its own separate future Independent Candidate Readiness Gate (or equivalent) and explicit case-owner authorization before proceeding; no stage is authorized by this workstream |

**Metadata:** Status: Candidate — Unselected · Authority: DD-032/DD-033 · Confidence: Medium-Low (inherited cap; staging discipline itself Supported by DD-025 precedent) · Unresolved dependencies: union of all component-stage dependencies · Evidence class needed later: sequenced union of IC-OD2-001/003/004's evidence classes · Renewed Diagnosis required?: Possibly, at any stage boundary · Later feasibility gate required?: Yes, per stage · External-change gate required for implementation?: Yes, for Stage 3 only

---

## Phase 6 — Candidate-Specific Assumption Registers

*Classification scale: Established / Supported / Weakly Supported / Needs More Evidence / Unassessed / Unassessable / Contradicted. No inherited uncertainty is promoted to fact.*

### IC-OD2-001 assumptions

| ID | Assumption | Classification | Basis |
|---|---|---|---|
| AS-IC1-001 | A no-change (or measurement-only) response is organizationally acceptable | **Supported** | Direct case precedent — mirrors OD2-AS-009 exactly; DD-016/DD-019/DD-020 treat Evidence Insufficient as legitimate; DD-022 Common Condition 3 requires a no-change alternative |
| AS-IC1-002 | The 24 Jun–21 Jul 2026 CrUX baseline remains representative today | **Needs More Evidence** | Mirrors OD2-AS-008 (Aging/Needs Refresh) unchanged — no newer reading exists |
| AS-IC1-003 | No technical mechanism (cache or backend) requires immediate action | **Unassessable** | Cannot be assessed without first resolving CE-DQ4-A/B; this candidate takes no position either way |

### IC-OD2-002 assumptions

| ID | Assumption | Classification | Basis |
|---|---|---|---|
| AS-IC2-001 | A future observability layer could discriminate CE-DQ4-A from CE-DQ4-B without changing delivery | **Weakly Supported** | Plausible in principle per OD2-REQ-010's design intent; entirely untested |
| AS-IC2-002 | Safe, credential-free observability expansion is available in principle | **Unassessed** | Depends on specific tooling not yet identified; no evidence either way |
| AS-IC2-003 | Additional read-only observability could resolve the CE-DQ4-A/B entanglement beyond what OD2-AS-007 already found | **Weakly Supported** | Inherits OD2-AS-007's "partially confirmed / partially open" finding without promoting it |
| AS-IC2-004 | The four originally tested pages remain representative of current page mix | **Needs More Evidence** | Mirrors OD2-AS-005 unchanged — new omakase/teppanyaki pages remain untested |
| AS-IC2-005 | Mobile network/radio conditions materially contribute to the tail | **Unassessable** | Mirrors OD2-AS-004 unchanged — untestable via server-side signals |

### IC-OD2-003 assumptions

| ID | Assumption | Classification | Basis |
|---|---|---|---|
| AS-IC3-001 | Domain-specific Varnish state can be determined via a future, safely-scoped authenticated check | **Needs More Evidence** | Dependent entirely on new authorization not yet requested |
| AS-IC3-002 | Varnish is active for konnichiwa.nl | **Unassessable** | Matches Host/Varnish Unconfirmed/Unconfirmed exactly (decisions/DD-028) — no evidence either way, and this candidate must not assume it |
| AS-IC3-003 | The DD-026 Configured/Delivered-State model remains applicable to any future round | **Supported** | Already used and validated across Stage 1 Rounds 1–3 (DD-026, DD-027, DD-028) |
| AS-IC3-004 | Delivered HTML-cache state matches configured HTML-cache state | **Unassessable** | The precise reason DD-026's two-dimensional model was introduced — the two states are not assumed to coincide |

### IC-OD2-004 assumptions

| ID | Assumption | Classification | Basis |
|---|---|---|---|
| AS-IC4-001 | Backend/application processing contributes materially to the elevated response time | **Weakly Supported** | Mirrors OD2-AS-003 exactly — "Survives with Narrowing (entangled, not independently resolved)" |
| AS-IC4-002 | Stage 2 Round 1's Data-Not-Available/Not-Supplied results indicate a healthy backend | **Contradicted** | Explicitly barred by decisions/DD-031's conditions — unavailable evidence must never be read as backend health |
| AS-IC4-003 | A future, separately authorized profiling/timing exercise could distinguish backend contribution | **Unassessed** | Plausible in principle; entirely untested |

### IC-OD2-005 assumptions

| ID | Assumption | Classification | Basis |
|---|---|---|---|
| AS-IC5-001 | Staging reduces the risk of premature mechanism assumption compared to a single combined action | **Supported** | Directly follows the case's own repeated Stage 1/Stage 2 precedent (decisions/DD-025) |
| AS-IC5-002 | Each stage can be meaningfully gated independently without forcing escalation | **Supported** | Mirrors DD-025 Condition 6's pause-for-review pattern, already validated in practice |
| AS-IC5-003 | A materially new mechanism could emerge requiring renewed Diagnosis mid-staging | **Unassessed** | Unknown until any stage is actually executed |
| AS-IC5-004 | Time-of-day/load variability materially contributes to the tail | **Unassessable** | Mirrors OD2-AS-006 unchanged — all DQ-004 measurements were single-session, single-day |

**Coverage check:** Varnish domain-specific status (AS-IC3-002), delivered HTML-cache state (AS-IC3-004), backend processing contribution (AS-IC4-001), CrUX baseline freshness (AS-IC1-002), page-mix effects (AS-IC2-004), network effects (AS-IC2-005), time/load variability (AS-IC5-004), availability of safe observability (AS-IC2-002), organizational acceptability of no-change (AS-IC1-001) — all nine required topics addressed across the candidate set.

---

## Phase 7 — Falsification and Attack

*Same twenty dimensions applied independently to every candidate. No candidate is Rejected outright; where a genuine precision gap was found during construction, it is marked Survives with Narrowing and the narrowing is already reflected in the candidate's field above (Phase 4/5) — no prior text required deletion.*

### IC-OD2-001

| # | Attack | Verdict | Reasoning |
|---|---|---|---|
| 1 | Assumes caching is absent | Survives | Field 6: no mechanism claimed |
| 2 | Assumes Varnish is active | Survives | Same |
| 3 | Assumes backend delay | Survives | Same |
| 4 | Treats Evidence Insufficient as positive evidence | Survives | Candidate makes no evidentiary claim at all |
| 5 | Uses lab data as field evidence | Survives | No lab data involved |
| 6 | Uses account-level data as domain-specific evidence | Survives | Not applicable — no BE-class evidence used |
| 7 | Requires hidden authenticated access | Survives | Field 10: CrUX pull is public, and even so named Blocked pending authorization |
| 8 | Requires a production mutation | Survives | Field 11: not a change |
| 9 | Introduces profiling/debugging | Survives | Not applicable |
| 10 | Introduces SQL/PHP/database inspection | Survives | Not applicable |
| 11 | Weakens privacy boundaries | Survives | Field 9: none involved |
| 12 | Omits no-change | Survives | This candidate **is** the no-change comparator |
| 13 | Introduces numerical guarantees | Survives | Field 16: no numeric guarantee |
| 14 | Introduces ranking or commercial claims | Survives | Field 17: explicitly excluded |
| 15 | Hides feasibility dependencies | Survives | Field 15: CrUX pull named, Blocked |
| 16 | Lacks reversibility or rollback | Survives | Field 12–13: fully reversible, no state change |
| 17 | Bypasses renewed Diagnosis | Survives | Field 14: material divergence triggers case-owner review |
| 18 | Bypasses candidate selection | Survives | No selection attempted anywhere in this document |
| 19 | Bypasses feasibility authorization | Survives | Field 20: refresh itself requires separate authorization |
| 20 | Bypasses implementation/external-change authorization | Survives | Field 20 |

### IC-OD2-002

| # | Attack | Verdict | Reasoning |
|---|---|---|---|
| 1 | Assumes caching is absent | Survives | Mechanism-neutral by design (Field 6) |
| 2 | Assumes Varnish is active | Survives | Same |
| 3 | Assumes backend delay | Survives | Same |
| 4 | Treats Evidence Insufficient as positive evidence | Survives | No evidentiary claim made |
| 5 | Uses lab data as field evidence | Survives | Not applicable |
| 6 | Uses account-level data as domain-specific evidence | Survives | Not applicable |
| 7 | Requires hidden authenticated access | **Survives with Narrowing** | Initial draft risked implying observability tooling could be "lightweight"; narrowed to explicitly name log/monitoring access as Blocked (Field 10, 15) |
| 8 | Requires a production mutation | Survives | Field 11: defining ≠ installing |
| 9 | Introduces profiling/debugging | Survives | Field 2: explicitly excluded |
| 10 | Introduces SQL/PHP/database inspection | Survives | Not applicable |
| 11 | Weakens privacy boundaries | Survives | Field 9: flags any future tooling for redaction review |
| 12 | Omits no-change | Survives | Field 18: explicit comparison retained |
| 13 | Introduces numerical guarantees | Survives | Field 16 |
| 14 | Introduces ranking or commercial claims | Survives | Field 17 |
| 15 | Hides feasibility dependencies | Survives | Field 15: log/monitoring access named, Blocked |
| 16 | Lacks reversibility or rollback | Survives | Field 12–13: reversibility required as a precondition of any future authorization |
| 17 | Bypasses renewed Diagnosis | Survives | Field 14 |
| 18 | Bypasses candidate selection | Survives | No selection attempted |
| 19 | Bypasses feasibility authorization | Survives | Field 20 |
| 20 | Bypasses implementation/external-change authorization | Survives | Field 20 |

### IC-OD2-003

| # | Attack | Verdict | Reasoning |
|---|---|---|---|
| 1 | Assumes caching is absent | Survives | Field 6: explicit non-assumption |
| 2 | Assumes Varnish is active | Survives | Field 6, AS-IC3-002 |
| 3 | Assumes backend delay | Survives | Out of this candidate's scope entirely |
| 4 | Treats Evidence Insufficient as positive evidence | **Survives with Narrowing** | Initial framing risked reading a repeated CS-4 result as "probably no cache"; narrowed via Field 7's falsification criterion, which treats a repeated CS-4 as falsifying the *pathway*, not the mechanism |
| 5 | Uses lab data as field evidence | Survives | Not applicable |
| 6 | Uses account-level data as domain-specific evidence | Survives | Field 5 explicitly names this as the primary open limitation, not resolved by assumption |
| 7 | Requires hidden authenticated access | Survives | Field 10: named, Blocked |
| 8 | Requires a production mutation | Survives | Field 11: verification sub-path only, feasibility-test sub-path explicitly out of scope |
| 9 | Introduces profiling/debugging | Survives | Not applicable |
| 10 | Introduces SQL/PHP/database inspection | Survives | Field 9: phpMyAdmin excluded, matching DD-029/DD-030 |
| 11 | Weakens privacy boundaries | Survives | Field 9 |
| 12 | Omits no-change | Survives | Field 18: explicit comparison |
| 13 | Introduces numerical guarantees | Survives | Field 16 |
| 14 | Introduces ranking or commercial claims | Survives | Field 17 |
| 15 | Hides feasibility dependencies | Survives | Field 15 |
| 16 | Lacks reversibility or rollback | Survives | Field 12–13 |
| 17 | Bypasses renewed Diagnosis | Survives | Field 14 |
| 18 | Bypasses candidate selection | Survives | No selection attempted |
| 19 | Bypasses feasibility authorization | Survives | Field 20 |
| 20 | Bypasses implementation/external-change authorization | Survives | Field 20 |

### IC-OD2-004

| # | Attack | Verdict | Reasoning |
|---|---|---|---|
| 1 | Assumes caching is absent | Survives | Out of this candidate's scope |
| 2 | Assumes Varnish is active | Survives | Out of this candidate's scope |
| 3 | Assumes backend delay | Survives | Field 6: named as addressable, not confirmed |
| 4 | Treats Evidence Insufficient as positive evidence | Survives | Field 5: DD-031's six narrow interpretations explicitly preserved |
| 5 | Uses lab data as field evidence | Survives | Not applicable |
| 6 | Uses account-level data as domain-specific evidence | Survives | Field 5: DirectAdmin's account-level PHP version explicitly not treated as domain-specific finding |
| 7 | Requires hidden authenticated access | Survives | Field 10: named, Blocked |
| 8 | Requires a production mutation | **Survives with Narrowing** | Initial framing risked treating a "read-only profiler" as non-mutating; narrowed — Field 11 now classifies any debug/profiling activation as a configuration change, i.e., an external/production change, regardless of read-only intent |
| 9 | Introduces profiling/debugging | Survives | Field 2/10: named, Blocked, not performed |
| 10 | Introduces SQL/PHP/database inspection | Survives | Field 2/9: explicitly excluded, phpMyAdmin permanently excluded |
| 11 | Weakens privacy boundaries | Survives | Field 9: flagged high-risk, extends DD-029/DD-030 |
| 12 | Omits no-change | Survives | Field 18 |
| 13 | Introduces numerical guarantees | Survives | Field 16 |
| 14 | Introduces ranking or commercial claims | Survives | Field 17 |
| 15 | Hides feasibility dependencies | Survives | Field 15 |
| 16 | Lacks reversibility or rollback | Survives | Field 12–13: reversibility explicitly not assumed, deferred as precondition |
| 17 | Bypasses renewed Diagnosis | Survives | Field 14 |
| 18 | Bypasses candidate selection | Survives | No selection attempted |
| 19 | Bypasses feasibility authorization | Survives | Field 20 |
| 20 | Bypasses implementation/external-change authorization | Survives | Field 20 |

### IC-OD2-005

| # | Attack | Verdict | Reasoning |
|---|---|---|---|
| 1 | Assumes caching is absent | Survives | Inherits Field 6 of each component stage |
| 2 | Assumes Varnish is active | Survives | Same |
| 3 | Assumes backend delay | Survives | Same |
| 4 | Treats Evidence Insufficient as positive evidence | Survives | Inherits IC-OD2-003's narrowed falsification criterion |
| 5 | Uses lab data as field evidence | Survives | Not applicable |
| 6 | Uses account-level data as domain-specific evidence | Survives | Inherits IC-OD2-003/004's explicit non-conflation |
| 7 | Requires hidden authenticated access | Survives | Field 10: union of dependencies, all named, Blocked |
| 8 | Requires a production mutation | Survives | Field 11: inherited per-stage classification |
| 9 | Introduces profiling/debugging | Survives | Field 2: Stage 3 only, named Blocked |
| 10 | Introduces SQL/PHP/database inspection | Survives | Not applicable |
| 11 | Weakens privacy boundaries | Survives | Field 9: inherits highest-sensitivity stage |
| 12 | Omits no-change | Survives | Field 18: no-change nested as its own Stage 1 and exit point at every stage |
| 13 | Introduces numerical guarantees | Survives | Field 16 |
| 14 | Introduces ranking or commercial claims | Survives | Field 17 |
| 15 | Hides feasibility dependencies | Survives | Field 15 |
| 16 | Lacks reversibility or rollback | Survives | Field 12–13 |
| 17 | Bypasses renewed Diagnosis | Survives | Field 14: explicit stage-boundary pause rule, the candidate's central design feature |
| 18 | Bypasses candidate selection | Survives | No selection attempted |
| 19 | Bypasses feasibility authorization | **Survives with Narrowing** | Initial framing risked implying that completing Stage 1 alone justified proceeding to Stage 2 without a fresh authorization request; narrowed — Field 14 now states explicitly "no automatic escalation," and Field 20 requires a separate gate **per stage**, not once for the whole sequence |
| 20 | Bypasses implementation/external-change authorization | Survives | Field 20 |

**Summary: 96 of 100 attacks Survive outright; 4 Survive with Narrowing (IC-OD2-002 Attack 7, IC-OD2-003 Attack 4, IC-OD2-004 Attack 8, IC-OD2-005 Attack 19), each resolved directly within the candidate's own fields above. Zero Rejected — no candidate fails materially; all five remain Candidate — Unselected.**

---

## Phase 8 — Comparative Evaluation

*Qualitative comparison only. No weighted score. No winner chosen, no candidate recommended, no ranking as first/second/preferred.*

| Dimension | IC-OD2-001 No-Change | IC-OD2-002 Observability-Only | IC-OD2-003 Cache Verification | IC-OD2-004 Backend Feasibility | IC-OD2-005 Combined Staged |
|---|---|---|---|---|---|
| Consistency with OD-002 | Full — makes no mechanism claim | Full — mechanism-neutral instrumentation | Full — targets CE-DQ4-B only as an open question | Full — targets CE-DQ4-A only as an open question | Full — sequences the others unchanged |
| Mechanism neutrality | Complete | Complete | Complete (does not presume Varnish state) | Complete (does not presume backend contribution) | Complete (inherits component neutrality) |
| Evidence dependency | Lowest — one future public pull | Low-Medium — depends on tooling not yet defined | Medium — depends on authenticated access | Medium-High — depends on profiling access | Highest — union of all three |
| Access dependency | None (public only) | Log/monitoring (Blocked) | Hosting/CDN panel (Blocked) | Profiler/debug/SQL/PHP (Blocked) | Union of all (Blocked) |
| Privacy/security risk | None | Low-Medium | Medium | Highest | Highest (inherits Stage 3) |
| Reversibility | Full | High (by design; execution deferred) | Full for verification; unassessed for any feasibility-test | Unassessed (deferred to future proposal) | Mixed — full for Stages 1–2, unassessed for Stage 3 |
| Falsifiability | Yes — refreshed-baseline divergence | Yes — discrimination-capability test | Yes — repeated CS-4 falsifies the pathway | Yes — profiling-vs-baseline comparison | Yes — inherits all three, plus stage-sequencing falsifiability |
| Operational burden (to define, not execute) | Lowest | Low-Medium | Medium | Medium-High | Highest |
| Ability to preserve no-change | Is the comparator itself | Preserved as an explicit field | Preserved as an explicit field | Preserved as an explicit field | Preserved as its own nested Stage 1 |
| Ability to expose need for renewed Diagnosis | Direct — any divergence triggers review | Direct — undiscriminating plan triggers revision | Direct — repeated CS-4 as pathway failure | Direct — profiling revealing new mechanism | Direct — at every stage boundary |
| Readiness for a later feasibility gate | Not applicable (no feasibility content) | Not yet — depends on tooling definition | Ready in outline; access authorization is the blocker | Ready in outline; privacy/security review is the blocker | Ready per stage, in the order defined |
| Residual uncertainty | High (nothing resolved, deliberately) | High (discriminating power untested) | High (Host/Varnish remains Unconfirmed/Unconfirmed) | High (CE-DQ4-A remains unresolved) | High (sum of all three, sequenced not reduced) |

**Unresolved trade-offs, stated explicitly, not resolved here:**

- IC-OD2-001 carries the lowest burden and risk but resolves nothing about mechanism; IC-OD2-003/004 carry the highest access dependency but are the only candidates that could, if separately authorized later, directly narrow CE-DQ4-B or CE-DQ4-A respectively.
- IC-OD2-002 sits between the two extremes but its own discriminating power (AS-IC2-001) is only Weakly Supported — whether it is worth defining further before IC-OD2-003/004 is an open question this workstream does not answer.
- IC-OD2-005 does not reduce any individual risk; it only sequences and gates the other candidates' risks. Whether staging is preferable to pursuing IC-OD2-003 or IC-OD2-004 independently is left open.
- None of the five candidates can, by construction, resolve CE-DQ4-C/E/F/G (geographic, page-mix, network, time/load) — DD-032 Additional Boundary 7 and DD-033 Set A Condition 12 both keep these mechanisms eligible for future work, but no candidate here addresses them; this is a disclosed gap, not an oversight.

---

## Phase 9 — Whole-Workstream Challenge

| # | Challenge | Verdict | Reasoning |
|---|---|---|---|
| 1 | False diversity between candidates | Survives | Each candidate targets a materially different uncertainty (baseline freshness, discrimination capability, cache state, backend state, sequencing) with non-overlapping access dependencies |
| 2 | No-change as a token candidate | Survives | IC-OD2-001 satisfies all twenty ICR requirements with the same rigor as every other candidate (Phase 4/5) |
| 3 | Hidden cache preference | Survives | IC-OD2-003 is one of five candidates, not privileged; Phase 8 states no winner; AS-IC3-002 explicitly marks Varnish-active as Unassessable |
| 4 | Hidden backend preference | Survives | IC-OD2-004 is one of five candidates, not privileged; AS-IC4-001 explicitly Weakly Supported, not promoted |
| 5 | Staged candidate disguising automatic escalation | Survives | IC-OD2-005 Field 14 explicitly states "no automatic escalation" and requires a separate gate per stage (Field 20) |
| 6 | Feasibility preparation disguising feasibility execution | Survives | IC-OD2-003/004 both name every access dependency as Blocked and perform none of it; Phase 7 Attacks 8–10 confirm |
| 7 | Candidate comparison disguising selection | Survives | Phase 8's header explicitly states no winner, no recommendation, no ranking; the table is qualitative and every dimension is stated for all five candidates equally |
| 8 | Medium-Low confidence being ignored | Survives | Every candidate's Metadata line states "Confidence: Medium-Low (inherited cap)" explicitly, none claims higher |
| 9 | CE-DQ4-C/E/F/G disappearing from consideration | **Survives with Narrowing** | No candidate addresses these four mechanisms directly; narrowed by adding the explicit disclosure in Phase 8's "Unresolved trade-offs" that this is a known, disclosed gap, consistent with DD-032 Additional Boundary 7 and DD-033 Set A Condition 12 — not a silent omission |
| 10 | Ranking/business benefits reappearing | Survives | Every candidate's Field 17 explicitly excludes ranking/conversion/revenue/reservation claims; Phase 8 contains no business-outcome language |
| 11 | Implementation language entering the workstream | Survives | No candidate's fields describe executing, deploying, or configuring anything; every access dependency is marked Blocked; Field 20 in every candidate restates the later-gate requirement |
| 12 | Lifecycle boundaries collapsing | Survives | This document creates no readiness gate, requests no selection, and its own status line and closing statement (Phase 10) explicitly separate construction from review and selection |

**Eleven Survive outright; one Survives with Narrowing (Attack 9), resolved by an explicit disclosure already reflected in Phase 8 above — no candidate content required correction.**

---

## Phase 10 — Workstream Conclusion

**Candidates remaining Candidate — Unselected:** IC-OD2-001, IC-OD2-002, IC-OD2-003, IC-OD2-004, IC-OD2-005 — all five.

**Attack outcomes:** 96 of 100 per-candidate attacks Survive outright; 4 Survive with Narrowing, each resolved within the candidate's own fields; 0 Rejected. Whole-workstream challenge: 11 of 12 Survive outright; 1 Survives with Narrowing, resolved by explicit disclosure. No candidate or challenge item was Rejected; nothing was deleted.

**Unresolved trade-offs (Phase 8):** burden/risk vs. discriminating power across the five candidates; whether IC-OD2-002's untested discriminating power justifies definition before pursuing IC-OD2-003/004; whether staging (IC-OD2-005) is preferable to pursuing IC-OD2-003 or IC-OD2-004 independently; CE-DQ4-C/E/F/G remain outside every candidate's scope, disclosed not resolved.

**Readiness for independent review:** the candidate set is complete against ICR-001–ICR-020 for all five candidates, independently attacked, comparatively evaluated without a winner, and whole-workstream-challenged — **ready for an Independent Candidate Readiness Gate.**

---

**Candidate construction completed.**
**Independent Candidate Readiness Gate required.**
**Candidate selection remains unauthorized.**
**No feasibility work, implementation, Transformation execution or external change has been authorized or performed.**
