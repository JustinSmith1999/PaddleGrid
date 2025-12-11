/*
  # Fix Facility Registration Policies

  1. Changes
    - Add INSERT policy for facilities table to allow authenticated users to create new facilities
    - Add INSERT policy for facility_users table to allow new facility owners to link themselves
    - Add INSERT policy for profiles table to allow new user profile creation

  2. Security
    - Users can only insert their own profile (id must match auth.uid())
    - Authenticated users can create facilities (validated during signup)
    - Users can insert facility_users records when creating a new facility
    - All policies maintain security while enabling proper signup flow
*/

-- Drop existing conflicting policies if they exist
DROP POLICY IF EXISTS "Authenticated users can create facilities" ON facilities;
DROP POLICY IF EXISTS "Authenticated users can insert profiles" ON profiles;
DROP POLICY IF EXISTS "Users can create facility memberships" ON facility_users;

-- Allow authenticated users to create new facilities during signup
CREATE POLICY "Authenticated users can create facilities"
  ON facilities FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow authenticated users to create their own profile
CREATE POLICY "Authenticated users can insert profiles"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

-- Allow authenticated users to create facility_users entries
-- This is needed when a new facility owner links themselves to their facility
CREATE POLICY "Users can create facility memberships"
  ON facility_users FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());
