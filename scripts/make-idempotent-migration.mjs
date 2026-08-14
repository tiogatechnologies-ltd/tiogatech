import { readFileSync, writeFileSync, readdirSync } from "fs";
import { resolve } from "path";

const migrationsDir = resolve("supabase/migrations");
const files = readdirSync(migrationsDir).filter(f => f.endsWith(".sql")).sort();

let combinedSql = `-- Full Idempotent Schema Migration for Tioga Technologies
-- Project: xwxskzwceghftlcsbyyh
-- Generated automatically

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Grant schema usage to standard Supabase roles
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO anon, authenticated, service_role;

-- Pre-define all ENUM types with complete values upfront
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'user', 'staff', 'affiliate', 'customer', 'engineer');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.ai_plan AS ENUM ('free', 'starter', 'business');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.ai_sub_status AS ENUM ('active', 'expired', 'pending', 'revoked');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

`;

for (const file of files) {
  let content = readFileSync(resolve(migrationsDir, file), "utf8");
  combinedSql += `\n-- ==========================================\n`;
  combinedSql += `-- Migration: ${file}\n`;
  combinedSql += `-- ==========================================\n\n`;

  // Comment out realtime.messages operations (system-managed in Supabase Cloud)
  content = content.replace(
    /ALTER\s+TABLE\s+realtime\.messages[^;]*;/gi,
    "-- Skipped internal realtime.messages RLS"
  );
  content = content.replace(
    /DROP\s+POLICY\s+IF\s+EXISTS\s+"[^"]+"\s+ON\s+realtime\.messages;/gi,
    "-- Skipped internal realtime.messages policy drop"
  );
  content = content.replace(
    /CREATE\s+POLICY\s+"[^"]+"\s+ON\s+realtime\.messages[^;]*;/gi,
    "-- Skipped internal realtime.messages policy creation"
  );

  // Remove duplicate CREATE TYPE / ALTER TYPE for pre-declared enums
  content = content.replace(
    /CREATE\s+TYPE\s+public\.(app_role|ai_plan|ai_sub_status)\s+AS\s+ENUM\s*\([^)]+\);/gi,
    "-- Pre-declared public.$1 ENUM"
  );
  content = content.replace(
    /DO\s+\$\$\s*BEGIN\s+CREATE\s+TYPE\s+public\.(app_role|ai_plan|ai_sub_status)\s+AS\s+ENUM\s*\([^)]+\);\s*EXCEPTION\s+WHEN\s+duplicate_object\s+THEN\s+NULL;\s*END\s+\$\$;/gi,
    "-- Pre-declared public.$1 ENUM"
  );
  content = content.replace(
    /ALTER\s+TYPE\s+public\.app_role\s+ADD\s+VALUE\s+(?:IF\s+NOT\s+EXISTS\s+)?'([^']+)';/gi,
    "-- Pre-declared app_role value: $1"
  );

  // 1. CREATE TABLE -> CREATE TABLE IF NOT EXISTS
  content = content.replace(/CREATE\s+TABLE\s+(?!IF\s+NOT\s+EXISTS)/gi, "CREATE TABLE IF NOT EXISTS ");

  // 2. CREATE INDEX -> CREATE INDEX IF NOT EXISTS
  content = content.replace(/CREATE\s+INDEX\s+(?!IF\s+NOT\s+EXISTS)/gi, "CREATE INDEX IF NOT EXISTS ");
  content = content.replace(/CREATE\s+UNIQUE\s+INDEX\s+(?!IF\s+NOT\s+EXISTS)/gi, "CREATE UNIQUE INDEX IF NOT EXISTS ");

  // 3. ADD COLUMN -> ADD COLUMN IF NOT EXISTS
  content = content.replace(/ADD\s+COLUMN\s+(?!IF\s+NOT\s+EXISTS)/gi, "ADD COLUMN IF NOT EXISTS ");

  // 4. CREATE TYPE ... AS ENUM -> Safe DO block
  content = content.replace(
    /CREATE\s+TYPE\s+([a-zA-Z0-9_."]+)\s+AS\s+ENUM\s*\(([^)]+)\);/gi,
    (match, typeName, enumVals) => {
      return `DO $$ BEGIN\n  CREATE TYPE ${typeName} AS ENUM (${enumVals});\nEXCEPTION\n  WHEN duplicate_object THEN NULL;\nEND $$;`;
    }
  );

  // 5. DROP POLICY IF EXISTS before CREATE POLICY
  content = content.replace(
    /CREATE\s+POLICY\s+"([^"]+)"\s+ON\s+([a-zA-Z0-9_.]+)/gi,
    (match, policyName, tableName) => {
      return `DROP POLICY IF EXISTS "${policyName}" ON ${tableName};\nCREATE POLICY "${policyName}" ON ${tableName}`;
    }
  );

  // Deduplicate repeated DROP POLICY lines
  content = content.replace(
    /DROP\s+POLICY\s+IF\s+EXISTS\s+"([^"]+)"\s+ON\s+([a-zA-Z0-9_.]+);\s*DROP\s+POLICY\s+IF\s+EXISTS\s+"\1"\s+ON\s+\2;/gi,
    'DROP POLICY IF EXISTS "$1" ON $2;'
  );

  // 6. ALTER PUBLICATION -> Safe DO block
  content = content.replace(
    /ALTER\s+PUBLICATION\s+([a-zA-Z0-9_]+)\s+ADD\s+TABLE\s+([a-zA-Z0-9_.]+);/gi,
    (match, pubName, tblName) => {
      return `DO $$ BEGIN\n  ALTER PUBLICATION ${pubName} ADD TABLE ${tblName};\nEXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL;\nEND $$;`;
    }
  );
  content = content.replace(
    /ALTER\s+PUBLICATION\s+([a-zA-Z0-9_]+)\s+DROP\s+TABLE\s+([a-zA-Z0-9_.]+);/gi,
    (match, pubName, tblName) => {
      return `DO $$ BEGIN\n  ALTER PUBLICATION ${pubName} DROP TABLE ${tblName};\nEXCEPTION WHEN undefined_object THEN NULL; WHEN OTHERS THEN NULL;\nEND $$;`;
    }
  );

  // 7. CREATE TRIGGER -> Safe DROP TRIGGER IF EXISTS beforehand
  content = content.replace(
    /CREATE\s+TRIGGER\s+([a-zA-Z0-9_]+)\s+([\s\S]*?)\s+ON\s+([a-zA-Z0-9_.]+)/gi,
    (match, triggerName, timing, tableName) => {
      return `DROP TRIGGER IF EXISTS ${triggerName} ON ${tableName};\nCREATE TRIGGER ${triggerName} ${timing} ON ${tableName}`;
    }
  );

  // Clean duplicate drop trigger lines
  content = content.replace(
    /DROP\s+TRIGGER\s+IF\s+EXISTS\s+([a-zA-Z0-9_]+)\s+ON\s+([a-zA-Z0-9_.]+);\s*DROP\s+TRIGGER\s+IF\s+EXISTS\s+\1\s+ON\s+\2;/gi,
    'DROP TRIGGER IF EXISTS $1 ON $2;'
  );

  combinedSql += content + "\n";
}

// Ensure final role permissions on all created tables
combinedSql += `
-- Grant permissions on all public tables, sequences, and routines to anon and authenticated
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;
`;

writeFileSync(resolve("supabase/full_schema_migration.sql"), combinedSql, "utf8");
console.log(`Regenerated full_schema_migration.sql with standard role grants.`);
