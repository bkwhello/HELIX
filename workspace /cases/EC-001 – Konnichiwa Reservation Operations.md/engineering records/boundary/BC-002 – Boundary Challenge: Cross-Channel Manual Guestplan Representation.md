### BC-002 – Boundary Challenge: Cross-Channel Manual Guestplan Representation

Status

Completed

Challenge Type

Engineering Case Boundary Challenge

Triggered By

- O-009 – Direct Telephone Reservation Entry and Deferred Reservation Modification Transfer
- O-010 – TheFork Reservation Notification, Manual Guestplan Transfer, and Group Acceptance

Builds Upon

- BC-001 – Boundary Challenge: Telephone Reservation Modification Pathway

Challenges

- EC-001 – Existing Engineering Case Boundary
- CE-001 – Deferred Manual Entry Without Closed-Loop Confirmation
- OD-001 – Unclosed Completion Loop in Manual Future-Reservation Transfer
- DES-001 – Closed-Loop Future-Reservation Completion
- TM-001 – WhatsApp-Based Closed-Loop Reservation Protocol
- TP-001 – WhatsApp Closed-Loop Reservation Pilot Protocol

---

#### Challenge Question

Do O-009 and O-010 together establish that EC-001 has discovered a broader organizational condition beyond future reservation requests accepted directly on the restaurant floor?

Specifically:

Does Konnichiwa operate multiple reservation pathways in which an accepted guest commitment or requested reservation change originates outside Guestplan and depends upon manual human action before Guestplan accurately represents the operational reality?

If so:

- should EC-001 be expanded,
- should a broader Organizational Claim be established,
- should a separate Engineering Case be opened,
- or should the condition remain preserved as a candidate broader condition pending further evidence?

---

#### Existing EC-001 Condition

EC-001 originally investigated the following bounded pathway:

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
Entry may be deferred
        ↓
No closed-loop confirmation
        ↓
Reservation may remain absent from Guestplan
        ↓
Failure may be discovered when guest arrives

This pathway produced actual reported failure evidence and resulted in:

- CE-001 – Deferred Manual Entry Without Closed-Loop Confirmation
- OD-001 – Unclosed Completion Loop in Manual Future-Reservation Transfer
- DES-001 – Closed-Loop Future-Reservation Completion
- TM-001 – WhatsApp-Based Closed-Loop Reservation Protocol
- TP-001 – WhatsApp Closed-Loop Reservation Pilot Protocol

The current pilot remains bounded to this pathway.

---

#### Additional Pathway 1 – Telephone Reservation Modification

O-009 reports:

Guest calls Konnichiwa
        ↓
Supervisor receives requested reservation change
        ↓
Supervisor writes down the change
        ↓
Written information is photographed
        ↓
Photo is sent through WhatsApp
        ↓
Manager receives the information
        ↓
Manager changes the reservation in Guestplan
        ↓
Manager posts "done" in WhatsApp

The original reservation already exists in Guestplan.

The required action is modification rather than creation.

No failure has been established from the reported event.

---

#### Additional Pathway 2 – TheFork Reservation Transfer

O-010 reports:

Customer books through TheFork
        ↓
TheFork contains reservation information
        ↓
Manager receives phone notification
        ↓
Manager opens TheFork
        ↓
Manager reviews reservation
        ↓
Manager manually copies reservation into Guestplan

For qualifying group reservations:

Customer submits reservation request
        ↓
Manual acceptance required in TheFork
        ↓
Manager accepts or rejects
        ↓
If accepted:
TheFork sends confirmation to customer
        ↓
Guestplan representation is manually created

No actual transfer failure has yet been established from this pathway.

---

#### Cross-Pathway Comparison

The three pathways can be compared as follows:

| Characteristic | Future Floor Reservation | Telephone Modification | TheFork Reservation |
| --- | --- | --- | --- |
| Guest commitment or requested change exists outside Guestplan | Yes | Yes | Yes |
| Manual human action required | Yes | Yes | Yes |
| Actor handoff required | Yes | Yes | Not necessarily |
| WhatsApp involved | Yes | Yes | No |
| Guestplan action required | Create | Modify | Create |
| Temporal gap possible | Yes | Yes | Yes |
| External information source remains available | WhatsApp / photo | WhatsApp / photo | TheFork |
| Completion confirmation observed | Historically absent; pilot adds it | "Done" observed | Not established |
| Actual failure established | Yes | No | No |
| Current TP-001 scope | Yes | No | No |

---

#### Structural Commonality Attack

The pathways use different channels, actors, and work-object states.

However, they share a deeper structural sequence:

Guest commitment or requested change exists
        ↓
Guestplan does not yet fully represent that commitment or change
        ↓
Human action is required
        ↓
A temporal interval may exist
        ↓
Guestplan becomes authoritative only after successful human completion

This suggests the following candidate abstraction:

External guest commitment or reservation change
        ↓
Incomplete Guestplan representation
        ↓
Manual completion dependency
        ↓
Potential unresolved state
        ↓
Guestplan representation completed

Attack Result

Structural commonality established.

---

#### Channel-Specificity Attack

Could the condition simply be described as a WhatsApp problem?

No.

TheFork introduces a manual transfer pathway without WhatsApp.

Therefore:

WhatsApp
        ≠
Underlying organizational condition

WhatsApp is one physical transfer mechanism within certain pathways.

The broader condition, if established, concerns the dependency between:

- accepted external reservation reality,
- required human completion,
- and authoritative Guestplan representation.

Attack Result

A purely WhatsApp-specific explanation is falsified as an explanation of the broader cross-channel pattern.

This does not invalidate the WhatsApp-specific TM-001 pilot for its bounded purpose.

---

#### Actor-Handoff Attack

Could the broader condition be defined only as a failure of actor-to-actor handoff?

No.

The future floor-reservation and telephone-modification pathways involve:

Supervisor
        ↓
Manager

The TheFork pathway may involve:

TheFork
        ↓
Manager
        ↓
Guestplan

No human-to-human accountability transfer is necessarily required.

Therefore, actor handoff is not irreducible across all three pathways.

The deeper common dependency is:

Guestplan requires a human action before it accurately represents external reservation reality.

Attack Result

Human-to-human transfer is pathway-specific, not universally defining.

---

#### Manual-Dependency Attack

Does every external reservation pathway depend on manual Guestplan completion?

No.

Existing observations indicate:

Website reservation widget
        ↓
Guestplan

Google reservation functionality
        ↓
Guestplan integration
        ↓
Guestplan

These pathways appear to involve integration rather than manual copying, although exact technical behavior has not been fully established.

Therefore, the broader condition cannot be stated as:

"All Konnichiwa reservations require manual Guestplan entry."

That would exceed the evidence.

A narrower candidate condition is justified:

> Some reservation commitments and requested changes originating outside Guestplan depend upon manual human completion before Guestplan accurately represents the operational reservation reality.

Attack Result

Narrower candidate condition survives.

---

#### Authoritative-System Attack

Does current evidence establish Guestplan as the single authoritative reservation record?

Not fully.

Operational evidence shows that Guestplan is used for:

- reservation viewing,
- reservation creation,
- reservation modification,
- daily reservation checking,
- and preparation of the physical Floor Reservation Plan.

However:

- TheFork retains its own reservation record,
- WhatsApp may temporarily preserve reservation information,
- handwritten information may temporarily exist,
- and the physical Floor Reservation Plan has its own operational role.

Therefore, the following stronger claim is not yet justified:

> Guestplan is the sole authoritative reservation record for every reservation state and channel.

A narrower interpretation is supported:

> Guestplan functions as a central operational reservation representation used in daily reservation management and floor planning.

Attack Result

Central operational role supported.

Sole authoritative status not yet established.

---

#### Temporal-Gap Attack

Is the temporal interval itself necessarily a problem?

No.

A reservation may be:

- received,
- preserved,
- assigned,
- entered later,
- verified,
- and completed safely.

PE-001 already demonstrates successful deferred completion.

Therefore:

Deferred action
        ≠
Failure

The engineering concern arises where deferred action combines with one or more of the following:

- unresolved state is not visible,
- accountability is ambiguous,
- completion is not verified,
- attention does not occur before the latest safe point,
- or operational reality depends on an outdated Guestplan state.

Attack Result

Temporal delay alone is not diagnosed as failure.

---

#### Failure-Generalization Attack

Can CE-001 now be generalized across all manual reservation pathways?

No.

Current evidence establishes:

Future floor reservation pathway
        ↓
Actual reported failure exists

Telephone modification pathway
        ↓
Reported successful completion
        ↓
No failure established

TheFork pathway
        ↓
Manual transfer observed
        ↓
No failure established

Therefore, it would be invalid to claim that all manual pathways suffer the failure represented by CE-001.

Attack Result

Automatic generalization rejected.

---

#### Broader Candidate Condition

The following broader condition now survives falsification as a candidate:

##### CBC-001 – External Reservation Reality Requiring Manual Guestplan Completion

Some guest reservation commitments and requested reservation changes originate outside Guestplan and require manual human action before Guestplan accurately represents the operational reservation reality.

Observed examples include:

- future floor reservations requiring Supervisor-to-Manager transfer,
- telephone reservation modifications requiring Supervisor-to-Manager transfer,
- TheFork reservations requiring manual copying into Guestplan.

The condition may create an unresolved interval between:

External guest commitment or requested change

and

Accurate Guestplan representation.

The existence of this interval does not itself establish organizational failure.

Engineering significance depends upon:

- preservation of the external commitment,
- visibility of unresolved state,
- completion accountability,
- completion verification,
- temporal requirements,
- operational consequences,
- and recovery mechanisms.

Status

Candidate Broader Condition – Not Yet an Organizational Claim

---

#### Attack on Immediate EC-001 Expansion

Option A

Expand EC-001 immediately to cover:

- future floor reservations,
- telephone reservations,
- telephone modifications,
- TheFork reservations,
- cancellations,
- all other manual Guestplan transfer pathways.

Challenge

This would materially alter the bounded case after:

- observation,
- evidence establishment,
- Organizational Claims,
- Organizational Understanding,
- Organizational Diagnosis,
- design,
- comparative evaluation,
- transformation-mechanism selection,
- and pilot activation.

It would mix:

- reservation creation,
- reservation modification,
- external-platform synchronization,
- actor handoff,
- customer confirmation,
- and potentially cancellation handling.

Verdict

Rejected at present.

---

#### Attack on Immediate TP-001 Expansion

Option B

Expand TP-001 to cover O-009 and O-010.

Challenge

TP-001 was designed specifically for future reservation requests accepted directly on the restaurant floor where Guestplan entry is deferred.

TheFork reservations have different properties:

- persistent external system record,
- platform notification,
- possible manual acceptance,
- platform-generated customer confirmation,
- cross-system synchronization.

Telephone modifications also have different properties:

- an existing Guestplan record already exists,
- the required action is modification,
- incorrect completion can leave stale rather than absent data.

Verdict

Rejected.

TP-001 remains unchanged.

---

#### Attack on Immediate New Engineering Case

Option C

Open EC-002 immediately around CBC-001.

Challenge

The broader pattern is now supported by multiple observations, but actual failure evidence currently remains concentrated in the original future floor-reservation pathway.

A new Engineering Case may eventually be justified, but immediate establishment risks opening a broad case before:

- frequency is understood,
- consequences are established,
- modification failures are observed,
- TheFork synchronization failures are observed,
- and the appropriate case boundary is known.

Verdict

Not yet required.

---

#### Attack on Candidate Preservation

Option D

Preserve CBC-001 as a Candidate Broader Condition and actively observe it while keeping EC-001 and TP-001 bounded.

Advantages:

- preserves the emerging cross-channel pattern,
- prevents premature generalization,
- protects current pilot interpretability,
- allows further evidence to accumulate,
- and provides explicit triggers for reopening the boundary.

Verdict

Survives.

---

#### Boundary Decision

Decision

Preserve CBC-001 as a Candidate Broader Condition within EC-001.

Do not currently:

- expand the core EC-001 diagnosis,
- expand DES-001,
- expand TM-001,
- expand TP-001,
- generalize CE-001 across all manual reservation pathways,
- or establish EC-002.

Continue the current TP-001 pilot unchanged.

Actively preserve observations concerning other manual Guestplan completion pathways.

---

#### Boundary Reopening Conditions

The boundary shall be reopened if further evidence establishes one or more of the following:

- a TheFork reservation is forgotten or not copied into Guestplan;
- a TheFork reservation is copied incorrectly;
- a TheFork modification or cancellation is not propagated;
- duplicate or conflicting reservation records occur;
- a telephone modification remains unresolved;
- a telephone modification is forgotten;
- stale Guestplan information creates an operational consequence;
- accountability becomes ambiguous in another pathway;
- a guest arrives before an accepted reservation reality is accurately represented in Guestplan;
- the same structural failure recurs across more than one reservation channel;
- manual transfer frequency creates material operational burden;
- or evidence supports a stable broader engineering question.

---

#### Potential Future Engineering Question

If CBC-001 earns sufficient evidence, a future Engineering Case may investigate:

> How does Konnichiwa preserve accurate and timely Guestplan representation when guest commitments or reservation changes originating outside Guestplan require manual human completion?

Alternative formulation:

> How should Konnichiwa preserve completion accountability, unresolved-state visibility, and authoritative operational representation across manual reservation-transfer pathways?

No future Engineering Case is established by BC-002 alone.

---

#### Relationship to Current Pilot

The TP-001 pilot continues to test:

Future floor reservation accepted directly in restaurant
        ↓
Structured WhatsApp submission
        ↓
Explicit accountability
        ↓
Guestplan completion
        ↓
Verification
        ↓
Closed completion loop

O-009 and O-010 remain outside pilot scope.

They shall not be counted as PE-002 or later TP-001 Pilot Evidence Records unless the pilot scope is formally changed.

---

#### Traceability

O-001
    ├── introduced reservation entry channels
    ├── introduced unresolved TheFork handling
    └── introduced unresolved telephone handling

O-009
    ├── resolves part of telephone-handling uncertainty
    ├── exposes deferred reservation-modification transfer
    └── contributes to CBC-001

O-010
    ├── resolves part of TheFork-handling uncertainty
    ├── establishes manual TheFork-to-Guestplan transfer
    ├── exposes cross-system representation dependency
    └── contributes to CBC-001

BC-001
    └── preserved telephone modification as adjacent boundary evidence

BC-002
    ├── compares multiple manual Guestplan completion pathways
    ├── falsifies a purely WhatsApp-specific broader explanation
    ├── rejects automatic CE-001 generalization
    ├── rejects immediate EC-001 expansion
    ├── rejects immediate TP-001 expansion
    ├── preserves current pilot interpretability
    └── establishes CBC-001

CBC-001
    ├── supported by O-009
    ├── supported by O-010
    ├── structurally related to CE-001
    ├── not yet an Organizational Claim
    ├── not yet an Organizational Diagnosis
    └── may trigger future Engineering Case establishment

---

#### BC-002 Conclusion

O-009 and O-010 materially strengthen evidence for a broader cross-channel organizational pattern.

The evidence establishes that multiple guest commitments or reservation changes may originate outside Guestplan and require manual human action before Guestplan accurately represents operational reservation reality.

However:

- the pathways differ in work-object state,
- the pathways differ in transfer mechanism,
- actual failure evidence remains concentrated in the original future floor-reservation pathway,
- and no evidence currently justifies applying CE-001, OD-001, DES-001, or TP-001 universally across all manual reservation pathways.

CBC-001 is therefore established as a Candidate Broader Condition.

EC-001 remains bounded.

TP-001 remains unchanged.

The current pilot continues.

The broader condition shall be actively observed and the boundary reopened if additional evidence establishes cross-channel failure, synchronization error, ambiguous accountability, material burden, or operational consequence.
