> Migrated unchanged from `solutions/visibility/HV-IR-001-intervention-register.md`, 22–23 juli 2026. Artifact ID preserved and full history preserved.

# HV-IR-001 — Intervention Register (Konnichiwa)

Elke visibility-wijziging krijgt een Intervention Record, zodat later kan worden aangetoond welke interventie welk resultaat veroorzaakte. Status per 23 juli 2026: HV-INT-002 volledig live en geverifieerd; HV-INT-001 gedeeltelijk live; HV-INT-003 (GA4-meting) zojuist live gezet, wacht op eerste validatie. Geen verdict wordt toegekend vóór de eerste meetronde (HV-MP-001 §13, No False Attribution).

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
| Verdict | **Live — Awaiting First Validation (dag 7: 29 juli 2026) — Overdue.** Vastgesteld 21 augustus 2026 (weekly review W34, measurement/2026-W34-visibility-brief.md): geen enkele validatieronde (dag 7/28/56) is uitgevoerd; alle beschikbare Search Console-evidence (evidence/raw/search-console-2026-07-23/) en de HV-TS-001-AI-testronde dateren beide van vóór of op de livegangsdatum (22 juli 2026) — er bestaat dus geen post-livegang herhaalmeting om op terug te vallen, gerecupereerd of anderszins. Herstel is deze week (W34) top-1-prioriteit: (1) eerst CR-004's confounderscheck (Amsterdam-concurrentie, seizoen, reviewactiviteit) opnieuw tegen de huidige datum beoordelen, (2) dan een nieuwe Search Console-export voor "omakase Utrecht"/"teppanyaki Utrecht" en een herhaling van de HV-TS-001-scenario's uitvoeren. Geen verdict wordt toegekend voordat die twee stappen zijn afgerond (HV-MP-001 §13, No False Attribution) — dit blijft **Live — Awaiting First Validation**, nu expliciet als **Overdue** gemarkeerd, geen Earned/Provisionally Earned/Inconclusive/Not Earned/Harmful-verdict wordt hier vooruitgelopen. |

---

## HV-INT-003 — GA4 Google-tag daadwerkelijk gepubliceerd

| Veld | Waarde |
|---|---|
| Datum goedgekeurd | 23 juli 2026 (ontdekt tijdens diagnose van O-011/GA4-blocker) |
| Datum geïmplementeerd | **Live sinds 23 juli 2026** — GTM-container GTM-WXH5P6SN, versie 4, gepubliceerd door Kelvin, bevestigd via versiegeschiedenis ("Versie 4 is live", 2 Tags/1 Trigger/0 Variabelen). |
| Gerelateerd defect | Nieuw defect, ontdekt tijdens deze case: **GA4-meting stond 2 maanden lang klaar maar was nooit gepubliceerd** — de Google-tag G-C29ZMF288W is 2 maanden geleden (rond eind mei 2026) toegevoegd aan de GTM-werkruimte door Kelvin, maar bleef in "Wijzigingen in behandeling" staan. Verklaart waarom Realtime en alle historische GA4-rapporten leeg waren, ook na cookie-acceptatie en volledige sitedoorloop. |
| Gerelateerde intent | Alle GA4-afhankelijke meting (O-001 conversie-kant, O-011 reserveringsconversie, measurement/HV-MP-001.md Layer 6/7) |
| Gerelateerde claim | Zonder gepubliceerde GA4-tag kan geen enkele conversie- of gedragsmeting via GA4 plaatsvinden, ongeacht hoe goed de site zelf is ingericht |
| Gerelateerde pagina/bron | Sitewijd (GTM-container, niet paginaspecifiek) |
| Baseline-metriek | 0 actieve gebruikers, 0 sessies, "Geen gegevens beschikbaar" in zowel het 28-dagenrapport als Realtime, ondanks bevestigd bezoek tijdens test (23 juli 2026) |
| Verwacht effect | GA4 begint vanaf 23 juli 2026 voor het eerst data te verzamelen — sessies, events, en op termijn de reservation/phone/menu-events uit measurement/HV-MP-001.md §7 |
| Meetvensters | Direct (Realtime, binnen enkele minuten) voor eerste bevestiging; 7 dagen voor een eerste bruikbare trend |
| Eigenaar | Kelvin |
| Implementatiebewijs | GTM-versiegeschiedenis: Versie 4, gepubliceerd 23-07-2026 door kelvins.wong@gmail.com |
| Externe invloeden | Geen — dit is een pure meetinfrastructuur-fix, geen zichtbaarheids- of contentwijziging |
| Resultaat | **Bevestigd werkend.** Eerste Realtime-test (Safari) toonde nog 0 gebruikers — bleek Safari's "Voorkom cross-site bijhouden" te zijn, geen configuratieprobleem. Herhaalde test in Chrome toonde meteen actieve gebruikers in Realtime. Publicatie + meting beide bevestigd. |
| Confidence | Hoog voor "de tag vuurt nu af"; nog niet gemeten of de losse events (reservation_click, phone_click, enz. uit HV-MP-001 §7) daadwerkelijk correct doorkomen — vereist een gerichte testklik per event. |
| Verdict | **Provisionally Earned** — kernmechanisme bevestigd hersteld; volledige validatie (meerdaagse trend, events individueel getest) volgt nog. |

**Bijwerking, permanente beperking (geen bug):** tijdens het testen bleek Safari's ingebouwde tracking-preventie GA4-metingen te blokkeren. Dit is geen fout in de configuratie, maar betekent wel dat een deel van de echte Safari-gebruikers (met name iPhone/Mac-bezoekers) structureel niet of onvolledig meetelt in toekomstige GA4-cijfers. Dit moet als kanttekening worden meegenomen bij elke GA4-gebaseerde conclusie (HV-MP-001 §18, Data Quality Rules) — met name relevant omdat observations/O-002.md al liet zien dat 85% van het Bedrijfsprofielverkeer mobiel is, waarvan een onbekend maar niet-triviaal deel vermoedelijk Safari/iOS gebruikt.

**Belangrijke consequentie voor de rest van de case:** omdat GA4 de afgelopen ~2 maanden niets heeft gemeten, bestaat er geen bruikbare GA4-geschiedenis van vóór 23 juli 2026. Elke toekomstige GA4-vergelijking (voor/na een interventie) kan pas een echte baseline gebruiken vanaf vandaag, niet met terugwerkende kracht. Dit is zelf ook een voorbeeld van precies het soort defect dat deze case moet opsporen — een meetprobleem dat zonder gerichte diagnose onopgemerkt was gebleven.

---

## HV-INT-004 — Holiday-popup toont niet meer bij elk bezoek

| Veld | Waarde |
|---|---|
| Datum goedgekeurd | 24 juli 2026 (op verzoek van Kelvin) |
| Datum geïmplementeerd | Alleen lokaal — `Local Sites/konnichiwa/.../themes/konnichiwa/footer.php` aangepast, **nog niet via FTP live gezet**. |
| Gerelateerd defect | VD-010-achtig — Conversion Path Friction: de holiday-popup (zie front-page.php) toonde bij élke paginalading opnieuw (geen onthoud-logica), wat een storend herhaald obstakel vormt tussen bezoeker en de rest van de homepage, inclusief de cookiebanner die er visueel door bedekt kan raken (beide `z-index:9999`, popup staat later in de DOM en dekt het volledige scherm). |
| Gerelateerde claim | Een popup die elk bezoek terugkeert, verhoogt frictie en kan de cookiebanner onbedoeld aan het zicht onttrekken |
| Gerelateerde pagina/bron | Homepage (front-page.php popup-markup, footer.php popup-script) |
| Baseline | Popup toonde bij elke `window.load`, zonder uitzondering, ongeacht eerder gesloten |
| Verwacht effect | Popup toont alleen bij het eerste bezoek per browser; blijft daarna weg (via localStorage-vlag `konnichiwa_holiday_popup_dismissed`); cookiebanner wordt niet langer visueel overschaduwd |
| Eigenaar | Kelvin (implementatie door Claude in lokale kopie; publicatie via FTP door Kelvin) |
| Implementatiebewijs | `footer.php`, popup-script uitgebreid met localStorage-check |
| Resultaat | Nog niet gemeten — wacht op FTP-publicatie door Kelvin, daarna een bezoek + herbezoek-test |
| Verdict | **Prepared — Not Yet Deployed** |

Zie-ook: het cookiebanner-mechanisme in `header.php` is bij inspectie zelf correct geïmplementeerd (toont bij afwezigheid van een opgeslagen `konnichiwa_consent`-waarde). Als de banner na deze fix nog steeds niet verschijnt, is de meest waarschijnlijke resterende oorzaak een reeds opgeslagen consent-waarde in de browser van de tester (bijv. van het GA4-testen op 23-24 juli) — te verifiëren in een incognitovenster.

---

## HV-INT-005 — Pagina-titel liep buiten het scherm op mobiel (Arrangementen)

| Veld | Waarde |
|---|---|
| Datum goedgekeurd | 24 juli 2026 (op verzoek van Kelvin, met screenshot als bewijs) |
| Datum geïmplementeerd | Alleen lokaal — `build/index.css` aangepast, **nog niet via FTP live gezet**. |
| Gerelateerd defect | Conversion/Presentation defect: de gedeelde `pageBanner()`-component (`functions.php`) gebruikt op elke pagina die er een titel-h1 doorheen rendert (`.page-banner__title`) had **geen font-size gedefinieerd** — viel terug op de browserstandaard. Bij lange, uit één woord bestaande titels (zoals "Arrangements") past die standaardgrootte niet in de resterende breedte na de vaste 60px-zijbalk op smalle schermen, en omdat het één woord is (geen spatie) kan de tekst niet vanzelf afbreken — hij loopt door tot buiten het scherm. Kortere titels (Sushi, Home, e.d.) toonden dit toevallig niet. |
| Gerelateerde claim | Zonder responsieve titelgrootte en zonder afbreek-fallback overflowen lange, uit één woord bestaande paginatitels op smalle schermen |
| Gerelateerde pagina/bron | Sitebreed via `pageBanner()`; zichtbaar bevestigd op `/arrangements/` |
| Baseline | Screenshot Kelvin (iPhone, Safari): "Arrangements" liep buiten de rechterschermrand, geen tekstafbreking |
| Verwacht effect | Titel schaalt mee met schermbreedte (`clamp(2rem, 8vw, 3.5rem)`) en breekt als vangnet af (`overflow-wrap`/`word-break`) als een woord alsnog te lang zou zijn |
| Eigenaar | Kelvin (implementatie door Claude in lokale kopie; publicatie via FTP door Kelvin) |
| Implementatiebewijs | `build/index.css`, regels `.page-banner__content` en `.page-banner__title` |
| Resultaat | Nog niet gemeten — wacht op FTP-publicatie, daarna een herhaalde iPhone-check op `/arrangements/` en steekproef op andere paginatitels |
| Verdict | **Prepared — Not Yet Deployed** |

---

## Wat hierna gebeurt

Dezelfde evidence/HV-IV-003.md-zoekopdrachten en evidence/HV-IV-004.md-AI-vragen herhalen op dag 7, 28, 56, 90, resultaat + confidence + verdict invullen (Earned/Provisionally Earned/Inconclusive/Not Earned/Harmful, measurement/HV-MP-001.md §13). Geen verdict vóór livegang (HV-MP-001 §13, No False Attribution).
