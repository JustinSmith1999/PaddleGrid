/*
  # Fix Remaining Social Feature Policies
  
  Update all remaining social feature policies to use (select auth.uid()) pattern
  for improved performance and consistency.
  
  ## Tables Fixed
  
  - social_post_likes
  - social_comments
  - social_follows
  - social_notifications
  - social_post_participants
*/

-- ============================================================================
-- Social Post Likes
-- ============================================================================

DROP POLICY IF EXISTS "Users can create own likes" ON social_post_likes;
CREATE POLICY "Users can create own likes"
  ON social_post_likes FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own likes" ON social_post_likes;
CREATE POLICY "Users can delete own likes"
  ON social_post_likes FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- ============================================================================
-- Social Comments
-- ============================================================================

DROP POLICY IF EXISTS "Users can create comments" ON social_comments;
CREATE POLICY "Users can create comments"
  ON social_comments FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = author_id);

DROP POLICY IF EXISTS "Users can update own comments" ON social_comments;
CREATE POLICY "Users can update own comments"
  ON social_comments FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = author_id);

DROP POLICY IF EXISTS "Users can delete own comments" ON social_comments;
CREATE POLICY "Users can delete own comments"
  ON social_comments FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = author_id);

-- ============================================================================
-- Social Follows
-- ============================================================================

DROP POLICY IF EXISTS "Users can create own follows" ON social_follows;
CREATE POLICY "Users can create own follows"
  ON social_follows FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = follower_id);

DROP POLICY IF EXISTS "Users can delete own follows" ON social_follows;
CREATE POLICY "Users can delete own follows"
  ON social_follows FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = follower_id);

-- ============================================================================
-- Social Notifications
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own notifications" ON social_notifications;
CREATE POLICY "Users can view own notifications"
  ON social_notifications FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own notifications" ON social_notifications;
CREATE POLICY "Users can update own notifications"
  ON social_notifications FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own notifications" ON social_notifications;
CREATE POLICY "Users can delete own notifications"
  ON social_notifications FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- ============================================================================
-- Social Post Participants
-- ============================================================================

DROP POLICY IF EXISTS "Users can join posts" ON social_post_participants;
CREATE POLICY "Users can join posts"
  ON social_post_participants FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can leave posts" ON social_post_participants;
CREATE POLICY "Users can leave posts"
  ON social_post_participants FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);