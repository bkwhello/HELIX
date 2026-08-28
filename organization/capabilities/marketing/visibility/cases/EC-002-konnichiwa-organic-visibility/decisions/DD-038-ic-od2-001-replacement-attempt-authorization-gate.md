# DD-038 — IC-OD2-001 Replacement-Attempt Authorization Gate

---

**Independent HELIX Authorization Gate review**, performed by Claude acting as independent Authorization Gate Reviewer, 19 August 2026, for EC-002 — Konnichiwa Organic Visibility Growth.

**Task boundary:** assess whether one new, strictly bounded, public, read-only replacement CrUX/PageSpeed attempt for IC-OD2-001 is sufficiently justified and safely authorizable, following Attempt 1's HTTP 429 blockage. This gate may recommend, at most, authorization for one bounded replacement attempt. It does not access PageSpeed Insights or CrUX, does not perform any browser measurement, does not create evidence, and does not itself authorize execution — that remains Kelvin's separate Case-Owner Decision.

---

## Precondition Check

| # | Precondition | Result |
|---|---|---|
| 1 | Branch `work/ec-002-crux-execution-20260819` | **PASS** |
| 2 | HEAD `f61456351e7814181eeef4d3c1a3395cc3092a68` | **PASS** |
| 3 | Working tree clean | **PASS** |
| 4 | Remote visibility HEAD `f61456351e7814181eeef4d3c1a3395cc3092a68`, ahead/behind `0/0` | **PASS** |
| 5 | No `decisions/DD-038*` existed prior to this task | **PASS** |
| 6 | Reservation worktree (`C:\Users\kelvin\HELIX`) unaffected | **PASS** — HEAD `b71e4879...` and untracked file verified unchanged |

**All six preconditions passed. Proceeding.**

---

## Review Sources (read in full)

current.md; Traceability.md; decisions/DD-035-ic-od2-001-crux-protocol-authorization-gate.md; decisions/DD-036-ic-od2-001-crux-protocol-readiness-gate.md; decisions/DD-037-ic-od2-001-execution-blocker-attempt-gate.md; transformation/IC-OD2-001-crux-mobile-ttfb-remeasurement-protocol.md; transformation/IC-OD2-001-crux-remeasurement-execution-attempt-1.md; transformation/OD-002-implementation-candidate-construction-workstream.md; observations/O-012.md, including its own Attempt Log. All historical text and decisions preserved unmodified below and in every cited source — this gate creates no edit to them.

---

## Gate Question

> Is one new, strictly bounded, public, read-only replacement CrUX/PageSpeed attempt sufficiently justified and safely authorizable, after Attempt 1 via the public API v5 route ended in HTTP 429 with no data?

This gate recommends only. Kelvin makes the later Case-Owner Decision.

---

## Part 1 — Foundation Review

| Item | Status | Basis |
|---|---|---|
| OD-002 Design remains Established — Conditional | **Confirmed** | decisions/DD-032, unmodified |
| Confidence remains Medium-Low | **Confirmed** | decisions/DD-032 |
| Historical baseline remains 24 June–21 July 2026 | **Confirmed** | observations/O-012.md, EV-017 |
| Historical poor mobile TTFB share remains 26% | **Confirmed** | observations/O-012.md |
| Attempt 1 remains HTTP 429 / No Data | **Confirmed** | transformation/IC-OD2-001-crux-remeasurement-execution-attempt-1.md §3 |
| Attempt 1 method compliance remains Unresolvable | **Confirmed** | decisions/DD-037 Part 2 |
| Attempt 1 remains Consumed, 0 Remaining | **Confirmed** | decisions/DD-037 Part 3 |
| No cache absence established | **Confirmed** | decisions/DD-028 — Stage 1 closed CS-4, Insufficient Evidence, never "no cache found" |
| Varnish remains Unconfirmed/Unconfirmed | **Confirmed** | decisions/DD-028 |
| Backend mechanism remains unresolved | **Confirmed** | CE-DQ4-A, unresolved throughout |
| CE-DQ4-C/E/F/G remain uninvestigated | **Confirmed** | current.md |
| Stage 2 remains not authorized | **Confirmed** | `od_002_stage_2_preparation_authorized: false`, current.md |

**Part 1 verdict: all twelve items confirmed unchanged.**

---

## Part 2 — Replacement Justification

| # | Question | Finding |
|---|---|---|
| 1 | Is a replacement attempt necessary for IC-OD2-001 to still execute meaningfully? | **Yes, if the candidate's original question is to be answered at all.** IC-OD2-001's entire purpose is a like-for-like re-measurement of the 26%-poor baseline; without any successful measurement, that question remains categorically unanswered — closing without one (RA-1) is legitimate but answers nothing. |
| 2 | Does HTTP 429 provide any substantive CrUX or TTFB evidence? Answer must rest on source facts only. | **No.** HTTP 429 is a rate-limiting response from the request layer; it carries no CrUX payload of any kind. Already established in decisions/DD-037 Part 5 and Attempt 1's own §3. |
| 3 | Is a replacement attempt a repeat of the same failed method, or a demonstrably differently-bounded route? | **Demonstrably different, if the interactive interface is prescribed.** The API v5 route and the interactive interface are two distinct access paths with different historical outcomes for this exact origin (O-012's Attempt Log). |
| 4 | Is the interactive PageSpeed Insights interface historically a used source within O-012? | **Yes, explicitly.** O-012's Attempt Log: "Interactive tool, completed report URL supplied by Kelvin — Succeeded — real field data retrieved." |
| 5 | Is there sufficient reason to exclude API v5 without a key? | **Yes.** Three independent failures on the identical route (two in O-012, 24 July 2026; one in Attempt 1, 19 August 2026), and Google's own documented behavior — O-012's Attempt Log records the API itself as "requires a Google API key for reliable unauthenticated use; none configured" — confirms this is a structural weakness of the route, not incidental bad luck. |
| 6 | Does a replacement attempt lead to diagnosis, implementation, or Stage 2 inflation? | **No, provided the bounds in Parts 3–6 below are strictly applied** — no automatic outcome classification, no mechanism conclusion, a separate Independent Classification Gate required after any successful attempt, no Stage 2 trigger. |
| 7 | Is "no replacement attempt" a credible alternative? | **Yes, fully credible.** Directly consistent with this case's own precedent of closing legitimately on an insufficient-evidence outcome rather than open-ended retrying (decisions/DD-019, DD-020, DD-028, DD-031). |

### Replacement Justification Classification

```
Justified With Conditions
```

**Reasoning:** a replacement attempt is substantively meaningful and methodologically distinct (a different, historically-successful interface), but only within the strict bounds specified in Parts 3–6 — not justified unconditionally, and not unjustified given the strong, evidence-based case for the interactive route specifically.

---

## Part 3 — Mandatory Method Boundary

Any recommended replacement attempt must use, exclusively:

- the public, interactive Google PageSpeed Insights interface;
- **not** the PageSpeed Insights API v5 endpoint;
- no API key;
- no login;
- no authenticated access;
- no automation;
- no command-line HTTP request;
- no additional technical probe.

### Exact Attempt-Start Definition

- Opening the PageSpeed landing page alone is **not** an attempt.
- Entering/submitting `https://konnichiwa.nl` to start the analysis **is** the attempt.
- Every submitted analysis counts as **the one attempt**, regardless of success, error, timeout, missing data, or an unsuitable window.
- Never automatically reload or resubmit.

This mirrors, without modification, how Attempt 1 itself was already defined — the act of sending the request is what consumes the attempt, not its outcome (decisions/DD-037 Part 3).

---

## Part 4 — New Window Rule

The original target window (2026-07-22 through 2026-08-18) has now fully elapsed and must not be silently assumed still available.

### Proposed Replacement-Window Rule

A result is usable only when the interactive source visibly displays:

- an exactly named period;
- exactly 28 consecutive calendar days;
- window start on or after 2026-07-22;
- no overlap with the baseline, which ended 2026-07-21;
- origin-level field data;
- mobile;
- TTFB;
- origin `https://konnichiwa.nl`.

The exact future window is **not** pre-fixed in this gate. The source must display the dates itself.

**If the source does not display exact dates:** attempt used; no evidence; stop; no repeat.

### Methodological Assessment

**Sufficiently like-for-like.** This rule preserves every substantive requirement of the original protocol (identical window length, device class, metric, aggregation scope, non-overlap) while correctly declining to pre-fix an exact calendar window — CrUX exposes a rolling period controlled by Google's own reporting cycle, not a user-selectable arbitrary range, exactly as the *original* protocol's own Phase 4 already acknowledged ("not evidence that the CrUX source will expose this exact period"). Treating "on or after 2026-07-22, 28 days, no overlap" as the comparability test — rather than insisting on the exact original 22 July–18 August dates, which can no longer be obtained from a live rolling-window source — is a structurally sound adaptation, not a loosening of rigor. **This is a widening of the acceptable window relative to the original protocol's fixed dates, made necessary by elapsed time, not a relaxation of the comparability requirements themselves** — all four structural tests (length, start boundary, non-overlap, scope) remain exactly as strict as before.

---

## Part 5 — Date and Expiry Governance

| Field | Recommendation | Basis |
|---|---|---|
| Earliest execution | Not before Kelvin's Case-Owner Decision on DD-038 | No fixed calendar date is meaningful here, since the target window itself is now source-determined rather than pre-fixed (Part 4) |
| Attempt limit | Exactly 1 | Consistent throughout decisions/DD-036, DD-037 |
| Authorization expiry | **2026-10-31** | No repository evidence found justifying a narrower date; this is the same expiry already used for the original DD-036 authorization, preserving consistency across this candidate's full history rather than introducing a new, unexplained figure |
| Expiry nature | Operational choice, not evidence-derived | Consistent with decisions/DD-024's and DD-036's own treatment of their respective expiry dates |
| Source availability | Never assumed | Consistent with Part 4 |
| Reporting lag | Not generalized from any single prior observation | Consistent with decisions/DD-035 Part 4's own explicit refusal to adopt EV-017's single 3-day gap as a rule |
| Recurrence | No automated or scheduled retrieval process of any kind | Consistent with every prior gate in this case |

---

## Part 6 — Output Boundaries

A successful replacement attempt may record, exclusively:

- retrieval date and time;
- visible origin;
- mobile/origin-level/field-data scope;
- exact visible window start and window end;
- visible TTFB distribution;
- poor share exactly as displayed;
- Core Web Vitals, kept separate;
- rounding limitations;
- UMF and CF status fields.

**Not permitted:**

- a causal conclusion;
- a significance claim;
- a materiality claim without a separately approved threshold;
- "problem resolved";
- any ranking, conversion, revenue, or reservation claim;
- automatic OUT-01–OUT-07 classification;
- an automatic Stage 2 trigger.

**A separate Independent Classification Gate is required after any successful attempt** — this document does not perform, or pre-authorize, that classification.

---

## Part 7 — Alternatives

### RA-1 — No Replacement Attempt

IC-OD2-001 closes as `Completed — Blocked / No Evidence`. **Advantage:** definitive, avoids any further risk, fully consistent with case precedent for closing on insufficient evidence. **Disadvantage:** the candidate's original question (has the 26%-poor share changed?) remains permanently unanswered for any window near the original target.

### RA-2 — One Interactive Replacement Attempt

One public, interactive PSI run under the new bounds (Parts 3–6). **Advantage:** highest realistic chance of obtaining usable data, given O-012's own proof that this interface works for this origin; could actually answer the candidate's question. **Disadvantage:** carries residual risk (Part 8) of a second, differently-shaped failure, though materially lower risk than repeating the API route.

### RA-3 — Pause for a Later, New Measurement Design

No attempt under DD-038; any future reopening requires a fresh Design/case-owner review. **Advantage:** most conservative; avoids any further action on the current, narrowly-scoped problem. **Disadvantage:** disproportionate to the nature of the actual problem found (a method choice — the wrong interface — not a fundamental design defect); would discard a demonstrably viable alternative method (the interactive interface) without using it.

**No execution route is selected on Kelvin's behalf.** Grounded recommendation: **RA-2** is the best-supported route, given the strong, evidence-based distinction between the failed method (API v5) and a proven-successful alternative (interactive interface) for this exact origin — this is precisely the situation in which one bounded, well-justified replacement attempt is warranted, as distinct from blindly repeating a method already shown to fail. RA-3 is disproportionate to a method-choice problem. RA-1 remains a fully legitimate, conservative alternative if Kelvin prefers not to risk a further attempt.

---

## Part 8 — Risk Review

| # | Risk | Classification | Reasoning |
|---|---|---|---|
| 1 | HTTP 429 recurs | **Controlled With Conditions** | The interactive interface did not fail with 429 in O-012 (only the API did) — materially lower risk, not zero; Part 3's stop rule governs any recurrence |
| 2 | Window not visible | **Controlled With Conditions** | Directly governed by Part 4's explicit stop rule |
| 3 | Window not exactly 28 days | **Controlled** | Governed by Part 4's explicit length requirement; a deviating window is simply non-comparable under the rule as written |
| 4 | URL-level data instead of origin-level | **Controlled** | Explicit requirement, Part 4/6 |
| 5 | Desktop instead of mobile | **Controlled** | Explicit requirement, Part 4/6 |
| 6 | Lab data confused with field data | **Controlled** | Explicit separation requirement, Part 6, consistent with the original protocol |
| 7 | The interactive interface itself changes (e.g., a Google UI redesign) | **Controlled With Conditions** | Interface/version recording is required, but an actual redesign's effect on comparability can only be assessed at execution time |
| 8 | Date/timezone ambiguity | **Controlled With Conditions** | Non-blocking limitation if applied consistently, as with the original protocol's UMF-004 — but must still be recorded |
| 9 | Accidental reload | **Controlled With Conditions** | Part 3's explicit prohibition governs this, but ultimately depends on careful manual execution, not a technical enforcement this document can guarantee |
| 10 | Second submission | **Controlled With Conditions** | Same basis as #9 |
| 11 | Source availability assumed | **Controlled** | Explicitly prohibited, Part 5 |
| 12 | Comparability overestimated | **Controlled** | Part 4/6's strict requirements and the mandatory separate classification gate prevent this |
| 13 | The dynamic window treated as arbitrary | **Controlled** | Part 4 explains directly why it is structurally, not arbitrarily, determined |
| 14 | "No change" treated as "no problem" | **Controlled** | Explicitly prohibited, Part 6, consistent with the original protocol's OUT-02 discipline |
| 15 | Stage 2 starts automatically | **Controlled** | Explicitly and repeatedly prohibited |
| 16 | Historical 26% presented as current | **Controlled** | Explicitly prohibited throughout |
| 17 | Git worktree lineages mixed | **Controlled** | Entirely outside this gate's scope; nothing here authorizes any worktree/branch operation |

**No Blocking risk identified. Five items Controlled With Conditions (1, 2, 7, 8, 9/10), all reflecting genuine residual dependencies on either source behavior at execution time or careful manual conduct — none reflects a structural flaw in the proposed bounds themselves.**

---

## Part 9 — Gate Criteria (G-01–G-20)

| Criterion | Verdict | Reasoning |
|---|---|---|
| G-01 Authority | **PASS** | Full chain DD-032 through DD-037 independently verified |
| G-02 Bounded purpose | **PASS** | Preparation only; no execution occurs in this task |
| G-03 Attempt 1 history | **PASS** | Correctly and completely carried forward, unmodified |
| G-04 Method specificity | **PASS WITH CONDITIONS** | Interactive interface explicitly prescribed, API v5 explicitly excluded with justification; residual dependency on careful manual execution (Risk 9/10) keeps this short of an unconditional PASS |
| G-05 Attempt-count integrity | **PASS** | Exactly one new attempt, precisely defined starting point (Part 3) |
| G-06 Source identity | **PASS** | Origin/mobile/field/TTFB all explicitly required |
| G-07 Date/window integrity | **PASS WITH CONDITIONS** | The dynamic rule (Part 4) is methodologically sound but inherently carries more execution-time interpretation than a pre-fixed window would |
| G-08 Like-for-like comparability | **PASS** | All core requirements (length, device, metric, scope, non-overlap) preserved |
| G-09 Field/lab separation | **PASS** | Explicit requirement |
| G-10 Mobile/desktop separation | **PASS** | Explicit requirement |
| G-11 Origin/URL separation | **PASS** | Explicit requirement |
| G-12 No threshold invention | **PASS** | No numeric threshold introduced; classification deferred to a separate gate |
| G-13 Confounder discipline | **PASS** | The protocol's existing CF-001–012 register remains applicable, unmodified |
| G-14 Evidence discipline | **PASS** | Explicit output boundaries (Part 6), no automatic claims permitted |
| G-15 No mechanism promotion | **PASS** | Explicitly prohibited |
| G-16 No Stage 2 activation | **PASS** | Explicitly and repeatedly prohibited |
| G-17 No implementation authorization | **PASS** | Explicitly prohibited |
| G-18 Expiry | **PASS** | 2026-10-31, labeled operational choice, consistent with prior practice |
| G-19 Failure routing | **PASS** | Part 4's stop rule fully covers this (attempt used, no evidence, stop, no repeat) |
| G-20 Case-owner decision clarity | **PASS** | Three explicit, mutually exclusive options provided below |

**No FAIL. Sixteen PASS, two PASS WITH CONDITIONS (G-04, G-07) — both reflect genuine, disclosed residual dependencies, not defects in the proposed bounds.**

---

## Part 10 — Independent Challenge

| # | Attack | Verdict | Basis |
|---|---|---|---|
| 1 | Interactive PSI will certainly work | **Rejected** | No certainty is assertable; O-012 shows past success, not a guarantee |
| 2 | Interactive PSI is automatically better evidence | **Survives With Narrowing** | It has a demonstrably higher *success probability* for this origin, not necessarily higher *data quality* than the API would have provided had it worked — both would, in principle, expose the same underlying CrUX data |
| 3 | Any later 28-day window is comparable without limitation | **Rejected** | Part 4/8 — comparability always remains subject to the explicit requirements and confounder discipline, never assumed |
| 4 | A window starting after 21 July removes all confounders | **Rejected** | Non-overlap removes only the overlap confounder; the other eleven CF-register items remain independently Unknown |
| 5 | A lower poor share proves improvement | **Rejected** | Would be a mechanism conclusion; only a measurement classification is permitted, and only after a separate classification gate |
| 6 | The same poor share proves stability | **Rejected** | Same basis — "stability" as a conclusion exceeds what a measurement classification alone supports |
| 7 | A higher poor share proves deterioration | **Rejected** | Same basis |
| 8 | No field data means no problem | **Rejected** | Directly what Attempt 1's own discipline already rejected |
| 9 | A successful run justifies Stage 2 | **Rejected** | No Stage 1 outcome of any kind auto-triggers Stage 2 |
| 10 | A failed run justifies another attempt | **Rejected** | Any attempt beyond this one requires its own new, separate case-owner decision, exactly as after Attempt 1 |
| 11 | The prior API 429 proves the API always fails | **Survives With Narrowing** | Three consecutive failures on the identical route, plus Google's own documented unreliability without a key, is strong evidence against relying on that route again — but "always fails" as an absolute claim exceeds what the evidence supports |
| 12 | A browser refresh is not a second attempt | **Rejected** | Part 3's definition is explicit: every submitted analysis counts as the one attempt |
| 13 | The historical 26% is a target | **Rejected** | It is a historical comparator only; no target semantics have ever been introduced anywhere in this case |
| 14 | Core Web Vitals Passed replaces TTFB | **Rejected** | The two remain structurally separate throughout; TTFB was specifically the flagged exception in O-012 |
| 15 | The replacement attempt changes OD-002 | **Rejected** | Nothing in this preparation, or in any future execution, alters decisions/DD-032's Established Design directly |
| 16 | An expiry date is evidence-derived | **Rejected** | Explicitly labeled an operational choice, Part 5, consistent with prior practice |
| 17 | The reservation and visibility branches may be mixed | **Rejected** | Entirely outside this gate's scope; nothing here authorizes it |

**Fifteen Rejected outright; two Survives With Narrowing (2, 11), neither undermining the gate's own recommendations.**

---

## Part 11 — Gate Verdict and Recommendation

```
PASSED WITH CONDITIONS
```

### Recommendation

```
RECOMMEND AUTHORIZED WITH CONDITIONS FOR ONE INTERACTIVE PAGESPEED REPLACEMENT ATTEMPT
```

**No Case-Owner Decision is recorded by this gate.**

### Binding Conditions (if authorized)

1. The replacement attempt, if authorized, is limited to exactly one submission via the public, interactive PageSpeed Insights interface — the API v5 endpoint may not be used.
2. No API key, login, or authenticated access of any kind.
3. No automation, scripted retrieval, or command-line HTTP request.
4. The attempt begins at the moment an analysis for `https://konnichiwa.nl` is submitted — every submission counts as the one attempt, regardless of outcome; no automatic reload or resubmission.
5. A result is usable only if the source visibly displays an exact period, exactly 28 days, starting on or after 2026-07-22, with no overlap with the 24 June–21 July 2026 baseline, and confirmed origin-level/mobile/field/TTFB scope. If exact dates are not displayed, the attempt is used, no evidence is created, and execution stops without a second attempt.
6. Execution may not occur before Kelvin's explicit Case-Owner Decision on this gate.
7. Authorization expires 2026-10-31 if unused — an operational choice, not evidence-derived.
8. Any successful attempt records only the items in Part 6 — no causal, significance, materiality, or ranking/conversion/revenue/reservation claim; no automatic OUT-01–OUT-07 classification.
9. A separate, later Independent Classification Gate is mandatory before any result is classified or accepted.
10. No outcome, of any kind, automatically authorizes Stage 2 (IC-OD2-002) preparation or execution.
11. All conditions independently binding from decisions/DD-032 through DD-037 remain in force and are not narrowed by this gate.
12. `od_002_stage_1_replacement_attempt_authorized`, `od_002_stage_2_preparation_authorized`, `od_002_feasibility_execution_authorized`, `od_002_implementation_authorized`, `transformation_authorized`, and `external_changes_authorized` all remain `false`, unconditionally, regardless of Kelvin's eventual response to this gate.

```yaml
current_stage: Organizational Design
od_002_stage_1_replacement_gate: DD-038 — Passed With Conditions
od_002_stage_1_replacement_gate_recommendation: Recommend Authorized With Conditions For One Interactive PageSpeed Replacement Attempt
od_002_stage_1_replacement_attempt_decision: Pending
od_002_stage_1_replacement_attempt_authorized: false
od_002_stage_1_attempts_remaining: 0
od_002_stage_2_preparation_authorized: false
od_002_feasibility_execution_authorized: false
od_002_implementation_authorized: false
transformation_authorized: false
external_changes_authorized: false
```

---

## Requested Case-Owner Response

This gate recommends; it does not authorize. No response is inferred from general permission to "continue," from approval of any prior message, or from anything not naming one of the following explicitly.

```
AUTHORIZED WITH CONDITIONS FOR ONE INTERACTIVE PAGESPEED REPLACEMENT ATTEMPT

NOT AUTHORIZED FOR A REPLACEMENT ATTEMPT

REQUEST DD-038 REVISION
```

---

## Final Intended Change Scope

| File | Change | Reason |
|---|---|---|
| `decisions/DD-038-ic-od2-001-replacement-attempt-authorization-gate.md` | Created (this file) | The authorization gate itself |
| `current.md` | Updated | Records this gate's verdict, recommendation, and pending case-owner decision |
| `Traceability.md` | Updated | Same convention |

**Not modified:** decisions/DD-035, decisions/DD-036, decisions/DD-037 (all preserved exactly as gate-reviewed and case-owner-decided); transformation/IC-OD2-001-crux-mobile-ttfb-remeasurement-protocol.md; transformation/IC-OD2-001-crux-remeasurement-execution-attempt-1.md; transformation/OD-002-implementation-candidate-construction-workstream.md; transformation/README.md; observations/O-012.md. **Not created:** any evidence file; any `O-`/`EV-` record. No CrUX, PageSpeed Insights, or browser measurement of any kind was performed in the course of this review. No API call was made. No replacement attempt was authorized. No Stage 2 activity occurred. No commit was created. Nothing was pushed.

---

## Case-Owner Decision

*Pending.*

---

## Case-Owner Decision (recorded 19 August 2026)

**This section records Kelvin Wong's explicit response to the Requested Case-Owner Response above. It does not replace, edit, or overwrite the Precondition Check, Review Sources, Gate Question, Part 1 (Foundation Review), Part 2 (Replacement Justification), Part 3 (Mandatory Method Boundary), Part 4 (New Window Rule), Part 5 (Date and Expiry Governance), Part 6 (Output Boundaries), Part 7 (Alternatives), Part 8 (Risk Review), Part 9 (Gate Criteria), Part 10 (Independent Challenge), Part 11's Gate Verdict (PASSED WITH CONDITIONS) and Recommendation, the twelve Binding Conditions, the Requested Case-Owner Response, or the Final Intended Change Scope's historical "Pending" state that preceded this decision — all remain intact above, unmodified, as the historical record of this independent gate review.**

```yaml
decision: AUTHORIZED WITH CONDITIONS FOR ONE INTERACTIVE PAGESPEED REPLACEMENT ATTEMPT
authorized_by: Kelvin Wong
authorization_date: 2026-08-19
gate_reference: DD-038
```

Kelvin Wong, as case owner of EC-002 — Konnichiwa Organic Visibility Growth, issues:

> AUTHORIZED WITH CONDITIONS FOR ONE INTERACTIVE PAGESPEED REPLACEMENT ATTEMPT

### Authorized Scope

One bounded, public, read-only execution of a replacement CrUX/PageSpeed attempt for IC-OD2-001 is authorized, limited to retrieving and recording comparable origin-level mobile CrUX TTFB field data for `https://konnichiwa.nl`, via the interactive PageSpeed Insights interface only.

**This authorization does not include:** classification acceptance of any future result; Stage 2 activation; technical investigation; implementation; Transformation execution; external changes; a second replacement attempt beyond this one.

### Binding Conditions — Set A: DD-038 Gate Conditions (verbatim, from Part 11 above)

1. The replacement attempt, if authorized, is limited to exactly one submission via the public, interactive PageSpeed Insights interface — the API v5 endpoint may not be used.
2. No API key, login, or authenticated access of any kind.
3. No automation, scripted retrieval, or command-line HTTP request.
4. The attempt begins at the moment an analysis for `https://konnichiwa.nl` is submitted — every submission counts as the one attempt, regardless of outcome; no automatic reload or resubmission.
5. A result is usable only if the source visibly displays an exact period, exactly 28 days, starting on or after 2026-07-22, with no overlap with the 24 June–21 July 2026 baseline, and confirmed origin-level/mobile/field/TTFB scope. If exact dates are not displayed, the attempt is used, no evidence is created, and execution stops without a second attempt.
6. Execution may not occur before Kelvin's explicit Case-Owner Decision on this gate.
7. Authorization expires 2026-10-31 if unused — an operational choice, not evidence-derived.
8. Any successful attempt records only the items in Part 6 — no causal, significance, materiality, or ranking/conversion/revenue/reservation claim; no automatic OUT-01–OUT-07 classification.
9. A separate, later Independent Classification Gate is mandatory before any result is classified or accepted.
10. No outcome, of any kind, automatically authorizes Stage 2 (IC-OD2-002) preparation or execution.
11. All conditions independently binding from decisions/DD-032 through DD-037 remain in force and are not narrowed by this gate.
12. `od_002_stage_2_preparation_authorized`, `od_002_feasibility_execution_authorized`, `od_002_implementation_authorized`, `transformation_authorized`, and `external_changes_authorized` all remain `false`, unconditionally, regardless of Kelvin's eventual response to this gate.

**Note on Condition 12, preserved verbatim above without correction:** at the time Part 11 was written, `od_002_stage_1_replacement_attempt_authorized` was also listed among the flags remaining `false` "regardless of Kelvin's eventual response to this gate" — that statement governed the unconditional floor before any Case-Owner Decision existed. This Case-Owner Decision is exactly the later, separate, explicit act that condition anticipated as the only way to move it; `od_002_stage_1_replacement_attempt_authorized` moves to `true` below, consistent with, not contradicting, the original text. Every flag actually named in Condition 12 above (Stage 2, feasibility, implementation, Transformation, external changes) remains `false`, exactly as required.

### Binding Conditions — Set B: Case-Owner Execution Conditions (new to this Case-Owner Decision)

1. Execution is a manual, one-time, case-owner-approved action — not a recurring or scheduled process.
2. Only the public, interactive PageSpeed Insights interface may be used; the API v5 endpoint remains excluded per Set A Condition 1.
3. No credential, password, API key, token, cookie, or authenticated session of any kind.
4. Submitting the analysis for `https://konnichiwa.nl` is the one authorized attempt, regardless of what it returns; no second submission, no automatic reload.
5. The displayed window must be recorded exactly as shown — start date, end date, and confirmation of no overlap with 21 July 2026 — before any figure is read as comparable.
6. If the source does not display exact dates, or shows URL-level, desktop-only, or non-field (lab-only) data, the attempt stops there: recorded as used, no evidence created, no second attempt.
7. Displayed TTFB percentages are recorded exactly as shown, with no invented decimals and no silent rounding normalization.
8. Core Web Vitals, if shown, are recorded separately from the TTFB distribution and never substituted for it.
9. UMF and CF status fields inherited from the original protocol (transformation/IC-OD2-001-crux-mobile-ttfb-remeasurement-protocol.md) remain the governing register; missing confounder evidence remains Unknown.
10. No causal, significance, or materiality claim; no "problem resolved" or "improved/worsened/stable" formal classification — only a factual record of what was displayed.
11. No OUT-01–OUT-07 classification is applied by the execution itself — that is reserved for a later, separate Independent Classification Gate.
12. No outcome authorizes Stage 2 (IC-OD2-002), feasibility execution, implementation, Transformation, or external changes.
13. The historical 26% baseline (24 June–21 July 2026) and Attempt 1's own Blocked/Unresolvable/Consumed record remain unchanged, regardless of this replacement attempt's outcome.
14. All Set A conditions above, and all conditions independently binding from decisions/DD-032 through DD-037, remain in force.

Both condition sets — Set A (twelve, Part 11's own numbering) and Set B (fourteen, new to this Case-Owner Decision) — are kept **separately titled with their own provenance**, consistent with this case's established discipline.

### Effect on Lifecycle State

```yaml
current_stage: Organizational Design
od_002_stage_1_replacement_gate: DD-038 — Passed With Conditions
od_002_stage_1_replacement_attempt_decision: Approved With Conditions — One Public Interactive Read-Only Attempt
od_002_stage_1_replacement_attempt_authorized: true
od_002_stage_1_replacement_attempt_method: Interactive PageSpeed Insights Interface Only — API v5 Excluded
od_002_stage_1_replacement_attempt_not_before: 2026-08-19
od_002_stage_1_replacement_attempt_window_rule: Exact 28-day period, start on/after 2026-07-22, no overlap with 2026-07-21 baseline end
od_002_stage_1_replacement_attempt_expires: 2026-10-31
od_002_stage_1_replacement_attempt_limit: 1
od_002_stage_1_replacement_attempt_started: false
od_002_stage_1_replacement_attempt_completed: false
od_002_stage_1_replacement_evidence_created: false
od_002_stage_2_preparation_authorized: false
od_002_feasibility_execution_authorized: false
od_002_implementation_authorized: false
transformation_authorized: false
external_changes_authorized: false
```

`od_002_stage_1_replacement_attempt_authorized` moves from `false` to `true` — **one bounded, public, read-only, interactive-interface-only execution attempt is now authorized, strictly within the terms above.** `od_002_stage_1_replacement_attempt_started`, `_completed`, and `od_002_stage_1_replacement_evidence_created` all remain `false` — this decision does not itself execute the attempt. Attempt 1's own historical fields (`od_002_stage_1_blocker_gate`, `od_002_stage_1_blocker_outcome`, `od_002_stage_1_method_compliance`, `od_002_stage_1_attempt_consumption`, and the original `od_002_stage_1_execution_*` fields describing that attempt's terms) are **not edited** by this decision — they remain the unmodified historical record of Attempt 1, distinct from this new, separately-named replacement-attempt field set. `od_002_stage_2_preparation_authorized`, `od_002_feasibility_execution_authorized`, `od_002_implementation_authorized`, `transformation_authorized`, and `external_changes_authorized` all remain `false`, unconditionally.

### Next Action

Perform, in a separate task, at most one public, read-only, interactive-PageSpeed-Insights-only replacement attempt, subject to all Set A and Set B conditions above; **do not execute while recording this decision.**

### Final Confirmations (post-decision)

| Confirmation | Status |
|---|---|
| Decision recorded: AUTHORIZED WITH CONDITIONS FOR ONE INTERACTIVE PAGESPEED REPLACEMENT ATTEMPT | **Confirmed** |
| Authorized scope: one bounded, interactive-interface-only, read-only execution attempt | **Confirmed** |
| Prior Precondition Check, Parts 1–11, Gate Verdict, and Recommendation preserved unmodified above | **Confirmed** |
| All twelve Set A (DD-038 gate) conditions recorded verbatim | **Confirmed** |
| All fourteen Set B (case-owner execution) conditions recorded, separately provenanced | **Confirmed** |
| API v5 endpoint remains excluded | **Confirmed** |
| Attempt 1's historical record (Blocked, Unresolvable, Consumed) left unmodified | **Confirmed** |
| Stage 2, feasibility, implementation, Transformation, external changes all remain unauthorized | **Confirmed** |
| No PageSpeed/CrUX access occurred in the course of recording this decision | **Confirmed** |
| Nothing committed or pushed | **Confirmed** — no `git add`, `git commit`, or `git push` was run in the course of this task |
