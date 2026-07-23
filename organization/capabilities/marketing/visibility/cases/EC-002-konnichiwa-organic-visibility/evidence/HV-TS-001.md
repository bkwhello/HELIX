> Migrated unchanged from `solutions/visibility/HV-TS-001-test-scenario-register.md`, 22 juli 2026. Artifact ID preserved. Also cross-referenced from measurement/ as the case's primary AI/search measurement instrument.

# HV-TS-001 — AI and Search Test Scenario Register (Konnichiwa)

Een vaste testset die herhaald wordt na elke interventie, zodat verandering meetbaar is tegen dezelfde vragen. HV-IV-003 en HV-IV-004 vormen samen **ronde 0 (baseline)**.

Status: baseline vastgelegd (ronde 0). Volgende ronde: na livegang van HV-INT-001/002.

---

## AI-testscenario's

| ID | Prompt | Systeem | Datum | Konnichiwa genoemd? | Openingstijden correct? | Bron geciteerd |
|---|---|---|---|---|---|---|
| HV-TS-AI-01 | "Wat is een goed teppanyaki/sushi restaurant in Utrecht?" (koud) | Claude | 22 juli 2026 | Zwak/onzeker | N.v.t. | Geen (parametrisch) |
| HV-TS-AI-02 | Openingstijden/omakase Konnichiwa | DeepSeek | 22 juli 2026 | Ja | Nee | Externe reserveringssite |
| HV-TS-AI-03 | Openingstijden/omakase Konnichiwa | ChatGPT | 22 juli 2026 | Ja | Deels | Officiële site + 2 afwijkende bronnen |
| HV-TS-AI-04 | Openingstijden/omakase Konnichiwa | Gemini | 22 juli 2026 | Ja | Nee (30 min afwijking) | Officiële site/blog (impliciet) |
| HV-TS-AI-05 | Openingstijden/omakase Konnichiwa | Perplexity | 22 juli 2026 | Ja | Deels | Niet expliciet |

Ronde 0 is één run per systeem (niet de 3x voor kritieke prompts). Volgende ronde volgt het volledige protocol.

**Classificatie ronde 0, per "AI Factual Accuracy Score" (measurement/HV-MP-001.md):**

| Systeem | Classificatie | Punten |
|---|---|---|
| DeepSeek | Onjuist | 0 |
| ChatGPT | Gedeeltelijk correct | 50 |
| Gemini | Onjuist | 0 |
| Perplexity | Gedeeltelijk correct | 50 |

**AI Factual Accuracy Score ronde 0 (openingstijden-scenario): 25/100.** Dit is de score voor één van de 30 geplande testscenario's — niet representatief voor "AI-begrip" in het algemeen.

---

## Zoek-testscenario's

| ID | Zoekopdracht | Datum | Verschijnt Konnichiwa? | Positie/prominentie |
|---|---|---|---|---|
| HV-TS-SE-01 | "Konnichiwa restaurant Utrecht" | 22 juli 2026 | Ja, dominant | Meerdere platforms |
| HV-TS-SE-02 | "beste teppanyaki restaurant Utrecht" | 22 juli 2026 | Ja | Leidende optie |
| HV-TS-SE-03 | "sushi restaurant Utrecht" | 22 juli 2026 | Ja | Eén van meerdere |
| HV-TS-SE-04 | "omakase Utrecht" | 22 juli 2026 | Zwak | Amsterdam domineert |

## Beperking

Ronde 0 via geautomatiseerde zoektool + losse AI-bevragingen — niet via Search Console/GA4. Voor formele verdicts telt vooral de **verandering** tussen ronde 0 en latere rondes op dezelfde vragen.

## Volgende ronde

Dag 7, 28, 56 en 90 na livegang van HV-INT-001/002, dezelfde 9 scenario's.
