/*
  # Allow Public Access to Facility User Counts

  1. Changes
    - Add policy to allow public (including anonymous users) to count facility_users
    - This enables follower counts to be visible even when not logged in
  
  2. Security
    - Only SELECT access is granted for counting purposes
    - All other operations remain restricted to authenticated users
*/

CREATE POLICY "Public can view facility memberships for counting"
  ON facility_users
  FOR SELECT
  TO public
  USING (true);
