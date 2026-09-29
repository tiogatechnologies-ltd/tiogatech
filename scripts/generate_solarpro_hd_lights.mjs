import fs from 'fs';
import sharp from 'sharp';

const lights = [
  {
    name: 'solarpro-light-s6-100w.webp',
    src: 'scripts/solarpro_test_lights/S6.png'
  },
  {
    name: 'solarpro-light-s7-120w.webp',
    src: 'scripts/solarpro_test_lights/S7.png'
  },
  {
    name: 'solarpro-light-i6-100w.webp',
    src: 'scripts/solarpro_test_lights/I6.png'
  },
  {
    name: 'solarpro-light-r1-60w.webp',
    src: 'scripts/r1_extracted/r1_product_cutout_46.png'
  },
  {
    name: 'solarpro-light-r3-100w.webp',
    src: 'scripts/solarpro_test_lights/R3.png'
  },
  {
    name: 'solarpro-light-r4-120w.webp',
    src: 'scripts/solarpro_test_lights/R4.png'
  },
  {
    name: 'solarpro-light-sp-fl-300w.webp',
    src: 'scripts/solarpro_test_lights/flood_col170.png'
  }
];

async function generateLights() {
  for (const item of lights) {
    const inputBuf = fs.readFileSync(item.src);
    // Trim transparent margins
    const trimmed = await sharp(inputBuf).trim().toBuffer();
    
    // Resize to fit inside 700x700
    const resized = await sharp(trimmed)
      .resize(700, 700, { fit: 'inside' })
      .toBuffer();
      
    // Place on 800x800 white background
    const finalImg = await sharp({
      create: {
        width: 800,
        height: 800,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      }
    })
    .composite([{ input: resized, gravity: 'center' }])
    .webp({ quality: 95 })
    .toBuffer();
    
    const target = `public/products/solarpro/${item.name}`;
    fs.writeFileSync(target, finalImg);
    
    const meta = await sharp(finalImg).metadata();
    const stats = await sharp(finalImg).stats();
    const mean = Math.round(stats.channels.slice(0, 3).reduce((a, b) => a + b.mean, 0) / 3);
    console.log(`Generated: ${item.name} (${(finalImg.length / 1024).toFixed(1)} KB, mean brightness: ${mean})`);
  }
}

generateLights();
