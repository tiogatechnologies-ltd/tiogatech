import { readFileSync, readdirSync } from "fs";
import { resolve } from "path";

const pagesDir = resolve("src/pages");
const files = readdirSync(pagesDir).filter((f) => f.startsWith("Admin") && f.endsWith(".tsx"));

console.log("Scanning Admin pages for Edge functions and RPCs...\n");

for (const file of files) {
  const content = readFileSync(resolve(pagesDir, file), "utf8");
  const funcMatches = Array.from(content.matchAll(/supabase\.functions\.invoke\(["']([^"']+)["']/g));
  const rpcMatches = Array.from(content.matchAll(/supabase\.rpc\(["']([^"']+)["']/g));

  if (funcMatches.length > 0 || rpcMatches.length > 0) {
    console.log(`📄 ${file}:`);
    funcMatches.forEach((m) => console.log(`   ⚡ Function: ${m[1]}`));
    rpcMatches.forEach((m) => console.log(`   ⚙️  RPC: ${m[1]}`));
  }
}
