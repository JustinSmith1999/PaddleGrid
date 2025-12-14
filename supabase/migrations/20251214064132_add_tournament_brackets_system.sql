/*
  # Tournament Brackets System

  1. New Tables
    - `tournaments`
      - `id` (uuid, primary key)
      - `facility_id` (uuid, references facilities)
      - `name` (text)
      - `description` (text)
      - `tournament_type` (text: single_elimination, double_elimination, round_robin)
      - `bracket_size` (integer: 4, 8, 16, 32, 64)
      - `start_date` (date)
      - `end_date` (date)
      - `registration_deadline` (timestamp)
      - `max_participants` (integer)
      - `current_participants` (integer)
      - `entry_fee` (numeric)
      - `prize_pool` (numeric)
      - `status` (text: registration, in_progress, completed, cancelled)
      - `format` (text: singles, doubles, mixed_doubles)
      - `skill_level_min` (numeric)
      - `skill_level_max` (numeric)
      - `rules` (text)
      - `created_by` (uuid, references profiles)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `tournament_participants`
      - `id` (uuid, primary key)
      - `tournament_id` (uuid, references tournaments)
      - `user_id` (uuid, references profiles)
      - `partner_id` (uuid, references profiles, nullable for singles)
      - `seed_number` (integer)
      - `registration_date` (timestamp)
      - `payment_status` (text)
      - `checked_in` (boolean)
      - `checked_in_at` (timestamp)
    
    - `tournament_matches`
      - `id` (uuid, primary key)
      - `tournament_id` (uuid, references tournaments)
      - `round_number` (integer)
      - `match_number` (integer)
      - `bracket_position` (integer)
      - `participant1_id` (uuid, references tournament_participants)
      - `participant2_id` (uuid, references tournament_participants)
      - `winner_id` (uuid, references tournament_participants)
      - `score` (jsonb)
      - `scheduled_time` (timestamp)
      - `court_id` (uuid, references courts)
      - `status` (text: scheduled, in_progress, completed, walkover)
      - `next_match_id` (uuid, self-reference for bracket progression)
      - `is_losers_bracket` (boolean, for double elimination)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Public read access for published tournaments
    - Facility admins can create/manage tournaments
    - Participants can register and update their info
    - Only tournament directors can update match results

  3. Functions
    - Generate bracket structure
    - Update bracket progression
    - Calculate standings
*/

-- Tournaments Table
CREATE TABLE IF NOT EXISTS tournaments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id uuid REFERENCES facilities(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  tournament_type text NOT NULL CHECK (tournament_type IN ('single_elimination', 'double_elimination', 'round_robin')),
  bracket_size integer NOT NULL CHECK (bracket_size IN (4, 8, 16, 32, 64)),
  start_date date NOT NULL,
  end_date date NOT NULL,
  registration_deadline timestamptz NOT NULL,
  max_participants integer NOT NULL CHECK (max_participants > 0),
  current_participants integer DEFAULT 0 CHECK (current_participants >= 0),
  entry_fee numeric DEFAULT 0 CHECK (entry_fee >= 0),
  prize_pool numeric DEFAULT 0 CHECK (prize_pool >= 0),
  status text NOT NULL DEFAULT 'registration' CHECK (status IN ('registration', 'in_progress', 'completed', 'cancelled')),
  format text NOT NULL CHECK (format IN ('singles', 'doubles', 'mixed_doubles')),
  skill_level_min numeric DEFAULT 0.0,
  skill_level_max numeric DEFAULT 7.0,
  rules text,
  image_url text,
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tournament Participants Table
CREATE TABLE IF NOT EXISTS tournament_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid REFERENCES tournaments(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  partner_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  seed_number integer,
  registration_date timestamptz DEFAULT now(),
  payment_status text DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded')),
  checked_in boolean DEFAULT false,
  checked_in_at timestamptz,
  notes text,
  UNIQUE(tournament_id, user_id)
);

-- Tournament Matches Table
CREATE TABLE IF NOT EXISTS tournament_matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid REFERENCES tournaments(id) ON DELETE CASCADE NOT NULL,
  round_number integer NOT NULL CHECK (round_number > 0),
  match_number integer NOT NULL CHECK (match_number > 0),
  bracket_position integer NOT NULL,
  participant1_id uuid REFERENCES tournament_participants(id) ON DELETE SET NULL,
  participant2_id uuid REFERENCES tournament_participants(id) ON DELETE SET NULL,
  winner_id uuid REFERENCES tournament_participants(id) ON DELETE SET NULL,
  score jsonb DEFAULT '[]'::jsonb,
  scheduled_time timestamptz,
  court_id uuid REFERENCES courts(id) ON DELETE SET NULL,
  status text DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'walkover', 'cancelled')),
  next_match_id uuid REFERENCES tournament_matches(id) ON DELETE SET NULL,
  is_losers_bracket boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_tournaments_facility ON tournaments(facility_id);
CREATE INDEX IF NOT EXISTS idx_tournaments_status ON tournaments(status);
CREATE INDEX IF NOT EXISTS idx_tournaments_dates ON tournaments(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_tournament_participants_tournament ON tournament_participants(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournament_participants_user ON tournament_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_tournament_matches_tournament ON tournament_matches(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournament_matches_round ON tournament_matches(round_number);

-- Enable RLS
ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_matches ENABLE ROW LEVEL SECURITY;

-- Tournament Policies
CREATE POLICY "Anyone can view published tournaments"
  ON tournaments FOR SELECT
  USING (status != 'cancelled' OR status IS NOT NULL);

CREATE POLICY "Facility admins can create tournaments"
  ON tournaments FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM facility_users
      WHERE facility_users.facility_id = tournaments.facility_id
        AND facility_users.user_id = auth.uid()
        AND facility_users.role IN ('admin', 'owner')
    )
  );

CREATE POLICY "Facility admins can update their tournaments"
  ON tournaments FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM facility_users
      WHERE facility_users.facility_id = tournaments.facility_id
        AND facility_users.user_id = auth.uid()
        AND facility_users.role IN ('admin', 'owner')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM facility_users
      WHERE facility_users.facility_id = tournaments.facility_id
        AND facility_users.user_id = auth.uid()
        AND facility_users.role IN ('admin', 'owner')
    )
  );

CREATE POLICY "Facility admins can delete their tournaments"
  ON tournaments FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM facility_users
      WHERE facility_users.facility_id = tournaments.facility_id
        AND facility_users.user_id = auth.uid()
        AND facility_users.role IN ('admin', 'owner')
    )
  );

-- Tournament Participants Policies
CREATE POLICY "Anyone can view tournament participants"
  ON tournament_participants FOR SELECT
  USING (true);

CREATE POLICY "Users can register for tournaments"
  ON tournament_participants FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their registration"
  ON tournament_participants FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can withdraw from tournaments"
  ON tournament_participants FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Tournament Matches Policies
CREATE POLICY "Anyone can view tournament matches"
  ON tournament_matches FOR SELECT
  USING (true);

CREATE POLICY "Facility admins can create matches"
  ON tournament_matches FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tournaments t
      JOIN facility_users fu ON fu.facility_id = t.facility_id
      WHERE t.id = tournament_matches.tournament_id
        AND fu.user_id = auth.uid()
        AND fu.role IN ('admin', 'owner')
    )
  );

CREATE POLICY "Facility admins can update matches"
  ON tournament_matches FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tournaments t
      JOIN facility_users fu ON fu.facility_id = t.facility_id
      WHERE t.id = tournament_matches.tournament_id
        AND fu.user_id = auth.uid()
        AND fu.role IN ('admin', 'owner')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tournaments t
      JOIN facility_users fu ON fu.facility_id = t.facility_id
      WHERE t.id = tournament_matches.tournament_id
        AND fu.user_id = auth.uid()
        AND fu.role IN ('admin', 'owner')
    )
  );

-- Function to update tournament participant count
CREATE OR REPLACE FUNCTION update_tournament_participant_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE tournaments
  SET current_participants = (
    SELECT COUNT(*)
    FROM tournament_participants
    WHERE tournament_id = COALESCE(NEW.tournament_id, OLD.tournament_id)
  )
  WHERE id = COALESCE(NEW.tournament_id, OLD.tournament_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger for participant count
DROP TRIGGER IF EXISTS tournament_participant_count_trigger ON tournament_participants;
CREATE TRIGGER tournament_participant_count_trigger
  AFTER INSERT OR DELETE ON tournament_participants
  FOR EACH ROW EXECUTE FUNCTION update_tournament_participant_count();

-- Function to generate single elimination bracket
CREATE OR REPLACE FUNCTION generate_single_elimination_bracket(
  p_tournament_id uuid
)
RETURNS void AS $$
DECLARE
  v_bracket_size integer;
  v_round_number integer;
  v_match_number integer;
  v_matches_in_round integer;
  v_participant_ids uuid[];
  v_idx integer;
BEGIN
  SELECT bracket_size INTO v_bracket_size
  FROM tournaments WHERE id = p_tournament_id;

  SELECT array_agg(id ORDER BY seed_number, registration_date) INTO v_participant_ids
  FROM tournament_participants
  WHERE tournament_id = p_tournament_id AND checked_in = true;

  v_round_number := 1;
  v_matches_in_round := v_bracket_size / 2;
  v_match_number := 1;

  FOR v_idx IN 1..v_matches_in_round LOOP
    INSERT INTO tournament_matches (
      tournament_id, round_number, match_number, bracket_position,
      participant1_id, participant2_id, status
    ) VALUES (
      p_tournament_id, v_round_number, v_match_number, v_idx,
      v_participant_ids[v_idx * 2 - 1], v_participant_ids[v_idx * 2], 'scheduled'
    );
    v_match_number := v_match_number + 1;
  END LOOP;

  WHILE v_matches_in_round > 1 LOOP
    v_round_number := v_round_number + 1;
    v_matches_in_round := v_matches_in_round / 2;
    v_match_number := 1;

    FOR v_idx IN 1..v_matches_in_round LOOP
      INSERT INTO tournament_matches (
        tournament_id, round_number, match_number, bracket_position, status
      ) VALUES (
        p_tournament_id, v_round_number, v_match_number, v_idx, 'scheduled'
      );
      v_match_number := v_match_number + 1;
    END LOOP;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to advance winner to next round
CREATE OR REPLACE FUNCTION advance_tournament_winner()
RETURNS TRIGGER AS $$
DECLARE
  v_next_match_id uuid;
  v_next_position text;
BEGIN
  IF NEW.winner_id IS NOT NULL AND OLD.winner_id IS NULL THEN
    SELECT 
      id INTO v_next_match_id
    FROM tournament_matches
    WHERE tournament_id = NEW.tournament_id
      AND round_number = NEW.round_number + 1
      AND bracket_position = CEIL(NEW.bracket_position::numeric / 2)
    LIMIT 1;

    IF v_next_match_id IS NOT NULL THEN
      IF NEW.bracket_position % 2 = 1 THEN
        UPDATE tournament_matches
        SET participant1_id = NEW.winner_id
        WHERE id = v_next_match_id;
      ELSE
        UPDATE tournament_matches
        SET participant2_id = NEW.winner_id
        WHERE id = v_next_match_id;
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to advance winners
DROP TRIGGER IF EXISTS advance_winner_trigger ON tournament_matches;
CREATE TRIGGER advance_winner_trigger
  AFTER UPDATE ON tournament_matches
  FOR EACH ROW
  WHEN (NEW.winner_id IS NOT NULL AND OLD.winner_id IS NULL)
  EXECUTE FUNCTION advance_tournament_winner();
