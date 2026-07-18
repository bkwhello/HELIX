# AS-001 – HELIX Artifact Identification and Naming Standard

## Status

Approved Standard

## Standard Type

Engineering Governance Standard

## Standard Domain

Artifact Management

## Applies To

- HELIX methodology
- HELIX engineering cases
- HELIX reference models
- HELIX standards
- HELIX methods
- HELIX investigations
- HELIX implementation artifacts
- HELIX governance records
- HELIX operational engineering records

## Authority

HELIX Engineering Governance

## Version

1.0

## Effective State

Active

## Supersedes

None

---

# 1. Purpose

AS-001 establishes the authoritative rules for identifying, naming, numbering, storing, referencing, versioning, freezing, superseding, and retiring HELIX engineering artifacts.

The standard ensures that every artifact:

- has a unique identity;
- communicates its engineering purpose;
- can be traced to related artifacts;
- can be referenced without ambiguity;
- remains distinguishable from drafts and informal notes;
- preserves its historical engineering state;
- and can be reused across multiple organizations and engineering cases.

AS-001 governs artifact identity.

It does not define the substantive content of every artifact type. Content requirements shall be defined by the applicable artifact-specific standard, method, template, or reference model.

---

# 2. Engineering Question

How shall HELIX identify and manage engineering artifacts so that their purpose, authority, lifecycle position, relationships, and historical state remain clear and traceable?

---

# 3. Scope

## 3.1 In Scope

This standard governs:

- artifact prefixes;
- artifact identifiers;
- numbering;
- titles;
- filenames;
- folder placement;
- status terminology;
- versioning;
- revision history;
- freezing;
- amendments;
- supersession;
- retirement;
- artifact references;
- cross-artifact traceability;
- artifact registers;
- namespace governance;
- abbreviation governance;
- duplicate prevention;
- canonical artifact control.

## 3.2 Out of Scope

This standard does not determine:

- whether an engineering conclusion is valid;
- whether evidence is sufficient;
- which organizational design should be selected;
- technical implementation details;
- source-code naming;
- database naming;
- API naming;
- employee naming;
- commercial document numbering;
- financial administration numbering.

Those may be governed by separate standards.

---

# 4. Normative Language

The following terms are normative:

- **Shall** indicates a mandatory requirement.
- **Shall not** indicates a prohibition.
- **Should** indicates a recommended practice that may be departed from with documented justification.
- **May** indicates a permitted option.
- **Must** may be used where failure would invalidate the artifact or its traceability.

---

# 5. Core Principles

## AP-001 — Unique Identity

Every canonical HELIX artifact shall have one unique artifact identifier.

No two canonical artifacts may use the same identifier.

---

## AP-002 — Purposeful Prefix

Every prefix shall communicate the artifact family or engineering function.

Prefixes shall not be created merely because an abbreviation appears convenient.

---

## AP-003 — Stable Identity

An artifact identifier shall remain stable throughout the artifact’s lifecycle.

Changes to status, filename, location, or version shall not silently change the artifact’s identity.

---

## AP-004 — Explicit Authority

Every canonical artifact shall state its authority, status, and relationship to preceding artifacts.

---

## AP-005 — Historical Preservation

Approved or frozen artifacts shall not be silently rewritten.

Engineering history shall be preserved through amendment, revision, or supersession.

---

## AP-006 — Traceability

Every derived artifact shall identify the authoritative artifacts from which it originates.

---

## AP-007 — Controlled Vocabulary

Artifact prefixes, statuses, and lifecycle terms shall come from an approved registry.

---

## AP-008 — Minimum Necessary Proliferation

HELIX shall avoid unnecessary artifact types.

A new artifact family shall only be introduced when an existing artifact type cannot represent the required engineering responsibility without ambiguity.

---

## AP-009 — Separation of Concern

Each artifact shall have one primary engineering responsibility.

An artifact shall not combine unrelated lifecycle responsibilities merely for convenience.

---

## AP-010 — Canonical Source

For each artifact identifier, exactly one version shall be designated as the current canonical source.

Copies, exports, summaries, and rendered formats shall not become competing canonical sources.

---

# 6. Artifact Identity Structure

Every canonical HELIX artifact shall use the following identifier structure:

```text
<PREFIX>-<NUMBER>