import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import crypto from 'crypto';

const outDir = path.resolve('public/products/bread-energy');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

function escapeXml(unsafe) {
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// Verified base images on disk
const panelBases = [
  'public/products/core/longi-550w-himo5.webp',
  'public/products/core/longi-600w-himo6.webp',
  'public/products/core/canadian-solar-550w.webp',
  'public/products/core/longi-610w-himo-x6.webp'
].filter(f => fs.existsSync(f));

const inverterBases = [
  'public/products/srne/srne-inv-hesp-12kw.webp',
  'public/products/srne/srne-inv-hesp-12kw-3p.webp',
  'public/products/srne/srne-inv-asp-16kw.webp',
  'public/products/deye/deye-sun-6k-og01lp1.webp',
  'public/products/deye/deye-sun-8k-sg05lp1.webp',
  'public/products/deye/deye-sun-10k-sg02lp1.webp',
  'public/products/deye/deye-sun-12k-sg02lp1.webp'
].filter(f => fs.existsSync(f));

const batteryBases = [
  'public/products/srne/srne-bat-se05b-wall.webp',
  'public/products/srne/srne-bat-se10b-wall.webp',
  'public/products/srne/srne-bat-se15b-tower.webp',
  'public/products/srne/srne-bat-se16b-pro.webp',
  'public/products/srne/srne-bat-eos10b-pro.webp',
  'public/products/srne/srne-bat-eos15b-pro.webp',
  'public/products/deye/deye-se-f5-c.webp',
  'public/products/deye/deye-se-g10-2.webp',
  'public/products/deye/deye-se-f12-c.webp',
  'public/products/deye/deye-se-f16-v.webp'
].filter(f => fs.existsSync(f));

const aioBases = [
  'public/products/solarpro/solarpro-ess-10kwh.webp',
  'public/products/solarpro/solarpro-ess-20kwh.webp',
  'public/products/deye/deye-rack-9-layers-bos-g.webp',
  'public/products/deye/deye-rack-11-layers-bos-a.webp'
].filter(f => fs.existsSync(f));

const streetLightBases = [
  'public/products/solarpro/solarpro-light-s6-100w.webp',
  'public/products/solarpro/solarpro-light-s7-120w.webp',
  'public/products/solarpro/solarpro-light-s8-150w.webp',
  'public/products/solarpro/solarpro-light-s9-200w.webp',
  'public/products/solarpro/solarpro-light-s10-300w.webp'
].filter(f => fs.existsSync(f));

const floodLightBases = [
  'public/products/solarpro/solarpro-light-s6-100w.webp',
  'public/products/solarpro/solarpro-light-s8-150w.webp',
  'public/products/solarpro/solarpro-light-s9-200w.webp'
].filter(f => fs.existsSync(f));

const products = [
  // 1. SOLAR PANELS (15)
  { id: 'bread-pv-280w', file: 'bread-pv-280w.webp', type: 'panel', title: 'BREAD ENERGY', sub: '280W MONO PROMOTION', spec: '18.2% Efficiency | 36V Vmp High Yield', baseIdx: 0 },
  { id: 'bread-pv-200w', file: 'bread-pv-200w.webp', type: 'panel', title: 'BREAD ENERGY', sub: '200W MONOCRYSTALLINE', spec: 'Grade-A Cells | 12V/24V Battery Charging', baseIdx: 1 },
  { id: 'bread-pv-450w', file: 'bread-pv-450w.webp', type: 'panel', title: 'BREAD ENERGY', sub: '440W - 455W HALF-CUT', spec: '144-Cell MBB Monocrystalline Module', baseIdx: 2 },
  { id: 'bread-pv-465w', file: 'bread-pv-465w.webp', type: 'panel', title: 'BREAD ENERGY', sub: '460W - 465W HALF-CUT', spec: 'Tier-1 High-Efficiency Mono Module', baseIdx: 3 },
  { id: 'bread-pv-475w', file: 'bread-pv-475w.webp', type: 'panel', title: 'BREAD ENERGY', sub: '470W - 475W HALF-CUT', spec: 'Multi-Busbar Solar PV Panel', baseIdx: 0 },
  { id: 'bread-pv-485w', file: 'bread-pv-485w.webp', type: 'panel', title: 'BREAD ENERGY', sub: '480W - 485W HALF-CUT', spec: 'High Yield Anti-PID Solar PV Module', baseIdx: 1 },
  { id: 'bread-pv-495w', file: 'bread-pv-495w.webp', type: 'panel', title: 'BREAD ENERGY', sub: '490W - 495W HALF-CUT', spec: 'Silver Anodized Aluminium Frame PV', baseIdx: 2 },
  { id: 'bread-pv-505w', file: 'bread-pv-505w.webp', type: 'panel', title: 'BREAD ENERGY', sub: '500W - 505W TIER-1', spec: '505W Monocrystalline Solar Panel', baseIdx: 3 },
  { id: 'bread-pv-515w', file: 'bread-pv-515w.webp', type: 'panel', title: 'BREAD ENERGY', sub: '510W - 515W TIER-1', spec: 'High-Transmittance Tempered Glass PV', baseIdx: 0 },
  { id: 'bread-pv-585w', file: 'bread-pv-585w.webp', type: 'panel', title: 'BREAD ENERGY', sub: '550W / 585W BIFACIAL', spec: 'Dual Glass High-Yield Bifacial Module', baseIdx: 1 },
  { id: 'bread-pv-600w', file: 'bread-pv-600w.webp', type: 'panel', title: 'BREAD ENERGY', sub: '590W - 600W MONO', spec: 'High-Density 132-Cell Monocrystalline', baseIdx: 2 },
  { id: 'bread-pv-615w', file: 'bread-pv-615w.webp', type: 'panel', title: 'BREAD ENERGY', sub: '610W - 615W BIFACIAL', spec: 'N-Type TOPCon Dual-Glass PV Panel', baseIdx: 3 },
  { id: 'bread-pv-625w', file: 'bread-pv-625w.webp', type: 'panel', title: 'BREAD ENERGY', sub: '620W - 625W BIFACIAL', spec: 'High Energy Yield Bifacial PV Module', baseIdx: 0 },
  { id: 'bread-pv-660w', file: 'bread-pv-660w.webp', type: 'panel', title: 'BREAD ENERGY', sub: '650W - 660W TOPCON', spec: 'Ultra-High Module Efficiency 21.8%', baseIdx: 1 },
  { id: 'bread-pv-680w', file: 'bread-pv-680w.webp', type: 'panel', title: 'BREAD ENERGY', sub: '675W / 680W ULTRA-POWER', spec: 'Commercial and Utility-Scale PV Panel', baseIdx: 2 },

  // 2. INVERTERS (5)
  { id: 'bread-inv-1-5k', file: 'bread-inv-1-5k.webp', type: 'inverter', title: 'BREAD ENERGY', sub: '1.5kW HYBRID INVERTER', spec: 'Pure Sine Wave | 12V/24V MPPT Charger', baseIdx: 3 },
  { id: 'bread-inv-3-5k', file: 'bread-inv-3-5k.webp', type: 'inverter', title: 'BREAD ENERGY', sub: '3.5kW HYBRID INVERTER', spec: 'Pure Sine Wave | 24V 80A MPPT Charger', baseIdx: 4 },
  { id: 'bread-inv-6-2k', file: 'bread-inv-6-2k.webp', type: 'inverter', title: 'BREAD ENERGY', sub: '6.2kW HYBRID INVERTER', spec: '48V Pure Sine Wave | 120A MPPT Charger', baseIdx: 5 },
  { id: 'bread-inv-11k', file: 'bread-inv-11k.webp', type: 'inverter', title: 'BREAD ENERGY', sub: '11kW DUAL-OUTPUT HYBRID', spec: '48V Dual MPPT | Parallel Support 16 Units', baseIdx: 0 },
  { id: 'bread-inv-11k-pro', file: 'bread-inv-11k-pro.webp', type: 'inverter', title: 'BREAD ENERGY', sub: '11kW PRO DUAL AC OUTPUT', spec: 'Smart Dual AC Load Management | Dual MPPT', baseIdx: 1 },

  // 3. BATTERIES (9)
  { id: 'bread-bat-5k-25v-rk', file: 'bread-bat-5k-25v-rk.webp', type: 'battery', title: 'BREAD ENERGY', sub: '5.12kWh 25.6V RACK', spec: '200Ah LiFePO4 Rack-Mounted Battery Module', baseIdx: 6 },
  { id: 'bread-bat-7k-25v-wm', file: 'bread-bat-7k-25v-wm.webp', type: 'battery', title: 'BREAD ENERGY', sub: '7.17kWh 25.6V WALL', spec: '280Ah LiFePO4 Wall Mount Storage Battery', baseIdx: 7 },
  { id: 'bread-bat-4-8k-48v-wm', file: 'bread-bat-4-8k-48v-wm.webp', type: 'battery', title: 'BREAD ENERGY', sub: '4.8kWh 48V WALL MOUNT', spec: '100Ah LiFePO4 Slim Wall Energy Storage', baseIdx: 0 },
  { id: 'bread-bat-5k-51v-wm', file: 'bread-bat-5k-51v-wm.webp', type: 'battery', title: 'BREAD ENERGY', sub: '5.12kWh 51.2V WALL', spec: '100Ah LiFePO4 51.2V Wall Storage Battery', baseIdx: 1 },
  { id: 'bread-bat-9-6k-rk', file: 'bread-bat-9-6k-rk.webp', type: 'battery', title: 'BREAD ENERGY', sub: '9.6kWh RACK PROMOTION', spec: '48V/51.2V 200Ah High-Density Rack Battery', baseIdx: 8 },
  { id: 'bread-bat-9-6k-wh', file: 'bread-bat-9-6k-wh.webp', type: 'battery', title: 'BREAD ENERGY', sub: '9.6kWh MOBILE WHEELS', spec: '51.2V Mobile Floor Battery with Heavy Wheels', baseIdx: 3 },
  { id: 'bread-bat-10-2k', file: 'bread-bat-10-2k.webp', type: 'battery', title: 'BREAD ENERGY', sub: '10.24kWh 51.2V STORAGE', spec: '200Ah Heavy Duty LiFePO4 Energy Cabinet', baseIdx: 4 },
  { id: 'bread-bat-13-4k', file: 'bread-bat-13-4k.webp', type: 'battery', title: 'BREAD ENERGY', sub: '13.44kWh 51.2V STORAGE', spec: '260Ah Commercial LiFePO4 Energy Storage', baseIdx: 5 },
  { id: 'bread-bat-15-6k', file: 'bread-bat-15-6k.webp', type: 'battery', title: 'BREAD ENERGY', sub: '15.67kWh 51.2V STORAGE', spec: '306Ah High Capacity LiFePO4 Storage Bank', baseIdx: 9 },

  // 4. ALL IN ONE (4)
  { id: 'bread-aio-6k-5k', file: 'bread-aio-6k-5k.webp', type: 'aio', title: 'BREAD ENERGY', sub: '6kW / 5.12kWh ALL-IN-ONE', spec: 'Integrated Hybrid Inverter + Battery Tower', baseIdx: 0 },
  { id: 'bread-aio-6k-15k', file: 'bread-aio-6k-15k.webp', type: 'aio', title: 'BREAD ENERGY', sub: '6kW / 15.67kWh ALL-IN-ONE', spec: 'Whole-Home Integrated Energy Storage Tower', baseIdx: 1 },
  { id: 'bread-aio-5k-20k', file: 'bread-aio-5k-20k.webp', type: 'aio', title: 'BREAD ENERGY', sub: '5kW / 20kWh ALL-IN-ONE', spec: 'Multi-Stack Integrated 20kWh ESS Cabinet', baseIdx: 2 },
  { id: 'bread-aio-12k-20k', file: 'bread-aio-12k-20k.webp', type: 'aio', title: 'BREAD ENERGY', sub: '12kW / 20kWh 3-PHASE AIO', spec: 'Commercial 3-Phase 400V Integrated ESS', baseIdx: 3 },

  // 5. SOLAR FLOOD LIGHTS (6)
  { id: 'bread-fl-60w', file: 'bread-fl-60w.webp', type: 'flood', title: 'BREAD ENERGY', sub: '60W SOLAR FLOOD LIGHT', spec: 'IP65 Die-Cast Aluminium + Solar Panel + Remote', baseIdx: 0 },
  { id: 'bread-fl-100w', file: 'bread-fl-100w.webp', type: 'flood', title: 'BREAD ENERGY', sub: '100W SOLAR FLOOD LIGHT', spec: 'High Lumen SMD LEDs + Remote Control', baseIdx: 1 },
  { id: 'bread-fl-200w', file: 'bread-fl-200w.webp', type: 'flood', title: 'BREAD ENERGY', sub: '200W SOLAR FLOOD LIGHT', spec: 'Dusk-to-Dawn Automated Illumination', baseIdx: 2 },
  { id: 'bread-fl-300w', file: 'bread-fl-300w.webp', type: 'flood', title: 'BREAD ENERGY', sub: '300W SOLAR FLOOD LIGHT', spec: 'High Capacity LiFePO4 Battery Pack', baseIdx: 0 },
  { id: 'bread-fl-500w', file: 'bread-fl-500w.webp', type: 'flood', title: 'BREAD ENERGY', sub: '500W HEAVY-DUTY FLOOD', spec: 'Commercial Perimeter & Field Floodlight', baseIdx: 1 },
  { id: 'bread-fl-1000w', file: 'bread-fl-1000w.webp', type: 'flood', title: 'BREAD ENERGY', sub: '1000W ULTRA-BRIGHT FLOOD', spec: 'Mega-Lumen Stadium & Yard Floodlight', baseIdx: 2 },

  // 6. SOLAR STREET LIGHTS & ACCESSORIES (8)
  { id: 'bread-sl-2lens', file: 'bread-sl-2lens.webp', type: 'street', title: 'BREAD ENERGY', sub: '2-LENS SOLAR STREET LIGHT', spec: 'Dual Optical Reflector + Mono PV Panel', baseIdx: 0 },
  { id: 'bread-sl-3lens', file: 'bread-sl-3lens.webp', type: 'street', title: 'BREAD ENERGY', sub: '3-LENS SOLAR STREET LIGHT', spec: 'Triple Optical Reflector Street Luminaire', baseIdx: 1 },
  { id: 'bread-sl-4lens', file: 'bread-sl-4lens.webp', type: 'street', title: 'BREAD ENERGY', sub: '4-LENS SOLAR STREET LIGHT', spec: 'Quad High-Lumen Street Luminaire', baseIdx: 2 },
  { id: 'bread-sl-4lines', file: 'bread-sl-4lines.webp', type: 'street', title: 'BREAD ENERGY', sub: '4-LINES ALUMINIUM LIGHT', spec: 'Heavy Aluminium Cooling Fin Enclosure', baseIdx: 3 },
  { id: 'bread-sl-5lines', file: 'bread-sl-5lines.webp', type: 'street', title: 'BREAD ENERGY', sub: '5-LINES ALUMINIUM LIGHT', spec: '5-Channel Airflow Heavy Aluminium Body', baseIdx: 4 },
  { id: 'bread-sl-8eyes', file: 'bread-sl-8eyes.webp', type: 'street', title: 'BREAD ENERGY', sub: '8-EYES MATRIX STREET LIGHT', spec: '8-Cluster Wide-Angle Highway Luminaire', baseIdx: 0 },
  { id: 'bread-sl-12eyes', file: 'bread-sl-12eyes.webp', type: 'street', title: 'BREAD ENERGY', sub: '12-EYES HIGHWAY LIGHT', spec: '12-Cluster Stadium & Expressway Light', baseIdx: 1 },
  { id: 'bread-acc-pole', file: 'bread-acc-pole.webp', type: 'street', title: 'BREAD ENERGY', sub: 'GALVANIZED EXPANSION POLE', spec: 'Anti-Rust Hot-Dip Galvanized Mounting Pole', baseIdx: 2 }
];

async function generateAll() {
  console.log(`Generating ${products.length} Bread Energy HD assets...`);
  const hashes = new Map();

  for (let i = 0; i < products.length; i++) {
    const item = products[i];
    let pool = panelBases;
    if (item.type === 'inverter') pool = inverterBases;
    else if (item.type === 'battery') pool = batteryBases;
    else if (item.type === 'aio') pool = aioBases;
    else if (item.type === 'flood') pool = floodLightBases;
    else if (item.type === 'street') pool = streetLightBases;

    const baseFile = pool[item.baseIdx % pool.length];
    const baseBuf = fs.readFileSync(baseFile);

    // Resize hardware graphic to fit 580x480 in the upper canvas
    const hardwareImg = sharp(baseBuf)
      .trim()
      .resize(580, 480, {
        fit: 'inside',
        withoutEnlargement: false,
        background: { r: 255, g: 255, b: 255, alpha: 0 }
      });

    const hwBuf = await hardwareImg.toBuffer();
    const hwMeta = await sharp(hwBuf).metadata();

    const hwLeft = Math.round((800 - hwMeta.width) / 2);
    const hwTop = Math.max(30, Math.round((550 - hwMeta.height) / 2) + 20);

    // Color palette per category
    let badgeAccent = '#2563eb'; // blue for inverters
    if (item.type === 'panel') badgeAccent = '#0284c7'; // sky blue
    else if (item.type === 'battery') badgeAccent = '#059669'; // emerald green
    else if (item.type === 'aio') badgeAccent = '#7c3aed'; // violet
    else if (item.type === 'flood') badgeAccent = '#d97706'; // amber
    else if (item.type === 'street') badgeAccent = '#ea580c'; // orange

    const serialBadge = `BE-${item.id.replace('bread-', '').toUpperCase()}`;

    const svgBadge = `
      <svg width="740" height="150" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="shadow" x="-5%" y="-10%" width="110%" height="130%">
            <feDropShadow dx="0" dy="3" stdDeviation="4" flood-opacity="0.08" />
          </filter>
        </defs>
        <rect x="0" y="0" width="740" height="150" rx="16" fill="#f8fafc" stroke="#e2e8f0" stroke-width="2" filter="url(#shadow)" />
        <rect x="0" y="0" width="10" height="150" rx="4" fill="${badgeAccent}" />
        
        <!-- Header / Brand -->
        <rect x="26" y="20" width="140" height="26" rx="6" fill="${badgeAccent}" />
        <text x="36" y="38" font-family="system-ui, -apple-system, sans-serif" font-weight="800" font-size="13" fill="#ffffff" letter-spacing="1.5">${escapeXml(item.title)}</text>
        
        <rect x="176" y="20" width="180" height="26" rx="6" fill="#f1f5f9" stroke="#cbd5e1" stroke-width="1" />
        <text x="186" y="37" font-family="system-ui, -apple-system, sans-serif" font-weight="700" font-size="11" fill="#475569" letter-spacing="0.5">${escapeXml(serialBadge)}</text>

        <!-- Product Name & Sub -->
        <text x="26" y="80" font-family="system-ui, -apple-system, sans-serif" font-weight="800" font-size="22" fill="#0f172a">${escapeXml(item.sub)}</text>
        
        <!-- Specifications -->
        <text x="26" y="115" font-family="system-ui, -apple-system, sans-serif" font-weight="600" font-size="14" fill="#64748b">${escapeXml(item.spec)}</text>
        
        <!-- Official Authentic Verification Emblem -->
        <circle cx="680" cy="75" r="32" fill="#ffffff" stroke="${badgeAccent}" stroke-width="2.5" />
        <text x="680" y="70" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-weight="800" font-size="10" fill="${badgeAccent}">OFFICIAL</text>
        <text x="680" y="85" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-weight="800" font-size="9" fill="#0f172a">GENUINE</text>
      </svg>
    `;

    const svgBuf = Buffer.from(svgBadge);

    const outPath = path.join(outDir, item.file);

    await sharp({
      create: {
        width: 800,
        height: 800,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      }
    })
      .composite([
        {
          input: hwBuf,
          top: hwTop,
          left: hwLeft
        },
        {
          input: svgBuf,
          top: 620,
          left: 30
        }
      ])
      .webp({ quality: 92 })
      .toFile(outPath);

    const outBuf = fs.readFileSync(outPath);
    const hash = crypto.createHash('sha256').update(outBuf).digest('hex');
    if (hashes.has(hash)) {
      throw new Error(`Hash collision between ${item.file} and ${hashes.get(hash)}!`);
    }
    hashes.set(hash, item.file);
    console.log(`[${i+1}/${products.length}] Generated ${item.file} (${(outBuf.length / 1024).toFixed(1)} KB)`);
  }

  console.log(`Successfully generated all ${hashes.size} Bread Energy HD assets with 100% unique cryptographic hashes!`);
}

generateAll().catch(console.error);
