/*
  # DUPR Reporting System

  ## Overview
  Implements complete DUPR (Dynamic Universal Pickleball Rating) tracking system.
  Players can report match results, track ratings, and view match history.

  ## New Tables

  ### 1. `dupr_matches`
  Pickleball match records
  - `id` (uuid, PK) - Match identifier
  - `facility_id` (uuid, FK) - Reference to facilities
  - `court_id` (uuid, FK) - Reference to courts
  - `match_date` (date) - Date of match
  - `match_time` (time) - Time of match
  - `match_type` (text) - Type: 'singles', 'doubles', 'mixed_doubles'
  - `match_format` (text) - Format: 'single_game', 'best_of_3', 'best_of_5'
  - `status` (text) - Status: 'pending', 'verified', 'approved', 'rejected', 'submitted_to_dupr'
  - `reported_by` (uuid, FK) - User who reported the match
  - `verified_by` (uuid, FK) - Admin who verified
  - `verification_notes` (text) - Admin notes
  - `dupr_match_id` (text) - External DUPR ID if submitted
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### 2. `dupr_match_results`
  Individual player/team results for matches
  - `id` (uuid, PK) - Result identifier
  - `match_id` (uuid, FK) - Reference to dupr_matches
  - `team_number` (int) - Team 1 or 2
  - `player1_id` (uuid, FK) - First player on team
  - `player2_id` (uuid, FK) - Second player on team (null for singles)
  - `score` (int) - Team's final score
  - `is_winner` (boolean) - Whether this team won
  - `rating_before` (numeric) - Player rating before match
  - `rating_after` (numeric) - Player rating after match
  - `rating_change` (numeric) - Change in rating

  ### 3. `dupr_ratings_history`
  Historical record of rating changes
  - `id` (uuid, PK) - History identifier
  - `user_id` (uuid, FK) - Reference to profiles
  - `rating` (numeric) - Rating value
  - `match_id` (uuid, FK) - Match that caused change
  - `change_amount` (numeric) - Rating change
  - `change_reason` (text) - Reason: 'match_win', 'match_loss', 'manual_adjustment', 'initial_rating'
  - `created_at` (timestamptz) - Timestamp

  ## Schema Changes
  Adds DUPR rating to player_stats table

  ## Security
  - RLS policies for user access to own matches
  - Admin approval workflow for match verification
  - Audit trail for all rating changes

  ## Important Notes
  1. Matches require verification before affecting ratings
  2. Rating calculation can be customized per facility
  3. Export functionality for submitting to DUPR.com
  4. Support for singles, doubles, and mixed doubles formats
*/

-- Add DUPR rating to player_stats
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'player_stats' AND column_name = 'dupr_rating'
  ) THEN
    ALTER TABLE player_stats ADD COLUMN dupr_rating numeric(4,2) DEFAULT NULL CHECK (dupr_rating >= 0 AND dupr_rating <= 8);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'player_stats' AND column_name = 'dupr_singles_rating'
  ) THEN
    ALTER TABLE player_stats ADD COLUMN dupr_singles_rating numeric(4,2) DEFAULT NULL CHECK (dupr_singles_rating >= 0 AND dupr_singles_rating <= 8);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'player_stats' AND column_name = 'dupr_doubles_rating'
  ) THEN
    ALTER TABLE player_stats ADD COLUMN dupr_doubles_rating numeric(4,2) DEFAULT NULL CHECK (dupr_doubles_rating >= 0 AND dupr_doubles_rating <= 8);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'player_stats' AND column_name = 'total_matches'
  ) THEN
    ALTER TABLE player_stats ADD COLUMN total_matches integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'player_stats' AND column_name = 'matches_won'
  ) THEN
    ALTER TABLE player_stats ADD COLUMN matches_won integer DEFAULT 0;
  END IF;
END $$;

-- Create dupr_matches table
CREATE TABLE IF NOT EXISTS dupr_matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id uuid NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
  court_id uuid REFERENCES courts(id) ON DELETE SET NULL,
  match_date date NOT NULL,
  match_time time NOT NULL,
  match_type text NOT NULL CHECK (match_type IN ('singles', 'doubles', 'mixed_doubles')),
  match_format text NOT NULL DEFAULT 'single_game' CHECK (match_format IN ('single_game', 'best_of_3', 'best_of_5')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'approved', 'rejected', 'submitted_to_dupr')),
  reported_by uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  verified_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  verification_notes text,
  dupr_match_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create dupr_match_results table
CREATE TABLE IF NOT EXISTS dupr_match_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL REFERENCES dupr_matches(id) ON DELETE CASCADE,
  team_number integer NOT NULL CHECK (team_number IN (1, 2)),
  player1_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  player2_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  score integer NOT NULL CHECK (score >= 0),
  is_winner boolean NOT NULL DEFAULT false,
  rating_before numeric(4,2),
  rating_after numeric(4,2),
  rating_change numeric(4,2),
  UNIQUE(match_id, team_number)
);

-- Create dupr_ratings_history table
CREATE TABLE IF NOT EXISTS dupr_ratings_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rating numeric(4,2) NOT NULL CHECK (rating >= 0 AND rating <= 8),
  match_id uuid REFERENCES dupr_matches(id) ON DELETE SET NULL,
  change_amount numeric(4,2) NOT NULL,
  change_reason text NOT NULL CHECK (change_reason IN ('match_win', 'match_loss', 'manual_adjustment', 'initial_rating')),
  created_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_dupr_matches_facility ON dupr_matches(facility_id);
CREATE INDEX IF NOT EXISTS idx_dupr_matches_date ON dupr_matches(match_date DESC);
CREATE INDEX IF NOT EXISTS idx_dupr_matches_status ON dupr_matches(status);
CREATE INDEX IF NOT EXISTS idx_dupr_matches_reported_by ON dupr_matches(reported_by);
CREATE INDEX IF NOT EXISTS idx_dupr_match_results_match ON dupr_match_results(match_id);
CREATE INDEX IF NOT EXISTS idx_dupr_match_results_player1 ON dupr_match_results(player1_id);
CREATE INDEX IF NOT EXISTS idx_dupr_match_results_player2 ON dupr_match_results(player2_id);
CREATE INDEX IF NOT EXISTS idx_dupr_ratings_history_user ON dupr_ratings_history(user_id);
CREATE INDEX IF NOT EXISTS idx_dupr_ratings_history_date ON dupr_ratings_history(created_at DESC);

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_dupr_matches_updated_at ON dupr_matches;
CREATE TRIGGER update_dupr_matches_updated_at
  BEFORE UPDATE ON dupr_matches
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE dupr_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE dupr_match_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE dupr_ratings_history ENABLE ROW LEVEL SECURITY;

-- DUPR Matches Policies
CREATE POLICY "Users can view matches they participated in"
  ON dupr_matches FOR SELECT
  TO authenticated
  USING (
    reported_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM dupr_match_results
      WHERE dupr_match_results.match_id = dupr_matches.id
      AND (dupr_match_results.player1_id = auth.uid() OR dupr_match_results.player2_id = auth.uid())
    )
    OR facility_id IN (SELECT get_user_facilities(auth.uid()))
  );

CREATE POLICY "Users can report matches in their facilities"
  ON dupr_matches FOR INSERT
  TO authenticated
  WITH CHECK (
    reported_by = auth.uid()
    AND facility_id IN (SELECT get_user_facilities(auth.uid()))
  );

CREATE POLICY "Users can update their own pending matches"
  ON dupr_matches FOR UPDATE
  TO authenticated
  USING (
    reported_by = auth.uid()
    AND status = 'pending'
  )
  WITH CHECK (
    reported_by = auth.uid()
    AND status = 'pending'
  );

CREATE POLICY "Facility admins can manage all matches"
  ON dupr_matches FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM facility_users
      WHERE facility_users.facility_id = dupr_matches.facility_id
      AND facility_users.user_id = auth.uid()
      AND facility_users.role IN ('owner', 'admin', 'staff')
    )
  );

-- DUPR Match Results Policies
CREATE POLICY "Users can view match results for matches they can see"
  ON dupr_match_results FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM dupr_matches
      WHERE dupr_matches.id = dupr_match_results.match_id
      AND (
        dupr_matches.reported_by = auth.uid()
        OR dupr_match_results.player1_id = auth.uid()
        OR dupr_match_results.player2_id = auth.uid()
        OR dupr_matches.facility_id IN (SELECT get_user_facilities(auth.uid()))
      )
    )
  );

CREATE POLICY "Users can create match results for matches they report"
  ON dupr_match_results FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM dupr_matches
      WHERE dupr_matches.id = dupr_match_results.match_id
      AND dupr_matches.reported_by = auth.uid()
      AND dupr_matches.status = 'pending'
    )
  );

CREATE POLICY "Facility admins can manage match results"
  ON dupr_match_results FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM dupr_matches
      JOIN facility_users ON facility_users.facility_id = dupr_matches.facility_id
      WHERE dupr_matches.id = dupr_match_results.match_id
      AND facility_users.user_id = auth.uid()
      AND facility_users.role IN ('owner', 'admin', 'staff')
    )
  );

-- DUPR Ratings History Policies
CREATE POLICY "Users can view own rating history"
  ON dupr_ratings_history FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Facility admins can view all rating history"
  ON dupr_ratings_history FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM facility_users
      WHERE facility_users.user_id = auth.uid()
      AND facility_users.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "System can insert rating history"
  ON dupr_ratings_history FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Function to calculate rating change based on result
CREATE OR REPLACE FUNCTION calculate_dupr_rating_change(
  current_rating numeric,
  opponent_rating numeric,
  is_win boolean,
  match_type text
)
RETURNS numeric AS $$
DECLARE
  k_factor numeric := 32;
  expected_score numeric;
  actual_score numeric;
  rating_diff numeric;
BEGIN
  rating_diff := opponent_rating - current_rating;
  expected_score := 1.0 / (1.0 + power(10, rating_diff / 400.0));
  
  IF is_win THEN
    actual_score := 1.0;
  ELSE
    actual_score := 0.0;
  END IF;
  
  RETURN k_factor * (actual_score - expected_score);
END;
$$ LANGUAGE plpgsql;

-- Function to approve match and update ratings
CREATE OR REPLACE FUNCTION approve_dupr_match(
  p_match_id uuid,
  p_verified_by uuid
)
RETURNS boolean AS $$
DECLARE
  v_match_type text;
  v_result record;
  v_team1_rating numeric;
  v_team2_rating numeric;
  v_rating_change numeric;
BEGIN
  SELECT match_type INTO v_match_type
  FROM dupr_matches
  WHERE id = p_match_id;

  UPDATE dupr_matches
  SET status = 'approved',
      verified_by = p_verified_by,
      updated_at = now()
  WHERE id = p_match_id;

  FOR v_result IN
    SELECT * FROM dupr_match_results
    WHERE match_id = p_match_id
    ORDER BY team_number
  LOOP
    SELECT COALESCE(dupr_rating, 4.0) INTO v_result.rating_before
    FROM player_stats
    WHERE user_id = v_result.player1_id;

    SELECT AVG(COALESCE(dupr_rating, 4.0)) INTO v_team1_rating
    FROM dupr_match_results dmr
    WHERE dmr.match_id = p_match_id AND dmr.team_number = 1;

    SELECT AVG(COALESCE(dupr_rating, 4.0)) INTO v_team2_rating
    FROM dupr_match_results dmr
    WHERE dmr.match_id = p_match_id AND dmr.team_number = 2;

    v_rating_change := calculate_dupr_rating_change(
      v_result.rating_before,
      CASE WHEN v_result.team_number = 1 THEN v_team2_rating ELSE v_team1_rating END,
      v_result.is_winner,
      v_match_type
    );

    UPDATE dupr_match_results
    SET rating_before = v_result.rating_before,
        rating_after = v_result.rating_before + v_rating_change,
        rating_change = v_rating_change
    WHERE id = v_result.id;

    UPDATE player_stats
    SET dupr_rating = v_result.rating_before + v_rating_change,
        total_matches = total_matches + 1,
        matches_won = matches_won + CASE WHEN v_result.is_winner THEN 1 ELSE 0 END,
        updated_at = now()
    WHERE user_id = v_result.player1_id;

    INSERT INTO dupr_ratings_history (user_id, rating, match_id, change_amount, change_reason)
    VALUES (
      v_result.player1_id,
      v_result.rating_before + v_rating_change,
      p_match_id,
      v_rating_change,
      CASE WHEN v_result.is_winner THEN 'match_win' ELSE 'match_loss' END
    );

    IF v_result.player2_id IS NOT NULL THEN
      UPDATE player_stats
      SET dupr_rating = v_result.rating_before + v_rating_change,
          total_matches = total_matches + 1,
          matches_won = matches_won + CASE WHEN v_result.is_winner THEN 1 ELSE 0 END,
          updated_at = now()
      WHERE user_id = v_result.player2_id;

      INSERT INTO dupr_ratings_history (user_id, rating, match_id, change_amount, change_reason)
      VALUES (
        v_result.player2_id,
        v_result.rating_before + v_rating_change,
        p_match_id,
        v_rating_change,
        CASE WHEN v_result.is_winner THEN 'match_win' ELSE 'match_loss' END
      );
    END IF;
  END LOOP;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
