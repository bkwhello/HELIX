# Current State — EC-002
---

Last updated: 23 July 2026 (case migration/restructuring).

## Current lifecycle stage

Case Establishment / Observation (see Lifecycle Scope.md).

## Completed artifacts

- Case Identity, Purpose, Explicit Boundaries, Observed Conditions, Lifecycle Scope, Traceability, References — all written 23 July 2026.
- evidence/HV-IV-001 through HV-IV-007 — prior-round investigations, 22 July 2026, all evidence-backed.
- design/HV-VCM-001.md — first Visibility Coverage Map, Draft v0.1.
- design/structured-data-website.md — JSON-LD Restaurant schema, prepared, not published.
- design/omakase-pagina-brief.md — omakase page design, complete, realized.
- transformation/HV-IR-001.md — HV-INT-002 (omakase + teppanyaki menu pages) confirmed live 22 July 2026; HV-INT-001 (structured data + corrected hours) partially live (text fix only).
- measurement/HV-MP-001.md, HV-BL-001.md, HV-DB-001.md (v1–v4), TC-register.md, 30-day-baseline-metrics.md.
- work-objects/WO-active-register.md, WO-legacy-register.md, HV-AR-001.md (not active).
- claims/EC-002-CL-candidate-register.md, understanding/EC-002-VD-taxonomy.md.
- decisions/DD-001 through DD-007.
- Challenge Evidence/CR-register.md — 4 open challenges (CR-001 through CR-004).

## Active work

- New O-001–O-012 SEO/local observation round: 5 of 12 formally informed by prior evidence (O-005, O-006, O-007, O-008, O-010), 3 partially informed (O-003, O-004, O-009), 4 fully blocked pending exports (O-001, O-002, O-011, O-012).
- Weekly Monday 10:00 operating loop (decisions/DD-003) — not yet run once.

## Blockers

- Search Console export — needed for O-001, measurement/HV-BL-001.md website baseline.
- GA4 export — needed for O-001, O-011.
- Google Business Profile access/export — needed for O-002, measurement/HV-BL-001.md local baseline.
- Guestplan export — needed for O-011, measurement/HV-BL-001.md business baseline.
- Structured-data implementation — needed to unblock HV-INT-001 (design is ready, not yet placed on the live site).
- Three conversion-tracking gaps unresolved: no directions link, no Private Dining CTA, broken catering form (see observations/O-011.md).

## Next authorized action

Per decisions/DD-006 (Claude Execution Prompt): continue collecting O-001 through O-012, starting with whichever export Kelvin can provide first. Do not fabricate data — record missing access as a blocker (already done).

## Unresolved unknowns

- Exact venue/bar closing time after kitchen close (evidence/HV-IV-002.md).
- Exact teppanyaki closing time (evidence/HV-IV-002.md).
- Whether "@konnichiwagroup" Instagram account belongs to Konnichiwa (evidence/HV-IV-001.md).
- Formal indexation status of priority pages (requires O-001).
- Review recency and response-time data (requires O-009 completion).
- Which of the remaining ~34 candidate search intents (legacy EC-002 §12) have business value — none evaluated beyond the 4 in evidence/HV-IV-005.md.

## Migration note

This file, and the case folder it belongs to, were created by migrating and restructuring the original case from `solutions/visibility/` into `/organization/capabilities/marketing/visibility/cases/EC-002-konnichiwa-organic-visibility/`, per decisions/DD-007-ec002-migration-decision.md. The original source files have been deleted from `solutions/visibility/` after this migration completed (recoverable via git history).
