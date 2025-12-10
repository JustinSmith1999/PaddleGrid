/*
  # Allow Facilities to View Match Participants

  1. Changes
    - Add RLS policy on profiles table to allow facility owners/admins to view contact information 
      of users who have joined their matches
    - Facility can only see profiles of users who are participants in social posts they created

  2. Security
    - Users who join a match on a facility's social post consent to sharing their profile info 
      with that facility
    - Facilities can only see info for users who joined THEIR posts, not all users
*/

-- Allow facilities to view profiles of users who joined their matches
CREATE POLICY "Facilities can view participants in their posts"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM social_post_participants spp
      JOIN social_posts sp ON sp.id = spp.post_id
      WHERE spp.user_id = profiles.id
        AND sp.author_id = auth.uid()
    )
  );
