> Migrated unchanged from `solutions/visibility/omakase-pagina-brief.md`, 22 juli 2026. Classification: Design (this design has since been realized — see transformation/HV-IR-001.md, HV-INT-002, "Live sinds 22 juli 2026").

# Ontwerp — eigen Omakase-pagina voor Konnichiwa

Werkt kandidaat 2 uit evidence/HV-IV-005.md verder uit, getoetst aan de 12 Landing Page Rule-eisen.

**Belangrijke ontdekking:** Konnichiwa heeft twee omakase-vormen, nergens samen beschreven: teppanyaki-omakase (vast tasting-menu, 3–6 gangen, Kelvin, vanaf 17:00) en sushi-omakase (op verzoek, Rocky, geen vaste prijs). Verklaart de eerdere schijnbare AI-tegenspraak in evidence/HV-IV-004.md (Gemini noemde Kelvin, Perplexity noemde Rocky — beiden hadden gelijk, verschillende vorm). Dit is een Missing Representation (understanding/EC-002-VD-taxonomy.md, VD-001): sushi-omakase stond nergens online.

Status: **ontwerp compleet** — alle 12 punten beantwoord.

---

## De 12 punten

1. **Klantvraag** — "omakase Utrecht" (zwakke score, HV-IV-003; AI kent het aanbod wel bij directe vraag, HV-IV-004).
2. **Organisatorische capaciteit** — Omakase Exclusive-ervaring, bevestigd aanwezig.
3. **Entiteiten** — Konnichiwa als omakase-aanbieder; Kelvin Wong (teppanyaki-omakase), Rocky (sushi-omakase, op verzoek).
4. **Relaties** — Konnichiwa → biedt aan → Omakase; Kelvin → bereidt → Teppanyaki-omakase; Rocky → bereidt → Sushi-omakase.
5. **Bewijskloof** — HV-IV-003 (zwakke vindbaarheid) + HV-IV-004 (geen prijs/gangen/tijden/boeking).
6. **Concurrerende content** — bestaande homepage-sectie moet doorverwijzen, niet dubbel blijven.
7. **Ondersteunend bewijs — bevestigd:**

   | Optie | Prijs p.p. |
   |---|---|
   | 3 gangen | €52,50 |
   | 4 gangen | €65,50 |
   | 5 gangen | €78,50 |
   | 6 gangen (incl. dessert) | €108 |

   Toeslagen: halve kreeft +€9, hele kreeft dagprijs, Wagyu A5 100gr +€27/+€40. Duur: 2 uur. Beschikbaar vanaf 17:00 (teppanyaki-omakase); sushi-omakase los daarvan op verzoek via Rocky, geen vaste prijs. Bereid door Kelvin (teppanyaki-omakase specifiek — eerdere Perplexity-claim dat dit Rocky was, was onnauwkeurig voor dít menu).
8. **Interne links** — vanaf homepage-sectie, hoofdmenu, cross-sell vanaf sushi-/teppanyaki-pagina's.
9. **Structured-data-eisen** — eigen Menu/MenuSection/Offer-blok.
10. **Bedoelde actie** — reserveren.
11. **Meetmethode** — organisch bezoek, kliks naar reservering, positie "omakase Utrecht" vs. HV-IV-003-nulmeting.
12. **Onderhoudseigenaar** — Kelvin.

## Aanvulling vanuit HV-IV-007

Menu bestaat alleen als niet-crawlbare Adobe InDesign-viewer — prijzen/gangen moeten daarom als gewone leesbare tekst op de nieuwe pagina staan, niet alleen als menu-link.

## Evidence

**EV-011** — Source: officieel Omakase/Tasting-menu, door Kelvin gedeeld. Date: 22 juli 2026. Reliability: Hoog.

## Status kandidaat 1 (openingstijden)

Zie evidence/HV-IV-004.md en design/structured-data-website.md.
