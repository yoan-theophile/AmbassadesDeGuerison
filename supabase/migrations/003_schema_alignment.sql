-- ============================================================
-- Migration 003 : Alignement schéma ↔ app
-- Corrige les décalages entre 001_initial.sql et le code Next.js
-- ============================================================

-- 1. Renommer host_type → type
ALTER TABLE host_profiles RENAME COLUMN host_type TO type;

-- Mettre à jour la contrainte CHECK sur type
ALTER TABLE host_profiles DROP CONSTRAINT IF EXISTS host_profiles_host_type_check;
ALTER TABLE host_profiles ADD CONSTRAINT host_profiles_type_check
  CHECK (type IN ('domicile', 'salle', 'eglise', 'autre'));

-- 2. Corriger status : les valeurs utilisées par l'app
ALTER TABLE host_profiles DROP CONSTRAINT IF EXISTS host_profiles_status_check;
ALTER TABLE host_profiles ADD CONSTRAINT host_profiles_status_check
  CHECK (status IN ('pending', 'active', 'inactive', 'rejected'));
ALTER TABLE host_profiles ALTER COLUMN status SET DEFAULT 'pending';

-- 3. Corriger contact_mode : valeurs utilisées par l'app
ALTER TABLE host_profiles DROP CONSTRAINT IF EXISTS host_profiles_contact_mode_check;
ALTER TABLE host_profiles ADD CONSTRAINT host_profiles_contact_mode_check
  CHECK (contact_mode IN ('email', 'whatsapp', 'telephone'));
ALTER TABLE host_profiles ALTER COLUMN contact_mode SET DEFAULT 'email';

-- 4. Ajouter capacity à host_profiles (pour l'inscription)
ALTER TABLE host_profiles ADD COLUMN IF NOT EXISTS capacity INT DEFAULT 10 CHECK (capacity > 0);

-- 5. Recréer host_profiles_public avec les bonnes colonnes
DROP VIEW IF EXISTS host_profiles_public;
CREATE VIEW host_profiles_public AS
SELECT
  id, user_id, first_name, type, city, country,
  capacity, lat, lng, geocoding_failed,
  whatsapp_group_url, address_public,
  contact_mode, consignes, status,
  created_at
FROM host_profiles
WHERE status = 'active';
