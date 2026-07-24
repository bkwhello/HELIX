# UR-003 — Attribution Constraint on Business-Outcome Evaluation
---

*Constructed by Role A (Understanding Constructor), 24 July 2026, under decisions/DD-014's authorization. Challenged by Role B (Relationship Challenger) in the section below.*

## Status

Candidate

## Relationship Type

**Constraint**

## Related Claims

- OC-007 — Reservation Volume Is Measured but Not Attributable to Visibility Channels (constraining claim)
- OC-001, OC-002, OC-003, OC-004, OC-005, OC-006 (constrained claims)

## Relationship Statement

OC-007 establishes that reservation volume is measured (576 reservations, 1,976 guests over 90 days) but not attributable to any specific visibility channel, because three identified website tracking gaps remain unresolved and no GA4–Guestplan link exists. This constrains what can currently be evaluated about every other claim in this case: none of OC-001 (search visibility), OC-002 (GBP engagement), OC-003 (local-pack position), OC-004 (naming), OC-005 (machine accessibility), or OC-006 (technical performance) can currently be connected to a measured business outcome, positive or negative.

## Organizational Meaning

This relationship makes explicit a limit that would otherwise be easy to overlook: every other claim in this case describes a *visibility* condition, and none of them can yet be evaluated for *business* significance. This is organizationally important because it prevents two symmetric errors — treating any positive visibility finding (e.g., OC-003's local-pack position) as if it drives reservations, and treating any negative visibility finding (e.g., OC-002's decline) as if it has cost reservations. Both would overstate what is currently measurable.

## Supporting Evidence

- EV-016 (Guestplan reporting dashboard, O-011.md)
- The three tracking gaps: no "get directions" link, no Private Dining CTA, broken catering form (measurement/HV-MP-001.md §7, restated in O-011.md)

## Scope

- Channel: applies across all measured channels in this case (organic search, local pack, GBP profile) as they relate to Guestplan-recorded reservations specifically
- Query/page: not applicable — this is a measurement-architecture constraint, not a query-level finding
- Geography: not applicable
- Device: not applicable
- Period: constraint is current and structural (GA4 published 23 July 2026 with no prior history; Guestplan window 23 Apr–23 Jul 2026) — not expected to resolve without a specific tracking fix

## Confidence

- Level: High — this is a structural, directly-observed measurement gap (absence of a link, absence of tracking on three specific site elements), not an inference
- Rationale: OC-007 itself carries High confidence for volume/mix and explicitly N/A (not low, but simply not measurable) for channel attribution — this relationship inherits that same high-confidence structural fact

## Limitations

- This constraint could change if the three tracking gaps are closed and a GA4-Guestplan link is built — it is a current, not permanent, limitation.
- The 162-reservation discrepancy between Guestplan's two internal reports remains separately unexplained and is not resolved by this relationship.
- This relationship does not itself measure how large the unmeasured business effect might be, in either direction — it states only that it cannot currently be measured.

## Excluded Interpretation

- That any claim's visibility finding has or has not affected reservations — both directions are excluded.
- That the 162-reservation discrepancy, or any other unexplained figure, represents lost reservations, unconverted demand, or any other negative business outcome.
- That OC-007 is itself a negative or deficient finding — it is a Measurement/Attribution Constraint, not an operational failure.
- That closing the tracking gaps would necessarily reveal a specific attribution pattern — this relationship does not predict what such a fix would show.

## Open Challenges

- None in Challenge Evidence/CR-register.md directly targets OC-007 or the tracking gaps.

## Diagnosis Boundary

This relationship does not establish whether any visibility condition in this case has business consequence, does not quantify the unmeasured effect, and does not propose a fix for the tracking gaps (that is Design-stage work, contingent on this constraint being addressed first). It only states, precisely, what cannot currently be known.

## Traceability

O-011 → EV-016 → OC-007 → UR-003 (constraining OC-001, OC-002, OC-003, OC-004, OC-005, OC-006) → Candidate Understanding

---

## Challenge (Role B — Relationship Challenger)

*Independent challenge, 24 July 2026.*

1. **Are both/all claims independently justified?** Yes — OC-007 and all six constrained claims are independently Justified Organizational Claims.
2. **Does evidence support the relationship or only the individual claims?** The constraint itself is directly evidenced by OC-007 (the three tracking gaps and absent GA4-Guestplan link are OC-007's own stated basis) — applying that constraint to the other six claims is a logical consequence of OC-007's scope (it says "not attributable to any specific discovery channel"), not a new empirical claim requiring separate evidence.
3. **Is the relationship broader than its evidence?** Initial risk: stating the constraint applies to "every other claim" could overreach if any claim already has independent, non-Guestplan business-outcome evidence. **Checked:** none of OC-001–OC-006 makes any business-outcome claim at all (all are visibility-only claims per their own Scope sections) — so the constraint does not need to *override* any existing business claim, it simply notes none exists yet. Not broader than its evidence.
4. **Is co-occurrence being represented as dependency?** Not applicable — this relationship is explicitly typed as Constraint, not dependency, and states no claim depends on another.
5. **Is contrast being represented as explanation?** Not applicable — no contrast is asserted.
6. **Is a current-state screenshot being used as historical evidence?** No — OC-007's evidence (EV-016) is a 90-day Guestplan export, not a screenshot-derived current-state fact, and this relationship does not touch E-05/E-06/E-07.
7. **Is Partial evidence being treated as complete?** No.
8. **Does CR-006 contaminate the relationship?** No — unrelated evidence domain (reviews vs. reservations).
9. **Is OC-007 represented as an operational failure rather than a measurement constraint?** Checked directly — the Excluded Interpretation section explicitly states OC-007 "is a Measurement/Attribution Constraint, not an operational failure," satisfying DD-014 Condition 6 directly.
10. **Does the wording imply a cause?** No.
11. **Could the relationship survive if OC-002 remains standalone?** Yes — this is a key test for this specific relationship, since OC-002 is one of the six constrained claims. The constraint applies to OC-002 identically whether or not OC-002 is otherwise connected to anything else (UR-001, UR-002) — OC-002's business-outcome unattributability does not depend on OC-002 having any other relationship. Survives.
12. **Does the relationship add organizational meaning beyond repeating claims?** Yes — no single claim states this constraint's *scope* (that it applies to all six others) — that synthesis is new and directly answers DD-014's own G-03 candidate question about OC-007.

**Outcome: Survives.** No narrowing required.
