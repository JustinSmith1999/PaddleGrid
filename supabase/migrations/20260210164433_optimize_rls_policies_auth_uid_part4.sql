/*
  # Optimize RLS Policies with auth.uid() - Part 4
  
  1. Changes
    - Optimizes RLS policies for additional high-traffic tables
    - Wraps auth.uid() with (select auth.uid()) to prevent per-row re-evaluation
    - Covers: live_matches, recurring_bookings, streaks, achievements, user_achievements, 
      leagues, ladders
  
  2. Security
    - Maintains identical security logic
    - Only optimization change, no functional changes
*/

-- Live matches table
DROP POLICY IF EXISTS "Players can manage their matches" ON live_matches;
CREATE POLICY "Players can manage their matches" 
  ON live_matches FOR ALL 
  TO authenticated 
  USING (
    (((select auth.uid()) = team1_player1_id) 
      OR ((select auth.uid()) = team1_player2_id)) 
    OR ((select auth.uid()) = team2_player1_id) 
    OR ((select auth.uid()) = team2_player2_id)
  )
  WITH CHECK (
    (((select auth.uid()) = team1_player1_id) 
      OR ((select auth.uid()) = team1_player2_id)) 
    OR ((select auth.uid()) = team2_player1_id) 
    OR ((select auth.uid()) = team2_player2_id)
  );

-- Recurring bookings table
DROP POLICY IF EXISTS "Users can view own recurring bookings" ON recurring_bookings;
CREATE POLICY "Users can view own recurring bookings" 
  ON recurring_bookings FOR SELECT 
  TO authenticated 
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Admins can view all recurring bookings" ON recurring_bookings;
CREATE POLICY "Admins can view all recurring bookings" 
  ON recurring_bookings FOR SELECT 
  TO authenticated 
  USING (
    EXISTS ( 
      SELECT 1
      FROM profiles
      WHERE ((profiles.id = (select auth.uid())) AND (profiles.role = 'admin'::text))
    )
  );

DROP POLICY IF EXISTS "Users can manage own recurring bookings" ON recurring_bookings;
CREATE POLICY "Users can manage own recurring bookings" 
  ON recurring_bookings FOR ALL 
  TO authenticated 
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- Streaks table
DROP POLICY IF EXISTS "Users can manage own streaks" ON streaks;
CREATE POLICY "Users can manage own streaks" 
  ON streaks FOR ALL 
  TO authenticated 
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- Achievements table
DROP POLICY IF EXISTS "Admins can manage achievements" ON achievements;
CREATE POLICY "Admins can manage achievements" 
  ON achievements FOR ALL 
  TO authenticated 
  USING (
    EXISTS ( 
      SELECT 1
      FROM profiles
      WHERE ((profiles.id = (select auth.uid())) AND (profiles.role = 'admin'::text))
    )
  );

-- User achievements table
DROP POLICY IF EXISTS "Users can view own achievements" ON user_achievements;
CREATE POLICY "Users can view own achievements" 
  ON user_achievements FOR SELECT 
  TO authenticated 
  USING ((select auth.uid()) = user_id);

-- Leagues table
DROP POLICY IF EXISTS "Admins can manage leagues" ON leagues;
CREATE POLICY "Admins can manage leagues" 
  ON leagues FOR ALL 
  TO authenticated 
  USING (
    EXISTS ( 
      SELECT 1
      FROM profiles
      WHERE ((profiles.id = (select auth.uid())) AND (profiles.role = 'platform_admin'::text))
    )
  );

DROP POLICY IF EXISTS "Facility admins can manage leagues" ON leagues;
CREATE POLICY "Facility admins can manage leagues" 
  ON leagues FOR ALL 
  TO authenticated 
  USING (
    EXISTS ( 
      SELECT 1
      FROM facility_users
      WHERE ((facility_users.facility_id = leagues.facility_id) 
        AND (facility_users.user_id = (select auth.uid())) 
        AND (facility_users.role = ANY (ARRAY['admin'::text, 'owner'::text])))
    )
  );

DROP POLICY IF EXISTS "Users can view leagues in their facilities" ON leagues;
CREATE POLICY "Users can view leagues in their facilities" 
  ON leagues FOR SELECT 
  TO authenticated 
  USING (
    EXISTS ( 
      SELECT 1
      FROM facility_users
      WHERE ((facility_users.facility_id = leagues.facility_id) 
        AND (facility_users.user_id = (select auth.uid())))
    )
  );

-- Ladders table
DROP POLICY IF EXISTS "Admins can manage ladders" ON ladders;
CREATE POLICY "Admins can manage ladders" 
  ON ladders FOR ALL 
  TO authenticated 
  USING (
    EXISTS ( 
      SELECT 1
      FROM profiles
      WHERE ((profiles.id = (select auth.uid())) AND (profiles.role = 'admin'::text))
    )
  );
