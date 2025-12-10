/*
  # Court Availability Blocks System

  ## Overview
  Creates a flexible system for managing court availability by blocking time slots.
  Replaces hardcoded TypeScript reservation data with dynamic database-driven availability.

  ## New Tables
  
  ### 1. `court_availability_blocks`
  Stores all blocked time periods for courts (existing reservations, maintenance, events, etc.)
  - `id` (uuid, PK) - Block identifier
  - `facility_id` (uuid, FK) - Reference to facilities
  - `court_id` (uuid, FK) - Reference to courts
  - `block_date` (date, NOT NULL) - Date of the block
  - `start_time` (time, NOT NULL) - Block start time
  - `end_time` (time, NOT NULL) - Block end time
  - `block_type` (text) - Type: 'reservation', 'maintenance', 'private_event', 'clinic', 'tournament', 'other'
  - `notes` (text) - Additional notes or details
  - `player_count` (integer) - Number of players (for existing reservations)
  - `created_by` (uuid, FK) - User who created this block
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ## Indexes
  - court_id and block_date for fast availability queries
  - facility_id for multi-tenant filtering
  - created_by for audit trail

  ## Functions
  - check_availability(court_id, date, start_time, end_time) - Returns true if time slot is available

  ## Security
  - RLS enabled with policies for facility admins to manage blocks
  - Public read access to check availability
  - Only facility admins can create/update/delete blocks

  ## Important Notes
  1. This table replaces the hardcoded reservationData.ts file
  2. Blocks prevent users from booking conflicting times
  3. Existing 956 reservations will be migrated in a separate script
*/

-- Create court_availability_blocks table
CREATE TABLE IF NOT EXISTS court_availability_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id uuid REFERENCES facilities(id) ON DELETE CASCADE,
  court_id uuid NOT NULL REFERENCES courts(id) ON DELETE CASCADE,
  block_date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  block_type text NOT NULL DEFAULT 'reservation' CHECK (block_type IN ('reservation', 'maintenance', 'private_event', 'clinic', 'tournament', 'league', 'staff_block', 'other')),
  notes text,
  player_count integer CHECK (player_count >= 0),
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CHECK (end_time > start_time)
);

-- Create indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_availability_blocks_court_date ON court_availability_blocks(court_id, block_date);
CREATE INDEX IF NOT EXISTS idx_availability_blocks_facility ON court_availability_blocks(facility_id);
CREATE INDEX IF NOT EXISTS idx_availability_blocks_date_range ON court_availability_blocks(block_date);
CREATE INDEX IF NOT EXISTS idx_availability_blocks_created_by ON court_availability_blocks(created_by);

-- Enable RLS
ALTER TABLE court_availability_blocks ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read availability blocks (needed for booking checks)
CREATE POLICY "Anyone can view availability blocks"
  ON court_availability_blocks
  FOR SELECT
  TO authenticated, anon
  USING (true);

-- Policy: Facility admins can insert blocks
CREATE POLICY "Facility admins can create availability blocks"
  ON court_availability_blocks
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM facility_users
      WHERE facility_users.facility_id = court_availability_blocks.facility_id
      AND facility_users.user_id = auth.uid()
      AND facility_users.role IN ('owner', 'admin', 'staff')
    )
  );

-- Policy: Facility admins can update blocks in their facility
CREATE POLICY "Facility admins can update availability blocks"
  ON court_availability_blocks
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM facility_users
      WHERE facility_users.facility_id = court_availability_blocks.facility_id
      AND facility_users.user_id = auth.uid()
      AND facility_users.role IN ('owner', 'admin', 'staff')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM facility_users
      WHERE facility_users.facility_id = court_availability_blocks.facility_id
      AND facility_users.user_id = auth.uid()
      AND facility_users.role IN ('owner', 'admin', 'staff')
    )
  );

-- Policy: Facility admins can delete blocks in their facility
CREATE POLICY "Facility admins can delete availability blocks"
  ON court_availability_blocks
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM facility_users
      WHERE facility_users.facility_id = court_availability_blocks.facility_id
      AND facility_users.user_id = auth.uid()
      AND facility_users.role IN ('owner', 'admin', 'staff')
    )
  );

-- Function to check if a time slot is available
CREATE OR REPLACE FUNCTION check_court_availability(
  p_court_id uuid,
  p_date date,
  p_start_time time,
  p_end_time time
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  conflict_count integer;
BEGIN
  -- Check for any overlapping blocks
  SELECT COUNT(*)
  INTO conflict_count
  FROM court_availability_blocks
  WHERE court_id = p_court_id
    AND block_date = p_date
    AND (
      -- New booking starts during an existing block
      (p_start_time >= start_time AND p_start_time < end_time)
      OR
      -- New booking ends during an existing block
      (p_end_time > start_time AND p_end_time <= end_time)
      OR
      -- New booking completely encompasses an existing block
      (p_start_time <= start_time AND p_end_time >= end_time)
    );
  
  -- Return true if no conflicts found
  RETURN conflict_count = 0;
END;
$$;

-- Function to get all blocks for a court on a specific date
CREATE OR REPLACE FUNCTION get_court_blocks(
  p_court_id uuid,
  p_date date
)
RETURNS TABLE (
  id uuid,
  start_time time,
  end_time time,
  block_type text,
  notes text,
  player_count integer
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT id, start_time, end_time, block_type, notes, player_count
  FROM court_availability_blocks
  WHERE court_id = p_court_id
    AND block_date = p_date
  ORDER BY start_time;
$$;

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_availability_blocks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_availability_blocks_updated_at
  BEFORE UPDATE ON court_availability_blocks
  FOR EACH ROW
  EXECUTE FUNCTION update_availability_blocks_updated_at();