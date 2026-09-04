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

async function testAllCustomerEndpoints() {
  console.log("Checking solar_packages rows...");
  const { data: pkgs, error: pkgErr } = await supabase.from("solar_packages").select("*");
  console.log(`Solar Packages: ${pkgs?.length} rows | Error: ${pkgErr?.message || "none"}`);

  console.log("Checking blog_posts rows...");
  const { data: blogs, error: blogErr } = await supabase.from("blog_posts").select("*");
  console.log(`Blog Posts: ${blogs?.length} rows | Error: ${blogErr?.message || "none"}`);

  console.log("Checking careers rows...");
  const { data: careers, error: carErr } = await supabase.from("careers").select("*");
  console.log(`Careers: ${careers?.length} rows | Error: ${carErr?.message || "none"}`);

  console.log("Checking site_settings rows...");
  const { data: settings, error: setErr } = await supabase.from("site_settings").select("*");
  console.log(`Site Settings: ${settings?.length} rows | Error: ${setErr?.message || "none"}`);
}

testAllCustomerEndpoints();
