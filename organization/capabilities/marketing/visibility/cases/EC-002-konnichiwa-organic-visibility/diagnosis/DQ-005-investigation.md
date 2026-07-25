# DQ-005 Investigation — OC-005/AI-Representation-Error Correspondence
---

**Status: Completed — Evidence Insufficient.** Authoritative, closed outcome — decisions/DD-019, Case-Owner Decision (Kelvin Wong, ACCEPTED, 25 July 2026). No Candidate Organizational Diagnosis was created; no OD identifier was created or consumed. `dq_005_diagnosis_established: false` (unchanged — there was never an OD to establish); `dq_005_acceptance_decision: Accepted`. All rejected, untested, and evidence-insufficient per-system results below (Phase 4–6) are preserved unmodified as the authoritative record. Absence of evidence is not evidence that OC-005 has no AI effect — this closes the investigation as conducted, not the underlying question in the abstract. Reopening this question requires materially new evidence and a new explicit case-owner decision. See Phase 6.

*Executed under decisions/DD-016's Case-Owner Decision (Kelvin Wong, 25 July 2026), which Authorized DQ-005 With Conditions: this diagnosis must first confirm that the AI-representation errors it examines are independently observed (evidence/HV-IV-004.md, evidence/HV-TS-001.md) — it may not presuppose that OC-005's gaps caused them; do not presume OC-005's gaps caused those errors — the fact-by-fact correspondence test defined in DD-016 Phase 5 must actually be run, not assumed; if the target error condition cannot be established from existing evidence, stop with Evidence Insufficient rather than proceed on inference; scope remains limited to the single AI scenario CR-003 already flags (Open, mitigated) — no generalization to "AI understanding" broadly. Four roles kept explicitly separate: Role A (Evidence Investigator), Role B (Competing Explanation Constructor), Role C (Falsification Challenger), Role D (Diagnosis Gate Reviewer, see decisions/DD-019). No role used a later role's conclusion as evidence for an earlier role.*

## Authorized Question

DQ-005 — Does OC-005's machine-accessibility gaps relate to observed AI-representation errors, scoped to CR-003's single tested scenario?

## Authorized Target Condition (decisions/DD-016, Phase 5)

Whether OC-005's three confirmed machine-accessibility gaps (no structured data; both menus non-crawlable; one duplicate page) correspond, specifically and checkably, to the AI-representation errors already observed in evidence/HV-IV-004.md, within the single tested scenario (CR-003's scope).

---

## Phase 1 — Independent Confirmation That the Errors Are Real (Role A)

Per this task's binding instruction not to presuppose OC-005's relevance, and to register expected (ground-truth) facts before evaluating the AI answers, this phase first establishes what is actually true, independent of and prior to any AI-system output, then separately confirms each AI-observed discrepancy is a real, independently-recorded error — not before OC-005 is mentioned again.

### Ground truth (registered first, from evidence/HV-IV-002.md, Kelvin/EV-001/EV-010, confirmed 22 July 2026 — not derived from or informed by any AI test)

| Fact | Authoritative value | Source |
|---|---|---|
| Sushi-kitchen hours | Mon–Thu 16:00–21:30, Fri–Sun 12:00–21:30 | EV-001 |
| Bar/venue after kitchen close | Stays open; exact closing time **not yet established even by the owner** | EV-010 |
| Teppanyaki schedule | Starts daily 17:00; exact closing time **not yet established even by the owner** | EV-010 |
| Closure period | Sushi closed Mon 3–Tue 11 Aug; Teppanyaki closed Sat 1–Thu 12 Aug; reopens 13 Aug | EV-001 |
| Chef roles | Kelvin Wong = head chef; Rocky = sushi chef | EV-010 |
| Omakase | Confirmed offering; no dedicated page; no price/course count/booking path in machine-readable text | O-007/HV-IV-007 |

### Independently-observed AI outputs (evidence/HV-IV-004.md, evidence/HV-TS-001.md — HV-TS-AI-01 through 05, 22 July 2026, one run per system, not this investigation's own test)

| System | Prompt (HV-TS-001) | Answer given | Source cited (HV-TS-001) | Compared to ground truth |
|---|---|---|---|---|
| DeepSeek | Openingstijden/omakase Konnichiwa | 12:00–16:45 / vanaf 17:00 | **External reservation site** (not konnichiwa.nl) | Does not match; structurally unrelated pattern to the sushi-kitchen hours |
| ChatGPT | Openingstijden/omakase Konnichiwa | Cites official site correctly, plus shows 2 conflicting sources alongside | **Official site + 2 divergent sources** | The official-site citation matches ground truth; overall answer scored "Deels" (partial) because of the 2 conflicting sources shown alongside, not because the site reading was wrong |
| Gemini | Openingstijden/omakase Konnichiwa | Mon–Thu 16:00–22:00, Fri–Sun 12:00–22:00 | Official site/blog (**implicit**, not confirmed) | 30 minutes later than ground truth on both closing times |
| Perplexity | Openingstijden/omakase Konnichiwa | Sushi Mon–Thu 16:00–21:30/Fri–Sun 12:00–22:00; Teppanyaki daily 17:00–22:00 | **Not explicit** | Weekday sushi hours match; weekend sushi closing is 30 min later than ground truth; Teppanyaki closing time (22:00) **cannot be checked against ground truth at all — the owner himself has not yet established that closing time** |
| Claude (EV-005, cold, no search tool) | "Wat is een goed teppanyaki/sushi restaurant in Utrecht?" | Weak/uncertain parametric recall of Konnichiwa specifically | None (parametric) | Not a factual hours/menu error — a general-knowledge-strength observation, explicitly Low reliability "as a direct statement about other systems" (HV-IV-004's own classification). **Excluded from the fact-by-fact test below, per this task's instruction not to generalize one Claude test to all AI systems, and per HV-IV-004's own reliability note.** |

**Additional independently-observed items, confirmed real (not AI hallucination artifacts, but genuine, separately verified conditions):**

- **Closure notice missing year** — ChatGPT correctly flagged that the site's holiday-closure text lacked a year. Kelvin confirmed this was a real gap (approved a corrected text, not yet published). This is the AI **correctly identifying an omission**, not the AI making an error.
- **Omakase completeness** — 3 of 4 systems confirmed Konnichiwa's omakase offering when asked directly, but none could supply price, course count, or a booking path — matching O-007/HV-IV-007's own finding that omakase exists only as a homepage section, not a dedicated page.
- **Chef-name discrepancy (Gemini: Kelvin Wong; Perplexity: Rocky)** — **independently confirmed not to be an error.** Both are correct: Kelvin Wong is head chef, Rocky is sushi chef — two different, non-conflicting roles (EV-010). **Excluded from the AI-error register below**, since this task's own instruction requires verifying every possible erroneous answer against authoritative evidence before treating it as an error, and this one does not survive that check.

**Verdict: the target errors are real and independently observed**, not presupposed. Three genuine discrepancy classes exist: (1) opening-hours variance across systems, (2) closure-notice year omission (a correctly-flagged gap, not an AI error), (3) omakase informational incompleteness. Proceeding to test each against OC-005's three specific conditions — not against "technical gaps" generally.

---

## Phase 2 — OC-005's Three Conditions, Re-confirmed (Role A)

Re-read directly against claims/OC-005…md and its source evidence, not assumed:

1. **No structured data (schema.org) anywhere on the site** (EV-001/HV-IV-001) — confirmed by direct inspection, last verified 22 July 2026.
2. **Both restaurant menus (Teppan Yaki; Sushi & Izakaya) hosted exclusively as non-crawlable Adobe InDesign viewer embeds** (EV-013/HV-IV-007) — confirmed by direct sitemap/page inspection.
3. **`/sushi-page-2/` is a near-duplicate of the homepage with a broken, unresolved title-template variable** (EV-013/HV-IV-007) — confirmed by direct inspection.

**Direct, load-bearing finding from HV-IV-001 itself:** "Website zelf is inhoudelijk compleet. Adres, telefoonnummer, **openingstijden**, teppanyaki, sushi, izakaya, omakase... dat staat er allemaal duidelijk op." — the opening-hours text is present as ordinary, readable page content, **separate from the InDesign menu embeds** (condition 2) and **separate from `/sushi-page-2/`** (condition 3). The only one of OC-005's three conditions that could plausibly touch the opening-hours text at all is **condition 1** (absence of `schema.org` structured markup for `openingHours`), since HV-IV-001 explicitly names this exact mechanism: "Google en AI-systemen de informatie op je site (adres, **openingstijden**, menu, type keuken) niet automatisch en betrouwbaar kunnen uitlezen — ze moeten het 'gokken' op basis van gewone tekst" (Google and AI systems cannot reliably, automatically read the site's information — including opening hours — without this markup; they must "guess" from plain text). This is treated as a **plausible mechanism worth testing**, not as proof — it is HV-IV-001's own general advisory observation, not a fact-by-fact test of these five specific AI answers.

---

## Phase 3 — Competing Explanations (Role B)

Constructed per decisions/DD-016 Phase 5's own three-way framing, without presupposing a favorite:

| Explanation | Prediction |
|---|---|
| **Direct correspondence** | The AI systems that got hours wrong did so because they could not reliably parse Konnichiwa's plain-text hours in the absence of `schema.org` markup (condition 1) |
| **No correspondence** | The AI errors concern information unaffected by any of OC-005's three conditions — e.g., wrong source entirely, model inference/blending behavior, or genuinely unconfirmed ground truth |
| **Partial correspondence** | Some AI errors trace to condition 1; others trace to unrelated causes |

---

## Phase 4 — Fact-by-Fact Falsification (Role C)

Required test per decisions/DD-016: for each documented error, state which of OC-005's three conditions (if any) would have supplied the correct information, and check whether that condition is actually implicated.

| Error | Which OC-005 condition could explain it? | Was that condition actually implicated? | Classification (a/b/c) | Result |
|---|---|---|---|---|
| DeepSeek's hours (12:00–16:45/vanaf 17:00) | Condition 1 (no structured data) — only if DeepSeek attempted to read konnichiwa.nl's plain text | **No** — DeepSeek's cited source was an **external reservation site**, not konnichiwa.nl. OC-005 describes conditions of Konnichiwa's own site; a source that never engages that site cannot be affected by its accessibility conditions. | (c) — absent/wrong for a reason unrelated to OC-005 | **Falsified for this system** |
| ChatGPT's "Deels" classification | Condition 1 — only if ChatGPT could not read the plain-text hours | **No** — ChatGPT is explicitly recorded as citing the official site **correctly**. Its "Deels" (partial) classification stems from presenting 2 additional, conflicting third-party sources alongside the correct one, not from failing to read Konnichiwa's own page. This is direct, positive evidence that the hours text **was** successfully read via ordinary text, without structured data. | (b) — present and readable, correctly read; the partial score stems from external-source conflict, not from OC-005 | **Falsified — the successful read itself falsifies condition 1 as this system's error mechanism** |
| Gemini's hours (30 min later on both days) | Condition 1 — plausible if Gemini also failed to reliably parse plain text | **Cannot be established** — HV-TS-001 records Gemini's source only as "Officiële site/blog (**impliciet**)" — implicit, not confirmed. Whether Gemini actually attempted to read konnichiwa.nl's plain-text hours, and whether that specific reading step is where the 30-minute drift occurred (versus, e.g., a cached/blog secondary source, or model rounding behavior), cannot be determined from existing evidence. | Cannot be classified (a), (b), or (c) with confidence | **Evidence Insufficient for this system specifically** |
| Perplexity's hours (weekday match, weekend 30 min later; Teppanyaki close time unverifiable) | Condition 1 — plausible for the weekend-hours drift | **Cannot be established** — HV-TS-001 records Perplexity's source as "**Niet expliciet**" (not explicit). Additionally, Perplexity's Teppanyaki closing-time claim (22:00) **cannot be checked against ground truth at all**, since Kelvin himself has not yet established the real Teppanyaki closing time (EV-010) — this specific sub-claim is neither confirmed correct nor confirmed wrong, and must not be treated as an error by default. | Cannot be classified with confidence; one sub-claim is not even checkable | **Evidence Insufficient for this system specifically; one sub-claim not classifiable as an error at all** |
| Closure-notice missing year | None of the three — this is a content-completeness gap (a year is literally absent from the text), not a structured-data, menu-crawlability, or page-duplication condition | Not applicable — no OC-005 condition predicts or explains a missing year in prose text | (c) — unrelated to OC-005; this is also **not an AI error** (the AI correctly flagged a real gap) | **Not applicable to correspondence testing** |
| Omakase price/course/booking incompleteness | Condition 2 (non-crawlable menus) was the closest candidate — but O-007/HV-IV-007 establishes omakase pricing/course information is **not present in either InDesign menu at all**; it simply does not exist as a documented content asset anywhere on the site (only a homepage section/anchor) | **No** — the information is absent, not present-but-unreadable. Condition 2 describes menu content that exists but cannot be crawled; omakase's specific pricing/course/booking details were never established to be part of that menu content in the first place. | (c) — absent for a reason unrelated to OC-005 (a missing content asset, matching the separately-tracked Intent-Justified Assets gap, HV-001/VD-005 — not OC-005) | **Falsified as a condition-2 correspondence** |
| Chef-name discrepancy | N/A | N/A — confirmed in Phase 1 not to be an error at all | Not applicable | **Excluded — not an error** |

**Conditions 2 and 3 — untested by absence of a relevant error:** no AI-observed error in evidence/HV-IV-004.md concerns menu pricing/content specifically (which condition 2's InDesign-embed issue would predict) or page-identity/duplication confusion (which condition 3 would predict). Per this task's own rule ("Verifieer ieder mogelijk foutief antwoord tegen autoritatief bewijs" and DD-016's stop condition), this investigation does not manufacture a hypothetical error to test against these two conditions — they remain **untested**, neither confirmed nor excluded as mechanisms, for lack of any observed corresponding error.

---

## Phase 5 — Explanation Outcomes (Role C)

| Explanation | Outcome |
|---|---|
| **Direct correspondence** (condition 1 → hours errors) | **Rejected** for the two systems where it could be tested (DeepSeek: wrong source entirely; ChatGPT: successfully read the correct plain-text hours, falsifying the "unreadable" mechanism). **Evidence Insufficient** for the two systems where source attribution is too unconfirmed to test (Gemini, Perplexity). |
| **No correspondence** | **Best-supported explanation for the systems that could be tested** (DeepSeek, ChatGPT) — their specific error mechanisms (wrong source; multi-source blending) are unrelated to any of OC-005's three conditions. Not confirmed for Gemini/Perplexity, where the evidence is simply insufficient either way. |
| **Partial correspondence** | Not supported — no single system shows a clean, confirmed "present but unreadable due to OC-005" pattern; the closest candidate (ChatGPT) is directly falsified. |

No candidate was promoted merely because alternatives lacked evidence, and no negative finding was inflated into a stronger claim than the evidence supports: two systems are affirmatively falsified against condition 1 (not "unlikely" — falsified by direct evidence of successful reading or unrelated sourcing), two systems remain genuinely untestable with current evidence, and conditions 2/3 have no observed error to test at all.

---

## Phase 6 — Diagnosis Outcome

**Diagnosis Outcome: Evidence Insufficient.**

No mechanism connecting OC-005's three specific conditions to any of HV-IV-004.md's documented AI-representation errors survives fact-by-fact testing with a positive, distinguishing result. Specifically:

- **Condition 1 (no structured data)** as an explanation for the opening-hours errors is **falsified** for the two systems where it was testable (DeepSeek, ChatGPT), and **untestable** for the remaining two (Gemini, Perplexity) due to unconfirmed source attribution in the existing evidence record.
- **Conditions 2 and 3** have no corresponding AI-observed error in evidence/HV-IV-004.md to test against at all.
- The two other AI-observed discrepancies (missing closure-notice year; omakase price/course/booking incompleteness) both trace to content-completeness gaps unrelated to OC-005's three specific conditions, not to machine-accessibility failures of existing content.
- The one apparent "contradiction" (chef names) is independently confirmed not to be an error.

Per this task's explicit permission ("Een correcte uitkomst mag ook zijn dat een AI-fout bestaat maar de relatie met OC-005 niet kan worden vastgesteld"), this is recorded as the correct, honest outcome: **real AI-representation errors and gaps exist (confirmed in Phase 1), but no distinguishing, positively-supported relationship to OC-005's three specific conditions can be established with existing evidence.** No candidate Organizational Diagnosis (OD) is created. No new OD-### identifier is consumed by this investigation.

This does not reopen or contradict claims/OC-005…md (which already excludes causal language toward AI errors) or decisions/DD-005's hypothesis H-003 (a distinct, Transformation-stage hypothesis, not this question). CR-003's scope limitation (single tested scenario, Open/mitigated) is preserved — no finding here is generalized beyond the one opening-hours/omakase scenario tested in HV-TS-001.
