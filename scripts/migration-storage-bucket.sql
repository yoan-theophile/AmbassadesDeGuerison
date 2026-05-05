-- Migration : création du bucket Supabase Storage ambassador-photos (privé)
-- Usage : supabase db query --linked --file scripts/migration-storage-bucket.sql
-- Idempotent : ON CONFLICT DO NOTHING + DROP POLICY IF EXISTS
-- Photos privées : seul l'ambassadeur (signed URL) et David (service_role) peuvent y accéder.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'ambassador-photos',
  'ambassador-photos',
  false,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "ambassador_photos_public_read"    ON storage.objects;
DROP POLICY IF EXISTS "ambassador_photos_service_insert" ON storage.objects;
DROP POLICY IF EXISTS "ambassador_photos_owner_select"   ON storage.objects;
DROP POLICY IF EXISTS "ambassador_photos_owner_insert"   ON storage.objects;
DROP POLICY IF EXISTS "ambassador_photos_owner_update"   ON storage.objects;
DROP POLICY IF EXISTS "ambassador_photos_owner_delete"   ON storage.objects;

-- SELECT : l'ambassadeur peut lire ses propres fichiers (pour createSignedUrl côté client)
CREATE POLICY "ambassador_photos_owner_select"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'ambassador-photos'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM public.host_profiles WHERE user_id = auth.uid()
  )
);

-- INSERT : authentifié (l'ownership est vérifié dans la route API)
CREATE POLICY "ambassador_photos_owner_insert"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'ambassador-photos'
  AND auth.role() = 'authenticated'
);

-- UPDATE : l'ambassadeur peut écraser ses propres fichiers (upsert)
CREATE POLICY "ambassador_photos_owner_update"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'ambassador-photos'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM public.host_profiles WHERE user_id = auth.uid()
  )
);

-- DELETE : l'ambassadeur peut supprimer ses propres fichiers
CREATE POLICY "ambassador_photos_owner_delete"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'ambassador-photos'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM public.host_profiles WHERE user_id = auth.uid()
  )
);
