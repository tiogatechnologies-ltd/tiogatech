import fs from 'node:fs/promises';
import sharp from 'sharp';
import ts from 'typescript';
import { PRODUCTS, mergeProducts } from '../supabase/.temp/image-catalog.mjs';
const directory = 'docs/image-audit-2026-10-28';
const decisions = JSON.parse(await fs.readFile(`${directory}/image-decisions.json`, 'utf8'));
const overrides = JSON.parse(await fs.readFile('src/data/retailImageOverrides.json', 'utf8'));
const live = JSON.parse(await fs.readFile('supabase/.temp/image-audit-live-products.json', 'utf8'));
const pairs = JSON.parse(await fs.readFile('supabase/.temp/image-audit-near-duplicates.json', 'utf8'));
const nearCounts = {};
for (const pair of pairs) for (const rawFile of [pair.a, pair.b]) {
  const file = rawFile.replace(/^public(?=\/)/, '');
  nearCounts[file] = (nearCounts[file] || 0) + 1;
}
const csv = rows => rows.map(row => row.map(value => `"${String(value ?? '').replaceAll('"', '""')}"`).join(',')).join('\n') + '\n';
const metadata = new Map();
async function row(p) {
  const original = p.image_url || '';
  const image = overrides[original] || original || '/products/photo-pending.svg';
  const decision = decisions[original];
  if (!metadata.has(image)) metadata.set(image, await sharp(`public${image}`).metadata());
  const meta = metadata.get(image);
  const status = decision?.status || (original ? 'retained-source-not-established' : 'withheld-no-assigned-photo');
  return { id: p.id, name: p.name, sku: p.sku || '', brand: p.brand || '', original, image, status,
    width: meta.width, height: meta.height, source: decision?.source || '', sourcePage: decision?.sourcePage || '',
    nativeWidth: decision?.width || '', nativeHeight: decision?.height || '',
    note: decision?.reason || 'Visually screened in full catalogue contact sheets. Original source/model identity not independently established; no authenticity or HD certification.',
    quality: decision?.quality || (image.endsWith('.svg') ? 'explicit-pending-state' : 'original-resolution-unknown'),
    oldNearDuplicateCandidates: nearCounts[original] || 0 };
}
const fields = ['id','name','sku','brand','original','image','status','width','height','source','sourcePage','nativeWidth','nativeHeight','quality','oldNearDuplicateCandidates','note'];
const staticRows = [];
for (const p of PRODUCTS) staticRows.push(await row(p));
const effective = mergeProducts(PRODUCTS, live);
const rows = [];
for (const p of effective) rows.push(await row(p));
const heroFile = ts.createSourceFile('hero.tsx', await fs.readFile('src/components/retail/RetailHeroCarousel.tsx', 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const heroLiterals = [];
function walk(node) {
  if (ts.isObjectLiteralExpression(node)) {
    const get = name => node.properties.find(p => ts.isPropertyAssignment(p) && p.name.getText(heroFile) === name)?.initializer;
    const image = get('image_url');
    const name = get('headline');
    const id = get('id');
    if (image && name && id && ts.isStringLiteral(image) && ts.isStringLiteral(name) && ts.isStringLiteral(id)) heroLiterals.push({ id: id.text, name: name.text, image_url: image.text });
  }
  ts.forEachChild(node, walk);
}
walk(heroFile);
const configured = JSON.parse(await fs.readFile('supabase/.temp/retail-live-hero.json', 'utf8'))[0]?.content.slides || [];
const heroProducts = configured.filter(x => x.is_active).map(x => ({ id: x.id, name: x.headline, image_url: x.image_url }));
for (const hero of heroLiterals.filter(x => x.id.startsWith('ecoflow-') || x.id === 'srne-20kw-commercial')) if (!heroProducts.some(x => x.id === hero.id)) heroProducts.push(hero);
const heroRows = [];
for (const hero of heroProducts) heroRows.push(await row(hero));
await fs.writeFile(`${directory}/retail-promo-images.csv`, csv([fields, ...heroRows.map(row => fields.map(field => row[field]))]));
for (const [name, list] of [['catalogue-all-1097.csv', staticRows], ['retail-live.csv', rows], ['source-verification-outstanding.csv', rows.filter(x => x.status !== 'source-matched')]]) {
  await fs.writeFile(`${directory}/${name}`, csv([fields, ...list.map(row => fields.map(field => row[field]))]));
}
await fs.writeFile(`${directory}/near-duplicate-candidates-before.csv`, csv([['imageA','imageB','fullDistance','centerDistance'], ...pairs.map(x => [x.a,x.b,x.fullDistance,x.centerDistance])]));
const count = list => list.reduce((total, x) => (total[x.status] = (total[x.status] || 0) + 1, total), {});
const usedPhotos = rows.filter(x => x.status === 'source-matched');
const byPhoto = new Map();
for (const row of usedPhotos) byPhoto.set(row.image, [...byPhoto.get(row.image) || [], row]);
const shared = [...byPhoto.entries()].filter(([, list]) => list.length > 1);
await fs.writeFile(`${directory}/supplier-shared-photos.csv`, csv([['image','products','sourcePages'], ...shared.map(([image,list]) => [image,list.map(x=>x.name).join(' | '), [...new Set(list.map(x=>x.sourcePage))].join(' | ')])]));
const summary = { date: '2026-10-28', staticProducts: PRODUCTS.length, databaseRows: live.length, effectiveProducts: rows.length, staticStatus: count(staticRows), liveStatus: count(rows), promotionalImages: heroRows.length, promotionalImageStatus: count(heroRows), beforeNearDuplicateCandidates: pairs.length, supplierSharedPhotoGroups: shared.length, sourceMatchedNative1000Plus: usedPhotos.filter(x => Math.max(x.nativeWidth, x.nativeHeight) >= 1000).length };
await fs.writeFile(`${directory}/summary.json`, JSON.stringify(summary, null, 2) + '\n');
console.log(JSON.stringify(summary, null, 2));
