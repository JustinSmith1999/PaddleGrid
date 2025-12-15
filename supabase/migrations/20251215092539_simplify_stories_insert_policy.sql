/*
  # Simplify Stories Insert Policy

  1. Changes
    - Drop and recreate the insert policy with better checks
    - Ensure users can insert stories for themselves
    - Add check to verify profile exists
    
  2. Security
    - Authenticated users can create stories
    - Must have a valid profile
    - User ID must match authenticated user
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can create own stories" ON stories;

-- Recreate with explicit profile check
CREATE POLICY "Users can create own stories"
  ON stories FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid()
    )
  );
