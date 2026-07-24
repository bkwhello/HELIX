# Current State — EC-002
---

Last updated: 24 July 2026 (baseline formally **Established** — Kelvin performed a genuinely Utrecht-controlled local-pack observation for "omakase Utrecht," closing the last of nine baseline acceptance criteria).

## Formal State (per decisions/DD-008 gate verdict, corrected, then Established)

```yaml
status: Open
current_stage: Observation and Evidence Collection
case_establishment: Completed
baseline_state: Established
baseline_established: true
diagnosis_established: false
design_authorized: false
transformation_started: false
external_changes_authorized: false
next_action: Begin constructing Justified Organizational Claims from the now-Established baseline (decisions/DD-004 Days 4–7) — see work-objects/WO-001-search-visibility-baseline.md
```

**Correction accepted, 24 July 2026:** an earlier version of this record set `baseline_established: true` on the reasoning that the underlying HV-BL-001 data was real and complete. That reasoning was insufficiently rigorous — completeness of *data collection* is not the same as satisfying the case's *baseline acceptance criteria*. `baseline_state` was corrected to `Provisional` / `baseline_established: false` until the criteria were actually, verifiably met.

**Remediation, same day:** O-012 was attempted twice by Claude (PageSpeed Insights API, then a fresh interactive-tool analysis) and genuinely blocked by tooling (HTTP 429 without an API key; async-loading page). Kelvin then supplied a completed PSI report URL directly — that succeeded, yielding real Chrome UX Report field data (EV-017): Core Web Vitals Passed on both mobile and desktop, with one flagged soft spot (TTFB 26% poor). That closed 8 of 9 criteria. O-003 was first given a documented, explicitly-limited WebSearch method with no Utrecht geographic control (Konnichiwa position 3 of 5, not conclusive). **Kelvin then performed the genuine Utrecht-located check this had been waiting for**: mobile, Chrome Incognito, logged out, Google-confirmed Utrecht region, 24 July 2026 06:41 — Konnichiwa at local-pack position 2 of 3 (EV-018). This resolved CR-005 for the initial baseline and closed the ninth and final criterion. See work-objects/WO-001-search-visibility-baseline.md's Baseline Acceptance Criteria Assessment for the full table and history.

## Current lifecycle stage

Case Establishment: **Completed** (gate passed with conditions, decisions/DD-008, 24 July 2026). Now in Observation and Evidence Collection (see Lifecycle Scope.md).

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
- **decisions/DD-008 — EC-002 Case Establishment Gate Review, 24 July 2026.** Verdict: PASSED WITH CONDITIONS. Verified all AD-014 mandatory invariants present; verified all 5 migrated HV artifacts preserved ID/history/epistemic-status/traceability. Four conditions raised (HV-DB-001 dashboard stale; business/Marketing duplication remains open; WO-001 needed formalizing — done same task; O-012 has no legitimate blocker).
- **work-objects/WO-001-search-visibility-baseline.md — promoted from Candidate to Active, 24 July 2026.** Structured register of all 12 baseline observations with collection question/source/method/date range/access/evidence artifact/limitations/confidence/owner/blocker status per observation.
- **decisions/DD-009 — Access and Approval Register, 24 July 2026.** Separates read-only requests, data-export requests, configuration-change requests, and external-change approvals. No external system changed while producing it.
- **observations/O-012.md — Collected, 24 July 2026.** Real Chrome UX Report field data (EV-017), obtained after Kelvin supplied a completed PageSpeed Insights report URL. Core Web Vitals Passed on mobile and desktop. Two prior automated attempts (API, fresh interactive analysis) had failed with no numbers fabricated at any point.
- **observations/O-003.md — Collected, 24 July 2026 (EV-018).** Genuinely Utrecht-controlled Google local-pack observation performed by Kelvin (mobile, Chrome Incognito, logged out, Utrecht region confirmed): Konnichiwa at position 2 of 3 for "omakase utrecht." Satisfies O-003's original requirement for an initial baseline. A prior WebSearch-based proxy attempt (no geo-control, position 3 of 5) is retained in the record but superseded.
- **Challenge Evidence/CR-register.md, CR-005 — Resolved for Initial Baseline, 24 July 2026.** EV-018 corroborates Search Console's optimistic reading over the earlier non-geo-controlled checks. Limitation preserved: single point/time/device, not a multi-point grid.
- **measurement/HV-DB-001.md — regenerated as v5, 24 July 2026.** Per-source status matrix (Measured/Pending/Unavailable/Not Configured) with last-measured dates; no missing data shown as zero. The *published, live* dashboard page has not itself been republished — separate follow-up.
- **business/Marketing/README.md — created, 24 July 2026.** Points to `organization/capabilities/marketing/` as authoritative for capability engineering; clarifies `business/Marketing/` is an empty structural placeholder, not a competing authority. `capability.md`'s relationship section rewritten to match.
- **decisions/DD-008 §6–7 — correction and condition resolution recorded, 24 July 2026.**

## Active work

- New O-001–O-012 SEO/local observation round: **6 fully collected (O-001, O-002, O-003, O-004, O-011, O-012)**, 5 informed with explicit limitations (O-005, O-006, O-007, O-008, O-010), 1 partially informed (O-009).
- **All nine baseline acceptance criteria are now met — `baseline_state: Established`, `baseline_established: true`.** See work-objects/WO-001-search-visibility-baseline.md's Baseline Acceptance Criteria Assessment for the full, criterion-by-criterion basis and the corrected history (an initial premature `true` → `Provisional`/`false` → `Established`, earned incrementally with real evidence at each step, nothing fabricated).
- **New unresolved item (O-011):** 162-reservation gap between "Reserveringen per bron" (576) and "Service-reserveringen" (414) in Guestplan — plausibly workshop/private-dining/catering/lunch bookings not covered by the two-category service breakdown, not confirmed. Also: 0% no-shows over 90 days is unusually clean and worth confirming with Kelvin rather than trusting at face value; 12.3% cancellation rate flagged with no benchmark to judge it against.
- **Two website UX fixes prepared, not yet deployed (HV-INT-004, HV-INT-005):** holiday popup now only shows once per visitor (was showing on every homepage load); the shared page-title component (`pageBanner()`) had no responsive font-size, causing long single-word titles like "Arrangements" to overflow off-screen on mobile — now fixed site-wide. Both sit in the local theme copy at `Local Sites/konnichiwa/app/public/wp-content/themes/konnichiwa/`, awaiting FTP deployment by Kelvin.
- Weekly Monday 10:00 operating loop (decisions/DD-003) — not yet run once.
- **HV-INT-003 — GA4 tag published and confirmed working, 23 July 2026 (Provisionally Earned).** Root cause: the GA4 Google-tag (G-C29ZMF288W) was added to the GTM container 2 months ago but never published — sat unpublished in "Wijzigingen in behandeling." Published, then Realtime testing in Safari still showed 0 (Safari's cross-site tracking prevention blocked it) — retested in Chrome, confirmed active users appearing in Realtime. Fix confirmed working. See transformation/HV-IR-001.md, HV-INT-003. Container quality also flagged "3 issues" needing attention — not yet reviewed.
- **CR-005 — Resolved for Initial Baseline, 24 July 2026.** Kelvin's genuinely Utrecht-located, incognito, logged-out mobile search for "omakase utrecht" (06:41) showed Konnichiwa at local-pack position 2 of 3 (Kong Izakaya #1, Konnichiwa #2, Japanese Don Dining KOUNOSUKE #3) — EV-018. This corroborates Search Console's optimistic "position 4.7" reading over the earlier non-geo-controlled checks (evidence/HV-IV-003.md and the 24 July WebSearch proxy), which likely understated Konnichiwa's real local prominence for lack of geographic control. Preserved limitation: one point, one time, one device — not a multi-point grid; says nothing about organic (non-local-pack) ranking, which remains O-004's domain; no claim of city-wide or time-stable ranking.
- **New finding to follow up:** `/nl/home-nederlands/` is a real, better-ranking page (position 5.05 vs. homepage 8.93) that was not catalogued in evidence/HV-IV-007.md's page inventory. Needs reconciling.
- **Major new finding, highest priority for diagnosis:** every Google Business Profile metric (interactions, website clicks, route requests, calls, menu views, appointments) has declined steadily for 6 straight months (Feb→Jul 2026), roughly halving to two-thirds down. Predates EC-002 and HV-INT-002 entirely — cause unknown, not yet investigated. See observations/O-002.md.

## Blockers

- GA4 data — **resolved and confirmed working, 23 July 2026** (HV-INT-003), but no usable history exists before this date, and Safari visitors are structurally under-measured (browser-level tracking prevention, not fixable from our side) — see transformation/HV-IR-001.md, HV-INT-003 for the data-quality caveat. Channel-specific conversion attribution still needs GA4 events to mature and, ideally, a GA4-Guestplan link that doesn't exist yet.
- GTM Container Quality "3 issues" — flagged during HV-INT-003 troubleshooting, not yet reviewed.
- Structured-data implementation — needed to unblock HV-INT-001 (design is ready, not yet placed on the live site).
- Three conversion-tracking gaps unresolved: no directions link, no Private Dining CTA, broken catering form (see observations/O-011.md).
- Formal Search Console indexation/coverage report — not included in the 23 July export, still needed for O-005.
- HV-INT-004 and HV-INT-005 (popup + mobile title fix) — prepared locally, awaiting FTP deployment by Kelvin before they can be validated.
- Lighthouse lab scores (Performance/Accessibility/Best-Practices/SEO 0–100) for O-012 — CrUX field data was obtained, but the lab-score portion of the PSI report was not present in the fetched content. Minor, non-blocking.
- Multi-point Utrecht rank grid for O-003 — the single 24 July observation is accepted as sufficient for the initial baseline, but broader coverage (multiple points/times/devices) remains a future measurement-maturity improvement, not currently blocking anything.

## Next authorized action

**Baseline is Established.** decisions/DD-004 Days 4–7 (diagnose and authorize) formally opens: construct justified claims from the now-complete baseline, challenge feasibility per theme, identify the smallest high-leverage interventions, prepare change records, obtain approval before further website/profile changes. Highest-priority input for that work: the unexplained 6-month GBP decline (observations/O-002.md) — the largest, least-understood finding in the case.

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
- Whether Konnichiwa's #2 local-pack position (EV-018) holds across other Utrecht points, times, and devices — only one point-in-time observation exists so far.
- The published, live HV-DB-001 dashboard page (and the Command Center artifact) still show the older v4 state — not republished against v5 in this task.
- What is causing TTFB to be "poor" for 26% of mobile page loads (observations/O-012.md)? Server response time, hosting, or caching — not investigated.
- Lighthouse lab scores (0–100) for konnichiwa.nl remain unobtained (O-012) — field data (CrUX) was collected instead, which answers the real-user question but not the synthetic-lab-score question.

## Migration note

This file, and the case folder it belongs to, were created by migrating and restructuring the original case from `solutions/visibility/` into `/organization/capabilities/marketing/visibility/cases/EC-002-konnichiwa-organic-visibility/`, per decisions/DD-007-ec002-migration-decision.md. The original source files have been deleted from `solutions/visibility/` after this migration completed (recoverable via git history).
