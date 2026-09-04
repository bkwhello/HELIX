# R1.5 — Floor & Seating HTTP Exposure Closure Report (P1-B1–P1-B10)

Mode: CLOSURE REPORT ONLY — consolidates work already implemented,
tested, committed, and pushed across ten separately-authorized phases. No
new production code is introduced by this document. Companion to
`R1_5_FLOOR_SEATING_ARCHITECTURE_INVESTIGATION.md` and
`R1_5_FLOOR_SEATING_FINAL_ARCHITECTURE.md` (domain design) and
`R1_5_FLOOR_SEATING_IMPLEMENTATION_REPORT.md` (domain/orchestrator layer,
predates HTTP exposure) — this report covers only the HTTP-exposure
sequence those three did not yet describe.

## Scope

CAP-D03.03 (Table and Seat Management) and CAP-D04.01 (Seating
Assignment) were designed and built at the domain/orchestrator layer in
`4c5dbca` (2026-08-19) but left almost entirely unexposed to HTTP. The
P1-B1–P1-B10 sequence below closed that gap, one small, individually
authorized, evidence-gated increment at a time.

## Phase-by-phase closure

| Phase | What shipped | Commit | Date |
|---|---|---|---|
| P1-B1 | `SeatingOrchestrator` wired into runtime composition (no new routes) | `c5864e4` | 2026-09-03 |
| P1-B2 | `POST /availability/reservations/walk-in` — authoritative immediate Walk-in creation | `602a402` | 2026-09-03 |
| P1-B3 | Pilot UI: "Walk-in nu" form | `f874ee4` | 2026-09-03 |
| P1-B4-A | `GET /reservations/:id/seating/available-resources` — authoritative availability read | `7e0bf4a` | 2026-09-03 |
| P1-B4-B | `POST /reservations/:id/seating` — authoritative immediate-seating write | `6f87fac` | 2026-09-03 |
| P1-B4-C | Pilot UI: shared seating picker ("Plaatsen") | `44e6284` | 2026-09-03 |
| P1-B4-D1 | Floor-seed target safety guard (`ops/floor/seedFloorSafety.ts`) | `b541024` | 2026-09-03 |
| P1-B4-D3 | One-time authorized dev-database floor activation (23 Tables, 40 Seats) | data operation, no commit | 2026-09-03 |
| P1-B5 | `POST /reservations/:id/seating/no-show` — staff-confirmed No-Show release | `1ecabf3` | 2026-09-03 |
| P1-B6 | `POST /reservations/:id/seating/move` — staff seating move | `70b9d29` | 2026-09-03 |
| P1-B7 | `GET /floor` — floor view + late-arrival signal ("Laat" badge) | `2400de2` | 2026-09-03 |
| P1-B8 | `POST/GET/DELETE /resource-blocks` — Resource Block management | `1257ae6` | 2026-09-03 |
| P1-B9 | `POST /reservations/:id/seating/pre-assign` + `POST /reservations/:id/seating/mark-seated`, plus the `markSeated` idempotency fix | `582e655` | 2026-09-04 |
| P1-B10 | Evidence and documentation reconciliation (this report; two new concurrency tests) | — (this phase) | 2026-09-04 |

## Shipped capability matrix

| Capability | Route | Permission | Orchestrator/service |
|---|---|---|---|
| Assign (immediate) | `POST /reservations/:id/seating` | `SeatingAssign` | `assignSeating(seatImmediately:true)` |
| Pre-assign | `POST /reservations/:id/seating/pre-assign` | `SeatingAssign` | `assignSeating(seatImmediately:false)` |
| Move | `POST /reservations/:id/seating/move` | `SeatingMove` | `moveSeating` |
| Mark-seated | `POST /reservations/:id/seating/mark-seated` | `SeatingAssign` | `markSeated` (idempotency-fixed, P1-B9) |
| No-show release | `POST /reservations/:id/seating/no-show` | `SeatingRelease` | `releaseNoShow` |
| Availability read | `GET .../available-resources` | `SeatingView` | `SeatingAvailabilityService` |
| Floor view / late-arrival | `GET /floor` | `SeatingView` | `getFloorView` (`FloorReadModel`) |
| Resource Block create/list/delete | `POST/GET/DELETE /resource-blocks` | `ResourceBlock` / `SeatingView` | `ResourceBlockService` |
| Walk-in creation | `POST /availability/reservations/walk-in` | `ReservationWalkinCreate` | `AvailabilityOrchestrator.createImmediateWalkIn` → same `assignSeating(true)` |

Every seating-domain permission (`SeatingView`, `SeatingAssign`,
`SeatingMove`, `SeatingRelease`, `ResourceBlock`) is enforced by at least
one live route. All nine routes above are behind `requireStaffSession` +
`requirePermission` and the globally-applied CSRF guard, with no
exception found.

## Accepted limitations (deliberate scope decisions — retained, not resolved by this report)

- **Resource Block deletion is a hard delete, with no audit trail** — no
  record of who removed a block or when. This mirrors the pre-existing
  Closing Days pattern and was an explicit P1-B8 Chief Engineer
  directive; no schema/migration was authorized to add one.
- **Blocking is Table-scoped only** — a block always applies to an entire
  Table (and, for a Teppanyaki grill, every Seat under it). There is no
  per-Seat blocking. Explicit P1-B8 exclusion.
- **`GET /floor` does not reflect Resource Block state** — a blocked
  table with no reservation on it produces no visible signal on the
  floor/late-arrival view. Blocks are surfaced only through their own
  dedicated list (`GET /resource-blocks`) in the pilot. Explicit P1-B8
  scope exclusion (`FloorReadModel.ts` was not modified).
- **Pilot table-selection is inconsistent across features** — the
  seating picker (assign/pre-assign/move) offers a server-driven checkbox
  list of actual available resources; Resource Blocking instead takes a
  free-text operational label, resolved server-side. Both are correct and
  tested; the UX pattern itself was never unified. Noted as a follow-up,
  not fixed by this report.

## Automated verification — what this report can and cannot claim

**Confirmed by automated evidence:**
- Full HTTP-level test coverage for all nine routes above (`tests/api/*.test.ts`).
- Pilot UI wiring proven by source-text regression tests (`tests/pilot/*.test.ts`).
- Real-PostgreSQL concurrency evidence for every claim-contention
  combination identified across the sequence, including the two gaps
  closed in this phase: pre-assign vs. pre-assign (`Scenario M`) and
  mark-seated vs. move (`Scenario M2`), both in
  `tests/integration/floor-seating-concurrency.test.ts`, 5 stable
  repetitions each, 0 integrity flakes.
- `Reservation`/`CapacityCommitment` invariants hold: `SeatingOrchestrator`
  has zero coupling to either; cancellation still correctly releases an
  active `SeatingAssignment` in the same transaction
  (`AvailabilityOrchestrator.cancelWithCapacity`).
- Isolated full-suite total at closure: see the P1-B10 STOP-gate report
  for the exact figure as of this phase.

**NOT confirmed — explicitly out of scope for this report:**
- **No human smoke test has been performed.** No staff member has
  walked through assign → pre-assign → mark-seated → move → block →
  no-show against a real running dev deployment. Automated tests prove
  the code is correct under the scenarios they encode; they do not prove
  the workflow is usable or complete from a staff member's perspective.
- **Nothing in this sequence has been deployed anywhere.** This report
  closes the implementation sequence, not a deployment gate.

## Documentation reconciled alongside this report

- `capability-registry.yaml.md`: `CAP-D02.03`, `CAP-D03.03`, `CAP-D04.01`
  `delivery_status` updated from `Designed` to `Pilot` (an existing value
  on the registry's own scale) — reflecting that these capabilities are
  now wired into the staff-facing pilot and comprehensively
  automated-tested, while stopping short of `Active` (which this report
  explicitly does not claim, per the human-smoke-test/deployment
  distinction above).
- `PILOT.md`: scope statement extended to include Floor & Seating; a new
  "Floor & Seating status" section states the automated-vs-human-tested
  distinction and repeats the accepted limitations above verbatim.
- `README.md`: status heading and the Controlled Pilot section updated to
  reflect Floor & Seating's inclusion, with the same automated-only
  caveat.

## Next gate

A controlled development smoke test (a real staff member exercising the
full workflow against the dev environment) is the recommended next gate
before this capability set is relied on operationally or deployment is
considered — per the Floor & Seating completion audit that authorized
this phase. This report does not perform or claim that test.
