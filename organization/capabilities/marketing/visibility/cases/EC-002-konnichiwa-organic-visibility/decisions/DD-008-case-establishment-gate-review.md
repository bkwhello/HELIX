# DD-008 — EC-002 Case Establishment Gate Review
---

Date: 24 July 2026. Reviewer: Claude, on request of Kelvin Wong (case owner). Basis: EM-001, AD-014, and the mandatory semantic invariants each defines.

## Verdict

**PASSED WITH CONDITIONS.**

All AD-014 mandatory semantic invariants are present and internally consistent. No element is missing to the point of invalidating the case. Four conditions are attached — none blocks continued Observation/Evidence work, but all four should be closed before the case is treated as ready for Organizational Understanding.

## 1. AD-014 mandatory invariants — completeness check

| Invariant | Present? | File | Note |
|---|---|---|---|
| Case Identity | Yes | Case Identity.md | Complete: ID, name, org, owner, engineering authority/method/form, lead, date, window, cadence |
| Purpose / Engineering Question | Yes | Purpose.md | Engineering Question stated explicitly, business outcome and target themes defined |
| Explicit Boundaries | Yes | Explicit Boundaries.md | In/out scope, organizational/temporal/engineering scope, related-case boundary with EC-001 all present |
| Observed Conditions | Yes | Observed Conditions.md | Engineer familiarity, independence limits, evidence-accessibility mix, prior-evidence note all present |
| Lifecycle Scope | Yes | Lifecycle Scope.md | EM-001's 7 stages + case-specific Evaluation stage; stages-completed table; termination/continuation conditions |
| Engineering Records | Yes | observations/, evidence/, claims/, understanding/, diagnosis/, design/, transformation/ | Present and populated proportionally to actual lifecycle stage (diagnosis/ correctly empty — no diagnosis has been earned yet) |
| Challenge Evidence | Yes | Challenge Evidence/CR-register.md | 5 entries (CR-001–CR-005), each with target, challenger, evidence, consequence, resolution, status — format matches AD-014 |
| Traceability | Yes | Traceability.md | Migration manifest, observation→evidence table, defect→transformation chains, lifecycle traceability |
| Status and Termination | Yes | current.md, Lifecycle Scope.md | Current status explicit; no termination reached; termination/continuation conditions defined |

No mandatory invariant is missing.

## 2. Five migrated HV artifacts — preservation check

| Artifact | Original ID preserved | History preserved | Epistemic status labeled | Traceability | Relationship to EC-002 |
|---|---|---|---|---|---|
| HV-BL-001 (measurement/) | Yes | Yes — status narrative kept end-to-end (TE LEVEREN → compleet) | Yes — evidence, per-section sourced | Cross-referenced in Traceability.md, O-001/O-002/O-011 | Correctly nested under measurement/ |
| HV-DB-001 (measurement/) | Yes | Yes — v1–v4 version history intact | Partially — dashboard content is self-described as "not auto-synced," and has **not been regenerated since 22–23 July**; it does not yet reflect the 24 July Guestplan baseline, HV-INT-003, or HV-INT-004/005 | Cross-referenced | Correctly nested |
| HV-IR-001 (transformation/) | Yes | Yes — HV-INT-001/002 original plus HV-INT-003/004/005 appended | Yes — each intervention carries an explicit verdict (Blocked / Live–Awaiting Validation / Provisionally Earned / Prepared–Not Deployed) | Cross-referenced throughout | Correctly nested |
| HV-TS-001 (evidence/) | Yes | Yes — unchanged | Yes — labeled round-0 baseline, explicit scope limitation | Cross-referenced | Correctly nested |
| HV-AR-001 (work-objects/) | Yes | Yes — unchanged | Yes — explicitly "not yet active" | Cross-referenced | Correctly nested |

**Condition 1:** HV-DB-001 (dashboard) should be regenerated before it is used as a status source — it currently understates progress (does not reflect the Guestplan baseline, GA4 fix, or the two prepared website fixes). Not a gate failure; it is a presentation artifact, not a record of truth — the underlying records (HV-BL-001, HV-IR-001, current.md) are accurate and current.

## 3. Marketing/Visibility capability ownership

`capability.md` exists one level up, references EC-002 as its owning case, and already discloses an unresolved architectural item: this capability folder and the pre-existing `business/Marketing/` domain are two separate, uncross-referenced representations of "Marketing" in the repository.

**Condition 2 (carried forward, not new):** this duplication remains open. It does not block Observation/Evidence work but should be resolved (or formally accepted as permanent) before the capability is considered structurally settled.

## 4. Other findings

**Condition 3:** WO-001 ("Search Visibility Baseline") exists only as a one-line "Candidate" entry in `work-objects/WO-active-register.md`, not as the structured, per-observation artifact AD-014/CA-001-style proportional engineering would expect for a work object this central. This is the explicit subject of Phase 3 of this task and is resolved within this same response (see `work-objects/WO-001-search-visibility-baseline.md`).

**Condition 4:** O-012 (mobile performance/reservation friction) has no data at all — not blocked by missing access, simply not yet run (a PageSpeed Insights check is read-only and could be performed immediately). Flagged as the one observation with no legitimate excuse for remaining uncollected.

**Not a defect, noted for context:** CR-005 (Search Console vs. informal search-tool disagreement on "omakase Utrecht") and the unexplained 6-month Google Business Profile decline (O-002) remain open. Both are correctly classified as unresolved evidence, not prematurely diagnosed — consistent with EM-001 EP-005 (Diagnosis follows Understanding, which follows Justified Claims). Leaving them open is the *correct* state for a case still in Observation/Evidence Collection, not a case-establishment defect.

## 5. Conclusion

The case establishment is structurally sound. Nothing here justifies FAILED. The four conditions are tracked as follow-up work, not as reasons to halt Phase 2's state transition.

## 6. Correction, 24 July 2026 — `baseline_established` was set prematurely

The first version of this gate review's Phase 2 output set `baseline_established: true`, reasoning that measurement/HV-BL-001.md's four sections held real data. That reasoning conflated *data collection completeness* with *baseline acceptance*. It was corrected the same day, before any commit, on direct challenge: `baseline_state` is `Provisional`, `baseline_established` is `false`. See current.md's Formal State block and work-objects/WO-001-search-visibility-baseline.md's Baseline Acceptance Criteria Assessment for the full, criterion-by-criterion basis.

## 7. Condition Resolution (24 July 2026)

| Condition | Original finding | Resolution |
|---|---|---|
| 1 — HV-DB-001 stale | Dashboard file did not reflect Guestplan/GA4/website-fix status | **Regenerated as v5** (measurement/HV-DB-001.md) — per-source Measured/Pending/Unavailable/Not Configured matrix with last-measured dates. The *published, live* dashboard page itself has not been republished — flagged as a separate follow-up, not silently implied as done. |
| 2 — business/Marketing duplication | Two uncross-referenced representations of Marketing | **Resolved.** `business/Marketing/` inspected and found to be an empty structural placeholder (0-byte identity file and department files) — not a populated competing authority. `organization/capabilities/marketing/` confirmed authoritative for capability engineering. Pointer added at `business/Marketing/README.md`; `capability.md`'s relationship section rewritten to reflect this. No ownership duplicated. |
| 3 — WO-001 not formalized | Existed only as a one-line register entry | **Resolved** — work-objects/WO-001-search-visibility-baseline.md created with full per-observation structure and an explicit Baseline Acceptance Criteria Assessment. |
| 4 — O-012 no legitimate blocker | Assumed executable immediately, read-only | **Attempted twice, genuinely blocked by tooling** (HTTP 429 without an API key; async web tool unreadable via static fetch) — a real discovery, not an excuse. **Then resolved**, same day: Kelvin supplied a completed PSI report URL directly, which fetched successfully and yielded real Chrome UX Report field data (EV-017) — Core Web Vitals Passed on mobile and desktop. See observations/O-012.md. |

Additionally, O-003 was first given a documented (though explicitly limited, no geo-control) measurement method and a first data point, and CR-005 was updated with that evidence — status moved from "Open" to "Open, substantially clarified," not closed, per the explicit instruction not to treat one non-location-controlled search as a full resolution.

**Then, later the same day, O-003 was fully resolved:** Kelvin performed the genuinely Utrecht-located manual check this had been waiting for — mobile, Chrome Incognito, logged out, Google-confirmed Utrecht region, "omakase utrecht," 24 July 2026 06:41. Result: Konnichiwa at local-pack position 2 of 3 (EV-018, observations/O-003.md). This satisfies O-003's original requirement for an initial baseline observation and resolves CR-005 — status "Resolved for Initial Baseline" (Challenge Evidence/CR-register.md).

## 8. Final Net Effect on the Baseline Verdict (24 July 2026, closing entry)

With both O-012 and O-003 resolved, **all nine baseline acceptance criteria in work-objects/WO-001-search-visibility-baseline.md are now met.** `baseline_state: Established`, `baseline_established: true` — see current.md's Formal State block. This verdict was earned through the full corrective sequence recorded in this document: a premature `true`, honestly corrected to `Provisional`/`false`, with two genuine gaps (O-012 tooling, O-003 geo-control) documented rather than papered over, each closed in turn with real evidence (EV-017, EV-018) before the verdict changed again. No data was fabricated at any point in this sequence.
