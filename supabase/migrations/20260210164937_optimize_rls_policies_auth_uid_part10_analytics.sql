/*
  # Optimize RLS Policies with auth.uid() - Part 10 (Analytics & Loyalty)
  
  1. Changes
    - Optimizes RLS policies for analytics and loyalty tables
    - Wraps auth.uid() with (select auth.uid()) to prevent per-row re-evaluation
    - Covers: court_performance, equipment_rentals, league_members, league_matches,
      member_retention_metrics, player_performance_metrics, revenue_tracking,
      loyalty tables, rewards, user_rewards
  
  2. Security
    - Maintains identical security logic
    - Only optimization change, no functional changes
*/

-- Court performance table
DROP POLICY IF EXISTS "Admins can view court performance" ON court_performance;
CREATE POLICY "Admins can view court performance" 
  ON court_performance FOR SELECT 
  TO authenticated 
  USING (
    EXISTS ( 
      SELECT 1
      FROM profiles
      WHERE ((profiles.id = (select auth.uid())) AND (profiles.role = 'admin'::text))
    )
  );

DROP POLICY IF EXISTS "Admins can manage court performance" ON court_performance;
CREATE POLICY "Admins can manage court performance" 
  ON court_performance FOR ALL 
  TO authenticated 
  USING (
    EXISTS ( 
      SELECT 1
      FROM profiles
      WHERE ((profiles.id = (select auth.uid())) AND (profiles.role = 'admin'::text))
    )
  );

-- Equipment rentals table
DROP POLICY IF EXISTS "Users can view own rentals" ON equipment_rentals;
CREATE POLICY "Users can view own rentals" 
  ON equipment_rentals FOR SELECT 
  TO authenticated 
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can create rentals" ON equipment_rentals;
CREATE POLICY "Users can create rentals" 
  ON equipment_rentals FOR INSERT 
  TO authenticated 
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Admins can manage all rentals" ON equipment_rentals;
CREATE POLICY "Admins can manage all rentals" 
  ON equipment_rentals FOR ALL 
  TO authenticated 
  USING (
    EXISTS ( 
      SELECT 1
      FROM profiles
      WHERE ((profiles.id = (select auth.uid())) AND (profiles.role = 'admin'::text))
    )
  );

-- League members table
DROP POLICY IF EXISTS "Captains can manage team roster" ON league_members;
CREATE POLICY "Captains can manage team roster" 
  ON league_members FOR ALL 
  TO authenticated 
  USING (
    EXISTS ( 
      SELECT 1
      FROM league_teams
      WHERE ((league_teams.id = league_members.team_id) 
        AND (league_teams.captain_id = (select auth.uid())))
    )
  );

-- League matches table
DROP POLICY IF EXISTS "Admins can manage matches" ON league_matches;
CREATE POLICY "Admins can manage matches" 
  ON league_matches FOR ALL 
  TO authenticated 
  USING (
    EXISTS ( 
      SELECT 1
      FROM profiles
      WHERE ((profiles.id = (select auth.uid())) AND (profiles.role = 'admin'::text))
    )
  );

-- Member retention metrics table
DROP POLICY IF EXISTS "Admins can view retention metrics" ON member_retention_metrics;
CREATE POLICY "Admins can view retention metrics" 
  ON member_retention_metrics FOR SELECT 
  TO authenticated 
  USING (
    EXISTS ( 
      SELECT 1
      FROM profiles
      WHERE ((profiles.id = (select auth.uid())) AND (profiles.role = 'admin'::text))
    )
  );

DROP POLICY IF EXISTS "Admins can manage retention metrics" ON member_retention_metrics;
CREATE POLICY "Admins can manage retention metrics" 
  ON member_retention_metrics FOR ALL 
  TO authenticated 
  USING (
    EXISTS ( 
      SELECT 1
      FROM profiles
      WHERE ((profiles.id = (select auth.uid())) AND (profiles.role = 'admin'::text))
    )
  );

-- Player performance metrics table
DROP POLICY IF EXISTS "Users can view own performance metrics" ON player_performance_metrics;
CREATE POLICY "Users can view own performance metrics" 
  ON player_performance_metrics FOR SELECT 
  TO authenticated 
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Admins can view all performance metrics" ON player_performance_metrics;
CREATE POLICY "Admins can view all performance metrics" 
  ON player_performance_metrics FOR SELECT 
  TO authenticated 
  USING (
    EXISTS ( 
      SELECT 1
      FROM profiles
      WHERE ((profiles.id = (select auth.uid())) AND (profiles.role = 'admin'::text))
    )
  );

-- Revenue tracking table
DROP POLICY IF EXISTS "Admins can view revenue tracking" ON revenue_tracking;
CREATE POLICY "Admins can view revenue tracking" 
  ON revenue_tracking FOR SELECT 
  TO authenticated 
  USING (
    EXISTS ( 
      SELECT 1
      FROM profiles
      WHERE ((profiles.id = (select auth.uid())) AND (profiles.role = 'admin'::text))
    )
  );

DROP POLICY IF EXISTS "Admins can manage revenue tracking" ON revenue_tracking;
CREATE POLICY "Admins can manage revenue tracking" 
  ON revenue_tracking FOR ALL 
  TO authenticated 
  USING (
    EXISTS ( 
      SELECT 1
      FROM profiles
      WHERE ((profiles.id = (select auth.uid())) AND (profiles.role = 'admin'::text))
    )
  );

-- Loyalty accounts table
DROP POLICY IF EXISTS "Users can view own loyalty account" ON loyalty_accounts;
CREATE POLICY "Users can view own loyalty account" 
  ON loyalty_accounts FOR SELECT 
  TO authenticated 
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Facility admins can view all accounts" ON loyalty_accounts;
CREATE POLICY "Facility admins can view all accounts" 
  ON loyalty_accounts FOR SELECT 
  TO authenticated 
  USING (
    EXISTS ( 
      SELECT 1
      FROM facility_users
      WHERE ((facility_users.facility_id = loyalty_accounts.facility_id) 
        AND (facility_users.user_id = (select auth.uid())) 
        AND (facility_users.role = ANY (ARRAY['admin'::text, 'owner'::text])))
    )
  );

-- Loyalty transactions table
DROP POLICY IF EXISTS "Users can view own transactions" ON loyalty_transactions;
CREATE POLICY "Users can view own transactions" 
  ON loyalty_transactions FOR SELECT 
  TO authenticated 
  USING ((select auth.uid()) = user_id);

-- Loyalty rewards table
DROP POLICY IF EXISTS "Facility admins can manage rewards" ON loyalty_rewards;
CREATE POLICY "Facility admins can manage rewards" 
  ON loyalty_rewards FOR ALL 
  TO authenticated 
  USING (
    EXISTS ( 
      SELECT 1
      FROM facility_users
      WHERE ((facility_users.facility_id = loyalty_rewards.facility_id) 
        AND (facility_users.user_id = (select auth.uid())) 
        AND (facility_users.role = ANY (ARRAY['admin'::text, 'owner'::text])))
    )
  );

-- Loyalty redemptions table
DROP POLICY IF EXISTS "Users can view own redemptions" ON loyalty_redemptions;
CREATE POLICY "Users can view own redemptions" 
  ON loyalty_redemptions FOR SELECT 
  TO authenticated 
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can create own redemptions" ON loyalty_redemptions;
CREATE POLICY "Users can create own redemptions" 
  ON loyalty_redemptions FOR INSERT 
  TO authenticated 
  WITH CHECK ((select auth.uid()) = user_id);

-- Rewards table
DROP POLICY IF EXISTS "Admins can manage rewards" ON rewards;
CREATE POLICY "Admins can manage rewards" 
  ON rewards FOR ALL 
  TO authenticated 
  USING (
    EXISTS ( 
      SELECT 1
      FROM profiles
      WHERE ((profiles.id = (select auth.uid())) AND (profiles.role = 'admin'::text))
    )
  );

-- User rewards table
DROP POLICY IF EXISTS "Users can view own rewards" ON user_rewards;
CREATE POLICY "Users can view own rewards" 
  ON user_rewards FOR SELECT 
  TO authenticated 
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can claim rewards" ON user_rewards;
CREATE POLICY "Users can claim rewards" 
  ON user_rewards FOR INSERT 
  TO authenticated 
  WITH CHECK ((select auth.uid()) = user_id);
