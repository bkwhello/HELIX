### O-001 – Reservation Entry Channels

Source

Direct account from Engineering Lead and organizational actor.

Observation Status

Recorded – Not Yet Evidentially Validated

---
#### Raw Observation

Customers and guests may enter the reservation environment of Konnichiwa through multiple channels.

At least five entry pathways have currently been reported:

1. Konnichiwa website reservation widget
2. TheFork
3. Google reservation integration
4. Telephone
5. Walk-in or direct reservation request on the restaurant floor

#### Classification Note

Immediate walk-ins and future reservation requests made on the restaurant floor enter the operational reservation environment through related but potentially distinct pathways.

Whether an immediate walk-in constitutes a Reservation Work Object or a separate operational Work Object has not yet been established.

#### Observed Reservation Paths
---

----
##### Path 1 – Konnichiwa Website

A customer visits the Konnichiwa website and makes a reservation through the embedded reservation widget.

Current observed path:

Customer
        ↓
Konnichiwa Website
        ↓
Reservation Widget
        ↓
Guestplan

##### Path 2 – TheFork

A customer visits TheFork and makes a reservation through TheFork's reservation system.

Konnichiwa may become aware of the reservation through:

- email notification,
- manual inspection of TheFork's back office.

Current observed path:

Customer
        ↓
TheFork
        ↓
TheFork Reservation System
        ↓
Email Notification and/or Back Office
        ↓
Konnichiwa

The relationship between TheFork reservations and Guestplan has not yet been established.

##### Path 3 – Google

A customer searches through Google and makes a reservation through Google's reservation functionality.

Guestplan has an integration with Google.

Current observed path:

Customer
        ↓
Google
        ↓
Guestplan Integration
        ↓
Guestplan

The exact technical and operational behavior of this integration has not yet been established.

##### Path 4 – Telephone

A customer contacts Konnichiwa by telephone and makes a reservation.

Current observed path:

Customer
        ↓
Telephone
        ↓
Konnichiwa Organizational Actor
        ↓
Unknown next operational step

The handling of the reservation after the telephone call has not yet been established.

##### Path 5A – Immediate Walk-In

A guest arrives at Konnichiwa without a prior reservation.

Current observed path:

Guest arrives without reservation
        ↓
Walk-in is accepted
        ↓
Walk-in is added directly to the floor reservation plan

Whether and how the walk-in is represented in Guestplan has not yet been established.

##### Path 5B – Future Reservation Request on the Restaurant Floor

A guest requests a reservation for a future date directly on the restaurant floor.

Current observed path:

Guest requests future reservation
        ↓
Supervisor records reservation information
        ↓
Written information is photographed
        ↓
Photo is sent through WhatsApp to Manager
        ↓
Manager receives reservation information
        ↓
Manager enters reservation into Guestplan

Entry may occur immediately or later.

#### Unknowns

The following questions remain unresolved:

- Does every website reservation automatically enter Guestplan?
- Does every Google reservation automatically enter Guestplan?
- Do TheFork reservations enter Guestplan automatically, manually, or not at all?
- Who is responsible for checking TheFork email notifications or back office?
- How are telephone reservations recorded?
- Are all reservation channels represented in one authoritative reservation record?
- Can multiple channels reserve the same table capacity independently?
- How are modifications and cancellations propagated across channels?
- What happens if a reservation is received but not noticed by a staff member?
- How are immediate walk-ins represented in Guestplan, if at all?

#### Challenge Status

No contradiction established from O-001.

No actual failure evidence established from O-001.

No Organizational Claim established.

No Organizational Diagnosis established.