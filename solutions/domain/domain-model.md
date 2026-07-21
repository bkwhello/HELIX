# HELIX Reservations — Domain Model

## Metadata

```yaml
artifact_id: PRD-001-DM-001
product_id: PRD-001
title: HELIX Reservations Domain Model
version: 0.1.0
status: Draft
owner: HELIX Reservations
architect: Principal HELIX Architect
initial_deployment: Konnichiwa Utrecht
```

---

# Purpose

This document defines the core business concepts and relationships used by HELIX Reservations.

It provides a shared language for:

- restaurant operations;
- product design;
- software architecture;
- database design;
- integrations;
- reporting;
- AI-assisted operations.

This document describes the business domain.

It does not define database tables, API payloads, user-interface components, or implementation technology.

---

# Domain Goal

HELIX Reservations manages restaurant demand, available seating capacity, reservation commitments, and operational seating assignments across one or more reservation channels.

The domain must support:

- reservations created internally or externally;
- one authoritative internal reservation identity;
- multiple restaurant areas;
- custom floorplans;
- tables and individual seats;
- shared teppan tables;
- table combinations;
- manual and suggested assignments;
- reservation changes and cancellations;
- walk-ins;
- future POS and guest-profile integration.

---

# Domain Boundary

HELIX Reservations owns:

- Reservation
- Reservation Party
- Reservation Source
- Reservation Status
- Service
- Service Period
- Restaurant Area
- Floorplan
- Table
- Seat
- Table Combination
- Seating Assignment
- Availability
- Walk-in
- Waitlist Entry
- Reservation Change History
- Operational Reservation Notes

HELIX Reservations may reference but does not necessarily own:

- Guest Profile
- Restaurant Organization
- Staff Identity
- Payment
- Order
- Marketing Consent
- Loyalty Account
- External Platform Account

---

# Domain Overview

```text
Restaurant
    │
    ├── contains Areas
    │       │
    │       └── contains Tables
    │               │
    │               └── contains Seats
    │
    ├── defines Services
    │       │
    │       └── contains Service Periods
    │
    └── operates Floorplans

Reservation
    │
    ├── belongs to a Service Period
    ├── originates from a Reservation Source
    ├── represents a Reservation Party
    ├── may request an Area
    ├── may have one or more Seating Assignments
    └── has a Change History
```

---

# Core Concepts

## Restaurant

A business location at which reservations are accepted and guests are seated.

A Restaurant may contain:

- one or more floors;
- one or more areas;
- one or more floorplans;
- multiple services per day;
- restaurant-specific reservation rules.

For the first deployment, the Restaurant is Konnichiwa Utrecht.

---

## Restaurant Area

A logical or operational seating zone within a Restaurant.

Examples:

- Teppan
- Sushi Bar
- Main Restaurant
- Private Dining
- Terrace

An Area may have:

- its own tables;
- opening times;
- reservation rules;
- preferred party sizes;
- service duration;
- capacity constraints;
- operational workload constraints.

An Area is not necessarily the same as a physical room.

---

## Floorplan

A spatial representation of the seating resources available within a Restaurant or Area.

A Floorplan contains:

- tables;
- seats;
- table positions;
- table dimensions;
- area boundaries;
- non-bookable objects;
- operational labels.

A Restaurant may maintain multiple Floorplan versions.

Examples:

- Regular dinner layout
- Lunch layout
- Private-event layout
- Reduced-capacity layout

---

## Floorplan Version

An identifiable configuration of a Floorplan that applies during a defined period or operational condition.

A Floorplan Version preserves changes without rewriting historical seating information.

Examples:

- Summer layout
- Christmas layout
- Layout before renovation
- Layout with a temporarily unavailable table

---

## Table

A physical or logical seating resource to which guests can be assigned.

A Table has:

- an internal identifier;
- a display label;
- an Area;
- minimum capacity;
- standard capacity;
- maximum capacity;
- table type;
- position on a Floorplan;
- operational status.

Examples:

- T01
- Teppan 1
- Sushi Counter A
- Private Room Table

A Table may contain individually represented Seats.

---

## Table Type

A classification describing the operational behavior of a Table.

Initial types may include:

- Standard Table
- Teppan Table
- Sushi Counter
- Bar Seat Group
- Private Dining Table
- Flexible Table

Table Type may influence:

- assignable party sizes;
- sharing rules;
- service duration;
- workload;
- table combination rules.

---

## Seat

An individual seating position belonging to a Table or counter.

A Seat is particularly important where individual positions matter operationally.

Examples:

- teppan counter seats;
- sushi counter seats;
- shared-table positions.

A Seat may have:

- a display number;
- an availability state;
- adjacency information;
- a position on the Floorplan;
- assignment restrictions.

Not every Table must expose individual Seats.

---

## Table Combination

A permitted temporary grouping of two or more Tables that can serve one Reservation Party.

A Table Combination defines:

- participating Tables;
- combined minimum capacity;
- combined maximum capacity;
- whether the combination is operationally allowed;
- any setup conditions.

Examples:

```text
T01 + T02
T04 + T05 + T06
```

A Table Combination is not automatically available merely because its component Tables are available.

---

## Service

A recurring restaurant operation during which reservations may be accepted.

Examples:

- Lunch
- Dinner
- Sunday Dinner
- Special Event

A Service defines general operating rules.

---

## Service Period

A dated occurrence of a Service.

Examples:

```text
Dinner on 19 July 2026
Lunch on 20 July 2026
```

A Service Period has:

- date;
- opening time;
- closing time;
- bookable arrival times;
- applicable Floorplan Version;
- capacity rules;
- pacing rules;
- operational status.

Reservations belong to a Service Period, not merely to a calendar date.

---

## Time Slot

A bookable arrival interval within a Service Period.

Examples:

- 17:30
- 17:45
- 18:00

A Time Slot may include:

- maximum covers;
- maximum arrivals;
- Area-specific capacity;
- Table-specific restrictions;
- workload limits.

A Time Slot represents an arrival commitment, not necessarily the full duration of the visit.

---

## Reservation

A commitment between the Restaurant and a Reservation Party for service at a particular time.

Every Reservation receives one stable internal identifier.

Example:

```yaml
reservation_id: RES-000123
```

A Reservation may also contain references to external platforms, but external identifiers never replace the internal identifier.

A Reservation contains or references:

- Reservation Party;
- Service Period;
- requested arrival time;
- expected duration;
- party size;
- preferred Area;
- Reservation Source;
- current Reservation Status;
- guest contact information;
- allergies;
- notes;
- Seating Assignment;
- external references;
- change history.

---

## Reservation Party

The group of guests represented by a Reservation.

A Reservation Party includes:

- party size;
- primary contact;
- adults and children where relevant;
- accessibility needs;
- allergies;
- guest preferences;
- special occasion information.

The Reservation Party is not the same as a permanent Guest Profile.

A Reservation can exist even when no reusable Guest Profile has been created.

---

## Reservation Contact

The person through whom the Restaurant communicates about a Reservation.

A Reservation Contact may include:

- name;
- telephone number;
- email address;
- preferred language.

The contact details stored with the Reservation preserve the information applicable to that booking.

---

## Guest Profile

A reusable record describing a known guest across multiple visits.

Guest Profile may eventually be owned by a CRM or shared guest platform.

HELIX Reservations may reference a Guest Profile through a stable identifier.

A Reservation must not depend on the existence of a Guest Profile.

---

## Reservation Source

The origin through which a Reservation entered the system.

Initial Reservation Sources include:

- Konnichiwa Website
- Google
- TheFork
- Guestplan
- Telephone
- Walk-in
- Staff Entry
- Email
- Other

A Reservation Source identifies the origin of the Reservation.

It does not determine ownership of the internal Reservation.

---

## External Reservation Reference

A mapping between an internal Reservation and an identifier used by an external platform.

Example:

```yaml
external_reference:
  platform: thefork
  external_reservation_id: TF-784231
```

A Reservation may have multiple external references.

External references support:

- synchronization;
- modification matching;
- cancellation matching;
- auditing;
- troubleshooting.

---

## Reservation Status

The current business state of a Reservation.

Initial statuses:

- Draft
- Pending
- Confirmed
- Modified
- Cancelled
- No-show
- Arrived
- Seated
- Completed
- Declined

The status describes the Reservation.

It does not describe integration health or payment state.

---

## Integration Status

The synchronization condition between an internal Reservation and an external source.

Possible statuses include:

- Not Applicable
- Pending Import
- Synchronized
- Update Pending
- Conflict
- Failed
- Disconnected

Integration Status remains separate from Reservation Status.

For example:

```text
Reservation Status: Confirmed
Integration Status: Conflict
```

---

## Seating Assignment

The operational allocation of a Reservation Party to one or more Tables or Seats.

A Seating Assignment may include:

- assigned Table;
- assigned Seats;
- Table Combination;
- assignment time;
- assignment source;
- assignment status;
- operational notes.

A Reservation may be confirmed before it has a Seating Assignment.

---

## Assignment Source

The actor or mechanism that created a Seating Assignment.

Examples:

- Manager
- Host
- System Suggestion
- Automated Assignment
- Imported Assignment

This supports later comparison between human and automated planning.

---

## Assignment Status

The current condition of a Seating Assignment.

Initial values:

- Unassigned
- Proposed
- Confirmed
- Changed
- Released
- Completed

A proposed assignment should not be treated as operationally committed until confirmed.

---

## Availability

The capacity that can still be offered for a particular time, Area, Table, or Service Period.

Availability is derived from:

- Floorplan;
- table and seat capacity;
- Service Period rules;
- existing Reservations;
- Seating Assignments;
- expected duration;
- blocked resources;
- pacing limits;
- operational constraints.

Availability is not simply:

```text
total seats - confirmed covers
```

For Konnichiwa, it may also depend on Teppan workload and usable seat groupings.

---

## Resource Block

A temporary restriction preventing a Table, Seat, Area, or Time Slot from being offered.

Examples:

- broken equipment;
- maintenance;
- private event;
- staff shortage;
- reserved for walk-ins;
- temporary table removal.

A Resource Block should include a reason and applicable time range.

---

## Pacing Rule

A rule limiting how many reservations or covers may arrive during an interval.

A Pacing Rule may apply to:

- the whole Restaurant;
- an Area;
- a Table Type;
- Teppan production;
- a specific Service Period.

Pacing protects operational quality even when physical seating remains available.

---

## Expected Duration

The estimated amount of time a Reservation Party will occupy its assigned seating resource.

Expected Duration may depend on:

- Service;
- Area;
- menu type;
- party size;
- day of week;
- historical behavior;
- manual override.

Duration is an operational estimate, not a guarantee.

---

## Turn

The use of a Table or Seat by a Reservation Party during a defined time interval.

A Table may support multiple Turns within one Service Period.

Example:

```text
T01
17:30–19:30 Reservation A
20:00–22:00 Reservation B
```

---

## Walk-in

A guest party requesting service without a pre-existing Reservation.

A Walk-in may:

- be seated immediately;
- become a Reservation;
- join the Waitlist;
- be declined.

Once accepted for future or immediate service, a Walk-in should use the same internal Reservation model where practical.

---

## Waitlist Entry

A request for seating when no acceptable immediate Reservation or assignment can be provided.

A Waitlist Entry includes:

- party details;
- requested Area;
- arrival time;
- waiting since;
- estimated waiting time;
- contact details;
- current status.

Possible statuses:

- Waiting
- Contacted
- Accepted
- Seated
- Declined
- Abandoned
- Expired

---

## Reservation Note

Operational information attached to a Reservation.

Notes may be classified as:

- Guest Request
- Allergy
- Accessibility
- Special Occasion
- Internal Operational Note
- Platform Note
- Seating Preference
- Communication Note

Sensitive operational notes should be access-controlled.

---

## Allergy Information

Structured or unstructured information concerning food allergies or intolerances reported for a Reservation Party.

Allergy Information should be:

- clearly visible during service;
- preserved with the Reservation;
- traceable to its source;
- manually confirmable by staff.

The reservation system communicates allergy information but does not replace staff verification or kitchen safety procedures.

---

## Reservation Change

A recorded modification to a Reservation.

Examples:

- time changed;
- party size changed;
- Area preference changed;
- contact changed;
- cancellation;
- Table reassignment.

A Reservation Change records:

- what changed;
- previous value;
- new value;
- time of change;
- actor;
- source;
- reason where available.

---

## Reservation History

The ordered record of important events affecting a Reservation.

Examples:

- created;
- imported;
- confirmed;
- modified;
- assigned;
- arrived;
- seated;
- completed;
- cancelled.

History should remain append-oriented and auditable.

---

## Operational Event

A time-stamped event occurring during service.

Examples:

- guest arrived;
- guest seated;
- table released;
- guest marked late;
- guest marked no-show;
- assignment changed.

Operational Events may later support analytics and AI recommendations.

---

# Principal Relationships

## Restaurant and Area

```text
Restaurant
1 ───── contains ───── many
Restaurant Areas
```

An Area belongs to one Restaurant.

---

## Area and Table

```text
Restaurant Area
1 ───── contains ───── many
Tables
```

A Table belongs to one primary Area at a time.

---

## Table and Seat

```text
Table
1 ───── contains ───── zero or many
Seats
```

---

## Restaurant and Service

```text
Restaurant
1 ───── defines ───── many
Services
```

---

## Service and Service Period

```text
Service
1 ───── occurs as ───── many
Service Periods
```

---

## Reservation and Service Period

```text
Reservation
many ───── belongs to ───── 1
Service Period
```

---

## Reservation and Reservation Source

```text
Reservation
many ───── originates from ───── 1
Reservation Source
```

---

## Reservation and External Reference

```text
Reservation
1 ───── has ───── zero or many
External Reservation References
```

---

## Reservation and Seating Assignment

```text
Reservation
1 ───── has ───── zero or many
Seating Assignments
```

Only the currently active assignment determines operational seating.

---

## Seating Assignment and Table

```text
Seating Assignment
many ───── allocates ───── one or many
Tables or Seats
```

---

## Reservation and Change History

```text
Reservation
1 ───── has ───── many
Reservation Changes
```

---

# Domain Invariants

## RES-I-001 — Internal Identity

Every Reservation shall have one stable internal Reservation identifier.

---

## RES-I-002 — External Independence

An external platform identifier shall not serve as the primary internal Reservation identity.

---

## RES-I-003 — Service Association

Every active Reservation shall belong to one Service Period.

---

## RES-I-004 — Positive Party Size

An active Reservation Party shall contain at least one guest.

---

## RES-I-005 — Capacity Compliance

A confirmed Seating Assignment shall not exceed the permitted capacity of its allocated Tables or Seats unless explicitly overridden by an authorized user.

---

## RES-I-006 — No Double Allocation

The same exclusive seating resource shall not be assigned to conflicting Reservations during overlapping occupancy periods.

Shared seating is allowed only where the Table or Seat model explicitly permits it.

---

## RES-I-007 — History Preservation

Important Reservation changes shall remain traceable.

---

## RES-I-008 — Status Separation

Reservation Status, Assignment Status, and Integration Status shall remain separate concepts.

---

## RES-I-009 — Manual Control

Authorized operational staff shall be able to override a system-generated seating suggestion.

---

## RES-I-010 — Floorplan Versioning

Historical assignments shall remain interpretable after the active Floorplan changes.

---

## RES-I-011 — Source Preservation

The original Reservation Source shall remain recorded even when the Reservation is later modified internally.

---

## RES-I-012 — Operational Visibility

Allergies and critical operational notes shall remain visible to authorized operational users during the relevant Service Period.

---

## RES-I-013 — Confirmed Without Assignment

A Reservation may be Confirmed without having a confirmed Seating Assignment.

---

## RES-I-014 — Assignment Does Not Confirm Reservation

Creating a Seating Assignment does not automatically confirm the Reservation.

---

## RES-I-015 — Replaceable Integrations

Removing or replacing an external Reservation Source shall not invalidate the internal Reservation record.

---

# Konnichiwa-Specific Domain Requirements

The first implementation must support Konnichiwa’s operational model.

## Teppan Seating

A Teppan Table may:

- contain individually identifiable Seats;
- host more than one Reservation Party simultaneously;
- require adjacent Seats for one Reservation Party;
- have a chef or production capacity;
- be restricted by arrival pacing;
- support different seating durations.

Physical seat availability alone may therefore be insufficient to determine Teppan availability.

---

## Sushi Seating

Sushi seating may include:

- counter Seats;
- regular Tables;
- Area preferences;
- individual Seat assignment.

---

## Shared Seating

The domain must allow multiple Reservation Parties to share a Table where explicitly permitted.

Each party must retain its own:

- Reservation;
- Seating Assignment;
- arrival status;
- notes;
- visit history.

---

## Table Combinations

Konnichiwa staff must be able to define allowed Table Combinations rather than allowing arbitrary combinations.

---

## Area Preference

A requested Area is a preference unless explicitly guaranteed.

The system should distinguish:

```text
preferred_area
```

from:

```text
confirmed_area
```

---

## Operational Workload

Future availability logic may consider:

- Teppan chef workload;
- kitchen production load;
- simultaneous arrivals;
- menu or experience type;
- staffing level.

These are future extensions and should not be hard-coded into the first prototype.

---

# Initial Product Slice

The first operational prototype should implement only the following concepts:

```text
Restaurant
Restaurant Area
Floorplan
Table
Seat
Service Period
Reservation
Reservation Party
Reservation Contact
Reservation Source
Reservation Status
Seating Assignment
Reservation Note
Allergy Information
Reservation Change
```

The first prototype does not require:

- reusable Guest Profiles;
- automatic optimization;
- CRM;
- advanced Waitlist;
- AI assignment;
- multi-restaurant support;
- two-way platform synchronization;
- predictive duration;
- production workload optimization.

---

# Open Questions

The following require operational validation before they become final business rules:

1. Can all Teppan Seats be reserved independently?
2. Which Teppan seat combinations are operationally acceptable?
3. Can unrelated parties always share a Teppan Table?
4. How much spacing is required between parties?
5. Which Areas can guests choose directly?
6. Which Area preferences are guaranteed?
7. What is the normal duration for each dining experience?
8. Which Tables may be combined?
9. How much time is required between Turns?
10. Which party sizes require manager approval?
11. How are children and highchairs represented?
12. Which reservations require deposits?
13. How should late arrivals affect the seating plan?
14. When does a reservation become a No-show?
15. Which external platforms permit read or write integration?
16. Is Guestplan currently the authoritative booking source or only the main operational view?
17. How should a conflict between two external channels be resolved?

These questions should be tested through the first Konnichiwa prototype rather than answered through assumption.

---

# Conclusion

This domain model establishes the initial business language for HELIX Reservations.

The model separates:

- reservation demand;
- restaurant service;
- seating resources;
- operational assignments;
- external integrations;
- historical changes.

It is broad enough to support the final reservation architecture while allowing the first prototype to remain small and operationally testable.