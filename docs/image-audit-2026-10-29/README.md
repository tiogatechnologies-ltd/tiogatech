# Retail photo corrections — 29 October 2026

The owner's same-brand requirement supersedes the broad category substitutions used in the previous follow-up. Those substitutions caused real errors: Luxpower VitaBank displayed an Itel Power Tank; several panels displayed Blue Carbon; SolarPro and Blue Carbon storage displayed other manufacturers; some Deye module/system/rack pictures described different items.

This correction changes 206 live catalogue image assignments across 15 brands, using 103 distinct photographs/illustrations (101 new local files). All 1,083 merged live listings resolve to existing local images. Prices, availability and product specifications are unchanged.

## Main corrections

- Luxpower VitaBank 500 uses the [manufacturer's VitaBank photo](https://luxpowertek.com/product-history/).
- Deye BOS-G 5kWh/5.12kWh listings use an individual module, not a populated rack. The 40kWh system uses a populated Deye system; the 60kWh system uses the manufacturer's BOS-G system. BOS-A modules, PDUs and empty racks have separate images. Sources include the [BOS-G Pro brochure](https://deye.com/wp-content/uploads/2026/01/deye-bos-g-pro-series_brochure-20260105v1.0.pdf) and [BOS-A brochure](https://deye.com/wp-content/uploads/2026/03/bos-a-series_-brochure_20260317v1.1.pdf).
- Luxpower PSTACK's module and control unit use individual component photos from its manufacturer user manual. SRNE parallel cables now show cables, rather than a battery.
- SRNE, Felicity, Infini, Suness, SolarPro, Sungene, Bread, Exulted and Blue Carbon replacements use their own published/supplier photos. Added model badges and cross-brand fallback pictures are bypassed.
- Sorotech's unspecified 11kW catalogue listing uses the SOROTEC REVO VM IV manufacturer-family photo; the catalogue spelling is retained.

## Exact models and related photos

Of the 206 assignments, 27 are recorded as model matches, 178 as same-brand family references, and one as a manufacturer technical illustration. Related photos are labelled with the brand in the card, quick view and main gallery. Shared manufacturer-family images remain shared; no recolouring, new branding, fabricated model badges or artificial uniqueness is introduced. New downloads are never enlarged.

These are not 206 independently verified exact-model photos. Important remaining limitations:

- Six older Bread floodlight models use a related Bread street-light photo. Their visible caption explicitly says **“Related Bread street light shown.”** Exact floodlight originals were not located. Bread panel wattages also share a supplier's Bread 580W reference.
- JMS 550/630W exact-model photos were not located. The reference is an older JMS monocrystalline module from its published manufacturer datasheet; the connection between the supplier's modern listings and that manufacturer is unconfirmed.
- Several capacity variants use the same-brand enclosure/family, including Luxpower ECO Beast and Felicity AI100 battery modules. A family reference does not establish compatibility.
- Suness's manufacturer describes iRack-HVM 215 as an indoor battery rack, while the existing catalogue calls it an all-in-one cabinet. Its image now follows the manufacturer; the product specification/title needs supplier confirmation separately.
- Existing photos outside these corrections retain their earlier audit status. An image loading successfully does not prove model identity or authenticity.

## Preventing recurrence

The storefront resolves reviewed products by name as well as original image path. This corrects old resolved image URLs saved in carts without changing the same file for its actual manufacturer. Missing/error photos use the product's own assignment, then a matching form within its own brand. Unknown solar brands receive no arbitrary cross-brand substitute.

Module, complete system, empty rack, control unit, charge controller, inverter, cable and other equipment forms have separate fallback keys. Broad solar category fallbacks and the unsafe stock-image library entries were removed. The previous cross-brand completion script and badge-generation script are disabled. Reapply the checked-in corrections using `node scripts/apply-brand-reviewed-photos.mjs`; it rejects cross-brand assignments and missing files.

## Evidence and validation

- `brand-corrections.json`: per-assignment source URL/page, source dimensions, brand, hardware form, match status and reason.
- `catalogue-images.csv`: effective image paths, dimensions and reference captions for all 1,083 merged live listings.
- `summary.json`: scope and counts.

Validation: all 127 tests passed, TypeScript checks passed, and the production build passed. Local browser checks verified VitaBank's actual image in quick view and separate Deye module, PDU, empty-rack and populated-system images. Production deployment of code commit `e11ee7e883e398e0c01589fd2a63f15ba7161ddd` succeeded. All 103 distinct corrected image paths returned HTTP 200 with image content types and matched the local files byte for byte. Live browser checks confirmed the original VitaBank photo in its product gallery and separate Deye module/rack/PDU/system assignments.
