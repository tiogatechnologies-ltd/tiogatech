import type { RetailProduct } from "@/types/retail";
import masterSpecifications from "@/data/retailMasterSpecifications.json";

export const FACET_LABELS = {
  voltage: "Battery / system voltage", energy: "Battery capacity", ah: "Battery capacity (Ah)",
  kw: "Rated output (kW)", kva: "Rated output (kVA)", watts: "Power rating (W)",
  phase: "Phase", inverterType: "Inverter type", chemistry: "Battery type", mounting: "Battery format",
  panelType: "Panel type", cellType: "Cell technology", bifacial: "Panel design", controller: "Charge controller",
  protocol: "Connectivity", current: "Rated current", resolution: "Camera resolution", unlock: "Unlock methods", warranty: "Warranty",
} as const;
export type FacetKey = keyof typeof FACET_LABELS;
export type ProductFacets = Partial<Record<FacetKey, string[]>>;
export type RetailFilterState = {
  category: string | null; brands: string[]; specs: ProductFacets;
  minPrice: number | null; maxPrice: number | null; inStockOnly: boolean; search: string;
};
export type IndexedProduct = { product: RetailProduct; facets: ProductFacets };
export type FacetOption = { value: string; count: number };
export type FacetGroup = { key: FacetKey; label: string; options: FacetOption[] };
export const emptyRetailFilters = (category: string | null = null): RetailFilterState => ({ category, brands: [], specs: {}, minPrice: null, maxPrice: null, inStockOnly: false, search: "" });
const text = (value: unknown) => String(value ?? "").replace(/,/g, "").replace(/[–—]/g, "-");
const norm = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, "");
const brandKey = (brand: string) => norm(brand).replace(/^bread$/, "breadenergy");
const brandAliases = new Map(Object.entries({ bread: "Bread Energy", breadenergy: "Bread Energy", luxpower: "Luxpower", alpsolar: "AlpSolarr", alpsolarr: "AlpSolarr", solarpro: "SolarPro", suness: "Suness", srne: "SRNE", ecoflow: "EcoFlow" }));
export const normalizeRetailBrand = (brand: string) => brandAliases.get(norm(brand)) ?? brand.trim();
const sourceById = new Map(masterSpecifications.map(row => [row.id, row]));

function sourceFor(product: RetailProduct) {
  const sku = product.specifications?.SKU || product.sku || product.id.match(/((?:INV|BAT|PNL|AIO|PPS|CC|PUMP|SL)-\d+)$/i)?.[1];
  const bySku = sourceById.get((sku ?? "").toUpperCase());
  if (bySku) return bySku;
  const stripBrand = (value: string, brand: string) => { const n = norm(value); const b = norm(brand); return b && n.startsWith(b) ? n.slice(b.length) : n; };
  const model = stripBrand(product.specifications?.Model || product.name, product.brand ?? "");
  const matches = masterSpecifications.filter(row => brandKey(row.brand) === brandKey(product.brand ?? "") && stripBrand(row.model, row.brand) === model);
  return matches.length === 1 ? matches[0] : undefined;
}

/** Read an explicit unit as a number: 5kWh never matches 15kWh or 5.12kWh. */
export function measurements(value: string, unit: string): number[] {
  const pattern = new RegExp(`(?:^|[^\\d.])([\\d]+(?:\\.\\d+)?)\\s*${unit}(?![a-z])`, "gi");
  return [...text(value).matchAll(pattern)].map(match => Number(match[1])).filter(Number.isFinite);
}
const numberLabel = (value: number, unit: string) => `${Number(value.toFixed(3))}${unit}`;
const voltageLabel = (value: number) => {
  if (value === 12 || value === 12.8) return "12V / 12.8V";
  if (value === 24 || value === 25.6) return "24V / 25.6V";
  if (value === 48 || value === 51.2) return "48V / 51.2V";
  return numberLabel(value, "V");
};
const batteryCategory = (category: string) => /batter/i.test(category);
const inverterCategory = (category: string) => /inverter/i.test(category);
const storageCategory = (category: string) => /batter|ess|all.in.one|power station/i.test(category);
const specEntries = (product: RetailProduct) => Object.entries(product.specifications ?? {}).filter(([key]) => !/price|pricing|dealer|installer|cost/i.test(key));

export function extractProductFacets(product: RetailProduct): ProductFacets {
  const facets: ProductFacets = {};
  const source = sourceFor(product);
  const entries = specEntries(product);
  const named = (key: RegExp) => entries.filter(([name]) => key.test(name)).map(([, value]) => text(value)).join("; ");
  const identity = [product.name, product.specifications?.["Key Specs"], source?.description].filter(Boolean).join("; ");
  const details = [identity, ...entries.map(([, value]) => value), ...(product.features ?? [])].join("; ");
  const add = (key: FacetKey, values: string[]) => { if (values.length) facets[key] = [...new Set(values)]; };
  const primary = (key: FacetKey, values: number[], unit: string) => add(key, values.length ? [numberLabel(values[0], unit)] : []);
  const sourceRating = source ? `${source.rating}${source.unit}` : "";
  const category = product.category;

  if (storageCategory(category)) {
    // Nominal energy takes precedence over usable energy, expansion limits and
    // rounded marketing tags. Do not infer battery energy from inverter power.
    const energy = measurements(named(/^(nominal energy|system energy|total energy|total system energy|system total energy|energy rating|storage capacity|battery energy|battery capacity|rated capacity|nominal capacity|capacity)$/i), "kWh");
    const fallbackEnergy = measurements(identity, "kWh");
    const wh = measurements(named(/capacity|energy/i) || identity, "Wh");
    primary("energy", energy.length ? energy : fallbackEnergy.length ? fallbackEnergy : wh.length ? [wh[0] / 1000] : measurements(sourceRating, "kWh"), "kWh");
    primary("ah", measurements(named(/capacity/i), "Ah").concat(measurements(identity, "Ah")), "Ah");
    const chemistry = named(/chemistry|cell type|technology|battery type/i) || identity;
    if (/lifepo4|lithium iron phosphate/i.test(chemistry)) add("chemistry", ["LiFePO4"]);
    else if (/tubular/i.test(chemistry)) add("chemistry", ["Tubular lead-acid"]);
    else if (/\bgel\b/i.test(chemistry)) add("chemistry", ["Gel lead-acid"]);
    else if (/\bagm\b/i.test(chemistry)) add("chemistry", ["AGM lead-acid"]);
    else if (/lithium|li.ion/i.test(chemistry)) add("chemistry", ["Lithium-ion"]);
    if (batteryCategory(category) && /busbar|cable|battery rack|rack cabinet|combiner|bms controller|battery connector/i.test(product.name)) add("chemistry", ["Battery accessories"]);
    const format = named(/mount|form factor|enclosure/i) || identity;
    add("mounting", [
      /wall|powerwall/i.test(format) ? "Wall-mounted" : "",
      /rack/i.test(format) ? "Rack-mounted" : "",
      /stack/i.test(format) ? "Stackable" : "",
      /wheel|roller|floor|standing/i.test(format) ? "Floor / wheeled" : "",
      /cabinet/i.test(format) ? "Cabinet" : "",
    ].filter(Boolean));
  }
  if (storageCategory(category) || inverterCategory(category) || /charge controller/i.test(category)) {
    // Deliberately exclude PV/MPPT and AC voltages: a 500V PV input does not make
    // an inverter a 500V battery system. A range is not an exact nominal voltage.
    const voltage = named(/^(nominal (?:dc |system |dc battery |battery )?voltage|battery (?:dc |bus |nominal |system )?voltage|dc voltage|system voltage|voltage \/ capacity|voltage class|battery voltage support)$/i) || named(/^operating voltage$/i);
    const range = named(/battery voltage range|battery voltage architecture|battery architecture|system voltage range/i);
    const nominalVoltage = voltage.replace(/\([^)]*\)/g, "").replace(/\d+(?:\.\d+)?\s*V?(?:dc)?\s*(?:-|~|～|to)\s*\d+(?:\.\d+)?\s*V(?:dc)?/gi, "");
    let volts = measurements(nominalVoltage, "V(?:dc)?");
    if (!volts.length && !range) volts = measurements(product.name, "V(?:dc)?").concat(measurements(product.specifications?.["Key Specs"] ?? "", "V(?:dc)?")).slice(0, 1);
    if (!volts.length && !range) volts = measurements(source?.description ?? "", "V(?:dc)?").slice(0, 1);
    if (!source?.voltageUnconfirmed) {
      // Numeric contradictions in source specs must not become false matches.
      const energy = Number.parseFloat(facets.energy?.[0] ?? "");
      const ah = Number.parseFloat(facets.ah?.[0] ?? "");
      const inconsistent = batteryCategory(category) && volts[0] && ah && energy && Math.abs(volts[0] * ah / 1000 - energy) / energy > 0.2;
      if (!inconsistent) add("voltage", volts.map(value => value > 60 ? "High voltage (over 60V)" : voltageLabel(value)));
      if ((!volts.length && (/high.voltage|\bHV\b/i.test(range || identity) || Number.parseFloat(range) > 60)) || (volts.length && volts.every(v => v > 60))) add("voltage", ["High voltage (over 60V)"]);
    }
  }
  if (inverterCategory(category) || /ess|all.in.one|power station/i.test(category)) {
    const power = named(/^(rated (?:ac output(?: power)?|output power|continuous power|power|output|capacity)|inverter (?:output|rating)|ac output)$/i);
    primary("kw", measurements(power, "kW").concat(measurements(identity, "kW")), "kW");
    if (!facets.kw) primary("kw", measurements(power || product.name, "W").map(v => v / 1000), "kW");
    primary("kva", measurements(power, "kVA").concat(measurements(identity, "kVA")).concat(measurements(sourceRating, "kVA")), "kVA");
    const phase = named(/phase/i) || `${product.name}; ${power}; ${source?.type ?? ""}`;
    if (/three.phase|3.phase/i.test(phase)) add("phase", ["Three-phase"]);
    else if (/single.phase|1.phase/i.test(phase)) add("phase", ["Single-phase"]);
    const kind = named(/^type$|system type/i) || identity;
    add("inverterType", [/hybrid/i.test(kind) ? "Hybrid" : "", /off.grid/i.test(kind) ? "Off-grid" : "", /(?:on|grid).tie|on.grid/i.test(kind) ? "On-grid" : "", /micro.?inverter/i.test(kind) ? "Microinverter" : ""].filter(Boolean));
    add("controller", [/\bmppt\b/i.test(details) ? "MPPT" : "", /\bpwm\b/i.test(details) ? "PWM" : ""].filter(Boolean));
  }
  if (/charge controller/i.test(category)) add("controller", [/\bmppt\b/i.test(details) ? "MPPT" : "", /\bpwm\b/i.test(details) ? "PWM" : ""].filter(Boolean));
  if (/solar panel|solar street light|solar lighting|solar pump/i.test(category)) {
    primary("watts", measurements(named(/^(peak power|power rating|rated (?:maximum )?power|maximum power|led (?:rated )?power|motor power)/i), "W").concat(measurements(product.name, "W")), "W");
    if (/solar panel/i.test(category)) {
      const type = named(/cell type|cell technology|technology|cell architecture/i) || `${identity}; ${source?.type ?? ""}`;
      add("panelType", [/monocrystalline|\bmono\b/i.test(type) ? "Monocrystalline" : "", /polycrystalline|\bpoly\b/i.test(type) ? "Polycrystalline" : ""].filter(Boolean));
      add("cellType", [/topcon/i.test(type) ? "TOPCon" : "", /perc/i.test(type) ? "PERC" : "", /\bhjt\b|heterojunction/i.test(type) ? "HJT" : ""].filter(Boolean));
      add("bifacial", [/bifacial/i.test(details) ? "Bifacial" : "", /monofacial|single.sided/i.test(details) ? "Monofacial" : ""].filter(Boolean));
    }
  }
  if (!storageCategory(category) && !inverterCategory(category)) {
    const protocol = named(/protocol|connectivity|communication/i) || product.name;
    add("protocol", [/wi.?fi/i.test(protocol) ? "Wi-Fi" : "", /zigbee/i.test(protocol) ? "Zigbee" : "", /bluetooth|\bble\b/i.test(protocol) ? "Bluetooth" : "", /\b4g\b/i.test(protocol) ? "4G" : "", /ethernet|\bpoe\b/i.test(protocol) ? "Ethernet / PoE" : ""].filter(Boolean));
    primary("current", measurements(named(/rated (?:charge )?current|nominal current/i) || product.name, "A"), "A");
    if (/camera|cctv|security/i.test(category)) {
      const resolution = named(/resolution/i) || product.name;
      add("resolution", [...measurements(resolution, "MP").map(v => numberLabel(v, "MP")), /\b4k\b/i.test(resolution) ? "4K" : "", /1080p/i.test(resolution) ? "1080p" : ""].filter(Boolean));
    }
    if (/lock/i.test(category)) add("unlock", [/fingerprint/i.test(details) ? "Fingerprint" : "", /face/i.test(details) ? "Face recognition" : "", /\bpin\b|passcode|password/i.test(details) ? "PIN / password" : "", /rfid|\bnfc\b|key.?card/i.test(details) ? "Card / NFC" : "", /app|bluetooth|wi.?fi/i.test(details) ? "App" : ""].filter(Boolean));
  }
  const warranty = named(/^warranty$/i) || source?.warranty || "";
  const years = warranty.match(/(\d+(?:\.\d+)?)\s*[- ]?years?/i);
  if (years && Number(years[1]) <= 30) add("warranty", [`${Number(years[1])} year${Number(years[1]) === 1 ? "" : "s"}`]);
  return facets;
}

export function categoryMatches(product: RetailProduct, category: string | null): boolean {
  if (!category || category === "all") return true;
  const p = product.category.toLowerCase(); const c = category.toLowerCase();
  if (p === c) return true;
  if (/lock/.test(c)) return /lock/.test(p);
  if (/cctv|camera/.test(c)) return /cctv|camera|security/.test(p);
  if (/audio|sound|intercom/.test(c)) return /audio|sound|intercom/.test(p);
  if (/curtain|motor|shading/.test(c)) return /curtain|motor|shading|blind/.test(p);
  return false;
}

export function matchesRetailFilters(item: IndexedProduct, filters: RetailFilterState, ignore?: FacetKey | "brand") {
  const p = item.product;
  if (!categoryMatches(p, filters.category)) return false;
  if (ignore !== "brand" && filters.brands.length && !filters.brands.includes(normalizeRetailBrand(p.brand ?? ""))) return false;
  for (const [key, selected] of Object.entries(filters.specs)) {
    if (key !== ignore && selected?.length && !selected.some(value => item.facets[key as FacetKey]?.includes(value))) return false;
  }
  const price = p.numeric_price ?? 0;
  if ((filters.minPrice !== null || filters.maxPrice !== null) && (!(price > 0) || (filters.minPrice !== null && price < filters.minPrice) || (filters.maxPrice !== null && price > filters.maxPrice))) return false;
  if (filters.inStockOnly && p.stock_status !== "in_stock" && p.stock_status !== "low_stock") return false;
  const q = filters.search.trim().toLowerCase();
  return !q || [p.name, p.brand, p.category, p.description, p.series, p.sku, ...Object.values(p.specifications ?? {}), ...(p.tags ?? [])].join(" ").toLowerCase().includes(q);
}

export function buildRetailFacets(index: IndexedProduct[], filters: RetailFilterState) {
  const categoryProducts = index.filter(item => categoryMatches(item.product, filters.category));
  const options = (key: FacetKey | "brand"): FacetOption[] => {
    const values = (item: IndexedProduct) => key === "brand" ? item.product.brand ? [normalizeRetailBrand(item.product.brand)] : [] : item.facets[key] ?? [];
    const counts = new Map<string, number>();
    for (const item of categoryProducts) for (const value of values(item)) if (!counts.has(value)) counts.set(value, 0);
    for (const item of categoryProducts) if (matchesRetailFilters(item, filters, key)) for (const value of values(item)) counts.set(value, (counts.get(value) ?? 0) + 1);
    for (const selected of key === "brand" ? filters.brands : filters.specs[key] ?? []) if (!counts.has(selected)) counts.set(selected, 0);
    return [...counts].map(([value, count]) => ({ value, count })).sort((a, b) => {
      const first = Number.parseFloat(a.value); const second = Number.parseFloat(b.value);
      return Number.isFinite(first) && Number.isFinite(second) ? first - second || a.value.localeCompare(b.value) : a.value.localeCompare(b.value, undefined, { numeric: true });
    });
  };
  const groups = (Object.keys(FACET_LABELS) as FacetKey[]).map(key => ({ key, label: FACET_LABELS[key], options: options(key) })).filter(group => group.options.length);
  const maxPrice = Math.max(1000, ...categoryProducts.map(item => item.product.numeric_price ?? 0));
  return { groups, brands: options("brand"), maxPrice };
}

const filterKeys = Object.keys(FACET_LABELS) as FacetKey[];
const list = (params: URLSearchParams, key: string) => [...new Set(params.getAll(key).map(v => v.trim().slice(0, 100)).filter(Boolean))].slice(0, 30);
export function readRetailFilters(params: URLSearchParams): RetailFilterState {
  const price = (key: string) => { const raw = params.get(key); const n = Number(raw); return raw !== null && raw.trim() && Number.isFinite(n) && n >= 0 ? n : null; };
  return {
    category: params.get("category") || null, brands: [...new Set(list(params, "brand").map(normalizeRetailBrand))],
    specs: Object.fromEntries(filterKeys.map(key => [key, list(params, key)]).filter(([, value]) => value.length)),
    minPrice: price("minPrice"), maxPrice: price("maxPrice"), inStockOnly: params.get("inStock") === "1", search: params.get("q") ?? "",
  };
}
export function writeRetailFilters(filters: RetailFilterState, existing = new URLSearchParams()) {
  const params = new URLSearchParams(existing);
  for (const key of ["category", "brand", "minPrice", "maxPrice", "inStock", "q", ...filterKeys]) params.delete(key);
  if (filters.category) params.set("category", filters.category);
  for (const brand of filters.brands) params.append("brand", brand);
  for (const [key, values] of Object.entries(filters.specs)) for (const value of values ?? []) params.append(key, value);
  if (filters.minPrice !== null) params.set("minPrice", String(filters.minPrice));
  if (filters.maxPrice !== null) params.set("maxPrice", String(filters.maxPrice));
  if (filters.inStockOnly) params.set("inStock", "1");
  if (filters.search) params.set("q", filters.search);
  return params;
}
