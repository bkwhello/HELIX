# R1.5 — Floor & Seating: Final Architecture Gate

**Mode: ARCHITECTURE ONLY.** No production code, Prisma schema, migration, package, API, or website change was made. No commit. No push. No deployment.

**Program:** Guestplan Replacement · **Previous gate:** R1.4 — PASS · **Authoritative predecessor:** `R1_5_FLOOR_SEATING_ARCHITECTURE_INVESTIGATION.md` (owner-input-blocked, now resolved below)

---

## 1. Executive Summary

Owner input closes almost every question the initial investigation raised. The resulting architecture is smaller than the investigation's own worst case: one physical entity (`Table`, reused verbatim for both Sushi tables and Teppanyaki grills — the owner's own vocabulary difference is a naming convention within one area, not a second entity type), one assignment mechanism (`SeatingAssignment` + `SeatingAssignmentResource`), one operational status field, and a PostgreSQL `EXCLUDE` constraint (not a plain unique index — the Chief Engineer's instruction to be precise here was correct to press on) as the structural backstop.

**Two numeric findings are reported, not reconciled, per explicit instruction — one owner-flagged, one found during this gate:**

1. **Sushi: 47 nominal physical seats vs. 60 commercial capacity.** Not a logical contradiction (CanAccept and CanSeat are deliberately different questions, §11) but a real, previously-invisible operational fact: at full commercial capacity the restaurant is asking to seat 13 more guests than its own currently-described physical inventory nominally holds. Flagged as a new owner question (§25), not resolved by changing either number.
2. **Teppanyaki: 24-person preferred block vs. 2 grills × 10 seats = 20 physical seats.** **This was not owner-flagged — it is a contradiction this gate found by doing the arithmetic the assignment's own Sushi example modeled.** Two parallel grills hold 20 seats, not 24. Flagged as a new, high-priority owner question (§25). This report does not invent an explanation (extra portable seating, an approximate/aspirational figure, or a genuine data error are all equally possible) and does not silently cap the "preferred block" concept at 20.

**Architecture decisions of note**: the previously-separate Arrived/Seated split collapses into **one** operational status (`Seated`) per explicit owner instruction (§14); No-Show releases **only** the `SeatingAssignment`, never automatically the `Reservation` lifecycle or the `CapacityCommitment` — both left as open, correctly-flagged owner questions rather than invented rules (§15); and the PostgreSQL structural backstop is a **range-based `EXCLUDE` constraint** (requiring the standard `btree_gist` extension), not a plain partial unique index, because a plain unique index cannot represent "the same resource legitimately reused at a different, non-overlapping time" (§18).

**Gate result: ARCHITECTURE READY. OWNER INPUT: INCOMPLETE (two new items, §25) but not blocking — both are advisory/visibility-scoped in MVA, per §11's CanAccept/CanSeat separation. IMPLEMENTATION: AUTHORIZED TO REQUEST**, not authorized to begin.

---

## 2. Repository Baseline

| Item | Value |
|---|---|
| Repository | `HELIX` |
| Branch | `feat/ec-002-visibility-baseline` |
| HEAD | `92f56374180ddaa82228a2204f33be1e6aad0257` — unchanged since the prior investigation |
| Staged files | None |
| Untracked files | `R1_3_GUEST_CONTACT_ARCHITECTURE_INVESTIGATION.md`, `R1_5_FLOOR_SEATING_ARCHITECTURE_INVESTIGATION.md` — both pre-existing, both unmodified by this gate |

No drift. No pull/merge/rebase/push performed.

---

## 3. Owner Rules Incorporated

Verbatim facts this gate treats as authoritative, none re-derived or second-guessed:

- Sushi: 7×2-person + 6×4-person + 1×5-person + 4×1-person tables = 47 nominal places.
- Sushi tables may be combined; no automatic combination optimization engine required.
- Guest table choice is allowed when quiet, staff-controlled when busy; no numeric "quiet" threshold confirmed.
- Teppanyaki: 4 grills × 10 seats = 40, matching CAP-D02.03's existing pool capacity.
- Grills may be shared by unrelated parties at the seat level.
- Teppanyaki parties may be split across grills when necessary; keeping a party together is preferred, not mandatory.
- A preferred maximum "ideal block" of 24 persons exists, realized as two grills positioned parallel to each other; this is a preference, not a capacity redefinition.
- All Teppanyaki seats are currently usable — no VIP/accessibility/quality/permanent-exclusion seats exist today.
- Chefs may be short-staffed, resulting in fewer than 4 grills being operationally offered on a given service, without deleting the grill resource itself. Workforce scheduling itself is out of scope.
- On quiet days or below ~70% booked, capacity may be intentionally left open for walk-ins — not a hard booking-rejection rule.
- Walk-ins remain ordinary Reservations (`sourceCategory = WalkIn`), no separate aggregate, R1.3 minimum-contact rules unweakened.
- One operational status (`Seated`) is sufficient for R1.5 MVA — no separate Arrived/Seated split.
- On a busy evening, 20 minutes late may lead to a staff-confirmed No-Show and seating release — never an automatic release at exactly +20 minutes.
- Pre-assignment (assigning tables/grills before the guest arrives) is normal, expected operation, not a deferred optimization.
- The same physical resource may be reused for non-overlapping intervals on the same day; back-to-back (`end == start`) is valid, half-open `[start, end)` semantics.
- Sushi duration remains 90 minutes, Teppanyaki 150 minutes — unchanged, single authority (CAP-D02.03), never re-derived inside seating.

---

## 4. Physical Floor Model

One physical entity type, `Table` — reusing exactly the name `CAP-D03.03` (Table and Seat Management) already registers, deliberately not introducing a second entity ("Grill") for what is architecturally the same kind of thing (an assignable, named, capacity-bounded, area-scoped physical resource) wearing a different label depending on area:

```
Table
  id            — stable, immutable (§23)
  areaId        — Sushi | Teppanyaki (CAP-D03.01 Restaurant Area reference)
  name          — "T4", "Grill 1", etc. — human-facing, area-appropriate label
  capacity      — max guests this table/grill alone holds
  supportsSharedSeating — true for Teppanyaki grills (owner-confirmed sharing), false for
                  ordinary Sushi tables (no evidence of Sushi-table sharing)
  status        — Active | Inactive (§9)
```

`Seat` rows exist **only** for `Table` rows with `supportsSharedSeating = true` — i.e., today, only the four Teppanyaki grills. Sushi tables are claimed as a whole unit via a `SeatingAssignmentResource.tableId` row (§10); no `Seat` rows are created for them, because nothing in the owner's confirmed rules requires seat-level tracking there (guest choice when quiet is a *preference*, §11, not a seat-numbering requirement — a guest choosing "that table by the window" is choosing a `Table`, not a `Seat`).

This directly answers **Architecture Decision #1 (physical resource entities)** and **#2/#3 (Sushi/Teppanyaki representation)**: one entity type, two usage patterns, driven entirely by the `supportsSharedSeating` flag — not two parallel models.

---

## 5. Sushi Resource Model

18 `Table` rows, `areaId = Sushi`, `supportsSharedSeating = false`:

| Type | Count | Capacity each |
|---|---|---|
| 2-person | 7 | 2 |
| 4-person | 6 | 4 |
| 5-person | 1 | 5 |
| 1-person | 4 | 1 |

**Nominal total: 47** (7×2 + 6×4 + 1×5 + 4×1 = 14+24+5+4 = 47 — arithmetic re-verified independently, matches the owner's own figure exactly).

**§17/§11's boundary applies directly here**: `CAP-D02.03` continues to answer "can the pool accept N more Sushi guests against 60?" — entirely unaware these 47 physical rows exist. `CAP-D04`'s `CanSeat` answers "do 47 nominal places, arranged as 18 discrete/combinable tables, actually fit this specific request, right now?" — entirely unaware of the number 60. Neither capability is taught the other's number. This is not an oversight; it is §11's explicit, owner-reaffirmed design.

**No table is inherently combinable with any specific other table in this model** — see §7: MVA does not pre-register valid combination pairs.

---

## 6. Teppanyaki Resource Model

4 `Table` rows, `areaId = Teppanyaki`, `supportsSharedSeating = true`, `capacity = 10` each. Each carries exactly 10 `Seat` child rows (`seatNumber` 1–10, `status = Active`, per §8 — no seat is pre-marked unusable, VIP, or excluded, since none is owner-evidenced).

**Nominal total: 4 × 10 = 40 — matches CAP-D02.03's existing Teppanyaki pool capacity exactly.** Unlike Sushi, this alignment means the physical model and the commercial ceiling agree, at least at the whole-service level (§25 still flags that agreement at the aggregate level does not by itself prove agreement at the per-grill/per-seat level under every possible split of an 18-person or 24-person party across grills — a structural observation, not a numeric contradiction).

Sharing is real: `SeatingAssignmentResource` rows claim **individual seats**, never a whole grill as a headcount block, so two, three, or more unrelated parties' `SeatingAssignment`s can each hold a distinct, non-overlapping subset of one grill's 10 `Seat` rows for the same or overlapping time windows — this is the structural mechanism, not a special case, and is exercised by Scenario E (§20).

---

## 7. Table Combination Model

**Decision #4**: no `TableCombination` registry entity for R1.5 MVA — confirmed unchanged from the prior investigation, now reinforced by explicit owner instruction ("Do NOT build an automatic table-combination optimization engine unless strictly required for correctness... The MVA may allow staff to select multiple compatible tables manually"). Mechanism: one `SeatingAssignment` may reference **more than one** `SeatingAssignmentResource` row with `tableId` set (and no `seatId`) — the exact multi-resource mechanism already designed for Teppanyaki multi-seat claims, reused unmodified for Sushi multi-table claims. Staff, not the system, judge "compatible" (adjacency, physical feasibility) — the system's only job is preventing any one of the selected tables from being double-claimed for an overlapping interval (§18), which it does identically whether the claim is for one table or five. This satisfies Scenario B (§20) with zero new machinery beyond what Teppanyaki already requires.

`CAP-D03.04` (Table Combination Management) remains correctly `Deferred`/`mvp: false` in the registry — nothing in the owner's rules contradicts that classification; "staff select tables manually" is explicitly the smaller, MVA-appropriate alternative the registry's own deferral already anticipated.

---

## 8. Preferred 24-Person Teppanyaki Block

**Decision #5/#6**: represented as **staff-selected multi-grill assignment**, using the exact same mechanism as §7 — no new entity. A `SeatingAssignment` for a large party selects seats across two grills (or more, for an 18-person party split differently, Scenario G) exactly as a large Sushi party selects multiple tables. "The ideal 24-person block, realized as two grills positioned parallel to each other" is **operational/spatial *guidance* about *which* two grills to prefer when a large-block request arises — a floor-layout fact, not a new capacity ceiling and not a new stored constraint.**

**Where does this belong?** Not a new capability. `CAP-D03.02` (Floorplan Management) already registers "layout integrity" as one of its owned rules — the *adjacency*/parallel-positioning fact (which two grills are physically side-by-side) is floorplan-layout information, naturally belonging there as descriptive floor-layout metadata (e.g., an optional `preferredPairId`/adjacency note on the two relevant `Table` rows), not a rule enforced anywhere in `CAP-D04`. Whether and how staff are *guided* toward that pairing when a large party books is a `CAP-D04.01` (Seating Assignment) **presentation/suggestion concern at most — never an enforced constraint**, since nothing prevents staff from legitimately splitting a large party across two *non-adjacent* grills if that's what a given night requires (owner: "keeping a party together is preferred, not mandatory," and no evidence restricts *which* grills may be combined).

**The arithmetic problem, stated precisely and not resolved**: 2 grills × 10 seats/grill = **20** physical seats. The owner's confirmed "ideal block" is **24** persons. **This is 4 seats short of what the described two-grill physical arrangement can hold.** Three explanations are equally consistent with the evidence given, and this report does not choose among them: (a) supplemental seating (extra chairs, a connecting table) exists at that block beyond the 4×10 grill inventory and was not mentioned because it wasn't asked about directly; (b) "24" is an approximate/rounded planning figure rather than an exact seat-for-seat count; (c) the two numbers are simply inconsistent and one needs correction. **Flagged as a new owner question (§25), not resolved.** The architecture itself is unaffected either way — a `SeatingAssignment` can represent any number of claimed seats across any number of grills up to the true physical maximum, whatever that maximum turns out to be once clarified; nothing about the model requires "24" to be achievable for the model to be correct.

---

## 9. Resource Availability / Chef Constraint

**Decision #7**: reuses the mechanism already identified in the prior investigation — a **`ResourceBlock`**, registered under `CAP-D02.03` (confirmed correct owner: the registry already names `Resource Block` as a `CAP-D02.03`-owned concept with `ResourceBlocked`/`ResourceUnblocked` events):

```
ResourceBlock
  resourceId   — a Table id (a whole grill goes offline when chefs are short — the owner's
                 example is grill-level, not seat-level; nothing evidences a need to block
                 individual seats independently of their grill)
  startTime / endTime
  reason       — free text (e.g. "chef shortage")
  actor        — StaffUser (R1.2)
```

**Physical existence and operational availability are explicitly separate** (owner's own framing) — a chef-shortage `ResourceBlock` never touches `Table.status` (which stays `Active` — the grill still physically exists and is not being decommissioned) and never deletes any `Seat` row. `CanSeat` (§11) excludes a blocked grill's seats for the blocked interval; nothing about capacity (`CanAccept`) changes, since `CAP-D02.03` has no knowledge of grills to begin with. This directly satisfies Scenario I (§20) and stays correctly out of workforce-scheduling territory — no shift, roster, or chef-identity concept is introduced anywhere in this model.

**Decision #10 (Intentional Empty Capacity)**: **no new domain rule, no new stored field, no threshold logic anywhere in code.** Re-confirmed against the owner's own explicit instruction ("do NOT automatically convert '70%' into a hard booking rejection rule" and "investigate whether R1.5 merely needs to make remaining capacity and unassigned seating visible"). The Floor Read Model (§26/prior investigation §18) already surfaces "which tables/seats are currently unassigned for a given interval" as a natural, derived query — that visibility is the entire mechanism. A staff member choosing not to pre-assign a free table, so it remains visibly free for a walk-in, requires nothing further from this architecture. `CAP-D02.03`'s own acceptance logic is untouched, exactly as instructed.

---

## 10. SeatingAssignment Model

**Decision #8**, refined from the prior investigation to incorporate the collapsed operational status (§14) and the interval-snapshot requirement the PostgreSQL integrity strategy needs (§18):

```
SeatingAssignment
  assignmentId
  reservationId          — always set; every assignment, including walk-ins, references a
                            real Reservation (§13)
  status                  — Assigned | Seated | Released   (§14 — the one collapsed status)
  releaseReason            — nullable; set only when status = Released
                            (e.g. GuestCancelled | StaffReassigned | NoShow | Completed)
  assignedAt / assignedBy  — StaffUser (R1.2 Actor)
  seatedAt                 — nullable; set when status transitions to Seated
  releasedAt / releasedBy  — nullable

SeatingAssignmentResource   (one row per physical Table or Seat claimed)
  assignmentId
  tableId                  — nullable
  seatId                   — nullable   (exactly one of the two set per row — a table-level
                              claim for Sushi/whole-grill-style claims, a seat-level claim
                              for individual Teppanyaki seats)
  startTime / endTime       — SNAPSHOT of the occupied interval, copied from the reservation's
                              authoritative occupied interval (CAP-D02.03's own derivation,
                              §16/§20) at the moment this row is created or moved. Never a
                              second time authority — see §16. Required specifically so the
                              PostgreSQL EXCLUDE constraint (§18) can enforce overlap-freedom
                              on the row itself, without a live join back to Reservation —
                              exactly the same reason CapacityCommitment already stores its
                              own startTime/endTime rather than deriving them via a join on
                              every check (direct existing precedent, R1.1).
```

Cardinality (unchanged from the prior investigation, now explicitly reaffirmed against owner rules): **zero, one, or historically-many** `SeatingAssignment`s per `Reservation`; **at most one** non-`Released` `SeatingAssignment` per `Reservation` at any instant (mirrors R1.1's own "one Committed `CapacityCommitment` per reservation" invariant exactly); **one or many** `SeatingAssignmentResource` rows per `SeatingAssignment` (§7/§8's multi-table/multi-seat mechanism).

---

## 11. CanAccept vs. CanSeat Boundary

**Re-confirmed, unmodified from the prior investigation, now stress-tested against every owner rule above and found to hold in every case:**

- **`CanAccept`** (`CAP-D02.03`) — pure headcount vs. the 60/40 pool ceiling. Untouched by this gate. Never learns about `Table`, `Seat`, `Grill`, or `ResourceBlock`.
- **`CanSeat`** (`CAP-D04.01`, new) — does a specific set of currently-`Active`, currently-un`ResourceBlock`ed `Table`/`Seat` rows exist that (a) sums to at least the party size, (b) is free of any overlapping non-`Released` `SeatingAssignmentResource` claim for the requested interval, and (c) respects `supportsSharedSeating` (a Sushi table cannot be partially claimed by two different reservations the way a Teppanyaki grill's seats can). Never learns about the number 60 or 40.

**A reservation may be `Confirmed` (CanAccept said yes) and simultaneously have `NO_VALID_SEATING_FOUND`/no assignment at all (CanSeat not yet evaluated or not yet satisfiable)** — this is not a defect, it is `CAP-D01.01-R24`'s own pre-existing, unmodified invariant, and every owner rule reviewed in this gate is consistent with keeping it exactly as-is. `CanSeat` remains **advisory in R1.5 MVA** (§11 of the prior investigation, unchanged) — nothing blocks reservation creation or confirmation on a `CanSeat` failure; the Sushi 47-vs-60 finding (§1/§25) is the clearest evidence yet that keeping `CanSeat` advisory is the *correct*, not merely convenient, choice for now — an authoritative/blocking `CanSeat` today would make the 47-vs-60 gap a hard operational wall the business has apparently been operating around successfully without one.

---

## 12. Pre-Assignment Model

**Decision #9**: no new object, no new workflow. "Confirmed but unassigned" and "Confirmed and pre-assigned" are simply the **presence or absence of a non-`Released` `SeatingAssignment`** for an otherwise-unchanged `Reservation` — the exact same `SeatingAssignment` creation path used for day-of/walk-in assignment, exercised at a different point in time relative to the reservation's own `reservationDate`. Nothing in the mechanism cares *when* it is invoked; "prepare the floor before guests arrive" (owner's own phrase) is staff choosing to call it early, not a distinct capability. This satisfies the owner's explicit instruction that pre-assignment be normal, first-class operation, without inventing automatic allocation (no rule anywhere decides *for* staff which reservations get pre-assigned or when).

---

## 13. Walk-In Model

**Retained unmodified from the prior investigation — no owner rule contradicts it.** Model C: an ordinary `Reservation` with `sourceCategory = WalkIn` (the value already exists in `domain/value-objects/ReservationSource.ts`), R1.3's `CAP-D05.01-R01` minimum-contact rule unweakened and unduplicated, seated via the identical `SeatingAssignment` mechanism used for every other reservation (owner's own explicit instruction: "Walk-ins must consume physical seating resources through the same SeatingAssignment mechanism as reservations" — directly confirms the prior recommendation rather than requiring any change to it). A walk-in's `SeatingAssignment` typically moves straight to `status = Seated` on creation (no separate pre-assignment step needed for same-moment seating), which the collapsed single-status model (§14) makes simpler than the prior investigation's two-status version would have.

---

## 14. Seated / Operational Status

**Decision #10, and the single largest simplification this gate makes relative to the prior investigation.**

Owner: *"ONE operational status is sufficient... Do NOT build separate Arrived and Seated workflows... Seated = guest is physically present and has entered the active floor/seating operation."*

**Verified against existing evidence, not assumed:**

- `Reservation.arrivedAt` (`prisma/schema.prisma`) — comment: *"Operational arrival marker, staff-toggled during service. Outside the scope of this capability's formal rule model (no Rxx)... a pragmatic staff-facing field, not a modeled check-in/Seating Management capability."* This field's own documentation already disclaims formal ownership — it is not a competing authority this decision must migrate away from carefully; it is exactly the placeholder the owner's single-status rule properly supersedes. **Recommendation: `Reservation.arrivedAt` is superseded by `SeatingAssignment.seatedAt`/`status = Seated` going forward; the field itself is not touched by this architecture-only gate (§23 covers migration handling).**
- `CAP-D01.01-R24` — "Confirmation Does Not Guarantee Seating," lists "a specific table has been assigned; a specific seat has been assigned" as things confirmation does not mean, and states those outcomes "belong to other capabilities." A single collapsed `Seated` status on `SeatingAssignment` is fully consistent with R24 — it is simply a *later* point on the same "outcomes belong elsewhere" timeline R24 already established, not a new state added to `ReservationAggregate` (R24's `override_allowed: false` is respected; nothing here touches `ReservationAggregate` at all).

**Registry note**: the registry separately names `CAP-D04.03` (Guest Arrival Management: "Arrival Status, Arrival Timestamp, No-show Status") and `CAP-D04.04` (Live Service Management: "Seating State") as two distinct capabilities. **This gate does not merge those capabilities or edit the registry.** For R1.5 MVA, both capabilities' *relevant* state is satisfied by the **same one field** (`SeatingAssignment.status`/`seatedAt`) — a scoping decision about how much of each registered capability's *eventual* full scope is realized now, not a claim that the two capabilities are actually one. If arrival-vs-seated ever needs to be distinguished later (e.g., a guest checks in at a host stand well before their table is ready), splitting the single field back into two is a additive, non-breaking future change — nothing in this gate forecloses it.

---

## 15. Late Arrival / No-Show

**Decision #11, worked through exactly as the owner's own recommended shape prescribes, with the CapacityCommitment/Reservation-lifecycle interaction explicitly analyzed rather than assumed:**

```
+20 minutes late, busy evening
  → DERIVED, presentation-only "at-risk" flag surfaces in the floor read model
    (current time vs. reservation time — no stored field, same "Expected" pattern
    already established for the derived-state category in the prior investigation)
  → staff explicitly reviews and confirms No-Show (an authenticated, attributed
    StaffUser action — R1.2)
  → ONE transaction:
      SeatingAssignment.status → Released, releaseReason = "NoShow", releasedBy = actor
      SeatingAssignmentResource rows for that assignment → released (freed for reuse)
      A CAP-D04.03-owned audit/timeline event (GuestMarkedNoShow) is appended
```

**No automatic release at exactly +20 minutes** — the derived flag is advisory-only; only the explicit staff confirmation step performs a write, matching the owner's instruction word for word.

**Explicit analysis of the three questions the assignment requires, none assumed:**

1. **Does No-Show change `Reservation.status`?** **No, by default, and this gate does not invent a rule that it should.** `CAP-D01.01`'s state-model (unchanged, out of scope to edit here) has no `NoShow` transition today — only `Proposed → Confirmed → {Completed, Cancelled}`. Introducing one would be inventing a business rule the owner has not confirmed. If a No-Show should *eventually* lead to `Cancelled` or `Completed`, `CAP-D01.01-R30`'s own existing bridge already provides the correct path: No-Show becomes one more piece of "operational evidence" a staff member can cite when *manually* completing or cancelling the reservation — exactly the same bridge Live Service Management/Guest Arrival/Table Release already use per R30's own text. No automatic transition is introduced.
2. **Does No-Show release the `CapacityCommitment`?** **No, by default — flagged as a new, explicit owner question (§25), not decided here.** The instruction is explicit: "do not automatically alter CAP-D02.03 capacity commitments unless the architecture proves that is the correct lifecycle consequence." This architecture does not prove that — releasing capacity on No-Show is a genuine business-policy choice (does the restaurant want that headcount slot to become bookable again for the same evening, or treated as a recorded loss?) with no evidence either way in this repository. Leaving it untouched is the safe default; it is also reversible (a later, explicit rule can add the release without any structural rework, since `CapacityCommitment` release is already an idempotent, well-understood operation from R1.1's own Cancel path).
3. **Transaction integrity**: the SeatingAssignment release above is the *only* write that happens automatically; because it does not touch `Reservation` or `CapacityCommitment` (per points 1–2), it needs no cross-capability shared transaction of its own beyond `SeatingAssignment`+`SeatingAssignmentResource` together (§19). If a staff member *separately, manually* also cancels/completes the reservation and/or releases capacity following a No-Show, those are their own already-existing, already-transactional operations (R1.1's `cancelWithCapacity`), not new machinery this gate must design.

---

## 16. Interval and Back-to-Back Semantics

**Decision #13, no new definition — direct reuse.** Half-open `[startTime, endTime)`, identical to `domain/availability/AvailabilityEvaluator.ts`'s existing `intervalsOverlap` (`s1 < e2 AND s2 < e1`, strict inequalities). Back-to-back (`A.endTime === B.startTime`) never overlaps under this definition — `18:00–19:30` followed by `19:30–21:00` on the same table is valid, exactly as the owner's Scenario D confirms. `SeatingAssignmentResource.startTime`/`endTime` (§10) are snapshotted from the same duration authority already established: `CAPACITY_POOLS[pool].durationMinutes` (Sushi 90, Teppanyaki 150) via the reservation's own `reservationDate` + duration — **no second duration authority is created inside seating**, directly satisfying the owner's explicit instruction. The PostgreSQL `tsrange(startTime, endTime)` construction used by the `EXCLUDE` constraint (§18) defaults to the same `[)` bound convention, so the database-level enforcement and the application-level definition agree exactly — verified, not assumed (the assignment's own instruction: "do not claim a database constraint solves interval overlap unless it actually does").

---

## 17. Registry Divergences

Both previously-identified issues re-examined against the owner rules above; neither owner rule resolves or worsens either divergence, so both stand exactly as previously found:

**A — `capability-map.md` vs. `capability-registry.yaml.md` ID-scheme inconsistency.** Unaffected by this gate's owner rules (a pure documentation-governance issue). **`capability-registry.yaml.md` remains authoritative** (self-declared, internally consistent, and the document every implementation artifact in this repository actually cites). **A later governance/registry-correction pass is recommended** — specifically, retiring or re-versioning `capability-map.md` so it no longer presents a second, inconsistent ID scheme for the same capabilities. **Does not block R1.5 implementation** — this gate, like the prior investigation, uses only registry-authoritative identifiers throughout.

**B — `CAP-D02.03`'s registered dependency on `CAP-D03.03`/`CAP-D04.01`/`.02`, unrealized in the actual R1.1 implementation.** This gate's entire §11 boundary decision is built on *keeping* that unrealized dependency unrealized — `CanAccept` and `CanSeat` staying independent is not an oversight to fix, it is the architecturally correct choice, now additionally reinforced by the Sushi 47-vs-60 finding (§1/§9/§11): if `CAP-D02.03` were retrofitted to actually depend on table/seat data the way the registry describes, the 47-vs-60 gap would become a hard contradiction requiring immediate resolution, instead of the tracked, advisory, non-blocking operational fact it correctly is under the boundary this gate reaffirms. **Recommendation: the registry's dependency listing for `CAP-D02.03` should eventually be corrected to remove `CAP-D03.03`/`CAP-D04.01`/`.02`** (or annotated as aspirational/superseded), since this gate's own findings are now a second, independent piece of evidence (beyond the original investigation's implementation-trace) that the dependency was never load-bearing and should not become so. **Does not block R1.5 implementation** — the registry's stated-but-unrealized dependency does not prevent building `CAP-D04.01`/`.02` as genuinely independent of `CAP-D02.03`, which is exactly what this architecture does. **No registry edit was made in this gate**, per explicit instruction.

---

## 18. Concurrency Model

Extends R1.1's proven three-tier pattern (`AvailabilityOrchestrator.ts`, `LockKey.ts`) with one new tier, formally re-proven against all six owner-listed race requirements plus the twelve scenarios (§20):

```
TIER 1 — Reservation-scoped lock (existing, RESERVATION_LOCK_NAMESPACE "HALR")
  Acquired FIRST, always, by any operation touching this reservation's SeatingAssignment,
  CapacityCommitment, or Reservation fields together.

TIER 2 — Capacity pool/date lock(s) (existing, CAPACITY_LOCK_NAMESPACE "HALX",
  sortLockResources-ordered) — unchanged, only relevant when the operation is also
  capacity-relevant (a create, or a modify that changes date/party size/area).

TIER 3 — Seating-resource lock(s) [NEW] — one advisory-lock key per distinct tableId/seatId
  touched by the operation, in a NEW namespace (e.g. "HALS"), acquired in a deterministic
  sort order (tableId/seatId ascending — the direct extension of sortLockResources's own
  existing dedup+sort pattern, LockKey.ts, to a new resource-key shape).
```

**Owner-required race coverage, each mapped to the tier(s) that resolve it:**

1. **Two overlapping reservations claiming the same Sushi table** — Tier 3, single-resource contention; resolved by the `EXCLUDE` constraint (§19) even in the (should-never-happen) case a lock is somehow bypassed.
2. **Two overlapping reservations claiming the same Teppanyaki seat** — identical to #1, one level more granular (`seatId` instead of `tableId`).
3. **Concurrent reassignment creating duplicate claims** — Tier 1 (same reservation) serializes any two operations moving the *same* reservation; Tier 3 (same resource) serializes any two operations targeting the *same table/seat* even across *different* reservations (Scenario L, §20).
4. **Cancel/no-show racing with reassignment** — Tier 1 directly, identical mechanism to R1.1's already-proven Cancel-vs-Modify fix — no new mechanism needed for the same-reservation case; a No-Show release (§15) is itself just a `SeatingAssignment`-scoped write that should also acquire Tier 1 for the reservation it belongs to, for the same reason every other reservation-touching write does.
5. **Pre-assignment racing with walk-in seating** — Tier 3 (both are ordinary `SeatingAssignment` creation against the same table, from different reservations) — Scenario K, §20.
6. **Multi-table/multi-seat assignment deadlocks** — prevented by the same fixed global order argument `sortLockResources` already uses (§4/§13 of the prior investigation): every caller acquires Tier 1, then Tier 2 (if relevant), then Tier 3 resources **in the same deterministic order**, so no two operations can ever hold-and-wait on each other's Tier-3 resources in opposite order.

**All resolutions are structural** (locks + the `EXCLUDE` constraint make the violation impossible to persist), not detection-only, satisfying the assignment's explicit requirement.

---

## 19. PostgreSQL Integrity Strategy

**This is the point the Chief Engineer's instruction was most precise about, and the point where this gate's recommendation changes from the prior investigation's.**

**A plain `UNIQUE(tableId) WHERE status IN ('Assigned','Seated')`-shaped partial index is explicitly WRONG for this problem** — correctly identified by the assignment. It would only ever allow **one** non-released claim per table, for all time, which directly violates the owner-confirmed, MVA-required back-to-back reuse rule (§16, Scenario D): Reservation A (`18:00–19:30`) and Reservation B (`19:30–21:00`) on the same table T4 are both legitimately `Assigned` simultaneously (as stored rows — B can be pre-assigned, §12, while A is still active), and a plain unique index on `tableId` alone cannot distinguish that from the actually-invalid case of two *overlapping* claims.

**Recommended, precise mechanism: a PostgreSQL range `EXCLUDE` constraint**, using the `btree_gist` extension (`CREATE EXTENSION IF NOT EXISTS btree_gist;` — a standard PostgreSQL contrib extension, not a new external dependency), on `SeatingAssignmentResource`:

```sql
ALTER TABLE seating_assignment_resources
  ADD CONSTRAINT seating_resource_no_overlap_table
  EXCLUDE USING gist (
    "tableId" WITH =,
    tsrange("startTime", "endTime", '[)') WITH &&
  )
  WHERE ("tableId" IS NOT NULL AND status IN ('Assigned', 'Seated'));

ALTER TABLE seating_assignment_resources
  ADD CONSTRAINT seating_resource_no_overlap_seat
  EXCLUDE USING gist (
    "seatId" WITH =,
    tsrange("startTime", "endTime", '[)') WITH &&
  )
  WHERE ("seatId" IS NOT NULL AND status IN ('Assigned', 'Seated'));
```

**Why this actually solves the problem, verified rather than asserted**: an `EXCLUDE` constraint rejects an INSERT/UPDATE only when *both* the equality condition (`tableId WITH =` — same table) *and* the overlap condition (`&&` — the `[)`-bounded ranges genuinely overlap) hold simultaneously for two rows satisfying the `WHERE` clause. Two rows for the same table with **non-overlapping** ranges (back-to-back or otherwise disjoint) are explicitly **permitted** — this is the entire point of using a *range* exclusion rather than a plain equality-only unique index, and is exactly what §16's `[)` bound convention, applied consistently at the database level, guarantees matches the application-level definition. The `WHERE` clause scopes the constraint to only `Assigned`/`Seated` rows, so a `Released` row never blocks a new claim on the same table/interval — required for both normal reassignment (§14/§20 Scenario L) and No-Show release (§15) to ever succeed.

**Two separate constraints (table-scoped and seat-scoped)**, rather than one unified constraint, because `SeatingAssignmentResource` is deliberately polymorphic (`tableId` XOR `seatId` per row, §10) — collapsing this into one physical-resource-id column purely to simplify the constraint would reintroduce the generic-resource-abstraction Model C the original investigation correctly rejected (§5 of the prior investigation) for lack of evidenced need; two constraints is a small, honest cost of keeping the Table/Seat split PRP-020 already favored.

**This is now an R1.5 MVA-required mechanism**, reversing the prior investigation's "defer to Post-Replacement" classification — the Chief Engineer's explicit challenge ("do not claim a database constraint solves interval overlap unless it actually does... determine the correct PostgreSQL-compatible structural strategy") is a correct, well-founded push past the earlier, weaker "advisory locks are probably enough" position. The `btree_gist` extension is standard, well-understood, requires no new external service or package (it ships with PostgreSQL itself), and directly parallels this codebase's existing willingness to hand-write structural invariants beyond what Prisma can declare (`capacity_commitments_one_committed_per_reservation`, `staff_users_one_owner` — both already hand-written migration SQL, R1.1/R1.2 precedent).

---

## 20. Transaction Model

**Decision #16, explicitly analyzed per the assignment's exact required failure property: for every injected failure point, either (A) the complete previous valid state, or (B) the complete new valid state — never a hybrid.**

| Operation | Tables written | Shared transaction? |
|---|---|---|
| Create reservation + immediately seat (walk-in, §13) | `Reservation`, `CapacityCommitment`, `SeatingAssignment`, `SeatingAssignmentResource`(×N) | **Yes — one transaction.** Extends `AvailabilityOrchestrator.createWithCapacity` exactly as the prior investigation proposed; the `SeatingAssignment` write joins the same `TransactionManager.runInTransaction` callback already wrapping the Reservation+CapacityCommitment write. |
| Modify (table move, time change, party size, cross-area) | `Reservation`, `CapacityCommitment` (if capacity-relevant), `SeatingAssignment`, `SeatingAssignmentResource` | **Yes — one transaction**, extending `modifyWithCapacity` identically. |
| Cancel | `Reservation`, `CapacityCommitment`, `SeatingAssignment`, `SeatingAssignmentResource` | **Yes — one transaction**, extending `cancelWithCapacity` identically. |
| Pre-assignment (no reservation change) | `SeatingAssignment`, `SeatingAssignmentResource` only | Its own, smaller transaction — no `Reservation`/`CapacityCommitment` write occurs, so nothing else needs to join it. |
| No-Show release (§15) | `SeatingAssignment`, `SeatingAssignmentResource` only (per §15's explicit finding that `Reservation`/`CapacityCommitment` are not automatically touched) | Its own transaction — same reasoning as pre-assignment. |

**Why the shared-transaction model is preferred over evidence otherwise**: the assignment's own instruction — "prefer the proven shared-transaction orchestration model from R1.1/R1.3 unless evidence shows it cannot work" — and this gate found no such evidence. Every cross-capability write identified above (create-with-seating, modify-with-seating, cancel-with-seating) is a strict superset of an already-proven R1.1 shared-transaction operation; adding one more table's writes to an existing `runInTransaction` callback is the same technique already used to add `CapacityCommitment` to what was originally a `Reservation`-only write, and to add `Contact` to that same transaction for R1.3. **Property A/B is guaranteed by PostgreSQL's own transaction atomicity** for every operation in the "shared transaction" row above — a failure at any point rolls back every write in that callback, full stop; there is no code path that commits some but not all of `{Reservation, CapacityCommitment, SeatingAssignment, SeatingAssignmentResource}` for these three operations.

---

## 21. Scenario Proofs A–L

| # | Scenario | Mechanism | Result |
|---|---|---|---|
| **A** | 2 guests, 18:00–19:30, one free 2-person table | Single `SeatingAssignmentResource` row, `tableId` set | **Assignable.** Trivial case, no conflict possible. |
| **B** | 6 guests, two compatible tables selected manually | Two `SeatingAssignmentResource` rows under one `SeatingAssignment`, both `tableId` set, staff-selected (§7) | **Assignable** — both rows inserted in one transaction; the `EXCLUDE` constraint checks each independently, both pass if genuinely free. |
| **C** | A: T4 18:00–19:30; B: T4 19:00–20:30 | `tsrange` overlap: `18:00<20:30 AND 19:00<19:30` → true | **B's INSERT is rejected by `seating_resource_no_overlap_table`** — structurally, not just by application logic. |
| **D** | A: T4 18:00–19:30; B: T4 19:30–21:00 | `tsrange` overlap: `18:00<21:00 AND 19:30<19:30` → **false** (strict `<`, not `≤`) | **Both valid, both persist** — the exact back-to-back case the `EXCLUDE`-over-plain-unique-index decision (§19) exists to get right. |
| **E** | Grill 1 (10 seats): Party A claims 4, Party B claims 3, overlapping times | Two `SeatingAssignment`s, each with `SeatingAssignmentResource` rows against **7 distinct** `seatId`s at Grill 1 | **Both valid** — each seat-level `EXCLUDE` constraint only compares rows sharing the *same* `seatId`; A's 4 seats and B's 3 seats never collide because they reference different `seatId`s. |
| **F** | Grill (10 seats), 8 already claimed (overlapping), a new party requests 4 more, overlapping | Query for free seats at that grill/interval returns only 2 candidates; the request needs 4 | **Rejected before any INSERT is attempted** (application-level: `CanSeat` finds insufficient free seats) — and even if the application incorrectly attempted 4 specific seatId claims where 2 were already taken, the `EXCLUDE` constraint would reject those 2 conflicting rows, and the whole multi-row INSERT (§20, one transaction) rolls back entirely — **no partial 2-of-4 assignment is ever possible.** |
| **G** | Party of 18 | `SeatingAssignmentResource` rows spanning seats across **more than one** `Table` (grill) — no special-casing; the model already generalizes (§8) | **Representable.** No automatic optimization — staff choose which seats/grills. |
| **H** | Party of 24, preferred parallel-grill block | Same mechanism as G, applied to the two grills the floorplan marks as the "preferred block" pairing (§8) — **subject to the unresolved 20-vs-24 seat-count finding (§1/§8/§25)** | **Representable as a mechanism**; whether 24 physical seats are actually achievable at that specific pair is the open, flagged arithmetic question, not an architecture gap. |
| **I** | One grill temporarily unavailable (chef shortage) | Active `ResourceBlock` (§9) covering that `Table`'s id for the relevant interval | **`CanSeat` excludes that grill's seats for the blocked window; `Table`/`Seat` rows are untouched, nothing deleted.** |
| **J** | Busy evening, reservation 20 minutes late | Derived "at-risk" flag (read-model only) → staff-confirmed No-Show → one transaction releases `SeatingAssignment`/`SeatingAssignmentResource` only (§15) | **No automatic release at +20 minutes; release only on explicit staff confirmation, atomic, `Reservation`/`CapacityCommitment` untouched by default.** |
| **K** | Staff seats a walk-in at a free Sushi table; concurrently, another staff member pre-assigns that same table to an overlapping future reservation | Both operations reach Tier 3 (§18) for the same `tableId`; whichever acquires the advisory lock first proceeds, commits, and its `SeatingAssignmentResource` row exists when the second re-reads/re-attempts inside its own transaction | **Exactly one succeeds; the other's `EXCLUDE` constraint would reject it even in the (should-never-happen) case both somehow reached the INSERT concurrently without the lock serializing them — genuine defense in depth, not merely a redundant check.** |
| **L** | Two staff members simultaneously move two *different*, overlapping reservations onto the same table | Both operations acquire their OWN reservation's Tier-1 lock (no contention there, different reservations) then race on the SAME table's Tier-3 lock | **Exactly one wins the Tier-3 lock and commits; the other, re-reading inside its own transaction after acquiring the lock, correctly finds the table now taken and returns a conflict result — never a silent overwrite, and never a database-level exception surfacing raw to the caller** (mirrors R1.1's own `ReservationCommandRaceLost` catch-and-translate pattern, `AvailabilityOrchestrator.ts`). |

**Every scenario resolves without inventing a mechanism beyond**: the three-tier lock order (§18), the two `EXCLUDE` constraints (§19), and the shared-transaction model (§20). No scenario required a fourth tier, a third constraint, or an exception to the interval-overlap rule.

---

## 22. Acceptance Criteria (Final)

Carrying forward AC-R15-01 through AC-R15-16 from the prior investigation, unmodified, plus:

- **AC-R15-17**: A `SeatingAssignmentResource` INSERT/UPDATE that would create a genuine time-overlap on the same `tableId` or `seatId` is rejected by the PostgreSQL `EXCLUDE` constraint even when application-level locking is somehow bypassed (a direct, testable claim about the database schema itself, not just the ORM code path).
- **AC-R15-18**: Back-to-back assignments (`A.endTime === B.startTime`) on the same table/seat both persist successfully (Scenario D) — a permanent regression test, per explicit instruction.
- **AC-R15-19**: A Teppanyaki grill correctly hosts multiple unrelated parties' `SeatingAssignment`s simultaneously, provided their claimed `seatId`s are disjoint (Scenario E).
- **AC-R15-20**: A seat-overclaim request (more seats requested than currently free at a grill for the interval) is rejected in full — no partial seat assignment ever persists (Scenario F).
- **AC-R15-21**: An active `ResourceBlock` on a table/grill excludes it from `CanSeat` results without altering `Table`/`Seat.status` or deleting any row (Scenario I).
- **AC-R15-22**: No-Show release never automatically alters `Reservation.status` or `CapacityCommitment` state; both remain exactly as before the release unless a separate, explicit, later staff action changes them.
- **AC-R15-23**: `SeatingAssignment.status` supports exactly `Assigned | Seated | Released` — no separate Arrived state exists on this entity for R1.5 MVA.
- **AC-R15-24**: A pre-assignment (created well before the reservation's `reservationDate`) and a same-moment walk-in assignment use the identical creation code path — no code branch distinguishes "is this early."

---

## 23. Test Strategy (confirmed, extended)

Unchanged in structure from the prior investigation's §24 (pure domain / PostgreSQL repository / real-concurrency / failure-injection / authorization / API / read-model / migration-legacy layers), with the concurrency layer now required to prove all twelve scenarios (§21) against **real PostgreSQL with the actual `EXCLUDE` constraints in place** — a test asserting overlap-rejection against an in-memory fake, or against a schema that omits the constraint, is not acceptable evidence for AC-R15-17, carrying forward R1.1's own explicit standard ("SQLite is NOT acceptable as concurrency evidence") one level further: *an application-only check is not acceptable evidence for a claim about database-level structural integrity either* — the constraint itself must be exercised, including via a test that attempts to bypass application locking entirely (e.g., issuing conflicting raw INSERTs directly) to prove the database, not just the ORM code path, is what actually prevents the violation.

---

## 24. Migration / Legacy Field Impact

**Decision #19.** No migration is performed by this architecture-only gate. Recorded for the future implementation gate:

- `Reservation.tableAssignment` (raw staff-typed string) — superseded by `SeatingAssignment`/`SeatingAssignmentResource`. Historical rows keep their existing value untouched (append-only posture, R1.1/R1.4 precedent); new reservations stop being expected to populate it once the real mechanism exists. Not deleted from the schema in this gate.
- `Reservation.arrivedAt` — superseded by `SeatingAssignment.seatedAt`/`status = Seated` (§14). Same non-destructive treatment.
- `Reservation.preferredArea` — **unchanged, remains authoritative as a guest preference** (`R48`). Nothing about the new model touches or supersedes this field; `CAP-D04.01`'s seating decision is informed by it (as a preference, per §11) but never overwrites it.
- No existing `Reservation` row needs backfilling for the new model to function — every legacy reservation simply has zero `SeatingAssignment`s until one is created going forward, which is already the valid, R24-sanctioned default state for *any* reservation, old or new.

---

## 25. Risks and Remaining Unknowns

| # | Finding | Class |
|---|---|---|
| 1 | **Sushi: 60 commercial capacity vs. 47 nominal physical seats — a 13-guest gap at full booking.** Not an architecture defect (CanAccept/CanSeat are correctly independent), but a real operational fact never previously visible. **New owner question**: is this gap an accepted, intentional buffer (extra chairs, non-table consumption, etc.), or should the 60-figure eventually be reconciled once real floorplan data is loaded? | **P1** — major operational-visibility risk, not a P0 (does not block MVA, since `CanSeat` stays advisory) |
| 2 | **Teppanyaki: 24-person preferred block vs. 20 physical seats at the described two-grill pairing — found by this gate, not owner-flagged.** **New owner question**, high priority: clarify whether supplemental seating exists at that block, or whether "24" is approximate, or whether it needs correction. | **P1**, arguably the most important single finding in this report given it was not previously known to exist |
| 3 | Whether No-Show should eventually release `CapacityCommitment` is unresolved (§15) — deliberately left open rather than invented. | **P2** — a real future decision, not urgent (MVA behavior is safe either way: capacity simply stays committed until someone acts) |
| 4 | The `btree_gist` extension has not previously been used anywhere in this codebase — a genuinely new (if standard) PostgreSQL dependency, requiring `CREATE EXTENSION` privilege at deploy time (already available to the local dev role per R1.4's own recorded local setup, but a new fact for any future production hosting decision). | **P2** |
| 5 | `supportsSharedSeating = false` for all Sushi tables is an inference from absence of evidence (owner never described Sushi-table sharing), not an explicit owner confirmation — if wrong, it is a one-flag change with no structural rework, but flagged as an assumption boundary rather than a confirmed fact. | **P3** |
| 6 | Registry status fields (`delivery_status: Designed` for CAP-D03/CAP-D04, §3 of the prior investigation) remain uncorrected — unchanged risk, unaffected by this gate's owner input, still a documentation-accuracy gap only. | **P2**, unchanged classification |

---

## 26. MVA Boundary (Final)

**R1.5 MVA REQUIRED** — unchanged in shape from the prior investigation, now fully de-risked by owner confirmation, plus the corrected integrity mechanism:

`Table` (with `supportsSharedSeating`)/`Seat`, `SeatingAssignment`/`SeatingAssignmentResource` with interval snapshots, the two PostgreSQL `EXCLUDE` constraints (§19 — now MVA-required, not deferred), the three-tier lock model (§18), `ResourceBlock` (§9), the single collapsed `Seated` status (§14), No-Show release restricted to `SeatingAssignment` only (§15), Walk-in via Model C (§13), pre-assignment as the default creation path used early (§12), the Floor Read Model surfacing free/unassigned resources (§9's visibility mechanism).

**GUESTPLAN REPLACEMENT REQUIRED**: real owner-confirmed floorplan data actually loaded (47 Sushi tables, 4 Teppanyaki grills × 10 seats, entered as real rows); resolution of the two new numeric findings (§25 #1/#2) to whatever extent the owner decides they matter operationally; `CanSeat` authoritative/blocking-status decision (still open, §11, unchanged from the prior investigation); HTTP/UI pilot-readiness pass.

**POST-REPLACEMENT**: `CAP-D03.04` Table Combination Management as a named/pre-vetted registry (still correctly deferred, §7); any future split of the collapsed `Seated` status back into separate Arrival/Seated concepts, if evidence ever requires it (§14); guest self-service table selection beyond the "quiet day" preference-capture already scoped as advisory.

---

## 27. Replacement Boundary

Unchanged from §23 of the prior investigation — R1.5 closes the floor/seating replacement blocker specifically; it does not by itself close guest-facing booking replacement, external reservation channels, production hosting, or the remaining CAP-D01.01 HTTP-level pilot-readiness items already noted as open in R1.1's own README.

---

## 28. Final Architecture Recommendation

```
PHYSICAL MODEL:
One Table entity (CAP-D03.03), reused for both Sushi tables and Teppanyaki
grills via a supportsSharedSeating flag; Seat rows only where that flag is
true (today: the 4 Teppanyaki grills, 10 seats each).

SUSHI:  18 tables (7x2 + 6x4 + 1x5 + 4x1) = 47 nominal seats.
        Commercial ceiling (CAP-D02.03) stays 60 — gap flagged, not
        reconciled (§25 #1).

TEPPANYAKI: 4 grills x 10 seats = 40, matching the existing capacity pool
        at the whole-service level. Preferred 24-person two-grill block
        exceeds the 20 physical seats two grills hold — flagged, not
        reconciled (§25 #2), the most important open finding in this gate.

SEATING MODEL:
SeatingAssignment + SeatingAssignmentResource (polymorphic tableId/seatId,
interval-snapshotted) — one mechanism for single-table, combined-table,
single-seat, multi-seat, and multi-grill assignment.

CAPACITY/SEATING BOUNDARY:
CanAccept (CAP-D02.03) and CanSeat (CAP-D04.01) remain fully independent,
reaffirmed rather than merged, and reaffirmed further by the Sushi 47-vs-60
finding itself. CanSeat stays advisory through R1.5 MVA.

CONCURRENCY MODEL:
Three-tier advisory lock order (reservation -> capacity -> seating-resource),
extending R1.1's proven, documented, deadlock-free mechanism by one tier.

POSTGRESQL INTEGRITY MODEL:
Two range EXCLUDE constraints (btree_gist), one for tableId-scoped claims,
one for seatId-scoped claims, both scoped to Assigned/Seated status only --
NOT a plain partial unique index, which cannot represent legitimate
non-overlapping resource reuse. Now MVA-required, not deferred.

OPERATIONAL STATUS:
One collapsed status on SeatingAssignment (Assigned | Seated | Released),
per explicit owner instruction -- supersedes Reservation.arrivedAt's
pragmatic placeholder role without touching ReservationAggregate.

WALK-IN / PRE-ASSIGNMENT:
Unchanged from the prior investigation -- ordinary Reservation,
sourceCategory = WalkIn, same SeatingAssignment mechanism used at any
point in time (pre-assignment is simply "used early").

NO-SHOW:
Staff-confirmed only, never automatic; releases SeatingAssignment only by
default; Reservation lifecycle and CapacityCommitment release both left
as open, explicitly-flagged future owner decisions, not invented here.

MVA:
See §26 -- unchanged in shape from the prior investigation, now fully
de-risked by owner confirmation and corrected on the integrity mechanism.

IMPLEMENTATION READINESS:
READY, with two new flagged numeric findings that do not block MVA
(CanSeat stays advisory) but should be put back to the owner before or
during implementation, not silently carried forward unresolved forever.

CONFIDENCE:
HIGH on the architecture itself -- every mechanism either directly reuses
a proven R1.1 pattern or is a small, well-justified, precisely-argued
extension of one (especially the EXCLUDE-constraint correction, which
this gate is confident is now actually correct, not merely asserted).
MEDIUM on the two flagged numeric findings' eventual resolution, because
that resolution is entirely the owner's to make.
```

---

## 29. Implementation Gate

```
R1.5 ARCHITECTURE:
READY

OWNER INPUT:
INCOMPLETE (2 new items, §25 #1/#2) -- NOT BLOCKING, both are
advisory/visibility-scoped under the CanSeat-stays-advisory decision (§11)

IMPLEMENTATION:
AUTHORIZED TO REQUEST
```

**"Authorized to request" is not implementation authority** — per explicit instruction, this gate does not begin, scope-lock, or schedule implementation. If a Chief Engineer implementation instruction follows, the recommended scope for that NEXT assignment (not started here) is:

1. `Table`/`Seat`/`ResourceBlock` Prisma models + the two `btree_gist` `EXCLUDE` constraints (hand-written migration SQL, matching R1.1's existing precedent for constraints Prisma cannot declare).
2. `SeatingAssignment`/`SeatingAssignmentResource` Prisma models.
3. Domain layer: `CanSeat`/`SeatabilityOutcome` as a pure, unit-testable function mirroring `AvailabilityEvaluator.ts`'s own existing shape.
4. `SeatingOrchestrator` (naming to match `AvailabilityOrchestrator`), extending create/modify/cancel with the Tier-3 lock and the seating write, inside the same shared transaction.
5. Real-PostgreSQL concurrency tests proving all twelve scenarios (§21), including a direct raw-SQL bypass test proving the `EXCLUDE` constraints themselves (not just the ORM path) reject overlap.
6. No HTTP/API/UI work in that first slice unless explicitly requested alongside it.

---

## 30. Evidence Appendix

- Repository baseline: `git branch --show-current`, `git log -1`, `git status --porcelain=v1` (§2).
- Owner-confirmed figures re-verified arithmetically, independently, not merely copied: Sushi 7×2+6×4+1×5+4×1 = 14+24+5+4 = 47; Teppanyaki 4×10 = 40; the 24-person/2-grill/20-seat discrepancy computed directly from the owner's own two statements (§1/§8/§25, the central new finding of this gate).
- `Reservation.arrivedAt`/`tableAssignment`/`preferredArea` field comments, `prisma/schema.prisma` (§14/§24, re-cited from the prior investigation, re-verified against the collapsed-status decision).
- `CAP-D01.01-R24`/`R30`/`R47`/`R48`, `capabilities/active/CAP-D01.01-reservation-management/rule-model.md` (§11/§14/§15, re-cited and re-tested against every new owner rule, none found to conflict).
- `domain/availability/AvailabilityEvaluator.ts`, `AvailabilityResult.ts`, `application/availability/AvailabilityOrchestrator.ts`, `domain/availability/LockKey.ts` — the exact locking/transaction mechanism extended in §18/§20 (re-read in full during the prior investigation; re-applied here without re-reading, no evidence changed).
- `capabilities/capability-registry.yaml.md` — `CAP-D02.03`, `CAP-D03.01`–`.04`, `CAP-D04.01`–`.05` entries (§17, re-cited).
- `solutions/strategy/product-principles.md` PRP-014/PRP-020 (§7's "no combination engine" and §19's "two constraints rather than one generic resource id" reasoning, both re-applying the same principle already cited in the prior investigation).
- PostgreSQL `EXCLUDE`/`btree_gist`/`tsrange` semantics (§19) — standard, documented PostgreSQL behavior; the `[)` default bound of `tsrange(start, end)` and the `WITH &&`/`WITH =` combination are exact, verifiable claims about the database engine already in use (PostgreSQL 17, per R1.4's own local environment evidence), not assumed.

---

**STOP CONDITION REACHED.** Final architecture gate complete. No CAP-D03/CAP-D04 code was implemented. No Prisma migration was created. No API was modified. No pilot UI was modified. No package was installed. No commit was made. No push occurred. No Guestplan or konnichiwa.nl change occurred. Awaiting a new, explicit Chief Engineer instruction before any implementation begins.
