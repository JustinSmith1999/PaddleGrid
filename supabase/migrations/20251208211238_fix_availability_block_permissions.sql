/*
  # Fix Availability Block Creation Permissions

  1. Problem
    - Trigger function has SECURITY DEFINER but RLS policy still blocks inserts
    - Regular users can't create bookings because trigger can't create blocks
    - Need to allow system-generated blocks from bookings

  2. Solution
    - Add a policy that allows inserting blocks for 'reservation' type
    - This allows the trigger to create blocks when users book
    - Keep admin-only restrictions for other block types

  3. Security
    - Only 'reservation' type blocks can be auto-created
    - Other block types still require admin permissions
*/

-- Drop the old restrictive INSERT policy
DROP POLICY IF EXISTS "Facility admins can create availability blocks" ON court_availability_blocks;

-- Create new policies: one for system (reservations), one for admins (all types)
CREATE POLICY "System can create reservation blocks"
  ON court_availability_blocks
  FOR INSERT
  TO authenticated
  WITH CHECK (block_type = 'reservation');

CREATE POLICY "Facility admins can create any blocks"
  ON court_availability_blocks
  FOR INSERT
  TO authenticated
  WITH CHECK (
    block_type != 'reservation' 
    AND EXISTS (
      SELECT 1 FROM facility_users
      WHERE facility_users.facility_id = court_availability_blocks.facility_id
        AND facility_users.user_id = auth.uid()
        AND facility_users.role IN ('owner', 'admin', 'staff')
    )
  );
