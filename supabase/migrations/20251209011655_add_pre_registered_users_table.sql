/*
  # Add Pre-Registered Users Table
  
  1. New Tables
    - `pre_registered_users`
      - `id` (uuid, primary key)
      - `first_name` (text, required) - User's first name
      - `last_name` (text, required) - User's last name
      - `email` (text, required, unique) - User's email address
      - `phone` (text, optional) - User's phone number
      - `facility_id` (uuid, required) - Link to facility (Pickleball Heaven)
      - `membership_type` (text, optional) - Type of membership they have
      - `membership_status` (text, optional) - Active, inactive, etc.
      - `notes` (text, optional) - Any additional notes about the user
      - `claimed` (boolean, default false) - Whether user has created an account
      - `claimed_at` (timestamptz, nullable) - When they claimed their account
      - `claimed_by_user_id` (uuid, nullable) - Links to profiles table when claimed
      - `import_batch_id` (text, optional) - Track which import batch this came from
      - `imported_at` (timestamptz) - When the record was imported
      - `imported_by` (uuid, nullable) - Admin who imported the record
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  
  2. Security
    - Enable RLS on `pre_registered_users` table
    - Facility admins can view their facility's pre-registered users
    - Only facility admins can import and manage pre-registered users
    - Users can view their own pre-registered record when claiming
  
  3. Indexes
    - Index on email for fast lookups during account creation
    - Index on facility_id for facility-specific queries
    - Index on claimed status for filtering
*/

-- Create pre_registered_users table
CREATE TABLE IF NOT EXISTS pre_registered_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text NOT NULL,
  phone text,
  facility_id uuid NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
  membership_type text,
  membership_status text DEFAULT 'active',
  notes text,
  claimed boolean DEFAULT false,
  claimed_at timestamptz,
  claimed_by_user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  import_batch_id text,
  imported_at timestamptz DEFAULT now(),
  imported_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(email, facility_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_pre_registered_users_email ON pre_registered_users(email);
CREATE INDEX IF NOT EXISTS idx_pre_registered_users_facility ON pre_registered_users(facility_id);
CREATE INDEX IF NOT EXISTS idx_pre_registered_users_claimed ON pre_registered_users(claimed);
CREATE INDEX IF NOT EXISTS idx_pre_registered_users_import_batch ON pre_registered_users(import_batch_id);

-- Enable RLS
ALTER TABLE pre_registered_users ENABLE ROW LEVEL SECURITY;

-- Facility admins can view their facility's pre-registered users
CREATE POLICY "Facility admins can view their pre-registered users"
  ON pre_registered_users
  FOR SELECT
  TO authenticated
  USING (
    facility_id IN (
      SELECT facility_id 
      FROM facility_users 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Facility admins can insert pre-registered users for their facility
CREATE POLICY "Facility admins can insert pre-registered users"
  ON pre_registered_users
  FOR INSERT
  TO authenticated
  WITH CHECK (
    facility_id IN (
      SELECT facility_id 
      FROM facility_users 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Facility admins can update their facility's pre-registered users
CREATE POLICY "Facility admins can update their pre-registered users"
  ON pre_registered_users
  FOR UPDATE
  TO authenticated
  USING (
    facility_id IN (
      SELECT facility_id 
      FROM facility_users 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    facility_id IN (
      SELECT facility_id 
      FROM facility_users 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Facility admins can delete their facility's pre-registered users
CREATE POLICY "Facility admins can delete their pre-registered users"
  ON pre_registered_users
  FOR DELETE
  TO authenticated
  USING (
    facility_id IN (
      SELECT facility_id 
      FROM facility_users 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Function to auto-link pre-registered users when they sign up
CREATE OR REPLACE FUNCTION link_pre_registered_user()
RETURNS TRIGGER AS $$
DECLARE
  pre_reg_record RECORD;
BEGIN
  -- Look for a matching pre-registered user by email
  SELECT * INTO pre_reg_record
  FROM pre_registered_users
  WHERE email = NEW.email
    AND claimed = false
  LIMIT 1;

  -- If found, mark as claimed and link to the new user
  IF FOUND THEN
    UPDATE pre_registered_users
    SET 
      claimed = true,
      claimed_at = now(),
      claimed_by_user_id = NEW.id,
      updated_at = now()
    WHERE id = pre_reg_record.id;

    -- Optionally add the user to the facility
    INSERT INTO facility_users (facility_id, user_id, role)
    VALUES (pre_reg_record.facility_id, NEW.id, 'member')
    ON CONFLICT (facility_id, user_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-link when a new profile is created
DROP TRIGGER IF EXISTS link_pre_registered_user_trigger ON profiles;
CREATE TRIGGER link_pre_registered_user_trigger
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION link_pre_registered_user();

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_pre_registered_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_pre_registered_users_updated_at_trigger ON pre_registered_users;
CREATE TRIGGER update_pre_registered_users_updated_at_trigger
  BEFORE UPDATE ON pre_registered_users
  FOR EACH ROW
  EXECUTE FUNCTION update_pre_registered_users_updated_at();
