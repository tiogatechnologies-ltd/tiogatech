import sharp from "sharp";
import path from "path";
import fs from "fs";

const OUT_DIR = path.resolve("public/products/packages");
const TMP_DIR = path.resolve("public/products/packages/.tmp_src");
fs.mkdirSync(OUT_DIR, { recursive: true });
fs.mkdirSync(TMP_DIR, { recursive: true });

// Preserve a copy of original pkg-solar-9..18 cutouts before we overwrite them with full composites
for (const n of [9, 10, 11, 12, 13, 14, 15, 16, 17, 18]) {
  const src = path.join(OUT_DIR, `pkg-solar-${n}.webp`);
  const bak = path.join(TMP_DIR, `orig-pkg-solar-${n}.webp`);
  if (!fs.existsSync(bak) && fs.existsSync(src)) {
    fs.copyFileSync(src, bak);
  }
}

function esc(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
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

/**
 * Loads a real hardware image, flood-fills pure white backgrounds from all 4 outer borders
 * so internal white surfaces on inverters/batteries remain 100% solid, trims margins, and scales.
 */
async function loadProductCutout(relPath, targetMaxW, targetMaxH) {
  const fullPath = path.resolve(relPath);
  const img = sharp(fullPath).ensureAlpha();
  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;

  // Flood-fill white/near-white background starting from all 4 edges
  const visited = new Uint8Array(width * height);
  const queue = new Int32Array(width * height);
  let head = 0;
  let tail = 0;

  const isBgWhite = (p) => {
    const idx = p * 4;
    const a = data[idx + 3];
    if (a < 15) return true;
    const r = data[idx];
    const g = data[idx + 1];
    const b = data[idx + 2];
    return r >= 242 && g >= 242 && b >= 242;
  };

  for (let x = 0; x < width; x++) {
    const topP = x;
    const botP = (height - 1) * width + x;
    if (isBgWhite(topP)) {
      visited[topP] = 1;
      queue[tail++] = topP;
    }
    if (isBgWhite(botP) && !visited[botP]) {
      visited[botP] = 1;
      queue[tail++] = botP;
    }
  }
  for (let y = 0; y < height; y++) {
    const leftP = y * width;
    const rightP = y * width + (width - 1);
    if (isBgWhite(leftP) && !visited[leftP]) {
      visited[leftP] = 1;
      queue[tail++] = leftP;
    }
    if (isBgWhite(rightP) && !visited[rightP]) {
      visited[rightP] = 1;
      queue[tail++] = rightP;
    }
  }

  while (head < tail) {
    const curr = queue[head++];
    data[curr * 4 + 3] = 0;
    const cx = curr % width;
    const cy = (curr - cx) / width;

    const nbs = [
      cy > 0 ? curr - width : -1,
      cy < height - 1 ? curr + width : -1,
      cx > 0 ? curr - 1 : -1,
      cx < width - 1 ? curr + 1 : -1,
    ];
    for (const nb of nbs) {
      if (nb >= 0 && !visited[nb] && isBgWhite(nb)) {
        visited[nb] = 1;
        queue[tail++] = nb;
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

function buildBackgroundSvg({ code, title, subtitle, kwLabel, panelLabel, batteryLabel, tierColor }) {
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
  <rect x="44" y="36" width="192" height="42" rx="10" fill="${tierColor}"/>
  <text x="140" y="63" font-family="Arial, Helvetica, sans-serif" font-size="16" font-weight="800" fill="#ffffff" text-anchor="middle" letter-spacing="1">${esc(code)}</text>

  <!-- System Title -->
  <text x="252" y="64" font-family="Arial, Helvetica, sans-serif" font-size="24" font-weight="800" fill="#0f172a">${esc(title)} · <tspan fill="#475569" font-weight="700" font-size="20">${esc(subtitle)}</tspan></text>

  <!-- Top-right Capacity Badge -->
  <rect x="944" y="36" width="212" height="42" rx="10" fill="#0f172a"/>
  <text x="1050" y="63" font-family="Arial, Helvetica, sans-serif" font-size="16" font-weight="800" fill="#00e640" text-anchor="middle">${esc(kwLabel)}</text>

  <!-- Bottom Component Specification Strip -->
  <rect x="44" y="822" width="1112" height="52" rx="14" fill="#0f172a" fill-opacity="0.94"/>
  <text x="68" y="854" font-family="Arial, Helvetica, sans-serif" font-size="16" font-weight="700" fill="#ffffff">Inverter: <tspan fill="#00e640">${esc(kwLabel)}</tspan></text>
  <text x="445" y="854" font-family="Arial, Helvetica, sans-serif" font-size="16" font-weight="700" fill="#ffffff">Battery Bank: <tspan fill="#38bdf8">${esc(batteryLabel)}</tspan></text>
  <text x="835" y="854" font-family="Arial, Helvetica, sans-serif" font-size="16" font-weight="700" fill="#ffffff">Solar Array: <tspan fill="#fbbf24">${esc(panelLabel)}</tspan></text>
</svg>
  `);
}

const TUBULAR_PACKAGES = [
  {
    num: 9,
    code: "TUBULAR #9",
    title: "Hybrid 1KVA",
    subtitle: "Studio / Shop Starter",
    kwLabel: "1KVA 12V Hybrid",
    batteryLabel: "1 × 220Ah Tubular",
    panelLabel: "2 × 400W + 60A MPPT",
    tierColor: "#0f766e",
    invImg: "public/products/packages/.tmp_src/orig-pkg-solar-9.webp",
    batCount: 1,
    panelSlices: 2,
    ccImg: "public/products/exulted/exulted-60a-mppt-charge-controller.webp",
  },
  {
    num: 10,
    code: "TUBULAR #10",
    title: "Hybrid 1.5KVA",
    subtitle: "Compact Flat System",
    kwLabel: "1.5KVA / 1.7KVA 24V",
    batteryLabel: "2 × 220Ah Tubular",
    panelLabel: "2 × 400W + 60A MPPT",
    tierColor: "#0f766e",
    invImg: "public/products/packages/.tmp_src/orig-pkg-solar-10.webp",
    batCount: 2,
    panelSlices: 2,
    ccImg: "public/products/exulted/exulted-60a-mppt-charge-controller.webp",
  },
  {
    num: 11,
    code: "TUBULAR #11",
    title: "Hybrid 2.5KVA",
    subtitle: "Mid Flat / Small Home",
    kwLabel: "2.5KVA / 3.5KVA 24V",
    batteryLabel: "2 × 220Ah Tubular",
    panelLabel: "4 × 450W + 60A MPPT",
    tierColor: "#0f766e",
    invImg: "public/products/packages/.tmp_src/orig-pkg-solar-11.webp",
    batCount: 2,
    panelSlices: 4,
    ccImg: "public/products/exulted/exulted-60a-mppt-charge-controller.webp",
  },
  {
    num: 12,
    code: "TUBULAR #12",
    title: "Hybrid 3KVA",
    subtitle: "Family Home System",
    kwLabel: "3KVA 24V Hybrid",
    batteryLabel: "4 × 220Ah Tubular",
    panelLabel: "8 × 450W + 60A MPPT",
    tierColor: "#0369a1",
    invImg: "public/products/packages/.tmp_src/orig-pkg-solar-12.webp",
    batCount: 4,
    panelSlices: 5,
    ccImg: "public/products/exulted/exulted-60a-mppt-charge-controller.webp",
  },
  {
    num: 13,
    code: "TUBULAR #13",
    title: "Hybrid 5KVA Pro",
    subtitle: "Larger Family Home",
    kwLabel: "5KVA 48V Transformer",
    batteryLabel: "6 × 220Ah Tubular",
    panelLabel: "12 × 450W + 80A MPPT",
    tierColor: "#0369a1",
    invImg: "public/products/packages/.tmp_src/orig-pkg-solar-13.webp",
    batCount: 4,
    panelSlices: 6,
    ccImg: "public/products/exulted/exulted-100a-mppt-charge-controller.webp",
  },
  {
    num: 14,
    code: "TUBULAR #14",
    title: "Hybrid 5KVA Value",
    subtitle: "Best-Value 5KVA",
    kwLabel: "5KVA 48V Hybrid",
    batteryLabel: "6 × 220Ah Tubular",
    panelLabel: "12 × 450W + 80A MPPT",
    tierColor: "#0369a1",
    invImg: "public/products/packages/.tmp_src/orig-pkg-solar-14.webp",
    batCount: 4,
    panelSlices: 6,
    ccImg: "public/products/exulted/exulted-100a-mppt-charge-controller.webp",
  },
  {
    num: 15,
    code: "TUBULAR #15",
    title: "7.5KVA Heavy-Duty",
    subtitle: "Home + AC Support",
    kwLabel: "7.5KVA 48V Inverter",
    batteryLabel: "8 × 220Ah Tubular",
    panelLabel: "18 × 450W + 100A MPPT",
    tierColor: "#1d4ed8",
    invImg: "public/products/packages/.tmp_src/orig-pkg-solar-15.webp",
    batCount: 6,
    panelSlices: 6,
    ccImg: "public/products/exulted/exulted-100a-mppt-charge-controller.webp",
  },
  {
    num: 16,
    code: "TUBULAR #16",
    title: "10KVA Commercial",
    subtitle: "Large Home / Dual AC",
    kwLabel: "10KVA 48V Inverter",
    batteryLabel: "16 × 220Ah Tubular",
    panelLabel: "24 × 450W + 120A MPPT",
    tierColor: "#1d4ed8",
    invImg: "public/products/packages/.tmp_src/orig-pkg-solar-16.webp",
    batCount: 6,
    panelSlices: 7,
    ccImg: "public/products/exulted/exulted-100a-mppt-charge-controller.webp",
  },
];

const HIGH_VOLTAGE_PACKAGES = [
  {
    num: 17,
    code: "HIGH VOLTAGE #17",
    title: "40KVA Core Series",
    subtitle: "Commercial 3-Phase",
    kwLabel: "40KVA / 36KW 3-Phase",
    batteryLabel: "60kWh HV Rack (1 × 60kWh)",
    panelLabel: "60 × 600W (36kWp)",
    tierColor: "#7c2d12",
    invImg: "public/products/deye/deye-sun-50k-sg01hp3.webp",
    cabinetImg: "public/products/packages/.tmp_src/orig-pkg-solar-17.webp",
    rackImg: "public/products/deye/deye-bos-g-60kwh-system.webp",
    rackCount: 1,
    panelSlices: 6,
  },
  {
    num: 18,
    code: "HIGH VOLTAGE #18",
    title: "40KVA Pro Series",
    subtitle: "Extended Commercial",
    kwLabel: "40KVA / 36KW 3-Phase",
    batteryLabel: "90kWh HV Racks (2 Towers)",
    panelLabel: "72 × 600W (43.2kWp)",
    tierColor: "#6d28d9",
    invImg: "public/products/deye/deye-sun-50k-sg01hp3.webp",
    cabinetImg: null,
    rackImg: "public/products/deye/deye-bos-g-60kwh-system.webp",
    rackCount: 2,
    panelSlices: 7,
  },
  {
    num: 19,
    code: "HIGH VOLTAGE #19",
    title: "40KVA Max Series",
    subtitle: "Enterprise Micro-Grid",
    kwLabel: "40KVA / 36KW 3-Phase",
    batteryLabel: "120kWh HV Racks (3 Towers)",
    panelLabel: "100 × 550W (55kWp)",
    tierColor: "#4c1d95",
    invImg: "public/products/deye/deye-sun-50k-sg01hp3.webp",
    cabinetImg: null,
    rackImg: "public/products/deye/deye-bos-g-60kwh-system.webp",
    rackCount: 3,
    panelSlices: 7,
  },
];

async function renderTubularPackage(pkg, cleanPanel) {
  const bgSvg = buildBackgroundSvg(pkg);
  const composites = [];

  // 1) Back-Right: Solar Panel Array
  const sliceCount = pkg.panelSlices;
  const startX = 730;
  const maxSpan = 215;
  const stepX = sliceCount > 1 ? Math.round(maxSpan / (sliceCount - 1)) : 0;
  const basePanelY = 748 - cleanPanel.height;

  for (let i = sliceCount - 1; i >= 0; i--) {
    const px = startX + i * stepX;
    const py = basePanelY - i * 6;
    composites.push({ input: cleanPanel.shadow, left: px + 10, top: py + 12 });
    composites.push({ input: cleanPanel.buffer, left: px, top: py });
  }

  // 2) Left: Real Hybrid/Heavy-Duty Inverter + MPPT Charge Controller
  const invAsset = await loadProductCutout(pkg.invImg, 315, 420);
  const invX = 68;
  const invY = 748 - invAsset.height;
  composites.push({ input: invAsset.shadow, left: invX + 12, top: invY + 14 });
  composites.push({ input: invAsset.buffer, left: invX, top: invY });

  const ccAsset = await loadProductCutout(pkg.ccImg, 130, 155);
  const ccX = 275;
  const ccY = 230;
  composites.push({ input: ccAsset.shadow, left: ccX + 8, top: ccY + 10 });
  composites.push({ input: ccAsset.buffer, left: ccX, top: ccY });

  // 3) Center Foreground: Real 220Ah Tall Tubular Battery Bank
  const batPath = "public/products/exulted/exulted-220ah-tubular-battery.webp";
  if (pkg.batCount === 1) {
    const bat = await loadProductCutout(batPath, 310, 355);
    const bx = 420;
    const by = 768 - bat.height;
    composites.push({ input: bat.shadow, left: bx + 12, top: by + 14 });
    composites.push({ input: bat.buffer, left: bx, top: by });
  } else if (pkg.batCount === 2) {
    const bat = await loadProductCutout(batPath, 240, 285);
    const positions = [
      { x: 380, y: 758 - bat.height },
      { x: 525, y: 774 - bat.height },
    ];
    for (const pos of positions) {
      composites.push({ input: bat.shadow, left: pos.x + 10, top: pos.y + 12 });
      composites.push({ input: bat.buffer, left: pos.x, top: pos.y });
    }
  } else if (pkg.batCount === 4) {
    const bat = await loadProductCutout(batPath, 195, 235);
    const positions = [
      { x: 375, y: 695 - bat.height },
      { x: 525, y: 695 - bat.height },
      { x: 355, y: 776 - bat.height },
      { x: 505, y: 776 - bat.height },
    ];
    for (const pos of positions) {
      composites.push({ input: bat.shadow, left: pos.x + 8, top: pos.y + 10 });
      composites.push({ input: bat.buffer, left: pos.x, top: pos.y });
    }
  } else {
    // 6-battery visible bank representing 8 to 16 battery bank
    const bat = await loadProductCutout(batPath, 175, 210);
    const positions = [
      { x: 355, y: 688 - bat.height },
      { x: 475, y: 688 - bat.height },
      { x: 595, y: 688 - bat.height },
      { x: 340, y: 778 - bat.height },
      { x: 460, y: 778 - bat.height },
      { x: 580, y: 778 - bat.height },
    ];
    for (const pos of positions) {
      composites.push({ input: bat.shadow, left: pos.x + 8, top: pos.y + 10 });
      composites.push({ input: bat.buffer, left: pos.x, top: pos.y });
    }
  }

  const outPath = path.join(OUT_DIR, `pkg-solar-${pkg.num}.webp`);
  await sharp(bgSvg)
    .composite(composites)
    .webp({ quality: 92 })
    .toFile(outPath);
  console.log(`Generated ${outPath}`);
}

async function renderHighVoltagePackage(pkg, cleanPanel) {
  const bgSvg = buildBackgroundSvg(pkg);
  const composites = [];

  // 1) Back-Right: Solar Panel Array
  const sliceCount = pkg.panelSlices;
  const startX = 735;
  const maxSpan = 210;
  const stepX = sliceCount > 1 ? Math.round(maxSpan / (sliceCount - 1)) : 0;
  const basePanelY = 748 - cleanPanel.height;

  for (let i = sliceCount - 1; i >= 0; i--) {
    const px = startX + i * stepX;
    const py = basePanelY - i * 6;
    composites.push({ input: cleanPanel.shadow, left: px + 10, top: py + 12 });
    composites.push({ input: cleanPanel.buffer, left: px, top: py });
  }

  // 2) Left: 40KVA / 36KW 3-Phase High-Voltage Hybrid Inverter (plus cabinet for #17)
  if (pkg.cabinetImg) {
    const cab = await loadProductCutout(pkg.cabinetImg, 250, 470);
    const cx = 62;
    const cy = 755 - cab.height;
    composites.push({ input: cab.shadow, left: cx + 10, top: cy + 12 });
    composites.push({ input: cab.buffer, left: cx, top: cy });

    const inv = await loadProductCutout(pkg.invImg, 235, 380);
    const ix = 240;
    const iy = 762 - inv.height;
    composites.push({ input: inv.shadow, left: ix + 10, top: iy + 12 });
    composites.push({ input: inv.buffer, left: ix, top: iy });
  } else {
    const inv = await loadProductCutout(pkg.invImg, 310, 480);
    const ix = 72;
    const iy = 755 - inv.height;
    composites.push({ input: inv.shadow, left: ix + 12, top: iy + 14 });
    composites.push({ input: inv.buffer, left: ix, top: iy });
  }

  // 3) Center Foreground: High-Voltage BOS-G Lithium Rack Tower(s) (1, 2, or 3 towers)
  if (pkg.rackCount === 1) {
    const rack = await loadProductCutout(pkg.rackImg, 240, 560);
    const rx = 475;
    const ry = 768 - rack.height;
    composites.push({ input: rack.shadow, left: rx + 12, top: ry + 14 });
    composites.push({ input: rack.buffer, left: rx, top: ry });
  } else if (pkg.rackCount === 2) {
    const rack = await loadProductCutout(pkg.rackImg, 210, 540);
    const positions = [
      { x: 390, y: 756 - rack.height },
      { x: 545, y: 772 - rack.height },
    ];
    for (const pos of positions) {
      composites.push({ input: rack.shadow, left: pos.x + 10, top: pos.y + 12 });
      composites.push({ input: rack.buffer, left: pos.x, top: pos.y });
    }
  } else {
    const rack = await loadProductCutout(pkg.rackImg, 185, 515);
    const positions = [
      { x: 355, y: 748 - rack.height },
      { x: 475, y: 760 - rack.height },
      { x: 595, y: 772 - rack.height },
    ];
    for (const pos of positions) {
      composites.push({ input: rack.shadow, left: pos.x + 10, top: pos.y + 12 });
      composites.push({ input: rack.buffer, left: pos.x, top: pos.y });
    }
  }

  const outPath = path.join(OUT_DIR, `pkg-solar-${pkg.num}.webp`);
  await sharp(bgSvg)
    .composite(composites)
    .webp({ quality: 92 })
    .toFile(outPath);
  console.log(`Generated ${outPath}`);
}

(async () => {
  const cleanPanel = await getCleanSolarPanel(220, 555);
  for (const pkg of TUBULAR_PACKAGES) {
    await renderTubularPackage(pkg, cleanPanel);
  }
  for (const pkg of HIGH_VOLTAGE_PACKAGES) {
    await renderHighVoltagePackage(pkg, cleanPanel);
  }
  console.log("All 8 Tubular and 3 High-Voltage composite package images generated!");
})();
