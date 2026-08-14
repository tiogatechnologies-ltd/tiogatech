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

async function checkWhy() {
  console.log("Checking solar_assessments insertion...");
  const res1 = await supabase.from("solar_assessments").select("*");
  console.log("solar_assessments select response:", res1);

  console.log("Checking lumivolt_sizings insertion...");
  const res2 = await supabase.from("lumivolt_sizings").select("*");
  console.log("lumivolt_sizings select response:", res2);

  console.log("Checking page_views insertion...");
  const res3 = await supabase.from("page_views").select("*");
  console.log("page_views select response:", res3);
}

checkWhy();
