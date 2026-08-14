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

console.log("Connecting to Supabase at:", url);

const supabase = createClient(url, key);

async function testLead() {
  const testLeadData = {
    full_name: "Test Storefront Customer",
    phone: "+2348123456789",
    email: "test.customer@tiogatechnologies.com",
    location: "Ikeja, Lagos",
    products: ["5kVA Solar Inverter", "Lithium Battery 10kWh"],
    has_electricity: "Grid available 6-8hrs/day",
    main_goal: "24/7 uninterrupted power for home appliances",
    appliances: ["Fridge", "TV", "Fans", "Inverter AC"],
    budget: "₦3,500,000 - ₦5,000,000",
    notes: "Automated test enquiry from storefront verification.",
    consent: true,
    source: "storefront_enquiry_test"
  };

  console.log("Submitting test lead to 'leads' table...");
  const { data, error } = await supabase.from("leads").insert([testLeadData]).select();

  if (error) {
    console.error("❌ Lead submission failed:", error.message);
    process.exit(1);
  }

  console.log("✅ Lead submitted successfully!");
  console.log("Inserted Lead ID:", data[0]?.id);
  console.log("Customer:", data[0]?.full_name, "(Phone:", data[0]?.phone + ")");

  // Verify we can read it or verify count
  const { count, error: countErr } = await supabase.from("leads").select("*", { count: "exact", head: true });
  if (!countErr) {
    console.log("Total leads in database:", count);
  }
}

testLead();
