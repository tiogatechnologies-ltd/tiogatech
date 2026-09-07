import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

// High-resolution image sources for all hardware archetypes
export const IMAGE_SOURCES = {
  // === SMART SWITCHES & SOCKETS ===
  'switch-1gang-white': 'https://images.unsplash.com/photo-1558002038-1055907df827?w=1000&auto=format&fit=crop&q=85',
  'switch-2gang-white': 'https://images.unsplash.com/photo-1583691028182-e8f01e74bfa2?w=1000&auto=format&fit=crop&q=85',
  'switch-3gang-white': 'https://images.unsplash.com/photo-1602503874881-c97c18856ae6?w=1000&auto=format&fit=crop&q=85',
  'switch-4gang-white': 'https://images.unsplash.com/photo-1666401565408-9b6b0741f0d6?w=1000&auto=format&fit=crop&q=85',
  'switch-touch-black': 'https://images.unsplash.com/photo-1577793093235-c653e83d29ba?w=1000&auto=format&fit=crop&q=85',
  'switch-dimmer': 'https://images.unsplash.com/photo-1558002038-1055907df827?w=1000&auto=format&fit=crop&q=85',
  'switch-scene': 'https://images.unsplash.com/photo-1602503874881-c97c18856ae6?w=1000&auto=format&fit=crop&q=85',
  'switch-heater-ac': 'https://images.unsplash.com/photo-1610056494052-6a4f83a8368c?w=1000&auto=format&fit=crop&q=85',
  'socket-single-universal': 'https://images.unsplash.com/photo-1610056494052-6a4f83a8368c?w=1000&auto=format&fit=crop&q=85',
  'socket-double': 'https://images.unsplash.com/photo-1610056494052-6a4f83a8368c?w=1000&auto=format&fit=crop&q=85',
  'socket-popup': 'https://images.unsplash.com/photo-1610056494052-6a4f83a8368c?w=1000&auto=format&fit=crop&q=85',
  'plug-smart-wifi': 'https://images.unsplash.com/photo-1610056494052-6a4f83a8368c?w=1000&auto=format&fit=crop&q=85',
  'power-strip-smart': 'https://images.unsplash.com/photo-1610056494052-6a4f83a8368c?w=1000&auto=format&fit=crop&q=85',

  // === SMART LOCKS ===
  'lock-face-recognition': 'https://images.unsplash.com/photo-1558002038-1055907df827?w=1000&auto=format&fit=crop&q=85',
  'lock-fingerprint-handle': 'https://images.unsplash.com/photo-1583691028182-e8f01e74bfa2?w=1000&auto=format&fit=crop&q=85',
  'lock-slim-aluminum': 'https://images.unsplash.com/photo-1583691028182-e8f01e74bfa2?w=1000&auto=format&fit=crop&q=85',
  'lock-glass-door': 'https://images.unsplash.com/photo-1558002038-1055907df827?w=1000&auto=format&fit=crop&q=85',
  'lock-padlock-smart': 'https://images.unsplash.com/photo-1555529902-5261145633bf?w=1000&auto=format&fit=crop&q=85',
  'lock-hotel-rfid': 'https://images.unsplash.com/photo-1583691028182-e8f01e74bfa2?w=1000&auto=format&fit=crop&q=85',

  // === CCTV & SECURITY CAMERAS ===
  'camera-ptz-solar': 'https://images.unsplash.com/photo-1589935447067-5531094415d1?w=1000&auto=format&fit=crop&q=85',
  'camera-ptz-outdoor': 'https://images.unsplash.com/photo-1589935447067-5531094415d1?w=1000&auto=format&fit=crop&q=85',
  'camera-ptz-indoor': 'https://images.unsplash.com/photo-1618482914248-29272d021005?w=1000&auto=format&fit=crop&q=85',
  'camera-dome': 'https://images.unsplash.com/photo-1618482914248-29272d021005?w=1000&auto=format&fit=crop&q=85',
  'camera-bullet': 'https://images.unsplash.com/photo-1589935447067-5531094415d1?w=1000&auto=format&fit=crop&q=85',
  'camera-doorbell-video': 'https://images.unsplash.com/photo-1558002038-1055907df827?w=1000&auto=format&fit=crop&q=85',
  'camera-mini-spy': 'https://images.unsplash.com/photo-1618482914248-29272d021005?w=1000&auto=format&fit=crop&q=85',

  // === SENSORS & ALARMS ===
  'sensor-pir-motion': 'https://images.unsplash.com/photo-1722488359737-7a9b8a8436c7?w=1000&auto=format&fit=crop&q=85',
  'sensor-door-window': 'https://images.unsplash.com/photo-1722488359737-7a9b8a8436c7?w=1000&auto=format&fit=crop&q=85',
  'sensor-smoke-alarm': 'https://images.unsplash.com/photo-1722488359737-7a9b8a8436c7?w=1000&auto=format&fit=crop&q=85',
  'sensor-gas-leak': 'https://images.unsplash.com/photo-1722488359737-7a9b8a8436c7?w=1000&auto=format&fit=crop&q=85',
  'sensor-water-leak': 'https://images.unsplash.com/photo-1722488359737-7a9b8a8436c7?w=1000&auto=format&fit=crop&q=85',
  'sensor-temp-humidity': 'https://images.unsplash.com/photo-1722488359737-7a9b8a8436c7?w=1000&auto=format&fit=crop&q=85',
  'sensor-siren-strobe': 'https://images.unsplash.com/photo-1722488359737-7a9b8a8436c7?w=1000&auto=format&fit=crop&q=85',
  'remote-ir-universal': 'https://images.unsplash.com/photo-1602503874881-c97c18856ae6?w=1000&auto=format&fit=crop&q=85',

  // === CURTAINS & MOTORS ===
  'curtain-motor-track': 'https://images.unsplash.com/photo-1528822855841-e8bf3134cdc9?w=1000&auto=format&fit=crop&q=85',
  'curtain-roller-shade': 'https://images.unsplash.com/photo-1528822855841-e8bf3134cdc9?w=1000&auto=format&fit=crop&q=85',
  'curtain-robot': 'https://images.unsplash.com/photo-1528822855841-e8bf3134cdc9?w=1000&auto=format&fit=crop&q=85',
  'curtain-remote': 'https://images.unsplash.com/photo-1602503874881-c97c18856ae6?w=1000&auto=format&fit=crop&q=85',

  // === CONTROL PANELS ===
  'panel-touch-4inch': 'https://images.unsplash.com/photo-1650682009477-52fd77302b78?w=1000&auto=format&fit=crop&q=85',
  'panel-touch-6inch': 'https://images.unsplash.com/photo-1650682009477-52fd77302b78?w=1000&auto=format&fit=crop&q=85',
  'panel-touch-10inch': 'https://images.unsplash.com/photo-1650682009477-52fd77302b78?w=1000&auto=format&fit=crop&q=85',
  'panel-rotary-knob': 'https://images.unsplash.com/photo-1602503874881-c97c18856ae6?w=1000&auto=format&fit=crop&q=85',

  // === AUDIO & INTERCOM ===
  'audio-wall-amplifier': 'https://images.unsplash.com/photo-1650682009477-52fd77302b78?w=1000&auto=format&fit=crop&q=85',
  'speaker-ceiling-coaxial': 'https://images.unsplash.com/photo-1510766315117-0f791eb90af7?w=1000&auto=format&fit=crop&q=85',
  'speaker-hivi-sound': 'https://images.unsplash.com/photo-1510766315117-0f791eb90af7?w=1000&auto=format&fit=crop&q=85',
  'echo-show-screen': 'https://images.unsplash.com/photo-1650682009477-52fd77302b78?w=1000&auto=format&fit=crop&q=85',
  'echo-dot-speaker': 'https://images.unsplash.com/photo-1519558260268-cde7e03a0152?w=1000&auto=format&fit=crop&q=85',
  'google-nest-speaker': 'https://images.unsplash.com/photo-1519558260268-cde7e03a0152?w=1000&auto=format&fit=crop&q=85',

  // === LIGHTING & TRACK ===
  'track-magnetic-rail': 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=1000&auto=format&fit=crop&q=85',
  'track-spotlight-led': 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=1000&auto=format&fit=crop&q=85',
  'track-linear-flood': 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=1000&auto=format&fit=crop&q=85',
  'stair-step-lighting': 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=1000&auto=format&fit=crop&q=85',

  // === GATEWAYS & NETWORKING ===
  'gateway-zigbee-hub': 'https://images.unsplash.com/photo-1602503874881-c97c18856ae6?w=1000&auto=format&fit=crop&q=85',
  'switch-poe-network': 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=1000&auto=format&fit=crop&q=85',
  'wifi-mesh-repeater': 'https://images.unsplash.com/photo-1602503874881-c97c18856ae6?w=1000&auto=format&fit=crop&q=85',

  // === SMART BREAKERS & COMMERCIAL ===
  'breaker-smart-mcb': 'https://images.unsplash.com/photo-1602503874881-c97c18856ae6?w=1000&auto=format&fit=crop&q=85',
  'meter-digital-power': 'https://images.unsplash.com/photo-1602503874881-c97c18856ae6?w=1000&auto=format&fit=crop&q=85',
  'vacuum-robot-smart': 'https://images.unsplash.com/photo-1558317374-067fb5f30001?w=1000&auto=format&fit=crop&q=85',
  'hotel-keycard-switch': 'https://images.unsplash.com/photo-1558002038-1055907df827?w=1000&auto=format&fit=crop&q=85',

  // === SOLAR INVERTERS, BATTERIES & PANELS ===
  'inverter-deye-hybrid': 'https://de.deyeinverter.com/deyeinverter/2024/06/01/sun-3.6-6k-sg03lp1.png',
  'inverter-growatt-must': 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=1000&auto=format&fit=crop&q=85',
  'battery-felicity-lifepo4': 'https://www.felicitysolar.com/wp-content/uploads/2025/05/LPBF48100-A.423.png',
  'battery-powerwall-rack': 'https://images.unsplash.com/photo-1558441719-8b449c6ff673?w=1000&auto=format&fit=crop&q=85',
  'panel-longi-solar': 'https://static.longi.com/Hi_MO_5_en_190d57401b.jpg',
  'panel-canadian-solar': 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=1000&auto=format&fit=crop&q=85'
};
