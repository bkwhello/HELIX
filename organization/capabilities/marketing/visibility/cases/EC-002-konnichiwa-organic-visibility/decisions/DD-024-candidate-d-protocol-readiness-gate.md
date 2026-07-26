# DD-024 — Candidate D Protocol Readiness Gate
---

Date: 26 July 2026. Reviewer: Claude, acting as an **independent HELIX Design Readiness Gate Reviewer** for EC-002 — assessing whether design/OD-001-candidate-d-measurement-protocol.md is sound and complete enough to request read-only execution approval; not authorized to approve execution, execute the protocol, access Search Console, create an automation, start OD-002 Design, or enter Transformation. This document is a recommendation to Kelvin Wong as case owner. Basis: design/OD-001-candidate-d-measurement-protocol.md, design/OD-001-design-workstream.md, decisions/DD-022, DD-023, observations/O-001.md, diagnosis/DQ-001-investigation.md, diagnosis/OD-001-flagship-format-competitive-breadth.md, and direct inspection of `evidence/raw/search-console-2026-07-23/` (all seven raw files).

**This task evaluates protocol readiness only. It does not itself approve execution — the Gate Verdict below is not execution approval (see Case-Owner Decision Boundary).**

---

## Precondition Verdict

**PASSED.** All nine preconditions verified:

| # | Check | Result |
|---|---|---|
| P-001 | Working tree state at task start matches the prior committed/uncommitted record | Confirmed |
| P-002 | Active branch `feat/ec-002-visibility-baseline` | Confirmed |
| P-003 | Local HEAD `1a58fde6fbeca1856c72dd474d55781923bfd685` (last pushed commit) | Confirmed |
| P-004 | design/OD-001-candidate-d-measurement-protocol.md exists, Status: Prepared, Not Executed | Confirmed |
| P-005 | decisions/DD-023 Case-Owner Selection: Candidate D Selected for Further Design | Confirmed |
| P-006 | Candidates A, B, C remain Retained — Unselected Alternative | Confirmed |
| P-007 | `od_001_design_established: false` | Confirmed |
| P-008 | `od_002_design_started: false`; OD-003 remains not authorized for Design | Confirmed |
| P-009 | `transformation_authorized: false`; `external_changes_authorized: false` | Confirmed |

No stop condition triggered. Proceeding.

---

## Part A — Independent Assessment (eight required dimensions)

### A-1. Baseline reproducibility

**Assessed: Sound, with corrections applied.** Phase 1's reconstruction was independently re-verified against O-001.md and diagnosis/DQ-001-investigation.md, and further checked by this gate directly against the raw export files in `evidence/raw/search-console-2026-07-23/`. That direct inspection found the protocol's original blocker list had understated what the evidence actually supports (see Part B) — the protocol document has since been corrected (26 July 2026, Bounded correction, Phase 1) to reflect this. With the correction applied, the confirmed method (property, report, file set, window, aggregation scope, exact query strings, known export cap) is directly traceable to primary evidence, not inferred. **Verdict: Sound.**

### A-2. Future-window comparability

**Assessed: Sound.** The specified window (22 Jun–21 Aug 2026) is exactly 61 days, matching EV-014's populated window length precisely, and is contiguous with zero overlap against the original 21 Apr–21 Jun 2026 window — a genuine before/after design, not a partially self-referential one. See Part C for the full rationale verification. **Verdict: Sound.**

### A-3. Extraction-lock completeness

**Assessed: Sound, after correction.** "Extraction lock" here means: are the report, file set, aggregation scope, and query strings fixed precisely enough that two different people executing this protocol on the specified date would extract the same numbers? Before correction, the protocol could not fully answer this (it treated search type and query-matching logic as unknown). After the Bounded correction — search type confirmed "Web" via `Filters.csv`; query-matching confirmed as exact-string reads of Search Console's native per-query rows via direct inspection of `Zoekopdrachten.csv` — the extraction method is now fixed to the point of practical reproducibility. Two items remain genuinely open (timezone, account/permission context — see Part B) but neither threatens comparability **between the baseline and the future export specifically**, since both would be pulled from the same konnichiwa.nl property under presumably the same account, which structurally holds timezone and permission context constant across the two pulls even without knowing their specific values. **Verdict: Sound, with two open items carried forward as execution-time conditions, not blockers (Part B).**

### A-4. Calculation reproducibility

**Assessed: Sound.** Phase 4's per-theme delta calculation (new average position − baseline average position, no cross-theme aggregation) is a direct, simple, fully specified arithmetic operation on values that will be read directly off the future export in the same format as EV-014's. No unstated formula, no hidden weighting, no dependency on any tool beyond reading the exported CSV. **Verdict: Sound.**

### A-5. Evidence-sufficiency criteria

**Assessed: Sound.** Phase 5's four criteria (reporting-lag completeness, query-cap effect check, low-volume-theme uncertainty preservation, unconfirmed-blocker labeling) are each independently checkable at execution time using only the new export itself — none requires external data or a judgment call not already specified. **Verdict: Sound.**

### A-6. Outcome-rule neutrality

**Assessed: Sound.** Phase 6's four outcomes (Retain A / Reconsider B / Reconsider C / Unresolved) are symmetric in structure — each requires a specific, named pattern across specific themes, none is favored by default, and "Unresolved" is explicitly available and legitimate. The document states directly, and this gate independently confirms, that **no outcome can validate or refute the untested effort-to-ranking assumption underlying B/C** — the re-measurement only re-observes the diagnosed condition, it does not test any candidate's mechanism. This is the correct, honest framing; a version of this protocol that implied the re-measurement could validate B or C's mechanism would have failed this dimension. **Verdict: Sound.** See Part D for the one qualification (classification thresholds are provisional).

### A-7. Stop/deviation rules

**Assessed: Sound.** The 31 December 2026 lapse date (Phase 2) is an explicit stop rule preventing indefinite deferral. Phase 5's sufficiency criteria function as deviation rules (if the reporting lag or query cap contaminates the new export, the criteria require flagging this rather than proceeding as if unaffected). Phase 6's "Unresolved" outcome is itself a stop rule for the decision process — it routes back to a fresh case-owner decision rather than forcing a classification. **Verdict: Sound.**

### A-8. Lifecycle compliance

**Assessed: Sound.** Independently re-verified: DQ-001 is not reopened anywhere in the protocol (no new causal question is posed); no Search Console access occurred in preparing either the protocol or this gate (Part B's raw-file inspection was performed on already-collected, already-committed local files, not a live query); no automation was created; OD-002 Design is not referenced or started; Transformation is not entered; no external or production system was touched. **Verdict: Sound.**

---

## Part B — Classification of the Five Undocumented Fields

Per this task's explicit instruction, search type is treated as material unless the repository itself contains evidence of the Search Console default. This gate performed a direct inspection of every file in `evidence/raw/search-console-2026-07-23/` (not merely O-001.md's narrative summary) specifically to test that instruction.

| Field | Evidence found | Classification | Basis |
|---|---|---|---|
| **Search Console search type** | `Filters.csv` states directly: `Zoektype,Web` | **Non-blocking — Confirmed** | Direct, first-party, already-collected evidence. Not assumed; the repository does contain the confirming evidence this task required before treating it as non-material. |
| **Timezone basis for date-range boundaries** | No file in the raw export states this | **Condition to Resolve Before Execution** | Genuinely unconfirmed from any existing record. Not blocking approval, because both the baseline and the future export are pulled from the same konnichiwa.nl property, which structurally holds the same timezone setting across both pulls regardless of its specific value — the risk is to absolute-date interpretation, not to baseline-vs-future comparability. Must be recorded (or explicitly logged as "unconfirmed, platform default used") at execution time. |
| **Account/permission context** | No file states which Google account or access level was used | **Condition to Resolve Before Execution** | Same reasoning as timezone — low materiality for comparability given the same property is used both times, but should be recorded at execution time for future documentation quality, not assumed silently. |
| **Locale/date-format settings** | `Diagram.csv` uses unambiguous ISO 8601 dates (`2026-04-21`); CTR/position figures use consistent period-decimal formatting throughout all raw files | **Non-blocking limitation** | Date-parsing ambiguity is resolved by the ISO format itself; the exact underlying UI locale setting remains unconfirmed but is immaterial to reading the reported figures correctly. |
| **Near-duplicate-query inclusion/exclusion** | Direct inspection of the full `Zoekopdrachten.csv` (1,000 rows) confirms Search Console's Queries report lists one row per exact, distinct query string with no built-in aggregation; many related-but-distinct queries exist (e.g., "teppanyaki restaurant utrecht," "japans restaurant utrecht centrum") that were **not** included in any theme's reported figures | **Non-blocking limitation** | Not an undocumented ambiguity — this is the report format's native behavior. The original theme figures are exact-string reads of specific rows, and Phase 3 already locks the future export to the identical exact strings, with no broadening. The rule is fully specifiable and already specified. |

**Summary: 1 of 5 fields fully confirmed (search type); 2 of 5 resolved to non-blocking limitations (locale/date-format; near-duplicate-query handling); 2 of 5 remain open as execution-time conditions, not approval blockers (timezone; account/permission context).** No field is classified "Blocking Before Approval" — none prevents Kelvin from evaluating and approving the protocol as specified; two require recording (not resolving in advance) at the moment of actual execution.

---

## Part C — Schedule Rationale Verification

| Date | Value | Rationale category | Verification |
|---|---|---|---|
| Future window | 22 Jun–21 Aug 2026 | **Methodological comparability** | Verified by direct day-count: 22 Jun–30 Jun = 9 days, + 31 days (July) + 21 days (Aug) = 61 days, matching EV-014's populated window length exactly; contiguous with zero overlap against the 21 Apr–21 Jun 2026 baseline. |
| Earliest export date | 21 Sep 2026 | **Data-finalization buffer** | Verified against O-001.md's own documented reporting lag (a "Last 3 months" preset export on 23 Jul 2026 populated only through 21 Jun 2026 — a ~32-day lag). 21 Aug (window end) + ~31 days = 21 Sep — the same order of magnitude as the lag already observed once in this case, not a novel or arbitrary figure. |
| Lapse date | 31 Dec 2026 | **Conservative operational choice** | Not derived from any Search Console mechanic — verified as a policy choice giving roughly 101 days (~3.3 months) of scheduling slack after the earliest export date, explicitly to prevent indefinite deferral (decisions/DD-023, Set D, Condition 8) rather than to satisfy any technical constraint. Correctly labeled as such in the protocol, not disguised as evidence-derived. |

All three dates are verified internally consistent and correctly categorized by rationale type.

---

## Part D — Threshold Justification Check

**Finding: the Phase 6 classification thresholds are provisional, not yet quantitatively pre-registered, and the protocol now says so explicitly (26 July 2026 addition).** "Stable / No Measurable Change" is defined qualitatively ("cannot be clearly distinguished from noise given click/impression volume") rather than as a fixed numeric position-point band. This is not a defect this gate is discovering for the first time in secret — it is now disclosed directly in the protocol itself, per this task's explicit instruction ("If thresholds are provisional, state that they require case-owner approval and cannot classify results automatically").

**This gate's independent confirmation:** the absence of a fixed numeric band does not compromise Part A-6's finding that no outcome can auto-select a candidate — that structural safeguard holds regardless of where the exact threshold is set. What remains open is narrower: *which specific results count as "Stable" versus "Worsened"/"Improved"* cannot itself be applied without Kelvin either (a) approving the qualitative rule as sufficient, or (b) fixing an explicit numeric band before execution. This is carried forward as a binding Gate Verdict condition, not resolved by this gate on its own authority.

---

## Gate Verdict

**PASSED WITH CONDITIONS.**

The protocol is structurally sound across all eight assessed dimensions (Part A), materially strengthened by direct verification of the raw evidence (Part B — search type confirmed, two fields resolved, two carried forward as low-materiality execution-time conditions, none blocking), and its schedule is correctly reasoned and internally consistent (Part C). One open item — the provisional classification threshold (Part D) — is not severe enough to withhold a recommendation, but is severe enough to require binding conditions before execution could proceed.

**Binding conditions, if this protocol is later approved for execution:**

1. Kelvin must either approve Phase 6's qualitative classification rule as sufficient, or specify an explicit numeric position-point band for "Stable / No Measurable Change," before any result is classified — classification may not proceed on the qualitative rule alone without one of these two forms of explicit sign-off.
2. Whoever executes the export must record the actual timezone and account/permission context used (or explicitly state "unconfirmed, platform default used") in the resulting observation record, per Phase 1's own Bounded-correction rule.
3. All other Phase 1–7 specifications (window, export method, calculations, evidence-sufficiency criteria, outcome rules, boundary confirmations) apply exactly as written, with no further narrowing required.

This verdict is **not** execution approval. It recommends that Kelvin's response take one of the three forms below.

---

## Case-Owner Decision Boundary

Per this task's explicit instruction, this gate does not approve execution, does not execute the protocol, does not access Search Console, and does not infer approval from general permission to "continue," from approval of any prior push or commit, or from any other message not naming execution approval explicitly.

```yaml
od_001_candidate_d_protocol_gate: Passed With Conditions
od_001_candidate_d_protocol_execution_decision: Pending
od_001_candidate_d_protocol_executed: false
transformation_authorized: false
external_changes_authorized: false
```

**Kelvin Wong, as case owner, is asked to issue one explicit response:**

- **APPROVED FOR READ-ONLY EXECUTION** — the protocol may be executed as specified, subject to the two binding conditions above.
- **APPROVED WITH CONDITIONS FOR READ-ONLY EXECUTION** — as approved, with any additional case-owner-specified conditions layered on top of the two above.
- **NOT APPROVED FOR EXECUTION** — the protocol is not authorized to execute; it remains Prepared — Execution Pending, available for revision or future reconsideration.

Only after that explicit response, given as a separate, later instruction, may `od_001_candidate_d_protocol_execution_decision` be set to a resolved state, and may any actual, read-only Search Console export occur. This document creates no such execution itself. Approving execution of this protocol does not authorize Transformation, does not start OD-002 Design, and does not change Candidates A, B, or C's Retained — Unselected Alternative status — all remain exactly as recorded in decisions/DD-023.

---

## Case-Owner Decision

*Pending.*

---

## Case-Owner Decision (recorded 26 July 2026)

**This section records Kelvin Wong's explicit response to the Case-Owner Decision Boundary above. It does not replace, edit, or overwrite the Precondition Verdict, Parts A–D, the Gate Verdict and its own conditions, the Case-Owner Decision Boundary, or the "Pending" state immediately above — all remain intact above, unmodified, as the historical record of this independent gate review. This decision does not alter design/OD-001-design-workstream.md's requirements, candidates, attacks, or comparison, and does not change Candidates A, B, or C's Retained — Unselected Alternative status.**

```yaml
decision: APPROVED WITH CONDITIONS FOR READ-ONLY EXECUTION
approved_by: Kelvin Wong
approval_date: 2026-07-26
gate_reference: DD-024
```

Kelvin Wong, as case owner of EC-002 — Konnichiwa Organic Visibility Growth, issues an explicit execution decision. Literal decision:

> APPROVED WITH CONDITIONS FOR READ-ONLY EXECUTION

**This approval is not execution.** No Search Console access has occurred as a result of this decision. Execution remains a separate, later, bounded, read-only act, subject to every condition below.

### Binding Conditions (verbatim, all twenty-one)

1. Execution may not occur before 21 September 2026.
2. Authorization expires after 31 December 2026 if the protocol remains unexecuted.
3. Search type must remain Web, as confirmed by Filters.csv.
4. The comparison window remains exactly 22 June–21 August 2026.
5. The baseline remains exactly the documented 61-day EV-014 window.
6. Property, filters, query strings, metrics and aggregation must follow the locked protocol.
7. Timezone basis must be recorded immediately before execution.
8. Account/permission context must be recorded immediately before execution.
9. If timezone or account context materially compromises comparability, stop execution and return for a new decision.
10. The export is read-only; no Search Console setting, property or permission may be changed.
11. Preserve the complete raw export before calculation or interpretation.
12. Missing or suppressed data must not be encoded as zero.
13. The qualitative "Stable / No Measurable Change" rule is approved only for descriptive classification; it is not an automatic numeric decision rule.
14. No result may automatically select Candidate A, B or C.
15. Every outcome requires a new explicit case-owner selection decision.
16. Candidates B and C retain their untested effort-to-ranking assumption.
17. Local-pack, conversion, revenue and reservation data remain excluded.
18. No rank or top-three promise may be introduced.
19. No automation or scheduled task is authorized by this decision.
20. OD-002 Design remains not started.
21. Transformation and external changes remain unauthorized.

These twenty-one conditions supersede, for execution purposes, the Gate Verdict's own two conditions above (Condition 1 there — threshold sign-off — is subsumed by Condition 13 here; Condition 2 there — recording timezone/account context — is subsumed by Conditions 7–8 here). The Gate Verdict's original two conditions remain unedited above as historical record; they are not deleted or contradicted, only carried forward in more complete form.

### Protocol Status Update

**design/OD-001-candidate-d-measurement-protocol.md's status is updated to: `Approved With Conditions — Awaiting Execution Window`.** This reflects that execution is authorized in principle, but not yet permitted in practice — the earliest permitted execution date (21 September 2026, Condition 1) has not arrived. The protocol has not been executed; no Search Console access has occurred as a result of this decision.

### Effect on Lifecycle State

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

`od_001_candidate_d_protocol_execution_decision` is no longer `Pending` — it is now `Approved With Conditions For Read-Only Execution`. `candidate_d_protocol_executed` remains **`false`** — approval authorizes a future, bounded, read-only export; it does not perform one. Execution before 21 September 2026 or after 31 December 2026 is **not** authorized by this decision (Conditions 1–2). `od_001_design_established` remains **`false`** — an authorized-but-unexecuted protocol does not constitute an established Organizational Design. `od_002_design_started` remains **`false`**, unaffected. OD-003 remains not authorized for Design, unaffected. `transformation_authorized` and `external_changes_authorized` remain **`false`**, unconditionally — this decision authorizes a read-only measurement only; it does not authorize Transformation or any external/production change, regardless of what the eventual measurement finds.

### What This Decision Does Not Do

- Does not execute the protocol or access Search Console.
- Does not create an automation or scheduled task (Condition 19).
- Does not create any future evidence, observation, or export — none exists yet.
- Does not select Candidate A, B, or C (Conditions 14–15) — Candidate D remains Selected for Further Design; A, B, C remain Retained — Unselected Alternative.
- Does not authorize Transformation or any external/production change (Condition 21).
- Does not start OD-002 Design (Condition 20).

### Next Action

Wait for the authorized execution window (21 September 2026 – 31 December 2026). At that time, and only then, a separately-performed, read-only Search Console export may occur under this approval, subject to recording timezone and account/permission context immediately beforehand (Conditions 7–8) and stopping for a new decision if either materially compromises comparability (Condition 9). No further case-owner decision is required to execute within that window, unless a stop condition is triggered.
