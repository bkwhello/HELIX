# HV-CHM-001 — Canonical Hours Model (Konnichiwa)
---

Classification: Design (internal, repository-only proposal — **not a live change, not published externally**). Created 21 August 2026, weekly review W34 (measurement/2026-W34-visibility-brief.md).

## Why this exists

Public sources expose different opening-hour representations for Konnichiwa. This does not necessarily mean any one source is factually wrong — the underlying condition is that Konnichiwa has **multiple distinct hour types** (restaurant, kitchen, lunch, dinner, takeaway, delivery), and no single internal representation currently distinguishes them. diagnosis/DQ-005-investigation.md (Evidence Insufficient, Accepted, decisions/DD-019) already found that the *absence of schema.org markup* does not explain the specific AI opening-hours errors tested — that finding is **not reopened here**. This model addresses a different, narrower gap: DQ-005's own ground truth table (Phase 1) recorded that the bar/venue closing time after kitchen close, and the Teppanyaki closing time, were **"not yet established even by the owner"** — i.e. some hour types are not yet canonically defined internally at all, independent of any AI or markup question. This proposal is a data-structure precursor to closing that specific gap, and to HV-INT-001 (structured data + corrected opening hours, currently Blocked, transformation/HV-IR-001.md), not a new diagnosis and not an implementation.

## Proposed internal representation only — do not publish externally

```text
CanonicalHours

restaurant_open
restaurant_close

kitchen_open
kitchen_close

lunch_open
lunch_close

dinner_open
dinner_close

takeaway_open
takeaway_close

delivery_open
delivery_close

day_of_week

effective_from
effective_until

source_of_truth
approved_by
approved_at
```

## Known values (from existing evidence — not newly measured)

| Field | Known value | Source | Status |
|---|---|---|---|
| Sushi-kitchen hours | Mon–Thu 16:00–21:30, Fri–Sun 12:00–21:30 | EV-001 (DQ-005 Phase 1) | Confirmed |
| Restaurant/venue close (base) | 22:00, all days | evidence/HV-IV-004.md, Kelvin | Confirmed (design/structured-data-website.md already uses this) |
| Teppanyaki start | Daily 17:00 | EV-010 (DQ-005 Phase 1) | Confirmed |
| Teppanyaki close | **Not yet established even by the owner** | EV-010 (DQ-005 Phase 1) | **Unknown — genuine gap, not inferred** |
| Bar/venue hours after kitchen close | Stays open; exact closing time **not yet established even by the owner** | EV-010 (DQ-005 Phase 1) | **Unknown — genuine gap, not inferred** |
| Lunch/takeaway/delivery hours | Not separately established in any evidence reviewed for this model | — | **Unknown — not assessed, not assumed absent** |
| Special/holiday hours | design/structured-data-website.md's `specialOpeningHoursSpecification` block dates (2026-08-01 through 08-12) are now in the past relative to 21 August 2026 | design/structured-data-website.md | **Stale — flagged, not corrected here** (structured-data-website.md itself is out of this week's approved edit scope) |

## What this model does not do

It does not select a source of truth, does not resolve any of the "Unknown" fields above, does not modify design/structured-data-website.md or any published site content, and does not reopen diagnosis/DQ-005. `source_of_truth`, `approved_by`, and `approved_at` are structural fields for a future data model — no value is populated for them here.

## Next step

Kelvin to supply the missing values (Teppanyaki close, bar/venue close after kitchen, lunch/takeaway/delivery hours if applicable) as an Owner Declaration, dated. Only after that is complete should this model be populated and cross-checked against HV-INT-001's JSON-LD proposal — a separate, not-yet-authorized step.

## Traceability

Source diagnosis: diagnosis/DQ-005-investigation.md (decisions/DD-019). Related intervention: transformation/HV-IR-001.md, HV-INT-001. Related design: design/structured-data-website.md. Weekly review: measurement/2026-W34-visibility-brief.md.
