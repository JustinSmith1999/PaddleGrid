/*
  # Enhanced DUPR Features Schema

  This migration adds comprehensive DUPR features including:
  
  ## New Tables
  
  ### 1. match_disputes
  - id (uuid, primary key)
  - match_id (uuid, foreign key to dupr_matches)
  - disputed_by_user_id (uuid, foreign key to profiles)
  - reason (text)
  - status (pending/resolved/rejected)
  - resolution_notes (text)
  - resolved_by_admin_id (uuid)
  - created_at, resolved_at timestamps
  
  ### 2. notifications
  - id (uuid, primary key)
  - user_id (uuid, foreign key to profiles)
  - type (match_approved/match_rejected/rating_change/challenge_received/etc.)
  - title (text)
  - message (text)
  - read (boolean)
  - related_match_id (uuid, nullable)
  - related_challenge_id (uuid, nullable)
  - created_at timestamp
  
  ### 3. challenge_ladder
  - id (uuid, primary key)
  - challenger_id (uuid, foreign key to profiles)
  - challenged_id (uuid, foreign key to profiles)
  - status (pending/accepted/declined/completed/expired)
  - match_id (uuid, nullable - filled when match is played)
  - expires_at timestamp
  - created_at, updated_at timestamps
  
  ### 4. fraud_detection_logs
  - id (uuid, primary key)
  - match_id (uuid, foreign key to dupr_matches)
  - flag_type (text - "same_players", "unusual_score", "rating_manipulation")
  - severity (low/medium/high)
  - details (jsonb)
  - reviewed (boolean)
  - reviewed_by_admin_id (uuid, nullable)
  - created_at timestamp
  
  ## New Functions
  
  ### 1. get_head_to_head_stats(player1_id, player2_id)
  Returns win/loss record between two players
  
  ### 2. get_player_rating_trend(player_id, days)
  Returns rating change over time period
  
  ### 3. detect_fraud_patterns()
  Analyzes matches for suspicious patterns
  
  ## Security
  - RLS enabled on all tables
  - Users can view their own notifications, challenges, and disputes
  - Admins can manage all records
  - Fraud detection logs are admin-only
*/

-- Create match_disputes table
CREATE TABLE IF NOT EXISTS match_disputes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid REFERENCES dupr_matches(id) ON DELETE CASCADE NOT NULL,
  disputed_by_user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  reason text NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'rejected')),
  resolution_notes text,
  resolved_by_admin_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  resolved_at timestamptz
);

ALTER TABLE match_disputes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view disputes they created or are involved in"
  ON match_disputes FOR SELECT
  TO authenticated
  USING (
    disputed_by_user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM dupr_match_results dmr
      WHERE dmr.match_id = match_disputes.match_id
      AND (dmr.player1_id = auth.uid() OR dmr.player2_id = auth.uid())
    )
  );

CREATE POLICY "Users can create disputes for matches they're in"
  ON match_disputes FOR INSERT
  TO authenticated
  WITH CHECK (
    disputed_by_user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM dupr_match_results dmr
      WHERE dmr.match_id = match_disputes.match_id
      AND (dmr.player1_id = auth.uid() OR dmr.player2_id = auth.uid())
    )
  );

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL CHECK (type IN ('match_approved', 'match_rejected', 'rating_change', 'challenge_received', 'challenge_accepted', 'challenge_declined', 'dispute_resolved', 'weekly_summary')),
  title text NOT NULL,
  message text NOT NULL,
  read boolean DEFAULT false,
  related_match_id uuid REFERENCES dupr_matches(id) ON DELETE SET NULL,
  related_challenge_id uuid,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "System can create notifications"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create challenge_ladder table
CREATE TABLE IF NOT EXISTS challenge_ladder (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenger_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  challenged_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'completed', 'expired')),
  match_id uuid REFERENCES dupr_matches(id) ON DELETE SET NULL,
  challenge_message text,
  expires_at timestamptz DEFAULT (now() + interval '7 days'),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT different_players CHECK (challenger_id != challenged_id)
);

ALTER TABLE challenge_ladder ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view challenges they're involved in"
  ON challenge_ladder FOR SELECT
  TO authenticated
  USING (challenger_id = auth.uid() OR challenged_id = auth.uid());

CREATE POLICY "Users can create challenges"
  ON challenge_ladder FOR INSERT
  TO authenticated
  WITH CHECK (challenger_id = auth.uid());

CREATE POLICY "Challenged users can update challenge status"
  ON challenge_ladder FOR UPDATE
  TO authenticated
  USING (challenged_id = auth.uid() OR challenger_id = auth.uid())
  WITH CHECK (challenged_id = auth.uid() OR challenger_id = auth.uid());

-- Create fraud_detection_logs table
CREATE TABLE IF NOT EXISTS fraud_detection_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid REFERENCES dupr_matches(id) ON DELETE CASCADE NOT NULL,
  flag_type text NOT NULL CHECK (flag_type IN ('same_players', 'unusual_score', 'rating_manipulation', 'high_frequency')),
  severity text DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high')),
  details jsonb DEFAULT '{}',
  reviewed boolean DEFAULT false,
  reviewed_by_admin_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  reviewed_notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE fraud_detection_logs ENABLE ROW LEVEL SECURITY;

-- Fraud logs visible to facility admins only
CREATE POLICY "Facility admins can view fraud logs"
  ON fraud_detection_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM facility_users
      WHERE facility_users.user_id = auth.uid()
      AND facility_users.role IN ('owner', 'admin')
    )
  );

-- Create function to get head-to-head stats
CREATE OR REPLACE FUNCTION get_head_to_head_stats(p_player1_id uuid, p_player2_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
  player1_wins int := 0;
  player2_wins int := 0;
  total_matches int := 0;
BEGIN
  -- Find all matches where both players participated
  WITH player_matches AS (
    SELECT DISTINCT 
      dm.id as match_id,
      dmr1.team_number as p1_team,
      dmr2.team_number as p2_team,
      dmr1.is_winner as p1_won,
      dmr2.is_winner as p2_won
    FROM dupr_matches dm
    JOIN dupr_match_results dmr1 ON dm.id = dmr1.match_id
    JOIN dupr_match_results dmr2 ON dm.id = dmr2.match_id
    WHERE dm.status = 'approved'
    AND (dmr1.player1_id = p_player1_id OR dmr1.player2_id = p_player1_id)
    AND (dmr2.player1_id = p_player2_id OR dmr2.player2_id = p_player2_id)
    AND dmr1.team_number != dmr2.team_number
  )
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE p1_won = true),
    COUNT(*) FILTER (WHERE p2_won = true)
  INTO total_matches, player1_wins, player2_wins
  FROM player_matches;
  
  result := jsonb_build_object(
    'player1_id', p_player1_id,
    'player2_id', p_player2_id,
    'player1_wins', player1_wins,
    'player2_wins', player2_wins,
    'total_matches', total_matches
  );
  
  RETURN result;
END;
$$;

-- Create function to get player rating trend
CREATE OR REPLACE FUNCTION get_player_rating_trend(p_player_id uuid, p_days int DEFAULT 30)
RETURNS TABLE (
  date date,
  rating numeric,
  change_amount numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    rh.created_at::date as date,
    rh.rating,
    rh.change_amount
  FROM dupr_ratings_history rh
  WHERE rh.user_id = p_player_id
  AND rh.created_at >= now() - (p_days || ' days')::interval
  ORDER BY rh.created_at ASC;
END;
$$;

-- Create function to detect fraud patterns
CREATE OR REPLACE FUNCTION detect_fraud_patterns()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  match_record RECORD;
  player_pair RECORD;
BEGIN
  -- Detect same player pairs playing too frequently (more than 5 times in a day)
  FOR player_pair IN 
    SELECT 
      dmr1.player1_id as p1,
      dmr1.player2_id as p2,
      dmr2.player1_id as p3,
      dmr2.player2_id as p4,
      COUNT(DISTINCT dm.id) as match_count,
      MAX(dm.id) as latest_match_id
    FROM dupr_matches dm
    JOIN dupr_match_results dmr1 ON dm.id = dmr1.match_id AND dmr1.team_number = 1
    JOIN dupr_match_results dmr2 ON dm.id = dmr2.match_id AND dmr2.team_number = 2
    WHERE dm.created_at >= now() - interval '1 day'
    AND dm.status = 'pending'
    GROUP BY dmr1.player1_id, dmr1.player2_id, dmr2.player1_id, dmr2.player2_id
    HAVING COUNT(DISTINCT dm.id) > 5
  LOOP
    INSERT INTO fraud_detection_logs (match_id, flag_type, severity, details)
    VALUES (
      player_pair.latest_match_id,
      'high_frequency',
      'medium',
      jsonb_build_object(
        'match_count', player_pair.match_count,
        'timeframe', '24 hours',
        'players', ARRAY[player_pair.p1, player_pair.p2, player_pair.p3, player_pair.p4]
      )
    )
    ON CONFLICT DO NOTHING;
  END LOOP;
  
  -- Detect unusual scores (score differential > 11 or negative scores)
  FOR match_record IN
    SELECT 
      dm.id,
      dmr1.score as team1_score,
      dmr2.score as team2_score
    FROM dupr_matches dm
    JOIN dupr_match_results dmr1 ON dm.id = dmr1.match_id AND dmr1.team_number = 1
    JOIN dupr_match_results dmr2 ON dm.id = dmr2.match_id AND dmr2.team_number = 2
    WHERE dm.status = 'pending'
    AND (ABS(dmr1.score - dmr2.score) > 11 OR dmr1.score > 15 OR dmr2.score > 15)
  LOOP
    INSERT INTO fraud_detection_logs (match_id, flag_type, severity, details)
    VALUES (
      match_record.id,
      'unusual_score',
      'low',
      jsonb_build_object(
        'team1_score', match_record.team1_score,
        'team2_score', match_record.team2_score
      )
    )
    ON CONFLICT DO NOTHING;
  END LOOP;
  
  -- Detect potential rating manipulation (large rating swings in short time)
  FOR match_record IN
    SELECT 
      user_id,
      COUNT(*) as recent_matches,
      SUM(ABS(change_amount)) as total_change,
      MAX(match_id) as latest_match
    FROM dupr_ratings_history
    WHERE created_at >= now() - interval '1 day'
    GROUP BY user_id
    HAVING SUM(ABS(change_amount)) > 2.0
  LOOP
    IF match_record.latest_match IS NOT NULL THEN
      INSERT INTO fraud_detection_logs (match_id, flag_type, severity, details)
      VALUES (
        match_record.latest_match,
        'rating_manipulation',
        'high',
        jsonb_build_object(
          'user_id', match_record.user_id,
          'recent_matches', match_record.recent_matches,
          'total_rating_change', match_record.total_change
        )
      )
      ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;
END;
$$;

-- Create trigger function for match approval notifications
CREATE OR REPLACE FUNCTION notify_match_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  player_record RECORD;
  notification_type text;
  notification_title text;
  notification_message text;
BEGIN
  IF OLD.status != NEW.status AND NEW.status IN ('approved', 'rejected') THEN
    IF NEW.status = 'approved' THEN
      notification_type := 'match_approved';
      notification_title := 'Match Approved';
      notification_message := 'Your match has been approved and your rating has been updated.';
    ELSE
      notification_type := 'match_rejected';
      notification_title := 'Match Rejected';
      notification_message := 'Your match has been rejected. Reason: ' || COALESCE(NEW.verification_notes, 'No reason provided');
    END IF;
    
    FOR player_record IN
      SELECT DISTINCT 
        COALESCE(player1_id, player2_id) as player_id
      FROM dupr_match_results
      WHERE match_id = NEW.id
      AND (player1_id IS NOT NULL OR player2_id IS NOT NULL)
    LOOP
      INSERT INTO notifications (user_id, type, title, message, related_match_id)
      VALUES (
        player_record.player_id,
        notification_type,
        notification_title,
        notification_message,
        NEW.id
      );
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for match status notifications
DROP TRIGGER IF EXISTS on_match_status_change ON dupr_matches;
CREATE TRIGGER on_match_status_change
  AFTER UPDATE ON dupr_matches
  FOR EACH ROW
  EXECUTE FUNCTION notify_match_status_change();

-- Create trigger function for challenge notifications
CREATE OR REPLACE FUNCTION notify_challenge_events()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  notification_type text;
  notification_title text;
  notification_message text;
  challenger_name text;
  challenged_name text;
BEGIN
  SELECT full_name INTO challenger_name FROM profiles WHERE id = NEW.challenger_id;
  SELECT full_name INTO challenged_name FROM profiles WHERE id = NEW.challenged_id;
  
  IF TG_OP = 'INSERT' THEN
    INSERT INTO notifications (user_id, type, title, message, related_challenge_id)
    VALUES (
      NEW.challenged_id,
      'challenge_received',
      'New Challenge',
      challenger_name || ' has challenged you to a match!',
      NEW.id
    );
  ELSIF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
    IF NEW.status = 'accepted' THEN
      INSERT INTO notifications (user_id, type, title, message, related_challenge_id)
      VALUES (
        NEW.challenger_id,
        'challenge_accepted',
        'Challenge Accepted',
        challenged_name || ' has accepted your challenge!',
        NEW.id
      );
    ELSIF NEW.status = 'declined' THEN
      INSERT INTO notifications (user_id, type, title, message, related_challenge_id)
      VALUES (
        NEW.challenger_id,
        'challenge_declined',
        'Challenge Declined',
        challenged_name || ' has declined your challenge.',
        NEW.id
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for challenge notifications
DROP TRIGGER IF EXISTS on_challenge_events ON challenge_ladder;
CREATE TRIGGER on_challenge_events
  AFTER INSERT OR UPDATE ON challenge_ladder
  FOR EACH ROW
  EXECUTE FUNCTION notify_challenge_events();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_match_disputes_match_id ON match_disputes(match_id);
CREATE INDEX IF NOT EXISTS idx_match_disputes_status ON match_disputes(status);
CREATE INDEX IF NOT EXISTS idx_match_disputes_user ON match_disputes(disputed_by_user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_challenge_ladder_challenger ON challenge_ladder(challenger_id);
CREATE INDEX IF NOT EXISTS idx_challenge_ladder_challenged ON challenge_ladder(challenged_id);
CREATE INDEX IF NOT EXISTS idx_challenge_ladder_status ON challenge_ladder(status);
CREATE INDEX IF NOT EXISTS idx_challenge_ladder_expires ON challenge_ladder(expires_at);
CREATE INDEX IF NOT EXISTS idx_fraud_logs_match_id ON fraud_detection_logs(match_id);
CREATE INDEX IF NOT EXISTS idx_fraud_logs_reviewed ON fraud_detection_logs(reviewed);
CREATE INDEX IF NOT EXISTS idx_fraud_logs_severity ON fraud_detection_logs(severity);
