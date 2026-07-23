> Migrated unchanged from `solutions/visibility/HV-AR-001-attribution-register.md`. Artifact ID preserved. Classification: candidate work object (not yet active) — promote to measurement/ once real data is being collected.

# HV-AR-001 — Attribution Register (Konnichiwa)

Per HV-MP-001 §8: omdat AI-verwijzingen niet altijd technisch zichtbaar zijn, wordt gasten gevraagd hoe ze Konnichiwa vonden. Dit levert richtinggevend bewijs, geen exacte attributie.

Status: **nog niet actief** — deze vraag wordt momenteel niet gesteld. Dit register is het lege sjabloon plus een concreet implementatievoorstel.

---

## Wat nodig is om dit te activeren

Konnichiwa gebruikt Guestplan voor reserveringen (bevestigd in `functions.php`, `_gstpln.openWidget()`). Twee opties:

1. **Via Guestplan zelf** — checken of Guestplan een optioneel vraagveld ondersteunt ("Hoe vond je ons?"). Vereist configuratie in het Guestplan-dashboard, niet vanuit de theme-bestanden te doen.
2. **Losse, korte nabevraging** — automatische e-mail na reservering of QR-code aan tafel, als Guestplan dit niet ondersteunt.

Vereist een instelling in een extern systeem (Guestplan-account) waar de AI-agent geen toegang toe heeft.

---

## Registerformaat (klaar om te vullen zodra actief)

| Datum | Antwoord | Aantal | % van totaal | Periode |
|---|---|---|---|---|
| — | Google Search | — | — | — |
| — | Google Maps | — | — | — |
| — | ChatGPT of andere AI-assistent | — | — | — |
| — | Instagram/social media | — | — | — |
| — | TheFork | — | — | — |
| — | Aanbeveling van iemand | — | — | — |
| — | Eerder bezoek | — | — | — |
| — | Anders | — | — | — |

---

## Hoe dit gebruikt wordt

Zodra er data binnenkomt: vergelijk het aandeel "ChatGPT of andere AI-assistent" en "Google Search/Maps" vóór en na HV-INT-001/002, als aanvullend (niet doorslaggevend) bewijs naast evidence/HV-TS-001.md. Richtinggevend bewijs, nooit als exacte attributie behandelen.
