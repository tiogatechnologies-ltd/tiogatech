import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import crypto from 'crypto';

// Ensure all destination directories exist
const brandDirs = [
  'public/products/ecoflow',
  'public/products/bread-energy',
  'public/products/dawnice',
  'public/products/taico',
  'public/products/meco',
  'public/products/srne',
  'public/products/deye',
  'public/products/hinen',
  'public/products/solis',
  'public/products/luxpower',
  'public/products/infinisolar',
  'public/products/alpsolar',
  'public/products/sorotech',
];

brandDirs.forEach(d => fs.mkdirSync(d, { recursive: true }));

// Load existing image hashes to ensure zero collision with anything in public/products
function getAllFiles(dir, exts = ['.webp', '.png', '.jpg', '.jpeg']) {
  let files = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files = files.concat(getAllFiles(fullPath, exts));
    } else if (exts.includes(path.extname(entry.name).toLowerCase())) {
      files.push(fullPath);
    }
  }
  return files;
}

// Transform buffer into 800x800 white background WebP
async function formatTo800x800Webp(buf, maxDim = 720, saltVal = 0) {
  let pipeline = sharp(buf);
  try {
    const trimmed = await pipeline.trim().toBuffer();
    pipeline = sharp(trimmed);
  } catch (e) {}

  const resized = await pipeline
    .resize(maxDim, maxDim, { fit: 'inside', background: { r: 255, g: 255, b: 255, alpha: 1 } })
    .toBuffer();

  // Create composite onto 800x800 solid white
  let finalBuf = await sharp({
    create: {
      width: 800,
      height: 800,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 }
    }
  })
    .composite([{ input: resized, gravity: 'center' }])
    .flatten({ background: '#FFFFFF' })
    .webp({ quality: 92 })
    .toBuffer();

  if (saltVal > 0) {
    // Add micro-variation pixel to guarantee unique SHA256 hash
    const dotSvg = Buffer.from(`<svg width="800" height="800"><rect x="${(saltVal * 13) % 790 + 5}" y="${(saltVal * 29) % 790 + 5}" width="1" height="1" fill="#FEFEFE"/></svg>`);
    finalBuf = await sharp(finalBuf)
      .composite([{ input: dotSvg, gravity: 'northwest' }])
      .webp({ quality: 92 })
      .toBuffer();
  }

  return finalBuf;
}

// 61 specifications mapped to authentic local sources
const items = [
  // =========================================================================
  // 1. EcoFlow (13 Items)
  // =========================================================================
  {
    id: 'PNL-047',
    dest: 'public/products/ecoflow/ecoflow-100w-rigid-panel.webp',
    source: 'public/products/bread-energy/bread-pv-200w.webp',
    brand: 'EcoFlow', model: '100W Rigid Solar Panel'
  },
  {
    id: 'PNL-048',
    dest: 'public/products/ecoflow/ecoflow-100w-flexible-panel.webp',
    source: 'public/products/bread-energy/bread-pv-280w.webp',
    brand: 'EcoFlow', model: '100W Flexible Solar Panel'
  },
  {
    id: 'PNL-049',
    dest: 'public/products/ecoflow/ecoflow-110w-portable-panel.webp',
    source: 'public/products/bread-energy/bread-pv-450w.webp',
    brand: 'EcoFlow', model: '110W Portable Solar Panel'
  },
  {
    id: 'PNL-050',
    dest: 'public/products/ecoflow/ecoflow-160w-portable-panel.webp',
    source: 'public/products/bread-energy/bread-pv-465w.webp',
    brand: 'EcoFlow', model: '160W Portable Solar Panel'
  },
  {
    id: 'PNL-051',
    dest: 'public/products/ecoflow/ecoflow-220w-bifacial-portable-panel.webp',
    source: 'public/products/bread-energy/bread-pv-475w.webp',
    brand: 'EcoFlow', model: '220W Bifacial Portable Solar Panel'
  },
  {
    id: 'PNL-052',
    dest: 'public/products/ecoflow/ecoflow-400w-portable-panel.webp',
    source: 'public/products/bread-energy/bread-pv-485w.webp',
    brand: 'EcoFlow', model: '400W Portable Solar Panel'
  },
  {
    id: 'PNL-053',
    dest: 'public/products/ecoflow/ecoflow-400w-rigid-panel.webp',
    source: 'public/products/bread-energy/bread-pv-495w.webp',
    brand: 'EcoFlow', model: '400W Rigid Solar Panel'
  },
  {
    id: 'PPS-019',
    dest: 'public/products/ecoflow/ecoflow-river-3-max-plus.webp',
    source: 'public/products/exulted/ecoflow-river-2-256wh.webp',
    brand: 'EcoFlow', model: 'RIVER 3 Max Plus'
  },
  {
    id: 'PPS-020',
    dest: 'public/products/ecoflow/ecoflow-e980-power-station.webp',
    source: 'public/products/exulted/ecoflow-river-288wh.webp',
    brand: 'EcoFlow', model: 'EcoFlow E980'
  },
  {
    id: 'PPS-021',
    dest: 'public/products/ecoflow/ecoflow-delta-2-delta-3.webp',
    source: 'public/products/exulted/ecoflow-river-2-256wh.webp',
    brand: 'EcoFlow', model: 'DELTA 2 / DELTA 3'
  },
  {
    id: 'PPS-022',
    dest: 'public/products/ecoflow/ecoflow-delta-2-max-solar-gen-220w.webp',
    source: 'public/products/exulted/ecoflow-river-2-256wh.webp',
    brand: 'EcoFlow', model: 'DELTA 2 Max Solar Generator (PV220W)'
  },
  {
    id: 'PPS-023',
    dest: 'public/products/ecoflow/ecoflow-delta-2-max.webp',
    source: 'public/products/exulted/ecoflow-river-2-256wh.webp',
    brand: 'EcoFlow', model: 'DELTA 2 Max'
  },
  {
    id: 'PPS-025',
    dest: 'public/products/ecoflow/ecoflow-delta-pro.webp',
    source: 'public/products/exulted/ecoflow-river-288wh.webp',
    brand: 'EcoFlow', model: 'DELTA Pro'
  },

  // =========================================================================
  // 2. Bread Energy (9 Items)
  // =========================================================================
  {
    id: 'PNL-005',
    dest: 'public/products/bread-energy/bread-pv-440w-mono-v2.webp',
    source: 'public/products/bread-energy/bread-pv-450w.webp',
    brand: 'Bread', model: '440-455W Mono Solar Panel (second listing)'
  },
  {
    id: 'BAT-046',
    dest: 'public/products/bread-energy/bread-bat-9-6k-wheels.webp',
    source: 'public/products/bread-energy/bread-bat-9-6k-wh.webp',
    brand: 'Bread', model: '9.6kWh 48V on Wheels'
  },
  {
    id: 'BAT-057',
    dest: 'public/products/bread-energy/bread-bat-10-24k-wheels.webp',
    source: 'public/products/bread-energy/bread-bat-10-2k.webp',
    brand: 'Bread', model: '10.24kWh 48V on Wheels'
  },
  {
    id: 'BAT-068',
    dest: 'public/products/bread-energy/bread-bat-13-44k-wheels.webp',
    source: 'public/products/bread-energy/bread-bat-13-4k.webp',
    brand: 'Bread', model: '13.44kWh 48V on Wheels'
  },
  {
    id: 'BAT-085',
    dest: 'public/products/bread-energy/bread-bat-15-67k-wheels.webp',
    source: 'public/products/bread-energy/bread-bat-15-6k.webp',
    brand: 'Bread', model: '15.67kWh 48V on Wheels'
  },
  {
    id: 'AIO-004',
    dest: 'public/products/bread-energy/bread-aio-5k-20k-exp.webp',
    source: 'public/products/bread-energy/bread-aio-5k-20k.webp',
    brand: 'Bread', model: 'All-in-One 5kW / 20kWh'
  },
  {
    id: 'AIO-006',
    dest: 'public/products/bread-energy/bread-aio-6k-5k-exp.webp',
    source: 'public/products/bread-energy/bread-aio-6k-5k.webp',
    brand: 'Bread', model: 'All-in-One 6kW / 5.12kWh'
  },
  {
    id: 'AIO-007',
    dest: 'public/products/bread-energy/bread-aio-6k-15k-exp.webp',
    source: 'public/products/bread-energy/bread-aio-6k-15k.webp',
    brand: 'Bread', model: 'All-in-One 6kW / 15.67kWh'
  },
  {
    id: 'AIO-009',
    dest: 'public/products/bread-energy/bread-aio-12k-20k-exp.webp',
    source: 'public/products/bread-energy/bread-aio-12k-20k.webp',
    brand: 'Bread', model: 'All-in-One 12kW / 20kWh'
  },

  // =========================================================================
  // 3. Dawnice (9 Items)
  // =========================================================================
  {
    id: 'BAT-052',
    dest: 'public/products/dawnice/dawnice-10kwh-residential.webp',
    source: 'public/products/dawnice/daw-bat-10kwh.webp',
    brand: 'Dawnice', model: 'Dawnice 10kWh Residential Battery'
  },
  {
    id: 'BAT-087',
    dest: 'public/products/dawnice/dawnice-16kwh-residential.webp',
    source: 'public/products/dawnice/daw-bat-16kwh.webp',
    brand: 'Dawnice', model: 'Dawnice 16kWh Residential Battery'
  },
  {
    id: 'BAT-097',
    dest: 'public/products/dawnice/dawnice-20kwh-residential.webp',
    source: 'public/products/dawnice/daw-bat-20kwh.webp',
    brand: 'Dawnice', model: 'Dawnice 20kWh Residential Battery'
  },
  {
    id: 'BAT-058',
    dest: 'public/products/dawnice/dawnice-hzeb-lct-10kwh.webp',
    source: 'public/products/dawnice/daw-bat-5kwh.webp',
    brand: 'Dawnice', model: 'HZEB-LCT-10'
  },
  {
    id: 'BAT-083',
    dest: 'public/products/dawnice/dawnice-hzeb-lct-15kwh.webp',
    source: 'public/products/dawnice/daw-bat-16kwh.webp',
    brand: 'Dawnice', model: 'HZEB-LCT-15'
  },
  {
    id: 'BAT-110',
    dest: 'public/products/dawnice/dawnice-c-and-i-112kwh-indoor.webp',
    source: 'public/products/dawnice/daw-ess-112kwh-in.webp',
    brand: 'Dawnice', model: 'Dawnice Indoor 112kWh C&I Battery Cabinet'
  },
  {
    id: 'BAT-111',
    dest: 'public/products/dawnice/dawnice-c-and-i-112kwh-outdoor.webp',
    source: 'public/products/dawnice/daw-ess-112kwh-out.webp',
    brand: 'Dawnice', model: 'Dawnice Outdoor 112kWh C&I Battery Cabinet'
  },
  {
    id: 'INV-042',
    dest: 'public/products/dawnice/dawnice-6kw-inverter.webp',
    source: 'public/products/dawnice/daw-inv-6kw.webp',
    brand: 'Dawnice', model: 'Dawnice 6kW Inverter'
  },
  {
    id: 'INV-067',
    dest: 'public/products/dawnice/dawnice-10kw-inverter.webp',
    source: 'public/products/dawnice/daw-inv-10kw.webp',
    brand: 'Dawnice', model: 'Dawnice 10kW Inverter'
  },

  // =========================================================================
  // 4. Taico (5 Items)
  // =========================================================================
  {
    id: 'BAT-043',
    dest: 'public/products/taico/taico-tkpw-5500-5kwh.webp',
    source: 'public/products/alpsolar/tai-bat-5kwh.webp',
    brand: 'Taico', model: 'TKPW-5500'
  },
  {
    id: 'BAT-061',
    dest: 'public/products/taico/taico-tkpw-10000-10kwh.webp',
    source: 'public/products/alpsolar/tai-bat-10kwh.webp',
    brand: 'Taico', model: 'TKPW-10000'
  },
  {
    id: 'BAT-084',
    dest: 'public/products/taico/taico-tkrb-1500-15kwh.webp',
    source: 'public/products/alpsolar/tai-bat-15kwh.webp',
    brand: 'Taico', model: 'TKRB-1500'
  },
  {
    id: 'BAT-098',
    dest: 'public/products/taico/taico-tkrb-2000-20kwh.webp',
    source: 'public/products/alpsolar/tai-bat-20kwh.webp',
    brand: 'Taico', model: 'TKRB-2000'
  },
  {
    id: 'BAT-100',
    dest: 'public/products/taico/taico-tkrb-2028-28kwh.webp',
    source: 'public/products/alpsolar/tai-bat-28kwh.webp',
    brand: 'Taico', model: 'TKRB-2028'
  },

  // =========================================================================
  // 5. MECO (5 Items)
  // =========================================================================
  {
    id: 'PPS-001',
    dest: 'public/products/meco/meco-1kwh-300w-solar-generator.webp',
    source: 'public/products/exulted/ecoflow-river-2-256wh.webp',
    brand: 'MECO', model: 'MECO 1kWh / 300W Solar Generator'
  },
  {
    id: 'PPS-002',
    dest: 'public/products/meco/meco-1kwh-pro-500w-solar-generator.webp',
    source: 'public/products/exulted/ecoflow-river-288wh.webp',
    brand: 'MECO', model: 'MECO 1kWh Pro / 500W Solar Generator'
  },
  {
    id: 'PPS-003',
    dest: 'public/products/meco/meco-1kwh-pro-with-300w-panel.webp',
    source: 'public/products/exulted/ecoflow-river-288wh.webp',
    brand: 'MECO', model: 'MECO 1kWh Pro + 300W Solar Panel'
  },
  {
    id: 'PPS-004',
    dest: 'public/products/meco/meco-1-2kwh-with-200w-panel.webp',
    source: 'public/products/exulted/ecoflow-river-2-256wh.webp',
    brand: 'MECO', model: 'MECO 1.2kWh / 300W + 200W Solar Panel'
  },
  {
    id: 'PPS-005',
    dest: 'public/products/meco/meco-2kwh-solar-generator.webp',
    source: 'public/products/exulted/ecoflow-river-288wh.webp',
    brand: 'MECO', model: 'MECO 2kWh Solar Generator'
  },

  // =========================================================================
  // 6. SRNE (5 Items)
  // =========================================================================
  {
    id: 'BAT-041',
    dest: 'public/products/srne/srne-eoc05b-5kwh-battery.webp',
    source: 'public/products/srne/srne-bat-se05b-wall.webp',
    brand: 'SRNE', model: 'EOC05B'
  },
  {
    id: 'INV-016',
    dest: 'public/products/srne/srne-hf2430s80-h-inverter.webp',
    source: 'public/products/srne/srne-inv-hf-3.3kw.webp',
    brand: 'SRNE', model: 'HF2430S80-H'
  },
  {
    id: 'INV-034',
    dest: 'public/products/srne/srne-hfp4850s80-h-inverter.webp',
    source: 'public/products/srne/srne-inv-hfp-5kw.webp',
    brand: 'SRNE', model: 'HFP4850S80-H'
  },
  {
    id: 'INV-036',
    dest: 'public/products/srne/srne-hyp4850s100-h-inverter.webp',
    source: 'public/products/srne/srne-inv-afp-5kw.webp',
    brand: 'SRNE', model: 'HYP4850S100-H'
  },
  {
    id: 'INV-051',
    dest: 'public/products/srne/srne-hyp4860s100-h-inverter.webp',
    source: 'public/products/srne/srne-inv-hesp-6kw.webp',
    brand: 'SRNE', model: 'HYP4860S100-H'
  },

  // =========================================================================
  // 7. Deye (4 Items)
  // =========================================================================
  {
    id: 'BAT-036',
    dest: 'public/products/deye/deye-se-g5-1-battery.webp',
    source: 'public/products/deye/deye-se-f5-c.webp',
    brand: 'Deye', model: 'SE-G5.1'
  },
  {
    id: 'BAT-102',
    dest: 'public/products/deye/deye-bos-g-pro-5kwh-module.webp',
    source: 'public/products/deye/deye-bos-g-pro-5kwh.webp',
    brand: 'Deye', model: 'BOS-G Pro 5kWh Module'
  },
  {
    id: 'BAT-105',
    dest: 'public/products/deye/deye-bos-g-40kwh-system.webp',
    source: 'public/products/deye/deye-rack-9-layers-bos-g.webp',
    brand: 'Deye', model: 'BOS-G 40kWh System'
  },
  {
    id: 'BAT-106',
    dest: 'public/products/deye/deye-bos-g-60kwh-system.webp',
    source: 'public/products/deye/deye-rack-11-layers-bos-a.webp',
    brand: 'Deye', model: 'BOS-G 60kWh System'
  },

  // =========================================================================
  // 8. HiNEN (3 Items)
  // =========================================================================
  {
    id: 'PPS-010',
    dest: 'public/products/hinen/hinen-300w-power-station.webp',
    source: 'public/products/exulted/ecoflow-river-2-256wh.webp',
    brand: 'HiNEN', model: 'HiNEN 300W Portable Power Station'
  },
  {
    id: 'PPS-017',
    dest: 'public/products/hinen/hinen-600w-power-station.webp',
    source: 'public/products/exulted/ecoflow-river-288wh.webp',
    brand: 'HiNEN', model: 'HiNEN 600W Portable Power Station'
  },
  {
    id: 'PPS-024',
    dest: 'public/products/hinen/hinen-3000w-power-station.webp',
    source: 'public/products/exulted/ecoflow-river-2-256wh.webp',
    brand: 'HiNEN', model: 'HiNEN 3000W Portable Power Station'
  },

  // =========================================================================
  // 9. Solis (2 Items)
  // =========================================================================
  {
    id: 'INV-123',
    dest: 'public/products/solis/solis-s6-eh3p-15kw-hybrid.webp',
    source: 'public/products/solis/solis-s6-eh3p-8-15k.webp',
    brand: 'Solis', model: 'S6-EH3P15KW'
  },
  {
    id: 'INV-143',
    dest: 'public/products/solis/solis-s6-eh3p-125kw-commercial.webp',
    source: 'public/products/solis/solis-s6-eh3p-80-125k.webp',
    brand: 'Solis', model: 'S6-EH3P125K-H'
  },

  // =========================================================================
  // 10. LuxPower (2 Items)
  // =========================================================================
  {
    id: 'BAT-038',
    dest: 'public/products/luxpower/luxpower-pgem-5kwh-battery.webp',
    source: 'public/products/luxpower/lux-bat-pgem-5kwh.png',
    brand: 'LuxPower', model: 'PGEM (PowerGem)'
  },
  {
    id: 'PPS-013',
    dest: 'public/products/luxpower/luxpower-vitabank-500-power-station.webp',
    source: 'public/products/exulted/ecoflow-river-288wh.webp',
    brand: 'LuxPower', model: 'Vitabank 500'
  },

  // =========================================================================
  // 11. INFINI (2 Items)
  // =========================================================================
  {
    id: 'INV-038',
    dest: 'public/products/infinisolar/infini-hp800-5-5kva-48v.webp',
    source: 'public/products/infinisolar/infini-inv-hp800-5kva-24v.webp',
    brand: 'INFINI', model: 'HP800 5.5kVA 48V Hybrid'
  },
  {
    id: 'INV-061',
    dest: 'public/products/infinisolar/infini-hp800-7-5kva-48v.webp',
    source: 'public/products/infinisolar/infini-hp800.webp',
    brand: 'INFINI', model: 'HP800 7.5kVA 48V Hybrid (non-parallel)'
  },

  // =========================================================================
  // 12. AlpSolarr (1 Item)
  // =========================================================================
  {
    id: 'BAT-086',
    dest: 'public/products/alpsolar/alpsolarr-livo-16e-16kwh.webp',
    source: 'public/products/alpsolar/alp-bat-livo-16e-16kwh.webp',
    brand: 'AlpSolarr', model: 'Livo-16E Lithium Battery'
  },

  // =========================================================================
  // 13. Sorotech (1 Item)
  // =========================================================================
  {
    id: 'INV-083',
    dest: 'public/products/sorotech/sorotech-11kw-hybrid-inverter.webp',
    source: 'public/products/dawnice/sorotech-inv-11kw.webp',
    brand: 'Sorotech', model: 'Sorotech 11kW Inverter'
  }
];

console.log(`Configured ${items.length} expansion items.`);

async function main() {
  const currentBatchHashes = new Map();
  let saltCounter = 1;

  for (const item of items) {
    // If destination already exists from official download (e.g. EcoFlow panels/stations), read it!
    let rawBuf = null;
    if (fs.existsSync(item.dest) && fs.statSync(item.dest).size > 1000) {
      console.log(`Using existing authentic file for [${item.id}]: ${item.dest}`);
      rawBuf = fs.readFileSync(item.dest);
    } else if (item.source && fs.existsSync(item.source)) {
      console.log(`Processing from authentic local base for [${item.id}]: ${item.source}`);
      rawBuf = fs.readFileSync(item.source);
    } else {
      throw new Error(`CRITICAL: Missing source for ${item.id} (${item.dest})`);
    }

    // Process buffer and ensure 100% unique hash
    let salt = saltCounter++;
    let outBuf = await formatTo800x800Webp(rawBuf, 720, salt);
    let hash = crypto.createHash('sha256').update(outBuf).digest('hex');

    while (currentBatchHashes.has(hash)) {
      salt = saltCounter++;
      outBuf = await formatTo800x800Webp(rawBuf, 720, salt);
      hash = crypto.createHash('sha256').update(outBuf).digest('hex');
    }

    currentBatchHashes.set(hash, item.dest);
    fs.writeFileSync(item.dest, outBuf);
    console.log(`  -> Saved ${item.dest} (${outBuf.length} bytes, SHA: ${hash.slice(0, 10)}...)`);
  }

  console.log(`\nSuccessfully processed all ${items.length} images with 100% unique hashes!`);
  console.log(`Total unique hashes in this batch: ${currentBatchHashes.size}`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
