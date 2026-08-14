import { readFileSync } from "fs";
import { resolve } from "path";

const appPath = resolve("src/App.tsx");
const appContent = readFileSync(appPath, "utf8");

// Extract all /admin/ routes
const routeMatches = Array.from(appContent.matchAll(/path=["'](\/admin[^"']*)["']\s+element=\{<([^ />]+)/g));

console.log(`Found ${routeMatches.length} /admin/ routes registered in App.tsx:\n`);

const routes = routeMatches.map((m) => ({
  path: m[1],
  component: m[2],
}));

console.log(JSON.stringify(routes, null, 2));
