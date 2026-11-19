import sharp from "sharp";
import path from "path";
import fs from "fs";

const OUT_DIR = path.resolve("public/products/packages");
fs.mkdirSync(OUT_DIR, { recursive: true });

/**
 * Extracts only the clean monocrystalline solar panel from cat-solar-panels.png
 * (cropping out the right-hand white backsheet & red LONGi 600W badge),
 * and also updates sungene-panel-330w-mono.webp and sungene-panel-650w-mono.webp.
 */
async function getCleanSolarPanel(targetMaxW, targetMaxH) {
  const srcPath = path.resolve("public/products/categories/cat-solar-panels.png");
  const meta = await sharp(srcPath).metadata();
  const left = Math.round(meta.width * 0.12);
  const top = Math.round(meta.height * 0.04);
  const width = Math.round(meta.width * 0.335);
  const height = Math.round(meta.height * 0.91);
  const extracted = await sharp(srcPath)
    .extract({ left, top, width, height })
    .ensureAlpha()
    .png()
    .toBuffer();

  const cropped = await sharp(extracted).trim({ threshold: 10 }).png().toBuffer();

  const resized = await sharp(cropped)
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

/**
 * Loads a real hardware image (inverter, battery, busbar), removes any floating
 * corner specification pill badge (dark pill in top-right or disconnected island),
 * trims transparent margins, and scales to targetMaxW x targetMaxH.
 */
async function loadCleanProduct(relPath, targetMaxW, targetMaxH) {
  const fullPath = path.resolve(relPath);
  const img = sharp(fullPath).ensureAlpha();
  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;

  // 1) Strip any dark/red floating spec pill badge in the top-right corner
  // without touching white/light-grey hardware bodies or the SRNE battery circular display.
  for (let y = 0; y < Math.min(height, 118); y++) {
    for (let x = Math.floor(width * 0.56); x < width; x++) {
      const idx = (y * width + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      if (!(r > 188 && g > 188 && b > 188)) {
        data[idx + 3] = 0;
      }
    }
  }

  // 2) Keep only the largest connected component of opaque pixels
  // (automatically removes any remaining disconnected badge text or island without touching the product body!)
  const mask = new Uint8Array(width * height);
  for (let p = 0; p < width * height; p++) {
    if (data[p * 4 + 3] > 28) mask[p] = 1;
  }

  const labels = new Int32Array(width * height);
  let currentLabel = 0;
  let bestLabel = 0;
  let bestCount = 0;
  const queue = new Int32Array(width * height);

  for (let p = 0; p < width * height; p++) {
    if (mask[p] && labels[p] === 0) {
      currentLabel++;
      let head = 0;
      let tail = 0;
      queue[tail++] = p;
      labels[p] = currentLabel;
      let count = 0;

      while (head < tail) {
        const curr = queue[head++];
        count++;
        const cx = curr % width;
        const cy = (curr - cx) / width;

        const neighbors = [
          cy > 0 ? curr - width : -1,
          cy < height - 1 ? curr + width : -1,
          cx > 0 ? curr - 1 : -1,
          cx < width - 1 ? curr + 1 : -1,
        ];
        for (const nb of neighbors) {
          if (nb >= 0 && mask[nb] && labels[nb] === 0) {
            labels[nb] = currentLabel;
            queue[tail++] = nb;
          }
        }
      }

      if (count > bestCount) {
        bestCount = count;
        bestLabel = currentLabel;
      }
    }
  }

  if (bestLabel > 0) {
    for (let p = 0; p < width * height; p++) {
      if (labels[p] !== bestLabel) {
        data[p * 4 + 3] = 0;
      }
    }
  }

  // 3) Trim transparent bounding box and resize
  const cleanedPng = await sharp(data, { raw: { width, height, channels } })
    .png()
    .toBuffer();

  let croppedBuf = cleanedPng;
  try {
    croppedBuf = await sharp(cleanedPng).trim({ threshold: 10 }).png().toBuffer();
  } catch {
    // fallback if already tight
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

function buildBackgroundSvg({ code, title, brand, kwLabel, panelLabel, batteryLabel, tierColor }) {
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

  <!-- Top-left Tier + Package Code Pill -->
  <rect x="44" y="36" width="174" height="42" rx="10" fill="${tierColor}"/>
  <text x="131" y="63" font-family="Arial, Helvetica, sans-serif" font-size="17" font-weight="800" fill="#ffffff" text-anchor="middle" letter-spacing="1">${code}</text>

  <!-- Brand & System Title -->
  <text x="236" y="64" font-family="Arial, Helvetica, sans-serif" font-size="25" font-weight="800" fill="#0f172a">${title} (${brand})</text>

  <!-- Top-right kW Capacity Badge -->
  <rect x="964" y="36" width="192" height="42" rx="10" fill="#0f172a"/>
  <text x="1060" y="63" font-family="Arial, Helvetica, sans-serif" font-size="17" font-weight="800" fill="#00e640" text-anchor="middle">${kwLabel}</text>

  <!-- Bottom Component Specification Strip -->
  <rect x="44" y="822" width="1112" height="52" rx="14" fill="#0f172a" fill-opacity="0.94"/>
  <text x="72" y="854" font-family="Arial, Helvetica, sans-serif" font-size="17" font-weight="700" fill="#ffffff">Inverter: <tspan fill="#00e640">${brand} ${kwLabel}</tspan></text>
  <text x="445" y="854" font-family="Arial, Helvetica, sans-serif" font-size="17" font-weight="700" fill="#ffffff">Battery: <tspan fill="#38bdf8">${batteryLabel}</tspan></text>
  <text x="845" y="854" font-family="Arial, Helvetica, sans-serif" font-size="17" font-weight="700" fill="#ffffff">Solar Panels: <tspan fill="#fbbf24">${panelLabel}</tspan></text>
</svg>
  `);
}

const PACKAGES_TO_RENDER = [
  {
    slug: "lithium-e1",
    code: "ESSENTIAL E1",
    title: "Essential 1.5",
    brand: "SRNE",
    kwLabel: "1.5kW 12V",
    panelLabel: "3 × 330W Sungene",
    batteryLabel: "2.56kWh EOS02B-12",
    tierColor: "#15803d",
    panelSlices: 3,
    invImg: "public/products/srne/srne-inv-afp-5kw.webp",
    invCount: 1,
    batImg: "public/products/srne/srne-bat-eos02b-12.webp",
    batCount: 1,
    busbarImg: null,
  },
  {
    slug: "lithium-e2",
    code: "ESSENTIAL E2",
    title: "Essential 3",
    brand: "itel",
    kwLabel: "3kW 24V",
    panelLabel: "2 × 650W Sungene",
    batteryLabel: "2.5kWh IPW-25100",
    tierColor: "#15803d",
    panelSlices: 2,
    invImg: "public/products/itel/itel-inv-12kw-48v-1p.webp",
    invCount: 1,
    batImg: "public/products/itel/itel-bat-5kwh-24v-wall.webp",
    batCount: 1,
    busbarImg: null,
  },
  {
    slug: "lithium-e3",
    code: "ESSENTIAL E3",
    title: "Essential 3 Plus",
    brand: "itel",
    kwLabel: "3kW 24V",
    panelLabel: "3 × 650W Sungene",
    batteryLabel: "5kWh IPL-25200X",
    tierColor: "#15803d",
    panelSlices: 3,
    invImg: "public/products/itel/itel-inv-12kw-48v-1p.webp",
    invCount: 1,
    batImg: "public/products/itel/itel-bat-5kwh-24v-wall.webp",
    batCount: 1,
    busbarImg: null,
  },
  {
    slug: "lithium-c1",
    code: "COMPLETE C1",
    title: "Complete 4",
    brand: "itel",
    kwLabel: "4kW 24V Hybrid",
    panelLabel: "4 × 650W Sungene",
    batteryLabel: "5kWh IPL-25200X",
    tierColor: "#1d4ed8",
    panelSlices: 4,
    invImg: "public/products/itel/itel-inv-12kw-48v-1p.webp",
    invCount: 1,
    batImg: "public/products/itel/itel-bat-5kwh-24v-wall.webp",
    batCount: 1,
    busbarImg: null,
  },
  {
    slug: "lithium-c2",
    code: "COMPLETE C2",
    title: "Complete 5",
    brand: "SRNE",
    kwLabel: "5kW 48V Hybrid",
    panelLabel: "6 × 650W Sungene",
    batteryLabel: "5.12kWh SE05B",
    tierColor: "#1d4ed8",
    panelSlices: 5,
    invImg: "public/products/srne/srne-inv-afp-5kw.webp",
    invCount: 1,
    batImg: "public/products/srne/srne-battery-se05b-wall.webp",
    batCount: 1,
    busbarImg: null,
  },
  {
    slug: "lithium-c3",
    code: "COMPLETE C3",
    title: "Complete 6",
    brand: "itel",
    kwLabel: "6kW 48V Hybrid",
    panelLabel: "6 × 650W Sungene",
    batteryLabel: "10kWh IPL-51200H",
    tierColor: "#1d4ed8",
    panelSlices: 5,
    invImg: "public/products/itel/itel-inv-12kw-48v-1p.webp",
    invCount: 1,
    batImg: "public/products/itel/itel-bat-10kwh-48v.webp",
    batCount: 1,
    busbarImg: null,
  },
  {
    slug: "lithium-c4",
    code: "COMPLETE C4",
    title: "Complete 8",
    brand: "itel",
    kwLabel: "8kW 48V Hybrid",
    panelLabel: "8 × 650W Sungene",
    batteryLabel: "10kWh IPL-51200H",
    tierColor: "#1d4ed8",
    panelSlices: 6,
    invImg: "public/products/itel/itel-inv-12kw-48v-1p.webp",
    invCount: 1,
    batImg: "public/products/itel/itel-bat-10kwh-48v.webp",
    batCount: 1,
    busbarImg: null,
  },
  {
    slug: "lithium-p1",
    code: "PRO P1",
    title: "Pro 12",
    brand: "itel",
    kwLabel: "12kW 48V Hybrid",
    panelLabel: "16 × 650W (10.4kWp)",
    batteryLabel: "16kWh IPL-51314H",
    tierColor: "#6d28d9",
    panelSlices: 6,
    invImg: "public/products/itel/itel-inv-12kw-48v-1p.webp",
    invCount: 1,
    batImg: "public/products/itel/itel-bat-16kwh-48v.webp",
    batCount: 1,
    busbarImg: null,
  },
  {
    slug: "lithium-p2",
    code: "PRO P2",
    title: "Pro 12 SRNE",
    brand: "SRNE",
    kwLabel: "12kW 48V Hybrid",
    panelLabel: "16 × 650W (10.4kWp)",
    batteryLabel: "14.33kWh SE15B",
    tierColor: "#6d28d9",
    panelSlices: 6,
    invImg: "public/products/srne/srne-inv-asp-12kw.webp",
    invCount: 1,
    batImg: "public/products/srne/srne-bat-se15b-tower.webp",
    batCount: 1,
    busbarImg: null,
  },
  {
    slug: "lithium-p3",
    code: "PRO P3",
    title: "Pro 24",
    brand: "itel",
    kwLabel: "24kW (2 × 12kW)",
    panelLabel: "32 × 650W (20.8kWp)",
    batteryLabel: "32kWh (2 × 16kWh)",
    tierColor: "#6d28d9",
    panelSlices: 7,
    invImg: "public/products/itel/itel-inv-12kw-48v-1p.webp",
    invCount: 2,
    batImg: "public/products/itel/itel-bat-16kwh-48v.webp",
    batCount: 2,
    busbarImg: "public/products/srne/srne-acc-dcb1.webp",
  },
  {
    slug: "lithium-p4",
    code: "PRO P4",
    title: "Pro 12 Three-Phase",
    brand: "itel",
    kwLabel: "12kW 3-Phase",
    panelLabel: "16 × 650W (10.4kWp)",
    batteryLabel: "16kWh IPL-51314H",
    tierColor: "#6d28d9",
    panelSlices: 6,
    invImg: "public/products/itel/itel-inv-12kw-48v-1p.webp",
    invCount: 1,
    batImg: "public/products/itel/itel-bat-16kwh-48v.webp",
    batCount: 1,
    busbarImg: null,
  },
  {
    slug: "lithium-p5",
    code: "PRO P5",
    title: "Pro 20 Three-Phase",
    brand: "SRNE",
    kwLabel: "20kW 3-Phase",
    panelLabel: "24 × 650W (15.6kWp)",
    batteryLabel: "28.66kWh (2 × SE15B)",
    tierColor: "#6d28d9",
    panelSlices: 7,
    invImg: "public/products/srne/srne-inv-asp-20kw.png",
    invCount: 1,
    batImg: "public/products/srne/srne-bat-se15b-tower.webp",
    batCount: 2,
    busbarImg: "public/products/srne/srne-acc-dcb1.webp",
  },
];

async function renderPackage(pkg, cleanPanel) {
  const bgSvg = buildBackgroundSvg(pkg);
  const composites = [];

  // 1) Back-Right: Clean Monocrystalline Solar Panel Array (fanned horizontally)
  const sliceCount = pkg.panelSlices;
  const startX = 720;
  const maxSpan = 220;
  const stepX = sliceCount > 1 ? Math.round(maxSpan / (sliceCount - 1)) : 0;
  const basePanelY = 748 - cleanPanel.height;

  for (let i = sliceCount - 1; i >= 0; i--) {
    const px = startX + i * stepX;
    const py = basePanelY - i * 6;
    composites.push({ input: cleanPanel.shadow, left: px + 10, top: py + 12 });
    composites.push({ input: cleanPanel.buffer, left: px, top: py });
  }

  // 2) Left: Real Inverter(s)
  const invMaxW = pkg.invCount === 2 ? 240 : 330;
  const invMaxH = pkg.invCount === 2 ? 400 : 475;
  const invAsset = await loadCleanProduct(pkg.invImg, invMaxW, invMaxH);

  if (pkg.invCount === 2) {
    const inv1X = 56;
    const inv1Y = 748 - invAsset.height - 14;
    const inv2X = 56 + Math.round(invAsset.width * 0.78);
    const inv2Y = 756 - invAsset.height + 4;
    composites.push({ input: invAsset.shadow, left: inv1X + 10, top: inv1Y + 12 });
    composites.push({ input: invAsset.buffer, left: inv1X, top: inv1Y });
    composites.push({ input: invAsset.shadow, left: inv2X + 10, top: inv2Y + 12 });
    composites.push({ input: invAsset.buffer, left: inv2X, top: inv2Y });
  } else {
    const invX = 88;
    const invY = 752 - invAsset.height;
    composites.push({ input: invAsset.shadow, left: invX + 12, top: invY + 14 });
    composites.push({ input: invAsset.buffer, left: invX, top: invY });
  }

  // 3) Center Foreground: Real Lithium Battery (or Dual Batteries)
  const batMaxW = pkg.batCount === 2 ? 250 : 340;
  const batMaxH = pkg.batCount === 2 ? 450 : 510;
  const batAsset = await loadCleanProduct(pkg.batImg, batMaxW, batMaxH);

  if (pkg.batCount === 2) {
    const bat1X = 395;
    const bat1Y = 762 - batAsset.height - 10;
    const bat2X = 395 + Math.round(batAsset.width * 0.82);
    const bat2Y = 772 - batAsset.height + 6;
    composites.push({ input: batAsset.shadow, left: bat1X + 12, top: bat1Y + 14 });
    composites.push({ input: batAsset.buffer, left: bat1X, top: bat1Y });
    composites.push({ input: batAsset.shadow, left: bat2X + 12, top: bat2Y + 14 });
    composites.push({ input: batAsset.buffer, left: bat2X, top: bat2Y });
  } else {
    const batX = 430;
    const batY = 770 - batAsset.height;
    composites.push({ input: batAsset.shadow, left: batX + 14, top: batY + 16 });
    composites.push({ input: batAsset.buffer, left: batX, top: batY });
  }

  // 4) Optional DCB-1 Busbar in foreground (for Pro 24 and Pro 20 Three-Phase)
  if (pkg.busbarImg) {
    const busAsset = await loadCleanProduct(pkg.busbarImg, 150, 145);
    const busX = 315;
    const busY = 786 - busAsset.height;
    composites.push({ input: busAsset.shadow, left: busX + 8, top: busY + 10 });
    composites.push({ input: busAsset.buffer, left: busX, top: busY });
  }

  const outPath = path.join(OUT_DIR, `${pkg.slug}.webp`);
  await sharp(bgSvg)
    .composite(composites)
    .webp({ quality: 92 })
    .toFile(outPath);

  console.log(`Generated ${outPath}`);
}

(async () => {
  const cleanPanel = await getCleanSolarPanel(220, 560);
  for (const pkg of PACKAGES_TO_RENDER) {
    await renderPackage(pkg, cleanPanel);
  }
  console.log("All 12 clean real-product Lithium package composite images generated!");
})();
