# Retail product filtering

The retail page supports category, brand, price, availability and specifications
in combination. Multiple choices in one group are alternatives; groups narrow
the result together. Selected filters appear above the results and are stored in
the URL, including on mobile. Changing category clears the previous category's
filters. Clearing filters keeps the current category.

## Data and provenance

Filters are generated from the merged live and static catalogue, rather than a
hardcoded capacity list. Product specifications take precedence over names,
rounded tags, usable capacity, expansion limits and marketing descriptions.
Unknown specifications do not match a selected specification filter. Prices on
request remain visible until a numeric price filter is selected. Available stock
uses catalogue stock status or quantity; preorders and sold-out items are excluded
by "In stock only".

The read-only reference was the `Master Price List` tab of
[Solar_Master_Price_List](https://docs.google.com/spreadsheets/d/1f-PbcRM5qhjZrHiM71Y9Id2suBiSDiZ-STaK6Bi4Q1U/edit),
read on 27 October 2026. `src/data/retailMasterSpecifications.json` contains only
440 product specification records: category, subcategory, brand, model,
description, rating, unit, warranty and a voltage-confirmation flag. Supplier cost,
markup, profit, dealer prices and private notes are not included in the snapshot.
No prices or cells in the master sheet were changed by this implementation.

Matching uses an exact sheet SKU, or a unique model within the same brand. The
snapshot supplements missing specifications; it is not a live Sheet connection.
New catalogue products automatically contribute filter choices when their
structured specifications or model names contain the relevant values. Refresh
the specification snapshot if the master sheet's product specifications change.

The sheet flags unresolved voltages for BAT-016, BAT-011, BAT-043, BAT-061,
BAT-084, BAT-098 and BAT-100. Those matched products stay in the catalogue, but
are not assigned to a precise voltage filter until the source is corrected.
Other clearly inconsistent voltage/Ah/kWh combinations are also excluded from
voltage-specific matching. Nominal lithium systems are grouped as 12/12.8V,
24/25.6V and 48/51.2V. Operating range endpoints and PV input voltage are not
treated as nominal battery voltages. kW and kVA remain separate units.

## Main files

- `src/lib/retailFilters.ts`: normalization, exact measurement matching, dependent
  option counts, category matching and URL persistence.
- `src/components/retail/RetailFilterSidebar.tsx`: desktop and mobile controls.
- `src/pages/Retail.tsx`: catalogue loading, selected chips, result counts,
  filtering, sorting and pagination.

## Verification

Run `npm test`, `npm run typecheck` and `npm run build`.
With the local server running, run `node scripts/check-retail-filters.mjs`.
Set `TEST_BROWSER_CHANNEL=msedge` to use installed Edge. The browser check mocks
all remote services, including analytics, so it does not write to production.
It covers combined filters, exact 5/5.12/15kWh matching, multi-selection, prices,
stock, URL restoration/back navigation, category changes and the mobile drawer.
