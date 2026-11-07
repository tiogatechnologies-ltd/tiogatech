import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { PRODUCTS } from '@/data/products';
import { resolveProductImage, isRepresentativeProductImage, PRODUCT_PHOTO_PENDING } from '@/lib/productImages';
import brandCorrections from '../../docs/image-audit-2026-10-29/brand-corrections.json';

import { photoBrandKey } from '@/lib/productPhotoIdentity';

describe('Comprehensive Retail Catalog Image Audit', () => {
  it('every retail product has an authentic image that exists on disk and is not pending', () => {
    expect(PRODUCTS.length).toBeGreaterThanOrEqual(1440);

    const missingOriginal: string[] = [];
    const missingResolved: string[] = [];
    const pendingImages: string[] = [];
    const emptyFiles: string[] = [];

    for (const p of PRODUCTS) {
      if (!p.image_url) {
        missingOriginal.push(`${p.name} (${p.id})`);
        continue;
      }

      const originalDiskPath = path.resolve('public' + p.image_url.trim());
      if (!fs.existsSync(originalDiskPath)) {
        missingOriginal.push(`${p.name} (${p.id}) -> ${p.image_url}`);
      } else {
        const stat = fs.statSync(originalDiskPath);
        if (stat.size === 0) {
          emptyFiles.push(`${p.name} (${p.id}) -> ${p.image_url}`);
        }
      }

      const resolved = resolveProductImage(p.image_url, p.category, p.name);
      if (resolved === PRODUCT_PHOTO_PENDING || resolved.includes('photo-pending')) {
        pendingImages.push(`${p.name} (${p.id}) -> ${resolved}`);
      }

      const resolvedDiskPath = path.resolve('public' + resolved);
      if (!fs.existsSync(resolvedDiskPath)) {
        missingResolved.push(`${p.name} (${p.id}) -> ${resolved}`);
      }
    }

    expect(missingOriginal, `Missing original images: ${missingOriginal.slice(0, 10).join(', ')}`).toHaveLength(0);
    expect(emptyFiles, `Empty 0-byte images: ${emptyFiles.slice(0, 10).join(', ')}`).toHaveLength(0);
    expect(pendingImages, `Pending images: ${pendingImages.slice(0, 10).join(', ')}`).toHaveLength(0);
    expect(missingResolved, `Missing resolved images: ${missingResolved.slice(0, 10).join(', ')}`).toHaveLength(0);
  });

  it('no product image uses cross-brand substitutions or fake placeholder images', () => {
    const corrections = brandCorrections as Record<string, { brand: string; image: string }>;
    const brandMismatches: string[] = [];

    for (const p of PRODUCTS) {
      const resolved = resolveProductImage(p.image_url, p.category, p.name);
      const original = p.image_url?.trim() || '';

      // Check if this image has a recorded brand correction
      if (corrections[original]) {
        const expectedBrand = photoBrandKey(corrections[original].brand);
        const productBrand = photoBrandKey(p.brand || '');
        if (productBrand && expectedBrand !== productBrand) {
          brandMismatches.push(`${p.name} (Brand: ${p.brand}, Correction brand: ${corrections[original].brand})`);
        }
      }

      // Check that LifeSmart products strictly use LifeSmart images
      if (p.brand?.toLowerCase() === 'lifesmart' && !resolved.startsWith('/products/lifesmart/')) {
        brandMismatches.push(`${p.name} -> ${resolved}`);
      }

      // Check that HDL products strictly use HDL images
      if (p.brand?.toLowerCase() === 'hdl' && !resolved.startsWith('/products/hdl/')) {
        brandMismatches.push(`${p.name} -> ${resolved}`);
      }

      // Check that Minisim smart home products strictly use item images, verified photos, or originals
      if (
        p.id.startsWith('b0000000-') &&
        !resolved.startsWith('/products/items/') &&
        !resolved.startsWith('/products/originals/') &&
        !resolved.startsWith('/products/verified/')
      ) {
        brandMismatches.push(`${p.name} -> ${resolved}`);
      }
    }

    expect(brandMismatches, `Cross-brand mismatches: ${brandMismatches.slice(0, 10).join(', ')}`).toHaveLength(0);
  });

  it('ensures high quality resolution across all product images (>200px and valid formats)', async () => {
    // Spot-check across distinct catalogue slices
    const sampleProducts = [
      ...PRODUCTS.filter(p => p.brand === 'LifeSmart').slice(0, 10),
      ...PRODUCTS.filter(p => p.brand === 'HDL').slice(0, 10),
      ...PRODUCTS.filter(p => p.id.startsWith('b0000000-')).slice(0, 10),
      ...PRODUCTS.filter(p => p.brand === 'Deye').slice(0, 5),
      ...PRODUCTS.filter(p => p.brand === 'Felicity').slice(0, 5),
      ...PRODUCTS.filter(p => p.brand === 'SRNE').slice(0, 5),
    ];

    for (const p of sampleProducts) {
      const resolved = resolveProductImage(p.image_url, p.category, p.name);
      const diskPath = path.resolve('public' + resolved);
      const meta = await sharp(diskPath).metadata();

      expect(meta.width, `${p.name} width`).toBeGreaterThanOrEqual(200);
      expect(meta.height, `${p.name} height`).toBeGreaterThanOrEqual(200);
      expect(['webp', 'png', 'jpeg', 'jpg']).toContain(meta.format);
    }
  });

  it('verifies that representative images are transparently flagged and within acceptable bounds', () => {
    let repCount = 0;
    for (const p of PRODUCTS) {
      if (isRepresentativeProductImage(p.image_url, p.category, p.name)) {
        repCount++;
      }
    }
    // More than 80% of catalog is exact-model matched
    const repPct = (repCount / PRODUCTS.length) * 100;
    expect(repPct).toBeLessThan(20);
  });
});
