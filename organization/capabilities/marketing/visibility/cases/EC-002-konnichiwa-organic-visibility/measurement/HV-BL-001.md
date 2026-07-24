> Migrated unchanged from `solutions/visibility/HV-BL-001-initial-baseline.md`. Artifact ID preserved.

# HV-BL-001 — Initial Visibility Baseline (Konnichiwa)

Per HV-MP-001 §5/§21 stap 1: de nulmeting waartegen elke interventie wordt afgezet.

Status: **compleet.** AI-, externe-bron-, website-, lokale en zakelijke baseline allemaal binnen (Search Console 23 juli 2026, Google Bedrijfsprofiel 23 juli 2026, Guestplan 24 juli 2026). Alle vier oorspronkelijke "TE LEVEREN"-blokken zijn nu gevuld.

---

## AI-zichtbaarheidsbaseline (compleet — evidence/HV-IV-004.md)

| Systeem | Openingstijden correct? | Omakase herkend? | Datum |
|---|---|---|---|
| DeepSeek | Nee | Deels | 22 juli 2026 |
| ChatGPT | Deels | Ja, onderspecificeerd | 22 juli 2026 |
| Gemini | Nee | Ja | 22 juli 2026 |
| Perplexity | Deels | Ja | 22 juli 2026 |

**Baseline-score: 0 van 4 systemen volledig correct op openingstijden.** Referentiepunt voor HV-INT-001.

## Zoekmachine-baseline (compleet — evidence/HV-IV-003.md)

| Zoekopdracht | Verschijnt Konnichiwa? | Positie/prominentie |
|---|---|---|
| "Konnichiwa restaurant Utrecht" | Ja, dominant | Meerdere platforms |
| "beste teppanyaki restaurant Utrecht" | Ja | Leidende optie |
| "sushi restaurant Utrecht" | Ja | Eén van meerdere |
| "omakase Utrecht" | Zwak | Amsterdam domineert |

**Baseline voor HV-INT-002:** "omakase Utrecht" is het referentiepunt.

## Externe-bronbaseline (compleet — evidence/HV-IV-001/003/006.md)

- Google: 4,1 sterren, 605 reviews.
- RestaurantGuru: 4/5, 827 reviews.
- Naamgeving: 3 varianten ("Konnichiwa", "Konnichi Wa", "Konichiwa").
- Sterkste concurrent: Ixi Modern Asian Cuisine. Teppanyaki-concurrent Juliana zwak.
- Geen Utrecht-concurrent claimt omakase.

## Website-baseline (compleet voor Search Console — observations/O-001.md, EV-014, 23 juli 2026)

Periode: laatste 3 maanden opgevraagd, dagcijfers dekken 21 apr–21 jun 2026 (Search Console loopt doorgaans ~1 maand achter). Totaal: 906 clicks, 29.215 vertoningen, 3,10% CTR.

Doelthema's: teppanyaki Utrecht positie 4,47; omakase Utrecht positie 4,7 (zie O-004.md — dit weerspreekt de eerdere lichte zoektest, open in Challenge Evidence CR-005); Japans restaurant Utrecht positie 7–8; sushi Utrecht positie 14,76.

Toppagina: homepage (703 clicks, positie 8,93); opvallend: `/nl/home-nederlands/` scoort beter (positie 5,05) en was niet eerder gecatalogiseerd in HV-IV-007.

Nog niet in deze export: formele indexatiedekking (aparte Search Console-rapportage), GA4, structured-data-validatorresultaat.

Ruwe bestanden: `evidence/raw/search-console-2026-07-23/`.

## Lokale zichtbaarheidsbaseline (compleet — observations/O-002.md, EV-015, 23 juli 2026)

Periode: feb–jul 2026 (6 maanden, ruimer dan de gebruikelijke 90 dagen). **Belangrijkste bevinding: elke gemeten GBP-metriek daalt gestaag over de hele periode** — profielinteracties (~2.000/mnd → ~700/mnd), websiteklikken (~1.500 → ~400), routes (~350 → ~200), telefoontjes (~110 → ~35), menuweergaven (~100 → ~15), afspraken (~55 → ~25). Dit is ontstaan ruim vóór EC-002 en vóór HV-INT-002 — geen enkele interventie uit deze case kan dit verklaren of veroorzaakt hebben. Oorzaak nog niet onderzocht (HV-MP-P-006, geen premature toeschrijving).

68.650 profielweergaven totaal, 85% via mobiel (Maps + Zoeken samen). Top zoektermen naar het profiel: sushi (4.726), restaurants (3.132), japans restaurant utrecht (2.637), konnichiwa (2.169), sushi utrecht (1.900) — bevestigt de naamverwarring uit O-001/O-008 met een tweede, onafhankelijke bron ("konichiwa" fout gespeld: 1.130 zoekopdrachten). Onverklaard: "takumi" op plek 7 (1.400) — geen bekend Konnichiwa-gerelateerd begrip.

Ruwe schermafbeeldingen: `evidence/raw/gbp-performance-2026-07-23/`.

## Zakelijke baseline (compleet — observations/O-011.md, EV-016, 24 juli 2026)

Periode: 23 apr–23 jul 2026 (90 dagen, exact venster). 1.976 gasten, 576 reserveringen (bron-uitsplitsing), 414 service-reserveringen (categorie-uitsplitsing — 162 verschil met bovenstaande, niet verklaard, zie O-011.md). Terugkerende gasten 4,7%, annuleringen 12,3% (relatief hoog, geen benchmark), no-shows 0% (opvallend laag, nog te bevestigen of dit klopt of niet consequent geregistreerd wordt). Gem. groepsgrootte 3,4.

Servicemix: Teppanyaki 263 reserveringen/901 gasten vs. Sushi & Izakaya 151 reserveringen/434 gasten — teppanyaki ruim dominant, consistent met de sterke zoekpositie uit evidence/HV-IV-003.md. Omzet per categorie toont 0 — waarschijnlijk niet bijgehouden in Guestplan.

Drukste dagen: vrijdag/zaterdag, piek zaterdag ~18:00-19:00. Bronverdeling (Online/Google/Handmatig) alleen visueel afleesbaar, geen exacte aantallen per bron beschikbaar in dit rapport.

Nog niet beantwoord: kanaal-specifieke conversieattributie (welk deel van deze reserveringen kwam via organisch zoeken of Bedrijfsprofiel) — vereist een koppeling tussen GA4-events en Guestplan die er nog niet is. Geen vergelijkbare periode vorig jaar meegenomen — geen seizoenscorrectie mogelijk.

---

Alle vier basislijnen zijn nu binnen. HV-INT-001/002 kunnen formeel gevalideerd worden op de meetmomenten uit HV-MP-001 §12. Voor HV-INT-002 (omakase) geldt: de dag-7-validatie (29 juli 2026) moet eerst de CR-005-tegenstrijdigheid ophelderen voor er een verdict wordt toegekend. De 6-maanden-daling in de GBP-baseline (hierboven) blijft de grootste, nog onverklaarde bevinding en verdient prioriteit zodra de case richting Organizational Understanding/Diagnosis gaat.
