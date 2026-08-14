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

async function testInserts() {
  console.log("Testing individual table insertions directly...");

  // 1. Products
  const { error: pErr } = await supabase.from("products").upsert({
    id: "11111111-1111-1111-1111-111111111001",
    name: "Deye 5kW Hybrid Inverter (SUN-5K-SG03LP1-EU)",
    category: "solar",
    series: "Deye Inverters",
    description: "Pure sine wave low-voltage single-phase hybrid solar inverter",
    features: ["Dual MPPT", "Touch LCD"],
    best_for: "3-4 bedroom duplexes",
    price: "₦1,850,000",
    tier: "premium",
    is_active: true,
    sort_order: 1,
  });
  console.log("1. products:", pErr ? `❌ ${pErr.message}` : "✅ OK");

  // 2. Leads
  const { error: lErr } = await supabase.from("leads").upsert({
    id: "22222222-2222-2222-2222-222222222001",
    full_name: "Chief Olumide Adeleke",
    email: "olumide.adeleke@adelekegroup.ng",
    phone: "+234 802 314 8899",
    location: "Victoria Island, Lagos",
    products: ["10kVA Deye Solar System"],
    has_electricity: "Yes",
    main_goal: "24/7 power",
    appliances: ["4x ACs"],
    budget: "₦8,000,000 - ₦12,000,000",
    timeline: "Immediately",
    notes: "Site visit requested",
    consent: true,
  });
  console.log("2. leads:", lErr ? `❌ ${lErr.message}` : "✅ OK");

  // 3. Solar Assessments
  const { error: aErr } = await supabase.from("solar_assessments").upsert({
    id: "33333333-3333-3333-3333-333333333001",
    full_name: "Chief Olumide Adeleke",
    email: "olumide.adeleke@adelekegroup.ng",
    phone: "+234 802 314 8899",
    location: "Victoria Island, Lagos",
    building_type: "5-Bedroom Residential Duplex",
    daily_kwh: 34.5,
    peak_load_w: 9800,
    current_power_situation: "Unstable grid",
    monthly_bill_ngn: 380000,
    engineer_notes: "Site audit completed",
    status: "reviewed",
    is_full_unlocked: true,
  });
  console.log("3. solar_assessments:", aErr ? `❌ ${aErr.message}` : "✅ OK");

  // 4. LumiVolt Sizings
  const { error: sErr } = await supabase.from("lumivolt_sizings").upsert({
    id: "44444444-4444-4444-4444-444444444001",
    full_name: "Chief Olumide Adeleke",
    email: "olumide.adeleke@adelekegroup.ng",
    phone: "+234 802 314 8899",
    location: "Victoria Island, Lagos",
    total_load_w: 9800,
    daily_energy_wh: 34500,
    solar_panel_w: 9900,
    recommended_panel_w: 11000,
    inverter_w: 10000,
    battery_ah: 300,
    battery_kwh: 15.36,
    charge_controller_a: 100,
    notes: "High daytime load",
    source: "lumivolt_web",
  });
  console.log("4. lumivolt_sizings:", sErr ? `❌ ${sErr.message}` : "✅ OK");

  // 5. Automation Runs
  const { error: arErr } = await supabase.from("automation_runs").insert({
    rule_key: "welcome_lead_email",
    entity_type: "lead",
    entity_id: "22222222-2222-2222-2222-222222222001",
    recipient: "olumide.adeleke@adelekegroup.ng",
    status: "sent",
    detail: "Welcome email delivered",
  });
  console.log("5. automation_runs:", arErr ? `❌ ${arErr.message}` : "✅ OK");

  // 6. Page views
  const { error: pvErr } = await supabase.from("page_views").insert({
    session_id: "test_sess_001",
    page_path: "/",
    referrer: "https://www.google.com/",
    user_agent: "Mozilla/5.0 Chrome",
    landing_path: "/",
    is_new_session: true,
    utm_source: "google_search",
  });
  console.log("6. page_views:", pvErr ? `❌ ${pvErr.message}` : "✅ OK");
}

testInserts();
