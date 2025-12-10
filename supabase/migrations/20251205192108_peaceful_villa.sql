/*
  # Fix Profiles Table RLS Infinite Recursion

  This migration fixes the infinite recursion error in the profiles table RLS policies
  by creating a security definer function and updating the policies to avoid circular dependencies.

  ## Changes Made
  1. Create a security definer function to safely check admin roles
  2. Drop existing problematic policies
  3. Create new non-recursive policies
  4. Ensure users can always read their own profile
*/

-- Create a security definer function to check if current user is admin
-- This function runs with elevated privileges and doesn't trigger RLS
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'owner', 'desk', 'coach')
  );
$$;

-- Drop existing problematic policies that cause recursion
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Create new non-recursive policies
CREATE POLICY "Users can view own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

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

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.is_admin_user() TO authenticated;