import {
  findApplianceWatts,
  estimateWatts,
  type ApplianceCategory,
} from "@/data/applianceWatts";
import type { SolarPackage } from "@/hooks/useSolarPackages";

export interface ParsedAppliance {
  qty: number;
  key: string;
  label: string;
  raw: string;
  category: ApplianceCategory;
  wattsEach: number;
  totalWatts: number;
}

export type HeavyLoadKey =
  | "ac_1hp"
  | "ac_1_5hp"
  | "ac_2hp"
  | "fridge"
  | "freezer"
  | "washing_machine"
  | "water_pump"
  | "borehole_pump"
  | "microwave"
  | "iron";

export interface HeavyLoadSpec {
  key: HeavyLoadKey;
  shortLabel: string;
  label: string;
  runWatts: number;
  surgeWatts: number;
  minKwYes: number;
  minKwLimited: number;
  limitedNote: string;
  noNote: string;
  yesNote: string;
  matchPattern: RegExp;
}

export const HEAVY_LOAD_CHECKS: HeavyLoadSpec[] = [
  {
    key: "ac_1hp",
    shortLabel: "1HP AC",
    label: "1HP Inverter AC",
    runWatts: 900,
    surgeWatts: 1800,
    minKwYes: 3.0,
    minKwLimited: 2.0,
    yesNote: "Runs comfortably (inverter AC recommended for overnight use)",
    limitedNote: "Daytime solar run only; turn off heavy kitchen loads alongside",
    noNote: "Requires at least a 3kW inverter for safe AC operation",
    matchPattern: /\b1\s*hp\b.*\bacs?\b|\bacs?\b.*\b1\s*hp\b/i,
  },
  {
    key: "ac_1_5hp",
    shortLabel: "1.5HP AC",
    label: "1.5HP AC",
    runWatts: 1400,
    surgeWatts: 3000,
    minKwYes: 4.5,
    minKwLimited: 3.0,
    yesNote: "Handles 1.5HP AC startup surge and steady cooling",
    limitedNote: "Inverter-type 1.5HP AC only; avoid running with pump or microwave",
    noNote: "Needs a 3kW+ (ideally 5kW) inverter for 1.5HP compressor surge",
    matchPattern: /1\.5\s*hp|\binverter\s+ac/i,
  },
  {
    key: "ac_2hp",
    shortLabel: "2HP AC",
    label: "2HP AC",
    runWatts: 1850,
    surgeWatts: 4000,
    minKwYes: 6.0,
    minKwLimited: 5.0,
    yesNote: "Handles 2HP AC load alongside household essentials",
    limitedNote: "Inverter 2HP AC recommended; avoid simultaneous heavy appliances",
    noNote: "Requires a 5kW–6kW+ inverter for 2HP startup surge",
    matchPattern: /\b2\s*hp\b.*\bacs?\b/i,
  },
  {
    key: "fridge",
    shortLabel: "Fridge",
    label: "Refrigerator",
    runWatts: 180,
    surgeWatts: 850,
    minKwYes: 2.0,
    minKwLimited: 1.2,
    yesNote: "Runs standard single or double-door fridge 24/7",
    limitedNote: "Best with a small energy-efficient inverter fridge",
    noNote: "Below recommended inverter capacity for fridge compressor surge",
    matchPattern: /\bfridge|refrigerator\b/i,
  },
  {
    key: "freezer",
    shortLabel: "Freezer",
    label: "Deep Freezer",
    runWatts: 260,
    surgeWatts: 1200,
    minKwYes: 3.0,
    minKwLimited: 2.0,
    yesNote: "Runs medium or large deep freezer reliably",
    limitedNote: "Small chest freezer (≤200L); avoid starting alongside pump",
    noNote: "Requires a 2kW–3kW+ inverter for deep freezer startup surge",
    matchPattern: /\bfreezer\b/i,
  },
  {
    key: "water_pump",
    shortLabel: "Pump",
    label: "Pumping Machine (0.5–1HP)",
    runWatts: 750,
    surgeWatts: 2100,
    minKwYes: 3.5,
    minKwLimited: 2.5,
    yesNote: "Handles 0.5HP–1HP surface pumping machine smoothly",
    limitedNote: "0.5HP–0.75HP pump works when other heavy loads are paused",
    noNote: "Requires ≥ 2.5kW–3.5kW inverter for pump motor inrush current",
    matchPattern: /\bwater\s*pump|pumping\s*machine|pump\b/i,
  },
  {
    key: "borehole_pump",
    shortLabel: "Borehole",
    label: "Submersible Borehole Pump (1–1.5HP)",
    runWatts: 1100,
    surgeWatts: 3200,
    minKwYes: 5.0,
    minKwLimited: 3.5,
    yesNote: "Supports 1HP–1.5HP submersible borehole pump",
    limitedNote: "1HP borehole pump works best during daytime solar peak",
    noNote: "Requires ≥ 5kW inverter for submersible borehole motor startup",
    matchPattern: /\bborehole\b/i,
  },
  {
    key: "washing_machine",
    shortLabel: "Washer",
    label: "Washing Machine",
    runWatts: 550,
    surgeWatts: 1500,
    minKwYes: 3.0,
    minKwLimited: 2.0,
    yesNote: "Runs cold-wash cycles cleanly (skip hot-water heating mode)",
    limitedNote: "Cold wash only; pause other heavy appliances while spinning",
    noNote: "Requires at least a 2.5kW–3kW inverter for motor spin surge",
    matchPattern: /\bwash(ing)?\s*machine|washer\b/i,
  },
  {
    key: "microwave",
    shortLabel: "Microwave",
    label: "Microwave Oven",
    runWatts: 1000,
    surgeWatts: 1400,
    minKwYes: 3.0,
    minKwLimited: 2.0,
    yesNote: "Runs short 2–5 minute heating cycles smoothly",
    limitedNote: "Short heating bursts only when other appliances are light",
    noNote: "High resistive draw; needs ≥ 2.5kW–3kW inverter",
    matchPattern: /\bmicrowave\b/i,
  },
  {
    key: "iron",
    shortLabel: "Iron",
    label: "Pressing Iron",
    runWatts: 1200,
    surgeWatts: 1200,
    minKwYes: 4.0,
    minKwLimited: 3.0,
    yesNote: "Supports pressing iron (best used during sunny daytime)",
    limitedNote: "Daytime use only to preserve night battery reserve",
    noNote: "Heating coils drain small batteries quickly; needs ≥ 3kW–4kW",
    matchPattern: /\biron\b/i,
  },
];

export const CARD_HEAVY_LOAD_KEYS: HeavyLoadKey[] = ["ac_1_5hp", "fridge", "water_pump"];

function normalizeApplianceKey(rawName: string): string {
  const s = rawName.toLowerCase();
  if (/1\.5\s*hp.*acs?|acs?.*1\.5\s*hp/.test(s)) return "ac_1_5hp";
  if (/2\s*hp.*acs?|acs?.*2\s*hp/.test(s)) return "ac_2hp";
  if (/\bacs?\b|air\s*con/.test(s)) return "ac_1hp";
  if (/borehole/.test(s)) return "borehole_pump";
  if (/pump/.test(s)) return "water_pump";
  if (/freezer/.test(s)) return "freezer";
  if (/fridge|refrigerator/.test(s)) return "fridge";
  if (/wash/.test(s)) return "washing_machine";
  if (/microwave/.test(s)) return "microwave";
  if (/iron/.test(s)) return "iron";
  if (/bulb|light|lamp/.test(s)) return "bulb";
  if (/fan/.test(s)) return "fan";
  if (/\btv\b|television/.test(s)) return "tv";
  if (/laptop|computer|\bpc\b/.test(s)) return "laptop";
  if (/router|wifi|starlink|internet/.test(s)) return "router";
  if (/cctv|camera|security/.test(s)) return "cctv";
  if (/decoder|dstv|gotv/.test(s)) return "decoder";
  if (/blender/.test(s)) return "blender";
  if (/kettle/.test(s)) return "kettle";
  if (/sound|speaker|home\s*theater/.test(s)) return "sound";
  return s.replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "") || "other";
}

function cleanDisplayLabel(rawName: string): string {
  const trimmed = rawName.trim().replace(/\.$/, "");
  if (!trimmed) return "Appliance";
  // Capitalize first letter unless it starts with a known acronym or number
  if (/^[0-9]/.test(trimmed) || /^(LED|TV|AC|CCTV|DSTV|WiFi)/i.test(trimmed)) {
    return trimmed;
  }
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

/**
 * Parses a package's comma-separated `appliances` description into structured
 * records with quantity, canonical key, category (for lucide icon mapping), and
 * estimated wattage from `src/data/applianceWatts.ts`.
 */
export function parseAppliances(appliancesStr: string | null | undefined): ParsedAppliance[] {
  if (!appliancesStr || typeof appliancesStr !== "string") return [];

  const tokens = appliancesStr
    .split(/[,;]+|\band\b/i)
    .map((t) => t.trim())
    .filter(Boolean);

  const results: ParsedAppliance[] = [];

  for (const token of tokens) {
    // Pattern 1: "2 × 1HP inverter ACs (daytime)" or "2 x 1.5HP AC"
    const multMatch = token.match(/^(\d+)\s*[x×]\s*(.+)$/i);
    // Pattern 2: "8 LED bulbs", "15+ bulbs", "1 fridge" (avoid eating "1.5HP AC" or "1HP AC"!)
    const qtyMatch = !multMatch
      ? token.match(/^(\d+)\+?\s+(?!hp\b|kva\b|kw\b)(.+)$/i)
      : null;

    let qty = 1;
    let namePart = token;

    if (multMatch) {
      qty = Math.max(1, parseInt(multMatch[1], 10) || 1);
      namePart = multMatch[2].trim();
    } else if (qtyMatch) {
      qty = Math.max(1, parseInt(qtyMatch[1], 10) || 1);
      namePart = qtyMatch[2].trim();
    }

    const strippedForLookup = namePart.replace(/\([^)]*\)/g, "").trim();
    const info = findApplianceWatts(strippedForLookup) || estimateWatts(strippedForLookup);
    const key = normalizeApplianceKey(strippedForLookup);

    results.push({
      qty,
      key,
      label: cleanDisplayLabel(namePart),
      raw: token,
      category: info.category,
      wattsEach: info.avgWatts,
      totalWatts: info.avgWatts * qty,
    });
  }

  return results;
}

/**
 * Infers continuous AC output capacity in kW for any solar package —
 * using explicit `largest_load_kw` on official Lithium packages and parsing
 * kW / kVA ratings from the inverter name on Tubular & High-Voltage packages.
 */
export function inferPackageLoadKw(pkg: Partial<SolarPackage>): number {
  if (typeof pkg.largest_load_kw === "number" && pkg.largest_load_kw > 0) {
    return pkg.largest_load_kw;
  }
  const text = `${pkg.name || ""} ${pkg.inverter || ""}`;

  // Dual inverter e.g. "2 × ... 12kW"
  const dualKw = text.match(/(\d+)\s*[x×]\s*.*?(\d+(?:\.\d+)?)\s*kw/i);
  if (dualKw) {
    const count = parseFloat(dualKw[1]);
    const kw = parseFloat(dualKw[2]);
    if (count > 0 && kw > 0 && count <= 6) return Math.round(count * kw * 10) / 10;
  }

  // Direct kW rating (take largest mentioned if range)
  const kwMatches = [...text.matchAll(/(\d+(?:\.\d+)?)\s*kw\b/gi)].map((m) => parseFloat(m[1]));
  if (kwMatches.length > 0) {
    return Math.max(...kwMatches);
  }

  // kVA rating (assume 0.8 power factor; for "2.5KVA/3.5KVA" take the lower conservative rating)
  const kvaMatches = [...text.matchAll(/(\d+(?:\.\d+)?)\s*kva\b/gi)].map((m) => parseFloat(m[1]));
  if (kvaMatches.length > 0) {
    const baseKva = kvaMatches[0];
    return Math.round(baseKva * 0.8 * 10) / 10;
  }

  return 1.5;
}

/**
 * Returns a concise human-readable night backup label for any package
 * (including Tubular/Gel and High-Voltage packages that don't store `night_backup_hours`).
 */
export function inferNightBackupLabel(pkg: Partial<SolarPackage>): string {
  if (pkg.night_backup_hours && pkg.night_backup_hours.trim()) {
    // Trim parenthetical wattage for compact card line if needed, keep core hours
    return pkg.night_backup_hours.replace(/\s*\([^)]*\)/, "").trim();
  }
  const bat = (pkg.battery || "").toLowerCase();
  const kwhMatch = bat.match(/(\d+(?:\.\d+)?)\s*kwh/i);
  if (kwhMatch) {
    const kwh = parseFloat(kwhMatch[1]);
    if (kwh >= 20) return "~10–14 hrs";
    if (kwh >= 10) return "~8–12 hrs";
    if (kwh >= 5) return "~7–9 hrs";
    return "~5–6 hrs";
  }
  // Tubular 220Ah x N
  const ahCount = bat.match(/2\d0\s*ah\s*[x×]\s*(\d+)/i) || bat.match(/(\d+)\s*[x×]\s*2\d0\s*ah/i);
  if (ahCount) {
    const n = parseInt(ahCount[1], 10);
    if (n >= 8) return "~8–12 hrs";
    if (n >= 4) return "~7–10 hrs";
    if (n >= 2) return "~6–8 hrs";
    return "~4–6 hrs";
  }
  return "~6–8 hrs";
}

export interface CanRunResult {
  status: "yes" | "limited" | "no";
  reason: string;
}

/**
 * Determines whether a solar package can safely power a heavy household load.
 */
export function canRun(
  pkg: Partial<SolarPackage>,
  applianceKey: HeavyLoadKey | string,
): CanRunResult {
  const spec = HEAVY_LOAD_CHECKS.find((c) => c.key === applianceKey);
  const kw = inferPackageLoadKw(pkg);

  if (!spec) {
    return kw >= 3
      ? { status: "yes", reason: `Supported by ${kw} kW inverter output` }
      : { status: "limited", reason: `Check appliance wattage against ${kw} kW capacity` };
  }

  const explicitlyListed = Boolean(pkg.appliances && spec.matchPattern.test(pkg.appliances));

  // If the package explicitly lists this appliance AND meets at least the limited kW floor, trust the engineering sizing
  if (kw >= spec.minKwYes || (explicitlyListed && kw >= spec.minKwLimited)) {
    return { status: "yes", reason: spec.yesNote };
  }
  if (kw >= spec.minKwLimited) {
    return { status: "limited", reason: spec.limitedNote };
  }
  return { status: "no", reason: spec.noNote };
}

export interface PackagePowerSummary {
  parsed: ParsedAppliance[];
  totalApplianceWatts: number;
  capacityKw: number;
  capacityWatts: number;
  loadPercent: number;
  nightBackupShort: string;
  nightBackupFull: string;
}

export function getPackagePowerSummary(pkg: Partial<SolarPackage>): PackagePowerSummary {
  const parsed = parseAppliances(pkg.appliances);
  const totalApplianceWatts = parsed.reduce((sum, item) => sum + item.totalWatts, 0);
  const capacityKw = inferPackageLoadKw(pkg);
  const capacityWatts = Math.round(capacityKw * 1000);
  // Typical simultaneous diversity factor (~65% of connected list runs at once)
  const simultaneousWatts = Math.round(totalApplianceWatts * 0.65);
  const loadPercent =
    capacityWatts > 0
      ? Math.min(100, Math.max(12, Math.round((simultaneousWatts / capacityWatts) * 100)))
      : 45;
  const nightBackupShort = inferNightBackupLabel(pkg);
  const nightBackupFull = pkg.night_backup_hours?.trim() || nightBackupShort;

  return {
    parsed,
    totalApplianceWatts,
    capacityKw,
    capacityWatts,
    loadPercent,
    nightBackupShort,
    nightBackupFull,
  };
}
