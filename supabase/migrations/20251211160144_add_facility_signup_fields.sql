/*
  # Add Facility Signup Fields

  1. Changes
    - Add `estimated_patron_base` column to facilities table (integer for estimated number of members/patrons)
    - Add `owner_name` column to facilities table (text for facility owner's full name)
    - Add `owner_phone` column to facilities table (text for facility owner's direct contact number)
  
  2. Notes
    - These fields support enhanced facility registration process
    - `owner_phone` is separate from facility main phone for direct owner contact
    - `estimated_patron_base` helps with onboarding and service planning
*/

-- Add estimated patron base field
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'facilities' AND column_name = 'estimated_patron_base'
  ) THEN
    ALTER TABLE facilities ADD COLUMN estimated_patron_base integer;
  END IF;
END $$;

-- Add owner name field
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'facilities' AND column_name = 'owner_name'
  ) THEN
    ALTER TABLE facilities ADD COLUMN owner_name text;
  END IF;
END $$;

-- Add owner phone field
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'facilities' AND column_name = 'owner_phone'
  ) THEN
    ALTER TABLE facilities ADD COLUMN owner_phone text;
  END IF;
END $$;
