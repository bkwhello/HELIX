# HV-VCM-001 — Konnichiwa Visibility Coverage Map

Status: Draft v0.1

Discipline: HELIX Visibility

Governing Standard: HV-001

Reference Model: RM-HV-001 (Visibility Lifecycle)

Grounded In: HV-IV-001 through HV-IV-007

---

## Wat dit is

De blueprint die alles uit de investigaties samenbrengt: welke klantvragen (intents) heeft Konnichiwa, welk contentstuk (knowledge asset) beantwoordt die vraag vandaag, waar zit een gat (evidence gap / defect), en wat is de prioriteit. Dit is het eerste concrete "we weten nu genoeg om te handelen"-document van de case.

Per RM-HV-001: een Coverage Map positioneert Knowledge Assets tegen Intents en Evidence Gaps. Per HV-P-006 (Small Enterprise-regel) blijft de bijbehorende backlog op maximaal 5 actieve punten.

---

## Intent-dekkingstabel

| Intent | Huidige dekking | Bestaand asset | Gat / defect | Prioriteit |
|---|---|---|---|---|
| Konnichiwa opening hours | Zwak — geen enkel van 4 geteste AI-systemen gaf juiste tijden (HV-IV-004) | Homepage (tekst aanwezig, niet machine-leesbaar) | Contradictory Representation + Machine Accessibility Failure (HV-IV-007: geen structured data) | **1 — hoog** |
| Omakase Utrecht | Zwak generiek (HV-IV-003), wel herkend bij directe vraag (HV-IV-004), maar onderliggend menu niet leesbaar (HV-IV-007) | Alleen een homepage-sectie ("Omakase Exclusive"), geen eigen pagina; menu's als niet-crawlbare InDesign-viewer | Intent Coverage Gap + Machine Accessibility Failure + Missing Representation (sushi-omakase op verzoek stond nergens) | **2 — hoog** |
| Teppanyaki Utrecht | Sterk — leidende positie (HV-IV-003), concurrent Juliana zwak (HV-IV-006) | sushi-utrecht/, homepage, menu (niet-crawlbaar, maar minder kritiek zolang tekstuele vermelding elders sterk is) | Geen — bewaken, niet investeren | Geen actie |
| Sushi Utrecht | Neutraal — zichtbaar, één van meerdere (HV-IV-003) | /sushi-utrecht/ (stevig, 800–1000 woorden, HV-IV-007) | Geen acuut gat; concurrentieveld is druk maar niet verloren | Monitoren |
| Naamgeving als entiteit ("Konnichiwa") | Verzwakt — 3 varianten in omloop: Konnichiwa / Konnichi Wa / Konichiwa (HV-IV-001, HV-IV-003) | Diverse externe profielen (Facebook, Instagram, Yelp, Tripadvisor, Eet.nu) | Entity Ambiguity — bemoeilijkt automatische koppeling van alle vermeldingen aan dezelfde zaak | 3 — vereist eigenaarstoegang, niet iets ik kan uitvoeren |
| Overige ~34 kandidaat-intents (EC-002 §12) | Onbekend | Onbekend | Geen bewijs verzameld — bewust niet geprioriteerd (HV-P-001) | Nog te onderzoeken |

---

## Losse (niet-intent-specifieke) defecten gevonden

| Defect | Type | Status |
|---|---|---|
| `/sushi-page-2/` — kapotte titel, dupliceert homepage | Contradictory/Duplicate Representation | Voorstel: verwijderen of 301-redirecten (HV-IV-007) |
| `/hello-world/` — verlaten WordPress-standaardpost | Stale Representation (klein) | Voorstel: verwijderen |
| Sluitingsmelding zonder jaartal | Stale/Ambiguous Representation | **Opgelost** — tekst met jaartal (2026) al klaargezet (HV-IV-004) |

---

## Voorgestelde eerste Visibility Backlog (max. 5, per HV-P-006)

1. **Structured data publiceren** — corrigeerde openingstijden (22:00 basis), gedateerde sluitingsmelding, via Rank Math of handmatig JSON-LD. *Klaar om te plaatsen* (`structured-data-website.md`). Sluitingsmelding-jaartal is al gecorrigeerd in `front-page.php` op de lokale site.
2. **Omakase-pagina publiceren** — beide varianten (teppanyaki-omakase vast menu, sushi-omakase op verzoek), prijzen als leesbare tekst, niet alleen via het menu. **Gebouwd** als `omakase-utrecht.php` in de lokale theme (met eigen schema.org Menu/MenuItem-markup voor de prijzen) — wacht op: WP-pagina aanmaken + template koppelen, dan FTP.
3. **`/sushi-page-2/` opruimen** — laten verwijderen of doorverwijzen door de sitebeheerder.
4. **`/hello-world/` verwijderen.**
5. **Naamgeving op eigen accounts gelijktrekken** naar "Konnichiwa" (Instagram-bio, Facebook-paginanaam, Eet.nu, Google Bedrijfsprofiel, en waar mogelijk Yelp/Tripadvisor-titel corrigeren van "Konichiwa") — vereist jouw eigen account-toegang, ik kan dit niet uitvoeren.

Punten 1–4 zijn voorbereid en wachten alleen op plaatsing. Punt 5 vraagt actie van jou zelf.

---

## Wat hierna gemeten wordt (validatie, per RM-HV-001)

Zodra de backlog is uitgevoerd: dezelfde zoekopdrachten uit HV-IV-003 en dezelfde vier AI-vragen uit HV-IV-004 herhalen, en vergelijken of de openingstijden en omakase-info dan wél correct terugkomen. Dat is het eerlijke bewijs of dit heeft gewerkt — niet alleen dat er iets gepubliceerd is.

---

## Buiten deze eerste versie

De overige ~34 kandidaat-intents, een diepere concurrentieanalyse, en de exacte teppanyaki-sluitingstijd blijven bewust buiten deze eerste kaart — die wachten op verder bewijs (HV-IV-008/009/010) voor ze zinnig meegenomen kunnen worden.
