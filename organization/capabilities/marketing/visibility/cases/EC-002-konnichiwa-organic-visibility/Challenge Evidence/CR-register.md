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
