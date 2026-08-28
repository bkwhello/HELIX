# DD-030 — OD2-CAND-2 Specification Readiness Gate

---

Date: 13 August 2026. Reviewer: Claude, acting as an **independent HELIX Specification Readiness Gate Reviewer** for EC-002 — assessing readiness of design/OD2-CAND-2-origin-backend-evidence-observability-specification.md only, not authorized to approve evidence collection, access any system, or infer case-owner approval from any prior message. This document is a recommendation to Kelvin Wong as case owner.

Basis: design/OD2-CAND-2-origin-backend-evidence-observability-specification.md (this gate's subject, as corrected below); decisions/DD-018, DD-022, DD-025, DD-026, DD-027, DD-028, DD-029; diagnosis/OD-002-absence-of-html-caching-layer.md; design/OD-002-design-workstream.md; current.md; Traceability.md. Every source listed was read in full for this review, not summarized from a prior task's memory.

---

## Precondition Check

| # | Check | Result |
|---|---|---|
| 1 | Branch `feat/ec-002-visibility-baseline` | **PASS** |
| 2 | Local HEAD = origin HEAD = `e423df6adbc66251080479de5fc95860689ed5f3` (synchronized before the uncommitted work under review) | **PASS** |
| 3 | Working tree contains exactly the five expected uncommitted files | **PASS** |
| 4 | decisions/DD-029 authorized specification preparation only | **PASS** |
| 5 | All nine decisions/DD-029 conditions remain binding | **PASS** |
| 6 | Specification exists, marked `Prepared — Evidence Collection Not Authorized` | **PASS** |
| 7 | No readiness-gate file already exists for this specification | **PASS** |
| 8 | Stage 1: `CS-4 — Insufficient Evidence` | **PASS** |
| 9 | Host/Varnish for konnichiwa.nl: Configured Unconfirmed / Delivered Unconfirmed | **PASS** |
| 10 | Evidence collection, Stage 2 execution, Transformation, external changes unauthorized | **PASS** |
| 11 | No external or authenticated system accessed during preparation | **PASS** |
| 12 | OD-001 Candidate D remains unexecuted | **PASS** |
| 13 | OD-003 remains unauthorized for Design | **PASS** |

All thirteen preconditions pass. Proceeding.

---

## Part A — Authority and Scope Review

The specification's Phase 1 was checked line-by-line against decisions/DD-029's own Case-Owner Decision section, not merely trusted:

| DD-029 requirement | Specification's treatment | Verified? |
|---|---|---|
| Specification preparation only | Phase 1, "Activity Class: Specification Preparation Only" | **Verified** |
| No evidence collection | Phase 1, Phase 10 ("Preparation... is not approval to collect evidence") | **Verified** |
| No direct authenticated access | Phase 6's twelve prohibited actions, opening with "log into hosting, WordPress, DirectAdmin, a database, or a CDN" | **Verified** |
| No Diagnosis reopening | Phase 1 Condition 5 (G-01 routing), Phase 8's stop rule | **Verified** |
| No technical solution selection | Phase 7's closing rule; Explicit Non-Assumptions list | **Verified** |
| No Transformation or external change | Phase 1 "Prior Decisions Referenced," Phase 7's closing rule | **Verified** |

**All nine decisions/DD-029 binding conditions were compared word-for-word against Phase 1's own restatement — an exact match, condition 1 through condition 9, no paraphrase drift, no omission, no addition.** Part A: **Confirmed within scope.**

---

## Part B — BE-01–BE-08 Review

Each item assessed against the twelve criteria (question clarity; exact source/screen; evidence class; minimum visible fields; prohibited fields; redaction requirements; owner/access boundary; sufficiency rule; missing-evidence discipline; CE-DQ4-A/B discrimination value; approval requirement; safety/proportionality).

| ID | Question clarity | Source named | Class stated | Fields (min/prohibited) | Redaction | Owner/access | Sufficiency rule | Missing-evidence discipline | CE-DQ4-A/B value | Approval flagged | Safety | **Readiness** |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| BE-01 | Clear | Yes | Restricted | Both present | Present | Kelvin, existing-only | Present, corroborating | Not Available, never "not slow" | None alone | N/A | Safe | **Ready** |
| BE-02 | Clear | Yes | Restricted | Both present | Present | Kelvin, existing-only, profiling excluded | Present | Not Available, never "fast" | **Highest — direct CE-DQ4-A** | Flagged (profiling out of scope) | Safe as bounded | **Ready With Conditions** |
| BE-03 | Clear | Yes | Restricted | Both present, DB-specific prohibitions explicit | Present, strict (reject not redact) | Kelvin, existing-aggregated-only | Present | Not Available, never "fast" | Partial CE-DQ4-A | Flagged (phpMyAdmin explicitly excluded) | Safe as bounded | **Ready With Conditions** |
| BE-04 | Clear | Yes | Restricted | Both present | Present | Kelvin, existing-only | Present, corroborating | Not Available | None alone | N/A | Safe | **Ready** |
| BE-05 | Clear | Yes | Restricted | Both present, aggregation mandatory | Present, strict | Kelvin, existing-only | Present | Not Available | None alone | N/A | Safe if aggregation is honored | **Ready With Conditions** (aggregation must be verified, not merely claimed) |
| BE-06 | Clear | Yes (or Owner Declaration) | Dual (Restricted/Owner Declaration) | Both present | Present | Kelvin, existing-or-declaration | Present, weak | Not Available | None alone | N/A | Safe | **Ready With Conditions** (overlaps BE-08, low expected yield) |
| BE-07 | Clear | Yes | Provider-attested | Both present | Present | Kelvin, existing-only, no new ticket | Present, corroborating | Not Available | None alone | Flagged (no new support ticket) | Safe | **Ready With Conditions** |
| BE-08 | Clear | N/A (declaration) | Owner Declaration | Both present | N/A | Kelvin | Present, explicitly capped | N/A (cannot be "Not Available") | None | N/A | Safe | **Ready** |

**phpMyAdmin (named within BE-03, not itself a BE item): confirmed `Unsafe Without New Authorization`, unconditionally, in both the specification (Phase 3, Phase 6) and this gate.**

**Explicit essentiality determination:** **no BE item is Essential.** BE-02 and BE-03 carry the highest discriminating value for CE-DQ4-A, but the specification's own Phase 7 pre-registers "Evidence Insufficient" as a fully legitimate outcome if neither resolves — consistent with Stage 1's own CS-4 precedent. No item is upgraded to Essential merely because it would be useful if available; this gate confirms that determination independently, not by repeating the specification's own claim.

---

## Part C — Evidence-Separation Review

| Dichotomy | Kept distinct? | Basis |
|---|---|---|
| CrUX field vs. Lighthouse/lab | Yes | Phase 4, Class 1 vs. Class 2, explicit substitution ban |
| CrUX field vs. public-request timing | Yes | Phase 4, Class 1 vs. Class 3 |
| Public-request timing vs. restricted backend/origin | Yes | Phase 4's explicit rule: Class 3 cannot establish Class 4 |
| Restricted backend/origin vs. Owner Declaration | Yes | Phase 4, Class 4 vs. Class 5; BE-08's own "never upgraded to the same confidence" rule |
| Owner Declaration vs. provider-attested | Yes | Phase 4, Class 5 vs. Class 6 |
| Configured state vs. delivered state | Yes | Phase 4's explicit rule, extending decisions/DD-027/DD-028's own axis discipline |
| Account-level state vs. domain-specific state | Yes | Phase 4's explicit rule, extending decisions/DD-028's own Varnish-layer finding |

**One defect found and corrected:** Phase 4's original Class 4 row listed "BE-01 through BE-07," directly contradicting BE-07's own Phase 3 definition ("Evidence class: Provider-attested evidence," i.e., Class 6 only). This is a genuine cross-reference error, not a substitution risk in practice (no evidence item was actually at risk of being misclassified during use, since Phase 3's own per-item field is unambiguous), but it is a real internal inconsistency in the specification as drafted. **Corrected**: Class 4 now reads "BE-01 through BE-06"; a correction note is preserved in the specification directly below the table. Part C: **PASSED WITH CONDITION (corrected).**

---

## Part D — Privacy and Security Review

| Risk | Prohibited? | Basis |
|---|---|---|
| Credentials or secrets | Yes | Phase 5, Phase 1 Condition 8, Phase 6 |
| Cookies/session identifiers | Yes | Phase 5 |
| Customer or reservation data | Yes | Phase 5 |
| Raw IP addresses | Yes | Phase 5 |
| Database contents | Yes | BE-03's explicit reject-not-redact rule; Phase 5's database-credentials line |
| Neighbouring-domain data | Yes | Phase 5 |
| Payment or billing data | Yes | Phase 5 |
| Unrestricted raw logs | Yes | BE-05's explicit rule: raw log lines with personal information/tokens/full parameters are rejected outright, not redacted-and-kept; Phase 5's general raw-log rule |

**One gap found and corrected:** decisions/DD-029's own G-08 table (the specification's governing authority) named "server paths, database names" as a redaction-required risk category. The specification's Phase 5 list, as drafted, did **not** explicitly include internal server file paths — a real, exploitable gap, since BE-02, BE-03, and BE-05 (execution reports, query summaries, error logs) commonly reveal server directory structure. **Corrected**: Phase 5 now explicitly names internal server file paths and directory structure as a required-redaction category, with the correction dated and attributed inline.

**Confirmed, independently, not merely repeated:** collection mode is `Owner-Supplied Redacted Evidence Only` (Phase 6); no direct authenticated agent access is permitted (Phase 6, item 1); profiling/debugging cannot be activated (Phase 6, items 3–4; BE-02's own explicit exclusion); plugins cannot be installed (Phase 6, item 5); PHP or SQL cannot be executed (Phase 6, item 6); no cache or server setting can be changed (Phase 6, items 7–9); provider support cannot be contacted without new authorization (Phase 6, item 10; BE-07's own explicit note); no new public HTTP probe is permitted (Phase 6, item 11). Part D: **PASSED WITH CONDITION (corrected).**

---

## Part E — Outcome-Routing Review

| Outcome | Threshold present? | Allowed/prohibited conclusions distinguished? | OD-002 effect stated? | Diagnosis review condition stated? | Lifecycle review condition stated? | Further gate required? |
|---|---|---|---|---|---|---|
| Backend Processing Signal Confirmed | Yes | Yes | Unchanged, conditionally reviewed | Yes, conditional | Yes, conditional | Yes (Gate 3) |
| Backend Processing Signal Not Found | Yes | Yes | Unchanged, conditionally reviewed | Yes, conditional | Yes, conditional | Yes (Gate 3) |
| Cache/Backend Mechanisms Remain Entangled | Yes | Yes | Unchanged | No (expected status quo) | No | Yes (Gate 3, to record) |
| Contradictory Evidence | Yes | Yes | Unchanged | Flagged for review | Recommended | Yes (Gate 3) |
| Evidence Insufficient | Yes | Yes | Unchanged | No | No | Yes (Gate 3, to record closure) |
| Unsafe or Unauthorized Evidence Requirement | Yes | Yes | Unchanged | No | No | Yes (specification amendment + fresh decision) |

**Confirmed, independently: no outcome automatically authorizes** OD-002 Design establishment, a caching/hosting/PHP/database intervention, Stage 2 execution beyond approved evidence scope, Transformation, or external changes — Phase 7's closing sentence states this explicitly and every "Further Gate Required" cell above confirms it structurally, not merely by assertion. Part E: **PASSED.**

---

## Part F — Mechanism-Discrimination Review

The specification's own Phase 2 question names six factors (backend/origin, cache-layer, network conditions, CrUX aggregation, page mix, time/load variability). Independent inspection of the BE-01–BE-08 manifest finds it addresses **only** backend/origin processing (CE-DQ4-A) and, contextually, cache-layer delivery (CE-DQ4-B) — **no BE item speaks to CE-DQ4-C (network/geographic distance), CE-DQ4-E (CrUX aggregation/page-mix), CE-DQ4-F (mobile network/radio), or CE-DQ4-G (time/load variability)** — those remain OD2-CAND-4's separate, unselected remit (design/OD-002-design-workstream.md, Phase 5), not this specification's.

**This is a genuine scope-precision gap, not a fatal one** — nothing in the specification claims to resolve the other four mechanisms, but nothing explicitly disclaimed it either, creating a real misreading risk given how broadly Phase 2's question is phrased relative to the actual manifest. **Corrected**: an explicit scope-boundary bullet was added to Phase 2, naming CE-DQ4-C/E/F/G as outside this specification's evidence manifest.

**Determination:** the specification, as corrected, is **useful but weakly discriminating** — it can meaningfully speak to the CE-DQ4-A/CE-DQ4-B pair specifically if BE-02 or BE-03 resolve to real data (realistically uncertain, per decisions/DD-029's own assessment of this hosting account's diagnostic surface), but it is **incapable of answering** the network/page-mix/aggregation/time-load portion of its own literal Phase 2 question — that portion remains open regardless of this specification's outcome. **Evidence Insufficient is preserved as the honest, expected result if BE-02/BE-03 do not materialize** — this gate does not require perfect causal identification, and finds none is claimed. Part F: **PASSED WITH CONDITION (corrected).**

---

## Part G — Independent Attack (fifteen failure modes)

| # | Attack | Result | Basis |
|---|---|---|---|
| 1 | Varnish silently treated as active | **Survives** | Phase 1 Explicit Non-Assumptions; unchanged from decisions/DD-027/DD-028 |
| 2 | Caching silently treated as absent | **Survives** | Same list |
| 3 | Backend processing treated as the cause of the CrUX tail | **Survives** | Phase 2 frames this as tested, not assumed; Phase 7's "May Not Conclude" columns explicitly forbid sole/dominant-cause language |
| 4 | Lab data substituted for field data | **Survives** | Phase 4 Class 1/2 rule |
| 5 | Public timing substituted for internal observability | **Survives** | Phase 4 Class 3/4 rule |
| 6 | Account-level evidence applied to konnichiwa.nl | **Survives** | Phase 4's explicit rule, extending decisions/DD-028 |
| 7 | Missing evidence treated as negative evidence | **Survives** | Every BE item's own missing-evidence field; Phase 4's closing rule |
| 8 | phpMyAdmin or database access normalized as routine | **Survives** | BE-03's explicit exclusion; Phase 6, item 6 |
| 9 | Raw logs permit privacy leakage | **Survives with Narrowing** | BE-05's reject-not-redact rule is sound, but Phase 5's own prohibited-fields list was missing "internal server file paths," a risk decisions/DD-029's own G-08 table had already named — **corrected** (Part D) |
| 10 | A technical intervention is smuggled into a requirement | **Survives** | No BE item's sufficiency rule requires or implies a fix; Phase 7's closing rule |
| 11 | Evidence collection becomes implicit authorization for Stage 2 execution | **Survives** | Phase 1 Activity Class; Phase 10's explicit statement |
| 12 | A result automatically establishes Design | **Survives** | Phase 7's "Further Gate Required: Yes" on every outcome |
| 13 | A new diagnosis is created without a Diagnosis gate | **Survives** | Phase 1's G-01 routing reference; Phase 8's explicit stop rule |
| 14 | Business outcomes are inferred from TTFB evidence | **Survives** | Explicit Non-Assumptions list; Phase 7's "May Not Conclude" columns |
| 15 | Transformation or external changes become implied | **Survives** | Phase 7's closing rule; Phase 1's Prior Decisions Referenced section |

**Result: 14 of 15 Survive cleanly; 1 (Attack 9) Survives with Narrowing, corrected during this review.** No attack was Rejected.

**Review-transparency note (not a defect requiring further correction):** the specification's own internal Phase 9 falsification test (twelve attacks, run by its author during drafting) frames its BE-03/phpMyAdmin exclusion as a "drafting-time correction... preserved... rather than silently absorbed." No materially different, less-safe prior version of this specification was ever committed, published, or shown to Kelvin — the safeguard was present from first authorship within a single drafting pass. This does not weaken the safeguard itself, which this gate independently re-verified as sound (Part B, Part D); it is recorded here only so that Phase 9's own "correction history" language is not misread as documenting a distinct historical event.

---

## Part H — G-01–G-12 Gate Criteria

| Criterion | Verdict | Reasoning |
|---|---|---|
| G-01 Valid authority | **PASS** | Part A's word-for-word verification against decisions/DD-029 |
| G-02 Complete scope boundary | **PASS** | Phase 1, Phase 6, Phase 10 jointly and explicitly exclude collection/access/mutation |
| G-03 BE manifest completeness | **PASS WITH CONDITIONS** | All eight items individually complete (Part B); one cross-reference defect found and corrected (Part C) |
| G-04 Evidence-class integrity | **PASS WITH CONDITIONS** | Same basis as G-03 — the Class 4/6 overlap, now corrected |
| G-05 Privacy/security safety | **PASS WITH CONDITIONS** | Server-file-path redaction gap found and corrected (Part D) |
| G-06 Missing-evidence discipline | **PASS** | Every BE item states its own Not Available handling; matches decisions/DD-026 Condition 11 precedent |
| G-07 Mechanism-discrimination usefulness | **PASS WITH CONDITIONS** | Scope-precision gap (CE-DQ4-C/E/F/G) found and corrected (Part F); Evidence Insufficient preserved as legitimate |
| G-08 Outcome-routing integrity | **PASS** | Part E — six complete, correctly-thresholded, correctly-routed outcomes, none self-authorizing |
| G-09 Lifecycle containment | **PASS** | Phase 1, Phase 7, Phase 10 keep Stage 2 execution/Design/Transformation/external changes each separately gated |
| G-10 Non-prescriptive character | **PASS** | No technical solution named or implied anywhere; Explicit Non-Assumptions list forbids it directly |
| G-11 Falsifiability | **PASS WITH CONDITIONS** | Part G's fifteen-attack independent re-run found the specification's own internal test sound in substance but flags a minor narrative-accuracy note (see Part G) — not a structural falsifiability defect |
| G-12 Operational usability | **PASS** | Every BE item has a clear collection method, owner, and access requirement; Kelvin could act on this specification today |

**No criterion FAILED. Five criteria (G-03, G-04, G-05, G-07, G-11) carry PASS WITH CONDITIONS**, all traceable to the three bounded corrections applied during this review.

---

## Gate Verdict

**PASSED WITH CONDITIONS.**

This verdict is a gate recommendation only — kept separate from, and not substituting for, any future case-owner decision.

### Binding Conditions

1. The specification's Phase 4 Class 4 row is corrected to "BE-01 through BE-06" — BE-07 is Class 6 (Provider-attested) exclusively; this correction is preserved inline in the specification with its own dated attribution.
2. The specification's Phase 2 now explicitly states that CE-DQ4-C, CE-DQ4-E, CE-DQ4-F, and CE-DQ4-G remain entirely outside this specification's evidence manifest — OD2-CAND-4's separate, unselected remit; any future reading must not treat this specification as capable of resolving all six named factors.
3. The specification's Phase 5 now explicitly names internal server file paths and directory structure as a required-redaction category, matching decisions/DD-029's own G-08 table.
4. No BE item is Essential — this gate independently confirms that determination (Part B); "Evidence Insufficient" remains a fully legitimate, non-blocking outcome regardless of what is eventually supplied.
5. phpMyAdmin remains `Unsafe Without New Authorization`, unconditionally, in both the specification and this gate.
6. All nine decisions/DD-029 binding conditions, and all conditions from decisions/DD-018 (eleven), DD-022 (twenty), DD-025 (twenty-one), DD-026 (eight gate + twenty-seven acceptance), DD-027 (twenty-one), and DD-028 (nine gate + twenty-nine acceptance), remain independently binding and are not narrowed by this gate.
7. This gate does not authorize Stage 2 evidence collection, Stage 2 execution, OD-002 Design establishment, Transformation, or external changes, regardless of the case-owner response requested below.

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

---

## Requested Case-Owner Response

```
APPROVED FOR BOUNDED STAGE 2 EVIDENCE COLLECTION
APPROVED WITH CONDITIONS FOR BOUNDED STAGE 2 EVIDENCE COLLECTION
NOT APPROVED FOR STAGE 2 EVIDENCE COLLECTION
```

**This gate's PASSED WITH CONDITIONS verdict is a recommendation, not authorization.** No response is inferred from general permission to "continue," from approval of any prior message, or from anything not naming this response explicitly. No response to the above may be read as authorizing Stage 2 execution, OD-002 Design establishment, Transformation, or external changes — those each remain separate, later, distinct gates (Section 8 of decisions/DD-029, unchanged and unnarrowed here).

---

## Final Intended Change Scope

| File | Change | Reason |
|---|---|---|
| `decisions/DD-030-od2-cand2-specification-readiness-gate.md` | Created (this file) | The readiness gate itself |
| `design/OD2-CAND-2-origin-backend-evidence-observability-specification.md` | Corrected (three bounded corrections) | BE-07 Class 4/6 cross-reference fix; CE-DQ4-C/E/F/G scope-boundary clarification; server-file-path redaction addition — each preserved inline with dated attribution, no other content altered |
| `design/OD-002-design-workstream.md` | Updated | Status addendum recording this gate's existence and verdict |
| `design/README.md` | Updated | Specification's status row updated to reflect readiness review |
| `current.md` | Updated | Records this gate's existence, verdict, and pending case-owner response |
| `Traceability.md` | Updated | Same convention, following the DD-026/DD-029 section-naming pattern |

No credential, password, API key, token, cookie, or FTP/SSH access was requested or accessed. No hosting, WordPress, DirectAdmin, database, or CDN system was accessed by this gate. No evidence was collected. No technical intervention was selected. No commit was created. Nothing was pushed.

---

## Case-Owner Decision (recorded 13 August 2026)

**This section records Kelvin Wong's explicit response to the Requested Case-Owner Response above. It does not replace, edit, or overwrite the Precondition Check, Part A (Authority and Scope Review), Part B (BE-01–BE-08 Review), Part C (Evidence-Separation Review), Part D (Privacy and Security Review), Part E (Outcome-Routing Review), Part F (Mechanism-Discrimination Review), Part G (Independent Attack), Part H (G-01–G-12 Gate Criteria), the Gate Verdict (PASSED WITH CONDITIONS) and its seven binding conditions, or the Requested Case-Owner Response's "Pending" state that preceded this decision — all remain intact above, unmodified, as the historical record of this independent gate review.**

```yaml
decision: APPROVED WITH CONDITIONS FOR BOUNDED STAGE 2 EVIDENCE COLLECTION
authorized_by: Kelvin Wong
authorization_date: 2026-08-13
gate_reference: DD-030
```

Kelvin Wong, as case owner of EC-002 — Konnichiwa Organic Visibility Growth, issues:

> APPROVED WITH CONDITIONS FOR BOUNDED STAGE 2 EVIDENCE COLLECTION

### Authorized Scope

Authorizes **preparation and intake of owner-supplied, redacted evidence for BE-01–BE-08 only**, exactly as defined in design/OD2-CAND-2-origin-backend-evidence-observability-specification.md as readiness-reviewed and corrected by this gate. **This is not authorization for unrestricted Stage 2 execution.** The evidence intake and its classification must remain a bounded collection round followed by an independent classification gate — mirroring exactly how Stage 1 (OD2-CAND-3) proceeded from decisions/DD-026's approval through decisions/DD-027 and DD-028's classification gates.

### Condition Set A — All Nine decisions/DD-029 Binding Conditions (verbatim, unmerged, unrenumbered)

1. The specification must ground its own justification in the CE-DQ4-A/CE-DQ4-B entanglement (open since decisions/DD-018), never in "Stage 1 is closed" as a standalone reason (Challenge 1).
2. The specification must pre-register "Not Available" as a legitimate, non-blocking outcome for BE-02 and BE-03 specifically (Challenge 6), and must not route toward credentialed or phpMyAdmin-style access to obtain them.
3. The specification must pre-register "Insufficient Evidence" as a legitimate, closed-for-now Stage 2 outcome, mirroring OD2-REQ-003 and Stage 1's own CS-4 precedent (Challenge 7) — Stage 2 is not guaranteed to resolve the CE-DQ4-A/B entanglement, and must not imply otherwise.
4. Every BE-01–BE-08 item's classification (Section 5) carries forward into the specification unmodified; phpMyAdmin remains explicitly Unsafe Without New Authorization.
5. G-01's three-way routing table (Section 4) governs any future evidence outcome — non-registered mechanisms return to Diagnosis; dispositive entanglement-resolving evidence triggers a lifecycle-decision pause, per Binding Boundary 12/OD2-REQ-014 and decisions/DD-022 Common Condition 10.
6. G-05 through G-09's access, privacy, reversibility, and stop rules (Section 4) apply in full to the specification and to any future collection under it.
7. Gates 2 through 5 in Section 6 each require their own, later, separate, explicit case-owner decision — none is authorized now, and none may be inferred from acceptance of this recommendation.
8. No credential, password, API key, token, cookie, or FTP/SSH/database access may be requested or stored, at any stage.
9. All conditions from decisions/DD-018 (eleven), DD-022 (twenty), DD-025 (twenty-one), DD-026 (eight gate + twenty-seven acceptance), DD-027 (twenty-one), and DD-028 (nine gate + twenty-nine acceptance) remain independently binding and are not narrowed by this gate.

### Condition Set B — All Seven decisions/DD-030 Binding Conditions (verbatim, unmerged, unrenumbered)

1. The specification's Phase 4 Class 4 row is corrected to "BE-01 through BE-06" — BE-07 is Class 6 (Provider-attested) exclusively; this correction is preserved inline in the specification with its own dated attribution.
2. The specification's Phase 2 now explicitly states that CE-DQ4-C, CE-DQ4-E, CE-DQ4-F, and CE-DQ4-G remain entirely outside this specification's evidence manifest — OD2-CAND-4's separate, unselected remit; any future reading must not treat this specification as capable of resolving all six named factors.
3. The specification's Phase 5 now explicitly names internal server file paths and directory structure as a required-redaction category, matching decisions/DD-029's own G-08 table.
4. No BE item is Essential — this gate independently confirms that determination (Part B); "Evidence Insufficient" remains a fully legitimate, non-blocking outcome regardless of what is eventually supplied.
5. phpMyAdmin remains `Unsafe Without New Authorization`, unconditionally, in both the specification and this gate.
6. All nine decisions/DD-029 binding conditions, and all conditions from decisions/DD-018 (eleven), DD-022 (twenty), DD-025 (twenty-one), DD-026 (eight gate + twenty-seven acceptance), DD-027 (twenty-one), and DD-028 (nine gate + twenty-nine acceptance), remain independently binding and are not narrowed by this gate.
7. This gate does not authorize Stage 2 evidence collection, Stage 2 execution, OD-002 Design establishment, Transformation, or external changes, regardless of the case-owner response requested below.

Condition Sets A and B are kept **separately titled with their own provenance** — neither is merged, renumbered, paraphrased, or deduplicated into the other, even where their substance overlaps (e.g., Set A Condition 9 and Set B Condition 6 both restate the same prior-gate inheritance, from two different authorship points).

### Additional Binding Conditions on This Authorization (verbatim, seventeen, new to this decision)

1. Collection is restricted to BE-01–BE-08 exactly as defined in the readiness-reviewed specification.
2. Collection mode remains: Owner-Supplied Redacted Evidence Only.
3. No BE item is Essential.
4. Missing or unavailable evidence is a valid result and must never be encoded as zero, absent, disabled, healthy or disproven.
5. phpMyAdmin remains Unsafe Without New Authorization.
6. No SQL, database browsing, profiler, debug mode, plugin installation, configuration change or server mutation is authorized.
7. No direct authenticated access by Claude or another agent is authorized.
8. No passwords, keys, tokens, cookies, sessions, customer information, reservation content, raw IP addresses, internal server paths or unrelated domain/account data may enter the repository.
9. Evidence must be supplied by Kelvin already cropped, redacted or aggregated.
10. CrUX, lab, public timing, restricted backend evidence, Owner Declaration and provider-attested evidence must remain separately classified.
11. Configured state must remain separate from delivered state.
12. Account-level evidence must not be applied to konnichiwa.nl without domain-specific support.
13. Evidence collection may assess CE-DQ4-A/B only. It must not claim to test CE-DQ4-C/E/F/G.
14. No new public HTTP probing is authorized.
15. No new provider-support request is authorized.
16. No outcome may automatically establish a diagnosis, OD-002 Design, authorize a technical intervention, start Transformation or permit an external change.
17. Material contradiction, new diagnosis-relevant evidence, unsafe data or scope expansion requires an immediate stop and a new case-owner decision.

### Preserved, Not Reinterpreted

The Stage 1 CS-4 classification (decisions/DD-028) and the domain-specific host/Varnish state (Configured-State Unconfirmed, Delivered-State Unconfirmed) are preserved exactly as recorded in this gate's own Precondition Check and Part B above — this decision neither upgrades nor downgrades either.

### Effect on Lifecycle State

```yaml
od_002_stage_2_specification_created: true
od_002_stage_2_specification_status: Approved With Conditions — Bounded Evidence Collection Authorized
od_002_stage_2_specification_readiness_gate: DD-030 — Passed With Conditions
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

`od_002_stage_2_evidence_collection_authorized` is now `true` — this authorizes Kelvin to begin supplying owner-redacted BE-01–BE-08 evidence; it does not itself perform any collection. `od_002_stage_2_collection_started` remains `false` — no evidence has been supplied or ingested by this decision. `od_002_stage_2_direct_authenticated_access_authorized` is explicitly `false` — Claude remains not authorized to access any account or system directly. `od_002_stage_2_authorized`, `od_002_design_established`, `transformation_authorized`, and `external_changes_authorized` all remain `false`, unconditionally.

### Next Action

Prepare a bounded BE-01–BE-08 Evidence Intake request/package under this decision; **do not collect evidence until that intake task is separately started.** No evidence-intake or classification-gate artifact was created by this decision.

### Final Confirmations (post-decision)

| Confirmation | Status |
|---|---|
| Decision recorded: APPROVED WITH CONDITIONS FOR BOUNDED STAGE 2 EVIDENCE COLLECTION | **Confirmed** |
| Condition Set A (nine decisions/DD-029 conditions) recorded verbatim, separately provenanced | **Confirmed** |
| Condition Set B (seven decisions/DD-030 conditions) recorded verbatim, separately provenanced | **Confirmed** |
| Seventeen additional binding conditions recorded verbatim | **Confirmed** |
| Prior Precondition Check, Parts A–H, Gate Verdict, and Requested Case-Owner Response preserved unmodified above | **Confirmed** |
| BE-01–BE-08 is the complete authorized scope — no item Essential | **Confirmed** |
| phpMyAdmin remains Unsafe Without New Authorization | **Confirmed** |
| No evidence collected in this task | **Confirmed** |
| Evidence collection not started (`od_002_stage_2_collection_started: false`) | **Confirmed** |
| Stage 1 CS-4 and Varnish Unconfirmed/Unconfirmed unchanged | **Confirmed** |
| Stage 2 execution remains unauthorized (`od_002_stage_2_authorized: false`) | **Confirmed** |
| OD-002 Design remains unestablished | **Confirmed** |
| Transformation and external changes remain unauthorized | **Confirmed** |
| No evidence-intake or classification-gate artifact created | **Confirmed** |
| Nothing committed or pushed | **Confirmed** — no `git add`, `git commit`, or `git push` was run in the course of this task |
