import sharp from "sharp";
import { readdir, stat, rename } from "node:fs/promises";
import path from "node:path";

const dir = "src/assets";
const MAX_W = 1600;
const QUALITY = 72;

const files = await readdir(dir);
let saved = 0, before = 0, after = 0;

for (const f of files) {
  if (!/\.(jpe?g|png)$/i.test(f)) continue;
  const fp = path.join(dir, f);
  const s = await stat(fp);
  before += s.size;
  const tmp = fp + ".tmp";
  try {
    const img = sharp(fp).rotate();
    const meta = await img.metadata();
    let pipeline = img;
    if (meta.width && meta.width > MAX_W) pipeline = pipeline.resize({ width: MAX_W, withoutEnlargement: true });
    if (/\.png$/i.test(f)) {
      // Keep PNG (likely logos/transparent) - just optimize
      await pipeline.png({ compressionLevel: 9, palette: true }).toFile(tmp);
    } else {
      await pipeline.jpeg({ quality: QUALITY, mozjpeg: true, progressive: true }).toFile(tmp);
    }
    const s2 = await stat(tmp);
    if (s2.size < s.size) {
      await rename(tmp, fp);
      saved += s.size - s2.size;
      after += s2.size;
      console.log(`✓ ${f}: ${(s.size/1024).toFixed(0)}KB → ${(s2.size/1024).toFixed(0)}KB`);
    } else {
      await rename(tmp, fp); // no-op cleanup
      after += s2.size;
    }
  } catch (e) {
    console.log(`× ${f}: ${e.message}`);
    after += s.size;
  }
}

console.log(`\nTotal: ${(before/1024/1024).toFixed(2)}MB → ${(after/1024/1024).toFixed(2)}MB (saved ${(saved/1024/1024).toFixed(2)}MB)`);
