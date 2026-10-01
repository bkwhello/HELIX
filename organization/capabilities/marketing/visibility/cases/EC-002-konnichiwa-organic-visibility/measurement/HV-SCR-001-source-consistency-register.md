# HV-SCR-001 — Source Consistency Register (Konnichiwa)
---

Created 21 August 2026, weekly review W34 (measurement/2026-W34-visibility-brief.md), operationalizing HV-MP-001 §3, Layer 3 (Cross-Source Consistency).

## What this is, and what it is not

This register records, per external source, which name/address/phone/hours/category representation is currently observed — **neutrally, without asserting visibility harm, correction need, or which value is "correct."** It does not reopen, reclassify, or contradict diagnosis/OD-003 (Established Organizational Diagnosis, decisions/DD-021/DD-022: within the tested Search Console query pairs, the misspelled "Konichiwa" variant showed **no measured ranking or CTR penalty** on Google organic search, and **no Design or intervention was authorized** for entity naming). This register does not test ranking effects — it only inventories what each source currently displays. Naming variation recorded here is a **description of current state**, not a defect requiring correction.

Do not correct any external source from this register. Do not infer that a listed variant causes any measured outcome.

## Register

| Source | Canonical name observed | Address | Telephone | Opening-hours representation | Category | Owner Controlled? | Correction mechanism | Last checked | Evidence reference | Status |
|---|---|---|---|---|---|---|---|---|---|---|
| Konnichiwa website (konnichiwa.nl) | Konnichiwa | Not separately re-verified this round | Not separately re-verified this round | Plain text on site; no schema.org markup yet (HV-INT-001, Blocked). **Update 30 sep 2026 (live read-only observation):** footer hours Match; footer label, Catering NL and Catering EN Mismatch; live JSON-LD opening hours Match. See "Update — 30 September 2026". **Update 1 oct 2026 (production verification):** website hours alignment A1–A4b deployed from Konnichiwa commit `070703a` and PRODUCTION VERIFIED; Catering NL, Catering EN and footer label now Match. See "Update — 1 October 2026" | Restaurant / Japans, teppanyaki, sushi, izakaya, omakase | **Owner Controlled** | Direct site edit (Kelvin/webbeheerder) | 22 juli 2026 (HV-IV-001) | claims/OC-004…md; evidence/HV-IV-001.md | Recorded |
| Google Business Profile | Konnichiwa | Mariaplaats-adres, niet opnieuw gecheckt deze ronde (24 juli 2026). **Update 22 sep 2026 (owner manual verification):** Match — Mariaplaats 9, 3511 LH Utrecht | Niet opnieuw gecheckt deze ronde (24 juli 2026). **Update 22 sep 2026:** Match — 030 241 6388 | Reguliere uren ingesteld; special-hours-status niet deze ronde herverifieerd (24 juli 2026). **Update 22 sep 2026 (owner manual verification):** Mon–Thu 16:00–22:00, Fri–Sun 12:00–22:00 — **Match, no remediation required** | Japans restaurant | **Owner Controlled** | Direct via GBP-dashboard (Kelvin) | 24 juli 2026 (O-013, EV-021); **22 sep 2026 (owner manual verification — name/address/phone/hours all Match)** | observations/O-013.md; measurement/HV-DB-001.md v6; this reconciliation (Priority 2 citation audit, 22 sep 2026) | Recorded — **Match, No Remediation Required (22 sep 2026)** |
| TripAdvisor — listing name | Konnichiwa | Not separately re-verified this round | Not separately re-verified this round | Not separately re-verified this round | Restaurant | **Third Party** (owner-editable via TripAdvisor Management Center, not yet confirmed) | Unknown — not yet assessed | 22 juli 2026 (EV-001/HV-IV-001); **re-verification attempted 22 sep 2026 — Not Verifiable (public access blocked)** | claims/OC-004…md; this reconciliation (Priority 2 citation audit, 22 sep 2026) | Recorded — **Re-verification Attempted 22 sep 2026, Not Verifiable** |
| TripAdvisor — page title (separate field) | Konichiwa (single n) | — | — | — | — | **Third Party** | Unknown — not yet assessed | 22 juli 2026 (EV-004/HV-IV-003) | diagnosis/OD-003…md, Contributing Conditions | Recorded — **kept separate from the listing-name field above; not treated as the same fact** |
| TheFork | Konnichiwa (per OC-004 scope; not independently re-checked this round) | Not separately re-verified this round | Not separately re-verified this round | Not separately re-verified this round (22 juli 2026). **Update 22 sep 2026 (owner manual verification, TheFork Manager → Settings → Services → Service setup, Service: Diner):** Mon–Thu 16:00–22:00, Fri–Sun 12:00–22:00 — **Match, no remediation required**. Last-guest-arrival 21:00 recorded separately as a reservation/service constraint, not a restaurant closing time — not treated as an hours defect. This verifies the Diner service-hours field specifically, not every public TheFork field | Restaurant | ~~**Third Party / Platform Controlled** (unconfirmed which)~~ → **Owner Controlled** (confirmed 22 sep 2026, verified via TheFork Manager, the owner-side management portal — supersedes the prior "unconfirmed which" classification) | Unknown — not yet assessed (22 juli 2026). **Update 22 sep 2026:** TheFork Manager (owner dashboard) — confirmed | 22 juli 2026 (EV-001/HV-IV-001); **22 sep 2026 (owner manual verification via TheFork Manager)** | claims/OC-004…md; this reconciliation (Priority 2 citation audit, 22 sep 2026) | Recorded — see also Challenge Evidence/CR-register.md CR-007 (review-count method conflict, separate from naming). **Service hours Match, No Remediation Required (22 sep 2026); other public fields not re-verified this round** |
| Instagram (@konnichi_wa_utrecht) | Konnichi Wa | — | — | — | — | **Owner Controlled** (assumed — account ownership not re-verified this round) | Direct via Instagram profile edit | 22 juli 2026 (EV-001/HV-IV-001) | claims/OC-004…md; design/structured-data-website.md `sameAs` | Recorded |
| Facebook (Konnichiwa.Japansrestaurant) | Konnichi Wa | — | — | — | — | **Owner Controlled** (assumed — not re-verified this round) | Direct via Facebook Page edit | 22 juli 2026 (EV-001/HV-IV-001) | claims/OC-004…md; design/structured-data-website.md `sameAs` | Recorded |
| Eet.nu | Konnichi Wa (22 juli 2026); **confirmed as "Konnichi WA" 22 sep 2026 — same accepted spacing/casing variant, not reopened per diagnosis/OD-003** | — (22 juli 2026). **Update 22 sep 2026 (automated read-only check):** Match — Mariaplaats 9, 3511 LH Utrecht | — (22 juli 2026). **Update 22 sep 2026:** Match — 030-2416388 | — (22 juli 2026). **Update 22 sep 2026 (automated read-only check, pre-correction):** Mon 16:00–23:00 / Tue 12:00–23:00 / Wed 12:00–23:00 / Thu 12:00–23:00 / Fri 12:00–23:00 / Sat 12:00–23:00 / Sun 12:00–23:00 — **confirmed defect**: all seven days close at 23:00 instead of the authoritative 22:00, and Tue/Wed/Thu additionally open at 12:00 instead of the authoritative 16:00. **Correction request submitted by owner 22 sep 2026.** **Update 30 sep 2026 (public read-only check):** Mon–Thu 16:00–22:00, Fri–Sun 12:00–22:00 — **Match** | Restaurant | **Unknown** — not yet assessed (22 juli 2026). **Update 22 sep 2026:** **Owner-Manageable** — confirmed free claim/login-based edit portal found (`.../restaurant-owners/restaurants/19666/edit`), login wall verified, not yet claimed by Kelvin as of this check | Unknown — not yet assessed (22 juli 2026). **Update 22 sep 2026 (confirmed):** (a) Eet.nu support contact form / info@eet.nu — route used for the 22 sep 2026 correction request; (b) owner-manageable claim/edit portal (free registration, login required) — alternative future route, not yet used | 22 juli 2026 (EV-001/HV-IV-001); **22 sep 2026 (automated read-only verification + correction submitted)** | claims/OC-004…md; this reconciliation (Priority 2 citation audit + Step 2B route discovery, 22 sep 2026); channel alignment audit, 30 sep 2026 | **CORRECTION SUBMITTED — VERIFICATION PENDING (22 sep 2026)** → **VERIFIED CORRECT — 2026-09-30** (hours) |
| Quandoo | Konnichi Wa | — | — | — | — | **Unknown** — not yet assessed | Unknown — not yet assessed | 25 juli 2026 (DQ-002 investigation, Phase 1 inventory) | diagnosis/OD-003…md, Contributing Conditions | Recorded |
| Yelp | Konichiwa (single n) | — | — | — | — | **Third Party** | Unknown — not yet assessed | 22 juli 2026 (EV-004/HV-IV-003); **re-verification attempted 22 sep 2026 — Not Verifiable (public access blocked)** | claims/OC-004…md; diagnosis/OD-003…md; this reconciliation (Priority 2 citation audit, 22 sep 2026) | Recorded — **Re-verification Attempted 22 sep 2026, Not Verifiable** |
| Apple Maps | Not separately assessed | Not separately assessed | Not separately assessed | **22 sep 2026 (owner manual verification):** Mon–Thu 16:00–22:00, Fri–Sun 12:00–22:00 — **Match, no remediation required** | Restaurant | **Unknown** — ownership/claim status not assessed this round | Unknown — not yet assessed (no defect found, so no correction needed this round) | 22 sep 2026 (owner manual verification) | This reconciliation (Priority 2 citation audit, 22 sep 2026) | Recorded — **Match, No Remediation Required (22 sep 2026)** |
| Bing | Konnichiwa | Not separately assessed | Not separately assessed | **22 sep 2026 (owner manual verification):** Mon 16:00–22:00 / Tue 16:00–22:00 / Wed 16:00–22:00 / Thu 16:00–22:00 / Fri 12:00–22:00 / Sat 12:00–22:00 / Sun 12:00–22:00 — **Match, no remediation required** | Restaurant | **Unknown** — ownership/claim status not assessed this round | Unknown — not yet assessed (no defect found, so no correction needed this round) | 22 sep 2026 (owner manual verification) | This reconciliation (Priority 2 citation audit, 22 sep 2026) | Recorded — **Match, No Remediation Required (22 sep 2026)** |
| Ontdek Utrecht (ontdek-utrecht.nl) | Konnichi Wa | Mariaplaats 9, 3511 LH Utrecht — Match | Not published in a separately verified field on the listing page | Mon 16:00–22:00 (Match) / Tue 16:00–22:00 (Match) / Wed 16:00–22:00 (Match) / **Thu 12:00–22:00 — mismatch, should open 16:00** / **Fri 12:00–23:00 — mismatch, should close 22:00** / **Sat 12:00–23:00 — mismatch, should close 22:00** / Sun 12:00–22:00 (Match). **Update 30 sep 2026 (public read-only check of the same URL):** Mon–Thu 16:00–22:00, Fri–Sun 12:00–22:00 — all seven days **Match** | Restaurant / "eten & drinken" directory | **Third Party — Editorial** (operated by Utrecht & Partners; no self-service edit/claim function found on the listing page or site footer) | Editorial contact — redactie@ontdek-utrecht.nl (via the "Vragen voor de redactie?" link on the listing page, and the `/contact/` page); no self-service route found | 22 sep 2026 (direct read-only fetch of https://www.ontdek-utrecht.nl/locatie/konnichi-wa/) | This reconciliation (Priority 2 citation audit + Step 2A route discovery, 22 sep 2026); channel alignment audit, 30 sep 2026 | **CORRECTION SUBMITTED — VERIFICATION PENDING (22 sep 2026)** → **VERIFIED CORRECT — 2026-09-30** (hours) |
| Thuisbezorgd (delivery partner; added 30 sep 2026) | Not verified | Not verified | Not verified | **30 sep 2026:** channel found via the website's delivery page (`/en/sushi-bezorgen-in-utrecht/`, "Bestel op Thuisbezorgd"); public retrieval of the linked listing returned **HTTP 403**; opening and delivery hours therefore **not verified**; no login attempted | Delivery platform | **Unknown** — presumably partner-portal managed; not assessed | Unknown — not yet assessed | 30 sep 2026 (public read-only attempt, 403) | Channel alignment audit, 30 sep 2026 | **UNKNOWN** |
| "Near-Place" (previously referenced source, not otherwise documented in this case) | — | — | — | — | — | — | — | 22 sep 2026 (public search, no accessible listing found) | This reconciliation (Priority 2 citation audit, 22 sep 2026) | **SOURCE NOT IDENTIFIED** — no citation source by this name could be located in public search, associated with Konnichiwa or otherwise; not classified Match/Mismatch; recorded to prevent a future investigator re-searching from scratch |

## Fields intentionally left blank

Address, telephone, opening-hours representation, and category are marked "Not separately re-verified this round" for most third-party sources — this is a genuine evidence gap, not a claim that these fields are consistent or inconsistent. No value is inferred to fill these cells.

## Relationship to diagnosis/OD-003

OD-003 tested only Google organic search position/CTR for the "Konnichiwa"/"Konichiwa" query family and found no measured penalty, within its own stated scope and confidence (Medium). OD-003 explicitly preserves, as a Contributing Condition, that "third-party listings... continue to reinforce the underlying inconsistency at the platform level, independent of Google's own search-result behavior toward it" — this register is the evidence-tracking continuation of exactly that preserved condition, not a new diagnosis and not a reopening of OD-003's established finding. Per decisions/DD-022, no Design or intervention is authorized by naming inconsistency alone; this register creates no such authorization.

## Next step

Individually re-verify each "Not separately re-verified this round" cell with a dated screenshot or Owner Declaration before any future consistency percentage (HV-MP-001 §3, Layer 3 target: 100% critical fields, ≥95% overall) is calculated. No percentage is calculated from this version of the register.

**Update 22 sep 2026 (Priority 2 weekly citation audit + owner manual verification):** Google Business Profile, TheFork (service hours only), Apple Maps, and Bing hours fields were re-verified — all four **Match, no remediation required**. Ontdek Utrecht and Eet.nu hours fields were also re-verified and both are **confirmed defects**; the owner submitted correction requests to both on 22 sep 2026 — both are **CORRECTION SUBMITTED — VERIFICATION PENDING**, not yet corrected or closed. Re-verification of Yelp and TripAdvisor was attempted and remains **Not Verifiable** (public access blocked both this round and the prior one). A previously-referenced source, "Near-Place," could not be identified anywhere in public search and is recorded as **Source Not Identified**, not classified Match/Mismatch. **No consistency percentage is calculated in this update either** — Yelp, TripAdvisor, Near-Place's identity, and the two pending corrections all remain unresolved; the original instruction above (no percentage while material fields remain unresolved) still applies.

## Update — 30 September 2026

*Channel alignment audit, 30 September 2026 (≈15:10 UTC). Read-only only: public GET requests to the live website (all 23 URLs of `page-sitemap.xml`) and to publicly accessible listing pages. No login, no admin environment, no Search Console, and no change to any website, listing or account. Theme source was read in the Konnichiwa website repository at `2fe2379`. No HTML or screenshots were retained. Performed by Claude under Case Owner instruction.*

**Canonical reference:** design/HV-CHM-001-canonical-hours-model.md at commit `c61448b88a2a251e44a3b6bff75ed4436610b651`, effective 2026-09-29.

- Public opening hours: Mon–Thu 16:00–22:00; Fri–Sun 12:00–22:00.
- Lunch: Fri–Sun 12:00–17:00.
- Takeaway: Mon–Thu 17:00–21:30; Fri–Sun 13:00–21:30.
- Delivery: Mon–Thu 16:00–21:30; Fri–Sun 13:00–21:30.
- Teppanyaki start: 17:00.
- Last reservation: 21:00.
- Sushi/Izakaya last order: 21:30.

**Semantic qualification.** **22:00 = public closing time; 21:30 = Sushi/Izakaya last order; 21:00 = last reservation.** These concepts are not interchangeable. A label that presents public opening hours as kitchen hours is therefore a **semantic consistency mismatch**, even when the times shown are themselves correct.

### Own website (konnichiwa.nl) — live observation, 30 September 2026

| Surface | Concept | Observed | Status |
|---|---|---|---|
| Live footer hours (WordPress menu `footer-hours`), all 23 sitemap pages | Public hours | NL "ma-don 16:00-22:00 / vr-zon 12:00-22:00"; EN "mon-thu 16:00 – 22:00 / fri-sun 12:00 – 22:00" | **MATCH** |
| Footer label (theme `footer.php`, line 5) | Label of the public hours | "Keuken Geopend" (NL) / "Kitchen Hours" (EN) above the public opening hours | **MISMATCH** (semantic: presents public hours as kitchen hours) |
| Footer fallback (theme `footer.php`, lines 28–31) | Public hours | Mon–Fri 17:30–22:00; Sat–Sun 17:00–22:30 | **MISMATCH** (latent risk: in code only; not live while the WordPress menu supplies the values) |
| Catering NL, `/catering-utrecht/` (`page-catering.php`) | Public hours | "Ma – do: 17:30 – 22:00"; Friday–Sunday absent | **MISMATCH** (canonical: ma–do 16:00–22:00, vr–zo 12:00–22:00) |
| Catering EN, `/en/catering/` (`template-catering-eng.php`) | Public hours | "Mon – Thu: 17:30 – 22:00"; Friday–Sunday absent | **MISMATCH** (canonical: Mon–Thu 16:00–22:00, Fri–Sun 12:00–22:00) |
| Live JSON-LD (all 23 pages) | Public hours | `"openingHours":["Mo,Tu,We,Th 16:00-22:00","Fr,Sa,Su 12:00-22:00"]` | **MATCH** |
| Omakase `/en/omakase-utrecht/` and Wagyu `/en/wagyu-utrecht/` | Teppanyaki start | "vanaf 17:00" | **MATCH** |

**JSON-LD note.** The register row above records "no schema.org markup yet" as observed on 22 July 2026. That was a time-bound observation and is **not** described here as an error. The 30 September 2026 audit is a **new live observation** that finds opening-hours structured data present and matching canonical public hours. The earlier observation remains unchanged as history.

**Not a live surface.** Theme file `page-sushi-eng.php` ("Kitchen opens … 16:00–21:30 / 12:00–21:30") is not rendered by any sitemap page, and its canonical path `/sushi-eng/` returned 404. It is recorded as code only, not classified.

### Third-party listings — public read-only checks, 30 September 2026

| Source | Observed | Status |
|---|---|---|
| Eet.nu (`/utrecht/konnichiwa`) | Mon–Thu 16:00–22:00, Fri–Sun 12:00–22:00 | **MATCH** — history "CORRECTION SUBMITTED — VERIFICATION PENDING (22 sep 2026)" preserved; current state **VERIFIED CORRECT — 2026-09-30** |
| Ontdek Utrecht (`/locatie/konnichi-wa/`) | Mon–Thu 16:00–22:00, Fri–Sun 12:00–22:00 (all seven days) | **MATCH** — history "CORRECTION SUBMITTED — VERIFICATION PENDING (22 sep 2026)" preserved; current state **VERIFIED CORRECT — 2026-09-30** |
| Thuisbezorgd | Channel found via the delivery page; public retrieval returned HTTP 403; no login attempted | **UNKNOWN** |

Google Business Profile, TheFork (Diner service), Apple Maps and Bing were **not re-verified** on 30 September 2026. Their 22 September 2026 regular-hours Match stands as last verified.

### Remaining UNKNOWN (not converted to Match or Mismatch)

- Ecwid webshop takeaway (pickup) configuration.
- Google Business Profile service-specific hours (lunch, takeaway, delivery).
- TheFork lunch service.
- TripAdvisor and Yelp (not verifiable).
- Guestplan last reservation (21:00 canonical).
- Thuisbezorgd delivery hours.

**Not recorded as a mismatch.** The website's lunch, takeaway and delivery pages do not state service-specific hours; they show only the public hours in the footer. That is an absence of a statement, not an incorrect one. Whether to publish service hours is a Case Owner content decision.

**Unchanged by this update:** the historical round-0 scores; measurement/HV-MP-003 (including CO-M9 and CO-M10); design/HV-CHM-001; and every other artifact. No correction is performed or authorized. **No consistency percentage is calculated**, because material fields remain UNKNOWN.

## Update — 1 October 2026 (production verification)

*Production verification of the website hours alignment A1–A4b, 1 October 2026. This is a new, prospective record. The 30 September 2026 findings above are preserved unchanged as the state **before** the correction. The deployment (manual FileZilla upload) and the post-deploy downloads were performed by the Case Owner. The byte verification and the live smoke test (public GET requests only, ≈03:13 UTC) were performed by Claude. No form was submitted, and no analytics event was intentionally triggered.*

**Deployment source:** Konnichiwa repository (`bkwhello/konnichiwa`), commit `070703a2bcf4b25a68f4c9c016ce6bad6f80b5a8` ("feat: align website opening hours"), parent `2fe23791947d83b995be1d51104cea145a81b442`. Exactly three theme files were deployed to `wp-content/themes/konnichiwa/`:

- A1: `page-catering.php` (Catering NL hours line);
- A2: `template-catering-eng.php` (Catering EN hours line);
- A3: `footer.php` (footer label);
- A4b: `footer.php` (fallback hours, language-aware, with `esc_html()`).

**Pre-deploy production baseline.** Before upload, the three production files were downloaded read-only and found byte-identical to parent `2fe2379`:

- `footer.php` `31b312f9dda5d255521ab9548edfba59f42cf2e022ba09d807ca9edf0433634d`
- `page-catering.php` `68aa02cbb4037c88283baa5d09a54af5aa71a088e3faa199a5c7d09bbdd9007b`
- `template-catering-eng.php` `e12cb469ab21d81351df4793d87ef794617c20d4843dac2ada81b7fd93f3a930`

There was therefore no unknown production drift.

**Post-deploy byte verification.** The three production files were downloaded again after upload:

| File | Size | SHA-256 | Result |
|---|---|---|---|
| `footer.php` | 5548 | `74f42fc5dfcd9ececf1b478860d1a84811dfee5572b27ca488c3c7a808afaa62` | **EXACT MATCH TO 070703a** |
| `page-catering.php` | 18324 | `d0692bb2d7d02e3258f96c4e2b0f48b66cd582e5308b48c0b7b50b6e5df9d1a5` | **EXACT MATCH TO 070703a** |
| `template-catering-eng.php` | 18203 | `84731f89867d388c22477b0eb2f46d86550ce5efc358a706eb4b055772232316` | **EXACT MATCH TO 070703a** |

**A1–A4b: PRODUCTION VERIFIED (2026-10-01).**

### Status progression (own website)

| Surface | 30 September 2026 | 1 October 2026 | Evidence |
|---|---|---|---|
| Catering NL, `/catering-utrecht/` | MISMATCH ("Ma – do: 17:30 – 22:00"; Fri–Sun absent) | **MATCH** | HTTP 200; "Ma – do: 16:00 – 22:00 · Vr – zo: 12:00 – 22:00"; "17:30" absent |
| Catering EN, `/en/catering/` | MISMATCH ("Mon – Thu: 17:30 – 22:00"; Fri–Sun absent) | **MATCH** | HTTP 200; "Mon – Thu: 16:00 – 22:00 · Fri – Sun: 12:00 – 22:00"; "17:30" absent |
| Footer label | MISMATCH (semantic: "Keuken Geopend" / "Kitchen Hours" above public hours) | **MATCH** | NL heading "Openingstijden" (on `/`, `/private-dining/`, `/catering-utrecht/`), "Keuken Geopend" absent; EN heading "Opening hours" (on `/en/home/`, `/en/catering/`), "Kitchen Hours" absent |
| Footer fallback (theme code) | MISMATCH / latent risk | **CODE ALIGNED / VERIFIED BY BYTES** | Deployed `footer.php` byte-identical to `070703a`, whose fallback gives Mon–Thu 16:00–22:00, Fri–Sun 12:00–22:00 (NL and EN day labels). **Still latent and not live-rendered:** the WordPress `footer-hours` menu is active and supplies the displayed hours. No claim is made that the fallback was rendered live. |
| Live footer hours (menu) | MATCH | **MATCH (unchanged)** | NL "ma-don 16:00-22:00 / vr-zon 12:00-22:00"; EN "mon-thu 16:00 – 22:00 / fri-sun 12:00 – 22:00" |
| Live JSON-LD | MATCH | **MATCH (unchanged)** | `"openingHours":["Mo,Tu,We,Th 16:00-22:00","Fr,Sa,Su 12:00-22:00"]` on all checked pages |

### Smoke-test observations (1 October 2026)

- **HTTP:** `/catering-utrecht/`, `/en/catering/`, `/` and `/private-dining/` returned 200. `/en/` returned **301 → `/en/home/`**, which returned 200. The redirect lies outside the deployed files, which do no routing.
- **Unchanged integrations:** Guestplan is present and the GTM snippet (`GTM-WXH5P6SN`) is present on all checked pages. The catering form is present on NL and EN, with `admin-post.php`, action `konnichiwa_catering_inquiry`, the nonce field and `data-track="catering_enquiry"`.
- **Errors:** no PHP error strings (Fatal, Parse, Warning, Notice, Deprecated, Uncaught) in the page text.
- **Not done:** no form was submitted, and no analytics event was intentionally triggered.

### Unchanged by this update

- The UNKNOWN items in the 30 September 2026 update remain UNKNOWN: Ecwid takeaway configuration; GBP service-specific hours; TheFork lunch; TripAdvisor; Yelp; Guestplan last reservation; Thuisbezorgd.
- No listing was changed. No consistency percentage is calculated.
- design/HV-CHM-001, measurement/HV-MP-003, historical round-0 artifacts, current.md and HV-DB-001 are not modified.

## Traceability

Source claims: claims/OC-004…md. Source diagnosis: diagnosis/OD-003…md (decisions/DD-021, DD-022). Weekly review: measurement/2026-W34-visibility-brief.md. **30 Sep 2026 update:** canonical reference design/HV-CHM-001-canonical-hours-model.md at `c61448b`; channel alignment audit (read-only, 30 sep 2026); Konnichiwa theme source at `2fe2379` (`footer.php`, `page-catering.php`, `template-catering-eng.php`, `page-sushi-eng.php`). **1 Oct 2026 update:** Konnichiwa commit `070703a2bcf4b25a68f4c9c016ce6bad6f80b5a8`; pre-deploy and post-deploy production downloads (Case Owner, FileZilla) with SHA-256 byte verification; live smoke test (read-only, 1 oct 2026).
