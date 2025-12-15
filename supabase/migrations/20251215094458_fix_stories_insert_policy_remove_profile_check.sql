/*
  # Fix Stories Insert Policy - Remove Profile Check

  1. Changes
    - Drop the existing insert policy that checks for profile existence
    - Create a simpler policy that only checks user_id matches auth.uid()
    - This allows authenticated users to post stories without requiring a profile check
    
  2. Security
    - Authenticated users can only create stories for themselves
    - The auth.uid() check ensures users can't impersonate others
*/

-- Drop the existing policy
DROP POLICY IF EXISTS "Users can create own stories" ON stories;

-- Create a simpler policy without the profile check
CREATE POLICY "Users can create own stories"
  ON stories FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());
