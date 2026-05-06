-- Migration : retirer le gate d'ouverture des inscriptions
-- Avant : trigger fn_set_event_registration_dates remplissait registration_opens_at
--         à event_date - 7 jours, créant une friction artificielle. Un visiteur qui
--         voulait s'inscrire 8 jours avant un live recevait "Les inscriptions ne sont
--         pas encore ouvertes" — incohérent avec le principe de confiance du produit.
-- Après : le trigger ne fixe plus que registration_closes_at. registration_opens_at
--         reste NULL, et l'API gate (NULL-safe) devient no-op : tant qu'une fiche
--         d'ambassade est visible (host_activations.is_active=true), un visiteur peut
--         s'inscrire sans contrainte temporelle d'ouverture.
-- Usage  : supabase db query --linked --file scripts/migration-remove-registration-opens-gate.sql

-- 1. Réécrire le trigger (ne touche plus à registration_opens_at)
CREATE OR REPLACE FUNCTION fn_set_event_registration_dates()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.registration_closes_at IS NULL THEN
    NEW.registration_closes_at := NEW.event_date;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Effacer registration_opens_at sur les events à venir pour qu'ils héritent
--    immédiatement du nouveau comportement (pas de gate). Les events passés
--    sont laissés intacts (auditabilité historique).
UPDATE events
   SET registration_opens_at = NULL
 WHERE event_date > NOW()
   AND registration_opens_at IS NOT NULL;
