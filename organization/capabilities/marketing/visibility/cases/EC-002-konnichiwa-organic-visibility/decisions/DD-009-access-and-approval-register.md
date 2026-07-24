# DD-009 — Access and Approval Register
---

Per decisions/DD-002 (Approval and Safety Rules): read-only inspection and drafts may proceed without approval; external changes require explicit human approval. This register separates what's needed by category. No analytics, website, Google Business Profile, or other external system was changed while producing this register.

## Read-only access requests (no approval needed — Claude or Kelvin can act immediately)

| Item | For | Status |
|---|---|---|
| Run PageSpeed Insights (or equivalent) against konnichiwa.nl | O-012 | **Not yet run — no blocker, can proceed now** |
| Define and run a location-controlled search-tool check on "omakase utrecht" | CR-005 resolution, O-003 | Not yet run — read-only |
| Review the 3 flagged GTM "Container Quality" issues | Open unknown (current.md) | Not yet reviewed — read-only, inside Tag Manager |
| Search Console formal Coverage/Indexation report | O-005 | Not yet pulled — read-only export, same as O-001 |

## Data export requests (needs Kelvin to collect, no config change)

| Item | For | Status |
|---|---|---|
| GA4 event-level data once sufficient history accumulates | O-011 channel attribution | Pending — GA4 only started collecting 23 July (HV-INT-003); needs days to accumulate |
| Guestplan same-period-last-year export | O-011 seasonality | Not requested yet |
| Review recency/response-time detail (Google review management view) | O-009 | Not requested yet |

## Configuration-change requests (changes a setting, not published content — still needs Kelvin's own action per DD-002)

| Item | For | Status |
|---|---|---|
| None currently pending | — | The one configuration change identified this session (GA4 tag publish, HV-INT-003) has already been completed by Kelvin |

## External-change approvals (publishing/live changes — requires explicit approval before Claude prepares further, and Kelvin's own action to go live)

| Item | For | Approval status |
|---|---|---|
| Publish structured-data JSON-LD block | HV-INT-001 | Design approved 22 July 2026; **not yet placed on live site** |
| FTP-deploy HV-INT-004 (popup fix) | Website UX | Prepared 24 July 2026 in local theme copy; **awaiting Kelvin's FTP deployment** |
| FTP-deploy HV-INT-005 (mobile title fix) | Website UX | Prepared 24 July 2026 in local theme copy; **awaiting Kelvin's FTP deployment** |
| Correct third-party name-spelling listings (Yelp/Tripadvisor "Konichiwa") | VD-006 | Identified, requires Kelvin's own account access — not something Claude can do |
| Add a "get directions" link, a Private Dining CTA, and fix the catering form handler | O-011 tracking gaps | Identified, not yet designed or approved |

No external system was modified in the course of producing this register.
