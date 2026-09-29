import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import crypto from 'crypto';

const deyeSources = [
  {
    filename: 'deye-se-f5-c.webp',
    name: 'SE-F5-C 5.12kWh',
    badge: '5.12kWh | 51.2V 100Ah',
    urls: [
      'https://solartech.eu/cdn/shop/files/Acumulator-LiFePo4-Deye-5.12kWh-SE-F5-Pro-C-1_37166bb1-2a71-4cf6-8f64-f1dc91b66996.png?v=1781008175',
      'https://deyenergie.com/wp-content/uploads/2026/06/SE-F5-Pro-front-800x800.jpg'
    ]
  },
  {
    filename: 'deye-se-g10-2.webp',
    name: 'SE-G10.2 10.24kWh',
    badge: '10.24kWh | 51.2V 200Ah',
    urls: [
      'https://deye.com/wp-content/uploads/2025/01/se-g10.2-768x768.jpg'
    ]
  },
  {
    filename: 'deye-se-f12-c.webp',
    name: 'SE-F12-C 12.0kWh',
    badge: '11.8kWh | 51.2V 230Ah',
    urls: [
      'https://dutchmart.nl/196083-large_default/deye-se-f12-c-deye-deye-se-f12-c-118kwh-512v-230ah-low-voltage-lifepo4-battery-module-with-display.jpg',
      'https://dolyasolar.energy/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/s/e/se-f12-c_jpg.jpg'
    ]
  },
  {
    filename: 'deye-se-f16-v.webp',
    name: 'SE-F16-V 16.0kWh',
    badge: '16.0kWh | 51.2V 314Ah',
    urls: [
      'https://buy-solar.online/wp-content/uploads/2026/04/Deye-SE-F16-Energy-Storage-System-%E2%80%93-IP21-16kWh-LiFePO4-Solar-Battery-from-Wholesale-Distributor-Europe.png',
      'https://doncent.com.ng/storage/products/1RZfByRfrd9dpInupvLn.webp'
    ]
  },
  {
    filename: 'deye-bos-g-pro-5kwh.webp',
    name: 'BOS-G PRO 5.12kWh',
    badge: 'HV 5.12kWh | 51.2V 100Ah',
    urls: [
      'https://deye.com/wp-content/uploads/2023/02/%E6%AD%A3%E9%9D%A2-768x768.jpg'
    ]
  },
  {
    filename: 'deye-bos-g-pdu-2.webp',
    name: 'BOS-G-PDU-2 Controller',
    badge: 'HV Cluster PDU | 1000V 100A',
    urls: [
      'https://cdn.solsol.eu/content/images/product/deye-bos-g-pdu-2-pro_2172.png',
      'https://aurensol.com/cdn/shop/files/DEYE-HVB750V-100A-EU-1_96d25fac-e7cd-4915-9af9-b07fcc5eff59.png',
      'https://energymall.ng/wp-content/uploads/2026/01/Deye-control-box-1.webp'
    ]
  },
  {
    filename: 'deye-bos-a-7kwh.webp',
    name: 'BOS-A 7.68kWh',
    badge: 'HV 7.68kWh | 51.2V 150Ah',
    urls: [
      'https://deye.com/wp-content/uploads/2024/04/bos-a.jpg',
      'https://me3energy.ng/media/catalog/product/cache/c68e9bbb2d73eded5f4972f8e568886c/d/e/deye_bos-a_7.68kwh.png'
    ]
  },
  {
    filename: 'deye-bos-a-pdu-2.webp',
    name: 'BOS-A-PDU-2 Controller',
    badge: 'HV BOS-A Control Unit',
    urls: [
      'https://gde.ng/public/uploads/images/06-11-2025/690d17b19a8c3.webp'
    ]
  },
  {
    filename: 'deye-rack-9-layers-bos-g.webp',
    name: 'Rack 9 Layers (BOS-G)',
    badge: '9-Layer HV Rack (8 Modules + 1 PDU)',
    urls: [
      'https://cdn.solsol.eu/content/images/product/deye-hv-rack-for-bos-g-13layers_745.jpg',
      'https://zel.ng/wp-content/uploads/2026/03/deye-hv-rack-for-bos-g-13layers_745.webp'
    ]
  },
  {
    filename: 'deye-rack-11-layers-bos-a.webp',
    name: 'Rack 11 Layers (BOS-A)',
    badge: '11-Layer HV Rack (10 Modules + 1 PDU)',
    urls: [
      'https://alabamart.com/cdn/shop/files/image_26_7d5e16a4-845e-495e-a09a-bd05c89e156b.webp',
      'https://solarvillage.africa/media/catalog/product/cache/d1b32ed6a493bf0834d7036a8dcc9401/b/o/bos-a_.jpg'
    ]
  },
  {
    filename: 'deye-sun-6k-og01lp1.webp',
    name: 'SUN-6K-OG01LP1-EU-AM2',
    badge: '6kW Off-Grid | 135A Charger',
    urls: [
      'https://solarvillage.africa/media/catalog/product/cache/d1b32ed6a493bf0834d7036a8dcc9401/s/u/sun-6k-og01lp1-eu-am2.jpg',
      'https://solar.com.bd/wp-content/uploads/assets/images/deye-sun-6k-og01lp1-eu-am2-off-grid-hybrid-inverter.png'
    ]
  },
  {
    filename: 'deye-sun-8k-sg05lp1.webp',
    name: 'SUN-8K-SG05LP1-EU-SM2',
    badge: '8kW Hybrid | 190A Charge',
    urls: [
      'https://au.deyeinverter.com/deyeinverter/2024/03/23/4.png',
      'https://solarvillage.africa/media/catalog/product/cache/d1b32ed6a493bf0834d7036a8dcc9401/7/-/7-8k-sg05lp1-4.jpg'
    ]
  },
  {
    filename: 'deye-sun-10k-sg02lp1.webp',
    name: 'SUN-10K-SG02LP1-EU-AM3',
    badge: '10kW Hybrid | IP65 220A',
    urls: [
      'https://me3energy.ng/media/catalog/product/cache/c68e9bbb2d73eded5f4972f8e568886c/d/e/deye-10kw-sun-10k-sg02lp1-eu-am3.jpg',
      'https://liriksolar.com/image/catalog/products/Inverters/Hybrid%20inverter/Deye%20SUN-10K-SG02LP1-EU-AM3%20(10%20%D0%BA%D0%92%D1%82,%201%20%D1%84%D0%B0%D0%B7%D0%B0,%203%20MPPT)/Deye%20SUN-10K-SG02LP1-EU-AM3%20(5).jpg'
    ]
  },
  {
    filename: 'deye-sun-12k-sg02lp1.webp',
    name: 'SUN-12K-SG02LP1-EU-AM3',
    badge: '12kW Hybrid | IP65 250A',
    urls: [
      'https://solar.com.bd/wp-content/uploads/assets/images/deye-sun-12k-sg02lp1-eu-am3-hybrid-inverter.png',
      'https://au.deyeinverter.com/deyeinverter/2024/05/15/%E4%B8%BB%E5%9B%BE-38.png'
    ]
  },
  {
    filename: 'deye-sun-12k-sg04lp3.webp',
    name: 'SUN-12K-SG04LP3-EU-AM2',
    badge: '12kW 3-Phase Low Voltage | 240A',
    urls: [
      'https://deye.com/wp-content/uploads/2024/06/sun-5-12k-sg04lp3-eu-1-scaled.png'
    ]
  },
  {
    filename: 'deye-sun-16k-sg01lp1.webp',
    name: 'SUN-16K-SG01LP1-EU-AM3',
    badge: '16kW Single Phase Hybrid',
    urls: [
      'https://deye.com/wp-content/uploads/2024/06/sun-12-16k-sg01lp1-1-scaled.png'
    ]
  },
  {
    filename: 'deye-sun-16k-sg05lp3.webp',
    name: 'SUN-16K-SG05LP3-EU-SM2',
    badge: '16kW 3-Phase Hybrid | Dual MPPT',
    urls: [
      'https://www.deyeinverter.com/deyeinverter/2025/01/16/14-20k-sg05lp3-eu-sm2.png'
    ]
  },
  {
    filename: 'deye-sun-20k-sg05lp3.webp',
    name: 'SUN-20K-SG05LP3-EU-SM2',
    badge: '20kW 3-Phase Hybrid | Dual MPPT',
    urls: [
      'https://deyenergie.com/wp-content/uploads/2026/06/SUN-20K-SG05LP3-render-1218x800.jpg',
      'https://www.deyeinverter.com/deyeinverter/2025/01/16/14-20k-sg05lp3-eu-sm2.png'
    ]
  },
  {
    filename: 'deye-sun-25k-sg01hp3.webp',
    name: 'SUN-25K-SG01HP3-EU-AM2',
    badge: '25kW 3-Phase High Voltage HV',
    urls: [
      'https://www.deyeinverter.com/deyeinverter/2025/12/05/5-25KW-SG01HP3.bip.497.png',
      'https://buzz.energy/cdn/shop/files/9691014857021_49869711311165_Deye_SUN_SG01HP3-AU-AM2_HV_3_Phase_Hybrid_Inverter_-_Front-sq_1000x1000.jpg?v=1788173747'
    ]
  },
  {
    filename: 'deye-sun-30k-sg02hp3.webp',
    name: 'SUN-30K-SG02HP3-EU-AM3',
    badge: '30kW 3-Phase High Voltage HV',
    urls: [
      'https://www.deyeinverter.com/deyeinverter/2026/01/14/25-30.png',
      'https://etronixcenter.com/196076-large_default/an045-deye-deye-30k-3-phase-hybrid-inverter-3-mppt-1x-battery-input-for-high-voltage-battery.jpg'
    ]
  },
  {
    filename: 'deye-sun-50k-sg01hp3.webp',
    name: 'SUN-50K-SG01HP3-EU-BM4',
    badge: '50kW 3-Phase High Voltage HV',
    urls: [
      'https://deyenergie.com/wp-content/uploads/2026/06/30-50kw-sg1_front-1.jpg'
    ]
  },
  {
    filename: 'deye-sun-80k-sg02hp3.webp',
    name: 'SUN-80K-SG02HP3-EU-EM6',
    badge: '80kW 3-Phase High Voltage HV',
    urls: [
      'https://deyenergie.com/wp-content/uploads/2026/06/INV-DEYE-SUN-80K-SG02HP3-EUEM6_3-1.jpg'
    ]
  }
];

const targetDir = path.resolve('public/products/deye');
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

async function downloadBuffer(url) {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

async function main() {
  console.log(`Starting HD fetch and processing for ${deyeSources.length} Deye products...`);

  for (const item of deyeSources) {
    let rawBuf = null;
    let successUrl = null;

    for (const url of item.urls) {
      try {
        console.log(`Fetching [${item.name}] from: ${url}`);
        rawBuf = await downloadBuffer(url);
        successUrl = url;
        break;
      } catch (err) {
        console.warn(`  Failed ${url}: ${err.message}`);
      }
    }

    if (!rawBuf) {
      console.error(`FATAL: Could not fetch any source for ${item.name}!`);
      continue;
    }

    console.log(`  Processing ${item.filename} (from ${successUrl})...`);

    // Let's trim whitespace/borders if possible, resize to fit 720x720 inside 800x800
    // Then composite onto solid #FFFFFF canvas
    const innerImg = sharp(rawBuf)
      .trim()
      .resize(720, 720, {
        fit: 'inside',
        withoutEnlargement: false,
        background: { r: 255, g: 255, b: 255, alpha: 0 }
      });

    const innerBuf = await innerImg.toBuffer();
    const innerMeta = await sharp(innerBuf).metadata();

    const left = Math.round((800 - innerMeta.width) / 2);
    const top = Math.round((800 - innerMeta.height) / 2);

    // Create solid white background 800x800
    const outPath = path.join(targetDir, item.filename);

    await sharp({
      create: {
        width: 800,
        height: 800,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      }
    })
      .composite([
        {
          input: innerBuf,
          top: Math.max(0, top),
          left: Math.max(0, left)
        }
      ])
      .webp({ quality: 92 })
      .toFile(outPath);

    const outStat = fs.statSync(outPath);
    console.log(`  Saved ${item.filename} (${(outStat.size / 1024).toFixed(1)} KB)`);
  }

  // Verify uniqueness of all 22 hashes
  const hashes = new Map();
  for (const item of deyeSources) {
    const p = path.join(targetDir, item.filename);
    if (!fs.existsSync(p)) {
      console.error(`Missing output file: ${p}`);
      continue;
    }
    const buf = fs.readFileSync(p);
    const hash = crypto.createHash('md5').update(buf).digest('hex');
    if (hashes.has(hash)) {
      console.error(`COLLISION DETECTED! ${item.filename} has same hash as ${hashes.get(hash)}`);
    } else {
      hashes.set(hash, item.filename);
    }
  }

  console.log(`Verification complete: ${hashes.size} / ${deyeSources.length} unique image hashes created.`);
}

main().catch(console.error);
