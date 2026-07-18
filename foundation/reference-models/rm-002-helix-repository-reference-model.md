---
artifact_id: RM-002
title: HELIX Repository Reference Model
artifact_type: Reference Model
status: Draft
version: "1.0"
owner: Chief Engineer
authority: HELIX Engineering Governance
origin:
  - AS-001
  - IF-004
related_case: []
effective_date: null
supersedes: []
superseded_by: []
relationships:
  - type: governed_by
    target: AS-001
  - type: supports
    target: AR-001
canonical: true
confidentiality: Internal
---

# RM-002 – HELIX Repository Reference Model

## Status

Draft

## Reference Model Type

Repository Architecture Reference Model

## Domain

HELIX Engineering System

## Version

1.0

## Authority

HELIX Engineering Governance

## Origin

- AS-001 – HELIX Artifact Identification and Naming Standard
- IF-004 – Artifact Register Feasibility Investigation

## Applies To

- HELIX core repository
- HELIX OS repository
- HELIX methodology development
- HELIX engineering cases
- HELIX standards
- HELIX governance records
- HELIX implementation programs
- Future HELIX-based organizational engineering repositories

## Supersedes

None

---

# 1. Purpose

RM-002 defines the canonical conceptual structure of the HELIX repository.

It establishes:

- the root-level repository domains;
- the responsibility of each domain;
- permitted relationships between repository areas;
- placement rules for engineering artifacts;
- separation boundaries;
- canonical storage principles;
- case-specific versus HELIX-wide artifact placement;
- generated versus authored content;
- archive and preservation expectations;
- and the relationship between the repository and HELIX governance.

The purpose of RM-002 is not merely to define folders.

It defines the repository as an engineering system.

---

# 2. Engineering Question

How shall the HELIX repository be structured so that foundation, methodology, standards, governance, engineering cases, implementation work, tools, and generated records remain separated, discoverable, traceable, and scalable?

---

# 3. Repository Role

The HELIX repository is the canonical environment in which HELIX engineering knowledge is:

- created;
- governed;
- reviewed;
- challenged;
- approved;
- preserved;
- implemented;
- traced;
- and reused.

The repository is not merely file storage.

It performs four roles:

1. Engineering knowledge base.
2. Governance record.
3. Implementation workspace.
4. Historical engineering archive.

---

# 4. Reference Model Principles

## RP-001 — Responsibility-Based Structure

Repository areas shall be organized according to engineering responsibility.

Files shall not be grouped only by file type.

For example, all Markdown files shall not be placed together merely because they share the same format.

---

## RP-002 — Separation of Authority

Artifacts with different authority, lifecycle purpose, or ownership shall remain distinguishable.

Foundation, standards, governance, methods, engineering cases, and implementation records shall not be merged into one undifferentiated document collection.

---

## RP-003 — One Canonical Location

Every canonical artifact shall have one authoritative repository location.

Copies, exports, and generated views shall not compete with the canonical source.

---

## RP-004 — Stable Root Domains

Root-level repository domains should change infrequently.

New root folders shall only be created when a distinct, enduring engineering responsibility cannot be represented clearly within an existing domain.

---

## RP-005 — Case Containment

Case-specific engineering records shall be contained within the applicable engineering case.

HELIX-wide methodology and governance artifacts shall not be stored inside an individual case.

---

## RP-006 — Reusable Knowledge Separation

Reusable standards, methods, models, and principles shall be separated from organization-specific implementation records.

A reusable artifact may originate from a case, but once accepted as HELIX-wide knowledge, it shall be governed outside the case.

---

## RP-007 — Generated Content Visibility

Generated files shall be clearly identified and separated from manually authored canonical artifacts.

Generated outputs shall not be edited directly unless their governing process explicitly permits it.

---

## RP-008 — Historical Preservation

Approved, frozen, superseded, and retired artifacts shall remain discoverable.

Repository cleanup shall not erase engineering history.

---

## RP-009 — Human and Machine Usability

The repository shall be understandable to engineers and inspectable by automated agents.

Structure, naming, metadata, and relationships shall support both.

---

## RP-010 — Minimum Necessary Complexity

Repository structure shall remain as simple as possible while preserving engineering clarity.

Folders shall not be introduced merely to create visual detail.

---

# 5. Canonical Root Structure

The canonical HELIX root shall contain the following primary domains:

```text
HELIX/
├── README.md
├── CLAUDE.md
├── AGENTS.md
├── CURRENT.md
├── PROJECT.md
│
├── foundation/
├── methods/
├── standards/
├── governance/
├── engineering-cases/
├── tools/
├── workspace/
└── archive/
```

---

## Note on Implementation Placement

`implementation/` is not a root domain.

Implementation is not an independent engineering responsibility. It is always the execution of either:

- HELIX itself, or
- an engineering case.

Case-specific implementation work is contained within its engineering case under `engineering-cases/` (RP-005).

Reusable implementation infrastructure — schemas, generators, validators, templates — is placed under:

- `/tools/`, when it is executable infrastructure, or
- `/standards/`, when it defines engineering rules rather than code.

This keeps the canonical root at eight domains instead of carrying a root folder that may never justify independent existence (RP-004, RP-010).