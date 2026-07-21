# PS-001 — HELIX Product Architecture Standard

## Metadata

```yaml
artifact_id: PS-001
title: HELIX Product Architecture Standard
artifact_type: Standard
version: 0.1.0
status: Draft
owner: Principal HELIX Architect
```

---

# Purpose

PS-001 defines the minimum architectural structure required for products developed within the HELIX ecosystem.

The standard ensures that products remain:

- understandable;
- independently maintainable;
- interoperable;
- replaceable;
- reusable;
- consistent with the HELIX platform.

This standard defines minimum boundaries.

It does not require unnecessary documentation, services, or abstractions.

---

# Applicability

PS-001 applies to every independently developed HELIX product.

Examples include:

- Reservations
- Point of Sale
- Customer Relationship Management
- Inventory
- Purchasing
- Staff Scheduling
- Marketing
- Loyalty
- Reporting
- Finance
- AI Assistance

---

# Product Definition

A HELIX Product is a deployable or independently usable solution that delivers one or more organizational capabilities to a defined group of users.

A product may include:

- software;
- workflows;
- interfaces;
- integrations;
- automation;
- operational rules;
- preserved domain knowledge.

A product is not merely a code repository or technical module.

---

# Core Product Principles

## PS-P-001 — Capability Ownership

Every product shall identify the organizational capability it owns.

---

## PS-P-002 — Clear Boundary

Every product shall define what it owns and what it does not own.

---

## PS-P-003 — Independent Evolution

A product should be capable of evolving without requiring unrelated products to change.

---

## PS-P-004 — Platform Reuse

Shared technical services should be obtained from the HELIX Platform where practical.

---

## PS-P-005 — Domain Ownership

A product owns the business rules and domain concepts belonging specifically to its capability.

---

## PS-P-006 — Explicit Data Ownership

Every important data object shall have one clearly identified owning product or platform service.

---

## PS-P-007 — Replaceable Integrations

External systems shall be connected through replaceable integration boundaries.

---

## PS-P-008 — Incremental Delivery

A product shall be deliverable in usable increments.

---

## PS-P-009 — Operational Validation

Product behavior shall be validated through real operational use where practical.

---

## PS-P-010 — Proportional Documentation

Documentation shall be proportional to risk, complexity, expected reuse, and difficulty of reversal.

---

# Required Product Structure

Each product shall contain the following minimum structure:

```text
products/
└── <product-name>/
    ├── README.md
    ├── product.md
    ├── domain/
    ├── architecture/
    ├── integrations/
    ├── implementation/
    ├── tests/
    └── docs/
```

Additional folders may be added when earned by actual requirements.

---

# Required Files

## README.md

Provides a brief entry point to the product.

It should identify:

- product name;
- current status;
- primary capability;
- target users;
- how to run or access the product;
- links to important documents.

---

## product.md

Defines the product intent.

It should include:

- product vision;
- capability goal;
- target users;
- core problems;
- scope;
- exclusions;
- success criteria;
- current roadmap.

---

# Domain Structure

```text
domain/
├── domain-model.md
├── business-rules.md
└── terminology.md
```

Only create files that contain useful information.

## domain-model.md

Defines the main business concepts and their relationships.

## business-rules.md

Defines rules owned by the product.

## terminology.md

Defines product-specific language where ambiguity exists.

---

# Architecture Structure

```text
architecture/
├── current-state.md
├── target-architecture.md
├── decisions/
└── diagrams/
```

## current-state.md

Describes the existing operational and technical situation when relevant.

## target-architecture.md

Describes the intended architecture.

## decisions/

Contains significant product-level architecture decisions.

Only decisions that are costly, risky, foundational, or difficult to reverse need formal records.

## diagrams/

Contains useful architecture or workflow diagrams.

Diagrams shall not be created solely for completeness.

---

# Integration Structure

```text
integrations/
├── README.md
└── <external-system>/
```

Each external integration should define:

- purpose;
- external system;
- owned data;
- direction of data flow;
- identity mapping;
- synchronization behavior;
- failure handling;
- known limitations.

External platform identifiers shall not replace internal product identifiers.

---

# Implementation Structure

```text
implementation/
├── apps/
├── services/
├── packages/
├── database/
└── infrastructure/
```

This structure is optional and may be adapted to the selected technology.

Technical structure shall follow the needs of the implementation rather than the appearance of completeness.

---

# Testing Structure

```text
tests/
├── unit/
├── integration/
├── end-to-end/
└── operational/
```

Testing depth shall be proportional to product risk.

Operational testing may include:

- staff trials;
- real workflow validation;
- pilot deployments;
- observed service use;
- failure simulations.

---

# Product Boundary

Every product shall identify:

```yaml
owns:
  - capabilities
  - domain_concepts
  - business_rules
  - authoritative_data

uses:
  - platform_services
  - shared_components
  - external_integrations

does_not_own:
  - unrelated_business_domains
```

---

# Product-to-Platform Relationship

Products may use shared platform capabilities including:

- Identity
- Authentication
- Organizations
- Users
- Permissions
- Notifications
- Messaging
- Audit History
- Integration Infrastructure
- Analytics
- AI Services
- Configuration

Products shall not duplicate platform capabilities without an explicit reason.

---

# Product-to-Product Relationship

Products should communicate through explicit interfaces.

A product shall not directly depend upon another product’s private implementation or database structure.

Preferred communication forms include:

- API contracts;
- events;
- shared identifiers;
- controlled read models;
- platform-mediated integration.

---

# Data Ownership

Each important business object shall have one authoritative owner.

Examples:

```text
Reservation
Owned by Reservations

Transaction
Owned by Point of Sale

Guest Profile
Owned by CRM or designated Guest Platform service

Stock Item
Owned by Inventory

Marketing Campaign
Owned by Marketing
```

Other products may reference or consume the object but shall not create conflicting authoritative versions.

---

# Product Identity

Each product shall have a stable product identifier.

Example:

```yaml
product_id: PRD-RES
product_name: HELIX Reservations
```

The product identifier shall remain stable even when the display name changes.

---

# Product Status

A product may have one of the following states:

- Concept
- Prototype
- Pilot
- Active
- Mature
- Deprecated
- Retired

A product state does not imply approval or technical quality by itself.

---

# Minimum Definition of Ready

A product increment is ready for implementation when the following are sufficiently clear:

- capability goal;
- target user;
- problem being solved;
- owned concepts;
- required behavior;
- dependencies;
- acceptance criteria;
- important unknowns.

Not every detail must be known before implementation starts.

Unknowns that can be resolved safely through testing should remain experimental.

---

# Minimum Definition of Done

A product increment is complete when:

- intended behavior works;
- acceptance criteria are met;
- critical tests pass;
- important operational risks are addressed;
- the increment is usable by its intended user;
- meaningful learning is recorded;
- unresolved limitations are visible.

---

# Prohibited Patterns

The following should be avoided:

- building shared platform services before a second real product needs them;
- creating microservices without operational justification;
- duplicating authoritative data ownership;
- coupling product identity to external platforms;
- creating documentation with no identified user;
- building for hypothetical scale without evidence;
- exposing HELIX foundation complexity to operational users;
- forcing every product to use identical internal technology.

---

# Conformance

A product conforms to PS-001 when:

1. Its capability and boundary are explicit.
2. Its important domain concepts are identified.
3. Its authoritative data ownership is clear.
4. Its external integrations remain replaceable.
5. Its implementation is independently maintainable.
6. Its documentation is sufficient for implementation and operation.
7. It delivers incremental operational value.

---

# Proportional Application

Small prototypes may use a reduced structure:

```text
products/
└── <product-name>/
    ├── README.md
    ├── product.md
    ├── domain-model.md
    └── prototype/
```

The full structure is introduced only when product complexity requires it.

---

# Conclusion

PS-001 establishes a common product architecture for the HELIX ecosystem.

It protects consistency and interoperability while preserving product independence, implementation flexibility, and proportional engineering.