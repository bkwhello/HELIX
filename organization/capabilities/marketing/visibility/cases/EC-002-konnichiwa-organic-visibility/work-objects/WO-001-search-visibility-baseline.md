# WO-001 — Search Visibility Baseline
---

Status: **Active — Established** (24 July 2026, final pass). Promoted from Candidate the same day (decisions/DD-008 Condition 3), then correctly held at Provisional while O-003 and O-012 were genuinely incomplete, then promoted to Established once both were closed with real evidence (EV-017, EV-018) — not on the strength of data completeness alone, but against the explicit nine-criterion checklist below. See "Baseline Acceptance Criteria" at the end of this file for the full history and current.md for the live verdict.

Purpose: the structured register of all twelve baseline observations (O-001–O-012) required before Organizational Understanding can be attempted. This artifact is the index and status tracker; each observation's full evidence lives in its own `observations/O-0XX.md` file — this file does not duplicate that content, only its structured tracking fields.

---

## O-001 — Search Console performance

| Field | Value |
|---|---|
| Collection question | What are Konnichiwa's actual query/page-level search performance figures? |
| Source | Google Search Console, property konnichiwa.nl |
| Collection method | Manual export (CSV) by Kelvin |
| Date range | Last 3 months filter; actual daily data covers 21 Apr–21 Jun 2026 (reporting lag) |
| Required access | Search Console account access (Kelvin has it) |
| Expected evidence artifact | EV-014, `evidence/raw/search-console-2026-07-23/` |
| Limitations | Query table capped near 999 rows (long-tail undercounted); no formal indexation/coverage report included |
| Confidence method | Direct platform export — Hoog |
| Responsible owner | Kelvin (collection), Claude (analysis) |
| Blocker status | **None — Collected**, 23 July 2026 |

## O-002 — Google Business Profile performance

| Field | Value |
|---|---|
| Collection question | How is Konnichiwa performing on Google Business Profile, and is that performance stable? |
| Source | Google Business Profile performance dashboard |
| Collection method | 9 screenshots by Kelvin (no export button available in his interface) |
| Date range | Feb–Jul 2026 (6 months — wider than the case's usual 90-day window) |
| Required access | GBP owner/manager access (Kelvin has it) |
| Expected evidence artifact | EV-015, `evidence/raw/gbp-performance-2026-07-23/` |
| Limitations | Screenshots, not raw exportable data; monthly points not date-boundary-labeled precisely; July point likely partial month |
| Confidence method | Direct platform screenshots — Hoog |
| Responsible owner | Kelvin (collection), Claude (analysis) |
| Blocker status | **None — Collected**, 23 July 2026. Surfaced a major unexplained finding (6-month decline across every metric) requiring priority attention at Diagnosis stage. |

## O-003 — Local rankings at defined Utrecht measurement points

| Field | Value |
|---|---|
| Collection question | Where does Konnichiwa rank in the local pack for target queries, from defined Utrecht geographic points? |
| Source | Kelvin's own iPhone, Google Chrome Incognito, mobile Google local pack |
| Collection method | Manual, genuinely Utrecht-located search, logged out, incognito — reported directly by Kelvin with full structured metadata |
| Date range | Single point-in-time: 24 July 2026, 06:41 Europe/Amsterdam |
| Required access | None — Kelvin's own device |
| Expected evidence artifact | EV-018, observations/O-003.md |
| Limitations | One Utrecht region-point, one device, one time — not a multi-point grid. Local-pack position only; organic position remains O-004's domain. No image file independently viewed by Claude — based on Kelvin's structured first-hand report. |
| Confidence method | Hoog for this single controlled observation as reported; Low for generalizing across Utrecht/time/devices |
| Responsible owner | Kelvin (collection), Claude (recording, analysis) |
| Blocker status | **Collected, 24 July 2026 — accepted as the initial location-controlled observation.** Konnichiwa at local-pack position 2 of 3. Satisfies O-003's original requirement for an *initial* baseline; a multi-point grid remains a future measurement-maturity improvement, not a blocker. |

## O-004 — Organic rankings for target search themes

| Field | Value |
|---|---|
| Collection question | What are Konnichiwa's real organic positions for teppanyaki/omakase/Japans restaurant/sushi Utrecht? |
| Source | Google Search Console (primary), informal search-tool checks (secondary) |
| Collection method | Search Console export (O-001) cross-referenced with evidence/HV-IV-003.md |
| Date range | Same as O-001 |
| Required access | None additional beyond O-001 |
| Expected evidence artifact | O-001.md, O-004.md |
| Limitations | Search Console and the informal, non-geo-controlled search-tool checks disagreed materially on "omakase Utrecht" — resolved for the initial baseline by O-003's Utrecht-controlled local-pack observation (position 2 of 3), which corroborates Search Console's optimistic reading. See Challenge Evidence CR-005, "Resolved for Initial Baseline." |
| Confidence method | Search Console: Hoog. Informal tool: Middel (HV-IV-003's own stated limitation). O-003 cross-check: Hoog for the single observation. |
| Responsible owner | Claude (analysis), Kelvin (provided the resolving O-003 observation) |
| Blocker status | **Collected; CR-005 resolved for initial baseline (24 July 2026).** |

## O-005 — Indexation and sitemap state

| Field | Value |
|---|---|
| Collection question | Which pages are indexed, crawlable, and free of duplication/staleness defects? |
| Source | konnichiwa.nl sitemap (evidence/HV-IV-007.md), Search Console page list (O-001) |
| Collection method | Sitemap fetch + direct page checks (HV-IV-007); Search Console top-pages export (O-001) |
| Date range | 22–23 July 2026 |
| Required access | None — both are read-only/already-collected |
| Expected evidence artifact | evidence/HV-IV-007.md, observations/O-001.md, observations/O-005.md |
| Limitations | Confirms page existence/structure; does **not** confirm formal indexation status (crawled-not-indexed vs. excluded) — that needs Search Console's separate Coverage report, not included in the 23 July export |
| Confidence method | Hoog for structure; N/A for formal indexation status |
| Responsible owner | Claude |
| Blocker status | **Informed, not fully closed** — formal coverage report still outstanding, read-only when pursued. |

## O-006 — Technical search presentation and structured data

| Field | Value |
|---|---|
| Collection question | Are titles, descriptions, canonicals, headings, and structured data correct and non-conflicting? |
| Source | evidence/HV-IV-001.md (structured data absence), evidence/HV-IV-007.md (broken title on `/sushi-page-2/`) |
| Collection method | Direct site inspection |
| Date range | 22 July 2026 |
| Required access | None — read-only, already collected |
| Expected evidence artifact | evidence/HV-IV-001.md, evidence/HV-IV-007.md |
| Limitations | Confirms defects found; does not constitute a full technical SEO audit of every page |
| Confidence method | Hoog |
| Responsible owner | Claude |
| Blocker status | **Informed.** Fix designed (design/structured-data-website.md) but not implemented — see HV-INT-001, Blocked. |

## O-007 — Landing-page intent and internal-link coverage

| Field | Value |
|---|---|
| Collection question | Do existing landing pages match customer intent, and are they properly interlinked? |
| Source | evidence/HV-IV-007.md (content quality), Search Console (O-001, `/nl/home-nederlands/` finding) |
| Collection method | Direct page review + Search Console page-performance cross-check |
| Date range | 22–23 July 2026 |
| Required access | None |
| Expected evidence artifact | evidence/HV-IV-007.md, observations/O-001.md, observations/O-007.md |
| Limitations | `/nl/home-nederlands/` and `/store/omakase` are two pages discovered via Search Console that were **not** in HV-IV-007's original manual inventory — the manual inventory is therefore known to be incomplete |
| Confidence method | Hoog for cataloged pages; Middel for completeness of the inventory itself |
| Responsible owner | Claude |
| Blocker status | **Informed, one reconciliation item open** (the two uncatalogued pages). |

## O-008 — Business-information consistency (NAP)

| Field | Value |
|---|---|
| Collection question | Is Konnichiwa's name/address/phone/hours represented consistently across sources? |
| Source | evidence/HV-IV-001.md, HV-IV-002.md, HV-IV-003.md; Search Console (O-001); GBP (O-002) |
| Collection method | Cross-source comparison |
| Date range | 22–23 July 2026 |
| Required access | None |
| Expected evidence artifact | observations/O-008.md |
| Limitations | Two closing-time details remain owner-unconfirmed (venue/bar close time, teppanyaki close time) |
| Confidence method | Hoog for the inconsistency finding (now quantified via two independent sources: 1,130+ misspelled-query volume) |
| Responsible owner | Claude (analysis), Kelvin (two open closing-time facts) |
| Blocker status | **Informed and quantified.** Two small factual confirmations remain, not blocking. |

## O-009 — Review state and response behavior

| Field | Value |
|---|---|
| Collection question | What is the review volume, rating, recency, and response behavior across platforms? |
| Source | evidence/HV-IV-001.md (Google, RestaurantGuru counts/ratings), evidence/HV-IV-006.md |
| Collection method | Direct platform checks |
| Date range | 22 July 2026 |
| Required access | For recency/response-time detail: Google review management access (not yet used for this) |
| Expected evidence artifact | evidence/HV-IV-001.md, evidence/HV-IV-006.md |
| Limitations | Counts/ratings are platform-stated snapshots, not independently re-verified at a fixed date; recency and response-time data not collected |
| Confidence method | Middel |
| Responsible owner | Unassigned for the recency/response gap |
| Blocker status | **Partially informed.** Recency/response-time data collection is read-only when pursued — no access blocker, just not yet done. |

## O-010 — Competitor characteristics

| Field | Value |
|---|---|
| Collection question | Which competitors dominate the relevant search/recommendation contexts? |
| Source | evidence/HV-IV-006.md |
| Collection method | Search-query-based competitor research |
| Date range | 22 July 2026 |
| Required access | None |
| Expected evidence artifact | evidence/HV-IV-006.md |
| Limitations | Automated search-based research, not individually verified per competitor (no direct booking/pricing checks) |
| Confidence method | Middel |
| Responsible owner | Claude |
| Blocker status | **Informed.** |

## O-011 — Reservation conversion measurement

| Field | Value |
|---|---|
| Collection question | What is Konnichiwa's actual reservation volume, channel mix, and service mix, and how much of it is attributable to organic/local visibility? |
| Source | Guestplan reporting dashboard |
| Collection method | 5 screenshots by Kelvin |
| Date range | 23 Apr–23 Jul 2026 (exact 90-day match) |
| Required access | Guestplan dashboard access (Kelvin has it) |
| Expected evidence artifact | EV-016, observations/O-011.md |
| Limitations | Business volume collected; channel-specific (organic/GBP-attributed) conversion still requires mature GA4 event data and a GA4–Guestplan link that does not exist; 162-reservation discrepancy between two Guestplan reports unresolved; no same-period-last-year comparison |
| Confidence method | Hoog for volume/mix; N/A for channel attribution |
| Responsible owner | Kelvin (collection, done), Claude (attribution analysis, pending) |
| Blocker status | **Business volume Collected, 24 July 2026.** Channel attribution remains open — not a data-access blocker, a data-maturity blocker (GA4 was only fixed 23 July, per HV-INT-003). |

## O-012 — Mobile performance and reservation friction

| Field | Value |
|---|---|
| Collection question | How does the site perform on mobile devices, and where does friction occur in the reservation path? |
| Source | PageSpeed Insights, Chrome UX Report field data — completed report URL supplied by Kelvin |
| Collection method | WebFetch against a completed, shareable PSI report link (the async-analysis-start page was unreadable; a finished report link was not) |
| Date range | 28-day CrUX window, 24 June–21 July 2026; report generated 24 July 2026 |
| Required access | None — public data, no account |
| Expected evidence artifact | EV-017, observations/O-012.md |
| Limitations | Lighthouse lab scores (0–100 Performance/Accessibility/Best-Practices/SEO) not present in the fetched content — field data only. TTFB flagged experimental with 26% poor. |
| Confidence method | Hoog — real-user field data (CrUX), not a synthetic single run |
| Responsible owner | Claude (fetch), Kelvin (supplied the working report URL after the async start-page failed) |
| Blocker status | **Collected, 24 July 2026.** Core Web Vitals pass on both mobile and desktop. The original tooling blocker (API 429, async page) was worked around, not removed — a fresh `analysis?url=` start would still fail the same way; only a completed report link works. |

---

## Summary

| Status | Count | IDs |
|---|---:|---|
| Collected | 6 | O-001, O-002, O-003 (Utrecht-controlled), O-004 (CR-005 resolved for baseline), O-011 (business volume), O-012 (field data) |
| Informed (read-only, minor gaps remain) | 5 | O-005, O-006, O-007, O-008, O-010 |
| Partially informed | 1 | O-009 |

Updated 24 July 2026 (third pass): O-003 now has a genuinely Utrecht-controlled observation (Kelvin, mobile, incognito, Utrecht region confirmed by Google) — Konnichiwa at local-pack position 2 of 3 for "omakase utrecht." This resolves CR-005 for the initial baseline and closes O-003's original requirement gap. Combined with O-012's earlier resolution (real CrUX field data, Core Web Vitals Passed), no fabricated data exists anywhere in this register at any point — two tooling failures (O-012) and two geographically-uncontrolled proxy measurements (O-003's earlier WebSearch attempt) were recorded honestly as insufficient before the genuinely conclusive data arrived.

---

## Baseline Acceptance Criteria — Assessment (24 July 2026, final pass)

| Criterion | Met? | Basis |
|---|---|---|
| O-001 and O-002 have reproducible source data | **Yes** | Search Console export, GBP screenshots, both with documented method |
| O-003 has an approved measurement method and a first measurement | **Yes** (24 July 2026, third pass) | Kelvin's Utrecht-controlled, incognito, mobile local-pack observation (EV-018) — Konnichiwa position 2 of 3. Genuinely satisfies the geographic-control requirement the two earlier proxy attempts explicitly did not. Multi-point coverage remains a future improvement, not a requirement of this criterion. |
| O-004 has a recorded query-ranking baseline | **Yes** | Search Console positions recorded for all four target themes; CR-005 resolved for initial baseline using O-003's new evidence |
| O-005–O-010 have sufficient evidence or explicit limitations | **Yes** | Every one of these six observations carries either real evidence or an explicitly stated limitation — none is silently assumed |
| O-011 makes the Guestplan/analytics gap visible | **Yes** | observations/O-011.md documents the channel-attribution gap explicitly |
| O-012 has been executed | **Yes** | Real CrUX field data obtained via a completed PSI report URL (EV-017). Core Web Vitals Passed on mobile and desktop. Lighthouse lab scores remain unobtained — minor, non-blocking. |
| HV-DB-001 matches the evidence state | **Yes** | Regenerated as v5, 24 July 2026 (measurement/HV-DB-001.md); updated again to reflect O-003/CR-005 resolution — see below. The *published, live* dashboard page still shows an older state and has not itself been republished — noted, not blocking this criterion, which is about this repository's records. |
| Open uncertainties are explicit, not interpreted as zero | **Yes** | O-012 was Unavailable before resolution, never shown as 0; GA4 trend recorded as Pending; GBP decline cause recorded as unknown; O-003's single-point/single-time/single-device limitations explicitly preserved rather than generalized away |
| Traceability references all evidence used | **Yes** | Traceability.md updated to include O-003's EV-018, CR-005's resolution, O-012's EV-017 |

### Verdict (final, 24 July 2026)

**baseline_state: Established. baseline_established: true.**

All nine criteria are now met. This was earned incrementally and visibly, not asserted: the first attempt at this verdict (`true`, based on data completeness alone) was corrected to `Provisional`/`false` the same day on legitimate challenge; two genuine tooling blockers (O-012) and two genuinely insufficient proxy measurements (O-003) were documented honestly rather than papered over; both were then closed with real, higher-quality evidence — O-012 via a completed PSI report, O-003 via Kelvin's own Utrecht-located, incognito, logged-out observation. No data was fabricated at any point in this sequence, including during the periods when the verdict was correctly `false`.

This does not mean every open question in the case is closed — current.md's Unresolved Unknowns list is not empty, and several items there (the 6-month GBP decline, the 162-reservation gap, TTFB's poor mobile score, "takumi") remain real, unexplained findings that a future Organizational Diagnosis must address. Baseline Established means the *observation and evidence foundation* is now sufficient to begin building Justified Organizational Claims on top of it — it does not mean the picture is fully understood.
