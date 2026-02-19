/*
  # Fix Facility Users Infinite Recursion
  
  1. Problem
    - Multiple RLS policies on facility_users are causing infinite recursion
    - Policies that query facility_users from within facility_users policies create circular dependency
  
  2. Solution
    - Drop all existing policies on facility_users
    - Create simple, non-recursive policies
    - Use direct auth.uid() checks instead of EXISTS subqueries on same table
*/

-- Drop all existing policies on facility_users
DROP POLICY IF EXISTS "Anyone can view facility memberships" ON facility_users;
DROP POLICY IF EXISTS "Authenticated users can view all facility users" ON facility_users;
DROP POLICY IF EXISTS "Facility admins can view all memberships" ON facility_users;
DROP POLICY IF EXISTS "Facility owners can manage users" ON facility_users;
DROP POLICY IF EXISTS "Public can view facility memberships for counting" ON facility_users;
DROP POLICY IF EXISTS "Users can create facility memberships" ON facility_users;
DROP POLICY IF EXISTS "Users can view own memberships" ON facility_users;

-- Create simple SELECT policy for everyone (no recursion)
CREATE POLICY "Allow public read access to facility memberships"
  ON facility_users
  FOR SELECT
  TO public
  USING (true);

-- Allow authenticated users to insert their own memberships
CREATE POLICY "Allow users to create own memberships"
  ON facility_users
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Allow authenticated users to update their own memberships
CREATE POLICY "Allow users to update own memberships"
  ON facility_users
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Allow authenticated users to delete their own memberships
CREATE POLICY "Allow users to delete own memberships"
  ON facility_users
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());
