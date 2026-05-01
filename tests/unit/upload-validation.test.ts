import { describe, it, expect } from 'vitest';

// Logique de validation extraite de /api/upload/ambassador-photo

const MAX_SIZE_BYTES = 5 * 1024 * 1024;
const VALID_TYPES = ['profile', 'room'] as const;

function validateUpload(
  fileType: string,
  fileSize: number,
  type: unknown,
): { ok: boolean; status: number; error?: string } {
  if (!VALID_TYPES.includes(type as 'profile' | 'room')) {
    return { ok: false, status: 400, error: 'Type invalide' };
  }
  if (!fileType.startsWith('image/')) {
    return { ok: false, status: 400, error: 'Seules les images sont acceptées' };
  }
  if (fileSize > MAX_SIZE_BYTES) {
    return { ok: false, status: 400, error: 'Fichier trop volumineux (max 5 Mo)' };
  }
  return { ok: true, status: 200 };
}

describe('Upload — validation', () => {
  it('accepte une image JPEG de 2 Mo pour le profil', () => {
    const r = validateUpload('image/jpeg', 2 * 1024 * 1024, 'profile');
    expect(r.ok).toBe(true);
  });

  it('accepte une image PNG pour la salle', () => {
    const r = validateUpload('image/png', 1024, 'room');
    expect(r.ok).toBe(true);
  });

  it('rejette un PDF', () => {
    const r = validateUpload('application/pdf', 1024, 'profile');
    expect(r.ok).toBe(false);
    expect(r.status).toBe(400);
    expect(r.error).toContain('images');
  });

  it('rejette un fichier > 5 Mo', () => {
    const r = validateUpload('image/jpeg', 6 * 1024 * 1024, 'profile');
    expect(r.ok).toBe(false);
    expect(r.status).toBe(400);
    expect(r.error).toContain('5 Mo');
  });

  it('rejette un type inconnu', () => {
    const r = validateUpload('image/jpeg', 1024, 'banner');
    expect(r.ok).toBe(false);
    expect(r.status).toBe(400);
  });

  it('accepte exactement 5 Mo', () => {
    const r = validateUpload('image/jpeg', MAX_SIZE_BYTES, 'room');
    expect(r.ok).toBe(true);
  });

  it('rejette 5 Mo + 1 octet', () => {
    const r = validateUpload('image/jpeg', MAX_SIZE_BYTES + 1, 'room');
    expect(r.ok).toBe(false);
  });
});

describe('Upload — room_photo_urls limite', () => {
  function canAddPhoto(existing: number): { ok: boolean; error?: string } {
    if (existing >= 5) return { ok: false, error: 'Maximum 5 photos de salle atteint' };
    return { ok: true };
  }

  it('autorise jusqu\'à 4 photos existantes', () => {
    expect(canAddPhoto(4).ok).toBe(true);
  });

  it('bloque à partir de 5 photos', () => {
    const r = canAddPhoto(5);
    expect(r.ok).toBe(false);
    expect(r.error).toContain('5');
  });

  it('bloque aussi avec 10 photos (protection double)', () => {
    expect(canAddPhoto(10).ok).toBe(false);
  });
});
