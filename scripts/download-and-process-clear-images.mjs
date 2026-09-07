import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { IMAGE_SOURCES } from './image-sources.mjs';

const OUT_DIR = path.resolve('./public/products/clear');
if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

async function downloadImage(url, key) {
  const outPath = path.join(OUT_DIR, `${key}.webp`);
  try {
    console.log(`Downloading [${key}] from ${url.substring(0, 60)}...`);
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8'
      }
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status} ${res.statusText}`);
    }

    const buffer = Buffer.from(await res.arrayBuffer());
    if (buffer.length < 500) {
      throw new Error(`Downloaded buffer too small (${buffer.length} bytes)`);
    }

    // Process with Sharp to 800x800 high-resolution WebP
    await sharp(buffer)
      .resize(800, 800, {
        fit: 'cover',
        position: 'center'
      })
      .webp({ quality: 88 })
      .toFile(outPath);

    const meta = await sharp(outPath).metadata();
    const stat = fs.statSync(outPath);
    console.log(`✓ [${key}] saved successfully (${meta.width}x${meta.height}, ${(stat.size/1024).toFixed(1)} KB)`);
    return true;
  } catch (err) {
    console.warn(`✗ Error downloading [${key}]: ${err.message}`);
    // If external download fails, create a high-quality crisp fallback
    try {
      // Create an elegant, crisp 800x800 gradient hardware preview
      const fallbackSvg = `
        <svg width="800" height="800" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#0f172a" />
              <stop offset="50%" stop-color="#1e293b" />
              <stop offset="100%" stop-color="#334155" />
            </linearGradient>
            <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stop-color="#f59e0b" />
              <stop offset="100%" stop-color="#fbbf24" />
            </linearGradient>
          </defs>
          <rect width="800" height="800" fill="url(#g)" />
          <circle cx="400" cy="380" r="220" fill="#1e293b" stroke="#38bdf8" stroke-width="4" stroke-dasharray="10 5" opacity="0.4" />
          <text x="400" y="360" font-family="system-ui, -apple-system, sans-serif" font-size="44" font-weight="bold" fill="#ffffff" text-anchor="middle">TIOGA SMART</text>
          <text x="400" y="420" font-family="system-ui, -apple-system, sans-serif" font-size="28" font-weight="600" fill="url(#gold)" text-anchor="middle">${key.toUpperCase().replace(/-/g, ' ')}</text>
          <text x="400" y="480" font-family="system-ui, -apple-system, sans-serif" font-size="20" fill="#94a3b8" text-anchor="middle">Certified Tier-1 Smart Hardware</text>
        </svg>
      `;
      await sharp(Buffer.from(fallbackSvg))
        .webp({ quality: 90 })
        .toFile(outPath);
      console.log(`✓ [${key}] fallback generated`);
      return true;
    } catch(e) {
      console.error(`Fatal fallback error for [${key}]:`, e);
      return false;
    }
  }
}

async function run() {
  const entries = Object.entries(IMAGE_SOURCES);
  console.log(`Starting processing for ${entries.length} hardware image archetypes...`);
  
  for (const [key, url] of entries) {
    await downloadImage(url, key);
  }
  
  console.log('\nAll archetypes processed!');
}

run();
