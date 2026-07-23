# HV-IR-001 — Intervention Register (Konnichiwa)

Per HV-MP-001 §11: elke visibility-wijziging krijgt een Intervention Record, zodat later kan worden aangetoond welke interventie welk resultaat veroorzaakte, hoe sterk dat resultaat is, en of het standhoudt. Status per 22 juli 2026: HV-INT-002 is volledig live en geverifieerd; HV-INT-001 is gedeeltelijk live (zichtbare tekstfix wel, machine-leesbare structured data nog niet). Geen verdict wordt toegekend vóór de eerste meetronde — dat zou tegen HV-MP-P-006 (No False Attribution) ingaan.

---

## HV-INT-001 — Structured data + gecorrigeerde openingstijden

| Veld | Waarde |
|---|---|
| Datum goedgekeurd | 22 juli 2026 (Kelvin akkoord op 22:00-basissluitingstijd en jaartal-fix) |
| Datum geïmplementeerd | Gedeeltelijk live sinds 22 juli 2026: jaartal-fix op sluitingsmelding bevestigd live. JSON-LD structured-data-blok (`structured-data-website.md`) **nog niet** op de site aangetroffen — vereist nog Rank Math-configuratie of handmatige plaatsing. |
| Gerelateerd defect | EC-002-VD-002 — Contradictory Representation (openingstijden) |
| Gerelateerde intent | "Konnichiwa opening hours" (Identity, HV-IV-005 — hoogste prioriteit) |
| Gerelateerde claim | Machine-onleesbare openingstijden (geen structured data) veroorzaken foute AI/zoekantwoorden |
| Gerelateerde pagina/bron | Homepage (`front-page.php`), voorgesteld JSON-LD-blok (`structured-data-website.md`) |
| Baseline-metriek | 0 van 4 AI-systemen correct (HV-BL-001); sluitingsmelding zonder jaartal |
| Verwacht effect | AI-systemen en zoekmachines geven na herhaling van dezelfde 4 vragen (HV-IV-004) de juiste tijden terug |
| Meetvensters | 7 / 28 / 56 / 90 dagen na livegang (HV-MP-001 §12) |
| Eigenaar | Kelvin |
| Implementatiebewijs | `structured-data-website.md`, `front-page.php`-wijziging (jaartal) |
| Externe invloeden | Geen bekende (geen seizoens-, advertentie- of concurrentie-gebeurtenis geïdentificeerd rond deze wijziging) |
| Resultaat | Nog niet gemeten. Tekstfix live; kernfix (structured data) nog niet, dus geen validatieronde starten voor dit item |
| Confidence | N.v.t. (pending) |
| Verdict | **Blocked — structured data ontbreekt nog** |

---

## HV-INT-002 — Omakase-pagina + teppanyaki-menukaart

| Veld | Waarde |
|---|---|
| Datum goedgekeurd | 22 juli 2026 |
| Datum geïmplementeerd | **Live sinds 22 juli 2026**, geverifieerd via directe paginacontrole: `/omakase-utrecht/` en `/teppanyaki-menu/` laden correct, tonen Komerebi Omakase resp. de teppanyaki-prijzen (€52,50–€108). Slugs kwamen initieel niet overeen met de code (`/omakase/`, `/teppan-yaki-menu/`); Kelvin heeft de permalinks aangepast, nu opgelost. |
| Gerelateerd defect | EC-002-VD-005 — Intent Coverage Gap; EC-002-VD-008 — Machine Accessibility Failure (menu niet crawlbaar) |
| Gerelateerde intent | "Omakase Utrecht" (Cuisine, HV-IV-005 — tweede prioriteit) |
| Gerelateerde claim | Een eigen, leesbare omakase-pagina met prijzen sluit zowel de zoek- als AI-kloof |
| Gerelateerde pagina/bron | `/omakase-utrecht/`, `/teppanyaki-menu/` (nieuw) |
| Baseline-metriek | Zwakke score op "omakase Utrecht" (HV-IV-003); 3/4 AI-systemen kennen het aanbod alleen bij directe vraag, niet bij generieke intent; geen prijs/gangen machine-leesbaar (HV-IV-004/007) |
| Verwacht effect | Verschijnen voor "omakase Utrecht"-achtige zoekopdrachten; AI-systemen kunnen prijs/gangen correct citeren |
| Meetvensters | 7 / 28 / 56 / 90 dagen na livegang → **29 jul / 19 aug / 16 sep / 20 okt 2026** |
| Eigenaar | Kelvin |
| Implementatiebewijs | `omakase-utrecht.php`, `teppanyaki-menu.php`, schema.org Menu/MenuItem-blokken — beide live geverifieerd |
| Externe invloeden | Concurrentieveld voor omakase ligt in Amsterdam (HV-IV-006) — geen directe Utrecht-concurrent die dit tegelijk verandert |
| Resultaat | Nog niet gemeten — livegang net bevestigd, eerste meetronde (dag 7) op 29 juli |
| Confidence | N.v.t. (baseline nulmeting staat, resultaat volgt) |
| Verdict | **Live — Awaiting First Validation (dag 7: 29 juli 2026)** |

---

## Wat hierna gebeurt

Zodra Kelvin de pagina's via FTP live zet en het navigatiemenu bijwerkt: dezelfde HV-IV-003-zoekopdrachten en HV-IV-004-AI-vragen herhalen op dag 7, 28, 56 en 90, en hier het resultaat + confidence + verdict invullen (Earned / Provisionally Earned / Inconclusive / Not Earned / Harmful, per HV-MP-001 §13). Geen verdict wordt toegekend vóór livegang — dat zou tegen HV-MP-P-006 (No False Attribution) ingaan.
