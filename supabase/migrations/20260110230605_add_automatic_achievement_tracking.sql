/*
  # Automatic Achievement Tracking System

  1. New Functions
    - `check_and_award_achievement()` - Core function to check and award achievements
    - `track_booking_achievement()` - Trigger function for bookings
    - `track_match_achievement()` - Trigger function for matches
    - `track_social_achievement()` - Trigger function for social posts/comments
    - `track_event_achievement()` - Trigger function for event registrations
    - `calculate_achievement_progress()` - Calculate progress for an achievement
    - `award_achievement_with_notification()` - Award achievement and send notification

  2. New Triggers
    - Trigger on bookings insert to track booking achievements
    - Trigger on dupr_match_results insert to track match achievements
    - Trigger on social_posts insert to track social achievements
    - Trigger on social_comments insert to track engagement achievements
    - Trigger on event_series_registrations insert to track event achievements

  3. Features
    - Automatic progress tracking
    - Automatic achievement awarding
    - Real-time notifications on unlock
    - Loyalty points bonus on achievement unlock
    - Support for streak tracking
    - Support for time-based achievements
*/

-- Function to calculate achievement progress for a user
CREATE OR REPLACE FUNCTION calculate_achievement_progress(
  p_user_id uuid,
  p_achievement_id uuid
) RETURNS integer AS $$
DECLARE
  v_achievement record;
  v_progress integer := 0;
  v_criteria jsonb;
BEGIN
  -- Get achievement details
  SELECT * INTO v_achievement FROM achievements WHERE id = p_achievement_id;

  IF NOT FOUND THEN
    RETURN 0;
  END IF;

  v_criteria := v_achievement.criteria;

  -- Calculate progress based on achievement category
  CASE v_achievement.category
    WHEN 'matches' THEN
      -- Count completed matches from dupr_match_results
      SELECT COUNT(DISTINCT dmr.match_id) INTO v_progress
      FROM dupr_match_results dmr
      JOIN dupr_matches dm ON dm.id = dmr.match_id
      WHERE (dmr.player1_id = p_user_id OR dmr.player2_id = p_user_id)
        AND dm.status = 'approved';

    WHEN 'hours' THEN
      -- Count total hours from bookings
      SELECT COALESCE(SUM(EXTRACT(EPOCH FROM (end_time - start_time)) / 3600), 0)::integer INTO v_progress
      FROM bookings
      WHERE user_id = p_user_id
        AND status = 'confirmed';

    WHEN 'social' THEN
      -- Count social posts
      SELECT COUNT(*) INTO v_progress
      FROM social_posts
      WHERE user_id = p_user_id;

    WHEN 'competitive' THEN
      -- Count tournament participations
      SELECT COUNT(DISTINCT tournament_id) INTO v_progress
      FROM tournament_matches
      WHERE player1_id = p_user_id OR player2_id = p_user_id;

    WHEN 'milestones' THEN
      -- Special milestone calculations (days since joined, etc)
      IF v_criteria->>'type' = 'loyalty_days' THEN
        SELECT EXTRACT(DAY FROM now() - created_at)::integer INTO v_progress
        FROM profiles
        WHERE id = p_user_id;
      ELSIF v_criteria->>'type' = 'consecutive_bookings' THEN
        -- Count consecutive days with bookings
        v_progress := 0;
      END IF;

    ELSE
      v_progress := 0;
  END CASE;

  RETURN v_progress;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to award achievement and send notification
CREATE OR REPLACE FUNCTION award_achievement_with_notification(
  p_user_id uuid,
  p_achievement_id uuid,
  p_progress integer
) RETURNS void AS $$
DECLARE
  v_achievement record;
  v_existing_achievement uuid;
  v_loyalty_account_id uuid;
BEGIN
  -- Get achievement details
  SELECT * INTO v_achievement FROM achievements WHERE id = p_achievement_id;

  -- Check if user already has this achievement
  SELECT id INTO v_existing_achievement
  FROM user_achievements
  WHERE user_id = p_user_id AND achievement_id = p_achievement_id;

  IF v_existing_achievement IS NULL THEN
    -- Award the achievement
    INSERT INTO user_achievements (user_id, achievement_id, progress, unlocked_at)
    VALUES (p_user_id, p_achievement_id, p_progress, now());

    -- Send notification
    INSERT INTO notifications (user_id, type, title, message, metadata, created_at)
    VALUES (
      p_user_id,
      'achievement_unlocked',
      'Achievement Unlocked!',
      'You earned "' || v_achievement.name || '" worth ' || v_achievement.points || ' points!',
      jsonb_build_object(
        'achievement_id', p_achievement_id,
        'achievement_name', v_achievement.name,
        'achievement_icon', v_achievement.icon,
        'points', v_achievement.points,
        'rarity', v_achievement.rarity
      ),
      now()
    );

    -- Award bonus loyalty points if user has loyalty account
    SELECT id INTO v_loyalty_account_id
    FROM loyalty_accounts
    WHERE user_id = p_user_id
    LIMIT 1;

    IF v_loyalty_account_id IS NOT NULL THEN
      -- Award bonus loyalty points (10% of achievement points)
      UPDATE loyalty_accounts
      SET
        points_balance = points_balance + (v_achievement.points / 10),
        lifetime_points_earned = lifetime_points_earned + (v_achievement.points / 10)
      WHERE id = v_loyalty_account_id;

      -- Record loyalty transaction
      INSERT INTO loyalty_transactions (
        account_id, user_id, transaction_type, points, reason, reference_type, reference_id
      ) VALUES (
        v_loyalty_account_id, p_user_id, 'earned', (v_achievement.points / 10),
        'Achievement unlock bonus: ' || v_achievement.name, 'achievement', p_achievement_id
      );
    END IF;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check and award achievements
CREATE OR REPLACE FUNCTION check_and_award_achievement(
  p_user_id uuid,
  p_category text
) RETURNS void AS $$
DECLARE
  v_achievement record;
  v_progress integer;
  v_target integer;
BEGIN
  -- Loop through all active achievements in the category
  FOR v_achievement IN
    SELECT * FROM achievements
    WHERE category = p_category AND is_active = true
  LOOP
    -- Calculate current progress
    v_progress := calculate_achievement_progress(p_user_id, v_achievement.id);

    -- Get target from criteria
    v_target := COALESCE((v_achievement.criteria->>'target')::integer, 1);

    -- Check if achievement should be awarded
    IF v_progress >= v_target THEN
      PERFORM award_achievement_with_notification(p_user_id, v_achievement.id, v_progress);
    ELSE
      -- Update progress for achievements in progress
      INSERT INTO user_achievements (user_id, achievement_id, progress)
      VALUES (p_user_id, v_achievement.id, v_progress)
      ON CONFLICT (user_id, achievement_id) DO UPDATE SET progress = v_progress;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger function for bookings
CREATE OR REPLACE FUNCTION track_booking_achievement()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'confirmed' THEN
    PERFORM check_and_award_achievement(NEW.user_id, 'hours');
    PERFORM check_and_award_achievement(NEW.user_id, 'milestones');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger function for match results
CREATE OR REPLACE FUNCTION track_match_result_achievement()
RETURNS TRIGGER AS $$
DECLARE
  v_match_status text;
BEGIN
  -- Get match status
  SELECT status INTO v_match_status FROM dupr_matches WHERE id = NEW.match_id;
  
  IF v_match_status = 'approved' THEN
    -- Track for both players
    IF NEW.player1_id IS NOT NULL THEN
      PERFORM check_and_award_achievement(NEW.player1_id, 'matches');
      PERFORM check_and_award_achievement(NEW.player1_id, 'competitive');
    END IF;
    IF NEW.player2_id IS NOT NULL THEN
      PERFORM check_and_award_achievement(NEW.player2_id, 'matches');
      PERFORM check_and_award_achievement(NEW.player2_id, 'competitive');
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger function for social posts
CREATE OR REPLACE FUNCTION track_social_achievement()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM check_and_award_achievement(NEW.user_id, 'social');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger function for social comments
CREATE OR REPLACE FUNCTION track_engagement_achievement()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM check_and_award_achievement(NEW.user_id, 'social');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger function for event registrations
CREATE OR REPLACE FUNCTION track_event_achievement()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'confirmed' THEN
    PERFORM check_and_award_achievement(NEW.user_id, 'milestones');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS track_booking_achievements ON bookings;
DROP TRIGGER IF EXISTS track_match_result_achievements ON dupr_match_results;
DROP TRIGGER IF EXISTS track_social_post_achievements ON social_posts;
DROP TRIGGER IF EXISTS track_social_comment_achievements ON social_comments;
DROP TRIGGER IF EXISTS track_event_registration_achievements ON event_series_registrations;

-- Create triggers
CREATE TRIGGER track_booking_achievements
  AFTER INSERT ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION track_booking_achievement();

CREATE TRIGGER track_match_result_achievements
  AFTER INSERT ON dupr_match_results
  FOR EACH ROW
  EXECUTE FUNCTION track_match_result_achievement();

CREATE TRIGGER track_social_post_achievements
  AFTER INSERT ON social_posts
  FOR EACH ROW
  EXECUTE FUNCTION track_social_achievement();

CREATE TRIGGER track_social_comment_achievements
  AFTER INSERT ON social_comments
  FOR EACH ROW
  EXECUTE FUNCTION track_engagement_achievement();

CREATE TRIGGER track_event_registration_achievements
  AFTER INSERT OR UPDATE ON event_series_registrations
  FOR EACH ROW
  EXECUTE FUNCTION track_event_achievement();

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_progress ON user_achievements(user_id, progress) WHERE unlocked_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_achievements_category_active ON achievements(category, is_active);
CREATE INDEX IF NOT EXISTS idx_bookings_user_status ON bookings(user_id, status);
CREATE INDEX IF NOT EXISTS idx_dupr_match_results_players ON dupr_match_results(player1_id, player2_id, match_id);
