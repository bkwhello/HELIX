# Capability.hsl.md

**HSL Object Type:** Capability
**Document ID:** HSL-CAP-001
**Object ID:** CAP-CORE-001
**Name:** Business Capability Standard
**Version:** 1.0.0
**Status:** Draft
**Owner:** ORG-001 (HELIX OS Foundation)
**Classification:** Core Standard

---

# 1. Purpose

This specification defines the Business Capability model used throughout HELIX OS.

A Business Capability represents **what** an organization must be able to do to achieve its mission.

Capabilities are independent of:

* organizational structure
* departments
* teams
* agents
* software
* vendors
* technologies

Capabilities are the most stable architectural building blocks within HELIX OS.

---

# 2. Definition

A Business Capability is a stable organizational ability that delivers measurable business value.

Examples include:

* Market Products
* Publish Content
* Conduct Research
* Manage Reservations
* Analyze Performance
* Process Payments
* Manage Customer Relationships

Capabilities describe **outcomes**, not activities.

---

# 3. Capability Hierarchy

Capabilities exist between the Organization and Domains.

```text
Organization
        ↓
Business Capability
        ↓
Business Domain
        ↓
Department
        ↓
Team
        ↓
Agent
        ↓
Workflow
        ↓
Implementation
```

A Capability may be implemented by one or more Domains.

A Domain may own one or more Capabilities.

---

# 4. Mission

Provide a stable, reusable, and technology-independent model for describing business value within HELIX OS.

Capabilities ensure that every implementation exists for a clear business purpose.

---

# 5. Scope

A Capability defines:

* Business value
* Desired outcomes
* Success metrics
* Ownership
* Interfaces
* Dependencies
* Constraints

A Capability does **not** define:

* AI prompts
* Workflows
* Teams
* Agents
* Software
* Implementation details

---

# 6. Universal Metadata

Every Capability specification SHALL include:

```yaml
id:
name:
domain:
owner:
version:
status:
classification:
created:
updated:
review_cycle:
```

---

# 7. Required Sections

Every Capability SHALL define:

## Identity

* Purpose
* Mission
* Business Value
* Scope

## Interfaces

* Inputs
* Outputs
* Consumers
* Providers

## Governance

* Owner
* Success Metrics
* Review Cycle
* Risks

## Relationships

* Parent Organization
* Owning Domain(s)
* Supporting Departments
* Supporting Teams
* Supporting Agents

---

# 8. Business Value

Every Capability must clearly answer:

* Why does this capability exist?
* Which business objective does it support?
* What measurable value does it create?
* Who benefits from it?

If these questions cannot be answered, the Capability should not exist.

---

# 9. Capability Ownership

Each Capability has one primary owner.

The owner is responsible for:

* maintaining the specification
* approving changes
* defining KPIs
* ensuring implementation quality
* coordinating dependent Domains

Ownership is never ambiguous.

---

# 10. Capability Interfaces

Every Capability must explicitly define:

### Inputs

Information or events required.

### Outputs

Deliverables produced.

### Consumers

Objects that use the outputs.

### Providers

Objects that supply required inputs.

Implicit dependencies are prohibited.

---

# 11. Capability KPIs

Every Capability must define measurable success.

Examples:

* Time saved
* Revenue influenced
* Conversion rate
* Customer satisfaction
* Quality score
* Automation rate
* Accuracy
* Completion rate
* Business impact

KPIs should measure outcomes rather than activity.

---

# 12. Constraints

Capabilities may define:

* Business constraints
* Regulatory requirements
* Security requirements
* Privacy requirements
* Performance targets

Constraints apply to every implementation.

---

# 13. Traceability

Every implementation must trace back to exactly one Capability.

Example:

```text
CAP-MKT-001
        ↓
DOM-MKT-001
        ↓
DEP-SOC-001
        ↓
TEAM-PLAN-001
        ↓
AGT-PLAN-001
        ↓
WF-CONTENT-001
```

Traceability must be preserved throughout the lifecycle.

---

# 14. Lifecycle

Capabilities follow the HELIX lifecycle:

Draft

↓

Review

↓

Approved

↓

Implemented

↓

Production

↓

Observed

↓

Improved

↓

Deprecated

↓

Archived

Capabilities generally evolve slowly and should remain stable over time.

---

# 15. Design Principles

A Capability should be:

* Stable
* Measurable
* Vendor-neutral
* Technology-independent
* Reusable
* Understandable
* Valuable
* Modular

Capabilities should outlive organizational restructures and technology changes.

---

# 16. Example

**Capability:** Publish Social Content

Business Value:

Enable the organization to consistently publish high-quality content across supported social platforms.

Possible Implementation:

* Marketing Domain
* Social Media Department
* Publishing Team
* Instagram Publisher Agent
* LinkedIn Publisher Agent
* TikTok Publisher Agent

The Capability remains the same even if the implementation changes.

---

# 17. Definition of Done

A Capability is complete when:

* Business value is documented.
* Scope is defined.
* Ownership is assigned.
* Interfaces are documented.
* KPIs are established.
* Constraints are identified.
* Traceability is established.
* Supporting implementations are identified.

---

# 18. Guiding Principle

> Capabilities define **what** the business must achieve.

> Domains organize **who** is responsible.

> Departments coordinate **how** work is managed.

> Teams organize **how** work is executed.

> Agents perform the work.

This separation of concerns is fundamental to HELIX OS.

---

# 19. Object ID standard (HOIS)

ORG    Organization

CAP    Business Capability

DOM    Business Domain

DEP    Department

TEAM   Team

AGT    Agent

WF     Workflow

KN     Knowledge

MEM    Memory

INT    Integration

TMP    Template

POL    Policy

EVA    Evaluation

TEST   Test

PRM    Prompt