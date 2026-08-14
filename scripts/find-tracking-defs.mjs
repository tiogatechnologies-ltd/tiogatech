import { readFileSync } from "fs";

const sql = readFileSync("supabase/full_schema_migration.sql", "utf8");
const lines = sql.split("\n");

for (let i = 0; i < lines.length; i++) {
  if (
    lines[i].includes("CREATE TABLE IF NOT EXISTS public.product_clicks") ||
    lines[i].includes("CREATE TABLE IF NOT EXISTS public.page_views") ||
    lines[i].includes("CREATE TABLE IF NOT EXISTS public.conversions")
  ) {
    console.log(`Found around line ${i + 1}:`);
    console.log(lines.slice(i, i + 20).join("\n"));
    console.log("-----------------------------------------");
  }
}
