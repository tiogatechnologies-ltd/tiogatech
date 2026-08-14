import { readFileSync } from "fs";

const sql = readFileSync("supabase/full_schema_migration.sql", "utf8");
const lines = sql.split("\n");

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes("solar_assessments") && lines[i].includes("CREATE TABLE")) {
    console.log(`Found solar_assessments around line ${i + 1}:`);
    console.log(lines.slice(i, i + 30).join("\n"));
    console.log("-----------------------------------------");
  }
  if (lines[i].includes("lumivolt_sizings") && lines[i].includes("CREATE TABLE")) {
    console.log(`Found lumivolt_sizings around line ${i + 1}:`);
    console.log(lines.slice(i, i + 30).join("\n"));
    console.log("-----------------------------------------");
  }
}
