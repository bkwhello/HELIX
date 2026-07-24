### OC-002 – Sustained Multi-Metric Decline in Google Business Profile Engagement

Source Evidence

- EV-015 (Google Business Profile performance screenshots, O-002.md)

Source Observations

- O-002

Related Work Objects

- WO-001 — Search Visibility Baseline

Related Challenge Evidence

- None yet recorded specific to this claim prior to this review

Claim Status

Justified Organizational Claim (promoted 24 July 2026, decisions/DD-010)

---

#### Organizational Claim

Across the six months of Google Business Profile performance data available (February 2026 through July 2026), every measured engagement metric — profile interactions, website clicks, route requests, phone calls, menu views, and appointment-type actions — declined continuously and did not recover at any point within the window. This period predates EC-002's establishment (23 July 2026) and predates HV-INT-002's go-live (22 July 2026) in its entirety.

#### Organizational Relevance

This is the single largest, longest-running signal found anywhere in this case's evidence base — larger in scale and duration than any Search Console or local-pack finding. If Konnichiwa's Marketing Visibility Capability is to prioritize where to invest, a six-month, all-metric decline that predates any intervention is direct evidence that something in the discovery-to-action chain (Organizational Reality → External Representation → Search/AI Understanding → Discovery → Customer Action, per measurement/HV-MP-001.md §1) has been degrading independently of anything this case has done.

#### Scope

- Channel: Google Business Profile only (not Search Console, not GA4, not Guestplan)
- Query/page: All GBP-tracked engagement types combined (see Organizational Claim); no single query or page
- Geography: Not separately broken out — GBP's own aggregate for the property
- Device: 85% of discovery is mobile (Maps + Search combined), per O-002's views breakdown — engagement decline is not separately broken out by device, only discovery-source share is
- Time period: February 2026 – July 2026 (6 monthly points; July likely a partial month, screenshots taken 23 July 2026)

#### Evidential Basis

EV-015 (nine screenshots covering the GBP "Interacties"/"Prestaties" dashboard) shows, for each of six tracked metrics, a monotonically declining monthly figure from February to July: total interactions ~2,000/month → ~700/month; website clicks ~1,500 → ~400; routes ~350 → ~200; calls ~110 → ~35; menu views ~100 → ~15; appointments ~55 → ~25. Each metric's own trend line, as shown in its individual chart, moves in one direction across all six points — this is not a single low month bracketed by higher ones, which would be more consistent with a one-off event.

#### Confidence

- Level: High for the existence and direction of the trend; Medium for the precision of individual monthly figures
- Rationale: The screenshots are direct platform data, not estimated. Precision is capped because exact date boundaries per month are not labeled beyond the month name, and the July point is explicitly likely partial (screenshots taken mid-month-equivalent, 23 July), which could mechanically exaggerate the apparent July decline for that one point specifically — though six consecutive declining points cannot be explained by a partial-month artifact alone, since that artifact would only affect the final point.

#### Limitations

- No cause has been tested or assumed — this claim is strictly descriptive of the pattern's existence and shape, not its origin.
- Not independently exportable/verifiable beyond the screenshots (no CSV/API access was available in Kelvin's interface).
- GBP profile *completeness* (which fields/categories/attributes are filled in) was not captured — only performance metrics. A completeness gap could be a contributing factor but was not measured.
- Review volume/rating from within GBP itself (distinct from the external HV-IV-001.md check) was not captured.

#### Alternative Interpretations

- Seasonality: plausible in principle, but a simple single-season explanation does not fit a Feb→Jul monotonic decline for a restaurant (which would more typically show a spring/summer uptick, not a decline, in most hospitality seasonality patterns) — not confirmed either way, flagged as an untested candidate explanation, not adopted.
- A GBP-side algorithmic, category, or attribute change: plausible, untested.
- Declining review velocity or competitor GBP investment: plausible, untested (O-009's review data does not include recency, so cannot confirm or rule this out).
- Partial-month artifact in the final data point only: addressed under Confidence — cannot explain the full six-month shape by itself.
- A genuine drop in underlying local demand: plausible, untested — would require Guestplan year-over-year data (not available, per O-011's limitations) to assess.

None of these is adopted, ruled out, or ranked here — that is explicitly Diagnosis work, out of scope for this claim.

#### Causal Status

Descriptive. No candidate explanation is asserted as the cause.

#### Falsification Tests

1. **Is this a single measurement misrepresented as a trend?** Rejected as a defect — six independent monthly points, each part of the source chart, all move the same direction. This is the opposite failure mode (a genuine multi-point trend, not a single point) from what this test guards against.
2. **Is the claim broader than its measurement scope?** Checked — the claim is scoped explicitly to GBP-tracked metrics only; it does not claim anything about Search Console, GA4, or overall business performance.
3. **Could seasonality explain the condition?** Addressed under Alternative Interpretations — flagged as untested, not accepted or rejected.
4. **Could branded demand distort the interpretation?** Not directly applicable — GBP engagement metrics (clicks, calls, routes) are actions on an already-discovered profile, not search-query-level branded/non-branded classification. Noted as a limitation of this test's applicability rather than skipped.
5. **Could device, location, or personalization affect the result?** GBP's own aggregate reporting is not personalized per viewer in the way a live search session is — this risk applies less here than to O-003. The device-mix context (85% mobile) is noted as context, not as a distorting factor in the trend itself.
6. **Is unavailable data being interpreted as poor performance?** No — all six metrics have real, present monthly data throughout the window; nothing is treated as zero or missing.
7. **Does conflicting evidence exist?** None found — no other evidence source in this case measures GBP engagement over this period; O-001's Search Console data covers a different, shorter, and non-overlapping-in-source window.
8. **Would a reasonable challenger accept the confidence level?** Yes, given the explicit precision caveat added under Confidence.

Outcome: **Survives with Narrowing** (precision caveat on the July partial-month point made explicit; explicit statement that no cause is tested added to prevent the "no candidate explanation tested" line from later being read as ruling causes out rather than simply not yet testing them).

#### Boundaries

OC-002 establishes that a sustained, multi-metric GBP engagement decline exists and predates this case. It does not establish:

- the cause of the decline (explicitly forbidden at this lifecycle stage — this is a Diagnosis question);
- that the decline continues past July 2026;
- that the decline reflects an actual drop in real-world customer interest (as opposed to a GBP-side measurement or algorithmic change);
- any connection to Search Console or Guestplan figures, which cover different, non-identical periods and channels;
- that any specific fix would reverse it.

#### Contradictory Evidence

None currently recorded.

#### Claim Conclusion

OC-002 is sufficiently supported by EV-015 for use in subsequent Organizational Understanding, with the explicit caveat that its cause remains untested and must not be inferred from this claim alone. This is flagged as the highest-priority input for that later Diagnosis work, precisely because no explanation yet exists for a finding this large.

#### Challenge Status

Challenged — Survives with Narrowing.

#### Reassessment, 24 July 2026 (observations/O-013.md, decisions/DD-013)

Executed per the authorized OC-002 evidence-collection plan (measurement/HV-MP-002…md, Path 1). This section is an addition; the Organizational Claim, Evidential Basis, and other sections above are preserved unmodified as the claim's original history.

**Claim status:** Remains a Justified Organizational Claim (decisions/DD-010) — not replaced, not rejected.

**Evidence added:** O-013 (chart-position re-reading of EV-015 at monthly granularity, previously only approximated; E-12 public-documentation check of GBP metric definitions; E-13 cross-source comparison against Search Console, GA4, and Guestplan); claims/OC-002-competing-explanations-register.md (10 candidate explanations assessed, none reaching Plausible).

**Scope change:** None — Scope section above remains accurate (GBP-only, all engagement types, aggregate geography/device, Feb–Jul 2026).

**Confidence change:** Existence and overall six-month direction of the decline: unchanged, still High. Precision of the shape between individual months: **increased** from Medium (single approximate table) to Medium-High (independently charted monthly points, internally consistent with each chart's own stated total).

**Wording requiring narrowing:** The Organizational Claim's phrase "declined continuously and did not recover at any point within the window" is **not fully supported** by the more precise reading in O-013. All six metrics show a brief flat-to-slightly-positive segment (most visible in Menucontent bekeken, which rises from an estimated ~55 in April to ~88 in May, close to its March level) before the decline resumes and steepens in June–July. The overall six-month shape (high in February, lowest in July) is unaffected. **Corrected characterization:** the decline is sustained and large in aggregate across the full window, with a brief pause or partial recovery around April–May in most metrics, rather than a strictly monotonic decline with no recovery at any point.

**Challenge required:** Yes — this narrowing is itself a new falsification-relevant finding (it partially falsifies the "no recovery at any point" clause) and is recorded here rather than silently smoothed over, consistent with this case's standing practice.

**Reason:** HV-MP-002's evidence-collection plan required examining the source screenshots at finer granularity than O-002's original pass. The finer reading surfaced a real pattern the original approximate reading could not resolve. This does not weaken the claim's core finding (a large, sustained, six-month, six-metric decline exists and predates this case) — it corrects one overstated clause within it.

**Sufficiency for Organizational Understanding:** Not yet — see decisions/DD-013 (Evidence Sufficiency Gate). Ten candidate explanations were assessed (claims/OC-002-competing-explanations-register.md); none currently rises above "Weakly Supported," and the categories most likely to explain the decline (profile-change history, review trend, photo/post activity, operational context) remain uncollected pending Kelvin's direct GBP access.

#### Traceability

O-002 → EV-015 → OC-002 → (24 July 2026 reassessment) → O-013 → EV-019 → decisions/DD-013
