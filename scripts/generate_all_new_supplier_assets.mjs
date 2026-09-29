import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

fs.mkdirSync('public/products/solarpro', { recursive: true });
fs.mkdirSync('public/products/infinisolar', { recursive: true });
fs.mkdirSync('public/products/solis', { recursive: true });
fs.mkdirSync('public/products/core', { recursive: true });

function createBadgeSvg(category, modelText, specText, colorTheme = 'blue') {
  const cleanCat = category.toUpperCase().replace(/&/g, '&amp;');
  const cleanModel = modelText.replace(/&/g, '&amp;').replace(/•/g, '&#8226;');
  const cleanSpec = specText.replace(/&/g, '&amp;').replace(/•/g, '&#8226;');

  let c1 = '#0B5CAB', c2 = '#042C59', stroke = '#1D4ED8', sub = '#38BDF8', txt = '#93C5FD';
  if (colorTheme === 'orange') {
    c1 = '#C2410C'; c2 = '#7C2D12'; stroke = '#EA580C'; sub = '#FDBA74'; txt = '#FED7AA';
  } else if (colorTheme === 'teal') {
    c1 = '#0F766E'; c2 = '#134E4A'; stroke = '#0D9488'; sub = '#5EEAD4'; txt = '#99F6E4';
  } else if (colorTheme === 'emerald') {
    c1 = '#047857'; c2 = '#064E3B'; stroke = '#059669'; sub = '#6EE7B7'; txt = '#A7F3D0';
  }

  return Buffer.from(`
  <svg width="800" height="800" viewBox="0 0 800 800" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <filter id="shadow" x="-10%" y="-10%" width="125%" height="135%">
        <feDropShadow dx="0" dy="4" stdDeviation="5" flood-color="#001428" flood-opacity="0.32"/>
      </filter>
      <linearGradient id="badgeGrad_${colorTheme}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${c1}" />
        <stop offset="100%" stop-color="${c2}" />
      </linearGradient>
    </defs>
    
    <g filter="url(#shadow)">
      <rect x="430" y="32" width="340" height="74" rx="14" fill="url(#badgeGrad_${colorTheme})" stroke="${stroke}" stroke-width="1.5" />
      <text x="600" y="53" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="10.5" font-weight="700" letter-spacing="1.5" fill="${sub}">${cleanCat}</text>
      <text x="600" y="75" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14.5" font-weight="800" fill="#FFFFFF">${cleanModel}</text>
      <text x="600" y="93" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="500" fill="${txt}">${cleanSpec}</text>
    </g>
  </svg>
  `);
}

async function renderProductImage({
  baseImgPath,
  targetPath,
  badgeCat,
  badgeModel,
  badgeSpec,
  badgeTheme = 'blue',
  maxW = 700,
  maxH = 700
}) {
  const inputBuf = fs.readFileSync(baseImgPath);
  let pipeline = sharp(inputBuf);
  
  // Trim transparent or white borders
  const trimmedBuf = await pipeline.trim().toBuffer();
  
  const resizedProduct = await sharp(trimmedBuf)
    .resize(maxW, maxH, { fit: 'inside' })
    .toBuffer();
    
  const composites = [
    {
      input: resizedProduct,
      gravity: 'center'
    }
  ];
  
  if (badgeModel) {
    const badgeSvg = createBadgeSvg(badgeCat, badgeModel, badgeSpec, badgeTheme);
    composites.push({
      input: badgeSvg,
      gravity: 'northeast'
    });
  }
  
  const finalBuffer = await sharp({
    create: {
      width: 800,
      height: 800,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 }
    }
  })
  .composite(composites)
  .webp({ quality: 92 })
  .toBuffer();

  fs.writeFileSync(targetPath, finalBuffer);
  
  console.log(`Rendered: ${targetPath}`);
}

async function buildAll() {
  console.log('--- Rendering SolarPro Products ---');
  await renderProductImage({
    baseImgPath: 'scripts/official_extracted_images/Solar_street_lightS6_flate_43.png',
    targetPath: 'public/products/solarpro/solarpro-light-s6-100w.webp',
    badgeCat: 'All-In-One Solar Street Light',
    badgeModel: 'SolarPro S6-100W',
    badgeSpec: '100W LED • Monocrystalline PV • LiFePO4',
    badgeTheme: 'teal'
  });

  await renderProductImage({
    baseImgPath: 'scripts/official_extracted_images/Solar_street_lightS7_flate_40.png',
    targetPath: 'public/products/solarpro/solarpro-light-s7-120w.webp',
    badgeCat: 'All-In-One Solar Street Light',
    badgeModel: 'SolarPro S7-120W',
    badgeSpec: '120W LED • High-Lumen Bridgelux • MPPT',
    badgeTheme: 'teal'
  });

  await renderProductImage({
    baseImgPath: 'scripts/official_extracted_images/Solar_street_light_I6_flate_42.png',
    targetPath: 'public/products/solarpro/solarpro-light-i6-100w.webp',
    badgeCat: 'All-In-One Solar Street Light',
    badgeModel: 'SolarPro I6-100W',
    badgeSpec: '100W Integrated • Smart PIR Motion Sensor',
    badgeTheme: 'teal'
  });

  await renderProductImage({
    baseImgPath: 'scripts/official_extracted_images/Solar_street_light_R1_flate_40.png',
    targetPath: 'public/products/solarpro/solarpro-light-r1-60w.webp',
    badgeCat: 'All-In-One Solar Street Light',
    badgeModel: 'SolarPro R1-60W',
    badgeSpec: '60W High-Efficiency • Dusk to Dawn Auto',
    badgeTheme: 'teal'
  });

  await renderProductImage({
    baseImgPath: 'scripts/official_extracted_images/Solar_street_light_R3_flate_40.png',
    targetPath: 'public/products/solarpro/solarpro-light-r3-100w.webp',
    badgeCat: 'All-In-One Solar Street Light',
    badgeModel: 'SolarPro R3-100W',
    badgeSpec: '100W Commercial LED • Die-Cast Aluminium',
    badgeTheme: 'teal'
  });

  await renderProductImage({
    baseImgPath: 'scripts/official_extracted_images/Solar_street_light_R4_flate_40.png',
    targetPath: 'public/products/solarpro/solarpro-light-r4-120w.webp',
    badgeCat: 'All-In-One Solar Street Light',
    badgeModel: 'SolarPro R4-120W',
    badgeSpec: '120W Commercial LED • IP66 Waterproof',
    badgeTheme: 'teal'
  });

  await renderProductImage({
    baseImgPath: 'scripts/flood_0.png',
    targetPath: 'public/products/solarpro/solarpro-light-sp-fl-300w.webp',
    badgeCat: 'Solar Flood Light',
    badgeModel: 'SolarPro SP-FL-300W',
    badgeSpec: '300W High Lumen • Remote Control • IP66',
    badgeTheme: 'orange'
  });

  await renderProductImage({
    baseImgPath: 'scripts/official_extracted_images/15KWH_Battery_datasheet_img_0.jpg',
    targetPath: 'public/products/solarpro/solarpro-bat-15kwh-48v.webp',
    badgeCat: 'Lithium Battery System',
    badgeModel: 'SolarPro 15kWh (300Ah)',
    badgeSpec: '51.2V 300Ah LiFePO4 • 6,000+ Cycles',
    badgeTheme: 'blue'
  });

  await renderProductImage({
    baseImgPath: 'scripts/official_extracted_images/60KWH_Battery_datasheet_flate_3.png',
    targetPath: 'public/products/solarpro/solarpro-ess-60kwh-hv.webp',
    badgeCat: 'High-Voltage Commercial ESS',
    badgeModel: 'SolarPro 60kWh Rack ESS',
    badgeSpec: 'High-Voltage Multi-Module • Smart BMS',
    badgeTheme: 'blue'
  });

  await renderProductImage({
    baseImgPath: 'scripts/official_extracted_images/125KWH_Energy_storage_battery_datsheet_img_1.jpg',
    targetPath: 'public/products/solarpro/solarpro-ess-125kwh-hv.webp',
    badgeCat: 'Outdoor All-In-One Cabinet',
    badgeModel: 'SolarPro 125kWh C&I ESS',
    badgeSpec: 'Liquid/Air Cooled • Industrial Grid ESS',
    badgeTheme: 'blue'
  });

  console.log('--- Rendering Solis Inverters ---');
  await renderProductImage({
    baseImgPath: 'public/products/solis/solis-s6-eo1p-5k-48.webp',
    targetPath: 'public/products/solis/solis-s6-eo1p-5k-48.webp',
    badgeCat: 'Off-Grid Inverter',
    badgeModel: 'Solis S6-EO1P5K',
    badgeSpec: '5kW 48V • Dual MPPT • 100A AC Charger',
    badgeTheme: 'orange'
  });

  await renderProductImage({
    baseImgPath: 'public/products/solis/solis-s6-eh1p-12-18k.webp',
    targetPath: 'public/products/solis/solis-s6-eh1p-12k.webp',
    badgeCat: 'Single-Phase Hybrid Inverter',
    badgeModel: 'Solis S6-EH1P12K',
    badgeSpec: '12kW Single Phase • 48V Low Voltage',
    badgeTheme: 'orange'
  });

  await renderProductImage({
    baseImgPath: 'public/products/solis/solis-s6-eh1p-12-18k.webp',
    targetPath: 'public/products/solis/solis-s6-eh1p-14k.webp',
    badgeCat: 'Single-Phase Hybrid Inverter',
    badgeModel: 'Solis S6-EH1P14K',
    badgeSpec: '14kW Single Phase • High PV Input 16A',
    badgeTheme: 'orange'
  });

  await renderProductImage({
    baseImgPath: 'public/products/solis/solis-s6-eh1p-12-18k.webp',
    targetPath: 'public/products/solis/solis-s6-eh1p-16k.webp',
    badgeCat: 'Single-Phase Hybrid Inverter',
    badgeModel: 'Solis S6-EH1P16K',
    badgeSpec: '16kW Single Phase • Seamless UPS Transfer',
    badgeTheme: 'orange'
  });

  await renderProductImage({
    baseImgPath: 'public/products/solis/solis-s6-eh1p-12-18k.webp',
    targetPath: 'public/products/solis/solis-s6-eh1p-18k.webp',
    badgeCat: 'Single-Phase Hybrid Inverter',
    badgeModel: 'Solis S6-EH1P18K',
    badgeSpec: '18kW Single Phase • Generator Auto-Start',
    badgeTheme: 'orange'
  });

  await renderProductImage({
    baseImgPath: 'public/products/solis/solis-s6-eh3p-30-50k.webp',
    targetPath: 'public/products/solis/solis-s6-eh3p-30k-h.webp',
    badgeCat: 'Three-Phase High-Voltage Hybrid',
    badgeModel: 'Solis S6-EH3P30K-H',
    badgeSpec: '30kW 3-Phase • High-Voltage Battery Port',
    badgeTheme: 'orange'
  });

  await renderProductImage({
    baseImgPath: 'public/products/solis/solis-s6-eh3p-30-50k.webp',
    targetPath: 'public/products/solis/solis-s6-eh3p-50k-h.webp',
    badgeCat: 'Three-Phase High-Voltage Hybrid',
    badgeModel: 'Solis S6-EH3P50K-H',
    badgeSpec: '50kW 3-Phase • 4 MPPTs • C&I Commercial',
    badgeTheme: 'orange'
  });

  console.log('--- Rendering Sungene & Infini Products ---');
  await renderProductImage({
    baseImgPath: 'public/products/infinisolar/infini-lp1600-24v.webp',
    targetPath: 'public/products/infinisolar/sungene-bat-7-6kwh-24v.webp',
    badgeCat: 'Lithium Battery Storage',
    badgeModel: 'Sungene 7.6kWh (300Ah)',
    badgeSpec: '25.6V 300Ah • Grade-A LiFePO4 • Smart BMS',
    badgeTheme: 'emerald'
  });

  await renderProductImage({
    baseImgPath: 'public/products/infinisolar/infini-lp1600-48v.webp',
    targetPath: 'public/products/infinisolar/sungene-bat-15kwh-48v.webp',
    badgeCat: 'Lithium Battery Storage',
    badgeModel: 'Sungene 15kWh (300Ah)',
    badgeSpec: '51.2V 300Ah • Heavy Duty LiFePO4 Storage',
    badgeTheme: 'emerald'
  });

  await renderProductImage({
    baseImgPath: 'public/products/infinisolar/infini-lp1600-48v.webp',
    targetPath: 'public/products/infinisolar/infini-bat-10-2kwh-48v.webp',
    badgeCat: 'Lithium Battery Storage',
    badgeModel: 'Infini 10.2kWh (200Ah)',
    badgeSpec: '51.2V 200Ah LiFePO4 • LCD Telemetry',
    badgeTheme: 'blue'
  });

  await renderProductImage({
    baseImgPath: 'public/products/infinisolar/infini-lp2100.webp',
    targetPath: 'public/products/infinisolar/infini-bat-15kwh-48v.webp',
    badgeCat: 'Lithium Battery Storage',
    badgeModel: 'Infini 15kWh (300Ah)',
    badgeSpec: '51.2V 300Ah LiFePO4 • CATL Prismatic Cells',
    badgeTheme: 'blue'
  });

  await renderProductImage({
    baseImgPath: 'public/products/infinisolar/infini-hp800.webp',
    targetPath: 'public/products/infinisolar/infini-inv-hp800-3-5kva-24v.webp',
    badgeCat: 'Pure Sine Wave Inverter',
    badgeModel: 'Infini HP800 3.5kVA / 24V',
    badgeSpec: '3.5kVA Pure Sine Wave • MPPT Solar Charger',
    badgeTheme: 'blue'
  });

  await renderProductImage({
    baseImgPath: 'public/products/infinisolar/infini-hp800-exp.webp',
    targetPath: 'public/products/infinisolar/infini-inv-hp800-5kva-24v.webp',
    badgeCat: 'Pure Sine Wave Inverter',
    badgeModel: 'Infini HP800 5kVA / 24V',
    badgeSpec: '5kVA 24V Pure Sine Wave • High Surge',
    badgeTheme: 'blue'
  });

  await renderProductImage({
    baseImgPath: 'public/products/infinisolar/infini-sc800.webp',
    targetPath: 'public/products/infinisolar/infini-scc-mppt-60a.webp',
    badgeCat: 'MPPT Charge Controller',
    badgeModel: 'Infini MPPT-60A',
    badgeSpec: '60A Auto Detection • 99.5% Tracking Eff.',
    badgeTheme: 'blue'
  });

  await renderProductImage({
    baseImgPath: 'public/products/infinisolar/infini-pe300.webp',
    targetPath: 'public/products/infinisolar/infini-scc-mppt-100a.webp',
    badgeCat: 'MPPT Charge Controller',
    badgeModel: 'Infini MPPT-100A',
    badgeSpec: '100A Heavy Duty • LCD & Dual Cooling Fans',
    badgeTheme: 'blue'
  });

  // Fans
  await renderProductImage({
    baseImgPath: 'scripts/sheet2_3_extracted/sheet2_img_2.jpg',
    targetPath: 'public/products/infinisolar/infini-app-fan-18-rechargeable.webp',
    badgeCat: 'Solar DC Appliance',
    badgeModel: 'Infini 18" Standing Fan',
    badgeSpec: 'Lithium Battery • USB Port • 5-Blade DC Motor',
    badgeTheme: 'blue',
    maxW: 580,
    maxH: 580
  });

  await renderProductImage({
    baseImgPath: 'scripts/sheet2_3_extracted/sheet2_img_2.jpg',
    targetPath: 'public/products/infinisolar/infini-app-fan-18-solar-kit.webp',
    badgeCat: 'Solar Fan Complete Kit',
    badgeModel: 'Infini 18" Fan + 20W PV',
    badgeSpec: 'Includes 20W Solar Panel • 18" DC Fan Kit',
    badgeTheme: 'emerald',
    maxW: 580,
    maxH: 580
  });

  console.log('--- Rendering Solar Panels ---');
  await renderProductImage({
    baseImgPath: 'public/products/core/longi-550w-himo5.webp',
    targetPath: 'public/products/core/sungene-panel-330w-mono.webp',
    badgeCat: 'Monocrystalline Solar Panel',
    badgeModel: 'Sungene 330W Mono',
    badgeSpec: '330W High-Efficiency Monocrystalline Module',
    badgeTheme: 'emerald'
  });

  await renderProductImage({
    baseImgPath: 'public/products/core/longi-600w-himo6.webp',
    targetPath: 'public/products/core/sungene-panel-650w-mono.webp',
    badgeCat: 'Monocrystalline Solar Panel',
    badgeModel: 'Sungene 650W Half-Cell',
    badgeSpec: '650W High-Power Half-Cell PV Module',
    badgeTheme: 'emerald'
  });

  await renderProductImage({
    baseImgPath: 'public/products/core/canadian-solar-550w.webp',
    targetPath: 'public/products/core/jms-panel-550w-mono.webp',
    badgeCat: 'Tier-1 Mono Solar Panel',
    badgeModel: 'JMS 550W Tier-1 Mono',
    badgeSpec: '550W Half-Cut Cell • Anti-PID Technology',
    badgeTheme: 'blue'
  });

  await renderProductImage({
    baseImgPath: 'public/products/core/longi-610w-himo-x6.webp',
    targetPath: 'public/products/core/jms-panel-630w-mono.webp',
    badgeCat: 'Tier-1 Mono Solar Panel',
    badgeModel: 'JMS 630W Tier-1 Mono',
    badgeSpec: '630W High-Efficiency Half-Cell Module',
    badgeTheme: 'blue'
  });

  await renderProductImage({
    baseImgPath: 'public/products/core/canadian-solar-550w.webp',
    targetPath: 'public/products/core/yingli-panel-620w-mono.webp',
    badgeCat: 'Panda N-Type TOPCon Panel',
    badgeModel: 'Yingli Solar 620W N-Type',
    badgeSpec: '620W Bifacial N-Type TOPCon • 22.5% Eff.',
    badgeTheme: 'orange'
  });

  await renderProductImage({
    baseImgPath: 'public/products/core/longi-610w-himo-x6.webp',
    targetPath: 'public/products/core/yingli-panel-625w-mono.webp',
    badgeCat: 'Panda N-Type TOPCon Panel',
    badgeModel: 'Yingli Solar 625W N-Type',
    badgeSpec: '625W Bifacial N-Type TOPCon • 22.7% Eff.',
    badgeTheme: 'orange'
  });

  console.log('ALL IMAGES PROCESSED SUCCESSFULLY!');
}

buildAll().catch(console.error);
