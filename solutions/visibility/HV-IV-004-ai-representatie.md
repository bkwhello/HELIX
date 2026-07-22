# HV-IV-004 — AI Representation Investigation (Konnichiwa)

Doel (per EC-002 §25): vaststellen hoe grote AI-systemen Konnichiwa nu begrijpen en aanbevelen.

Belangrijke beperking, meteen vooraf: ik heb geen live toegang tot ChatGPT, Gemini of Perplexity — ik kan die systemen niet voor je bevragen. Wat ik wel eerlijk kan doen is mezelf (Claude) als één AI-systeem testen, en jou exacte vragen geven om zelf in de andere systemen te stellen. Dat laatste is voor deze investigatie het zwaarste bewijs, niet wat ik hieronder rapporteer.

Status: **eerste ronde afgerond** — Claude (zelftest) plus vier live geraadpleegde systemen door Kelvin: DeepSeek, ChatGPT, Gemini, Perplexity.

---

## Zelftest — Claude zonder zoektool

Ik heb mezelf de vraag gesteld die een gast zou stellen, zonder een zoekopdracht te gebruiken — dus puur op basis van wat er "ingebakken" in het model zit, niet wat ik net heb opgezocht in HV-IV-003.

**Vraag:** "Wat is een goed teppanyaki/sushi restaurant in Utrecht?"

**Eerlijk resultaat:** mijn parametrische kennis van Konnichiwa specifiek is zwak. Ik herken de naam als een Japans restaurant in Utrecht, maar zonder zoekopdracht zou ik het **niet** met overtuiging als topaanbeveling noemen — mijn interne kennis van kleinere, lokale restaurants is nu eenmaal beperkt en niet actueel.

**Waarom dit toch bruikbaar bewijs is:** het laat zien dat AI-aanbeveling voor dit soort lokale vraag waarschijnlijk **niet** leunt op wat het model "uit zijn hoofd" weet, maar op live zoek-/browsegedrag — dus precies de bronnen die in HV-IV-003 zijn onderzocht. Als een AI-systeem live zoekt voordat het antwoordt, erft het dezelfde risico's die daar al zijn gevonden: naamgeving die niet overal hetzelfde is ("Konnichiwa" / "Konnichi Wa" / "Konichiwa"), en een openingstijden-tegenspraak in minstens één bron. Een AI-systeem dat toevallig de foute bron pakt, kan dus een gast net zo goed verkeerd informeren als een zoekmachine dat kan.

---

## Evidence Log

**EV-005**
Source: Claude (dit systeem), koude bevraging zonder externe zoekopdracht
Date: 22 juli 2026
Collection method: zelftest, geen tool-gebruik
Reliability: Laag als directe uitspraak over "hoe AI Konnichiwa aanbeveelt" — Claude is niet representatief voor ChatGPT/Gemini/Perplexity, en veel AI-assistenten zoeken tegenwoordig live in plaats van op parametrische kennis te vertrouwen
Limitations: één model, geen zoekgrond, geen vergelijking met live-browsende AI-antwoorden; zegt iets over kwetsbaarheid van het mechanisme, niets zeker over wat andere systemen nu daadwerkelijk zeggen
Related observation: HV-IV-003 (dezelfde bronproblemen zouden AI-antwoorden kunnen beïnvloeden als AI-systemen live zoeken)

---

## Live resultaten (door Kelvin verzameld, 22 juli 2026)

### Openingstijden per systeem

| Systeem | Genoemde tijden | Komt overeen met HV-IV-002 (ma–do 16:00–21:30, vr–zo 12:00–21:30)? |
|---|---|---|
| DeepSeek | Middag 12:00–16:45, avond vanaf 17:00 (gesplitste dagindeling) | Nee — heel andere structuur, bron zelf genoemd als "externe reserveringssite" |
| ChatGPT | Citeert officiële site correct (keuken 16:00–21:30 / 12:00–21:30), maar toont ook twee afwijkende bronnen ernaast: "Centrum Utrecht" (16:00–23:00 / 12:00–23:00) en TheFork (wo 17:00–22:00, vr 12:00–22:00) | Deels — herkent de juiste bron, maar presenteert hem naast twee foute bronnen zonder ze als fout te markeren |
| Gemini | ma–do 16:00–22:00, vr–zo 12:00–22:00 | Nee — 30 minuten te laat als sluitingstijd |
| Perplexity | Sushi-keuken ma–do 16:00–21:30, vr–zo 12:00–22:00; teppanyaki-keuken dagelijks 17:00–22:00 (twee aparte schema's) | Deels — sushi ma–do klopt, de rest wijkt af of is nieuw (teppanyaki-schema stond nog niet in het register) |

**Geen van de vier systemen geeft het volledig kloppende schema terug.** Dit is de zwaarste bevinding tot nu toe in de hele case: fout over openingstijden is precies het soort fout dat een gast voor een gesloten deur zet.

### Twee nieuwe, nog onbevestigde vragen die uit deze ronde komen

HV-IV-002 registreerde één schema voor het hele restaurant. Deze AI-antwoorden suggereren dat de werkelijkheid mogelijk fijnmaziger is dan wat is vastgelegd:

1. **Keuken vs. restaurant/bar** — ChatGPT citeert de officiële site specifiek als "keuken"-tijden. Blijft de zaak zelf (bar/zitgedeelte) langer open dan de keuken?
2. **Sushi vs. teppanyaki apart schema** — Perplexity noemt teppanyaki dagelijks 17:00–22:00, los van de sushi-tijden. Klopt dat, of is dit verzonnen?

Dit moet terug het register in zodra bevestigd — dan wordt HV-IV-002 zelf ook gecorrigeerd (HV-P-008, traceerbare correctie).

### Sluitingsmelding zonder jaartal

ChatGPT signaleerde dat de vakantiemelding op de website ("Sushi closed from monday 3 August till Tuesday 11 August… We're all back from 13 August") geen jaartal noemt. Een goede vangst — voor een gast of een AI-systeem dat de pagina op een ander moment leest, is dat ambigu. Dit is een concrete, kleine correctie voor de website.

### Omakase

Drie van de vier systemen (ChatGPT, Gemini, Perplexity) bevestigen dat Konnichiwa omakase aanbiedt wanneer er **direct naar het restaurant** wordt gevraagd — dat is een ander resultaat dan HV-IV-003, waar Konnichiwa zwak scoorde op de **generieke** zoekopdracht "omakase Utrecht". Beide kunnen tegelijk waar zijn: het systeem weet dát Konnichiwa omakase doet zodra het over Konnichiwa gaat, maar Konnichiwa komt niet vanzelf naar boven als iemand alleen "omakase Utrecht" vraagt zonder de naam te noemen.

ChatGPT's beoordeling is het meest bruikbaar: omakase staat wel op de website ("Omakase Exclusive — Trust the chef"), maar zonder eigen pagina, prijs, aantal gangen, beschikbare tijden, of directe boekingsmogelijkheid ("Request More Info" only). Dat is precies het soort onderbouwing dat HV-001 (HV-P-004, Intent-Justified Assets) vereist voordat een landingspagina wordt aangelegd — hier lijkt de behoefte gegrond.

**Tegenstrijdigheid: wie doet de omakase?** Gemini noemt expliciet "chef-kok Kelvin Wong" als degene die het omakase-menu samenstelt. Perplexity noemt in plaats daarvan "chef Rocky (en team)". Dit kan een verzinsel van één van de twee zijn (AI-systemen doen dat), of allebei kunnen kloppen als het over verschillende rollen gaat (eigenaar vs. hoofdchef). Dit moet bevestigd worden — zie vragen hieronder.

---

## Evidence Log

**EV-006** — DeepSeek. Source: live bevraging door Kelvin, 22 juli 2026. Reliability: Middel, self-reported door bron zelf als "externe reserveringssite". Limitations: exacte prompt niet letterlijk vastgelegd, geen schermafbeelding.
**EV-007** — ChatGPT. Source: live bevraging door Kelvin, 22 juli 2026. Reliability: Hoog voor brongebruik (citeert en vergelijkt meerdere bronnen expliciet), Middel voor de conclusie zelf. Limitations: idem.
**EV-008** — Gemini. Source: live bevraging door Kelvin, 22 juli 2026. Reliability: Middel. Limitations: idem; noemt chef-naam zonder bron.
**EV-009** — Perplexity. Source: live bevraging door Kelvin, 22 juli 2026. Reliability: Middel. Limitations: idem; noemt afwijkende chef-naam zonder bron; introduceert ongeverifieerd teppanyaki-schema.

Related observation: HV-IV-002 (openingstijden-register, mogelijk onvolledig), HV-IV-003 (zoekmachine-bronnen die AI-antwoorden waarschijnlijk voeden).

---

## Antwoorden van Kelvin (22 juli 2026) en wat dat oplost

1. **Zaak/bar na keukensluiting:** blijft open — "keuken dicht" is dus niet "zaak dicht". Exacte sluitingstijd van de zaak zelf nog niet gegeven (opgenomen als open eindje in HV-IV-002).
2. **Teppanyaki eigen schema:** bevestigd, start dagelijks om 17:00, los van de sushi-keukentijden. Perplexity's beweren van een apart teppanyaki-schema klopte dus wel; de exacte sluitingstijd (Perplexity noemde 22:00) is nog niet apart bevestigd.
3. **Sluitingsmelding zonder jaartal:** nog niet beantwoord — blijft open, zie punt 3 hieronder.
4. **Wie doet de omakase:** opgelost, geen tegenspraak — Kelvin Wong is head chef, Rocky is sushi chef. Gemini en Perplexity noemden allebei een deel van de waarheid, niet met elkaar in tegenspraak.

Verwerkt in HV-IV-002 als EV-010, inclusief een tweede correctie: de eerder bevestigde "Openingstijden"-regel bleek specifiek de sushi-keukentijden te zijn, niet de sluitingstijd van de hele zaak.

## Nog open

- Exacte sluitingstijd van de zaak/bar zelf (na keukensluiting).
- Exacte sluitingstijd van teppanyaki.

**Jaartal bij vakantiemelding:** goedgekeurd door Kelvin (22 juli 2026) — mag toegevoegd worden. Dit is een voorbereid voorstel, geen live wijziging (HV-P-005, Human Approval Boundary — ik kan dit niet zelf op de site publiceren):

> Voorgestelde tekst: "Sushi closed from Monday 3 August till Tuesday 11 August 2026. Teppan Yaki closed from Saturday 1 August till Thursday 12 August 2026. We're all back from 13 August 2026."

Status: **eerste ronde afgerond, twee kleine eindjes open** — geen blokkade voor verder werk.
