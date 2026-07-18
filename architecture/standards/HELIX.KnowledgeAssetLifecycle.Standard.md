# HELIX.KnowledgeAssetLifecycle.Standard.md

**Standard ID:** HELIX-KNOW-005

**Version:** 1.0.0

**Status:** Draft

**Owner:** Architecture Domain

**Classification:** Lifecycle Standard

---

# Purpose

This standard defines the lifecycle of a Knowledge Asset within the HELIX Organizational Knowledge Capability.

The lifecycle ensures that every Knowledge Asset is created, validated, maintained, evolved, and retired in a controlled and traceable manner.

The objective is to preserve organizational trust in knowledge throughout its entire existence.

---

# Scope

This standard defines:

- Lifecycle states
- State transitions
- Lifecycle principles
- Retirement rules
- Archival rules

This standard does not define:

- Governance responsibilities
- Versioning
- Knowledge Relationships
- Knowledge Networks
- Storage technologies

These are defined in separate standards.

---

# Definition

A Knowledge Asset progresses through a defined sequence of lifecycle states from creation to retirement.

A Knowledge Asset shall never exist outside its lifecycle.

---

# Guiding Principle

> Every Knowledge Asset shall have a known lifecycle state.

Consumers must always be able to determine the current status and trustworthiness of a Knowledge Asset.

---

# Lifecycle States

## Draft

The Knowledge Asset is being created.

Characteristics:

- Editable
- Not authoritative
- Not consumable outside the authoring process

---

## Under Review

The Knowledge Asset is undergoing validation.

Characteristics:

- Review in progress
- Changes may still occur
- Not yet authoritative

---

## Approved

The Knowledge Asset has been formally approved.

Characteristics:

- Authoritative
- Ready for publication
- Eligible for organizational use

---

## Active

The Knowledge Asset is actively used by the organization.

Characteristics:

- Current
- Trusted
- Available to consumers

---

## Deprecated

The Knowledge Asset is still available but should no longer be used for new work.

Characteristics:

- Maintained for reference
- Replacement identified where applicable
- Consumers should migrate

---

## Archived

The Knowledge Asset is retained for historical, legal, or audit purposes.

Characteristics:

- Read-only
- No operational use
- Fully traceable

---

## Retired

The Knowledge Asset has reached the end of its lifecycle.

Characteristics:

- Removed from operational knowledge
- Preserved only when required by policy or regulation
- No longer referenced by active Knowledge Assets

---

# Lifecycle Transitions

Permitted transitions:

Draft

↓

Under Review

↓

Approved

↓

Active

↓

Deprecated

↓

Archived

↓

Retired

Reverse transitions require explicit governance approval.

---

# Lifecycle Rules

Every Knowledge Asset shall:

- exist in exactly one lifecycle state
- record all lifecycle transitions
- maintain complete traceability
- preserve historical integrity

Knowledge Assets shall never be permanently removed without following the defined retirement process.

---

# Retirement Rules

A Knowledge Asset may only be retired when:

- it has no active dependencies, or
- all dependencies have been migrated, or
- an approved exception exists.

Retirement shall preserve historical traceability.

---

# Archival Rules

Archived Knowledge Assets shall:

- remain uniquely identifiable
- preserve their complete history
- remain available for audit purposes
- not participate in active organizational operations

---

# Trust Principle

The lifecycle state communicates the level of organizational trust.

Consumers shall always be able to determine whether a Knowledge Asset is:

- authoritative
- active
- deprecated
- historical

---

# Architectural Principles

1. Every Knowledge Asset has one lifecycle state.
2. Lifecycle transitions are explicit.
3. Historical traceability is never lost.
4. Retirement does not erase organizational memory.
5. Organizational trust depends upon lifecycle integrity.

---

# Compliance

A Knowledge Asset is lifecycle compliant only if it satisfies every requirement defined by this standard.

---

# Relationship to Other Standards

Depends on:

- HELIX.Knowledge.Standard.md
- HELIX.KnowledgeAsset.Standard.md

Extended by:

- HELIX.KnowledgeGovernance.Standard.md
- HELIX.KnowledgeVersioning.Standard.md

---

# Guiding Statement

Knowledge is valuable only when its trustworthiness is known.

The HELIX Knowledge Asset Lifecycle preserves organizational confidence by ensuring every Knowledge Asset progresses through a transparent, governed, and fully traceable lifecycle.