/*
  # Optimize RLS Policies with auth.uid() - Part 9 (Remaining Tables)
  
  1. Changes
    - Optimizes remaining RLS policies that still have bare auth.uid() calls
    - Wraps auth.uid() with (select auth.uid()) to prevent per-row re-evaluation
    - Covers: booking_notifications, match_participant_payments, booking_analytics,
      booking_packages, user_packages, weather_data, fraud_detection_logs,
      ladder_participants, match_spectators, and additional utility tables
  
  2. Security
    - Maintains identical security logic
    - Only optimization change, no functional changes
*/

-- Booking notifications table
DROP POLICY IF EXISTS "Users can view their own notifications" ON booking_notifications;
CREATE POLICY "Users can view their own notifications" 
  ON booking_notifications FOR SELECT 
  TO authenticated 
  USING ((select auth.uid()) = user_id);

-- Match participant payments table
DROP POLICY IF EXISTS "Users can view their own payments" ON match_participant_payments;
CREATE POLICY "Users can view their own payments" 
  ON match_participant_payments FOR SELECT 
  TO authenticated 
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Post authors can view all payments for their posts" ON match_participant_payments;
CREATE POLICY "Post authors can view all payments for their posts" 
  ON match_participant_payments FOR SELECT 
  TO authenticated 
  USING (
    EXISTS ( 
      SELECT 1
      FROM social_posts
      WHERE ((social_posts.id = match_participant_payments.post_id) 
        AND (social_posts.author_id = (select auth.uid())))
    )
  );

DROP POLICY IF EXISTS "Users can insert their own payments" ON match_participant_payments;
CREATE POLICY "Users can insert their own payments" 
  ON match_participant_payments FOR INSERT 
  TO authenticated 
  WITH CHECK ((select auth.uid()) = user_id);

-- Booking analytics table
DROP POLICY IF EXISTS "Admins can view booking analytics" ON booking_analytics;
CREATE POLICY "Admins can view booking analytics" 
  ON booking_analytics FOR SELECT 
  TO authenticated 
  USING (
    EXISTS ( 
      SELECT 1
      FROM profiles
      WHERE ((profiles.id = (select auth.uid())) AND (profiles.role = 'admin'::text))
    )
  );

DROP POLICY IF EXISTS "Admins can manage booking analytics" ON booking_analytics;
CREATE POLICY "Admins can manage booking analytics" 
  ON booking_analytics FOR ALL 
  TO authenticated 
  USING (
    EXISTS ( 
      SELECT 1
      FROM profiles
      WHERE ((profiles.id = (select auth.uid())) AND (profiles.role = 'admin'::text))
    )
  );

-- Booking packages table
DROP POLICY IF EXISTS "Admins can manage packages" ON booking_packages;
CREATE POLICY "Admins can manage packages" 
  ON booking_packages FOR ALL 
  TO authenticated 
  USING (
    EXISTS ( 
      SELECT 1
      FROM profiles
      WHERE ((profiles.id = (select auth.uid())) AND (profiles.role = 'admin'::text))
    )
  );

-- User packages table
DROP POLICY IF EXISTS "Users can view own packages" ON user_packages;
CREATE POLICY "Users can view own packages" 
  ON user_packages FOR SELECT 
  TO authenticated 
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can purchase packages" ON user_packages;
CREATE POLICY "Users can purchase packages" 
  ON user_packages FOR INSERT 
  TO authenticated 
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Admins can manage all packages" ON user_packages;
CREATE POLICY "Admins can manage all packages" 
  ON user_packages FOR ALL 
  TO authenticated 
  USING (
    EXISTS ( 
      SELECT 1
      FROM profiles
      WHERE ((profiles.id = (select auth.uid())) AND (profiles.role = 'admin'::text))
    )
  );

-- Weather data table
DROP POLICY IF EXISTS "Admins can manage weather data" ON weather_data;
CREATE POLICY "Admins can manage weather data" 
  ON weather_data FOR ALL 
  TO authenticated 
  USING (
    EXISTS ( 
      SELECT 1
      FROM profiles
      WHERE ((profiles.id = (select auth.uid())) AND (profiles.role = 'admin'::text))
    )
  );

-- Fraud detection logs table
DROP POLICY IF EXISTS "Facility admins can view fraud logs" ON fraud_detection_logs;
CREATE POLICY "Facility admins can view fraud logs" 
  ON fraud_detection_logs FOR SELECT 
  TO authenticated 
  USING (
    EXISTS ( 
      SELECT 1
      FROM facility_users
      WHERE ((facility_users.user_id = (select auth.uid())) 
        AND (facility_users.role = ANY (ARRAY['owner'::text, 'admin'::text])))
    )
  );

-- Ladder participants table
DROP POLICY IF EXISTS "Users can join ladders" ON ladder_participants;
CREATE POLICY "Users can join ladders" 
  ON ladder_participants FOR INSERT 
  TO authenticated 
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Admins can manage ladder participants" ON ladder_participants;
CREATE POLICY "Admins can manage ladder participants" 
  ON ladder_participants FOR ALL 
  TO authenticated 
  USING (
    EXISTS ( 
      SELECT 1
      FROM profiles
      WHERE ((profiles.id = (select auth.uid())) AND (profiles.role = 'admin'::text))
    )
  );

-- Match spectators table
DROP POLICY IF EXISTS "Users can join as spectators" ON match_spectators;
CREATE POLICY "Users can join as spectators" 
  ON match_spectators FOR INSERT 
  TO authenticated 
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can remove themselves as spectators" ON match_spectators;
CREATE POLICY "Users can remove themselves as spectators" 
  ON match_spectators FOR DELETE 
  TO authenticated 
  USING ((select auth.uid()) = user_id);
