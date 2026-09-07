import fs from 'fs';

const content = fs.readFileSync('./src/data/minisimProducts.ts', 'utf-8');
const names = [...content.matchAll(/"name": "([^"]+)"/g)].map(m => m[1]);
const categories = [...content.matchAll(/"category": "([^"]+)"/g)].map(m => m[1]);
const series = [...content.matchAll(/"series": "([^"]+)"/g)].map(m => m[1]);

console.log(`Loaded ${names.length} products.`);

const grouped = {};
for (let i = 0; i < names.length; i++) {
  const cat = categories[i];
  if (!grouped[cat]) grouped[cat] = [];
  grouped[cat].push({ name: names[i], series: series[i], index: i + 1 });
}

for (const [cat, items] of Object.entries(grouped)) {
  console.log(`\n=== [${cat}] (${items.length} items) ===`);
  const uniquePrefixes = new Set();
  items.forEach(it => {
    // get first 4 words
    const prefix = it.name.split(' ').slice(0, 4).join(' ');
    uniquePrefixes.add(prefix);
  });
  console.log(`Unique product patterns (${uniquePrefixes.size}):`);
  [...uniquePrefixes].slice(0, 15).forEach(p => console.log('  -', p));
}
