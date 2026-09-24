import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const OUT_DIR = path.resolve('public/products/suness');
fs.mkdirSync(OUT_DIR, { recursive: true });

function createBadgeSvg(category, modelText, specText) {
  // Escapes for XML (must escape & after toUpperCase because &AMP; is invalid in XML)
  const cleanCat = category.toUpperCase().replace(/&/g, '&amp;');
  const cleanModel = modelText.replace(/&/g, '&amp;').replace(/•/g, '&#8226;');
  const cleanSpec = specText.replace(/&/g, '&amp;').replace(/•/g, '&#8226;');

  return `
  <svg width="800" height="800" viewBox="0 0 800 800" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <filter id="shadow" x="-10%" y="-10%" width="125%" height="135%">
        <feDropShadow dx="0" dy="4" stdDeviation="5" flood-color="#001428" flood-opacity="0.32"/>
      </filter>
      <linearGradient id="badgeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#0B5CAB" />
        <stop offset="100%" stop-color="#042C59" />
      </linearGradient>
    </defs>
    
    <g filter="url(#shadow)">
      <rect x="450" y="32" width="318" height="74" rx="14" fill="url(#badgeGrad)" stroke="#1D4ED8" stroke-width="1.5" />
      <text x="609" y="53" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="10.5" font-weight="700" letter-spacing="1.5" fill="#38BDF8">${cleanCat}</text>
      <text x="609" y="75" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14.5" font-weight="800" fill="#FFFFFF">${cleanModel}</text>
      <text x="609" y="93" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="500" fill="#93C5FD">${cleanSpec}</text>
    </g>
  </svg>
  `;
}

const PRODUCTS = [
  {
    filename: 'suness-ess-ec-48300f-16kwh.webp',
    source: 'scripts/suness_unique_raw/bat_ec_48300_main.jpg',
    category: 'Lithium Battery System',
    model: 'EC-48300F • 16kWh (300Ah)',
    spec: '51.2V 300Ah • 6,000+ Cycles • Casters',
    size: 610,
    top: 110,
    left: 95
  },
  {
    filename: 'suness-ess-ec-mini-15kwh.webp',
    source: 'scripts/suness_unique_raw/bat_ec_mini_iso.jpg',
    category: 'Home Energy Storage',
    model: 'EC-MINI15.36 • 15.36kWh',
    spec: '51.2V 300Ah • Smart Touch Display',
    size: 600,
    top: 110,
    left: 100
  },
  {
    filename: 'suness-ess-hvs-40kwh.webp',
    source: 'scripts/suness_unique_raw/bat_hvs_40k.jpg',
    category: 'High-Voltage Stackable ESS',
    model: 'iRack-HVS • 40 kWh ESS',
    spec: '409.6V 100Ah • Modular Rack Tower',
    size: 630,
    top: 100,
    left: 85
  },
  {
    filename: 'suness-ess-hvs-60kwh.webp',
    source: 'scripts/suness_unique_raw/bat_hvs_60k.jpg',
    category: 'High-Voltage Stackable ESS',
    model: 'iRack-HVS • 60 kWh ESS',
    spec: '614.4V 100Ah • 12-Module Tower',
    size: 650,
    top: 90,
    left: 75
  },
  {
    filename: 'suness-ess-ec-48314f-16kwh.webp',
    source: 'scripts/suness_unique_raw/bat_ec_48314.jpg',
    category: 'Ultra-Density Lithium',
    model: 'EC-48314F • 16kWh (314Ah)',
    spec: '51.2V 314Ah • 8,000+ Cycle Life',
    size: 610,
    top: 110,
    left: 95
  },
  {
    filename: 'suness-ess-hvm-215kwh.webp',
    source: 'scripts/suness_unique_raw/bat_hvm_215k.jpg',
    category: 'Commercial & Industrial ESS',
    model: 'iCab-HVM • 215 kWh Cabinet',
    spec: 'Liquid Cooling • Side PCS Inverter',
    size: 620,
    top: 100,
    left: 90
  },
  {
    filename: 'suness-inv-8kw-1p-lv.webp',
    source: 'scripts/suness_unique_raw/inv_8k_1d4.jpg',
    category: 'Single-Phase Hybrid Inverter',
    model: 'EH-8KL1 • 8 kW Low Voltage',
    spec: '48V System • Dual MPPT • 190A',
    size: 630,
    top: 95,
    left: 85
  },
  {
    filename: 'suness-inv-16kw-1p-lv.webp',
    source: 'scripts/suness_unique_raw/inv_16k_66d.jpg',
    category: 'Single-Phase High-Power',
    model: 'EH-16KL1 • 16 kW Low Voltage',
    spec: '48V System • 26kW PV • 290A Charge',
    size: 620,
    top: 105,
    left: 90
  },
  {
    filename: 'suness-inv-15kw-3p-lv.webp',
    source: 'scripts/suness_unique_raw/inv_3p_e6a.jpg',
    category: 'Three-Phase Low-Voltage',
    model: 'EH-15KL3 • 15 kW Hybrid',
    spec: '380V/400V 3-Phase • 48V Bus • Dual MPPT',
    size: 620,
    top: 105,
    left: 90
  },
  {
    filename: 'suness-inv-20kw-3p-lv.webp',
    source: 'scripts/suness_unique_raw/inv_3p_98e.jpg',
    category: 'Three-Phase Low-Voltage',
    model: 'EH-20KL3 • 20 kW Hybrid',
    spec: '380V/400V 3-Phase • 330A Charge',
    size: 620,
    top: 105,
    left: 90
  },
  {
    filename: 'suness-inv-24kw-3p-lv.webp',
    source: 'scripts/suness_unique_raw/inv_3p_dc3.jpg',
    category: 'Three-Phase Ultra LV',
    model: 'EH-24KL3 • 24 kW Hybrid',
    spec: 'Largest 48V Inverter • 36kW PV • 400A',
    size: 620,
    top: 105,
    left: 90
  },
  {
    filename: 'suness-inv-60kw-3p-hv.webp',
    source: 'scripts/suness_unique_raw/inv_60k_3d9.jpg',
    category: 'Three-Phase High-Voltage',
    model: 'EH-60KL3 • 60 kW HV Hybrid',
    spec: '160V-800V HV Bus • Quad MPPT • 90kW PV',
    size: 620,
    top: 105,
    left: 90
  }
];

async function generateAll() {
  console.log(`Generating ${PRODUCTS.length} Suness product images with 100% unique source assets...`);
  
  // Verify source uniqueness
  const sources = new Set(PRODUCTS.map(p => p.source));
  if (sources.size !== PRODUCTS.length) {
    throw new Error(`CRITICAL: Duplicate source detected! Unique: ${sources.size}, Total: ${PRODUCTS.length}`);
  }

  for (const prod of PRODUCTS) {
    if (!fs.existsSync(prod.source)) {
      throw new Error(`Source file missing: ${prod.source}`);
    }

    // Clean any near-white background noise (e.g. JPEG compression artifacts >= 248) to pure 255
    const raw = await sharp(prod.source).raw().toBuffer({ resolveWithObject: true });
    for (let i = 0; i < raw.data.length; i += raw.info.channels) {
      if (raw.data[i] >= 248 && raw.data[i+1] >= 248 && raw.data[i+2] >= 248) {
        raw.data[i] = 255;
        raw.data[i+1] = 255;
        raw.data[i+2] = 255;
      }
    }
    const cleanedBuf = await sharp(raw.data, {
      raw: {
        width: raw.info.width,
        height: raw.info.height,
        channels: raw.info.channels
      }
    })
      .png()
      .resize(prod.size, prod.size, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      })
      .toBuffer();

    const badgeSvg = createBadgeSvg(prod.category, prod.model, prod.spec);

    const outPath = path.join(OUT_DIR, prod.filename);
    await sharp({
      create: {
        width: 800,
        height: 800,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      }
    })
      .composite([
        { input: cleanedBuf, top: prod.top, left: prod.left },
        { input: Buffer.from(badgeSvg), top: 0, left: 0 }
      ])
      .webp({ quality: 92 })
      .toFile(outPath);

    const meta = await sharp(outPath).metadata();
    const stats = fs.statSync(outPath);
    console.log(`Saved ${prod.filename}: ${meta.width}x${meta.height}, ${(stats.size/1024).toFixed(1)} KB`);
  }
  console.log('All 12 Suness images generated with complete uniqueness!');
}

generateAll().catch(err => {
  console.error(err);
  process.exit(1);
});
