/*
  # Core Activity Tracking Tables for Strava-like Features

  ## New Tables
  1. activities - Core match/activity records
  2. activity_participants - Partners and opponents
  3. activity_kudos - Quick reactions
  4. segments - Court-based leaderboards
  5. segment_efforts - Performance records
  6. personal_records - Personal bests
  7. streaks - Playing streaks
  8. challenges - Community challenges
  9. challenge_participants - Challenge participation
  10. weekly_summaries - Weekly stats
  
  ## Security
  All tables have RLS enabled with appropriate policies
*/

-- Activities table
CREATE TABLE IF NOT EXISTS activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  facility_id uuid REFERENCES facilities(id) ON DELETE SET NULL,
  court_id uuid REFERENCES courts(id) ON DELETE SET NULL,
  activity_type text NOT NULL DEFAULT 'match' CHECK (activity_type IN ('match', 'practice', 'drill', 'tournament')),
  match_type text CHECK (match_type IN ('singles', 'doubles', 'mixed_doubles')),
  activity_date date NOT NULL DEFAULT CURRENT_DATE,
  start_time time,
  duration_minutes integer CHECK (duration_minutes > 0),
  score_us integer CHECK (score_us >= 0),
  score_them integer CHECK (score_them >= 0),
  is_win boolean,
  rating_before numeric(4,2),
  rating_after numeric(4,2),
  rating_change numeric(4,2),
  effort_level integer CHECK (effort_level >= 1 AND effort_level <= 10),
  description text,
  photos text[] DEFAULT ARRAY[]::text[],
  weather jsonb DEFAULT '{}'::jsonb,
  privacy text NOT NULL DEFAULT 'public' CHECK (privacy IN ('public', 'followers', 'private')),
  kudos_count integer DEFAULT 0,
  comment_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Activity participants table
CREATE TABLE IF NOT EXISTS activity_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id uuid NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('partner', 'opponent')),
  confirmed boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT unique_activity_participant UNIQUE (activity_id, user_id)
);

-- Activity kudos table
CREATE TABLE IF NOT EXISTS activity_kudos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id uuid NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT unique_activity_kudos UNIQUE (activity_id, user_id)
);

-- Segments table
CREATE TABLE IF NOT EXISTS segments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  court_id uuid REFERENCES courts(id) ON DELETE CASCADE,
  facility_id uuid REFERENCES facilities(id) ON DELETE CASCADE,
  segment_type text NOT NULL CHECK (segment_type IN ('court_king', 'win_streak', 'most_active', 'rating_king')),
  description text,
  is_active boolean DEFAULT true,
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- Segment efforts table
CREATE TABLE IF NOT EXISTS segment_efforts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  segment_id uuid NOT NULL REFERENCES segments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  activity_id uuid REFERENCES activities(id) ON DELETE SET NULL,
  value numeric NOT NULL,
  rank integer,
  is_pr boolean DEFAULT false,
  achieved_at timestamptz DEFAULT now()
);

-- Personal records table
CREATE TABLE IF NOT EXISTS personal_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  record_type text NOT NULL CHECK (record_type IN ('win_streak', 'rating_gain', 'most_matches_week', 'highest_rating', 'longest_match', 'biggest_comeback')),
  value numeric NOT NULL,
  previous_value numeric,
  activity_id uuid REFERENCES activities(id) ON DELETE SET NULL,
  achieved_at timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb,
  CONSTRAINT unique_user_record_type UNIQUE (user_id, record_type)
);

-- Streaks table
CREATE TABLE IF NOT EXISTS streaks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  streak_type text NOT NULL CHECK (streak_type IN ('daily', 'weekly', 'win_streak')),
  current_count integer DEFAULT 0,
  longest_count integer DEFAULT 0,
  last_activity_date date,
  started_at date,
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT unique_user_streak_type UNIQUE (user_id, streak_type)
);

-- Challenges table
CREATE TABLE IF NOT EXISTS challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  challenge_type text NOT NULL CHECK (challenge_type IN ('personal', 'facility', 'global')),
  goal_type text NOT NULL CHECK (goal_type IN ('matches_played', 'courts_visited', 'wins', 'rating_gain', 'streak_days')),
  goal_value integer NOT NULL CHECK (goal_value > 0),
  facility_id uuid REFERENCES facilities(id) ON DELETE CASCADE,
  start_date date NOT NULL,
  end_date date NOT NULL,
  reward_description text,
  is_active boolean DEFAULT true,
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT valid_challenge_dates CHECK (end_date > start_date)
);

-- Challenge participants table
CREATE TABLE IF NOT EXISTS challenge_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id uuid NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  progress integer DEFAULT 0,
  completed boolean DEFAULT false,
  completed_at timestamptz,
  joined_at timestamptz DEFAULT now(),
  CONSTRAINT unique_challenge_participant UNIQUE (challenge_id, user_id)
);

-- Weekly summaries table
CREATE TABLE IF NOT EXISTS weekly_summaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  week_start date NOT NULL,
  week_end date NOT NULL,
  total_activities integer DEFAULT 0,
  total_duration_minutes integer DEFAULT 0,
  wins integer DEFAULT 0,
  losses integer DEFAULT 0,
  rating_change numeric(4,2) DEFAULT 0,
  courts_visited integer DEFAULT 0,
  new_prs integer DEFAULT 0,
  achievements_unlocked integer DEFAULT 0,
  kudos_received integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT unique_user_week UNIQUE (user_id, week_start)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_activities_user ON activities(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_facility ON activities(facility_id);
CREATE INDEX IF NOT EXISTS idx_activities_court ON activities(court_id);
CREATE INDEX IF NOT EXISTS idx_activities_date ON activities(activity_date DESC);
CREATE INDEX IF NOT EXISTS idx_activities_created ON activities(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activities_privacy ON activities(privacy);

CREATE INDEX IF NOT EXISTS idx_activity_participants_activity ON activity_participants(activity_id);
CREATE INDEX IF NOT EXISTS idx_activity_participants_user ON activity_participants(user_id);

CREATE INDEX IF NOT EXISTS idx_activity_kudos_activity ON activity_kudos(activity_id);
CREATE INDEX IF NOT EXISTS idx_activity_kudos_user ON activity_kudos(user_id);

CREATE INDEX IF NOT EXISTS idx_segments_court ON segments(court_id);
CREATE INDEX IF NOT EXISTS idx_segments_facility ON segments(facility_id);

CREATE INDEX IF NOT EXISTS idx_segment_efforts_segment ON segment_efforts(segment_id);
CREATE INDEX IF NOT EXISTS idx_segment_efforts_user ON segment_efforts(user_id);

CREATE INDEX IF NOT EXISTS idx_personal_records_user ON personal_records(user_id);
CREATE INDEX IF NOT EXISTS idx_streaks_user ON streaks(user_id);
CREATE INDEX IF NOT EXISTS idx_challenges_active ON challenges(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_challenge_participants_challenge ON challenge_participants(challenge_id);
CREATE INDEX IF NOT EXISTS idx_weekly_summaries_user ON weekly_summaries(user_id);

-- Enable RLS
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_kudos ENABLE ROW LEVEL SECURITY;
ALTER TABLE segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE segment_efforts ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_summaries ENABLE ROW LEVEL SECURITY;

-- RLS Policies (using DO blocks to avoid conflicts)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'activities' AND policyname = 'Users can view activities based on privacy') THEN
    CREATE POLICY "Users can view activities based on privacy" ON activities FOR SELECT TO authenticated
    USING (privacy = 'public' OR user_id = auth.uid() OR (privacy = 'followers' AND EXISTS (SELECT 1 FROM social_follows WHERE (follower_id = auth.uid() AND following_id = user_id) OR (following_id = auth.uid() AND follower_id = user_id))));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'activities' AND policyname = 'Users can create own activities') THEN
    CREATE POLICY "Users can create own activities" ON activities FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'activities' AND policyname = 'Users can update own activities') THEN
    CREATE POLICY "Users can update own activities" ON activities FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'activities' AND policyname = 'Users can delete own activities') THEN
    CREATE POLICY "Users can delete own activities" ON activities FOR DELETE TO authenticated USING (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'activity_kudos' AND policyname = 'Users can view kudos') THEN
    CREATE POLICY "Users can view kudos" ON activity_kudos FOR SELECT TO authenticated USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'activity_kudos' AND policyname = 'Users can give kudos') THEN
    CREATE POLICY "Users can give kudos" ON activity_kudos FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'activity_kudos' AND policyname = 'Users can remove their kudos') THEN
    CREATE POLICY "Users can remove their kudos" ON activity_kudos FOR DELETE TO authenticated USING (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'segments' AND policyname = 'Users can view active segments') THEN
    CREATE POLICY "Users can view active segments" ON segments FOR SELECT TO authenticated USING (is_active = true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'segment_efforts' AND policyname = 'Users can view all segment efforts') THEN
    CREATE POLICY "Users can view all segment efforts" ON segment_efforts FOR SELECT TO authenticated USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'personal_records' AND policyname = 'Users can view all personal records') THEN
    CREATE POLICY "Users can view all personal records" ON personal_records FOR SELECT TO authenticated USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'streaks' AND policyname = 'Users can view all streaks') THEN
    CREATE POLICY "Users can view all streaks" ON streaks FOR SELECT TO authenticated USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'streaks' AND policyname = 'Users can manage own streaks') THEN
    CREATE POLICY "Users can manage own streaks" ON streaks FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'challenges' AND policyname = 'Users can view active challenges') THEN
    CREATE POLICY "Users can view active challenges" ON challenges FOR SELECT TO authenticated USING (is_active = true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'challenge_participants' AND policyname = 'Users can view challenge participants') THEN
    CREATE POLICY "Users can view challenge participants" ON challenge_participants FOR SELECT TO authenticated USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'challenge_participants' AND policyname = 'Users can join challenges') THEN
    CREATE POLICY "Users can join challenges" ON challenge_participants FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'weekly_summaries' AND policyname = 'Users can view all weekly summaries') THEN
    CREATE POLICY "Users can view all weekly summaries" ON weekly_summaries FOR SELECT TO authenticated USING (true);
  END IF;
END$$;