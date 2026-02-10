/*
  # Optimize RLS Policies with auth.uid() - Part 2
  
  1. Changes
    - Optimizes RLS policies for high-traffic tables by wrapping auth.uid() with (select auth.uid())
    - This prevents per-row re-evaluation of auth.uid() and improves query performance
    - Covers: notifications, match_disputes, challenge_ladder, player_matching_preferences,
      match_requests, activity_feed, activity_likes, activity_comments, leaderboard_settings
  
  2. Security
    - Maintains identical security logic
    - Only optimization change, no functional changes
*/

-- Notifications table
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
CREATE POLICY "Users can view their own notifications" 
  ON notifications FOR SELECT 
  TO authenticated 
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
CREATE POLICY "Users can update their own notifications" 
  ON notifications FOR UPDATE 
  TO authenticated 
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- Match disputes table
DROP POLICY IF EXISTS "Users can view disputes they created or are involved in" ON match_disputes;
CREATE POLICY "Users can view disputes they created or are involved in" 
  ON match_disputes FOR SELECT 
  TO authenticated 
  USING (
    (disputed_by_user_id = (select auth.uid())) 
    OR 
    (EXISTS ( 
      SELECT 1
      FROM dupr_match_results dmr
      WHERE ((dmr.match_id = match_disputes.match_id) 
        AND ((dmr.player1_id = (select auth.uid())) OR (dmr.player2_id = (select auth.uid()))))
    ))
  );

DROP POLICY IF EXISTS "Users can create disputes for matches they're in" ON match_disputes;
CREATE POLICY "Users can create disputes for matches they're in" 
  ON match_disputes FOR INSERT 
  TO authenticated 
  WITH CHECK (
    (disputed_by_user_id = (select auth.uid())) 
    AND 
    (EXISTS ( 
      SELECT 1
      FROM dupr_match_results dmr
      WHERE ((dmr.match_id = match_disputes.match_id) 
        AND ((dmr.player1_id = (select auth.uid())) OR (dmr.player2_id = (select auth.uid()))))
    ))
  );

-- Challenge ladder table
DROP POLICY IF EXISTS "Users can view challenges they're involved in" ON challenge_ladder;
CREATE POLICY "Users can view challenges they're involved in" 
  ON challenge_ladder FOR SELECT 
  TO authenticated 
  USING ((challenger_id = (select auth.uid())) OR (challenged_id = (select auth.uid())));

DROP POLICY IF EXISTS "Users can create challenges" ON challenge_ladder;
CREATE POLICY "Users can create challenges" 
  ON challenge_ladder FOR INSERT 
  TO authenticated 
  WITH CHECK (challenger_id = (select auth.uid()));

DROP POLICY IF EXISTS "Challenged users can update challenge status" ON challenge_ladder;
CREATE POLICY "Challenged users can update challenge status" 
  ON challenge_ladder FOR UPDATE 
  TO authenticated 
  USING ((challenged_id = (select auth.uid())) OR (challenger_id = (select auth.uid())))
  WITH CHECK ((challenged_id = (select auth.uid())) OR (challenger_id = (select auth.uid())));

-- Player matching preferences table
DROP POLICY IF EXISTS "Users can manage own matching preferences" ON player_matching_preferences;
CREATE POLICY "Users can manage own matching preferences" 
  ON player_matching_preferences FOR ALL 
  TO authenticated 
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- Match requests table
DROP POLICY IF EXISTS "Users can view their match requests" ON match_requests;
CREATE POLICY "Users can view their match requests" 
  ON match_requests FOR SELECT 
  TO authenticated 
  USING (((select auth.uid()) = from_user_id) OR ((select auth.uid()) = to_user_id));

DROP POLICY IF EXISTS "Users can create match requests" ON match_requests;
CREATE POLICY "Users can create match requests" 
  ON match_requests FOR INSERT 
  TO authenticated 
  WITH CHECK ((select auth.uid()) = from_user_id);

DROP POLICY IF EXISTS "Users can update their received requests" ON match_requests;
CREATE POLICY "Users can update their received requests" 
  ON match_requests FOR UPDATE 
  TO authenticated 
  USING ((select auth.uid()) = to_user_id)
  WITH CHECK ((select auth.uid()) = to_user_id);

-- Activity feed table
DROP POLICY IF EXISTS "Users can view public activities" ON activity_feed;
CREATE POLICY "Users can view public activities" 
  ON activity_feed FOR SELECT 
  TO authenticated 
  USING ((is_public = true) OR ((select auth.uid()) = user_id));

DROP POLICY IF EXISTS "Users can create own activities" ON activity_feed;
CREATE POLICY "Users can create own activities" 
  ON activity_feed FOR INSERT 
  TO authenticated 
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own activities" ON activity_feed;
CREATE POLICY "Users can update own activities" 
  ON activity_feed FOR UPDATE 
  TO authenticated 
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own activities" ON activity_feed;
CREATE POLICY "Users can delete own activities" 
  ON activity_feed FOR DELETE 
  TO authenticated 
  USING ((select auth.uid()) = user_id);

-- Activity likes table
DROP POLICY IF EXISTS "Users can manage own likes" ON activity_likes;
CREATE POLICY "Users can manage own likes" 
  ON activity_likes FOR ALL 
  TO authenticated 
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- Activity comments table
DROP POLICY IF EXISTS "Users can create comments" ON activity_comments;
CREATE POLICY "Users can create comments" 
  ON activity_comments FOR INSERT 
  TO authenticated 
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own comments" ON activity_comments;
CREATE POLICY "Users can delete own comments" 
  ON activity_comments FOR DELETE 
  TO authenticated 
  USING ((select auth.uid()) = user_id);

-- Leaderboard settings table
DROP POLICY IF EXISTS "Admins can manage leaderboards" ON leaderboard_settings;
CREATE POLICY "Admins can manage leaderboards" 
  ON leaderboard_settings FOR ALL 
  TO authenticated 
  USING (
    EXISTS ( 
      SELECT 1
      FROM profiles
      WHERE ((profiles.id = (select auth.uid())) AND (profiles.role = 'admin'::text))
    )
  );
