# CAP-D01.01 — Reservation Management
# Rule Model

## Metadata

```yaml
artifact_id: CAP-D01.01-RULE
artifact_type: Capability Rule Model
capability_id: CAP-D01.01
capability_name: Reservation Management
version: 1.0.0
status: Approved
owner: Reservation Management
authority: CAP-D01.01 capability.md
```

---

# 1. Purpose

This document defines the authoritative business rules enforced by Reservation Management.

The rule model determines:

- whether a reservation may be created;
- whether reservation information may be changed;
- whether a reservation may change state;
- which data must remain valid;
- which actions require authorization;
- when an action shall be rejected;
- when an operational override may be allowed;
- what evidence shall be preserved.

The rules in this document apply independently from user interface, API, database, or implementation technology.

---

# 2. Rule Authority

Reservation Management is the authoritative owner of rules governing:

- reservation identity;
- reservation lifecycle;
- reservation creation;
- reservation modification;
- reservation confirmation;
- reservation cancellation;
- reservation completion;
- reservation party size;
- reservation date and time;
- reservation service-period reference;
- reservation operational notes.

Other capabilities may request or consume reservation decisions.

They shall not redefine these rules.

---

# 3. Rule Execution Principle

Every command shall be evaluated in the following order:

```text
Command Received
        ↓
Identity Validation
        ↓
Authorization Validation
        ↓
Input Validation
        ↓
Business Rule Evaluation
        ↓
State Transition Validation
        ↓
Atomic State Change
        ↓
Event Recording
        ↓
Result Returned
```

A state change shall occur only after all blocking rules have passed or an explicitly permitted override has been authorized.

---

# 4. Rule Classification

Rules are classified as:

| Type | Meaning |
|---|---|
| Invariant | Must always remain true |
| Validation | Determines whether supplied information is valid |
| Decision | Produces an operational decision |
| Authorization | Determines whether an actor may perform an action |
| Transition | Determines whether a state change is permitted |
| Override | Defines controlled bypass behavior |
| Exception | Defines behavior in exceptional circumstances |

---

# 5. Rule Severity

| Severity | Meaning |
|---|---|
| Advisory | Guidance only |
| Warning | Requires awareness but may allow continuation |
| Blocking | Prevents the action |
| Critical | Protects essential operational integrity |

Critical rules shall not be bypassed unless this document explicitly defines an override.

---

# 6. Core Invariants

## CAP-D01.01-R01 — Reservation Identity Is Required

```yaml
type: Invariant
severity: Critical
override_allowed: false
```

Every reservation shall have exactly one internal Reservation Identity.

A reservation shall not exist without an internal identifier.

---

## CAP-D01.01-R02 — Reservation Identity Is Immutable

```yaml
type: Invariant
severity: Critical
override_allowed: false
```

Once assigned, the internal Reservation Identity shall not change.

Changes to source references, guest details, date, time, party size, or reservation status shall not produce a new internal identity unless a genuinely new reservation is created.

---

## CAP-D01.01-R03 — One Current Reservation State

```yaml
type: Invariant
severity: Critical
override_allowed: false
```

A reservation shall exist in exactly one current lifecycle state.

The current state shall conform to `state-model.md`.

---

## CAP-D01.01-R04 — Reservation History Is Preserved

```yaml
type: Invariant
severity: Critical
override_allowed: false
```

Meaningful reservation lifecycle changes shall remain historically traceable.

A previous state or meaningful change shall not be silently erased.

Corrections shall preserve both the original action and the corrective action where accountability is required.

---

## CAP-D01.01-R05 — Reservation Changes Are Atomic

```yaml
type: Invariant
severity: Critical
override_allowed: false
```

A reservation command shall either complete fully or leave the authoritative reservation unchanged.

Partial reservation updates are prohibited.

---

## CAP-D01.01-R06 — Exactly One Service Period

```yaml
type: Invariant
severity: Blocking
override_allowed: false
```

Every active reservation shall belong to exactly one Service Period.

A reservation shall not belong to multiple Service Periods simultaneously.

---

## CAP-D01.01-R07 — Exactly One Primary Reservation Contact

```yaml
type: Invariant
severity: Blocking
override_allowed: false
```

Every active reservation shall reference exactly one primary Reservation Contact.

Additional guest or contact information may exist, but one contact shall remain operationally accountable for the booking.

---

# 7. Creation Rules

## CAP-D01.01-R08 — Required Creation Information

```yaml
type: Validation
severity: Blocking
override_allowed: false
```

A reservation creation request shall contain:

- reservation date;
- reservation time;
- party size;
- primary reservation contact;
- reservation source.

A reservation shall not be created when required information is absent.

---

## CAP-D01.01-R09 — Party Size Must Be Positive

```yaml
type: Validation
severity: Blocking
override_allowed: false
```

Party size shall be a whole number greater than zero.

Zero, negative, fractional, or non-numeric party sizes are invalid.

---

## CAP-D01.01-R10 — Reservation Date and Time Must Be Valid

```yaml
type: Validation
severity: Blocking
override_allowed: false
```

Reservation date and time shall form a valid operational date-time value.

The value shall be interpretable in the restaurant’s configured local timezone.

---

## CAP-D01.01-R11 — Past Reservation Creation Requires Explicit Policy

```yaml
type: Validation
severity: Blocking
override_allowed: true
```

A reservation shall not normally be created for a date and time that has already passed.

An authorized operational correction may create a historical reservation only when required to reconstruct or correct the operational record.

The reason shall be recorded.

---

## CAP-D01.01-R12 — Source Must Be Known

```yaml
type: Validation
severity: Blocking
override_allowed: false
```

Every reservation shall identify its source.

Allowed source categories may include:

- Website;
- Telephone;
- Walk-in;
- Google;
- TheFork;
- Staff;
- External Import;
- Other Approved Source.

The source category shall not replace the internal Reservation Identity.

---

## CAP-D01.01-R13 — External Identity Is Not Authoritative

```yaml
type: Invariant
severity: Critical
override_allowed: false
```

An external reservation identifier may be stored as a source reference.

It shall not become the authoritative internal Reservation Identity.

Multiple external systems shall not independently define the identity of the same internal reservation.

---

## CAP-D01.01-R14 — Duplicate Creation Must Be Detectable

```yaml
type: Decision
severity: Warning
override_allowed: true
```

Before creation, the capability should evaluate whether a potentially duplicate reservation already exists.

Duplicate detection may consider:

- contact information;
- reservation date;
- reservation time;
- party size;
- source identity;
- external reference.

A duplicate warning shall not automatically prevent creation unless a later approved policy makes it blocking.

---

# 8. Modification Rules

## CAP-D01.01-R15 — Existing Reservation Required

```yaml
type: Validation
severity: Blocking
override_allowed: false
```

A reservation modification request shall reference an existing Reservation Identity.

Unknown identities shall be rejected.

---

## CAP-D01.01-R16 — Terminal Reservations Are Not Normally Modifiable

```yaml
type: Transition
severity: Blocking
override_allowed: true
```

A Cancelled or Completed reservation shall not be modified as part of normal operation.

An authorized correction may amend non-authoritative descriptive information when required for historical accuracy.

Such correction shall:

- preserve the terminal state;
- record the actor;
- record the reason;
- generate a correction event;
- preserve the previous value.

---

## CAP-D01.01-R17 — Immutable Fields Cannot Be Modified

```yaml
type: Invariant
severity: Critical
override_allowed: false
```

The following fields shall not be modified:

- internal Reservation Identity;
- original creation timestamp;
- original creation actor;
- original source record identity.

Corrections shall be represented separately rather than replacing original evidence.

---

## CAP-D01.01-R18 — Every Modification Is Attributable

```yaml
type: Invariant
severity: Critical
override_allowed: false
```

Every successful reservation modification shall record:

- Reservation Identity;
- actor;
- timestamp;
- changed fields;
- previous values;
- resulting values;
- reason, where required;
- source of change.

---

## CAP-D01.01-R19 — Modification Must Preserve Validity

```yaml
type: Validation
severity: Blocking
override_allowed: false
```

After modification, the reservation shall still satisfy all applicable invariants and validation rules.

A modification shall not leave the reservation in an invalid intermediate state.

---

## CAP-D01.01-R20 — Date or Time Change Requires Service-Period Revalidation

```yaml
type: Decision
severity: Blocking
override_allowed: false
```

When reservation date or time changes, the Service Period reference shall be revalidated.

The existing Service Period may be preserved only when it remains valid for the resulting reservation date and time.

---

## CAP-D01.01-R21 — Party-Size Change Requires Downstream Revalidation

```yaml
type: Decision
severity: Blocking
override_allowed: false
```

When party size changes, dependent operational decisions shall be revalidated where applicable.

This may include:

- availability;
- pacing;
- seating assignment;
- table capacity;
- communication content.

Reservation Management owns the party-size change.

It does not own the downstream decisions.

---

# 9. Confirmation Rules

## CAP-D01.01-R22 — Only Proposed Reservations May Be Confirmed

```yaml
type: Transition
severity: Blocking
override_allowed: false
```

A reservation may transition to Confirmed only from Proposed.

Cancelled or Completed reservations shall not be confirmed.

---

## CAP-D01.01-R23 — Confirmation Requires Valid Reservation Data

```yaml
type: Validation
severity: Blocking
override_allowed: false
```

A reservation shall not be confirmed unless all required reservation information is valid.

Confirmation shall not be used to bypass missing or invalid reservation data.

---

## CAP-D01.01-R24 — Confirmation Does Not Guarantee Seating

```yaml
type: Invariant
severity: Critical
override_allowed: false
```

Reservation confirmation means the restaurant accepts the reservation as operationally valid.

It does not by itself mean that:

- a specific table has been assigned;
- a specific seat has been assigned;
- a preferred area is guaranteed;
- an external system is synchronized;
- a message has been delivered.

Those outcomes belong to other capabilities.

---

# 10. Cancellation Rules

## CAP-D01.01-R25 — Proposed or Confirmed Reservations May Be Cancelled

```yaml
type: Transition
severity: Blocking
override_allowed: false
```

A reservation may transition to Cancelled from:

- Proposed;
- Confirmed.

Completed reservations shall not be cancelled.

---

## CAP-D01.01-R26 — Cancellation Reason Policy

```yaml
type: Validation
severity: Warning
override_allowed: true
```

A cancellation reason should be recorded.

A reason shall become mandatory when cancellation is performed by staff after an operational threshold defined by policy.

The threshold remains an open policy decision.

---

## CAP-D01.01-R27 — Cancellation Releases Operational Expectation

```yaml
type: Invariant
severity: Critical
override_allowed: false
```

A Cancelled reservation shall no longer be treated as an expected active visit.

Dependent capabilities shall be informed through the reservation event model.

Reservation Management does not directly remove seating assignments or capacity allocations owned elsewhere.

---

## CAP-D01.01-R28 — Cancellation Must Preserve Historical Identity

```yaml
type: Invariant
severity: Critical
override_allowed: false
```

Cancelling a reservation shall not delete the Reservation Identity or historical record.

Cancellation is a lifecycle transition, not deletion.

---

# 11. Completion Rules

## CAP-D01.01-R29 — Only Confirmed Reservations May Be Completed

```yaml
type: Transition
severity: Blocking
override_allowed: false
```

A reservation may transition to Completed only from Confirmed.

---

## CAP-D01.01-R30 — Completion Requires Operational Evidence

```yaml
type: Validation
severity: Blocking
override_allowed: true
```

Completion requires evidence that the reservation visit has concluded.

Evidence may originate from:

- Live Service Management;
- Guest Arrival Management;
- Table Release and Turn;
- an authorized staff decision.

Manual completion shall record the actor and reason.

---

## CAP-D01.01-R31 — Completed State Is Terminal

```yaml
type: Invariant
severity: Critical
override_allowed: false
```

A Completed reservation shall not return to Proposed or Confirmed.

Historical corrections shall not reopen the reservation lifecycle.

---

# 12. Authorization Rules

## CAP-D01.01-R32 — Reservation Creation Requires Authorized Actor or Trusted Source

```yaml
type: Authorization
severity: Blocking
override_allowed: false
```

A reservation may be created by:

- an authenticated authorized user;
- an approved guest-facing reservation channel;
- an approved integration capability;
- an approved automated process.

The origin shall be attributable.

---

## CAP-D01.01-R33 — Reservation Modification Requires Authority

```yaml
type: Authorization
severity: Blocking
override_allowed: false
```

Reservation modification shall be restricted to authorized users, trusted guest actions, or approved integration capabilities.

Authorization may depend on:

- actor role;
- source;
- reservation status;
- timing;
- field being modified.

---

## CAP-D01.01-R34 — Cancellation Requires Authority

```yaml
type: Authorization
severity: Blocking
override_allowed: false
```

Cancellation shall be performed only by:

- an authorized staff member;
- an authenticated guest action;
- an approved external source;
- an approved automated policy.

The cancellation origin shall be recorded.

---

## CAP-D01.01-R35 — Completion Requires Operational Authority

```yaml
type: Authorization
severity: Blocking
override_allowed: false
```

Reservation completion shall require an authorized operational actor or an approved operational capability.

External reservation channels shall not independently complete the internal reservation lifecycle.

---

# 13. Notes Rules

## CAP-D01.01-R36 — Notes Shall Not Replace Structured Information

```yaml
type: Invariant
severity: Warning
override_allowed: true
```

Reservation Notes may provide operational context.

They shall not replace structured authoritative fields such as:

- date;
- time;
- party size;
- contact;
- allergy information;
- reservation status;
- service period;
- reservation source.

---

## CAP-D01.01-R37 — Critical Information Must Be Owned by the Correct Capability

```yaml
type: Invariant
severity: Critical
override_allowed: false
```

Critical allergy information shall be owned by Allergy and Critical Notes Management.

Reservation Management may reference or display such information but shall not redefine its authoritative meaning.

---

## CAP-D01.01-R38 — Notes Require Change Attribution

```yaml
type: Invariant
severity: Blocking
override_allowed: false
```

Creation, modification, or removal of operational notes shall be attributable where the note can affect service decisions.

---

# 14. Override Rules

## CAP-D01.01-R39 — Override Must Be Explicit

```yaml
type: Override
severity: Critical
override_allowed: false
```

A blocking rule may be bypassed only where the relevant rule explicitly permits override.

The system shall not provide a generic unrestricted override.

---

## CAP-D01.01-R40 — Override Requires Authorized Role

```yaml
type: Authorization
severity: Critical
override_allowed: false
```

An override may be performed only by a role explicitly authorized for that rule.

Initial authorized roles:

- Owner;
- Manager.

Additional roles require explicit policy.

---

## CAP-D01.01-R41 — Override Requires Reason

```yaml
type: Override
severity: Critical
override_allowed: false
```

Every override shall record:

- rule identifier;
- Reservation Identity;
- actor;
- timestamp;
- reason;
- previous state or value;
- resulting state or value;
- affected capability interactions.

---

## CAP-D01.01-R42 — Override Generates an Event

```yaml
type: Invariant
severity: Critical
override_allowed: false
```

Every successful override shall generate an explicit override or correction event.

An override shall not appear as an ordinary state transition.

---

# 15. Failure and Exception Rules

## CAP-D01.01-R43 — Failed Commands Do Not Change State

```yaml
type: Invariant
severity: Critical
override_allowed: false
```

When a command fails:

- the previous reservation state remains authoritative;
- no partial reservation update is preserved;
- no success event is generated;
- the failure result is explicit.

---

## CAP-D01.01-R44 — Duplicate Command Processing Must Be Safe

```yaml
type: Invariant
severity: Critical
override_allowed: false
```

Repeated processing of the same command shall not unintentionally create duplicate reservations or duplicate lifecycle transitions.

Implementation shall support idempotent handling where commands may be retried.

---

## CAP-D01.01-R45 — External Failure Shall Not Corrupt Internal State

```yaml
type: Invariant
severity: Critical
override_allowed: false
```

Failure of an external channel, communication provider, or integration shall not corrupt the authoritative internal reservation record.

Internal success and external synchronization success shall be treated as separate outcomes.

---

## CAP-D01.01-R46 — Unknown External State Must Be Explicit

```yaml
type: Exception
severity: Warning
override_allowed: false
```

When the external synchronization state is unknown, the internal reservation shall remain authoritative.

The uncertainty shall be surfaced to the responsible integration capability.

---

# 16. Decision Rules

## CAP-D01.01-R47 — Reservation Acceptance Is Separate from Availability

```yaml
type: Decision
severity: Critical
override_allowed: false
```

Reservation Management shall not independently determine operational availability.

Availability Management owns the decision about whether requested demand can be accepted within configured operational constraints.

Reservation Management may create a Proposed reservation before an availability decision when supported by policy.

---

## CAP-D01.01-R48 — Preferred Area Is a Preference

```yaml
type: Invariant
severity: Warning
override_allowed: false
```

A preferred area, such as Teppan or Sushi, shall be treated as a guest preference unless another capability explicitly guarantees it.

Reservation Management shall not represent preference as confirmed seating assignment.

---

## CAP-D01.01-R49 — Reservation Duration Is Planning Information

```yaml
type: Invariant
severity: Warning
override_allowed: true
```

Expected reservation duration is planning information.

It shall not be treated as proof that service ended at the expected time.

Actual service completion belongs to operational capabilities.

---

# 17. Rule-to-State Traceability

| Rule | State or Transition Affected |
|---|---|
| R01–R07 | All reservation states |
| R08–R14 | Creation → Proposed |
| R15–R21 | Proposed or Confirmed modification |
| R22–R24 | Proposed → Confirmed |
| R25–R28 | Proposed or Confirmed → Cancelled |
| R29–R31 | Confirmed → Completed |
| R32–R35 | All commands |
| R39–R42 | Authorized overrides |
| R43–R46 | Failure handling |
| R47–R49 | Operational interpretation |

---

# 18. Rule-to-Event Traceability

| Rule Outcome | Required Event |
|---|---|
| Reservation successfully created | ReservationCreated |
| Reservation successfully modified | ReservationModified |
| Reservation successfully confirmed | ReservationConfirmed |
| Reservation successfully cancelled | ReservationCancelled |
| Reservation successfully completed | ReservationCompleted |
| Historical correction performed | ReservationCorrected |
| Rule override approved | ReservationRuleOverridden |
| Command rejected by rule | ReservationCommandRejected, where operationally required |

Exact event definitions belong in `event-model.md`.

---

# 19. Rule Evaluation Result

Every rule evaluation should produce a structured result.

```yaml
rule_result:
  rule_id:
  outcome:
    - passed
    - warning
    - rejected
    - override_required
  severity:
  message:
  affected_field:
  override_allowed:
  evidence_required:
```

Implementation details may differ, but the business meaning shall remain equivalent.

---

# 20. Known Policy Decisions

The following rules require further operational validation:

```yaml
open_policy_decisions:
  - default reservation duration
  - maximum party size
  - past reservation creation window
  - duplicate reservation threshold
  - cancellation reason threshold
  - automatic confirmation policy
  - modification cutoff policy
  - historical correction authority
  - reservation expiration policy
  - no-show treatment
  - guest self-service modification policy
```

These unknowns shall not be silently invented during implementation.

---

# 21. Conformance

Reservation Management conforms to this rule model when:

- all critical invariants are enforced;
- blocking rules prevent invalid state changes;
- override behavior is explicit and attributable;
- successful commands remain atomic;
- failed commands preserve previous state;
- reservation identity remains immutable;
- external identities do not replace internal identity;
- state transitions conform to `state-model.md`;
- generated events conform to `event-model.md`;
- tests reference stable rule identifiers.

---

# 22. References

- `capability.md`
- `state-model.md`
- `event-model.md`
- `interaction-model.md`
- `acceptance.md`
- `CA-001 — Capability Architecture Standard`
- `CAP-REG-001 — Capability Registry`