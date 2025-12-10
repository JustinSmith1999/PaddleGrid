/*
  # Add First Name and Last Name Columns to Profiles

  1. Changes
    - Add `first_name` column to profiles table
    - Add `last_name` column to profiles table
    - Migrate existing `full_name` data to split into first_name and last_name
    - Keep `full_name` column for backward compatibility but make it generated
  
  2. Data Migration
    - Split existing full_name values into first_name and last_name
    - Handle edge cases (single name, multiple names)
  
  3. Notes
    - Maintains backward compatibility
    - full_name will be auto-generated from first_name and last_name
*/

-- Add first_name and last_name columns
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'first_name'
  ) THEN
    ALTER TABLE profiles ADD COLUMN first_name text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'last_name'
  ) THEN
    ALTER TABLE profiles ADD COLUMN last_name text;
  END IF;
END $$;

-- Migrate existing full_name data to first_name and last_name
UPDATE profiles
SET 
  first_name = CASE
    WHEN full_name LIKE '% %' THEN split_part(full_name, ' ', 1)
    ELSE full_name
  END,
  last_name = CASE
    WHEN full_name LIKE '% %' THEN substring(full_name from position(' ' in full_name) + 1)
    ELSE ''
  END
WHERE first_name IS NULL OR last_name IS NULL;

-- Create a function to auto-generate full_name from first_name and last_name
CREATE OR REPLACE FUNCTION update_full_name()
RETURNS TRIGGER AS $$
BEGIN
  NEW.full_name := TRIM(CONCAT(NEW.first_name, ' ', NEW.last_name));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop the trigger if it exists and create it
DROP TRIGGER IF EXISTS update_full_name_trigger ON profiles;
CREATE TRIGGER update_full_name_trigger
  BEFORE INSERT OR UPDATE OF first_name, last_name
  ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_full_name();