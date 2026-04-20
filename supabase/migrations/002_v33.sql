-- ============================================================
-- Migration 002 : v3.3 — Opt-out activation model + triggers
-- ============================================================

-- Trigger 1 : quand un événement est créé → active automatiquement tous les hôtes actifs
CREATE OR REPLACE FUNCTION fn_auto_activate_hosts_for_event()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO host_activations (host_profile_id, event_id, is_active, is_full, capacity, accepted_count)
  SELECT id, NEW.id, TRUE, FALSE, 5, 0
  FROM host_profiles
  WHERE status = 'active'
  ON CONFLICT (host_profile_id, event_id) DO NOTHING;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'fn_auto_activate_hosts_for_event failed for event %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_auto_activate_hosts
AFTER INSERT ON events
FOR EACH ROW EXECUTE FUNCTION fn_auto_activate_hosts_for_event();

-- Trigger 2 : quand un hôte passe à status='active' → l'activer pour les events futurs existants
CREATE OR REPLACE FUNCTION fn_auto_activate_host_for_existing_events()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'active' AND (OLD.status IS DISTINCT FROM 'active') THEN
    INSERT INTO host_activations (host_profile_id, event_id, is_active, is_full, capacity, accepted_count)
    SELECT NEW.id, e.id, TRUE, FALSE, 5, 0
    FROM events e
    WHERE e.event_date > NOW()
    ON CONFLICT (host_profile_id, event_id) DO NOTHING;
  END IF;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'fn_auto_activate_host_for_existing_events failed for host %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- AFTER UPDATE OF status : déclenché uniquement quand la colonne status change
CREATE TRIGGER trg_auto_activate_host_on_active
AFTER UPDATE OF status ON host_profiles
FOR EACH ROW EXECUTE FUNCTION fn_auto_activate_host_for_existing_events();
