### OC-007 – Reservation Volume Is Measured but Not Attributable to Visibility Channels

Source Evidence

- EV-016 (Guestplan reporting dashboard, O-011.md)

Source Observations

- O-011

Related Work Objects

- WO-009 (Weekly Marketing Action Plan, candidate), WO-010 (Transformation Measurement Record, candidate)

Related Challenge Evidence

- None yet recorded specific to this claim

Claim Status

Justified Organizational Claim (promoted 24 July 2026, decisions/DD-010)

Classification

**Measurement/Attribution Constraint** (assigned 24 July 2026, per Kelvin's instruction). OC-007 describes a structural limit on what this case can currently evaluate — it is not itself a business-outcome finding. It limits evaluation of visibility-to-reservation performance across every other claim in this case (none of OC-001 through OC-006 can be connected to reservation outcomes while this constraint holds). The unexplained 162-reservation gap between Guestplan's two internal reports (see Boundaries) is **not** to be represented as lost reservations, unconverted demand, or any other negative outcome — no evidence supports characterizing it as anything other than an unreconciled discrepancy between two internal reports.

---

#### Organizational Claim

Over the 90-day window 23 April–23 July 2026, Guestplan recorded 576 total reservations and 1,976 total guests, with teppanyaki service reservations (263) exceeding sushi/izakaya service reservations (151); however, no part of this volume can currently be attributed to a specific discovery channel (organic search, Google Business Profile, or otherwise), because three identified website tracking gaps remain unresolved and no link exists between GA4 and Guestplan.

#### Organizational Relevance

Reservation volume is the Marketing Visibility Capability's ultimate business outcome (per measurement/HV-MP-001.md's chain, ending in "Reservation or Business Outcome"). Establishing that real volume exists and is measurable, while being explicit that it cannot yet be connected to any visibility channel, prevents this case from later overstating what any visibility intervention has or has not achieved.

#### Scope

- Channel: Guestplan, all reservation-intake channels combined (Online, Google, Handmatig/manual) — not broken into exact per-channel counts, only visually distinguishable proportions
- Query/page: Not applicable — a reservation-system measurement, not a search measurement
- Geography: Not applicable
- Device: Not applicable
- Time period: 23 April–23 July 2026 (90 days, matching this case's standard baseline window)

#### Evidential Basis

EV-016 (five Guestplan dashboard screenshots, "Datumbereik 23 Apr – 23 Jul," "Alle zalen") directly shows: 1,976 guests and 576 reservations (via "Gasten/Reserveringen per bron," channel-distinguished by color but without exact per-channel numeric labels); a separate "Service-reserveringen en omzet" view showing 414 total service reservations split 151 (Sushi & Izakaya) / 263 (Teppan yaki); 4.7% recurring guests, 12.3% cancellations, 0% no-shows, average group size 3.4; and a weekday pattern confirming Friday/Saturday as peak (Saturday ~120 service reservations, ~550–600 guests). Separately, measurement/HV-MP-001.md §7 and observations/O-011.md both document three specific, still-open tracking gaps (no "get directions" link to attach a `directions_click` event to; no CTA on the homepage Private Dining card; the catering contact form has no submission handler) and confirm no GA4-to-Guestplan link exists — meaning even once GA4 itself began working (HV-INT-003, 23–24 July 2026), it has no mechanism to connect its own events to a completed Guestplan reservation.

#### Confidence

- Level: High for the volume, service-mix, and behavioral figures (recurring/cancellation/no-show/group-size); N/A for any channel attribution, which is explicitly not measured
- Rationale: The Guestplan figures are direct platform-reported totals for the stated window. The "N/A for attribution" is not a low-confidence estimate — it is a structural absence of any measurement mechanism, correctly represented as N/A rather than as a low number.

#### Limitations

- A 162-reservation discrepancy exists between the "Reserveringen per bron" total (576) and the "Service-reserveringen" total (414) — the most likely explanation (workshop, private dining, lunch, and catering reservations falling outside the two-category service split) is plausible but not confirmed.
- **Resolved, 24 July 2026:** 0% no-shows over 90 days was confirmed accurate by Kelvin (case owner) — no-show tracking in Guestplan is complete and reliable. This is now treated as a verified operational fact, not an open uncertainty; superseded by the Confidence update below.
- No comparable prior-year period exists — this claim cannot state whether 576 reservations/90 days represents growth, decline, or a typical baseline.
- "Omzet" (revenue) shows 0 for both service categories in the dashboard — treated as "not tracked in Guestplan," not as a genuine zero-revenue finding (explicitly not conflated with a real zero, per this task's own prohibition on treating missing data as zero).

#### Alternative Interpretations

- The 162-reservation discrepancy could alternatively reflect a reporting-window mismatch between the two Guestplan views (e.g., one counts by booking date, the other by check-in date) rather than uncounted service categories — not distinguished in the available screenshots. **Still open** — Kelvin's 24 July confirmation addressed no-show tracking specifically, not this discrepancy.
- ~~The 0% no-shows figure could reflect genuinely strong operational reconciliation practice... rather than incomplete tracking — both remain open, unadjudicated possibilities.~~ **Settled, 24 July 2026:** confirmed by Kelvin as genuine, accurate registration — the "incomplete tracking" alternative is rejected; the "strong reconciliation practice" reading stands.

#### Causal Status

Descriptive. This claim explicitly does not assert that the 162-reservation gap represents "lost" reservations (forbidden by this task's instructions) — it is reported strictly as an unreconciled discrepancy between two internal reports, with a plausible but unconfirmed explanation.

#### Falsification Tests

1. **Is this a single measurement misrepresented as a trend?** No — a 90-day aggregate, not a single-session read; the claim does not assert anything about trend direction (explicitly flagged as unknown under Limitations, since no prior-year comparison exists).
2. **Is the claim broader than its measurement scope?** Narrowing applied: an earlier draft characterized the 162-reservation gap as "162 reservations not captured by visibility measurement," which risks being read as "162 lost reservations" — reworded to "an unreconciled discrepancy between two internal reports," matching this task's explicit prohibition.
3. **Could seasonality explain the condition?** Not applicable to the volume/mix figures as stated (no trend claim is made); would be directly relevant to any future year-over-year comparison, which this claim explicitly does not attempt.
4. **Could branded demand distort the interpretation?** Not directly applicable — Guestplan reservation volume is not query-level branded/non-branded data.
5. **Could device, location, or personalization affect the result?** Not applicable — Guestplan is an internal operational system, not a search result.
6. **Is unavailable data being interpreted as poor performance?** This is the central risk this claim is built to avoid, and it is directly addressed: the "omzet: 0" figures are explicitly labeled as not-tracked rather than zero revenue, and the complete absence of channel attribution is stated as a structural N/A, not implied to mean "visibility channels produce zero reservations."
7. **Does conflicting evidence exist?** None found.
8. **Would a reasonable challenger accept the confidence level?** Yes, once the "162 lost reservations" framing was corrected (test 2) and the zero-revenue figures were correctly labeled as not-tracked rather than zero (test 6).

Outcome: **Survives with Narrowing** ("lost reservations" language removed and replaced with "unreconciled discrepancy"; zero-revenue mislabeling risk explicitly addressed).

#### Boundaries

OC-007 establishes that reservation volume and service mix are measured for the stated 90-day window, and that channel attribution is currently impossible. It does not establish:

- that the 162-reservation discrepancy represents lost or missed business (explicitly forbidden — the true explanation is unconfirmed);
- that current visibility work has or has not driven any reservation volume;
- whether 576 reservations/90 days is growing, stable, or declining (no prior-period comparison);
- ~~that 0% no-shows is an accurate operational fact rather than an artifact of tracking practice~~ — **confirmed 24 July 2026** by Kelvin; no longer a boundary of this claim.

#### Contradictory Evidence

None currently recorded.

#### Claim Conclusion

OC-007 is sufficiently supported by EV-016 for use in subsequent Organizational Understanding, with explicit preservation of the discrepancy, the no-shows uncertainty, and the structural (not evidentiary) nature of the missing channel attribution.

#### Challenge Status

Challenged — Survives with Narrowing.

#### Traceability

O-011 → EV-016 → OC-007
