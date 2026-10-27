import { chromium, expect } from '@playwright/test';
const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:8080';
const battery = (id, energy, voltage, ah, price, quantity, brand = 'Facet Test') => ({
  id, name: `${brand} ${energy}kWh ${voltage}V Battery ${id}`, category: 'Batteries', brand, description: 'Filter regression fixture',
  features: [], price: `₦${price.toLocaleString('en-NG')}`, numeric_price: price, stock_qty: quantity,
  specifications: { 'Nominal Energy': `${energy}kWh`, 'Voltage / Capacity': `${voltage}V / ${ah}Ah`, Chemistry: 'LiFePO4' },
});
const fixtures = [
  battery('filter-test-a',5.12,51.2,100,1000000,10),
  battery('filter-test-b',5,24,200,700000,10),
  battery('filter-test-c',15,51.2,300,3000000,0),
  battery('filter-test-d',5.12,48,100,800000,10,'Facet Other'),
];
const browser = await chromium.launch({ headless: true, ...(process.env.TEST_BROWSER_CHANNEL ? { channel: process.env.TEST_BROWSER_CHANNEL } : {}) });
try {
  const page = await browser.newPage({ reducedMotion: 'reduce', viewport: { width: 1440, height: 1000 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  // No remote writes: catalog/settings/auth/analytics are all isolated fixtures.
  await page.route('**/*', route => {
    const url = new URL(route.request().url());
    if (url.origin === base || ['data:', 'blob:'].includes(url.protocol)) return route.continue();
    if (!url.hostname.endsWith('.supabase.co')) return route.abort();
    return route.fulfill({ json: url.pathname.endsWith('/rest/v1/products') ? fixtures : [] });
  });
  const results = page.getByTestId('retail-results-count');
  await page.goto(`${base}/retail?category=Batteries&brand=Facet+Test`);
  await expect(results).toHaveText('3 products');
  const sidebar = page.getByRole('region', { name: 'Product filters' });
  await expect(sidebar.getByRole('button', { name: 'Battery / system voltage filters', exact: true })).toHaveAttribute('aria-expanded', 'false');
  await expect(sidebar.getByRole('checkbox', { name: 'Filter by battery / system voltage: 48V / 51.2V', exact: true })).toHaveCount(0);
  await sidebar.getByRole('button', { name: 'Battery / system voltage filters', exact: true }).press('Enter');
  await sidebar.getByRole('checkbox', { name: 'Filter by battery / system voltage: 48V / 51.2V', exact: true }).check();
  await expect(results).toHaveText('2 products');
  await sidebar.getByRole('button', { name: 'Battery capacity filters', exact: true }).press('Enter');
  await sidebar.getByRole('checkbox', { name: 'Filter by battery capacity: 5.12kWh', exact: true }).check();
  await expect(results).toHaveText('1 product');
  await expect(page.getByTestId('retail-product-grid')).toContainText('filter-test-a');
  await expect(sidebar.getByRole('button', { name: 'Battery / system voltage filters', exact: true })).toHaveAttribute('aria-expanded', 'true');
  await sidebar.getByRole('button', { name: 'Battery / system voltage filters', exact: true }).press('Enter');
  await expect(sidebar.getByRole('button', { name: 'Battery / system voltage filters', exact: true })).toContainText('48V / 51.2V');
  await expect(results).toHaveText('1 product');
  await sidebar.getByRole('checkbox', { name: 'Filter by battery capacity: 15kWh', exact: true }).check();
  await expect(results).toHaveText('2 products');
  await expect(page.getByTestId('retail-product-grid').getByText('Out of stock', { exact: true })).toBeVisible();
  await sidebar.getByRole('button', { name: 'Price range filters', exact: true }).press('Enter');
  await sidebar.getByRole('spinbutton', { name: 'Maximum price (₦)' }).fill('1500000');
  await expect(results).toHaveText('1 product');
  await page.getByRole('button', { name: 'Remove maximum price filter' }).click();
  await expect(results).toHaveText('2 products');
  await sidebar.getByRole('button', { name: 'Availability filters', exact: true }).press('Enter');
  await sidebar.getByRole('checkbox', { name: 'In stock only', exact: true }).check();
  await expect(results).toHaveText('1 product');
  await page.reload();
  await expect(results).toHaveText('1 product');
  await sidebar.getByRole('button', { name: 'Availability filters', exact: true }).press('Enter');
  await expect(sidebar.getByRole('checkbox', { name: 'In stock only', exact: true })).toBeChecked();
  await page.getByRole('button', { name: 'Remove Battery capacity filter: 15kWh', exact: true }).click();
  await sidebar.getByRole('button', { name: 'Brand filters', exact: true }).press('Enter');
  await sidebar.getByRole('checkbox', { name: 'Filter by brand: Facet Other', exact: true }).check();
  await expect(results).toHaveText('2 products');
  await page.goBack();
  await expect(results).toHaveText('1 product');
  await sidebar.getByRole('combobox', { name: 'Product category' }).selectOption('Inverters');
  await expect(sidebar.getByText('Rated output (kVA)', { exact: true })).toBeVisible();
  await expect(sidebar.getByText('Battery capacity (Ah)', { exact: true })).toHaveCount(0);
  await page.goto(`${base}/retail?category=Batteries&brand=Facet+Test`);
  await expect(results).toHaveText('3 products');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: 'Filters', exact: true }).click();
  const drawer = page.getByRole('dialog', { name: 'Filter Hardware' });
  await expect(drawer.getByRole('button', { name: 'Battery / system voltage filters', exact: true })).toHaveAttribute('aria-expanded', 'false');
  await drawer.getByRole('button', { name: 'Battery / system voltage filters', exact: true }).press('Enter');
  await drawer.getByRole('checkbox', { name: 'Filter by battery / system voltage: 24V / 25.6V', exact: true }).check();
  await drawer.getByRole('button', { name: 'Battery capacity filters', exact: true }).press('Enter');
  await drawer.getByRole('checkbox', { name: 'Filter by battery capacity: 5kWh', exact: true }).check();
  await drawer.getByRole('button', { name: 'Show 1 product', exact: true }).click();
  await expect(results).toHaveText('1 product');
  await expect(page.getByTestId('retail-product-grid')).toContainText('filter-test-b');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.getByRole('button', { name: /Clear filters/ }).click();
  expect(new URL(page.url()).searchParams.get('category')).toBe('Batteries');
  expect(new URL(page.url()).searchParams.has('energy')).toBe(false);
  expect(errors).toEqual([]);
  console.log('Retail collapsible filter groups, preserved selections, combined filters, exact capacities, price, availability, URL refresh/back, category switching, clear filters and mobile drawer passed.');
} finally {
  await browser.close();
}
