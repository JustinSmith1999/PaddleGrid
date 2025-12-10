/*
  # Add Case-Insensitive Email Matching
  
  1. Changes
    - Add case-insensitive index on Email column for better performance
    - Ensure trigger uses case-insensitive matching
    - Add index on profiles email as well
  
  2. Performance
    - Speeds up email lookups significantly
*/

-- Create case-insensitive index on pre_memberships Email
CREATE INDEX IF NOT EXISTS idx_pre_memberships_email_lower 
ON pre_memberships (LOWER(TRIM("Email")));

-- Create case-insensitive index on profiles email
CREATE INDEX IF NOT EXISTS idx_profiles_email_lower 
ON profiles (LOWER(TRIM(email)));

-- Ensure the trigger function uses case-insensitive matching (already does, but let's be explicit)
CREATE OR REPLACE FUNCTION mark_pre_membership_claimed()
RETURNS TRIGGER AS $$
BEGIN
  -- Update all matching pre_memberships (case-insensitive email match)
  UPDATE pre_memberships
  SET 
    claimed = true,
    claimed_at = now()
  WHERE LOWER(TRIM("Email")) = LOWER(TRIM(NEW.email))
    AND claimed = false;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
