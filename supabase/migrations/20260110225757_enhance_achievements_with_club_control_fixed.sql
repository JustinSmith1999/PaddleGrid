/*
  # Enhance Achievements with Club Control
  
  1. Changes
    - Populate achievement_definitions with mapped categories
    - Add facility_id to user_achievements
    - Create achievement_progress table
    - Add functions for club-controlled achievement system
  
  2. Security
    - Maintain existing RLS policies
*/

-- Populate achievement_definitions from achievements with proper category mapping
INSERT INTO achievement_definitions (code, name, description, category, icon, default_threshold, threshold_unit, rarity, points)
SELECT 
  LOWER(REPLACE(REPLACE(name, ' ', '_'), '-', '_')) as code,
  name,
  description,
  CASE category
    WHEN 'matches' THEN 'participation'
    WHEN 'milestones' THEN 'participation'
    WHEN 'competitive' THEN 'skill'
    WHEN 'hours' THEN 'participation'
    WHEN 'social' THEN 'social'
    ELSE 'participation'
  END as category,
  COALESCE(icon, '🏆') as icon,
  COALESCE((criteria->>'threshold')::integer, 1) as default_threshold,
  COALESCE(criteria->>'unit', 'count') as threshold_unit,
  COALESCE(rarity, 'common') as rarity,
  COALESCE(points, 10) as points
FROM achievements
WHERE is_active = true
ON CONFLICT (code) DO NOTHING;

-- Add facility_id to user_achievements if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_achievements' 
    AND column_name = 'facility_id'
  ) THEN
    ALTER TABLE user_achievements ADD COLUMN facility_id uuid;
    
    UPDATE user_achievements 
    SET facility_id = (SELECT id FROM facilities LIMIT 1)
    WHERE facility_id IS NULL;
  END IF;
END $$;

-- Add achievement_definition_id to user_achievements if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_achievements' 
    AND column_name = 'achievement_definition_id'
  ) THEN
    ALTER TABLE user_achievements ADD COLUMN achievement_definition_id uuid REFERENCES achievement_definitions(id);
    
    UPDATE user_achievements ua
    SET achievement_definition_id = (
      SELECT ad.id 
      FROM achievement_definitions ad
      WHERE LOWER(REPLACE(REPLACE(ad.name, ' ', '_'), '-', '_')) = 
            LOWER(REPLACE(REPLACE((SELECT name FROM achievements WHERE id = ua.achievement_id), ' ', '_'), '-', '_'))
      LIMIT 1
    )
    WHERE achievement_definition_id IS NULL;
  END IF;
END $$;

-- Create achievement_progress table
CREATE TABLE IF NOT EXISTS achievement_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  facility_id uuid REFERENCES facilities(id) ON DELETE CASCADE NOT NULL,
  achievement_definition_id uuid REFERENCES achievement_definitions(id) ON DELETE CASCADE NOT NULL,
  current_progress integer DEFAULT 0,
  last_updated timestamptz DEFAULT now(),
  UNIQUE(user_id, facility_id, achievement_definition_id)
);

CREATE INDEX IF NOT EXISTS idx_achievement_progress_user_facility ON achievement_progress(user_id, facility_id);
CREATE INDEX IF NOT EXISTS idx_achievement_progress_definition ON achievement_progress(achievement_definition_id);

ALTER TABLE achievement_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own progress"
  ON achievement_progress
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can manage progress"
  ON achievement_progress
  FOR ALL
  WITH CHECK (true);

-- Function to check and award achievements
CREATE OR REPLACE FUNCTION check_and_award_achievement(
  p_user_id uuid,
  p_facility_id uuid,
  p_achievement_code text,
  p_progress_value integer
) RETURNS boolean AS $$
DECLARE
  v_achievement_def achievement_definitions%ROWTYPE;
  v_club_achievement club_achievements%ROWTYPE;
  v_threshold integer;
  v_already_earned boolean;
BEGIN
  SELECT * INTO v_achievement_def
  FROM achievement_definitions
  WHERE code = p_achievement_code;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  SELECT * INTO v_club_achievement
  FROM club_achievements
  WHERE facility_id = p_facility_id
  AND achievement_definition_id = v_achievement_def.id
  AND is_enabled = true;
  
  IF NOT FOUND THEN
    v_threshold := v_achievement_def.default_threshold;
  ELSE
    v_threshold := COALESCE(v_club_achievement.custom_threshold, v_achievement_def.default_threshold);
  END IF;
  
  SELECT true INTO v_already_earned
  FROM user_achievements
  WHERE user_id = p_user_id
  AND facility_id = p_facility_id
  AND achievement_definition_id = v_achievement_def.id;
  
  IF v_already_earned THEN
    RETURN false;
  END IF;
  
  INSERT INTO achievement_progress (
    user_id,
    facility_id,
    achievement_definition_id,
    current_progress,
    last_updated
  ) VALUES (
    p_user_id,
    p_facility_id,
    v_achievement_def.id,
    p_progress_value,
    now()
  )
  ON CONFLICT (user_id, facility_id, achievement_definition_id)
  DO UPDATE SET
    current_progress = GREATEST(achievement_progress.current_progress, p_progress_value),
    last_updated = now();
  
  IF p_progress_value >= v_threshold THEN
    INSERT INTO user_achievements (
      user_id,
      facility_id,
      achievement_id,
      achievement_definition_id,
      unlocked_at,
      progress
    ) VALUES (
      p_user_id,
      p_facility_id,
      v_achievement_def.id,
      v_achievement_def.id,
      now(),
      p_progress_value
    )
    ON CONFLICT (user_id, achievement_id) 
    DO UPDATE SET facility_id = p_facility_id, achievement_definition_id = v_achievement_def.id;
    
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user achievement progress for a facility
CREATE OR REPLACE FUNCTION get_user_achievement_progress(
  p_user_id uuid,
  p_facility_id uuid
) RETURNS TABLE (
  achievement_code text,
  achievement_name text,
  achievement_description text,
  category text,
  icon text,
  rarity text,
  points integer,
  current_progress integer,
  required_threshold integer,
  is_unlocked boolean,
  unlocked_at timestamptz,
  progress_percentage numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ad.code,
    COALESCE(ca.custom_name, ad.name) as achievement_name,
    COALESCE(ca.custom_description, ad.description) as achievement_description,
    ad.category,
    ad.icon,
    ad.rarity,
    ad.points,
    COALESCE(ap.current_progress, 0) as current_progress,
    COALESCE(ca.custom_threshold, ad.default_threshold) as required_threshold,
    (ua.id IS NOT NULL) as is_unlocked,
    ua.unlocked_at,
    CASE 
      WHEN ua.id IS NOT NULL THEN 100
      ELSE LEAST(100, (COALESCE(ap.current_progress, 0)::numeric / COALESCE(ca.custom_threshold, ad.default_threshold)::numeric * 100))
    END as progress_percentage
  FROM achievement_definitions ad
  LEFT JOIN club_achievements ca ON ca.achievement_definition_id = ad.id 
    AND ca.facility_id = p_facility_id 
    AND ca.is_enabled = true
  LEFT JOIN achievement_progress ap ON ap.achievement_definition_id = ad.id 
    AND ap.user_id = p_user_id 
    AND ap.facility_id = p_facility_id
  LEFT JOIN user_achievements ua ON ua.achievement_definition_id = ad.id 
    AND ua.user_id = p_user_id 
    AND ua.facility_id = p_facility_id
  WHERE ca.id IS NOT NULL OR ca.id IS NULL
  ORDER BY 
    CASE ad.rarity 
      WHEN 'common' THEN 1 
      WHEN 'rare' THEN 2 
      WHEN 'epic' THEN 3 
      WHEN 'legendary' THEN 4 
    END,
    ad.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Auto-enable default achievements for existing facilities
INSERT INTO club_achievements (
  facility_id,
  achievement_definition_id,
  is_enabled,
  custom_threshold
)
SELECT
  f.id,
  ad.id,
  true,
  ad.default_threshold
FROM facilities f
CROSS JOIN achievement_definitions ad
WHERE ad.rarity IN ('common', 'rare')
ON CONFLICT (facility_id, achievement_definition_id) DO NOTHING;
