import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

const envContent = fs.readFileSync(path.resolve(".env"), "utf-8");
const env = {};
envContent.split("\n").forEach((line) => {
  const [k, ...v] = line.split("=");
  if (k && v.length) env[k.trim()] = v.join("=").trim().replace(/^["']|["']$/g, "");
});

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_PUBLISHABLE_KEY);

async function checkSchema() {
  const { data, error } = await supabase.from("products").select("*").limit(1);
  console.log("Products row schema:", data ? Object.keys(data[0] || {}) : error);
  if (data && data[0]) console.log("Sample row:", data[0]);
}

checkSchema();
