# HELIX Reservations — Product Principles

## Metadata

```yaml
artifact_id: PRD-001-STR-001
product_id: PRD-001
title: HELIX Reservations Product Principles
version: 0.1.0
status: Draft
owner: Product Owner
architect: Principal HELIX Architect
initial_deployment: Konnichiwa Utrecht
```

---

# Purpose

This document defines the enduring product principles that guide the design, development, operation, and evolution of HELIX Reservations.

The principles are used to evaluate:

- product features;
- workflows;
- user interfaces;
- automation;
- integrations;
- architectural decisions;
- AI behavior;
- operational changes.

These principles are not a feature list.

They define how the product should behave and what it should protect as it evolves.

---

# Product Direction

HELIX Reservations is an operational reservation product for restaurants.

Its purpose is not merely to collect bookings.

Its purpose is to help restaurants:

- understand demand;
- manage seating capacity;
- coordinate service;
- reduce operational workload;
- preserve guest information;
- improve decision-making.

The first deployment is Konnichiwa Utrecht.

The product must solve Konnichiwa’s real operational needs while remaining capable of supporting other restaurants in the future.

---

# Principle PRP-001 — The Restaurant Owns Its Operational Truth

HELIX Reservations shall enable the restaurant to maintain control over its reservation data and operational decisions.

External reservation platforms may create, modify, or cancel bookings through integrations, but they shall not define the internal identity or operating model of the restaurant.

## Implications

- Every reservation receives an internal identifier.
- External identifiers remain references.
- Restaurant staff can inspect the source and history of a reservation.
- The internal record remains valid when an integration is removed.
- External platforms do not own internal floor planning or seating logic.

## Decision test

Ask:

> Does this decision strengthen or weaken the restaurant’s control over its operational information?

---

# Principle PRP-002 — One Reservation Exists Once

A real-world reservation shall have one authoritative internal representation.

A reservation may appear through multiple channels or contain multiple external references, but it shall not become multiple competing internal records.

## Implications

- Duplicate detection is required.
- External updates must be matched to the correct internal reservation.
- Modifications should update the existing reservation rather than create a new one.
- Integration conflicts must be visible.
- Reservation history must preserve the origin of changes.

## Decision test

Ask:

> Could this design create two internal versions of the same reservation?

---

# Principle PRP-003 — The Floorplan Is the Operational Heart

The floorplan shall be the primary operational view of restaurant capacity and seating.

A reservation list alone is insufficient because restaurant operations depend on:

- physical seating;
- individual seats;
- table combinations;
- shared tables;
- service duration;
- arrival pacing;
- operational workload.

## Implications

- Reservations must be visible in relation to seating resources.
- Seating conflicts must be immediately visible.
- Floorplan changes must not destroy historical meaning.
- Table assignments must support both manual and suggested planning.
- The floorplan must reflect the actual operating model of each restaurant.

## Decision test

Ask:

> Does this improve the restaurant’s ability to understand and control the service from the floorplan?

---

# Principle PRP-004 — Operational Reality Comes Before Generic Software Assumptions

The product shall model how restaurants actually operate rather than forcing restaurants into a generic reservation workflow.

Operational exceptions are normal.

Examples include:

- shared Teppan seating;
- late arrivals;
- table changes;
- unexpected walk-ins;
- temporarily blocked tables;
- chef workload constraints;
- private events;
- guests staying longer than expected.

## Implications

- Workflows must tolerate controlled exceptions.
- Business rules should be configurable where restaurants differ.
- Manual intervention must remain possible.
- Staff should not need to work around the product using paper, memory, or messaging apps.
- Restaurant-specific behavior must not be hidden inside hard-coded implementation logic.

## Decision test

Ask:

> Does this reflect real service conditions, including exceptions and pressure?

---

# Principle PRP-005 — Build for the Most Demanding Service

The product shall be designed for high-pressure operational use.

The primary test is not whether it works during a quiet service.

The test is whether staff can rely on it during the busiest and most complex service period.

For Konnichiwa, this means testing against conditions such as:

- Friday or Saturday dinner;
- multiple simultaneous arrivals;
- Teppan and Sushi demand;
- walk-ins;
- late guests;
- changes in party size;
- allergy information;
- table reassignment.

## Implications

- Critical actions must require few steps.
- Important information must be immediately visible.
- The system must remain understandable under time pressure.
- Error recovery must be simple.
- Performance and reliability are product requirements, not technical luxuries.

## Decision test

Ask:

> Would this still work during the busiest service when staff have no time to investigate the software?

---

# Principle PRP-006 — Every Interaction Must Reduce Operational Effort

Every screen, field, notification, and workflow shall have an identifiable operational purpose.

The product shall not create additional administration merely to satisfy its own internal structure.

## Implications

- Avoid duplicate entry.
- Reuse known information.
- Defaults should reflect normal operations.
- Staff should enter information once.
- Routine actions should be quick.
- Rare actions may contain more detail.
- Unused fields and unnecessary screens should be removed.

## Decision test

Ask:

> Does this interaction save more effort than it creates?

---

# Principle PRP-007 — Important Information Must Be Visible at the Moment of Use

Operational information has value only when it reaches the right person at the right time.

Critical information includes:

- allergies;
- accessibility needs;
- special occasions;
- seating preferences;
- late arrival status;
- external synchronization conflicts;
- important guest notes;
- table restrictions.

## Implications

- Critical information should not be hidden inside general notes.
- Different roles may require different views.
- Sensitive information requires appropriate access control.
- Alerts should be relevant and actionable.
- Staff should not need to open multiple screens to understand one reservation.

## Decision test

Ask:

> Will the person making the operational decision see this information at the right moment?

---

# Principle PRP-008 — Manual Control Has Final Authority

HELIX Reservations may recommend and automate actions, but authorized restaurant staff retain final operational control.

The system supports judgment.

It does not attempt to eliminate it.

## Implications

- Staff can override suggested table assignments.
- Staff can modify expected duration.
- Staff can release or block resources.
- Overrides should be recorded when operationally relevant.
- Automation must not silently reverse a manual decision.
- Role permissions determine who may perform high-impact overrides.

## Decision test

Ask:

> Can authorized staff safely correct the system when reality differs from the model?

---

# Principle PRP-009 — Automation Must Be Explainable

Automated decisions and AI-generated suggestions shall provide understandable reasoning.

A recommendation should show the relevant operational factors.

Example:

```text
Suggested Teppan Table 2, seats 4–7

Reason:
- four adjacent seats are available;
- the guest requested Teppan;
- expected duration fits the next reservation;
- arrival pacing remains within the configured limit.
```

## Implications

- Important recommendations need reason codes or explanations.
- The product must distinguish suggestions from confirmed decisions.
- Staff should understand why an alternative was rejected.
- AI output must not be treated as authoritative merely because it was generated automatically.
- Explainability should match the importance of the decision.

## Decision test

Ask:

> Can a staff member understand and challenge this suggestion without technical knowledge?

---

# Principle PRP-010 — Automation Must Fail Safely

A failure in an integration, algorithm, or AI service shall not prevent the restaurant from operating.

## Implications

- Core reservations remain accessible when external integrations fail.
- Staff can create and modify reservations manually.
- Synchronization failures must be visible.
- Failed automation must not silently corrupt operational data.
- Recovery procedures should be understandable.
- Essential service workflows should not depend completely on AI availability.

## Decision test

Ask:

> Can the restaurant continue operating when this automated component is unavailable?

---

# Principle PRP-011 — Integrations Are Replaceable Boundaries

External systems shall connect through explicit integration boundaries.

The internal product model shall not be shaped around one external platform.

## Implications

- Each integration translates between external and internal concepts.
- External payloads do not become the internal domain model.
- Integration-specific fields remain isolated where practical.
- Removing one platform should not require redesigning the core product.
- Integration health must remain separate from reservation state.

## Decision test

Ask:

> Could we replace this external system without rebuilding the Reservation Core?

---

# Principle PRP-012 — Data Ownership Must Be Explicit

Every important business object shall have one authoritative owner.

HELIX Reservations owns reservation and seating information.

Other future HELIX products may own related information.

Examples:

```text
Reservation
Owner: HELIX Reservations

Sales Transaction
Owner: HELIX POS

Reusable Guest Profile
Owner: HELIX CRM or shared Guest Service

Stock Position
Owner: HELIX Inventory
```

## Implications

- Products may reference information owned elsewhere.
- Products shall not create competing authoritative records.
- Data contracts must define which product may change which information.
- Shared concepts require stable identifiers.
- Temporary duplication for performance does not transfer ownership.

## Decision test

Ask:

> Which product owns this information, and which products merely use it?

---

# Principle PRP-013 — Configuration Before Custom Forks

Restaurants differ in layout, service style, pacing, terminology, and operating rules.

The product should support meaningful configuration without creating a separate codebase for every customer.

## Implications

Configurable elements may include:

- Areas;
- Table Types;
- Floorplans;
- Services;
- Time Slots;
- pacing rules;
- expected durations;
- reservation sources;
- status terminology;
- permission rules;
- integration settings.

Not every behavior must be configurable.

Configuration should be introduced only for real variation.

## Decision test

Ask:

> Is this a genuine restaurant-specific rule that belongs in configuration, or are we creating complexity for a hypothetical need?

---

# Principle PRP-014 — Shared Platform Services Must Be Earned

HELIX Reservations should not create a generalized platform component merely because another product may need it someday.

A capability should move into the shared HELIX Platform when reuse has been demonstrated.

## Implications

- Build the first useful implementation inside the product.
- Extract shared services only when another product has a concrete need.
- Avoid premature platform abstractions.
- Preserve clear boundaries so later extraction remains possible.
- Reuse should reduce total complexity rather than distribute it.

## Decision test

Ask:

> Do at least two real products need this capability, or are we designing for an imagined future?

---

# Principle PRP-015 — Deliver Small Operational Increments

The product shall evolve through small releases that can be tested in real restaurant operations.

A release should prove one useful capability rather than attempt to complete the entire platform.

## Initial progression

```text
1. Manual reservation entry
2. Reservation list
3. Basic floorplan
4. Manual seating assignment
5. Service dashboard
6. Website reservation intake
7. External integrations
8. Assignment suggestions
9. Operational analytics
10. AI assistance
```

## Implications

- Each increment needs a defined operational user.
- Each increment needs observable acceptance criteria.
- Learning from use should influence the next increment.
- Unvalidated complexity should not be built in advance.
- A prototype may remain intentionally incomplete.

## Decision test

Ask:

> What is the smallest release that creates real operational value and teaches us something important?

---

# Principle PRP-016 — Learn Without Increasing Staff Burden

The product should learn from operational activity through normal use.

Staff shall not be expected to maintain extensive additional records solely to train analytics or AI.

## Implications

Useful events may be captured from:

- reservation creation;
- arrival;
- seating;
- reassignment;
- completion;
- cancellation;
- no-show;
- table release;
- duration;
- manual override.

## Decision test

Ask:

> Can the system learn this from normal work, or are we asking staff to become data administrators?

---

# Principle PRP-017 — Preserve History and Accountability

Important operational changes shall remain traceable.

The objective is not surveillance.

The objective is to understand what happened and recover from mistakes.

## Implications

- Reservation changes retain actor, source, time, and relevant values.
- Integration updates remain distinguishable from staff changes.
- Important manual overrides are recorded.
- Historical assignments remain interpretable.
- Audit information should be protected against ordinary modification.

## Decision test

Ask:

> Could we understand how the current situation arose after the service has ended?

---

# Principle PRP-018 — Protect Guest Trust

Guest information shall be handled with care and collected only where it serves a legitimate operational or business purpose.

## Implications

- Access to personal information should be role-based.
- Sensitive notes require stronger controls.
- Data retention should be defined.
- Marketing consent must remain separate from reservation necessity.
- Allergy and accessibility information must be protected while remaining operationally visible.
- Product design must support applicable privacy obligations.

## Decision test

Ask:

> Is this information necessary, appropriately protected, and used in a way the guest could reasonably expect?

---

# Principle PRP-019 — The Core Must Remain Usable Without AI

AI may improve planning, communication, forecasting, and decision support.

AI shall not become a prerequisite for basic restaurant operations.

## Implications

The restaurant must remain able to:

- create reservations;
- find reservations;
- modify reservations;
- assign tables;
- manage arrivals;
- record seating;
- complete service;

without an AI service.

## Decision test

Ask:

> Does this design improve the core product, or conceal a weak core behind AI?

---

# Principle PRP-020 — Product Simplicity Is an Architectural Requirement

Complexity must justify itself through operational value.

The product should avoid:

- unnecessary services;
- premature microservices;
- duplicated models;
- excessive workflow states;
- speculative configuration;
- documentation without a user;
- abstractions without demonstrated reuse.

## Implications

- Begin with a modular product, not a distributed system.
- Prefer explicit behavior over clever behavior.
- Introduce new concepts only when existing concepts cannot represent the requirement correctly.
- Regularly remove obsolete fields, rules, screens, and integrations.

## Decision test

Ask:

> Is this the simplest design that correctly supports the real operational requirement?

---

# Principle Priority

When principles appear to conflict, use the following priority order:

1. Guest and operational safety
2. Continuity of restaurant operations
3. Integrity of authoritative information
4. Usability under service pressure
5. Restaurant control
6. Product simplicity
7. Automation
8. Future extensibility

Future extensibility shall not override current operational usability without a demonstrated need.

---

# Product Decision Review

Significant product decisions should be tested against the principles using a lightweight review.

```yaml
decision:
operational_problem:
affected_users:
supporting_principles:
potentially_conflicting_principles:
manual_fallback:
smallest_testable_release:
evidence_required:
```

A separate decision record is required only when the decision is expensive, risky, foundational, or difficult to reverse.

---

# Initial Konnichiwa Evaluation Criteria

The first Konnichiwa prototype should demonstrate that:

- staff can create and find a reservation quickly;
- reservation information exists once;
- the reservation source remains visible;
- allergies and important notes are immediately visible;
- reservations can be assigned through the floorplan;
- shared Teppan seating can be represented;
- conflicts are visible before confirmation;
- manual reassignment is simple;
- the product remains usable without external integrations;
- the workflow is practical during a busy service.

---

# Non-Goals

These principles do not require the initial product to provide:

- fully automated table allocation;
- predictive AI;
- a universal restaurant data model;
- every external integration;
- multi-location management;
- CRM;
- POS;
- inventory;
- marketing automation;
- a generalized HELIX Platform.

Those capabilities may emerge later through validated product development.

---

# Conclusion

HELIX Reservations shall be built around restaurant control, operational reality, floorplan intelligence, safe automation, and incremental delivery.

The product succeeds when it becomes easier for restaurant staff to operate a demanding service accurately and confidently.

It does not succeed merely because it contains more features, more automation, or more architectural components.