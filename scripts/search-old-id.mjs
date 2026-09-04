import { readdirSync, readFileSync, statSync } from "fs";
import { join } from "path";

function searchDir(dir, query) {
  for (const f of readdirSync(dir)) {
    const full = join(dir, f);
    if (statSync(full).isDirectory()) {
      if (f !== "node_modules" && f !== ".git" && f !== "dist") searchDir(full, query);
    } else {
      const content = readFileSync(full, "utf8");
      if (content.includes(query)) {
        console.log(`Found "${query}" in ${full}`);
      }
    }
  }
}

searchDir(".", "yqeayhukgjtbptblvmhd");
