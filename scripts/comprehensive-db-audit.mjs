import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

function readEnv() {
  const env = { ...process.env };
  const envPath = resolve(".env");
  if (existsSync(envPath)) {
    for (const line of readFileSync(envPath, "utf8").split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !env[m[1]]) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  }
  return env;
}

const env = readEnv();
const url = env.VITE_SUPABASE_URL || env.SUPABASE_URL;
const key = env.VITE_SUPABASE_PUBLISHABLE_KEY || env.SUPABASE_PUBLISHABLE_KEY;
const supabase = createClient(url, key);

async function runAudit() {
  console.log("==================================================");
  console.log("🔍 COMPREHENSIVE SUPABASE DATABASE & PLATFORM AUDIT");
  console.log(`Target: ${url}`);
  console.log("==================================================\n");

  const tables = [
    "profiles",
    "user_roles",
    "custom_roles",
    "leads",
    "orders",
    "order_items",
    "products",
    "solar_packages",
    "solar_assessments",
    "lumivolt_sizings",
    "custom_solution_requests",
    "quotes",
    "automation_settings",
    "automation_runs",
    "page_views",
    "product_clicks",
    "conversions",
    "support_tickets",
    "warranty_claims",
    "warehouses",
    "inventory_items",
    "serial_numbers",
    "invoices",
    "work_orders",
    "chart_of_accounts",
    "journal_entries",
    "job_costing_records",
    "engineer_commissions",
    "engineer_certifications",
    "approval_requests",
    "affiliates",
    "affiliate_payouts",
    "blog_posts",
    "newsletter_subscribers",
    "careers",
    "career_applications",
    "site_settings",
    "audit_log",
    "discounts"
  ];

  const tableSummary = [];

  for (const t of tables) {
    try {
      const { data, count, error } = await supabase.from(t).select("*", { count: "exact" }).limit(5);
      if (error) {
        tableSummary.push({ table: t, count: "ERROR", error: error.message, sample: [] });
      } else {
        tableSummary.push({ table: t, count: count ?? 0, sample: data ?? [] });
      }
    } catch (e) {
      tableSummary.push({ table: t, count: "EXCEPTION", error: e.message, sample: [] });
    }
  }

  console.log("📊 LIVE ROW COUNTS ACROSS ALL KEY TABLES:\n");
  for (const s of tableSummary) {
    const status = s.count === "ERROR" ? `❌ ${s.error}` : `${s.count} rows`;
    console.log(`  • ${s.table.padEnd(28)}: ${status}`);
  }

  console.log("\n==================================================");
  console.log("🔍 DETAILED INSPECTION OF POTENTIAL ISSUE AREAS");
  console.log("==================================================");

  // 1. Check Leads
  const leads = tableSummary.find((s) => s.table === "leads")?.sample || [];
  console.log(`\n📬 Leads Sample (${leads.length}):`);
  leads.forEach((l) => console.log(`   - ${l.full_name} | ${l.email || "No email"} | ${l.phone} | ${l.location}`));

  // 2. Check Page Views / Analytics
  const pvs = tableSummary.find((s) => s.table === "page_views")?.count;
  console.log(`\n📈 Page Views Count: ${pvs}`);

  // 3. Check Automations
  const autoSettings = tableSummary.find((s) => s.table === "automation_settings")?.sample || [];
  console.log(`\n⚡ Automation Settings (${autoSettings.length}):`);
  autoSettings.forEach((a) => console.log(`   - [${a.enabled ? "ENABLED" : "DISABLED"}] ${a.key}: ${a.label}`));

  // 4. Check Assessments
  const assess = tableSummary.find((s) => s.table === "solar_assessments")?.sample || [];
  console.log(`\n☀️ Solar Assessments (${assess.length}):`);
  assess.forEach((a) => console.log(`   - ${a.full_name || a.name || a.id} | ${a.phone || a.email || "No contact"}`));
}

runAudit();
