# HV-ER-001 — OC-002 Blocked Evidence Request Package
---

## Status

Open. Waiting on Kelvin. No profile, website, analytics, or production change is requested anywhere below.

## Why this exists

decisions/DD-013 (OC-002 Evidence Sufficiency Gate, PASSED WITH CONDITIONS) and observations/O-013.md identified four evidence groups needed to assess the Google Business Profile decline that could not be completed with existing repository evidence or public documentation: E-05 (profile change history), E-06 (review development), E-07 (photo/post activity), E-11 (operational context). This session attempted to complete them and confirmed: **no authenticated, direct read-only GBP access is available to Claude**, and no new data was supplied. Per this task's Access Boundary, that access gap is not bypassed — this request package is produced instead.

## Investigation Period (fixed — do not vary)

**February 2026 – July 2026**, per observations/O-013.md's Measurement Period and EV-015 (O-002.md). Use exactly this period for every item below. If a data source only exposes a narrower or wider window, say so explicitly rather than silently substituting a different period.

---

## Item 1 — GBP profile change / edit history (→ E-05)

- **Screen/report name:** Business Profile "Bewerkingsgeschiedenis" / "Edit history" if your GBP interface exposes one (location varies — check under profile settings or the account activity panel); if none is visible, your own recollection is an acceptable substitute, recorded as an Owner Declaration.
- **Required date range:** November 2025 – July 2026 (wider than the decline window itself, to catch a change that preceded and could have caused it).
- **Required visible fields:** date of each change, field changed (name, category, hours, address, phone, website/reservation/menu link, description, attributes, services), previous value, new value.
- **Acceptable format:** screenshot(s), or a short written list if no change log exists in your interface.
- **Privacy precautions:** none needed — this is your own business data.
- **Corresponds to:** E-05.

## Item 2 — Current profile categories, hours, and links (→ E-05, baseline for comparison)

- **Screen/report name:** the main "Bedrijfsprofiel bewerken" / "Edit profile" screen.
- **Required date range:** current state (today).
- **Required visible fields:** primary category, additional categories, regular hours, special hours if any are set, address/map pin, phone, website URL, reservation URL, menu URL, description, attributes.
- **Acceptable format:** screenshot(s).
- **Privacy precautions:** none needed.
- **Corresponds to:** E-05 (used as the current endpoint; does not by itself establish when any field last changed).

## Item 3 — Monthly review count and rating (→ E-06)

- **Screen/report name:** the Reviews section, sorted by date (newest first is fine).
- **Required date range:** February 2026 – July 2026 (same as the investigation period).
- **Required visible fields:** for each month, if derivable: review count at month start, new reviews that month, review count at month end, average rating, number of owner responses. **Note:** two different review counts are already on record — 605 (22 July 2026, general search results) and 625 (24 July 2026, local-pack screen) — see Challenge Evidence/CR-register.md, CR-006. If you can see the current exact count and today's date while gathering this, please note it too; that won't resolve which of the two is "right," but it adds a third dated point.
- **Acceptable format:** screenshot(s) of the review list showing dates and ratings; a manually counted summary is also acceptable if you prefer not to screenshot individual reviews.
- **Privacy precautions:** **please do not export or forward individual reviewer names or full review text unless a specific review is directly relevant** — aggregate counts (how many reviews, what rating, whether you responded) are all that's needed. If a screenshot unavoidably shows a reviewer's name, that's fine; it just won't be copied into the case files beyond what's needed for the count.
- **Corresponds to:** E-06.

## Item 4 — Photo and Google Post activity (→ E-07)

- **Screen/report name:** the Photos section and the Posts ("Updates") section of your Business Profile.
- **Required date range:** February 2026 – July 2026, plus the most recent owner photo and most recent Google Post regardless of date.
- **Required visible fields:** approximate number of photos added per month if visible (owner-added and customer-added, separately if the interface distinguishes them), dates of Google Posts published, and the date of the single most recent owner photo and most recent Post.
- **Acceptable format:** screenshot(s), or a written estimate if exact counts aren't visible (e.g. "I don't think I've posted anything since March").
- **Privacy precautions:** none needed for your own uploaded content; avoid forwarding photos that include identifiable customers if any customer-uploaded photos are reviewed.
- **Corresponds to:** E-07.

## Item 5 — Operational Context Declaration (→ E-11)

No system export can answer this — please complete the questionnaire below directly, in your own words. This is recorded as an **Owner Declaration**, not system-generated evidence, and is treated accordingly (with its own stated confidence, not equal to a platform export).

> ## Konnichiwa Operational Context Declaration
>
> Investigation period: **February 2026 – July 2026**
>
> For every answer use: **Yes — with date/details** / **No — only when certain** / **Unknown / cannot confirm**.
>
> 1. Was Konnichiwa temporarily closed during this period?
> 2. Were regular opening days or hours changed?
> 3. Were special opening hours entered incorrectly or too late?
> 4. Was either the sushi or teppanyaki section temporarily unavailable?
> 5. Was restaurant seating capacity reduced?
> 6. Were fewer reservation slots offered?
> 7. Was Guestplan availability or the reservation link changed?
> 8. Was a major menu, concept, or price-positioning change introduced?
> 9. Was there renovation, maintenance, or construction affecting operations?
> 10. Were delivery, takeaway, lunch, or omakase availability changed?
> 11. Were there staff or chef-capacity constraints that materially limited bookable service periods?
> 12. Was there any event, promotion, or media exposure that temporarily increased demand during April–May?
> 13. Is there another confirmed operational event that overlaps the decline?
>
> For every **Yes** answer, please also give: approximate or exact start date, end date, affected service, any evidence you have, and how sure you are.
>
> Declaration completed by: _______________
> Date: _______________

---

## How to send this back

Whatever mix of the above you can supply is useful — partial is fine, and "I don't know" / "I can't find that in the interface" is a valid, useful answer for any item. Please note explicitly which items you're skipping so they're recorded as "unavailable," not silently left blank.

## What happens after

Each item supplied will be classified (Direct System Evidence / Public Current-State Evidence / Owner Declaration / Derived Evidence / Unavailable), given its own confidence and limitations, and linked to E-05/E-06/E-07/E-11, OC-002, and observations/O-013.md. It will not be used to assert a cause for the GBP decline, select an intervention, or begin Organizational Understanding — those remain separate, later, not-yet-authorized steps.

## Traceability

Source: decisions/DD-013 (OC-002 Evidence Sufficiency Gate), observations/O-013.md (blockers E-05, E-06, E-07, E-11), measurement/HV-MP-002-oc-002-gbp-decline-evidence-plan.md. Requested: 24 July 2026.
