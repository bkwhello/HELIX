# OD-001 Design Workstream
---

Date: 26 July 2026. Author: Claude, acting as an **independent HELIX Design Constructor** for EC-002, scoped exclusively to OD-001 under decisions/DD-022's Case-Owner Decision (Kelvin Wong, 26 July 2026, AUTHORIZED WITH CONDITIONS). This is a Design artifact: it specifies and compares candidate future organizational states. **It does not implement, publish, deploy, or authorize any change, and it does not select a preferred candidate.** OD-002 remains authorized but is explicitly **not started** by this document — no OD-002 work appears anywhere below. OD-003 remains **not authorized** for Design and is not addressed. Transformation remains unauthorized regardless of anything in this document.

---

## Status — Case-Owner Selection (recorded 26 July 2026)

*Status-only addendum. It does not alter any requirement, candidate formulation, attack, or comparison below — Phases 1 through 5 remain exactly as originally constructed. Authority: decisions/DD-023, Case-Owner Selection section, Kelvin Wong, 26 July 2026.*

| Candidate | Status |
|---|---|
| **D** — Structured Re-Diagnosis Before Reallocation | **Selected for Further Design** |
| A — No-Change | Retained — Unselected Alternative |
| B — Flagship-Weighted Reallocation | Retained — Unselected Alternative |
| C — Broad-Category-Weighted Reallocation | Retained — Unselected Alternative |

```yaml
od_001_design_established: false
```

`od_001_design_established` remains **false** — this selection chooses which candidate proceeds to further specification; it does not itself constitute an established Organizational Design. `transformation_authorized` and `external_changes_authorized` remain **false**, unconditionally — this selection authorizes neither. See decisions/DD-023's Case-Owner Selection section for the complete decision record, including all eighteen conditions binding Candidate D's selection. *(Note: at the time this status was first recorded, Candidate D's Re-Measurement Schedule/Protocol had not yet been created — see the status block immediately below for its current state.)*

---

## Status — Candidate D Re-Measurement Protocol (recorded 26 July 2026)

*Status/reference-only addendum. It does not alter any requirement, candidate formulation, attack, or comparison in Phases 1–5 below, and does not change Candidate A/B/C's statuses recorded above — those remain exactly as stated in the "Status — Case-Owner Selection" section.*

| Field | Value |
|---|---|
| Candidate D protocol identifier | design/OD-001-candidate-d-measurement-protocol.md |
| Protocol status | **Prepared — Execution Pending** |
| Protocol executed? | **No** — no Search Console access has occurred |
| Case-owner execution decision | **Pending** (decisions/DD-024, Candidate D Protocol Readiness Gate) |
| Candidate A status | Retained — Unselected Alternative (unchanged) |
| Candidate B status | Retained — Unselected Alternative (unchanged) |
| Candidate C status | Retained — Unselected Alternative (unchanged) |

```yaml
od_001_candidate_d_protocol_status: Prepared — Execution Pending
od_001_candidate_d_protocol_executed: false
od_001_candidate_d_protocol_execution_decision: Pending
```

See design/OD-001-candidate-d-measurement-protocol.md for the complete protocol, and decisions/DD-024 for its independent readiness-gate review.

### Status Update — Execution Approved With Conditions (recorded 26 July 2026, decisions/DD-024 Case-Owner Decision)

*This update supersedes the "Pending" case-owner execution decision recorded in the table above chronologically; it does not rewrite that table. Candidate A/B/C statuses remain unchanged.*

Kelvin Wong issued **APPROVED WITH CONDITIONS FOR READ-ONLY EXECUTION** for design/OD-001-candidate-d-measurement-protocol.md (decisions/DD-024, Case-Owner Decision section), subject to twenty-one binding conditions recorded verbatim there.

| Field | Updated value |
|---|---|
| Protocol status | **Approved With Conditions — Awaiting Execution Window** |
| Protocol executed? | **No** — execution not permitted before 21 September 2026; no Search Console access has occurred |
| Case-owner execution decision | **Approved With Conditions For Read-Only Execution** (no longer Pending) |
| Candidate A status | Retained — Unselected Alternative (unchanged) |
| Candidate B status | Retained — Unselected Alternative (unchanged) |
| Candidate C status | Retained — Unselected Alternative (unchanged) |

```yaml
candidate_d_protocol_execution_authorized: true
candidate_d_protocol_execution_mode: Read-Only
candidate_d_protocol_not_before: 2026-09-21
candidate_d_protocol_authorization_expires: 2026-12-31
candidate_d_protocol_executed: false
candidate_d_timezone_basis: Pending Pre-Execution Confirmation
candidate_d_account_context: Pending Pre-Execution Confirmation
od_001_design_established: false
od_002_design_started: false
transformation_authorized: false
external_changes_authorized: false
```

Approval is **not** execution. No Search Console access has occurred. See decisions/DD-024's Case-Owner Decision section for the complete twenty-one-condition record.

---

## Boundaries Inherited From decisions/DD-022 (binding, restated)

**Common conditions (both OD-001 and OD-002), as they apply here:**

1. Every binding condition from decisions/DD-017 (OD-001's Diagnosis Establishment Gate) is preserved verbatim and carried into this workstream — see each Phase below for where it applies.
2. This workstream begins with explicit assumptions, constraints, falsification criteria, and measurement requirements (Phase 1), **before** any candidate is constructed (Phase 2).
3. At least three materially distinct alternatives are developed, including a legitimate no-change/current-state alternative (Phase 2).
4. No preferred alternative is assumed at any point in this document.
5. This workstream compares alternatives; it implements none of them.
6. Expected outcomes are specified as measurable against like-for-like baseline evidence (Phase 5).
7. No conversion, revenue, or reservation effect is claimed anywhere below.
8. Any external or production change remains subject to its own, later, separate authorization — none is requested or implied here.
9. Transformation remains unauthorized.
10. This authorization, and therefore this workstream, may be withdrawn if new evidence contradicts OD-001.

**OD-001-specific conditions, as they apply here:**

1. Scope remains limited to: teppanyaki; omakase; japans restaurant; sushi; the Search Console organic surface. No other theme, no local pack, appears as a target of any candidate below.
2. Local-pack evidence (OC-003, EV-018) is treated as separate context only — never pooled into this workstream's organic-surface target condition.
3. Competitive density/breadth is treated throughout as associative, not proven causal — consistent with OD-001's own Diagnosed Mechanism section.
4. Content depth and dedicated-page ownership are **not** reintroduced as an established lever anywhere below (CE-DQ1-A, CE-DQ1-C were falsified in diagnosis/DQ-001-investigation.md; decisions/DD-017 Condition 1 requires this).
5. Query-to-page causality remains unestablished — no candidate below asserts that a specific page will capture a specific query.
6. This workstream distinguishes organizational effort, emphasis, and resource-allocation alternatives — it does not propose content production as a lever.
7. OC-007/UR-003's Attribution Constraint is preserved — no candidate is evaluated against, or justified by, any reservation, conversion, or revenue outcome.

---

## Phase 1 — Requirements Derivation

*Performed before any candidate is constructed, per decisions/DD-022's binding Condition 2.*

The bounded Design Question this workstream answers (decisions/DD-022, Phase 2C):

> "What future state of organizational effort, emphasis, or resource allocation across these four themes, if any, would be justified by this competitive-density difference — given that content depth and dedicated-page ownership have been established as non-explanatory and must not be treated as the lever?"

### Requirements

| # | Requirement | Basis |
|---|---|---|
| R-1 | Any candidate must preserve OD-001's associative (non-causal) framing — no candidate may assert or assume a guaranteed ranking effect | OD-001 Diagnosed Mechanism; decisions/DD-017 Condition 1 |
| R-2 | No candidate may rely on content depth or dedicated-page creation/expansion as its mechanism | decisions/DD-017 Condition 1 note; decisions/DD-022 OD-001 Condition 4 |
| R-3 | Every candidate must remain scoped to the four named themes and the organic-search surface only — no local-pack target, no other theme | decisions/DD-022 OD-001 Conditions 1–2 |
| R-4 | No candidate may claim, or be evaluated against, any conversion, revenue, or reservation benefit | decisions/DD-022 Common Condition 7; OD-001 Condition 7 |
| R-5 | Every candidate must be evaluable via a measurable, like-for-like comparison against Search Console position/CTR/impressions for the four themes (organic surface only), without promising a specific target rank | decisions/DD-022 Common Condition 6; this task's explicit instruction (no top-3 promise) |
| R-6 | No candidate may assert that a specific page will serve a specific query | decisions/DD-022 OD-001 Condition 5 |
| R-7 | A legitimate no-change/current-state alternative must be included among the candidates | decisions/DD-022 Common Condition 3 |
| R-8 | Every candidate must carry a stated, checkable prediction (a falsification criterion) that could distinguish its effect, if any, from the no-change alternative, using the measurement design in Phase 5 | decisions/DD-022 Common Conditions 2, 6 |
| R-9 | No candidate may require, propose, or imply any implementation, publication, production, or external-system change to exist as a Design artifact | decisions/DD-022 Common Condition 5; this task's explicit instruction |

These nine requirements are fixed before Phase 2 and are not adjusted afterward to fit any candidate.

---

## Phase 2 — Candidate Construction

*At least three materially distinct alternatives, including a credible no-change alternative, constructed without presupposing which (if any) is preferred (R-7; decisions/DD-022 Common Conditions 3–4).*

### Candidate A — No-Change (Current-State Baseline)

**Description:** Konnichiwa's current allocation of owner attention, promotional cadence, and communication emphasis across the four themes continues unchanged. No reallocation of effort toward or away from any theme.

**Assumption:** None beyond the status quo continuing as observed.

**Explicit non-claims:** Does not claim the current allocation is optimal; does not claim it is suboptimal.

**Falsifiable prediction:** If measured again over a comparable future window (Phase 5), the four-theme organic position pattern should remain statistically similar to the 21 Apr–21 Jun 2026 baseline, absent any external change in competitor density (which this workstream cannot control or predict).

### Candidate B — Flagship-Weighted Reallocation

**Description:** Organizational emphasis (which dishes are foregrounded in GBP posts, social captions, homepage rotation, staff recommendation emphasis, and similar non-content-production channels) shifts toward teppanyaki and omakase — the two themes OD-001 found face the lowest named-competitor density.

**Assumption:** That increased organizational emphasis on already-low-competition themes would further strengthen or stabilize their existing position advantage.

**Explicit non-claims:** Does not claim any conversion, revenue, or reservation benefit; does not claim a specific target position; does not involve creating new pages or expanding page content.

**Falsifiable prediction:** If measured again (Phase 5), teppanyaki/omakase organic position should show a directional improvement or stronger stability relative to Candidate A's no-change expectation, without a corresponding claim about japans restaurant/sushi.

### Candidate C — Broad-Category-Weighted Reallocation

**Description:** Organizational emphasis shifts toward japans restaurant and sushi — the two underperforming, higher-competitor-density themes — on the premise that they represent the larger unaddressed gap.

**Assumption:** That increased organizational emphasis on high-competition themes could narrow the position gap to the flagship themes, despite the higher competitive density OD-001 documents.

**Explicit non-claims:** Same as Candidate B — no conversion/revenue/reservation claim, no specific target position, no content-production lever.

**Falsifiable prediction:** If measured again (Phase 5), japans restaurant/sushi organic position should show directional improvement relative to Candidate A's no-change expectation, without a corresponding claim about teppanyaki/omakase.

### Candidate D — Structured Re-Diagnosis Before Reallocation

**Description:** No reallocation occurs now. Instead, this candidate specifies a bounded, dated future re-measurement of the same four-theme Search Console position data (Phase 5) as an explicit precondition before any reallocation decision is made, on the premise that a single 61-day window, Medium confidence, and the unresolved category-breadth/named-competitor-crowding entanglement (OD-001 Limitations) are not yet sufficient grounds to reallocate.

**Assumption:** That the current evidence base is better spent confirming stability/trend than acting on a single window.

**Explicit non-claims:** Does not claim reallocation is unwarranted forever — only that it specifies gathering one further data point before choosing.

**Falsifiable prediction:** Not applicable in the same sense as A/B/C — this candidate's own "prediction" is procedural: whether the re-measurement in fact changes the picture (e.g., narrows Medium confidence, or shows the contrast has shifted) is itself the test of whether deferral was worthwhile.

---

## Phase 3 — Independent Challenge (each candidate attacked separately)

*Performed only after all four candidates were fully drafted, so that no candidate's construction could be adjusted in response to another's critique.*

**Attack test set**, applied identically to every candidate:

1. Does the candidate reintroduce content depth or dedicated-page ownership as its mechanism? (must be No)
2. Does the candidate assert or assume a guaranteed causal effect on ranking? (must be No — associative only)
3. Does the candidate cross into local-pack, or claim organic/local-pack equivalence? (must be No)
4. Does the candidate make any conversion, revenue, or reservation claim? (must be No)
5. Does the candidate exceed the four named themes or the organic-search surface?
6. Is the candidate's predicted effect falsifiable via the Phase 5 measurement design?
7. Does the candidate implicitly present itself as the preferred answer, rather than a compared alternative?
8. Does the candidate require any implementation, publication, or external change to exist as a Design artifact? (must be No)
9. **Is the candidate's core mechanism actually grounded in what OD-001 established, or does it introduce an additional, untested assumption?**

### Attack — Candidate A (No-Change)

Tests 1–8: pass cleanly — no content-depth claim, no causal assertion, no local-pack crossing, no outcome claim, in-scope, falsifiable (via absence of the predicted pattern), not self-selecting, requires no implementation. Test 9: **passes without qualification** — no-change requires no new mechanism at all; it is definitionally grounded in whatever OD-001 already established (or did not).

**Outcome: Survives**, no narrowing required.

### Attack — Candidate B (Flagship-Weighted)

Tests 1–8: pass. Test 9 is where this candidate is genuinely vulnerable: **OD-001 characterizes the external competitive landscape (named-competitor density) — it says nothing about whether Konnichiwa's own organizational effort or emphasis is a lever that moves position at all.** No evidence in diagnosis/DQ-001-investigation.md or diagnosis/OD-001…md tests "effort level" as a candidate mechanism; the diagnosis's six tested mechanisms (CE-DQ1-A through F) concern content, pages, entity signals, and authority — not owner attention or promotional cadence. Candidate B therefore rests on an assumption OD-001 neither supports nor contradicts: that more emphasis where competition is already low would compound the existing advantage. This is a plausible hypothesis, not an inherited finding.

**Outcome: Survives with Narrowing.** Narrowing applied: Candidate B must be labeled, wherever cited, as resting on an **untested hypothesis about organizational effort as a lever** — a hypothesis this workstream proposes for future testing, not one OD-001 establishes or implies. It may not be described as "supported by the diagnosis" beyond the diagnosis's own competitive-density finding.

### Attack — Candidate C (Broad-Category-Weighted)

Tests 1–8: pass, on the same basis as Candidate B. Test 9: **identical vulnerability to Candidate B, mirrored** — OD-001 does not establish that increasing effort on a high-competition theme narrows a gap explained by competitor density (an external condition Konnichiwa's own effort does not directly control). If anything, competitive density is, by OD-001's own mechanism, a property of the market that organizational effort alone may not be able to overcome — making Candidate C's premise arguably *harder* to justify from OD-001 than Candidate B's, though OD-001 tests neither directly.

**Outcome: Survives with Narrowing**, on the same terms as Candidate B: must be labeled an untested hypothesis, not an inherited finding, and its comparative plausibility against Candidate B is explicitly left open (see Phase 4).

### Attack — Candidate D (Structured Re-Diagnosis)

Tests 1–8: pass — this candidate proposes no reallocation and no new claim about effort as a lever, only a bounded future measurement. Test 9: **passes cleanly**, for the same structural reason as Candidate A — deferring to more evidence introduces no new unsupported mechanism; it explicitly declines to assume one.

**Outcome: Survives**, no narrowing required.

**Summary of Phase 3:** all four candidates survive independent attack. Two (A, D) required no narrowing. Two (B, C) required the same class of narrowing — both rest on an effort-to-ranking assumption that OD-001 does not test, and both must carry that caveat forward identically. This is a comparison-relevant finding (Phase 4), not a reason to drop either candidate — Design's role, per AD-010, includes proposing testable future-state hypotheses that go beyond diagnosis, provided they are labeled as such and not misrepresented as established.

---

## Phase 4 — Candidate Comparison (no selection)

*Comparison only. No candidate is ranked, scored to a single number, or recommended.*

| | Candidate A — No-Change | Candidate B — Flagship-Weighted | Candidate C — Broad-Category-Weighted | Candidate D — Re-Diagnosis First |
|---|---|---|---|---|
| Grounded directly in OD-001's own finding? | Yes (requires no mechanism claim) | No — rests on an additional, untested effort-to-ranking assumption (Phase 3 narrowing) | No — same untested assumption, arguably higher difficulty given competitive density is external | Yes (requires no mechanism claim) |
| Requires new organizational action now? | No | Yes — reallocated emphasis | Yes — reallocated emphasis | No — only a scheduled future measurement |
| Content-depth/dedicated-page lever used? | No | No | No | No |
| Local-pack crossed? | No | No | No | No |
| Falsifiable via Phase 5 measurement? | Yes | Yes | Yes | Procedurally (tests whether deferral changed the picture) |
| Conversion/revenue/reservation claim? | None | None | None | None |
| What would have to be true for it to "work"? | Nothing new — status quo persists | Effort/emphasis is in fact a lever on position | Effort/emphasis is in fact a lever on position, sufficient to close a competitor-density-driven gap | The current single-window evidence is genuinely insufficient to act on yet |

This table is a comparison of trade-offs and evidentiary grounding, not a scored ranking. Candidates A and D require no unproven mechanism; Candidates B and C both introduce the same class of untested assumption, which this workstream does not adjudicate between. Selecting among these four — including the option of selecting none, or requesting further design iteration — remains the case owner's decision (Case-Owner Decision Boundary, decisions/DD-023).

---

## Phase 5 — Measurement Design (no top-3 promise)

**Metric:** Google Search Console average organic position, CTR, and impressions for the same four query themes OD-001 documents ("teppanyaki utrecht," "omakase utrecht," "japans restaurant utrecht"/"japanese restaurant utrecht," "sushi utrecht") — organic surface only; local pack excluded entirely, consistent with OD-001's own Scope.

**Baseline:** The existing, already-collected 21 Apr–21 Jun 2026 window (EV-014), unchanged and not re-measured retroactively.

**Comparison window:** Any future, equivalent-length window (e.g., a subsequent ~61-day period), pulled the same way (Search Console export, same property, same aggregate device/geography scope) as EV-014, to preserve like-for-like comparability.

**What is measured:** Directional and magnitude change in each theme's average position, CTR, and impressions between the baseline and the comparison window — reported for **all four themes**, regardless of which candidate (if any) is later selected and transformed.

**Explicit non-promise:** This measurement design makes **no promise of reaching any specific rank** (no "top 3," no numeric target) for any theme. "No measurable change" is an explicitly acceptable, non-failure result, consistent with this case's standing treatment of Evidence Insufficient as a legitimate outcome (decisions/DD-016, DD-019, DD-020).

**Explicit exclusions:** This measurement design does not include, and must not be extended to include, local-pack position, conversion, revenue, or reservation data — those remain governed by OC-003 (separate context) and UR-003/OC-007 (Attribution Constraint), respectively, and are outside this workstream's scope regardless of which candidate is later chosen.

**Status:** This is a measurement *design* only — no future measurement has been taken, scheduled, or committed to by this document. Taking it would depend on which candidate (if any) the case owner selects and on any later Transformation authorization, neither of which this document performs.

---

## What This Workstream Does Not Establish, Select, or Authorize

- Does not select a preferred candidate among A, B, C, or D — that choice belongs to the case owner (decisions/DD-023, Case-Owner Decision Boundary).
- Does not authorize Transformation for any candidate — `transformation_authorized` remains `false` regardless of any future selection.
- Does not imply, request, or perform any implementation, publication, deployment, or external/production system change.
- Does not touch, start, or reference any OD-002 Design work — OD-002 remains authorized but not started.
- Does not touch OD-003 in any respect — OD-003 remains not authorized for Design.
- Does not establish that organizational effort is, in fact, a lever on search position (Candidates B/C's Phase 3 narrowing) — this remains an open, untested hypothesis, not a finding.
- Does not claim, or provide grounds for, any conversion, revenue, or reservation benefit for any candidate.
- Does not generalize beyond the four named themes or the organic-search surface.

## Design Boundary

No design or intervention selected in this document is authorized for implementation. This workstream compares candidate future states; it does not choose one, publish anything, or change any external or production system. Any future Transformation response to a candidate selected from this workstream requires a separate, later Transformation Authorization Gate, not implied or pre-approved here.
