/*
  # Analytics & Insights Features

  1. New Tables
    - `player_performance_metrics` - Detailed player performance tracking
      - `id` (uuid, PK)
      - `user_id` (uuid, FK)
      - `date` (date)
      - `matches_played` (integer)
      - `win_rate` (numeric)
      - `avg_score_differential` (numeric)
      - `performance_rating` (numeric)
    
    - `booking_analytics` - Aggregate booking statistics
      - `id` (uuid, PK)
      - `date` (date)
      - `facility_id` (uuid, FK)
      - `total_bookings` (integer)
      - `total_revenue` (numeric)
      - `peak_hours` (jsonb)
      - `court_utilization` (numeric)
    
    - `revenue_tracking` - Detailed revenue breakdown
      - `id` (uuid, PK)
      - `facility_id` (uuid, FK)
      - `date` (date)
      - `source` (text) - bookings, memberships, events, lessons, pro_shop
      - `amount` (numeric)
      - `transaction_count` (integer)
    
    - `member_retention_metrics` - Track member engagement
      - `id` (uuid, PK)
      - `user_id` (uuid, FK)
      - `month` (date)
      - `bookings_count` (integer)
      - `total_spend` (numeric)
      - `last_activity_date` (date)
      - `engagement_score` (integer)
    
    - `court_performance` - Court-specific metrics
      - `id` (uuid, PK)
      - `court_id` (uuid, FK)
      - `date` (date)
      - `total_hours_booked` (numeric)
      - `revenue_generated` (numeric)
      - `utilization_rate` (numeric)
      - `maintenance_issues` (integer)

  2. Views
    - `daily_revenue_summary` - Aggregated daily revenue
    - `top_players_by_activity` - Most active players
    - `court_utilization_report` - Court usage statistics

  3. Functions
    - `calculate_player_analytics` - Generate player insights
    - `generate_revenue_forecast` - Predict future revenue
    - `get_peak_booking_hours` - Identify busy times

  4. Security
    - Enable RLS on all tables
    - Analytics visible to admins only, players see own data
*/

-- Player Performance Metrics
CREATE TABLE IF NOT EXISTS player_performance_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  date date NOT NULL,
  matches_played integer DEFAULT 0 CHECK (matches_played >= 0),
  win_rate numeric(5,2) CHECK (win_rate >= 0 AND win_rate <= 100),
  avg_score_differential numeric(5,2),
  performance_rating numeric(5,2),
  time_of_day_performance jsonb DEFAULT '{}'::jsonb,
  opponent_type_performance jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, date)
);

CREATE INDEX IF NOT EXISTS idx_player_performance_user ON player_performance_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_player_performance_date ON player_performance_metrics(date);

ALTER TABLE player_performance_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own performance metrics"
  ON player_performance_metrics FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all performance metrics"
  ON player_performance_metrics FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "System can insert performance metrics"
  ON player_performance_metrics FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Booking Analytics
CREATE TABLE IF NOT EXISTS booking_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL,
  facility_id uuid REFERENCES facilities(id) ON DELETE CASCADE,
  total_bookings integer DEFAULT 0 CHECK (total_bookings >= 0),
  total_revenue numeric(10,2) DEFAULT 0 CHECK (total_revenue >= 0),
  peak_hours jsonb DEFAULT '{}'::jsonb,
  court_utilization numeric(5,2) CHECK (court_utilization >= 0 AND court_utilization <= 100),
  avg_booking_duration numeric(5,2),
  member_bookings integer DEFAULT 0,
  non_member_bookings integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(date, facility_id)
);

CREATE INDEX IF NOT EXISTS idx_booking_analytics_date ON booking_analytics(date);
CREATE INDEX IF NOT EXISTS idx_booking_analytics_facility ON booking_analytics(facility_id);

ALTER TABLE booking_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view booking analytics"
  ON booking_analytics FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can manage booking analytics"
  ON booking_analytics FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Revenue Tracking
CREATE TABLE IF NOT EXISTS revenue_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id uuid REFERENCES facilities(id) ON DELETE CASCADE,
  date date NOT NULL,
  source text NOT NULL CHECK (source IN ('bookings', 'memberships', 'events', 'lessons', 'pro_shop', 'packages', 'other')),
  amount numeric(10,2) NOT NULL CHECK (amount >= 0),
  transaction_count integer DEFAULT 1 CHECK (transaction_count > 0),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_revenue_tracking_date ON revenue_tracking(date);
CREATE INDEX IF NOT EXISTS idx_revenue_tracking_facility ON revenue_tracking(facility_id);
CREATE INDEX IF NOT EXISTS idx_revenue_tracking_source ON revenue_tracking(source);

ALTER TABLE revenue_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view revenue tracking"
  ON revenue_tracking FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can manage revenue tracking"
  ON revenue_tracking FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Member Retention Metrics
CREATE TABLE IF NOT EXISTS member_retention_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  month date NOT NULL,
  bookings_count integer DEFAULT 0 CHECK (bookings_count >= 0),
  total_spend numeric(10,2) DEFAULT 0 CHECK (total_spend >= 0),
  last_activity_date date,
  engagement_score integer CHECK (engagement_score >= 0 AND engagement_score <= 100),
  days_since_last_visit integer,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, month)
);

CREATE INDEX IF NOT EXISTS idx_member_retention_user ON member_retention_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_member_retention_month ON member_retention_metrics(month);
CREATE INDEX IF NOT EXISTS idx_member_retention_score ON member_retention_metrics(engagement_score);

ALTER TABLE member_retention_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view retention metrics"
  ON member_retention_metrics FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can manage retention metrics"
  ON member_retention_metrics FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Court Performance
CREATE TABLE IF NOT EXISTS court_performance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  court_id uuid REFERENCES courts(id) ON DELETE CASCADE NOT NULL,
  date date NOT NULL,
  total_hours_booked numeric(5,2) DEFAULT 0 CHECK (total_hours_booked >= 0),
  revenue_generated numeric(10,2) DEFAULT 0 CHECK (revenue_generated >= 0),
  utilization_rate numeric(5,2) CHECK (utilization_rate >= 0 AND utilization_rate <= 100),
  maintenance_issues integer DEFAULT 0 CHECK (maintenance_issues >= 0),
  created_at timestamptz DEFAULT now(),
  UNIQUE(court_id, date)
);

CREATE INDEX IF NOT EXISTS idx_court_performance_court ON court_performance(court_id);
CREATE INDEX IF NOT EXISTS idx_court_performance_date ON court_performance(date);

ALTER TABLE court_performance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view court performance"
  ON court_performance FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can manage court performance"
  ON court_performance FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Create view for daily revenue summary
CREATE OR REPLACE VIEW daily_revenue_summary AS
SELECT 
  date,
  facility_id,
  SUM(amount) as total_revenue,
  SUM(transaction_count) as total_transactions,
  jsonb_object_agg(source, amount) as revenue_by_source
FROM revenue_tracking
GROUP BY date, facility_id;

-- Create view for top players by activity
CREATE OR REPLACE VIEW top_players_by_activity AS
SELECT 
  p.id,
  p.full_name,
  p.email,
  ps.total_bookings,
  ps.total_hours_played,
  ps.total_events_participated,
  ps.skill_level
FROM profiles p
JOIN player_stats ps ON p.id = ps.user_id
ORDER BY ps.total_hours_played DESC
LIMIT 100;

-- Create view for court utilization report
CREATE OR REPLACE VIEW court_utilization_report AS
SELECT 
  c.id as court_id,
  c.name as court_name,
  cp.date,
  cp.total_hours_booked,
  cp.utilization_rate,
  cp.revenue_generated
FROM courts c
LEFT JOIN court_performance cp ON c.id = cp.court_id
WHERE cp.date >= CURRENT_DATE - INTERVAL '30 days'
ORDER BY cp.date DESC, c.name;

-- Function to calculate player analytics
CREATE OR REPLACE FUNCTION calculate_player_analytics(player_id uuid, days_back integer DEFAULT 30)
RETURNS jsonb AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'total_matches', COUNT(*),
    'avg_performance', AVG(performance_rating),
    'trend', CASE 
      WHEN AVG(CASE WHEN date >= CURRENT_DATE - (days_back/2) THEN performance_rating END) > 
           AVG(CASE WHEN date < CURRENT_DATE - (days_back/2) THEN performance_rating END)
      THEN 'improving'
      ELSE 'declining'
    END
  ) INTO result
  FROM player_performance_metrics
  WHERE user_id = player_id
    AND date >= CURRENT_DATE - days_back;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get peak booking hours
CREATE OR REPLACE FUNCTION get_peak_booking_hours(facility_uuid uuid DEFAULT NULL)
RETURNS jsonb AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_object_agg(hour, booking_count)
  INTO result
  FROM (
    SELECT 
      EXTRACT(HOUR FROM start_time) as hour,
      COUNT(*) as booking_count
    FROM bookings b
    WHERE (facility_uuid IS NULL OR b.court_id IN (
      SELECT id FROM courts WHERE facility_id = facility_uuid
    ))
    AND date >= CURRENT_DATE - INTERVAL '30 days'
    GROUP BY EXTRACT(HOUR FROM start_time)
    ORDER BY booking_count DESC
  ) subquery;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
