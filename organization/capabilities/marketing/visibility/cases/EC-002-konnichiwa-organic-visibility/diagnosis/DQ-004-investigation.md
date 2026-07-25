# DQ-004 Investigation — Mobile TTFB Mechanism
---

**Status: Completed.** Resulting Candidate Organizational Diagnosis: diagnosis/OD-002-absence-of-html-caching-layer.md.

*Executed under decisions/DD-016's Case-Owner Decision (Kelvin Wong, 25 July 2026), which Authorized DQ-004 With Conditions: diagnose only the mobile TTFB mechanism (which component of response time is implicated); preserve the field-data (CrUX, EV-017) vs. lab-data (Lighthouse, unobtained) distinction, using only the former; strictly read-only, no hosting/server/caching configuration access beyond what Kelvin voluntarily supplies, no configuration change under any circumstance; no inference of user, ranking, or reservation impact. Four roles kept explicitly separate: Role A (Evidence Investigator), Role B (Competing Explanation Constructor), Role C (Falsification Challenger), Role D (Diagnosis Gate Reviewer, see decisions/DD-018). No role used a later role's conclusion as evidence for an earlier role.*

## Authorized Question

DQ-004 — What mechanism explains the poor mobile TTFB distribution observed in the EC-002 baseline?

## Authorized Target Condition (decisions/DD-016, Phase 5)

The established TTFB exception (UR-002, OC-006) — poor server response time for approximately 26% of mobile page loads within the CrUX field-data window.

---

## Phase 1 — Target Condition Verification (Role A)

Re-read directly against observations/O-012.md and EV-017, not assumed from OU-004's or OC-006's summary prose.

| Field | Value | Evidence Class |
|---|---|---|
| Tested origin | `https://konnichiwa.nl/` (origin-level, not a specific URL — O-012 explicitly states "Channel: konnichiwa.nl, origin-level field data (not a specific page)") | Field data (CrUX) |
| Aggregation level | Origin-level — CrUX aggregates real visits across the whole site, not one page | Field data |
| Mobile vs. desktop | Reported separately; INP and TTFB are **not available for desktop** in the obtained report | Field data |
| Observation period | 28-day rolling CrUX window, 24 June–21 July 2026; report generated 24 July 2026, 06:19:15 | Field data |
| TTFB threshold used by source | Marked **experimental** by Google in the source report itself | Field data, stated limitation |
| Proportion classified as poor | **26% of mobile page loads** (TTFB) | Field data |
| TTFB reported value | 1.8 s (the figure Google's report displays alongside the 26%-poor classification) | Field data |
| Core Web Vitals outcome | **Passed** on both mobile and desktop | Field data |
| LCP | Mobile 2.4 s / 77% good; Desktop 2.3 s / 80% good | Field data |
| INP | Mobile 135 ms / 87% good; not available for desktop | Field data |
| CLS | Mobile 0 / 97% good; Desktop 0 / 98% good | Field data |
| Lab data (Lighthouse 0–100) | **Not obtained** — the lab-test portion of the PageSpeed Insights report loads asynchronously and was not present in either fetch (mobile or desktop variant of the same report) | Explicitly absent — not recorded as zero or as a negative finding |
| Existing limitations already attached | TTFB experimental status; no page-level isolation; no cause investigated; two failed automated PSI attempts preceded the successful fetch (documented as tooling failures, not evidence of poor performance) | — |

**Classification of the target condition:** a **confirmed field-data distribution with an unknown mechanism**. It is not a confirmed persistent mechanism (no cause was previously investigated — that is precisely what DQ-004 authorizes), and it is not insufficiently specified (the 26%/1.8s figures are real, dated, first-party CrUX data, not vague or absent). Proceeding to Phase 2 on this basis.

**Population-distribution discipline (binding throughout this investigation):** "26% of mobile page loads" describes a minority-share population distribution over a 28-day aggregate. It is never restated in this investigation or in diagnosis/OD-002…md as "mobile visits are slow," "most mobile visits are slow," or any per-session universal claim.

---

## Phase 2 — Evidence Collection Plan (Role A)

### A. Existing field evidence

Already fully captured in Phase 1 above (EV-017/O-012). No additional CrUX pull was performed — a second automated PageSpeed Insights API attempt would predictably repeat O-012's documented HTTP 429 blocker (no API key configured), and generating a fresh interactive analysis would only reset the 28-day window without adding new distinguishing information. **Decision: existing EV-017 is sufficient field evidence; no second CrUX collection attempted.**

### B. Repeated public timing observations (executed, 25 July 2026, single session)

Multiple timestamped, read-only HTTPS requests were made to konnichiwa.nl using `curl`, a standard HTTP client, from this task's execution environment. This is public retrieval of a live, already-published website — no authentication, no configuration access, no state-changing request.

**Homepage, mobile User-Agent, 5 repeats (06:40:15–06:40:31 UTC):**

| # | Timestamp (UTC) | time_namelookup | time_connect | time_appconnect (TLS) | time_starttransfer | time_total | HTTP/redirects |
|---|---|---:|---:|---:|---:|---:|---|
| 1 | 06:40:15 | 0.002 s | 0.014 s | 0.043 s | 1.018 s | 1.029 s | HTTP/2, 0 redirects |
| 2 | 06:40:19 | 0.003 s | 0.014 s | 0.044 s | 0.926 s | 0.947 s | HTTP/2, 0 redirects |
| 3 | 06:40:23 | 0.002 s | 0.010 s | 0.033 s | 0.840 s | 0.860 s | HTTP/2, 0 redirects |
| 4 | 06:40:27 | 0.002 s | 0.011 s | 0.032 s | 0.745 s | 0.767 s | HTTP/2, 0 redirects |
| 5 | 06:40:31 | 0.002 s | 0.011 s | 0.039 s | 0.870 s | 0.880 s | HTTP/2, 0 redirects |

**Desktop User-Agent, 3 repeats, homepage:** time_starttransfer 1.066 s, 0.905 s, 0.719 s (interleaved with the mobile-UA series above).

**Comparison URLs (mobile UA, one request each), to test site-wide vs. page-specific behavior:**

| URL | time_appconnect | time_starttransfer | time_total | Redirects |
|---|---:|---:|---:|---|
| `/` (homepage) | 0.051 s | 0.865 s | 0.875 s | 0 |
| `/sushi-utrecht/` | 0.042 s | 0.958 s | 0.978 s | 0 |
| `/about-us/` | 0.042 s | 0.739 s | 0.749 s | 0 |
| `/nl/home-nederlands/` | 0.044 s | 0.818 s | 0.835 s | 0 |

**Redirect-chain checks:**

| Requested | Result | Note |
|---|---|---|
| `http://konnichiwa.nl/` | 301 → `https://konnichiwa.nl/` in ~0.025 s | Standard HTTP→HTTPS redirect, negligible |
| `https://www.konnichiwa.nl/` | 301 → `https://konnichiwa.nl/`, retested 3×: 0.688 s, 0.599 s, 0.603 s | An initial single reading of 4.3 s was discarded as a cold-DNS-cache artifact of this task's own execution environment (first lookup of the `www` subdomain in the session) — not a site characteristic; the retest is the recorded value, consistent with the non-www baseline |
| `https://konnichiwa.nl/` (canonical) | 0 redirects | No redirect chain on the canonical URL used by the CrUX/EV-017 report |

**Response headers (homepage, mobile UA):**

```
HTTP/2 200
server: Apache
x-powered-by: PHP/8.4.12
x-pingback: https://konnichiwa.nl/xmlrpc.php
vary: User-Agent
content-type: text/html; charset=UTF-8
alt-svc: h3=":443";ma=180;
```

No `cache-control`, `age`, `x-cache`, `x-cache-status`, `cf-ray`, `x-served-by`, or any other CDN/reverse-proxy-cache signature header was present on any tested page. Resolved IP: `185.104.29.164` (no reverse geolocation or hosting-provider lookup performed — out of scope for read-only public retrieval as defined here).

**Explicit testing-environment limitation:** all timing figures above come from a single execution environment, at a single point in time (25 July 2026, ~06:40–06:41 UTC), from an unknown and unverified network path and geographic location relative to Konnichiwa's real visitor base (94% Netherlands, per O-001). These figures are **not** a substitute for, and do not override, EV-017's real-user CrUX field data. They are a distinguishing technical signal only — see Phase 3/5 for how they are and are not used.

### C. Lab evidence

Not attempted. O-012 already documents that the PageSpeed Insights lab-score portion loads asynchronously and was not captured in either prior fetch; per this task's instruction ("A blocked API, asynchronous tool failure or rate limit is a blocker, not a result"), repeating that same blocked path would not produce new evidence. **Lab data remains unobtained — recorded as missing, not as zero or as a negative finding.**

### D. Restricted evidence (identified, not accessed)

The following would be needed to fully resolve the mechanism beyond what read-only public signals allow, and were **not** accessed, per this task's exclusions:

- Hosting/origin response-time logs (would distinguish application-processing time from queueing/resource-contention time).
- Cache hit/miss logs from any server-side or plugin-level cache (would confirm or refute whether a non-header-exposing cache exists).
- CDN analytics (not applicable if no CDN fronts the origin, per the header evidence above, but not confirmable without Kelvin's hosting dashboard).
- WordPress/PHP/database query timing (e.g., a query-profiling plugin) — would distinguish backend-processing time from a hosting-tier resource limit.
- Deployment or configuration history (would show whether a caching plugin was ever installed, active, or recently disabled).
- Traffic and load history (would test whether elevated TTFB correlates with traffic volume — CE-DQ4-G).

**Evidence request (for Kelvin, optional, not a blocker to this investigation's Phase 5 verdict):** if Kelvin's hosting provider exposes a dashboard showing (a) whether a server-side or CDN page cache is active for konnichiwa.nl, and (b) average PHP/application response time independent of network transit, either would materially strengthen or narrow CE-DQ4-A/CE-DQ4-B below. Not required, not requested as a condition of this investigation's completion.

---

## Phase 3 — Candidate Mechanism Register (Role B, tested by Role C)

| CE ID | Mechanism to Test | Predicted Observable Pattern | Supporting Evidence | Contradicting Evidence | Missing Discriminating Evidence | Falsification Test | Result | Confidence | Causal Status |
|---|---|---|---|---|---|---|---|---|---|
| CE-DQ4-A | Slow or variable origin/backend (application/database) processing | Elevated, relatively consistent per-request wait time across different pages, not explained by network/TLS/redirect overhead | All Phase 2 requests show ~0.72–1.07 s from TLS completion to first byte, across the homepage and three other distinct pages, with DNS/connect/TLS combined under 55 ms — the wait is concentrated almost entirely in the post-TLS, pre-first-byte segment | None found within this test's reach | PHP/DB-level timing (Restricted, not accessed) — cannot confirm the wait is specifically application/database processing rather than a resource-contention queue at the hosting tier | Compared post-TLS wait time across four distinct pages and two User-Agent classes; consistently elevated and non-trivial in every case, not isolated to one page or device type | **Survives with Narrowing** | Medium | Associative — entangled with CE-DQ4-B, see below |
| CE-DQ4-B | Cache misses or inconsistent HTML caching | No `cache-control`/`age`/`x-cache` header; repeat requests to the same URL do not show a faster "warm cache" response | No caching, CDN, or reverse-proxy header found on any of 4 tested pages across 8+ requests; `vary: User-Agent` present (consistent with per-request/per-UA dynamic generation rather than a shared cached artifact); 5 consecutive homepage repeats show no systematic speed-up on later requests (0.75–1.02 s range, non-declining) — exactly the pattern DD-016's own Required Falsification anticipated for this candidate | None found | A private, non-header-exposing cache cannot be fully ruled out from outside signals alone (Restricted: cache hit/miss logs) | Repeated identical requests to the same URL; checked for `cache-control`/`age`/`x-cache` on 4 distinct pages | **Survives** | Medium-High | Descriptive (structural condition observed directly, not inferred) |
| CE-DQ4-C | Geographic/network distance or hosting latency | Real visitors far from the hosting origin experience worse TTFB than near visitors; this task's own test vantage's distance from the origin is unknown | None available — this task's test connect/TLS times were fast (10–50 ms combined), but this says nothing about the geographic distribution of Konnichiwa's actual mobile visitors relative to the hosting origin's physical location, which was not determined | None found; not contradicted, simply untested | Hosting server physical location; real-visitor geographic/network distribution beyond O-001's aggregate "94% Netherlands" (no per-visitor latency data exists) | Not testable with available read-only signals — this task's single-vantage measurement cannot stand in for a distributed real-user sample | **Needs More Evidence** | Low | Unassessable |
| CE-DQ4-D | Redirect, DNS, connection, or TLS overhead | Elevated TTFB accompanied by a redirect chain, slow DNS resolution, or a slow TLS handshake on the canonical URL | Directly contradicted: DNS resolution ~2 ms (warm), TCP connect ~10–20 ms, TLS (appconnect) ~30–50 ms, **0 redirects** on the canonical `https://konnichiwa.nl/` URL used by the CrUX report; the one real redirect found (`http://` → `https://`) completes in ~25 ms | None supporting | None material | Measured DNS/connect/TLS/redirect timing directly on the canonical URL across 8+ requests | **Rejected** | High | Not a mechanism — directly falsified |
| CE-DQ4-E | CrUX aggregation or page-mix effect | A small number of unusually slow pages disproportionately drag down the origin-level 26% figure, while most pages (e.g., the homepage) are individually much faster | Weak counter-evidence: 4 tested pages (homepage, `/sushi-utrecht/`, `/about-us/`, `/nl/home-nederlands/`) show comparable post-TLS wait times (0.74–0.98 s) — no single tested page stood out as dramatically faster or slower | None found | Only 4 of the site's many pages were tested, in one session; the newly-launched `/omakase-utrecht/` and `/teppanyaki-menu/` pages (too new for CrUX data per O-001) and any InDesign-hosted menu content were not tested; cannot rule out a page-mix effect from untested pages | Compared post-TLS wait time across 4 distinct, pre-existing pages | **Needs More Evidence** | Low-Medium | Unassessable beyond the 4 tested pages |
| CE-DQ4-F | Mobile traffic/network mix rather than a site mechanism | Server-observed response time differs materially by device/User-Agent, or (untestable here) real mobile-network/radio conditions explain the tail | Server-side UA test found no material difference (mobile-UA range 0.75–1.02 s; desktop-UA range 0.72–1.07 s, overlapping) — weak evidence against a UA-driven server difference | None found | This test cannot simulate real mobile-carrier network/radio conditions (packet loss, cellular latency, NAT) — a fundamentally different thing from a User-Agent header, and outside what any read-only server-side test can measure | Compared post-TLS wait time by User-Agent (mobile vs. desktop strings) from one fixed vantage | **Needs More Evidence** | Low | Unassessable for the network/radio component specifically |
| CE-DQ4-G | Load or time-of-day variability | TTFB correlates with traffic volume or time of day | None available — all measurements in this investigation were taken within a single ~10-minute window, one time of day, one day | None found; not contradicted, simply untested | Traffic/load history (Restricted, not accessed); repeated measurements across multiple times of day and days | Not testable within this investigation's single session | **Unassessable** | — | — |

No candidate was promoted merely because alternatives lacked evidence — CE-DQ4-D was actively, directly falsified (not merely unsupported), and CE-DQ4-C/E/F/G are explicitly left as Needs More Evidence/Unassessable rather than silently dropped or assumed negative.

**Guardrail check:** no client-side resource (JavaScript execution, images, fonts, or third-party scripts) is named as a TTFB cause anywhere above. The one client-side/third-party reference found in the homepage's HTML (a Font Awesome stylesheet loaded from `cdnjs.cloudflare.com`) is a render-blocking CSS resource that loads *after* the HTML document's own TTFB is already determined — it is not counted as, or connected to, any TTFB mechanism here, and no service worker, redirect, or server-side dependency was found connecting it to time-to-first-byte.
