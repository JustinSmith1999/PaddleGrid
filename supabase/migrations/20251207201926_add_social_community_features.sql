/*
  # Social & Community Features

  1. New Tables
    - `player_matching_preferences` - Store player preferences for finding partners
      - `user_id` (uuid, FK to profiles)
      - `skill_level_min` (numeric)
      - `skill_level_max` (numeric)
      - `preferred_days` (text array)
      - `preferred_times` (text array)
      - `looking_for_partner` (boolean)
      - `bio` (text)
    
    - `match_requests` - Player to player match requests
      - `id` (uuid, PK)
      - `from_user_id` (uuid, FK)
      - `to_user_id` (uuid, FK)
      - `status` (text) - pending, accepted, declined
      - `message` (text)
      - `created_at` (timestamptz)
    
    - `activity_feed` - Social feed of activities
      - `id` (uuid, PK)
      - `user_id` (uuid, FK)
      - `activity_type` (text) - match_completed, rating_change, achievement_unlocked, etc.
      - `content` (jsonb) - Flexible content storage
      - `is_public` (boolean)
      - `created_at` (timestamptz)
    
    - `activity_likes` - Likes on activity feed items
      - `id` (uuid, PK)
      - `activity_id` (uuid, FK)
      - `user_id` (uuid, FK)
      - `created_at` (timestamptz)
    
    - `activity_comments` - Comments on activity feed items
      - `id` (uuid, PK)
      - `activity_id` (uuid, FK)
      - `user_id` (uuid, FK)
      - `comment` (text)
      - `created_at` (timestamptz)
    
    - `leaderboard_settings` - Configuration for leaderboards
      - `id` (uuid, PK)
      - `facility_id` (uuid, FK)
      - `name` (text)
      - `criteria` (jsonb) - Filter criteria
      - `is_public` (boolean)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Player Matching Preferences
CREATE TABLE IF NOT EXISTS player_matching_preferences (
  user_id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  skill_level_min numeric DEFAULT 1.0,
  skill_level_max numeric DEFAULT 7.0,
  preferred_days text[] DEFAULT '{}',
  preferred_times text[] DEFAULT '{}',
  looking_for_partner boolean DEFAULT false,
  bio text DEFAULT '',
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE player_matching_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view others' matching preferences"
  ON player_matching_preferences FOR SELECT
  TO authenticated
  USING (looking_for_partner = true);

CREATE POLICY "Users can manage own matching preferences"
  ON player_matching_preferences FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Match Requests
CREATE TABLE IF NOT EXISTS match_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  to_user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  message text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE match_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their match requests"
  ON match_requests FOR SELECT
  TO authenticated
  USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

CREATE POLICY "Users can create match requests"
  ON match_requests FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = from_user_id);

CREATE POLICY "Users can update their received requests"
  ON match_requests FOR UPDATE
  TO authenticated
  USING (auth.uid() = to_user_id)
  WITH CHECK (auth.uid() = to_user_id);

-- Activity Feed
CREATE TABLE IF NOT EXISTS activity_feed (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  activity_type text NOT NULL,
  content jsonb DEFAULT '{}'::jsonb,
  is_public boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_activity_feed_created_at ON activity_feed(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_feed_user_id ON activity_feed(user_id);

ALTER TABLE activity_feed ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view public activities"
  ON activity_feed FOR SELECT
  TO authenticated
  USING (is_public = true OR auth.uid() = user_id);

CREATE POLICY "Users can create own activities"
  ON activity_feed FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Activity Likes
CREATE TABLE IF NOT EXISTS activity_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id uuid REFERENCES activity_feed(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(activity_id, user_id)
);

ALTER TABLE activity_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all likes"
  ON activity_likes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage own likes"
  ON activity_likes FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Activity Comments
CREATE TABLE IF NOT EXISTS activity_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id uuid REFERENCES activity_feed(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  comment text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_activity_comments_activity_id ON activity_comments(activity_id);

ALTER TABLE activity_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all comments"
  ON activity_comments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create comments"
  ON activity_comments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments"
  ON activity_comments FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Leaderboard Settings
CREATE TABLE IF NOT EXISTS leaderboard_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id uuid REFERENCES facilities(id) ON DELETE CASCADE,
  name text NOT NULL,
  criteria jsonb DEFAULT '{}'::jsonb,
  is_public boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE leaderboard_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view public leaderboards"
  ON leaderboard_settings FOR SELECT
  TO authenticated
  USING (is_public = true);

CREATE POLICY "Admins can manage leaderboards"
  ON leaderboard_settings FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );
