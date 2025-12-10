/*
  # Add Claimed Tracking to Pre-Memberships
  
  1. Changes
    - Add `claimed` boolean field (default false)
    - Add `claimed_at` timestamp field
    - Add `facility_id` for multi-tenant support
    - Add `imported_by` and `import_batch_id` for audit trail
    - Add missing name fields for easier querying
  
  2. Security
    - Update RLS policies to include facility_id checks
*/

-- Add missing columns
ALTER TABLE pre_memberships 
  ADD COLUMN IF NOT EXISTS claimed boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS claimed_at timestamptz,
  ADD COLUMN IF NOT EXISTS facility_id uuid REFERENCES facilities(id),
  ADD COLUMN IF NOT EXISTS imported_by uuid REFERENCES profiles(id),
  ADD COLUMN IF NOT EXISTS import_batch_id text,
  ADD COLUMN IF NOT EXISTS first_name text,
  ADD COLUMN IF NOT EXISTS last_name text,
  ADD COLUMN IF NOT EXISTS phone text;

-- Parse names from "Member Name" column if first_name/last_name are empty
UPDATE pre_memberships
SET 
  first_name = SPLIT_PART("Member Name", ' ', 1),
  last_name = SUBSTRING("Member Name" FROM POSITION(' ' IN "Member Name") + 1)
WHERE first_name IS NULL OR first_name = '';

-- Set default facility_id to Pickleball Heaven for all existing records
UPDATE pre_memberships
SET facility_id = (SELECT id FROM facilities WHERE name = 'The Pickleball Heaven' LIMIT 1)
WHERE facility_id IS NULL;

-- Create function to auto-mark as claimed when user signs up
CREATE OR REPLACE FUNCTION mark_pre_membership_claimed()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE pre_memberships
  SET 
    claimed = true,
    claimed_at = now()
  WHERE LOWER(TRIM("Email")) = LOWER(TRIM(NEW.email))
    AND claimed = false;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-mark claimed on profile creation
DROP TRIGGER IF EXISTS on_profile_created_mark_claimed ON profiles;
CREATE TRIGGER on_profile_created_mark_claimed
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION mark_pre_membership_claimed();

-- Enable RLS
ALTER TABLE pre_memberships ENABLE ROW LEVEL SECURITY;

-- Drop old policies if they exist
DROP POLICY IF EXISTS "Facility admins can view pre_memberships" ON pre_memberships;
DROP POLICY IF EXISTS "Facility admins can insert pre_memberships" ON pre_memberships;
DROP POLICY IF EXISTS "Facility admins can update pre_memberships" ON pre_memberships;
DROP POLICY IF EXISTS "Facility admins can delete pre_memberships" ON pre_memberships;

-- Create RLS policies
CREATE POLICY "Facility admins can view pre_memberships"
  ON pre_memberships FOR SELECT
  TO authenticated
  USING (
    facility_id IN (
      SELECT facility_id FROM facility_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Facility admins can insert pre_memberships"
  ON pre_memberships FOR INSERT
  TO authenticated
  WITH CHECK (
    facility_id IN (
      SELECT facility_id FROM facility_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Facility admins can update pre_memberships"
  ON pre_memberships FOR UPDATE
  TO authenticated
  USING (
    facility_id IN (
      SELECT facility_id FROM facility_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Facility admins can delete pre_memberships"
  ON pre_memberships FOR DELETE
  TO authenticated
  USING (
    facility_id IN (
      SELECT facility_id FROM facility_users WHERE user_id = auth.uid()
    )
  );
