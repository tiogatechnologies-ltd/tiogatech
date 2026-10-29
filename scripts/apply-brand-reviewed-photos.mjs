// Apply only reviewed brand corrections. Never choose a different brand by category.
import fs from 'node:fs/promises';
import { build } from 'esbuild';
const read = async file => JSON.parse(await fs.readFile(file, 'utf8'));
const write = (file, value) => fs.writeFile(file, JSON.stringify(value, null, 2) + '\n');
await fs.mkdir('supabase/.temp', { recursive:true });
await build({ stdin:{ contents:'export {PRODUCTS} from "./src/data/products"; export * from "./src/lib/productPhotoIdentity";', resolveDir:process.cwd() }, outfile:'supabase/.temp/brand-manifest-runtime.mjs', bundle:true, platform:'node', format:'esm' });
const { PRODUCTS, photoNameKey, photoBrandKey, productPhotoForm } = await import('../supabase/.temp/brand-manifest-runtime.mjs?update=' + Date.now());
const changes = await read('docs/image-audit-2026-10-29/brand-corrections.json');
const overrides = await read('src/data/retailImageOverrides.json');
const representatives = await read('src/data/retailRepresentativeImages.json');
const captions = {};
for (const [original, entry] of Object.entries(changes)) {
  const products = PRODUCTS.filter(p => p.image_url === original);
  if (!products.length) throw new Error('Unreferenced correction: ' + original);
  if (products.some(p => photoBrandKey(p.brand) !== photoBrandKey(entry.brand))) throw new Error('Cross-brand correction: ' + original);
  await fs.access('public' + entry.image);
  overrides[original] = entry.image;
  if (entry.kind === 'exact-model') delete representatives[original];
  else {
    representatives[original] = entry.image;
    captions[original] = entry.kind === 'manufacturer-illustration' ? 'Manufacturer illustration' : 'Related ' + entry.brand.replace(' Energy','') + ' model shown';
    if (/exact floodlight/.test(entry.reason)) captions[original] = 'Related Bread street light shown';
  }
}
// Reuse this product's assigned image on error. A named brand can only fall back
// to its own hardware family; unknown solar brands receive no substitute.
const names = {}, brands = {}, exactNames = [], reviewedNames = {};
for (const p of PRODUCTS) {
  const image = overrides[p.image_url] || p.image_url;
  if (!image || image.includes('photo-pending')) throw new Error('Missing catalogue photo: ' + p.name);
  names[photoNameKey(p.name)] = image;
  if (changes[p.image_url]) reviewedNames[photoNameKey(p.name)] = {
    image, representative: Boolean(representatives[p.image_url]), caption: captions[p.image_url] || "",
  };
  if (!representatives[p.image_url]) exactNames.push(photoNameKey(p.name));
  const brand = photoBrandKey(p.brand), form = productPhotoForm(p.name, p.category);
  if (form && !/tuya|tioga/.test(brand)) {
    brands[brand] ||= {};
    if (!brands[brand][form] || changes[p.image_url]) brands[brand][form] = image;
  }
}
await Promise.all([
  write('src/data/retailImageOverrides.json', overrides),
  write('src/data/retailRepresentativeImages.json', representatives),
  write('src/data/retailPhotoCaptions.json', captions),
  write('src/data/retailBrandPhotoFallbacks.json', { names, brands, exactNames, reviewedNames }),
]);
console.log('Applied ' + Object.keys(changes).length + ' reviewed corrections; brand-preserving fallbacks for ' + Object.keys(names).length + ' catalogue names.');
