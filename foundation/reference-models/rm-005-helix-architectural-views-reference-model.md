# RM-005 — HELIX Architectural Views Reference Model

## Metadata

```yaml
artifact_id: RM-005
title: HELIX Architectural Views Reference Model
artifact_type: Reference Model
version: 0.1.0
status: Draft

parent:
  - RM-001

related:
  - RM-002
  - RM-004
  - CA-001
```

---

# Purpose

RM-005 defines the three architectural views through which HELIX describes a solution: Structural, Behavioral, and Operational.

Each view answers a different engineering question about the same solution. No view is complete on its own, and no artifact should mix the concerns of more than one view without an explicit reason.

RM-005 is descriptive. It does not define how each view's artifacts are authored, validated, or governed — those responsibilities belong to the standards that govern each artifact type (for example CA-001 for capability artifacts).

---

# Engineering Question

> What are the stable ways of looking at a HELIX solution, and what does each view own?

---

# The Three Architectural Views

## Structural Architecture

Defines the stable solution composition:

- domains;
- capabilities;
- concepts;
- ownership boundaries.

Structural Architecture answers: *what exists, and who owns it?*

It changes slowly. A capability's structural position (its domain, its identity, its ownership boundary) should remain stable across many iterations of its behavior.

---

## Behavioral Architecture

Defines capability behavior:

- state;
- rules;
- events;
- interactions;
- acceptance.

Behavioral Architecture answers: *how does this capability behave, and how do we know it behaves correctly?*

It changes as understanding of the capability deepens. A capability's state model, rule model, event model, interaction model, and acceptance model together form its Behavioral Architecture.

---

## Operational Architecture

Defines how capabilities participate in real work:

- workflows;
- procedures;
- roles;
- dashboards;
- operational controls;
- engineering cases.

Operational Architecture answers: *how does this capability show up in the daily work of the organization?*

It changes as the organization's operational practice evolves, independently of whether the underlying capability's structure or behavior has changed.

---

# Relationship Between the Views

```text
Structural Architecture
        ↓ (gives capabilities a stable identity to behave within)
Behavioral Architecture
        ↓ (gives behavior a way to participate in real work)
Operational Architecture
```

The arrow describes dependency of meaning, not a required build order. A capability may have a fully designed Behavioral Architecture before its Operational Architecture is engineered, and it may remain in that state indefinitely.

---

# Placement Principle

Every HELIX artifact belongs to exactly one architectural view.

An artifact that appears to require two views is a signal that it should be split, not that the views should be merged. For example, a capability's `capability.md` and `state-model.md` belong to Structural and Behavioral Architecture respectively — mixing operational workflow detail into either file would violate this principle.

---

# Relationship to Implementation Architecture

RM-005 defines how a solution is architected, independent of how it is implemented in code.

The mapping from these three views onto an actual technology implementation is a distinct concern, governed separately once a capability has been implemented and that mapping has been observed — not designed in advance. See CA-001 §54 (Implementation Traceability) and the future EA-001.

---

# References

- RM-001 — HELIX Organizational Reference Model
- RM-002 — HELIX Repository Reference Model
- RM-004 — HELIX Organizational Engineering Knowledge Reference Model
- CA-001 — Capability Architecture Standard
