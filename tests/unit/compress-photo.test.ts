import { describe, it, expect } from 'vitest';
import sharp from 'sharp';
import { compressAmbassadorPhoto } from '@/lib/image/compress-photo';

async function makeTestImage(width: number, height: number): Promise<Buffer> {
  return sharp({
    create: { width, height, channels: 3, background: { r: 100, g: 120, b: 200 } },
  })
    .jpeg()
    .toBuffer();
}

describe('compressAmbassadorPhoto', () => {
  it('redimensionne une photo de profil en carré 512x512 WebP', async () => {
    const input = await makeTestImage(2000, 1500);
    const output = await compressAmbassadorPhoto(input, 'profile');
    const meta = await sharp(output).metadata();
    expect(meta.format).toBe('webp');
    expect(meta.width).toBe(512);
    expect(meta.height).toBe(512);
  });

  it('conserve les proportions d\'une photo de lieu, plafonnée à 1200px', async () => {
    const input = await makeTestImage(3000, 1500); // ratio 2:1
    const output = await compressAmbassadorPhoto(input, 'room');
    const meta = await sharp(output).metadata();
    expect(meta.format).toBe('webp');
    expect(meta.width).toBe(1200);
    expect(meta.height).toBe(600);
  });

  it('n\'agrandit pas une photo de lieu plus petite que 1200px', async () => {
    const input = await makeTestImage(400, 300);
    const output = await compressAmbassadorPhoto(input, 'room');
    const meta = await sharp(output).metadata();
    expect(meta.width).toBe(400);
    expect(meta.height).toBe(300);
  });

  it('réduit significativement la taille du fichier', async () => {
    const input = await makeTestImage(2000, 2000);
    const output = await compressAmbassadorPhoto(input, 'profile');
    expect(output.length).toBeLessThan(input.length);
  });

  it('rejette une entrée qui n\'est pas une image (buffer invalide)', async () => {
    const garbage = Buffer.from('ceci ne ressemble pas à une image');
    await expect(compressAmbassadorPhoto(garbage, 'profile')).rejects.toThrow();
  });
});
