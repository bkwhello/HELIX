> Migrated unchanged from `solutions/visibility/HV-IV-004-ai-representatie.md`, 22 juli 2026. Artifact ID preserved.

# HV-IV-004 — AI Representation Investigation (Konnichiwa)

Doel: vaststellen hoe grote AI-systemen Konnichiwa nu begrijpen en aanbevelen. Geen live toegang tot ChatGPT/Gemini/Perplexity door de AI-agent; Claude zelftest + vier live systemen bevraagd door Kelvin.

Status: eerste ronde afgerond — Claude (zelftest) plus DeepSeek, ChatGPT, Gemini, Perplexity (Kelvin).

---

## Zelftest — Claude zonder zoektool

Vraag: "Wat is een goed teppanyaki/sushi restaurant in Utrecht?" — zwakke parametrische kennis van Konnichiwa specifiek; zou het zonder zoekopdracht niet met overtuiging noemen. Laat zien dat AI-aanbeveling voor lokale vragen waarschijnlijk leunt op live zoekgedrag, dus dezelfde risico's als HV-IV-003 erft.

**EV-005** — Source: Claude, koude bevraging. Date: 22 juli 2026. Reliability: Laag als directe uitspraak over andere systemen. Related: HV-IV-003.

---

## Live resultaten (Kelvin, 22 juli 2026)

| Systeem | Genoemde tijden | Komt overeen met HV-IV-002? |
|---|---|---|
| DeepSeek | 12:00–16:45 / vanaf 17:00 | Nee |
| ChatGPT | Citeert officiële site correct, toont ook 2 afwijkende bronnen ernaast | Deels |
| Gemini | ma–do 16:00–22:00, vr–zo 12:00–22:00 | Nee — 30 min te laat |
| Perplexity | Sushi ma–do 16:00–21:30/vr–zo 12:00–22:00; teppanyaki dagelijks 17:00–22:00 | Deels |

**Geen van de vier systemen geeft het volledig kloppende schema terug.** Zwaarste bevinding tot nu toe.

### Sluitingsmelding zonder jaartal

ChatGPT signaleerde ontbrekend jaartal in de vakantiemelding — concrete, kleine correctie. **Goedgekeurd door Kelvin (22 juli 2026)**, voorgestelde tekst met jaartal klaargezet (niet live gepubliceerd door de AI-agent, HV-P-005).

### Omakase

3/4 systemen bevestigen omakase bij directe vraag, maar zonder eigen pagina/prijs/gangen/boekmogelijkheid — matcht HV-001 (HV-P-004, Intent-Justified Assets).

**Tegenstrijdigheid opgelost:** Gemini noemde Kelvin Wong, Perplexity noemde Rocky als omakase-chef. Antwoord van Kelvin: Kelvin Wong = head chef, Rocky = sushi chef — geen tegenspraak, twee rollen.

**EV-006** DeepSeek. **EV-007** ChatGPT (Hoog voor brongebruik). **EV-008** Gemini (Middel). **EV-009** Perplexity (Middel). Alle: live bevraging door Kelvin, 22 juli 2026.

---

## Antwoorden van Kelvin en wat dat oplost

1. Zaak/bar blijft open na keukensluiting; exacte sluitingstijd nog open.
2. Teppanyaki eigen schema bevestigd, start 17:00; sluitingstijd nog open.
3. Jaartal-fix: goedgekeurd, niet live gepubliceerd door AI-agent.
4. Omakase-chef: opgelost, Kelvin Wong (head chef) en Rocky (sushi chef) allebei correct voor hun eigen rol.

Verwerkt in HV-IV-002 als EV-010.

## Nog open

- Exacte sluitingstijd zaak/bar.
- Exacte sluitingstijd teppanyaki.

Status: eerste ronde afgerond, twee kleine eindjes open — geen blokkade.
