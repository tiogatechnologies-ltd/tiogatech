// Additional manufacturer matches, reviewed against their published model names.
import fs from 'node:fs';
import { JSDOM, VirtualConsole } from 'jsdom';
const base = 'supabase/.temp';
const products = JSON.parse(fs.readFileSync(`${base}/image-audit-products-before.json`));
const plan = new Map(JSON.parse(fs.readFileSync(`${base}/retail-image-source-plan.json`)).map(x => [x.original, x]));
function add(p, source, sourcePage, sourceName, reason) {
  if (p && source) plan.set(p.image_url, { original: p.image_url, productName: p.name, source, sourcePage, sourceName, reason });
}
const itel = JSON.parse(fs.readFileSync(`${base}/itel-official-model-media.json`));
const itelChoices = {
  'itel-inv-3kw-24v.webp':['Ip54', 'IPV-3K24UPRO'],
  'itel-inv-4kw-24v.webp':['Ip54', 'IPV-4K24UPRO&IPV-6K48UPRO'],
  'itel-inv-6kw-48v.webp':['Ip54', 'IPV-4K24UPRO&IPV-6K48UPRO'],
  'itel-inv-6.6kw-48v-transformer.webp':['Ihy6k6l1c', 'IHY-6K6L1C'],
  'itel-inv-8kw-48v-1p.webp':['Ipv8k48t', 'IPV-8K48T'],
  'itel-inv-12kw-48v-1p.webp':['Ip54', 'IPV-8K48U&IPV-12K48U'],
  'itel-inv-8kw-48v-3p.webp':['Ip66', 'IHY-8KL3&IHY-12KL3'],
  'itel-inv-12kw-48v-3p.webp':['Ip66', 'IHY-8KL3&IHY-12KL3'],
  'itel-aio-500w-1kwh.webp':['Iess05k10n', 'Power Tank(IESS-05K10N)'],
  'itel-gen-300wh-dc-powergo.webp':['Iess320t', 'Power Go(IESS-320T)'],
  'itel-gen-300wh-ac-powergo-pro.webp':['Iess320act', 'Power Go Pro (IESS-320ACT)'],
};
for (const [file, [slug, label]] of Object.entries(itelChoices)) {
  const model = itel.find(x => x.slug === slug)?.models.find(m => m.label === label);
  add(products.find(p => p.image_url.endsWith('/' + file)), model?.images[0]?.url, `https://energy.itel-life.com/traness-web/#/${slug}`, label, 'Manufacturer product page names the exact model; original marketing photograph');
}
// Only exact manufacturer names in the filename are accepted, never a neighbouring capacity.
const deye = JSON.parse(fs.readFileSync(`${base}/deye-source-review.json`));
for (const d of deye) {
  const source = d.urls.find(url => /https:\/\/(?:www\.|au\.)?(?:deye\.com|deyeinverter\.com)\//.test(url));
  if (!source) continue;
  const p = products.find(p => p.image_url.endsWith('/' + d.filename));
  add(p, source, source, d.name, 'Manufacturer original for the published model/family; no added model badge');
}
// The final SVG/badge generators are not used. These are the original manufacturer images.
const doc = new JSDOM(fs.readFileSync(`${base}/source-srne.txt`, 'utf8'), { virtualConsole: new VirtualConsole() }).window.document;
const srneChoices = {
  'srne-inv-afp-5kw.webp':'Off-Grid-Inverter-AFP-5kW-EU',
  'srne-inv-aep-6kw.webp':'Off-Grid-Inverter-AEP-6kW',
  'srne-inv-iesp-60kw.webp':'C-I-Storage-Inverter-IESP-50-60kW-EU',
  'srne-inv-hesp-6kw.webp':'Hybrid-Inverter-HESP-3-6kW-EU',
  'srne-inv-hesp-12kw.webp':'Hybrid-Inverter-Single-Phase-Low-HESP-8-12kW-EU',
  'srne-inv-hesp-12kw-3p.webp':'Hybrid-Inverter-Three-Phase-Low-HESP-8-12kW-EU',
  'srne-inv-hesp-20kw.webp':'Hybrid-Inverter-HESP-16-20kW-EU',
  'srne-inv-asp-10kw.webp':'Off-Grid-Inverter-ASP-8-12kW-EU',
  'srne-inv-asp-12kw.webp':'Off-Grid-Inverter-ASP-8-12kW-EU',
  'srne-inv-asp-12kw-3p.webp':'Off-Grid-Inverter-Three-Phase-Low-ASP-8-12kW-EU',
  'srne-inv-asp-16kw.webp':'Off-Grid-Inverter-ASP-14-16kW-EU',
  'srne-inv-asp-20kw.png':'Off-Grid-Inverter-ASP-16-20kW-EU',
  'srne-acc-ats380s63.webp':'ATS-Smart-Switch-Box',
};
for (const [file, slug] of Object.entries(srneChoices)) {
  const anchor = doc.querySelector(`a[href="/productdetail/${slug}.html"]`);
  const image = anchor?.querySelector('img');
  add(products.find(p => p.image_url.endsWith('/' + file)), image?.getAttribute('data-lazy-src'), `https://www.srnesolar.com/productdetail/${slug}.html`, anchor?.textContent.trim(), 'Manufacturer product/family photograph; common enclosures are not digitally differentiated');
}
// Blue Carbon Nigeria's own product listings. Do not substitute neighbouring wattages or variants.
const blueCarbon = JSON.parse(fs.readFileSync(`${base}/bluecarbon-joined.json`));
const blueChoices = {
  'pnl-036-bc-450w-mono.webp':34,
  'pnl-040-bc-550w-mono.webp':33,
  'pnl-042-bc-600w-mono.webp':38,
  'pnl-045-bc-650w-mono.webp':42,
  'inv-021-bc-4kva-hybrid.webp':25,
  'bat-011-bc-5kwh-24v-stackable.webp':8,
  'bat-020-bc-7.5kwh-24v-stackable.webp':10,
  'bat-051-bc-10kwh-48v-smart.webp':4,
  'bat-065-bc-12.5kwh-48v-smart.webp':2,
  'bat-076-bc-15kwh-48v-smart-stackable.webp':18,
};
for (const [file, index] of Object.entries(blueChoices)) {
  const source = blueCarbon[index];
  add(products.find(p => p.image_url.endsWith('/' + file)), source?.images[0]?.src, source?.url, source?.name, 'Blue Carbon supplier listing matches capacity, voltage and construction; nominal kWh follows sheet, Ah verified');
}
fs.writeFileSync(`${base}/retail-image-source-plan.json`, JSON.stringify([...plan.values()], null, 2));
console.log(`Source plan now contains ${plan.size} products.`);
