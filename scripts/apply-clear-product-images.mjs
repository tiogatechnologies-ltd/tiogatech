import fs from 'fs';
import path from 'path';

function getClearImageForProduct(name, category, series) {
  const n = (name || '').toLowerCase();
  const c = (category || '').toLowerCase();
  const s = (series || '').toLowerCase();

  // === SMART SWITCHES & SOCKETS ===
  if (c.includes('switch') || c.includes('socket')) {
    if (n.includes('1 gang') || n.includes('1gang')) {
      return n.includes('black') ? '/products/clear/switch-touch-black.webp' : '/products/clear/switch-1gang-white.webp';
    }
    if (n.includes('2 gang') || n.includes('2gang')) {
      return n.includes('black') ? '/products/clear/switch-touch-black.webp' : '/products/clear/switch-2gang-white.webp';
    }
    if (n.includes('3 gang') || n.includes('3gang')) {
      return n.includes('black') ? '/products/clear/switch-touch-black.webp' : '/products/clear/switch-3gang-white.webp';
    }
    if (n.includes('4 gang') || n.includes('4gang') || n.includes('8 gang')) {
      return n.includes('black') ? '/products/clear/switch-touch-black.webp' : '/products/clear/switch-4gang-white.webp';
    }
    if (n.includes('dimmer')) return '/products/clear/switch-dimmer.webp';
    if (n.includes('scene') || n.includes('rotary')) return '/products/clear/switch-scene.webp';
    if (n.includes('heater') || n.includes('water heater') || n.includes('ac switch') || n.includes('boiler') || n.includes('30a') || n.includes('20a')) {
      return '/products/clear/switch-heater-ac.webp';
    }
    if (n.includes('pop up') || n.includes('popup')) return '/products/clear/socket-popup.webp';
    if (n.includes('double') || n.includes('2 pin') || n.includes('2 gang socket')) return '/products/clear/socket-double.webp';
    if (n.includes('strip')) return '/products/clear/power-strip-smart.webp';
    if (n.includes('plug')) return '/products/clear/plug-smart-wifi.webp';
    if (n.includes('socket')) return '/products/clear/socket-single-universal.webp';
    return '/products/clear/switch-2gang-white.webp';
  }

  // === SMART LOCKS ===
  if (c.includes('lock')) {
    if (n.includes('face') || n.includes('3d face') || n.includes('facial') || n.includes('c10') || n.includes('c11') || n.includes('g18')) {
      return '/products/clear/lock-face-recognition.webp';
    }
    if (n.includes('slim') || n.includes('aluminium') || n.includes('aluminum') || n.includes('narrow') || n.includes('z1') || n.includes('f2') || n.includes('z5')) {
      return '/products/clear/lock-slim-aluminum.webp';
    }
    if (n.includes('glass')) return '/products/clear/lock-glass-door.webp';
    if (n.includes('padlock')) return '/products/clear/lock-padlock-smart.webp';
    if (n.includes('hotel') || n.includes('rfid') || n.includes('keycard') || n.includes('gs-309')) return '/products/clear/lock-hotel-rfid.webp';
    return '/products/clear/lock-fingerprint-handle.webp';
  }

  // === CCTV & SECURITY CAMERAS ===
  if (c.includes('cctv') || c.includes('camera')) {
    if (n.includes('solar') || n.includes('4g solar')) return '/products/clear/camera-ptz-solar.webp';
    if (n.includes('doorbell') || n.includes('door phone') || n.includes('ring') || n.includes('chime') || n.includes('intercom') || n.includes('z3') || n.includes('x3')) {
      return '/products/clear/camera-doorbell-video.webp';
    }
    if (n.includes('mini') || n.includes('spy') || n.includes('hidden') || n.includes('pocket') || n.includes('lookcam')) {
      return '/products/clear/camera-mini-spy.webp';
    }
    if (n.includes('dome')) return '/products/clear/camera-dome.webp';
    if (n.includes('bullet')) return '/products/clear/camera-bullet.webp';
    if (n.includes('indoor') || n.includes('baby') || n.includes('tilt') || n.includes('360')) return '/products/clear/camera-ptz-indoor.webp';
    return '/products/clear/camera-ptz-outdoor.webp';
  }

  // === SENSORS & ALARMS ===
  if (c.includes('sensor') || c.includes('alarm')) {
    if (n.includes('door') || n.includes('window') || n.includes('contact') || n.includes('magnetic')) {
      return '/products/clear/sensor-door-window.webp';
    }
    if (n.includes('smoke')) return '/products/clear/sensor-smoke-alarm.webp';
    if (n.includes('gas') || n.includes('lpg') || n.includes('methane')) return '/products/clear/sensor-gas-leak.webp';
    if (n.includes('water') || n.includes('flood') || n.includes('leak')) return '/products/clear/sensor-water-leak.webp';
    if (n.includes('temp') || n.includes('humidity')) return '/products/clear/sensor-temp-humidity.webp';
    if (n.includes('siren') || n.includes('strobe') || n.includes('alarm sound') || n.includes('horn')) return '/products/clear/sensor-siren-strobe.webp';
    if (n.includes('ir') || n.includes('remote') || n.includes('broadlink')) return '/products/clear/remote-ir-universal.webp';
    return '/products/clear/sensor-pir-motion.webp';
  }

  // === CURTAINS & MOTORS ===
  if (c.includes('curtain') || c.includes('motor') || c.includes('blind')) {
    if (n.includes('roller') || n.includes('shade') || n.includes('tubular')) return '/products/clear/curtain-roller-shade.webp';
    if (n.includes('robot')) return '/products/clear/curtain-robot.webp';
    if (n.includes('remote') || n.includes('channel')) return '/products/clear/curtain-remote.webp';
    return '/products/clear/curtain-motor-track.webp';
  }

  // === CONTROL PANELS ===
  if (c.includes('panel') || c.includes('control')) {
    if (n.includes('10') || n.includes('10.1') || n.includes('10 inch')) return '/products/clear/panel-touch-10inch.webp';
    if (n.includes('6') || n.includes('6 inch')) return '/products/clear/panel-touch-6inch.webp';
    if (n.includes('knob') || n.includes('rotary') || n.includes('dial')) return '/products/clear/panel-rotary-knob.webp';
    return '/products/clear/panel-touch-4inch.webp';
  }

  // === AUDIO & INTERCOM ===
  if (c.includes('audio') || c.includes('speaker') || c.includes('intercom') || c.includes('sound')) {
    if (n.includes('amplifier') || n.includes('f6') || n.includes('f7') || n.includes('f8') || n.includes('bt audio') || n.includes('p8')) {
      return '/products/clear/audio-wall-amplifier.webp';
    }
    if (n.includes('echo show')) return '/products/clear/echo-show-screen.webp';
    if (n.includes('echo dot') || n.includes('echo pop') || n.includes('echo spot')) return '/products/clear/echo-dot-speaker.webp';
    if (n.includes('nest') || n.includes('google')) return '/products/clear/google-nest-speaker.webp';
    if (n.includes('hivi')) return '/products/clear/speaker-hivi-sound.webp';
    return '/products/clear/speaker-ceiling-coaxial.webp';
  }

  // === LIGHTING & TRACK ===
  if (c.includes('light') || c.includes('track') || c.includes('lamp')) {
    if (n.includes('flood')) return '/products/clear/track-linear-flood.webp';
    if (n.includes('spot') || n.includes('grille') || n.includes('zoomable') || n.includes('pendant')) {
      return '/products/clear/track-spotlight-led.webp';
    }
    if (n.includes('stair') || n.includes('step')) return '/products/clear/stair-step-lighting.webp';
    return '/products/clear/track-magnetic-rail.webp';
  }

  // === GATEWAYS & NETWORKING ===
  if (c.includes('gateway') || c.includes('network') || c.includes('mesh')) {
    if (n.includes('poe') || n.includes('port') || n.includes('switch')) return '/products/clear/switch-poe-network.webp';
    if (n.includes('repeater') || n.includes('extender') || n.includes('wifi signal') || n.includes('staniot')) return '/products/clear/wifi-mesh-repeater.webp';
    return '/products/clear/gateway-zigbee-hub.webp';
  }

  // === BREAKERS & ENERGY ===
  if (c.includes('breaker') || c.includes('energy') || c.includes('meter')) {
    if (n.includes('meter') || n.includes('display')) return '/products/clear/meter-digital-power.webp';
    return '/products/clear/breaker-smart-mcb.webp';
  }

  // === HOTEL & COMMERCIAL ===
  if (c.includes('hotel') || c.includes('commercial')) {
    if (n.includes('vacuum') || n.includes('wet and dry') || n.includes('cleaner') || n.includes('robot')) return '/products/clear/vacuum-robot-smart.webp';
    return '/products/clear/hotel-keycard-switch.webp';
  }

  // === INVERTERS & SOLAR HARDWARE ===
  if (c.includes('inverter')) {
    if (n.includes('deye')) return '/products/clear/inverter-deye-hybrid.webp';
    return '/products/clear/inverter-growatt-must.webp';
  }

  if (c.includes('batter')) {
    if (n.includes('felicity')) return '/products/clear/battery-felicity-lifepo4.webp';
    return '/products/clear/battery-powerwall-rack.webp';
  }

  if (c.includes('panel')) {
    if (n.includes('longi')) return '/products/clear/panel-longi-solar.webp';
    return '/products/clear/panel-canadian-solar.webp';
  }

  return '/products/clear/switch-2gang-white.webp';
}

function updateMinisimCatalog() {
  const filePath = path.resolve('./src/data/minisimProducts.ts');
  let content = fs.readFileSync(filePath, 'utf-8');

  // Match each product object and update its image_url
  let updatedCount = 0;
  content = content.replace(
    /("id":\s*"[^"]+",\s*"name":\s*"([^"]+)",\s*"category":\s*"([^"]+)",[\s\S]*?"image_url":\s*)"([^"]+)"/g,
    (match, prefix, name, category, oldUrl) => {
      const newUrl = getClearImageForProduct(name, category);
      updatedCount++;
      return `${prefix}"${newUrl}"`;
    }
  );

  fs.writeFileSync(filePath, content, 'utf-8');
  console.log(`Updated ${updatedCount} products in minisimProducts.ts with clear high-resolution images!`);
}

function updateCoreProducts() {
  const filePath = path.resolve('./src/data/products.ts');
  let content = fs.readFileSync(filePath, 'utf-8');

  // Inverters
  content = content.replace(
    /image_url:\s*"\/src\/assets\/bg-panel-closeup\.jpg"/g,
    'image_url: "/products/clear/inverter-deye-hybrid.webp"'
  );
  content = content.replace(
    /image_url:\s*"\/src\/assets\/offer-solar\.jpg"/g,
    'image_url: "/products/clear/inverter-growatt-must.webp"'
  );
  content = content.replace(
    /image_url:\s*"\/src\/assets\/cat-solar\.jpg"/g,
    'image_url: "/products/clear/inverter-deye-hybrid.webp"'
  );

  // Batteries
  content = content.replace(
    /image_url:\s*"\/src\/assets\/feature-battery\.jpg"/g,
    'image_url: "/products/clear/battery-felicity-lifepo4.webp"'
  );
  content = content.replace(
    /image_url:\s*"\/src\/assets\/bg-bundle\.jpg"/g,
    'image_url: "/products/clear/battery-powerwall-rack.webp"'
  );
  content = content.replace(
    /image_url:\s*"\/src\/assets\/bg-circuit\.jpg"/g,
    'image_url: "/products/clear/battery-powerwall-rack.webp"'
  );

  // Solar panels
  content = content.replace(
    /image_url:\s*"\/src\/assets\/feature-solar-panel\.jpg"/g,
    'image_url: "/products/clear/panel-longi-solar.webp"'
  );
  content = content.replace(
    /image_url:\s*"\/src\/assets\/bg-commercial-solar\.jpg"/g,
    'image_url: "/products/clear/panel-canadian-solar.webp"'
  );

  // Smart locks
  content = content.replace(
    /image_url:\s*"\/src\/assets\/bg-smartlock-elite\.jpg"/g,
    'image_url: "/products/clear/lock-face-recognition.webp"'
  );
  content = content.replace(
    /image_url:\s*"\/src\/assets\/bg-smartlock-apex\.jpg"/g,
    'image_url: "/products/clear/lock-fingerprint-handle.webp"'
  );
  content = content.replace(
    /image_url:\s*"\/src\/assets\/bg-smartlock-pro\.jpg"/g,
    'image_url: "/products/clear/lock-slim-aluminum.webp"'
  );
  content = content.replace(
    /image_url:\s*"\/src\/assets\/bg-smartlock-base\.jpg"/g,
    'image_url: "/products/clear/lock-fingerprint-handle.webp"'
  );
  content = content.replace(
    /image_url:\s*"\/src\/assets\/bg-smartlock-accessory\.jpg"/g,
    'image_url: "/products/clear/lock-padlock-smart.webp"'
  );
  content = content.replace(
    /image_url:\s*"\/src\/assets\/bg-smartlock-hotel\.jpg"/g,
    'image_url: "/products/clear/lock-hotel-rfid.webp"'
  );

  // CCTV
  content = content.replace(
    /image_url:\s*"\/src\/assets\/feature-cctv\.jpg"/g,
    'image_url: "/products/clear/camera-ptz-outdoor.webp"'
  );
  content = content.replace(
    /image_url:\s*"\/src\/assets\/feature-security\.jpg"/g,
    'image_url: "/products/clear/camera-ptz-solar.webp"'
  );
  content = content.replace(
    /image_url:\s*"\/src\/assets\/offer-security\.jpg"/g,
    'image_url: "/products/clear/camera-dome.webp"'
  );

  fs.writeFileSync(filePath, content, 'utf-8');
  console.log('Updated core products in products.ts with clear high-resolution images!');
}

updateMinisimCatalog();
updateCoreProducts();
