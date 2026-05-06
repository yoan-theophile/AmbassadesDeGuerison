-- Migration : rendre la fenêtre d'ouverture des inscriptions configurable
-- Avant : INTERVAL '7 days' hardcodé dans fn_set_event_registration_dates().
-- Après : trigger lit registration_opens_days_before depuis event_timing_config (id=1).
-- Usage : supabase db query --linked --file scripts/migration-registration-opens-config.sql

-- 1. Nouvelle colonne sur event_timing_config (idempotent)
ALTER TABLE event_timing_config
  ADD COLUMN IF NOT EXISTS registration_opens_days_before INTEGER DEFAULT 7;

-- 2. Backfill : pour la ligne singleton existante, mettre 7 si NULL
UPDATE event_timing_config SET registration_opens_days_before = 7
WHERE id = 1 AND registration_opens_days_before IS NULL;

-- 3. Réécrire le trigger pour lire depuis la config
CREATE OR REPLACE FUNCTION fn_set_event_registration_dates()
RETURNS TRIGGER AS $$
DECLARE
  v_opens_days INTEGER;
BEGIN
  IF NEW.registration_opens_at IS NULL THEN
    SELECT registration_opens_days_before INTO v_opens_days
    FROM event_timing_config WHERE id = 1;
    NEW.registration_opens_at := NEW.event_date - (COALESCE(v_opens_days, 7) || ' days')::INTERVAL;
  END IF;
  IF NEW.registration_closes_at IS NULL THEN
    NEW.registration_closes_at := NEW.event_date;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Le trigger trg_set_event_registration_dates est déjà attaché à la table events
-- (via reset-db.sql). CREATE OR REPLACE FUNCTION suffit, pas besoin de redéclarer
-- le trigger.

-- Note : les events existants conservent leur registration_opens_at.
-- Seuls les nouveaux events (et UPDATE laissant NULL) utilisent la config.
