> Migrated unchanged from `solutions/visibility/HV-DB-001-visibility-dashboard.md`. Artifact ID preserved, full version history (v1–v4) kept.

# HV-DB-001 — HELIX Visibility Dashboard (Konnichiwa)

Per HV-MP-001 §15: de Owner View, één pagina, begrijpelijk zonder specialistische kennis.

**Live:** https://claude.ai/code/artifact/c6cef294-6f74-40cd-b6a1-5f168e218ab1

Status: ronde 0 (baseline), 22 juli 2026, v4 (23 juli 2026). Privé gepubliceerd.

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

## Bijwerken

Los gepubliceerde pagina's, geen bestanden die automatisch meelopen met de case. Bijwerken zodra echte cijfers binnenkomen (na exports/validatierondes).
