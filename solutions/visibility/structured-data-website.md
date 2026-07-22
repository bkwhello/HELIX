# Structured data voor konnichiwa.nl

## Wat dit is en waarom het helpt

Structured data is een stukje code dat je ergens verstopt op je website zet (niet zichtbaar voor bezoekers). Het vertelt Google en AI-systemen in hun eigen "taal" exact wat voor bedrijf je bent, waar je zit, wanneer je open bent en wat voor keuken je serveert — in plaats van dat ze dat zelf uit lopende tekst moeten "raden".

Dit is precies het gat dat in het vorige onderzoek naar voren kwam: je site heeft alle info wél in gewone tekst staan, maar niet in deze machine-leesbare vorm. HV-IV-004 liet zien wat dat concreet kost: van vier geteste AI-systemen (ChatGPT, Gemini, Perplexity, DeepSeek) gaf niet één de juiste openingstijden terug.

Ik kan dit niet zelf op je live website plaatsen — ik heb geen toegang tot je site of WordPress. Hieronder staat de kant-en-klare code plus hoe je (of wie de site beheert) hem plaatst.

**Update (HV-IV-005-uitwerking):** Kelvin bevestigt dat de zaak zelf geen vaste sluitingstijd heeft — die blijft open "tot de laatste klanten weg zijn." Schema.org (en Google) kunnen daar niet mee werken, dus is een vast kloktijdstip nodig als publiceerbaar anker. **Bevestigd: 22:00** wordt aangehouden als basis-sluitingstijd voor de zaak, alle dagen.

---

## De code

Dit blok hieronder mag je (of je websitebeheerder) toevoegen aan de website. Gebaseerd op de gegevens die al publiek op je site staan én bevestigd zijn door jou (HV-IV-002, HV-IV-004).

```json
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Restaurant",
  "name": "Konnichiwa",
  "url": "https://konnichiwa.nl/",
  "telephone": "+31302416388",
  "email": "info@konnichiwa.nl",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "Mariaplaats 9",
    "postalCode": "3511 LH",
    "addressLocality": "Utrecht",
    "addressCountry": "NL"
  },
  "servesCuisine": ["Japanese", "Sushi", "Teppanyaki", "Izakaya", "Omakase"],
  "openingHoursSpecification": [
    {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday"],
      "opens": "16:00",
      "closes": "22:00"
    },
    {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": ["Friday", "Saturday", "Sunday"],
      "opens": "12:00",
      "closes": "22:00"
    }
  ],
  "specialOpeningHoursSpecification": [
    {
      "@type": "OpeningHoursSpecification",
      "validFrom": "2026-08-03",
      "validThrough": "2026-08-11",
      "opens": "00:00",
      "closes": "00:00",
      "description": "Sushi-keuken gesloten"
    },
    {
      "@type": "OpeningHoursSpecification",
      "validFrom": "2026-08-01",
      "validThrough": "2026-08-12",
      "opens": "00:00",
      "closes": "00:00",
      "description": "Teppanyaki gesloten"
    }
  ],
  "sameAs": [
    "https://www.instagram.com/konnichi_wa_utrecht/",
    "https://www.facebook.com/Konnichiwa.Japansrestaurant/",
    "https://www.tripadvisor.com/Restaurant_Review-g188616-d1021920-Reviews-Konnichiwa-Utrecht.html",
    "https://www.thefork.com/restaurant/konnichiwa-r223039"
  ]
}
</script>
```

**Let op teppanyaki:** schema.org kent geen standaardmanier om twee losse dagschema's (sushi vs. teppanyaki) binnen één restaurant-vermelding weer te geven. Het bovenstaande blok toont daarom de tijden waarop de **zaak** open is (het breedste, kloppende antwoord voor een gast die "zijn Konnichiwa open" wil weten); het teppanyaki-specifieke starttijdstip (17:00) hoort beter in de gewone paginatekst dan in dit technische blok.

---

## Nog aan te vullen (geen van deze blokkeert publicatie)

- **Sluitingstijd van teppanyaki specifiek** (start staat vast op 17:00, ervaring duurt 2 uur — maar dat zegt niets over hoe laat de laatste seating is) — voor de gewone paginatekst, niet nodig voor dit blok.
- **Foto** (`image`) — een goede, representatieve foto-URL van de website. Google raadt dit sterk aan.
- **Menu-pagina** (`menu`) — de directe link naar je menupagina, als die een eigen URL heeft.
- **Prijsklasse** (`priceRange`) — gezien de omakase-prijzen (€52,50–€108 p.p.) ligt `"€€€"` voor de hand; bevestig of dat klopt voor het restaurant als geheel (dus ook de reguliere/sushi-kaart, niet alleen omakase).

Het blok hierboven is nu volledig publiceerbaar.

---

## Hoe je dit plaatst

Structured data hoort in de `<head>` van elke belangrijke pagina, meestal via een van deze routes:

1. **Rank Math (waarschijnlijk al geïnstalleerd)** — HV-IV-007 vond dat de site al de Rank Math SEO-plugin gebruikt (te zien aan de sitemap). Rank Math heeft een ingebouwde "Local SEO"-module die een deel van dit schema (bedrijfstype, adres, openingstijden) via een instellingenscherm kan invullen, zonder losse code te plakken. Check dat eerst, vóórdat je onderstaand blok apart toevoegt — dubbel schema kan zelf weer verwarring opleveren.
2. **WordPress-plugin (alternatief)** — als Rank Math dit niet dekt, kan een plugin als "Insert Headers and Footers" of "WPCode" dit blok voor je in de site plaatsen. Geen code-kennis nodig, alleen plakken.
3. **Via je websitebeheerder/bouwer** — stuur dit document door, zij weten waar dit hoort.
4. **Zelf in de themabestanden** — alleen doen als je (of iemand) bekend is met WordPress-thema's.

Na plaatsen kun je het laten controleren via Google's eigen test-tool: [Rich Results Test](https://search.google.com/test/rich-results) — daar plak je je website-URL in en zie je of Google het goed heeft opgepikt.

---

## Let op

Dit is een voorbereid voorstel, geen live wijziging. Er verandert niets aan je website totdat jij (of je beheerder) dit zelf plaatst.
