/*
  # Final Fix for Authentication Circular Dependency
  
  This migration resolves the authentication error by preventing circular
  dependencies when the auth system queries schema information during login.
  
  ## Problem
  The is_admin_user() function creates a circular dependency during authentication
  because it queries the profiles table while auth.uid() is being established.
  
  ## Solution
  1. Temporarily drop the admin policy that causes issues during auth
  2. Recreate it with a safer approach that doesn't interfere with authentication
  3. Add proper grants for schema access
  
  ## Changes
  1. Remove problematic admin policy
  2. Add proper schema and table grants
  3. Simplify the admin check to avoid auth-time queries
*/

-- Drop the problematic admin policy
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;

-- Recreate it with a condition that doesn't execute during initial auth
-- The key is to make sure this policy doesn't interfere with login
CREATE POLICY "Admins can view all profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    CASE 
      WHEN auth.uid() IS NULL THEN false
      ELSE is_admin_user()
    END
  );

-- Ensure proper grants for authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON profiles TO authenticated;

-- Make sure the auth schema can be queried properly
GRANT USAGE ON SCHEMA auth TO authenticated;

-- Update the is_admin_user function to handle NULL uid gracefully
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE 
    WHEN auth.uid() IS NULL THEN false
    ELSE EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'owner', 'desk', 'coach')
    )
  END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.is_admin_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin_user() TO anon;
