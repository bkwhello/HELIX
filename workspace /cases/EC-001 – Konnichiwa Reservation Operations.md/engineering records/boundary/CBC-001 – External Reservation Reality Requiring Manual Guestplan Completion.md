# CBC-001 – External Reservation Reality Requiring Manual Guestplan Completion

Status

Candidate Broader Condition

Case

EC-001 – Konnichiwa Reservation Coordination

Established Through

- BC-002 – Boundary Challenge: Cross-Channel Manual Guestplan Representation

Supported By

- O-009 – Direct Telephone Reservation Entry and Deferred Reservation Modification Transfer
- O-010 – TheFork Reservation Notification, Manual Guestplan Transfer, and Group Acceptance

Structurally Related To

- O-004 – Deferred Manual Reservation Entry
- O-005 – Actual Reservation Entry Failure
- CE-001 – Deferred Manual Entry Without Closed-Loop Confirmation
- OD-001 – Unclosed Completion Loop in Manual Future-Reservation Transfer

---

# Candidate Condition

Some guest reservation commitments and requested reservation changes originate outside Guestplan and require manual human action before Guestplan accurately represents the operational reservation reality.

Observed examples currently include:

- future reservation requests accepted directly on the restaurant floor,
- telephone reservation modifications received by the Supervisor,
- TheFork reservations manually copied into Guestplan.

The condition may create an unresolved interval between:

External guest commitment or requested change
        ↓
Guestplan does not yet accurately represent operational reality
        ↓
Manual human action is required
        ↓
Guestplan representation is completed

The existence of this interval does not itself establish organizational failure.

---

# Observed Pathways

## Pathway 1 – Future Floor Reservation

Guest makes future reservation request on restaurant floor
        ↓
Supervisor records reservation information
        ↓
Information is photographed
        ↓
Photo is sent through WhatsApp
        ↓
Manager is expected to enter reservation into Guestplan
        ↓
Guestplan representation completed

Actual failure has been reported for this pathway.

The reservation remained unresolved in the WhatsApp group and was not entered into Guestplan.

The failure was discovered when the guest arrived.

This pathway produced:

- CE-001 – Deferred Manual Entry Without Closed-Loop Confirmation
- OD-001 – Unclosed Completion Loop in Manual Future-Reservation Transfer
- DES-001 – Closed-Loop Future-Reservation Completion
- TM-001 – WhatsApp-Based Closed-Loop Reservation Protocol
- TP-001 – WhatsApp Closed-Loop Reservation Pilot Protocol

---

## Pathway 2 – Telephone Reservation Modification

Guest calls Konnichiwa
        ↓
Supervisor receives requested reservation change
        ↓
Supervisor writes down the requested change
        ↓
Written information is photographed
        ↓
Photo is sent through WhatsApp
        ↓
Manager receives the information
        ↓
Manager modifies the reservation in Guestplan
        ↓
Manager posts "done" in WhatsApp

A successful completion has been reported for this pathway.

No actual failure has yet been established.

---

## Pathway 3 – TheFork Reservation Transfer

Customer makes reservation through TheFork
        ↓
TheFork records reservation
        ↓
Manager receives notification on phone
        ↓
Manager opens TheFork
        ↓
Manager reviews reservation
        ↓
Manager manually copies reservation into Guestplan

For qualifying group reservations:

Customer submits reservation request
        ↓
Manual acceptance required
        ↓
Manager accepts or rejects reservation
        ↓
If accepted:
TheFork sends confirmation to customer
        ↓
Reservation is manually represented in Guestplan

No actual transfer failure has yet been established for this pathway.

---

# Structural Commonality

The observed pathways differ in:

- reservation channel,
- actors involved,
- transfer mechanism,
- work-object state,
- required Guestplan action,
- and customer-confirmation mechanism.

However, they share the following deeper structural condition:

External guest commitment or requested change exists
        ↓
Guestplan does not yet fully represent that reality
        ↓
Manual human completion is required
        ↓
A temporal interval may exist
        ↓
Guestplan becomes accurate only after successful human action

This structural commonality is the basis for CBC-001.

---

# Important Distinctions

CBC-001 does not establish that all observed pathways are identical.

The future floor-reservation pathway requires:

- creation of a new reservation record,
- transfer between Supervisor and Manager,
- and has actual failure evidence.

The telephone-modification pathway requires:

- modification of an existing reservation record,
- transfer between Supervisor and Manager,
- and currently has successful completion evidence but no established failure evidence.

The TheFork pathway requires:

- manual transfer between two systems,
- possible manual acceptance for qualifying group reservations,
- and currently has no established transfer-failure evidence.

Therefore:

Structural similarity
        ≠
Identical operational behavior

And:

Manual completion dependency
        ≠
Established failure

---

# Relationship to Guestplan

Current evidence supports the interpretation that Guestplan functions as a central operational reservation representation used for:

- viewing reservations,
- creating reservations,
- modifying reservations,
- checking upcoming reservations,
- preparing the physical Floor Reservation Plan,
- and supporting restaurant service preparation.

Current evidence does not yet establish that Guestplan is the sole authoritative reservation record across every channel and reservation state.

Other representations currently include:

- TheFork,
- WhatsApp,
- handwritten reservation information,
- and the physical Floor Reservation Plan.

The relationship between these representations remains relevant to CBC-001.

---

# Engineering Significance

CBC-001 becomes potentially significant where manual completion dependency combines with one or more of the following:

- unresolved state is not visible,
- completion accountability is ambiguous,
- required action is forgotten,
- completion is not verified,
- information becomes buried,
- Guestplan remains inaccurate beyond a safe operational point,
- multiple systems contain conflicting information,
- or operational consequences occur.

Deferred action alone is not classified as failure.

A reservation or modification may be received, preserved, assigned, completed later, verified, and safely closed.

The engineering concern is not delay by itself.

The engineering concern is whether the organization can reliably preserve:

- the external commitment,
- unresolved-state visibility,
- completion accountability,
- accurate Guestplan representation,
- verification,
- and completion before the latest safe operational point.

---

# Current Evidence State

## Supporting Observations

- O-009 – Telephone reservation modification pathway
- O-010 – TheFork manual Guestplan transfer pathway

## Structurally Related Observations

- O-001 – Reservation Entry Channels
- O-004 – Deferred Manual Reservation Entry
- O-005 – Actual Reservation Entry Failure

## Related Failure Evidence

- CE-001 – Deferred Manual Entry Without Closed-Loop Confirmation

## Related Diagnosis

- OD-001 – Unclosed Completion Loop in Manual Future-Reservation Transfer

## Current Cross-Channel Failure State

Future floor reservation pathway:

Actual failure established.

Telephone modification pathway:

No failure established.

TheFork transfer pathway:

No failure established.

Therefore, no cross-channel failure generalization is currently justified.

---

# Falsification Boundaries

CBC-001 shall not be interpreted as establishing any of the following:

- all reservations require manual Guestplan entry;
- all manual reservation pathways are unreliable;
- all deferred Guestplan actions create failure;
- WhatsApp is the root organizational problem;
- every reservation pathway requires actor-to-actor handoff;
- Guestplan is the sole authoritative system for every reservation state;
- CE-001 applies automatically to telephone modifications;
- CE-001 applies automatically to TheFork reservations;
- TP-001 should automatically be expanded to other reservation pathways.

These conclusions have not been earned by current evidence.

---

# Boundary Reopening Conditions

CBC-001 shall trigger renewed engineering attention if further evidence establishes one or more of the following:

- a TheFork reservation is forgotten or not copied into Guestplan;
- a TheFork reservation is copied incorrectly;
- a TheFork modification or cancellation is not propagated;
- duplicate or conflicting reservation records occur;
- a telephone modification remains unresolved;
- a telephone modification is forgotten;
- stale Guestplan information creates an operational consequence;
- accountability becomes ambiguous in another reservation pathway;
- a guest arrives before an accepted reservation reality is accurately represented in Guestplan;
- the same structural failure occurs across more than one reservation channel;
- manual transfer frequency creates material operational burden;
- or evidence supports a stable broader engineering question.

---

# Current Classification

Classification

Candidate Broader Condition

Not Yet Established As

- Organizational Claim
- Organizational Understanding
- Organizational Diagnosis
- Organizational Design
- Organizational Transformation
- Separate Engineering Case
- Reference Model

Reason

Multiple observations support the existence of a broader structural pattern involving external reservation reality and manual Guestplan completion.

However, current evidence does not yet establish:

- common failure behavior across the pathways,
- common consequences,
- sufficient recurrence,
- sufficient cross-channel evidence,
- or justification for a broader diagnosis or separate Engineering Case.

---

# Current Boundary Decision

EC-001 remains bounded.

TP-001 remains unchanged.

O-009 and O-010 remain outside the active TP-001 pilot scope.

CBC-001 is preserved for active boundary monitoring.

No broader Organizational Claim is established.

No broader Organizational Diagnosis is established.

No separate Engineering Case is established.

---

# Potential Future Engineering Question

If CBC-001 earns sufficient evidence, a future Engineering Case may investigate:

> How does Konnichiwa preserve accurate and timely Guestplan representation when guest commitments or reservation changes originating outside Guestplan require manual human completion?

An alternative formulation is:

> How should Konnichiwa preserve completion accountability, unresolved-state visibility, and accurate operational representation across manual reservation-transfer pathways?

Neither question is currently established as a new Engineering Case.

---

# Traceability

O-001
    └── Introduced multiple reservation entry channels and unresolved handling questions

O-004
    └── Established deferred manual reservation entry pathway

O-005
    └── Established actual occurrence of reservation-entry failure

CE-001
    └── Preserved failure evidence concerning deferred manual entry without closed-loop confirmation

OD-001
    └── Diagnosed unclosed completion loop in bounded future-reservation transfer

O-009
    ├── Exposed deferred telephone reservation-modification transfer
    └── Contributes to CBC-001

O-010
    ├── Exposed manual TheFork-to-Guestplan transfer
    └── Contributes to CBC-001

BC-001
    └── Challenged EC-001 boundary using O-009

BC-002
    ├── Compared multiple manual Guestplan completion pathways
    ├── Rejected automatic expansion of EC-001
    ├── Rejected automatic expansion of TP-001
    └── Established CBC-001 as a Candidate Broader Condition

CBC-001
    ├── Preserves emerging cross-channel structural commonality
    ├── Does not generalize CE-001
    ├── Does not expand TP-001
    ├── Does not establish a broader diagnosis
    └── Remains under active boundary monitoring

---

# CBC-001 Conclusion

CBC-001 preserves an emerging broader organizational condition discovered during EC-001.

Current observations establish that some guest reservation commitments and requested reservation changes originate outside Guestplan and require manual human action before Guestplan accurately represents operational reservation reality.

This pattern has been observed in:

- future floor reservations,
- telephone reservation modifications,
- TheFork reservation transfers.

The pathways are structurally related but operationally distinct.

Actual failure evidence exists only for the bounded future floor-reservation pathway.

No cross-channel failure generalization is currently justified.

CBC-001 therefore remains a Candidate Broader Condition.

EC-001 remains bounded.

TP-001 remains unchanged.

Further real-world evidence shall determine whether CBC-001:

- remains merely an adjacent observed condition,
- earns promotion into an Organizational Claim,
- justifies a broader Engineering Case,
- contributes to a future Reference Model,
- or is weakened or falsified by subsequent evidence.