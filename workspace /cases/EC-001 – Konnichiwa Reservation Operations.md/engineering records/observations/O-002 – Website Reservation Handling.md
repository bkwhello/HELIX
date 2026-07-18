### O-002 – Website Reservation Handling

Source

Direct account from Engineering Lead and organizational actor.

Observation Status

Recorded – Not Yet Evidentially Validated

---

#### Raw Observation

When a customer makes a reservation through the Konnichiwa website reservation widget, the customer provides reservation information including:

- name,
- phone number,
- reservation date,
- reservation time,
- preferred area: Teppan or Sushi,
- number of persons,
- allergy information,
- and potentially other relevant guest information.

After the reservation is made:

- Konnichiwa receives a notification on a phone.
- The customer receives a reservation notification.
- A few days before the reservation, the customer receives another notification concerning the upcoming reservation.
- Konnichiwa checks the reservations for the current day.
- A floor reservation plan is created based on reservation time, selected area, number of persons, and other relevant reservation information.

#### Current Observed Flow

Customer submits reservation
        ↓
Reservation information is recorded
        ↓
Konnichiwa receives phone notification
        ↓
Customer receives reservation notification
        ↓
Customer receives pre-arrival reminder
        ↓
Konnichiwa checks today's reservations
        ↓
Floor reservation plan is created
        ↓
Reservation information contributes to operational preparation

#### Candidate Work Objects
----

-----
##### WO-001 – Reservation Record

Contains reservation information including:

- guest name,
- phone number,
- date,
- time,
- preferred dining area,
- number of persons,
- allergy information,
- other relevant reservation information where applicable.

Status

Candidate Work Object – Observed, Not Yet Evidentially Validated

-----

----

#### Unknowns

The following remain unresolved:

- Is the website reservation immediately and automatically accepted?
- Is there any manual approval step?
- Is the phone notification sent to one device or multiple devices?
- Which organizational actor checks today's reservations?
- At what time or frequency are today's reservations checked?
- Who creates the floor reservation plan?
- Where is the floor reservation plan created?
- Is the floor reservation plan digital, physical, or both?
- Can the floor reservation plan change during service?
- How are late reservations incorporated after the initial floor plan has been created?
- How are cancellations and modifications propagated into the floor reservation plan?
- How is allergy information transferred from the reservation record into actual service preparation?
