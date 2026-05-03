-- Migration : création du bucket Supabase Storage ambassador-photos
-- Usage : supabase db query --linked --file scripts/migration-storage-bucket.sql
-- Idempotent : ON CONFLICT DO NOTHING + DROP POLICY IF EXISTS

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'ambassador-photos',
  'ambassador-photos',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "ambassador_photos_public_read"    ON storage.objects;
DROP POLICY IF EXISTS "ambassador_photos_service_insert" ON storage.objects;

CREATE POLICY "ambassador_photos_public_read"
ON storage.objects FOR SELECT
USING (bucket_id = 'ambassador-photos');

CREATE POLICY "ambassador_photos_service_insert"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'ambassador-photos');
