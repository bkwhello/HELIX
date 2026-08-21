# 2026-W34 Visibility Brief — Konnichiwa (EC-002)
---

Realizes WO-008 (work-objects/WO-active-register.md — first issue produced). Format: decisions/DD-003-weekly-operating-loop.md. Review date: 21 August 2026 (Friday, within ISO week 34). **First weekly brief ever produced for this case** — the Monday 10:00 cadence defined at case establishment (23 July 2026) had not previously produced an issue; nearly all cycles since then were spent on the OD-002 Transformation-preparation track (decisions/DD-016–DD-036) instead.

---

## 1. Executive status

Reputation shows a small positive signal, but HELIX still cannot reliably determine visibility-to-reservation performance because the first-party measurement chain remains incomplete. No HELIX Visibility Score is calculated or displayed this week — the Measurement Plan's requirements for one are not satisfied (measurement/HV-MP-001.md §4). No missing metric is interpreted as zero.

## 2. Target-condition scorecard (measurement/TC-register.md)

| TC | Condition | This week |
|---|---|---|
| TC-004 | GBP complete and consistent with the website | Partial — measurement/HV-SCR-001-source-consistency-register.md (new) begins tracking this; several fields Not separately re-verified |
| TC-005 | ≥10 genuine new Google reviews | Not evaluable from this week's evidence alone — only a +1 delta is registered (see §4), not a count against a fixed baseline period |
| TC-009 | ≥20% growth in Google Profile actions | Not evaluable — GBP engagement metrics (OC-002) are a separate metric family from the review-count observation this week |
| TC-011 | Diagnosed, prioritized Month-2 action plan | Partial — this brief's §6 priorities are a first step, not a full Month-2 plan |
| All others (TC-001–003, 006–008, 010) | — | Unchanged this week; not re-evaluated |

## 3. Meaningful changes

- Google Business Profile: 4.1★, 626 reviews. Registered as **+1 relative to the prior 625-review Owner Declaration/local-panel observation** (observations/O-003.md addendum, 24 July 2026) — the same measurement method, not the 605-review general-search-results figure (evidence/HV-IV-001.md). Challenge Evidence/CR-register.md CR-006 (605 vs. 625) **stays open**; this +1 does not resolve it. Rating change: none.
- TheFork: 9.1/10 rating, usable observation. Review count is **source-conflicted** across TheFork surfaces — new Challenge Evidence/CR-register.md CR-007 registers this as a measurement-method problem, not as evidence any specific count is wrong.
- transformation/HV-IR-001.md, HV-INT-002: the day-7 validation (29 July 2026) is confirmed, this week, to have never been executed — registered as **Overdue**, not silently skipped and not backdated.

## 4. Evidence

Google review/rating figure: Owner Declaration, 21 August 2026 (this week's input). TheFork figures: as supplied this week; individual surface/date pairs not yet captured (see CR-007). HV-INT-002 gap: confirmed by direct inspection of observations/ (no file dated after 24 July 2026) and evidence/raw/search-console-2026-07-23/ (single export, predates or coincides with HV-INT-002's 22 July go-live) — no post-launch repeat measurement exists anywhere in the repository.

## 5. Diagnosis

No new Organizational Diagnosis is created this week. Three existing, established findings are explicitly preserved and not reopened:

- diagnosis/OD-003 (decisions/DD-021/DD-022): entity-naming variants showed no measured Google-organic ranking/CTR penalty within tested query pairs; no Design or intervention was authorized. measurement/HV-SCR-001-source-consistency-register.md (new) records naming variation neutrally, per this constraint.
- diagnosis/DQ-005 (decisions/DD-019): Evidence Insufficient for AI opening-hours-error correspondence to OC-005's machine-accessibility gaps; not reopened. design/HV-CHM-001-canonical-hours-model.md (new) instead addresses a narrower, separate gap DQ-005 itself surfaced: several hour types (Teppanyaki close, bar/venue close after kitchen) are **not yet established even by the owner**, independent of any AI or markup question.
- claims/OC-002 (GBP engagement decline): unaffected by this week's review-count observation — a scope note was added to claims/OC-002-competing-explanations-register.md to prevent the two metric families being conflated.

## 6. Maximum three priority actions

Per decisions/DD-003 (binding: maximum **three**, not five — the "maximum 5" figure elsewhere in the case, HV-MP-001 §21, governs a different thing, the first general implementation cycle, and does not override this weekly-brief rule).

1. **Recover the overdue HV-INT-002 validation.** transformation/HV-IR-001.md updated this week — Overdue, not yet reclassified.
2. **Establish the Canonical Hours Model and Source Consistency Register.** Both created this week (design/HV-CHM-001-canonical-hours-model.md; measurement/HV-SCR-001-source-consistency-register.md) as repository-only design/tracking artifacts — populating remaining unknown fields is next.
3. **Close the first-party measurement chain.** Of the six core events (reservation_click, reservation_widget_open, phone_click, directions_click, private_dining_enquiry, catering_enquiry): the first three are Built but not Production Verified (no per-event test click yet, transformation/HV-IR-001.md HV-INT-003); the latter three are confirmed not built at all (no Maps link, no Private Dining CTA, no catering-form handler — observations/O-011.md). Built ≠ Production Verified is preserved throughout.

## 7. Owner and due date

All three: Kelvin (data/decisions), Claude (repository work) — mirrors existing HV-IR-001 ownership pattern. Due: next weekly cycle, 2026-08-28 (Monday, per DD-003's Monday 10:00 cadence), except where an item is itself blocked on external access (e.g. a per-event test click, a fresh Search Console export) that only Kelvin can perform.

## 8. Approval requirements

None of this week's three priorities requires production, website, GBP, TheFork, or external-listing changes — all are repository-only evidence/design work. Any future step that would touch a production system, external listing, or send a correction request requires a separate Case Owner decision and stays `Awaiting Approval` until then (per this task's Absolute Approval Boundary).

## 9. Expected measurable effect

Priority 1: a completed or explicitly-still-blocked day-7/28-equivalent validation for HV-INT-002, with CR-004 confounders addressed first. Priority 2: populated CanonicalHours fields (pending Kelvin's Teppanyaki-close/bar-close input) and a Source Consistency Register with fewer "Not separately re-verified" cells. Priority 3: at minimum, a per-event test click confirming whether reservation_click/reservation_widget_open/phone_click actually fire in GA4 — moving them from Built toward Production Verified or identifying why they don't.

## 10. Unresolved uncertainty

CR-006 (605 vs. 625 Google reviews) and the new CR-007 (TheFork review-count method conflict) both remain open — neither is expected to resolve from this week's work alone. HV-INT-002's confounding factors (CR-004: Amsterdam omakase competition, seasonal Utrecht events, unrelated review activity) have not yet been re-checked against the current date. Measurement Readiness stays at the last-verified 51%, marked **Awaiting remeasurement** — no formula exists to compute a new figure from this week's evidence, and none is invented.

---

## Traceability

Observation → Evidence → Metric/Goal → Defect/Opportunity → Diagnosis → Weekly Priority → Intervention/Experiment → Validation, per this task's own required chain. No new experiment (HV-EXP) is created this week — a Teppanyaki-specific proposal was explicitly deferred pending HV-INT-002's own overdue validation and diagnosis/OD-001's already-selected Candidate D re-measurement window (not open until 21 September 2026).
