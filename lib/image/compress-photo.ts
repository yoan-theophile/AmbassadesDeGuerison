import sharp from 'sharp';

// Compression — évite de saturer le quota Storage (1 Go, plan Supabase gratuit).
// Photo de profil : recadrée en carré (usage avatar). Photo de lieu : conservée
// dans ses proportions (scène, pas un avatar), juste plafonnée en dimension.
export async function compressAmbassadorPhoto(buffer: Buffer, type: 'profile' | 'room'): Promise<Buffer> {
  const pipeline = sharp(buffer).rotate(); // rotate() sans argument = auto-orient via EXIF
  if (type === 'profile') {
    return pipeline.resize(512, 512, { fit: 'cover' }).webp({ quality: 80 }).toBuffer();
  }
  return pipeline.resize(1200, 1200, { fit: 'inside', withoutEnlargement: true }).webp({ quality: 80 }).toBuffer();
}
