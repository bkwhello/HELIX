### O-010 – TheFork Reservation Notification, Manual Guestplan Transfer, and Group Acceptance

Source

Direct account from Engineering Lead and organizational actor.

Observation Status

Recorded – Not Yet Evidentially Validated

Context

Observed reservation pathway adjacent to the current TP-001 bounded transformation pilot.

---

#### Raw Observation

When a customer makes a reservation through TheFork, the Manager receives a notification on a phone.

The Manager then opens TheFork and reviews the reservation.

The reservation information is manually copied from TheFork into Guestplan.

For group reservations of 6 persons or more, manual acceptance is required in TheFork.

After acceptance, TheFork sends confirmation to the customer.

---

#### Observed Standard TheFork Reservation Path

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
        ↓
Guestplan contains operational reservation record

---

#### Observed Group Reservation Path

For a TheFork reservation of 6 persons or more:

Customer requests group reservation through TheFork
        ↓
Reservation requires manual acceptance
        ↓
Manager reviews reservation in TheFork
        ↓
Manager accepts or rejects reservation
        ↓
If accepted:
TheFork sends confirmation to customer
        ↓
Reservation is manually copied into Guestplan

---

#### Observed Actors

##### Manager

Observed responsibilities include:

- receiving TheFork reservation notifications,
- opening TheFork,
- reviewing reservation information,
- manually copying reservations into Guestplan,
- manually accepting qualifying group reservations.

Whether the Owner or Assistant Manager also performs these responsibilities has not yet been established.

---

#### Observed Systems

##### TheFork

Observed responsibilities:

- receives customer reservation requests,
- preserves reservation information,
- sends reservation notification to the Manager's phone,
- requires manual acceptance for qualifying group reservations,
- sends customer confirmation after acceptance.

##### Guestplan

Observed responsibility:

- receives a manually created copy of the TheFork reservation for Konnichiwa's operational reservation environment.

No automatic TheFork-to-Guestplan integration has been established.

---

#### Manual Transfer Condition

The reported pathway contains a manual cross-system transfer:

TheFork reservation exists
        ↓
Manager becomes aware through phone notification
        ↓
Manager opens TheFork
        ↓
Manager manually copies reservation information
        ↓
Guestplan representation is created

During the interval between TheFork reservation receipt and successful Guestplan entry, the reservation may exist in TheFork without yet being represented in Guestplan.

The duration and operational significance of this interval have not yet been established.

---

#### Group Reservation Acceptance Condition

For qualifying group reservations of 6 persons or more, the reservation requires manual acceptance.

This introduces an additional state distinction:

Reservation requested
        ↓
Awaiting manual decision
        ↓
Accepted OR Rejected

Where accepted:

Accepted in TheFork
        ↓
Customer confirmation sent by TheFork
        ↓
Guestplan representation required

The exact ordering between manual acceptance and Guestplan entry has not yet been fully established beyond the reported operational account.

---

#### Relationship to O-001

O-001 initially recorded the following unresolved questions:

- Do TheFork reservations enter Guestplan automatically, manually, or not at all?
- Who is responsible for checking TheFork email notifications or back office?
- Are all reservation channels represented in one authoritative reservation record?
- Can multiple channels reserve the same table capacity independently?
- What happens if a reservation is received but not noticed by a staff member?

O-010 now provides reported evidence that:

- TheFork reservations are manually copied into Guestplan.
- The Manager receives a phone notification.
- The Manager opens TheFork to review the reservation.
- Qualifying group reservations require manual acceptance.
- TheFork sends confirmation to the customer after acceptance.

O-010 therefore partially resolves unknowns introduced by O-001.

---

#### Structural Relationship to CE-001 and OD-001

The TheFork pathway contains structural similarities to the manual future floor-reservation pathway:

External reservation or request exists
        ↓
Organizational actor receives notification
        ↓
Manual action is required
        ↓
Guestplan representation depends on human completion

However, material differences exist.

In the original CE-001 pathway:

- information was handwritten,
- photographed,
- sent through WhatsApp,
- entry could be deferred,
- no closed-loop confirmation normally occurred,
- and an actual forgotten reservation was reported.

In the TheFork pathway:

- the original reservation remains represented in TheFork,
- the Manager receives a phone notification,
- the Manager can reopen TheFork,
- the information is manually copied into Guestplan,
- and no actual forgotten or lost TheFork reservation has yet been reported in O-010.

Therefore, O-010 does not automatically extend CE-001 or OD-001 to TheFork reservations.

---

#### Potential Dual-Record Condition

The reported pathway creates two reservation representations:

1. TheFork reservation record.
2. Guestplan reservation record.

This introduces a potential synchronization question:

TheFork
        ↓
Manual copy
        ↓
Guestplan

The current observation does not establish:

- whether both records always contain identical information,
- how later modifications propagate,
- how cancellations propagate,
- whether Guestplan is always updated after a TheFork change,
- whether duplicate entry can occur,
- whether a TheFork reservation can remain absent from Guestplan,
- or which record is authoritative when the two disagree.

No synchronization failure is established from O-010.

---

#### Unknowns Introduced by O-010

The following remain unresolved:

- Is every standard TheFork reservation immediately confirmed to the customer?
- Is the threshold exactly 6 persons or more, or more than 6 persons?
- Are there other conditions requiring manual acceptance?
- How quickly does the Manager normally copy a TheFork reservation into Guestplan?
- Can another authorized actor perform this task?
- What happens when the Manager is unavailable?
- Has a TheFork reservation ever been forgotten and not copied into Guestplan?
- Can a reservation remain in TheFork but absent from Guestplan?
- How are TheFork modifications transferred into Guestplan?
- How are TheFork cancellations transferred into Guestplan?
- What happens if a guest changes the reservation after initial Guestplan entry?
- Is completion of Guestplan entry explicitly verified?
- Is there any closed-loop confirmation that the Guestplan copy has been completed?
- Can duplicate reservations be created?
- Which system is treated as authoritative when TheFork and Guestplan differ?
- How are group reservations handled if capacity is unavailable?
- Is the customer confirmation sent immediately after manual acceptance?
- Are declined group reservations explicitly communicated to the customer by TheFork?

---

#### Challenge Status

No failure evidence established from O-010.

No contradiction established.

No Organizational Claim established from O-010 alone.

No Organizational Diagnosis established from O-010 alone.

O-010 exposes a manual cross-system reservation-transfer pathway with structural similarities to the organizational condition investigated in EC-001.

The observation shall be preserved as adjacent boundary evidence.

Further evidence may justify reopening the EC-001 boundary if:

- a TheFork reservation is forgotten,
- a reservation remains absent from Guestplan,
- modification or cancellation information fails to propagate,
- duplicate or conflicting records occur,
- responsibility for manual transfer becomes ambiguous,
- or another operational consequence is established.

---

#### Traceability

O-001
    ├── introduced TheFork handling as unresolved
    └── introduced uncertainty regarding authoritative reservation representation

O-010
    ├── partially resolves the TheFork unknown introduced by O-001
    ├── establishes reported manual transfer from TheFork to Guestplan
    ├── establishes Manager involvement
    ├── establishes manual acceptance for qualifying group reservations
    ├── exposes a dual-record condition
    └── introduces synchronization unknowns

O-010
    └── adjacent to BC-001 boundary reasoning but not yet included in TP-001 pilot scope

---

#### O-010 Conclusion

O-010 establishes that, according to the direct account of the Engineering Lead and organizational actor, TheFork reservations are not automatically integrated into Guestplan.

The Manager receives a phone notification, opens TheFork, reviews the reservation, and manually copies the reservation into Guestplan.

Qualifying group reservations of 6 persons or more require manual acceptance, after which TheFork sends confirmation to the customer.

This exposes a manual cross-system transfer dependency between TheFork and Guestplan.

No actual failure, synchronization error, forgotten reservation, or operational consequence has yet been established from this pathway.

O-010 therefore remains adjacent boundary evidence within EC-001 and does not automatically expand CE-001, OD-001, DES-001, or TP-001.
