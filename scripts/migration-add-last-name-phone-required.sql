-- Migration : ajout last_name (obligatoire) + phone obligatoire sur host_profiles
-- Usage : supabase db query --linked --file scripts/migration-add-last-name-phone-required.sql

-- 1. Ajouter last_name (nullable d'abord pour permettre le backfill)
ALTER TABLE host_profiles
  ADD COLUMN IF NOT EXISTS last_name TEXT;

-- Backfill : profils existants reçoivent first_name comme last_name provisoire
UPDATE host_profiles SET last_name = first_name WHERE last_name IS NULL;

-- Passer NOT NULL une fois le backfill fait
ALTER TABLE host_profiles
  ALTER COLUMN last_name SET NOT NULL;

-- 2. Rendre phone obligatoire
-- Backfill : profils sans téléphone reçoivent une valeur placeholder
UPDATE host_profiles SET phone = 'N/A' WHERE phone IS NULL OR phone = '';

ALTER TABLE host_profiles
  ALTER COLUMN phone SET NOT NULL;

-- 3. Mettre à jour la vue publique pour exposer last_name
DROP VIEW IF EXISTS host_profiles_public;

CREATE VIEW host_profiles_public AS
SELECT
  id, user_id, first_name, last_name, host_type, church_subtype,
  city, country, lat, lng, geocoding_failed,
  whatsapp_group_url, address_public, contact_mode,
  capacity, consignes, viewing_setup, profile_photo_url,
  status, created_at
FROM host_profiles;
