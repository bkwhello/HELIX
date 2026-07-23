# DD-007 — EC-002 Migration Decision
---

Classification: authorized decision. Date: 23 July 2026. Decided by: Kelvin Wong (case owner).

## Context

EC-002 was originally established 22 July 2026 under a broad scope at `solutions/visibility/`. A revised, bounded case-establishment source (`/EC-002-konnichiwa-organic-visibility.md`, later moved to this case folder) proposed relocating the case to `/organization/capabilities/marketing/visibility/cases/EC-002-konnichiwa-organic-visibility/` and restructuring it per the AD-014-conformant EC-001 pattern.

A placement verdict, file tree, migration manifest, conflict list, duplicate list, and approval request were presented to the case owner before any migration was executed.

## Decisions taken

1. **WO-ID conflict** — the legacy WO-001–008 (original EC-002 §13) are renumbered WO-101–108 to avoid collision with the new, distinct WO-001–010 set. **Approved.**
2. **Case scope/history** — the new case-establishment source's title, purpose, and boundaries become the sole authoritative case definition. The original case's scope-framing (title, Case Objective, Reference Implementation Role, Architectural Constraint, old roles model, old measurement model, old success/non-success/termination conditions, Foundational Rule, Case Declaration) is **not** preserved as a historical section anywhere in the new case folder. **Approved — "nee, geen historie."** Genuine evidentiary content from the original case (observations, evidence, candidate claims, defect taxonomy) is preserved because it is evidence/claims/understanding content, not scope-definition content, and is actively cited by kept artifacts (transformation/HV-IR-001.md cites the VD taxonomy; design/HV-VCM-001.md is built from the evidence).
3. **Scope of migration** — HV-IV-001 through HV-IV-007, HV-VCM-001, HV-MP-001, structured-data-website.md, omakase-pagina-brief.md, and product.md are included in this migration round, in addition to the five explicitly named registers (HV-AR-001, HV-BL-001, HV-DB-001, HV-IR-001, HV-TS-001). **Approved.** (product.md was placed one level up, at `../../product.md`, as capability-level product scope rather than case-level evidence — see capability.md.)
4. **Originals** — after migration, the original files under `solutions/visibility/` are deleted, not archived. **Approved — "verwijderen."** They remain recoverable via git history (this repository is git-tracked; nothing was force-deleted from version control).

## Effect

This decision authorizes the file tree created under this case folder and the deletion of the fourteen original source files listed in Traceability.md § Migration Manifest.
