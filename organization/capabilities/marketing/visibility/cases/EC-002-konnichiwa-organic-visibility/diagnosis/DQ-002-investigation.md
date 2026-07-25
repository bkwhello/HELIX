# DQ-002 Investigation — Name-Variant Visibility Effect
---

**Status: Completed.** Resulting Candidate Organizational Diagnosis (diagnosis/OD-003-name-variant-entity-resolution.md) is now **Established Organizational Diagnosis (Conditional)** — decisions/DD-021, Case-Owner Decision, Kelvin Wong, 25 July 2026. This investigation record itself is preserved unmodified as the historical basis for that establishment; it does not change as a result of the establishment decision.

*Executed under decisions/DD-016's Case-Owner Decision (Kelvin Wong, 25 July 2026), which Authorized DQ-002 With Conditions: visibility scope only (position/CTR/impressions comparison between the correct and misspelled entity-name forms); conversion and business-outcome effects remain excluded per OC-007's Measurement/Attribution Constraint (UR-003) — not lifted by this authorization; the naming inconsistency is not presumed to have an effect — "no supported effect" is an explicitly acceptable, non-failure result; CR-006 remains Open and unreconciled, irrelevant to this question. Four roles kept explicitly separate: Role A (Evidence Investigator), Role B (Competing Explanation Constructor), Role C (Falsification Challenger), Role D (Diagnosis Gate Reviewer, see decisions/DD-021). No role used a later role's conclusion as evidence for an earlier role.*

## Authorized Question

DQ-002 — What visibility effect, if any, is associated with the name inconsistency Konnichiwa versus Konichiwa?

## Authorized Target Condition (decisions/DD-016, Phase 5)

The established naming inconsistency (UR-001, OC-004) — scoped strictly to whether it measurably affects search visibility metrics (position, CTR, impressions). The conversion/business-outcome portion is explicitly excluded from this authorization.

**This investigation excludes throughout:** conversion, revenue, reservations, customer confusion without direct evidence, brand damage without direct evidence, recommendations or corrections, and production changes — per this task's explicit scope instruction, in addition to OC-007/UR-003's binding Attribution Constraint.

---

## Phase 1 — Name-Variant Inventory (Role A)

Verified directly against existing case evidence (HV-IV-001, HV-IV-003, O-008, O-013/EV-021) and this investigation's own read-only inspection of konnichiwa.nl's homepage HTML (25 July 2026).

| Spelling | URL / Platform | Page Element / Field | Source | Capture Date | First/Third-Party | Current/Historical | Confidence |
|---|---|---|---|---|---|---|---|
| **Konnichiwa** (correct) | konnichiwa.nl | `<title>`, meta description, body text (165 occurrences checked) | This investigation, direct HTML fetch | 25 July 2026 | First-party | Current | High |
| **Konnichiwa** (correct) | konnichiwa.nl | Search Console query-driven landing page (property itself) | EV-014 (O-001.md) | Export 23 July 2026 | First-party | Current (61-day window, 21 Apr–21 Jun 2026) | High |
| **Konnichiwa** (correct) | GBP business-name field | "Bedrijfsgegevens" panel | EV-021 (O-013.md) | 2026-07-24 | First-party | Current snapshot only | High |
| **Konnichiwa** (correct) | TripAdvisor, TheFork | Listing name | HV-IV-001, HV-IV-003 | 22 July 2026 | Third-party | Current as of capture | Medium (third-party, not independently re-verified this run) |
| **Konichiwa** (misspelled, single n) | Yelp | Business listing name/title (confirmed via this investigation's WebSearch: "KONICHIWA... Yelp") | HV-IV-003; re-confirmed this investigation | 22 July 2026 (original); 25 July 2026 (re-confirmed) | Third-party | Current as of both captures | Medium-High |
| **Konichiwa** (misspelled) | Tripadvisor | Page `<title>` specifically (not the listing body, per HV-IV-003) | HV-IV-003 | 22 July 2026 | Third-party | Current as of capture, not re-verified this run | Medium |
| **Konnichi Wa** (split, correct letters) | Instagram (@konnichi_wa_utrecht) | Bio / display name | HV-IV-001 | 22 July 2026 | Third-party | Not re-verified this run | Medium (not re-verified) |
| **Konnichi Wa** (split) | Facebook | Page name ("Konnichi Wa \| Utrecht \| Facebook", confirmed via this investigation's WebSearch) | HV-IV-001; re-confirmed this investigation | 22 July 2026; 25 July 2026 | Third-party | Current as of both captures | Medium-High |
| **Konnichi Wa** (split) | Eet.nu | Listing name | HV-IV-001 | 22 July 2026 | Third-party | Not re-verified this run | Medium (not re-verified) |
| **Konnichi Wa** (split) | Quandoo | Listing name ("Book a table at Konnichi Wa in Utrecht", found this investigation) | This investigation, WebSearch | 25 July 2026 | Third-party | Current | Medium (uncontrolled search result, not directly loaded/verified) |
| "@konnichiwagroup" (unrelated second Instagram handle) | Instagram | Handle surfaced in search results | HV-IV-001 | 22 July 2026 | Third-party (possibly unrelated) | Ownership unconfirmed | Low — Kelvin's ownership of this account was never confirmed in this case |

**Search-query-level variant inventory (Role A, direct re-analysis of EV-014's raw export, `evidence/raw/search-console-2026-07-23/Zoekopdrachten.csv` — permitted read-only re-analysis, no new export):**

156 distinct query strings contain a "nichi"-family root. Classified by exact spelling:

| Family | Distinct queries | Total clicks | Total impressions |
|---|---:|---:|---:|
| Correct ("konnichiwa" root, double-n) | 75 | 351 | 5,936 |
| Misspelled ("konichiwa" root, single-n) | 79 | 96 | 4,890 |
| Split-word ("konichi wa" spacing) | 2 | 5 | 28 |

**Do not treat as equivalent evidence, per this task's explicit instruction:** search snippets (WebSearch titles, uncontrolled, no geo-control — Phase 3), page titles (Tripadvisor's page-title-only misspelling vs. its listing body), GBP names (first-party, authenticated, Direct System Screenshot), directory listings (Yelp/Quandoo/Facebook, third-party, not independently re-verified beyond this run's search snippets), and Search Console query data (first-party, platform-exported, highest reliability class in this case) are kept in separate rows and separate evidence classes throughout this table and this investigation.

---

## Phase 2 — Canonical Entity Baseline (Role A)

Established from authoritative first-party evidence only. No listing or page was changed.

| Identifier | Value | Source |
|---|---|---|
| Official business name | Konnichiwa (one word, correct spelling — "besloten: 'Konnichiwa' (aan elkaar) is de officiële naam," per HV-IV-001) | HV-IV-001 (22 July 2026), confirmed unchanged in GBP EV-021 (24 July 2026) |
| Official website domain | konnichiwa.nl | EV-021 (GBP website field), confirmed live via this investigation's direct fetch |
| Canonical address | Mariaplaats 9, 3511 LH Utrecht | EV-001/EV-021 |
| Phone number | 030 241 6388 (+31 30 241 6388) | EV-001/EV-021 |
| Primary entity identifiers | Legal entity: Konnichiwa B.V., KVK 30161941 | HV-IV-002, EV-002 |
| Consistent first-party location | konnichiwa.nl (website: title, meta description, and body text all use "Konnichiwa," correct spelling, no split or misspelled variant found in this investigation's direct HTML check, 25 July 2026) | This investigation |
| Consistent first-party location | Google Business Profile business-name field: "Konnichiwa," correct spelling, current as of 2026-07-24 | EV-021/O-013 |
| **Inconsistent first-party-adjacent location** | Konnichiwa's own social-media presence (Instagram bio, Facebook page name) uses the split "Konnichi Wa" form, per HV-IV-001 (22 July 2026, not re-verified live this run) — these are owner-controlled accounts, so this is treated as first-party-adjacent, not pure third-party, though this investigation did not re-authenticate into either account | HV-IV-001; re-confirmed as still showing "Konnichi Wa" via this investigation's WebSearch snippet only (not a verified authenticated check) |

**Conclusion:** the canonical entity is unambiguous and internally consistent at its two most authoritative first-party surfaces (website, GBP) — both use "Konnichiwa" exclusively, as of the most recent evidence in each case. The inconsistency documented in OC-004/O-008 persists primarily in Konnichiwa's own social accounts (Instagram, Facebook) and in independent third-party directories (Yelp, Tripadvisor page title, Quandoo), not in the two primary discovery surfaces this investigation's target condition concerns (organic search via the website, and GBP itself).

---

## Phase 3 — Visibility Evidence (Role A)

Existing case evidence (O-001/EV-014, O-002/EV-015) used first — see Phase 4 for the full Search Console assessment. Two bounded, public, read-only searches were additionally performed to test entity resolution specifically, per this task's explicit Phase 3 instruction.

| # | Exact query | Location controls | Signed-in/incognito | Device | Timestamp (Europe/Amsterdam) | Surface | Observed result | Limitations |
|---|---|---|---|---|---|---|---|---|
| 1 | "Konnichiwa Utrecht" | **None — this tool has no geo-control** | Not applicable (API-based search tool, not a browser session) | Not applicable (server-side tool call, not a physical device) | 25 July 2026, ~09:00 | Uncontrolled public web search (organic web listings only — **not** a verified Google consumer SERP, **not** local pack, **not** Knowledge Panel) | 10 results returned, all identifiably Konnichiwa's own listings across platforms (own site, TripAdvisor, TheFork, Wanderlog, Yelp — titled "KONICHIWA" — Quandoo — titled "Konnichi Wa" — Facebook, Instagram); no competing or ambiguous different business appeared | **Not geo-controlled — must not be used as proof of Utrecht-wide ranking, per this task's explicit instruction.** Used only to test entity-resolution/coexistence, not ranking position. Consistent with this case's standing classification of uncontrolled WebSearch as a lower-reliability evidence class (Challenge Evidence/CR-register.md, CR-005) |
| 2 | "Konichiwa Utrecht" | **None — no geo-control** | Not applicable | Not applicable | 25 July 2026, ~09:01 | Uncontrolled public web search (same class as above) | 10 results returned; 9 of 10 identifiably Konnichiwa's own listings (Yelp — "KONICHIWA" — own site, TripAdvisor, TheFork, Wanderlog, RestaurantGuru, Facebook); 1 of 10 (rank 10) was Wikipedia's generic "Konnichiwa" (the Japanese greeting) article — a **generic-term ambiguity**, not a competing business entity | Same geo-control limitation as above. The Wikipedia result reflects "konnichiwa" also being a common dictionary word, a structural ambiguity that would apply at least as much to the *correctly*-spelled query — not evidence of a misspelling-specific effect |

**Entity-resolution finding:** across both bounded tests, **no competing or ambiguous different business** appeared for either spelling. All business-specific results, regardless of which spelling the underlying platform itself uses (Yelp: "Konichiwa"; Quandoo/Facebook: "Konnichi Wa"; TripAdvisor/TheFork/own site: "Konnichiwa"), resolve to the same entity at Mariaplaats 9, Utrecht. This is treated as supplementary, non-authoritative context (per the stated geo-control limitation) — the stronger, first-party evidence for entity resolution is Phase 4's direct Search Console analysis below.

**Branded vs. non-branded discipline:** all evidence in this phase and Phase 4 concerns branded (name-containing) queries only. This investigation does not mix this evidence with OC-001's non-branded theme performance (japans restaurant utrecht, sushi utrecht) — see Phase 5, Candidate D, for why that connection is not tested here.

---

## Phase 4 — Search Console Assessment (Role A)

Direct re-analysis of EV-014's raw, already-collected export (`evidence/raw/search-console-2026-07-23/Zoekopdrachten.csv`) — permitted per decisions/DD-016 ("read-only re-analysis of already-collected EV-014/EV-015 data; no new export required"). Window: 21 Apr–21 Jun 2026 (61 days), per O-001's own stated limitation; device/country breakdown not available at the per-query level in this export (matches this case's existing E-03-style limitation — **recorded as "not available," not encoded as zero**).

### The two queries this task names explicitly

| Query | Clicks | Impressions | CTR | Avg. Position |
|---|---:|---:|---:|---:|
| "konnichiwa utrecht" (correct) | 183 | 991 | 18.47% | **2.68** |
| "konichiwa utrecht" (misspelled) | 22 | 88 | 25.00% | **1.74** |

### Unqualified brand-name comparison

| Query | Clicks | Impressions | CTR | Avg. Position |
|---|---:|---:|---:|---:|
| "konnichiwa" (correct) | 129 | 4,147 | 3.11% | **5.46** |
| "konichiwa" (misspelled) | 62 | 3,710 | 1.67% | **3.99** |

### Full-family aggregate (all 75 correct-spelling and 79 misspelled-spelling query variants, including typo long-tail)

| Family | Clicks | Impressions |
|---|---:|---:|
| Correct | 351 | 5,936 |
| Misspelled | 96 | 4,890 |
| Split-word ("konichi wa" spacing) | 5 | 28 |

**Findings, stated plainly:**

- **Position:** the misspelled form shows a *better*, not worse, average position in both direct comparisons (1.74 vs. 2.68 for the Utrecht-qualified pair; 3.99 vs. 5.46 for the unqualified pair). Google is not ranking Konnichiwa's own site worse for the misspelled query.
- **Impressions/volume:** the correct spelling shows substantially higher impression volume at the Utrecht-qualified level (991 vs. 88, an ~11× difference) and a more modest difference in full-family aggregate (5,936 vs. 4,890, ~1.2×). This reflects how many people search using each spelling — a demand-side fact — not a ranking-quality fact.
- **CTR:** mixed — higher for the misspelled Utrecht-qualified query (25.00% vs. 18.47%), lower for the misspelled unqualified query (1.67% vs. 3.11%). No consistent directional pattern favoring one spelling over the other.
- **Entity resolution (structural):** because Search Console is inherently scoped to the konnichiwa.nl property, **every row in this export — including all 79 misspelled-family queries — represents real users who searched the misspelled form and were served konnichiwa.nl's own pages**, with 96 of them clicking through to the site itself. This is direct, first-party, platform-level evidence that Google functionally associates the misspelled query with Konnichiwa's own site — not an assumption, not autocorrection-inferred.
- **Query-level evidence for a variant is not absent anywhere in this comparison** — both named queries, and the full families, have real, non-zero data. No figure in this section is encoded as zero for a genuinely missing variant.
- **This investigation does not infer that Google "corrected" or "merged" the spellings** as a deliberate mechanism — only that the observed, platform-reported behavior (impressions and clicks against konnichiwa.nl for both spelling families) is consistent with functional resolution to one entity, without asserting the underlying mechanism (spell-correction, fuzzy matching, or otherwise).

---

## Phase 5 — Candidate Explanations (Role B, tested by Role C)

| Candidate | Predicted observable pattern | Supporting evidence | Contradicting evidence | Missing evidence | Falsification test | Result | Confidence | Causal status |
|---|---|---|---|---|---|---|---|---|
| **A** — Google reliably resolves both spellings to one entity | Both spellings generate real impressions/clicks on konnichiwa.nl; no competing entity appears | Phase 4: 79 misspelled-family queries, 4,890 impressions, 96 clicks, all structurally on the konnichiwa.nl property; Phase 3: both bounded WebSearch tests show only Konnichiwa's own listings, no competing business | None found | A confirmed Knowledge Panel / local-pack cross-check for the misspelled query specifically (not obtained — WebSearch surface only) | **Survives** | Medium-High (High for the SC structural evidence; Medium for the supplementary, non-geo-controlled WebSearch corroboration) | Associatively consistent (not causally explained — mechanism, e.g. spell-correction vs. fuzzy matching, not established) |
| **B** — The misspelling creates entity ambiguity or fragmented signals | Competing or inconsistent entity results; fragmented, non-converging listings | None found | Both Phase 3 tests and Phase 4's structural SC evidence show convergence, not fragmentation, on one entity | A case of the misspelled query surfacing a different business or no relevant result | Checked directly in both Phase 3 tests and against Phase 4's click data | **Rejected** | Medium-High | Not established |
| **C** — The misspelling affects only branded-query retrieval | Any effect found is confined to name-containing queries, not category terms | All evidence in this investigation is branded-query data by construction | None found (not contradicted — untested territory) | Non-branded category-term data cross-referenced against naming state — out of this investigation's authorized scope | Not testable within this investigation's target condition, which is itself scoped to branded/naming metrics only | **Unassessable within this investigation's scope** (not false, not confirmed — the comparison this candidate requires is outside DQ-002's authorized target condition) | Low | Not established |
| **D** — The misspelling contributes to broader non-branded visibility differences | A connection between naming state and OC-001's flagship/broad-category contrast | None sought — **UR-001's own Excluded Interpretation already states this connection is not evidenced** ("That the naming inconsistency causes, contributes to, or explains the flagship/broad-category contrast") | UR-001's Challenge (Role B, decisions/DD-015) already tested and excluded this specific connection | No new evidence bearing on this connection was collected or sought this run | Not re-tested — this task's own guardrail prohibits using DQ-001's diagnosis as proof of a spelling effect, and this investigation similarly does not use UR-001's established exclusion as proof of the *reverse* — it simply does not reopen an already-settled boundary | **Rejected (inherited, not re-tested)** — consistent with UR-001's standing, established exclusion | High (inherited from UR-001's own challenge) | Not established |
| **E** — Third-party listings introduce or reinforce the variant | Named third-party platforms use the misspelled or split form | HV-IV-001/HV-IV-003 directly name Yelp and the Tripadvisor page title (misspelled); Instagram, Facebook, Eet.nu, Quandoo (split "Konnichi Wa") — confirmed still current for Yelp and Facebook via this investigation's own Phase 1 re-check | None found | Direct, authenticated re-verification of each platform's current listing (not performed — this investigation used only public search snippets) | Cross-checked Phase 1's inventory against Phase 3's fresh search snippets — consistent | **Survives** | Medium-High | Descriptive (a real, confirmed condition, not itself a mechanism claim) |
| **F** — Search suggestions/autocorrection neutralize the difference | Google visibly offers a "did you mean" correction or auto-corrects the query | None directly observed — this investigation's tools do not expose Google's own consumer-facing SERP autocorrect UI element | None found (not contradicted — untested) | A verified, real Google SERP screenshot showing (or not showing) an autocorrect prompt for "konichiwa utrecht" | Not testable with available tools | **Needs More Evidence** | Low | Not established |
| **G** — Observed differences are location, device, personalization, or timing effects | Position/CTR differences vary systematically by device, location, or time rather than by spelling itself | None available — Zoekopdrachten.csv has no per-query device/location breakdown (matches this case's E-03-style structural limitation) | None found (not contradicted — untested) | Per-query device/geography export (not available in Kelvin's Search Console interface, per this case's standing limitation) | Not testable — **recorded as "not available," not encoded as zero or dismissed** | **Needs More Evidence** | Low | Not established |
| **H** — The inconsistency exists but has no measurable visibility effect in the available evidence | Position/CTR do not show the misspelled form performing worse; only volume differs | Phase 4: misspelled position is equal-to-better in both direct comparisons (2.68→1.74; 5.46→3.99); CTR shows no consistent disadvantage; the measurable difference (impressions/clicks) is bounded and attributable to differential query-typing volume, not a ranking penalty | None found | A larger sample would sharpen confidence, but the two direct comparisons and the full-family aggregate agree in direction | Directly tested against Phase 4's real position/CTR figures for both the exact Utrecht-qualified pair and the unqualified pair | **Survives with Narrowing** — narrowed specifically to position/CTR (ranking quality); the real, measurable impression/click volume difference is not claimed to be absent, only attributed to demand rather than penalty | Medium-High | Associatively consistent |

No candidate was promoted because alternatives lacked evidence — B and D were actively tested/inherited-tested and rejected with specific, cited reasons, not left unsupported by default; C, F, and G are honestly recorded as outside-scope or untestable rather than assumed in either direction.

---

## Diagnosis Construction

Two candidates (A, H) survive with real, distinguishing, converging evidence across independent sources (Search Console's structural property-scoping, direct position/CTR comparison, and supplementary cross-platform search-snippet checks). This is not a forced diagnosis — per this task's explicit permission that "no supported effect" is an acceptable, non-failure result, and given the evidence here positively and specifically supports that outcome (not merely an absence of contrary evidence), a bounded Candidate Organizational Diagnosis is warranted. See diagnosis/OD-003-name-variant-entity-resolution.md.
