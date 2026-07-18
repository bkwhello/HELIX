# ADR-001 – Reference Artifacts Shall Not Introduce New Knowledge

Status: Accepted

Version: 1.0

Date: YYYY-MM-DD

Classification: Architecture Decision Record

---

# Context

As HELIX evolved from Engineering Investigations toward Reference Architecture, a distinction emerged between discovering architectural knowledge and documenting validated architectural knowledge.

Reference artifacts such as Ontologies, Reference Models, Specifications, and Standards serve as authoritative descriptions of HELIX architecture.

During engineering discussions it became clear that these artifacts must never become sources of new architectural knowledge.

Instead, they must faithfully represent knowledge that has already been validated through the HELIX Engineering Method.

---

# Decision

Reference artifacts shall consolidate validated architectural knowledge.

Reference artifacts shall not introduce:

- new concepts
- new relationships
- new architectural principles
- new organizational assumptions

Every architectural statement appearing in a reference artifact shall be traceable to one or more completed Engineering Investigations or accepted Architecture Decision Records.

---

# Rationale

Separating discovery from documentation protects HELIX from architectural drift.

Engineering Investigations exist to discover organizational truth.

Reference artifacts exist to preserve organizational truth.

Mixing these responsibilities weakens confidence, traceability, and future architectural evolution.

---

# Consequences

Positive

- Clear separation between engineering and architecture.
- Complete traceability from architecture back to evidence.
- Improved consistency across Specifications and Standards.
- Architectural integrity preserved over time.

Trade-offs

- Architectural documents may remain incomplete while investigations continue.
- Additional engineering effort is required before new concepts enter the Reference Architecture.

These trade-offs are accepted in favor of long-term architectural quality.

---

# Architectural Impact

This decision governs the creation and maintenance of:

- AO – Organizational Ontologies
- RM – Reference Models
- Specifications
- Standards

Reference artifacts become repositories of validated architectural knowledge rather than sources of architectural innovation.

---

# Engineering Impact

Engineering Investigations become the exclusive mechanism through which new architectural knowledge enters HELIX.

The engineering workflow becomes:

Observation

↓

Engineering Investigation

↓

Architectural Discovery

↓

Architectural Validation

↓

Architectural Evidence Review

↓

Architecture Decision Record

↓

Reference Architecture

↓

Specification

↓

Standard

↓

Foundation

---

# Alternatives Considered

## Alternative 1

Allow Reference Artifacts to introduce architectural concepts.

Rejected.

Reason:

This blurs the distinction between engineering and architecture.

---

## Alternative 2

Permit architectural judgment during documentation.

Rejected.

Reason:

Architectural judgment does not provide traceable engineering evidence.

---

## Alternative 3

Restrict Reference Artifacts to validated knowledge.

Accepted.

Reason:

Maintains architectural integrity while preserving engineering traceability.

---

# Compliance

Every architectural statement contained within a Reference Artifact shall be supported by:

- one or more completed Engineering Investigations, and/or
- one or more accepted Architecture Decision Records.

Unsupported statements shall be removed or returned to Engineering Investigation.

---

# References

EM-001 – HELIX Engineering Method

AO-001 – Organizational Ontology

RM-001 – Organizational Reference Model

---

# Status

Accepted

Effective immediately for all HELIX engineering work.