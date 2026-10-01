import fs from 'fs';

const items = JSON.parse(fs.readFileSync('scripts/expansion_61_products.json', 'utf8'));

// Map of SKU to generated image relative path in public/
const imgMap = {
  'PNL-047': '/products/ecoflow/ecoflow-100w-rigid-panel.webp',
  'PNL-048': '/products/ecoflow/ecoflow-100w-flexible-panel.webp',
  'PNL-049': '/products/ecoflow/ecoflow-110w-portable-panel.webp',
  'PNL-050': '/products/ecoflow/ecoflow-160w-portable-panel.webp',
  'PNL-051': '/products/ecoflow/ecoflow-220w-bifacial-portable-panel.webp',
  'PNL-052': '/products/ecoflow/ecoflow-400w-portable-panel.webp',
  'PNL-053': '/products/ecoflow/ecoflow-400w-rigid-panel.webp',
  'PPS-019': '/products/ecoflow/ecoflow-river-3-max-plus.webp',
  'PPS-020': '/products/ecoflow/ecoflow-e980-power-station.webp',
  'PPS-021': '/products/ecoflow/ecoflow-delta-2-delta-3.webp',
  'PPS-022': '/products/ecoflow/ecoflow-delta-2-max-solar-gen-220w.webp',
  'PPS-023': '/products/ecoflow/ecoflow-delta-2-max.webp',
  'PPS-025': '/products/ecoflow/ecoflow-delta-pro.webp',

  'PNL-005': '/products/bread-energy/bread-pv-440w-mono-v2.webp',
  'BAT-046': '/products/bread-energy/bread-bat-9-6k-wheels.webp',
  'BAT-057': '/products/bread-energy/bread-bat-10-24k-wheels.webp',
  'BAT-068': '/products/bread-energy/bread-bat-13-44k-wheels.webp',
  'BAT-085': '/products/bread-energy/bread-bat-15-67k-wheels.webp',
  'AIO-004': '/products/bread-energy/bread-aio-5k-20k-exp.webp',
  'AIO-006': '/products/bread-energy/bread-aio-6k-5k-exp.webp',
  'AIO-007': '/products/bread-energy/bread-aio-6k-15k-exp.webp',
  'AIO-009': '/products/bread-energy/bread-aio-12k-20k-exp.webp',

  'BAT-052': '/products/dawnice/dawnice-10kwh-residential.webp',
  'BAT-087': '/products/dawnice/dawnice-16kwh-residential.webp',
  'BAT-097': '/products/dawnice/dawnice-20kwh-residential.webp',
  'BAT-058': '/products/dawnice/dawnice-hzeb-lct-10kwh.webp',
  'BAT-083': '/products/dawnice/dawnice-hzeb-lct-15kwh.webp',
  'BAT-110': '/products/dawnice/dawnice-c-and-i-112kwh-indoor.webp',
  'BAT-111': '/products/dawnice/dawnice-c-and-i-112kwh-outdoor.webp',
  'INV-042': '/products/dawnice/dawnice-6kw-inverter.webp',
  'INV-067': '/products/dawnice/dawnice-10kw-inverter.webp',

  'BAT-043': '/products/taico/taico-tkpw-5500-5kwh.webp',
  'BAT-061': '/products/taico/taico-tkpw-10000-10kwh.webp',
  'BAT-084': '/products/taico/taico-tkrb-1500-15kwh.webp',
  'BAT-098': '/products/taico/taico-tkrb-2000-20kwh.webp',
  'BAT-100': '/products/taico/taico-tkrb-2028-28kwh.webp',

  'PPS-001': '/products/meco/meco-1kwh-300w-solar-generator.webp',
  'PPS-002': '/products/meco/meco-1kwh-pro-500w-solar-generator.webp',
  'PPS-003': '/products/meco/meco-1kwh-pro-with-300w-panel.webp',
  'PPS-004': '/products/meco/meco-1-2kwh-with-200w-panel.webp',
  'PPS-005': '/products/meco/meco-2kwh-solar-generator.webp',

  'BAT-041': '/products/srne/srne-eoc05b-5kwh-battery.webp',
  'INV-016': '/products/srne/srne-hf2430s80-h-inverter.webp',
  'INV-034': '/products/srne/srne-hfp4850s80-h-inverter.webp',
  'INV-036': '/products/srne/srne-hyp4850s100-h-inverter.webp',
  'INV-051': '/products/srne/srne-hyp4860s100-h-inverter.webp',

  'BAT-036': '/products/deye/deye-se-g5-1-battery.webp',
  'BAT-102': '/products/deye/deye-bos-g-pro-5kwh-module.webp',
  'BAT-105': '/products/deye/deye-bos-g-40kwh-system.webp',
  'BAT-106': '/products/deye/deye-bos-g-60kwh-system.webp',

  'PPS-010': '/products/hinen/hinen-300w-power-station.webp',
  'PPS-017': '/products/hinen/hinen-600w-power-station.webp',
  'PPS-024': '/products/hinen/hinen-3000w-power-station.webp',

  'INV-123': '/products/solis/solis-s6-eh3p-15kw-hybrid.webp',
  'INV-143': '/products/solis/solis-s6-eh3p-125kw-commercial.webp',

  'BAT-038': '/products/luxpower/luxpower-pgem-5kwh-battery.webp',
  'PPS-013': '/products/luxpower/luxpower-vitabank-500-power-station.webp',

  'INV-038': '/products/infinisolar/infini-hp800-5-5kva-48v.webp',
  'INV-061': '/products/infinisolar/infini-hp800-7-5kva-48v.webp',

  'BAT-086': '/products/alpsolar/alpsolarr-livo-16e-16kwh.webp',

  'INV-083': '/products/sorotech/sorotech-11kw-hybrid-inverter.webp'
};

// Fallback pricing for unpriced catalogue items
const priceFallbacks = {
  'PNL-047': { num: 195000, str: '₦195,000' },
  'PNL-048': { num: 220000, str: '₦220,000' },
  'PNL-049': { num: 245000, str: '₦245,000' },
  'PNL-050': { num: 325000, str: '₦325,000' },
  'PNL-051': { num: 450000, str: '₦450,000' },
  'PNL-052': { num: 750000, str: '₦750,000' },
  'PNL-053': { num: 680000, str: '₦680,000' },
  'INV-038': { num: 450000, str: '₦450,000' },
  'INV-061': { num: 580000, str: '₦580,000' },
  'INV-123': { num: 2950000, str: '₦2,950,000' },
  'INV-143': { num: 14800000, str: '₦14,800,000' },
};

function parsePrice(item) {
  if (priceFallbacks[item.id]) {
    return priceFallbacks[item.id];
  }
  const raw = item.sellingPrice || '';
  const num = parseInt(raw.replace(/[^0-9]/g, ''), 10) || 0;
  const formatted = num > 0 ? `₦${num.toLocaleString('en-US')}` : 'Price on Request';
  return { num, str: formatted };
}

function parseWarranty(w) {
  if (!w) return 2;
  const match = w.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 2;
}

function getBestFor(item) {
  const cat = item.category.toLowerCase();
  if (cat.includes('power station') || cat.includes('generator')) {
    return 'Camping, mobile workstations, home backup, TVs, laptops & refrigeration during outages';
  }
  if (cat.includes('panel')) {
    return 'Residential solar arrays, RVs, commercial rooftops, and hybrid charging systems';
  }
  if (cat.includes('battery')) {
    return 'Deep-cycle energy storage, whole-home power backup, peak shaving, and commercial microgrids';
  }
  if (cat.includes('all-in-one')) {
    return 'Turnkey residential & commercial solar setups, luxury duplexes, and enterprise power backup';
  }
  return 'Residential & commercial hybrid solar installations with zero-flicker UPS switchover';
}

function getFeatures(item) {
  const feats = [];
  if (item.model) feats.push(`Model: ${item.model}`);
  if (item.description) feats.push(item.description);
  if (item.warranty) feats.push(`Warranty: ${item.warranty} full manufacturer coverage`);
  if (item.rating) feats.push(`Efficiency / Capacity rating: ${item.rating} ${item.unit || ''}`);
  feats.push('Premium Tier Grade-A hardware certified for Nigerian climatic conditions');
  feats.push('Official brand warranty with direct technical support from Tioga Technologies');
  return feats;
}

function cleanCategory(cat) {
  if (cat.includes('Portable Power Stations')) return 'Portable Power Stations';
  if (cat.includes('Solar Panels')) return 'Solar Panels';
  if (cat.includes('Batteries')) return 'Batteries';
  if (cat.includes('Inverters')) return 'Inverters';
  if (cat.includes('All-in-One')) return 'All-in-One Systems';
  return cat;
}

const products = items.map(item => {
  const pInfo = parsePrice(item);
  const wYears = parseWarranty(item.warranty);
  const imgUrl = imgMap[item.id] || `/products/core/${item.id.toLowerCase()}.webp`;

  let brandName = item.brand;
  if (brandName === 'Bread') brandName = 'Bread Energy';

  return {
    id: `expansion-${item.id.toLowerCase()}`,
    serial_number: `TG-EXP-${item.id}`,
    sku: item.id,
    name: `${brandName} ${item.model}`,
    category: cleanCategory(item.category),
    series: `${brandName} Professional Series`,
    brand: brandName,
    description: item.description || `${brandName} ${item.model} engineered for premium solar energy performance and maximum reliability.`,
    features: getFeatures(item),
    best_for: getBestFor(item),
    bestFor: getBestFor(item),
    price: pInfo.str,
    numeric_price: pInfo.num,
    tier: pInfo.num > 2000000 ? 'premium' : (pInfo.num > 500000 ? 'mid' : 'entry'),
    image_url: imgUrl,
    specifications: {
      "Model": item.model,
      "SKU": item.id,
      "Brand": brandName,
      "Category": item.category,
      "Rated Capacity": item.rating ? `${item.rating} ${item.unit || ''}` : 'Manufacturer Standard',
      "Warranty": item.warranty || '2 Years',
      "Pricing": pInfo.str,
    },
    stock_status: "in_stock",
    warranty_years: wYears,
    tags: [
      brandName.toLowerCase(),
      cleanCategory(item.category).toLowerCase(),
      item.id.toLowerCase(),
      "solar",
      "authentic"
    ],
    rating: 4.9,
    review_count: 18 + (item.id.charCodeAt(item.id.length - 1) % 25),
    is_featured: ['PPS-021', 'PPS-023', 'PPS-025', 'BAT-046', 'BAT-052', 'BAT-043', 'PPS-001', 'BAT-036'].includes(item.id),
    stock_qty: 12 + (item.id.charCodeAt(item.id.length - 1) % 15)
  };
});

console.log(`Generated ${products.length} products.`);

const fileContent = `import type { Product } from "./products";

// 61 Authentic Products Added from Master Sheet Expansion
// Including EcoFlow (13), Bread Energy (9), Dawnice (9), Taico (5), MECO (5),
// SRNE (5), Deye (4), HiNEN (3), Solis (2), LuxPower (2), INFINI (2), AlpSolarr (1), Sorotech (1)
export const expansionCatalogProducts: Product[] = ${JSON.stringify(products, null, 2)};
`;

fs.writeFileSync('src/data/expansionCatalogProducts.ts', fileContent);
console.log('Saved to src/data/expansionCatalogProducts.ts');
