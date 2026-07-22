# HV-001 — HELIX Visibility Standard

## Metadata

```yaml
artifact_id: HV-001
title: HELIX Visibility Standard
artifact_type: Standard
version: 0.1.0
status: Draft
owner: HELIX Foundation
authority: Principal HELIX Architect
originating_case: EC-002
applies_to:
  - HELIX organizational visibility engineering
  - HELIX Visibility discipline artifacts
  - HELIX Visibility engineering cases
```

---

# 1. Status of This Draft

This standard is issued at **version 0.1.0, status Draft**, not Approved.

HV-001 is being written before its own governing evidence exists. EC-002 §20 ("Evidence Requirements") states that no diagnosis or design decision may rest on general visibility, SEO, GEO, or marketing best practice alone. The investigations that would earn a finished HV-001 — HV-IV-001 through HV-IV-010 — have not yet been completed to the rigor EC-002 §25 requires.

HV-001 is therefore scoped narrowly: it defines the discipline, its vocabulary, its boundaries, and its non-negotiable principles. It does not yet fix measurement thresholds, a finished coverage methodology, or claims about what works for visibility — those remain the job of RM-HV-001 through RM-HV-004 and the HV-IV-00x investigations.

HV-001 shall be revised to a later version once HV-IV-001 and HV-IV-002 have produced recorded evidence, per EC-002 §31 ("Immediate Next Actions").

---

# 2. Purpose

HV-001 defines HELIX Visibility as an engineering discipline: how an organization's external representation — across search engines, AI systems, maps, review platforms, reservation platforms, directories, and social platforms — is observed, understood, diagnosed, designed, implemented, and validated as an engineered organizational capability rather than pursued as disconnected marketing tactics.

This standard exists so that any HELIX Visibility engineering case, for any organization, can be understood, reviewed, and continued by a human engineer or an AI engineering agent without relying on undocumented assumptions.

Konnichiwa (EC-002) is the first reference implementation of this discipline. HV-001 is written to remain valid beyond Konnichiwa.

---

# 3. Engineering Question

How shall HELIX engineer an organization's external visibility so that independent search platforms, AI systems, recommendation systems, and customers consistently discover, understand, trust, recommend, and select the organization for relevant intents — with evidence, not assumption, as the basis for every material decision?

---

# 4. Visibility Definition

**Organizational Visibility** is:

> The degree to which external systems and people can discover, correctly understand, trust, recommend, and select an organization for the intents it is relevant to.

Visibility is not:

- a website;
- a social media account;
- a search ranking;
- an advertising campaign;
- a follower count;
- a marketing channel.

Those are possible carriers or symptoms of visibility. HV-001 governs the underlying capability, not any single channel.

---

# 5. Scope

## 5.1 In Scope

This standard governs:

- visibility discipline identity, vocabulary, and boundaries;
- the relationship between HELIX Visibility engineering cases, this standard, and the Visibility reference models;
- evidence requirements for visibility claims and decisions;
- the artifact structure a visibility engineering case shall use;
- the human approval boundary for external-facing changes;
- prioritization discipline for small-enterprise editions;
- the relationship between visibility work and other HELIX disciplines (e.g. HELIX Reservations).

## 5.2 Out of Scope

This standard does not define:

- a specific organization's visibility diagnosis, backlog, or coverage map — those belong to the organization's own engineering case (e.g. EC-002 for Konnichiwa);
- specific measurement thresholds and methods — governed by HV-002;
- evidence recording formats — governed by HV-003;
- content and knowledge-asset construction rules — governed by HV-004;
- entity/relationship graph modeling — governed by HV-005;
- AI-representation testing method — governed by HV-006;
- coverage-map construction method — governed by HV-007;
- SEO/GEO tactical technique — HV-001 governs engineering discipline, not technique libraries.

---

# 6. Core Principles

## HV-P-001 — Evidence Before Claim

No visibility diagnosis, design, or implementation decision shall rest on general best practice alone. Every material decision shall trace to recorded evidence: an Evidence ID, source, date, collection method, and related observation, claim, or defect (per EC-002 §20).

## HV-P-002 — Organizational Reality First

Visibility work shall represent the organization as it actually operates. External representation shall not diverge from organizational reality, and shall not be corrected by changing the representation before confirming which one is wrong.

## HV-P-003 — Single Authoritative Reality

Each visibility-relevant fact about an organization (name, hours, location, offering, category) shall have exactly one authoritative source of truth within the case. All external representations are measured for consistency against that source, not against each other.

## HV-P-004 — Intent-Justified Assets

A landing page, knowledge asset, or structured-data change shall not be created because a keyword or channel exists. It shall be justified by an identified customer intent, the evidence gap it closes, and a defined measurement method and maintenance owner (per EC-002 §21).

## HV-P-005 — Human Approval Boundary

HELIX may observe, research, analyze, diagnose, design, draft, recommend, and prepare changes. HELIX shall not publish external changes, modify live external profiles or listings, respond publicly on the organization's behalf, or otherwise alter production systems without explicit human approval (per EC-002 §23).

## HV-P-006 — Small Enterprise Focus

Where a case operates under the Small Enterprise Edition, the active visibility backlog should normally hold no more than five highest-priority actions at a time. The objective is verified improvement per unit of organizational effort, not activity volume (per EC-002 §22).

## HV-P-007 — Proportional Engineering

Documentation and process depth shall scale with consequence, uncertainty, and reversibility. A small organization's visibility case shall not be required to carry enterprise-scale process weight it has no evidence it needs.

## HV-P-008 — Traceable Correction

Corrected visibility claims, retracted recommendations, and superseded observations shall remain traceable, not silently overwritten. History is part of the evidence base.

## HV-P-009 — Reusable Discipline, Local Reality

HELIX Visibility (this standard and its reference models) is designed to be reused across organizations. An organization's own findings, backlog, and coverage map belong to that organization's case and shall not be treated as discipline-wide truth.

---

# 7. Discipline Structure

HELIX Visibility is composed of:

```text
HV-001                  Discipline standard (this document)
HV-002 .. HV-007        Sibling standards (measurement, evidence, knowledge
                        assets, visibility graph, AI validation, coverage)
RM-HV-001 .. RM-HV-004  Reference models (lifecycle, evidence flow,
                        visibility graph, intent coverage)
EC-00x                  Per-organization engineering cases (e.g. EC-002)
HV-IV-00x               Investigations opened within a case
HV-VCM-00x              Visibility Coverage Maps (per-case blueprints)
HV-VS-00x               Validation scenarios
```

HV-001 is the anchor document. The sibling standards (HV-002–HV-007) and reference models (RM-HV-001–RM-HV-004) are not yet written; each shall be issued only when a real case's evidence justifies it, per HV-P-007.

---

# 8. Required Case Artifact Structure

Every HELIX Visibility engineering case shall use the case-local structure below, and shall keep discipline-wide standards and reference models outside the case folder:

```text
engineering/
├── cases/
│   └── EC-0NN-<organization>-visibility/
│       ├── EC-0NN.md
│       ├── CURRENT.md
│       ├── PROJECT.md
│       ├── observations/
│       ├── evidence/
│       ├── claims/
│       ├── investigations/
│       ├── understanding/
│       ├── diagnosis/
│       ├── design/
│       ├── implementation/
│       ├── validation/
│       ├── operations/
│       ├── challenges/
│       ├── decisions/
│       ├── work-objects/
│       │   ├── reality-register/
│       │   ├── source-register/
│       │   ├── visibility-graph/
│       │   ├── coverage-map/
│       │   ├── knowledge-assets/
│       │   ├── evidence-objects/
│       │   ├── test-scenarios/
│       │   └── visibility-backlog/
│       └── references/
│
├── standards/
│   └── visibility/
│       ├── HV-001-visibility-standard.md
│       ├── HV-002-measurement-standard.md
│       ├── HV-003-evidence-standard.md
│       ├── HV-004-knowledge-asset-standard.md
│       ├── HV-005-visibility-graph-standard.md
│       ├── HV-006-ai-validation-standard.md
│       └── HV-007-coverage-standard.md
│
└── reference-models/
    └── visibility/
        ├── RM-HV-001-visibility-lifecycle.md
        ├── RM-HV-002-evidence-flow.md
        ├── RM-HV-003-visibility-graph.md
        └── RM-HV-004-intent-coverage.md
```

This mirrors the structure proposed in EC-002 §24. A case shall not invent a different top-level shape without recording why.

---

# 9. Case Lifecycle

Every HELIX Visibility case follows:

```text
Case Establishment
        ↓
Observation
        ↓
Evidence
        ↓
Organizational Claims
        ↓
Understanding
        ↓
Diagnosis
        ↓
Design
        ↓
Implementation
        ↓
Validation
        ↓
Operationalization
        ↓
Continuous Visibility Operations
```

No design or implementation decision is earned until the stages before it have produced recorded evidence for that specific decision.

---

# 10. Investigation Identifier

Investigations opened within a case use:

```text
HV-IV-NNN
```

Example: `HV-IV-001 – Current Visibility Source Investigation`.

An investigation shall state its purpose, method, evidence produced, and whether it is complete or partial before any downstream claim relies on it.

---

# 11. Prefix Registration Note

`HV` is introduced by this standard as the prefix for the HELIX Visibility discipline, under AS-001's AP-002 (Purposeful Prefix), AP-007 (Controlled Vocabulary), and AP-008 (Minimum Necessary Proliferation).

At the time of writing, AS-001 §6 (Artifact Identity Structure) is incomplete and no populated prefix registry exists in `registry/`. This registration is therefore recorded here as the interim source of truth for the `HV` prefix, pending completion of AS-001's own registry mechanism. When that registry is completed, `HV` shall be entered into it without change to its meaning.

---

# 12. Conformance

A visibility engineering case conforms to HV-001 when:

```yaml
required:
  - organization and edition identified
  - explicit in-scope and out-of-scope boundaries
  - evidence requirements followed for every material claim
  - single authoritative source per visibility-relevant fact
  - landing pages and assets justified by identified intent and evidence gap
  - human approval boundary respected for external publication
  - backlog kept within Small Enterprise focus where applicable
  - case artifact structure followed
  - investigations traceable to the claims and decisions they support
```

---

# 13. Relationship to Other HELIX Disciplines

HELIX Visibility is a sibling discipline to others such as HELIX Reservations (EC-001). Disciplines do not govern each other's authoritative data. Where visibility work touches reservation-owned facts (e.g. opening hours used in structured data), the reservations discipline remains the authoritative source, and visibility work shall reference it rather than redefine it.

---

# 14. Revision Trigger

This Draft shall be revised once:

- HV-IV-001 (Current Visibility Source Investigation) and HV-IV-002 (Organizational Reality Investigation) have produced recorded evidence;
- at least one Visibility Coverage Map has been produced and challenged;
- the first implementation cycle under EC-002 has completed a validation pass.

Until then, HV-001 shall be treated as provisional scaffolding, not settled doctrine.
