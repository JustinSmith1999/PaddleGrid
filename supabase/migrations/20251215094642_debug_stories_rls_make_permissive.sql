/*
  # Debug Stories RLS - Make Temporarily Permissive

  1. Changes
    - Drop existing insert policies
    - Create a very permissive policy for debugging
    - This will help us identify if it's an RLS issue or something else
    
  2. Security
    - TEMPORARY: Allow all authenticated users to insert stories
    - Will be tightened after debugging
*/

-- Drop all existing insert policies
DROP POLICY IF EXISTS "Users can create own stories" ON stories;
DROP POLICY IF EXISTS "Facilities can create stories" ON stories;

-- Create a very permissive policy for debugging
CREATE POLICY "Authenticated users can create stories"
  ON stories FOR INSERT
  TO authenticated
  WITH CHECK (true);
