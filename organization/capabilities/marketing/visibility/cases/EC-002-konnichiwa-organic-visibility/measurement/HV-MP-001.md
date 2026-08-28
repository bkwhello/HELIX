> Migrated unchanged from `solutions/visibility/HV-MP-001 – HELIX Visibility Measurement Plan.md`. Artifact ID preserved. This is the case's primary, authoritative measurement framework — the 30-day-window metrics in `30-day-baseline-metrics.md` are a tactical subset scoped to the current execution window, not a replacement for this plan.

# HV-MP-001 – HELIX Visibility Measurement Plan

## Status

Proposed

## Case

EC-002 — Konnichiwa Organic Visibility Growth

## Purpose

Defines how EC-002 collects, preserves, compares, and interprets data to determine whether HELIX Visibility produces measurable improvement for Konnichiwa: baseline state, interventions performed, measurable post-implementation change, causal connection, customer/business outcome, stability over time, and method effectiveness.

---

# 1. Measurement Objective

> Determine whether HELIX Visibility causes Konnichiwa to become more accurately represented, more easily discovered, better understood, more frequently recommended, and more often selected for approved customer intents.

```text
Organizational Reality → External Representation → Search and AI Understanding → Discovery → Customer Action → Reservation or Business Outcome
```

A visibility action is successful only when it produces a verified improvement somewhere in this chain.

---

# 2. Measurement Principles

**HV-MP-P-001 – Baseline Before Intervention.** No major implementation may begin before the relevant baseline has been recorded.

**HV-MP-P-002 – Intent-Specific Measurement.** Visibility must be measured for defined customer intents; general scores may support but not replace intent-level evidence.

**HV-MP-P-003 – Action Traceability.** Every material change must connect to: a visibility defect, an approved target intent, an expected result, a measurement method, a validation date, an implementation record.

**HV-MP-P-004 – Separate Leading and Business Indicators.** Leading indicators (indexed coverage, query positions, AI accuracy, impressions) are not automatically business outcomes (reservations, calls, direction requests, bookings).

**HV-MP-P-005 – Small Enterprise Proportionality.** Automated collection, limited useful indicators, clear decision rules, monthly owner-level reporting, minimal manual administration.

**HV-MP-P-006 – No False Attribution.** Do not claim an intervention caused a result when other plausible causes (seasonality, holidays, weather, events, advertising, social activity, menu/price changes, review spikes, competitor closures, Google/AI-system changes) have not been considered. Where causation cannot be proven, describe the result as an observed association.

---

# 3. Measurement Layers (summary)

1. **Reality Accuracy** — correct validated facts / total validated facts. Target: 100% critical, ≥95% non-critical.
2. **Representation Coverage** — required facts represented / total required facts across website, GBP, Maps, Bing, Apple Maps, Guestplan, TheFork, Tripadvisor, directories, social. Target: 100% critical, ≥90% strategic.
3. **Cross-Source Consistency** — weighted score (2/1/0 points per fact) across name, address, phone, hours, reservation method, cuisine, services, pricing, teppanyaki/omakase/lunch/takeaway availability. Target: 100% critical, ≥95% overall.
4. **Search Visibility** — impressions, clicks, average position, CTR, branded vs. non-branded, GBP actions, indexed pages, rich-result eligibility. Target query groups: Brand / Core commercial / Occasion / Experience.
5. **AI Understanding** — identity accuracy, factual accuracy, positioning accuracy, capability recognition, recommendation presence/prominence, evidence quality, conversion readiness. Systems: ChatGPT, Gemini, Perplexity, Google AI results.
6. **Customer Action** — reservation clicks, Guestplan opens, completed reservations, phone clicks, direction requests, contact-form submissions, menu views, gift-card/workshop/private-dining/catering enquiries.
7. **Business Outcome** — reservations attributed to organic/GBP/AI, first-time guests, average party size, high-value reservations, teppanyaki bookings, private dining, workshops, gift-card revenue.

---

# 4. HELIX Visibility Scorecard

| Indicator | Weight |
|---|---:|
| Reality and Representation Integrity | 20% |
| Cross-Source Consistency | 15% |
| Search Visibility | 20% |
| AI Understanding | 20% |
| Customer Action | 15% |
| Business Outcome | 10% |

The score is a management indicator; it must never replace the underlying evidence.

---

# 5–8. Baseline, Data Sources, Tracking, Attribution

See `HV-BL-001.md` (baseline register), `HV-AR-001.md` under work-objects/ (attribution register — not yet active).

Required tracking events: `reservation_click`, `reservation_widget_open`, `phone_click`, `email_click`, `directions_click`, `menu_view`, `giftcard_click`, `workshop_click`, `private_dining_enquiry`, `catering_enquiry`, `lunch_enquiry`, `omakase_enquiry`, `takeaway_click`, `delivery_click`, `reservation_complete` (where Guestplan permits).

**Implementation status (22 juli 2026):** most `data-track` attributes in place, pending GA4 connection in GTM (`GTM-WXH5P6SN`). Three gaps: no `directions_click` target exists (no Maps link on site); no `private_dining_enquiry` target exists (no CTA on the Private Dining card); catering form (`page-catering.php`) has no `action`/handler — submissions are lost. See `observations/O-011.md`.

**Superseded by production verification dated 2026-08-21 (see observations/O-014.md, EV-025–EV-028).** All three gaps listed above were no longer present in production as of that date — the statement above remains historically accurate for 22 July 2026 and is not rewritten. No client-side or GTM-side mechanism confirming any of the six customer-action events actually reaches GA4 was found as of the same date; see O-014.md for the full finding, including an unresolved consent-architecture risk (Measurement Integrity Risk: HIGH) that applies across all customer-action measurement.

---

# 9. AI Visibility Test Protocol

Initial test set target: 30 scenarios (5 identity, 10 commercial, 5 occasion, 5 experience, 5 informational). Round 0 executed: 1 scenario (opening hours), see `evidence/HV-TS-001.md`.

Repetition: 3 runs per critical prompt, 1 run per lower-priority prompt (round 0 used 1 run — deliberately light first pass).

## AI Factual Accuracy Score

Each run classified as Fully correct (100 pts) / Partially correct (50 pts) / Incorrect (0 pts). Score = mean across valid runs, always reported with underlying state counts, always scoped to which scenarios were actually run (HV-MP-P-006).

---

# 10–13. Search Test Protocol, Intervention Record, Measurement Windows, Success Thresholds

Search visibility measured primarily via Search Console/GBP (O-001, O-002), not manual checks alone (manual checks vary by location/device/personalization/time).

Intervention Record required fields: ID, date approved/implemented, related defect/intent/claim/page, baseline metric, expected change, measurement window, owner, implementation evidence, external influences, result, confidence, verdict. See `transformation/HV-IR-001.md`.

Measurement windows: 1–7 days (immediate validation), ~28 days (early result), ~56 days (development result), ~90 days (outcome result).

## Intervention-level verdicts

**Earned** — expected improvement occurred, evidence sufficient, no major negative effect.
**Provisionally Earned** — positive change visible, period/evidence not yet sufficient.
**Inconclusive** — no reliable conclusion.
**Not Earned** — expected improvement did not occur.
**Harmful** — intervention caused or is strongly associated with meaningful negative effect.

Final numeric targets set after baseline (see `TC-register.md` for the 30-day-window Target Conditions, which operationalize this).

---

# 14–19. HELIX Effectiveness, Dashboard, Reporting, Experiment Design, Data Quality, Evidence Preservation

HELIX Method effectiveness indicators: diagnostic accuracy, intervention success rate (Earned / Completed evaluated), time to measurable result, effort efficiency, prediction accuracy, reusability, maintenance burden, traceability completeness.

Dashboard: Owner View (one page, understandable without specialist knowledge — see `HV-DB-001.md`) + Engineering View (metric detail, test-scenario results, intervention performance).

Reporting cadence: weekly operational check (≤15 min), monthly visibility review, quarterly engineering review.

Experiment design: avoid changing title/copy/links/schema/CTA/GBP/listings simultaneously for the same intent — smaller intervention groups improve attribution (HV-MP-P-006).

Data quality: mark data as missing/estimated/sampled/self-reported/technically measured/manually observed/externally controlled/seasonally affected/not directly attributable. No metric may be presented as more precise than its collection method allows.

---

# 20. Initial Measurement Artifacts

| Artifact | Status |
|---|---|
| HV-BL-001 — Initial Visibility Baseline | Exists, partial (measurement/HV-BL-001.md) |
| HV-TS-001 — AI and Search Test Scenario Register | Exists, round 0 (evidence/HV-TS-001.md) |
| HV-MR-001 — Measurement Register | Not yet created |
| HV-IR-001 — Intervention Register | Exists (transformation/HV-IR-001.md) |
| HV-ER-001 — Experiment Register | Not yet created |
| HV-SC-001 — Monthly Visibility Scorecard | Not yet created |
| HV-DB-001 — HELIX Visibility Dashboard | Exists (measurement/HV-DB-001.md) |
| HV-AR-001 — Attribution Register | Exists, not yet active (work-objects/HV-AR-001.md) |
| HV-VR-001 — Validation Result Register | Not yet created |

---

# 21. Immediate Implementation Sequence

1. Establish baseline (Search Console, GA4, GBP, reservation-source, AI answers, search representation, listing accuracy, landing-page performance) — see O-001/O-002/O-011.
2. Repair tracking — see O-011.
3. Build the controlled 30-scenario test set — 1/30 done (HV-TS-001).
4. Create the scorecard.
5. Record interventions — HV-IR-001 in place.
6. Run first implementation cycle (max 5 high-priority) — HV-VCM-001 backlog.
7. Validate at 7/28/56/90 days.
8. Review HELIX effectiveness.

---

# 22–25. Success/Failure Definition, Foundational Rule

Success requires demonstrated improvement across accuracy, consistency, search visibility, AI understanding, recommendation frequency, qualified customer action, business outcome, traceable interventions, small-enterprise maintainability, and reusable engineering knowledge.

Failure includes: more content without better understanding, irrelevant-search ranking gains, traffic without qualified action, AI mentions rising while accuracy falls, excessive manual effort, untraceable interventions, results indistinguishable from seasonality, reports without decisions, an unmaintainable capability.

> HELIX Visibility may not claim success because work was completed. Success is earned only when measured visibility, understanding, recommendation, customer action, or business value improves against a preserved baseline.
