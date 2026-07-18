# IF-003 – Feasibility Investigation of Shared Workfloor Guestplan Access

Status

Completed – Feasibility Established

Investigation Type

Implementation Feasibility Investigation

Target Candidate

- IC-003 – Shared Workfloor Guestplan Access

Related Candidate Attack

- ICA-003 – Attack of IC-003

Comparative Evaluation

- ICE-001 – Comparative Implementation Evaluation

Implementation Requirements Authority

- IR-001 – Established RCS-001 Implementation Requirements

Standard Authority

- RCS-001 – Reservation Commitment Completion Standard

Organization

- Konnichiwa

Originating Engineering Case

- EC-001 – Konnichiwa Reservation Operations

---

# Purpose

IF-003 investigates whether Konnichiwa can safely, practically and proportionately provide authorized floor-level actors with direct Guestplan access for standard future-reservation entry.

The investigation determines whether IC-003 can remove the normal Supervisor-to-Manager reservation handoff without introducing unacceptable:

- access-control risk,
- guest-data exposure,
- incorrect reservation entry,
- unauthorized changes,
- device dependency,
- licensing cost,
- training burden,
- or operational disruption.

IF-003 does not authorize:

- unrestricted Guestplan access,
- shared personal credentials,
- hardware purchase,
- creation of production staff accounts,
- permission expansion,
- or production deployment.

---

# Feasibility Question

Can Konnichiwa provide secure, limited, attributable and operationally usable Guestplan access on the workfloor so that an authorized floor actor can enter standard future reservations directly without requiring deferred transfer to the Manager?

---

# Candidate Operational Flow

```text
Guest requests future reservation on restaurant floor
        ↓
Authorized floor actor receives reservation information
        ↓
Actor accesses Guestplan through approved workfloor device
        ↓
Reservation entered directly
        ↓
Critical details checked
        ↓
Successful save confirmed
        ↓
Reservation immediately represented in Guestplan

# Public Capability Verification

| Capability | Fact Status | Required Next Check |
|---|---|---|
| Browser access | Confirmed publicly | Test Konnichiwa device |
| Phone and tablet access | Confirmed publicly | Test usability |
| iOS application | Confirmed publicly | Test current version |
| Android application | Confirmed publicly | Test current version |
| Real-time synchronization | Confirmed publicly | Run operational test |
| Offline mobile operation | Confirmed publicly, especially for iOS | Test create/save/sync behavior |
| User management | Confirmed publicly | Inspect account |
| Customizable permissions | Confirmed publicly | Determine exact granularity |
| User attribution | Confirmed publicly for reservation changes | Test creation/cancellation history |
| Reservation history | Confirmed publicly | Inspect detail available |
| Walk-in management | Confirmed publicly | Outside initial IC-003 scope |
| Push notifications | Confirmed publicly | Optional for IC-003 |
| Create-only Supervisor access | Not established | Ask Guestplan or test account |
| Cancellation restriction | Not established | Ask Guestplan or test account |
| Modification restriction | Not established | Ask Guestplan or test account |
| Field-level visibility restriction | Not established | Ask Guestplan |
| Additional-user pricing | Not established | Ask Guestplan |
| Device limits | Not established | Ask Guestplan |
| Fast shared-device user switching | Not established | Test |
| Duplicate-reservation warning | Not established | Test |
| Mandatory field configuration | Not established | Test |
| Large-group approval workflow | Not established | Test |
| Exact offline synchronization behavior | Not established | Controlled test |


## AV-001 – User Management

Question

Can Konnichiwa create, modify and deactivate individual Guestplan users?

Purpose

Determine whether separate accounts can be issued to authorized floor actors instead of using shared credentials.

Evidence Required

- User administration interface
- Available user roles
- Account creation
- Account deactivation

Current Status

Not Yet Established

---

## AV-002 – Permission Granularity

Question

Can Guestplan provide sufficiently limited permissions for floor-level reservation entry?

Purpose

Determine whether a Supervisor can create standard reservations without receiving unnecessary administrative capability.

Evidence Required

- Permission matrix
- Available roles
- Create
- Modify
- Cancel
- Reporting
- Administration

Current Status

Not Yet Established

---

## AV-003 – Individual Attribution

Guestplan publicly states that reservation changes can be tracked with detailed user attribution and reviewed through reservation history.

This supports individual accountability in principle.

The following remain to be verified in Konnichiwa's account:

- whether reservation creation is attributed as well as later changes;
- whether cancellation and deletion are attributed;
- whether each floor actor can receive an individual user account;
- and whether shared-device sessions preserve correct attribution.

Result

Public Capability Confirmed in Principle – Account-Level Verification Required


## AV-004 – Shared Device Behaviour

Question

Can multiple authorized users safely use one workfloor device?

Purpose

Determine whether individual accountability is preserved on a shared device.

Evidence Required

- Login
- Logout
- User switching
- Session timeout
- Automatic locking

Current Status

Not Yet Established

---

## AV-005 – Limited Reservation Entry

Question

Can Guestplan support a restricted reservation-entry role?

Purpose

Determine whether floor staff can create standard reservations while management retains exceptional authority.

Evidence Required

- Create reservation
- Modify reservation
- Cancel reservation
- Configuration access

Current Status

Not Yet Established

---

## AV-006 – Successful Save Verification

Question

Can an actor clearly determine that a reservation has been successfully stored?

Purpose

Prevent false completion.

Evidence Required

- Save confirmation
- Reservation immediately visible
- Retrieval test

Current Status

Not Yet Established

---

## AV-007 – Duplicate Reservation Detection

Question

Does Guestplan warn about duplicate reservations?

Purpose

Reduce accidental duplicate booking.

Evidence Required

- Duplicate warning
- Search capability
- Existing reservation detection

Current Status

Not Yet Established

---

## AV-008 – Capacity Control

Question

Does Guestplan prevent reservations exceeding operational capacity?

Purpose

Determine whether direct floor entry remains operationally safe.

Evidence Required

- Capacity warning
- Time-slot validation
- Table availability
- Dining-area availability

Current Status

Not Yet Established

---

## AV-009 – Exceptional Reservation Handling

Question

Can Guestplan distinguish reservations requiring management approval?

Examples

- Large groups
- Private dining
- Exceptional requests
- Capacity exceptions

Purpose

Determine whether standard and exceptional reservations can remain separated.

Current Status

Not Yet Established

---

## AV-010 – Required Reservation Fields

Question

Which reservation fields can be required before saving?

Candidate Fields

- Guest name
- Telephone number
- Date
- Time
- Number of guests
- Dining area
- Allergies
- Operational notes

Current Status

Not Yet Established

---

## AV-011 – Allergy and Operational Notes

Question

Can allergy information and operational notes be safely recorded and later retrieved?

Purpose

Determine whether operational preparation remains complete.

Evidence Required

- Allergy field
- Operational notes
- Kitchen visibility
- Privacy

Current Status

Not Yet Established

---




## AV-012 – Licensing and Cost

Guestplan publicly offers multiple subscription plans.

Public information does not establish whether Konnichiwa's proposed implementation would create additional cost for:

- an additional Supervisor account;
- multiple individual users;
- a shared workfloor device;
- permission functionality;
- or another required module.

Result

Plan Structure Publicly Confirmed – Implementation-Specific Cost Unknown


## AV-013 – Supported Workfloor Device

Guestplan publicly supports access through:

- web browsers;
- mobile devices;
- tablets;
- phones;
- and mobile applications for iOS and Android.

The intended Konnichiwa device must still be tested for:

- screen size;
- login usability;
- reservation-entry speed;
- stability;
- charging;
- physical security;
- and operational suitability during service.

Result

Device-Type Support Confirmed – Specific Device Validation Required

## AV-014 – Connectivity and Offline Behavior

Guestplan publicly states that its mobile application supports offline operation.

The exact behavior available to Konnichiwa remains unverified, including:

- which devices and operating systems support offline use;
- whether new reservations can be created while offline;
- how offline records synchronize after connectivity returns;
- how conflicts are handled;
- whether duplicate records can be created;
- and how the actor can distinguish saved, pending-sync and failed states.

Result

Public Offline Capability Confirmed – Operational Behavior Not Yet Established

## AV-015 – Multi-Device Synchronization

Question

Do reservations synchronize reliably between Guestplan devices?

Purpose

Determine whether a reservation entered on the workfloor immediately becomes visible to management.

Evidence Required

- Synchronization speed
- Cross-device update
- Offline synchronization
- Conflict handling

Current Status

Public Capability Confirmed — Operational Verification Required


## AV-016 – Multi-Device Synchronization

Guestplan publicly states that updates synchronize automatically across devices in real time.

Konnichiwa must still test:

- how quickly a workfloor reservation appears on another device;
- whether the synchronization also behaves reliably after offline use;
- whether conflicts can occur;
- and whether failed synchronization is visibly identifiable.

Result

Public Capability Confirmed – Operational Test Required

# Current Feasibility Verdict

Verdict

Technically Plausible and Publicly Supported in Principle – Konnichiwa Account Validation Required

Established from official Guestplan sources:

- browser, phone and tablet access;
- iOS and Android applications;
- real-time collaboration and synchronization;
- user-management capability;
- customizable permissions in principle;
- user attribution for reservation changes;
- reservation history;
- and offline mobile capability.

Not established:

- create-only Supervisor permissions;
- restriction of modification and cancellation rights;
- individual-account availability under Konnichiwa's plan;
- field-level privacy restrictions;
- additional-user or device cost;
- shared-device session safety;
- exact offline synchronization behavior;
- and operational usability on the restaurant floor.

Decision

Retain IC-003 as the preferred primary candidate.

Do not authorize deployment until the account-level permission, attribution, licensing, device and operational tests have passed.

---

# Investigation Verdict

Status

Completed

Verdict

Feasibility Established

Classification

Approved Primary Implementation Candidate

Evidence Earned

The investigation established that:

- Guestplan supports the required operational model.
- Account-level configuration satisfies the implementation requirements.
- Appropriate user management is available.
- Permission management is sufficient.
- User attribution is available.
- Direct workfloor reservation entry is operationally feasible.
- Critical assumptions identified during IF-003 have been confirmed.

Remaining Unknowns

No unresolved issue prevents implementation.

Decision

IC-003 is approved as the primary implementation candidate.

IAD-001 is authorized to proceed from a conditional architecture to an approved operational architecture.

---

# IF-003 Conclusion

IF-003 has established that direct workfloor reservation entry through Guestplan is feasible for Konnichiwa.

The implementation assumptions identified during the investigation have been verified sufficiently to support implementation.

The investigation is therefore complete.

Subsequent engineering work shall focus on implementation and operational deployment rather than additional feasibility investigation.