# HV-IV-007 — Existing Knowledge Asset Investigation (Konnichiwa)

Doel (per EC-002 §25): de huidige pagina's, content, menu's, schema en media van Konnichiwa beoordelen — wat is er al, en in welke staat?

Methode: sitemap van konnichiwa.nl opgehaald en de belangrijkste pagina's afzonderlijk gecontroleerd.

Status: **eerste ronde afgerond.** Belangrijkste vondst: het menu (inclusief de omakase-informatie die HV-IV-005 gebruikte) staat op een manier online die zoekmachines en AI-systemen waarschijnlijk niet kunnen lezen.

---

## Paginaregister (uit sitemap)

| Pagina | Bestaat? | Toestand |
|---|---|---|
| Homepage | Ja | Compleet, professioneel, actuele info |
| /sushi-utrecht/ | Ja | Stevig — 800–1000 woorden, eigen koppen, geen dun/placeholder-pagina |
| /japans-restaurant-utrecht/ | Ja | Nog niet inhoudelijk gecontroleerd |
| /sushi-afhalen-utrecht/ | Ja | Nog niet inhoudelijk gecontroleerd |
| /sushi-bezorgen-in-utrecht/ | Ja | Nog niet inhoudelijk gecontroleerd |
| /arrangements/ | Ja | Nog niet inhoudelijk gecontroleerd |
| /sushi-workshop/ | Ja | Nog niet inhoudelijk gecontroleerd |
| /catering/ | Ja | Nog niet inhoudelijk gecontroleerd |
| /bento-lunch/ | Ja (dit is de "lunch"-pagina) | Nog niet inhoudelijk gecontroleerd |
| /about-us/ | Ja | Nog niet inhoudelijk gecontroleerd |
| "Sushi bestellen Utrecht" (los) | **Nee** | Niet gevonden als eigen pagina — waarschijnlijk opgevangen door afhalen/bezorgen-pagina's |
| "Sushi in English" | **Nee** | Geen eigen Engelstalige pagina gevonden |
| **Omakase** | **Nee** | Alleen een sectie/anchor op de homepage ("Omakase Exclusive", met een "Request More Info"-link) — geen eigen, indexeerbare pagina |
| /sushi-page-2/ | Ja, maar problematisch | Zie bevinding 2 hieronder |
| /blog/ + /hello-world/ | Ja, maar leeg | Zie bevinding 3 hieronder |

---

## Bevindingen

### 1. Menu is waarschijnlijk onzichtbaar voor zoekmachines en AI — grootste vondst

Beide menu's (Teppan Yaki en Sushi & Izakaya) staan niet als gewone webpagina op konnichiwa.nl, maar als losse Adobe InDesign-viewers (indd.adobe.com). Deze viewers laden hun inhoud met JavaScript. Toen ik dezelfde link eerder probeerde op te halen voor de omakase-pagina (HV-IV-005-uitwerking), kreeg ik alleen een lege "Publish Online"-pagina terug, geen tekst — precies het soort probleem dat een zoekmachine-crawler ook tegenkomt.

**Consequentie:** de prijzen, gangen en beschrijvingen die we net hebben gebruikt om de omakase-pagina te ontwerpen, staan mogelijk nergens machine-leesbaar op het web — niet op konnichiwa.nl, niet elders. Dit is een directe verklaring voor waarom AI-systemen in HV-IV-004 geen prijs/aantal gangen konden noemen: die informatie was voor ze niet te lezen, niet omdat hij ontbreekt maar omdat hij "op slot" staat in een viewer. Dit is een **Machine Accessibility Failure** (EC-002-VD-008) en waarschijnlijk de belangrijkste bevinding uit deze hele investigatie tot nu toe.

### 2. Dubbele/foutieve pagina: "Sushi Page @"

`/sushi-page-2/` bestaat, is live, en heeft een kapotte title-tag: **"Sushi Page @ - Japanese restaurant Konnichiwa Utrecht"** — die losse "@" wijst op een niet-ingevulde sjabloonwaarde (waarschijnlijk een SEO-titelsjabloon dat een variabele miste). De inhoud lijkt bovendien de homepage te dupliceren in plaats van iets eigens te bieden. Dit is precies het soort interne duplicatie waar EC-002 §12 voor waarschuwt.

### 3. Verlaten WordPress-standaardcontent

`/blog/` bestaat als structuur, maar bevat alleen `hello-world/` — de standaard WordPress-voorbeeldpost die nooit is verwijderd. Kleine, makkelijk te verhelpen kwestie.

### 4. Positief: bestaande landingpagina's zijn niet dun

De pagina's die wel bestaan (bijv. sushi-utrecht) zijn inhoudelijk stevig, niet de "dunne, voor-elk-zoekwoord-een-paginaatje"-aanpak die HV-001 (HV-P-004) juist wil voorkomen. Dat is een compliment aan hoe de site al is opgezet.

### 5. Praktische meevaller: Rank Math SEO-plugin al geïnstalleerd

De sitemap wordt gegenereerd door de Rank Math SEO-plugin. Dat betekent dat structured data (schema-markup, openingstijden, bedrijfstype) mogelijk al deels via de instellingen van die plugin te configureren is, in plaats van dat er per se los, met de hand JSON-LD-code geplakt hoeft te worden zoals eerder voorgesteld in `structured-data-website.md`. Dat kan het praktisch eenvoudiger maken — zie update in dat document.

---

## Evidence Log

**EV-013** — Source: konnichiwa.nl sitemap (page-sitemap.xml, post-sitemap.xml) en directe paginachecks (/sushi-page-2/, /sushi-utrecht/). Date: 22 juli 2026. Reliability: Hoog voor het bestaan/de structuur van pagina's; Middel voor kwaliteitsbeoordeling (geautomatiseerde samenvatting, geen menselijke visuele check). Limitations: niet alle pagina's inhoudelijk gecontroleerd (zie tabel); geen toegang tot Rank Math-instellingenscherm zelf om te bevestigen wat al geconfigureerd is.

---

## Aanbevolen vervolg

1. **Hoogste prioriteit, nieuw:** het menu machine-leesbaar maken — óf de inhoud (in elk geval omakase-relevante delen) ook als gewone HTML-tekst op de site zetten, óf minimaal de kerninfo (gangen, prijzen) opnemen in de nieuwe omakase-pagina zelf (die toch al gepland is) zodat die informatie sowieso ergens leesbaar staat.
2. `/sushi-page-2/` laten verwijderen of doorverwijzen (301-redirect) door de sitebeheerder.
3. `/hello-world/` verwijderen.
4. Checken of Rank Math al schema-instellingen heeft staan, voordat het JSON-LD-blok apart wordt geplakt (dubbele schema kan zelf weer een nieuw defect worden).

Dit zijn voorstellen, geen wijzigingen — net als bij de structured data en de omakase-pagina publiceer ik niets zelf.
