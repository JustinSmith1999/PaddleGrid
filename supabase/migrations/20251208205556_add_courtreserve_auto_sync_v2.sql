/*
  # Add CourtReserve Automatic Sync System

  1. New Tables
    - `courtreserve_sync_logs`
      - `id` (uuid, primary key)
      - `facility_id` (uuid, foreign key to facilities)
      - `sync_started_at` (timestamptz)
      - `sync_completed_at` (timestamptz)
      - `status` (text) - 'running', 'success', 'error'
      - `blocks_created` (integer)
      - `blocks_skipped` (integer)
      - `total_reservations` (integer)
      - `error_message` (text)
      - `created_at` (timestamptz)

  2. Extensions
    - Enable http extension for making HTTP requests

  3. Functions
    - `trigger_courtreserve_sync()` - Calls the edge function for each facility with CourtReserve configured

  4. Security
    - Enable RLS on sync_logs table
    - Allow facility admins to view their sync logs
*/

-- Enable http extension for making requests
CREATE EXTENSION IF NOT EXISTS http;

-- Create sync logs table
CREATE TABLE IF NOT EXISTS courtreserve_sync_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id uuid REFERENCES facilities(id) ON DELETE CASCADE,
  sync_started_at timestamptz DEFAULT now(),
  sync_completed_at timestamptz,
  status text NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'success', 'error')),
  blocks_created integer DEFAULT 0,
  blocks_skipped integer DEFAULT 0,
  total_reservations integer DEFAULT 0,
  error_message text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE courtreserve_sync_logs ENABLE ROW LEVEL SECURITY;

-- Allow facility admins to view their sync logs
CREATE POLICY "Facility admins can view sync logs"
  ON courtreserve_sync_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM facility_users
      WHERE facility_users.facility_id = courtreserve_sync_logs.facility_id
      AND facility_users.user_id = auth.uid()
      AND facility_users.role IN ('admin', 'owner')
    )
  );

-- Allow service role to manage sync logs
CREATE POLICY "Service role can manage sync logs"
  ON courtreserve_sync_logs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create index for faster sync log queries
CREATE INDEX IF NOT EXISTS idx_sync_logs_facility_created 
  ON courtreserve_sync_logs(facility_id, created_at DESC);

-- Add comment
COMMENT ON TABLE courtreserve_sync_logs IS 'Tracks CourtReserve synchronization history for auditing and monitoring';
