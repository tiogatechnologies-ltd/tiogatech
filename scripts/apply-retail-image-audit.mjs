import fs from 'node:fs/promises';
import path from 'node:path';
const base = 'supabase/.temp';
const products = JSON.parse(await fs.readFile(`${base}/image-audit-products-before.json`, 'utf8'));
const originals = JSON.parse(await fs.readFile(`${base}/retail-image-originals.json`, 'utf8'));
const manifest = {};
const pending = '/products/photo-pending.svg';
function withhold(p, reason) {
  if (p) manifest[p.image_url] = { original: p.image_url, productName: p.name, image: pending, status: 'withheld', reason };
}
// Confirmed mismatches from the complete visual contact-sheet review and generation scripts.
const badItemPhotos = {
  12:'Universal 3-pin socket listing pictured a European Schuko plug adapter',
  19:'Three-gang wall switch pictured an in-wall relay module',
  30:'Wall switch pictured an in-wall relay module',
  36:'Wall switch pictured a rear wiring diagram instead of the product',
  39:'Four-gang switch pictured a six-key scene switch',
  40:'Dimmer wall switch pictured an in-wall relay module',
  43:'Concave wall switch pictured an in-wall module',
  47:'Smart home device pictured wristwatches',
  53:'One-gang Astro switch pictured a three-gang relay module',
  57:'Astro wall switch pictured a circuit breaker / gateway collage',
  59:'Two-gang Nova wall switch pictured a relay module',
  61:'Four-gang Nova switch pictured a home control screen',
  70:'Wall AC switch pictured an in-wall relay module',
  72:'Scene wall switch pictured a relay module',
  73:'Scene wall switch pictured a relay module',
  75:'Scene wall switch pictured curtain motors',
  78:'Scene wall switch pictured a door lock',
  81:'Smart device pictured an unrelated switch without identifiable model',
  95:'Slip dimmer pictured an in-wall relay module',
  96:'WiFi switch pictured a Zigbee-labelled product',
  106:'Wall switch pictured a rear wiring diagram instead of the product',
  124:'Sixteen-gang network module pictured a single relay module',
  130:'Non-smart switch pictured a WiFi/Zigbee smart switch',
  131:'Non-smart air-conditioner switch pictured a water-heater smart switch',
  133:'Luxury wall socket pictured an adapter plug',
  134:'Non-smart double wall socket pictured a smart plug adapter',
  174:'T3E smart wall switch pictured a set of relay modules',
  180:'Control-panel desk stand pictured an entire hinged control panel',
  200:'Double glass blank cover pictured insulated window glazing',
  215:'Wireless charger model not established; reused another charger photo with a badge',
  225:'13A USB smart plug pictured a wall socket',
  227:'Door sensor pictured a motion detector',
  233:'Motion sensor pictured an unrelated combined outdoor detector',
  235:'WiFi presence sensor pictured an explicitly Zigbee-labelled sensor',
  248:'Gas detector pictured another detector type without verified identity',
  260:'Sensor downlight pictured decorative LED strip lighting',
  262:'Outdoor motion sensor pictured a roller-shade motor',
  270:'Doorbell chime pictured a car keypad',
  291:'Alarm sensor pictured a different motion-detector family',
  315:'Q6 door lock pictured a generic round knob lock',
  330:'V92C lock pictured a different handle lock',
  358:'Indoor mini PTZ camera pictured a bank of outdoor CCTV cameras',
  361:'Smart device pictured a sensor kit without an identifiable product model',
  371:'Four-channel camera system pictured a single solar camera',
  381:'One-terabyte hard disk pictured a solid-state drive',
  383:'PTZ camera pictured an installed bullet-camera pole',
  401:'Router UPS pictured a car emergency jump-starting power bank',
  403:'Camera power supply pictured a solar PTZ camera',
  405:'Mini USB webcam pictured a larger indoor WiFi camera',
  406:'Mini USB webcam pictured a larger indoor WiFi camera',
  421:'WiFi blind motor pictured a Bluetooth product',
  422:'Zigbee blind motor pictured a different protocol product without model proof',
  425:'Five-channel remote pictured an eight-channel relay module',
  430:'Screw and expansion-plug set pictured curtain rail carriers',
  435:'Curtain track pictured a welding inverter',
  436:'Curtain track pictured a desk lamp',
  439:'Curtain robot pictured curtains without the product',
  452:'Arylic A50 amplifier pictured a touchscreen wall control panel',
  453:'Arylic A30 amplifier pictured a touchscreen wall control panel',
  454:'H50 amplifier pictured a touchscreen wall control panel',
  462:'LP20 pre-amplifier pictured a different brand of in-car amplifier',
  467:'Passive ceiling speaker pictured a portable Bluetooth speaker',
  471:'Passive ceiling speaker pictured a smart home voice speaker',
  488:'HiVi lawn speaker pictured a bare subwoofer driver',
  489:'Outdoor wall speaker pictured a column speaker',
  492:'Ten-inch subwoofer pictured a car speaker set',
  510:'Google Nest Hub Max pictured a smaller Nest Hub',
  513:'Echo Dot 5 hanger pictured an Echo Spot',
  515:'Echo Dot 5 hanger pictured a Google Nest Mini holder',
  516:'Echo Dot holder pictured an Echo Pop holder',
  528:'Fibre-optic lighting kit pictured a small downlight',
  537:'Magnetic-track flood light pictured a desk lamp',
  540:'Magnetic-track zoom light pictured a desk magnifier',
  541:'Magnetic-track zoom light pictured ambient strip lighting',
  543:'Track I connector pictured a pan/tilt camera mount',
  544:'Track L connector pictured a pan/tilt camera mount',
  545:'Track corner connector pictured outdoor furniture',
  546:'Track power head pictured a robot and an Echo speaker',
  547:'Track recessed part pictured a garage door',
  551:'Smart switch pictured a desk lamp',
  555:'100W transformer pictured a different-rated laptop-style adapter',
  556:'150W transformer pictured a loose lighting cable',
  557:'350W transformer pictured coiled wiring',
  559:'Running-light strip pictured unrelated neon-rope lighting',
  560:'Running-light strip pictured unrelated neon-rope lighting',
  563:'COB strip pictured a different SMD strip without model proof',
  573:'Aeon projector screen pictured an assembly-video still',
  583:'Magnetic control-panel base pictured the entire screen',
  584:'Magnetic control-panel base pictured a steering wheel',
};
for (const [n, reason] of Object.entries(badItemPhotos)) withhold(products.find(p => p.image_url === `/products/items/product-${n.padStart(4, '0')}.webp`), reason);
for (const p of products) {
  const file = p.image_url;
  if (/\/bread-energy\/bread-(pv-|fl-|sl-|acc-pole)/.test(file)) withhold(p, 'Generated vector illustration or recoloured/reused photo; no exact original product photograph established');
  if (/\/blue-carbon\//.test(file)) withhold(p, 'Import reused other brands/models and added pixel salts; exact Blue Carbon model photograph not established');
  if (/\/core\/(sungene-panel|jms-panel|yingli-panel)/.test(file)) withhold(p, 'Solar panel listing pictured Longi or Canadian Solar branding');
  if (/\/meco\/|\/hinen\//.test(file)) withhold(p, 'Cross-brand import used EcoFlow product photos');
  if (/\/dawnice\/dawnice-(6kw|10kw)-inverter/.test(file) || /\/sorotech\//.test(file)) withhold(p, 'Cross-brand import pictured AlpSolarr hardware');
  if (/\/luxpower\/luxpower-vitabank/.test(file)) withhold(p, 'Cross-brand import pictured an EcoFlow power station');
  if (/\/infini(?:solar)?\/infini-(scc|app)/.test(file)) withhold(p, 'Charge controller or fan pictured a large inverter');
  if (/\/solarpro\/solarpro-(bat-15kwh|ess-60kwh|ess-125kwh)/.test(file)) withhold(p, 'SolarPro listing pictured Solis inverter hardware');
  if (file.endsWith('/fel-panel-fl-m-580w.webp')) withhold(p, 'Visual review found a blank white image; an exact FL-M580W original has not been established');
  if (file.endsWith('/itel-panel-620w.webp')) withhold(p, 'Original source explicitly identifies a 550W panel, not the listed 620W model');
  if (file.endsWith('/ecoflow-e980-power-station.webp')) withhold(p, 'E980 listing used an older RIVER photo; exact model original not established');
  if (file.endsWith('/ecoflow-delta-2-delta-3.webp')) withhold(p, 'Listing combines DELTA 2 and DELTA 3; exact supplied model must be established before selecting its photo');
  if (/bread-inv-11k-pro|bread-aio-5k-20k/.test(file)) withhold(p, 'Import reused/cropped a different capacity product photo');
}
await fs.mkdir('public/products/verified', { recursive: true });
for (const item of originals.filter(x => x.status === 'downloaded')) {
  // User accepts clear originals below HD. Tiny thumbnails remain withheld, not upscaled.
  if (Math.max(item.width, item.height) < 350 || Math.min(item.width, item.height) < 200) {
    withhold(products.find(p => p.image_url === item.original), `Exact supplier original is only ${item.width}×${item.height}; too small for a clear product photo`);
    manifest[item.original] = { ...item, ...manifest[item.original] };
    continue;
  }
  const image = `/products/verified/${item.filename}`;
  await fs.copyFile(`${base}/retail-source-images/${item.filename}`, `public${image}`);
  manifest[item.original] = { ...item, image, status: 'source-matched', quality: Math.max(item.width, item.height) >= 1000 ? 'native-1000px-plus' : 'clear-standard-resolution' };
}
await fs.mkdir('docs/image-audit-2026-10-28', { recursive: true });
await fs.writeFile('docs/image-audit-2026-10-28/image-decisions.json', JSON.stringify(manifest, null, 2) + '\n');
await fs.writeFile('src/data/retailImageOverrides.json', JSON.stringify(Object.fromEntries(Object.entries(manifest).map(([original, decision]) => [original, decision.image])), null, 2) + '\n');
console.log(JSON.stringify(Object.values(manifest).reduce((a, x) => (a[x.status] = (a[x.status] || 0) + 1, a), {})));
