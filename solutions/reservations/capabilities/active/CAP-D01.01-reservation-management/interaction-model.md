# CAP-D01.01 — Reservation Management
# Interaction Model

---

## Metadata

```yaml
artifact_id: CAP-D01.01-INTERACTION
artifact_type: Capability Interaction Model

capability:
  id: CAP-D01.01
  name: Reservation Management

version: 1.0.0
status: Approved
owner: Reservation Management
authority: capability.md
```

---

# 1. Purpose

This document defines how Reservation Management collaborates with
other capabilities.

It describes operational interactions rather than implementation
mechanisms.

It is independent of:

- REST
- GraphQL
- gRPC
- Messaging
- Database
- Programming language

---

# 2. Interaction Principles

## INT-01

Capabilities collaborate.

Applications communicate.

Infrastructure transports.

These are different concerns.

---

## INT-02

Every interaction has:

- one requester
- one provider
- one business purpose

---

## INT-03

Interactions never transfer ownership.

---

## INT-04

Capabilities request information.

They do not read another capability's internal state directly.

---

## INT-05

Interactions shall preserve capability autonomy.

---

# 3. Incoming Interactions

---

## INT-I01

Requester

Restaurant Staff

Purpose

Create Reservation

Provided Capability

Reservation Management

Result

ReservationCreated

---

## INT-I02

Requester

Reservation Import

Purpose

Create Reservation

Result

ReservationCreated

with `reservation_source: external_import`

---

## INT-I03

Requester

Walk-in Management

Purpose

Create Future Reservation

Result

ReservationCreated

---

## INT-I04

Requester

Guest Self-Service

Purpose

Modify Reservation

Result

ReservationModified

---

# 4. Outgoing Interactions

---

## INT-O01

Target

Service Period Management

Purpose

Determine Service Period

Request

Reservation DateTime

Response

Service Period

Blocking

Yes

---

## INT-O02

Target

Reservation Contact Management

Purpose

Validate Contact

Blocking

Yes

---

## INT-O03

Target

Availability Management

Purpose

Evaluate Operational Availability

Blocking

Policy Dependent

---

## INT-O04

Target

Seating Assignment

Purpose

Create Seating Opportunity

Blocking

No

---

## INT-O05

Target

Reservation Timeline

Purpose

Append Timeline Events

Blocking

No

---

## INT-O06

Target

Communication

Purpose

Guest Confirmation

Blocking

No

---

## INT-O07

Target

Dashboard

Purpose

Refresh Operational View

Blocking

No

---

# 5. Capability Dependencies

| Capability | Dependency | Why |
|------------|------------|-----|
| Service Period | Required | Reservation belongs to one service period |
| Contact | Required | Reservation requires contact |
| Availability | Conditional | Operational acceptance |
| Seating | Optional | Later operational planning |

Timeline is not a dependency of Reservation Management. It is a required downstream obligation, non-blocking: Reservation Management always publishes its events to Timeline, but reservation creation must not fail simply because the Timeline projection is temporarily unavailable. See section 10, Interaction Matrix.

---

# 6. Information Owned Elsewhere

Reservation Management references but does not own:

Service Period

owned by

Service Period Management

---

Guest Contact

owned by

Reservation Contact Management

---

Seating Assignment

owned by

Seating Assignment

---

Availability Decision

owned by

Availability Management

---

# 7. Published Business Events

ReservationCreated

ReservationModified

ReservationConfirmed

ReservationCancelled

ReservationCompleted

ReservationCorrected

ReservationRuleOverridden

---

# 8. Consumed Business Events

Reservation Management does not currently consume events from other capabilities.

An event shall only be listed here once Reservation Management has an explicit, defined reaction to it.

For example, `TableReleased` likely belongs to Live Service or Table Turn Management and may not affect the reservation lifecycle at all. It shall not be listed here until that reaction is defined and owned. The same applies to `GuestArrived`, `ServicePeriodClosed`, and `AvailabilityChanged`.

---

# 9. Failure Behaviour

If another capability is unavailable

Reservation Management shall determine whether:

- interaction is blocking
- interaction may be retried
- interaction may be deferred

Internal reservation integrity shall always take priority.

---

# 10. Interaction Matrix

| Interaction | Blocking | Retry | Deferred |
|-------------|----------|-------|----------|
| Service Period | Yes | Yes | No |
| Contact | Yes | Yes | No |
| Availability | Policy | Yes | Yes |
| Seating | No | Yes | Yes |
| Timeline | No | Yes | Yes |
| Dashboard | No | Yes | Yes |
| Communication | No | Yes | Yes |

---

# 11. Interaction Invariants

Reservation Management never owns another capability's state.

Reservation Management never changes another capability's state directly.

Reservation Management always exposes one authoritative reservation identity.

Interaction failure shall never corrupt reservation state.

---

# 12. Operational Collaboration

Reservation lifecycle

↓

ReservationCreated

↓

Timeline

↓

Availability

↓

Seating Assignment

↓

Guest Arrival

↓

Live Service

↓

Completed

Each capability owns only its part of the operational outcome.

---

# 13. References

capability.md

rule-model.md

event-model.md

state-model.md

CA-001