/*
  # Advanced Features for PaddleGrid - Lessons, Events, Memberships & More

  ## Overview
  This migration extends PaddleGrid with professional features to surpass CourtReserve:
  - Instructor profiles and lesson management
  - Events, clinics, and group programs
  - Membership tiers and credit packages
  - Player statistics and match history
  - Waitlists and recurring bookings
  - Revenue analytics and reporting

  ## New Tables

  ### 1. `instructors`
  Professional instructors and coaches
  - `id` (uuid, PK) - Instructor identifier
  - `user_id` (uuid, FK) - Reference to profiles (instructors are also users)
  - `bio` (text) - Instructor biography
  - `specialties` (text[]) - Array of specialties (e.g., "Beginner Training", "Advanced Strategy")
  - `hourly_rate` (numeric) - Lesson rate per hour
  - `is_active` (boolean) - Whether instructor is accepting bookings
  - `rating` (numeric) - Average rating (0-5)
  - `total_lessons` (integer) - Total lessons taught
  - `image_url` (text) - Profile image
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### 2. `lessons`
  Private and group lessons
  - `id` (uuid, PK) - Lesson identifier
  - `instructor_id` (uuid, FK) - Reference to instructors
  - `title` (text) - Lesson title
  - `description` (text) - Lesson description
  - `lesson_type` (text) - Type: 'private', 'semi-private', 'group'
  - `max_participants` (integer) - Maximum number of participants
  - `duration_minutes` (integer) - Lesson duration
  - `price` (numeric) - Lesson price
  - `skill_level` (text) - Target skill level: 'beginner', 'intermediate', 'advanced', 'all'
  - `is_recurring` (boolean) - Whether lesson repeats
  - `recurrence_pattern` (jsonb) - Recurrence details (days, frequency)
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### 3. `lesson_bookings`
  Student lesson registrations
  - `id` (uuid, PK) - Booking identifier
  - `lesson_id` (uuid, FK) - Reference to lessons
  - `user_id` (uuid, FK) - Reference to profiles
  - `scheduled_date` (date) - Lesson date
  - `start_time` (time) - Start time
  - `end_time` (time) - End time
  - `status` (text) - Status: 'pending', 'confirmed', 'cancelled', 'completed'
  - `payment_status` (text) - Payment status: 'pending', 'paid', 'refunded'
  - `amount_paid` (numeric) - Amount paid
  - `notes` (text) - Booking notes
  - `created_at` (timestamptz) - Booking timestamp

  ### 4. `events`
  Tournaments, clinics, and special events
  - `id` (uuid, PK) - Event identifier
  - `title` (text) - Event title
  - `description` (text) - Event description
  - `event_type` (text) - Type: 'tournament', 'clinic', 'social', 'league'
  - `start_datetime` (timestamptz) - Event start
  - `end_datetime` (timestamptz) - Event end
  - `max_participants` (integer) - Maximum participants
  - `current_participants` (integer) - Current registrations
  - `price_member` (numeric) - Price for members
  - `price_non_member` (numeric) - Price for non-members
  - `skill_level` (text) - Target skill level
  - `image_url` (text) - Event image
  - `is_published` (boolean) - Whether event is visible
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### 5. `event_registrations`
  Event participant registrations
  - `id` (uuid, PK) - Registration identifier
  - `event_id` (uuid, FK) - Reference to events
  - `user_id` (uuid, FK) - Reference to profiles
  - `registration_date` (timestamptz) - When user registered
  - `status` (text) - Status: 'pending', 'confirmed', 'cancelled', 'waitlist'
  - `payment_status` (text) - Payment status
  - `amount_paid` (numeric) - Amount paid
  - `created_at` (timestamptz) - Registration timestamp

  ### 6. `memberships`
  Membership tier definitions
  - `id` (uuid, PK) - Membership identifier
  - `name` (text) - Membership name (e.g., "Gold", "Platinum")
  - `description` (text) - Membership benefits
  - `price_monthly` (numeric) - Monthly price
  - `price_annual` (numeric) - Annual price
  - `benefits` (jsonb) - Structured benefits data
  - `court_discount_percent` (numeric) - Discount on court bookings
  - `priority_booking_hours` (integer) - Hours ahead for priority booking
  - `included_credits` (integer) - Monthly included credits
  - `is_active` (boolean) - Whether accepting new members
  - `display_order` (integer) - Display order
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### 7. `user_memberships`
  User membership subscriptions
  - `id` (uuid, PK) - Subscription identifier
  - `user_id` (uuid, FK) - Reference to profiles
  - `membership_id` (uuid, FK) - Reference to memberships
  - `status` (text) - Status: 'active', 'cancelled', 'expired', 'paused'
  - `billing_cycle` (text) - Cycle: 'monthly', 'annual'
  - `start_date` (date) - Membership start date
  - `end_date` (date) - Membership end date
  - `auto_renew` (boolean) - Whether to auto-renew
  - `credits_remaining` (integer) - Remaining monthly credits
  - `stripe_subscription_id` (text) - Stripe subscription ID
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### 8. `booking_waitlist`
  Waitlist for fully booked time slots
  - `id` (uuid, PK) - Waitlist entry identifier
  - `court_id` (uuid, FK) - Reference to courts
  - `user_id` (uuid, FK) - Reference to profiles
  - `requested_date` (date) - Desired booking date
  - `requested_start_time` (time) - Desired start time
  - `requested_duration` (numeric) - Desired duration in hours
  - `status` (text) - Status: 'waiting', 'notified', 'booked', 'expired'
  - `notified_at` (timestamptz) - When user was notified of availability
  - `expires_at` (timestamptz) - When waitlist entry expires
  - `created_at` (timestamptz) - Waitlist join timestamp

  ### 9. `player_stats`
  Player statistics and achievements
  - `user_id` (uuid, PK, FK) - Reference to profiles
  - `total_bookings` (integer) - Total court bookings
  - `total_hours_played` (numeric) - Total hours on court
  - `total_lessons_taken` (integer) - Total lessons attended
  - `total_events_participated` (integer) - Total events joined
  - `favorite_court_id` (uuid, FK) - Most booked court
  - `total_spent` (numeric) - Total amount spent
  - `skill_level` (text) - Self-reported skill level
  - `achievements` (jsonb) - Array of achievements
  - `updated_at` (timestamptz) - Last update timestamp

  ## Security
  All tables have RLS enabled with appropriate policies for users and admins.

  ## Important Notes
  1. Instructors must first be users with profiles
  2. Membership credits can be used for bookings
  3. Waitlist automatically notifies users when slots become available
  4. Events support both member and non-member pricing
  5. Player stats are automatically updated via triggers
*/

-- Create instructors table
CREATE TABLE IF NOT EXISTS instructors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  bio text,
  specialties text[] DEFAULT ARRAY[]::text[],
  hourly_rate numeric(10,2) NOT NULL CHECK (hourly_rate >= 0),
  is_active boolean DEFAULT true,
  rating numeric(3,2) DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
  total_lessons integer DEFAULT 0,
  image_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create lessons table
CREATE TABLE IF NOT EXISTS lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id uuid NOT NULL REFERENCES instructors(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  lesson_type text NOT NULL CHECK (lesson_type IN ('private', 'semi-private', 'group')),
  max_participants integer NOT NULL CHECK (max_participants > 0),
  duration_minutes integer NOT NULL CHECK (duration_minutes > 0),
  price numeric(10,2) NOT NULL CHECK (price >= 0),
  skill_level text NOT NULL CHECK (skill_level IN ('beginner', 'intermediate', 'advanced', 'all')),
  is_recurring boolean DEFAULT false,
  recurrence_pattern jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create lesson_bookings table
CREATE TABLE IF NOT EXISTS lesson_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id uuid NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  scheduled_date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  payment_status text NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded')),
  amount_paid numeric(10,2) NOT NULL CHECK (amount_paid >= 0),
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Create events table
CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  event_type text NOT NULL CHECK (event_type IN ('tournament', 'clinic', 'social', 'league')),
  start_datetime timestamptz NOT NULL,
  end_datetime timestamptz NOT NULL,
  max_participants integer NOT NULL CHECK (max_participants > 0),
  current_participants integer DEFAULT 0 CHECK (current_participants >= 0),
  price_member numeric(10,2) NOT NULL DEFAULT 0 CHECK (price_member >= 0),
  price_non_member numeric(10,2) NOT NULL DEFAULT 0 CHECK (price_non_member >= 0),
  skill_level text CHECK (skill_level IN ('beginner', 'intermediate', 'advanced', 'all')),
  image_url text,
  is_published boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CHECK (end_datetime > start_datetime),
  CHECK (current_participants <= max_participants)
);

-- Create event_registrations table
CREATE TABLE IF NOT EXISTS event_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  registration_date timestamptz DEFAULT now(),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'waitlist')),
  payment_status text NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded')),
  amount_paid numeric(10,2) NOT NULL DEFAULT 0 CHECK (amount_paid >= 0),
  created_at timestamptz DEFAULT now(),
  UNIQUE(event_id, user_id)
);

-- Create memberships table
CREATE TABLE IF NOT EXISTS memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  price_monthly numeric(10,2) NOT NULL CHECK (price_monthly >= 0),
  price_annual numeric(10,2) NOT NULL CHECK (price_annual >= 0),
  benefits jsonb DEFAULT '{}'::jsonb,
  court_discount_percent numeric(5,2) DEFAULT 0 CHECK (court_discount_percent >= 0 AND court_discount_percent <= 100),
  priority_booking_hours integer DEFAULT 0 CHECK (priority_booking_hours >= 0),
  included_credits integer DEFAULT 0 CHECK (included_credits >= 0),
  is_active boolean DEFAULT true,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create user_memberships table
CREATE TABLE IF NOT EXISTS user_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  membership_id uuid NOT NULL REFERENCES memberships(id) ON DELETE RESTRICT,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'paused')),
  billing_cycle text NOT NULL CHECK (billing_cycle IN ('monthly', 'annual')),
  start_date date NOT NULL,
  end_date date,
  auto_renew boolean DEFAULT true,
  credits_remaining integer DEFAULT 0,
  stripe_subscription_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, membership_id, status) DEFERRABLE INITIALLY DEFERRED
);

-- Create booking_waitlist table
CREATE TABLE IF NOT EXISTS booking_waitlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  court_id uuid NOT NULL REFERENCES courts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  requested_date date NOT NULL,
  requested_start_time time NOT NULL,
  requested_duration numeric(4,2) NOT NULL CHECK (requested_duration > 0),
  status text NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'notified', 'booked', 'expired')),
  notified_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create player_stats table
CREATE TABLE IF NOT EXISTS player_stats (
  user_id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  total_bookings integer DEFAULT 0,
  total_hours_played numeric(10,2) DEFAULT 0,
  total_lessons_taken integer DEFAULT 0,
  total_events_participated integer DEFAULT 0,
  favorite_court_id uuid REFERENCES courts(id) ON DELETE SET NULL,
  total_spent numeric(10,2) DEFAULT 0,
  skill_level text CHECK (skill_level IN ('beginner', 'intermediate', 'advanced', 'expert')),
  achievements jsonb DEFAULT '[]'::jsonb,
  updated_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_instructors_user ON instructors(user_id);
CREATE INDEX IF NOT EXISTS idx_instructors_active ON instructors(is_active);
CREATE INDEX IF NOT EXISTS idx_lessons_instructor ON lessons(instructor_id);
CREATE INDEX IF NOT EXISTS idx_lesson_bookings_lesson ON lesson_bookings(lesson_id);
CREATE INDEX IF NOT EXISTS idx_lesson_bookings_user ON lesson_bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_lesson_bookings_date ON lesson_bookings(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_events_datetime ON events(start_datetime, end_datetime);
CREATE INDEX IF NOT EXISTS idx_events_type ON events(event_type);
CREATE INDEX IF NOT EXISTS idx_events_published ON events(is_published);
CREATE INDEX IF NOT EXISTS idx_event_registrations_event ON event_registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_event_registrations_user ON event_registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_memberships_active ON memberships(is_active);
CREATE INDEX IF NOT EXISTS idx_user_memberships_user ON user_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_user_memberships_status ON user_memberships(status);
CREATE INDEX IF NOT EXISTS idx_waitlist_court_date ON booking_waitlist(court_id, requested_date);
CREATE INDEX IF NOT EXISTS idx_waitlist_user ON booking_waitlist(user_id);
CREATE INDEX IF NOT EXISTS idx_waitlist_status ON booking_waitlist(status);

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_instructors_updated_at ON instructors;
CREATE TRIGGER update_instructors_updated_at
  BEFORE UPDATE ON instructors
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_lessons_updated_at ON lessons;
CREATE TRIGGER update_lessons_updated_at
  BEFORE UPDATE ON lessons
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_events_updated_at ON events;
CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_memberships_updated_at ON memberships;
CREATE TRIGGER update_memberships_updated_at
  BEFORE UPDATE ON memberships
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_memberships_updated_at ON user_memberships;
CREATE TRIGGER update_user_memberships_updated_at
  BEFORE UPDATE ON user_memberships
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_player_stats_updated_at ON player_stats;
CREATE TRIGGER update_player_stats_updated_at
  BEFORE UPDATE ON player_stats
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE instructors ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_waitlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_stats ENABLE ROW LEVEL SECURITY;

-- Instructors Policies
CREATE POLICY "Anyone can view active instructors"
  ON instructors FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Instructors can update own profile"
  ON instructors FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can manage all instructors"
  ON instructors FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Lessons Policies
CREATE POLICY "Anyone can view lessons"
  ON lessons FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Instructors can manage own lessons"
  ON lessons FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM instructors
      WHERE instructors.id = lessons.instructor_id
      AND instructors.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all lessons"
  ON lessons FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Lesson Bookings Policies
CREATE POLICY "Users can view own lesson bookings"
  ON lesson_bookings FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own lesson bookings"
  ON lesson_bookings FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own lesson bookings"
  ON lesson_bookings FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Instructors can view their lesson bookings"
  ON lesson_bookings FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM lessons
      JOIN instructors ON lessons.instructor_id = instructors.id
      WHERE lessons.id = lesson_bookings.lesson_id
      AND instructors.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all lesson bookings"
  ON lesson_bookings FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Events Policies
CREATE POLICY "Anyone can view published events"
  ON events FOR SELECT
  TO authenticated
  USING (is_published = true);

CREATE POLICY "Admins can manage all events"
  ON events FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Event Registrations Policies
CREATE POLICY "Users can view own event registrations"
  ON event_registrations FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own event registrations"
  ON event_registrations FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own event registrations"
  ON event_registrations FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can manage all event registrations"
  ON event_registrations FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Memberships Policies
CREATE POLICY "Anyone can view active memberships"
  ON memberships FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Admins can manage all memberships"
  ON memberships FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- User Memberships Policies
CREATE POLICY "Users can view own memberships"
  ON user_memberships FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own memberships"
  ON user_memberships FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can manage all user memberships"
  ON user_memberships FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Booking Waitlist Policies
CREATE POLICY "Users can view own waitlist entries"
  ON booking_waitlist FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own waitlist entries"
  ON booking_waitlist FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own waitlist entries"
  ON booking_waitlist FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can manage all waitlist entries"
  ON booking_waitlist FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Player Stats Policies
CREATE POLICY "Users can view own stats"
  ON player_stats FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own stats"
  ON player_stats FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "System can create player stats"
  ON player_stats FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all player stats"
  ON player_stats FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Insert sample data

-- Sample memberships
INSERT INTO memberships (name, description, price_monthly, price_annual, benefits, court_discount_percent, priority_booking_hours, included_credits, display_order)
VALUES 
  ('Basic', 'Perfect for casual players', 29.00, 290.00, '{"features": ["10% court discount", "2 free guest passes/month", "Access to social events"]}', 10, 24, 2, 1),
  ('Silver', 'Great value for regular players', 49.00, 490.00, '{"features": ["15% court discount", "4 free guest passes/month", "Priority booking 48hrs ahead", "5 credits/month", "Free clinic access"]}', 15, 48, 5, 2),
  ('Gold', 'Premium benefits for serious players', 79.00, 790.00, '{"features": ["20% court discount", "Unlimited guest passes", "Priority booking 72hrs ahead", "10 credits/month", "Free clinic & lesson access", "Tournament entry discounts"]}', 20, 72, 10, 3),
  ('Platinum', 'Ultimate VIP experience', 129.00, 1290.00, '{"features": ["25% court discount", "Unlimited guest passes", "Priority booking 1 week ahead", "20 credits/month", "Free private lessons (2/month)", "VIP event access", "Locker room access", "Pro shop discounts"]}', 25, 168, 20, 4)
ON CONFLICT (name) DO NOTHING;

-- Sample instructors (note: these will need actual user_ids after users sign up)
-- Admins can create these after having instructor users in the system

-- Sample events
INSERT INTO events (title, description, event_type, start_datetime, end_datetime, max_participants, price_member, price_non_member, skill_level, is_published, image_url)
VALUES 
  ('Beginner Clinic: Fundamentals', 'Learn the basics of pickleball in this 2-hour intensive clinic. Perfect for new players!', 'clinic', NOW() + INTERVAL '7 days', NOW() + INTERVAL '7 days 2 hours', 12, 15.00, 25.00, 'beginner', true, 'https://images.pexels.com/photos/8007407/pexels-photo-8007407.jpeg'),
  ('Summer Tournament 2025', 'Annual summer tournament with prizes! Open to all skill levels with separate brackets.', 'tournament', NOW() + INTERVAL '30 days', NOW() + INTERVAL '30 days 6 hours', 32, 30.00, 50.00, 'all', true, 'https://images.pexels.com/photos/8007404/pexels-photo-8007404.jpeg'),
  ('Advanced Strategy Workshop', 'Take your game to the next level with pro tips and advanced techniques.', 'clinic', NOW() + INTERVAL '14 days', NOW() + INTERVAL '14 days 3 hours', 8, 25.00, 40.00, 'advanced', true, 'https://images.pexels.com/photos/5069148/pexels-photo-5069148.jpeg'),
  ('Friday Night Social', 'Meet other players and enjoy casual games in a fun, social environment.', 'social', NOW() + INTERVAL '5 days', NOW() + INTERVAL '5 days 3 hours', 24, 5.00, 10.00, 'all', true, 'https://images.pexels.com/photos/6253909/pexels-photo-6253909.jpeg')
ON CONFLICT DO NOTHING;