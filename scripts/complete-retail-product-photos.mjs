// Follow-up to the strict audit: the owner now permits fitting representative photos.
// Keeps exact originals first, records every substitution and never fabricates uniqueness.
import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import sharp from 'sharp';
import { JSDOM } from 'jsdom';

const read = async p => JSON.parse(await fs.readFile(p, 'utf8'));
const dir = 'docs/image-audit-2026-10-28';
const products = await read('supabase/.temp/image-audit-products-before.json');
const overrides = await read('src/data/retailImageOverrides.json');
const previous = await read(`${dir}/image-decisions.json`);
const workbook = await read('supabase/.temp/minisim-workbook-media.json');
const minisim = (await Promise.all([1, 2, 3, 4].map(n => read(`supabase/.temp/minisim-official-products-${n}.json`)))).flat();
const blue = await read('supabase/.temp/bluecarbon-joined.json');
const hinen = (await read('supabase/.temp/hinen-products.json')).products;
const sources = await read('supabase/.temp/followup-sources.json');
const finalSources = await read('supabase/.temp/followup-final-sources.json');
const poleSource = await read('supabase/.temp/pole-source.json');
const decisions = {};
const norm = s => s.toLowerCase().replace(/[^a-z0-9]/g, '');
await fs.mkdir('public/products/originals', { recursive: true });
await fs.mkdir('supabase/.temp/followup-image-cache', { recursive: true });

async function photo(source, sourcePage, sourceName) {
  const key = crypto.createHash('sha256').update(source).digest('hex').slice(0, 16);
  const image = `/products/originals/${key}.webp`;
  const cache = `supabase/.temp/followup-image-cache/${key}`;
  let bytes;
  try { bytes = await fs.readFile(cache); } catch {
    if (source.startsWith('workbook:')) bytes = await fs.readFile(`supabase/.temp/smart-home-embedded/${source.slice(9)}`);
    else {
      const response = await fetch(source, { signal: AbortSignal.timeout(35000) });
      if (!response.ok) throw new Error(`${response.status}: ${source}`);
      bytes = Buffer.from(await response.arrayBuffer());
    }
    await fs.writeFile(cache, bytes);
  }
  const { width, height } = await sharp(bytes).metadata();
  await sharp(bytes).rotate().resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true }).webp({ quality: 92 }).toFile(`public${image}`);
  return { image, source, sourcePage, sourceName, width, height };
}
async function supplier(id) {
  const s = minisim.find(x => x.id === id);
  if (!s?.images[0]?.src) throw new Error(`No supplier photo: ${id}`);
  return photo(s.images[0].src, s.permalink, s.name);
}
async function carbon(test) {
  const s = blue.find(test);
  if (!s?.images[0]) throw new Error('No Blue Carbon candidate');
  return photo(typeof s.images[0] === 'string' ? s.images[0] : s.images[0].src, s.url, s.name);
}
const supplierCache = new Map();
async function useSupplier(id) {
  if (!supplierCache.has(id)) supplierCache.set(id, supplier(id));
  return supplierCache.get(id);
}
const local = image => ({ image: overrides[image] && !overrides[image].includes('pending') ? overrides[image] : image, source: 'existing-catalogue', sourceName: 'Existing catalogue product photograph' });
const curated = {
  12:98, 19:217, 30:211, 36:202, 39:223, 40:235, 43:2781,
  53:1894, 59:2361, 61:2363, 72:2235, 73:2235, 75:2659, 78:2235,
  96:1467, 106:1926, 225:2135, 227:104, 233:1389, 248:685,
  260:2165, 262:2619, 270:2613, 383:2553, 439:1569,
  489:2450, 510:2657, 513:2537, 515:2537, 537:1764, 540:1761, 541:1761,
};
const exactSupplier = new Set([53,59,61,227,248,260,262,439,510]);
const manualWorkbook = { 381:'MS-0382', 471:'MS-0472', 96:'MS-0097' };
let followup = {};
try { followup = await read(`${dir}/photo-followup-decisions.json`); } catch { /* First run */ }
const missing = products.filter(p => overrides[p.image_url]?.includes('pending') || followup[p.image_url]);
for (const p of missing) {
  let result, kind = 'representative', reason = 'Owner-authorized representative photograph of the same product type';
  const n = Number(p.image_url.match(/product-(\d+)/)?.[1]);
  const old = previous[p.image_url];
  if (old?.filename && old.source) {
    result = await photo(old.source, old.sourcePage, old.sourceName);
    kind = 'supplier-original'; reason = 'Restored the supplier original at its native resolution';
  } else if (curated[n]) {
    result = await useSupplier(curated[n]);
    if (exactSupplier.has(n)) { kind = 'supplier-original'; reason = 'Supplier model/type match'; }
  } else if (p.image_url.includes('/items/')) {
    const matches = workbook.filter(x => norm(x.name) === norm(p.name));
    const match = manualWorkbook[n] ? workbook.find(x => x.id === manualWorkbook[n]) : matches.length === 1 ? matches[0] : null;
    if (match) {
      result = await photo(`workbook:${match.file}`, 'https://docs.google.com/spreadsheets/d/1F5-nFiSAhGDLLCmM0vttO6n4vC9C9UAOcAS1YdTy_cs/edit', match.name);
      kind = manualWorkbook[n] ? 'representative' : 'supplier-original'; reason = 'Original supplier price-list product photograph; native resolution retained';
    } else if (matches[0]) {
      result = await photo(`workbook:${matches[0].file}`, 'https://docs.google.com/spreadsheets/d/1F5-nFiSAhGDLLCmM0vttO6n4vC9C9UAOcAS1YdTy_cs/edit', matches[0].name);
      reason = 'Supplier product-family photograph; listing has no distinguishing model code';
    } else if (n === 381) result = await photo('https://www.westerndigital.com/content/dam/store/en-us/assets/products/internal-storage/wd-purple-sata-hdd/gallery/wd-purple-surveillance-hard-drive-1tb.png', 'https://www.westerndigital.com/en-ap/products/internal-drives/wd-purple-sata-hdd?sku=WD11PURZ', 'WD Purple 1TB surveillance hard disk');
    else if ([47,81].includes(n)) result = await useSupplier(202);
    else if (n === 361) result = await useSupplier(1389);
    else throw new Error(`Unassigned smart-home product: ${p.name}`);
  } else if (p.image_url.includes('/hinen/')) {
    const watts = p.name.match(/(3000|600|300)W/i)[1];
    const s = hinen.find(x => x.handle === `${watts}w-portable-power-station`);
    result = await photo(s.images[0].src, `https://www.hinen.com/products/${s.handle}`, s.title);
    kind = 'manufacturer-original'; reason = 'Exact manufacturer power-station model';
  } else if (p.image_url.includes('/meco/')) {
    const pro = /pro/i.test(p.name), two = /2kwh/i.test(p.name) && !/1\.2/i.test(p.name);
    const selected = sources.meco1.images.find(x => two ? /Meco-2kWh-Solar-Generator/.test(x.alt) : pro ? /Meco-1kWh-Pro/.test(x.alt) : x.alt === '1kWh-Solar-Generator');
    result = await photo(new URL(selected.src, sources.meco1.url).href, sources.meco1.url, selected.alt);
    if (!/panel|1\.2/i.test(p.name)) { kind = 'manufacturer-original'; reason = 'Manufacturer image of the corresponding MECO generator'; }
    else reason = 'MECO generator family image; bundle panel and exact variant may differ';
  } else if (p.category === 'Solar Panels') {
    result = await carbon(x => x.url.includes('450w-monocrystalline-solar-panel-high-efficiency'));
    reason = 'Representative monocrystalline panel; product wattage and brand follow the listing specifications';
  } else if (p.image_url.includes('/blue-carbon/')) {
    if (p.category === 'Batteries') {
      const v24 = /24V/i.test(p.name);
      result = await carbon(x => v24 ? x.url.includes('5kwh-24v200ah-energy-storage-packflat-type') : /table|non-smart/i.test(p.name) ? x.url.includes('15kwh-48v300ah-energy-storage-pack-flat-type') : x.url.includes('blue-carbon-48v-1536kwh-300ah-lithium-battery-pack-for-solar-home-systemsmart-bms-bub6f'));
      reason = 'Blue Carbon battery family photograph; enclosure and capacity may vary';
    } else if (p.category === 'Inverters') {
      result = await carbon(x => x.url.includes(/12k|11k/i.test(p.name) ? 'blue-carbon-latest-2026-12kw-smart-inverter-suitable-for-home-and-industrial-use' : 'blue-carbon-48vdc-6kw-hot-selling'));
      reason = 'Blue Carbon inverter family photograph; exact rating/variant follows listing';
    } else result = local('/products/dawnice/daw-ess-265kwh-aio.webp');
  } else if (/fan/i.test(p.name)) {
    const url = 'https://alabamart.com/products/infini-18-inch-lithium-rechargeable-stand-fan-with-20w-panel.json';
    const s = (await (await fetch(url)).json()).product;
    result = await photo(s.images[0].src, url.replace('.json',''), s.title);
    if (/kit/i.test(p.name)) { kind = 'supplier-original'; reason = 'Supplier Infini 18-inch fan with panel photograph'; }
  } else if (/charge controller/i.test(p.name)) {
    result = await photo('https://img.ctmon.com.cn/oss/sren/userfiles/images/2023/07/03/2023070315591370.png', sources.srne60.url, 'SRNE MF MPPT controller family');
  } else if (/dawnice.*inverter/i.test(p.name)) result = await photo(finalSources.dawnice.og, finalSources.dawnice.url, 'Dawnice hybrid inverter family');
  else if (/solar flood light/i.test(p.name)) result = local('/products/solarpro/solarpro-light-sp-fl-300w.webp');
  else if (/expansion pole/i.test(p.name)) result = await photo(poleSource.og, poleSource.url, 'Galvanized steel street-light pole');
  else if (/street light/i.test(p.name)) result = local('/products/felicity/fel-light-fl-d2-60w.webp');
  else if (/battery storage/i.test(p.name)) result = local('/products/felicity/fel-bat-fl-lpbf48200.webp');
  else if (/rack battery/i.test(p.name)) result = local('/products/suness/suness-ess-hvs-60kwh.webp');
  else if (/outdoor cabinet/i.test(p.name)) result = local('/products/dawnice/daw-ess-265kwh-aio.webp');
  else if (/all.in.one/i.test(p.name)) result = local('/products/itel/itel-aio-3.6kw-8kwh.webp');
  else if (/inverter/i.test(p.name)) result = local('/products/core/deye-5kw-hybrid.webp');
  else if (/vitabank/i.test(p.name)) result = local('/products/itel/itel-aio-500w-1kwh.webp');
  else if (/ecoflow/i.test(p.name)) result = local('/products/ecoflow/ecoflow-e980-power-station.webp');
  else throw new Error(`Unassigned product: ${p.name}`);
  decisions[p.image_url] = { original: p.image_url, productName: p.name, category: p.category, ...result, kind, reason };
  overrides[p.image_url] = result.image;
}
await fs.writeFile(`${dir}/photo-followup-decisions.json`, JSON.stringify(decisions, null, 2) + '\n');
await fs.writeFile('src/data/retailImageOverrides.json', JSON.stringify(overrides, null, 2) + '\n');
await fs.writeFile('src/data/retailRepresentativeImages.json', JSON.stringify(Object.fromEntries(Object.values(decisions).filter(d => d.kind === 'representative').map(d => [d.original, d.image])), null, 2) + '\n');
// Keep runtime fallbacks aligned with the reviewed, self-hosted photographs.
const item = n => `/products/items/product-${String(n).padStart(4, '0')}.webp`;
const fallbackSources = {
  panel: '/products/core/sungene-panel-330w-mono.webp', battery: '/products/felicity/fel-bat-fl-lpbf48200.webp',
  inverter: '/products/core/deye-5kw-hybrid.webp', powerStation: '/products/hinen/hinen-600w-power-station.webp',
  chargeController: '/products/infinisolar/infini-scc-mppt-60a.webp', fan: '/products/infinisolar/infini-app-fan-18-solar-kit.webp',
  commercialEss: '/products/dawnice/daw-ess-265kwh-aio.webp', allInOne: '/products/itel/itel-aio-3.6kw-8kwh.webp',
  solarFlood: '/products/solarpro/solarpro-light-sp-fl-300w.webp', streetLight: '/products/felicity/fel-light-fl-d2-60w.webp',
  pole: '/products/bread-energy/bread-acc-pole.webp', lockFace: '/products/core/stama-k209-face-lock.webp', lockHandle: '/products/core/stama-f27-wifi.webp',
  switch1: item(36), switch2: item(30), switch3: item(19), switch4: item(39), dimmer: item(40), scene: item(75), heater: item(57),
  socket: item(12), doubleSocket: item(134), plug: item(225), doorSensor: item(227), motionSensor: item(233), gasSensor: item(248), presenceSensor: item(235),
  controlPanel: '/products/core/tioga-granite-display.webp', gateway: item(135), curtainTrack: item(435), curtainMotor: item(421), curtainRobot: item(439),
  camera: item(358), solarCamera: item(383), webcam: item(405), doorbell: item(263), chime: item(270), hardDisk: item(381), ups: item(401),
  ceilingSpeaker: item(467), speaker: item(489), subwoofer: item(492), amplifier: item(464), trackLight: item(537), trackConnector: item(543), transformer: item(555), ledStrip: item(563),
};
await fs.writeFile('src/data/retailPhotoFallbacks.json', JSON.stringify(Object.fromEntries(Object.entries(fallbackSources).map(([key, original]) => [key, overrides[original] || original])), null, 2) + '\n');
console.log(JSON.stringify(Object.values(decisions).reduce((a,x)=>(a[x.kind]=(a[x.kind]||0)+1,a),{})));
