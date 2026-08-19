# CAP-D05.01 — Reservation Contact Management — Rule Model

R1.3-I1 implementation (see
`solutions/reservations/implementation/R1_3_I1_CAP_D05_01_IMPLEMENTATION_REPORT.md`).
Scoped to the rules actually enforced by this implementation slice —
not a full capability documentation suite. Follows the same format
convention as CAP-D01.01's rule-model.md.

---

## CAP-D05.01-R01 — A Contact Requires a Name and a Usable Contact Method

```yaml
type: Validation
severity: Blocking
override_allowed: false
```

A Contact shall have a display name and at least one of: a phone
number, an email address.

Name only, phone only, email only, and no contact method at all are
all rejected. A Contact does not require both phone and email.

Owner-confirmed (R1.3-I1 assignment §2 "Minimum reservation contact
requirement").

---

## CAP-D05.01-R02 — Contact Identity Is Internal and Never Derived

```yaml
type: Invariant
severity: Blocking
override_allowed: false
```

A Contact's identity (id) shall be generated internally by HELIX and
shall never be derived from, or equal to, its phone number, email
address, or display name.

A phone number or email address may change over a Contact's lifetime
without affecting its identity.

---

## CAP-D05.01-R03 — Possible Match Discovery Is Non-Blocking, Never Proof of Identity

```yaml
type: Validation
severity: Warning
override_allowed: true
```

A phone or email match between a new Contact and an existing Contact
is a possible-match signal only, surfaced to staff for an explicit
decision (reuse the existing Contact, or create a new one).

It shall never trigger automatic reuse, automatic merging, or
automatic rejection. Two or more Contacts may legitimately share a
phone number or email address (e.g. a shared family phone).

Owner-confirmed (R1.3-I1 assignment §2 "Contact reuse").

---

## CAP-D05.01-R04 — Reservation-Time Contact Snapshots Are Immutable to Later Contact Edits

```yaml
type: Invariant
severity: Blocking
override_allowed: false
```

The contact name, phone, and email captured on a Reservation at
creation time (its snapshot) shall not be altered by a subsequent
edit to the referenced Contact record.

A Reservation's own snapshot fields may still be corrected directly by
staff (the same operational-correction pattern already established
for contactName under CAP-D01.01-R07) — this rule governs propagation
FROM the Contact record, not whether the Reservation's own fields are
editable.

---

## CAP-D05.01-R05 — Phone Normalization Is Bounded, Not a General Parser

```yaml
type: Validation
severity: Advisory
override_allowed: true
```

Phone number normalization (for possible-match comparison only, never
for display or as identity) shall cover the documented Dutch/
international forms (06..., 0..., 0031..., +...) using a bounded,
internal implementation.

Adopting a maintained third-party phone-parsing library is deferred
until there is evidence of a guest base broad enough to justify it —
see the R1.3 architecture investigation §13.

---

## Relationship to CAP-D01.01

`Reservation.contactId` (CAP-D01.01-R07) references a Contact managed
under this capability. CAP-D01.01 depends on CAP-D05.01 to prove a
referenced Contact exists and is Active before a reservation may be
created against it — replacing the `UnvalidatedContactReader`
placeholder that always reported existence.
