# CAP-D01.01 — Reservation Management
# Event Model

---

## Metadata

```yaml
artifact_id: CAP-D01.01-EVENT
artifact_type: Capability Event Model

capability_id: CAP-D01.01
capability_name: Reservation Management

version: 1.0.0
status: Approved

owner: Reservation Management
authority: capability.md
```

---

# 1. Purpose

This document defines the authoritative business events emitted by
Reservation Management.

Business events preserve the operational history of the reservation lifecycle.

Events are immutable records of meaningful business facts.

Events are **not** implementation logs.

---

# 2. Event Principles

## EV-01

Events describe something that **has happened**.

---

## EV-02

Events are immutable.

---

## EV-03

Events never modify business state.

State changes generate events.

Events never generate state changes by themselves.

---

## EV-04

Events are written in past tense.

Example

✓ ReservationCreated

✗ CreateReservation

---

## EV-05

Every event has exactly one authoritative meaning.

---

## EV-06

Events may be consumed by many capabilities.

Ownership remains with Reservation Management.

---

# 3. Event Categories

| Category | Purpose |
|------------|--------------------------------|
| Lifecycle | Reservation lifecycle |
| Correction | Historical correction |
| Override | Business override |
| Integration | External synchronization |
| Audit | Accountability |

---

# 4. Common Event Structure

Every event shall contain:

```yaml
event_id:
event_type:
occurred_at:
reservation_id:
service_period_id:
actor:
source:
correlation_id:
causation_id:
version:
payload:
```

The implementation may store additional metadata.

The business meaning shall remain identical.

---

# 5. Lifecycle Events

---

## CAP-D01.01-E01

### ReservationCreated

Meaning

A new reservation has been successfully created.

Trigger

Successful execution of:

Create Reservation

Generated From

State

None

↓

Proposed

Consumers

- Timeline
- Dashboard
- Seating Assignment
- Availability
- Reporting

---

## CAP-D01.01-E02

### ReservationModified

Meaning

Operational reservation information changed.

Trigger

Modify Reservation

Consumers

- Timeline
- Dashboard
- Seating Assignment
- Communication

---

## CAP-D01.01-E03

### ReservationConfirmed

Meaning

Restaurant accepted the reservation.

Trigger

Confirm Reservation

Consumers

- Seating Assignment
- Dashboard
- Timeline

---

## CAP-D01.01-E04

### ReservationCancelled

Meaning

Reservation is no longer expected.

Trigger

Cancel Reservation

Consumers

- Timeline
- Dashboard
- Seating Assignment
- Communication

---

## CAP-D01.01-E05

### ReservationCompleted

Meaning

Reservation lifecycle finished.

Trigger

Complete Reservation

Consumers

- Timeline
- Analytics
- Dashboard

---

# 6. Correction Events

Corrections preserve accountability.

---

## CAP-D01.01-E06

ReservationCorrected

Meaning

Historical reservation information corrected.

Original information remains historically visible.

---

# 7. Override Events

---

## CAP-D01.01-E07

ReservationRuleOverridden

Meaning

A blocking business rule was intentionally overridden.

Payload shall include

- Rule ID
- Reason
- Actor
- Previous Value
- New Value

---

# 8. Rejection Events

---

## CAP-D01.01-E08

ReservationCommandRejected

Meaning

A reservation command failed because business rules rejected it.

Rejected commands shall not change state.

---

# 9. Integration Events

---

## Reservation Import

Import is not a second lifecycle transition alongside creation.

```text
Imported reservation
    ↓
ReservationCreated
```

The creation event carries additional context when the source is an approved external import:

```yaml
reservation_source: external_import
external_reference:
imported_by:
```

Reservation Management does not emit a distinct import event. It would only be introduced as an integration evidence event — not a lifecycle event — if a genuine business need to track the import operation itself arises. No such need currently exists.

---

## CAP-D01.01-E10

ReservationExported

Meaning

Reservation information exported.

Export success does not imply external acceptance.

---

## Reservation Synchronization Failure

Reservation Management does not own or emit a synchronization-failure event.

Ownership of `ReservationSynchronizationFailed` belongs to the future Integration capability. Reservation Management may consume or display the failure once that capability exists, but it does not authoritatively produce it.

`CAP-D01.01-E11` is retired from this capability. See `acceptance.md` (CAP-D01.01-AC22) for the boundary behaviour between Reservation Management and Integration.

---

# 10. Event Payload Definitions

Example

ReservationCreated

```yaml
reservation_id:
service_period_id:
contact_id:
reservation_date:
reservation_time:
party_size:
reservation_source:
created_by:
occurred_at:
external_reference:   # present only when reservation_source is external_import
imported_by:          # present only when reservation_source is external_import
```

ReservationCancelled

```yaml
reservation_id:
cancel_reason:
cancelled_by:
occurred_at:
```

ReservationRuleOverridden

```yaml
reservation_id:
rule_id:
reason:
actor:
old_value:
new_value:
occurred_at:
```

---

# 11. Event Ordering

Events shall preserve chronological order.

Example

```text
ReservationCreated

↓

ReservationModified

↓

ReservationConfirmed

↓

ReservationCompleted
```

Correction events shall appear in sequence.

They shall never replace earlier events.

---

# 12. Event Visibility

| Event | Timeline | Dashboard | Audit |
|---------|----------|-----------|-------|
| Created | ✓ | ✓ | ✓ |
| Modified | ✓ | Optional | ✓ |
| Confirmed | ✓ | ✓ | ✓ |
| Cancelled | ✓ | ✓ | ✓ |
| Completed | ✓ | ✓ | ✓ |
| Corrected | ✓ | No | ✓ |
| Override | ✓ | Warning | ✓ |

---

# 13. Event Retention

Business events shall not be deleted as part of normal operation.

If legal deletion is required:

- event identity remains;
- deletion reason recorded;
- audit preserved where legally permitted.

---

# 14. Event Consumers

Reservation Timeline

Purpose

Operational history.

---

Service Dashboard

Purpose

Current operational awareness.

---

Seating Assignment

Purpose

React to reservation lifecycle.

---

Availability Management

Purpose

Capacity recalculation.

---

Communication

Purpose

Guest notifications.

---

Analytics

Purpose

Business intelligence.

---

# 15. Event Correlation

Events belonging to one reservation shall share:

```yaml
reservation_id
```

Commands generating multiple events should preserve

```yaml
correlation_id
```

This enables reconstruction of operational history.

---

# 16. Event Versioning

Business meaning shall remain stable.

Breaking semantic changes require:

New Event ID

or

New Event Version

Historical meaning shall never silently change.

---

# 17. Event Invariants

Every event:

- references one Reservation Identity;
- has one timestamp;
- has one event type;
- has one authoritative producer;
- is immutable;
- is historically preserved.

---

# 18. Event Traceability

Events trace back to:

```text
Command

↓

Rules

↓

State Transition

↓

Business Event
```

Forward traceability

```text
Business Event

↓

Timeline

↓

Dashboard

↓

Reporting

↓

Analytics
```

---

# 19. Event Conformance

Reservation Management conforms when:

✓ Every successful lifecycle transition emits exactly one lifecycle event.

✓ Failed commands emit no success events.

✓ Correction events preserve history.

✓ Override events preserve accountability.

✓ Events remain immutable.

✓ Events never redefine state.

✓ Consumers cannot alter authoritative event meaning.

---

# 20. References

- capability.md
- state-model.md
- rule-model.md
- interaction-model.md
- acceptance.md
- CA-001