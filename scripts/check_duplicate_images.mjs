import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { PRODUCTS } from '../src/data/products.ts';

console.log(`Total products in catalog: ${PRODUCTS.length}`);

// 1. Check duplicate image_url strings
const urlMap = new Map();
for (const p of PRODUCTS) {
  if (!p.image_url) continue;
  if (!urlMap.has(p.image_url)) {
    urlMap.set(p.image_url, []);
  }
  urlMap.get(p.image_url).push(p);
}

console.log('\n--- Duplicate image_url strings ---');
let dupUrlCount = 0;
for (const [url, prods] of urlMap.entries()) {
  if (prods.length > 1) {
    dupUrlCount++;
    console.log(`\nURL: ${url} (used by ${prods.length} products):`);
    prods.forEach(p => console.log(`   - [${p.id}] ${p.name} (${p.category})`));
  }
}
console.log(`\nTotal duplicate image_url groups: ${dupUrlCount}`);

// 2. Check duplicate image file hashes (different URLs pointing to identical files on disk)
console.log('\n--- Duplicate file content hashes on disk ---');
const hashMap = new Map();
for (const [url, prods] of urlMap.entries()) {
  // resolve path in public
  let relPath = url.startsWith('/') ? url.slice(1) : url;
  // strip query params or hashes
  relPath = relPath.split('?')[0].split('#')[0];
  const diskPath = path.join('public', relPath);
  if (fs.existsSync(diskPath)) {
    const buf = fs.readFileSync(diskPath);
    const hash = crypto.createHash('sha256').update(buf).digest('hex');
    if (!hashMap.has(hash)) {
      hashMap.set(hash, []);
    }
    hashMap.get(hash).push({ url, prods });
  } else {
    console.log(`File not found on disk: ${diskPath} for product: ${prods[0].name}`);
  }
}

let dupHashCount = 0;
for (const [hash, entries] of hashMap.entries()) {
  if (entries.length > 1) {
    dupHashCount++;
    console.log(`\nHash ${hash.slice(0, 10)} shared across ${entries.length} different image paths:`);
    entries.forEach(e => {
      console.log(`   Path: ${e.url} (used by ${e.prods.map(p => p.name).join(', ')})`);
    });
  }
}
console.log(`\nTotal duplicate content hash groups: ${dupHashCount}`);
