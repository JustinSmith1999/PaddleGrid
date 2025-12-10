/*
  # Fix facility_users infinite recursion in RLS policies
  
  1. Changes
    - Drop existing policies that cause infinite recursion
    - Create simpler policies that don't reference facility_users within facility_users queries
  
  2. Security
    - Users can view their own memberships directly
    - Facility admins/owners can view all memberships through a security definer function
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Facility owners can manage facility users" ON facility_users;
DROP POLICY IF EXISTS "Users can view facility memberships they belong to" ON facility_users;

-- Create a security definer function to check if user is facility admin
CREATE OR REPLACE FUNCTION is_facility_admin(p_facility_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM facility_users 
    WHERE facility_id = p_facility_id 
      AND user_id = p_user_id 
      AND role IN ('admin', 'owner')
  );
$$;

-- Users can view their own facility memberships
CREATE POLICY "Users can view own memberships"
  ON facility_users
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Facility admins can view all memberships in their facility
CREATE POLICY "Facility admins can view all memberships"
  ON facility_users
  FOR SELECT
  TO authenticated
  USING (is_facility_admin(facility_id, auth.uid()));

-- Facility owners can manage (insert/update/delete) users
CREATE POLICY "Facility owners can manage users"
  ON facility_users
  FOR ALL
  TO authenticated
  USING (is_facility_admin(facility_id, auth.uid()))
  WITH CHECK (is_facility_admin(facility_id, auth.uid()));
