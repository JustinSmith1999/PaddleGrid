/*
  # Re-enable Stories RLS with Correct Policies

  1. Changes
    - Re-enable RLS on stories table
    - Create proper insert policies for users and facilities
    - Ensure policies are correctly configured
    
  2. Security
    - Users can only create stories for themselves
    - Facilities can create stories if user is owner/admin
*/

-- Re-enable RLS
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;

-- Drop the temporary permissive policy
DROP POLICY IF EXISTS "Authenticated users can create stories" ON stories;

-- Create proper user story policy
CREATE POLICY "Users can create own stories"
  ON stories FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Create proper facility story policy
CREATE POLICY "Facilities can create stories"
  ON stories FOR INSERT
  TO authenticated
  WITH CHECK (
    facility_id IS NOT NULL 
    AND EXISTS (
      SELECT 1 FROM facility_users
      WHERE facility_users.facility_id = stories.facility_id
      AND facility_users.user_id = auth.uid()
      AND facility_users.role IN ('owner', 'admin')
    )
  );
