-- Migration : support témoignages anonymes (formulaire public sans compte)
-- À appliquer via : supabase db query --linked --file scripts/migration-testimonials-anon.sql

-- 1. Supprimer la contrainte qui imposait au moins un auteur identifié
ALTER TABLE testimonials DROP CONSTRAINT IF EXISTS chk_testimonial_author;

-- 2. Ajouter la colonne ville du soumissionnaire (optionnelle)
ALTER TABLE testimonials ADD COLUMN IF NOT EXISTS submitter_city TEXT;

-- 3. Nouvelle policy RLS : les visiteurs anonymes peuvent soumettre un témoignage
--    (les deux FKs sont NULL → soumission via le formulaire public)
DROP POLICY IF EXISTS "testimonials_anon_insert" ON testimonials;
CREATE POLICY "testimonials_anon_insert" ON testimonials
  FOR INSERT WITH CHECK (
    host_profile_id IS NULL AND contact_request_id IS NULL
  );
