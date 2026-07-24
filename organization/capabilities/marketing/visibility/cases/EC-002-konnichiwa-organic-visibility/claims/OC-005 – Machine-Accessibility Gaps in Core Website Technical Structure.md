### OC-005 – Machine-Accessibility Gaps in Core Website Technical Structure

Source Evidence

- EV-001 (HV-IV-001), EV-013 (HV-IV-007), EV-011 (omakase-pagina-brief.md)

Source Observations

- O-005, O-006, O-007

Related Work Objects

- WO-004 (Technical SEO Issue Register, candidate), WO-108 (legacy, Visibility Backlog)

Related Challenge Evidence

- None yet recorded specific to this claim

Claim Status

Justified Organizational Claim (promoted 24 July 2026, decisions/DD-010)

---

#### Organizational Claim

Three specific, confirmed technical conditions currently limit machine (search engine / AI system) accessibility of Konnichiwa's website content: (1) no structured data (schema.org) is present anywhere on the site; (2) both restaurant menus are hosted exclusively as non-crawlable Adobe InDesign viewer embeds, not as ordinary readable page content; (3) one live page (`/sushi-page-2/`) is a near-duplicate of the homepage with a broken, unresolved title-template variable.

#### Organizational Relevance

Machine accessibility is a precondition for search and AI systems to correctly represent Konnichiwa's offerings (per measurement/HV-MP-001.md's chain: Organizational Reality → External Representation → Search and AI Understanding). These three conditions are concrete, independently confirmed technical facts a design/intervention decision can act on later.

#### Scope

- Channel: konnichiwa.nl, site-wide markup and specific named pages
- Query/page: Homepage-wide (structured data), both menu pages (Teppan Yaki, Sushi & Izakaya), `/sushi-page-2/` specifically
- Geography: Not applicable — a technical/structural condition, not a search-result condition
- Device: Not applicable — the underlying HTML/markup condition is device-independent (though its downstream *effect* on discoverability could differ by device, untested here)
- Time period: Confirmed 22 July 2026 (HV-IV-001, HV-IV-007); not re-verified live since

#### Evidential Basis

EV-001 (HV-IV-001) directly confirmed no structured data is present via direct site inspection. EV-013 (HV-IV-007) directly confirmed, via sitemap retrieval and page-by-page checks, that both menus load through indd.adobe.com viewer embeds (JavaScript-loaded, returning empty content to a non-rendering fetch — the same category of failure independently observed when this case's own AI agent attempted to fetch the omakase-menu content while producing design/omakase-pagina-brief.md), and that `/sushi-page-2/` exists live with title "Sushi Page @ - Japanese restaurant Konnichiwa Utrecht" (an unresolved template variable) and content that duplicates the homepage rather than offering distinct value. EV-011 (omakase-pagina-brief.md) independently corroborates the menu-accessibility finding from a different angle: the design work for the omakase page needed to source pricing directly from the menu, and the same non-machine-readable format that blocked search engines also made that content difficult for a design/content workflow to retrieve.

#### Confidence

- Level: High for all three conditions individually
- Rationale: Each condition was confirmed by direct inspection (not inferred or assumed), and one (menu accessibility) was independently corroborated by a second, unrelated task encountering the same failure mode.

#### Limitations

- Not re-verified live at the time of this claim (last confirmed 22 July 2026) — a design/technical fix (design/structured-data-website.md) exists for the structured-data gap but is not yet implemented (HV-INT-001, Blocked), so the underlying condition is presumed unchanged, not re-checked.
- Formal Search Console indexation status (crawled/indexed/excluded) for the affected pages was not obtained — this claim is about markup/content-accessibility conditions, not about confirmed indexation outcomes.
- Rank Math SEO plugin is confirmed installed (EV-013) and may already partially address structured data via its own settings — this claim does not establish that the plugin's settings are unconfigured, only that no structured data currently renders on the site as inspected.

#### Alternative Interpretations

- The menu's InDesign-viewer format may be a deliberate design/branding choice (visual menu presentation) rather than an oversight — this claim does not characterize the choice as a mistake, only as having a specific, confirmed machine-accessibility consequence.
- `/sushi-page-2/`'s duplication could be an artifact of a page-builder or migration process rather than intentional content — not established either way; the claim describes the resulting condition, not its origin.

#### Causal Status

Descriptive. This claim does not assert that these three conditions caused any specific AI or search failure (e.g., it does not claim these conditions caused HV-IV-004's AI opening-hours errors, even though HV-IV-007's own text speculates a likely connection) — that connection remains a Diagnosis-stage question, not asserted as established fact here.

#### Falsification Tests

1. **Is this a single measurement misrepresented as a trend?** Not applicable — these are static structural conditions, not a time-series measurement; the claim does not assert stability or change over time, only presence as of the confirmation date.
2. **Is the claim broader than its measurement scope?** Narrowing applied: an earlier draft of this claim implied the menu format "explains" the AI-representation errors found elsewhere in this case (evidence/HV-IV-004.md) — that causal implication was removed; the claim now states the three conditions as confirmed facts only, with the AI-error connection left as an open, unclaimed hypothesis (already recorded separately as decisions/DD-005, hypothesis H-003).
3. **Could seasonality explain the condition?** Not applicable — structural/technical conditions, not seasonal search behavior.
4. **Could branded demand distort the interpretation?** Not applicable.
5. **Could device, location, or personalization affect the result?** Not for the underlying markup condition itself; a fetch-based check (as performed) is device-independent. Downstream *effects* on different devices/AI systems are not measured here.
6. **Is unavailable data being interpreted as poor performance?** No — these are confirmed-present conditions (missing structured data, non-crawlable menus, a duplicate page), not gaps in this case's own data collection.
7. **Does conflicting evidence exist?** None found — no source in this case contradicts the presence of these three conditions.
8. **Would a reasonable challenger accept the confidence level?** Yes, once the causal implication toward HV-IV-004's AI errors was removed (see test 2).

Outcome: **Survives with Narrowing** (causal language toward AI-representation errors removed from the claim itself; that connection remains a hypothesis in decisions/DD-005, not a claim here).

#### Boundaries

OC-005 establishes that three specific technical conditions exist. It does not establish:

- that any of these conditions caused a specific downstream failure (e.g., HV-IV-004's AI opening-hours/pricing errors) — that remains hypothesis H-003 in decisions/DD-005, not a demonstrated causal link;
- current live status (not re-verified since 22 July 2026);
- formal Search Console indexation consequences;
- that fixing these conditions would produce any specific measurable improvement — that is a Design-stage question.

#### Contradictory Evidence

None currently recorded.

#### Claim Conclusion

OC-005 is sufficiently supported by EV-001, EV-013, and EV-011 for use in subsequent Organizational Understanding, with the AI-representation causal connection explicitly excluded from the claim itself and left as a separately tracked hypothesis.

#### Challenge Status

Challenged — Survives with Narrowing.

#### Traceability

O-005, O-006, O-007 → EV-001, EV-013, EV-011 → OC-005
