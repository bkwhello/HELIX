# OD-001 Candidate D — Re-Measurement Schedule/Protocol
---

**Status: Approved With Conditions — Awaiting Execution Window** (decisions/DD-024, Case-Owner Decision, Kelvin Wong, 26 July 2026). Date originally prepared: 26 July 2026. Author: Claude, acting as an **independent HELIX Design Constructor** for EC-002, continuing design/OD-001-design-workstream.md's Candidate D under decisions/DD-023's Case-Owner Selection (Kelvin Wong, 26 July 2026, SELECT: Candidate D). This document fulfills the requested "EC-002-Candidate-D-Measurement-Protocol-Design.md" deliverable, placed under this case's established `design/` naming convention.

**This document specifies a future measurement. It does not perform it.** No Google Search Console system was accessed, queried, or exported in producing this document. No automation, script, or recurring integration was created. This document does not reopen DQ-001, does not start OD-002 Design, and does not enter Transformation.

**Execution status (26 July 2026, decisions/DD-024 Case-Owner Decision):** Kelvin Wong issued **APPROVED WITH CONDITIONS FOR READ-ONLY EXECUTION**, subject to all twenty-one binding conditions recorded verbatim in decisions/DD-024's Case-Owner Decision section. Execution may not occur before **21 September 2026** and this authorization expires **31 December 2026** if unexecuted. **This document has not been executed** — no Search Console access has occurred. Approval is not execution.

---

## Phase 1 — Reconstruction of EV-014's Exact Method

*Performed before specifying anything new, per this task's explicit instruction. Drawn directly from observations/O-001.md, diagnosis/DQ-001-investigation.md Phase 1, and diagnosis/OD-001-flagship-format-competitive-breadth.md's own Scope — not reconstructed from memory or inference where those records are silent.*

### Confirmed, reconstructable method

| Element | Confirmed value | Source |
|---|---|---|
| Property | konnichiwa.nl | O-001.md |
| Report | Google Search Console "Prestaties op zoeken" (Performance on Search) | O-001.md |
| Export mechanism | Manual export from the Search Console UI, CSV | O-001.md |
| Files exported | `Apparaten.csv` (Devices), `Diagram.csv` (daily chart), `Filters.csv`, `Landen.csv` (Countries), `Paginas.csv` (Pages), `Zoekopdrachten.csv` (Queries), `Zoekopmaak.csv` (Search appearance) | evidence/raw/search-console-2026-07-23/ (directory listing) |
| UI date-range setting used | "Afgelopen 3 maanden" (Last 3 months) preset | O-001.md |
| Actual populated window | 2026-04-21 through 2026-06-21 (61 days) — the preset returned less than 3 months of populated data because of Search Console's own ~1-month reporting lag | O-001.md |
| Theme rows: device/country scope | All-devices, all-countries aggregate — the per-theme table is **not** filtered by device or country; the "~94% Netherlands" and per-device figures (O-001, "Devices"/"Geography" sections) are separately reported supplementary context, not filters applied to the four theme rows | O-001.md, cross-checked against OD-001's own Scope ("Aggregate, ~94% Netherlands... All-devices aggregate") |
| Four theme rows: exact literal query strings | "teppanyaki utrecht" (32 clicks/375 impr./4.47 pos.); "omakase utrecht" (29/388/4.70); "japans restaurant utrecht" (13/1,480/8.13) **and** "japanese restaurant utrecht" (7/284/7.38), pooled as two phrasings of one theme; "sushi utrecht" (2/503/14.76) | O-001.md, "Target search themes" table |
| Known export limitation | Query-level export is capped at 999 rows; query totals (616 clicks) undercount the country/day totals (906 clicks) — a long-tail of low-volume queries is not captured. This is a documented, not a hidden, limitation | O-001.md |
| Query-to-page cross-tabulation | Does not exist in this export type — confirmed absent, not merely unexamined | diagnosis/DQ-001-investigation.md, Phase 2 |

### Unrecoverable baseline settings — marked as blockers, not invented

The following are **not documented anywhere in this case's evidence** and cannot be reconstructed. Per this task's explicit instruction, they are recorded as open blockers requiring confirmation at execution time, not assumed:

- **Search type filter** (Web / Image / Video / All). Almost certainly "Web" by Search Console default, but no record states this was explicitly selected or verified. **Blocker.**
- **Timezone basis for the date-range boundaries.** Search Console dates are computed in a timezone tied to the property or account settings; no record states which. This could shift day-boundary alignment by one day in a future comparison. **Blocker.**
- **Account/permission context** (which Google account, what property-access level was used for the export). Not recorded. **Blocker**, though low materiality — unlikely to affect the numbers themselves.
- **Locale/date-format settings active during export**, which could affect CSV date parsing if files are compared programmatically rather than read as reported figures. **Blocker**, low materiality.
- **Whether any additional near-duplicate query variant** (beyond the two pooled "japans restaurant utrecht" / "japanese restaurant utrecht" rows) was considered and deliberately excluded, or simply not found. Not documented either way. **Blocker** — this bounds how confidently a future export's query list can be matched to "the same theme."

**Rule for execution:** at the time this protocol is actually executed, whoever performs the export must record the actual settings used for each blocker above (or explicitly state "unconfirmed, used platform default") — so that the *next* re-measurement after this one has a fully documented method, rather than repeating the same gap. This protocol does not resolve these blockers now by assumption.

### Bounded correction (26 July 2026, decisions/DD-024 Candidate D Protocol Readiness Gate)

The five-item blocker list above is **preserved unmodified** as the historical record of this document's first-draft reconstruction. Direct inspection of the raw export files (`evidence/raw/search-console-2026-07-23/`), performed for the readiness gate, found additional evidence not checked when that list was first drafted. This correction does not delete or rewrite the original list — it supersedes three of its five items with confirmed findings, and leaves two genuinely open:

- **Search type filter — now Confirmed, not a blocker.** `Filters.csv` (in the same raw evidence folder) states directly: `Zoektype,Web` — the original export explicitly used the "Web" search type. This is direct, first-party evidence, not an assumed platform default (per this task's explicit instruction not to assume it).
- **Locale/date-format settings — now substantially resolved.** `Diagram.csv`'s daily rows use unambiguous ISO 8601 dates (`2026-04-21`, etc.), removing day/month parsing ambiguity regardless of the export locale; CTR and position figures use a consistent period-decimal format throughout every raw file. The exact underlying UI locale setting remains unconfirmed, but it is immaterial to reproducing the reported figures.
- **Near-duplicate-query inclusion/exclusion — now resolved.** Direct inspection of the full `Zoekopdrachten.csv` (1,000 rows) confirms Search Console's native Queries report lists one row per **exact, distinct query string** — it does not aggregate families on its own. Many related queries exist in the raw file that were **not** included in any theme's reported figures (e.g., "teppanyaki restaurant utrecht," "beste teppanyaki restaurant utrecht," "japans restaurant utrecht centrum" all appear as separate rows with their own clicks/impressions/position, distinct from the exact strings "teppanyaki utrecht" / "japans restaurant utrecht" that O-001.md reports). This is not an undocumented ambiguity — it is the report format's own native behavior, and the original theme figures are exact-string reads of specific rows, not an aggregated "family." The rule is therefore fully specifiable: **the future export must read the identical exact query strings, with no broader matching or aggregation** — already how Phase 3 below is written.

**Two items remain genuinely unresolved, reclassified below, not invented:**

- **Timezone basis** — no raw file states this. Remains open.
- **Account/permission context** — no raw file states this. Remains open.

See decisions/DD-024 for the complete materiality classification of all five original items (Blocking / Condition to Resolve Before Execution / Non-Blocking Limitation) — this correction changes the evidence available, not the classification framework itself.

---

## Phase 2 — Future Window (fixed in advance)

- **Window length:** exactly 61 days, matching EV-014.
- **Window boundaries:** **22 June 2026 – 21 August 2026** — immediately contiguous to, and with zero overlap with, the original 21 April–21 June 2026 window. This is a deliberate choice: a non-overlapping window gives a genuine before/after comparison rather than a partially self-referential one.
- **Earliest permissible export date:** **not before 21 September 2026** — honoring the same ~30-day Search Console reporting lag O-001.md documents (the window's end date, 21 August, needs approximately 30 days to be fully populated before export).
- **Non-drift rule:** if execution has not occurred by **31 December 2026**, this protocol **lapses** and requires re-authorization with a freshly chosen window — the window specified here does not silently slide forward to accommodate delay. This is the explicit mechanism preventing Candidate D from becoming indefinite deferral (per decisions/DD-023, Set D, Condition 8).

---

## Phase 3 — Export Method (fixed in advance)

- Same report and property: Search Console "Prestaties op zoeken," konnichiwa.nl.
- Same file set: `Zoekopdrachten.csv`, `Diagram.csv`, `Landen.csv`, `Apparaten.csv`, `Paginas.csv`, `Filters.csv`, `Zoekopmaak.csv`.
- Same aggregation scope: all-devices, all-countries for the four theme rows; device/country breakdowns pulled only as separate supplementary context, exactly as in EV-014.
- Same four literal query strings, unmodified and unbroadened: "teppanyaki utrecht"; "omakase utrecht"; "japans restaurant utrecht" and "japanese restaurant utrecht" (pooled); "sushi utrecht." No new query string may be substituted or added without a fresh, separate case-owner decision, since doing so would silently redefine "the same theme."
- At execution time, the actual values for every Phase 1 blocker (search-type filter, timezone, account context, locale, and whether any additional query variant was considered) must be recorded in the resulting observation record — closing the gap this protocol identifies rather than repeating it silently.

---

## Phase 4 — Calculations (fixed in advance)

- For each of the four themes: clicks, impressions, CTR, and average position, read directly from the new `Zoekopdrachten.csv` export, matched to the identical literal query-string rows specified in Phase 3.
- **Delta per theme:** (new average position) − (baseline average position), reported both numerically and directionally (Improved / Stable / Worsened per Phase 6's thresholds).
- **No cross-theme aggregation into a single score** — each of the four themes is evaluated independently, preserving OD-001's own non-pooled, four-theme scope.
- **Explicit exclusions:** no local-pack data (OC-003/EV-018 remain separate context, per decisions/DD-022 OD-001 Condition 2); no conversion, revenue, or reservation data of any kind enters any calculation (OC-007/UR-003 Attribution Constraint, decisions/DD-022 OD-001 Condition 7).

---

## Phase 5 — Evidence-Sufficiency Criteria (pre-registered before data collection)

1. The comparison window must be fully outside Search Console's reporting lag at export time (i.e., not using partial/incomplete data) — the same check O-001.md applied to the original window.
2. If the 999-row query cap measurably affects any of the four themes' specific rows in the new export (e.g., a theme's query no longer appears within the first 999 rows due to volume growth elsewhere), this must be flagged exactly as O-001.md already flagged the original cap — not silently absorbed.
3. Low-volume themes (per the original data, "sushi utrecht" rested on only 2 clicks) carry the same residual statistical uncertainty in any future comparison and must be reported as such, not treated as newly discovered or newly resolved.
4. If any Phase 1 blocker cannot be confirmed even at execution time (e.g., timezone genuinely cannot be determined), the resulting comparison must be labeled with that specific limitation, not silently treated as fully like-for-like.

---

## Phase 6 — Pre-Registered Outcome Rules (fixed before data collection; no rule may automatically select a candidate)

**Classification per theme:** each theme's delta is classified as **Improved**, **Stable / No Measurable Change**, or **Worsened**, using the position-point movement observed, with "Stable / No Measurable Change" pre-registered as the default classification for any theme whose delta cannot be clearly distinguished from noise given its click/impression volume (this applies most directly to "sushi utrecht," given its 2-click baseline) — consistent with this task's explicit instruction that "no measurable change" must remain a valid, non-failure outcome.

**Provisional-threshold note (26 July 2026, decisions/DD-024 Candidate D Protocol Readiness Gate):** the classification rule above is a qualitative principle, not yet a fixed numeric band (e.g., no stated ±*n*-position-point threshold has been derived or approved). This is recorded here as an explicit, pre-registered acknowledgment, not a silent gap: the exact numeric threshold(s) for "Stable / No Measurable Change" per theme remain **provisional** and require Kelvin's explicit approval before they can classify any future result — this classification step may not be performed automatically without that approval. This does not weaken the rule immediately above it (no outcome may automatically select a candidate) — it adds a second, earlier condition specifically on the classification step itself.

**Critical, explicitly stated limitation:** Candidate D does not reallocate any organizational effort — it only re-observes the same, already-diagnosed condition over a later window. **This re-measurement cannot test, confirm, or refute the untested effort-to-ranking assumption underlying Candidates B and C** (decisions/DD-023, Set D, Condition 16; Set C, Condition 1). Only a future, separately-authorized implementation of B or C — with its own before/after measurement — could test that assumption. The outcome rules below determine which candidates remain live options for the case owner's next decision; they do not, and cannot, validate any candidate's underlying mechanism.

| Outcome | Pattern | What it does — and does not — justify |
|---|---|---|
| **Retain Candidate A** | All four themes classify as Stable/No Measurable Change, or the flagship-vs-broad gap is directionally and materially similar to the baseline | The diagnosed condition remains as originally characterized; nothing new argues for acting now. Does not prove reallocation would be unhelpful — only that nothing has changed to argue for it. |
| **Justifies reconsidering Candidate B** | Both flagship themes (teppanyaki, omakase) classify as Worsened, while broad themes are Stable or worsened by materially less | The low-competition advantage may be eroding on its own; this is a reason to examine flagship-weighted emphasis as a live option. **Does not show that emphasis works** — only that the case for testing it, versus continued inaction, has strengthened. |
| **Justifies reconsidering Candidate C** | Broad themes (japans restaurant, sushi) classify as Worsened further, while flagship themes are Stable or Improved | The underperformance gap is widening organically; this is a reason to examine broad-category-weighted emphasis as a live option. **Does not show that emphasis works** — only that passive monitoring alone has not prevented further divergence. |
| **Unresolved** | Mixed results not matching any pattern above cleanly (e.g., one flagship theme improves while the other worsens); results fall within the low-volume uncertainty band and cannot be classified confidently; a Phase 5 sufficiency criterion (reporting lag, query cap, unconfirmed blocker) is not met | The re-measurement is inconclusive. Per decisions/DD-022 Common Condition 6, this is an **explicitly acceptable, legitimate outcome, not a failure**. It requires a fresh case-owner decision on how to proceed (extend the window, accept the ambiguity, or choose a different next step) — not a default to any one candidate. |

**Explicit rule, stated directly:** none of the four outcomes above, by itself, selects Candidate A, B, or C. Each outcome only determines which candidate(s) become live options for the case owner's own next, separate, explicit decision — per decisions/DD-023, Set D, Condition 14 ("Those outcomes may reopen selection among A/B/C but may not automatically select one").

---

## Phase 7 — Boundary Confirmations

- **Does not reopen DQ-001.** DQ-001 remains Established (decisions/DD-017), unchanged. This protocol asks only whether the previously-diagnosed condition still holds over a later window — it introduces no new "why" question and no causal-mechanism investigation (decisions/DD-023, Set D, Conditions 1–3).
- **No Search Console access or export occurred** in preparing this document — Phase 1's reconstruction used only this case's own existing, already-collected records (O-001.md, diagnosis/DQ-001-investigation.md).
- **No automation was created.** This remains a manual, dated, one-time, case-owner-approved action each time it is performed — not a recurring script or integration.
- **OD-002 Design remains not started**, untouched by this document.
- **Transformation is not entered.** This protocol produces comparison data only; any resulting reallocation (were B or C later selected) would still require its own further Design specification and, beyond that, its own separate Transformation Authorization Gate.
- **No external or production system change** occurs anywhere in this document.

---

## Phase 8 — Case-Owner Approval Request

Per this task's explicit instruction, this protocol requires Kelvin Wong's explicit approval **before** any later read-only execution (the actual future Search Console export). Nothing above is self-executing.

**Kelvin Wong, as case owner, is asked to approve, modify, or decline the following, as a single response:**

1. The future window: **22 June 2026 – 21 August 2026**, earliest export **21 September 2026**, lapsing **31 December 2026** if not executed.
2. The export method: identical report, property, file set, and four literal query strings specified in Phase 3.
3. The outcome-classification thresholds in Phase 6.
4. Explicit acknowledgment that this re-measurement cannot test whether organizational effort is a lever on search position — it can only re-confirm or update the originally diagnosed four-theme contrast.

**Requested response — one of:**

- **APPROVE AS SPECIFIED** — this protocol becomes the authorized plan for future execution, unchanged.
- **APPROVE WITH MODIFICATIONS** — naming exactly what changes (e.g., a different window, a different lapse date).
- **DO NOT APPROVE** — this protocol is not authorized; Candidate D's next action remains open for a different approach.

Only after that explicit response, given as a separate, later instruction, may this protocol be executed — and execution itself would still be a bounded, read-only Search Console export, not an automation, requiring no further authorization beyond what is granted here (unless Kelvin specifies otherwise in his response).
