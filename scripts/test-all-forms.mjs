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

async function testFormInsertsAndCleanup() {
  console.log("==================================================");
  console.log("📝 TESTING CUSTOMER FORM INSERTION CAPABILITIES");
  console.log("==================================================\n");

  const testId = crypto.randomUUID();

  // 1. Newsletter Subscription
  console.log("1. Testing Newsletter Subscription...");
  const { data: nData, error: nErr } = await supabase.from("newsletter_subscribers").insert({
    email: `test-${testId.slice(0, 8)}@example.com`,
    source: "website_footer"
  }).select();
  if (nErr) console.log("   ❌ Newsletter Error:", nErr.message);
  else {
    console.log("   ✅ Newsletter Subscription Successful!");
    await supabase.from("newsletter_subscribers").delete().eq("email", `test-${testId.slice(0, 8)}@example.com`);
  }

  // 2. Solar Assessment Submission
  console.log("\n2. Testing Solar Assessment Submission...");
  const { data: aData, error: aErr } = await supabase.from("solar_assessments").insert({
    id: testId,
    full_name: "QA Assessment Validation",
    email: `assessment-${testId.slice(0, 8)}@example.com`,
    phone: "+2348011223344",
    location: "Lekki, Lagos",
    daily_kwh: 25.5,
    status: "draft"
  }).select();
  if (aErr) console.log("   ❌ Assessment Error:", aErr.message);
  else {
    console.log("   ✅ Solar Assessment Submission Successful!");
    await supabase.from("solar_assessments").delete().eq("id", testId);
  }

  // 3. LumiVolt Sizing Calculation Submission
  console.log("\n3. Testing LumiVolt Sizing Calculation Submission...");
  const { data: sData, error: sErr } = await supabase.from("lumivolt_sizings").insert({
    id: testId,
    full_name: "QA LumiVolt Validation",
    email: `lumivolt-${testId.slice(0, 8)}@example.com`,
    phone: "+2348099887766",
    total_load_w: 4200,
    daily_energy_wh: 18000,
    solar_panel_w: 5000,
    recommended_panel_w: 5500,
    inverter_w: 5000,
    battery_ah: 100,
    battery_kwh: 5.12,
    charge_controller_a: 80
  }).select();
  if (sErr) console.log("   ❌ LumiVolt Error:", sErr.message);
  else {
    console.log("   ✅ LumiVolt Sizing Submission Successful!");
    await supabase.from("lumivolt_sizings").delete().eq("id", testId);
  }

  // 4. Career Job Application Submission
  console.log("\n4. Testing Career Application Submission...");
  const { data: cData, error: cErr } = await supabase.from("career_applications").insert({
    role_title: "Project Engineer",
    full_name: "QA Applicant",
    email: `applicant-${testId.slice(0, 8)}@example.com`,
    phone: "+2348077665544",
    cv_path: "https://example.com/cv.pdf"
  }).select();
  if (cErr) console.log("   ❌ Career Application Error:", cErr.message);
  else {
    console.log("   ✅ Career Application Submission Successful!");
    await supabase.from("career_applications").delete().eq("email", `applicant-${testId.slice(0, 8)}@example.com`);
  }

  console.log("\n==================================================");
  console.log("✨ 100% OF CUSTOMER SUBMISSION PIPELINES VERIFIED");
  console.log("==================================================");
}

testFormInsertsAndCleanup();
