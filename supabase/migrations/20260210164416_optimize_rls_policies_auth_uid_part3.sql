/*
  # Optimize RLS Policies with auth.uid() - Part 3
  
  1. Changes
    - Optimizes RLS policies for critical high-traffic tables
    - Wraps auth.uid() with (select auth.uid()) to prevent per-row re-evaluation
    - Covers: bookings, social_posts, social_post_likes, social_comments, 
      event_series, event_series_registrations
  
  2. Security
    - Maintains identical security logic
    - Only optimization change, no functional changes
*/

-- Bookings table (very high traffic)
DROP POLICY IF EXISTS "Users can view own bookings in their facilities" ON bookings;
CREATE POLICY "Users can view own bookings in their facilities" 
  ON bookings FOR SELECT 
  TO authenticated 
  USING (
    ((select auth.uid()) = user_id) 
    OR 
    (EXISTS ( 
      SELECT 1
      FROM facility_users
      WHERE ((facility_users.facility_id = bookings.facility_id) 
        AND (facility_users.user_id = (select auth.uid())) 
        AND (facility_users.role = ANY (ARRAY['admin'::text, 'owner'::text])))
    ))
  );

DROP POLICY IF EXISTS "Users can view bookings in their facilities" ON bookings;
CREATE POLICY "Users can view bookings in their facilities" 
  ON bookings FOR SELECT 
  TO authenticated 
  USING (
    EXISTS ( 
      SELECT 1
      FROM facility_users
      WHERE ((facility_users.user_id = (select auth.uid())) 
        AND (facility_users.facility_id = ( 
          SELECT courts.facility_id
          FROM courts
          WHERE (courts.id = bookings.court_id)
        )))
    )
  );

DROP POLICY IF EXISTS "Users can create own bookings" ON bookings;
CREATE POLICY "Users can create own bookings" 
  ON bookings FOR INSERT 
  TO authenticated 
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can create bookings in their facilities" ON bookings;
CREATE POLICY "Users can create bookings in their facilities" 
  ON bookings FOR INSERT 
  TO authenticated 
  WITH CHECK (
    EXISTS ( 
      SELECT 1
      FROM facility_users
      WHERE ((facility_users.facility_id = bookings.facility_id) 
        AND (facility_users.user_id = (select auth.uid())))
    )
  );

DROP POLICY IF EXISTS "Users can update own pending bookings" ON bookings;
CREATE POLICY "Users can update own pending bookings" 
  ON bookings FOR UPDATE 
  TO authenticated 
  USING (((select auth.uid()) = user_id) AND (status = 'pending'::text));

-- Social posts table (very high traffic)
DROP POLICY IF EXISTS "Users can view posts based on visibility" ON social_posts;
CREATE POLICY "Users can view posts based on visibility" 
  ON social_posts FOR SELECT 
  TO authenticated 
  USING (
    (is_archived = false) 
    AND (
      (visibility = 'public'::post_visibility) 
      OR (
        (visibility = 'facility'::post_visibility) 
        AND (
          (facility_id IS NULL) 
          OR ((select auth.uid()) = author_id) 
          OR (EXISTS ( 
            SELECT 1
            FROM facility_users
            WHERE ((facility_users.facility_id = social_posts.facility_id) 
              AND (facility_users.user_id = (select auth.uid())))
          ))
        )
      ) 
      OR (
        (visibility = 'friends'::post_visibility) 
        AND (
          ((select auth.uid()) = author_id) 
          OR (EXISTS ( 
            SELECT 1
            FROM social_follows
            WHERE (
              ((social_follows.follower_id = (select auth.uid())) 
                AND (social_follows.following_id = social_posts.author_id)) 
              OR ((social_follows.following_id = (select auth.uid())) 
                AND (social_follows.follower_id = social_posts.author_id))
            )
          ))
        )
      )
    )
  );

DROP POLICY IF EXISTS "Users can create own posts" ON social_posts;
CREATE POLICY "Users can create own posts" 
  ON social_posts FOR INSERT 
  TO authenticated 
  WITH CHECK ((select auth.uid()) = author_id);

DROP POLICY IF EXISTS "Facility owners can post as facility" ON social_posts;
CREATE POLICY "Facility owners can post as facility" 
  ON social_posts FOR INSERT 
  TO authenticated 
  WITH CHECK (
    (author_id = (select auth.uid())) 
    AND (
      (posted_as_facility = false) 
      OR (EXISTS ( 
        SELECT 1
        FROM facility_users
        WHERE ((facility_users.user_id = (select auth.uid())) 
          AND (facility_users.facility_id = social_posts.facility_id) 
          AND (facility_users.role = ANY (ARRAY['owner'::text, 'admin'::text])))
      ))
    )
  );

DROP POLICY IF EXISTS "Users can update own posts" ON social_posts;
CREATE POLICY "Users can update own posts" 
  ON social_posts FOR UPDATE 
  TO authenticated 
  USING (
    (author_id = (select auth.uid())) 
    OR (
      (posted_as_facility = true) 
      AND (EXISTS ( 
        SELECT 1
        FROM facility_users
        WHERE ((facility_users.user_id = (select auth.uid())) 
          AND (facility_users.facility_id = social_posts.facility_id) 
          AND (facility_users.role = ANY (ARRAY['owner'::text, 'admin'::text])))
      ))
    )
  )
  WITH CHECK (
    (author_id = (select auth.uid())) 
    OR (
      (posted_as_facility = true) 
      AND (EXISTS ( 
        SELECT 1
        FROM facility_users
        WHERE ((facility_users.user_id = (select auth.uid())) 
          AND (facility_users.facility_id = social_posts.facility_id) 
          AND (facility_users.role = ANY (ARRAY['owner'::text, 'admin'::text])))
      ))
    )
  );

DROP POLICY IF EXISTS "Users can delete own posts" ON social_posts;
CREATE POLICY "Users can delete own posts" 
  ON social_posts FOR DELETE 
  TO authenticated 
  USING (
    (author_id = (select auth.uid())) 
    OR (
      (posted_as_facility = true) 
      AND (EXISTS ( 
        SELECT 1
        FROM facility_users
        WHERE ((facility_users.user_id = (select auth.uid())) 
          AND (facility_users.facility_id = social_posts.facility_id) 
          AND (facility_users.role = ANY (ARRAY['owner'::text, 'admin'::text])))
      ))
    )
  );

DROP POLICY IF EXISTS "Facility admins can moderate posts" ON social_posts;
CREATE POLICY "Facility admins can moderate posts" 
  ON social_posts FOR DELETE 
  TO authenticated 
  USING (
    EXISTS ( 
      SELECT 1
      FROM facility_users
      WHERE ((facility_users.facility_id = social_posts.facility_id) 
        AND (facility_users.user_id = (select auth.uid())) 
        AND (facility_users.role = ANY (ARRAY['admin'::text, 'owner'::text])))
    )
  );

-- Social post likes table
DROP POLICY IF EXISTS "Users can like posts" ON social_post_likes;
CREATE POLICY "Users can like posts" 
  ON social_post_likes FOR INSERT 
  TO authenticated 
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can unlike posts" ON social_post_likes;
CREATE POLICY "Users can unlike posts" 
  ON social_post_likes FOR DELETE 
  TO authenticated 
  USING ((select auth.uid()) = user_id);

-- Social comments table
DROP POLICY IF EXISTS "Authenticated users can create comments" ON social_comments;
CREATE POLICY "Authenticated users can create comments" 
  ON social_comments FOR INSERT 
  TO authenticated 
  WITH CHECK ((select auth.uid()) = author_id);

DROP POLICY IF EXISTS "Users can update own comments" ON social_comments;
CREATE POLICY "Users can update own comments" 
  ON social_comments FOR UPDATE 
  TO authenticated 
  USING ((select auth.uid()) = author_id)
  WITH CHECK ((select auth.uid()) = author_id);

-- Event series table
DROP POLICY IF EXISTS "Admins can create series" ON event_series;
CREATE POLICY "Admins can create series" 
  ON event_series FOR INSERT 
  TO authenticated 
  WITH CHECK (
    EXISTS ( 
      SELECT 1
      FROM profiles
      WHERE ((profiles.id = (select auth.uid())) 
        AND (profiles.role = ANY (ARRAY['admin'::text, 'facility_manager'::text])))
    )
  );

DROP POLICY IF EXISTS "Admins can update series" ON event_series;
CREATE POLICY "Admins can update series" 
  ON event_series FOR UPDATE 
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

DROP POLICY IF EXISTS "Admins can delete series" ON event_series;
CREATE POLICY "Admins can delete series" 
  ON event_series FOR DELETE 
  TO authenticated 
  USING (
    EXISTS ( 
      SELECT 1
      FROM profiles
      WHERE ((profiles.id = (select auth.uid())) 
        AND (profiles.role = ANY (ARRAY['admin'::text, 'facility_manager'::text])))
    )
  );

-- Event series registrations table
DROP POLICY IF EXISTS "Users can view own registrations" ON event_series_registrations;
CREATE POLICY "Users can view own registrations" 
  ON event_series_registrations FOR SELECT 
  TO authenticated 
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Admins can view all registrations" ON event_series_registrations;
CREATE POLICY "Admins can view all registrations" 
  ON event_series_registrations FOR SELECT 
  TO authenticated 
  USING (
    EXISTS ( 
      SELECT 1
      FROM profiles
      WHERE ((profiles.id = (select auth.uid())) 
        AND (profiles.role = ANY (ARRAY['admin'::text, 'facility_manager'::text])))
    )
  );

DROP POLICY IF EXISTS "Users can create own registrations" ON event_series_registrations;
CREATE POLICY "Users can create own registrations" 
  ON event_series_registrations FOR INSERT 
  TO authenticated 
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update own registrations" ON event_series_registrations;
CREATE POLICY "Users can update own registrations" 
  ON event_series_registrations FOR UPDATE 
  TO authenticated 
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Admins can update all registrations" ON event_series_registrations;
CREATE POLICY "Admins can update all registrations" 
  ON event_series_registrations FOR UPDATE 
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

DROP POLICY IF EXISTS "Users can delete own registrations" ON event_series_registrations;
CREATE POLICY "Users can delete own registrations" 
  ON event_series_registrations FOR DELETE 
  TO authenticated 
  USING (user_id = (select auth.uid()));
