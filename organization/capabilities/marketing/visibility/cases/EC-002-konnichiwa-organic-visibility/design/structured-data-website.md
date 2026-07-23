> Migrated unchanged from `solutions/visibility/structured-data-website.md`, 22 juli 2026. Classification: Design (prepared intervention, not yet fully implemented — see transformation/HV-IR-001.md, HV-INT-001, status "Blocked — structured data ontbreekt nog").

# Structured data voor konnichiwa.nl

## Wat dit is en waarom het helpt

Structured data is code die Google en AI-systemen in hun eigen "taal" vertelt wat voor bedrijf je bent, waar je zit, wanneer je open bent en wat voor keuken je serveert. Dit is precies het gat uit HV-IV-004: van vier geteste AI-systemen gaf niet één de juiste openingstijden terug.

**Bevestigd: 22:00** wordt aangehouden als basis-sluitingstijd voor de zaak, alle dagen (Kelvin, zie evidence/HV-IV-004.md).

---

## De code

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

**Let op teppanyaki:** schema.org kent geen standaardmanier voor twee losse dagschema's binnen één restaurant-vermelding. Het blok toont de zaak-brede tijden; het teppanyaki-starttijdstip (17:00) hoort in de paginatekst.

## Nog aan te vullen (blokkeert publicatie niet)

- Sluitingstijd teppanyaki specifiek.
- Foto (`image`).
- Menu-pagina (`menu`).
- Prijsklasse (`priceRange`) — waarschijnlijk "€€€".

## Hoe je dit plaatst

1. Rank Math (waarschijnlijk al geïnstalleerd, zie evidence/HV-IV-007.md) — check eerst de Local SEO-module vóór dit blok apart toe te voegen.
2. WordPress-plugin (Insert Headers and Footers / WPCode).
3. Via websitebeheerder/bouwer.
4. Zelf in themabestanden (alleen bij WordPress-kennis).

Testen via [Rich Results Test](https://search.google.com/test/rich-results).

## Let op

Voorbereid voorstel, geen live wijziging door de AI-agent.
