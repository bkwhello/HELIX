# DD-040 — Candidate D Execution-Blocker Case-Owner Decision

---

**Recorded by Claude, acting as HELIX Decision Recorder for EC-002 — Konnichiwa Organic Visibility Growth, 22 September 2026.** This document records an execution blocker discovered during an attempted read-only Candidate D export under decisions/DD-024's authorization, and the Case-Owner Decision Kelvin Wong issued in response, in chat, on the same date. **This document does not itself gate-review, redesign, or execute anything — it records what was found and what Kelvin decided.** Basis: two prior read-only investigations performed the same date ("GSC 22-July Availability Boundary Investigation," "EC-002 — OD-001 Candidate D Case-Owner Decision Gate Preparation"), design/OD-001-candidate-d-measurement-protocol.md, decisions/DD-023-od-001-design-readiness-gate.md, decisions/DD-024-candidate-d-protocol-readiness-gate.md, observations/O-001.md, and the raw export at `~/Downloads/https___konnichiwa.nl_-Performance-on-Search-2026-09-21/`.

---

## Precondition Check

| # | Precondition | Result |
|---|---|---|
| 1 | Branch `feat/ec-002-visibility-baseline` | **PASS** |
| 2 | Local HEAD `fe7372732ded1439eccc57adbdef200cc9f9267a` | **PASS** |
| 3 | Upstream and fresh remote HEAD both `fe7372732ded1439eccc57adbdef200cc9f9267a`; ahead/behind 0/0 | **PASS** — confirmed via live fetch immediately before this write |
| 4 | Working tree clean, staged empty, untracked empty, stash empty | **PASS** |
| 5 | No `decisions/DD-040*` existed prior to this task | **PASS** |
| 6 | The 22 September repository fast-forward (`24aaef7..fe73727`) touched no EC-002/Candidate-D file | **PASS** — independently re-confirmed in the immediately preceding gate |

**All six preconditions passed. Proceeding.**

---

## Observation

Facts established directly from primary artifacts (screenshots and raw CSV export dated 21 September 2026, inspected read-only on 22 September 2026), not from narrative report alone:

1. OD-001 Candidate D's locked comparison window (design/OD-001-candidate-d-measurement-protocol.md, Phase 2; decisions/DD-024, Binding Condition 4) is exactly **2026-06-22 through 2026-08-21 — 61 days**.
2. Across repeated attempts, the requested custom-date start of **2026-06-22** was not honored: the rendered Performance chart, the reopened custom-date dialog, and the raw export's own `Filters.csv` metadata field all reflected an effective start of **2026-07-22** instead.
3. The retrieved export (`Diagram.csv`) contains exactly **31 contiguous days: 2026-07-22 through 2026-08-21** — not the required 61.
4. `Apparaten.csv` (Devices) and `Landen.csv` (Countries) both reconcile exactly to the same **422 clicks / 15,607 impressions** total as `Diagram.csv`, confirming the 31-day boundary is a real, internally consistent data limitation and not a display artifact.
5. Google Search Console's property Settings screen ("Over" section) displays, verbatim: **"Property toegevoegd aan account — 23 juli 2026."** This is the field as displayed; it is not restated as a verification date, an ownership-confirmation date, or any other field this session did not directly observe.

---

## Interpretation

- The **31-day availability boundary at 2026-07-22 is established** — confirmed independently from three separate artifacts (UI, dialog, raw export) and internally cross-checked (Devices/Countries totals reconcile).
- The **technical cause of that boundary is NOT established.** No official Google Search Console documentation confirming a specific mechanism for this exact case was found and independently verified in this session's research; property-verification-date gating is one documented, plausible mechanism among others, not a confirmed one.
- The **23 July 2026 "property toegevoegd aan account" date is temporally close to, but not proven to cause, the 22 July 2026 boundary.** This is recorded as a correlation only. No causal claim is made linking property-account-addition to Search Console's historical-data availability in this specific case.

---

## Protocol Consequence

- **OD-001 Candidate D cannot be executed as currently authorized.** The protocol's locked 61-day window (Phase 2; DD-024 Condition 4) is not obtainable through the tested export path.
- **Missing days may not be encoded as zero** (DD-024 Binding Condition 12) — no attempt was made, and none is authorized, to do so.
- **The retrieved 31-day export may not substitute for the locked 61-day window.** No theme-level calculation, delta, or classification under OD-001 Phase 4/6 has been performed against it.
- **This is an execution blocker, not a Candidate D measurement result.** It does not constitute, and must not be read as, a Phase 6 "Unresolved" classification — Phase 6 classifies completed measurements against pre-registered patterns; no measurement occurred here. Nothing in this document classifies any theme, selects among Candidates A/B/C, or evaluates the flagship-vs-broad contrast.

---

## Case-Owner Decision (recorded 22 September 2026)

Kelvin Wong, as case owner of EC-002 — Konnichiwa Organic Visibility Growth, having reviewed the execution blocker above (established across two prior read-only gates the same date), issued an explicit decision in chat. Literal decision:

> Kelvin Wong selected OPTION B: "Authorize design of a new/amended Candidate D measurement protocol using a currently-obtainable comparison window."

This decision is recorded here verbatim, not reinterpreted. It selects Option B specifically, as distinct from Option A (close the execution attempt as blocked, no replacement) and Option C (a further bounded recovery investigation, which the prior gate had already marked invalid absent a new lead).

---

## Authorization Boundary

**This decision authorizes only:** DESIGN work — i.e., the preparation of a new or amended Candidate D measurement protocol that first establishes, as evidence, what historical/future comparison window is actually obtainable and comparable through the Search Console property as it currently stands, before any such window is locked. This mirrors the same preparation-before-execution separation decisions/DD-035 and DD-036 already established elsewhere in this case for IC-OD2-001.

**This decision does NOT authorize:**

- executing a new GSC measurement or export;
- changing any GSC setting;
- WordPress changes;
- production changes of any kind;
- selecting among Candidates A, B, or C;
- Transformation;
- encoding missing data as zero;
- treating the existing 31-day export (`Performance-on-Search-2026-09-21`) as the new measurement or as evidence toward any theme's delta;
- silently changing design/OD-001-candidate-d-measurement-protocol.md itself — that document remains unmodified by this decision;
- executing any resulting replacement/amended protocol before a fresh, separate owner and/or gate authorization, if the design work concludes one is required.

design/OD-001-candidate-d-measurement-protocol.md and decisions/DD-024-candidate-d-protocol-readiness-gate.md are **not modified** by this decision — both remain intact as the historical record of the original, now-blocked protocol and its conditional approval.

---

## Effect on Lifecycle State

```yaml
candidate_d_protocol_executed: false
candidate_d_protocol_execution_blocked: true
candidate_d_protocol_execution_blocker: "Locked 61-day window (2026-06-22–2026-08-21) not obtainable; effective GSC availability boundary confirmed at 2026-07-22 across UI, date-dialog, and raw export"
candidate_d_protocol_execution_blocker_cause: Not Established — Correlation With Property-Account-Addition Date (2026-07-23) Only, Not Causation
candidate_d_replacement_protocol_design_authorized: true
candidate_d_replacement_protocol_design_started: false
candidate_d_replacement_protocol_locked: false
od_001_design_established: false
od_002_design_started: false
transformation_authorized: false
external_changes_authorized: false
```

`candidate_d_protocol_executed` remains **`false`**, unchanged from decisions/DD-024. The new `candidate_d_protocol_execution_blocked` and `candidate_d_replacement_protocol_design_*` fields are additive — they record this decision's own effect without editing or reinterpreting any field decisions/DD-024 already set. `od_001_design_established`, `transformation_authorized`, and `external_changes_authorized` remain **`false`**, unconditionally.

### Next Action

Design work may begin to establish, as evidence, the property's actually-obtainable comparison window, and to prepare a replacement or amended Candidate D protocol against it — as its own separate, subsequent task. That design work does not itself execute any measurement and would require its own readiness gate and case-owner authorization before execution, consistent with this case's established preparation/execution separation.
