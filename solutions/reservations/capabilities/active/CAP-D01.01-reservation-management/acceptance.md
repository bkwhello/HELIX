# CAP-D01.01 — Reservation Management
# Acceptance Model

## Metadata

```yaml
artifact_id: CAP-D01.01-ACCEPTANCE
artifact_type: Capability Acceptance Model

capability_id: CAP-D01.01
capability_name: Reservation Management

version: 1.1.0
status: Approved

owner: Reservation Management
authority: capability.md
```

Version 1.1.0 adds CAP-D01.01-AC38, alongside CAP-D01.01-R50 in `rule-model.md`.

---

# 1. Purpose

This document defines the acceptance conditions for Reservation Management.

It provides operational evidence that:

- the capability performs its defined responsibility;
- reservation state remains valid;
- business rules are enforced;
- events are produced correctly;
- interactions preserve ownership boundaries;
- failures do not corrupt authoritative reservation information;
- authorized users can perform required operational work.

Acceptance scenarios are implementation-independent.

They may later be implemented as:

- automated tests;
- integration tests;
- workflow tests;
- operational simulations;
- pilot validation;
- manual acceptance tests.

---

# 2. Acceptance Principle

A capability is accepted when its operational behavior conforms to:

```text
Capability Contract

+

State Model

+

Rule Model

+

Event Model

+

Interaction Model
```

Passing technical tests alone does not establish capability acceptance.

The capability must demonstrate the intended operational outcome.

---

# 3. Acceptance Levels

| Level | Meaning |
|---|---|
| A1 — Contract | Capability responsibility and boundaries are correct |
| A2 — Behavioral | States, rules, commands, and events behave correctly |
| A3 — Interaction | Collaboration with other capabilities is correct |
| A4 — Operational | Authorized users can perform real operational work |
| A5 — Resilience | Failures preserve integrity and recover safely |
| A6 — Traceability | Outcomes can be traced to rules, events, actors, and evidence |

All blocking acceptance scenarios shall pass before the capability becomes Active.

---

# 4. Scenario Structure

Each scenario shall contain:

```yaml
scenario_id:
title:
acceptance_level:
priority:
related_rules:
related_events:
preconditions:
given:
when:
then:
evidence:
```

Priority values:

```text
Critical
Required
Recommended
Deferred
```

---

# 5. Reservation Creation

## CAP-D01.01-AC01 — Create a Valid Reservation

```yaml
acceptance_level: A2
priority: Critical
related_rules:
  - CAP-D01.01-R01
  - CAP-D01.01-R03
  - CAP-D01.01-R06
  - CAP-D01.01-R07
  - CAP-D01.01-R08
  - CAP-D01.01-R09
  - CAP-D01.01-R10
  - CAP-D01.01-R12
related_events:
  - CAP-D01.01-E01
```

**Given**

- a valid reservation date;
- a valid reservation time;
- a party size greater than zero;
- a valid primary contact;
- a known reservation source;
- a valid Service Period.

**When**

an authorized actor submits Create Reservation.

**Then**

- exactly one reservation is created;
- exactly one internal Reservation Identity is assigned;
- the reservation enters Proposed;
- the reservation references one Service Period;
- the reservation references one primary contact;
- `ReservationCreated` is emitted;
- the actor, source, and timestamp are recorded.

**Evidence**

- authoritative reservation record;
- emitted business event;
- audit entry;
- state verification.

---

## CAP-D01.01-AC02 — Reject Creation Without Required Information

```yaml
acceptance_level: A2
priority: Critical
related_rules:
  - CAP-D01.01-R08
  - CAP-D01.01-R43
related_events:
  - CAP-D01.01-E08
```

**Given**

a reservation request is missing one or more required fields.

**When**

Create Reservation is submitted.

**Then**

- no reservation is created;
- no Reservation Identity is assigned;
- no success event is emitted;
- the rejection identifies the failed validation;
- existing reservation state remains unchanged.

---

## CAP-D01.01-AC03 — Reject Invalid Party Size

```yaml
acceptance_level: A2
priority: Critical
related_rules:
  - CAP-D01.01-R09
  - CAP-D01.01-R43
```

**Scenario Outline**

**Given** a reservation request has party size `<party_size>`.

**When** Create Reservation is submitted.

**Then**

the request is rejected.

| party_size |
|---:|
| 0 |
| -1 |
| 1.5 |
| non-numeric |
| empty |

---

## CAP-D01.01-AC04 — Preserve Internal Identity for External Reservations

```yaml
acceptance_level: A2
priority: Critical
related_rules:
  - CAP-D01.01-R01
  - CAP-D01.01-R13
related_events:
  - CAP-D01.01-E01
```

**Given**

an approved external channel provides an external reservation reference.

**When**

the reservation is imported.

**Then**

- HELIX assigns one internal Reservation Identity;
- the external reference is stored as a source reference;
- the external reference does not replace the internal identity;
- the source remains attributable.

---

## CAP-D01.01-AC05 — Detect a Potential Duplicate

```yaml
acceptance_level: A2
priority: Required
related_rules:
  - CAP-D01.01-R14
```

**Given**

an existing reservation has the same or materially similar:

- contact;
- date;
- time;
- party size;
- source reference.

**When**

another creation request is submitted.

**Then**

- the potential duplicate is surfaced;
- the original reservation is not modified;
- creation proceeds only according to approved duplicate policy;
- the user or calling capability receives an explicit decision.

---

# 6. Reservation Confirmation

## CAP-D01.01-AC06 — Confirm a Proposed Reservation

```yaml
acceptance_level: A2
priority: Critical
related_rules:
  - CAP-D01.01-R22
  - CAP-D01.01-R23
  - CAP-D01.01-R24
related_events:
  - CAP-D01.01-E03
```

**Given**

a valid reservation exists in Proposed.

**When**

an authorized actor submits Confirm Reservation.

**Then**

- the reservation enters Confirmed;
- `ReservationConfirmed` is emitted;
- the transition is historically traceable;
- no table or seat assignment is implied;
- no preferred area is represented as guaranteed unless another capability has provided that guarantee.

---

## CAP-D01.01-AC07 — Reject Confirmation from a Terminal State

```yaml
acceptance_level: A2
priority: Critical
related_rules:
  - CAP-D01.01-R22
  - CAP-D01.01-R31
  - CAP-D01.01-R43
```

**Scenario Outline**

**Given** a reservation is `<state>`.

**When** Confirm Reservation is submitted.

**Then**

- the request is rejected;
- the state remains unchanged;
- no `ReservationConfirmed` event is emitted.

| state |
|---|
| Cancelled |
| Completed |

---

# 7. Reservation Modification

## CAP-D01.01-AC08 — Modify Valid Reservation Information

```yaml
acceptance_level: A2
priority: Critical
related_rules:
  - CAP-D01.01-R15
  - CAP-D01.01-R18
  - CAP-D01.01-R19
related_events:
  - CAP-D01.01-E02
```

**Given**

an existing non-terminal reservation.

**When**

an authorized actor changes valid modifiable information.

**Then**

- the change is applied atomically;
- the Reservation Identity remains unchanged;
- previous and resulting values are traceable;
- actor, source, and timestamp are recorded;
- `ReservationModified` is emitted.

---

## CAP-D01.01-AC09 — Revalidate Service Period After Date or Time Change

```yaml
acceptance_level: A3
priority: Critical
related_rules:
  - CAP-D01.01-R20
```

**Given**

an existing reservation is associated with a Service Period.

**When**

its date or time changes.

**Then**

- Service Period Management is asked to determine the applicable Service Period;
- the old reference is retained only if it remains valid;
- the reservation never references an invalid Service Period;
- failure to determine a required Service Period prevents the modification.

---

## CAP-D01.01-AC10 — Revalidate Downstream Decisions After Party-Size Change

```yaml
acceptance_level: A3
priority: Required
related_rules:
  - CAP-D01.01-R21
related_events:
  - CAP-D01.01-E02
```

**Given**

a Confirmed reservation has downstream planning dependencies.

**When**

party size changes.

**Then**

- the reservation stores the valid new party size;
- affected capabilities are informed;
- previous seating or availability decisions are not silently assumed valid;
- revalidation status is operationally visible where necessary.

---

## CAP-D01.01-AC11 — Prevent Internal Identity Modification

```yaml
acceptance_level: A2
priority: Critical
related_rules:
  - CAP-D01.01-R02
  - CAP-D01.01-R17
```

**Given**

an existing reservation.

**When**

an actor or system attempts to modify the internal Reservation Identity.

**Then**

- the request is rejected;
- the identity remains unchanged;
- no successful modification event is emitted.

---

# 8. Reservation Cancellation

## CAP-D01.01-AC12 — Cancel a Proposed Reservation

```yaml
acceptance_level: A2
priority: Critical
related_rules:
  - CAP-D01.01-R25
  - CAP-D01.01-R27
  - CAP-D01.01-R28
related_events:
  - CAP-D01.01-E04
```

**Given**

a reservation exists in Proposed.

**When**

an authorized actor cancels it.

**Then**

- the reservation enters Cancelled;
- `ReservationCancelled` is emitted;
- the Reservation Identity remains preserved;
- the reservation is no longer treated as an active expected visit;
- dependent capabilities are informed.

---

## CAP-D01.01-AC13 — Cancel a Confirmed Reservation

```yaml
acceptance_level: A2
priority: Critical
related_rules:
  - CAP-D01.01-R25
  - CAP-D01.01-R27
related_events:
  - CAP-D01.01-E04
```

**Given**

a reservation exists in Confirmed.

**When**

an authorized cancellation is submitted.

**Then**

the reservation becomes Cancelled and the operational expectation is released.

---

## CAP-D01.01-AC14 — Reject Cancellation of a Completed Reservation

```yaml
acceptance_level: A2
priority: Critical
related_rules:
  - CAP-D01.01-R25
  - CAP-D01.01-R31
  - CAP-D01.01-R43
```

**Given**

a reservation exists in Completed.

**When**

Cancel Reservation is submitted.

**Then**

- the command is rejected;
- the reservation remains Completed;
- no cancellation event is emitted.

---

# 9. Reservation Completion

## CAP-D01.01-AC15 — Complete a Confirmed Reservation

```yaml
acceptance_level: A2
priority: Critical
related_rules:
  - CAP-D01.01-R29
  - CAP-D01.01-R30
  - CAP-D01.01-R31
related_events:
  - CAP-D01.01-E05
```

**Given**

- a reservation exists in Confirmed;
- valid operational evidence indicates the visit has concluded.

**When**

Complete Reservation is submitted by an authorized actor or capability.

**Then**

- the reservation enters Completed;
- `ReservationCompleted` is emitted;
- the state becomes terminal;
- historical information remains available.

---

## CAP-D01.01-AC16 — Reject Completion Without Operational Evidence

```yaml
acceptance_level: A2
priority: Critical
related_rules:
  - CAP-D01.01-R30
  - CAP-D01.01-R43
```

**Given**

a Confirmed reservation has no evidence that service concluded.

**When**

Complete Reservation is submitted without an authorized override.

**Then**

- completion is rejected;
- the reservation remains Confirmed;
- no completion event is emitted.

---

# 10. Authorization and Override

## CAP-D01.01-AC17 — Reject Unauthorized Modification

```yaml
acceptance_level: A2
priority: Critical
related_rules:
  - CAP-D01.01-R33
  - CAP-D01.01-R43
```

**Given**

an actor lacks permission to modify reservations.

**When**

the actor submits Modify Reservation.

**Then**

- the request is rejected;
- reservation state and data remain unchanged;
- the unauthorized attempt is attributable.

---

## CAP-D01.01-AC18 — Perform an Authorized Override

```yaml
acceptance_level: A2
priority: Critical
related_rules:
  - CAP-D01.01-R39
  - CAP-D01.01-R40
  - CAP-D01.01-R41
  - CAP-D01.01-R42
related_events:
  - CAP-D01.01-E07
```

**Given**

- a rule explicitly permits override;
- the actor has the required role;
- a valid reason is provided.

**When**

the actor authorizes the override.

**Then**

- the override is applied only to the permitted rule;
- the rule identifier is recorded;
- the actor, reason, timestamp, previous value, and resulting value are recorded;
- `ReservationRuleOverridden` is emitted;
- the override is visibly distinguishable from ordinary processing.

---

## CAP-D01.01-AC19 — Reject a Generic or Unpermitted Override

```yaml
acceptance_level: A2
priority: Critical
related_rules:
  - CAP-D01.01-R39
  - CAP-D01.01-R40
```

**Given**

a blocking rule does not permit override, or the actor lacks override authority.

**When**

an override is attempted.

**Then**

- the override is rejected;
- no state change occurs;
- no successful override event is emitted.

---

# 11. Failure and Resilience

## CAP-D01.01-AC20 — Preserve State When Persistence Fails

```yaml
acceptance_level: A5
priority: Critical
related_rules:
  - CAP-D01.01-R05
  - CAP-D01.01-R43
```

**Given**

a valid reservation command passes business validation.

**When**

authoritative persistence fails before the state change is committed.

**Then**

- the previous state remains authoritative;
- no partial update is visible;
- no success event is published;
- the failure is explicit;
- retry does not create duplication.

---

## CAP-D01.01-AC21 — Safely Process a Repeated Command

```yaml
acceptance_level: A5
priority: Critical
related_rules:
  - CAP-D01.01-R44
```

**Given**

a successfully processed command is submitted again with the same command identity.

**When**

the repeated command is processed.

**Then**

- no duplicate reservation is created;
- no duplicate lifecycle transition occurs;
- the resulting business state remains correct;
- the response makes the already-processed outcome explicit.

---

## CAP-D01.01-AC22 — Preserve Internal State During External Synchronization Failure

```yaml
acceptance_level: A5
priority: Critical
related_rules:
  - CAP-D01.01-R45
  - CAP-D01.01-R46
```

**Given**

an internal reservation change succeeds.

**When**

synchronization with an external reservation channel fails.

**Then**

- the internal reservation remains authoritative;
- Reservation Management does not roll back the successful change;
- the responsible Integration capability records and exposes the synchronization failure;
- reconciliation can occur safely;
- no duplicate reservation is created.

This scenario tests the boundary between Reservation Management and the future Integration capability. Reservation Management does not own or emit the synchronization-failure event; see `event-model.md`.

---

## CAP-D01.01-AC23 — Defer a Non-Blocking Interaction

```yaml
acceptance_level: A3
priority: Required
```

**Given**

a reservation is successfully created.

**And**

Communication or Dashboard is temporarily unavailable.

**When**

the creation completes.

**Then**

- the reservation remains successfully created;
- `ReservationCreated` remains preserved;
- the unavailable interaction is deferred or retried;
- the failure does not corrupt reservation state;
- operational visibility identifies the pending interaction where needed.

---

## CAP-D01.01-AC24 — Reject a Command When a Blocking Dependency Is Unavailable

```yaml
acceptance_level: A3
priority: Critical
```

**Given**

Service Period determination is required and unavailable.

**When**

Create Reservation is submitted.

**Then**

- no invalid reservation is committed;
- no success event is emitted;
- the caller receives an explicit dependency failure;
- retry remains safe.

---

# 12. Event Integrity

## CAP-D01.01-AC25 — Emit One Lifecycle Event for One Successful Transition

```yaml
acceptance_level: A2
priority: Critical
related_events:
  - CAP-D01.01-E01
  - CAP-D01.01-E03
  - CAP-D01.01-E04
  - CAP-D01.01-E05
```

**Given**

a valid lifecycle transition succeeds once.

**When**

the transition is committed.

**Then**

- exactly one corresponding lifecycle event is recorded;
- the event references the correct Reservation Identity;
- the event timestamp and actor are present;
- the event follows the committed transition;
- no contradictory lifecycle event is emitted.

---

## CAP-D01.01-AC26 — Emit No Success Event for a Rejected Command

```yaml
acceptance_level: A2
priority: Critical
related_rules:
  - CAP-D01.01-R43
```

**Given**

a command fails authorization, validation, or rule evaluation.

**When**

the rejection is returned.

**Then**

- no lifecycle success event is emitted;
- the authoritative reservation remains unchanged;
- rejection evidence is available where operationally required.

---

## CAP-D01.01-AC27 — Preserve Event Immutability

```yaml
acceptance_level: A6
priority: Critical
```

**Given**

a reservation event has been recorded.

**When**

a user or process attempts to change its historical meaning or payload.

**Then**

- the original event remains immutable;
- any permitted correction is recorded as a new event;
- chronology and causality remain traceable.

---

## CAP-D01.01-AC28 — Preserve Correlation and Causation

```yaml
acceptance_level: A6
priority: Required
```

**Given**

one command produces a state transition and one or more related events or interactions.

**When**

the operational history is inspected.

**Then**

the command, transition, events, retries, and downstream interactions can be correlated through stable identifiers.

---

# 13. Ownership Boundaries

## CAP-D01.01-AC29 — Do Not Own Seating Assignment

```yaml
acceptance_level: A1
priority: Critical
related_rules:
  - CAP-D01.01-R24
  - CAP-D01.01-R48
```

**Given**

a reservation contains a preferred seating area.

**When**

the reservation is confirmed.

**Then**

- Reservation Management preserves the preference;
- it does not create a table assignment;
- it does not represent the preference as guaranteed;
- Seating Assignment remains authoritative for allocated seating.

---

## CAP-D01.01-AC30 — Do Not Own Availability Decisions

```yaml
acceptance_level: A1
priority: Critical
related_rules:
  - CAP-D01.01-R47
```

**Given**

a reservation request requires an availability decision.

**When**

availability is evaluated.

**Then**

- Availability Management owns the decision;
- Reservation Management uses the returned decision;
- Reservation Management does not independently redefine capacity policy.

---

## CAP-D01.01-AC31 — Do Not Own Allergy Meaning

```yaml
acceptance_level: A1
priority: Critical
related_rules:
  - CAP-D01.01-R37
```

**Given**

critical allergy information is associated with a reservation.

**When**

the reservation is displayed or modified.

**Then**

- Reservation Management may reference the information;
- it does not redefine its authoritative meaning;
- Allergy and Critical Notes Management remains the owner;
- allergy information is not reduced to unstructured notes.

---

# 14. Operational Acceptance

## CAP-D01.01-AC32 — Staff Can Create a Telephone Reservation

```yaml
acceptance_level: A4
priority: Critical
```

**Given**

an authorized staff member receives a valid telephone reservation request.

**When**

the staff member records the booking.

**Then**

- the reservation is stored in the authoritative reservation record;
- source is Telephone;
- required information is captured;
- the guest does not depend on a handwritten note or private message for the booking to become operationally visible.

---

## CAP-D01.01-AC33 — Staff Can Record a Future Walk-in Request

```yaml
acceptance_level: A4
priority: Critical
```

**Given**

a guest physically requests a reservation for a future date.

**When**

an authorized floor actor records the request.

**Then**

- the request enters the authoritative reservation process;
- source is Walk-in or Staff;
- missing required information is explicitly identified;
- the request is not dependent on an untracked handwritten note;
- responsibility for completion or confirmation is visible.

---

## CAP-D01.01-AC34 — Today’s Active Reservations Are Operationally Discoverable

```yaml
acceptance_level: A4
priority: Critical
```

**Given**

multiple reservations exist across approved channels.

**When**

authorized staff inspect reservations for the current service period.

**Then**

- all authoritative active reservations are discoverable;
- Proposed, Confirmed, and Cancelled states are distinguishable;
- source and changes are traceable;
- cancelled reservations are not treated as expected active visits.

---

## CAP-D01.01-AC35 — Modification Is Visible to Operational Users

```yaml
acceptance_level: A4
priority: Required
```

**Given**

a confirmed reservation changes time, party size, contact, or operational information.

**When**

the modification succeeds.

**Then**

- authorized operational users see the current authoritative information;
- the previous information remains historically traceable;
- affected planning capabilities receive the change;
- users do not need to infer the update from external messages.

---

# 15. Privacy and Security Acceptance

## CAP-D01.01-AC36 — Restrict Reservation Data to Authorized Actors

```yaml
acceptance_level: A4
priority: Critical
```

**Given**

reservation data contains personal information.

**When**

an unauthorized actor requests access.

**Then**

- access is denied;
- no sensitive reservation information is disclosed;
- the attempt is recorded where required by policy.

---

## CAP-D01.01-AC37 — Record Actor Attribution

```yaml
acceptance_level: A6
priority: Critical
related_rules:
  - CAP-D01.01-R18
  - CAP-D01.01-R41
```

**Given**

a reservation is created, modified, cancelled, completed, corrected, or overridden.

**When**

the historical record is inspected.

**Then**

the responsible actor or trusted source can be identified.

---

## CAP-D01.01-AC38 — Reject Unauthorized Confirmation

```yaml
acceptance_level: A2
priority: Critical
related_rules:
  - CAP-D01.01-R50
  - CAP-D01.01-R43
```

**Given**

an actor lacks permission to confirm reservations.

**When**

the actor submits Confirm Reservation.

**Then**

- the request is rejected;
- the reservation remains Proposed;
- the unauthorized attempt is attributable.

Added in version 1.1.0, alongside CAP-D01.01-R50 (see `rule-model.md`).

---

# 16. Acceptance Traceability Matrix

| Acceptance Scenario | Capability Concern | Primary Rules | Primary Event |
|---|---|---|---|
| AC01–AC05 | Creation | R01–R14 | E01 |
| AC06–AC07 | Confirmation | R22–R24 | E03 |
| AC08–AC11 | Modification | R15–R21 | E02 |
| AC12–AC14 | Cancellation | R25–R28 | E04 |
| AC15–AC16 | Completion | R29–R31 | E05 |
| AC17–AC19 | Authorization and override | R32–R42 | E07 |
| AC20–AC24 | Failure and resilience | R43–R46 | — |
| AC25–AC28 | Event integrity | R04, R42–R44 | E01–E08, E10 |
| AC29–AC31 | Ownership boundaries | R24, R37, R47–R49 | Context-dependent |
| AC32–AC35 | Operational use | Multiple | Multiple |
| AC36–AC37 | Security and accountability | R18, R32–R35, R41 | Multiple |
| AC38 | Confirmation authorization | R50 | E03 |

---

# 17. Exit Criteria

CAP-D01.01 may move from Designed to In Development when:

- the capability contract is approved;
- state ownership is explicit;
- all blocking rules have stable identifiers;
- lifecycle events have stable identifiers;
- capability interactions are defined;
- critical unknowns are either resolved or explicitly deferred;
- acceptance scenarios are reviewed for operational validity.

CAP-D01.01 may move from In Development to Pilot when:

- all Critical automated acceptance scenarios pass;
- required capability interactions are available or safely simulated;
- failure and retry behavior has been tested;
- authorization and override behavior has been tested;
- no unresolved issue threatens authoritative reservation integrity.

CAP-D01.01 may move from Pilot to Active when:

- critical operational scenarios pass in real restaurant use;
- telephone and future walk-in reservations enter the authoritative record;
- staff can find and modify active reservations reliably;
- reservation changes remain traceable;
- external channel failures are operationally visible;
- responsible operational owners approve the capability;
- pilot evidence is preserved.

---

# 18. Deferred Acceptance

The following acceptance areas are deferred until their corresponding states or policies are engineered:

```yaml
deferred:
  - guest arrival
  - seated state
  - no-show handling
  - waiting-list conversion
  - reservation expiration
  - late-arrival policy
  - automatic completion
  - automatic confirmation
  - guest self-service cutoff rules
```

Deferred scenarios shall not be silently implemented without updating:

- `state-model.md`;
- `rule-model.md`;
- `event-model.md`;
- `interaction-model.md`;
- this acceptance model.

---

# 19. Evidence Register

Acceptance evidence should be recorded using:

```yaml
evidence_id:
scenario_id:
execution_date:
environment:
result:
  - passed
  - failed
  - blocked
  - deferred
executed_by:
implementation_reference:
test_reference:
observed_result:
deviation:
supporting_artifacts:
approval:
```

Evidence may include:

- automated test output;
- screenshots;
- event records;
- state histories;
- operational observation;
- staff validation;
- pilot findings;
- incident evidence;
- correction evidence.

---

# 20. Conformance

Reservation Management conforms to this acceptance model when:

- every Critical scenario passes;
- every Required scenario passes or has an approved temporary exception;
- state transitions match `state-model.md`;
- rule outcomes match `rule-model.md`;
- emitted events match `event-model.md`;
- interactions preserve the boundaries in `interaction-model.md`;
- operational users can complete required reservation work;
- failures preserve authoritative state;
- acceptance evidence remains traceable.

---

# 21. References

- `capability.md`
- `state-model.md`
- `rule-model.md`
- `event-model.md`
- `interaction-model.md`
- `CA-001 — Capability Architecture Standard`
- `EC-001 — Reservations Engineering Case`