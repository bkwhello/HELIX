# IC-002 – Manually Created Shared Reservation Task

Status

Candidate Implementation

Candidate Type

Lightweight Shared-Task Candidate

Implementation Authority

- IR-001 – Established RCS-001 Implementation Requirements

Standard Implemented

- RCS-001 – Reservation Commitment Completion Standard

Organization

- Konnichiwa

Originating Engineering Case

- EC-001 – Konnichiwa Reservation Operations

Compared Against

- IC-001 – WhatsApp-Triggered Persistent Reservation Action

---

# Candidate Purpose

IC-002 proposes a lightweight implementation in which a qualifying deferred reservation commitment is manually entered into a shared task mechanism.

The candidate removes the automatic WhatsApp-trigger and message-extraction dependencies introduced by IC-001.

WhatsApp may remain the communication channel through which reservation information is transferred, but it does not automatically create the persistent unresolved action.

The receiving or submitting actor manually creates the shared task using a short structured task form.

The task remains visible, retrievable and accountable until the required Guestplan action is completed and closure is recorded.

---

# Candidate Question

Can Konnichiwa satisfy the established IR-001 requirements through a manually created shared reservation task without introducing WhatsApp integration, automated extraction or custom software?

---

# Candidate Principle

The core principle is:

> When an accepted reservation commitment leaves required Guestplan work incomplete, an authorized actor creates a persistent shared task before treating the reservation transfer as secured.

The shared task becomes the unresolved-work representation.

WhatsApp remains supporting communication and source material.

Guestplan remains the required operational destination for the original EC-001 pathway.

---

# Current Operational Reference Pathway

The original pathway is:

```text
Guest makes future reservation request
        ↓
Supervisor receives request
        ↓
Supervisor cannot enter reservation into Guestplan
        ↓
Reservation information is written or communicated
        ↓
Information is sent through WhatsApp
        ↓
Manager is expected to complete Guestplan entry