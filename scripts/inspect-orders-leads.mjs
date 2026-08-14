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

async function inspectOrdersAndLeads() {
  console.log("--- ORDERS IN DATABASE ---");
  const { data: orders } = await supabase.from("orders").select("id, order_number, total, created_at, status");
  console.log("Orders count:", orders?.length);
  orders?.forEach(o => console.log(`   Order #${o.order_number || o.id.slice(0, 8)} | Total: ₦${o.total} | Status: ${o.status} | Date: ${o.created_at}`));

  console.log("\n--- LEADS IN DATABASE ---");
  const { data: leads } = await supabase.from("leads").select("id, full_name, email, phone, created_at");
  console.log("Leads count:", leads?.length);
  leads?.forEach(l => console.log(`   Lead: ${l.full_name} | Email: ${l.email} | Date: ${l.created_at}`));
}

inspectOrdersAndLeads();
