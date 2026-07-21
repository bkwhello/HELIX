# CAP-MAP-001 — HELIX Reservations Capability Map

## Metadata

```yaml
artifact_id: CAP-MAP-001
solution_id: PRD-001
title: HELIX Reservations Capability Map
artifact_type: Capability Map
version: 0.1.0
status: Draft
owner: Product Owner
architect: Principal HELIX Architect
```

---

# Purpose

This document defines the capabilities provided by HELIX Reservations.

The capability map provides the architectural structure of the solution.

It answers:

- What capabilities exist?
- Which capability owns which responsibility?
- Which capabilities depend on others?
- Which capabilities belong to the MVP?
- Which capabilities differentiate HELIX Reservations?

The capability map does not describe:

- workflows;
- UI screens;
- APIs;
- implementation details;
- database structures.

Those belong elsewhere.

---

# Capability Definition

A Solution Capability is a stable ability provided by HELIX Reservations that produces a meaningful operational outcome.

Capabilities describe **what** the solution can do.

They do not describe:

- processes;
- implementation;
- teams;
- technology;
- UI pages.

---

# Capability Hierarchy

HELIX Reservations organizes capabilities into three levels.

```
Capability Domain (L1)
        ↓
Solution Capability (L2)
        ↓
Capability Components (L3)
```

Only L1 and L2 are governed by this document.

L3 components are defined when implementation begins.

---

# Capability Domains

```
HELIX Reservations

├── Reservation Demand
├── Service Planning
├── Spatial Planning
├── Seating Operations
├── Guest Information
├── Communication
├── Integration
├── Control & Insight
└── Intelligence
```

---

# Domain Overview

## CAP-D01 — Reservation Demand

Purpose

Receive and manage reservation requests.

Capabilities

| ID | Capability | MVP | Status |
|----|------------|:---:|--------|
| CAP-D01.01 | Reservation Management | ✅ | Designed |
| CAP-002 | Reservation Source Management | ✅ | |
| CAP-003 | Reservation Change Management | ✅ | |
| CAP-004 | Walk-in & Waitlist Management | Partial | |

---

## CAP-D02 — Service Planning

Purpose

Prepare restaurant services before guests arrive.

Capabilities

| ID | Capability | MVP |
|----|------------|:---:|
| CAP-005 | Service Management | ✅ |
| CAP-006 | Service Period Management | ✅ |
| CAP-007 | Availability Management | ✅ |
| CAP-008 | Capacity & Pacing Management | Future |

---

## CAP-D03 — Spatial Planning

Purpose

Represent the restaurant layout.

Capabilities

| ID | Capability | MVP |
|----|------------|:---:|
| CAP-009 | Restaurant Area Management | ✅ |
| CAP-010 | Floorplan Management | ✅ |
| CAP-011 | Table & Seat Management | ✅ |
| CAP-012 | Table Combination Management | Future |

---

## CAP-D04 — Seating Operations

Purpose

Turn reservations into seated guests.

Capabilities

| ID | Capability | MVP |
|----|------------|:---:|
| CAP-013 | Seating Assignment | ✅ |
| CAP-014 | Assignment Conflict Management | ✅ |
| CAP-015 | Guest Arrival Management | ✅ |
| CAP-016 | Live Service Management | ✅ |
| CAP-017 | Table Release & Turn Management | ✅ |

---

## CAP-D05 — Guest Information

Purpose

Manage operational guest information.

Capabilities

| ID | Capability | MVP |
|----|------------|:---:|
| CAP-018 | Reservation Contact Management | ✅ |
| CAP-019 | Allergy & Critical Note Management | ✅ |
| CAP-020 | Guest Preference Management | Future |
| CAP-021 | Guest Profile Reference | Future |

---

## CAP-D06 — Communication

Purpose

Communicate reservation-related events.

Capabilities

| ID | Capability | MVP |
|----|------------|:---:|
| CAP-022 | Reservation Confirmation | Future |
| CAP-023 | Reminder Management | Future |
| CAP-024 | Change Notification | Future |
| CAP-025 | Internal Operational Notifications | Future |

---

## CAP-D07 — Integration

Purpose

Integrate external reservation platforms.

Capabilities

| ID | Capability | MVP |
|----|------------|:---:|
| CAP-026 | Reservation Import | Future |
| CAP-027 | Reservation Export | Future |
| CAP-028 | External Identity Mapping | Future |
| CAP-029 | Synchronization Management | Future |
| CAP-030 | Integration Conflict Management | Future |

---

## CAP-D08 — Control & Insight

Purpose

Provide operational visibility.

Capabilities

| ID | Capability | MVP |
|----|------------|:---:|
| CAP-031 | Reservation Timeline | ✅ |
| CAP-032 | Operational Audit | ✅ |
| CAP-033 | Service Dashboard | ✅ |
| CAP-034 | Reservation Reporting | Future |
| CAP-035 | Operational Analytics | Future |

---

## CAP-D09 — Intelligence

Purpose

Assist staff through recommendations and learning.

Capabilities

| ID | Capability | MVP |
|----|------------|:---:|
| CAP-036 | Seating Recommendation | Future |
| CAP-037 | Demand Forecasting | Future |
| CAP-038 | Duration Prediction | Future |
| CAP-039 | Operational Risk Detection | Future |
| CAP-040 | AI Operations Assistant | Future |

---

# Capability Dependency Map

```
Reservation Management
        │
        ▼
Service Period Management
        │
        ▼
Availability Management
        │
        ▼
Floorplan Management
        │
        ▼
Seating Assignment
        │
        ▼
Live Service Management
        │
        ▼
Reservation Timeline
        │
        ▼
Service Dashboard
```

This represents capability dependencies.

It is **not** a workflow.

---

# Capability Classification

## Core

These capabilities define HELIX Reservations.

- Reservation Management
- Floorplan Management
- Seating Assignment
- Live Service Management
- Reservation Timeline

---

## Supporting

These capabilities enable operation.

- User Access
- Service Dashboard
- Reservation Source Management
- Operational Audit

---

## Integration

These capabilities connect external systems.

- Reservation Import
- Reservation Export
- Synchronization
- External Identity Mapping

---

## Intelligence

These capabilities extend the operational core.

- AI Operations Assistant
- Forecasting
- Recommendations
- Prediction

---

# MVP Capability Boundary

The MVP includes only:

```
CAP-D01.01
CAP-002
CAP-003

CAP-005
CAP-006
CAP-007

CAP-009
CAP-010
CAP-011

CAP-013
CAP-014
CAP-015
CAP-016
CAP-017

CAP-018
CAP-019

CAP-031
CAP-032
CAP-033
```

Everything else remains outside the MVP.

---

# Capability Lifecycle

Each capability progresses independently.

```
Identified
        ↓
Scoped
        ↓
Designed
        ↓
In Development
        ↓
Pilot
        ↓
Active
        ↓
Optimized
        ↓
Retired
```

Capabilities do not have to progress together.

---

# Capability Maturity

Operational maturity is measured separately.

| Level | Meaning |
|--------|---------|
| M0 | Not Available |
| M1 | Manual |
| M2 | Digitally Supported |
| M3 | Integrated |
| M4 | Optimized |
| M5 | Adaptive |

Example:

```
Reservation Management

Status: Pilot
Maturity: M2
```

---

# Capability Ownership

Each capability owns:

- its business rules;
- its domain concepts;
- its operational responsibilities;
- its implementation modules.

Capabilities may depend upon one another.

Capabilities shall not duplicate ownership.

---

# Engineering Rule

A capability receives its own engineering folder only when active work begins.

Example:

```
capabilities/

├── capability-map.md

├── capability-registry.yaml

└── active/

    ├── CAP-013-seating-assignment/

    ├── CAP-015-guest-arrival/

    └── CAP-031-reservation-timeline/
```

Inactive capabilities remain entries in this map.

---

# Architectural Principles

The capability map follows these principles:

1. Capabilities describe abilities, not implementations.
2. Capabilities are stable over time.
3. Capabilities own business responsibility.
4. Capabilities may depend on one another.
5. Capabilities evolve independently.
6. Implementation follows capability ownership.
7. The capability map remains technology independent.

---

# Success Criteria

The capability map succeeds when it enables engineers to answer:

- What should we build next?
- Which capability owns this feature?
- Which capability is affected?
- Which capabilities depend upon this change?
- Does this belong inside the MVP?

without referring to implementation details.

---

# Conclusion

The HELIX Reservations Capability Map provides the architectural blueprint of the solution.

It separates long-lived business capabilities from implementation, allowing the solution to evolve incrementally while preserving clear ownership, stable boundaries, and alignment with the operational goals of the restaurant.