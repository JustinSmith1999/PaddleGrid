/*
  # Fix Social Posts Visibility
  
  Fix the social posts SELECT policy to properly handle visibility checks
  after RLS was enabled on profiles table.
  
  ## Changes
  
  - Update "Users can view posts based on visibility" policy to work correctly
  - Simplify facility visibility check
  - Use (select auth.uid()) pattern for performance
*/

-- Drop and recreate the social posts viewing policy
DROP POLICY IF EXISTS "Users can view posts based on visibility" ON social_posts;

CREATE POLICY "Users can view posts based on visibility"
  ON social_posts FOR SELECT
  TO authenticated
  USING (
    is_archived = false
    AND (
      -- Public posts are visible to everyone
      visibility = 'public'
      
      -- Facility posts are visible to users in that facility (or if no facility specified)
      OR (
        visibility = 'facility' 
        AND (
          facility_id IS NULL
          OR (select auth.uid()) = author_id
          OR EXISTS (
            SELECT 1 FROM facility_users
            WHERE facility_users.facility_id = social_posts.facility_id
            AND facility_users.user_id = (select auth.uid())
          )
        )
      )
      
      -- Friends posts are visible to author and their followers
      OR (
        visibility = 'friends'
        AND (
          (select auth.uid()) = author_id
          OR EXISTS (
            SELECT 1 FROM social_follows
            WHERE (
              (social_follows.follower_id = (select auth.uid()) AND social_follows.following_id = social_posts.author_id)
              OR (social_follows.following_id = (select auth.uid()) AND social_follows.follower_id = social_posts.author_id)
            )
          )
        )
      )
    )
  );

-- Also update the other social_posts policies to use (select auth.uid())
DROP POLICY IF EXISTS "Users can create own posts" ON social_posts;
CREATE POLICY "Users can create own posts"
  ON social_posts FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = author_id);

DROP POLICY IF EXISTS "Users can update own posts" ON social_posts;
CREATE POLICY "Users can update own posts"
  ON social_posts FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = author_id)
  WITH CHECK ((select auth.uid()) = author_id);

DROP POLICY IF EXISTS "Users can delete own posts" ON social_posts;
CREATE POLICY "Users can delete own posts"
  ON social_posts FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = author_id);

DROP POLICY IF EXISTS "Facility admins can moderate posts" ON social_posts;
CREATE POLICY "Facility admins can moderate posts"
  ON social_posts FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM facility_users
      WHERE facility_users.facility_id = social_posts.facility_id
      AND facility_users.user_id = (select auth.uid())
      AND facility_users.role IN ('admin', 'owner')
    )
  );