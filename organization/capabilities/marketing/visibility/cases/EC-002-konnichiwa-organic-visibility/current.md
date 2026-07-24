# Current State — EC-002
---

Last updated: 24 July 2026 (Guestplan data received — full baseline now complete; two website UX fixes prepared).

## Current lifecycle stage

Case Establishment / Observation (see Lifecycle Scope.md).

## Completed artifacts

- Case Identity, Purpose, Explicit Boundaries, Observed Conditions, Lifecycle Scope, Traceability, References — all written 23 July 2026.
- evidence/HV-IV-001 through HV-IV-007 — prior-round investigations, 22 July 2026, all evidence-backed.
- design/HV-VCM-001.md — first Visibility Coverage Map, Draft v0.1.
- design/structured-data-website.md — JSON-LD Restaurant schema, prepared, not published.
- design/omakase-pagina-brief.md — omakase page design, complete, realized.
- transformation/HV-IR-001.md — HV-INT-002 (omakase + teppanyaki menu pages) confirmed live 22 July 2026; HV-INT-001 (structured data + corrected hours) partially live (text fix only); **HV-INT-003 (GA4 Google-tag publicatie) live 23 July 2026** — a 2-month-old unpublished GA4 tag was found and published during O-011/GA4 troubleshooting.
- measurement/HV-MP-001.md, HV-BL-001.md, HV-DB-001.md (v1–v4), TC-register.md, 30-day-baseline-metrics.md.
- work-objects/WO-active-register.md, WO-legacy-register.md, HV-AR-001.md (not active).
- claims/EC-002-CL-candidate-register.md, understanding/EC-002-VD-taxonomy.md.
- decisions/DD-001 through DD-007.
- Challenge Evidence/CR-register.md — 5 open challenges (CR-001 through CR-005).
- **observations/O-001.md — Collected (23 July 2026).** Real Search Console data (EV-014, `evidence/raw/search-console-2026-07-23/`), 90-day window (data through 21 June 2026 due to reporting lag). Updated O-004.md and O-008.md with real figures. Updated measurement/HV-BL-001.md website baseline from "TE LEVEREN" to complete.
- **observations/O-002.md — Collected (23 July 2026).** Real Google Business Profile data (EV-015, `evidence/raw/gbp-performance-2026-07-23/`), 6-month window (Feb–Jul 2026). Updated measurement/HV-BL-001.md local baseline from "TE LEVEREN" to complete.
- **observations/O-011.md — Business volume collected (24 July 2026).** Real Guestplan data (EV-016), 90-day window (23 Apr–23 Jul 2026, exact match to the required period). Updated measurement/HV-BL-001.md business baseline — **all four baseline sections are now complete.** Channel-specific conversion attribution (which reservations came from organic/GBP) remains open, pending the three known tracking gaps.
- **transformation/HV-IR-001.md — HV-INT-004 (popup fix) and HV-INT-005 (mobile page-title overflow fix) prepared, 24 July 2026.** Both fixed in the local theme copy (`Local Sites/konnichiwa/.../themes/konnichiwa/`), not yet deployed via FTP.

## Active work

- New O-001–O-012 SEO/local observation round: **3 fully collected (O-001, O-002, O-011)**, 6 informed/substantially informed by prior evidence or the new exports (O-004, O-005, O-006, O-007, O-008, O-010), 1 partially informed (O-009), 1 still fully blocked (O-012, mobile performance — no PageSpeed test run yet).
- **Baseline complete as of 24 July 2026** — all four sections of measurement/HV-BL-001.md (AI, external-source, website, local, business) now hold real data. This closes the "baseline collection" phase of decisions/DD-004's 30-day plan (Days 1–3), three days after the case's re-establishment. Next lifecycle step per DD-004 Days 4–7: construct justified claims, challenge feasibility, prepare change records.
- **New unresolved item (O-011):** 162-reservation gap between "Reserveringen per bron" (576) and "Service-reserveringen" (414) in Guestplan — plausibly workshop/private-dining/catering/lunch bookings not covered by the two-category service breakdown, not confirmed. Also: 0% no-shows over 90 days is unusually clean and worth confirming with Kelvin rather than trusting at face value; 12.3% cancellation rate flagged with no benchmark to judge it against.
- **Two website UX fixes prepared, not yet deployed (HV-INT-004, HV-INT-005):** holiday popup now only shows once per visitor (was showing on every homepage load); the shared page-title component (`pageBanner()`) had no responsive font-size, causing long single-word titles like "Arrangements" to overflow off-screen on mobile — now fixed site-wide. Both sit in the local theme copy at `Local Sites/konnichiwa/app/public/wp-content/themes/konnichiwa/`, awaiting FTP deployment by Kelvin.
- Weekly Monday 10:00 operating loop (decisions/DD-003) — not yet run once.
- **HV-INT-003 — GA4 tag published and confirmed working, 23 July 2026 (Provisionally Earned).** Root cause: the GA4 Google-tag (G-C29ZMF288W) was added to the GTM container 2 months ago but never published — sat unpublished in "Wijzigingen in behandeling." Published, then Realtime testing in Safari still showed 0 (Safari's cross-site tracking prevention blocked it) — retested in Chrome, confirmed active users appearing in Realtime. Fix confirmed working. See transformation/HV-IR-001.md, HV-INT-003. Container quality also flagged "3 issues" needing attention — not yet reviewed.
- **New, unresolved contradiction (CR-005):** Search Console shows "omakase Utrecht" at position 4.7 — comparable to "teppanyaki Utrecht" (4.47) — contradicting evidence/HV-IV-003.md's earlier "weak, Amsterdam-dominated" read. Needs a fresh controlled search-tool check before HV-VCM-001's priority-2 omakase classification is trusted either way.
- **New finding to follow up:** `/nl/home-nederlands/` is a real, better-ranking page (position 5.05 vs. homepage 8.93) that was not catalogued in evidence/HV-IV-007.md's page inventory. Needs reconciling.
- **Major new finding, highest priority for diagnosis:** every Google Business Profile metric (interactions, website clicks, route requests, calls, menu views, appointments) has declined steadily for 6 straight months (Feb→Jul 2026), roughly halving to two-thirds down. Predates EC-002 and HV-INT-002 entirely — cause unknown, not yet investigated. See observations/O-002.md.

## Blockers

- GA4 data — **resolved and confirmed working, 23 July 2026** (HV-INT-003), but no usable history exists before this date, and Safari visitors are structurally under-measured (browser-level tracking prevention, not fixable from our side) — see transformation/HV-IR-001.md, HV-INT-003 for the data-quality caveat. Channel-specific conversion attribution still needs GA4 events to mature and, ideally, a GA4-Guestplan link that doesn't exist yet.
- GTM Container Quality "3 issues" — flagged during HV-INT-003 troubleshooting, not yet reviewed.
- Structured-data implementation — needed to unblock HV-INT-001 (design is ready, not yet placed on the live site).
- Three conversion-tracking gaps unresolved: no directions link, no Private Dining CTA, broken catering form (see observations/O-011.md).
- Formal Search Console indexation/coverage report — not included in the 23 July export, still needed for O-005.
- HV-INT-004 and HV-INT-005 (popup + mobile title fix) — prepared locally, awaiting FTP deployment by Kelvin before they can be validated.
- Formal mobile performance test (O-012) — no PageSpeed Insights or equivalent run yet.

## Next authorized action

Baseline collection (DD-004 Days 1–3) is functionally complete. Per decisions/DD-004: move into Days 4–7 (diagnose and authorize) — construct justified claims from the now-complete baseline, challenge feasibility per theme, identify the smallest high-leverage interventions, prepare change records, obtain approval before further website/profile changes. O-012 (mobile performance) remains open and can be collected in parallel without blocking this move.

## Unresolved unknowns

- Exact venue/bar closing time after kitchen close (evidence/HV-IV-002.md).
- Exact teppanyaki closing time (evidence/HV-IV-002.md).
- Whether "@konnichiwagroup" Instagram account belongs to Konnichiwa (evidence/HV-IV-001.md).
- Formal indexation status of priority pages (requires O-001).
- Review recency and response-time data (requires O-009 completion).
- Which of the remaining ~34 candidate search intents (legacy EC-002 §12) have business value — none evaluated beyond the 4 in evidence/HV-IV-005.md.
- **What is causing the 6-month decline in every GBP metric (observations/O-002.md)?** No candidate explanation has been tested yet.
- What is "takumi" (1,400 GBP profile-discovery searches, observations/O-002.md) — unexplained.
- What are the 3 flagged GTM "Container Quality" issues? Not yet reviewed.
- How large is the Safari/iOS share of Konnichiwa's real visitors — needed to size how much GA4 will structurally undercount going forward (observations/O-002.md showed 85% of GBP discovery is mobile, device OS split unknown).
- What explains the 162-reservation gap between Guestplan's two reservation reports (observations/O-011.md)?
- Is Guestplan's 0% no-shows figure accurate, or is no-show tracking incomplete?
- No same-period-last-year comparison exists for the Guestplan baseline — is 576 reservations/90 days typical, growing, or declining?

## Migration note

This file, and the case folder it belongs to, were created by migrating and restructuring the original case from `solutions/visibility/` into `/organization/capabilities/marketing/visibility/cases/EC-002-konnichiwa-organic-visibility/`, per decisions/DD-007-ec002-migration-decision.md. The original source files have been deleted from `solutions/visibility/` after this migration completed (recoverable via git history).
