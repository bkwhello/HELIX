> Migrated unchanged from `solutions/visibility/HV-IV-007-bestaande-content.md`, 22 juli 2026. Artifact ID preserved.

# HV-IV-007 — Existing Knowledge Asset Investigation (Konnichiwa)

Doel: huidige pagina's, content, menu's, schema en media beoordelen.

Status: eerste ronde afgerond. Belangrijkste vondst: het menu staat op een manier online die zoekmachines/AI waarschijnlijk niet kunnen lezen.

---

## Paginaregister

| Pagina | Bestaat? | Toestand |
|---|---|---|
| Homepage | Ja | Compleet, actueel |
| /sushi-utrecht/ | Ja | Stevig — 800–1000 woorden |
| /japans-restaurant-utrecht/, /sushi-afhalen-utrecht/, /sushi-bezorgen-in-utrecht/, /arrangements/, /sushi-workshop/, /catering/, /bento-lunch/, /about-us/ | Ja | Niet inhoudelijk gecontroleerd |
| "Sushi bestellen Utrecht" | **Nee** | Niet gevonden |
| "Sushi in English" | **Nee** | Niet gevonden |
| **Omakase** | **Nee** | Alleen homepage-sectie, geen eigen pagina |
| /sushi-page-2/ | Ja, problematisch | Zie bevinding 2 |
| /blog/ + /hello-world/ | Ja, leeg | Zie bevinding 3 |

## Bevindingen

1. **Menu waarschijnlijk onzichtbaar voor zoekmachines/AI.** Beide menu's staan als Adobe InDesign-viewer (JS-geladen), niet als gewone pagina — waarschijnlijk de verklaring voor HV-IV-004's fout op prijs/gangen. Machine Accessibility Failure (EC-002-VD-008).
2. **Dubbele/foutieve pagina:** `/sushi-page-2/`, kapotte title "Sushi Page @ ...", dupliceert homepage.
3. **Verlaten WordPress-standaardcontent:** `/hello-world/`.
4. **Positief:** bestaande landingpagina's zijn niet dun.
5. **Rank Math SEO-plugin** al geïnstalleerd — structured data mogelijk deels via plugin-instellingen te configureren.

**EV-013** — Source: sitemap + directe paginachecks. Date: 22 juli 2026. Reliability: Hoog voor structuur, Middel voor kwaliteit. Limitations: niet alle pagina's inhoudelijk gecontroleerd; geen Rank Math-instellingenscherm-toegang.

## Aanbevolen vervolg

1. Menu machine-leesbaar maken.
2. `/sushi-page-2/` verwijderen of redirecten.
3. `/hello-world/` verwijderen.
4. Rank Math-instellingen checken vóór los JSON-LD-blok plaatsen.
