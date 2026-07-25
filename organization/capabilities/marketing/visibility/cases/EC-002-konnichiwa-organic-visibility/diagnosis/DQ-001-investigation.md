# DQ-001 Investigation — Why Flagship Themes Outperform Broad Categories
---

**Status: Completed.** Resulting Candidate Organizational Diagnosis (diagnosis/OD-001-flagship-format-competitive-breadth.md) is now **Established Organizational Diagnosis (Conditional)** — decisions/DD-017, Case-Owner Decision, Kelvin Wong, 25 July 2026. This investigation record itself is preserved unmodified as the historical basis for that establishment; it does not change as a result of the establishment decision.

*Executed under decisions/DD-016's Case-Owner Decision (Kelvin Wong, 25 July 2026), which Authorized DQ-001 without conditions, subject to the Phase 5 scope in decisions/DD-016 and the Question-Specific Rules recorded there. Four roles kept explicitly separate: Role A (Evidence Investigator), Role B (Competing Explanation Constructor), Role C (Falsification Challenger), Role D (Diagnosis Gate Reviewer, see decisions/DD-017). No role used a later role's conclusion as evidence for an earlier role — this file is written in execution order (Phase 1 → 6); Phase 7 (diagnosis/OD-001…md) and Phase 8 (the challenge embedded in that file) were only performed after this file's Phase 6 was complete.*

## Authorized Question

DQ-001 — Why does Konnichiwa perform more strongly for flagship-format search themes than for broader Japanese restaurant and sushi category searches?

## Authorized Target Condition (decisions/DD-016, Phase 5)

The established contrast (UR-001, OU-003): teppanyaki and omakase materially outperform japans restaurant and sushi in non-branded search position, within the stated Search Console window.

---

## Phase 1 — Target Condition Verification (Role A)

Re-read directly against the primary evidence (observations/O-001.md, EV-014) rather than assumed from OU-003's prose, per this task's instruction.

| Search Theme | Theme Class | Surface | Metric | Period | Geography | Device | Source | Confidence | Limitation |
|---|---|---|---|---|---|---|---|---|---|
| Teppanyaki Utrecht | Flagship Specific | Google organic (Search Console) | Avg. position 4.47 (32 clicks / 375 impressions) | 21 Apr–21 Jun 2026 | Aggregate, ~94% NL | All devices, aggregate | EV-014 / O-001 | High | Average position excludes sessions where Konnichiwa was absent entirely |
| Omakase Utrecht | Flagship Specific | Google organic (Search Console) | Avg. position 4.70 (29 clicks / 388 impressions) | 21 Apr–21 Jun 2026 | Aggregate, ~94% NL | All devices, aggregate | EV-014 / O-001 | High | Same as above |
| Omakase Utrecht | Flagship Specific | Google local pack (Maps) | Position 2 of 3 | Single point, 24 Jul 2026 06:41 | Utrecht-confirmed | Mobile only, incognito | EV-018 / O-003 | High for the single observation; Low to generalize | One point/time/device — corroborating context only, **not merged into the organic contrast below** |
| Japans restaurant Utrecht | Broad Category | Google organic (Search Console) | Avg. position 7.38–8.13 (13 + 7 clicks / 1,480 + 284 impressions, two phrasings) | 21 Apr–21 Jun 2026 | Aggregate, ~94% NL | All devices, aggregate | EV-014 / O-001 | High | Two phrasings pooled; not separately trended |
| Sushi Utrecht | Broad Category | Google organic (Search Console) | Avg. position 14.76 (2 clicks / 503 impressions) | 21 Apr–21 Jun 2026 | Aggregate, ~94% NL | All devices, aggregate | EV-014 / O-001 | High | Only 2 clicks — the position estimate at this volume carries real statistical uncertainty |
| Teppanyaki / Japans restaurant / Sushi Utrecht | — | Google local pack (Maps) | Not measured | — | — | — | *(none)* | — | No local-pack observation exists for these three themes — excluded from this diagnosis, not inferred from omakase's local-pack point |

**Surface separation maintained:** the four-theme organic contrast is established entirely from one Search Console dataset (EV-014/O-001), the same window, the same aggregate device/geography scope, for all four themes — a genuine apples-to-apples comparison. Omakase's local-pack position (EV-018/O-003) is retained as adjacent, single-point corroboration for omakase specifically; it is not pooled into the organic ranking and does not extend to the other three themes.

**Verdict: condition confirmed, not reframed.** The organic four-theme contrast survives direct re-reading of the primary evidence, matching OC-001's own Organizational Claim and UR-001/OU-003's inherited wording. Proceeding to Phase 2.

---

## Phase 2 — Evidence Sufficiency Review (Role A)

| Data Type | Available? | Source | Note |
|---|---|---|---|
| Query-level Search Console data | Yes | EV-014 / O-001 | All four themes present |
| Page-level Search Console data | Yes, but not cross-tabulated by query | EV-014 / O-001 | "Top pages" table lists clicks/position per page only; no query×page breakdown exists in this export |
| Query-to-page alignment | **Not directly available** | — | Which physical page serves which query cannot be confirmed from this export; inferred only via page-inventory/title matching (see below) |
| Indexed pages | Partial | observations/O-005.md, HV-IV-007 | Sitemap-based inventory exists; formal Search Console Coverage/Pages report was never collected |
| Titles, H1s, visible content | Partial | HV-IV-007 | Only `/sushi-utrecht/` (substantive, 800–1,000 words) and the homepage were content-assessed; most other pages "not content-checked" |
| Internal links | Not verified | O-007 | Omakase's internal-link plan (design/omakase-pagina-brief.md) not independently re-checked live |
| Language and local relevance | Not separately audited | O-008 | General NAP consistency only, not per-theme |
| GBP category configuration | Yes | O-013 (EV-021, Input 1) | Primary: **Japans restaurant**. Additional: **Sushi takeaway, Sushirestaurant, Teppanyaki-restaurant** |
| Local-pack measurements | One data point (omakase only) | EV-018 / O-003 | Cannot compare across themes |
| Competitor result types | Yes | O-010 / HV-IV-006 | Per-category competitor register, dated 22 Jul 2026 |
| Competitor page/intent alignment | Not independently audited | — | Register lists reputation/identity signals, not competitor page content or confirmed SERP position |
| Review/prominence context | Site-wide only, not per-theme | O-003, O-009, HV-IV-001 | 605 vs. 625 reviews, unreconciled (CR-006, Open) — a single business-level figure, not decomposable by search theme |
| Query-volume data | Search Console impressions only | EV-014 / O-001 | No independent third-party keyword-volume tool exists in this case; none manufactured |

**Assessment:** the evidence base is sufficient to test whether competitive density, category breadth, and (weakly) entity-category signals distinguish the candidate mechanisms, because O-010's competitor register is broken out per category and EV-014's data is broken out per theme. It is **not** sufficient to test true page-level intent alignment or query-to-page ownership with confidence, because no query×page cross-tabulation exists in this Search Console export and most pages were never content-audited. This gap is treated as a Missing Evidence entry against the relevant candidates below, not worked around by assumption.

---

## Phase 3 — Competing Explanation Register (Role B)

*Constructed independently of the falsification results in Phase 5 — initial status is Candidate or Unassessable only, never pre-judged.*

| CE ID | Candidate Mechanism | Evidence Predicted | Supporting Evidence | Challenging Evidence | Missing Evidence | Initial Status |
|---|---|---|---|---|---|---|
| CE-DQ1-A | Search-Intent Alignment — flagship themes' pages/profile signals align more closely with their queries | A dedicated, well-matched page or profile section for the flagship themes | None directly identified yet | Neither teppanyaki nor omakase had a dedicated page during the measured window (omakase: homepage section only; teppanyaki: no page recorded in HV-IV-007's inventory) | Query×page cross-tab (unavailable) | Candidate |
| CE-DQ1-B | Competitive Breadth — broad category queries expose Konnichiwa to a larger/stronger competitor set | More, and stronger, named competitors for the broad themes than the flagship ones | O-010/HV-IV-006: sushi has 6 named competitors, "none dominant"; general Japans/Aziatisch has Ixi (10/10 TheFork) and Maneki; teppanyaki has 1 named competitor with a documented reputation weakness (Juliana, Tripadvisor #753/769); omakase has **no** direct Utrecht competitor | Register is Medium reliability (automated search, single date, not independently SERP-verified) | Confirmed SERP position of the named competitors themselves | Candidate |
| CE-DQ1-C | Query-to-Page Ownership — broad themes have unclear/split page ownership, specific themes have clear ownership | A dedicated, undiluted page for strong themes; absent, duplicated, or diluted pages for weak themes | A duplicate page (`/sushi-page-2/`) exists, a general ownership-confusion signal | `/sushi-utrecht/` is a substantive (800–1,000 word), non-duplicated dedicated page yet ranks *worst* (14.76); the two best-ranking themes (teppanyaki, omakase) have **no** dedicated page at all | Query×page cross-tab | Candidate |
| CE-DQ1-D | Local Entity Relevance — GBP categories/services support specific formats more clearly | Categories present for strong themes, absent for weak ones | Teppanyaki-restaurant category is configured | Sushirestaurant and Sushi takeaway categories are **also** configured, and Japans restaurant is the **Primary** category — yet both underperform despite direct category alignment; GBP category signals map most directly to Maps/local-pack, a different surface than this diagnosis's organic target condition | Per-theme GBP insights/impression breakdown (E-03, Blocking) | Candidate |
| CE-DQ1-E | Authority and Prominence — broad searches weight prominence signals more, where Konnichiwa differs from competitors | Theme-specific prominence/authority differences | None found | Review count/rating (605 or 625, CR-006 Open) is one business-wide figure, not decomposable by search theme or page — a uniform, non-varying signal cannot mechanically produce a differential, theme-varying outcome on its own | Per-competitor, per-theme authority comparison | Candidate |
| CE-DQ1-F | Measurement Artifact — the contrast is exaggerated by surface, device, date, geography, or low query volume | Contrast weakens or disappears once surfaces/periods/devices are separated | Impression volumes differ across themes in a pattern consistent with genuinely different (broader) demand pools for the broad-category terms (japans restaurant: 1,480 + 284 impressions vs. teppanyaki: 375, omakase: 388); sushi's position rests on only 2 clicks, adding real statistical uncertainty | All four themes share one surface (organic), one period, one aggregate device/geography scope — not a cross-surface or cross-period artifact | Device- or day-level breakdown per theme | Candidate |

Six candidates constructed, as supplied in this task's assignment (superseding, for this specific execution, decisions/DD-016 Phase 5's shorter three-item list of the same case owner — Competitive Crowding ≈ CE-B, Content Relevance/Depth ≈ CE-A/CE-C, Category Breadth ≈ folded into CE-B/CE-F, since available evidence cannot cleanly separate "structural breadth difficulty" from "actual named competitor crowding"). No candidate was selected as a favorite before falsification.

---

## Phase 4 — Read-Only Evidence Collection (Role A)

No new evidence was collected beyond the case's existing repository record. This was a deliberate decision, not an omission: O-010/HV-IV-006 (competitor register, broken out per category) and EV-014/O-001 (Search Console, broken out per theme) already provide the differentiating signal Phase 2 identified as available, and a fresh, uncontrolled public search-result check would carry the same non-geo-controlled, single-session limitations this case has repeatedly flagged as lower-reliability (CR-005) without adding distinguishing power over the existing Medium-reliability register. No Search Console, GBP, website, or analytics system was accessed or changed. No keyword-volume tool was purchased or used. No competitor was contacted.

---

## Phase 5 — Falsification Matrix (Role C)

| CE ID | What Would Support It | What Would Falsify It | Test Performed | Result | Remaining Uncertainty |
|---|---|---|---|---|---|
| CE-DQ1-A | A page/profile section demonstrably closer to flagship-query intent than the broad-theme pages | No dedicated page exists for the flagship themes at all | **Attack Intent Alignment** — compared page inventory (HV-IV-007) against the four themes | **Falsified as literally framed.** Teppanyaki and omakase (best-ranking) had no dedicated page during the measured window; the comparison this mechanism requires ("pages that equally match query intent") cannot even be constructed, since one side has no page | Cannot rule out a *non-page* form of intent alignment (e.g., homepage copy, GBP description) — not tested, no evidence available |
| CE-DQ1-B | Named, category-specific competitors demonstrably more numerous/stronger for broad themes | Competitor counts/strength do not differ by category, or differ in the opposite direction | **Attack Competitive Breadth** — checked O-010/HV-IV-006's per-category register against the SC position ordering | **Supported.** The ordinal pattern matches exactly: 0 competitors (omakase, strongest) → 1 weak competitor (teppanyaki, strong) → several strong competitors (japans restaurant/algemeen, weak) → 6 competitors, none dominant (sushi, weakest) | Register is Medium reliability, single-dated (22 Jul 2026), and does not confirm the named competitors' actual SERP positions for these exact queries |
| CE-DQ1-C | Broad themes lack a page or have a diluted/duplicated one; specific themes have a clear one | A clear, substantive page exists for a broad theme and still underperforms | **Attack Page Ownership** — checked whether `/sushi-utrecht/`'s existence and quality predicts its rank | **Falsified.** `/sushi-utrecht/` is substantive (800–1,000 words, not thin, not duplicated) and still ranks worst (14.76) — worse than two themes with no dedicated page at all | Query×page cross-tab absence means it cannot be fully confirmed this exact page is what Google associates with "sushi utrecht," though it is the only plausible candidate page in the inventory |
| CE-DQ1-D | Categories present for strong themes only | Categories present for weak themes too, without a corresponding advantage | **Attack Entity Relevance** — checked current GBP category configuration (O-013) against theme performance | **Falsified as a clean distinguishing mechanism.** Sushirestaurant/Sushi takeaway and the Primary Japans restaurant category are all configured, yet those two themes underperform; category presence does not track the ranking pattern | GBP categories are most directly a local-pack/Maps signal; this diagnosis's target condition is organic search — a surface mismatch that limits how much weight this test can carry either way |
| CE-DQ1-E | A theme-specific authority/prominence difference | Only a uniform, non-theme-specific signal exists | **Attack Prominence** — checked whether review/authority data could vary by theme | **Falsified as an explanation of the contrast.** The only authority signal in evidence (605/625 reviews, CR-006 Open) is a single business-wide figure with no theme decomposition — structurally incapable of producing a differential, per-theme outcome | Says nothing about Konnichiwa's *overall* visibility level, which is out of scope for this diagnosis |
| CE-DQ1-F | Contrast weakens once surface/device/period/geography are separated | Contrast holds only because of mixed surfaces or incomparable periods | **Attack Measurement Artifact** — confirmed all four themes share one surface, one period, one aggregate device/geography scope (Phase 1) | **Not falsified; partially unresolved.** The core contrast is a genuine same-dataset comparison, not a cross-surface artifact. Impression-volume differences (broad themes show materially higher impressions) are consistent with genuinely larger, more contested demand pools rather than noise. Device- and day-level disaggregation was not available and remains untested | Sushi's position rests on only 2 clicks — real statistical volatility at that volume is not fully resolved |

---

## Phase 6 — Explanation Outcomes (Role C)

| CE ID | Outcome |
|---|---|
| CE-DQ1-A (Search-Intent Alignment via dedicated pages) | **Rejected** — the mechanism as stated requires a page-alignment advantage that cannot exist where no page exists |
| CE-DQ1-B (Competitive Breadth) | **Survives with Narrowing** — positive, dated, ordinally-matching evidence, survived a genuine falsification attempt; narrowed because the underlying register is Medium reliability and does not confirm competitors' actual SERP positions |
| CE-DQ1-C (Query-to-Page Ownership) | **Rejected** — directly falsified; the pattern runs opposite to the mechanism's own prediction |
| CE-DQ1-D (Local Entity Relevance) | **Weakly Supported** — retained only as a weak, unresolved, surface-mismatched contributing factor, not a primary mechanism |
| CE-DQ1-E (Authority and Prominence) | **Rejected** — structurally incapable of explaining a per-theme contrast from a uniform, business-wide signal |
| CE-DQ1-F (Measurement Artifact) | **Survives with Narrowing** — the target condition itself is confirmed real and bounded (Phase 1); a specific residual (device/day-level disaggregation, low click-volume statistical uncertainty for sushi) **Requires More Evidence** and is carried forward as an explicit limitation, not treated as invalidating the finding |

No candidate became a diagnosis merely by being the strongest remaining option — CE-DQ1-B is carried forward to Phase 7 because it independently meets all four required tests: positive supporting evidence, surviving falsification, bounded scope, and explicit surviving alternatives (CE-D, weakly, and CE-F's residual uncertainty) rather than a false sense of single-cause certainty.
