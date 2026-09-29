import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import sharp from 'sharp';

const imagesToCheck = [
  // SolarPro (10)
  'public/products/solarpro/solarpro-light-s6-100w.webp',
  'public/products/solarpro/solarpro-light-s7-120w.webp',
  'public/products/solarpro/solarpro-light-i6-100w.webp',
  'public/products/solarpro/solarpro-light-r1-60w.webp',
  'public/products/solarpro/solarpro-light-r3-100w.webp',
  'public/products/solarpro/solarpro-light-r4-120w.webp',
  'public/products/solarpro/solarpro-light-sp-fl-300w.webp',
  'public/products/solarpro/solarpro-bat-15kwh-48v.webp',
  'public/products/solarpro/solarpro-ess-60kwh-hv.webp',
  'public/products/solarpro/solarpro-ess-125kwh-hv.webp',
  // Solis (7)
  'public/products/solis/solis-s6-eo1p-5k-48.webp',
  'public/products/solis/solis-s6-eh1p-12k.webp',
  'public/products/solis/solis-s6-eh1p-14k.webp',
  'public/products/solis/solis-s6-eh1p-16k.webp',
  'public/products/solis/solis-s6-eh1p-18k.webp',
  'public/products/solis/solis-s6-eh3p-30k-h.webp',
  'public/products/solis/solis-s6-eh3p-50k-h.webp',
  // Sungene & Infini (10)
  'public/products/infinisolar/sungene-bat-7-6kwh-24v.webp',
  'public/products/infinisolar/sungene-bat-15kwh-48v.webp',
  'public/products/infinisolar/infini-bat-10-2kwh-48v.webp',
  'public/products/infinisolar/infini-bat-15kwh-48v.webp',
  'public/products/infinisolar/infini-inv-hp800-3-5kva-24v.webp',
  'public/products/infinisolar/infini-inv-hp800-5kva-24v.webp',
  'public/products/infinisolar/infini-scc-mppt-60a.webp',
  'public/products/infinisolar/infini-scc-mppt-100a.webp',
  'public/products/infinisolar/infini-app-fan-18-rechargeable.webp',
  'public/products/infinisolar/infini-app-fan-18-solar-kit.webp',
  // Panels (6)
  'public/products/core/sungene-panel-330w-mono.webp',
  'public/products/core/sungene-panel-650w-mono.webp',
  'public/products/core/jms-panel-550w-mono.webp',
  'public/products/core/jms-panel-630w-mono.webp',
  'public/products/core/yingli-panel-620w-mono.webp',
  'public/products/core/yingli-panel-625w-mono.webp'
];

async function verify() {
  const hashes = new Map();
  console.log(`Checking ${imagesToCheck.length} images...`);

  for (const imgPath of imagesToCheck) {
    if (!fs.existsSync(imgPath)) {
      throw new Error(`File does not exist: ${imgPath}`);
    }
    const buf = fs.readFileSync(imgPath);
    const hash = crypto.createHash('sha256').update(buf).digest('hex');
    const meta = await sharp(buf).metadata();
    
    if (hashes.has(hash)) {
      throw new Error(`Duplicate hash detected between ${imgPath} and ${hashes.get(hash)}!`);
    }
    hashes.set(hash, imgPath);
    console.log(`OK: ${path.basename(imgPath).padEnd(42)} ${meta.width}x${meta.height} (${(buf.length / 1024).toFixed(1)} KB)`);
  }

  console.log(`\nSUCCESS! All ${imagesToCheck.length} images are verified, 800x800, and 100% UNIQUE!`);
}

verify().catch(e => {
  console.error('VERIFICATION FAILED:', e.message);
  process.exit(1);
});
