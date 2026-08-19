# R1.5 — Floor, Table & Seating Management: Architecture Investigation

**Mode: INVESTIGATION + ARCHITECTURE PROPOSAL ONLY.** No production code, Prisma schema, migration, package, API, or pilot UI was modified. No package was installed. No commit was made. No push occurred. No Guestplan or konnichiwa.nl change occurred.

**Program:** Guestplan Replacement
**Previous gates:** R1.1 Availability & Capacity — PASS · R1.2 Identity & Access — PASS · R1.3 Guest Contact / CAP-D05.01 — PASS · R1.4 Operational Resilience — PASS

---

## 1. Executive Summary

Konnichiwa Reservations today has **zero physical-seating awareness**. `CAP-D02.03` (Availability Management, R1.1) answers exactly one question — *"is there room in this headcount pool at this time?"* — using a pure numeric simultaneous-occupancy algorithm against two hardcoded pools (`Sushi`: 60/90min, `Teppanyaki`: 40/150min). It has no concept of a table, a seat, or a floorplan, and by explicit design (`CAP-D01.01-R47`) it is not supposed to. The `Reservation` model carries exactly three unowned, pragmatic placeholder fields that anticipate this gap — `preferredArea` (a guest *preference*, explicitly "never a seating guarantee"), `tableAssignment` (a raw staff-typed string note, explicitly "not an owned Seating Assignment guarantee"), and `arrivedAt` (a staff-toggled timestamp explicitly "outside the scope of this capability's formal rule model"). All three comments, independently and consistently, point at the same not-yet-built capability.

That capability already has an identity: the authoritative capability registry (`capabilities/capability-registry.yaml.md`, version 1.0.0, status `Active`) fully specifies **CAP-D03 (Spatial Planning: CAP-D03.01–.04)** and **CAP-D04 (Seating Operations: CAP-D04.01–.05)**, all marked `mvp: true` except Table Combination Management (`CAP-D03.04`, `Deferred`). **This investigation found zero engineering artifacts for any of them** — no `capabilities/active/CAP-D03...`/`CAP-D04...` folder exists, unlike CAP-D01.01 and CAP-D05.01, which both have full `capability.md`/`rule-model.md`/etc. sets. The registry says `delivery_status: Designed` for capabilities that have, in fact, never been designed at the engineering-artifact level. This is reported as a registry/reality contradiction (§3), not silently corrected.

A second, load-bearing registry finding: `CAP-D02.03`'s own registry entry describes its purpose as determining "whether **seating resources and** reservation capacity are operationally available," and lists `CAP-D03.03` (Table and Seat Management) and `CAP-D04.01`/`.02` among its dependencies. **The actual R1.1 implementation never built that integration** — `AvailabilityEvaluator.ts`/`AvailabilityOrchestrator.ts` are entirely table/seat-unaware, and `AvailabilityOutcome` (the R1.1 result type) has no seatability-related variant. The registry's *intended* design and the *shipped* implementation have already diverged. This report does not resolve that divergence by rewriting either document — it recommends **keeping them separate capabilities with a defined boundary** (§11), which is both the smaller change and consistent with `PRP-020` ("Product Simplicity Is an Architectural Requirement" — introduce new concepts only when existing ones cannot represent the requirement correctly).

The recommended physical model is a **Hybrid Table+Seat model** (§8) — ordinary Sushi service is table-based, Teppanyaki is individually-seated around shared stations — which is exactly what `CAP-D03.03`'s own registry entry already anticipates (it owns both "Table" and "Seat" as distinct concepts, plus an explicit "shared-seating eligibility" rule). The recommended seating-conflict mechanism (§10) extends R1.1's own proven pattern — a reservation-scoped `pg_advisory_xact_lock` acquired first, then resource-scoped locks in a deterministic sorted order, inside the same shared transaction — rather than inventing a new concurrency-control mechanism.

**This investigation cannot answer the physical questions no document in this repository answers**: how many Sushi tables exist, their individual capacities, whether they combine, how many Teppanyaki stations there are and how seats divide among them, and several related operational policies. **Fourteen questions are marked `OWNER INPUT REQUIRED`** (§28) — this report does not guess a floorplan from the number 60.

---

## 2. Repository Baseline

| Item | Value |
|---|---|
| Repository | `HELIX` (`C:\Users\kelvin\HELIX`) |
| Branch | `feat/ec-002-visibility-baseline` — **matches expected** |
| HEAD | `92f56374180ddaa82228a2204f33be1e6aad0257` — **matches the expected R1.4 commit `92f5637`** (`feat(reservations): add operational recovery safeguards`) |
| Staged files | None |
| Untracked files | `solutions/reservations/implementation/R1_3_GUEST_CONTACT_ARCHITECTURE_INVESTIGATION.md` — pre-existing, intentionally-uncommitted architecture-investigation artifact from R1.3, unchanged by this investigation |
| Working-tree status | Clean except the one pre-existing untracked file above |

No drift from the expected baseline. No pull, merge, rebase, or push was performed to produce this table. Investigation proceeds without a STOP.

---

## 3. Existing Capability Architecture

Two capability documents exist and **materially disagree with each other**, not just with the implementation:

| | `capability-map.md` | `capability-registry.yaml.md` |
|---|---|---|
| `artifact_id` | `CAP-MAP-001` | `CAP-REG-001` |
| `version` / `status` | `0.1.0` / **`Draft`** | `1.0.0` / **`Active`** |
| ID scheme for CAP-D01 members | `CAP-D01.01` (dotted) *and* `CAP-002`/`CAP-003`/`CAP-004` (flat) — **inconsistent within the same table** | `CAP-D01.01`–`CAP-D01.04` — dotted throughout, consistent |
| `authoritative_for` declaration | none | explicit: "capability identity, ownership, classification, dependencies, delivery status, operational maturity, MVP scope" |

**Finding, reported rather than resolved**: `capability-map.md` is a stale, internally-inconsistent draft (mixing two different ID schemes for the same domain) that predates the registry's dotted-ID convention used everywhere else in this codebase (`CAP-D02.03`, `CAP-D05.01`, etc.). `capability-registry.yaml.md` explicitly declares itself authoritative and is the document every other artifact in this repository (`schema.prisma` comments, `rule-model.md` files, implementation reports) actually cites. **This report treats `capability-registry.yaml.md` as authoritative and does not use any `capability-map.md`-only identifier.** No registry edit was made — per the assignment's explicit instruction not to silently correct it.

### CAP-D03 — Spatial Planning (registry-authoritative)

| ID | Name | `delivery_status` | `mvp` | Owns |
|---|---|---|---|---|
| CAP-D03.01 | Restaurant Area Management | Designed | true | Restaurant Area, Area Type, Area Status |
| CAP-D03.02 | Floorplan Management | Designed | true | Floorplan, Floorplan Version, Floorplan Status |
| CAP-D03.03 | Table and Seat Management | Designed | true | Table, Seat, Table Type, Seating Resource Status |
| CAP-D03.04 | Table Combination Management | **Deferred** | **false** | Table Combination, Combination Capacity |

### CAP-D04 — Seating Operations (registry-authoritative)

| ID | Name | `delivery_status` | `mvp` | Owns |
|---|---|---|---|---|
| CAP-D04.01 | Seating Assignment | Designed | true | Seating Assignment, Assignment Resource, Assignment Status, Assignment Source |
| CAP-D04.02 | Assignment Conflict Management | Designed | true | Assignment Conflict, Conflict Type, Conflict Severity, Conflict Override |
| CAP-D04.03 | Guest Arrival Management | Designed | true | Arrival Status, Arrival Timestamp, No-show Status |
| CAP-D04.04 | Live Service Management | Designed | true | Operational Reservation State, Service Operational View, Seating State |
| CAP-D04.05 | Table Release and Turn Management | Designed | true | Table Turn, Resource Release, Completion Timestamp |

Also directly relevant: **CAP-D01.04 — Walk-in and Waitlist Management** (`Scoped`, `mvp: partial` — included scope explicitly limited to *manual walk-in creation*; managed waitlist, wait-time estimation, and automated sequencing are explicitly excluded from MVP).

**Finding**: every one of these nine capabilities is `delivery_status: Designed` in the registry, but **none has an engineering folder** under `capabilities/active/` (only `CAP-D01.01-reservation-management/` and `CAP-D05.01-reservation-contact-management/` exist — confirmed by direct directory listing). "Designed" in this registry's own `delivery_statuses` enum sits between "Scoped" and "In Development" — it should mean a `capability.md`/`rule-model.md`/`state-model.md`/`event-model.md`/`interaction-model.md`/`acceptance.md` set exists, the same artifact shape CAP-D01.01 has. **None of that exists for CAP-D03/CAP-D04.** This is reported as a stale registry status, not corrected — R1.5's own deliverable (this document) is the first real design work toward closing that gap, and a Chief Engineer decision on whether/how to update `delivery_status` values is a registry-governance action outside this investigation's authority ("Changes to capability identity, ownership, domain placement, or MVP scope require architectural review" — the registry's own `change_control` rule).

**Dependency graph, as registered** (not as implemented):

```
CAP-D02.02 (Service Period) ──depends on──> CAP-D03.02 (Floorplan)
CAP-D02.03 (Availability)   ──depends on──> CAP-D03.03 (Table/Seat), CAP-D04.01, CAP-D04.02
CAP-D03.03 (Table/Seat)     ──depends on──> CAP-D03.01 (Area), CAP-D03.02 (Floorplan)
CAP-D04.01 (Seating Assign) ──depends on──> CAP-D01.01, CAP-D02.02, CAP-D02.03, CAP-D03.03, CAP-D04.02
CAP-D04.02 (Conflict Mgmt)  ──depends on──> CAP-D02.03, CAP-D03.03
CAP-D04.03 (Arrival)        ──depends on──> CAP-D01.01, CAP-D01.04
CAP-D04.04 (Live Service)   ──depends on──> CAP-D02.02, CAP-D04.01, CAP-D04.03, CAP-D05.02
CAP-D04.05 (Release/Turn)   ──depends on──> CAP-D04.01, CAP-D04.04
```

**Finding (the load-bearing one)**: `CAP-D02.03 depends_on CAP-D03.03` is registered, but §4 below shows the actual R1.1 implementation has no such dependency — it was built entirely independently of any table/seat concept, and correctly so given the evidence available at R1.1 time (no floorplan capability existed to depend on). This is the single most important registry-vs-implementation gap this investigation found, and §11 addresses it directly as an architecture decision rather than assuming the registry's original dependency should now be built to match.

---

## 4. Current Reservation/Capacity Integration

Direct evidence from the implementation, all previously verified by earlier gates and re-confirmed here:

- **`prisma/schema.prisma`, `Reservation` model** — three fields exist that anticipate, but do not implement, seating:
  - `preferredArea String?` — comment: *"CAP-D01.01-R48: a guest preference (Sushi / Teppanyaki), never a seating guarantee — Warning severity, so it stays nullable."*
  - `tableAssignment String?` — comment: *"CAP-D01.01-R48: manual, staff-entered table note (e.g. \"C1\"). Not an owned Seating Assignment guarantee — see the rule comments."*
  - `arrivedAt DateTime?` — comment: *"Operational arrival marker, staff-toggled during service. Outside the scope of this capability's formal rule model (no Rxx) — like tableAssignment, it's a pragmatic staff-facing field, not a modeled check-in/Seating Management capability."*
- **`domain/rules/ArchitecturalInvariants.ts`** documents `CAP-D01.01-R47`/`R48` as enforced "by omission": *"the aggregate has no capacity, pacing, or availability field"* (R47) and *"the aggregate has no table/seat identifier field — that identity is owned by Seating Assignment"* (R48, emphasis on the exact claim).
  - **Finding, reported precisely**: the R48 claim ("no table/seat identifier field") is **not literally true** — `tableAssignment` exists as a field on the same `Reservation` model. Both documents agree in *spirit* (the field is explicitly a non-authoritative staff note, never a Seating Assignment guarantee, per both the schema comment and R48 itself), so this is not a behavioral bug — but `ArchitecturalInvariants.ts`'s literal factual claim is inaccurate given the schema as it stands, and should be corrected to say the field exists but is deliberately non-authoritative, rather than that no such field exists. Reported, not silently fixed (out of this investigation's mode).
- **`capabilities/active/CAP-D01.01-reservation-management/rule-model.md`** — three rules directly define the boundary R1.5 must respect:
  - **R24 — "Confirmation Does Not Guarantee Seating"** (Critical, `override_allowed: false`): confirmation means the reservation is "operationally valid"; it does **not** by itself mean a table or seat has been assigned, a preferred area is guaranteed, external sync happened, or a message was sent — *"Those outcomes belong to other capabilities."*
  - **R47 — "Reservation Acceptance Is Separate from Availability"** (Critical): *"Reservation Management shall not independently determine operational availability. Availability Management owns the decision... Reservation Management may create a Proposed reservation before an availability decision when supported by policy."* — this is the exact precedent §11 below extends to seating.
  - **R48 — "Preferred Area Is a Preference"** (Warning): a preferred area "shall be treated as a guest preference unless another capability explicitly guarantees it" — the "another capability" is `CAP-D04.01` (Seating Assignment).
  - **R30 — "Completion Requires Operational Evidence"** (from §11, Completion Rules): evidence may originate from *"Live Service Management; Guest Arrival Management; Table Release and Turn; an authorized staff decision"* — CAP-D04.04/.03/.05 are already named, by ID-adjacent name, as legitimate **evidence sources** feeding CAP-D01.01's own completion decision, never as things that complete a reservation themselves.
- **`domain/availability/AvailabilityEvaluator.ts`** — the R1.1 simultaneous-occupancy algorithm operates purely on `CommitmentInterval { startTime, endTime, partySize, commitmentId }` summed per 15-minute slice against a pool's `maximumCapacity`. No table, seat, or resource identifier appears anywhere in this file.
- **`domain/availability/AvailabilityResult.ts`** — `AvailabilityOutcome` is `AVAILABLE | CAPACITY_EXHAUSTED | CLOSED | NO_SERVICE_PERIOD | AREA_UNAVAILABLE | INVALID_REQUEST | CONFIGURATION_ERROR | OUTSIDE_OPERATING_WINDOW`. **No variant represents "capacity is fine but no physical seat fits."**
- **`application/availability/AvailabilityOrchestrator.ts`** — the full locking/transaction pattern R1.5 must extend, not replace (verbatim mechanism, §13):
  1. A reservation-scoped `pg_advisory_xact_lock` (`RESERVATION_LOCK_NAMESPACE`, `"HALR"`) is acquired **first**, before any capacity lock, on every Modify/Cancel.
  2. Capacity-pool locks (`CAPACITY_LOCK_NAMESPACE`, `"HALX"`) are acquired afterward, in a deterministic sort order (`sortLockResources`, sorted by `capacityPoolId` then `localServiceDate`) when more than one is needed.
  3. Everything happens inside one `TransactionManager.runInTransaction` call, shared with the CAP-D01.01 write.
  4. This exact order is documented as proven deadlock-free (`R1_1_CONCURRENT_MODIFY_FIX_REPORT.md`) specifically *because* every caller that needs both locks takes them in the same fixed order.
- **`domain/availability/CapacityPool.ts`** — `CAPACITY_POOLS` (Sushi 60/90min, Teppanyaki 40/150min) is static TypeScript, explicitly commented *"Promote to a real, persisted CapacityPool only when a concrete need to change these values without a code change actually exists (`product-principles.md` PRP-014, PRP-020)."* — direct precedent for judging whether Table/Seat needs to be a real table now (§8).

---

## 5. Physical Resource Models Evaluated

### Model A — Table only

Simplest possible model. Sufficient if every Sushi table seats a fixed, uniform party range and Teppanyaki can be represented the same way. **Rejected as the sole model**: the assignment's own Teppanyaki investigation (§6 below) makes clear that shared stations with individually-meaningful seats are plausible and cannot be safely assumed away — a Table-only model cannot represent "two unrelated parties sharing one Teppan table with different seats," if that is confirmed as a real operational pattern (`OWNER INPUT REQUIRED`, §28).

### Model B — Table + Seat

`Table { id, area, capacity }`, `Seat { id, tableId, seatNumber, status }`. Correct in principle, but forcing ordinary Sushi table seating through an explicit per-seat model when tables there are plausibly assigned as a whole unit adds bookkeeping with no demonstrated operational benefit (`PRP-020`).

### Model C — generic Seating Resource abstraction (`Resource { id, type, area, capacity, parentResourceId }`)

Most "sophisticated" — flexible enough to represent tables, seats, stations, or areas uniformly via a self-referencing parent. **Rejected for R1.5 MVA**: no evidence in this repository or the owner's confirmed requirements justifies a generalized resource-abstraction layer today (`PRP-014` — "Shared Platform Services Must Be Earned... A capability should move into the shared HELIX Platform when reuse has been demonstrated," applied here by analogy: don't generalize before two concrete cases exist that need it). `CAP-D03.03`'s own registry entry names `Table` and `Seat` as two distinct, concrete concepts — not a single generic abstraction — which is independent, existing evidence against Model C.

### Model D — Hybrid: Table-based for Sushi, individually-seated for Teppanyaki

**Recommended** (§8). Directly matches `CAP-D03.03`'s registry-declared ownership of *both* `Table` and `Seat` as first-class, distinct concepts, plus its explicit `"shared-seating eligibility"` rule — a rule that only makes sense if some resources (Teppanyaki stations) support multiple, independently-trackable occupants while others (ordinary Sushi tables) do not. This is not a new invention; it is the smallest model that satisfies what the registry already committed to and what real restaurant operations plausibly require, without generalizing further than evidenced (Model C) or under-modeling Teppanyaki (Model A).

---

## 6. Teppanyaki Seating Model

**Known, confirmed**: 40 max simultaneous guests, 150-minute standard duration, an independent capacity pool from Sushi (R1.1, owner-confirmed, unchanged by this investigation).

**Unknown, and not inferable from "40"** — every one of these is `OWNER INPUT REQUIRED` (consolidated in §28, individually flagged here):

- Are the 40 seats divided among multiple physical Teppan stations/tables, and if so, how many stations and how many seats each? **OWNER INPUT REQUIRED.**
- Can unrelated parties share one Teppan table (the common real-world Teppanyaki pattern — strangers seated around one grill)? **OWNER INPUT REQUIRED.** This single answer determines whether `CAP-D03.03`'s "shared-seating eligibility" rule is exercised at all for Teppanyaki.
- Can a single party be split across two Teppan units? **OWNER INPUT REQUIRED** — if no, this becomes a hard modeling constraint (a `SeatingAssignment` for one reservation may never span two different Teppan stations); if yes, the multi-resource assignment capability the registry already anticipates (`CAP-D04.01` "multi-resource assignment" rule) is exercised for Teppanyaki specifically.
- Are specific seats around a Teppan station individually meaningful (e.g., a seat directly in front of the chef vs. at the end)? **OWNER INPUT REQUIRED.**
- Are there unusable or staff-preferred seats at any station? **OWNER INPUT REQUIRED.**
- Does chef/station availability constrain a Teppan table independently of its physical seat count (e.g., only 3 of 4 stations staffed on a slow night)? **OWNER INPUT REQUIRED** — if yes, this is exactly what `CAP-D02.03`'s already-registered `Resource Block` concept (§4, §19) is for: a station can be temporarily blocked without deleting or reconfiguring it.
- May staff intentionally leave seats empty between parties at a shared station (e.g., not seating a walk-in pair next to an existing party even though physical capacity allows it)? **OWNER INPUT REQUIRED** — this is a staff-judgment operational policy, not a system constraint; the architecture must **allow** intentional under-occupancy, never force maximum packing.
- May a 2-person reservation be placed at a station already hosting an unrelated party, versus requiring a fresh/empty station? **OWNER INPUT REQUIRED**, directly dependent on the sharing-rules answer above.

**Architecture consequence, not owner-dependent**: whatever the answers, the Teppanyaki model must be able to represent **N stations, each with M individually-trackable seats**, where a `SeatingAssignment` may claim a subset of a station's seats (not necessarily all of them) — this is a structural requirement of the Hybrid model (§5/§8) regardless of how the owner answers the sharing questions, since even a "no sharing" policy is a business rule layered on top of a seat-capable structure, not a reason to model Teppanyaki as headcount-only.

---

## 7. Sushi Seating Model

**Known**: 60 max simultaneous guests, 90-minute standard duration.

**Unknown, not inferable from "60"** — all `OWNER INPUT REQUIRED` (§28):

- Number of Sushi tables.
- Capacity (seats) per table, and whether uniform or varied.
- Whether a Sushi counter (bar-style individual seats) exists as a distinct sub-area, separate from tables.
- Which tables, if any, are combinable, and the maximum combined size (directly feeds §9).
- Whether any other seating area exists (private room, terrace, etc.) — the registry's `CAP-D03.01` (Restaurant Area Management) anticipates multiple named areas beyond just "Sushi"/"Teppanyaki," but none beyond those two is evidenced anywhere in this repository.
- Whether a reservation may ever span multiple (non-combined) tables.
- Whether counter/table seating is guest-selectable (a preference guests can request) or purely staff-assigned.

**Architecture consequence**: the Hybrid model's Table side must support **capacity varying per table** (not a single uniform table size) and an optional **combinability relationship** between specific tables (§9) — both structural requirements independent of the owner's specific numbers.

---

## 8. Table/Seat Resource Model Recommendation

**Recommended: Model D (Hybrid), realized as two related entities**, matching `CAP-D03.03`'s registry ownership exactly:

```
Table
  id              — stable, immutable identity (never reused, see §20)
  areaId          — CAP-D03.01 Restaurant Area reference (Sushi | Teppanyaki | future areas)
  name            — e.g. "T4", human-facing
  capacity        — max party size this table alone seats
  status          — Active | Inactive (§19)
  supportsSharedSeating — boolean; true only where OWNER INPUT REQUIRED answers confirm
                          unrelated-party sharing is real (Teppanyaki stations, per §6)

Seat  (created only for tables where supportsSharedSeating = true — i.e. Teppanyaki
       stations under the current evidence; NOT created for ordinary Sushi tables,
       which are assigned as a whole unit, per §7's "staff-assigned as a table" default
       absent owner evidence otherwise)
  id
  tableId
  seatNumber
  status          — Active | Inactive
```

**This is not "every table has seats" (Model B) applied uniformly** — it is the Hybrid split the assignment's own §6 framing anticipated: ordinary Sushi tables are the assignable unit; Teppanyaki stations are `Table` rows too (for area/capacity/status bookkeeping) but additionally decompose into individually-trackable `Seat` rows *specifically because* `supportsSharedSeating` is plausible there and evidenced nowhere for Sushi. If owner answers (§28) establish Sushi also needs seat-level tracking (e.g., a real bar counter with individually-bookable stools), the same `Seat` structure already accommodates it — no schema redesign, only additional rows and a `supportsSharedSeating = true` flip on the relevant Sushi tables.

**`CapacityPool` remains untouched** (§4's `CapacityPool.ts` precedent — "promote to persisted only when a concrete need exists" — still applies; `Table.areaId` and the existing static `CapacityPoolId` are two independent concepts that happen to share the same two current values, Sushi/Teppanyaki, and must not be merged into one table, since capacity-pool identity is R1.1's business and table/seat identity is CAP-D03's).

---

## 9. Table Combinations

Three models evaluated, per the assignment's own framing:

| | Static predefined | Dynamic arbitrary | No combination engine |
|---|---|---|---|
| Implementation complexity | Medium (a `TableCombination` registry table) | High (adjacency graph, validation) | **Lowest** |
| Operational usefulness | Matches typical fixed-furniture restaurants | Matches flexible/movable furniture | Sufficient if combining is rare/staff-supervised |
| Correctness | High — every valid combo pre-vetted | Requires runtime adjacency+capacity validation logic that doesn't yet exist anywhere in this codebase | High — humans decide, system only prevents double-booking the underlying tables |
| Auditability | Clean — combination is a named, stable thing | Harder — an ad hoc combination has no prior identity | Clean — audit trail is just "these N tables were jointly assigned to this reservation" |
| Guestplan-replacement need | Not evidenced as required | Not evidenced as required | Sufficient — nothing about replacing Guestplan requires an optimization/adjacency engine |

**Recommendation: defer Table Combination Management (`CAP-D03.04`) entirely, exactly as the registry already marks it** (`delivery_status: Deferred`, `mvp: false`) — this investigation found no evidence contradicting that existing registry classification. For R1.5 MVA, the smallest correct mechanism is **"no combination engine"**: `CAP-D04.01`'s own registry-owned rule "multi-resource assignment" already covers the real operational need — staff select multiple existing `Table` rows for one `SeatingAssignment`, and `CAP-D04.02`'s conflict engine (§10) prevents any one of those tables from being double-assigned, exactly the same way it would for a single-table assignment. No `TableCombination` entity, no adjacency graph, no combined-capacity pre-registration is built. This is the PRP-020 "simplest design that correctly supports the real operational requirement" answer, and it does not block a future `CAP-D03.04` slice from adding named, pre-vetted combinations as a pure enhancement layered on top (no rework required — a future `TableCombination` row would just become a convenient shortcut for selecting a set of tables that `CAP-D04.01` already knows how to assign together).

---

## 10. Seating Assignment Model

Recommended shape, directly matching `CAP-D04.01`'s registry-owned concepts (`Seating Assignment`, `Assignment Resource`, `Assignment Status`, `Assignment Source`):

```
SeatingAssignment
  assignmentId
  reservationId        — nullable? NO — see Walk-In model (§16); every SeatingAssignment
                          references a Reservation, including a same-day walk-in Reservation
  status                — Assigned | Seated | Released  (Assignment Status; distinct from
                          Reservation.status and from Arrival state, §13)
  assignedAt
  assignedBy            — StaffUser id (R1.2 Actor, §21)
  releasedAt            — nullable
  source                — Staff | GuestSelfService | System  (Assignment Source; matches the
                          registry's own concept; today only Staff is realistic — self-service
                          table selection is not evidenced anywhere as required)

SeatingAssignmentResource   (one row per Table or Seat claimed by an assignment — the
                              "multi-resource assignment" rule, and the mechanism that makes
                              §9's "no combination engine" decision work structurally)
  assignmentId
  tableId               — nullable
  seatId                — nullable  (exactly one of tableId/seatId set per row — a table-level
                          claim for ordinary Sushi tables, a seat-level claim for Teppanyaki)
```

**Cardinality, per the assignment's own explicit instruction to preserve "a reservation may exist/possibly be confirmed without a seating assignment"**:

- **Zero assignments**: the default and required state for a newly Proposed/Confirmed reservation — `CAP-D01.01-R24` already establishes this exactly ("confirmation does not guarantee seating"). **Table assignment must never become mandatory for reservation creation or confirmation** — this investigation found no evidence justifying such a change, and R24's `override_allowed: false` makes it a hard architectural constraint, not a policy this investigation could relax even if it wanted to.
- **One assignment**: the common case — one table (or one Teppanyaki seat-set) for the reservation's duration.
- **Multiple assignments over time**: a reservation may accumulate a *history* of assignments (moved to a different table, §14) — but at most **one `Assigned`/`Seated` (non-`Released`) `SeatingAssignment` per reservation at any instant**, mirroring R1.1's own "one Committed `CapacityCommitment` per reservation" structural invariant (§10 below extends this exact pattern to a new partial-unique-index).
- **Multiple resources per one assignment**: yes, via `SeatingAssignmentResource` — covers both a combined-tables case (§9) and a multi-seat Teppanyaki case (§6) with one mechanism.

---

## 11. Seating Conflict Invariant

### The authoritative conflict rule

No two **not-`Released`** `SeatingAssignmentResource` rows may reference the same `tableId` (or the same `seatId`) with **overlapping time windows**. Time windows are **derived from the owning `SeatingAssignment`'s reservation's occupied interval** (start = `reservationDate`, end = `reservationDate + duration`), the same interval shape R1.1 already computes for capacity purposes — not a second, independently-entered time range.

### `CanAccept` vs. `CanSeat` — explicitly not the same question

- **`CanAccept`** (CAP-D02.03, R1.1, unchanged): *"does admitting this party keep the pool's simultaneous headcount at or under 60/40?"* A pure numeric question, answered today, correctly, without any table/seat knowledge.
- **`CanSeat`** (CAP-D04.01/.02, this investigation's proposal): *"is there a specific table (or Teppanyaki seat-set) with sufficient capacity, in the right area, free for the whole requested interval?"* A structural/combinatorial question that `CanAccept` cannot answer and should not be asked to answer — the assignment's own §12 example (`AVAILABLE` from R1.1 while the physical seats are too fragmented to seat a party of 8) is exactly the scenario R1.1's headcount-only algorithm is structurally incapable of detecting, correctly, by design (`R47`).

**These must remain two separate questions answered by two separate capabilities** — collapsing them (e.g., extending `AvailabilityOutcome` with a `NO_VALID_TABLE_ASSIGNMENT` variant, as the assignment's own example phrases it) would violate `R47`'s own stated principle *and* the registry's ownership-non-duplication rule ("Capabilities shall not duplicate ownership" — capability-map.md's own Architectural Principle 4, one place both draft documents actually agree). **Recommendation**: a distinct `SeatabilityOutcome` type, owned by `CAP-D04.01`, structurally parallel to but never merged with `AvailabilityOutcome`.

### Transaction boundary, locking strategy — extends, does not replace, R1.1's mechanism

Directly reusing `AvailabilityOrchestrator`'s proven global lock order (§4), extended with a third tier:

```
1. Reservation-scoped lock          (existing — RESERVATION_LOCK_NAMESPACE, "HALR")
2. Capacity pool/date lock(s)       (existing — CAPACITY_LOCK_NAMESPACE, "HALX", sortLockResources)
3. Seating-resource lock(s)  [NEW]  — a new namespace (e.g. "HALS" — Helix seAting Lock),
                                      one advisory-lock key per distinct tableId/seatId touched,
                                      acquired in a deterministic sort order (extend
                                      sortLockResources's pattern to tableId/seatId) — same
                                      reasoning as the existing function's own deadlock-freedom
                                      argument: a fixed global order across ALL lock tiers means
                                      no two operations can ever form a wait-cycle.
```

All three tiers acquired inside the **same shared PostgreSQL transaction** already used for Reservation+Capacity writes (§4) — a `SeatingAssignment` write joins that transaction rather than opening a second one, preserving the existing "one shared transaction" architectural invariant the assignment explicitly says must not be violated.

### PostgreSQL exclusion constraints — evaluated, not recommended for MVA

A `EXCLUDE USING gist (tableId WITH =, tsrange(startTime, endTime) WITH &&)` constraint would provide database-level defense in depth against overlapping assignments, structurally similar to R1.1's hand-written partial-unique-index pattern (`capacity_commitments_one_committed_per_reservation`). **Recommended as a genuine future defense-in-depth layer, not required for R1.5 MVA**: it requires the `btree_gist` extension (not currently enabled anywhere in this codebase — a new, evidenced infrastructure dependency, which R1.4's own principles (avoid unevidenced infrastructure) argue against introducing speculatively) and, more importantly, the advisory-lock-based transaction mechanism above already makes an overlap *structurally difficult, not merely detectable afterward* (the assignment's own §17 requirement) — a second, hand-written `CHECK`-adjacent partial unique index (§20/R1.1 precedent: `staff_users_one_owner`, `capacity_commitments_one_committed_per_reservation`) on `(tableId/seatId, status) WHERE status IN ('Assigned','Seated')`-shaped uniqueness is achievable with ordinary B-tree indexes and no new extension — this is the recommended defense-in-depth mechanism, not `EXCLUDE`/`gist`.

### Modifications and cancellation

- **Modification** (table move, time change): follows the exact `modifyWithCapacity` pattern (§4) — reservation lock first, re-read the authoritative current `SeatingAssignment` *inside* the transaction (never trust a pre-transaction snapshot, per R1.1's own P0 lesson), supersede the old `SeatingAssignmentResource` row(s) (status → `Released`), create new ones, all before commit.
- **Cancellation**: releasing the reservation releases its active `SeatingAssignment` (status → `Released`) in the same transaction as the `CapacityCommitment` release and the `Reservation` cancellation — one shared transaction, three related writes, exactly mirroring how `cancelWithCapacity` already handles the Reservation+CapacityCommitment pair today.

---

## 12. Capacity vs. Seating Boundary

| Question | Classification | Answer |
|---|---|---|
| Can staff create/confirm a reservation without assigning a table? | **Existing evidence** | Yes — `CAP-D01.01-R24`, `override_allowed: false`. Not a new decision; already a hard invariant. |
| Should self-service booking eventually require both `CanAccept` AND `CanSeat`? | **OWNER INPUT REQUIRED** | Guest-facing booking today (`ApprovedGuestChannel`) only ever checks `CanAccept` (R1.1). Requiring `CanSeat` too would mean the self-service channel could reject a request the pool has room for, because no single table/seat-set fits — a real, guest-visible behavior change with no evidence yet of owner intent either way. |
| Is seatability advisory during shadow operation, or authoritative? | **Architecture decision** | **Advisory during shadow operation** (R1.5 MVA and until an explicit later gate) — staff see a `SeatabilityOutcome` as information/warning, but nothing in `CAP-D01.01`/`CAP-D02.03` blocks on it. This directly follows `R24`/`R47`'s own established pattern (capacity is a separate, non-blocking-at-creation-time decision too, until `AvailabilityOrchestrator` was built to make it load-bearing for capacity specifically) and does not risk regressing the already-proven R1.1 accept path. |
| At what gate does seatability become authoritative (i.e., blocks reservation creation/confirmation the way `CanAccept` already does)? | **OWNER INPUT REQUIRED**, informed by an architecture recommendation | Recommended: not before Guestplan replacement itself is authorized (§23) — matching how `CanAccept` only became blocking once `AvailabilityOrchestrator` was purpose-built and gated through its own R1.1 assignment, not bundled into CAP-D01.01's original creation path. |

---

## 13. Operational Reservation States

The assignment lists: Expected, Arrived, Seated, Completed, NoShow, Late, WalkIn. Classified against the five options (A–E) using direct registry/rule-model evidence, not assumption:

| Concept | Classification | Evidence |
|---|---|---|
| Expected | **D — derived** | Not a stored state anywhere; derivable from `Reservation.status = Confirmed` and current time vs. `reservationDate`. No capability needs to own it as stored state. |
| Arrived / Late / NoShow | **B — Seating/Floor operational state**, owned by `CAP-D04.03` (Guest Arrival Management) | Registry: `CAP-D04.03` owns exactly `Arrival Status`, `Arrival Timestamp`, `No-show Status`. `Reservation.arrivedAt` (§4) is the current *pragmatic, unowned* placeholder for exactly this — explicitly "outside the scope of this capability's formal rule model." R1.5 should retire that field's authority in favor of a real `CAP-D04.03` model, not add more ad hoc fields to `Reservation`. |
| Seated | **B — Seating/Floor operational state**, owned by `CAP-D04.04` (Live Service Management) | Registry: `CAP-D04.04` owns `Operational Reservation State` and `Seating State` explicitly, separate from `CAP-D01.01`'s own `Reservation Lifecycle`. |
| WalkIn | **A/C combination** — see §16 dedicated analysis | Registry: `CAP-D01.04` owns `Walk-in` as a Reservation-Demand concept (not a floor concept) — a walk-in IS a `Reservation` (with `sourceCategory` distinguishing it), not a separate aggregate. |
| Completed | **A — Reservation lifecycle**, unchanged | Already `CAP-D01.01`'s own terminal `ReservationStatus.Completed` (`state-model.md`, unchanged by this investigation). `CAP-D04.04`/`.03`/`.05` provide *evidence* toward this transition (`R30`) but never own or trigger it themselves. |

**Do not add states to `ReservationAggregate`.** Every one of Arrived/Seated/NoShow/Late belongs to CAP-D04.x's own, separate operational-state model — exactly what the registry already committed to (`CAP-D04.04` owning a distinct `Operational Reservation State` "separate from `ReservationDomainEvent`... even when consumed elsewhere," language directly echoed in `SecurityEvent`'s own R1.2 precedent for keeping non-reservation-domain events in their own model). This is the clearest, most direct answer this investigation found to the assignment's own instruction to "distinguish reservation lifecycle from physical guest-presence/floor state" — the registry had already decided this, before R1.5 was ever assigned.

---

## 14. Modification Semantics

For each scenario, which capability owns which concern (capacity / reservation / seating / audit / conflict prevention):

| # | Scenario | Capacity | Reservation | Seating | Audit | Conflict prevention |
|---|---|---|---|---|---|---|
| 1 | Moved to another table | unaffected | unaffected | **CAP-D04.01** updates `SeatingAssignmentResource` | `SeatingChanged` event | **CAP-D04.02**, new table's lock |
| 2 | Moved to another time | **CAP-D02.03** re-evaluates (existing `modifyWithCapacity`) | `reservationDate` updated | **CAP-D04.02** must re-check the SAME table stays free at the NEW time — a capacity-clear move can still be a seating conflict | Both `ReservationTimeChanged` and `SeatingChanged` if the table also had to move | Both tiers of locking (§11), same transaction |
| 3 | Party size increases | **CAP-D02.03** re-evaluates headcount | `partySize` updated | **CAP-D04.02** must re-check the current table/seats still fit the new size — `CanAccept` passing does not imply `CanSeat` still holds | `ReservationPartySizeChanged` | Seating-resource lock re-acquired even if the table itself doesn't change, because the FIT decision changes |
| 4 | Party size decreases | Same evaluation, always succeeds capacity-wise | `partySize` updated | No forced seating change — an over-sized table remains valid, per §6's explicit "staff may intentionally leave seats empty" principle | `ReservationPartySizeChanged` | None needed — decreasing never creates a new conflict |
| 5 | Sushi → Teppanyaki | **CAP-D02.03**: old pool commitment Superseded, new pool commitment Created (existing `modifyWithCapacity` cross-pool path, already proven, R1.1) | `preferredArea` updated | **CAP-D04.01**: old `SeatingAssignmentResource` Released, new one created against a Teppan resource — an entirely new seatability question, not a continuation | Both `AreaPreferenceChanged` and `SeatingChanged` | Full re-run of §11's conflict check against the new area |
| 6 | Teppanyaki → Sushi | Symmetric to #5 | Symmetric | Symmetric | Symmetric | Symmetric |
| 7 | Assigned table becomes unavailable (e.g., a `ResourceBlock`, §19, is entered for a table with an active future assignment) | unaffected | unaffected | **CAP-D04.01/.02** must surface this as an unresolved conflict requiring staff re-assignment — never silently auto-reassign | `AssignmentConflictDetected` | This is exactly the scenario the registry's `Assignment Conflict` concept exists for |
| 8 | Walk-in occupies a resource expected to be needed shortly | **CAP-D02.03** for the walk-in's own headcount | New walk-in `Reservation` created (§16) | **CAP-D04.02** must detect the conflict against the *upcoming* reservation's assignment if one already exists, or flag the risk if the upcoming reservation is unassigned | `AssignmentConflictDetected` or a risk surfaced via read-model only (§18) if no formal assignment exists yet to conflict with | The structural invariant (§11) only prevents formal double-*assignment* — an unassigned upcoming reservation and a walk-in are not structurally prevented from converging on the same table; this is an **operational risk to surface, not a system-level block**, since forcing staff to pre-assign every reservation to prevent this would violate R24 |
| 9 | Cancellation | **CAP-D02.03** releases commitment (existing) | `status → Cancelled` | **CAP-D04.01** releases `SeatingAssignment` in the same transaction | `SeatingReleased` | N/A — release never conflicts |
| 10 | No-show | unaffected unless staff also cancels | Reservation stays as-is unless explicitly transitioned (no auto-cancel evidenced or recommended) | **CAP-D04.03** records `GuestMarkedNoShow`; **CAP-D04.01** assignment may be manually released by staff to free the table | `GuestMarkedNoShow`, optionally `SeatingReleased` | Staff-driven, not automatic |
| 11 | Late arrival | unaffected | unaffected | **CAP-D04.03** records `GuestMarkedLate` | `GuestMarkedLate` | N/A |
| 12 | Staff manually moves a seated party | unaffected (capacity pool/headcount unchanged) | unaffected | **CAP-D04.01** — identical mechanism to #1, regardless of whether the party is merely `Assigned` or already `Seated` | `SeatingChanged` | Same as #1 |

**Concurrency note carried through every row**: none of these introduce a NEW class of stale-snapshot risk beyond what §11 already addresses — every capacity-relevant row (#2, #3, #5, #6) reuses R1.1's exact in-transaction-re-read discipline; every seating-relevant row reuses the new seating-resource-lock tier from §11. No scenario here requires re-deriving R1.1's already-fixed Concurrent-Modify-vs-Modify defect from scratch.

---

## 15. Cancellation Semantics

Covered inline in §14, row 9. Summarized: cancellation is a single shared transaction that (a) transitions `Reservation.status → Cancelled` (`CAP-D01.01`, unchanged), (b) releases the active `CapacityCommitment` (`CAP-D02.03`, unchanged, existing `cancelWithCapacity`), and (c) releases the active `SeatingAssignment` and its `SeatingAssignmentResource` rows (`CAP-D04.01`, new). All three joins the existing reservation-scoped-lock-first pattern (§11). No new cancellation *rule* is proposed — `CAP-D01.01-R25`("Proposed or Confirmed Reservations May Be Cancelled") governs eligibility unchanged; R1.5 only adds a third resource-release side effect to an already-existing transaction shape.

---

## 16. Walk-In Model

Four models evaluated against R1.3 Contact requirements, audit requirements, R1.1 capacity commitments, seating assignments, operational speed, reporting, and future Guestplan migration:

| | A — normal Reservation | B — separate Visit/WalkIn object | C — same-day Reservation, `sourceCategory = WalkIn` | D — floor assignment without any Reservation |
|---|---|---|---|---|
| Contact requirement (R1.3) | Full `CAP-D05.01-R01` (name + phone-or-email) applies — could be too heavy for a fast walk-in | Would need its own, separate, lighter contact rule — **duplicates** `CAP-D05.01`'s ownership, violating the registry's own non-duplication principle | Same underlying `Contact` requirement as A, but see recommendation below for how to keep it fast | None — but then R1.3/audit/reporting has nothing to attach to |
| Audit / capacity / reporting | Full, automatic — reuses everything | Needs its own parallel audit/capacity/reporting path | Full, automatic — reuses everything | None automatically — a floor-only object outside `CAP-D01.01`'s lifecycle has no capacity commitment, no audit trail, nothing CAP-D08 (Timeline/Dashboard) can see |
| Operational speed | Same as any staff-created reservation — already fast (`ApprovedGuestChannel`/staff paths both exist) | New, extra machinery | Same as A | Fastest to seat, but creates a second, parallel "thing that occupies a table" the entire rest of this architecture doesn't know about — directly re-introduces the exact kind of untracked state R1.4 exists to eliminate |
| Guestplan migration | Clean — walk-ins are just reservations | New export/mapping surface | Clean | Would need its own future migration path |
| **`CAP-D01.04` registry alignment** | Partially — registry frames Walk-in as its own concept, not literally "any Reservation" | Closest textual match, but registry's MVP scope is explicitly narrow ("manual walk-in creation" only — no separate object complexity) | **Best fit** — `sourceCategory`/`ReservationSourceCategory.WalkIn` (`domain/value-objects/ReservationSource.ts`, already exists as an enum value — confirmed in R1.4's own investigation) already gives walk-ins a distinct, queryable identity within the *same* Reservation model, with zero new capability surface | Not evidenced as required by the registry's own `mvp: partial` scoping |

**Recommendation: Model C**, with one deliberate speed accommodation: a walk-in's `Contact` may be created with the *minimum* CAP-D05.01-R01 requirement (name + phone-or-email, exactly as already enforced — no relaxation of that rule) but the **seating assignment happens immediately, in the same staff action**, ahead of any formal `Confirmed` transition if speed demands it — `CAP-D01.01-R24` already permits a `Proposed` reservation to exist without seating *or* (by the same non-mandatory logic) to be seated while still `Proposed`, since R24 only says confirmation doesn't *guarantee* seating — it never says seating requires confirmation first. **A walk-in should not require a heavier guest-data workflow than a phone booking already does** (the assignment's own instruction) — Model C delivers exactly that, using machinery that already exists, while never bypassing R1.1 capacity integrity (`AvailabilityOrchestrator.createWithCapacity` already runs for every `Reservation`, walk-in or not).

**Model D (floor assignment with no Reservation) is explicitly rejected**, not merely deferred — it would create untracked physical occupancy invisible to capacity, audit, and reporting simultaneously, directly contrary to every preserved guarantee from R1.1–R1.4.

---

## 17. Arrival / Seating / No-Show Model

Fully addressed in §13's classification table. Summary of ownership: `CAP-D04.03` (Guest Arrival Management) owns Arrived/Late/NoShow as its own operational-state model, timestamped and attributable (R1.2 Actor); `CAP-D04.04` (Live Service Management) owns the "currently Seated" operational view, distinct from both Arrival state and Reservation lifecycle. Neither writes to `ReservationAggregate`. `Reservation.arrivedAt`'s current pragmatic role is superseded by `CAP-D04.03`'s real model when built — this investigation recommends that supersession as the eventual direction, not an action to take now (out of scope — investigation only).

---

## 18. Floor Read Model

Per the assignment's explicit instruction: **domain data vs. presentation are kept separate.** No UI is designed here — only the read model's *content*.

**Authoritative domain data** (each field's owning capability in parentheses):

- Reservation id, guest name, party size, `reservationDate`, `status` (CAP-D01.01)
- `preferredArea` (CAP-D01.01, as a preference — R48)
- `SeatingAssignment` id, status, assigned table/seat(s) (CAP-D04.01)
- Arrival status, arrival timestamp (CAP-D04.03)
- Seated state (CAP-D04.04)
- Allergy/critical note (CAP-D05.02)
- Contact possible-match warning, if relevant (CAP-D05.01, unchanged R1.3 behavior)
- Table/seat identity, area, capacity, current `Active`/`Inactive`/blocked status (CAP-D03.03, CAP-D02.03's `ResourceBlock`)

**Derived/presentation-only** (computed for the floor screen, never stored as domain state):

- "Current time" vs. reservation time (comparison, computed at render/query time)
- Duration/expected end time (derived from `reservationDate` + the pool's `durationMinutes`, already how R1.1 computes occupied intervals — no new stored field)
- "Next reservation for this resource" (a query against `SeatingAssignment`/`Reservation`, not a stored pointer)
- Conflict warnings (CAP-D04.02's detection surfaced for display; the *detection* is domain logic, the *warning banner* is presentation)
- Any color-coding, layout position, or visual state

**Recommendation**: a dedicated read-model/query service (consistent with `CAP-D08.03` Service Dashboard's own registry-declared pattern — "Present the current operational condition... in one actionable view," explicitly listed dependencies spanning CAP-D01.01/CAP-D02.02/CAP-D04.01/.03/.04/.05/CAP-D05.02/CAP-D08.01) rather than a UI-owned aggregation — the Floor View is architecturally the same *kind* of thing as the already-registered Service Dashboard, scoped to one service period's physical layout instead of its summary metrics. This investigation recommends the Floor View be recognized as effectively a specialization of `CAP-D08.03`'s existing registered scope rather than inventing a new, tenth capability domain — a registry-governance recommendation, not a decision this investigation is authorized to make.

---

## 19. Resource Blocking / Inactive Resources

The registry **already anticipates this exact need**, under `CAP-D02.03` (not under `CAP-D03.03`, worth noting as a deliberate existing ownership choice): `Resource Block` is a registered concept with `ResourceBlocked`/`ResourceUnblocked`/`AvailabilityEvaluated` events. This investigation recommends the assignment's proposed shape, aligned to that existing registered concept rather than inventing a competing one:

```
ResourceBlock            (CAP-D02.03-owned, per the existing registry entry)
  resourceId              — a Table or Seat id (CAP-D03.03 identity, referenced not owned)
  startTime / endTime
  reason                  — free text (broken chair, private event, maintenance, etc.)
  actor                   — StaffUser id
```

`Table`/`Seat.status` (`Active`/`Inactive`) is a **separate, longer-lived** concept from a `ResourceBlock` (a temporary, time-bounded exclusion) — the assignment's own three-way split (`Active`/`Inactive`/`TemporarilyUnavailable`) collapses cleanly onto exactly two mechanisms: **permanent-ish** `status` toggling (owned by `CAP-D03.03`) for genuinely retired/not-yet-in-service resources, and **time-bounded** `ResourceBlock` rows (owned by `CAP-D02.03`, per the existing registry) for everything temporary. No third state is needed.

**MVA classification**: `Table`/`Seat.status` (binary Active/Inactive) is **R1.5 MVA required** — a floor cannot be operated at all if a broken table can never be marked unavailable. `ResourceBlock` with a reason/time-window is **also MVA required** (directly named in the registry as part of `CAP-D02.03`'s own MVP-scoped delivery, `mvp: true`) — but a *rich* reason taxonomy, recurring blocks, or block-scheduling UI are **Post-Replacement**.

---

## 20. Historical Correctness

**Recommendation: immutable IDs + assignment snapshots, mirroring the exact pattern R1.3/CAP-D05.01 already established for `Reservation.contactName`/`contactPhoneSnapshot`/`contactEmailSnapshot`.**

A `Reservation`'s historical `SeatingAssignment` should snapshot enough about the table at assignment time (e.g., table name/area, captured at `assignedAt`) that a later table rename/deactivation does not retroactively make old history unreadable — the exact reasoning `schema.prisma`'s own `Reservation.contactName` comment already gives ("reservation-time NAME snapshot... never re-validated against the Contact on modify"). `Table`/`Seat` rows should be **soft-deleted** (`status: Inactive`, never a hard `DELETE`) for the same reason R1.1/R1.4 never hard-delete `Reservation`/`ReservationEvent`/`CapacityCommitment` rows — append-only history is already this codebase's consistent posture (`CAP-D01.01-R04`, `ReservationEvent`'s own doc comment: "rows are only ever inserted, never updated or deleted"). A renamed table keeps its `id`; the *name* history lives in the snapshot on each historical `SeatingAssignment`, not by trying to reconstruct it from the current `Table` row. This requires no new mechanism — it is the same snapshot pattern already proven in production by CAP-D05.01, applied to a new field set.

---

## 21. Identity / Authorization / Audit Integration

**No second staff identity model** — every `SeatingAssignment.assignedBy`, `ResourceBlock.actor`, arrival-marking actor, etc. is an existing R1.2 `StaffUser`/`Actor`, exactly as `CAP-D01.01-R50` ("Confirmation Requires Authority... attributable") already requires for reservation confirmation. `CAP-D04.02`'s registered "authorized override" rule for conflict overrides should reuse the existing `AuthorizationRules.ts`/`Permission` model (R1.2), not a parallel one — a new `Permission` value (e.g., `SeatingAssignmentManage`) is the correct minimal extension, not a new authorization subsystem.

**Audit**: every `SeatingAssignment`/`ResourceBlock`/arrival event should append to the *existing* `CAP-D08.01` Reservation Timeline mechanism (`TimelineEventAppended`, already registered as depending only on `CAP-D01.01` today but architecturally general enough to accept CAP-D04.x-originated events too) rather than inventing a second, parallel event log — directly matching `CAP-D08.02`'s (Operational Audit) own registered purpose ("accountable inspection of meaningful changes... across capabilities").

---

## 22. MVA Boundary

### R1.5 MVA REQUIRED

- `Table`/`Seat` model (Hybrid, §8), `Active`/`Inactive` status only.
- `SeatingAssignment`/`SeatingAssignmentResource` (§10), staff-assigned only (no guest self-selection — not evidenced as needed).
- Seating conflict prevention (§11): reservation-lock-first + resource-lock-tier extension of the existing transaction pattern, plus a hand-written partial-unique-index (no `EXCLUDE`/`gist`).
- `CanSeat` as an advisory-only `SeatabilityOutcome` (§12) — never blocking, at this gate.
- `CAP-D04.03` (Arrival/Late/NoShow) as its own operational-state model, replacing `Reservation.arrivedAt`'s pragmatic role.
- Walk-in via Model C (§16) — no new capability surface, reuses everything.
- `ResourceBlock` (§19), basic reason/time-window only.
- Floor read model (§18) as a query/read service, no new domain state.
- Historical snapshotting (§20) on every `SeatingAssignment`.

### GUESTPLAN REPLACEMENT REQUIRED

- Owner-confirmed physical floorplan (§28) actually entered as real `Table`/`Seat` data — MVA can ship the *mechanism* with zero rows; replacing Guestplan requires the *real* floorplan loaded.
- `CanSeat` becoming authoritative/blocking (§12) — gated by an explicit future case-owner decision, not this investigation.
- Full HTTP/UI-level pilot-readiness pass for floor operations (mirroring what R1.1's own README already calls out as still-open for Confirm/Modify/Cancel/Complete at the HTTP layer).
- A real, drilled restore/integrity story (R1.4) extended to cover the new tables — no new backup mechanism is needed (R1.4's `pg_dump` already captures every table in the database), but the R1.4 integrity checker (`ops/integrity/verifyIntegrity.ts`) should gain seating-specific checks before this is genuinely replacement-ready.

### POST-REPLACEMENT

- `CAP-D03.04` Table Combination Management (§9) — stays deferred, exactly as already registered.
- PostgreSQL `EXCLUDE`/`gist` defense-in-depth layer (§11) — genuine future hardening, not required now.
- Guest self-service table/seat preference selection.
- `CAP-D09.01` Seating Recommendation (already `Deferred` in the registry) and any other CAP-D09 intelligence layered on top of the floor model.
- Rich `ResourceBlock` reason taxonomy, recurring blocks, scheduling UI.
- Managed waitlist / wait-time estimation (already explicitly excluded from `CAP-D01.04`'s own MVP scope).

---

## 23. Acceptance Criteria (Proposal)

- **AC-R15-01**: No two non-`Released` `SeatingAssignmentResource` rows may reference the same `tableId` with overlapping occupied intervals.
- **AC-R15-02**: No two non-`Released` `SeatingAssignmentResource` rows may reference the same `seatId` with overlapping occupied intervals.
- **AC-R15-03**: Back-to-back assignments on the same table (end of A = start of B) are permitted (half-open interval semantics, matching `intervalsOverlap`'s existing R1.1 definition exactly).
- **AC-R15-04**: A multi-table `SeatingAssignment` (§9's "no combination engine" mechanism) is rejected in full if *any* one of its requested tables conflicts — no partial assignment.
- **AC-R15-05**: Cancelling a reservation releases its `SeatingAssignment` and all `SeatingAssignmentResource` rows in the same transaction as the reservation/capacity release.
- **AC-R15-06**: Moving a reservation to a new table correctly releases the old resource and claims the new one, atomically — no window where both or neither are held.
- **AC-R15-07**: A cross-area move (Sushi → Teppanyaki or reverse) correctly transitions both the `CapacityCommitment` (existing R1.1 mechanism) and the `SeatingAssignment` in one transaction.
- **AC-R15-08**: Two concurrent staff attempts to assign different reservations to the same table — exactly one succeeds, the other receives a clear conflict result, never a silent overwrite (Scenario A, §24).
- **AC-R15-09**: A walk-in reservation can be created and immediately seated without requiring more guest information than `CAP-D05.01-R01` already mandates.
- **AC-R15-10**: A renamed or deactivated `Table` does not corrupt or hide the historical record of a past `SeatingAssignment` that referenced it (§20).
- **AC-R15-11**: An `Inactive` table or a table under an active `ResourceBlock` cannot receive a new `SeatingAssignment`.
- **AC-R15-12**: Every `SeatingAssignment`/`ResourceBlock`-mutating action requires an authenticated, authorized `StaffUser` (R1.2) and is attributable.
- **AC-R15-13**: Every seating mutation appends a Timeline event (CAP-D08.01), attributed to the acting Actor.
- **AC-R15-14**: R1.1's own capacity invariants (60/40, 15-minute grid, general-overlap test, one Committed `CapacityCommitment` per reservation) remain unmodified and continue to pass their existing test suite unchanged.
- **AC-R15-15 (concurrency)**: Scenario B (§24) — moving Reservation A to T5 while Reservation B is concurrently being assigned to T5 — resolves deterministically, with the losing operation receiving a clear, retryable conflict outcome, never a database-level exception surfacing raw to a caller.
- **AC-R15-16 (concurrency)**: Scenario C (§24) — a Cancel racing a seating assignment on the same reservation resolves via the existing reservation-scoped lock (§11), exactly as R1.1 already guarantees for Cancel-vs-Modify.

---

## 24. Test Strategy (Design Only — No Tests Written)

| Layer | Scope | Real PostgreSQL required? |
|---|---|---|
| Pure domain tests | `SeatabilityOutcome` derivation, conflict-detection logic as a pure function (mirroring `AvailabilityEvaluator.ts`'s own "pure function, no I/O" pattern, §4) | No |
| PostgreSQL repository tests | `SeatingAssignment`/`SeatingAssignmentResource`/`ResourceBlock` CRUD, partial-unique-index behavior | Yes |
| **Real concurrency tests** | All six assignment scenarios below, each run with genuinely simultaneous transactions (`Promise.all` against two separate `PrismaClient` connections — the exact pattern `tests/integration/availability-concurrency.test.ts` already establishes) | **Yes — mandatory, no substitute.** Carrying forward R1.1's own explicit standard: *"SQLite is NOT acceptable as concurrency evidence"* — restated here for seating: an in-memory repository is not sufficient evidence for any lock-ordering or conflict-prevention claim in this document. |
| Transaction/failure-injection tests | A seating write fails mid-transaction after a capacity write already happened — full rollback proven, mirroring `tests/integration/availability-failure-injection.test.ts`'s existing two mandatory scenarios | Yes |
| Authorization tests | Non-authorized actor cannot mutate seating state; attribution is always recorded | Yes (integration level, reusing R1.2's existing test harness patterns) |
| API tests | Once endpoints exist (a later, implementation gate — not R1.5) | Yes |
| Floor read-model tests | Correct domain/presentation separation; correct derivation of "current," "next," "conflict warning" fields | Mixed — derivation logic can be pure-function tested; full read-model assembly needs real data |
| Migration/legacy tests | Pre-CAP-D03/D04 reservations (created before any `Table`/`Seat` existed) must not be treated as broken by any new integrity check — directly extends R1.4's own `ops/integrity/verifyIntegrity.ts` cutover-date pattern (the `CAP_D05_01_CUTOVER` constant already established there for exactly this kind of "pre-capability legacy row" problem) | Yes |

**Concurrency scenarios to prove** (§25 below expands the race/lock analysis; this row lists what must become an executable test): two-staff-same-table race; move-vs-assign race; cancel-vs-assign race; modify-time-vs-table-assignment race; cross-area-move-vs-concurrent-edit race; walk-in-vs-upcoming-reservation race.

---

## 25. Concurrency Analysis

| Scenario | Race | Required lock/resource | Lock order | Interaction with R1.1 locks | Structural (constraint) or detection-only? |
|---|---|---|---|---|---|
| **A** — two staff assign different reservations to the same table simultaneously | Both transactions want the same table lock | Seating-resource lock (new, §11 tier 3) | Whichever acquires the table-lock key first proceeds; the other waits, then re-reads inside its own transaction and correctly finds the table taken | Independent of reservation-scoped locks (different reservations) — pure tier-3 contention | **Structural** — the partial unique index (§11) makes this impossible even if the lock discipline were somehow bypassed |
| **B** — Reservation A moved to T5 while Reservation B is concurrently assigned to T5 | Same table, two different reservations, one a move (needs old+new resource) one a fresh assign | Reservation-A's lock (tier 1) + T5's lock (tier 3) for the move; Reservation-B's lock (tier 1) + T5's lock (tier 3) for the assign | Both take their OWN reservation lock first (different reservations, no contention there), then race on T5's tier-3 lock — same resolution as Scenario A once both reach tier 3 | Directly parallels R1.1's own cross-pool Modify-vs-Modify fix (`R1_1_CONCURRENT_MODIFY_FIX_REPORT.md`) — same shape, one tier lower | **Structural**, same reasoning as A |
| **C** — Cancel vs. seating assignment (same reservation) | Cancel wants to release; a concurrent assign/move wants to claim/change | Reservation-scoped lock (tier 1) | Both must acquire the SAME reservation's tier-1 lock first — whichever wins serializes the other entirely, exactly as R1.1 already guarantees for Cancel-vs-Modify today | **Directly reuses the existing R1.1 lock**, no new mechanism needed for this specific pairing | Structural (already proven, R1.1) |
| **D** — Modify reservation time vs. table assignment | A time-change (capacity-relevant) and a seating move on the same reservation | Tier 1 (reservation) always first, THEN tier 2 (capacity) and tier 3 (seating) both, in `sortLockResources`-style deterministic order among themselves | Reservation lock serializes the two operations entirely before either reaches tier 2/3 — no possible interleaving | Same reservation-lock-first principle, extended | Structural |
| **E** — cross-area move while another user edits the same reservation | A Sushi→Teppanyaki move (touches both old and new capacity pools AND old and new seating resources) racing a concurrent edit (e.g., party-size change) on the same reservation | Tier 1 first (both operations, same reservation) → tier 2 (both old+new pool, sorted) → tier 3 (both old+new table/seat, sorted) | Tier 1 alone fully serializes these two operations — by the time either reaches tier 2/3, the other has already committed or fully rolled back | Directly extends R1.1's existing cross-pool Modify path (already handles "old pool + new pool" sorted locking) by adding a parallel "old resource + new resource" sorted step at tier 3 | Structural |
| **F** — walk-in assigned to a table while another staff member assigns an upcoming reservation (different reservations, potentially the same or different tables) | If different tables: no race at all. If the same table: identical shape to Scenario A/B — two different reservations contending for one table | Tier 3 (seating-resource lock), no tier-1 contention (different reservations) | Same as A/B | No R1.1 precedent needed — same mechanism as A | Structural if same table targeted; not a conflict at all if different tables (correctly falls through to §14 row 8's "risk to surface" case, not a hard block, when the upcoming reservation had no assignment yet to conflict with) |

**Every scenario resolves structurally** (the partial unique index plus the deterministic lock order make the violation impossible to persist, not merely detectable after the fact) — satisfying the assignment's explicit requirement that "architecture must make integrity violations structurally difficult, not merely detectable afterward." No scenario requires inventing a concurrency-control mechanism beyond extending R1.1's own three-tier pattern to a third tier.

---

## 26. Risks

| # | Risk | Class |
|---|---|---|
| 1 | Fourteen physical-floorplan facts are unknown and un-guessable (§6/§7/§28) — no seating capability can be correctly built without them | **P0** (replacement blocker — not integrity/security, but a hard "cannot proceed to implementation" blocker) |
| 2 | `CAP-D03`/`CAP-D04` have `delivery_status: Designed` in the registry with zero engineering artifacts — anyone trusting the registry's status field alone would believe design work already happened | **P1** — registry accuracy, not a code defect |
| 3 | `ArchitecturalInvariants.ts`'s literal R48 claim ("no table/seat identifier field") is factually inaccurate given `Reservation.tableAssignment`'s existence, even though the *behavioral* intent (non-authoritative) is preserved | **P2** — a documentation-accuracy gap, not a behavioral one |
| 4 | If a future implementation naively extends `AvailabilityOutcome` with seating variants instead of keeping `SeatabilityOutcome` separate, it would violate `R47`/the registry's non-duplication principle and re-couple two capabilities that are currently cleanly independent | **P1** — an architecture-erosion risk to flag now, before implementation, not a present defect |
| 5 | Without the recommended partial-unique-index (§11), seating-conflict prevention would rely on lock discipline alone — correct if every code path honors it, but with no database-level backstop the way R1.1's capacity invariants have | **P1** |
| 6 | Walk-in Model C's speed accommodation (seating before confirmation) could be misread as "seating implies confirmation" if not carefully documented at implementation time — `R24` already forbids the reverse inference, but the *forward* direction (seated-but-still-Proposed) is a genuinely new state combination no existing test exercises | **P2** |
| 7 | `CAP-D02.03`'s registered (but unimplemented) dependency on `CAP-D03.03`/`CAP-D04.01`/`.02` could tempt a future implementer to retrofit that dependency rather than keeping `CanAccept`/`CanSeat` separate (§11/§12) — an available, wrong path this report explicitly argues against | **P2** |
| 8 | Table Combination Management deferral (§9) is a repeat of an already-made registry decision, not a new risk — listed here only to confirm it was re-examined, not silently inherited | **P3** |

---

## 27. Owner Input Questionnaire

Business facts only — nothing an engineer can decide alone.

### Sushi

1. How many Sushi tables exist, and what is each one's seating capacity?
2. Does a separate Sushi counter (individually-bookable seats) exist?
3. Which tables, if any, may be combined, and what is the maximum combined party size?
4. Is table/counter seating ever guest-selectable, or always staff-assigned?

### Teppanyaki

5. How many physical Teppan stations/tables exist, and how many seats does each have?
6. May unrelated parties share one Teppan table?
7. May a single party be split across two Teppan units?
8. Are specific seats around a station meaningful (e.g., proximity to the chef)?
9. Are any seats/stations chef- or staffing-constrained independently of physical seat count?
10. May staff intentionally leave seats empty at a shared station between/among parties?

### Operations

11. At what point does a reservation become "Arrived" vs. "Seated" — are these the same moment operationally, or meaningfully separate?
12. What is the late-arrival policy (grace period, threshold before treating as at-risk)?
13. What is the No-Show timing policy (how long to wait before marking one)?
14. Do confirmed reservations ever require a physical table assignment before the day of service, or is same-day/walk-up assignment the norm?

*(Every question above is also individually flagged inline at its point of relevance in §6/§7/§12/§13/§16 — this section is the consolidated list.)*

---

## 28. Final Architecture Recommendation

```
RESOURCE MODEL:
Hybrid (Model D) — Table as the assignable unit for ordinary Sushi service,
Table+Seat for Teppanyaki stations where shared/individual-seat tracking is
plausible. Matches CAP-D03.03's own registered ownership of both concepts.

SEATING MODEL:
SeatingAssignment + SeatingAssignmentResource (one row per claimed Table or
Seat) — supports single-table, multi-table ("no combination engine," §9),
and multi-seat (Teppanyaki) assignment with one mechanism.

CAPACITY/SEATING BOUNDARY:
CanAccept (CAP-D02.03, headcount, unchanged) and CanSeat (CAP-D04.01,
physical fit, new) remain two separate, non-duplicated questions. Seatability
is advisory, not blocking, through R1.5 MVA and until an explicit future
case-owner decision authorizes otherwise.

CONCURRENCY MODEL:
Extends R1.1's proven three-tier advisory-lock pattern (reservation lock →
capacity-pool lock(s) → NEW seating-resource lock(s), all deterministically
ordered, all in one shared transaction) with a hand-written partial unique
index as a structural backstop. No new concurrency-control mechanism
invented; PostgreSQL EXCLUDE/gist evaluated and deferred to Post-Replacement.

WALK-IN MODEL:
Model C — a walk-in is an ordinary Reservation with sourceCategory = WalkIn
(the value already exists), seated immediately under R24's existing
allowance, using R1.3's existing minimum-contact rule unmodified. No new
capability surface.

TABLE COMBINATIONS:
Deferred, matching the existing registry classification (CAP-D03.04,
mvp: false) — "no combination engine" (staff pick multiple tables,
CAP-D04.02 prevents double-assignment) is the R1.5 MVA mechanism.

MVA:
Table/Seat model, SeatingAssignment + conflict prevention, advisory
CanSeat, CAP-D04.03 Arrival state, Walk-in via Model C, basic
ResourceBlock, floor read model, historical snapshotting — see §22 for
the full, challenged list.

GUESTPLAN REPLACEMENT REQUIREMENT:
Real owner-confirmed floorplan data loaded (not just the mechanism),
CanSeat authoritative-status decision, HTTP/UI pilot-readiness pass,
R1.4 integrity checker extended to seating tables.

IMPLEMENTATION READINESS:
NOT READY — 14 owner-input items (§27) are prerequisites, not
nice-to-haves; several (Teppanyaki sharing rules, Sushi table count) are
structural inputs the physical model itself depends on, not values that
can be filled in after implementation starts.

CONFIDENCE:
MEDIUM-HIGH on the architecture recommendations themselves (grounded
directly in the existing, authoritative capability registry and in R1.1's
own proven, documented concurrency mechanism — not invented from
scratch). Necessarily LOW on any specific floorplan detail, because none
exists in this repository to be found — that is not a confidence gap in
this investigation, it is the correct, honest state of the evidence.
```

---

## 29. Evidence Appendix

- **Repository baseline**: `git branch --show-current`, `git log -1 --format="%H %s"`, `git status --porcelain=v1`, `git log --oneline -6` (§2).
- **Registry authority and inconsistency**: `capabilities/capability-map.md` (`version: 0.1.0`, `status: Draft`, mixed `CAP-D01.01`/`CAP-002` ID schemes in the same table) vs. `capabilities/capability-registry.yaml.md` (`version: 1.0.0`, `status: Active`, `authoritative_for` block, consistent `CAP-DNN.NN` scheme throughout, `identifier_format: CAP-DNN.NN`) — both read in full (§3).
- **CAP-D03/CAP-D04 registry entries**: full YAML block for CAP-D03.01–.04 and CAP-D04.01–.05, `capability-registry.yaml.md` lines ~510–922 (§3).
- **No engineering artifacts for CAP-D03/CAP-D04**: `Glob("solutions/reservations/capabilities/active/**/*")` returned only `CAP-D01.01-reservation-management/` (6 files) and `CAP-D05.01-reservation-contact-management/` (1 file) — no CAP-D03/CAP-D04 folder of any kind exists.
- **`Reservation` model's three anticipatory fields**: `prisma/schema.prisma` lines 53–66, read in full, `preferredArea`/`tableAssignment`/`arrivedAt` comments quoted verbatim (§4).
- **`ArchitecturalInvariants.ts` R47/R48 claims, including the literal-accuracy finding**: full file read (§4).
- **CAP-D01.01 boundary rules R24/R30/R47/R48**: `capabilities/active/CAP-D01.01-reservation-management/rule-model.md`, read at lines 505–551 (R24), 595–633 (R30), 905–951 (R47/R48) — quoted verbatim (§4).
- **CAP-D02.03 implementation, no table/seat awareness**: `domain/availability/AvailabilityEvaluator.ts` (full file), `domain/availability/AvailabilityResult.ts` (full file) — confirmed `AvailabilityOutcome` has no seatability variant (§4, §11).
- **R1.1 locking/transaction pattern this investigation extends**: `application/availability/AvailabilityOrchestrator.ts` (full file, 484 lines) and `domain/availability/LockKey.ts` (full file) — `RESERVATION_LOCK_NAMESPACE`/`CAPACITY_LOCK_NAMESPACE` two-namespace design, `sortLockResources`'s deadlock-freedom argument, the documented global lock order (reservation-scoped first, always) (§4, §11, §25).
- **`CapacityPool.ts`'s "promote only when a concrete need exists" precedent**: `domain/availability/CapacityPool.ts` header comment, citing `product-principles.md` PRP-014/PRP-020 (§4, §8).
- **PRP-014/PRP-020, read in full**: `solutions/strategy/product-principles.md` lines 433–437 (PRP-014, "Shared Platform Services Must Be Earned") and 594–619 (PRP-020, "Product Simplicity Is an Architectural Requirement," including its explicit "Decision test") (§5, §9, §22).
- **`ReservationSourceCategory.WalkIn` already exists**: `domain/value-objects/ReservationSource.ts`, confirmed present (previously verified during R1.4's own investigation, re-confirmed here) (§16).
- **R1.1's own concurrency-evidence standard, carried forward verbatim**: *"SQLite is NOT acceptable as concurrency evidence for CAP-D02.03"* (cited previously across R1.1–R1.4 reports; restated as the binding standard for R1.5's own future test strategy, §24).

---

**STOP CONDITION REACHED.** Repository investigation, capability-registry audit, physical-resource-model evaluation, and this report are complete. No CAP-D03/CAP-D04 code was implemented. No Prisma migration was created. No API was modified. No pilot UI was modified. No package was installed. No commit was made. No push occurred. No Guestplan or konnichiwa.nl change occurred. Awaiting Chief Engineer review and owner answers to the fourteen items in §27 before implementation authorization.
