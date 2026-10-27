# Retail selling price audit — 27 October 2026

The authoritative amount is **Master Price List, column P, “Price to quote (₦)”** in [Solar_Master_Price_List](https://docs.google.com/spreadsheets/d/1f-PbcRM5qhjZrHiM71Y9Id2suBiSDiZ-STaK6Bi4Q1U/edit). This audit compares the actual selling price, independently of crossed-out comparison prices. The sheet's Summary has 30% default markup, 5% minimum margin and no active sheet promotions. Supplier market caps and overrides mean a blanket markup cannot reproduce all quoted prices.

## Results

| Check | Result |
|---|---:|
| Source rows examined | 440 |
| Source rows with quoted prices | 425 |
| Source rows without quoted prices | 15 |
| Source rows matched to catalogue products | 401 |
| Matched website listings, including legacy aliases | 432 |
| Selling prices corrected | 396 |
| Matched priced listings already correct | 25 |
| Listings now requiring a quote | 11 |
| Current merged website catalogue | 1,083 |
| Catalogue listings outside confirmed sheet matches | 651 |
| Active database products examined | 7 |
| Database product prices corrected | 2 |

The 432 matched listings include 421 priced listings and 11 listings whose source price is blank. The Deye 50kW and 80kW listings use the Deye Nigeria supplier rows matching the website specifications and five-year warranty. The 651 unverified listings were examined and classified, but retain their existing selling prices because the sheet supplies no exact, unambiguous basis for changing them. They include smart home products, security products, brands absent from this solar price sheet, and different solar model variants. They must not be described as sheet-verified.

## Examples of corrected actual selling prices

| Product | Previous website price | Master quote / current price |
|---|---:|---:|
| AlpSolarr Pulse S3 6kW | ₦864,000 | ₦754,000 |
| AlpSolarr Pulse S4 8kW | ₦876,000 | ₦949,000 |
| Felicity FL-LPBF48100, legacy database listing | ₦1,740,000 | ₦1,398,800 |
| Felicity FL-LPBF48200, legacy database listing | ₦3,420,000 | ₦2,226,900 |
| SRNE EOS02B-24 | ₦756,000 | ₦548,601.30 |
| Deye SUN-6K-OG01LP1-EU-AM2 | ₦573,600 | ₦1,170,000 |

## Exceptions requiring source or catalogue clarification

The row-by-row [master-sheet audit](master-sheet-audit.csv) includes all 440 rows. There are 39 rows without a direct catalogue mapping. Two are alternate supplier quotes for the Deye products mapped below. One, PPS-016 (EcoFlow RIVER 3 Max), is represented by a verified banner at ₦546,000. The remaining 36 require catalogue/inventory or variant review; this audit does not add new inventory.

The sheet lists these Deye models under two suppliers. The website's Deye Nigeria specifications, charge/discharge current, parallel capability and five-year warranty match the SMS Sunmate Solar (Deye Nigeria) rows. These quoted selling prices are displayed and available for checkout:

| Model | Matching source row | Actual selling price |
|---|---|---:|
| Deye SUN-50K-SG01HP3-EU-BM4 | INV-136 (sheet row 139) | ₦9,880,000 |
| Deye SUN-80K-SG02HP3-EU-EM6 | INV-142 (sheet row 142) | ₦14,300,000 |

INV-135 and INV-141 remain recorded as alternate Dawnice reseller quotes. Duplicate supplier entries do not force a priced product to show “Price on Request”.

Examples deliberately not assigned a nearby model's price include AlpSolarr Pulse S4 Mini 5kW versus Pulse S4 8kW; Deye inverter codes with different suffixes; itel IPV-1K512U versus IPV-1K612U; itel IPL-51200X versus IPL-51200H; Luxpower PSTACK 10kWh versus the sheet's 5.12kWh module note; and Bread monofacial panels versus bifacial panels. Dawnice PowerFly/PowerWall variants cannot safely be equated with the HZEB-LCT or generic residential rows solely by capacity.

All 15 source rows without a quote are explicit nulls. Eleven have catalogue matches and now show “Price on Request”; the other four have no confirmed catalogue listing. No quote was invented.

## Price consistency fixes

- A public snapshot stores only final quoted selling prices and reviewed model aliases. Procurement costs, supplier margins and profit data are excluded.
- The same price policy covers the retail catalogue, product detail, wishlist, comparison, static fallback and restored carts. Cached cart quantities are preserved; stale prices are refreshed and quote-only items are excluded from checkout with a customer notice.
- Eighteen colliding SRNE/Luxpower identifiers are separated so catalogue merging and carts cannot replace one model with another. Existing descriptive URL suffixes remain stable.
- Kobo amounts survive price labels, animation, cart totals and backend parsing.
- Six matched promotional banners use the master quote, including the three configured SRNE/AlpSolarr/Luxpower banners and three EcoFlow banners. Their order links use the same price. The unrelated EcoFlow DELTA 3 AIR 2000 and DELTA 3 Max banners have no exact master row and remain unverified.
- Backend payment validation is regenerated from current selling prices. Known quote-only products cannot initiate payment. Historical orders are preserved.
- Crossed-out comparison-price settings remain separate from the authoritative actual selling price.
- Retail filter groups are collapsed dropdowns on desktop and mobile. Brand and price precede specifications and availability. Selected values remain visible in the group headings and continue filtering when a group is closed.

## Evidence and repeat checks

- [Every source row](master-sheet-audit.csv): model, sheet row, quoted price, matched listings, previous/current actual prices and result.
- [Every website listing](website-price-audit.csv): all 1,083 merged listings, current prices and verification status.
- [Machine verification](verification.json): aggregate counts and consistency failures; the final audit has no failures.
- `node scripts/audit-retail-prices.mjs --live` performs a read-only audit against active database rows and regenerates the CSV evidence. Initial before prices are available in the private deployment backup and ignored local baseline.
- `node scripts/check-retail-prices.mjs` checks the rendered listing/detail price, decimal amounts, saved cart repricing, added cart amounts, and quote-only controls. Set `TEST_BASE_URL` to verify production.

The pricing snapshot is dated **27 October 2026**. It is not a continuous Google Sheets connection. Future sheet changes require refreshing the final-price snapshot and reviewed model aliases, regenerating backend prices (`npm run catalog:prices`), checking the audit/tests, and deploying the website and `paystack-init`. Ambiguous new models require review before mapping; do not match by price, capacity alone, or fuzzy names.
