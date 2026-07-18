# IAD-001 – Konnichiwa Reservation Completion Implementation Architecture

Status

Approved Operational Architecture

Architecture Type

Organizational and Operational Implementation Architecture

Organization

- Konnichiwa

Implementation Authority

- IR-001 – Established RCS-001 Implementation Requirements

Standard Authority

- RCS-001 – Reservation Commitment Completion Standard

Originating Engineering Case

- EC-001 – Konnichiwa Reservation Operations

Selected Through

- ICE-001 – Comparative Implementation Evaluation

Primary Candidate

- IC-003 – Shared Workfloor Guestplan Access

Fallback Candidate

- IC-002 – Manually Created Shared Reservation Task

Deferred Candidate

- IC-001 – WhatsApp-Triggered Persistent Reservation Action

Feasibility Authority

- IF-003 – Feasibility Investigation of Shared Workfloor Guestplan Access

---

# Purpose

IAD-001 defines the target operational architecture through which Konnichiwa shall preserve reservation commitments from acceptance through accurate operational representation.

The architecture establishes:

- the normal direct-completion pathway;
- the deferred-completion fallback pathway;
- operational roles;
- authority boundaries;
- decision rules;
- work-object movement;
- Guestplan responsibilities;
- workfloor device responsibilities;
- task-fallback responsibilities;
- completion and verification requirements;
- exception handling;
- recovery;
- reconciliation;
- security;
- and operational governance.

The architecture applies the following principle:

> Complete a reservation directly in Guestplan wherever safe, authorized and operationally practical. Create a persistent deferred-completion action only where direct completion cannot occur.

---

# Architecture Question

How shall Konnichiwa organize people, Guestplan access, workfloor capability and fallback responsibility so that accepted reservation commitments are either completed immediately or remain visibly unresolved until actual completion?

---

# Architecture Objectives

IAD-001 shall:

1. remove unnecessary Supervisor-to-Manager reservation handoffs;
2. reduce dependence on handwritten information and WhatsApp transfer;
3. make Guestplan the primary completed operational representation;
4. support direct workfloor reservation entry;
5. preserve limited and accountable access;
6. distinguish standard reservations from exceptional reservations;
7. activate RCS-001 only where direct completion cannot occur;
8. preserve one accountable owner for every unresolved fallback action;
9. protect guest information;
10. minimize duplicate data and systems;
11. provide operational recovery during outages or exceptions;
12. remain simple enough for restaurant service.

---

# Architectural Principle

The architecture follows a direct-completion-first model:

```text
Reservation commitment accepted
        ↓
Can it be safely and immediately completed in Guestplan?
        │
        ├── YES
        │     ↓
        │   Direct Guestplan entry
        │     ↓
        │   Successful save verified
        │     ↓
        │   Completed
        │
        └── NO
              ↓
            Persistent fallback action
              ↓
            Explicit accountability
              ↓
            Guestplan completion later
              ↓
            Correct fallback action closed
```

The architecture shall not create a fallback task where direct completion succeeds.

---

# Architectural Scope

## Initial Scope

IAD-001 initially applies to:

- standard future reservations;
- accepted directly on the restaurant floor;
- received by an authorized floor-level actor;
- requiring representation in Guestplan.

## Initial Exclusions

The initial architecture does not grant floor-level authority for:

- unrestricted reservation modification;
- reservation cancellation;
- large or exceptional group acceptance;
- private dining decisions;
- capacity overrides;
- Guestplan configuration;
- user administration;
- reporting;
- data export;
- or system administration.

These actions remain under management authority unless separately engineered and authorized.

---

# Operational Architecture Overview

```text
Guest
    ↓
Reservation request
    ↓
Receiving organizational actor
    ↓
Commitment and authority check
    ↓
Standard reservation?
    │
    ├── YES
    │     ↓
    │   Guestplan available?
    │     │
    │     ├── YES
    │     │     ↓
    │     │   Authorized actor?
    │     │     │
    │     │     ├── YES
    │     │     │     ↓
    │     │     │   Direct Guestplan entry
    │     │     │     ↓
    │     │     │   Critical-field check
    │     │     │     ↓
    │     │     │   Save confirmed
    │     │     │     ↓
    │     │     │   Completed
    │     │     │
    │     │     └── NO
    │     │           ↓
    │     │         Fallback action
    │     │
    │     └── NO
    │           ↓
    │         Fallback action
    │
    └── NO
          ↓
        Management decision required
          ↓
        Fallback action
```

---

# Architectural Components

## AC-001 – Guestplan

Architectural Role

Primary completed operational reservation representation.

Guestplan shall support, subject to confirmed capability:

- reservation creation;
- reservation retrieval;
- reservation modification by authorized actors;
- reservation cancellation by authorized actors;
- synchronization across authorized devices;
- user attribution;
- reservation history;
- operational preparation;
- and floor-planning input.

Guestplan shall not automatically be treated as the representation of an accepted commitment until successful entry has been confirmed.

---

## AC-002 – Workfloor Access Device

Architectural Role

Provides authorized floor-level access to Guestplan at the point where reservation commitments are accepted.

The device may be:

- an existing managed tablet;
- a secured restaurant phone;
- a fixed workfloor terminal;
- a managed laptop;
- or another approved device.

The final device shall be selected only after IF-003 verification.

The device shall not become a new reservation system.

It provides access to Guestplan.

---

## AC-003 – Identity and Access Control

Architectural Role

Ensures that Guestplan actions are performed only by authorized and attributable actors.

The preferred model is:

- individual user identity;
- role-appropriate permissions;
- limited access;
- controlled authentication;
- automatic device locking;
- and access revocation.

Shared personal credentials are not permitted.

Where individual identity cannot technically be preserved, the architecture must be challenged before implementation.

---

## AC-004 – Persistent Fallback Action Mechanism

Architectural Role

Preserves accepted reservation commitments where direct Guestplan completion cannot occur.

The fallback mechanism may use:

- an existing organizational shared-task capability;
- a simple shared reservation-action list;
- a controlled task board;
- or another conforming mechanism.

It shall not be a personal to-do list.

It shall preserve:

- unresolved state;
- source relationship;
- current owner;
- reason for fallback;
- required next action;
- safe attention point;
- actual completion;
- and visible closure.

---

## AC-005 – Operational Review

Architectural Role

Ensures that unresolved fallback actions are actively inspected rather than merely stored.

Fallback actions shall be reviewed:

- during shift handover where applicable;
- during daily reservation checking;
- before relevant floor-plan preparation;
- and when an action approaches its latest safe attention point.

The review mechanism may be manual.

A separate automated reminder engine is not mandatory.

---

## AC-006 – Physical Floor Reservation Plan

Architectural Role

Provides the physical service-preparation representation used for Teppan Yaki and Sushi operations.

The Floor Reservation Plan remains derived from Guestplan and relevant operational information.

The initial architecture does not replace the A4 Floor Reservation Plan.

The flow remains:

```text
Guestplan
        ↓
Reservation review
        ↓
Relevant reservations copied
        ↓
Physical Floor Reservation Plan
```

Same-day walk-ins may continue to be entered directly onto the physical plan under the existing operational rule, unless separately redesigned.

---

# Operational Roles

The architecture defines operational roles independently from specific job titles.

One person may hold multiple roles.

---

## OR-001 – Reservation Receiving Actor

Responsibility

Receives a reservation request from the guest.

May be:

- Supervisor;
- Manager;
- Assistant Manager;
- Owner;
- or another authorized actor.

Responsibilities:

- obtain required reservation information;
- determine whether the restaurant is accepting the commitment;
- distinguish standard from exceptional requests;
- identify whether immediate completion is possible;
- and preserve the commitment until completion.

---

## OR-002 – Floor Reservation Entry Actor

Responsibility

Enters standard future reservations directly into Guestplan from the workfloor.

Initial likely role holder:

- authorized Supervisor;
- Manager;
- Assistant Manager;
- or Owner.

Responsibilities:

- authenticate correctly;
- confirm critical reservation details;
- enter the reservation;
- verify successful save;
- protect guest information;
- and activate fallback where completion cannot be confirmed.

---

## OR-003 – Reservation Authority

Responsibility

Makes decisions for reservations outside normal floor-entry authority.

Likely role holders:

- Manager;
- Assistant Manager;
- Owner.

Responsibilities may include:

- large-group approval;
- capacity exceptions;
- unusual requests;
- significant modifications;
- cancellations;
- private dining;
- conflicting reservations;
- and recovery decisions.

---

## OR-004 – Fallback Action Owner

Responsibility

Owns the next required action where direct completion cannot occur.

The owner shall be one identifiable actor or active operational role.

Responsibilities:

- resolve missing information;
- make required Guestplan entry;
- obtain management decisions;
- preserve the action state;
- and close the correct fallback action after completion.

---

## OR-005 – Guestplan Administrator

Responsibility

Controls Guestplan access and configuration.

Likely role holders:

- Owner;
- designated Manager;
- or another explicitly authorized administrator.

Responsibilities:

- create users;
- assign permissions;
- change access;
- revoke access;
- review active users;
- investigate access issues;
- and protect administrative functions.

---

## OR-006 – Reservation Review Actor

Responsibility

Reviews Guestplan reservations and unresolved fallback actions during operational preparation.

Likely role holders:

- Manager;
- Assistant Manager;
- Owner;
- or another authorized actor.

Responsibilities:

- review today and tomorrow;
- review up to three days ahead when operationally appropriate;
- identify unresolved fallback actions;
- reconcile discrepancies;
- and update the physical Floor Reservation Plan.

---

# Authority Model

## Standard New Reservation

An authorized Floor Reservation Entry Actor may create a standard new reservation directly where:

1. the requested date and time are available;
2. the requested dining area is available;
3. party size falls within established normal limits;
4. required information is complete;
5. no management exception applies;
6. Guestplan is available;
7. successful save can be confirmed.

---

## Exceptional Reservation

The Reservation Authority must decide where one or more of the following apply:

- group size exceeds the established floor-entry threshold;
- capacity is uncertain;
- requested area is unavailable;
- special arrangement is requested;
- private dining is requested;
- unusual service timing is requested;
- significant allergy or operational complexity requires attention;
- guest information conflicts;
- or the receiving actor is uncertain whether acceptance is appropriate.

The floor actor shall not guess or silently reject the request.

The request enters the fallback mechanism until a decision is established.

---

## Reservation Modification

Initial authority:

- management-controlled unless Guestplan capability and organizational rules justify limited floor access.

A Supervisor receiving a modification request may:

- complete it directly only if explicitly authorized;
- otherwise create a fallback action assigned to the Reservation Authority.

---

## Reservation Cancellation

Initial authority:

- management-controlled.

A cancellation request shall not be represented as successful until the appropriate Guestplan action has occurred and the guest-facing consequence has been addressed.

---

## System Administration

Restricted to the Guestplan Administrator.

Floor-level reservation access shall not include:

- user administration;
- configuration changes;
- reporting access unless needed;
- data exports;
- permission management;
- or unrelated administrative capability.

---

# Standard Reservation Information

The receiving actor shall obtain and confirm the operationally required information.

Minimum information:

- guest name;
- telephone number;
- reservation date;
- reservation time;
- number of guests;
- Teppan or Sushi;
- allergy information;
- necessary operational notes.

The architecture shall not require unnecessary guest information.

---

# Primary Operational Procedure

## OP-001 – Direct Workfloor Reservation Completion

### Trigger

A guest requests a standard future reservation directly on the restaurant floor.

### Procedure

1. The Reservation Receiving Actor obtains the required details.
2. The actor determines whether the request qualifies as a standard reservation.
3. The authorized actor accesses Guestplan through the approved device.
4. The actor confirms availability.
5. The actor enters the reservation information.
6. Before saving, the actor repeats or confirms the critical details with the guest.
7. The actor saves the reservation.
8. The actor confirms that the reservation is visibly present in Guestplan.
9. The actor checks:
   - date;
   - time;
   - number of guests;
   - dining area;
   - sufficient guest identity;
   - essential operational notes.
10. The reservation is classified as completed.

### Completion Condition

The reservation is visibly present in Guestplan with the correct critical information.

### No Additional Task

No fallback task or WhatsApp transfer is created where direct completion succeeds.

---

# Fallback Operational Procedure

## OP-002 – Deferred Reservation Completion

### Trigger

Direct Guestplan completion cannot safely or successfully occur.

Possible causes:

- device unavailable;
- Guestplan unavailable;
- internet unavailable;
- receiving actor lacks authority;
- required information is incomplete;
- management decision required;
- availability uncertain;
- save not confirmed;
- or another operational exception.

### Procedure

1. The receiving actor preserves the accepted or pending guest commitment.
2. A persistent shared fallback action is created immediately.
3. The action is placed in the designated organizational reservation-action location.
4. The action is linked to the original request or source.
5. One current owner or active role is established.
6. The reason for fallback is recorded.
7. The required next action is recorded.
8. A safe attention rule or point is assigned.
9. The action remains visibly unresolved.
10. The owner performs the required decision or Guestplan action.
11. Actual Guestplan completion is confirmed.
12. The correct fallback action is closed.
13. Closure becomes visible to relevant actors.

---

# Fallback Action Minimum Content

A fallback action shall contain or reliably reference:

- reservation date;
- reservation time;
- number of guests;
- dining area;
- sufficient guest or source identity;
- required action;
- reason direct completion failed;
- current owner;
- current state;
- next required action;
- safe attention rule or point.

Sensitive details should remain in the source where copying is unnecessary.

---

# Fallback State Model

Minimum semantic states:

```text
OPEN
    ↓
OWNED
    ↓
COMPLETED
```

Where separate checking occurs:

```text
OPEN
    ↓
OWNED
    ↓
COMPLETED
    ↓
VERIFIED
```

Exceptional states may include:

- NEEDS INFORMATION
- AWAITING DECISION
- ESCALATED
- FAILED
- CANCELLED

Exact software labels may differ.

---

# Ownership Rule

Every unresolved fallback action shall have one current owner or one explicitly active operational role.

Acceptable models:

## Direct Ownership

```text
Fallback action created
        ↓
Specific authorized actor accepts or receives responsibility
```

## On-Duty Role Ownership

```text
Fallback action created
        ↓
Established operational rule applies
        ↓
Manager on Duty owns the action
```

The following is insufficient:

> Management will handle it.

---

# Ownership Transfer

Where the current owner cannot complete the action:

```text
Current owner
        ↓
Transfer initiated
        ↓
New authorized owner identified
        ↓
Responsibility continuity preserved
```

The action shall not become ownerless during shift changes, absence or transfer.

---

# Latest Safe Attention Rule

The operational default shall be:

> A fallback reservation action must be completed or explicitly handed over before the responsible management shift ends.

In addition:

> All remaining open fallback actions shall be reviewed during the next daily reservation check and before the relevant reservation enters floor-plan preparation.

A more urgent action may require earlier attention based on:

- reservation date;
- reservation time;
- capacity risk;
- guest impact;
- or operational consequence.

---

# Daily Reservation Review

The Reservation Review Actor shall review:

- reservations for today;
- reservations for tomorrow;
- other upcoming reservations within the operational preparation horizon;
- all open fallback reservation actions;
- relevant modifications;
- and relevant cancellations.

The review shall identify:

- missing Guestplan entries;
- unresolved actions;
- Guestplan and source discrepancies;
- duplicate reservations;
- capacity conflicts;
- and changes that must reach the physical Floor Reservation Plan.

---

# Guestplan-to-Floor-Plan Flow

```text
Guestplan reservations
        ↓
Daily and rolling review
        ↓
Today / tomorrow / up to three days ahead
        ↓
Relevant reservations selected
        ↓
Physical A4 Floor Reservation Plan updated
```

The physical plan records:

```text
Time → Number of guests → Guest name
```

Additional operational information may be written below the reservation inside brackets.

The left side represents Teppan Yaki.

The right side represents Sushi.

---

# Same-Day Walk-In Rule

Same-day walk-ins may continue to be entered directly into the physical Floor Reservation Plan where this remains the accepted operational practice.

The initial architecture does not require every same-day walk-in to create a future Guestplan reservation record.

However, same-day walk-in handling shall not be confused with future-reservation completion.

---

# Completion Model

## Direct Completion

```text
Guestplan entry saved
        ↓
Reservation visibly present
        ↓
Critical details checked
        ↓
Completed
```

## Fallback Completion

```text
Fallback action open
        ↓
Required Guestplan action performed
        ↓
Authorized actor confirms completion
        ↓
Correct fallback action closed
```

Where Guestplan or another actor independently verifies the entry, a stronger verification state may be recorded.

---

# Verification Model

## Level 1 – Direct Actor Confirmation

The authorized actor verifies that the reservation appears in Guestplan after saving.

This is the normal minimum for direct workfloor entry.

## Level 2 – Independent Operational Review

Another authorized actor confirms the reservation during daily review or floor-plan preparation.

## Level 3 – Technical Verification

A system integration confirms Guestplan state.

Level 3 is not required for the initial architecture.

The architecture shall not claim technical verification where only actor confirmation exists.

---

# Security Architecture

## SA-001 – Individual Accountability

Each authorized actor should use an individual Guestplan identity where supported.

Shared personal credentials are prohibited.

---

## SA-002 – Least Privilege

Every user receives only the access needed for the assigned operational role.

Floor-entry access shall not automatically include administrative authority.

---

## SA-003 – Device Locking

The workfloor device shall:

- lock automatically;
- require controlled authentication;
- not remain permanently open;
- and prevent easy unauthorized access.

---

## SA-004 – Physical Placement

The device shall be positioned so that:

- authorized staff can use it quickly;
- guests cannot easily read the screen;
- unauthorized persons cannot operate it;
- and the device remains physically secure.

---

## SA-005 – Visual Privacy

Guest information shall not remain unnecessarily visible.

Controls may include:

- screen orientation;
- privacy screen;
- short lock time;
- limited field visibility;
- and closing Guestplan after use.

---

## SA-006 – Access Lifecycle

Access shall be:

- formally granted;
- role-appropriate;
- reviewed;
- changed when responsibilities change;
- suspended when necessary;
- and revoked when employment or authorization ends.

---

## SA-007 – Device Management

The approved device shall have:

- current operating-system updates;
- device PIN;
- approved applications;
- secured network access;
- controlled installation rights;
- and remote management where proportionate.

---

# Data Architecture

## Guestplan Data

Guestplan contains the completed operational reservation representation.

## Fallback Data

The fallback mechanism shall contain only enough information to:

- identify the commitment;
- assign responsibility;
- perform the required action;
- and support recovery.

## WhatsApp Data

WhatsApp may remain a communication or source channel.

It shall not be treated as the sole persistent unresolved-action mechanism.

## Physical Floor Plan Data

The physical Floor Reservation Plan contains selected operational information needed for service.

---

# Data-Minimization Rule

The architecture shall not copy full guest information into every system.

Where possible:

```text
Fallback action
        ↓
Stores minimum operational reference
        ↓
Original source or Guestplan stores detailed information
```

Phone numbers, allergy details and special requests shall only be duplicated where operationally necessary and appropriate.

---

# Exception Architecture

## EX-001 – Guestplan Unavailable

```text
Guestplan unavailable
        ↓
Fallback action created
        ↓
Current owner established
        ↓
Retry after availability returns
        ↓
Guestplan entry completed
        ↓
Fallback action closed
```

---

## EX-002 – Device Unavailable

Use another approved authorized device where available.

Otherwise activate the fallback.

---

## EX-003 – Missing Information

```text
Required information missing
        ↓
Fallback action remains unresolved
        ↓
State: NEEDS INFORMATION
        ↓
Owner obtains missing information
        ↓
Guestplan completion
```

The actor shall not guess critical information.

---

## EX-004 – Management Decision Required

```text
Exceptional reservation
        ↓
Fallback action
        ↓
Reservation Authority becomes owner
        ↓
Accept / modify / decline decision
        ↓
Guest and Guestplan updated appropriately
        ↓
Action closed
```

---

## EX-005 – Save Uncertain

Where the actor cannot confirm whether Guestplan saved the reservation:

1. do not assume completion;
2. search Guestplan for the reservation;
3. avoid immediate duplicate entry;
4. create a fallback action if uncertainty remains;
5. reconcile the final state.

---

## EX-006 – Incorrect Entry

Where an error is discovered:

1. preserve the original guest commitment;
2. identify the incorrect record;
3. correct the Guestplan entry through an authorized actor;
4. confirm the corrected details;
5. record significant errors where operationally useful;
6. provide additional training where a repeated pattern exists.

---

## EX-007 – Duplicate Reservation

Where a likely duplicate is found:

1. compare guest identity and reservation details;
2. determine whether one or two commitments exist;
3. do not delete without authority;
4. correct Guestplan;
5. update affected operational representations.

---

# Recovery Architecture

Every failure shall retain a next action.

Examples:

| Failure | Required Recovery |
|---|---|
| Guestplan unavailable | Create fallback and retry |
| Device unavailable | Use approved alternative or fallback |
| Actor lacks permission | Assign Reservation Authority |
| Missing information | Contact guest or receiving actor |
| Save uncertain | Search, reconcile and avoid duplicate |
| Wrong entry | Correct and verify |
| Duplicate record | Investigate and resolve |
| Owner unavailable | Transfer responsibility |
| Fallback task overdue | Escalate during review |
| Guest request cannot be accepted | Management decision and guest communication |

---

# Reconciliation Architecture

Reconciliation exists between operational representations.

## Guestplan and Fallback Queue

Every completed fallback action shall correspond to an actual Guestplan action or another justified terminal outcome.

Open fallback actions shall not be marked completed without operational completion.

## Guestplan and Physical Floor Plan

Changes relevant to service shall be propagated to the physical plan during review.

## Source and Guestplan

Where source information and Guestplan disagree, the guest commitment shall be clarified and the operational representations corrected.

---

# Prohibited Architecture Patterns

The following patterns are prohibited:

## PA-001 – Unprotected Deferred Handoff

```text
Reservation accepted
        ↓
Message sent
        ↓
No persistent unresolved action
```

## PA-002 – Shared Credential Access

```text
Multiple actors
        ↓
One personal Guestplan account
        ↓
No reliable attribution
```

## PA-003 – False Completion

```text
Action marked done
        ↓
Guestplan action not completed
```

## PA-004 – Unowned Queue

```text
Fallback task visible
        ↓
No current accountable actor or role
```

## PA-005 – Silent Task Deletion

An unresolved fallback action shall not disappear through deletion without a justified terminal state.

## PA-006 – Unnecessary Data Duplication

Full guest information shall not be copied into multiple systems without operational justification.

## PA-007 – Automation Before Need

WhatsApp-triggered automation shall not be introduced until operational evidence justifies the added complexity.

---

# Architecture Conformance

The architecture conforms to RCS-001 where:

1. direct completion occurs immediately where possible;
2. fallback actions are persistent where completion is deferred;
3. one current owner exists;
4. unresolved work remains visible;
5. safe attention is protected;
6. actual Guestplan completion is required;
7. closure applies to the correct commitment;
8. exceptions remain recoverable;
9. guest information is protected;
10. operational burden remains proportionate.

---

# Implementation Preconditions

Before implementation begins, the following must be established through IF-003:

1. Guestplan supports suitable user management.
2. Required permission granularity is available or acceptable.
3. User attribution is sufficient.
4. The intended device is supported.
5. Authentication is usable during service.
6. Successful save is clearly visible.
7. Licensing and cost are acceptable.
8. Workfloor privacy can be protected.
9. Device availability is sufficient.
10. The fallback mechanism can be operated.

If a critical precondition fails, IAD-001 must be revised before deployment.

---

# Implementation Phases

## Phase 1 – Account Verification

- inspect Guestplan user management;
- inspect roles and permissions;
- confirm attribution;
- confirm licensing;
- confirm supported devices;
- complete IF-003 account verification.

Exit condition:

Required Guestplan capability established.

---

## Phase 2 – Architecture Configuration

- select approved workfloor device;
- configure Guestplan user access;
- define standard-reservation limits;
- define exception rules;
- establish fallback mechanism;
- define daily review;
- define access lifecycle.

Exit condition:

Architecture configured without live operational use.

---

## Phase 3 – Controlled Testing

- create test user;
- create controlled test reservations;
- test permission restrictions;
- test user attribution;
- test workfloor timing;
- test locking;
- test connectivity failure;
- test fallback;
- test reconciliation.

Exit condition:

Critical architecture controls pass.

---

## Phase 4 – Staff Preparation

- authorize initial actors;
- provide training;
- test competency;
- publish quick operational instructions;
- establish support and error-reporting route.

Exit condition:

Initial users demonstrate safe operation.

---

## Phase 5 – Bounded Pilot

Initial pilot scope:

- standard future floor reservations;
- selected authorized Supervisors;
- defined service periods;
- direct Guestplan entry;
- fallback where required.

Evidence collected:

- entry time;
- error frequency;
- fallback frequency;
- user difficulty;
- privacy or access incidents;
- unresolved actions;
- incorrect entries;
- duplicate entries;
- operational burden.

Exit condition:

Pilot evidence supports continued use, modification or rejection.

---

## Phase 6 – Production Adoption

Production adoption occurs only after the bounded pilot passes.

Actions:

- formalize operating responsibility;
- extend access only where justified;
- preserve fallback;
- monitor incidents;
- review permissions;
- maintain training.

---

# Success Criteria

IAD-001 succeeds where:

- standard floor reservations can be entered directly;
- normal reservation handoffs materially decrease;
- Guestplan entry is completed at acceptance;
- fallback actions remain uncommon but reliable;
- no reservation depends solely on WhatsApp history;
- no unresolved action lacks ownership;
- no material privacy or access failure occurs;
- staff can execute the process during service;
- and operational burden is lower than the former process.

---

# Failure Criteria

The architecture requires revision or rejection where:

- Guestplan access is too broad;
- individual attribution cannot be preserved;
- the device is too slow or unavailable;
- staff regularly bypass direct entry;
- incorrect reservations increase materially;
- guest information is exposed;
- fallback tasks are routinely forgotten;
- daily review does not occur;
- or the architecture creates greater burden or risk than the prior process.

---

# Architecture Decisions

## ADI-001 – Direct Completion Is Primary

Accepted.

Direct Guestplan completion is preferred over deferred handoff.

## ADI-002 – Persistent Task Is Fallback

Accepted.

The shared task mechanism is used only where direct completion cannot occur.

## ADI-003 – WhatsApp Automation Is Deferred

Accepted.

IC-001 is not included in the initial implementation.

## ADI-004 – Guestplan Remains the Completed Operational Representation

Accepted.

The fallback task does not become a competing reservation system.

## ADI-005 – Access Is Limited and Attributable

Accepted conditionally.

Final implementation depends on Guestplan capability verification.

## ADI-006 – Existing Physical Floor Plan Remains

Accepted.

Its redesign is outside the initial implementation boundary.

---

# Residual Unknowns

The following remain unresolved pending IF-003 completion:

- exact Guestplan permission granularity;
- account and user cost;
- create-only or limited access;
- shared-device user switching;
- session behavior;
- offline behavior;
- save confirmation behavior;
- duplicate detection;
- workfloor device choice;
- physical placement;
- training time;
- and operational fallback tool.

These unknowns constrain implementation but do not invalidate the architecture direction.

---

# Current Architecture Verdict

Verdict

Approved Operational Architecture

Primary Pathway

Direct workfloor Guestplan entry.

Fallback Pathway

Persistent shared reservation action.

Deferred Enhancement

WhatsApp-triggered automation remains outside the initial implementation scope.

Deployment Status

Approved for Implementation Preparation

The architecture is no longer conditional because the required Guestplan account-level assumptions have been confirmed through IF-003.

---

# Traceability

```text
EC-001
    ↓
CE-001 – Deferred reservation failure
    ↓
OD-001 – Unclosed completion loop
    ↓
DES-001 – Closed-loop future-reservation completion
    ↓
RCS-001 – Reservation Commitment Completion Standard
    ↓
IR-001 – Established implementation requirements
    ↓
IC-001 / IC-002 / IC-003
    ↓
ICA-001 / ICA-002 / ICA-003
    ↓
ICE-001 – Comparative implementation evaluation
    ↓
IF-003 – Shared workfloor Guestplan feasibility
    ↓
IAD-001 – Reservation completion implementation architecture
```

---

# IAD-001 Conclusion

IAD-001 establishes a direct-completion-first reservation architecture for Konnichiwa.

The normal operational pathway is:

```text
Guest reservation commitment
        ↓
Authorized floor actor
        ↓
Direct Guestplan entry
        ↓
Successful save verified
        ↓
Completed
```

Where direct completion cannot occur:

```text
Guest reservation commitment
        ↓
Persistent fallback action
        ↓
Explicit accountability
        ↓
Guestplan completion later
        ↓
Correct fallback closure
```

The architecture removes unnecessary handoffs from normal reservation entry while preserving RCS-001 protection for exceptions and unavailable conditions.

The architecture remains conditional on Guestplan account-level feasibility, workfloor usability and fallback testing.

No deployment is authorized until those conditions are established.

