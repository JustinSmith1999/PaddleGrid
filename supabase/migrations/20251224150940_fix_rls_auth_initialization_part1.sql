/*
  # Fix RLS Auth Initialization - Part 1

  1. Performance Improvements
    - Replace `auth.uid()` with `(select auth.uid())` in RLS policies
    - This prevents re-evaluation of auth functions for each row
    - Significantly improves query performance at scale

  2. Tables Fixed (Part 1)
    - facility_reviews
    - court_reviews
    - event_reviews
    - review_helpfulness
    - courtreserve_sync_logs
    - booking_extensions
    - bookings
    - content_reports
    - user_levels
*/

-- facility_reviews policies
DROP POLICY IF EXISTS "Authenticated users can create facility reviews" ON facility_reviews;
CREATE POLICY "Authenticated users can create facility reviews"
  ON facility_reviews FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) IS NOT NULL);

DROP POLICY IF EXISTS "Users can update their own facility reviews" ON facility_reviews;
CREATE POLICY "Users can update their own facility reviews"
  ON facility_reviews FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can delete their own facility reviews" ON facility_reviews;
CREATE POLICY "Users can delete their own facility reviews"
  ON facility_reviews FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- court_reviews policies
DROP POLICY IF EXISTS "Authenticated users can create court reviews" ON court_reviews;
CREATE POLICY "Authenticated users can create court reviews"
  ON court_reviews FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) IS NOT NULL);

DROP POLICY IF EXISTS "Users can update their own court reviews" ON court_reviews;
CREATE POLICY "Users can update their own court reviews"
  ON court_reviews FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can delete their own court reviews" ON court_reviews;
CREATE POLICY "Users can delete their own court reviews"
  ON court_reviews FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- event_reviews policies
DROP POLICY IF EXISTS "Authenticated users can create event reviews" ON event_reviews;
CREATE POLICY "Authenticated users can create event reviews"
  ON event_reviews FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) IS NOT NULL);

DROP POLICY IF EXISTS "Users can update their own event reviews" ON event_reviews;
CREATE POLICY "Users can update their own event reviews"
  ON event_reviews FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can delete their own event reviews" ON event_reviews;
CREATE POLICY "Users can delete their own event reviews"
  ON event_reviews FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- review_helpfulness policies
DROP POLICY IF EXISTS "Authenticated users can mark reviews helpful" ON review_helpfulness;
CREATE POLICY "Authenticated users can mark reviews helpful"
  ON review_helpfulness FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update their helpfulness votes" ON review_helpfulness;
CREATE POLICY "Users can update their helpfulness votes"
  ON review_helpfulness FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can delete their helpfulness votes" ON review_helpfulness;
CREATE POLICY "Users can delete their helpfulness votes"
  ON review_helpfulness FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- courtreserve_sync_logs policies
DROP POLICY IF EXISTS "Facility admins can view sync logs" ON courtreserve_sync_logs;
CREATE POLICY "Facility admins can view sync logs"
  ON courtreserve_sync_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM facility_users
      WHERE facility_users.user_id = (select auth.uid())
      AND facility_users.facility_id = courtreserve_sync_logs.facility_id
      AND facility_users.role IN ('owner', 'admin')
    )
  );

-- booking_extensions policies
DROP POLICY IF EXISTS "Users can view their own extension requests" ON booking_extensions;
CREATE POLICY "Users can view their own extension requests"
  ON booking_extensions FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can create extension requests" ON booking_extensions;
CREATE POLICY "Users can create extension requests"
  ON booking_extensions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update their own pending extensions" ON booking_extensions;
CREATE POLICY "Users can update their own pending extensions"
  ON booking_extensions FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()) AND status = 'pending');

-- bookings policies
DROP POLICY IF EXISTS "Users can view bookings in their facilities" ON bookings;
CREATE POLICY "Users can view bookings in their facilities"
  ON bookings FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM facility_users
      WHERE facility_users.user_id = (select auth.uid())
      AND facility_users.facility_id = (
        SELECT facility_id FROM courts WHERE courts.id = bookings.court_id
      )
    )
  );

-- content_reports policies
DROP POLICY IF EXISTS "Users can view their own reports" ON content_reports;
CREATE POLICY "Users can view their own reports"
  ON content_reports FOR SELECT
  TO authenticated
  USING (reporter_id = (select auth.uid()));

DROP POLICY IF EXISTS "Authenticated users can report content" ON content_reports;
CREATE POLICY "Authenticated users can report content"
  ON content_reports FOR INSERT
  TO authenticated
  WITH CHECK (reporter_id = (select auth.uid()));

-- user_levels policies
DROP POLICY IF EXISTS "Users can view own level" ON user_levels;
CREATE POLICY "Users can view own level"
  ON user_levels FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update own level" ON user_levels;
CREATE POLICY "Users can update own level"
  ON user_levels FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "System can create levels" ON user_levels;
CREATE POLICY "System can create levels"
  ON user_levels FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) IS NOT NULL);
