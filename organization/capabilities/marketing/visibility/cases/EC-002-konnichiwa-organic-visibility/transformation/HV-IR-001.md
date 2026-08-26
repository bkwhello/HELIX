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

## HV-INT-006 — Consent-bridge (`propagateConsent()`) inline in header.php, buiten dit register om geïmplementeerd

| Veld | Waarde |
|---|---|
| Datum goedgekeurd | Niet vastgelegd in dit register — geïmplementeerd vóór registratie, ontdekt via productie-validatie op 23 augustus 2026 (observations/O-016.md, EV-034). |
| Datum geïmplementeerd | Onbekend exact — Kelvin bevestigt (24 augustus 2026): inline blok in `header.php` toegevoegd, gewijzigd bestand handmatig via FileZilla naar productie geüpload. Niet via dit repository's git-workflow gecommit — diagnosis/HV-CSD-001…md (EV-035) bevestigde 23 augustus dat de repo-versie van `header.php` deze code niet bevat. |
| Gerelateerd defect | Bedoeld als oplossing voor de bevinding in diagnosis/HV-CSD-001-consent-architecture-divergence.md ("Architecture Recommendation", Option C): Complianz-acceptatie resulteerde niet in een Google Consent Mode-update. |
| Gerelateerde claim | Een expliciete bridge (`propagateConsent()`, luisterend op `cmplz_status_change`, roept `gtag('consent','update',...)` aan) zou de ontbrekende koppeling tussen Complianz en Google Consent Mode herstellen zonder Complianz Premium. |
| Gerelateerde pagina/bron | Sitebreed via `header.php` (`<head>`-blok) |
| Baseline | observations/O-015.md, EV-030: na Complianz Accept bleven alle vier Google Consent Mode `update`-waarden `undefined`. |
| Verwacht effect | Na Complianz Accept: alle vier Google Consent Mode `update`-waarden naar `granted`/overeenkomstige staat, GA4/Ads-metingen werken zoals bedoeld na toestemming. |
| Eigenaar | Kelvin (implementatie en FTP-publicatie door Kelvin, buiten Claude/dit repository om) |
| Implementatiebewijs | **Bijgewerkt 26 augustus 2026 (observations/O-017.md, EV-042):** gecommit en gepusht naar `origin/main` als `c9f6a5681ca7885e7ca12b1fb3a2a2ce49bc2745` (geïsoleerde cherry-pick van lokale commit `81316c851589ff585f4271a64a33f4f5e12efe93`, schone fast-forward vanaf `b142905ff8b1509cf37d38a2ac204c0668ebe94f`, geen force/merge/rebase). Onafhankelijk herbevestigd live op productie via een verse FTP-pull (26 augustus), byte-voor-byte identiek aan het eerder voorbereide bestand. |
| Resultaat | **Validatie mislukt (observations/O-016.md, EV-034, 23 augustus 2026):** `cmplz_has_consent('statistics')`/`('marketing')` beide `true` na Accept, maar alle vier `gtag('consent','update',...)`-waarden blijven `undefined` — ook na handmatige `cmplz_status_change`-dispatch. **Nadien opgelost — zie het eindverdict onderaan deze sectie.** |
| Verdict | **Root Cause Confirmed and Corrected — Fix Validated End-to-End in Production, Repository Reconciliation Complete (26 augustus 2026).** Zie de status- en eindverdicht-tabellen hieronder voor de volledige validatie- en reconciliatie-geschiedenis; deze cel is bijgewerkt om tegenspraak met die latere vaststelling te voorkomen. |

**Vereiste validatiematrix (Case Owner-specificatie, 24 augustus 2026) — uit te voeren door Kelvin ná FTP-upload van het gecorrigeerde bestand, resultaten te rapporteren voor vastlegging:**

| # | Scenario | Te verifiëren |
|---|---|---|
| A | Fresh visitor | Precies 1 GTM-script/bootstrap; Complianz is de enige banner; `analytics_storage`/`ad_storage`/`ad_user_data`/`ad_personalization` = `denied` |
| B | Accept | `cmplz_has_consent('statistics')`/`('marketing')` = `true`; Google Consent Mode `update` niet langer `undefined`; `analytics_storage` → `granted`; marketing-gemapte staten gedragen zich zoals ontworpen; GA4-meting zichtbaar |
| C | Decline | Complianz-consent blijft/wordt `denied`; `analytics_storage` blijft/wordt `denied`; advertentie-gerelateerde staten blijven/worden `denied`; geen ongepaste `granted`-staat overleeft |
| D | Returning visitor — eerder geaccepteerd | Na herlaad: Complianz herstelt staat; bridge propageert opgeslagen staat; Google Consent Mode bereikt correcte `granted`/`denied`-staat |
| E | Returning visitor — eerder geweigerd | Na herlaad: Google Consent Mode blijft `denied` |
| F | Revoke / voorkeurswijziging | Eerder verleende consent kan worden ingetrokken; Google Consent Mode keert terug naar `denied` |

Bij falen van één scenario: **STOP** — geen tweede correctieve productiewijziging zonder nieuwe Case-Owner-goedkeuring.

**Status per 24 augustus 2026 (observations/O-017.md, EV-038):**

| # | Scenario | Resultaat |
|---|---|---|
| A | Fresh visitor | **PASS** |
| B | Accept | **PASS** — alle vier `update`-waarden → `true` |
| C | Decline | **PASS** — alle vier `update`-waarden → `false` |
| D | Returning visitor — geaccepteerd | **PASS** — na herlaad zonder cookies te wissen: staat blijft `true`, Consent Mode keert terug naar `granted`, GTM blijft 1x |
| E | Returning visitor — geweigerd | **PASS** — na herlaad: staat blijft `false`; `update` kan `undefined` blijven (geen nieuwe update nodig, `default` is al `denied`) — dit is verwacht gedrag, geen defect; GTM blijft 1x |
| F | Revoke / voorkeurswijziging | **PASS** — na intrekken van Statistics/Marketing: alle vier `update`-waarden → `false` |
| — | Measurement behaviour (GA4) | **PASS** — Accepted: granted, `page_view` gemeten; Denied: `gcs=G100`/`npa=1` (verwacht, cookieless); Revoked: keert terug naar dezelfde restricted-staat; geen dubbele meting waargenomen |

**Alle poorten afgerond, 26 augustus 2026 (observations/O-017.md, EV-041).** Root cause (EV-037) hiermee bevestigd over de volledige levenscyclus (accept/deny/herlaad/revoke) én bevestigd tot en met daadwerkelijk GA4-meetgedrag, ongewijzigd t.o.v. de oorspronkelijke vaststelling.

**HV-INT-006 eindverdict: Root Cause Confirmed and Corrected — Fix Validated End-to-End in Production.** Alle zes gedragsscenario's plus de meetgedrag-poort: PASS. **HV-CSD-001 is hiermee CLOSED** (diagnosis/HV-CSD-001-consent-architecture-divergence.md).

**Repository-reconciliatie, apart afgerond op 26 augustus 2026 (observations/O-017.md, EV-042) — niet gelijktijdig met bovenstaande productie-sluiting, wel dezelfde dag.** Productie is onafhankelijk herbevestigd via een verse FTP-pull, byte-voor-byte identiek aan het eerder voorbereide bestand. De fix is vervolgens gecommit en gepusht naar `origin/main` als `c9f6a5681ca7885e7ca12b1fb3a2a2ce49bc2745` (schone fast-forward vanaf `b142905ff8b1509cf37d38a2ac204c0668ebe94f`, geen force/merge/rebase/amend/squash) — geïsoleerd via een apart worktree/branch specifiek om een onafhankelijke, reeds bestaande divergentie in de lokale repository-geschiedenis (twee lokale commits die al elders gepushte wagyu/sake-content dupliceren) niet mee te pushen. Die divergentie, en de bestaande niet-gecommitte werkboom-wijzigingen (taalschakelaar, `.footer__social`-CSS, ongerelateerde paginatemplates), blijven een **apart, onopgelost traject** — bewust niet aangeraakt in dit werk.

**Losstaande waarneming, niet onderdeel van HV-CSD-001:** tijdens het testen was een console-foutmelding zichtbaar — `TypeError: section.querySelectorAll is not a function`. Niet gediagnosticeerd, niet opgelost, geen causaal verband met de consent-bridge vastgesteld. Geregistreerd als losstaand vervolgpunt (observations/O-017.md, EV-040).

**Bijwerking, procesbevinding (geen technische bug):** dit is de eerste interventie in dit register die buiten de HELIX-gedocumenteerde workflow om is geïmplementeerd en gepubliceerd — ontdekt achteraf, via een validatiefout, niet via een vooraf goedgekeurde HV-INT-aanvraag. Dit register kon de wijziging daardoor niet vooraf vastleggen (geen "Datum goedgekeurd", geen implementatiebewijs beschikbaar bij aanmaak van dit item). Zie diagnosis/HV-CSD-001-consent-architecture-divergence.md voor de volledige technische reconstructie.

---

## HV-INT-007 — Header-logo/zijbalk-mismatch: HTML bijgewerkt naar reeds-live CSS

| Veld | Waarde |
|---|---|
| Datum goedgekeurd | 24 augustus 2026 (Kelvin, na melding "logo veel te groot" ná upload van HV-INT-006) |
| Gerelateerd defect | Ontdekt bij validatie van HV-INT-006: productie-`header.php` gebruikte nog de oude zijbalk-opmaak (`aside#side-nav`, `.side-nav__content--logo`), terwijl productie's `build/index.css` al eerder — los van dit onderzoek — volledig was bijgewerkt naar het nieuwe ontwerp (`.header__logo`, geen `#side-nav`/`.side-nav__content--logo`-regels meer). Zonder eigen CSS-regel viel het logo terug op de generieke `img { width:100%; }`-regel → veel te groot. **Bevestigd: niet veroorzaakt door HV-INT-006** — het gecorrigeerde bestand week alleen 3 tokens af van wat Kelvin als "huidige productie" aanleverde, en die 3 tokens zaten uitsluitend in JavaScript. |
| Kelvin bevestigt | De zijbalk hoort inderdaad weg te zijn — dat is de gewenste, huidige koers (bevestigd 24 augustus). |
| Fix | HTML bijgewerkt naar de reeds in de lokale git-werkkopie voorbereide (nooit geüploade) versie: `<aside id="side-nav">`-blok verwijderd, logo verplaatst naar `<a class="header__logo">` in de header-balk — exact het stuk uit de al bestaande, niet-gecommitte lokale wijziging, **exclusief** de taalkeuzeschakelaar (Polylang) die in dezelfde lokale wijziging zat. |
| Taalkeuzeschakelaar | Expliciet **niet** meegenomen — apart, later, pas zodra de Engelse vertaling er is (Kelvins instructie). |
| Geen CSS-wijziging nodig | De CSS voor `.header__logo` staat al goed live op productie. |
| Implementatiebewijs | `outputs/header-corrected-20260824-v2-sidebar-fix.php` (bevatte zowel de HV-INT-006 bridge-fix als deze HTML-correctie). **Bevestigd live 26 augustus 2026 (observations/O-017.md, EV-042):** een verse FTP-pull van productie was byte-voor-byte identiek aan dit bestand — `header__logo` aanwezig, `aside#side-nav` afwezig, geverifieerd via directe diff, geen onbekende afwijking. Gecommit en gepusht naar `origin/main` als `c9f6a5681ca7885e7ca12b1fb3a2a2ce49bc2745`, samen met de HV-INT-006-wijziging. |
| Resultaat | **Bevestigd (26 augustus 2026, EV-042):** logo op normale grootte, geen zijbalk zichtbaar — visueel bevestigd via de onafhankelijk herbevestigde productie-HTML. De HV-INT-006-validatiematrix (A–F plus meetgedrag) is inmiddels ook volledig afgerond, allen PASS (zie HV-INT-006 hierboven). |
| Verdict | **Root Cause Confirmed and Corrected — Fix Validated in Production, Repository Reconciliation Complete (26 augustus 2026).** |

---

## Wat hierna gebeurt

Dezelfde evidence/HV-IV-003.md-zoekopdrachten en evidence/HV-IV-004.md-AI-vragen herhalen op dag 7, 28, 56, 90, resultaat + confidence + verdict invullen (Earned/Provisionally Earned/Inconclusive/Not Earned/Harmful, measurement/HV-MP-001.md §13). Geen verdict vóór livegang (HV-MP-001 §13, No False Attribution).
