// Run against a local Vite server. All remote requests are mocked or blocked;
// these checks never submit applications or payouts to the live database.
import { chromium, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:8080';
const env = readFileSync(new URL('../.env', import.meta.url), 'utf8');
const project = env.match(/VITE_SUPABASE_URL\s*=\s*["']?https:\/\/([^.]+)/)?.[1];
if (!project) throw new Error('Missing local Supabase URL');
const id = '00000000-0000-4000-8000-000000000001';
const affiliate = { id, full_name: 'Test Partner', email: 'partner@example.com', code: 'testpartner', commission_rate: 5, status: 'active', payout_details: 'Test account', created_at: '2026-01-01T12:00:00Z' };
const secondAffiliate = { ...affiliate, id: '00000000-0000-4000-8000-000000000002', full_name: 'Second Partner', code: 'second' };
let role = 'affiliate';
let careerFailure = false;
const browser = await chromium.launch({ headless: true, ...(process.env.TEST_BROWSER_CHANNEL ? { channel: process.env.TEST_BROWSER_CHANNEL } : {}) });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.route('**/*', async route => {
    const url = new URL(route.request().url());
    if (url.origin === base || url.protocol === 'data:' || url.protocol === 'blob:') return route.continue();
    if (!url.hostname.endsWith('.supabase.co')) return route.abort();
    let data = [];
    if (url.pathname.endsWith('/auth/v1/user')) data = { id, email: affiliate.email, email_confirmed_at: '2026-01-01T12:00:00Z' };
    else if (url.pathname.endsWith('/user_roles')) data = [{ role }];
    else if (url.pathname.endsWith('/profiles')) data = { id, full_name: affiliate.full_name, email: affiliate.email };
    else if (url.pathname.endsWith('/careers')) {
      if (careerFailure) return route.fulfill({ status: 500, json: { message: 'Test outage' } });
      data = [{ id, title: 'Test Engineer', location: 'Lagos', summary: 'Install solar systems.', highlights: [], requirements: '', email_subject: '', deadline: '' }];
    } else if (url.pathname.endsWith('/affiliates')) data = [affiliate, secondAffiliate];
    else if (url.pathname.endsWith('/rpc/calculate_affiliate_payout')) data = { leads: 2, revenue: 1000000, commission: 100000, available: 100000 };
    else if (url.pathname.endsWith('/functions/v1/affiliate-portal')) data = {
      affiliate, stats: { clicks: 2, unique_visitors: 2, leads: 1, orders: 1, conversions: 1, revenue: 100000, commission_earned: 10000, paid_out: 0, requested_pending: 0, available: 10000, conversion_rate: 50, close_rate: 100 },
      orders: [{ id, order_number: 'T-1', full_name: 'Customer A.', total: 100000, affiliate_commission_amount: 10000, payment_status: 'paid', created_at: '2026-10-01T12:00:00Z' }],
      links: [], leads: [], payouts: [], payout_requests: [], series: [], settings: { min_payout_ngn: 10000 },
    };
    return route.fulfill({ json: data });
  });
  const token = `${Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url')}.${Buffer.from(JSON.stringify({ sub: id, role: 'authenticated', exp: 4102444800 })).toString('base64url')}.test`;
  await page.addInitScript(({ project, token, id }) => localStorage.setItem(`sb-${project}-auth-token`, JSON.stringify({ access_token: token, refresh_token: 'test', expires_at: 4102444800, expires_in: 3600, token_type: 'bearer', user: { id, email: 'partner@example.com' } })), { project, token, id });
  await page.goto(`${base}/careers/jobs`);
  await expect(page.getByText('Test Engineer', { exact: true })).toBeVisible();
  await expect(page.getByText('Open until filled', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: /Quick Apply/ }).click();
  await expect(page.getByRole('dialog')).toContainText('Apply for Test Engineer');
  careerFailure = true;
  await page.goto(`${base}/career`);
  await expect(page.getByRole('alert').filter({ hasText: 'We could not load open roles' })).toBeVisible();
  await expect(page.getByText('Graphics Designer (Full-Time, Remote)', { exact: true })).toHaveCount(0);
  await page.goto(`${base}/affiliate`);
  await page.getByRole('tab', { name: 'Referrals', exact: true }).click();
  await expect(page.getByRole('row').filter({ hasText: 'T-1' })).toContainText('₦10,000');
  await page.getByRole('tab', { name: 'Marketing assets' }).click();
  await expect(page.getByRole('button', { name: 'Download flyer' })).toHaveCount(3);
  const downloaded = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download flyer' }).first().click();
  const download = await downloaded;
  expect(download.suggestedFilename()).toBe('tioga-solar-energy.svg');
  const stream = await download.createReadStream();
  let svg = '';
  for await (const chunk of stream) svg += chunk.toString();
  expect(svg).toContain('<svg');
  expect(svg).toContain('Affiliate link:');
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  role = 'admin';
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(`${base}/admin/affiliates/payouts`);
  await page.getByRole('button', { name: 'New payout', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('combobox').click();
  await page.getByRole('option').filter({ hasText: 'Test Partner' }).click();
  await dialog.getByRole('button', { name: 'Calculate from paid orders' }).click();
  const save = dialog.getByRole('button', { name: 'Create payout request' });
  await expect(save).toBeEnabled();
  await dialog.getByRole('combobox').click();
  await page.getByRole('option').filter({ hasText: 'Second Partner' }).click();
  await expect(save).toBeDisabled();
  await dialog.getByRole('button', { name: 'Calculate from paid orders' }).click();
  await expect(save).toBeEnabled();
  await dialog.locator('input[type=date]').first().fill('2026-01-01');
  await expect(save).toBeDisabled();
  expect(errors).toEqual([]);
  console.log('Career listings, outage state, application dialog, recorded commission, asset downloads, mobile layout and payout calculation invalidation passed.');
} finally {
  await browser.close();
}
