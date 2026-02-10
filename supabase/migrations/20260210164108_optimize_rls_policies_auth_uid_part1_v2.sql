/*
  # Optimize RLS Policies - Part 1 (Profiles & Core Tables)
  
  1. Performance Improvements
    - Wraps auth.uid() with (select auth.uid()) to prevent re-evaluation per row
    - Significantly improves query performance at scale
    - Affects high-traffic tables first: profiles, facility_users, bookings
  
  2. Changes
    - Drops existing policies
    - Recreates them with optimized auth function calls
    - Maintains exact same security logic
  
  3. Important Notes
    - This is part 1 of a multi-part migration
    - Each policy is dropped and recreated to ensure clean state
    - No security logic is changed, only performance optimization
*/

-- ============================================================================
-- PROFILES TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Authenticated users can insert profiles" ON profiles;
CREATE POLICY "Authenticated users can insert profiles" 
  ON profiles FOR INSERT 
  TO authenticated 
  WITH CHECK (true);

DROP POLICY IF EXISTS "Facilities can view participants in their posts" ON profiles;
CREATE POLICY "Facilities can view participants in their posts" 
  ON profiles FOR SELECT 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM facility_users fu
      WHERE fu.user_id = (select auth.uid())
        AND fu.role IN ('owner', 'admin')
    )
  );

DROP POLICY IF EXISTS "Post authors can view participants" ON profiles;
CREATE POLICY "Post authors can view participants" 
  ON profiles FOR SELECT 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM social_posts sp
      WHERE sp.author_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile" 
  ON profiles FOR INSERT 
  TO authenticated 
  WITH CHECK (id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" 
  ON profiles FOR UPDATE 
  TO authenticated 
  USING (id = (select auth.uid()))
  WITH CHECK (id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" 
  ON profiles FOR SELECT 
  TO authenticated 
  USING (id = (select auth.uid()));

-- ============================================================================
-- FACILITY_USERS TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Facility admins can view all memberships" ON facility_users;
CREATE POLICY "Facility admins can view all memberships" 
  ON facility_users FOR SELECT 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM facility_users fu
      WHERE fu.facility_id = facility_users.facility_id
        AND fu.user_id = (select auth.uid())
        AND fu.role IN ('owner', 'admin')
    )
  );

DROP POLICY IF EXISTS "Facility owners can manage users" ON facility_users;
CREATE POLICY "Facility owners can manage users" 
  ON facility_users FOR ALL 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM facility_users fu
      WHERE fu.facility_id = facility_users.facility_id
        AND fu.user_id = (select auth.uid())
        AND fu.role = 'owner'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM facility_users fu
      WHERE fu.facility_id = facility_users.facility_id
        AND fu.user_id = (select auth.uid())
        AND fu.role = 'owner'
    )
  );

DROP POLICY IF EXISTS "Users can create facility memberships" ON facility_users;
CREATE POLICY "Users can create facility memberships" 
  ON facility_users FOR INSERT 
  TO authenticated 
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can view own memberships" ON facility_users;
CREATE POLICY "Users can view own memberships" 
  ON facility_users FOR SELECT 
  TO authenticated 
  USING (user_id = (select auth.uid()));

-- ============================================================================
-- DUPR_MATCHES TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Facility admins can manage all matches" ON dupr_matches;
CREATE POLICY "Facility admins can manage all matches" 
  ON dupr_matches FOR ALL 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM facility_users fu
      WHERE fu.facility_id = dupr_matches.facility_id
        AND fu.user_id = (select auth.uid())
        AND fu.role IN ('owner', 'admin', 'desk')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM facility_users fu
      WHERE fu.facility_id = dupr_matches.facility_id
        AND fu.user_id = (select auth.uid())
        AND fu.role IN ('owner', 'admin', 'desk')
    )
  );

DROP POLICY IF EXISTS "Users can report matches in their facilities" ON dupr_matches;
CREATE POLICY "Users can report matches in their facilities" 
  ON dupr_matches FOR INSERT 
  TO authenticated 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM facility_users fu
      WHERE fu.facility_id = dupr_matches.facility_id
        AND fu.user_id = (select auth.uid())
    ) AND reported_by = (select auth.uid())
  );

DROP POLICY IF EXISTS "Users can update their own pending matches" ON dupr_matches;
CREATE POLICY "Users can update their own pending matches" 
  ON dupr_matches FOR UPDATE 
  TO authenticated 
  USING (reported_by = (select auth.uid()) AND status = 'pending')
  WITH CHECK (reported_by = (select auth.uid()));

DROP POLICY IF EXISTS "Users can view matches they participated in" ON dupr_matches;
CREATE POLICY "Users can view matches they participated in" 
  ON dupr_matches FOR SELECT 
  TO authenticated 
  USING (
    reported_by = (select auth.uid()) OR
    EXISTS (
      SELECT 1 FROM dupr_match_results dmr
      WHERE dmr.match_id = dupr_matches.id
        AND (dmr.player1_id = (select auth.uid()) OR dmr.player2_id = (select auth.uid()))
    )
  );

-- ============================================================================
-- DUPR_MATCH_RESULTS TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Facility admins can manage match results" ON dupr_match_results;
CREATE POLICY "Facility admins can manage match results" 
  ON dupr_match_results FOR ALL 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM dupr_matches dm
      JOIN facility_users fu ON fu.facility_id = dm.facility_id
      WHERE dm.id = dupr_match_results.match_id
        AND fu.user_id = (select auth.uid())
        AND fu.role IN ('owner', 'admin', 'desk')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM dupr_matches dm
      JOIN facility_users fu ON fu.facility_id = dm.facility_id
      WHERE dm.id = dupr_match_results.match_id
        AND fu.user_id = (select auth.uid())
        AND fu.role IN ('owner', 'admin', 'desk')
    )
  );

DROP POLICY IF EXISTS "Users can create match results for matches they report" ON dupr_match_results;
CREATE POLICY "Users can create match results for matches they report" 
  ON dupr_match_results FOR INSERT 
  TO authenticated 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM dupr_matches dm
      WHERE dm.id = dupr_match_results.match_id
        AND dm.reported_by = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can view match results for matches they can see" ON dupr_match_results;
CREATE POLICY "Users can view match results for matches they can see" 
  ON dupr_match_results FOR SELECT 
  TO authenticated 
  USING (
    player1_id = (select auth.uid()) OR
    player2_id = (select auth.uid()) OR
    EXISTS (
      SELECT 1 FROM dupr_matches dm
      WHERE dm.id = dupr_match_results.match_id
        AND dm.reported_by = (select auth.uid())
    )
  );

-- ============================================================================
-- DUPR_RATINGS_HISTORY TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Facility admins can view all rating history" ON dupr_ratings_history;
CREATE POLICY "Facility admins can view all rating history" 
  ON dupr_ratings_history FOR SELECT 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM dupr_matches dm
      JOIN facility_users fu ON fu.facility_id = dm.facility_id
      WHERE dm.id = dupr_ratings_history.match_id
        AND fu.user_id = (select auth.uid())
        AND fu.role IN ('owner', 'admin', 'desk')
    )
  );

DROP POLICY IF EXISTS "Users can view own rating history" ON dupr_ratings_history;
CREATE POLICY "Users can view own rating history" 
  ON dupr_ratings_history FOR SELECT 
  TO authenticated 
  USING (user_id = (select auth.uid()));
