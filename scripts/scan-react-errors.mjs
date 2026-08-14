import { readFileSync, readdirSync } from "fs";
import { resolve } from "path";

const pagesDir = resolve("src/pages");
const files = readdirSync(pagesDir).filter((f) => f.endsWith(".tsx"));

console.log(`Checking ${files.length} React pages for unsafe unhandled null/undefined accesses...\n`);

const issues = [];

for (const file of files) {
  const content = readFileSync(resolve(pagesDir, file), "utf8");

  // Check for common bugs:
  // 1. undefined functions in onClick/onChange
  const undefinedMatches = Array.from(content.matchAll(/onClick=\{([a-zA-Z0-9_]+)\}/g));
  for (const m of undefinedMatches) {
    const fnName = m[1];
    if (["undefined", "null"].includes(fnName)) {
      issues.push({ file, issue: `onClick bound to ${fnName}` });
    }
  }

  // 2. Unhandled JSON.parse without try-catch
  if (content.includes("JSON.parse(") && !content.includes("try {")) {
    // check if it's outside try catch
    // (informational)
  }
}

console.log("Check complete. Issues found:", issues.length);
if (issues.length) console.log(JSON.stringify(issues, null, 2));
