-- Migration Ordre 8 — colonnes enrichissement ambassadeur
--
-- À appliquer une fois sur les bases créées AVANT l'Ordre 8 :
--   supabase db query --linked --file scripts/migration-ordre8-host-profiles.sql
--
-- Idempotent : `IF NOT EXISTS` rend l'opération sûre même si déjà appliquée.
-- Sur les bases recréées via `scripts/reset-db.sql`, ces colonnes sont déjà
-- présentes dans le `CREATE TABLE host_profiles` → cette migration est un no-op.
--
-- Contexte : ces 3 colonnes ont été ajoutées au modèle Ordre 8 (questionnaire
-- enrichissement) mais n'avaient pas été propagées sur la base remote initiale,
-- d'où le bug "/admin/ambassadeurs affiche 0 ambassadeurs" — le SELECT échouait
-- silencieusement à cause des colonnes manquantes.

ALTER TABLE host_profiles ADD COLUMN IF NOT EXISTS phone                 TEXT;
ALTER TABLE host_profiles ADD COLUMN IF NOT EXISTS livres_lus            TEXT;
ALTER TABLE host_profiles ADD COLUMN IF NOT EXISTS conferences_assistees BOOLEAN DEFAULT FALSE;
