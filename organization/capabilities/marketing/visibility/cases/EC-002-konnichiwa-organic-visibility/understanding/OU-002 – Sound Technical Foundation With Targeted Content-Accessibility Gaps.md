> **STATUS: Draft — Prematurely Produced. Not Authoritative.** This record was constructed without a prior decision authorizing entry into the Organizational Understanding stage — see decisions/DD-012 (Lifecycle Compliance Review), 24 July 2026. It is preserved unmodified below for reference and possible future promotion, but is not part of the case's current authoritative lifecycle state and must not be cited as an established Organizational Understanding until DD-012's remediation conditions are met.

## Organizational Understanding

### OU-002 – Sound Technical Foundation With Targeted Content-Accessibility Gaps

Source Organizational Claims

- OC-005 – Machine-Accessibility Gaps in Core Website Technical Structure
- OC-006 – Passing Core Web Vitals With an Isolated Mobile Latency Exception

Supporting Evidence

- EV-001, EV-013 (HV-IV-001, HV-IV-007)
- EV-011 (omakase-pagina-brief.md)
- EV-017 (Chrome UX Report field data)

Related Work Objects

- WO-004 (Technical SEO Issue Register, candidate)

Related Challenge Evidence

- None specific to this understanding

Understanding Status

Established within observed case conditions.

----

#### Organizational Understanding

Konnichiwa's website is technically fast for real visitors — Core Web Vitals pass on both mobile and desktop, with one specific, isolated exception (server response time, TTFB, poor for roughly a quarter of mobile page loads) — but this general technical soundness coexists with a small number of specific, confirmed content-accessibility gaps that are unrelated to page speed: the absence of structured data, both menus being hosted in a format search engines and AI systems cannot read, and one live duplicate page with a broken title. The site's foundation is not broadly deficient; it has particular, nameable weak points.

#### Organizational Model

```text
konnichiwa.nl
        ↓
Two independent technical dimensions:

Dimension 1: Page-load performance (OC-006)
        ↓
Core Web Vitals field data (28-day CrUX window)
        ↓
LCP / INP / CLS: all "Good" → Passed, mobile and desktop
        ↓
Exception: TTFB "poor" for 26% of mobile loads
        ↓
Cause not investigated

Dimension 2: Content machine-accessibility (OC-005)
        ↓
Three specific, confirmed conditions:
  - no structured data (schema.org) anywhere on the site
  - both menus hosted as non-crawlable Adobe InDesign embeds
  - one duplicate page (/sushi-page-2/) with a broken title
        ↓
A prepared fix exists for one (structured data) — HV-INT-001, Blocked
        ↓
No fix yet designed for the other two

These two dimensions do not explain each other:
fast page loads do not imply accessible content,
and accessible content would not by itself fix TTFB.
```

#### Synthesis of Organizational Claims

OC-006 establishes that the site's general performance, as experienced by real visitors, is good — this rules out "the site is generally slow" as an explanation for any visibility or conversion shortfall found elsewhere in this case, with the one specific, preserved exception of mobile TTFB.

OC-005 establishes that three specific structural conditions limit what search engines and AI systems can read from the site, independent of how fast the site loads. These conditions are candidates (not established causes — see Boundaries) for some of the AI-representation errors found earlier in this case (evidence/HV-IV-004.md's opening-hours/pricing failures), a connection OC-005 explicitly declines to assert as demonstrated.

Together, these two claims describe a website whose technical foundation is not the primary constraint on visibility — it is fast — but whose content is not fully legible to the systems this case cares about (search engines, AI answer engines), for three specific, fixable reasons. This distinction matters for any future Design work: a performance-optimization intervention would address a different problem than a content-accessibility intervention, and this understanding keeps them separated rather than treating "technical SEO" as one undifferentiated category.

#### Understanding Boundaries

OU-002 establishes the shape of Konnichiwa's technical foundation as two distinguishable dimensions. It does not establish:

- that any of the three OC-005 conditions caused the AI-representation errors found in evidence/HV-IV-004.md — that remains hypothesis H-003 in decisions/DD-005, an open Diagnosis-stage question, not demonstrated here;
- the cause of the TTFB issue (server, hosting, caching, or otherwise) — not investigated;
- that fixing any of these conditions would produce a specific, measurable visibility or conversion improvement — that is Design-stage work, not yet begun;
- Lighthouse lab scores, which remain unobtained (O-012's own stated limitation);
- current live status of the three OC-005 conditions, which were last confirmed 22 July 2026 and not re-verified since.

#### Challenge Evidence Relationship

No Challenge Evidence record currently applies directly to this understanding. Both source claims (OC-005, OC-006) already survived their own individual falsification testing with narrowing applied — specifically, both had draft versions that overstated causal or completeness claims (OC-005 toward AI-error causation; OC-006 toward "no further work needed"), and both were corrected before promotion. This understanding inherits those corrections rather than reintroducing the overreach at the synthesis level.

#### Contradictory Evidence

None currently recorded.

#### Understanding Conclusion

OU-002 is sufficiently supported by OC-005 and OC-006, with evidential support from EV-001, EV-011, EV-013, and EV-017, for use in subsequent Organizational Diagnosis within the observed conditions of EC-002. The understanding explains the current shape of the website's technical foundation without establishing cause, required intervention, or connection to the case's other, unintegrated findings (OC-002, OC-007).
