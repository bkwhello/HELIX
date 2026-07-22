# RM-HV-001 – HELIX Visibility Lifecycle Reference Model

Status: Draft

Version: 0.1

Discipline: HELIX Visibility

Classification: Reference Model

Governing Standard: HV-001

Grounded In: EC-002 (Konnichiwa), HV-IV-001 through HV-IV-004

---

# Purpose

Define how the fundamental concepts of HELIX Visibility relate to one another — how an organization's reality becomes external representation, how representation is turned into evidence, how evidence reveals defects, and how defects are closed and validated.

This model is the conceptual backbone that HV-002 through HV-007 (measurement, evidence, knowledge assets, visibility graph, AI validation, coverage) each specialize. It is written to be reusable across organizations; Konnichiwa (EC-002) is its first reference implementation and the source of every concrete example below.

---

# Scope

This reference model defines:

- Core visibility concepts.
- Concept relationships.
- The lifecycle flow a fact travels from organizational reality to validated external recommendation.
- Where each existing or planned HELIX Visibility artifact type (investigation, register, evidence log, coverage map, backlog) sits in that flow.

This document does not define measurement thresholds (HV-002), evidence recording format (HV-003), content construction rules (HV-004), graph/entity modeling (HV-005), AI testing method (HV-006), or coverage-map construction method (HV-007).

---

# Foundational Model

HELIX Visibility currently models an organization's external visibility through the following concepts:

- Organizational Reality
- Visibility Source
- Representation
- Evidence
- Visibility Defect
- Organizational Claim
- Customer Intent
- Knowledge Asset
- Coverage Map
- Visibility Backlog
- Validation

---

# Reference Model Diagram

```text
Organizational Reality
        │
        │ is represented by
        ▼
   Visibility Source ── (website, search engine, AI system,
        │                Google Business Profile, review
        │                platform, directory, social profile)
        │ produces
        ▼
   Representation
        │
        │ observed and recorded as
        ▼
     Evidence
        │
        │ compared against Organizational Reality, reveals
        ▼
  Visibility Defect ── (missing / contradictory / stale /
        │               weak / intent gap / entity ambiguity /
        │               relationship ambiguity / machine
        │               accessibility / recommendation /
        │               conversion path)
        │ informs
        ▼
 Organizational Claim
        │
        │ mapped to
        ▼
   Customer Intent
        │
        │ closed by
        ▼
  Knowledge Asset ──────┐
        │               │ positioned by
        │ prioritized   ▼
        │ in       Coverage Map
        ▼
 Visibility Backlog
        │
        │ implemented, then
        ▼
    Validation
        │
        │ confirms closure of, or reopens
        ▼
  Visibility Defect (loop closes — becomes new Evidence)
```

---

## Validated Structural Relationships

```text
Organizational Reality
│
└── is represented by Visibility Source

Visibility Source
│
└── produces Representation

Representation
│
└── is observed and recorded as Evidence

Evidence
│
├── is compared against Organizational Reality
└── reveals Visibility Defect

Visibility Defect
│
└── informs Organizational Claim

Organizational Claim
│
└── is mapped to Customer Intent

Customer Intent
│
└── is closed by Knowledge Asset

Knowledge Asset
│
├── is positioned by Coverage Map
└── is prioritized in Visibility Backlog

Visibility Backlog
│
└── is implemented, then subject to Validation

Validation
│
├── confirms closure of Visibility Defect
└── or reopens Visibility Defect, producing new Evidence
```

---

# Concept Definitions

## Organizational Reality

The authoritative, owner-confirmed facts of the organization. Not what any external system says — what is actually true. In EC-002, this is HV-IV-002's Organizational Reality Register (address, hours, legal entity, roles).

## Visibility Source

Any external system capable of representing the organization: website, search engine, AI system, maps, review platform, reservation platform, directory, or social profile (EC-002 §6.1). Investigated for Konnichiwa via HV-IV-001 (source inventory) and HV-IV-003/HV-IV-004 (search and AI sources specifically).

## Representation

What a specific Visibility Source currently states about the organization at a point in time. Example: DeepSeek's stated opening hours for Konnichiwa (HV-IV-004, EV-006) is one Representation; Gemini's is a different Representation of the same underlying reality.

## Evidence

A Representation, recorded with source, date, collection method, reliability, and limitations (EC-002 §20). Evidence is the only accepted basis for a Visibility Defect claim (HV-P-001, Evidence Before Claim). Example: EV-001 through EV-010 in HV-IV-002/HV-IV-003/HV-IV-004.

## Visibility Defect

A gap between Organizational Reality and one or more pieces of Evidence, classified using the EC-002 §17 taxonomy (Missing, Contradictory, Stale, Weak Evidence, Intent Coverage Gap, Entity Ambiguity, Relationship Ambiguity, Machine Accessibility Failure, Recommendation Gap, Conversion Path Failure). Example: the opening-hours defect found across four AI systems in HV-IV-004 is a **Contradictory Representation** (EC-002-VD-002) — no system matched Organizational Reality, and the disagreement traced to an unrecorded distinction between kitchen hours, venue hours, and a separate teppanyaki schedule.

## Organizational Claim

A specific, falsifiable statement about what would close a Visibility Defect, derived from evidence rather than general best practice. Not yet formally instantiated in EC-002 at time of writing (§19 lists only candidates); the resolved kitchen/venue/teppanyaki distinction in HV-IV-002 is the first evidence base strong enough to support one.

## Customer Intent

A specific thing a prospective guest is trying to accomplish (e.g. "find a teppanyaki restaurant open right now in Utrecht," "book an omakase experience"). HV-IV-004 surfaced a live example: Konnichiwa is recognized for omakase when asked about directly, but does not surface for the generic intent "omakase Utrecht" — two different intents with two different coverage outcomes for the same organization.

## Knowledge Asset

Content, a page, or structured data that closes an identified Evidence gap for a specific Intent (HV-P-004, Intent-Justified Assets). Must not be created merely because a keyword exists (EC-002 §21). Example candidate, not yet approved: a dedicated omakase page, justified by HV-IV-003's weak generic-search showing and HV-IV-004's finding that the current omakase mention has no price, session count, or booking path.

## Coverage Map

The blueprint (HV-VCM-00x) positioning Knowledge Assets against Intents and Evidence gaps. Not yet built for Konnichiwa — this is the "Not Yet Established" item in EC-002 §30 that RM-HV-001 exists to eventually support.

## Visibility Backlog

The prioritized, size-limited (≤5 for Small Enterprise Edition, HV-P-006) list of approved visibility actions.

## Validation

The post-implementation check confirming a Visibility Defect is actually closed — not just that a change was published. A failed validation reopens the defect and produces new Evidence, closing the loop.

---

# Traceability

## Parent Standard

HV-001 – HELIX Visibility Standard.

## Sibling Reference Models (planned)

RM-HV-002 – Evidence Flow. RM-HV-003 – Visibility Graph. RM-HV-004 – Intent Coverage. Each specializes one stage of the lifecycle diagrammed above; none are written yet.

## Reference Implementation

EC-002 – Engineering Organizational Visibility of Konnichiwa. Every example concept above is grounded in HV-IV-001 through HV-IV-004, not hypothetical.

---

# Revision Trigger

This Draft should be revised once a Coverage Map (HV-VCM-001) and a first Backlog exist for Konnichiwa — those will test whether the lifecycle diagrammed here actually holds under real prioritization and implementation, not just under investigation.
