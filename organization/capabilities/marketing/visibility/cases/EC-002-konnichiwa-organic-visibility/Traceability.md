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

## Lifecycle Traceability

Current stage: Case Establishment **Completed** (decisions/DD-008) → Observation and Evidence Collection **Completed**, baseline **Established** → Evidence Synthesis and Justified Organizational Claims **Completed** (decisions/DD-010, 24 July 2026, PASSED) — **this is the case's current authoritative stage.** Organizational Understanding was **attempted without valid prior authorization and reclassified Draft — Not Authoritative** (decisions/DD-012, 24 July 2026); it does not appear in the authoritative chain above pending explicit case-owner authorization (see Lifecycle Scope.md).

Completed: Case Identity, Purpose, Explicit Boundaries, Observed Conditions, Lifecycle Scope declared. Prior-round Observation and Evidence exist (HV-IV-001–007). New-round Observation complete: O-001, O-002, O-003, O-004, O-011, O-012 fully collected; O-005–O-010 informed with explicit limitations where evidence is partial. work-objects/WO-001-search-visibility-baseline.md formalizes this as the case's Active, **Established** baseline work object — see its Baseline Acceptance Criteria Assessment: all nine criteria met, earned incrementally (an initial premature `true` was corrected to `Provisional`/`false`, decisions/DD-008 §6, then two genuine gaps — O-012 tooling, O-003 geo-control — were closed in turn with real evidence, EV-017 and EV-018, before the verdict returned to `true`).

**Evidence Synthesis and Justified Organizational Claims (24 July 2026, decisions/DD-010, PASSED):** claims/ES-001-evidence-synthesis-review.md reviewed all 12 observations for integrity (Verdict: PASSED, one documentation-currency issue found and corrected — O-004.md's stale CR-005 wording). Seven candidate claims (OC-001–OC-007, claims/OC-register.md) were drafted directly from WO-001, each individually challenged via an 8-question falsification test set (repository-native pattern, matching `workspace /cases/EC-001…/claims/OC-001…md`'s Falsification Tests / Boundaries / Contradictory Evidence structure). All seven survived with narrowing and were promoted to Justified Organizational Claim status. None was rejected; none asserts unsupported causation (all Causal Status: Descriptive or Associative); the case's explicitly forbidden conclusions (stable ranking, "lost" reservations, GBP-decline cause, etc.) were checked against each claim and excluded.

**Organizational Understanding — attempted, reclassified (24 July 2026, decisions/DD-012, FAILED lifecycle compliance review):** `understanding/OU-001…md` (from OC-001, OC-003, OC-004) and `understanding/OU-002…md` (from OC-005, OC-006) were drafted and gated by decisions/DD-011 on the stated basis of Kelvin's message "registratie klopt, de rest kan starten." A lifecycle compliance review found that message confirmed an evidentiary fact (Guestplan no-shows), not a named lifecycle-stage transition, and that decisions/DD-010 explicitly left Organizational Understanding "not yet begun." No prior decision authorized the transition. Both records are preserved, unmodified, but marked Draft — Prematurely Produced, Not Authoritative; decisions/DD-011's PASSED WITH CONDITIONS verdict is suspended; `current_stage` reverted to Justified Organizational Claims. **Separately, and unaffected by this correction:** Kelvin authorized Path 1 of DD-011's "Two Paths Forward" — bounded, read-only evidence collection for OC-002 (a Justified Organizational Claim under DD-010, independent of the Understanding-stage question) — see measurement/HV-MP-002-oc-002-gbp-decline-evidence-plan.md. OC-007 is classified as a Measurement/Attribution Constraint (claims/OC-007…md), not a source of "lost reservations."

**OC-002 evidence collection, executed (24 July 2026, decisions/DD-013):** measurement/HV-MP-002…md's read-only plan was executed against existing evidence (EV-015, re-read at monthly granularity) and public Google documentation — 9 of 13 items completed, 4 (E-05, E-06, E-07, E-11) blocked pending Kelvin's direct GBP access. Result recorded in observations/O-013.md and claims/OC-002-competing-explanations-register.md (10 candidate explanations, none Plausible). OC-002's claim status is unchanged (still Justified, decisions/DD-010); one overstated clause ("did not recover at any point") was narrowed in a Reassessment section appended to claims/OC-002…md, preserving the original text. decisions/DD-013's verdict, PASSED WITH CONDITIONS, does not authorize, begin, or recommend beginning Organizational Understanding — it only recommends future eligibility once the four blocked items are resolved. This work does not reopen or resolve decisions/DD-012's compliance finding.

One Design realized as Transformation (HV-INT-002, live). One Design blocked before Transformation (HV-INT-001). Two additional Transformations prepared, not deployed (HV-INT-004, HV-INT-005). One infrastructure Transformation completed and validated (HV-INT-003, GA4).

Not yet established: Organizational Understanding (Draft only, not authoritative — decisions/DD-012); Organizational Diagnosis; Evaluation. This case's authoritative lifecycle position is Justified Organizational Claims (decisions/DD-010, PASSED), plus an independently authorized, not-yet-executed read-only evidence-collection task for OC-002.

No Organizational Design or Transformation beyond the five named interventions (HV-INT-001–005) is authorized. decisions/DD-009 tracks what access/approval each remaining gap requires. decisions/DD-008 §7 tracks resolution of all four original gate-review conditions, including the `business/Marketing/` ↔ `organization/capabilities/marketing/` relationship (resolved — the former is an empty placeholder, the latter is authoritative, see capability.md and business/Marketing/README.md).
