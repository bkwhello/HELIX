### OC-006 – Passing Core Web Vitals With an Isolated Mobile Latency Exception

Source Evidence

- EV-017 (Chrome UX Report field data, O-012.md)

Source Observations

- O-012

Related Work Objects

- WO-001 — Search Visibility Baseline

Related Challenge Evidence

- None yet recorded specific to this claim

Claim Status

Justified Organizational Claim (promoted 24 July 2026, decisions/DD-010)

---

#### Organizational Claim

Over the 28-day Chrome UX Report field-data window (24 June–21 July 2026), konnichiwa.nl passes Core Web Vitals thresholds on both mobile and desktop, with all of LCP, INP/interactivity, and CLS rated "Good." One related metric, Time to First Byte, is rated "poor" for 26% of mobile page loads in the same window.

#### Organizational Relevance

Site performance is a candidate contributor to both search ranking (Google's own stated use of Core Web Vitals as a ranking signal) and conversion friction (a slow site can lose visitors before they act). Establishing that the site passes on the primary vitals, with one specific exception, focuses any future performance-related design work narrowly rather than broadly.

#### Scope

- Channel: konnichiwa.nl, origin-level field data (not a specific page)
- Query/page: Not query-specific — Chrome UX Report field data aggregates real visits to the site
- Geography: Not geographically broken out in the obtained report
- Device: Mobile and desktop separately reported; INP and TTFB not available for desktop in the obtained data
- Time period: 28-day rolling window, 24 June–21 July 2026 (report generated 24 July 2026, 06:19:15)

#### Evidential Basis

EV-017 is Google's own Chrome UX Report (CrUX) field data — aggregated real-user measurements, not a synthetic single-run test — obtained via a completed PageSpeed Insights report URL supplied by Kelvin after two automated collection attempts (API, fresh async analysis) failed for tooling reasons unrelated to the website itself. The report shows LCP 2.4s/77% good (mobile), 2.3s/80% good (desktop); INP 135ms/87% good (mobile only); CLS 0/97% good (mobile), 0/98% good (desktop) — all within Google's own "Good" thresholds, yielding an overall "Passed" Core Web Vitals assessment on both device categories. The same report shows TTFB at 1.8s, explicitly marked experimental, with 26% of mobile page loads rated poor — the one metric in the entire report that does not receive a clean "Good" rating.

#### Confidence

- Level: High for the field metrics as reported
- Rationale: CrUX field data reflects actual visitor experience over a rolling window, which this case's own evidence hierarchy treats as stronger than a single synthetic lab run. The two prior failed collection attempts are preserved in O-012.md and do not weaken this figure — they simply document that this data required a specific access route (a completed, shareable report link) to obtain.

#### Limitations

- Lighthouse lab scores (Performance/Accessibility/Best-Practices/SEO, 0–100) were never obtained — the lab-test portion of the PageSpeed Insights report loads separately from the field-data portion and was not present in either fetch (mobile or desktop variant of the same underlying report). This claim is about field data only.
- TTFB is explicitly marked "experimental" by Google itself in the source report — its threshold classification carries inherently lower certainty than LCP/INP/CLS.
- The cause of the 26% poor TTFB figure (server response time, hosting, caching, or something else) was not investigated.
- Field data is an aggregate over the 28-day window and real visitor mix — it does not isolate performance for any specific page (e.g., the reservation flow specifically) or for the newly-launched omakase/teppanyaki pages, which are too new to have accumulated meaningful CrUX data of their own.

#### Alternative Interpretations

- A 26%-poor TTFB rate could reflect a small number of geographically distant visitors (higher latency inherent to distance) rather than a server-side problem — not distinguished in the available data.
- "Passed" Core Web Vitals does not mean the site has no room for improvement — it means the site clears Google's minimum thresholds for the primary vitals; this claim does not assert the site is optimally fast, only that it passes.

#### Causal Status

Descriptive. This claim does not assert that TTFB (or its absence of assertion, that Core Web Vitals passing) has caused or prevented any specific conversion or ranking outcome.

#### Falsification Tests

1. **Is this a single measurement misrepresented as a trend?** No — 28-day rolling aggregate field data, explicitly not a single synthetic run; the claim's own wording states the window.
2. **Is the claim broader than its measurement scope?** Narrowing applied: an earlier draft implied "the website requires no further performance work" — removed. The claim now states only that Core Web Vitals pass, with TTFB as an explicit, named exception, and does not extend to a general "no work needed" conclusion (which is explicitly in this task's Forbidden Conclusions list).
3. **Could seasonality explain the condition?** Not applicable — a technical performance measurement, not a seasonal search-behavior pattern.
4. **Could branded demand distort the interpretation?** Not applicable.
5. **Could device, location, or personalization affect the result?** Yes, and this is already reflected: mobile and desktop are reported separately, and desktop lacks INP/TTFB data entirely (noted as a limitation, not silently omitted).
6. **Is unavailable data being interpreted as poor performance?** This is the key risk for this claim, and it is directly addressed: the two failed automated PSI attempts before the successful fetch are documented as tooling failures in O-012.md, not represented anywhere in this claim as evidence of poor site performance. The eventual field data — not the failed attempts — is the sole evidential basis here.
7. **Does conflicting evidence exist?** None found.
8. **Would a reasonable challenger accept the confidence level?** Yes, once the "no performance work needed" overreach was removed (test 2) and the field-vs-lab distinction was made explicit (already present in Limitations).

Outcome: **Survives with Narrowing** ("no further work needed" language removed; field-data-only framing made explicit and load-bearing).

#### Boundaries

OC-006 establishes the specific Core Web Vitals field-data result for the stated 28-day window. It does not establish:

- that the website requires no performance work (explicitly forbidden — TTFB is a named, unresolved exception);
- Lighthouse lab scores (not obtained);
- the cause of the TTFB issue;
- performance for any specific page, including the newly-launched omakase/teppanyaki pages;
- that passing Core Web Vitals has produced or will produce any specific ranking or conversion effect.

#### Contradictory Evidence

None currently recorded.

#### Claim Conclusion

OC-006 is sufficiently supported by EV-017 for use in subsequent Organizational Understanding, with the TTFB exception and the field-data/lab-score distinction preserved as load-bearing parts of the claim, not footnotes.

#### Challenge Status

Challenged — Survives with Narrowing.

#### Traceability

O-012 → EV-017 → OC-006
