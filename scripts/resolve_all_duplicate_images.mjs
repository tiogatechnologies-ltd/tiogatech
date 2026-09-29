import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import crypto from 'crypto';

// The 23 groups to differentiate
const groupActions = [
  // 1. Single vs Double Socket
  {
    target: 'public/products/items/product-0035.webp',
    base: 'public/products/clear/socket-double.webp',
    badgeText: 'DOUBLE SOCKET • USB-C'
  },
  // 2. 1-Gang vs 2-Gang Switch
  {
    target: 'public/products/items/product-0078.webp',
    base: 'public/products/clear/switch-2gang-white.webp',
    badgeText: '2 GANG • 2 SCENE'
  },
  // 3. 12" Control Panel vs F7-Pro
  {
    target: 'public/products/items/product-0168.webp',
    base: 'public/products/items/product-0168.webp',
    badgeText: 'F7-PRO SMART PANEL'
  },
  // 4. Wireless Chargers (3 items)
  {
    target: 'public/products/items/product-0214.webp',
    base: 'public/products/items/product-0214.webp',
    badgeText: 'SWT-31 FAST CHARGE'
  },
  {
    target: 'public/products/items/product-0215.webp',
    base: 'public/products/items/product-0215.webp',
    badgeText: 'SMT-1 MULTI-DEVICE'
  },
  // 5. Doorbell Chime vs 8" Video Doorbell
  {
    target: 'public/products/items/product-0270.webp',
    base: 'public/products/clear/gateway-zigbee-hub.webp',
    badgeText: 'WIRELESS INDOOR CHIME'
  },
  // 6. C10 3D Face vs G18 3D Face
  {
    target: 'public/products/items/product-0306.webp',
    base: 'public/products/items/product-0306.webp',
    badgeText: 'G18 3D FACE ID'
  },
  // 7. A01-TYW Camera Lock vs A01-TYM Smart Lock
  {
    target: 'public/products/items/product-0308.webp',
    base: 'public/products/clear/lock-fingerprint-handle.webp',
    badgeText: 'A01-TYM SMART HANDLE'
  },
  // 8. M50 vs V92C Smart Lock
  {
    target: 'public/products/items/product-0330.webp',
    base: 'public/products/clear/lock-slim-aluminum.webp',
    badgeText: 'V92C NARROW PROFILE'
  },
  // 9. K12 Padlock vs P6 Padlock
  {
    target: 'public/products/items/product-0339.webp',
    base: 'public/products/items/product-0339.webp',
    badgeText: 'P6 HEAVY-DUTY SHACKLE'
  },
  // 10. Tuya Mini PTZ Camera Black vs White
  {
    target: 'public/products/items/product-0358.webp',
    base: 'public/products/clear/camera-ptz-indoor.webp',
    badgeText: '3MP PTZ • DUAL-BAND'
  },
  // 11. 4-Channel vs 8-Channel NVR Kit
  {
    target: 'public/products/items/product-0376.webp',
    base: 'public/products/items/product-0376.webp',
    badgeText: '8-CHANNEL NVR KIT'
  },
  // 12. 4MP Solar PTZ Camera Type 1 vs Type 2
  {
    target: 'public/products/items/product-0383.webp',
    base: 'public/products/clear/camera-ptz-solar.webp',
    badgeText: '4MP PTZ SOLAR • TYPE 2'
  },
  // 13. 2MP Web Camera
  {
    target: 'public/products/items/product-0406.webp',
    base: 'public/products/items/product-0406.webp',
    badgeText: '1080P WIDE-ANGLE USB'
  },
  // 14. 3.2m vs 4.2m Curtain Kit
  {
    target: 'public/products/items/product-0412.webp',
    base: 'public/products/items/product-0412.webp',
    badgeText: '4.2 METERS EXTENDED'
  },
  // 15. 0.5m vs 1m Track
  {
    target: 'public/products/items/product-0436.webp',
    base: 'public/products/clear/track-magnetic-rail.webp',
    badgeText: '1.0 METER RAIL'
  },
  // 16. Wifi vs Bluetooth Curtain Robot
  {
    target: 'public/products/items/product-0439.webp',
    base: 'public/products/clear/curtain-robot.webp',
    badgeText: 'BLUETOOTH + REMOTE'
  },
  // 17. T-10 vs T-10-2 In-wall Amp
  {
    target: 'public/products/items/product-0450.webp',
    base: 'public/products/items/product-0450.webp',
    badgeText: 'T-10-2 DUAL ZONE 10.1"'
  },
  // 18. A30+ vs H50 HiFi Amp
  {
    target: 'public/products/items/product-0454.webp',
    base: 'public/products/clear/audio-wall-amplifier.webp',
    badgeText: 'H50 APTX-HD 50W'
  },
  // 19. SM-818 Active vs Passive Speaker
  {
    target: 'public/products/items/product-0479.webp',
    base: 'public/products/clear/speaker-hivi-sound.webp',
    badgeText: 'SM818 PASSIVE 50W'
  },
  // 20. Flood Light 18W vs Big Flood Light 30W
  {
    target: 'public/products/items/product-0537.webp',
    base: 'public/products/clear/track-linear-flood.webp',
    badgeText: '30W HIGH-LUMEN FLOOD'
  },
  // 21. Track I-Connector vs L-Connector
  {
    target: 'public/products/items/product-0544.webp',
    base: 'public/products/items/product-0544.webp',
    badgeText: '90° L-CORNER JOINT'
  },
  // 22. Staircase Switch vs Sensor
  {
    target: 'public/products/items/product-0551.webp',
    base: 'public/products/clear/stair-step-lighting.webp',
    badgeText: 'PIR STEP SENSOR'
  },
  // 23. SMD Running Light 3000K Warm vs 4000K Neutral
  {
    target: 'public/products/items/product-0560.webp',
    base: 'public/products/items/product-0560.webp',
    badgeText: '4000K NEUTRAL WHITE'
  }
];

function createMiniBadge(text) {
  const clean = text.replace(/&/g, '&amp;');
  return Buffer.from(`
  <svg width="600" height="600" viewBox="0 0 600 600" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <filter id="badgeShadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#000000" flood-opacity="0.25"/>
      </filter>
    </defs>
    <g filter="url(#badgeShadow)">
      <rect x="350" y="24" width="226" height="34" rx="8" fill="#0F172A" stroke="#38BDF8" stroke-width="1.5"/>
      <text x="463" y="46" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="700" letter-spacing="0.5" fill="#38BDF8">${clean}</text>
    </g>
  </svg>
  `);
}

async function run() {
  console.log('Resolving 23 duplicate groups...');
  for (const action of groupActions) {
    const inputBuf = fs.readFileSync(action.base);
    const meta = await sharp(inputBuf).metadata();
    
    // Resize input to 600x600 inside
    const resized = await sharp(inputBuf)
      .resize(540, 540, { fit: 'inside' })
      .toBuffer();
      
    const badgeSvg = createMiniBadge(action.badgeText);
    
    const finalBuffer = await sharp({
      create: {
        width: 600,
        height: 600,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      }
    })
    .composite([
      { input: resized, gravity: 'center' },
      { input: badgeSvg, gravity: 'northeast' }
    ])
    .webp({ quality: 92 })
    .toBuffer();
    
    fs.writeFileSync(action.target, finalBuffer);
    console.log(`Updated: ${action.target} (${action.badgeText})`);
  }
  console.log('Done resolving duplicate groups.');
}

run();
