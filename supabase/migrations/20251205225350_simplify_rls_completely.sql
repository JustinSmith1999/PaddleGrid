/*
  # Completely Simplify RLS to Fix Auth Error
  
  This migration removes all complex policies that might interfere with authentication.
  We'll use only direct auth.uid() checks without any function calls.
  
  ## Changes
  1. Drop the problematic is_admin_user function usage
  2. Use only simple direct checks
  3. Remove admin policy temporarily to isolate the issue
  
  ## Security
  - Basic user access remains secure
  - Admin access can be re-added once auth works
*/

-- Drop the admin policy that uses is_admin_user()
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;

-- Keep only the simple policies
-- These should not cause any auth issues

-- Verify remaining policies
DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE tablename = 'profiles';
  
  RAISE NOTICE 'Remaining policies on profiles: %', policy_count;
END $$;
