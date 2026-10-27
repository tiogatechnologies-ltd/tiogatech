import { describe, expect, it } from "vitest";
import { PRODUCTS } from "@/data/products";
import type { RetailProduct } from "@/types/retail";
import { buildRetailFacets, emptyRetailFilters, extractProductFacets, matchesRetailFilters, measurements, readRetailFilters, writeRetailFilters } from "@/lib/retailFilters";

const product = (overrides: Partial<RetailProduct> = {}): RetailProduct => ({
  id: "battery", name: "Test 5.12kWh LiFePO4 battery", category: "Batteries", brand: "Test", series: null,
  description: "Wall-mounted solar battery", features: [], best_for: "Backup", price: "₦1,000,000", numeric_price: 1000000,
  tier: "mid", image_url: null, specifications: { "Nominal Energy": "5.12 kWh (5120Wh)", "Voltage / Capacity": "51.2V / 100Ah", "Warranty": "5 years" },
  tags: [], stock_status: "in_stock", ...overrides,
});
const index = (products: RetailProduct[]) => products.map(product => ({ product, facets: extractProductFacets(product) }));

describe("unit-aware retail specifications", () => {
  it("keeps 5kWh, 5.12kWh and 15kWh separate", () => {
    expect(measurements("5 kWh / 5.12kWh / 15kWh / 1500W", "kWh")).toEqual([5, 5.12, 15]);
    const filters = { ...emptyRetailFilters("Batteries"), specs: { energy: ["5kWh"] } };
    const rows = index([product(), product({ id: "five", name: "5kWh battery", specifications: { Capacity: "5kWh" } }), product({ id: "fifteen", specifications: { Capacity: "15kWh" } })]);
    expect(rows.filter(row => matchesRetailFilters(row, filters)).map(row => row.product.id)).toEqual(["five"]);
  });
  it("groups nominal voltage equivalents and extracts Ah independently", () => {
    expect(extractProductFacets(product())).toMatchObject({ voltage: ["48V / 51.2V"], energy: ["5.12kWh"], ah: ["100Ah"], chemistry: ["LiFePO4"] });
    expect(extractProductFacets(product({ name: "24V battery", specifications: { "Voltage / Capacity": "25.6V / 200Ah", Capacity: "5.12kWh" } })).voltage).toEqual(["24V / 25.6V"]);
  });
  it("uses nominal capacity rather than expansion limits or rounded tags", () => {
    const facets = extractProductFacets(product({ tags: ["5kwh"], specifications: { "Nominal Energy": "5.12kWh", "Usable Energy": "4.6kWh", "Parallel Capacity": "16 units (81.92kWh)" } }));
    expect(facets.energy).toEqual(["5.12kWh"]);
  });
  it("does not confuse battery voltage with inverter PV/AC voltages or power with surge output", () => {
    const facets = extractProductFacets(product({ category: "Inverters", name: "Test 5kW Hybrid Inverter", specifications: { "Rated AC Output": "5,000W Continuous / 10,000W Surge", "Nominal DC Voltage": "48Vdc (40V - 60V Range)", "Max Solar PV Voltage": "500Vdc", "Rated AC Voltage": "230V" } }));
    expect(facets.voltage).toEqual(["48V / 51.2V"]);
    expect(facets.kw).toEqual(["5kW"]);
    expect(facets.kva).toBeUndefined();
    expect(facets.inverterType).toContain("Hybrid");
  });
  it("preserves kVA separately and converts W to kW without assuming a power factor", () => {
    const facets = extractProductFacets(product({ category: "Inverters", name: "3kVA / 2.5kW 24V Inverter", specifications: {} }));
    expect(facets.kva).toEqual(["3kVA"]);
    expect(facets.kw).toEqual(["2.5kW"]);
  });
  it("ignores operating voltage endpoints and PV voltages in master-sheet descriptions", () => {
    const nominal = extractProductFacets(product({ specifications: { "Nominal Voltage": "51.2V", "Operating Voltage": "44.8V ~ 57.6V" } }));
    expect(nominal.voltage).toEqual(["48V / 51.2V"]);
    const inverter = extractProductFacets(product({ category: "Inverters", name: "SRNE HF2430S80-H", specifications: { SKU: "INV-016", "Rated Capacity": "3.3 kW" } }));
    expect(inverter.voltage).toEqual(["24V / 25.6V"]);
  });
  it("excludes uncertain source voltages and mathematically inconsistent battery specs", () => {
    expect(extractProductFacets(product({ specifications: { SKU: "BAT-016", "Nominal Voltage": "24V", Capacity: "5.12kWh 100Ah" } })).voltage).toBeUndefined();
    expect(extractProductFacets(product({ specifications: { "Nominal Voltage": "24V", Capacity: "5.12kWh 100Ah" } })).voltage).toBeUndefined();
  });
  it("converts portable battery Wh to kWh and does not treat output W as battery energy", () => {
    const facets = extractProductFacets(product({ category: "Portable Power Stations", name: "Portable power station 2000W / 1920Wh", specifications: { Capacity: "1920Wh" } }));
    expect(facets.energy).toEqual(["1.92kWh"]);
    expect(facets.kw).toEqual(["2kW"]);
  });
  it("extracts panel wattage, cell technology and bifacial design", () => {
    const facets = extractProductFacets(product({ category: "Solar Panels", name: "620W N-Type TOPCon Bifacial Monocrystalline Panel", specifications: {} }));
    expect(facets).toMatchObject({ watts: ["620W"], panelType: ["Monocrystalline"], cellType: ["TOPCon"], bifacial: ["Bifacial"] });
    expect(facets.energy).toBeUndefined();
  });
});

describe("combined retail filters", () => {
  const rows = index([product(), product({ id: "other-brand", brand: "Other", numeric_price: 2000000 }), product({ id: "out", stock_status: "out_of_stock" }), product({ id: "pre", stock_status: "pre_order" }), product({ id: "request", numeric_price: 0, price: null })]);
  it("combines groups with AND and choices within a group with OR", () => {
    const filters = { ...emptyRetailFilters("Batteries"), brands: ["Test", "Other"], specs: { voltage: ["48V / 51.2V"], energy: ["5.12kWh", "5kWh"] }, maxPrice: 1500000, inStockOnly: true };
    expect(rows.filter(row => matchesRetailFilters(row, filters)).map(row => row.product.id)).toEqual(["battery"]);
  });
  it("treats low stock as available and excludes preorders, sold-out and unknown-stock items", () => {
    const filters = { ...emptyRetailFilters(), inStockOnly: true };
    expect(matchesRetailFilters(index([product({ stock_status: "low_stock" })])[0], filters)).toBe(true);
    expect(matchesRetailFilters(index([product({ stock_status: undefined })])[0], filters)).toBe(false);
    expect(rows.filter(row => matchesRetailFilters(row, filters)).map(row => row.product.id)).not.toContain("pre");
  });
  it("includes price-on-request by default but excludes it from numeric price filters", () => {
    const row = rows.find(row => row.product.id === "request")!;
    expect(matchesRetailFilters(row, emptyRetailFilters())).toBe(true);
    expect(matchesRetailFilters(row, { ...emptyRetailFilters(), maxPrice: 5000000 })).toBe(false);
  });
  it("builds category-specific counts without trapping selected options", () => {
    const filters = { ...emptyRetailFilters("Batteries"), brands: ["Test"], maxPrice: 1500000 };
    const options = buildRetailFacets(rows, filters);
    expect(options.brands.find(option => option.value === "Other")?.count).toBe(0);
    expect(options.groups.find(group => group.key === "energy")?.options.find(option => option.value === "5.12kWh")?.count).toBe(3);
    expect(options.groups.some(group => group.key === "kva")).toBe(false);
  });
  it("has no arbitrary upper price cap and searches specifications", () => {
    const row = index([product({ numeric_price: 75000000, specifications: { "Nominal Voltage": "307.2V", "Model": "XYZ-123" } })])[0];
    expect(matchesRetailFilters(row, { ...emptyRetailFilters(), search: "XYZ-123" })).toBe(true);
    expect(buildRetailFacets([row], emptyRetailFilters()).maxPrice).toBe(75000000);
  });
  it("does not mix solar panels with solar street lights", () => {
    const rows = index([product({ category: "Solar Street Lights" }), product({ category: "Solar Panels", id: "panel" })]);
    expect(rows.filter(row => matchesRetailFilters(row, emptyRetailFilters("Solar Panels"))).map(row => row.product.id)).toEqual(["panel"]);
  });
  it("round-trips combined filters and preserves campaign attribution", () => {
    const filters = { ...emptyRetailFilters("Batteries"), brands: ["Test", "Other"], specs: { voltage: ["48V / 51.2V"], energy: ["5.12kWh"] }, minPrice: 100000, maxPrice: 2000000, inStockOnly: true, search: "wall" };
    const params = writeRetailFilters(filters, new URLSearchParams("utm_source=newsletter"));
    expect(readRetailFilters(params)).toEqual(filters);
    expect(params.get("utm_source")).toBe("newsletter");
    expect(readRetailFilters(new URLSearchParams("minPrice=NaN&maxPrice=-2")).maxPrice).toBeNull();
  });
  it("groups brand aliases without changing product data used by pricing and promotions", () => {
    const original = product({ brand: "LuxPower" });
    const rows = index([original, product({ id: "alias", brand: "Luxpower" })]);
    expect(buildRetailFacets(rows, emptyRetailFilters()).brands).toEqual([{ value: "Luxpower", count: 2 }]);
    expect(matchesRetailFilters(rows[0], { ...emptyRetailFilters(), brands: ["Luxpower"] })).toBe(true);
    expect(original.brand).toBe("LuxPower");
  });
});

it("extracts useful battery filters from the real catalog", () => {
  const rows = index(PRODUCTS.filter(p => p.category === "Batteries").map(p => product({ ...p, series: p.series ?? null, price: p.price ?? null, image_url: p.image_url ?? null, stock_status: p.stock_status === "preorder" ? "pre_order" : p.stock_status })));
  const options = buildRetailFacets(rows, emptyRetailFilters("Batteries"));
  expect(options.groups.find(group => group.key === "energy")?.options.map(option => option.value)).toEqual(expect.arrayContaining(["5kWh", "5.12kWh", "10.24kWh"]));
  expect(options.groups.find(group => group.key === "voltage")?.options.map(option => option.value)).toEqual(expect.arrayContaining(["24V / 25.6V", "48V / 51.2V"]));
  expect(options.groups.find(group => group.key === "voltage")?.options.map(option => option.value)).not.toEqual(expect.arrayContaining(["44.8V", "57.6V"]));
  const capacities = options.groups.find(group => group.key === "energy")!.options.map(option => option.value);
  expect(capacities.indexOf("5kWh")).toBeLessThan(capacities.indexOf("5.12kWh"));
});
