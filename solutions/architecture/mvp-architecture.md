# HELIX Reservations — MVP Architecture

## Metadata

```yaml
artifact_id: PRD-001-ARC-001
product_id: PRD-001
title: HELIX Reservations MVP Architecture
version: 0.1.0
status: Draft
owner: HELIX Reservations
architect: Principal HELIX Architect
initial_deployment: Konnichiwa Utrecht
architecture_style: Modular Monolith
delivery_stage: Prototype
```

---

# Purpose

This document defines the architecture of the first operationally testable version of HELIX Reservations.

The MVP is intended to prove the core reservation and floorplan workflow before investing in:

- external reservation integrations;
- advanced automation;
- artificial intelligence;
- multi-location support;
- customer relationship management;
- point-of-sale integration;
- generalized platform services.

The MVP shall be small enough to build quickly and complete enough to test during real restaurant operations.

---

# Engineering Objective

The MVP shall answer the following question:

> Can HELIX Reservations provide a practical operational view in which Konnichiwa staff can create reservations, understand service demand, assign seating resources, manage changes, and operate the floorplan during a real service?

The MVP does not need to prove the complete commercial product.

It must prove the operational heart of the product.

---

# Architectural Position

HELIX Reservations is the first HELIX operational software product.

The MVP consumes relevant HELIX Foundation principles but does not require a generalized HELIX Platform.

```text
HELIX Foundation
        │
        ▼
HELIX Reservations
        │
        ▼
Konnichiwa Operational Pilot
```

Shared platform services shall be extracted only when real reuse has been demonstrated.

---

# MVP Product Boundary

## Included

The MVP includes:

- one restaurant location;
- restaurant areas;
- one or more floorplan configurations;
- tables and optional individual seats;
- service periods;
- manual reservation creation;
- reservation editing;
- reservation cancellation;
- reservation search;
- reservation notes;
- allergy information;
- reservation source;
- reservation status;
- manual seating assignment;
- table and seat conflict detection;
- reservation movement between tables;
- arrival tracking;
- seating tracking;
- completion tracking;
- basic reservation timeline;
- current-service dashboard;
- basic user authentication;
- basic role permissions.

## Excluded

The MVP excludes:

- public online booking;
- Google integration;
- TheFork integration;
- Guestplan synchronization;
- automated email or SMS;
- reusable CRM guest profiles;
- deposits;
- payments;
- POS integration;
- kitchen integration;
- automatic table optimization;
- AI recommendations;
- predictive duration;
- advanced analytics;
- multi-location management;
- native mobile applications;
- configurable workflows for unrelated restaurant types.

---

# Core MVP Workflows

The MVP shall support five primary workflows.

## Workflow 1 — Create Reservation

```text
Staff opens service period
        ↓
Staff creates reservation
        ↓
Staff enters guest and booking details
        ↓
System validates required information
        ↓
Reservation receives internal identity
        ↓
Reservation becomes visible in list and floorplan context
```

Minimum information:

- guest name;
- telephone number;
- reservation date;
- reservation time;
- party size;
- preferred area;
- reservation source;
- allergies;
- notes.

A reservation may be created without a seating assignment.

---

## Workflow 2 — Assign Seating

```text
Staff selects reservation
        ↓
Staff selects table or seats
        ↓
System checks time and capacity conflicts
        ↓
Staff confirms assignment
        ↓
Assignment appears on floorplan
        ↓
Timeline records assignment
```

The system shall reject or visibly warn about conflicting assignments.

Authorized staff may override selected warnings where operationally necessary.

---

## Workflow 3 — Modify Reservation

```text
Staff opens reservation
        ↓
Staff changes time, party size, area, notes, or contact details
        ↓
System revalidates active assignment
        ↓
System identifies new conflicts
        ↓
Staff confirms change
        ↓
Timeline records previous and new values
```

A change shall not silently invalidate an assignment.

---

## Workflow 4 — Operate Service

```text
Service begins
        ↓
Staff views current-service dashboard
        ↓
Guest arrives
        ↓
Reservation marked Arrived
        ↓
Guest seated
        ↓
Reservation marked Seated
        ↓
Table remains occupied for expected duration
        ↓
Reservation marked Completed
        ↓
Table becomes available
```

Operational states must be visible without opening each reservation individually.

---

## Workflow 5 — Reassign or Move Guests

```text
Staff selects active assignment
        ↓
Staff selects new table or seats
        ↓
System checks conflicts
        ↓
Staff confirms movement
        ↓
Previous assignment is released
        ↓
New assignment becomes active
        ↓
Timeline records movement
```

The reassignment workflow shall remain possible after arrival or seating.

---

# MVP Users and Roles

## Owner

May:

- access all restaurant data;
- configure floorplans;
- configure services;
- manage users;
- override conflicts;
- inspect timelines.

## Manager

May:

- create and modify reservations;
- cancel reservations;
- assign and move tables;
- override selected conflicts;
- manage service periods;
- inspect timelines.

## Host or Supervisor

May:

- create reservations;
- update basic reservation details;
- mark arrival;
- assign or move guests where permitted;
- view critical operational information.

The MVP does not require a complex permission engine.

Role permissions may be implemented using a small fixed permission matrix.

---

# Architecture Style

The MVP shall use a modular monolith.

```text
Browser
   │
   ▼
HELIX Reservations Application
   │
   ├── Presentation
   ├── Application Services
   ├── Domain Modules
   ├── Persistence
   └── Integration Boundaries
   │
   ▼
Relational Database
```

## Rationale

A modular monolith is selected because it:

- minimizes deployment complexity;
- supports fast iteration;
- preserves clear domain boundaries;
- is easier to operate than distributed services;
- allows later extraction of modules where justified;
- fits the scale of the first deployment.

The MVP shall not use microservices.

---

# Architectural Layers

## Presentation Layer

The Presentation Layer provides the operational user interface.

Initial interfaces:

- sign-in;
- service dashboard;
- reservation list;
- reservation detail;
- create and edit reservation form;
- floorplan view;
- floorplan configuration;
- service-period management.

The interface shall be optimized for desktop and tablet use.

Mobile browser support is desirable but not the primary MVP target.

---

## Application Layer

The Application Layer coordinates user actions and domain behavior.

Initial application services:

```text
ReservationApplicationService
ServicePeriodApplicationService
FloorplanApplicationService
AssignmentApplicationService
OperationalStatusApplicationService
UserAccessApplicationService
TimelineApplicationService
```

Responsibilities include:

- validating commands;
- loading required domain objects;
- applying domain rules;
- saving state;
- creating timeline events;
- returning user-facing results.

Application services shall not contain presentation logic.

---

## Domain Layer

The Domain Layer contains the business concepts and rules.

Initial domain modules:

```text
Reservations
Services
Floorplans
Assignments
Operations
Access
```

### Reservations Module

Owns:

- Reservation;
- Reservation Party;
- Reservation Contact;
- Reservation Source;
- Reservation Status;
- Reservation Note;
- Allergy Information;
- Reservation Change.

### Services Module

Owns:

- Service;
- Service Period;
- bookable arrival time;
- service opening and closing;
- expected duration defaults.

### Floorplans Module

Owns:

- Restaurant Area;
- Floorplan;
- Floorplan Version;
- Table;
- Seat;
- table capacity;
- seating geometry;
- operational availability.

### Assignments Module

Owns:

- Seating Assignment;
- assignment status;
- assignment validation;
- conflict detection;
- table movement;
- seat adjacency where required.

### Operations Module

Owns:

- arrival state;
- seating state;
- completion state;
- operational timestamps;
- current-service view.

### Access Module

Owns:

- User;
- Role;
- fixed MVP permissions.

---

## Infrastructure Layer

The Infrastructure Layer provides technical services.

Initial infrastructure:

- relational database;
- authentication;
- database migrations;
- application logging;
- error logging;
- backup and recovery;
- deployment configuration;
- environment configuration.

External reservation platform integrations are represented by boundaries only.

They are not implemented in the MVP.

---

# State and Timeline Pattern

Important business objects shall maintain:

```text
Current State
+
Meaningful Event Timeline
```

The MVP shall not implement full event sourcing.

Current state shall remain stored in normal relational records.

Meaningful events shall be appended to a timeline.

## Initial Timeline Events

```text
ReservationCreated
ReservationModified
ReservationConfirmed
ReservationCancelled
SeatingAssigned
SeatingChanged
SeatingReleased
GuestArrived
GuestSeated
ReservationCompleted
ReservationMarkedNoShow
ConflictOverridden
```

Each event should contain:

```yaml
event_id:
event_type:
occurred_at:
actor_id:
reservation_id:
service_period_id:
source:
summary:
previous_values:
new_values:
metadata:
```

Only meaningful operational changes require events.

Ordinary technical updates do not need business timeline entries.

---

# Core Data Model

The following describes the minimum logical data model.

It is not a final database schema.

## Restaurant

```yaml
restaurant_id:
name:
timezone:
status:
```

The MVP supports one active Restaurant but shall use a stable restaurant identifier.

---

## Restaurant Area

```yaml
area_id:
restaurant_id:
name:
area_type:
status:
```

Examples:

- Teppan;
- Sushi;
- Restaurant.

---

## Floorplan

```yaml
floorplan_id:
restaurant_id:
name:
status:
```

---

## Floorplan Version

```yaml
floorplan_version_id:
floorplan_id:
version_number:
effective_from:
effective_until:
status:
```

---

## Table

```yaml
table_id:
floorplan_version_id:
area_id:
display_label:
table_type:
minimum_capacity:
standard_capacity:
maximum_capacity:
allows_shared_seating:
position_x:
position_y:
width:
height:
rotation:
status:
```

---

## Seat

```yaml
seat_id:
table_id:
display_label:
position_x:
position_y:
sequence_number:
status:
```

Individual Seat records are required for Teppan and counter seating where position matters.

---

## Service

```yaml
service_id:
restaurant_id:
name:
default_start_time:
default_end_time:
default_duration_minutes:
status:
```

---

## Service Period

```yaml
service_period_id:
service_id:
restaurant_id:
service_date:
opens_at:
closes_at:
floorplan_version_id:
status:
```

---

## Reservation

```yaml
reservation_id:
restaurant_id:
service_period_id:
source_id:
status:
arrival_time:
expected_duration_minutes:
party_size:
preferred_area_id:
confirmed_area_id:
primary_contact_name:
phone_number:
email_address:
allergy_summary:
general_notes:
created_at:
updated_at:
```

---

## Reservation Source

```yaml
source_id:
name:
source_type:
status:
```

Initial sources:

- Website;
- Google;
- TheFork;
- Guestplan;
- Telephone;
- Walk-in;
- Staff Entry;
- Other.

The MVP uses the source as recorded information only.

No synchronization is implemented.

---

## Reservation Note

```yaml
note_id:
reservation_id:
note_type:
content:
is_critical:
created_by:
created_at:
```

Initial note types:

- Guest Request;
- Allergy;
- Accessibility;
- Special Occasion;
- Internal Operational;
- Seating Preference;
- Communication.

---

## Seating Assignment

```yaml
assignment_id:
reservation_id:
service_period_id:
status:
assignment_source:
starts_at:
ends_at:
created_by:
created_at:
released_at:
```

An assignment may reference:

- one or more Tables;
- one or more Seats.

---

## Assignment Resource

```yaml
assignment_resource_id:
assignment_id:
resource_type:
table_id:
seat_id:
```

The same model supports:

- full-table assignment;
- individual-seat assignment;
- multiple-table assignment.

---

## Timeline Event

```yaml
event_id:
restaurant_id:
service_period_id:
reservation_id:
event_type:
actor_id:
occurred_at:
summary:
payload:
```

The payload may use structured JSON for changed values and contextual metadata.

---

## User

```yaml
user_id:
restaurant_id:
name:
email:
password_hash:
role:
status:
```

---

# Reservation Status Model

Initial statuses:

```text
Draft
Pending
Confirmed
Cancelled
No-show
Arrived
Seated
Completed
Declined
```

The MVP should avoid unnecessary workflow complexity.

## Permitted Core Transitions

```text
Draft → Pending
Draft → Confirmed
Pending → Confirmed
Pending → Declined
Pending → Cancelled
Confirmed → Arrived
Confirmed → Cancelled
Confirmed → No-show
Arrived → Seated
Arrived → Cancelled
Seated → Completed
```

Authorized users may correct operational status mistakes.

Corrections shall create timeline events.

---

# Assignment Status Model

Initial assignment statuses:

```text
Proposed
Confirmed
Released
Completed
```

The MVP may skip `Proposed` during the first implementation and create only confirmed manual assignments.

The domain should still preserve the distinction for future automated suggestions.

---

# Conflict Detection

The MVP shall perform deterministic conflict checks.

## Time Overlap

Two time ranges overlap when:

```text
assignment_a.starts_at < assignment_b.ends_at

and

assignment_b.starts_at < assignment_a.ends_at
```

---

## Full-Table Conflict

A Table that does not allow shared seating shall not have overlapping confirmed assignments.

---

## Seat Conflict

An individual Seat shall not have overlapping confirmed assignments.

---

## Capacity Conflict

The assigned seating capacity shall be sufficient for the Reservation Party unless an authorized user overrides the warning.

---

## Shared-Table Conflict

A shared Table may host multiple Reservations only when:

- sharing is enabled;
- individual Seats are assigned;
- assigned Seats do not overlap;
- party Seats satisfy required adjacency where applicable.

---

## Service-Period Conflict

An assignment shall belong to the same Service Period as its Reservation.

---

## Resource Status Conflict

A disabled or blocked Table or Seat shall not be assigned unless an authorized override is recorded.

---

# Teppan MVP Rules

The first implementation must support the basic Konnichiwa Teppan model.

## Required

- Teppan Tables may expose individual Seats.
- Multiple Reservation Parties may share one Teppan Table.
- A party may be assigned multiple adjacent Seats.
- A Seat may belong to only one overlapping active assignment.
- Staff may manually select the exact Seats.
- The floorplan must visually distinguish occupied, assigned, and available Seats.

## Deferred

The MVP does not need to automate:

- ideal party placement;
- balancing chef workload;
- spacing between unrelated parties;
- meal-type pacing;
- predictive duration;
- automatic adjacent-seat selection.

These remain manual operational decisions in the MVP.

---

# Floorplan UI

The Floorplan shall show the selected Service Period.

## Required Visual Information

Each Table should display:

- display label;
- capacity;
- current assignment state;
- assigned reservation name where relevant;
- party size;
- reservation time;
- operational status.

Each Seat should visually indicate:

- available;
- assigned;
- occupied;
- unavailable.

## Required Interactions

Staff must be able to:

- select a reservation;
- select a Table or Seats;
- create an assignment;
- open the assigned Reservation;
- move a Reservation;
- release an assignment;
- mark arrival;
- mark seating;
- mark completion;
- view conflicts;
- view allergies and critical notes.

Drag-and-drop is desirable but not mandatory for the first release.

A click-based assignment workflow is acceptable if it is reliable and fast.

---

# Service Dashboard

The dashboard is the main operational entry point.

It shall display:

- selected date and Service Period;
- reservation count;
- total expected covers;
- unassigned Reservations;
- upcoming arrivals;
- arrived guests;
- seated guests;
- completed Reservations;
- cancelled Reservations;
- no-shows;
- critical allergy indicators;
- assignment conflicts.

The dashboard shall provide direct access to:

- reservation creation;
- reservation search;
- floorplan;
- service-period selection.

---

# Reservation List

The reservation list shall support:

- filtering by Service Period;
- search by guest name;
- search by telephone number;
- filtering by status;
- filtering by Area;
- visibility of assignment state;
- visibility of critical notes;
- sorting by arrival time.

The list is a supporting operational view.

It shall not replace the floorplan as the primary seating view.

---

# Reservation Form

The initial form shall contain:

## Required Fields

- primary contact name;
- telephone number;
- date;
- Service Period;
- arrival time;
- party size;
- Reservation Source.

## Optional Fields

- email address;
- preferred Area;
- expected duration;
- allergies;
- accessibility needs;
- special occasion;
- general notes.

The form shall support fast entry during a telephone call or floor conversation.

Advanced guest profiling is excluded.

---

# Floorplan Configuration

Authorized users shall be able to configure:

- Areas;
- Tables;
- Table labels;
- capacity;
- Table Type;
- shared-seating behavior;
- Seat count;
- Seat labels;
- position;
- dimensions;
- rotation;
- active status.

The first implementation may use a simple grid or coordinate canvas.

A fully advanced design editor is not required.

---

# Integration Boundaries

The internal architecture shall define future ports for:

```text
ReservationImportPort
ReservationExportPort
GuestNotificationPort
AuthenticationPort
AuditPort
```

The MVP may use internal implementations or no-op adapters.

Example:

```text
External Platform
        ↓
Future Integration Adapter
        ↓
Reservation Application Service
        ↓
Reservation Domain
```

External integrations shall not write directly to the database.

---

# Security and Access

The MVP shall provide:

- authenticated access;
- password hashing;
- role-based authorization;
- protection against unauthorized restaurant access;
- server-side input validation;
- protected operational notes;
- secure environment configuration;
- basic audit attribution.

Sensitive values shall not be stored in source control.

---

# Privacy

The MVP shall collect only information required for reservation operations.

It shall support later implementation of:

- retention rules;
- data export;
- data correction;
- deletion or anonymization;
- marketing-consent separation.

Marketing consent shall not be inferred from reservation creation.

---

# Reliability

The MVP is intended for live operational testing.

It therefore requires:

- database backups;
- migration management;
- application error logging;
- recoverable deployment;
- visible failure messages;
- prevention of silent write failure;
- safe handling of duplicate form submission.

The application shall not depend on an AI service.

---

# Performance

Target operational performance:

```yaml
screen_load_target: under 2 seconds
reservation_search_target: under 1 second
reservation_save_target: under 1 second
assignment_validation_target: under 1 second
floorplan_interaction_target: immediate user feedback
```

These are design targets for normal single-location use.

---

# Proposed Technical Shape

The architecture does not mandate one vendor, but the implementation should use a conservative web stack.

A suitable shape is:

```text
Web Application
├── Server-rendered or hybrid frontend
├── Application and domain modules
├── Relational database
├── Authentication
├── Migration tooling
└── Single deployment unit
```

Suitable technology characteristics:

- typed application code;
- strong relational database support;
- testable business logic;
- maintainable UI components;
- straightforward deployment;
- support for background jobs later;
- support for APIs later.

A final stack decision should be recorded separately only when implementation begins.

---

# Suggested Module Structure

```text
implementation/
├── app/
│   ├── reservations/
│   ├── services/
│   ├── floorplans/
│   ├── assignments/
│   ├── operations/
│   ├── access/
│   └── timeline/
│
├── ui/
│   ├── dashboard/
│   ├── reservations/
│   ├── floorplan/
│   └── shared/
│
├── database/
│   ├── schema/
│   ├── migrations/
│   └── seed/
│
├── infrastructure/
│   ├── authentication/
│   ├── persistence/
│   ├── logging/
│   └── configuration/
│
└── tests/
```

This structure may be adapted to the selected framework while preserving module boundaries.

---

# MVP Screens

The MVP requires six primary screens.

## Screen 1 — Sign In

Purpose:

Provide authenticated access.

---

## Screen 2 — Service Dashboard

Purpose:

Show the current operational state of the selected service.

---

## Screen 3 — Reservation List

Purpose:

Find, filter, and inspect reservations.

---

## Screen 4 — Reservation Detail and Form

Purpose:

Create and modify a reservation.

---

## Screen 5 — Floorplan

Purpose:

Assign, move, and monitor guests and seating resources.

---

## Screen 6 — Floorplan Configuration

Purpose:

Configure Areas, Tables, Seats, and layout.

Configuration may initially be restricted to Owner and Manager roles.

---

# MVP Acceptance Criteria

The MVP is operationally ready for pilot testing when the following conditions are met.

## Reservation Management

- Staff can create a Reservation.
- Every Reservation receives one stable internal identifier.
- Staff can search by name or telephone number.
- Staff can modify a Reservation.
- Staff can cancel a Reservation.
- Reservation Source remains visible.
- Allergies and critical notes are clearly visible.
- Important changes appear in the timeline.

## Service Management

- Staff can create or open a Service Period.
- Reservations can be viewed by Service Period.
- The dashboard shows expected covers and operational statuses.
- Staff can move between service dates and periods.

## Floorplan

- Konnichiwa Areas can be represented.
- Tables can be positioned and labelled.
- Teppan Seats can be represented individually.
- A Reservation can be assigned to a Table.
- A Reservation can be assigned to selected Seats.
- Shared Teppan seating can be represented.
- Conflicting assignment is prevented or clearly warned.
- Staff can move a Reservation.
- Staff can release an assignment.

## Service Operation

- Staff can mark a guest Arrived.
- Staff can mark a guest Seated.
- Staff can mark a Reservation Completed.
- Staff can mark a No-show.
- Changes are reflected immediately on the dashboard and floorplan.

## Resilience

- The application remains usable without external booking systems.
- The application remains usable without AI.
- Write failures are visible.
- Database backup and recovery are documented.
- Core actions are protected by authentication and permissions.

---

# Pilot Validation

The MVP should be tested in three stages.

## Stage 1 — Simulated Service

Use sample Reservations and a replica of the Konnichiwa Floorplan.

Validate:

- data model;
- floorplan usability;
- conflict logic;
- status changes;
- assignment speed.

---

## Stage 2 — Shadow Operation

Use the MVP alongside the current reservation process without replacing it.

Staff reproduce current Reservations inside HELIX Reservations.

Validate:

- missing information;
- usability;
- operational terminology;
- assignment behavior;
- differences from Guestplan;
- staff workload.

The existing system remains authoritative during this stage.

---

## Stage 3 — Controlled Operational Pilot

Use HELIX Reservations for a limited service, Area, or operational workflow.

Possible first pilot:

```text
Manual telephone and walk-in Reservations
+
Internal Floorplan Planning
```

External platform Reservations may still be entered or verified manually.

The pilot should not immediately replace all existing reservation channels.

---

# Pilot Success Measures

The pilot should measure:

- time required to create a Reservation;
- time required to find a Reservation;
- time required to assign seating;
- number of duplicate entries;
- number of seating conflicts;
- number of missing allergy or note indicators;
- number of manual workarounds;
- staff confidence;
- usability during busy periods;
- accuracy compared with the existing process.

Initial target outcomes should be established after baseline observation.

---

# Known Risks

## Risk 1 — Floorplan Complexity

Konnichiwa’s shared Teppan seating may require more detailed Seat logic than expected.

Response:

Begin with manual exact-seat selection and avoid automatic optimization.

---

## Risk 2 — Duplicate Operational Administration

Shadow testing may temporarily increase staff workload.

Response:

Limit shadow testing to selected services and defined roles.

---

## Risk 3 — Overbuilding Configuration

Designing for every restaurant type may delay the first pilot.

Response:

Implement Konnichiwa requirements first while preserving clean boundaries.

---

## Risk 4 — Status Confusion

Reservation Status, guest arrival state, and Assignment Status may become mixed.

Response:

Keep them explicit in the model and UI.

---

## Risk 5 — Floorplan Editor Delays Core Testing

A complex visual editor may consume excessive development time.

Response:

Allow basic coordinate-based configuration or seeded layouts for the first pilot.

---

## Risk 6 — Premature Integration Work

External platform investigation may distract from the operational core.

Response:

Do not implement external synchronization until the floorplan workflow is validated.

---

# Deferred Architectural Decisions

The following decisions are intentionally deferred:

- final frontend framework;
- final backend framework;
- hosting provider;
- cloud architecture;
- native mobile applications;
- message queue;
- event streaming;
- microservices;
- public API format;
- platform extraction;
- multi-tenancy;
- external integration contracts;
- AI provider;
- automatic assignment algorithm.

These decisions should be made when required by a concrete implementation or product need.

---

# First Build Sequence

The recommended implementation order is:

```text
1. Project setup
2. Authentication and fixed roles
3. Restaurant and Area seed data
4. Service and Service Period
5. Reservation creation and list
6. Reservation detail and timeline
7. Floorplan configuration
8. Table and Seat rendering
9. Manual Seating Assignment
10. Conflict detection
11. Arrival, seating, and completion workflow
12. Service dashboard
13. Simulated service testing
14. Shadow-operation pilot
```

External integrations are not part of this sequence.

---

# MVP Completion Boundary

The MVP is complete when Konnichiwa staff can use one internal application to:

```text
Create a Reservation
        ↓
See it in the selected Service Period
        ↓
Assign it to a Table or Teppan Seats
        ↓
Identify assignment conflicts
        ↓
Record guest arrival
        ↓
Record seating
        ↓
Move the party when required
        ↓
Complete the visit
        ↓
Review the meaningful timeline
```

Anything beyond this flow requires separate justification.

---

# Conclusion

The HELIX Reservations MVP is a modular, single-location operational application centered on Reservations, Service Periods, and the Floorplan.

Its purpose is to validate the most important and most difficult product behavior:

> Can restaurant staff reliably turn reservation demand into a workable live seating plan during real service?

The MVP shall prioritize operational usability, explicit state, manual control, and reliable conflict detection.

External integrations, generalized platform services, advanced automation, and AI shall follow only after the operational core has been proven.