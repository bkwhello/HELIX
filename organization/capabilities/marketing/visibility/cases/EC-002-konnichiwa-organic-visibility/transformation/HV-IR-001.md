> Migrated unchanged from `solutions/visibility/HV-IR-001-intervention-register.md`, 22–23 juli 2026. Artifact ID preserved and full history preserved.

# HV-IR-001 — Intervention Register (Konnichiwa)

Elke visibility-wijziging krijgt een Intervention Record, zodat later kan worden aangetoond welke interventie welk resultaat veroorzaakte. Status per 22 juli 2026: HV-INT-002 volledig live en geverifieerd; HV-INT-001 gedeeltelijk live. Geen verdict wordt toegekend vóór de eerste meetronde (HV-MP-001 §13, No False Attribution).

---

## HV-INT-001 — Structured data + gecorrigeerde openingstijden

| Veld | Waarde |
|---|---|
| Datum goedgekeurd | 22 juli 2026 |
| Datum geïmplementeerd | Gedeeltelijk live sinds 22 juli 2026: jaartal-fix op sluitingsmelding bevestigd live. JSON-LD-blok (design/structured-data-website.md) **nog niet** aangetroffen op de site. |
| Gerelateerd defect | VD-002 — Contradictory Representation (openingstijden) |
| Gerelateerde intent | "Konnichiwa opening hours" (Identity, hoogste prioriteit) |
| Gerelateerde claim | Machine-onleesbare openingstijden veroorzaken foute AI/zoekantwoorden |
| Gerelateerde pagina/bron | Homepage, voorgesteld JSON-LD-blok |
| Baseline-metriek | 0/4 AI-systemen correct (measurement/HV-BL-001.md) |
| Verwacht effect | AI-systemen/zoekmachines geven na herhaling van HV-TS-001-vragen de juiste tijden |
| Meetvensters | 7/28/56/90 dagen na livegang |
| Eigenaar | Kelvin |
| Implementatiebewijs | design/structured-data-website.md, front-page.php-jaartalwijziging |
| Externe invloeden | Geen bekende |
| Resultaat | Nog niet gemeten — kernfix (structured data) nog niet live |
| Verdict | **Blocked — structured data ontbreekt nog** |

---

## HV-INT-002 — Omakase-pagina + teppanyaki-menukaart

| Veld | Waarde |
|---|---|
| Datum goedgekeurd | 22 juli 2026 |
| Datum geïmplementeerd | **Live sinds 22 juli 2026**, geverifieerd: `/omakase-utrecht/`, `/teppanyaki-menu/` laden correct. Permalink-mismatch (initieel `/omakase/`, `/teppan-yaki-menu/`) opgelost door Kelvin. |
| Gerelateerd defect | VD-005 — Intent Coverage Gap; VD-008 — Machine Accessibility Failure |
| Gerelateerde intent | "Omakase Utrecht" (Cuisine, tweede prioriteit) |
| Gerelateerde claim | Eigen leesbare omakase-pagina sluit zowel zoek- als AI-kloof |
| Gerelateerde pagina/bron | `/omakase-utrecht/`, `/teppanyaki-menu/` |
| Baseline-metriek | Zwakke score "omakase Utrecht" (evidence/HV-IV-003.md); 3/4 AI-systemen kennen aanbod alleen bij directe vraag |
| Verwacht effect | Verschijnen voor "omakase Utrecht"-achtige zoekopdrachten; AI's citeren prijs/gangen correct |
| Meetvensters | 7/28/56/90 dagen → 29 jul / 19 aug / 16 sep / 20 okt 2026 |
| Eigenaar | Kelvin |
| Implementatiebewijs | `omakase-utrecht.php`, `teppanyaki-menu.php`, schema.org Menu/MenuItem-blokken |
| Externe invloeden | Omakase-concurrentie ligt in Amsterdam, geen directe Utrecht-concurrent verandert tegelijk |
| Resultaat | Nog niet gemeten — eerste meetronde dag 7 op 29 juli 2026 |
| Verdict | **Live — Awaiting First Validation (dag 7: 29 juli 2026)** |

---

## Wat hierna gebeurt

Dezelfde evidence/HV-IV-003.md-zoekopdrachten en evidence/HV-IV-004.md-AI-vragen herhalen op dag 7, 28, 56, 90, resultaat + confidence + verdict invullen (Earned/Provisionally Earned/Inconclusive/Not Earned/Harmful, measurement/HV-MP-001.md §13). Geen verdict vóór livegang (HV-MP-001 §13, No False Attribution).
