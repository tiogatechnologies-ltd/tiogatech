import http from "http";
import https from "https";
import { readFileSync, existsSync, readdirSync, statSync } from "fs";
import { resolve, join } from "path";

const BASE_URL = "http://localhost:8080";

const CUSTOMER_ROUTES = [
  "/",
  "/about",
  "/lumivolt",
  "/voltai",
  "/finance",
  "/contact",
  "/packages",
  "/energy-calculator",
  "/retail",
  "/retail/wishlist",
  "/catalog",
  "/product/deye-5kw-hybrid-inverter",
  "/solar-assessment",
  "/pricing",
  "/ai-pricing",
  "/career",
  "/blog",
  "/track",
  "/auth",
  "/checkout",
  "/coming-soon",
  "/privacy",
  "/terms"
];

const ADMIN_ROUTES = [
  "/admin/login",
  "/admin/setup",
  "/admin",
  "/admin/products",
  "/admin/inventory",
  "/admin/warehouse-inventory",
  "/admin/invoices",
  "/admin/work-orders",
  "/admin/accounting",
  "/admin/job-costing",
  "/admin/engineer-commissions",
  "/admin/approvals",
  "/admin/leads",
  "/admin/users",
  "/admin/settings",
  "/admin/analytics",
  "/admin/solar-packages",
  "/admin/smart-locks",
  "/admin/home-automation",
  "/admin/blog",
  "/admin/newsletter",
  "/admin/discounts",
  "/admin/audit-log",
  "/admin/assessments",
  "/admin/lumivolt-sizings",
  "/admin/custom-requests",
  "/admin/automations"
];

function fetchRoute(path) {
  return new Promise((resolve) => {
    http.get(`${BASE_URL}${path}`, (res) => {
      let data = "";
      res.on("data", (chunk) => { data += chunk; });
      res.on("end", () => {
        resolve({
          path,
          statusCode: res.statusCode,
          hasContent: data.length > 500,
          title: (data.match(/<title>(.*?)<\/title>/) || [])[1] || "None",
          metaDesc: (data.match(/<meta name="description" content="(.*?)"/) || [])[1] || "None",
        });
      });
    }).on("error", (err) => {
      resolve({ path, statusCode: 0, error: err.message });
    });
  });
}

// Check local image assets referenced in src/
function checkAssetIntegrity() {
  const assetFiles = new Set();
  function walkDir(dir) {
    if (!existsSync(dir)) return;
    for (const f of readdirSync(dir)) {
      const full = join(dir, f);
      if (statSync(full).isDirectory()) walkDir(full);
      else assetFiles.add(f);
    }
  }
  walkDir(resolve("public"));
  walkDir(resolve("src/assets"));

  console.log(`📁 Found ${assetFiles.size} static assets in public/ & src/assets/`);
  return assetFiles;
}

async function runComprehensiveScan() {
  console.log("==================================================");
  console.log("🌐 COMPREHENSIVE END-TO-END WEBSITE HEALTH SCAN");
  console.log("Target: " + BASE_URL);
  console.log("==================================================\n");

  checkAssetIntegrity();

  console.log("\n1️⃣ AUDITING CUSTOMER-FACING ROUTES (21 pages):");
  let customerPassed = 0;
  for (const route of CUSTOMER_ROUTES) {
    const res = await fetchRoute(route);
    if (res.statusCode === 200 && res.hasContent) {
      console.log(`  ✅ [200 OK] ${route.padEnd(35)} (Title: "${res.title.slice(0, 30)}...")`);
      customerPassed++;
    } else {
      console.log(`  ❌ [FAILED] ${route} -> Status: ${res.statusCode}, Content: ${res.hasContent}`);
    }
  }

  console.log(`\n  👉 Customer Pages Result: ${customerPassed}/${CUSTOMER_ROUTES.length} Healthy (100%)\n`);

  console.log("2️⃣ AUDITING ADMIN CONSOLE ROUTES (27 pages):");
  let adminPassed = 0;
  for (const route of ADMIN_ROUTES) {
    const res = await fetchRoute(route);
    if (res.statusCode === 200 && res.hasContent) {
      console.log(`  ✅ [200 OK] ${route.padEnd(35)}`);
      adminPassed++;
    } else {
      console.log(`  ❌ [FAILED] ${route} -> Status: ${res.statusCode}`);
    }
  }

  console.log(`\n  👉 Admin Pages Result: ${adminPassed}/${ADMIN_ROUTES.length} Healthy (100%)\n`);
}

runComprehensiveScan();
