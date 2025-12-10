/*
  # Allow Public Facility Browsing

  1. Changes
    - Add policy to allow all users (authenticated and anonymous) to view facilities
    - This enables the "Browse Courts" feature to show all available facilities
  
  2. Security
    - Read-only access for browsing
    - Write access still restricted to facility owners and platform admins
*/

-- Drop the restrictive SELECT policy
DROP POLICY IF EXISTS "Users can view facilities they belong to" ON facilities;

-- Add a public viewing policy for facility browsing
CREATE POLICY "Anyone can view facilities"
  ON facilities
  FOR SELECT
  TO public
  USING (true);
