# OD-001 Candidate D — Replacement Measurement Protocol (v2, DD-040 Option B)
---

**Status: Designed — Readiness Gate Pending — Not Authorized for Execution.** Date prepared: 28 September 2026. Author: Claude, acting as HELIX Design Constructor for EC-002, under the Case Owner's DD-040 Option B authorization ("Authorize design of a new/amended Candidate D measurement protocol using a currently-obtainable comparison window", Kelvin Wong, 22 September 2026) and the Case Owner parameter decisions CO-1 to CO-9 of 28 September 2026 (section J).

**This document specifies a future measurement. It does not perform it, and it does not authorize it.** No Google Search Console property, report, setting or export was accessed in preparing it. Only already-committed repository records and the already-preserved raw files in `evidence/raw/search-console-2026-07-23/` were read. No measurement lock was created, no automation or scheduled task exists, and nothing was changed in production, WordPress, GTM or GA4.

**Relationship to earlier artifacts.** This is the replacement protocol referred to informally elsewhere in the case as "Candidate D v2". design/OD-001-candidate-d-measurement-protocol.md (the original protocol), decisions/DD-024 (its readiness gate, Case-Owner Decision and twenty-one binding conditions) and decisions/DD-040 (the execution blocker and Option B decision) remain **unmodified** as the historical record. Where this protocol departs from the original, the departure is named in section J together with the Case Owner decision that authorizes it. Every DD-024 binding condition not explicitly replaced here continues to apply (section I).

---

## Supplement — correction of the EV-014 window length (CO-1)

The raw EV-014 daily file `evidence/raw/search-console-2026-07-23/Diagram.csv` contains **62 rows, one per calendar day, contiguous from 2026-04-21 through 2026-06-21 inclusive, with no missing day** (906 clicks, 29,215 impressions — the same totals O-001.md and O-013.md report). 21 April through 21 June 2026 inclusive is **62 calendar days** (April 10 + May 31 + June 21).

Historical records describe this window as **61 days**. By Case Owner decision CO-1 this is recorded as a **counting/governance error, corrected by this supplement only** — the historical records are not rewritten, and EV-014 itself is unchanged. Affected statements (as found on 28 September 2026):

- observations/O-001.md (EV-014 limitation: "2026-04-21 through 2026-06-21 (61 days)");
- observations/O-013.md (Search Console row: "2026-04-21 to 2026-06-21 (61 days)");
- claims/OC-001 (time period, and three further "61-day window" references);
- diagnosis/DQ-002-investigation.md, diagnosis/DQ-007-investigation.md, diagnosis/OD-003-name-variant-entity-resolution.md ("61-day" window references);
- design/OD-001-design-workstream.md ("a single 61-day window"; "a subsequent ~61-day period");
- design/OD-001-candidate-d-measurement-protocol.md, Phase 1 ("Actual populated window … (61 days)") and Phase 2 ("exactly 61 days, matching EV-014");
- decisions/DD-024, Part A-2 and Part C ("matching EV-014's populated window length exactly") and **Binding Condition 5** ("the documented 61-day EV-014 window");
- Traceability.md and current.md entries repeating the above.

**Consequences, stated explicitly:**

1. For this protocol, "the EV-014 baseline" means the factual window **2026-04-21 through 2026-06-21 inclusive, 62 calendar days**. DD-024 Condition 5's intent — the baseline is exactly EV-014 — is preserved; only its day count is corrected.
2. The original comparison window, 2026-06-22 through 2026-08-21, was correctly counted as 61 days (DD-040, fact 1). The "exact length match" asserted in DD-024 A-2 and Part C was therefore **never exact** (61 vs 62). That historical assessment is not rewritten here. The replacement window below is length-matched to the factual 62 days.
3. EV-014's query-level rows (`Zoekopdrachten.csv`) are aggregated by Search Console over the whole 62-day window and cannot be re-cut to 61 days. The baseline is therefore immutable at 62 days.

---

## A. Measurement objective

**What Candidate D establishes.** Whether the four-theme organic search-visibility contrast diagnosed in OD-001 (DQ-001; decisions/DD-017) — flagship formats (teppanyaki, omakase) positioned better than broad categories (japans/japanese restaurant, sushi) in Utrecht — is still observed, and in which direction each theme's average position has moved, in a later window measured the same way. It **re-observes** the diagnosed condition. It does not test a cause, and it does not test whether organizational effort moves search position (DD-024 Condition 16; decisions/DD-023, Set D, Condition 16).

**Which decision it supports.** The Case Owner's later, separate and explicit decision among OD-001 Candidates A (No-Change), B (Flagship-Weighted Reallocation) and C (Broad-Category-Weighted Reallocation), which remain *Retained — Unselected Alternative* (decisions/DD-023). Candidate D is *Selected for Further Design*. Under the original protocol's Phase 6 (unchanged here), the measurement can only make a candidate a **live option** for that decision. It never selects one (DD-024 Conditions 14–15).

**What it is not.** Not a reopening of DQ-001. Not a local-pack, conversion, revenue or reservation measurement (DD-024 Condition 17). Not a rank or top-three promise (Condition 18). Not an evaluation of any intervention's effect. No causal attribution to any intervention listed in section C.4 is made or permitted.

---

## B. Data source

| Element | Value | Basis |
|---|---|---|
| Platform / report | Google Search Console, "Prestaties op zoeken" (Performance on Search) | Original protocol Phase 3; O-001.md |
| Property | **CASE OWNER DECISION / EVIDENCE REQUIRED — HARD STOP (CO-4).** The replacement export must use **the identical property** that produced EV-014. EV-014's property is recorded only as "konnichiwa.nl" (O-001.md). Whether it was a Domain property or a URL-prefix property is **not established** and must not be assumed. The 21 September 2026 export attempt was saved under a folder named `https___konnichiwa.nl_-Performance-on-Search-2026-09-21` (DD-040), which does not by itself establish the property type of either export. | CO-4; section H, R-3 |
| Account / permission context | **HARD STOP until recorded (CO-5).** To be recorded immediately before execution. Not assumed. | DD-024 Conditions 7–9; CO-5 |
| Search type | **Web** | EV-014 `Filters.csv` (`Zoektype,Web`); DD-024 Condition 3 |
| Date range | **Custom range 2026-07-22 through 2026-09-21** (section C) | CO-2 |
| Filters | **None** other than search type and date. No query, page, country, device or search-appearance filter. | EV-014 `Filters.csv` contains only search type and date |
| Dimensions exported | The standard file set: `Zoekopdrachten.csv` (Queries), `Diagram.csv` (daily chart), `Landen.csv` (Countries), `Apparaten.csv` (Devices), `Paginas.csv` (Pages), `Filters.csv`, `Zoekopmaak.csv` (Search appearance) | Original protocol Phase 3 |
| Metrics | Clicks ("Aantal klikken"), Impressions ("Vertoningen"), CTR, Average position ("Positie") | EV-014 column headers |
| Query scope | Exactly five literal query strings, as five **separate** rows (CO-6): `teppanyaki utrecht`; `omakase utrecht`; `japans restaurant utrecht`; `japanese restaurant utrecht`; `sushi utrecht`. No broadening, no near-duplicate variants, no substitution, no additions. | Original protocol Phase 3; DD-024 Part B; CO-6 |
| Page scope | None. Query-to-page cross-tabulation does not exist in this export type (diagnosis/DQ-001-investigation.md, Phase 2); `Paginas.csv` is retained as context only. | Original protocol |
| Country / device scope | All countries, all devices, aggregate, for the five query rows. `Landen.csv` and `Apparaten.csv` are supplementary context only and are never used to filter the theme rows. | Original protocol Phase 1/3 |
| Timezone basis | **HARD STOP until recorded (CO-5).** Not stated in any EV-014 file. Recorded immediately before execution (section F, step F3). Not invented. | DD-024 Conditions 7–9; CO-5 |

---

## C. Comparison windows

### C.1 Windows

| | Baseline (EV-014, fixed) | Replacement comparison window (R1) |
|---|---|---|
| Start | 2026-04-21 (Tuesday) | 2026-07-22 (Wednesday) |
| End | 2026-06-21 (Sunday) | 2026-09-21 (Monday) |
| Inclusive length | **62 calendar days** (Apr 10 + May 31 + Jun 21) | **62 calendar days** (Jul 10 + Aug 31 + Sep 21) |
| Weekday composition | Mon 8; Tue–Sun 9 each | Tue 8; Wed–Mon 9 each |
| Data status | Already exported 23 July 2026; raw files preserved | **Not exported. Availability through 2026-09-21 not proven.** |

**Unobservable gap:** **2026-06-22 through 2026-07-21 inclusive, 30 calendar days**, lies between the two windows and cannot be obtained (DD-040). The windows are **not contiguous** and must not be described as contiguous (CO-3). They do not overlap.

R2 (2026-07-28 through 2026-09-27) was considered and **not selected** (CO-2).

### C.2 Why R1 (Case Owner rationale, CO-2)

- It has the same factual duration as EV-014: 62 calendar days.
- It starts at the earliest currently evidenced GSC availability boundary, 2026-07-22 (DD-040: UI, date dialog and raw export agree).
- It ends on 2026-09-21, before the sitemap intervention of 2026-09-22 (transformation/HV-IR-001.md, HV-INT-008).
- It minimizes additional intervention contamination compared with later windows.

### C.3 Availability — not yet proven

DD-040 establishes only the **start** boundary (2026-07-22), from an export ending on 2026-08-21. That data from 2026-08-22 through 2026-09-21 will be available is expected but **not evidenced**. CO-2's approval of R1 does not assert availability. Availability is a **mandatory pre-flight STOP condition** (section F, step F5; section G, G-5).

### C.4 Comparability limitations (material; disclosed, not discounted)

These limitations are **not immaterial**. None of them is treated as a cause of any observed difference. They must be reproduced in any observation that records this measurement:

1. **Season.** The baseline covers late spring (including Koningsdag, Hemelvaart and Pinksteren 2026). R1 covers the summer and holiday period.
2. **Restaurant closure in August.** Sushi was closed 3–11 August and teppanyaki 1–12 August 2026 (evidence/HV-IV-002.md), inside R1 and absent from the baseline.
3. **HV-INT-002 went live on 2026-07-22** (Omakase page and teppanyaki menu; transformation/HV-IR-001.md). R1 is therefore entirely **post-launch** and the baseline entirely **pre-launch** for the affected flagship themes, teppanyaki and omakase.
4. **URL structure changed between the periods.** The July GSC export shows EN pages served without a language directory and NL at `/nl/home-nederlands/`. The current site serves EN under `/en/` and NL at the root (observations/O-030.md, section C).
5. **Other pages went live during August** inside R1: for example `/en/sake-gids/` (14 August) and `/en/wagyu-utrecht/` (15 August), per their live page metadata.
6. **2026-06-22 through 2026-07-21 is unavailable**: a 30-day unobservable gap (C.1).
7. **GSC availability through 2026-09-21 has not been proven** (C.3).
8. **Weekday composition differs by one day** (C.1).
9. **Low volume.** The baseline "sushi utrecht" row rests on 2 clicks, and other rows on tens of clicks. The low-volume uncertainty of the original Phase 5 criterion 3 applies unchanged.
10. **999-row query cap.** EV-014's query export was capped (616 query-level clicks against 906 total). The same cap applies to the replacement export (original Phase 5 criterion 2).

---

## D. Metrics and calculations

### D.1 Baseline values (read from EV-014 `Zoekopdrachten.csv`, unmodified)

| Query row (exact) | Clicks | Impressions | CTR (as exported) | Position (as exported) |
|---|---|---|---|---|
| `teppanyaki utrecht` | 32 | 375 | 8.53% | 4.47 |
| `omakase utrecht` | 29 | 388 | 7.47% | 4.7 |
| `japans restaurant utrecht` | 13 | 1480 | 0.88% | 8.13 |
| `japanese restaurant utrecht` | 7 | 284 | 2.46% | 7.38 |
| `sushi utrecht` | 2 | 503 | 0.4% | 14.76 |

### D.2 Row matching

A row matches only when the query cell in the replacement `Zoekopdrachten.csv` is **identical** to the literal string above, after removing leading and trailing whitespace only. No case folding beyond what the export itself contains, no diacritic normalization, no fuzzy or partial matching, no substitution of a variant. The five rows are evaluated **separately**. No pooled or impression-weighted row is created (CO-6).

### D.3 Per-metric specification

| Metric | Source field | Aggregation | Comparison | Rounding | Role |
|---|---|---|---|---|---|
| **Average position** (governed) | `Positie` column of the matched row | None: the value as aggregated by Search Console over the window | **Δpos = position(R1) − position(baseline)**. Negative Δpos = numerically lower (better-ranked) average position; positive = numerically higher. | Exported values are used exactly as exported (a value such as `4.7` is read as 4.70). Δpos is reported to 2 decimals. No re-rounding of source values. | **The only metric that enters the Phase 6 description** (CO-7) |
| Clicks | `Aantal klikken` of the matched row | None | Δclicks = clicks(R1) − clicks(baseline) | Integers | Descriptive context only (CO-7) |
| Impressions | `Vertoningen` of the matched row | None | Δimpr = impr(R1) − impr(baseline) | Integers | Descriptive context only (CO-7) |
| CTR | `CTR` of the matched row, read as exported | None | ΔCTR = CTR(R1) − CTR(baseline), in **percentage points** | Reported to 2 decimals in percentage points. The exported CTR governs. A cross-check value clicks ÷ impressions × 100 (2 decimals) is recorded beside it, and any difference is recorded, not reconciled by adjustment. | Descriptive context only (CO-7) |

**No composite score, no cross-row or cross-theme aggregation, no percentage-change index** (CO-7; original Phase 4).

### D.4 Missing-data and edge-case handling

- **Row absent from the replacement export:** recorded as **"Absent — not encoded as zero"** (DD-024 Condition 12). Possible reasons, which are recorded, not resolved: the 999-row cap, or Search Console's omission of low-volume or anonymized queries. No delta is computed for that row, and its theme is described as **Unresolved** under the original Phase 5/6 rules.
- **Row present with 0 clicks and impressions > 0:** valid. CTR = 0% as exported; position as exported; deltas are computed normally.
- **Row with 0 impressions:** cannot appear as an exported row. It is treated as absent (above).
- **CTR or position cell empty or non-numeric in a present row:** STOP (G-9). Not imputed.
- **Header labels differ from the baseline** (for example because of the UI language): the literal headers are recorded. Mapping is allowed only if the five columns appear in the same order as in EV-014 (query, clicks, impressions, CTR, position). Any other structure is STOP (G-9).

### D.5 Phase 6 interpretation (unchanged; descriptive only)

The original protocol's Phase 6 outcome patterns (Retain A, Reconsider B, Reconsider C, Unresolved) apply unchanged, using Δpos only. Under DD-024 Condition 13 and CO-9:

- "Improved / Stable / No Measurable Change / Worsened" is a **descriptive** classification only.
- There is **no numeric band or threshold** for "Stable / No Measurable Change", and none may be introduced by the executor.
- Because "japans restaurant utrecht" and "japanese restaurant utrecht" stay separate rows (CO-6), the broad "japans restaurant" theme is described through both rows. If the two rows move in different directions, that is a mixed result under Phase 6's existing "Unresolved" definition. No pooled figure is used to resolve it.
- No outcome selects Candidate A, B or C. Every outcome requires a new explicit Case Owner decision (DD-024 Conditions 14–15).

---

## E. Evidence capture (required for reproduction)

Everything below is retained in a new folder `evidence/raw/search-console-<execution date, YYYY-MM-DD>/`, recorded in a new observation record created at execution time:

1. **Property identity:** the exact property string as displayed in the Search Console property selector, including its type as Search Console displays it, plus a **screenshot of the property selector** showing the selected property (CO-4).
2. **EV-014 property identity evidence:** the evidence accepted by the readiness gate (section H, R-3) establishing that this is the same property that produced EV-014.
3. **Account/permission context:** the Google account used and its permission level on the property, as displayed, with a screenshot. Account identifiers may be partially redacted only as the readiness gate specifies (CO-5; DD-024 Condition 8).
4. **Timezone basis:** exactly as displayed or determinable, or the literal record `unconfirmed — platform default used` (CO-5; DD-024 Condition 7), with its source.
5. **Execution timestamp:** ISO 8601 with UTC offset, recorded at the moment of export.
6. **Report settings:** screenshots of the search-type selection and of the **reopened** custom-date dialog showing 2026-07-22 – 2026-09-21 (the check that detected the DD-040 blocker).
7. **Raw export, unmodified:** the downloaded archive (if any) and all seven CSV files, byte-for-byte as downloaded.
8. **Hashes:** SHA-256 of the downloaded archive and of each CSV, computed **immediately after download and before any file is opened in a spreadsheet or editor**, recorded in a `SHA256SUMS` text file in the same folder.
9. **Export metadata:** the literal contents of `Filters.csv`.
10. **Integrity checks:** `Diagram.csv` row count, first date, last date, missing dates (expected: 62, 2026-07-22, 2026-09-21, none), and the reconciliation of `Diagram.csv` totals against `Landen.csv` and `Apparaten.csv` totals.
11. **Row extraction:** the five matched rows copied verbatim (or "Absent"), and the total row count of `Zoekopdrachten.csv`.
12. **Calculated result:** the section D table of baseline value, R1 value and delta for each row and metric, kept separate from any interpretation.
13. **Stop log:** every G condition checked, with PASS or STOP, before calculation.

EV-014's own raw files are referenced by their existing SHA-256 values and are not copied or modified:

```
532941989dffd95e33571b5c1f2bd9b6ef4850c131465925d4dd0a1d3a6f6df0  Apparaten.csv
b9229ff99ad4d634dcfae65e359fe052f37a5785cccc81c49b3e5abed2f18472  Diagram.csv
400f33ecdcdc80bfe50a7becb63ebf5b8a92efeb7f273aa267f64c07b43c7595  Filters.csv
1020aec5df251961ef96a39e9516fad2776d62d9c1b3ad3d252782f75fdc1b1f  Landen.csv
f2b937ebffb5cbe986c6daf9953a2d2607b6fc230b110869272644da08e01a22  Paginas.csv
74f583bb77e0f7dfca42ebf4ba5df37f53d9a1381bd99cb5a666d1853f439e77  Zoekopdrachten.csv
5b6b5172c778f2941d9381691d4a8e59294f658b4413dbd68e97940b940926e0  Zoekopmaak.csv
```

Before calculation, the executor re-hashes these seven files and confirms that the values are unchanged (G-11).

---

## F. Execution procedure (runbook — NOT executed)

*This runbook may be performed only after states H.2 and H.3 are reached. Each step either passes or STOPS. There is no step that permits inference in place of a failed check.*

- **F0 — Authorization check.** Confirm that a DD-041 readiness gate has passed, that a separate Case Owner execution authorization for this protocol exists, and that the date is **on or after 2026-10-22 and on or before 2026-12-31**. Any failure → STOP (G-1, G-2).
- **F1 — Baseline integrity.** Re-hash the seven EV-014 files against section E. Any mismatch → STOP (G-11).
- **F2 — Property identity (CO-4).** Open Search Console. In the property selector, record the exact property string and type and take a screenshot. Compare it with the EV-014 property identity accepted under R-3. Not identical, or not determinable → STOP (G-3). Change no setting, property or permission (DD-024 Condition 10).
- **F3 — Account and timezone (CO-5).** Record the account and permission context and take a screenshot. Record the timezone basis as displayed or determinable, or record `unconfirmed — platform default used` with its source. If F2 did not establish property identity, or the recorded context materially compromises comparability, STOP (G-4; DD-024 Condition 9).
- **F4 — Report configuration.** Open "Prestaties op zoeken". Set search type **Web**. Set a custom date range of **2026-07-22 to 2026-09-21**. Apply **no** other filters. Reopen the date dialog and screenshot it. If the dialog does not show exactly these dates, STOP (G-5).
- **F5 — Availability pre-flight.** Export (CSV). Before any other use, check `Diagram.csv`: **62 rows, contiguous, first 2026-07-22, last 2026-09-21, no missing day**. Any deviation (fewer days, shifted start or end, gaps) → STOP (G-5, G-6). Missing days are never encoded as zero.
- **F6 — Preserve and hash.** Save all downloaded files unmodified to `evidence/raw/search-console-<execution date>/`. Compute SHA-256 values, record the execution timestamp, and write `SHA256SUMS`. Only then may files be opened (DD-024 Condition 11).
- **F7 — Export metadata and integrity.** Record `Filters.csv` verbatim. It must show search type Web, the custom date range and no other filter. Reconcile `Diagram.csv` totals against `Landen.csv` and `Apparaten.csv` totals. Mismatch → STOP (G-7, G-8).
- **F8 — Row extraction.** Record the `Zoekopdrachten.csv` row count and header labels, and extract the five exact rows under D.2. Absent rows are recorded as "Absent — not encoded as zero". Header or structure problems → STOP (G-9).
- **F9 — Calculation.** Compute the section D table. No composite score, no pooled row, no numeric threshold.
- **F10 — Record, do not interpret.** Create the execution observation record with all section E items and all section C.4 limitations, verbatim. This completes state H.4. Interpretation (H.5) is a separate, later step.

---

## G. Stop conditions (STOP — do not infer)

| ID | Condition | Required response |
|---|---|---|
| G-1 | No passed readiness gate, or no separate Case Owner execution authorization | STOP before accessing Search Console |
| G-2 | Execution date before 2026-10-22 or after 2026-12-31 | STOP. After 2026-12-31 this protocol **lapses**, and the window does not slide forward |
| G-3 | **Property identity**: the EV-014 property cannot be established, the replacement property is not identical to it, or the EV-014 property is not accessible | **HARD STOP (CO-4).** Candidate D is not executable under this protocol; return to the Case Owner |
| G-4 | **Account or timezone** not recorded immediately before execution, or recorded context materially compromises comparability | **HARD STOP (CO-5; DD-024 Conditions 7–9)** |
| G-5 | **Unavailable dates**: the date dialog, `Filters.csv` or `Diagram.csv` do not show exactly 2026-07-22 – 2026-09-21 | STOP. Do not substitute a shorter or shifted window, and do not use the DD-040 31-day export |
| G-6 | **Incomplete data**: fewer than 62 daily rows, gaps, or duplicate days in `Diagram.csv` | STOP. Missing days are never encoded as zero (DD-024 Condition 12) |
| G-7 | **Filter mismatch**: search type not Web, or any extra query, page, country, device or appearance filter | STOP |
| G-8 | **Internal inconsistency**: `Diagram.csv` totals do not reconcile with `Landen.csv` and `Apparaten.csv` | STOP |
| G-9 | **Definition drift**: query strings, row matching, metrics, column structure or calculation differ from sections B and D; a numeric threshold or pooled row is introduced; a present row has empty or non-numeric metric cells | STOP |
| G-10 | **Insufficient comparison coverage**: all five rows absent, or both rows of a theme absent | STOP the classification step only. Record the result as Unresolved, and do not interpret it as change |
| G-11 | EV-014 raw files do not match their recorded SHA-256 values | STOP |
| G-12 | Any Search Console setting, property or permission change would be required to proceed | STOP (DD-024 Condition 10) |

A single row being absent is **not** a stop condition. It is recorded under D.4, and that theme is described as Unresolved.

---

## H. Decision and readiness gate

### H.1–H.5 — Five separate states (not collapsible)

| State | Meaning | Reached by | Current |
|---|---|---|---|
| **H.1 Protocol design complete** | This document exists and has been reviewed by the Case Owner | Case Owner review of this artifact | **Designed — review pending** |
| **H.2 Protocol ready for execution** | An independent readiness gate (decisions/DD-041, not yet created) has passed with all R-criteria below met | DD-041 | Not reached |
| **H.3 Execution authorized** | A separate, explicit Case Owner execution authorization naming this protocol | Case Owner decision | Not reached |
| **H.4 Measurement executed** | Runbook F0–F10 completed with no STOP, and an execution observation recorded | Execution | Not reached |
| **H.5 Result interpreted** | Descriptive Phase 6 classification, reviewed by the Case Owner. Any A/B/C selection is a further separate decision | Case Owner review | Not reached |

No state implies the next. Design approval is not readiness, readiness is not authorization, authorization is not execution, and execution is not interpretation.

### Readiness criteria for the future DD-041 gate

- **R-1** — CO-1 to CO-9 are recorded as decided (section J). *Met by Case Owner decision of 28 September 2026, subject to DD-041 confirmation.*
- **R-2** — The CO-1 supplement (61 → 62 days) has been reviewed and accepted as not changing EV-014's content.
- **R-3 — Property identity (HARD STOP, CO-4).** Evidence establishing:
  1. the exact EV-014 property identity;
  2. the exact property to be selected for the replacement export;
  3. that the two are identical;
  4. the property-selector screenshot or record that will be taken at execution;
  5. confirmation that the EV-014 property is currently accessible read-only.

  If identity cannot be established, the gate must record that **Candidate D is not executable under this protocol**.
- **R-4** — The method for recording account and timezone context immediately before execution is specified, including what may be redacted (CO-5).
- **R-5** — The runbook (F) and stop conditions (G) are independently assessed as complete and non-inferential.
- **R-6** — All section C.4 comparability limitations are confirmed disclosed and not characterized as immaterial.
- **R-7** — The date constraints are confirmed: earliest 2026-10-22 (≈31-day buffer after 2026-09-21), final 2026-12-31 (inherited from DD-024 Condition 2).
- **R-8** — DD-024 Conditions 3, 6 (as amended by section J), 7–21 are confirmed carried forward, and Conditions 4 and 5 are confirmed replaced and corrected as stated in section J.
- **R-9** — No Search Console access has occurred in design or gate review.

---

## I. Governance

- **Authority.** decisions/DD-040 Option B authorizes **design only**. This artifact is that design. **This artifact does not itself authorize execution.** Execution requires H.2 (DD-041) and H.3 (a separate Case Owner authorization).
- **Expiry.** The **2026-12-31** boundary is **inherited from DD-024 Condition 2** (DD-040 states no expiry of its own) and is **explicitly retained for this replacement protocol** by Case Owner decision CO-8. After 2026-12-31 the protocol lapses unexecuted, and the window does not slide forward.
- **Reporting buffer.** The ≈31-day buffer (earliest export 2026-10-22) is retained per CO-8. It derives from DD-024 Part C's data-finalization rationale, based on the lag observed in O-001. That observation remains unexplained (section K) and is kept as a conservative choice, not as a claim about Search Console behaviour.
- **DD-024 conditions carried forward unchanged:** 3 (Web), 7–9 (timezone/account; stop), 10 (read-only, no setting changes), 11 (preserve raw first), 12 (no zero-encoding), 13 (descriptive classification only, no numeric band — CO-9), 14–15 (no automatic selection; new decision per outcome), 16 (B/C assumption untested), 17 (exclusions), 18 (no rank promise), 19 (no automation), 20 (OD-002 Design not started), 21 (no Transformation or external changes).
- **Replaced or corrected by this protocol, with authority:** Condition 1 (not before 2026-09-21) is superseded by the stricter 2026-10-22 (CO-8). Condition 4 (window 22 Jun–21 Aug) is replaced by R1 (DD-040 Option B; CO-2). Condition 5 (61-day baseline) is corrected to the factual 62 days (CO-1). Condition 6 (locked property/filters/query strings/metrics/aggregation) is carried forward with CO-6 (separate rows, no pooling) and CO-7 (descriptive context metrics) made explicit. Condition 2 (expiry) is retained (CO-8).
- **Not authorized by this document:** Search Console access; any export; execution; measurement locks; use of the DD-040 31-day export as measurement; selection among A/B/C; Transformation; production, WordPress, GTM or GA4 changes; automation.
- **Lifecycle fields.** This document proposes, but does **not** record, a later governance update: `candidate_d_replacement_protocol_design_started: true`, and a protocol status equal to this document's status. `candidate_d_replacement_protocol_locked` stays `false`, `candidate_d_protocol_executed` stays `false`, and `od_001_design_established`, `transformation_authorized` and `external_changes_authorized` stay `false`. current.md is not modified by this document.

---

## J. Case Owner decisions encoded (28 September 2026)

| ID | Decision | Encoded in |
|---|---|---|
| CO-1 | **APPROVED.** EV-014 = 2026-04-21 to 2026-06-21 inclusive = 62 days. The "61 days" references are corrected by supplement only; historical records and EV-014 are unaltered. | Supplement; C.1; I |
| CO-2 | **APPROVED: R1**, 2026-07-22 to 2026-09-21 inclusive = 62 days. R2 not used. Approval does not assert availability. | B; C.1–C.3; F4–F5; G-5 |
| CO-3 | **APPROVED WITH LIMITATION.** The 30-day gap 2026-06-22 to 2026-07-21 is accepted and disclosed. The windows are not described as contiguous. | C.1; C.4(6) |
| CO-4 | **NOT RESOLVED: HARD STOP.** Property identity must be established; Domain or URL-prefix is not assumed; STOP if not established. | B; E(1–2); F2; G-3; R-3 |
| CO-5 | **PENDING: HARD STOP.** Timezone and account recorded immediately before execution; not invented. | B; E(3–4); F3; G-4; R-4 |
| CO-6 | **APPROVED.** "japans restaurant utrecht" and "japanese restaurant utrecht" stay separate rows. No impression-weighted or pooled metric. | B; D.2; D.5 |
| CO-7 | **APPROVED.** Clicks, impressions and CTR are descriptive context only. Only Δpos enters Phase 6. No composite score. | D.3; D.5 |
| CO-8 | **APPROVED.** ≈31-day buffer; earliest execution/export 2026-10-22; expiry 2026-12-31, inherited from DD-024 and retained explicitly. | F0; G-2; I; R-7 |
| CO-9 | **APPROVED.** Condition 13 unchanged: descriptive only; no numeric Stable band. | D.5; I |

---

## K. Contradictions and open observations found while drafting (recorded, not resolved)

1. **61 vs 62 days** (see the Supplement). Corrected by supplement under CO-1.
2. **DD-024 A-2 / Part C "exact length match"** between a 61-day window and a 62-day baseline was never exact. Recorded, not rewritten.
3. **Unexplained data-availability pattern.** EV-014, exported on 23 July 2026 with the "Afgelopen 3 maanden" preset, contained data only through 2026-06-21. O-001 attributed this to a "typical 1-month reporting lag". The 21 September 2026 export (DD-040) could not show any data **before** 2026-07-22. Together these two observations mean that no export in this case has shown data for 2026-06-22 – 2026-07-21, and that the April–June data seen in July could not be retrieved in September. This pattern is **recorded without a causal claim**. It is one reason R-3 (property identity) is a hard stop: if EV-014 came from a property whose data is not the data now available from 2026-07-22, the comparison is not like-for-like and Candidate D is not executable under this protocol.
4. **DD-024 Part B's comparability reasoning** for timezone and account ("both pulls from the same konnichiwa.nl property") depends on property identity, which is not established (CO-4). Timezone "unconfirmed — platform default used" is therefore acceptable only once R-3 is met.
5. **current.md** does not yet contain DD-040's lifecycle fields, and its `next_action` field is outdated (identified in the 28 September 2026 governance audit). Not changed by this document.

---

## Traceability

Authority: decisions/DD-040 (Option B, 22 September 2026); Case Owner parameter decisions CO-1 to CO-9 (28 September 2026). Inherited constraints: decisions/DD-024 (Binding Conditions 1–21), design/OD-001-candidate-d-measurement-protocol.md (Phases 1–7), decisions/DD-023. Evidence read, not modified: observations/O-001.md (EV-014), evidence/raw/search-console-2026-07-23/ (seven CSVs, SHA-256 listed in section E), diagnosis/DQ-001-investigation.md, evidence/HV-IV-002.md, transformation/HV-IR-001.md (HV-INT-002, HV-INT-008), observations/O-030.md. No Search Console access; no execution; no lock.
