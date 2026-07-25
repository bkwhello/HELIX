# OD-003 — Name-Variant Search Traffic Resolves to Konnichiwa's Own Site Without a Measured Ranking Penalty

## Status

**Established Organizational Diagnosis.** Establishment: **Conditional**. Authority: decisions/DD-021, Case-Owner Decision (Kelvin Wong, 25 July 2026). *Previously Candidate Organizational Diagnosis, 25 July 2026, then Survives on independent challenge (Independent Challenge section, below) — established with all twelve of decisions/DD-021's Case-Owner Decision conditions accepted as binding.*

**Authoritative formulation (decisions/DD-021, Case-Owner Decision — supersedes any other phrasing elsewhere in this document):**

> "Within the EV-014 Search Console dataset and its documented query pairs, both 'Konnichiwa' and 'Konichiwa' generated impressions and clicks for Konnichiwa's own website. In those observations, the misspelled variant did not show a worse average position or CTR than the corresponding correctly spelled variant. This does not establish universal entity resolution or the absence of visibility effects outside the measured queries, period, device, country and search surface."

**Authoritative confidence (decisions/DD-021, Case-Owner Decision, confidence determination, Kelvin Wong, 25 July 2026): Medium.** This is the active, citable confidence level for this diagnosis, superseding the Medium-High level recorded in the Confidence section below — that section is preserved unchanged as the original, gate-reviewed assessment (historical). Medium reflects: only the documented EV-014 query pairs were tested; the evidence comes from one bounded Search Console dataset; device/country/time segmentation is incomplete; the public searches were not geographically controlled; and universal entity resolution was not established.

This sentence is the sole authoritative statement of this diagnosis's finding. It does **not** establish universal entity resolution, and it does **not** establish the absence of visibility effects outside the measured queries, period, device, country, and search surface. The remainder of this document (Diagnosed Mechanism, Falsification History, Independent Challenge, and other sections below) is preserved unmodified as supporting analysis from the original investigation and challenge, but must be read through, and cited only via, the formulation above. Established **only** for DQ-002, only for the EV-014 dataset, its documented date window, and the specific query pairs recorded in diagnosis/DQ-002-investigation.md — see decisions/DD-021's Case-Owner Decision, Diagnosis Scope section, for the full boundary.

## Authorized Question

DQ-002

## Condition Explained

Within the 21 Apr–21 Jun 2026 Search Console window, both the correctly-spelled "konnichiwa" and the misspelled "konichiwa" query families generate real impressions and clicks on konnichiwa.nl, and the misspelled form does not show a worse average organic position than the correct form for either of the two directly-comparable query pairs tested.

## Diagnosed Mechanism

Search Console is inherently scoped to the konnichiwa.nl property — every one of the 79 misspelled-family query rows in EV-014's raw export represents real searchers who were served konnichiwa.nl in results, 96 of whom clicked through. Combined with two bounded, supplementary search-snippet checks (Phase 3) that found no competing or ambiguous different business for either spelling, this is recorded as an **associatively consistent, structurally-evidenced finding, not a proven causal mechanism**: the naming inconsistency documented in OC-004 does not, on this evidence, prevent Google from functionally directing name-variant searchers to Konnichiwa's own site, and does not correspond to a worse average position for the misspelled form in either directly-tested query pair (1.74 vs. 2.68; 3.99 vs. 5.46 — misspelled better in both). No claim is made about *why* this occurs (spell-correction, fuzzy matching, or another mechanism) — only that the observed platform-reported behavior is consistent with functional resolution.

## Contributing Conditions

- A real, measurable impression/click **volume** difference exists between spelling families (correct: 5,936 impressions/351 clicks; misspelled: 4,890 impressions/96 clicks, full aggregate) — this is not disputed or hidden, but is attributed to differential underlying search-typing demand for each spelling, not to a Google-side visibility penalty, since position and CTR do not show a corresponding disadvantage for the misspelled form.
- Third-party listings (Yelp, Tripadvisor page title: misspelled "Konichiwa"; Instagram, Facebook, Eet.nu, Quandoo: split "Konnichi Wa") continue to reinforce the underlying inconsistency at the platform level, independent of Google's own search-result behavior toward it.

## Rejected Explanations

- **Entity ambiguity or fragmented signals (Candidate B)** — directly rejected: both bounded search tests and the structural Search Console evidence show convergence on one entity, not fragmentation or a competing business.
- **A contribution to OC-001's non-branded flagship/broad-category contrast (Candidate D)** — not re-tested; this diagnosis explicitly inherits and does not reopen UR-001's own established Excluded Interpretation, which already found no evidence connecting the naming inconsistency to that separate contrast.

## Unresolved Alternatives

- **Whether the misspelling affects only branded-query retrieval, with no bearing on non-branded category performance (Candidate C)** — outside this investigation's authorized target condition (branded/naming metrics only); not tested, not excluded.
- **Whether Google's own autocorrect/suggestion UI visibly neutralizes the difference for a real user (Candidate F)** — could not be tested with available read-only tools; no live, verified Google consumer SERP screenshot was obtained.
- **Whether device, location, or timing effects contribute to the observed volume difference (Candidate G)** — no per-query device/geography breakdown exists in Kelvin's Search Console interface; recorded as "not available," not assumed absent.
- Whether the third-party platforms still listed under a variant spelling (Instagram, Facebook, Eet.nu, Quandoo, Yelp) continue to do so at present — Phase 1's inventory relies on the original 22 July 2026 case evidence plus this investigation's own unauthenticated search-snippet spot-check (25 July 2026); no authenticated re-verification of each individual listing was performed.

## Supporting Understanding

- OU-003 — Search and Entity Presence Pattern (adjacent context; this diagnosis does not add to or modify OU-003's own established boundaries)

## Supporting Claims and Evidence

- OC-004 — Inconsistent Entity Naming With Measurable Real Search Volume
- UR-001 — Search and Entity Presence Pattern (narrowed wording only; its Excluded Interpretation is inherited, not reopened)
- EV-014 (Search Console export, O-001.md), specifically `evidence/raw/search-console-2026-07-23/Zoekopdrachten.csv`, re-analyzed directly by this investigation
- diagnosis/DQ-002-investigation.md, Phase 3 (two bounded, dated, non-geo-controlled search-snippet checks, 25 July 2026) and Phase 4 (direct Search Console re-analysis)

## Scope

- Query themes: name-variant (branded) queries only — "konnichiwa"/"konichiwa" and their close family variants; not the four non-branded target themes (OC-001)
- Surfaces: Google organic search (Search Console) as the primary evidence; two bounded, uncontrolled public web-search snippet checks as supplementary, non-authoritative context only — not local pack, not Knowledge Panel, not a verified consumer SERP
- Geography: Search Console data not geographically broken out beyond the case's standing ~94% NL aggregate; the two supplementary search checks have **no geo-control at all** and must not be cited as Utrecht-specific
- Period: 21 Apr–21 Jun 2026 (Search Console); 25 July 2026 (supplementary search checks)
- Devices: Search Console all-devices aggregate; no per-query device breakdown exists

## Confidence

- **Active Level (decisions/DD-021, Case-Owner Decision, 25 July 2026): Medium.** Bounded by: only the documented EV-014 query pairs were tested; the evidence comes from one bounded Search Console dataset; device/country/time segmentation is incomplete; the public searches were not geographically controlled; universal entity resolution was not established.
- Original gate-reviewed Level (historical, preserved unchanged as part of decisions/DD-021's gate analysis — no longer the active/authoritative confidence): **Medium-High**
- Rationale (historical, unchanged): the core structural finding (misspelled-query traffic reaching konnichiwa.nl) rests on Search Console's own property-scoped design — a direct, first-party, platform-level fact, not an inference. The position/CTR comparison is direct and real for both tested query pairs. Confidence is capped below High because: the supplementary entity-resolution checks are non-geo-controlled and lower-reliability by this case's own standing classification; device/location/timing effects (Candidate G) remain untested; and the sample, while real, is one 61-day window without a comparison period.

## Limitations

- E-03-style limitation: no per-query device or geography breakdown exists in this case's Search Console evidence.
- The two supplementary WebSearch checks (Phase 3) are explicitly non-geo-controlled and must not be cited as proof of Utrecht-wide ranking or local-pack behavior — consistent with this case's standing treatment of uncontrolled search checks (Challenge Evidence/CR-register.md, CR-005).
- Third-party listing states (Yelp, Facebook, Instagram, Eet.nu, Quandoo) are not authenticated-verified as of this investigation; Phase 1's inventory relies on prior case evidence (22 July 2026) plus unauthenticated search snippets (25 July 2026).
- This diagnosis does not establish why Google's results behave this way (mechanism unknown — spell-correction, fuzzy matching, or otherwise), only that the observed behavior is consistent with functional resolution.
- CR-006 (605 vs. 625 reviews) is not referenced or relied upon anywhere in this diagnosis.

## Falsification History

See diagnosis/DQ-002-investigation.md, Phase 5 (full Candidate Explanation matrix). Summary: 8 candidates tested; Candidate A (entity resolution) Survives; Candidate B (fragmentation) Rejected; Candidate D (non-branded contribution) Rejected via inheritance from UR-001's own prior exclusion, not re-tested; Candidate E (third-party reinforcement) Survives; Candidates C, F, G remain outside-scope or Needs More Evidence, honestly preserved as open rather than resolved either way; Candidate H (no measurable position/CTR effect) Survives with Narrowing.

## What This Diagnosis Does Not Establish

- Conversion impact — excluded by UR-003's Attribution Constraint (OC-007), per this task's explicit scope exclusion.
- Revenue or reservation impact — same exclusion.
- Customer confusion — not evidenced directly anywhere in this investigation; not claimed.
- Brand damage — not evidenced directly anywhere in this investigation; not claimed.
- Any effect on non-branded category search performance (OC-001) — Candidate D explicitly inherits UR-001's own established exclusion, not reopened here.
- Whether Google's autocorrect/suggestion behavior is the specific mechanism (Candidate F, Needs More Evidence).
- Device-, location-, or timing-specific effects (Candidate G, Needs More Evidence).
- That any recommendation, correction, listing change, or production change would improve or worsen this condition — no intervention was tested, proposed, or implied.
- A generalization beyond the two directly-tested query pairs and the full-family aggregate — this diagnosis does not claim to characterize every possible misspelling variant individually (many long-tail rows have zero clicks and were not individually analyzed beyond the aggregate).

## Design Boundary

No design or intervention is authorized by this diagnosis. This record does not select, recommend, or imply any listing, GBP, website, schema, or metadata action. Any future design response to this diagnosis requires a separate Design Authorization Gate, not implied or pre-approved here.

---

## Independent Challenge (Phase 7 — Role D, against the candidate diagnosis)

*Independent challenge, performed only after Phase 5/6 were complete, testing against every alternative this task's own Guardrails section names.*

1. **Entity resolution** — is the "Survives" verdict for Candidate A actually supported, or merely assumed? Genuinely supported: Search Console's property-scoping is a structural fact of the tool, not an inference, and both supplementary search checks independently found no competing entity. Not merely assumed.
2. **Autocorrection** — does this diagnosis improperly claim Google's autocorrection proves signal consolidation? No — Candidate F is explicitly left as Needs More Evidence, and the Diagnosed Mechanism section explicitly declines to name any specific mechanism (spell-correction, fuzzy matching, or otherwise).
3. **Third-party-source effects** — does this diagnosis overlook the real, continuing third-party naming inconsistency? No — Contributing Conditions and Candidate E explicitly preserve this as real and ongoing; this diagnosis does not claim the inconsistency has been resolved, only that it does not correspond to a measured visibility penalty on Google's own organic results.
4. **Location/device/time variation** — does this diagnosis overreach into claims about Utrecht-specific or device-specific ranking? No — the Scope and Limitations sections explicitly restrict the supplementary search checks to non-geo-controlled, non-authoritative status, and Candidate G is left as Needs More Evidence rather than assumed away.
5. **Branded versus non-branded query differences** — is a branded-query finding being misapplied to non-branded category performance? No — Candidate C is explicitly marked outside this investigation's authorized scope, and Candidate D explicitly inherits UR-001's own prior exclusion rather than asserting a new connection.
6. **Insufficient query-level Search Console evidence** — is this diagnosis built on too thin a sample? No — both directly-named query pairs and the full 154-query family aggregate all point the same direction (misspelled position equal-to-better; volume lower); this is a converging pattern, not a single data point.
7. **Is a proposed fix hidden inside the diagnosis?** No — the Design Boundary section and "What This Diagnosis Does Not Establish" both explicitly exclude any listing, website, schema, or metadata recommendation.
8. **Would the diagnosis survive if no intervention were permitted?** Yes — the diagnosis is purely explanatory/structural; nothing in its content depends on, requires, or implies that any correction will or should occur.
9. **Does coexistence of two spellings get treated as proof of no harm, overreaching the guardrail "coexistence of two spellings does not establish visibility harm"?** Checked directly — this diagnosis inverts that guardrail correctly: it does not claim coexistence *proves* no harm; it reports that the *specific, measured* position/CTR comparison shows no harm, while explicitly leaving volume, mechanism, non-branded effects, and third-party-platform state as separate, unresolved questions.

**Outcome: Survives.** No narrowing required beyond what Phase 5 (Candidate H) already applied — the diagnosis's own scope discipline (position/CTR only, not volume, not mechanism, not non-branded performance) was independently re-verified as correctly maintained, not merely asserted.
