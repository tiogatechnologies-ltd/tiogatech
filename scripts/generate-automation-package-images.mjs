import sharp from "sharp";
import path from "path";
import fs from "fs";

const OUT_DIR = path.resolve("public/products/core");
fs.mkdirSync(OUT_DIR, { recursive: true });

async function makeDropShadow(pngBuf, w, h) {
  const shadowRaw = await sharp(pngBuf)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  for (let i = 0; i < shadowRaw.data.length; i += 4) {
    shadowRaw.data[i] = 15;
    shadowRaw.data[i + 1] = 23;
    shadowRaw.data[i + 2] = 42;
    shadowRaw.data[i + 3] = Math.round(shadowRaw.data[i + 3] * 0.24);
  }
  return await sharp(shadowRaw.data, {
    raw: { width: w, height: h, channels: 4 },
  })
    .blur(10)
    .png()
    .toBuffer();
}

async function loadHardwareCutout(relPath, targetMaxW, targetMaxH) {
  const fullPath = path.resolve(relPath);
  const meta = await sharp(fullPath).metadata();
  // Crop out bottom 9% where pre-rendered oval shadow sits in cat-*.png
  const cropH = Math.round((meta.height || 800) * 0.905);
  const img = sharp(fullPath)
    .extract({ left: 0, top: 0, width: meta.width || 800, height: cropH })
    .ensureAlpha();
  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;

  // Strip pure white backgrounds if any (e.g., if corner pixel is near white)
  const isCornerWhite =
    data[0] > 245 && data[1] > 245 && data[2] > 245 && data[3] > 240;
  if (isCornerWhite) {
    for (let p = 0; p < width * height; p++) {
      const idx = p * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      if (r > 245 && g > 245 && b > 245) {
        data[idx + 3] = 0;
      }
    }
  }

  const cleanedPng = await sharp(data, { raw: { width, height, channels } })
    .png()
    .toBuffer();

  let croppedBuf = cleanedPng;
  try {
    croppedBuf = await sharp(cleanedPng).trim({ threshold: 10 }).png().toBuffer();
  } catch {
    // fallback
  }

  const resized = await sharp(croppedBuf)
    .resize(targetMaxW, targetMaxH, { fit: "inside", withoutEnlargement: false })
    .png()
    .toBuffer({ resolveWithObject: true });

  const shadow = await makeDropShadow(resized.data, resized.info.width, resized.info.height);

  return {
    buffer: resized.data,
    shadow,
    width: resized.info.width,
    height: resized.info.height,
  };
}

function esc(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function buildStudioBgSvg({ code, title, subtitle, tierTag, tierColor, spec1, spec2, spec3 }) {
  return Buffer.from(`
<svg width="1200" height="900" viewBox="0 0 1200 900" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#f8fafc"/>
      <stop offset="68%" stop-color="#eef2f6"/>
      <stop offset="100%" stop-color="#e2e8f0"/>
    </linearGradient>
    <linearGradient id="floorGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#d8e0e8"/>
      <stop offset="100%" stop-color="#c4d0dc"/>
    </linearGradient>
    <radialGradient id="studioGlow" cx="50%" cy="44%" r="55%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.98"/>
      <stop offset="100%" stop-color="#eef2f6" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <!-- Studio wall -->
  <rect width="1200" height="725" fill="url(#bgGrad)"/>
  <circle cx="600" cy="390" r="520" fill="url(#studioGlow)"/>

  <!-- Subtle studio horizon line -->
  <line x1="0" y1="725" x2="1200" y2="725" stroke="#cbd5e1" stroke-width="2"/>

  <!-- Studio floor podium -->
  <rect x="0" y="725" width="1200" height="175" fill="url(#floorGrad)"/>

  <!-- Soft floor ambient shadow under hardware group -->
  <ellipse cx="600" cy="752" rx="495" ry="32" fill="#0f172a" fill-opacity="0.16"/>

  <!-- Top-left Tier Pill -->
  <rect x="44" y="36" width="196" height="42" rx="10" fill="${tierColor}"/>
  <text x="142" y="63" font-family="Arial, Helvetica, sans-serif" font-size="16" font-weight="800" fill="#ffffff" text-anchor="middle" letter-spacing="1">${esc(code)}</text>

  <!-- Package Title -->
  <text x="256" y="64" font-family="Arial, Helvetica, sans-serif" font-size="25" font-weight="800" fill="#0f172a">${esc(title)} · <tspan fill="#475569" font-weight="700" font-size="21">${esc(subtitle)}</tspan></text>

  <!-- Top-right Tier Badge -->
  <rect x="916" y="36" width="240" height="42" rx="10" fill="#0f172a"/>
  <text x="1036" y="63" font-family="Arial, Helvetica, sans-serif" font-size="15" font-weight="800" fill="#00e640" text-anchor="middle">${esc(tierTag)}</text>

  <!-- Bottom Component Specification Strip -->
  <rect x="44" y="822" width="1112" height="52" rx="14" fill="#0f172a" fill-opacity="0.94"/>
  <text x="68" y="854" font-family="Arial, Helvetica, sans-serif" font-size="15.5" font-weight="700" fill="#ffffff">Control: <tspan fill="#00e640">${esc(spec1)}</tspan></text>
  <text x="435" y="854" font-family="Arial, Helvetica, sans-serif" font-size="15.5" font-weight="700" fill="#ffffff">Security: <tspan fill="#38bdf8">${esc(spec2)}</tspan></text>
  <text x="805" y="854" font-family="Arial, Helvetica, sans-serif" font-size="15.5" font-weight="700" fill="#ffffff">Automation: <tspan fill="#fbbf24">${esc(spec3)}</tspan></text>
</svg>
  `);
}

const AUTOMATION_PACKAGES = [
  {
    outName: "pkg-automation-apex.webp",
    code: "FOUNDATIONAL TIER",
    title: "Apex Series",
    subtitle: "Essential Smart Living",
    tierTag: "LIVING & SECURITY",
    tierColor: "#15803d",
    spec1: "Zigbee Hub + 4-Gang Touch",
    spec2: "Biometric Lock + PTZ CCTV",
    spec3: "Motion & Scene Control",
    items: [
      { path: "public/products/categories/cat-gateways.png", maxW: 310, maxH: 310, x: 70, y: 465 },
      { path: "public/products/categories/cat-smart-locks.png", maxW: 340, maxH: 510, x: 345, y: 245 },
      { path: "public/products/categories/cat-switches.png", maxW: 280, maxH: 260, x: 650, y: 510 },
      { path: "public/products/categories/cat-cctv.png", maxW: 285, maxH: 390, x: 865, y: 360 },
    ],
  },
  {
    outName: "pkg-automation-aura.webp",
    code: "MOST POPULAR TIER",
    title: "Aura Series",
    subtitle: "Core Home Automation",
    tierTag: "MULTI-ROOM SMART HUB",
    tierColor: "#1d4ed8",
    spec1: "In-Wall Touch Control Panel",
    spec2: "Smart Lock + AI PTZ Cameras",
    spec3: "Motorized Curtain + Relays",
    items: [
      { path: "public/products/categories/cat-curtains.png", maxW: 365, maxH: 430, x: 55, y: 315 },
      { path: "public/products/categories/cat-control-panels.png", maxW: 365, maxH: 475, x: 375, y: 270 },
      { path: "public/products/categories/cat-switches.png", maxW: 260, maxH: 240, x: 690, y: 525 },
      { path: "public/products/categories/cat-smart-locks.png", maxW: 295, maxH: 470, x: 870, y: 275 },
    ],
  },
  {
    outName: "pkg-automation-riviera.webp",
    code: "LUXURY ESTATE TIER",
    title: "Riviera Series",
    subtitle: "Complete Home Ecosystem",
    tierTag: "ESTATE AUTOMATION",
    tierColor: "#6d28d9",
    spec1: "Touch Panel + Wi-Fi 6 Hub",
    spec2: "3D Face Lock + 4K AI CCTV",
    spec3: "Motorized Drapes + Sensors",
    items: [
      { path: "public/products/categories/cat-curtains.png", maxW: 340, maxH: 415, x: 45, y: 315 },
      { path: "public/products/categories/cat-gateways.png", maxW: 260, maxH: 250, x: 240, y: 515 },
      { path: "public/products/categories/cat-control-panels.png", maxW: 350, maxH: 465, x: 435, y: 275 },
      { path: "public/products/categories/cat-smart-locks.png", maxW: 285, maxH: 465, x: 735, y: 275 },
      { path: "public/products/categories/cat-cctv.png", maxW: 250, maxH: 355, x: 940, y: 390 },
      { path: "public/products/categories/cat-switches.png", maxW: 230, maxH: 215, x: 690, y: 550 },
    ],
  },
];

(async () => {
  for (const pkg of AUTOMATION_PACKAGES) {
    const bgSvg = buildStudioBgSvg(pkg);
    const composites = [];

    for (const item of pkg.items) {
      const asset = await loadHardwareCutout(item.path, item.maxW, item.maxH);
      composites.push({ input: asset.shadow, left: item.x + 12, top: item.y + 14 });
      composites.push({ input: asset.buffer, left: item.x, top: item.y });
    }

    const outPath = path.join(OUT_DIR, pkg.outName);
    await sharp(bgSvg)
      .composite(composites)
      .webp({ quality: 92 })
      .toFile(outPath);

    console.log(`Generated ${outPath}`);
  }
  console.log("All 3 Home Automation composite package images generated!");
})();
