/*
  # Booking Extension & Push Notification System

  1. New Tables
    - `push_notification_tokens`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `token` (text, the device push token)
      - `device_type` (text, ios/android/web)
      - `created_at` (timestamptz)
      - `last_used_at` (timestamptz)
    
    - `booking_notifications`
      - `id` (uuid, primary key)
      - `booking_id` (uuid, references bookings)
      - `notification_type` (text, e.g., 'expiring_soon')
      - `sent_at` (timestamptz)
      - `user_id` (uuid, references profiles)
      - `status` (text, 'pending', 'sent', 'failed')
      - `created_at` (timestamptz)

    - `booking_extensions`
      - `id` (uuid, primary key)
      - `original_booking_id` (uuid, references bookings)
      - `new_booking_id` (uuid, references bookings, nullable)
      - `requested_at` (timestamptz)
      - `status` (text, 'pending', 'approved', 'rejected', 'alternative_offered')
      - `alternative_court_id` (uuid, references courts, nullable)
      - `user_id` (uuid, references profiles)

  2. Security
    - Enable RLS on all tables
    - Users can manage their own push tokens
    - Users can view their own notifications
    - Users can request extensions for their own bookings

  3. Functions
    - Function to find next available court at a specific time
    - Function to check if a booking can be extended on the same court
*/

-- Push notification tokens table
CREATE TABLE IF NOT EXISTS push_notification_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  token text NOT NULL,
  device_type text NOT NULL CHECK (device_type IN ('ios', 'android', 'web')),
  created_at timestamptz DEFAULT now(),
  last_used_at timestamptz DEFAULT now(),
  UNIQUE(user_id, token)
);

ALTER TABLE push_notification_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own push tokens"
  ON push_notification_tokens
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Booking notifications tracking table
CREATE TABLE IF NOT EXISTS booking_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  notification_type text NOT NULL,
  sent_at timestamptz,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE booking_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications"
  ON booking_notifications
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can manage notifications"
  ON booking_notifications
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Booking extensions table
CREATE TABLE IF NOT EXISTS booking_extensions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  original_booking_id uuid NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  new_booking_id uuid REFERENCES bookings(id) ON DELETE SET NULL,
  requested_at timestamptz DEFAULT now(),
  processed_at timestamptz,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'alternative_offered')),
  alternative_court_id uuid REFERENCES courts(id),
  alternative_time timestamptz,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  metadata jsonb DEFAULT '{}'::jsonb
);

ALTER TABLE booking_extensions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own extension requests"
  ON booking_extensions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create extension requests"
  ON booking_extensions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pending extensions"
  ON booking_extensions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id AND status = 'pending')
  WITH CHECK (auth.uid() = user_id);

-- Function to check if a court is available for extension
CREATE OR REPLACE FUNCTION can_extend_booking(
  p_court_id uuid,
  p_end_time timestamptz,
  p_duration_hours numeric
) RETURNS boolean AS $$
DECLARE
  v_new_end_time timestamptz;
  v_conflict_count integer;
BEGIN
  v_new_end_time := p_end_time + (p_duration_hours || ' hours')::interval;
  
  -- Check for conflicting bookings
  SELECT COUNT(*) INTO v_conflict_count
  FROM bookings
  WHERE court_id = p_court_id
    AND status = 'confirmed'
    AND (
      (start_time >= p_end_time AND start_time < v_new_end_time)
      OR (end_time > p_end_time AND end_time <= v_new_end_time)
      OR (start_time <= p_end_time AND end_time >= v_new_end_time)
    );
  
  RETURN v_conflict_count = 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to find nearest available court
CREATE OR REPLACE FUNCTION find_nearest_available_court(
  p_facility_id uuid,
  p_start_time timestamptz,
  p_duration_hours numeric,
  p_exclude_court_id uuid DEFAULT NULL
) RETURNS TABLE (
  court_id uuid,
  court_name text,
  hourly_rate numeric,
  distance_score integer
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id as court_id,
    c.name as court_name,
    c.hourly_rate,
    0 as distance_score
  FROM courts c
  WHERE c.facility_id = p_facility_id
    AND c.status = 'active'
    AND (p_exclude_court_id IS NULL OR c.id != p_exclude_court_id)
    AND NOT EXISTS (
      SELECT 1
      FROM bookings b
      WHERE b.court_id = c.id
        AND b.status = 'confirmed'
        AND (
          (b.start_time >= p_start_time AND b.start_time < p_start_time + (p_duration_hours || ' hours')::interval)
          OR (b.end_time > p_start_time AND b.end_time <= p_start_time + (p_duration_hours || ' hours')::interval)
          OR (b.start_time <= p_start_time AND b.end_time >= p_start_time + (p_duration_hours || ' hours')::interval)
        )
    )
  ORDER BY c.name
  LIMIT 5;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get expiring bookings (to be called by edge function)
CREATE OR REPLACE FUNCTION get_expiring_bookings(
  p_minutes_before integer DEFAULT 5
) RETURNS TABLE (
  booking_id uuid,
  user_id uuid,
  user_email text,
  court_id uuid,
  court_name text,
  facility_id uuid,
  end_time timestamptz,
  can_extend boolean,
  alternative_court_id uuid,
  alternative_court_name text
) AS $$
DECLARE
  v_check_time timestamptz;
BEGIN
  v_check_time := now() + (p_minutes_before || ' minutes')::interval;
  
  RETURN QUERY
  SELECT 
    b.id as booking_id,
    b.user_id,
    p.email as user_email,
    b.court_id,
    c.name as court_name,
    c.facility_id,
    b.end_time,
    can_extend_booking(b.court_id, b.end_time, 1.0) as can_extend,
    alt.court_id as alternative_court_id,
    alt.court_name as alternative_court_name
  FROM bookings b
  JOIN courts c ON c.id = b.court_id
  JOIN profiles p ON p.id = b.user_id
  LEFT JOIN LATERAL (
    SELECT court_id, court_name
    FROM find_nearest_available_court(c.facility_id, b.end_time, 1.0, b.court_id)
    LIMIT 1
  ) alt ON true
  WHERE b.status = 'confirmed'
    AND b.end_time >= now()
    AND b.end_time <= v_check_time
    AND NOT EXISTS (
      SELECT 1 
      FROM booking_notifications bn
      WHERE bn.booking_id = b.id
        AND bn.notification_type = 'expiring_soon'
        AND bn.status = 'sent'
        AND bn.created_at > now() - interval '10 minutes'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_bookings_end_time_status ON bookings(end_time, status) WHERE status = 'confirmed';
CREATE INDEX IF NOT EXISTS idx_booking_notifications_lookup ON booking_notifications(booking_id, notification_type, status);
CREATE INDEX IF NOT EXISTS idx_push_tokens_user ON push_notification_tokens(user_id);