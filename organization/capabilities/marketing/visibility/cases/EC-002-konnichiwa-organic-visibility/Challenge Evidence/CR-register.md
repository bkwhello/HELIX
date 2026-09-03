# Challenge Evidence Register
---

Per AD-014: Challenge Evidence preserves supporting, contradictory, uncertain, unexplained, and failure evidence. A record may change classification as new evidence emerges, but its earlier state must not be silently overwritten. Do not delete a rejected challenge.

## Challenge Record Format (from case-establishment source §19)

```markdown
## CR-###

- Target artifact or claim:
- Challenger:
- Date:
- Challenge:
- Evidence:
- Consequence if valid:
- Response:
- Resolution:
- Status:
```

Create one entry whenever: a top-three claim is made; causality is inferred from correlation; a ranking measurement lacks location context; an intervention is selected without diagnosis; a metric improves but reservations do not; a positive result may be caused by seasonality/brand searches/an event; evidence conflicts.

---

## CR-001

- Target artifact or claim: EC-002-CL-009 / Purpose.md business outcome (top-three search themes)
- Challenger: case-establishment source, §3
- Date: 23 July 2026
- Challenge: Is a top-three position a realistic, evidence-grounded target, or an assumed one? The source itself states "A top-three position is a target condition, not a fact, promise or guaranteed outcome."
- Evidence: evidence/HV-IV-003.md shows Konnichiwa already leads for teppanyaki, is mid-pack for sushi, and is weak for omakase — three very different starting positions bundled under one target.
- Consequence if valid: TC-010 may need per-theme differentiation rather than one blanket target.
- Response: not yet given.
- Resolution: open.
- Status: **Open.**

## CR-002

- Target artifact or claim: Overall case hypothesis (Purpose.md, EC-002-CL-009)
- Challenger: original case file §33 (preserved as a live methodological challenge, not as case-scope history)
- Date raised: 22 July 2026; carried forward 23 July 2026
- Challenge: Is this case engineering visibility as an organizational capability, or is it renamed SEO activity with HELIX vocabulary layered on top?
- Evidence: measurement/HV-MP-001.md's seven-layer model and evidence-before-claim discipline (observations/, evidence/) go beyond typical SEO reporting; but no Organizational Understanding or Diagnosis has been produced yet — the case has not yet demonstrated the distinguishing step.
- Consequence if valid: the case would need to be reclassified or its lifecycle discipline tightened.
- Response: not yet given — case is still at Observation/Evidence stage, too early to resolve.
- Resolution: open.
- Status: **Open.**

## CR-003

- Target artifact or claim: HV-TS-001.md, AI Factual Accuracy Score (25/100)
- Challenger: evidence/HV-TS-001.md itself (self-flagged limitation)
- Date: 22 July 2026
- Challenge: Can a score computed from 1 of 30 planned test scenarios be used as a general baseline for "AI Understanding," or does it overstate confidence?
- Evidence: HV-MP-001 §9 requires 30 scenarios and 3 runs per critical prompt; round 0 used 1 scenario, 1 run per system.
- Consequence if valid: any comparison at day 7/28/56/90 must stay scoped to the same single opening-hours scenario until the full 30-scenario set is built.
- Response: HV-TS-001.md and HV-MP-001.md both explicitly label the score as scoped to one scenario.
- Resolution: **Accepted as a standing constraint**, not fully resolved — the scope limitation is documented and must be re-stated at every future measurement round.
- Status: **Open, mitigated.**

## CR-004

- Target artifact or claim: transformation/HV-IR-001.md, HV-INT-002 verdict
- Challenger: HV-MP-P-006 (No False Attribution)
- Date: 22 July 2026
- Challenge: HV-INT-002 went live the same day competitive and seasonal conditions were last checked (HV-IV-006) — any future positive result must rule out the possibility that Amsterdam omakase competitors, seasonal Utrecht events, or unrelated review activity explain the change, not the new page.
- Evidence: evidence/HV-IV-006.md confirms no direct Utrecht omakase competitor existed at baseline — reduces but does not eliminate confounding risk.
- Consequence if valid: day-7 (29 July 2026) validation must explicitly check for confounding factors before assigning a verdict.
- Response: not yet given — validation has not occurred yet.
- Resolution: open.
- Status: **Open.**

## CR-005

- Target artifact or claim: design/HV-VCM-001.md priority classification of "Omakase Utrecht" as a weak/priority-2 gap; measurement/HV-BL-001.md's use of HV-IV-003 as the omakase baseline reference point
- Challenger: observations/O-001.md / O-004.md, Search Console export (EV-014, 23 July 2026)
- Date: 23 July 2026
- Challenge: evidence/HV-IV-003.md (informal search-tool check, 22 July 2026) classified "omakase Utrecht" as weak, Amsterdam-dominated. Real Search Console data for the same query shows an average position of 4.7 over the last ~90 days — comparable to "teppanyaki Utrecht" (4.47), which HV-IV-003 called strong. The two evidence sources materially disagree on the same query.
- Evidence: observations/O-001.md (Search Console, 29 impressions... 388 impressions, 29 clicks, position 4.7) vs. evidence/HV-IV-003.md (single-session automated search tool, no location control).
- Consequence if valid: HV-VCM-001's "priority 2" ranking for omakase, and the choice of "omakase Utrecht" as HV-INT-002's baseline reference metric, may be based on the weaker of two conflicting signals. The actual gap may be narrower than assumed, or the two metrics may be measuring different things (Search Console position reflects Konnichiwa's own historical ranking trend; the search-tool check reflects a single simulated search result page composition, which is more sensitive to competitor presence and personalization).
- Response (24 July 2026): a fresh, documented measurement was run (observations/O-003.md, method defined and logged). Result: Konnichiwa appears at position 3 of 5 organic results for "omakase Utrecht," behind an Amsterdam-focused omakase roundup — the top result is explicitly Amsterdam-oriented. This leans toward corroborating HV-IV-003's original "weak, Amsterdam-dominated" read rather than Search Console's "position 4.7."
- Plausible reconciling explanation (not confirmed): Search Console's "average position 4.7" is computed only over the impressions Konnichiwa's own pages actually received for queries containing "omakase" — it does not measure how often Konnichiwa is absent entirely from a searcher's results while Amsterdam competitors appear instead. The two metrics may describe different things (Konnichiwa's rank *when visible* vs. Konnichiwa's *overall prominence including absence*) rather than one being simply wrong. This explanation is plausible and consistent with both data points, but has not been independently verified against Search Console's own documentation or a controlled test, so it is not treated as settled.
- Second response (24 July 2026): Kelvin performed the genuinely Utrecht-located manual check this challenge had been waiting for — mobile, Chrome Incognito, logged out, Google-confirmed Utrecht region, query "omakase utrecht," 06:41 Europe/Amsterdam. Result: Konnichiwa at **position 2 of 3** in the Google local pack (Kong Izakaya #1, Konnichiwa #2, Japanese Don Dining KOUNOSUKE #3). Recorded as EV-018, observations/O-003.md.
- Resolution: **Resolved for Initial Baseline.** The genuinely location-controlled measurement shows Konnichiwa holding a strong, credible position (#2 local pack) for "omakase Utrecht" from within Utrecht itself — this corroborates Search Console's optimistic reading (position 4.7) over the earlier informal, non-location-controlled search-tool checks (evidence/HV-IV-003.md and the 24 July WebSearch check), both of which lacked Utrecht geographic control and likely understated Konnichiwa's real local prominence for this reason. The originally proposed reconciling explanation (Search Console measures rank-when-visible, not overall prominence including absence) remains plausible but is now secondary — the direct, controlled observation is the stronger evidence. **Preserved limitation:** this is one measurement point, one device, one time, one Utrecht region-context — it does not establish stability over time, coverage across all of Utrecht, or organic (non-local-pack) ranking, which remains O-004's domain. A multi-point Utrecht rank grid remains a future measurement-maturity improvement.
- Status: **Resolved for Initial Baseline.** Not claimed as fully and permanently closed — see observations/O-003.md's explicit "not inferred" list (no claim of city-wide or time-stable ranking).

## CR-006

- Target artifact or claim: Konnichiwa's Google review count — cited as "605" in observations/O-009.md, evidence/HV-IV-001.md, measurement/HV-BL-001.md, measurement/HV-DB-001.md, and claims/ES-001-evidence-synthesis-review.md.
- Challenger: observations/O-003.md's 24 July 2026 addendum (Owner Declaration, review count visible during the EV-018 local-pack observation).
- Date: 24 July 2026.
- Challenge: evidence/HV-IV-001.md (22 July 2026, general Google search results) states 4.1 stars / **605** reviews. observations/O-003.md's addendum (24 July 2026, Owner Declaration, same screen as EV-018's local-pack observation) states 4.1 stars / **625** reviews. Both are now supported by a recorded source and date; they are not the same figure.
- Evidence: evidence/HV-IV-001.md (605, 22 July 2026, general search-results surface) vs. observations/O-003.md addendum (625, 24 July 2026, Google local-pack surface, Owner Declaration not independently viewed by Claude).
- Consequence if valid: any future reference to Konnichiwa's "current" review count must cite a specific value with its date and source rather than treating either figure as simply "the" current count. Neither figure is definitively wrong — both are supported at their own recorded date.
- **No explanation for the 20-review difference is inferred.** Plausible, unconfirmed possibilities include genuine review growth over the 2-day gap, a difference between the general-search-results surface and the local-pack surface, or normal display-caching variation — none of these is adopted, ranked, or ruled out here.
- Status: **Open — both values preserved, not reconciled.** Any artifact citing a review count must state which figure and which date it uses.

## CR-007

- Target artifact or claim: Konnichiwa's TheFork review count — publicly exposed review-count figures differ between TheFork surfaces (exact surfaces/values not yet individually captured with source/date pairs).
- Challenger: weekly review W34 (measurement/2026-W34-visibility-brief.md, 21 August 2026).
- Date: 21 August 2026.
- Challenge: TheFork's 9.1/10 rating is a usable, single observed figure, but the review count shown differs depending on which TheFork surface is checked (e.g. restaurant profile page vs. search/listing surface) — mirroring, on a different platform, the same pattern already open in CR-006 for Google (605 vs. 625).
- Evidence: no individually source-and-date-tagged screenshot pair exists yet for each conflicting TheFork surface — this is registered as a **measurement-method problem** (which surface, which date, which figure) per the source's own note, not as evidence that any one specific count is wrong.
- Consequence if valid: TheFork review-count growth cannot currently be attributed week over week; any artifact citing a TheFork review count must state which surface and date it used, exactly as CR-006 already requires for Google.
- **No specific count is treated as correct or incorrect here.** This is a data-quality/measurement-method issue, not a claim about which figure is accurate.
- Resolution: open — requires a source-and-date-tagged capture of each TheFork surface's review-count display before reconciliation can even be attempted.
- Status: **Open — review-count method conflict, not reconciled. Rating (9.1/10) is not affected and remains a usable single observation.**

## CR-008

- Target artifact or claim: whether the production Complianz plugin installation provides/configures native Google Consent Mode v2 integration — diagnosis/HV-CSD-001-consent-architecture-divergence.md.
- Challenger: Case Owner Decision, EC-002 Consent Architecture Investigation, 22 August 2026.
- Date: 22 August 2026.
- Challenge: Complianz's public documentation (observations/O-015.md, EV-031) states its Google Consent Mode v2 integration is automatic and requires "no further set-up needed," yet live browser evidence (EV-030) shows no such update ever reaches Google Consent Mode when Complianz's own Accept button is used. This is a direct discrepancy between documented default behavior and observed site behavior.
- Evidence: EV-030 (browser-executed, `google_tag_data.ics.entries` showing `update: undefined` after Complianz Accept), EV-031 (Complianz readme.txt, public documentation, confirms free edition only — no Premium plugin found).
- Consequence if valid: the architecture decision between Option A (Complianz as sole authority) and Option C (explicit bridge) cannot be made until this is resolved — see diagnosis/HV-CSD-001…md, Architecture Recommendation.
- **No specific setting is assumed to be the cause.** This is registered as an open configuration question, not a defect diagnosis of Complianz itself.
- Resolution: **Partially resolved, 22 August 2026 (EV-032, EV-033).** Kelvin supplied a read-only screenshot of Complianz's Wizard → Consent → Statistics screen. Directly confirmed: (1) Complianz is configured to add Google Tag Manager itself ("Add Google Tag Manager: Yes", container GTM-WXH5P6SN — the same container the theme's own code already loads); (2) "Google Consent Mode V2" is set to **No** and the control is shown marked **"Upgrade"** in the UI; (3) nothing was changed or saved. A follow-up public-documentation check (EV-031 addendum) found Complianz's own readme.txt lists "Google Consent Mode" explicitly under `== Premium Features ==`, corroborating the Upgrade badge. Separately, a live re-fetch (EV-033) confirmed GTM is genuinely double-loaded on the production page — once by the theme's own code, once by Complianz's auto-injected "Statistics script" — independent of the consent-bridge question.
- **What is now proven:** Consent Mode V2 is disabled on this site; it is gated behind a paid upgrade in the currently-installed free edition; GTM loads twice.
- **What remains unknown:** whether purchasing/enabling Complianz Premium would, in practice, actually close the consent-propagation gap (not tested — no upgrade was performed); the exact currently-active Complianz version number (readme.txt only confirms the latest documented stable tag, not necessarily what is running); whether Complianz's "functional" category-tagging on its GTM script means that load is genuinely unconditional (inferred from common convention, not authenticated-confirmed).
- Status: **Partially resolved — Consent Mode V2 disabled/Premium-gated is confirmed; the cost/benefit and practical-fix question remains open, pending an architecture decision (see diagnosis/HV-CSD-001-consent-architecture-divergence.md).**
- **Update, 26 August 2026 (observations/O-017.md, EV-036–EV-042; diagnosis/HV-CSD-001-consent-architecture-divergence.md, CLOSED):** the practical-fix question is now resolved. The architecture decision was made — Option C (an explicit `propagateConsent()` bridge translating Complianz's own consent state to `gtag('consent','update',...)`), not Option A (Complianz Premium) — precisely because it required no purchase or cost/benefit tradeoff, only a repository-only code addition. That bridge was implemented, found initially non-functional (a `window`- vs `document`-level event-listener defect, EV-037), corrected, and validated end-to-end in production across all required consent states plus GA4 measurement behaviour (EV-038, EV-039, EV-041). The fix is committed and pushed to the theme repository (`origin/main` = `c9f6a5681ca7885e7ca12b1fb3a2a2ce49bc2745`, EV-042). The Complianz-Premium cost/benefit comparison itself was never made and remains moot — Option C's no-cost path closed the gap without it. **Status: Resolved — Google Consent Mode propagation confirmed working end-to-end via the validated Option C bridge; no Premium purchase decision required or pending.**

## CR-009

- Target artifact or claim: observations/O-021.md — GTM Default Workspace state after Version 8 publication (`reservation_widget_open` tracking).
- Challenger: Case Owner-directed post-publish workspace investigation, 28 August 2026.
- Date: 28 August 2026.
- Challenge: after GTM Version 8 was published and independently production-verified (O-021, Test 5 — clean non-Preview GA4 Realtime receipt), the GTM Default Workspace continued to report `changeCount: 4 / conflictCount: 0`. Taken at face value, this indicator suggests the workspace still diverges from the published container. Does it represent four genuine unpublished configuration differences, or a stale/unsynchronized GTM UI indicator?
- Evidence: two manual, read-only GTM Admin → Export Container exports (28 August 2026) — Export 1, Published Version 8 (`containerVersionId: 8`; 7 tags / 6 triggers / 5 built-in variables); Export 2, current Default Workspace (`containerVersionId: 0`; 7 tags / 6 triggers / 5 built-in variables). Object-by-object comparison of all tags/triggers/built-in variables, with explicit inspection of the four `reservation_widget_open`-related objects (`Listener - Guestplan widget open` — tag ID 16; `Reservation widget open` — trigger ID 14; `GA4 - Event - reservation_widget_open` — tag ID 17; `Window Loaded - All Pages` — trigger ID 15): identical counts, identical IDs, matching fingerprints, matching firing/consent configuration for all four, and for the remaining published objects. No additional tag or trigger exists in the workspace beyond Version 8's set; no Version 8 object is missing from the workspace. The container-version-level export fingerprint differs between the two exports, but this alone is not treated as object-level divergence evidence.
- Consequence if valid (genuine divergence): would call into question whether Version 8's published configuration is what is genuinely running, potentially reopening `reservation_widget_open`'s Production Verified status.
- Response: object-by-object comparison performed on both exports; no substantive tag/trigger/variable-level configuration difference found.
- Resolution: **Partially resolved — no substantive configuration divergence found (Classification B: workspace reports a residual/stale change-state, but exported configuration matches Published Version 8).** The internal GTM cause of the residual `changeCount: 4 / conflictCount: 0` indicator is **not established** and is not guessed at here. No corrective action (sync/revert/republish) is evidenced as necessary or authorized on this evidence.
- Status: **Open (residual indicator's internal cause unexplained) — `reservation_widget_open` Production Verified status (O-021, Test 5) is not reopened or weakened by this finding.**
