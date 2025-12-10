/*
  # Allow Public Courts Browsing

  1. Changes
    - Update courts viewing policy to allow anonymous users
    - Enables browsing courts without authentication
  
  2. Security
    - Read-only access for browsing active courts
    - Write access still restricted to facility staff
*/

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Anyone can view active courts" ON courts;
DROP POLICY IF EXISTS "Users can view courts in their facilities" ON courts;

-- Add a public viewing policy for courts browsing
CREATE POLICY "Public can view active courts"
  ON courts
  FOR SELECT
  TO public
  USING (is_active = true);
