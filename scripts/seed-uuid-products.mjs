import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import fs from "fs";
import path from "path";

const envContent = fs.readFileSync(path.resolve(".env"), "utf-8");
const env = {};
envContent.split("\n").forEach((line) => {
  const [k, ...v] = line.split("=");
  if (k && v.length) env[k.trim()] = v.join("=").trim().replace(/^["']|["']$/g, "");
});

const SUPABASE_URL = env.VITE_SUPABASE_URL;
const SUPABASE_KEY = env.VITE_SUPABASE_PUBLISHABLE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Helper to make deterministic UUID from slug
function stringToUuid(str) {
  const hash = crypto.createHash("md5").update(str).digest("hex");
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-4${hash.slice(13, 16)}-a${hash.slice(17, 20)}-${hash.slice(20, 32)}`;
}

import { ALL_RETAIL_PRODUCTS } from "./seed-all-products-to-database.mjs";

async function runSeed() {
  console.log("Upserting with valid UUIDs...");
  for (const p of ALL_RETAIL_PRODUCTS) {
    const uuid = stringToUuid(p.id);
    const { data, error } = await supabase
      .from("products")
      .upsert({
        id: uuid,
        name: p.name,
        category: p.category,
        series: p.series,
        description: p.description,
        features: p.features,
        best_for: p.best_for,
        price: p.price,
        tier: p.tier,
        is_active: p.is_active,
        sort_order: p.sort_order,
        image_url: p.image_url,
        specifications: p.specifications,
        stock_qty: p.stock_qty,
        low_stock_threshold: p.low_stock_threshold,
        warranty_months: p.warranty_months,
        tags: p.tags,
        updated_at: new Date().toISOString(),
      }, { onConflict: "id" })
      .select();

    if (error) {
      console.error(`❌ Error on ${p.name}:`, error.message);
    } else {
      console.log(`✅ [${p.category}] ${p.name} (UUID: ${uuid})`);
    }
  }
}

runSeed();
