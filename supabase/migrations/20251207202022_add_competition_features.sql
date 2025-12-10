/*
  # Enhanced Match & Competition Features

  1. New Tables
    - `leagues` - League definitions and configurations
      - `id` (uuid, PK)
      - `facility_id` (uuid, FK)
      - `name` (text)
      - `description` (text)
      - `season_start` (date)
      - `season_end` (date)
      - `format` (text) - singles, doubles, mixed
      - `skill_level` (text)
      - `max_teams` (integer)
      - `status` (text) - registration, active, completed
    
    - `league_teams` - Teams participating in leagues
      - `id` (uuid, PK)
      - `league_id` (uuid, FK)
      - `name` (text)
      - `captain_id` (uuid, FK)
      - `wins` (integer)
      - `losses` (integer)
      - `points` (integer)
    
    - `league_members` - Team rosters
      - `id` (uuid, PK)
      - `team_id` (uuid, FK)
      - `user_id` (uuid, FK)
      - `role` (text) - captain, member
    
    - `league_matches` - Scheduled league matches
      - `id` (uuid, PK)
      - `league_id` (uuid, FK)
      - `team1_id` (uuid, FK)
      - `team2_id` (uuid, FK)
      - `scheduled_date` (date)
      - `scheduled_time` (time)
      - `court_id` (uuid, FK)
      - `status` (text)
      - `winner_id` (uuid, FK)
    
    - `ladders` - Competitive ladder rankings
      - `id` (uuid, PK)
      - `facility_id` (uuid, FK)
      - `name` (text)
      - `description` (text)
      - `format` (text)
      - `is_active` (boolean)
    
    - `ladder_participants` - Players on ladders
      - `id` (uuid, PK)
      - `ladder_id` (uuid, FK)
      - `user_id` (uuid, FK)
      - `rank` (integer)
      - `wins` (integer)
      - `losses` (integer)
      - `last_match_date` (date)
    
    - `ladder_challenges` - Challenge requests between players
      - `id` (uuid, PK)
      - `ladder_id` (uuid, FK)
      - `challenger_id` (uuid, FK)
      - `challenged_id` (uuid, FK)
      - `status` (text)
      - `proposed_date` (date)
      - `proposed_time` (time)
      - `result` (text)
    
    - `live_matches` - Currently active matches with live scoring
      - `id` (uuid, PK)
      - `court_id` (uuid, FK)
      - `team1_player1_id` (uuid, FK)
      - `team1_player2_id` (uuid, FK) - nullable for singles
      - `team2_player1_id` (uuid, FK)
      - `team2_player2_id` (uuid, FK) - nullable for singles
      - `team1_score` (integer)
      - `team2_score` (integer)
      - `current_game` (integer)
      - `game_scores` (jsonb)
      - `status` (text)
      - `started_at` (timestamptz)
      - `ended_at` (timestamptz)
    
    - `match_spectators` - Users watching live matches
      - `id` (uuid, PK)
      - `match_id` (uuid, FK)
      - `user_id` (uuid, FK)
      - `joined_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users and admins
*/

-- Leagues
CREATE TABLE IF NOT EXISTS leagues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id uuid REFERENCES facilities(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  season_start date NOT NULL,
  season_end date NOT NULL,
  format text NOT NULL CHECK (format IN ('singles', 'doubles', 'mixed')),
  skill_level text CHECK (skill_level IN ('beginner', 'intermediate', 'advanced', 'all')),
  max_teams integer DEFAULT 16 CHECK (max_teams > 0),
  status text DEFAULT 'registration' CHECK (status IN ('registration', 'active', 'completed')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CHECK (season_end > season_start)
);

CREATE INDEX IF NOT EXISTS idx_leagues_facility ON leagues(facility_id);
CREATE INDEX IF NOT EXISTS idx_leagues_status ON leagues(status);

ALTER TABLE leagues ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active leagues"
  ON leagues FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage leagues"
  ON leagues FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- League Teams
CREATE TABLE IF NOT EXISTS league_teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id uuid REFERENCES leagues(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  captain_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  wins integer DEFAULT 0 CHECK (wins >= 0),
  losses integer DEFAULT 0 CHECK (losses >= 0),
  points integer DEFAULT 0 CHECK (points >= 0),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_league_teams_league ON league_teams(league_id);
CREATE INDEX IF NOT EXISTS idx_league_teams_captain ON league_teams(captain_id);

ALTER TABLE league_teams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view league teams"
  ON league_teams FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Captains can update own team"
  ON league_teams FOR UPDATE
  TO authenticated
  USING (auth.uid() = captain_id)
  WITH CHECK (auth.uid() = captain_id);

CREATE POLICY "Users can create teams"
  ON league_teams FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = captain_id);

CREATE POLICY "Admins can manage all teams"
  ON league_teams FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- League Members
CREATE TABLE IF NOT EXISTS league_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid REFERENCES league_teams(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  role text DEFAULT 'member' CHECK (role IN ('captain', 'member')),
  joined_at timestamptz DEFAULT now(),
  UNIQUE(team_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_league_members_team ON league_members(team_id);
CREATE INDEX IF NOT EXISTS idx_league_members_user ON league_members(user_id);

ALTER TABLE league_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view league members"
  ON league_members FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Captains can manage team roster"
  ON league_members FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM league_teams
      WHERE league_teams.id = league_members.team_id
      AND league_teams.captain_id = auth.uid()
    )
  );

-- League Matches
CREATE TABLE IF NOT EXISTS league_matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id uuid REFERENCES leagues(id) ON DELETE CASCADE NOT NULL,
  team1_id uuid REFERENCES league_teams(id) ON DELETE CASCADE NOT NULL,
  team2_id uuid REFERENCES league_teams(id) ON DELETE CASCADE NOT NULL,
  scheduled_date date NOT NULL,
  scheduled_time time NOT NULL,
  court_id uuid REFERENCES courts(id) ON DELETE SET NULL,
  status text DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
  winner_id uuid REFERENCES league_teams(id) ON DELETE SET NULL,
  team1_score integer DEFAULT 0,
  team2_score integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_league_matches_league ON league_matches(league_id);
CREATE INDEX IF NOT EXISTS idx_league_matches_teams ON league_matches(team1_id, team2_id);
CREATE INDEX IF NOT EXISTS idx_league_matches_date ON league_matches(scheduled_date);

ALTER TABLE league_matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view league matches"
  ON league_matches FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage matches"
  ON league_matches FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Ladders
CREATE TABLE IF NOT EXISTS ladders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id uuid REFERENCES facilities(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  format text NOT NULL CHECK (format IN ('singles', 'doubles', 'mixed')),
  max_rank_difference integer DEFAULT 3 CHECK (max_rank_difference > 0),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ladders_facility ON ladders(facility_id);
CREATE INDEX IF NOT EXISTS idx_ladders_active ON ladders(is_active);

ALTER TABLE ladders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active ladders"
  ON ladders FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Admins can manage ladders"
  ON ladders FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Ladder Participants
CREATE TABLE IF NOT EXISTS ladder_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ladder_id uuid REFERENCES ladders(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  rank integer NOT NULL CHECK (rank > 0),
  wins integer DEFAULT 0 CHECK (wins >= 0),
  losses integer DEFAULT 0 CHECK (losses >= 0),
  last_match_date date,
  joined_at timestamptz DEFAULT now(),
  UNIQUE(ladder_id, user_id),
  UNIQUE(ladder_id, rank)
);

CREATE INDEX IF NOT EXISTS idx_ladder_participants_ladder ON ladder_participants(ladder_id);
CREATE INDEX IF NOT EXISTS idx_ladder_participants_rank ON ladder_participants(ladder_id, rank);

ALTER TABLE ladder_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view ladder participants"
  ON ladder_participants FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can join ladders"
  ON ladder_participants FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage ladder participants"
  ON ladder_participants FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Ladder Challenges
CREATE TABLE IF NOT EXISTS ladder_challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ladder_id uuid REFERENCES ladders(id) ON DELETE CASCADE NOT NULL,
  challenger_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  challenged_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'completed', 'cancelled')),
  proposed_date date,
  proposed_time time,
  court_id uuid REFERENCES courts(id) ON DELETE SET NULL,
  result text CHECK (result IN ('challenger_won', 'challenged_won', 'draw')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ladder_challenges_ladder ON ladder_challenges(ladder_id);
CREATE INDEX IF NOT EXISTS idx_ladder_challenges_users ON ladder_challenges(challenger_id, challenged_id);

ALTER TABLE ladder_challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their challenges"
  ON ladder_challenges FOR SELECT
  TO authenticated
  USING (auth.uid() = challenger_id OR auth.uid() = challenged_id);

CREATE POLICY "Users can create challenges"
  ON ladder_challenges FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = challenger_id);

CREATE POLICY "Users can update their challenges"
  ON ladder_challenges FOR UPDATE
  TO authenticated
  USING (auth.uid() = challenger_id OR auth.uid() = challenged_id)
  WITH CHECK (auth.uid() = challenger_id OR auth.uid() = challenged_id);

-- Live Matches
CREATE TABLE IF NOT EXISTS live_matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  court_id uuid REFERENCES courts(id) ON DELETE SET NULL,
  team1_player1_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  team1_player2_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  team2_player1_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  team2_player2_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  team1_score integer DEFAULT 0 CHECK (team1_score >= 0),
  team2_score integer DEFAULT 0 CHECK (team2_score >= 0),
  current_game integer DEFAULT 1 CHECK (current_game > 0),
  game_scores jsonb DEFAULT '[]'::jsonb,
  status text DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'paused')),
  started_at timestamptz DEFAULT now(),
  ended_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_live_matches_court ON live_matches(court_id);
CREATE INDEX IF NOT EXISTS idx_live_matches_status ON live_matches(status);

ALTER TABLE live_matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view live matches"
  ON live_matches FOR SELECT
  TO authenticated
  USING (status = 'in_progress');

CREATE POLICY "Players can manage their matches"
  ON live_matches FOR ALL
  TO authenticated
  USING (
    auth.uid() IN (team1_player1_id, team1_player2_id, team2_player1_id, team2_player2_id)
  )
  WITH CHECK (
    auth.uid() IN (team1_player1_id, team1_player2_id, team2_player1_id, team2_player2_id)
  );

-- Match Spectators
CREATE TABLE IF NOT EXISTS match_spectators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid REFERENCES live_matches(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  joined_at timestamptz DEFAULT now(),
  UNIQUE(match_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_match_spectators_match ON match_spectators(match_id);

ALTER TABLE match_spectators ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view spectators"
  ON match_spectators FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can join as spectators"
  ON match_spectators FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove themselves as spectators"
  ON match_spectators FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
