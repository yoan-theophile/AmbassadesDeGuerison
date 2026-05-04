-- Migration : passer le bucket ambassador-photos en mode privé
-- Usage : supabase db query --linked --file scripts/migration-photos-private.sql
-- Idempotent : UPDATE + DROP/CREATE

-- 1. Rendre le bucket privé
UPDATE storage.buckets
SET public = false
WHERE id = 'ambassador-photos';

-- 2. Supprimer les anciennes policies trop permissives
DROP POLICY IF EXISTS "ambassador_photos_public_read"    ON storage.objects;
DROP POLICY IF EXISTS "ambassador_photos_service_insert" ON storage.objects;
DROP POLICY IF EXISTS "ambassador_photos_owner_select"   ON storage.objects;
DROP POLICY IF EXISTS "ambassador_photos_owner_insert"   ON storage.objects;
DROP POLICY IF EXISTS "ambassador_photos_owner_update"   ON storage.objects;
DROP POLICY IF EXISTS "ambassador_photos_owner_delete"   ON storage.objects;

-- 3. Policy SELECT : l'ambassadeur peut lire ses propres fichiers (pour createSignedUrl côté client)
CREATE POLICY "ambassador_photos_owner_select"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'ambassador-photos'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM public.host_profiles WHERE user_id = auth.uid()
  )
);

-- 4. Policy INSERT : l'ambassadeur peut uploader (le contrôle d'ownership est dans la route API)
CREATE POLICY "ambassador_photos_owner_insert"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'ambassador-photos'
  AND auth.role() = 'authenticated'
);

-- 5. Policy UPDATE : l'ambassadeur peut écraser ses propres fichiers (upsert)
CREATE POLICY "ambassador_photos_owner_update"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'ambassador-photos'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM public.host_profiles WHERE user_id = auth.uid()
  )
);

-- 6. Policy DELETE : l'ambassadeur peut supprimer ses propres fichiers
CREATE POLICY "ambassador_photos_owner_delete"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'ambassador-photos'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM public.host_profiles WHERE user_id = auth.uid()
  )
);
