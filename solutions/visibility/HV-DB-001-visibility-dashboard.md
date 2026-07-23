# HV-DB-001 — HELIX Visibility Dashboard (Konnichiwa)

Per HV-MP-001 §15: de Owner View, één pagina, begrijpelijk zonder specialistische kennis.

**Live:** https://claude.ai/code/artifact/c6cef294-6f74-40cd-b6a1-5f168e218ab1

Status: ronde 0 (baseline), 22 juli 2026, v2 (bijgewerkt na feedback dezelfde dag). Privé gepubliceerd — deel 'm zelf als je dat wilt.

---

## Wat erin staat (v2)

- **Visibility Score vs. Measurement Readiness — nu gescheiden.** De echte Visibility Score blijft "Niet beschikbaar" (correct, per HV-MP-P-006), maar een aparte Measurement Readiness-score (30%, opgebouwd uit 6 meetbare deelcomponenten: databronnen aangesloten, baseline voltooid, tracking actief, AI-tests voltooid, kritieke feiten gevalideerd, doelen ingesteld) laat zien dat het systeem wél vooruitgang boekt.
- **AI-baseline genuanceerd.** In plaats van één hard "0%" nu: 0/4 volledig correct, 2/4 gedeeltelijk correct, 2/4 onjuist, plus een gewogen AI Factual Accuracy Score (25/100 — nieuwe formule vastgelegd in HV-MP-001, zie sectie "AI Factual Accuracy Score"), met een expliciete kanttekening dat dit 1 van 30 geplande testscenario's is.
- **Beslissingen gevraagd** — apart paneel met de 3 openstaande besluiten (livegang-datum, exports aanleveren, doeldata bevestigen).
- **Actieve doelen-tabel** — huidig/target/deadline/status per doel, gemarkeerd als voorstel.
- **Strategie deze week** — wekelijks maandagritme zichtbaar gemaakt.
- **Actieplan in 3 aparte emmers**: acties (technisch), correcties door eigenaar (externe accounts), datadependencies (exports) — niet meer één platte lijst.
- **Interventies met echte lifecycle-status** (Awaiting Deployment, Approval/Implementation/Blocker/Validatie-velden) i.p.v. alleen "Pending".
- **Risico's met severity, impact, eigenaar en deadline.**
- Artefactcodes (HV-xxx) zijn nu secundair/klein; menselijke uitleg staat voorop.
- Sticky statusbalk bovenaan met live tellingen en sectienavigatie.

## Bewust nog niet gedaan

Volledige tab/inklap-navigatie (P3) is niet gebouwd — de pagina is lang, maar single-scroll met ankers blijft eenvoudiger en minder foutgevoelig dan JS-tabs in een statische pagina. Kan alsnog als de lengte gaat storen.

## v3 (22 juli 2026, zelfde dag) — na trackingwerk

- Measurement Readiness omhoog van 30% naar **43%** — reëel, aantoonbaar: trackinginfrastructuur (GTM, consentbanner, 30+ data-track-labels) is nu klaar in code, ook al is er nog geen data die binnenkomt.
- Zoekresultaten van HV-IV-003 opnieuw gecheckt: **geen wijziging** t.o.v. ronde 0 — logisch, productie is nog niet live gezet. Vastgelegd als "laatst geverifieerd" i.p.v. een nieuwe ronde te claimen die er niet is.
- Nieuw kritiek risico: het cateringformulier op `page-catering.php` verstuurt nergens naartoe (geen `action`, geen verwerking) — cateringaanvragen gaan nu onopgemerkt verloren. Vierde beslissing toegevoegd: welke oplossing (mailto, Mollie Forms, eigen script)?
- Twee nieuwe matige/lage bevindingen: "Private Dining" op de homepage heeft geen aanvraagknop, en er staat nergens een Google Maps-routelink op de site.

## v4 (23 juli 2026) — livegang HV-INT-002 + HELIX Visibility Operating System-uitbreiding

- HV-INT-002 (omakase- & teppanyaki-menupagina's) bevestigd **live**, na het oplossen van een permalink-mismatch (pagina's waren aangemaakt als `/omakase/` en `/teppan-yaki-menu/` i.p.v. de slugs die de code verwachtte). Verdict: Live — Awaiting First Validation, dag-7 op 29 juli 2026.
- Measurement Readiness 43% → **51%** (GA4 nu ook echt gekoppeld in GTM, bevestigd door Kelvin).
- Grote structuuruitbreiding na uitgebreide eigenaarsfeedback: één Executive Summary-kaart bovenaan (status/Visibility/Readiness/tellingen/volgende strategierun), een lifecycle-timeline (Baseline → HV-INT-002 live → dag-7/28/56/90-validatie), een "Deze week bereikt"-sectie, Prediction→Result→Verdict op elke interventiekaart, Capability-labels (Technical Visibility/Local Presence/Knowledge) i.p.v. "Eigenaar", en een Confidence-paneel.
- **Bewust niet gebouwd, ook al gevraagd:** trendsparklines (1 meetpunt = geen trend), Engineering Velocity/success rate (0 afgeronde interventies = verzonnen cijfers), Lessons Learned (nog geen validatie gedaan), een volwaardig Growth Board-kanban (bij 2 interventies voegt een bord niets toe), en een samengesteld "Overall Confidence"-percentage (zou preciezer lijken dan de meting toelaat). Worden alsnog gebouwd zodra er echte, meerdere afgeronde validaties zijn — met echte cijfers, niet nu al met placeholders.
- **Nieuw, apart artefact: Command Center** — https://claude.ai/code/artifact/237a2ae5-6b5c-46a8-8dd4-696800817ee2 — de dagelijkse cockpit: prioriteit van vandaag, aantal goedkeuringen/blockers/late validaties/risico's, volgende strategierun. Niets meer. Beide artefacten linken naar elkaar.

## Bijwerken

Dit zijn los gepubliceerde pagina's, geen bestanden die automatisch meelopen met de rest van de case. Zodra er echte cijfers zijn (na exports/validatierondes), moet de inhoud opnieuw gegenereerd worden — zeg het gewoon wanneer dat zover is.
