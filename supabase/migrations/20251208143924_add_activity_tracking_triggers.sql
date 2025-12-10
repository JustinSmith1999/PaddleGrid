/*
  # Activity Tracking Triggers

  ## Overview
  Adds trigger functions to automatically:
  1. Update kudos counts when kudos are added/removed
  2. Update comment counts when comments are added/removed
  3. Track and update user streaks when activities are logged
  4. Check and update personal records automatically
*/

-- Function to update kudos count
CREATE OR REPLACE FUNCTION update_activity_kudos_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE activities
    SET kudos_count = kudos_count + 1
    WHERE id = NEW.activity_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE activities
    SET kudos_count = GREATEST(0, kudos_count - 1)
    WHERE id = OLD.activity_id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_activity_kudos_count ON activity_kudos;
CREATE TRIGGER trigger_update_activity_kudos_count
  AFTER INSERT OR DELETE ON activity_kudos
  FOR EACH ROW
  EXECUTE FUNCTION update_activity_kudos_count();

-- Function to update comment count
CREATE OR REPLACE FUNCTION update_activity_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE activities
    SET comment_count = comment_count + 1
    WHERE id = NEW.activity_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE activities
    SET comment_count = GREATEST(0, comment_count - 1)
    WHERE id = OLD.activity_id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_activity_comment_count ON activity_comments;
CREATE TRIGGER trigger_update_activity_comment_count
  AFTER INSERT OR DELETE ON activity_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_activity_comment_count();

-- Function to update user streaks
CREATE OR REPLACE FUNCTION update_user_streaks()
RETURNS TRIGGER AS $$
DECLARE
  streak_rec record;
BEGIN
  -- Update daily streak
  SELECT * INTO streak_rec
  FROM streaks
  WHERE user_id = NEW.user_id AND streak_type = 'daily'
  FOR UPDATE;
  
  IF NOT FOUND THEN
    INSERT INTO streaks (user_id, streak_type, current_count, longest_count, last_activity_date, started_at)
    VALUES (NEW.user_id, 'daily', 1, 1, NEW.activity_date, NEW.activity_date);
  ELSE
    IF streak_rec.last_activity_date = NEW.activity_date - INTERVAL '1 day' THEN
      UPDATE streaks
      SET current_count = current_count + 1,
          longest_count = GREATEST(longest_count, current_count + 1),
          last_activity_date = NEW.activity_date,
          updated_at = now()
      WHERE id = streak_rec.id;
    ELSIF streak_rec.last_activity_date < NEW.activity_date - INTERVAL '1 day' THEN
      UPDATE streaks
      SET current_count = 1,
          last_activity_date = NEW.activity_date,
          started_at = NEW.activity_date,
          updated_at = now()
      WHERE id = streak_rec.id;
    END IF;
  END IF;
  
  -- Update win streak
  IF NEW.is_win = true THEN
    SELECT * INTO streak_rec
    FROM streaks
    WHERE user_id = NEW.user_id AND streak_type = 'win_streak'
    FOR UPDATE;
    
    IF NOT FOUND THEN
      INSERT INTO streaks (user_id, streak_type, current_count, longest_count, last_activity_date, started_at)
      VALUES (NEW.user_id, 'win_streak', 1, 1, NEW.activity_date, NEW.activity_date);
    ELSE
      UPDATE streaks
      SET current_count = current_count + 1,
          longest_count = GREATEST(longest_count, current_count + 1),
          last_activity_date = NEW.activity_date,
          updated_at = now()
      WHERE id = streak_rec.id;
    END IF;
  ELSE
    UPDATE streaks
    SET current_count = 0,
        updated_at = now()
    WHERE user_id = NEW.user_id AND streak_type = 'win_streak';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_user_streaks ON activities;
CREATE TRIGGER trigger_update_user_streaks
  AFTER INSERT ON activities
  FOR EACH ROW
  EXECUTE FUNCTION update_user_streaks();

-- Function to check personal records
CREATE OR REPLACE FUNCTION check_personal_records()
RETURNS TRIGGER AS $$
DECLARE
  current_win_streak integer;
  highest_rating numeric;
BEGIN
  -- Check highest rating
  IF NEW.rating_after IS NOT NULL THEN
    SELECT COALESCE(value, 0) INTO highest_rating
    FROM personal_records
    WHERE user_id = NEW.user_id AND record_type = 'highest_rating';
    
    IF highest_rating IS NULL OR NEW.rating_after > highest_rating THEN
      INSERT INTO personal_records (user_id, record_type, value, previous_value, activity_id)
      VALUES (NEW.user_id, 'highest_rating', NEW.rating_after, highest_rating, NEW.id)
      ON CONFLICT (user_id, record_type)
      DO UPDATE SET value = NEW.rating_after, previous_value = highest_rating, 
                    activity_id = NEW.id, achieved_at = now();
    END IF;
  END IF;
  
  -- Check rating gain
  IF NEW.rating_change IS NOT NULL AND NEW.rating_change > 0 THEN
    INSERT INTO personal_records (user_id, record_type, value, previous_value, activity_id)
    VALUES (NEW.user_id, 'rating_gain', NEW.rating_change, NULL, NEW.id)
    ON CONFLICT (user_id, record_type)
    DO UPDATE SET value = GREATEST(personal_records.value, NEW.rating_change),
                  activity_id = CASE WHEN NEW.rating_change > personal_records.value THEN NEW.id ELSE personal_records.activity_id END,
                  achieved_at = CASE WHEN NEW.rating_change > personal_records.value THEN now() ELSE personal_records.achieved_at END;
  END IF;
  
  -- Check win streak
  SELECT current_count INTO current_win_streak
  FROM streaks
  WHERE user_id = NEW.user_id AND streak_type = 'win_streak';
  
  IF current_win_streak IS NOT NULL AND current_win_streak > 0 THEN
    INSERT INTO personal_records (user_id, record_type, value, previous_value, activity_id)
    VALUES (NEW.user_id, 'win_streak', current_win_streak, NULL, NEW.id)
    ON CONFLICT (user_id, record_type)
    DO UPDATE SET value = GREATEST(personal_records.value, current_win_streak),
                  activity_id = CASE WHEN current_win_streak > personal_records.value THEN NEW.id ELSE personal_records.activity_id END,
                  achieved_at = CASE WHEN current_win_streak > personal_records.value THEN now() ELSE personal_records.achieved_at END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_check_personal_records ON activities;
CREATE TRIGGER trigger_check_personal_records
  AFTER INSERT ON activities
  FOR EACH ROW
  EXECUTE FUNCTION check_personal_records();