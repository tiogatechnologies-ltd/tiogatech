import fs from 'node:fs/promises';
import { JSDOM, VirtualConsole } from 'jsdom';
const base = 'supabase/.temp';
const plan = JSON.parse(await fs.readFile(`${base}/retail-image-source-plan.json`, 'utf8'));
const srne = plan.filter(x => x.sourcePage.startsWith('https://www.srnesolar.com/'));
let cursor = 0;
async function worker() {
  while (cursor < srne.length) {
    const item = srne[cursor++];
    try {
      const response = await fetch(item.sourcePage, { signal: AbortSignal.timeout(25000) });
      if (!response.ok) throw Error(`HTTP ${response.status}`);
      const doc = new JSDOM(await response.text(), { virtualConsole: new VirtualConsole() }).window.document;
      const image = doc.querySelector('.prinfo1_img img');
      const source = image?.getAttribute('data-lazy-src') || image?.getAttribute('src');
      if (source?.startsWith('https://')) { item.source = source; item.reason += '; full product image from detail page, not navigation thumbnail'; }
    } catch (error) { console.log(item.productName, error.message); }
  }
}
await Promise.all(Array.from({ length: 4 }, worker));
const tenon = [
  ['product-0350.webp', 'https://tenonsmart.com/product/k5-automatic-smart-lock-for-glass-door/'],
  ['product-0351.webp', 'https://tenonsmart.com/product/k10-pro-face-fingerprint-door-lock-for-home/'],
];
for (const [file, sourcePage] of tenon) {
  const item = plan.find(x => x.original.endsWith('/' + file));
  const response = await fetch(sourcePage, { signal: AbortSignal.timeout(25000) });
  if (!response.ok) continue;
  const doc = new JSDOM(await response.text(), { virtualConsole: new VirtualConsole() }).window.document;
  const image = doc.querySelector('.woocommerce-product-gallery__image img');
  const source = image?.getAttribute('data-large_image') || image?.getAttribute('src');
  if (item && source?.startsWith('https://')) Object.assign(item, { source, sourcePage, sourceName: doc.querySelector('h1')?.textContent.trim(), reason: 'Exact TENON manufacturer model and construction; full original product photograph' });
}
const catalog = JSON.parse(await fs.readFile(`${base}/image-audit-products-before.json`, 'utf8'));
const arylic = JSON.parse(await fs.readFile(`${base}/arylic-products.json`, 'utf8')).products;
const audio = {
  452:'arylic-a50-wifi-bluetooth-multiroom-full-digital-hifi-amplifier-with-airplay-dlna-multiroom-control',
  453:'a30-wireless-amplifier',454:'h50-airplay2-amplifier',456:'b50-bluetooth-stereo-amplifier',
  457:'s10-wireless-preamplifier',458:'lp10-music-streamer',459:'a100-power-amplifier',
  461:'la50-streaming-amplifier',462:'lp20-music-streamer',463:'ha400-4-zone-amplifier',
};
for (const [number, handle] of Object.entries(audio)) {
  const original = `/products/items/product-${number.padStart(4,'0')}.webp`;
  const product = catalog.find(x => x.image_url === original);
  const source = arylic.find(x => x.handle === handle);
  if (!product || !source?.images[0]?.src) continue;
  const replacement = { original, productName: product.name, source: source.images[0].src, sourcePage: `https://www.arylic.com/products/${handle}`, sourceName: source.title, reason: 'Exact manufacturer amplifier / streamer model; original product catalogue photograph' };
  const index = plan.findIndex(x => x.original === original);
  if (index < 0) plan.push(replacement); else plan[index] = replacement;
}
const nigeria = JSON.parse(await fs.readFile(`${base}/ecoflow-ng-products.json`, 'utf8')).products;
function nigeriaPhoto(original, handle, variantTitle) {
  const product = nigeria.find(x => x.handle === handle);
  const variant = variantTitle ? product?.variants.find(x => x.title === variantTitle) : null;
  const source = variantTitle ? variant?.featured_image?.src : product?.images[0]?.src;
  if (!source) return;
  const existing = plan.findIndex(x => x.original === original);
  const replacement = { original, productName: catalog.find(x => x.image_url === original)?.name || `Promotion: ${variantTitle || product.title}`, source, sourcePage: `https://ng.ecoflow.com/products/${handle}`, sourceName: variantTitle || product.title, reason: 'Exact EcoFlow Nigeria product/variant photograph, including regional socket configuration' };
  if (existing < 0) plan.push(replacement); else plan[existing] = replacement;
}
for (const [file, handle] of Object.entries({
  '/products/ecoflow/ecoflow-e980-power-station.webp':'ecoflow-e980-portable-power-station',
  '/products/ecoflow/ecoflow-delta-2-max.webp':'delta-2-max-portable-power-station',
  '/products/ecoflow/ecoflow-delta-pro.webp':'delta-pro-portable-power-station',
  '/products/exulted/ecoflow-river-2-256wh.webp':'river-2-portable-power-station',
  '/products/exulted/ecoflow-river-288wh.webp':'river-portable-power-station',
  '/products/ecoflow/ecoflow-e980.png':'ecoflow-e980-portable-power-station',
})) nigeriaPhoto(file, handle);
nigeriaPhoto('/products/ecoflow/ecoflow-river-3-max-plus.webp', 'river-3-plus-portable-power-station', 'RIVER 3 Max Plus / No Accessory');
nigeriaPhoto('/products/ecoflow/ecoflow-river-3-max-plus.png', 'river-3-plus-portable-power-station', 'RIVER 3 Max Plus / No Accessory');
nigeriaPhoto('/products/ecoflow/ecoflow-river-3-max.png', 'river-3-plus-portable-power-station', 'RIVER 3 Max / No Accessory');
nigeriaPhoto('/products/ecoflow/ecoflow-delta-3-air-2000.png', 'delta-3-air-series-portable-power-station', 'DELTA 3 2000 Air');
nigeriaPhoto('/products/ecoflow/ecoflow-delta-3-max.png', 'ecoflow-delta-3-max-portable-power-station', 'DELTA 3 Max');
await fs.writeFile(`${base}/retail-image-source-plan.json`, JSON.stringify(plan, null, 2));
console.log('Refined manufacturer source photographs.');
