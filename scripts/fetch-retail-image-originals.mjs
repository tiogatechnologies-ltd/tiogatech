import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import sharp from 'sharp';
const base = 'supabase/.temp';
const plan = JSON.parse(await fs.readFile(`${base}/retail-image-source-plan.json`, 'utf8'));
await fs.mkdir(`${base}/retail-source-images`, { recursive: true });
const results = [];
let cursor = 0;
async function worker() {
  while (cursor < plan.length) {
    const item = plan[cursor++];
    const key = crypto.createHash('sha256').update(item.source).digest('hex').slice(0, 16);
    const cache = `${base}/retail-source-images/${key}.original`;
    try {
      let bytes;
      try { bytes = await fs.readFile(cache); } catch {
        const response = await fetch(item.source, { signal: AbortSignal.timeout(35000) });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        bytes = Buffer.from(await response.arrayBuffer());
        await sharp(bytes).metadata();
        await fs.writeFile(cache, bytes);
      }
      const meta = await sharp(bytes).metadata();
      // Fit only downwards. Never make a small original appear high resolution.
      const output = await sharp(bytes).rotate().resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true }).webp({ quality: 90 }).toBuffer();
      const filename = `${key}.webp`;
      await fs.writeFile(`${base}/retail-source-images/${filename}`, output);
      const out = await sharp(output).metadata();
      results.push({ ...item, key, filename, width: meta.width, height: meta.height, outputWidth: out.width, outputHeight: out.height, sha256: crypto.createHash('sha256').update(output).digest('hex'), status: 'downloaded' });
    } catch (error) {
      results.push({ ...item, status: 'failed', error: error.message });
    }
    if (results.length % 25 === 0) console.log(`${results.length}/${plan.length}`);
  }
}
await Promise.all(Array.from({ length: 6 }, worker));
results.sort((a, b) => a.original.localeCompare(b.original));
await fs.writeFile(`${base}/retail-image-originals.json`, JSON.stringify(results, null, 2));
console.log(JSON.stringify({ downloaded: results.filter(x => x.status === 'downloaded').length, failed: results.filter(x => x.status === 'failed').map(x => ({ name: x.productName, error: x.error })), nativeUnder1000: results.filter(x => x.status === 'downloaded' && Math.max(x.width, x.height) < 1000).length }));
