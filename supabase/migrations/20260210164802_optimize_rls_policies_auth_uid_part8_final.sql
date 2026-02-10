/*
  # Optimize RLS Policies with auth.uid() - Part 8 (Final)
  
  1. Changes
    - Optimizes RLS policies for remaining tables
    - Wraps auth.uid() with (select auth.uid()) to prevent per-row re-evaluation
    - Covers: conversation_participants, court_alerts, event_categories, 
      event_series_occurrences, facility_testimonials, facility_videos,
      ladder_challenges, league_teams, match_videos, push_notification_tokens, tournament_matches
  
  2. Security
    - Maintains identical security logic
    - Only optimization change, no functional changes
    
  3. Completion
    - This is the final part of the RLS optimization migration
    - All tables with auth.uid() policies have now been optimized
*/

-- Conversation participants table
DROP POLICY IF EXISTS "Participants can view conversation members" ON conversation_participants;
CREATE POLICY "Participants can view conversation members" 
  ON conversation_participants FOR SELECT 
  TO authenticated 
  USING (
    conversation_id IN ( 
      SELECT conversation_participants_1.conversation_id
      FROM conversation_participants conversation_participants_1
      WHERE (conversation_participants_1.user_id = (select auth.uid()))
    )
  );

DROP POLICY IF EXISTS "Users can join conversations" ON conversation_participants;
CREATE POLICY "Users can join conversations" 
  ON conversation_participants FOR INSERT 
  TO authenticated 
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own participation" ON conversation_participants;
CREATE POLICY "Users can update own participation" 
  ON conversation_participants FOR UPDATE 
  TO authenticated 
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- Court alerts table
DROP POLICY IF EXISTS "Users can view own alerts" ON court_alerts;
CREATE POLICY "Users can view own alerts" 
  ON court_alerts FOR SELECT 
  TO authenticated 
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can manage own alerts" ON court_alerts;
CREATE POLICY "Users can manage own alerts" 
  ON court_alerts FOR ALL 
  TO authenticated 
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- Event categories table
DROP POLICY IF EXISTS "Facility admins can manage categories" ON event_categories;
CREATE POLICY "Facility admins can manage categories" 
  ON event_categories FOR ALL 
  TO authenticated 
  USING (
    EXISTS ( 
      SELECT 1
      FROM facility_users
      WHERE ((facility_users.facility_id = event_categories.facility_id) 
        AND (facility_users.user_id = (select auth.uid())) 
        AND (facility_users.role = ANY (ARRAY['admin'::text, 'owner'::text])))
    )
  )
  WITH CHECK (
    EXISTS ( 
      SELECT 1
      FROM facility_users
      WHERE ((facility_users.facility_id = event_categories.facility_id) 
        AND (facility_users.user_id = (select auth.uid())) 
        AND (facility_users.role = ANY (ARRAY['admin'::text, 'owner'::text])))
    )
  );

-- Event series occurrences table
DROP POLICY IF EXISTS "Admins can insert occurrences" ON event_series_occurrences;
CREATE POLICY "Admins can insert occurrences" 
  ON event_series_occurrences FOR INSERT 
  TO authenticated 
  WITH CHECK (
    EXISTS ( 
      SELECT 1
      FROM profiles
      WHERE ((profiles.id = (select auth.uid())) 
        AND (profiles.role = ANY (ARRAY['admin'::text, 'facility_manager'::text])))
    )
  );

DROP POLICY IF EXISTS "Admins can update occurrences" ON event_series_occurrences;
CREATE POLICY "Admins can update occurrences" 
  ON event_series_occurrences FOR UPDATE 
  TO authenticated 
  USING (
    EXISTS ( 
      SELECT 1
      FROM profiles
      WHERE ((profiles.id = (select auth.uid())) 
        AND (profiles.role = ANY (ARRAY['admin'::text, 'facility_manager'::text])))
    )
  )
  WITH CHECK (
    EXISTS ( 
      SELECT 1
      FROM profiles
      WHERE ((profiles.id = (select auth.uid())) 
        AND (profiles.role = ANY (ARRAY['admin'::text, 'facility_manager'::text])))
    )
  );

DROP POLICY IF EXISTS "Admins can delete occurrences" ON event_series_occurrences;
CREATE POLICY "Admins can delete occurrences" 
  ON event_series_occurrences FOR DELETE 
  TO authenticated 
  USING (
    EXISTS ( 
      SELECT 1
      FROM profiles
      WHERE ((profiles.id = (select auth.uid())) 
        AND (profiles.role = ANY (ARRAY['admin'::text, 'facility_manager'::text])))
    )
  );

-- Facility testimonials table
DROP POLICY IF EXISTS "Users can create their own testimonials" ON facility_testimonials;
CREATE POLICY "Users can create their own testimonials" 
  ON facility_testimonials FOR INSERT 
  TO authenticated 
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update their own testimonials" ON facility_testimonials;
CREATE POLICY "Users can update their own testimonials" 
  ON facility_testimonials FOR UPDATE 
  TO authenticated 
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Facility admins can manage testimonials" ON facility_testimonials;
CREATE POLICY "Facility admins can manage testimonials" 
  ON facility_testimonials FOR ALL 
  TO authenticated 
  USING (
    EXISTS ( 
      SELECT 1
      FROM facility_users
      WHERE ((facility_users.facility_id = facility_testimonials.facility_id) 
        AND (facility_users.user_id = (select auth.uid())) 
        AND (facility_users.role = ANY (ARRAY['admin'::text, 'owner'::text])))
    )
  );

-- Facility videos table
DROP POLICY IF EXISTS "Facility admins can upload videos" ON facility_videos;
CREATE POLICY "Facility admins can upload videos" 
  ON facility_videos FOR INSERT 
  TO authenticated 
  WITH CHECK (
    EXISTS ( 
      SELECT 1
      FROM facility_users
      WHERE ((facility_users.facility_id = facility_videos.facility_id) 
        AND (facility_users.user_id = (select auth.uid())) 
        AND (facility_users.role = ANY (ARRAY['admin'::text, 'owner'::text])))
    )
  );

DROP POLICY IF EXISTS "Facility admins can update their facility videos" ON facility_videos;
CREATE POLICY "Facility admins can update their facility videos" 
  ON facility_videos FOR UPDATE 
  TO authenticated 
  USING (
    EXISTS ( 
      SELECT 1
      FROM facility_users
      WHERE ((facility_users.facility_id = facility_videos.facility_id) 
        AND (facility_users.user_id = (select auth.uid())) 
        AND (facility_users.role = ANY (ARRAY['admin'::text, 'owner'::text])))
    )
  )
  WITH CHECK (
    EXISTS ( 
      SELECT 1
      FROM facility_users
      WHERE ((facility_users.facility_id = facility_videos.facility_id) 
        AND (facility_users.user_id = (select auth.uid())) 
        AND (facility_users.role = ANY (ARRAY['admin'::text, 'owner'::text])))
    )
  );

DROP POLICY IF EXISTS "Facility admins can delete their facility videos" ON facility_videos;
CREATE POLICY "Facility admins can delete their facility videos" 
  ON facility_videos FOR DELETE 
  TO authenticated 
  USING (
    EXISTS ( 
      SELECT 1
      FROM facility_users
      WHERE ((facility_users.facility_id = facility_videos.facility_id) 
        AND (facility_users.user_id = (select auth.uid())) 
        AND (facility_users.role = ANY (ARRAY['admin'::text, 'owner'::text])))
    )
  );

-- Ladder challenges table
DROP POLICY IF EXISTS "Users can view their challenges" ON ladder_challenges;
CREATE POLICY "Users can view their challenges" 
  ON ladder_challenges FOR SELECT 
  TO authenticated 
  USING (((select auth.uid()) = challenger_id) OR ((select auth.uid()) = challenged_id));

DROP POLICY IF EXISTS "Users can create challenges" ON ladder_challenges;
CREATE POLICY "Users can create challenges" 
  ON ladder_challenges FOR INSERT 
  TO authenticated 
  WITH CHECK ((select auth.uid()) = challenger_id);

DROP POLICY IF EXISTS "Users can update their challenges" ON ladder_challenges;
CREATE POLICY "Users can update their challenges" 
  ON ladder_challenges FOR UPDATE 
  TO authenticated 
  USING (((select auth.uid()) = challenger_id) OR ((select auth.uid()) = challenged_id))
  WITH CHECK (((select auth.uid()) = challenger_id) OR ((select auth.uid()) = challenged_id));

-- League teams table
DROP POLICY IF EXISTS "Users can create teams" ON league_teams;
CREATE POLICY "Users can create teams" 
  ON league_teams FOR INSERT 
  TO authenticated 
  WITH CHECK ((select auth.uid()) = captain_id);

DROP POLICY IF EXISTS "Captains can update own team" ON league_teams;
CREATE POLICY "Captains can update own team" 
  ON league_teams FOR UPDATE 
  TO authenticated 
  USING ((select auth.uid()) = captain_id)
  WITH CHECK ((select auth.uid()) = captain_id);

DROP POLICY IF EXISTS "Admins can manage all teams" ON league_teams;
CREATE POLICY "Admins can manage all teams" 
  ON league_teams FOR ALL 
  TO authenticated 
  USING (
    EXISTS ( 
      SELECT 1
      FROM profiles
      WHERE ((profiles.id = (select auth.uid())) AND (profiles.role = 'admin'::text))
    )
  );

-- Match videos table
DROP POLICY IF EXISTS "Authenticated users can upload match videos" ON match_videos;
CREATE POLICY "Authenticated users can upload match videos" 
  ON match_videos FOR INSERT 
  TO authenticated 
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update their own match videos" ON match_videos;
CREATE POLICY "Users can update their own match videos" 
  ON match_videos FOR UPDATE 
  TO authenticated 
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete their own match videos" ON match_videos;
CREATE POLICY "Users can delete their own match videos" 
  ON match_videos FOR DELETE 
  TO authenticated 
  USING ((select auth.uid()) = user_id);

-- Push notification tokens table
DROP POLICY IF EXISTS "Users can manage their own push tokens" ON push_notification_tokens;
CREATE POLICY "Users can manage their own push tokens" 
  ON push_notification_tokens FOR ALL 
  TO authenticated 
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- Tournament matches table
DROP POLICY IF EXISTS "Facility admins can create matches" ON tournament_matches;
CREATE POLICY "Facility admins can create matches" 
  ON tournament_matches FOR INSERT 
  TO authenticated 
  WITH CHECK (
    EXISTS ( 
      SELECT 1
      FROM (tournaments t
        JOIN facility_users fu ON ((fu.facility_id = t.facility_id)))
      WHERE ((t.id = tournament_matches.tournament_id) 
        AND (fu.user_id = (select auth.uid())) 
        AND (fu.role = ANY (ARRAY['admin'::text, 'owner'::text])))
    )
  );

DROP POLICY IF EXISTS "Facility admins can update matches" ON tournament_matches;
CREATE POLICY "Facility admins can update matches" 
  ON tournament_matches FOR UPDATE 
  TO authenticated 
  USING (
    EXISTS ( 
      SELECT 1
      FROM (tournaments t
        JOIN facility_users fu ON ((fu.facility_id = t.facility_id)))
      WHERE ((t.id = tournament_matches.tournament_id) 
        AND (fu.user_id = (select auth.uid())) 
        AND (fu.role = ANY (ARRAY['admin'::text, 'owner'::text])))
    )
  )
  WITH CHECK (
    EXISTS ( 
      SELECT 1
      FROM (tournaments t
        JOIN facility_users fu ON ((fu.facility_id = t.facility_id)))
      WHERE ((t.id = tournament_matches.tournament_id) 
        AND (fu.user_id = (select auth.uid())) 
        AND (fu.role = ANY (ARRAY['admin'::text, 'owner'::text])))
    )
  );
