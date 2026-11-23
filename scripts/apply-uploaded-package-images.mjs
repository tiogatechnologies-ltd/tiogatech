import sharp from "sharp";
import path from "path";

const UPLOAD_DIR =
  "C:/Users/ADMIN/.gemini/antigravity/brain/31510500-7997-4d1a-8858-a668354c9eea/.user_uploaded";
const OUT_DIR = path.resolve("public/products/packages");

async function copyAsWebp(srcFile, outFile) {
  const srcPath = path.join(UPLOAD_DIR, srcFile);
  const outPath = path.join(OUT_DIR, outFile);
  await sharp(srcPath).webp({ quality: 92 }).toFile(outPath);
  console.log(`Updated ${outPath} <- ${srcFile}`);
}

async function generateP5With650WLabel() {
  const srcPath = path.join(UPLOAD_DIR, "media_1795461518890_df6a99c5.jpg");
  const outPath = path.join(OUT_DIR, "lithium-p5.webp");

  const { data, info } = await sharp(srcPath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;

  // Seamlessly paint over ONLY the '4' in "24× 450W" (x: 688..704, y: 458..479)
  // by smoothly interpolating the clean cardboard pixels directly above (y=455) and below (y=482)
  const xStart = 688;
  const xEnd = 704;
  const yStart = 457;
  const yEnd = 480;
  const yAbove = 454;
  const yBelow = 483;

  for (let x = xStart; x <= xEnd; x++) {
    const idxTop = (yAbove * width + x) * channels;
    const idxBot = (yBelow * width + x) * channels;
    for (let y = yStart; y <= yEnd; y++) {
      const t = (y - yStart) / (yEnd - yStart);
      const idx = (y * width + x) * channels;
      data[idx] = Math.round(data[idxTop] * (1 - t) + data[idxBot] * t);
      data[idx + 1] = Math.round(data[idxTop + 1] * (1 - t) + data[idxBot + 1] * t);
      data[idx + 2] = Math.round(data[idxTop + 2] * (1 - t) + data[idxBot + 2] * t);
      data[idx + 3] = 255;
    }
  }

  const baseBuf = await sharp(data, { raw: { width, height, channels } })
    .png()
    .toBuffer();

  // Render a matching bold '6' aligned with "50W" (angle -4.85 deg)
  const digitSvg = Buffer.from(`
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <g transform="translate(696, 476.5) rotate(-4.85)">
    <text x="0" y="0" font-family="Arial, Helvetica, sans-serif" font-size="24.5" font-weight="900" fill="#100c08" stroke="#e9c48d" stroke-width="0.6" paint-order="stroke" text-anchor="middle">6</text>
  </g>
</svg>
  `);

  await sharp(baseBuf)
    .composite([{ input: digitSvg }])
    .webp({ quality: 92 })
    .toFile(outPath);

  // Also write a zoomed verification crop to scratch
  await sharp(outPath)
    .extract({ left: 590, top: 430, width: 295, height: 110 })
    .png()
    .toFile(
      "C:/Users/ADMIN/.gemini/antigravity/brain/31510500-7997-4d1a-8858-a668354c9eea/scratch/crate_crop_650w.png"
    );

  console.log(`Updated ${outPath} with 24× 650W crate label!`);
}

(async () => {
  // 1. Image 6 -> Tubular #9 (Hybrid 1KVA: 1×220Ah Tubular + 2×400W Panels + 60A MPPT)
  await copyAsWebp("media_1795461518883_c0eb9cd3.jpg", "pkg-solar-9.webp");

  // 2. Image 5 -> Tubular #11 (Hybrid 2.5KVA/3.5KVA: MUST Inverter + Luminous 220Ah Tubular + 4×450W Panels + MPPT)
  await copyAsWebp("media_1795461518872_7e2155a1.jpg", "pkg-solar-11.webp");

  // 3. Image 3 -> Lithium P2 (Pro 12 SRNE: SRNE 12kW Hybrid Inverter + SRNE LiFePO4 Batteries + Solar Array)
  await copyAsWebp("media_1795461518852_5516a98d.jpg", "lithium-p2.webp");

  // 4. Image 7 (patched to 24× 650W) -> Lithium P5 (Pro 20 Three-Phase SRNE: SRNE 20kW + SRNE SE15B + 24×650W Panels)
  await generateP5With650WLabel();

  console.log("Option 1 package image updates complete!");
})();
