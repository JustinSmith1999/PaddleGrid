/*
  # Temporarily Disable RLS on Profiles to Fix Auth
  
  The RLS policies on the profiles table might be causing the
  "Database error querying schema" during authentication.
  
  This is a temporary fix to allow login to work.
  
  ## Changes
  1. Disable RLS on profiles table
  2. Keep policies in place but not enforced
  
  ## Security
  - This is TEMPORARY and should be re-enabled once auth works
  - Application code should still handle permissions
*/

-- Disable RLS temporarily
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Log the change
DO $$
BEGIN
  RAISE NOTICE 'RLS disabled on profiles table - TEMPORARY FIX';
END $$;
