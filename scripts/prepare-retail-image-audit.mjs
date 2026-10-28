// Read-only source matching. Never infer one model's photo from another model's name.
import fs from 'node:fs';
import path from 'node:path';
const root = 'supabase/.temp';
const products = JSON.parse(fs.readFileSync(`${root}/image-audit-products-before.json`));
const supplier = [1, 2, 3, 4].flatMap(i => JSON.parse(fs.readFileSync(`${root}/minisim-official-products-${i}.json`)));
const ecoflow = ['', '-2'].flatMap(s => JSON.parse(fs.readFileSync(`${root}/ecoflow-official-products${s}.json`)).products);
const provenance = JSON.parse(fs.readFileSync(`${root}/image-script-provenance.json`));
const norm = x => x.toLowerCase().replace(/&amp;|&#038;/g, 'and').replace(/&#8211;/g, '-').replace(/wi[ -]?fi/g, 'wifi').replace(/[^a-z0-9]/g, '');
const plan = new Map();
function add(product, source, sourcePage, sourceName, reason) {
  if (!product || !source) return;
  plan.set(product.image_url, { original: product.image_url, productName: product.name, source, sourcePage, sourceName, reason });
}
for (const p of products.filter(p => p.image_url.includes('/items/'))) {
  const matches = supplier.filter(s => norm(s.name) === norm(p.name));
  if (matches.length === 1) add(p, matches[0].images[0]?.src, matches[0].permalink, matches[0].name, 'Exact supplier product name');
}
// Individually reviewed name variations. Gang count, protocol, model and generation must agree.
const manual = {
  5:2126, 6:2391, 7:235, 8:240, 11:2133, 14:2459, 15:2456, 26:2354,
  27:2560, 28:2562, 52:2358, 58:2360, 62:2364, 63:2365, 64:2366, 65:2367,
  66:1894, 67:1896, 68:1898, 69:1900,
  83:2655, 84:2654, 85:2650, 86:2642, 89:2652, 90:2640, 91:2638,
  153:2368, 156:1450, 162:1656, 168:2228, 173:2235, 179:2026,
  229:2803, 249:2579, 263:2588, 264:2912, 266:2599,
  274:2608, 275:2035, 276:2046, 277:2613, 288:2697, 298:1810,
  308:2325, 338:2344, 344:2810, 350:2520, 365:1435, 402:2504,
  425:2716, 461:2485, 463:2746, 500:1711, 501:1734, 506:2669, 507:2645, 511:965,
};
for (const [number, id] of Object.entries(manual)) {
  const p = products.find(p => p.image_url === `/products/items/product-${number.padStart(4, '0')}.webp`);
  const s = supplier.find(s => s.id === id);
  add(p, s?.images[0]?.src, s?.permalink, s?.name, 'Reviewed supplier model / protocol / specification match');
}
// Restore original supplier photographs, with no generated labels, recolouring or pixel salts.
for (const s of provenance.filter(s => s.script === 'process_itel_products.mjs')) {
  if (s.sku === 'TG-ITEL-0025') continue; // Old 620W listing used an explicitly named 550W image.
  const p = products.find(p => p.sku === s.sku);
  add(p, s.imgUrl, 'https://itelsolar.ng/', s.name, 'Model-specific supplier original recorded in catalogue import');
}
const ecoModels = {
  'ecoflow-100w-rigid-panel.webp':'100w-rigid-solar-panel',
  'ecoflow-100w-flexible-panel.webp':'100w-flexible-solar-panel',
  'ecoflow-110w-portable-panel.webp':'110w-portable-solar-panel-recommended-accessory',
  'ecoflow-160w-portable-panel.webp':'160w-portable-solar-panel-recommended-accessory',
  'ecoflow-220w-bifacial-portable-panel.webp':'220w-bifacial-portable-solar-panel-recommended-accessory',
  'ecoflow-400w-portable-panel.webp':'400w-portable-solar-panel-recommended-accessory',
  'ecoflow-400w-rigid-panel.webp':'400w-rigid-solar-panel',
  'ecoflow-delta-2-max.webp':'delta-2-max-portable-power-station',
  'ecoflow-delta-pro.webp':'delta-pro-portable-power-station',
  'ecoflow-river-2-256wh.webp':'river-2-portable-power-station',
  'ecoflow-river-288wh.webp':'river-portable-power-station',
};
for (const [file, handle] of Object.entries(ecoModels)) {
  const p = products.find(p => path.basename(p.image_url) === file);
  const e = ecoflow.find(e => e.handle === handle);
  add(p, e?.images[0]?.src, `https://eu.ecoflow.com/products/${handle}`, e?.title, 'Exact manufacturer product catalogue');
}
const river = ecoflow.find(e => e.handle === 'river-3-plus-portable-power-station');
const riverMax = river?.variants.find(v => v.title === 'RIVER 3 Max Plus (RIVER 3 Plus + Extra Battery 600) / /');
add(products.find(p => p.image_url.endsWith('/ecoflow-river-3-max-plus.webp')), riverMax?.featured_image?.src, `https://eu.ecoflow.com/products/${river?.handle}`, riverMax?.title, 'Exact manufacturer RIVER 3 Max Plus variant, including extra battery');
const bundle = ecoflow.find(e => /delta-2-max.*220w/.test(e.handle) && !/refurb/.test(e.handle));
if (bundle) add(products.find(p => p.image_url.endsWith('/ecoflow-delta-2-max-solar-gen-220w.webp')), bundle.images[0]?.src, `https://eu.ecoflow.com/products/${bundle.handle}`, bundle.title, 'Exact manufacturer generator + PV220W bundle');
fs.writeFileSync(`${root}/retail-image-source-plan.json`, JSON.stringify([...plan.values()], null, 2));
console.log(`Prepared ${plan.size} source matches; no assets or prices changed.`);
