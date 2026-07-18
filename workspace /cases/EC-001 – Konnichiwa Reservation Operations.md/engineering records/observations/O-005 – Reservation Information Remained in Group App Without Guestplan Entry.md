### O-005 – Reservation Information Remained in Group App Without Guestplan Entry

Source

Direct account from Engineering Lead and organizational actor.

Observation Status

Recorded – Not Yet Evidentially Validated

----

#### Raw Observation

An actual occurrence has been reported in which reservation information was sent through the group app but was not subsequently entered into Guestplan.

The reservation information remained in the group app.

The missing Guestplan entry was discovered when the guest physically arrived at the restaurant expecting to have a reservation.


#### Observed Failure Path

Guest makes reservation request
        ↓
Reservation information is recorded
        ↓
Reservation information is sent through group app
        ↓
Information remains available in group app
        ↓
Expected Guestplan entry does not occur
        ↓
Reservation remains absent from Guestplan
        ↓
Guest arrives at restaurant expecting reservation
        ↓
Missing reservation is discovered


#### Current Evidence State

The Engineering Lead has directly reported that this failure has occurred.

The original group-app message has not yet been inspected as documentary evidence within EC-001.

The following has now been reported:

- an actual occurrence took place,
- reservation information remained in the group app,
- the reservation was not entered into Guestplan,
- the missing reservation was not discovered before guest arrival,
- the failure became visible when the guest physically arrived expecting the reservation.

The following has not yet been established:

- documentary corroboration through inspection of the original group-app message,
- whether the guest was ultimately seated,
- whether the missing reservation created a capacity conflict,
- whether the floor reservation plan was affected,
- whether the original group-app message was used to reconstruct what happened,
- whether corrective action followed,
- frequency of occurrence,
- whether similar failures have occurred through other reservation channels.


#### Observed Operational Consequence

When a missing reservation is discovered upon guest arrival, the restaurant can mostly resolve the situation during weekdays by accommodating the guest.

The exact method of accommodation has not yet been established.

Weekend operations differ from weekday operations because reservations are double-checked during weekends.

Therefore, the reported failure does not necessarily result in refusal of service, but its operational consequence may depend on the day and available restaurant capacity.

No conclusion has yet been established regarding:

- whether the guest always receives the originally requested dining area,
- whether the guest experiences a delay,
- whether another table allocation must be changed,
- whether another guest is affected,
- or whether the same failure would remain resolvable under full-capacity conditions.


#### Unknowns

The following remain unresolved:

- How is a missing reservation operationally accommodated during weekdays?
- Is the guest always able to receive the originally requested dining area?
- Does accommodating the guest require changes to other table allocations?
- What happens if the restaurant is operating at full capacity?
- How exactly are reservations double-checked during weekends?
- Who performs the weekend double-check?
- Which reservation sources are included in the double-check?
- When does the double-check occur?
- Is the group app checked as part of the weekend double-check?
- Was the original group-app message found and used to verify the reported missing reservation?
- Has this type of failure occurred more than once?