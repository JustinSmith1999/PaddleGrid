/*
  # Booking Enhancement Features

  1. New Tables
    - `recurring_bookings` - Template for recurring court reservations
      - `id` (uuid, PK)
      - `user_id` (uuid, FK)
      - `court_id` (uuid, FK)
      - `day_of_week` (integer) - 0-6 (Sunday-Saturday)
      - `start_time` (time)
      - `duration` (numeric)
      - `start_date` (date)
      - `end_date` (date)
      - `is_active` (boolean)
    
    - `court_alerts` - User alerts for court availability
      - `id` (uuid, PK)
      - `user_id` (uuid, FK)
      - `court_id` (uuid, FK)
      - `desired_date` (date)
      - `desired_start_time` (time)
      - `desired_end_time` (time)
      - `alert_method` (text) - email, push, sms
      - `status` (text) - active, notified, cancelled
    
    - `weather_data` - Cached weather information
      - `id` (uuid, PK)
      - `facility_id` (uuid, FK)
      - `date` (date)
      - `temperature` (numeric)
      - `condition` (text)
      - `precipitation_chance` (integer)
      - `wind_speed` (numeric)
      - `is_suitable_for_play` (boolean)
      - `fetched_at` (timestamptz)
    
    - `booking_packages` - Prepaid court hour packages
      - `id` (uuid, PK)
      - `name` (text)
      - `description` (text)
      - `hours_included` (integer)
      - `price` (numeric)
      - `discount_percent` (numeric)
      - `valid_days` (integer)
      - `is_active` (boolean)
    
    - `user_packages` - User-purchased packages
      - `id` (uuid, PK)
      - `user_id` (uuid, FK)
      - `package_id` (uuid, FK)
      - `hours_remaining` (numeric)
      - `purchase_date` (date)
      - `expiry_date` (date)
      - `status` (text)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Recurring Bookings
CREATE TABLE IF NOT EXISTS recurring_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  court_id uuid REFERENCES courts(id) ON DELETE CASCADE NOT NULL,
  day_of_week integer NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time time NOT NULL,
  duration numeric(4,2) NOT NULL CHECK (duration > 0),
  start_date date NOT NULL,
  end_date date,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CHECK (end_date IS NULL OR end_date > start_date)
);

CREATE INDEX IF NOT EXISTS idx_recurring_bookings_user ON recurring_bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_recurring_bookings_court ON recurring_bookings(court_id);
CREATE INDEX IF NOT EXISTS idx_recurring_bookings_active ON recurring_bookings(is_active);

ALTER TABLE recurring_bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own recurring bookings"
  ON recurring_bookings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own recurring bookings"
  ON recurring_bookings FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all recurring bookings"
  ON recurring_bookings FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Court Alerts
CREATE TABLE IF NOT EXISTS court_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  court_id uuid REFERENCES courts(id) ON DELETE CASCADE,
  desired_date date NOT NULL,
  desired_start_time time NOT NULL,
  desired_end_time time NOT NULL,
  alert_method text DEFAULT 'push' CHECK (alert_method IN ('email', 'push', 'sms')),
  status text DEFAULT 'active' CHECK (status IN ('active', 'notified', 'cancelled', 'expired')),
  created_at timestamptz DEFAULT now(),
  notified_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_court_alerts_user ON court_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_court_alerts_court_date ON court_alerts(court_id, desired_date);
CREATE INDEX IF NOT EXISTS idx_court_alerts_status ON court_alerts(status);

ALTER TABLE court_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own alerts"
  ON court_alerts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own alerts"
  ON court_alerts FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Weather Data
CREATE TABLE IF NOT EXISTS weather_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id uuid REFERENCES facilities(id) ON DELETE CASCADE,
  date date NOT NULL,
  temperature numeric(5,2),
  condition text,
  precipitation_chance integer CHECK (precipitation_chance >= 0 AND precipitation_chance <= 100),
  wind_speed numeric(5,2),
  is_suitable_for_play boolean DEFAULT true,
  fetched_at timestamptz DEFAULT now(),
  UNIQUE(facility_id, date)
);

CREATE INDEX IF NOT EXISTS idx_weather_data_facility_date ON weather_data(facility_id, date);

ALTER TABLE weather_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view weather data"
  ON weather_data FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage weather data"
  ON weather_data FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Booking Packages
CREATE TABLE IF NOT EXISTS booking_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  hours_included integer NOT NULL CHECK (hours_included > 0),
  price numeric(10,2) NOT NULL CHECK (price >= 0),
  discount_percent numeric(5,2) DEFAULT 0 CHECK (discount_percent >= 0 AND discount_percent <= 100),
  valid_days integer DEFAULT 365 CHECK (valid_days > 0),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_booking_packages_active ON booking_packages(is_active);

ALTER TABLE booking_packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active packages"
  ON booking_packages FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Admins can manage packages"
  ON booking_packages FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- User Packages
CREATE TABLE IF NOT EXISTS user_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  package_id uuid REFERENCES booking_packages(id) ON DELETE RESTRICT NOT NULL,
  hours_remaining numeric(10,2) NOT NULL CHECK (hours_remaining >= 0),
  purchase_date date DEFAULT CURRENT_DATE,
  expiry_date date NOT NULL,
  status text DEFAULT 'active' CHECK (status IN ('active', 'expired', 'depleted')),
  stripe_payment_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CHECK (expiry_date > purchase_date)
);

CREATE INDEX IF NOT EXISTS idx_user_packages_user ON user_packages(user_id);
CREATE INDEX IF NOT EXISTS idx_user_packages_status ON user_packages(status);

ALTER TABLE user_packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own packages"
  ON user_packages FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can purchase packages"
  ON user_packages FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all packages"
  ON user_packages FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Insert sample booking packages
INSERT INTO booking_packages (name, description, hours_included, price, discount_percent, valid_days)
VALUES 
  ('10-Hour Pack', 'Perfect for casual players - 10 hours of court time', 10, 80.00, 10, 90),
  ('20-Hour Pack', 'Great value - 20 hours of court time', 20, 150.00, 15, 180),
  ('50-Hour Pack', 'Best deal for serious players - 50 hours of court time', 50, 350.00, 20, 365)
ON CONFLICT DO NOTHING;
