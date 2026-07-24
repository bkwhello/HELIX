# UR-002 — Technical Foundation Duality
---

*Constructed by Role A (Understanding Constructor), 24 July 2026, under decisions/DD-014's authorization. Challenged by Role B (Relationship Challenger) in the section below.*

## Status

Candidate

## Relationship Type

**Contrast**

## Related Claims

- OC-005 — Machine-Accessibility Gaps in Core Website Technical Structure
- OC-006 — Passing Core Web Vitals With an Isolated Mobile Latency Exception

## Relationship Statement

Konnichiwa's website performs well for real visitors (OC-006: Core Web Vitals pass on mobile and desktop, one isolated exception — TTFB poor for 26% of mobile loads) while independently exhibiting three specific, confirmed conditions that limit what search engines and AI systems can read from the site (OC-005: absent structured data, non-crawlable menu format for both menus, one duplicate page). Neither claim's evidence tests or establishes an interaction between these two conditions.

## Organizational Meaning

Considered together, these claims rule out "the site is generally deficient" as a framing — the site is fast and its Core Web Vitals pass. What remains, specifically, is a machine-*legibility* problem, not a performance problem. This distinction is organizationally useful: it means any future Design-stage response to OC-005's gaps should be scoped as a content/markup intervention, not a performance intervention, and any future investigation of OC-006's TTFB exception should not assume it relates to OC-005's structural gaps.

## Supporting Evidence

- EV-001, EV-011, EV-013 (OC-005: HV-IV-001, HV-IV-007, omakase-pagina-brief.md)
- EV-017 (OC-006: Chrome UX Report field data)

## Scope

- Channel: konnichiwa.nl, the website itself (not GBP, not Search Console)
- Query/page: OC-005's three conditions are site-wide/structural; OC-006's CWV data is aggregate across the site, not per-page
- Geography: not applicable — website-level technical conditions
- Device: OC-006 reports mobile and desktop separately (both pass, TTFB exception mobile-only); OC-005's conditions are not device-differentiated
- Period: OC-005's conditions confirmed as of 22 July 2026 (not re-verified since); OC-006's CrUX data is a 28-day rolling window ending approximately 24 July 2026

## Confidence

- Level: High for both constituent facts (structural conditions are directly confirmed; CWV data is real platform field data); Low for treating the *pairing* as more than coexistence
- Rationale: this is the strongest-evidenced relationship candidate in this reconstruction, since both claims are High confidence individually and neither depends on any Partial evidence group

## Limitations

- OC-005's conditions have not been re-verified since 22 July 2026 — this relationship inherits that staleness.
- OC-006's TTFB cause is not investigated by either claim — this relationship does not add any explanation for it.
- Lighthouse lab scores remain unobtained (O-012's own limitation) — this relationship, like OC-006, covers only field data.
- No evidence tests whether fixing OC-005's gaps would affect OC-006's metrics, or vice versa.

## Excluded Interpretation

- That OC-005's machine-accessibility gaps caused, contributed to, or explain the AI-representation errors found in evidence/HV-IV-004.md — that connection remains decisions/DD-005 hypothesis H-003, an open Diagnosis-stage question not advanced by this relationship.
- That OC-006's TTFB exception is caused by, or related to, any of OC-005's three conditions.
- That "technical SEO" is one undifferentiated category — this relationship explicitly keeps performance and machine-legibility as two distinguishable dimensions.

## Open Challenges

- None directly targets OC-005 or OC-006 in Challenge Evidence/CR-register.md.

## Diagnosis Boundary

This relationship does not establish the cause of the TTFB exception, does not establish whether OC-005's conditions caused any specific AI or search failure, and does not establish that any specific fix would produce a measurable visibility or conversion improvement. All three are explicitly out of scope, listed as open Diagnosis-stage questions.

## Traceability

O-005, O-006, O-007, O-012 → EV-001, EV-011, EV-013, EV-017 → OC-005, OC-006 → UR-002 → Candidate Understanding

---

## Challenge (Role B — Relationship Challenger)

*Independent challenge, 24 July 2026.*

1. **Are both claims independently justified?** Yes — OC-005 and OC-006 are both Justified Organizational Claims, each independently challenged and surviving with narrowing prior to this relationship.
2. **Does evidence support the relationship or only the individual claims?** The relationship's only asserted connection is contrast/coexistence — both facts are true of the same website at overlapping times. No evidence is invoked beyond what each claim already independently establishes.
3. **Is the relationship broader than its evidence?** No — the Relationship Statement is a direct restatement of both claims' own content, combined, without extension.
4. **Is co-occurrence being represented as dependency?** No — "Organizational Meaning" explicitly instructs the opposite ("should not assume it relates").
5. **Is contrast being represented as explanation?** No.
6. **Is a current-state screenshot being used as historical evidence?** Not applicable — neither claim depends on E-05/E-06/E-07.
7. **Is Partial evidence being treated as complete?** Not applicable.
8. **Does CR-006 contaminate the relationship?** No — unrelated evidence domain.
9. **Is OC-007 represented as an operational failure rather than a measurement constraint?** Not applicable — OC-007 is not part of this relationship.
10. **Does the wording imply a cause?** No — the Excluded Interpretation section is explicit and the Relationship Statement itself uses "independently exhibiting," not "causing" or "resulting in."
11. **Could the relationship survive if OC-002 remains standalone?** Yes, trivially — OC-002 is not a constituent.
12. **Does the relationship add organizational meaning beyond repeating claims?** Yes — the specific value-add is the "technical SEO is not one category" framing, which is a synthesis point neither claim states alone, and is directly useful for scoping any future Design-stage work.

**Outcome: Survives.** No narrowing required — the candidate wording as constructed already satisfies all twelve tests without modification.
