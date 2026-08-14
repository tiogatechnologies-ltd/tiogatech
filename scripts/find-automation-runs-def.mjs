import { readFileSync } from "fs";

const sql = readFileSync("supabase/full_schema_migration.sql", "utf8");
const lines = sql.split("\n");

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes("automation_runs") && lines[i].includes("CREATE TABLE")) {
    console.log(`Found automation_runs around line ${i + 1}:`);
    console.log(lines.slice(i, i + 25).join("\n"));
    console.log("-----------------------------------------");
  }
}
