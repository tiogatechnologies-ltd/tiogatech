import { readFileSync } from "fs";
import { describe, expect, it } from "vitest";

/**
 * vercel.json only rewrites known top-level paths to the SPA shell so unknown
 * URLs get a real 404. A route added to App.tsx without being listed there would
 * 404 in production, so this keeps the two in step.
 */
describe("vercel.json rewrites", () => {
  it("cover every top-level route in App.tsx", () => {
    const app = readFileSync("src/App.tsx", "utf8");
    const segments = new Set(
      [...app.matchAll(/path="\/([^"]*)"/g)].map((m) => m[1].split("/")[0]).filter((s) => s && s !== "*"),
    );
    const source: string = JSON.parse(readFileSync("vercel.json", "utf8")).rewrites[0].source;
    const listed = new Set(source.match(/\(([^)]*)\)/)![1].split("|"));
    const missing = [...segments].filter((s) => !listed.has(s));
    expect(missing).toEqual([]);
  });
});
