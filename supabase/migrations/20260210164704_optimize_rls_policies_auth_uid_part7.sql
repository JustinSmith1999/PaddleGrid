/*
  # Optimize RLS Policies with auth.uid() - Part 7
  
  1. Changes
    - Optimizes RLS policies for admin and facility management tables
    - Wraps auth.uid() with (select auth.uid()) to prevent per-row re-evaluation
    - Covers: achievement_progress, activity_kudos, club_achievements, content_reports,
      pre_registered_users, pre_memberships, court_availability_blocks, 
      tournament_participants, tournaments
  
  2. Security
    - Maintains identical security logic
    - Only optimization change, no functional changes
*/

-- Achievement progress table
DROP POLICY IF EXISTS "Users can view their own progress" ON achievement_progress;
CREATE POLICY "Users can view their own progress" 
  ON achievement_progress FOR SELECT 
  TO authenticated 
  USING ((select auth.uid()) = user_id);

-- Activity kudos table
DROP POLICY IF EXISTS "Users can give kudos" ON activity_kudos;
CREATE POLICY "Users can give kudos" 
  ON activity_kudos FOR INSERT 
  TO authenticated 
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can remove their kudos" ON activity_kudos;
CREATE POLICY "Users can remove their kudos" 
  ON activity_kudos FOR DELETE 
  TO authenticated 
  USING (user_id = (select auth.uid()));

-- Club achievements table
DROP POLICY IF EXISTS "Facility admins can manage club achievements" ON club_achievements;
CREATE POLICY "Facility admins can manage club achievements" 
  ON club_achievements FOR ALL 
  TO authenticated 
  USING (
    EXISTS ( 
      SELECT 1
      FROM facility_users
      WHERE ((facility_users.facility_id = club_achievements.facility_id) 
        AND (facility_users.user_id = (select auth.uid())) 
        AND (facility_users.role = ANY (ARRAY['admin'::text, 'owner'::text])))
    )
  )
  WITH CHECK (
    EXISTS ( 
      SELECT 1
      FROM facility_users
      WHERE ((facility_users.facility_id = club_achievements.facility_id) 
        AND (facility_users.user_id = (select auth.uid())) 
        AND (facility_users.role = ANY (ARRAY['admin'::text, 'owner'::text])))
    )
  );

-- Content reports table
DROP POLICY IF EXISTS "Users can view their own reports" ON content_reports;
CREATE POLICY "Users can view their own reports" 
  ON content_reports FOR SELECT 
  TO authenticated 
  USING (reporter_id = (select auth.uid()));

DROP POLICY IF EXISTS "Admins can view all reports" ON content_reports;
CREATE POLICY "Admins can view all reports" 
  ON content_reports FOR SELECT 
  TO authenticated 
  USING (
    EXISTS ( 
      SELECT 1
      FROM profiles
      WHERE ((profiles.id = (select auth.uid())) AND (profiles.role = 'admin'::text))
    )
  );

DROP POLICY IF EXISTS "Authenticated users can report content" ON content_reports;
CREATE POLICY "Authenticated users can report content" 
  ON content_reports FOR INSERT 
  TO authenticated 
  WITH CHECK (reporter_id = (select auth.uid()));

DROP POLICY IF EXISTS "Admins can update reports" ON content_reports;
CREATE POLICY "Admins can update reports" 
  ON content_reports FOR UPDATE 
  TO authenticated 
  USING (
    EXISTS ( 
      SELECT 1
      FROM profiles
      WHERE ((profiles.id = (select auth.uid())) AND (profiles.role = 'admin'::text))
    )
  )
  WITH CHECK (
    EXISTS ( 
      SELECT 1
      FROM profiles
      WHERE ((profiles.id = (select auth.uid())) AND (profiles.role = 'admin'::text))
    )
  );

-- Pre-registered users table
DROP POLICY IF EXISTS "Facility admins can view their pre-registered users" ON pre_registered_users;
CREATE POLICY "Facility admins can view their pre-registered users" 
  ON pre_registered_users FOR SELECT 
  TO authenticated 
  USING (
    facility_id IN ( 
      SELECT facility_users.facility_id
      FROM facility_users
      WHERE ((facility_users.user_id = (select auth.uid())) 
        AND (facility_users.role = ANY (ARRAY['owner'::text, 'admin'::text])))
    )
  );

DROP POLICY IF EXISTS "Facility admins can insert pre-registered users" ON pre_registered_users;
CREATE POLICY "Facility admins can insert pre-registered users" 
  ON pre_registered_users FOR INSERT 
  TO authenticated 
  WITH CHECK (
    facility_id IN ( 
      SELECT facility_users.facility_id
      FROM facility_users
      WHERE ((facility_users.user_id = (select auth.uid())) 
        AND (facility_users.role = ANY (ARRAY['owner'::text, 'admin'::text])))
    )
  );

DROP POLICY IF EXISTS "Facility admins can update their pre-registered users" ON pre_registered_users;
CREATE POLICY "Facility admins can update their pre-registered users" 
  ON pre_registered_users FOR UPDATE 
  TO authenticated 
  USING (
    facility_id IN ( 
      SELECT facility_users.facility_id
      FROM facility_users
      WHERE ((facility_users.user_id = (select auth.uid())) 
        AND (facility_users.role = ANY (ARRAY['owner'::text, 'admin'::text])))
    )
  )
  WITH CHECK (
    facility_id IN ( 
      SELECT facility_users.facility_id
      FROM facility_users
      WHERE ((facility_users.user_id = (select auth.uid())) 
        AND (facility_users.role = ANY (ARRAY['owner'::text, 'admin'::text])))
    )
  );

DROP POLICY IF EXISTS "Facility admins can delete their pre-registered users" ON pre_registered_users;
CREATE POLICY "Facility admins can delete their pre-registered users" 
  ON pre_registered_users FOR DELETE 
  TO authenticated 
  USING (
    facility_id IN ( 
      SELECT facility_users.facility_id
      FROM facility_users
      WHERE ((facility_users.user_id = (select auth.uid())) 
        AND (facility_users.role = ANY (ARRAY['owner'::text, 'admin'::text])))
    )
  );

-- Pre-memberships table
DROP POLICY IF EXISTS "Facility admins can view pre_memberships" ON pre_memberships;
CREATE POLICY "Facility admins can view pre_memberships" 
  ON pre_memberships FOR SELECT 
  TO authenticated 
  USING (
    facility_id IN ( 
      SELECT facility_users.facility_id
      FROM facility_users
      WHERE (facility_users.user_id = (select auth.uid()))
    )
  );

DROP POLICY IF EXISTS "Facility admins can insert pre_memberships" ON pre_memberships;
CREATE POLICY "Facility admins can insert pre_memberships" 
  ON pre_memberships FOR INSERT 
  TO authenticated 
  WITH CHECK (
    facility_id IN ( 
      SELECT facility_users.facility_id
      FROM facility_users
      WHERE (facility_users.user_id = (select auth.uid()))
    )
  );

DROP POLICY IF EXISTS "Facility admins can update pre_memberships" ON pre_memberships;
CREATE POLICY "Facility admins can update pre_memberships" 
  ON pre_memberships FOR UPDATE 
  TO authenticated 
  USING (
    facility_id IN ( 
      SELECT facility_users.facility_id
      FROM facility_users
      WHERE (facility_users.user_id = (select auth.uid()))
    )
  );

DROP POLICY IF EXISTS "Facility admins can delete pre_memberships" ON pre_memberships;
CREATE POLICY "Facility admins can delete pre_memberships" 
  ON pre_memberships FOR DELETE 
  TO authenticated 
  USING (
    facility_id IN ( 
      SELECT facility_users.facility_id
      FROM facility_users
      WHERE (facility_users.user_id = (select auth.uid()))
    )
  );

-- Court availability blocks table
DROP POLICY IF EXISTS "Facility admins can create any blocks" ON court_availability_blocks;
CREATE POLICY "Facility admins can create any blocks" 
  ON court_availability_blocks FOR INSERT 
  TO authenticated 
  WITH CHECK (
    (block_type <> 'reservation'::text) 
    AND (EXISTS ( 
      SELECT 1
      FROM facility_users
      WHERE ((facility_users.facility_id = court_availability_blocks.facility_id) 
        AND (facility_users.user_id = (select auth.uid())) 
        AND (facility_users.role = ANY (ARRAY['owner'::text, 'admin'::text, 'staff'::text])))
    ))
  );

DROP POLICY IF EXISTS "Facility admins can update availability blocks" ON court_availability_blocks;
CREATE POLICY "Facility admins can update availability blocks" 
  ON court_availability_blocks FOR UPDATE 
  TO authenticated 
  USING (
    EXISTS ( 
      SELECT 1
      FROM facility_users
      WHERE ((facility_users.facility_id = court_availability_blocks.facility_id) 
        AND (facility_users.user_id = (select auth.uid())) 
        AND (facility_users.role = ANY (ARRAY['owner'::text, 'admin'::text, 'staff'::text])))
    )
  )
  WITH CHECK (
    EXISTS ( 
      SELECT 1
      FROM facility_users
      WHERE ((facility_users.facility_id = court_availability_blocks.facility_id) 
        AND (facility_users.user_id = (select auth.uid())) 
        AND (facility_users.role = ANY (ARRAY['owner'::text, 'admin'::text, 'staff'::text])))
    )
  );

DROP POLICY IF EXISTS "Facility admins can delete availability blocks" ON court_availability_blocks;
CREATE POLICY "Facility admins can delete availability blocks" 
  ON court_availability_blocks FOR DELETE 
  TO authenticated 
  USING (
    EXISTS ( 
      SELECT 1
      FROM facility_users
      WHERE ((facility_users.facility_id = court_availability_blocks.facility_id) 
        AND (facility_users.user_id = (select auth.uid())) 
        AND (facility_users.role = ANY (ARRAY['owner'::text, 'admin'::text, 'staff'::text])))
    )
  );

-- Tournament participants table
DROP POLICY IF EXISTS "Users can register for tournaments" ON tournament_participants;
CREATE POLICY "Users can register for tournaments" 
  ON tournament_participants FOR INSERT 
  TO authenticated 
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update their registration" ON tournament_participants;
CREATE POLICY "Users can update their registration" 
  ON tournament_participants FOR UPDATE 
  TO authenticated 
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can withdraw from tournaments" ON tournament_participants;
CREATE POLICY "Users can withdraw from tournaments" 
  ON tournament_participants FOR DELETE 
  TO authenticated 
  USING ((select auth.uid()) = user_id);

-- Tournaments table
DROP POLICY IF EXISTS "Facility admins can create tournaments" ON tournaments;
CREATE POLICY "Facility admins can create tournaments" 
  ON tournaments FOR INSERT 
  TO authenticated 
  WITH CHECK (
    EXISTS ( 
      SELECT 1
      FROM facility_users
      WHERE ((facility_users.facility_id = tournaments.facility_id) 
        AND (facility_users.user_id = (select auth.uid())) 
        AND (facility_users.role = ANY (ARRAY['admin'::text, 'owner'::text])))
    )
  );

DROP POLICY IF EXISTS "Facility admins can update their tournaments" ON tournaments;
CREATE POLICY "Facility admins can update their tournaments" 
  ON tournaments FOR UPDATE 
  TO authenticated 
  USING (
    EXISTS ( 
      SELECT 1
      FROM facility_users
      WHERE ((facility_users.facility_id = tournaments.facility_id) 
        AND (facility_users.user_id = (select auth.uid())) 
        AND (facility_users.role = ANY (ARRAY['admin'::text, 'owner'::text])))
    )
  )
  WITH CHECK (
    EXISTS ( 
      SELECT 1
      FROM facility_users
      WHERE ((facility_users.facility_id = tournaments.facility_id) 
        AND (facility_users.user_id = (select auth.uid())) 
        AND (facility_users.role = ANY (ARRAY['admin'::text, 'owner'::text])))
    )
  );

DROP POLICY IF EXISTS "Facility admins can delete their tournaments" ON tournaments;
CREATE POLICY "Facility admins can delete their tournaments" 
  ON tournaments FOR DELETE 
  TO authenticated 
  USING (
    EXISTS ( 
      SELECT 1
      FROM facility_users
      WHERE ((facility_users.facility_id = tournaments.facility_id) 
        AND (facility_users.user_id = (select auth.uid())) 
        AND (facility_users.role = ANY (ARRAY['admin'::text, 'owner'::text])))
    )
  );
