import { chromium, expect } from "@playwright/test";
const base = process.env.TEST_BASE_URL || "http://127.0.0.1:8080";
const browser = await chromium.launch({ channel: "msedge", headless: true });
const page = await browser.newPage({ reducedMotion: "reduce", viewport: { width: 1440, height: 1000 } });
try {
  await page.addInitScript(() => {
    localStorage.setItem("tioga_cart_v1", JSON.stringify([{ id:"product:a0000000-0000-0000-0000-000000000091", refId:"a0000000-0000-0000-0000-000000000091", type:"product", name:"SRNE 2.56kWh 24V 100Ah LiFePO4 Lithium Battery (EOS02B-24)", price:"₦756,000", numericPrice:756000, quantity:2 }]));
  });
  await page.goto(`${base}/retail?q=Pulse%20S3`, { waitUntil: "domcontentloaded" });
  const grid = page.getByTestId("retail-product-grid");
  await expect(grid.getByText("₦754,000", { exact: true })).toBeVisible({ timeout: 30000 });
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("tioga_cart_v1"))[0]?.numericPrice)).toBe(548601.3);
  await grid.getByRole("link", { name: "AlpSolarr Pulse S3 6kW Eco-Hybrid Inverter", exact: true }).last().press("Enter");
  await expect(page.getByRole("heading", { name:"AlpSolarr Pulse S3 6kW Eco-Hybrid Inverter", exact:true, level:1 })).toBeVisible();
  await expect(page.getByText("₦754,000", { exact:true }).first()).toBeVisible();
  await page.getByRole("button", { name:"Add to Cart", exact:true }).press("Enter");
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("tioga_cart_v1")).find(p=>p.name.includes("Pulse S3"))?.numericPrice)).toBe(754000);
  await page.goto(`${base}/retail?q=EOS02B-24`, { waitUntil:"domcontentloaded" });
  await expect(grid.getByText("₦548,601.30", { exact:true })).toBeVisible({ timeout:30000 });
  await page.goto(`${base}/retail?q=EcoFlow%20100W%20Rigid`, { waitUntil:"domcontentloaded" });
  await expect(grid.getByText("Price on Request", { exact:true }).first()).toBeVisible({ timeout:30000 });
  await expect(grid.getByRole("button", { name:"Price on Request", exact:true, includeHidden:true }).first()).toBeDisabled();
  const details = grid.getByRole("link", { name:"EcoFlow EcoFlow 100W Rigid Solar Panel", exact:true }).last();
  await details.press("Enter");
  await expect(page.getByRole("button", { name:"Price on Request", exact:true })).toBeDisabled();
  await expect(page.getByRole("button", { name:"Instant Checkout", exact:true })).toBeDisabled();
  await page.goto(`${base}/retail?q=SUN-80K-SG02HP3`, { waitUntil:"domcontentloaded" });
  await expect(grid.getByText("Price on Request", { exact:true }).first()).toBeVisible({ timeout:30000 });
  await page.screenshot({ path:"supabase/.temp/price-audit-browser.png", fullPage:false });
  console.log("PASS: selling price on listing and detail; decimal price; restored cart; added cart; missing-price and conflicting-price quote flow.");
} finally { await browser.close(); }
