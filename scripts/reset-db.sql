-- ============================================================
-- RESET COMPLET — DavidTheryApp
-- À coller dans Supabase Dashboard → SQL Editor → Run
-- ⚠️  Supprime TOUTES les données et recrée le schéma proprement
-- ============================================================

-- 1. Suppression dans l'ordre (FK oblige)
DROP TABLE IF EXISTS live_signals        CASCADE;
DROP TABLE IF EXISTS testimonials        CASCADE;
DROP TABLE IF EXISTS contact_requests    CASCADE;
DROP TABLE IF EXISTS host_activations    CASCADE;
DROP TABLE IF EXISTS host_profiles       CASCADE;
DROP TABLE IF EXISTS events              CASCADE;
DROP TABLE IF EXISTS onboarding_config   CASCADE;

DROP VIEW  IF EXISTS host_profiles_public CASCADE;

DROP FUNCTION IF EXISTS fn_set_event_registration_dates()   CASCADE;
DROP FUNCTION IF EXISTS fn_auto_activate_hosts_for_event()  CASCADE;
DROP FUNCTION IF EXISTS fn_auto_activate_host_for_existing_events() CASCADE;
DROP FUNCTION IF EXISTS accept_contact_request(UUID, UUID)  CASCADE;

-- ============================================================
-- 2. TABLES
-- ============================================================

CREATE TABLE events (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title                   TEXT NOT NULL,
  description             TEXT,
  youtube_url             TEXT,
  live_link               TEXT,
  event_date              TIMESTAMPTZ NOT NULL,
  registration_opens_at   TIMESTAMPTZ,
  registration_closes_at  TIMESTAMPTZ,
  created_at              TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE host_profiles (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name          TEXT NOT NULL,
  email               TEXT NOT NULL UNIQUE,
  host_type           TEXT NOT NULL DEFAULT 'individual'
    CHECK (host_type IN ('individual', 'church')),
  city                TEXT NOT NULL,
  country             TEXT NOT NULL,
  lat                 DOUBLE PRECISION,
  lng                 DOUBLE PRECISION,
  geocoding_failed    BOOLEAN DEFAULT FALSE,
  address_private     TEXT,
  address_public      BOOLEAN DEFAULT FALSE,
  whatsapp_group_url  TEXT DEFAULT NULL
    CHECK (
      whatsapp_group_url IS NULL
      OR whatsapp_group_url LIKE 'https://chat.whatsapp.com/%'
      OR whatsapp_group_url LIKE 'https://wa.me/%'
    ),
  contact_mode        TEXT NOT NULL DEFAULT 'email'
    CHECK (contact_mode IN ('email', 'whatsapp', 'telephone')),
  capacity            INT NOT NULL DEFAULT 10 CHECK (capacity > 0),
  consignes           TEXT,
  status              TEXT NOT NULL DEFAULT 'pending_onboarding'
    CHECK (status IN (
      'pending_onboarding', 'onboarding_complete', 'pending_charter',
      'active', 'suspended'
    )),
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE host_activations (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_profile_id   UUID NOT NULL REFERENCES host_profiles(id) ON DELETE CASCADE,
  event_id          UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  capacity          INT NOT NULL DEFAULT 10 CHECK (capacity > 0),
  accepted_count    INT NOT NULL DEFAULT 0 CHECK (accepted_count >= 0),
  is_active         BOOLEAN DEFAULT FALSE,
  is_full           BOOLEAN DEFAULT FALSE,
  UNIQUE (host_profile_id, event_id)
);

CREATE TABLE contact_requests (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_activation_id    UUID NOT NULL REFERENCES host_activations(id) ON DELETE CASCADE,
  visitor_first_name    TEXT NOT NULL,
  visitor_email         TEXT NOT NULL,
  visitor_whatsapp      TEXT,
  visitor_message       TEXT,
  status                TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'declined')),
  action_token          UUID NOT NULL DEFAULT gen_random_uuid(),
  onboarding_completed  BOOLEAN DEFAULT FALSE,
  UNIQUE (host_activation_id, visitor_email),
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE testimonials (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_profile_id       UUID REFERENCES host_profiles(id) ON DELETE CASCADE,
  contact_request_id    UUID REFERENCES contact_requests(id) ON DELETE SET NULL,
  visitor_name          TEXT,
  event_id              UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  content               TEXT NOT NULL,
  photo_url             TEXT,
  timing                TEXT CHECK (timing IN ('during', 'after')),
  is_visible            BOOLEAN DEFAULT FALSE,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT chk_testimonial_author
    CHECK (host_profile_id IS NOT NULL OR contact_request_id IS NOT NULL)
);

CREATE TABLE live_signals (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_profile_id   UUID NOT NULL REFERENCES host_profiles(id) ON DELETE CASCADE,
  event_id          UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  description       TEXT NOT NULL,
  status            TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'declined', 'used')),
  link_shared       BOOLEAN DEFAULT FALSE,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE onboarding_config (
  id         INTEGER PRIMARY KEY DEFAULT 1,
  video_url  TEXT NOT NULL DEFAULT '',
  pdf_url    TEXT NOT NULL DEFAULT '/docs/guide-ambassade.pdf',
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT single_row CHECK (id = 1)
);

-- ============================================================
-- 3. VUE PUBLIQUE
-- ============================================================

CREATE VIEW host_profiles_public AS
SELECT
  id, user_id, first_name, host_type, city, country, capacity,
  lat, lng, geocoding_failed, whatsapp_group_url,
  address_public, contact_mode, consignes, status,
  created_at
FROM host_profiles;

-- ============================================================
-- 4. TRIGGERS
-- ============================================================

-- Trigger A : dates d'inscription auto sur les events
CREATE OR REPLACE FUNCTION fn_set_event_registration_dates()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.registration_opens_at IS NULL THEN
    NEW.registration_opens_at := NEW.event_date - INTERVAL '7 days';
  END IF;
  IF NEW.registration_closes_at IS NULL THEN
    NEW.registration_closes_at := NEW.event_date;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_set_event_registration_dates
BEFORE INSERT OR UPDATE ON events
FOR EACH ROW EXECUTE FUNCTION fn_set_event_registration_dates();

-- Trigger B : nouvel event → active tous les hôtes actifs avec leur vraie capacité
CREATE OR REPLACE FUNCTION fn_auto_activate_hosts_for_event()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO host_activations (host_profile_id, event_id, is_active, is_full, capacity, accepted_count)
  SELECT hp.id, NEW.id, TRUE, FALSE, hp.capacity, 0
  FROM host_profiles hp
  WHERE hp.status = 'active'
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

-- Trigger C : hôte passe active → l'activer pour les events futurs
CREATE OR REPLACE FUNCTION fn_auto_activate_host_for_existing_events()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'active' AND (OLD.status IS DISTINCT FROM 'active') THEN
    INSERT INTO host_activations (host_profile_id, event_id, is_active, is_full, capacity, accepted_count)
    SELECT NEW.id, e.id, TRUE, FALSE, NEW.capacity, 0
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

CREATE TRIGGER trg_auto_activate_host_on_active
AFTER UPDATE OF status ON host_profiles
FOR EACH ROW EXECUTE FUNCTION fn_auto_activate_host_for_existing_events();

-- ============================================================
-- 5. TRIGGER : accepted_count auto-géré sur contact_requests
-- ============================================================

-- Incrémente accepted_count à chaque nouvelle demande.
-- Décrémente si une demande passe à 'declined'.
-- Auto-set is_full quand accepted_count >= capacity.
CREATE OR REPLACE FUNCTION fn_contact_request_count_update()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE host_activations
    SET
      accepted_count = accepted_count + 1,
      is_full = CASE WHEN (accepted_count + 1) >= capacity THEN TRUE ELSE is_full END
    WHERE id = NEW.host_activation_id;

  ELSIF TG_OP = 'UPDATE' AND OLD.status != 'declined' AND NEW.status = 'declined' THEN
    UPDATE host_activations
    SET accepted_count = GREATEST(accepted_count - 1, 0)
    WHERE id = NEW.host_activation_id;
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'fn_contact_request_count_update failed: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_contact_request_count
AFTER INSERT OR UPDATE OF status ON contact_requests
FOR EACH ROW EXECUTE FUNCTION fn_contact_request_count_update();

-- ============================================================
-- 6. ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE events             ENABLE ROW LEVEL SECURITY;
ALTER TABLE host_profiles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE host_activations   ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_requests   ENABLE ROW LEVEL SECURITY;
ALTER TABLE testimonials       ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_signals       ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_config  ENABLE ROW LEVEL SECURITY;
-- Pas de policy publique — accès uniquement via service_role (bypass RLS)

-- events : lecture publique, écriture admin
CREATE POLICY "events_public_read"  ON events FOR SELECT USING (true);
CREATE POLICY "events_admin_write"  ON events FOR ALL
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

-- host_profiles : actifs lisibles par tous, owner/admin full
CREATE POLICY "host_profiles_public_read" ON host_profiles
  FOR SELECT USING (status = 'active');
CREATE POLICY "host_profiles_owner_full"  ON host_profiles
  FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "host_profiles_admin_full"  ON host_profiles
  FOR ALL USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

-- host_activations
CREATE POLICY "host_activations_public_read" ON host_activations
  FOR SELECT USING (true);
CREATE POLICY "host_activations_host_update" ON host_activations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM host_profiles hp
      WHERE hp.id = host_profile_id AND hp.user_id = auth.uid()
    )
  );
CREATE POLICY "host_activations_admin_full" ON host_activations
  FOR ALL USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

-- contact_requests : insert public (visiteurs), hôte/admin lit tout
CREATE POLICY "contact_requests_public_insert" ON contact_requests
  FOR INSERT WITH CHECK (true);
CREATE POLICY "contact_requests_host_read_update" ON contact_requests
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM host_activations ha
      JOIN host_profiles hp ON ha.host_profile_id = hp.id
      WHERE ha.id = host_activation_id AND hp.user_id = auth.uid()
    )
  );
CREATE POLICY "contact_requests_admin_full" ON contact_requests
  FOR ALL USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

-- testimonials
CREATE POLICY "testimonials_public_read" ON testimonials
  FOR SELECT USING (is_visible = true);
CREATE POLICY "testimonials_host_full" ON testimonials
  FOR ALL USING (
    host_profile_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM host_profiles hp
      WHERE hp.id = host_profile_id AND hp.user_id = auth.uid()
    )
  );
CREATE POLICY "testimonials_visitor_insert" ON testimonials
  FOR INSERT WITH CHECK (
    contact_request_id IS NOT NULL AND host_profile_id IS NULL
  );
CREATE POLICY "testimonials_admin_full" ON testimonials
  FOR ALL USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

-- live_signals
CREATE POLICY "live_signals_host_full" ON live_signals
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM host_profiles hp
      WHERE hp.id = host_profile_id AND hp.user_id = auth.uid()
    )
  );
CREATE POLICY "live_signals_admin_full" ON live_signals
  FOR ALL USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

-- ============================================================
-- 7. INDEX
-- ============================================================

CREATE INDEX idx_host_profiles_status    ON host_profiles(status);
CREATE INDEX idx_host_profiles_lat_lng   ON host_profiles(lat, lng) WHERE lat IS NOT NULL;
CREATE INDEX idx_host_activations_event  ON host_activations(event_id);
CREATE INDEX idx_host_activations_active ON host_activations(event_id, is_active) WHERE is_active = TRUE;
CREATE INDEX idx_live_signals_event      ON live_signals(event_id, status);
CREATE INDEX idx_contact_requests_token  ON contact_requests(action_token);
