> Migrated unchanged from `solutions/visibility/HV-DB-001-visibility-dashboard.md`. Artifact ID preserved, full version history (v1–v4) kept.

# HV-DB-001 — HELIX Visibility Dashboard (Konnichiwa)

Per HV-MP-001 §15: de Owner View, één pagina, begrijpelijk zonder specialistische kennis.

**Live:** https://claude.ai/code/artifact/c6cef294-6f74-40cd-b6a1-5f168e218ab1

Status: ronde 0 (baseline), 22 juli 2026, v4 (23 juli 2026). Privé gepubliceerd. **v5 (24 juli 2026, hieronder) is een tekstuele regeneratie van deze .md-bestandsinhoud tegen de werkelijke evidence-state — de live gepubliceerde pagina zelf (bovenstaande link) is nog niet opnieuw gegenereerd en toont dus nog de v4-stand.**

---

## v2 (22 juli 2026)

Visibility Score vs. Measurement Readiness gescheiden (Readiness 30%, 6 deelcomponenten). AI-baseline genuanceerd (0/4 volledig correct, 2/4 deels, 2/4 onjuist, AI Factual Accuracy Score 25/100, gescoped als 1 van 30 scenario's). Beslissingen-paneel, actieve-doelen-tabel, wekelijkse strategie zichtbaar, actieplan in 3 emmers, interventies met lifecycle-status, risico's met severity/impact/eigenaar/deadline.

## Bewust nog niet gedaan

Volledige tab/inklap-navigatie — single-scroll met ankers blijft eenvoudiger.

## v3 (22 juli 2026, na trackingwerk)

Measurement Readiness 30% → 43% (GTM/consentbanner/30+ data-track-labels klaar in code). Zoekresultaten opnieuw gecheckt: geen wijziging (logisch, productie nog niet live). Nieuw kritiek risico: cateringformulier verstuurt nergens naartoe. Twee nieuwe matige bevindingen: geen Private Dining-aanvraagknop, geen Google Maps-routelink.

## v4 (23 juli 2026) — livegang HV-INT-002

HV-INT-002 bevestigd live (permalink-mismatch opgelost). Measurement Readiness 43% → 51% (GA4 gekoppeld). Structuuruitbreiding: Executive Summary-kaart, lifecycle-timeline, "Deze week bereikt", Prediction→Result→Verdict per interventiekaart, Capability-labels, Confidence-paneel. Bewust niet gebouwd: trendsparklines, Engineering Velocity, Lessons Learned, Growth Board-kanban, samengesteld Overall Confidence-percentage — wachten op echte, meerdere afgeronde validaties.

Nieuw, apart artefact: **Command Center** — https://claude.ai/code/artifact/237a2ae5-6b5c-46a8-8dd4-696800817ee2 — dagelijkse cockpit (prioriteit vandaag, goedkeuringen/blockers/late validaties/risico's, volgende strategierun).

## v5 (24 juli 2026) — regeneratie tegen werkelijke evidence-state

Reden: v4 toonde nog geen Guestplan-data, geen GA4-fix, en geen van de twee voorbereide websitefixes. Deze regeneratie gebruikt uitsluitend bestaande evidence, onderscheidt expliciet Measured/Pending/Unavailable/Not Configured per bron, en toont ontbrekende data nooit als 0.

### Databronstatus

| Bron | Status | Laatst gemeten | Kernbevinding |
|---|---|---|---|
| AI-representatie (evidence/HV-IV-004.md, evidence/HV-TS-001.md) | **Measured** | 22 juli 2026 | 0/4 systemen volledig correct op openingstijden; AI Factual Accuracy Score 25/100 — geldt voor 1 van 30 geplande scenario's, niet representatief voor "AI-begrip" in het algemeen |
| Lokale rangschikking, Utrecht-gecontroleerd (observations/O-003.md, EV-018) | **Measured** | 24 juli 2026, 06:41 | Konnichiwa positie 2 van 3 in Google local pack voor "omakase utrecht" — mobiel, incognito, Utrecht-regio bevestigd. Eén meetpunt/tijd/toestel; multi-punt-grid is toekomstige verbetering, geen blokkade. CR-005 **Resolved for Initial Baseline**. |
| Search Console (observations/O-001.md, EV-014) | **Measured** | 23 juli 2026 (dagcijfers t/m 21 juni door rapportagevertraging) | 906 clicks/29.215 vertoningen over de periode; teppanyaki positie 4,47, omakase 4,7 (bevestigd door EV-018), sushi 14,76 |
| Google Bedrijfsprofiel (observations/O-002.md, EV-015) | **Measured** | 23 juli 2026 (venster feb–jul) | Elke metriek daalt 6 maanden op rij — nog onverklaard, hoogste diagnoseprioriteit |
| GA4 — infrastructuur | **Measured** | 23–24 juli 2026 | Publicatie + Realtime-databinnenkomst bevestigd (HV-INT-003). Safari-bezoekers structureel ondergemeten (browserbeperking) |
| GA4 — trenddata | **Pending** | — | Te vers (<2 dagen) voor een bruikbare trend; geen historie vóór 23 juli 2026 |
| GA4 ↔ Guestplan kanaal-koppeling | **Not Configured** | — | Bestaat niet; nodig voor kanaal-specifieke conversieattributie (O-011) |
| Guestplan (observations/O-011.md, EV-016) | **Measured** | 24 juli 2026 (venster 23 apr–23 jul) | 576 reserveringen/1.976 gasten; teppanyaki domineert; 162-reserveringen-gat tussen twee rapporten onverklaard; 0% no-shows ongebruikelijk laag, nog te bevestigen |
| Website-techniek/indexatie (observations/O-005.md, O-006.md, O-007.md, evidence/HV-IV-007.md) | **Measured**, gedeeltelijk | 22–23 juli 2026 | Structured data ontbreekt (Blocked); `/nl/home-nederlands/` en `/store/omakase` niet eerder gecatalogiseerd |
| Search Console formele indexatiedekking | **Not Configured** (site-wide) — (22 juli 2026). **Update 22 sep 2026:** **Measured, gedeeltelijk** — één URL specifiek gecontroleerd | — (22 juli 2026); **22 sep 2026 (observations/O-005.md update)** | Apart rapport, nog niet opgehaald (22 juli 2026, blijft van kracht voor site-wide dekking). **Update 22 sep 2026:** `/omakase-utrecht/` specifiek gecontroleerd via URL-inspectie — **niet geïndexeerd / onbekend bij Google**, geen referring sitemap; Live URL Test toont het bereik als **wel actueel indexeerbaar**. Dit is expliciet **geen site-wide indexatiedekking-conclusie** — slechts één URL. Sitemap (`sitemap_index.xml`, ingediend 22 sep 2026, zie transformation/HV-IR-001.md HV-INT-008): **verwerking bevestigd (23 sep 2026) — 273 pagina's ontdekt**; de Omakase-URL zelf blijft bij herinspectie **onbekend bij Google / niet geïndexeerd**, geen crawl-bewijs — apart en ongewijzigd |
| Private Dining GSC-zichtbaarheid (observations/O-024.md) | **Measured** (Layer A–C: search visibility, query-allocatie, search-arrival) — **Not Measured** (Layer D–F: enquiry-interactie, succesvolle enquiry, business outcome) | 23 sep 2026 (venster 14–20 sep 2026) | `/private-dining/`: 350 vertoningen/7 kliks/2,0% CTR/pos. 4,81; voorgaande week ontbrak in export (**afwezig, niet als nul behandeld**). Query×pagina-tabel zichtbaar tot 10 rijen (o.a. "omakase utrecht" 3 kliks, meerdere merkqueries 0 kliks) — **onderhevig aan GSC-onderdrukking van individuele queryrijen**, niet arithmetisch gereconcilieerd naar de paginatotalen. Layer D–F ongewijzigd: productieformulier bestaat en is gehardened (O-022/O-023), maar geen GTM/GA4-instrumentatie, geen succesvolle enquiry, geen business-outcome-attributie geëvidenceerd (OC-007) |
| Private Dining succesvolle enquiry + `private_dining_enquiry` (observations/O-025.md) | **Measured** (Layer E: succesvolle enquiry, productie) — `private_dining_enquiry`: **Validated in GTM Preview; GA4 receipt observed; production verification outside Preview pending** | 26 sep 2026 | Minstens twee gecontroleerde productie-inzendingen. Succesbevestiging "Bedankt voor je aanvraag!" automatisch in beeld onder de fixed header (fix website-commit `41a88f8`; productiekopie **niet onafhankelijk hash-geverifieerd**). Eén `private_dining_enquiry`-entry in de dataLayer (`enquiry_type: 'private_dining'`, `submission_status: 'accepted'`), geen formulier-PII waargenomen in die entry. `GA4 - Event - private_dining_enquiry` "Gelukt" in GTM Preview; GA4 Realtime toonde het event (count `2` = alleen waargenomen Realtime-count, **geen** bewijs van dubbele firing). Gepubliceerde containerversie en GA4-ontvangst buiten Preview niet vastgesteld — O-021-definitie niet gehaald; keten blijft **4/6**. Layer F (business outcome) blijft Absent (OC-007) |
| `private_dining_enquiry` productieverificatie buiten Preview (observations/O-026.md) | **Production Verified** — kernevents 2026-W34-brief Prioriteit 3: **5/6** (events, geen lagen); `catering_enquiry` Not Production Verified; gate **OPEN** | 26 sep 2026 | Gepubliceerde GTM-container `GTM-WXH5P6SN` **Versie 9** (Live, geladen door gewone bezoekers) bevat GA4-eventtag `private_dining_enquiry` (`G-C29ZMF288W`, geen formulierveld-parameters), Custom Event-trigger en Google-tag; weergavenaam en werkruimte niet vastgesteld. Tag Assistant/Preview volledig losgekoppeld (bevestigd door Case Owner), daarna één nieuwe gecontroleerde productie-inzending: GA4 Realtime `private_dining_enquiry` = 1 (alleen ontvangst binnen Realtime-venster; `form_submit`/`form_start` = 1 alleen als zichtbare waarden). Geen business outcome, attributie (OC-007), duplicate-preventie op lange termijn of key-event-claim |
| `catering_enquiry` meetgereedheid (observations/O-027.md) | **Not Production Verified** — gap geregistreerd; kernevents blijven **5/6**; gate **OPEN** | 26 sep 2026 | Website (`41a88f8`): NL/EN-cateringformulier → `konnichiwa_handle_catering_inquiry()` → `wp_mail()` → `?catering_inquiry=success/error` (mailflow niet Production Verified). Succesmelding hangt alleen aan de GET-parameter, geen eenmalige serverreceipt (**measurement-authority gap**). `catering_enquiry` alleen als `data-track`-metadata, geen succes-only `dataLayer.push`. Gepubliceerde GTM-versie 9: geen catering-trigger/-tag (`catering` 0× in `gtm.js`); werkruimte niet geïnspecteerd. Apart: `/catering/` → 301 (Polylang) → `/en/catering/`, oorzaak niet vastgesteld. Case Owner-besluit: `catering_enquiry` = server-geaccepteerde succesvolle cateringaanvraag; Optie A (receipt-principe Private Dining) als **ontwerprichting, nog niet geïmplementeerd** |
| Reviews (observations/O-009.md) | **Measured**, gedeeltelijk | 22 juli 2026 | Aantallen/scores bekend (Google 4,1★/605, RestaurantGuru 4/827); recency/reactietijd **Pending** |
| Concurrenten (evidence/HV-IV-006.md, observations/O-010.md) | **Measured** | 22 juli 2026 | Ixi sterkste algemene concurrent; geen directe Utrecht-omakase-concurrent |
| Mobiele/desktop performance (observations/O-012.md, EV-017) | **Measured** | 24 juli 2026 (CrUX-venster 24 jun–21 jul) | Core Web Vitals **Passed** op mobiel én desktop (LCP 2,4s, INP 135ms, CLS 0). Aandachtspunt: TTFB "poor" bij 26% van mobiele paginabezoeken — oorzaak nog niet onderzocht. Lighthouse-labscores (0-100) niet opgehaald. |
| HV-INT-001 (structured data) | **Prepared, niet live** | 22 juli 2026 (ontwerp) | Blocked — kernfix nog niet geplaatst |
| HV-INT-002 (omakase/teppanyaki-pagina's) | **Measured, live** | 22 juli 2026 | Live — Awaiting First Validation (dag 7: 29 juli 2026) |
| HV-INT-003 (GA4-publicatie) | **Measured, live** | 23–24 juli 2026 | Provisionally Earned — mechanisme bevestigd, meerdaagse trend nog niet |
| HV-INT-004 (popup-fix) | **Prepared, niet live** | 24 juli 2026 | Wacht op FTP door Kelvin |
| HV-INT-005 (mobiele titel-fix) | **Prepared, niet live** | 24 juli 2026 | Wacht op FTP door Kelvin |

### Baseline-status (bijgewerkt na O-003/O-012-afronding)

Alle 12 O-observaties zijn nu Collected of Informed — de baseline is formeel **Established** (work-objects/WO-001-search-visibility-baseline.md, alle 9 acceptatiecriteria gehaald). Dit betekent niet dat alles begrepen is: de GBP-daling, het Guestplan-reserveringsgat en de TTFB-bevinding blijven onverklaard en wachten op Organizational Diagnosis.

### Wat hier bewust niet in staat

Nog steeds geen samengesteld "Visibility Score" of "Overall Confidence"-percentage — 2 interventies staan nog niet live, en de GBP-daling is onverklaard, dus zo'n percentage zou meer precisie suggereren dan de data toelaat (HV-MP-001 §18, Data Quality Rules). Baseline Established gaat over de kwaliteit van het bewijsfundament, niet over of alle vragen al beantwoord zijn.

### Nog te doen voor de live pagina

Deze regeneratie betreft alleen dit bronbestand. De gepubliceerde Owner View (bovenstaande link) en het Command Center-artefact zijn nog niet opnieuw gepubliceerd tegen deze v5-inhoud — dat is een aparte, nog niet uitgevoerde stap.

## v6 (21 augustus 2026) — weekly review W34

Reden: eerste wekelijkse review (decisions/DD-003) sinds case-establishment; zie measurement/2026-W34-visibility-brief.md voor de volledige brief. Deze regeneratie voegt twee nieuwe databronregels toe en laat Measurement Readiness ongewijzigd.

### Databronstatus — nieuwe/gewijzigde regels sinds v5

| Bron | Status | Laatst gemeten | Kernbevinding |
|---|---|---|---|
| Google Bedrijfsprofiel — reviews/rating (Owner Declaration, 21 aug 2026) | **Measured** | 21 augustus 2026 | 4,1★ / 626 reviews. Geregistreerd als **+1 t.o.v. de vorige 625-waarneming via dezelfde methode** (Owner Declaration, lokaal paneel, observations/O-003.md-addendum, 24 juli 2026) — niet t.o.v. de 605-waarneming (evidence/HV-IV-001.md, algemene zoekresultaten, andere methode). Challenge Evidence/CR-register.md CR-006 (605 vs. 625) blijft **open, niet opgelost**; deze nieuwe waarneming lost dat verschil niet op en mag er niet stilzwijgend mee vermengd worden. Ratingverandering: geen. |
| TheFork — rating en review-aantal | **Measured, gedeeltelijk** | 21 augustus 2026 | Rating 9,1/10 bruikbaar. Review-aantal **bronconflicterend** — verschillende TheFork-oppervlakken tonen verschillende aantallen. Zie Challenge Evidence/CR-register.md CR-007 (nieuw). Geen enkel aantal wordt hier als "het" aantal gekozen. |

Duiding (Reputation, niet samengevoegd tot één cijfer, HV-MP-001 §4): het +1-review-signaal en de stabiele rating zijn een **andere metriek-familie** dan claims/OC-002's engagement-daling (interacties, websiteklikken, routes, telefoontjes, menuweergaven, afspraken) — zie de toegevoegde scope-notitie in claims/OC-002-competing-explanations-register.md. Eén cijfer omhoog bij reviews weerlegt of bevestigt OC-002 niet; het is een apart, smal gemeten signaal.

Measurement Readiness: **blijft 51%** (v4, GA4-koppeling) — er bestaat geen vastgelegde berekeningsformule om een nieuw percentage af te leiden uit de bevindingen van deze week. Status: **Awaiting remeasurement.** Geen nieuw percentage wordt uitgevonden.

Nieuwe/bijgewerkte artefacten deze week: measurement/HV-SCR-001-source-consistency-register.md (nieuw — neutrale registratie van naam/adres/telefoon/uren per bron, geen correctie of schadeclaim), design/HV-CHM-001-canonical-hours-model.md (nieuw — intern ontwerp, niet gepubliceerd), transformation/HV-IR-001.md HV-INT-002 (validatie dag 7 blijkt niet uitgevoerd — nu geregistreerd als achterstallig, herstelactie gepland).

### Wat hier bewust niet in staat

Nog steeds geen samengesteld "Visibility Score" of "Overall Confidence"-percentage (ongewijzigd t.o.v. v5). Geen nieuwe entity-naming-correctie of -classificatie — diagnosis/OD-003 en decisions/DD-022 blijven autoritatief; het Source Consistency Register registreert alleen, het herclassificeert niets.

## Bijwerken

Los gepubliceerde pagina's, geen bestanden die automatisch meelopen met de case. Bijwerken zodra echte cijfers binnenkomen (na exports/validatierondes).
