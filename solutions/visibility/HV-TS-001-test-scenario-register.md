# HV-TS-001 — AI and Search Test Scenario Register (Konnichiwa)

Per HV-MP-001 §9/§10: een vaste testset die herhaald wordt na elke interventie, zodat verandering meetbaar is tegen dezelfde vragen. De onderzoeken HV-IV-003 en HV-IV-004 vormen samen **ronde 0 (baseline)** van deze testset — hieronder geformaliseerd in het registerformaat dat HV-MP-001 voorschrijft.

Status: baseline vastgelegd (ronde 0). Volgende ronde: na livegang van HV-INT-001/002.

---

## AI-testscenario's

| ID | Prompt | Systeem | Datum | Konnichiwa genoemd? | Openingstijden correct? | Bron geciteerd |
|---|---|---|---|---|---|---|
| HV-TS-AI-01 | "Wat is een goed teppanyaki/sushi restaurant in Utrecht?" (koud, geen zoektool) | Claude | 22 juli 2026 | Zwak/onzeker | N.v.t. | Geen (parametrisch) |
| HV-TS-AI-02 | Vraag naar openingstijden/omakase Konnichiwa | DeepSeek | 22 juli 2026 | Ja | Nee | Externe reserveringssite |
| HV-TS-AI-03 | Vraag naar openingstijden/omakase Konnichiwa | ChatGPT | 22 juli 2026 | Ja | Deels | Officiële site + 2 afwijkende bronnen |
| HV-TS-AI-04 | Vraag naar openingstijden/omakase Konnichiwa | Gemini | 22 juli 2026 | Ja | Nee (30 min afwijking) | Officiële site/blog (impliciet) |
| HV-TS-AI-05 | Vraag naar openingstijden/omakase Konnichiwa | Perplexity | 22 juli 2026 | Ja | Deels (apart teppanyaki-schema, nadien bevestigd) | Niet expliciet |

**Herhalingen:** ronde 0 is één run per systeem (niet de 3x voor kritieke prompts die HV-MP-001 §9 aanbeveelt) — bewust licht gehouden voor de eerste verkenning. Volgende ronde volgt het volledige protocol (3 runs per kritiek scenario).

**Classificatie ronde 0 (HV-TS-AI-02 t/m 05), per HV-MP-001 "AI Factual Accuracy Score":**

| Systeem | Classificatie | Punten |
|---|---|---|
| DeepSeek | Onjuist | 0 |
| ChatGPT | Gedeeltelijk correct | 50 |
| Gemini | Onjuist | 0 |
| Perplexity | Gedeeltelijk correct | 50 |

Volledig correct: 0 van 4. Gedeeltelijk correct: 2 van 4. Onjuist: 2 van 4.

**AI Factual Accuracy Score ronde 0 (openingstijden-scenario):** (0+50+0+50)/4 = **25/100**.

Belangrijk: dit is de score voor één scenario (openingstijden), niet voor "AI-begrip" in het algemeen — 1 van de 30 geplande testscenario's uit HV-MP-001 §9 is uitgevoerd. Dit mag niet worden gepresenteerd als representatief voor het volledige AI-begrip van Konnichiwa voordat een groter deel van de testset is doorlopen.

---

## Zoek-testscenario's

| ID | Zoekopdracht | Datum | Verschijnt Konnichiwa? | Positie/prominentie |
|---|---|---|---|---|
| HV-TS-SE-01 | "Konnichiwa restaurant Utrecht" | 22 juli 2026 | Ja, dominant | Meerdere platforms |
| HV-TS-SE-02 | "beste teppanyaki restaurant Utrecht" | 22 juli 2026 | Ja | Leidende optie |
| HV-TS-SE-03 | "sushi restaurant Utrecht" | 22 juli 2026 | Ja | Eén van meerdere |
| HV-TS-SE-04 | "omakase Utrecht" | 22 juli 2026 | Zwak | Amsterdam domineert |

---

## Beperking (belangrijk)

Deze ronde 0 is verzameld via een geautomatiseerde zoektool en losse AI-bevragingen door Kelvin — niet via Search Console/GA4 (die geven objectievere, herhaalbare cijfers, zie HV-BL-001). Resultaten kunnen afwijken van wat een individuele gebruiker op zijn eigen scherm ziet (personalisatie, locatie, moment). Voor formele verdicts in HV-IR-001 telt vooral de **verandering** tussen ronde 0 en latere rondes op dezelfde vragen, niet de absolute score van ronde 0 op zich.

---

## Volgende ronde

Uit te voeren op dag 7, 28, 56 en 90 na livegang van HV-INT-001/002, met dezelfde 9 scenario's (HV-TS-AI-02 t/m 05, HV-TS-SE-01 t/m 04) plus, indien gewenst, uitbreiding naar de overige kandidaat-intents uit HV-IV-005 zodra daar bewijs voor is.
