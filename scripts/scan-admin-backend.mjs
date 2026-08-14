import { createClient } from "@supabase/supabase-js";
import { readFileSync, readdirSync, existsSync } from "fs";
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

async function scan() {
  const pagesDir = resolve("src/pages");
  const files = readdirSync(pagesDir).filter((f) => f.startsWith("Admin") && f.endsWith(".tsx"));

  console.log(`🔍 Scanning ${files.length} Admin pages for backend database table dependencies...\n`);

  const tableSet = new Set();

  for (const file of files) {
    const content = readFileSync(resolve(pagesDir, file), "utf8");
    // match .from("table_name") or .from('table_name') or .from("table_name" as any)
    const matches = content.matchAll(/\.from\(\s*["']([^"']+)["']/g);
    for (const match of matches) {
      tableSet.add(match[1]);
    }
  }

  const allTables = Array.from(tableSet).sort();
  console.log(`Found ${allTables.length} distinct database tables queried across Admin frontend:\n`);

  const missingTables = [];
  const accessibleTables = [];

  for (const table of allTables) {
    try {
      const { error } = await supabase.from(table).select("*", { count: "exact", head: true });
      if (error) {
        missingTables.push({ table, error: error.message });
        console.log(`  ❌ [FAIL] Table '${table}' -> ${error.message}`);
      } else {
        accessibleTables.push(table);
        console.log(`  ✅ [PASS] Table '${table}' is active & accessible`);
      }
    } catch (err) {
      missingTables.push({ table, error: err.message });
      console.log(`  ❌ [FAIL] Table '${table}' -> ${err.message}`);
    }
  }

  console.log("\n==================================================");
  console.log(`📊 SCAN SUMMARY: ${accessibleTables.length} Accessible, ${missingTables.length} Missing / Inactive`);
  console.log("==================================================");

  if (missingTables.length > 0) {
    console.log("\n⚠️  TABLES NEEDING BACKEND PROVISIONING:");
    console.log(JSON.stringify(missingTables, null, 2));
  }
}

scan();
