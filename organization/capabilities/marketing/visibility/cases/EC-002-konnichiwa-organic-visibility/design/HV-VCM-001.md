> Migrated unchanged from `solutions/visibility/HV-VCM-001-konnichiwa-coverage-map.md`, 22 juli 2026. Artifact ID preserved.

# HV-VCM-001 — Konnichiwa Visibility Coverage Map

Status: Draft v0.1

Grounded In: evidence/HV-IV-001.md through HV-IV-007.md

---

## Wat dit is

De blueprint die alles uit de investigaties samenbrengt: welke klantvraag (intent), welk contentstuk (knowledge asset) beantwoordt die vraag vandaag, waar zit een gat (evidence gap/defect, zie understanding/EC-002-VD-taxonomy.md), en wat is de prioriteit.

---

## Intent-dekkingstabel

| Intent | Huidige dekking | Bestaand asset | Gat/defect | Prioriteit |
|---|---|---|---|---|
| Konnichiwa opening hours | Zwak — 0/4 AI-systemen correct (HV-IV-004) | Homepage (niet machine-leesbaar) | VD-002 + VD-008 | **1 — hoog** |
| Omakase Utrecht | Zwak generiek, wel herkend bij directe vraag | Alleen homepage-sectie; menu niet leesbaar | VD-005 + VD-008 + VD-001 | **2 — hoog** |
| Teppanyaki Utrecht | Sterk — leidend (HV-IV-003) | sushi-utrecht/, homepage, menu | Geen | Geen actie |
| Sushi Utrecht | Neutraal | /sushi-utrecht/ | Geen acuut | Monitoren |
| Naamgeving als entiteit | Verzwakt — 3 varianten | Diverse externe profielen | VD-006 | 3 — vereist eigenaarstoegang |
| Overige ~34 kandidaat-intents | Onbekend | Onbekend | Geen bewijs verzameld | Nog te onderzoeken |

## Losse defecten

| Defect | Type | Status |
|---|---|---|
| /sushi-page-2/ — kapotte titel, dupliceert homepage | VD-002/VD-001-achtig | Voorstel: verwijderen/redirect |
| /hello-world/ — verlaten WP-standaardpost | VD-003 | Voorstel: verwijderen |
| Sluitingsmelding zonder jaartal | VD-003 | **Opgelost** — tekst met jaartal klaargezet |

## Voorgestelde eerste Visibility Backlog (max. 5)

1. Structured data publiceren — zie structured-data-website.md.
2. Omakase-pagina publiceren — zie omakase-pagina-brief.md. **Gebouwd** (zie transformation/HV-IR-001.md, HV-INT-002).
3. /sushi-page-2/ opruimen.
4. /hello-world/ verwijderen.
5. Naamgeving op eigen accounts gelijktrekken — vereist Kelvins eigen accounttoegang.

## Wat hierna gemeten wordt

Dezelfde HV-IV-003/004-zoekopdrachten/AI-vragen herhalen na backlog-uitvoering (zie evidence/HV-TS-001.md volgende ronde).

## Buiten deze eerste versie

Overige ~34 kandidaat-intents, diepere concurrentieanalyse, exacte teppanyaki-sluitingstijd.
