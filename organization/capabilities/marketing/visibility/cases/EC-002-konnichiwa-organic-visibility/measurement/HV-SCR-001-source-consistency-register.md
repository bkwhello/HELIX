# HV-SCR-001 — Source Consistency Register (Konnichiwa)
---

Created 21 August 2026, weekly review W34 (measurement/2026-W34-visibility-brief.md), operationalizing HV-MP-001 §3, Layer 3 (Cross-Source Consistency).

## What this is, and what it is not

This register records, per external source, which name/address/phone/hours/category representation is currently observed — **neutrally, without asserting visibility harm, correction need, or which value is "correct."** It does not reopen, reclassify, or contradict diagnosis/OD-003 (Established Organizational Diagnosis, decisions/DD-021/DD-022: within the tested Search Console query pairs, the misspelled "Konichiwa" variant showed **no measured ranking or CTR penalty** on Google organic search, and **no Design or intervention was authorized** for entity naming). This register does not test ranking effects — it only inventories what each source currently displays. Naming variation recorded here is a **description of current state**, not a defect requiring correction.

Do not correct any external source from this register. Do not infer that a listed variant causes any measured outcome.

## Register

| Source | Canonical name observed | Address | Telephone | Opening-hours representation | Category | Owner Controlled? | Correction mechanism | Last checked | Evidence reference | Status |
|---|---|---|---|---|---|---|---|---|---|---|
| Konnichiwa website (konnichiwa.nl) | Konnichiwa | Not separately re-verified this round | Not separately re-verified this round | Plain text on site; no schema.org markup yet (HV-INT-001, Blocked) | Restaurant / Japans, teppanyaki, sushi, izakaya, omakase | **Owner Controlled** | Direct site edit (Kelvin/webbeheerder) | 22 juli 2026 (HV-IV-001) | claims/OC-004…md; evidence/HV-IV-001.md | Recorded |
| Google Business Profile | Konnichiwa | Mariaplaats-adres, niet opnieuw gecheckt deze ronde | Niet opnieuw gecheckt deze ronde | Reguliere uren ingesteld; special-hours-status niet deze ronde herverifieerd | Japans restaurant | **Owner Controlled** | Direct via GBP-dashboard (Kelvin) | 24 juli 2026 (O-013, EV-021) | observations/O-013.md; measurement/HV-DB-001.md v6 | Recorded |
| TripAdvisor — listing name | Konnichiwa | Not separately re-verified this round | Not separately re-verified this round | Not separately re-verified this round | Restaurant | **Third Party** (owner-editable via TripAdvisor Management Center, not yet confirmed) | Unknown — not yet assessed | 22 juli 2026 (EV-001/HV-IV-001) | claims/OC-004…md | Recorded |
| TripAdvisor — page title (separate field) | Konichiwa (single n) | — | — | — | — | **Third Party** | Unknown — not yet assessed | 22 juli 2026 (EV-004/HV-IV-003) | diagnosis/OD-003…md, Contributing Conditions | Recorded — **kept separate from the listing-name field above; not treated as the same fact** |
| TheFork | Konnichiwa (per OC-004 scope; not independently re-checked this round) | Not separately re-verified this round | Not separately re-verified this round | Not separately re-verified this round | Restaurant | **Third Party / Platform Controlled** (unconfirmed which) | Unknown — not yet assessed | 22 juli 2026 (EV-001/HV-IV-001) | claims/OC-004…md | Recorded — see also Challenge Evidence/CR-register.md CR-007 (review-count method conflict, separate from naming) |
| Instagram (@konnichi_wa_utrecht) | Konnichi Wa | — | — | — | — | **Owner Controlled** (assumed — account ownership not re-verified this round) | Direct via Instagram profile edit | 22 juli 2026 (EV-001/HV-IV-001) | claims/OC-004…md; design/structured-data-website.md `sameAs` | Recorded |
| Facebook (Konnichiwa.Japansrestaurant) | Konnichi Wa | — | — | — | — | **Owner Controlled** (assumed — not re-verified this round) | Direct via Facebook Page edit | 22 juli 2026 (EV-001/HV-IV-001) | claims/OC-004…md; design/structured-data-website.md `sameAs` | Recorded |
| Eet.nu | Konnichi Wa | — | — | — | — | **Unknown** — not yet assessed | Unknown — not yet assessed | 22 juli 2026 (EV-001/HV-IV-001) | claims/OC-004…md | Recorded |
| Quandoo | Konnichi Wa | — | — | — | — | **Unknown** — not yet assessed | Unknown — not yet assessed | 25 juli 2026 (DQ-002 investigation, Phase 1 inventory) | diagnosis/OD-003…md, Contributing Conditions | Recorded |
| Yelp | Konichiwa (single n) | — | — | — | — | **Third Party** | Unknown — not yet assessed | 22 juli 2026 (EV-004/HV-IV-003) | claims/OC-004…md; diagnosis/OD-003…md | Recorded |

## Fields intentionally left blank

Address, telephone, opening-hours representation, and category are marked "Not separately re-verified this round" for most third-party sources — this is a genuine evidence gap, not a claim that these fields are consistent or inconsistent. No value is inferred to fill these cells.

## Relationship to diagnosis/OD-003

OD-003 tested only Google organic search position/CTR for the "Konnichiwa"/"Konichiwa" query family and found no measured penalty, within its own stated scope and confidence (Medium). OD-003 explicitly preserves, as a Contributing Condition, that "third-party listings... continue to reinforce the underlying inconsistency at the platform level, independent of Google's own search-result behavior toward it" — this register is the evidence-tracking continuation of exactly that preserved condition, not a new diagnosis and not a reopening of OD-003's established finding. Per decisions/DD-022, no Design or intervention is authorized by naming inconsistency alone; this register creates no such authorization.

## Next step

Individually re-verify each "Not separately re-verified this round" cell with a dated screenshot or Owner Declaration before any future consistency percentage (HV-MP-001 §3, Layer 3 target: 100% critical fields, ≥95% overall) is calculated. No percentage is calculated from this version of the register.

## Traceability

Source claims: claims/OC-004…md. Source diagnosis: diagnosis/OD-003…md (decisions/DD-021, DD-022). Weekly review: measurement/2026-W34-visibility-brief.md.
