import { readFileSync } from "fs";

const sql = readFileSync("supabase/full_schema_migration.sql", "utf8");

function printTable(tableName) {
  const regex = new RegExp(`CREATE TABLE (?:IF NOT EXISTS )?public\\.${tableName}\\s*\\([\\s\\S]*?\\);`, "i");
  const m = sql.match(regex);
  if (m) console.log(`\n--- TABLE: public.${tableName} ---\n` + m[0]);
  else console.log(`\nTable ${tableName} not found`);
}

printTable("solar_packages");
printTable("careers");
printTable("warehouses");
