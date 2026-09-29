# HV-CHM-001 — Canonical Hours Model (Konnichiwa)
---

Classification: Design (internal, repository-only proposal — **not a live change, not published externally**). Created 21 August 2026, weekly review W34 (measurement/2026-W34-visibility-brief.md).

**Update, 29 September 2026:** the Owner Declaration requested under "Next step" has been supplied in two parts on 29 September 2026: the public hours and closing semantics, then a supplement covering lunch, takeaway, delivery and the effective date. Both are recorded below. **The owner-input blocker is RESOLVED, and the canonical-hours model is internally complete as of 29 September 2026.** Channel alignment remains **PENDING**. Nothing is published externally. The original sections are preserved unchanged as the historical record.

## Why this exists

Public sources expose different opening-hour representations for Konnichiwa. This does not necessarily mean any one source is factually wrong — the underlying condition is that Konnichiwa has **multiple distinct hour types** (restaurant, kitchen, lunch, dinner, takeaway, delivery), and no single internal representation currently distinguishes them. diagnosis/DQ-005-investigation.md (Evidence Insufficient, Accepted, decisions/DD-019) already found that the *absence of schema.org markup* does not explain the specific AI opening-hours errors tested — that finding is **not reopened here**. This model addresses a different, narrower gap: DQ-005's own ground truth table (Phase 1) recorded that the bar/venue closing time after kitchen close, and the Teppanyaki closing time, were **"not yet established even by the owner"** — i.e. some hour types are not yet canonically defined internally at all, independent of any AI or markup question. This proposal is a data-structure precursor to closing that specific gap, and to HV-INT-001 (structured data + corrected opening hours, currently Blocked, transformation/HV-IR-001.md), not a new diagnosis and not an implementation.

## Proposed internal representation only — do not publish externally

```text
CanonicalHours

restaurant_open
restaurant_close

kitchen_open
kitchen_close

lunch_open
lunch_close

dinner_open
dinner_close

takeaway_open
takeaway_close

delivery_open
delivery_close

day_of_week

effective_from
effective_until

source_of_truth
approved_by
approved_at
```

## Known values (from existing evidence — not newly measured)

| Field | Known value | Source | Status |
|---|---|---|---|
| Sushi-kitchen hours | Mon–Thu 16:00–21:30, Fri–Sun 12:00–21:30 | EV-001 (DQ-005 Phase 1) | Confirmed |
| Restaurant/venue close (base) | 22:00, all days | evidence/HV-IV-004.md, Kelvin | Confirmed (design/structured-data-website.md already uses this) |
| Teppanyaki start | Daily 17:00 | EV-010 (DQ-005 Phase 1) | Confirmed |
| Teppanyaki close | **Not yet established even by the owner** | EV-010 (DQ-005 Phase 1) | **Unknown — genuine gap, not inferred** |
| Bar/venue hours after kitchen close | Stays open; exact closing time **not yet established even by the owner** | EV-010 (DQ-005 Phase 1) | **Unknown — genuine gap, not inferred** |
| Lunch/takeaway/delivery hours | Not separately established in any evidence reviewed for this model | — | **Unknown — not assessed, not assumed absent** |
| Special/holiday hours | design/structured-data-website.md's `specialOpeningHoursSpecification` block dates (2026-08-01 through 08-12) are now in the past relative to 21 August 2026 | design/structured-data-website.md | **Stale — flagged, not corrected here** (structured-data-website.md itself is out of this week's approved edit scope) |

## What this model does not do

It does not select a source of truth, does not resolve any of the "Unknown" fields above, does not modify design/structured-data-website.md or any published site content, and does not reopen diagnosis/DQ-005. `source_of_truth`, `approved_by`, and `approved_at` are structural fields for a future data model — no value is populated for them here.

## Next step

Kelvin to supply the missing values (Teppanyaki close, bar/venue close after kitchen, lunch/takeaway/delivery hours if applicable) as an Owner Declaration, dated. Only after that is complete should this model be populated and cross-checked against HV-INT-001's JSON-LD proposal — a separate, not-yet-authorized step.

---

## Owner Declaration — 29 September 2026

*Declared by Kelvin Wong, Case Owner and owner of Konnichiwa, 29 September 2026 ("EC-002 — HV-CHM-001 Canonical Hours Owner Declaration"). Recorded verbatim in substance. Classification: **OWNER DECLARED**.*

**Official public restaurant opening hours:**

| Day | Opening hours |
|---|---|
| Monday | 16:00–22:00 |
| Tuesday | 16:00–22:00 |
| Wednesday | 16:00–22:00 |
| Thursday | 16:00–22:00 |
| Friday | 12:00–22:00 |
| Saturday | 12:00–22:00 |
| Sunday | 12:00–22:00 |

**Teppanyaki:**

- last reservation **21:00**;
- public restaurant closing time **22:00**;
- operational reality: a Teppanyaki sitting already in progress may continue beyond 22:00 until the dining experience or table is finished.

**Sushi / Izakaya:**

- last reservation **21:00**;
- last order **21:30**;
- public restaurant closing time **22:00**.

**Semantic rules declared with it:**

1. Public closing time, last reservation and last order are **separate concepts**. The last-order or last-reservation time is never substituted for the public closing time.
2. The Teppanyaki overrun ("until the table is finished") is **operational only**. It is not an open-ended public opening hour. `22:00+`, "until finished" or any other variable closing time is **never** used as structured opening-hours data. The canonical public closing time is **22:00**.
3. The declaration does **not** authorize any external change or publication (website, Google Business Profile, schema/JSON-LD, reservation systems, directories).

---

## Owner Declaration (supplement) — 29 September 2026

*Declared by Kelvin Wong, Case Owner, 29 September 2026, in a second instruction the same day. Classification: **OWNER DECLARED**. The instruction restates the public hours, Teppanyaki and Sushi/Izakaya declarations above unchanged and adds:*

| Concept | Days | Hours |
|---|---|---|
| Lunch | Friday–Sunday | 12:00–17:00 |
| Takeaway | Monday–Thursday | 17:00–21:30 |
| Takeaway | Friday–Sunday | 13:00–21:30 |
| Delivery | Monday–Thursday | 16:00–21:30 |
| Delivery | Friday–Sunday | 13:00–21:30 |
| Effective date | — | 29 September 2026 |

These are to be treated as OWNER DECLARED canonical operating hours. **Public opening hours, lunch hours, takeaway hours, delivery hours, last reservation, last order and the operational finishing time are separate concepts. No additional hours are inferred.** In particular:

- no lunch hours are declared for Monday–Thursday;
- no separate dinner service hours are declared;
- no end date is declared.

**Consistency check against the repository (29 September 2026):** no contradiction found.

- Lunch Friday–Sunday starts at the declared public opening time (12:00).
- Takeaway and delivery end at 21:30, the same time as the declared Sushi/Izakaya last order. The concepts stay separate.
- Every declared service window lies within public opening hours.
- EV-010 ("zaak/bar blijft open na keukensluiting") and TheFork's recorded "last guest arrival 21:00" (HV-SCR-001) are consistent with the declaration.

---

## Populated canonical model (internal representation only — do not publish externally)

The original field list above has no place for last reservation or last order. The declaration requires them to be kept distinct, so the model is **extended** with two fields per service: `last_reservation` and `last_order`. The original fields are unchanged.

| Field | Value | Classification | Source |
|---|---|---|---|
| `day_of_week` / `restaurant_open` / `restaurant_close` | Mon–Thu 16:00–22:00; Fri–Sun 12:00–22:00 | OWNER DECLARED | Owner Declaration, 29 Sep 2026 |
| Teppanyaki start (`dinner_open`, teppanyaki) | Daily 17:00 | HISTORICAL owner evidence (not restated in the 29 Sep declaration, not contradicted by it) | EV-010 |
| Teppanyaki `last_reservation` | 21:00, all days | OWNER DECLARED | Owner Declaration, 29 Sep 2026 |
| Teppanyaki public close | 22:00 (the operational overrun is not a public hour) | OWNER DECLARED | Owner Declaration, 29 Sep 2026 |
| Sushi/Izakaya `last_reservation` | 21:00, all days | OWNER DECLARED | Owner Declaration, 29 Sep 2026 |
| Sushi/Izakaya `last_order` | 21:30, all days | OWNER DECLARED | Owner Declaration, 29 Sep 2026 |
| Sushi/Izakaya public close | 22:00 | OWNER DECLARED | Owner Declaration, 29 Sep 2026 |
| Sushi `kitchen_open` / `kitchen_close` | Mon–Thu 16:00–21:30, Fri–Sun 12:00–21:30 | HISTORICAL (EV-001, "sushi-keukentijden"). The 21:30 value coincides with the declared last order; the two concepts are kept separate and no equivalence is asserted. | EV-001 |
| Bar/venue after kitchen close | No public hours beyond 22:00 are declared; the public close is 22:00 | OWNER DECLARED (public close). EV-010's "blijft open na keukensluiting" is consistent with open-after-last-order until 22:00. | Owner Declaration; EV-010 |
| `lunch_open` / `lunch_close` | Fri–Sun 12:00–17:00. None declared Mon–Thu. | OWNER DECLARED | Owner Declaration (supplement), 29 Sep 2026 |
| `takeaway_open` / `takeaway_close` | Mon–Thu 17:00–21:30; Fri–Sun 13:00–21:30 | OWNER DECLARED | Owner Declaration (supplement), 29 Sep 2026 |
| `delivery_open` / `delivery_close` | Mon–Thu 16:00–21:30; Fri–Sun 13:00–21:30 | OWNER DECLARED | Owner Declaration (supplement), 29 Sep 2026 |
| `effective_from` | 2026-09-29 | OWNER DECLARED | Owner Declaration (supplement), 29 Sep 2026 |
| `effective_until` | Not declared (no end date) | Not inferred | — |
| `dinner_open` / `dinner_close` | Not declared as a separate service. Teppanyaki start 17:00 (EV-010) and public close 22:00 are recorded above; no dinner window is inferred from them. | Not inferred | — |
| `source_of_truth` | Owner Declaration, 29 September 2026 | OWNER DECLARED | — |
| `approved_by` / `approved_at` | Kelvin Wong (Case Owner) / 2026-09-29 | OWNER DECLARED | — |
| Special/holiday hours | Unchanged: the stale 2026-08-01 to 08-12 block in design/structured-data-website.md is still flagged, not corrected | HISTORICAL | design/structured-data-website.md |

**Resolution of the three items requested under "Next step":**

- **Teppanyaki close:** **resolved**. Public close 22:00; last reservation 21:00; overrun operational only.
- **Bar/venue close after kitchen:** **resolved for public hours**. Public close 22:00, with no later public hours declared.
- **Lunch/takeaway/delivery hours, "if applicable":** the first part of the declaration left this open. At that point applicability was unknown, and the website's takeaway and delivery landing pages (sushi-afhalen-utrecht and sushi-bezorgen-in-utrecht; evidence/HV-IV-007.md page register, observations/O-005.md) meant it could not be assumed absent. **Now resolved** by the supplement: lunch Fri–Sun 12:00–17:00; takeaway and delivery as declared; effective from 2026-09-29.

**Canonical-hours model: internally complete as of 29 September 2026.** Every item requested under "Next step" is now OWNER DECLARED. The remaining model fields are, by design, either not declared as separate services and not inferred (`dinner_*`, lunch Mon–Thu, `effective_until`), or carried as historical evidence and not part of the requested owner input (`kitchen_*`, EV-001).

---

## Channel reconciliation snapshot (29 September 2026 — recorded, not corrected)

*Compared against the canonical public hours above. Sources: this repository's evidence, and the theme source in the Konnichiwa website repository at commit `2fe2379` (read-only). No live page was fetched for this snapshot.*

| Surface | Recorded value | Canonical value | Result | Evidence (classification) |
|---|---|---|---|---|
| Website footer, theme fallback (`footer.php`) | Ma–Vr 17:30–22:00; Za–Zo 17:00–22:30 | Mon–Thu 16:00–22:00; Fri–Sun 12:00–22:00 | **Mismatch** (all days) | Theme source (OBSERVED in repository). The live footer is driven by the WordPress `footer-hours` menu when set; the fallback shows only if that menu is absent. **Live footer value: UNKNOWN.** |
| Website Catering NL (`page-catering.php`) | "Ma – do: 17:30 – 22:00" only | as above | **Mismatch** (opening time; Fri–Sun missing) | Theme source (OBSERVED); production copy byte-identical per observations/O-031.md |
| Website Catering EN (`template-catering-eng.php`) | "Mon – Thu: 17:30 – 22:00" only | as above | **Mismatch** | Theme source (OBSERVED); production copy not verified (UNKNOWN) |
| Website Sushi EN (`page-sushi-eng.php`) | "Kitchen opens" Mon–Thu 16:00–21:30, Fri–Sun 12:00–21:30 | Public hours as above; last order 21:30 | **Labelled as kitchen hours.** Consistent with the kitchen/last-order concept, not a public-hours statement. Risk of being read as public close 21:30. | Theme source (OBSERVED); production copy not verified |
| Website Teppanyaki start (omakase and wagyu pages) | "vanaf 17:00" | 17:00 (EV-010) | Match | Theme source (OBSERVED) |
| Website hours text, 22 July 2026 | ma–do 16:00–21:30, vr–zo 12:00–21:30 (sushi kitchen) | Public close 22:00 | Kitchen hours, not public close | evidence/HV-IV-002.md (HISTORICAL) |
| Schema.org / JSON-LD, live | No `openingHoursSpecification` in theme source; HV-SCR-001 records "no schema.org markup yet" | — | **UNKNOWN / absent** | Theme source (OBSERVED); HV-INT-001 Blocked |
| Schema design (`design/structured-data-website.md`) | Mon–Thu 16:00–22:00; Fri–Sun 12:00–22:00; special hours stale | as above | Match (regular hours); special hours stale | Design, not live (HISTORICAL) |
| Google Business Profile | Mon–Thu 16:00–22:00; Fri–Sun 12:00–22:00 | as above | Match | HV-SCR-001, owner verification 22 Sep 2026 (HISTORICAL) |
| TheFork (Diner service) | Mon–Thu 16:00–22:00; Fri–Sun 12:00–22:00; last guest arrival 21:00 | as above; last reservation 21:00 | Match | HV-SCR-001, 22 Sep 2026 (HISTORICAL) |
| Apple Maps | Mon–Thu 16:00–22:00; Fri–Sun 12:00–22:00 | as above | Match | HV-SCR-001, 22 Sep 2026 (HISTORICAL) |
| Bing | Mon–Thu 16:00–22:00; Fri–Sun 12:00–22:00 | as above | Match | HV-SCR-001, 22 Sep 2026 (HISTORICAL) |
| Eet.nu | All days close 23:00; Tue–Thu open 12:00 | as above | **Mismatch**; correction submitted 22 Sep, verification pending | HV-SCR-001 (HISTORICAL) |
| Ontdek Utrecht | Thu 12:00–22:00; Fri/Sat 12:00–23:00; others match | as above | **Mismatch** (Thu, Fri, Sat); correction submitted 22 Sep, verification pending | HV-SCR-001 (HISTORICAL) |
| TripAdvisor, Yelp | Not verifiable | as above | UNKNOWN | HV-SCR-001 |
| Reservation system (Guestplan) | Not recorded in EC-002 evidence | Last reservation 21:00 | UNKNOWN | — |
| Lunch representation (website pages, including bento-lunch; listings) | Not recorded in EC-002 evidence | Lunch Fri–Sun 12:00–17:00 | UNKNOWN | Added by the supplement, 29 Sep 2026 |
| Takeaway and delivery representation (sushi-afhalen and sushi-bezorgen pages, ordering channels) | Not recorded in EC-002 evidence; no ordering channel is identified in this case | Takeaway and delivery hours as declared | UNKNOWN | Added by the supplement, 29 Sep 2026 |

---

## Governance status (29 September 2026)

| Aspect | Status |
|---|---|
| Owner-input gate (W34 Priority 2) | **RESOLVED** (29 September 2026). The public hours and closing semantics came in the first part of the declaration; lunch, takeaway, delivery and the effective date came in the supplement. No repository contradiction was found. The status moves from **BLOCKED (owner-input)** to **RESOLVED — canonical model established**. |
| Canonical-hours model | **Internally complete as of 29 September 2026** (this document). Not published. |
| Channel reconciliation | **PENDING.** Mismatching or ambiguous: the website footer fallback and `footer-hours` menu (live value unknown), the Catering NL/EN contact blocks, and the Sushi EN "kitchen" wording. Structured data is absent live, and the design's special hours are out of date (HV-INT-001). Eet.nu and Ontdek Utrecht corrections are submitted, with verification pending. GBP, TheFork, Apple Maps and Bing matched on regular hours at 22 Sep; lunch, takeaway and delivery representation there has not been checked. TripAdvisor, Yelp and Guestplan are unknown. Lunch, takeaway and delivery representation on the website and ordering channels is unknown. |
| Production changes | **Required for reconciliation. Not authorized.** Each needs its own Case Owner approval (website theme or menu, and HV-INT-001 structured data). |
| External publication | **Not authorized** by this declaration. |

**OPEN governance question — day-90 AI scoring reference (not resolved, not rescored).** Round-0 AI scoring (evidence/HV-TS-001.md, HV-IV-004.md) and diagnosis/DQ-005 treated 21:30 (the sushi-kitchen hours, EV-001) as the reference closing time. For example, Gemini's answer "ma–do 16:00–22:00, vr–zo 12:00–22:00" was scored "30 min te laat". The Case Owner has now declared the canonical **public** closing time as 22:00, and against that the answer matches. Historical scores and findings are **not** rewritten. For the HV-INT-002 day-90 round (measurement/HV-MP-003), which reference applies when scoring day-90 answers (public close, last order or kitchen hours), and whether round 0 is re-read for comparison, **remains open**. It requires a separate Case Owner decision **before** that measurement. HV-MP-003 is not modified here.

**Next steps, each requiring its own Case Owner decision:**

1. ~~Declare takeaway, delivery and lunch applicability and hours, and `effective_from`.~~ **Done**, Owner Declaration (supplement), 29 September 2026.
2. The day-90 AI-scoring reference decision for HV-MP-003 (open question above). This must be settled before 2026-10-20.
3. A read-only live check of the website's rendered hours (footer menu, Catering, Sushi, lunch, takeaway and delivery pages).
4. A bounded website correction proposal.
5. The HV-INT-001 structured-data cross-check against this model, including correction of the stale special hours.

## Traceability

Source diagnosis: diagnosis/DQ-005-investigation.md (decisions/DD-019). Related intervention: transformation/HV-IR-001.md, HV-INT-001. Related design: design/structured-data-website.md. Weekly review: measurement/2026-W34-visibility-brief.md. **Owner Declaration:** Kelvin Wong, 29 September 2026, in two parts (public hours and closing semantics; supplement for lunch, takeaway, delivery and the effective date). **Reconciliation sources:** measurement/HV-SCR-001-source-consistency-register.md; evidence/HV-IV-002.md; observations/O-031.md; Konnichiwa theme source at `2fe2379` (`footer.php`, `page-catering.php`, `template-catering-eng.php`, `page-sushi-eng.php`, `omakase-utrecht.php`, `wagyu-utrecht.php`).
