# CAP-D01.01 — Reservation Management

---

## Metadata

```yaml
id: CAP-D01.01
name: Reservation Management
slug: reservation-management

solution:
  id: PRD-001
  name: HELIX Reservations

domain:
  id: CAP-D01
  name: Reservation Demand

type: Core

status: Approved
delivery_status: Designed
operational_maturity: M1

owner: Reservation Management Capability

introduced_in: MVP

version: 1.0.0

authoritative: true
```

---

# Purpose

Reservation Management provides the authoritative capability responsible for the lifecycle of restaurant reservations.

Its purpose is to establish and preserve a single, consistent reservation record that represents a guest's intention to visit the restaurant at a specific date and time.

The capability maintains the reservation throughout its lifecycle while preserving operational consistency, business integrity, and traceable history.

---

# Operational Outcome

Restaurant staff can reliably create, retrieve, modify, confirm and cancel reservations while maintaining one authoritative reservation record.

Every reservation is uniquely identifiable.

Every operational capability references the same reservation identity.

---

# Responsibility

Reservation Management owns the lifecycle of reservations.

It is responsible for:

- creating reservations
- modifying reservations
- confirming reservations
- cancelling reservations
- maintaining reservation identity
- maintaining reservation status
- preserving reservation history
- exposing reservation information to other capabilities

---

# Out of Scope

Reservation Management does **not** own:

- seating assignment
- table allocation
- availability calculation
- floorplans
- communication delivery
- reminders
- AI recommendations
- reporting
- analytics
- external synchronization
- guest CRM

These responsibilities belong to other capabilities.

---

# Business Outcome

The restaurant always knows:

- who is coming
- when they arrive
- for how many guests
- under which reservation
- in which operational state

---

# Operational Users

Primary Users

- Manager
- Assistant Manager
- Supervisor

Secondary Users

- Reservation Agent
- Reception
- Owner

Indirect Users

- Kitchen
- Floor Staff
- AI Assistant
- Reporting
- Integrations

---

# Owned Concepts

Reservation Management is the authoritative owner of:

## Reservation

Represents a planned restaurant visit.

---

## Reservation Identity

Stable identifier for the reservation.

Never changes.

---

## Reservation Status

Current operational status of the reservation.

---

## Reservation Party

Number of guests.

---

## Reservation Date

Operational reservation date.

---

## Reservation Time

Planned arrival time.

---

## Reservation Duration

Expected occupancy duration.

---

## Reservation Notes

Operational information supplied during booking.

---

## Reservation Source

Operational origin of the reservation.

Examples

- Website
- Phone
- Walk-in
- Google
- TheFork

---

# Inputs

Reservation Management accepts:

- Reservation Creation Request
- Reservation Modification Request
- Reservation Cancellation Request
- Reservation Confirmation Request
- Reservation Lookup Request

---

# Outputs

Reservation Management produces:

- Reservation
- Reservation Status
- Reservation Identifier
- Reservation Timeline Event
- Reservation Change Notification
- Reservation Query Result

---

# Dependencies

Reservation Management depends on:

CAP-D02.02 Service Period Management

Reason

Reservations must belong to one service period.

---

CAP-D05.01 Reservation Contact Management

Reason

A reservation requires contact information.

---

# Provides To

Reservation Management provides information to:

CAP-D04.01 Seating Assignment

CAP-D04.03 Guest Arrival Management

CAP-D08.01 Reservation Timeline

CAP-D08.03 Service Dashboard

CAP-D07.01 Reservation Import

CAP-D07.02 Reservation Export

---

# Commands

Reservation Management accepts the following commands.

## Create Reservation

Creates a new reservation.

---

## Modify Reservation

Updates reservation information.

---

## Confirm Reservation

Marks reservation operationally confirmed.

---

## Cancel Reservation

Terminates the reservation.

---

## Complete Reservation

Closes reservation after service.

---

## Retrieve Reservation

Returns reservation information.

---

# Business Rules

Reference

rule-model.md

Critical rules include:

- CAP-D01.01-R02 — Reservation Identity is immutable.
- CAP-D01.01-R06 — Reservation belongs to exactly one Service Period.
- CAP-D01.01-R07 — Reservation must contain one Reservation Contact.
- CAP-D01.01-R16 — Completed reservations cannot be modified.
- CAP-D01.01-R18 — Every modification is attributable.

Invalid lifecycle transitions, such as a cancelled reservation returning to Proposed, are governed by `state-model.md`.

---

# Business Events

Reference

event-model.md

Primary events

CAP-D01.01-E01 — ReservationCreated

CAP-D01.01-E02 — ReservationModified

CAP-D01.01-E03 — ReservationConfirmed

CAP-D01.01-E04 — ReservationCancelled

CAP-D01.01-E05 — ReservationCompleted

---

# Interaction Summary

Incoming

- User creates reservation
- Import capability creates reservation
- Walk-in capability creates reservation

Outgoing

- Seating Assignment receives reservation
- Timeline records reservation events
- Dashboard displays reservation state
- Guest Arrival tracks operational progress

---

# Failure Behaviour

If reservation creation fails

- no reservation shall exist.

If modification fails

- existing reservation remains unchanged.

If cancellation fails

- reservation remains in previous state.

Partial updates are prohibited.

---

# Security

Reservation creation requires authenticated staff.

Reservation cancellation requires authorization.

Reservation completion requires operational authority.

Every modification shall record:

- actor
- timestamp
- operation
- previous state
- resulting state

---

# Quality Attributes

The capability shall provide:

Consistency

Every reservation has one authoritative version.

---

Traceability

Every meaningful change is attributable.

---

Reliability

Reservation state survives application restart.

---

Auditability

Every lifecycle change is historically visible.

---

Performance

Reservation retrieval should support live restaurant operations.

---

Availability

Restaurant staff shall continue operating during degraded integrations.

---

# Success Criteria

The capability succeeds when:

✓ Restaurant staff can create reservations.

✓ Every reservation has one immutable identity.

✓ Reservation status is always known.

✓ Every change is traceable.

✓ Every reservation belongs to one service period.

✓ Other capabilities consume reservation information without duplicating ownership.

✓ Reservation lifecycle remains internally consistent.

---

# Known Unknowns

The following operational questions remain intentionally open.

- Reservation duration defaults
- Reservation overlap policy
- Reservation confirmation policy
- Late-arrival grace period
- Automatic cancellation policy
- Duplicate guest detection
- Reservation numbering format

These shall be resolved through engineering cases before implementation.

---

# References

CAP-REG-001 Capability Registry

CA-001 Capability Architecture Standard

RM-004 Knowledge Reference Model

EM-001 Engineering Method

## Commands Owned

- Create Reservation
- Modify Reservation
- Confirm Reservation
- Cancel Reservation
- Complete Reservation
- Correct Reservation

## Queries Owned

- Get Reservation
- Find Reservations
- List Reservations by Service Period
- Get Reservation History

## Decisions Owned

- Is the reservation data valid?
- Is the requested lifecycle transition permitted?
- May the actor perform the requested action?
- Does the command require an authorized override?

## State Ownership

Reservation Management owns the authoritative Reservation Lifecycle State.

See:

- `state-model.md`