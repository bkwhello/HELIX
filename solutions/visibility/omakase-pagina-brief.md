# Ontwerp — eigen Omakase-pagina voor Konnichiwa

Dit werkt kandidaat 2 uit HV-IV-005 verder uit: een eigen omakase-pagina, getoetst aan de 12 eisen uit EC-002 §21 (Landing Page Rule) — een pagina mag alleen gemaakt worden als al deze punten beantwoord zijn, niet zomaar omdat een zoekwoord bestaat.

**Belangrijke ontdekking:** Konnichiwa heeft niet één, maar **twee** omakase-vormen, die tot nu toe nergens samen (of apart) goed beschreven stonden:

1. **Teppanyaki-omakase** — vast tasting-menu aan de bakplaat, 3–6 gangen, vaste prijzen, door Kelvin, vanaf 17:00 (zie punt 7).
2. **Sushi-omakase** — op verzoek samengesteld en bereid door Rocky (sushi chef), niet op het vaste menu.

Dit verklaart in één keer de eerdere "tegenspraak" tussen AI-systemen in HV-IV-004: Gemini noemde Kelvin, Perplexity noemde Rocky — **beiden hadden gelijk**, ze beschreven alleen elk een andere, nooit gedocumenteerde omakase-vorm. Het is dus geen AI-fout, maar een **Missing Representation** (EC-002-VD-001): de sushi-omakase-optie staat nergens online, wat verklaart waarom geen enkele bron 'm compleet kon weergeven.

Status: **ontwerp compleet** — alle 12 punten beantwoord, klaar om uit te werken tot conceptpagina. Beide vormen horen op de pagina, anders blijft de sushi-omakase een onzichtbare capaciteit.

---

## De 12 punten

1. **Klantvraag die het dient** — "omakase Utrecht" en "ik wil omakase eten in Utrecht" (HV-IV-003: zwakke score op deze generieke zoekopdracht; HV-IV-004: AI-systemen kennen het aanbod wel zodra ze specifiek naar Konnichiwa gevraagd worden).
2. **Organisatorische capaciteit die het vertegenwoordigt** — de Omakase Exclusive-ervaring ("Trust the chef"), bevestigd aanwezig op de site.
3. **Entiteiten die het versterkt** — Konnichiwa als omakase-aanbieder in Utrecht; Kelvin Wong (teppanyaki-omakase) en Rocky (sushi-omakase, op verzoek) als de twee chefs die het uitvoeren.
4. **Relaties die het vastlegt** — Konnichiwa → biedt aan → Omakase; Kelvin → bereidt → Teppanyaki-omakase; Rocky → bereidt → Sushi-omakase (op verzoek).
5. **Bewijskloof die het dicht** — HV-IV-003 (zwakke generieke vindbaarheid) + HV-IV-004 (geen prijs, geen aantal gangen, geen tijden, geen directe boeking op de huidige site).
6. **Concurrerende/overlappende content** — de bestaande "Omakase Exclusive"-vermelding op de homepage; die moet naar deze nieuwe pagina doorverwijzen, niet dubbel blijven bestaan.
7. **Benodigd ondersteunend bewijs — grotendeels binnen via het menu, twee dingen nog open:**
   - **Prijs & aantal gangen — bevestigd, uit het menu:**
     | Optie | Prijs p.p. |
     |---|---|
     | 3 gangen (vis, vlees, of combinatie) | € 52,50 |
     | 4 gangen | € 65,50 |
     | 5 gangen | € 78,50 |
     | 6 gangen (incl. dessert) | € 108 |
     Inclusief Japans gebakken rijst en groenten. 3–5 gangen exclusief dessert; 6-gangenmenu inclusief Yuzu Basque cheesecake. Toeslagopties: halve kreeft +€9 (i.p.v. gang), hele kreeft dagprijs, Wagyu A5 100 gr. +€27 (i.p.v. laatste gang) of +€40 (extra gang). Restricties/allergieën/vegan mogelijk op aanvraag.
   - **Beschrijving — bevestigd:** dit is de teppanyaki-omakase ("aan de bakplaat"), chef's tasting menu met keuze uit vis, vlees of combinatie — dus het grill-gebeuren, niet per se de sushibar. De site verwijst apart naar een "sushikaart" voor sushi.
   - **Duur van de ervaring — bevestigd: 2 uur.**
   - **Beschikbare dagen/tijden — bevestigd: vanaf 17:00 voor de teppanyaki-omakase (samen met teppanyaki); sushi-omakase is los daarvan op verzoek beschikbaar via Rocky.**
   - **Wie bereidt dit — bevestigd: Kelvin** (doet voornamelijk teppanyaki). De eerdere AI-claim dat dit Rocky zou zijn (Perplexity, HV-IV-004) was dus onnauwkeurig voor dit specifieke menu — Rocky blijft sushi chef, apart van deze omakase.
8. **Rol in interne links** — vanaf de homepage-sectie "Omakase Exclusive", vanuit het hoofdmenu/diensten, en als cross-sell vanaf de sushi- en teppanyaki-pagina's.
9. **Structured-data-eisen** — eigen `Menu`/`MenuSection`- of `Offer`-blok zodra prijs en gangen bekend zijn; anders vult deze pagina alsnog niets machine-leesbaars in.
10. **Bedoelde actie van de klant** — reserveren voor de omakase-ervaring (link naar reserveringssysteem/contact).
11. **Meetmethode** — organisch bezoek aan de pagina, klikken naar reservering vanaf deze pagina, positie voor "omakase Utrecht" volgen na publicatie (vergelijk met HV-IV-003-nulmeting).
12. **Onderhoudseigenaar — bevestigd: Kelvin.**

---

## Belangrijke aanvulling vanuit HV-IV-007

Het menu (met de prijzen/gangen die in punt 7 staan) blijkt op de site alleen als een Adobe InDesign-viewer te bestaan, die zoekmachines en AI-systemen waarschijnlijk niet kunnen lezen (zie HV-IV-007, bevinding 1). Dat maakt deze omakase-pagina extra belangrijk: de prijzen, gangen en beschrijving moeten **als gewone leesbare tekst op de pagina zelf** staan, niet alleen als link naar het menu — anders blijft dezelfde onzichtbaarheid bestaan die we nu juist proberen op te lossen.

## Openstaand

Niets meer blokkerend. **Bevestigd: sushi-omakase heeft geen vaste prijs** — blijft "prijs op aanvraag," in overleg met Rocky.

Alle 12 punten zijn nu rond. Ik kan de conceptpagina (tekst + structured-data-blok) klaarzetten als voorstel — net als bij de openingstijden publiceer ik niets zelf, jij of je beheerder plaatst het. Zeg maar of je die conceptpagina nu wilt.

---

---

## Evidence

**EV-011** — Source: officieel Omakase/Tasting-menu (Konnichiwa), door Kelvin gedeeld. Date: 22 juli 2026. Collection method: direct door eigenaar aangeleverd. Reliability: Hoog. Related observation: punt 7 hierboven.

---

## Status van kandidaat 1 (openingstijden) — even herhaald

Opgelost: de zaak heeft geen vaste sluitingstijd ("tot de laatste klant weg is"), dus wordt de keukensluitingstijd (21:30) voorgesteld als publiceerbare "closes"-tijd — zie `structured-data-website.md` voor bevestiging van dat voorstel. Enige echt openstaande punt daar: exacte sluitingstijd van teppanyaki (niet blokkerend).
