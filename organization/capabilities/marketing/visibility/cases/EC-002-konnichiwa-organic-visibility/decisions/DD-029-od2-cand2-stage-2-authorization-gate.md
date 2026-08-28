# DD-029 — OD2-CAND-2 Stage 2 Authorization Gate

---

Date: 13 August 2026. Reviewer: Claude, acting as an **independent HELIX Stage 2 Authorization Gate Reviewer** for EC-002 — assessing whether OD2-CAND-2 (Origin/Backend-Processing Observability) may begin, after OD2-CAND-3 Stage 1 closed with CS-4 — Insufficient Evidence (decisions/DD-028). **This task assesses authorization readiness only.** It does not start Stage 2, does not create the Stage 2 evidence specification, does not collect evidence, does not access any hosting/WordPress/Varnish/PHP/database/server system, does not request credentials, does not perform HTTP probing, does not select an implementation, and does not authorize Transformation. This document is a recommendation to Kelvin Wong as case owner.

Basis: decisions/DD-028, DD-027, DD-026, DD-025, DD-022, DD-018; design/EC-002-OD2-CAND-3-Evidence-Intake.md (Round 1–3); design/OD2-CAND-3-cache-state-evidence-specification.md; design/OD-002-design-workstream.md; diagnosis/DQ-004-investigation.md; diagnosis/OD-002-absence-of-html-caching-layer.md; observations/O-012.md (EV-017); current.md; Traceability.md; design/README.md; architecture/reference/EM-001.EngineeringMethod.md (EP-005 Diagnosis Before Design, EP-006 Design Before Transformation, EP-007 Transformation Realizes Design); `workspace /discoveries/engineering/AD-010.Organizational Design.md`. This prompt itself was not used as evidence.

---

## 1. Precondition Check

| # | Check | Result |
|---|---|---|
| 1 | Branch `feat/ec-002-visibility-baseline` | **PASS** |
| 2 | Working tree clean | **PASS** |
| 3 | Local HEAD `8c26edd8be80e926733628fc69d31547136f7113` | **PASS** |
| 4 | Remote HEAD identical | **PASS** |
| 5 | Ahead/behind 0/0 | **PASS** |
| 6 | `current_stage: Organizational Design` | **PASS** |
| 7 | OD2-CAND-2: `Selected Conditionally — Stage 2 Pending Stage 1 Review` | **PASS** |
| 8 | OD2-CAND-3 Stage 1: `Completed — Evidence Insufficient / Approved Evidence Exhausted` | **PASS** |
| 9 | DD-028 classification: `CS-4 — Insufficient Evidence`, `Accepted With Conditions` | **PASS** |
| 10 | Domain-specific Varnish configured and delivered state remains unresolved | **PASS** — `od_002_cand3_remaining_primary_unknown: Domain-Specific Varnish Configured and Delivered State` |
| 11 | `od_002_stage_2_authorized: false` | **PASS** |
| 12 | `od_002_design_established: false` | **PASS** |
| 13 | OD-001 Candidate D remains unexecuted | **PASS** — `candidate_d_protocol_executed: false` |
| 14 | OD-003 remains unauthorized | **PASS** — `od_003_design_authorized: false` |
| 15 | Transformation and external changes remain unauthorized | **PASS** — both `false` |
| 16 | No earlier Stage 2 Authorization Gate exists | **PASS** — confirmed by directory listing of `decisions/`; DD-028 is the highest prior identifier |

All sixteen preconditions pass. Proceeding.

## Mandatory Sources — Read Completely

All fourteen sources listed in the assignment were read in full before this gate was drafted: decisions/DD-028, DD-027, DD-026, DD-025, DD-022, DD-018; design/EC-002-OD2-CAND-3-Evidence-Intake.md; design/OD2-CAND-3-cache-state-evidence-specification.md; design/OD-002-design-workstream.md; diagnosis/DQ-004-investigation.md; diagnosis/OD-002-absence-of-html-caching-layer.md; observations/O-012.md; current.md; Traceability.md; design/README.md; and the applicable HELIX standards (EM-001, particularly EP-005/EP-006/EP-007 and the "No stage shall be bypassed" lifecycle rule; AD-010's definition of Organizational Design). This prompt is not cited as evidence anywhere below.

---

## 2. Authoritative Starting State (preserved verbatim, not re-derived)

### Cache-state result (decisions/DD-027, DD-028)

| Layer | Configured-State | Delivered-State |
|---|---|---|
| WordPress full-page cache | Not Present Within Inspected Plugin List | Unconfirmed |
| Host/reverse-proxy (Varnish, konnichiwa.nl) | **Unconfirmed** | **Unconfirmed** |
| CDN/edge cache | Confirmed Disabled within the inspected DirectAdmin account scope at capture time | Unconfirmed |

Overall: **CS-4 — Insufficient Evidence.**

### OD-002 boundary (diagnosis/OD-002-absence-of-html-caching-layer.md, decisions/DD-018 Condition 2 — the sole authoritative sentence)

> "No observable public evidence of HTML cache delivery was found in the bounded measurements. This condition is associatively consistent with the elevated response-time baseline, but does not establish the mechanism behind the 26% poor mobile TTFB tail."

This gate does not rewrite this as: caching is absent; Varnish is active for konnichiwa.nl; backend processing is slow; WordPress causes the TTFB condition; or cache behaviour explains the 26% poor tail. None of these appears anywhere below.

---

## 3. Proposed Stage 2 Purpose (assessed, not begun)

Whether Stage 2 may prepare a bounded, read-only observability specification able to distinguish: origin/backend processing time; PHP execution time; database/query time; host-level waiting/queuing; server load/resource saturation; time-of-day variability; cache/backend interaction where visible; and deployment/configuration history where already available — **without assuming which mechanism is correct.** This mirrors OD2-CAND-2's own construction in design/OD-002-design-workstream.md Phase 5, already gate-reviewed once (decisions/DD-025, Survives with Conditions) and selected conditionally (decisions/DD-025, Case-Owner Selection).

---

## 4. G-01–G-12 Gate Matrix

### G-01 — Lifecycle legitimacy

**PASS WITH CONDITION.** Stage 2 may proceed as Organizational Design/observability work, not Diagnosis, because CE-DQ4-A (backend/application processing) is already a registered candidate mechanism in diagnosis/DQ-004-investigation.md's own Phase 3 Candidate Mechanism Register — evidence discriminating it from CE-DQ4-B (caching absence) is Design-stage comparison of already-established alternatives (per DD-022 Additional OD-002 Condition 7 / OD2-REQ-014), not new Diagnosis. Three distinct routing rules apply going forward, and must not be blurred:

| Trigger | Routing |
|---|---|
| Evidence distinguishes CE-DQ4-A from CE-DQ4-B, both already in the DQ-004 register | **Continues within Design** — this is exactly what Stage 2 exists to do |
| Evidence points to a mechanism **not** in the CE-DQ4-A–G register (e.g., a genuinely new candidate never tested) | **Returns to Organizational Diagnosis** — a new diagnosis question, per EP-005/EM-001's "no stage shall be bypassed" |
| Evidence is dispositive enough to materially change OD-002's own established, narrowed formulation (e.g., conclusively resolves the entanglement in either direction, or confirms an active cache per decisions/DD-025 Condition 6) | **New case-owner lifecycle decision** — per design/OD-002-design-workstream.md's own Binding Boundary 12 and decisions/DD-022's Common Condition 10 (potential new evidence against/narrowing an Established Diagnosis), already binding, not newly invented here |

### G-02 — Stage 1 dependency

**PASS WITH CONDITION.** decisions/DD-025 Condition 8 requires a new, explicit case-owner authorization for Stage 2 "after the Stage 1 result" — this applies uniformly regardless of which of CS-1 through CS-4 Stage 1 reached; no CS outcome by itself blocks or compels Stage 2. **CS-4/Stage 1's closure is not, by itself, proof Stage 2 is necessary** — that would conflate "we stopped collecting evidence for Stage 1's own bounded question" with "the entangled backend question is now worth pursuing." Stage 2's actual justification is the CE-DQ4-A/CE-DQ4-B entanglement, which has been open since decisions/DD-018 (25 July 2026) and is independent of how Stage 1 happened to close. **Condition:** any future authorization recommendation must cite the entanglement as its basis, not Stage 1's exhaustion.

### G-03 — Question precision

**PASS.** Stage 2 can ask bounded observability questions without asking the unrestricted causal question. Permitted framing, matching OD2-CAND-2's own construction (design/OD-002-design-workstream.md, Phase 5): *"Is backend/origin processing time, independent of caching state, itself materially elevated for konnichiwa.nl?"* — with component sub-questions (PHP execution time, database/query time, host-level queuing, resource saturation, time-of-day variability), each independently answerable without asserting what causes the overall 26% CrUX figure. **Not permitted:** "What causes the 26% poor TTFB tail?" as a standalone question — that exceeds what any observability evidence here could establish, per OD-002's own "What This Diagnosis Does Not Establish" section.

### G-04 — Evidence necessity

See Section 5 (BE-01–BE-08) below for the full per-class table (question answered, necessity, source, owner, access boundary, privacy risk, limitation, blocking status). Summary: no single evidence class is indispensable to Stage 2's own completion — per the same "Not Available is a legitimate outcome" discipline already established for Stage 1 (decisions/DD-026 Condition 11; decisions/DD-028's own Stage 1 closure) — but BE-02 (PHP execution) and BE-03 (database timing) are the most directly load-bearing for discriminating CE-DQ4-A specifically.

### G-05 — Access containment

**PASS.** Stage 2, as scoped, uses only owner-supplied screenshots, safely redacted exports, existing read-only reports, existing provider diagnostics, and bounded Owner Declarations — identical in kind to decisions/DD-026's twenty-seven collection conditions, which already prohibit passwords, API keys, access tokens, session cookies, SSH/SFTP/FTP credentials, database credentials, unrestricted WordPress/hosting access, and server-shell access. This gate extends that same prohibition to Stage 2 without modification.

### G-06 — Evidence-layer separation

**PASS.** CrUX field data; Lighthouse/lab data; public request timing; hosting/origin timing; PHP timing; database timing; cache-state evidence (decisions/DD-027, DD-028); and Owner Declaration metadata must remain eight distinct, never-substituting layers — directly extending OD2-REQ-006's existing, binding lab/field separation rule (design/OD-002-design-workstream.md) to the additional backend-timing layers Stage 2 would introduce.

### G-07 — Measurement sufficiency

**PASS, heavily contained.** Useful backend/origin observations must be obtainable **without**: changing configuration; enabling debug mode; installing a monitoring plugin; executing a profiler; clearing or warming cache; generating artificial load; restarting services; or changing PHP/database settings. If meaningful evidence requires any of these, it is **outside current authorization** — classified explicitly per BE item in Section 5, not assumed available.

### G-08 — Privacy and security

**PASS, with mandatory redaction/rejection rules** (extending the discipline already applied throughout Round 1–3 of Stage 1's own evidence intake):

| Risk category | Rule |
|---|---|
| Server paths, database names | Redact — not needed to answer the timing question |
| Account identifiers, domain lists | Redact unrelated entries (e.g., jatosushi.nl, as already excluded in Round 3) |
| Visitor IPs | Never ingested, even redacted-in-place |
| Request URLs containing personal data | Redact query strings/parameters; path only if needed |
| Error logs, stack traces | Aggregated counts only (per BE-05); raw log lines containing personal information, tokens, or full request parameters are **rejected**, not ingested and redacted |
| Plugin/license information | Same discipline as decisions/DD-026 Condition 4/5 |
| Customer/reservation data | **Never ingested under any circumstance** — if any evidence item would require exposing it, that item is rejected outright, not redacted |

### G-09 — Reversibility and stop rules

**PASS.** Stage 2 must stop and escalate to case-owner review if: credentials become visible in any supplied material; access would require a mutation click; evidence contains customer data; profiling would require installation or activation; observations conflict materially (routed per the same narrow, same-layer/scope/time contradiction discipline as design/OD2-CAND-3-cache-state-evidence-specification.md §6.4); evidence establishes a new diagnosis-relevant mechanism (routes per G-01's table); or requested evidence exceeds the approved scope (routes to a specification amendment and fresh case-owner decision, per the same pattern as design/OD2-CAND-3-cache-state-evidence-specification.md §3.2).

### G-10 — Outcome routing

**PASS.** Possible Stage 2 outcomes, none decided here, none self-authorizing a technical change: backend/origin contribution observed; no material backend/origin contribution observed within inspected scope; conflicting evidence; insufficient evidence; new mechanism evidence requiring Diagnosis review (routes per G-01). Every outcome requires its own future case-owner decision before any further step, mirroring exactly how CS-1 through CS-4 were each pre-registered with fixed, non-self-executing routing under design/OD2-CAND-3-cache-state-evidence-specification.md §6.7.

### G-11 — Business-boundary integrity

**PASS.** Stage 2 cannot infer Google-ranking, visibility, conversion, revenue, or reservation benefit — directly inherited from OD2-REQ-016, decisions/DD-018 Condition 9, and the UR-003/OC-007 Attribution Constraint (inherited via OU-004), all independently binding and unnarrowed here.

### G-12 — Transformation containment

**PASS.** Stage 2 authorization, even if granted, would not permit code changes, cache changes, CDN changes, hosting changes, PHP changes, database changes, plugin installation, deployment, publishing, or external communication. This is required by EM-001 EP-006 ("Organizational Transformation shall only proceed from a justified Organizational Design") and EP-007 ("Transformation Realizes Design") — Transformation requires its own, later, separately-justified gate; Design (which Stage 2 remains part of) "shall not implement change" (EM-001, Organizational Design section).

**No G item failed.** G-01 and G-02 carry conditions load-bearing enough to shape the final recommendation (Section 8); G-03 through G-12 pass on the strength of controls this case has already established and proven through Stage 1.

---

## 5. BE-01–BE-08 Evidence Class Assessment (assessed, not collected)

| ID | Item | Question Answered | Necessity | Expected Source | Owner | Access Boundary | Privacy Risk | Limitation | Blocks Stage 2 if Absent? | Classification |
|---|---|---|---|---|---|---|---|---|---|---|
| BE-01 | Hosting response-time overview | Is the origin server, in aggregate, under load or slow to respond? | Corroborating, not discriminating | A generic hosting dashboard (e.g., "Resource Usage," seen in the same DirectAdmin panel explored in Round 1–3) | Kelvin | Existing dashboard screenshot only | Low — resource totals only | Does not distinguish PHP vs. DB vs. queuing specifically | No | **Useful but Non-Blocking** |
| BE-02 | PHP execution information | Is PHP/application execution time itself elevated? | Directly discriminates CE-DQ4-A | An existing, non-invasive PHP timing report, if the provider offers one | Kelvin | Existing report only — profiling/debug logging explicitly excluded from this item's own definition | Low, if aggregated | No such report was observed in this account's DirectAdmin menu during Round 1–3 (Cronjobs, PHP version selector, PHP error log — no timing report) — **likely resolves to Not Available** | No — Not Available is a legitimate outcome (Section 7 discipline) | **Conditional** — essential *if* it exists; existence unconfirmed |
| BE-03 | Database/query information | Is database query time itself elevated? | Directly discriminates a sub-component of CE-DQ4-A | Aggregated slow-query summary, fully redacted | Kelvin | Existing report only; **phpMyAdmin (seen in the same menu) is explicitly not an approved route** — it requires login and permits query execution, exceeding G-05's read-only-report boundary | Medium if not properly aggregated — must never include raw customer queries or DB credentials | No slow-query dashboard was observed in this account's menu — **likely resolves to Not Available** | No | **Conditional**, with phpMyAdmin itself flagged **Unsafe Without New Authorization** |
| BE-04 | Resource-utilization history | Is the hosting account under CPU/memory/I/O saturation? | Corroborating context for queuing/contention | The same "Resource Usage" dashboard as BE-01 | Kelvin | Existing dashboard screenshot only | Low | Account-wide, not request-specific | No | **Useful but Non-Blocking** |
| BE-05 | Error/timeout summary | Do timeouts or 5xx errors correlate with the poor-TTFB tail? | Corroborating | "PHP error log" (seen in the same DirectAdmin menu, "Show log" option) | Kelvin | Aggregated counts only — raw log lines with personal information, tokens, or full request parameters are rejected outright, not redacted-and-kept | Medium — error logs can contain request paths/IPs; aggregation required before ingestion | Reactive signal only, not a timing measurement | No | **Useful but Non-Blocking** |
| BE-06 | Deployment/configuration history | Was a caching or PHP-version change made around when the TTFB tail was measured? | Corroborating, potentially explanatory | A dated change record, if the provider or Kelvin's own memory retains one | Kelvin | Existing record or Owner Declaration only — no new change is made to produce this | Low | Likely thin — no such log was observed in the explored panel | No | **Conditional**, overlapping with BE-08 if no system record exists |
| BE-07 | Provider diagnostics | Does Vimexx/DirectAdmin publish any generic diagnostics for this account beyond what has already been seen? | Corroborating | Existing provider-generated diagnostics only | Kelvin | No new support ticket authorized by this gate | Low | Nothing beyond AWStats/Resource Usage/error log was observed in Round 1–3's exploration of this exact panel | No | **Conditional**, realistically low-yield given what Round 1–3 already surfaced |
| BE-08 | Owner operational declaration | Fills gaps where no system evidence exists (e.g., "has the site felt slow at a particular time of day?") | Fallback only | Kelvin's own bounded, dated statement | Kelvin | Owner Declaration, explicitly lower-confidence | None | Not system-verified; must never be upgraded to the same confidence as a direct observation | No | **Useful but Non-Blocking**, always available |

**Reading across the table:** every item is Non-Blocking, Conditional, or (for phpMyAdmin specifically) Unsafe — **none is Essential** in the sense of being required for Stage 2 to be considered complete. Given what Round 1–3's own exploration of this exact DirectAdmin/Vimexx panel already surfaced (a generic account feature-toggle table, AWStats bandwidth/disk statistics, a PHP error log, a Resource Usage panel — nothing resembling a PHP/DB timing dashboard), a realistic expectation is that BE-02 and BE-03 resolve to **Not Available**, leaving Stage 2 with corroborating-only evidence (BE-01, BE-04, BE-05) plus an Owner Declaration (BE-08) — a materially weaker evidentiary position than Stage 2's own construction in design/OD-002-design-workstream.md may have implied when it was first drafted (2 August 2026, before this panel had actually been explored).

---

## 6. Evidence-Request Boundary (five gates, not to be collapsed)

If Stage 2 is later authorized, its **first and only immediately-permitted artifact** is: **OD2-CAND-2 Origin/Backend Evidence Request and Observability Specification** — which may *define* evidence collection but may not *collect* it, exactly mirroring how design/OD2-CAND-3-cache-state-evidence-specification.md was itself only a specification until decisions/DD-026's separate Case-Owner Decision approved collection.

| # | Gate | What it authorizes | Authorized by this decision? |
|---|---|---|---|
| 1 | Authorization to prepare the specification | Drafting the Evidence Request/Observability Specification only | **This is the only gate this recommendation, if positive, would open** |
| 2 | Authorization to collect bounded evidence | Kelvin supplying BE-class items under the specification's own approved scope | **Not authorized here** — a separate, later Case-Owner Decision, mirroring decisions/DD-026's Case-Owner Decision |
| 3 | Acceptance of evidence classification | Accepting a gate's classification of whatever evidence is supplied | **Not authorized here** — mirrors decisions/DD-027/DD-028's own Case-Owner Decisions |
| 4 | Design selection/establishment | Setting `od_002_design_established: true` | **Not authorized here** — remains a distinct, later act |
| 5 | Transformation authorization | Any cache/CDN/hosting/PHP/database/code change | **Not authorized here, ever, by this gate** — requires its own future Transformation Authorization Gate per EP-006/EP-007 |

These five gates are not collapsed into one another anywhere in this document.

---

## 7. Independent Challenge

| # | Challenge | Outcome | Basis |
|---|---|---|---|
| 1 | Stage 2 is being started merely because Stage 1 was inconclusive | **Survives with Narrowing** | G-02's own condition: any recommendation must cite the CE-DQ4-A/B entanglement (open since decisions/DD-018), not Stage 1's CS-4 closure, as its justification |
| 2 | The work is silently reopening DQ-004 | **Survives** | CE-DQ4-A is already registered within DQ-004's own Candidate Mechanism Register (diagnosis/DQ-004-investigation.md); Stage 2 was already gate-reviewed as Design-stage comparison, not new Diagnosis (decisions/DD-025) |
| 3 | Backend slowness is already being assumed | **Survives** | OD2-CAND-2's own Mechanism Assumption field treats it as a hypothesis to test, not a stated fact |
| 4 | Varnish is being assumed active for konnichiwa.nl | **Survives** | Section 2 above preserves host/Varnish Configured-State as Unconfirmed, verbatim, unmodified |
| 5 | Absence of caching is being assumed | **Survives** | Section 2 above preserves OD-002's authoritative wording verbatim, which explicitly forbids this framing |
| 6 | Restricted evidence cannot be gathered safely without credentials | **Survives with Narrowing** | True for BE-02/BE-03 specifically, given this account's observed diagnostic surface — the eventual specification must pre-register "Not Available" as a legitimate, non-blocking outcome for those items, not pursued via credentials |
| 7 | Available dashboards cannot distinguish the mechanisms | **Survives with Narrowing** | A genuine, material risk given Round 1–3's own direct observation of this exact panel's limited diagnostic depth — the eventual specification must pre-register "Insufficient Evidence" as a legitimate Stage 2 outcome, mirroring OD2-REQ-003's own no-measurable-improvement precedent, and must not promise resolution |
| 8 | Lab data may be substituted for field data | **Survives** | G-06's explicit eight-layer separation, extending OD2-REQ-006 |
| 9 | The proposed work implies a technical solution | **Survives** | G-10/G-12 explicitly forbid any Stage 2 outcome from auto-authorizing a technical change |
| 10 | The work creates Transformation leakage | **Survives** | G-12 and the five-gate division in Section 6 keep Transformation a wholly separate, later, unauthorized act |

**Result: 7 Survive cleanly, 3 Survive with Narrowing (challenges 1, 6, 7). None Rejected.** The three narrowing conditions are incorporated as binding conditions on the recommendation below, not treated as separately optional.

---

## 8. Authorization Recommendation

**RECOMMEND AUTHORIZED WITH CONDITIONS** — limited strictly to preparing the **OD2-CAND-2 Origin/Backend Evidence Request and Observability Specification** (Gate 1 of Section 6 only). This recommendation does **not** authorize evidence collection, does not authorize Stage 2 to begin substantively, and does not authorize any of Gates 2–5 in Section 6.

### Binding Conditions (if authorized)

1. The specification must ground its own justification in the CE-DQ4-A/CE-DQ4-B entanglement (open since decisions/DD-018), never in "Stage 1 is closed" as a standalone reason (Challenge 1).
2. The specification must pre-register "Not Available" as a legitimate, non-blocking outcome for BE-02 and BE-03 specifically (Challenge 6), and must not route toward credentialed or phpMyAdmin-style access to obtain them.
3. The specification must pre-register "Insufficient Evidence" as a legitimate, closed-for-now Stage 2 outcome, mirroring OD2-REQ-003 and Stage 1's own CS-4 precedent (Challenge 7) — Stage 2 is not guaranteed to resolve the CE-DQ4-A/B entanglement, and must not imply otherwise.
4. Every BE-01–BE-08 item's classification (Section 5) carries forward into the specification unmodified; phpMyAdmin remains explicitly Unsafe Without New Authorization.
5. G-01's three-way routing table (Section 4) governs any future evidence outcome — non-registered mechanisms return to Diagnosis; dispositive entanglement-resolving evidence triggers a lifecycle-decision pause, per Binding Boundary 12/OD2-REQ-014 and decisions/DD-022 Common Condition 10.
6. G-05 through G-09's access, privacy, reversibility, and stop rules (Section 4) apply in full to the specification and to any future collection under it.
7. Gates 2 through 5 in Section 6 each require their own, later, separate, explicit case-owner decision — none is authorized now, and none may be inferred from acceptance of this recommendation.
8. No credential, password, API key, token, cookie, or FTP/SSH/database access may be requested or stored, at any stage.
9. All conditions from decisions/DD-018 (eleven), DD-022 (twenty), DD-025 (twenty-one), DD-026 (eight gate + twenty-seven acceptance), DD-027 (twenty-one), and DD-028 (nine gate + twenty-nine acceptance) remain independently binding and are not narrowed by this gate.

---

## Requested Case-Owner Response

```
AUTHORIZED TO PREPARE STAGE 2 SPECIFICATION
AUTHORIZED WITH CONDITIONS TO PREPARE STAGE 2 SPECIFICATION
NOT AUTHORIZED TO PREPARE STAGE 2 SPECIFICATION
```

**A recommendation is not authorization.** No response is inferred from general permission to "continue," from approval of any prior message, or from anything not naming this response explicitly. This request concerns **specification preparation only** — it does not request, and no response to it may be read as granting, evidence collection, Design establishment, or Transformation authorization (Section 6).

---

## Final Intended Change Scope

| File | Change | Reason |
|---|---|---|
| `decisions/DD-029-od2-cand2-stage-2-authorization-gate.md` | Created (this file) | The Stage 2 authorization gate itself |
| `current.md` | Updated | Records this gate's existence and recommendation, pending case-owner response, per exceptionless repository convention |
| `Traceability.md` | Updated | Same convention, following the DD-025 through DD-028 section-naming pattern |

`design/README.md` is **not** updated — no Design artifact was created by this gate (only an assessment); the convention observed across decisions/DD-025 through DD-028 only updates `design/README.md` when a `design/` file itself is created or its status changes, which has not occurred here.

**Not created:** the Stage 2 specification itself, any evidence request, any BE evidence, any new observation, any implementation artifact, any Transformation gate. **Not modified:** decisions/DD-028, decisions/DD-027, design/EC-002-OD2-CAND-3-Evidence-Intake.md's three rounds, OD-001 Candidate D artifacts, diagnosis/OD-002-absence-of-html-caching-layer.md's wording, OD-003 artifacts.

No credential, password, API key, token, cookie, or FTP/SSH access was requested or accessed. No hosting, WordPress, Varnish, PHP, database, or server system was accessed by this gate. No HTTP probing was performed. No commit was created. Nothing was pushed.

---

## Case-Owner Decision (recorded 13 August 2026)

**This section records Kelvin Wong's explicit response to the Requested Case-Owner Response above. It does not replace, edit, or overwrite the Precondition Check, the Authoritative Starting State, the Proposed Stage 2 Purpose, the G-01–G-12 Gate Matrix, the BE-01–BE-08 Evidence Class Assessment, the Evidence-Request Boundary, the Independent Challenge, the Authorization Recommendation, or the "Pending" state that preceded this decision — all remain intact above, unmodified, as the historical record of this independent gate review.**

```yaml
decision: AUTHORIZED WITH CONDITIONS TO PREPARE STAGE 2 SPECIFICATION
authorized_by: Kelvin Wong
authorization_date: 2026-08-13
gate_reference: DD-029
```

Kelvin Wong, as case owner of EC-002 — Konnichiwa Organic Visibility Growth, issues:

> AUTHORIZED WITH CONDITIONS TO PREPARE STAGE 2 SPECIFICATION

**Authorization is limited strictly to preparing the OD2-CAND-2 Origin/Backend Evidence Request and Observability Specification** (Gate 1 of the five-gate division in Section 6 above). This decision does **not** authorize:

- evidence collection;
- authenticated system access;
- credentials or customer-data intake;
- profiler or debug-mode activation;
- configuration or production changes;
- Stage 2 execution;
- establishment of OD-002 Design;
- Transformation or external changes.

### Binding Conditions (verbatim, in full — all nine, unchanged from Section 8 above)

1. The specification must ground its own justification in the CE-DQ4-A/CE-DQ4-B entanglement (open since decisions/DD-018), never in "Stage 1 is closed" as a standalone reason (Challenge 1).
2. The specification must pre-register "Not Available" as a legitimate, non-blocking outcome for BE-02 and BE-03 specifically (Challenge 6), and must not route toward credentialed or phpMyAdmin-style access to obtain them.
3. The specification must pre-register "Insufficient Evidence" as a legitimate, closed-for-now Stage 2 outcome, mirroring OD2-REQ-003 and Stage 1's own CS-4 precedent (Challenge 7) — Stage 2 is not guaranteed to resolve the CE-DQ4-A/B entanglement, and must not imply otherwise.
4. Every BE-01–BE-08 item's classification (Section 5) carries forward into the specification unmodified; phpMyAdmin remains explicitly Unsafe Without New Authorization.
5. G-01's three-way routing table (Section 4) governs any future evidence outcome — non-registered mechanisms return to Diagnosis; dispositive entanglement-resolving evidence triggers a lifecycle-decision pause, per Binding Boundary 12/OD2-REQ-014 and decisions/DD-022 Common Condition 10.
6. G-05 through G-09's access, privacy, reversibility, and stop rules (Section 4) apply in full to the specification and to any future collection under it.
7. Gates 2 through 5 in Section 6 each require their own, later, separate, explicit case-owner decision — none is authorized now, and none may be inferred from acceptance of this recommendation.
8. No credential, password, API key, token, cookie, or FTP/SSH/database access may be requested or stored, at any stage.
9. All conditions from decisions/DD-018 (eleven), DD-022 (twenty), DD-025 (twenty-one), DD-026 (eight gate + twenty-seven acceptance), DD-027 (twenty-one), and DD-028 (nine gate + twenty-nine acceptance) remain independently binding and are not narrowed by this gate.

These nine conditions layer on top of, and do not replace, this gate's own G-01–G-12 matrix and independent challenge above, and all prior DD-018/DD-022/DD-025/DD-026/DD-027/DD-028 conditions, all of which remain independently binding.

### Preserved, Not Reinterpreted

The Stage 1 CS-4 classification (decisions/DD-028) and the domain-specific Varnish configured/delivered state (Unconfirmed) are **preserved exactly as recorded above, without reinterpretation**, by this decision:

| Layer | Configured-State | Delivered-State |
|---|---|---|
| WordPress full-page cache | Not Present Within Inspected Plugin List | Unconfirmed |
| Host/reverse-proxy (Varnish, konnichiwa.nl) | **Unconfirmed** | **Unconfirmed** |
| CDN/edge cache | Confirmed Disabled within the inspected DirectAdmin account scope at capture time | Unconfirmed |

Overall Stage 1 outcome remains **CS-4 — Insufficient Evidence**, `Accepted With Conditions` (decisions/DD-028). This decision neither upgrades nor downgrades any of the above.

### Effect on Lifecycle State

```yaml
od_002_stage_2_authorization_gate: Authorized With Conditions — Specification Preparation Only
od_002_stage_2_authorization_gate_reference: decisions/DD-029
od_002_stage_2_specification_preparation_authorized: true
od_002_stage_2_specification_created: false
od_002_stage_2_evidence_collection_authorized: false
od_002_stage_2_authorized: false
od_002_design_established: false
transformation_authorized: false
external_changes_authorized: false
```

`od_002_stage_2_specification_preparation_authorized` is now `true` — Kelvin has authorized preparing the OD2-CAND-2 Origin/Backend Evidence Request and Observability Specification, subject to the nine conditions above. `od_002_stage_2_specification_created` remains `false` — this decision authorizes preparation; it does not itself create the specification. `od_002_stage_2_evidence_collection_authorized` and `od_002_stage_2_authorized` remain `false`, unconditionally — Stage 2 itself, and evidence collection under any future specification, each require their own, later, separate, explicit case-owner decision (Gates 2 and beyond, Section 6). `od_002_design_established`, `transformation_authorized`, and `external_changes_authorized` all remain `false`, unconditionally.

### Next Action

Prepare the **OD2-CAND-2 Origin/Backend Evidence Request and Observability Specification** — **not created by this decision**, remains a distinct, later, separately-performed task, bound by the nine conditions above.

### Final Confirmations (post-decision)

| Confirmation | Status |
|---|---|
| Decision recorded: AUTHORIZED WITH CONDITIONS TO PREPARE STAGE 2 SPECIFICATION | **Confirmed** |
| All nine binding conditions recorded verbatim | **Confirmed** |
| Prior Precondition Check, Authoritative Starting State, G-01–G-12 Matrix, BE-01–BE-08 Assessment, Evidence-Request Boundary, Independent Challenge, and Recommendation preserved unmodified above | **Confirmed** |
| Stage 1 CS-4 classification and domain-specific Varnish state preserved without reinterpretation | **Confirmed** |
| Evidence collection not authorized | **Confirmed** |
| Authenticated system access not authorized | **Confirmed** |
| Credentials/customer-data intake not authorized | **Confirmed** |
| Profiler/debug-mode activation not authorized | **Confirmed** |
| Configuration/production changes not authorized | **Confirmed** |
| Stage 2 execution not authorized | **Confirmed** |
| OD-002 Design establishment not authorized | **Confirmed** |
| Transformation/external changes remain unauthorized | **Confirmed** |
| Stage 2 specification not created in this task | **Confirmed** |
| Nothing committed or pushed | **Confirmed** — no `git add`, `git commit`, or `git push` was run in the course of this task |
