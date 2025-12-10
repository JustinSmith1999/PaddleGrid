/*
  # Fix Authentication Schema Error
  
  This migration fixes the "Database error querying schema" issue by resolving
  the circular dependency in the profiles table RLS policies.
  
  ## Changes
  1. Drop existing policies first
  2. Drop and recreate the is_admin_user function with proper STABLE marking
  3. Recreate simplified RLS policies to avoid recursion during authentication
  
  ## Security
  - Maintains proper RLS protection
  - Users can only view their own profiles
  - Admins can view all profiles (checked safely)
*/

-- Drop existing policies first
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Now drop the function
DROP FUNCTION IF EXISTS public.is_admin_user();

-- Create an improved version marked as STABLE
-- STABLE tells PostgreSQL the function won't modify data and returns consistent results
-- within a single statement, which helps avoid repeated lookups
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'owner', 'desk', 'coach')
  );
$$;

-- Grant execute permission to both authenticated and anonymous users
GRANT EXECUTE ON FUNCTION public.is_admin_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin_user() TO anon;

-- Recreate policies in the correct order
-- User's own profile check comes first (most common and simplest case)
CREATE POLICY "Users can view own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Admin check is a separate policy
CREATE POLICY "Admins can view all profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (is_admin_user());

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
