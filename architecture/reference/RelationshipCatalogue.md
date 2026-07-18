

# Relationship Catalogue

Status: Release Candidate

Version: 0.1

Phase: II – Organizational Ontology

Classification: Reference Catalogue


---

## Validation Status

The existence of Organizational Relationships has been validated through Engineering Investigation EI-013.

The specific relationship types contained within this catalogue remain subject to individual engineering validation.

---

# Purpose

Define the official relationships that may exist between HELIX organizational concepts.

The Relationship Catalogue provides a standardized semantic vocabulary for expressing how organizational concepts interact.

All future HELIX reference models, specifications, standards and capabilities shall use relationships defined within this catalogue.

---

# Design Principles

Relationships shall:

- express organizational meaning
- be implementation independent
- have one clear semantic interpretation
- avoid ambiguity
- be reusable across capabilities
- remain technology independent

---

# Relationship Categories

Relationships are grouped into semantic categories.

## Direction Relationships

Describe intentional organizational direction.

### drives

Purpose drives Organizational Capability.

---

### enables

Capability enables organizational work.

Outcome enables Learning.

---

### improves

Learning improves:

- Knowledge Assets
- Capabilities
- Governance
- Future Outcomes

---

## Responsibility Relationships

Describe responsibility.

### exercises

Organizational Actor exercises Organizational Capability.

---

### performs

Organizational Actor performs organizational work.

---

### governs

Governance governs Organizational Concepts.

Knowledge Governance governs Knowledge Assets.

---

### owns

The Organization owns Organizational Capabilities.

The Organization owns Organizational Objects.

Ownership does not imply execution.

---

## Transformation Relationships

Describe organizational change.

### transforms

Actors transform Work Objects.

---

### produces

Work Objects produce Outcomes.

---

### progresses

Work Objects progress through organizational states.

---

### preserves

Knowledge Assets preserve organizational knowledge.

---

## Guidance Relationships

Describe organizational guidance.

### guides

Knowledge Assets guide:

- Actors
- Capabilities
- Work Objects
- Governance
- Decisions

---

### constrains

Governance constrains organizational behavior.

Policies constrain Actors.

Rules constrain Capabilities.

---

### authorizes

Governance authorizes Actors to exercise Capabilities.

---

## Structural Relationships

Describe organizational structure.

### contains

Organizations contain:

- Actors
- Organizational Objects
- Capabilities

---

### specializes

Knowledge Asset specializes Organizational Object.

Work Object specializes Organizational Object.

---

### connects

Relationships connect Organizational Concepts.

---

### references

Knowledge Assets reference other Knowledge Assets.

Work Objects reference Knowledge Assets.

Capabilities reference Knowledge Assets.

---

### depends on

Capabilities depend on Knowledge Assets.

Actors depend on Capabilities.

Learning depends on Outcomes.

---

## Classification Relationships

Describe conceptual classification.

### classifies

Modes of Work classify organizational activity.

---

### categorizes

Knowledge Assets categorize organizational knowledge.

---

# Canonical Relationship Table

| Relationship | Meaning |
|--------------|---------|
| drives | Provides direction |
| enables | Makes possible |
| improves | Increases capability or quality |
| exercises | Applies capability |
| performs | Executes work |
| governs | Controls organizational behavior |
| owns | Possesses organizational responsibility |
| transforms | Changes organizational state |
| produces | Creates an outcome |
| progresses | Moves through lifecycle states |
| preserves | Maintains organizational knowledge |
| guides | Directs organizational behavior |
| constrains | Limits permitted behavior |
| authorizes | Grants permission |
| contains | Includes organizational concepts |
| specializes | Creates subtype relationship |
| connects | Establishes semantic relationship |
| references | Creates traceable dependency |
| depends on | Requires another concept |
| classifies | Places into organizational mode |
| categorizes | Groups organizational concepts |

---

# Naming Rules

Relationships shall:

- use present tense verbs
- express one semantic meaning
- remain implementation independent
- avoid technical terminology
- avoid database terminology
- avoid software-specific terminology

Example:

Correct

Actor exercises Capability

Incorrect

Actor executes Function

---

# Architectural Constraints

No specification shall introduce new relationship types without architectural validation.

Every new relationship shall:

- have one meaning
- belong to exactly one semantic category
- be reusable across HELIX
- be approved through the architectural review process

---

# Relationship Lifecycle

Candidate

↓

Architectural Review

↓

Reference Relationship

↓

Approved Relationship

↓

Standard Relationship

---

# References

AO-001 – HELIX Organizational Ontology

RM-001 – HELIX Organizational Reference Model

---

# Continues With

ArchitecturalPrinciples.md

## Governance Relationships

The existence of Organizational Governance has been validated.

Specific governance relationship types remain subject to future Engineering Investigations.