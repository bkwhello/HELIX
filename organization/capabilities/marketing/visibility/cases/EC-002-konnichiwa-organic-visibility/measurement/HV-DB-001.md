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
| Search Console formele indexatiedekking | **Not Configured** | — | Apart rapport, nog niet opgehaald |
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

## Bijwerken

Los gepubliceerde pagina's, geen bestanden die automatisch meelopen met de case. Bijwerken zodra echte cijfers binnenkomen (na exports/validatierondes).
