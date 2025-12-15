/*
  # Fix Stories RLS Policy

  1. Changes
    - Drop the existing restrictive insert policy
    - Add a new policy that properly handles user story creation
    - Ensure the policy checks match the actual data being inserted
    
  2. Security
    - Users can only create stories for themselves
    - The policy properly validates the user_id matches auth.uid()
*/

-- Drop the old policy
DROP POLICY IF EXISTS "Users can create own stories" ON stories;

-- Create a new, more reliable policy
CREATE POLICY "Users can create own stories"
  ON stories FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id IS NOT NULL AND 
    user_id::text = auth.uid()::text
  );
