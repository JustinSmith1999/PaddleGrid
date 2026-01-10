/*
  # Achievement Definitions Table
  
  1. New Table
    - `achievement_definitions` - Master list of all possible achievements
*/

CREATE TABLE IF NOT EXISTS achievement_definitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  description text NOT NULL,
  category text NOT NULL CHECK (category IN ('participation', 'skill', 'social', 'loyalty', 'streak', 'special')),
  icon text NOT NULL,
  default_threshold integer NOT NULL DEFAULT 1,
  threshold_unit text NOT NULL,
  rarity text NOT NULL DEFAULT 'common' CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
  points integer NOT NULL DEFAULT 10,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_achievement_definitions_category ON achievement_definitions(category);
CREATE INDEX IF NOT EXISTS idx_achievement_definitions_code ON achievement_definitions(code);

ALTER TABLE achievement_definitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view achievement definitions"
  ON achievement_definitions
  FOR SELECT
  USING (true);
