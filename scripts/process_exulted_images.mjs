import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import sharp from 'sharp';

const items = [
  {
    sku: 'EXU-BAT-220AH-TUB',
    file: 'exulted-220ah-tubular-battery.webp',
    url: 'https://www.exultedeagles.com/wp-content/uploads/2020/10/Exulted-220ah-Tubular-Single.jpeg'
  },
  {
    sku: 'EXU-BAT-230AH-DEBULL',
    file: 'debull-220ah-tubular-battery.webp',
    url: 'https://www.exultedeagles.com/wp-content/uploads/2021/07/De-bull-Tall-Tubular-230ah.png'
  },
  {
    sku: 'EXU-BAT-200AH-QUANTA-WC',
    file: 'amaron-quanta-200ah-white-carton.webp',
    url: 'https://www.exultedeagles.com/wp-content/uploads/2020/09/quanta1.jpg'
  },
  {
    sku: 'EXU-BAT-200AH-QUANTA-REG',
    file: 'amaron-quanta-200ah-regular.webp',
    url: 'https://www.exultedeagles.com/wp-content/uploads/2024/10/amaron-Current-e1729068086738.jpeg'
  },
  {
    sku: 'EXU-BAT-BC-5K-FLAT',
    file: 'bluecarbon-5kwh-flat-lithium.webp',
    url: 'https://www.exultedeagles.com/wp-content/uploads/2023/05/WhatsApp-Image-2023-04-21-at-16.07.04.jpeg'
  },
  {
    sku: 'EXU-BAT-BC-5K-SLIM',
    file: 'bluecarbon-5kwh-slim-lithium.webp',
    url: 'https://www.exultedeagles.com/wp-content/uploads/2023/04/lithium-Stackable-bannar-1.jpeg'
  },
  {
    sku: 'EXU-BAT-BC-10K-BLOCK',
    file: 'bluecarbon-10kwh-block-lithium.webp',
    url: 'https://www.exultedeagles.com/wp-content/uploads/2024/10/exulted-bluecarbon-lithium.jpeg'
  },
  {
    sku: 'EXU-BAT-BC-15K-BLOCK',
    file: 'bluecarbon-15kwh-block-lithium.webp',
    url: 'https://www.exultedeagles.com/wp-content/uploads/2023/05/exulted-bluecarbon-lithium2b.jpg'
  },
  {
    sku: 'EXU-BAT-BC-10K-SMART',
    file: 'bluecarbon-10kwh-smart-lithium.webp',
    url: 'https://www.exultedeagles.com/wp-content/uploads/2023/05/exulted-bluecarbon-lithiumStack2.jpg'
  },
  {
    sku: 'EXU-BAT-BC-15K-SMART',
    file: 'bluecarbon-15kwh-smart-lithium.webp',
    url: 'https://www.exultedeagles.com/wp-content/uploads/2023/05/exulted-bluecarbon-lithiumStack1.jpg'
  },
  {
    sku: 'EXU-BAT-FT-5K-48V',
    file: 'finetech-5kwh-48v-lithium.webp',
    url: 'https://www.exultedeagles.com/wp-content/uploads/2024/10/Screenshot_20241010_064025_WhatsAppBusiness-e1728730791947.jpg'
  },
  {
    sku: 'EXU-BAT-FT-15K-48V',
    file: 'finetech-15kwh-48v-lithium.webp',
    url: 'https://www.exultedeagles.com/wp-content/uploads/2020/09/10kva-2pcs15kwhLithiumE.jpeg'
  },
  {
    sku: 'EXU-INV-2.5K-TT',
    file: 'exulted-2.5kva-24v-tabletop-inverter.webp',
    url: 'https://www.exultedeagles.com/wp-content/uploads/2016/03/2.5kva.jpeg'
  },
  {
    sku: 'EXU-INV-5K-TT',
    file: 'exulted-5kva-48v-tabletop-inverter.webp',
    url: 'https://www.exultedeagles.com/wp-content/uploads/2020/10/5KVA-48V-PWM.jpeg'
  },
  {
    sku: 'EXU-INV-2K-12V-WM',
    file: 'exulted-2kva-12v-wall-inverter.webp',
    url: 'https://www.exultedeagles.com/wp-content/uploads/2019/10/1kva.jpeg'
  },
  {
    sku: 'EXU-INV-3K-24V-WM',
    file: 'exulted-3kva-24v-mppt-inverter.webp',
    url: 'https://www.exultedeagles.com/wp-content/uploads/2026/03/WhatsApp-Image-2026-03-04-at-10.26.48-AM.jpeg'
  },
  {
    sku: 'EXU-INV-4K-24V-WM',
    file: 'exulted-4kva-24v-mppt-inverter.webp',
    url: 'https://www.exultedeagles.com/wp-content/uploads/2022/12/3.5kva24v.jpg'
  },
  {
    sku: 'EXU-INV-6K-48V-WM',
    file: 'exulted-6kva-48v-mppt-inverter.webp',
    url: 'https://www.exultedeagles.com/wp-content/uploads/2025/12/WhatsApp-Image-2025-12-03-at-10.15.30_67f007b3.jpg'
  },
  {
    sku: 'EXU-INV-10K-48V-WM',
    file: 'exulted-10kva-48v-mppt-inverter.webp',
    url: 'https://www.exultedeagles.com/wp-content/uploads/2026/03/WhatsApp-Image-2026-03-04-at-10.26.20-AM.jpeg'
  },
  {
    sku: 'EXU-INV-12.5K-48V-PAR',
    file: 'exulted-12.5kva-48v-parallel-inverter.webp',
    url: 'https://www.exultedeagles.com/wp-content/uploads/2020/10/10000VA-48V-PWM.jpeg'
  },
  {
    sku: 'EXU-INV-4K-24V-HF',
    file: 'exulted-4kva-24v-hf-inverter.webp',
    url: 'https://www.exultedeagles.com/wp-content/uploads/2020/10/WhatsApp-Image-2025-11-16-at-3.29.33-PM.jpeg'
  },
  {
    sku: 'EXU-INV-6.2K-48V-HF',
    file: 'exulted-6.2kva-48v-hf-inverter.webp',
    url: 'https://www.exultedeagles.com/wp-content/uploads/2020/10/bluecarbon-inverter.jpeg'
  },
  {
    sku: 'EXU-INV-6.2K-48V-HV',
    file: 'exulted-6.2kva-48v-hv-inverter.webp',
    url: 'https://www.exultedeagles.com/wp-content/uploads/2016/03/Revo-VM-Series-exulted.jpeg'
  },
  {
    sku: 'EXU-INV-11K-48V-NP',
    file: 'exulted-11kva-48v-nonparallel-inverter.webp',
    url: 'https://www.exultedeagles.com/wp-content/uploads/2024/09/3kva24v-scaled.jpg'
  },
  {
    sku: 'EXU-INV-11K-48V-PAR',
    file: 'exulted-11kva-48v-parallel-inverter.webp',
    url: 'https://www.exultedeagles.com/wp-content/uploads/2020/09/10kva-2pcs15kwhLithiumC.jpeg'
  },
  {
    sku: 'EXU-PV-460W',
    file: 'exulted-460w-solar-panel.webp',
    url: 'https://www.exultedeagles.com/wp-content/uploads/2020/09/WhatsApp-Image-2020-09-04-at-07.03.32.jpeg'
  },
  {
    sku: 'EXU-PV-550W',
    file: 'exulted-550w-solar-panel.webp',
    url: 'https://www.exultedeagles.com/wp-content/uploads/2020/10/WhatsApp-Image-2020-09-04-at-07.03.33.jpeg'
  },
  {
    sku: 'EXU-PV-620W',
    file: 'exulted-620w-solar-panel.webp',
    url: 'https://www.exultedeagles.com/wp-content/uploads/2020/10/WhatsApp-Image-2020-09-04-at-07.03.32-1.jpeg'
  },
  {
    sku: 'EXU-PV-650W',
    file: 'exulted-650w-solar-panel.webp',
    url: 'https://www.exultedeagles.com/wp-content/uploads/2022/05/combo-4pcs-340w.jpg'
  },
  {
    sku: 'EXU-CC-60A-MPPT',
    file: 'exulted-60a-mppt-charge-controller.webp',
    url: 'https://www.exultedeagles.com/wp-content/uploads/2020/09/mppt_charge_controller.jpg'
  },
  {
    sku: 'EXU-CC-100A-MPPT',
    file: 'exulted-100a-mppt-charge-controller.webp',
    url: 'https://www.inverter.com/images/thumbs/0001873_100-amp-12243648v-mppt-solar-charge-controller_550.jpeg'
  },
  {
    sku: 'EXU-PUMP-SP600',
    file: 'exulted-sp600-solar-pump.webp',
    url: 'https://www.exultedeagles.com/wp-content/uploads/2016/03/WhatsApp-Image-2020-09-04-at-12.08.35.jpeg'
  },
  {
    sku: 'EXU-PUMP-SP5000',
    file: 'exulted-sp5000-solar-pump.webp',
    url: 'https://store.amrutenergy.com/wp-content/uploads/2022/05/5-hp-AC.jpg'
  },
  {
    sku: 'EXU-SL-80W',
    file: 'exulted-80w-solar-streetlight.webp',
    url: 'https://www.exultedeagles.com/wp-content/uploads/2024/09/streetlight14.jpeg'
  },
  {
    sku: 'EXU-SL-100W',
    file: 'exulted-100w-solar-streetlight.webp',
    url: 'https://www.exultedeagles.com/wp-content/uploads/2024/09/streetlight19.jpeg'
  },
  {
    sku: 'EXU-SL-SIMPLICITY',
    file: 'bluecarbon-simplicity-solar-light.webp',
    url: 'https://www.exultedeagles.com/wp-content/uploads/2024/09/streetlight24.jpeg'
  },
  {
    sku: 'EXU-SL-GARDEN',
    file: 'bluecarbon-solar-garden-light.webp',
    url: 'https://www.exultedeagles.com/wp-content/uploads/2020/10/streetlight-4.jpeg'
  },
  {
    sku: 'EXU-CAM-4G-DUAL',
    file: 'exulted-4g-solar-dual-lens-camera.webp',
    url: 'https://channelcctvsecurity.com/wp-content/uploads/2024/10/ptz-4g-10x-zoom-camera.jpg'
  },
  {
    sku: 'EXU-GATE-SLIDING-650',
    file: 'exulted-automatic-sliding-gate-opener.webp',
    url: 'https://datacommexpress.com/wp-content/uploads/2020/05/sliding-autogate-xlg-1.jpg'
  },
  {
    sku: 'ECO-RIVER2-256',
    file: 'ecoflow-river-2-256wh.webp',
    url: 'https://eu.ecoflow.com/cdn/shop/products/ecoflow-river-2-portable-power-station-42462876860580.png?v=1721633707'
  },
  {
    sku: 'ECO-RIVER-288',
    file: 'ecoflow-river-288wh.webp',
    url: 'https://us.ecoflow.com/cdn/shop/products/ecoflow-ecoflow-river-portable-power-station-30042728071241.png?v=1667469335'
  }
];

async function run() {
  const outputDir = path.resolve('public/products/exulted');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const generatedHashes = new Map();

  for (const item of items) {
    console.log(`Downloading ${item.sku} from ${item.url}...`);
    const res = await fetch(item.url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!res.ok) {
      throw new Error(`Failed to download ${item.url}: status ${res.status}`);
    }

    const arrayBuffer = await res.arrayBuffer();
    const rawBuffer = Buffer.from(arrayBuffer);

    // Resize and pad onto 800x800 crisp white canvas
    const resized = await sharp(rawBuffer)
      .resize(720, 720, { fit: 'inside' })
      .toBuffer();

    const finalImage = await sharp({
      create: {
        width: 800,
        height: 800,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      }
    })
      .composite([{ input: resized, gravity: 'center' }])
      .webp({ quality: 92 })
      .toBuffer();

    const targetPath = path.join(outputDir, item.file);
    fs.writeFileSync(targetPath, finalImage);

    const hash = crypto.createHash('sha256').update(finalImage).digest('hex');
    if (generatedHashes.has(hash)) {
      console.warn(`WARNING: Duplicate hash detected between ${generatedHashes.get(hash)} and ${item.file}`);
    }
    generatedHashes.set(hash, item.file);
    console.log(`Saved ${item.file} (${finalImage.length} bytes, hash: ${hash.slice(0, 10)}...)`);
  }

  console.log(`\nAll ${items.length} images processed! Unique hashes: ${generatedHashes.size}/${items.length}`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
