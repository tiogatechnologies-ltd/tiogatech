import fs from 'fs';
import sharp from 'sharp';

const ess = [
  {
    name: 'solarpro-bat-15kwh-48v.webp',
    src: 'public/products/solarpro/solarpro-bat-15kwh.webp'
  },
  {
    name: 'solarpro-ess-60kwh-hv.webp',
    src: 'public/products/solarpro/solarpro-ess-60kwh.webp'
  },
  {
    name: 'solarpro-ess-125kwh-hv.webp',
    src: 'public/products/solarpro/solarpro-ess-125kwh.webp'
  }
];

async function generateEss() {
  for (const item of ess) {
    const inputBuf = fs.readFileSync(item.src);
    const trimmed = await sharp(inputBuf).trim().toBuffer();
    const resized = await sharp(trimmed)
      .resize(700, 700, { fit: 'inside' })
      .toBuffer();
      
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
    
    const stats = await sharp(finalImg).stats();
    const mean = Math.round(stats.channels.slice(0, 3).reduce((a, b) => a + b.mean, 0) / 3);
    console.log(`Generated: ${item.name} (${(finalImg.length / 1024).toFixed(1)} KB, mean brightness: ${mean})`);
  }
}

generateEss();
