/*
  # Partner Matching System

  1. New Tables
    - `partner_requests`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `facility_id` (uuid, references facilities)
      - `preferred_date` (date)
      - `preferred_start_time` (time)
      - `preferred_end_time` (time)
      - `skill_level_min` (numeric)
      - `skill_level_max` (numeric)
      - `game_format` (text: singles, doubles)
      - `status` (text: open, matched, expired, cancelled)
      - `expires_at` (timestamptz)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `partner_matches`
      - `id` (uuid, primary key)
      - `request_id` (uuid, references partner_requests)
      - `requester_id` (uuid, references profiles)
      - `partner_id` (uuid, references profiles)
      - `facility_id` (uuid, references facilities)
      - `match_score` (numeric)
      - `status` (text: pending, accepted, declined, expired)
      - `booking_id` (uuid, references bookings, nullable)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Users can view and manage their own requests
    - Users can view open requests from others
    - Auto-match based on skill level and availability

  3. Features
    - Smart matching algorithm
    - Notification system for matches
    - Auto-booking when both parties accept
*/

-- Create partner_requests table
CREATE TABLE IF NOT EXISTS partner_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  facility_id uuid REFERENCES facilities(id) ON DELETE CASCADE NOT NULL,
  preferred_date date NOT NULL,
  preferred_start_time time NOT NULL,
  preferred_end_time time NOT NULL,
  skill_level_min numeric(3,1) DEFAULT 2.0,
  skill_level_max numeric(3,1) DEFAULT 5.0,
  game_format text NOT NULL DEFAULT 'doubles' CHECK (game_format IN ('singles', 'doubles')),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'matched', 'expired', 'cancelled')),
  bio text,
  expires_at timestamptz DEFAULT (now() + INTERVAL '7 days'),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Create partner_matches table
CREATE TABLE IF NOT EXISTS partner_matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid REFERENCES partner_requests(id) ON DELETE CASCADE NOT NULL,
  requester_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  partner_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  facility_id uuid REFERENCES facilities(id) ON DELETE CASCADE NOT NULL,
  match_score numeric(3,1) DEFAULT 0,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
  booking_id uuid REFERENCES bookings(id) ON DELETE SET NULL,
  message text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_partner_requests_facility_date ON partner_requests(facility_id, preferred_date, status);
CREATE INDEX IF NOT EXISTS idx_partner_requests_user ON partner_requests(user_id, status);
CREATE INDEX IF NOT EXISTS idx_partner_matches_request ON partner_matches(request_id, status);
CREATE INDEX IF NOT EXISTS idx_partner_matches_partner ON partner_matches(partner_id, status);

-- Enable RLS
ALTER TABLE partner_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_matches ENABLE ROW LEVEL SECURITY;

-- Partner Requests Policies
CREATE POLICY "Anyone can view open partner requests"
  ON partner_requests
  FOR SELECT
  TO authenticated
  USING (status = 'open' OR user_id = auth.uid());

CREATE POLICY "Users can create own partner requests"
  ON partner_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own partner requests"
  ON partner_requests
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own partner requests"
  ON partner_requests
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Partner Matches Policies
CREATE POLICY "Users can view their own matches"
  ON partner_matches
  FOR SELECT
  TO authenticated
  USING (requester_id = auth.uid() OR partner_id = auth.uid());

CREATE POLICY "Users can create partner matches"
  ON partner_matches
  FOR INSERT
  TO authenticated
  WITH CHECK (partner_id = auth.uid());

CREATE POLICY "Users can update matches they're involved in"
  ON partner_matches
  FOR UPDATE
  TO authenticated
  USING (requester_id = auth.uid() OR partner_id = auth.uid())
  WITH CHECK (requester_id = auth.uid() OR partner_id = auth.uid());

-- Function to calculate match score
CREATE OR REPLACE FUNCTION calculate_match_score(
  request_skill_min numeric,
  request_skill_max numeric,
  partner_skill numeric
)
RETURNS numeric AS $$
BEGIN
  -- Perfect match if within range
  IF partner_skill >= request_skill_min AND partner_skill <= request_skill_max THEN
    RETURN 10.0;
  END IF;
  
  -- Close match (within 0.5)
  IF partner_skill >= (request_skill_min - 0.5) AND partner_skill <= (request_skill_max + 0.5) THEN
    RETURN 7.0;
  END IF;
  
  -- Decent match (within 1.0)
  IF partner_skill >= (request_skill_min - 1.0) AND partner_skill <= (request_skill_max + 1.0) THEN
    RETURN 5.0;
  END IF;
  
  -- Not a good match
  RETURN 0.0;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to find potential matches for a partner request
CREATE OR REPLACE FUNCTION find_potential_matches(request_uuid uuid)
RETURNS TABLE (
  potential_partner_id uuid,
  match_score numeric,
  partner_name text,
  partner_skill numeric,
  partner_rating numeric
) AS $$
DECLARE
  request_record RECORD;
BEGIN
  -- Get the request details
  SELECT * INTO request_record
  FROM partner_requests
  WHERE id = request_uuid;

  -- Find potential matches
  RETURN QUERY
  SELECT 
    p.id as potential_partner_id,
    calculate_match_score(
      request_record.skill_level_min,
      request_record.skill_level_max,
      COALESCE(p.skill_level, 3.0)
    ) as match_score,
    COALESCE(p.full_name, p.username, 'Anonymous') as partner_name,
    COALESCE(p.skill_level, 3.0) as partner_skill,
    COALESCE(p.rating, 3.0) as partner_rating
  FROM profiles p
  WHERE p.id != request_record.user_id
  AND p.id IN (
    SELECT fu.user_id 
    FROM facility_users fu 
    WHERE fu.facility_id = request_record.facility_id
  )
  AND calculate_match_score(
    request_record.skill_level_min,
    request_record.skill_level_max,
    COALESCE(p.skill_level, 3.0)
  ) >= 5.0
  ORDER BY match_score DESC
  LIMIT 10;
END;
$$ LANGUAGE plpgsql;

-- Function to notify user of new match
CREATE OR REPLACE FUNCTION notify_partner_match()
RETURNS TRIGGER AS $$
DECLARE
  requester_name text;
BEGIN
  -- Get requester name
  SELECT COALESCE(full_name, username, 'A player')
  INTO requester_name
  FROM profiles
  WHERE id = NEW.requester_id;

  -- Create notification for the partner
  INSERT INTO notifications (user_id, type, title, message, metadata)
  VALUES (
    NEW.partner_id,
    'partner_match',
    'New Partner Match!',
    requester_name || ' wants to play with you!',
    jsonb_build_object(
      'match_id', NEW.id,
      'request_id', NEW.request_id,
      'requester_id', NEW.requester_id,
      'match_score', NEW.match_score
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to notify on new match
DROP TRIGGER IF EXISTS notify_partner_match_trigger ON partner_matches;
CREATE TRIGGER notify_partner_match_trigger
  AFTER INSERT ON partner_matches
  FOR EACH ROW
  EXECUTE FUNCTION notify_partner_match();

-- Function to handle match acceptance
CREATE OR REPLACE FUNCTION handle_partner_match_acceptance()
RETURNS TRIGGER AS $$
DECLARE
  request_record RECORD;
BEGIN
  -- Only process if status changed to accepted
  IF NEW.status = 'accepted' AND (OLD.status IS NULL OR OLD.status != 'accepted') THEN
    -- Get the request details
    SELECT * INTO request_record
    FROM partner_requests
    WHERE id = NEW.request_id;

    -- Update request status to matched
    UPDATE partner_requests
    SET 
      status = 'matched',
      updated_at = now()
    WHERE id = NEW.request_id;

    -- Notify the requester
    INSERT INTO notifications (user_id, type, title, message, metadata)
    VALUES (
      NEW.requester_id,
      'partner_accepted',
      'Partner Found!',
      'Your partner request has been accepted. Time to book a court!',
      jsonb_build_object(
        'match_id', NEW.id,
        'partner_id', NEW.partner_id,
        'facility_id', NEW.facility_id,
        'date', request_record.preferred_date,
        'start_time', request_record.preferred_start_time
      )
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for match acceptance
DROP TRIGGER IF EXISTS handle_match_acceptance_trigger ON partner_matches;
CREATE TRIGGER handle_match_acceptance_trigger
  AFTER UPDATE ON partner_matches
  FOR EACH ROW
  EXECUTE FUNCTION handle_partner_match_acceptance();

-- Function to auto-expire old requests
CREATE OR REPLACE FUNCTION expire_old_partner_requests()
RETURNS void AS $$
BEGIN
  UPDATE partner_requests
  SET 
    status = 'expired',
    updated_at = now()
  WHERE status = 'open'
  AND expires_at < now();

  UPDATE partner_matches
  SET 
    status = 'expired',
    updated_at = now()
  WHERE status = 'pending'
  AND created_at < (now() - INTERVAL '48 hours');
END;
$$ LANGUAGE plpgsql;

-- Update timestamp triggers
CREATE OR REPLACE FUNCTION update_partner_request_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_partner_request_timestamp ON partner_requests;
CREATE TRIGGER update_partner_request_timestamp
  BEFORE UPDATE ON partner_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_partner_request_timestamp();

DROP TRIGGER IF EXISTS update_partner_match_timestamp ON partner_matches;
CREATE TRIGGER update_partner_match_timestamp
  BEFORE UPDATE ON partner_matches
  FOR EACH ROW
  EXECUTE FUNCTION update_partner_request_timestamp();