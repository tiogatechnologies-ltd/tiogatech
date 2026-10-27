// Read-only live audit. Source snapshot contains selling prices only, no costs.
// node scripts/audit-retail-prices.mjs --live
import fs from "node:fs";
import { build } from "esbuild";
import { createClient } from "@supabase/supabase-js";
import { pathToFileURL } from "node:url";
import { tmpdir } from "node:os";
import { join } from "node:path";

const master = JSON.parse(fs.readFileSync("src/data/retailMasterPrices.json", "utf8"));
const specs = JSON.parse(fs.readFileSync("src/data/retailMasterSpecifications.json", "utf8"));
const result = await build({ stdin: { contents: `export {PRODUCTS} from "./src/data/products"; export {mergeProducts} from "./src/lib/mergeProducts"; export {masterPriceFor,normalizePriceName,parseRetailPrice} from "./src/lib/retailPricing"; export {CATALOG_PRICES,CATALOG_QUOTE_ONLY_NAMES} from "./supabase/functions/_shared/catalog-prices"; export {buildDbPriceMap,normName} from "./supabase/functions/_shared/pricing";`, resolveDir: process.cwd(), loader: "ts" }, bundle: true, platform: "node", format: "esm", write: false });
const dir = fs.mkdtempSync(join(tmpdir(), "tioga-price-audit-"));
const bundle = join(dir, "audit.mjs"); fs.writeFileSync(bundle, result.outputFiles[0].text);
const { PRODUCTS, mergeProducts, masterPriceFor, normalizePriceName, parseRetailPrice, CATALOG_PRICES, CATALOG_QUOTE_ONLY_NAMES, buildDbPriceMap, normName } = await import(pathToFileURL(bundle).href);
let db = [];
if (process.argv.includes("--live")) {
  const env = Object.fromEntries(fs.readFileSync(".env", "utf8").split(/\r?\n/).filter(line => line.includes("=")).map(line => { const i = line.indexOf("="); return [line.slice(0,i).trim(), line.slice(i+1).trim().replace(/^["']|["']$/g, "")]; }));
  const sb = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_PUBLISHABLE_KEY);
  for (let from = 0;;from += 500) {
    const { data, error } = await sb.from("products").select("*").eq("is_active",true).order("id").range(from,from+499);
    if (error) throw error; db.push(...data); if (data.length < 500) break;
  }
}
const baselinePath = "supabase/.temp/catalog-price-before.json";
const baseline = fs.existsSync(baselinePath) ? JSON.parse(fs.readFileSync(baselinePath, "utf8")) : null;
const beforeByName = new Map([...(baseline?.static ?? []),...(baseline?.db ?? [])].map(p => [normalizePriceName(p.name),p]));
const catalog = mergeProducts(PRODUCTS, db.map(p => ({ ...p, numeric_price: parseRetailPrice(p.price) })));
const server = { ...CATALOG_PRICES, ...buildDbPriceMap({ products: db }) };
const errors = [];
const classified = catalog.map(p => {
  const expected = masterPriceFor(p);
  const before = beforeByName.get(normalizePriceName(p.name));
  const beforePrice = before ? parseRetailPrice(before.price) || before.numeric_price || null : null;
  const actual = p.numeric_price || null;
  const explicitId = p.specifications?.SKU?.toUpperCase();
  const sourceId = explicitId && Object.prototype.hasOwnProperty.call(master.prices,explicitId) ? explicitId : master.aliases[normalizePriceName(p.name)] || "";
  if (expected !== undefined) {
    if (expected === null) {
      if (p.price || actual) errors.push(`${p.name}: must require a quote`);
      if (!CATALOG_QUOTE_ONLY_NAMES.includes(normName(p.name))) errors.push(`${p.name}: missing server quote block`);
    } else if (actual !== expected || parseRetailPrice(p.price) !== expected || server[normName(p.name)] !== expected) errors.push(`${p.name}: catalogue/label/server mismatch`);
  }
  return { p, sourceId, beforePrice, actual, expected, changed: beforePrice !== null && expected !== undefined && beforePrice !== actual };
});
for (const p of db) { const expected = masterPriceFor(p); if (expected !== undefined && parseRetailPrice(p.price) !== expected) errors.push(`Live database price differs: ${p.name}`); }
if (new Set(catalog.map(p => p.id)).size !== catalog.length) errors.push("Duplicate catalogue IDs");
if (Object.keys(master.prices).length !== 440) errors.push("Incomplete source snapshot");
const csv = rows => "\ufeff"+rows.map(row => row.map(value => '"'+String(value ?? "").replaceAll('"','""')+'"').join(",")).join("\r\n")+"\r\n";
fs.mkdirSync("docs/price-audit-2026-10-27", { recursive: true });
const masterRows = specs.map((row,i) => {
  const listings = classified.filter(item => item.sourceId === row.id);
  const supplierSelection = master.supplierSelections[row.id];
  const banner = row.id === "PPS-016";
  return [i+5,row.id,row.brand,row.model,master.prices[row.id],listings.length,listings.map(item=>item.p.name).join("; "),listings.map(item=>item.beforePrice).join("; "),listings.map(item=>item.actual).join("; "),listings.length ? master.prices[row.id] === null ? "Quote required; website price removed" : "Verified" : supplierSelection ? `Alternate supplier quote; website uses ${supplierSelection.selectedId}. ${supplierSelection.reason}` : banner ? "Banner price verified; no catalogue listing" : "No exact listing match; variant or inventory review required"];
});
fs.writeFileSync("docs/price-audit-2026-10-27/master-sheet-audit.csv",csv([["Sheet row","Master ID","Brand","Model","Price to quote NGN","Matched website listings","Website names","Previous actual prices NGN","Current actual prices NGN","Result"],...masterRows]));
fs.writeFileSync("docs/price-audit-2026-10-27/website-price-audit.csv",csv([["Website ID","Product","Category","Master ID","Previous selling price NGN","Current selling price NGN","Master selling price NGN","Result"],...classified.map(item=>[item.p.id,item.p.name,item.p.category,item.sourceId,item.beforePrice,item.actual,item.expected,item.expected === undefined ? "Outside exact sheet matches; unchanged and unverified" : item.expected === null ? "Quote required" : item.changed ? "Corrected" : "Verified; already matched"])]));
const summary = { sourceRows: specs.length, sourcePriced: Object.values(master.prices).filter(p=>p!==null).length, sourceWithoutPrice: Object.values(master.prices).filter(p=>p===null).length, sourceRowsWithCatalogMatch: new Set(classified.filter(item=>item.sourceId&&item.expected!==undefined).map(item=>item.sourceId)).size, websiteListings:catalog.length, matchedWebsiteListings:classified.filter(item=>item.expected!==undefined&&item.sourceId).length, correctedSellingPrices:classified.filter(item=>item.changed&&item.actual!==null).length, matchedAlreadyCorrect:classified.filter(item=>item.expected!==undefined&&item.expected!==null&&!item.changed).length, quoteOnlyListings:classified.filter(item=>item.expected===null).length, unverifiedWebsiteListings:classified.filter(item=>item.expected===undefined).length, dbRows:db.length, dbMatched:db.filter(p=>masterPriceFor(p)!==undefined).length, errors };
fs.writeFileSync("docs/price-audit-2026-10-27/verification.json",JSON.stringify(summary,null,2)+"\n");
console.log(JSON.stringify(summary,null,2));
if(errors.length) process.exitCode=1;
