# EC-002 – Engineering Organizational Visibility of Konnichiwa

## Status

Open

## Case Type

Real-World Engineering Case

## Engineering Discipline

HELIX Visibility

## Edition

Small Enterprise Edition

## Organization

Konnichiwa

## Current Stage

Case Establishment

---

## 1. Case Identity

**Case ID:** EC-002
**Case Title:** Engineering Organizational Visibility of Konnichiwa
**Organization:** Konnichiwa
**Discipline:** HELIX Visibility
**Edition:** Small Enterprise
**Status:** Open
**Current Stage:** Case Establishment

---

## 2. Purpose

This engineering case establishes, investigates, designs, implements, and validates the organizational visibility capability of Konnichiwa.

The case will determine how Konnichiwa is represented, discovered, understood, trusted, recommended, and selected across search engines, AI systems, maps, review platforms, reservation platforms, directories, social platforms, and other external visibility systems.

Konnichiwa will serve as the first real-world reference implementation of the HELIX Visibility Small Enterprise Edition.

The case is intended to produce both:

1. A measurable visibility improvement for Konnichiwa.
2. Evidence that HELIX can systematically engineer organizational visibility as a reusable capability.

---

## 3. Engineering Question

> How can Konnichiwa engineer its external organizational knowledge so that independent search platforms, AI systems, recommendation systems, and customers consistently discover, understand, trust, recommend, and select the restaurant for relevant dining intents?

---

## 4. Case Objective

The objective of EC-002 is to establish an accurate, coherent, authoritative, accessible, and continuously maintained external representation of Konnichiwa.

The case must produce evidence that Konnichiwa can improve its visibility through a controlled engineering process rather than through disconnected marketing activities.

The intended outcome is that relevant external systems can correctly determine:

* What Konnichiwa is.
* Where Konnichiwa is located.
* Which cuisine and dining experiences Konnichiwa offers.
* Which customer intents Konnichiwa is suitable for.
* Why Konnichiwa is credible.
* How a customer can reserve or contact the restaurant.
* Whether Konnichiwa should be recommended in a given context.

---

## 5. Reference Implementation Role

Konnichiwa is the first reference implementation of HELIX Visibility.

The organization is classified as a small enterprise.

This classification is a binding architectural constraint.

The implementation must therefore:

* Remain operable without a dedicated visibility department.
* Produce clear operational value.
* Avoid unnecessary enterprise complexity.
* Prioritize the highest-impact visibility work.
* Use automation where it reduces recurring workload.
* Keep human approval over external publication and system changes.
* Remain understandable to the owner and operating team.
* Be reusable for other small enterprises.

The Small Enterprise Edition may simplify implementation depth, automation, governance, and scale.

It may not weaken the core engineering principles of HELIX Visibility.

---

## 6. Explicit Boundaries

### 6.1 Included

This case includes:

* Konnichiwa’s website.
* Existing landing pages.
* Future landing pages where justified by visibility evidence.
* Search-engine representation.
* AI-system representation.
* Google Business Profile.
* Google Maps.
* Review platforms.
* Reservation platforms.
* Relevant business directories.
* Social profiles that contribute visibility evidence.
* Menus and menu representations.
* Structured data.
* Entity representation.
* Internal linking.
* External mentions.
* Press and media references.
* Customer reviews.
* Visual evidence.
* Local search visibility.
* AI recommendation visibility.
* Visibility measurement.
* Visibility validation.
* Visibility maintenance.
* Content and knowledge assets required to close validated visibility gaps.

### 6.2 Excluded

This case does not directly govern:

* Paid advertising campaign execution.
* General social-media publishing operations.
* Graphic identity redesign.
* Restaurant operational redesign.
* Menu engineering unrelated to visibility.
* Reservation operations governed by EC-001.
* Point-of-sale development.
* Unrelated marketing campaigns.
* Sales execution.
* Changes to external systems without explicit approval.

Excluded activities may become supporting dependencies when required by an approved visibility design.

---

## 7. Architectural Constraint

Konnichiwa operates under the HELIX Small Enterprise model.

The following rule applies:

> Every visibility capability must provide measurable value without requiring a dedicated visibility team.

The following additional rule applies:

> Landing pages, knowledge assets, structured data, external listings, reviews, and other visibility interventions may be created or changed when engineering evidence shows that they close a meaningful visibility gap.

The Small Enterprise classification must not be used as a reason to avoid high-impact implementation work.

It is a constraint on complexity, not on ambition or quality.

---

## 8. Lifecycle Scope

The case follows the HELIX Organizational Engineering lifecycle.

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

The current stage is:

**Case Establishment**

No visibility design or implementation decision is considered earned until supported by evidence produced through the case.

---

## 9. Initial Case Hypothesis

The initial case hypothesis is:

> Konnichiwa’s external visibility can be materially improved by engineering a coherent evidence system that accurately represents the organization, strengthens machine understanding, covers relevant customer intents, increases corroboration, and reduces contradiction across visibility systems.

This hypothesis is unvalidated.

It must be challenged through observation, external testing, evidence collection, and measurable implementation results.

---

## 10. Initial Problem Statement

Konnichiwa currently exists across multiple external representations, including its website, Google, reservation platforms, review platforms, social platforms, menus, directories, and third-party references.

It has not yet been established whether these representations collectively create:

* A complete understanding of the organization.
* A consistent organizational identity.
* Strong association with its intended dining categories.
* Sufficient authority for AI recommendations.
* Sufficient coverage of high-value customer intents.
* Accurate representation across all major platforms.
* A traceable path from organizational reality to external recommendation.

The organization may therefore be visible in some systems while remaining misunderstood, weakly represented, inconsistently described, or absent from relevant recommendation contexts.

---

## 11. Initial Observed Conditions

The following conditions are currently known or provisionally observed.

### EC-002-O-001 – Existing Website Presence

Konnichiwa operates a public website containing information about the restaurant, menus, dining experiences, reservations, workshops, arrangements, catering, takeaway or delivery, and related services.

The completeness, consistency, authority, technical accessibility, structured-data quality, and AI interpretability of the website have not yet been validated under HELIX Visibility.

**Status:** Partially validated, via HV-IV-001, HV-IV-002, HV-IV-004
**Validation state:** Partial — see breakdown below

* Completeness: largely confirmed — address, phone, hours, cuisine, services all present and owner-confirmed (HV-IV-002). Omakase is present but under-specified (no page, price, session count, or direct booking — HV-IV-004).
* Consistency: initially assumed sufficient, but investigation found the published hours describe the sushi kitchen specifically, not the venue or teppanyaki, which run different schedules — corrected in HV-IV-002 (EV-010).
* Authority: high for the site itself; undermined externally by three different name spellings across third-party listings ("Konnichiwa," "Konnichi Wa," "Konichiwa" — HV-IV-001, HV-IV-003).
* Structured data: **confirmed absent**, not yet closed — HV-IV-001 finding stands; a proposal exists (`structured-data-website.md`) but is not implemented.
* AI interpretability: **confirmed weak** — none of four tested AI systems (HV-IV-004) returned fully correct opening hours, most likely downstream of the missing structured data and the kitchen/venue hours ambiguity above.

Remains open: this observation is not fully closed. The structured-data gap and the AI-hours inaccuracy are diagnosed but not yet remediated.

---

### EC-002-O-002 – Multiple Visibility Channels

Konnichiwa is represented across multiple external systems, which may include:

* Google Search.
* Google Maps.
* Google Business Profile.
* Guestplan.
* TheFork.
* Tripadvisor.
* Social-media platforms.
* Business directories.
* Review platforms.
* Third-party websites.
* Press or media sources.

The authoritative status, accuracy, consistency, freshness, and completeness of these representations have not yet been established.

**Status:** Provisional observation
**Validation state:** Not validated

---

### EC-002-O-003 – Existing Search-Oriented Landing Pages

Konnichiwa has created or planned landing pages for search intents including:

* Sushi Utrecht.
* Japans restaurant Utrecht.
* Sushi afhalen Utrecht.
* Sushi bezorgen Utrecht.
* Sushi bestellen Utrecht.
* Sushi in English.
* Arrangements.
* Sushi workshops.
* Catering.
* Lunch.

It has not yet been established whether these pages:

* Match active customer intents.
* Strengthen the intended Konnichiwa entity.
* Avoid internal duplication.
* Support AI understanding.
* Contain sufficient evidence.
* Produce measurable visibility improvement.
* Fit the current strategic positioning of the restaurant.

**Update (HV-IV-007, 22 juli 2026):** Verified against the live sitemap. Sushi Utrecht, Japans restaurant Utrecht, Sushi afhalen Utrecht, Sushi bezorgen Utrecht, Arrangements, Sushi workshops, Catering, and Lunch (as `/bento-lunch/`) all exist and are substantial, not thin (spot-checked `/sushi-utrecht/`: ~800–1000 words, dedicated headings). "Sushi bestellen Utrecht" and "Sushi in English" do not exist as dedicated pages. Internal duplication **confirmed, not avoided**: `/sushi-page-2/` is a live, broken-titled duplicate ("Sushi Page @") largely mirroring the homepage. AI/machine understanding is undermined site-wide by a separate, more severe finding: both menus are hosted as non-crawlable Adobe InDesign viewers (see HV-IV-007, EC-002-VD-008 Machine Accessibility Failure).

**Status:** Observed
**Validation state:** Not validated

---

### EC-002-O-004 – Premium Positioning

Konnichiwa intends to be understood as a premium Japanese dining destination in Utrecht.

Relevant concepts may include:

* Teppanyaki.
* Sushi.
* Izakaya.
* Omakase.
* A5 Wagyu.
* Lobster.
* Toro.
* Private dining.
* Business dining.
* Japanese hospitality.
* Omotenashi.
* Premium dining experiences.

It has not yet been established whether external systems consistently associate these concepts with Konnichiwa.

**Status:** Provisional organizational claim
**Validation state:** Not validated

---

### EC-002-O-005 – AI Recommendation Opportunity

Potential customers increasingly use generative AI and answer engines to discover and compare restaurants.

Relevant systems may include:

* ChatGPT.
* Gemini.
* Perplexity.
* Google AI systems.
* Voice assistants.
* Other recommendation systems.

The current probability that Konnichiwa is accurately identified or recommended by these systems has not yet been measured.

**Status:** External condition
**Validation state:** Investigation required

---

### EC-002-O-006 – Limited Organizational Capacity

Konnichiwa is a small organization with limited time and personnel available for visibility work.

Any designed capability must therefore:

* Minimize recurring manual work.
* Produce prioritized actions.
* Avoid unnecessary dashboards.
* Avoid excessive reporting.
* Support owner-level understanding.
* Maintain human control over publication and external changes.

**Status:** Confirmed architectural constraint
**Validation state:** Accepted

---

## 12. Initial Visibility Intents

The following intents are candidate visibility intents.

They are not yet approved as final targets.

### 12.1 Identity Intents

* Konnichiwa Utrecht.
* Konnichiwa restaurant.
* Konnichiwa menu.
* Konnichiwa opening hours.
* Konnichiwa reservation.
* Konnichiwa contact.

### 12.2 Cuisine Intents

* Japanese restaurant Utrecht.
* Sushi Utrecht.
* Teppanyaki Utrecht.
* Omakase Utrecht.
* Izakaya Utrecht.
* Premium Japanese restaurant Utrecht.

### 12.3 Occasion Intents

* Romantic restaurant Utrecht.
* Japanese restaurant for a date.
* Business dinner Utrecht.
* Birthday dinner Utrecht.
* Private dining Utrecht.
* Group dinner Utrecht.
* Special occasion restaurant Utrecht.

### 12.4 Experience Intents

* Teppanyaki experience Utrecht.
* Japanese fine dining Utrecht.
* Chef experience Utrecht.
* Live cooking restaurant Utrecht.
* Luxury sushi Utrecht.
* Japanese tasting menu Utrecht.

### 12.5 Transactional Intents

* Reserve Japanese restaurant Utrecht.
* Book teppanyaki Utrecht.
* Book sushi restaurant Utrecht.
* Order sushi Utrecht.
* Sushi takeaway Utrecht.
* Sushi delivery Utrecht.
* Buy restaurant gift card Utrecht.
* Book sushi workshop Utrecht.

### 12.6 Informational Intents

* What is teppanyaki?
* What is omakase?
* What is izakaya?
* What is toro?
* What is A5 Wagyu?
* Difference between sushi and sashimi.
* Japanese dining etiquette.
* Sake pairing with sushi.

Each candidate intent must be evaluated against:

* Organizational reality.
* Strategic relevance.
* Search and customer demand.
* Existing evidence.
* Competitive conditions.
* Expected business value.
* Implementation cost.
* Measurement feasibility.

---

## 13. Initial Work Objects

### EC-002-WO-001 – Organizational Reality Register

The authoritative record of visibility-relevant facts about Konnichiwa.

Candidate contents include:

* Official business name.
* Location.
* Contact details.
* Opening hours.
* Cuisine.
* Services.
* Dining experiences.
* Reservation methods.
* Menu categories.
* Price positioning.
* Accessibility.
* Dietary accommodations.
* Ownership and chef identity.
* Brand philosophy.
* Photographic identity.
* Strategic market position.

**Status:** Proposed

---

### EC-002-WO-002 – Visibility Source Register

A controlled register of all systems and sources representing Konnichiwa.

Candidate fields include:

* Source name.
* Source type.
* URL or identifier.
* Ownership.
* Access status.
* Published facts.
* Last validation date.
* Accuracy status.
* Freshness status.
* Authority level.
* Update method.
* Operational owner.

**Status:** Proposed

---

### EC-002-WO-003 – Visibility Coverage Map

A map connecting customer intent to required organizational knowledge, supporting evidence, current assets, evidence gaps, and proposed engineering actions.

Canonical flow:

```text
Customer Intent
      ↓
Required Knowledge
      ↓
Required Claims
      ↓
Required Evidence
      ↓
Existing Assets
      ↓
Coverage Assessment
      ↓
Engineering Action
```

**Status:** Proposed
**Role:** Primary blueprint work object

---

### EC-002-WO-004 – HELIX Visibility Graph

A structured model of Konnichiwa’s visibility-relevant entities, attributes, claims, relationships, and supporting evidence.

Candidate entities include:

* Konnichiwa.
* Utrecht.
* Japanese cuisine.
* Teppanyaki.
* Sushi.
* Izakaya.
* Omakase.
* Private dining.
* Business dining.
* Chef Kelvin Wong.
* A5 Wagyu.
* Toro.
* Lobster.
* Guestplan.
* Sushi workshop.
* Catering.
* Gift cards.

**Status:** Proposed

---

### EC-002-WO-005 – Knowledge Asset

Any controlled asset created to represent organizational knowledge.

Examples:

* Landing page.
* Service page.
* FAQ.
* Article.
* Menu.
* Structured-data object.
* Photograph.
* Video.
* Press page.
* Chef profile.
* Location page.
* Event page.
* Reservation page.

**Status:** Proposed

---

### EC-002-WO-006 – Evidence Object

Any observable item that supports, weakens, contradicts, or contextualizes a visibility claim.

Examples:

* Customer review.
* Website statement.
* Photograph.
* Menu item.
* Structured-data statement.
* Google listing.
* Reservation platform entry.
* Press mention.
* Directory listing.
* Independent article.
* AI answer.
* Search result.
* Map result.

**Status:** Proposed

---

### EC-002-WO-007 – Visibility Test Scenario

A controlled test used to determine how a visibility system understands or recommends Konnichiwa for a defined intent.

Candidate fields include:

* Test ID.
* Intent.
* Query.
* System.
* Location context.
* Language.
* Date.
* Result.
* Mention status.
* Recommendation rank.
* Factual accuracy.
* Positioning accuracy.
* Competitors mentioned.
* Evidence cited.
* Interpretation.
* Reproducibility.

**Status:** Proposed

---

### EC-002-WO-008 – Visibility Backlog

The ordered set of approved engineering actions derived from observed visibility gaps.

Each item must include:

* Gap.
* Supporting evidence.
* Intended improvement.
* Affected intent.
* Affected entity.
* Required asset or change.
* Priority.
* Effort.
* Risk.
* Owner.
* Validation method.
* Approval state.
* Implementation state.

**Status:** Proposed

---

## 14. Initial Engineering Roles

The Small Enterprise Edition will use a lean role model.

Roles may be performed by humans, AI systems, or combined human-AI workflows.

### 14.1 Case Owner

**Role holder:** Konnichiwa owner

Responsibilities:

* Confirm organizational reality.
* Approve priorities.
* Approve external publication.
* Approve external system changes.
* Confirm business relevance.
* Resolve organizational disputes.
* Accept or reject final outcomes.

---

### 14.2 Chief Visibility Engineer

Responsibilities:

* Govern EC-002.
* Maintain architectural consistency.
* Coordinate investigations.
* Protect traceability.
* Approve progression between lifecycle stages.
* Ensure evidence precedes design.
* Maintain alignment with HELIX.

Candidate primary system:

* ChatGPT.

---

### 14.3 Visibility Architect

Responsibilities:

* Create the Visibility Coverage Map.
* Create the Visibility Graph.
* Define the intent architecture.
* Define the information architecture.
* Identify required knowledge assets.
* Produce the visibility blueprint.
* Create the prioritized engineering backlog.

Candidate primary system:

* ChatGPT.

---

### 14.4 Research and Evidence Engineer

Responsibilities:

* Research public visibility conditions.
* Identify external sources.
* Investigate competitors.
* Verify external claims.
* Collect citations.
* Examine customer intent.
* Assess independent corroboration.

Candidate systems:

* Perplexity.
* ChatGPT with controlled web research.

---

### 14.5 Knowledge Engineer

Responsibilities:

* Create landing pages.
* Create service pages.
* Create FAQs.
* Create knowledge articles.
* Maintain content coherence.
* Follow the approved blueprint.
* Preserve Konnichiwa’s tone and positioning.

Candidate primary system:

* Claude.

---

### 14.6 Technical Visibility Engineer

Responsibilities:

* Implement WordPress changes.
* Implement structured data.
* Improve crawlability.
* Improve metadata.
* Implement internal links.
* Resolve technical defects.
* Maintain page templates.
* Connect measurement systems.

Candidate primary system:

* ChatGPT or a coding agent operating within the repository.

---

### 14.7 Visual Evidence Engineer

Responsibilities:

* Assess visual representation.
* Identify missing visual evidence.
* Review image consistency.
* Support visual-search readiness.
* Recommend required photos or video.
* Validate whether visuals support intended claims.

Candidate primary system:

* Gemini or another multimodal system.

---

### 14.8 Validation Engineer

Responsibilities:

* Validate implementations.
* Repeat visibility test scenarios.
* Check factual accuracy.
* Check intent coverage.
* Check structured data.
* Check technical integrity.
* Compare pre-implementation and post-implementation states.
* Determine whether improvement claims are earned.

Candidate systems:

* ChatGPT.
* Claude as independent content challenger.
* External tools where required.

---

### 14.9 Independent Challenger

Responsibilities:

* Challenge assumptions.
* Identify unsupported claims.
* Detect overfitting.
* Test alternative explanations.
* Identify missing evidence.
* Assess whether proposed actions are justified.
* Prevent premature approval.

The challenger must not be the sole creator of the artifact under review.

---

## 15. Initial Systems Under Investigation

The following systems are candidate investigation targets.

### Search and Maps

* Google Search.
* Google Maps.
* Google Business Profile.
* Bing.
* Apple Maps.

### Generative AI and Answer Systems

* ChatGPT.
* Gemini.
* Perplexity.
* Google AI-generated answers.
* Other relevant answer engines.

### Reviews and Directories

* Google Reviews.
* Tripadvisor.
* TheFork.
* Restaurant Guru.
* Relevant Dutch restaurant directories.
* Relevant local Utrecht platforms.

### Reservation Systems

* Guestplan.
* TheFork.
* Google reservation integration.

### Owned Media

* Konnichiwa website.
* Instagram.
* Facebook.
* YouTube.
* Other controlled profiles.

### External Media

* Local news.
* Food blogs.
* Restaurant guides.
* Influencer content.
* Press coverage.
* Partner websites.
* Event listings.

This list must be validated and prioritized for the Small Enterprise Edition.

---

## 16. Initial Measurements

The case will initially use a focused measurement model.

### 16.1 Reality Coverage

The degree to which relevant organizational reality is represented externally.

---

### 16.2 Evidence Quality

The degree to which external evidence is accurate, complete, current, authoritative, accessible, and relevant.

---

### 16.3 Cross-Source Consistency

The degree to which major external sources provide equivalent facts and positioning.

---

### 16.4 Machine Understanding

The degree to which search and AI systems correctly understand Konnichiwa.

---

### 16.5 Intent Coverage

The degree to which high-value customer intents are supported by sufficient knowledge and evidence.

---

### 16.6 Recommendation Readiness

The degree to which Konnichiwa has the evidence required to be confidently recommended for a specific intent.

---

### 16.7 Conversion Readiness

The degree to which a discovered customer can proceed accurately and easily toward:

* Reservation.
* Contact.
* Navigation.
* Gift-card purchase.
* Workshop booking.
* Takeaway or delivery, where applicable.

---

## 17. Candidate Visibility Defects

The following defect types are proposed.

### EC-002-VD-001 – Missing Representation

An important organizational fact or capability is not represented.

### EC-002-VD-002 – Contradictory Representation

Two or more sources provide conflicting information.

### EC-002-VD-003 – Stale Representation

Published information no longer reflects current reality.

### EC-002-VD-004 – Weak Evidence

A claim exists but lacks sufficient independent or authoritative support.

### EC-002-VD-005 – Intent Coverage Gap

A relevant customer intent lacks an adequate knowledge asset or evidence path.

### EC-002-VD-006 – Entity Ambiguity

A system cannot clearly identify the organization, service, location, person, or concept.

### EC-002-VD-007 – Relationship Ambiguity

A relevant relationship is missing or unclear.

Examples:

* Konnichiwa → offers → Teppanyaki.
* Konnichiwa → located in → Utrecht.
* Konnichiwa → suitable for → Business dining.

### EC-002-VD-008 – Machine Accessibility Failure

Relevant evidence exists but cannot be reliably accessed or interpreted by search or AI systems.

### EC-002-VD-009 – Recommendation Gap

A system understands Konnichiwa but does not associate it with a relevant customer intent.

### EC-002-VD-010 – Conversion Path Failure

A customer can discover Konnichiwa but cannot easily take the intended action.

---

## 18. Initial Unknowns

The following unknowns must be investigated.

### Organizational Reality

* What is Konnichiwa’s final intended market position?
* Which services are current?
* Which services are strategically important?
* Which services should no longer receive visibility investment?
* Which claims can Konnichiwa factually support?
* Which differentiators are operationally real?

### Search Visibility

* For which relevant search intents does Konnichiwa currently appear?
* Which pages receive organic traffic?
* Which pages compete against each other?
* Which existing pages are outdated?
* Which technical defects reduce visibility?
* Is the website fully indexable?
* Is structured data complete and correct?

### AI Visibility

* How do major AI systems currently describe Konnichiwa?
* Which facts do they state correctly?
* Which facts are missing?
* Which incorrect facts appear?
* For which intents is Konnichiwa recommended?
* Which competitors are recommended instead?
* Which sources appear to influence those answers?

### External Evidence

* Which third-party sources mention Konnichiwa?
* How authoritative are those sources?
* Are listings accurate?
* Are reviews sufficiently descriptive?
* Are major claims independently corroborated?
* Are visual assets sufficient?

### Intent Coverage

* Which customer intents have business value?
* Which intents match actual restaurant capability?
* Which intents are already covered?
* Which intents require landing pages?
* Which intents require service pages?
* Which intents require educational content?
* Which intents should not be pursued?

### Operations

* Who maintains visibility facts?
* Who approves content?
* Who owns Google Business Profile?
* Who owns directory access?
* How are opening-hours changes propagated?
* How are menu changes propagated?
* How are visibility defects reported?
* How often should visibility be validated?

---

## 19. Initial Candidate Claims

The following claims are candidates only.

They must not be treated as validated facts without evidence.

### EC-002-CL-001

Konnichiwa is a premium Japanese restaurant in Utrecht.

### EC-002-CL-002

Konnichiwa provides a distinctive teppanyaki dining experience.

### EC-002-CL-003

Konnichiwa provides high-quality sushi and sashimi.

### EC-002-CL-004

Konnichiwa is suitable for romantic dining.

### EC-002-CL-005

Konnichiwa is suitable for business dining.

### EC-002-CL-006

Konnichiwa is suitable for private dining and special occasions.

### EC-002-CL-007

Konnichiwa offers premium Japanese ingredients and dishes, including A5 Wagyu, toro, and lobster where applicable.

### EC-002-CL-008

Konnichiwa is differentiated through Japanese hospitality and omotenashi.

### EC-002-CL-009

Konnichiwa can become a preferred AI and search recommendation for relevant Japanese dining intents in Utrecht.

Each claim must be mapped to:

* Organizational reality.
* Owned evidence.
* Independent evidence.
* Contradicting evidence.
* Target intents.
* Validation tests.
* Confidence state.

---

## 20. Evidence Requirements

No diagnosis or design decision may be based solely on general visibility, SEO, GEO, or marketing best practices.

Each material decision must be supported by evidence from one or more of the following categories:

* Direct organizational evidence.
* Website evidence.
* Search-result evidence.
* AI-answer evidence.
* Review evidence.
* Platform evidence.
* Analytics evidence.
* Customer-intent evidence.
* Competitor evidence.
* Technical evidence.
* Independent external evidence.
* Implementation test evidence.
* Post-implementation validation evidence.

Evidence must be recorded with:

* Evidence ID.
* Source.
* Date.
* Collection method.
* Relevant observation.
* Reliability assessment.
* Limitations.
* Related claim.
* Related intent.
* Related defect.
* Related decision.

---

## 21. Landing Page Rule

Landing pages may be created when they are justified by the Visibility Coverage Map.

A landing page must not be created solely because a keyword exists.

Every proposed landing page must identify:

1. The customer intent it serves.
2. The organizational capability it represents.
3. The entities it strengthens.
4. The relationships it establishes.
5. The evidence gap it closes.
6. The competing or overlapping assets.
7. The required supporting evidence.
8. The internal-linking role.
9. The structured-data requirements.
10. The intended customer action.
11. The measurement method.
12. The maintenance owner.

A landing page that cannot satisfy these requirements is not approved.

---

## 22. Small Enterprise Prioritization Rule

The Visibility Backlog must remain focused.

At each implementation cycle, the active backlog should normally contain no more than five highest-priority visibility actions.

Prioritization must consider:

* Business value.
* Intent relevance.
* Evidence gap severity.
* Expected visibility impact.
* Implementation effort.
* Maintenance burden.
* Operational risk.
* Measurement feasibility.

The objective is not to maximize the number of visibility activities.

The objective is to maximize verified improvement per unit of organizational effort.

---

## 23. Human Approval Boundary

HELIX may:

* Observe.
* Research.
* Analyze.
* Compare.
* Diagnose.
* Design.
* Draft.
* Recommend.
* Prepare implementation changes.
* Prepare content.
* Prepare structured data.
* Prepare platform updates.
* Prepare review requests.
* Prepare external communications.

HELIX must not, without explicit human approval:

* Publish website changes.
* Modify live external profiles.
* Change opening hours.
* Change menus.
* Send messages.
* Respond publicly to reviews.
* Create external accounts.
* Purchase advertising.
* Submit press releases.
* Contact creators or journalists.
* Change reservation settings.
* Remove existing content.
* Alter production systems.

---

## 24. Proposed Artifact Structure

```text
engineering/
└── cases/
    └── EC-002-konnichiwa-visibility/
        ├── EC-002.md
        ├── CURRENT.md
        ├── PROJECT.md
        ├── observations/
        ├── evidence/
        ├── claims/
        ├── investigations/
        ├── understanding/
        ├── diagnosis/
        ├── design/
        ├── implementation/
        ├── validation/
        ├── operations/
        ├── challenges/
        ├── decisions/
        ├── work-objects/
        │   ├── reality-register/
        │   ├── source-register/
        │   ├── visibility-graph/
        │   ├── coverage-map/
        │   ├── knowledge-assets/
        │   ├── evidence-objects/
        │   ├── test-scenarios/
        │   └── visibility-backlog/
        └── references/
```

Visibility-wide standards and reference models should remain outside the case.

```text
engineering/
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

---

## 25. Initial Investigations

The following investigations are proposed.

### HV-IV-001 – Current Visibility Source Investigation

Determine where Konnichiwa is currently represented and who controls each source.

### HV-IV-002 – Organizational Reality Investigation

Establish the authoritative visibility-relevant facts of Konnichiwa.

### HV-IV-003 – Search Representation Investigation

Determine how search engines currently represent and rank Konnichiwa.

### HV-IV-004 – AI Representation Investigation

Determine how major AI systems currently understand and recommend Konnichiwa.

### HV-IV-005 – Intent Landscape Investigation

Identify and prioritize relevant customer intents.

### HV-IV-006 – Competitor Visibility Investigation

Identify which restaurants currently dominate relevant recommendation and search contexts.

### HV-IV-007 – Existing Knowledge Asset Investigation

Evaluate current pages, content, menus, schema, media, and external listings.

### HV-IV-008 – Evidence Consistency Investigation

Identify contradiction, incompleteness, staleness, and ambiguity across sources.

### HV-IV-009 – Measurement Feasibility Investigation

Determine which visibility improvements can be reliably measured within the Small Enterprise Edition.

### HV-IV-010 – Operational Ownership Investigation

Determine how visibility will be maintained without requiring a dedicated team.

---

## 26. Initial Validation Scenarios

The following scenarios are provisional.

### HV-VS-001

**Intent:** Premium Japanese restaurant in Utrecht
**Expected understanding:** Konnichiwa is identified as a premium Japanese dining option in Utrecht.

### HV-VS-002

**Intent:** Teppanyaki Utrecht
**Expected understanding:** Konnichiwa is correctly associated with teppanyaki.

### HV-VS-003

**Intent:** Sushi Utrecht
**Expected understanding:** Konnichiwa is correctly associated with high-quality sushi.

### HV-VS-004

**Intent:** Romantic Japanese restaurant Utrecht
**Expected understanding:** Konnichiwa is identified as suitable for a date or romantic dinner when supported by evidence.

### HV-VS-005

**Intent:** Business dinner Utrecht
**Expected understanding:** Konnichiwa is identified as suitable for business dining when supported by evidence.

### HV-VS-006

**Intent:** Omakase Utrecht
**Expected understanding:** Konnichiwa is only associated with omakase if the service is real, current, and sufficiently represented.

### HV-VS-007

**Intent:** Konnichiwa opening hours
**Expected understanding:** Search and AI systems return correct current opening hours.

### HV-VS-008

**Intent:** Reserve at Konnichiwa
**Expected outcome:** The user reaches an accurate and functional reservation path.

---

## 27. Success Conditions

EC-002 will be considered successful when sufficient evidence demonstrates that:

* Konnichiwa’s visibility-relevant reality is explicitly registered.
* Major external representations are identified and controlled where possible.
* Critical factual contradictions are resolved.
* Relevant customer intents are prioritized.
* A complete Visibility Coverage Map exists.
* A usable HELIX Visibility Graph exists.
* Knowledge assets are created only from validated gaps.
* Search systems more accurately represent Konnichiwa.
* AI systems more accurately understand Konnichiwa.
* Recommendation readiness improves for approved intents.
* Customer action paths remain accurate and functional.
* Visibility improvements are traceable to specific interventions.
* The operating model is maintainable by a small enterprise.
* The case produces reusable knowledge for the HELIX Visibility discipline.

---

## 28. Non-Success Conditions

The case will not be considered successful solely because:

* More pages were published.
* More keywords were added.
* More social posts were created.
* An SEO score increased.
* One AI system mentioned Konnichiwa once.
* One search ranking improved temporarily.
* Traffic increased without relevant business outcomes.
* Visibility activities increased organizational workload without measurable benefit.
* External claims exceeded organizational reality.
* The implementation cannot be maintained by Konnichiwa.

---

## 29. Termination Conditions

The case may terminate when:

* The success conditions are sufficiently met.
* The designed capability is operationalized.
* Continued work becomes routine visibility operations.
* The case is superseded by another approved engineering case.
* Evidence shows that the intended capability is not feasible.
* Konnichiwa withdraws organizational support.
* The expected business value no longer justifies continued engineering effort.

Early termination must preserve:

* Observations.
* Evidence.
* Claims.
* Investigations.
* Challenges.
* Decisions.
* Designs.
* Implementation records.
* Validation outcomes.
* Lessons learned.

---

## 30. Current Engineering State

### Established

* HELIX Visibility selected as the discipline.
* Konnichiwa selected as the first reference implementation.
* Small Enterprise Edition selected.
* EC-002 identified as a separate case from EC-001.
* Landing-page creation accepted when justified by evidence.
* Human approval required for external publication and system changes.
* Visibility Architect identified as the blueprint owner.
* Multi-model role allocation provisionally defined.
* HV-001 – HELIX Visibility Standard issued as Draft (v0.1.0), scoped to discipline definition and principles only, pending HV-IV-001/HV-IV-002 evidence (see `engineering/standards/visibility/HV-001-visibility-standard.md`).
* Authoritative organizational reality — HV-IV-002 complete, owner-confirmed (see `solutions/visibility/HV-IV-002-organisatorische-realiteit.md`).
* Current search representation — first round complete via HV-IV-003 (see `solutions/visibility/HV-IV-003-zoekmachine-representatie.md`); found a naming variant beyond earlier findings ("Konichiwa" on Yelp/Tripadvisor) and a search-summary hours contradiction against HV-IV-002.
* Current AI representation — HV-IV-004 first round complete (Claude self-test plus live DeepSeek/ChatGPT/Gemini/Perplexity checks by Kelvin, see `solutions/visibility/HV-IV-004-ai-representatie.md`). Headline finding: no system returned fully correct opening hours (matches EC-002-VD-002 Contradictory Representation) — resolved as owner confirms the venue stays open past kitchen close and teppanyaki runs a separate daily schedule from 17:00, both now added to HV-IV-002 (EV-010). Chef attribution resolved (Kelvin Wong = head chef, Rocky = sushi chef, not a contradiction). Omakase confirmed by 3/4 systems when asked directly but under-specified online (candidate EC-002-VD-005 Intent Coverage Gap) — still open. Exact venue/teppanyaki closing times remain open loose ends; the undated holiday notice fix is approved (see HV-IV-004).
* RM-HV-001 – Visibility Lifecycle issued as Draft (v0.1), grounded in HV-IV-001–004 evidence (see `engineering/reference-models/visibility/RM-HV-001-visibility-lifecycle.md`).
* First-round intent evaluation — HV-IV-005 complete for the 4 intents with evidence (see `solutions/visibility/HV-IV-005-intent-landschap.md`); identifies opening-hours consistency and an omakase landing page as the two evidence-backed backlog candidates. ~34 candidate intents from EC-002 §12 remain unevaluated.

### Not Yet Established

* Current visibility baseline.
* Complete source inventory.
* Approved intent set — partial (4 of ~38 candidates evaluated, see HV-IV-005).
* Competitor set — first round complete via HV-IV-006 (see `solutions/visibility/HV-IV-006-concurrentie.md`). Strongest general competitor: Ixi Modern Asian Cuisine (10/10 TheFork). Direct teppanyaki competitor (Restaurant Juliana) has a reputation weakness, partly explaining Konnichiwa's existing strong teppanyaki position. No Utrecht competitor claims the omakase intent — confirms the gap from HV-IV-003/005 from a competitive angle, not just a search-visibility angle.
* Existing knowledge asset inventory — first round complete via HV-IV-007 (see `solutions/visibility/HV-IV-007-bestaande-content.md`). Headline finding: both menus are hosted as non-crawlable Adobe InDesign viewers — likely explains HV-IV-004's AI-hours/pricing failures directly (EC-002-VD-008, Machine Accessibility Failure). Also found a live, broken-titled duplicate page (`/sushi-page-2/`) and an abandoned default WordPress post. Confirms Rank Math SEO plugin is installed, which may cover part of the structured-data proposal via its own settings.
* Visibility Coverage Map — HV-VCM-001 Draft v0.1 issued (see `solutions/visibility/HV-VCM-001-konnichiwa-coverage-map.md`), grounded in HV-IV-001–007.
* Visibility Backlog — first prioritized backlog issued as part of HV-VCM-001 (5 items, per HV-P-006): publish structured data, publish omakase page, remove `/sushi-page-2/`, remove `/hello-world/`, correct third-party naming (owner action required). First two are fully prepared and ready to place.
* Measurement baseline.
* Visibility Graph.
* Operational ownership model.
* Validation thresholds.
* Final success criteria.
* Termination point.

---

## 31. Immediate Next Actions

1. Approve and register EC-002.
2. Create the EC-002 case folder.
3. Create `CURRENT.md`.
4. Create `PROJECT.md`.
5. Open HV-IV-001 – Current Visibility Source Investigation. *(Opened, light version — `solutions/visibility/HV-IV-001-huidige-zichtbaarheid.md`.)*
6. Open HV-IV-002 – Organizational Reality Investigation. *(Complete — `solutions/visibility/HV-IV-002-organisatorische-realiteit.md`; owner-confirmed.)*
7. Establish the initial visibility baseline.
8. Record the first formal observations.
9. Build the Visibility Source Register.
10. Build the Organizational Reality Register.
11. Investigate current AI and search representations.
12. Create the first Visibility Coverage Map.
13. Produce the first prioritized Visibility Backlog.
14. Challenge the blueprint before implementation.
15. Begin the first approved implementation cycle.

---

## 32. Traceability

### Parent Method

* EM-001 – HELIX Engineering Method.

### Related Case

* EC-001 – Reservation Operations of Konnichiwa.

### Governing Standard

* HV-001 – HELIX Visibility Standard (Draft, v0.1.0 — `engineering/standards/visibility/HV-001-visibility-standard.md`).

### Reference Models

* RM-HV-001 – Visibility Lifecycle (Draft, v0.1 — `engineering/reference-models/visibility/RM-HV-001-visibility-lifecycle.md`).
* RM-HV-002 – Evidence Flow (proposed, not yet written).
* RM-HV-003 – Visibility Graph (proposed, not yet written).
* RM-HV-004 – Intent Coverage (proposed, not yet written).

### Primary Blueprint

* HV-VCM-001 – Konnichiwa Visibility Coverage Map (Draft v0.1 — `solutions/visibility/HV-VCM-001-konnichiwa-coverage-map.md`).

### Proposed Initial Investigation

* HV-IV-001 – Current Visibility Source Investigation.

---

## 33. Challenge Record

No formal challenge has yet been completed.

The following challenge questions must be preserved:

* Is the case attempting to engineer visibility or merely rename SEO activities?
* Can recommendation readiness be measured reliably?
* Can AI representation tests be reproduced?
* Are the proposed claims grounded in Konnichiwa’s actual operation?
* Is the target intent set commercially relevant?
* Are proposed landing pages genuinely necessary?
* Is the case over-engineered for a small enterprise?
* Can the capability be maintained without a dedicated visibility team?
* Does the approach produce measurable business value?
* Can the resulting method be reused outside the restaurant sector?
* Which parts of visibility remain outside organizational control?
* What evidence would disprove the initial hypothesis?

**Challenge status:** Open

---

## 34. Approval State

**Case establishment:** Proposed
**Case owner approval:** Pending
**Engineering approval:** Pending
**Observation stage authorization:** Pending
**External implementation authorization:** Not granted

---

## 35. Foundational Rule

> Konnichiwa will not pursue visibility through disconnected tactics.

> Every action must originate from observed reality, a validated visibility gap, an approved design, and an explicit validation method.

---

## 36. Case Declaration

EC-002 formally establishes Konnichiwa as the first Small Enterprise reference case for HELIX Visibility.

The case will test whether HELIX can engineer how an organization is externally represented and understood through disciplined observation, evidence, claims, diagnosis, design, implementation, validation, and continuous operation.

No outcome is assumed.

The strength of HELIX Visibility must be demonstrated through preserved evidence and measurable change.
