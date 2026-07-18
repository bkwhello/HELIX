---

# ISC-001 – Guestplan Configuration Specification

## Purpose

ISC-001 specifies the required Guestplan configuration for implementing the approved reservation architecture.

Guestplan remains the authoritative operational reservation system.

No supporting system shall become the primary reservation representation.

---

## Guestplan Environment

Implementation Environment

Production Guestplan Account

Implementation Status

Approved

Operational Purpose

Future reservation management.

Operational reservation representation.

Operational preparation.

Floor reservation planning.

---

## Dining Areas

The following dining areas shall exist.

| Area | Purpose |
|-------|---------|
| Teppan | Teppan Yaki reservations |
| Sushi | Sushi / Izakaya reservations |

Additional areas may only be introduced through organizational engineering.

---

## Reservation Categories

The implementation initially supports:

- Standard Reservation
- Exceptional Reservation

Exceptional reservations include:

- Large groups
- Private dining
- Operational exceptions

The category determines authority.

---

## Reservation Status

Minimum operational states:

- Reserved
- Cancelled
- Completed (restaurant operational state)

Guestplan system states remain unchanged unless configuration supports them.

---

# ISC-002 – User Account Specification

## Purpose

Every operational reservation action shall be attributable.

Shared personal credentials are prohibited.

---

## UA-001 Owner

Responsibilities

- System ownership
- Administration
- Access management
- Operational governance

Guestplan Account

Individual

Authentication

Personal credentials

---

## UA-002 Manager

Responsibilities

- Reservation authority
- Daily review
- Exceptional reservations
- Reservation corrections

Guestplan Account

Individual

Authentication

Personal credentials

---

## UA-003 Assistant Manager

Responsibilities

- Reservation authority
- Daily review
- Operational supervision

Guestplan Account

Individual

Authentication

Personal credentials

---

## UA-004 Supervisor

Responsibilities

- Direct reservation entry
- Guest interaction
- Standard reservation completion

Guestplan Account

Individual

Authentication

Personal credentials

---

## UA-005 Administrator

Purpose

Guestplan administration.

This role may be performed by the Owner.

No operational reservation handling is required.

---

# ISC-003 – Permission Matrix

The implementation shall configure permissions according to the following matrix.

| Permission | Owner | Manager | Assistant | Supervisor |
|------------|------:|--------:|----------:|-----------:|
| View reservations | ✓ | ✓ | ✓ | ✓ |
| Create reservation | ✓ | ✓ | ✓ | ✓ |
| Modify reservation | ✓ | ✓ | ✓ | Limited |
| Cancel reservation | ✓ | ✓ | ✓ | No |
| Approve exceptional reservation | ✓ | ✓ | ✓ | No |
| User management | ✓ | No | No | No |
| Configuration | ✓ | No | No | No |
| Reports | ✓ | ✓ | Optional | No |

Where Guestplan cannot technically enforce one of these restrictions, an operational rule shall compensate.

---

# ISC-004 – Workfloor Device Specification

## Purpose

Provide secure workfloor access to Guestplan.

---

## Device

Preferred device

Restaurant Tablet

Alternative

Restaurant Phone

Fallback

Manager device

---

## Device Location

The device shall be located where:

- Supervisors can access it quickly;
- guests cannot easily read the display;
- unauthorized persons cannot operate it.

---

## Authentication

Authentication shall use:

- individual account;
- secure password;
- PIN or biometric where supported.

---

## Device Requirements

The device shall support:

- Wi-Fi
- Current operating system
- Guestplan application or browser
- Automatic locking
- Reliable charging

---

## Device Availability

The device shall remain available during opening hours.

---

# ISC-005 – Reservation Data Specification

The following information is required for every standard reservation.

| Field | Required |
|-------|----------|
| Guest Name | Yes |
| Telephone Number | Yes |
| Reservation Date | Yes |
| Reservation Time | Yes |
| Number of Guests | Yes |
| Dining Area | Yes |
| Allergy Information | When applicable |
| Operational Notes | Optional |

---

## Data Validation

Before saving, the actor shall verify:

- spelling of guest name;
- telephone number;
- reservation date;
- reservation time;
- number of guests;
- Teppan or Sushi;
- operational notes.

---

## Reservation Acceptance Rule

A reservation shall not be saved unless the required information is complete.

Incomplete reservations activate the fallback workflow.

---

## Duplicate Prevention

Before creating a reservation the actor shall determine whether:

- the reservation already exists;
- the guest already has a booking;
- another actor has already entered the reservation.

Where uncertainty remains:

Activate the fallback.

---

## Save Verification

A reservation is considered completed only after:

1. Guestplan confirms the save.
2. The reservation is visible.
3. Critical information is correct.

Attempted saving is not completion.

---

## Reservation Identity

The following combination constitutes the operational identity of a reservation.

- Guest name
- Reservation date
- Reservation time
- Number of guests

Telephone number acts as supporting identity.

---

## Data Ownership

Guestplan remains the owner of operational reservation data.

Supporting systems shall only contain the minimum information required for recovery.

---

# Component Exit Criteria

ISC-001 through ISC-005 are complete when:

- Guestplan has been configured;
- user accounts exist;
- permissions have been configured;
- the workfloor device is operational;
- reservation fields are available;
- mandatory information is defined;
- completion criteria are established.

No operational workflow has yet been specified.

That begins in ISC-006.