/*
  # Add Public Viewing Policies for Key Tables (Safe)
  
  Add simple policies with DROP IF EXISTS first to avoid conflicts.
  
  ## Changes
  1. Allow authenticated users to view courts
  2. Allow authenticated users to view events
  3. Allow authenticated users to view memberships
  4. Allow public viewing of instructors
  
  ## Security
  - Only SELECT permissions for public data
  - Users still can only modify their own data
*/

-- Drop existing if they exist
DROP POLICY IF EXISTS "Anyone can view courts" ON courts;
DROP POLICY IF EXISTS "Anyone can view events" ON events;
DROP POLICY IF EXISTS "Anyone can view memberships" ON memberships;
DROP POLICY IF EXISTS "Anyone can view instructors" ON instructors;
DROP POLICY IF EXISTS "Anyone can view leagues" ON leagues;
DROP POLICY IF EXISTS "Anyone can view lessons" ON lessons;

-- Courts - everyone can view
CREATE POLICY "Anyone can view courts"
  ON courts
  FOR SELECT
  TO authenticated
  USING (true);

-- Events - everyone can view
CREATE POLICY "Anyone can view events"
  ON events
  FOR SELECT
  TO authenticated
  USING (true);

-- Memberships - everyone can view
CREATE POLICY "Anyone can view memberships"
  ON memberships
  FOR SELECT
  TO authenticated
  USING (true);

-- Instructors - everyone can view
CREATE POLICY "Anyone can view instructors"
  ON instructors
  FOR SELECT
  TO authenticated
  USING (true);

-- Leagues - everyone can view
CREATE POLICY "Anyone can view leagues"
  ON leagues
  FOR SELECT
  TO authenticated
  USING (true);

-- Lessons - everyone can view
CREATE POLICY "Anyone can view lessons"
  ON lessons
  FOR SELECT
  TO authenticated
  USING (true);
