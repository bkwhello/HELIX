# HV-MP-003 — HV-INT-002 Day-90 Measurement Specification
---

**Status: Designed — Case Owner Decisions CO-M1 to CO-M10 Resolved — Not Authorized for Execution.** Date prepared: 29 September 2026; revised the same day to incorporate the Case Owner review decisions ("EC-002 — HV-MP-003 Case Owner review decisions", 29 September 2026). Author: Claude, acting as HELIX Measurement Designer for EC-002, under the Case Owner's instruction "EC-002 — HV-INT-002 Day-90 Measurement Specification" (29 September 2026, design only).

**Amendment, 30 September 2026 (prospective):** Case Owner decisions **CO-M9** (day-90 AI scoring reference) and **CO-M10** (remaining scoring rules) are added in sections C, J and M, together with HARD STOP K-12. They replace the earlier correctness reference to evidence/HV-IV-002.md for day-90 scoring only. Scenarios, prompts, runs, CR-003, CR-004, H-1, the Candidate D separation, dates and all historical round-0 results are unchanged.

**Specification design is complete, and all Case Owner decisions are resolved (section M).** **Measurement execution is NOT AUTHORIZED.** No measurement may start merely because this specification is complete. Execution requires a separate readiness/authorization decision (section L, state 3).

**This document specifies a future measurement. It does not perform or authorize it.** No search query, AI prompt, Search Console view or export, or production check was run in preparing it. It was prepared from committed repository records only, at `87edacabd0ee9c2741c6dbb666d83eec9629db25`. It does not change transformation/HV-IR-001.md, measurement/HV-MP-001.md, evidence/HV-TS-001.md or any other historical record.

**Governing sources:** transformation/HV-IR-001.md (HV-INT-002, "Wat hierna gebeurt"); measurement/HV-MP-001.md (§2 principles, §9 AI protocol, §10–13 search protocol, windows and verdicts, data-quality rule); evidence/HV-TS-001.md; evidence/HV-IV-003.md; evidence/HV-IV-004.md; measurement/HV-BL-001.md; Challenge Evidence/CR-register.md (CR-003, CR-004, CR-005); measurement/2026-W34-visibility-brief.md (Overdue status and recovery plan); observations/O-003.md (EV-018), O-005.md, O-030.md, O-032.md (EV-043); design/OD-001-candidate-d-replacement-measurement-protocol.md; decisions/DD-041.

---

## A. Historical checkpoint treatment

| Checkpoint | Date | Status | Basis |
|---|---|---|---|
| Round 0 (baseline) | 2026-07-22 | **COMPLETED** | evidence/HV-IV-003.md (EV-004), evidence/HV-IV-004.md (EV-005 to EV-009), evidence/HV-TS-001.md round 0 |
| Day 7 | 2026-07-29 | **MISSED** | W34: "never executed — registered as Overdue, not silently skipped and not backdated" |
| Day 28 | 2026-08-19 | **MISSED** | W34 (21 August 2026): no validation round executed |
| Day 56 | 2026-09-16 | **MISSED** | No HV-INT-002 round exists in the repository |
| Day 90 | 2026-10-20 (scheduled) | **PENDING** | transformation/HV-IR-001.md measurement windows |

- The missed rounds remain missed. **No retrospective reconstruction** of day 7, 28 or 56 is permitted by this specification. The governed method (search results and AI answers at the moment of measurement) cannot be reproduced for a past date, and W34 forbids backdating.
- Search Console data that exists today for historical dates, including observations/O-005.md's September readings, may be cited **only as contextual, non-governed evidence**, clearly labelled as such, and never as a day-7, 28 or 56 result.
- Round 0 was taken on the go-live date itself (CR-004). EV-018 (24 July 2026, Utrecht local pack) was taken two days after go-live and is supporting baseline context for "omakase Utrecht" only (CR-005 "Resolved for Initial Baseline").

---

## B. Measured object and pre-measurement identity check

**Original intervention objects** (transformation/HV-IR-001.md): `/omakase-utrecht/` and `/teppanyaki-menu/`, live since 22 July 2026, implemented as `omakase-utrecht.php` and `teppanyaki-menu.php` with schema.org Menu/MenuItem blocks, realizing design/omakase-pagina-brief.md.

**Currently recorded state** (repository evidence):

- observations/O-030.md: `/omakase-utrecht/` redirects to `/en/omakase-utrecht/`, which is served as `en-GB` with a Dutch-language title and has no NL translation. This is recorded there as a separate, undiagnosed note.
- observations/O-005.md (22–23 September 2026): URL Inspection of `https://konnichiwa.nl/omakase-utrecht/` reports "not indexed — unknown to Google", with 0 impressions for that exact page from 1 to 20 September 2026.
- The current state of `/teppanyaki-menu/` is **not recorded** in the repository.
- When and why the Omakase URL and language structure changed is **UNKNOWN**.

This specification does **not** assume that `/en/omakase-utrecht/` is equivalent to the original intervention.

**Identity check (step M1, before any scenario is run).** For each original object (`/omakase-utrecht/`, `/teppanyaki-menu/`) and each redirect target, record from public read-only requests:

1. HTTP status of the original URL;
2. redirect chain and final target (including the `x-redirect-by` header where shown);
3. canonical URL;
4. hreflang set;
5. HTML `lang` attribute;
6. indexability (robots meta, `x-robots-tag`, HTTP status);
7. whether the content still represents the original intervention. This is a checklist against design/omakase-pagina-brief.md: both omakase forms (teppanyaki-omakase and sushi-omakase), the chefs' roles, the course and price options, the times and the booking route. Each item is recorded as present, changed or absent. Where a template is available, compare it with the implementation evidence named in HV-IR-001.

**Classification rule (CO-M1, approved; applied at execution time, not now):**

- The identity check is run **exactly as designed** above.
- **Materially equivalent:** content present and substantially unchanged, reachable and indexable at its current URL, established with sufficient confidence. A URL or language change **by itself** is a **disclosed confounder** (section F), not automatically a failure.
- **Materially changed object:** the core omakase or teppanyaki content is absent or substantially different, the page is unreachable, or it is not indexable. → **HARD STOP K-1 for the verdict.**
- **Equivalence not established with sufficient confidence** → **HARD STOP K-1 for the verdict.**
- Under K-1 the scenarios may still be run and recorded as observations, but no HV-INT-002 verdict may be issued.

---

## C. The nine governed scenarios (exact repository wording)

### Search scenarios (evidence/HV-IV-003.md and HV-TS-001.md, round 0, 22 July 2026)

| ID | Query (exact) | Round-0 result | Round-0 detail |
|---|---|---|---|
| HV-TS-SE-01 | "Konnichiwa restaurant Utrecht" | Ja, dominant | Multiple platforms |
| HV-TS-SE-02 | "beste teppanyaki restaurant Utrecht" | Ja | Leading option |
| HV-TS-SE-03 | "sushi restaurant Utrecht" | Ja | One of several |
| HV-TS-SE-04 | "omakase Utrecht" | Zwak | Amsterdam dominates; only via TripAdvisor |

### AI scenarios (evidence/HV-TS-001.md and HV-IV-004.md, round 0, 22 July 2026)

| ID | System | Prompt as recorded | Round-0 result |
|---|---|---|---|
| HV-TS-AI-01 | Claude (cold, no search tool) | "Wat is een goed teppanyaki/sushi restaurant in Utrecht?" (exact wording recorded) | Konnichiwa weak/uncertain; hours n/a; no source |
| HV-TS-AI-02 | DeepSeek | **Recorded only as the label** "Openingstijden/omakase Konnichiwa" (round-0 prompt text not retained) | Mentioned; hours incorrect (0 points); external booking site cited |
| HV-TS-AI-03 | ChatGPT | same label | Mentioned; hours partly correct (50); official site plus 2 deviating sources |
| HV-TS-AI-04 | Gemini | same label | Mentioned; hours incorrect, 30 minutes off (0); official site/blog (implicit) |
| HV-TS-AI-05 | Perplexity | same label | Mentioned; hours partly correct (50); not explicit |

Round-0 AI Factual Accuracy Score (opening-hours scenario only): **25/100**. Round-0 omakase note (HV-IV-004): "3/4 systems confirm omakase when asked directly, but without own page/price/courses/booking option".

**Day-90 prompts (CO-M2, decided).**

- **HV-TS-AI-01 (Claude, cold, no search tool):** the recorded round-0 wording, unchanged: "Wat is een goed teppanyaki/sushi restaurant in Utrecht?"
- **HV-TS-AI-02 to 05 (DeepSeek, ChatGPT, Gemini, Perplexity):** the exact round-0 prompt text is **not retained** in the repository. Only the label is. It is **not reconstructed**, and nobody may claim to know it. For day 90, exactly this prompt is used for all four systems:

  > Wat zijn de openingstijden van Konnichiwa in Utrecht en kun je er omakase eten?

  It is labelled in every record as: **"Day-90 standardized replacement prompt — original Round-0 prompt text not retained."** It may never be described as the original round-0 prompt.
- **Consequence:** because prompt identity is unavailable, AI-02 to 05 **cannot support a strict prompt-identical before/after claim**. Any comparison of these four with round 0 is labelled **"prompt-limited comparison — original Round-0 prompt text not retained."** It is limited to the round-0 scoring dimension (opening-hours correctness, within CR-003).

**What to record — search scenarios:** whether Konnichiwa appears; position or prominence (organic rank, local-pack rank, which platforms); location context (section E); date and time; confidence.

**What to record — AI scenarios:** whether Konnichiwa is mentioned; factual correctness, classified per HV-MP-001 §9 (Fully correct 100 / Partially correct 50 / Incorrect 0) **against the scoring reference and rules of CO-M9 and CO-M10 below** (amended 30 September 2026; the earlier reference to evidence/HV-IV-002.md no longer applies to day-90 scoring); whether a source is cited and which; the AI Factual Accuracy Score, reported with the underlying state counts; confidence; the system and model name as displayed; whether live web search was used.

**CR-003 (binding).** The governed AI comparison stays scoped to what round 0 actually scored: the **opening-hours** facts in HV-TS-AI-02 to 05, and mention/recommendation in HV-TS-AI-01. HV-INT-002's expected effect "AI's citeren prijs/gangen correct" has **no round-0 scored baseline**. Price and course correctness may be **recorded descriptively only** and may **not** receive a governed before/after verdict. The round-0 omakase note (3/4 confirm omakase when asked directly) may be compared descriptively, not as a scored metric. The scope limitation must be restated in the result record.

**Day-90 AI scoring reference (CO-M9, Case Owner decision, 30 September 2026).** Day-90 AI answers are scored against the canonical-hours model in `design/HV-CHM-001-canonical-hours-model.md` at commit `c61448b88a2a251e44a3b6bff75ed4436610b651`, and **not** against evidence/HV-IV-002.md.

- **Public opening and closing:** Mon–Thu 16:00–22:00; Fri–Sun 12:00–22:00; public close = 22:00.
- **Last reservation:** Teppanyaki 21:00; Sushi/Izakaya 21:00.
- **Last Sushi/Izakaya order:** 21:30.
- **Teppanyaki continuing after 22:00:** operational only; never treated as later public opening hours.
- These concepts are **never substituted** for one another. A statement such as "Konnichiwa closes at 21:30" is a public-closing claim and is **not** silently reinterpreted as "last order".
- **Round 0 is unchanged and not rescored.** evidence/HV-TS-001.md, HV-IV-004.md and diagnosis/DQ-005-investigation.md remain historical records, scored against 21:30.
- **Gemini's round-0 answer** (Mon–Thu 16:00–22:00, Fri–Sun 12:00–22:00) may be **described** as corresponding to the canonical 22:00 public close established later. It is **not** retrospectively rescored.

**Remaining scoring rules (CO-M10, Case Owner decision, 30 September 2026).**

- **A — Other concepts.** Claims about lunch, takeaway, delivery, Teppanyaki start time, last reservation, last order, omakase facts, or temporary/holiday hours are checked against the appropriate available canonical or evidence source and recorded **descriptively**. They enter the scored day-90 result **only** if they are themselves explicit public-opening-hours claims. CR-003 remains binding: the scored comparison dimension is public opening hours.
- **B — Single-run classification.** Each scored AI run is classified from its **public-opening-hours claims only**:
  - **Fully correct:** every public opening and closing time the answer states is correct; no incorrect public-hours claim is present; and the answer covers the question sufficiently to give the applicable regular public hours.
  - **Partially correct:** at least one correct public-hours claim, but incomplete for relevant days or day groups; **or** a mixture of correct and incorrect public-hours claims.
  - **Incorrect:** no public-hours claim is correct; **or** the answer gives no public opening hours at all in response to the opening-hours question. A non-answer, or an answer that discusses Konnichiwa or omakase without giving public opening hours, is scored **Incorrect**. It is not excluded.
  - No weighted or composite score is introduced. Each of the three fresh-chat runs is kept separately, and disagreement between runs remains uncertainty (section D).
- **C — Labelled and unlabelled service times.**
  - A time the answer explicitly labels as kitchen hours, last order, last reservation, takeaway, delivery or lunch is evaluated against that corresponding concept and recorded descriptively, unless it also makes an explicit public-hours claim.
  - An **unlabelled** service window given in response to the opening-hours question (for example "16:00–21:30") is treated as a **public-opening-hours claim**. It is not silently reinterpreted as kitchen hours or last order.
  - Ambiguous terminology in the website or another source (for example the Sushi EN page's "Kitchen opens … 21:30") is recorded under the CR-004 confounder assessment (section F). It is not automatically converted into an AI error or into a different concept.

**Scenario scope (CO-M3, approved).** HV-TS-001 says both "dezelfde 9 scenario's" (Volgende ronde) and "Volgende ronde volgt het volledige protocol" (the 30-scenario set of HV-MP-001 §9, which has not been built). The day-90 round keeps the **governed nine-scenario scope** named by HV-IR-001 and HV-TS-001's "Volgende ronde" section. It is **not** expanded to the planned 30-scenario set.

---

## D. Critical-prompt runs

HV-MP-001 §9: "3 runs per critical prompt, 1 run per lower-priority prompt". Which prompts are critical is not defined.

**Rule (CO-M4, approved):**

- Every scored day-90 AI scenario (HV-TS-AI-01 to 05) is treated as **critical**.
- **3 independent runs** per scenario per system, 15 runs in total. Each run uses a fresh conversation, with no prior context and memory or personalization disabled where the product allows it, and the identical prompt wording.
- Each run is retained **separately** (screenshot or export of the full answer, with date and time).
- Runs are **not averaged away**. The score is reported per run and as the mean with state counts (HV-MP-001 §9). Disagreement between runs is recorded as **uncertainty**, and any scenario whose three runs disagree in classification is labelled "run-inconsistent".

**Conflict disclosed.** Round 0 used **1 run per system**. A three-run day-90 result compared with a one-run baseline is asymmetric. For the comparison with round 0, the result must report both the three-run result and the first run on its own, and the asymmetry is a stated limitation. This does not contradict governance: HV-TS-001 states that the next round follows the full protocol.

---

## E. Search-result controls

- **Same query wording** as round 0, exactly as in section C, including capitalization. The four round-0 query strings are unchanged.
- **Round-0 tool: UNKNOWN.** Round 0 used an unidentified "geautomatiseerde zoektool" without location control (HV-IV-003). It is **not reconstructed or guessed**.
- **Day-90 search method (CO-M5, one reproducible method).** Taken from the case's own location-controlled precedent (EV-018, observations/O-003.md):
  1. **Provider/tool:** Google Search, in the Chrome browser, in an **Incognito** window, **signed out**.
  2. **Device:** one mobile device, the same device for all four queries.
  3. **Location:** executed from within Utrecht. Google's displayed location is checked and recorded before the first query (for example the location line at the bottom of the results page).
  4. **Order:** the four queries in the section C order, in one session, each typed exactly, with no autocomplete selection.
  5. **Capture:** a screenshot of each full results page, scrolled so the local pack and the first page of organic results are captured.
- **Record per query:** search provider/tool; exact query; date and time (Europe/Amsterdam); location context (physical location and Google's displayed location); signed-in and personalization state where observable; result type (organic, local pack, AI overview); Konnichiwa's position or prominence (organic rank of the first konnichiwa.nl result, local-pack rank, other platforms listing Konnichiwa on page 1, any AI-overview mention); screenshot and evidence reference.
- **Comparison label.** Any comparison with round 0 is labelled **"method-limited comparison — Round-0 search tool not retained."** It may not be presented as a tool-identical longitudinal comparison. For "omakase Utrecht", EV-018 (24 July 2026, same method, local pack #2) may be cited as method-matched early post-launch context. It is not round 0 and not a missed-checkpoint substitute.
- **Screenshots retained** under the evidence-retention rule (section K-5), with personal data redacted as in EV-043.
- **Limitations disclosed:** personalization, location, device and time variability. **Manual search results alone do not establish organic visibility** (HV-MP-001 §10: search visibility is measured primarily via Search Console and GBP). The search scenarios are the governed HV-INT-002 method; the Search Console component (section G) provides the organic-visibility measure.

---

## F. CR-004 confounder check (step M2 — before any verdict)

Performed and recorded **before** the verdict (CR-004; HV-IR-001; W34 recovery plan step 1). Each confounder is recorded as: present / absent / unknown, its date(s), and whether it could plausibly affect each scenario.

| # | Confounder | Evidence to consult |
|---|---|---|
| F-1 | Amsterdam omakase competition | Re-check against evidence/HV-IV-006.md's competitor register |
| F-2 | Seasonal effects (summer and holiday period, autumn) | Calendar; HV-MP-P-006 list |
| F-3 | Review activity | GBP review count and rating (CR-006 and CR-007 method caveats) |
| F-4 | Restaurant closure, 1–12 August 2026 | evidence/HV-IV-002.md |
| F-5 | HV-INT-008 sitemap submission, 22 September 2026 | transformation/HV-IR-001.md |
| F-6 | URL and language structure changes (Omakase to `/en/`; EN/NL directory changes) | observations/O-030.md; identity check B |
| F-7 | Other material visibility interventions since round 0 | HV-IR-001 (HV-INT-001, 003–008); O-018–O-032 (Private Dining and Catering pages, Catering URL remediation, new pages in August); the sitemap staleness period (O-030) |
| F-8 | AI system and model changes since July 2026 | Model or version as displayed at execution |
| F-9 | Google search-system changes | Publicly documented updates, if any, recorded without attribution |

**No causal claim** may be made unless HV-MP-P-006 is satisfied. Where causation cannot be shown, results are described as observed associations.

---

## G. Search Console component and separation from Candidate D

**Required.** W34 recovery plan step 2: "een nieuwe Search Console-export voor 'omakase Utrecht'/'teppanyaki Utrecht'". HV-MP-001 §10 names Search Console as the primary search-visibility source.

**Property.** The URL-prefix property `https://konnichiwa.nl/`, as established by decisions/DD-041 R-3 and EV-043. The Domain property `konnichiwa.nl` (Niet geverifieerd) may not be used. A selector screenshot is required at execution (K-6).

**Candidate D isolation.** Candidate D (decisions/DD-041) is at H.1 PASS, H.2 PASS and H.3 NOT AUTHORIZED, with earliest execution 2026-10-22. Its governed R1 window is **2026-07-22 through 2026-09-21**, over the query rows including "teppanyaki utrecht" and "omakase utrecht". Day 90 (2026-10-20) falls before Candidate D's earliest execution date.

**Separation rule (binding, CO-M6):**

- **G-S1 — Date-range disjointness.** Before Candidate D's H.4 (measurement executed) is recorded, no HV-INT-002 Search Console view or export may include **any date from 2026-07-22 to 2026-09-21**. This applies to query or page data for any query, because page-level data for those dates would also reveal R1-period performance.
- **G-S2 — Overlapping ranges only after Candidate D.** Any HV-INT-002 range overlapping 2026-07-22 to 2026-09-21 may be viewed or exported only after one of:
  - (a) Candidate D H.4 is recorded;
  - (b) Candidate D formally lapses (after 2026-12-31) or is closed by Case Owner decision;
  - (c) an explicit Case Owner decision that releases the separation, with disclosure.
- **G-S3 — No early Candidate D.** This specification never causes or advances Candidate D's execution.
- **G-S4 — Sequencing.** The non-Search Console day-90 steps (M1 identity, M2 confounders, search and AI scenarios) run inside the operational window of section I. The Search Console component follows later, when section H's readiness checks and G-S1 permit. Until then HV-INT-002 is **measurement in progress** (lifecycle state 5), and **no final verdict is issued**.

G-S1, G-S2 and G-S4 are **binding**. Under CO-M6 this measurement uses only range **H-1 (2026-09-23 through 2026-10-20)**, which is disjoint from R1. **H-2 is not used** in this measurement while Candidate D remains governed separately. HV-INT-002 never inspects or exports Candidate D R1 data.

This follows the Case Owner's preferred approach. Governance supports it: W34 requires the export, while decisions/DD-041 C-7 and R-9 treat pre-execution exposure of R1 values as something to prevent or disclose. Nothing in the repository requires the Search Console component on the same day as the other scenarios.

---

## H. Search Console date range and maturation

The repository defines **no** day-90 export range. **Decision (CO-M6): H-1 is selected** — 2026-09-23 through 2026-10-20 inclusive, 28 days. H-2 and H-3 are recorded below as considered and **not selected**.

**H-1 rule for this measurement:**

- property `https://konnichiwa.nl/`; search type Web; custom range exactly 2026-09-23 to 2026-10-20;
- queries "omakase utrecht" and "teppanyaki utrecht" (exact-query filter), plus page-level data for the intervention URLs and their redirect targets as recorded in M1;
- no date outside the range is viewed or exported;
- a fresh export (W34), retained with SHA-256 values.

Options considered:

| Option | Range | Days | What it answers | Candidate D |
|---|---|---|---|---|
| **H-1 — Late-window (day-90 state) — SELECTED** | 2026-09-23 through 2026-10-20 | 28 | Current organic performance for "omakase utrecht" and "teppanyaki utrecht" (and the intervention URLs) in the 28 days ending on day 90. Consistent with HV-MP-001's "~28 days" window unit. Starts after HV-INT-008 (22 September); F-5 stays a disclosed confounder. | Disjoint from R1 → permitted under G-S1 without waiting for Candidate D |
| **H-2 — Intervention period — not selected** | 2026-07-22 through 2026-10-20 | 91 | Cumulative organic performance since go-live | Overlaps R1 → not used in this measurement |
| **H-3 — Both — not selected** | H-1 now, H-2 later | — | Day-90 state first, full period after Candidate D | H-2 part not used in this measurement |

**Distinctions:**

- **Intervention-period performance:** H-2.
- **Point-in-time day-90 validation:** the section C scenarios on the day, plus H-1 as the organic measure of current state.
- **Candidate D's R1 comparison** (EV-014 compared with 2026-07-22 to 09-21): governed only by the Candidate D replacement protocol. It is not an HV-INT-002 measure and is never calculated here.

**EV-014 (CO-M7).** HV-INT-002's round 0 contains no Search Console measurement. The only pre-launch Search Console data is EV-014 (2026-04-21 to 2026-06-21; "omakase utrecht" 29/388/4.7; "teppanyaki utrecht" 32/375/4.47), which is also Candidate D's baseline. EV-014 may be used **only as descriptive pre-launch context**. It is **not** a substitute day-90 baseline, and it may not support a causal claim or an exact like-for-like claim where methods differ (window length 62 against 28 days, season, UI against export precision). It must not reproduce or pre-empt Candidate D's governed comparison.

**Maturation.** The repository establishes **no factual Search Console processing lag**. The ≈31-day buffer is **not** an established processing lag and is **not** an inherited HV-INT-002 technical requirement. It is recorded as:

> **Case Owner governance buffer adopted conservatively from case precedent** (decisions/DD-024 Part C; replacement protocol CO-8).

1. **Provisional earliest export for H-1:** 2026-10-20 + 31 days = **2026-11-20**.
2. **The readiness checks at export are authoritative:**
   - no processing warning ("Gegevens worden verwerkt", "Geen gegevens") for any part of the range;
   - the complete requested range 2026-09-23 to 2026-10-20 is available;
   - required daily coverage: one row per day, 28 contiguous rows;
   - no unexplained gaps.
3. If any readiness check fails → **STOP (K-7)**, regardless of the 31 days elapsed. Retry later without changing the range.

---

## I. Day-90 timing

- **Scheduled day 90:** **2026-10-20** (HV-IR-001). Unchanged, not moved retroactively.
- **Operational non-Search Console window (CO-M8, approved):** **2026-10-20 through 2026-10-23** (days 90–93), for steps M1, M2 and all nine scenarios. **Nothing is run before 2026-10-20.** Later execution is a **documented deviation**. All AI runs and search checks of the round must fall inside the window.
- **Search Console completion date:** provisional earliest export 2026-11-20 for H-1 (section H). The readiness checks are authoritative.
- **No final HV-INT-002 verdict** is issued until the required Search Console component is complete.
- HV-MP-001 describes the windows as approximate ("~90 days"). The historical schedule is not changed; the operational window is a Case Owner decision, not a governance tolerance.

---

## J. Verdict

- Only the repository-defined verdicts apply (HV-MP-001): **Earned, Provisionally Earned, Inconclusive, Not Earned, Harmful**. No verdict is pre-selected.
- A verdict may be issued only after M1 (identity), M2 (confounders), the scenarios and the H-1 Search Console component are all complete and no HARD STOP is active (lifecycle state 7). **No final verdict is issued before the Search Console component is complete** (CO-M8).
- Every comparison with round 0 carries its limitation label: **"method-limited comparison — Round-0 search tool not retained."** for search, and **"prompt-limited comparison — original Round-0 prompt text not retained."** for HV-TS-AI-02 to 05. Round 0 used one run per system, and day 90 uses three.
- Any round-0 versus day-90 **closing-time** comparison also carries (CO-M9): **"definition-limited comparison — closing-time reference changed (Round 0: 21:30, EV-001 sushi-kitchen hours; Day 90: 22:00 canonical public close, HV-CHM-001 at c61448b, effective 2026-09-29)."** For HV-TS-AI-02 to 05 this label is **in addition to** the prompt-limited label. Historical, prospective, descriptive and method-limited or definition-limited statements are kept separate in the result record.
- **The missed day-7, 28 and 56 rounds materially weaken the assessment of progression and attribution.** Day 90 compares against round 0 only and **does not recreate a missing trend series**. This statement must appear in the result record.
- Per CR-003, AI results feed the verdict only within the round-0 scored scope (opening hours; mention/recommendation). Price and course correctness is descriptive.
- Per HV-MP-P-006, a positive change is an observed association unless the confounders in section F are ruled out.

---

## K. HARD STOP conditions

| ID | Condition | Effect |
|---|---|---|
| K-1 | Material equivalence of the measured object with the original intervention not established with sufficient confidence, or object materially changed (section B, CO-M1) | No verdict; scenarios may be recorded as observations only |
| K-2 | CR-004 confounder assessment (M2) missing or incomplete | No verdict |
| K-3 | Day-90 prompt wording cannot be used exactly as fixed: the round-0 wording for HV-TS-AI-01, or the standardized replacement prompt for HV-TS-AI-02 to 05 (CO-M2); or a replacement prompt would be presented as the original | That scenario is excluded from the governed comparison; if no governed AI scenario remains, no AI component in the verdict |
| K-4 | Search not executed as the section E method (provider/tool, Incognito and signed out, one mobile device, from within Utrecht with Google's location recorded) | That search result is excluded from the governed comparison |
| K-5 | Required evidence (screenshots, per-run AI answers, exports, hashes) cannot be retained, or cannot be retained privacy-safely | Stop that step |
| K-6 | Search Console property identity unresolved (not exactly `https://konnichiwa.nl/`) | Stop the Search Console component |
| K-7 | Any H-1 readiness check fails (processing warning, incomplete range, missing daily coverage, unexplained gap), regardless of the 31-day governance buffer | Stop the Search Console component; retry later without changing the range |
| K-8 | Candidate D separation (G-S1/G-S2) would be violated, including any view or export of a date from 2026-07-22 to 2026-09-21 or use of range H-2 | Stop; do not view or export |
| K-9 | Any settings, production, WordPress, GTM, GA4 or Search Console change would be required | Stop |
| K-10 | A causal attribution would exceed the evidence (HV-MP-P-006) | Restate as an association or withhold the claim |
| K-11 | Any step would reconstruct day 7, 28 or 56 | Stop; missed rounds stay missed |
| K-12 | Scoring-reference or classification drift: a scored day-90 run is evaluated against a reference or classification rule other than CO-M9/CO-M10 | STOP the verdict |

**Evidence retention (for K-5).** Retain raw evidence under `evidence/raw/hv-int-002-day-90-<execution date>/` with `SHA256SUMS`, redacting personal data following EV-043's method (observations/O-032.md) and the account-context rule of decisions/DD-041 R-4. The result is recorded in a new observation.

---

## L. Lifecycle

| # | State | Reached by | Current |
|---|---|---|---|
| 1 | Specification designed | This document | **Reached** (design complete) |
| 2 | Specification approved | Case Owner decisions CO-M1 to CO-M8 (resolved, section M), then Case Owner acceptance of this revised text | Decisions resolved; acceptance of the revised text pending review |
| 3 | Measurement authorized | Separate Case Owner readiness/authorization decision | **Not authorized** |
| 4 | Measurement started | Step M1 begins inside the approved window | Not reached |
| 5 | Non-Search Console scenarios completed | M1, M2 and scenarios recorded | Not reached |
| 6 | Search Console component completed | Section G/H component recorded | Not reached |
| 7 | Verdict issued | Section J, no active HARD STOP | Not reached |
| 8 | Intervention validation closed | HV-IR-001 updated with result, confidence and verdict by Case Owner decision | Not reached |

Reaching one state never implies the next.

---

## M. Case Owner decisions (resolved, 29–30 September 2026)

| ID | Decision | Encoded in |
|---|---|---|
| CO-M1 | **APPROVED.** Identity check run exactly as designed. If material equivalence with the original intervention cannot be established with sufficient confidence, the verdict stops. A URL/language change by itself is a disclosed confounder, not automatically a failure. | B; K-1 |
| CO-M2 | **DECIDED.** Round-0 prompts for HV-TS-AI-02 to 05 are not reconstructed. Day 90 uses exactly "Wat zijn de openingstijden van Konnichiwa in Utrecht en kun je er omakase eten?" for DeepSeek, ChatGPT, Gemini and Perplexity, labelled "Day-90 standardized replacement prompt — original Round-0 prompt text not retained." No strict prompt-identical before/after claim. CR-003 preserved. | C; J; K-3 |
| CO-M3 | **APPROVED.** Governed nine-scenario scope retained; no expansion to the 30-scenario set. | C |
| CO-M4 | **APPROVED.** Every scored AI scenario run three times in independent fresh chats, each run retained, disagreement reported as uncertainty, not averaged away. Limitation of round 0's single run preserved. | D |
| CO-M5 | **DECIDED.** Round-0 search tool UNKNOWN, not reconstructed. One reproducible day-90 method (section E). The four query strings are unchanged. Comparisons labelled "method-limited comparison — Round-0 search tool not retained." | E; J; K-4 |
| CO-M6 | **SELECTED H-1:** 2026-09-23 through 2026-10-20. H-2 not used while Candidate D is governed separately. No Candidate D R1 data inspected or exported through HV-INT-002. G-S1, G-S2 and G-S4 binding. | G; H; K-8 |
| CO-M7 | **APPROVED (limited).** EV-014 only as descriptive pre-launch context. Not a substitute day-90 baseline, and no causal or exact like-for-like claim where methods differ. | H |
| CO-M8 | **APPROVED.** Scheduled day 90 2026-10-20. Non-Search Console window 2026-10-20 to 2026-10-23; nothing before 20 October; later execution is a documented deviation. No final verdict until the Search Console component is complete. | I; J |
| CO-M9 | **APPROVED (30 September 2026).** Day-90 AI answers are scored against HV-CHM-001 at `c61448b88a2a251e44a3b6bff75ed4436610b651`, not HV-IV-002. Public close 22:00; last reservation 21:00 (Teppanyaki and Sushi/Izakaya); Sushi/Izakaya last order 21:30; the Teppanyaki overrun is operational only; concepts are never substituted. Round 0 is not rescored. Closing-time comparisons are labelled definition-limited. Gemini's round-0 answer is descriptive only. | C; J; K-12 |
| CO-M10 | **APPROVED (30 September 2026).** A: other-concept claims are descriptive unless they are explicit public-hours claims (CR-003 binding). B: single-run classification from public-hours claims only; a non-answer is Incorrect; no composite score; three runs kept separately. C: labelled times go to their own concept (descriptive); unlabelled service windows are public-hours claims; source terminology ambiguity goes to CR-004. | C; K-12 |
| Maturation | The ≈31-day buffer is a **Case Owner governance buffer adopted conservatively from case precedent**, not an established processing lag or an inherited technical requirement. Provisional earliest H-1 export 2026-11-20. Readiness checks are authoritative. | H; K-7 |

---

## What this document does not do

- Does not measure, query, prompt, view or export anything.
- Does not reconstruct day 7, 28 or 56.
- Does not assign or pre-select a verdict, and does not reclassify HV-INT-002's status ("Live — Awaiting First Validation — Overdue", unchanged).
- Does not touch Candidate D, its protocol, DD-041 or EV-043.
- Does not modify HV-IR-001, HV-MP-001, HV-TS-001, HV-BL-001, the CR register, current.md or any other artifact.

## Traceability

Authority: Case Owner instruction, 29 September 2026 (design only), following the HV-INT-002 read-only status audit of 29 September 2026. Sources: listed under "Governing sources" above. Created at repository baseline `87edacabd0ee9c2741c6dbb666d83eec9629db25`.
