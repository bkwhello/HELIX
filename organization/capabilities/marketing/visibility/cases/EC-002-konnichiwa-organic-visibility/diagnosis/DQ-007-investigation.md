# DQ-007 Investigation — Google Business Profile Decline Explanation
---

**Status: Completed — Evidence Insufficient.** Authoritative, closed outcome — decisions/DD-020, Case-Owner Decision (Kelvin Wong, ACCEPTED WITH CONDITIONS, 25 July 2026). No Candidate Organizational Diagnosis was created; no OD-### identifier was created or consumed. `dq_007_diagnosis_established: false` (unchanged — there was never an OD to establish); `dq_007_acceptance_decision: Accepted With Conditions`. All candidate results below (Phase 3, Phase 5) are preserved unmodified as the authoritative record, subject to thirteen binding conditions recorded in full in decisions/DD-020's Case-Owner Decision section (notably: the decline remains classified only as a verified GBP profile-engagement decline; the non-monotonic pattern is preserved; CE-DQ7-B/C/J/L remain Weakly Supported only within their narrow scopes; no candidate may be presented as Associatively Consistent or causal; the Birdeye benchmark and the June data-incident forum report remain non-official/unverified; the GA4-integration finding excludes only that specific mechanism, not other Google reporting changes; E-05/E-06/E-07 remain Partial; E-03/E-10 remain Structurally Unavailable; CR-006 remains Open, 605/625 unreconciled; CE-11 remains Unsupported only within its thirteen declared categories; current snapshots remain unsuitable as complete historical trend evidence). Reopening this question requires materially new evidence and a new explicit case-owner decision. See Phase 6.

*Executed under decisions/DD-016's Case-Owner Decision (Kelvin Wong, 25 July 2026), which Authorized DQ-007 With Conditions: OC-002 remains a standalone target condition; E-05/E-06/E-07's Partial limitations remain binding exactly as recorded; E-03 and E-10 remain fully Blocking for seasonality/discovery-composition candidates; CR-006 remains Open and unreconciled; the twelve already-registered competing explanations must be tested per the falsification method; no new candidate without separate scope approval; Evidence Insufficient is an explicitly acceptable outcome. This task's own Section 3–13 instructions additionally authorize a restructured twelve-candidate register (CE-DQ7-A through L) for this specific execution, which supersedes DD-016's original CE-01–12 labels while preserving every underlying prior classification and evidence gap — no candidate's prior status is discarded, only re-labeled and cross-referenced. Four roles kept explicitly separate: Role A (Evidence Investigator), Role B (Competing Explanation Constructor), Role C (Falsification Challenger), Role D (Diagnosis Gate Reviewer, see decisions/DD-020). No role used a later role's conclusion as evidence for an earlier role.*

## Authorized Question

DQ-007 — What can explain the documented Google Business Profile visibility decline during February–July 2026?

## Authorized Target Condition (decisions/DD-016, Phase 5)

The six-month, all-metric GBP engagement decline (OC-002), February–July 2026 — a Justified, standalone Claim.

---

## Phase 1 — Reconstruct the Decline (Role A)

Verified directly against observations/O-013.md's EV-019 (chart-position re-reading of EV-015), not assumed from OC-002's summary prose.

| Metric | Feb | Mrt | Apr | Mei | Jun | Jul | 6-mo total (exact, chart) | Source | Aggregation |
|---|---:|---:|---:|---:|---:|---:|---:|---|---|
| Interacties met Bedrijfsprofiel | ~1,980 | ~1,650 | ~1,350 | ~1,380 | ~1,130 | ~700 | 8,109 | EV-019 (chart-position estimate) | GBP property, aggregate |
| Websiteklikken | ~1,450 | ~1,120 | ~950 | ~950 | ~750 | ~420 | 5,410 | EV-019 | GBP property, aggregate |
| Opgevraagde routes | ~330 | ~300 | ~300 | ~270 | ~260 | ~205 | 1,653 | EV-019 | GBP property, aggregate |
| Telefoongesprekken | ~110 | ~90 | ~65 | ~68 | ~58 | ~35 | 418 | EV-019 | GBP property, aggregate |
| Menucontent bekeken | ~98 | ~82 | ~55 | ~88 | ~48 | ~13 | 385 | EV-019 | GBP property, aggregate |
| Afspraken | ~58 | ~48 | ~42 | ~44 | ~38 | ~25 | 243 | EV-019 | GBP property, aggregate |

**Exact period:** February 2026 – July 2026 (6 monthly points; July confirmed likely partial — screenshots taken 23 July 2026, per O-002.md/O-013.md).

**Direction and magnitude:** all six metrics fall from February to July; Feb→Jul percentage change ranges from ~-38% (Opgevraagde routes) to ~-87% (Menucontent bekeken) — see O-013's own percentage table. These are chart-position estimates, not exact platform exports (no CSV/API access existed in Kelvin's interface).

**Recovery/plateau periods — the established correction, preserved exactly:** the decline is **not strictly monotonic**. All six metrics show the same three-phase shape: a steep decline February→April, a **flat-to-visibly-higher segment around April→May** (clearest in Menucontent bekeken: ~55→~88, close to March's level; also visible in Telefoongesprekken, Interacties, and Afspraken; Websiteklikken and Opgevraagde routes show their flattest segment one month earlier, March→April), then the decline **resumes and steepens June→July** — the single steepest month-over-month drop in the window for every metric. **This investigation does not rewrite this as "continuous monthly decline" or "no recovery" anywhere below.**

**Limitations:** visual chart-position estimates, not exact exports; internal consistency check only (each metric's six points sum within ~1–5% of the chart's own stated total); July mechanically partial, depressing that one point specifically (does not, by itself, explain the preceding five months).

**Confidence:** Medium-High for the existence, overall direction, and non-monotonic shape (consistent across all six independently-charted metrics); Medium for the precision of individual monthly figures.

### Target-condition classification

Per this task's required classification:

1. **A verified visibility/performance decline** — **confirmed.** All six metrics are direct GBP profile-interaction counts (an already-discovered profile's engagement), not survey or estimated figures.
2. A business-demand decline — **not confirmed.** No comparable monthly trend exists in any other channel (Search Console: single 61-day aggregate only; GA4: no data during this window at all; Guestplan: 90-day total only, not a monthly series — O-013, E-13). A GBP-side engagement decline is not the same claim as "fewer people wanted to visit Konnichiwa," and this investigation does not conflate the two.
3. A reservation decline — **not confirmed, and explicitly excluded.** GBP's "Afspraken" (appointments-type actions) are profile-level click/action events, not confirmed completed reservations. Guestplan (O-011) is a separate system with its own 576-reservation, 90-day total, not linked to any GBP action (OC-007's own Attribution Constraint). **No GBP interaction is classified as a completed reservation anywhere in this investigation.**
4. An unresolved mixture — not applicable; classification (1) applies cleanly, with (2) and (3) explicitly and cleanly excluded, not left ambiguous.

---

## Phase 2 — Evidence Sufficiency by Domain (Role A)

| Domain | Status | Basis |
|---|---|---|
| GBP profile changes (general) | **Partial** | E-05/EV-021: current configuration thoroughly documented and dated (2026-07-24); three confirmed, Google-attributed transitions exist but carry no transition date |
| Categories, attributes, links, hours | **Partial** | Same as above — current state only for hours/categories/links; the three confirmed attribute differences (Hoogtepunten, Planning, Serviceopties) are undated changes |
| Reviews and owner responses | **Partial** | E-06/EV-022: 8-review sample, approximately dated within the window (earliest ~week of 2026-04-24); no full export, no aggregate total/rating visible in this sample |
| Photos and posts | **Partial (Posts) / Not Collected (Photos)** | E-07/EV-023: 5 Google Posts, all "vorig jaar" (likely pre-window); the separate GBP Photos tab was never supplied — this is a distinct, uncollected sub-domain, not merely "Partial" |
| Website changes | **Sufficient for the narrow dated-change question; Structurally limited for undated conditions** | E-08: cross-referenced against OC-005/OC-006/HV-INT-002 — no website change is dated within the Feb–Jun 2026 decline window; OC-005's three conditions have no confirmed change date and cannot be placed on this timeline either way |
| Operational restrictions | **Sufficient within declared scope** | E-11/EV-020: Completed — thirteen owner-declared categories, all "No," Medium-confidence Owner Declaration; cannot rule out unobserved or minor conditions outside those thirteen |
| Underlying demand | **Structurally Unavailable as a monthly trend; Partial as a period total** | E-13: Guestplan provides a 90-day total (576 reservations) but not a monthly series overlapping the full GBP window |
| Seasonality / prior-year comparison | **Structurally Unavailable** | E-10: no prior-year (2025) GBP or Guestplan data exists anywhere in this case |
| Competitor activity | **Structurally Unavailable / Blocked** | E-09: only current-state, non-contemporaneous competitor snapshots (O-003, O-010); no dated competitor history for Feb–Jul 2026, no practical read-only source identified |
| Query, device, or surface mix | **Structurally Unavailable** | E-03: only a 6-month aggregate device/platform split and top-12 term list exist; no monthly breakdown is exposed in Kelvin's interface |
| Google product or measurement changes | **Partial** | E-12 plus this investigation's Phase 4 research: one confirmed-but-undated official change (direction-request counting); one confirmed, dated, mechanism-irrelevant change (GA4 integration, see Phase 4); one unconfirmed, unofficial community lead (Phase 4) |
| Reservation attribution | **Structurally Unavailable / Blocked** | OC-007's own Measurement/Attribution Constraint: no GBP action links to any confirmed reservation; E-13's only cross-reference is a single qualitative, non-quantified "Google source peak ~20–21 June" observation in Guestplan's own chart |

No Partial item is promoted to complete evidence anywhere in this table or below.

---

## Phase 3 — Candidate Explanation Register (Role B, tested by Role C)

Prior classifications (claims/OC-002-competing-explanations-register.md, CE-01–12) are preserved and cross-referenced; none is discarded. New evidence (this investigation's Phase 4 research) is incorporated only where it genuinely bears on a specific candidate.

| Candidate | Explanation | Cross-ref | Predicted pattern | Supporting evidence | Contradicting evidence | Missing evidence | Temporal relationship | Directional consistency | Result | Confidence | Causal status |
|---|---|---|---|---|---|---|---|---|---|---|---|
| CE-DQ7-A | GBP profile/category/attribute changes | CE-12 | A dated attribute/category change precedes or coincides with a metric drop | Three confirmed, Google-attributed HUIDIG-vs-VORIGE differences exist (E-05) | No mechanism is established connecting attribute-level changes to interaction-count declines | Transition date of each change (unknown) | **Cannot be assessed** — no date exists to compare against the decline's phases | Cannot be assessed | **Unassessable** | Low | Not established |
| CE-DQ7-B | Reduced or stale Google Posts activity | CE-06 | Posting frequency drops before or during the engagement decline | All 5 visible posts labeled "vorig jaar," relative to confirmed 2026-07-24 capture date — likely predating the Feb 2026 window entirely | None found | Exact post dates; confirmation the visible list is exhaustive | **Consistent with a pre-existing gap, not a within-window change** — if posting stopped before Feb 2026, it cannot explain why engagement *declined* rather than being low throughout | Directionally plausible but untested as a trigger | **Weakly Supported, narrow scope only** | Low-Medium | Evidence insufficient |
| CE-DQ7-C | Review recency, volume, or owner-response pattern | CE-07 | Review velocity or response rate visibly worsens within the window | 8-review sample, approximately dated within the window (~2026-04-24 to ~2026-07-17), 0/8 visible owner responses, 4.75★ average | None found | Full monthly review-count export; response-rate history before this sample | Sample sits within the window, including the June–July acceleration, but is too sparse (8 points, ± days each) to show a trend shape matching the metric decline's own three-phase pattern | Cannot be established — no comparable trend exists to align against | **Weakly Supported, narrow scope only** | Low-Medium | Evidence insufficient |
| CE-DQ7-D | Reduced photo activity or photo engagement | — (new) | Photo upload frequency or photo-driven engagement drops within the window | None — the GBP Photos tab was never supplied (E-07) | None (nothing to contradict) | The entire Photos tab — not merely incomplete, genuinely uncollected | Cannot be assessed | Cannot be assessed | **Unassessable — Not Collected** | None | Not established |
| CE-DQ7-E | Konnichiwa-side operational restriction | CE-11 | A closure, capacity cut, staffing shortage, or concept change coincides with the decline | E-11/EV-020: Kelvin answered "No" to all 13 examined operational categories, including a specific check for a promotional/event cause of the April–May movement | None found | Independent, system-level confirmation (no GBP hours/attribute change log exists); cannot rule out an unobserved or minor condition | Absent in the declared categories | Not applicable | **Unsupported within declared scope** (13 categories only — not expanded beyond that scope) | Medium (Owner Declaration) | Not established |
| CE-DQ7-F | Genuine decline in underlying demand | CE-10 | A real, quantified demand-side metric falls in parallel with GBP engagement | Guestplan (90-day total, 576 reservations) shows a qualitative "Google" source peak around 20–21 June — within the steepest part of the GBP decline | The GBP decline (~-65% to -87%) is far steeper than anything visible in this single qualitative Guestplan cross-reference; the peak's existence weakly argues against a matching collapse in Google-attributed reservations | Monthly Guestplan trend; prior-year comparison | A single qualitative peak sits inside the window, but does not track the metric's own three-phase shape | Weakly contradictory (peak, not decline, visible in the one available cross-reference) | **Unassessable, weakly challenged** | Low | Not established |
| CE-DQ7-G | Seasonal demand pattern | CE-01 | The decline follows a known hospitality seasonal curve | None specific | The three-phase shape (steep decline, plateau, steeper decline) does not resemble a simple single-season curve; a Feb→Jul window would more typically show a spring/summer uptick for hospitality, not a decline | No prior-year (2025) data exists anywhere in this case (E-10, fully Blocking, per this task's explicit condition) | Cannot be assessed | Cannot be assessed | **Unassessable** — not inferred from proxy data, per this task's explicit condition | None | Not established |
| CE-DQ7-H | Competitor visibility or activity increase | CE-05 | A competitor's GBP presence strengthens during the same window | O-003 (single 24 July snapshot), O-010 (22 July, current-state only) identify Konnichiwa's competitors but with no dated history | None found | Dated competitor GBP history for Feb–Jul 2026 — no practical read-only source exists | Cannot be assessed — only current-state snapshots exist | Cannot be assessed | **Unassessable** | Low | Not established |
| CE-DQ7-I | Query, device, or Google-surface mix change | CE-04 (+E-03) | The discovery-source or device mix shifts measurably during the window | O-013 E-03: only a 6-month aggregate device/platform split (Maps mobile 50%, Search mobile 35%, Search desktop 13%, Maps desktop 2%) exists | None found (also none ruled out) | Monthly views/search-term or device-mix breakdown — not exposed in Kelvin's current GBP interface | Cannot be assessed — no monthly breakdown exists to compare | Cannot be assessed | **Unassessable** | Low | Not established |
| CE-DQ7-J | Google algorithm, product, or reporting change | CE-02 (+ new research) | A dated, mechanism-relevant Google-side change coincides with the decline or its acceleration | E-12 (official): Google's Help page confirms an undated change to how unique direction requests are counted. **New (Phase 4):** a confirmed, *dated* GA4/Business-Profile metrics integration (~8–10 June 2026) exists, but is confirmed **not** to alter the native GBP performance dashboard Konnichiwa's own screenshots (EV-015) are drawn from — see Phase 4 | The same three-phase shape appears across all six metrics, not only Routes (which a single counting-method change would not fully explain); the GA4 integration is confirmed to leave the native dashboard's own numbers unchanged, directly weakening a "GA4 rollout changed what Konnichiwa's screenshots show" hypothesis | The direction-request counting change's effective date remains unknown; a June 2026 community report of a GBP data-refresh issue (Phase 4) could not be confirmed as applicable to Konnichiwa's account or interface | Direction-request change: cannot be dated. GA4 integration: dated (~8–10 Jun 2026), inside the window, but **directly falsified as a mechanism** for the native-dashboard numbers | GA4 integration: falsified. Direction-request counting: cannot be assessed | **Weakly Supported (direction-request counting only, narrow); GA4 mechanism Rejected; community data-refresh report Unassessable/unconfirmed** | Low | Not established |
| CE-DQ7-K | Website or technical change during the decline window | CE-08 (+E-08) | A website change is dated within Feb–Jul 2026 and plausibly connects to GBP-driven engagement | None — the only confirmed website change (HV-INT-002 go-live) occurred 22 July 2026, one day before the GBP screenshots and at the very end of the window | OC-005's three conditions have no confirmed change date and cannot be shown to be new within this window — a pre-existing, unchanged condition cannot explain a mid-window *decline* | Whether any of OC-005's three conditions changed state (newly appeared vs. always present) during this window | No dated in-window website change exists to test | Not applicable | **Unassessable as a trigger; Unsupported as an explanation for a mid-window decline specifically** | Low | Not established |
| CE-DQ7-L | Measurement, aggregation, or export artifact | CE-03 (+ new research) | Reporting mechanics, not real activity, explain part or all of the pattern | O-013/O-002 confirm July is likely a partial month (mechanically depresses that one point); **new (Phase 4):** an unconfirmed community forum thread reports a GBP "performance data not updating" issue starting 13 June 2026 — a title-level lead only, could not be verified for scope, official acknowledgment, or applicability to Konnichiwa's account | The decline is visible across five full months (Feb–Jun) before the partial July point — a partial final month, or an unconfirmed mid-June reporting issue, cannot explain the preceding four to five months | Full resolution/confirmation of the 13 June 2026 community report; any official Google acknowledgment or scope statement | July partial-month effect: confirmed, narrow. 13 June report: unconfirmed, could not be verified as applicable | Partial-month: consistent with, but insufficient to explain, the broader pattern. 13 June report: cannot be assessed | **Weakly Supported, narrow scope only** (partial-month effect on July specifically); **Needs More Evidence** (13 June community report — not adopted, not dismissed) | Low-Medium | Not established |

No candidate was promoted merely because alternatives lack evidence. CE-DQ7-G (seasonality) and CE-DQ7-I (query/device mix) remain strictly Unassessable, not inferred from any proxy data, per this task's explicit binding condition.

---

## Phase 4 — Additional Read-Only Research (Role A)

Existing case evidence was used first (Phase 1–3 above draw entirely on already-collected O-013/EV-015/EV-019–024 material). Three new, public, read-only sources were consulted to test CE-DQ7-J and CE-DQ7-L specifically. No authenticated GBP setting was accessed or changed; no post, review response, hours edit, attribute edit, or photo upload occurred.

| # | Title | Publisher | Publication/update date | Access date | URL | Proposition tested | Limitations |
|---|---|---|---|---|---|---|---|
| 1 | GA4 Business Profile Integration coverage | digitalapplied.com | Not stated precisely; discusses a ~8–10 June 2026 rollout | 25 July 2026 | https://www.digitalapplied.com/blog/google-analytics-business-profile-local-metrics-2026 | Whether a June 2026 GBP/GA4 integration changed the native GBP performance dashboard's own reported numbers | Secondary source; rollout date itself is the author's synthesis of "trade coverage and Google's own changelog," not a reproduced official Google statement; the *metric list* is attributed to Google's own Help documentation, the *date* is not |
| 2 | State of Google Business Profile 2026 | birdeye.com | 29 April 2026 | 25 July 2026 | https://birdeye.com/blog/state-of-google-business-profiles/ | Whether a broad, platform-wide 2026 decline pattern could explain Konnichiwa's specific decline magnitude | Vendor/secondary source, not an official Google source; undisclosed methodology beyond "biggest global brands using Birdeye"; measures "impressions" (a views/discovery metric), not the "interactions/actions" category OC-002 tracks; **not adopted as a Google-official finding** |
| 3 | "Google Business Profile Performance Data Not Updating Since June 13, 2026" | Google Business Profile Community (user forum) | Thread title dated 13 June 2026 | 25 July 2026 | https://support.google.com/business/thread/443127037/ | Whether a documented, dated GBP reporting/data-pipeline issue could explain part of the window | **Community forum, not an official Google announcement or changelog**; full thread content could not be retrieved (truncated); no official acknowledgment, scope, or resolution could be confirmed; **not verified as applicable to Konnichiwa's account, region, or interface** — recorded as an unconfirmed lead only |

**Findings applied to Phase 3, with explicit temporal/mechanism correspondence testing (per this task's binding rule — a general Google update is not evidence that it caused Konnichiwa's decline without both):**

- Source 1 directly **falsifies** a specific candidate mechanism within CE-DQ7-J: the GA4 integration is dated and inside the window, but is confirmed **not** to alter the native GBP dashboard Konnichiwa's own screenshots come from — temporal correspondence exists, mechanism correspondence does not, so this sub-hypothesis is Rejected, not merely unsupported.
- Source 2 is **not adopted** as evidence of cause — it measures a different metric category (impressions/views, not interactions/actions), lacks official Google corroboration, and its own data shows the industry-wide *action*-category decline (~5%) is far smaller than Konnichiwa's own (~57–87%) — if anything, this **weakens** a generic "this is just the 2026 industry pattern" framing for the *magnitude* observed, rather than supporting it. Recorded as context only, per this task's explicit instruction to prefer official Google sources for Google metric/product claims and never treat a general update as evidence of causing Konnichiwa's specific decline.
- Source 3 is recorded as an **unconfirmed, unverifiable lead** — genuinely dated (13 June 2026, inside the window, close to the June–July acceleration) but not corroborated by any official source and not confirmed applicable to Konnichiwa. It is neither adopted nor dismissed; it is the clearest concrete candidate for future evidence collection (see Phase 6).

No blocker prevented any of this research from completing — all three sources were publicly accessible without authentication.

---

## Phase 5 — Relationship and Causal Assessment (Role C)

For every candidate reaching at least "Weakly Supported" (CE-DQ7-B, C, J, L):

| Candidate | 1. Temporal relationship | 2. Directional consistency | 3. Mechanism correspondence | 4. Alternative coverage | 5. Evidence strength | 6. Causal status |
|---|---|---|---|---|---|---|
| CE-DQ7-B (Posts gap) | Posts likely predate the window entirely — a pre-existing condition, not a within-window trigger | Cannot be aligned to the three-phase shape (no dated points to compare) | No mechanism tested connecting post absence to interaction-count decline specifically | Does not exclude any other candidate | Sample-derived (5 posts, relative label only) | **Evidence insufficient** |
| CE-DQ7-C (Review pattern) | Sample sits within the window but is too sparse (8 points) to align to the three-phase shape | Cannot be established | No mechanism tested connecting a zero-response sample to interaction-count decline | Does not exclude any other candidate | Sample-derived (8 reviews, approximate weeks) | **Evidence insufficient** |
| CE-DQ7-J (direction-request counting, narrow) | Change confirmed real; effective date unknown — cannot be placed relative to any phase of the decline | Cannot be established | Plausible for Opgevraagde routes specifically; **does not extend to the other five metrics**, which show the identical three-phase shape | Explicitly does not cover Interacties, Websiteklikken, Telefoongesprekken, Menucontent, or Afspraken | Official Google source, but undated | **Evidence insufficient** |
| CE-DQ7-L (partial July / 13 June report) | July-partial: confirmed, narrow, final point only. 13 June report: dated, inside window, unconfirmed applicability | July-partial: consistent only with the final point, not the preceding five months. 13 June report: cannot be established | July-partial: mechanical, well-understood mechanism, narrow scope. 13 June report: no confirmed mechanism, no confirmed applicability to Konnichiwa | Neither explains the Feb–May portion of the decline | July-partial: High for its own narrow claim. 13 June report: Low, unconfirmed | **Evidence insufficient** (July-partial, though real, does not rise to "associatively consistent" for the full pattern; 13 June report remains unconfirmed) |

**No candidate reaches "Associatively consistent" or "Weakly supported mechanism" for the decline as a whole** — each surviving candidate at best explains one narrow slice (one metric, one month, or an undated possibility) of a six-metric, six-month, three-phase pattern. No wording anywhere in this investigation uses "caused," "led to," "resulted in," or equivalent language, per this task's binding rule — the case contains no independent evidence supporting causality for any candidate.

---

## Phase 6 — Diagnosis Construction

**No Candidate Organizational Diagnosis is created.** No candidate explanation achieves distinguishing positive support across the full six-metric, six-month, three-phase pattern:

- CE-DQ7-A, D, F, G, H, I remain Unassessable (or Unassessable — Not Collected for D) — no dated or comparable evidence exists to test them at all.
- CE-DQ7-E remains Unsupported within its declared thirteen-category scope — not expanded beyond that scope, per this task's explicit rule.
- CE-DQ7-B, C, J, L each reach "Weakly Supported" only for a narrow sub-scope (a pre-existing gap, a sparse sample, one of six metrics, or one of six months) — none, individually or combined, accounts for the full pattern, and this investigation does not manufacture a combined narrative the evidence does not support.
- New Phase 4 research directly falsified one specific candidate mechanism (GA4 integration → native dashboard) and left one lead genuinely open but unconfirmed (the 13 June 2026 community report).

**Per this task's explicit rule, the size and importance of OC-002 as this case's largest finding is not a reason to force a diagnosis.** This investigation records the correct, honest outcome instead: real evidence gaps remain (E-05 transition dates, a full E-06 export, the E-07 Photos tab, E-03/E-10's structural unavailability, and the unconfirmed 13 June 2026 community report), and no candidate can currently be distinguished from the others.

**Minimum evidence required to reopen this question:**
1. The calendar date(s) of the three confirmed E-05 GBP attribute-change transitions.
2. A fuller GBP review export (aggregate count/rating visible, more than the current 8-review sample) or the GBP-native response-rate figure if exposed.
3. The GBP Photos tab (upload dates, frequency) — currently entirely uncollected.
4. Confirmation, from Kelvin's own GBP account or an official Google source, of whether the 13 June 2026 "performance data not updating" community report applied to Konnichiwa's account.
5. Any monthly (not aggregate) Search Console, GA4, or Guestplan trend overlapping the Feb–Jul 2026 window, to test CE-DQ7-F/I against a real comparison series.

No OD-### identifier is consumed by this investigation.

---

## Phase 7 — Independent Challenge (Role D, against the investigation's own Evidence Insufficient conclusion)

*Independent challenge, performed only after Phase 6 was complete, testing whether "no candidate is distinguishable" is itself a rigorous conclusion rather than a default.*

1. **Measurement artefact** — genuinely tested (CE-DQ7-L): the July partial-month effect is confirmed and narrow; the 13 June 2026 community report is a real, dated lead, correctly left unconfirmed rather than either adopted or dismissed.
2. **Genuine demand change** — genuinely tested (CE-DQ7-F): the one available Guestplan cross-reference (a qualitative peak, not a matching collapse) was found and weighed, not ignored; correctly left Unassessable given only a 90-day total exists.
3. **Seasonality** — genuinely excluded from proxy inference (CE-DQ7-G), per this task's explicit binding condition and E-10's full Blocking status — not silently assumed away, not guessed from a generic seasonality prior.
4. **Google reporting/product change** — genuinely tested with new research (CE-DQ7-J): one sub-hypothesis (GA4 integration) was actively falsified with a confirmed mechanism finding, not merely left unsupported; the direction-request-counting change's real-but-undated status is preserved from E-12, not overstated.
5. **Competitor change** — genuinely tested (CE-DQ7-H): existing current-state snapshots were checked and found insufficient; no fabricated competitor history was substituted.
6. **Incomplete E-05/E-06/E-07 history** — explicitly named as the leading reason no candidate reaches distinguishing support (CE-DQ7-A, B, C); not glossed over.
7. **Unavailable E-03/E-10 evidence** — explicitly named as blocking CE-DQ7-G and CE-DQ7-I entirely; not worked around with an assumption.

**Outcome: Survives.** The Evidence Insufficient conclusion is confirmed as the honest, rigorously-tested result of this investigation, not a default reached by skipping any required test. All rejected, weakly-supported, and unassessable material above is preserved, not deleted.

---

## Phase 8 — Diagnosis Establishment Gate Preparation

This investigation's own gate is decisions/DD-020 (see separate file) — the next valid decision identifier after inspecting the decisions register (DD-001 through DD-019 exist; DD-020 is unconsumed).
