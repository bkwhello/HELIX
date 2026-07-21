# CA-001 — Capability Architecture Standard

## Metadata

```yaml
artifact_id: CA-001
title: Capability Architecture Standard
artifact_type: Engineering Standard
version: 1.1.0
status: Active
owner: HELIX Foundation
authority: Principal HELIX Architect
applies_to:
  - HELIX solutions
  - solution capabilities
  - capability engineering artifacts
  - capability implementation planning
```

---

# 1. Purpose

This standard defines how capabilities are identified, structured, engineered, implemented, validated, and evolved within HELIX solutions.

It establishes a consistent capability architecture that can be understood and used by:

- product owners;
- organizational engineers;
- solution architects;
- software engineers;
- quality engineers;
- AI engineering agents;
- operational stakeholders.

The standard exists to ensure that a capability is understood as an operational ability before it is implemented as software.

---

# 2. Objective

The objective of this standard is to create a stable path from organizational need to working solution behavior.

```text
Organizational Need
        ↓
Solution Capability
        ↓
Capability Architecture
        ↓
Implementation
        ↓
Validation
        ↓
Operational Use
        ↓
Evolution
```

Capability architecture shall define business behavior independently from implementation technology.

---

# 3. Capability Definition

A **Solution Capability** is:

> A stable ability provided by a HELIX solution that produces a meaningful operational outcome within a defined responsibility boundary.

A capability describes what a solution enables.

A capability does not describe:

- a user-interface screen;
- a software component;
- a database table;
- an API endpoint;
- a development task;
- a user story;
- a team;
- a process step;
- an external platform;
- a technology choice.

Example:

```text
Seating Assignment
```

is a capability.

The following are not capabilities:

```text
Floorplan Page
Assignment API
Drag-and-Drop Component
Seating Database Table
```

These are possible implementations or interfaces of the capability.

---

# 4. Scope

This standard applies to all solution capabilities that require explicit engineering.

It governs:

- capability identity;
- capability purpose;
- capability responsibility;
- state ownership;
- event definition;
- business rules;
- capability interaction;
- acceptance criteria;
- implementation traceability;
- operational validation;
- capability evolution.

This standard does not define:

- organizational capability modeling;
- product strategy;
- software coding conventions;
- infrastructure architecture;
- API design conventions;
- database design conventions;
- governance approval procedures.

Those concerns are owned by their respective HELIX artifacts.

---

# 5. Architectural Position

Capabilities form the bridge between organizational outcomes and implementation.

```text
Organizational Capability
        │
        │ enabled by
        ▼
HELIX Solution
        │
        │ provides
        ▼
Solution Capability
        │
        │ realized by
        ▼
Implementation Modules
        │
        │ operated through
        ▼
Operational Workflows
```

Organizational capabilities and solution capabilities shall not be treated as identical.

An organizational capability describes what the organization can do.

A solution capability describes what a HELIX solution provides to support or improve that organizational ability.

---

# 6. Core Principles

## 6.1 Capability Before Implementation

Capability behavior shall be understood before implementation begins.

Technology shall realize the capability.

Technology shall not define the capability.

---

## 6.2 Stable Responsibility

Each capability shall have a clear and stable responsibility boundary.

A capability may evolve, but its fundamental purpose should remain recognizable over time.

---

## 6.3 Single Primary Ownership

Every significant domain concept, rule, state transition, and meaningful event shall have one primary owning capability.

Other capabilities may use that concept.

They shall not redefine its authoritative meaning.

---

## 6.4 State and Timeline

Where operationally meaningful, a capability shall preserve:

```text
Current State
+
Meaningful Event Timeline
```

Current state provides efficient access to operational truth.

Events preserve meaningful history.

This standard does not require full event sourcing.

---

## 6.5 Operational Reality First

Capability architecture shall reflect actual organizational and operational behavior.

Generic software assumptions shall not override observed operational reality.

---

## 6.6 Human Authority

Where staff remain operationally accountable, automation shall support rather than silently replace human authority.

Manual decisions and overrides shall be explicit and attributable where operational risk requires it.

---

## 6.7 Explainable Automation

Automated decisions and recommendations shall be explainable in terms of capability rules, inputs, and constraints.

---

## 6.8 Proportional Engineering

Capability documentation shall scale according to:

- consequence;
- uncertainty;
- complexity;
- operational risk;
- expected reuse;
- number of interactions;
- degree of automation.

Simple capabilities shall remain lightweight.

Complex or high-risk capabilities shall receive deeper engineering.

---

## 6.9 Implementation Independence

Capability architecture shall remain independent from:

- programming language;
- framework;
- database;
- hosting provider;
- integration vendor;
- user-interface technology.

---

## 6.10 Continuous Evolution

A capability is not permanently complete.

It may continue to evolve through operational learning, validation, and changing organizational needs.

---

# 7. Capability Identity

Every capability shall have:

```yaml
id:
name:
slug:
solution:
domain:
type:
delivery_status:
operational_maturity:
```

Example:

```yaml
id: CAP-D04.01
name: Seating Assignment
slug: seating-assignment
solution: HELIX Reservations
domain: CAP-D04
type: Core
delivery_status: Designed
operational_maturity: M1
```

---

# 8. Capability Identifier

The standard identifier format is:

```text
CAP-DNN.NN
```

Where:

```text
CAP     Capability
DNN     Capability domain
.NN     Capability sequence within the domain
```

Example:

```text
CAP-D04.01
```

Capability identifiers shall remain stable after activation.

A capability name may be refined without changing the identifier when its responsibility remains materially unchanged.

A new identifier shall be created when the responsibility boundary changes fundamentally.

---

# 9. Capability Types

Every capability shall be assigned one primary type.

## 9.1 Core

Directly provides the principal operational value or differentiation of the solution.

Examples:

- Reservation Management
- Seating Assignment
- Order Management
- Inventory Counting

---

## 9.2 Supporting

Enables the solution to operate but is not its primary differentiator.

Examples:

- User Access
- Configuration
- Reporting
- Contact Management

---

## 9.3 Integration

Exchanges information or behavior with external systems.

Examples:

- Reservation Import
- POS Synchronization
- External Identity Mapping

---

## 9.4 Intelligence

Provides prediction, recommendation, detection, explanation, or assisted decision-making.

Examples:

- Demand Forecasting
- Seating Recommendation
- Operational Risk Detection

Intelligence capabilities shall not own authoritative operational state unless explicitly justified and approved.

---

# 10. Capability Architecture Model

Every actively engineered capability shall be described through six architectural views.

```text
Capability

├── Identity
├── State
├── Events
├── Rules
├── Interactions
└── Acceptance
```

These views define the capability independently from implementation.

---

# 11. Required Capability Folder

An actively engineered capability shall use the following structure:

```text
capabilities/
└── active/
    └── CAP-DNN.NN-capability-slug/
        ├── capability.md
        ├── state-model.md
        ├── event-model.md
        ├── rule-model.md
        ├── interaction-model.md
        └── acceptance.md
```

Example:

```text
capabilities/
└── active/
    └── CAP-D04.01-seating-assignment/
        ├── capability.md
        ├── state-model.md
        ├── event-model.md
        ├── rule-model.md
        ├── interaction-model.md
        └── acceptance.md
```

A capability folder shall be created only when active engineering begins.

Identified, deferred, or low-complexity capabilities may remain only in the capability registry.

---

# 12. Proportional Artifact Structure

Not every capability requires six separate files.

## 12.1 Lightweight Capability

Use one file when:

- behavior is simple;
- risk is low;
- state is minimal;
- interactions are limited;
- rules are few.

Structure:

```text
CAP-DNN.NN-capability-slug/
└── capability.md
```

The single file shall contain all required views.

---

## 12.2 Standard Capability

Use the full six-file structure when:

- the capability owns meaningful state;
- multiple rules exist;
- interactions cross capability boundaries;
- operational validation is required;
- implementation will involve multiple modules.

---

## 12.3 Extended Capability

Additional artifacts may be added when justified.

Examples:

```text
examples.md
decision-table.md
operational-scenarios.md
risk-model.md
data-contract.md
```

Additional artifacts shall not duplicate existing authoritative content.

---

# 13. capability.md

The `capability.md` file defines the identity and responsibility contract of the capability.

Minimum structure:

```markdown
# CAP-DNN.NN — Capability Name

## Metadata

## Purpose

## Operational Outcome

## Responsibility

## In Scope

## Out of Scope

## Owns

## Inputs

## Outputs

## Dependencies

## Provides To

## Users and Actors

## Constraints

## Current Delivery Status

## Current Operational Maturity

## References
```

---

# 14. Purpose

The purpose shall explain why the capability exists.

It shall describe an operational ability, not an implementation.

Good example:

```text
Allocate reservation parties to suitable seating resources for a defined
service period.
```

Poor example:

```text
Provide a React interface that stores assignments in PostgreSQL.
```

---

# 15. Operational Outcome

Every capability shall define the operational outcome it makes possible.

Example:

```text
Restaurant staff can determine where a party will sit without creating
resource conflicts or exceeding seating capacity.
```

The operational outcome shall be observable and testable.

---

# 16. Responsibility Boundary

The responsibility section shall state what the capability is authoritative for.

Example:

```text
Seating Assignment owns the creation, confirmation, modification, release,
and completion of seating allocations.
```

It shall also state what the capability does not own.

Example:

```text
Seating Assignment does not own reservation identity, floorplan definition,
or guest contact information.
```

---

# 17. Scope

Every capability shall define:

## In Scope

Responsibilities directly owned by the capability.

## Out of Scope

Related responsibilities owned elsewhere or intentionally deferred.

Example:

```markdown
## In Scope

- assign a reservation to one or more seating resources;
- confirm an assignment;
- modify an assignment;
- release an assignment;
- complete an assignment.

## Out of Scope

- creating reservations;
- designing the floorplan;
- predicting the best assignment;
- sending guest confirmations.
```

---

# 18. Ownership

A capability may own:

- domain concepts;
- business states;
- state transitions;
- business rules;
- meaningful events;
- operational decisions;
- commands;
- decision outcomes.

Ownership shall be explicit.

Example:

```yaml
owns:
  concepts:
    - Seating Assignment
    - Assignment Resource
    - Assignment Status

  rules:
    - assignment creation
    - assignment confirmation
    - assignment release

  events:
    - SeatingAssigned
    - SeatingChanged
    - SeatingReleased
```

A concept shall not have multiple primary owners.

---

# 19. Inputs

Inputs describe information or requests required by the capability.

Examples:

- Reservation;
- Service Period;
- Seating Resource;
- User Decision;
- Availability Result;
- External Reservation Payload.

Inputs shall be expressed as business information, not transport mechanisms.

Use:

```text
Reservation Change Request
```

Do not use:

```text
POST /api/reservation/update
```

---

# 20. Outputs

Outputs describe information, decisions, state changes, or events produced by the capability.

Examples:

- Seating Assignment;
- Conflict Result;
- Reservation Status;
- Timeline Event;
- Availability Decision.

Outputs shall not be restricted to user-interface responses.

---

# 21. State Model

The `state-model.md` file defines the current business truth owned by the capability.

It shall contain:

```markdown
# State Model

## Owned State

## State Definitions

## State Transitions

## Transition Preconditions

## Terminal States

## Invalid Transitions

## Correction Rules

## State Invariants
```

---

# 22. State Requirements

A state model shall define:

- the authoritative state;
- valid states;
- permitted transitions;
- transition conditions;
- terminal states;
- invalid transitions;
- correction behavior;
- invariants.

Example:

```text
Proposed
    ↓
Confirmed
    ↓
Completed

Confirmed
    ↓
Released
```

A state model shall not be used as a substitute for a workflow.

State describes what is true.

Workflow describes how work is performed.

---

# 23. State Transition Table

State transitions should be expressed using a table.

Example:

| Current State | Action | New State | Preconditions |
|---|---|---|---|
| Proposed | Confirm Assignment | Confirmed | No unresolved blocking conflict |
| Confirmed | Release Assignment | Released | Assignment has not completed |
| Confirmed | Complete Assignment | Completed | Party has finished service |
| Released | Restore Assignment | Confirmed | Resources remain available |

Invalid transitions shall be explicit where operationally important.

---

# 24. State Invariants

A state invariant is a condition that shall always remain true.

Example:

```text
A completed assignment cannot become proposed.
```

```text
An assignment shall belong to exactly one service period.
```

```text
A released assignment shall not occupy seating resources.
```

State invariants shall be testable.

---

# 25. Event Model

The `event-model.md` file defines meaningful business events emitted or recorded by the capability.

It shall contain:

```markdown
# Event Model

## Event Principles

## Events

## Event Definitions

## Event Payload Requirements

## Event Producers

## Event Consumers

## Timeline Visibility

## Event Preservation
```

---

# 26. Business Event Definition

A business event represents something meaningful that has occurred.

Event names shall use past tense.

Examples:

```text
ReservationCreated
ReservationCancelled
GuestArrived
SeatingAssigned
TableReleased
```

Avoid technical event names such as:

```text
DatabaseRowUpdated
ApiCallCompleted
ButtonClicked
```

unless the technical event is itself operationally meaningful.

---

# 27. Event Requirements

Each event shall define:

```yaml
name:
meaning:
trigger:
required_data:
actor:
consumers:
timeline_visibility:
```

Example:

```yaml
name: SeatingAssigned

meaning: >
  A reservation party has been allocated to one or more seating resources.

trigger: >
  An authorized assignment is successfully confirmed.

required_data:
  - assignment_id
  - reservation_id
  - service_period_id
  - seating_resource_ids
  - effective_start
  - effective_end
  - actor_id
  - occurred_at

consumers:
  - Live Service Management
  - Reservation Timeline
  - Service Dashboard

timeline_visibility: operational
```

---

# 28. Event Preservation

Meaningful events shall be immutable after recording.

Corrections shall be represented through new events rather than silent mutation where accountability matters.

Example:

```text
GuestArrived
ArrivalStatusCorrected
```

The original event remains preserved.

---

# 29. Event Categories

Events may be classified as:

- domain event;
- operational event;
- integration event;
- audit event;
- intelligence event.

A single event may be visible in more than one context, but shall have one authoritative meaning.

---

# 30. Rule Model

The `rule-model.md` file defines business rules and invariants enforced by the capability.

It shall contain:

```markdown
# Rule Model

## Rule Principles

## Invariants

## Decision Rules

## Validation Rules

## Authorization Rules

## Override Rules

## Exception Rules

## Rule Traceability
```

---

# 31. Rule Identifier

Every significant rule shall receive a stable identifier.

Format:

```text
CAP-DNN.NN-RNN
```

Example:

```text
CAP-D04.01-R01
```

Example definition:

```yaml
id: CAP-D04.01-R01
name: Assignment Requires Service Period

statement: >
  Every seating assignment shall belong to exactly one service period.

type: Invariant

severity: Blocking
```

---

# 32. Rule Types

Rules may be classified as:

## Invariant

Must always remain true.

## Validation Rule

Determines whether an input or proposed change is acceptable.

## Decision Rule

Produces a business decision from known inputs.

## Authorization Rule

Determines who may perform an action.

## Override Rule

Defines when and how a rule may be intentionally bypassed.

## Exception Rule

Defines behavior under exceptional operational conditions.

---

# 33. Rule Severity

Rules should be classified by consequence.

```text
Advisory
Warning
Blocking
Critical
```

## Advisory

Provides guidance but does not prevent action.

## Warning

Requires user awareness but may allow continuation.

## Blocking

Prevents the action unless a valid override exists.

## Critical

Protects safety, legal compliance, or essential operational integrity.

Critical rules shall not be silently bypassed.

---

# 34. Override Rules

Where manual override is allowed, the rule shall define:

- who may override;
- required reason;
- required evidence;
- effect of the override;
- event generated;
- audit requirement;
- expiry, where applicable.

Example:

```yaml
override:
  allowed: true
  authorized_roles:
    - Manager
    - Owner
  reason_required: true
  audit_required: true
  event: AssignmentConflictOverridden
```

---

# 35. Interaction Model

The `interaction-model.md` file defines how the capability collaborates with other capabilities and external actors.

It shall contain:

```markdown
# Interaction Model

## Actors

## Incoming Interactions

## Outgoing Interactions

## Capability Dependencies

## Commands Received

## Decisions Requested

## Events Published

## Information Provided

## Failure and Degraded Behavior

## Interaction Constraints
```

---

# 36. Interaction Principles

Capability interactions shall be described using business semantics.

Good:

```text
Reservation Management requests assignment validation.
```

Poor:

```text
ReservationService calls AssignmentService over HTTP.
```

The implementation may use HTTP, messaging, direct function calls, or another mechanism.

The capability interaction remains stable regardless of that choice.

---

# 37. Interaction Types

Interactions may include:

- command;
- query;
- decision request;
- event;
- notification;
- information reference;
- external import;
- external export.

---

# 38. Interaction Contract

Every significant interaction shall define:

```yaml
interaction:
  name:
  direction:
  source:
  target:
  purpose:
  input:
  output:
  failure_behavior:
```

Example:

```yaml
interaction:
  name: Request Seating Assignment
  direction: incoming
  source: Reservation Management
  target: Seating Assignment
  purpose: >
    Request allocation of a reservation party to seating resources.
  input:
    - reservation
    - service_period
    - requested_time
    - party_size
  output:
    - assignment_result
    - conflict_result
  failure_behavior:
    - return explicit rejection
    - preserve current assignment state
```

---

# 39. Dependency Rules

A capability may depend on another capability when it requires its information or behavior.

Dependencies shall not be used merely to show implementation imports.

A dependency shall answer:

> What operational ability or authoritative information is required?

Circular dependencies shall be avoided.

Where mutual interaction is necessary, ownership and direction shall remain explicit.

---

# 40. Degraded Operation

Capabilities that depend on external systems or intelligence shall define degraded behavior.

Examples:

- continue manual reservation entry when an external channel is unavailable;
- preserve local operational state when synchronization fails;
- allow manual seating assignment when recommendations are unavailable;
- queue communication when a provider is temporarily unavailable.

A capability shall not become unusable solely because an optional intelligence capability fails.

---

# 41. Acceptance Model

The `acceptance.md` file defines the evidence required to show that the capability works.

It shall contain:

```markdown
# Acceptance Model

## Operational Acceptance

## Functional Acceptance

## Rule Acceptance

## State Acceptance

## Event Acceptance

## Interaction Acceptance

## Failure Acceptance

## Security and Authorization Acceptance

## Performance Acceptance

## Pilot Acceptance

## Evidence
```

---

# 42. Acceptance Principle

Acceptance criteria shall prove operational capability, not merely software output.

Poor acceptance:

```text
The API returns status 200.
```

Better acceptance:

```text
An authorized staff member can assign a confirmed reservation to an available
table and the assignment becomes visible on the active service floorplan.
```

Technical acceptance may support operational acceptance.

It shall not replace it.

---

# 43. Acceptance Criterion Format

Recommended format:

```text
Given
When
Then
And
```

Example:

```text
Given a confirmed reservation for four guests
and an available table with capacity four

When an authorized user confirms the seating assignment

Then the assignment becomes Confirmed
and the table is unavailable for overlapping assignments
and SeatingAssigned is appended to the reservation timeline.
```

---

# 44. Acceptance Categories

Every standard capability should consider:

## Happy Path

The intended action succeeds.

## Rule Enforcement

Invalid actions are rejected or warned.

## State Transition

The expected state changes correctly.

## Event Production

Meaningful events are recorded.

## Interaction

Dependent capabilities receive or expose required information.

## Failure Behavior

Partial failure does not corrupt business state.

## Authorization

Unauthorized actors cannot perform restricted actions.

## Correction

Authorized corrections preserve accountability.

## Operational Usability

The capability can be used under realistic operational conditions.

---

# 45. Capability Lifecycle

Capabilities progress independently.

```text
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

---

# 46. Delivery Status Definitions

## Identified

The capability is recognized but not yet scoped.

## Scoped

Purpose, boundary, and expected outcome are defined.

## Designed

Capability architecture is sufficient for implementation.

## In Development

Implementation is actively being created.

## Pilot

The capability is being tested in controlled operational use.

## Active

The capability is used as part of normal operation.

## Optimized

The capability is operationally stable and being improved through measured learning.

## Retired

The capability is no longer available for active use.

---

# 47. Operational Maturity

Operational maturity shall be tracked separately from delivery status.

| Level | Meaning |
|---|---|
| M0 | Not Available |
| M1 | Manual |
| M2 | Digitally Supported |
| M3 | Integrated |
| M4 | Optimized |
| M5 | Adaptive |

A capability may be:

```yaml
delivery_status: Designed
operational_maturity: M1
```

This means the capability is manually present in the organization and has been designed for digital support.

---

# 48. Maturity Interpretation

## M0 — Not Available

The ability does not reliably exist.

## M1 — Manual

The ability is performed manually or through informal tools.

## M2 — Digitally Supported

Software supports the ability, but integration and automation remain limited.

## M3 — Integrated

The capability exchanges reliable information with related capabilities and systems.

## M4 — Optimized

The capability is measured and continuously improved.

## M5 — Adaptive

The capability adjusts through predictive or intelligent support while preserving accountable control.

---

# 49. Capability Activation

A capability may enter active engineering when:

- its purpose is clear;
- its responsibility boundary is defined;
- operational need is established;
- key dependencies are known;
- implementation priority is justified;
- acceptance can be described.

A capability shall not require exhaustive documentation before activation.

Unknowns may remain explicit.

---

# 50. Ready for Implementation

A capability is ready for implementation when:

```yaml
identity_defined: true
purpose_defined: true
responsibility_defined: true
scope_defined: true
owned_state_defined: true
critical_rules_defined: true
primary_events_defined: true
dependencies_defined: true
minimum_acceptance_defined: true
blocking_unknowns_resolved: true
```

Non-blocking unknowns may remain.

They shall be documented.

---

# 51. Ready for Pilot

A capability is ready for pilot when:

- required implementation exists;
- blocking rules are enforced;
- critical state transitions are tested;
- meaningful events are preserved;
- operational users can perform the intended outcome;
- degraded behavior is understood;
- known risks are recorded;
- pilot acceptance scenarios pass;
- rollback or fallback behavior exists.

---

# 52. Capability Completion

Capabilities shall not be declared permanently complete.

An implementation increment may be declared complete when:

- the scoped outcome is available;
- acceptance criteria pass;
- operational validation is complete;
- known limitations are recorded;
- supporting documentation is current;
- ownership remains clear.

The capability itself continues to evolve.

---

# 53. Implementation Relationship

Capability architecture defines business behavior.

Implementation realizes that behavior.

```text
Capability
    ↓
Application Services
    ↓
Domain Modules
    ↓
Infrastructure
    ↓
User Interfaces
```

Implementation artifacts may include:

- application services;
- domain objects;
- database schemas;
- APIs;
- jobs;
- user interfaces;
- integration adapters;
- automated tests.

Each implementation artifact shall reference the capability it realizes where practical.

Example:

```yaml
capability_id: CAP-D04.01
implementation_module: assignments
```

---

# 54. Implementation Traceability

Traceability should support navigation in both directions.

```text
Capability
    ↓
Rules
    ↓
Implementation
    ↓
Tests
```

And:

```text
Test Failure
    ↓
Implementation
    ↓
Rule
    ↓
Capability
```

Minimum traceability shall connect:

- capability;
- significant rules;
- implementation modules;
- acceptance tests.

---

# 55. Test Alignment

Tests should be organized according to capability behavior.

Recommended test categories:

```text
tests/
├── capability/
├── domain/
├── interaction/
├── integration/
└── operational/
```

Example:

```text
tests/capability/CAP-D04.01/
```

Test names should reference rule or acceptance identifiers where useful.

Example:

```text
CAP-D04.01-R03-reject-overlapping-seat-assignment
```

---

# 56. AI Engineering Use

Capability architecture shall be structured so that authorized AI agents can:

- locate capability responsibility;
- identify owned concepts;
- understand state;
- inspect rules;
- identify interactions;
- generate implementation plans;
- create tests;
- review conformance;
- detect conflicting ownership.

AI agents shall not infer missing business rules as authoritative truth.

Missing or uncertain rules shall be surfaced for human review.

---

# 57. AI Implementation Context

When assigning implementation work to an AI engineering agent, provide:

```text
Capability ID
Capability Folder
Relevant Domain Model
Relevant Architecture
Implementation Constraints
Acceptance Requirements
```

Example instruction:

```text
Implement CAP-D04.01 Seating Assignment.

Use the capability architecture under:
solutions/reservations/capabilities/active/CAP-D04.01-seating-assignment/

Conform to the domain model and MVP architecture.

Do not introduce new business rules without recording them as proposed changes.
```

---

# 58. Relationship to Operations

Capability architecture defines what the solution can do.

Operational artifacts define how people use capabilities in real work.

Example:

```text
Capability:
Guest Arrival Management

Operational Workflow:
Friday Dinner Arrival Flow
```

Operational workflows may combine multiple capabilities.

A workflow shall not redefine capability ownership.

---

# 59. Relationship to User Stories

User stories may be used for delivery planning.

They shall not become the authoritative definition of a capability.

A user story represents a delivery slice.

A capability represents a stable operational ability.

```text
Capability
    ↓
Capability Increment
    ↓
User Stories
    ↓
Implementation Tasks
```

---

# 60. Relationship to Processes

A process describes the sequence of work.

A capability describes the ability required to perform that work.

Example:

```text
Process:
Guest Arrival and Seating

Capabilities:
- Guest Arrival Management
- Seating Assignment
- Live Service Management
- Allergy and Critical Note Management
```

One process may use several capabilities.

One capability may support several processes.

---

# 61. Relationship to Domain Model

The domain model defines shared business meaning.

Capability architecture defines responsibility for that meaning.

A capability may own a domain concept.

Other capabilities may reference or consume it.

The domain model shall not create ambiguous ownership.

---

# 62. Relationship to Capability Registry

The capability registry is authoritative for:

- capability identity;
- capability name;
- capability domain;
- capability type;
- delivery status;
- operational maturity;
- high-level ownership;
- high-level dependencies;
- MVP inclusion.

The active capability folder is authoritative for detailed capability behavior.

Where conflict exists:

```text
Registry identity and classification
        +
Capability folder detailed behavior
```

shall be reconciled through architectural review.

---

# 63. Relationship to Capability Map

The capability map provides the human-readable overview of the solution.

The registry provides structured metadata.

The capability folder provides detailed engineering.

```text
Capability Map
    What exists?

Capability Registry
    What owns what?

Capability Architecture
    How does it behave?
```

---

# 64. Change Management

Changes shall be classified by impact.

## Minor Change

Examples:

- clarification;
- wording improvement;
- additional example;
- non-authoritative implementation reference.

Minor changes may proceed through normal engineering activity.

---

## Material Change

Examples:

- new state;
- new event;
- new rule;
- changed acceptance criterion;
- new dependency;
- changed operational outcome.

Material changes require capability review.

---

## Structural Change

Examples:

- changed capability purpose;
- changed ownership boundary;
- merged capability;
- split capability;
- changed capability domain;
- changed authoritative concept ownership.

Structural changes require architectural review.

---

# 65. Capability Split

A capability should be split when:

- it contains multiple independent operational outcomes;
- responsibilities can evolve independently;
- ownership has become ambiguous;
- interactions dominate internal cohesion;
- separate delivery or maturity is valuable;
- one part can operate without the other.

A capability shall not be split merely to mirror software modules.

---

# 66. Capability Merge

Capabilities may be merged when:

- they always evolve together;
- they own one indivisible operational outcome;
- the distinction creates no useful ownership boundary;
- separation causes duplicated rules or state;
- users cannot meaningfully distinguish the abilities.

---

# 67. Capability Retirement

Retirement shall define:

- replacement capability, if any;
- affected workflows;
- affected implementation modules;
- data retention;
- event preservation;
- migration requirements;
- external dependency impact;
- effective retirement date.

Historical capability records shall remain traceable.

---

# 68. Prohibited Patterns

The following patterns do not conform to this standard.

## 68.1 Screen-as-Capability

```text
Reservation Dashboard Capability
```

when the dashboard is only a presentation interface.

---

## 68.2 Database-as-Capability

```text
Reservation Table Management
```

when the term refers only to database storage.

---

## 68.3 Duplicate Ownership

Two capabilities independently defining the authoritative reservation status.

---

## 68.4 Technical Dependency Mapping

Declaring a capability dependency solely because one code module imports another.

---

## 68.5 Workflow Hidden as State

Using dozens of states to represent every action in an operational process.

---

## 68.6 Event Flooding

Recording every technical update as a business event.

---

## 68.7 Silent Override

Allowing blocking business rules to be bypassed without attribution.

---

## 68.8 AI State Ownership

Allowing an intelligence capability to silently alter authoritative operational state.

---

## 68.9 Documentation Before Need

Creating full capability folders for every identified future capability regardless of delivery need.

---

## 68.10 Implementation-Driven Semantics

Changing business meaning solely to simplify a current technical implementation.

---

# 69. Conformance Requirements

A capability conforms to CA-001 when:

```yaml
required:
  - stable capability identifier
  - defined purpose
  - defined operational outcome
  - explicit responsibility boundary
  - explicit in-scope and out-of-scope responsibilities
  - explicit ownership
  - defined inputs and outputs
  - defined dependencies
  - state model where state exists
  - meaningful event model where history matters
  - explicit business rules
  - interaction model where collaboration exists
  - operational acceptance criteria
  - implementation traceability
  - delivery status
  - operational maturity
```

The depth of each element shall remain proportional.

---

# 70. Review Questions

Capability reviews should ask:

## Identity

- Is this truly a capability?
- Does it describe an operational ability?
- Is the name stable and implementation independent?

## Responsibility

- Is the purpose clear?
- Is ownership unambiguous?
- Is the boundary too broad or too narrow?
- Does it duplicate another capability?

## State

- What current truth does it own?
- Are transitions explicit?
- Are invariants testable?

## Events

- What meaningful things happen?
- Are events operationally meaningful?
- Is correction preserved rather than hidden?

## Rules

- Which rules are blocking?
- Which rules allow override?
- Are safety-critical rules protected?

## Interactions

- Which capabilities depend on it?
- What does it depend on?
- Are dependencies business dependencies rather than technical coupling?

## Acceptance

- Can the operational outcome be demonstrated?
- Are failure cases included?
- Can the capability be validated under realistic conditions?

## Proportionality

- Is the documentation sufficient?
- Is any artifact unnecessary?
- Is more engineering required because of risk or complexity?

---

# 71. Standard Capability Template

The following template may be used for a lightweight capability.

```markdown
# <CAPABILITY_ID> — <CAPABILITY_NAME>

## Metadata

```yaml
id: <CAPABILITY_ID>
name: <CAPABILITY_NAME>
slug: <CAPABILITY_SLUG>
solution: <SOLUTION_NAME>
domain: <DOMAIN_ID>
type: <Core | Supporting | Integration | Intelligence>
delivery_status: <STATUS>
operational_maturity: <M0-M5>
```

## Purpose

<Why the capability exists.>

## Operational Outcome

<What users or the organization can reliably achieve.>

## Responsibility

<What the capability is authoritative for.>

## In Scope

- <Responsibility>

## Out of Scope

- <Responsibility owned elsewhere>

## Owns

### Concepts

- <Concept>

### State

- <State>

### Rules

- <Rule area>

### Events

- <Event>

## Inputs

- <Business input>

## Outputs

- <Business output>

## State Model

<State definitions and transitions.>

## Rules

### <RULE_ID> — <RULE_NAME>

<Rule statement.>

## Events

### <EVENT_NAME>

<Meaning and trigger.>

## Interactions

### Incoming

- <Interaction>

### Outgoing

- <Interaction>

## Dependencies

- <Capability ID>

## Provides To

- <Capability ID>

## Acceptance

### AC-01

Given <condition>

When <action>

Then <expected operational result>

## Known Unknowns

- <Unresolved question>

## References

- <Reference>
```

---

# 72. Standard Full Folder Template

```text
CAP-DNN.NN-capability-slug/
├── capability.md
├── state-model.md
├── event-model.md
├── rule-model.md
├── interaction-model.md
└── acceptance.md
```

Optional:

```text
├── examples.md
├── decision-table.md
├── operational-scenarios.md
└── risk-model.md
```

---

# 73. Operational Causality Chain

The following sequence is a reference sequence for how a capability produces operational effect:

```text
Command
    ↓
Authorization
    ↓
Validation
    ↓
Rule Evaluation
    ↓
Decision
    ↓
State Transition
    ↓
Business Event
    ↓
Capability Interaction
    ↓
Operational Projection
```

This is a reference sequence, not a requirement that every capability contain every stage.

A capability with no state does not produce a State Transition. A capability with no downstream consumers does not produce a Capability Interaction. The chain exists to give engineers and reviewers a shared vocabulary for tracing cause and effect, not a mandatory checklist every capability must fully populate.

---

# 74. Cross-Artifact Conformance

Before a capability moves from Designed to In Development, verify:

```yaml
cross_artifact_conformance:
  - all rule IDs referenced by acceptance scenarios exist
  - all event IDs referenced by rules and acceptance scenarios exist
  - all state transitions referenced by rules exist
  - every published event has one authoritative owner
  - every consumed event has a defined reaction
  - capability dependencies agree across all artifacts
  - no hidden state is introduced outside state-model.md
```

This check is distinct from the single-artifact conformance in section 69. Section 69 verifies that one artifact is internally complete. This section verifies that the artifacts making up a capability package do not contradict each other.

---

# 75. Success Criteria

CA-001 succeeds when a human engineer or AI engineering agent can answer:

- What is this capability?
- Why does it exist?
- What does it own?
- What state does it control?
- What meaningful events does it produce?
- What rules must remain true?
- Which capabilities does it interact with?
- How do we know it works?
- Which implementation realizes it?
- What can change without altering its identity?

without relying on undocumented assumptions.

---

# 76. Final Principle

HELIX shall engineer capabilities as operational abilities, not as documentation containers.

The purpose of capability architecture is to make implementation clearer, safer, faster, and more aligned with organizational reality.

Documentation that does not improve ownership, behavior, implementation, validation, or operational learning shall not be required.