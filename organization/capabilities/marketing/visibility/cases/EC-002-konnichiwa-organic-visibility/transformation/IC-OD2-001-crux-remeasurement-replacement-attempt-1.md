# IC-OD2-001 — CrUX Remeasurement Replacement Attempt 1 (DD-038) — Blocked

---

**Record type: Execution Attempt Record — Not Evidence.** This document records what factually occurred, and what was independently verifiable from two supplied screenshots, during the first attempt executed under decisions/DD-038's authorization. It does not classify whether the source/window met like-for-like requirements beyond what is stated as blocking, does not determine whether any further attempt is possible, and does not perform any Stage 1 outcome classification (OUT-01–OUT-07). Those determinations belong to a future, independent classification/blocker gate, not created by this task.

```yaml
Candidate: IC-OD2-001
Authorization: decisions/DD-038 — Case-Owner Decision (Kelvin Wong, 19 August 2026)
Attempt Identity: Replacement Attempt 1 under DD-038
Overall Execution Attempt Sequence: Attempt 2 for IC-OD2-001 (Attempt 1 = decisions/DD-036 authorization, blocked HTTP 429, see transformation/IC-OD2-001-crux-remeasurement-execution-attempt-1.md and decisions/DD-037)
Protocol: transformation/IC-OD2-001-crux-mobile-ttfb-remeasurement-protocol.md
Record Type: Execution Attempt Record — Not Evidence
Status: Blocked — Exact 28-Day Window Not Visibly Confirmed
Independent Review: Pending
```

---

## 1. Relationship to Attempt 1 and DD-037

This is a **separate, distinct attempt from Attempt 1**. Attempt 1 (19 August 2026, under decisions/DD-036's original authorization) was a public, unauthenticated request to the PageSpeed Insights API v5 endpoint that returned HTTP 429 with no data — closed by decisions/DD-037 as Blocked Execution / Source Rate Limited / No Data, Method Compliance Unresolvable From Existing Authority, Attempt Consumed — 0 Remaining under that original authorization. decisions/DD-038 subsequently authorized exactly one new, separately-governed replacement attempt, via the interactive PageSpeed Insights interface only (API v5 excluded). This document records that replacement attempt — **overall execution attempt 2** for IC-OD2-001 — under its own, separately-provenanced field set. Attempt 1's own record and decisions/DD-037 are not edited by this document.

---

## 2. Execution Context

| Field | Value |
|---|---|
| Execution date | 19 August 2026 |
| Report timestamp (as displayed on screen) | `Aug 19, 2026, 4:48:41 PM` — **no timezone is stated on screen; none is assumed by this record** |
| Result URL supplied | `https://pagespeed.web.dev/analysis/https-konnichiwa-nl/8zdvdw66d1?form_factor=mobile` |
| Method | Public, interactive Google PageSpeed Insights interface |
| PageSpeed Insights API v5 | **Not used** |
| API key | None used |
| Login/authenticated access | None used |
| Automation | None — one manual analysis submission |

---

## 3. Input Manifest — Two Screenshots, Independently Reviewed

Per this task's explicit instruction, both images were opened and read directly — nothing below is accepted solely on the authority of the assigning instruction.

### Screenshot (12).png

Independently confirmed visible on screen:

- A PageSpeed Insights report page (`pagespeed.web.dev`).
- Heading: "Report from Aug 19, 2026, 4:48:41 PM".
- URL field populated with `https://konnichiwa.nl/`.
- "Mobile" tab selected (visually active/underlined), "Desktop" tab present but not selected.
- Section heading "Discover what your real users are experiencing" (the CrUX field-data section).
- "Core Web Vitals Assessment: **Passed**" (green).
- Two scope toggle controls labeled "This URL" and "Origin" are both visible in this section. **This record cannot independently confirm, with certainty, which of the two was the active/selected state from the image as supplied** — the visual distinction between the two buttons was not conclusively legible at the resolution/rendering available. This is recorded as an open, unconfirmed point (§7), not asserted either way.
- **No exact calendar start date or end date is visible anywhere in this screenshot.**
- The screenshot also shows an unrelated chat-assistant side panel (not part of the PageSpeed report itself) containing guidance text about how to capture the screenshot and a preliminary observation that the exact measurement period is not visible — noted here only as descriptive context of what appears in the image; it is not treated as authoritative for this HELIX case and carries no weight in this record's own findings.

### Screenshot (2).png

Independently confirmed visible on screen:

- Same report context (same site, same interface), scrolled to a section headed "OTHER NOTABLE METRICS".
- Two metric cards: "First Contentful Paint (FCP)" and "**Time to First Byte (TTFB)**" (TTFB is the one required by this task).
- TTFB card shows:
  - 75th Percentile: **1.7 s**
  - Good (≤ 0.8 s): **27%**
  - Needs Improvement (0.8 s – 1.8 s): **52%**
  - Poor (> 1.8 s): **22%**
  - Labeled "Experimental".
- Below both cards: "**Latest 28-day period** (history)", "Various mobile devices", "Many samples (**Chrome UX Report**)", "Various network connections", "Full visit durations", "All Chrome versions" — confirms this is field data (CrUX), not Lighthouse lab data.
- **No exact calendar start date or end date is visible anywhere in this screenshot** — only the words "Latest 28-day period" and an unopened "(history)" link, which this task's boundary does not authorize clicking.
- The same unrelated chat-assistant side panel is visible, this time with step-by-step capture guidance and an instruction not to click Analyze or reload — same treatment as above: descriptive context only, not authoritative for this record's findings.

**Rounding check, independently performed:** 27% + 52% + 22% = **101%**. Recorded as a visible source-rounding artifact, not corrected or normalized.

**Other screenshots**: not used. Per this task's explicit scope, only these two were reviewed; any other supplied screenshots were understood to show primarily Lighthouse lab results and are excluded from this field-data record.

---

## 4. Determinative Blocker

The source displays only **"Latest 28-day period"** in both reviewed screenshots. It does not visibly display:

- an exact window start date;
- an exact window end date.

Therefore it cannot be established from the source itself that the displayed period:

- spans exactly 28 days per this case's own repository definition;
- starts on or after 2026-07-22;
- has no overlap with the historical baseline window, 2026-06-24 through 2026-07-21.

**No date was inferred, calculated, or assumed by this record.** The report timestamp (`Aug 19, 2026, 4:48:41 PM`) was not used to back-calculate a window start/end; no CrUX publication lag was assumed; no external calendar arithmetic was substituted for visible source evidence. This follows decisions/DD-038 Binding Condition 5 (Set A) and Set B Condition 6 directly.

---

## 5. Process Outcome

```
Blocked Execution — Exact 28-Day Window Not Visibly Confirmed
```

This means, exactly and only:

- the interactive analysis was submitted;
- the replacement attempt was started;
- the one attempt authorized by decisions/DD-038 has been used;
- zero replacement attempts remain under the current authorization;
- usable on-screen information was returned (unlike Attempt 1's HTTP 429, this attempt did not fail to return data);
- that information does not satisfy the binding window-visibility requirement (decisions/DD-038 Binding Condition 5 / Set B Condition 6);
- no valid remeasurement evidence artifact is created by this record;
- no comparison with the historical 26% is performed;
- no improvement, deterioration, or stability is classified.

---

## 6. Visible TTFB Data — Status

The TTFB figures in §3 (Screenshot 2) are recorded here strictly as:

```
Visible Source Data — Not Accepted as Like-for-Like Remeasurement Evidence
```

They are **not** used for, and must not be read as supporting:

- comparison with the historical 26% poor-mobile-TTFB baseline;
- any OUT-01–OUT-07 classification;
- a significance claim;
- a materiality claim;
- a causal claim;
- any backend or caching conclusion;
- "improved," "worsened," or "stable" as a formal or informal classification;
- "problem resolved";
- an automatic Stage 2 trigger.

**Core Web Vitals ("Passed") is recorded structurally separately from the TTFB distribution** — the two are independent findings in the source report and are kept independent here, consistent with every prior document in this candidate's history.

---

## 7. Attempt-Consumption Status

| Field | Value |
|---|---|
| Replacement attempt occurred | `true` |
| Replacement attempt started | `true` — an analysis was submitted for `https://konnichiwa.nl/` |
| Replacement attempt consumed | `true` |
| Replacement attempts remaining under decisions/DD-038 | `0` |
| Replacement attempt completed | `false` — see explicit open question below |

**Open question, not resolved by this record:** whether "completed" should read `true` (usable on-screen data was actually returned, unlike Attempt 1) or remain `false` (no result satisfied the binding comparability requirement, so no measurable outcome was actually produced) is not a distinction this task is authorized to decide. Per this task's own instruction, the field is left at its documented default (`false`) and is recorded here as an explicit question for the independent gate, exactly as decisions/DD-037 Part 4 previously left `execution_started`'s precise definition to independent review rather than deciding it unilaterally.

---

## 8. Explicit Prohibited Inferences

This record does not state, and must not be read as implying:

- that konnichiwa.nl's actual current TTFB performance is better, worse, or the same as the historical 26% baseline;
- that the displayed 22%-poor / 52%-needs-improvement / 27%-good figures represent a valid, comparable remeasurement;
- that "Origin" scope was or was not confirmed (see §3 — genuinely unconfirmed from the supplied images, not asserted in either direction);
- that any caching, Varnish, or backend mechanism is confirmed, refuted, or newly evidenced by this attempt;
- that the interactive interface is generally superior or inferior to the API v5 route in data quality (only that it returned on-screen data this time, where the API returned none);
- that Attempt 1's HTTP 429 finding is altered in any way;
- that Stage 2 (IC-OD2-002) is now appropriate to start.

---

## 9. Open UMF and CF Items

Carried forward from transformation/IC-OD2-001-crux-mobile-ttfb-remeasurement-protocol.md's Phase 3 (UMF-001–007) and Phase 9 (CF-001–012) registers — none resolved by this attempt, since no comparable measurement was obtained:

- **UMF-002** (PageSpeed interface/version used) — now **partially informed**: this attempt used the interactive interface, explicitly recorded (§2); the exact UI version/build remains unrecorded.
- **UMF-004** (timezone basis) — remains unresolved; the displayed report timestamp carries no timezone label, consistent with the original historical baseline's own gap (O-012/EV-017).
- **UMF-007** (historical report reproducibility) — unaffected by this attempt; not tested here.
- **Window-visibility gap** (the fifteenth stop condition added by decisions/DD-036 Part 10, and restated by decisions/DD-038) — **directly triggered** by this attempt; this is the determinative blocker itself (§4), not merely an open item.
- **CF-001–CF-012** (the full confounder register) — **not evaluated**, since no comparable measurement exists to interpret; all remain at their existing status (Unknown, unless separately evidenced) exactly as the protocol requires.
- **New, not previously registered**: whether the "This URL" / "Origin" scope toggle was actually set to "Origin" for this specific report — genuinely unconfirmed from the supplied screenshots at the resolution available (§3). This is a new open item this record surfaces, not previously anticipated as a distinct UMF/CF entry, and is flagged here for the independent gate's attention alongside the primary window-visibility blocker.

---

## 10. Required Independent Follow-Up

A separate, independent blocker/classification gate is required before any further action on this candidate — consistent with the pattern already established for Attempt 1 (decisions/DD-037) and for the replacement authorization itself (decisions/DD-038). That future gate, not this record, is the appropriate place to determine: whether any further attempt may be authorized; how "replacement attempt completed" should be defined; how the Origin/URL-scope ambiguity should be treated; and what the resulting Stage 1 status should be. **This record does not prepare, anticipate, or substitute for that gate.**

---

## 11. Final Intended Change Scope

| File | Change | Reason |
|---|---|---|
| `transformation/IC-OD2-001-crux-remeasurement-replacement-attempt-1.md` | Created (this file) | The replacement-attempt record itself |
| `transformation/IC-OD2-001-crux-mobile-ttfb-remeasurement-protocol.md` | Status-addendum only | Records that Replacement Attempt 1 occurred and was blocked; Phases 1–14 unmodified |
| `transformation/OD-002-implementation-candidate-construction-workstream.md` | Status-addendum only | Same convention |
| `transformation/README.md` | Index row updated | Reflects blocked Replacement Attempt 1 status |
| `current.md` | Fields updated | Case ledger convention |
| `Traceability.md` | Entry added | Same convention |

**Not modified:** decisions/DD-035, DD-036, DD-037, DD-038 (all preserved exactly as gate-reviewed and case-owner-decided); Attempt 1's own record. **Not created:** any evidence file; any `O-`/`EV-` record; any classification or Case-Owner Decision; decisions/DD-039 or any other independent gate. No PageSpeed, CrUX, or API request was made in producing this record — only the two already-supplied screenshots were reviewed. No commit was created. Nothing was pushed.
