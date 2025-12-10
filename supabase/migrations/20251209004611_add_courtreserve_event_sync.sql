/*
  # Add CourtReserve Event Sync System

  1. New Columns
    - `event_series.courtreserve_event_id` (text, unique) - Stores CourtReserve event ID for tracking
    - `event_series.synced_from_courtreserve` (boolean) - Read-only flag indicating external sync
    - `event_series_registrations.courtreserve_registration_id` (text) - Tracks CourtReserve registration ID

  2. New Table: courtreserve_event_sync_logs
    - Tracks event synchronization history for auditing and monitoring
    - Records: events created/updated, occurrences generated, registrations imported
    - Status tracking: running, success, error

  3. Indexes
    - Fast lookups by CourtReserve event ID
    - Filter by sync source
    - Efficient sync log queries by facility

  4. Security
    - Enable RLS on sync logs
    - Facility admins can view their sync logs
    - Service role can manage all logs

  5. Important Notes
    - Events synced from CourtReserve are marked read-only
    - Prevents editing conflicts between systems
    - Multi-tenant aware (each facility has independent sync)
*/

-- Add courtreserve_event_id column to event_series
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'event_series' AND column_name = 'courtreserve_event_id'
  ) THEN
    ALTER TABLE event_series
    ADD COLUMN courtreserve_event_id text UNIQUE;

    COMMENT ON COLUMN event_series.courtreserve_event_id IS 'CourtReserve event ID for tracking synced events';
  END IF;
END $$;

-- Add synced_from_courtreserve flag to event_series
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'event_series' AND column_name = 'synced_from_courtreserve'
  ) THEN
    ALTER TABLE event_series
    ADD COLUMN synced_from_courtreserve boolean DEFAULT false;

    COMMENT ON COLUMN event_series.synced_from_courtreserve IS 'Indicates if event was synced from CourtReserve (read-only)';
  END IF;
END $$;

-- Add courtreserve_registration_id to event_series_registrations
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'event_series_registrations' AND column_name = 'courtreserve_registration_id'
  ) THEN
    ALTER TABLE event_series_registrations
    ADD COLUMN courtreserve_registration_id text;

    COMMENT ON COLUMN event_series_registrations.courtreserve_registration_id IS 'CourtReserve registration ID for tracking synced registrations';
  END IF;
END $$;

-- Create courtreserve_event_sync_logs table
CREATE TABLE IF NOT EXISTS courtreserve_event_sync_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id uuid REFERENCES facilities(id) ON DELETE CASCADE,
  sync_started_at timestamptz DEFAULT now(),
  sync_completed_at timestamptz,
  status text NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'success', 'error')),
  events_created integer DEFAULT 0,
  events_updated integer DEFAULT 0,
  events_skipped integer DEFAULT 0,
  occurrences_created integer DEFAULT 0,
  registrations_synced integer DEFAULT 0,
  total_events_fetched integer DEFAULT 0,
  error_message text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on event sync logs
ALTER TABLE courtreserve_event_sync_logs ENABLE ROW LEVEL SECURITY;

-- Allow facility admins to view their event sync logs
CREATE POLICY "Facility admins can view event sync logs"
  ON courtreserve_event_sync_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM facility_users
      WHERE facility_users.facility_id = courtreserve_event_sync_logs.facility_id
      AND facility_users.user_id = auth.uid()
      AND facility_users.role IN ('admin', 'owner')
    )
  );

-- Allow service role to manage event sync logs
CREATE POLICY "Service role can manage event sync logs"
  ON courtreserve_event_sync_logs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_event_series_courtreserve_id
  ON event_series(courtreserve_event_id)
  WHERE courtreserve_event_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_event_series_synced
  ON event_series(synced_from_courtreserve, facility_id)
  WHERE synced_from_courtreserve = true;

CREATE INDEX IF NOT EXISTS idx_event_sync_logs_facility_created
  ON courtreserve_event_sync_logs(facility_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_registrations_courtreserve_id
  ON event_series_registrations(courtreserve_registration_id)
  WHERE courtreserve_registration_id IS NOT NULL;

-- Add comment
COMMENT ON TABLE courtreserve_event_sync_logs IS 'Tracks CourtReserve event synchronization history for auditing and monitoring';