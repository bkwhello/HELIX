# OU-004 — Technical Foundation Duality
---

## Status

Candidate Organizational Understanding

## Authorization

decisions/DD-014 — AUTHORIZED WITH CONDITIONS (case-owner decision, Kelvin Wong, 24 July 2026)

## Constituent Relationships

- UR-002 — Technical Foundation Duality (Survives)

## Constituent Claims

- OC-005 — Machine-Accessibility Gaps in Core Website Technical Structure
- OC-006 — Passing Core Web Vitals With an Isolated Mobile Latency Exception

## Understanding Statement

Konnichiwa's website performs well for real visitors — Core Web Vitals pass on both mobile and desktop, with one isolated exception (server response time poor for roughly a quarter of mobile page loads) — while independently exhibiting three specific, confirmed conditions that limit what search engines and AI systems can read from the site (no structured data anywhere on the site; both menus hosted in a non-crawlable format; one duplicate page with a broken title). Neither claim's evidence establishes any interaction between these two conditions.

## Organizational Significance

This Understanding rules out "the site is generally deficient" as a framing for any future work — the site is fast. What remains is specifically a machine-*legibility* gap, not a performance gap. This distinction matters directly for scoping: a performance-optimization intervention would address a different problem than a content/markup-accessibility intervention, and this Understanding keeps them separated rather than treating "technical SEO" as one undifferentiated category.

## What Is Established

- Core Web Vitals (LCP, INP, CLS) pass on both mobile and desktop within the 28-day CrUX field-data window (OC-006).
- Server response time (TTFB) is poor for approximately 26% of mobile page loads — an isolated exception within otherwise-passing metrics (OC-006).
- No structured data (schema.org) exists anywhere on the site (OC-005).
- Both the sushi and teppanyaki menus are hosted in a format search engines and AI systems cannot read (OC-005).
- One live duplicate page exists with a broken title (OC-005).
- These conditions were confirmed as of 22–24 July 2026.

## What Is Not Established

- The cause of the TTFB exception (server, hosting, or caching).
- Whether OC-005's three conditions caused, contributed to, or explain the AI-representation errors found in evidence/HV-IV-004.md — this remains decisions/DD-005 hypothesis H-003, an open Diagnosis-stage question not advanced by this Understanding.
- Whether fixing any of OC-005's three conditions would produce a measurable visibility or conversion improvement.
- Lighthouse lab scores (unobtained, O-012's own limitation).
- Any business-outcome consequence — constrained by UR-003, see Constraints below.

## Standalone Conditions

None among this Understanding's own constituent claims — both (OC-005, OC-006) are integrated via UR-002.

## Constraints

- **UR-003 — Attribution Constraint on Business-Outcome Evaluation** applies: neither OC-005 nor OC-006 can currently be connected to a measured reservation or business outcome, per OC-007's tracking gaps.
- OC-005's conditions have not been re-verified since 22 July 2026 — this Understanding inherits that staleness and should not be treated as a live, continuously-monitored state.

## Open Challenges

- None in Challenge Evidence/CR-register.md directly targets OC-005 or OC-006.

## Diagnosis Questions Enabled

- What is causing TTFB to be poor for roughly a quarter of mobile page loads?
- Do OC-005's machine-accessibility gaps have any measurable relationship to the AI-representation errors found elsewhere in this case (DD-005, H-003)?
- Would closing any of OC-005's three gaps produce a measurable change in search or AI-system representation?

## Traceability

O-005, O-006, O-007, O-012 → EV-001, EV-011, EV-013, EV-017 → OC-005, OC-006 → UR-002 → OU-004

---

## Understanding Challenge (Phase 7)

*Independent whole-Understanding challenge, 24 July 2026.*

- **Coherence:** the Understanding Statement combines two claims about the same website (performance and machine-legibility) without asserting an interaction — coherent.
- **Completeness within declared scope:** complete for OC-005 and OC-006; explicitly excludes DD-005's H-003 hypothesis as unresolved, which is correct.
- **Dependence on rejected relationships:** none — depends only on UR-002 (Survives).
- **Hidden causal language:** none found — "What Is Not Established" explicitly excludes the AI-error causal connection.
- **Contamination from OU-001/OU-002:** see decisions/DD-015's Phase 5 comparison — independently derived from OC-005/OC-006 and UR-002.
- **Improper use of Partial evidence:** none.
- **Treatment of standalone claims:** correctly silent.
- **Respect for OC-007's constraint status:** correctly applied via UR-003.
- **Value beyond a list of claims:** yes — the "not one undifferentiated category" framing is genuine synthesis useful for future Design-stage scoping.
- **Legitimate diagnosis questions without diagnosing:** three questions listed, none answered.

**Outcome: Survives.** No narrowing required.
