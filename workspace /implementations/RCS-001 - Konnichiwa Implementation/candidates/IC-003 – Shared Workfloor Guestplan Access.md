# IC-003 – Shared Workfloor Guestplan Access

Status

Candidate Implementation

Implementation Authority

- IR-001 – Established RCS-001 Implementation Requirements

Standard Implemented

- RCS-001 – Reservation Commitment Completion Standard

Organization

- Konnichiwa

---

# Candidate Purpose

IC-003 proposes eliminating unnecessary deferred reservation transfer by enabling authorized floor-level actors to enter qualifying reservation commitments directly into Guestplan through a secured shared workfloor device.

---

# Candidate Principle

Where a reservation commitment is accepted on the restaurant floor, the receiving authorized actor should complete the required Guestplan action directly where operationally safe and technically possible.

Deferred completion mechanisms should be used only where direct completion is unavailable or inappropriate.

---

# Proposed Flow

Guest makes reservation request on restaurant floor
        ↓
Authorized floor actor uses secured shared device
        ↓
Reservation entered directly into Guestplan
        ↓
Essential details checked
        ↓
Reservation completed

No WhatsApp transfer or separate reservation task is required where direct completion succeeds.

---

# Workfloor Capability

The candidate may use:

- a secured tablet,
- a fixed terminal,
- a managed workstation,
- or another approved device.

The device shall provide reliable access during relevant operating periods.

---

# Access Model

Access shall be role-based and proportionate.

Possible Supervisor permissions:

- create reservations;
- view information necessary for reservation handling;
- enter relevant guest and operational details.

Restricted actions may remain limited to management, including:

- cancellation;
- material modification;
- access administration;
- reporting;
- or other sensitive functions.

The exact permission model depends on Guestplan capability.

---

# Security Requirements

The implementation shall avoid:

- shared personal credentials;
- uncontrolled access;
- permanently unlocked sessions;
- unnecessary exposure of guest information;
- and untraceable changes.

Controls may include:

- individual accounts;
- role-based permissions;
- automatic screen locking;
- device management;
- activity logging;
- and controlled physical placement.

---

# Operational Requirements

The candidate requires:

- trained authorized floor actors;
- a simple reservation-entry procedure;
- required field validation;
- direct confirmation that Guestplan entry exists;
- a fallback procedure if Guestplan or the device is unavailable.

---

# Fallback

Where direct Guestplan entry cannot occur:

Reservation commitment accepted
        ↓
Direct entry unavailable
        ↓
RCS-001 deferred-completion mechanism activated
        ↓
Persistent unresolved action created or retained
        ↓
Completion later performed and closed

IC-003 therefore reduces deferred work but does not eliminate the need for a fallback mechanism.

---

# Candidate Strengths

- removes unnecessary handoff;
- reduces dependence on memory;
- avoids WhatsApp transfer;
- avoids separate task creation in normal cases;
- reduces duplicate data;
- provides immediate Guestplan representation;
- lowers completion latency;
- aligns with direct-entry preference established in DES-001.

---

# Candidate Weaknesses

- requires Guestplan access on the workfloor;
- may require additional accounts or licenses;
- introduces device and access-security responsibilities;
- requires training;
- may expose more guest data to floor staff;
- may allow incorrect or unauthorized changes;
- requires fallback during outages or busy conditions.

---

# Candidate Status

IC-003 is a Candidate Implementation.

It has not yet been:

- technically validated;
- attacked;
- compared with IC-001 or IC-002;
- selected;
- or deployed.