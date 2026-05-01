-- ============================================================
-- Migration 001 : Schema initial v3.1
-- Ambassades de Guérison — David Thery App
-- ============================================================

-- ============================================================
-- TABLES
-- ============================================================

CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  youtube_url TEXT,
  live_link TEXT,
  event_date TIMESTAMPTZ NOT NULL,
  registration_opens_at TIMESTAMPTZ,
  registration_closes_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Valeurs par défaut calculées via trigger (PostgreSQL ne supporte pas DEFAULT basé sur d'autres colonnes)
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

CREATE TABLE host_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  host_type TEXT NOT NULL CHECK (host_type IN ('individual', 'church')),
  city TEXT NOT NULL,
  country TEXT NOT NULL,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  geocoding_failed BOOLEAN DEFAULT FALSE,
  address_private TEXT,
  address_public BOOLEAN DEFAULT FALSE,
  whatsapp TEXT,
  whatsapp_group_url TEXT DEFAULT NULL
    CHECK (
      whatsapp_group_url IS NULL
      OR whatsapp_group_url LIKE 'https://chat.whatsapp.com/%'
      OR whatsapp_group_url LIKE 'https://wa.me/%'
    ),
  contact_mode TEXT NOT NULL CHECK (contact_mode IN ('public', 'form', 'approval')) DEFAULT 'public',
  onboarding_completed BOOLEAN DEFAULT FALSE,
  onboarding_version INT DEFAULT 0,
  charter_accepted BOOLEAN DEFAULT FALSE,
  consignes TEXT DEFAULT NULL,
  status TEXT NOT NULL CHECK (status IN (
    'pending_onboarding',
    'onboarding_complete',
    'pending_charter',
    'active',
    'suspended'
  )) DEFAULT 'pending_onboarding',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE host_activations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_profile_id UUID NOT NULL REFERENCES host_profiles(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  capacity INT DEFAULT 5 CHECK (capacity > 0),
  accepted_count INT DEFAULT 0 CHECK (accepted_count >= 0),
  is_active BOOLEAN DEFAULT FALSE,
  is_full BOOLEAN DEFAULT FALSE,
  UNIQUE (host_profile_id, event_id),
  CONSTRAINT check_accepted_lte_capacity CHECK (accepted_count <= capacity)
);

CREATE TABLE contact_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_activation_id UUID NOT NULL REFERENCES host_activations(id) ON DELETE CASCADE,
  visitor_first_name TEXT NOT NULL,
  visitor_email TEXT NOT NULL,
  visitor_message TEXT,
  status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'declined')) DEFAULT 'pending',
  action_token UUID NOT NULL DEFAULT gen_random_uuid(),
  onboarding_completed BOOLEAN DEFAULT FALSE,
  UNIQUE (host_activation_id, visitor_email),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE testimonials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_profile_id UUID NOT NULL REFERENCES host_profiles(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  photo_url TEXT,
  is_visible BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE live_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_profile_id UUID NOT NULL REFERENCES host_profiles(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'declined', 'used')) DEFAULT 'pending',
  link_shared BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- VIEW PUBLIQUE (column-level workaround)
-- Exclut address_private et consignes (données sensibles)
-- ============================================================

CREATE VIEW host_profiles_public AS
SELECT
  id, user_id, first_name, host_type, city, country,
  lat, lng, geocoding_failed, whatsapp_group_url,
  address_public, contact_mode, status, onboarding_version,
  created_at
FROM host_profiles;

-- ============================================================
-- FONCTION ATOMIQUE : accept_contact_request
-- Évite la race condition accepted_count vs capacity
-- ============================================================

CREATE OR REPLACE FUNCTION accept_contact_request(activation_id UUID, request_id UUID)
RETURNS JSONB AS $$
DECLARE
  updated_count INT;
BEGIN
  UPDATE host_activations
  SET
    accepted_count = accepted_count + 1,
    is_full = CASE WHEN accepted_count + 1 >= capacity THEN TRUE ELSE FALSE END
  WHERE id = activation_id AND accepted_count < capacity;

  GET DIAGNOSTICS updated_count = ROW_COUNT;

  IF updated_count = 0 THEN
    RETURN '{"error": "complet"}'::JSONB;
  END IF;

  UPDATE contact_requests SET status = 'accepted' WHERE id = request_id;
  RETURN '{"success": true}'::JSONB;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE host_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE host_activations ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_signals ENABLE ROW LEVEL SECURITY;

-- events : lecture publique, écriture admin
CREATE POLICY "events_public_read" ON events
  FOR SELECT USING (true);

CREATE POLICY "events_admin_write" ON events
  FOR ALL USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

-- host_profiles : lecture publique (hôtes actifs), owner/admin full access
CREATE POLICY "host_profiles_public_read" ON host_profiles
  FOR SELECT USING (status = 'active');

CREATE POLICY "host_profiles_owner_full" ON host_profiles
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "host_profiles_admin_full" ON host_profiles
  FOR ALL USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

-- host_activations : lecture publique, update hôte, insert admin/trigger seulement
CREATE POLICY "host_activations_public_read" ON host_activations
  FOR SELECT USING (true);

CREATE POLICY "host_activations_host_update" ON host_activations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM host_profiles hp
      WHERE hp.id = host_profile_id AND hp.user_id = auth.uid()
    )
  );

CREATE POLICY "host_activations_no_user_insert" ON host_activations
  FOR INSERT WITH CHECK (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

CREATE POLICY "host_activations_admin_full" ON host_activations
  FOR ALL USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

-- contact_requests : insert public, hôte lit ses demandes, admin tout
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

-- testimonials : lecture publique (is_visible), hôte/admin full
CREATE POLICY "testimonials_public_read" ON testimonials
  FOR SELECT USING (is_visible = true);

CREATE POLICY "testimonials_host_full" ON testimonials
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM host_profiles hp
      WHERE hp.id = host_profile_id AND hp.user_id = auth.uid()
    )
  );

CREATE POLICY "testimonials_admin_full" ON testimonials
  FOR ALL USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

-- live_signals : hôte voit ses propres signaux, admin tout
CREATE POLICY "live_signals_host_insert_read" ON live_signals
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM host_profiles hp
      WHERE hp.id = host_profile_id AND hp.user_id = auth.uid()
    )
  );

CREATE POLICY "live_signals_admin_full" ON live_signals
  FOR ALL USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

-- ============================================================
-- INDEX
-- ============================================================

CREATE INDEX idx_host_profiles_status ON host_profiles(status);
CREATE INDEX idx_host_profiles_lat_lng ON host_profiles(lat, lng) WHERE lat IS NOT NULL;
CREATE INDEX idx_host_activations_event ON host_activations(event_id);
CREATE INDEX idx_host_activations_active ON host_activations(event_id, is_active) WHERE is_active = TRUE;
CREATE INDEX idx_live_signals_event_status ON live_signals(event_id, status);
CREATE INDEX idx_contact_requests_token ON contact_requests(action_token);
