/*
  # PodPlay Integration System
  
  1. New Tables
    - `podplay_facilities`
      - Links PaddleGrid facilities to PodPlay facility IDs
      - Stores API credentials and sync configuration
    - `podplay_sync_logs`
      - Tracks all sync operations with PodPlay
      - Records success/failure and sync details
    - `podplay_bookings`
      - Maps PaddleGrid bookings to PodPlay booking IDs
      - Enables bidirectional sync
    - `podplay_members`
      - Maps PaddleGrid users to PodPlay member IDs
      - Syncs member profiles and preferences
    - `podplay_events`
      - Syncs leagues, tournaments, and special events
      - Maps to PaddleGrid event_series
    - `podplay_webhooks`
      - Stores webhook configurations and secrets
      - Logs incoming webhook calls
  
  2. Security
    - Enable RLS on all tables
    - Only facility admins can configure PodPlay integration
    - Webhook secrets are encrypted
    - API credentials stored securely
  
  3. Features
    - Two-way booking sync
    - Member profile sync
    - Event/league sync
    - Real-time webhook updates
    - Automatic reconciliation
*/

-- PodPlay facility configuration
CREATE TABLE IF NOT EXISTS podplay_facilities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id uuid NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
  podplay_facility_id text NOT NULL,
  api_key_encrypted text NOT NULL,
  api_endpoint text NOT NULL DEFAULT 'https://api.podplay.app/v1',
  webhook_secret_encrypted text,
  sync_enabled boolean DEFAULT true,
  sync_bookings boolean DEFAULT true,
  sync_members boolean DEFAULT true,
  sync_events boolean DEFAULT true,
  auto_create_members boolean DEFAULT true,
  last_sync_at timestamptz,
  sync_interval_minutes integer DEFAULT 15,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(facility_id, podplay_facility_id)
);

CREATE INDEX idx_podplay_facilities_facility ON podplay_facilities(facility_id);
CREATE INDEX idx_podplay_facilities_enabled ON podplay_facilities(sync_enabled) WHERE sync_enabled = true;

-- PodPlay sync operation logs
CREATE TABLE IF NOT EXISTS podplay_sync_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  podplay_facility_id uuid REFERENCES podplay_facilities(id) ON DELETE CASCADE,
  sync_type text NOT NULL CHECK (sync_type IN ('bookings', 'members', 'events', 'full', 'webhook')),
  status text NOT NULL CHECK (status IN ('started', 'success', 'failed', 'partial')),
  direction text NOT NULL CHECK (direction IN ('pull', 'push', 'bidirectional')),
  records_processed integer DEFAULT 0,
  records_created integer DEFAULT 0,
  records_updated integer DEFAULT 0,
  records_failed integer DEFAULT 0,
  error_message text,
  details jsonb DEFAULT '{}',
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_podplay_sync_logs_facility ON podplay_sync_logs(podplay_facility_id);
CREATE INDEX idx_podplay_sync_logs_type_status ON podplay_sync_logs(sync_type, status);
CREATE INDEX idx_podplay_sync_logs_created ON podplay_sync_logs(created_at DESC);

-- PodPlay booking mappings
CREATE TABLE IF NOT EXISTS podplay_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  podplay_booking_id text NOT NULL,
  podplay_facility_id uuid REFERENCES podplay_facilities(id) ON DELETE CASCADE,
  sync_status text DEFAULT 'synced' CHECK (sync_status IN ('synced', 'pending', 'failed', 'conflict')),
  last_synced_at timestamptz DEFAULT now(),
  podplay_data jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(booking_id),
  UNIQUE(podplay_booking_id, podplay_facility_id)
);

CREATE INDEX idx_podplay_bookings_booking ON podplay_bookings(booking_id);
CREATE INDEX idx_podplay_bookings_podplay ON podplay_bookings(podplay_booking_id);
CREATE INDEX idx_podplay_bookings_status ON podplay_bookings(sync_status);

-- PodPlay member mappings
CREATE TABLE IF NOT EXISTS podplay_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  podplay_member_id text NOT NULL,
  podplay_facility_id uuid REFERENCES podplay_facilities(id) ON DELETE CASCADE,
  email text NOT NULL,
  membership_type text,
  membership_status text,
  membership_expires_at timestamptz,
  sync_status text DEFAULT 'synced' CHECK (sync_status IN ('synced', 'pending', 'failed')),
  last_synced_at timestamptz DEFAULT now(),
  podplay_data jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, podplay_facility_id),
  UNIQUE(podplay_member_id, podplay_facility_id)
);

CREATE INDEX idx_podplay_members_user ON podplay_members(user_id);
CREATE INDEX idx_podplay_members_podplay ON podplay_members(podplay_member_id);
CREATE INDEX idx_podplay_members_email ON podplay_members(email);

-- PodPlay event mappings
CREATE TABLE IF NOT EXISTS podplay_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_series_id uuid REFERENCES event_series(id) ON DELETE CASCADE,
  podplay_event_id text NOT NULL,
  podplay_facility_id uuid REFERENCES podplay_facilities(id) ON DELETE CASCADE,
  event_type text NOT NULL CHECK (event_type IN ('league', 'tournament', 'clinic', 'open_play', 'private_event')),
  sync_status text DEFAULT 'synced' CHECK (sync_status IN ('synced', 'pending', 'failed')),
  last_synced_at timestamptz DEFAULT now(),
  podplay_data jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(event_series_id),
  UNIQUE(podplay_event_id, podplay_facility_id)
);

CREATE INDEX idx_podplay_events_series ON podplay_events(event_series_id);
CREATE INDEX idx_podplay_events_podplay ON podplay_events(podplay_event_id);
CREATE INDEX idx_podplay_events_type ON podplay_events(event_type);

-- PodPlay webhook logs
CREATE TABLE IF NOT EXISTS podplay_webhooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  podplay_facility_id uuid REFERENCES podplay_facilities(id) ON DELETE CASCADE,
  webhook_type text NOT NULL,
  payload jsonb NOT NULL,
  signature text,
  processed boolean DEFAULT false,
  processed_at timestamptz,
  error_message text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_podplay_webhooks_facility ON podplay_webhooks(podplay_facility_id);
CREATE INDEX idx_podplay_webhooks_processed ON podplay_webhooks(processed) WHERE processed = false;
CREATE INDEX idx_podplay_webhooks_created ON podplay_webhooks(created_at DESC);

-- Enable RLS
ALTER TABLE podplay_facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE podplay_sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE podplay_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE podplay_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE podplay_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE podplay_webhooks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for podplay_facilities
CREATE POLICY "Facility admins can view PodPlay config"
  ON podplay_facilities FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM facility_users
      WHERE facility_users.facility_id = podplay_facilities.facility_id
      AND facility_users.user_id = auth.uid()
      AND facility_users.role IN ('admin', 'owner')
    )
  );

CREATE POLICY "Facility admins can manage PodPlay config"
  ON podplay_facilities FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM facility_users
      WHERE facility_users.facility_id = podplay_facilities.facility_id
      AND facility_users.user_id = auth.uid()
      AND facility_users.role IN ('admin', 'owner')
    )
  );

-- RLS Policies for podplay_sync_logs
CREATE POLICY "Facility admins can view sync logs"
  ON podplay_sync_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM podplay_facilities pf
      JOIN facility_users fu ON fu.facility_id = pf.facility_id
      WHERE pf.id = podplay_sync_logs.podplay_facility_id
      AND fu.user_id = auth.uid()
      AND fu.role IN ('admin', 'owner')
    )
  );

-- RLS Policies for podplay_bookings
CREATE POLICY "Users can view own booking mappings"
  ON podplay_bookings FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM bookings
      WHERE bookings.id = podplay_bookings.booking_id
      AND bookings.user_id = auth.uid()
    )
  );

CREATE POLICY "Facility admins can view all booking mappings"
  ON podplay_bookings FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM bookings b
      JOIN courts c ON c.id = b.court_id
      JOIN facility_users fu ON fu.facility_id = c.facility_id
      WHERE b.id = podplay_bookings.booking_id
      AND fu.user_id = auth.uid()
      AND fu.role IN ('admin', 'owner', 'desk')
    )
  );

-- RLS Policies for podplay_members
CREATE POLICY "Users can view own member mappings"
  ON podplay_members FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Facility admins can view all member mappings"
  ON podplay_members FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM podplay_facilities pf
      JOIN facility_users fu ON fu.facility_id = pf.facility_id
      WHERE pf.id = podplay_members.podplay_facility_id
      AND fu.user_id = auth.uid()
      AND fu.role IN ('admin', 'owner')
    )
  );

-- RLS Policies for podplay_events
CREATE POLICY "Anyone can view event mappings"
  ON podplay_events FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Facility admins can manage event mappings"
  ON podplay_events FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM event_series es
      JOIN podplay_facilities pf ON pf.facility_id = es.facility_id
      JOIN facility_users fu ON fu.facility_id = es.facility_id
      WHERE es.id = podplay_events.event_series_id
      AND fu.user_id = auth.uid()
      AND fu.role IN ('admin', 'owner')
    )
  );

-- RLS Policies for podplay_webhooks (system only)
CREATE POLICY "Only service role can access webhooks"
  ON podplay_webhooks FOR ALL
  TO authenticated
  USING (false);

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_podplay_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_podplay_facilities_updated_at
  BEFORE UPDATE ON podplay_facilities
  FOR EACH ROW
  EXECUTE FUNCTION update_podplay_updated_at();

CREATE TRIGGER update_podplay_bookings_updated_at
  BEFORE UPDATE ON podplay_bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_podplay_updated_at();

CREATE TRIGGER update_podplay_members_updated_at
  BEFORE UPDATE ON podplay_members
  FOR EACH ROW
  EXECUTE FUNCTION update_podplay_updated_at();

CREATE TRIGGER update_podplay_events_updated_at
  BEFORE UPDATE ON podplay_events
  FOR EACH ROW
  EXECUTE FUNCTION update_podplay_updated_at();
