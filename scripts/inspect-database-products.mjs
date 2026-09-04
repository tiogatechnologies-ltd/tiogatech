import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

// Simple env file parser
const envContent = fs.readFileSync(path.resolve(".env"), "utf-8");
const env = {};
envContent.split("\n").forEach((line) => {
  const [k, ...v] = line.split("=");
  if (k && v.length) env[k.trim()] = v.join("=").trim().replace(/^["']|["']$/g, "");
});

const SUPABASE_URL = env.VITE_SUPABASE_URL || "https://xwxskzwceghftlcsbyyh.supabase.co";
const SUPABASE_KEY = env.VITE_SUPABASE_PUBLISHABLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function inspect() {
  console.log("==========================================");
  console.log("🔍 INSPECTING SUPABASE DATABASE CATALOG");
  console.log("==========================================");
  
  const { data: products, error: pErr } = await supabase.from("products").select("*");
  console.log(`\n📦 'products' table count: ${products?.length || 0}`);
  if (pErr) console.error("Error in products:", pErr);
  if (products && products.length > 0) {
    products.forEach((p) => console.log(`  - [${p.category}] ${p.name} | Price: ${p.price} | Image: ${p.image_url ? "YES" : "NO"}`));
  }

  const { data: solarPackages, error: spErr } = await supabase.from("solar_packages").select("*");
  console.log(`\n⚡ 'solar_packages' table count: ${solarPackages?.length || 0}`);
  if (spErr) console.error("Error in solar_packages:", spErr);
  if (solarPackages && solarPackages.length > 0) {
    solarPackages.forEach((p) => console.log(`  - [${p.category || 'Solar'}] ${p.name} | ₦${p.price_naira}`));
  }

  const { data: smartLocks, error: slErr } = await supabase.from("smart_locks").select("*");
  console.log(`\n🔐 'smart_locks' table count: ${smartLocks?.length || 0}`);
  if (slErr) console.error("Error in smart_locks:", slErr);
  if (smartLocks && smartLocks.length > 0) {
    smartLocks.forEach((p) => console.log(`  - ${p.name} (${p.model_code}) | ₦${p.price_naira || p.price}`));
  }

  const { data: homeAuto, error: haErr } = await supabase.from("home_automation_products").select("*");
  console.log(`\n🏠 'home_automation_products' table count: ${homeAuto?.length || 0}`);
  if (haErr) console.error("Error in home_automation:", haErr);
  if (homeAuto && homeAuto.length > 0) {
    homeAuto.forEach((p) => console.log(`  - ${p.name} | ₦${p.price_naira || p.price}`));
  }
}

inspect();
