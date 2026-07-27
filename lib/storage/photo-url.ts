import { createServiceClient } from '@/lib/supabase/server';

const BUCKET = 'ambassador-photos';

export async function getAdminPhotoUrl(path: string): Promise<string | null> {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  const supabase = createServiceClient();
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 3600);
  if (error) return null;
  return data.signedUrl;
}

export async function getOwnerPhotoUrl(path: string): Promise<string | null> {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  const supabase = createServiceClient();
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 900);
  if (error) return null;
  return data.signedUrl;
}

// Carte publique — durée longue (24h). `/api/host-activations` est pollée
// toutes les 5-30s côté client : sans cache, on regénérerait une signed URL
// différente à chaque poll, cassant le cache image du navigateur (re-download
// inutile de la même photo pour un visiteur qui a la carte ouverte plusieurs
// minutes). Cache mémoire par instance de fonction (Fluid Compute réutilise
// l'instance entre requêtes) : une URL n'est régénérée qu'à ~1h de son
// expiration, jamais à chaque poll. Un lien qui fuiterait ne révèle qu'une
// photo de profil déjà destinée à être publique, jamais une adresse.
const SIGNED_URL_TTL_S = 86400;
const REFRESH_MARGIN_MS = 3600_000;
const urlCache = new Map<string, { url: string; expiresAt: number }>();

export async function getPublicMapPhotoUrls(paths: string[]): Promise<Record<string, string>> {
  const uniquePaths = [...new Set(paths.filter(Boolean))];
  if (uniquePaths.length === 0) return {};

  const now = Date.now();
  const map: Record<string, string> = {};
  const toFetch: string[] = [];

  for (const path of uniquePaths) {
    const cached = urlCache.get(path);
    if (cached && cached.expiresAt - REFRESH_MARGIN_MS > now) {
      map[path] = cached.url;
    } else {
      toFetch.push(path);
    }
  }

  if (toFetch.length > 0) {
    const supabase = createServiceClient();
    const { data, error } = await supabase.storage.from(BUCKET).createSignedUrls(toFetch, SIGNED_URL_TTL_S);
    if (!error && data) {
      for (const entry of data) {
        if (entry.signedUrl && entry.path) {
          map[entry.path] = entry.signedUrl;
          urlCache.set(entry.path, { url: entry.signedUrl, expiresAt: now + SIGNED_URL_TTL_S * 1000 });
        }
      }
    }
  }

  return map;
}
