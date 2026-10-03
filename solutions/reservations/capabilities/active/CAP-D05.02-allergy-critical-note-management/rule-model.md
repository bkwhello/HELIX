# CAP-D05.02 — Allergy and Critical Note Management — Rule Model

R1.3-I3 implementation (commit `5d55227eddfb8da943c2c41d1486fb0fd1a69228`,
"feat(reservations): add critical note management"). Scoped to the
rules actually enforced by this implementation slice — not a full
capability documentation suite. Follows the same format convention as
CAP-D01.01's and CAP-D05.01's rule-model.md files.

---

## CAP-D05.02-R01 — Critical Note Detail Must Be Trimmed and Bounded

```yaml
type: Validation
severity: Blocking
override_allowed: false
```

A critical note's detail shall be non-empty after trimming leading/
trailing whitespace, and no longer than 500 characters. The stored
value is the trimmed form, never the raw (possibly padded) input.

This is deliberately still free text INSIDE a typed, attributed,
visibly-distinct record — CAP-D01.01-AC31 ("allergy information is not
reduced to unstructured notes") objects to allergy information being
reduced to unstructured notes, not to prose existing at all once it is
owned by this structure.

Enforced in the application layer by `CriticalNoteDetail.create()`
(`domain/value-objects/ReservationCriticalNote.ts`), and backstopped at
the database layer by the real CHECK constraint
`reservation_critical_notes_detail_not_blank_check` (migration
`20261001090000_add_reservation_critical_notes`).

---

## CAP-D05.02-R02 — Critical Note Type Must Be a Registered Category

```yaml
type: Validation
severity: Blocking
override_allowed: false
```

A critical note's type shall be one of exactly two registered
categories: `Allergy` or `Critical`. Deliberately a closed, two-member
type, not an open string: `Allergy` singles out the one category this
capability's own purpose names explicitly ("prominently expose allergy
information"); `Critical` covers every other critical operational note
without inventing a taxonomy nothing has asked for yet. No severity
scoring, medical diagnosis, or automated risk interpretation.

Enforced in the application layer by `validateCriticalNoteType()`
(`domain/value-objects/ReservationCriticalNote.ts`), and backstopped at
the database layer by the real CHECK constraint
`reservation_critical_notes_note_type_check`.

---

## CAP-D05.02-R03 — An Update or Resolve Target Must Be an Active Note Belonging to That Reservation

```yaml
type: Invariant
severity: Blocking
override_allowed: false
```

An `update` or `resolve` operation shall reference a critical note
that both (a) exists and belongs to the Reservation being modified,
and (b) is currently `Active`. An unknown id, a cross-Reservation id,
and an already-`Resolved` id are deliberately NOT distinguished at this
boundary — they share one outcome (rejection), the same "missing and
disabled/invalid share one outcome" posture established elsewhere in
this codebase (`CanonicalServicePeriodReader`).

A violation of this rule fails the entire Modify request — no partial
application of the remaining, otherwise-valid changes in the same
change set.

This is also how resolution is made one-way: a `Resolved` note can
never again be the target of `update` or `resolve`.

Enforced in the application layer by
`validateCriticalNoteChangeIdentities()`
(`domain/rules/CriticalNoteRules.ts`), evaluated against a fresh,
unlocked pre-read of the Reservation's current notes immediately before
the write, and backstopped at the database layer by the real CHECK
constraint `reservation_critical_notes_status_resolved_at_check`
(status/resolvedAt consistency) plus the repository's own re-check of
`status = 'Active'` inside the same transaction as the write.

---

## CAP-D05.02-R04 — A Critical Note Id May Appear Only Once in a Single Change Set

```yaml
type: Validation
severity: Blocking
override_allowed: false
```

The same critical note id shall not appear more than once across the
combined `update` and `resolve` arrays of a single Modify request — not
twice within `update`, not twice within `resolve`, and not once in each.

Enforced in the application layer by
`validateCriticalNoteChangeIdentities()`
(`domain/rules/CriticalNoteRules.ts`), collecting every violation
(never short-circuiting on the first) alongside CAP-D05.02-R03.

---

## Relationship to CAP-D01.01

`ReservationCriticalNote.reservationId` references a Reservation
managed under CAP-D01.01, via a real foreign key
(`reservation_critical_notes_reservation_id_fkey`, `ON DELETE RESTRICT
ON UPDATE RESTRICT`) — a Reservation referenced by any critical note
can be neither deleted nor have its identity changed. This realizes
CAP-D01.01-AC31 ("Do Not Own Allergy Meaning"): Reservation Management
may reference the information (the Reservation aggregate carries a
`criticalNotes` snapshot on its own `ReservationCreated`/
`ReservationModified` events), but it does not redefine `noteType`'s or
`status`'s authoritative meaning — that validation lives entirely in
this capability's own domain module
(`domain/value-objects/ReservationCriticalNote.ts`,
`domain/rules/CriticalNoteRules.ts`), never duplicated elsewhere.

## Event model note

See `capability-registry.yaml.md`'s own CAP-D05.02 entry (R1-DOC-13)
for the reconciliation of this capability's four owned event meanings
(`AllergyInformationRecorded`, `AllergyInformationChanged`,
`CriticalNoteAdded`, `CriticalNoteResolved`) against their current
realization as typed fields inside CAP-D01.01's existing
`ReservationCreated`/`ReservationModified` event envelope, rather than
as dedicated literal event types.

## Permissions

No new permission was introduced. Critical-note creation reuses
`Permission.ReservationCreate`; add/update/resolve reuse
`Permission.ReservationModify`; reads reuse `Permission.ReservationView`
— the same permissions already governing the Reservation record the
notes are attached to.

## Read contract

The daily reservation list exposes Active notes only; a single
Reservation's detail view exposes both Active and Resolved notes, in
deterministic `createdAt` then `id` order. Both reads project through
an explicit allowlist (`id`/`noteType`/`detail`/`status`/`createdAt`/
`updatedAt`/`resolvedAt`) — the acting staff user id persisted on each
note (`createdByStaffUserId`/`updatedByStaffUserId`) is retained for
auditability but is never surfaced through an ordinary Reservation
read.
