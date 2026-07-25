# OD-002 — Absence of an HTML/Page Caching Layer Is Consistent With Elevated Baseline Response Time

## Status

**Established Organizational Diagnosis.** Establishment: **Conditional**. Authority: decisions/DD-018, Case-Owner Decision (Kelvin Wong, 25 July 2026). *Previously Candidate Organizational Diagnosis, 25 July 2026, then Survives with Narrowing on independent challenge (Phase 4, below) — established with eleven of decisions/DD-018's conditions accepted as binding.*

**Authoritative formulation (decisions/DD-018, Case-Owner Decision, Condition 2 — supersedes any stronger phrasing elsewhere in this document):**

> "No observable public evidence of HTML cache delivery was found in the bounded measurements. This condition is associatively consistent with the elevated response-time baseline, but does not establish the mechanism behind the 26% poor mobile TTFB tail."

This sentence is the sole authoritative statement of this diagnosis's finding. It does **not** assert that no HTML/page-cache layer exists as an established infrastructure fact — missing cache/CDN response headers are not proof that caching is absent, and consistent timing across repeated requests is supporting context only, not proof of cache misses. The remainder of this document (Diagnosed Mechanism, Falsification History, and other sections below) is preserved unmodified as supporting analysis from the original investigation and challenge, but must be read through, and cited only via, the formulation above. Established **only** for DQ-004, only for the specific URLs, measurements, and observation period documented in diagnosis/DQ-004-investigation.md — see decisions/DD-018's Case-Owner Decision, Diagnosis Scope section, for the full boundary.

## Authorized Question

DQ-004

## Condition Explained

Within the 28-day CrUX field-data window (24 June–21 July 2026), 26% of mobile page loads to konnichiwa.nl are classified "poor" for Time to First Byte (TTFB), an origin-level, experimental-status metric (EV-017/O-012/OC-006). This diagnosis addresses **which structural condition of the response path is implicated**, not the full magnitude or exact cause of the specific 26%-poor tail.

## Diagnosed Mechanism

Direct, dated, read-only inspection (diagnosis/DQ-004-investigation.md, Phase 2B, 25 July 2026) found **no HTML/page-level caching layer** in front of konnichiwa.nl's origin: no `cache-control`, `age`, `x-cache`, or CDN/reverse-proxy header appears on any of four tested pages across repeated requests, and repeated identical requests to the same URL show no "warm cache" speed-up — the exact pattern decisions/DD-016's own Required Falsification anticipated for cache absence. This is recorded as an **associative, evidence-consistent finding**, not a proven causal mechanism: the absence of caching means every request is served fresh by the PHP/Apache origin (`server: Apache`, `x-powered-by: PHP/8.4.12`), which is consistent with, but does not on its own prove, why baseline response times sit in an elevated range. Directly measured DNS, TCP-connect, and TLS-handshake times (combined under ~55 ms across all tests) and the absence of any redirect chain on the canonical URL together rule out network-connection overhead as the source of the observed wait, isolating the elevated time to the post-connection, pre-first-byte segment — the segment where server/application processing of an uncached request would show.

**Explicit entanglement, stated as such (per this task's associative-language and technical-guardrail requirements):** the "absence of caching" condition (CE-DQ4-B) and "backend/application processing time" (CE-DQ4-A) are not independently separable with the read-only signals available. Absence of caching is what exposes every request to backend processing in the first place; they are two descriptions of the same observed request path, not two competing, mutually exclusive mechanisms. This diagnosis does not claim to have distinguished pure "PHP execution time" from "hosting-tier resource contention" — both would produce the same externally-observable pattern, and distinguishing them requires restricted evidence (PHP/DB query timing, hosting resource logs) that was not accessed.

## Contributing Conditions

- `vary: User-Agent` on the origin response is consistent with per-request/per-device dynamic generation rather than a shared cached artifact, reinforcing the caching-absence finding.
- Post-TLS wait time was elevated (0.72–1.07 s across all samples) but consistently **below** Google's own TTFB "poor" threshold (>1.8 s) in every one of this task's own test requests — meaning this investigation's supplementary testing characterizes a real, structural *baseline* condition, but did not reproduce the specific tail behavior that drives the CrUX-reported 26%-poor classification for real mobile visitors.

## Rejected Explanations

- **CE-DQ4-D (Redirect, DNS, connection, or TLS overhead)** — directly falsified: DNS/connect/TLS combined under ~55 ms across all tests; zero redirects on the canonical URL; the one real redirect found (`http://` → `https://`) completes in ~25 ms.

## Unresolved Alternatives

- **Geographic/network distance (CE-DQ4-C)** — this investigation's test vantage point's distance from the hosting origin, and from Konnichiwa's real (94% Netherlands, per O-001) visitor base, was not determined and cannot be inferred from available signals.
- **CrUX aggregation/page-mix effect (CE-DQ4-E)** — only 4 of the site's pages were tested, all showing comparable timing; a page-mix effect among untested pages (including the newly-launched omakase/teppanyaki pages and any InDesign-hosted menu content) cannot be ruled out.
- **Mobile network/radio conditions specifically (CE-DQ4-F)** — this investigation could only test server behavior by User-Agent header (no material difference found), which does not test real mobile-carrier network or radio conditions, a fundamentally different and untestable-here dimension.
- **Load or time-of-day variability (CE-DQ4-G)** — Unassessable; all measurements were taken within a single ~10-minute session, one time of day, one day.
- Whether the elevated baseline is driven specifically by PHP/application execution time versus a hosting-tier resource limitation — both would produce the same externally observable pattern found here, and distinguishing them requires restricted evidence not accessed in this investigation.

## Supporting Understanding

- OU-004 — Technical Foundation Duality

## Supporting Claims and Evidence

- OC-006 — Passing Core Web Vitals With an Isolated Mobile Latency Exception
- EV-017 (Chrome UX Report field data, O-012.md)
- diagnosis/DQ-004-investigation.md, Phase 2B (direct, dated, read-only timing and header observations, 25 July 2026)

## Scope

- Query themes: not applicable (this is a technical-performance diagnosis, not a search-theme diagnosis)
- Surfaces: konnichiwa.nl origin, HTTPS, HTTP/2 — the canonical `https://konnichiwa.nl/` URL and three comparison pages (`/sushi-utrecht/`, `/about-us/`, `/nl/home-nederlands/`)
- Geography: EV-017's field data is not geographically broken out; this investigation's own supplementary testing was from a single, unverified network vantage point — neither establishes a specific geography
- Period: EV-017's 28-day CrUX window (24 June–21 July 2026); supplementary testing performed 25 July 2026, ~06:40–06:41 UTC, single session
- Devices: EV-017 reports mobile and desktop separately (TTFB mobile-only in the field data); supplementary testing compared mobile and desktop User-Agent strings only, not real device/network conditions

## Confidence

- Level: **Medium** for the caching-absence finding (CE-DQ4-B) itself; **Low-Medium** for its role as a contributor to the specific 26%-poor CrUX figure
- Rationale: the absence of any caching/CDN header, combined with non-declining repeat-request timing, is a direct, positively observed, dated technical fact — not an inference from silence. However, this diagnosis's own supplementary measurements never reproduced TTFB values in the "poor" range Google's CrUX report describes, so the connection between the observed structural condition (no caching) and the specific 26%-poor tail remains associative and partially untested, not fully established.

## Limitations

- Lab data (Lighthouse) remains unobtained (O-012) — this diagnosis uses field data (EV-017) and this investigation's own supplementary read-only timing only, never lab data, per DD-016's binding condition.
- TTFB is marked experimental by Google in the source report — its threshold classification carries inherently lower certainty than LCP/INP/CLS.
- This diagnosis's supplementary testing is a single-session, single-vantage-point sample (25 July 2026) — it does not represent the real, geographically and temporally diverse mobile visitor population EV-017's 28-day CrUX window reflects.
- Restricted evidence (hosting logs, PHP/DB query timing, CDN analytics, deployment history, traffic/load history) was not accessed and could materially sharpen or revise this finding.
- No page-level isolation exists in EV-017 itself (origin-level aggregate, per OC-006's own Scope) — this diagnosis's own 4-page comparison is a partial, not exhaustive, attempt to address that gap.

## Falsification History

See diagnosis/DQ-004-investigation.md, Phase 3 (full Candidate Mechanism Register). Summary: 7 candidates tested; 1 directly falsified (CE-DQ4-D, redirect/DNS/TLS overhead); 1 survives (CE-DQ4-B, caching absence — this diagnosis's core finding); 1 survives with narrowing, entangled with CE-DQ4-B (CE-DQ4-A, backend/application processing); 4 remain Needs More Evidence or Unassessable (CE-DQ4-C, CE-DQ4-E, CE-DQ4-F, CE-DQ4-G) and are preserved as open, not silently resolved.

## What This Diagnosis Does Not Establish

- The specific magnitude or exact cause of the 26%-poor CrUX classification — this diagnosis identifies a structural condition (no caching layer) consistent with elevated baseline response time, not a proven, complete explanation of the reported tail.
- Ranking impact — not tested, not claimed.
- Conversion, reservation, or revenue impact — excluded per UR-003's Attribution Constraint (OC-007), inherited via OU-004.
- User experience impact of any specific magnitude.
- Whether the mechanism is application/PHP execution time specifically, versus hosting-tier resource contention — both remain entangled and unresolved with available evidence.
- Geographic, page-mix, or real mobile-network contributions (CE-DQ4-C, CE-DQ4-E, CE-DQ4-F) — all remain open, unresolved alternatives, not excluded.
- Time-of-day or load-based variability (CE-DQ4-G) — Unassessable from a single testing session.
- That any intervention (caching, hosting change, CDN, configuration) will or would improve TTFB — no intervention was tested, proposed, or implied.

## Design Boundary

No design or intervention is authorized by this diagnosis. This record does not select, recommend, or imply any hosting, caching, CDN, server, or configuration action. Any future design response to this diagnosis requires a separate Design Authorization Gate, not implied or pre-approved here.

---

## Diagnosis Challenge (Phase 4 — Role D independent challenge against the strongest surviving alternative)

*Independent challenge, performed only after Phase 3 (Candidate Mechanism Register) was complete. The strongest surviving alternative tested here is CE-DQ4-A (backend processing) as a standalone, separable claim from CE-DQ4-B — the challenge asks whether OD-002 improperly resolves that entanglement in its own favor.*

1. **Is the target condition real after re-verification?** Yes — Phase 1 re-confirmed the 26%-poor TTFB figure and its origin-level, experimental-status, field-data nature directly against EV-017/O-012.
2. **Does the mechanism explain the condition rather than assume it?** Partially, and this is the diagnosis's central limitation, already stated directly in Confidence and "What This Diagnosis Does Not Establish": the caching-absence finding is real and positively observed, but this investigation's own supplementary tests never reproduced the "poor" (>1.8 s) tail — so the mechanism is evidence-consistent with, not a demonstrated full explanation of, the reported condition.
3. **Is positive evidence present?** Yes — direct, dated header inspection and repeat-request timing, not an inference from absence of contrary evidence.
4. **Did the mechanism survive a genuine falsification test?** Yes for CE-DQ4-B specifically (repeat-request non-acceleration, the exact test DD-016 anticipated); CE-DQ4-D was separately and directly falsified, strengthening confidence that the observed wait is not connection overhead.
5. **Does the wording exceed the measured scope?** Checked — Condition Explained and Scope are held to the tested pages, the stated CrUX window, and the single supplementary testing session; no claim is made about all pages, all times, or the full real-visitor population.
6. **Are field and lab data conflated?** Checked — this diagnosis uses only EV-017 (field) and this investigation's own supplementary timing (also real, live requests, not lab/synthetic scores); Lighthouse lab data is explicitly named as unobtained and unused.
7. **Is a client-side resource misclassified as a direct TTFB cause?** No — the one client-side/third-party resource found (a Font Awesome stylesheet from cdnjs.cloudflare.com) is explicitly excluded per the technical guardrail; no service worker, redirect, or server-side dependency connects it to TTFB.
8. **Is correlation represented as cause?** Risk identified and addressed: the Diagnosed Mechanism section explicitly states this is "associative, evidence-consistent," not proven-causal, and explicitly declines to resolve whether the mechanism is PHP execution time or hosting-tier contention.
9. **Is a proposed fix hidden inside the diagnosis?** No — the Design Boundary section and "What This Diagnosis Does Not Establish" both explicitly exclude any hosting, caching, CDN, or configuration recommendation.
10. **Would the diagnosis survive if no intervention were permitted?** Yes — the diagnosis is purely explanatory/structural; nothing in its content depends on, requires, or implies that caching, hosting, or configuration will or should change.

**Outcome: Survives with Narrowing.** Narrowing applied to test 2/8: the Diagnosed Mechanism and Confidence sections explicitly state the finding is associative and does not fully explain the specific 26%-poor tail magnitude, and the CE-DQ4-A/CE-DQ4-B entanglement is stated directly rather than resolved in favor of either candidate individually. This is the post-narrowing version presented above, not a separate draft.
